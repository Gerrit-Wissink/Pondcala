import { getWebSocket } from "./WebSockets";
import ChatMessage from "../components/chatMessage";
import { createRoot } from "react-dom/client";

function displayLobbyMessage(message: any, author: string, timestamp: string): void {
    const chatContent = document.getElementById(`lobby-chat-content`);
    if(!chatContent) return;
    
    const timeText = new Date(timestamp).toLocaleTimeString(`en-US`, { hour12: false });
    
    // Create container div for the React component
    const messageContainer = document.createElement('div');
    chatContent.appendChild(messageContainer);
    
    // Render the ChatMessage component into the container
    const root = createRoot(messageContainer);
    root.render(<ChatMessage authorID={author} message={message.message} timestamp={timeText} />);
    
    chatContent.scrollTop = chatContent.scrollHeight;
}

function displayGameChatMessage(message: any, author: string, timestamp: string, gameID: string): void {
    // TODO: Implement game chat message display
    const chatContent = document.getElementById(`game-${gameID}-chat-content`);
    if(!chatContent) return;
    
    const timeText = new Date(timestamp).toLocaleTimeString(`en-US`, { hour12: false });
    
    // Create container div for the React component
    const messageContainer = document.createElement('div');
    chatContent.appendChild(messageContainer);
    
    // Render the ChatMessage component into the container
    const root = createRoot(messageContainer);
    root.render(<ChatMessage authorID={author} message={message.message} timestamp={timeText} />);
    
    chatContent.scrollTop = chatContent.scrollHeight;
}

/* 
    type LobbyChatMessage struct {
        Message string `json:"message"`
        Time    string `json:"time"`
        Author  uint   `json:"author"`
    }
*/

function sendLobbyChatMessage(authorID: number): void {
    const messageInput = document.getElementById(`lobby-chat-message`) as HTMLInputElement;
    if(!messageInput) return;
    
    const messageText = messageInput.value.trim();
    const ws = getWebSocket();
    
    if(!messageText || !ws || ws.readyState !== WebSocket.OPEN) {
        console.log(`Message cannot be sent`);
        return;
    }

    const message = {
        message: messageText,
        time: new Date().toISOString(),
        type: "lobby-msg",
        author: authorID
    };

    ws.send(JSON.stringify(message));

    messageInput.value = ``;
}

//Probably need to change this to give each game chat a unique ID
/* 
    type GameChatMessage struct {
        Message string `json:"message"`
        Time    string `json:"time"`
        Author  uint   `json:"author"`
        Players []uint `json:"players"`
        GameID  uint   `json:"gameID"`
    }
*/

function sendGameChatMessage(gameID: number, authorID: number, players: number[]): void {
    const messageInput = document.getElementById(`game-${gameID}-chat-message`) as HTMLInputElement;
    if(!messageInput) return;
    
    const messageText = messageInput.value.trim();
    const ws = getWebSocket();
    
    if(!messageText || !ws || ws.readyState !== WebSocket.OPEN) {
        console.log(`Message cannot be sent`);
        return;
    }

    const message = {
        message: messageText,
        time: new Date().toISOString(),
        type: "game-msg",
        author: authorID,
        game_id: gameID,
        players: players
    };

    ws.send(JSON.stringify(message));

    messageInput.value = ``;
}

export {
    displayLobbyMessage,
    displayGameChatMessage,
    sendLobbyChatMessage,
    sendGameChatMessage
};