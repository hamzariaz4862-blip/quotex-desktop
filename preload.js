const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("app", {
  openRegister: () => ipcRenderer.send("open-register"),
  closePrompt: () => ipcRenderer.send("prompt-close")
});
