import { useState, useEffect } from "react"
import "./toggle.css";

export default function FindGame() {
    const [publicGames, setPublicGames] = useState<string[]>([]);
    
    useEffect(() => {
        // Placeholder: Fetch public games from server
        const fetchPublicGames = async () => {
            // Simulate fetching public games
            const games = ["Player1", "Player2", "Player3"];
            setPublicGames(games);
        };

        fetchPublicGames();
    }, []);

    return (
        <div>
            <h1>Available Public Games</h1>
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>Host</th>
                            <th>Players</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {publicGames.map((game, index) => (
                            <tr key={index}>
                                <td>{game}</td>
                                <td>1/2</td>
                                <td>
                                    <button
                                        onClick={() => {
                                            console.log(`Joining game hosted by ${game}...`);
                                            // Add join game logic here
                                        }}
                                    >
                                        Join Game
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}