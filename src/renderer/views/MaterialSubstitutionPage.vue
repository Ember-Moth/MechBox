<script setup lang="ts">
/**
 * MaterialSubstitutionPage.vue - 跨国材料代换指南
 * 性能匹配推荐 (Section 5.6)
 */
import { ref, computed } from 'vue'
import { FilePdfOutlined } from '@ant-design/icons-vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// 材料数据库 - 多国标准对照 + 性能参数
const materialDB = [
  { category: '结构钢', gb: 'Q235B', astm: 'A36', din: 'St37-2', jis: 'SS400', yield: 235, tensile: 370, elongation: 26, density: 7.85, notes: '普通结构' },
  { category: '结构钢', gb: '45#', astm: '1045', din: 'C45', jis: 'S45C', yield: 355, tensile: 600, elongation: 16, density: 7.85, notes: '优质碳素钢' },
  { category: '合金钢', gb: '40Cr', astm: '5140', din: '41Cr4', jis: 'SCr440', yield: 785, tensile: 980, elongation: 9, density: 7.85, notes: '合金结构钢' },
  { category: '不锈钢', gb: '06Cr19Ni10', astm: '304', din: '1.4301', jis: 'SUS304', yield: 205, tensile: 515, elongation: 40, density: 7.93, notes: '奥氏体不锈钢' },
  { category: '不锈钢', gb: '022Cr17Ni12Mo2', astm: '316L', din: '1.4404', jis: 'SUS316L', yield: 170, tensile: 485, elongation: 40, density: 7.98, notes: '含Mo不锈钢' },
  { category: '铝合金', gb: '6061-T6', astm: '6061-T6', din: 'AlMgSi1Cu-T6', jis: 'A6061-T6', yield: 276, tensile: 310, elongation: 12, density: 2.70, notes: '通用铝合金' },
  { category: '黄铜', gb: 'H62', astm: 'C27000', din: 'CuZn37', jis: 'C2720', yield: 160, tensile: 340, elongation: 45, density: 8.50, notes: '普通黄铜' },
  { category: '铸铁', gb: 'HT250', astm: 'Class 35', din: 'GG-25', jis: 'FC250', yield: 250, tensile: 250, elongation: 0.5, density: 7.20, notes: '灰铸铁' },
]

const selectedMaterial = ref('Q235B')
const targetCountry = ref('ASTM')

const currentMat = computed(() => materialDB.find(m => m.gb === selectedMaterial.value || m.astm === selectedMaterial.value))

// 查找最接近的代换材料 (基于屈服强度差异)
const substitutions = computed(() => {
  if (!currentMat.value) return []
  const mat = currentMat.value
  const targetKey = targetCountry.value.toLowerCase()
  
  return materialDB
    .filter(m => m[targetKey as keyof typeof m] && m[targetKey as keyof typeof m] !== mat[targetKey as keyof typeof m])
    .map(m => ({
      ...m,
      yieldDiff: ((m.yield - mat.yield) / mat.yield * 100).toFixed(1),
      tensileDiff: ((m.tensile - mat.tensile) / mat.tensile * 100).toFixed(1),
      matchScore: 100 - Math.abs(m.yield - mat.yield) / mat.yield * 100
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5)
})

async function exportPDF() {
  const el = document.querySelector('.material-substitution-page') as HTMLElement
  if (!el) return
  const c = await html2canvas(el, { scale: 2 })
  const pdf = new jsPDF('p', 'mm', 'a4')
  pdf.addImage(c.toDataURL('image/png'), 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), c.height * pdf.internal.pageSize.getWidth() / c.width)
  pdf.save(`material-substitution-${selectedMaterial.value}-${Date.now()}.pdf`)
}
</script>

<template>
  <div class="material-substitution-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>跨国材料代换指南</small></div>
      <a-button size="small" type="primary" @click="exportPDF"><template #icon><FilePdfOutlined /></template>导出PDF</a-button>
    </div>

    <div class="content-body">
      <a-card title="选择原材料" size="small">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="当前材料">
              <a-select v-model:value="selectedMaterial" style="width:100%">
                <a-select-option v-for="m in materialDB" :key="m.gb" :value="m.gb">{{ m.gb }} ({{ m.category }})</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="目标标准">
              <a-select v-model:value="targetCountry" style="width:100%">
                <a-select-option value="ASTM">美标 ASTM</a-select-option>
                <a-select-option value="DIN">德标 DIN</a-select-option>
                <a-select-option value="JIS">日标 JIS</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <a-card title="材料性能对比" size="small" style="margin-top: 16px" v-if="currentMat">
        <a-descriptions bordered size="small" :column="3">
          <a-descriptions-item label="国标">{{ currentMat.gb }}</a-descriptions-item>
          <a-descriptions-item label="美标">{{ currentMat.astm }}</a-descriptions-item>
          <a-descriptions-item label="德标">{{ currentMat.din }}</a-descriptions-item>
          <a-descriptions-item label="日标">{{ currentMat.jis }}</a-descriptions-item>
          <a-descriptions-item label="屈服强度">{{ currentMat.yield }} MPa</a-descriptions-item>
          <a-descriptions-item label="抗拉强度">{{ currentMat.tensile }} MPa</a-descriptions-item>
          <a-descriptions-item label="延伸率">{{ currentMat.elongation }}%</a-descriptions-item>
          <a-descriptions-item label="密度">{{ currentMat.density }} g/cm³</a-descriptions-item>
          <a-descriptions-item label="备注">{{ currentMat.notes }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card title="推荐代换材料" size="small" style="margin-top: 16px">
        <a-table
          :columns="[
            { title: '匹配度', dataIndex: 'matchScore', key: 'matchScore', width: '12%' },
            { title: targetCountry, dataIndex: 'target', key: 'target', width: '20%' },
            { title: '国标对应', dataIndex: 'gb', key: 'gb', width: '18%' },
            { title: '屈服差异', dataIndex: 'yieldDiff', key: 'yieldDiff', width: '15%' },
            { title: '抗拉差异', dataIndex: 'tensileDiff', key: 'tensileDiff', width: '15%' },
            { title: '备注', dataIndex: 'notes', key: 'notes', width: '20%' }
          ]"
          :data-source="substitutions.map(s => ({
            ...s,
            target: s[targetCountry.toLowerCase() as keyof typeof s],
          }))"
          :pagination="false"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'matchScore'">
              <a-tag :color="record.matchScore > 90 ? 'green' : record.matchScore > 70 ? 'orange' : 'red'">
                {{ record.matchScore?.toFixed(0) }}%
              </a-tag>
            </template>
            <template v-if="column.key === 'yieldDiff'">
              <span :style="{ color: Math.abs(Number(record.yieldDiff)) > 20 ? '#ef4444' : Math.abs(Number(record.yieldDiff)) > 10 ? '#f59e0b' : '#22c55e' }">
                {{ record.yieldDiff > 0 ? '+' : '' }}{{ record.yieldDiff }}%
              </span>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>
  </div>
</template>

<style scoped>
.material-substitution-page{max-width:1200px;margin:0 auto}
.toolbar{background:#004d40;padding:6px 16px;display:flex;justify-content:space-between;align-items:center;color:white;border-radius:4px;margin-bottom:16px}
.brand{font-weight:bold;font-size:16px;letter-spacing:1px}.brand small{font-weight:normal;font-size:10px;opacity:.8;margin-left:8px}
.content-body{background:#fff;border-radius:8px;padding:16px}
</style>
