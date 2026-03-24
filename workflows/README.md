# UCC Workflow Runtime

本目录承担两类职责：

- `definitions.json`：公开 flow 命令对应的 workflow 定义
- 运行时状态根目录：项目部署后会在这里创建 `runs/`、`events/`、`control/`、`locks/` 和 `active.json`

## 目标

让 `/ucc-team-*` 与 `/ucc-single-*` 共享同一套运行时能力：

- 显式命令启动
- 自动推进节点
- 在风险、失败或冲突时暂停
- 通过 `/ucc-flow-continue` 统一恢复
- 记录触发链、当前节点、下一节点、暂停状态
- 通过 `control/*.json` 暴露最近阶段摘要、并行委派状态、验证状态和阻塞信息
- 公开 slash 入口固定为 6 个自动化入口与 3 个控制命令，其余能力由内部 agent 承担

## 默认约束

- 默认状态目录：`.claude/workflows/`
- 默认仅允许一个 active run
- 默认执行模式：`auto`
- 根据 profile 自动应用 `pausePolicy`
- `team.parallel` 通过 `integrate` 节点统一收口；若并行实施或集成阶段阻塞，推荐回退到 `team.standard.implement`
- `team.research` 的 `handoff` 会自动切入 `team.standard.plan`
- `single.research` 的 `next-action` 会自动切入 `single.standard.plan`

## 版本控制建议

`.claude/workflows/` 下同时包含静态定义和运行态状态：

- 静态定义：`definitions.json`、README
- 运行态状态：`runs/`、`events/`、`control/`、`locks/`、`active.json`

部署到业务项目时，建议忽略运行态状态，但不要忽略整个 `.claude/workflows/` 目录。推荐规则：

```gitignore
.claude/workflows/runs/
.claude/workflows/events/
.claude/workflows/control/
.claude/workflows/locks/
.claude/workflows/active.json
```

忽略版本控制不会影响 `/ucc-flow-continue`，因为文件仍然保留在工作区。真正会影响恢复的是手工删除 `active.json` 或当前 run 对应的 `runs/<runId>.json`。

## 脚本入口

```bash
node .claude/scripts/workflow/runner.js start --command /ucc-team-standard
node .claude/scripts/workflow/runner.js start --command /ucc-single-standard
node .claude/scripts/workflow/runner.js advance --run <runId> --result passed
node .claude/scripts/workflow/runner.js delegate --run <runId> --delegate plan-primary --status running
node .claude/scripts/workflow/runner.js verification --run <runId> --name tsc --status passed
node .claude/scripts/workflow/runner.js continue --run <runId>
node .claude/scripts/workflow/runner.js resume --run <runId>
node .claude/scripts/workflow/runner.js status
node .claude/scripts/workflow/runner.js watch --run <runId>
node .claude/scripts/workflow/runner.js abort --run <runId>
```

## 命令语义

- `start`：按公开命令解析 profile 并创建 run
- `advance`：推进当前节点，并根据 `pausePolicy` 决定继续还是暂停
- `delegate`：更新当前节点内某个并行委派的状态、摘要与信号
- `verification`：更新当前节点内某个验证项的状态、来源与摘要
- `continue`：继续一个 `paused` run
- `resume`：`continue` 的兼容别名
- `status`：查看当前或指定 run 的最新摘要，优先展示当前节点对应的 control plane；如果当前节点还没有 verification 记录，则明确显示 `当前节点尚未开始验证`
- `watch`：内部运维观察入口，持续渲染当前或指定 run 的 live status panel；它是对现有 runtime 控制面的只读观察，不新增任何公开 `/ucc-*` 命令
- `abort`：中止当前或指定 run

## Live Status Panel

`watch` 是一个内部 CLI 观察入口，用来持续渲染当前 run 的：

- 当前节点与下一节点
- 最近阶段摘要
- 当前节点的 delegate 状态
- 当前节点的 verification 状态
- 当前阻塞原因

约束与非目标：

- 它不是 Claude Code 原生 plan mode，也不尝试复制原生 TUI
- 它不改变 single-root-run 设计，默认仍只维护一个 active run
- 它只读取 `.claude/workflows/runs/`、`events/` 与 `control/` 中的现有状态
- 它优先读取 `control/<runId>.json`；若快照缺失，则回退到 `runs/<runId>.json`
- 这一层只是 operator aid，不代表已经切换到真实 subagent 编排
- 渲染格式刻意保持与后续真实 subagent 字段兼容，例如 `subagentId`、`ownedPaths`、`readonlyPaths`
