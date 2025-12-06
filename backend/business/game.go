package business

import (
	"github.com/Gerrit-Wissink/Pondcala/backend/data/dbmethods"
	"github.com/Gerrit-Wissink/Pondcala/backend/data/models"
)

func ProcessTurn(gameID uint, userID uint, selectedIndex int, hostPonds []int, opponentPonds []int, hostScore int, opponentScore int) (*models.GameTurn, error) {
	// Placeholder for future implementation
	//Need to validate the turn
	validTurn := ValidateTurn(gameID, userID, selectedIndex, hostPonds, opponentPonds, hostScore, opponentScore)
	if validTurn != nil {
		return nil, validTurn
	}
	//Need to save the turn
	turn, err := dbmethods.TakeTurn(gameID, userID, selectedIndex, hostPonds, opponentPonds, hostScore, opponentScore)
	if err != nil {
		return nil, err
	}
	//Need to check for game end conditions
	//Need to update game state
	return turn, nil
}

func FetchGameStateByID(gameID uint) (interface{}, error) {
	// Placeholder for future implementation
	//Need to check if the game exists and if the game is still going
	if gameExists, err := CheckGameExists(gameID); err != nil || !gameExists {
		return nil, err
	}

	if gameEnded, err := CheckGameHasEnded(gameID); err != nil || gameEnded {
		return nil, err
	}
	//Need to get Whose turn it is, pond states, scores, last two turns
	whoseTurn, err := dbmethods.FetchWhoseTurnItIs(gameID)
	if err != nil {
		return nil, err
	}

	hostPonds, opponentPonds, hostScore, opponentScore, err := dbmethods.FetchCurrentBoardState(gameID)
	if err != nil {
		return nil, err
	}

	turns, err := dbmethods.FetchLastTwoTurns(gameID)
	if err != nil {
		return nil, err
	}

	host, opponent, err := dbmethods.GetPlayers(gameID)
	if err != nil {
		return nil, err
	}

	return struct {
		WhoseTurn     uint
		Host          models.User
		Opponent      models.User
		HostPonds     []int
		OpponentPonds []int
		HostScore     int
		OpponentScore int
		LastTwoTurns  []models.GameTurn
	}{
		WhoseTurn:     whoseTurn,
		Host:          host,
		Opponent:      opponent,
		HostPonds:     hostPonds,
		OpponentPonds: opponentPonds,
		HostScore:     hostScore,
		OpponentScore: opponentScore,
		LastTwoTurns:  turns,
	}, nil
}

func FetchAllGamesByUserID(userID uint) {
	// Placeholder for future implementation
}
