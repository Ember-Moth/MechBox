import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { initDatabase, getDatabase } from "./db/database";
import { parseExcel, generateTemplate } from "./services/excel-import";
import { startWebSocketServer, stopWebSocketServer } from "./services/websocket-server";

let db: any;

type OringRecommendationInput = {
  standard?: string;
  dashCode?: string;
  crossSection?: number;
  application?: "radial-outer" | "radial-inner" | "axial";
  isStatic?: boolean;
  medium?: string;
  temperatureC?: number;
  pressureMpa?: number;
  pressurePsi?: number;
  hardness?: number;
  clearanceMm?: number;
  glandDiameterMm?: number;
  grooveDepthMm?: number;
  grooveWidthMm?: number;
  candidateLimit?: number;
};

const MM_PER_INCH = 25.4;
const PSI_PER_MPA = 145.0377377;

const ORING_STANDARD_MAP: Record<string, string> = {
  AS568: "std_as568",
  SAE_AS568: "std_as568",
  STD_AS568: "std_as568",
  JIS_B_2401: "std_jis_b_2401",
  JISB2401: "std_jis_b_2401",
  STD_JIS_B_2401: "std_jis_b_2401",
};

const MATERIAL_RATING_SCORE: Record<string, number> = {
  good: 4,
  excellent: 4,
  fair: 3,
  questionable: 2,
  poor: 1,
  insufficient_data: 0,
  not_listed: 0,
};

function normalizeOringStandard(standard?: string): string | undefined {
  if (!standard) return undefined;
  const key = standard.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
  return ORING_STANDARD_MAP[key] ?? standard;
}

function toMm(valueInInch?: number | null): number | null {
  if (typeof valueInInch !== "number") return null;
  return valueInInch * MM_PER_INCH;
}

function getRuleTableByCode(ruleCode: string) {
  return getDatabase()
    .prepare("SELECT * FROM rule_table WHERE rule_code = ?")
    .get(ruleCode) as any;
}

function hydrateRuleRows(ruleTableId: string) {
  const rows = getDatabase()
    .prepare("SELECT * FROM rule_row WHERE rule_table_id = ? ORDER BY sort_order")
    .all(ruleTableId) as any[];

  const numericStmt = getDatabase().prepare(
    "SELECT column_code, numeric_value, unit_code FROM rule_value_numeric WHERE rule_row_id = ?",
  );
  const textStmt = getDatabase().prepare(
    "SELECT column_code, text_value FROM rule_value_text WHERE rule_row_id = ?",
  );

  return rows.map((row) => {
    const numericValues = Object.fromEntries(
      numericStmt.all(row.rule_row_id).map((value: any) => [
        value.column_code,
        { value: value.numeric_value, unit: value.unit_code },
      ]),
    );
    const textValues = Object.fromEntries(
      textStmt.all(row.rule_row_id).map((value: any) => [value.column_code, value.text_value]),
    );

    return {
      ...row,
      numericValues,
      textValues,
    };
  });
}

function getHydratedRuleTable(ruleCode: string) {
  const table = getRuleTableByCode(ruleCode);
  if (!table) return null;
  return {
    table,
    rows: hydrateRuleRows(table.rule_table_id),
  };
}

function findCompatibleMediumRow(
  rows: any[],
  medium?: string,
): { row: any | null; matchedKey: string | null } {
  if (!medium) return { row: null, matchedKey: null };

  const normalized = medium.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
  const aliases: Record<string, string[]> = {
    mineral_oil: ["white_oil", "diesel_oil"],
    fuel: ["diesel_oil"],
    water: ["water", "salt_water"],
    steam: ["steam_under_300f", "steam_over_300f"],
    air: [],
  };
  const candidates = [normalized, ...(aliases[normalized] ?? [])];
  for (const candidate of candidates) {
    const row = rows.find((item) => item.row_key === candidate);
    if (row) return { row, matchedKey: candidate };
  }
  return { row: null, matchedKey: null };
}

function pickNearestHardness(input?: number): number {
  if (typeof input !== "number") return 70;
  return Math.abs(input - 90) < Math.abs(input - 70) ? 90 : 70;
}

function getNumericWindow(
  ruleCode: string,
  rowKey: string,
  minColumn = "min_pct",
  maxColumn = "max_pct",
) {
  const hydrated = getHydratedRuleTable(ruleCode);
  const row = hydrated?.rows.find((item) => item.row_key === rowKey);
  if (!row) return null;
  return {
    min: row.numericValues[minColumn]?.value ?? null,
    max: row.numericValues[maxColumn]?.value ?? null,
  };
}

function buildOringRecommendation(input: OringRecommendationInput) {
  const standardId = normalizeOringStandard(input.standard) ?? "std_as568";
  const selectedSize = input.dashCode
    ? (getDatabase()
        .prepare(
          `
          SELECT *,
                 dash_code AS code,
                 inner_diameter AS id,
                 cross_section AS cs
          FROM seal_oring_size
          WHERE standard_id = ? AND dash_code = ?
          `,
        )
        .get(standardId, input.dashCode) as any)
    : null;

  const crossSectionMm =
    typeof input.crossSection === "number" ? input.crossSection : selectedSize?.cross_section ?? null;
  const temperatureC = typeof input.temperatureC === "number" ? input.temperatureC : null;
  const grooveDepthMm = typeof input.grooveDepthMm === "number" ? input.grooveDepthMm : null;
  const grooveWidthMm = typeof input.grooveWidthMm === "number" ? input.grooveWidthMm : null;
  const glandDiameterMm = typeof input.glandDiameterMm === "number" ? input.glandDiameterMm : null;
  const pressurePsi =
    typeof input.pressurePsi === "number"
      ? input.pressurePsi
      : typeof input.pressureMpa === "number"
        ? input.pressureMpa * PSI_PER_MPA
        : 0;
  const clearanceMm = typeof input.clearanceMm === "number" ? input.clearanceMm : null;
  const hardnessShoreA = pickNearestHardness(input.hardness);

  const materialRows = getDatabase()
    .prepare("SELECT * FROM seal_oring_material ORDER BY material_code")
    .all() as any[];

  const compatibilityTable = getHydratedRuleTable("oring_chemical_compatibility_basic");
  const compatibilityMatch = compatibilityTable
    ? findCompatibleMediumRow(compatibilityTable.rows, input.medium)
    : { row: null, matchedKey: null };
  const compatibilityRow = compatibilityMatch.row;

  const recommendedMaterials = materialRows
    .map((material) => {
      const rating = compatibilityRow?.textValues?.[material.material_code] ?? null;
      const ratingScore =
        rating && MATERIAL_RATING_SCORE[rating] !== undefined ? MATERIAL_RATING_SCORE[rating] : -1;
      const temperatureFit =
        temperatureC === null ||
        ((material.temperature_min_c === null || temperatureC >= material.temperature_min_c) &&
          (material.temperature_max_c === null || temperatureC <= material.temperature_max_c));
      return {
        materialCode: material.material_code,
        materialName: material.material_name,
        hardnessShoreA: material.hardness_shore_a,
        temperatureMinC: material.temperature_min_c,
        temperatureMaxC: material.temperature_max_c,
        rating,
        ratingScore,
        temperatureFit,
        notes: material.notes,
      };
    })
    .sort((left, right) => {
      if (Number(right.temperatureFit) !== Number(left.temperatureFit)) {
        return Number(right.temperatureFit) - Number(left.temperatureFit);
      }
      if (right.ratingScore !== left.ratingScore) return right.ratingScore - left.ratingScore;
      return left.materialCode.localeCompare(right.materialCode);
    });

  const topMaterial = recommendedMaterials[0] ?? null;
  const backupRuleTable = getHydratedRuleTable("oring_backup_ring_general");
  const backupRules = Object.fromEntries(
    (backupRuleTable?.rows ?? []).map((row) => [row.row_key, row]),
  ) as Record<string, any>;

  const extrusionTable = getHydratedRuleTable("oring_extrusion_limit");
  const extrusionRow =
    extrusionTable?.rows.find((row) => {
      const numeric = row.numericValues;
      return (
        numeric.hardness_shore_a?.value === hardnessShoreA &&
        pressurePsi >= numeric.pressure_min_psi?.value &&
        pressurePsi <= numeric.pressure_max_psi?.value
      );
    }) ?? null;

  const clearanceMultiplier =
    topMaterial && ["VMQ", "FVMQ"].includes(topMaterial.materialCode)
      ? backupRules.clearance_derate_silicone?.numericValues?.clearance_multiplier?.value ?? 1
      : 1;
  const baseClearanceLimitIn = extrusionRow?.numericValues?.max_diametral_clearance_in?.value ?? null;
  const effectiveClearanceLimitIn =
    typeof baseClearanceLimitIn === "number" ? baseClearanceLimitIn * clearanceMultiplier : null;
  const effectiveClearanceLimitMm = toMm(effectiveClearanceLimitIn);
  const needsBackupRing =
    clearanceMm !== null &&
    effectiveClearanceLimitMm !== null &&
    clearanceMm > effectiveClearanceLimitMm;

  const isFaceSeal = input.application === "axial";
  const glandTable = getHydratedRuleTable(
    isFaceSeal ? "oring_gland_face_as568" : "oring_gland_static_radial_as568",
  );
  const nominalCrossSectionIn =
    typeof crossSectionMm === "number" ? crossSectionMm / MM_PER_INCH : null;
  const glandRow =
    glandTable && nominalCrossSectionIn !== null
      ? [...glandTable.rows].sort((left, right) => {
          const deltaLeft = Math.abs((left.numericValues.nominal_cs_in?.value ?? 0) - nominalCrossSectionIn);
          const deltaRight = Math.abs((right.numericValues.nominal_cs_in?.value ?? 0) - nominalCrossSectionIn);
          return deltaLeft - deltaRight;
        })[0]
      : null;

  const glandNumericValues = glandRow?.numericValues ?? {};
  const glandMmValues = Object.fromEntries(
    Object.entries(glandNumericValues)
      .filter(([columnCode, value]) => columnCode.endsWith("_in") && typeof (value as any).value === "number")
      .map(([columnCode, value]) => [columnCode.replace(/_in$/, "_mm"), (value as any).value * MM_PER_INCH]),
  );

  const squeezeWindow = input.isStatic === false
    ? getNumericWindow("oring_squeeze_pct", "reciprocating")
    : input.application === "axial"
      ? getNumericWindow("oring_squeeze_pct", "face")
      : getNumericWindow("oring_squeeze_pct", "static_male_female");
  const stretchWindow = getNumericWindow("oring_stretch_pct", "general");
  const fillWindow = { max: 85 };
  const squeezeMin = squeezeWindow?.min ?? null;
  const squeezeMax = squeezeWindow?.max ?? null;
  const stretchMin = stretchWindow?.min ?? null;
  const stretchMax = stretchWindow?.max ?? null;
  const candidateLimit =
    typeof input.candidateLimit === "number" && input.candidateLimit > 0 ? input.candidateLimit : 8;

  const sizeCandidates =
    grooveDepthMm !== null && grooveWidthMm !== null && glandDiameterMm !== null
      ? (getDatabase()
          .prepare(
            `
            SELECT dash_code AS code, inner_diameter AS id, cross_section AS cs, series_code
            FROM seal_oring_size
            WHERE standard_id = ?
            ORDER BY cross_section, inner_diameter
            `,
          )
          .all(standardId) as any[])
          .map((size) => {
            const compressionPct = ((size.cs - grooveDepthMm) / size.cs) * 100;
            const stretchPct = ((glandDiameterMm - size.id) / size.id) * 100;
            const fillPct =
              (Math.PI * Math.pow(size.cs / 2, 2)) / (grooveDepthMm * grooveWidthMm) * 100;
            const compressionPenalty =
              squeezeMin !== null && squeezeMax !== null
                ? compressionPct < squeezeMin
                  ? squeezeMin - compressionPct
                  : compressionPct > squeezeMax
                    ? compressionPct - squeezeMax
                    : 0
                : 0;
            const stretchPenalty =
              stretchMin !== null && stretchMax !== null
                ? stretchPct < stretchMin
                  ? stretchMin - stretchPct
                  : stretchPct > stretchMax
                    ? stretchPct - stretchMax
                    : 0
                : 0;
            const fillPenalty = fillPct > fillWindow.max ? fillPct - fillWindow.max : 0;
            const crossSectionDelta = crossSectionMm !== null ? Math.abs(size.cs - crossSectionMm) : 0;
            const selectedBonus = selectedSize?.dash_code === size.code ? -3 : 0;
            const score =
              compressionPenalty * 4 +
              Math.abs(stretchPenalty) * 3 +
              fillPenalty * 2 +
              crossSectionDelta * 8 +
              selectedBonus;
            const reasons: string[] = [];

            if (squeezeMin !== null && squeezeMax !== null) {
              if (compressionPct < squeezeMin) {
                reasons.push(`压缩率偏低 ${compressionPct.toFixed(1)}%`);
              } else if (compressionPct > squeezeMax) {
                reasons.push(`压缩率偏高 ${compressionPct.toFixed(1)}%`);
              } else {
                reasons.push(`压缩率命中 ${compressionPct.toFixed(1)}%`);
              }
            }

            if (stretchMin !== null && stretchMax !== null) {
              if (stretchPct < stretchMin) {
                reasons.push(`拉伸率偏低 ${stretchPct.toFixed(1)}%`);
              } else if (stretchPct > stretchMax) {
                reasons.push(`拉伸率偏高 ${stretchPct.toFixed(1)}%`);
              } else {
                reasons.push(`拉伸率命中 ${stretchPct.toFixed(1)}%`);
              }
            }

            if (fillPct > fillWindow.max) {
              reasons.push(`槽满率偏高 ${fillPct.toFixed(1)}%`);
            } else {
              reasons.push(`槽满率安全 ${fillPct.toFixed(1)}%`);
            }

            if (crossSectionMm !== null && crossSectionDelta <= 0.02) {
              reasons.push("线径与当前规格接近");
            }

            return {
              dashCode: size.code,
              innerDiameterMm: size.id,
              crossSectionMm: size.cs,
              seriesCode: size.series_code,
              compressionPct,
              stretchPct,
              fillPct,
              score,
              withinCompression:
                squeezeMin !== null &&
                squeezeMax !== null &&
                compressionPct >= squeezeMin &&
                compressionPct <= squeezeMax,
              withinStretch:
                stretchMin !== null &&
                stretchMax !== null &&
                stretchPct >= stretchMin &&
                stretchPct <= stretchMax,
              withinFill: fillPct <= fillWindow.max,
              reasons,
            };
          })
          .sort((left, right) => left.score - right.score)
          .slice(0, candidateLimit)
      : [];

  return {
    selectedSize,
    mediumKey: compatibilityMatch.matchedKey,
    mediumLabel: compatibilityRow?.row_label ?? input.medium ?? null,
    compatibilityRow: compatibilityRow
      ? {
          rowKey: compatibilityRow.row_key,
          rowLabel: compatibilityRow.row_label,
          ratings: compatibilityRow.textValues,
        }
      : null,
    recommendedMaterials,
    recommendedMaterial: topMaterial,
    sizingCriteria: {
      squeezeWindowPct: squeezeWindow,
      stretchWindowPct: stretchWindow,
      maxFillPct: fillWindow.max,
      grooveDepthMm,
      grooveWidthMm,
      glandDiameterMm,
    },
    sizeCandidates,
    extrusion: extrusionRow
      ? {
          rowKey: extrusionRow.row_key,
          rowLabel: extrusionRow.row_label,
          pressurePsi,
          pressureMpa: pressurePsi / PSI_PER_MPA,
          hardnessShoreA,
          inputClearanceMm: clearanceMm,
          maxDiametralClearanceMm: effectiveClearanceLimitMm,
          maxDiametralClearanceIn: effectiveClearanceLimitIn,
          baseMaxDiametralClearanceIn: baseClearanceLimitIn,
          needsBackupRing,
          materialDeratingApplied: clearanceMultiplier !== 1,
        }
      : null,
    backupRing: {
      needed: needsBackupRing,
      count: needsBackupRing ? 1 : 0,
      maxDepthIncreasePct:
        backupRules.gland_depth_increase_with_backup?.numericValues?.max_depth_increase_pct?.value ?? null,
      clearanceMultiplier,
      reasons: needsBackupRing
        ? [
            effectiveClearanceLimitMm !== null && clearanceMm !== null
              ? `当前最大间隙 ${clearanceMm.toFixed(3)} mm 超过允许值 ${effectiveClearanceLimitMm.toFixed(3)} mm`
              : "当前间隙超出防挤出建议值",
          ]
        : [],
    },
    gland: glandRow
      ? {
          mode: isFaceSeal ? "face" : "radial",
          rowKey: glandRow.row_key,
          rowLabel: glandRow.row_label,
          backupRingCount: needsBackupRing ? 1 : 0,
          valuesIn: Object.fromEntries(
            Object.entries(glandNumericValues).map(([columnCode, value]) => [
              columnCode,
              (value as any).value,
            ]),
          ),
          valuesMm: glandMmValues,
        }
      : null,
  };
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// 注册数据库相关的 IPC 处理器
function registerIpcHandlers() {
  ipcMain.handle("db-query-bearings", (_) => {
    return getDatabase().prepare("SELECT * FROM bearing_basic").all();
  });

  ipcMain.handle("db-query-threads", (_) => {
    return getDatabase().prepare("SELECT * FROM thread_metric").all();
  });

  ipcMain.handle("db-query-bolts", (_) => {
    return getDatabase().prepare("SELECT * FROM fastener_hex_bolt").all();
  });

  // O-ring queries (V3)
  ipcMain.handle("db-query-oring-list", (_, standard?: string) => {
    const standardId = normalizeOringStandard(standard);
    if (standard) {
      return getDatabase()
        .prepare(
          `
          SELECT *,
                 dash_code AS code,
                 inner_diameter AS id,
                 cross_section AS cs
          FROM seal_oring_size
          WHERE standard_id = ?
          ORDER BY dash_code
          `,
        )
        .all(standardId ?? standard);
    }
    return getDatabase()
      .prepare(
        `
        SELECT *,
               dash_code AS code,
               inner_diameter AS id,
               cross_section AS cs
        FROM seal_oring_size
        ORDER BY standard_id, dash_code
        `,
      )
      .all();
  });

  ipcMain.handle("db-query-oring-spec", (_, standard, code) => {
    const standardId = normalizeOringStandard(standard) ?? standard;
    return getDatabase()
      .prepare(
        `
        SELECT *,
               dash_code AS code,
               inner_diameter AS id,
               cross_section AS cs
        FROM seal_oring_size
        WHERE standard_id = ? AND dash_code = ?
        `,
      )
      .get(standardId, code);
  });

  // 数据版本查询
  ipcMain.handle("db-query-data-version", (_) => {
    return getDatabase().prepare("SELECT * FROM data_version").all();
  });

  // 用户自定义标准 CRUD
  ipcMain.handle("db-user-standard-add", (_, id, category, data) => {
    const stmt = getDatabase().prepare(
      "INSERT OR REPLACE INTO user_standards (id, category, data) VALUES (?, ?, ?)",
    );
    return stmt.run(id, category, JSON.stringify(data));
  });

  ipcMain.handle("db-user-standard-query", (_, category) => {
    return getDatabase()
      .prepare("SELECT id, category, data, created_at, updated_at FROM user_standards WHERE category = ?")
      .all(category)
      .map((row: any) => ({ ...row, data: JSON.parse(row.data) }));
  });

  ipcMain.handle("db-user-standard-delete", (_, id) => {
    return getDatabase().prepare("DELETE FROM user_standards WHERE id = ?").run(id);
  });

  ipcMain.handle("db-user-standard-get", (_, id) => {
    const row = getDatabase().prepare("SELECT * FROM user_standards WHERE id = ?").get(id) as any;
    return row ? { ...row, data: JSON.parse(row.data) } : null;
  });

  // 螺栓查询
  ipcMain.handle("db-search", (_, query: string, limit: number = 20) => {
    try {
      return getDatabase().prepare(
        `SELECT sd.*, match_info FROM search_fts sf 
         JOIN search_document sd ON sf.doc_id = sd.doc_id 
         WHERE search_fts MATCH ? ORDER BY rank LIMIT ?`
      ).all(`${query}*`, limit);
    } catch {
      return [];
    }
  });

  // 材料查询
  ipcMain.handle("db-query-materials", (_) => {
    return getDatabase().prepare("SELECT * FROM material_grade").all();
  });

  // 逆向识别向导 - 通过测量值反推标准规格 (Section 5.6)
  ipcMain.handle("db-reverse-identify", (_, type: string, measurements: Record<string, number>) => {
    if (type === 'thread') {
      // 通过外径和螺距反推螺纹规格
      const { outerDiameter, pitch } = measurements;
      const results = getDatabase().prepare(
        `SELECT *, ABS(nominal_d - ?) + ABS(pitch - ?) as diff FROM thread_metric ORDER BY diff ASC LIMIT 5`
      ).all(outerDiameter, pitch);
      return results;
    } else if (type === 'bearing') {
      // 通过内径、外径、宽度反推轴承型号
      const { id, od, width } = measurements;
      const results = getDatabase().prepare(
        `SELECT *, ABS(inner_diameter - ?) + ABS(outer_diameter - ?) + ABS(width - ?) as diff FROM bearing_basic ORDER BY diff ASC LIMIT 5`
      ).all(id || 0, od || 0, width || 0);
      return results;
    } else if (type === 'bolt') {
      // 通过直径、头宽、头高反推螺栓规格
      const { d, headWidth, headHeight } = measurements;
      const results = getDatabase().prepare(
        `SELECT *, ABS(nominal_d - ?) + ABS(head_width_s - ?) + ABS(head_height_k - ?) as diff FROM fastener_hex_bolt ORDER BY diff ASC LIMIT 5`
      ).all(d || 0, headWidth || 0, headHeight || 0);
      return results;
    }
    return [];
  });

  // Excel 导入 - 主进程解析 + JSON Schema 校验 (Section 2.3.3)
  ipcMain.handle("excel-import", async (_, templateType: string) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls', 'csv'] }]
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, errors: ['未选择文件'] }
    }
    
    return parseExcel(result.filePaths[0], templateType as any)
  })

  // 下载导入模板
  ipcMain.handle("excel-download-template", async (_, templateType: string, savePath: string) => {
    return generateTemplate(templateType as any, savePath)
  })

  // ============================================================
  // SQL Schema V3 - 新增 IPC 处理器 (基于 schema_v3.sql)
  // ============================================================

  // 六角螺母
  ipcMain.handle("db-query-nuts", (_) => {
    return getDatabase().prepare("SELECT * FROM fastener_hex_nut").all();
  });

  // 平垫圈
  ipcMain.handle("db-query-washers", (_) => {
    return getDatabase().prepare("SELECT * FROM fastener_plain_washer").all();
  });

  // 齿轮模数标准
  ipcMain.handle("db-query-gear-modules", (_) => {
    return getDatabase().prepare("SELECT * FROM gear_module_standard").all();
  });

  // O型圈材料
  ipcMain.handle("db-query-oring-materials", (_) => {
    return getDatabase().prepare("SELECT * FROM seal_oring_material").all();
  });

  ipcMain.handle("db-query-oring-recommendation", (_, input: OringRecommendationInput) => {
    return buildOringRecommendation(input ?? {});
  });

  // 材料等效/代换
  ipcMain.handle("db-query-material-equivalents", (_, materialId?: string) => {
    if (materialId) {
      return getDatabase()
        .prepare("SELECT * FROM material_equivalent WHERE material_id = ?")
        .all(materialId);
    }
    return getDatabase().prepare("SELECT * FROM material_equivalent").all();
  });

  // 制造商
  ipcMain.handle("db-query-manufacturers", (_) => {
    return getDatabase().prepare("SELECT * FROM manufacturer").all();
  });

  // 厂商零件目录
  ipcMain.handle("db-query-vendor-parts", (_, domainCode?: string) => {
    if (domainCode) {
      return getDatabase()
        .prepare("SELECT * FROM vendor_part WHERE domain_code = ?")
        .all(domainCode);
    }
    return getDatabase().prepare("SELECT * FROM vendor_part").all();
  });

  // 全局搜索 (FTS5)
  ipcMain.handle("db-global-search", (_, query: string, limit: number = 20) => {
    try {
      return getDatabase()
        .prepare("SELECT doc_id, entity_type, entity_id, title, snippet(search_fts, '<b>', '</b>', '...', 30) as snippet FROM search_fts JOIN search_document ON search_fts.doc_id = search_document.doc_id WHERE search_fts MATCH ? ORDER BY rank LIMIT ?")
        .all(`${query}*`, limit);
    } catch {
      return [];
    }
  });

  // 数据源
  ipcMain.handle("db-query-sources", (_) => {
    return getDatabase().prepare("SELECT * FROM source_provider").all();
  });

  // 标准体系
  ipcMain.handle("db-query-standard-systems", (_) => {
    return getDatabase().prepare("SELECT * FROM standard_system").all();
  });

  // 数据集版本
  ipcMain.handle("db-query-datasets", (_) => {
    return getDatabase().prepare("SELECT * FROM dataset_release").all();
  });

  // 规则表
  ipcMain.handle("db-query-rules", (_, ruleCode?: string) => {
    if (ruleCode) {
      return getHydratedRuleTable(ruleCode);
    }
    return getDatabase().prepare("SELECT * FROM rule_table").all();
  });
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.mechbox.app");

  // 初始化数据库
  db = initDatabase();
  registerIpcHandlers();
  
  // Section 3: Start WebSocket server for CAD bidirectional sync
  try {
    startWebSocketServer();
  } catch (err: any) {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[WebSocket] Port 8321 in use, trying 8322...`);
      try {
        startWebSocketServer(8322);
      } catch { /* ignore secondary failure */ }
    }
  }

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
  if (db) db.close();
  stopWebSocketServer();
});
