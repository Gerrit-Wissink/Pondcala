import { useRef, useState } from "react";
import { motion } from "framer-motion";
import LargePond from "../components/svg/largePond";
import YourPondRow from "../components/yourPondRow";
import OpponentPondRow from "../components/opponentPondRow";
import Fish from "../components/svg/fish";

export default function Game() {
    const [counts, setCounts] = useState(Array(6).fill(4));
    const [opponentCounts, setOpponentCounts] = useState(Array(6).fill(4));
    const [opHighlighted, setOpHighlighted] = useState<number | null>(null);
    const [yourScore, setYourScore] = useState(0);
    const [turnCounter, setTurnCounter] = useState(1);
    const [fishSize, setFishSize] = useState(1);

    const yourPondRefs = useRef<Array<SVGEllipseElement | null>>([]);
    const opponentPondRefs = useRef<Array<SVGEllipseElement | null>>([]);
    const leftLargeRef = useRef<SVGEllipseElement | null>(null);
    const rightLargeRef = useRef<SVGEllipseElement | null>(null);

    const [animPath, setAnimPath] = useState<null | {points: {x:number,y:number}[], id: number}>(null);

    // triggerAnimate computes center points and starts overlay animation
    function triggerAnimate(fromEl: HTMLElement | SVGElement | null, toEl: HTMLElement | SVGElement | null, fishRemaining: number) {
        if (!fromEl || !toEl) return;
        setFishSize(fishRemaining + 1);
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        const from = { x: fromRect.left + fromRect.width / 2 + window.scrollX, y: fromRect.top + fromRect.height / 2 + window.scrollY };
        const to = { x: toRect.left + toRect.width / 2 + window.scrollX, y: toRect.top + toRect.height / 2 + window.scrollY };

        const pts = calculatePath(from, to);
        
        setAnimPath({ points: pts, id: Date.now() });
        // auto clear after duration (slightly longer than animation)
        setTimeout(() => setAnimPath(null), 1000);
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

    const smallPondParams = {
        counts: {
            get: counts,
            set: setCounts
        },
        score: {
            get: yourScore,
            set: setYourScore
        },
        opCounts: {
            get: opponentCounts,
            set: setOpponentCounts
        },
        turn: {
            get: turnCounter,
            set: setTurnCounter
        }
    };

    return (
        <>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row'}}>
            {/* Use 8-digit hex (#RRGGBBAA) for background alpha so only the background is translucent */}
            <div style={{background: '#000000A6', color: "white", padding: "10px", borderRadius: "15px", margin: "5px"}}>
                <h2>Opponent Name</h2>
                <h2>Turn Timer</h2>
            </div>
            <h1>Turn {turnCounter}</h1>
            <button>{/* Menu Icon */}</button>
        </div>
        <div style = {{display: 'grid', gap: '0vw', gridTemplateColumns: '1fr 3fr 1fr'}}>
            <LargePond ref={leftLargeRef} score={null} />
            <div style = {{display: 'flex', gap: '5vw', flexDirection: 'column', flex: '1'}}>
            <OpponentPondRow counts={opponentCounts} highlightedIndex={opHighlighted} pondRefs={opponentPondRefs} />
            <YourPondRow props={smallPondParams} setOpponentHighlight={setOpHighlighted} yourPondRefs={yourPondRefs} opponentPondRefs={opponentPondRefs} leftLargeRef={leftLargeRef} triggerAnimate={triggerAnimate} />
            </div>
            <LargePond ref={rightLargeRef} score={yourScore} />
        </div>

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
                    initial={{ x: animPath.points[0].x, y: animPath.points[0].y, opacity: 1 }}
                    animate={{
                        x: animPath.points.map(p => p.x),
                        y: animPath.points.map(p => p.y),
                        opacity: [1, 1, 0]
                    }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{ position: 'fixed', left: 0, top: 0, width: 40, height: 40, translateX: '-50%', translateY: '-50%' }}
                >
                    <div style={{width: '100%', height: '100%'}}>
                        <Fish />
                    </div>
                </motion.div>
            </div>
        )}

        </>
    );
}