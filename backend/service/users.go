package service

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Gerrit-Wissink/Pondcala/backend/business"
	"github.com/Gerrit-Wissink/Pondcala/backend/data/models"
)

func Login(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5174")

	if r.Method != http.MethodPost {
		//throw error
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use POST")
		return
	}

	var req struct {
		username string
		password string
	}

	//If the program is not able to parse the request body with the expected request struct (JSON is formatted unexpectedly)
	//Then throw error
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON payload: "+err.Error())
		return
	}

	user, err := business.ProcessLogin(req.username, req.password)

	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	token, tokenErr := generateToken()

	if tokenErr != nil {
		writeError(w, http.StatusInternalServerError, tokenErr.Error())
		return
	}
	if token == "" {
		writeError(w, http.StatusInternalServerError, "empty token")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(24 * time.Hour),
	})

	// Success response using inline struct
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success bool         `json:"success"`
		Message string       `json:"message"`
		User    *models.User `json:"user,omitempty"`
	}{
		Success: true,
		Message: "Turn processed successfully",
		User:    user,
	})
}
