---
description: 单人开发闭环入口。显式启动 single.standard 工作流，自动推进澄清、计划、实施、审查、验证与收尾。
context: fork
agent: workflow-orchestrator
workflowCapable: true
workflowProfile: single.standard
workflowNode: clarify
executionMode: auto
pausePolicy: auto
triggerVisibility: always
---

# UCC Single Standard 命令

这是单人开发、重构和修复任务的显式完整入口。

## workflow 要求

- 启动时必须调用 workflow runtime 创建或加入 `single.standard` run
- 默认自动推进 `clarify -> plan -> implement -> review -> verify -> summary`
- 仅在关键失败、危险改动或执行异常时暂停
- 暂停后使用 `/ucc-flow-continue [runId]`

## 完成条件

- 已形成最小可执行计划
- 已完成实现、审查和验证
- 已输出交付总结与剩余风险
- 最终输出必须包含 `配置标识：UCC`
