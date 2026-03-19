const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

const mustHave = [
  'agents/doc-updater.md',
  'agents/e2e-runner.md',
  'agents/team-orchestrator.md',
  'agents/workflow-orchestrator.md',
  'commands/ucc-team-standard.md',
  'commands/ucc-team-strict.md',
  'commands/ucc-team-research.md',
  'commands/ucc-single-standard.md',
  'commands/ucc-single-research.md',
  'commands/ucc-flow-status.md',
  'commands/ucc-flow-continue.md',
  'commands/ucc-flow-abort.md',
  'rules/javascript/coding-style.md',
  'rules/javascript/security.md',
  'rules/javascript/testing.md',
  'rules/javascript/patterns.md',
  'skills/node-backend-patterns/SKILL.md',
  'skills/design-collaboration/SKILL.md',
  'hooks/project-settings.json',
  'agents/database-reviewer.md',
  'agents/design-doc-writer.md',
  'agents/delivery-doc-writer.md',
  'skills/design-doc-patterns/SKILL.md',
  'skills/delivery-patterns/SKILL.md',
  'skills/docker-patterns/SKILL.md',
  'skills/deployment-patterns/SKILL.md',
  'workflows/definitions.json',
  'scripts/lib/workflow-runtime.js',
  'scripts/workflow/runner.js',
]

for (const file of mustHave) {
  assert.ok(fs.existsSync(path.join(root, file)), `缺少文件: ${file}`)
}

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
  'commands/ucc-team-fast.md',
  'commands/ucc-team-review.md',
  'commands/ucc-team-doc.md',
  'commands/ucc-flow.md',
  'commands/ucc-flow-resume.md',
  'commands/ucc-plan.md',
  'commands/ucc-tdd.md',
  'commands/ucc-code-review.md',
  'commands/ucc-verify.md',
  'commands/ucc-update-docs.md',
  'commands/ucc-quality-gate.md',
  'commands/ucc-checkpoint.md',
  'commands/ucc-context.md',
  'commands/ucc-harness-audit.md',
  'commands/ucc-loop-start.md',
  'commands/ucc-loop-status.md',
  'commands/ucc-model-route.md',
  'commands/ucc-learn.md',
  'commands/ucc-skill-create.md',
  'commands/ucc-sessions.md',
  'commands/ucc-build-fix.md',
  'commands/ucc-context-dev.md',
  'commands/ucc-context-review.md',
  'commands/ucc-context-research.md',
  'commands/ucc-db-review.md',
  'commands/ucc-delivery-doc.md',
  'commands/ucc-design-doc.md',
  'commands/ucc-e2e.md',
  'commands/ucc-go-build.md',
  'commands/ucc-go-review.md',
  'commands/ucc-go-test.md',
  'commands/ucc-javascript-review.md',
  'commands/ucc-refactor-clean.md',
  'commands/ucc-test-coverage.md',
  'commands/ucc-typescript-backend-review.md',
  'commands/ucc-typescript-fullstack-review.md',
  'commands/ucc-typescript-review.md',
  'contexts',
  '.internal',
].forEach((file) => {
  assert.ok(!fs.existsSync(path.join(root, file)), `不应再保留公开命令或退役目录: ${file}`)
})

assert.ok(!fs.existsSync(path.join(root, 'legacy')), 'legacy 目录应已清理')

console.log('config-smoke.test.js 通过')
