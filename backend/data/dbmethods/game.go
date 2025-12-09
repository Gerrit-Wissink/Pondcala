package dbmethods

import (
	"fmt"

	"backend/data/models"
)

func CreateGame(hostID, opponentID uint) (*models.Game, error) {
	game := &models.Game{
		HostID:            hostID,
		OpponentID:        opponentID,
		StartingTimestamp: models.GetCurrentTimestamp(),
		Winner:            nil,
	}

	if err := DB.Create(game).Error; err != nil {
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

	if err := DB.Create(turn).Error; err != nil {
		return nil, fmt.Errorf("failed to take turn: %w", err)
	}

	return turn, nil
}

func FetchGameByID(gameID uint) (*models.Game, error) {
	var game models.Game
	result := DB.Preload("HostUser").Preload("OpponentUser").Where(`"id" = ?`, gameID).First(&game)
	if result.Error != nil {
		return nil, fmt.Errorf("game not found: %w", result.Error)
	}
	return &game, nil
}

func DeclareWinner(gameID, winnerID uint) error {
	result := DB.Model(&models.Game{}).Where(`"id" = ?`, gameID).Update(`"winner"`, winnerID)
	if result.Error != nil {
		return fmt.Errorf("failed to declare winner: %w", result.Error)
	}
	return nil
}

func GetWinner(gameID uint) (*uint, error) {
	var game models.Game
	result := DB.Where(`"id" = ?`, gameID).First(&game)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to fetch game: %w", result.Error)
	}
	return game.Winner, nil
}

func GetLastTwoTurnsForGame(gameID uint) ([]models.GameTurn, error) {
	var turns []models.GameTurn
	result := DB.Where(`"gameID" = ?`, gameID).Order(`"timestamp" desc`).Limit(2).Find(&turns)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to fetch game turns: %w", result.Error)
	}
	return turns, nil
}

func GetCurrentScores(gameID uint) (hostScore int, opponentScore int, err error) {
	var lastTurn models.GameTurn
	result := DB.Where(`"gameID" = ?`, gameID).Order(`"timestamp" desc`).First(&lastTurn)
	if result.Error != nil {
		return 0, 0, fmt.Errorf("failed to fetch last turn: %w", result.Error)
	}

	return lastTurn.HostScore, lastTurn.OpponentScore, nil
}

// checkIfPlayerGetsAnotherTurn determines if the last move ended in the player's large pond
// using the formula: (selectedIndex + fishCount) % 13 === 6
func checkIfPlayerGetsAnotherTurn(gameID uint, lastTurn models.GameTurn, game models.Game) (bool, error) {
	isHost := lastTurn.TurnTaker == game.HostID

	// Get the turn BEFORE the last turn to find the value at the selected index
	// (the last turn's ponds will have 0 at selectedIndex since the fish were moved)
	var turnBeforeLast models.GameTurn
	prevResult := DB.Where(`"gameID" = ?`, gameID).
		Where("timestamp < ?", lastTurn.Timestamp).
		Order(`"timestamp" desc`).
		First(&turnBeforeLast)

	var fishCount int
	if prevResult.Error == nil {
		// Get the fish count from the turn before last
		if isHost {
			fishCount = turnBeforeLast.HostPonds[lastTurn.SelectedIndex]
		} else {
			fishCount = turnBeforeLast.OpponentPonds[lastTurn.SelectedIndex]
		}
	} else {
		// This is the first turn, initial ponds all have 4 fish
		fishCount = 4
	}

	// Check if the last fish landed in the large pond
	landedInLargePond := (lastTurn.SelectedIndex+fishCount)%13 == 6

	return landedInLargePond, nil
}

func FetchWhoseTurnItIs(gameID uint) (uint, error) {
	var lastTurn models.GameTurn
	result := DB.Where(`"gameID" = ?`, gameID).Order(`"timestamp" desc`).First(&lastTurn)
	if result.Error != nil {
		return 0, fmt.Errorf("failed to fetch last turn: %w", result.Error)
	}

	var game models.Game
	result = DB.Where(`"id" = ?`, gameID).First(&game)
	if result.Error != nil {
		return 0, fmt.Errorf("failed to fetch game: %w", result.Error)
	}

	// Check if the last turn ended in the player's large pond (they get another turn)
	landedInLargePond, err := checkIfPlayerGetsAnotherTurn(gameID, lastTurn, game)
	if err != nil {
		return 0, fmt.Errorf("failed to check if player gets another turn: %w", err)
	}

	// If they landed in their large pond, they go again
	if landedInLargePond {
		return lastTurn.TurnTaker, nil
	}

	// Otherwise, it's the other player's turn
	if lastTurn.TurnTaker == game.OpponentID {
		return game.HostID, nil
	} else {
		return game.OpponentID, nil
	}
}

func FetchCurrentBoardState(gameID uint) (hostPonds []int, opponentPonds []int, hostScore int, opponentScore int, err error) {
	var lastTurn models.GameTurn
	result := DB.Where(`"gameID" = ?`, gameID).Order(`"timestamp" desc`).First(&lastTurn)
	if result.Error != nil {
		return nil, nil, 0, 0, fmt.Errorf("failed to fetch last turn: %w", result.Error)
	}

	return lastTurn.HostPonds, lastTurn.OpponentPonds, lastTurn.HostScore, lastTurn.OpponentScore, nil
}

func GetAllGamesByUserID(userID uint) ([]models.Game, error) {
	var games []models.Game
	result := DB.Where(`"hostID" = ? OR "opponentID" = ?`, userID, userID).Find(&games)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to fetch games for user: %w", result.Error)
	}
	return games, nil
}

func GetCurrentTurnNumber(gameID uint) (int, error) {
	var count int64
	result := DB.Model(&models.GameTurn{}).Where(`"gameID" = ?`, gameID).Count(&count)
	if result.Error != nil {
		return 0, fmt.Errorf("failed to count turns: %w", result.Error)
	}
	return int(count), nil // Next turn number
}

func GetPlayers(gameID uint) (host models.User, opponent models.User, err error) {
	var game models.Game
	result := DB.Preload("Host").Preload("Opponent").Where(`"id" = ?`, gameID).First(&game)
	if result.Error != nil {
		return models.User{}, models.User{}, fmt.Errorf("failed to fetch game: %w", result.Error)
	}

	return game.Host, game.Opponent, nil
}

func CreateInitialGameTurn(gameID uint) (*models.GameTurn, error) {
	// Initialize starting state
	initialPonds := []int{4, 4, 4, 4, 4, 4}
	initialScore := 0

	turn := &models.GameTurn{
		GameID:        gameID,
		TurnTaker:     0, // No turn taker for initial state
		SelectedIndex: -1,
		HostPonds:     initialPonds,
		OpponentPonds: initialPonds,
		HostScore:     initialScore,
		OpponentScore: initialScore,
		Timestamp:     models.GetCurrentTimestamp(),
	}

	if err := DB.Create(turn).Error; err != nil {
		return nil, fmt.Errorf("failed to create initial game turn: %w", err)
	}

	return turn, nil
}

func UpdateGameWinner(gameID, winnerID uint) error {
	result := DB.Model(&models.Game{}).Where(`"id" = ?`, gameID).Update(`"winner"`, winnerID)
	if result.Error != nil {
		return fmt.Errorf("failed to update game winner: %w", result.Error)
	}
	return nil
}
