import './lobbyChat.css'


export default function LobbyChat() {
    return (
        <>
            <aside className="chat-sidebar">
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