<script setup lang="ts">
/**
 * ToleranceStackPage.vue - 统计公差分析页面
 * 支持 RSS (Root Sum Square) 和 Monte Carlo 公差分析
 */
import { ref, computed } from 'vue'
import { PlayCircleOutlined, DownloadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { calcRSS, quickToleranceStack } from '../engine/tolerances/statistical'
import type { ToleranceDimension } from '../engine/tolerances/statistical'

const dimensions = ref<ToleranceDimension[]>([
  { nominal: 50, tolerance_plus: 0.1, tolerance_minus: 0.1, distribution: 'normal', processCapability: 1.33 },
  { nominal: 0.05, tolerance_plus: 0.02, tolerance_minus: 0.02, distribution: 'normal', processCapability: 1.33 },
  { nominal: -50, tolerance_plus: 0.1, tolerance_minus: 0.1, distribution: 'normal', processCapability: 1.33 },
])

const upperSpec = ref(0.05)
const lowerSpec = ref(-0.05)
const result = ref<any>(null)
const isRunning = ref(false)

const quickResult = computed(() => quickToleranceStack(dimensions.value))

function runAnalysis() {
  isRunning.value = true
  try {
    result.value = calcRSS(dimensions.value, upperSpec.value, lowerSpec.value)
  } catch (e) {
    console.error('Analysis failed:', e)
  } finally {
    isRunning.value = false
  }
}

function addDimension() {
  dimensions.value.push({
    nominal: 0,
    tolerance_plus: 0.1,
    tolerance_minus: 0.1,
    distribution: 'normal',
    processCapability: 1.33
  })
}

function removeDimension(index: number) {
  dimensions.value.splice(index, 1)
  if (result.value) result.value = null
}

function exportResults() {
  if (!result.value) return
  let csv = '参数,值\n'
  csv += `名义尺寸,${result.value.nominal}\n`
  csv += `极值法公差,${result.value.worstCaseTolerance}\n`
  csv += `RSS统计公差,${result.value.rssTolerance}\n`
  csv += `模拟均值,${result.value.simulatedMean}\n`
  csv += `模拟标准差,${result.value.simulatedStdDev}\n`
  csv += `良品率,${result.value.yieldRate}%\n`
  csv += `Cp,${result.value.cp}\n`
  csv += `Cpk,${result.value.cpk}\n`
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tolerance-stack-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="tolerance-stack-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>统计公差分析</small></div>
      <a-space>
        <a-button size="small" type="primary" @click="runAnalysis" :loading="isRunning">
          <template #icon><PlayCircleOutlined /></template>运行分析
        </a-button>
        <a-button size="small" @click="exportResults" :disabled="!result">
          <template #icon><DownloadOutlined /></template>导出结果
        </a-button>
      </a-space>
    </div>

    <div class="content-body">
      <a-row :gutter="16">
        <a-col :span="14">
          <a-card title="尺寸链定义" size="small">
            <a-table
              :columns="[
                { title: '序号', dataIndex: 'index', key: 'index', width: '8%' },
                { title: '名义尺寸', dataIndex: 'nominal', key: 'nominal', width: '18%' },
                { title: '上偏差', dataIndex: 'tolerance_plus', key: 'tolerance_plus', width: '15%' },
                { title: '下偏差', dataIndex: 'tolerance_minus', key: 'tolerance_minus', width: '15%' },
                { title: '分布类型', dataIndex: 'distribution', key: 'distribution', width: '15%' },
                { title: 'Cp', dataIndex: 'processCapability', key: 'processCapability', width: '12%' },
                { title: '操作', key: 'actions', width: '17%' }
              ]"
              :data-source="dimensions.map((d, i) => ({ ...d, index: i + 1 }))"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'nominal'">
                  <a-input-number v-model:value="dimensions[index].nominal" size="small" style="width:100%"/>
                </template>
                <template v-if="column.key === 'tolerance_plus'">
                  <a-input-number v-model:value="dimensions[index].tolerance_plus" size="small" style="width:100%" :min="0"/>
                </template>
                <template v-if="column.key === 'tolerance_minus'">
                  <a-input-number v-model:value="dimensions[index].tolerance_minus" size="small" style="width:100%" :min="0"/>
                </template>
                <template v-if="column.key === 'distribution'">
                  <a-select v-model:value="dimensions[index].distribution" size="small" style="width:100%">
                    <a-select-option value="normal">正态分布</a-select-option>
                    <a-select-option value="uniform">均匀分布</a-select-option>
                    <a-select-option value="triangular">三角分布</a-select-option>
                  </a-select>
                </template>
                <template v-if="column.key === 'processCapability'">
                  <a-input-number v-model:value="dimensions[index].processCapability" size="small" style="width:100%" :min="0.5" :max="2" :step="0.01"/>
                </template>
                <template v-if="column.key === 'actions'">
                  <a-button type="link" danger size="small" @click="removeDimension(index)">
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </template>
              </template>
            </a-table>
            <a-button type="dashed" block style="margin-top: 12px" @click="addDimension">
              <template #icon><PlusOutlined /></template>添加尺寸
            </a-button>
          </a-card>

          <a-card title="规格限" size="small" style="margin-top: 16px">
            <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item label="上限">
                  <a-input-number v-model:value="upperSpec" style="width:100%"/>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="下限">
                  <a-input-number v-model:value="lowerSpec" style="width:100%"/>
                </a-form-item>
              </a-col>
            </a-row>
          </a-card>
        </a-col>

        <a-col :span="10">
          <!-- 快速对比 -->
          <a-card title="极值法 vs RSS 对比" size="small">
            <a-descriptions bordered size="small" :column="1">
              <a-descriptions-item label="极值法公差 (Worst-case)">
                <a-tag color="red">±{{ quickResult.worstCase.toFixed(4) }} mm</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="RSS 统计公差">
                <a-tag color="green">±{{ quickResult.rss.toFixed(4) }} mm</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="公差放宽">
                <a-tag color="blue">{{ quickResult.savings.toFixed(1) }}%</a-tag>
              </a-descriptions-item>
            </a-descriptions>
            <a-alert
              message="统计公差通常比极值法更宽松，可降低制造成本"
              type="info"
              show-icon
              style="margin-top: 12px"
            />
          </a-card>

          <!-- 详细结果 -->
          <a-card v-if="result" title="Monte Carlo 分析结果" size="small" style="margin-top: 16px">
            <a-descriptions bordered size="small" :column="1">
              <a-descriptions-item label="名义总尺寸">{{ result.nominal.toFixed(4) }} mm</a-descriptions-item>
              <a-descriptions-item label="模拟均值">{{ result.simulatedMean.toFixed(4) }} mm</a-descriptions-item>
              <a-descriptions-item label="模拟标准差">{{ result.simulatedStdDev.toFixed(4) }} mm</a-descriptions-item>
              <a-descriptions-item label="良品率">
                <a-tag :color="result.yieldRate >= 99.73 ? 'green' : result.yieldRate >= 95 ? 'orange' : 'red'">
                  {{ result.yieldRate.toFixed(2) }}%
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="Cp">
                <a-tag :color="result.cp >= 1.33 ? 'green' : result.cp >= 1.0 ? 'orange' : 'red'">
                  {{ result.cp.toFixed(2) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="Cpk">
                <a-tag :color="result.cpk >= 1.33 ? 'green' : result.cpk >= 1.0 ? 'orange' : 'red'">
                  {{ result.cpk.toFixed(2) }}
                </a-tag>
              </a-descriptions-item>
            </a-descriptions>

            <a-alert
              v-for="(w, i) in result.warnings"
              :key="i"
              :message="w.message"
              :description="w.suggestion"
              :type="w.level === 'error' ? 'error' : 'warning'"
              show-icon
              style="margin-top: 12px"
            />
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.tolerance-stack-page { max-width: 1400px; margin: 0 auto }
/* 使用全局统一样式 */
</style>
