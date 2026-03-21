# Claude Code 配置（UCC）

> 面向生产场景的 Claude Code 自动化配置，适用于 Golang、Vue、TypeScript、JavaScript 与 Node.js 开发

配置标识：`UCC` · 调用标记：`@ucc` · 命令前缀：`/ucc-*`

`README.md` 只保留快速开始、安装矩阵和最短排障；完整操作说明请看 `docs/使用说明.md`，维护者定制说明请看 `docs/配置定制指南.md`。

---

## 快速开始

### 1. 复制配置到项目

```bash
# 默认选择式安装：运行后按提示选择 CLAUDE、hooks、MCP 和平台
node ai-config/scripts/copy-config.js <你的项目目录>

# 高级覆盖：直接指定 .claude/CLAUDE.md
node ai-config/scripts/copy-config.js <你的项目目录> --claude-mode dotclaude

# 高级覆盖：直接生成根目录 bootstrap CLAUDE.md，并启用项目级 hooks
node ai-config/scripts/copy-config.js <你的项目目录> --claude-mode import-root --hooks project

# 非交互生成项目级 MCP（默认 basic 预设）
node ai-config/scripts/copy-config.js <你的项目目录> --mcp project

# 兼容旧布局
node ai-config/scripts/copy-config.js <你的项目目录> --legacy-layout
```

复制完成后的默认目标结构应为：

```text
your-project/
`-- .claude/
    |-- commands/
    |-- agents/
    |-- skills/
    |-- scripts/
    |-- workflows/
    `-- README.md
```

脚本默认会进入选择式向导；只有在向导中选择或显式传入 `--claude-mode`、`--hooks`、`--mcp` 时，才会额外生成 `CLAUDE.md`、`.claude/CLAUDE.md`、`.claude/settings.json`、`.claude/settings.local.json` 或项目根 `.mcp.json`。平台会优先自动判断，只在 API Key、目录等必填参数上要求输入。

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
|-- CLAUDE.md                    # 源仓库自身的配置入口（不再默认复制到目标项目）
|-- README.md                    # 本指南（复制到项目的 .claude/README.md）
|-- rules/                       # 编码规范
|-- agents/                      # 代理配置（20个）
|-- commands/                    # 公开斜杠命令（8个）
|-- skills/                      # 技能模块（19个）
|-- mcp-configs/                 # MCP 服务模板与交互式元数据
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
| `/ucc-team-standard` | 默认团队交付入口 | 澄清 -> 计划（节点内并行） -> 实施 -> 审查（节点内并行） -> 验证（节点内有限并行） -> 文档 -> 总结 |
| `/ucc-team-strict` | 高风险严格交付 | 澄清 -> 风险 -> 详细计划（节点内并行） -> 实施 -> 审查（节点内并行） -> 完整验证（节点内有限并行） -> 文档 -> 质量门禁 -> 总结 |
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

当前团队 workflow 仍是单 active run 的串行主干；受控并行在 `team.standard.plan`、`team.strict.detailed-plan`、`review` 与验证节点内开启，由 `team-orchestrator` 负责 fan-out/fan-in 汇总。运行时除 `runs/` 与 `events/` 外，还会在 `.claude/workflows/control/` 下写入可读 control plane 快照，供 `/ucc-flow-status` 展示最近阶段摘要、并行委派状态、验证结果和阻塞原因。

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

当前 `single.standard` 已是完整闭环，默认会按 `clarify -> plan -> implement -> review -> verify -> summary` 自动推进。

### 场景 D：单 agent 先调研再落地

```text
/ucc-single-research 分析当前仓库的模块边界、构建组织和测试缺口，并在结论明确后继续落地
```

`single.research` 在 `next-action` 完成后会自动切入 `single.standard.plan`，不需要用户手工再补一个 `/ucc-single-standard`。

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

其中 `validate-config.js` 当前不仅检查文件是否存在，还会校验 workflow 语义闭环、`hooks/hooks.json` 中的 `PreToolUse` / `PostToolUse` / `Stop`、以及文档中是否残留退役的 `/ucc-*` 命令引用。

3. 通过校验后再提交变更。

如果你只是把 UCC 部署到业务项目：

```bash
node .claude/scripts/validate-config.js
```

### 排查“配置不生效”

1. 优先使用 `/ucc-team-standard`、`/ucc-team-research`、`/ucc-single-standard` 等显式入口。
2. 检查输出末尾是否出现 `配置标识：UCC`。
3. 确认项目内存在 `.claude/commands/`、`.claude/agents/` 与 `.claude/workflows/definitions.json`。
4. 如果流程已经运行过，确认 `.claude/workflows/control/latest.json` 能反映最近阶段摘要与状态。
5. 如果使用了 `--claude-mode dotclaude`，确认 `.claude/CLAUDE.md` 已生成；如果使用了 `--claude-mode import-root`，确认根目录 `CLAUDE.md` 或导入片段已就位。
6. 如果启用了 hooks，确认 `.claude/settings.json` 或 `.claude/settings.local.json` 已生成并合并成功；如果启用了项目级 MCP，再确认项目根 `.mcp.json` 与 `enabledMcpjsonServers` 已写入。
7. 如果仍未命中，再在请求中补充 `@ucc`。

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

- **v4.7.0** - 为 workflow runtime 增加 `control/` 控制面快照、扩展 `/ucc-flow-status` 的阶段/委派/验证可观测性，并将 `team.standard.plan` 与 `team.strict.detailed-plan` 升级为受控并行计划节点
- **v4.6.0** - 在保持单 active run 串行主干不变的前提下，为 `team.standard.verify` 与 `team.strict.full-verify` 增加有限并行验证，并补齐相关测试与文档说明
- **v4.5.0** - 补齐 `single.standard` 闭环定义，完善 `single.research -> single.standard.plan` 接力说明，同时增强 `validate-config.js` 对 workflow 语义、双 hook 配置与退役命令引用的校验
- **v4.4.0** - 删除 `.internal` 与 `contexts`，默认部署包不再复制 `docs/` 和 `tests/`，同时让已部署项目中的 `validate-config.js` 支持精简布局校验
- **v4.3.0** - 公开 slash 命令面继续收敛到 8 个固定入口，低频专项命令改为内部 agent 能力，由 team / single workflow 自动按需调度
- **v4.2.0** - 公开流程入口收敛为 `/ucc-team-*` 与 `/ucc-single-*` 的可读命令族，保留 5 个自动化入口与 3 个控制命令，调研链路默认自动接力到标准实施，所有 agents 继续 `model: inherit`
- **v4.1.0** - 所有 agents 默认继承当前会话模型，移除 legacy 与低频维护命令，公开命令面收敛到 29 个
- **v4.0.0** - 收敛公开命令面到上一代 flow 命令族，引入 `continue`、自动推进与 profile 级 pause policy
- **v3.3.0** - 新增统一 workflow runtime、`/ucc-flow*` 命令族、workflow-orchestrator 代理与 `.claude/workflows/` 状态持久化
- **v3.2.0** - 新增 `/ucc-team*` 显式团队流程命令族、team-orchestrator 代理与项目级安装链路校验
