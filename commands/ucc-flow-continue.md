---
description: 继续当前或指定的 paused workflow run，并从当前节点继续自动推进。
context: fork
agent: workflow-orchestrator
workflowCapable: true
workflowProfile: dynamic
workflowNode: dynamic
executionMode: auto
pausePolicy: dynamic
triggerVisibility: always
---

# UCC Flow Continue 命令

继续一个处于 `paused` 状态的 workflow run。

## 用法

`/ucc-flow-continue`

或：

`/ucc-flow-continue <runId>`

## 执行要求

1. 优先恢复当前 active run；如传入 runId，则恢复指定 run
2. 将 run 从 `paused` 切回 `running`
3. 展示最新 workflow 摘要
4. 从当前节点继续自动推进，直到再次命中暂停条件或流程结束

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
- `配置标识：UCC`
