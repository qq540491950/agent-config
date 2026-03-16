---
description: 审计当前 Agent Harness 配置，快速检查结构、hooks、命令一致性与兼容性问题。
---

# Harness Audit

审计当前仓库的 Agent Harness 配置，输出简洁的检查报告与修复建议。

## 命令功能

1. 检查目录结构与关键文件是否完整
2. 审计 hooks 是否可靠、是否支持运行时控制
3. 校验命令命名与格式一致性
4. 标出可能的配置或兼容性问题

## 何时使用

- 怀疑配置失效或行为异常
- 刚同步或升级配置后
- 演示或冲刺前快速体检

## 执行步骤

1. **目录结构检查**：验证 `agents/`、`commands/`、`skills/`、`hooks/`、`rules/` 目录存在；统计各目录文件数，与 CLAUDE.md 声明数量对比
2. **命令-代理绑定检查**：扫描所有 `commands/*.md` 的 `agent:` frontmatter；确认每个引用的 agent 在 `agents/` 中有对应文件；列出孤立引用
3. **Hooks 完整性检查**：读取 `hooks/hooks.json`；验证每条 hook 的 command 路径中引用的脚本存在；检查 `run-with-flags.js` 可达
4. **运行脚本验证**：执行 `node scripts/validate-config.js`
5. **输出报告**：通过项 ✓，问题项 ✗ + 具体路径 + 修复建议

## 输出

如发现问题，输出：
- 问题清单
- 修复顺序建议
- 下一步推荐命令
