
export default function GameOverModal({}: {}) {

    function closeModal() {
        // Logic to close the modal
    }

    return (
        <div style = {
            {position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.5)'}
        }>
            <h2>Game Over</h2>
            <p>Your Score: 0</p>
            <p>Opponent Score: 0</p>
            <p>Number of Turns: 0</p>
            <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '20px'}}>
                <button>Rematch</button>
                <button>Exit to Main Menu</button>
                <button onClick={closeModal}>View Board</button>
            </div>
        </div>
    );
}