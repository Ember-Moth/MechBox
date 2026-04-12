/**
 * 电机选型计算引擎
 * 伺服电机、步进电机、普通电机选型计算
 * DEV_DOC Section 6.10
 */

import { CalcResult, Warning } from '../types'

export interface MotorParams {
  loadForce: number         // 负载力 N (直线运动) 或负载扭矩 N·m (旋转运动)
  speed: number             // 转速 rpm
  inertia?: number          // 负载惯量 kg·m²
  acceleration?: number     // 加速度 rad/s²
  efficiency?: number       // 传动效率
  safetyFactor?: number     // 安全系数
}

export interface MotorResult {
  requiredTorque: number      // 所需扭矩 N·m
  requiredPower: number       // 所需功率 kW
  requiredSpeed: number       // 所需转速 rpm
  inertiaRatio: number        // 惯量比
  peakTorque: number          // 峰值扭矩 N·m
  rmsTorque: number           // 均方根扭矩 N·m
  recommendedMotorPower: number  // 推荐电机功率 kW
  warnings: Warning[]
}

/**
 * 电机选型计算
 */
export const calcMotorSelection = (params: MotorParams): CalcResult<MotorResult> => {
  const warnings: Warning[] = []
  const { loadForce, speed, inertia = 0, acceleration = 0, efficiency = 0.9, safetyFactor = 1.5 } = params

  // 负载扭矩
  const loadTorque = loadForce

  // 加速扭矩
  const accTorque = inertia * acceleration

  // 峰值扭矩
  const peakTorque = (loadTorque + accTorque) / efficiency

  // 均方根扭矩 (简化，假设恒定负载)
  const rmsTorque = loadTorque / efficiency

  // 所需功率
  const requiredPower = peakTorque * speed * 2 * Math.PI / 60000  // kW

  // 惯量比
  const inertiaRatio = inertia > 0 ? inertia / 0.0001 : 0  // 假设电机转子惯量 0.0001 kg·m²

  if (inertiaRatio > 10) {
    warnings.push({ level: 'warning', message: `惯量比 ${inertiaRatio.toFixed(1)} 过大`, suggestion: '伺服系统建议 < 10，高性能 < 3' })
  }

  // 推荐电机功率
  const recommendedMotorPower = requiredPower * safetyFactor

  return {
    value: {
      requiredTorque: loadTorque,
      requiredPower,
      requiredSpeed: speed,
      inertiaRatio,
      peakTorque,
      rmsTorque,
      recommendedMotorPower,
      warnings
    },
    unit: 'kW',
    warnings
  }
}
