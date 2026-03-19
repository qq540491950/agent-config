---
description: 重述需求、评估风险并创建分步实现计划。在修改任何代码前等待用户确认。
context: fork
agent: planner
workflowCapable: true
workflowProfile: single.dev
workflowNode: plan
approvalMode: stage
triggerVisibility: always
---

# Plan 命令

此命令调用 **planner** 代理，在编写任何代码前创建全面的实现计划。

## workflow 要求

- 若当前存在兼容 workflow run，优先加入当前 run 的 `plan` 节点
- 若不存在活动 run，则创建 `single.dev` run 并从 `plan` 节点开始
- 必须显示触发链、当前节点、下一节点和审批状态

## 命令功能

1. **重述需求** - 澄清需要构建什么
2. **识别风险** - 发现潜在问题和阻碍
3. **创建步骤计划** - 将实现分解为阶段
4. **等待确认** - 必须收到用户批准才能继续

## 何时使用

以下情况使用 `/ucc-plan`：
- 开始新功能
- 进行重大架构变更
- 复杂重构
- 多个文件/组件受影响
- 需求不清晰或模糊

## 重要说明

**关键**：planner 代理不会编写任何代码，直到你明确确认计划（回复 `yes` 或 `proceed` 或类似的肯定响应）。

## 与其他命令集成

规划后：
- 使用 `/ucc-tdd` 进行测试驱动开发实现
- 如遇构建错误使用 `/ucc-build-fix`
- 完成实现后使用 `/ucc-code-review` 审查

## 相关代理

此命令调用 `planner` 代理，位于：
`agents/planner.md`