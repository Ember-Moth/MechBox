PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

BEGIN;

-- ============================================================
-- 治理层 (Governance Layer)
-- ============================================================

CREATE TABLE IF NOT EXISTS source_provider (
  source_id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (
    source_type IN ('public_open', 'purchased_standard', 'vendor_catalog', 'reference_db', 'enterprise')
  ),
  homepage_url TEXT,
  license_note TEXT,
  trust_level INTEGER NOT NULL DEFAULT 3 CHECK (trust_level BETWEEN 1 AND 5),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS standard_system (
  system_code TEXT PRIMARY KEY,
  system_name TEXT NOT NULL,
  issuer_name TEXT
);

CREATE TABLE IF NOT EXISTS standard_document (
  standard_id TEXT PRIMARY KEY,
  system_code TEXT NOT NULL,
  standard_number TEXT NOT NULL,
  title TEXT NOT NULL,
  domain_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'superseded', 'withdrawn', 'draft')
  ),
  notes TEXT,
  FOREIGN KEY (system_code) REFERENCES standard_system(system_code),
  UNIQUE (system_code, standard_number)
);

CREATE INDEX IF NOT EXISTS idx_standard_document_domain
  ON standard_document(domain_code);

CREATE TABLE IF NOT EXISTS standard_revision (
  revision_id TEXT PRIMARY KEY,
  standard_id TEXT NOT NULL,
  revision_code TEXT NOT NULL,
  version_label TEXT,
  publish_date TEXT,
  source_id TEXT,
  checksum TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (standard_id) REFERENCES standard_document(standard_id),
  FOREIGN KEY (source_id) REFERENCES source_provider(source_id),
  UNIQUE (standard_id, revision_code)
);

CREATE TABLE IF NOT EXISTS dataset_release (
  dataset_id TEXT PRIMARY KEY,
  dataset_name TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  source_id TEXT,
  revision_id TEXT,
  imported_at TEXT NOT NULL DEFAULT (datetime('now')),
  checksum TEXT,
  row_count INTEGER,
  notes TEXT,
  FOREIGN KEY (source_id) REFERENCES source_provider(source_id),
  FOREIGN KEY (revision_id) REFERENCES standard_revision(revision_id)
);

-- ============================================================
-- 业务主表层 (Business Layer - Strongly Typed)
-- ============================================================

-- 材料牌号
CREATE TABLE IF NOT EXISTS material_grade (
  material_id TEXT PRIMARY KEY,
  grade_code TEXT NOT NULL,
  grade_name TEXT NOT NULL,
  material_family TEXT NOT NULL,
  product_form TEXT,
  heat_treatment_state TEXT,
  density REAL,
  elastic_modulus REAL,
  shear_modulus REAL,
  yield_strength REAL,
  tensile_strength REAL,
  elongation REAL,
  temp_min REAL,
  temp_max REAL,
  dataset_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id)
);

CREATE INDEX IF NOT EXISTS idx_material_grade_code ON material_grade(grade_code);
CREATE INDEX IF NOT EXISTS idx_material_family ON material_grade(material_family);

-- 螺纹 (基础对象)
CREATE TABLE IF NOT EXISTS thread_metric (
  thread_id TEXT PRIMARY KEY,
  designation TEXT NOT NULL,
  nominal_d REAL NOT NULL,
  pitch REAL NOT NULL,
  pitch_series TEXT,
  major_diameter REAL,
  pitch_diameter REAL,
  minor_diameter REAL,
  tap_drill REAL,
  stress_area REAL,
  dataset_id TEXT,
  notes TEXT,
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id),
  UNIQUE (designation, pitch)
);

CREATE INDEX IF NOT EXISTS idx_thread_metric_nominal ON thread_metric(nominal_d, pitch);

-- O 型圈尺寸
CREATE TABLE IF NOT EXISTS seal_oring_size (
  oring_id TEXT PRIMARY KEY,
  standard_id TEXT,
  dash_code TEXT NOT NULL,
  inner_diameter REAL NOT NULL,
  cross_section REAL NOT NULL,
  tolerance_id_plus REAL,
  tolerance_id_minus REAL,
  tolerance_cs_plus REAL,
  tolerance_cs_minus REAL,
  series_code TEXT,
  dataset_id TEXT,
  notes TEXT,
  UNIQUE (standard_id, dash_code)
);

CREATE INDEX IF NOT EXISTS idx_seal_oring_size_dim ON seal_oring_size(inner_diameter, cross_section);

-- 六角螺栓
CREATE TABLE IF NOT EXISTS fastener_hex_bolt (
  bolt_id TEXT PRIMARY KEY,
  designation TEXT NOT NULL,
  thread_id TEXT,
  nominal_d REAL NOT NULL,
  length_l REAL,
  pitch REAL,
  head_width_s REAL,
  head_height_k REAL,
  thread_length_b REAL,
  strength_class TEXT,
  material_code TEXT,
  dataset_id TEXT,
  notes TEXT,
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id)
);

CREATE INDEX IF NOT EXISTS idx_fastener_hex_bolt_dim ON fastener_hex_bolt(nominal_d, strength_class);

-- 六角螺母
CREATE TABLE IF NOT EXISTS fastener_hex_nut (
  nut_id TEXT PRIMARY KEY,
  designation TEXT NOT NULL,
  thread_id TEXT,
  nominal_d REAL NOT NULL,
  pitch REAL,
  width_s REAL NOT NULL,
  height_m REAL NOT NULL,
  strength_class TEXT,
  material_code TEXT,
  dataset_id TEXT,
  notes TEXT,
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id)
);

CREATE INDEX IF NOT EXISTS idx_fastener_hex_nut_dim ON fastener_hex_nut(nominal_d, strength_class);

-- 平垫圈
CREATE TABLE IF NOT EXISTS fastener_plain_washer (
  washer_id TEXT PRIMARY KEY,
  designation TEXT NOT NULL,
  nominal_d REAL NOT NULL,
  inner_diameter REAL NOT NULL,
  outer_diameter REAL NOT NULL,
  thickness REAL NOT NULL,
  material_code TEXT,
  dataset_id TEXT,
  notes TEXT,
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id)
);

CREATE INDEX IF NOT EXISTS idx_fastener_plain_washer_dim ON fastener_plain_washer(nominal_d, inner_diameter, outer_diameter);

-- 轴承基本尺寸
CREATE TABLE IF NOT EXISTS bearing_basic (
  bearing_id TEXT PRIMARY KEY,
  designation TEXT NOT NULL,
  bearing_type TEXT NOT NULL,
  inner_diameter REAL NOT NULL,
  outer_diameter REAL NOT NULL,
  width REAL NOT NULL,
  dynamic_load_rating REAL,
  static_load_rating REAL,
  grease_speed_limit REAL,
  oil_speed_limit REAL,
  clearance_group TEXT,
  mass REAL,
  dataset_id TEXT,
  notes TEXT,
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id),
  UNIQUE (designation)
);

CREATE INDEX IF NOT EXISTS idx_bearing_basic_dim ON bearing_basic(inner_diameter, outer_diameter, width);

-- 齿轮标准模数
CREATE TABLE IF NOT EXISTS gear_module_standard (
  gear_module_id TEXT PRIMARY KEY,
  gear_type TEXT NOT NULL,
  pressure_angle_deg REAL NOT NULL DEFAULT 20,
  helix_angle_deg REAL NOT NULL DEFAULT 0,
  module_value REAL NOT NULL,
  module_system TEXT NOT NULL DEFAULT 'metric',
  note TEXT,
  dataset_id TEXT,
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id),
  UNIQUE (gear_type, pressure_angle_deg, helix_angle_deg, module_value, module_system)
);

CREATE INDEX IF NOT EXISTS idx_gear_module_standard_value ON gear_module_standard(gear_type, module_value);

-- ============================================================
-- 规则层 (Rule Layer)
-- ============================================================

CREATE TABLE IF NOT EXISTS rule_table (
  rule_table_id TEXT PRIMARY KEY,
  rule_code TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  domain_code TEXT NOT NULL,
  dataset_id TEXT,
  notes TEXT,
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id),
  UNIQUE (rule_code)
);

CREATE TABLE IF NOT EXISTS rule_row (
  rule_row_id TEXT PRIMARY KEY,
  rule_table_id TEXT NOT NULL,
  row_key TEXT NOT NULL,
  row_label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (rule_table_id) REFERENCES rule_table(rule_table_id) ON DELETE CASCADE,
  UNIQUE (rule_table_id, row_key)
);

CREATE TABLE IF NOT EXISTS rule_value_numeric (
  rule_row_id TEXT NOT NULL,
  column_code TEXT NOT NULL,
  numeric_value REAL NOT NULL,
  unit_code TEXT,
  FOREIGN KEY (rule_row_id) REFERENCES rule_row(rule_row_id) ON DELETE CASCADE,
  PRIMARY KEY (rule_row_id, column_code)
);

CREATE TABLE IF NOT EXISTS rule_value_text (
  rule_row_id TEXT NOT NULL,
  column_code TEXT NOT NULL,
  text_value TEXT NOT NULL,
  FOREIGN KEY (rule_row_id) REFERENCES rule_row(rule_row_id) ON DELETE CASCADE,
  PRIMARY KEY (rule_row_id, column_code)
);

-- ============================================================
-- 搜索层 (Search Layer - FTS5)
-- ============================================================

CREATE TABLE IF NOT EXISTS search_document (
  doc_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT
);

CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
  doc_id UNINDEXED,
  title,
  body,
  tags,
  tokenize = 'unicode61'
);

-- ============================================================
-- 用户数据 (User Data - 持久化)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_standards (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS data_version (
  standard_code TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  source TEXT DEFAULT 'system',
  updated_at TEXT DEFAULT (datetime('now')),
  checksum TEXT
);

COMMIT;
