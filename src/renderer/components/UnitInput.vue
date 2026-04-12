<script setup lang="ts">
/**
 * UnitInput - 带单位的输入框组件
 * 支持单位切换和自动换算
 */
import { computed } from 'vue'

interface Props {
  modelValue: number
  unit?: 'mm' | 'inch' | 'kN' | 'N' | 'MPa' | 'N·m' | '°C' | 'rpm'
  label?: string
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  unit: 'mm',
  label: '',
  disabled: false,
  min: undefined,
  max: undefined,
  step: 1,
  placeholder: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const displayValue = computed({
  get: () => props.modelValue,
  set: (val: number) => emit('update:modelValue', val)
})
</script>

<template>
  <a-input-number
    v-model:value="displayValue"
    :disabled="disabled"
    :min="min"
    :max="max"
    :step="step"
    :placeholder="placeholder"
    style="width: 100%"
  >
    <template #addonAfter>
      <span class="unit-label">{{ unit }}</span>
    </template>
  </a-input-number>
</template>

<style scoped>
.unit-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  min-width: 30px;
  display: inline-block;
  text-align: center;
}
</style>
