const { ipcRenderer, contextBridge } = require("electron");

// Exposing functions to access main process utilities
contextBridge.exposeInMainWorld("getAvailableModules",  async () => await ipcRenderer.invoke("getAvailableModules"));
contextBridge.exposeInMainWorld("getRequiredModules",  async (gameName) => await ipcRenderer.invoke("getRequiredModules", gameName));
contextBridge.exposeInMainWorld("getSelectedModules",  async (gameName) => await ipcRenderer.invoke("getSelectedModules", gameName));
contextBridge.exposeInMainWorld("setSelectedModules",  async (moduleData) => await ipcRenderer.invoke("setSelectedModules", moduleData));
