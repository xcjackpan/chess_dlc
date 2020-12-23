package main

import (
  "fmt"
  "log"
  "net/http"
  "github.com/gorilla/mux"
)

const port = "8080"

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
}

func handleRequests() {
  // creates a new instance of a mux router
  router := mux.NewRouter().StrictSlash(true)

  router.HandleFunc("/", handleRoot).Methods(http.MethodGet, http.MethodPut, http.MethodPatch, http.MethodOptions)
  router.HandleFunc("/create", handleCreate).Methods(http.MethodGet, http.MethodPut, http.MethodPatch, http.MethodOptions)

  log.Fatal(http.ListenAndServe(":"+port, router))
}

func main() {
  fmt.Println("Server starting on port:" + port)
  handleRequests()
}