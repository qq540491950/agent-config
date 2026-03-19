---
description: 中止当前或指定 workflow run，并保留可审计状态记录。
context: fork
agent: workflow-orchestrator
workflowCapable: true
workflowProfile: dynamic
workflowNode: dynamic
executionMode: auto
pausePolicy: dynamic
triggerVisibility: always
---

# UCC Flow Abort 命令

中止当前 workflow run，并保留事件日志用于排障和审计。

## 用法

`/ucc-flow-abort`

或：

`/ucc-flow-abort <runId>`

## 执行要求

1. 优先中止当前 active run；如传入 runId，则中止指定 run
2. 输出最新 workflow 摘要
3. 若存在剩余风险或未交付内容，明确指出

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
