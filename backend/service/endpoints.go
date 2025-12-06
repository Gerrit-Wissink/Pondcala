package service

import (
	"net/http"
)

func main() {
	// Start the chat hub as a background goroutine
	go Hub.Run()

	// a mux (multiplexer) routes incoming requests to their respective handlers
	mux := http.NewServeMux()

	// Public endpoint (no auth required)
	mux.HandleFunc("/login", Login)
	mux.HandleFunc("/createAccount", CreateUserHandler) // POST - create new user

	// Protected API endpoints - User management
	mux.HandleFunc("/api/users/token", GetUserByTokenHash)             // GET - get user by token hash
	mux.HandleFunc("/api/users", GetAllUsers)                          // GET - fetch all users
	mux.HandleFunc("/api/users/online", GetAllUsersOnline)             // GET - fetch all online users
	mux.HandleFunc("/api/users/get", GetUserHandler)                   // GET - get user by id
	mux.HandleFunc("/api/users/update", UpdateUserHandler)             // PUT - update user
	mux.HandleFunc("/api/users/delete", DeleteUserHandler)             // DELETE - delete user
	mux.HandleFunc("/api/users/password", UpdatePasswordHandler)       // PUT - update password
	mux.HandleFunc("/api/users/set_online", UpdateOnlineStatusHandler) // PUT - update online status

	// Protected API endpoints - Chat
	mux.HandleFunc("/api/chat/lobby", GetAllLobbyMessages)     // GET - fetch lobby messages
	mux.HandleFunc("/api/chat/game", GetAllGameMessages)       // GET - fetch game messages
	mux.HandleFunc("/api/chat/history", GetChatHistoryHandler) // GET - fetch chat history
	mux.HandleFunc("/ws/chat", ChatHandler)                    // WebSocket - chat connection

	// Protected API endpoints - Game
	mux.HandleFunc("/api/game/turn", TakeTurn)                  // POST - take a turn
	mux.HandleFunc("/api/game/state", getGameState)             // GET - get game state
	mux.HandleFunc("/api/game/user-games", GetAllGamesByUserID) // GET - fetch all games for a user

	// Apply middleware to all routes except login
	mw := AuthMiddleware(mux)

	// Serve static files
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	// Use the middleware-wrapped mux for API routes
	http.Handle("/api/", mw)
	http.Handle("/ws/", mw)

	// Start server
	http.ListenAndServe("localhost:8080", nil)
}
