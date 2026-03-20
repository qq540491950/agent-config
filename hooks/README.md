# 轻量 Hooks（可选启用）

本目录提供最小可用 hooks：

本文只解释 hooks 的启用方式和运行约束；Hook 设计原则请看 `rules/common/hooks.md`。

- `PreToolUse`：阻断明显高风险的删除/格式化命令
- `PreToolUse`：写入前检测常见敏感信息模式（提醒）
- `PostToolUse`：写入后自动执行 TS / Go 基础检查
- `Stop`：每次响应后输出 workflow 摘要并提醒进行交付检查

## 文件

- `hooks/hooks.json`：可直接复用的轻量 hooks 配置
- `scripts/hooks/pretool-risk-blocker.js`：阻断高风险删除/格式化命令
- `scripts/hooks/pretool-sensitive-write-check.js`：写入前敏感信息提醒
- `scripts/hooks/posttool-ts-check.js`：写入 TS / TSX / Vue 文件后的类型与 ESLint 检查
- `scripts/hooks/posttool-go-check.js`：写入 Go 文件后的 `go vet` / `gofmt` 检查
- `scripts/hooks/stop-delivery-reminder.js`：结束阶段输出 workflow 摘要和交付提醒
- `scripts/hooks/run-with-flags.js`：运行时控制封装器
- `scripts/lib/hook-flags.js`：Hook 运行时控制解析

## 启用方式

`scripts/copy-config.js` 默认不会启用 hooks，也不会默认生成任何 settings 文件。推荐按以下方式显式选择：

- 默认运行脚本后通过向导选择 hooks 与 MCP：`node scripts/copy-config.js <target>`
- 项目共享 hooks：`node scripts/copy-config.js <target> --hooks project`
- 个人本地 hooks：`node scripts/copy-config.js <target> --hooks local`
- 兼容旧布局：`node scripts/copy-config.js <target> --legacy-layout`

如果只想手动启用最小 Hook 集，也可以将 `hooks/hooks.json` 中的 `hooks` 字段合并到你的 `.claude/settings.json` 或 `.claude/settings.local.json`，并确保上述 `scripts/hooks/*.js` 也一并复制到项目中：

```json
{
  "hooks": {
    "PreToolUse": [],
    "PostToolUse": [],
    "Stop": []
  }
}
```

> 说明：本仓库默认不强制启用 hooks，按需显式开启，保持“精简可用”。

## 运行时控制（可选）

可通过环境变量在运行时控制 hooks：

- `ECC_HOOK_PROFILE=minimal|standard|strict`（默认 `standard`）
- `ECC_DISABLED_HOOKS=hook-id,hook-id`（逗号分隔）

内置 hook ID：
- `pre:cmd:risk-blocker`
- `pre:write:sensitive-check`
- `post:write:ts-check`
- `post:write:go-check`
- `stop:delivery-reminder`

示例：

```bash
# 只在 strict 模式下启用 hooks
export ECC_HOOK_PROFILE=strict

# 关闭交付提醒
export ECC_DISABLED_HOOKS=stop:delivery-reminder
```

## 行为说明

- 阻断通过 `exit code 2` 实现（仅 PreToolUse 生效）
- 提醒为非阻断输出（stderr）
- `PostToolUse` 用于写入后自动补做语言级检查，但不替代完整验证流程
- 所有 hook 命令都应通过 `$CLAUDE_PROJECT_DIR/.claude/scripts/...` 引用项目内脚本，避免依赖当前工作目录
- 使用 Node.js 脚本，兼容 Windows / macOS / Linux
- 团队模式可结合 `/ucc-team-standard`、`/ucc-team-strict` 与 `/ucc-flow-continue` 形成更完整交付门禁
