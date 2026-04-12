<script setup lang="ts">
/**
 * ProjectCenterPage - 项目中心页面
 * 项目保存/打开/管理，版本追踪
 * Section 4.1.C, 5.1
 */
import { ref, computed, onMounted } from 'vue'
import { 
  PlusOutlined, 
  FolderOpenOutlined, 
  SaveOutlined, 
  DeleteOutlined,
  DownloadOutlined,
  HistoryOutlined
} from '@ant-design/icons-vue'

interface Project {
  id: string
  name: string
  module: string
  createdAt: string
  updatedAt: string
  version: string
  inputSummary: string
  status: 'active' | 'archived'
}

const projects = ref<Project[]>([])
const showNewProjectModal = ref(false)
const newProjectName = ref('')
const selectedModule = ref('seals')

const moduleLabels: Record<string, string> = {
  seals: '密封圈',
  bearings: '轴承',
  bolts: '螺栓',
  tolerances: '公差配合',
}

onMounted(() => {
  // 从 localStorage 加载项目列表
  const saved = localStorage.getItem('mechbox-projects')
  if (saved) {
    try {
      projects.value = JSON.parse(saved)
    } catch (e) {
      projects.value = []
    }
  }
})

function saveProjects() {
  localStorage.setItem('mechbox-projects', JSON.stringify(projects.value))
}

function createProject() {
  if (!newProjectName.value) return
  
  const project: Project = {
    id: `proj_${Date.now()}`,
    name: newProjectName.value,
    module: selectedModule.value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
    inputSummary: '',
    status: 'active'
  }
  
  projects.value.unshift(project)
  saveProjects()
  showNewProjectModal.value = false
  newProjectName.value = ''
}

function openProject(project: Project) {
  // TODO: 加载项目数据到对应模块
  alert(`打开项目: ${project.name}\n模块: ${moduleLabels[project.module]}\n(项目加载功能正在开发中)`)
}

function deleteProject(id: string) {
  if (window.confirm('确定要删除此项目吗？')) {
    projects.value = projects.value.filter(p => p.id !== id)
    saveProjects()
  }
}

function exportProject(project: Project) {
  const data = {
    projectName: project.name,
    module: project.module,
    version: project.version,
    ruleVersion: 'GB-ISO-pack-2026.01',
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    // TODO: 添加实际计算数据
    input: {},
    output: {},
    snapshots: []
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.name.replace(/\s+/g, '_')}.mechbox`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="project-center-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>项目中心</small></div>
      <a-space>
        <a-button type="primary" size="small" @click="showNewProjectModal = true">
          <template #icon><PlusOutlined /></template>新建项目
        </a-button>
      </a-space>
    </div>

    <div class="content-body">
      <a-empty v-if="projects.length === 0" description="暂无项目，点击新建项目开始">
        <template #image>
          <FolderOpenOutlined style="font-size: 64px; color: #d9d9d9" />
        </template>
      </a-empty>

      <a-card v-else title="我的项目" size="small">
        <a-table
          :columns="[
            { title: '项目名称', dataIndex: 'name', key: 'name', width: '30%' },
            { title: '模块', dataIndex: 'module', key: 'module', width: '15%' },
            { title: '版本', dataIndex: 'version', key: 'version', width: '10%' },
            { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: '20%' },
            { title: '状态', dataIndex: 'status', key: 'status', width: '10%' },
            { title: '操作', key: 'actions', width: '15%' }
          ]"
          :data-source="projects"
          :pagination="{ pageSize: 10 }"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'module'">
              <a-tag color="blue">{{ moduleLabels[record.module] || record.module }}</a-tag>
            </template>
            <template v-if="column.key === 'createdAt'">
              {{ new Date(record.createdAt).toLocaleString() }}
            </template>
            <template v-if="column.key === 'status'">
              <a-badge :status="record.status === 'active' ? 'success' : 'default'" :text="record.status === 'active' ? '进行中' : '已归档'" />
            </template>
            <template v-if="column.key === 'actions'">
              <a-space>
                <a-button type="link" size="small" @click="openProject(record)">
                  <template #icon><FolderOpenOutlined /></template>打开
                </a-button>
                <a-button type="link" size="small" @click="exportProject(record)">
                  <template #icon><DownloadOutlined /></template>导出
                </a-button>
                <a-button type="link" danger size="small" @click="deleteProject(record.id)">
                  <template #icon><DeleteOutlined /></template>删除
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 新建项目对话框 -->
    <a-modal 
      v-model:open="showNewProjectModal" 
      title="新建项目"
      @ok="createProject"
      :ok-button-props="{ disabled: !newProjectName }"
    >
      <a-form layout="vertical">
        <a-form-item label="项目名称" required>
          <a-input v-model:value="newProjectName" placeholder="如：泵密封方案A" />
        </a-form-item>
        <a-form-item label="计算模块">
          <a-select v-model:value="selectedModule">
            <a-select-option value="seals">密封圈计算</a-select-option>
            <a-select-option value="bearings">轴承选型</a-select-option>
            <a-select-option value="bolts">螺栓连接</a-select-option>
            <a-select-option value="tolerances">公差配合</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.project-center-page {
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
</style>
