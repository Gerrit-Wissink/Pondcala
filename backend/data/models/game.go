package models

import (
	"time"
	"gorm.io/gorm"
)

type Game struct {
	gorm.Model
	ID                 uint      `json:"id" gorm:"primaryKey"`
	HostID             uint      `json:"host_id" gorm:"not null"`
	OpponentID         uint      `json:"opponent_id" gorm:"not null"`
	StartingTimestamp  time.Time `json:"starting_timestamp" gorm:"not null"`
	Winner             *uint     `json:"winner" gorm:"default:null"` // Pointer to allow null
	
	// Foreign Key Relationships
	Host     User `json:"host" gorm:"foreignKey:HostID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
	Opponent User `json:"opponent" gorm:"foreignKey:OpponentID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
	WinnerUser *User `json:"winner_user" gorm:"foreignKey:Winner;constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`
	
	// Has Many Relationships
	GameTurns []GameTurn `json:"game_turns" gorm:"foreignKey:GameID"`
	GameChats []GameChat `json:"game_chats" gorm:"foreignKey:GameID"`
}