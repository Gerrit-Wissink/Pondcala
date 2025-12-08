import React from "react";
import SmallPond from "./svg/smallPond";

export default function YourPondRow({
    counts,
    highlightedIndex,
    yourPondRefs,
    onPondClick,
    disabled
}: {
    counts: number[];
    highlightedIndex: number | null;
    yourPondRefs: React.MutableRefObject<Array<SVGEllipseElement | null>>;
    onPondClick: (index: number) => void;
    disabled: boolean;
}) {
    return (
        <>
            <div style = {{display: 'flex', gap: '2vw'}}>
                {counts.map((value, index) =>
                    <div key={index}>
                        <SmallPond 
                            ref={el => { yourPondRefs.current[index] = el; }}
                            onClick={() => {
                                if (!disabled) {
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