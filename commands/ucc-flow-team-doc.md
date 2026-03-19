---
description: 团队文档流程入口。显式启动 team.doc 工作流，自动推进文档类型确认、上下文收集、生成与一致性校对。
context: fork
agent: team-orchestrator
workflowCapable: true
workflowProfile: team.doc
workflowNode: doc-type
executionMode: auto
pausePolicy: balanced
triggerVisibility: always
---

# UCC Flow Team Doc 命令

这是设计文档、交付文档和变更说明的显式完整入口。

## workflow 要求

- 启动时必须调用 workflow runtime 创建或加入 `team.doc` run
- 默认自动推进 `doc-type -> context -> generate -> consistency-check`
- 命中 `pausePolicy: balanced` 的风险信号时暂停
- 暂停后使用 `/ucc-flow-continue [runId]`

## 文档规则

- 明确目标读者和文档类型
- 保持与代码或计划一致
- 若上下文不足，先说明缺失信息
- 最终输出必须包含 `配置标识：UCC`
