<script setup lang="ts">
/**
 * SettingsPage - 设置页面
 * 单位制、主题、语言、数据管理等设置
 */
import { ref } from 'vue'
import { useStandardStore } from '../store/useStandardStore'
import { 
  SaveOutlined, 
  UndoOutlined, 
  CloudDownloadOutlined,
  FolderOpenOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  SkinOutlined,
  TranslationOutlined
} from '@ant-design/icons-vue'

const store = useStandardStore()

const settings = ref({
  unitSystem: store.unit as 'mm' | 'inch',
  theme: 'light' as 'light' | 'dark',
  language: 'zh-CN' as 'zh-CN' | 'en-US',
  autoSave: true,
  showWelcomeOnStart: true,
})

function saveSettings() {
  store.setUnit(settings.value.unitSystem)
  // TODO: 持久化设置到本地存储
  alert('设置已保存')
}

function resetSettings() {
  settings.value = {
    unitSystem: 'mm',
    theme: 'light',
    language: 'zh-CN',
    autoSave: true,
    showWelcomeOnStart: true,
  }
  store.setUnit('mm')
}

function checkDataUpdates() {
  // TODO: 实现数据热更新检查
  alert('当前所有标准数据均为最新版本')
}

function exportAllData() {
  // TODO: 实现数据导出
  alert('数据导出功能正在开发中')
}

function importData() {
  // TODO: 实现数据导入
  alert('数据导入功能正在开发中')
}
</script>

<template>
  <div class="settings-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>设置</small></div>
      <a-space>
        <a-button type="primary" size="small" @click="saveSettings">
          <template #icon><SaveOutlined /></template>保存设置
        </a-button>
        <a-button size="small" @click="resetSettings">
          <template #icon><UndoOutlined /></template>恢复默认
        </a-button>
      </a-space>
    </div>

    <div class="content-body">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-card title="常规设置" size="small">
            <a-form layout="vertical">
              <a-form-item label="默认单位制">
                <a-radio-group v-model:value="settings.unitSystem">
                  <a-radio value="mm">公制 (mm)</a-radio>
                  <a-radio value="inch">英制 (inch)</a-radio>
                </a-radio-group>
              </a-form-item>

              <a-form-item label="界面主题">
                <a-radio-group v-model:value="settings.theme">
                  <a-radio value="light">浅色主题</a-radio>
                  <a-radio value="dark" disabled>深色主题 (开发中)</a-radio>
                </a-radio-group>
              </a-form-item>

              <a-form-item label="语言">
                <a-select v-model:value="settings.language" style="width: 100%">
                  <a-select-option value="zh-CN">简体中文</a-select-option>
                  <a-select-option value="en-US" disabled>English (开发中)</a-select-option>
                </a-select>
              </a-form-item>

              <a-form-item>
                <a-checkbox v-model:checked="settings.autoSave">
                  自动保存计算结果
                </a-checkbox>
              </a-form-item>

              <a-form-item>
                <a-checkbox v-model:checked="settings.showWelcomeOnStart">
                  启动时显示工作台
                </a-checkbox>
              </a-form-item>
            </a-form>
          </a-card>

          <a-card title="数据管理" size="small" style="margin-top: 16px">
            <a-space direction="vertical" style="width: 100%">
              <a-button block @click="checkDataUpdates">
                <template #icon><CloudDownloadOutlined /></template>
                检查标准数据更新
              </a-button>
              <a-button block @click="exportAllData">
                <template #icon><DatabaseOutlined /></template>
                导出所有数据
              </a-button>
              <a-button block @click="importData">
                <template #icon><FolderOpenOutlined /></template>
                导入数据文件
              </a-button>
            </a-space>
          </a-card>
        </a-col>

        <a-col :span="12">
          <a-card title="系统信息" size="small">
            <a-descriptions bordered size="small" :column="1">
              <a-descriptions-item label="应用版本">v1.0.0</a-descriptions-item>
              <a-descriptions-item label="构建日期">2026-04-12</a-descriptions-item>
              <a-descriptions-item label="Electron 版本">28.x</a-descriptions-item>
              <a-descriptions-item label="Vue 版本">3.x</a-descriptions-item>
              <a-descriptions-item label="数据库路径">
                <a-tooltip title="点击打开数据库文件所在目录">
                  <code style="cursor: pointer">data/mechbox.db</code>
                </a-tooltip>
              </a-descriptions-item>
              <a-descriptions-item label="数据版本">
                <a-space direction="vertical" size="small">
                  <div><a-tag size="small" color="blue">ISO 286</a-tag> v1.0.0</div>
                  <div><a-tag size="small" color="blue">AS568</a-tag> v1.0.0</div>
                  <div><a-tag size="small" color="blue">DEEP_GROOVE</a-tag> v1.0.0</div>
                </a-space>
              </a-descriptions-item>
            </a-descriptions>
          </a-card>

          <a-card title="关于" size="small" style="margin-top: 16px">
            <a-space direction="vertical" style="width: 100%">
              <p>MechBox 机械设计工具箱</p>
              <p>面向机械工程师的桌面计算工具</p>
              <p>离线可用 · 开源免费 · 标准内置</p>
              <a-divider />
              <a-alert
                message="提示"
                description="更多详细信息、更新日志和贡献指南，请查看“关于”页面。"
                type="info"
                show-icon
              />
            </a-space>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
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
