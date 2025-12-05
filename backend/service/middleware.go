package service

import (
	"context"
	"net/http"

	"github.com/Gerrit-Wissink/Pondcala/backend/business"
	"github.com/Gerrit-Wissink/Pondcala/backend/data/models"
)

// contextKey is a custom type to avoid collisions in context keys
type contextKey string

const sessionContextKey contextKey = "session"

// AuthMiddleware validates the session token from the cookie and attaches
// the session to the request context for downstream handlers to use.
// Returns 401 Unauthorized if the token is missing, invalid, or expired.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract session_token cookie
		cookie, err := r.Cookie("session_token")
		if err != nil {
			writeError(w, http.StatusUnauthorized, "Missing session token")
			return
		}

		token := cookie.Value
		if token == "" {
			writeError(w, http.StatusUnauthorized, "Empty session token")
			return
		}

		// Validate token using business layer
		session, err := business.ValidateUserToken(token)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "Invalid or expired session: "+err.Error())
			return
		}

		// Attach session to request context
		ctx := context.WithValue(r.Context(), sessionContextKey, session)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetSessionFromContext retrieves the session from the request context.
// Returns nil if no session is present (e.g., middleware wasn't applied).
func GetSessionFromContext(r *http.Request) *models.Session {
	val := r.Context().Value(sessionContextKey)
	if session, ok := val.(*models.Session); ok {
		return session
	}
	return nil
}
