# MechCalc 机械设计工具箱 - 开发文档

> 一个面向机械工程师的桌面计算工具，集成常用设计计算与选型功能，离线可用、开源免费。

---

## 目录

1. [项目概述](#1-项目概述)
2. [行业痛点与需求分析](#2-行业痛点与需求分析)
3. [竞品对比分析](#3-竞品对比分析)
4. [产品定位与功能规划](#4-产品定位与功能规划)
5. [技术架构](#5-技术架构)
6. [模块详细设计](#6-模块详细设计)
   - [6.1 密封圈模块](#61-密封圈模块seals)
   - [6.2 轴承模块](#62-轴承模块bearings)
   - [6.3 齿轮模块](#63-齿轮模块gears)
   - [6.4 螺栓连接模块](#64-螺栓连接模块bolts)
   - [6.5 键连接模块](#65-键连接模块keys)
   - [6.6 弹簧模块](#66-弹簧模块springs)
   - [6.7 公差配合模块](#67-公差配合模块tolerances)
   - [6.8 传动模块](#68-传动模块drives)
   - [6.9 液压气动模块](#69-液压气动模块hydraulics)
   - [6.10 电机选型模块](#610-电机选型模块motors)
7. [数据库设计](#7-数据库设计)
8. [计算引擎架构](#8-计算引擎架构)
9. [UI/UX 设计](#9-uiux-设计)
10. [开发路线图](#10-开发路线图)
11. [测试策略](#11-测试策略)
12. [发布与部署](#12-发布与部署)
13. [附录](#13-附录)

---

## 1. 项目概述

### 1.1 项目名称

**MechCalc** - 机械设计工具箱

### 1.2 项目愿景

> 让每一位机械工程师都能快速、准确、自信地完成日常设计计算。

### 1.3 核心价值

| 价值维度 | 说明 |
|---------|------|
| **一站式集成** | 10+常用计算模块，告别散落的Excel |
| **离线优先** | 无需联网，车间现场也能用 |
| **开源免费** | 无订阅费，无模块限制 |
| **标准内置** | 国标/ISO/美标数据内置，不担心用错 |
| **持续迭代** | 社区贡献，功能持续增加 |

### 1.4 目标用户

- 机械设计工程师（主力用户）
- 设备维护工程师
- 机械专业学生/毕业生
- 非标自动化设计人员

### 1.5 技术栈

```
┌─────────────────────────────────────────────┐
│              技术栈总览                      │
├──────────────┬──────────────────────────────┤
│ 运行环境     │ Electron ^28                 │
│ 构建工具     │ Vite ^5                      │
│ 前端框架     │ React ^18 + TypeScript ^5    │
│ UI 组件库    │ Ant Design ^5                │
│ 图表可视化   │ ECharts ^5                   │
│ 状态管理     │ Zustand ^4                   │
│ 路由         │ React Router ^6              │
│ PDF导出      │ jsPDF + html2canvas          │
│ Excel导出    │ SheetJS (xlsx)               │
│ 单元测试     │ Vitest                       │
│ 打包工具     │ electron-builder ^24         │
└──────────────┴──────────────────────────────┘
```

---

## 2. 行业痛点与需求分析

### 2.1 核心痛点

```
┌──────────────────────────────────────────────────────────────┐
│                    机械设计六大痛点                           │
├──────────────┬───────────────────────────────────────────────┤
│ 1. 数据分散  │ 手册、PDF、Excel、网站散落各处，查找效率低    │
│ 2. 计算繁琐  │ 每个项目重复计算，手动查表，耗时且易错        │
│ 3. 选型困难  │ 型号繁多，参数复杂，依赖个人经验              │
│ 4. 标准混乱  │ 国标/ISO/ASME/JIS并存，容易选错规格           │
│ 5. 配合计算  │ 公差堆叠、轴承游隙计算复杂，装配问题频发      │
│ 6. 知识流失  │ 老工程师经验难以沉淀，新人反复踩坑            │
└──────────────┴───────────────────────────────────────────────┘
```

### 2.2 用户需求调研

根据行业调研，机械设计师日常使用频率最高的计算项目：

| 排名 | 计算项目 | 使用频率 | 痛点程度 | 现有工具满意度 |
|:----:|---------|:-------:|:-------:|:-------------:|
| 1 | 轴承选型与配合 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 2 | 公差配合查询 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| 3 | 密封圈/沟槽计算 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ |
| 4 | 齿轮计算 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 5 | 螺栓连接计算 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| 6 | 弹簧计算 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 7 | 轴的设计校核 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 8 | 电机选型 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 9 | 键连接 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| 10 | 皮带/链条传动 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

### 2.3 使用场景

```
场景1: 新员工小王接手一个液压缸设计项目
  → 需要计算密封圈沟槽 → 查手册 → 选轴承 → 校核螺栓 → 选电机
  → 痛点: 每个都要找不同工具/手册

场景2: 张工在车间现场发现密封泄漏
  → 需要快速核对沟槽尺寸是否合格
  → 痛点: 现场无电脑，手机网页工具加载慢

场景3: 李工需要给客户提供设计计算书
  → 需要导出规范的计算报告
  → 痛点: 手算记录不规范，Excel不够美观
```

---

## 3. 竞品对比分析

### 3.1 商业软件

| 产品 | 类型 | 价格 | 覆盖模块 | 优点 | 缺点 |
|------|------|------|---------|------|------|
| **MITCalc** | Excel插件 | $50-100 | 齿轮/轴/轴承/螺栓/弹簧/梁 | 功能全面，有VBA源码 | 界面老旧，需Excel |
| **MechaniCalc** | Web | 按模块收费 | 梁/轴/轴承/螺栓/焊接/材料 | 界面现代，在线可用 | 按模块收费，需联网 |
| **KissSoft** | 专业软件 | $5000+ | 齿轮/轴承/传动(专业级) | 行业标准，极专业 | 昂贵，学习成本高 |
| **Parker O-Ring** | Web工具 | 免费 | 仅密封圈 | 官方数据准确 | 功能单一，需联网 |
| **SKF Bearing** | Web/App | 免费 | 仅SKF轴承 | 数据权威 | 仅限SKF产品 |

### 3.2 开源项目

| 项目 | 技术 | 功能 | 状态 |
|------|------|------|------|
| **everycalc** | HTML/JS | 简单O型圈/梁计算 | 功能有限 |
| **o-ring-finder** | React/TS | O型圈搜索过滤 | 无计算引擎 |
| **various Excel tools** | Excel | 单一功能计算表 | 分散难管理 |

### 3.3 我们的差异化优势

| 维度 | 我们的优势 |
|------|-----------|
| **集成度** | 10+模块集成在一个工具中 |
| **离线** | 完全离线可用 |
| **多标准** | 国标/ISO/ASME/JIS统一支持 |
| **开源** | 社区可贡献新模块和数据 |
| **现代UI** | 基于 Electron + React，体验好 |
| **导出** | PDF计算书 + Excel数据导出 |
| **免费** | 无任何收费模块 |

---

## 4. 产品定位与功能规划

### 4.1 功能矩阵

```
┌─────────────────────────────────────────────────────────────────┐
│                     MechCalc 功能矩阵                           │
├─────────────┬───────────┬───────────┬───────────┬──────────────┤
│   模块      │  正向计算  │  反向计算  │  数据查询  │  校验/报告   │
├─────────────┼───────────┼───────────┼───────────┼──────────────┤
│ 密封圈      │ 圈→槽     │ 槽→圈     │ 标准库    │ 工况校验     │
│ 轴承        │ 载荷→型号 │ 空间→型号 │ 型号库    │ 寿命/转速    │
│ 齿轮        │ 参数→尺寸 │ 中心距→参 │ 模数系列  │ 强度校核     │
│ 螺栓连接    │ 载荷→规格 │ -         │ 标准件库  │ 强度校核     │
│ 键连接      │ 轴径→键   │ -         │ 键尺寸表  │ 强度校核     │
│ 弹簧        │ 参数→刚度 │ 刚度→参数 │ 标准弹簧  │ 疲劳校核     │
│ 公差配合    │ -         │ -         │ 公差表    │ 配合计算     │
│ 传动        │ 功率→型号 │ -         │ 带型/链号 │ 参数校核     │
│ 液压气动    │ 推力→缸径 │ -         │ 标准缸径  │ 稳定性校核   │
│ 电机选型    │ 负载→电机 │ -         │ 电机规格  │ 惯量匹配     │
└─────────────┴───────────┴───────────┴───────────┴──────────────┘
```

### 4.2 功能优先级

| 阶段 | 模块 | 优先级 | 预计工期 |
|------|------|:------:|:-------:|
| **Phase 1** | 项目框架 + 公差配合 + 密封圈 | P0 | 3周 |
| **Phase 2** | 轴承 + 螺栓连接 + 键连接 | P0 | 3周 |
| **Phase 3** | 齿轮 + 弹簧 + 传动 | P1 | 3周 |
| **Phase 4** | 液压气动 + 电机选型 + 轴校核 | P1 | 3周 |
| **Phase 5** | 公差堆叠 + 材料库 + 导出 + 设置 | P2 | 2周 |
| **Phase 6** | 测试 + 打包 + 文档 + 发布 | - | 2周 |

**总计：约 16 周**

---

## 5. 技术架构

### 5.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Main Process                    │
│  ┌──────────────┐ ┌───────────────┐ ┌─────────────────────┐ │
│  │ Window Mgmt  │ │ IPC Handlers  │ │ File I/O Service    │ │
│  └──────────────┘ └───────────────┘ └─────────────────────┘ │
│                          │ IPC (异步)                       │
├─────────────────────────────────────────────────────────────┤
│                    Renderer Process (React)                   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Shell / Layout                      │  │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │  │
│  │  │Sidebar│ │Header│ │Main │ │Footer│ │Tabs │ │Settings│ │  │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Module Pages                         │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │  │Seals    │ │Bearings │ │Gears    │ │Bolts    │    │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │  │Springs  │ │Tolerance│ │Drives   │ │Hydraulic│    │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               Calculation Engine (纯函数)               │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │  │/seals   │ │/bearings│ │/gears   │ │/bolts   │    │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   State (Zustand)                     │  │
│  │  calculatorStore | settingsStore | favoritesStore     │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      Data Layer                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │standards│ │catalogs │ │materials│ │formulas │          │
│  │ (JSON)  │ │ (JSON)  │ │ (JSON)  │ │  (TS)   │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 目录结构

```
mechcalc/
├── src/
│   ├── main/                           # Electron 主进程
│   │   ├── index.ts                    # 主进程入口
│   │   ├── ipc-handlers.ts             # IPC 通信处理
│   │   ├── auto-update.ts              # 自动更新
│   │   └── file-service.ts             # 文件读写服务
│   │
│   ├── renderer/                       # 渲染进程
│   │   ├── components/                 # 通用组件
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx        # 主布局
│   │   │   │   ├── Sidebar.tsx         # 侧边栏导航
│   │   │   │   ├── ModuleHeader.tsx    # 模块标题栏
│   │   │   │   └── StatusBar.tsx       # 底部状态栏
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── UnitInput.tsx       # 带单位的输入框
│   │   │   │   ├── UnitToggle.tsx      # 单位切换(mm/inch)
│   │   │   │   ├── ResultCard.tsx      # 结果展示卡片
│   │   │   │   ├── WarningBanner.tsx   # 警告提示条
│   │   │   │   ├── ParamTable.tsx      # 参数表格
│   │   │   │   ├── FormulaDisplay.tsx  # 公式展示(LaTeX)
│   │   │   │   ├── StandardBadge.tsx   # 标准标签
│   │   │   │   └── CopyButton.tsx      # 复制按钮
│   │   │   │
│   │   │   └── charts/
│   │   │       ├── CompressionGauge.tsx    # 压缩率仪表盘
│   │   │       ├── LifeCurve.tsx           # 寿命曲线
│   │   │       └── StressBar.tsx           # 应力柱状图
│   │   │
│   │   ├── modules/                    # 功能模块
│   │   │   ├── seals/                  # 密封圈模块
│   │   │   │   ├── SealsPage.tsx
│   │   │   │   ├── ForwardCalc.tsx
│   │   │   │   ├── ReverseCalc.tsx
│   │   │   │   ├── StandardLibrary.tsx
│   │   │   │   └── MaterialSelector.tsx
│   │   │   │
│   │   │   ├── bearings/               # 轴承模块
│   │   │   │   ├── BearingsPage.tsx
│   │   │   │   ├── SelectionCalc.tsx
│   │   │   │   ├── FitCalc.tsx
│   │   │   │   ├── ClearanceCalc.tsx
│   │   │   │   └── CatalogBrowser.tsx
│   │   │   │
│   │   │   ├── gears/                  # 齿轮模块
│   │   │   │   ├── GearsPage.tsx
│   │   │   │   ├── SpurGearCalc.tsx    # 直齿轮
│   │   │   │   ├── HelicalGearCalc.tsx # 斜齿轮
│   │   │   │   └── StrengthCheck.tsx   # 强度校核
│   │   │   │
│   │   │   ├── bolts/                  # 螺栓模块
│   │   │   │   ├── BoltsPage.tsx
│   │   │   │   ├── BoltCalc.tsx
│   │   │   │   └── StandardLibrary.tsx
│   │   │   │
│   │   │   ├── keys/                   # 键连接模块
│   │   │   │   ├── KeysPage.tsx
│   │   │   │   └── KeyCalc.tsx
│   │   │   │
│   │   │   ├── springs/                # 弹簧模块
│   │   │   │   ├── SpringsPage.tsx
│   │   │   │   ├── CompressionCalc.tsx
│   │   │   │   └── ExtensionCalc.tsx
│   │   │   │
│   │   │   ├── tolerances/             # 公差配合模块
│   │   │   │   ├── TolerancesPage.tsx
│   │   │   │   ├── FitLookup.tsx       # 配合查询
│   │   │   │   └── StackAnalysis.tsx   # 公差堆叠
│   │   │   │
│   │   │   ├── drives/                 # 传动模块
│   │   │   │   ├── DrivesPage.tsx
│   │   │   │   ├── BeltCalc.tsx
│   │   │   │   └── ChainCalc.tsx
│   │   │   │
│   │   │   ├── hydraulics/             # 液压气动模块
│   │   │   │   ├── HydraulicsPage.tsx
│   │   │   │   ├── CylinderCalc.tsx
│   │   │   │   └── FlowCalc.tsx
│   │   │   │
│   │   │   ├── motors/                 # 电机选型模块
│   │   │   │   ├── MotorsPage.tsx
│   │   │   │   └── MotorCalc.tsx
│   │   │   │
│   │   │   ├── materials/              # 材料库模块
│   │   │   │   ├── MaterialsPage.tsx
│   │   │   │   └── CompatChecker.tsx
│   │   │   │
│   │   │   └── shafts/                 # 轴设计模块
│   │   │       ├── ShaftsPage.tsx
│   │   │       └── ShaftCalc.tsx
│   │   │
│   │   ├── engine/                     # 计算引擎(核心)
│   │   │   ├── index.ts                # 引擎入口
│   │   │   ├── types.ts                # 引擎类型定义
│   │   │   │
│   │   │   ├── seals/                  # 密封圈计算
│   │   │   │   ├── compression.ts
│   │   │   │   ├── stretch.ts
│   │   │   │   ├── groove.ts
│   │   │   │   └── validator.ts
│   │   │   │
│   │   │   ├── bearings/               # 轴承计算
│   │   │   │   ├── life.ts             # 寿命计算(L10)
│   │   │   │   ├── load.ts             # 当量载荷
│   │   │   │   ├── fit.ts              # 配合计算
│   │   │   │   ├── clearance.ts        # 游隙计算
│   │   │   │   └── speed.ts            # 转速校核
│   │   │   │
│   │   │   ├── gears/                  # 齿轮计算
│   │   │   │   ├── geometry.ts         # 几何尺寸
│   │   │   │   ├── contact-ratio.ts    # 重合度
│   │   │   │   └── strength.ts         # 强度校核
│   │   │   │
│   │   │   ├── bolts/                  # 螺栓计算
│   │   │   │   ├── preload.ts          # 预紧力
│   │   │   │   ├── strength.ts         # 强度校核
│   │   │   │   └── loosening.ts        # 防松校核
│   │   │   │
│   │   │   ├── keys/                   # 键计算
│   │   │   │   └── strength.ts
│   │   │   │
│   │   │   ├── springs/                # 弹簧计算
│   │   │   │   ├── stiffness.ts        # 刚度
│   │   │   │   └── stress.ts           # 应力
│   │   │   │
│   │   │   ├── tolerances/             # 公差计算
│   │   │   │   ├── fit.ts              # 配合计算
│   │   │   │   ├── stack.ts            # 公差堆叠
│   │   │   │   └── conversion.ts       # 等级转换
│   │   │   │
│   │   │   ├── drives/                 # 传动计算
│   │   │   │   ├── belt.ts
│   │   │   │   └── chain.ts
│   │   │   │
│   │   │   ├── hydraulics/             # 液压计算
│   │   │   │   └── cylinder.ts
│   │   │   │
│   │   │   ├── motors/                 # 电机计算
│   │   │   │   └── selection.ts
│   │   │   │
│   │   │   └── shafts/                 # 轴计算
│   │   │       └── strength.ts
│   │   │
│   │   ├── store/                      # 状态管理
│   │   │   ├── useCalcStore.ts         # 计算状态
│   │   │   ├── useSettingsStore.ts     # 设置状态
│   │   │   └── useFavoritesStore.ts    # 收藏状态
│   │   │
│   │   ├── hooks/                      # 自定义 Hooks
│   │   │   ├── useModuleCalc.ts        # 模块计算 Hook
│   │   │   ├── useStandardData.ts      # 标准数据 Hook
│   │   │   └── useUnitConvert.ts       # 单位转换 Hook
│   │   │
│   │   ├── utils/                      # 工具函数
│   │   │   ├── unit-converter.ts
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── export/                     # 导出服务
│   │   │   ├── pdf-export.ts           # PDF 导出
│   │   │   └── excel-export.ts         # Excel 导出
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   └── shared/                         # 共享类型
│       ├── types.ts
│       ├── standards.ts
│       └── ipc-channels.ts
│
├── data/                               # 数据库
│   ├── standards/
│   │   ├── o-ring/
│   │   │   ├── as568.json
│   │   │   ├── gb3452-g.json
│   │   │   ├── gb3452-a.json
│   │   │   ├── iso3601.json
│   │   │   └── jis-b2401.json
│   │   ├── bearings/
│   │   │   ├── deep-groove.json        # 深沟球轴承
│   │   │   ├── angular-contact.json    # 角接触轴承
│   │   │   └── tapered-roller.json     # 圆锥滚子轴承
│   │   ├── bolts/
│   │   │   ├── gb5782.json             # 六角螺栓
│   │   │   ├── property-classes.json   # 性能等级
│   │   │   └── torque-table.json       # 扭矩推荐表
│   │   ├── keys/
│   │   │   └── gb1095.json             # 平键
│   │   ├── gears/
│   │   │   ├── module-series.json      # 模数系列
│   │   │   └── rack-series.json        # 齿条系列
│   │   ├── springs/
│   │   │   └── iso10243.json           # 模具弹簧
│   │   ├── tolerances/
│   │   │   ├── iso286.json             # ISO 286 公差
│   │   │   └── fits-recommendation.json # 配合推荐表
│   │   └── drives/
│   │       ├── v-belt.json             # V带系列
│   │       ├── timing-belt.json        # 同步带
│   │       └── roller-chain.json       # 滚子链
│   │
│   ├── materials.json                  # 材料数据库
│   ├── chemical-compat.json            # 化学兼容性
│   └── groove-params.json              # 沟槽参数
│
├── resources/
│   ├── icons/
│   ├── locales/
│   │   ├── zh-CN.json
│   │   └── en-US.json
│   └── formulas/                       # 公式定义
│       └── all.json
│
├── tests/
│   ├── engine/                         # 计算引擎单元测试
│   └── integration/                    # 集成测试
│
├── electron-builder.json
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .gitignore
└── README.md
```

### 5.3 数据流架构

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 用户输入  │───>│ 组件状态  │───>│ 计算引擎  │───>│ 结果渲染  │
│ (表单)   │    │(Zustand) │    │ (纯函数)  │    │ (ECharts)│
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                      │                                │
                      ▼                                ▼
                ┌──────────┐    ┌──────────┐    ┌──────────┐
                │ 历史记录  │    │ JSON数据  │    │ PDF导出  │
                └──────────┘    └──────────┘    └──────────┘
```

### 5.4 模块注册机制

```typescript
// 每个模块通过统一接口注册
interface ModuleDefinition {
  id: string;                    // 模块ID
  name: string;                  // 模块名称
  icon: React.ReactNode;         // 图标
  path: string;                  // 路由路径
  component: React.ComponentType;// 页面组件
  priority: number;              // 优先级(决定侧边栏顺序)
}

// 模块注册表
const moduleRegistry: ModuleDefinition[] = [
  { id: 'seals', name: '密封圈', path: '/seals', ... },
  { id: 'bearings', name: '轴承', path: '/bearings', ... },
  { id: 'tolerances', name: '公差配合', path: '/tolerances', ... },
  // ... 更多模块
];
```

---

## 6. 模块详细设计

### 6.1 密封圈模块 (Seals)

#### 6.1.1 功能概述

O型圈选型、沟槽设计、材料选择一站式计算。

#### 6.1.2 功能清单

| 功能 | 说明 |
|------|------|
| 正向计算 | 选密封圈 → 推荐沟槽尺寸 |
| 反向计算 | 输沟槽尺寸 → 匹配密封圈 |
| 标准库 | AS568 / GB/T 3452 / ISO 3601 / JIS B 2401 浏览搜索 |
| 材料选择 | NBR/FKM/EPDM 等材料与工况匹配 |
| 压缩率计算 | 可视化显示压缩率 |
| 拉伸率计算 | 安装拉伸率校验 |
| 化学兼容性 | 材料-介质兼容性查询 |
| 工况校验 | 温度/压力/速度校验 |

#### 6.1.3 数据结构

```typescript
interface SealSize {
  standard: 'AS568' | 'GB3452' | 'ISO3601' | 'JIS';
  code: string;                  // 规格代号
  id: number;                    // 内径 (mm)
  cs: number;                    // 线径 (mm)
  od: number;                    // 外径 (mm) = id + 2*cs
  id_tolerance: { min: number; max: number };
  cs_tolerance: { min: number; max: number };
}

interface GrooveDesign {
  depth: number;                 // 沟槽深度
  width: number;                 // 沟槽宽度
  bottom_radius: number;         // 底部圆角
  side_angle: number;            // 侧角(°)
  surface_finish: string;        // 表面粗糙度
}

interface SealCalcResult {
  seal: SealSize;
  groove: GrooveDesign;
  compression_ratio: number;     // 压缩率 %
  stretch_ratio: number;         // 拉伸率 %
  fill_rate: number;             // 填充率 %
  warnings: ValidationResult[];  // 警告
  material_recommend?: string;   // 材料推荐
}
```

#### 6.1.4 计算公式

```typescript
// 压缩率
compression = (cs - grooveDepth) / cs × 100%

// 拉伸率
stretch = (glandID - sealID) / sealID × 100%

// 沟槽深度(目标压缩率)
grooveDepth = cs × (1 - targetCompression / 100)

// 沟槽宽度推荐
grooveWidth = cs × (1.2 ~ 1.5)

// 填充率
fillRate = (π × cs² / 4) / (grooveDepth × grooveWidth) × 100%
```

#### 6.1.5 压缩率推荐值

| 工况 | 压缩率范围 | 推荐值 |
|------|-----------|:------:|
| 静密封(固定) | 18% ~ 30% | 20% |
| 往复运动 | 10% ~ 20% | 15% |
| 旋转运动 | 0% ~ 10% | 5% |
| 真空密封 | 20% ~ 30% | 25% |
| 端面密封 | 20% ~ 30% | 25% |

#### 6.1.6 材料数据库

| 材料 | 温度范围 | 硬度 | 特点 | 适用介质 |
|------|---------|:----:|------|---------|
| NBR | -30~120℃ | 70±5 | 耐油 | 矿物油、液压油 |
| FKM/Viton | -20~200℃ | 75±5 | 耐高温/化学 | 酸碱、化学品 |
| EPDM | -50~150℃ | 70±5 | 耐水蒸气 | 热水、酸碱 |
| VMQ/Si | -60~200℃ | 60±5 | 食品级 | 食品、医疗 |
| HNBR | -40~150℃ | 75±5 | 高强度 | 制冷剂、油 |
| PTFE | -200~260℃ | - | 全介质 | 所有介质 |
| FFKM/Kalrez | -15~327℃ | 75~85 | 超耐化学 | 极端工况 |

---

### 6.2 轴承模块 (Bearings)

#### 6.2.1 功能概述

滚动轴承选型、配合计算、游隙计算、寿命校核。

#### 6.2.2 功能清单

| 功能 | 说明 |
|------|------|
| 轴承选型 | 输入载荷、转速 → 推荐轴承型号 |
| 寿命计算 | L10 寿命计算 (ISO 281) |
| 配合计算 | 轴/座孔公差配合 (ISO 12129) |
| 游隙计算 | 原始→安装→工作游隙 |
| 转速校核 | 极限转速 vs 工作转速 |
| 型号库 | 深沟球/角接触/圆锥滚子等 |

#### 6.2.3 数据结构

```typescript
interface Bearing {
  type: 'deep-groove' | 'angular-contact' | 'tapered-roller' | 'cylindrical-roller';
  designation: string;             // 型号, 如 "6205"
  d: number;                       // 内径 (mm)
  D: number;                       // 外径 (mm)
  B: number;                       // 宽度 (mm)
  C_r: number;                     // 额定动载荷 (kN)
  C_0r: number;                    // 额定静载荷 (kN)
  speed_limit_grease: number;      // 脂润滑极限转速 (rpm)
  speed_limit_oil: number;         // 油润滑极限转速 (rpm)
  mass: number;                    // 质量 (kg)
  clearance_groups: ClearanceGroup[];
}

interface BearingLoad {
  radial: number;                  // 径向载荷 (kN)
  axial: number;                   // 轴向载荷 (kN)
}

interface BearingLifeResult {
  L10: number;                     // 基本额定寿命 (百万转)
  L10h: number;                    // 小时寿命 (h)
  P: number;                       // 当量动载荷 (kN)
}
```

#### 6.2.4 计算公式

```typescript
// 基本额定寿命 L10 (百万转)
L10 = (C / P) ^ p
// C: 额定动载荷, P: 当量动载荷, p: 指数(球轴承=3, 滚子轴承=10/3)

// 小时寿命
L10h = (10^6 / (60 × n)) × L10
// n: 转速 (rpm)

// 当量动载荷
P = X × Fr + Y × Fa
// X, Y: 系数, Fr: 径向载荷, Fa: 轴向载荷

// 配合引起的游隙减少量
Δj = Δdy × (d / (d + D))
// Δdy: 过盈量, d: 内径, D: 外径

// 温差引起的游隙变化
Δt = α × ΔT × (D - d)
// α: 线膨胀系数, ΔT: 温差

// 工作游隙
Clearance_working = Clearance_initial - Δj - Δt
```

#### 6.2.5 配合推荐表 (深沟球轴承)

| 工况 | 内圈配合 | 外圈配合 |
|------|---------|---------|
| 轻载 (P/C < 0.06) | g6 | H7 |
| 正常 (P/C = 0.06~0.12) | k5 | J7 |
| 重载 (P/C > 0.12) | m5 / n6 | K7 / M7 |
| 旋转内圈 | k5 ~ m6 | H7 ~ J7 |
| 旋转外圈 | G6 ~ H6 | K7 ~ M7 |

#### 6.2.6 游隙组别 (ISO 5753)

| 游隙组 | 6205 (25×52×15) | 说明 |
|:------:|:--------------:|------|
| C2 | 0.005~0.020 mm | 小于标准 |
| CN (标准) | 0.010~0.025 mm | 标准游隙 |
| C3 | 0.015~0.033 mm | 大于标准 |
| C4 | 0.025~0.045 mm | 更大 |
| C5 | 0.040~0.065 mm | 最大 |

---

### 6.3 齿轮模块 (Gears)

#### 6.3.1 功能概述

渐开线圆柱齿轮几何尺寸计算、强度校核。

#### 6.3.2 功能清单

| 功能 | 说明 |
|------|------|
| 直齿轮计算 | 分度圆、齿顶圆、齿根圆等 |
| 斜齿轮计算 | 螺旋角相关计算 |
| 变位齿轮 | 变位系数计算 |
| 中心距计算 | 标准/非标准中心距 |
| 重合度计算 | 端面/纵向重合度 |
| 强度校核 | 接触疲劳 + 弯曲疲劳 |

#### 6.3.3 数据结构

```typescript
interface GearParams {
  module: number;                  // 模数 m (mm)
  teeth_z1: number;                // 小齿轮齿数
  teeth_z2: number;                // 大齿轮齿数
  pressure_angle: number;          // 压力角 α (°), 通常20°
  helix_angle: number;             // 螺旋角 β (°), 直齿轮=0
  x1: number;                      // 小齿轮变位系数
  x2: number;                      // 大齿轮变位系数
  face_width: number;              // 齿宽 (mm)
}

interface GearGeometry {
  d1: number;                      // 小齿轮分度圆
  d2: number;                      // 大齿轮分度圆
  da1: number;                     // 小齿轮齿顶圆
  da2: number;                     // 大齿轮齿顶圆
  df1: number;                     // 小齿轮齿根圆
  df2: number;                     // 大齿轮齿根圆
  center_distance: number;         // 中心距
  contact_ratio: number;           // 重合度
}
```

#### 6.3.4 计算公式

```typescript
// 分度圆直径
d = m × z

// 齿顶高
ha = m × (1 + x)

// 齿根高
hf = m × (1.25 - x)  // 齿顶间隙系数 c* = 0.25

// 齿顶圆直径
da = d + 2 × ha = m × z + 2 × m × (1 + x)

// 齿根圆直径
df = d - 2 × hf = m × z - 2 × m × (1.25 - x)

// 标准中心距
a = m × (z1 + z2) / 2

// 基圆直径
db = d × cos(α)

// 重合度 (直齿轮)
ε = [z1×(tan(αa1) - tan(α')) + z2×(tan(αa2) - tan(α'))] / (2π)

// 斜齿轮端面模数
mt = mn / cos(β)

// 斜齿轮中心距
a = mn × (z1 + z2) / (2 × cos(β))
```

#### 6.3.5 标准模数系列 (GB/T 1357)

| 第一系列 | 1 | 1.25 | 1.5 | 2 | 2.5 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 25 |
|---------|---|------|-----|---|-----|---|---|---|---|---|----|----|----|----|----|
| 第二系列 | 1.125 | 1.375 | 1.75 | 2.25 | 2.75 | 3.5 | 4.5 | 5.5 | 7 | 9 | 11 | 14 | 18 | 22 |

---

### 6.4 螺栓连接模块 (Bolts)

#### 6.4.1 功能概述

螺栓规格选择、预紧力计算、强度校核。

#### 6.4.2 功能清单

| 功能 | 说明 |
|------|------|
| 规格选择 | 载荷 → 推荐螺栓规格和等级 |
| 预紧力计算 | 预紧扭矩 → 预紧力 |
| 强度校核 | 拉伸 + 剪切 + 复合应力 |
| 防松校核 | 自锁条件校验 |
| 标准库 | GB/ISO 螺栓规格表 |

#### 6.4.3 数据结构

```typescript
interface BoltSpec {
  designation: string;             // 规格, 如 "M10×1.5"
  d: number;                       // 公称直径 (mm)
  pitch: number;                   // 螺距 (mm)
  stress_area: number;             // 应力截面积 (mm²)
  tensile_area: number;            // 拉伸面积 (mm²)
  head_size: number;               // 对边宽度 (mm)
  property_class: string;          // 性能等级, 如 "8.8"
  tensile_strength: number;        // 抗拉强度 (MPa)
  yield_strength: number;          // 屈服强度 (MPa)
}
```

#### 6.4.4 计算公式

```typescript
// 预紧力 (推荐)
F_preload = 0.6 ~ 0.7 × F_yield  // 60~70% 屈服力

// 预紧扭矩
T = K × d × F_preload
// K: 扭矩系数 (0.1~0.3, 取决于润滑)
// d: 公称直径

// 螺栓应力
σ = F / As
// F: 轴向力, As: 应力截面积

// 剪切应力
τ = F / (π × d² / 4)

// 复合应力 (von Mises)
σ_eq = √(σ² + 3 × τ²)

// 安全系数
S = σ_yield / σ_eq  // 通常要求 S ≥ 1.5~2.0
```

#### 6.4.5 螺栓性能等级

| 等级 | 抗拉强度 (MPa) | 屈服强度 (MPa) | 常用场景 |
|:----:|:-------------:|:-------------:|---------|
| 4.8 | 400 | 320 | 一般结构 |
| 8.8 | 800 | 640 | 机械结构(最常用) |
| 10.9 | 1000 | 900 | 高强度连接 |
| 12.9 | 1200 | 1080 | 极高强度 |

#### 6.4.6 推荐预紧扭矩表 (8.8级, 干摩擦 K=0.2)

| 规格 | 扭矩 (N·m) | 规格 | 扭矩 (N·m) |
|:----:|:----------:|:----:|:----------:|
| M6 | 10 | M16 | 250 |
| M8 | 25 | M20 | 500 |
| M10 | 49 | M24 | 860 |
| M12 | 85 | M30 | 1650 |

---

### 6.5 键连接模块 (Keys)

#### 6.5.1 功能概述

平键选型与强度校核。

#### 6.5.2 功能清单

| 功能 | 说明 |
|------|------|
| 键选型 | 轴径 → 推荐键尺寸 |
| 强度校核 | 挤压应力 + 剪切应力 |
| 标准库 | GB/T 1095 平键规格 |

#### 6.5.3 数据结构

```typescript
interface KeySpec {
  shaft_diameter: [number, number];  // 适用轴径范围
  b: number;                         // 键宽
  h: number;                         // 键高
  t1: number;                        // 轴槽深
  t2: number;                        // 毂槽深
  length_series: number[];           // 长度系列
}
```

#### 6.5.4 计算公式

```typescript
// 挤压应力
σ_p = 2 × T / (d × k × l)
// T: 传递扭矩, d: 轴径, k: 键工作高度/2, l: 键工作长度

// 剪切应力
τ = 2 × T / (d × b × l)
// b: 键宽

// 强度条件
σ_p ≤ [σ_p]  // 许用挤压应力
τ ≤ [τ]      // 许用剪切应力
```

#### 6.5.5 平键尺寸表 (GB/T 1095 摘要)

| 轴径 (mm) | b × h | t1 | t2 |
|:---------:|:-----:|:--:|:--:|
| 6~8 | 2×2 | 1.2 | 1.0 |
| 8~10 | 3×3 | 1.8 | 1.4 |
| 10~12 | 4×4 | 2.5 | 1.8 |
| 12~17 | 5×5 | 3.0 | 2.3 |
| 17~22 | 6×6 | 3.5 | 2.8 |
| 22~30 | 8×7 | 4.0 | 3.3 |
| 30~38 | 10×8 | 5.0 | 3.3 |
| 38~44 | 12×8 | 5.0 | 3.3 |
| 44~50 | 14×9 | 5.5 | 3.8 |

---

### 6.6 弹簧模块 (Springs)

#### 6.6.1 功能概述

压缩/拉伸弹簧设计与计算。

#### 6.6.2 功能清单

| 功能 | 说明 |
|------|------|
| 刚度计算 | 线径/中径/圈数 → 刚度 |
| 变形计算 | 载荷 → 变形量 |
| 应力计算 | 载荷 → 切应力 |
| 固有频率 | 弹簧固有频率计算 |
| 标准库 | ISO 10243 模具弹簧 |

#### 6.6.3 计算公式

```typescript
// 弹簧刚度
k = G × d⁴ / (8 × D³ × n)
// G: 剪切模量, d: 线径, D: 中径, n: 有效圈数

// 变形量
δ = F / k

// 最大切应力
τ_max = 8 × F × D × K / (π × d³)
// K: 曲度系数 = (4C-1)/(4C-4) + 0.615/C, C = D/d (弹簧指数)

// 固有频率
f = (1 / 2π) × √(k / m_effective)
```

#### 6.6.4 弹簧颜色标识 (ISO 10243)

| 颜色 | 载荷等级 | 说明 |
|:----:|:-------:|------|
| 🟡 黄 | 轻载 | 最大变形量40% |
| 🔵 蓝 | 中载 | 最大变形量35% |
| 🔴 红 | 重载 | 最大变形量30% |
| 🟢 绿 | 超重载 | 最大变形量25% |

---

### 6.7 公差配合模块 (Tolerances)

#### 6.7.1 功能概述

公差等级查询、配合计算、公差堆叠分析。

#### 6.7.2 功能清单

| 功能 | 说明 |
|------|------|
| 公差查询 | 基本尺寸 + 公差带 → 极限偏差 |
| 配合计算 | 孔公差 + 轴公差 → 间隙/过盈 |
| 配合推荐 | 工况 → 推荐配合 |
| 公差堆叠 | 尺寸链计算 |
| 形位公差 | 形位公差标注查询 |

#### 6.7.3 数据结构

```typescript
interface ToleranceZone {
  grade: string;           // 公差等级, 如 "IT7"
  position: string;        // 基本偏差代号, 如 "H", "g"
}

interface FitResult {
  max_clearance: number;   // 最大间隙
  min_clearance: number;   // 最小间隙 (负值=过盈)
  fit_type: 'clearance' | 'transition' | 'interference';
  fit_code: string;        // 如 "H7/g6"
}
```

#### 6.7.4 计算公式

```typescript
// 孔的上偏差 ES, 下偏差 EI
// 轴的上偏差 es, 下偏差 ei

// 最大间隙
X_max = ES - ei

// 最小间隙 (或最大过盈)
X_min = EI - es

// 配合公差
T_fit = X_max - X_min = T_hole + T_shaft

// 平均间隙
X_avg = (X_max + X_min) / 2
```

#### 6.7.5 常用配合推荐

| 配合 | 类型 | 用途 |
|------|------|------|
| H7/g6 | 间隙配合 | 精密滑动配合 |
| H7/h6 | 间隙配合 | 定位配合 |
| H7/k6 | 过渡配合 | 精确定位, 可拆卸 |
| H7/n6 | 过渡配合 | 紧密定位 |
| H7/p6 | 过盈配合 | 轻压配合 |
| H7/s6 | 过盈配合 | 中等压配合 |

#### 6.7.6 标准公差数值 (IT等级, μm)

| 基本尺寸 (mm) | IT6 | IT7 | IT8 | IT9 | IT10 | IT11 |
|:-------------:|:---:|:---:|:---:|:---:|:----:|:----:|
| ≤ 3 | 6 | 10 | 14 | 25 | 40 | 60 |
| 3~6 | 8 | 12 | 18 | 30 | 48 | 75 |
| 6~10 | 9 | 15 | 22 | 36 | 58 | 90 |
| 10~18 | 11 | 18 | 27 | 43 | 70 | 110 |
| 18~30 | 13 | 21 | 33 | 52 | 84 | 130 |
| 30~50 | 16 | 25 | 39 | 62 | 100 | 160 |
| 50~80 | 19 | 30 | 46 | 74 | 120 | 190 |
| 80~120 | 22 | 35 | 54 | 87 | 140 | 220 |
| 120~180 | 25 | 40 | 63 | 100 | 160 | 250 |
| 180~250 | 29 | 46 | 72 | 115 | 185 | 290 |
| 250~315 | 32 | 52 | 81 | 130 | 210 | 320 |
| 315~400 | 36 | 57 | 89 | 140 | 230 | 360 |
| 400~500 | 40 | 63 | 97 | 160 | 250 | 400 |

---

### 6.8 传动模块 (Drives)

#### 6.8.1 功能概述

V带、同步带、滚子链传动计算。

#### 6.8.2 功能清单

| 功能 | 说明 |
|------|------|
| V带选型 | 功率/转速 → 带型/带长 |
| 同步带选型 | 功率/转速 → 带型/齿数 |
| 链传动选型 | 功率/转速 → 链号 |
| 中心距计算 | 带长 ↔ 中心距 互算 |
| 包角计算 | 包角校验 |

#### 6.8.3 V带计算公式

```typescript
// 计算功率
P_c = K_A × P
// K_A: 工况系数

// 带速
v = π × d1 × n1 / 60000  // m/s

// 包角
α = 180° - (d2 - d1) × 57.3° / a
// a: 中心距

// 带长(近似)
L ≈ 2a + π×(d1+d2)/2 + (d2-d1)²/(4a)
```

#### 6.8.4 链传动计算

```typescript
// 链速
v = z1 × n1 × p / 60000  // m/s
// p: 链节距

// 理论中心距
a ≈ (L_p - (z1+z2)/2) × p / [2 × sin(180°/z1)]

// 实际中心距
a = p × [2×L_p - (z1+z2)] / 8 + ... (迭代求解)
```

---

### 6.9 液压气动模块 (Hydraulics)

#### 6.9.1 功能概述

液压缸/气缸设计与计算。

#### 6.9.2 功能清单

| 功能 | 说明 |
|------|------|
| 缸径计算 | 推力/压力 → 缸径 |
| 杆径计算 | 拉力 → 杆径 |
| 速度计算 | 流量 → 运动速度 |
| 流量计算 | 速度 → 所需流量 |
| 稳定性校核 | 压杆稳定校核 |

#### 6.9.3 计算公式

```typescript
// 推力 (伸出)
F_push = P × A_piston = P × π × D² / 4

// 拉力 (缩回)
F_pull = P × (A_piston - A_rod) = P × π × (D² - d²) / 4

// 缸径 (已知推力)
D = √(4 × F / (π × P))

// 运动速度
v = Q / A  // Q: 流量, A: 有效面积

// 流量
Q = v × A

// 压杆稳定临界力 (欧拉公式)
F_cr = π² × E × I / (μ × L)²
// μ: 长度系数(支撑方式决定)
// L: 计算长度, I: 惯性矩
```

#### 6.9.4 标准缸径系列 (mm)

```
20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 180, 200, 220, 250, 280, 320
```

#### 6.9.5 常用工作压力

| 类型 | 压力范围 |
|------|---------|
| 低压液压 | ≤ 2.5 MPa |
| 中压液压 | 2.5 ~ 8 MPa |
| 中高压液压 | 8 ~ 16 MPa |
| 高压液压 | 16 ~ 31.5 MPa |
| 气动 | 0.4 ~ 0.8 MPa |

---

### 6.10 电机选型模块 (Motors)

#### 6.10.1 功能概述

伺服电机、步进电机、普通电机选型计算。

#### 6.10.2 功能清单

| 功能 | 说明 |
|------|------|
| 功率计算 | 负载 → 所需功率 |
| 扭矩计算 | 加速扭矩 + 负载扭矩 |
| 惯量计算 | 负载惯量换算 |
| 惯量匹配 | 惯量比校验 |
| 转速计算 | 传动比 → 电机转速 |
| 减速机选型 | 减速比/扭矩 → 减速机 |

#### 6.10.3 计算公式

```typescript
// 负载扭矩 (旋转)
T_load = F × r  // F: 切向力, r: 半径

// 负载扭矩 (直线传动)
T_load = F × p / (2π × η)
// p: 导程, η: 效率

// 加速扭矩
T_acc = J × α
// J: 转动惯量, α: 角加速度

// 峰值扭矩
T_peak = T_load + T_acc

// 均方根扭矩 (周期性运动)
T_rms = √(Σ(Ti² × ti) / Σti)

// 负载惯量 (圆柱体)
J = m × r² / 2

// 惯量比
R = J_load / J_motor
// 伺服系统通常要求 R < 10 (高性能 < 3)

// 所需功率
P = T × ω = T × 2π × n / 60
```

---

## 7. 数据库设计

### 7.1 数据库文件总览

```
data/
├── standards/              # 标准数据
│   ├── o-ring/            # 密封圈标准
│   ├── bearings/          # 轴承型号数据
│   ├── bolts/             # 螺栓标准
│   ├── keys/              # 键标准
│   ├── gears/             # 齿轮模数系列
│   ├── springs/           # 弹簧标准
│   ├── tolerances/        # 公差数据
│   └── drives/            # 传动标准
├── materials.json          # 材料数据库
└── chemical-compat.json    # 化学兼容性
```

### 7.2 公差数据格式

```json
// data/standards/tolerances/iso286.json
{
  "standard": "ISO 286 / GB/T 1800",
  "description": "ISO 286 公差等级表",
  "it_grades": {
    "IT6": { "range_0_3": 6, "range_3_6": 8, "range_6_10": 9, ... },
    "IT7": { "range_0_3": 10, "range_3_6": 12, "range_6_10": 15, ... },
    ...
  },
  "fundamental_deviations": {
    "holes": {
      "A": { "range_0_3": 270, ... },
      "B": { "range_0_3": 140, ... },
      ...
      "H": { "range_0_3": 0, ... },  // 基准孔, 下偏差=0
      ...
      "ZC": { ... }
    },
    "shafts": {
      "a": { "range_0_3": -270, ... },
      ...
      "g": { "range_0_3": -4, ... },
      "h": { "range_0_3": 0, ... },  // 基准轴, 上偏差=0
      "k": { "range_0_3": 0, ... },
      "m": { "range_0_3": 2, ... },
      "n": { "range_0_3": 4, ... },
      "p": { "range_0_3": 6, ... },
      "s": { "range_0_3": 14, ... },
      ...
    }
  }
}
```

### 7.3 配合推荐数据

```json
// data/standards/tolerances/fits-recommendation.json
{
  "fits": [
    {
      "code": "H7/g6",
      "type": "clearance",
      "description_zh": "精密滑动配合",
      "applications": ["精密导向", "滑阀", "滑动轴承定位"],
      "conditions": "精密定位，相对运动"
    },
    {
      "code": "H7/k6",
      "type": "transition",
      "description_zh": "精确定位，可拆卸",
      "applications": ["齿轮定位", "联轴器", "轴承定位"],
      "conditions": "精确定位，偶尔拆卸"
    },
    {
      "code": "H7/p6",
      "type": "interference",
      "description_zh": "轻压配合",
      "applications": ["齿轮压装", "衬套安装"],
      "conditions": "需压力机压入，传递小扭矩"
    }
  ]
}
```

### 7.4 轴承数据格式

```json
// data/standards/bearings/deep-groove.json
{
  "type": "deep-groove",
  "description_zh": "深沟球轴承",
  "bearings": [
    {
      "designation": "6205",
      "d": 25,
      "D": 52,
      "B": 15,
      "C_r": 14.0,
      "C_0r": 7.9,
      "speed_limit_grease": 12000,
      "speed_limit_oil": 15000,
      "mass": 0.128,
      "clearance_cn": { "min": 0.010, "max": 0.025 },
      "clearance_c3": { "min": 0.015, "max": 0.033 }
    }
  ]
}
```

### 7.5 材料数据格式

```json
// data/materials.json
{
  "structural_steels": [
    {
      "designation": "Q235B",
      "name_zh": "碳素结构钢 Q235B",
      "density": 7.85,
      "E": 206000,
      "G": 79000,
      "yield_strength": 235,
      "tensile_strength": 370,
      "elongation": 26,
      "applications": ["一般结构", "焊接结构"],
      "price_level": "低"
    },
    {
      "designation": "45钢",
      "name_zh": "优质碳素结构钢 45#",
      "density": 7.85,
      "E": 206000,
      "G": 79000,
      "yield_strength": 355,
      "tensile_strength": 600,
      "elongation": 16,
      "applications": ["轴类", "齿轮", "高强度结构件"],
      "price_level": "中"
    },
    {
      "designation": "40Cr",
      "name_zh": "合金结构钢 40Cr",
      "density": 7.85,
      "E": 206000,
      "G": 79000,
      "yield_strength": 785,
      "tensile_strength": 980,
      "elongation": 9,
      "applications": ["重载轴", "齿轮", "重要零件"],
      "price_level": "中高"
    }
  ],
  "aluminum_alloys": [...],
  "stainless_steels": [...],
  "cast_irons": [...]
}
```

---

## 8. 计算引擎架构

### 8.1 引擎设计原则

```
┌──────────────────────────────────────────────┐
│             计算引擎设计原则                   │
├──────────────────────────────────────────────┤
│ 1. 纯函数 - 无副作用, 输入→输出, 易测试      │
│ 2. 类型安全 - 全面TypeScript类型定义         │
│ 3. 单位无关 - 内部统一使用mm/N/MPa          │
│ 4. 可组合 - 小函数组合成复杂计算             │
│ 5. 可验证 - 每个函数都有已知值验证           │
└──────────────────────────────────────────────┘
```

### 8.2 引擎接口定义

```typescript
// src/renderer/engine/types.ts

// ===== 通用类型 =====
interface CalcResult<T> {
  value: T;
  unit: string;
  warnings: Warning[];
}

interface Warning {
  level: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

interface ValidationResult {
  valid: boolean;
  level: 'pass' | 'warning' | 'fail';
  message: string;
}

// ===== 单位系统 =====
type UnitSystem = 'mm' | 'inch';

interface UnitConverter {
  mmToInch: (val: number) => number;
  inchToMm: (val: number) => number;
  NToKgf: (val: number) => number;
  MPaToPsi: (val: number) => number;
  // ...
}

// ===== 模块引擎接口 =====
interface SealEngine {
  calcCompression: (cs: number, depth: number) => CalcResult<number>;
  calcStretch: (oringID: number, glandID: number) => CalcResult<number>;
  recommendGroove: (seal: SealSize, app: ApplicationType) => GrooveDesign;
  matchSeal: (groove: GrooveDesign, standard: string) => SealSize[];
  validate: (params: SealParams) => ValidationResult[];
}

interface BearingEngine {
  calcLife: (C: number, P: number, type: 'ball' | 'roller') => CalcResult<number>;
  calcEquivalentLoad: (Fr: number, Fa: number, X: number, Y: number) => CalcResult<number>;
  calcFit: (bearing: Bearing, shaftTol: string, housingTol: string) => FitResult;
  calcClearance: (bearing: Bearing, fit: FitResult, tempDiff: number) => CalcResult<number>;
}

interface GearEngine {
  calcGeometry: (params: GearParams) => GearGeometry;
  calcContactRatio: (geom: GearGeometry) => number;
  calcStrength: (geom: GearGeometry, power: number, speed: number) => StrengthResult;
}

interface BoltEngine {
  calcPreload: (bolt: BoltSpec, torque: number, K: number) => CalcResult<number>;
  calcStress: (bolt: BoltSpec, axialForce: number, shearForce: number) => StressResult;
  recommendSize: (load: number, safetyFactor: number) => BoltSpec[];
}

interface SpringEngine {
  calcStiffness: (d: number, D: number, n: number, G: number) => CalcResult<number>;
  calcStress: (F: number, D: number, d: number) => CalcResult<number>;
  calcNaturalFreq: (k: number, m: number) => CalcResult<number>;
}

interface ToleranceEngine {
  lookupTolerance: (size: number, zone: ToleranceZone) => { ES: number; EI: number };
  calcFit: (holeTol: ToleranceZone, shaftTol: ToleranceZone, size: number) => FitResult;
  recommendFit: (application: string) => { hole: string; shaft: string };
  calcStack: (dimensions: StackDimension[]) => StackResult;
}

// ===== 引擎工厂 =====
interface EngineFactory {
  seals: SealEngine;
  bearings: BearingEngine;
  gears: GearEngine;
  bolts: BoltEngine;
  keys: KeyEngine;
  springs: SpringEngine;
  tolerances: ToleranceEngine;
  drives: DriveEngine;
  hydraulics: HydraulicEngine;
  motors: MotorEngine;
}
```

### 8.3 计算流程图

```
┌─────────────┐
│  用户输入    │
│  (表单参数)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│ 参数校验     │────>│ 单位转换     │
│ (必填/范围) │     │ (→内部单位)  │
└──────┬──────┘     └──────┬───────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌──────────────┐
│ 加载标准数据 │     │ 执行计算     │
│ (JSON文件)  │────>│ (纯函数)     │
└─────────────┘     └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ 结果校验     │
                    │ (告警检查)   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ 单位转换     │
                    │ (→显示单位)  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ 渲染结果     │
                    │ (图表+数据)  │
                    └──────────────┘
```

---

## 9. UI/UX 设计

### 9.1 整体布局

```
┌────────────────────────────────────────────────────────────┐
│  📐 MechCalc 机械设计工具箱              [ mm/inch ] [ 🌙 ]│
├────────┬───────────────────────────────────────────────────┤
│        │  🔧 密封圈计算                                   │
│ 侧边栏  │  ┌──────────────────────────┐ ┌────────────────┐│
│        │  │                          │ │                ││
│ 📊 公差 │  │     输入区               │ │    结果区       ││
│ ⭕ 轴承 │  │                          │ │                ││
│ ⚙️ 齿轮 │  │  - 标准选择              │ │  - 压缩率仪表盘 ││
│ 🔩 螺栓 │  │  - 规格搜索              │ │  - 推荐沟槽    ││
│ 🔑 键   │  │  - 工况输入              │ │  - 警告列表    ││
│ 🔧 弹簧 │  │  - 材料选择              │ │  - 材料推荐    ││
│ 🔗 传动 │  │                          │ │                ││
│ 💧 液压 │  └──────────────────────────┘ └────────────────┘│
│ ⚡ 电机 │                                                   │
│ 📦 材料 │  ┌──────────────────────────────────────────┐  │
│ ⭐ 收藏 │  │         计算历史 / 常用规格              │  │
│        │  └──────────────────────────────────────────┘  │
│        │                                                 │
├────────┴─────────────────────────────────────────────────┤
│  就绪  │  单位: mm  │  标准: AS568  │  📄 导出  │  ⚙️ 设置 │
└─────────────────────────────────────────────────────────┘
```

### 9.2 侧边栏设计

```typescript
interface SidebarItem {
  id: string;          // 模块ID
  icon: string;        // 图标
  label: string;       // 中文名
  labelEn: string;     // 英文名
  priority: number;    // 排序优先级
  children?: SidebarItem[];  // 子模块
}

const sidebarConfig: SidebarItem[] = [
  { id: 'tolerances', icon: '📏', label: '公差配合', labelEn: 'Tolerances', priority: 1 },
  { id: 'seals', icon: '⭕', label: '密封圈', labelEn: 'Seals', priority: 2 },
  { id: 'bearings', icon: '🔵', label: '轴承', labelEn: 'Bearings', priority: 3 },
  { id: 'gears', icon: '⚙️', label: '齿轮', labelEn: 'Gears', priority: 4 },
  { id: 'bolts', icon: '🔩', label: '螺栓', labelEn: 'Bolts', priority: 5 },
  { id: 'keys', icon: '🔑', label: '键连接', labelEn: 'Keys', priority: 6 },
  { id: 'springs', icon: '🔧', label: '弹簧', labelEn: 'Springs', priority: 7 },
  { id: 'drives', icon: '🔗', label: '传动', labelEn: 'Drives', priority: 8 },
  { id: 'hydraulics', icon: '💧', label: '液压气动', labelEn: 'Hydraulics', priority: 9 },
  { id: 'motors', icon: '⚡', label: '电机选型', labelEn: 'Motors', priority: 10 },
  { id: 'materials', icon: '📦', label: '材料库', labelEn: 'Materials', priority: 11 },
  { id: 'favorites', icon: '⭐', label: '收藏', labelEn: 'Favorites', priority: 12 },
];
```

### 9.3 模块页面布局

```
每个模块页面统一采用三栏布局:

┌──────────────────────────────────────────────┐
│  模块标题 |  计算公式 |  帮助文档              │  ← 模块头部
├──────────────┬──────────────┬────────────────┤
│              │              │                │
│   输入面板    │   结果面板   │   参考数据     │
│              │              │   面板         │
│  - 参数表单   │  - 计算结果   │  - 标准库     │
│  - 标准选择   │  - 可视化图表  │  - 推荐表     │
│  - 工况配置   │  - 警告提示   │  - 材料信息   │
│              │  - 导出按钮   │                │
│              │              │                │
└──────────────┴──────────────┴────────────────┘
```

### 9.4 色彩方案

| 元素 | 颜色 | 说明 |
|------|------|------|
| 主色 | #1677ff | Ant Design 5.0 品牌蓝 |
| 成功/通过 | #52c41a | 参数正常 |
| 警告 | #faad14 | 接近限值 |
| 错误/超限 | #ff4d4f | 超出限值 |
| 信息 | #1677ff | 提示信息 |
| 背景 | #f5f5f5 | 浅灰 |
| 卡片 | #ffffff | 白色 |
| 文字 | rgba(0,0,0,0.88) | 主文字 |
| 次要文字 | rgba(0,0,0,0.45) | 次要文字 |

### 9.5 响应式断点

| 断点 | 宽度 | 布局 |
|------|------|------|
| LG | ≥ 1280px | 三栏布局 |
| MD | ≥ 1024px | 两栏布局 |
| SM | ≥ 768px | 单栏, 可折叠侧边栏 |
| XS | < 768px | 移动布局 |

### 9.6 暗色主题

```typescript
const darkTheme = {
  token: {
    colorBgLayout: '#0a0a0a',
    colorBgContainer: '#141414',
    colorText: 'rgba(255,255,255,0.85)',
    colorTextSecondary: 'rgba(255,255,255,0.45)',
    colorBorder: '#303030',
  },
};
```

---

## 10. 开发路线图

### Phase 1: 项目框架 + 核心模块 (3周)

**目标: 可运行的基础版本，包含2个核心模块**

| 任务 | 工期 | 产出 |
|------|------|------|
| 项目初始化 (Electron + Vite + React + TS) | 2天 | 基础项目结构 |
| 主进程 + IPC + 布局框架 | 2天 | 应用骨架 |
| 侧边栏导航 + 路由配置 | 1天 | 导航系统 |
| 状态管理 (Zustand) 搭建 | 1天 | 状态系统 |
| **公差配合模块** (查询 + 配合计算) | 4天 | 可用模块 |
| **密封圈模块** (正向计算 + 反向计算) | 4天 | 可用模块 |
| AS568 数据录入 | 1天 | 数据文件 |
| 公差数据 (ISO 286) 录入 | 1天 | 数据文件 |
| UI 组件库搭建 (UnitInput, ResultCard等) | 3天 | 组件库 |
| 单位切换 (mm/inch) | 0.5天 | 功能 |

**Phase 1 交付物**: 可运行的安装包，包含公差配合 + 密封圈模块

---

### Phase 2: P0 核心模块 (3周)

**目标: 完成最常用的3个模块**

| 任务 | 工期 | 产出 |
|------|------|------|
| **轴承模块** (选型 + 寿命 + 配合) | 5天 | 可用模块 |
| 轴承型号数据录入 (6200/6300/6800系列) | 2天 | 数据文件 |
| **螺栓连接模块** (选型 + 强度) | 3天 | 可用模块 |
| 螺栓标准数据录入 (GB5782 + 性能等级) | 1天 | 数据文件 |
| **键连接模块** (选型 + 强度) | 2天 | 可用模块 |
| 平键规格数据录入 | 0.5天 | 数据文件 |
| 计算引擎扩展 (轴承/螺栓/键) | 3天 | 引擎代码 |
| 通用组件完善 | 2天 | 组件增强 |
| 单元测试 (Phase 1+2 引擎) | 2天 | 测试覆盖 >80% |

**Phase 2 交付物**: v0.2.0，5个可用模块

---

### Phase 3: P1 模块 (3周)

**目标: 完成传动、齿轮、弹簧模块**

| 任务 | 工期 | 产出 |
|------|------|------|
| **齿轮模块** (直齿轮/斜齿轮) | 4天 | 可用模块 |
| **弹簧模块** (压缩/拉伸) | 3天 | 可用模块 |
| **传动模块** (V带/同步带/链条) | 3天 | 可用模块 |
| 齿轮/弹簧/传动数据录入 | 3天 | 数据文件 |
| 计算引擎扩展 | 3天 | 引擎代码 |
| ECharts 可视化增强 | 2天 | 图表 |
| 单元测试 | 2天 | 测试覆盖 |

**Phase 3 交付物**: v0.3.0，8个可用模块

---

### Phase 4: P1 模块 + 增强 (3周)

| 任务 | 工期 | 产出 |
|------|------|------|
| **液压气动模块** | 3天 | 可用模块 |
| **电机选型模块** | 4天 | 可用模块 |
| **轴设计模块** | 3天 | 可用模块 |
| **公差堆叠分析** | 2天 | 可用模块 |
| 计算引擎扩展 | 3天 | 引擎代码 |
| 材料库模块 (含化学兼容性) | 3天 | 可用模块 |
| 单元测试 | 2天 | 测试覆盖 |

**Phase 4 交付物**: v0.4.0，12个可用模块

---

### Phase 5: 导出与体验 (2周)

| 任务 | 工期 | 产出 |
|------|------|------|
| PDF 报告导出 | 3天 | 功能 |
| Excel 数据导出 | 2天 | 功能 |
| 收藏/常用规格 | 1天 | 功能 |
| 历史记录 | 1天 | 功能 |
| 暗色主题 | 1天 | 功能 |
| 国际化 (中/英) | 3天 | 翻译 |
| 帮助文档/公式说明 | 2天 | 文档 |
| 设置页面 | 1天 | 功能 |

**Phase 5 交付物**: v0.5.0，功能完善

---

### Phase 6: 测试与发布 (2周)

| 任务 | 工期 | 产出 |
|------|------|------|
| 计算引擎单元测试 (100%覆盖) | 3天 | 测试通过 |
| 集成测试 | 2天 | 测试通过 |
| 已知值验证 (与Parker/SKF/MITCalc对比) | 2天 | 验证报告 |
| 多平台打包 (Win/Mac/Linux) | 1天 | 安装包 |
| 自动更新配置 | 0.5天 | 功能 |
| README 文档 | 2天 | 文档 |
| 截图/演示GIF | 1天 | 素材 |
| GitHub Release | 0.5天 | 发布 |

**Phase 6 交付物**: v1.0.0 正式发布

---

### 总体时间线

```
Week 1-3:   Phase 1 ████████████████████  框架+公差+密封圈
Week 4-6:   Phase 2 ████████████████████  轴承+螺栓+键
Week 7-9:   Phase 3 ████████████████████  齿轮+弹簧+传动
Week 10-12: Phase 4 ████████████████████  液压+电机+轴+材料
Week 13-14: Phase 5 ████████████  导出+收藏+主题+i18n
Week 15-16: Phase 6 ████████████  测试+打包+发布
```

---

## 11. 测试策略

### 11.1 测试层次

```
┌────────────────────────────────────┐
│           测试金字塔               │
│                                    │
│          /  E2E 测试  \           │
│         /              \          │
│        /   集成测试      \        │
│       /                    \      │
│      /    单元测试(模块)     \    │
│     /                          \  │
│    /  单元测试(计算引擎纯函数)   \ │
│   /________________________________\│
└────────────────────────────────────┘
```

### 11.2 单元测试 - 计算引擎

**目标: 100% 分支覆盖**

```typescript
// 密封圈模块测试
describe('SealEngine', () => {
  describe('calcCompression', () => {
    test('正常压缩率 - AS568-010', () => {
      // 已知值验证
      // AS568-010: CS = 1.78mm, 沟槽深度 1.40mm
      const result = engine.calcCompression(1.78, 1.40);
      expect(result.value).toBeCloseTo(21.3, 1);
    });

    test('零压缩率', () => {
      const result = engine.calcCompression(2.62, 2.62);
      expect(result.value).toBe(0);
    });

    test('负压缩率 (沟槽过深)', () => {
      const result = engine.calcCompression(2.62, 3.0);
      expect(result.value).toBeLessThan(0);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('validate', () => {
    test('静密封 压缩率 18-25% → 通过', () => {
      const result = engine.validateCompression(20, 'static');
      expect(result.valid).toBe(true);
    });

    test('拉伸率 >5% → 警告', () => {
      const result = engine.validateStretch(8);
      expect(result.level).toBe('warning');
    });
  });
});

// 轴承模块测试
describe('BearingEngine', () => {
  describe('calcLife', () => {
    test('6205 轴承 L10 寿命', () => {
      // 已知值: 6205 C_r=14kN, P=2kN
      // L10 = (14/2)^3 = 343 百万转
      const result = engine.calcLife(14, 2, 'ball');
      expect(result.value).toBeCloseTo(343, 0);
    });

    test('滚子轴承 p=10/3', () => {
      const result = engine.calcLife(50, 10, 'roller');
      expect(result.value).toBeCloseTo(Math.pow(5, 10/3), 1);
    });
  });
});

// 齿轮模块测试
describe('GearEngine', () => {
  describe('calcGeometry', () => {
    test('标准直齿轮 m=2, z=20', () => {
      const geom = engine.calcGeometry({
        module: 2, teeth_z1: 20, teeth_z2: 40,
        pressure_angle: 20, helix_angle: 0,
        x1: 0, x2: 0, face_width: 20
      });
      expect(geom.d1).toBe(40);  // d = m × z = 2 × 20
      expect(geom.d2).toBe(80);
      expect(geom.da1).toBe(44); // da = m×(z+2) = 2×22
    });
  });
});

// 公差模块测试
describe('ToleranceEngine', () => {
  describe('calcFit', () => {
    test('H7/g6 配合 Φ25', () => {
      const result = engine.calcFit(
        { grade: 'IT7', position: 'H' },
        { grade: 'IT6', position: 'g' },
        25
      );
      // H7: EI=0, ES=+21μm
      // g6: es=-7μm, ei=-20μm
      expect(result.max_clearance).toBe(0.041);  // 21-(-20)
      expect(result.min_clearance).toBe(0.007);  // 0-(-7)
      expect(result.fit_type).toBe('clearance');
    });
  });
});
```

### 11.3 已知值验证表

| 模块 | 测试用例 | 输入 | 预期输出 | 来源 |
|------|---------|------|---------|------|
| 密封圈 | AS568-010 | CS=1.78, depth=1.40 | 压缩率≈21.3% | Parker |
| 轴承 | 6205 | C=14kN, P=2kN | L10=343百万转 | SKF |
| 齿轮 | m=2, z=20 | 标准齿轮 | d=40, da=44 | GB/T 1356 |
| 公差 | H7/g6 Φ25 | 基本尺寸25 | X_max=0.041 | ISO 286 |
| 螺栓 | M10 8.8级 | 扭矩=49N·m | F≈16kN | VDI 2230 |
| 弹簧 | d=2, D=10, n=10 | G=79GPa | k≈25.3N/mm | GB/T 1239 |

### 11.4 集成测试

```typescript
describe('Integration: Seal Forward Calculation', () => {
  test('完整流程: 选择密封圈 → 计算沟槽 → 校验', async () => {
    // 1. 选择 AS568-010
    // 2. 选择工况: 静密封
    // 3. 自动计算沟槽
    // 4. 校验压缩率
    // 5. 检查无警告
  });
});
```

### 11.5 E2E 测试

使用 Playwright 进行端到端测试:

```typescript
test('用户完成一次完整的密封圈计算', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-module="seals"]');
  await page.selectOption('[data-testid="standard"]', 'AS568');
  await page.selectOption('[data-testid="size"]', '-010');
  await page.selectOption('[data-testid="application"]', 'static');
  // 验证结果渲染
  await expect(page.locator('[data-testid="compression"]')).toBeVisible();
});
```

---

## 12. 发布与部署

### 12.1 打包配置

```json
// electron-builder.json
{
  "appId": "com.mechcalc.app",
  "productName": "MechCalc",
  "copyright": "Copyright © 2026",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "data/**/*",
    "resources/**/*"
  ],
  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64"] },
      { "target": "portable", "arch": ["x64"] }
    ],
    "icon": "resources/icons/icon.ico"
  },
  "mac": {
    "target": ["dmg"],
    "icon": "resources/icons/icon.png",
    "category": "public.app-category.productivity",
    "darkModeSupport": true
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "icon": "resources/icons/",
    "category": "Utility",
    "synopsis": "机械设计工具箱"
  },
  "nsis": {
    "oneClick": false,
    "perMachine": true,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true
  },
  "publish": {
    "provider": "github",
    "owner": "your-org",
    "repo": "mechcalc",
    "releaseType": "release"
  }
}
```

### 12.2 发布流程

```bash
# 1. 更新版本号
npm version patch  # 或 minor / major

# 2. 打标签
git tag v0.1.0
git push origin v0.1.0

# 3. 构建
npm run build

# 4. 运行测试
npm test

# 5. 打包并发布 (自动上传到 GitHub Release)
npm run publish

# 6. 编写 Release Notes
# 7. 更新 README
```

### 12.3 版本命名规范

```
v{major}.{minor}.{patch}

major: 架构变化 / 大功能增加
minor: 新模块 / 功能增强
patch: Bug修复 / 数据更新

示例:
v0.1.0 - Phase 1 完成 (框架+公差+密封圈)
v0.2.0 - Phase 2 完成 (+轴承+螺栓+键)
v0.5.0 - Phase 5 完成 (导出+主题+i18n)
v1.0.0 - 正式版
```

### 12.4 开源协议

推荐 **MIT License**:

```
MIT License

Copyright (c) 2026 MechCalc Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

### 12.5 CI/CD (可选)

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm run publish
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

---

## 13. 附录

### A. 常用术语表

| 中文 | 英文 | 缩写 | 说明 |
|------|------|------|------|
| 内径 | Inner Diameter | ID | 圈内直径 |
| 外径 | Outer Diameter | OD | 圈外直径 |
| 线径/截面 | Cross Section | CS | 圈截面直径 |
| 沟槽 | Gland / Groove | - | 安装O型圈的槽 |
| 压缩率 | Compression Ratio | - | 挤压变形比例 |
| 拉伸率 | Stretch Ratio | - | 安装拉伸比例 |
| 填充率 | Fill Rate | - | 沟槽被填充的体积比例 |
| 额定寿命 | Rated Life | L10 | 90%可靠度寿命 |
| 当量载荷 | Equivalent Load | P | 换算载荷 |
| 模数 | Module | m | 齿轮基本参数 |
| 压力角 | Pressure Angle | α | 齿轮齿形角 |
| 预紧力 | Preload | - | 螺栓预紧力 |
| 公差带 | Tolerance Zone | - | 公差位置 |
| 配合 | Fit | - | 孔轴配合 |
| 游隙 | Clearance | - | 轴承内部间隙 |

### B. 参考标准清单

| 标准号 | 名称 | 用途 |
|--------|------|------|
| ASME AS568 | 美标O型圈尺寸 | 密封圈 |
| GB/T 3452.1 | 国标O型圈尺寸 | 密封圈 |
| ISO 3601-1 | 国际标准O型圈 | 密封圈 |
| ISO 286 | ISO公差与配合 | 公差 |
| GB/T 1800 | 国标公差与配合 | 公差 |
| ISO 5753 | 滚动轴承游隙 | 轴承 |
| ISO 281 | 滚动轴承额定寿命 | 轴承 |
| ISO 12129 | 轴承配合 | 轴承 |
| GB/T 275 | 国标轴承配合 | 轴承 |
| GB/T 1357 | 齿轮模数系列 | 齿轮 |
| GB/T 10095 | 圆柱齿轮精度 | 齿轮 |
| GB/T 1095 | 平键连接 | 键 |
| GB/T 5782 | 六角头螺栓 | 螺栓 |
| VDI 2230 | 高强度螺栓计算 | 螺栓 |
| GB/T 1239 | 圆柱螺旋弹簧 | 弹簧 |
| ISO 10243 | 模具弹簧 | 弹簧 |
| GB/T 11544 | V带传动 | 传动 |
| GB/T 1243 | 滚子链 | 传动 |
| GB/T 2348 | 液压缸缸径系列 | 液压 |
| GB/T 3852 | 联轴器 | 联轴器 |

### C. 开发环境搭建

```bash
# 1. 克隆项目
git clone https://github.com/your-org/mechcalc.git
cd mechcalc

# 2. 安装依赖
npm install

# 3. 启动开发模式
npm run dev

# 4. 运行测试
npm test

# 5. 运行测试并生成覆盖率报告
npm run test:coverage

# 6. 构建生产版本
npm run build

# 7. 打包 (生成安装包)
npm run package

# 8. 打包并发布
npm run publish
```

### D. 贡献指南

#### D.1 如何添加新的标准数据

1. 在 `data/standards/` 下创建 JSON 文件
2. 按照对应的 TypeScript 接口定义格式
3. 在计算引擎中添加数据引用
4. 编写单元测试验证数据完整性

#### D.2 如何添加新的计算模块

1. 在 `src/renderer/engine/` 下创建计算函数
2. 编写单元测试 (100%覆盖)
3. 在 `src/renderer/modules/` 下创建页面组件
4. 在侧边栏注册表中添加模块入口
5. 更新本文档

#### D.3 如何修正计算逻辑

1. 提供标准/手册引用
2. 编写测试用例(已知值)
3. 提交 PR

#### D.4 如何翻译

1. 在 `resources/locales/` 下添加语言文件
2. 使用 i18next 或类似方案
3. 确保所有用户可见文字可翻译

### E. 项目里程碑

| 里程碑 | 版本 | 内容 | 目标日期 |
|--------|------|------|---------|
| MVP | v0.1.0 | 框架 + 公差 + 密封圈 | Phase 1 完成 |
| Core | v0.3.0 | +轴承+螺栓+键+齿轮+弹簧 | Phase 3 完成 |
| Full | v0.5.0 | 全部12模块 + 导出 | Phase 5 完成 |
| Release | v1.0.0 | 测试完善 + 正式发版 | Phase 6 完成 |
| Community | v1.x | 社区贡献模块 | 持续 |

### F. 风险评估与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| 数据准确性 | 高 | 中 | 全部用已知值验证，引用标准原文 |
| 范围过大 | 高 | 高 | 按优先级分期开发 |
| 计算复杂性 | 中 | 中 | 先实现基础计算，高级功能后续 |
| 数据量过大 | 低 | 中 | 分模块按需加载 |
| 社区贡献质量 | 中 | 中 | 建立 Code Review 和测试要求 |

---

*文档版本: v2.0*  
*最后更新: 2026-04-12*  
*作者: MechCalc 开发团队*  
*许可证: MIT*
