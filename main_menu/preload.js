const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("getGameList",  async () => await ipcRenderer.invoke("getGameList"));

contextBridge.exposeInMainWorld("system", {
    loadGame: (moduleList) => ipcRenderer.invoke("loadGame", moduleList),
    //editModules: (gameName) => ipcRenderer.invoke("loadGame", moduleList),
});