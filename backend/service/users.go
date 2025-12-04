package service

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/Gerrit-Wissink/Pondcala/backend/business"
	"github.com/Gerrit-Wissink/Pondcala/backend/data/models"
)

func Login(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Origin", "*")

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

	var expiresAt = time.Now().Add(24 * time.Hour)

	_, sessionErr := business.StoreUserToken(token, user, expiresAt)

	if sessionErr != nil {
		writeError(w, http.StatusInternalServerError, sessionErr.Error())
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		Expires:  expiresAt,
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

func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use GET")
		return
	}

	users, err := business.FetchAllUsers()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch users: "+err.Error())
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success bool           `json:"success"`
		Users   []*models.User `json:"users,omitempty"`
	}{
		Success: true,
		Users:   users,
	})
}

// CreateUserHandler handles POST /users to create a new user
func CreateUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use POST")
		return
	}

	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON payload: "+err.Error())
		return
	}

	user, err := business.CreateUser(req.Username, req.Password)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(struct {
		Success bool         `json:"success"`
		User    *models.User `json:"user,omitempty"`
	}{Success: true, User: user})
}

// GetUserHandler handles GET /user?id=<id>
func GetUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use GET")
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		writeError(w, http.StatusBadRequest, "missing id query parameter")
		return
	}

	id64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id: "+err.Error())
		return
	}

	user, err := business.GetUserByID(uint(id64))
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success bool         `json:"success"`
		User    *models.User `json:"user,omitempty"`
	}{Success: true, User: user})
}

// UpdateUserHandler handles PUT /user?id=<id>
func UpdateUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use PUT")
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		writeError(w, http.StatusBadRequest, "missing id query parameter")
		return
	}
	id64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id: "+err.Error())
		return
	}

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON payload: "+err.Error())
		return
	}

	user, err := business.UpdateUser(uint(id64), updates)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success bool         `json:"success"`
		User    *models.User `json:"user,omitempty"`
	}{Success: true, User: user})
}

// DeleteUserHandler handles DELETE /user?id=<id>
func DeleteUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use DELETE")
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		writeError(w, http.StatusBadRequest, "missing id query parameter")
		return
	}
	id64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id: "+err.Error())
		return
	}

	if err := business.DeleteUser(uint(id64)); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success bool `json:"success"`
	}{Success: true})
}

// UpdatePasswordHandler handles POST /user/password
func UpdatePasswordHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use POST")
		return
	}

	var req struct {
		ID          uint   `json:"id"`
		NewPassword string `json:"newPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON payload: "+err.Error())
		return
	}

	if err := business.UpdateUserPassword(req.ID, req.NewPassword); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success bool `json:"success"`
	}{Success: true})
}

// UpdateOnlineStatusHandler handles POST /user/online
func UpdateOnlineStatusHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed. Use POST")
		return
	}

	var req struct {
		ID       uint `json:"id"`
		IsOnline bool `json:"isOnline"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON payload: "+err.Error())
		return
	}

	if err := business.UpdateUserOnlineStatus(req.ID, req.IsOnline); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(struct {
		Success bool `json:"success"`
	}{Success: true})
}
