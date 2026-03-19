---
description: 统一工作流入口。根据 profile 启动或加入单模式/团队模式 workflow run，并显式显示触发链、当前节点与下一节点。
context: fork
agent: workflow-orchestrator
workflowCapable: true
workflowProfile: dynamic
workflowNode: dynamic
approvalMode: stage
triggerVisibility: always
---

# UCC Flow 命令

这是 UCC 的统一工作流总入口，用于启动或加入可恢复、可审计的 workflow run。

## 用法

`/ucc-flow <profile> <task>`

## 支持的 profile

- `single.dev`
- `single.review`
- `single.research`
- `team.standard`
- `team.fast`
- `team.strict`
- `team.review`
- `team.research`
- `team.doc`

## 执行要求

1. 使用 workflow runtime 启动或加入 run
2. 输出当前 workflow 摘要
3. 只执行当前节点对应阶段
4. 节点完成后推进 run
5. 若进入 `awaiting_approval`，停止并输出恢复命令

## 输出要求

输出中必须包含：

- `触发来源`
- `运行ID`
- `触发链`
- `当前模式`
- `当前节点`
- `下一节点`
- `审批状态`
- `恢复命令`
- `配置标识：UCC`