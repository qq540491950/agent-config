---
description: 团队调研入口。按问题定义、证据收集、结论和后续动作的流程输出研究结果，并将后续动作接力到标准团队流程。
context: fork
agent: team-orchestrator
workflowCapable: true
workflowProfile: team.research
workflowNode: define-problem
approvalMode: stage
triggerVisibility: always
---

# UCC Team Research 命令

这是用于技术调研、问题定位和方案比较的显式入口。

## workflow 要求

- 启动时必须调用 workflow runtime 创建或加入 `team.research` run
- 必须显示触发链、当前节点、下一节点和审批状态
- `handoff` 节点完成后，下一节点必须指向 `team.standard.plan`
- 每完成一个阶段后默认进入 `awaiting_approval`

## 固定流程

1. `当前阶段：问题定义`
2. `当前阶段：证据收集`
3. `当前阶段：结论`
4. `当前阶段：后续动作`

## 研究规则

- 先理解，再下结论
- 结论必须由观察或证据支持
- 若需要落地实施，必须给出 handoff，并将下一步转入 `/ucc-team` 或 `/ucc-team-strict` 对应流程

## 完成条件

- 问题陈述清晰
- 结论有证据支撑
- 关键不确定性已列出
- 最终输出必须包含 `配置标识：UCC`