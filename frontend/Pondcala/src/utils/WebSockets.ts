let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds
let pingInterval: ReturnType<typeof setInterval> | null = null;
const PING_INTERVAL = 25000; // 25 seconds (before the 30 second timeout)

function connectWebSocket(): void {
    const protocol = window.location.protocol === `https:` ? `wss:` : `ws:`;
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
    
    console.log("Connecting to WebSocket at:", wsUrl);
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log(`Websocket connected successfully to ${wsUrl}`);
        console.log(`WebSocket readyState:`, ws?.readyState);
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        
        // Start ping interval to keep connection alive
        startPingInterval();
        
        // Dispatch event so UI can reload messages and clear duplicates
        window.dispatchEvent(new CustomEvent('websocket-reconnected'));
    };

    ws.onerror = (error) => {
        console.error(`Websocket error: `, error);
        console.log(`WebSocket readyState after error:`, ws?.readyState);
    };

    ws.onclose = () => {
        console.log(`Websocket disconnected`);
        console.log(`WebSocket readyState:`, ws?.readyState);
        
        // Stop ping interval
        stopPingInterval();

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const delay = RECONNECT_DELAY * reconnectAttempts;
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            
            setTimeout(() => {
                connectWebSocket();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached. Please refresh the page.');
        }
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
            // Dispatch event for React components to handle
            window.dispatchEvent(new CustomEvent('lobby-message-received', { detail: message }));
            break;

        case 'game-msg':
            // game chat targeted to players
            // Dispatch event for React components to handle
            window.dispatchEvent(new CustomEvent('game-message-received', { detail: message }));
            break;

        case 'game-turn':
            // game turn update (board state / turn info)
            window.dispatchEvent(new CustomEvent('game-turn', { detail: message }));
            break;

        case 'game-end':
            // game end notification
            window.dispatchEvent(new CustomEvent('game-end', { detail: message }));
            break;

        case 'game-created':
            // game created notification
            // message contains: gameId, players, time
            window.dispatchEvent(new CustomEvent('game-created', { detail: message }));
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

function startPingInterval(): void {
    // Clear any existing interval
    stopPingInterval();
    
    // Send a ping every 25 seconds to keep connection alive
    pingInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('Sending ping to keep connection alive');
            ws.send(JSON.stringify({ type: 'ping' }));
        }
    }, PING_INTERVAL);
}

function stopPingInterval(): void {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
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