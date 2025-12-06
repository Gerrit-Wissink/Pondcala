import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import LargePond from "../components/svg/largePond";
import YourPondRow from "../components/yourPondRow";
import OpponentPondRow from "../components/opponentPondRow";
import Fish from "../components/svg/fish";
import Chat from "../components/Chat";
import LoadingModal from "../components/loadingModal";
import apiClient, { getCookie } from "../utils/apiClient";
import { sendMessage, connectWebSocket, getWebSocket } from "../utils/WebSockets";

export default function Game() {
    const [counts, setCounts] = useState(Array(6).fill(4));
    const [opponentCounts, setOpponentCounts] = useState(Array(6).fill(4));
    const [opHighlighted, setOpHighlighted] = useState<number | null>(null);
    const [yourHighlighted, setYourHighlighted] = useState<number | null>(null);
    const [yourScore, setYourScore] = useState(0);
    const [turnCounter, setTurnCounter] = useState(1);
    const [fishSize, setFishSize] = useState(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [animPath, setAnimPath] = useState<null | {points: {x:number,y:number}[], id: number}>(null);
    const [gameID] = useState<string | null>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get("gameID") ?? params.get("gameId") ?? params.get("id");
    });
    const [turnTaker, setTurnTaker] = useState<string | null>(null);
    const [isHost, setIsHost] = useState<boolean>(false);
    const [players, setPlayers] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const loadingTimeoutRef = useRef<number | null>(null);

    const yourPondRefs = useRef<Array<SVGEllipseElement | null>>([]);
    const opponentPondRefs = useRef<Array<SVGEllipseElement | null>>([]);
    const leftLargeRef = useRef<SVGEllipseElement | null>(null);
    const rightLargeRef = useRef<SVGEllipseElement | null>(null);
    const opCountsRef = useRef(opponentCounts);

    const animationCleanupRef = useRef<number | null>(null);

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || '{}') : null;
    
    const whiteOnBlack = {background: '#000000A6', color: "white", padding: "10px", borderRadius: "15px", margin: "5px"};

    useEffect(() => {
        document.title = "Pondcala Game";
    }, []);

    useEffect(() => {
        const token = getCookie("session_token") || localStorage.getItem("token");
        if (token && token.length > 0) {
            const existingWs = getWebSocket();
            if (!existingWs || existingWs.readyState === WebSocket.CLOSED) {
                connectWebSocket();
            }
        }
    }, []);

    useEffect(() => {
        async function fetchUserByToken() {
            try {
                const token = localStorage.getItem("token") || "";
                apiClient.get(`/api/users/token?token=${token}`).then(response => {
                    const user = response.data.User;
                    console.log("Fetched user by token:", user);
                    if (user && user.id) {
                        // Successfully fetched user
                        localStorage.setItem("user", JSON.stringify(user));
                    } else {
                        // Invalid token, redirect to login
                        window.location.href = "/login";
                    }
                }).catch(error => {
                    console.error("Error fetching user by token:", error);
                    window.location.href = "/login";
                });
            } catch (error) {
                console.error("Error in fetchUserByToken:", error);
                window.location.href = "/login";
            }
        }
        if (!currentUser || !currentUser.id) {
            fetchUserByToken();
        }
    }, []);

    useEffect(() => {
         async function fetchGameState() {
            // Placeholder for fetching game state from server
            try {
                const result = await apiClient.get(`/api/game/state?gameID=${gameID}`);
                const gameState = result.data.game_state;
                console.log("Fetched game state:", gameState);
                if (!currentUser || !currentUser.id || currentUser.id !== gameState.Host.id && currentUser.id !== gameState.Opponent.id) {
                    alert("You are not a participant in this game.");
                    window.location.href = "/";
                    return;
                }
                const isHostPlayer = currentUser.id === gameState.Host.id;
                setIsHost(isHostPlayer);
                setPlayers([gameState.Host.id, gameState.Opponent.id]);
                setTurnTaker(gameState.WhoseTurn === gameState.Host.id ? gameState.Host.username : gameState.Opponent.username);
                setCounts(isHostPlayer ? gameState.HostPonds : gameState.OpponentPonds);
                setOpponentCounts(isHostPlayer ? gameState.OpponentPonds : gameState.HostPonds);
                setYourScore(isHostPlayer ? gameState.HostScore : gameState.OpponentScore);
            }catch (error) {
                console.error("Error fetching game state:", error);
            }
        }
        fetchGameState();
    }, []);
    
    
    // Keep ref in sync with state
    useEffect(() => {
        opCountsRef.current = opponentCounts;
    }, [opponentCounts]);

    // Listen for game-turn WebSocket messages
    useEffect(() => {
        const handleGameTurn = async (event: CustomEvent) => {
            const turnData = event.detail;
            console.log("Received game-turn message:", turnData);
            
            // Clear the loading timeout if it exists
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }
            setLoading(false);
            
            // Determine if this turn was taken by the current user or opponent
            const isTurnTaker = turnData.turnTaker === currentUser?.id;
            
            // Animate the turn
            await animateTurn(turnData, isTurnTaker);
            
            // Update board state from WebSocket message
            if (isHost) {
                setCounts(turnData.hostPools);
                setOpponentCounts(turnData.opponentPools);
                setYourScore(turnData.hostScore || 0);
            } else {
                setCounts(turnData.opponentPools);
                setOpponentCounts(turnData.hostPools);
                setYourScore(turnData.opponentScore || 0);
            }
            
            // Update whose turn it is
            if (turnData.whoseTurn) {
                fetchGameStateForTurn(turnData.whoseTurn);
            }
            
            setTurnCounter(prev => prev + 1);
            setIsAnimating(false);
        };

        const fetchGameStateForTurn = async (whoseTurnId: number) => {
            try {
                const result = await apiClient.get(`/api/game/state?gameID=${gameID}`);
                const gameState = result.data.game_state;
                setTurnTaker(gameState.WhoseTurn === gameState.Host.id ? gameState.Host.username : gameState.Opponent.username);
            } catch (error) {
                console.error("Error fetching game state for turn:", error);
            }
        };

        window.addEventListener('game-turn', handleGameTurn as any);
        
        return () => {
            window.removeEventListener('game-turn', handleGameTurn as any);
        };
    }, [gameID, isHost, currentUser]);

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (animationCleanupRef.current) {
                clearTimeout(animationCleanupRef.current);
            }
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
        }
    }, []);

    useEffect(() => {
        if(counts.length === 0 || opponentCounts.length === 0) return;
        const yourPondsTotal = counts.reduce((a,b) => a + b, 0);
        const opponentPondsTotal = opponentCounts.reduce((a,b) => a + b, 0);
        if (yourPondsTotal === 0 || opponentPondsTotal === 0) {
            alert("Game Over! Final Score: " + yourScore);
            // Reset game state
            // setCounts(Array(6).fill(4));
            // setOpponentCounts(Array(6).fill(4));
            // setYourScore(0);
            // setTurnCounter(1);
        }
    }, [turnCounter]);



    
    function handleEndOfGame() {
        // Placeholder for end-of-game logic
        //Need to clear out remaining fish and update scores
        //Then send websocket message to server about game end
    }

    async function SendTurn(index: number) {
        // Send turn via WebSocket instead of HTTP endpoint
        try {
            const token = localStorage.getItem("token") ?? getCookie("session_token");
            if (!token) {
                throw new Error("No authentication token found");
            }

            const username = currentUser.username;
            if (username !== turnTaker) {
                throw new Error("It's not your turn");
            }
            
            // Send WebSocket message
            const message = {
                type: "game-turn",
                gameId: parseInt(gameID || "0"),
                turnTaker: currentUser.id,
                selectedIndex: index,
                hostPools: isHost ? counts : opponentCounts,
                opponentPools: isHost ? opponentCounts : counts,
                userScore: yourScore,
                players: players,
            };
            
            const sent = sendMessage(message);
            if (!sent) {
                throw new Error("WebSocket not connected");
            }
            
            // Show loading modal after a short delay (e.g., 300ms)
            // This prevents the modal from flashing if the response is very quick
            loadingTimeoutRef.current = setTimeout(() => {
                setLoading(true);
            }, 300) as unknown as number;
            
            console.log("Turn sent via WebSocket:", message);
            return true;
        } catch (error) {
            console.error("Error sending turn:", error);
            return false;
        }
    }

    // triggerAnimate computes center points and starts overlay animation
    function triggerAnimate(fromEl: HTMLElement | SVGElement | null, toEl: HTMLElement | SVGElement | null, fishRemaining: number) {
        if (!fromEl || !toEl) return;
        
        // Clear any pending cleanup timeout
        if (animationCleanupRef.current) {
            clearTimeout(animationCleanupRef.current);
        }
        
        setFishSize(fishRemaining + 1);
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        const from = { x: fromRect.left + fromRect.width / 2 + window.scrollX, y: fromRect.top + fromRect.height / 2 + window.scrollY };
        const to = { x: toRect.left + toRect.width / 2 + window.scrollX, y: toRect.top + toRect.height / 2 + window.scrollY };

        const pts = calculatePath(from, to);
        
        setAnimPath({ points: pts, id: Date.now() });
        
        // Schedule cleanup after animation completes
        animationCleanupRef.current = setTimeout(() => {
            setAnimPath(null);
            animationCleanupRef.current = null;
        }, 900) as unknown as number; // Slightly longer than animation duration
    }

    function calculatePath(from: {x:number,y:number}, to: {x:number,y:number}) {
        // compute quadratic bezier control point (midpoint offset by normal)
        // Ensure the arc bulges in the negative Y direction (upwards on screen)
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const offset = Math.min(120, dist / 2);
        const nx = -dy / (dist || 1);
        const ny = dx / (dist || 1);

        // Choose the sign of the offset so the Y component is non-positive (moves upward)
        const signedOffset = (ny * offset > 0) ? -offset : offset;
        const cx = mx + nx * signedOffset;
        const cy = my + ny * signedOffset;

        // sample N points along quadratic bezier
        const samples = 36;
        const pts: {x:number,y:number}[] = [];
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            // Q(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
            const x = (1-t)*(1-t)*from.x + 2*(1-t)*t*cx + t*t*to.x;
            const y = (1-t)*(1-t)*from.y + 2*(1-t)*t*cy + t*t*to.y;
            pts.push({x,y});
        }

        return pts;
    }

    // Handle pond click - initiate turn (no animation, server will send back validated turn)
    async function handlePondClick(index: number) {
        if (isAnimating) return; // Prevent multiple animations at once
        
        console.log('Take turn called');
        setIsAnimating(true); // Set animating flag immediately
        
        const turnSent = await SendTurn(index);
        if (!turnSent) {
            console.error("Failed to send turn");
            setIsAnimating(false);
            return;
        }
        
        // Don't animate here - wait for server response via handleGameTurn
        // The animation will be triggered when the WebSocket message arrives
    }

    // Animate a turn based on server data
    async function animateTurn(turnData: any, isTurnTaker: boolean): Promise<void> {
        console.log("Animating turn:", turnData, "isTurnTaker:", isTurnTaker);
        
        const selectedIndex = turnData.selectedIndex;
        
        // Determine the before/after states to figure out fish movement
        // We need to simulate the turn to know the animation path
        
        // Get the previous state (before this turn)
        const prevHostPonds = isTurnTaker 
            ? (isHost ? counts : opponentCounts)
            : (isHost ? opponentCounts : counts);
        
        // Calculate fish to move
        const fishToMove = prevHostPonds[selectedIndex];
        if (fishToMove === 0) return; // No animation if no fish
        
        // Determine whose ponds to use for animation
        const animateAsYou = isTurnTaker;
        
        // Sync ref with current opponent state
        opCountsRef.current = [...(animateAsYou ? opponentCounts : counts)];
        
        // Perform the animation
        await animatedMoveFishGeneric(
            selectedIndex,
            fishToMove,
            animateAsYou
        );
    }

    // Generic animation function that works for both your turn and opponent turn
    async function animatedMoveFishGeneric(
        selectedIndex: number,
        fishCount: number,
        animateAsYourTurn: boolean
    ): Promise<void> {
        console.log("Animating generic:", selectedIndex, fishCount, "asYourTurn:", animateAsYourTurn);
        
        let currentIndex = selectedIndex + 1;
        let remainingFish = fishCount;
        let lastSourceIndex = selectedIndex;
        
        // Get references based on whose turn we're animating
        const playerPondRefs = animateAsYourTurn ? yourPondRefs : opponentPondRefs;
        const opponentPlayerPondRefs = animateAsYourTurn ? opponentPondRefs : yourPondRefs;
        const playerLargePond = animateAsYourTurn ? rightLargeRef : leftLargeRef;
        const setPlayerHighlighted = animateAsYourTurn ? setYourHighlighted : setOpHighlighted;
        const setOpponentPlayerHighlighted = animateAsYourTurn ? setOpHighlighted : setYourHighlighted;
        const setPlayerCounts = animateAsYourTurn ? setCounts : setOpponentCounts;
        const setOpponentPlayerCounts = animateAsYourTurn ? setOpponentCounts : setCounts;
        
        // Clear the selected pond visually
        setPlayerCounts((prev) => {
            const temp = [...prev];
            temp[selectedIndex] = 0;
            return temp;
        });
        
        while (remainingFish > 0) {
            const len = 6; // Always 6 ponds
            
            // Move fish in player's own ponds
            while (remainingFish > 0 && currentIndex < len) {
                await increaseIndexAnimatedGeneric(
                    lastSourceIndex,
                    currentIndex,
                    remainingFish,
                    playerPondRefs,
                    setPlayerHighlighted,
                    setPlayerCounts
                );
                remainingFish--;
                lastSourceIndex = currentIndex;
                currentIndex++;
                
                if (remainingFish === 0) return;
            }
            
            // Hit the edge - add to player's large pond
            if (currentIndex >= len) {
                console.log("Hit the edge - animating to large pond");
                
                // Animate to player's large pond
                const fromEl = playerPondRefs.current[lastSourceIndex];
                const toEl = playerLargePond.current;
                triggerAnimate(fromEl ?? null, toEl ?? null, remainingFish);
                await new Promise(resolve => setTimeout(resolve, 850));
                
                // Only update score if animating as your turn
                if (animateAsYourTurn) {
                    setYourScore(prev => prev + 1);
                }
                
                remainingFish--;
                
                if (remainingFish > 0) {
                    console.log("Moving to opponent ponds with", remainingFish, "fish remaining");
                    
                    // Animate to opponent's ponds (reversed order in Mancala)
                    remainingFish = await animatedIncreaseOpponentsPondsGeneric(
                        remainingFish,
                        playerLargePond.current,
                        opponentPlayerPondRefs,
                        setOpponentPlayerHighlighted,
                        opCountsRef
                    );
                    
                    // Update visual opponent state
                    setOpponentPlayerCounts([...opCountsRef.current]);
                    
                    currentIndex = 0;
                    lastSourceIndex = -1;
                }
            }
        }
    }

    async function increaseIndexAnimatedGeneric(
        prevIndex: number,
        index: number,
        currentFishRemaining: number,
        pondRefs: React.MutableRefObject<(SVGEllipseElement | null)[]>,
        setHighlighted: (index: number | null) => void,
        setCounts: React.Dispatch<React.SetStateAction<number[]>>
    ): Promise<void> {
        return new Promise((resolve) => {
            const fromEl = (prevIndex >= 0) ? pondRefs.current[prevIndex] : null;
            const toEl = (index >= 0) ? pondRefs.current[index] : null;
            triggerAnimate(fromEl ?? null, toEl ?? null, currentFishRemaining);

            setHighlighted(index);

            setTimeout(() => {
                setCounts(prev => {
                    const newCounts = [...prev];
                    newCounts[index] += 1;
                    return newCounts;
                });

                setTimeout(() => {
                    setHighlighted(null);
                    resolve();
                }, 200);
            }, 850);
        });
    }

    async function animatedIncreaseOpponentsPondsGeneric(
        fishCount: number,
        fromEl: HTMLElement | SVGElement | null,
        opponentPondRefs: React.MutableRefObject<(SVGEllipseElement | null)[]>,
        setOpponentHighlighted: (index: number | null) => void,
        opCountsRef: React.MutableRefObject<number[]>
    ): Promise<number> {
        console.log("Animating opponent ponds with", fishCount, "fish");
        const temp = [...opCountsRef.current].reverse();
        const len = temp.length;
        let remainingFish = fishCount;
        
        for (let i = 0; i < fishCount && i < len; i++) {
            const originalIndex = len - 1 - i;

            setOpponentHighlighted(originalIndex);

            let sourceEl: HTMLElement | SVGElement | null = null;
            if (i === 0) {
                sourceEl = fromEl;
            } else {
                const prevOpponentIndex = len - i;
                sourceEl = opponentPondRefs.current[prevOpponentIndex] ?? null;
            }

            const toEl = opponentPondRefs.current[originalIndex];
            triggerAnimate(sourceEl ?? null, toEl ?? null, remainingFish);

            await new Promise(resolve => setTimeout(resolve, 850));

            temp[i] += 1;
            remainingFish--;

            opCountsRef.current = [...temp].reverse();

            await new Promise(resolve => setTimeout(resolve, 200));
            setOpponentHighlighted(null);
        }
        
        opCountsRef.current = temp.reverse();
        return remainingFish;
    }

    const baseSize = 40;

    return (
        <div style={{width: "80%"}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row'}}>
            {/* Use 8-digit hex (#RRGGBBAA) for background alpha so only the background is translucent */}
            <div style={whiteOnBlack}>
                <h2>{turnTaker}</h2>
                <h2>Turn Timer</h2>
            </div>
            <h1 style={whiteOnBlack}>Turn {turnCounter}</h1>
            <button>{/* Menu Icon */}</button>
        </div>
        <div style = {{display: 'grid', gap: '0vw', gridTemplateColumns: '1fr 3fr 1fr'}}>
            <LargePond ref={leftLargeRef} score={null} />
            <div style = {{display: 'flex', gap: '5vw', flexDirection: 'column', flex: '1'}}>
            <OpponentPondRow counts={opponentCounts} highlightedIndex={opHighlighted} pondRefs={opponentPondRefs} />
            <YourPondRow 
                counts={counts} 
                highlightedIndex={yourHighlighted}
                yourPondRefs={yourPondRefs} 
                onPondClick={handlePondClick}
                isAnimating={isAnimating}
            />
            </div>
            <LargePond ref={rightLargeRef} score={yourScore} />
        </div>
        <Chat type="game" />

        {/* Overlay animator (absolute) */}
        {animPath && (
            <div style={{position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
                {/* draw a subtle path for visual */}
                <svg width="100%" height="100%" style={{position:'absolute', left:0, top:0, pointerEvents:'none'}}>
                    <path d={(() => {
                        const p = animPath.points;
                        return `M ${p[0].x} ${p[0].y} ` + p.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ');
                    })()} stroke="rgba(255,165,0,0.85)" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {/* Framer-motion mover */}
                <motion.div
                    key={animPath.id}
                    initial={{ x: animPath.points[0].x, y: animPath.points[0].y, opacity: 1 }}
                    animate={{
                        x: animPath.points.map(p => p.x),
                        y: animPath.points.map(p => p.y),
                        opacity: [1, 1, 1, 0]  // Stay fully visible, then fade at the end
                    }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{ position: 'fixed', left: 0, top: 0, width: Math.max(8, baseSize * fishSize), height: Math.max(8, baseSize * fishSize), translateX: '-50%', translateY: '-50%' }}
                >
                    <div style={{width: '100%', height: '100%'}}>
                        <Fish scale={fishSize} />
                    </div>
                </motion.div>
            </div>
        )}
        <LoadingModal isLoading={loading} />

        </div>
    );
}