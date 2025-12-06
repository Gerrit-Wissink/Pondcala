package dbmethods

import (
	"fmt"

	"github.com/Gerrit-Wissink/Pondcala/backend/data/dbmethods/db"
	"github.com/Gerrit-Wissink/Pondcala/backend/data/models"
)

func CreateGame(hostID, opponentID uint) (*models.Game, error) {
	game := &models.Game{
		HostID:            hostID,
		OpponentID:        opponentID,
		StartingTimestamp: models.GetCurrentTimestamp(),
		Winner:            nil,
	}

	if err := db.DB.Create(game).Error; err != nil {
		return nil, fmt.Errorf("failed to create game: %w", err)
	}

	return game, nil
}

func TakeTurn(gameID, userID uint, selected_index int, host_ponds []int, opponent_ponds []int, host_score int, opponent_score int) (*models.GameTurn, error) {
	turn := &models.GameTurn{
		GameID:        gameID,
		TurnTaker:     userID,
		SelectedIndex: selected_index,
		HostPonds:     host_ponds,
		OpponentPonds: opponent_ponds,
		HostScore:     host_score,
		OpponentScore: opponent_score,
		Timestamp:     models.GetCurrentTimestamp(),
	}

	if err := db.DB.Create(turn).Error; err != nil {
		return nil, fmt.Errorf("failed to take turn: %w", err)
	}

	return turn, nil
}

func FetchGameByID(gameID uint) (*models.Game, error) {
	var game models.Game
	result := db.DB.Preload("HostUser").Preload("OpponentUser").Where("id = ?", gameID).First(&game)
	if result.Error != nil {
		return nil, fmt.Errorf("game not found: %w", result.Error)
	}
	return &game, nil
}

func DeclareWinner(gameID, winnerID uint) error {
	result := db.DB.Model(&models.Game{}).Where("id = ?", gameID).Update("winner", winnerID)
	if result.Error != nil {
		return fmt.Errorf("failed to declare winner: %w", result.Error)
	}
	return nil
}

func FetchLastTwoTurns(gameID uint) ([]models.GameTurn, error) {
	var turns []models.GameTurn
	result := db.DB.Where("game_id = ?", gameID).Order("timestamp desc").Limit(2).Find(&turns)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to fetch game turns: %w", result.Error)
	}
	return turns, nil
}

func FetchWhoseTurnItIs(gameID uint) (uint, error) {
	var lastTurn models.GameTurn
	result := db.DB.Where("game_id = ?", gameID).Order("timestamp desc").First(&lastTurn)
	if result.Error != nil {
		return 0, fmt.Errorf("failed to fetch last turn: %w", result.Error)
	}

	var game models.Game
	result = db.DB.Where("id = ?", gameID).First(&game)
	if result.Error != nil {
		return 0, fmt.Errorf("failed to fetch game: %w", result.Error)
	}

	// Check if the last turn ended in the player's large pond (they get another turn)
	isHost := lastTurn.TurnTaker == game.HostID

	// Determine if the last move ended in the large pond
	// In Mancala, after distributing stones, if the last stone lands in your large pond,
	// you get another turn. We need to check if the score increased in the last turn.

	// To determine if they landed in their large pond, we need to check the previous turn
	var previousTurn models.GameTurn
	prevResult := db.DB.Where("game_id = ?", gameID).
		Where("timestamp < ?", lastTurn.Timestamp).
		Order("timestamp desc").
		First(&previousTurn)

	landedInLargePond := false
	if prevResult.Error == nil {
		// Compare scores to see if the player's score increased
		if isHost {
			landedInLargePond = lastTurn.HostScore > previousTurn.HostScore
		} else {
			landedInLargePond = lastTurn.OpponentScore > previousTurn.OpponentScore
		}
	} else {
		// This is the first turn, check if score increased from 0
		if isHost {
			landedInLargePond = lastTurn.HostScore > 0
		} else {
			landedInLargePond = lastTurn.OpponentScore > 0
		}
	}

	// If they landed in their large pond, they go again
	if landedInLargePond {
		return lastTurn.TurnTaker, nil
	}

	// Otherwise, it's the other player's turn
	if lastTurn.TurnTaker == game.HostID {
		return game.OpponentID, nil
	} else {
		return game.HostID, nil
	}
}

func FetchCurrentBoardState(gameID uint) (hostPonds []int, opponentPonds []int, hostScore int, opponentScore int, err error) {
	var lastTurn models.GameTurn
	result := db.DB.Where("game_id = ?", gameID).Order("timestamp desc").First(&lastTurn)
	if result.Error != nil {
		return nil, nil, 0, 0, fmt.Errorf("failed to fetch last turn: %w", result.Error)
	}

	return lastTurn.HostPonds, lastTurn.OpponentPonds, lastTurn.HostScore, lastTurn.OpponentScore, nil
}

func GetAllGamesByUserID(userID uint) ([]models.Game, error) {
	var games []models.Game
	result := db.DB.Where("host_id = ? OR opponent_id = ?", userID, userID).Find(&games)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to fetch games for user: %w", result.Error)
	}
	return games, nil
}

func GetCurrentTurnNumber(gameID uint) (int, error) {
	var count int64
	result := db.DB.Model(&models.GameTurn{}).Where("game_id = ?", gameID).Count(&count)
	if result.Error != nil {
		return 0, fmt.Errorf("failed to count turns: %w", result.Error)
	}
	return int(count) + 1, nil // Next turn number
}

func GetPlayers(gameID uint) (host models.User, opponent models.User, err error) {
	var game models.Game
	result := db.DB.Preload("Host").Preload("Opponent").Where("id = ?", gameID).First(&game)
	if result.Error != nil {
		return models.User{}, models.User{}, fmt.Errorf("failed to fetch game: %w", result.Error)
	}

	return game.Host, game.Opponent, nil
}
