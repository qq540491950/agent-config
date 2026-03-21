---
description: 查看当前或指定 workflow run 的状态，包括触发链、当前节点、下一节点、执行模式与暂停策略。
context: fork
agent: workflow-orchestrator
workflowCapable: true
workflowProfile: dynamic
workflowNode: dynamic
executionMode: auto
pausePolicy: dynamic
triggerVisibility: always
---

# UCC Flow Status 命令

查看当前 active run 或指定 runId 的 workflow 状态。若存在 control plane 快照，则优先展示最近阶段摘要、并行委派状态、验证状态与阻塞原因。

## 用法

`/ucc-flow-status`

或：

`/ucc-flow-status <runId>`

## 输出要求

必须输出：

- `触发来源`
- `运行ID`
- `触发链`
- `当前模式`
- `当前节点`
- `下一节点`
- `执行模式`
- `暂停策略`
- `暂停状态`
- `继续命令`
- `最近阶段摘要`
- `并行委派`
- `验证状态`
- `配置标识：UCC`
