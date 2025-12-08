package service

import (
	"encoding/json"
	"net/http"
	"strconv"

	"backend/business"
	"backend/data/models"
)

func parseUintParam(s string) (uint64, error) {
	return strconv.ParseUint(s, 10, 64)
}

func GetAllLobbyMessages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use GET")
		return
	}

	messages, err := business.GetAllLobbyMessages()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch users: "+err.Error())
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success  bool               `json:"success"`
		Messages []models.LobbyChat `json:"messages,omitempty"`
	}{
		Success:  true,
		Messages: messages,
	})
}

func GetAllGameMessages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use GET")
		return
	}

	gameIDStr := r.URL.Query().Get("game_id")
	if gameIDStr == "" {
		writeError(w, http.StatusBadRequest, "Missing game_id parameter")
		return
	}

	gameID, err := parseUintParam(gameIDStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid game_id parameter: "+err.Error())
		return
	}

	messages, err := business.GetAllGameMessages(uint(gameID))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch users: "+err.Error())
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success  bool              `json:"success"`
		Messages []models.GameChat `json:"messages,omitempty"`
	}{
		Success:  true,
		Messages: messages,
	})
}
