import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { initDatabase, getDatabase } from "./db/database";
import { parseExcel, generateTemplate } from "./services/excel-import";
import { startWebSocketServer, stopWebSocketServer } from "./services/websocket-server";

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

  // 数据版本查询
  ipcMain.handle("db-query-data-version", (_) => {
    return getDatabase().prepare("SELECT * FROM data_version").all();
  });

  // 用户自定义标准 CRUD
  ipcMain.handle("db-user-standard-add", (_, id, category, data) => {
    const stmt = getDatabase().prepare(
      "INSERT OR REPLACE INTO user_standards (id, category, data) VALUES (?, ?, ?)",
    );
    return stmt.run(id, category, JSON.stringify(data));
  });

  ipcMain.handle("db-user-standard-query", (_, category) => {
    return getDatabase()
      .prepare("SELECT id, category, data, created_at, updated_at FROM user_standards WHERE category = ?")
      .all(category)
      .map((row: any) => ({ ...row, data: JSON.parse(row.data) }));
  });

  ipcMain.handle("db-user-standard-delete", (_, id) => {
    return getDatabase().prepare("DELETE FROM user_standards WHERE id = ?").run(id);
  });

  ipcMain.handle("db-user-standard-get", (_, id) => {
    const row = getDatabase().prepare("SELECT * FROM user_standards WHERE id = ?").get(id) as any;
    return row ? { ...row, data: JSON.parse(row.data) } : null;
  });

  // FTS5 模糊检索 - 高性能全文搜索 (Section 2.3.1)
  ipcMain.handle("db-fuzzy-search", (_, table: string, query: string, limit: number = 20) => {
    const ftsTable = `${table}_fts`;
    const baseTable = table;
    
    // 使用 FTS5 进行高性能模糊检索
    const sql = `
      SELECT b.*, rank
      FROM ${ftsTable} f
      JOIN ${baseTable} b ON b.rowid = f.rowid
      WHERE ${ftsTable} MATCH ?
      ORDER BY rank
      LIMIT ?
    `;
    
    try {
      // FTS5 查询语法：支持前缀匹配、通配符等
      const searchTerm = query.split(' ').map(w => `${w}*`).join(' ');
      return getDatabase().prepare(sql).all(searchTerm, limit);
    } catch (err) {
      // 回退到 LIKE 查询
      const likeSql = `SELECT * FROM ${baseTable} WHERE designation LIKE ? LIMIT ?`;
      return getDatabase().prepare(likeSql).all(`%${query}%`, limit);
    }
  });

  // 逆向识别向导 - 通过测量值反推标准规格 (Section 5.6)
  ipcMain.handle("db-reverse-identify", (_, type: string, measurements: Record<string, number>) => {
    if (type === 'thread') {
      // 通过外径和螺距反推螺纹规格
      const { outerDiameter, pitch } = measurements;
      const results = getDatabase().prepare(
        `SELECT *, ABS(d - ?) + ABS(pitch - ?) as diff FROM threads_iso_metric ORDER BY diff ASC LIMIT 5`
      ).all(outerDiameter, pitch);
      return results;
    } else if (type === 'bearing') {
      // 通过内径、外径、宽度反推轴承型号
      const { id, od, width } = measurements;
      const results = getDatabase().prepare(
        `SELECT *, ABS(inner_diameter - ?) + ABS(outer_diameter - ?) + ABS(width - ?) as diff FROM bearings_deep_groove ORDER BY diff ASC LIMIT 5`
      ).all(id || 0, od || 0, width || 0);
      return results;
    } else if (type === 'bolt') {
      // 通过直径、头宽、头高反推螺栓规格
      const { d, headWidth, headHeight } = measurements;
      const results = getDatabase().prepare(
        `SELECT *, ABS(d - ?) + ABS(head_width_s - ?) + ABS(head_height_k - ?) as diff FROM bolts_hex ORDER BY diff ASC LIMIT 5`
      ).all(d || 0, headWidth || 0, headHeight || 0);
      return results;
    }
    return [];
  });

  // Excel 导入 - 主进程解析 + JSON Schema 校验 (Section 2.3.3)
  ipcMain.handle("excel-import", async (_, templateType: string) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls', 'csv'] }]
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, errors: ['未选择文件'] }
    }
    
    return parseExcel(result.filePaths[0], templateType as any)
  })

  // 下载导入模板
  ipcMain.handle("excel-download-template", async (_, templateType: string, savePath: string) => {
    return generateTemplate(templateType as any, savePath)
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.mechbox.app");

  // 初始化数据库
  db = initDatabase();
  registerIpcHandlers();
  
  // Section 3: Start WebSocket server for CAD bidirectional sync
  try {
    startWebSocketServer();
  } catch (err: any) {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[WebSocket] Port 8321 in use, trying 8322...`);
      try {
        startWebSocketServer(8322);
      } catch { /* ignore secondary failure */ }
    }
  }

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
  stopWebSocketServer();
});
