package main

import (
	"net/http"

	"backend/data/dbmethods"
	"backend/service"
)

func main() {

	// Initialize database connection
	dbmethods.DbInit()

	// Start the chat hub as a background goroutine
	// const addr = "localhost:8080"
	const addr = "0.0.0.0:8080"
	go service.Hub.Run()

	// Create main router
	mainMux := http.NewServeMux()

	// a mux (multiplexer) routes incoming requests to their respective handlers
	apiMux := http.NewServeMux()

	// Public endpoint (no auth required)
	apiMux.HandleFunc("/login", service.Login)
	apiMux.HandleFunc("/createAccount", service.CreateUserHandler) // POST - create new user

	// Protected API endpoints - User management
	apiMux.HandleFunc("/api/users/token", service.GetUserByTokenHash)             // GET - get user by token hash
	apiMux.HandleFunc("/api/users", service.GetAllUsers)                          // GET - fetch all users
	apiMux.HandleFunc("/api/users/online", service.GetAllUsersOnline)             // GET - fetch all online users
	apiMux.HandleFunc("/api/users/get", service.GetUserHandler)                   // GET - get user by id
	apiMux.HandleFunc("/api/users/update", service.UpdateUserHandler)             // PUT - update user
	apiMux.HandleFunc("/api/users/delete", service.DeleteUserHandler)             // DELETE - delete user
	apiMux.HandleFunc("/api/users/password", service.UpdatePasswordHandler)       // PUT - update password
	apiMux.HandleFunc("/api/users/set_online", service.UpdateOnlineStatusHandler) // PUT - update online status

	// Protected API endpoints - Chat
	apiMux.HandleFunc("/api/chat/lobby", service.GetAllLobbyMessages)     // GET - fetch lobby messages
	apiMux.HandleFunc("/api/chat/game", service.GetAllGameMessages)       // GET - fetch game messages
	apiMux.HandleFunc("/api/chat/history", service.GetChatHistoryHandler) // GET - fetch chat history
	apiMux.HandleFunc("/ws/chat", service.ChatHandler)                    // WebSocket - chat connection

	// Protected API endpoints - Game
	apiMux.HandleFunc("/api/game/turn", service.TakeTurn)                  // POST - take a turn
	apiMux.HandleFunc("/api/game/state", service.GetGameState)             // GET - get game state
	apiMux.HandleFunc("/api/game/user-games", service.GetAllGamesByUserID) // GET - fetch all games for a user
	apiMux.HandleFunc("/api/game/end", service.EndGame)                    // POST - end a game

	// Register routes on main mux
	mainMux.Handle("/login", apiMux)
	mainMux.Handle("/createAccount", apiMux)
	mainMux.Handle("/api/", service.AuthMiddleware(apiMux))
	mainMux.Handle("/ws/", service.AuthMiddleware(apiMux))

	// Serve static files - must be last (least specific)
	fs := http.FileServer(http.Dir("./static"))
	mainMux.Handle("/", fs)

	// Start server
	print("Server running on http://" + addr + "\n")
	http.ListenAndServe(addr, mainMux)
}
