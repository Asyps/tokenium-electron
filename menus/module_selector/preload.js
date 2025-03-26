const { ipcRenderer, contextBridge } = require("electron");

// Exposing functions to access main process utilities
contextBridge.exposeInMainWorld("getAvailableModules",  async () => await ipcRenderer.invoke("getAvailableModules"));
contextBridge.exposeInMainWorld("getRequiredModules",  async () => await ipcRenderer.invoke("getRequiredModules"));
contextBridge.exposeInMainWorld("getSelectedModules",  async () => await ipcRenderer.invoke("getSelectedModules"));
contextBridge.exposeInMainWorld("returnModuleList",  async (moduleData) => await ipcRenderer.invoke("returnModuleList", moduleData));
