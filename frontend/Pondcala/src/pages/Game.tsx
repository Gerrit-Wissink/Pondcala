import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import LargePond from "../components/svg/largePond";
import YourPondRow from "../components/yourPondRow";
import OpponentPondRow from "../components/opponentPondRow";
import Fish from "../components/svg/fish";
import Chat from "../components/Chat";
import apiClient from "../utils/apiClient";

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
                const result = await apiClient.get(`/game/state?gameID=${gameID}`);
                const gameState = result.data.game_state;
                console.log("Fetched game state:", gameState);
                if (!currentUser || !currentUser.id || currentUser.id !== gameState.Host.id && currentUser.id !== gameState.Opponent.id) {
                    alert("You are not a participant in this game.");
                    window.location.href = "/";
                    return;
                }
                setTurnTaker(gameState.WhoseTurn === gameState.Host.id ? gameState.Host.username : gameState.Opponent.username);
                setCounts(currentUser.id === gameState.Host.id ? gameState.HostPonds : gameState.OpponentPonds);
                setOpponentCounts(currentUser.id === gameState.Host.id ? gameState.OpponentPonds : gameState.HostPonds);
                setYourScore(currentUser.id === gameState.Host.id ? gameState.HostScore : gameState.OpponentScore);
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

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (animationCleanupRef.current) {
                clearTimeout(animationCleanupRef.current);
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

    // Handle pond click - initiate turn
    async function handlePondClick(index: number) {
        if (isAnimating) return; // Prevent multiple animations at once
        
        console.log('Take turn called');
        setIsAnimating(true);
        
        // This points to ONE of the ponds in the counts array
        const fishToMove = counts[index];
        // lastSourceIndex tracks the current source element for animation (fromEl of the arc)
        let lastSourceIndex = index;
        
        // Sync ref with current state at start of turn
        opCountsRef.current = [...opponentCounts];
        
        // Clear the selected pond immediately
        setCounts((prev) => {
            const temp = [...prev];
            temp[index] = 0;
            return temp;
        });
        
        // Start animated movement
        await animatedMoveFish(index + 1, fishToMove, lastSourceIndex);
        
        // Update opponent state at the end
        setOpponentCounts([...opCountsRef.current]);
        setTurnCounter(prev => prev + 1);
        setIsAnimating(false);
    }

    async function animatedMoveFish(startIndex: number, fishCount: number, initialSourceIndex: number): Promise<void> {
        console.log("Animated move fish starting at index:", startIndex, "with", fishCount, "fish");
        let currentIndex = startIndex;
        // FishCount is the value of the selected pond
        let remainingFish = fishCount;
        let lastSourceIndex = initialSourceIndex;
        
        while (remainingFish > 0) {
            const len = counts.length;
            
            // Move fish in your ponds
            while (remainingFish > 0 && currentIndex < len) {
                await increaseIndexAnimated(lastSourceIndex, currentIndex, remainingFish);
                remainingFish--;

                lastSourceIndex = currentIndex;
                currentIndex++;
                
                if (remainingFish === 0) return;
            }
            
            // Hit the edge - add to score
            if (currentIndex >= len) {
                console.log("Hit the edge of the array");
                // Animate to the right large pond (score pond) first
                if (lastSourceIndex >= 0) {
                    const fromEl = yourPondRefs.current[lastSourceIndex];
                    const toEl = rightLargeRef.current;
                    triggerAnimate(fromEl ?? null, toEl ?? null, remainingFish);
                    // Wait for animation to complete (800ms) before incrementing score
                    await new Promise(resolve => setTimeout(resolve, 850));
                }
                
                setYourScore(prev => prev + 1);
                console.log("score increased");
                remainingFish--;

                
                if (remainingFish > 0) {
                    console.log("Moving to opponent ponds with", remainingFish, "fish remaining");
                    // Now animate from right large pond to opponent ponds
                    // Use rightLargeRef as the source for the first opponent pond animation
                    const fromRightLarge = rightLargeRef.current;
                    remainingFish = await animatedIncreaseOpponentsPonds(remainingFish, -1, fromRightLarge);

                    currentIndex = 0; // Reset to start of your ponds
                    lastSourceIndex = -1;
                }
            }
        }
    }

    async function increaseIndexAnimated(prevIndex: number, index: number, currentFishRemaining: number): Promise<void> {
        return new Promise((resolve) => {
            // Before highlighting, trigger path animation from prev to current
            const fromEl = (prevIndex >= 0) ? yourPondRefs.current[prevIndex] : null;
            const toEl = (index >= 0) ? yourPondRefs.current[index] : null;
            triggerAnimate(fromEl ?? null, toEl ?? null, currentFishRemaining);

            // Highlight the pond when fish starts moving
            setYourHighlighted(index);

            // Wait for animation to complete (800ms) before updating state
            setTimeout(() => {
                setCounts(prev => {
                    const newCounts = [...prev];
                    newCounts[index] += 1;
                    return newCounts;
                });

                // Remove highlight after state update
                setTimeout(() => {
                    setYourHighlighted(null);
                    resolve();
                }, 200); // Brief time to show the updated count
            }, 850); // Wait for fish animation to finish
        });
    }

    async function animatedIncreaseOpponentsPonds(fishCount: number, lastSourceIndex: number, overrideFromEl?: HTMLElement | SVGElement | null): Promise<number> {
        console.log("Animated opponent ponds with", fishCount, "fish");
        const temp = [...opCountsRef.current].reverse();
        const len = temp.length;
        let remainingFish = fishCount;
        
        for (let i = 0; i < fishCount && i < len; i++) {
            const originalIndex = len - 1 - i; // map reversed index back to opponent UI index

            // Highlight the opponent pond that will receive a fish
            setOpHighlighted(originalIndex);

            // Determine the source element for animation
            let fromEl: HTMLElement | SVGElement | null = null;
            if (i === 0 && overrideFromEl) {
                // For the first iteration, use the override (e.g., rightLargePond)
                fromEl = overrideFromEl;
            } else if (i > 0) {
                // For subsequent iterations, use the previous opponent pond
                const prevOpponentIndex = len - i;
                fromEl = opponentPondRefs.current[prevOpponentIndex] ?? null;
            } else if (lastSourceIndex >= 0) {
                // Fallback to the original source from your ponds
                fromEl = yourPondRefs.current[lastSourceIndex];
            } else {
                // Final fallback to left large pond
                fromEl = leftLargeRef.current;
            }

            const toEl = opponentPondRefs.current[originalIndex];
            triggerAnimate(fromEl ?? null, toEl ?? null, remainingFish);

            // Wait for animation to complete (800ms) before updating state
            await new Promise(resolve => setTimeout(resolve, 850));

            temp[i] += 1;
            remainingFish--;


            // Update the visual state (reverse back to original order)
            opCountsRef.current = [...temp].reverse();
            setOpponentCounts([...opCountsRef.current]);

            // Keep the highlight visible briefly after increment
            await new Promise(resolve => setTimeout(resolve, 200));
            setOpHighlighted(null);
        }
        
        // Update the ref with final state
        opCountsRef.current = temp.reverse();
        
        return remainingFish; // Return any fish that didn't fit
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

        </div>
    );
}