<script setup lang="ts">
/**
 * ExcelImportPage.vue - Excel 导入页面
 * 主进程 xlsx 解析 + JSON Schema 校验 (Section 2.3.3)
 */
import { ref } from 'vue'
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons-vue'

const templateType = ref<'bearing' | 'bolt' | 'material'>('bearing')
const importResult = ref<any>(null)
const isImporting = ref(false)

async function handleImport() {
  isImporting.value = true
  try {
    const res = await window.electron.db.importExcel(templateType.value)
    importResult.value = res
  } catch (err: any) {
    importResult.value = { success: false, errors: [err.message || '导入失败'] }
  } finally {
    isImporting.value = false
  }
}

async function downloadTemplate() {
  const path = await window.electron.db.downloadTemplate(templateType.value, `template-${templateType.value}.xlsx`)
  if (path) {
    alert(`模板已下载: ${path}`)
  }
}
</script>

<template>
  <div class="excel-import-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>Excel 导入</small></div>
    </div>

    <div class="content-body">
      <a-card title="选择导入模板类型" size="small">
        <a-radio-group v-model:value="templateType" button-style="solid">
          <a-radio-button value="bearing">轴承</a-radio-button>
          <a-radio-button value="bolt">螺栓</a-radio-button>
          <a-radio-button value="material">材料</a-radio-button>
        </a-radio-group>
        <a-button style="margin-left: 16px" @click="downloadTemplate">
          <template #icon><DownloadOutlined /></template>下载模板
        </a-button>
      </a-card>

      <a-card title="导入数据" size="small" style="margin-top: 16px">
        <a-upload-dragger :before-upload="() => false" style="display: none" />
        <a-button type="primary" @click="handleImport" :loading="isImporting" size="large">
          <template #icon><UploadOutlined /></template>选择 Excel 文件导入
        </a-button>
        <div style="margin-top: 12px; color: #888; font-size: 12px">
          支持 .xlsx, .xls, .csv 格式，系统将自动校验数据格式
        </div>
      </a-card>

      <!-- 导入结果 -->
      <a-card v-if="importResult" title="导入结果" size="small" style="margin-top: 16px">
        <a-result
          :status="importResult.success ? 'success' : 'error'"
          :title="importResult.success ? `成功导入 ${importResult.recordsImported} 条记录` : '导入失败'"
          :sub-title="importResult.errors?.join('\n')"
        />
        <a-table
          v-if="importResult.success && importResult.data?.length > 0"
          :columns="[
            { title: '序号', dataIndex: 'index', key: 'index', width: '10%' },
            { title: '数据', dataIndex: 'data', key: 'data', width: '90%' }
          ]"
          :data-source="importResult.data.map((d: any, i: number) => ({ index: i + 1, data: JSON.stringify(d) }))"
          :pagination="{ pageSize: 10 }"
          size="small"
        />
      </a-card>
    </div>
  </div>
</template>

<style scoped>
.excel-import-page{max-width:1000px;margin:0 auto}
</style>
