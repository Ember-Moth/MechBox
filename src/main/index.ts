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
  ipcMain.handle("db-query-bearings", (_) => {
    return getDatabase().prepare("SELECT * FROM bearing_basic").all();
  });

  ipcMain.handle("db-query-threads", (_) => {
    return getDatabase().prepare("SELECT * FROM thread_metric").all();
  });

  ipcMain.handle("db-query-bolts", (_) => {
    return getDatabase().prepare("SELECT * FROM fastener_hex_bolt").all();
  });

  // O-ring queries (V3)
  ipcMain.handle("db-query-oring-list", (_, standard?: string) => {
    if (standard) {
      return getDatabase()
        .prepare("SELECT * FROM seal_oring_size WHERE standard_id = ?")
        .all(standard);
    }
    return getDatabase().prepare("SELECT * FROM seal_oring_size").all();
  });

  ipcMain.handle("db-query-oring-spec", (_, standard, code) => {
    return getDatabase()
      .prepare("SELECT * FROM seal_oring_size WHERE standard_id = ? AND dash_code = ?")
      .get(standard, code);
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

  // 螺栓查询
  ipcMain.handle("db-search", (_, query: string, limit: number = 20) => {
    try {
      return getDatabase().prepare(
        `SELECT sd.*, match_info FROM search_fts sf 
         JOIN search_document sd ON sf.doc_id = sd.doc_id 
         WHERE search_fts MATCH ? ORDER BY rank LIMIT ?`
      ).all(`${query}*`, limit);
    } catch {
      return [];
    }
  });

  // 材料查询
  ipcMain.handle("db-query-materials", (_) => {
    return getDatabase().prepare("SELECT * FROM material_grade").all();
  });

  // 逆向识别向导 - 通过测量值反推标准规格 (Section 5.6)
  ipcMain.handle("db-reverse-identify", (_, type: string, measurements: Record<string, number>) => {
    if (type === 'thread') {
      // 通过外径和螺距反推螺纹规格
      const { outerDiameter, pitch } = measurements;
      const results = getDatabase().prepare(
        `SELECT *, ABS(nominal_d - ?) + ABS(pitch - ?) as diff FROM thread_metric ORDER BY diff ASC LIMIT 5`
      ).all(outerDiameter, pitch);
      return results;
    } else if (type === 'bearing') {
      // 通过内径、外径、宽度反推轴承型号
      const { id, od, width } = measurements;
      const results = getDatabase().prepare(
        `SELECT *, ABS(inner_diameter - ?) + ABS(outer_diameter - ?) + ABS(width - ?) as diff FROM bearing_basic ORDER BY diff ASC LIMIT 5`
      ).all(id || 0, od || 0, width || 0);
      return results;
    } else if (type === 'bolt') {
      // 通过直径、头宽、头高反推螺栓规格
      const { d, headWidth, headHeight } = measurements;
      const results = getDatabase().prepare(
        `SELECT *, ABS(nominal_d - ?) + ABS(head_width_s - ?) + ABS(head_height_k - ?) as diff FROM fastener_hex_bolt ORDER BY diff ASC LIMIT 5`
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

  // ============================================================
  // SQL Schema V3 - 新增 IPC 处理器 (基于 schema_v3.sql)
  // ============================================================

  // 六角螺母
  ipcMain.handle("db-query-nuts", (_) => {
    return getDatabase().prepare("SELECT * FROM fastener_hex_nut").all();
  });

  // 平垫圈
  ipcMain.handle("db-query-washers", (_) => {
    return getDatabase().prepare("SELECT * FROM fastener_plain_washer").all();
  });

  // 齿轮模数标准
  ipcMain.handle("db-query-gear-modules", (_) => {
    return getDatabase().prepare("SELECT * FROM gear_module_standard").all();
  });

  // O型圈材料
  ipcMain.handle("db-query-oring-materials", (_) => {
    return getDatabase().prepare("SELECT * FROM seal_oring_material").all();
  });

  // 材料等效/代换
  ipcMain.handle("db-query-material-equivalents", (_, materialId?: string) => {
    if (materialId) {
      return getDatabase()
        .prepare("SELECT * FROM material_equivalent WHERE material_id = ?")
        .all(materialId);
    }
    return getDatabase().prepare("SELECT * FROM material_equivalent").all();
  });

  // 制造商
  ipcMain.handle("db-query-manufacturers", (_) => {
    return getDatabase().prepare("SELECT * FROM manufacturer").all();
  });

  // 厂商零件目录
  ipcMain.handle("db-query-vendor-parts", (_, domainCode?: string) => {
    if (domainCode) {
      return getDatabase()
        .prepare("SELECT * FROM vendor_part WHERE domain_code = ?")
        .all(domainCode);
    }
    return getDatabase().prepare("SELECT * FROM vendor_part").all();
  });

  // 全局搜索 (FTS5)
  ipcMain.handle("db-global-search", (_, query: string, limit: number = 20) => {
    try {
      return getDatabase()
        .prepare("SELECT doc_id, entity_type, entity_id, title, snippet(search_fts, '<b>', '</b>', '...', 30) as snippet FROM search_fts JOIN search_document ON search_fts.doc_id = search_document.doc_id WHERE search_fts MATCH ? ORDER BY rank LIMIT ?")
        .all(`${query}*`, limit);
    } catch {
      return [];
    }
  });

  // 数据源
  ipcMain.handle("db-query-sources", (_) => {
    return getDatabase().prepare("SELECT * FROM source_provider").all();
  });

  // 标准体系
  ipcMain.handle("db-query-standard-systems", (_) => {
    return getDatabase().prepare("SELECT * FROM standard_system").all();
  });

  // 数据集版本
  ipcMain.handle("db-query-datasets", (_) => {
    return getDatabase().prepare("SELECT * FROM dataset_release").all();
  });

  // 规则表
  ipcMain.handle("db-query-rules", (_, ruleCode?: string) => {
    if (ruleCode) {
      const ruleTable = getDatabase()
        .prepare("SELECT * FROM rule_table WHERE rule_code = ?")
        .get(ruleCode);
      if (!ruleTable) return null;
      const rows = getDatabase()
        .prepare("SELECT * FROM rule_row WHERE rule_table_id = ? ORDER BY sort_order")
        .all(ruleTable.rule_table_id);
      return { table: ruleTable, rows };
    }
    return getDatabase().prepare("SELECT * FROM rule_table").all();
  });
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
