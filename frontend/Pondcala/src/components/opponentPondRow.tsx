import React from "react";
import SmallPond from "./svg/smallPond";

export default function OpponentPondRow({counts, highlightedIndex, pondRefs}: {counts: number[], highlightedIndex?: number | null, pondRefs?: React.MutableRefObject<Array<SVGEllipseElement | null>>}) {

    return (
        <>
            <div style = {{display: 'flex', gap: '2vw'}}>
                {counts.map((value, index) =>
                        <div key={index}>
                            <SmallPond ref={el => { if (pondRefs) pondRefs.current[index] = el; }} onClick={() => {
                                // DO NOTHING ON CLICK
                            }} count={value} highlighted={highlightedIndex === index} />
                        </div>
                    )
                }
            </div>
        </>
    );
}