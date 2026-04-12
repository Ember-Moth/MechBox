# 🛠️ MechBox (MechCalc) - 工业级机械设计辅助与演算平台

[![Electron](https://img.shields.io/badge/Electron-30.x-blue?logo=electron)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.x-4fc08d?logo=vuedotjs)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **"告别 Excel 与散落的手册，打造断网环境下绝对可靠的离线桌面指挥中心。"**

MechBox 是一款专为机械工程师、工艺工程师及非标自动化设计人员打造的桌面端工程辅助平台。我们致力于将复杂的计算逻辑、海量的行业标准、约束求解算法与直观的现代可视化界面深度集成，提供从定性估算到图纸落地的全生命周期支持。

---

## 🌟 核心破局点 (Why MechBox?)

在机械设计过程中，数据分散、单向正算、标准错位是导致设计缺陷的主要原因。MechBox 针对性地提供了以下“重火力”解决方案：

*   **100% 离线安全**：没有云端，没有订阅。所有核心计算与海量标准库（SQLite）完全本地化，确保在车间、保密军工企业等无网络环境下依然秒级响应，绝不泄露一张图纸。
*   **逆向约束求解 (Solver Engine)**：不再是传统的“输入参数算结果”。内置牛顿迭代法、二分法与离散优化器，支持带约束条件的反向寻优（如：空间受限下自动推荐最优轴承与螺栓）。
*   **海量本地数据库**：接入 `better-sqlite3`，摒弃低效 JSON。支持 GB/ISO/DIN/JIS/ASME 全量标准件尺寸查询，并预留企业非标件与特殊材料库扩展接口。
*   **跨软件宏联动**：一键将计算得出的沟槽、齿轮方程或装配建议导出为 SolidWorks VBA 宏、FreeCAD Python 脚本或 STEP 占位模型。
*   **白盒化工程产出**：不仅输出最终数值，更在界面上清晰展示计算过程与引用标准（如 ISO 281），支持一键导出专业级 PDF 计算书用于 ISO 9001 设计评审。

---

## 🚀 已落地核心模块 (v1.0)

### ⭕ 密封设计 (Seals)
*   **双向寻优**：从 O 型圈选型推荐沟槽尺寸，或根据已有沟槽逆向匹配符合 AS568/GB3452 标准的密封圈。
*   **多维安全校核**：实时计算压缩率、拉伸率、填充率，并针对静/动密封给出预警。

### 🔵 轴承工具 (Bearings)
*   **寿命与载荷**：基于当量动载荷计算 ISO 281 的 L10 额定寿命。
*   **配合与游隙补偿**：计算由过盈压装引起的初始游隙减少量，以及工作温升引起的热膨胀补偿。
*   **求解器选型**：输入预期寿命与径向空间限制，Solver 引擎自动从数据库筛选最优型号。

### 📏 公差配合 (Tolerances)
*   **极值查询**：基于 ISO 286，输入 `25H7/g6` 即得微米级极限偏差。
*   **性质判定**：自动分析间隙、过渡或过盈状态，并给出装配工艺推荐。

### ⚙️ CAD 导出引擎 (CAD Export)
*   自动生成 SolidWorks 沟槽宏 (`.swp`) 与 FreeCAD 脚本 (`.py`)。
*   自动生成齿轮参数方程，辅助 3D 模型特征驱动。

---

## 🏗️ 架构设计 (混合高性能)

项目目前采用 **Electron + Vue 3 + TypeScript + SQLite** 的现代化桌面架构：

*   **UI 渲染层 (Vue 3 + Ant Design)**：负责高密度的工业控制台级交互与 ECharts 实时图表反馈。
*   **计算引擎 (`src/renderer/engine`)**：基于纯 TypeScript 实现的纯函数与 Solver 约束求解层，高度解耦，易于实现 100% 测试覆盖。
*   **本地数据中心 (`better-sqlite3`)**：在 Electron 主进程中运行，提供极速的 SQL 标准查询与自定义物料表（`user_standards`）管理。

---

## 🗺️ 宏伟演进路线 (v2.0 & v3.0 Roadmap)

我们正朝着“工业级本地瑞士军刀”迈进，接下来的重火力演进计划（详见 [DOC/CRITIQUE_AND_IMPROVEMENT.md](./DOC/CRITIQUE_AND_IMPROVEMENT.md)）：

*   🚀 **系统级耦合计算**：从单零件计算升级为 1D-FEM 轴系传动耦合求解。
*   🦀 **Rust 核心性能榨取**：通过 `napi-rs` 将矩阵运算、蒙特卡洛 (Monte Carlo) 公差概率模拟下沉至 Rust，实现本地算力的极致压榨。
*   🔌 **原生 CAD 插件双向联动**：研发 SolidWorks/Inventor 原生插件，通过本地 WebSocket 与 MechBox 实现参数双向捕捉与实时驱动 (Live Rebuild)。
*   🧊 **本地 WebGL 数字孪生**：利用 Three.js 进行纯本地 3D 参数化几何生成，不打开 CAD 即可在界面上进行干涉与碰撞高亮预警。
*   📊 **多参数扫描 (DOE) 与 PLM Lite**：提供 3D 敏感度云图分析，并加入本地方案版本管理与一键 BOM 导出。

---

## 📦 快速开始

### 1. 克隆仓库
```bash
git clone https://github.com/your-username/MechBox.git
cd MechBox
```

### 2. 安装依赖 (推荐使用 pnpm)
```bash
pnpm install
```

### 3. 开发环境运行
```bash
pnpm dev
```

### 4. 构建独立安装包 (Win/Mac/Linux)
```bash
pnpm build
```

---

## 🤝 参与贡献

MechBox 的目标是打破大厂的信息壁垒与高昂订阅费。无论你是机械工程师还是开发者，我们都极度渴望你的加入：
1. **录入权威数据**：帮助扩充 SQLite 中的 DIN/JIS/ASME 标准件尺寸与非线性材料曲线。
2. **编写计算核心**：用 TypeScript 或 Rust 贡献你擅长的齿轮、弹簧或流体计算数学模型。
3. **反馈工程场景**：提交 Issue 告知我们在特定真实工况下的校核盲区。

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE)。完全开源免费，商业友好。

---

**MechBox** —— 由工程师为工程师打造的桌面级核武。  
*如果您认同我们的理念，请点个 ⭐️ Star 支持！*
