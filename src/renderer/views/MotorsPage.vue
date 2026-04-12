<script setup lang="ts">
/**
 * MotorsPage.vue - 电机选型页面
 */
import { ref, computed } from 'vue'
import { calcMotorSelection } from '@renderer/engine/motors/selection'
import { FilePdfOutlined } from '@ant-design/icons-vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const params = ref({ loadForce: 10, speed: 1500, inertia: 0.001, acceleration: 100, efficiency: 0.9, safetyFactor: 1.5 })
const result = computed(() => calcMotorSelection(params.value))

async function exportPDF() {
  const el = document.querySelector('.motors-page') as HTMLElement
  if (!el) return
  const c = await html2canvas(el, { scale: 2 })
  const pdf = new jsPDF('p','mm','a4')
  pdf.addImage(c.toDataURL('image/png'),'PNG',0,0,pdf.internal.pageSize.getWidth(),c.height*pdf.internal.pageSize.getWidth()/c.width)
  pdf.save(`motor-${Date.now()}.pdf`)
}
</script>

<template>
  <div class="motors-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>电机选型</small></div>
      <a-button size="small" type="primary" @click="exportPDF"><template #icon><FilePdfOutlined /></template>导出PDF</a-button>
    </div>
    <div class="content-body">
      <a-row :gutter="16">
        <a-col :span="10">
          <a-card title="负载参数" size="small">
            <a-form layout="vertical">
              <a-form-item label="负载扭矩 (N·m)"><a-input-number v-model:value="params.loadForce" :min="0" style="width:100%"/></a-form-item>
              <a-form-item label="转速 (rpm)"><a-input-number v-model:value="params.speed" :min="0" style="width:100%"/></a-form-item>
              <a-form-item label="负载惯量 (kg·m²)"><a-input-number v-model:value="params.inertia" :min="0" :step="0.001" style="width:100%"/></a-form-item>
              <a-form-item label="加速度 (rad/s²)"><a-input-number v-model:value="params.acceleration" :min="0" style="width:100%"/></a-form-item>
              <a-form-item label="传动效率"><a-input-number v-model:value="params.efficiency" :min="0.5" :max="1" :step="0.05" style="width:100%"/></a-form-item>
              <a-form-item label="安全系数"><a-input-number v-model:value="params.safetyFactor" :min="1" :max="3" :step="0.1" style="width:100%"/></a-form-item>
            </a-form>
          </a-card>
        </a-col>
        <a-col :span="14">
          <a-card title="选型结果" size="small">
            <a-descriptions bordered size="small" :column="2">
              <a-descriptions-item label="所需扭矩">{{ result.value.requiredTorque.toFixed(2) }} N·m</a-descriptions-item>
              <a-descriptions-item label="所需功率">{{ result.value.requiredPower.toFixed(3) }} kW</a-descriptions-item>
              <a-descriptions-item label="峰值扭矩">{{ result.value.peakTorque.toFixed(2) }} N·m</a-descriptions-item>
              <a-descriptions-item label="均方根扭矩">{{ result.value.rmsTorque.toFixed(2) }} N·m</a-descriptions-item>
              <a-descriptions-item label="惯量比">
                <a-tag :color="result.value.inertiaRatio>10?'red':result.value.inertiaRatio>3?'orange':'green'">{{ result.value.inertiaRatio.toFixed(1) }}</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="推荐电机功率"><strong>{{ result.value.recommendedMotorPower.toFixed(2) }} kW</strong></a-descriptions-item>
            </a-descriptions>
            <a-alert v-for="(w,i) in result.value.warnings" :key="i" :message="w.message" :type="w.level==='error'?'error':w.level==='warning'?'warning':'info'" show-icon style="margin-top:12px"/>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.motors-page{max-width:1200px;margin:0 auto}
.toolbar{background:#004d40;padding:6px 16px;display:flex;justify-content:space-between;align-items:center;color:white;border-radius:4px;margin-bottom:16px}
.brand{font-weight:bold;font-size:16px;letter-spacing:1px}.brand small{font-weight:normal;font-size:10px;opacity:.8;margin-left:8px}
.content-body{background:#fff;border-radius:8px;padding:16px}
</style>
