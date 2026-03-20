# Hook 配置规则

> 此文件定义 UCC 当前采用的 Claude Code Hook 模型，以及与仓库实现保持一致的使用约束。

本文只定义 Hook 设计原则与边界，不重复部署命令或安装步骤；实际启用方式请看 `hooks/README.md`。

## 当前生效的 Hook 事件

UCC 当前以 Claude Code 的工具生命周期 Hook 为准，实际使用以下 3 类事件：

### 1. `PreToolUse`

**触发时机：** 工具执行前。

**当前用途：**

- 阻断明显高风险的删除 / 格式化命令
- 在写入前检测常见敏感信息模式并提醒

**适用原则：**

- 适合做轻量、快速、可确定的前置检查
- 需要阻断时应返回非零退出码
- 不要在这里执行耗时很长的完整构建或全量测试

### 2. `PostToolUse`

**触发时机：** 工具执行后。

**当前用途：**

- 写入 `TS` / `TSX` / `Vue` 文件后执行类型与 ESLint 检查
- 写入 `.go` 文件后执行 `go vet` / `gofmt` 检查

**适用原则：**

- 适合做写入后的快速语言级反馈
- 用于尽早发现明显错误，不替代完整验证流程
- 输出应以提醒和快速失败信号为主，不应掩盖原始工具结果

### 3. `Stop`

**触发时机：** 每次响应结束时。

**当前用途：**

- 输出 workflow 摘要
- 提醒执行最小交付检查

**适用原则：**

- 用于收尾提醒和状态展示
- 不要在这里做会改变仓库状态的自动写入
- 不要把 `Stop` 当成完整验证或发布步骤

## 当前仓库中的 Hook 实现映射

当前实现以以下文件为准：

- `hooks/hooks.json`
- `scripts/hooks/pretool-risk-blocker.js`
- `scripts/hooks/pretool-sensitive-write-check.js`
- `scripts/hooks/posttool-ts-check.js`
- `scripts/hooks/posttool-go-check.js`
- `scripts/hooks/stop-delivery-reminder.js`
- `scripts/hooks/run-with-flags.js`
- `scripts/lib/hook-flags.js`

如果规则说明与上述实现不一致，应优先修正文档而不是假定实现仍然有效。

## 设计约束

- Hook 应保持“轻量、确定、可快速执行”
- 影响生产风险的阻断逻辑优先放在 `PreToolUse`
- 语言级快速反馈优先放在 `PostToolUse`
- 交付提醒和状态摘要放在 `Stop`
- 完整构建、全量测试、人工验收仍由 workflow 验证阶段承担

## 与 workflow 的关系

Hook 只是运行时护栏，不是 workflow 的替代品。

- `single` / `team` workflow 负责阶段推进、暂停、恢复和交付闭环
- Hook 负责在工具调用前后提供快速风险控制与反馈
- 不应通过新增旧式阶段命令来替代现有 Hook 或 workflow

## 可选补充：Git Hook

如果团队还需要 `pre-commit`、`pre-push`、`commit-msg` 等 Git Hook，可作为仓库层的补充机制单独维护；但它们**不是**当前 UCC 配置仓库默认采用的 Hook 模型。

换句话说：

- 当前 UCC 默认模型：`PreToolUse` / `PostToolUse` / `Stop`
- Git Hook：可选补充，不应写成当前默认实现
