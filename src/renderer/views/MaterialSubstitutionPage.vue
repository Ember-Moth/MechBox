<script setup lang="ts">
/**
 * MaterialSubstitutionPage.vue - 跨国材料代换指南
 * 性能匹配推荐 (Section 5.6) - 从数据库查询
 */
import { ref, computed, onMounted } from 'vue'
import { FilePdfOutlined } from '@ant-design/icons-vue'
import { usePdfExport } from '../composables/usePdfExport'


interface MaterialRecord {
  material_id: string
  grade_code: string
  grade_name: string
  material_family: string
  heat_treatment_state?: string
  density: number
  elastic_modulus: number
  shear_modulus?: number
  yield_strength: number
  tensile_strength: number
  elongation?: number
  temp_min?: number
  temp_max?: number
  notes?: string
  external_system_code?: string
  external_grade_code?: string
  equivalence_level?: string
}

const materials = ref<MaterialRecord[]>([])
const selectedMaterial = ref('')
const targetCountry = ref('external_system_code')

onMounted(async () => {
  try {
    const mats = await window.electron.db.queryMaterials()
    materials.value = mats || []
    if (materials.value.length > 0) {
      selectedMaterial.value = materials.value[0].material_id
    }
  } catch (err) {
    console.error('Failed to load materials:', err)
  }
})

const currentMat = computed(() => materials.value.find(m => m.material_id === selectedMaterial.value))

// 查找代换材料 (基于屈服强度差异)
const substitutions = computed(() => {
  if (!currentMat.value) return []
  const mat = currentMat.value
  
  // Prevent division by zero
  if (mat.yield_strength === 0 || mat.tensile_strength === 0) return []

  return materials.value
    .filter(m => m.material_id !== mat.material_id)
    .map(m => ({
      ...m,
      yieldDiff: ((m.yield_strength - mat.yield_strength) / mat.yield_strength * 100).toFixed(1),
      tensileDiff: ((m.tensile_strength - mat.tensile_strength) / mat.tensile_strength * 100).toFixed(1),
      matchScore: 100 - Math.abs(m.yield_strength - mat.yield_strength) / mat.yield_strength * 100
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5)
})

const { isExporting, exportPdf } = usePdfExport()

async function handleExportPdf() {
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
      <a-button size="small" type="primary" @click="handleExportPdf"><template #icon><FilePdfOutlined /></template>导出PDF</a-button>
    </div>

    <div class="content-body">
      <a-card title="选择原材料" size="small">
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="当前材料">
              <a-select v-model:value="selectedMaterial" style="width:100%">
                <a-select-option v-for="m in materials" :key="m.material_id" :value="m.material_id">{{ m.grade_code }} ({{ m.material_family }})</a-select-option>
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
          <a-descriptions-item label="牌号">{{ currentMat.grade_code }}</a-descriptions-item>
          <a-descriptions-item label="名称">{{ currentMat.grade_name }}</a-descriptions-item>
          <a-descriptions-item label="类别">{{ currentMat.material_family }}</a-descriptions-item>
          <a-descriptions-item label="热处理状态">{{ currentMat.heat_treatment_state || '—' }}</a-descriptions-item>
          <a-descriptions-item label="屈服强度">{{ currentMat.yield_strength }} MPa</a-descriptions-item>
          <a-descriptions-item label="抗拉强度">{{ currentMat.tensile_strength }} MPa</a-descriptions-item>
          <a-descriptions-item label="延伸率">{{ currentMat.elongation ?? '—' }}%</a-descriptions-item>
          <a-descriptions-item label="密度">{{ currentMat.density }} g/cm³</a-descriptions-item>
          <a-descriptions-item label="弹性模量">{{ currentMat.elastic_modulus }} MPa</a-descriptions-item>
          <a-descriptions-item label="使用温度">{{ currentMat.temp_min ?? '—' }}°C ~ {{ currentMat.temp_max ?? '—' }}°C</a-descriptions-item>
          <a-descriptions-item label="备注" :span="3">{{ currentMat.notes }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card title="推荐代换材料" size="small" style="margin-top: 16px">
        <a-table
          :columns="[
            { title: '匹配度', dataIndex: 'matchScore', key: 'matchScore', width: '12%' },
            { title: '牌号', dataIndex: 'grade_code', key: 'grade_code', width: '18%' },
            { title: '名称', dataIndex: 'grade_name', key: 'grade_name', width: '20%' },
            { title: '屈服差异', dataIndex: 'yieldDiff', key: 'yieldDiff', width: '15%' },
            { title: '抗拉差异', dataIndex: 'tensileDiff', key: 'tensileDiff', width: '15%' },
            { title: '类别', dataIndex: 'material_family', key: 'material_family', width: '12%' },
            { title: '备注', dataIndex: 'notes', key: 'notes', width: '8%' }
          ]"
          :data-source="substitutions"
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
</style>
