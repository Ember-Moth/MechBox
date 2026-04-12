<script setup lang="ts">
/**
 * Dashboard - 工作台页面
 * 显示最近项目、常用模块、收藏等
 */
import { useRouter } from 'vue-router'
import { useStandardStore } from '../store/useStandardStore'
import {
    BlockOutlined,
    ColumnWidthOutlined,
    SettingOutlined,
    ToolOutlined,
    StarOutlined,
} from '@ant-design/icons-vue'

const store = useStandardStore()

const quickAccessModules = [
    { key: 'tolerances', icon: ColumnWidthOutlined, label: '公差配合', desc: 'ISO 286 公差查询与配合计算' },
    { key: 'seals', icon: BlockOutlined, label: '密封圈', desc: 'O型圈选型与沟槽设计' },
    { key: 'bearings', icon: SettingOutlined, label: '轴承选型', desc: '深沟球轴承选型与寿命计算' },
    { key: 'bolts', icon: ToolOutlined, label: '螺栓连接', desc: '螺栓规格选择与强度校核' },
]

function navigateTo(moduleKey: string) {
    // Update parent's selectedKeys through event
    window.dispatchEvent(new CustomEvent('navigate', { detail: { module: moduleKey } }))
}
</script>

<template>
    <div class="dashboard-page">
        <div class="welcome-banner">
            <h1>欢迎使用 MechBox</h1>
            <p>机械设计工具箱 - 让您的设计计算更准确、更高效</p>
        </div>

        <a-row :gutter="16">
            <a-col :span="16">
                <a-card title="常用模块" size="small">
                    <a-row :gutter="12">
                        <a-col :span="12" v-for="mod in quickAccessModules" :key="mod.key">
                            <a-card size="small" hoverable class="module-card" @click="navigateTo(mod.key)">
                                <div class="module-icon">
                                    <component :is="mod.icon" />
                                </div>
                                <div class="module-info">
                                    <h3>{{ mod.label }}</h3>
                                    <p>{{ mod.desc }}</p>
                                </div>
                            </a-card>
                        </a-col>
                    </a-row>
                </a-card>

                <a-card title="功能特性" size="small" style="margin-top: 16px">
                    <a-descriptions bordered size="small" :column="2">
                        <a-descriptions-item label="离线可用">
                            <a-tag color="green">✓ 支持</a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="标准数据">
                            <a-tag color="blue">ISO/GB/ASME</a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="计算引擎">
                            <a-tag color="purple">4 个模块</a-tag>
                        </a-descriptions-item>
                        <a-descriptions-item label="单元测试">
                            <a-tag color="green">29 个测试</a-tag>
                        </a-descriptions-item>
                    </a-descriptions>
                </a-card>
            </a-col>

            <a-col :span="8">
                <a-card :title="`我的收藏 (${store.favorites.length})`" size="small" extra>
                    <a-button type="link" size="small" @click="navigateTo('favorites')">
                        查看全部
                    </a-button>
                </a-card>

                <a-empty v-if="store.favorites.length === 0" description="暂无收藏" style="margin-top: 16px" />
                <a-list v-else :data-source="store.favorites.slice(0, 5)" style="margin-top: 16px" size="small">
                    <template #renderItem="{ item }">
                        <a-list-item>
                            <a-list-item-meta>
                                <template #title>{{ item.name }}</template>
                                <template #description>{{ item.module }} · {{ new Date(item.createdAt).toLocaleString() }}</template>
                            </a-list-item-meta>
                        </a-list-item>
                    </template>
                </a-list>

                <a-card title="快速指南" size="small" style="margin-top: 16px">
                    <a-steps direction="vertical" size="small" :current="-1">
                        <a-step title="选择模块" description="从左侧菜单或常用模块进入" />
                        <a-step title="输入参数" description="填写工况和设计参数" />
                        <a-step title="查看结果" description="获取计算结果和建议" />
                        <a-step title="收藏保存" description="收藏常用配置，便于复现" />
                    </a-steps>
                </a-card>
            </a-col>
        </a-row>
    </div>
</template>

<style scoped>
.dashboard-page {
    max-width: 1400px;
    margin: 0 auto;
}

.welcome-banner {
    background: linear-gradient(135deg, #004d40 0%, #00796b 100%);
    color: white;
    padding: 32px 24px;
    border-radius: 8px;
    margin-bottom: 24px;
    text-align: center;
}

.welcome-banner h1 {
    margin: 0 0 8px 0;
    font-size: 28px;
}

.welcome-banner p {
    margin: 0;
    opacity: 0.9;
    font-size: 14px;
}

.module-card {
    cursor: pointer;
    margin-bottom: 12px;
    transition: all 0.3s;
}

.module-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.module-icon {
    font-size: 32px;
    color: #004d40;
    text-align: center;
    margin-bottom: 12px;
}

.module-info h3 {
    margin: 0 0 4px 0;
    font-size: 16px;
    color: #262626;
}

.module-info p {
    margin: 0;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
}
</style>
