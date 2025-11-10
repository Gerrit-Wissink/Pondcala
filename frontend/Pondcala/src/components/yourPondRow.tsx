import { useRef, useEffect, useState } from "react";
import SmallPond from "./svg/smallPond";

export default function YourPondRow({props}: {props: {counts: {get: number[], set: React.Dispatch<React.SetStateAction<number[]>>}, score: {get: number, set: React.Dispatch<React.SetStateAction<number>>}, opCounts: {get: number[], set: React.Dispatch<React.SetStateAction<number[]>>}, turn: {get: number, set: React.Dispatch<React.SetStateAction<number>>}}}) {
    const opCountsRef = useRef(props.opCounts.get);
    const [isAnimating, setIsAnimating] = useState(false);
    const [highlightedPond, setHighlightedPond] = useState<number | null>(null);
    
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
        
        // Sync ref with current state at start of turn
        opCountsRef.current = [...props.opCounts.get];
        
        // Clear the selected pond immediately
        props.counts.set((prev) => {
            const temp = [...prev];
            temp[index] = 0;
            return temp;
        });
        
        // Start animated movement
        await animatedMoveFish(index + 1, fishToMove);
        
        // Update opponent state at the end
        props.opCounts.set([...opCountsRef.current]);
        props.turn.set(prev => prev + 1);
        setIsAnimating(false);
    }


    async function animatedMoveFish(startIndex: number, fishCount: number): Promise<void> {
        console.log("Animated move fish starting at index:", startIndex, "with", fishCount, "fish");
        let currentIndex = startIndex;
        // FishCount is the value of the selected pond
        let remainingFish = fishCount;
        
        while (remainingFish > 0) {
            const len = props.counts.get.length;
            
            // Move fish in your ponds
            while (remainingFish > 0 && currentIndex < len) {
                await increaseIndexAnimated(currentIndex);
                remainingFish--;
                currentIndex++;
                
                if (remainingFish === 0) return;
            }
            
            // Hit the edge - add to score
            if (currentIndex >= len) {
                console.log("Hit the edge of the array");
                props.score.set(prev => prev + 1);
                console.log("score increased");
                
                if (remainingFish > 0) {
                    console.log("Moving to opponent ponds with", remainingFish, "fish remaining");
                    remainingFish = await animatedIncreaseOpponentsPonds(remainingFish);
                    currentIndex = 0; // Reset to start of your ponds
                }
            }
        }
    }

    async function increaseIndexAnimated(index: number): Promise<void> {
        return new Promise((resolve) => {
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

    async function animatedIncreaseOpponentsPonds(fishCount: number): Promise<number> {
        console.log("Animated opponent ponds with", fishCount, "fish");
        const temp = [...opCountsRef.current].reverse();
        const len = temp.length;
        let remainingFish = fishCount;
        
        for (let i = 0; i < fishCount && i < len; i++) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Animation delay
            temp[i] += 1;
            remainingFish--;
            
            // Update the visual state
            opCountsRef.current = [...temp].reverse();
            props.opCounts.set([...opCountsRef.current]);
        }
        
        // Update the ref with final state
        opCountsRef.current = temp.reverse();
        
        return remainingFish; // Return any fish that didn't fit
    }


}