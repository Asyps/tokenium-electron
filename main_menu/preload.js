const { ipcRenderer, contextBridge } = require("electron");

// Expose a function to access game list
contextBridge.exposeInMainWorld("getGameList",  async () => await ipcRenderer.invoke("getGameList"));

// Expose a function that starts the game
contextBridge.exposeInMainWorld("system", {
    loadGame: (gameName) => ipcRenderer.invoke("loadGame", gameName),
});