export default function UserStatsModal({open, setOpen}: {open: boolean, setOpen: (open: boolean) => void}) {

    function closeModal() {
        // Logic to close the modal
        setOpen(false);
    }

    /*
        type UserStats struct {
            UserID      uint `json:"user_id" gorm:"primaryKey;not null"`
            NumWins     int  `json:"num_wins" gorm:"default:0"`
            NumLoss     int  `json:"num_loss" gorm:"default:0"`
            GamesPlayed int  `json:"games_played" gorm:"default:0"`
            HighScore   int  `json:"high_score" gorm:"default:0"`
        }
    */

    return (
        <div style = {
            {position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.5)', display: open ? 'block' : 'none'}
        }>
            <h2>Username</h2>
            <p>Games Played: 0</p>
            <p>Wins: 0</p>
            <p>Losses: 0</p>
            <p>High Score: 0</p>
            <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '20px'}}>
                <button onClick={closeModal}>Close</button>
            </div>
        </div>
    );
}