# MechBox 标准数据库 SQL 设计文档

> 目标：为 MechBox 提供一套适用于 `SQLite + better-sqlite3` 的离线标准数据库方案，覆盖密封圈、紧固件、材料牌号、轴承、齿轮五大类，并兼容当前已有的 `mechbox.db`。

---

## 1. 设计目标

- 兼容现有表：`oring_standards`、`threads_iso_metric`、`bolts_hex`、`bearings_deep_groove`、`user_standards`
- 新增统一标准元数据层，便于管理 `GB/GB/T/ISO/ASME/SAE/AGMA/ABMA/DIN/JIS`
- 支持“统一搜索 + 品类专表”两种查询方式
- 优先适配 `SQLite`
- 允许后续接入企业自定义标准和非标件

---

## 2. 建议目录分层

建议数据库逻辑分为四层：

1. `standards_meta`
   - 标准元信息
2. `parts_master`
   - 全局统一主索引
3. `parts_dimensions` / `parts_properties`
   - 动态维度参数和属性扩展
4. 品类专表
   - `oring_catalog`
   - `fastener_nuts`
   - `fastener_washers`
   - `materials_master`
   - `bearing_catalog`
   - `gear_standard_modules`

---

## 3. 推荐 SQL DDL

以下 SQL 可直接作为一期建库脚本使用。

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

BEGIN;

CREATE TABLE IF NOT EXISTS standards_meta (
  standard_code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  system TEXT NOT NULL,              -- GB, GB/T, ISO, ASME, SAE, DIN, JIS, AGMA, ABMA
  category TEXT NOT NULL,            -- seal, fastener, material, bearing, gear, tolerance, thread
  status TEXT DEFAULT 'active',      -- active, superseded, draft, withdrawn
  source_type TEXT DEFAULT 'system', -- system, imported, purchased, enterprise
  revision TEXT,
  publish_date TEXT,
  reaffirm_date TEXT,
  language TEXT DEFAULT 'zh-CN',
  copyright_note TEXT,
  source_url TEXT,
  checksum TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_standards_meta_system
  ON standards_meta(system);

CREATE INDEX IF NOT EXISTS idx_standards_meta_category
  ON standards_meta(category);


CREATE TABLE IF NOT EXISTS part_categories (
  category_code TEXT PRIMARY KEY,
  category_name TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS parts_master (
  id TEXT PRIMARY KEY,
  category_code TEXT NOT NULL,
  designation TEXT NOT NULL,         -- 规格主显示名
  standard_code TEXT,
  series TEXT,                       -- 系列/族
  subtype TEXT,                      -- 子类，例如 hex_bolt / deep_groove / o_ring
  material TEXT,
  strength_class TEXT,
  display_name TEXT,
  status TEXT DEFAULT 'active',
  source_type TEXT DEFAULT 'system',
  source_ref TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (category_code) REFERENCES part_categories(category_code),
  FOREIGN KEY (standard_code) REFERENCES standards_meta(standard_code)
);

CREATE INDEX IF NOT EXISTS idx_parts_master_category
  ON parts_master(category_code);

CREATE INDEX IF NOT EXISTS idx_parts_master_standard
  ON parts_master(standard_code);

CREATE INDEX IF NOT EXISTS idx_parts_master_designation
  ON parts_master(designation);


CREATE TABLE IF NOT EXISTS parts_dimensions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id TEXT NOT NULL,
  dim_key TEXT NOT NULL,             -- d, D, B, pitch, cs, id 等
  dim_value REAL NOT NULL,
  dim_unit TEXT DEFAULT 'mm',
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (part_id) REFERENCES parts_master(id) ON DELETE CASCADE,
  UNIQUE (part_id, dim_key)
);

CREATE INDEX IF NOT EXISTS idx_parts_dimensions_part
  ON parts_dimensions(part_id);

CREATE INDEX IF NOT EXISTS idx_parts_dimensions_key
  ON parts_dimensions(dim_key);


CREATE TABLE IF NOT EXISTS parts_properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id TEXT NOT NULL,
  prop_key TEXT NOT NULL,
  prop_value TEXT NOT NULL,
  value_type TEXT DEFAULT 'text',    -- text, number, json, bool
  FOREIGN KEY (part_id) REFERENCES parts_master(id) ON DELETE CASCADE,
  UNIQUE (part_id, prop_key)
);

CREATE INDEX IF NOT EXISTS idx_parts_properties_part
  ON parts_properties(part_id);

CREATE INDEX IF NOT EXISTS idx_parts_properties_key
  ON parts_properties(prop_key);


CREATE TABLE IF NOT EXISTS oring_catalog (
  id TEXT PRIMARY KEY,
  standard_code TEXT NOT NULL,
  code TEXT NOT NULL,                -- AS568-010 / G 系列等
  inner_diameter REAL NOT NULL,
  cross_section REAL NOT NULL,
  tolerance_id REAL,
  tolerance_cs REAL,
  material_family TEXT,              -- NBR, FKM, EPDM, VMQ
  hardness_shore_a INTEGER,
  application_type TEXT,             -- static, dynamic, hydraulic...
  source_ref TEXT,
  FOREIGN KEY (standard_code) REFERENCES standards_meta(standard_code),
  UNIQUE (standard_code, code, material_family)
);

CREATE INDEX IF NOT EXISTS idx_oring_catalog_standard
  ON oring_catalog(standard_code);

CREATE INDEX IF NOT EXISTS idx_oring_catalog_size
  ON oring_catalog(inner_diameter, cross_section);


CREATE TABLE IF NOT EXISTS fastener_nuts (
  id TEXT PRIMARY KEY,
  standard_code TEXT NOT NULL,
  designation TEXT NOT NULL,         -- M10, M12x1.25
  thread_designation TEXT NOT NULL,
  nominal_d REAL NOT NULL,
  pitch REAL,
  width_s REAL,
  height_m REAL,
  nut_type TEXT NOT NULL,            -- hex, flange, lock, thin
  product_grade TEXT,
  material TEXT,
  strength_class TEXT,
  coating TEXT,
  source_ref TEXT,
  FOREIGN KEY (standard_code) REFERENCES standards_meta(standard_code),
  UNIQUE (standard_code, designation, nut_type)
);

CREATE INDEX IF NOT EXISTS idx_fastener_nuts_thread
  ON fastener_nuts(thread_designation);

CREATE INDEX IF NOT EXISTS idx_fastener_nuts_nominal_d
  ON fastener_nuts(nominal_d);


CREATE TABLE IF NOT EXISTS fastener_washers (
  id TEXT PRIMARY KEY,
  standard_code TEXT NOT NULL,
  designation TEXT NOT NULL,
  nominal_d REAL NOT NULL,
  inner_diameter REAL NOT NULL,
  outer_diameter REAL NOT NULL,
  thickness REAL NOT NULL,
  washer_type TEXT NOT NULL,         -- plain, spring, lock, fender
  hardness TEXT,
  material TEXT,
  coating TEXT,
  source_ref TEXT,
  FOREIGN KEY (standard_code) REFERENCES standards_meta(standard_code),
  UNIQUE (standard_code, designation, washer_type)
);

CREATE INDEX IF NOT EXISTS idx_fastener_washers_nominal_d
  ON fastener_washers(nominal_d);


CREATE TABLE IF NOT EXISTS materials_master (
  id TEXT PRIMARY KEY,
  grade TEXT NOT NULL,               -- 45, 40Cr, 304, Q235B
  standard_code TEXT,
  country_system TEXT NOT NULL,      -- GB, ASTM, JIS, DIN, EN
  category TEXT NOT NULL,            -- carbon_steel, alloy_steel, stainless, aluminum...
  condition_code TEXT,               -- QT, normalized, annealed
  description TEXT,
  density REAL,
  elastic_modulus REAL,
  thermal_expansion REAL,
  standard_ref TEXT,
  source_type TEXT DEFAULT 'system',
  source_ref TEXT,
  FOREIGN KEY (standard_code) REFERENCES standards_meta(standard_code),
  UNIQUE (grade, country_system, COALESCE(condition_code, ''))
);

CREATE INDEX IF NOT EXISTS idx_materials_master_grade
  ON materials_master(grade);

CREATE INDEX IF NOT EXISTS idx_materials_master_category
  ON materials_master(category);


CREATE TABLE IF NOT EXISTS material_mechanical_props (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id TEXT NOT NULL,
  temperature_c REAL DEFAULT 20,
  yield_strength REAL,
  tensile_strength REAL,
  hardness TEXT,
  elongation REAL,
  reduction_of_area REAL,
  impact_toughness REAL,
  FOREIGN KEY (material_id) REFERENCES materials_master(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_material_mech_props_material
  ON material_mechanical_props(material_id);


CREATE TABLE IF NOT EXISTS material_chemical_ranges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id TEXT NOT NULL,
  element_symbol TEXT NOT NULL,      -- C, Si, Mn, Cr...
  min_value REAL,
  max_value REAL,
  unit TEXT DEFAULT '%',
  FOREIGN KEY (material_id) REFERENCES materials_master(id) ON DELETE CASCADE,
  UNIQUE (material_id, element_symbol)
);

CREATE INDEX IF NOT EXISTS idx_material_chemical_ranges_material
  ON material_chemical_ranges(material_id);


CREATE TABLE IF NOT EXISTS material_equivalents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id TEXT NOT NULL,
  equivalent_system TEXT NOT NULL,   -- ASTM, DIN, JIS, EN
  equivalent_grade TEXT NOT NULL,
  equivalence_level TEXT DEFAULT 'reference', -- exact, near, reference
  note TEXT,
  FOREIGN KEY (material_id) REFERENCES materials_master(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_material_equivalents_material
  ON material_equivalents(material_id);

CREATE INDEX IF NOT EXISTS idx_material_equivalents_grade
  ON material_equivalents(equivalent_grade);


CREATE TABLE IF NOT EXISTS bearing_catalog (
  id TEXT PRIMARY KEY,
  standard_code TEXT,
  designation TEXT NOT NULL,
  bearing_type TEXT NOT NULL,        -- deep_groove, angular_contact...
  inner_diameter REAL NOT NULL,
  outer_diameter REAL NOT NULL,
  width REAL NOT NULL,
  dynamic_load_rating REAL,
  static_load_rating REAL,
  grease_speed_limit REAL,
  oil_speed_limit REAL,
  mass REAL,
  clearance_group TEXT,
  accuracy_class TEXT,
  brand TEXT,
  source_ref TEXT,
  FOREIGN KEY (standard_code) REFERENCES standards_meta(standard_code),
  UNIQUE (designation, COALESCE(brand, 'generic'))
);

CREATE INDEX IF NOT EXISTS idx_bearing_catalog_designation
  ON bearing_catalog(designation);

CREATE INDEX IF NOT EXISTS idx_bearing_catalog_type
  ON bearing_catalog(bearing_type);

CREATE INDEX IF NOT EXISTS idx_bearing_catalog_size
  ON bearing_catalog(inner_diameter, outer_diameter, width);


CREATE TABLE IF NOT EXISTS gear_standard_modules (
  id TEXT PRIMARY KEY,
  standard_code TEXT,
  gear_type TEXT NOT NULL,           -- spur, helical, bevel, rack
  pressure_angle REAL NOT NULL DEFAULT 20,
  helix_angle REAL DEFAULT 0,
  module_value REAL NOT NULL,
  module_system TEXT DEFAULT 'metric',
  tooth_system TEXT DEFAULT 'involute',
  accuracy_class TEXT,
  note TEXT,
  FOREIGN KEY (standard_code) REFERENCES standards_meta(standard_code),
  UNIQUE (gear_type, pressure_angle, helix_angle, module_value, module_system)
);

CREATE INDEX IF NOT EXISTS idx_gear_standard_modules_type
  ON gear_standard_modules(gear_type);

CREATE INDEX IF NOT EXISTS idx_gear_standard_modules_module
  ON gear_standard_modules(module_value);


CREATE VIRTUAL TABLE IF NOT EXISTS parts_fts USING fts5(
  id UNINDEXED,
  category_code,
  designation,
  standard_code,
  display_name,
  material,
  strength_class,
  content=''
);

COMMIT;
```

---

## 4. 建议初始化基础数据

```sql
INSERT OR IGNORE INTO part_categories (category_code, category_name) VALUES
  ('seal', '密封件'),
  ('fastener', '紧固件'),
  ('material', '材料'),
  ('bearing', '轴承'),
  ('gear', '齿轮'),
  ('thread', '螺纹'),
  ('tolerance', '公差'),
  ('key', '键连接');

INSERT OR IGNORE INTO standards_meta (
  standard_code, title, system, category, status, source_type, revision, source_url
) VALUES
  ('AS568F', 'Aerospace Size Standard for O-Rings', 'SAE', 'seal', 'active', 'purchased', '2026-01-29 reaffirmed', 'https://saemobilus.sae.org/standards/as568f-aerospace-size-standard-o-rings'),
  ('GB/T 5782', '六角头螺栓', 'GB/T', 'fastener', 'active', 'system', NULL, 'https://openstd.samr.gov.cn/bzgk/std/index'),
  ('ISO 261', 'ISO general purpose metric screw threads', 'ISO', 'thread', 'active', 'system', NULL, 'https://www.iso.org/'),
  ('ISO 286', 'Geometrical product specifications - ISO code system for tolerances', 'ISO', 'tolerance', 'active', 'system', NULL, 'https://www.iso.org/'),
  ('GB/T 699', '优质碳素结构钢', 'GB/T', 'material', 'active', 'system', NULL, 'https://openstd.samr.gov.cn/bzgk/std/index'),
  ('GB/T 3077', '合金结构钢', 'GB/T', 'material', 'active', 'system', NULL, 'https://openstd.samr.gov.cn/bzgk/std/index');
```

---

## 5. 与当前 `mechbox.db` 的迁移方案

当前已存在表：

- `data_version`
- `user_standards`
- `tolerance_it_grades`
- `fundamental_deviations`
- `oring_standards`
- `bearings_deep_groove`
- `threads_iso_metric`
- `bolts_hex`

建议保留现有表用于兼容，同时新增本设计中的统一层表。迁移脚本如下：

```sql
BEGIN;

INSERT OR IGNORE INTO standards_meta (
  standard_code, title, system, category, status, source_type
) VALUES
  ('AS568', 'O-Ring Size Standard', 'SAE', 'seal', 'active', 'system'),
  ('ISO_METRIC_THREAD', 'ISO Metric Thread', 'ISO', 'thread', 'active', 'system'),
  ('HEX_BOLT', 'Hex Bolt', 'ISO', 'fastener', 'active', 'system'),
  ('DEEP_GROOVE', 'Deep Groove Ball Bearing', 'ISO', 'bearing', 'active', 'system');

INSERT OR IGNORE INTO part_categories (category_code, category_name) VALUES
  ('seal', '密封件'),
  ('thread', '螺纹'),
  ('fastener', '紧固件'),
  ('bearing', '轴承');


INSERT OR IGNORE INTO parts_master (
  id, category_code, designation, standard_code, subtype, display_name, source_type, source_ref
)
SELECT
  'oring:' || standard || ':' || code,
  'seal',
  code,
  standard,
  'o_ring',
  standard || ' ' || code,
  'system',
  'oring_standards'
FROM oring_standards;

INSERT OR IGNORE INTO parts_dimensions (part_id, dim_key, dim_value, dim_unit)
SELECT 'oring:' || standard || ':' || code, 'id', id, 'mm'
FROM oring_standards;

INSERT OR IGNORE INTO parts_dimensions (part_id, dim_key, dim_value, dim_unit)
SELECT 'oring:' || standard || ':' || code, 'cs', cs, 'mm'
FROM oring_standards;


INSERT OR IGNORE INTO parts_master (
  id, category_code, designation, standard_code, subtype, display_name, source_type, source_ref
)
SELECT
  'thread:' || designation,
  'thread',
  designation,
  'ISO_METRIC_THREAD',
  'iso_metric',
  designation,
  'system',
  'threads_iso_metric'
FROM threads_iso_metric;

INSERT OR IGNORE INTO parts_dimensions (part_id, dim_key, dim_value, dim_unit)
SELECT 'thread:' || designation, 'd', d, 'mm' FROM threads_iso_metric;

INSERT OR IGNORE INTO parts_dimensions (part_id, dim_key, dim_value, dim_unit)
SELECT 'thread:' || designation, 'pitch', pitch, 'mm' FROM threads_iso_metric;

INSERT OR IGNORE INTO parts_dimensions (part_id, dim_key, dim_value, dim_unit)
SELECT 'thread:' || designation, 'stress_area', stress_area, 'mm2' FROM threads_iso_metric;


INSERT OR IGNORE INTO parts_master (
  id, category_code, designation, standard_code, subtype, display_name, source_type, source_ref
)
SELECT
  'bolt:' || designation,
  'fastener',
  designation,
  COALESCE(standard, 'HEX_BOLT'),
  'hex_bolt',
  designation,
  'system',
  'bolts_hex'
FROM bolts_hex;

INSERT OR IGNORE INTO parts_dimensions (part_id, dim_key, dim_value, dim_unit)
SELECT 'bolt:' || designation, 'd', d, 'mm' FROM bolts_hex;

INSERT OR IGNORE INTO parts_dimensions (part_id, dim_key, dim_value, dim_unit)
SELECT 'bolt:' || designation, 'head_width_s', head_width_s, 'mm' FROM bolts_hex;

INSERT OR IGNORE INTO parts_dimensions (part_id, dim_key, dim_value, dim_unit)
SELECT 'bolt:' || designation, 'head_height_k', head_height_k, 'mm' FROM bolts_hex;


INSERT OR IGNORE INTO parts_master (
  id, category_code, designation, standard_code, subtype, display_name, source_type, source_ref
)
SELECT
  'bearing:' || designation,
  'bearing',
  designation,
  'DEEP_GROOVE',
  'deep_groove',
  designation,
  'system',
  'bearings_deep_groove'
FROM bearings_deep_groove;

INSERT OR IGNORE INTO parts_dimensions (part_id, dim_key, dim_value, dim_unit)
SELECT 'bearing:' || designation, 'd', inner_diameter, 'mm' FROM bearings_deep_groove;

INSERT OR IGNORE INTO parts_dimensions (part_id, dim_key, dim_value, dim_unit)
SELECT 'bearing:' || designation, 'D', outer_diameter, 'mm' FROM bearings_deep_groove;

INSERT OR IGNORE INTO parts_dimensions (part_id, dim_key, dim_value, dim_unit)
SELECT 'bearing:' || designation, 'B', width, 'mm' FROM bearings_deep_groove;

COMMIT;
```

---

## 6. 专表与统一层的关系

建议查询策略如下：

- 高性能列表页：优先查品类专表
- 全局检索页：优先查 `parts_master + parts_fts`
- 复杂筛选：`parts_master` 关联 `parts_dimensions / parts_properties`
- 计算模块：直接查专表，减少运行时解析 JSON

例如：

```sql
SELECT p.id, p.designation, p.standard_code, p.material
FROM parts_master p
WHERE p.category_code = 'fastener'
  AND p.subtype = 'hex_bolt';
```

---

## 7. 典型查询示例

### 7.1 查询某标准下的 O 型圈

```sql
SELECT code, inner_diameter, cross_section, material_family
FROM oring_catalog
WHERE standard_code = 'AS568F'
ORDER BY inner_diameter, cross_section;
```

### 7.2 查询 M10 对应六角螺母

```sql
SELECT designation, width_s, height_m, strength_class
FROM fastener_nuts
WHERE nominal_d = 10
ORDER BY pitch;
```

### 7.3 查询 40Cr 的机械性能

```sql
SELECT m.grade, m.country_system, mp.yield_strength, mp.tensile_strength, mp.hardness
FROM materials_master m
LEFT JOIN material_mechanical_props mp
  ON mp.material_id = m.id
WHERE m.grade = '40Cr';
```

### 7.4 查询 6205 轴承

```sql
SELECT designation, inner_diameter, outer_diameter, width,
       dynamic_load_rating, static_load_rating, grease_speed_limit
FROM bearing_catalog
WHERE designation = '6205';
```

### 7.5 查询常用标准模数

```sql
SELECT module_value
FROM gear_standard_modules
WHERE gear_type = 'spur'
  AND pressure_angle = 20
ORDER BY module_value;
```

---

## 8. 与现有代码的接入建议

你当前代码的数据库入口在：

- [src/main/db/database.ts](/home/nekorain/Documents/vibecoding/MechBox/src/main/db/database.ts)

建议改造顺序：

1. 保留现有表和导入逻辑
2. 在 `initDatabase()` 中新增本文件的统一层表
3. 将当前 JSON 导入同时写入：
   - 原专表
   - `parts_master`
   - `parts_dimensions`
4. 后续新增 `materials_master`、`fastener_nuts`、`fastener_washers`
5. 最后再统一接入 `parts_fts`

---

## 9. 一期最低可交付范围

建议第一阶段只做以下表，收益最高：

- `standards_meta`
- `part_categories`
- `parts_master`
- `parts_dimensions`
- `oring_catalog`
- `fastener_nuts`
- `fastener_washers`
- `materials_master`
- `material_mechanical_props`
- `bearing_catalog`
- `gear_standard_modules`

这样就能把当前“多个零散 JSON/SQLite 表”升级成“可持续扩库的标准平台”。

---

## 10. 后续可扩展表

后续如果继续扩库，可以加：

- `fastener_bolts`
- `fastener_screws`
- `retaining_rings`
- `parallel_keys`
- `spring_catalog`
- `belt_profiles`
- `chain_series`
- `seal_groove_rules`
- `material_heat_treatment_rules`
- `bearing_clearance_rules`
- `gear_strength_rules`

---

## 11. 结论

这套方案的核心不是“把所有零件塞进一个大表”，而是：

- 用 `standards_meta` 管标准
- 用 `parts_master` 管统一索引
- 用 `parts_dimensions / parts_properties` 管扩展字段
- 用品类专表保证查询性能和工程可读性

对于 MechBox 当前阶段，这是比“继续堆 JSON 文件”更稳妥的方向。
