import { useState } from "react";


let SmallPond = ({onClick, count}: {onClick: () => void, count: number}) => {
    const [hovered, setHovered] = useState(false);
    
    // console.log('SmallPond rendering with count:', count);

    const smallPondStyle = {
        fill: count > 0 ? hovered ? 'navy' : 'steelblue': 'grey',
        stroke: count > 0 ? hovered ? 'white' : 'black': 'black',
        transition: "all 0.2s ease",
        cursor: count > 0 ? "pointer": "",
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
                    onClick={count > 0 ? onClick : () => {console.log("Pond is disabled")}}
                />
            </svg>
            <h1 style={{color: 'white'}}>{count}</h1>
        </div>
    );
}

export default SmallPond;