/**
 * PageToolbar - 统一页面工具栏组件
 * 替代各页面重复定义的 toolbar + brand + buttons 模式
 */
import { defineComponent, h, type VNode } from 'vue'

export default defineComponent({
  name: 'PageToolbar',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
  },
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'page-toolbar' }, [
        h('div', { class: 'page-brand' }, [
          props.title,
          props.subtitle ? h('small', {}, props.subtitle) : null,
        ]),
        h('div', { class: 'toolbar-actions' }, slots.default?.()),
      ])
  },
})
