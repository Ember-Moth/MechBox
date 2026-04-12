<script setup lang="ts">
/**
 * SettingsPage.vue - 企业级系统配置与管控中枢 (Section 9)
 */
import { ref, computed } from 'vue'
import { SaveOutlined, UndoOutlined, LockOutlined, ThunderboltOutlined, FileTextOutlined } from '@ant-design/icons-vue'
import { loadEnterpriseSettings, saveEnterpriseSettings, defaultEnterpriseSettings } from '../engine/enterprise-settings'

const settings = ref(loadEnterpriseSettings())
const activeTab = ref('solver')

function saveSettings() {
  saveEnterpriseSettings(settings.value)
  alert('企业级设置已保存')
}

function resetToDefaults() {
  if (window.confirm('确定要恢复默认设置吗？')) {
    settings.value = { ...defaultEnterpriseSettings }
    saveEnterpriseSettings(settings.value)
  }
}
</script>

<template>
  <div class="settings-page">
    <div class="toolbar">
      <div class="brand">MechBox <small>企业级系统配置与管控中枢</small></div>
      <a-space>
        <a-button size="small" type="primary" @click="saveSettings"><template #icon><SaveOutlined /></template>保存设置</a-button>
        <a-button size="small" @click="resetToDefaults"><template #icon><UndoOutlined /></template>恢复默认</a-button>
      </a-space>
    </div>

    <div class="content-body">
      <a-tabs v-model:activeKey="activeTab">
        <!-- 9.1 计算引擎与求解器调优 -->
        <a-tab-pane key="solver" tab="求解器调优">
          <a-card title="全局计算参数" size="small">
            <a-form layout="vertical">
              <a-row :gutter="12">
                <a-col :span="12">
                  <a-form-item label="全局安全系数 S">
                    <a-input-number v-model:value="settings.globalSafetyFactor" :min="1.0" :max="3.0" :step="0.1" style="width:100%"/>
                    <div style="font-size:11px;color:#888">航天级 S=2.0 / 普通机械 S=1.5</div>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="蒙特卡洛线程数">
                    <a-input-number v-model:value="settings.monteCarloThreads" :min="1" :max="32" style="width:100%"/>
                  </a-form-item>
                </a-col>
              </a-row>
              <a-divider>求解器精度控制</a-divider>
              <a-row :gutter="12">
                <a-col :span="12">
                  <a-form-item label="最大迭代次数">
                    <a-input-number v-model:value="settings.solverMaxIterations" :min="10" :max="1000" :step="10" style="width:100%"/>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="收敛容差 (Tolerance)">
                    <a-select v-model:value="settings.solverTolerance" style="width:100%">
                      <a-select-option :value="1e-6">1×10⁻⁶ (快速)</a-select-option>
                      <a-select-option :value="1e-8">1×10⁻⁸ (标准)</a-select-option>
                      <a-select-option :value="1e-12">1×10⁻¹² (极高精度)</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>
            </a-form>
          </a-card>
        </a-tab-pane>

        <!-- 9.2 知识库与数据隔离 -->
        <a-tab-pane key="data" tab="数据管理">
          <a-card title="安全与隔离" size="small">
            <a-form layout="vertical">
              <a-form-item>
                <a-checkbox v-model:checked="settings.strictOfflineMode">
                  <LockOutlined /> <strong>强制物理隔离模式</strong> (阻断所有外部网络连接，适用于军工/保密环境)
                </a-checkbox>
              </a-form-item>
              <a-divider>企业标准优先级</a-divider>
              <a-form-item label="标准调用优先级 (拖拽排序)">
                <a-select v-model:value="settings.standardPrecedence" mode="tags" style="width:100%" placeholder="高优先级 > 低优先级">
                  <a-select-option value="custom">企业自定义库</a-select-option>
                  <a-select-option value="GB/T">国标 GB/T</a-select-option>
                  <a-select-option value="ISO">国际标准 ISO</a-select-option>
                  <a-select-option value="DIN">德标 DIN</a-select-option>
                  <a-select-option value="JIS">日标 JIS</a-select-option>
                  <a-select-option value="ASME">美标 ASME</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="数据库路径重定向">
                <a-input v-model:value="settings.dbPathOverride" placeholder="留空使用默认路径: data/mechbox.db"/>
                <div style="font-size:11px;color:#888">可挂载到企业加密局域网盘或 WebDAV</div>
              </a-form-item>
            </a-form>
          </a-card>
        </a-tab-pane>

        <!-- 9.3 CAD 联动配置 -->
        <a-tab-pane key="cad" tab="CAD联动">
          <a-card title="CAD 集成配置" size="small">
            <a-form layout="vertical">
              <a-row :gutter="12">
                <a-col :span="12">
                  <a-form-item label="默认 CAD 目标平台">
                    <a-select v-model:value="settings.defaultCADTarget" style="width:100%">
                      <a-select-option value="solidworks">SolidWorks (VBA 宏)</a-select-option>
                      <a-select-option value="inventor">Inventor (iLogic)</a-select-option>
                      <a-select-option value="freecad">FreeCAD (Python)</a-select-option>
                      <a-select-option value="autocad">AutoCAD (Script)</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="WebSocket 本地通信端口">
                    <a-input-number v-model:value="settings.websocketPort" :min="1024" :max="65535" style="width:100%"/>
                    <div style="font-size:11px;color:#888">默认 8321，用于 CAD 双向联动</div>
                  </a-form-item>
                </a-col>
              </a-row>
            </a-form>
          </a-card>
        </a-tab-pane>

        <!-- 9.4 报告与合规模板 -->
        <a-tab-pane key="report" tab="报告合规">
          <a-card title="企业级报告元数据" size="small">
            <a-form layout="vertical">
              <a-row :gutter="12">
                <a-col :span="12"><a-form-item label="公司名称"><a-input v-model:value="settings.companyName" placeholder="如：XX 重工集团"/></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="默认编制人"><a-input v-model:value="settings.defaultAuthor"/></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="默认审核人"><a-input v-model:value="settings.defaultReviewer"/></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="企业 Logo 路径"><a-input v-model:value="settings.companyLogo" placeholder="PNG/SVG 路径"/></a-form-item></a-col>
              </a-row>
              <a-form-item label="免责声明 (自动附加到计算书尾页)">
                <a-textarea v-model:value="settings.disclaimerText" :rows="4"/>
              </a-form-item>
            </a-form>
          </a-card>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<style scoped>
.settings-page{max-width:1000px;margin:0 auto}
.toolbar{background:#004d40;padding:6px 16px;display:flex;justify-content:space-between;align-items:center;color:white;border-radius:4px;margin-bottom:16px}
.brand{font-weight:bold;font-size:16px;letter-spacing:1px}.brand small{font-weight:normal;font-size:10px;opacity:.8;margin-left:8px}
.content-body{background:#fff;border-radius:8px;padding:16px}
</style>
