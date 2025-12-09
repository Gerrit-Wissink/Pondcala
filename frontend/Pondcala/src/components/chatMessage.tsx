import { getUsername } from "../utils/UserCache";
import { useEffect, useState } from "react";

// Decode HTML entities like &#39; back to normal characters
// This is safe because we only decode entities, and React escapes when rendering
function decodeHtmlEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

export default function ChatMessage({authorID, message, timestamp}: {authorID: string, message: string, timestamp: string}) {
    const [username, setUsername] = useState<string>(`User ${authorID}`);
    const decodedMessage = decodeHtmlEntities(message);

    useEffect(() => {
        const fetchUsername = async () => {
            const parsedId = parseInt(authorID, 10);
            if (!isNaN(parsedId)) {
                const name = await getUsername(parsedId);
                setUsername(name);
            }
        };
        fetchUsername();
    }, [authorID]);

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
            <strong>{username}:</strong> <span style={messageTextStyle}>{decodedMessage}</span> <em style={messageTimeStyle}>({timestamp})</em>
        </div>
    );
}