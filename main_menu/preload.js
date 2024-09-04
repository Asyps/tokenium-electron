const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("gameList",  async () => await ipcRenderer.invoke("getGameList"));
contextBridge.exposeInMainWorld("moduleList",  async () => await ipcRenderer.invoke("getModuleList"));
contextBridge.exposeInMainWorld("selectedModules",  async (gameName) => await ipcRenderer.invoke("getSelectedModules", gameName));

contextBridge.exposeInMainWorld("system", {
    loadGame: (moduleList) => ipcRenderer.invoke("loadGame", moduleList),
    //editModules: (gameName) => ipcRenderer.invoke("loadGame", moduleList),
});