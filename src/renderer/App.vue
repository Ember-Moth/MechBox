<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
    DashboardOutlined,
    ColumnWidthOutlined,
    BlockOutlined,
    SettingOutlined,
    ToolOutlined,
    StarOutlined,
    InfoCircleOutlined,
    SwapOutlined,
    DatabaseOutlined,
    ControlOutlined,
    FolderOpenOutlined,
    BarChartOutlined,
    WarningOutlined,
    FileSearchOutlined,
    CloudUploadOutlined,
    FileTextOutlined,
    PercentageOutlined,
    ThunderboltOutlined,
    RocketOutlined,
    DashboardFilled,
} from "@ant-design/icons-vue";
import { ConfigProvider } from "ant-design-vue";
import Dashboard from "./views/Dashboard.vue";
import TolerancesPage from "./views/tolerances/TolerancesPage.vue";
import SealsPage from "./views/seals/SealsPage.vue";
import BearingsPage from "./views/bearings/BearingsPage.vue";
import BoltsPage from "./views/bolts/BoltsPage.vue";
import DrivesPage from "./views/DrivesPage.vue";
import UnitConverterPage from "./views/UnitConverterPage.vue";
import MaterialLibraryPage from "./views/MaterialLibraryPage.vue";
import StandardPartsLibraryPage from "./views/StandardPartsLibraryPage.vue";
import ParamScanPage from "./views/ParamScanPage.vue";
import FailureDiagnosisPage from "./views/FailureDiagnosisPage.vue";
import MonteCarloPage from "./views/MonteCarloPage.vue";
import DFMAnalysisPage from "./views/DFMAnalysisPage.vue";
import ProjectCenterPage from "./views/ProjectCenterPage.vue";
import ReportCenterPage from "./views/ReportCenterPage.vue";
import SettingsPage from "./views/SettingsPage.vue";
import FavoritesPage from "./views/FavoritesPage.vue";
import AboutPage from "./views/AboutPage.vue";
import { industrialCompactTheme } from "./themes/industrial-compact";

const collapsed = ref(false);
const selectedKeys = ref(["dashboard"]);

const menuItems = [
    { key: "dashboard", icon: DashboardOutlined, label: "工作台" },
    { key: "divider-1", type: "divider" },
    { key: "tolerances", icon: ColumnWidthOutlined, label: "公差配合" },
    { key: "seals", icon: BlockOutlined, label: "密封圈" },
    { key: "bearings", icon: SettingOutlined, label: "轴承选型" },
    { key: "bolts", icon: ToolOutlined, label: "螺栓连接" },
    { key: "drives", icon: ThunderboltOutlined, label: "传动工具" },
    { key: "divider-2", type: "divider" },
    { key: "units", icon: SwapOutlined, label: "单位换算" },
    { key: "materials", icon: DatabaseOutlined, label: "材料库" },
    { key: "standard-parts", icon: FileSearchOutlined, label: "标准件库" },
    { key: "divider-3", type: "divider" },
    { key: "param-scan", icon: BarChartOutlined, label: "参数扫描" },
    { key: "monte-carlo", icon: PercentageOutlined, label: "蒙特卡洛" },
    { key: "dfm", icon: CloudUploadOutlined, label: "DFM分析" },
    { key: "failure-diag", icon: WarningOutlined, label: "失效诊断" },
    { key: "divider-4", type: "divider" },
    { key: "projects", icon: FolderOpenOutlined, label: "项目中心" },
    { key: "reports", icon: FileTextOutlined, label: "报告中心" },
    { key: "divider-5", type: "divider" },
    { key: "favorites", icon: StarOutlined, label: "我的收藏" },
    { key: "settings", icon: ControlOutlined, label: "设置" },
    { key: "about", icon: InfoCircleOutlined, label: "关于" },
];

// Handle navigation events from Dashboard
function handleNavigation(event: Event) {
    const customEvent = event as CustomEvent;
    selectedKeys.value = [customEvent.detail.module];
}

onMounted(() => {
    window.addEventListener('navigate', handleNavigation);
});

onUnmounted(() => {
    window.removeEventListener('navigate', handleNavigation);
});
</script>

<template>
    <ConfigProvider :theme="industrialCompactTheme">
        <a-layout style="min-height: 100vh">
            <a-layout-sider v-model:collapsed="collapsed" collapsible>
                <div class="logo">MechBox</div>
                <a-menu
                    v-model:selectedKeys="selectedKeys"
                    theme="dark"
                    mode="inline"
                >
                    <template v-for="item in menuItems" :key="item.key">
                        <a-menu-divider v-if="item.type === 'divider'" />
                        <a-menu-item v-else :key="item.key">
                            <template #icon>
                                <component :is="item.icon" />
                            </template>
                            <span>{{ item.label }}</span>
                        </a-menu-item>
                    </template>
                </a-menu>
            </a-layout-sider>
            <a-layout>
                <a-layout-header
                    style="
                        background: #fff;
                        padding: 0;
                        text-align: center;
                        font-weight: bold;
                    "
                >
                    机械设计工具箱
                </a-layout-header>
                <a-layout-content style="margin: 16px">
                    <div
                        :style="{
                            padding: '24px',
                            background: '#fff',
                            minHeight: '360px',
                            borderRadius: '8px',
                        }"
                    >
                        <div v-if="selectedKeys[0] === 'dashboard'">
                            <Dashboard />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'tolerances'">
                            <TolerancesPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'seals'">
                            <SealsPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'bearings'">
                            <BearingsPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'bolts'">
                            <BoltsPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'drives'">
                            <DrivesPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'units'">
                            <UnitConverterPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'materials'">
                            <MaterialLibraryPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'standard-parts'">
                            <StandardPartsLibraryPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'param-scan'">
                            <ParamScanPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'monte-carlo'">
                            <MonteCarloPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'dfm'">
                            <DFMAnalysisPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'failure-diag'">
                            <FailureDiagnosisPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'projects'">
                            <ProjectCenterPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'reports'">
                            <ReportCenterPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'settings'">
                            <SettingsPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'favorites'">
                            <FavoritesPage />
                        </div>
                        <div v-else-if="selectedKeys[0] === 'about'">
                            <AboutPage />
                        </div>
                        <div v-else>正在构建 {{ selectedKeys[0] }} 模块...</div>
                    </div>
                </a-layout-content>
            </a-layout>
        </a-layout>
    </ConfigProvider>
</template>

<style scoped>
.logo {
    height: 32px;
    margin: 16px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    text-align: center;
    line-height: 32px;
    color: white;
    font-weight: bold;
}
</style>
