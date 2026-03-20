# Interactive Copy Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `scripts/copy-config.js` 支持交互式选择 hooks、项目级 MCP、平台适配与必要参数输入，并尽量减少手工参数错误。

**Architecture:** 保留现有“复制 `.claude/` 运行时资产”的主路径，在脚本内增加交互式向导层。MCP 改为生成项目根 `.mcp.json`，并把已选 MCP 写入 `.claude/settings*.json` 的 MCP 审批字段；hooks 继续复用现有 settings merge 逻辑。

**Tech Stack:** Node.js、内置 `readline`、现有 `scripts/lib/settings-merge.js`、`assert` 测试

---

### Task 1: 为交互式 MCP / hooks 行为补测试

**Files:**
- Modify: `tests/copy-config-modes.test.js`
- Modify: `tests/copy-config.test.js`

- [ ] **Step 1: 写失败测试，覆盖交互式输入**
- [ ] **Step 2: 运行定向测试，确认因缺少交互式实现而失败**
- [ ] **Step 3: 补充 `.mcp.json`、平台包装命令、settings MCP 名单断言**
- [ ] **Step 4: 再次运行定向测试，确保仍为预期失败**

### Task 2: 实现 MCP 元数据与平台适配

**Files:**
- Modify: `mcp-configs/mcp-servers.json`
- Modify: `scripts/copy-config.js`

- [ ] **Step 1: 把 MCP 模板从“最终配置样例”整理为“可交互填充的元数据”**
- [ ] **Step 2: 增加平台检测与命令渲染逻辑**
- [ ] **Step 3: 增加 `.mcp.json` 生成逻辑，处理必要参数填充**
- [ ] **Step 4: 让 hooks settings 同时合并 MCP 审批字段**

### Task 3: 实现交互式安装向导

**Files:**
- Modify: `scripts/copy-config.js`

- [ ] **Step 1: 设计非侵入式交互入口，优先复用 CLI 参数，缺失时才提问**
- [ ] **Step 2: 加入 hooks / MCP / 平台 / 必填参数选择流程**
- [ ] **Step 3: 保持 `--force`、`--legacy-layout` 与已部署脚本兼容**
- [ ] **Step 4: 输出安装摘要，明确生成的文件与启用的 MCP**

### Task 4: 更新文档并完成验证

**Files:**
- Modify: `README.md`
- Modify: `docs/使用说明.md`

- [ ] **Step 1: 更新复制脚本用法，说明交互式模式与 `.mcp.json` 产物**
- [ ] **Step 2: 补充平台自动判断与必填参数说明**
- [ ] **Step 3: 运行相关测试与配置校验**
- [ ] **Step 4: 复核输出，确保没有把 MCP 仍描述为手工复制到 `~/.claude.json`**
