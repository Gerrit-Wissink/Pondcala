package business

import (
	"github.com/Gerrit-Wissink/Pondcala/backend/data/dbmethods"
	"github.com/Gerrit-Wissink/Pondcala/backend/data/models"
)

func GetAllLobbyMessages() ([]models.LobbyChat, error) {
	messages, err := dbmethods.FetchAllLobbyMessages()
	if err != nil {
		return nil, err
	}
	return messages, nil
}

func SaveLobbyMessage(userID uint, message string) (*models.LobbyChat, error) {
	chatMessage, err := dbmethods.SaveLobbyMessage(userID, message)
	if err != nil {
		return nil, err
	}
	return chatMessage, nil
}
