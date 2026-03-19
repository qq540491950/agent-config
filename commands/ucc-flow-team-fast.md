---
description: 快速团队流程入口。显式启动 team.fast 工作流，以最小计划、快速实施和最小验证完成低风险改动。
context: fork
agent: team-orchestrator
workflowCapable: true
workflowProfile: team.fast
workflowNode: clarify
executionMode: auto
pausePolicy: auto
triggerVisibility: always
---

# UCC Flow Team Fast 命令

这是面向小改动和低风险修复的团队入口。

## workflow 要求

- 启动时必须调用 workflow runtime 创建或加入 `team.fast` run
- 默认自动推进后续节点
- 仅在命中 `pausePolicy: auto` 的关键失败或危险信号时暂停
- 暂停后使用 `/ucc-flow-continue [runId]`

## 固定流程

1. `当前阶段：快速澄清`
2. `当前阶段：最小计划`
3. `当前阶段：实施`
4. `当前阶段：最小验证`
5. `当前阶段：变更说明`

## 完成条件

- 修改边界明确
- 最小实现已落地
- 最小验证已完成或阻塞已记录
- 最终输出必须包含 `配置标识：UCC`
