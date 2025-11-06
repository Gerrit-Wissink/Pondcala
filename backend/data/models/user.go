package models

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username   string `json:"username" gorm:"unique;not null"`
	Password   string `json:"-" gorm:"not null"` // "-" excludes from JSON serialization
	IsOnline   bool   `json:"isOnline" gorm:"default:false"`
	
	// Relationships
	HostedGames    []Game     `json:"hosted_games" gorm:"foreignKey:HostID"`
	OpponentGames  []Game     `json:"opponent_games" gorm:"foreignKey:OpponentID"`
	WonGames       []Game     `json:"won_games" gorm:"foreignKey:Winner"`
	GameTurns      []GameTurn `json:"game_turns" gorm:"foreignKey:TurnTaker"`
	GameChats      []GameChat `json:"game_chats" gorm:"foreignKey:Author"`
	LobbyChats     []LobbyChat `json:"lobby_chats" gorm:"foreignKey:Author"`
	UserStats      UserStats  `json:"user_stats" gorm:"foreignKey:UserID"`
}