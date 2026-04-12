<script setup lang="ts">
/**
 * GearsPage.vue - 齿轮计算页面
 * 渐开线圆柱齿轮几何计算
 */
import { ref, computed } from 'vue'
import { calcGearGeometry, recommendModule, standardModules } from '@renderer/engine/gears/geometry'
import { FilePdfOutlined } from '@ant-design/icons-vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const params = ref({
  module: 2,
  teeth1: 20,
  teeth2: 40,
  pressureAngle: 20,
  helixAngle: 0,
  x1: 0,
  x2: 0,
  faceWidth: 20
})

const result = computed(() => calcGearGeometry(params.value))

function recommend() {
  const a = params.value.module * (params.value.teeth1 + params.value.teeth2) / 2
  params.value.module = recommendModule(a)
}

async function exportPDF() {
  const el = document.querySelector('.gears-page') as HTMLElement
  if (!el) return
  const canvas = await html2canvas(el, { scale: 2 })
  const img = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  pdf.addImage(img, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), canvas.height * pdf.internal.pageSize.getWidth() / canvas.width)
  pdf.save(`gear-${params.value.teeth1}x${params.value.teeth2}-${Date.now()}.pdf`)
}
</script>

<template>
  <div class="gears-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>齿轮计算</small></div>
      <a-space>
        <a-button size="small" @click="recommend">推荐模数</a-button>
        <a-button size="small" type="primary" @click="exportPDF"><template #icon><FilePdfOutlined /></template>导出PDF</a-button>
      </a-space>
    </div>
    <div class="content-body">
      <a-row :gutter="16">
        <a-col :span="10">
          <a-card title="齿轮参数" size="small">
            <a-form layout="vertical">
              <a-form-item label="模数 m (mm)">
                <a-select v-model:value="params.module">
                  <a-select-option v-for="m in standardModules" :key="m" :value="m">{{ m }}</a-select-option>
                </a-select>
              </a-form-item>
              <a-row :gutter="8">
                <a-col :span="12"><a-form-item label="小齿轮齿数 z1"><a-input-number v-model:value="params.teeth1" :min="10" style="width:100%"/></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="大齿轮齿数 z2"><a-input-number v-model:value="params.teeth2" :min="10" style="width:100%"/></a-form-item></a-col>
              </a-row>
              <a-form-item label="压力角 α (°)">
                <a-select v-model:value="params.pressureAngle"><a-select-option :value="20">20° (标准)</a-select-option><a-select-option :value="25">25°</a-select-option></a-select>
              </a-form-item>
              <a-form-item label="螺旋角 β (°)"><a-input-number v-model:value="params.helixAngle" :min="0" :max="45" style="width:100%"/></a-form-item>
              <a-row :gutter="8">
                <a-col :span="12"><a-form-item label="小齿轮变位 x1"><a-input-number v-model:value="params.x1" :step="0.1" style="width:100%"/></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="大齿轮变位 x2"><a-input-number v-model:value="params.x2" :step="0.1" style="width:100%"/></a-form-item></a-col>
              </a-row>
              <a-form-item label="齿宽 b (mm)"><a-input-number v-model:value="params.faceWidth" :min="1" style="width:100%"/></a-form-item>
            </a-form>
          </a-card>
        </a-col>
        <a-col :span="14">
          <a-card title="几何计算结果" size="small">
            <a-descriptions bordered size="small" :column="2">
              <a-descriptions-item label="分度圆 d1">{{ result.value.d1.toFixed(3) }} mm</a-descriptions-item>
              <a-descriptions-item label="分度圆 d2">{{ result.value.d2.toFixed(3) }} mm</a-descriptions-item>
              <a-descriptions-item label="齿顶圆 da1">{{ result.value.da1.toFixed(3) }} mm</a-descriptions-item>
              <a-descriptions-item label="齿顶圆 da2">{{ result.value.da2.toFixed(3) }} mm</a-descriptions-item>
              <a-descriptions-item label="齿根圆 df1">{{ result.value.df1.toFixed(3) }} mm</a-descriptions-item>
              <a-descriptions-item label="齿根圆 df2">{{ result.value.df2.toFixed(3) }} mm</a-descriptions-item>
              <a-descriptions-item label="基圆 db1">{{ result.value.db1.toFixed(3) }} mm</a-descriptions-item>
              <a-descriptions-item label="基圆 db2">{{ result.value.db2.toFixed(3) }} mm</a-descriptions-item>
              <a-descriptions-item label="中心距 a">{{ result.value.centerDistance.toFixed(3) }} mm</a-descriptions-item>
              <a-descriptions-item label="重合度 ε">{{ result.value.contactRatio.toFixed(3) }}</a-descriptions-item>
            </a-descriptions>
            <a-alert v-for="(w,i) in result.value.warnings" :key="i" :message="w.message" :type="w.level==='error'?'error':w.level==='warning'?'warning':'info'" show-icon style="margin-top:12px"/>
            <div style="margin-top:16px;padding:12px;background:#f0f7ff;border-radius:4px">
              <strong>计算公式：</strong>
              <div>d = m × z / cos(β)</div>
              <div>da = d + 2m(ha*+x)</div>
              <div>df = d - 2m(ha*+c*-x)</div>
              <div>a = (d1+d2) / 2</div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.gears-page{max-width:1200px;margin:0 auto}
.toolbar{background:#004d40;padding:6px 16px;display:flex;justify-content:space-between;align-items:center;color:white;border-radius:4px;margin-bottom:16px}
.brand{font-weight:bold;font-size:16px;letter-spacing:1px}.brand small{font-weight:normal;font-size:10px;opacity:.8;margin-left:8px}
.content-body{background:#fff;border-radius:8px;padding:16px}
</style>
