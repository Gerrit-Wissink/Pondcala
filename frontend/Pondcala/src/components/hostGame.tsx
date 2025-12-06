import { useState, useEffect } from "react"
import apiClient from "../utils/apiClient";
import "./toggle.css";

export default function HostGame() {
    const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);
    const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);
    const [allowAnyone, setAllowAnyone] = useState<boolean>(false);
    const [inviteStatus, setInviteStatus] = useState<string>("");
    
    // useEffect(() => {
    //     // Fetch available players from the server
    //     apiClient.get('/api/users/usernames')
    //         .then(response => {
    //             setAvailablePlayers(response.data.players);
    //         })
    //         .catch(error => {
    //             console.error("Error fetching available players:", error);
    //         });
    // }, []);


    return (
        <div style={{background: '#000000A6', color: "white", padding: "10px", borderRadius: "15px", margin: "5px"}}>
            <h1>Host a Game</h1>
            <div>
                <h2>Invite a Player</h2>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row'}}>
                    <select style={{padding: '5px', borderRadius: '5px'}}>
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
                </div>
                {/* <!-- Rounded switch --> */}
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', flexDirection: 'row'}}>
                    <strong>Allow Anyone to Join</strong>
                    <label className="switch">
                        <input type="checkbox" checked={allowAnyone} onChange={() => setAllowAnyone(!allowAnyone)} />
                        <span className="slider round"></span>
                    </label>
                </div>
                <h2>{inviteStatus}</h2>
            </div>
        </div>
    )
}