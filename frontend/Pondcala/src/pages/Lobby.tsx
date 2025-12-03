import { useState } from "react";
import LobbyChat from "../components/lobbbyChat";
import HostGame from "../components/hostGame";
import FindGame from "../components/findGame";

export default function Lobby() {
    const [showHostGame, setShowHostGame] = useState(false);
    const [showFindGame, setShowFindGame] = useState(false);

    const lobby = (
        <div style={{display: 'flex', flexDirection: 'row', gap: '20px'}}>
            <button>Host a Game</button>
            <button>Find a Game</button>
        </div>
    );

    const hostGame = (
        <div>
            <button onClick={() => setShowHostGame(false)}>&larr; Back to Lobby</button>
            <HostGame />
        </div>
    );
    
    const findGame = (
        <div>
            <button onClick={() => setShowFindGame(false)}>&larr; Back to Lobby</button>
            <FindGame />
        </div>
    );
    
    return (
        <>
        <nav>
            <button onClick={() => {
                console.log("Logging out...");
                // Add logout logic here
            }}>
                Logout
            </button>
        </nav>
            <div className="">
                <h1>Pondcala</h1>
                {showHostGame ? hostGame : showFindGame ? findGame : lobby}
                <LobbyChat />
            </div>
        </>
    );
}