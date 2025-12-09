package dbmethods

import (
	"fmt"
	"time"

	"backend/data/models"
)

func Login(username string, hashedPassword string) (*models.User, error) {
	var user models.User
	result := DB.Where(`"username" = ?`, username).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

func CreateSession(tokenHash string, userID uint, expiresAt time.Time) (*models.Session, error) {
	session := &models.Session{
		TokenHash: tokenHash,
		UserID:    userID,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
	}

	result := DB.Create(session)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to create user: %w", result.Error)
	}

	return session, nil
}

func VerifySession(tokenHash string) (*models.Session, error) {
	var session models.Session
	result := DB.Where(`"tokenHash" = ?`, tokenHash).First(&session)
	if result.Error != nil || result.RowsAffected == 0 {
		return nil, fmt.Errorf("failed to verify session: %w", result.Error)
	}

	// Check if the session has expired
	if time.Now().After(session.ExpiresAt) {
		return nil, fmt.Errorf("session has expired")
	}

	return &session, nil
}

// CreateUser creates a new user in the database
func CreateUser(username, hashedPassword string) (*models.User, error) {
	user := &models.User{
		Username: username,
		Password: hashedPassword,
		IsOnline: false,
	}

	result := DB.Create(user)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to create user: %w", result.Error)
	}

	return user, nil
}

func GetUser(id uint) (*models.User, error) {
	var user models.User
	result := DB.First(&user, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

func GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	result := DB.Where(`"username" = ?`, username).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

func GetUserByTokenHash(tokenHash string) (*models.User, error) {
	var session models.Session
	result := DB.Where(`"tokenHash" = ?`, tokenHash).First(&session)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to find session: %w", result.Error)
	}

	var user models.User
	result = DB.First(&user, session.UserID)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to find user: %w", result.Error)
	}

	return &user, nil
}

func GetAllUsers() ([]models.User, error) {
	var users []models.User
	result := DB.Find(&users)
	if result.Error != nil {
		return nil, result.Error
	}
	return users, nil
}

func GetAllUsersOnline() ([]models.User, error) {
	var users []models.User
	result := DB.Where(`"isOnline" = ?`, true).Find(&users)
	if result.Error != nil {
		return nil, result.Error
	}
	return users, nil
}

// UpdateUser updates an existing user's information
func UpdateUser(id uint, updates map[string]interface{}) (*models.User, error) {
	var user models.User

	// First, check if user exists
	result := DB.First(&user, id)
	if result.Error != nil {
		return nil, fmt.Errorf("user not found: %w", result.Error)
	}

	// Update the user with provided fields
	result = DB.Model(&user).Updates(updates)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to update user: %w", result.Error)
	}

	return &user, nil
}

func UpdateUserStats(id uint, winsDelta, lossesDelta, score int) error {
	var userStats models.UserStats

	// First, check if user stats exist
	result := DB.Where(`"userID" = ?`, id).First(&userStats)

	if result.Error != nil {
		return fmt.Errorf("failed to update user stats: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("user with id %d not found", id)
	}

	//Check if high score needs to be updated
	if score > userStats.HighScore {
		userStats.HighScore = score
	}

	//If found, update numWins, numLossess, and gamesPlayed
	if result.Error == nil {
		userStats.NumWins += winsDelta
		userStats.NumLoss += lossesDelta
		userStats.GamesPlayed += winsDelta + lossesDelta
	}

	result = DB.Save(&userStats)
	if result.Error != nil {
		return fmt.Errorf("failed to update user stats: %w", result.Error)
	}
	return nil
}

func GetUserStats(id uint) (*models.UserStats, error) {
	var userStats models.UserStats

	// First, check if user stats exist
	result := DB.Where(`"userID" = ?`, id).First(&userStats)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to get user stats: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return nil, fmt.Errorf("user stats for user id %d not found", id)
	}

	return &userStats, nil
}

// UpdateUserStruct updates a user using a struct (zero values are ignored)
func UpdateUserStruct(id uint, userUpdate models.User) (*models.User, error) {
	var user models.User

	// First, check if user exists
	result := DB.First(&user, id)
	if result.Error != nil {
		return nil, fmt.Errorf("user not found: %w", result.Error)
	}

	// Update using struct (GORM will ignore zero values)
	result = DB.Model(&user).Updates(userUpdate)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to update user: %w", result.Error)
	}

	return &user, nil
}

// DeleteUser performs a soft delete on a user
func DeleteUser(id uint) error {
	result := DB.Delete(&models.User{}, id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete user: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("user with id %d not found", id)
	}

	return nil
}

// HardDeleteUser permanently deletes a user from the database
func HardDeleteUser(id uint) error {
	result := DB.Unscoped().Delete(&models.User{}, id)
	if result.Error != nil {
		return fmt.Errorf("failed to permanently delete user: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("user with id %d not found", id)
	}

	return nil
}

// UpdateUserPassword updates only the user's password (with proper hashing)
func UpdateUserPassword(id uint, hashedPassword string) error {
	result := DB.Model(&models.User{}).Where(`"id" = ?`, id).Update("password", hashedPassword)
	if result.Error != nil {
		return fmt.Errorf("failed to update password: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("user with id %d not found", id)
	}

	return nil
}

// UpdateUserOnlineStatus updates the user's online status
func UpdateUserOnlineStatus(id uint, isOnline bool) error {
	result := DB.Model(&models.User{}).Where(`"id" = ?`, id).Update("isOnline", isOnline)
	if result.Error != nil {
		return fmt.Errorf("failed to update online status: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("user with id %d not found", id)
	}

	return nil
}
