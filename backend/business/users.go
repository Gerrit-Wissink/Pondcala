package business

import (
	"fmt"
	"time"

	"backend/data/dbmethods"
	"backend/data/models"
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

	user, d_err := dbmethods.GetUserByUsername(_username)

	if d_err != nil {
		return nil, fmt.Errorf("Invalid username or password")
	}

	// Compare the provided password with the stored hash
	if !CheckPasswordHash(_password, user.Password) {
		return nil, fmt.Errorf("Invalid username or password")
	}

	return user, nil
}

func StoreUserToken(token string, user *models.User, expiresAt time.Time) (*models.Session, error) {
	hashedToken := HashToken(token)

	session, err := dbmethods.CreateSession(hashedToken, user.ID, expiresAt)

	if err != nil {
		return nil, err
	}

	return session, nil
}

func ValidateUserToken(token string) (*models.Session, error) {
	hashedToken := HashToken(token)

	session, err := dbmethods.VerifySession(hashedToken)

	if err != nil {
		return nil, err
	}

	return session, nil
}

// CreateUser validates input, hashes the password and creates a new user record.
func CreateUser(username, password string) (*models.User, error) {
	u := Sanitize(username)
	p := Sanitize(password)

	if len(u) < 1 {
		return nil, fmt.Errorf("username required")
	}
	if len(p) < 6 {
		return nil, fmt.Errorf("password must be at least 6 characters")
	}

	hashed, err := HashPassword(p)
	if err != nil {
		return nil, err
	}

	user, err := dbmethods.CreateUser(u, hashed)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func FetchAllUsers() ([]*models.User, error) {
	users, err := dbmethods.GetAllUsers()
	if err != nil {
		return nil, err
	}
	// convert to slice of pointers expected by service layer
	out := make([]*models.User, 0, len(users))
	for i := range users {
		out = append(out, &users[i])
	}
	return out, nil
}

func FetchAllUsersOnline() ([]*models.User, error) {
	users, err := dbmethods.GetAllUsersOnline()
	if err != nil {
		return nil, err
	}
	// convert to slice of pointers expected by service layer
	out := make([]*models.User, 0, len(users))
	for i := range users {
		out = append(out, &users[i])
	}
	return out, nil
}

func GetUserByID(id uint) (*models.User, error) {
	return dbmethods.GetUser(id)
}

func UpdateUser(id uint, updates map[string]interface{}) (*models.User, error) {
	return dbmethods.UpdateUser(id, updates)
}

func HardDeleteUser(id uint) error {
	return dbmethods.HardDeleteUser(id)
}

func DeleteUser(id uint) error {
	return dbmethods.DeleteUser(id)
}

func UpdateUserPassword(id uint, newPassword string) error {
	if len(newPassword) < 6 {
		return fmt.Errorf("password too short")
	}
	hash, err := HashPassword(newPassword)
	if err != nil {
		return err
	}
	return dbmethods.UpdateUserPassword(id, hash)
}

func UpdateUserOnlineStatus(id uint, isOnline bool) error {
	return dbmethods.UpdateUserOnlineStatus(id, isOnline)
}

func VerifySessionHash(tokenHash string) (*models.Session, error) {
	return dbmethods.VerifySession(tokenHash)
}

func GetUserByTokenHash(tokenHash string) (*models.User, error) {
	return dbmethods.GetUserByTokenHash(tokenHash)
}
