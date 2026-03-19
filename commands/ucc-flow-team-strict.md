---
description: 严格团队交付流程入口。显式启动 team.strict 工作流，并自动推进风险分析、详细计划、完整验证、质量门禁与收尾。
context: fork
agent: team-orchestrator
workflowCapable: true
workflowProfile: team.strict
workflowNode: clarify
executionMode: auto
pausePolicy: strict
triggerVisibility: always
---

# UCC Flow Team Strict 命令

这是用于生产核心链路、高风险改动和多人协作的严格入口。

## workflow 要求

- 启动时必须调用 workflow runtime 创建或加入 `team.strict` run
- 默认自动推进后续节点
- 命中 `pausePolicy: strict` 的任一高风险信号时必须暂停
- 暂停后使用 `/ucc-flow-continue [runId]`

## 固定流程

1. `当前阶段：需求澄清`
2. `当前阶段：风险分析`
3. `当前阶段：详细计划`
4. `当前阶段：实施`
5. `当前阶段：审查`
6. `当前阶段：完整验证`
7. `当前阶段：文档同步`
8. `当前阶段：质量门禁`
9. `当前阶段：交付总结`

## 完成条件

- 风险、范围与依赖已明确
- 已完成完整验证和质量门禁
- 已同步文档并说明剩余风险
- 最终输出必须包含：
  - `流程完成：UCC Team Workflow`
  - `配置标识：UCC`
