package models

import (
	"gorm.io/gorm"
)

type UserStats struct {
	gorm.Model
	UserID      uint `json:"user_id" gorm:"primaryKey;not null"`
	NumWins     int  `json:"num_wins" gorm:"default:0"`
	NumLoss     int  `json:"num_loss" gorm:"default:0"`
	GamesPlayed int  `json:"games_played" gorm:"default:0"`
	HighScore   int  `json:"high_score" gorm:"default:0"`
	
	// Foreign Key Relationship
	User User `json:"user" gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}