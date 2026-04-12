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

// 密封类型与状态
const sealType = ref("radial-outer");
const isStatic = ref(true);
const unit = ref("mm");

// 输入参数表单
const form = ref({
    d4: 25.0, // 缸孔直径
    d9: 24.5, // 活塞直径
    d3: 20.0, // 沟槽底径
    b1: 3.6, // 沟槽宽度
    r: 0.2, // 沟槽圆角
    d1: 18.64, // O形圈内径
    d2: 3.53, // O形圈线径
    temp: 23,
    expansion: 0,
    hardness: 70,
});

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

onMounted(() => {
    store.fetchOringList("AS568");
});

// 规格自动填充
const onOringSelect = async (code: string) => {
    const spec = await window.electron.db.queryOringSpec("AS568", code);
    if (spec) {
        form.value.d1 = spec.id;
        form.value.d2 = spec.cs;
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

    // 多场耦合计算 (Section 10.1)
    const multiPhysics = calcSealMultiPhysics({
        cs,
        id: form.value.d1,
        grooveDepth: depth,
        grooveWidth: form.value.b1,
        clearance,
        temperature: form.value.temperature || 20,
        pressure: form.value.pressure || 0,
        material: form.value.material || 'NBR',
        medium: form.value.medium || 'mineral_oil',
        application: isStatic.value ? 'static' : 'reciprocating'
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
                                O形圈规格快速选择 (AS568)
                            </div>
                            <a-select
                                show-search
                                placeholder="搜索规格代码 (如 010, 110...)"
                                style="width: 100%"
                                @change="onOringSelect"
                            >
                                <a-select-option
                                    v-for="s in store.oringList"
                                    :key="s.code"
                                    :value="s.code"
                                >
                                    AS568-{{ s.code }} ({{ s.id }} x {{ s.cs }})
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
                                    @change="isStatic = !isStatic"
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
                                        <div class="res-value">NBR 70</div>
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
.toolbar {
    background: #008294;
    padding: 6px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
}
.brand {
    font-weight: bold;
    font-size: 16px;
    letter-spacing: 1px;
}
.brand small {
    font-weight: normal;
    font-size: 10px;
    opacity: 0.8;
    margin-left: 8px;
}

.type-tabs :deep(.ant-tabs-nav) {
    margin-bottom: 0;
    background: #fafafa;
    border-bottom: 1px solid #ddd;
}
.content-body {
    padding: 12px;
    background: #fff;
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

.result-section {
    border-top: 3px solid #008294;
    padding-top: 12px;
}
.result-column-header {
    font-weight: bold;
    color: #444;
    margin-bottom: 6px;
    text-align: center;
    background: #f0f0f0;
    padding: 2px 0;
}
.result-grid {
    display: grid;
    grid-template-columns: 1fr 110px;
    gap: 2px;
}
.res-label {
    background: #f7f9fa;
    padding: 6px 8px;
    border: 1px solid #e8e8e8;
}
.res-value {
    background: #e6f7ff;
    padding: 6px 8px;
    text-align: right;
    font-weight: bold;
    border: 1px solid #91d5ff;
    font-family: monospace;
    font-size: 13px;
}
.res-value.error {
    background: #fff1f0;
    border-color: #ffa39e;
    color: #cf1322;
}
.info-icon {
    color: #008294;
    cursor: help;
}
</style>
