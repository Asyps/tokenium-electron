playerChat.internal.button = document.getElementById("playerSendButton");
playerChat.mode = "normal";

// Swap the confirm function for one that supports command mode
playerChat.confirm = () => {
    if (playerChat.internal.textInput.value != "") {
        if (playerChat.mode == "normal") {
            // Add a user header unless the last message was sent by the local player
            if (chatDocumentMockup.lastMessageSender != localPlayerName) {
                let header = new chatComponent("header", localPlayerName);

                playerChat.internal.addChatComponent(header);
                chatDocumentMockup.chatMessages.push(header);
            }

            // Add the message
            let message = new chatComponent("message", playerChat.internal.textInput.value);

            playerChat.internal.addChatComponent(message);
            chatDocumentMockup.chatMessages.push(message);
        }
        else {
            // Coming soon
            playerChat.sendSystemMessage("Executed command: " + playerChat.internal.textInput.value);
            commandModeOff();
        }
        
        // Clear the text area
        playerChat.internal.textInput.value = "";
    }
}


// Turn command mode on or off
function commandModeOn() {
    playerChat.mode = "command";
    playerChat.internal.button.innerHTML = "Execute";
    playerChat.internal.button.style.setProperty("background-color", "#21c0ff");
}
function commandModeOff() {
    playerChat.mode = "normal";
    playerChat.internal.button.innerHTML = "Send";
    playerChat.internal.button.style.setProperty("background-color", "#4CAF50");
}

// Listener to toggle command mode
playerChat.internal.textInput.addEventListener("keydown", (ev) => {
    if (ev.key == "/") {
        if (playerChat.internal.textInput.value == "") {
            // If the first key entered is /, turn command mode on
            ev.preventDefault();
            commandModeOn();
        }
    }
    if (ev.key == "Backspace") {
        if (playerChat.internal.textInput.value == "") {
            // If backspace is pressed while text area is empty, turn off command mode
            commandModeOff();
        }
    }
});