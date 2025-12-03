import { useState, useEffect } from "react"
import "./toggle.css";

export default function HostGame() {
    const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);
    const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);
    const [allowAnyone, setAllowAnyone] = useState<boolean>(false);
    
    
    return (
        <div>
            <h1>Host a Game</h1>
            <div>
                <h2>Invite a Player</h2>
                <select>
                    <option value="" disabled selected>Select a player</option>
                    {availablePlayers.map((player, index) => (
                        <option 
                            key={index}
                            value={player}
                            onClick={() => setSelectedOpponent(player)}
                        >
                            {player}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => {
                        if (selectedOpponent) {
                            console.log(`Inviting ${selectedOpponent} to a game...`);
                            // Add invitation logic here
                        } else {
                            console.log("No opponent selected.");
                        }
                    }}
                >
                    Send Invite
                </button>
                {/* <!-- Rounded switch --> */}
                <div>
                    <p>Allow Anyone to Join</p>
                    <label className="switch">
                        <input type="checkbox" checked={allowAnyone} onChange={() => setAllowAnyone(!allowAnyone)} />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>
        </div>
    )
}