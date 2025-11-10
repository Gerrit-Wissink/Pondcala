import { displayMessage } from "./Chat";

let ws;

function connectWebSocket() {
    const protocol = window.location.protocol === `https:` ? `wss:` : `ws:`,
          wsUrl = `${protocol}//${window.location.host}/ws/chat`;
    
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
        displayMessage(message);
    }
    
}

module.exports = {
    connectWebSocket
};