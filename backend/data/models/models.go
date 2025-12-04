// Package models contains all database models for the Pondcala game
package models

// This file serves as the main entry point for the models package
// Import this package to access all model structs

import "time"

// Example usage:
// import "path/to/backend/data/models"
//
// Auto-migrate all models:
// db.AutoMigrate(&models.User{}, &models.Game{}, &models.GameTurn{},
//                &models.GameChat{}, &models.LobbyChat{}, &models.UserStats{})

// GetCurrentTimestamp returns the current time.Time value.
// Exported so other packages (dbmethods, business, service) can use it.
func GetCurrentTimestamp() time.Time {
	return time.Now()
}
