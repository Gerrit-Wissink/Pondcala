package business

import (
	"fmt"
	"strings"

	"backend/data/dbmethods"
	"backend/data/models"
)

func ProcessTurn(gameID uint, userID uint, selectedIndex int, hostPonds []int, opponentPonds []int, userScore int) (*models.GameTurn, error) {
	// Fetch game to determine if user is host or opponent
	game, err := dbmethods.FetchGameByID(gameID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch game: %w", err)
	}

	lastTurns, err := dbmethods.FetchLastTwoTurns(gameID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch last turns: %w", err)
	}

	// Simulate the turn server-side to calculate the new board state
	newHostPonds, newOpponentPonds, newHostScore, newOpponentScore, err := SimulateTurn(*game, userID, selectedIndex, lastTurns)
	if err != nil {
		return nil, fmt.Errorf("invalid turn: %w", err)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch last turns: %w", err)
	}

	// Save the turn with the server-calculated state
	turn, err := dbmethods.TakeTurn(gameID, userID, selectedIndex, newHostPonds, newOpponentPonds, newHostScore, newOpponentScore)
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

	turnNumber, err := dbmethods.GetCurrentTurnNumber(gameID)
	if err != nil {
		return nil, err
	}

	host, opponent, err := dbmethods.GetPlayers(gameID)
	if err != nil {
		return nil, err
	}

	winner, err := dbmethods.GetWinner(gameID)
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
		TurnNumber    int
		Winner        *uint
	}{
		WhoseTurn:     whoseTurn,
		Host:          host,
		Opponent:      opponent,
		HostPonds:     hostPonds,
		OpponentPonds: opponentPonds,
		HostScore:     hostScore,
		OpponentScore: opponentScore,
		LastTwoTurns:  turns,
		TurnNumber:    turnNumber,
		Winner:        winner,
	}, nil
}

func FetchAllGamesByUserID(userID uint) ([]models.Game, error) {
	// Placeholder for future implementation
	return dbmethods.GetAllGamesByUserID(userID)
}

func HandleGameEnd(gameID, userID, opponentID uint, reason string) error {
	// Placeholder for future implementation

	game, err := dbmethods.FetchGameByID(gameID)
	if err != nil {
		return fmt.Errorf("failed to fetch game: %w", err)
	}

	// Determine if user is host or opponent
	isHost := userID == game.HostID

	scores := map[uint]int{}
	hostScore, opponentScore, err := DetermineEndOfGameScores(gameID)
	if err != nil {
		return err
	}

	if isHost {
		scores[userID] = hostScore
		scores[opponentID] = opponentScore
	} else {
		scores[userID] = opponentScore
		scores[opponentID] = hostScore
	}

	if strings.ToLower(reason) == "forfeit" {
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
	if strings.ToLower(reason) == "win" {
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

func CreateGame(hostID, opponentID uint) (*models.Game, *models.GameTurn, error) {
	gameResult, err := dbmethods.CreateGame(hostID, opponentID)
	if err != nil {
		return nil, nil, err
	}
	firstTurn, err := dbmethods.CreateInitialGameTurn(gameResult.ID)
	if err != nil {
		return nil, nil, err
	}

	return gameResult, firstTurn, nil
}

func FetchGameByID(gameID uint) (*models.Game, error) {
	return dbmethods.FetchGameByID(gameID)
}
