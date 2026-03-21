# CLAUDE.md

此文件为 Claude Code 提供 UCC（Unified Claude Code Config）配置入口。

## 配置标识

- 配置代号：`UCC`
- 调用标记：`@ucc`

## 命中约束

- 当用户消息显式包含 `@ucc` 时，最终输出末尾必须追加：`配置标识：UCC`
- 当用户通过 `commands/` 中的显式命令触发流程时，最终输出末尾也必须追加：`配置标识：UCC`
- 当用户通过下列 workflow 命令进入或控制流程时，还必须输出 workflow 摘要，至少包含：
  - `当前阶段：...`
  - `触发链：...`
  - `当前节点：...`
  - `下一节点：...`
  - `执行模式：...`
  - `暂停策略：...`
  - `暂停状态：...`
  - `继续命令：/ucc-flow-continue`
  - `最近阶段摘要：...`
  - `并行委派：...`
  - `验证状态：...`

适用命令：

- `/ucc-team-standard`
- `/ucc-team-strict`
- `/ucc-team-research`
- `/ucc-single-standard`
- `/ucc-single-research`
- `/ucc-flow-status`
- `/ucc-flow-continue`
- `/ucc-flow-abort`

若用户反馈“像默认配置”或“命令未生效”，优先让用户补充 `@ucc`，并检查最终输出末尾是否包含 `配置标识：UCC`。

## 项目概览

这是一个面向生产场景的 Claude Code 配置仓库，目标是：

1. 用显式完整命令触发工作流，减少参数化入口带来的误用
2. 用统一 runtime 串联 team / single 两类流程
3. 默认自动推进，只有在风险、失败、冲突或 pausePolicy 命中时暂停
4. 让“检查、提出修改、实施、验证、收尾、更新文档”可以一次触发后自动接力完成

## 部署约定

- `scripts/copy-config.js` 默认只复制 `.claude/` 下的运行时资产
- 默认不再为目标项目生成根目录 `CLAUDE.md`
- 默认不再为目标项目生成 `.claude/settings.json`
- 需要显式接入 `CLAUDE` 或 hooks 时，使用 `--claude-mode` 与 `--hooks` 参数
- 如需兼容旧布局，使用 `--legacy-layout`

## 仓库结构

```text
./
|-- CLAUDE.md              # 主入口配置
|-- agents/                # 代理配置（20个）
|-- commands/              # 公开斜杠命令（8个）
|-- rules/                 # 编码规范
|-- skills/                # 技能模块（19个）
|-- hooks/                 # 可选安全 Hook
|-- scripts/               # 工具脚本
|-- docs/                  # 维护文档（源仓库保留）
|-- tests/                 # 配置测试（源仓库保留）
`-- workflows/             # workflow 定义与运行时状态
```

## 核心工作方式

### 1. 公开入口只保留显式完整命令

推荐直接使用以下入口：

- 团队标准交付：`/ucc-team-standard`
- 团队严格交付：`/ucc-team-strict`
- 团队调研并自动交接：`/ucc-team-research`
- 单人标准闭环：`/ucc-single-standard`
- 单人调研并自动交接：`/ucc-single-research`

流程控制命令：

- `/ucc-flow-status`
- `/ucc-flow-continue`
- `/ucc-flow-abort`

当前公开 slash 命令面固定为 8 个；其余构建修复、专项审查、文档和 E2E 能力只作为内部 agent / workflow 节点调用。

### 2. 运行时默认自动接力

所有 `/ucc-team-*` 与 `/ucc-single-*` 入口默认：

- `executionMode = auto`
- 根据 profile 自动选择 `pausePolicy`
- 创建或恢复 workflow run
- 从当前节点自动推进到后续节点
- 只有在以下情况才暂停：
  - 命中 pausePolicy 风险信号
  - 执行失败
  - 上下文冲突
  - 需要用户补充不可推断的关键输入

暂停后，统一使用 `/ucc-flow-continue [runId]` 接力。

所有自定义 agents 默认 `model: inherit`，继承当前会话模型，避免固定官方模型别名在 provider 侧触发 502。

## 典型使用方式

### 场景 A：已有项目框架，想走团队全流程自动治理

```text
/ucc-team-standard 审查现有项目框架，指出必须修改项，实施修改，完成验证，收尾并同步文档
```

预期自动链路：

1. `clarify`
2. `plan`
3. `implement`
4. `review`
5. `verify`（节点内有限并行验证）
6. `docs`
7. `summary`

如果中途命中风险或失败：

1. 先用 `/ucc-flow-status` 看当前 run
2. 处理阻塞信息
3. 再用 `/ucc-flow-continue`

### 场景 B：先团队调研，再自动接力进入实施

```text
/ucc-team-research 评估当前项目框架的模块划分、构建组织和测试结构，如结论明确则继续落地
```

预期自动链路：

1. `define-problem`
2. `evidence`
3. `conclusion`
4. `handoff`
5. 自动切入 `team.standard.plan`
6. 继续执行实施、审查、验证、文档同步和收尾

### 场景 C：单 agent 自动闭环

```text
/ucc-single-standard 基于当前仓库结构完成一轮自动检查、必要修改、验证和总结
```

预期自动链路：

1. `clarify`
2. `plan`
3. `implement`
4. `review`
5. `verify`
6. `summary`

### 场景 D：单 agent 先研究再自动落地

```text
/ucc-single-research 评估当前框架的模块边界、构建组织和测试缺口，并在结论明确后继续落地
```

预期自动链路：

1. `define-problem`
2. `evidence`
3. `conclusion`
4. `next-action`
5. 自动切入 `single.standard.plan`
6. 继续执行实施、审查、验证和总结

## 代理协同原则

### 自动触发

- `/ucc-team-*` 优先调用 `team-orchestrator`
- `/ucc-single-*` 与 `/ucc-flow-*` 控制命令优先调用 `workflow-orchestrator`
- 代码改动完成后自动进入 reviewer / verify 节点
- 需要同步文档时自动进入 `doc-updater`
- 构建或类型错误时自动进入对应修复链路

### 公开命令与内部 agent 的关系

对外只暴露少量显式完整入口；对内由 runtime 决定当前阶段调用哪个 agent。

这意味着用户不需要手工按阶段输入多条命令来串流程。

## 支持语言

- JavaScript
- TypeScript / Vue
- TypeScript / Node
- Golang

## 公开命令分类

### 自动化流程入口

- `/ucc-team-standard`
- `/ucc-team-strict`
- `/ucc-team-research`
- `/ucc-single-standard`
- `/ucc-single-research`

### 流程控制

- `/ucc-flow-status`
- `/ucc-flow-continue`
- `/ucc-flow-abort`

### 内部自动调度能力

构建修复、数据库审查、语言专项审查、E2E、文档生成与同步、覆盖率补齐、死代码清理和上下文切换能力继续保留，但不再作为公开 slash 命令暴露；运行时会根据当前节点和风险信号自动调度对应 agent。

当前 team workflow 仍采用单 active run 的串行主干；受控并行在 `team.standard.plan`、`team.strict.detailed-plan`、`review` 与验证节点内开启，由 `team-orchestrator` 汇总 `planner`、按需触发的 `architect`、`code-reviewer`、`security-reviewer` 与 `database-reviewer` 结果后再继续推进。运行时还会写入 `.claude/workflows/control/*.json`，让 `/ucc-flow-status` 可以展示最近阶段摘要、并行委派与验证状态。

## 安全与质量要求

- 不允许硬编码密钥
- 对外部输入做验证
- 修改后必须跑验证
- 文档与实现变更要同步
- 高风险任务优先使用 `/ucc-team-strict`

## 维护要求

如果你在维护 UCC 配置仓库，修改命令面、workflow、代理或文档后，至少执行：

```bash
node scripts/validate-config.js
node tests/run-all.js
```

如果你只是验证已部署到业务项目中的 UCC 资产，执行：

```bash
node .claude/scripts/validate-config.js
```

## 参考文档

- 已部署项目说明：`.claude/README.md`
- 源仓库使用说明：`docs/使用说明.md`
- 源仓库定制指南：`docs/配置定制指南.md`
