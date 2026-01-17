const { app, BrowserWindow, shell, Menu, ipcMain } = require("electron");
const path = require("path");
app.enableSandbox();

app.commandLine.appendSwitch("use-angle", "metal");

const TRY_DEMO =
"https://broker-qx.pro/sign-up/fast/?lid=1717086";

const REGISTER =
"https://broker-qx.pro/sign-up/?lid=1717085";

let mainWin = null;
let promptWin = null;

function openRegisterExternal() {
  return shell.openExternal(REGISTER);
}

function showPrompt() {
  if (!mainWin) return;

  if (promptWin && !promptWin.isDestroyed()) {
    promptWin.focus();
    return;
  }

  const { width, height } = mainWin.getBounds();

promptWin = new BrowserWindow({
  parent: mainWin,
  modal: true,
  width: Math.round(width * 0.65),
  height: Math.round(height * 0.65),
  resizable: false,
  minimizable: false,
  maximizable: false,
  show: false,

webPreferences: {
  preload: path.join(__dirname, "preload.js"),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true
}

});

  promptWin.loadFile(path.join(__dirname, "prompt.html"));

  promptWin.webContents.on("did-fail-load", (_, code, desc, url) => {
    console.error("PROMPT failed to load:", code, desc, url);
  });

  promptWin.once("ready-to-show", () => promptWin.show());
  promptWin.on("closed", () => { promptWin = null; });
}

ipcMain.on("open-register", async () => {
  await openRegisterExternal();
  if (promptWin) promptWin.close();
});

ipcMain.on("prompt-close", () => {
  if (promptWin) promptWin.close();
});

function createWindow() {
  mainWin = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Quotex - Web Trading Platform",
    webPreferences: {
      preload: __dirname + "/preload.js",
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  mainWin.webContents.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );

  mainWin.loadURL(TRY_DEMO);
// Keep window title on-brand (prevents title flashes)
mainWin.on("page-title-updated", (e) => e.preventDefault());
mainWin.setTitle("Quotex — Web Trading Platform");
mainWin.webContents.on("did-start-navigation", () => {
  mainWin.setTitle("Quotex — Web Trading Platform");
});


  // Intercept all real-account related actions and open externally
const shouldOpenExternally = (url) => {
  const u = (url || "").toLowerCase();
  return (
    u.includes("sign-up") ||
    u.includes("signup") ||
    u.includes("register") ||
    u.includes("qxbroker.com/en/sign-up") ||
    u.includes("qxbroker.com/en/signup")
  );
};

mainWin.webContents.on("will-navigate", (event, url) => {
  if (shouldOpenExternally(url)) {
    event.preventDefault();
    shell.openExternal(REGISTER);
  }
});

mainWin.webContents.setWindowOpenHandler(({ url }) => {
  if (shouldOpenExternally(url)) {
    shell.openExternal(REGISTER);
    return { action: "deny" };
  }
  return { action: "allow" };
});


  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes("/register") || url.includes("register")) {
      shell.openExternal(REGISTER);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  // Popup after 5 seconds
  setTimeout(() => {
    console.log("Showing prompt after 5 seconds...");
    showPrompt();
  }, 5000);

  const menu = Menu.buildFromTemplate([
    {
      label: "Account",
      submenu: [
        { label: "Create Real Account (opens browser)", click: () => openRegisterExternal() },
        { label: "Show Register Prompt", click: () => showPrompt() },
        { type: "separator" },
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "quit" }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
