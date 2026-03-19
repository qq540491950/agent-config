---
description: 对当前代码库状态运行全面验证。
workflowCapable: true
workflowProfile: single.dev
workflowNode: verify
approvalMode: stage
triggerVisibility: always
---

# Verify 命令

对当前代码库状态运行全面验证。

## workflow 要求

- 若当前存在兼容 workflow run，优先加入当前 run 的 `verify` 节点
- 若不存在活动 run，则创建 `single.dev` run 并从 `verify` 节点开始
- 必须显示触发链、当前节点、下一节点和审批状态

## 指令

按以下确切顺序执行验证：

1. **构建检查**
2. **类型检查**
3. **代码检查**
4. **测试套件**
5. **Console.log 审计**
6. **Git 状态**

## 输出

生成简洁的验证报告：

```text
验证结果: [通过/失败]

构建:    [OK/失败]
类型:    [OK/X 错误]
检查:    [OK/X 问题]
测试:    [X/Y 通过, Z% 覆盖率]
密钥:    [OK/发现 X 个]
日志:    [OK/X 个 console.logs]

可提交 PR: [是/否]
```

## 参数

$ARGUMENTS 可以是：
- `quick` - 仅构建 + 类型
- `full` - 所有检查（默认）
- `pre-commit` - 与提交相关的检查
- `pre-pr` - 完整检查加安全扫描