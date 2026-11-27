const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("studioAI", {
  openItalgiure: () => ipcRenderer.invoke("italgiure:open"),
  openBdp: () => ipcRenderer.invoke("bdp:open"),
  status: () => ipcRenderer.invoke("ai:status"),
  saveKey: key => ipcRenderer.invoke("ai:save-key", key),
  readClipboard: () => ipcRenderer.invoke("clipboard:read"),
  deleteKey: () => ipcRenderer.invoke("ai:delete-key"),
  chat: payload => ipcRenderer.invoke("ai:chat", payload),
  libraryFolder: () => ipcRenderer.invoke("library:get-folder"),
  chooseLibraryFolder: () => ipcRenderer.invoke("library:choose-folder"),
  scanLibrary: () => ipcRenderer.invoke("library:scan"),
  readLibraryFile: relativePath => ipcRenderer.invoke("library:read-file", relativePath),
  searchLibrary: query => ipcRenderer.invoke("library:search", query)
});
