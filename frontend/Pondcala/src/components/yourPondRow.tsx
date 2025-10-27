import { useRef, useEffect } from "react";
import SmallPond from "./svg/smallPond";

export default function YourPondRow({counts, score, opCounts}: {counts: {get: number[], set: React.Dispatch<React.SetStateAction<number[]>>}, score: {get: number, set: React.Dispatch<React.SetStateAction<number>>}, opCounts: {get: number[], set: React.Dispatch<React.SetStateAction<number[]>>}}) {
    const opCountsRef = useRef(opCounts.get);
    
    // Keep ref in sync with state
    useEffect(() => {
        opCountsRef.current = opCounts.get;
    }, [opCounts.get]);
    
    return (
        <>
            <div style = {{display: 'flex', gap: '2vw'}}>
                {counts.get.map((value, index) =>
                        <div>
                            <SmallPond onClick={() => {
                                takeTurn(index);
                            }} count={value} />
                        </div>
                    )
                }
            </div>
        </>
    );

    function takeTurn(index: number){
        console.log('Take turn called');
        const fishToMove = counts.get[index];
        
        // Sync ref with current state at start of turn
        opCountsRef.current = [...opCounts.get];
        
        counts.set((prev) => {
            let temp = [...prev];
            temp[index] = 0;
            let result = moveFish(index + 1, temp, fishToMove);
            temp = result.arr;
            let remainder = result.remainder;
            
            while(remainder > 0){
                result = moveFish(0, temp, remainder);
                temp = result.arr;
                remainder = result.remainder;
            }
            console.log("End result", temp);
            return temp;
        });
        
        // Update opponent state at the end
        opCounts.set([...opCountsRef.current]);
    }


    function moveFish(index: number, yourCounts: number[], iterations: number){
        console.log("Move Fish is called with iterations:", iterations, "for index:", index);
        console.log("yourCounts[index]:", yourCounts[index]);
        const len = yourCounts.length;
        let remainder = 0;
        
        for(let i = 0; i < iterations; i++){
            if(index + i > (len - 1)){
                console.log("Hit the edge of the array");
                score.set(score.get + 1);
                console.log("score increased");
                let numLeft = iterations - i - 1;
                if(numLeft > 0){
                    console.log("Calling increaseOpponentsPonds with numLeft: ", numLeft);
                    remainder = increaseOpponentsPonds(iterations - i - 1);
                    console.log("Remainder from increaseOpponentsPonds:", remainder);
                }
                break;
            }
            yourCounts[index + i] += 1;
        }

        return {
            arr: yourCounts,
            remainder
        };
    }

    function increaseOpponentsPonds(iterations: number): number {
        console.log("increaseOpponentsPonds called with iterations: ", iterations);

        const temp = [...opCountsRef.current].reverse();
        const len = opCountsRef.current.length;
        let remainder = 0;
        
        for(let i = 0; i < iterations; i++){
            if(i > (len - 1)){
                console.log("Hit the edge of the opponents array");
                remainder = iterations - i;
                console.log("Remainder calculated:", remainder);
                break;
            }
            temp[i] += 1;
        }
        
        // Update the ref directly
        opCountsRef.current = temp.reverse();
        
        return remainder;
    }
}