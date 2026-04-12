import Database from "better-sqlite3";
import { app } from "electron";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync } from "fs";

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

  const isFirstRun = !existsSync(dbPath);

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

    if (isFirstRun) {
      console.log("First run detected - creating V3 schema...");
      createV3Schema();
      seedInitialData();
    } else {
      // 检查是否需要迁移到 V3
      migrateToV3IfNeeded();
    }

    console.log("Database initialization complete");
  } catch (err) {
    console.error("Database initialization failed:", err);
    throw err;
  }

  return db;
}

function createV3Schema() {
  const schemaSql = readFileSync(
    join(__dirname, "../../../DOC/schema_v3.sql"),
    "utf-8"
  );
  db.exec(schemaSql);
  console.log("V3 schema created successfully");
}

function seedInitialData() {
  const seedSql = readFileSync(
    join(__dirname, "../../../DOC/seed_sources_v3.sql"),
    "utf-8"
  );
  db.exec(seedSql);

  // 导入现有 JSON 数据到 V3 表
  importJsonToV3Tables();

  console.log("Initial data seeded successfully");
}

function importJsonToV3Tables() {
  // 导入螺纹数据
  const threadsData = require("../../../data/standards/threads/iso-metric.json");
  const insertThread = db.prepare(
    `INSERT OR IGNORE INTO thread_metric 
     (thread_id, designation, nominal_d, pitch, pitch_diameter, minor_diameter, stress_area)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  
  db.transaction((data: any) => {
    data.threads.forEach((t: any) => {
      insertThread.run(
        `thread_${t.designation.replace(/[^a-zA-Z0-9]/g, '_')}`,
        t.designation,
        t.d,
        t.pitch,
        t.d2,
        t.d1,
        t.stress_area
      );
    });
  })(threadsData);

  // 导入螺栓数据
  const boltsData = require("../../../data/standards/bolts/hex-bolts.json");
  const insertBolt = db.prepare(
    `INSERT OR IGNORE INTO fastener_hex_bolt 
     (bolt_id, designation, nominal_d, head_width_s, head_height_k)
     VALUES (?, ?, ?, ?, ?)`
  );

  db.transaction((data: any) => {
    data.bolts.forEach((b: any) => {
      insertBolt.run(
        `bolt_${b.designation.replace(/[^a-zA-Z0-9]/g, '_')}`,
        b.designation,
        b.d,
        b.head_width_s,
        b.head_height_k
      );
    });
  })(boltsData);

  // 导入轴承数据
  const bearingsData = require("../../../data/standards/bearings/deep-groove.json");
  const insertBearing = db.prepare(
    `INSERT OR IGNORE INTO bearing_basic 
     (bearing_id, designation, bearing_type, inner_diameter, outer_diameter, width, 
      dynamic_load_rating, static_load_rating, grease_speed_limit, oil_speed_limit, mass)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  db.transaction((data: any) => {
    data.bearings.forEach((b: any) => {
      insertBearing.run(
        `bearing_${b.designation}`,
        b.designation,
        data.type || 'deep_groove_ball',
        b.d,
        b.D,
        b.B,
        b.C_r,
        b.C_0r,
        b.speed_limit_grease,
        b.speed_limit_oil,
        b.mass
      );
    });
  })(bearingsData);

  // 导入 O 型圈数据
  const oringData = require("../../../data/standards/o-ring/as568.json");
  const insertOring = db.prepare(
    `INSERT OR IGNORE INTO seal_oring_size 
     (oring_id, standard_id, dash_code, inner_diameter, cross_section)
     VALUES (?, ?, ?, ?, ?)`
  );

  db.transaction((data: any) => {
    data.sizes.forEach((s: any) => {
      insertOring.run(
        `oring_${data.standard}_${s.code}`,
        data.standard,
        s.code,
        s.id,
        s.cs
      );
    });
  })(oringData);

  // 导入材料数据
  const materialsData = require("../../../data/materials-extended.json");
  const insertMaterial = db.prepare(
    `INSERT OR IGNORE INTO material_grade 
     (material_id, grade_code, grade_name, material_family, density, elastic_modulus, shear_modulus,
      yield_strength, tensile_strength, elongation, temp_min, temp_max, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  db.transaction((data: any) => {
    Object.entries(data).forEach(([category, materials]: [string, any]) => {
      if (Array.isArray(materials)) {
        materials.forEach((m: any) => {
          insertMaterial.run(
            `material_${m.designation.replace(/[^a-zA-Z0-9]/g, '_')}`,
            m.designation,
            m.name_zh,
            category,
            m.density,
            m.E,
            m.G,
            m.yield_strength,
            m.tensile_strength,
            m.elongation,
            m.temp_min,
            m.temp_max,
            m.notes
          );
        });
      }
    });
  })(materialsData);

  console.log("JSON data imported to V3 tables");
}

function migrateToV3IfNeeded() {
  // 检查是否已经有 V3 表
  const hasV3Tables = db.prepare(
    "SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='bearing_basic'"
  ).get() as { cnt: number };

  if (hasV3Tables.cnt === 0) {
    console.log("Migrating to V3 schema...");
    createV3Schema();
    importJsonToV3Tables();
    console.log("Migration complete");
  }
}

export function getDatabase() {
  return db;
}
