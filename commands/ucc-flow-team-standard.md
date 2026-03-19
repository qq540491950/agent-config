---
description: 标准团队交付流程入口。显式启动完整 team.standard 工作流，并默认自动推进澄清、计划、实施、审查、验证、文档同步与收尾。
context: fork
agent: team-orchestrator
workflowCapable: true
workflowProfile: team.standard
workflowNode: clarify
executionMode: auto
pausePolicy: balanced
triggerVisibility: always
---

# UCC Flow Team Standard 命令

这是推荐的团队默认入口，适用于已有项目框架上的常规功能开发、重构和缺陷修复。

## workflow 要求

- 启动时必须调用 workflow runtime 创建或加入 `team.standard` run
- 默认自动推进后续节点，不要求用户逐阶段手动串命令
- 仅在命中 `pausePolicy: balanced`、发生冲突、危险改动或执行失败时暂停
- 暂停后使用 `/ucc-flow-continue [runId]`

## 固定流程

1. `当前阶段：需求澄清`
2. `当前阶段：实现计划`
3. `当前阶段：实施`
4. `当前阶段：审查`
5. `当前阶段：验证`
6. `当前阶段：文档同步`
7. `当前阶段：交付总结`

## 完成条件

- 已明确目标、范围与风险
- 已完成一轮实施、审查和验证
- 已同步必要文档或说明无需更新
- 最终输出必须包含：
  - `流程完成：UCC Team Workflow`
  - `配置标识：UCC`
