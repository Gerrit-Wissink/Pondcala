import { useState } from "react";
import LobbyChat from "../components/lobbbyChat";
import HostGame from "../components/hostGame";
import FindGame from "../components/findGame";

export default function Lobby() {
    const [showHostGame, setShowHostGame] = useState(false);
    const [showFindGame, setShowFindGame] = useState(false);

    const lobby = (
        <>
            <h1>Pondcala</h1>
            <div style={{display: 'flex', flexDirection: 'row', gap: '20px'}}>
                <button onClick={() => setShowHostGame(true)}>Host a Game</button>
                <button onClick={() => setShowFindGame(true)}>Find a Game</button>
            </div>
        </>
    );

    const hostGame = (
        <div>
            <HostGame />
        </div>
    );
    
    const findGame = (
        <div>
            <FindGame />
        </div>
    );
    
    return (
        <>
        <nav style={{position: "fixed", top: 15, left: 15, display: "flex", gap: "10px"}}>
            {showHostGame &&
                <button onClick={() => setShowHostGame(false)}>&larr; Back to Lobby</button>
            }
            {showFindGame &&
                <button onClick={() => setShowFindGame(false)}>&larr; Back to Lobby</button>
            }
            <button onClick={() => {
                console.log("Logging out...");
                // Add logout logic here
            }}>
                Logout
            </button>
        </nav>
            <div className="">
                
                {showHostGame ? hostGame : showFindGame ? findGame : lobby}
                <LobbyChat />
            </div>
        </>
    );
}