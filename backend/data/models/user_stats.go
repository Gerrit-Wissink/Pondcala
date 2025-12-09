package models

type UserStats struct {
	UserID      uint `json:"user_id" gorm:"primaryKey;not null;column:userID"`
	NumWins     int  `json:"num_wins" gorm:"default:0;column:numWins"`
	NumLoss     int  `json:"num_loss" gorm:"default:0;column:numLoss"`
	GamesPlayed int  `json:"games_played" gorm:"default:0;column:gamesPlayed"`
	HighScore   int  `json:"high_score" gorm:"default:0;column:highScore"`

	// Foreign Key Relationship
	// User User `json:"user" gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}

// TableName overrides the default table name
func (UserStats) TableName() string {
	return "UserStats"
}
