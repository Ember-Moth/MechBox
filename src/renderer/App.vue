<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
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
import { industrialCompactTheme } from "./themes/industrial-compact";

const collapsed = ref(false);
const router = useRouter();
const route = useRoute();
const selectedKeys = ref(["dashboard"]);

const routeMap: Record<
    string,
    { path: string; title: string; group: string; description: string }
> = {
    dashboard: {
        path: "/",
        title: "工作台",
        group: "总览",
        description: "最近项目、快捷入口和常用模块概览",
    },
    tolerances: {
        path: "/tolerances",
        title: "公差配合",
        group: "基础设计与选型",
        description: "标准公差、基本偏差和配合结果查询",
    },
    "tolerance-stack": {
        path: "/tolerance-stack",
        title: "公差堆叠分析",
        group: "基础设计与选型",
        description: "尺寸链、极限值和累积误差分析",
    },
    seals: {
        path: "/seals",
        title: "密封圈",
        group: "基础设计与选型",
        description: "O 形圈选型、材质推荐和沟槽校核",
    },
    bearings: {
        path: "/bearings",
        title: "轴承选型",
        group: "基础设计与选型",
        description: "型号、寿命和工况计算",
    },
    bolts: {
        path: "/bolts",
        title: "螺栓连接",
        group: "基础设计与选型",
        description: "预紧、强度和连接可靠性校核",
    },
    drives: {
        path: "/drives",
        title: "传动工具",
        group: "传动与动力系统",
        description: "带传动与链传动基础计算",
    },
    gears: {
        path: "/gears",
        title: "齿轮计算",
        group: "传动与动力系统",
        description: "齿轮参数、模数和几何关系",
    },
    springs: {
        path: "/springs",
        title: "弹簧计算",
        group: "传动与动力系统",
        description: "刚度、应力和失稳校核",
    },
    hydraulics: {
        path: "/hydraulics",
        title: "液压气动",
        group: "传动与动力系统",
        description: "液压与气动的基础选型与计算",
    },
    motors: {
        path: "/motors",
        title: "电机选型",
        group: "传动与动力系统",
        description: "电机功率、转矩和匹配估算",
    },
    shafts: {
        path: "/shafts",
        title: "轴强度校核",
        group: "传动与动力系统",
        description: "扭矩、弯矩和安全系数校核",
    },
    units: {
        path: "/units",
        title: "单位换算",
        group: "工程资料与互换库",
        description: "工程单位快速换算与对照",
    },
    materials: {
        path: "/materials",
        title: "材料库",
        group: "工程资料与互换库",
        description: "材料牌号、性能和检索",
    },
    "standard-parts": {
        path: "/standard-parts",
        title: "标准件库",
        group: "工程资料与互换库",
        description: "标准件、厂商目录与结构化查询",
    },
    "reverse-identify": {
        path: "/reverse-identify",
        title: "逆向识别",
        group: "工程资料与互换库",
        description: "按测量值反推标准规格",
    },
    "material-sub": {
        path: "/material-sub",
        title: "材料代换",
        group: "工程资料与互换库",
        description: "材料相近代换与风险提示",
    },
    "param-scan": {
        path: "/param-scan",
        title: "参数扫描",
        group: "高级分析与自动化",
        description: "区间试算和敏感性观察",
    },
    "monte-carlo": {
        path: "/monte-carlo",
        title: "蒙特卡洛",
        group: "高级分析与自动化",
        description: "概率模拟和良率分析",
    },
    dfm: {
        path: "/dfm",
        title: "DFM 分析",
        group: "高级分析与自动化",
        description: "制造性与工艺风险提示",
    },
    "failure-diag": {
        path: "/failure-diag",
        title: "失效诊断",
        group: "高级分析与自动化",
        description: "按失效现象做诊断建议",
    },
    "excel-import": {
        path: "/excel-import",
        title: "Excel 导入",
        group: "高级分析与自动化",
        description: "模板导入与批量结构化处理",
    },
    "latex-report": {
        path: "/latex-report",
        title: "LaTeX 报告",
        group: "高级分析与自动化",
        description: "结构化工程报告生成",
    },
    projects: {
        path: "/projects",
        title: "项目中心",
        group: "工作空间",
        description: "项目组织、草稿和模块串联",
    },
    reports: {
        path: "/reports",
        title: "报告中心",
        group: "工作空间",
        description: "报告生成、管理与导出",
    },
    favorites: {
        path: "/favorites",
        title: "我的收藏",
        group: "工作空间",
        description: "常用配置和结果收藏",
    },
    "bom-export": {
        path: "/bom-export",
        title: "BOM 导出",
        group: "工作空间",
        description: "设计结果整理与物料导出",
    },
    settings: {
        path: "/settings",
        title: "设置",
        group: "系统",
        description: "界面、数据和企业级参数配置",
    },
    about: {
        path: "/about",
        title: "关于",
        group: "系统",
        description: "项目说明、版本和功能边界",
    },
};

function navigateTo(key: string) {
    const target = routeMap[key];
    if (target) {
        selectedKeys.value = [key];
        void router.push(target.path);
    }
}

const menuGroups = [
    {
        key: "design",
        icon: SafetyOutlined,
        title: "基础设计与选型",
        children: [
            { key: "tolerances", icon: ColumnWidthOutlined, label: "公差配合" },
            { key: "tolerance-stack", icon: ColumnWidthOutlined, label: "公差堆叠分析" },
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
            { key: "dfm", icon: CloudUploadOutlined, label: "DFM 分析" },
            { key: "failure-diag", icon: WarningOutlined, label: "失效诊断" },
            { key: "excel-import", icon: ImportOutlined, label: "Excel 导入" },
            { key: "latex-report", icon: FileTextOutlined, label: "LaTeX 报告" },
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
            { key: "bom-export", icon: FileTextOutlined, label: "BOM 导出" },
        ],
    },
];

const systemItems = [
    { key: "settings", icon: ControlOutlined, label: "设置" },
    { key: "about", icon: InfoCircleOutlined, label: "关于" },
];

const currentRouteMeta = computed(() => {
    const entry = Object.entries(routeMap).find(([, item]) => item.path === route.path);
    return entry ? { key: entry[0], ...entry[1] } : { key: "dashboard", ...routeMap.dashboard };
});

watch(
    () => route.path,
    (path) => {
        const entry = Object.entries(routeMap).find(([, item]) => item.path === path);
        selectedKeys.value = [entry?.[0] ?? "dashboard"];
    },
    { immediate: true },
);
</script>

<template>
    <ConfigProvider :theme="industrialCompactTheme">
        <a-layout class="app-shell">
            <a-layout-sider v-model:collapsed="collapsed" collapsible class="sider">
                <div class="logo">MechBox</div>
                <div class="menu-scroll">
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
                            <a-menu-item
                                v-for="item in group.children"
                                :key="item.key"
                                @click="navigateTo(item.key)"
                            >
                                <template #icon><component :is="item.icon" /></template>
                                <span>{{ item.label }}</span>
                            </a-menu-item>
                        </a-sub-menu>
                    </a-menu>
                </div>
                <div class="system-bar">
                    <a-menu theme="dark" mode="inline" :selectable="false">
                        <a-menu-item
                            v-for="item in systemItems"
                            :key="item.key"
                            @click="navigateTo(item.key)"
                        >
                            <template #icon><component :is="item.icon" /></template>
                            <span>{{ item.label }}</span>
                        </a-menu-item>
                    </a-menu>
                </div>
            </a-layout-sider>

            <a-layout>
                <a-layout-header class="app-header">
                    <div class="app-header-main">
                        <div>
                            <div class="app-title">{{ currentRouteMeta.title }}</div>
                            <div class="app-subtitle">
                                {{ currentRouteMeta.group }} ·
                                {{ currentRouteMeta.description }}
                            </div>
                        </div>
                        <div class="app-header-badge">SQLite / Offline First</div>
                    </div>
                </a-layout-header>

                <a-layout-content class="app-content">
                    <div class="page-stage">
                        <router-view />
                    </div>
                </a-layout-content>
            </a-layout>
        </a-layout>
    </ConfigProvider>
</template>

<style scoped>
.app-shell {
    height: 100vh;
    overflow: hidden;
    
}

.logo {
    margin: 14px 16px 10px;
    padding: 10px 12px;
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.18),
        rgba(255, 255, 255, 0.06)
    );
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    text-align: center;
    color: white;
    font-weight: 700;
    letter-spacing: 0.08em;
}

.sider {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
    box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.06);
}

.menu-scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
}

.menu-scroll :deep(.ant-menu-item) {
    font-size: 13px !important;
    height: 36px !important;
    line-height: 36px !important;
}

.menu-scroll :deep(.ant-menu-submenu-title) {
    font-size: 14px !important;
    height: 38px !important;
    line-height: 38px !important;
    font-weight: 700 !important;
}

.menu-scroll :deep(.ant-menu-sub .ant-menu-item) {
    font-size: 14px !important;
    height: 36px !important;
    line-height: 36px !important;
}

.menu-scroll :deep(.ant-menu-item .anticon) {
    font-size: 14px !important;
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
    font-size: 13px !important;
    height: 36px !important;
    line-height: 36px !important;
}

.system-bar :deep(.ant-menu-item .anticon) {
    font-size: 14px !important;
}

.app-header {
    background: #f8fafc;
    padding: 14px 20px 10px;
    border-bottom: 1px solid #e2e8f0;
    line-height: 1.2;
    height: auto;
}

.app-header-main {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
}

.app-title {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
}

.app-subtitle {
    margin-top: 4px;
    font-size: 12px;
    color: #64748b;
}

.app-header-badge {
    white-space: nowrap;
    padding: 6px 10px;
    border-radius: 999px;
    background: #e0e7ff;
    color: #1e3a8a;
    font-size: 12px;
    font-weight: 600;
}

.app-content {
    margin: 0;
    padding: 0;
    background: #eef2f7;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-gutter: stable;
}

.app-content::-webkit-scrollbar {
    width: 6px;
}

.app-content::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 3px;
}

.app-content::-webkit-scrollbar-track {
    background: transparent;
}

.page-stage {
    padding: 18px 18px 20px;
    min-height: 100%;
}

@media (max-width: 960px) {
    .app-header-main {
        flex-direction: column;
    }

    .page-stage {
        padding: 12px;
    }

    /* 窄屏自动折叠侧边栏 */
    .sider {
        --antd-layout-sider-width: 60px;
    }
}

/* 移动端适配 (≤768px) */
@media (max-width: 768px) {
    /* 侧边栏默认折叠 */
    .sider {
        --antd-layout-sider-width: 0px;
    }

    /* 表格横向滚动 */
    :deep(.ant-table-wrapper) {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }

    :deep(.ant-table) {
        min-width: 500px;
    }

    /* 内容区紧凑 */
    .page-stage {
        padding: 8px;
    }

    /* 卡片紧凑 */
    :deep(.ant-card-small .ant-card-body) {
        padding: 8px;
    }

    /* 表单全宽 */
    :deep(.ant-row) {
        margin: 0 !important;
    }

    :deep(.ant-col) {
        padding: 0 !important;
    }
}

/* 超小屏 (≤480px) */
@media (max-width: 480px) {
    .page-stage {
        padding: 4px;
    }

    :deep(.ant-card) {
        border-radius: 4px;
    }

    /* 描述列表单列紧凑 */
    :deep(.ant-descriptions-bordered) {
        font-size: 11px;
    }

    :deep(.ant-descriptions-item-label) {
        width: 35% !important;
        padding: 4px 6px !important;
    }

    :deep(.ant-descriptions-item-content) {
        padding: 4px 6px !important;
    }
}
</style>
