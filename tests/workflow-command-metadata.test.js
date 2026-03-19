const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8')
}

function assertContains(relPath, needle, message) {
  assert.ok(read(relPath).includes(needle), message || `${relPath} 缺少 ${needle}`)
}

const publicWorkflowCommands = [
  ['commands/ucc-team-standard.md', 'workflowProfile: team.standard', 'pausePolicy: balanced'],
  ['commands/ucc-team-strict.md', 'workflowProfile: team.strict', 'pausePolicy: strict'],
  ['commands/ucc-team-research.md', 'workflowProfile: team.research', 'pausePolicy: balanced'],
  ['commands/ucc-single-standard.md', 'workflowProfile: single.standard', 'pausePolicy: auto'],
  ['commands/ucc-single-research.md', 'workflowProfile: single.research', 'pausePolicy: balanced'],
  ['commands/ucc-flow-status.md', 'agent: workflow-orchestrator', null],
  ['commands/ucc-flow-continue.md', 'agent: workflow-orchestrator', null],
  ['commands/ucc-flow-abort.md', 'agent: workflow-orchestrator', null],
]

publicWorkflowCommands.forEach(([relPath, profileNeedle, pauseNeedle]) => {
  assertContains(relPath, 'workflowCapable: true', `${relPath} 缺少 workflowCapable`)
  assertContains(relPath, 'executionMode: auto', `${relPath} 缺少 executionMode: auto`)
  assertContains(relPath, 'triggerVisibility: always', `${relPath} 缺少 triggerVisibility: always`)
  if (profileNeedle) {
    assertContains(relPath, profileNeedle, `${relPath} 缺少 ${profileNeedle}`)
  }
  if (pauseNeedle) {
    assertContains(relPath, pauseNeedle, `${relPath} 缺少 ${pauseNeedle}`)
  }
})

;[
  'commands/ucc-flow-team-standard.md',
  'commands/ucc-flow-team-fast.md',
  'commands/ucc-flow-team-strict.md',
  'commands/ucc-flow-team-review.md',
  'commands/ucc-flow-team-research.md',
  'commands/ucc-flow-team-doc.md',
  'commands/ucc-flow-single-dev.md',
  'commands/ucc-flow-single-review.md',
  'commands/ucc-flow-single-research.md',
].forEach((relPath) => {
  assert.ok(!fs.existsSync(path.join(root, relPath)), `${relPath} 应已退出公开命令面`)
})

assertContains('agents/workflow-orchestrator.md', '自动推进', 'workflow-orchestrator 缺少自动推进约束')
assertContains('agents/workflow-orchestrator.md', '/ucc-flow-continue', 'workflow-orchestrator 缺少 continue 指令')
assertContains('agents/team-orchestrator.md', 'pausePolicy', 'team-orchestrator 缺少 pausePolicy 约束')
assertContains('agents/team-orchestrator.md', '/ucc-team-standard', 'team-orchestrator 缺少新命令族说明')

const definitions = JSON.parse(read('workflows/definitions.json'))
assert.strictEqual(definitions.profiles['team.standard'].publicCommand, '/ucc-team-standard')
assert.strictEqual(definitions.profiles['single.standard'].publicCommand, '/ucc-single-standard')
assert.strictEqual(definitions.profiles['team.research'].nodes.handoff.nextOnSuccess.profile, 'team.standard')
assert.strictEqual(definitions.profiles['team.research'].nodes.handoff.nextOnSuccess.node, 'plan')
assert.strictEqual(definitions.profiles['single.research'].nodes['next-action'].nextOnSuccess.profile, 'single.standard')
assert.strictEqual(definitions.profiles['single.research'].nodes['next-action'].nextOnSuccess.node, 'plan')
assert.ok(definitions.pausePolicies.auto.includes('build-failed'))
assert.ok(definitions.pausePolicies.balanced.includes('db-migration'))
assert.ok(definitions.pausePolicies.strict.includes('quality-gate'))

console.log('workflow-command-metadata.test.js 通过')
