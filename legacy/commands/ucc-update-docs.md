---
description: 根据当前代码与配置变更同步更新文档，保持文档与实现一致。
context: fork
agent: doc-updater
workflowCapable: true
workflowProfile: team.standard
workflowNode: docs
approvalMode: stage
triggerVisibility: always
---

# Update Docs 命令

调用 **doc-updater** 代理，执行文档一致性更新。

## workflow 要求

- 若当前存在兼容 workflow run，优先加入当前 run 的 `docs` 节点
- 若不存在活动 run，则创建 `team.standard` run 并从 `docs` 节点开始
- 必须显示触发链、当前节点、下一节点和审批状态

## 指令

按以下顺序执行：

1. 识别本次变更影响的文档范围
2. 更新 README/使用说明中的命令、代理、规则、技能引用
3. 校验文档中路径和能力描述是否真实存在
4. 输出文档同步报告

## 输出

```text
文档同步状态: [成功/失败]
更新文件:
- README.md
- path/to/file.md

对齐项:
- 命令/代理/规则/技能
- 工作流程
- 验收标准

待人工确认:
- [如有]
```

## 参数

$ARGUMENTS 可选：

- `quick` - 仅更新 README 与核心说明
- `full` - 更新全部受影响文档（默认）

## 约束

- 不创建与当前改动无关的新文档
- 不写入未实现能力