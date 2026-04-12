/**
 * usePdfExport - 统一 PDF 导出组合式函数
 * 消除 13+ 个页面中重复的 jsPDF + html2canvas 导入和逻辑
 */
import { ref } from 'vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PdfExportOptions {
  /** 文件名前缀 (默认 'mechbox') */
  filename?: string
  /** 页面类名选择器 (默认 '.xxx-page') */
  selector?: string
  /** 渲染倍率 (默认 2) */
  scale?: number
  /** 导出完成后回调 */
  onSuccess?: (filename: string) => void
  /** 导出失败回调 */
  onError?: (error: Error) => void
}

/**
 * 导出当前页面为 PDF
 * @param options 导出配置
 */
export const usePdfExport = () => {
  const isExporting = ref(false)

  const exportPdf = async (options: PdfExportOptions = {}) => {
    const {
      filename = 'mechbox',
      selector = '.page-stage > div > .toolbar',
      scale = 2,
      onSuccess,
      onError,
    } = options

    if (isExporting.value) return

    isExporting.value = true
    try {
      // 查找最近的页面容器
      const element = document.querySelector(selector) as HTMLElement
      if (!element) {
        throw new Error(`未找到导出元素: ${selector}`)
      }

      const canvas = await html2canvas(element, { scale })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

      const fullFilename = `${filename}-${new Date().toISOString().slice(0, 10)}.pdf`
      pdf.save(fullFilename)

      onSuccess?.(fullFilename)
    } catch (error) {
      console.error('PDF 导出失败:', error)
      onError?.(error as Error)
    } finally {
      isExporting.value = false
    }
  }

  return { isExporting, exportPdf }
}
