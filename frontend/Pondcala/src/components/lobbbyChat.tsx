import './lobbyChat.css'


export default function LobbyChat() {
    return (
        <>
            <aside className="chat-sidebar" style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '20%',
                height: '100vh',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                overflow: 'hidden',
                borderLeft: '2px solid black',
            }}>
                <h2>Lobby Chat</h2>
                <div id="chat-content" className="chat-content">
                    {/* <!-- Chat messages will appear here --> */}
                </div>
                <div className="chat-input-area">
                    <textarea id="chat-message" placeholder="Type a message..."></textarea>
                    <button id="send-btn" title="Send message">⌯⌲</button>
                </div>
            </aside>
        </>
    );
}