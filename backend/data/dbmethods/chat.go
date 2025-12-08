package dbmethods

import (
	"fmt"
	"time"

	"github.com/Gerrit-Wissink/Pondcala/backend/data/dbmethods/db"
	"github.com/Gerrit-Wissink/Pondcala/backend/data/models"
)

func FetchAllLobbyMessages() ([]models.LobbyChat, error) {
	var messages []models.LobbyChat
	result := db.DB.Order("timestamp asc").Limit(250).Find(&messages)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to fetch lobby messages: %w", result.Error)
	}
	return messages, nil
}

func SaveLobbyMessage(userID uint, message string) (*models.LobbyChat, error) {
	chatMessage := &models.LobbyChat{
		Author:    userID,
		Message:   message,
		Timestamp: time.Now(),
	}

	result := db.DB.Create(chatMessage)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to save lobby chat message: %w", result.Error)
	}
	return chatMessage, nil
}

func FetchAllGameMessages(gameID uint) ([]models.GameChat, error) {
	var messages []models.GameChat
	result := db.DB.Where("game_id = ?", gameID).Order("Timestamp asc").Find(&messages).Limit(100)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to fetch game messages: %w", result.Error)
	}
	return messages, nil
}

func SaveGameMessage(gameID, userID uint, message string) (*models.GameChat, error) {
	chatMessage := &models.GameChat{
		GameID:    gameID,
		Author:    userID,
		Message:   message,
		Timestamp: time.Now(),
	}

	result := db.DB.Create(chatMessage)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to save game chat message: %w", result.Error)
	}
	return chatMessage, nil
}
