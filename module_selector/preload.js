// Imports
const { ipcRenderer, contextBridge } = require("electron");

// Exposing functions to access main process utilities
contextBridge.exposeInMainWorld("getModuleList",  async () => await ipcRenderer.invoke("getModuleList"));
contextBridge.exposeInMainWorld("getSelectedModules",  async (gameName) => await ipcRenderer.invoke("getSelectedModules", gameName));
contextBridge.exposeInMainWorld("setSelectedModules",  async (gameName, moduleList) => await ipcRenderer.invoke("setSelectedModules", gameName, moduleList));