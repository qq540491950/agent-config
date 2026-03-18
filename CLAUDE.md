# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 提供工作指导。

## 配置标识（Namespace）

为避免与 Claude Code 自带配置或其他团队配置混淆，本配置集使用唯一标识：

- **配置代号（Config ID）**：`UCC`
- **调用标记（Call Tag）**：`@ucc`

### 使用约定

- 当用户在消息中显式包含 `@ucc` 时：表示用户希望严格按本配置集的规则、代理与命令执行，并且**必须**在最终输出末尾追加一行：
  - `配置标识：UCC`
- 当用户通过 `commands/` 中的斜杠命令触发工作流（如 `/ucc-team`、`/ucc-team-fast`、`/ucc-plan`、`/ucc-tdd`、`/ucc-code-review` 等）时：同样**必须**在最终输出末尾追加 `配置标识：UCC`，用于排查“是否命中了本配置”的问题。
- 当用户通过 `/ucc-team*` 命令进入团队流程时，还**必须**显式输出当前阶段，例如：
  - `当前阶段：需求澄清`
  - `当前阶段：实施`
  - `当前阶段：验证`

### 冲突排查

如用户反馈“行为像默认配置”或“命令/代理不生效”，优先让用户在请求中加上 `@ucc`，并检查输出末尾是否出现 `配置标识：UCC`。

## 项目概述

这是一个 **Claude Code 配置插件** - 包含生产级代理、技能、命令和规则。为 Golang、Vue、TypeScript（前后端）、JavaScript、Node.js 开发提供最佳实践工作流。

## 架构说明

项目组织结构：

```
./
├── CLAUDE.md              # 主入口配置
├── agents/                # 专业代理定义（19个）
├── commands/              # 斜杠命令（38个）
├── contexts/              # 动态上下文注入（3个模式）
│   ├── dev.md             # 开发模式上下文
│   ├── review.md          # 审查模式上下文
│   └── research.md        # 研究模式上下文
├── rules/                 # 编码规范
│   ├── common/            # 通用规则（9个文件）
│   ├── javascript/        # JavaScript 规则（5个文件）
│   ├── typescript/        # TypeScript/Vue 规则（5个文件）
│   └── golang/            # Go 规则（5个文件）
├── skills/                # 工作流定义和领域知识（19个）
├── mcp-configs/           # MCP 服务配置模板
│   └── mcp-servers.json   # 推荐的 MCP 服务配置
├── examples/              # 项目模板示例
│   ├── go-microservice-CLAUDE.md
│   └── vue-node-CLAUDE.md
├── scripts/               # 工具脚本
│   ├── lib/               # 工具函数库
│   └── validate-config.js # 配置验证
├── hooks/                 # 可选轻量自动化
├── docs/                  # 文档
└── tests/                 # 配置验证测试
```

## 核心原则

1. **代理优先** — 委托专业代理处理领域任务
2. **测试驱动** — 先写测试再实现，覆盖率要求 80%+
3. **安全第一** — 永不妥协安全；验证所有输入
4. **不可变性** — 始终创建新对象，永不修改现有对象
5. **先计划后执行** — 复杂功能先规划再编码

## 工作模式（Contexts）

根据当前任务切换适当的工作模式：

| 模式 | 文件 | 适用场景 |
|------|------|---------|
| **开发模式** | `contexts/dev.md` | 活跃开发、编码、构建功能 |
| **审查模式** | `contexts/review.md` | PR 审查、代码分析、质量检查 |
| **研究模式** | `contexts/research.md` | 探索、调查、学习新技术 |

模式切换会自动调整：
- 行为准则（先编码 vs 先理解）
- 常用工具（Edit vs Read）
- 输出格式（代码 vs 发现报告）

## 支持的语言

| 语言 | 规则文件 | Skills | 代理 |
|------|---------|--------|------|
| **JavaScript** | 5个（含 hooks） | javascript-patterns, node-backend-patterns | javascript-reviewer |
| **TypeScript/Vue** | 5个（含 hooks） | frontend-patterns, typescript-patterns, typescript-testing | typescript-reviewer, typescript-fullstack-reviewer |
| **TypeScript/Node** | 5个（含 hooks） | node-backend-patterns | typescript-backend-reviewer |
| **Golang** | 5个（含 hooks） | golang-patterns, golang-testing | go-reviewer, go-build-resolver |

## 可用代理

| 代理 | 用途 | 使用场景 |
|-------|---------|-------------|
| team-orchestrator | 团队交付流程编排 | `/ucc-team*` 显式团队入口 |
| planner | 实现规划 | 复杂功能、重构 |
| architect | 系统架构设计 | 架构决策、技术选型 |
| tdd-guide | 测试驱动开发 | 新功能、Bug修复 |
| code-reviewer | 代码质量和可维护性 | 编写/修改代码后 |
| security-reviewer | 漏洞检测 | 提交前、敏感代码 |
| build-error-resolver | 修复构建/类型错误 | 构建失败时 |
| go-build-resolver | 修复 Go 构建错误 | Go 项目构建失败 |
| doc-updater | 文档同步与对齐 | 命令/规则/流程变更后 |
| e2e-runner | 端到端测试执行 | 发布前关键流程验证 |
| go-reviewer | Go代码审查 | Go项目 |
| javascript-reviewer | JavaScript/TypeScript/Vue代码审查 | JS/TS/Vue项目 |
| typescript-reviewer | TypeScript/Vue 前端代码审查 | 前端 TS/Vue 项目 |
| typescript-backend-reviewer | TypeScript/Node 后端代码审查 | 后端 TS/Node 项目 |
| refactor-cleaner | 死代码清理 | 代码清理、重构 |
| database-reviewer | MySQL/SQLite 数据库审查 | 数据库变更、SQL 优化 |
| design-doc-writer | 设计文档生成 | 新功能启动、技术评审 |
| delivery-doc-writer | 交付文档生成 | 项目交付、版本发布 |
| typescript-fullstack-reviewer | TypeScript 全栈代码审查 | 全栈 TS 项目 |

## 代理协调

### 主动触发（无需用户请求）

- 使用 `/ucc-team*` → 优先调用 `team-orchestrator`
- 代码编写完成 → 立即调用 `code-reviewer` 或语言专用 reviewer
- 安全敏感代码 → 立即调用 `security-reviewer`
- 构建或类型检查失败 → 立即调用 `build-error-resolver`
- 接口/命令/规则调整后 → 立即调用 `doc-updater`
- 复杂功能请求 → **planner**
- Bug修复或新功能 → **tdd-guide**
- 发布前关键路径验证 → **e2e-runner**
- 数据库变更 → **database-reviewer**
- 新功能启动 → **design-doc-writer** 生成设计文档
- 项目交付 → **delivery-doc-writer** 生成交付文档

独立操作可并行执行——同时启动多个代理。

### 语言特定代理详情

#### JavaScript

**javascript-reviewer** 专注于：
- ES6+ 惯用法和现代语法
- 异步模式（Promise、async/await）
- 闭包陷阱和 this 绑定
- XSS、原型污染等安全问题

#### TypeScript/Vue（前端）

**typescript-reviewer** 专注于：
- TypeScript 类型安全与类型收窄
- Vue 3 组合式 API 与响应式正确性
- props/emits 类型定义
- 前端安全（XSS、v-html 风险）

#### TypeScript/Node（后端）

**typescript-backend-reviewer** 专注于：
- TypeScript 类型安全与接口约束
- 输入验证与安全防护
- 错误处理与日志一致性
- 服务层结构（controller/service/repository）

#### Golang

**go-reviewer** 专注于：
- Go 惯用法和风格
- 错误处理模式
- 并发安全
- 性能优化

**go-build-resolver** 专注于：
- Go 构建错误诊断和修复
- go vet 警告处理
- 模块依赖问题
- 类型错误修复

## 核心命令

### 开发流程

| 命令 | 用途 |
|------|------|
| `/ucc-team` | 标准团队交付流程入口 |
| `/ucc-team-fast` | 快速团队流程入口 |
| `/ucc-team-strict` | 严格团队流程入口 |
| `/ucc-team-review` | 团队代码审查入口 |
| `/ucc-team-research` | 团队调研入口 |
| `/ucc-team-doc` | 团队文档入口 |
| `/ucc-plan` | 实现规划 |
| `/ucc-tdd` | 测试驱动开发工作流 |
| `/ucc-code-review` | 代码质量审查 |
| `/ucc-learn` | 从会话提取可复用模式 |
| `/ucc-skill-create` | 从 git 历史生成技能 |

### 语言特定

| 命令 | 用途 |
|------|------|
| `/ucc-javascript-review` | JavaScript/TypeScript/Vue 代码审查 |
| `/ucc-typescript-review` | TypeScript/Vue 前端代码审查 |
| `/ucc-typescript-backend-review` | TypeScript/Node 后端代码审查 |
| `/ucc-typescript-fullstack-review` | TypeScript 全栈代码审查 |
| `/ucc-go-review` | Go 代码审查 |
| `/ucc-go-test` | Go TDD 工作流（表驱动测试） |
| `/ucc-go-build` | Go 构建错误修复 |

### 测试与质量

| 命令 | 用途 |
|------|------|
| `/ucc-test-coverage` | 分析测试覆盖率，生成缺失测试 |
| `/ucc-e2e` | 执行关键流程端到端测试 |
| `/ucc-verify` | 综合验证检查 |
| `/ucc-checkpoint` | 检查点创建/验证 |

### 其他命令

| 命令 | 用途 |
|------|------|
| `/ucc-context-dev` | 快速切换到开发模式 |
| `/ucc-context-review` | 快速切换到审查模式 |
| `/ucc-context-research` | 快速切换到研究模式 |
| `/ucc-context` | 兼容入口：通过参数切换模式（dev/review/research） |
| `/ucc-build-fix` | 修复构建错误 |
| `/ucc-update-docs` | 同步更新文档 |
| `/ucc-db-review` | MySQL/SQLite 数据库审查 |
| `/ucc-design-doc` | 生成设计文档（PRD、技术方案、接口文档） |
| `/ucc-delivery-doc` | 生成交付文档（安装手册、使用说明、测试报告） |
| `/ucc-quality-gate` | 提交前质量门禁检查 |
| `/ucc-harness-audit` | Harness 快速体检 |
| `/ucc-loop-start` | 启动验证循环 |
| `/ucc-loop-status` | 查看验证状态 |
| `/ucc-model-route` | 检查模型路由 |
| `/ucc-sessions` | 会话历史管理（列表、加载、别名）|
| `/ucc-refactor-clean` | 安全移除死代码 |

## 可用技能

### 语言特定

| 技能 | 用途 |
|------|------|
| `javascript-patterns` | JS 核心模式、异步处理、闭包陷阱 |
| `node-backend-patterns` | Node.js 后端开发模式 |
| `frontend-patterns` | React/Vue 前端模式 |
| `golang-patterns` | Go 惯用法、并发模式 |
| `golang-testing` | Go 表驱动测试、Mock 策略 |

### 工作流程

| 技能 | 用途 |
|------|------|
| `search-first` | 先研究后编码工作流 |
| `tdd-workflow` | TDD 工作流指导 |
| `e2e-testing` | Playwright E2E 测试模式 |
| `api-design` | REST API 设计模式 |
| `continuous-learning` | 持续学习系统，自动提取模式 |

### 质量保证

| 技能 | 用途 |
|------|------|
| `security-review` | 安全审查流程和检查清单 |
| `verification-loop` | 验证循环，全面质量检查 |
| `design-collaboration` | 设计协作流程 |

### 文档与部署

| 技能 | 用途 |
|------|------|
| `design-doc-patterns` | 设计文档模板（PRD、技术方案、ADR） |
| `delivery-patterns` | 交付文档模板（安装手册、测试报告） |
| `docker-patterns` | Docker 容器化最佳实践 |
| `deployment-patterns` | 部署策略和运维模式 |

## 安全指南

**任何提交前：**
- 无硬编码密钥（API密钥、密码、令牌）
- 所有用户输入已验证
- SQL注入防护（参数化查询）
- XSS防护（HTML消毒）
- CSRF保护已启用
- 认证/授权已验证
- 所有端点限流
- 错误消息不泄露敏感数据

**密钥管理：** 永不硬编码密钥。使用环境变量或密钥管理器。启动时验证必需的密钥。立即轮换任何暴露的密钥。

**发现安全问题时：** 停止 → 使用 security-reviewer 代理 → 修复关键问题 → 轮换暴露的密钥 → 检查代码库类似问题。

## 编码风格

**不可变性（关键）：** 始终创建新对象，永不修改。返回应用更改的新副本。

**文件组织：** 多个小文件优于少数大文件。通常200-400行，最多800行。按功能/领域组织，而非按类型。高内聚，低耦合。

**错误处理：** 每层都处理错误。UI代码提供用户友好的消息。服务端记录详细上下文。永不静默吞掉错误。

**输入验证：** 在系统边界验证所有用户输入。使用基于模式的验证。快速失败并给出清晰消息。永不信任外部数据。

**代码质量检查清单：**
- 函数小（<50行），文件专注（<800行）
- 无深层嵌套（>4层）
- 正确的错误处理，无硬编码值
- 可读性好，命名清晰的标识符

## 测试要求

**最低覆盖率: 80%**

测试类型（全部必需）：
1. **单元测试** — 单个函数、工具、组件
2. **集成测试** — API端点、数据库操作
3. **E2E测试** — 关键用户流程

**TDD工作流（强制）：**
1. 先写测试（红）— 测试应该失败
2. 写最小实现（绿）— 测试应该通过
3. 重构（改进）— 验证覆盖率 80%+

故障排除：检查测试隔离 → 验证模拟 → 修复实现（不是测试，除非测试错误）。

## 开发工作流

1. **计划** — 使用 planner 代理，识别依赖和风险，分解为阶段
2. **TDD** — 使用 tdd-guide 代理，先写测试，实现，重构
3. **审查** — 立即使用 code-reviewer 或语言专用 reviewer，解决关键/高优先级问题
4. **提交** — 常规提交格式，全面的PR摘要

## Git工作流

**提交格式：** `<类型>: <描述>` — 类型：feat, fix, refactor, docs, test, chore, perf, ci

**PR工作流：** 分析完整提交历史 → 起草全面摘要 → 包含测试计划 → 使用 `-u` 标志推送。

## MCP 服务配置

在 `mcp-configs/mcp-servers.json` 中提供了推荐的 MCP 服务配置：

| 服务 | 用途 | 必装 |
|------|------|------|
| `github` | GitHub 操作（PR、Issue、仓库） | ⭐⭐⭐ |
| `memory` | 跨会话持久记忆 | ⭐⭐⭐ |
| `filesystem` | 文件系统操作 | ⭐⭐⭐ |
| `context7` | 实时文档查询 | ⭐⭐⭐ |
| `sequential-thinking` | 链式推理 | ⭐⭐ |
| `exa-web-search` | 网页搜索与研究 | ⭐⭐ |
| `firecrawl` | 网页抓取 | ⭐⭐ |

**使用方法**：复制需要的服务到 `~/.claude.json` 的 `mcpServers` 部分，替换 `YOUR_*_HERE` 为实际密钥。

## 成功指标

- 所有测试通过，覆盖率 80%+
- 无安全漏洞
- 代码可读可维护
- 性能可接受
- 满足用户需求

## 贡献指南

遵循以下格式：
- **代理**：Markdown + YAML 前置数据 (`name`, `description`, `tools`, `model`)
- **技能**：Markdown + YAML 前置数据 (`name`, `description`)
- **命令**：Markdown + YAML 前置数据 (`description`, `context: fork`, `agent`, `allowed-tools`)
- **规则**：清晰的规范和示例

> 💡 **技术细节**：详见 [配置定制指南.md](docs/配置定制指南.md) 附录 C。

文件命名：小写+连字符（如 `go-reviewer.md`, `tdd-workflow.md`）
