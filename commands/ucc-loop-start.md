---
description: 启动一轮紧凑的验证循环，持续检查构建、类型、lint 与测试状态。
---

# Loop Start

启动当前仓库的验证循环。

## 命令功能

- 启动一轮持续验证
- 自动运行构建、类型检查、lint、测试
- 记录最近一次检查结果

## 执行步骤

1. 检测项目类型：读取 `package.json`（存在则为 Node.js/TS/Vue）或 `go.mod`（存在则为 Go）
2. 根据项目类型运行对应检查：
   - **TypeScript/Vue**：`npx tsc --noEmit && npx eslint . && npm test`
   - **Go**：`go build ./... && go vet ./... && go test ./...`
   - **Node.js（无 TS）**：`npm run build && npx eslint . && npm test`
3. 汇总结果：列出通过项（✓）和失败项（✗）
4. 如有失败：输出具体错误位置和建议修复方向
5. 记录本次检查时间戳（供 ucc-loop-status 查询）

## 何时使用

- 大规模修改后
- 演示或发布前
- 长时间开发会话中
