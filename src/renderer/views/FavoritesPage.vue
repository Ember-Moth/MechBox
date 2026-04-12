<script setup lang="ts">
/**
 * FavoritesPage - 我的收藏页面
 * 管理用户收藏的常用配置
 */
import { useStandardStore } from '../store/useStandardStore'
import { StarOutlined } from '@ant-design/icons-vue'

const store = useStandardStore()

function removeFavorite(id: string) {
    store.removeFavorite(id)
}

function clearAllFavorites() {
    if (window.confirm('确定要清空所有收藏吗？此操作不可恢复。')) {
        store.clearFavorites()
    }
}

const moduleLabels: Record<string, string> = {
    tolerances: '公差配合',
    seals: '密封圈',
    bearings: '轴承选型',
    bolts: '螺栓连接',
    threads: '螺纹',
}

const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', width: '30%' },
    { title: '模块', dataIndex: 'module', key: 'module', width: '15%' },
    { title: '收藏时间', dataIndex: 'createdAt', key: 'createdAt', width: '25%' },
    { title: '操作', key: 'action', width: '15%' },
]
</script>

<template>
    <div class="favorites-page">
        <div class="favorites-header">
            <h2>我的收藏</h2>
            <a-space>
                <a-button v-if="store.favorites.length > 0" danger size="small" @click="clearAllFavorites">
                    清空全部
                </a-button>
            </a-space>
        </div>

        <a-empty v-if="store.favorites.length === 0" description="暂无收藏项目，在使用其他模块时点击收藏按钮即可添加">
            <template #image>
                <StarOutlined style="font-size: 64px; color: #d9d9d9" />
            </template>
        </a-empty>

        <a-card v-else title="收藏列表" size="small">
            <a-table
                :columns="columns"
                :data-source="store.favorites"
                :pagination="{ pageSize: 10, showSizeChanger: true }"
                size="small"
            >
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'module'">
                        <a-tag color="blue">{{ moduleLabels[record.module] || record.module }}</a-tag>
                    </template>
                    <template v-else-if="column.key === 'createdAt'">
                        {{ new Date(record.createdAt).toLocaleString() }}
                    </template>
                    <template v-else-if="column.key === 'action'">
                        <a-button type="link" danger size="small" @click="removeFavorite(record.id)">
                            删除
                        </a-button>
                    </template>
                </template>
            </a-table>
        </a-card>
    </div>
</template>

<style scoped>
.favorites-page {
    max-width: 1200px;
    margin: 0 auto;
}

.favorites-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.favorites-header h2 {
    margin: 0;
    font-size: 20px;
    color: #262626;
}
</style>
