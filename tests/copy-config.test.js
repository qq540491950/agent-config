const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const tempBase = fs.mkdtempSync(path.join(path.dirname(root), '.tmp-copy-config-'))
const projectRoot = path.join(tempBase, 'demo-project')
const secondProjectRoot = path.join(tempBase, 'demo-project-2')

fs.mkdirSync(projectRoot, { recursive: true })
fs.mkdirSync(secondProjectRoot, { recursive: true })

try {
  const script = path.join(root, 'scripts', 'copy-config.js')
  const result = spawnSync('node', [script, projectRoot, '--force'], {
    cwd: root,
    encoding: 'utf8',
  })

  assert.strictEqual(result.status, 0, result.stderr || result.stdout)
  assert.ok(fs.existsSync(path.join(projectRoot, 'CLAUDE.md')), '项目根目录缺少 CLAUDE.md')
  assert.ok(fs.existsSync(path.join(projectRoot, '.claude', 'commands', 'ucc-team.md')), '.claude/commands 缺少 ucc-team.md')
  assert.ok(
    fs.existsSync(path.join(projectRoot, '.claude', 'agents', 'team-orchestrator.md')),
    '.claude/agents 缺少 team-orchestrator.md',
  )
  assert.ok(fs.existsSync(path.join(projectRoot, '.claude', 'settings.json')), '.claude/settings.json 未生成')
  assert.ok(fs.existsSync(path.join(projectRoot, '.claude', 'README.md')), '.claude/README.md 未生成')
  assert.ok(!fs.existsSync(path.join(projectRoot, 'README.md')), '配置 README 不应覆盖项目根 README.md')

  const deployedScript = path.join(projectRoot, '.claude', 'scripts', 'copy-config.js')
  const redeployResult = spawnSync('node', [deployedScript, secondProjectRoot, '--force'], {
    cwd: projectRoot,
    encoding: 'utf8',
  })

  assert.strictEqual(redeployResult.status, 0, redeployResult.stderr || redeployResult.stdout)
  assert.ok(fs.existsSync(path.join(secondProjectRoot, 'CLAUDE.md')), '已部署脚本复制时缺少项目根 CLAUDE.md')
  assert.ok(
    fs.existsSync(path.join(secondProjectRoot, '.claude', 'settings.json')),
    '已部署脚本复制时未生成 .claude/settings.json',
  )
} finally {
  fs.rmSync(tempBase, { recursive: true, force: true })
}

console.log('copy-config.test.js 通过')
