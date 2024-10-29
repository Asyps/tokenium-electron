function sendMessage(n) {
    window.callFunction("comms_test_receiver_" + n, "changeDisplayedText", "Message from sender 1");
}

function sendMessageBroadcast() {
    window.callFunction("", "changeDisplayedText", "Message from sender 1");
}