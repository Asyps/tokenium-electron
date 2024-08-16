const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("gameList",  async () => await ipcRenderer.invoke("gameList"));
contextBridge.exposeInMainWorld("moduleList",  async () => await ipcRenderer.invoke("moduleList"));

contextBridge.exposeInMainWorld("system", {
    loadGame: (moduleList) => ipcRenderer.invoke("loadGame", moduleList),
});