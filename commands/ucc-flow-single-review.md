---
description: 单人审查闭环入口。显式启动 single.review 工作流，自动推进上下文收集、审查与总结。
context: fork
agent: workflow-orchestrator
workflowCapable: true
workflowProfile: single.review
workflowNode: collect-context
executionMode: auto
pausePolicy: balanced
triggerVisibility: always
---

# UCC Flow Single Review 命令

这是单人代码审查的显式完整入口。

## workflow 要求

- 启动时必须调用 workflow runtime 创建或加入 `single.review` run
- 默认自动推进 `collect-context -> review -> summary`
- 命中 `pausePolicy: balanced` 的风险信号时暂停
- 暂停后使用 `/ucc-flow-continue [runId]`

## 审查规则

- Findings 按严重程度排序
- 明确剩余风险和后续建议
- 最终输出必须包含 `配置标识：UCC`
