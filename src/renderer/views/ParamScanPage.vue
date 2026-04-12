<script setup lang="ts">
/**
 * ParamScanPage.vue - 参数扫描与敏感度分析页面
 * Section 5.1: 集成 ECharts 绘制专业工程图表
 */
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ScanOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import * as echarts from 'echarts'
import { bearingLifeScan, sensitivityAnalysis, type ScanResult } from '../engine/param-scan'

const scanType = ref<'bearing-life' | 'bolt-strength'>('bearing-life')
const isRunning = ref(false)
const scanResult = ref<any>(null)
const sensitivityResult = ref<Record<string, Record<string, number>> | null>(null)
const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// Section 8.2: Fix Memory Leak - Resize Listener
const handleResize = () => chartInstance?.resize()

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

// 轴承寿命扫描参数
const bearingScan = ref({
  C_r: 14.0,
  loadMin: 1.0,
  loadMax: 10.0,
  loadSteps: 20,
  speedMin: 500,
  speedMax: 5000,
  speedSteps: 20,
})

function runBearingLifeScan() {
  isRunning.value = true
  scanResult.value = bearingLifeScan(
    { min: bearingScan.value.loadMin, max: bearingScan.value.loadMax, steps: bearingScan.value.loadSteps },
    { min: bearingScan.value.speedMin, max: bearingScan.value.speedMax, steps: bearingScan.value.speedSteps },
    bearingScan.value.C_r
  )
  isRunning.value = false
  nextTick(() => renderHeatmap())
}

function runSensitivityAnalysis() {
  const baseParams = { Fr: 2.0, Fa: 0.5, X: 0.56, Y: 1.5, speed: 1500, C_r: 14.0 }
  sensitivityResult.value = sensitivityAnalysis(
    baseParams, ['Fr', 'Fa', 'speed', 'C_r'], 0.01,
    (params) => {
      const P = params.X * params.Fr + params.Y * params.Fa
      const L10 = Math.pow(params.C_r / P, 3)
      const L10h = (1000000 / (60 * params.speed)) * L10
      return { L10h }
    }
  )
  nextTick(() => renderSensitivityChart())
}

function renderHeatmap() {
  if (!chartRef.value || !scanResult.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)
  
  const result = scanResult.value
  const min = Math.min(...result.matrix.flat())
  const max = Math.max(...result.matrix.flat())
  
  const data: [number, number, number][] = []
  for (let i = 0; i < result.matrix.length; i++) {
    for (let j = 0; j < result.matrix[i].length; j++) {
      data.push([result.speedValues[j], result.loadValues[i], result.matrix[i][j]])
    }
  }
  
  chartInstance.setOption({
    title: { text: '轴承寿命云图 L10h (小时)', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { formatter: (p: any) => `载荷: ${p.value[1].toFixed(1)} kN<br/>转速: ${p.value[0].toFixed(0)} rpm<br/>寿命: ${p.value[2].toFixed(0)} h` },
    grid: { left: 60, right: 40, bottom: 50, top: 40 },
    xAxis: { name: '转速 (rpm)', type: 'value', min: result.speedValues[0], max: result.speedValues[result.speedValues.length - 1], splitLine: { show: false } },
    yAxis: { name: '载荷 (kN)', type: 'value', min: result.loadValues[0], max: result.loadValues[result.loadValues.length - 1], splitLine: { show: false } },
    visualMap: { min, max, calculable: true, orient: 'vertical', right: 10, top: 'center', inRange: { color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'] } },
    series: [{ type: 'scatter', data, symbolSize: 8, itemStyle: { opacity: 0.9 } }]
  })
}

function renderSensitivityChart() {
  if (!chartRef.value || !sensitivityResult.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)
  
  const sens = sensitivityResult.value
  const params = Object.keys(sens)
  const values = params.map(p => sens[p].L10h || 0)
  
  chartInstance.setOption({
    title: { text: '参数敏感度分析 (L10h)', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { formatter: (p: any) => `${p.name}: ${p.value.toFixed(3)}` },
    grid: { left: 80, right: 40, bottom: 50 },
    xAxis: { type: 'value', name: '敏感系数' },
    yAxis: { type: 'category', data: params, axisLabel: { fontSize: 12 } },
    series: [{
      type: 'bar',
      data: values.map((v, i) => ({
        value: v,
        itemStyle: { color: Math.abs(v) > 2 ? '#ef4444' : Math.abs(v) > 1 ? '#f59e0b' : '#22c55e' }
      }))
    }]
  })
}

function exportToCSV() {
  if (!scanResult.value) return
  let csv = '载荷 (kN)\\转速 (rpm),' + scanResult.value.speedValues.map((v: number) => v.toFixed(0)).join(',') + '\n'
  for (let i = 0; i < scanResult.value.loadValues.length; i++) {
    csv += scanResult.value.loadValues[i].toFixed(1) + ',' + scanResult.value.matrix[i].map((v: number) => v.toFixed(0)).join(',') + '\n'
  }
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bearing-life-scan-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

window.addEventListener('resize', () => chartInstance?.resize())
</script>

<template>
  <div class="param-scan-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>参数扫描与敏感度分析 (ECharts)</small></div>
      <a-space>
        <a-button size="small" type="primary" @click="runBearingLifeScan" :loading="isRunning"><template #icon><ScanOutlined /></template>运行轴承寿命扫描</a-button>
        <a-button size="small" type="primary" @click="runSensitivityAnalysis">运行敏感度分析</a-button>
        <a-button size="small" @click="exportToCSV" :disabled="!scanResult"><template #icon><DownloadOutlined /></template>导出CSV</a-button>
      </a-space>
    </div>

    <div class="content-body">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-card title="扫描参数设置" size="small">
            <a-form layout="vertical">
              <a-form-item label="额定动载荷 Cr (kN)"><a-input-number v-model:value="bearingScan.C_r" style="width:100%" :min="1" :max="100"/></a-form-item>
              <a-divider>载荷范围 (kN)</a-divider>
              <a-row :gutter="8">
                <a-col :span="12"><a-form-item label="最小值"><a-input-number v-model:value="bearingScan.loadMin" style="width:100%" :min="0"/></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="最大值"><a-input-number v-model:value="bearingScan.loadMax" style="width:100%" :min="0"/></a-form-item></a-col>
                <a-col :span="24"><a-form-item label="步数"><a-input-number v-model:value="bearingScan.loadSteps" style="width:100%" :min="5" :max="50"/></a-form-item></a-col>
              </a-row>
              <a-divider>转速范围 (rpm)</a-divider>
              <a-row :gutter="8">
                <a-col :span="12"><a-form-item label="最小值"><a-input-number v-model:value="bearingScan.speedMin" style="width:100%" :min="0"/></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="最大值"><a-input-number v-model:value="bearingScan.speedMax" style="width:100%" :min="0"/></a-form-item></a-col>
                <a-col :span="24"><a-form-item label="步数"><a-input-number v-model:value="bearingScan.speedSteps" style="width:100%" :min="5" :max="50"/></a-form-item></a-col>
              </a-row>
            </a-form>
          </a-card>
        </a-col>

        <a-col :span="16">
          <a-card title="寿命云图" size="small">
            <div ref="chartRef" style="width: 100%; height: 450px"></div>
          </a-card>

          <a-card title="敏感度分析" size="small" style="margin-top: 16px" v-if="sensitivityResult">
            <div ref="chartRef" style="width: 100%; height: 300px"></div>
          </a-card>

          <a-empty v-if="!scanResult && !sensitivityResult" description="请设置参数后点击运行扫描"/>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.param-scan-page{max-width:1400px;margin:0 auto}
.toolbar{background:#004d40;padding:6px 16px;display:flex;justify-content:space-between;align-items:center;color:white;border-radius:4px;margin-bottom:16px}
.brand{font-weight:bold;font-size:16px;letter-spacing:1px}.brand small{font-weight:normal;font-size:10px;opacity:.8;margin-left:8px}
.content-body{background:#fff;border-radius:8px;padding:16px}
</style>
