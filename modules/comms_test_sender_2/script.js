function sendMessage(n) {
    window.callFunction("comms_test_receiver_" + n, "change displayed text", "Message from sender 2");
}

function sendMessageBroadcast() {
    window.callFunction("", "change displayed text", "Message from sender 2");
}