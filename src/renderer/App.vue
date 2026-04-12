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
    ScissorOutlined,
    DashOutlined,
    MedicineBoxOutlined,
    ExperimentOutlined,
    FolderOutlined,
    SafetyOutlined,
    SwapOutlined as ThunderboltCircleOutlined,
    SearchOutlined,
    ImportOutlined,
} from "@ant-design/icons-vue";
import { ConfigProvider } from "ant-design-vue";
import Dashboard from "./views/Dashboard.vue";
import TolerancesPage from "./views/tolerances/TolerancesPage.vue";
import SealsPage from "./views/seals/SealsPage.vue";
import BearingsPage from "./views/bearings/BearingsPage.vue";
import BoltsPage from "./views/bolts/BoltsPage.vue";
import DrivesPage from "./views/DrivesPage.vue";
import GearsPage from "./views/GearsPage.vue";
import SpringsPage from "./views/SpringsPage.vue";
import HydraulicsPage from "./views/HydraulicsPage.vue";
import MotorsPage from "./views/MotorsPage.vue";
import ShaftsPage from "./views/ShaftsPage.vue";
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
import ReverseIdentifyPage from "./views/ReverseIdentifyPage.vue";
import MaterialSubstitutionPage from "./views/MaterialSubstitutionPage.vue";
import ExcelImportPage from "./views/ExcelImportPage.vue";
import LaTeXReportPage from "./views/LaTeXReportPage.vue";
import BOMExportPage from "./views/BOMExportPage.vue";
import { industrialCompactTheme } from "./themes/industrial-compact";

const collapsed = ref(false);
const selectedKeys = ref(["dashboard"]);

const routeMap: Record<string, string> = {
    dashboard: '/', tolerances: '/tolerances', seals: '/seals',
    bearings: '/bearings', bolts: '/bolts', drives: '/drives',
    gears: '/gears', springs: '/springs', hydraulics: '/hydraulics',
    motors: '/motors', shafts: '/shafts', units: '/units',
    materials: '/materials', 'standard-parts': '/standard-parts',
    'reverse-identify': '/reverse-identify', 'material-sub': '/material-sub',
    'param-scan': '/param-scan', 'monte-carlo': '/monte-carlo',
    dfm: '/dfm', 'failure-diag': '/failure-diag',
    'excel-import': '/excel-import', 'latex-report': '/latex-report',
    projects: '/projects', reports: '/reports',
    favorites: '/favorites', 'bom-export': '/bom-export',
    settings: '/settings', about: '/about',
};

function navigateTo(key: string) {
    const path = routeMap[key];
    if (path) window.location.hash = '#' + path;
}

// Section 4.3.3: Semantic folder groups (replaces flat menu with dividers)
const menuGroups = [
    {
        key: "design",
        icon: SafetyOutlined,
        title: "基础设计与选型",
        children: [
            { key: "tolerances", icon: ColumnWidthOutlined, label: "公差配合" },
            { key: "seals", icon: BlockOutlined, label: "密封圈" },
            { key: "bearings", icon: SettingOutlined, label: "轴承选型" },
            { key: "bolts", icon: ToolOutlined, label: "螺栓连接" },
        ],
    },
    {
        key: "drive",
        icon: ThunderboltCircleOutlined,
        title: "传动与动力系统",
        children: [
            { key: "drives", icon: ThunderboltOutlined, label: "传动工具" },
            { key: "gears", icon: RocketOutlined, label: "齿轮计算" },
            { key: "springs", icon: ScissorOutlined, label: "弹簧计算" },
            { key: "hydraulics", icon: DashOutlined, label: "液压气动" },
            { key: "motors", icon: ExperimentOutlined, label: "电机选型" },
            { key: "shafts", icon: MedicineBoxOutlined, label: "轴强度校核" },
        ],
    },
    {
        key: "reference",
        icon: SearchOutlined,
        title: "工程资料与互换库",
        children: [
            { key: "units", icon: SwapOutlined, label: "单位换算" },
            { key: "materials", icon: DatabaseOutlined, label: "材料库" },
            { key: "standard-parts", icon: FileSearchOutlined, label: "标准件库" },
            { key: "reverse-identify", icon: ExperimentOutlined, label: "逆向识别" },
            { key: "material-sub", icon: ExperimentOutlined, label: "材料代换" },
        ],
    },
    {
        key: "analysis",
        icon: BarChartOutlined,
        title: "高级分析与自动化",
        children: [
            { key: "param-scan", icon: BarChartOutlined, label: "参数扫描" },
            { key: "monte-carlo", icon: PercentageOutlined, label: "蒙特卡洛" },
            { key: "dfm", icon: CloudUploadOutlined, label: "DFM分析" },
            { key: "failure-diag", icon: WarningOutlined, label: "失效诊断" },
            { key: "excel-import", icon: ImportOutlined, label: "Excel导入" },
            { key: "latex-report", icon: FileTextOutlined, label: "LaTeX报告" },
        ],
    },
    {
        key: "workspace",
        icon: FolderOutlined,
        title: "工作空间",
        children: [
            { key: "projects", icon: FolderOpenOutlined, label: "项目中心" },
            { key: "reports", icon: FileTextOutlined, label: "报告中心" },
            { key: "favorites", icon: StarOutlined, label: "我的收藏" },
            { key: "bom-export", icon: FileTextOutlined, label: "BOM导出" },
        ],
    },
];

// System items pinned at bottom (Section 4.3.3 Split Layout)
const systemItems = [
    { key: "settings", icon: ControlOutlined, label: "设置" },
    { key: "about", icon: InfoCircleOutlined, label: "关于" },
];

function handleNavigation(event: Event) {
    const customEvent = event as CustomEvent;
    selectedKeys.value = [customEvent.detail.module];
}

onMounted(() => {
    window.addEventListener("navigate", handleNavigation);
});

onUnmounted(() => {
    window.removeEventListener("navigate", handleNavigation);
});
</script>

<template>
    <ConfigProvider :theme="industrialCompactTheme">
        <a-layout style="min-height: 100vh">
            <a-layout-sider v-model:collapsed="collapsed" collapsible class="sider">
                <div class="logo">MechBox</div>
                <!-- Upper scrollable area: business sub-menus -->
                <div class="menu-scroll">
                    <!-- Dashboard as first standalone item -->
                    <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
                        <a-menu-item key="dashboard" @click="navigateTo('dashboard')">
                            <template #icon><DashboardOutlined /></template>
                            <span>工作台</span>
                        </a-menu-item>
                    </a-menu>
                    <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
                        <a-sub-menu v-for="group in menuGroups" :key="group.key">
                            <template #icon><component :is="group.icon" /></template>
                            <template #title>{{ group.title }}</template>
                            <a-menu-item v-for="item in group.children" :key="item.key" @click="navigateTo(item.key)">
                                <template #icon><component :is="item.icon" /></template>
                                <span>{{ item.label }}</span>
                            </a-menu-item>
                        </a-sub-menu>
                    </a-menu>
                </div>
                <!-- Bottom-pinned system items -->
                <div class="system-bar">
                    <a-menu theme="dark" mode="inline" :selectable="false">
                        <a-menu-item v-for="item in systemItems" :key="item.key" @click="selectedKeys = [item.key]">
                            <template #icon><component :is="item.icon" /></template>
                            <span>{{ item.label }}</span>
                        </a-menu-item>
                    </a-menu>
                </div>
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
                        <router-view />
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

/* Section 4.3.3: Split layout - scrollable menu + pinned system bar */
.sider {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.menu-scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
}

.menu-scroll::-webkit-scrollbar {
    width: 4px;
}

.menu-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
}

.system-bar {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
}

.system-bar :deep(.ant-menu-item) {
    margin: 0;
}
</style>
