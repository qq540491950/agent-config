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
- 公开 slash 入口固定为 5 个自动化入口与 3 个控制命令，其余能力由内部 agent 承担

## 默认约束

- 默认状态目录：`.claude/workflows/`
- 默认仅允许一个 active run
- 默认执行模式：`auto`
- 根据 profile 自动应用 `pausePolicy`
- `team.research` 的 `handoff` 会自动切入 `team.standard.plan`
- `single.research` 的 `next-action` 会自动切入 `single.standard.plan`

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
node .claude/scripts/workflow/runner.js abort --run <runId>
```

## 命令语义

- `start`：按公开命令解析 profile 并创建 run
- `advance`：推进当前节点，并根据 `pausePolicy` 决定继续还是暂停
- `delegate`：更新当前节点内某个并行委派的状态、摘要与信号
- `verification`：更新当前节点内某个验证项的状态、来源与摘要
- `continue`：继续一个 `paused` run
- `resume`：`continue` 的兼容别名
- `status`：查看当前或指定 run 的最新摘要，优先展示 control plane
- `abort`：中止当前或指定 run
