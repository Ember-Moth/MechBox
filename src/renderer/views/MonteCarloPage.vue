<script setup lang="ts">
/**
 * MonteCarloPage - 蒙特卡洛概率模拟页面
 * 批量生产良品率预测、公差统计分析
 * Section 1.3.2
 */
import { ref, computed } from 'vue'
import { PlayCircleOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { monteCarloSimulate, bearingLifeMonteCarlo, toleranceStackupMonteCarlo } from '../engine/monte-carlo'

const simType = ref<'bearing-life' | 'tolerance-stackup'>('bearing-life')
const isRunning = ref(false)
const simResult = ref<any>(null)

// 轴承寿命模拟参数
const bearingParams = ref({
  nominalLoad: 2.0,
  loadStdDev: 0.3,
  nominalSpeed: 1500,
  speedStdDev: 100,
  C_r: 14.0,
  minLifeHours: 10000,
  numSamples: 100000
})

// 公差堆叠参数
const toleranceStackParams = ref({
  dimensions: [
    { nominal: 50, tolerance: 0.1, name: '轴径' },
    { nominal: 0.05, tolerance: 0.02, name: '轴承间隙' },
    { nominal: -50, tolerance: 0.1, name: '孔径' }
  ],
  numSamples: 100000
})

const histogramData = computed(() => {
  if (!simResult.value?.histogram) return null
  const maxCount = Math.max(...simResult.value.histogram.map((h: any) => h.count))
  return simResult.value.histogram.map((h: any) => ({
    ...h,
    height: (h.count / maxCount) * 100
  }))
})

function runSimulation() {
  isRunning.value = true
  
  setTimeout(() => {
    if (simType.value === 'bearing-life') {
      const p = bearingParams.value
      simResult.value = bearingLifeMonteCarlo(
        p.nominalLoad,
        p.loadStdDev,
        p.nominalSpeed,
        p.speedStdDev,
        p.C_r,
        p.numSamples,
        p.minLifeHours
      )
    } else {
      const dims = toleranceStackParams.value.dimensions.map(d => ({
        nominal: d.nominal,
        tolerance: d.tolerance,
        distribution: 'normal'
      }))
      simResult.value = toleranceStackupMonteCarlo(
        dims,
        toleranceStackParams.value.numSamples,
        { lower: -0.05, upper: 0.05 }
      )
    }
    isRunning.value = false
  }, 100)
}

function exportResults() {
  if (!simResult.value) return
  
  let csv = 'Bin,Count\n'
  simResult.value.histogram.forEach((h: any) => {
    csv += `${h.bin.toFixed(4)},${h.count}\n`
  })
  csv += `\nMean,${simResult.value.mean}\n`
  csv += `StdDev,${simResult.value.stdDev}\n`
  csv += `Yield,${simResult.value.yield}\n`
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `monte-carlo-${simType.value}-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function resetSimulation() {
  simResult.value = null
}
</script>

<template>
  <div class="monte-carlo-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>蒙特卡洛概率模拟</small></div>
      <a-space>
        <a-button size="small" type="primary" @click="runSimulation" :loading="isRunning">
          <template #icon><PlayCircleOutlined /></template>运行模拟
        </a-button>
        <a-button size="small" @click="exportResults" :disabled="!simResult">
          <template #icon><DownloadOutlined /></template>导出结果
        </a-button>
        <a-button size="small" @click="resetSimulation">重置</a-button>
      </a-space>
    </div>

    <div class="content-body">
      <a-row :gutter="16">
        <a-col :span="10">
          <a-card title="模拟参数设置" size="small">
            <a-form layout="vertical">
              <a-form-item label="模拟类型">
                <a-select v-model:value="simType">
                  <a-select-option value="bearing-life">轴承寿命概率分析</a-select-option>
                  <a-select-option value="tolerance-stackup">公差堆叠统计分析</a-select-option>
                </a-select>
              </a-form-item>

              <template v-if="simType === 'bearing-life'">
                <a-divider>载荷分布 (kN)</a-divider>
                <a-row :gutter="8">
                  <a-col :span="12">
                    <a-form-item label="均值">
                      <a-input-number v-model:value="bearingParams.nominalLoad" style="width: 100%" :min="0" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="标准差">
                      <a-input-number v-model:value="bearingParams.loadStdDev" style="width: 100%" :min="0" />
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-divider>转速分布 (rpm)</a-divider>
                <a-row :gutter="8">
                  <a-col :span="12">
                    <a-form-item label="均值">
                      <a-input-number v-model:value="bearingParams.nominalSpeed" style="width: 100%" :min="0" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="标准差">
                      <a-input-number v-model:value="bearingParams.speedStdDev" style="width: 100%" :min="0" />
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-divider>模拟设置</a-divider>
                <a-form-item label="额定动载荷 Cr (kN)">
                  <a-input-number v-model:value="bearingParams.C_r" style="width: 100%" :min="0" />
                </a-form-item>
                <a-form-item label="最低寿命要求 (小时)">
                  <a-input-number v-model:value="bearingParams.minLifeHours" style="width: 100%" :min="0" />
                </a-form-item>
                <a-form-item label="模拟次数">
                  <a-select v-model:value="bearingParams.numSamples" style="width: 100%">
                    <a-select-option :value="10000">10,000 (快速)</a-select-option>
                    <a-select-option :value="100000">100,000 (标准)</a-select-option>
                    <a-select-option :value="1000000">1,000,000 (高精度)</a-select-option>
                  </a-select>
                </a-form-item>
              </template>

              <template v-else>
                <a-divider>尺寸链定义</a-divider>
                <div v-for="(dim, index) in toleranceStackParams.dimensions" :key="index" class="dimension-row">
                  <a-row :gutter="8">
                    <a-col :span="8">
                      <a-input v-model:value="dim.name" size="small" placeholder="名称" />
                    </a-col>
                    <a-col :span="8">
                      <a-input-number v-model:value="dim.nominal" size="small" style="width: 100%" placeholder="名义尺寸" />
                    </a-col>
                    <a-col :span="8">
                      <a-input-number v-model:value="dim.tolerance" size="small" style="width: 100%" placeholder="公差 ±" />
                    </a-col>
                  </a-row>
                </div>
                <a-button size="small" type="dashed" block @click="toleranceStackParams.dimensions.push({ nominal: 0, tolerance: 0.1, name: '新尺寸' })">
                  添加尺寸
                </a-button>
              </template>
            </a-form>
          </a-card>
        </a-col>

        <a-col :span="14">
          <a-empty v-if="!simResult" description="请设置参数后点击运行模拟" />

          <div v-else>
            <a-card title="统计结果" size="small">
              <a-descriptions bordered size="small" :column="2">
                <a-descriptions-item label="均值">{{ simResult.mean.toFixed(2) }}</a-descriptions-item>
                <a-descriptions-item label="标准差">{{ simResult.stdDev.toFixed(4) }}</a-descriptions-item>
                <a-descriptions-item label="最小值">{{ simResult.min.toFixed(2) }}</a-descriptions-item>
                <a-descriptions-item label="最大值">{{ simResult.max.toFixed(2) }}</a-descriptions-item>
                <a-descriptions-item label="5th 百分位">{{ simResult.p5.toFixed(2) }}</a-descriptions-item>
                <a-descriptions-item label="95th 百分位">{{ simResult.p95.toFixed(2) }}</a-descriptions-item>
                <a-descriptions-item label="99th 百分位">{{ simResult.p99.toFixed(2) }}</a-descriptions-item>
                <a-descriptions-item label="良品率">
                  <a-tag :color="simResult.yield >= 99 ? 'green' : (simResult.yield >= 95 ? 'orange' : 'red')">
                    {{ simResult.yield.toFixed(2) }}%
                  </a-tag>
                </a-descriptions-item>
              </a-descriptions>
            </a-card>

            <a-card title="概率分布直方图" size="small" style="margin-top: 16px">
              <div class="histogram-container">
                <div class="histogram-bars">
                  <div 
                    v-for="(bar, index) in histogramData" 
                    :key="index"
                    class="histogram-bar-wrapper"
                  >
                    <div 
                      class="histogram-bar"
                      :style="{ height: `${bar.height}%`, backgroundColor: bar.bin < (simType === 'bearing-life' ? bearingParams.minLifeHours : -0.05) ? '#ffa39e' : '#80cbc4' }"
                      :title="`Bin: ${bar.bin.toFixed(4)}\nCount: ${bar.count}`"
                    ></div>
                  </div>
                </div>
                <div class="histogram-label">输出值分布</div>
              </div>
            </a-card>

            <a-alert
              :message="simResult.yield >= 99 ? '良品率极高，工艺稳定' : (simResult.yield >= 95 ? '良品率良好，可考虑优化' : '良品率偏低，建议放宽公差或改进工艺')"
              :type="simResult.yield >= 99 ? 'success' : (simResult.yield >= 95 ? 'info' : 'warning')"
              show-icon
              style="margin-top: 16px"
            />
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.monte-carlo-page {
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

.dimension-row {
  margin-bottom: 8px;
}

.histogram-container {
  height: 200px;
  display: flex;
  flex-direction: column;
}

.histogram-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 1px;
  padding: 0 10px;
}

.histogram-bar-wrapper {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.histogram-bar {
  width: 100%;
  transition: height 0.1s;
}

.histogram-label {
  text-align: center;
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
}
</style>
