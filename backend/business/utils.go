package business

import (
	"html"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func Sanitize(input string) string {
	trim := strings.TrimSpace((input))
	plain := html.EscapeString(trim)
	return plain
}

func Hash(input string) (string, error) {
	hashBytes, err := bcrypt.GenerateFromPassword([]byte(input), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashBytes), nil
}
