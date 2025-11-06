package models

import (
	"time"
	"gorm.io/gorm"
)

type GameTurn struct {
	gorm.Model
	ID            uint      `json:"id" gorm:"primaryKey"`
	GameID        uint      `json:"game_id" gorm:"not null"`
	TurnTaker     uint      `json:"turn_taker" gorm:"not null"`
	SelectedIndex int       `json:"selected_index" gorm:"not null"`
	BoardState    string    `json:"board_state" gorm:"not null"`
	Timestamp     time.Time `json:"timestamp" gorm:"not null"`
	
	// Foreign Key Relationships
	Game         Game `json:"game" gorm:"foreignKey:GameID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	TurnTakerUser User `json:"turn_taker_user" gorm:"foreignKey:TurnTaker;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
}