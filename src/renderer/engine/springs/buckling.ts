/**
 * Section 10.5: 弹簧失稳 (Buckling) 校核
 * 基于 Haringx 理论，计算临界压缩变形量，防止侧向失稳
 */
import { Warning } from '../types'

export interface SpringBucklingParams {
  freeLength: number       // L0 自由长度 mm
  meanDiameter: number     // D 中径 mm
  endCondition: 'fixed-fixed' | 'fixed-hinged' | 'hinged-hinged' | 'fixed-free'
  workingDeflection: number // δ 工作压缩量 mm
}

export interface SpringBucklingResult {
  criticalLength: number   // Lcr 临界长度 mm
  safetyFactor: number     // 失稳安全系数
  maxDeflection: number    // δmax 允许最大压缩量 mm
  warnings: Warning[]
}

// 端部约束系数 μ (Haringx theory)
const endConditionMu: Record<string, number> = {
  'fixed-fixed': 0.5,
  'fixed-hinged': 0.707,
  'hinged-hinged': 1.0,
  'fixed-free': 2.0
}

export const calcSpringBuckling = (params: SpringBucklingParams): SpringBucklingResult => {
  const warnings: Warning[] = []
  const mu = endConditionMu[params.endCondition] || 1.0
  
  // Haringx 临界自由长度近似
  // Lcr ≈ (2.63 * D) / μ
  const criticalLength = (2.63 * params.meanDiameter) / mu
  
  // 稳定性判断：如果 L0 < Lcr，弹簧会失稳
  // 如果 L0 > Lcr，需要计算允许的最大压缩量
  let maxDeflection = 0
  let isStable = false
  
  if (params.freeLength > criticalLength) {
    isStable = true
    const effectiveLength = params.freeLength - params.workingDeflection
    if (effectiveLength < criticalLength) {
      isStable = false
    }
    maxDeflection = params.freeLength - criticalLength
  } else {
    isStable = false
  }
  
  const effectiveLength = Math.max(0.1, params.freeLength - params.workingDeflection)
  const safetyFactor = isStable ? effectiveLength / criticalLength : criticalLength / effectiveLength

  if (!isStable) {
    warnings.push({ 
      level: 'error', 
      message: `弹簧发生侧向失稳风险 (Lcr=${criticalLength.toFixed(1)}mm)`,
      suggestion: '加装导杆/导套，或更改端部约束方式'
    })
  } else if (safetyFactor < 1.5) {
    warnings.push({ level: 'warning', message: `失稳安全系数偏低 (SF=${safetyFactor.toFixed(2)})` })
  }
  
  return { criticalLength, safetyFactor: safetyFactor > 0 ? safetyFactor : 0, maxDeflection: Math.max(0, maxDeflection), warnings }
}
