<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useStandardStore } from "../../store/useStandardStore";
import { calcCompression, calcStretch } from "../../engine/seals/oring";

const store = useStandardStore();

// 表单输入
const selectedCode = ref("010");
const appType = ref("static");
const grooveDepth = ref(1.4);
const shaftID = ref(6.0);

// 页面加载时拉取数据库中的 O型圈列表
onMounted(() => {
    store.fetchOringList("AS568");
});

// 选择的规格数据
const selectedSeal = computed(() => {
    return store.oringList.find((s) => s.code === selectedCode.value);
});

const compression = computed(() => {
    if (!selectedSeal.value || !grooveDepth.value) return null;
    return calcCompression(selectedSeal.value.cs, grooveDepth.value);
});

const stretch = computed(() => {
    if (!selectedSeal.value || !shaftID.value) return null;
    return calcStretch(selectedSeal.value.id, shaftID.value);
});
</script>

<template>
    <div class="seals-page">
        <a-row :gutter="24">
            <a-col :span="10">
                <a-card title="规格与工况 (SQLite)" size="small">
                    <a-form layout="vertical">
                        <a-form-item label="规格代号 (AS568)">
                            <a-select v-model:value="selectedCode">
                                <a-select-option
                                    v-for="size in store.oringList"
                                    :key="size.code"
                                    :value="size.code"
                                >
                                    {{ size.code }} (CS: {{ size.cs }} mm, ID:
                                    {{ size.id }} mm)
                                </a-select-option>
                            </a-select>
                        </a-form-item>
                        <a-form-item label="密封类型">
                            <a-radio-group
                                v-model:value="appType"
                                button-style="solid"
                            >
                                <a-radio-button value="static"
                                    >静密封</a-radio-button
                                >
                                <a-radio-button value="dynamic"
                                    >动密封</a-radio-button
                                >
                            </a-radio-group>
                        </a-form-item>
                        <a-divider>沟槽尺寸</a-divider>
                        <a-form-item label="沟槽深度 (mm)">
                            <a-input-number
                                v-model:value="grooveDepth"
                                :step="0.01"
                                style="width: 100%"
                            />
                        </a-form-item>
                        <a-form-item label="沟槽底部直径 (mm)">
                            <a-input-number
                                v-model:value="shaftID"
                                :step="0.01"
                                style="width: 100%"
                            />
                        </a-form-item>
                    </a-form>
                </a-card>
            </a-col>

            <a-col :span="14">
                <a-card title="设计校验" size="small">
                    <a-space
                        direction="vertical"
                        style="width: 100%"
                        :size="16"
                    >
                        <div v-if="compression" class="result-item">
                            <div
                                style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                "
                            >
                                <span style="font-weight: bold"
                                    >压缩率 (Compression)</span
                                >
                                <a-tag
                                    :color="
                                        compression.warnings.length
                                            ? compression.warnings[0].level ===
                                              'error'
                                                ? 'red'
                                                : 'orange'
                                            : 'green'
                                    "
                                >
                                    {{ compression.value.toFixed(1) }} %
                                </a-tag>
                            </div>
                            <a-alert
                                v-for="(w, index) in compression.warnings"
                                :key="index"
                                :message="w.message"
                                :description="w.suggestion"
                                :type="
                                    w.level === 'error' ? 'error' : 'warning'
                                "
                                show-icon
                                style="margin-top: 8px"
                            />
                        </div>

                        <div v-if="stretch" class="result-item">
                            <div
                                style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                "
                            >
                                <span style="font-weight: bold"
                                    >安装拉伸率 (Stretch)</span
                                >
                                <a-tag
                                    :color="
                                        stretch.warnings.length
                                            ? 'orange'
                                            : 'green'
                                    "
                                >
                                    {{ stretch.value.toFixed(1) }} %
                                </a-tag>
                            </div>
                            <a-alert
                                v-for="(w, index) in stretch.warnings"
                                :key="index"
                                :message="w.message"
                                :description="w.suggestion"
                                type="warning"
                                show-icon
                                style="margin-top: 8px"
                            />
                        </div>
                    </a-space>
                </a-card>
            </a-col>
        </a-row>
    </div>
</template>

<style scoped>
.seals-page {
    padding: 8px;
}
.result-item {
    padding: 12px;
    background: #fdfdfd;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
}
</style>
