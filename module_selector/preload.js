const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("selectedModules",  async (gameName) => await ipcRenderer.invoke("getSelectedModules", [gameName]));