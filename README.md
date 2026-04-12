# 🛠️ MechBox (MechCalc) - 机械设计一站式工具箱

[![Electron](https://img.shields.io/badge/Electron-30.x-blue?logo=electron)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.x-4fc08d?logo=vuedotjs)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **"让每一位机械工程师都能快速、准确、自信地完成日常设计计算。"**

MechBox 是一款专为机械工程师打造的桌面端工程辅助平台。它告别了散乱的 Excel 表格和厚重的纸质手册，将复杂的计算逻辑、海量的行业标准与直观的可视化界面深度集成。

---

## 🌟 为什么选择 MechBox？

在机械设计过程中，数据分散、重复校核、单位换算和标准错位是导致设计缺陷的主要原因。MechBox 针对性地解决了以下痛点：

*   **一站式集成**：集成密封、轴承、齿轮、公差等 10+ 核心计算模块。
*   **标准驱动**：内置 ISO 286 (公差)、AS568/ISO 3601 (密封)、GB/T (国标) 等海量标准数据库。
*   **计算透明化**：所有计算均基于行业公认公式（如 ISO 281 轴承寿命），并提供实时计算依据提示。
*   **离线优先**：核心计算与标准库完全本地化，确保在车间、实验室等无网络环境下依然可靠。
*   **工程化产出**：支持导出规范的 PDF 计算书，满足项目评审与技术存档要求。

---

## 🚀 核心功能模块

### ⭕ 密封设计 (Seals)
*   **正/反向计算**：从 O 型圈选型推荐沟槽尺寸，或根据已有沟槽校核密封性能。
*   **多维校核**：实时计算压缩率 (Compression)、拉伸率 (Stretch)、填充率 (Fill Rate)。
*   **材料指南**：内置 NBR、FKM、EPDM 等常用材料的硬度与介质兼容性参考。

### 🔵 轴承工具 (Bearings)
*   **寿命估算**：基于 ISO 281 的 L10 额定寿命计算，支持球轴承与滚子轴承。
*   **配合与游隙**：计算由压装引起的初始游隙减少量及工作状态下的温升补偿。
*   **规格速查**：覆盖深沟球、角接触、圆锥滚子等主流轴承型号数据库。

### 📏 公差配合 (Tolerances)
*   **极值查询**：基于 ISO 286 标准，输入基本尺寸与公差等级（如 25H7/g6）即得极限偏差。
*   **配合分析**：自动判断间隙、过渡或过盈配合，并可视化展示配合性质。

### ⚙️ 更多模块 (持续更新中...)
*   **螺栓连接**：预紧扭矩与抗拉强度校核。
*   **传动选型**：V 带、同步带及链条传动计算。
*   **液压气动**：缸径推力计算与压杆稳定性分析。

---

## 🏗️ 架构设计

项目采用 **Electron + Vue 3 + TypeScript** 架构，核心逻辑严格解耦：

*   **计算引擎 (`src/renderer/engine`)**：采用纯函数实现的数学模型，单位无关，易于单元测试。
*   **数据层 (`data/`)**：结构化的 JSON 数据库，方便扩展新的行业标准。
*   **状态管理 (`Pinia`)**：实时同步计算参数，支持结果快照对比。
*   **可视化层 (`ECharts`)**：直观展示压缩率仪表盘、应力曲线等工程图表。

---

## 🛠️ 技术栈

| 类别 | 技术 |
| :--- | :--- |
| **壳容器** | [Electron](https://www.electronjs.org/) |
| **前端框架** | [Vue 3](https://vuejs.org/) (Composition API) |
| **开发语言** | [TypeScript](https://www.typescriptlang.org/) |
| **UI 组件库** | [Ant Design Vue](https://www.antdv.com/) |
| **状态管理** | [Pinia](https://pinia.vuejs.org/) |
| **构建工具** | [electron-vite](https://electron-vite.org/) |
| **单元测试** | [Vitest](https://vitest.dev/) |
| **报表导出** | [jsPDF](https://github.com/parallax/jsPDF) & [SheetJS](https://sheetjs.com/) |

---

## 📦 快速开始

### 1. 克隆仓库
```bash
git clone https://github.com/your-username/MechBox.git
cd MechBox
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 开发环境运行
```bash
pnpm dev
```

### 4. 构建正式包
```bash
pnpm build
```

---

## 🗺️ 开发路线图 (Roadmap)

- [x] **v1.0.0-Beta**: 框架搭建、公差查询、O型圈基础计算。
- [x] **v1.1.0**: 轴承 L10 寿命引擎、多国标准库接入。
- [ ] **v1.2.0**: 导出功能升级（PDF 计算书模板定制）。
- [ ] **v1.3.0**: 增加齿轮几何尺寸计算与强度校核模块。
- [ ] **v2.0.0**: 引入插件化机制，支持用户自定义计算公式。

---

## 🤝 参与贡献

我们非常欢迎来自机械同行的贡献！你可以：
1. **完善标准数据**：在 `data/standards` 下提交更多规格。
2. **贡献计算模型**：在 `src/renderer/engine` 中实现新的数学公式。
3. **反馈 Bug**：提交 Issue 告知我们在特定工况下的计算偏差。

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE)。

---

**MechBox** —— 由工程师为工程师打造。  
*如果您觉得这个工具有用，请点个 ⭐️ Star！*
