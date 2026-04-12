/**
 * 工业紧凑主题配置
 * 解决"过度互联网化"问题，提供高密度专业界面
 */

export const industrialCompactTheme = {
  token: {
    // 色彩规范 - 工业感配色
    colorPrimary: '#1E3A8A',      // 深邃蓝 - 主色
    colorSuccess: '#22c55e',      // 绿色 - 仅用于"通过"状态
    colorWarning: '#f59e0b',      // 黄色 - 仅用于"警告"状态
    colorError: '#ef4444',        // 红色 - 仅用于"错误/危险"
    colorInfo: '#3b82f6',         // 蓝色 - 信息提示
    
    // 背景色
    colorBgLayout: '#f8fafc',     // 浅灰背景
    colorBgContainer: '#ffffff',  // 容器白色
    colorBgElevated: '#f1f5f9',   //  elevate 背景
    
    // 文字
    colorText: '#1e293b',         // 主文字 - 深灰
    colorTextSecondary: '#64748b', // 次要文字
    colorTextTertiary: '#94a3b8',  // 第三级文字
    
    // 边框
    colorBorder: '#e2e8f0',       // 边框色
    colorBorderSecondary: '#cbd5e1',
    
    // 紧凑模式参数
    padding: 8,                   // 减小内边距
    paddingSM: 6,
    paddingXS: 4,
    margin: 8,
    marginSM: 6,
    marginXS: 4,
    
    // 字体
    fontSize: 13,                 // 从14px减小到13px
    fontSizeSM: 12,
    fontSizeLG: 14,
    
    // 圆角 - 更小的圆角，更工业
    borderRadius: 4,              // 从6px减小到4px
    borderRadiusSM: 3,
    borderRadiusLG: 6,
    
    // 行高
    lineHeight: 1.4,              // 减小行高
    
    // 控件高度
    controlHeight: 28,            // 从32px减小到28px
    controlHeightSM: 24,
    controlHeightLG: 36,
    
    // 表格
    tablePaddingHorizontal: 8,
    tablePaddingVertical: 6,
  },
  
  components: {
    Card: {
      headerPadding: '8px 12px',
      paddingLG: 12,
    },
    Table: {
      padding: 6,
      paddingMD: 8,
    },
    Form: {
      itemMarginBottom: 12,       // 从24px减小到12px
      labelColonMarginRight: 4,
    },
    Input: {
      paddingInline: 8,
      paddingBlock: 4,
    },
    Select: {
      paddingInline: 8,
    },
    Descriptions: {
      itemPaddingBottom: 8,
      labelPaddingRight: 12,
    },
  },
};

/**
 * 工业风格CSS全局变量
 */
export const industrialCSS = `
/* 全局字体 - 等宽字体用于数值显示 */
.res-value, .number-display {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-variant-numeric: tabular-nums;
}

/* 减少动画时间，提升响应感 */
* {
  transition-duration: 0.15s !important;
}

/* 紧凑卡片样式 */
.compact-card .ant-card-head {
  min-height: 36px;
  padding: 0 12px;
}

.compact-card .ant-card-body {
  padding: 12px;
}

/* 状态标签严格语义化 */
.status-pass {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.status-warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.status-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

/* 高密度信息面板 */
.info-dense {
  font-size: 12px;
  line-height: 1.3;
}

.info-dense .label {
  color: #64748b;
  font-weight: 500;
}

.info-dense .value {
  color: #1e293b;
  font-weight: 600;
  font-family: monospace;
}

/* 工具栏紧凑 */
.toolbar-compact {
  padding: 6px 12px;
  background: #1e293b;
  color: white;
}

/* 响应式断点调整 */
@media (max-width: 1200px) {
  .responsive-grid {
    grid-template-columns: 1fr;
  }
}
`;
