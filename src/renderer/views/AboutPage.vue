<script setup lang="ts">
/**
 * AboutPage - 关于与版本信息页面
 * 显示应用版本、更新日志、技术栈、开源协议等信息
 */
import { ref } from 'vue'
import { 
  GithubOutlined, 
  BookOutlined, 
  ToolOutlined, 
  TeamOutlined,
  SafetyOutlined,
  RocketOutlined,
  BugOutlined,
  HeartOutlined,
  QrcodeOutlined
} from '@ant-design/icons-vue'

const activeTab = ref('about')

const version = '1.0.0'
const buildDate = '2026-04-12'
const electronVersion = '28.x'
const vueVersion = '3.x'
const viteVersion = '6.x'

const changelog = [
  {
    version: 'v1.0.0',
    date: '2026-04-12',
    type: 'major',
    title: '正式发布',
    changes: [
      '初始版本发布，包含 4 个核心计算模块',
      '公差配合查询 (ISO 286)',
      'O型圈选型与沟槽设计',
      '轴承选型与寿命计算',
      '螺栓连接选型与强度校核',
      '工作台和收藏夹功能',
      '约束求解引擎',
      'CAD 宏导出功能',
      '工业紧凑主题',
      '39 个单元测试'
    ]
  }
]

const techStack = [
  { category: '运行环境', items: ['Electron 28.x', 'Node.js', 'Vite 6.x'] },
  { category: '前端框架', items: ['Vue 3.x', 'TypeScript 5.x', 'Pinia'] },
  { category: 'UI 组件', items: ['Ant Design Vue 4.x'] },
  { category: '数据存储', items: ['better-sqlite3', 'JSON 标准数据'] },
  { category: '测试工具', items: ['Vitest'] },
  { category: '导出功能', items: ['jsPDF', 'html2canvas'] },
  { category: '计算引擎', items: ['纯函数计算', '约束求解器', '离散优化'] },
]

const standards = [
  { code: 'ISO 286', name: '公差与配合', status: '✅ 已实现' },
  { code: 'ASME AS568', name: 'O型圈尺寸 (美标)', status: '✅ 已实现' },
  { code: 'ISO 281', name: '滚动轴承额定寿命', status: '✅ 已实现' },
  { code: 'GB/T 5782', name: '六角头螺栓', status: '✅ 已实现' },
  { code: 'VDI 2230', name: '高强度螺栓计算', status: '✅ 已实现' },
  { code: 'ISO 68-1', name: '螺纹几何', status: '✅ 已实现' },
  { code: 'GB/T 196', name: '普通螺纹基本尺寸', status: '✅ 已实现' },
]
</script>

<template>
  <div class="about-page">
    <div class="about-header">
      <div class="logo-section">
        <div class="app-icon">
          <ToolOutlined />
        </div>
        <div class="app-info">
          <h1>MechBox</h1>
          <p class="subtitle">机械设计工具箱</p>
          <p class="version-info">v{{ version }} · {{ buildDate }}</p>
        </div>
      </div>
    </div>

    <a-tabs v-model:activeKey="activeTab" class="about-tabs">
      <a-tab-pane key="about" tab="关于">
        <a-card title="产品简介" size="small">
          <p>MechBox 是一款面向机械工程师的桌面端计算工具箱，集成常用设计计算与选型功能，离线可用、开源免费。</p>
          
          <a-descriptions bordered size="small" :column="2" style="margin-top: 16px">
            <a-descriptions-item label="版本">{{ version }}</a-descriptions-item>
            <a-descriptions-item label="构建日期">{{ buildDate }}</a-descriptions-item>
            <a-descriptions-item label="Electron">{{ electronVersion }}</a-descriptions-item>
            <a-descriptions-item label="Vue">{{ vueVersion }}</a-descriptions-item>
            <a-descriptions-item label="Vite">{{ viteVersion }}</a-descriptions-item>
            <a-descriptions-item label="许可证">MIT</a-descriptions-item>
          </a-descriptions>

          <a-divider />

          <h3>核心价值</h3>
          <a-row :gutter="16" style="margin-top: 16px">
            <a-col :span="12">
              <a-card size="small" hoverable>
                <template #title>
                  <RocketOutlined style="color: #1E3A8A" /> 一站式集成
                </template>
                <p>10+ 常用计算模块，告别散落的 Excel</p>
              </a-card>
            </a-col>
            <a-col :span="12">
              <a-card size="small" hoverable>
                <template #title>
                  <SafetyOutlined style="color: #1E3A8A" /> 离线优先
                </template>
                <p>无需联网，车间现场也能用</p>
              </a-card>
            </a-col>
            <a-col :span="12">
              <a-card size="small" hoverable>
                <template #title>
                  <HeartOutlined style="color: #1E3A8A" /> 开源免费
                </template>
                <p>无订阅费，无模块限制</p>
              </a-card>
            </a-col>
            <a-col :span="12">
              <a-card size="small" hoverable>
                <template #title>
                  <BookOutlined style="color: #1E3A8A" /> 标准内置
                </template>
                <p>国标/ISO/美标数据内置，不担心用错</p>
              </a-card>
            </a-col>
          </a-row>
        </a-card>
      </a-tab-pane>

      <a-tab-pane key="changelog" tab="更新日志">
        <a-timeline>
          <a-timeline-item 
            v-for="log in changelog" 
            :key="log.version"
            :color="log.type === 'major' ? 'blue' : 'green'"
          >
            <template #dot>
              <RocketOutlined v-if="log.type === 'major'" style="font-size: 16px" />
              <BugOutlined v-else style="font-size: 16px" />
            </template>
            <div class="changelog-item">
              <h3>{{ log.version }} <a-tag size="small">{{ log.date }}</a-tag></h3>
              <h4>{{ log.title }}</h4>
              <ul>
                <li v-for="(change, index) in log.changes" :key="index">{{ change }}</li>
              </ul>
            </div>
          </a-timeline-item>
        </a-timeline>
      </a-tab-pane>

      <a-tab-pane key="tech" tab="技术栈">
        <a-card title="技术架构" size="small">
          <a-descriptions bordered size="small" :column="1">
            <a-descriptions-item 
              v-for="stack in techStack" 
              :key="stack.category"
              :label="stack.category"
            >
              <a-space wrap>
                <a-tag v-for="item in stack.items" :key="item" color="blue">{{ item }}</a-tag>
              </a-space>
            </a-descriptions-item>
          </a-descriptions>

          <a-divider />

          <h3>支持的标准规范</h3>
          <a-table
            :columns="[
              { title: '标准号', dataIndex: 'code', key: 'code', width: '20%' },
              { title: '名称', dataIndex: 'name', key: 'name', width: '50%' },
              { title: '状态', dataIndex: 'status', key: 'status', width: '30%' }
            ]"
            :data-source="standards"
            :pagination="false"
            size="small"
          />
        </a-card>
      </a-tab-pane>

      <a-tab-pane key="contributors" tab="贡献者">
        <a-card title="致谢" size="small">
          <a-space direction="vertical" style="width: 100%">
            <a-alert
              message="感谢所有为 MechBox 做出贡献的开发者！"
              type="info"
              show-icon
            >
              <template #icon>
                <TeamOutlined />
              </template>
            </a-alert>

            <a-descriptions bordered size="small" :column="1">
              <a-descriptions-item label="作者">
                <a-space>
                  <GithubOutlined />
                  <span>NekoRain</span>
                </a-space>
              </a-descriptions-item>
              <a-descriptions-item label="开源协议">
                <a-tag color="green">MIT License</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="仓库">
                <a href="https://github.com/your-org/mechbox" target="_blank">
                  GitHub Repository
                </a>
              </a-descriptions-item>
            </a-descriptions>

            <a-divider />

            <h3>如何贡献</h3>
            <a-steps direction="vertical" size="small" :current="-1">
              <a-step title="Fork 仓库" description="在 GitHub 上 Fork 本项目" />
              <a-step title="创建分支" description="为你的功能或修复创建新分支" />
              <a-step title="提交更改" description="编写代码并添加测试" />
              <a-step title="提交 PR" description="发送 Pull Request 给我们" />
            </a-steps>
          </a-space>
        </a-card>
      </a-tab-pane>

      <a-tab-pane key="license" tab="许可证">
        <a-card title="MIT License" size="small">
          <pre class="license-text">MIT License

Copyright (c) 2026 MechCalc Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.</pre>
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <div class="about-footer">
      <p>Made with <HeartOutlined style="color: #ef4444" /> by Mechanical Engineers, for Mechanical Engineers</p>
      <p class="copyright">© 2026 MechBox Contributors. Licensed under MIT.</p>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.about-header {
  background: linear-gradient(135deg, #1E3A8A 0%, #3b82f6 100%);
  color: white;
  padding: 40px 32px;
  border-radius: 8px;
  margin-bottom: 32px;
  text-align: center;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.app-icon {
  font-size: 64px;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
}

.app-info h1 {
  margin: 0;
  font-size: 48px;
  font-weight: bold;
}

.subtitle {
  margin: 8px 0 4px 0;
  font-size: 18px;
  opacity: 0.9;
}

.version-info {
  margin: 0;
  font-size: 14px;
  opacity: 0.75;
}

.about-tabs {
  margin-bottom: 32px;
}

.changelog-item h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.changelog-item h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #64748b;
}

.changelog-item ul {
  margin: 8px 0;
  padding-left: 20px;
}

.changelog-item li {
  margin: 4px 0;
  line-height: 1.6;
}

.license-text {
  background: #f8fafc;
  padding: 16px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  max-height: 400px;
  overflow-y: auto;
}

.about-footer {
  text-align: center;
  padding: 24px;
  border-top: 1px solid #e2e8f0;
  color: #64748b;
}

.about-footer p {
  margin: 4px 0;
}

.copyright {
  font-size: 12px;
  color: #94a3b8;
}
</style>
