---
description: 严格团队交付流程入口。强制执行风险分析、详细计划、验证、文档同步与质量门禁。
context: fork
agent: team-orchestrator
workflowCapable: true
workflowProfile: team.strict
workflowNode: clarify
approvalMode: stage
triggerVisibility: always
---

# UCC Team Strict 命令

这是用于高风险变更、核心模块开发和多人协作任务的严格流程入口。

## 使用场景

- 核心业务逻辑修改
- 架构调整
- 权限、认证、安全相关改动
- 需要完整交付物和门禁的任务

## workflow 要求

- 启动时必须调用 workflow runtime 创建或加入 `team.strict` run
- 必须显示触发链、当前节点、下一节点和审批状态
- 每完成一个阶段后默认进入 `awaiting_approval`

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

## 严格模式规则

- 必须补充关键风险和约束
- 必须给出详细计划
- 必须完成审查和完整验证，或明确记录阻塞
- 必须同步相关文档
- 必须在结尾给出剩余风险和后续建议

## 推荐编排

- 规划：`planner`
- 实施：`tdd-guide`
- 审查：`code-reviewer`、语言专用 reviewer、`security-reviewer`
- 验证：`/ucc-verify`、`/ucc-quality-gate`
- 文档：`doc-updater`、`/ucc-design-doc`、`/ucc-delivery-doc`

## 完成条件

- 风险、范围和依赖已明确
- 已执行详细计划
- 已完成至少一轮完整验证
- 已同步相关文档和质量门禁结论
- 最终输出必须包含：
  - `流程完成：UCC Team Workflow`
  - `配置标识：UCC`