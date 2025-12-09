package models

import (
	"time"
)

type Session struct {
	ID        uint      `gorm:"primaryKey;column:id"`
	TokenHash string    `gorm:"uniqueIndex;size:64;column:tokenHash"`
	UserID    uint      `gorm:"index;column:userID"`
	ExpiresAt time.Time `gorm:"index;column:expiresAt"`
	CreatedAt time.Time `gorm:"column:createdAt"`
}

// TableName overrides the default table name
func (Session) TableName() string {
	return "Session"
}
