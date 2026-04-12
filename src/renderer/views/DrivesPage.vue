<script setup lang="ts">
/**
 * DrivesPage - 传动工具页面
 * 带传动、链传动基础计算
 * Section 6.3
 */
import { ref, computed } from 'vue'
import { calcVBel } from '../engine/drives/belt'
import { calcChainDrive } from '../engine/drives/chain'
import { FilePdfOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { usePdfExport } from '../composables/usePdfExport'


const driveType = ref<'belt' | 'chain'>('belt')

// 带传动参数
const beltParams = ref({
  power: 5.0,
  speed1: 1450,
  speed2: 725,
  beltType: 'B',
  centerDistance: 500
})

// 链传动参数
const chainParams = ref({
  power: 5.0,
  speed1: 100,
  speed2: 50,
  centerDistance: 500
})

const beltResult = computed(() => {
  return calcVBel(beltParams.value)
})

const chainResult = computed(() => {
  return calcChainDrive(chainParams.value)
})

const { isExporting, exportPdf } = usePdfExport()

async function handleExportPdf() {
  const element = document.querySelector('.drives-page') as HTMLElement
  if (!element) return
  const canvas = await html2canvas(element, { scale: 2 })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width)
  pdf.save(`MechBox-${driveType.value}-drive-${Date.now()}.pdf`)
}
</script>

<template>
  <div class="drives-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>传动工具</small></div>
      <a-space>
        <a-button size="small" type="primary" @click="handleExportPdf">
          <template #icon><FilePdfOutlined /></template>导出PDF
        </a-button>
      </a-space>
    </div>

    <div class="content-body">
      <a-card title="传动类型" size="small">
        <a-radio-group v-model:value="driveType" button-style="solid">
          <a-radio-button value="belt">V带传动</a-radio-button>
          <a-radio-button value="chain">链传动</a-radio-button>
        </a-radio-group>
      </a-card>

      <a-row :gutter="16" style="margin-top: 16px">
        <a-col :span="10">
          <a-card :title="driveType === 'belt' ? 'V带传动参数' : '链传动参数'" size="small">
            <a-form layout="vertical" v-if="driveType === 'belt'">
              <a-form-item label="传递功率 (kW)">
                <a-input-number v-model:value="beltParams.power" style="width: 100%" :min="0" />
              </a-form-item>
              <a-form-item label="小带轮转速 (rpm)">
                <a-input-number v-model:value="beltParams.speed1" style="width: 100%" :min="0" />
              </a-form-item>
              <a-form-item label="大带轮转速 (rpm)">
                <a-input-number v-model:value="beltParams.speed2" style="width: 100%" :min="0" />
              </a-form-item>
              <a-form-item label="中心距 (mm)">
                <a-input-number v-model:value="beltParams.centerDistance" style="width: 100%" :min="0" />
              </a-form-item>
            </a-form>
            <a-form layout="vertical" v-else>
              <a-form-item label="传递功率 (kW)">
                <a-input-number v-model:value="chainParams.power" style="width: 100%" :min="0" />
              </a-form-item>
              <a-form-item label="小链轮转速 (rpm)">
                <a-input-number v-model:value="chainParams.speed1" style="width: 100%" :min="0" />
              </a-form-item>
              <a-form-item label="大链轮转速 (rpm)">
                <a-input-number v-model:value="chainParams.speed2" style="width: 100%" :min="0" />
              </a-form-item>
              <a-form-item label="中心距 (mm)">
                <a-input-number v-model:value="chainParams.centerDistance" style="width: 100%" :min="0" />
              </a-form-item>
            </a-form>
          </a-card>
        </a-col>

        <a-col :span="14">
          <a-card title="计算结果" size="small">
            <div v-if="driveType === 'belt'">
              <a-descriptions bordered size="small" :column="2">
                <a-descriptions-item label="传动比">{{ beltResult.value.transmissionRatio.toFixed(2) }}</a-descriptions-item>
                <a-descriptions-item label="带速">{{ beltResult.value.beltSpeed.toFixed(2) }} m/s</a-descriptions-item>
                <a-descriptions-item label="小带轮直径">{{ beltResult.value.smallPulleyDiameter }} mm</a-descriptions-item>
                <a-descriptions-item label="大带轮直径">{{ beltResult.value.largePulleyDiameter }} mm</a-descriptions-item>
                <a-descriptions-item label="包角">{{ beltResult.value.wrapAngle.toFixed(1) }}°</a-descriptions-item>
                <a-descriptions-item label="带长">{{ beltResult.value.beltLength.toFixed(1) }} mm</a-descriptions-item>
                <a-descriptions-item label="有效拉力">{{ beltResult.value.effectivePull.toFixed(0) }} N</a-descriptions-item>
              </a-descriptions>
            </div>
            <div v-else>
              <a-descriptions bordered size="small" :column="2">
                <a-descriptions-item label="传动比">{{ chainResult.value.transmissionRatio.toFixed(2) }}</a-descriptions-item>
                <a-descriptions-item label="推荐链号">{{ chainResult.value.recommendedChain }}</a-descriptions-item>
                <a-descriptions-item label="链节距">{{ chainResult.value.chainPitch }} mm</a-descriptions-item>
                <a-descriptions-item label="小链轮齿数">{{ chainResult.value.smallSprocketTeeth }}</a-descriptions-item>
                <a-descriptions-item label="大链轮齿数">{{ chainResult.value.largeSprocketTeeth }}</a-descriptions-item>
                <a-descriptions-item label="链速">{{ chainResult.value.chainSpeed.toFixed(2) }} m/s</a-descriptions-item>
                <a-descriptions-item label="链节数">{{ chainResult.value.chainLength }}</a-descriptions-item>
                <a-descriptions-item label="有效拉力">{{ chainResult.value.effectivePull.toFixed(0) }} N</a-descriptions-item>
              </a-descriptions>
            </div>

            <a-alert
              v-for="(w, i) in (driveType === 'belt' ? beltResult.warnings : chainResult.warnings)"
              :key="i"
              :message="w.message"
              :type="w.level === 'error' ? 'error' : (w.level === 'warning' ? 'warning' : 'info')"
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
.drives-page { max-width: 1200px; margin: 0 auto; }
/* 使用全局统一样式 */
</style>
