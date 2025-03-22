const { ipcRenderer, contextBridge } = require("electron");

// Expose a function to access game list
contextBridge.exposeInMainWorld("getGameList",  async () => await ipcRenderer.invoke("getGameList"));

// Expose a function that transfers to the next menu or starts the game
contextBridge.exposeInMainWorld("menuTransfer", (action, gameName) => ipcRenderer.invoke("menuTransfer", action, gameName));