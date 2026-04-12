<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStandardStore } from '../../store/useStandardStore'
import { calcLife, calcEquivalentLoad } from '../../engine/bearings/life'
import { FilePdfOutlined, PrinterOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'

const store = useStandardStore()

// 工况参数
const conditions = ref({
  Fr: 2.0,      // 径向载荷 kN
  Fa: 0.5,      // 轴向载荷 kN
  X: 0.56,      // 径向系数
  Y: 1.5,       // 轴向系数
  speed: 1500,  // 转速 rpm
  temp: 50      // 工作温度
})

// 用户选择的轴承型号
const selectedDesignation = ref('6205')

onMounted(async () => {
  await store.fetchBearings()
})

const selectedBearing = computed(() => {
  return store.bearingList.find(b => b.designation === selectedDesignation.value)
})

const results = computed(() => {
  if (!selectedBearing.value || conditions.value.speed <= 0) return null

  const P = calcEquivalentLoad(conditions.value.Fr, conditions.value.Fa, conditions.value.X, conditions.value.Y)
  const life = calcLife(selectedBearing.value.C_r, P, 'ball', conditions.value.speed)

  return { P, life }
})
</script>

<template>
  <div class="bearings-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>Bearings Module</small></div>
      <a-space>
        <a-button size="small" type="primary"><template #icon><FilePdfOutlined /></template>创建PDF</a-button>
        <a-button size="small"><template #icon><PrinterOutlined /></template>打印报告</a-button>
      </a-space>
    </div>

    <div class="content-body">
      <a-row :gutter="16">
        <a-col :span="10">
          <a-card title="轴承选型与工况" size="small">
            <a-form layout="vertical">
              <a-form-item label="选择深沟球轴承型号">
                <a-select v-model:value="selectedDesignation" show-search style="width: 100%">
                  <a-select-option v-for="b in store.bearingList" :key="b.designation" :value="b.designation">
                    {{ b.designation }} (d={{ b.d }}mm, D={{ b.D }}mm)
                  </a-select-option>
                </a-select>
              </a-form-item>

              <a-divider>工况载荷 (kN)</a-divider>
              <a-row :gutter="12">
                <a-col :span="12"><a-form-item label="径向载荷 Fr"><a-input-number v-model:value="conditions.Fr" style="width: 100%" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="轴向载荷 Fa"><a-input-number v-model:value="conditions.Fa" style="width: 100%" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="系数 X"><a-input-number v-model:value="conditions.X" style="width: 100%" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="系数 Y"><a-input-number v-model:value="conditions.Y" style="width: 100%" /></a-form-item></a-col>
              </a-row>

              <a-divider>运行参数</a-divider>
              <a-row :gutter="12">
                <a-col :span="12"><a-form-item label="转速 (rpm)"><a-input-number v-model:value="conditions.speed" style="width: 100%" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="温度 (°C)"><a-input-number v-model:value="conditions.temp" style="width: 100%" /></a-form-item></a-col>
              </a-row>
            </a-form>
          </a-card>
        </a-col>

        <a-col :span="14">
          <a-card title="轴承参数与寿命计算" size="small" v-if="selectedBearing && results">
            <a-descriptions bordered size="small" :column="2" title="轴承规格参数">
              <a-descriptions-item label="型号">{{ selectedBearing.designation }}</a-descriptions-item>
              <a-descriptions-item label="类型">深沟球轴承</a-descriptions-item>
              <a-descriptions-item label="内径 d">{{ selectedBearing.d }} mm</a-descriptions-item>
              <a-descriptions-item label="外径 D">{{ selectedBearing.D }} mm</a-descriptions-item>
              <a-descriptions-item label="宽度 B">{{ selectedBearing.B }} mm</a-descriptions-item>
              <a-descriptions-item label="质量">{{ selectedBearing.mass }} kg</a-descriptions-item>
              <a-descriptions-item label="额定动载荷 Cr">{{ selectedBearing.C_r }} kN</a-descriptions-item>
              <a-descriptions-item label="额定静载荷 C0r">{{ selectedBearing.C_0r }} kN</a-descriptions-item>
              <a-descriptions-item label="脂润滑极限">{{ selectedBearing.speed_limit_grease }} rpm</a-descriptions-item>
              <a-descriptions-item label="油润滑极限">{{ selectedBearing.speed_limit_oil }} rpm</a-descriptions-item>
            </a-descriptions>

            <a-divider />

            <div class="result-section">
              <div class="result-column-header">寿命校验结果 (ISO 281)</div>
              <div class="result-grid">
                <div class="res-label">当量动载荷 P [kN]</div>
                <div class="res-value">{{ results.P.toFixed(2) }}</div>
                <div class="res-label">基本额定寿命 L10 [百万转]</div>
                <div class="res-value">{{ results.life.value.L10.toFixed(2) }}</div>
                <div class="res-label">小时寿命 L10h [h] <InfoCircleOutlined class="info-icon" /></div>
                <div class="res-value" :class="{ error: results.life.warnings.length }">{{ results.life.value.L10h.toFixed(0) }}</div>
              </div>
              <a-alert
                v-for="(w, index) in results.life.warnings"
                :key="index"
                :message="w.message"
                :type="w.level === 'error' ? 'error' : (w.level === 'warning' ? 'warning' : 'info')"
                show-icon
                style="margin-top: 12px"
              />
            </div>
          </a-card>
          <a-empty v-else description="正在加载数据或参数输入无效..." />
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.bearings-page { font-size: 12px; }
.toolbar { background: #004d40; padding: 6px 16px; display: flex; justify-content: space-between; align-items: center; color: white; }
.brand { font-weight: bold; font-size: 16px; letter-spacing: 1px; }
.brand small { font-weight: normal; font-size: 10px; opacity: 0.8; margin-left: 8px; }
.content-body { padding: 12px; background: #fff; }

.result-section { border-top: 3px solid #004d40; padding-top: 12px; margin-top: 16px; }
.result-column-header { font-weight: bold; color: #444; margin-bottom: 8px; text-align: center; background: #e0f2f1; padding: 4px 0; }
.result-grid { display: grid; grid-template-columns: 1fr 120px; gap: 4px; }
.res-label { background: #f5f5f5; padding: 6px 8px; border: 1px solid #e8e8e8; display: flex; justify-content: space-between; align-items: center; }
.res-value { background: #e0f2f1; padding: 6px 8px; text-align: right; font-weight: bold; border: 1px solid #80cbc4; font-family: monospace; font-size: 14px; color: #004d40; }
.res-value.error { background: #fff1f0; border-color: #ffa39e; color: #cf1322; }
.info-icon { color: #004d40; cursor: help; }
</style>
