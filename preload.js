const { ipcRenderer, contextBridge } = require("electron");

// Function to call an API function from another module
contextBridge.exposeInMainWorld("callFunction", (moduleName, functionName, ...args) => {
    ipcRenderer.invoke("callFunction", moduleName, functionName, args);
});

// Function to define API for other modules
contextBridge.exposeInMainWorld("defineAPI", (functionName, callback) => {
    ipcRenderer.on("API-" + functionName, (ev, args) => {
        callback(args);
    });
});

// Module load control

// Function to declare module as loaded
contextBridge.exposeInMainWorld("declareAsLoaded", (moduleName, extensionName) => {
    ipcRenderer.invoke("moduleLoadNotice", moduleName, extensionName);
});

// Function to enquire if a module is loaded
contextBridge.exposeInMainWorld("loadEnquiry", async (moduleName, extensionName) => {
    return ipcRenderer.invoke("moduleLoadEnquiry", moduleName, extensionName);
});

// Function to set a listener for module load event
contextBridge.exposeInMainWorld("onModuleLoaded", (moduleName, callback) => {
    ipcRenderer.once("LOAD-" + moduleName, (ev) => {
        callback();
    });
});

// Function to set a listener for extension load event
contextBridge.exposeInMainWorld("onExtensionLoaded", (moduleName, extensionName, callback) => {
    ipcRenderer.once("LOAD-" + moduleName + ":" + extensionName, (ev) => {
        callback();
    });
});
