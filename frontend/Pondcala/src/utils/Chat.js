function displayMessage(message) {
    const chatContent = document.getElementById(`chat-content`),
          timeText = new Date(message.time).toLocaleTimeString(`en-US`, { hour12: false });
    const msgHtml = `
        <div class="chat-message">
            <span class="message-time">${timeText}</span>
            <span class="message-text">${message.message}</span>
        </div>
    `;

    chatContent.insertAdjacentHTML(`beforeend`, msgHtml);
    chatContent.scrollTop = chatContent.scrollHeight;

}

function sendMessage() {
    const messageInput = document.getElementById(`chat-message`),
          messageText = messageInput.value.trim();
    if(!messageText || !ws || ws.readyState !== WebSocket.OPEN) {
        console.log(`Message cannot be sent`);
        return;
    }

    const message = {
        message: messageText,
        time: new Date().toISOString()
    };

    ws.send(JSON.stringify(message));

    messageInput.value = ``;
}

module.exports = {
    displayMessage,
    sendMessage
}