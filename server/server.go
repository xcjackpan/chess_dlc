package main

import (
  "fmt"
  "log"
  "encoding/json"
  "net/http"
  "github.com/gorilla/mux"
  "context"
  firebase "firebase.google.com/go"
  "firebase.google.com/go/db"
  "google.golang.org/api/option"
  "math/rand"
  "time"
  "io/ioutil"
)

// TYPES
type Game struct {
  GameId string `json:"gameId"`
  GameState int `json:"gameState"`
  WaitingFor int `json:"waitingFor"`
  TimesJoined int `json:"timesJoined"`
  Board string `json:"board,omitempty"`
  WhiteDraft string `json:"whiteDraft"`
  BlackDraft string `json:"blackDraft"`
}

type CreateGameBody struct {
  CreatedBy int `json:"createdBy"`
}

type SubmitDraftBody struct {
  Draft string `json:"draft"`
  CurrPlayer int `json:"currPlayer"`
}

// CONSTANTS
const port = "8080"
const databaseUrl = "https://chess-dlc-default-rtdb.firebaseio.com/"
const gameIdLength = 8
const clientIdLength = 4
var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

// GLOBAL VARS
var dbClient *db.Client
var hubMap map[string]*Hub

// HELPERS
func enableCors(w *http.ResponseWriter) {
  (*w).Header().Set("Access-Control-Allow-Origin", "*")
  (*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
  (*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}

func randStringRunes(n int) string {
  rand.Seed(time.Now().UnixNano())
  b := make([]rune, n)
  for i := range b {
      b[i] = letterRunes[rand.Intn(len(letterRunes))]
  }
  return string(b)
}

func createBoardFromDrafts(whiteDraft string, blackDraft string) string {
  // Constructs a board in stringified-JSON from a whiteDraft and blackDraft
  stringifiedBoard := `{"boardState":[`+blackDraft+ `,["{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}"],["{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}"],["{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}"],["{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}","{\"type\":0}"],`+whiteDraft+ `],"currTurn":1}`
  
  return stringifiedBoard
}

// SANDBOX
func handleRoot(w http.ResponseWriter, r *http.Request) {
  enableCors(&w)
  fmt.Fprintf(w, "root")
}

func handleCreateGame(w http.ResponseWriter, r *http.Request) {
  // Initially called to create the game in the backend
  enableCors(&w)
  if r.Method == http.MethodOptions {
    return
  }

  ctx := context.Background()
  var candidate string
  var data Game

  for {
    // 1. Generate an ID
    candidate = randStringRunes(gameIdLength)

    ref := dbClient.NewRef("game/" + candidate)

    // 2. Read the ID from the database
    if err := ref.Get(ctx, &data); err != nil {
      log.Fatalln("Error reading from database:", err)
    }

    // 3. If ID is unused, set it and break. Otherwise, retry
    if data.GameId == "" {
      var requestBody CreateGameBody
      parsed, err := ioutil.ReadAll(r.Body)
      if err != nil {
        log.Fatalln("Error reading POST body buffer:", err)
      }
      if err := json.Unmarshal(parsed, &requestBody); err != nil {
        log.Fatalln("Error unmarshalling:", err)
      }


      data = Game{
        GameId: candidate,
        GameState: 0,
        WaitingFor: requestBody.CreatedBy,
        TimesJoined: 0,
      }
      ref.Set(ctx, data)
      break
    }
  }

  response, err := json.Marshal(data)
  if err != nil {
    // Json parse error
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }
  // 5. Send back to the client
  fmt.Fprintf(w, string(response))
}

func handleJoinGame(w http.ResponseWriter, r *http.Request) {
  // Called upon loading into the game
  enableCors(&w)
  ctx := context.Background()

  vars := mux.Vars(r)
  gameId := vars["gameId"]

  ref := dbClient.NewRef("game/" + gameId)

  // 1. Check if the game exists
  var data Game
  if err := ref.Get(ctx, &data); (err != nil || data.GameId == "") {
    log.Fatalln("Error reading from database:", err)
  }

  // 2. If the client has no cookie for the game, then do not join as a player
  cookiePresent := r.URL.Query()["cookiePresent"]
  if cookiePresent[0] == "false" {
    gameState := data.GameState
    if data.TimesJoined == 1 {
      // If we already have one player, we are about to have another
      gameState = 1
    }
    if err := ref.Update(ctx, map[string]interface{}{
      "waitingFor": (-1*data.WaitingFor),
      "timesJoined": data.TimesJoined+1,
      "gameState": gameState,
    }); err != nil {
      log.Fatalln("Error updating child:", err)
    }
    data.TimesJoined += 1
    data.GameState = gameState
  }

  response, err := json.Marshal(data)
  if err != nil {
    // Json parse error
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }
  fmt.Fprintf(w, string(response))
}

func handleSubmitDraft(w http.ResponseWriter, r *http.Request) {
  enableCors(&w)
  if r.Method == http.MethodOptions {
    return
  }

  // 1. Get information from the initial request
  var requestBody SubmitDraftBody
  parsed, err := ioutil.ReadAll(r.Body)
  if err != nil {
    log.Fatalln("Error reading POST body buffer:", err)
  }
  if err := json.Unmarshal(parsed, &requestBody); err != nil {
    log.Fatalln("Error unmarshalling:", err)
  }

  ctx := context.Background()

  vars := mux.Vars(r)
  gameId := vars["gameId"]

  ref := dbClient.NewRef("game/" + gameId)

  // 2. Record the draft boards. Note: We could do an optimization here in the logic
  // to avoid an extra read but it makes the code real messy
  if requestBody.CurrPlayer == 1 {
    if err := ref.Update(ctx, map[string]interface{}{
      "whiteDraft": requestBody.Draft,
    }); err != nil {
      log.Fatalln("Error updating child:", err)
    }
  } else if requestBody.CurrPlayer == -1 {
    if err := ref.Update(ctx, map[string]interface{}{
      "blackDraft": requestBody.Draft,
    }); err != nil {
      log.Fatalln("Error updating child:", err)
    }
  }

  // 3. Get the game record
  var data Game
  if err := ref.Get(ctx, &data); (err != nil || data.GameId == "") {
    log.Fatalln("Error reading from database:", err)
  }

  if data.WhiteDraft != "" && data.BlackDraft != "" {
    // 4. We have a draft by both players, set up the board
    stringifiedBoard := createBoardFromDrafts(data.WhiteDraft, data.BlackDraft)
    
    if err := ref.Update(ctx, map[string]interface{}{
      "blackDraft": "",
      "whiteDraft": "",
      "board": stringifiedBoard,
      "gameState": 2,
    }); err != nil {
      log.Fatalln("Error updating child:", err)
    }

    // 5. Pump the board into the hub for the clients once draft is over
    var hub *Hub
    if hubMap[gameId] == nil {
      log.Fatalln("Missing hub for game" + gameId)
    } else {
      hub = hubMap[gameId]
    }
  
		message := Message{
			sender: "#",
			message: []byte(stringifiedBoard),
		}
    hub.broadcast <- message
  }
}

func handleWebsocket(w http.ResponseWriter, r *http.Request) {
  enableCors(&w)
  vars := mux.Vars(r)
  gameId := vars["gameId"]
  
  // 1. Upgrade the websocket connection
  upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
  }

  // 2. If we have a hub for the game already, use it. Otherwise, make one.
  var hub *Hub
  if hubMap[gameId] == nil {
    // Create a new hub for the game
    hub = newHub(gameId, dbClient)
    hubMap[gameId] = hub

    go hub.run()
  } else {
    hub = hubMap[gameId]
  }

  // 3. Generate a new client and register it
  candidate := ""
  ok := true
  for ok {
    candidate = randStringRunes(clientIdLength)
    _, ok = hub.clients[candidate] 
  }

  client := &Client{
    clientId: gameId+"-"+candidate,
    hub: hub,
    conn: conn,
    send: make(chan []byte, 256),
  }
  client.hub.register <- client

  // Allow collection of memory referenced by the caller by doing all work in
  // new goroutines.
  go client.writePump()
  go client.readPump()
}

func handleRequests() {
  // creates a new instance of a mux router
  router := mux.NewRouter().StrictSlash(true)

  router.HandleFunc("/", handleRoot).Methods(http.MethodGet, http.MethodPut, http.MethodPatch, http.MethodOptions)
  router.HandleFunc("/create", handleCreateGame).Methods(http.MethodPost, http.MethodOptions)
  router.HandleFunc("/join/{gameId}", handleJoinGame).Methods(http.MethodGet)
  router.HandleFunc("/draft/{gameId}", handleSubmitDraft).Methods(http.MethodPost,  http.MethodOptions)

  router.HandleFunc("/websocket/{gameId}", handleWebsocket)

  log.Fatal(http.ListenAndServe(":"+port, router))
}

func main() {
  fmt.Println("Server starting on port:" + port)

  ctx := context.Background()
  app, err := firebase.NewApp(
    ctx,
    &firebase.Config{
      DatabaseURL: databaseUrl,
    },
    option.WithCredentialsFile("firebase_auth.json"),
  )
  if err != nil {
    log.Fatalln("Error initializing app:", err)
  }
  dbClient, err = app.Database(ctx)
  if err != nil {
    log.Fatalln("Error initializing database client:", err)
  }

  hubMap = make(map[string]*Hub)

  handleRequests()
}