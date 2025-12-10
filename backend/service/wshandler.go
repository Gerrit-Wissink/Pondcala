package service

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"backend/business"
	"backend/data/models"

	"github.com/gorilla/websocket"
	"github.com/lib/pq"
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

type GameChatMessage struct {
	Message string `json:"message"`
	Time    string `json:"time"`
	Author  uint   `json:"author"`
	Players []uint `json:"players"`
	GameID  uint   `json:"gameID"`
}

type LobbyInviteMessage struct {
	Sender    uint   `json:"sender"`
	Recipient uint   `json:"recipient"`
	SentAt    string `json:"sentAt"`
	Status    string `json:"status"` // e.g., "sent", "accepted", "declined", "timeout"
}

type GameTurnMessage struct {
	GameID        uint   `json:"gameID"`
	TurnTaker     uint   `json:"turnTaker"`
	SelectedIndex int    `json:"selectedIndex"`
	HostPools     []int  `json:"hostPools"`
	OppPools      []int  `json:"opponentPools"`
	Players       []uint `json:"players"`
	UserScore     int    `json:"userScore"`
}

type GameCreatedMessage struct {
	GameID  uint   `json:"gameId"`
	Players []uint `json:"players"`
	Time    string `json:"time"`
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
	GameID        uint  `json:"gameID,omitempty"`
	TurnTaker     uint  `json:"turnTaker,omitempty"`
	SelectedIndex int   `json:"selectedIndex,omitempty"`
	HostPools     []int `json:"hostPools,omitempty"`
	OppPools      []int `json:"opponentPools,omitempty"`
	UserScore     int   `json:"userScore,omitempty"`
	HostScore     int   `json:"hostScore,omitempty"`
	OpponentScore int   `json:"opponentScore,omitempty"`
	WhoseTurn     uint  `json:"whoseTurn,omitempty"`

	// invitation-specific fields
	Sender    uint   `json:"sender,omitempty"`
	Recipient uint   `json:"recipient,omitempty"`
	SentAt    string `json:"sentAt,omitempty"`
	Status    string `json:"status,omitempty"` // e.g., "sent", "accepted", "declined", "timeout"

	// game-end specific fields
	Winner uint   `json:"winner,omitempty"`
	Reason string `json:"reason,omitempty"` // "Win" or "Forfeit"
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
			// Only set userID to 0 if not already set (e.g., from ChatHandler)
			if _, exists := h.clients[client]; !exists {
				h.clients[client] = 0
			}
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
			if userID, ok := h.clients[client]; ok {
				// Set user offline when they disconnect
				if userID != 0 {
					if err := business.UpdateUserOnlineStatus(userID, false); err != nil {
						log.Printf("Error setting user %d offline: %v", userID, err)
					}
				}
				delete(h.clients, client)
				client.Close()
			}
			h.mu.Unlock()

		// A client sent a message to broadcast (or direct) to other clients.
		case inc := <-h.broadcast:
			// Route based on message type.
			switch inc.Type {
			case "ping":
				// Ping message to keep connection alive - no need to broadcast or respond
				log.Println("Received ping from client")
				continue

			case "invite":
				// Invitations: when status == "sent" treat as creation and forward to recipient only.
				// For status updates (accepted/declined/timeout) broadcast to both sender and recipient.

				// Determine canonical sender/recipient (clients may send Author or Sender)
				sender := inc.Sender
				if sender == 0 {
					sender = inc.Author
				}
				recipient := inc.Recipient

				// If this is a new invite, schedule a timeout that will mark it as timed out
				if strings.ToLower(inc.Status) == "sent" {
					// Broadcast to recipient only
					targets := map[uint]struct{}{recipient: {}}

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
							log.Printf("Error sending invite to recipient: %v", err)
							c.Close()
							h.unregister <- c
						}
					}

					// Schedule timeout (e.g., 30s). If invite still pending, send a timeout update.
					go func(s, r uint, sentAt string) {
						// configurable timeout
						timeout := 120 * time.Second
						time.Sleep(timeout)

						// Emit a timeout update for this invitation
						out := IncomingMessage{
							Type:      "invite",
							Sender:    s,
							Recipient: r,
							SentAt:    sentAt,
							Status:    "timeout",
						}
						h.broadcast <- out
					}(sender, recipient, inc.SentAt)

					// Optionally persist invitations in DB here if desired
					continue
				}

				// For updates (accepted/declined/timeout), notify both parties
				targets := map[uint]struct{}{}
				if sender != 0 {
					targets[sender] = struct{}{}
				}
				if recipient != 0 {
					targets[recipient] = struct{}{}
				}

				h.mu.RLock()
				conns := make([]*websocket.Conn, 0)
				for c, uid := range h.clients {
					if _, ok := targets[uid]; ok {
						conns = append(conns, c)
					}
				}
				h.mu.RUnlock()

				// If accepted, create a new game and broadcast a game-created message
				if strings.ToLower(inc.Status) == "accepted" {
					// Create game where sender is host and recipient is opponent
					if sender != 0 && recipient != 0 {
						game, _, err := business.CreateGame(sender, recipient)
						if err != nil {
							log.Printf("Error creating game on invite accept: %v", err)
						} else {
							// Send game-created message to both players
							gameCreatedMsg := GameCreatedMessage{
								GameID:  game.ID,
								Players: []uint{sender, recipient},
								Time:    time.Now().Format(time.RFC3339),
							}

							gameCreatedJSON := map[string]interface{}{
								"type":    "game-created",
								"gameId":  gameCreatedMsg.GameID,
								"players": gameCreatedMsg.Players,
								"time":    gameCreatedMsg.Time,
							}

							for _, c := range conns {
								if err := c.WriteJSON(gameCreatedJSON); err != nil {
									log.Printf("Error sending game-created message: %v", err)
								}
							}
						}
					}
				}

				for _, c := range conns {
					if err := c.WriteJSON(inc); err != nil {
						log.Printf("Error broadcasting invite update: %v", err)
						c.Close()
						h.unregister <- c
					}
				}

				continue
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

				// Persist lobby message (do DB work outside lock)
				if _, err := business.SaveGameMessage(inc.GameID, inc.Author, inc.Message); err != nil {
					log.Printf("Error saving message to database: %v", err)
				}

				for _, c := range conns {
					if err := c.WriteJSON(inc); err != nil {
						log.Printf("Error routing game-msg: %v", err)
						c.Close()
						h.unregister <- c
					}
				}

			case "game-turn":
				// game-turn: process turn server-side first, then route to players

				// Process the turn through business logic
				gameTurn, err := business.ProcessTurn(
					inc.GameID,
					inc.TurnTaker,
					inc.SelectedIndex,
					inc.HostPools,
					inc.OppPools,
					inc.UserScore,
				)
				if err != nil {
					log.Printf("Error processing turn via WebSocket: %v", err)
					// TODO: Send error back to sender
					continue
				}

				// Get whose turn it is now
				whoseTurn, err := business.FetchWhoseTurnItIs(inc.GameID)
				if err != nil {
					log.Printf("Error fetching whose turn: %v", err)
					// Continue anyway, client can fetch this separately
				} else {
					inc.WhoseTurn = whoseTurn
				}

				// Update message with validated turn data
				inc.HostPools = convertInt64SliceToInt(gameTurn.HostPonds)
				inc.OppPools = convertInt64SliceToInt(gameTurn.OpponentPonds)
				inc.HostScore = gameTurn.HostScore
				inc.OpponentScore = gameTurn.OpponentScore

				// Route to all players in the game
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

				// After sending the turn, check if the game has ended
				// (i.e., one side's ponds are all empty)
				hostEmpty := true
				for _, stones := range gameTurn.HostPonds {
					if stones > 0 {
						hostEmpty = false
						break
					}
				}

				opponentEmpty := true
				for _, stones := range gameTurn.OpponentPonds {
					if stones > 0 {
						opponentEmpty = false
						break
					}
				}

				// If game has ended, calculate final scores and broadcast game-end message
				if hostEmpty || opponentEmpty {
					finalHostScore, finalOpponentScore, err := business.DetermineEndOfGameScores(inc.GameID)
					if err != nil {
						log.Printf("Error determining end of game scores: %v", err)
					} else {
						// Update game with winner
						game, err := business.FetchGameByID(inc.GameID)
						if err != nil {
							log.Printf("Error fetching game for end game: %v", err)
						} else {
							var winnerID uint
							var loserID uint
							if finalHostScore > finalOpponentScore {
								winnerID = game.HostID
								loserID = game.OpponentID
							} else if finalOpponentScore > finalHostScore {
								winnerID = game.OpponentID
								loserID = game.HostID
							} else {
								// Tie - could set to 0 or handle differently
								winnerID = 0
								loserID = 0
							}

							// Update game winner in database with the actual winner based on score
							if err := business.HandleGameEnd(gameTurn.GameID, winnerID, loserID, "win"); err != nil {
								log.Printf("Error updating game winner: %v", err)
							}

							// Send game-end message to both players
							gameEndMsg := IncomingMessage{
								Type:          "game-end",
								GameID:        inc.GameID,
								Players:       inc.Players,
								HostScore:     finalHostScore,
								OpponentScore: finalOpponentScore,
								Winner:        winnerID,
							}

							// Route to all players in the game
							h.mu.RLock()
							endConns := make([]*websocket.Conn, 0)
							for c, uid := range h.clients {
								if _, ok := targets[uid]; ok {
									endConns = append(endConns, c)
								}
							}
							h.mu.RUnlock()

							for _, c := range endConns {
								if err := c.WriteJSON(gameEndMsg); err != nil {
									log.Printf("Error routing game-end: %v", err)
									c.Close()
									h.unregister <- c
								}
							}
						}
					}
				}

			case "game-created":
				// game-created: notify both players that a game has been created
				game, _, err := business.CreateGame(inc.Players[0], inc.Players[1])
				if err != nil {
					log.Printf("Error creating new game: %v", err)
					continue
				}
				inc.GameID = game.ID

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
						log.Printf("Error routing game-created: %v", err)
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

	// Get user from session token and set them online
	session := GetSessionFromContext(r)
	var userID uint = 0
	if session != nil {
		userID = session.UserID
		// Set user online when they connect
		if err := business.UpdateUserOnlineStatus(userID, true); err != nil {
			log.Printf("Error setting user %d online on connect: %v", userID, err)
		}
		// Associate this connection with the user ID immediately
		Hub.mu.Lock()
		Hub.clients[conn] = userID
		Hub.mu.Unlock()
	}

	Hub.register <- conn

	// The defer keyword delays execution of the function until the surrounding
	// function (ChatHandler) returns. Here, it ensures that the client is
	// unregistered from the hub when this function exits (e.g., on error or close)
	// and that resources are cleaned up.
	defer func() {
		Hub.unregister <- conn
		// Set user offline when they disconnect
		if userID != 0 {
			if err := business.UpdateUserOnlineStatus(userID, false); err != nil {
				log.Printf("Error setting user %d offline on disconnect: %v", userID, err)
			}
		}
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
		// Also verify that the claimed userID matches the session's userID
		huid := uint(0)
		if inc.Author != 0 {
			huid = inc.Author
		} else if inc.TurnTaker != 0 {
			huid = inc.TurnTaker
		} else if inc.Sender != 0 {
			// For invite messages with status "accepted" or "declined", the Sender field
			// refers to the original sender, not the current message sender (the recipient).
			// Skip validation for these cases.
			inviteStatus := strings.ToLower(inc.Status)
			if inc.Type != "invite" || inviteStatus == "sent" {
				huid = inc.Sender
			}
		}

		// Verify that the claimed userID matches the session's userID
		if huid != 0 && userID != 0 && huid != userID {
			log.Printf("UserID mismatch: session has userID %d but message claims %d", userID, huid)
			// Send error message back to client
			errorMsg := IncomingMessage{
				Type:    "error",
				Message: "Authentication error: user ID mismatch",
			}
			conn.WriteJSON(errorMsg)
			continue // Skip processing this message
		}

		if huid != 0 {
			Hub.mu.Lock()
			// Check if this is a new user association (not already set)
			currentUID := Hub.clients[conn]
			if currentUID != huid {
				Hub.clients[conn] = huid
				// Set user online when they first send a message with their ID
				if err := business.UpdateUserOnlineStatus(huid, true); err != nil {
					log.Printf("Error setting user %d online: %v", huid, err)
				}
			}
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

// Helper function for converting pq.Int64Array to []int
func convertInt64SliceToInt(slice pq.Int64Array) []int {
	result := make([]int, len(slice))
	for i, v := range slice {
		result[i] = int(v)
	}
	return result
}
