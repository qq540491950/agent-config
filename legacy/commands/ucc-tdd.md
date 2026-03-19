---
description: 强制测试驱动开发工作流。先搭建接口、生成测试，再实现最小代码通过测试。确保 80%+ 覆盖率。
context: fork
agent: tdd-guide
workflowCapable: true
workflowProfile: single.dev
workflowNode: implement
approvalMode: stage
triggerVisibility: always
---

# TDD 命令

此命令调用 **tdd-guide** 代理，强制执行测试驱动开发方法论。

## workflow 要求

- 若当前存在兼容 workflow run，优先加入当前 run 的 `implement` 节点
- 若不存在活动 run，则创建 `single.dev` run 并从 `implement` 节点开始
- 必须显示触发链、当前节点、下一节点和审批状态

## 命令功能

1. **搭建接口** - 先定义类型/接口
2. **先生成测试** - 编写失败的测试（红）
3. **实现最小代码** - 只写足够通过的代码（绿）
4. **重构** - 改进代码同时保持测试通过（重构）
5. **验证覆盖率** - 确保 80%+ 测试覆盖率

## TDD 循环

`红 -> 绿 -> 重构 -> 重复`

## 重要说明

**强制**：测试必须在实现之前编写。永不跳过红阶段。永不先写代码再写测试。

## 与其他命令集成

- 先用 `/ucc-plan` 了解要构建什么
- 用 `/ucc-tdd` 带测试实现
- 如遇构建错误用 `/ucc-build-fix`
- 实现完成后用 `/ucc-code-review` 审查
- 用 `/ucc-test-coverage` 验证覆盖率

## 相关代理

此命令调用 `tdd-guide` 代理，位于：
`agents/tdd-guide.md`