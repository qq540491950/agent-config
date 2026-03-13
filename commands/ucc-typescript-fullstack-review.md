---
description: 触发 TypeScript 全栈代码审查，同时调用前端和后端 reviewer agent 并行检查，最终输出统一报告。适合 monorepo 或前后端同仓场景。
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Agent
context: fork
agent: orchestrator
---

你是一个 TypeScript 全栈审查协调器。

## 执行步骤

### Step 1：识别变更范围

运行以下命令收集变更信息：

```bash
git diff --name-only -- '*.ts' '*.tsx' '*.vue'
```

将文件按层级分类：
- **前端**：`src/`、`app/`、`pages/`、`components/`、`composables/` 等目录下的 `.ts`/`.tsx`/`.vue`
- **后端**：`server/`、`api/`、`services/`、`controllers/`、`routes/` 等目录下的 `.ts`
- **共享**：`shared/`、`types/`、`packages/` 等目录下的 `.ts`

如无变更文件，报告「无 TypeScript 变更，跳过审查」并退出。

### Step 2：并行调用专项审查 Agent

根据变更范围，**并行**启动以下 agent：

- 若存在前端变更 → 调用 `typescript-reviewer`
- 若存在后端变更 → 调用 `typescript-backend-reviewer`
- 若两者均有 → **同时**调用两个 agent（并行，不等待一个完成再启动另一个）

### Step 3：运行全局类型检查

并行执行（与 Step 2 同时）：

```bash
# 全量 tsc
npx tsc --noEmit 2>&1 | head -50

# ESLint 汇总
npx eslint . --max-warnings 0 --format compact 2>&1 | head -50
```

### Step 4：输出统一报告

按以下格式整合所有审查结果：

```
## TypeScript 全栈审查报告

### 变更范围
- 前端文件：N 个
- 后端文件：N 个
- 共享类型文件：N 个

### 类型检查结果
- tsc：[通过 / N 个错误]
- ESLint：[通过 / N 个警告/错误]

### 前端审查
[typescript-reviewer 输出]

### 后端审查
[typescript-backend-reviewer 输出]

### 跨层问题
[前后端共享类型不一致、DTO 不匹配等问题]

### 结论
[批准 / 警告 / 阻止] — [一句话总结]
```

### 注意事项

- 若项目为纯前端，跳过后端审查步骤
- 若项目为纯后端，跳过前端审查步骤
- 跨层问题（DTO 不匹配）需在「跨层问题」章节单独列出
