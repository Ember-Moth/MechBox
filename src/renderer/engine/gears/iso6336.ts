/**
 * Section 10.4: 齿轮系统 - ISO 6336 强度校核
 * 弯曲疲劳 + 接触疲劳 + 修形建议
 */

import { CalcResult, Warning } from '../types'

export interface ISO6336Params {
  module: number           // 模数 m (mm)
  teeth1: number           // 小齿轮齿数
  teeth2: number           // 大齿轮齿数
  faceWidth: number        // 齿宽 b (mm)
  pressureAngle: number    // 压力角 α (°)
  torque1: number          // 小齿轮扭矩 N·m
  materialYield1: number   // 小齿轮材料屈服强度 MPa
  materialYield2: number   // 大齿轮材料屈服强度 MPa
  helixAngle?: number      // 螺旋角 β (°)
  applicationFactor?: number  // 使用系数 K_A
}

export interface ISO6336Result {
  // 几何参数
  d1: number               // 小齿轮分度圆 mm
  d2: number               // 大齿轮分度圆 mm
  contactRatio: number     // 重合度
  
  // 载荷系数
  K_A: number              // 使用系数
  K_V: number              // 动载系数
  K_Hbeta: number          // 齿向载荷分布系数
  K_Fbeta: number          // 齿根弯曲载荷分布系数
  
  // 应力
  sigmaH: number           // 接触应力 MPa
  sigmaF1: number          // 小齿轮弯曲应力 MPa
  sigmaF2: number          // 大齿轮弯曲应力 MPa
  
  // 安全系数
  SH1: number              // 接触安全系数 (小齿轮)
  SH2: number              // 接触安全系数 (大齿轮)
  SF1: number              // 弯曲安全系数 (小齿轮)
  SF2: number              // 弯曲安全系数 (大齿轮)
  
  // 修形建议
  tipRelief: number        // 齿顶修缘量 μm
  warnings: Warning[]
}

/**
 * ISO 6336 齿轮强度校核
 */
export const calcISO6336 = (params: ISO6336Params): CalcResult<ISO6336Result> => {
  const warnings: Warning[] = []
  const beta = params.helixAngle ?? 0
  const K_A = params.applicationFactor ?? 1.0
  
  // 1. 几何计算
  const betaRad = beta * Math.PI / 180
  const d1 = params.module * params.teeth1 / Math.cos(betaRad)
  const d2 = params.module * params.teeth2 / Math.cos(betaRad)
  
  // 重合度 (简化)
  const epsilonAlpha = 1.5 + 0.2 * (params.teeth1 - 17) / 30  // 简化估算
  const epsilonBeta = params.faceWidth * Math.sin(betaRad) / (Math.PI * params.module)
  const contactRatio = epsilonAlpha + epsilonBeta
  
  // 2. 切向力
  const Ft = 2000 * params.torque1 / d1  // N
  
  // 3. 载荷系数
  const K_V = 1.0 + 0.1 * (d1 * params.module / 100)  // 动载系数 (简化)
  const K_Hbeta = 1.0 + 0.1 * (params.faceWidth / d1)  // 齿向载荷分布系数
  const K_Fbeta = K_Hbeta  // 简化
  
  // 4. 接触应力 (赫兹应力)
  const Z_H = 2.5  // 区域系数 (20° 压力角)
  const Z_E = 189.8  // 弹性系数 (钢-钢)
  const Z_epsilon = Math.sqrt((4 - contactRatio) / 3)  // 重合度系数
  const Z_beta = Math.cos(betaRad)  // 螺旋角系数
  
  const sigmaH = Z_H * Z_E * Z_epsilon * Z_beta * 
                 Math.sqrt(Ft * K_A * K_V * K_Hbeta / (params.faceWidth * d1) * (params.teeth2 / params.teeth1 + 1))
  
  // 5. 弯曲应力
  const Y_Fa1 = 2.5 + 0.1 * (20 - params.teeth1) / 10  // 齿形系数 (简化)
  const Y_Fa2 = 2.5 + 0.1 * (20 - params.teeth2) / 10
  const Y_Sa1 = 1.6 + 0.05 * params.teeth1 / 20  // 应力修正系数
  const Y_Sa2 = 1.6 + 0.05 * params.teeth2 / 20
  const Y_epsilon = 0.25 + 0.75 / contactRatio  // 重合度系数
  const Y_beta = 1.0 - beta / 120  // 螺旋角系数
  
  const sigmaF1 = Ft * K_A * K_V * K_Fbeta / (params.faceWidth * params.module) * 
                  Y_Fa1 * Y_Sa1 * Y_epsilon * Y_beta
  const sigmaF2 = Ft * K_A * K_V * K_Fbeta / (params.faceWidth * params.module) * 
                  Y_Fa2 * Y_Sa2 * Y_epsilon * Y_beta
  
  // 6. 安全系数
  const sigmaHlim = 1500  // 接触疲劳极限 (钢，简化)
  const sigmaFlim = params.materialYield1 * 0.5  // 弯曲疲劳极限 (简化)
  
  const SH1 = sigmaHlim / sigmaH
  const SH2 = sigmaHlim / sigmaH  // 假设相同材料
  const SF1 = sigmaFlim / sigmaF1
  const SF2 = sigmaFlim / sigmaF2
  
  // 7. 齿顶修缘建议
  const tipRelief = 5 + 2 * params.module  // μm (经验公式)
  
  // 警告检查
  if (SH1 < 1.0) {
    warnings.push({ level: 'error', message: `接触安全系数过低 (SH=${SH1.toFixed(2)})`, suggestion: '增大模数或齿宽，或提高材料硬度' })
  } else if (SH1 < 1.5) {
    warnings.push({ level: 'warning', message: `接触安全系数偏低 (SH=${SH1.toFixed(2)})` })
  }
  
  if (SF1 < 1.5) {
    warnings.push({ level: 'error', message: `弯曲安全系数过低 (SF=${SF1.toFixed(2)})`, suggestion: '增大模数，或提高材料强度' })
  } else if (SF1 < 2.0) {
    warnings.push({ level: 'warning', message: `弯曲安全系数偏低 (SF=${SF1.toFixed(2)})` })
  }
  
  if (params.teeth1 < 17) {
    warnings.push({ level: 'warning', message: `小齿轮齿数 ${params.teeth1} < 17，存在根切风险`, suggestion: '建议采用正变位齿轮' })
  }
  
  if (contactRatio < 1.2) {
    warnings.push({ level: 'warning', message: `重合度 ${contactRatio.toFixed(2)} < 1.2`, suggestion: '增大齿宽或减小中心距' })
  }
  
  return {
    value: {
      d1, d2, contactRatio,
      K_A, K_V, K_Hbeta, K_Fbeta,
      sigmaH, sigmaF1, sigmaF2,
      SH1, SH2, SF1, SF2,
      tipRelief,
      warnings
    },
    unit: '',
    warnings
  }
}
