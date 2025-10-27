let LargePond = ({score}: {score: number | null}) => {

    const largePondStyle = {
        fill: 'steelblue',
        stroke: 'black',
        strokeWidth: 5
    }

    return (
        <div>
            <svg 
                viewBox={`0 0 300 600`}
                style={{width: "100%", height: "auto", maxHeight: "400px"}}
            >
                <ellipse 
                    cx='150'
                    cy='300'
                    rx='150'
                    ry='300'

                    style={largePondStyle}
                />
            </svg>
            <h1 style={{color: 'white'}}>{score ?? ''}</h1>
        </div>
    );
}

export default LargePond;