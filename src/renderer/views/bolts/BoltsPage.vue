<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { calcPreload, calcStress, recommendTorque } from '../../engine/bolts/strength'
import { FilePdfOutlined, PrinterOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'

const boltList = ref<any[]>([])
const selectedDesignation = ref('M10')
const propertyClass = ref('8.8')

// 工况参数
const conditions = ref({
  axialForce: 5.0,      // 轴向载荷 kN
  shearForce: 0,        // 剪切载荷 kN
  torque: 49,           // 预紧扭矩 N·m
  torqueCoeff: 0.2      // 扭矩系数 K
})

onMounted(async () => {
  try {
    const bolts = await window.electron.db.queryBolts()
    boltList.value = bolts
  } catch (err) {
    console.error('Failed to load bolts:', err)
  }
})

const selectedBolt = computed(() => {
  return boltList.value.find(b => b.designation === selectedDesignation.value)
})

const preloadResult = computed(() => {
  return calcPreload(conditions.value.torque, extractDiameter(selectedDesignation.value), conditions.value.torqueCoeff)
})

const stressResult = computed(() => {
  if (!selectedBolt.value || conditions.value.axialForce <= 0) return null
  return calcStress(selectedBolt.value, conditions.value.axialForce, conditions.value.shearForce)
})

const recommendedTorque = computed(() => {
  return recommendTorque(selectedDesignation.value, propertyClass.value)
})

function extractDiameter(designation: string): number {
  const match = designation.match(/M(\d+)/)
  return match ? parseFloat(match[1]) : 0
}

function exportPDF() {
  // TODO: Implement PDF export
  alert('PDF导出功能正在开发中')
}
</script>

<template>
  <div class="bolts-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>螺栓连接模块</small></div>
      <a-space>
        <a-button size="small" type="primary" @click="exportPDF">
          <template #icon><FilePdfOutlined /></template>创建PDF
        </a-button>
        <a-button size="small">
          <template #icon><PrinterOutlined /></template>打印报告
        </a-button>
      </a-space>
    </div>

    <div class="content-body">
      <a-row :gutter="16">
        <a-col :span="10">
          <a-card title="螺栓选型与工况" size="small">
            <a-form layout="vertical">
              <a-form-item label="选择螺栓规格">
                <a-select v-model:value="selectedDesignation" show-search style="width: 100%">
                  <a-select-option v-for="b in boltList" :key="b.designation" :value="b.designation">
                    {{ b.designation }} (d={{ b.d }}mm, 应力面积={{ b.stress_area?.toFixed(1) }}mm²)
                  </a-select-option>
                </a-select>
              </a-form-item>

              <a-form-item label="性能等级">
                <a-select v-model:value="propertyClass" style="width: 100%">
                  <a-select-option value="4.8">4.8级 (一般结构)</a-select-option>
                  <a-select-option value="8.8">8.8级 (机械结构最常用)</a-select-option>
                  <a-select-option value="10.9">10.9级 (高强度连接)</a-select-option>
                  <a-select-option value="12.9">12.9级 (极高强度)</a-select-option>
                </a-select>
              </a-form-item>

              <a-divider>工况载荷</a-divider>
              <a-row :gutter="12">
                <a-col :span="12">
                  <a-form-item label="轴向载荷 (kN)">
                    <a-input-number v-model:value="conditions.axialForce" style="width: 100%" :min="0" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="剪切载荷 (kN)">
                    <a-input-number v-model:value="conditions.shearForce" style="width: 100%" :min="0" />
                  </a-form-item>
                </a-col>
              </a-row>

              <a-divider>预紧参数</a-divider>
              <a-row :gutter="12">
                <a-col :span="12">
                  <a-form-item label="预紧扭矩 (N·m)">
                    <a-input-number v-model:value="conditions.torque" style="width: 100%" :min="0" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="扭矩系数 K">
                    <a-input-number v-model:value="conditions.torqueCoeff" style="width: 100%" :min="0.1" :max="0.3" :step="0.01" />
                    <div class="hint">干摩擦≈0.2, 润滑≈0.1~0.15</div>
                  </a-form-item>
                </a-col>
              </a-row>
            </a-form>
          </a-card>
        </a-col>

        <a-col :span="14">
          <a-card title="螺栓参数与强度校核" size="small" v-if="selectedBolt && stressResult">
            <a-descriptions bordered size="small" :column="2" title="螺栓规格参数">
              <a-descriptions-item label="规格">{{ selectedBolt.designation }}</a-descriptions-item>
              <a-descriptions-item label="标准">{{ selectedBolt.standard || 'GB/T 5782' }}</a-descriptions-item>
              <a-descriptions-item label="公称直径">{{ selectedBolt.d }} mm</a-descriptions-item>
              <a-descriptions-item label="应力截面积">{{ selectedBolt.stress_area?.toFixed(1) }} mm²</a-descriptions-item>
              <a-descriptions-item label="对边宽度">{{ selectedBolt.head_width_s }} mm</a-descriptions-item>
              <a-descriptions-item label="头部高度">{{ selectedBolt.head_height_k }} mm</a-descriptions-item>
            </a-descriptions>

            <a-divider />

            <div class="result-section">
              <div class="result-column-header">预紧力计算</div>
              <div class="result-grid">
                <div class="res-label">预紧扭矩</div>
                <div class="res-value">{{ conditions.torque }} N·m</div>
                <div class="res-label">计算预紧力</div>
                <div class="res-value">{{ preloadResult.value.toFixed(2) }} kN</div>
                <div class="res-label">推荐预紧扭矩 ({{ propertyClass }}级)</div>
                <div class="res-value">{{ recommendedTorque }} N·m</div>
              </div>
            </div>

            <a-divider />

            <div class="result-section">
              <div class="result-column-header">强度校核结果</div>
              <div class="result-grid">
                <div class="res-label">拉伸应力</div>
                <div class="res-value">{{ stressResult.value.tensile_stress.toFixed(1) }} MPa</div>
                <div class="res-label">剪切应力</div>
                <div class="res-value">{{ stressResult.value.shear_stress.toFixed(1) }} MPa</div>
                <div class="res-label">von Mises 等效应力</div>
                <div class="res-value" :class="{ error: stressResult.value.von_mises > 640 }">
                  {{ stressResult.value.von_mises.toFixed(1) }} MPa
                </div>
              </div>

              <a-alert
                v-for="(w, index) in stressResult.warnings"
                :key="index"
                :message="w.message"
                :type="w.level === 'error' ? 'error' : (w.level === 'warning' ? 'warning' : 'info')"
                show-icon
                style="margin-top: 12px"
              />

              <a-alert
                v-if="stressResult.value.von_mises > 640"
                message="等效应力超过8.8级屈服强度，请选择更大规格螺栓或降低载荷"
                type="error"
                show-icon
                style="margin-top: 12px"
              />
              <a-alert
                v-else
                :message="`安全系数: ${(640 / stressResult.value.von_mises).toFixed(2)} (基于8.8级屈服强度)`"
                type="success"
                show-icon
                style="margin-top: 12px"
              />
            </div>

            <a-divider />

            <a-descriptions bordered size="small" :column="1" title="参考信息">
              <a-descriptions-item label="性能等级参数">
                <a-space direction="vertical">
                  <div><InfoCircleOutlined /> 4.8级: 抗拉400MPa, 屈服320MPa</div>
                  <div><InfoCircleOutlined /> 8.8级: 抗拉800MPa, 屈服640MPa (最常用)</div>
                  <div><InfoCircleOutlined /> 10.9级: 抗拉1000MPa, 屈服900MPa</div>
                  <div><InfoCircleOutlined /> 12.9级: 抗拉1200MPa, 屈服1080MPa</div>
                </a-space>
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
          <a-empty v-else description="正在加载数据或参数输入无效..." />
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.bolts-page { font-size: 12px; }
.toolbar { background: #004d40; padding: 6px 16px; display: flex; justify-content: space-between; align-items: center; color: white; }
.brand { font-weight: bold; font-size: 16px; letter-spacing: 1px; }
.brand small { font-weight: normal; font-size: 10px; opacity: 0.8; margin-left: 8px; }
.content-body { padding: 12px; background: #fff; }

.hint { font-size: 11px; color: #888; margin-top: 4px; }

.result-section { border-top: 3px solid #004d40; padding-top: 12px; margin-top: 16px; }
.result-column-header { font-weight: bold; color: #444; margin-bottom: 8px; text-align: center; background: #e0f2f1; padding: 4px 0; }
.result-grid { display: grid; grid-template-columns: 1fr 120px; gap: 4px; }
.res-label { background: #f5f5f5; padding: 6px 8px; border: 1px solid #e8e8e8; display: flex; justify-content: space-between; align-items: center; }
.res-value { background: #e0f2f1; padding: 6px 8px; text-align: right; font-weight: bold; border: 1px solid #80cbc4; font-family: monospace; font-size: 14px; color: #004d40; }
.res-value.error { background: #fff1f0; border-color: #ffa39e; color: #cf1322; }
.info-icon { color: #004d40; cursor: help; }
</style>
