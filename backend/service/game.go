package service

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	// "strconv"
	"backend/business"
	"backend/data/dbmethods"
	"backend/data/models"
)

type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// TakeTurn handles POST /api/games/take-turn
func TakeTurn(w http.ResponseWriter, r *http.Request) {
	// Set response headers
	w.Header().Set("Content-Type", "application/json")

	// Only allow POST method
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use POST")
		return
	}

	// Parse request body using inline struct
	var request struct {
		GameID        uint  `json:"game_id"`
		UserID        uint  `json:"user_id"`
		SelectedIndex int   `json:"selected_index"`
		HostPonds     []int `json:"host_ponds,omitempty"`
		OpponentPonds []int `json:"opponent_ponds,omitempty"`
		UserScore     int   `json:"user_score"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON payload: "+err.Error())
		return
	}

	// Call business logic
	gameTurn, err := business.ProcessTurn(request.GameID, request.UserID, request.SelectedIndex, request.HostPonds, request.OpponentPonds, request.UserScore)
	if err != nil {
		// Determine appropriate HTTP status based on error type
		status := http.StatusInternalServerError
		errorMsg := err.Error()

		// You can add more specific error handling here
		if errorMsg == "game not found" || errorMsg == "user not found" {
			status = http.StatusNotFound
		} else if errorMsg == "not your turn" || errorMsg == "invalid move" {
			status = http.StatusBadRequest
		}

		writeError(w, status, errorMsg)
		return
	}

	// Fetch whose turn it is now through the business layer
	whoseTurn, err := business.FetchWhoseTurnItIs(request.GameID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to determine whose turn it is: "+err.Error())
		return
	}

	// Success response using inline struct
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success   bool             `json:"success"`
		Message   string           `json:"message"`
		GameTurn  *models.GameTurn `json:"game_turn,omitempty"`
		WhoseTurn uint             `json:"whose_turn"`
	}{
		Success:   true,
		Message:   "Turn processed successfully",
		GameTurn:  gameTurn,
		WhoseTurn: whoseTurn,
	})
}

func GetGameState(w http.ResponseWriter, r *http.Request) {
	// Set response headers
	w.Header().Set("Content-Type", "application/json")

	// Only allow GET method
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use GET")
		return
	}

	// Parse query parameters
	gameIDStr := r.URL.Query().Get("game_id")
	if gameIDStr == "" {
		writeError(w, http.StatusBadRequest, "Missing game_id parameter")
		return
	}

	// Convert gameID to uint
	gameID, err := strconv.ParseUint(gameIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid game_id parameter: "+err.Error())
		return
	}

	// Call business logic to fetch game state
	/*
		   GameState:
		   struct {
				WhoseTurn     uint
				Host          models.User
				Opponent      models.User
				HostPonds     []int
				OpponentPonds []int
				HostScore     int
				OpponentScore int
				LastTwoTurns  []models.GameTurn
				TurnNumber    int
				Winner        *uint
			}
	*/
	game, err := business.FetchGameStateByID(uint(gameID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch game state: "+err.Error())
		return
	}

	// Success response using inline struct
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success   bool        `json:"success"`
		GameState interface{} `json:"game_state,omitempty"`
	}{
		Success:   true,
		GameState: game,
	})
}

func GetAllGamesByUserID(w http.ResponseWriter, r *http.Request) {
	// Set response headers
	w.Header().Set("Content-Type", "application/json")

	// Only allow GET method
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use GET")
		return
	}

	// Parse query parameters
	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		writeError(w, http.StatusBadRequest, "Missing user_id parameter")
		return
	}

	// Convert userID to uint
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user_id parameter: "+err.Error())
		return
	}

	// Call business logic to fetch all games for the user
	games, err := business.FetchAllGamesByUserID(uint(userID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch games: "+err.Error())
		return
	}

	// Success response using inline struct
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success bool          `json:"success"`
		Games   []models.Game `json:"games,omitempty"`
	}{
		Success: true,
		Games:   games,
	})
}

func CreateGame(w http.ResponseWriter, r *http.Request) {
	// Set response headers
	w.Header().Set("Content-Type", "application/json")

	// Only allow POST method
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use POST")
		return
	}

	// Parse request body using inline struct
	var request struct {
		HostID     uint `json:"host_id"`
		OpponentID uint `json:"opponent_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON payload: "+err.Error())
		return
	}

	// Call business logic to create the game
	game, initialTurn, err := business.CreateGame(request.HostID, request.OpponentID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create game: "+err.Error())
		return
	}

	// Success response using inline struct
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success     bool             `json:"success"`
		Message     string           `json:"message"`
		Game        *models.Game     `json:"game,omitempty"`
		InitialTurn *models.GameTurn `json:"initial_turn,omitempty"`
	}{
		Success:     true,
		Message:     "Game created successfully",
		Game:        game,
		InitialTurn: initialTurn,
	})
}

func EndGame(w http.ResponseWriter, r *http.Request) {
	// Set response headers
	w.Header().Set("Content-Type", "application/json")

	// Only allow POST method
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use POST")
		return
	}

	// Parse request body using inline struct
	var request struct {
		GameID     uint   `json:"game_id"`
		UserID     uint   `json:"user_id"`
		OpponentID uint   `json:"opponent_id"`
		Reason     string `json:"reason"` // "forfeit" or "win"
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON payload: "+err.Error())
		return
	}

	// Call business logic to handle game end
	err := business.HandleGameEnd(request.GameID, request.UserID, request.OpponentID, request.Reason)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to end game: "+err.Error())
		return
	}

	// Fetch final game state to get scores
	hostScore, opponentScore, err := business.DetermineEndOfGameScores(request.GameID)
	if err != nil {
		log.Printf("Error getting final scores for game-end broadcast: %v", err)
		// Continue anyway, scores might be 0 but game end should still be broadcast
	}

	// Determine winner (opponent wins if forfeit)
	var winnerID uint
	if request.Reason == "forfeit" {
		winnerID = request.OpponentID
	} else {
		// For other reasons, determine by score
		if hostScore > opponentScore {
			game, _ := dbmethods.FetchGameByID(request.GameID)
			if game != nil {
				winnerID = game.HostID
			}
		} else if opponentScore > hostScore {
			game, _ := dbmethods.FetchGameByID(request.GameID)
			if game != nil {
				winnerID = game.OpponentID
			}
		}
	}

	// Broadcast game-end message to both players via WebSocket
	gameEndMsg := IncomingMessage{
		Type:          "game-end",
		GameID:        request.GameID,
		Players:       []uint{request.UserID, request.OpponentID},
		HostScore:     hostScore,
		OpponentScore: opponentScore,
		Winner:        winnerID,
		Reason:        request.Reason,
	}
	Hub.broadcast <- gameEndMsg

	// Success response using inline struct
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
	}{
		Success: true,
		Message: "Game ended successfully",
	})
}
