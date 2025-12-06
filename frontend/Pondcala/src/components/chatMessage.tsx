export default function ChatMessage({username, message, timestamp}: {username: string, message: string, timestamp: string}) {
    const chatMessageStyle: React.CSSProperties = {
        padding: '0.5em',
        background: '#f5f5f5',
        borderRadius: '0.3em',
        fontSize: '0.9em',
        lineHeight: '1.4',
        marginBottom: '10px',
    };

    const messageTimeStyle: React.CSSProperties = {
        color: '#888',
        fontSize: '0.5em',
        marginRight: '0.5em',
    };

    const messageTextStyle: React.CSSProperties = {
        color: '#222',
        wordWrap: 'break-word',
    };

    return (
        <div style={chatMessageStyle}>
            <strong>{username}:</strong> <span style={messageTextStyle}>{message}</span> <em style={messageTimeStyle}>({timestamp})</em>
        </div>
    );
}