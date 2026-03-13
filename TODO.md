# UCC 配置集待办项

> 下次操作时按优先级顺序逐项修改，完成后删除对应条目。

---

## P0 — 立即修复（正确性问题）

### P0-1：`security-reviewer` 工具权限过宽

**文件：** `agents/security-reviewer.md`

**当前：**
```yaml
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
```
**改为：**
```yaml
tools: ["Read", "Bash", "Grep", "Glob"]
```
**理由：** 安全审查员职责是「发现并报告」，不是「自动修复」。最小权限原则。与 code-reviewer、go-reviewer、typescript-reviewer 等只读审查员保持一致。

---

### P0-2：`javascript-reviewer` 职责范围与 `typescript-reviewer` 重叠

**文件：** `agents/javascript-reviewer.md`

**修改清单：**

1. **frontmatter `description`** 改为：
   ```
   JavaScript/Node.js 代码审查专家，专注于 ES6+ 惯用法、异步模式、安全和性能。用于 .js/.jsx 文件变更（TypeScript 请用 typescript-reviewer 或 typescript-backend-reviewer）。
   ```

2. **第 12 行** `git diff` 命令改为（移除 `*.ts *.tsx *.vue`）：
   ```bash
   git diff -- '*.js' '*.jsx'
   ```

3. **移除「高优先级 — TypeScript」章节**（`### 高优先级 — TypeScript` 及其下 5 条子项）

4. **「框架检查」部分** 移除 Vue 相关内容，保留 React 和 Node.js 部分

**理由：** 明确三者边界：javascript-reviewer 管 JS/Node.js，typescript-reviewer 管 TS/Vue 前端，typescript-backend-reviewer 管 TS 后端。

---

## P1 — 重要改进（功能完整性）

### P1-1：三个新命令缺少可执行步骤

#### `commands/ucc-loop-start.md` — 追加以下内容

```markdown
## 执行步骤

1. 检测项目类型：读取 `package.json`（存在则为 Node.js/TS/Vue）或 `go.mod`（存在则为 Go）
2. 根据项目类型运行对应检查：
   - **TypeScript/Vue**：`npx tsc --noEmit && npx eslint . && npm test`
   - **Go**：`go build ./... && go vet ./... && go test ./...`
   - **Node.js（无 TS）**：`npm run build && npx eslint . && npm test`
3. 汇总结果：列出通过项（✓）和失败项（✗）
4. 如有失败：输出具体错误位置和建议修复方向
5. 记录本次检查时间戳（供 ucc-loop-status 查询）
```

---

#### `commands/ucc-loop-status.md` — 追加以下内容

```markdown
## 执行步骤

1. 读取最近一次 `ucc-loop-start` 记录的检查结果（时间戳 + 各项状态）
2. 若无记录：提示「尚未运行 ucc-loop-start，无历史结果」
3. 若有记录：输出简表：
   - 检查时间
   - 各检查项状态（通过 ✓ / 失败 ✗ / 跳过 —）
4. 如有未解决问题：提示运行 `ucc-loop-start` 重新检查
```

---

#### `commands/ucc-model-route.md` — 追加以下内容

```markdown
## 执行步骤

1. 读取所有 `agents/*.md` 文件的 `model:` frontmatter 字段
2. 输出当前路由表：agent 名称 → model 映射
3. 标出使用 `opus` 的 agent（添加「高成本」提示）
4. 统计各模型使用数量（sonnet / opus / haiku）
5. 建议：高频低复杂度任务是否可降级到 haiku 以节省成本
```

---

### P1-2：`ucc-harness-audit` 缺少具体检查逻辑

**文件：** `commands/ucc-harness-audit.md` — 追加以下内容

```markdown
## 执行步骤

1. **目录结构检查**：验证 `agents/`、`commands/`、`skills/`、`hooks/`、`rules/` 目录存在；统计各目录文件数，与 CLAUDE.md 声明数量对比
2. **命令-代理绑定检查**：扫描所有 `commands/*.md` 的 `agent:` frontmatter；确认每个引用的 agent 在 `agents/` 中有对应文件；列出孤立引用
3. **Hooks 完整性检查**：读取 `hooks/hooks.json`；验证每条 hook 的 command 路径中引用的脚本存在；检查 `run-with-flags.js` 可达
4. **运行脚本验证**：执行 `node scripts/validate-config.js`
5. **输出报告**：通过项 ✓，问题项 ✗ + 具体路径 + 修复建议
```

---

### P1-3：`CLAUDE.md` 架构图路径前缀错误

**文件：** `CLAUDE.md`，第 31 行代码块

**当前：**
```
claude/
├── CLAUDE.md              # 主入口配置
├── agents/                ...
```

**改为：**
```
./
├── CLAUDE.md              # 主入口配置
├── agents/                ...
```

**理由：** 实际仓库根目录就是配置根目录，`claude/` 前缀不存在，会误导用户。

---

## 完成后

```bash
node tests/run-all.js
node scripts/validate-config.js
git add -A
git commit -m "fix+feat: P0 权限修复 + P1 命令可执行步骤 + 架构图路径修正"
git push origin master
```

完成后删除此文件。
