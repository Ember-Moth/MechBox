<script setup lang="ts">
/**
 * ReverseIdentifyPage.vue - 逆向识别向导页面
 * 通过测量值反推标准规格 (Section 5.6)
 */
import { ref } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'

const identifyType = ref<'thread' | 'bearing' | 'bolt'>('thread')
const measurements = ref<Record<string, number>>({
  outerDiameter: 10,
  pitch: 1.5
})
const results = ref<any[]>([])
const isSearching = ref(false)

async function runIdentification() {
  isSearching.value = true
  try {
    const res = await window.electron.db.reverseIdentify(identifyType.value, measurements.value)
    results.value = res || []
  } catch (err) {
    console.error('Reverse identification failed:', err)
  } finally {
    isSearching.value = false
  }
}

function onTypeChange() {
  results.value = []
  if (identifyType.value === 'thread') {
    measurements.value = { outerDiameter: 10, pitch: 1.5 }
  } else if (identifyType.value === 'bearing') {
    measurements.value = { id: 25, od: 52, width: 15 }
  } else {
    measurements.value = { d: 10, headWidth: 17, headHeight: 6.4 }
  }
}
</script>

<template>
  <div class="reverse-identify-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>逆向识别向导</small></div>
    </div>

    <div class="content-body">
      <a-card title="测量反推助手" size="small">
        <a-alert
          message="输入用卡尺/量角器测得的外形数据，系统自动反推最可能的标准规格"
          type="info"
          show-icon
          style="margin-bottom: 16px"
        />

        <a-form layout="vertical">
          <a-form-item label="零件类型">
            <a-radio-group v-model:value="identifyType" @change="onTypeChange">
              <a-radio-button value="thread">螺纹</a-radio-button>
              <a-radio-button value="bearing">轴承</a-radio-button>
              <a-radio-button value="bolt">螺栓</a-radio-button>
            </a-radio-group>
          </a-form-item>

          <!-- 螺纹 -->
          <template v-if="identifyType === 'thread'">
            <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item label="外径 (mm)">
                  <a-input-number v-model:value="measurements.outerDiameter" :min="1" style="width:100%"/>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="螺距 (mm)">
                  <a-input-number v-model:value="measurements.pitch" :min="0.1" :step="0.1" style="width:100%"/>
                </a-form-item>
              </a-col>
            </a-row>
          </template>

          <!-- 轴承 -->
          <template v-if="identifyType === 'bearing'">
            <a-row :gutter="12">
              <a-col :span="8">
                <a-form-item label="内径 (mm)">
                  <a-input-number v-model:value="measurements.id" :min="1" style="width:100%"/>
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="外径 (mm)">
                  <a-input-number v-model:value="measurements.od" :min="1" style="width:100%"/>
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="宽度 (mm)">
                  <a-input-number v-model:value="measurements.width" :min="1" style="width:100%"/>
                </a-form-item>
              </a-col>
            </a-row>
          </template>

          <!-- 螺栓 -->
          <template v-if="identifyType === 'bolt'">
            <a-row :gutter="12">
              <a-col :span="8">
                <a-form-item label="公称直径 d (mm)">
                  <a-input-number v-model:value="measurements.d" :min="1" style="width:100%"/>
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="对边宽度 (mm)">
                  <a-input-number v-model:value="measurements.headWidth" :min="1" style="width:100%"/>
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="头部高度 (mm)">
                  <a-input-number v-model:value="measurements.headHeight" :min="1" style="width:100%"/>
                </a-form-item>
              </a-col>
            </a-row>
          </template>

          <a-button type="primary" @click="runIdentification" :loading="isSearching">
            <template #icon><SearchOutlined /></template>识别规格
          </a-button>
        </a-form>
      </a-card>

      <!-- 识别结果 -->
      <a-card title="匹配结果" size="small" style="margin-top: 16px" v-if="results.length > 0">
        <a-table
          :columns="[
            { title: '排名', dataIndex: 'rank', key: 'rank', width: '10%' },
            { title: '规格型号', dataIndex: 'designation', key: 'designation', width: '30%' },
            { title: '差异值', dataIndex: 'diff', key: 'diff', width: '20%' },
            { title: '详细信息', dataIndex: 'details', key: 'details', width: '40%' }
          ]"
          :data-source="results.map((r, i) => ({
            ...r,
            rank: i + 1,
            details: identifyType === 'thread' ? `d=${r.d}mm, P=${r.pitch}mm, d2=${r.d2?.toFixed(2)}mm` :
                     identifyType === 'bearing' ? `d=${r.inner_diameter}mm, D=${r.outer_diameter}mm, B=${r.width}mm` :
                     `d=${r.d}mm, s=${r.head_width_s}mm, k=${r.head_height_k}mm`
          }))"
          :pagination="false"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'rank'">
              <a-tag :color="record.rank === 1 ? 'green' : record.rank <= 3 ? 'blue' : 'default'">
                #{{ record.rank }}
              </a-tag>
            </template>
            <template v-if="column.key === 'diff'">
              <a-tag :color="record.diff < 0.5 ? 'green' : record.diff < 2 ? 'orange' : 'red'">
                {{ record.diff?.toFixed(2) }}
              </a-tag>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>
  </div>
</template>

<style scoped>
.reverse-identify-page{max-width:1000px;margin:0 auto}
.toolbar{background:#004d40;padding:6px 16px;display:flex;justify-content:space-between;align-items:center;color:white;border-radius:4px;margin-bottom:16px}
.brand{font-weight:bold;font-size:16px;letter-spacing:1px}.brand small{font-weight:normal;font-size:10px;opacity:.8;margin-left:8px}
.content-body{background:#fff;border-radius:8px;padding:16px}
</style>
