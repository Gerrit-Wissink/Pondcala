package business

import (
	"crypto/sha256"
	"fmt"
	"html"
	"strings"

	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"

	"backend/data/dbmethods"
	"backend/data/models"
)

func Sanitize(input string) string {
	trim := strings.TrimSpace((input))
	plain := html.EscapeString(trim)
	return plain
}

func HashPassword(input string) (string, error) {
	hashBytes, err := bcrypt.GenerateFromPassword([]byte(input), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashBytes), nil
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func CheckUsernameUniqueness(username string) (bool, error) {
	user, err := dbmethods.GetUserByUsername(username)
	if err != nil {
		if err.Error() == "user not found" {
			return true, nil // Username is unique
		}
		return false, err // Some other error occurred
	}
	if user != nil {
		return false, nil // Username already exists
	}
	return true, nil // Username is unique
}

func HashToken(token string) string {
	//generate an array of random bytes using sha256 with your token
	h := sha256.Sum256([]byte(token))
	//convert that array to a lowercase hexadecimal string and return it
	return fmt.Sprintf("%x", h[:])
}

func CheckGameExists(gameID uint) (bool, error) {
	_, err := dbmethods.FetchGameByID(gameID)
	if err != nil {
		if err.Error() == "game not found" {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func CheckGameHasEnded(gameID uint) (bool, error) {
	game, err := dbmethods.FetchGameByID(gameID)
	if err != nil {
		return false, err
	}
	if game.Winner != nil {
		return true, nil
	}
	return false, nil
}

func ValidateTurn(gameID, userID uint, selected_index int, host_ponds []int, opponent_ponds []int, hostScore int, opponentScore int) error {
	// 1. Check if the game exists
	if exists, err := CheckGameExists(gameID); err != nil {
		return fmt.Errorf("error checking game existence: %w", err)
	} else if !exists {
		return fmt.Errorf("game not found")
	}

	// 2. Check if a winner has been declared already
	if ended, err := CheckGameHasEnded(gameID); err != nil {
		return fmt.Errorf("error checking if game has ended: %w", err)
	} else if ended {
		return fmt.Errorf("game has already ended")
	}

	// Fetch game details
	game, err := dbmethods.FetchGameByID(gameID)
	if err != nil {
		return fmt.Errorf("game not found: %w", err)
	}

	// 3. Check if it's the user's turn
	whoseTurn, err := dbmethods.FetchWhoseTurnItIs(gameID)
	if err != nil {
		// If there's an error fetching whose turn it is, check if this is the first turn
		// In that case, the host goes first
		turnCount, countErr := dbmethods.GetCurrentTurnNumber(gameID)
		if countErr != nil {
			return fmt.Errorf("error determining turn: %w", err)
		}

		if turnCount == 1 {
			// First turn - host should go
			if userID != game.HostID {
				return fmt.Errorf("not your turn - host goes first")
			}
		} else {
			return fmt.Errorf("error fetching whose turn it is: %w", err)
		}
	} else if whoseTurn != userID {
		return fmt.Errorf("not your turn")
	}

	// 4. Check if the selected index is in bounds (0 to 5)
	if selected_index < 0 || selected_index > 5 {
		return fmt.Errorf("invalid selected index: must be between 0 and 5")
	}

	// 5. Fetch the last turn from the database to get the previous state
	lastTurns, err := dbmethods.FetchLastTwoTurns(gameID)
	if err != nil {
		return fmt.Errorf("error fetching last turns: %w", err)
	}

	// 6. Simulate the turn on the server to verify the submitted state
	simHostPonds, simOpponentPonds, simHostScore, simOpponentScore, err := SimulateTurn(*game, userID, selected_index, lastTurns)
	if err != nil {
		return fmt.Errorf("error simulating turn: %w", err)
	}

	// 7. Compare simulated state with submitted state
	for i := 0; i < 6; i++ {
		if simHostPonds[i] != host_ponds[i] {
			return fmt.Errorf("host ponds mismatch at index %d: expected %d, got %d", i, simHostPonds[i], host_ponds[i])
		}
		if simOpponentPonds[i] != opponent_ponds[i] {
			return fmt.Errorf("opponent ponds mismatch at index %d: expected %d, got %d", i, simOpponentPonds[i], opponent_ponds[i])
		}
	}

	if simHostScore != hostScore {
		return fmt.Errorf("host score mismatch: expected %d, got %d", simHostScore, hostScore)
	}

	if simOpponentScore != opponentScore {
		return fmt.Errorf("opponent score mismatch: expected %d, got %d", simOpponentScore, opponentScore)
	}

	return nil
}

func SimulateTurn(game models.Game, userID uint, selected_index int, lastTurns []models.GameTurn) ([]int, []int, int, int, error) {

	// Initialize expected state (if no previous turns, start with default state)
	var expectedHostPonds, expectedOpponentPonds []int
	var expectedHostScore, expectedOpponentScore int

	if len(lastTurns) == 0 {
		// First turn - initialize with starting state (4 stones in each pond, 0 scores)
		expectedHostPonds = []int{4, 4, 4, 4, 4, 4}
		expectedOpponentPonds = []int{4, 4, 4, 4, 4, 4}
		expectedHostScore = 0
		expectedOpponentScore = 0
	} else {
		// Get the most recent turn (lastTurns is reversed: index 0 is older, last index is newest)
		lastTurn := lastTurns[len(lastTurns)-1]
		expectedHostPonds = convertInt64SliceToInt(lastTurn.HostPonds)
		expectedOpponentPonds = convertInt64SliceToInt(lastTurn.OpponentPonds)
		expectedHostScore = lastTurn.HostScore
		expectedOpponentScore = lastTurn.OpponentScore
	}

	isHost := userID == game.HostID

	// Create working copies to simulate
	simHostPonds := make([]int, len(expectedHostPonds))
	copy(simHostPonds, expectedHostPonds)
	simOpponentPonds := make([]int, len(expectedOpponentPonds))
	copy(simOpponentPonds, expectedOpponentPonds)
	simHostScore := expectedHostScore
	simOpponentScore := expectedOpponentScore

	// Determine which ponds belong to the current player
	var playerPonds, opponentPlayerPonds *[]int
	var playerScore *int

	if isHost {
		playerPonds = &simHostPonds
		opponentPlayerPonds = &simOpponentPonds
		playerScore = &simHostScore
	} else {
		playerPonds = &simOpponentPonds
		opponentPlayerPonds = &simHostPonds
		playerScore = &simOpponentScore
	}

	// Check if the selected pond has stones to pick up
	if (*playerPonds)[selected_index] == 0 {
		return nil, nil, 0, 0, fmt.Errorf("cannot select empty pond")
	}

	// Pick up all stones from the selected pond
	stonesToDistribute := (*playerPonds)[selected_index]
	(*playerPonds)[selected_index] = 0
	currentIndex := selected_index + 1

	// Track the last pond where a stone was placed
	var lastPondIndex int = -1
	var lastPondWasPlayerSide bool = false

	// Distribute stones
	for stonesToDistribute > 0 {
		// Distribute in player's own ponds
		for currentIndex < 6 && stonesToDistribute > 0 {
			(*playerPonds)[currentIndex]++
			stonesToDistribute--
			lastPondIndex = currentIndex
			lastPondWasPlayerSide = true
			currentIndex++
		}

		// If stones remaining, add one to player's score pond
		if stonesToDistribute > 0 && currentIndex == 6 {
			(*playerScore)++
			stonesToDistribute--
			lastPondIndex = -1 // Large pond
			currentIndex = 0   // Reset to start of opponent's ponds
		}

		// If stones still remaining, distribute in opponent's ponds
		// In Mancala, stones continue counter-clockwise into opponent's ponds
		// From player's perspective: go into opponent ponds from right-to-left (5->4->3->2->1->0)
		for i := 5; i >= 0 && stonesToDistribute > 0; i-- {
			(*opponentPlayerPonds)[i]++
			stonesToDistribute--
			lastPondIndex = i
			lastPondWasPlayerSide = false
		}

		// If we've gone through all opponent ponds and still have stones, start over at player's ponds
		if stonesToDistribute > 0 {
			currentIndex = 0
		}
	}

	// Capture rule: If the last stone landed in an empty pond on the player's side
	// (value is now 1) and it's not the large pond, capture that pond and the opposite pond
	if lastPondWasPlayerSide && lastPondIndex >= 0 && lastPondIndex < 6 && (*playerPonds)[lastPondIndex] == 1 {
		oppositeIndex := 5 - lastPondIndex
		capturedStones := (*playerPonds)[lastPondIndex] + (*opponentPlayerPonds)[oppositeIndex]

		if capturedStones > 1 { // Only capture if there are stones in the opposite pond
			(*playerPonds)[lastPondIndex] = 0
			(*opponentPlayerPonds)[oppositeIndex] = 0
			(*playerScore) += capturedStones
		}
	}

	return simHostPonds, simOpponentPonds, simHostScore, simOpponentScore, nil
}

func DetermineEndOfGameScores(gameID uint) (hostScore int, opponentScore int, err error) {
	hostPonds, opponentPonds, hostScore, opponentScore, err := dbmethods.FetchCurrentBoardState(gameID)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to get current board state: %w", err)
	}

	// Check if either side's ponds are all empty
	hostEmpty := true
	for _, stones := range hostPonds {
		if stones > 0 {
			hostEmpty = false
			break
		}
	}

	opponentEmpty := true
	for _, stones := range opponentPonds {
		if stones > 0 {
			opponentEmpty = false
			break
		}
	}

	// If one side is empty, collect remaining stones from the other side
	if hostEmpty {
		for _, stones := range opponentPonds {
			opponentScore += stones
		}
	} else if opponentEmpty {
		for _, stones := range hostPonds {
			hostScore += stones
		}
	}

	return hostScore, opponentScore, nil
}

// Helper function for converting pq.Int64Array to []int
func convertInt64SliceToInt(slice pq.Int64Array) []int {
	result := make([]int, len(slice))
	for i, v := range slice {
		result[i] = int(v)
	}
	return result
}
