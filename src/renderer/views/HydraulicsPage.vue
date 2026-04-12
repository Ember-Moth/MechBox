<script setup lang="ts">
/**
 * HydraulicsPage.vue - 液压气动计算页面
 */
import { ref, computed } from 'vue'
import { calcCylinder, standardBoreSizes } from '@renderer/engine/hydraulics/cylinder'
import { FilePdfOutlined } from '@ant-design/icons-vue'
import { usePdfExport } from '../composables/usePdfExport'


const params = ref({ boreDiameter: 50, rodDiameter: 28, pressure: 10, stroke: 300, flowRate: 10 })
const result = computed(() => calcCylinder(params.value))

function autoSelectBore() {
  const force = 10000 // 假设需要 10kN
  const area = force / params.value.pressure
  params.value.boreDiameter = standardBoreSizes.find(s => Math.PI*s*s/4 >= area) || 80
}

const { isExporting, exportPdf } = usePdfExport()

async function handleExportPdf() {
  const el = document.querySelector('.hydraulics-page') as HTMLElement
  if (!el) return
  const c = await html2canvas(el, { scale: 2 })
  const pdf = new jsPDF('p','mm','a4')
  pdf.addImage(c.toDataURL('image/png'),'PNG',0,0,pdf.internal.pageSize.getWidth(),c.height*pdf.internal.pageSize.getWidth()/c.width)
  pdf.save(`cylinder-${params.value.boreDiameter}-${Date.now()}.pdf`)
}
</script>

<template>
  <div class="hydraulics-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>液压气动计算</small></div>
      <a-space>
        <a-button size="small" @click="autoSelectBore">自动选型</a-button>
        <a-button size="small" type="primary" @click="handleExportPdf"><template #icon><FilePdfOutlined /></template>导出PDF</a-button>
      </a-space>
    </div>
    <div class="content-body">
      <a-row :gutter="16">
        <a-col :span="10">
          <a-card title="液压缸参数" size="small">
            <a-form layout="vertical">
              <a-form-item label="缸径 D (mm)">
                <a-select v-model:value="params.boreDiameter">
                  <a-select-option v-for="s in standardBoreSizes" :key="s" :value="s">{{ s }} mm</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="杆径 d (mm)"><a-input-number v-model:value="params.rodDiameter" :min="10" :max="params.boreDiameter-5" style="width:100%"/></a-form-item>
              <a-form-item label="工作压力 P (MPa)"><a-input-number v-model:value="params.pressure" :min="0" style="width:100%"/><div style="font-size:11px;color:#888">低压≤2.5 / 中压2.5~8 / 高压16~31.5</div></a-form-item>
              <a-form-item label="行程 (mm)"><a-input-number v-model:value="params.stroke" :min="10" style="width:100%"/></a-form-item>
              <a-form-item label="流量 (L/min)"><a-input-number v-model:value="params.flowRate" :min="0" style="width:100%"/></a-form-item>
            </a-form>
          </a-card>
        </a-col>
        <a-col :span="14">
          <a-card title="计算结果" size="small">
            <a-descriptions bordered size="small" :column="2">
              <a-descriptions-item label="活塞面积">{{ (result.value.pistonArea/100).toFixed(2) }} cm²</a-descriptions-item>
              <a-descriptions-item label="伸出推力">{{ (result.value.extendForce/1000).toFixed(2) }} kN</a-descriptions-item>
              <a-descriptions-item label="缩回拉力">{{ (result.value.retractForce/1000).toFixed(2) }} kN</a-descriptions-item>
              <a-descriptions-item label="伸出速度">{{ result.value.extendSpeed.toFixed(1) }} mm/s</a-descriptions-item>
              <a-descriptions-item label="缩回速度">{{ result.value.retractSpeed.toFixed(1) }} mm/s</a-descriptions-item>
              <a-descriptions-item label="所需流量">{{ result.value.flowRequired.toFixed(1) }} L/min</a-descriptions-item>
              <a-descriptions-item label="失稳风险">
                <a-tag :color="result.value.bucklingRisk?'red':'green'">{{ result.value.bucklingRisk?'有风险':'安全' }}</a-tag>
              </a-descriptions-item>
            </a-descriptions>
            <a-alert v-for="(w,i) in result.value.warnings" :key="i" :message="w.message" :type="w.level==='error'?'error':w.level==='warning'?'warning':'info'" show-icon style="margin-top:12px"/>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.hydraulics-page{max-width:1200px;margin:0 auto}
.toolbar{background:#004d40;padding:6px 16px;display:flex;justify-content:space-between;align-items:center;color:white;border-radius:4px;margin-bottom:16px}
.brand{font-weight:bold;font-size:16px;letter-spacing:1px}.brand small{font-weight:normal;font-size:10px;opacity:.8;margin-left:8px}
.content-body{background:#fff;border-radius:8px;padding:16px}
</style>
