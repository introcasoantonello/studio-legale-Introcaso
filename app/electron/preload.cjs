const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("studioAI", {
  status: () => ipcRenderer.invoke("ai:status"),
  saveKey: key => ipcRenderer.invoke("ai:save-key", key),
  deleteKey: () => ipcRenderer.invoke("ai:delete-key"),
  chat: payload => ipcRenderer.invoke("ai:chat", payload)
});
