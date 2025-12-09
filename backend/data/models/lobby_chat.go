package models

import (
	"time"
)

type LobbyChat struct {
	ID        uint      `json:"id" gorm:"primaryKey;column:id"`
	Message   string    `json:"message" gorm:"not null;column:message"`
	Author    uint      `json:"author" gorm:"not null;column:author"`
	Timestamp time.Time `json:"timestamp" gorm:"not null;column:timestamp"`

	// Foreign Key Relationships
	AuthorUser User `json:"author_user" gorm:"foreignKey:Author;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
}

// TableName overrides the default table name
func (LobbyChat) TableName() string {
	return "LobbyChat"
}
