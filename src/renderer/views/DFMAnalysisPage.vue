<script setup lang="ts">
/**
 * DFMAnalysisPage - 面向制造的公差成本分析页面
 * 公差-工艺映射，制造成本预估
 * Section 5.4
 */
import { ref, computed } from 'vue'
import { SaveOutlined, UndoOutlined, BarChartOutlined } from '@ant-design/icons-vue'
import { recommendProcess, calcManufacturingCost, generateDFMSuggestions, compareToleranceCosts } from '../engine/dfm-cost'

interface ToleranceItem {
  id: string
  name: string
  itGrade: string
}

const toleranceItems = ref<ToleranceItem[]>([
  { id: '1', name: '轴承位外径', itGrade: 'IT6' },
  { id: '2', name: '齿轮配合孔', itGrade: 'IT7' },
  { id: '3', name: '密封面', itGrade: 'IT5' },
  { id: '4', name: '非配合面', itGrade: 'IT11' },
])

const costComparison = ref<any[]>([])
const showComparison = ref(false)

const itGradeOptions = [
  'IT01', 'IT0', 'IT1', 'IT2', 'IT3', 'IT4', 'IT5', 'IT6', 'IT7', 'IT8', 'IT9', 'IT10', 'IT11', 'IT12'
]

const totalCostIndex = computed(() => {
  return toleranceItems.value.reduce((sum, item) => {
    const mapping = recommendProcess(item.itGrade)
    return sum + (mapping ? mapping.relativeCost : 0)
  }, 0)
})

const avgCostPerFeature = computed(() => {
  return toleranceItems.value.length > 0 ? totalCostIndex.value / toleranceItems.value.length : 0
})

const dfmWarnings = computed(() => {
  const grades = toleranceItems.value.map(i => i.itGrade)
  const { warnings } = generateDFMSuggestions(grades)
  return warnings
})

const dfmSuggestions = computed(() => {
  const grades = toleranceItems.value.map(i => i.itGrade)
  const { suggestions } = generateDFMSuggestions(grades)
  return suggestions
})

function addItem() {
  toleranceItems.value.push({
    id: `${Date.now()}`,
    name: '新特征',
    itGrade: 'IT8'
  })
}

function removeItem(id: string) {
  toleranceItems.value = toleranceItems.value.filter(i => i.id !== id)
}

function runComparison() {
  const scenarios = [
    { name: '当前方案', grades: toleranceItems.value.map(i => i.itGrade) },
    { name: '成本优化方案', grades: toleranceItems.value.map(i => {
      // 自动放宽非关键公差
      if (i.itGrade === 'IT5') return 'IT6'
      if (i.itGrade === 'IT6') return 'IT7'
      if (i.itGrade === 'IT7') return 'IT8'
      return i.itGrade
    })}
  ]
  
  costComparison.value = compareToleranceCosts(scenarios)
  showComparison.value = true
}
</script>

<template>
  <div class="dfm-analysis-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>DFM 公差成本分析</small></div>
      <a-space>
        <a-button size="small" @click="addItem">
          <template #icon><SaveOutlined /></template>添加特征
        </a-button>
        <a-button size="small" type="primary" @click="runComparison">
          <template #icon><BarChartOutlined /></template>方案对比
        </a-button>
      </a-space>
    </div>

    <div class="content-body">
      <a-row :gutter="16">
        <!-- 左侧：公差特征列表 -->
        <a-col :span="14">
          <a-card :title="`公差特征列表 (${toleranceItems.length}项)`" size="small">
            <a-table
              :columns="[
                { title: '特征名称', dataIndex: 'name', key: 'name', width: '35%' },
                { title: '公差等级', dataIndex: 'itGrade', key: 'itGrade', width: '20%' },
                { title: '推荐工艺', dataIndex: 'process', key: 'process', width: '25%' },
                { title: '相对成本', dataIndex: 'cost', key: 'cost', width: '20%' }
              ]"
              :data-source="toleranceItems.map(item => {
                const mapping = recommendProcess(item.itGrade)
                return {
                  ...item,
                  process: mapping ? mapping.process : '-',
                  cost: mapping ? mapping.relativeCost : 0
                }
              })"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <a-input v-model:value="record.name" size="small" style="width: 100%" />
                </template>
                <template v-if="column.key === 'itGrade'">
                  <a-select v-model:value="record.itGrade" size="small" style="width: 100%">
                    <a-select-option v-for="grade in itGradeOptions" :key="grade" :value="grade">
                      {{ grade }}
                    </a-select-option>
                  </a-select>
                </template>
                <template v-if="column.key === 'cost'">
                  <a-tag :color="record.cost > 10 ? 'red' : (record.cost > 5 ? 'orange' : 'green')">
                    {{ record.cost }}
                  </a-tag>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>

        <!-- 右侧：成本分析 -->
        <a-col :span="10">
          <a-card title="成本分析汇总" size="small">
            <a-descriptions bordered size="small" :column="1">
              <a-descriptions-item label="特征总数">{{ toleranceItems.length }}</a-descriptions-item>
              <a-descriptions-item label="总成本指数">{{ totalCostIndex }}</a-descriptions-item>
              <a-descriptions-item label="平均成本/特征">{{ avgCostPerFeature.toFixed(1) }}</a-descriptions-item>
            </a-descriptions>
          </a-card>

          <a-card title="DFM 警告" size="small" style="margin-top: 16px" v-if="dfmWarnings.length > 0">
            <a-alert
              v-for="(warning, index) in dfmWarnings"
              :key="index"
              :message="warning"
              type="warning"
              show-icon
              style="margin-bottom: 8px"
            />
          </a-card>

          <a-card title="优化建议" size="small" style="margin-top: 16px" v-if="dfmSuggestions.length > 0">
            <a-alert
              v-for="(suggestion, index) in dfmSuggestions"
              :key="index"
              :message="suggestion"
              type="info"
              show-icon
              style="margin-bottom: 8px"
            />
          </a-card>

          <!-- 方案对比 -->
          <a-card v-if="showComparison" title="方案对比" size="small" style="margin-top: 16px">
            <a-table
              :columns="[
                { title: '方案', dataIndex: 'name', key: 'name', width: '30%' },
                { title: '总成本指数', dataIndex: 'totalCostIndex', key: 'totalCostIndex', width: '25%' },
                { title: '平均成本', dataIndex: 'avgCostPerFeature', key: 'avgCostPerFeature', width: '25%' },
                { title: '节省', dataIndex: 'savings', key: 'savings', width: '20%' }
              ]"
              :data-source="costComparison.map((c, i) => ({
                ...c,
                savings: i === 0 ? '-' : `${Math.round((1 - c.totalCostIndex / costComparison[0].totalCostIndex) * 100)}%`
              }))"
              :pagination="false"
              size="small"
            />
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.dfm-analysis-page {
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
</style>
