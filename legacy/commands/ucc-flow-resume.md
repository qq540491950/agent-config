---
description: 恢复处于 awaiting_approval 的 workflow run，并继续执行当前节点。
context: fork
agent: workflow-orchestrator
workflowCapable: true
workflowProfile: dynamic
workflowNode: dynamic
approvalMode: stage
triggerVisibility: always
---

# UCC Flow Resume 命令

恢复一个等待阶段确认的 workflow run。

## 用法

`/ucc-flow-resume <runId>`

## 执行要求

1. 调用 workflow runtime 将 run 从 `awaiting_approval` 切回 `running`
2. 展示最新 workflow 摘要
3. 仅执行当前节点
4. 阶段完成后继续推进 run

## 输出要求

必须输出：

- `触发来源`
- `运行ID`
- `触发链`
- `当前模式`
- `当前节点`
- `下一节点`
- `审批状态`
- `恢复命令`
- `配置标识：UCC`