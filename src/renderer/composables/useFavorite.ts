/**
 * useFavorite - 统一收藏管理组合式函数
 * 消除 BearingsPage, BoltsPage 等页面中的重复收藏逻辑
 */
import { ref, computed } from 'vue'
import { useStandardStore } from '../store/useStandardStore'

export interface FavoriteOptions {
  /** 模块标识 */
  module: string
  /** 显示名称 */
  name: string
  /** 收藏数据 */
  data: Record<string, unknown>
}

export const useFavorite = () => {
  const store = useStandardStore()
  const isFavorited = ref(false)

  /**
   * 切换收藏状态
   * @param id 收藏唯一 ID
   * @param options 收藏内容
   */
  const toggleFavorite = (id: string, options: FavoriteOptions) => {
    const { module, name, data } = options

    if (isFavorited.value) {
      store.removeFavorite(id)
      isFavorited.value = false
    } else {
      store.addFavorite(module, name, data)
      isFavorited.value = true
    }
  }

  /**
   * 检查某项是否已收藏
   * @param id 收藏 ID
   */
  const checkFavorite = (id: string) => {
    isFavorited.value = store.favorites.some(f => f.id === id)
  }

  return { isFavorited, toggleFavorite, checkFavorite }
}
