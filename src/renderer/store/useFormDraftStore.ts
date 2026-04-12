/**
 * Form draft persistence via Pinia (Section 11.2)
 * 切换侧边栏菜单时，用户在计算页面填了一半的数据不会丢失
 */

import { defineStore } from 'pinia'

export interface FormDraft {
  moduleId: string
  data: Record<string, any>
  savedAt: number
}

export const useFormDraftStore = defineStore('formDraft', {
  state: () => ({
    drafts: {} as Record<string, FormDraft>
  }),

  actions: {
    saveDraft(moduleId: string, data: Record<string, any>) {
      this.drafts[moduleId] = {
        moduleId,
        data: JSON.parse(JSON.stringify(data)),
        savedAt: Date.now()
      }
      // 持久化到 localStorage
      try {
        localStorage.setItem('mechbox-form-drafts', JSON.stringify(this.drafts))
      } catch (e) { /* ignore */ }
    },

    loadDraft(moduleId: string): Record<string, any> | null {
      const draft = this.drafts[moduleId]
      if (!draft) return null
      return draft.data
    },

    clearDraft(moduleId: string) {
      delete this.drafts[moduleId]
      try {
        localStorage.setItem('mechbox-form-drafts', JSON.stringify(this.drafts))
      } catch (e) { /* ignore */ }
    },

    loadFromStorage() {
      try {
        const saved = localStorage.getItem('mechbox-form-drafts')
        if (saved) {
          this.drafts = JSON.parse(saved)
          // 清除 7 天前的草稿
          const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
          for (const key of Object.keys(this.drafts)) {
            if (this.drafts[key].savedAt < cutoff) {
              delete this.drafts[key]
            }
          }
        }
      } catch (e) { /* ignore */ }
    }
  }
})
