package service

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/Gerrit-Wissink/Pondcala/backend/business"
	"github.com/Gerrit-Wissink/Pondcala/backend/data/models"
	"github.com/gorilla/websocket"
)

// upgrader converts an incoming HTTP request to a WebSocket connection.
// CheckOrigin returns true to allow all origins during local development.
// In production, tighten this to validate r.Origin against allowed hosts.
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for local development
	},
}

// ChatMessage is the payload exchanged over WebSockets.
// It currently carries the raw message text and an ISO timestamp string.
type LobbyChatMessage struct {
	Message string `json:"message"`
	Time    string `json:"time"`
	Author  uint   `json:"author"`
}

// IncomingMessage is a union type that represents the different message
// payloads the client can send. Fields are optional and used depending
// on the `Type` value.
type IncomingMessage struct {
	Type string `json:"type"`

	// lobby-msg / game-msg fields
	Username string `json:"username,omitempty"`
	Message  string `json:"message,omitempty"`
	Time     string `json:"time,omitempty"`
	Author   uint   `json:"author,omitempty"`
	Players  []uint `json:"players,omitempty"`

	// game-turn specific fields
	GameID        uint  `json:"gameId,omitempty"`
	TurnTaker     uint  `json:"turnTaker,omitempty"`
	SelectedIndex int   `json:"selectedIndex,omitempty"`
	HostPools     []int `json:"hostPools,omitempty"`
	OppPools      []int `json:"opponentPools,omitempty"`
}

// ChatHub coordinates all chat activity.
//
// Concurrency model:
// - clients: set of active WebSocket connections (guarded by mu)
// - register/unregister: channels to add/remove clients (serialized by Run loop)
// - broadcast: channel to fan messages out to all connected clients
// - messages: in-memory history; appended to on each broadcast (you'd replace with DB table)
// - mu: protects both clients and messages across goroutines
type ChatHub struct {
	// clients maps a connection to its authenticated userID (0 if unknown)
	clients map[*websocket.Conn]uint
	// broadcast carries generic incoming messages
	broadcast  chan IncomingMessage
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	messages   []IncomingMessage
	mu         sync.RWMutex
}

// Hub is the single global instance used by the server.
var Hub = &ChatHub{
	clients:    make(map[*websocket.Conn]uint),
	broadcast:  make(chan IncomingMessage),
	register:   make(chan *websocket.Conn),
	unregister: make(chan *websocket.Conn),
	messages:   make([]IncomingMessage, 0),
}

// Run is the event loop for the hub. It should be started once (e.g., in main)
// and runs forever, handling client registration, unregistration, and message
// broadcasts. All mutations of hub state happen in this loop (with appropriate
// locking) to avoid data races.
//
// Syntax note: (h *ChatHub) is a "receiver" – it makes Run a method on the ChatHub type.
// This means you call it as Hub.Run() rather than Run(Hub). The 'h' is like 'self' or 'this'
// in other languages, giving the method access to the ChatHub instance's fields.
func (h *ChatHub) Run() {
	for {
		select {

		// A new client has connected.
		//
		// h.register is a channel of *websocket.Conn values; this of it as a message queue.
		// The left arrow means to dequeue a value from that channel when one is available.
		// In this case, it means that a new client has connected.
		case client := <-h.register:
			// The Go Mutex lock ensures that the clients map is safely modified.
			h.mu.Lock()
			// unknown user at registration time; set userID 0 until first inbound message
			h.clients[client] = 0
			// Release the Mutex lock after modification.
			h.mu.Unlock()

			// Send chat history to the new client
			h.mu.RLock()
			for _, msg := range h.messages {
				if err := client.WriteJSON(msg); err != nil {
					log.Printf("Error sending history: %v", err)
				}
			}
			h.mu.RUnlock()

		// A client disconnected or errored.
		//
		// Remove the client from the hub and close the connection.
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				client.Close()
			}
			h.mu.Unlock()

		// A client sent a message to broadcast (or direct) to other clients.
		case inc := <-h.broadcast:
			// Route based on message type.
			switch inc.Type {
			case "lobby-msg":
				// sanitize text and ignore empty messages
				inc.Message = sanitizeMessage(inc.Message)
				if strings.TrimSpace(inc.Message) == "" {
					continue
				}

				// Append to history and snapshot conns
				h.mu.Lock()
				h.messages = append(h.messages, inc)
				conns := make([]*websocket.Conn, 0, len(h.clients))
				for c := range h.clients {
					conns = append(conns, c)
				}
				h.mu.Unlock()

				// Persist lobby message (do DB work outside lock)
				if _, err := business.SaveLobbyMessage(inc.Author, inc.Message); err != nil {
					log.Printf("Error saving message to database: %v", err)
				}

				// Broadcast to all connections (writes performed outside lock)
				for _, c := range conns {
					if err := c.WriteJSON(inc); err != nil {
						log.Printf("Error broadcasting to client: %v", err)
						c.Close()
						// schedule removal
						h.unregister <- c
					}
				}

			case "game-msg":
				// game-msg: only forward to players listed in Players
				inc.Message = sanitizeMessage(inc.Message)
				if strings.TrimSpace(inc.Message) == "" {
					continue
				}

				// Build target set
				targets := make(map[uint]struct{}, len(inc.Players))
				for _, id := range inc.Players {
					targets[id] = struct{}{}
				}

				// Snapshot matching connections
				h.mu.RLock()
				conns := make([]*websocket.Conn, 0)
				for c, uid := range h.clients {
					if _, ok := targets[uid]; ok {
						conns = append(conns, c)
					}
				}
				h.mu.RUnlock()

				for _, c := range conns {
					if err := c.WriteJSON(inc); err != nil {
						log.Printf("Error routing game-msg: %v", err)
						c.Close()
						h.unregister <- c
					}
				}

			case "game-turn":
				// game-turn: similar routing to game-msg, contains game-specific fields
				targets := make(map[uint]struct{}, len(inc.Players))
				for _, id := range inc.Players {
					targets[id] = struct{}{}
				}

				h.mu.RLock()
				conns := make([]*websocket.Conn, 0)
				for c, uid := range h.clients {
					if _, ok := targets[uid]; ok {
						conns = append(conns, c)
					}
				}
				h.mu.RUnlock()

				for _, c := range conns {
					if err := c.WriteJSON(inc); err != nil {
						log.Printf("Error routing game-turn: %v", err)
						c.Close()
						h.unregister <- c
					}
				}

			default:
				log.Printf("Unknown message type: %q", inc.Type)
			}
		}
	}
}

// ChatHandler upgrades the HTTP request to a WebSocket and then pumps
// incoming messages from that client into the hub's broadcast channel.
// Lifecycle:
// 1) Upgrade to WebSocket
// 2) Register client with hub (triggers history replay)
// 3) Loop reading JSON ChatMessage values and forward to hub
// 4) On error/close, unregister client
func ChatHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	Hub.register <- conn

	// The defer keyword delays execution of the function until the surrounding
	// function (ChatHandler) returns. Here, it ensures that the client is
	// unregistered from the hub when this function exits (e.g., on error or close)
	// and that resources are cleaned up.
	defer func() {
		Hub.unregister <- conn
	}()

	for {
		var inc IncomingMessage
		err := conn.ReadJSON(&inc)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// If the incoming message carries an author/turnTaker, associate that userID
		// with this connection so targeted messages can be routed.
		huid := uint(0)
		if inc.Author != 0 {
			huid = inc.Author
		} else if inc.TurnTaker != 0 {
			huid = inc.TurnTaker
		}

		if huid != 0 {
			Hub.mu.Lock()
			Hub.clients[conn] = huid
			Hub.mu.Unlock()
		}

		Hub.broadcast <- inc
	}
}

// GetChatHistoryHandler returns the current in-memory message history as JSON.
// This can be useful for non-WebSocket clients or debugging.
func GetChatHistoryHandler(w http.ResponseWriter, r *http.Request) {
	Hub.mu.RLock()
	messages, err := business.GetAllLobbyMessages()
	if err != nil {
		//makes an empty messages array if there is an error fetching from the database
		messages = make([]models.LobbyChat, 0)
	}
	defer Hub.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}
