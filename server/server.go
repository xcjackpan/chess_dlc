package main

import (
  "fmt"
  "log"
  "net/http"
  "github.com/gorilla/mux"
  "context"
  firebase "firebase.google.com/go"
  "google.golang.org/api/option"
)

const port = "8080"
const databaseUrl = "https://chess-dlc-default-rtdb.firebaseio.com/"

func enableCors(w *http.ResponseWriter) {
  (*w).Header().Set("Access-Control-Allow-Origin", "*")
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
  enableCors(&w)
  fmt.Fprintf(w, "root")
}

func handleCreate(w http.ResponseWriter, r *http.Request) {
  enableCors(&w)
  fmt.Fprintf(w, "create")

  // Initially called to create the game in the backend
  // 1. Generates an unused ID
  // 2. Sends it back to the client
  // 3. Creates a record of the game in Redis
}

func handleRequests() {
  // creates a new instance of a mux router
  router := mux.NewRouter().StrictSlash(true)

  router.HandleFunc("/", handleRoot).Methods(http.MethodGet, http.MethodPut, http.MethodPatch, http.MethodOptions)
  router.HandleFunc("/create", handleCreate).Methods(http.MethodGet, http.MethodPut, http.MethodPatch, http.MethodOptions)

  log.Fatal(http.ListenAndServe(":"+port, router))
}

func sampleRead() {
  ctx := context.Background()
  conf := &firebase.Config{
    DatabaseURL: databaseUrl,
  }
  // Fetch the service account key JSON file contents
  opt := option.WithCredentialsFile("firebase_auth.json")

  // Initialize the app with a service account, granting admin privileges
  app, err := firebase.NewApp(ctx, conf, opt)
  if err != nil {
    log.Fatalln("Error initializing app:", err)
  }

  client, err := app.Database(ctx)
  if err != nil {
    log.Fatalln("Error initializing database client:", err)
  }

  // As an admin, the app has access to read and write all data, regardless of Security Rules
  ref := client.NewRef("")
  var data map[string]interface{}
  if err := ref.Get(ctx, &data); err != nil {
    log.Fatalln("Error reading from database:", err)
  }
  fmt.Println(data)
}

func main() {
  fmt.Println("Server starting on port:" + port)
  handleRequests()
}