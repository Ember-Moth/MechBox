/**
 * Excel 导入导出引擎
 * 支持标准件数据的 Excel 导入和计算结果导出
 * Section 2.3, 14.2
 */

export interface ExcelImportResult {
  success: boolean
  recordsImported: number
  errors: string[]
  data: any[]
}

/**
 * 解析 CSV 数据为 JSON
 * 支持简单的逗号分隔格式
 */
export const parseCSV = (csvText: string, headers?: string[]): { headers: string[]; rows: Record<string, string>[] } => {
  const lines = csvText.trim().split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const detectedHeaders = headers || lines[0].split(',').map(h => h.trim())
  const rows: Record<string, string>[] = []

  for (let i = headers ? 0 : 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row: Record<string, string> = {}
    detectedHeaders.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    rows.push(row)
  }

  return { headers: detectedHeaders, rows }
}

/**
 * 将数据转换为 CSV 格式
 */
export const toCSV = (data: Record<string, any>[]): string => {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  let csv = headers.join(',') + '\n'

  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h]
      // 如果包含逗号或引号，需要转义
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    })
    csv += values.join(',') + '\n'
  }

  return csv
}

/**
 * 导出为 JSON 文件
 */
export const exportJSON = (data: any, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 导出计算结果为 Excel/CSV
 */
export const exportCalculationResult = (
  moduleName: string,
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  warnings: string[] = []
): void => {
  const data = [
    { field: '模块', value: moduleName },
    { field: '计算时间', value: new Date().toISOString() },
    { field: '', value: '' },
    ...Object.entries(inputs).map(([key, val]) => ({ field: `输入: ${key}`, value: String(val) })),
    { field: '', value: '' },
    ...Object.entries(outputs).map(([key, val]) => ({ field: `输出: ${key}`, value: String(val) })),
    ...warnings.map(w => ({ field: '警告', value: w })),
  ]

  const csv = toCSV([data.reduce((acc, item) => ({ ...acc, [item.field]: item.value }), {})])
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${moduleName}-result-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 验证导入的数据格式
 */
export const validateImportData = (
  data: Record<string, string>[],
  requiredFields: string[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (data.length === 0) {
    errors.push('数据为空')
    return { valid: false, errors }
  }

  const headers = Object.keys(data[0])
  const missingFields = requiredFields.filter(f => !headers.includes(f))
  
  if (missingFields.length > 0) {
    errors.push(`缺少必需字段: ${missingFields.join(', ')}`)
  }

  return { valid: errors.length === 0, errors }
}

/**
 * 标准件 Excel 模板定义
 */
export const standardTemplates = {
  bearing: {
    name: '轴承数据模板',
    fields: ['designation', 'd', 'D', 'B', 'C_r', 'C_0r', 'speed_limit_grease', 'speed_limit_oil', 'mass'],
    example: {
      designation: '6205',
      d: '25',
      D: '52',
      B: '15',
      C_r: '14.0',
      C_0r: '7.85',
      speed_limit_grease: '12000',
      speed_limit_oil: '15000',
      mass: '0.128'
    }
  },
  bolt: {
    name: '螺栓数据模板',
    fields: ['designation', 'd', 'pitch', 'stress_area', 'head_width_s', 'head_height_k', 'standard'],
    example: {
      designation: 'M10',
      d: '10',
      pitch: '1.5',
      stress_area: '58',
      head_width_s: '17',
      head_height_k: '6.4',
      standard: 'GB/T 5782'
    }
  },
  material: {
    name: '材料数据模板',
    fields: ['designation', 'name_zh', 'density', 'E', 'yield_strength', 'tensile_strength', 'applications'],
    example: {
      designation: 'Q235B',
      name_zh: '碳素结构钢',
      density: '7.85',
      E: '206000',
      yield_strength: '235',
      tensile_strength: '370',
      applications: '一般结构,焊接结构'
    }
  }
}

/**
 * 生成导入模板 CSV
 */
export const generateImportTemplate = (templateType: keyof typeof standardTemplates): string => {
  const template = standardTemplates[templateType]
  const headers = template.fields.join(',')
  const example = template.fields.map(f => template.example[f as keyof typeof template.example]).join(',')
  return `${headers}\n${example}`
}
