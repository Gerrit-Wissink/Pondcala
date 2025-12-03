export default function ChatMessage({username, message, timestamp}: {username: string, message: string, timestamp: string}) {
    return (
        <div style={{marginBottom: '10px'}}>
            <strong>{username}:</strong> {message} <em style={{color: "grey"}}>({timestamp})</em>
        </div>
    );
}