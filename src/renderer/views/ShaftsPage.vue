<script setup lang="ts">
/**
 * ShaftsPage.vue - 轴强度校核页面
 */
import { ref, computed } from 'vue'
import { calcShaftStrength } from '@renderer/engine/shafts/strength'
import { calcShaftFatigue, ShaftFatigueParams } from '@renderer/engine/shafts/fatigue'
import { FilePdfOutlined } from '@ant-design/icons-vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const params = ref({ 
  diameter: 30, length: 200, bendingMoment: 50000, torque: 30000, axialForce: 0, materialYield: 355, supportType: 'simply' as const 
})
const fatigueParams = ref<ShaftFatigueParams>({
  alternatingStress: 100, meanStress: 50, enduranceLimit: 200, yieldStrength: 355, ultimateStrength: 500, criterion: 'goodman'
})
const result = computed(() => calcShaftStrength(params.value))
const fatigueResult = computed(() => calcShaftFatigue(fatigueParams.value))

async function exportPDF() {
  const el = document.querySelector('.shafts-page') as HTMLElement
  if (!el) return
  const c = await html2canvas(el, { scale: 2 })
  const pdf = new jsPDF('p','mm','a4')
  pdf.addImage(c.toDataURL('image/png'),'PNG',0,0,pdf.internal.pageSize.getWidth(),c.height*pdf.internal.pageSize.getWidth()/c.width)
  pdf.save(`shaft-${params.value.diameter}-${Date.now()}.pdf`)
}
</script>

<template>
  <div class="shafts-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>轴强度校核</small></div>
      <a-button size="small" type="primary" @click="exportPDF"><template #icon><FilePdfOutlined /></template>导出PDF</a-button>
    </div>
    <div class="content-body">
      <a-row :gutter="16">
        <a-col :span="10">
          <a-card title="轴参数" size="small">
            <a-form layout="vertical">
              <a-form-item label="轴径 d (mm)"><a-input-number v-model:value="params.diameter" :min="5" style="width:100%"/></a-form-item>
              <a-form-item label="跨度 L (mm)"><a-input-number v-model:value="params.length" :min="10" style="width:100%"/></a-form-item>
              <a-form-item label="弯矩 M_b (N·mm)"><a-input-number v-model:value="params.bendingMoment" :min="0" style="width:100%"/></a-form-item>
              <a-form-item label="扭矩 T (N·mm)"><a-input-number v-model:value="params.torque" :min="0" style="width:100%"/></a-form-item>
              <a-form-item label="轴向力 (N)"><a-input-number v-model:value="params.axialForce" :min="0" style="width:100%"/></a-form-item>
              <a-form-item label="材料屈服强度 (MPa)">
                <a-select v-model:value="params.materialYield">
                  <a-select-option :value="235">Q235 (235 MPa)</a-select-option>
                  <a-select-option :value="355">45# (355 MPa)</a-select-option>
                  <a-select-option :value="785">40Cr (785 MPa)</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="支承类型">
                <a-select v-model:value="params.supportType">
                  <a-select-option value="simply">简支梁</a-select-option>
                  <a-select-option value="cantilever">悬臂梁</a-select-option>
                  <a-select-option value="fixed">固支梁</a-select-option>
                </a-select>
              </a-form-item>
              <a-divider>疲劳强度准则 (Section 10.5)</a-divider>
              <a-row :gutter="8">
                <a-col :span="12"><a-form-item label="交变应力 σ_a (MPa)"><a-input-number v-model:value="fatigueParams.alternatingStress" :min="0" style="width:100%"/></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="平均应力 σ_m (MPa)"><a-input-number v-model:value="fatigueParams.meanStress" :min="0" style="width:100%"/></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="疲劳极限 S_e (MPa)"><a-input-number v-model:value="fatigueParams.enduranceLimit" :min="0" style="width:100%"/></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="抗拉强度 S_u (MPa)"><a-input-number v-model:value="fatigueParams.ultimateStrength" :min="0" style="width:100%"/></a-form-item></a-col>
                <a-col :span="24"><a-form-item label="计算准则">
                  <a-radio-group v-model:value="fatigueParams.criterion">
                    <a-radio value="goodman">Goodman (标准)</a-radio>
                    <a-radio value="soderberg">Soderberg (保守)</a-radio>
                  </a-radio-group>
                </a-form-item></a-col>
              </a-row>
            </a-form>
          </a-card>
        </a-col>
        <a-col :span="14">
          <a-card title="静强度校核" size="small">
            <a-descriptions bordered size="small" :column="2">
              <a-descriptions-item label="弯曲应力">{{ result.value.bendingStress.toFixed(1) }} MPa</a-descriptions-item>
              <a-descriptions-item label="扭转应力">{{ result.value.torsionalStress.toFixed(1) }} MPa</a-descriptions-item>
              <a-descriptions-item label="von Mises 应力">
                <a-tag :color="result.value.vonMisesStress>params.materialYield?'red':'green'">{{ result.value.vonMisesStress.toFixed(1) }} MPa</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="安全系数">
                <a-tag :color="result.value.safetyFactor<1.5?'red':result.value.safetyFactor<2?'orange':'green'">{{ result.value.safetyFactor.toFixed(2) }}</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="最大挠度">{{ result.value.deflection.toFixed(4) }} mm</a-descriptions-item>
              <a-descriptions-item label="临界转速">{{ result.value.criticalSpeed.toFixed(0) }} rpm</a-descriptions-item>
            </a-descriptions>
            <a-alert v-for="(w,i) in result.value.warnings" :key="i" :message="w.message" :type="w.level==='error'?'error':w.level==='warning'?'warning':'info'" show-icon style="margin-top:12px"/>
          </a-card>

          <a-card title="疲劳强度校核 ({{ fatigueResult.criterion }})" size="small" style="margin-top:16px">
            <a-descriptions bordered size="small" :column="2">
              <a-descriptions-item label="疲劳安全系数 n">
                <a-tag :color="fatigueResult.fatigueSafetyFactor >= 2.5 ? 'green' : fatigueResult.fatigueSafetyFactor >= 1.5 ? 'orange' : 'red'">
                  {{ fatigueResult.fatigueSafetyFactor.toFixed(2) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="静态屈服安全系数">
                <a-tag :color="fatigueResult.staticYieldSF >= 1.5 ? 'green' : 'red'">
                  {{ fatigueResult.staticYieldSF.toFixed(2) }}
                </a-tag>
              </a-descriptions-item>
            </a-descriptions>
            <a-alert v-for="(w,i) in fatigueResult.warnings" :key="i" :message="w.message" :description="w.suggestion" :type="w.level==='error'?'error':w.level==='warning'?'warning':'info'" show-icon style="margin-top:12px"/>
            <div style="margin-top:16px;padding:12px;background:#f0f7ff;border-radius:4px">
              <strong>校核公式 ({{ fatigueResult.criterion }})：</strong>
              <div v-if="fatigueParams.criterion === 'goodman'">σ_a/S_e + σ_m/S_u = 1/n</div>
              <div v-else>σ_a/S_e + σ_m/S_y = 1/n</div>
              <div>σ_eq = √(σ² + 3τ²) ≤ σ_s / S</div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.shafts-page{max-width:1200px;margin:0 auto}
.toolbar{background:#004d40;padding:6px 16px;display:flex;justify-content:space-between;align-items:center;color:white;border-radius:4px;margin-bottom:16px}
.brand{font-weight:bold;font-size:16px;letter-spacing:1px}.brand small{font-weight:normal;font-size:10px;opacity:.8;margin-left:8px}
.content-body{background:#fff;border-radius:8px;padding:16px}
</style>
