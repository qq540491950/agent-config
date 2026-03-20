const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const tempBase = fs.mkdtempSync(path.join(path.dirname(root), '.tmp-copy-config-modes-'))
const script = path.join(root, 'scripts', 'copy-config.js')

function runCopy(targetDir, ...args) {
  return spawnSync('node', [script, targetDir, '--force', ...args], {
    cwd: root,
    encoding: 'utf8',
  })
}

function runPromptedCopy(targetDir, input, ...args) {
  return spawnSync('node', [script, targetDir, '--force', ...args], {
    cwd: root,
    encoding: 'utf8',
    input,
  })
}

try {
  const dotclaudeProject = path.join(tempBase, 'dotclaude-project')
  fs.mkdirSync(dotclaudeProject, { recursive: true })
  const dotclaudeResult = runCopy(dotclaudeProject, '--claude-mode', 'dotclaude')
  assert.strictEqual(dotclaudeResult.status, 0, dotclaudeResult.stderr || dotclaudeResult.stdout)
  assert.ok(fs.existsSync(path.join(dotclaudeProject, '.claude', 'CLAUDE.md')), 'dotclaude 模式应生成 .claude/CLAUDE.md')
  assert.ok(fs.existsSync(path.join(dotclaudeProject, '.claude', 'CLAUDE.ucc.md')), 'dotclaude 模式应生成 .claude/CLAUDE.ucc.md')
  assert.ok(!fs.existsSync(path.join(dotclaudeProject, 'CLAUDE.md')), 'dotclaude 模式不应生成项目根目录 CLAUDE.md')

  const importProject = path.join(tempBase, 'import-project')
  fs.mkdirSync(importProject, { recursive: true })
  const importResult = runCopy(importProject, '--claude-mode', 'import-root')
  assert.strictEqual(importResult.status, 0, importResult.stderr || importResult.stdout)
  assert.ok(fs.existsSync(path.join(importProject, 'CLAUDE.md')), 'import-root 模式在根目录无 CLAUDE.md 时应生成 bootstrap 文件')
  assert.ok(fs.existsSync(path.join(importProject, '.claude', 'CLAUDE.ucc.md')), 'import-root 模式应生成 .claude/CLAUDE.ucc.md')
  assert.match(fs.readFileSync(path.join(importProject, 'CLAUDE.md'), 'utf8'), /@\.claude\/CLAUDE\.ucc\.md/, 'bootstrap CLAUDE.md 应导入 .claude/CLAUDE.ucc.md')

  const importExistingProject = path.join(tempBase, 'import-existing-project')
  fs.mkdirSync(importExistingProject, { recursive: true })
  fs.writeFileSync(path.join(importExistingProject, 'CLAUDE.md'), '# Existing\n\nDo not overwrite.\n')
  const importExistingResult = runCopy(importExistingProject, '--claude-mode', 'import-root')
  assert.strictEqual(importExistingResult.status, 0, importExistingResult.stderr || importExistingResult.stdout)
  assert.strictEqual(
    fs.readFileSync(path.join(importExistingProject, 'CLAUDE.md'), 'utf8'),
    '# Existing\n\nDo not overwrite.\n',
    'import-root 模式不应覆盖已有项目根 CLAUDE.md',
  )
  assert.ok(fs.existsSync(path.join(importExistingProject, '.claude', 'CLAUDE.ucc.md')), '已有根 CLAUDE.md 时仍应生成 .claude/CLAUDE.ucc.md')
  assert.match(importExistingResult.stdout, /@\.claude\/CLAUDE\.ucc\.md/, '已有根 CLAUDE.md 时应输出导入提示')

  const localHooksProject = path.join(tempBase, 'local-hooks-project')
  fs.mkdirSync(localHooksProject, { recursive: true })
  const localHooksResult = runCopy(localHooksProject, '--hooks', 'local')
  assert.strictEqual(localHooksResult.status, 0, localHooksResult.stderr || localHooksResult.stdout)
  assert.ok(fs.existsSync(path.join(localHooksProject, '.claude', 'settings.local.json')), '--hooks local 应生成 .claude/settings.local.json')
  assert.ok(!fs.existsSync(path.join(localHooksProject, '.claude', 'settings.json')), '--hooks local 不应生成 .claude/settings.json')

  const projectHooksProject = path.join(tempBase, 'project-hooks-project')
  fs.mkdirSync(projectHooksProject, { recursive: true })
  const projectHooksResult = runCopy(projectHooksProject, '--hooks', 'project')
  assert.strictEqual(projectHooksResult.status, 0, projectHooksResult.stderr || projectHooksResult.stdout)
  assert.ok(fs.existsSync(path.join(projectHooksProject, '.claude', 'settings.json')), '--hooks project 应生成 .claude/settings.json')

  const interactiveProject = path.join(tempBase, 'interactive-project')
  fs.mkdirSync(interactiveProject, { recursive: true })
  const interactiveResult = runPromptedCopy(
    interactiveProject,
    ['1', '3', '2', 'windows', '4', '1,3,4', 'ghp_test_token_123', ''].join('\n'),
  )
  assert.strictEqual(interactiveResult.status, 0, interactiveResult.stderr || interactiveResult.stdout)
  assert.match(interactiveResult.stdout, /请选择 hooks 接入模式:/, '默认执行时应通过选择式交互配置 hooks')
  assert.match(interactiveResult.stdout, /请选择 MCP 接入模式:/, '默认执行时应通过选择式交互配置 MCP')
  assert.ok(fs.existsSync(path.join(interactiveProject, '.mcp.json')), '选择式交互启用 MCP 后应生成项目根 .mcp.json')
  assert.ok(fs.existsSync(path.join(interactiveProject, '.claude', 'settings.json')), '选择式交互选择 project hooks 应生成 .claude/settings.json')

  const mcpConfig = JSON.parse(fs.readFileSync(path.join(interactiveProject, '.mcp.json'), 'utf8'))
  assert.deepStrictEqual(
    Object.keys(mcpConfig.mcpServers).sort(),
    ['context7', 'filesystem', 'github'],
    '交互式安装应只写入已选中的 MCP 服务',
  )
  assert.strictEqual(
    mcpConfig.mcpServers.github.command,
    'cmd',
    'windows 平台应将本地 stdio MCP command 包装为 cmd',
  )
  assert.deepStrictEqual(
    mcpConfig.mcpServers.github.args.slice(0, 3),
    ['/c', 'npx', '-y'],
    'windows 平台应通过 cmd /c npx 调用本地 MCP',
  )
  assert.strictEqual(
    mcpConfig.mcpServers.filesystem.args.at(-1),
    interactiveProject,
    'filesystem MCP 应默认绑定目标项目目录',
  )

  const interactiveSettings = JSON.parse(
    fs.readFileSync(path.join(interactiveProject, '.claude', 'settings.json'), 'utf8'),
  )
  assert.deepStrictEqual(
    interactiveSettings.enabledMcpjsonServers,
    ['github', 'filesystem', 'context7'],
    '启用项目级 MCP 时应同步写入 settings 的 MCP 名单',
  )

  const legacyProject = path.join(tempBase, 'legacy-project')
  fs.mkdirSync(legacyProject, { recursive: true })
  const legacyResult = runCopy(legacyProject, '--legacy-layout')
  assert.strictEqual(legacyResult.status, 0, legacyResult.stderr || legacyResult.stdout)
  assert.ok(fs.existsSync(path.join(legacyProject, 'CLAUDE.md')), '--legacy-layout 应生成项目根目录 CLAUDE.md')
  assert.ok(fs.existsSync(path.join(legacyProject, '.claude', 'settings.json')), '--legacy-layout 应生成 .claude/settings.json')
} finally {
  fs.rmSync(tempBase, { recursive: true, force: true })
}

console.log('copy-config-modes.test.js 通过')
