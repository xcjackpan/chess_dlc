// Hub maintains the set of active clients and broadcasts messages to the
// clients.

package main

type Hub struct {
	gameId string

	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub(gameId string) *Hub {
	return &Hub{
		gameId: gameId
		broadcast: make(chan []byte),
		register: make(chan *Client),
		unregister: make(chan *Client),
		clients: make(map[*Client]bool),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			// If it was a register event
			h.clients[client] = true
		case client := <-h.unregister:
			// If it was an unregister event
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			if len(h.clients) == 0 {
				break
			}
		case message := <-h.broadcast:
			// If we need to broadcast
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}