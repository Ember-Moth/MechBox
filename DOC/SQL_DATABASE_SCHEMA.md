# MechBox V3 数据库设计文档

> 目标：为离线机械工具箱设计一套真正适合工程标准库的 `SQLite` 数据库。  
> 设计原则：不用旧库兼容包袱，不走纯大宽表，也不走纯 EAV，采用“治理层统一 + 业务层强类型 + 扩展层泛型”的混合架构。

---

## 1. 结论先说

如果你要的是“最好”，那就不该选下面两种极端方案：

- 纯大宽表
  - 查询简单，但扩品类时会失控
- 纯 EAV
  - 灵活，但工程查询、约束校验、导入维护都很痛苦

对机械标准数据库最稳的方案是：

1. 治理层统一
   - 管标准、版本、来源、版权、导入批次
2. 业务层强类型
   - O 型圈、螺纹、螺栓、螺母、垫圈、轴承、材料、齿轮、规则表都各有专表
3. 扩展层泛型
   - 只给厂商目录、企业自定义字段、少量长尾属性使用
4. 搜索层独立
   - 用统一搜索文档和 FTS，而不是直接拿业务表硬搜

这套才是对 `SQLite + 工程标准件 + 长期扩库` 最合适的设计。

---

## 2. 为什么这版比上一版更好

上一版的问题不是“错”，而是“太泛化”。

它更像一个通用主数据平台，但你要做的是机械标准数据库。机械数据库有几个很硬的要求：

- 尺寸字段必须强类型
- 单位必须清晰
- 常用筛选必须走索引
- 导入标准表时必须容易校验
- 查询语句要让人一眼能懂
- 以后做计算引擎时，不能每次都去拼 EAV

所以更好的设计不是更抽象，而是：

- 治理和搜索抽象
- 业务数据具体

换句话说：

- `标准怎么管` 要统一
- `O 型圈怎么存` 要具体
- `螺栓怎么存` 要具体
- `轴承怎么存` 要具体
- `材料性能怎么存` 要具体

---

## 3. 总体架构

推荐拆成五层：

1. 治理层
   - 来源、标准体系、标准文档、标准版本、导入批次
2. 业务主表层
   - 各品类强类型表
3. 规则表层
   - 公差、沟槽、模数、推荐值
4. 扩展层
   - 企业自定义、厂商长尾字段
5. 搜索层
   - 统一搜索文档 + FTS

---

## 4. 表设计原则

### 4.1 必须强类型的对象

以下对象必须专表：

- O 型圈尺寸
- 公制螺纹
- 六角螺栓
- 六角螺母
- 平垫圈
- 轴承基本尺寸与额定载荷
- 材料牌号
- 材料成分
- 材料性能
- 齿轮标准模数

原因很简单：这些对象将被高频查询、高频计算、高频导入。

### 4.2 必须独立建模的规则型数据

以下内容不要伪装成零件型号：

- `ISO 286` 公差等级
- O 型圈沟槽推荐
- 齿轮标准模数表
- 轴承游隙规则
- 紧固件推荐预紧或扭矩参考

它们应该是规则表，不是零件表。

### 4.3 只适合放到扩展层的内容

- 厂商特有属性
- 企业内部字段
- 很少用、又不稳定的长尾属性

这些用泛型扩展表最合理。

---

## 5. 核心 DDL

```sql
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
  withdraw_date TEXT,
  source_id TEXT,
  source_url TEXT,
  copyright_class TEXT NOT NULL CHECK (
    copyright_class IN ('public_open', 'restricted', 'licensed_internal', 'vendor_reference')
  ),
  checksum TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (standard_id) REFERENCES standard_document(standard_id),
  FOREIGN KEY (source_id) REFERENCES source_provider(source_id),
  UNIQUE (standard_id, revision_code)
);

CREATE INDEX IF NOT EXISTS idx_standard_revision_standard
  ON standard_revision(standard_id);


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
  country_or_region TEXT,
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
  target_material_id TEXT,
  external_system_code TEXT,
  external_grade_code TEXT,
  equivalence_level TEXT NOT NULL CHECK (
    equivalence_level IN ('exact', 'near', 'reference')
  ),
  note TEXT,
  FOREIGN KEY (material_id) REFERENCES material_grade(material_id) ON DELETE CASCADE,
  FOREIGN KEY (target_material_id) REFERENCES material_grade(material_id)
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
  thread_id TEXT NOT NULL,
  nominal_d REAL NOT NULL,
  length_l REAL,
  pitch REAL,
  head_width_s REAL,
  head_height_k REAL,
  under_head_radius REAL,
  thread_length_b REAL,
  product_grade TEXT,
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
  thread_id TEXT NOT NULL,
  nominal_d REAL NOT NULL,
  pitch REAL,
  width_s REAL NOT NULL,
  height_m REAL NOT NULL,
  nut_style TEXT,
  product_grade TEXT,
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
  washer_series TEXT,
  hardness_class TEXT,
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
  accuracy_class TEXT,
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


CREATE TABLE IF NOT EXISTS custom_entity_ext_numeric (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  attr_code TEXT NOT NULL,
  numeric_value REAL NOT NULL,
  unit_code TEXT,
  PRIMARY KEY (entity_type, entity_id, attr_code)
);


CREATE TABLE IF NOT EXISTS custom_entity_ext_text (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  attr_code TEXT NOT NULL,
  text_value TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id, attr_code)
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

COMMIT;
```

---

## 6. 推荐初始化字典

```sql
INSERT OR IGNORE INTO standard_system (system_code, system_name, issuer_name) VALUES
  ('GB', '国家标准', '国家标准化管理委员会'),
  ('GB/T', '推荐性国家标准', '国家标准化管理委员会'),
  ('ISO', 'International Standard', 'ISO'),
  ('ASME', 'ASME Standard', 'ASME'),
  ('SAE', 'SAE Standard', 'SAE International'),
  ('DIN', 'DIN Standard', 'DIN'),
  ('JIS', 'Japanese Industrial Standard', 'JISC'),
  ('AGMA', 'American Gear Manufacturers Association', 'AGMA'),
  ('ABMA', 'American Bearing Manufacturers Association', 'ABMA');

INSERT OR IGNORE INTO source_provider (
  source_id, source_name, source_type, homepage_url, trust_level, license_note
) VALUES
  ('samr_openstd', '国家标准全文公开系统', 'public_open', 'https://openstd.samr.gov.cn/bzgk/std/index', 5, '适合导入公开可获取的 GB/GB/T 数据'),
  ('sae_mobilus', 'SAE Mobilus', 'purchased_standard', 'https://saemobilus.sae.org/', 5, '适合 AS568F 等正式标准'),
  ('asme_standards', 'ASME Standards', 'purchased_standard', 'https://www.asme.org/', 5, '适合 B18 系列'),
  ('agma', 'AGMA Standards', 'purchased_standard', 'https://www.agma.org/standards-technology/', 5, '适合齿轮标准'),
  ('abma', 'ABMA Standards', 'purchased_standard', 'https://americanbearings.org/industry-standards/', 5, '适合轴承标准'),
  ('parker_oring', 'Parker O-Ring Handbook', 'vendor_catalog', 'https://discover.parker.com/Parker-ORing-Handbook-ORD-5700', 4, '适合密封规则与经验参数'),
  ('nsk_catalog', 'NSK Catalogs and CAD', 'vendor_catalog', 'https://www.nsk.com/catalogs-and-cad/', 4, '适合轴承商品目录'),
  ('bossard_resources', 'Bossard Technical Resources', 'vendor_catalog', 'https://www.bossard.com/us-en/assembly-technology-expert/technical-information-and-tools/technical-resources/', 4, '适合紧固件工程参考'),
  ('misumi_tech', 'MISUMI Technical Information', 'vendor_catalog', 'https://uk.misumi-ec.com/en/techblog/general-info/screws-overview-standard/', 3, '适合标准件系列参考'),
  ('khk_gear_world', 'KHK Gear World', 'vendor_catalog', 'https://khkgears.us/gear-world/', 4, '适合齿轮商品系列'),
  ('matweb', 'MatWeb', 'reference_db', 'https://www.matweb.com/', 3, '适合材料检索'),
  ('total_materia', 'Total Materia', 'reference_db', 'https://docs.totalmateria.com/', 4, '适合材料代换与映射');
```

---

## 7. 各品类入库策略

### 7.1 O 型圈

尺寸主表：

- `seal_oring_size`

材质主表：

- `seal_oring_material`

沟槽推荐：

- `rule_table + rule_row + rule_value_*`

这样尺寸、材质、沟槽三类数据不会缠在一起。

### 7.2 螺纹

螺纹应单独建为基础对象：

- `thread_metric`

因为螺栓、螺母、丝锥底孔、应力面积、配合计算都会依赖它。

### 7.3 螺栓/螺母/垫圈

分表：

- `fastener_hex_bolt`
- `fastener_hex_nut`
- `fastener_plain_washer`

原因：

- 字段集合不同
- 查询条件不同
- 索引不同
- 导入源不同

### 7.4 材料

材料必须拆成四块：

- `material_grade`
- `material_composition`
- `material_property_set`
- `material_property`

如果把材料所有信息塞一行，后面热处理状态和试验温度一来就废了。

### 7.5 轴承

标准基础数据：

- `bearing_basic`

品牌型号：

- `vendor_part`

原因：

- 标准型号和品牌商品不是一回事
- 同一标准规格可以映射多个品牌型号

### 7.6 齿轮

标准模数表：

- `gear_module_standard`

现货齿轮：

- `vendor_part`

齿轮规则别做成一个万能大表，否则以后精度、齿形、系列、孔径、齿数都会混掉。

---

## 8. 查询示例

### 8.1 查某个 O 型圈

```sql
SELECT dash_code, inner_diameter, cross_section
FROM seal_oring_size
WHERE dash_code = 'AS568-010';
```

### 8.2 查 M10 六角螺母

```sql
SELECT designation, width_s, height_m, strength_class
FROM fastener_hex_nut
WHERE nominal_d = 10
ORDER BY pitch;
```

### 8.3 查 40Cr 的性能

```sql
SELECT mg.grade_code, mps.condition_label, mp.property_code, mp.numeric_value, mp.unit_code
FROM material_grade mg
JOIN material_property_set mps
  ON mps.material_id = mg.material_id
JOIN material_property mp
  ON mp.property_set_id = mps.property_set_id
WHERE mg.grade_code = '40Cr';
```

### 8.4 查 6205 轴承

```sql
SELECT designation, inner_diameter, outer_diameter, width,
       dynamic_load_rating, static_load_rating, grease_speed_limit
FROM bearing_basic
WHERE designation = '6205';
```

### 8.5 查 20 度标准直齿轮模数

```sql
SELECT module_value
FROM gear_module_standard
WHERE gear_type = 'spur'
  AND pressure_angle_deg = 20
ORDER BY module_value;
```

---

## 9. 这版的优缺点

### 优点

- 工程字段强类型
- 常用查询易写、易索引
- 导入标准表容易校验
- 计算模块接起来简单
- 标准数据、规则数据、厂家目录边界清楚
- 还能保留扩展能力

### 代价

- 表数量比纯 EAV 多
- 初期 DDL 设计成本更高
- 新品类需要认真建表，而不是偷懒塞属性表

这个代价我认为是值得的，因为你要的是“最好”，不是“最快搭起来”。

---

## 10. 实施顺序

最合理的落地顺序：

1. 先建治理层
   - `source_provider`
   - `standard_system`
   - `standard_document`
   - `standard_revision`
   - `dataset_release`
2. 再建高频业务表
   - `thread_metric`
   - `seal_oring_size`
   - `fastener_hex_bolt`
   - `fastener_hex_nut`
   - `fastener_plain_washer`
   - `bearing_basic`
   - `gear_module_standard`
   - `material_grade`
   - `material_composition`
   - `material_property_set`
   - `material_property`
3. 再建规则层
   - `rule_table`
   - `rule_row`
   - `rule_value_numeric`
   - `rule_value_text`
4. 最后接厂商目录和搜索
   - `manufacturer`
   - `vendor_part`
   - `vendor_part_ext_*`
   - `search_document`
   - `search_fts`

---

## 11. 最终建议

如果你真要“最好”，我的判断是：

- 不要兼容旧库
- 不要纯 JSON
- 不要纯 EAV
- 不要厂商目录和标准数据混表
- 不要把规则表当零件表
- 不要把材料性能塞到材料主表一行里

最好的落地方案，就是这版“混合型强类型架构”。

如果你认可，我下一步不再只写文档，而是直接给你生成两份实际文件：

- `DOC/schema_v3.sql`
- `DOC/seed_sources_v3.sql`
