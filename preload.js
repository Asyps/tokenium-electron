const { ipcRenderer, contextBridge } = require("electron");


ipcRenderer.on("port", (e) => {
    port = e.ports[0];
    window.postMessage("s", "*", transfer=[port]);
});