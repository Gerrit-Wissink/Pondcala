import { useEffect, useState } from "react";
import { getCookie } from "../utils/apiClient";
import Chat from "../components/Chat";
import HostGame from "../components/hostGame";
import FindGame from "../components/findGame";

export default function Lobby() {
    const [showHostGame, setShowHostGame] = useState(false);
    const [showFindGame, setShowFindGame] = useState(false);

    useEffect(() => {
        document.title = "Pondcala Lobby";
        //Check for login token/cookie here
        const token = getCookie("session_token");
        if (!token || token.length < 1) {
            //Redirect to login page
            window.location.href = "/login";
        }else {
            localStorage.setItem("token", token);
        }
    }, []);

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
        </nav>
            <div className="">
                {showHostGame ? hostGame : showFindGame ? findGame : lobby}
                <Chat type="lobby"/>
            </div>
        </>
    );
}