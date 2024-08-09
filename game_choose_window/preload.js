const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("gameList",  async () => await ipcRenderer.invoke("gameList"));