<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useStandardStore } from "../../store/useStandardStore";
import { calcCompression, calcStretch } from "../../engine/seals/oring";
import { calcSealMultiPhysics } from "../../engine/seals/multi-physics";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
    InfoCircleOutlined,
    FilePdfOutlined,
    PrinterOutlined,
    SearchOutlined,
} from "@ant-design/icons-vue";

const store = useStandardStore();
const MM_PER_INCH = 25.4;

const standardOptions = [
    { label: "AS568", value: "std_as568" },
    { label: "JIS B 2401", value: "std_jis_b_2401" },
];

const mediumOptions = [
    { label: "Water", value: "water" },
    { label: "Salt Water", value: "salt_water" },
    { label: "Steam < 300 F", value: "steam_under_300f" },
    { label: "Steam > 300 F", value: "steam_over_300f" },
    { label: "Diesel Oil", value: "diesel_oil" },
    { label: "White Oil", value: "white_oil" },
    { label: "Ethylene Glycol", value: "ethylene_glycol" },
    { label: "Brake Fluid", value: "brake_fluid_wagner_21b" },
    { label: "Skydrol 500", value: "skydrol_500" },
    { label: "Skydrol 7000", value: "skydrol_7000" },
    { label: "Acetone", value: "acetone" },
    { label: "Denatured Alcohol", value: "denatured_alcohol" },
    { label: "Ammonia", value: "ammonia_anhydrous" },
];

// 密封类型与状态
const sealType = ref("radial-outer");
const isStatic = ref(true);
const unit = ref("mm");

// 输入参数表单
const form = ref({
    selectedStandard: "std_as568",
    selectedDashCode: "214",
    d4: 25.0, // 缸孔直径
    d9: 24.5, // 活塞直径
    d3: 20.0, // 沟槽底径
    b1: 3.6, // 沟槽宽度
    r: 0.2, // 沟槽圆角
    d1: 18.64, // O形圈内径
    d2: 3.53, // O形圈线径
    temperature: 23,
    pressure: 0,
    medium: "water",
    expansion: 0,
    hardness: 70,
});

const oringRecommendation = ref<any | null>(null);
const recommendationLoading = ref(false);
let recommendationRequestId = 0;

// 公差代号选择
const tolCodes = ref({
    d4: { pos: "H", grade: "IT8" },
    d9: { pos: "f", grade: "IT7" },
    d3: { pos: "h", grade: "IT9" },
});

// 实时公差偏差值 (从 DB 获取)
const deviations = ref({
    d4: { es: 0.033, ei: 0 },
    d9: { es: -0.02, ei: -0.041 },
    d3: { es: 0, ei: -0.052 },
});

// 下拉列表选项
const holePositions = ["H"];
const shaftPositions = ["h", "g", "f"];
const itGrades = ["IT5", "IT6", "IT7", "IT8", "IT9"];

// 导出 PDF 逻辑
const exportPDF = async () => {
    const element = document.querySelector(".tss-style-page") as HTMLElement;
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("MechBox-O-Ring-Report.pdf");
};

// 监听尺寸或公差代号变化，更新数据库偏差
const updateDeviations = async (key: "d4" | "d9" | "d3") => {
    const size = form.value[key];
    const { pos, grade } = tolCodes.value[key];
    const sizeIndex = store.getSizeRangeIndex(size);

    if (sizeIndex === -1) return;

    const type = key === "d4" ? "holes" : "shafts";
    const [it, dev] = await Promise.all([
        store.getITValue(grade, sizeIndex),
        store.getFundamentalDeviation(type, pos, sizeIndex),
    ]);

    if (it !== null && dev !== null) {
        if (type === "holes") {
            // 基准孔 H: EI=0, ES=IT
            deviations.value[key].ei = dev;
            deviations.value[key].es = dev + it;
        } else {
            // 轴: g, f 等偏差通常为 es
            deviations.value[key].es = dev;
            deviations.value[key].ei = dev - it;
        }
    }
};

watch(
    () => [form.value.d4, tolCodes.value.d4],
    () => updateDeviations("d4"),
    { deep: true },
);
watch(
    () => [form.value.d9, tolCodes.value.d9],
    () => updateDeviations("d9"),
    { deep: true },
);
watch(
    () => [form.value.d3, tolCodes.value.d3],
    () => updateDeviations("d3"),
    { deep: true },
);

// 规格自动填充
const onOringSelect = async (code: string) => {
    form.value.selectedDashCode = code;
    const spec = await window.electron.db.queryOringSpec(
        form.value.selectedStandard,
        code,
    );
    if (spec) {
        form.value.d1 = spec.id;
        form.value.d2 = spec.cs;
    }
};

const toMultiPhysicsMaterial = (
    materialCode?: string,
): "NBR" | "FKM" | "EPDM" | "VMQ" => {
    if (materialCode === "FKM") return "FKM";
    if (materialCode === "EPDM") return "EPDM";
    if (materialCode === "VMQ" || materialCode === "FVMQ") return "VMQ";
    return "NBR";
};

const toMultiPhysicsMedium = (
    medium: string,
): "mineral_oil" | "fuel" | "water" | "air" => {
    if (["diesel_oil", "red_oil_mil_h_5606"].includes(medium)) return "fuel";
    if (["white_oil", "stoddard_solvent"].includes(medium))
        return "mineral_oil";
    if (
        [
            "water",
            "salt_water",
            "steam_under_300f",
            "steam_over_300f",
            "ethylene_glycol",
            "brake_fluid_wagner_21b",
            "skydrol_500",
            "skydrol_7000",
        ].includes(medium)
    ) {
        return "water";
    }
    return "air";
};

const refreshOringRecommendation = async () => {
    const requestId = ++recommendationRequestId;
    recommendationLoading.value = true;
    try {
        const recommendation = await window.electron.db.queryOringRecommendation({
            standard: form.value.selectedStandard,
            dashCode: form.value.selectedDashCode || undefined,
            crossSection: form.value.d2,
            application: sealType.value as "radial-outer" | "radial-inner" | "axial",
            isStatic: isStatic.value,
            medium: form.value.medium,
            temperatureC: form.value.temperature,
            pressureMpa: form.value.pressure,
            hardness: form.value.hardness,
            clearanceMm: limits.value.maxClearance,
            glandDiameterMm: form.value.d3,
            grooveDepthMm: (form.value.d4 - form.value.d3) / 2,
            grooveWidthMm: form.value.b1,
            candidateLimit: 6,
        });
        if (requestId === recommendationRequestId) {
            oringRecommendation.value = recommendation;
        }
    } finally {
        if (requestId === recommendationRequestId) {
            recommendationLoading.value = false;
        }
    }
};

// 计算结果
const results = computed(() => {
    const cs = form.value.d2;
    const depth = (form.value.d4 - form.value.d3) / 2;
    const comp = calcCompression(cs, depth);
    const str = calcStretch(form.value.d1, form.value.d3);
    const clearance = (form.value.d4 - form.value.d9) / 2;
    const fillRate =
        ((Math.PI * Math.pow(cs / 2, 2)) / (depth * form.value.b1)) * 100;
    const recommendedMaterial = toMultiPhysicsMaterial(
        oringRecommendation.value?.recommendedMaterial?.materialCode,
    );
    const simplifiedMedium = toMultiPhysicsMedium(form.value.medium);

    // 多场耦合计算 (Section 10.1)
    const multiPhysics = calcSealMultiPhysics({
        cs,
        id: form.value.d1,
        grooveDepth: depth,
        grooveWidth: form.value.b1,
        clearance,
        temperature: form.value.temperature || 20,
        pressure: form.value.pressure || 0,
        material: recommendedMaterial,
        medium: simplifiedMedium,
        application: isStatic.value ? "static" : "reciprocating",
    });

    return { compression: comp, stretch: str, clearance, fillRate, multiPhysics };
});

// 偏心/极限工况计算
const limits = computed(() => {
    const cs = form.value.d2;
    const csTol = 0.08; // 简化的标准公差 +/- 0.08
    const minCS = cs - csTol;
    const maxCS = cs + csTol;

    const minD4 = form.value.d4 + deviations.value.d4.ei;
    const maxD4 = form.value.d4 + deviations.value.d4.es;

    const minD3 = form.value.d3 + deviations.value.d3.ei;
    const maxD3 = form.value.d3 + deviations.value.d3.es;

    const minD9 = form.value.d9 + deviations.value.d9.ei;
    const maxD9 = form.value.d9 + deviations.value.d9.es;

    const minDepth = (minD4 - maxD3) / 2;
    const maxDepth = (maxD4 - minD3) / 2;

    const minComp = calcCompression(minCS, maxDepth);
    const maxComp = calcCompression(maxCS, minDepth);
    const maxClearance = (maxD4 - minD9) / 2;

    return { minComp, maxComp, maxClearance };
});

// SVG 动态预览计算
const svgScale = computed(() => {
    const maxDim = Math.max(form.value.d4, 30);
    return 200 / maxDim;
});

const recommendedMaterialText = computed(() => {
    const recommendation = oringRecommendation.value?.recommendedMaterial;
    if (!recommendation) return "待查询";
    const rating = recommendation.rating
        ? ` / ${String(recommendation.rating).toUpperCase()}`
        : "";
    return `${recommendation.materialCode} ${recommendation.hardnessShoreA ?? ""}${rating}`.trim();
});

const backupRingText = computed(() => {
    const backup = oringRecommendation.value?.backupRing;
    if (!backup) return "待查询";
    if (!backup.needed) return "不需要";
    return `需要 ${backup.count} 道`;
});

const glandDepthText = computed(() => {
    const gland = oringRecommendation.value?.gland?.valuesMm;
    if (!gland?.gland_depth_min_mm || !gland?.gland_depth_max_mm) return "--";
    return `${gland.gland_depth_min_mm.toFixed(2)} ~ ${gland.gland_depth_max_mm.toFixed(2)} mm`;
});

const glandWidthText = computed(() => {
    const gland = oringRecommendation.value?.gland;
    if (!gland?.valuesMm) return "--";
    if (gland.mode === "face") {
        const min = gland.valuesMm.groove_width_liquid_min_mm;
        const max = gland.valuesMm.groove_width_liquid_max_mm;
        return min && max ? `${min.toFixed(2)} ~ ${max.toFixed(2)} mm` : "--";
    }

    const prefix = gland.backupRingCount >= 1 ? "groove_width_one_backup" : "groove_width_no_backup";
    const min = gland.valuesMm[`${prefix}_min_mm`];
    const max = gland.valuesMm[`${prefix}_max_mm`];
    return min && max ? `${min.toFixed(2)} ~ ${max.toFixed(2)} mm` : "--";
});

const recommendationNote = computed(() => {
    const recommendation = oringRecommendation.value;
    if (!recommendation) return "";
    if (recommendation.mediumKey && recommendation.mediumKey !== form.value.medium) {
        return `兼容性按 ${recommendation.mediumLabel} 近似匹配`;
    }
    return recommendation.extrusion?.materialDeratingApplied
        ? "硅胶/氟硅胶按 50% 间隙降额校核"
        : "";
});

const materialCandidates = computed(() =>
    (oringRecommendation.value?.recommendedMaterials ?? []).slice(0, 4),
);

const sizeCandidates = computed(() =>
    oringRecommendation.value?.sizeCandidates ?? [],
);

const applySizeCandidate = async (candidate: {
    dashCode: string;
    innerDiameterMm: number;
    crossSectionMm: number;
}) => {
    form.value.selectedDashCode = candidate.dashCode;
    form.value.d1 = candidate.innerDiameterMm;
    form.value.d2 = candidate.crossSectionMm;
    await onOringSelect(candidate.dashCode);
};

const squeezeCriteriaText = computed(() => {
    const criteria = oringRecommendation.value?.sizingCriteria?.squeezeWindowPct;
    if (!criteria?.min && criteria?.min !== 0) return "--";
    return `${criteria.min.toFixed(0)} ~ ${criteria.max.toFixed(0)} %`;
});

const stretchCriteriaText = computed(() => {
    const criteria = oringRecommendation.value?.sizingCriteria?.stretchWindowPct;
    if (!criteria?.min && criteria?.min !== 0) return "--";
    return `${criteria.min.toFixed(0)} ~ ${criteria.max.toFixed(0)} %`;
});

watch(
    () => form.value.selectedStandard,
    async (standard) => {
        await store.fetchOringList(standard);
        const exists = store.oringList.some(
            (item) => item.code === form.value.selectedDashCode,
        );
        if (!exists && store.oringList[0]) {
            form.value.selectedDashCode = store.oringList[0].code;
            form.value.d1 = store.oringList[0].id;
            form.value.d2 = store.oringList[0].cs;
        }
    },
    { immediate: true },
);

watch(
    () => [
        form.value.selectedStandard,
        form.value.selectedDashCode,
        form.value.d2,
        form.value.temperature,
        form.value.pressure,
        form.value.medium,
        form.value.hardness,
        sealType.value,
        limits.value.maxClearance,
    ],
    () => {
        void refreshOringRecommendation();
    },
    { deep: true },
);

onMounted(async () => {
    await onOringSelect(form.value.selectedDashCode);
    await Promise.all([
        updateDeviations("d4"),
        updateDeviations("d9"),
        updateDeviations("d3"),
    ]);
    await refreshOringRecommendation();
});
</script>

<template>
    <div class="tss-style-page">
        <!-- 顶部工具栏 -->
        <div class="toolbar">
            <div class="brand">MechBox <small>Powered by SQLite</small></div>
            <a-space>
                <a-button size="small" type="primary" @click="exportPDF"
                    ><template #icon><FilePdfOutlined /></template
                    >创建PDF</a-button
                >
                <a-button size="small"
                    ><template #icon><PrinterOutlined /></template
                    >打印报告</a-button
                >
                <a-radio-group
                    v-model:value="unit"
                    size="small"
                    button-style="solid"
                >
                    <a-radio-button value="mm">毫米 (mm)</a-radio-button>
                    <a-radio-button value="inch">英寸 (in)</a-radio-button>
                </a-radio-group>
            </a-space>
        </div>

        <a-tabs v-model:activeKey="sealType" class="type-tabs" centered>
            <a-tab-pane key="radial-outer" tab="径向外周密封" />
            <a-tab-pane key="radial-inner" tab="径向内周密封" />
            <a-tab-pane key="axial" tab="轴向密封" />
        </a-tabs>

        <div class="content-body">
            <a-row :gutter="16">
                <!-- 左侧：参数化 SVG 预览 -->
                <a-col :span="8">
                    <div class="schematic-container">
                        <div class="svg-preview">
                            <svg
                                width="100%"
                                height="300"
                                viewBox="0 0 250 300"
                            >
                                <!-- 缸体/座孔 (d4) -->
                                <rect
                                    x="25"
                                    y="50"
                                    width="200"
                                    height="20"
                                    fill="#ddd"
                                    stroke="#999"
                                />
                                <rect
                                    x="25"
                                    y="230"
                                    width="200"
                                    height="20"
                                    fill="#ddd"
                                    stroke="#999"
                                />

                                <!-- 轴/活塞 (d9 & d3) -->
                                <rect
                                    x="50"
                                    y="100"
                                    width="150"
                                    height="100"
                                    fill="#f0f0f0"
                                    stroke="#ccc"
                                />
                                <!-- 沟槽 (d3) -->
                                <rect
                                    x="50"
                                    y="120"
                                    width="40"
                                    height="60"
                                    fill="#fff"
                                    stroke="#999"
                                    stroke-dasharray="2"
                                />

                                <!-- O形圈 (d2 & d1) -->
                                <circle
                                    :cx="70"
                                    :cy="150"
                                    :r="form.d2 * 4"
                                    fill="rgba(0,130,148,0.6)"
                                    stroke="#008294"
                                />

                                <!-- 标注文本 -->
                                <text x="10" y="45" font-size="10">
                                    缸孔 d4: {{ form.d4 }}
                                </text>
                                <text x="10" y="115" font-size="10">
                                    活塞 d9: {{ form.d9 }}
                                </text>
                                <text x="10" y="215" font-size="10">
                                    沟槽 d3: {{ form.d3 }}
                                </text>
                            </svg>
                        </div>

                        <div class="search-box">
                            <div class="search-label">
                                O形圈规格快速选择
                            </div>
                            <a-select
                                v-model:value="form.selectedStandard"
                                :options="standardOptions"
                                style="width: 100%; margin-bottom: 8px"
                                size="small"
                            />
                            <a-select
                                show-search
                                placeholder="搜索规格代码 (如 010, 110...)"
                                style="width: 100%"
                                v-model:value="form.selectedDashCode"
                                @change="onOringSelect"
                            >
                                <a-select-option
                                    v-for="s in store.oringList"
                                    :key="s.code"
                                    :value="s.code"
                                >
                                    {{ s.code }} ({{ s.id }} x {{ s.cs }})
                                </a-select-option>
                            </a-select>
                        </div>
                    </div>
                </a-col>

                <!-- 右侧：数据表格 -->
                <a-col :span="16">
                    <div class="input-section">
                        <div class="section-header">
                            <a-space :size="20">
                                <span
                                    class="mode-tag"
                                    :class="{ active: isStatic }"
                                    >静密封</span
                                >
                                <a-switch
                                    v-model:checked="isStatic"
                                    size="small"
                                />
                                <span
                                    class="mode-tag"
                                    :class="{ active: !isStatic }"
                                    >动密封</span
                                >
                            </a-space>
                        </div>

                        <table class="input-table">
                            <thead>
                                <tr>
                                    <th width="120">输入项</th>
                                    <th width="40">代号</th>
                                    <th width="100">公称尺寸</th>
                                    <th width="120">配合/公差</th>
                                    <th width="60">下偏差</th>
                                    <th width="60">上偏差</th>
                                    <th width="80">最小尺寸</th>
                                    <th width="80">最大尺寸</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>缸孔直径-Ø</td>
                                    <td>d4</td>
                                    <td>
                                        <a-input-number
                                            v-model:value="form.d4"
                                            size="small"
                                            :step="0.1"
                                        />
                                    </td>
                                    <td class="cell-flex">
                                        <a-select
                                            v-model:value="tolCodes.d4.pos"
                                            size="small"
                                            :options="
                                                holePositions.map((v) => ({
                                                    value: v,
                                                }))
                                            "
                                            style="width: 50px"
                                        />
                                        <a-select
                                            v-model:value="tolCodes.d4.grade"
                                            size="small"
                                            :options="
                                                itGrades.map((v) => ({
                                                    value: v,
                                                }))
                                            "
                                            style="width: 60px"
                                        />
                                    </td>
                                    <td class="dim-val">
                                        {{
                                            (deviations.d4.ei * 1000).toFixed(0)
                                        }}
                                    </td>
                                    <td class="dim-val">
                                        +{{
                                            (deviations.d4.es * 1000).toFixed(0)
                                        }}
                                    </td>
                                    <td class="dim-res">
                                        {{
                                            (
                                                form.d4 + deviations.d4.ei
                                            ).toFixed(3)
                                        }}
                                    </td>
                                    <td class="dim-res">
                                        {{
                                            (
                                                form.d4 + deviations.d4.es
                                            ).toFixed(3)
                                        }}
                                    </td>
                                </tr>
                                <tr>
                                    <td>活塞直径-Ø</td>
                                    <td>d9</td>
                                    <td>
                                        <a-input-number
                                            v-model:value="form.d9"
                                            size="small"
                                            :step="0.1"
                                        />
                                    </td>
                                    <td class="cell-flex">
                                        <a-select
                                            v-model:value="tolCodes.d9.pos"
                                            size="small"
                                            :options="
                                                shaftPositions.map((v) => ({
                                                    value: v,
                                                }))
                                            "
                                            style="width: 50px"
                                        />
                                        <a-select
                                            v-model:value="tolCodes.d9.grade"
                                            size="small"
                                            :options="
                                                itGrades.map((v) => ({
                                                    value: v,
                                                }))
                                            "
                                            style="width: 60px"
                                        />
                                    </td>
                                    <td class="dim-val">
                                        {{
                                            (deviations.d9.ei * 1000).toFixed(0)
                                        }}
                                    </td>
                                    <td class="dim-val">
                                        {{
                                            (deviations.d9.es * 1000).toFixed(0)
                                        }}
                                    </td>
                                    <td class="dim-res">
                                        {{
                                            (
                                                form.d9 + deviations.d9.ei
                                            ).toFixed(3)
                                        }}
                                    </td>
                                    <td class="dim-res">
                                        {{
                                            (
                                                form.d9 + deviations.d9.es
                                            ).toFixed(3)
                                        }}
                                    </td>
                                </tr>
                                <tr>
                                    <td>沟槽底径-Ø</td>
                                    <td>d3</td>
                                    <td>
                                        <a-input-number
                                            v-model:value="form.d3"
                                            size="small"
                                            :step="0.1"
                                        />
                                    </td>
                                    <td class="cell-flex">
                                        <a-select
                                            v-model:value="tolCodes.d3.pos"
                                            size="small"
                                            :options="
                                                shaftPositions.map((v) => ({
                                                    value: v,
                                                }))
                                            "
                                            style="width: 50px"
                                        />
                                        <a-select
                                            v-model:value="tolCodes.d3.grade"
                                            size="small"
                                            :options="
                                                itGrades.map((v) => ({
                                                    value: v,
                                                }))
                                            "
                                            style="width: 60px"
                                        />
                                    </td>
                                    <td class="dim-val">
                                        {{
                                            (deviations.d3.ei * 1000).toFixed(0)
                                        }}
                                    </td>
                                    <td class="dim-val">
                                        {{
                                            (deviations.d3.es * 1000).toFixed(0)
                                        }}
                                    </td>
                                    <td class="dim-res">
                                        {{
                                            (
                                                form.d3 + deviations.d3.ei
                                            ).toFixed(3)
                                        }}
                                    </td>
                                    <td class="dim-res">
                                        {{
                                            (
                                                form.d3 + deviations.d3.es
                                            ).toFixed(3)
                                        }}
                                    </td>
                                </tr>
                                <tr>
                                    <td>沟槽宽度</td>
                                    <td>b1</td>
                                    <td>
                                        <a-input-number
                                            v-model:value="form.b1"
                                            size="small"
                                            :step="0.1"
                                        />
                                    </td>
                                    <td><a-tag>推荐: 4.8</a-tag></td>
                                    <td
                                        colspan="4"
                                        style="
                                            background: #f9f9f9;
                                            text-align: center;
                                            color: #aaa;
                                        "
                                    >
                                        -- 自由公差 --
                                    </td>
                                </tr>
                                <tr style="background: #e6f7ff">
                                    <td>O形圈内径-Ø</td>
                                    <td>d1</td>
                                    <td>
                                        <a-input-number
                                            v-model:value="form.d1"
                                            size="small"
                                            :step="0.01"
                                        />
                                    </td>
                                    <td>
                                        <a-tag color="blue">ISO 3601</a-tag>
                                    </td>
                                    <td colspan="4" style="text-align: center">
                                        已通过规格搜索锁定
                                    </td>
                                </tr>
                                <tr style="background: #e6f7ff">
                                    <td>O形圈线径-Ø</td>
                                    <td>d2</td>
                                    <td>
                                        <a-input-number
                                            v-model:value="form.d2"
                                            size="small"
                                            :step="0.01"
                                        />
                                    </td>
                                    <td>
                                        <a-tag color="blue">ISO 3601</a-tag>
                                    </td>
                                    <td colspan="4" style="text-align: center">
                                        标准线径
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="condition-panel">
                            <div class="condition-header">
                                工况条件与规则推荐
                            </div>
                            <a-row :gutter="12">
                                <a-col :span="8">
                                    <div class="field-label">介质</div>
                                    <a-select
                                        v-model:value="form.medium"
                                        :options="mediumOptions"
                                        size="small"
                                        style="width: 100%"
                                    />
                                </a-col>
                                <a-col :span="5">
                                    <div class="field-label">温度 °C</div>
                                    <a-input-number
                                        v-model:value="form.temperature"
                                        size="small"
                                        :step="1"
                                        style="width: 100%"
                                    />
                                </a-col>
                                <a-col :span="5">
                                    <div class="field-label">压力 MPa</div>
                                    <a-input-number
                                        v-model:value="form.pressure"
                                        size="small"
                                        :step="0.1"
                                        style="width: 100%"
                                    />
                                </a-col>
                                <a-col :span="6">
                                    <div class="field-label">硬度 Shore A</div>
                                    <a-input-number
                                        v-model:value="form.hardness"
                                        size="small"
                                        :step="5"
                                        style="width: 100%"
                                    />
                                </a-col>
                            </a-row>
                            <div class="condition-note">
                                <span v-if="recommendationLoading">规则查询中...</span>
                                <span v-else-if="recommendationNote">{{
                                    recommendationNote
                                }}</span>
                                <span v-else>
                                    当前防挤出校核按最大装配间隙
                                    {{ limits.maxClearance.toFixed(3) }} mm
                                    进行
                                </span>
                            </div>
                            <div
                                v-if="materialCandidates.length"
                                class="candidate-strip"
                            >
                                <span class="candidate-title">材质候选</span>
                                <a-tag
                                    v-for="material in materialCandidates"
                                    :key="material.materialCode"
                                    :color="
                                        material.temperatureFit
                                            ? material.ratingScore >= 4
                                                ? 'green'
                                                : material.ratingScore >= 3
                                                  ? 'blue'
                                                  : 'orange'
                                            : 'red'
                                    "
                                >
                                    {{ material.materialCode }}
                                    {{ material.rating || "n/a" }}
                                </a-tag>
                            </div>
                        </div>

                        <div class="result-section">
                            <a-row :gutter="16">
                                <a-col :span="12">
                                    <div class="result-column-header">
                                        同心位置 (平均值)
                                    </div>
                                    <div class="result-grid">
                                        <div class="res-label">
                                            压缩率 [%]
                                            <InfoCircleOutlined
                                                class="info-icon"
                                            />
                                        </div>
                                        <div
                                            class="res-value"
                                            :class="{
                                                error: results.compression
                                                    .warnings.length,
                                            }"
                                        >
                                            {{
                                                results.compression.value.toFixed(
                                                    1,
                                                )
                                            }}
                                            %
                                        </div>
                                        <div class="res-label">
                                            单边间隙 g [mm]
                                        </div>
                                        <div class="res-value">
                                            {{ results.clearance.toFixed(3) }}
                                        </div>
                                        <div class="res-label">
                                            容积填充率 [%]
                                        </div>
                                        <div
                                            class="res-value"
                                            :class="{
                                                error: results.fillRate > 85,
                                            }"
                                        >
                                            {{ results.fillRate.toFixed(1) }} %
                                        </div>
                                        <div class="res-label">
                                            内径拉伸率 [%]
                                        </div>
                                        <div
                                            class="res-value"
                                            :class="{
                                                error: results.stretch.warnings
                                                    .length,
                                            }"
                                        >
                                            {{
                                                results.stretch.value.toFixed(1)
                                            }}
                                            %
                                        </div>
                                    </div>
                                </a-col>
                                <a-col :span="12">
                                    <div class="result-column-header">
                                        偏心/极限工况
                                    </div>
                                    <div class="result-grid">
                                        <div class="res-label">
                                            最小压缩率 (极限)
                                        </div>
                                        <div
                                            class="res-value"
                                            :class="{
                                                error: limits.minComp.warnings
                                                    .length,
                                            }"
                                        >
                                            {{
                                                limits.minComp.value.toFixed(1)
                                            }}
                                            %
                                        </div>
                                        <div class="res-label">
                                            最大压缩率 (极限)
                                        </div>
                                        <div
                                            class="res-value"
                                            :class="{
                                                error: limits.maxComp.warnings
                                                    .length,
                                            }"
                                        >
                                            {{
                                                limits.maxComp.value.toFixed(1)
                                            }}
                                            %
                                        </div>
                                        <div class="res-label">
                                            最大间隙 (含跳动)
                                        </div>
                                        <div class="res-value">
                                            {{
                                                limits.maxClearance.toFixed(3)
                                            }}
                                            mm
                                        </div>
                                        <div class="res-label">推荐材料</div>
                                        <div class="res-value">
                                            {{ recommendedMaterialText }}
                                        </div>
                                        <div class="res-label">防挤出挡圈</div>
                                        <div
                                            class="res-value"
                                            :class="{
                                                error: oringRecommendation
                                                    ?.backupRing?.needed,
                                            }"
                                        >
                                            {{ backupRingText }}
                                        </div>
                                        <div class="res-label">建议槽深</div>
                                        <div class="res-value">
                                            {{ glandDepthText }}
                                        </div>
                                        <div class="res-label">建议槽宽</div>
                                        <div class="res-value">
                                            {{ glandWidthText }}
                                        </div>
                                    </div>
                                </a-col>
                            </a-row>
                            
                            <!-- Section 10.1: 多场耦合计算结果 -->
                            <a-divider>热-力-化多场耦合校核</a-divider>
                            <div class="result-grid">
                                <div class="res-label">修正后压缩率 [%]</div>
                                <div class="res-value" :class="{ error: results.multiPhysics.value.adjustedCompression > 35 || results.multiPhysics.value.adjustedCompression < 10 }">
                                    {{ results.multiPhysics.value.adjustedCompression.toFixed(1) }} %
                                </div>
                                <div class="res-label">热膨胀量 [mm]</div>
                                <div class="res-value">{{ results.multiPhysics.value.thermalExpansion.toFixed(3) }}</div>
                                <div class="res-label">介质溶胀率 [%]</div>
                                <div class="res-value">{{ results.multiPhysics.value.swellingVolume.toFixed(1) }} %</div>
                                <div class="res-label">槽满率 [%]</div>
                                <div class="res-value" :class="{ error: results.multiPhysics.value.fillRate > 100 }">{{ results.multiPhysics.value.fillRate.toFixed(1) }} %</div>
                                <div class="res-label">挤出风险</div>
                                <div class="res-value" :class="{ error: results.multiPhysics.value.extrusionRisk }">
                                    {{ results.multiPhysics.value.extrusionRisk ? '⚠️ 有风险' : '✓ 安全' }}
                                </div>
                            </div>
                            <a-alert v-for="(w,i) in results.multiPhysics.value.warnings" :key="i" :message="w.message" :type="w.level==='error'?'error':w.level==='warning'?'warning':'info'" show-icon style="margin-top:12px"/>
                        </div>

                        <div class="candidate-panel">
                            <div class="candidate-panel-header">
                                规格候选
                                <span class="candidate-panel-meta">
                                    压缩率 {{ squeezeCriteriaText }} / 拉伸率
                                    {{ stretchCriteriaText }} / 槽满率 ≤
                                    {{
                                        oringRecommendation?.sizingCriteria
                                            ?.maxFillPct ?? 85
                                    }}
                                    %
                                </span>
                            </div>
                            <table class="candidate-table">
                                <thead>
                                    <tr>
                                        <th>规格</th>
                                        <th>ID x CS</th>
                                        <th>压缩率</th>
                                        <th>拉伸率</th>
                                        <th>槽满率</th>
                                        <th>状态</th>
                                        <th>推荐理由</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="candidate in sizeCandidates"
                                        :key="candidate.dashCode"
                                        :class="{
                                            'candidate-row-active':
                                                candidate.dashCode ===
                                                form.selectedDashCode,
                                        }"
                                    >
                                        <td>
                                            {{ candidate.dashCode }}
                                        </td>
                                        <td>
                                            {{ candidate.innerDiameterMm.toFixed(2) }}
                                            x
                                            {{
                                                candidate.crossSectionMm.toFixed(
                                                    2,
                                                )
                                            }}
                                        </td>
                                        <td>
                                            {{
                                                candidate.compressionPct.toFixed(
                                                    1,
                                                )
                                            }}
                                            %
                                        </td>
                                        <td>
                                            {{
                                                candidate.stretchPct.toFixed(1)
                                            }}
                                            %
                                        </td>
                                        <td>
                                            {{ candidate.fillPct.toFixed(1) }} %
                                        </td>
                                        <td>
                                            <a-tag
                                                :color="
                                                    candidate.withinCompression &&
                                                    candidate.withinStretch &&
                                                    candidate.withinFill
                                                        ? 'green'
                                                        : 'orange'
                                                "
                                            >
                                                {{
                                                    candidate.withinCompression &&
                                                    candidate.withinStretch &&
                                                    candidate.withinFill
                                                        ? '推荐'
                                                        : '可参考'
                                                }}
                                            </a-tag>
                                        </td>
                                        <td class="candidate-reason-cell">
                                            <span
                                                v-for="reason in candidate.reasons"
                                                :key="reason"
                                                class="candidate-reason"
                                                :class="{
                                                    'is-good':
                                                        reason.includes('命中') ||
                                                        reason.includes('安全') ||
                                                        reason.includes('接近'),
                                                    'is-warn':
                                                        reason.includes('偏低') ||
                                                        reason.includes('偏高'),
                                                }"
                                            >
                                                {{ reason }}
                                            </span>
                                        </td>
                                        <td>
                                            <a-button
                                                size="small"
                                                :type="
                                                    candidate.dashCode ===
                                                    form.selectedDashCode
                                                        ? 'primary'
                                                        : 'default'
                                                "
                                                @click="
                                                    applySizeCandidate(
                                                        candidate,
                                                    )
                                                "
                                            >
                                                {{
                                                    candidate.dashCode ===
                                                    form.selectedDashCode
                                                        ? "已选中"
                                                        : "应用"
                                                }}
                                            </a-button>
                                        </td>
                                    </tr>
                                    <tr v-if="!sizeCandidates.length">
                                        <td colspan="8" class="candidate-empty">
                                            需要当前沟槽尺寸和装配直径才能计算规格候选
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </a-col>
            </a-row>
        </div>
    </div>
</template>

<style scoped>
.tss-style-page {
    font-size: 12px;
}

.type-tabs :deep(.ant-tabs-nav) {
    margin-bottom: 0;
    background: #fafafa;
    border-bottom: 1px solid #ddd;
}

.schematic-container {
    border: 1px solid #e8e8e8;
    padding: 12px;
    background: #fdfdfd;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.svg-preview {
    border: 1px solid #eee;
    background: white;
    border-radius: 4px;
    overflow: hidden;
}

.search-label {
    font-size: 11px;
    color: #666;
    margin-bottom: 4px;
    font-weight: bold;
}
.input-section {
    border-left: 1px solid #f0f0f0;
    padding-left: 12px;
}
.condition-panel {
    margin-bottom: 12px;
    padding: 10px 12px;
    border: 1px solid #d9e8ec;
    background: #f8fcfd;
}
.condition-header {
    margin-bottom: 8px;
    font-weight: 700;
    color: #0b5d6b;
}
.field-label {
    margin-bottom: 4px;
    color: #666;
    font-size: 11px;
}
.condition-note {
    margin-top: 8px;
    color: #666;
    font-size: 11px;
}
.candidate-strip {
    margin-top: 10px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
}
.candidate-title {
    color: #666;
    font-size: 11px;
    font-weight: 700;
}

.section-header {
    margin-bottom: 8px;
    padding: 4px 8px;
    background: #f5f5f5;
    border-radius: 4px;
}
.mode-tag {
    color: #999;
    font-weight: bold;
    transition: color 0.3s;
}
.mode-tag.active {
    color: #008294;
}

.input-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
}
.input-table th {
    background: #f0f2f5;
    padding: 6px 4px;
    border: 1px solid #d9d9d9;
    font-weight: 600;
    text-align: center;
}
.input-table td {
    padding: 4px;
    border: 1px solid #d9d9d9;
    text-align: left;
}
.cell-flex {
    display: flex;
    gap: 2px;
    justify-content: center;
}

.dim-val {
    color: #1890ff;
    text-align: right;
    font-family: monospace;
    font-weight: bold;
}
.dim-res {
    background: #f5f5f5;
    text-align: right;
    font-weight: bold;
    font-family: monospace;
}

.candidate-panel {
    margin-top: 14px;
    border-top: 1px solid #dbe8ec;
    padding-top: 12px;
}
.candidate-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
    font-weight: 700;
    color: #0b5d6b;
}
.candidate-panel-meta {
    color: #666;
    font-size: 11px;
    font-weight: 400;
}
.candidate-table {
    width: 100%;
    border-collapse: collapse;
}
.candidate-table th {
    background: #eef5f7;
    border: 1px solid #d8e5ea;
    padding: 6px 4px;
    text-align: center;
}
.candidate-table td {
    border: 1px solid #e3edf1;
    padding: 6px 4px;
    text-align: center;
}
.candidate-reason-cell {
    text-align: left !important;
    min-width: 220px;
}
.candidate-reason {
    display: inline-block;
    margin: 2px 4px 2px 0;
    padding: 2px 6px;
    border-radius: 999px;
    background: #f2f4f5;
    color: #555;
    font-size: 11px;
    line-height: 1.5;
}
.candidate-reason.is-good {
    background: #f6ffed;
    color: #237804;
}
.candidate-reason.is-warn {
    background: #fff7e6;
    color: #ad6800;
}
.candidate-row-active td {
    background: #e6f7ff;
}
.candidate-empty {
    color: #888;
    background: #fafcfd;
}
</style>
