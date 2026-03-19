---
description: 全面的安全和质量审查未提交的更改。
workflowCapable: true
workflowProfile: single.review
workflowNode: review
approvalMode: stage
triggerVisibility: always
---

# Code Review 命令

对未提交的更改进行全面的安全和质量审查。

## workflow 要求

- 若当前存在兼容 workflow run，优先加入当前 run 的 `review` 节点
- 若不存在活动 run，则创建 `single.review` run 并从 `review` 节点开始
- 必须显示触发链、当前节点、下一节点和审批状态

## 审查步骤

1. 获取变更文件：`git diff --name-only HEAD`
2. 对每个变更文件检查安全问题、代码质量和最佳实践问题
3. 生成按严重程度排序的报告
4. 如发现关键或高优先级问题则阻止提交

## 审查输出格式

```text
[严重程度] 问题标题
文件: path/to/file.ts:42
问题: 描述
修复: 如何修改
```

## 批准标准

| 状态 | 条件 |
|--------|-----------|
| ✅ 批准 | 无关键或高优先级问题 |
| ⚠️ 警告 | 仅有中优先级问题（可谨慎合并） |
| ❌ 阻止 | 发现关键或高优先级问题 |
