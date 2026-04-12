/**
 * Section 9: 企业级系统配置与管控中枢
 * 计算引擎调优、知识库管理、CAD联动、报告合规
 */

export interface EnterpriseSettings {
  // 基础设置
  language: 'zh-CN' | 'en-US'
  theme: 'light' | 'dark'
  showWelcomeOnStart: boolean

  // 9.1 求解器与引擎调优
  globalSafetyFactor: number     // 全局安全系数 (1.5 ~ 3.0)
  solverMaxIterations: number    // 最大迭代次数 (10 ~ 1000)
  solverTolerance: number        // 收敛容差 (1e-6 ~ 1e-12)
  monteCarloThreads: number      // 蒙特卡洛计算线程数 (1 ~ CPU核心数)

  // 9.2 知识库与数据隔离
  strictOfflineMode: boolean     // 物理隔离模式 (阻断所有外部网络)
  standardPrecedence: string[]   // 企业标准优先级 ['custom', 'GB', 'ISO', 'DIN']
  dbPathOverride: string         // 数据库路径重定向

  // 9.3 CAD 联动配置
  defaultCADTarget: 'solidworks' | 'inventor' | 'freecad' | 'autocad'
  websocketPort: number          // WebSocket 本地通信端口 (默认 8321)

  // 9.4 报告与合规模板
  companyName: string            // 公司名称
  defaultAuthor: string          // 默认编制人
  defaultReviewer: string        // 默认审核人
  companyLogo: string            // 企业 Logo 路径
  disclaimerText: string         // 免责声明
}

export const defaultEnterpriseSettings: EnterpriseSettings = {
  language: 'zh-CN',
  theme: 'light',
  showWelcomeOnStart: true,

  globalSafetyFactor: 1.5,
  solverMaxIterations: 100,
  solverTolerance: 1e-8,
  monteCarloThreads: 4,

  strictOfflineMode: false,
  standardPrecedence: ['custom', 'GB/T', 'ISO', 'DIN', 'JIS'],
  dbPathOverride: '',

  defaultCADTarget: 'solidworks',
  websocketPort: 8321,

  companyName: '',
  defaultAuthor: '',
  defaultReviewer: '',
  companyLogo: '',
  disclaimerText: '本计算书仅供参考，实际设计需经专业工程师审核确认。',
}

/**
 * 加载企业级设置 (从 localStorage 或主进程)
 */
export const loadEnterpriseSettings = (): EnterpriseSettings => {
  try {
    const saved = localStorage.getItem('mechbox-enterprise-settings')
    if (saved) {
      return { ...defaultEnterpriseSettings, ...JSON.parse(saved) }
    }
  } catch (e) { /* ignore */ }
  return { ...defaultEnterpriseSettings }
}

/**
 * 保存企业级设置
 */
export const saveEnterpriseSettings = (settings: EnterpriseSettings): void => {
  localStorage.setItem('mechbox-enterprise-settings', JSON.stringify(settings))
}

/**
 * 获取当前标准优先级
 */
export const getStandardPrecedence = (): string[] => {
  return loadEnterpriseSettings().standardPrecedence
}

/**
 * 检查是否处于严格离线模式
 */
export const isStrictOffline = (): boolean => {
  return loadEnterpriseSettings().strictOfflineMode
}
