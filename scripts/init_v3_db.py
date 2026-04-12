import json
import os
import re
import sqlite3
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "data"
DB_PATH = DATA_DIR / "mechbox.db"
SCHEMA_PATH = REPO_ROOT / "DOC" / "schema_v3.sql"
SEED_PATH = REPO_ROOT / "DOC" / "seed_sources_v3.sql"

KHK_URLS = [
    "https://www.khkgears.us/catalog/product/SSG1-20",
    "https://www.khkgears.us/catalog/product/SS2-30",
    "https://www.khkgears.us/catalog/product/SR1-500",
    "https://www.khkgears.us/catalog/product/MM2-30",
    "https://www.khkgears.us/catalog/product/SMSG1-25R",
]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def load_json(path: Path):
    return json.loads(read_text(path))


def strip_tags(value: str) -> str:
    value = re.sub(r"<script[\s\S]*?</script>", " ", value, flags=re.I)
    value = re.sub(r"<style[\s\S]*?</style>", " ", value, flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    value = value.replace("&nbsp;", " ").replace("&amp;", "&").replace("&deg;", "°")
    return re.sub(r"\s+", " ", value).strip()


def first_number(raw: str):
    match = re.search(r"-?\d+(?:\.\d+)?", raw)
    return float(match.group(0)) if match else None


def slugify(value: str) -> str:
    return re.sub(r"(^_+|_+$)", "", re.sub(r"[^a-z0-9]+", "_", value.lower()))


def fetch_text(url: str) -> str:
    result = subprocess.run(
        [
            "curl",
            "-L",
            "--silent",
            "--show-error",
            "--retry",
            "3",
            "--retry-all-errors",
            "--retry-delay",
            "2",
            "--max-time",
            "30",
            url,
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def parse_khk_page(html: str, url: str):
    title_match = re.search(r"<h1>\s*([^<]+?)\s*</h1>", html, re.I)
    sku_match = re.search(r'itemprop="sku">([^<]+)<', html, re.I)
    name_match = re.search(r'itemprop="name">([^<]+)<', html, re.I)

    row_regex = re.compile(
        r'<tr[^>]*itemprop="additionalProperty"[\s\S]*?'
        r'<td[^>]*itemprop="name"[^>]*>[\s\S]*?<strong>(.*?)</strong>[\s\S]*?'
        r'<td class="plp-table-value">[\s\S]*?'
        r"<span data-measure='general' itemprop=\"value\" >([\s\S]*?)</span>",
        re.I,
    )

    specs = {}
    for key, value in row_regex.findall(html):
        clean_key = strip_tags(key)
        clean_value = strip_tags(value)
        if clean_key and clean_value:
            specs[clean_key] = clean_value

    sku = strip_tags(sku_match.group(1) if sku_match else "")
    title = strip_tags((title_match or name_match).group(1) if (title_match or name_match) else sku)
    if not sku or not title:
        raise RuntimeError(f"failed to parse KHK page: {url}")

    return {
        "sku": sku,
        "title": title,
        "url": url,
        "specs": specs,
    }


def apply_schema(conn: sqlite3.Connection):
    conn.executescript(read_text(SCHEMA_PATH))
    conn.executescript(read_text(SEED_PATH))


def import_threads(conn: sqlite3.Connection):
    data = load_json(REPO_ROOT / "data" / "standards" / "threads" / "iso-metric.json")
    rows = []
    for t in data["threads"]:
        rows.append(
            (
                f"thread_{re.sub(r'[^a-zA-Z0-9]', '_', t['designation'])}",
                "std_iso_261",
                "rev_iso_261_default",
                t["designation"],
                t["d"],
                t["pitch"],
                t.get("d2"),
                t.get("d1"),
                t.get("stress_area"),
                "dataset_threads_iso_metric_json",
            )
        )
    conn.executemany(
        """
        INSERT OR IGNORE INTO thread_metric
        (thread_id, standard_id, revision_id, designation, nominal_d, pitch, pitch_diameter, minor_diameter, stress_area, dataset_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )


def import_bolts(conn: sqlite3.Connection):
    data = load_json(REPO_ROOT / "data" / "standards" / "bolts" / "hex-bolts.json")
    rows = []
    for b in data["bolts"]:
        is_gb = "GB/T 5782" in (b.get("standard") or "")
        rows.append(
            (
                f"bolt_{re.sub(r'[^a-zA-Z0-9]', '_', b['designation'])}",
                "std_gbt_5782" if is_gb else "std_iso_4014",
                "rev_gbt_5782_default" if is_gb else "rev_iso_4014_default",
                b["designation"],
                b["d"],
                None,
                b["head_width_s"],
                b["head_height_k"],
                "dataset_bolts_hex_json",
            )
        )
    conn.executemany(
        """
        INSERT OR IGNORE INTO fastener_hex_bolt
        (bolt_id, standard_id, revision_id, designation, nominal_d, pitch, head_width_s, head_height_k, dataset_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )


def import_bearings(conn: sqlite3.Connection):
    data = load_json(REPO_ROOT / "data" / "standards" / "bearings" / "deep-groove.json")
    rows = []
    for b in data["bearings"]:
        rows.append(
            (
                f"bearing_{b['designation']}",
                "std_iso_281",
                "rev_iso_281_default",
                b["designation"],
                data.get("type", "deep_groove_ball"),
                b["d"],
                b["D"],
                b["B"],
                b.get("C_r"),
                b.get("C_0r"),
                b.get("speed_limit_grease"),
                b.get("speed_limit_oil"),
                b.get("mass"),
                "dataset_bearings_deep_groove_json",
            )
        )
    conn.executemany(
        """
        INSERT OR IGNORE INTO bearing_basic
        (bearing_id, standard_id, revision_id, designation, bearing_type, inner_diameter, outer_diameter, width,
         dynamic_load_rating, static_load_rating, grease_speed_limit, oil_speed_limit, mass, dataset_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )


def import_orings(conn: sqlite3.Connection):
    data = load_json(REPO_ROOT / "data" / "standards" / "o-ring" / "as568.json")
    rows = []
    for s in data["sizes"]:
        rows.append(
            (
                f"oring_{data['standard']}_{s['code']}",
                "std_as568",
                "rev_as568f",
                s["code"],
                s["id"],
                s["cs"],
                "dataset_oring_as568_json",
            )
        )
    conn.executemany(
        """
        INSERT OR IGNORE INTO seal_oring_size
        (oring_id, standard_id, revision_id, dash_code, inner_diameter, cross_section, dataset_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )


def import_materials(conn: sqlite3.Connection):
    data = load_json(REPO_ROOT / "data" / "materials-extended.json")
    for family, materials in data.items():
        if not isinstance(materials, list):
            continue
        for m in materials:
            material_id = f"material_{re.sub(r'[^a-zA-Z0-9]', '_', m['designation'])}"
            if "GB/T 3077" in (m.get("standards") or []):
                standard_id, revision_id = "std_gbt_3077", "rev_gbt_3077_default"
            else:
                standard_id, revision_id = "std_gbt_700", "rev_gbt_700_default"

            conn.execute(
                """
                INSERT OR IGNORE INTO material_grade
                (material_id, standard_id, revision_id, grade_code, grade_name, material_family, heat_treatment_state,
                 density, elastic_modulus, shear_modulus, yield_strength, tensile_strength, elongation,
                 temp_min, temp_max, dataset_id, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    material_id,
                    standard_id,
                    revision_id,
                    m["designation"],
                    m["name_zh"],
                    family,
                    m.get("condition"),
                    m.get("density"),
                    m.get("E"),
                    m.get("G"),
                    m.get("yield_strength"),
                    m.get("tensile_strength"),
                    m.get("elongation"),
                    m.get("temp_min"),
                    m.get("temp_max"),
                    "dataset_materials_extended_json",
                    m.get("notes"),
                ),
            )

            property_set_id = f"{material_id}_default_props"
            conn.execute(
                """
                INSERT OR IGNORE INTO material_property_set
                (property_set_id, material_id, condition_label, test_temperature_c, source_id, note)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    property_set_id,
                    material_id,
                    m.get("condition", "default"),
                    20,
                    "samr_openstd",
                    "Generated from materials-extended.json",
                ),
            )

            numeric_props = [
                ("density", m.get("density"), "g/cm3"),
                ("elastic_modulus", m.get("E"), "MPa"),
                ("shear_modulus", m.get("G"), "MPa"),
                ("yield_strength", m.get("yield_strength"), "MPa"),
                ("tensile_strength", m.get("tensile_strength"), "MPa"),
                ("elongation", m.get("elongation"), "pct"),
                ("temp_min", m.get("temp_min"), "degC"),
                ("temp_max", m.get("temp_max"), "degC"),
                ("hardness_brinell", m.get("hardness_brinell"), "HB"),
            ]
            for code, value, unit in numeric_props:
                if value is not None:
                    conn.execute(
                        """
                        INSERT OR IGNORE INTO material_property
                        (property_set_id, property_code, numeric_value, text_value, unit_code)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (property_set_id, code, value, None, unit),
                    )

            for system, grade in (m.get("equivalents") or {}).items():
                conn.execute(
                    """
                    INSERT OR IGNORE INTO material_equivalent
                    (material_id, external_system_code, external_grade_code, equivalence_level, note)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        material_id,
                        system,
                        str(grade),
                        "reference",
                        "Imported from materials-extended.json",
                    ),
                )


def import_seed_gear_modules(conn: sqlite3.Connection):
    for module_value in [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]:
        conn.execute(
            """
            INSERT OR IGNORE INTO gear_module_standard
            (gear_module_id, standard_id, revision_id, gear_type, pressure_angle_deg, helix_angle_deg,
             module_value, module_system, dataset_id, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                f"gear_module_spur_{str(module_value).replace('.', '_')}",
                "std_jis_b_1704",
                "rev_jis_b_1704_default",
                "spur",
                20,
                0,
                module_value,
                "metric",
                "dataset_khk_vendor_seed",
                "Seeded common metric modules",
            ),
        )


def import_khk_vendor_parts(conn: sqlite3.Connection):
    unit_hints = {
        "Module": "module",
        "No. of teeth": "count",
        "Pressure Angle": "deg",
        "Helix Angle": "deg",
        "Weight": "kg",
        "Bore (A)": "mm",
        "Pitch Diameter (C)": "mm",
        "Outer Diameter (D)": "mm",
        "Face Width (E)": "mm",
        "Face Width (J)": "mm",
        "Hub Diameter (B)": "mm",
        "Hub Width (F)": "mm",
        "Hub Width (H)": "mm",
        "Mounting Distance (E)": "mm",
        "Length Of Bore (I)": "mm",
        "Bending Strength (N-m)": "N·m",
        "Surface Durability (N-m)": "N·m",
    }

    count = 0
    for url in KHK_URLS:
        try:
            html = fetch_text(url)
            product = parse_khk_page(html, url)
        except Exception as exc:
            print(f"skip KHK url {url}: {exc}", file=sys.stderr)
            continue
        vendor_part_id = f"vendor_khk_{slugify(product['sku'])}"
        module_value = first_number(product["specs"].get("Module", ""))
        linked_entity_id = (
            f"gear_module_spur_{str(module_value).replace('.', '_')}" if module_value is not None else None
        )
        conn.execute(
            """
            INSERT OR REPLACE INTO vendor_part
            (vendor_part_id, manufacturer_id, domain_code, vendor_part_number, linked_entity_type, linked_entity_id,
             product_url, status, description, dataset_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                vendor_part_id,
                "mfr_khk",
                "gear",
                product["sku"],
                "gear_module_standard" if linked_entity_id else None,
                linked_entity_id,
                product["url"],
                "active",
                product["title"],
                "dataset_khk_vendor_seed",
            ),
        )
        conn.execute(
            """
            INSERT OR REPLACE INTO vendor_part_ext_text
            (vendor_part_id, attr_code, text_value)
            VALUES (?, ?, ?)
            """,
            (vendor_part_id, "title", product["title"]),
        )
        for key, value in product["specs"].items():
            attr_code = slugify(key)
            conn.execute(
                """
                INSERT OR REPLACE INTO vendor_part_ext_text
                (vendor_part_id, attr_code, text_value)
                VALUES (?, ?, ?)
                """,
                (vendor_part_id, attr_code, value),
            )
            numeric_value = first_number(value)
            if numeric_value is not None:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO vendor_part_ext_numeric
                    (vendor_part_id, attr_code, numeric_value, unit_code)
                    VALUES (?, ?, ?, ?)
                    """,
                    (vendor_part_id, attr_code, numeric_value, unit_hints.get(key)),
                )
        count += 1

    if count == 0:
        raise RuntimeError("no KHK vendor parts imported")

    conn.execute(
        """
        UPDATE dataset_release
        SET row_count = ?
        WHERE dataset_id = 'dataset_khk_vendor_seed'
        """,
        (count,),
    )


def rebuild_search(conn: sqlite3.Connection):
    conn.execute("DELETE FROM search_document")
    conn.execute("DELETE FROM search_fts")

    rows = conn.execute(
        """
        SELECT 'thread_metric' AS entity_type, thread_id AS entity_id, designation AS title,
               printf('Thread %s nominal %.3f pitch %.3f', designation, nominal_d, pitch) AS body,
               'thread metric' AS tags
        FROM thread_metric
        UNION ALL
        SELECT 'seal_oring_size', oring_id, dash_code,
               printf('O-ring %s ID %.3f CS %.3f', dash_code, inner_diameter, cross_section),
               'oring seal'
        FROM seal_oring_size
        UNION ALL
        SELECT 'bearing_basic', bearing_id, designation,
               printf('Bearing %s %.3fx%.3fx%.3f', designation, inner_diameter, outer_diameter, width),
               'bearing'
        FROM bearing_basic
        UNION ALL
        SELECT 'material_grade', material_id, grade_code,
               printf('Material %s %s', grade_code, grade_name),
               material_family
        FROM material_grade
        UNION ALL
        SELECT 'vendor_part', vendor_part_id, vendor_part_number,
               COALESCE(description, vendor_part_number),
               domain_code
        FROM vendor_part
        """
    ).fetchall()

    for entity_type, entity_id, title, body, tags in rows:
        doc_id = f"{entity_type}:{entity_id}"
        conn.execute(
            """
            INSERT INTO search_document (doc_id, entity_type, entity_id, title, body, tags)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (doc_id, entity_type, entity_id, title, body, tags),
        )
        conn.execute(
            """
            INSERT INTO search_fts (doc_id, title, body, tags)
            VALUES (?, ?, ?, ?)
            """,
            (doc_id, title, body, tags),
        )


def seed_data_version(conn: sqlite3.Connection):
    rows = [
        ("V3_SCHEMA", "3.0.0", "system", "schema_v3"),
        ("KHK_VENDOR", "2026-04-12", "khk_gear_world", f"urls:{len(KHK_URLS)}"),
    ]
    conn.executemany(
        """
        INSERT OR REPLACE INTO data_version (standard_code, version, source, checksum)
        VALUES (?, ?, ?, ?)
        """,
        rows,
    )


def print_counts(conn: sqlite3.Connection):
    rows = conn.execute(
        """
        SELECT 'thread_metric' AS table_name, COUNT(*) AS count FROM thread_metric
        UNION ALL SELECT 'fastener_hex_bolt', COUNT(*) FROM fastener_hex_bolt
        UNION ALL SELECT 'bearing_basic', COUNT(*) FROM bearing_basic
        UNION ALL SELECT 'seal_oring_size', COUNT(*) FROM seal_oring_size
        UNION ALL SELECT 'material_grade', COUNT(*) FROM material_grade
        UNION ALL SELECT 'gear_module_standard', COUNT(*) FROM gear_module_standard
        UNION ALL SELECT 'vendor_part', COUNT(*) FROM vendor_part
        UNION ALL SELECT 'search_document', COUNT(*) FROM search_document
        """
    ).fetchall()
    for table_name, count in rows:
        print(f"{table_name}: {count}")


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")

    apply_schema(conn)
    import_threads(conn)
    import_bolts(conn)
    import_bearings(conn)
    import_orings(conn)
    import_materials(conn)
    import_seed_gear_modules(conn)
    import_khk_vendor_parts(conn)
    rebuild_search(conn)
    seed_data_version(conn)
    conn.commit()

    print(f"Initialized DB at {DB_PATH}")
    print_counts(conn)
    conn.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(exc, file=sys.stderr)
        sys.exit(1)
