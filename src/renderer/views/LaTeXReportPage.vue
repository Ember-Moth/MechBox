<script setup lang="ts">
/**
 * LaTeXReportPage.vue - LaTeX 工程报告导出
 * 公式推导专业计算书 (Section 5.2)
 */
import { ref } from 'vue'
import { FileTextOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { usePdfExport } from '../composables/usePdfExport'


const reportConfig = ref({
  projectName: '轴承选型计算书',
  projectNumber: 'PRJ-2026-001',
  author: '工程师',
  date: new Date().toISOString().slice(0, 10),
  module: 'bearings',
  standardRef: 'ISO 281:2007',
  includeFormulas: true,
  includeStandardRefs: true,
  includeWatermark: true,
})

async function generateReport() {
  const doc = new jsPDF('p', 'mm', 'a4')
  const w = doc.internal.pageSize.getWidth()
  
  // 标题
  doc.setFontSize(24)
  doc.setTextColor(30, 58, 138)
  doc.text('机械设计计算书', w / 2, 30, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text('Engineering Calculation Report', w / 2, 40, { align: 'center' })
  
  // 项目信息
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  const info = [
    `项目名称: ${reportConfig.value.projectName}`,
    `项目编号: ${reportConfig.value.projectNumber}`,
    `编制人: ${reportConfig.value.author}`,
    `日期: ${reportConfig.value.date}`,
    `计算模块: ${reportConfig.value.module}`,
    `引用标准: ${reportConfig.value.standardRef}`,
  ]
  
  info.forEach((line, i) => {
    doc.text(line, 20, 60 + i * 8)
  })
  
  // 计算公式
  if (reportConfig.value.includeFormulas) {
    doc.setFontSize(14)
    doc.setTextColor(30, 58, 138)
    doc.text('计算公式', 20, 120)
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text('L10 = (C / P)^p × (10^6 / (60 × n))', 20, 135)
    doc.text('P = X × Fr + Y × Fa', 20, 145)
    doc.text('其中:', 20, 155)
    doc.text('  L10 - 基本额定寿命 (百万转)', 20, 165)
    doc.text('  C - 额定动载荷 (kN)', 20, 175)
    doc.text('  P - 当量动载荷 (kN)', 20, 185)
    doc.text('  p - 指数 (球轴承=3, 滚子轴承=10/3)', 20, 195)
    doc.text('  n - 转速 (rpm)', 20, 205)
  }
  
  // 引用标准
  if (reportConfig.value.includeStandardRefs) {
    doc.setFontSize(14)
    doc.setTextColor(30, 58, 138)
    doc.text('引用标准', 20, 230)
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(reportConfig.value.standardRef, 20, 240)
  }
  
  // 水印
  if (reportConfig.value.includeWatermark) {
    doc.setFontSize(60)
    doc.setTextColor(200, 200, 200)
    doc.text('MechBox', w / 2, doc.internal.pageSize.getHeight() / 2, { align: 'center', angle: 45 })
  }
  
  // 保存
  doc.save(`${reportConfig.value.projectNumber}-${reportConfig.value.date}.pdf`)
}
</script>

<template>
  <div class="latex-report-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>LaTeX 工程报告导出</small></div>
      <a-button type="primary" size="small" @click="generateReport">
        <template #icon><FileTextOutlined /></template>生成报告
      </a-button>
    </div>

    <div class="content-body">
      <a-card title="报告配置" size="small">
        <a-form layout="vertical">
          <a-row :gutter="12">
            <a-col :span="12"><a-form-item label="项目名称"><a-input v-model:value="reportConfig.projectName"/></a-form-item></a-col>
            <a-col :span="12"><a-form-item label="项目编号"><a-input v-model:value="reportConfig.projectNumber"/></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="编制人"><a-input v-model:value="reportConfig.author"/></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="日期"><a-input type="date" v-model:value="reportConfig.date"/></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="引用标准"><a-input v-model:value="reportConfig.standardRef"/></a-form-item></a-col>
          </a-row>
          
          <a-divider/>
          <a-form-item label="报告内容">
            <a-checkbox v-model:checked="reportConfig.includeFormulas">包含公式推导</a-checkbox>
            <a-checkbox v-model:checked="reportConfig.includeStandardRefs">包含引用标准</a-checkbox>
            <a-checkbox v-model:checked="reportConfig.includeWatermark">添加水印</a-checkbox>
          </a-form-item>
        </a-form>
      </a-card>

      <a-card title="报告预览示例" size="small" style="margin-top: 16px">
        <div style="padding: 20px; background: #f5f5f5; border-radius: 4px; font-family: 'Courier New', monospace">
          <div style="text-align: center; font-size: 20px; color: #1E3A8A; margin-bottom: 16px">
            <strong>机械设计计算书</strong>
          </div>
          <div style="margin-bottom: 8px">项目名称: {{ reportConfig.projectName }}</div>
          <div style="margin-bottom: 8px">项目编号: {{ reportConfig.projectNumber }}</div>
          <div style="margin-bottom: 8px">引用标准: {{ reportConfig.standardRef }}</div>
          <div v-if="reportConfig.includeFormulas" style="margin-top: 16px; padding: 12px; background: #fff; border-left: 3px solid #1E3A8A">
            <strong>计算公式:</strong>
            <div style="margin-top: 8px">L10 = (C / P)^p × (10^6 / (60 × n))</div>
            <div>P = X × Fr + Y × Fa</div>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<style scoped>
.latex-report-page{max-width:1000px;margin:0 auto}
.toolbar{background:#004d40;padding:6px 16px;display:flex;justify-content:space-between;align-items:center;color:white;border-radius:4px;margin-bottom:16px}
.brand{font-weight:bold;font-size:16px;letter-spacing:1px}.brand small{font-weight:normal;font-size:10px;opacity:.8;margin-left:8px}
.content-body{background:#fff;border-radius:8px;padding:16px}
</style>
