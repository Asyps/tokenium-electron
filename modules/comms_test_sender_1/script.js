function sendMessage(n) {
    window.callFunction("comms_test_receiver_" + n, "changeDisplayedText", "Message from sender 1");
}

function sendMessageBroadcast() {
    window.callFunction("", "changeDisplayedText", "Message from sender 1");
}

function sendSystemMessageToChat() {
    window.callFunction("chat", "playerChatSystemMessage", "Message from sender 1");
}

function sendSystemMessageToInWorldChat() {
    window.callFunction("chat", "inWorldChatSystemMessage", "Message from sender 1");
}