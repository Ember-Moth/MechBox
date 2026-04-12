<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useStandardStore } from "../../store/useStandardStore";
import { calcCompression, calcStretch } from "../../engine/seals/oring";
import {
    InfoCircleOutlined,
    SettingOutlined,
    FilePdfOutlined,
    PrinterOutlined,
} from "@ant-design/icons-vue";

const store = useStandardStore();

// 密封类型与子类型
const sealType = ref("radial-outer"); // radial-outer, radial-inner, axial
const isStatic = ref(true);
const unit = ref("mm");

// 输入参数表单 (模仿 TSS 命名)
const form = ref({
    d4: 25, // 缸孔直径
    d9: 24.5, // 活塞直径
    d3: 20, // 沟槽底径
    b1: 3.6, // 沟槽宽度
    r: 0.2, // 沟槽圆角
    d1: 18.64, // O形圈内径
    d2: 3.53, // O形圈线径
    temp: 23, // 温度
    expansion: 0, // 热膨胀系数
    hardness: 70, // 硬度
});

// 公差状态 (模拟)
const tolerances = ref({
    d4: { pos: "H8", es: 0.033, ei: 0 },
    d9: { pos: "f7", es: -0.02, ei: -0.041 },
    d3: { pos: "h9", es: 0, ei: -0.052 },
});

onMounted(() => {
    store.fetchOringList("AS568");
});

// 核心计算逻辑
const results = computed(() => {
    const cs = form.value.d2;
    const depth = (form.value.d4 - form.value.d3) / 2;
    const comp = calcCompression(cs, depth);
    const str = calcStretch(form.value.d1, form.value.d3);

    // 模拟计算间隙和填充率
    const clearance = (form.value.d4 - form.value.d9) / 2;
    const areaSeal = Math.PI * Math.pow(cs / 2, 2);
    const areaGroove = depth * form.value.b1;
    const fillRate = (areaSeal / areaGroove) * 100;

    return {
        compression: comp,
        stretch: str,
        clearance,
        fillRate,
    };
});
</script>

<template>
    <div class="tss-style-page">
        <!-- 顶部工具栏 -->
        <div class="toolbar">
            <a-space>
                <a-button size="small"
                    ><template #icon><FilePdfOutlined /></template
                    >创建PDF</a-button
                >
                <a-button size="small"
                    ><template #icon><PrinterOutlined /></template
                    >打印</a-button
                >
                <a-radio-group
                    v-model:value="unit"
                    size="small"
                    button-style="solid"
                >
                    <a-radio-button value="inch">英寸</a-radio-button>
                    <a-radio-button value="mm">毫米</a-radio-button>
                </a-radio-group>
            </a-space>
        </div>

        <!-- 密封类型切换 -->
        <a-tabs v-model:activeKey="sealType" class="type-tabs" centered>
            <a-tab-pane key="radial-outer" tab="径向外周密封" />
            <a-tab-pane key="radial-inner" tab="径向内周密封" />
            <a-tab-pane key="axial" tab="轴向密封" />
        </a-tabs>

        <div class="content-body">
            <!-- 左右主分栏 -->
            <a-row :gutter="16">
                <!-- 左侧：示意图 -->
                <a-col :span="8">
                    <div class="schematic-container">
                        <div class="schematic-placeholder">
                            <!-- 这里未来放置参数化 SVG 示意图 -->
                            <img
                                src="https://via.placeholder.com/300x400?text=O-Ring+Schematic"
                                style="width: 100%"
                            />
                        </div>
                        <div class="search-box">
                            <a-input-search
                                placeholder="ISO 快速搜索"
                                size="small"
                                style="margin-bottom: 8px"
                            />
                            <a-input-search
                                placeholder="O形圈尺寸搜索"
                                size="small"
                            />
                        </div>
                    </div>
                </a-col>

                <!-- 右侧：输入与结果 -->
                <a-col :span="16">
                    <div class="input-section">
                        <div class="section-header">
                            <a-space>
                                <span>静密封</span>
                                <a-switch
                                    v-model:checked="isStatic"
                                    size="small"
                                />
                                <span>动密封</span>
                            </a-space>
                        </div>

                        <!-- 输入网格表格 -->
                        <table class="input-table">
                            <thead>
                                <tr>
                                    <th>输入 [mm]</th>
                                    <th>代号</th>
                                    <th>公称尺寸</th>
                                    <th>标准/配合</th>
                                    <th>下偏差</th>
                                    <th>上偏差</th>
                                    <th>最小</th>
                                    <th>最大</th>
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
                                        />
                                    </td>
                                    <td>
                                        <a-select
                                            v-model:value="tolerances.d4.pos"
                                            size="small"
                                            style="width: 70px"
                                            ><a-select-option value="H8"
                                                >H8</a-select-option
                                            ></a-select
                                        >
                                    </td>
                                    <td class="dim-val">
                                        {{ tolerances.d4.ei }}
                                    </td>
                                    <td class="dim-val">
                                        +{{ tolerances.d4.es }}
                                    </td>
                                    <td class="dim-res">
                                        {{
                                            (
                                                form.d4 + tolerances.d4.ei
                                            ).toFixed(3)
                                        }}
                                    </td>
                                    <td class="dim-res">
                                        {{
                                            (
                                                form.d4 + tolerances.d4.es
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
                                        />
                                    </td>
                                    <td>
                                        <a-select
                                            v-model:value="tolerances.d9.pos"
                                            size="small"
                                            style="width: 70px"
                                            ><a-select-option value="f7"
                                                >f7</a-select-option
                                            ></a-select
                                        >
                                    </td>
                                    <td class="dim-val">
                                        {{ tolerances.d9.ei }}
                                    </td>
                                    <td class="dim-val">
                                        {{ tolerances.d9.es }}
                                    </td>
                                    <td class="dim-res">
                                        {{
                                            (
                                                form.d9 + tolerances.d9.ei
                                            ).toFixed(3)
                                        }}
                                    </td>
                                    <td class="dim-res">
                                        {{
                                            (
                                                form.d9 + tolerances.d9.es
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
                                        />
                                    </td>
                                    <td>
                                        <a-select
                                            v-model:value="tolerances.d3.pos"
                                            size="small"
                                            style="width: 70px"
                                            ><a-select-option value="h9"
                                                >h9</a-select-option
                                            ></a-select
                                        >
                                    </td>
                                    <td class="dim-val">
                                        {{ tolerances.d3.ei }}
                                    </td>
                                    <td class="dim-val">
                                        {{ tolerances.d3.es }}
                                    </td>
                                    <td class="dim-res">
                                        {{
                                            (
                                                form.d3 + tolerances.d3.ei
                                            ).toFixed(3)
                                        }}
                                    </td>
                                    <td class="dim-res">
                                        {{
                                            (
                                                form.d3 + tolerances.d3.es
                                            ).toFixed(3)
                                        }}
                                    </td>
                                </tr>
                                <!-- 更多行... -->
                            </tbody>
                        </table>

                        <a-divider style="margin: 12px 0" />

                        <!-- 计算结果区域 -->
                        <div class="result-section">
                            <a-row :gutter="16">
                                <a-col :span="12">
                                    <div class="result-column-header">
                                        同心位置
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
                                        </div>
                                        <div class="res-label">间隙 g [mm]</div>
                                        <div class="res-value">
                                            {{ results.clearance.toFixed(3) }}
                                        </div>
                                        <div class="res-label">
                                            沟槽填充率 [%]
                                        </div>
                                        <div class="res-value">
                                            {{ results.fillRate.toFixed(1) }}
                                        </div>
                                    </div>
                                </a-col>
                                <a-col :span="12">
                                    <div class="result-column-header">
                                        偏心位置
                                    </div>
                                    <div class="result-grid">
                                        <div class="res-label">
                                            最小压缩率 [%]
                                        </div>
                                        <div class="res-value">--</div>
                                        <div class="res-label">
                                            最大间隙 g [mm]
                                        </div>
                                        <div class="res-value">--</div>
                                        <div class="res-label">TSS 型号:</div>
                                        <div class="res-value">--</div>
                                    </div>
                                </a-col>
                            </a-row>
                        </div>
                    </div>
                </a-col>
            </a-row>
        </div>
    </div>
</template>

<style scoped>
.tss-style-page {
    font-family:
        -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
}
.toolbar {
    background: #008294;
    padding: 8px 16px;
    display: flex;
    justify-content: flex-end;
    color: white;
}
.type-tabs :deep(.ant-tabs-nav) {
    margin-bottom: 0;
}
.content-body {
    padding: 16px;
    background: #fff;
}
.schematic-container {
    border: 1px solid #eee;
    padding: 8px;
    height: 100%;
}
.input-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
}
.input-table th {
    background: #f5f5f5;
    text-align: left;
    padding: 4px 8px;
    font-weight: normal;
    border: 1px solid #ddd;
}
.input-table td {
    padding: 4px 8px;
    border: 1px solid #ddd;
}
.dim-val {
    color: #1890ff;
    text-align: right;
}
.dim-res {
    background: #fafafa;
    text-align: right;
    font-weight: bold;
}

.result-section {
    background: #fff;
    border-top: 2px solid #008294;
    padding-top: 12px;
}
.result-column-header {
    font-weight: bold;
    color: #666;
    margin-bottom: 8px;
    text-align: center;
}
.result-grid {
    display: grid;
    grid-template-columns: 1fr 100px;
    gap: 4px;
}
.res-label {
    background: #f9f9f9;
    padding: 4px 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.res-value {
    background: #e6f7ff;
    padding: 4px 8px;
    text-align: right;
    font-weight: bold;
    border: 1px solid #91d5ff;
}
.res-value.error {
    background: #fff1f0;
    border-color: #ffa39e;
    color: #cf1322;
}
.info-icon {
    color: #008294;
    font-size: 14px;
}
</style>
