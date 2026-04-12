# 🛠️ MechBox (MechCalc)
### 工业级机械设计辅助与演算平台 —— 断网环境下绝对可靠的离线桌面指挥中心

[![Electron](https://img.shields.io/badge/Electron-30.x-blue?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.x-4fc08d?style=flat-square&logo=vuedotjs)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Core-Rust--Inside-orange?style=flat-square&logo=rust)](https://www.rust-lang.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg?style=flat-square)](LICENSE)

---

> **"让每一位机械工程师都能在极端的保密环境与复杂的工况下，快速、严谨地完成从定性选型到图纸落地的全过程。"**

**MechBox** 是一款深度集成机械设计逻辑、多国行业标准与约束求解算法的桌面端重型辅助平台。它不仅是散乱 Excel 表格的终结者，更是连接工程理论与生产实际的数字桥梁。

---

## 💎 核心破局点 (Why MechBox?)

在工业软件领域，我们坚持“计算回归底层，数据坚守本地”：

*   **🛡️ 100% 离线主权**：零云端依赖，数据不离机。直击军工、核心研发单位的保密红线，确保在无网车间依然拥有秒级的响应体验。
*   **🧠 逆向约束求解 (Solver Engine)**：超越传统的“正向代公式”。内置牛顿-拉夫逊、二分法及离散优化算法，支持给定目标（如：轴径受限、寿命要求）反向寻优最优零部件。
*   **📖 黑盒计算，白盒呈现**：底层采用严谨的 Rust/TS 核心解算，前端通过 LaTeX 优雅渲染公式推导全过程。每一行数值，皆有标准可依，每一份报告，皆可用于 ISO 评审。
*   **🔗 跨软件宏联动**：打通 CAD 数据孤岛。一键将计算结果推送到 SolidWorks VBA 宏或 FreeCAD 脚本中，实现 3D 特征的“Live Rebuild”。

---

## 🚀 功能矩阵 (v1.0 现已就绪)

### ⚙️ 核心设计模块
*   **密封系统 (Seals)**：基于 Lindley 方程的接触应力预估，涵盖 O 型圈正/反向设计与热膨胀校核。
*   **轴承动力学 (Bearings)**：全面实现 ISO 281:2007 修正额定寿命计算，引入润滑比 ($\kappa$) 与污染系数 ($e_C$) 修正。
*   **螺栓连接 (Bolts)**：遵循 VDI 2230 系统化协议，涵盖载荷分配系数 $\Phi$、预紧力损失及疲劳极限校验。
*   **传动选型 (Drives)**：集成带传动、链传动及渐开线齿轮 (ISO 6336) 的几何与强度解算。

### 📚 工程中枢与工具
*   **多国标准互查**：覆盖 GB/ISO/DIN/JIS/ASME 标准件库，支持材料牌号的跨国等效代换。
*   **逆向识别向导**：只需输入现场实测的外形残余数据，AI 算法自动反推标准规格。
*   **DFM 成本预估**：在公差选择阶段即刻映射加工工艺，预警高成本过精密加工风险。

---

## 🏗️ 技术架构 (High-Performance Stack)

*   **GUI 层**：基于 **Vue 3 (Composition API)** + **Ant Design Vue** 构建的高密度工业控制台。
*   **引擎层**：由 **TypeScript Solver** 与 **Rust Core (napi-rs)** 驱动的高密矩阵运算内核。
*   **数据层**：内嵌 **SQLite (FTS5)** 全文检索引擎，支撑百万级标准规格的毫秒级检索。
*   **渲染层**：利用 **WebGL (Three.js)** 实现纯本地化的 3D 参数化数字孪生预览。

---

## 🗺️ 宏伟愿景 (Future Roadmap)

*   **v2.0**: **系统级耦合**。引入 1D-FEM，实现“轴-齿轮-轴承”传动链的整体变形与载荷耦合求解。
*   **v2.5**: **本地 AI Copilot**。集成基于 RAG 的本地专家模型，通过自然语言驱动选型建议。
*   **v3.0**: **重火力轻量化**。计算核心全面 Rust 化，引入 Monte Carlo 蒙特卡洛公差良率仿真。

---

## 📄 开源协议与商业授权

本项目采用 **[GNU General Public License v3.0 (GPL-3.0)](LICENSE)**。

*   **社区版**：免费、开源、允许二次开发，但您的衍生作品必须同样开源。
*   **双重授权 (Dual Licensing)**：如果您需要在闭源商业软件、私有设备系统或企业内部集成 MechBox 的核心解算内核，请联系作者获取**商业授权 (Commercial License)**。

---

**MechBox** —— 由工程师为工程师打造的“桌面级核武”。  
*如果您认同我们的愿景，请点击右上方 ⭐️ Star 支持本项目！*
