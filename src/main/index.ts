import { app, BrowserWindow, shell, ipcMain } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { initDatabase, getDatabase } from "./db/database";

let db: any;

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// 注册数据库相关的 IPC 处理器
function registerIpcHandlers() {
  ipcMain.handle("db-query-it-grade", (_, grade, sizeIndex) => {
    return getDatabase()
      .prepare(
        "SELECT value FROM tolerance_it_grades WHERE grade = ? AND size_index = ?",
      )
      .get(grade, sizeIndex);
  });

  ipcMain.handle("db-query-deviation", (_, type, position, sizeIndex) => {
    return getDatabase()
      .prepare(
        "SELECT value FROM fundamental_deviations WHERE type = ? AND position = ? AND size_index = ?",
      )
      .get(type, position, sizeIndex);
  });

  ipcMain.handle("db-query-oring-list", (_, standard) => {
    return getDatabase()
      .prepare("SELECT * FROM oring_standards WHERE standard = ?")
      .all(standard);
  });

  ipcMain.handle("db-query-oring-spec", (_, standard, code) => {
    return getDatabase()
      .prepare("SELECT * FROM oring_standards WHERE standard = ? AND code = ?")
      .get(standard, code);
  });

  ipcMain.handle("db-query-bearings", (_) => {
    return getDatabase().prepare("SELECT * FROM bearings_deep_groove").all();
  });

  ipcMain.handle("db-query-threads", (_) => {
    return getDatabase().prepare("SELECT * FROM threads_iso_metric").all();
  });

  ipcMain.handle("db-query-bolts", (_) => {
    return getDatabase().prepare("SELECT * FROM bolts_hex").all();
  });
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.mechbox.app");

  // 初始化数据库
  db = initDatabase();
  registerIpcHandlers();

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
  if (db) db.close();
});
