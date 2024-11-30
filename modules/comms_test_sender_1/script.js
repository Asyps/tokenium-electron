function sendMessage(n) {
    window.callFunction("comms_test_receiver_" + n, "change displayed text", "Message from sender 1");
}

function sendMessageBroadcast() {
    window.callFunction("", "change displayed text", "Message from sender 1");
}

function sendSystemMessageToChat() {
    window.callFunction("chat", "player chat system message", "Message from sender 1");
}

function sendSystemMessageToInWorldChat() {
    window.callFunction("chat", "in world chat system message", "Message from sender 1");
}