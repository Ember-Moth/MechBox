<script setup lang="ts">
/**
 * StandardPartsLibraryPage - 标准件库页面
 * 轴承、O型圈、螺栓、键、销、挡圈等多国标准速查
 * Section 6.4.3, 5.6
 */
import { ref, computed } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'

const activeTab = ref('bearings')

// 轴承数据
const bearingData = ref([
  { designation: '6005', d: 25, D: 47, B: 12, C_r: 11.9, C_0r: 6.55, brands: 'SKF/NSK/FAG/NTN' },
  { designation: '6205', d: 25, D: 52, B: 15, C_r: 14.0, C_0r: 7.85, brands: 'SKF/NSK/FAG/NTN' },
  { designation: '6305', d: 25, D: 62, B: 17, C_r: 22.5, C_0r: 11.6, brands: 'SKF/NSK/FAG/NTN' },
  { designation: '6006', d: 30, D: 55, B: 13, C_r: 13.2, C_0r: 8.3, brands: 'SKF/NSK/FAG' },
  { designation: '6206', d: 30, D: 62, B: 16, C_r: 19.5, C_0r: 11.3, brands: 'SKF/NSK/FAG' },
  { designation: '6306', d: 30, D: 72, B: 19, C_r: 28.5, C_0r: 14.8, brands: 'SKF/NSK/FAG' },
  { designation: '6008', d: 40, D: 68, B: 15, C_r: 16.8, C_0r: 11.2, brands: 'SKF/NSK/FAG' },
  { designation: '6208', d: 40, D: 80, B: 18, C_r: 29.1, C_0r: 17.8, brands: 'SKF/NSK/FAG' },
  { designation: '6308', d: 40, D: 90, B: 23, C_r: 40.5, C_0r: 24.0, brands: 'SKF/NSK/FAG' },
  { designation: '6010', d: 50, D: 80, B: 16, C_r: 21.2, C_0r: 14.6, brands: 'SKF/NSK/FAG' },
  { designation: '6210', d: 50, D: 90, B: 20, C_r: 35.1, C_0r: 23.2, brands: 'SKF/NSK/FAG' },
  { designation: '6310', d: 50, D: 110, B: 27, C_r: 61.8, C_0r: 38.0, brands: 'SKF/NSK/FAG' },
])

// 螺纹标准对照表
const threadStandards = ref([
  { type: '公制粗牙', example: 'M10', major: 10, pitch: 1.5, minor: 8.376, drill: 8.5, standard: 'GB/T 196' },
  { type: '公制粗牙', example: 'M12', major: 12, pitch: 1.75, minor: 10.106, drill: 10.2, standard: 'GB/T 196' },
  { type: '公制粗牙', example: 'M16', major: 16, pitch: 2.0, minor: 13.835, drill: 14, standard: 'GB/T 196' },
  { type: '美制统一螺纹', example: '1/4-20 UNC', major: 6.35, pitch: 1.27, minor: 4.98, drill: 5.1, standard: 'ASME B1.1' },
  { type: '美制统一螺纹', example: '3/8-16 UNC', major: 9.525, pitch: 1.588, minor: 7.79, drill: 7.9, standard: 'ASME B1.1' },
  { type: '英制管螺纹', example: 'G 1/4', major: 13.16, pitch: 1.337, minor: 11.45, drill: 11.5, standard: 'ISO 228' },
  { type: '英制管螺纹', example: 'G 3/8', major: 16.66, pitch: 1.337, minor: 14.95, drill: 15, standard: 'ISO 228' },
  { type: '美制锥管螺纹', example: 'NPT 1/4', major: 13.72, pitch: 1.411, minor: 11.62, drill: 11.5, standard: 'ASME B1.20.1' },
])

// 材料牌号对照表
const materialEquivalents = ref([
  { category: '结构钢', gb: 'Q235B', astm: 'A36', din: 'St37-2', jis: 'SS400', notes: '普通结构' },
  { category: '结构钢', gb: '45#', astm: '1045', din: 'C45', jis: 'S45C', notes: '优质碳素钢' },
  { category: '合金钢', gb: '40Cr', astm: '5140', din: '41Cr4', jis: 'SCr440', notes: '合金结构钢' },
  { category: '不锈钢', gb: '06Cr19Ni10', astm: '304', din: '1.4301', jis: 'SUS304', notes: '奥氏体不锈钢' },
  { category: '不锈钢', gb: '022Cr17Ni12Mo2', astm: '316L', din: '1.4404', jis: 'SUS316L', notes: '含Mo不锈钢' },
  { category: '铝合金', gb: '6061-T6', astm: '6061-T6', din: 'AlMgSi1Cu-T6', jis: 'A6061-T6', notes: '通用铝合金' },
  { category: '黄铜', gb: 'H62', astm: 'C27000', din: 'CuZn37', jis: 'C2720', notes: '普通黄铜' },
  { category: '铸铁', gb: 'HT250', astm: 'Class 35', din: 'GG-25', jis: 'FC250', notes: '灰铸铁' },
])

// 搜索过滤
const searchText = ref('')
const filteredBearings = computed(() => {
  if (!searchText.value) return bearingData.value
  const search = searchText.value.toLowerCase()
  return bearingData.value.filter(b => 
    b.designation.toLowerCase().includes(search) ||
    b.brands.toLowerCase().includes(search)
  )
})

const filteredThreads = computed(() => {
  if (!searchText.value) return threadStandards.value
  const search = searchText.value.toLowerCase()
  return threadStandards.value.filter(t => 
    t.type.toLowerCase().includes(search) ||
    t.example.toLowerCase().includes(search) ||
    t.standard.toLowerCase().includes(search)
  )
})

const filteredMaterials = computed(() => {
  if (!searchText.value) return materialEquivalents.value
  const search = searchText.value.toLowerCase()
  return materialEquivalents.value.filter(m => 
    m.category.toLowerCase().includes(search) ||
    m.gb.toLowerCase().includes(search) ||
    m.astm.toLowerCase().includes(search) ||
    m.din.toLowerCase().includes(search) ||
    m.jis.toLowerCase().includes(search)
  )
})
</script>

<template>
  <div class="standard-parts-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>标准件库</small></div>
      <a-input-search 
        v-model:value="searchText" 
        placeholder="搜索牌号、规格、标准号..."
        style="width: 300px"
        :prefix="SearchOutlined"
      />
    </div>

    <div class="content-body">
      <a-tabs v-model:activeKey="activeTab">
        <!-- 轴承 -->
        <a-tab-pane key="bearings" tab="轴承">
          <a-card title="深沟球轴承 (多品牌对比)" size="small">
            <a-table
              :columns="[
                { title: '型号', dataIndex: 'designation', key: 'designation', width: '15%' },
                { title: '内径 d', dataIndex: 'd', key: 'd', width: '12%' },
                { title: '外径 D', dataIndex: 'D', key: 'D', width: '12%' },
                { title: '宽度 B', dataIndex: 'B', key: 'B', width: '12%' },
                { title: '动载荷 Cr', dataIndex: 'C_r', key: 'C_r', width: '12%' },
                { title: '静载荷 C0r', dataIndex: 'C_0r', key: 'C_0r', width: '12%' },
                { title: '品牌', dataIndex: 'brands', key: 'brands', width: '25%' }
              ]"
              :data-source="filteredBearings"
              :pagination="{ pageSize: 10 }"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="['d', 'D', 'B'].includes(column.key)">
                  {{ record[column.key] }} mm
                </template>
                <template v-if="['C_r', 'C_0r'].includes(column.key)">
                  {{ record[column.key] }} kN
                </template>
                <template v-if="column.key === 'brands'">
                  <a-space wrap>
                    <a-tag v-for="brand in record.brands.split('/')" :key="brand" color="blue">{{ brand }}</a-tag>
                  </a-space>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-tab-pane>

        <!-- 螺纹标准 -->
        <a-tab-pane key="threads" tab="螺纹标准">
          <a-card title="多国螺纹标准对照" size="small">
            <a-table
              :columns="[
                { title: '制式', dataIndex: 'type', key: 'type', width: '18%' },
                { title: '规格', dataIndex: 'example', key: 'example', width: '18%' },
                { title: '大径 (mm)', dataIndex: 'major', key: 'major', width: '12%' },
                { title: '螺距 (mm)', dataIndex: 'pitch', key: 'pitch', width: '12%' },
                { title: '小径 (mm)', dataIndex: 'minor', key: 'minor', width: '12%' },
                { title: '底孔 (mm)', dataIndex: 'drill', key: 'drill', width: '12%' },
                { title: '标准号', dataIndex: 'standard', key: 'standard', width: '16%' }
              ]"
              :data-source="filteredThreads"
              :pagination="false"
              size="small"
            />
          </a-card>
        </a-tab-pane>

        <!-- 材料牌号对照 -->
        <a-tab-pane key="materials" tab="材料对照">
          <a-card title="跨国材料牌号互换速查" size="small">
            <a-table
              :columns="[
                { title: '类别', dataIndex: 'category', key: 'category', width: '12%' },
                { title: '国标 GB', dataIndex: 'gb', key: 'gb', width: '18%' },
                { title: '美标 ASTM', dataIndex: 'astm', key: 'astm', width: '16%' },
                { title: '德标 DIN', dataIndex: 'din', key: 'din', width: '16%' },
                { title: '日标 JIS', dataIndex: 'jis', key: 'jis', width: '16%' },
                { title: '备注', dataIndex: 'notes', key: 'notes', width: '22%' }
              ]"
              :data-source="filteredMaterials"
              :pagination="false"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'category'">
                  <a-tag size="small">{{ record.category }}</a-tag>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<style scoped>
.standard-parts-page {
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
</style>
