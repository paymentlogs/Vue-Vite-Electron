const { app, BrowserWindow, protocol } = require("electron");
const path = require("path");

// LOCAL IMPORTS
let ipcHandler;
if (process.env.NODE_ENV === "development") {
  ipcHandler = require("./handlers/ipcFlow.js");
} else {
  ipcHandler = require("./handlers/ipcFlow.jsc");
}

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 1115,
    height: 715,
    center: true,
    resizable: false,
    fullscreenable: false,
    roundedCorners: true,
    title: "voromade Vue Electron Boilerplate",
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      allowRunningInsecureContent: true,
      webSecurity: false,
      contextIsolation: false,
    },
    hasShadow: true,
    transparent: true,
    frame: false,
    show: true,
  });

  if (process.env.NODE_ENV == "development") {
    await win.loadURL("http://localhost:8080");
    // await win.loadURL("https://kith.com");
    win.webContents.openDevTools();
  } else {
    await win.loadURL(
      `file://${path.join(__dirname, "../../packages/frontend/index.html")}`
    );
  }

  new ipcHandler();
};

app.on("ready", async () => {
  await createWindow();
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
