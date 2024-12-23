const { ipcRenderer, contextBridge } = require("electron");

// Function to call an API function from another module
contextBridge.exposeInMainWorld("callFunction", async (moduleName, functionName, ...args) => {
    await ipcRenderer.invoke("callFunction", moduleName, functionName, args);
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


// Function to enquire if a module is loaded (needs an await before it when used)
// Might get deleted, see note at the bottom of the program
contextBridge.exposeInMainWorld("loadEnquiry", async (moduleName, extensionName) => {
    return ipcRenderer.invoke("moduleLoadEnquiry", moduleName, extensionName);
});

// Function to set a listener for module/extension load event
// Might get deleted, see note at the bottom of the program
contextBridge.exposeInMainWorld("onLoaded", (callback, moduleName, extensionName) => {
    let loadName = (extensionName == undefined) ? moduleName : moduleName + ":" + extensionName;

    ipcRenderer.once("LOAD-" + loadName, (ev) => {
        callback();
    });
});

// Function to call an API function from another module on startup without worries about load loader
// This function combines the behavior of callFunction, loadEnquiry and onLoaded (kinda)
contextBridge.exposeInMainWorld("callFunctionOnLoaded", async (moduleExtensionPair, functionName, ...args) => {
    // Process arguments
    if (Array.isArray(moduleExtensionPair)) {
        // If moduleExtensionPair is an array, destructure it
        var [moduleName, extensionName] = moduleExtensionPair;
    }
    else {
        // If it is a single string, it specifies the moduleName
        var moduleName = moduleExtensionPair;
    }

    // Checks if the module/extension is loaded
    if (await ipcRenderer.invoke("moduleLoadEnquiry", moduleName, extensionName)) {
        // If it is, call the function directly
        ipcRenderer.invoke("callFunction", moduleName, functionName, args);
    }
    else {
        // If it is not, set an onload event to call it once it gets loaded
        let loadName = (extensionName == undefined) ? moduleName : moduleName + ":" + extensionName;

        ipcRenderer.once("LOAD-" + loadName, (ev) => {
            ipcRenderer.invoke("callFunction", moduleName, functionName, args);
        });
    }
});

// The onLoaded as it is now has a diffirent behavior than callFunctionOnLoaded because it allows any block of code to be run after the module is loaded
// while callFunctionOnLoaded is designed specifically for inter-module API calls. Therefore it might stay, but currently has no use in the program.
// But loadEnquiry might not be useful at all so it might be deleted unless an use is found.

// Possible TO-DO - change all method arguments that specify a module and an extension to the moduleExtensionPair format - to have consistent arguments
// The one place where moduleExtensionPair is currently used requires it
