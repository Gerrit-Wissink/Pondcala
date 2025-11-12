package business

import (
	"fmt"

	"github.com/Gerrit-Wissink/Pondcala/backend/data/models"
	"github.com/Gerrit-Wissink/Pondcala/backend/data/services"
)

func ProcessLogin(username string, password string) (*models.User, error) {
	var _username = Sanitize(username)
	var _password = Sanitize(password)

	if len(_username) < 1 {
		return nil, fmt.Errorf("Username is required")
	}

	if len(_password) < 1 {
		return nil, fmt.Errorf("Password is required")
	}

	hash_password, h_err := Hash(_password)

	if h_err != nil {
		return nil, h_err
	}

	user, d_err := services.Login(_username, hash_password)

	if d_err != nil {
		return nil, d_err
	}

	return user, nil
}
