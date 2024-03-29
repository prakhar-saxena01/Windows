// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Tray, Menu, shell, Notification } = require("electron");
const path = require("path");
const Store = require("electron-store");
const isDev = require("electron-is-dev");
const fs = require("fs");
const fenster = require("@electron/remote/main");
const defaultSetting = require("./defaultSettings");
const contextMenu = require("electron-context-menu");
const { setupTitlebar, attachTitlebarToWindow } = require("custom-electron-titlebar/main");

const store = new Store();
let tray = null;

contextMenu({
  showLookUpSelection: false,
  showSearchWithGoogle: false,
  showCopyImage: false,
  showCopyImageAddress: false,
  showSaveImageAs: true,
  showSaveLinkAs: false,
  showInspectElement: false,
  showServices: false,
});

const appIcon = path.join(app.getAppPath(), "/build/ic_launcher.ico");

// setupTitlebar();

function createWindow() {
  // Create the browser window.
  const width = defaultSetting("electron.windowSize.width", 375);
  const height = defaultSetting("electron.windowSize.height", 812);
  const devTools = defaultSetting("electron.devTools", "false");
  const alwaysOnTop = defaultSetting("electron.alwaysOnTop", "false");

  defaultSetting("electron.hardDevice", "C");
  defaultSetting("language", "en");

  if (!fs.existsSync(store.get("electron.hardDevice") + ":".toUpperCase() + "/hentai-web/")) {
    try {
      fs.mkdirSync(store.get("electron.hardDevice") + ":".toUpperCase() + "/hentai-web/");
    } catch (error) {
      console.log(error);
    }
  }

  const mainWindow = new BrowserWindow({
    width: width,
    height: height,
    frame: false,
    hasShadow: false,
    resizable: false,
    alwaysOnTop: alwaysOnTop === "true" ? true : false,
    transparent: true,
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    title: "Hentai Web Windows",
    icon: appIcon,
    webPreferences: {
      nativeWindowOpen: true,
      devTools: devTools === "true" ? true : false,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: true,
      // nodeIntegrationInWorker: true,
      spellcheck: true,
    },
  });

  const webContents = mainWindow.webContents;

  Store.initRenderer();
  fenster.initialize();
  fenster.enable(webContents);
  // attachTitlebarToWindow(mainWindow);

  const mainURL = "https://hw.dergoogler.com/";
  const debugURL = "http://192.168.178.81:5500/";
  const checkMode = !isDev ? mainURL : debugURL;

  mainWindow.loadURL(checkMode);
  mainWindow.on("page-title-updated", function (e) {
    e.preventDefault();
  });

  webContents.setUserAgent("HENTAI_WEB_WINDOWS");

  ipcMain.on("installreactdevtools", () => {
    require("electron-react-devtools").install();
  });

  ipcMain.on("notification-send", (event, title, body) => {
    new Notification({
      title: title,
      body: body,
      icon: appIcon,
      silent: false,
    }).show();
  });

  webContents.on("did-finish-load", function () {
    ipcMain.on("eval", (javascriptString) => {
      webContents.executeJavaScript(javascriptString);
    });
  });

  tray = new Tray(appIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Plain Settings Edit",
      type: "normal",
      click: () => {
        shell.openPath(app.getPath("userData") + "/config.json");
      },
    },
  ]);
  tray.setToolTip("Other settings/options");
  tray.setContextMenu(contextMenu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.setUserTasks([
    {
      program: process.execPath,
      arguments: "--new-window",
      iconPath: appIcon,
      iconIndex: 0,
      title: "New Window",
      description: "Create a new window",
    },
  ]);

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Set app name
app.setAppUserModelId("Hentai Web Windows");

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
