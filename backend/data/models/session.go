package models

import (
	"time"

	"gorm.io/gorm"
)

type Session struct {
	gorm.Model
	TokenHash string    `gorm:"uniqueIndex;size:64"`
	UserID    uint      `gorm: "index"`
	ExpiresAt time.Time `gorm:"index"`
	CreatedAt time.Time
}
