package services

import (
	"fmt"
	"../models"
	"./db"
)

func CreateGame(hostID, opponentID uint) (*models.Game, error) {
	game := &models.Game{
		HostID:     hostID,
		OpponentID: opponentID,
		StartingTimestamp:  models.GetCurrentTimestamp(),
		Winner:     nil,
	}

	if err := db.DB.Create(game).Error; err != nil {
		return nil, fmt.Errorf("failed to create game: %w", err)
	}

	return game, nil
}

func TakeTurn(gameID, userID uint, selected_index int, board_state string) (*models.GameTurn, error) {
	turn := &models.GameTurn{
		GameID:      gameID,
		TurnTaker:   userID,
		SelectedIndex: selected_index,
		BoardState:  board_state,
		Timestamp:   models.GetCurrentTimestamp(),
	}

	if err := db.DB.Create(turn).Error; err != nil {
		return nil, fmt.Errorf("failed to take turn: %w", err)
	}

	return turn, nil
}