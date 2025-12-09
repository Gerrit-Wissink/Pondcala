package models

type User struct {
	ID       uint   `json:"id" gorm:"primaryKey;column:id"`
	Username string `json:"username" gorm:"unique;not null;column:username"`
	Password string `json:"-" gorm:"not null;column:password"` // "-" excludes from JSON serialization
	IsOnline bool   `json:"isOnline" gorm:"default:false;column:isOnline"`

	// Relationships
	HostedGames   []Game      `json:"hosted_games" gorm:"foreignKey:HostID"`
	OpponentGames []Game      `json:"opponent_games" gorm:"foreignKey:OpponentID"`
	WonGames      []Game      `json:"won_games" gorm:"foreignKey:Winner"`
	GameTurns     []GameTurn  `json:"game_turns" gorm:"foreignKey:TurnTaker"`
	GameChats     []GameChat  `json:"game_chats" gorm:"foreignKey:Author"`
	LobbyChats    []LobbyChat `json:"lobby_chats" gorm:"foreignKey:Author"`
	UserStats     UserStats   `json:"user_stats" gorm:"foreignKey:UserID"`
}

// TableName overrides the default table name
func (User) TableName() string {
	return "User"
}
