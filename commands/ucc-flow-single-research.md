---
description: 单人调研闭环入口。显式启动 single.research 工作流，自动推进问题定义、证据收集、结论与后续动作。
context: fork
agent: workflow-orchestrator
workflowCapable: true
workflowProfile: single.research
workflowNode: define-problem
executionMode: auto
pausePolicy: balanced
triggerVisibility: always
---

# UCC Flow Single Research 命令

这是单人调研、方案比较和问题定位的显式完整入口。

## workflow 要求

- 启动时必须调用 workflow runtime 创建或加入 `single.research` run
- 默认自动推进 `define-problem -> evidence -> conclusion -> next-action`
- 命中 `pausePolicy: balanced` 的风险信号时暂停
- 暂停后使用 `/ucc-flow-continue [runId]`

## 调研规则

- 结论必须由证据支持
- 后续动作要足够可执行
- 最终输出必须包含 `配置标识：UCC`
