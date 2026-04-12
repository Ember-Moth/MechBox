<script setup lang="ts">
/**
 * SpringsPage.vue - 弹簧计算页面
 */
import { ref, computed } from 'vue'
import { calcCompressionSpring, getSpringColorGrade } from '@renderer/engine/springs/compression'
import { calcSpringBuckling } from '@renderer/engine/springs/buckling'
import { FilePdfOutlined } from '@ant-design/icons-vue'
import { usePdfExport } from '../composables/usePdfExport'


const params = ref({ 
  wireDiameter: 2, 
  meanDiameter: 16, 
  activeCoils: 10, 
  shearModulus: 79000, 
  load: 50,
  freeLength: 100,
  endCondition: 'hinged-hinged' as 'fixed-fixed' | 'fixed-hinged' | 'hinged-hinged' | 'fixed-free'
})

const result = computed(() => calcCompressionSpring(params.value))
const bucklingResult = computed(() => calcSpringBuckling({
  freeLength: params.value.freeLength,
  meanDiameter: params.value.meanDiameter,
  endCondition: params.value.endCondition,
  workingDeflection: result.value.value.deflection
}))

const { isExporting, exportPdf } = usePdfExport()

async function handleExportPdf() {
  const el = document.querySelector('.springs-page') as HTMLElement
  if (!el) return
  const c = await html2canvas(el, { scale: 2 })
  const pdf = new jsPDF('p','mm','a4')
  pdf.addImage(c.toDataURL('image/png'),'PNG',0,0,pdf.internal.pageSize.getWidth(),c.height*pdf.internal.pageSize.getWidth()/c.width)
  pdf.save(`spring-${Date.now()}.pdf`)
}
</script>

<template>
  <div class="springs-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>弹簧计算</small></div>
      <a-button size="small" type="primary" @click="handleExportPdf"><template #icon><FilePdfOutlined /></template>导出PDF</a-button>
    </div>
    <div class="content-body">
      <a-row :gutter="16">
        <a-col :span="10">
          <a-card title="弹簧参数" size="small">
            <a-form layout="vertical">
              <a-form-item label="线径 d (mm)"><a-input-number v-model:value="params.wireDiameter" :min="0.1" style="width:100%"/></a-form-item>
              <a-form-item label="中径 D (mm)"><a-input-number v-model:value="params.meanDiameter" :min="1" style="width:100%"/></a-form-item>
              <a-form-item label="有效圈数 n"><a-input-number v-model:value="params.activeCoils" :min="1" :step="0.5" style="width:100%"/></a-form-item>
              <a-form-item label="剪切模量 G (MPa)"><a-input-number v-model:value="params.shearModulus" style="width:100%"/><div style="font-size:11px;color:#888">钢 ≈ 79000</div></a-form-item>
              <a-form-item label="工作载荷 F (N)"><a-input-number v-model:value="params.load" :min="0" style="width:100%"/></a-form-item>
              <a-divider>失稳校核 (Section 10.5)</a-divider>
              <a-form-item label="自由长度 L0 (mm)"><a-input-number v-model:value="params.freeLength" :min="10" style="width:100%"/></a-form-item>
              <a-form-item label="端部约束">
                <a-select v-model:value="params.endCondition" style="width:100%">
                  <a-select-option value="fixed-fixed">两端固定</a-select-option>
                  <a-select-option value="fixed-hinged">一端固定一端铰接</a-select-option>
                  <a-select-option value="hinged-hinged">两端铰接</a-select-option>
                  <a-select-option value="fixed-free">一端固定一端自由</a-select-option>
                </a-select>
              </a-form-item>
            </a-form>
          </a-card>
        </a-col>
        <a-col :span="14">
          <a-card title="计算结果" size="small">
            <a-descriptions bordered size="small" :column="2">
              <a-descriptions-item label="弹簧刚度">{{ result.value.springRate.toFixed(2) }} N/mm</a-descriptions-item>
              <a-descriptions-item label="弹簧指数 C">{{ result.value.springIndex.toFixed(2) }}</a-descriptions-item>
              <a-descriptions-item label="变形量">{{ result.value.deflection.toFixed(3) }} mm</a-descriptions-item>
              <a-descriptions-item label="切应力">{{ result.value.shearStress.toFixed(1) }} MPa</a-descriptions-item>
              <a-descriptions-item label="曲度系数 K">{{ result.value.curvatureFactor.toFixed(3) }}</a-descriptions-item>
              <a-descriptions-item label="并紧长度">{{ result.value.solidLength.toFixed(1) }} mm</a-descriptions-item>
              <a-descriptions-item label="固有频率">{{ result.value.naturalFreq.toFixed(0) }} Hz</a-descriptions-item>
              <a-descriptions-item label="载荷等级">{{ getSpringColorGrade(result.value.springRate, result.value.deflection) }}</a-descriptions-item>
            </a-descriptions>
            <a-alert v-for="(w,i) in result.value.warnings" :key="i" :message="w.message" :type="w.level==='error'?'error':w.level==='warning'?'warning':'info'" show-icon style="margin-top:12px"/>
            
            <a-divider>失稳校核结果 (Haringx 理论)</a-divider>
            <a-descriptions bordered size="small" :column="2">
              <a-descriptions-item label="临界长度 Lcr">
                <a-tag :color="bucklingResult.safetyFactor >= 1.5 ? 'green' : 'red'">{{ bucklingResult.criticalLength.toFixed(1) }} mm</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="失稳安全系数">
                <a-tag :color="bucklingResult.safetyFactor >= 1.5 ? 'green' : bucklingResult.safetyFactor >= 1.0 ? 'orange' : 'red'">{{ bucklingResult.safetyFactor.toFixed(2) }}</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="允许最大压缩量">{{ bucklingResult.maxDeflection.toFixed(2) }} mm</a-descriptions-item>
            </a-descriptions>
            <a-alert v-for="(w,i) in bucklingResult.warnings" :key="i" :message="w.message" :description="w.suggestion" :type="w.level==='error'?'error':'warning'" show-icon style="margin-top:12px"/>
            
            <div style="margin-top:16px;padding:12px;background:#f0f7ff;border-radius:4px">
              <strong>计算公式：</strong>
              <div>k = Gd⁴ / (8D³n)</div>
              <div>δ = F / k</div>
              <div>τ = 8FDK / (πd³)</div>
              <div>Lcr ≈ 2.63 * D / μ (Haringx)</div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.springs-page{max-width:1200px;margin:0 auto}
.toolbar{background:#004d40;padding:6px 16px;display:flex;justify-content:space-between;align-items:center;color:white;border-radius:4px;margin-bottom:16px}
.brand{font-weight:bold;font-size:16px;letter-spacing:1px}.brand small{font-weight:normal;font-size:10px;opacity:.8;margin-left:8px}
.content-body{background:#fff;border-radius:8px;padding:16px}
</style>
