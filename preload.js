const { ipcRenderer, contextBridge } = require("electron");

// Function to call an API function from another module
contextBridge.exposeInMainWorld("callFunction", (moduleName, functionName, ...args) => {
    ipcRenderer.invoke("callFunction", moduleName, functionName, args);
});

// Function to define API for other modules
contextBridge.exposeInMainWorld("defineAPI", (functionName, callback) => {
    ipcRenderer.on("API-" + functionName, (ev, ...args) => {
        callback(args);
    });
});