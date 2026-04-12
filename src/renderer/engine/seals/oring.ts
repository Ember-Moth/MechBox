import { CalcResult, Warning } from '../types'

/**
 * 密封圈计算引擎
 */
export const calcCompression = (cs: number, depth: number): CalcResult<number> => {
  const value = ((cs - depth) / cs) * 100
  const warnings: Warning[] = []

  if (value < 10) {
    warnings.push({ level: 'warning', message: '压缩率过低，可能导致泄漏', suggestion: '减小沟槽深度或增大线径' })
  } else if (value > 30) {
    warnings.push({ level: 'error', message: '压缩率过高，可能损坏密封圈', suggestion: '增大沟槽深度或减小线径' })
  }

  return { value, unit: '%', warnings }
}

export const calcStretch = (oringID: number, glandID: number): CalcResult<number> => {
  const value = ((glandID - oringID) / oringID) * 100
  const warnings: Warning[] = []

  if (value > 5) {
    warnings.push({ level: 'warning', message: '拉伸率过高，可能缩短寿命', suggestion: '选择更大内径的密封圈' })
  }

  return { value, unit: '%', warnings }
}
