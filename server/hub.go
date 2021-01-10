// Hub maintains the set of active clients and broadcasts messages to the
// clients.
package main

import (
	"context"
	"log"
	"fmt"

  "firebase.google.com/go/db"
)

type Hub struct {
	gameId string
	dbClient *db.Client

	// Registered clients.
	clients map[string]*Client

	// Inbound messages from the clients.
	broadcast chan Message

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

type Message struct {
	message []byte
	sender string
}

func newHub(gameId string, dbClient *db.Client) *Hub {
	return &Hub{
		gameId: gameId,
		broadcast: make(chan Message),
		register: make(chan *Client),
		unregister: make(chan *Client),
		clients: make(map[string]*Client),
		dbClient: dbClient,
	}
}

func (h *Hub) run(cleanUpHub func(string)) {
	defer cleanUpHub(h.gameId)
  ctx := context.Background()
	for {
		select {
			case client := <-h.register:
				// If it was a register event
				h.clients[client.clientId] = client
			case client := <-h.unregister:
				// If it was an unregister event
				// Remove the hub
				if _, ok := h.clients[client.clientId]; ok {
					delete(h.clients, client.clientId)
					close(client.send)
				}

				if len(h.clients) == 0 {
					return
				}
			case message := <-h.broadcast:
				ref := h.dbClient.NewRef("game/" + h.gameId)
				if err := ref.Update(ctx, map[string]interface{}{
					"board": string(message.message),
				}); err != nil {
					log.Fatalln("Error updating child:", err)
				}

				// If we need to broadcast
				for clientId, client := range h.clients {
					if clientId != message.sender {
						select {
							case client.send <- message.message:
							default:
								close(client.send)
								delete(h.clients, client.clientId)
						}
					}
				}
		}
	}
}