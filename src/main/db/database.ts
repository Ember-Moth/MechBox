import Database from "better-sqlite3";
import { app } from "electron";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import iso286Data from "../../../data/standards/tolerances/iso286.json";
import as568Data from "../../../data/standards/o-ring/as568.json";
import deepGrooveData from "../../../data/standards/bearings/deep-groove.json";
import isoMetricThreadsData from "../../../data/standards/threads/iso-metric.json";
import hexBoltsData from "../../../data/standards/bolts/hex-bolts.json";

let db: Database.Database;

export function initDatabase() {
  const isDev = !app.isPackaged;
  const dbDir = isDev
    ? join(app.getAppPath(), "data")
    : app.getPath("userData");

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = join(dbDir, "mechbox.db");
  console.log("Attempting to open database at:", dbPath);

  try {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    // 数据版本追踪表
    db.prepare(
      `CREATE TABLE IF NOT EXISTS data_version (
        standard_code TEXT PRIMARY KEY,
        version TEXT NOT NULL,
        source TEXT DEFAULT 'system',
        updated_at TEXT DEFAULT (datetime('now')),
        checksum TEXT
      )`,
    ).run();

    // 用户自定义标准表
    db.prepare(
      `CREATE TABLE IF NOT EXISTS user_standards (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
    ).run();

    // 使用 DROP 重置系统表结构，确保数据与 JSON 定义始终一致
    db.exec("DROP TABLE IF EXISTS tolerance_it_grades");
    db.exec("DROP TABLE IF EXISTS fundamental_deviations");
    db.exec("DROP TABLE IF EXISTS oring_standards");
    db.exec("DROP TABLE IF EXISTS bearings_deep_groove");
    db.exec("DROP TABLE IF EXISTS threads_iso_metric");
    db.exec("DROP TABLE IF EXISTS bolts_hex");
    console.log("Tables dropped successfully");
  } catch (err) {
    console.error("Database initialization failed:", err);
    throw err;
  }

  db.prepare(
    `CREATE TABLE tolerance_it_grades (grade TEXT, size_index INTEGER, value INTEGER, PRIMARY KEY (grade, size_index))`,
  ).run();
  db.prepare(
    `CREATE TABLE fundamental_deviations (type TEXT, position TEXT, size_index INTEGER, value INTEGER, PRIMARY KEY (type, position, size_index))`,
  ).run();
  db.prepare(
    `CREATE TABLE oring_standards (standard TEXT, code TEXT, id REAL, cs REAL, PRIMARY KEY (standard, code))`,
  ).run();
  db.prepare(
    `CREATE TABLE bearings_deep_groove (designation TEXT PRIMARY KEY, inner_diameter REAL, outer_diameter REAL, width REAL, C_r REAL, C_0r REAL, speed_limit_grease REAL, speed_limit_oil REAL, mass REAL)`,
  ).run();
  db.prepare(
    `CREATE TABLE threads_iso_metric (designation TEXT PRIMARY KEY, d REAL, pitch REAL, d2 REAL, d1 REAL, stress_area REAL)`,
  ).run();
  db.prepare(
    `CREATE TABLE bolts_hex (designation TEXT PRIMARY KEY, d REAL, head_width_s REAL, head_height_k REAL, standard TEXT)`,
  ).run();

  // FTS5 全文搜索虚拟表 - 高性能模糊检索 (Section 2.3.1)
  db.prepare(
    `CREATE VIRTUAL TABLE IF NOT EXISTS bearings_fts USING fts5(designation, inner_diameter, outer_diameter, width, C_r, C_0r, content='bearings_deep_groove', content_rowid='rowid')`,
  ).run();
  db.prepare(
    `CREATE VIRTUAL TABLE IF NOT EXISTS bolts_fts USING fts5(designation, d, head_width_s, head_height_k, standard, content='bolts_hex', content_rowid='rowid')`,
  ).run();
  db.prepare(
    `CREATE VIRTUAL TABLE IF NOT EXISTS threads_fts USING fts5(designation, d, pitch, d2, d1, stress_area, content='threads_iso_metric', content_rowid='rowid')`,
  ).run();

  // 导入数据
  const insertIT = db.prepare(
    "INSERT INTO tolerance_it_grades (grade, size_index, value) VALUES (?, ?, ?)",
  );
  db.transaction((data) => {
    for (const [grade, values] of Object.entries(data)) {
      (values as number[]).forEach((val, idx) => insertIT.run(grade, idx, val));
    }
  })(iso286Data.it_grades);

  const insertDev = db.prepare(
    "INSERT INTO fundamental_deviations (type, position, size_index, value) VALUES (?, ?, ?, ?)",
  );
  db.transaction((data) => {
    for (const [type, positions] of Object.entries(data)) {
      for (const [pos, values] of Object.entries(positions as any)) {
        (values as number[]).forEach((val, idx) =>
          insertDev.run(type, pos, idx, val),
        );
      }
    }
  })(iso286Data.fundamental_deviations);

  const insertOring = db.prepare(
    "INSERT INTO oring_standards (standard, code, id, cs) VALUES (?, ?, ?, ?)",
  );
  db.transaction((data) => {
    data.sizes.forEach((s: any) =>
      insertOring.run(data.standard, s.code, s.id, s.cs),
    );
  })(as568Data);

  const insertBearing = db.prepare(
    "INSERT INTO bearings_deep_groove (designation, inner_diameter, outer_diameter, width, C_r, C_0r, speed_limit_grease, speed_limit_oil, mass) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  db.transaction((data) => {
    data.bearings.forEach((b: any) =>
      insertBearing.run(
        b.designation,
        b.d,
        b.D,
        b.B,
        b.C_r,
        b.C_0r,
        b.speed_limit_grease,
        b.speed_limit_oil,
        b.mass,
      ),
    );
  })(deepGrooveData);

  const insertThread = db.prepare(
    "INSERT INTO threads_iso_metric (designation, d, pitch, d2, d1, stress_area) VALUES (?, ?, ?, ?, ?, ?)",
  );
  db.transaction((data) => {
    data.threads.forEach((t: any) =>
      insertThread.run(t.designation, t.d, t.pitch, t.d2, t.d1, t.stress_area),
    );
  })(isoMetricThreadsData);

  const insertBolt = db.prepare(
    "INSERT INTO bolts_hex (designation, d, head_width_s, head_height_k, standard) VALUES (?, ?, ?, ?, ?)",
  );
  db.transaction((data) => {
    data.bolts.forEach((b: any) =>
      insertBolt.run(
        b.designation,
        b.d,
        b.head_width_s,
        b.head_height_k,
        b.standard,
      ),
    );
  })(hexBoltsData);

  // 记录系统标准数据版本
  const insertVersion = db.prepare(
    "INSERT OR REPLACE INTO data_version (standard_code, version, source, checksum) VALUES (?, ?, ?, ?)",
  );
  
  // 简单版本：使用记录数作为 checksum
  const versionRecords = [
    ['ISO286', '1.0.0', 'system', `it_grades:${iso286Data.it_grades ? Object.keys(iso286Data.it_grades).length : 0}`],
    ['AS568', '1.0.0', 'system', `sizes:${as568Data.sizes ? as568Data.sizes.length : 0}`],
    ['DEEP_GROOVE', '1.0.0', 'system', `bearings:${deepGrooveData.bearings ? deepGrooveData.bearings.length : 0}`],
    ['ISO_METRIC_THREAD', '1.0.0', 'system', `threads:${isoMetricThreadsData.threads ? isoMetricThreadsData.threads.length : 0}`],
    ['HEX_BOLT', '1.0.0', 'system', `bolts:${hexBoltsData.bolts ? hexBoltsData.bolts.length : 0}`],
  ];
  
  const insertVersions = db.transaction(() => {
    versionRecords.forEach(([code, version, source, checksum]) => {
      insertVersion.run(code, version, source, checksum);
    });
  });
  insertVersions();
  console.log("Data versions recorded");

  // 同步 FTS5 索引 - 高性能模糊检索
  db.exec(`
    INSERT OR REPLACE INTO bearings_fts(rowid, designation, inner_diameter, outer_diameter, width, C_r, C_0r)
    SELECT rowid, designation, inner_diameter, outer_diameter, width, C_r, C_0r FROM bearings_deep_groove;
    
    INSERT OR REPLACE INTO bolts_fts(rowid, designation, d, head_width_s, head_height_k, standard)
    SELECT rowid, designation, d, head_width_s, head_height_k, standard FROM bolts_hex;
    
    INSERT OR REPLACE INTO threads_fts(rowid, designation, d, pitch, d2, d1, stress_area)
    SELECT rowid, designation, d, pitch, d2, d1, stress_area FROM threads_iso_metric;
  `);
  console.log("FTS5 indexes built successfully");

  return db;
}

export function getDatabase() {
  return db;
}
