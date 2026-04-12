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
  // 开发环境下将数据库存放在项目根目录的 data 文件夹中，方便查看和管理
  // 生产环境（打包后）存放在用户数据目录，避免权限问题
  const isDev = !app.isPackaged;
  const dbDir = isDev
    ? join(app.getAppPath(), "data")
    : app.getPath("userData");

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = join(dbDir, "mechbox.db");

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  // 创建公差 IT 等级表
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS tolerance_it_grades (
      grade TEXT,
      size_index INTEGER,
      value INTEGER,
      PRIMARY KEY (grade, size_index)
    )
  `,
  ).run();

  // 创建基本偏差表
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS fundamental_deviations (
      type TEXT, -- 'holes' or 'shafts'
      position TEXT,
      size_index INTEGER,
      value INTEGER,
      PRIMARY KEY (type, position, size_index)
    )
  `,
  ).run();

  // 创建 O型圈标准表
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS oring_standards (
      standard TEXT,
      code TEXT,
      id REAL,
      cs REAL,
      PRIMARY KEY (standard, code)
    )
  `,
  ).run();

  // 创建深沟球轴承表
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS bearings_deep_groove (
      designation TEXT PRIMARY KEY,
      d REAL,
      D REAL,
      B REAL,
      C_r REAL,
      C_0r REAL,
      speed_limit_grease REAL,
      speed_limit_oil REAL,
      mass REAL
    )
  `,
  ).run();

  // 创建 ISO 公制螺纹表
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS threads_iso_metric (
      designation TEXT PRIMARY KEY,
      d REAL,
      pitch REAL,
      d2 REAL,
      d1 REAL,
      stress_area REAL
    )
  `,
  ).run();

  // 创建六角螺栓表
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS bolts_hex (
      designation TEXT PRIMARY KEY,
      d REAL,
      head_width_s REAL,
      head_height_k REAL,
      standard TEXT
    )
  `,
  ).run();

  // 导入初始数据 (仅当表为空时)

  // 导入初始数据 (仅当表为空时)
  const itCount = db
    .prepare("SELECT count(*) as count FROM tolerance_it_grades")
    .get() as { count: number };
  if (itCount.count === 0) {
    const insertIT = db.prepare(
      "INSERT INTO tolerance_it_grades (grade, size_index, value) VALUES (?, ?, ?)",
    );
    const transaction = db.transaction((data) => {
      for (const [grade, values] of Object.entries(data)) {
        (values as number[]).forEach((val, idx) =>
          insertIT.run(grade, idx, val),
        );
      }
    });
    transaction(iso286Data.it_grades);
  }

  const devCount = db
    .prepare("SELECT count(*) as count FROM fundamental_deviations")
    .get() as { count: number };
  if (devCount.count === 0) {
    const insertDev = db.prepare(
      "INSERT INTO fundamental_deviations (type, position, size_index, value) VALUES (?, ?, ?, ?)",
    );
    const transaction = db.transaction((data) => {
      for (const [type, positions] of Object.entries(data)) {
        for (const [pos, values] of Object.entries(positions as any)) {
          (values as number[]).forEach((val, idx) =>
            insertDev.run(type, pos, idx, val),
          );
        }
      }
    });
    transaction(iso286Data.fundamental_deviations);
  }

  const oringCount = db
    .prepare("SELECT count(*) as count FROM oring_standards")
    .get() as { count: number };
  if (oringCount.count === 0) {
    const insertOring = db.prepare(
      "INSERT INTO oring_standards (standard, code, id, cs) VALUES (?, ?, ?, ?)",
    );
    const transaction = db.transaction((data) => {
      data.sizes.forEach((s: any) =>
        insertOring.run(data.standard, s.code, s.id, s.cs),
      );
    });
    transaction(as568Data);
  }

  const bearingsCount = db
    .prepare("SELECT count(*) as count FROM bearings_deep_groove")
    .get() as { count: number };
  if (bearingsCount.count === 0) {
    const insertBearing = db.prepare(
      "INSERT INTO bearings_deep_groove (designation, d, D, B, C_r, C_0r, speed_limit_grease, speed_limit_oil, mass) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const transaction = db.transaction((data) => {
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
    });
    transaction(deepGrooveData);
  }

  const threadsCount = db
    .prepare("SELECT count(*) as count FROM threads_iso_metric")
    .get() as { count: number };
  if (threadsCount.count === 0) {
    const insertThread = db.prepare(
      "INSERT INTO threads_iso_metric (designation, d, pitch, d2, d1, stress_area) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const transaction = db.transaction((data) => {
      data.threads.forEach((t: any) =>
        insertThread.run(
          t.designation,
          t.d,
          t.pitch,
          t.d2,
          t.d1,
          t.stress_area,
        ),
      );
    });
    transaction(isoMetricThreadsData);
  }

  const boltsCount = db
    .prepare("SELECT count(*) as count FROM bolts_hex")
    .get() as { count: number };
  if (boltsCount.count === 0) {
    const insertBolt = db.prepare(
      "INSERT INTO bolts_hex (designation, d, head_width_s, head_height_k, standard) VALUES (?, ?, ?, ?, ?)",
    );
    const transaction = db.transaction((data) => {
      data.bolts.forEach((b: any) =>
        insertBolt.run(
          b.designation,
          b.d,
          b.head_width_s,
          b.head_height_k,
          b.standard,
        ),
      );
    });
    transaction(hexBoltsData);
  }

  console.log("Database initialized at:", dbPath);
  return db;
}

export function getDatabase() {
  return db;
}
