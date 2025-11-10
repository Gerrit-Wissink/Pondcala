import LobbyChat from "../components/lobbbyChat";

export default function Lobby() {
    return (
        <>
            <div className="container">
                <h1>Pondcala</h1>
                <div style={{display: 'flex', flexDirection: 'row', gap: '20px'}}>
                    <button>Host a Game</button>
                    <button>Find a Game</button>
                </div>

                <LobbyChat />
            </div>
        </>
    );
}