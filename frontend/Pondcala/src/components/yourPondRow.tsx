import React from "react";
import SmallPond from "./svg/smallPond";

export default function YourPondRow({
    counts,
    highlightedIndex,
    yourPondRefs,
    onPondClick,
    isAnimating
}: {
    counts: number[];
    highlightedIndex: number | null;
    yourPondRefs: React.MutableRefObject<Array<SVGEllipseElement | null>>;
    onPondClick: (index: number) => void;
    isAnimating: boolean;
}) {
    return (
        <>
            <div style = {{display: 'flex', gap: '2vw'}}>
                {counts.map((value, index) =>
                    <div key={index}>
                        <SmallPond 
                            ref={el => { yourPondRefs.current[index] = el; }}
                            onClick={() => {
                                if (!isAnimating) {
                                    onPondClick(index);
                                }
                            }} 
                            count={value}
                            highlighted={highlightedIndex === index}
                        />
                    </div>
                )}
            </div>
        </>
    );
}