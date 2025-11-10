package service

import (
	"encoding/json"
	"net/http"
	// "strconv"
)

// type ErrorResponse struct {
// 	Success   bool   `json:"success"`
// 	Error     string `json:"error,omitempty"`
// }

// writeError writes an error response with optional error details
func writeError(w http.ResponseWriter, status int, errorMessage string) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{
		Success: false,
		Error:   errorMessage,
	})
}
