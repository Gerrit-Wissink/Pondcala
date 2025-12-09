package models

import (
	"time"
)

type Game struct {
	ID                uint      `json:"id" gorm:"primaryKey;column:id"`
	HostID            uint      `json:"host_id" gorm:"not null;column:hostID"`
	OpponentID        uint      `json:"opponent_id" gorm:"not null;column:opponentID"`
	StartingTimestamp time.Time `json:"starting_timestamp" gorm:"not null;column:startingTimestamp"`
	Winner            *uint     `json:"winner" gorm:"default:null;column:winner"` // Pointer to allow null

	// Foreign Key Relationships
	Host       User  `json:"host" gorm:"foreignKey:HostID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
	Opponent   User  `json:"opponent" gorm:"foreignKey:OpponentID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
	WinnerUser *User `json:"winner_user" gorm:"foreignKey:Winner;constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`

	// Has Many Relationships
	GameTurns []GameTurn `json:"game_turns" gorm:"foreignKey:GameID"`
	GameChats []GameChat `json:"game_chats" gorm:"foreignKey:GameID"`
}

// TableName overrides the default table name
func (Game) TableName() string {
	return "Game"
}
