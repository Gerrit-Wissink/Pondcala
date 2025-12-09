package models

import (
	"time"
)

type GameChat struct {
	ID        uint      `json:"id" gorm:"primaryKey;column:id"`
	GameID    uint      `json:"game_id" gorm:"not null;column:gameID"`
	Message   string    `json:"message" gorm:"not null;column:message"`
	Author    uint      `json:"author" gorm:"not null;column:author"`
	Timestamp time.Time `json:"timestamp" gorm:"not null;column:timestamp"`

	// Foreign Key Relationships
	Game       Game `json:"game" gorm:"foreignKey:GameID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	AuthorUser User `json:"author_user" gorm:"foreignKey:Author;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
}

// TableName overrides the default table name
func (GameChat) TableName() string {
	return "GameChat"
}
