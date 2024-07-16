const output = document.getElementById("out");
function gotMessage(event) {
    output.innerHTML = event.data;
}


// setting up communication
const susdexChannel = new MessageChannel();

susdexChannel.port1.onmessage = gotMessage;

ipcRenderer.postMessage("from_index", "Kanalizace", susdexChannel.port2);

// button
function action() {
    susdexChannel.port1.postMessage("Úspěšně proběhl zprávsending");
}
