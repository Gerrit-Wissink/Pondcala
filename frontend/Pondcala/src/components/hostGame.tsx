import { useState, useEffect } from "react"
import apiClient from "../utils/apiClient";
import { sendMessage } from "../utils/WebSockets";
import "./toggle.css";

export default function HostGame({inviteStatus}: {inviteStatus: string}) {
    const [selectedOpponent, setSelectedOpponent] = useState<number | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [allowAnyone, setAllowAnyone] = useState<boolean>(false);

    useEffect(() => {
        async function fetchUsers() {
            try {
                console.log("Fetching users for invitation list...");
                const response = await apiClient.get("/api/users/online");
                console.log("Response", response);
                const users = response.data.users || [];
                const filteredUsers = users.filter((user: any) => user.id !== (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || '{}').id : null));
                setUsers(filteredUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        }
        fetchUsers();
    }, []);


    async function invitePlayer(opponent: number) {
        console.log(`Inviting opponent with ID ${opponent} to a game...`);
        
        const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || '{}') : null;
        
        if (!currentUser || !currentUser.id) {
            console.error("Current user not found");
            return;
        }
        
        const inviteMessage = {
            type: "invite",
            sender: currentUser.id,
            recipient: opponent,
            sentAt: new Date().toISOString(),
            status: "sent"
        };
        
        sendMessage(inviteMessage);
    }
    
    
    return (
        <div style={{background: '#000000A6', color: "white", padding: "10px", borderRadius: "15px", margin: "5px"}}>
            <h1>Host a Game</h1>
            <div>
                <h2>Invite a Player</h2>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row'}}>
                    <select 
                        style={{padding: '5px', borderRadius: '5px'}} 
                        onChange={(e) => setSelectedOpponent(Number(e.target.value))}
                        value={selectedOpponent || ""}
                    >
                        <option value="" disabled selected>Select a player</option>
                        {users.map((player, index) => (
                            <option 
                                key={index}
                                value={player.id}
                            >
                                {player.username}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => {
                            if (selectedOpponent) {
                                invitePlayer(selectedOpponent);
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