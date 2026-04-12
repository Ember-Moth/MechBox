<script setup lang="ts">
/**
 * TolerancesPage.vue - 公差配合计算页面
 * 基于 ISO 286 / GB/T 1800 标准
 */
import { ref, computed, watchEffect } from "vue";
import { useStandardStore } from "../../store/useStandardStore";
import { calcFit } from "../../engine/tolerances/fit";
import type { FitResult } from "../../engine/types";
import { FilePdfOutlined } from "@ant-design/icons-vue";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const store = useStandardStore();

// 表单输入
const size = ref<number>(25);
const holePos = ref("H");
const holeGrade = ref("IT7");
const shaftPos = ref("g");
const shaftGrade = ref("IT6");

const holePositions = ["H"];
const shaftPositions = ["h", "g", "f"];
const itGrades = ["IT5", "IT6", "IT7", "IT8", "IT9"];

// 计算结果
const fitResult = ref<FitResult | null>(null);

watchEffect(async () => {
    if (!size.value || size.value <= 0) {
        fitResult.value = null;
        return;
    }

    const sizeIndex = store.getSizeRangeIndex(size.value);
    if (sizeIndex === -1) {
        fitResult.value = null;
        return;
    }

    const [holeIT, holeDev, shaftIT, shaftDev] = await Promise.all([
        store.getITValue(holeGrade.value, sizeIndex),
        store.getFundamentalDeviation("holes", holePos.value, sizeIndex),
        store.getITValue(shaftGrade.value, sizeIndex),
        store.getFundamentalDeviation("shafts", shaftPos.value, sizeIndex),
    ]);

    if (
        holeIT === null ||
        holeDev === null ||
        shaftIT === null ||
        shaftDev === null
    ) {
        fitResult.value = null;
        return;
    }

    const holeES = holeDev + holeIT;
    const holeEI = holeDev;
    const shaftes = shaftDev;
    const shaftei = shaftDev - shaftIT;

    const result = calcFit(size.value, holeES / 1000, holeEI / 1000, shaftes / 1000, shaftei / 1000);
    result.fit_code = `${holePos.value}${holeGrade.value.replace("IT", "")}/${shaftPos.value}${shaftGrade.value.replace("IT", "")}`;
    fitResult.value = result;
});

const getFitTypeLabel = (type: string) => {
    const map: Record<string, string> = {
        clearance: "间隙配合",
        transition: "过渡配合",
        interference: "过盈配合",
    };
    return map[type] || type;
};

const getFitTypeColor = (type: string) => {
    const map: Record<string, string> = {
        clearance: "green",
        transition: "orange",
        interference: "red",
    };
    return map[type] || "blue";
};

async function exportPDF() {
    const el = document.querySelector(".tolerances-page") as HTMLElement;
    if (!el) return;
    const c = await html2canvas(el, { scale: 2 });
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(c.toDataURL("image/png"), "PNG", 0, 0, pdf.internal.pageSize.getWidth(), (c.height * pdf.internal.pageSize.getWidth()) / c.width);
    pdf.save(`tolerance-${fitResult.value?.fit_code || "fit"}-${Date.now()}.pdf`);
}
</script>

<template>
    <div class="tolerances-page">
        <div class="toolbar">
            <div class="brand">MechBox <small>公差配合</small></div>
            <a-button size="small" type="primary" @click="exportPDF" :disabled="!fitResult">
                <template #icon><FilePdfOutlined /></template>导出PDF
            </a-button>
        </div>

        <div class="content-body">
            <a-row :gutter="24">
                <a-col :span="10">
                    <a-card title="参数输入" size="small">
                        <a-form layout="vertical">
                            <a-form-item label="基本尺寸 (mm)">
                                <a-input-number
                                    v-model:value="size"
                                    :min="1"
                                    :max="500"
                                    style="width: 100%"
                                />
                            </a-form-item>
                            <a-divider>孔公差带</a-divider>
                            <a-row :gutter="12">
                                <a-col :span="12">
                                    <a-form-item label="基本偏差代号">
                                        <a-select
                                            v-model:value="holePos"
                                            :options="holePositions.map((v) => ({ value: v }))"
                                        />
                                    </a-form-item>
                                </a-col>
                                <a-col :span="12">
                                    <a-form-item label="公差等级">
                                        <a-select
                                            v-model:value="holeGrade"
                                            :options="itGrades.map((v) => ({ value: v }))"
                                        />
                                    </a-form-item>
                                </a-col>
                            </a-row>
                            <a-divider>轴公差带</a-divider>
                            <a-row :gutter="12">
                                <a-col :span="12">
                                    <a-form-item label="基本偏差代号">
                                        <a-select
                                            v-model:value="shaftPos"
                                            :options="shaftPositions.map((v) => ({ value: v }))"
                                        />
                                    </a-form-item>
                                </a-col>
                                <a-col :span="12">
                                    <a-form-item label="公差等级">
                                        <a-select
                                            v-model:value="shaftGrade"
                                            :options="itGrades.map((v) => ({ value: v }))"
                                        />
                                    </a-form-item>
                                </a-col>
                            </a-row>
                        </a-form>
                    </a-card>
                </a-col>

                <a-col :span="14">
                    <a-card title="计算结果" size="small" v-if="fitResult">
                        <template #extra>
                            <a-tag :color="getFitTypeColor(fitResult.fit_type)">
                                {{ getFitTypeLabel(fitResult.fit_type) }}
                            </a-tag>
                        </template>
                        <a-descriptions bordered size="small" :column="2">
                            <a-descriptions-item label="配合代号" :span="2">
                                <strong>{{ fitResult.fit_code }}</strong>
                            </a-descriptions-item>
                            <a-descriptions-item label="孔上偏差 ES">
                                +{{ (fitResult.hole_upper * 1000).toFixed(0) }} μm
                            </a-descriptions-item>
                            <a-descriptions-item label="孔下偏差 EI">
                                {{ (fitResult.hole_lower * 1000).toFixed(0) }} μm
                            </a-descriptions-item>
                            <a-descriptions-item label="轴上偏差 es">
                                {{ (fitResult.shaft_upper * 1000).toFixed(0) }} μm
                            </a-descriptions-item>
                            <a-descriptions-item label="轴下偏差 ei">
                                {{ (fitResult.shaft_lower * 1000).toFixed(0) }} μm
                            </a-descriptions-item>
                            <a-descriptions-item label="最大间隙 Xmax">
                                <a-tag :color="fitResult.max_clearance >= 0 ? 'green' : 'red'">
                                    {{ (fitResult.max_clearance * 1000).toFixed(0) }} μm
                                </a-tag>
                            </a-descriptions-item>
                            <a-descriptions-item label="最小间隙 Xmin">
                                <a-tag :color="fitResult.min_clearance >= 0 ? 'green' : 'red'">
                                    {{ (fitResult.min_clearance * 1000).toFixed(0) }} μm
                                </a-tag>
                            </a-descriptions-item>
                        </a-descriptions>

                        <div style="margin-top:16px;padding:12px;background:#f0f7ff;border-radius:4px">
                            <strong>计算公式 (ISO 286)：</strong>
                            <div>孔: ES = EI + IT, EI = 基本偏差</div>
                            <div>轴: es = 基本偏差, ei = es - IT</div>
                            <div>Xmax = ES - ei, Xmin = EI - es</div>
                            <div v-if="fitResult.fit_type === 'clearance'">间隙配合: Xmin ≥ 0</div>
                            <div v-else-if="fitResult.fit_type === 'interference'">过盈配合: Xmax ≤ 0</div>
                            <div v-else>过渡配合: Xmax > 0 且 Xmin < 0</div>
                        </div>
                    </a-card>
                    <a-empty v-else description="请输入有效基本尺寸" />
                </a-col>
            </a-row>
        </div>
    </div>
</template>

<style scoped>
.tolerances-page { max-width: 1200px; margin: 0 auto; }
.toolbar { background: #004d40; padding: 6px 16px; display: flex; justify-content: space-between; align-items: center; color: white; border-radius: 4px; margin-bottom: 16px; }
.brand { font-weight: bold; font-size: 16px; letter-spacing: 1px; }
.brand small { font-weight: normal; font-size: 10px; opacity: 0.8; margin-left: 8px; }
.content-body { background: #fff; border-radius: 8px; padding: 16px; }
</style>
