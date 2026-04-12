/**
 * Solver Engine - 约束求解层
 * 支持牛顿迭代法、二分法、启发式搜索
 * 用于逆向计算和参数优化
 */

import { Warning } from '../types'

export interface SolverResult<T> {
  value: T
  iterations: number
  converged: boolean
  warnings: Warning[]
}

/**
 * 二分法求解器
 * 适用于单调函数的根查找
 * 
 * @param fn 目标函数 f(x) = 0
 * @param lowerBound 下界
 * @param upperBound 上界
 * @param tolerance 容差 (默认 1e-6)
 * @param maxIterations 最大迭代次数 (默认 100)
 */
export const bisectionSolver = (
  fn: (x: number) => number,
  lowerBound: number,
  upperBound: number,
  tolerance: number = 1e-6,
  maxIterations: number = 100
): SolverResult<number> => {
  const warnings: Warning[] = []
  let iterations = 0
  
  let low = lowerBound
  let high = upperBound
  let mid = (low + high) / 2
  
  // 验证边界
  const fnLow = fn(low)
  const fnHigh = fn(high)
  
  if (fnLow * fnHigh > 0) {
    return {
      value: mid,
      iterations: 0,
      converged: false,
      warnings: [{
        level: 'error',
        message: '函数在给定区间端点同号，无法保证有根',
        suggestion: '请扩大搜索区间或检查函数定义'
      }]
    }
  }
  
  // 二分迭代
  while (iterations < maxIterations) {
    mid = (low + high) / 2
    const fnMid = fn(mid)
    iterations++
    
    if (Math.abs(fnMid) < tolerance || (high - low) / 2 < tolerance) {
      return {
        value: mid,
        iterations,
        converged: true,
        warnings: []
      }
    }
    
    if (fnLow * fnMid < 0) {
      high = mid
    } else {
      low = mid
    }
  }
  
  warnings.push({
    level: 'warning',
    message: `达到最大迭代次数 (${maxIterations})，可能未完全收敛`,
    suggestion: '尝试增大容差或增加最大迭代次数'
  })
  
  return {
    value: mid,
    iterations,
    converged: false,
    warnings
  }
}

/**
 * 牛顿-拉夫逊法求解器
 * 适用于可导函数的快速收敛
 * 
 * @param fn 目标函数 f(x)
 * @param derivative 导数函数 f'(x)
 * @param initialGuess 初始猜测值
 * @param tolerance 容差 (默认 1e-8)
 * @param maxIterations 最大迭代次数 (默认 50)
 */
export const newtonRaphsonSolver = (
  fn: (x: number) => number,
  derivative: (x: number) => number,
  initialGuess: number,
  tolerance: number = 1e-8,
  maxIterations: number = 50
): SolverResult<number> => {
  const warnings: Warning[] = []
  let iterations = 0
  let x = initialGuess
  
  while (iterations < maxIterations) {
    const fx = fn(x)
    const dfx = derivative(x)
    iterations++
    
    if (Math.abs(dfx) < 1e-12) {
      return {
        value: x,
        iterations,
        converged: false,
        warnings: [{
          level: 'error',
          message: '导数接近零，牛顿法无法继续',
          suggestion: '尝试不同的初始猜测或使用二分法'
        }]
      }
    }
    
    const xNew = x - fx / dfx
    
    if (Math.abs(xNew - x) < tolerance || Math.abs(fx) < tolerance) {
      return {
        value: xNew,
        iterations,
        converged: true,
        warnings: []
      }
    }
    
    x = xNew
  }
  
  warnings.push({
    level: 'warning',
    message: `达到最大迭代次数 (${maxIterations})`,
    suggestion: '函数可能不收敛，尝试其他初始值'
  })
  
  return {
    value: x,
    iterations,
    converged: false,
    warnings
  }
}

/**
 * 离散值优化器 - 用于从标准库中搜索最优规格
 * 基于惩罚函数的启发式搜索
 * 
 * @param candidates 候选规格列表
 * @param objectiveFn 目标函数（越小越好）
 * @param constraints 约束条件列表
 * @param topN 返回前N个最优结果
 */
export const discreteOptimizer = <T>(
  candidates: T[],
  objectiveFn: (candidate: T) => number,
  constraints: Array<{
    check: (candidate: T) => boolean
    penalty: number
    description: string
  }>,
  topN: number = 5
): SolverResult<T[]> => {
  const warnings: Warning[] = []
  
  if (candidates.length === 0) {
    return {
      value: [],
      iterations: 0,
      converged: false,
      warnings: [{
        level: 'error',
        message: '候选列表为空'
      }]
    }
  }
  
  // 计算每个候选的得分（目标值 + 惩罚）
  const scored = candidates.map(candidate => {
    let score = objectiveFn(candidate)
    let violatedConstraints: string[] = []
    
    // 应用约束惩罚
    for (const constraint of constraints) {
      if (!constraint.check(candidate)) {
        score += constraint.penalty
        violatedConstraints.push(constraint.description)
      }
    }
    
    return {
      candidate,
      score,
      violatedConstraints,
      isValid: violatedConstraints.length === 0
    }
  })
  
  // 按得分排序
  scored.sort((a, b) => a.score - b.score)
  
  // 返回前N个
  const topCandidates = scored.slice(0, topN).map(s => s.candidate)
  
  if (scored[0].violatedConstraints.length > 0) {
    warnings.push({
      level: 'warning',
      message: '最优解违反部分约束',
      suggestion: `违反: ${scored[0].violatedConstraints.join(', ')}`
    })
  }
  
  return {
    value: topCandidates,
    iterations: candidates.length,
    converged: true,
    warnings
  }
}

/**
 * 轴承选型求解器 - 示例应用
 * 根据载荷、转速、寿命要求推荐轴承
 */
export const bearingSelectorSolver = (
  bearings: any[],
  radialLoad: number,    // kN
  axialLoad: number,     // kN
  speed: number,         // rpm
  targetLife: number,    // 小时
  maxOuterDiameter?: number  // 外径限制 (可选)
): SolverResult<any[]> => {
  // 目标函数：最小化轴承尺寸（外径）
  const objectiveFn = (bearing: any) => {
    return bearing.outer_diameter || bearing.D || 999
  }
  
  // 约束条件
  const constraints = [
    {
      check: (bearing: any) => {
        const C = bearing.C_r
        const P = 0.56 * radialLoad + 1.5 * axialLoad  // 简化当量载荷
        const L10 = Math.pow(C / P, 3) * (1000000 / (60 * speed))
        return L10 >= targetLife
      },
      penalty: 10000,
      description: `寿命 ≥ ${targetLife} 小时`
    },
    {
      check: (bearing: any) => {
        if (!maxOuterDiameter) return true
        return (bearing.outer_diameter || bearing.D) <= maxOuterDiameter
      },
      penalty: 5000,
      description: maxOuterDiameter ? `外径 ≤ ${maxOuterDiameter} mm` : '无限制'
    },
    {
      check: (bearing: any) => {
        const C_0r = bearing.C_0r
        const P_0 = 0.6 * radialLoad + 0.5 * axialLoad  // 静载荷
        return C_0r >= P_0
      },
      penalty: 8000,
      description: '静强度安全'
    }
  ]
  
  return discreteOptimizer(
    bearings,
    objectiveFn,
    constraints,
    5
  )
}

/**
 * 螺栓规格求解器 - 示例应用
 * 根据载荷和安全系数推荐螺栓
 */
export const boltSelectorSolver = (
  bolts: any[],
  axialLoad: number,       // kN
  shearLoad: number,       // kN
  safetyFactor: number = 1.5,
  yieldStrength: number = 640  // MPa (8.8级)
): SolverResult<any[]> => {
  const objectiveFn = (bolt: any) => {
    return bolt.d || 999  // 最小化直径
  }
  
  const constraints = [
    {
      check: (bolt: any) => {
        const As = bolt.stress_area
        const sigma = (axialLoad * 1000) / As
        const tau = (shearLoad * 1000) / (Math.PI * Math.pow(bolt.d, 2) / 4)
        const vonMises = Math.sqrt(sigma * sigma + 3 * tau * tau)
        return vonMises <= yieldStrength / safetyFactor
      },
      penalty: 10000,
      description: `强度校核通过 (安全系数≥${safetyFactor})`
    }
  ]
  
  return discreteOptimizer(bolts, objectiveFn, constraints, 5)
}
