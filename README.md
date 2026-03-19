# Claude Code 配置（UCC）

> 面向生产场景的 Claude Code 自动化配置，适用于 Golang、Vue、TypeScript、JavaScript 与 Node.js 开发

配置标识：`UCC` · 调用标记：`@ucc` · 命令前缀：`/ucc-*`

---

## 快速开始

### 1. 复制配置到项目

```bash
# 方式一：脚本复制（推荐）
node ai-config/scripts/copy-config.js <你的项目目录>

# 方式二：手动复制
cp ai-config/CLAUDE.md your-project/
cp -r ai-config/{README.md,rules,agents,commands,skills,hooks,scripts,mcp-configs,workflows} your-project/.claude/
cp ai-config/hooks/project-settings.json your-project/.claude/settings.json
```

复制完成后的目标结构应为：

```text
your-project/
|-- CLAUDE.md
`-- .claude/
    |-- commands/
    |-- agents/
    |-- skills/
    |-- scripts/
    |-- workflows/
    `-- settings.json
```

### 2. 按团队规范调整规则

编辑 `rules/common/` 下的文件，匹配你们团队的约定：

| 文件 | 调整内容 | 默认值 |
|------|----------|--------|
| `coding-style.md` | 函数行数、文件行数 | 函数 < 50 行，文件 < 800 行 |
| `testing.md` | 测试覆盖率 | 80% |
| `git-workflow.md` | 提交格式、分支策略 | Conventional Commits |

### 3. 直接触发自动流程

```text
/ucc-team-standard 审查现有项目框架，指出必须修改项，实施修改，完成验证，收尾并同步文档
/ucc-team-research 评估当前项目框架的模块划分、构建结构和测试组织；若结论明确则继续落地
/ucc-team-strict 审查并重构核心链路，要求完整验证、质量门禁和文档同步
/ucc-single-standard 基于当前仓库完成自动检查、必要修改、验证和总结
/ucc-single-research 分析当前结构问题并给出证据支持的改造建议，如可执行则继续落地
/ucc-flow-status
/ucc-flow-continue
/ucc-flow-abort
```

看到输出末尾出现 `配置标识：UCC`，说明当前会话已命中 UCC。

---

## 目录结构

```text
ai-config/
|-- CLAUDE.md                    # 主配置文件（复制到项目根目录）
|-- README.md                    # 本指南（复制到项目的 .claude/README.md）
|-- rules/                       # 编码规范
|-- agents/                      # 代理配置（20个）
|-- commands/                    # 公开斜杠命令（8个）
|-- skills/                      # 技能模块（19个）
|-- mcp-configs/                 # MCP 服务配置
|-- hooks/                       # 可选安全钩子
|-- scripts/                     # 工具脚本
|-- docs/                        # 维护文档（源仓库保留）
|-- tests/                       # 配置验证测试（源仓库保留）
`-- workflows/                   # workflow 定义与运行时状态
```

---

## 公开命令面

### 自动化流程入口

| 命令 | 用途 | 自动链路 |
|------|------|----------|
| `/ucc-team-standard` | 默认团队交付入口 | 澄清 -> 计划 -> 实施 -> 审查 -> 验证 -> 文档 -> 总结 |
| `/ucc-team-strict` | 高风险严格交付 | 澄清 -> 风险 -> 详细计划 -> 实施 -> 审查 -> 完整验证 -> 文档 -> 质量门禁 -> 总结 |
| `/ucc-team-research` | 团队调研并自动交接实施 | 问题定义 -> 证据 -> 结论 -> 交接 -> 自动切入 `team.standard.plan` |
| `/ucc-single-standard` | 单 agent 闭环交付 | 澄清 -> 计划 -> 实施 -> 审查 -> 验证 -> 总结 |
| `/ucc-single-research` | 单 agent 调研并自动交接实施 | 问题定义 -> 证据 -> 结论 -> 后续动作 -> 自动切入 `single.standard.plan` |

### 流程控制

| 命令 | 用途 |
|------|------|
| `/ucc-flow-status` | 查看当前或指定 workflow run 的状态 |
| `/ucc-flow-continue` | 继续当前或指定的 paused run |
| `/ucc-flow-abort` | 中止当前或指定的 workflow run |

### 内部能力

构建修复、语言专项审查、数据库审查、E2E、文档生成、覆盖率补齐、死代码清理和上下文切换能力仍然保留，但改为由 runtime 按阶段自动调度内部 agent，不再额外占用公开 slash 命令面。

---

## 自动接力模型

### 使用规则

- 用户只需要输入显式命令和需求，不需要手工传 workflow 参数。
- 公开入口固定为 5 个自动化入口与 3 个控制命令。
- 公开 flow 入口默认 `executionMode=auto`。
- 运行时根据 profile 自动推进后续节点。
- 只有在命中 `pausePolicy`、执行失败、上下文冲突或缺少关键输入时才暂停。
- 暂停后统一使用 `/ucc-flow-status` 和 `/ucc-flow-continue`。
- 所有自定义 agents 默认 `model: inherit`，继承当前会话模型，避免固定官方模型别名导致 provider 侧 502。

### profile 默认策略

| profile | executionMode | pausePolicy |
|---------|---------------|-------------|
| `team.standard` | `auto` | `balanced` |
| `team.strict` | `auto` | `strict` |
| `team.research` | `auto` | `balanced` |
| `single.standard` | `auto` | `auto` |
| `single.research` | `auto` | `balanced` |

---

## 典型使用方式

### 场景 A：团队全流程自动治理

```text
/ucc-team-standard 审查当前项目框架，识别结构问题并给出最小可执行修改；完成修改、验证、收尾并同步文档
```

这会默认自动跑完整团队链路，用户不需要再手工输入“计划命令”“开发命令”“验证命令”“文档命令”。

### 场景 B：先研究，再自动接力到实施

```text
/ucc-team-research 评估当前项目框架的模块划分、构建结构和测试组织；若结论明确，则继续落地改造
```

研究链路完成后，会自动切入 `team.standard.plan`，继续执行实施、审查、验证、文档同步和总结。

### 场景 C：单 agent 自动闭环

```text
/ucc-single-standard 基于当前仓库结构完成一轮自动检查、必要修改、验证和总结
```

### 场景 D：单 agent 先调研再落地

```text
/ucc-single-research 分析当前仓库的模块边界、构建组织和测试缺口，并在结论明确后继续落地
```

---

## 团队协作约定

### 配置变更流程

如果你在维护 UCC 配置仓库：

1. 修改配置文件。
2. 运行完整校验：

```bash
node scripts/validate-config.js
node tests/run-all.js
```

3. 通过校验后再提交变更。

如果你只是把 UCC 部署到业务项目：

```bash
node .claude/scripts/validate-config.js
```

### 排查“配置不生效”

1. 优先使用 `/ucc-team-standard`、`/ucc-team-research`、`/ucc-single-standard` 等显式入口。
2. 检查输出末尾是否出现 `配置标识：UCC`。
3. 若没有出现，确认项目根目录存在 `CLAUDE.md`。
4. 确认项目内存在 `.claude/settings.json`、`.claude/commands/`、`.claude/agents/`。
5. 确认 `.claude/workflows/definitions.json` 已复制到项目中。
6. 如果仍未命中，再在请求中补充 `@ucc`。

### 注意事项

- 不要把密钥写进仓库。
- 不要硬编码团队成员的本机路径。
- 团队先统一 `rules/common/`，再做语言级差异化。
- 若流程已暂停，先用 `/ucc-flow-status` 再决定 `continue` 或 `abort`。

---

## 深入定制

更详细的定制方法请回到 UCC 配置仓库查看 `docs/配置定制指南.md` 源文件。

---

## 版本日志

- **v4.4.0** - 删除 `.internal` 与 `contexts`，默认部署包不再复制 `docs/` 和 `tests/`，同时让已部署项目中的 `validate-config.js` 支持精简布局校验
- **v4.3.0** - 公开 slash 命令面继续收敛到 8 个固定入口，低频专项命令改为内部 agent 能力，由 team / single workflow 自动按需调度
- **v4.2.0** - 公开流程入口收敛为 `/ucc-team-*` 与 `/ucc-single-*` 的可读命令族，保留 5 个自动化入口与 3 个控制命令，调研链路默认自动接力到标准实施，所有 agents 继续 `model: inherit`
- **v4.1.0** - 所有 agents 默认继承当前会话模型，移除 legacy 与低频维护命令，公开命令面收敛到 29 个
- **v4.0.0** - 收敛公开命令面到上一代 flow 命令族，引入 `continue`、自动推进与 profile 级 pause policy
- **v3.3.0** - 新增统一 workflow runtime、`/ucc-flow*` 命令族、workflow-orchestrator 代理与 `.claude/workflows/` 状态持久化
- **v3.2.0** - 新增 `/ucc-team*` 显式团队流程命令族、team-orchestrator 代理与项目级安装链路校验
