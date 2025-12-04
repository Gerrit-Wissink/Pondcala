package business

import (
	"crypto/sha256"
	"fmt"
	"html"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"github.com/Gerrit-Wissink/Pondcala/backend/data/dbmethods"
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
