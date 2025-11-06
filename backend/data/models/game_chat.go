package models

import (
	"time"
	"gorm.io/gorm"
)

type GameChat struct {
	gorm.Model
	ID        uint      `json:"id" gorm:"primaryKey"`
	GameID    uint      `json:"game_id" gorm:"not null"`
	Message   string    `json:"message" gorm:"not null"`
	Author    uint      `json:"author" gorm:"not null"`
	Timestamp time.Time `json:"timestamp" gorm:"not null"`
	
	// Foreign Key Relationships
	Game       Game `json:"game" gorm:"foreignKey:GameID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	AuthorUser User `json:"author_user" gorm:"foreignKey:Author;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
}