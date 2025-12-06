

export default function ActiveGames({games}: {games: Array<{ID: number, Host: {Username: string}, Opponent: {Username: string}}>} ) {

    function handleJoinGame(gameID: number) {
        // Implement join game logic here
        console.log(`Joining game with ID: ${gameID}`);
        window.location.href = `/game/${gameID}`;
    }

    return (
        <div>
            <h2>Join Back</h2>
            <ul>
                {games.map((game) => (
                    <li key={game.ID} style={{margin: '0.5em 0', padding: '0.5em', border: '1px solid #ccc', borderRadius: '0.3em'}} onClick={() => handleJoinGame(game.ID)}>
                        Game ID: {game.ID}, Host: {game.Host.Username}, Opponent: {game.Opponent.Username}
                    </li>
                ))}
            </ul>
        </div>
    );
}