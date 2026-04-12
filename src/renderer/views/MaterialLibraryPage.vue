<script setup lang="ts">
/**
 * MaterialLibraryPage.vue - 材料库页面
 * 使用 V3 数据库 schema
 */
import { ref, computed, onMounted } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'

interface Material {
  material_id: string
  grade_code: string
  grade_name: string
  material_family: string
  product_form?: string
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
}

const materials = ref<Material[]>([])
const searchText = ref('')
const selectedCategory = ref('all')
const selectedMaterial = ref<Material | null>(null)

onMounted(async () => {
  try {
    materials.value = await window.electron.db.queryMaterials()
  } catch (err) {
    console.error('Failed to load materials:', err)
  }
})

const categoryOptions = [
  { value: 'all', label: '全部材料' },
  { value: 'structural_steel', label: '结构钢' },
  { value: 'stainless_steel', label: '不锈钢' },
  { value: 'aluminum', label: '铝合金' },
  { value: 'copper', label: '铜材' },
  { value: 'cast_iron', label: '铸铁' },
]

const filteredMaterials = computed(() => {
  let result = materials.value
  if (selectedCategory.value !== 'all') {
    result = result.filter(m => m.material_family === selectedCategory.value)
  }
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(m => 
      m.grade_code.toLowerCase().includes(search) ||
      m.grade_name.includes(search) ||
      (m.notes && m.notes.toLowerCase().includes(search))
    )
  }
  return result
})

function selectMaterial(mat: Material) {
  selectedMaterial.value = mat
}
</script>

<template>
  <div class="material-library-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>材料库</small></div>
    </div>

    <div class="content-body">
      <a-row :gutter="16">
        <a-col :span="14">
          <a-card title="材料筛选" size="small">
            <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item label="材料类别">
                  <a-select v-model:value="selectedCategory" style="width: 100%">
                    <a-select-option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="搜索">
                  <a-input v-model:value="searchText" placeholder="搜索牌号、名称、备注">
                    <template #prefix><SearchOutlined /></template>
                  </a-input>
                </a-form-item>
              </a-col>
            </a-row>
          </a-card>

          <a-card :title="`材料列表 (${filteredMaterials.length}种)`" size="small" style="margin-top: 16px">
            <a-table
              :columns="[
                { title: '牌号', dataIndex: 'grade_code', key: 'grade_code', width: '22%' },
                { title: '名称', dataIndex: 'grade_name', key: 'grade_name', width: '28%' },
                { title: '类别', dataIndex: 'material_family', key: 'material_family', width: '20%' },
                { title: '屈服强度', dataIndex: 'yield_strength', key: 'yield_strength', width: '15%' },
                { title: '状态', dataIndex: 'heat_treatment_state', key: 'heat_treatment_state', width: '15%' }
              ]"
              :data-source="filteredMaterials"
              :pagination="false"
              size="small"
              :row-class-name="(record: any) => selectedMaterial?.material_id === record.material_id ? 'selected-row' : ''"
              @click="selectMaterial"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'yield_strength'">
                  {{ record.yield_strength }} MPa
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>

        <a-col :span="10">
          <a-card v-if="selectedMaterial" title="材料详情" size="small">
            <a-descriptions bordered size="small" :column="1">
              <a-descriptions-item label="牌号">{{ selectedMaterial.grade_code }}</a-descriptions-item>
              <a-descriptions-item label="名称">{{ selectedMaterial.grade_name }}</a-descriptions-item>
              <a-descriptions-item label="类别">{{ selectedMaterial.material_family }}</a-descriptions-item>
              <a-descriptions-item label="热处理状态">
                <a-tag color="green" v-if="selectedMaterial.heat_treatment_state">{{ selectedMaterial.heat_treatment_state }}</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="密度">{{ selectedMaterial.density }} g/cm³</a-descriptions-item>
              <a-descriptions-item label="弹性模量 E">{{ selectedMaterial.elastic_modulus }} MPa</a-descriptions-item>
              <a-descriptions-item label="剪切模量 G">{{ selectedMaterial.shear_modulus }} MPa</a-descriptions-item>
              <a-descriptions-item label="屈服强度">{{ selectedMaterial.yield_strength }} MPa</a-descriptions-item>
              <a-descriptions-item label="抗拉强度">{{ selectedMaterial.tensile_strength }} MPa</a-descriptions-item>
              <a-descriptions-item label="延伸率">{{ selectedMaterial.elongation }}%</a-descriptions-item>
              <a-descriptions-item label="使用温度">
                {{ selectedMaterial.temp_min }}°C ~ {{ selectedMaterial.temp_max }}°C
              </a-descriptions-item>
              <a-descriptions-item label="备注" v-if="selectedMaterial.notes">
                {{ selectedMaterial.notes }}
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
          <a-empty v-else description="请在左侧列表选择材料查看详情" />
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.material-library-page {
  max-width: 1200px;
  margin: 0 auto;
}

.toolbar {
  background: #004d40;
  padding: 6px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  border-radius: 4px;
  margin-bottom: 16px;
}

.brand {
  font-weight: bold;
  font-size: 16px;
  letter-spacing: 1px;
}

.brand small {
  font-weight: normal;
  font-size: 10px;
  opacity: 0.8;
  margin-left: 8px;
}

.content-body {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.selected-row {
  background: #e6f7ff !important;
}

:deep(.ant-table-tbody > tr) {
  cursor: pointer;
}
</style>
