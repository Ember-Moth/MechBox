/**
 * 液压气动计算引擎
 * 液压缸/气缸设计与计算
 * DEV_DOC Section 6.9
 */

import { CalcResult, Warning } from '../types'

export interface CylinderParams {
  boreDiameter: number       // 缸径 D (mm)
  rodDiameter: number        // 杆径 d (mm)
  pressure: number           // 工作压力 MPa
  stroke: number             // 行程 mm
  flowRate?: number          // 流量 L/min
}

export interface CylinderResult {
  pistonArea: number          // 活塞面积 mm²
  extendForce: number         // 伸出推力 N
  retractForce: number        // 缩回拉力 N
  extendSpeed: number         // 伸出速度 mm/s
  retractSpeed: number        // 缩回速度 mm/s
  flowRequired: number        // 所需流量 L/min
  bucklingRisk: boolean       // 失稳风险
  warnings: Warning[]
}

// 标准缸径系列 (GB/T 2348)
export const standardBoreSizes = [20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 180, 200, 220, 250, 280, 320]

/**
 * 液压缸计算
 */
export const calcCylinder = (params: CylinderParams): CalcResult<CylinderResult> => {
  const warnings: Warning[] = []
  const { boreDiameter: D, rodDiameter: d, pressure: P, stroke, flowRate = 0 } = params

  if (d >= D) {
    warnings.push({ level: 'error', message: '杆径不能大于或等于缸径' })
  }

  // 活塞面积
  const pistonArea = Math.PI * Math.pow(D, 2) / 4

  // 伸出推力
  const extendForce = P * pistonArea

  // 缩回拉力
  const rodArea = Math.PI * Math.pow(d, 2) / 4
  const retractForce = P * (pistonArea - rodArea)

  // 速度计算
  const extendSpeed = flowRate > 0 ? (flowRate * 1e6 / 60) / pistonArea : 0
  const retractSpeed = flowRate > 0 ? (flowRate * 1e6 / 60) / (pistonArea - rodArea) : 0

  // 所需流量
  const flowRequired = extendSpeed > 0 ? extendSpeed * pistonArea / 1e6 * 60 : 0

  // 压杆稳定校核 (欧拉公式)
  const E = 2.06e5  // 钢弹性模量 MPa
  const I = Math.PI * Math.pow(d, 4) / 64  // 惯性矩
  const mu = 2.0  // 一端固定一端铰接
  const criticalForce = Math.PI * Math.PI * E * I / Math.pow(mu * stroke, 2)
  
  const bucklingRisk = extendForce > criticalForce * 0.5

  if (bucklingRisk) {
    warnings.push({ level: 'warning', message: '存在压杆失稳风险', suggestion: '增大杆径或减小行程' })
  }

  return {
    value: {
      pistonArea,
      extendForce,
      retractForce,
      extendSpeed,
      retractSpeed,
      flowRequired,
      bucklingRisk,
      warnings
    },
    unit: 'N',
    warnings
  }
}
