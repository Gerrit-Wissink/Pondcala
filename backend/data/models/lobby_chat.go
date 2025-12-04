package models

import (
	"time"
)

type LobbyChat struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Message   string    `json:"message" gorm:"not null"`
	Author    uint      `json:"author" gorm:"not null"`
	Timestamp time.Time `json:"timestamp" gorm:"not null"`

	// Foreign Key Relationships
	AuthorUser User `json:"author_user" gorm:"foreignKey:Author;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
}
