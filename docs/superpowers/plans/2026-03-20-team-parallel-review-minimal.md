# Team Parallel Review Minimal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `team` 工作流在不改 runtime 单 active run 语义的前提下，支持在 `review` 节点内并行委派审查代理。

**Architecture:** 保留 `team.standard` 与 `team.strict` 的串行主干节点，把并行能力收敛到 `review` 节点内部，由 `team-orchestrator` 读取 workflow 元数据并执行并行委派与汇总。runtime 仍只感知一个 root run 和一个当前节点，不持久化子任务状态。

**Tech Stack:** Node.js、JSON workflow definitions、Markdown agent/docs 配置、`assert` 测试

---

### Task 1: 为并行审查元数据补失败测试

**Files:**
- Modify: `tests/workflow-command-metadata.test.js`
- Modify: `tests/team-workflow.test.js`

- [ ] **Step 1: 添加 `team.standard.review` 与 `team.strict.review` 的并行元数据断言**
- [ ] **Step 2: 添加 `team-orchestrator` 并行审查说明断言**
- [ ] **Step 3: 运行定向测试，确认因缺少元数据和说明而失败**
- [ ] **Step 4: 记录失败点，作为最小实现边界**

### Task 2: 实现 review 节点的最小并行委派配置

**Files:**
- Modify: `workflows/definitions.json`
- Modify: `agents/team-orchestrator.md`

- [ ] **Step 1: 把 `team.standard.review` 与 `team.strict.review` 的执行者切回 `team-orchestrator`**
- [ ] **Step 2: 增加 `executionStrategy`、`parallelDelegates` 与 `joinPolicy` 元数据**
- [ ] **Step 3: 在 `team-orchestrator` 中补充“并行委派后统一汇总并推进”的执行规范**
- [ ] **Step 4: 保持 `verify`、`docs` 与 `summary` 的串行推进不变**

### Task 3: 更新规则与文档表述

**Files:**
- Modify: `rules/common/agents.md`
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `docs/配置定制指南.md`

- [ ] **Step 1: 把规则描述收敛为“串行主干 + 节点内并行审查”**
- [ ] **Step 2: 更新 README 与 CLAUDE 的团队 workflow 描述**
- [ ] **Step 3: 更新配置指南，说明最小版并行化只覆盖 `review` 节点**
- [ ] **Step 4: 确保文档不再暗示多 active run 或全面并行编排**

### Task 4: 完成验证

**Files:**
- Test: `tests/workflow-command-metadata.test.js`
- Test: `tests/team-workflow.test.js`
- Test: `tests/workflow-runtime.test.js`
- Test: `scripts/validate-config.js`

- [ ] **Step 1: 运行定向 workflow 元数据测试**
- [ ] **Step 2: 运行团队 workflow 测试**
- [ ] **Step 3: 运行 workflow runtime 回归测试**
- [ ] **Step 4: 运行配置总校验，确认最小版改动没有破坏现有闭环**
