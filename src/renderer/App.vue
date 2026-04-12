<script setup lang="ts">
import { ref } from "vue";
import {
    DashboardOutlined,
    ColumnWidthOutlined,
    BlockOutlined,
    SettingOutlined,
    StarOutlined,
} from "@ant-design/icons-vue";
import TolerancesPage from "./views/tolerances/TolerancesPage.vue";
import SealsPage from "./views/seals/SealsPage.vue";
import BearingsPage from "./views/bearings/BearingsPage.vue";

const collapsed = ref(false);
const selectedKeys = ref(["tolerances"]);

const menuItems = [
    { key: "dashboard", icon: DashboardOutlined, label: "工作台" },
    { key: "tolerances", icon: ColumnWidthOutlined, label: "公差配合" },
    { key: "seals", icon: BlockOutlined, label: "密封圈" },
    { key: "bearings", icon: SettingOutlined, label: "轴承选型" },
    { key: "favorites", icon: StarOutlined, label: "我的收藏" },
];
</script>

<template>
    <a-layout style="min-height: 100vh">
        <a-layout-sider v-model:collapsed="collapsed" collapsible>
            <div class="logo">MechBox</div>
            <a-menu
                v-model:selectedKeys="selectedKeys"
                theme="dark"
                mode="inline"
            >
                <a-menu-item v-for="item in menuItems" :key="item.key">
                    <template #icon>
                        <component :is="item.icon" />
                    </template>
                    <span>{{ item.label }}</span>
                </a-menu-item>
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
                    <div
                        v-if="selectedKeys[0] === 'dashboard'"
                        style="text-align: center"
                    >
                        <h2>欢迎使用 MechBox (Vue 版)</h2>
                        <p>
                            基于 Vue 3 + Ant Design Vue 4.0
                            构建，请在左侧选择计算模块。
                        </p>
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
                    <div v-else>正在构建 {{ selectedKeys[0] }} 模块...</div>
                </div>
            </a-layout-content>
        </a-layout>
    </a-layout>
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
