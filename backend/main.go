package main

import (
	"net/http"

	"backend/service"
)

func main() {
	// Start the chat hub as a background goroutine
	const addr = "localhost:8080"
	go service.Hub.Run()

	// a mux (multiplexer) routes incoming requests to their respective handlers
	mux := http.NewServeMux()

	// Public endpoint (no auth required)
	mux.HandleFunc("/login", service.Login)
	mux.HandleFunc("/createAccount", service.CreateUserHandler) // POST - create new user

	// Protected API endpoints - User management
	mux.HandleFunc("/api/users/token", service.GetUserByTokenHash)             // GET - get user by token hash
	mux.HandleFunc("/api/users", service.GetAllUsers)                          // GET - fetch all users
	mux.HandleFunc("/api/users/online", service.GetAllUsersOnline)             // GET - fetch all online users
	mux.HandleFunc("/api/users/get", service.GetUserHandler)                   // GET - get user by id
	mux.HandleFunc("/api/users/update", service.UpdateUserHandler)             // PUT - update user
	mux.HandleFunc("/api/users/delete", service.DeleteUserHandler)             // DELETE - delete user
	mux.HandleFunc("/api/users/password", service.UpdatePasswordHandler)       // PUT - update password
	mux.HandleFunc("/api/users/set_online", service.UpdateOnlineStatusHandler) // PUT - update online status

	// Protected API endpoints - Chat
	mux.HandleFunc("/api/chat/lobby", service.GetAllLobbyMessages)     // GET - fetch lobby messages
	mux.HandleFunc("/api/chat/game", service.GetAllGameMessages)       // GET - fetch game messages
	mux.HandleFunc("/api/chat/history", service.GetChatHistoryHandler) // GET - fetch chat history
	mux.HandleFunc("/ws/chat", service.ChatHandler)                    // WebSocket - chat connection

	// Protected API endpoints - Game
	mux.HandleFunc("/api/game/turn", service.TakeTurn)                  // POST - take a turn
	mux.HandleFunc("/api/game/state", service.GetGameState)             // GET - get game state
	mux.HandleFunc("/api/game/user-games", service.GetAllGamesByUserID) // GET - fetch all games for a user
	mux.HandleFunc("/api/game/end", service.EndGame)                    // POST - end a game

	// Apply middleware to all routes except login
	mw := service.AuthMiddleware(mux)

	// Serve static files
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	// Use the middleware-wrapped mux for API routes
	http.Handle("/api/", mw)
	http.Handle("/ws/", mw)

	// Start server
	print("Server running on http://" + addr + "\n")
	http.ListenAndServe(addr, nil)
}
