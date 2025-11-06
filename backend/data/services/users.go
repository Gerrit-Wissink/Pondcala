package services

import (
	"fmt"
	"../models"
	"./db"
)

// CreateUser creates a new user in the database
func CreateUser(username, hashedPassword, email string) (*models.User, error) {
    user := &models.User{
        Username: username,
        HashedPw: hashedPassword,
        Email:    email,
        IsOnline: false,
    }
    
    result := db.DB.Create(user)
    if result.Error != nil {
        return nil, fmt.Errorf("failed to create user: %w", result.Error)
    }
    
    return user, nil
}


func GetUser(id uint) (*models.User, error) {
	var user models.User
	result := db.DB.First(&user, id)
	if result.Error != nil {
        return nil, result.Error
    }
	return &user, nil
}

// UpdateUser updates an existing user's information
func UpdateUser(id uint, updates map[string]interface{}) (*models.User, error) {
    var user models.User
    
    // First, check if user exists
    result := db.DB.First(&user, id)
    if result.Error != nil {
        return nil, fmt.Errorf("user not found: %w", result.Error)
    }
    
    // Update the user with provided fields
    result = db.DB.Model(&user).Updates(updates)
    if result.Error != nil {
        return nil, fmt.Errorf("failed to update user: %w", result.Error)
    }
    
    return &user, nil
}

// UpdateUserStruct updates a user using a struct (zero values are ignored)
func UpdateUserStruct(id uint, userUpdate models.User) (*models.User, error) {
    var user models.User
    
    // First, check if user exists
    result := db.DB.First(&user, id)
    if result.Error != nil {
        return nil, fmt.Errorf("user not found: %w", result.Error)
    }
    
    // Update using struct (GORM will ignore zero values)
    result = db.DB.Model(&user).Updates(userUpdate)
    if result.Error != nil {
        return nil, fmt.Errorf("failed to update user: %w", result.Error)
    }
    
    return &user, nil
}

// DeleteUser performs a soft delete on a user
func DeleteUser(id uint) error {
    result := db.DB.Delete(&models.User{}, id)
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
    result := db.DB.Unscoped().Delete(&models.User{}, id)
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
    result := db.DB.Model(&models.User{}).Where("id = ?", id).Update("hashed_pw", hashedPassword)
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
    result := db.DB.Model(&models.User{}).Where("id = ?", id).Update("is_online", isOnline)
    if result.Error != nil {
        return fmt.Errorf("failed to update online status: %w", result.Error)
    }
    
    if result.RowsAffected == 0 {
        return fmt.Errorf("user with id %d not found", id)
    }
    
    return nil
}

