-- Seed data for V3 schema
-- Sources and standard systems

INSERT OR IGNORE INTO standard_system (system_code, system_name, issuer_name) VALUES
  ('GB', '国家标准', '国家标准化管理委员会'),
  ('GB/T', '推荐性国家标准', '国家标准化管理委员会'),
  ('ISO', 'International Standard', 'ISO'),
  ('ASME', 'ASME Standard', 'ASME'),
  ('SAE', 'SAE Standard', 'SAE International'),
  ('DIN', 'DIN Standard', 'DIN'),
  ('JIS', 'Japanese Industrial Standard', 'JISC'),
  ('AGMA', 'AGMA Standard', 'AGMA'),
  ('ABMA', 'ABMA Standard', 'ABMA');

INSERT OR IGNORE INTO source_provider (
  source_id, source_name, source_type, homepage_url, trust_level, license_note
) VALUES
  ('samr_openstd', '国家标准全文公开系统', 'public_open', 'https://openstd.samr.gov.cn/', 5, '公开可获取 GB/GB/T 数据'),
  ('iso', 'ISO Standards', 'purchased_standard', 'https://www.iso.org/', 5, '正式标准'),
  ('asme', 'ASME Standards', 'purchased_standard', 'https://www.asme.org/', 5, 'B18 系列标准'),
  ('nsk', 'NSK Catalog', 'vendor_catalog', 'https://www.nsk.com/', 4, '轴承商品目录'),
  ('matweb', 'MatWeb', 'reference_db', 'https://www.matweb.com/', 3, '材料性能参考');
