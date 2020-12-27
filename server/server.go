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
)

// TYPES
type Game struct {
  GameId string `json:"gameId"`
  GameState int `json:"gameState"`
  NumPlayers int `json:"numPlayers"`
  Board string `json:"board,omitempty"`
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
      data = Game{
        GameId: candidate,
        GameState: 0,
        NumPlayers: 0,
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

  if data.NumPlayers < 2 {
    if err := ref.Update(ctx, map[string]interface{}{
      "numPlayers": data.NumPlayers+1,
    }); err != nil {
      log.Fatalln("Error updating child:", err)
    }
  }

  data.NumPlayers += 1
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
  router.HandleFunc("/create", handleCreateGame).Methods(http.MethodPost)
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