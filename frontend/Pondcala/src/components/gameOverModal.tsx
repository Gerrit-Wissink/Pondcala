
export default function GameOverModal({gameStats, isModalOpen, handleRematch, handleBackToLobby, youWon, setIsEndingModalOpen}: { gameStats: any; isModalOpen: boolean; handleRematch: () => void; handleBackToLobby: () => void; youWon: boolean; setIsEndingModalOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
    
    function closeModal() {
        setIsEndingModalOpen(false);
    }

    return (
        <div style = {
            {position: 'fixed', display: isModalOpen ? 'block' : 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.5)'}
        }>
            <h2 style={{color: youWon ? "green" : "red"}}>{youWon ? "You Won!" : "You Lost"}</h2>
            <p>Your Score: {gameStats.yourScore}</p>
            <p>Opponent Score: {gameStats.opponentScore}</p>
            <p>Number of Turns: {gameStats.turns}</p>
            <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '20px'}}>
                <button onClick={handleRematch}>Rematch</button>
                <button onClick={handleBackToLobby}>Exit to Main Menu</button>
                <button onClick={closeModal}>View Board</button>
            </div>
        </div>
    );
}