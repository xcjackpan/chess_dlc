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
}

type CreateGameBody struct {
  CreatedBy int `json:"createdBy"`
}

// CONSTANTS
const port = "8080"
const databaseUrl = "https://chess-dlc-default-rtdb.firebaseio.com/"
const gameIdLength = 8
var letterRunes = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

// GLOBAL VARS
var client *db.Client

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

    ref := client.NewRef("game/" + candidate)

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
  var data Game

  vars := mux.Vars(r)
  gameId := vars["gameId"]

  ref := client.NewRef("game/" + gameId)

  if err := ref.Get(ctx, &data); (err != nil || data.GameId == "") {
    log.Fatalln("Error reading from database:", err)
  }

  if err := ref.Update(ctx, map[string]interface{}{
    "waitingFor": (-1*data.WaitingFor),
    "timesJoined": data.TimesJoined+1,
  }); err != nil {
    log.Fatalln("Error updating child:", err)
  }

  data.TimesJoined += 1
  response, err := json.Marshal(data)
  if err != nil {
    // Json parse error
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
  }
  fmt.Fprintf(w, string(response))
}

func handleRequests() {
  // creates a new instance of a mux router
  router := mux.NewRouter().StrictSlash(true)

  router.HandleFunc("/", handleRoot).Methods(http.MethodGet, http.MethodPut, http.MethodPatch, http.MethodOptions)
  router.HandleFunc("/create", handleCreateGame).Methods(http.MethodPost, http.MethodOptions)
  router.HandleFunc("/join/{gameId}", handleJoinGame).Methods(http.MethodGet)

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
  client, err = app.Database(ctx)
  if err != nil {
    log.Fatalln("Error initializing database client:", err)
  }

  handleRequests()
}