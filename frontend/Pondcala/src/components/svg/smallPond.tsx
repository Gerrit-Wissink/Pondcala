import { useState } from "react";


let SmallPond = ({onClick, count}: {onClick: () => void, count: number}) => {
    const [hovered, setHovered] = useState(false);
    
    // console.log('SmallPond rendering with count:', count);

    const smallPondStyle = {
        fill: hovered ? 'navy' : 'steelblue',
        stroke: hovered ? 'white' : 'black',
        transition: "all 0.2s ease",
        cursor: "pointer",
        strokeWidth: 3
    }

    return (
        <div>
            <svg 
                viewBox={`0 0 400 150`}
                style={{width: "100%", height: "auto", maxWidth: "400px"}}
            >
                <ellipse 
                    cx='200'
                    cy='75'
                    rx='200'
                    ry='75'

                    style={smallPondStyle}


                    onMouseOver={() => {setHovered(true)}}
                    onMouseOut={() => {setHovered(false)}}
                    onClick={onClick}
                />
            </svg>
            <h1 style={{color: 'white'}}>{count}</h1>
        </div>
    );
}

export default SmallPond;