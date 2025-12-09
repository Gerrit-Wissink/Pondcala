import { useEffect, useState } from "react";
import { getCookie } from "../utils/apiClient";
import apiClient from "../utils/apiClient";
import Chat from "../components/chat";
import HostGame from "../components/hostGame";
import FindGame from "../components/findGame";
import ActiveGames from "../components/activeGames";
import { connectWebSocket, getWebSocket } from "../utils/WebSockets";
import GameInvitationModal from "../components/gameInvitationModal";

export default function Lobby() {
    const [showHostGame, setShowHostGame] = useState(false);
    const [showFindGame, setShowFindGame] = useState(false);
    const [activeGames, setActiveGames] = useState([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [inviteStatus, setInviteStatus] = useState<string>("");

    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        document.title = "Pondcala Lobby";
        //Check for login token/cookie here
        const token = getCookie("session_token");
        if (!token || token.length < 1) {
            //Redirect to login page
            window.location.href = "/#/login";
        }else {
            localStorage.setItem("token", token);
        }

        // Load current user from localStorage once on mount
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        console.log("WebSocket initialization useEffect triggered");
        const token = getCookie("session_token");
        console.log("Session token:", token ? "Found" : "Not found");
        
        if (token && token.length > 0) {
            const existingWs = getWebSocket();
            console.log("Existing WebSocket:", existingWs);
            console.log("WebSocket readyState:", existingWs?.readyState);
            
            if (!existingWs || existingWs.readyState === WebSocket.CLOSED) {
                console.log("Attempting to connect WebSocket...");
                connectWebSocket();
            } else {
                console.log("WebSocket already connected, state:", existingWs.readyState);
            }
        } else {
            console.log("No session token, skipping WebSocket connection");
        }
    }, []);

    useEffect(() => {
        async function getActiveGames() {
            try {
                const token = localStorage.getItem("token") || getCookie("session_token");
                if (!token || !currentUser || !currentUser.id) return;
                const response = await apiClient.get(`/api/game/user-games?user_id=${currentUser.id}`);
                console.log("Active games fetched:", response.data.games);
                setActiveGames(response.data.games || []);
            } catch (error) {
                console.error("Error fetching active games:", error);
            }
        }
        if (currentUser) {
            getActiveGames();
        }
    }, [currentUser]);

    useEffect(() => {
        const handleInviteReceived = (event: Event) => {
            const customEvent = event as CustomEvent;
            const invite = customEvent.detail;
            
            setTimeout(() => {// If invite is from current user, update inviteStatus instead
                if (currentUser && invite.sender === currentUser.id) {
                    setInviteStatus(invite.status || 'sent');
                    return;
                }
                
                // Filter out duplicates based on sender
                setInvitations((prevInvitations) => {
                    const isDuplicate = prevInvitations.some(
                        (existingInvite: any) => existingInvite.sender === invite.sender
                    );
                    
                    if (isDuplicate) {
                        return prevInvitations;
                    }
                    
                    return [...prevInvitations, invite];
                });
            }, 0);
        };

        window.addEventListener('invite-received', handleInviteReceived);

        return () => {
            window.removeEventListener('invite-received', handleInviteReceived);
        };
    }, [currentUser]);

    useEffect(() => {
        const handleInviteUpdated = (event: Event) => {
            const customEvent = event as CustomEvent;
            const invite = customEvent.detail;
            const status = (invite.status || '').toLowerCase();
            
            setTimeout(() => {
                // If invite is from current user, update inviteStatus
                if (currentUser && invite.sender === currentUser.id) {
                    setInviteStatus(status);
                    return;
                }
                
                // If declined or timeout, remove the invitation from the array
                if (status === 'declined' || status === 'timeout') {
                    setInvitations((prevInvitations) => 
                        prevInvitations.filter((inv: any) => inv.sender !== invite.sender)
                    );
                }
            });
            // If accepted, do nothing (invitation already removed by acceptInvitation)
        };

        window.addEventListener('invite-updated', handleInviteUpdated);

        return () => {
            window.removeEventListener('invite-updated', handleInviteUpdated);
        };
    }, [currentUser]);

    useEffect(() => {
        const handleGameCreated = (event: Event) => {
            const customEvent = event as CustomEvent;
            const gameData = customEvent.detail;
            
            // Redirect to the game page with the gameID
            if (gameData.gameId) {
                window.location.href = `/#/game?gameID=${gameData.gameId}`;
            }
        };

        window.addEventListener('game-created', handleGameCreated);

        return () => {
            window.removeEventListener('game-created', handleGameCreated);
        };
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
            <HostGame inviteStatus={inviteStatus} />
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
            <div>
                {activeGames.length > 0 &&
                    <ActiveGames games={activeGames} />
                }
            </div>
            <div className="">
                {showHostGame ? hostGame : showFindGame ? findGame : lobby}
                <Chat type="lobby"/>
            </div>
            {invitations.map((invite, index) => (
                <GameInvitationModal key={index} invite={invite} setInvitations={setInvitations} />
            ))}
        </>
    );
}