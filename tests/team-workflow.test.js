const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

const teamCommands = [
  'commands/ucc-team-standard.md',
  'commands/ucc-team-strict.md',
  'commands/ucc-team-research.md',
]

teamCommands.forEach((file) => {
  const content = fs.readFileSync(path.join(root, file), 'utf8')
  assert.ok(content.includes('agent: team-orchestrator'), `${file} 未绑定 team-orchestrator`)
  assert.ok(content.includes('配置标识：UCC'), `${file} 缺少 UCC 命中标识约束`)
})

assert.ok(
  fs.readFileSync(path.join(root, 'agents', 'team-orchestrator.md'), 'utf8').includes('流程完成：UCC Team Workflow'),
  'team-orchestrator 缺少统一收尾标识',
)

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8')
const usage = fs.readFileSync(path.join(root, 'docs', '使用说明.md'), 'utf8')
const claude = fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8')

assert.ok(readme.includes('/ucc-team-standard'), 'README 未推荐团队主入口命令')
assert.ok(usage.includes('/ucc-team-strict'), '使用说明未包含严格团队命令')
assert.ok(claude.includes('/ucc-team-standard'), 'CLAUDE.md 未声明新的团队入口命令')

;[
  'commands/ucc-flow-team-standard.md',
  'commands/ucc-flow-team-fast.md',
  'commands/ucc-flow-team-strict.md',
  'commands/ucc-flow-team-review.md',
  'commands/ucc-flow-team-research.md',
  'commands/ucc-flow-team-doc.md',
].forEach((relPath) => {
  assert.ok(!fs.existsSync(path.join(root, relPath)), `${relPath} 应已退出公开命令目录`)
})

console.log('team-workflow.test.js 通过')
