<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useStandardStore } from '../../store/useStandardStore'
import { calcFit } from '../../engine/tolerances/fit'
import type { FitResult } from '../../engine/types'

const store = useStandardStore()

// 表单输入
const size = ref<number>(25)
const holePos = ref('H')
const holeGrade = ref('IT7')
const shaftPos = ref('g')
const shaftGrade = ref('IT6')

const holePositions = ['H']
const shaftPositions = ['h', 'g', 'f']
const itGrades = ['IT5', 'IT6', 'IT7', 'IT8', 'IT9']

// 计算结果
const fitResult = computed<FitResult | null>(() => {
  if (!size.value || size.value <= 0) return null

  const sizeIndex = store.getSizeRangeIndex(size.value)
  if (sizeIndex === -1) return null

  // 孔计算
  const holeIT = store.getITValue(holeGrade.value, sizeIndex)
  const holeDev = store.getFundamentalDeviation('holes', holePos.value, sizeIndex)

  // 轴计算
  const shaftIT = store.getITValue(shaftGrade.value, sizeIndex)
  const shaftDev = store.getFundamentalDeviation('shafts', shaftPos.value, sizeIndex)

  if (holeIT === null || holeDev === null || shaftIT === null || shaftDev === null) return null

  // 简化的计算规则：基准孔 H (EI=0), 轴基本偏差为上偏差 (es) 或下偏差 (ei)
  // 这里暂时假设 H 的 EI=0, g/f 的偏差是上偏差 es
  const holeES = holeDev + holeIT
  const holeEI = holeDev

  const shaftes = shaftDev
  const shaftei = shaftDev - shaftIT

  const result = calcFit(size.value, holeES, holeEI, shaftes, shaftei)
  result.fit_code = `${holePos.value}${holeGrade.value.replace('IT', '')}/${shaftPos.value}${shaftGrade.value.replace('IT', '')}`

  return result
})

const getFitTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    clearance: '间隙配合',
    transition: '过渡配合',
    interference: '过盈配合'
  }
  return map[type] || type
}

const getFitTypeColor = (type: string) => {
  const map: Record<string, string> = {
    clearance: 'green',
    transition: 'orange',
    interference: 'red'
  }
  return map[type] || 'blue'
}
</script>

<template>
  <div class="tolerances-page">
    <a-row :gutter="24">
      <!-- 输入列 -->
      <a-col :span="10">
        <a-card title="参数输入" size="small">
          <a-form layout="vertical">
            <a-form-item label="基本尺寸 (mm)">
              <a-input-number v-model:value="size" :min="0" :max="500" style="width: 100%" />
            </a-form-item>

            <a-divider>孔公差带</a-divider>
            <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item label="基本偏差代号">
                  <a-select v-model:value="holePos" :options="holePositions.map(v => ({ value: v }))" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="公差等级">
                  <a-select v-model:value="holeGrade" :options="itGrades.map(v => ({ value: v }))" />
                </a-form-item>
              </a-col>
            </a-row>

            <a-divider>轴公差带</a-divider>
            <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item label="基本偏差代号">
                  <a-select v-model:value="shaftPos" :options="shaftPositions.map(v => ({ value: v }))" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="公差等级">
                  <a-select v-model:value="shaftGrade" :options="itGrades.map(v => ({ value: v }))" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-card>
      </a-col>

      <!-- 结果列 -->
      <a-col :span="14">
        <a-card title="计算结果" size="small" v-if="fitResult">
          <template #extra>
            <a-tag :color="getFitTypeColor(fitResult.fit_type)">
              {{ getFitTypeLabel(fitResult.fit_type) }}
            </a-tag>
          </template>

          <a-descriptions bordered size="small" :column="1">
            <a-descriptions-item label="配合代号">{{ fitResult.fit_code }}</a-descriptions-item>
            <a-descriptions-item label="孔极限偏差">
              ES: +{{ (fitResult.hole_upper * 1000).toFixed(0) }} μm / EI: {{ (fitResult.hole_lower * 1000).toFixed(0) }} μm
            </a-descriptions-item>
            <a-descriptions-item label="轴极限偏差">
              es: {{ (fitResult.shaft_upper * 1000).toFixed(0) }} μm / ei: {{ (fitResult.shaft_lower * 1000).toFixed(0) }} μm
            </a-descriptions-item>
            <a-descriptions-item label="最大间隙 Xmax">
              {{ (fitResult.max_clearance * 1000).toFixed(0) }} μm
            </a-descriptions-item>
            <a-descriptions-item label="最小间隙 Xmin">
              {{ (fitResult.min_clearance * 1000).toFixed(0) }} μm
            </a-descriptions-item>
          </a-descriptions>

          <div class="result-visualization" style="margin-top: 20px; height: 100px; background: #fafafa; border: 1px dashed #ddd; display: flex; align-items: center; justify-content: center; color: #999;">
             [此处未来将集成 ECharts 绘制公差带相对位置图]
          </div>
        </a-card>
        <a-empty v-else description="请输入有效参数以查看结果" />
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.tolerances-page {
  padding: 8px;
}
</style>
