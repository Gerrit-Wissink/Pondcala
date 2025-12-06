import { displayLobbyMessage } from "./ChatHandler";

let ws: WebSocket | null = null;

function connectWebSocket(): void {
    const protocol = window.location.protocol === `https:` ? `wss:` : `ws:`;
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log(`Websocket connected`);
    };

    ws.onerror = (error) => {
        console.log(`Websocket error: `, error);
    };

    ws.onclose = () => {
        console.log(`Websocket disconnected`);

        console.log(`Attemmpting to reconnect...`);

        connectWebSocket();
    };

    ws.onmessage = (event) => {
        console.log(event);

        const message = JSON.parse(event.data);
        // displayMessage(message);
        handleMessage(message);
    };
    
}

function handleMessage(message: any): void {
    if (!message || !message.type) {
        console.warn('Received malformed WS message', message);
        return;
    }

    const t = message.type;
    switch (t) {
        case 'lobby-msg':
            // display in lobby chat
            /* 
                type LobbyChatMessage struct {
                    Message string `json:"message"`
                    Time    string `json:"time"`
                    Author  uint   `json:"author"`
                }
            */
            if (typeof displayLobbyMessage === 'function') {
                const messageText = message.message;
                const author = message.author;
                const timestamp = message.time;
                displayLobbyMessage(messageText, author, timestamp);
            } else {
                console.log('lobby-msg', message);
            }
            break;

        case 'game-msg':
            // game chat targeted to players
            window.dispatchEvent(new CustomEvent('game-msg', { detail: message }));
            break;

        case 'game-turn':
            // game turn update (board state / turn info)
            window.dispatchEvent(new CustomEvent('game-turn', { detail: message }));
            break;

        case 'game-end':
            // game end notification (Win or Forfeit)
            // message contains: sender, time, players, reason ("Win" or "Forfeit")
            window.dispatchEvent(new CustomEvent('game-end', { detail: message }));
            break;

        case 'invite':
            // Invitation lifecycle events
            // message.Status can be: "sent", "accepted", "declined", "timeout"
            const status = (message.status || '').toLowerCase();

            if (status === 'sent') {
                // New invite for this client
                window.dispatchEvent(new CustomEvent('invite-received', { detail: message }));
            } else {
                // Updates (accepted/declined/timeout)
                window.dispatchEvent(new CustomEvent('invite-updated', { detail: message }));
            }
            break;

        default:
            // Unknown types: surface for debugging and let other code inspect
            console.debug('Unhandled WS message type:', t, message);
            window.dispatchEvent(new CustomEvent('ws-message', { detail: message }));
    }
}

function sendMessage(message: any): boolean {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        return true;
    } else {
        console.warn('WebSocket is not connected. Message not sent:', message);
        return false;
    }
}

function getWebSocket(): WebSocket | null {
    return ws;
}

export {
    connectWebSocket,
    sendMessage,
    getWebSocket
};