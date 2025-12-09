

export default function ActiveGames({games}: {games: Array<{id: number, Host: {username: string}, Opponent: {username: string}}>} ) {

    function handleJoinGame(gameID: number) {
        // Implement join game logic here
        console.log(`Joining game with ID: ${gameID}`);
        window.location.href = `/#/game?gameID=${gameID}`;
    }

    return (
        <div>
            <h2>Join Back</h2>
            <ul>
                {games.map((game) => (
                    <li 
                        key={game.id} 
                        style={{
                            margin: '0.5em 0', 
                            padding: '0.5em', 
                            border: '1px solid #ccc', 
                            borderRadius: '0.3em', 
                            cursor: 'pointer', 
                            background: 'white',
                            transition: 'background 0.2s ease'
                        }} 
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f0f0f0';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                        }}
                        onClick={() => handleJoinGame(game.id)}
                    >
                        Game ID: {game.id}, Host: {game.Host ? game.Host.username ? game.Host.username : "" : ""}, Opponent: {game.Opponent ? game.Opponent.username ? game.Opponent.username : "" : ""}
                    </li>
                ))}
            </ul>
        </div>
    );
}