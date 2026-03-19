---
description: 提交前质量门禁检查——代码审查、测试覆盖率、安全漏洞、文档完整性一站式验证。
workflowCapable: true
workflowProfile: team.strict
workflowNode: quality-gate
approvalMode: stage
triggerVisibility: always
---

# Quality Gate 命令

此命令执行提交前的全面质量门禁检查，确保代码符合团队的质量标准。

## workflow 要求

- 若当前存在兼容 workflow run，优先加入当前 run 的 `quality-gate` 节点
- 若不存在活动 run，则创建 `team.strict` run 并从 `quality-gate` 节点开始
- 必须显示触发链、当前节点、下一节点和审批状态

## 命令功能

1. **代码审查** — 调用 code-reviewer 或语言专用审查代理
2. **测试检查** — 验证测试通过和覆盖率
3. **安全扫描** — 调用 security-reviewer 检查漏洞
4. **文档检查** — 确认文档是否与代码同步
5. **构建验证** — 确保项目可以成功构建

## 门禁规则

| 问题类型 | 严重 | 警告 | 建议 |
|----------|------|------|------|
| 安全漏洞 | 🚫 阻断 | ⚠️ 需处理 | ℹ️ 记录 |
| 测试失败 | 🚫 阻断 | — | — |
| 覆盖率不足 | ⚠️ 需处理 | ℹ️ 记录 | — |
| 代码规范 | ⚠️ 需处理 | ℹ️ 记录 | ℹ️ 记录 |
| 文档缺失 | ⚠️ 需处理 | ℹ️ 记录 | — |