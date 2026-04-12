/**
 * 轴强度校核计算引擎
 * 轴强度/挠度/临界转速基础校核
 * DEV_DOC Section 4.2
 */

import { CalcResult, Warning } from '../types'

export interface ShaftParams {
  diameter: number          // 轴径 d (mm)
  length: number            // 跨度 L (mm)
  bendingMoment: number     // 弯矩 M_b (N·mm)
  torque: number            // 扭矩 T (N·mm)
  axialForce?: number       // 轴向力 N
  materialYield: number     // 材料屈服强度 MPa
  supportType?: 'simply' | 'cantilever' | 'fixed'  // 支承类型
}

export interface ShaftResult {
  bendingStress: number       // 弯曲应力 MPa
  torsionalStress: number     // 扭转应力 MPa
  vonMisesStress: number      // von Mises 等效应力 MPa
  safetyFactor: number        // 安全系数
  deflection: number          // 最大挠度 mm
  criticalSpeed: number       // 临界转速 rpm
  warnings: Warning[]
}

/**
 * 轴强度校核
 */
export const calcShaftStrength = (params: ShaftParams): CalcResult<ShaftResult> => {
  const warnings: Warning[] = []
  const { diameter: d, length: L, bendingMoment: Mb, torque: T, axialForce = 0, materialYield, supportType = 'simply' } = params

  // 截面系数
  const W = Math.PI * Math.pow(d, 3) / 32  // 抗弯截面系数
  const Wt = Math.PI * Math.pow(d, 3) / 16  // 抗扭截面系数

  // 弯曲应力
  const bendingStress = Mb / W

  // 扭转应力
  const torsionalStress = T / Wt

  // von Mises 等效应力
  const vonMisesStress = Math.sqrt(Math.pow(bendingStress, 2) + 3 * Math.pow(torsionalStress, 2))

  // 安全系数
  const safetyFactor = materialYield / vonMisesStress

  if (safetyFactor < 1.5) {
    warnings.push({ level: 'error', message: `安全系数 ${safetyFactor.toFixed(2)} 不足`, suggestion: '建议安全系数 ≥ 1.5~2.0' })
  } else if (safetyFactor < 2.0) {
    warnings.push({ level: 'warning', message: '安全系数偏低' })
  }

  // 挠度计算
  const E = 2.06e5  // 钢弹性模量 MPa
  const I = Math.PI * Math.pow(d, 4) / 64  // 惯性矩
  
  let deflection = 0
  switch (supportType) {
    case 'simply':
      // 简支梁中点挠度 (等效集中载荷)
      deflection = Mb * L * L / (48 * E * I) * 1000
      break
    case 'cantilever':
      // 悬臂梁端部挠度
      deflection = Mb * L * L / (3 * E * I) * 1000
      break
    case 'fixed':
      // 固支梁中点挠度
      deflection = Mb * L * L / (192 * E * I) * 1000
      break
  }

  // 临界转速 (一阶)
  const g = 9810  // mm/s²
  const mass = Math.PI / 4 * Math.pow(d, 2) * L * 7.85e-6  // kg
  const criticalSpeed = (Math.PI / (2 * Math.PI)) * Math.sqrt(g / deflection) * 60

  if (deflection > 0.001 * L) {
    warnings.push({ level: 'warning', message: '挠度过大', suggestion: '建议挠度 < 0.001L' })
  }

  return {
    value: {
      bendingStress,
      torsionalStress,
      vonMisesStress,
      safetyFactor,
      deflection,
      criticalSpeed,
      warnings
    },
    unit: 'MPa',
    warnings
  }
}
