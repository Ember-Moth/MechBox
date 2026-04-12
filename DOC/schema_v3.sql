PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

BEGIN;

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
  reaffirm_date TEXT,
  source_id TEXT,
  source_url TEXT,
  copyright_class TEXT DEFAULT 'public_open' CHECK (
    copyright_class IN ('public_open', 'restricted', 'licensed_internal', 'vendor_reference')
  ),
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

CREATE TABLE IF NOT EXISTS manufacturer (
  manufacturer_id TEXT PRIMARY KEY,
  manufacturer_name TEXT NOT NULL,
  country_code TEXT,
  homepage_url TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS material_grade (
  material_id TEXT PRIMARY KEY,
  standard_id TEXT,
  revision_id TEXT,
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
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'deprecated', 'draft')
  ),
  notes TEXT,
  FOREIGN KEY (standard_id) REFERENCES standard_document(standard_id),
  FOREIGN KEY (revision_id) REFERENCES standard_revision(revision_id),
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id)
);

CREATE INDEX IF NOT EXISTS idx_material_grade_code
  ON material_grade(grade_code);

CREATE INDEX IF NOT EXISTS idx_material_family
  ON material_grade(material_family);

CREATE TABLE IF NOT EXISTS material_alias (
  alias_id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id TEXT NOT NULL,
  alias_type TEXT NOT NULL CHECK (
    alias_type IN ('legacy_grade', 'commercial_name', 'search_keyword', 'equivalent_name')
  ),
  alias_value TEXT NOT NULL,
  FOREIGN KEY (material_id) REFERENCES material_grade(material_id) ON DELETE CASCADE,
  UNIQUE (material_id, alias_type, alias_value)
);

CREATE TABLE IF NOT EXISTS material_composition (
  material_id TEXT NOT NULL,
  element_symbol TEXT NOT NULL,
  min_percent REAL,
  max_percent REAL,
  target_percent REAL,
  FOREIGN KEY (material_id) REFERENCES material_grade(material_id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, element_symbol)
);

CREATE INDEX IF NOT EXISTS idx_material_composition_element
  ON material_composition(element_symbol);

CREATE TABLE IF NOT EXISTS material_property_set (
  property_set_id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL,
  condition_label TEXT,
  test_temperature_c REAL DEFAULT 20,
  source_id TEXT,
  source_url TEXT,
  note TEXT,
  FOREIGN KEY (material_id) REFERENCES material_grade(material_id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES source_provider(source_id)
);

CREATE TABLE IF NOT EXISTS material_property (
  property_set_id TEXT NOT NULL,
  property_code TEXT NOT NULL,
  numeric_value REAL,
  text_value TEXT,
  unit_code TEXT,
  FOREIGN KEY (property_set_id) REFERENCES material_property_set(property_set_id) ON DELETE CASCADE,
  PRIMARY KEY (property_set_id, property_code)
);

CREATE INDEX IF NOT EXISTS idx_material_property_code
  ON material_property(property_code, numeric_value);

CREATE TABLE IF NOT EXISTS material_equivalent (
  relation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id TEXT NOT NULL,
  external_system_code TEXT,
  external_grade_code TEXT,
  equivalence_level TEXT NOT NULL CHECK (
    equivalence_level IN ('exact', 'near', 'reference')
  ),
  note TEXT,
  FOREIGN KEY (material_id) REFERENCES material_grade(material_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS thread_metric (
  thread_id TEXT PRIMARY KEY,
  standard_id TEXT,
  revision_id TEXT,
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
  FOREIGN KEY (standard_id) REFERENCES standard_document(standard_id),
  FOREIGN KEY (revision_id) REFERENCES standard_revision(revision_id),
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id),
  UNIQUE (designation, pitch)
);

CREATE INDEX IF NOT EXISTS idx_thread_metric_nominal
  ON thread_metric(nominal_d, pitch);

CREATE TABLE IF NOT EXISTS seal_oring_size (
  oring_id TEXT PRIMARY KEY,
  standard_id TEXT,
  revision_id TEXT,
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
  FOREIGN KEY (standard_id) REFERENCES standard_document(standard_id),
  FOREIGN KEY (revision_id) REFERENCES standard_revision(revision_id),
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id),
  UNIQUE (revision_id, dash_code)
);

CREATE INDEX IF NOT EXISTS idx_seal_oring_size_dim
  ON seal_oring_size(inner_diameter, cross_section);

CREATE TABLE IF NOT EXISTS seal_oring_material (
  oring_material_id TEXT PRIMARY KEY,
  material_code TEXT NOT NULL,
  material_name TEXT NOT NULL,
  hardness_shore_a INTEGER,
  temperature_min_c REAL,
  temperature_max_c REAL,
  oil_resistance_rating TEXT,
  water_resistance_rating TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS fastener_hex_bolt (
  bolt_id TEXT PRIMARY KEY,
  standard_id TEXT,
  revision_id TEXT,
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
  finish_code TEXT,
  dataset_id TEXT,
  notes TEXT,
  FOREIGN KEY (standard_id) REFERENCES standard_document(standard_id),
  FOREIGN KEY (revision_id) REFERENCES standard_revision(revision_id),
  FOREIGN KEY (thread_id) REFERENCES thread_metric(thread_id),
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id)
);

CREATE INDEX IF NOT EXISTS idx_fastener_hex_bolt_dim
  ON fastener_hex_bolt(nominal_d, length_l, strength_class);

CREATE TABLE IF NOT EXISTS fastener_hex_nut (
  nut_id TEXT PRIMARY KEY,
  standard_id TEXT,
  revision_id TEXT,
  designation TEXT NOT NULL,
  thread_id TEXT,
  nominal_d REAL NOT NULL,
  pitch REAL,
  width_s REAL NOT NULL,
  height_m REAL NOT NULL,
  strength_class TEXT,
  material_code TEXT,
  finish_code TEXT,
  dataset_id TEXT,
  notes TEXT,
  FOREIGN KEY (standard_id) REFERENCES standard_document(standard_id),
  FOREIGN KEY (revision_id) REFERENCES standard_revision(revision_id),
  FOREIGN KEY (thread_id) REFERENCES thread_metric(thread_id),
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id)
);

CREATE INDEX IF NOT EXISTS idx_fastener_hex_nut_dim
  ON fastener_hex_nut(nominal_d, pitch, strength_class);

CREATE TABLE IF NOT EXISTS fastener_plain_washer (
  washer_id TEXT PRIMARY KEY,
  standard_id TEXT,
  revision_id TEXT,
  designation TEXT NOT NULL,
  nominal_d REAL NOT NULL,
  inner_diameter REAL NOT NULL,
  outer_diameter REAL NOT NULL,
  thickness REAL NOT NULL,
  material_code TEXT,
  finish_code TEXT,
  dataset_id TEXT,
  notes TEXT,
  FOREIGN KEY (standard_id) REFERENCES standard_document(standard_id),
  FOREIGN KEY (revision_id) REFERENCES standard_revision(revision_id),
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id)
);

CREATE INDEX IF NOT EXISTS idx_fastener_plain_washer_dim
  ON fastener_plain_washer(nominal_d, inner_diameter, outer_diameter);

CREATE TABLE IF NOT EXISTS bearing_basic (
  bearing_id TEXT PRIMARY KEY,
  standard_id TEXT,
  revision_id TEXT,
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
  FOREIGN KEY (standard_id) REFERENCES standard_document(standard_id),
  FOREIGN KEY (revision_id) REFERENCES standard_revision(revision_id),
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id),
  UNIQUE (designation)
);

CREATE INDEX IF NOT EXISTS idx_bearing_basic_dim
  ON bearing_basic(inner_diameter, outer_diameter, width);

CREATE TABLE IF NOT EXISTS gear_module_standard (
  gear_module_id TEXT PRIMARY KEY,
  standard_id TEXT,
  revision_id TEXT,
  gear_type TEXT NOT NULL,
  pressure_angle_deg REAL NOT NULL DEFAULT 20,
  helix_angle_deg REAL NOT NULL DEFAULT 0,
  module_value REAL NOT NULL,
  module_system TEXT NOT NULL DEFAULT 'metric',
  note TEXT,
  dataset_id TEXT,
  FOREIGN KEY (standard_id) REFERENCES standard_document(standard_id),
  FOREIGN KEY (revision_id) REFERENCES standard_revision(revision_id),
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id),
  UNIQUE (revision_id, gear_type, pressure_angle_deg, helix_angle_deg, module_value, module_system)
);

CREATE INDEX IF NOT EXISTS idx_gear_module_standard_value
  ON gear_module_standard(gear_type, module_value);

CREATE TABLE IF NOT EXISTS rule_table (
  rule_table_id TEXT PRIMARY KEY,
  rule_code TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  domain_code TEXT NOT NULL,
  standard_id TEXT,
  revision_id TEXT,
  dataset_id TEXT,
  notes TEXT,
  FOREIGN KEY (standard_id) REFERENCES standard_document(standard_id),
  FOREIGN KEY (revision_id) REFERENCES standard_revision(revision_id),
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id),
  UNIQUE (revision_id, rule_code)
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

CREATE INDEX IF NOT EXISTS idx_rule_value_numeric_col
  ON rule_value_numeric(column_code, numeric_value);

CREATE TABLE IF NOT EXISTS rule_value_text (
  rule_row_id TEXT NOT NULL,
  column_code TEXT NOT NULL,
  text_value TEXT NOT NULL,
  FOREIGN KEY (rule_row_id) REFERENCES rule_row(rule_row_id) ON DELETE CASCADE,
  PRIMARY KEY (rule_row_id, column_code)
);

CREATE TABLE IF NOT EXISTS vendor_part (
  vendor_part_id TEXT PRIMARY KEY,
  manufacturer_id TEXT NOT NULL,
  domain_code TEXT NOT NULL,
  vendor_part_number TEXT NOT NULL,
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  product_url TEXT,
  cad_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'obsolete', 'draft')
  ),
  description TEXT,
  dataset_id TEXT,
  FOREIGN KEY (manufacturer_id) REFERENCES manufacturer(manufacturer_id),
  FOREIGN KEY (dataset_id) REFERENCES dataset_release(dataset_id),
  UNIQUE (manufacturer_id, vendor_part_number)
);

CREATE INDEX IF NOT EXISTS idx_vendor_part_linked
  ON vendor_part(linked_entity_type, linked_entity_id);

CREATE TABLE IF NOT EXISTS vendor_part_ext_numeric (
  vendor_part_id TEXT NOT NULL,
  attr_code TEXT NOT NULL,
  numeric_value REAL NOT NULL,
  unit_code TEXT,
  FOREIGN KEY (vendor_part_id) REFERENCES vendor_part(vendor_part_id) ON DELETE CASCADE,
  PRIMARY KEY (vendor_part_id, attr_code)
);

CREATE TABLE IF NOT EXISTS vendor_part_ext_text (
  vendor_part_id TEXT NOT NULL,
  attr_code TEXT NOT NULL,
  text_value TEXT NOT NULL,
  FOREIGN KEY (vendor_part_id) REFERENCES vendor_part(vendor_part_id) ON DELETE CASCADE,
  PRIMARY KEY (vendor_part_id, attr_code)
);

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
