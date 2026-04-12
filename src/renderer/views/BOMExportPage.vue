<script setup lang="ts">
/**
 * BOMExportPage.vue - BOM 导出页面
 * Section 5.3: 物料清单自动汇总与导出
 */
import { ref, computed } from 'vue'
import { generateBOMReport, exportBOMToCSV, exportBOMToJSON, type BOMItem } from '../engine/bom-export'
import { DownloadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'

const projectInfo = ref({
  name: '机械装配体BOM',
  number: 'BOM-2026-001',
  author: '工程师',
  date: new Date().toISOString().slice(0, 10)
})

const bomItems = ref<BOMItem[]>([
  { id: '1', category: 'bearing', designation: '6205', description: '深沟球轴承', quantity: 2, standard: 'GB/T 276', supplier: 'SKF', supplierPartNo: 'SKF-6205', unitCost: 35, totalCost: 70 },
  { id: '2', category: 'bolt', designation: 'M10×40', description: '六角头螺栓 8.8级', quantity: 8, standard: 'GB/T 5782', supplier: 'MISUMI', unitCost: 2.5, totalCost: 20 },
  { id: '3', category: 'seal', designation: 'AS568-010', description: 'O型圈 NBR 70°', quantity: 4, standard: 'ASME AS568', unitCost: 1.2, totalCost: 4.8 },
  { id: '4', category: 'gear', designation: 'm2-z20', description: '渐开线直齿轮 45#', quantity: 1, material: '45#', unitCost: 120, totalCost: 120 },
  { id: '5', category: 'shaft', designation: 'Φ30×200', description: '传动轴 40Cr', quantity: 1, material: '40Cr', unitCost: 85, totalCost: 85 },
  { id: '6', category: 'motor', designation: '1FK7032', description: '伺服电机 0.75kW', quantity: 1, supplier: 'SIEMENS', unitCost: 3500, totalCost: 3500 },
])

const categoryOptions = [
  { value: 'bearing', label: '轴承' },
  { value: 'bolt', label: '螺栓' },
  { value: 'seal', label: '密封圈' },
  { value: 'gear', label: '齿轮' },
  { value: 'spring', label: '弹簧' },
  { value: 'shaft', label: '轴' },
  { value: 'motor', label: '电机' },
  { value: 'material', label: '材料' },
  { value: 'other', label: '其他' },
]

const supplierOptions = ['SKF', 'NSK', 'FAG', 'NTN', 'MISUMI', 'SIEMENS', 'ABB', '国标', '自定义']

function addItem() {
  const newItem: BOMItem = {
    id: `item_${Date.now()}`,
    category: 'other',
    designation: '',
    description: '',
    quantity: 1,
    unitCost: 0,
    totalCost: 0
  }
  bomItems.value.push(newItem)
}

function removeItem(id: string) {
  bomItems.value = bomItems.value.filter(item => item.id !== id)
}

function onQuantityChange(item: BOMItem) {
  item.totalCost = item.quantity * (item.unitCost || 0)
}

function onUnitCostChange(item: BOMItem) {
  item.totalCost = item.quantity * (item.unitCost || 0)
}

const bomReport = computed(() => {
  return generateBOMReport(
    projectInfo.value.name,
    projectInfo.value.number,
    projectInfo.value.author,
    bomItems.value
  )
})

function exportCSV() {
  const csv = exportBOMToCSV(bomReport.value)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `BOM-${projectInfo.value.number}-${projectInfo.value.date}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportJSON() {
  const json = exportBOMToJSON(bomReport.value)
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `BOM-${projectInfo.value.number}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="bom-export-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>BOM 物料清单导出</small></div>
      <a-space>
        <a-button size="small" @click="addItem"><template #icon><PlusOutlined /></template>添加零件</a-button>
        <a-button size="small" type="primary" @click="exportCSV"><template #icon><DownloadOutlined /></template>导出CSV</a-button>
        <a-button size="small" @click="exportJSON"><template #icon><DownloadOutlined /></template>导出JSON</a-button>
      </a-space>
    </div>

    <div class="content-body">
      <a-card title="项目信息" size="small">
        <a-row :gutter="12">
          <a-col :span="8"><a-form-item label="项目名称"><a-input v-model:value="projectInfo.name"/></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="项目编号"><a-input v-model:value="projectInfo.number"/></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="编制人"><a-input v-model:value="projectInfo.author"/></a-form-item></a-col>
        </a-row>
      </a-card>

      <a-card :title="`物料清单 (${bomReport.itemCount} 项)`" size="small" style="margin-top: 16px">
        <a-table
          :columns="[
            { title: '序号', dataIndex: 'index', key: 'index', width: '6%' },
            { title: '类别', dataIndex: 'category', key: 'category', width: '10%' },
            { title: '型号/规格', dataIndex: 'designation', key: 'designation', width: '14%' },
            { title: '描述', dataIndex: 'description', key: 'description', width: '14%' },
            { title: '数量', dataIndex: 'quantity', key: 'quantity', width: '7%' },
            { title: '供应商', dataIndex: 'supplier', key: 'supplier', width: '10%' },
            { title: '订货号', dataIndex: 'supplierPartNo', key: 'supplierPartNo', width: '12%' },
            { title: '单价(元)', dataIndex: 'unitCost', key: 'unitCost', width: '9%' },
            { title: '总价(元)', dataIndex: 'totalCost', key: 'totalCost', width: '9%' },
            { title: '操作', key: 'actions', width: '9%' }
          ]"
          :data-source="bomReport.items.map((item, i) => ({ ...item, index: i + 1 }))"
          :pagination="false"
          size="small"
          :row-class-name="(record: any) => record.id.startsWith('item_') ? 'editable-row' : ''"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'category'">
              <a-select v-model:value="record.category" size="small" style="width:100%" :options="categoryOptions"/>
            </template>
            <template v-if="column.key === 'designation'">
              <a-input v-model:value="record.designation" size="small" placeholder="型号"/>
            </template>
            <template v-if="column.key === 'description'">
              <a-input v-model:value="record.description" size="small" placeholder="描述"/>
            </template>
            <template v-if="column.key === 'quantity'">
              <a-input-number v-model:value="record.quantity" size="small" :min="1" style="width:100%" @change="()=>onQuantityChange(record)"/>
            </template>
            <template v-if="column.key === 'supplier'">
              <a-select v-model:value="record.supplier" size="small" style="width:100%" :options="supplierOptions.map(s=>({value:s,label:s}))" placeholder="供应商"/>
            </template>
            <template v-if="column.key === 'supplierPartNo'">
              <a-input v-model:value="record.supplierPartNo" size="small" placeholder="订货号"/>
            </template>
            <template v-if="column.key === 'unitCost'">
              <a-input-number v-model:value="record.unitCost" size="small" :min="0" :step="0.1" style="width:100%" @change="()=>onUnitCostChange(record)"/>
            </template>
            <template v-if="column.key === 'totalCost'">
              <strong>¥{{ record.totalCost.toFixed(2) }}</strong>
            </template>
            <template v-if="column.key === 'actions'">
              <a-button type="link" danger size="small" @click="removeItem(record.id)" :disabled="!record.id.startsWith('item_')">
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </template>
          </template>
        </a-table>

        <a-divider />
        <a-row>
          <a-col :span="12"><strong>合计项数: {{ bomReport.itemCount }}</strong></a-col>
          <a-col :span="12" style="text-align: right"><strong>总成本: ¥{{ bomReport.totalCost.toFixed(2) }}</strong></a-col>
        </a-row>
      </a-card>
    </div>
  </div>
</template>

<style scoped>
.bom-export-page{max-width:1400px;margin:0 auto}

.editable-row:hover{background:#f0f7ff !important}
</style>
