# 代理协调规则

> 此文件定义代理使用规范和协调策略，适用于所有语言的代理调用。

## 代理选择原则

### 1. 按任务类型选择

| 任务类型 | 首选代理 | 备选代理 |
|---------|---------|---------|
| 显式团队交付流程 | `team-orchestrator` | `planner` |
| 复杂功能规划 | `planner` | - |
| 新功能开发 | `tdd-guide` | `planner` |
| 代码审查 | `code-reviewer` | 语言专用 reviewer |
| 安全审计 | `security-reviewer` | `code-reviewer` |
| 构建错误修复 | `build-error-resolver` | - |
| 文档更新 | `doc-updater` | - |
| E2E 测试 | `e2e-runner` | - |
| Go 代码审查 | `go-reviewer` | `code-reviewer` |
| JavaScript/TypeScript 审查 | `javascript-reviewer` | `code-reviewer` |
| TypeScript 前端审查 | `typescript-reviewer` | `code-reviewer` |
| TypeScript 后端审查 | `typescript-backend-reviewer` | `code-reviewer` |

### 2. 代理触发时机

**主动触发（无需用户请求）：**

- 使用 `/ucc-team*` → 优先调用 `team-orchestrator`
- 代码编写完成 → 立即调用 `code-reviewer`
- 安全敏感代码 → 立即调用 `security-reviewer`
- 构建或类型检查失败 → 立即调用 `build-error-resolver`
- 接口/命令/规则调整后 → 立即调用 `doc-updater`

**按需触发（用户请求）：**

- 复杂功能需求 → 调用 `planner`
- TDD 开发流程 → 调用 `tdd-guide`
- E2E 测试执行 → 调用 `e2e-runner`
- 显式团队入口 `/ucc-team*` → 调用 `team-orchestrator`

## 并行执行策略

当前实现采用“串行主干 + 节点内并行审查”的最小策略：root workflow 仍按阶段顺序推进，并行能力只在明确声明的内部节点中开启。

### 可并行的操作

以下操作可同时进行，无需等待：

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   代码审查       │  │   安全审查       │  │   文档更新       │
│ code-reviewer   │  │security-reviewer│  │  doc-updater    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
                      汇总结果
```

### 必须串行的操作

以下操作有依赖关系，必须顺序执行：

```
team-orchestrator → planner → tdd-guide → 实现 → team-orchestrator(review fan-out) → 修复 → 验证
```

## 代理输出规范

### 1. 审查类代理输出格式

```markdown
## 审查结果

### 严重问题 (Critical)
- [ ] 问题描述 + 文件位置 + 修复建议

### 重要问题 (High)
- [ ] 问题描述 + 文件位置 + 修复建议

### 一般问题 (Medium)
- [ ] 问题描述 + 文件位置 + 修复建议

### 建议改进 (Low)
- 描述 + 建议
```

### 2. 规划类代理输出格式

```markdown
## 实施计划

### 目标
- 明确的目标描述

### 阶段划分
1. 阶段一：描述 + 预期产物
2. 阶段二：描述 + 预期产物

### 关键决策
- 决策点 + 理由

### 风险与缓解
- 风险点 + 缓解措施
```

## 代理协作模式

### 模式 1：审查链

```
代码变更 → code-reviewer → security-reviewer → 输出
```

适用于：安全敏感功能、认证授权相关代码

### 模式 2：修复链

```
构建失败 → build-error-resolver → 验证 → 通过
                                    ↓ 失败
                               循环修复
```

适用于：类型错误、构建失败

### 模式 3：并行审查

```
           ┌→ code-reviewer ────┐
代码变更 ──┤                     ├──→ 汇总报告
           └→ security-reviewer─┘
```

适用于：常规代码变更
仅限 workflow 明确声明支持并行委派的节点，例如 `team.standard.review` 与 `team.strict.review`

## 代理调用检查清单

调用代理前确认：

- [ ] 任务范围明确
- [ ] 输入信息完整
- [ ] 选择了正确的代理类型
- [ ] 确认是否需要并行调用多个代理

调用代理后确认：

- [ ] 结果已汇总
- [ ] 问题已分类（Critical/High/Medium/Low）
- [ ] 后续行动已明确
