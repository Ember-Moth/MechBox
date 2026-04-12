<script setup lang="ts">
/**
 * ParamScanPage - 参数扫描与敏感度分析页面
 * DOE (Design of Experiments) 参数优化
 * Section 5.1
 */
import { ref, computed } from 'vue'
import { ScanOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { bearingLifeScan, sensitivityAnalysis } from '../engine/param-scan'

const scanType = ref<'bearing-life' | 'bolt-strength'>('bearing-life')

// 轴承寿命扫描参数
const bearingScan = ref({
  C_r: 14.0,          // 额定动载荷 kN
  loadMin: 1.0,       // 最小载荷 kN
  loadMax: 10.0,      // 最大载荷 kN
  loadSteps: 20,
  speedMin: 500,      // 最小转速 rpm
  speedMax: 5000,     // 最大转速 rpm
  speedSteps: 20,
})

// 扫描结果
const scanResult = ref<{
  matrix: number[][]
  loadValues: number[]
  speedValues: number[]
} | null>(null)

// 敏感度分析结果
const sensitivityResult = ref<Record<string, Record<string, number>> | null>(null)

function runBearingLifeScan() {
  const result = bearingLifeScan(
    { min: bearingScan.value.loadMin, max: bearingScan.value.loadMax, steps: bearingScan.value.loadSteps },
    { min: bearingScan.value.speedMin, max: bearingScan.value.speedMax, steps: bearingScan.value.speedSteps },
    bearingScan.value.C_r
  )
  scanResult.value = result
}

function runSensitivityAnalysis() {
  const baseParams = {
    Fr: 2.0,
    Fa: 0.5,
    X: 0.56,
    Y: 1.5,
    speed: 1500,
    C_r: 14.0,
  }
  
  const result = sensitivityAnalysis(
    baseParams,
    ['Fr', 'Fa', 'speed', 'C_r'],
    0.01,
    (params) => {
      const P = params.X * params.Fr + params.Y * params.Fa
      const L10 = Math.pow(params.C_r / P, 3)
      const L10h = (1000000 / (60 * params.speed)) * L10
      return { L10h }
    }
  )
  
  sensitivityResult.value = result
}

function exportToCSV() {
  if (!scanResult.value) return
  
  let csv = '载荷 (kN)\\转速 (rpm),'
  csv += scanResult.value.speedValues.map(v => v.toFixed(0)).join(',') + '\n'
  
  for (let i = 0; i < scanResult.value.loadValues.length; i++) {
    csv += scanResult.value.loadValues[i].toFixed(1) + ','
    csv += scanResult.value.matrix[i].map(v => v.toFixed(0)).join(',') + '\n'
  }
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bearing-life-scan-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// 简单热力图渲染
function getHeatColor(value: number, min: number, max: number): string {
  if (max === min) return '#e0f2f1'
  const ratio = (value - min) / (max - min)
  const r = Math.round(255 * (1 - ratio))
  const g = Math.round(255 * ratio)
  const b = Math.round(200 * ratio)
  return `rgb(${r}, ${g}, ${b})`
}
</script>

<template>
  <div class="param-scan-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>参数扫描与敏感度分析</small></div>
      <a-space>
        <a-button size="small" type="primary" @click="runBearingLifeScan">
          <template #icon><ScanOutlined /></template>运行轴承寿命扫描
        </a-button>
        <a-button size="small" type="primary" @click="runSensitivityAnalysis">
          运行敏感度分析
        </a-button>
        <a-button size="small" @click="exportToCSV" :disabled="!scanResult">
          <template #icon><DownloadOutlined /></template>导出CSV
        </a-button>
      </a-space>
    </div>

    <div class="content-body">
      <a-row :gutter="16">
        <!-- 左侧：参数设置 -->
        <a-col :span="8">
          <a-card title="扫描参数设置" size="small">
            <a-form layout="vertical">
              <a-form-item label="扫描类型">
                <a-select v-model:value="scanType" style="width: 100%">
                  <a-select-option value="bearing-life">轴承寿命 (载荷×转速)</a-select-option>
                </a-select>
              </a-form-item>

              <a-divider>轴承参数</a-divider>
              <a-form-item label="额定动载荷 Cr (kN)">
                <a-input-number v-model:value="bearingScan.C_r" style="width: 100%" :min="1" :max="100" />
              </a-form-item>

              <a-divider>载荷范围 (kN)</a-divider>
              <a-row :gutter="8">
                <a-col :span="12">
                  <a-form-item label="最小值">
                    <a-input-number v-model:value="bearingScan.loadMin" style="width: 100%" :min="0" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="最大值">
                    <a-input-number v-model:value="bearingScan.loadMax" style="width: 100%" :min="0" />
                  </a-form-item>
                </a-col>
                <a-col :span="24">
                  <a-form-item label="扫描步数">
                    <a-input-number v-model:value="bearingScan.loadSteps" style="width: 100%" :min="5" :max="50" />
                  </a-form-item>
                </a-col>
              </a-row>

              <a-divider>转速范围 (rpm)</a-divider>
              <a-row :gutter="8">
                <a-col :span="12">
                  <a-form-item label="最小值">
                    <a-input-number v-model:value="bearingScan.speedMin" style="width: 100%" :min="0" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="最大值">
                    <a-input-number v-model:value="bearingScan.speedMax" style="width: 100%" :min="0" />
                  </a-form-item>
                </a-col>
                <a-col :span="24">
                  <a-form-item label="扫描步数">
                    <a-input-number v-model:value="bearingScan.speedSteps" style="width: 100%" :min="5" :max="50" />
                  </a-form-item>
                </a-col>
              </a-row>
            </a-form>
          </a-card>
        </a-col>

        <!-- 右侧：结果展示 -->
        <a-col :span="16">
          <a-card title="寿命云图 (L10h 小时)" size="small" v-if="scanResult">
            <div class="heatmap-container">
              <div class="heatmap">
                <div 
                  v-for="(row, i) in scanResult.matrix" 
                  :key="i" 
                  class="heatmap-row"
                >
                  <div class="heatmap-label">{{ scanResult.loadValues[i].toFixed(1) }}</div>
                  <div 
                    v-for="(val, j) in row" 
                    :key="j"
                    class="heatmap-cell"
                    :style="{ backgroundColor: getHeatColor(val, Math.min(...scanResult!.matrix.flat()), Math.max(...scanResult!.matrix.flat())) }"
                    :title="`载荷: ${scanResult.loadValues[i].toFixed(1)} kN\n转速: ${scanResult.speedValues[j].toFixed(0)} rpm\n寿命: ${val.toFixed(0)} h`"
                  >
                    {{ val.toFixed(0) }}
                  </div>
                </div>
                <div class="heatmap-x-label">
                  <div v-for="(val, j) in scanResult.speedValues" :key="j" class="x-label-cell">
                    {{ val.toFixed(0) }}
                  </div>
                </div>
              </div>
              <div class="heatmap-y-label">载荷 (kN)</div>
              <div class="heatmap-x-axis-label">转速 (rpm)</div>
            </div>
          </a-card>

          <a-card title="敏感度分析" size="small" style="margin-top: 16px" v-if="sensitivityResult">
            <a-descriptions bordered size="small" :column="1">
              <a-descriptions-item 
                v-for="(sens, param) in sensitivityResult" 
                :key="param"
                :label="`敏感系数: ${param}`"
              >
                <a-tag :color="Math.abs(sens.L10h) > 2 ? 'red' : (Math.abs(sens.L10h) > 1 ? 'orange' : 'green')">
                  L10h: {{ sens.L10h.toFixed(3) }}
                </a-tag>
                <span class="sensitivity-note">
                  {{ param }} 增加 1%，L10h 变化 {{ sens.L10h.toFixed(2) }}%
                </span>
              </a-descriptions-item>
            </a-descriptions>
            <a-alert
              message="敏感度系数说明"
              description="敏感系数表示参数变化 1% 时输出变量的变化百分比。绝对值越大表示该参数对结果影响越显著。"
              type="info"
              style="margin-top: 12px"
            />
          </a-card>

          <a-empty v-if="!scanResult && !sensitivityResult" description="请设置参数后点击运行扫描" />
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.param-scan-page {
  max-width: 1400px;
  margin: 0 auto;
}

.toolbar {
  background: #004d40;
  padding: 6px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  border-radius: 4px;
  margin-bottom: 16px;
}

.brand {
  font-weight: bold;
  font-size: 16px;
  letter-spacing: 1px;
}

.brand small {
  font-weight: normal;
  font-size: 10px;
  opacity: 0.8;
  margin-left: 8px;
}

.content-body {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.heatmap-container {
  position: relative;
  padding: 20px 0 30px 50px;
}

.heatmap {
  display: inline-block;
}

.heatmap-row {
  display: flex;
  align-items: center;
}

.heatmap-label {
  width: 45px;
  text-align: right;
  font-size: 11px;
  padding-right: 6px;
  color: #64748b;
}

.heatmap-cell {
  width: 60px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-family: monospace;
  border: 1px solid #e2e8f0;
  cursor: help;
}

.heatmap-y-label {
  position: absolute;
  left: 0;
  top: 50%;
  transform: rotate(-90deg) translateX(-50%);
  transform-origin: 0 0;
  font-size: 12px;
  color: #64748b;
}

.heatmap-x-axis-label {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #64748b;
}

.heatmap-x-label {
  display: flex;
  margin-left: 45px;
}

.x-label-cell {
  width: 60px;
  text-align: center;
  font-size: 10px;
  color: #64748b;
}

.sensitivity-note {
  font-size: 12px;
  color: #64748b;
  margin-left: 8px;
}
</style>
