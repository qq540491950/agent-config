---
description: 团队调研流程入口。显式启动 team.research 工作流，自动推进问题定义、证据收集、结论与落地交接。
context: fork
agent: team-orchestrator
workflowCapable: true
workflowProfile: team.research
workflowNode: define-problem
executionMode: auto
pausePolicy: balanced
triggerVisibility: always
---

# UCC Flow Team Research 命令

这是技术调研、问题定位和方案比较的显式完整入口。

## workflow 要求

- 启动时必须调用 workflow runtime 创建或加入 `team.research` run
- 默认自动推进 `define-problem -> evidence -> conclusion -> handoff`
- `handoff` 完成后默认接力到 `team.standard.plan`
- 命中 `pausePolicy: balanced` 的风险信号时暂停
- 暂停后使用 `/ucc-flow-continue [runId]`

## 调研规则

- 先理解，再下结论
- 结论必须有证据支撑
- 如建议继续落地，必须明确交接目标
- 最终输出必须包含 `配置标识：UCC`
