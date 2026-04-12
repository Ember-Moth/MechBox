<script setup lang="ts">
/**
 * StandardPartsLibraryPage.vue - 标准件库页面 (V3 Schema)
 * 包含：螺纹、螺母、垫圈、齿轮模数、O型圈材料等
 */
import { ref, onMounted, computed } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'

const activeTab = ref('threads')
const searchText = ref('')

// Data
const threads = ref<any[]>([])
const nuts = ref<any[]>([])
const washers = ref<any[]>([])
const gearModules = ref<any[]>([])
const oringMaterials = ref<any[]>([])
const manufacturers = ref<any[]>([])
const vendorParts = ref<any[]>([])

onMounted(async () => {
  try {
    const [t, n, w, g, om, m, vp] = await Promise.all([
      window.electron.db.queryThreads(),
      window.electron.db.queryNuts(),
      window.electron.db.queryWashers(),
      window.electron.db.queryGearModules(),
      window.electron.db.queryOringMaterials(),
      window.electron.db.queryManufacturers(),
      window.electron.db.queryVendorParts()
    ])
    threads.value = t || []
    nuts.value = n || []
    washers.value = w || []
    gearModules.value = g || []
    oringMaterials.value = om || []
    manufacturers.value = m || []
    vendorParts.value = vp || []
  } catch (err) {
    console.error('Failed to load standard parts:', err)
  }
})

const filteredThreads = computed(() => {
  if (!searchText.value) return threads.value
  const s = searchText.value.toLowerCase()
  return threads.value.filter(t => t.designation?.toLowerCase().includes(s))
})

const filteredNuts = computed(() => {
  if (!searchText.value) return nuts.value
  const s = searchText.value.toLowerCase()
  return nuts.value.filter(n => n.designation?.toLowerCase().includes(s))
})

const filteredWashers = computed(() => {
  if (!searchText.value) return washers.value
  const s = searchText.value.toLowerCase()
  return washers.value.filter(w => w.designation?.toLowerCase().includes(s))
})
</script>

<template>
  <div class="standard-parts-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>标准件库</small></div>
      <a-input-search v-model:value="searchText" placeholder="搜索规格..." style="width: 250px" :prefix-icon="SearchOutlined"/>
    </div>

    <div class="content-body">
      <a-tabs v-model:activeKey="activeTab">
        <!-- 螺纹 -->
        <a-tab-pane key="threads" tab="螺纹">
          <a-table :columns="[
            { title: '规格', dataIndex: 'designation', key: 'designation', width: '20%' },
            { title: '公称直径', dataIndex: 'nominal_d', key: 'nominal_d', width: '15%' },
            { title: '螺距', dataIndex: 'pitch', key: 'pitch', width: '12%' },
            { title: '大径', dataIndex: 'major_diameter', key: 'major_diameter', width: '12%' },
            { title: '中径', dataIndex: 'pitch_diameter', key: 'pitch_diameter', width: '12%' },
            { title: '小径', dataIndex: 'minor_diameter', key: 'minor_diameter', width: '12%' },
            { title: '底孔', dataIndex: 'tap_drill', key: 'tap_drill', width: '10%' },
            { title: '应力面积', dataIndex: 'stress_area', key: 'stress_area', width: '12%' }
          ]" :data-source="filteredThreads" :pagination="{ pageSize: 15 }" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="['nominal_d', 'pitch', 'major_diameter', 'pitch_diameter', 'minor_diameter', 'tap_drill', 'stress_area'].includes(column.key)">
                {{ record[column.key] ? record[column.key].toFixed(3) + ' mm' : '—' }}
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- 六角螺母 -->
        <a-tab-pane key="nuts" tab="六角螺母">
          <a-table :columns="[
            { title: '规格', dataIndex: 'designation', key: 'designation', width: '20%' },
            { title: '公称直径', dataIndex: 'nominal_d', key: 'nominal_d', width: '15%' },
            { title: '螺距', dataIndex: 'pitch', key: 'pitch', width: '12%' },
            { title: '对边宽度', dataIndex: 'width_s', key: 'width_s', width: '15%' },
            { title: '高度', dataIndex: 'height_m', key: 'height_m', width: '12%' },
            { title: '强度等级', dataIndex: 'strength_class', key: 'strength_class', width: '13%' },
            { title: '材料', dataIndex: 'material_code', key: 'material_code', width: '13%' }
          ]" :data-source="filteredNuts" :pagination="{ pageSize: 15 }" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="['nominal_d', 'pitch', 'width_s', 'height_m'].includes(column.key)">
                {{ record[column.key] ? record[column.key].toFixed(2) + ' mm' : '—' }}
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- 平垫圈 -->
        <a-tab-pane key="washers" tab="平垫圈">
          <a-table :columns="[
            { title: '规格', dataIndex: 'designation', key: 'designation', width: '20%' },
            { title: '公称直径', dataIndex: 'nominal_d', key: 'nominal_d', width: '15%' },
            { title: '内径', dataIndex: 'inner_diameter', key: 'inner_diameter', width: '15%' },
            { title: '外径', dataIndex: 'outer_diameter', key: 'outer_diameter', width: '15%' },
            { title: '厚度', dataIndex: 'thickness', key: 'thickness', width: '12%' },
            { title: '材料', dataIndex: 'material_code', key: 'material_code', width: '13%' },
            { title: '表面处理', dataIndex: 'finish_code', key: 'finish_code', width: '10%' }
          ]" :data-source="filteredWashers" :pagination="{ pageSize: 15 }" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="['nominal_d', 'inner_diameter', 'outer_diameter', 'thickness'].includes(column.key)">
                {{ record[column.key] ? record[column.key].toFixed(2) + ' mm' : '—' }}
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- 齿轮模数 -->
        <a-tab-pane key="gear-modules" tab="齿轮模数">
          <a-table :columns="[
            { title: '齿轮类型', dataIndex: 'gear_type', key: 'gear_type', width: '15%' },
            { title: '压力角', dataIndex: 'pressure_angle_deg', key: 'pressure_angle_deg', width: '15%' },
            { title: '螺旋角', dataIndex: 'helix_angle_deg', key: 'helix_angle_deg', width: '15%' },
            { title: '模数', dataIndex: 'module_value', key: 'module_value', width: '15%' },
            { title: '模数系统', dataIndex: 'module_system', key: 'module_system', width: '15%' },
            { title: '备注', dataIndex: 'note', key: 'note', width: '25%' }
          ]" :data-source="gearModules" :pagination="{ pageSize: 15 }" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'gear_type'">
                <a-tag color="blue">{{ record.gear_type === 'spur' ? '直齿轮' : (record.gear_type === 'helical' ? '斜齿轮' : record.gear_type) }}</a-tag>
              </template>
              <template v-if="['pressure_angle_deg', 'helix_angle_deg', 'module_value'].includes(column.key)">
                {{ record[column.key] ? record[column.key].toFixed(2) : '—' }}
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- O型圈材料 -->
        <a-tab-pane key="oring-materials" tab="O型圈材料">
          <a-table :columns="[
            { title: '材料代号', dataIndex: 'material_code', key: 'material_code', width: '15%' },
            { title: '材料名称', dataIndex: 'material_name', key: 'material_name', width: '20%' },
            { title: '硬度(Shore A)', dataIndex: 'hardness_shore_a', key: 'hardness_shore_a', width: '15%' },
            { title: '最低温度', dataIndex: 'temperature_min_c', key: 'temperature_min_c', width: '12%' },
            { title: '最高温度', dataIndex: 'temperature_max_c', key: 'temperature_max_c', width: '12%' },
            { title: '耐油性', dataIndex: 'oil_resistance_rating', key: 'oil_resistance_rating', width: '13%' },
            { title: '耐水性', dataIndex: 'water_resistance_rating', key: 'water_resistance_rating', width: '13%' }
          ]" :data-source="oringMaterials" :pagination="{ pageSize: 15 }" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="['temperature_min_c', 'temperature_max_c'].includes(column.key)">
                {{ record[column.key] !== null ? record[column.key] + ' °C' : '—' }}
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- 制造商 -->
        <a-tab-pane key="manufacturers" tab="制造商">
          <a-table :columns="[
            { title: '制造商名称', dataIndex: 'manufacturer_name', key: 'manufacturer_name', width: '35%' },
            { title: '国家', dataIndex: 'country_code', key: 'country_code', width: '15%' },
            { title: '官网', dataIndex: 'homepage_url', key: 'homepage_url', width: '25%' },
            { title: '备注', dataIndex: 'notes', key: 'notes', width: '25%' }
          ]" :data-source="manufacturers" :pagination="{ pageSize: 15 }" size="small"/>
        </a-tab-pane>

        <!-- 厂商零件目录 -->
        <a-tab-pane key="vendor-parts" tab="厂商零件">
          <a-table :columns="[
            { title: '零件号', dataIndex: 'vendor_part_number', key: 'vendor_part_number', width: '20%' },
            { title: '制造商', dataIndex: 'manufacturer_id', key: 'manufacturer_id', width: '15%' },
            { title: '领域', dataIndex: 'domain_code', key: 'domain_code', width: '12%' },
            { title: '描述', dataIndex: 'description', key: 'description', width: '25%' },
            { title: '状态', dataIndex: 'status', key: 'status', width: '13%' },
            { title: '产品链接', dataIndex: 'product_url', key: 'product_url', width: '15%' }
          ]" :data-source="vendorParts" :pagination="{ pageSize: 15 }" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'active' ? 'green' : (record.status === 'obsolete' ? 'red' : 'orange')">
                  {{ record.status }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<style scoped>
.standard-parts-page { max-width: 1400px; margin: 0 auto }
.toolbar { background: #004d40; padding: 6px 16px; display: flex; justify-content: space-between; align-items: center; color: white; border-radius: 4px; margin-bottom: 16px }
.brand { font-weight: bold; font-size: 16px; letter-spacing: 1px }
.brand small { font-weight: normal; font-size: 10px; opacity: 0.8; margin-left: 8px }
.content-body { background: #fff; border-radius: 8px; padding: 16px }
</style>
