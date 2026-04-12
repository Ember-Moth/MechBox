<script setup lang="ts">
/**
 * FailureDiagnosisPage - 失效诊断专家系统页面
 * 基于专家规则树的故障诊断向导
 * Section 5.5
 */
import { ref, computed } from 'vue'
import { SearchOutlined, MedicineBoxOutlined } from '@ant-design/icons-vue'
import { 
  getAllSymptoms, 
  getAllCategories, 
  diagnoseBySymptom,
  type DiagnosisResult 
} from '../engine/failure-diagnosis'

const selectedCategory = ref('')
const selectedSymptom = ref('')
const diagnosisResult = ref<DiagnosisResult | null>(null)

const categories = computed(() => {
  const all = getAllCategories()
  return [{ value: '', label: '全部类别' }, ...all.map(c => ({ value: c, label: getCategoryLabel(c) }))]
})

const symptoms = computed(() => {
  return getAllSymptoms(selectedCategory.value || undefined).map(s => ({ value: s, label: s }))
})

function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    seal: '密封圈',
    bearing: '轴承',
    gear: '齿轮',
    bolt: '螺栓',
    general: '通用'
  }
  return labels[cat] || cat
}

function getProbabilityColor(prob: string): string {
  switch (prob) {
    case 'high': return '#ef4444'
    case 'medium': return '#f59e0b'
    case 'low': return '#22c55e'
    default: return '#8c8c8c'
  }
}

function getProbabilityLabel(prob: string): string {
  switch (prob) {
    case 'high': return '高概率'
    case 'medium': return '中概率'
    case 'low': return '低概率'
    default: return prob
  }
}

function runDiagnosis() {
  if (!selectedSymptom.value) {
    diagnosisResult.value = null
    return
  }
  diagnosisResult.value = diagnoseBySymptom(selectedSymptom.value)
}

function resetDiagnosis() {
  selectedSymptom.value = ''
  selectedCategory.value = ''
  diagnosisResult.value = null
}
</script>

<template>
  <div class="failure-diagnosis-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>失效诊断专家系统</small></div>
      <a-space>
        <a-button size="small" @click="resetDiagnosis">
          <template #icon><MedicineBoxOutlined /></template>重置
        </a-button>
      </a-space>
    </div>

    <div class="content-body">
      <a-row :gutter="16">
        <!-- 左侧：症状选择 -->
        <a-col :span="8">
          <a-card title="失效现象选择" size="small">
            <a-form layout="vertical">
              <a-form-item label="设备类别">
                <a-select v-model:value="selectedCategory" style="width: 100%" @change="selectedSymptom = ''">
                  <a-select-option v-for="cat in categories" :key="cat.value" :value="cat.value">
                    {{ cat.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>

              <a-form-item label="失效现象">
                <a-select 
                  v-model:value="selectedSymptom" 
                  style="width: 100%"
                  :prefix-icon="SearchOutlined"
                  placeholder="选择或搜索失效现象"
                  show-search
                  :filter-option="(input: string, option: any) => option.label.toLowerCase().includes(input.toLowerCase())"
                >
                  <a-select-option v-for="sym in symptoms" :key="sym.value" :value="sym.value" :label="sym.label">
                    {{ sym.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>

              <a-button type="primary" block @click="runDiagnosis" :disabled="!selectedSymptom">
                开始诊断
              </a-button>
            </a-form>
          </a-card>

          <a-card title="使用说明" size="small" style="margin-top: 16px">
            <a-steps direction="vertical" size="small" :current="-1">
              <a-step title="选择设备类别" description="根据失效零件选择类别" />
              <a-step title="选择失效现象" description="描述观察到的失效表现" />
              <a-step title="查看诊断结果" description="系统给出可能原因和建议" />
              <a-step title="执行改进措施" description="按建议修改设计或维护" />
            </a-steps>
          </a-card>
        </a-col>

        <!-- 右侧：诊断结果 -->
        <a-col :span="16">
          <a-empty v-if="!diagnosisResult" description="请选择失效现象后点击开始诊断" />
          
          <div v-else>
            <a-card :title="`诊断结果：${diagnosisResult.selectedSymptom}`" size="small">
              <a-alert
                message="以下为基于专家经验的可能原因，请按概率高低逐一排查"
                type="info"
                show-icon
                style="margin-bottom: 16px"
              />

              <a-collapse v-for="(cause, index) in diagnosisResult.causes" :key="index" :default-active-key="[0]">
                <a-collapse-panel :header="`${index + 1}. ${cause.cause}`">
                  <template #extra>
                    <a-tag :color="getProbabilityColor(cause.probability)">
                      {{ getProbabilityLabel(cause.probability) }}
                    </a-tag>
                  </template>
                  
                  <a-descriptions bordered size="small" :column="1">
                    <a-descriptions-item label="失效机理">
                      {{ cause.description }}
                    </a-descriptions-item>
                    <a-descriptions-item label="建议措施">
                      <a-list size="small" :data-source="cause.suggestions">
                        <template #renderItem="{ item }">
                          <a-list-item>
                            <a-list-item-meta>
                              <template #avatar>
                                <a-badge color="green" />
                              </template>
                              <template #title>{{ item }}</template>
                            </a-list-item-meta>
                          </a-list-item>
                        </template>
                      </a-list>
                    </a-descriptions-item>
                    <a-descriptions-item v-if="cause.relatedCalculation" label="相关计算">
                      <a-tag color="blue">{{ cause.relatedCalculation }}</a-tag>
                    </a-descriptions-item>
                  </a-descriptions>
                </a-collapse-panel>
              </a-collapse>
            </a-card>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.failure-diagnosis-page {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
