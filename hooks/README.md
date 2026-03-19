# 轻量 Hooks（可选启用）

本目录提供最小可用 hooks：

- `PreToolUse`：阻断明显高风险的删除/格式化命令
- `PreToolUse`：写入前检测常见敏感信息模式（提醒）
- `Stop`：每次响应后输出 workflow 摘要并提醒进行交付检查

## 文件

- `hooks/hooks.json`：可直接复用的轻量 hooks 配置
- `scripts/hooks/pretool-risk-blocker.js`：阻断高风险删除/格式化命令
- `scripts/hooks/pretool-sensitive-write-check.js`：写入前敏感信息提醒
- `scripts/hooks/stop-delivery-reminder.js`：结束阶段输出 workflow 摘要和交付提醒
- `scripts/hooks/run-with-flags.js`：运行时控制封装器
- `scripts/lib/hook-flags.js`：Hook 运行时控制解析

## 启用方式

项目级部署时，推荐直接使用 `hooks/project-settings.json` 作为项目内 `.claude/settings.json`。`scripts/copy-config.js` 已默认执行这一步。

如果只想启用最小 Hook 集，也可以将 `hooks/hooks.json` 中的 `hooks` 字段手动合并到你的 `.claude/settings.json`，并确保上述 `scripts/hooks/*.js` 也一并复制到项目中：

```json
{
  "hooks": {
    "PreToolUse": [],
    "Stop": []
  }
}
```

> 说明：本仓库默认不强制启用 hooks，按需手动开启，保持“精简可用”。

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
- 使用 Node.js 脚本，兼容 Windows / macOS / Linux
- 团队模式可结合 `/ucc-flow-team-standard`、`/ucc-flow-team-doc` 与 `/ucc-e2e` 形成更完整交付门禁
