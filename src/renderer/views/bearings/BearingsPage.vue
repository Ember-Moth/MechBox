<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStandardStore } from '../../store/useStandardStore'
import { calcLife, calcEquivalentLoad } from '../../engine/bearings/life'
import { calcISO281Life, calcKappa } from '../../engine/bearings/iso281'
import { FilePdfOutlined, PrinterOutlined, StarOutlined, StarTwoTone } from '@ant-design/icons-vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Preview3D from '../../components/Preview3D.vue'

const store = useStandardStore()
const isFavorited = ref(false)

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

// Section 11.3: Live input validation
const inputErrors = computed(() => ({
  Fr: conditions.value.Fr < 0 ? '径向载荷不能为负' : '',
  Fa: conditions.value.Fa < 0 ? '轴向载荷不能为负' : '',
  X: conditions.value.X < 0 || conditions.value.X > 1 ? 'X 应在 0~1 之间' : '',
  Y: conditions.value.Y < 0 ? 'Y 不能为负' : '',
  speed: conditions.value.speed <= 0 ? '转速必须大于 0' : conditions.value.speed > 30000 ? '转速过高，请确认轴承规格' : '',
  temp: conditions.value.temp < -50 ? '温度过低' : conditions.value.temp > 200 ? '温度过高，请确认润滑方式' : '',
}))

const isValid = computed(() => Object.values(inputErrors.value).every(e => !e))
const visibleInputErrors = computed(() => Object.values(inputErrors.value).filter(Boolean))

const results = computed(() => {
  if (!selectedBearing.value || conditions.value.speed <= 0) return null

  const P = calcEquivalentLoad(conditions.value.Fr, conditions.value.Fa, conditions.value.X, conditions.value.Y)
  const life = calcLife(selectedBearing.value.dynamic_load_rating / 1000, P, 'ball', conditions.value.speed)
  
  // ISO 281 修正寿命计算 (Section 10.2)
  const kappa = calcKappa(32, 16)  // 简化假设: 工作粘度32, 额定粘度16
  const iso281 = calcISO281Life({
    C_r: selectedBearing.value.dynamic_load_rating / 1000,
    P,
    n: conditions.value.speed,
    bearingType: 'ball',
    kappa,
    a_1: 1.0,  // 90% 可靠性
    eta_c: 0.8  // 正常污染水平
  })

  return { P, life, iso281, kappa }
})

async function exportPDF() {
  const element = document.querySelector('.bearings-page') as HTMLElement
  if (!element) return

  const canvas = await html2canvas(element, { scale: 2, useCORS: true })
  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save(`MechBox-Bearing-${selectedDesignation.value}-${new Date().toISOString().slice(0,10)}.pdf`)
}

function toggleFavorite() {
  if (!selectedBearing.value) return
  
  if (isFavorited.value) {
    const id = `bearing_${selectedDesignation.value}`
    store.removeFavorite(id)
    isFavorited.value = false
  } else {
    store.addFavorite('bearings', `轴承 ${selectedDesignation.value}`, {
      designation: selectedDesignation.value,
      bearing: selectedBearing.value,
      conditions: { ...conditions.value },
      results: results.value
    })
    isFavorited.value = true
  }
}

function printReport() {
  window.print()
}
</script>

<template>
  <div class="bearings-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>Bearings Module</small></div>
      <a-space>
        <a-button 
          size="small"
          @click="toggleFavorite"
        >
          <template #icon>
            <StarTwoTone v-if="isFavorited" two-tone-color="#faad14" />
            <StarOutlined v-else />
          </template>
          {{ isFavorited ? '已收藏' : '收藏' }}
        </a-button>
        <a-button size="small" type="primary" @click="exportPDF">
          <template #icon><FilePdfOutlined /></template>创建PDF
        </a-button>
        <a-button size="small" @click="printReport">
          <template #icon><PrinterOutlined /></template>打印报告
        </a-button>
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
                    {{ b.designation }} (d={{ b.inner_diameter }}mm, D={{ b.outer_diameter }}mm)
                  </a-select-option>
                </a-select>
              </a-form-item>

              <a-divider>工况载荷 (kN)</a-divider>
              <a-row :gutter="12">
                <a-col :span="12"><a-form-item label="径向载荷 Fr"><a-input-number v-model:value="conditions.Fr" :status="inputErrors.Fr ? 'error' : ''" style="width: 100%" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="轴向载荷 Fa"><a-input-number v-model:value="conditions.Fa" :status="inputErrors.Fa ? 'error' : ''" style="width: 100%" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="系数 X"><a-input-number v-model:value="conditions.X" :status="inputErrors.X ? 'error' : ''" :min="0" :max="1" style="width: 100%" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="系数 Y"><a-input-number v-model:value="conditions.Y" :status="inputErrors.Y ? 'error' : ''" :min="0" style="width: 100%" /></a-form-item></a-col>
              </a-row>

              <a-divider>运行参数</a-divider>
              <a-row :gutter="12">
                <a-col :span="12"><a-form-item label="转速 (rpm)" :validate-status="inputErrors.speed ? 'error' : ''"><a-input-number v-model:value="conditions.speed" :status="inputErrors.speed ? 'error' : ''" style="width: 100%" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="温度 (°C)" :validate-status="inputErrors.temp ? 'error' : ''"><a-input-number v-model:value="conditions.temp" :status="inputErrors.temp ? 'error' : ''" style="width: 100%" /></a-form-item></a-col>
              </a-row>
            </a-form>
          </a-card>
        </a-col>

        <a-col :span="14">
          <!-- Section 11.3: Live validation alert banner -->
          <a-alert v-if="!isValid" type="error" show-icon style="margin-bottom: 12px">
            <template #message>输入参数有误</template>
            <template #description>
              <ul style="margin: 4px 0 0 16px; padding: 0">
                <li v-for="(msg, key) in visibleInputErrors" :key="key">{{ msg }}</li>
              </ul>
            </template>
          </a-alert>

          <a-card title="轴承参数与寿命计算" size="small" v-if="selectedBearing && results">
            <a-descriptions bordered size="small" :column="2" title="轴承规格参数">
              <a-descriptions-item label="型号">{{ selectedBearing.designation }}</a-descriptions-item>
              <a-descriptions-item label="类型">深沟球轴承</a-descriptions-item>
              <a-descriptions-item label="内径 d">{{ selectedBearing.inner_diameter }} mm</a-descriptions-item>
              <a-descriptions-item label="外径 D">{{ selectedBearing.outer_diameter }} mm</a-descriptions-item>
              <a-descriptions-item label="宽度 B">{{ selectedBearing.width }} mm</a-descriptions-item>
              <a-descriptions-item label="质量">{{ selectedBearing.mass }} kg</a-descriptions-item>
              <a-descriptions-item label="额定动载荷 Cr">{{ (selectedBearing.dynamic_load_rating / 1000).toFixed(2) }} kN</a-descriptions-item>
              <a-descriptions-item label="额定静载荷 C0r">{{ (selectedBearing.static_load_rating / 1000).toFixed(2) }} kN</a-descriptions-item>
              <a-descriptions-item label="脂润滑极限">{{ selectedBearing.grease_speed_limit }} rpm</a-descriptions-item>
              <a-descriptions-item label="油润滑极限">{{ selectedBearing.oil_speed_limit }} rpm</a-descriptions-item>
            </a-descriptions>

            <!-- Section 4.1: 3D parameterized visualization -->
            <a-divider>3D 参数预览</a-divider>
            <Preview3D type="bearing" :params="{ d: selectedBearing.inner_diameter, D: selectedBearing.outer_diameter, B: selectedBearing.width }" />

            <a-divider />

            <div class="result-section">
              <div class="result-column-header">寿命校验结果 (ISO 281)</div>
              <div class="result-grid">
                <div class="res-label">当量动载荷 P [kN]</div>
                <div class="res-value">{{ results.P.toFixed(2) }}</div>
                <div class="res-label">基本额定寿命 L10 [百万转]</div>
                <div class="res-value">{{ results.life.value.L10.toFixed(2) }}</div>
                <div class="res-label">小时寿命 L10h [h]</div>
                <div class="res-value" :class="{ error: results.life.warnings.length }">{{ results.life.value.L10h.toFixed(0) }}</div>
              </div>
              
              <a-divider>ISO 281 修正额定寿命</a-divider>
              <div class="result-grid">
                <div class="res-label">润滑膜厚度比 κ</div>
                <div class="res-value">{{ results.kappa.toFixed(2) }}</div>
                <div class="res-label">修正系数 a_ISO</div>
                <div class="res-value">{{ results.iso281.value.a_ISO.toFixed(2) }}</div>
                <div class="res-label">修正寿命 L10m [百万转]</div>
                <div class="res-value">{{ results.iso281.value.L10m.toFixed(2) }}</div>
                <div class="res-label">修正小时寿命 L10mh [h]</div>
                <div class="res-value" :class="{ error: results.iso281.value.L10mh < results.life.value.L10h }">{{ results.iso281.value.L10mh.toFixed(0) }}</div>
              </div>
              
              <a-alert
                v-for="(w, index) in [...results.life.warnings, ...results.iso281.value.warnings]"
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
/* 使用全局统一样式 */

.result-section { border-top: 3px solid #004d40; padding-top: 12px; margin-top: 16px; }
.result-column-header { font-weight: bold; color: #444; margin-bottom: 8px; text-align: center; background: #e0f2f1; padding: 4px 0; }
.result-grid { display: grid; grid-template-columns: 1fr 120px; gap: 4px; }
.res-label { background: #f5f5f5; padding: 6px 8px; border: 1px solid #e8e8e8; display: flex; justify-content: space-between; align-items: center; }
.res-value { background: #e0f2f1; padding: 6px 8px; text-align: right; font-weight: bold; border: 1px solid #80cbc4; font-family: monospace; font-size: 14px; color: #004d40; }
.res-value.error { background: #fff1f0; border-color: #ffa39e; color: #cf1322; }
.info-icon { color: #004d40; cursor: help; }
</style>
