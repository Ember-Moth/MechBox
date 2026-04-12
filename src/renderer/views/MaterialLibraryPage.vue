<script setup lang="ts">
/**
 * MaterialLibraryPage - 材料库页面
 * 常见钢材、铝材、铜材、工程塑料、橡胶
 * 基础物性、使用温度、常见应用
 */
import { ref, computed } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'

interface Material {
  id: string
  category: string
  designation: string
  name_zh: string
  density: number  // g/cm³
  E: number        // MPa (弹性模量)
  G: number        // MPa (剪切模量)
  yield_strength: number  // MPa
  tensile_strength: number // MPa
  elongation: number  // %
  temp_min?: number  // °C
  temp_max?: number  // °C
  applications: string[]
  notes?: string
}

const materials: Material[] = [
  // 结构钢
  {
    id: 'q235b',
    category: 'structural_steel',
    designation: 'Q235B',
    name_zh: '碳素结构钢 Q235B',
    standard_ref: 'GB/T 700-2006',
    condition: '热轧态',
    density: 7.85,
    E: 206000,
    G: 79000,
    yield_strength: 235,
    tensile_strength: 370,
    elongation: 26,
    temp_min: -20,
    temp_max: 400,
    applications: ['一般结构', '焊接结构', '螺栓', '法兰'],
    notes: '最常用的普通结构钢，良好的焊接性和塑性'
  },
  {
    id: '45steel',
    category: 'structural_steel',
    designation: '45#',
    name_zh: '优质碳素结构钢 45#',
    standard_ref: 'GB/T 699-2015',
    condition: '调质态',
    density: 7.85,
    E: 206000,
    G: 79000,
    yield_strength: 355,
    tensile_strength: 600,
    elongation: 16,
    temp_min: -20,
    temp_max: 450,
    applications: ['轴类', '齿轮', '高强度结构件', '连杆'],
    notes: '调质处理后综合力学性能好，注意正火态屈服强度约 280MPa'
  },
  {
    id: '40cr',
    category: 'structural_steel',
    designation: '40Cr',
    name_zh: '合金结构钢 40Cr',
    standard_ref: 'GB/T 3077-2015',
    condition: '调质态',
    density: 7.85,
    E: 206000,
    G: 79000,
    yield_strength: 785,
    tensile_strength: 980,
    elongation: 9,
    temp_min: -20,
    temp_max: 500,
    applications: ['重载轴', '齿轮', '重要零件', '高强度螺栓'],
    notes: '合金结构钢，淬透性好，强度高'
  },
  // 不锈钢
  {
    id: '304',
    category: 'stainless_steel',
    designation: '06Cr19Ni10 (304)',
    name_zh: '奥氏体不锈钢 304',
    standard_ref: 'GB/T 20878-2007',
    condition: '固溶态',
    density: 7.93,
    E: 193000,
    G: 73000,
    yield_strength: 205,
    tensile_strength: 515,
    elongation: 40,
    temp_min: -196,
    temp_max: 800,
    applications: ['食品设备', '化工设备', '医疗器械', '装饰'],
    notes: '最常用的不锈钢，耐腐蚀性好'
  },
  {
    id: '316l',
    category: 'stainless_steel',
    designation: '022Cr17Ni12Mo2 (316L)',
    name_zh: '奥氏体不锈钢 316L',
    standard_ref: 'GB/T 20878-2007',
    condition: '固溶态',
    density: 7.98,
    E: 193000,
    G: 73000,
    yield_strength: 170,
    tensile_strength: 485,
    elongation: 40,
    temp_min: -196,
    temp_max: 800,
    applications: ['海洋环境', '化工设备', '医疗器械'],
    notes: '含Mo，耐点蚀性能优于304'
  },
  // 铝材
  {
    id: '6061',
    category: 'aluminum',
    designation: '6061-T6',
    name_zh: '铝合金 6061-T6',
    standard_ref: 'GB/T 3190-2008',
    condition: 'T6 固溶+人工时效',
    density: 2.70,
    E: 68900,
    G: 26000,
    yield_strength: 276,
    tensile_strength: 310,
    elongation: 12,
    temp_min: -50,
    temp_max: 150,
    applications: ['航空航天', '汽车零件', '自行车架', '一般结构'],
    notes: '最常用的铝合金，良好的综合性能'
  },
  // 铜材
  {
    id: 'h62',
    category: 'copper',
    designation: 'H62',
    name_zh: '黄铜 H62',
    standard_ref: 'GB/T 5231-2012',
    condition: 'H 硬态',
    density: 8.50,
    E: 100000,
    G: 40000,
    yield_strength: 160,
    tensile_strength: 340,
    elongation: 45,
    temp_min: -50,
    temp_max: 200,
    applications: ['垫圈', '弹簧', '散热器', '阀门零件'],
    notes: '常用黄铜，良好的加工性和耐蚀性'
  },
  // 铸铁
  {
    id: 'ht250',
    category: 'cast_iron',
    designation: 'HT250',
    name_zh: '灰铸铁 HT250',
    standard_ref: 'GB/T 9439-2010',
    condition: '铸态',
    density: 7.20,
    E: 110000,
    G: 44000,
    yield_strength: 250,
    tensile_strength: 250,
    elongation: 0.5,
    temp_min: -20,
    temp_max: 300,
    applications: ['机床床身', '气缸', '减速器壳体', '底座'],
    notes: '铸造性能好，减振性好，但塑性差'
  },
]

const categoryOptions = [
  { value: 'all', label: '全部材料' },
  { value: 'structural_steel', label: '结构钢' },
  { value: 'stainless_steel', label: '不锈钢' },
  { value: 'aluminum', label: '铝合金' },
  { value: 'copper', label: '铜材' },
  { value: 'cast_iron', label: '铸铁' },
]

const selectedCategory = ref('all')
const searchText = ref('')
const selectedMaterial = ref<Material | null>(null)

const filteredMaterials = computed(() => {
  let result = materials
  if (selectedCategory.value !== 'all') {
    result = result.filter(m => m.category === selectedCategory.value)
  }
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(m => 
      m.designation.toLowerCase().includes(search) ||
      m.name_zh.includes(search) ||
      m.applications.some(app => app.includes(search))
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
                  <a-input v-model:value="searchText" placeholder="搜索牌号、名称、应用">
                    <template #prefix><SearchOutlined /></template>
                  </a-input>
                </a-form-item>
              </a-col>
            </a-row>
          </a-card>

          <a-card :title="`材料列表 (${filteredMaterials.length}种)`" size="small" style="margin-top: 16px">
            <a-table
              :columns="[
                { title: '牌号', dataIndex: 'designation', key: 'designation', width: '22%' },
                { title: '名称', dataIndex: 'name_zh', key: 'name_zh', width: '28%' },
                { title: '标准号', dataIndex: 'standard_ref', key: 'standard_ref', width: '20%' },
                { title: '类别', dataIndex: 'category', key: 'category', width: '15%' },
                { title: '屈服强度', dataIndex: 'yield_strength', key: 'yield_strength', width: '15%' }
              ]"
              :data-source="filteredMaterials"
              :pagination="false"
              size="small"
              :row-class-name="(record: any) => selectedMaterial?.id === record.id ? 'selected-row' : ''"
              @click="selectMaterial"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'category'">
                  <a-tag size="small">{{ categoryOptions.find(o => o.value === record.category)?.label }}</a-tag>
                </template>
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
              <a-descriptions-item label="牌号">{{ selectedMaterial.designation }}</a-descriptions-item>
              <a-descriptions-item label="名称">{{ selectedMaterial.name_zh }}</a-descriptions-item>
              <a-descriptions-item label="标准号">
                <a-tag color="blue" v-if="selectedMaterial.standard_ref">{{ selectedMaterial.standard_ref }}</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="热处理状态">
                <a-tag color="green" v-if="selectedMaterial.condition">{{ selectedMaterial.condition }}</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="密度">{{ selectedMaterial.density }} g/cm³</a-descriptions-item>
              <a-descriptions-item label="弹性模量 E">{{ selectedMaterial.E }} MPa</a-descriptions-item>
              <a-descriptions-item label="剪切模量 G">{{ selectedMaterial.G }} MPa</a-descriptions-item>
              <a-descriptions-item label="屈服强度">{{ selectedMaterial.yield_strength }} MPa</a-descriptions-item>
              <a-descriptions-item label="抗拉强度">{{ selectedMaterial.tensile_strength }} MPa</a-descriptions-item>
              <a-descriptions-item label="延伸率">{{ selectedMaterial.elongation }}%</a-descriptions-item>
              <a-descriptions-item label="使用温度">
                {{ selectedMaterial.temp_min }}°C ~ {{ selectedMaterial.temp_max }}°C
              </a-descriptions-item>
              <a-descriptions-item label="典型应用">
                <a-space wrap>
                  <a-tag v-for="app in selectedMaterial.applications" :key="app" color="blue">{{ app }}</a-tag>
                </a-space>
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
  max-width: 1400px;
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
