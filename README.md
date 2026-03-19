# Claude Code 配置（UCC）

> 适用于 Golang、Vue、TypeScript（前后端）、JavaScript、Node.js 开发的开箱即用 Claude Code 配置

配置标识：`UCC` · 调用标记：`@ucc` · 命令前缀：`/ucc-*`

---

## 快速开始（3 步）

### 1. 复制配置到项目

```bash
# 方式一：脚本复制（推荐）
node ai-config/scripts/copy-config.js <你的项目目录>

# 方式二：手动复制
cp ai-config/CLAUDE.md your-project/
cp -r ai-config/{README.md,rules,agents,commands,skills,contexts,hooks,scripts,mcp-configs,docs,tests,workflows} your-project/.claude/
cp ai-config/hooks/project-settings.json your-project/.claude/settings.json
```

复制完成后的目标结构应为：

```text
your-project/
├── CLAUDE.md
└── .claude/
    ├── commands/
    ├── agents/
    ├── skills/
    ├── scripts/
    ├── workflows/
    └── settings.json
```

### 2. 修改编码规范（可选但建议）

编辑 `rules/common/` 下的文件，匹配你们团队的约定：

| 文件 | 改什么 | 默认值 |
|------|--------|--------|
| `coding-style.md` | 函数行数、文件行数 | 函数 < 50行，文件 < 800行 |
| `testing.md` | 测试覆盖率 | 80% |
| `git-workflow.md` | 提交格式、分支策略 | Conventional Commits |

### 3. 开始使用

```bash
# 标准团队流程
/ucc-flow-team-standard "添加用户通知功能"

# 小步快改
/ucc-flow-team-fast "修复登录页按钮禁用状态"

# 高风险严格流程
/ucc-flow-team-strict "重构权限校验链路"

# 单人开发闭环
/ucc-flow-single-dev "整理当前模块边界并补齐验证"

# 查看/继续当前流程
/ucc-flow-status
/ucc-flow-continue
```

看到输出末尾出现 `配置标识：UCC`，说明当前会话已命中 UCC。

---

## 目录结构

```text
ai-config/
├── CLAUDE.md                    # 主配置文件（复制到项目根目录）
├── README.md                    # 本指南（复制到项目的 .claude/README.md）
│
├── contexts/                    # 工作模式（3个）
├── rules/                       # 编码规范（团队最常改的部分）
│   ├── common/                  # 通用规范
│   ├── golang/                  # Go 规范
│   ├── javascript/              # JavaScript 规范
│   └── typescript/              # TypeScript/Vue 规范
│
├── agents/                      # 代理（20个）
├── commands/                    # 公开斜杠命令（38个）
├── skills/                      # 技能模块（19个）
├── mcp-configs/                 # MCP 服务配置（需替换密钥占位符）
├── hooks/                       # 可选安全钩子
├── scripts/                     # 工具脚本
├── docs/                        # 深度定制教程
│   └── 配置定制指南.md           # 详细的分步定制指南
├── tests/                       # 配置验证测试
├── workflows/                   # workflow 定义与运行时状态根目录
└── legacy/                      # 旧命令参考（不再作为公开入口）
```

---

## 公开命令面

### 显式流程入口

| 命令 | 用途 | 何时用 |
|------|------|--------|
| `/ucc-flow-team-standard` | 标准团队交付流程 | 默认入口；新功能、重构、常规修复 |
| `/ucc-flow-team-fast` | 快速团队流程 | 小改动、低风险修复、短链路交付 |
| `/ucc-flow-team-strict` | 严格团队流程 | 核心模块、高风险改动、多人协作 |
| `/ucc-flow-team-review` | 团队审查闭环 | PR 审查、提交前审查 |
| `/ucc-flow-team-research` | 团队调研闭环 | 技术选型、问题定位、方案比较 |
| `/ucc-flow-team-doc` | 团队文档闭环 | 设计文档、交付文档、变更说明 |
| `/ucc-flow-single-dev` | 单人开发闭环 | 单人开发、重构、常规修复 |
| `/ucc-flow-single-review` | 单人审查闭环 | 自查、专项质量检查 |
| `/ucc-flow-single-research` | 单人调研闭环 | 调查问题、比较方案 |

### 流程控制命令

| 命令 | 用途 |
|------|------|
| `/ucc-flow-status` | 查看当前或指定 workflow run 的状态 |
| `/ucc-flow-continue` | 继续当前或指定的 paused run |
| `/ucc-flow-abort` | 中止当前或指定的 workflow run |

### 专项能力命令

| 命令 | 用途 |
|------|------|
| `/ucc-build-fix` | 修复构建错误 |
| `/ucc-go-review` | Go 代码审查 |
| `/ucc-go-test` | Go TDD（表驱动测试） |
| `/ucc-go-build` | Go 构建错误修复 |
| `/ucc-javascript-review` | JS/TS/Vue 代码审查 |
| `/ucc-typescript-review` | 前端 TypeScript/Vue 代码审查 |
| `/ucc-typescript-backend-review` | 后端 TypeScript/Node 代码审查 |
| `/ucc-typescript-fullstack-review` | TypeScript 全栈代码审查 |
| `/ucc-db-review` | 数据库审查（MySQL/SQLite） |
| `/ucc-design-doc` | 设计文档（PRD/技术方案/接口文档） |
| `/ucc-delivery-doc` | 交付文档（安装手册/使用说明/测试报告） |
| `/ucc-test-coverage` | 分析测试覆盖率，生成缺失测试 |
| `/ucc-e2e` | 关键流程端到端测试 |
| `/ucc-checkpoint` | 创建/验证检查点 |
| `/ucc-harness-audit` | Harness 快速体检 |
| `/ucc-loop-start` | 启动验证循环 |
| `/ucc-loop-status` | 查看验证状态 |
| `/ucc-model-route` | 检查模型路由 |
| `/ucc-learn` | 从会话提取可复用模式 |
| `/ucc-skill-create` | 从 git 历史生成技能 |
| `/ucc-sessions` | 会话历史管理 |
| `/ucc-refactor-clean` | 安全移除死代码 |

### 工作模式

```bash
/ucc-context-dev       # 开发模式：先写代码，后解释
/ucc-context-review    # 审查模式：先读代码，再评论
/ucc-context-research  # 研究模式：先理解，后行动
```

> 说明：历史入口与拆阶段命令已退到 `legacy/commands/`，不再作为公开主路径推荐。

---

## 运行模型

### 默认行为

- 所有 `/ucc-flow-team-*` 和 `/ucc-flow-single-*` 都是**显式完整入口**
- 启动后默认 `executionMode=auto`
- 运行时根据 profile 自动推进到下一个节点
- 只在命中 `pausePolicy`、危险操作、失败或冲突时暂停
- 暂停后使用 `/ucc-flow-continue [runId]`

### profile 默认策略

| profile | executionMode | pausePolicy |
|---------|---------------|-------------|
| `team.standard` | `auto` | `balanced` |
| `team.fast` | `auto` | `auto` |
| `team.strict` | `auto` | `strict` |
| `team.review` | `auto` | `balanced` |
| `team.research` | `auto` | `balanced` |
| `team.doc` | `auto` | `balanced` |
| `single.dev` | `auto` | `auto` |
| `single.review` | `auto` | `balanced` |
| `single.research` | `auto` | `balanced` |

### 示例

```bash
# 对已有项目框架做一轮完整治理
/ucc-flow-team-standard "审查现状，提出必要修改，实施修改，执行验证，收尾并同步文档"

# 对生产核心链路做高风险治理
/ucc-flow-team-strict "评估风险，制定详细计划，实施修改，完成完整验证、质量门禁和文档同步"

# 先研究，再视情况继续落地
/ucc-flow-team-research "评估当前项目框架的模块划分、构建组织和测试结构；若建议明确则继续接力到标准流程"
```

---

## 团队协作约定

### 配置变更流程

1. 修改配置文件
2. 运行校验（必须通过）：
   ```bash
   node scripts/validate-config.js
   node tests/run-all.js
   ```
3. 提交 PR，至少 1 人审查

### 排查“配置不生效”

1. 优先使用 `/ucc-flow-team-standard`、`/ucc-flow-team-fast` 或其他 `/ucc-flow-*-*` 显式入口
2. 检查输出末尾是否出现 `配置标识：UCC`
3. 若没有出现，确认项目根目录存在 `CLAUDE.md`
4. 确认项目内存在 `.claude/settings.json`、`.claude/commands/`、`.claude/agents/`
5. 确认 `.claude/workflows/definitions.json` 已复制到项目中
6. 如果仍未命中，再在请求中补充 `@ucc`

### 注意事项

- ❌ 不要把密钥写进仓库（`mcp-configs/` 的占位符需替换）
- ❌ 不要硬编码团队成员的本机路径
- ✅ 团队先统一 `rules/common/`，再各语言目录做差异化
- ✅ 若暂停状态不是 `running`，先用 `/ucc-flow-status` 再决定 `continue` 或 `abort`

---

## 深入定制

需要更详细的定制教程（如何删减代理、调整 pausePolicy、修改语言规则等），请参阅：

📖 **[配置定制指南](docs/配置定制指南.md)** — 完整的分步定制教程，含需求问卷、修改示例和项目模板

---

## 版本日志

- **v1.0.0** - 初始版本，支持 Golang、Vue 开发
- **v1.1.0** - 添加 commands 和 skills 模块
- **v1.2.0** - 补齐构建修复代理，新增 TypeScript 规则和 hooks
- **v1.3.0** - 新增文档同步、E2E 测试、JavaScript 规则和基础自测
- **v2.0.0** - 移除 Python，Vue 合并到 TypeScript，新增 JS reviewer
- **v2.1.0** - 新增工作模式切换、工具函数库、3 个新技能和 2 个新命令
- **v2.2.0** - 新增 `/ucc-context` 快捷切换命令
- **v2.3.0** - 新增 MCP 配置、3 代理、6 命令、2 技能、项目模板
- **v3.0.0** - 新增数据库审查、设计/交付文档、Docker/部署技能、质量门禁、CI/CD 管道
- **v3.1.0** - 增量支持前后端 TypeScript 审查，新增 harness/loop/model-route 命令与 hook 运行时控制
- **v3.2.0** - 新增 `/ucc-team*` 显式团队流程命令族、team-orchestrator 代理与项目级安装链路校验
- **v3.3.0** - 新增统一 workflow runtime、`/ucc-flow*` 命令族、workflow-orchestrator 代理与 `.claude/workflows/` 状态持久化
- **v4.0.0** - 收敛公开命令面到 `/ucc-flow-team-*` 与 `/ucc-flow-single-*`，引入 `continue`、自动推进与 profile 级 pause policy

---

## 使用风险提示

- `mcp-configs/mcp-servers.json` 含 `YOUR_*_HERE` 占位符：请替换为实际密钥
- `docs/配置定制指南.md` 中含删除命令示例：执行前务必确认目录
