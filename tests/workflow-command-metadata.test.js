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
  ['commands/ucc-flow-team-standard.md', 'workflowProfile: team.standard', 'pausePolicy: balanced'],
  ['commands/ucc-flow-team-fast.md', 'workflowProfile: team.fast', 'pausePolicy: auto'],
  ['commands/ucc-flow-team-strict.md', 'workflowProfile: team.strict', 'pausePolicy: strict'],
  ['commands/ucc-flow-team-review.md', 'workflowProfile: team.review', 'pausePolicy: balanced'],
  ['commands/ucc-flow-team-research.md', 'workflowProfile: team.research', 'pausePolicy: balanced'],
  ['commands/ucc-flow-team-doc.md', 'workflowProfile: team.doc', 'pausePolicy: balanced'],
  ['commands/ucc-flow-single-dev.md', 'workflowProfile: single.dev', 'pausePolicy: auto'],
  ['commands/ucc-flow-single-review.md', 'workflowProfile: single.review', 'pausePolicy: balanced'],
  ['commands/ucc-flow-single-research.md', 'workflowProfile: single.research', 'pausePolicy: balanced'],
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
  'commands/ucc-team.md',
  'commands/ucc-team-fast.md',
  'commands/ucc-team-strict.md',
  'commands/ucc-team-review.md',
  'commands/ucc-team-research.md',
  'commands/ucc-team-doc.md',
  'commands/ucc-flow.md',
  'commands/ucc-flow-resume.md',
  'commands/ucc-plan.md',
  'commands/ucc-tdd.md',
  'commands/ucc-code-review.md',
  'commands/ucc-verify.md',
  'commands/ucc-update-docs.md',
  'commands/ucc-quality-gate.md',
].forEach((relPath) => {
  assert.ok(!fs.existsSync(path.join(root, relPath)), `${relPath} 应已退出公开命令面`)
})

assertContains('agents/workflow-orchestrator.md', '自动推进', 'workflow-orchestrator 缺少自动推进约束')
assertContains('agents/workflow-orchestrator.md', '/ucc-flow-continue', 'workflow-orchestrator 缺少 continue 指令')
assertContains('agents/team-orchestrator.md', 'pausePolicy', 'team-orchestrator 缺少 pausePolicy 约束')
assertContains('agents/team-orchestrator.md', '/ucc-flow-team-standard', 'team-orchestrator 缺少新命令族说明')

const definitions = JSON.parse(read('workflows/definitions.json'))
assert.strictEqual(definitions.profiles['team.standard'].publicCommand, '/ucc-flow-team-standard')
assert.strictEqual(definitions.profiles['single.dev'].publicCommand, '/ucc-flow-single-dev')
assert.strictEqual(definitions.profiles['team.research'].nodes.handoff.nextOnSuccess.profile, 'team.standard')
assert.strictEqual(definitions.profiles['team.research'].nodes.handoff.nextOnSuccess.node, 'plan')
assert.ok(definitions.pausePolicies.auto.includes('build-failed'))
assert.ok(definitions.pausePolicies.balanced.includes('db-migration'))
assert.ok(definitions.pausePolicies.strict.includes('quality-gate'))

console.log('workflow-command-metadata.test.js 通过')
