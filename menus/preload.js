const { ipcRenderer, contextBridge } = require("electron");

// Expose a function to access game list
contextBridge.exposeInMainWorld("getGameList",  async () => await ipcRenderer.invoke("getGameList"));

// Expose a function that transfers to the next menu or starts the game
contextBridge.exposeInMainWorld("menuTransfer", (action, gameName) => ipcRenderer.invoke("menuTransfer", action, gameName));

// Function that obtains any data the main process wants to provide
contextBridge.exposeInMainWorld("getData", () => ipcRenderer.invoke("getData"));

// Function that sets  data the main process wants to provide
contextBridge.exposeInMainWorld("setGameData", (gameData) => ipcRenderer.invoke("setGameData", gameData));