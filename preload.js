const { ipcRenderer, contextBridge, ipcMain } = require("electron");

// Invoke the request to obtain module name
(async () => window.moduleName = await ipcRenderer.invoke("obtainName"))();

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
    return await ipcRenderer.invoke("callFunction", moduleName, functionName, args, window.moduleName);
});

// Function to define API for other modules
contextBridge.exposeInMainWorld("defineAPI", (functionName, callback, hasReturnValue=false, wantsToKnowCaller=false) => {
    if (hasReturnValue) {
        // Set the handler for the function. Since it has a return value, invoke the reply event when the handler is called
        ipcRenderer.on("API-" + functionName, async (_, args, callerName) => {
            await ipcRenderer.invoke("API-reply-" + window.moduleName + "-" + functionName, await callback(...args, (wantsToKnowCaller) ? callerName : undefined));
        });

        // Register the function as a function with a return value
        ipcRenderer.invoke("registerFunctionWithReplyValue", window.moduleName, functionName);
    }
    else {
        // Set the handler for the function
        ipcRenderer.on("API-" + functionName, (_, args, callerName) => {
            callback(...args, (wantsToKnowCaller) ? callerName : undefined);
        });
    }
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
            return await callback(...args);
        }
        else {
            // If it is not, set an onload event to call it once it gets loaded

            // Create a promise that sets the event to call the function, so that the reply can be awaited
            return await new Promise((resolve, reject) => { 
                ipcRenderer.once("LOAD-" + moduleName, async (_) => {
                    resolve(await callback(...args));
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
            return await ipcRenderer.invoke("callFunction", moduleName, functionName, args, window.moduleName);
        }
        else {
            // If it is not, set an onload event to call it once it gets loaded
            // Create a promise that sets the event to call the function, so that the reply can be awaited
            return await new Promise((resolve, reject) => { 
                ipcRenderer.once("LOAD-" + moduleName, async (_) => {
                    resolve(await ipcRenderer.invoke("callFunction", moduleName, functionName, args, window.moduleName));
                });
            });
        }
    }
});

// The onLoaded and loadEnquiry functions are currently not used in the program.






contextBridge.exposeInMainWorld("setLayoutMode", (bool) => {
    ipcRenderer.invoke("setLayoutMode", window.moduleName, bool);
});


ipcRenderer.on("setDragArea", (_, enable) => {
    console.log("Tried making window draggable");
    
    document.documentElement.style.webkitAppRegion = enable ? 'drag' : 'no-drag';
});
