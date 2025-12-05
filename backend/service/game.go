package service

import (
	"encoding/json"
	"net/http"
	"strconv"

	// "strconv"
	"github.com/Gerrit-Wissink/Pondcala/backend/business"
	"github.com/Gerrit-Wissink/Pondcala/backend/data/models"
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
		HostScore     int   `json:"host_score,omitempty"`
		OpponentScore int   `json:"opponent_score,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON payload: "+err.Error())
		return
	}

	// Call business logic
	gameTurn, gameState, err := business.ProcessTurn(request.GameID, request.UserID, request.SelectedIndex, request.HostPonds, request.OpponentPonds, request.HostScore, request.OpponentScore)
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

	// Success response using inline struct
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success   bool             `json:"success"`
		Message   string           `json:"message"`
		GameTurn  *models.GameTurn `json:"game_turn,omitempty"`
		GameState *models.Game     `json:"game_state,omitempty"`
	}{
		Success:   true,
		Message:   "Turn processed successfully",
		GameTurn:  gameTurn,
		GameState: gameState,
	})
}

func getGameState(w http.ResponseWriter, r *http.Request) {
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
	game, err := business.FetchGameStateByID(uint(gameID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch game state: "+err.Error())
		return
	}

	// Success response using inline struct
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success   bool         `json:"success"`
		GameState *models.Game `json:"game_state,omitempty"`
	}{
		Success:   true,
		GameState: game,
	})
}
