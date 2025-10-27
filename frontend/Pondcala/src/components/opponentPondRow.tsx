import SmallPond from "./svg/smallPond";

export default function OpponentPondRow({counts}: {counts: number[]}) {
    
    return (
        <>
            <div style = {{display: 'flex', gap: '2vw'}}>
                {counts.map((value) =>
                        <div>
                            <SmallPond onClick={() => {
                                //DO NOTHING ON CLICK
                            }} count={value} />
                        </div>
                    )
                }
            </div>
        </>
    );
}