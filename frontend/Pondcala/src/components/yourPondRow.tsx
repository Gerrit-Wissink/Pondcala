import React, { useRef, useEffect, useState } from "react";
import SmallPond from "./svg/smallPond";

export default function YourPondRow(
    {
        props, 
        setOpponentHighlight, 
        yourPondRefs, 
        opponentPondRefs, 
        leftLargeRef,
        rightLargeRef,
        triggerAnimate
    }: 
    {
        props: {
            counts: {get: number[], set: React.Dispatch<React.SetStateAction<number[]>>}, 
            score: {get: number, set: React.Dispatch<React.SetStateAction<number>>}, 
            opCounts: {get: number[], set: React.Dispatch<React.SetStateAction<number[]>>}, 
            turn: {get: number, set: React.Dispatch<React.SetStateAction<number>>}
        }, 
        setOpponentHighlight?: (i: number | null) => void, 
        yourPondRefs?: React.MutableRefObject<Array<SVGEllipseElement | null>>, 
        opponentPondRefs?: React.MutableRefObject<Array<SVGEllipseElement | null>>, 
        leftLargeRef?: React.RefObject<SVGEllipseElement | null>, 
        rightLargeRef?: React.RefObject<SVGEllipseElement | null>,
        triggerAnimate?: (from: HTMLElement | SVGElement | null, to: HTMLElement | SVGElement | null, fishSize: number) => void
    }) {
    const opCountsRef = useRef(props.opCounts.get);
    const [isAnimating, setIsAnimating] = useState(false);
    const [highlightedPond, setHighlightedPond] = useState<number | null>(null);
    const [animateFishRemaining, setAnimateFishRemaining] = useState(0);
    
    // Keep ref in sync with state
    useEffect(() => {
        opCountsRef.current = props.opCounts.get;
    }, [props.opCounts.get]);
    
    return (
        <>
            <div style = {{display: 'flex', gap: '2vw'}}>
                {props.counts.get.map((value, index) =>
                        <div key={index}>
                            <SmallPond 
                                ref={el => { if (yourPondRefs) yourPondRefs.current[index] = el; }}
                                onClick={() => {
                                    if (!isAnimating) {
                                        takeTurn(index);
                                    }
                                }} 
                                count={value}
                                highlighted={highlightedPond === index}
                            />
                        </div>
                    )
                }
            </div>
        </>
    );

    async function takeTurn(index: number){
        if (isAnimating) return; // Prevent multiple animations at once
        
        console.log('Take turn called');
        setIsAnimating(true);
        
        // This points to ONE of the ponds in the counts.get array
        // referring to the smallPonds on your side
        const fishToMove = props.counts.get[index];
        // lastSourceIndex tracks the current source element for animation (fromEl of the arc)
        let lastSourceIndex = index;
        
        // Sync ref with current state at start of turn
        opCountsRef.current = [...props.opCounts.get];
        
        // Clear the selected pond immediately
        props.counts.set((prev) => {
            const temp = [...prev];
            temp[index] = 0;
            return temp;
        });
        
        // Start animated movement
        await animatedMoveFish(index + 1, fishToMove, lastSourceIndex);
        
        // Update opponent state at the end
        props.opCounts.set([...opCountsRef.current]);
        props.turn.set(prev => prev + 1);
        setIsAnimating(false);
    }


    async function animatedMoveFish(startIndex: number, fishCount: number, initialSourceIndex: number): Promise<void> {
        console.log("Animated move fish starting at index:", startIndex, "with", fishCount, "fish");
        let currentIndex = startIndex;
        // FishCount is the value of the selected pond
        let remainingFish = fishCount;
        setAnimateFishRemaining(remainingFish);
        let lastSourceIndex = initialSourceIndex;
        
        while (remainingFish > 0) {
            const len = props.counts.get.length;
            
            // Move fish in your ponds
            while (remainingFish > 0 && currentIndex < len) {
                await increaseIndexAnimated(lastSourceIndex, currentIndex);
                remainingFish--;
                setAnimateFishRemaining(remainingFish);
                lastSourceIndex = currentIndex;
                currentIndex++;
                
                if (remainingFish === 0) return;
            }
            
            // Hit the edge - add to score
            if (currentIndex >= len) {
                console.log("Hit the edge of the array");
                if (triggerAnimate) {
                    if (yourPondRefs && lastSourceIndex >= 0) {
                        const fromEl = yourPondRefs.current[lastSourceIndex];
                        const toEl = rightLargeRef ? rightLargeRef.current : null;
                        triggerAnimate(fromEl ?? null, toEl ?? null, remainingFish);
                    }
                }
                props.score.set(prev => prev + 1);
                console.log("score increased");
                
                if (remainingFish > 0) {
                    console.log("Moving to opponent ponds with", remainingFish, "fish remaining");
                    // Animate from the last source (your pond) to opponent ponds sequence
                    remainingFish = await animatedIncreaseOpponentsPonds(remainingFish, lastSourceIndex);
                    setAnimateFishRemaining(remainingFish);
                    currentIndex = 0; // Reset to start of your ponds
                    // after returning from opponent animation, reset lastSourceIndex to -1 (no valid source on your side)
                    lastSourceIndex = -1;
                }
            }
        }
    }

    async function increaseIndexAnimated(prevIndex: number, index: number): Promise<void> {
        return new Promise((resolve) => {
            // Before highlighting, trigger path animation from prev to current
            const fromEl = (yourPondRefs && prevIndex >= 0) ? yourPondRefs.current[prevIndex] : null;
            const toEl = (yourPondRefs && index >= 0) ? yourPondRefs.current[index] : null;
            if (triggerAnimate) triggerAnimate(fromEl ?? null, toEl ?? null, animateFishRemaining);

            // Highlight the pond when fish lands
            setHighlightedPond(index);

            setTimeout(() => {
                props.counts.set(prev => {
                    const newCounts = [...prev];
                    newCounts[index] += 1;
                    return newCounts;
                });

                // Remove highlight after a brief moment
                setTimeout(() => {
                    setHighlightedPond(null);
                    // resolve is the Promise equivalent of return
                    resolve();
                }, 300); // Keep highlight for 300ms
            }, 200); // Brief delay before adding fish
        });
    }

    async function animatedIncreaseOpponentsPonds(fishCount: number, lastSourceIndex: number): Promise<number> {
        console.log("Animated opponent ponds with", fishCount, "fish");
        const temp = [...opCountsRef.current].reverse();
        const len = temp.length;
        let remainingFish = fishCount;
        setAnimateFishRemaining(remainingFish);
        for (let i = 0; i < fishCount && i < len; i++) {
            const originalIndex = len - 1 - i; // map reversed index back to opponent UI index

            // Highlight the opponent pond that will receive a fish
            if (setOpponentHighlight) setOpponentHighlight(originalIndex);

            // Trigger animation from last source to this opponent pond
            const fromEl = (lastSourceIndex >= 0 && yourPondRefs) ? yourPondRefs.current[lastSourceIndex] : (leftLargeRef ? leftLargeRef.current : null);
            const toEl = (opponentPondRefs) ? opponentPondRefs.current[originalIndex] : null;
            if (triggerAnimate) triggerAnimate(fromEl ?? null, toEl ?? null, remainingFish);

            // Brief pre-move delay so highlight shows before increment
            await new Promise(resolve => setTimeout(resolve, 200));

            temp[i] += 1;
            remainingFish--;
            setAnimateFishRemaining(remainingFish);

            // Update the visual state (reverse back to original order)
            opCountsRef.current = [...temp].reverse();
            props.opCounts.set([...opCountsRef.current]);

            // Keep the highlight visible a short time after increment
            await new Promise(resolve => setTimeout(resolve, 300));
            if (setOpponentHighlight) setOpponentHighlight(null);

            // After the first opponent increment, subsequent fromEl should be this opponent pond
            lastSourceIndex = -1; // prevent using old your pond after first opponent move
        }
        
        // Update the ref with final state
        opCountsRef.current = temp.reverse();
        
        return remainingFish; // Return any fish that didn't fit
    }


}