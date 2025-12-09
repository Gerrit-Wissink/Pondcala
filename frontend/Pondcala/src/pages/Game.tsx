import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import LargePond from "../components/svg/largePond";
import YourPondRow from "../components/yourPondRow";
import OpponentPondRow from "../components/opponentPondRow";
import Fish from "../components/svg/fish";
import Chat from "../components/chat";
import LoadingModal from "../components/loadingModal";
import apiClient, { getCookie } from "../utils/apiClient";
import { sendMessage, connectWebSocket, getWebSocket } from "../utils/WebSockets";
import GameOverModal from "../components/gameOverModal";
import SettingsMenuModal from "../components/settingsMenuModal";

export default function Game() {
    const [counts, setCounts] = useState(Array(6).fill(4));
    const [opponentCounts, setOpponentCounts] = useState(Array(6).fill(4));
    const [opHighlighted, setOpHighlighted] = useState<number | null>(null);
    const [yourHighlighted, setYourHighlighted] = useState<number | null>(null);
    const [yourScore, setYourScore] = useState(0);
    const [displayedScore, setDisplayedScore] = useState(0); // Animated score display
    const [turnCounter, setTurnCounter] = useState(1);
    const [fishSize, setFishSize] = useState(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [animPath, setAnimPath] = useState<null | {points: {x:number,y:number}[], id: number}>(null);
    const [gameID] = useState<string | null>(() => {
        // For hash routing, query params are in the hash, not window.location.search
        const hash = window.location.hash; // e.g., "#/game?gameID=1"
        const queryStart = hash.indexOf('?');
        if (queryStart === -1) return null;
        
        const queryString = hash.substring(queryStart);
        const params = new URLSearchParams(queryString);
        return params.get("gameID") ?? params.get("gameId") ?? params.get("id");
    });
    const [turnTaker, setTurnTaker] = useState<string | null>(null);
    const [whoseTurnID, setWhoseTurnID] = useState<number | null>(null);
    const [isHost, setIsHost] = useState<boolean>(false);
    const [players, setPlayers] = useState<number[]>([]);
    const [playerNames, setPlayerNames] = useState<Map<number, string>>(new Map());
    const [winner, setWinner] = useState<number | null>(null);

    const [loading, setLoading] = useState<boolean>(false);
    const [isEndingModalOpen, setIsEndingModalOpen] = useState<boolean>(false);
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState<boolean>(false);

    const loadingTimeoutRef = useRef<number | null>(null);

    const yourPondRefs = useRef<Array<SVGEllipseElement | null>>([]);
    const opponentPondRefs = useRef<Array<SVGEllipseElement | null>>([]);
    const leftLargeRef = useRef<SVGEllipseElement | null>(null);
    const rightLargeRef = useRef<SVGEllipseElement | null>(null);
    const opCountsRef = useRef(opponentCounts);

    const animationCleanupRef = useRef<number | null>(null);

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || '{}') : null;
    
    const whiteOnBlack = {background: '#000000A6', color: "white", padding: "10px", borderRadius: "15px", margin: "5px"};

    // Sync displayedScore with yourScore when score changes from non-animated sources
    useEffect(() => {
        // Only update displayedScore if it's significantly different (not during animation)
        if (Math.abs(displayedScore - yourScore) <= 1) {
            setDisplayedScore(yourScore);
        }
    }, [yourScore, displayedScore]);

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
                        window.location.href = "/#/login";
                    }
                }).catch(error => {
                    console.error("Error fetching user by token:", error);
                    window.location.href = "/#/login";
                });
            } catch (error) {
                console.error("Error in fetchUserByToken:", error);
                window.location.href = "/#/login";
            }
        }
        if (!currentUser || !currentUser.id) {
            fetchUserByToken();
        }
    }, []); //Fetch currentUser useEffect

    useEffect(() => {
         async function fetchGameState() {
            // Placeholder for fetching game state from server
            if (!gameID) {
                console.error("No gameID found in URL");
                alert("Invalid game ID");
                window.location.href = "/#/";
                return;
            }
            
            try {
                const result = await apiClient.get(`/api/game/state?gameID=${gameID}`);
                console.log("Full API response:", result);
                console.log("Response data:", result.data);
                const gameState = result.data.game_state;
                console.log("Fetched game state:", gameState);
                if (!gameState) {
                    console.error("Game state is undefined! Full response:", result.data);
                    alert("Failed to load game state");
                    return;
                }
                if (!currentUser || !currentUser.id || currentUser.id !== gameState.Host.id && currentUser.id !== gameState.Opponent.id) {
                    alert("You are not a participant in this game.");
                    window.location.href = "/#/";
                    return;
                }
                const isHostPlayer = currentUser.id === gameState.Host.id;
                setIsHost(isHostPlayer);
                setPlayers([gameState.Host.id, gameState.Opponent.id]);
                setPlayerNames(new Map([
                    [gameState.Host.id, gameState.Host.username],
                    [gameState.Opponent.id, gameState.Opponent.username]
                ]));
                setWinner(gameState.Winner);
                
                // If game has already ended, show the modal
                if (gameState.Winner !== null && gameState.Winner !== undefined) {
                    setIsEndingModalOpen(true);
                }
                
                // Check if we need to animate the last turn
                if (gameState.LastTwoTurns && gameState.LastTwoTurns.length > 1) {
                    // Set the board state to the previous turn (before the last turn)
                    const prevTurn = gameState.LastTwoTurns[0];
                    setCounts(isHostPlayer ? prevTurn.host_ponds : prevTurn.opponent_ponds);
                    setOpponentCounts(isHostPlayer ? prevTurn.opponent_ponds : prevTurn.host_ponds);
                    setYourScore(isHostPlayer ? prevTurn.host_score : prevTurn.opponent_score);
                    setWhoseTurnID(gameState.WhoseTurn);
                    setTurnCounter(gameState.TurnNumber - 1)

                    // Get the last turn to animate
                    const lastTurn = gameState.LastTwoTurns[gameState.LastTwoTurns.length - 1];
                    
                    // Wait a brief moment for the UI to render the previous state
                    setTimeout(async () => {
                        // Determine if the turn taker was the current user
                        const isTurnTaker = lastTurn.turn_taker === currentUser.id;
                        
                        // Animate the last turn
                        setIsAnimating(true);
                        await animateTurn(lastTurn, isTurnTaker);
                        setIsAnimating(false);
                        
                        // Set the final board state
                        setCounts(isHostPlayer ? lastTurn.host_ponds : lastTurn.opponent_ponds);
                        setOpponentCounts(isHostPlayer ? lastTurn.opponent_ponds : lastTurn.host_ponds);
                        setYourScore(isHostPlayer ? lastTurn.host_score : lastTurn.opponent_score);
                        setWhoseTurnID(gameState.WhoseTurn);
                        setTurnCounter(gameState.TurnNumber);
                    }, 100);
                } else {
                    // No animation needed, just set the current state
                    setCounts(isHostPlayer ? gameState.HostPonds : gameState.OpponentPonds);
                    setOpponentCounts(isHostPlayer ? gameState.OpponentPonds : gameState.HostPonds);
                    setYourScore(isHostPlayer ? gameState.HostScore : gameState.OpponentScore);
                    setWhoseTurnID(gameState.WhoseTurn);
                    setTurnCounter(gameState.TurnNumber);
                }
            }catch (error) {
                console.error("Error fetching game state:", error);
            }
        }
        fetchGameState();
    }, []); //Fetch gameState useEffect
    
    
    // Keep ref in sync with state
    useEffect(() => {
        opCountsRef.current = opponentCounts;
    }, [opponentCounts]);

    // Keep whoseTurnID and turnTaker in sync
    useEffect(() => {
        if (whoseTurnID === null || playerNames.size === 0) return;
        
        const turnTakerUsername = playerNames.get(whoseTurnID);
        if (turnTakerUsername && turnTaker !== turnTakerUsername) {
            setTurnTaker(turnTakerUsername);
        }
    }, [whoseTurnID, playerNames]);

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
                await fetchGameStateForTurn();
            }
            
            setTurnCounter(prev => prev + 1);
            setIsAnimating(false);
        };

        const fetchGameStateForTurn = async () => {
            if (!gameID) {
                console.error("No gameID available for fetching game state");
                return;
            }
            
            try {
                const result = await apiClient.get(`/api/game/state?gameID=${gameID}`);
                const gameState = result.data.game_state;
                setWhoseTurnID(gameState.WhoseTurn);
            } catch (error) {
                console.error("Error fetching game state for turn:", error);
            }
        };

        window.addEventListener('game-turn', handleGameTurn as any);
        
        return () => {
            window.removeEventListener('game-turn', handleGameTurn as any);
        };
    }, [gameID, isHost, currentUser]); //Listen for game-turn WebSocket messages

    // Listen for game-end WebSocket messages
    useEffect(() => {
        const handleGameEnd = (event: CustomEvent) => {
            const endData = event.detail;
            console.log("Received game-end message:", endData);
            
            // Update final scores
            if (isHost) {
                setYourScore(endData.hostScore || 0);
            } else {
                setYourScore(endData.opponentScore || 0);
            }
            
            // Clear all ponds
            setCounts(Array(6).fill(0));
            setOpponentCounts(Array(6).fill(0));
            
            // Set winner and show modal
            setWinner(endData.winner);
            setIsEndingModalOpen(true);
        };

        window.addEventListener('game-end', handleGameEnd as any);
        
        return () => {
            window.removeEventListener('game-end', handleGameEnd as any);
        };
    }, [isHost]); //Listen for game-end WebSocket messages

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

    function handleRematch() {
        // Placeholder for rematch logic
        // Could involve sending a WebSocket message to the server to create a new game with the same players
        console.log("Rematch requested");
        window.location.href = `/#/`; // Redirect to lobby for now
    }

    function handleBackToLobby() {
        window.location.href = `/#/`;
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

    // Animate score increase with easing
    async function animateScoreIncrease(targetScore: number): Promise<void> {
        const startScore = yourScore;
        const difference = targetScore - startScore;
        
        if (difference <= 0) {
            setDisplayedScore(targetScore);
            return;
        }
        
        const duration = 800; // Total animation duration in ms
        const startTime = Date.now();
        
        // Easing function (ease-in-out cubic)
        const easeInOutCubic = (t: number): number => {
            return t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };
        
        return new Promise((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeInOutCubic(progress);
                
                const currentScore = Math.round(startScore + difference * easedProgress);
                setDisplayedScore(currentScore);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    setDisplayedScore(targetScore);
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
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
        
        // Handle both snake_case (from database) and camelCase (from WebSocket)
        const selectedIndex = turnData.selectedIndex ?? turnData.selected_index;
        
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
        
        // Use the actual selectedIndex from the server, don't mirror it
        // The pond refs are already displayed in the correct positions
        // so index 0 on server = index 0 in the ref array
        
        // Sync ref with current opponent state
        opCountsRef.current = [...(animateAsYou ? opponentCounts : counts)];
        
        // Perform the animation
        await animatedMoveFishGeneric(
            selectedIndex,  // Use actual index, not mirrored
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
        
        // When viewing opponent's turn, we need to go right-to-left (5->4->3->2->1)
        // So convert their index 0 to start at 5, index 1 to start at 4, etc.
        const startIndex = animateAsYourTurn ? selectedIndex : (5 - selectedIndex);
        const direction = animateAsYourTurn ? 1 : -1; // 1 for increment, -1 for decrement
        
        let currentIndex = startIndex + direction;
        let remainingFish = fishCount;
        let lastSourceIndex = startIndex;
        let lastPondIndex = -1;
        let lastPondWasPlayerSide = false;
        
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
            temp[startIndex] = 0;
            return temp;
        });
        
        while (remainingFish > 0) {
            const len = 6; // Always 6 ponds
            
            // Move fish in player's own ponds
            // For your turn: go 0->1->2->3->4->5 (while currentIndex < len)
            // For opponent turn: go 5->4->3->2->1->0 (while currentIndex >= 0)
            const shouldContinueInPonds = animateAsYourTurn 
                ? (currentIndex < len) 
                : (currentIndex >= 0);
            
            while (remainingFish > 0 && shouldContinueInPonds) {
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
                lastPondIndex = currentIndex;
                lastPondWasPlayerSide = true;
                currentIndex += direction;
                
                if (remainingFish === 0) break;
                
                // Update continuation check
                const stillInPonds = animateAsYourTurn 
                    ? (currentIndex < len) 
                    : (currentIndex >= 0);
                if (!stillInPonds) break;
            }
            
            // Hit the edge - add to player's large pond
            const hitEdge = animateAsYourTurn ? (currentIndex >= len) : (currentIndex < 0);
            if (hitEdge && remainingFish > 0) {
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
                lastPondIndex = -1; // Large pond
                lastPondWasPlayerSide = false;
                
                if (remainingFish > 0) {
                    console.log("Moving to opponent ponds with", remainingFish, "fish remaining");
                    
                    // Animate to opponent's ponds (reversed order in Mancala)
                    const result = await animatedIncreaseOpponentsPondsGeneric(
                        remainingFish,
                        playerLargePond.current,
                        opponentPlayerPondRefs,
                        setOpponentPlayerHighlighted,
                        opCountsRef,
                        animateAsYourTurn
                    );
                    
                    remainingFish = result.remainingFish;
                    lastPondIndex = result.lastPondIndex;
                    lastPondWasPlayerSide = false;
                    
                    // Update visual opponent state
                    setOpponentPlayerCounts([...opCountsRef.current]);
                    
                    currentIndex = 0;
                    lastSourceIndex = -1;
                }
            }
        }
        
        // Capture rule: If the last stone landed in an empty pond on the player's side
        // (value is now 1) and it's not the large pond, capture that pond and the opposite pond
        if (lastPondWasPlayerSide && lastPondIndex >= 0 && lastPondIndex < 6) {
            setPlayerCounts((prevCounts) => {
                const currentValue = prevCounts[lastPondIndex];
                if (currentValue === 1) {
                    const oppositeIndex = 5 - lastPondIndex;
                    
                    // Get the current opponent counts
                    const currentOpponentCounts = animateAsYourTurn ? opCountsRef.current : [...counts];
                    const oppositePondValue = currentOpponentCounts[oppositeIndex];
                    
                    if (oppositePondValue > 0) {
                        const capturedStones = currentValue + oppositePondValue;
                        
                        // Update player's pond to 0
                        const newPlayerCounts = [...prevCounts];
                        newPlayerCounts[lastPondIndex] = 0;
                        
                        // Update opponent's pond to 0
                        setOpponentPlayerCounts((prevOpponentCounts) => {
                            const newOpponentCounts = [...prevOpponentCounts];
                            newOpponentCounts[oppositeIndex] = 0;
                            return newOpponentCounts;
                        });
                        
                        // Add captured stones to score (only if animating as your turn)
                        if (animateAsYourTurn) {
                            const newScore = yourScore + capturedStones;
                            setYourScore(newScore);
                            // Animate score increase for captures
                            animateScoreIncrease(newScore);
                        }
                        
                        return newPlayerCounts;
                    }
                }
                return prevCounts;
            });
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
        opCountsRef: React.MutableRefObject<number[]>,
        animateAsYourTurn: boolean
    ): Promise<{ remainingFish: number; lastPondIndex: number }> {
        console.log("Animating opponent ponds with", fishCount, "fish", "asYourTurn:", animateAsYourTurn);
        const temp = [...opCountsRef.current];
        const len = temp.length;
        let remainingFish = fishCount;
        let lastPondIndex = -1;
        
        // Backend always adds to opponent ponds in order: 0->1->2->3->4->5
        // The display is mirrored, so backend index 0 appears at visual position 5
        // When animating YOUR turn: highlight opponent ponds (refs are mirrored)
        // When animating OPPONENT turn: highlight your ponds (refs are not mirrored)
        for (let i = 0; i < fishCount && i < len; i++) {
            const actualIndex = i;
            
            // For highlighting: always use backend index (mirroring happens in JSX)
            setOpponentHighlighted(actualIndex);

            let sourceEl: HTMLElement | SVGElement | null = null;
            // For refs: when animating YOUR turn into opponent ponds, refs are reversed
            // When animating OPPONENT turn into your ponds, refs are not reversed
            const refIndex = animateAsYourTurn ? (len - 1 - i) : i;
            
            if (i === 0) {
                sourceEl = fromEl;
            } else {
                // Previous pond in sequence
                const prevRefIndex = animateAsYourTurn ? (refIndex + 1) : (refIndex - 1);
                sourceEl = opponentPondRefs.current[prevRefIndex] ?? null;
            }

            const toEl = opponentPondRefs.current[refIndex];
            triggerAnimate(sourceEl ?? null, toEl ?? null, remainingFish);

            await new Promise(resolve => setTimeout(resolve, 850));

            temp[actualIndex] += 1;
            remainingFish--;
            lastPondIndex = actualIndex;

            opCountsRef.current = [...temp];

            await new Promise(resolve => setTimeout(resolve, 200));
            setOpponentHighlighted(null);
        }
        
        opCountsRef.current = temp;
        return { remainingFish, lastPondIndex };
    }

    function handleForfeit() {
        // Send forfeit request to server
        try {
            const opponentID = players.find(p => p !== currentUser.id);
            if (!opponentID) {
                console.error("Could not find opponent ID");
                return;
            }

            apiClient.post(`/api/game/end`, {
                game_id: parseInt(gameID || "0"),
                user_id: currentUser.id,
                opponent_id: opponentID,
                reason: "forfeit",
            }).then(response => {
                console.log("Forfeit successful:", response.data);
                
                // The server should broadcast a game-end message via WebSocket
                // which will be handled by the game-end listener
                // The winner will be the opponent since current user forfeited
            }).catch(error => {
                console.error("Error forfeiting game:", error);
                alert("Failed to forfeit game. Please try again.");
            });
        } catch (error) {
            console.error("Error handling forfeit:", error);
        }
    }

    const baseSize = 40;

    return (
        <div style={{width: "80%"}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row'}}>
            <button onClick={() => setIsSettingsMenuOpen(true)}>Settings</button>
            <div style={whiteOnBlack}>
                <h2>Current Turn:</h2>
                <h2>{turnTaker}</h2>
            </div>
            <h1 style={whiteOnBlack}>Turn {turnCounter}</h1>
            
        </div>
        <div style = {{display: 'grid', gap: '0vw', gridTemplateColumns: '1fr 3fr 1fr'}}>
            <LargePond ref={leftLargeRef} score={null} />
            <div style = {{display: 'flex', gap: '5vw', flexDirection: 'column', flex: '1'}}>
            <OpponentPondRow counts={[...opponentCounts].reverse()} highlightedIndex={opHighlighted !== null ? 5 - opHighlighted : null} pondRefs={opponentPondRefs} />
            <YourPondRow 
                counts={counts} 
                highlightedIndex={yourHighlighted}
                yourPondRefs={yourPondRefs} 
                onPondClick={handlePondClick}
                disabled={isAnimating || winner !== null || currentUser.id !== whoseTurnID}
            />
            </div>
            <LargePond ref={rightLargeRef} score={displayedScore} />
        </div>
        <Chat type="game" gameID={gameID ? parseInt(gameID) : undefined} players={players} />

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
        <GameOverModal 
            isModalOpen={isEndingModalOpen} 
            gameStats={{ yourScore, opponentScore: opponentCounts.reduce((a, b) => a + b, 0), turns: turnCounter }} 
            handleRematch={handleRematch} 
            handleBackToLobby={handleBackToLobby} 
            youWon={winner === currentUser.id} 
            setIsEndingModalOpen={setIsEndingModalOpen} 
        />
        <SettingsMenuModal
            open={isSettingsMenuOpen}
            setOpen={setIsSettingsMenuOpen}
            playing={true}
            handleForfeit={handleForfeit}
        />

        </div>
    );
}