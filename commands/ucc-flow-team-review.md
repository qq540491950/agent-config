---
description: 团队审查流程入口。显式启动 team.review 工作流，自动推进上下文收集、发现报告、风险缺口与总结。
context: fork
agent: team-orchestrator
workflowCapable: true
workflowProfile: team.review
workflowNode: collect-context
executionMode: auto
pausePolicy: balanced
triggerVisibility: always
---

# UCC Flow Team Review 命令

这是团队代码审查的显式完整入口。

## workflow 要求

- 启动时必须调用 workflow runtime 创建或加入 `team.review` run
- 默认自动推进 `collect-context -> review -> risk-gap -> summary`
- 命中 `pausePolicy: balanced` 的风险信号时暂停
- 暂停后使用 `/ucc-flow-continue [runId]`

## 审查规则

- 以发现为主，而不是无差别改写代码
- 优先报告真正导致 Bug、安全问题或回归的问题
- 按严重程度输出发现
- 最终输出必须包含 `配置标识：UCC`
