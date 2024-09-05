const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("getModuleList",  async () => await ipcRenderer.invoke("getModuleList"));
contextBridge.exposeInMainWorld("getSelectedModules",  async (gameName) => await ipcRenderer.invoke("getSelectedModules", gameName));
contextBridge.exposeInMainWorld("setSelectedModules",  async (gameName, moduleList) => await ipcRenderer.invoke("setSelectedModules", gameName, moduleList));