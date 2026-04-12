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

    // 使用 DROP 重置表结构，确保数据与 JSON 定义始终一致
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

  return db;
}

export function getDatabase() {
  return db;
}
