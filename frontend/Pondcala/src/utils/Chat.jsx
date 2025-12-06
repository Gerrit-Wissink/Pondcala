import ChatMessage from "../components/chatMessage";

function displayLobbyMessage(message, author, timestamp) {
    const chatContent = document.getElementById(`lobby-chat-content`),
          timeText = new Date(message.timestamp).toLocaleTimeString(`en-US`, { hour12: false });
    const msgHtml = <ChatMessage username={author} message={message.message} timestamp={timeText}/>

    chatContent.insertAdjacentHTML(`beforeend`, msgHtml);
    chatContent.scrollTop = chatContent.scrollHeight;
}

function sendLobbyChatMessage() {
    const messageInput = document.getElementById(`lobby-chat-message`),
          messageText = messageInput.value.trim();
    if(!messageText || !ws || ws.readyState !== WebSocket.OPEN) {
        console.log(`Message cannot be sent`);
        return;
    }

    const message = {
        message: messageText,
        time: new Date().toISOString(),
        type: "lobby-msg"
    };

    ws.send(JSON.stringify(message));

    messageInput.value = ``;
}

//Probably need to change this to give each game chat a unique ID
function sendGameChatMessage() {
    const messageInput = document.getElementById(`game-chat-message`),
          messageText = messageInput.value.trim();
    if(!messageText || !ws || ws.readyState !== WebSocket.OPEN) {
        console.log(`Message cannot be sent`);
        return;
    }

    const message = {
        message: messageText,
        time: new Date().toISOString(),
        type: "game-msg"
    };

    ws.send(JSON.stringify(message));

    messageInput.value = ``;
}

export default {
    displayMessage,
    sendMessage
}