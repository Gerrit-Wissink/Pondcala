package business

import (
	"fmt"

	"github.com/Gerrit-Wissink/Pondcala/backend/data/dbmethods"
	"github.com/Gerrit-Wissink/Pondcala/backend/data/models"
)

func ProcessTurn(gameID uint, userID uint, selectedIndex int, hostPonds []int, opponentPonds []int, userScore int) (*models.GameTurn, error) {
	// Fetch game to determine if user is host or opponent
	game, err := dbmethods.FetchGameByID(gameID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch game: %w", err)
	}

	// Determine if user is host or opponent
	isHost := userID == game.HostID

	// Fetch the other player's score from the previous turn
	// The other player's score is guaranteed to remain unaffected
	var hostScore, opponentScore int
	lastTurns, err := dbmethods.FetchLastTwoTurns(gameID)
	if err == nil && len(lastTurns) > 0 {
		// Get the most recent turn's scores
		if isHost {
			hostScore = userScore
			opponentScore = lastTurns[0].OpponentScore
		} else {
			hostScore = lastTurns[0].HostScore
			opponentScore = userScore
		}
	} else {
		// First turn - both scores start at 0
		if isHost {
			hostScore = userScore
			opponentScore = 0
		} else {
			hostScore = 0
			opponentScore = userScore
		}
	}

	// Validate the turn
	validTurn := ValidateTurn(gameID, userID, selectedIndex, hostPonds, opponentPonds, hostScore, opponentScore)
	if validTurn != nil {
		return nil, validTurn
	}

	// Save the turn
	turn, err := dbmethods.TakeTurn(gameID, userID, selectedIndex, hostPonds, opponentPonds, hostScore, opponentScore)
	if err != nil {
		return nil, err
	}

	// TODO: Check for game end conditions
	// TODO: Update game state
	return turn, nil
}

func FetchWhoseTurnItIs(gameID uint) (uint, error) {
	return dbmethods.FetchWhoseTurnItIs(gameID)
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

func FetchAllGamesByUserID(userID uint) ([]models.Game, error) {
	// Placeholder for future implementation
	return dbmethods.GetAllGamesByUserID(userID)
}

func HandleGameEnd(gameID, userID, opponentID uint, reason string, scores map[uint]int) error {
	// Placeholder for future implementation
	if reason == "forfeit" {
		// Handle forfeit logic
		err := dbmethods.DeclareWinner(gameID, opponentID)
		if err != nil {
			// Handle error
			return err
		}

		err = dbmethods.UpdateUserStats(userID, 0, 1, scores[userID])
		if err != nil {
			// Handle error
			return err
		}

		err = dbmethods.UpdateUserStats(opponentID, 1, 0, scores[opponentID])
		if err != nil {
			// Handle error
			return err
		}
		return nil
	}
	if reason == "win" {
		// Handle win logic
		err := dbmethods.DeclareWinner(gameID, userID)
		if err != nil {
			// Handle error
			return err
		}

		err = dbmethods.UpdateUserStats(userID, 1, 0, scores[userID])
		if err != nil {
			// Handle error
			return err
		}

		err = dbmethods.UpdateUserStats(opponentID, 0, 1, scores[opponentID])
		if err != nil {
			// Handle error
			return err
		}
		return nil
	}
	return fmt.Errorf("invalid reason for game end")
}
