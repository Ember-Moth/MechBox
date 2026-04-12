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

    // Always create V3 schema (pure V3, no backward compatibility)
    createV3Schema();
    
    if (isFirstRun) {
      console.log("First run - seeding initial data...");
      seedInitialData();
    }

    console.log("Database initialization complete (V3 schema)");
  } catch (err) {
    console.error("Database initialization failed:", err);
    throw err;
  }

  return db;
}

function createV3Schema() {
  const candidates = [
    join(app.getAppPath(), "DOC", "schema_v3.sql"),
    join(__dirname, "../../../DOC/schema_v3.sql"),
    join(process.cwd(), "DOC", "schema_v3.sql"),
  ];
  const schemaPath = candidates.find((candidate) => existsSync(candidate));
  if (!schemaPath) {
    console.warn("V3 schema file not found. Checked:", candidates);
    return;
  }

  const schemaSql = readFileSync(schemaPath, "utf-8");
  db.exec(schemaSql);
  console.log("V3 schema loaded successfully from:", schemaPath);
}

function seedInitialData() {
  const candidates = [
    join(app.getAppPath(), "DOC", "seed_sources_v3.sql"),
    join(__dirname, "../../../DOC/seed_sources_v3.sql"),
    join(process.cwd(), "DOC", "seed_sources_v3.sql"),
  ];
  const seedPath = candidates.find((candidate) => existsSync(candidate));
  if (seedPath) {
    const seedSql = readFileSync(seedPath, "utf-8");
    db.exec(seedSql);
  }

  // Import JSON data into V3 tables
  importJsonToV3Tables();
  console.log("Initial data seeded successfully");
}

function importJsonToV3Tables() {
  // Import threads
  const threadsPath = join(__dirname, "../../../data/standards/threads/iso-metric.json");
  if (existsSync(threadsPath)) {
    const threadsData = require(threadsPath);
    const insertThread = db.prepare(
      `INSERT OR IGNORE INTO thread_metric
       (thread_id, standard_id, revision_id, designation, nominal_d, pitch, pitch_diameter, minor_diameter, stress_area, dataset_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    
    db.transaction((data: any) => {
      data.threads.forEach((t: any) => {
        insertThread.run(
          `thread_${t.designation.replace(/[^a-zA-Z0-9]/g, '_')}`,
          "std_iso_261",
          "rev_iso_261_default",
          t.designation,
          t.d,
          t.pitch,
          t.d2 || null,
          t.d1 || null,
          t.stress_area || null,
          "dataset_threads_iso_metric_json"
        );
      });
    })(threadsData);
  }

  // Import bolts
  const boltsPath = join(__dirname, "../../../data/standards/bolts/hex-bolts.json");
  if (existsSync(boltsPath)) {
    const boltsData = require(boltsPath);
    const insertBolt = db.prepare(
      `INSERT OR IGNORE INTO fastener_hex_bolt
       (bolt_id, standard_id, revision_id, designation, nominal_d, pitch, head_width_s, head_height_k, dataset_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    db.transaction((data: any) => {
      data.bolts.forEach((b: any) => {
        insertBolt.run(
          `bolt_${b.designation.replace(/[^a-zA-Z0-9]/g, '_')}`,
          b.standard?.includes("GB/T 5782") ? "std_gbt_5782" : "std_iso_4014",
          b.standard?.includes("GB/T 5782") ? "rev_gbt_5782_default" : "rev_iso_4014_default",
          b.designation,
          b.d,
          null,
          b.head_width_s,
          b.head_height_k,
          "dataset_bolts_hex_json"
        );
      });
    })(boltsData);
  }

  // Import bearings
  const bearingsPath = join(__dirname, "../../../data/standards/bearings/deep-groove.json");
  if (existsSync(bearingsPath)) {
    const bearingsData = require(bearingsPath);
    const insertBearing = db.prepare(
      `INSERT OR IGNORE INTO bearing_basic
       (bearing_id, standard_id, revision_id, designation, bearing_type, inner_diameter, outer_diameter, width,
        dynamic_load_rating, static_load_rating, grease_speed_limit, oil_speed_limit, mass, dataset_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    db.transaction((data: any) => {
      data.bearings.forEach((b: any) => {
        insertBearing.run(
          `bearing_${b.designation}`,
          "std_iso_281",
          "rev_iso_281_default",
          b.designation,
          data.type || 'deep_groove_ball',
          b.d,
          b.D,
          b.B,
          b.C_r,
          b.C_0r,
          b.speed_limit_grease,
          b.speed_limit_oil,
          b.mass,
          "dataset_bearings_deep_groove_json"
        );
      });
    })(bearingsData);
  }

  // Import O-rings
  const oringPath = join(__dirname, "../../../data/standards/o-ring/as568.json");
  if (existsSync(oringPath)) {
    const oringData = require(oringPath);
    const insertOring = db.prepare(
      `INSERT OR IGNORE INTO seal_oring_size
       (oring_id, standard_id, revision_id, dash_code, inner_diameter, cross_section, dataset_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    db.transaction((data: any) => {
      data.sizes.forEach((s: any) => {
        insertOring.run(
          `oring_${data.standard}_${s.code}`,
          "std_as568",
          "rev_as568f",
          s.code,
          s.id,
          s.cs,
          "dataset_oring_as568_json"
        );
      });
    })(oringData);
  }

  // Import materials
  const materialsPath = join(__dirname, "../../../data/materials-extended.json");
  if (existsSync(materialsPath)) {
    const materialsData = require(materialsPath);
    const insertMaterial = db.prepare(
      `INSERT OR IGNORE INTO material_grade
       (material_id, standard_id, revision_id, grade_code, grade_name, material_family, heat_treatment_state,
        density, elastic_modulus, shear_modulus, yield_strength, tensile_strength, elongation, temp_min, temp_max,
        dataset_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const insertPropertySet = db.prepare(
      `INSERT OR IGNORE INTO material_property_set
       (property_set_id, material_id, condition_label, test_temperature_c, source_id, note)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    const insertProperty = db.prepare(
      `INSERT OR IGNORE INTO material_property
       (property_set_id, property_code, numeric_value, text_value, unit_code)
       VALUES (?, ?, ?, ?, ?)`
    );

    const insertEquivalent = db.prepare(
      `INSERT OR IGNORE INTO material_equivalent
       (material_id, external_system_code, external_grade_code, equivalence_level, note)
       VALUES (?, ?, ?, ?, ?)`
    );

    db.transaction((data: any) => {
      Object.entries(data).forEach(([category, materials]: [string, any]) => {
        if (Array.isArray(materials)) {
          materials.forEach((m: any) => {
            const materialId = `material_${m.designation.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const standardRef = Array.isArray(m.standards) && m.standards.includes("GB/T 3077")
              ? ["std_gbt_3077", "rev_gbt_3077_default"]
              : ["std_gbt_700", "rev_gbt_700_default"];

            insertMaterial.run(
              materialId,
              standardRef[0],
              standardRef[1],
              m.designation,
              m.name_zh,
              category,
              m.condition || null,
              m.density || null,
              m.E || null,
              m.G || null,
              m.yield_strength || null,
              m.tensile_strength || null,
              m.elongation || null,
              m.temp_min || null,
              m.temp_max || null,
              "dataset_materials_extended_json",
              m.notes || null
            );

            const propertySetId = `${materialId}_default_props`;
            insertPropertySet.run(
              propertySetId,
              materialId,
              m.condition || "default",
              20,
              "samr_openstd",
              "Generated from materials-extended.json"
            );

            const numericProperties: Array<[string, number | null | undefined, string | null]> = [
              ["density", m.density, "g/cm3"],
              ["elastic_modulus", m.E, "MPa"],
              ["shear_modulus", m.G, "MPa"],
              ["yield_strength", m.yield_strength, "MPa"],
              ["tensile_strength", m.tensile_strength, "MPa"],
              ["elongation", m.elongation, "pct"],
              ["temp_min", m.temp_min, "degC"],
              ["temp_max", m.temp_max, "degC"],
              ["hardness_brinell", m.hardness_brinell, "HB"],
            ];

            numericProperties.forEach(([code, value, unit]) => {
              if (value !== null && value !== undefined) {
                insertProperty.run(propertySetId, code, value, null, unit);
              }
            });

            Object.entries(m.equivalents || {}).forEach(([system, grade]) => {
              insertEquivalent.run(
                materialId,
                system,
                grade as string,
                "reference",
                "Imported from materials-extended.json"
              );
            });
          });
        }
      });
    })(materialsData);
  }

  // Seed common standard spur/helical modules used by catalog products
  const commonModules = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const insertGearModule = db.prepare(
    `INSERT OR IGNORE INTO gear_module_standard
     (gear_module_id, standard_id, revision_id, gear_type, pressure_angle_deg, helix_angle_deg, module_value, module_system, dataset_id, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  db.transaction(() => {
    commonModules.forEach((moduleValue) => {
      ["spur", "helical"].forEach((gearType) => {
        insertGearModule.run(
          `gear_module_${gearType}_${String(moduleValue).replace('.', '_')}`,
          "std_jis_b_1704",
          "rev_jis_b_1704_default",
          gearType,
          20,
          gearType === "helical" ? 15 : 0,
          moduleValue,
          "metric",
          "dataset_khk_vendor_seed",
          "Seeded common metric modules"
        );
      });
    });
  })();

  console.log("JSON data imported to V3 tables");
}

export function getDatabase() {
  return db;
}
