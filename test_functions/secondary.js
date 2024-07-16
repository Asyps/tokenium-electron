const ipcRenderer = window.ipcRenderer

const output = document.getElementById("out");
function gotMessage(event) {
    output.innerHTML = event.data;
}

ipcRenderer.on("sus", (e, msg) => {
    global [indexPort] = e.ports;
})

indexPort.onmessage = gotMessage;

function action() {
    indexPort.postMessage("Úspěšně proběhl zprávsending");
}

