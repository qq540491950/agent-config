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
assert.ok(definitions.profiles['single.standard'].nodes, 'single.standard 缺少 nodes 定义')
assert.ok(
  definitions.profiles['single.standard'].nodes[definitions.profiles['single.standard'].entryNode],
  'single.standard entryNode 未定义到 nodes 中',
)
assert.ok(definitions.profiles['single.standard'].nodes.plan, 'single.standard 缺少 plan 节点')
assert.strictEqual(definitions.profiles['team.research'].nodes.handoff.nextOnSuccess.profile, 'team.standard')
assert.strictEqual(definitions.profiles['team.research'].nodes.handoff.nextOnSuccess.node, 'plan')
assert.strictEqual(definitions.profiles['single.research'].nodes['next-action'].nextOnSuccess.profile, 'single.standard')
assert.strictEqual(definitions.profiles['single.research'].nodes['next-action'].nextOnSuccess.node, 'plan')
assert.ok(
  definitions.profiles['single.standard'].nodes[
    definitions.profiles['single.research'].nodes['next-action'].nextOnSuccess.node
  ],
  'single.research handoff 指向了不存在的 single.standard 节点',
)
assert.ok(definitions.pausePolicies.auto.includes('build-failed'))
assert.ok(definitions.pausePolicies.balanced.includes('db-migration'))
assert.ok(definitions.pausePolicies.strict.includes('quality-gate'))

const teamStandardReview = definitions.profiles['team.standard'].nodes.review
const teamStandardPlan = definitions.profiles['team.standard'].nodes.plan
assert.strictEqual(teamStandardPlan.executorAgent, 'team-orchestrator', 'team.standard.plan 应由 team-orchestrator 协调并行计划')
assert.strictEqual(teamStandardPlan.executionStrategy, 'parallel-delegate', 'team.standard.plan 缺少 parallel-delegate 策略')
assert.strictEqual(teamStandardPlan.joinPolicy, 'all-required-complete', 'team.standard.plan 缺少并行汇总策略')
assert.deepStrictEqual(
  teamStandardPlan.parallelDelegates.map((delegate) => delegate.name),
  ['implementation-plan', 'architecture-check'],
  'team.standard.plan 并行委派列表不正确',
)
assert.strictEqual(teamStandardPlan.parallelDelegates[0].agent, 'planner')
assert.strictEqual(teamStandardPlan.parallelDelegates[0].required, true)
assert.strictEqual(teamStandardPlan.parallelDelegates[1].agent, 'architect')
assert.strictEqual(teamStandardPlan.parallelDelegates[1].required, false)
assert.deepStrictEqual(teamStandardPlan.parallelDelegates[1].whenSignals, [
  'api-contract',
  'auth-change',
  'mass-rename',
])

assert.strictEqual(teamStandardReview.executorAgent, 'team-orchestrator', 'team.standard.review 应由 team-orchestrator 协调并行审查')
assert.strictEqual(teamStandardReview.executionStrategy, 'parallel-delegate', 'team.standard.review 缺少 parallel-delegate 策略')
assert.strictEqual(teamStandardReview.joinPolicy, 'all-required-complete', 'team.standard.review 缺少并行汇总策略')
assert.deepStrictEqual(
  teamStandardReview.parallelDelegates.map((delegate) => delegate.name),
  ['code-review', 'security-review'],
  'team.standard.review 并行委派列表不正确',
)
assert.strictEqual(teamStandardReview.parallelDelegates[0].agent, 'code-reviewer')
assert.strictEqual(teamStandardReview.parallelDelegates[0].required, true)
assert.strictEqual(teamStandardReview.parallelDelegates[1].agent, 'security-reviewer')
assert.strictEqual(teamStandardReview.parallelDelegates[1].required, false)
assert.deepStrictEqual(teamStandardReview.parallelDelegates[1].whenSignals, [
  'auth-change',
  'config-sensitive',
  'api-contract',
])

const teamStandardVerify = definitions.profiles['team.standard'].nodes.verify
assert.strictEqual(teamStandardVerify.executorAgent, 'team-orchestrator', 'team.standard.verify 应由 team-orchestrator 协调并行验证')
assert.strictEqual(teamStandardVerify.executionStrategy, 'parallel-delegate', 'team.standard.verify 缺少 parallel-delegate 策略')
assert.strictEqual(teamStandardVerify.joinPolicy, 'all-required-complete', 'team.standard.verify 缺少并行汇总策略')
assert.deepStrictEqual(
  teamStandardVerify.parallelDelegates.map((delegate) => delegate.name),
  ['code-verify', 'database-verify'],
  'team.standard.verify 并行委派列表不正确',
)
assert.strictEqual(teamStandardVerify.parallelDelegates[0].agent, 'code-reviewer')
assert.strictEqual(teamStandardVerify.parallelDelegates[0].required, true)
assert.strictEqual(teamStandardVerify.parallelDelegates[1].agent, 'database-reviewer')
assert.strictEqual(teamStandardVerify.parallelDelegates[1].required, false)
assert.deepStrictEqual(teamStandardVerify.parallelDelegates[1].whenSignals, ['db-migration'])

const teamStrictReview = definitions.profiles['team.strict'].nodes.review
const teamStrictDetailedPlan = definitions.profiles['team.strict'].nodes['detailed-plan']
assert.strictEqual(teamStrictDetailedPlan.executorAgent, 'team-orchestrator', 'team.strict.detailed-plan 应由 team-orchestrator 协调并行计划')
assert.strictEqual(teamStrictDetailedPlan.executionStrategy, 'parallel-delegate', 'team.strict.detailed-plan 缺少 parallel-delegate 策略')
assert.strictEqual(teamStrictDetailedPlan.joinPolicy, 'all-required-complete', 'team.strict.detailed-plan 缺少并行汇总策略')
assert.deepStrictEqual(
  teamStrictDetailedPlan.parallelDelegates.map((delegate) => delegate.name),
  ['detailed-plan', 'architecture-check'],
  'team.strict.detailed-plan 并行委派列表不正确',
)
assert.strictEqual(teamStrictDetailedPlan.parallelDelegates[0].agent, 'planner')
assert.strictEqual(teamStrictDetailedPlan.parallelDelegates[0].required, true)
assert.strictEqual(teamStrictDetailedPlan.parallelDelegates[1].agent, 'architect')
assert.strictEqual(teamStrictDetailedPlan.parallelDelegates[1].required, false)
assert.deepStrictEqual(teamStrictDetailedPlan.parallelDelegates[1].whenSignals, [
  'api-contract',
  'auth-change',
  'mass-rename',
  'major-dependency',
])

assert.strictEqual(teamStrictReview.executorAgent, 'team-orchestrator', 'team.strict.review 应由 team-orchestrator 协调并行审查')
assert.strictEqual(teamStrictReview.executionStrategy, 'parallel-delegate', 'team.strict.review 缺少 parallel-delegate 策略')
assert.strictEqual(teamStrictReview.joinPolicy, 'all-required-complete', 'team.strict.review 缺少并行汇总策略')
assert.deepStrictEqual(
  teamStrictReview.parallelDelegates.map((delegate) => delegate.name),
  ['code-review', 'security-review'],
  'team.strict.review 并行委派列表不正确',
)

const teamStrictFullVerify = definitions.profiles['team.strict'].nodes['full-verify']
assert.strictEqual(teamStrictFullVerify.executorAgent, 'team-orchestrator', 'team.strict.full-verify 应由 team-orchestrator 协调并行验证')
assert.strictEqual(teamStrictFullVerify.executionStrategy, 'parallel-delegate', 'team.strict.full-verify 缺少 parallel-delegate 策略')
assert.strictEqual(teamStrictFullVerify.joinPolicy, 'all-required-complete', 'team.strict.full-verify 缺少并行汇总策略')
assert.deepStrictEqual(
  teamStrictFullVerify.parallelDelegates.map((delegate) => delegate.name),
  ['code-verify', 'database-verify'],
  'team.strict.full-verify 并行委派列表不正确',
)
assert.strictEqual(teamStrictFullVerify.parallelDelegates[0].agent, 'code-reviewer')
assert.strictEqual(teamStrictFullVerify.parallelDelegates[0].required, true)
assert.strictEqual(teamStrictFullVerify.parallelDelegates[1].agent, 'database-reviewer')
assert.strictEqual(teamStrictFullVerify.parallelDelegates[1].required, false)
assert.deepStrictEqual(teamStrictFullVerify.parallelDelegates[1].whenSignals, ['db-migration'])

const hooksReadme = read('hooks/README.md')
assert.ok(!hooksReadme.includes('/ucc-flow-team-standard'), 'hooks/README.md 不应再引用 /ucc-flow-team-standard')
assert.ok(!hooksReadme.includes('/ucc-flow-team-doc'), 'hooks/README.md 不应再引用 /ucc-flow-team-doc')
assert.ok(!hooksReadme.includes('/ucc-e2e'), 'hooks/README.md 不应再引用 /ucc-e2e')

const verificationSkill = read('skills/verification-loop/SKILL.md')
assert.ok(!verificationSkill.includes('/ucc-verify'), 'verification-loop 技能不应再引用 /ucc-verify')

const hooksRule = read('rules/common/hooks.md')
assert.ok(hooksRule.includes('PreToolUse'), 'rules/common/hooks.md 应说明 PreToolUse')
assert.ok(hooksRule.includes('PostToolUse'), 'rules/common/hooks.md 应说明 PostToolUse')
assert.ok(hooksRule.includes('Stop'), 'rules/common/hooks.md 应说明 Stop')

console.log('workflow-command-metadata.test.js 通过')
