package models

import (
	"time"
)

type GameTurn struct {
	ID            uint      `json:"id" gorm:"primaryKey;column:id"`
	GameID        uint      `json:"game_id" gorm:"not null;column:gameID"`
	TurnTaker     uint      `json:"turn_taker" gorm:"not null;column:turnTaker"`
	SelectedIndex int       `json:"selected_index" gorm:"not null;column:selectedIndex"`
	HostPonds     []int     `json:"host_ponds" gorm:"type:integer[];column:hostPonds"`
	OpponentPonds []int     `json:"opponent_ponds" gorm:"type:integer[];column:opponentPonds"`
	HostScore     int       `json:"host_score" gorm:"not null;column:hostScore"`
	OpponentScore int       `json:"opponent_score" gorm:"not null;column:opponentScore"`
	Timestamp     time.Time `json:"timestamp" gorm:"not null;column:timestamp"`

	// Foreign Key Relationships
	Game          Game `json:"game" gorm:"foreignKey:GameID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	TurnTakerUser User `json:"turn_taker_user" gorm:"foreignKey:TurnTaker;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
}

// TableName overrides the default table name
func (GameTurn) TableName() string {
	return "GameTurn"
}
