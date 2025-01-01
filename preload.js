const { ipcRenderer, contextBridge } = require("electron");

// A helper function for resolving the moduleExtensionPair arguments
function processArgument(moduleExtensionPair) {
    // If moduleExtensionPair is a string, put it into an array so that the destructuring works
    if (typeof moduleExtensionPair == "string") return [moduleExtensionPair];
        
    // If it is an array, return it as is
    return moduleExtensionPair;
}

// Internal function to control loading extensions and postload script
contextBridge.exposeInMainWorld("announceScriptLoad", (moduleName, scriptName, isSuccess) => {
    ipcRenderer.invoke("LOAD-SCRIPT-" + moduleName + ":" + scriptName, isSuccess);
});


// API system
// Function to call an API function from another module
contextBridge.exposeInMainWorld("callFunction", async (moduleName, functionName, ...args) => {
    return await ipcRenderer.invoke("callFunction", moduleName, functionName, args);
});

// Function to define API for other modules
contextBridge.exposeInMainWorld("defineAPI", (functionName, callback) => {
    ipcRenderer.on("API-" + functionName, async (ev, args) => {
        await ipcRenderer.invoke("API-reply-" + functionName, callback(args));
    });
});


// Function to enquire if a module is loaded (needs an await before it when used)
contextBridge.exposeInMainWorld("loadEnquiry", async (moduleName, extensionName) => {
    return ipcRenderer.invoke("moduleLoadEnquiry", moduleName, extensionName);
});

// Function to set a callback for when a module gets loaded. Specify an extension to check if it should be loaded.
contextBridge.exposeInMainWorld("onLoaded", async (moduleExtensionPair, callback, ...args) => {
    // Destructure moduleExtensionPair
    var [moduleName, extensionName] = processArgument(moduleExtensionPair);

    // Enquire about the module/extension pair
    let loadInfo = await ipcRenderer.invoke("moduleLoadEnquiry", moduleName, extensionName);    
    // This gets an array of two boolean values:     should the specified thing be loaded;   is the module loaded

    // If the module/extension shouldn't be loaded, ignore the call
    if (loadInfo[0]) {
        if (loadInfo[1]) {
            // If the  module is loaded, call the function directly
            return await callback(args);
        }
        else {
            // If it is not, set an onload event to call it once it gets loaded

            // Create a promise that sets the event to call the function, so that the reply can be awaited
            return await new Promise((resolve, reject) => { 
                ipcRenderer.once("LOAD-" + moduleName, async (ev) => {
                    resolve(await callback(args));
                });
            });
        }
    }
});

// Function to call an API function from another module on startup without worries about load loader
contextBridge.exposeInMainWorld("callFunctionOnLoaded", async (moduleExtensionPair, functionName, ...args) => {
    // Destructure moduleExtensionPair
    var [moduleName, extensionName] = processArgument(moduleExtensionPair);

    // Enquire about the module/extension pair
    let loadInfo = await ipcRenderer.invoke("moduleLoadEnquiry", moduleName, extensionName);    
    // This gets an array of two boolean values:     should the specified thing be loaded;   is the module loaded

    // If the module/extension shouldn't be loaded, ignore the call
    if (loadInfo[0]) {
        if (loadInfo[1]) {
            // If the  module is loaded, call the function directly
            return await ipcRenderer.invoke("callFunction", moduleName, functionName, args);
        }
        else {
            // If it is not, set an onload event to call it once it gets loaded
            // Create a promise that sets the event to call the function, so that the reply can be awaited
            return await new Promise((resolve, reject) => { 
                ipcRenderer.once("LOAD-" + moduleName, async (ev) => {
                    console.log("Waiting for reply inside callFunctionOn loaded", moduleName, functionName);
                    resolve(await ipcRenderer.invoke("callFunction", moduleName, functionName, args));
                });
            });
        }
    }
});

// The onLoaded and loadEnquiry functions are currently not used in the program.
