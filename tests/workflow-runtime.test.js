const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const runtime = require(path.join(root, 'scripts', 'lib', 'workflow-runtime.js'))
const tempBase = fs.mkdtempSync(path.join(path.dirname(root), '.tmp-workflow-runtime-'))
const projectRoot = path.join(tempBase, 'demo-project')

fs.mkdirSync(projectRoot, { recursive: true })

const options = {
  projectRoot,
  pluginRoot: root,
}

try {
  const started = runtime.startRun(
    {
      command: '/ucc-team-research',
      task: '分析现有链路并给出自动接力方案',
    },
    options,
  )

  assert.strictEqual(started.action, 'started')
  assert.strictEqual(started.run.profile, 'team.research')
  assert.strictEqual(started.run.currentNode, 'define-problem')
  assert.strictEqual(started.run.entryCommand, '/ucc-team-research')
  assert.strictEqual(started.run.executionMode, 'auto')
  assert.strictEqual(started.run.pausePolicy, 'balanced')

  let advanced = runtime.advanceRun({ runId: started.run.runId, result: 'passed' }, options)
  assert.strictEqual(advanced.action, 'advanced')
  assert.strictEqual(advanced.run.currentNode, 'evidence')
  assert.strictEqual(advanced.run.status, 'running')

  advanced = runtime.advanceRun(
    {
      runId: started.run.runId,
      result: 'passed',
      signals: ['api-contract'],
    },
    options,
  )
  assert.strictEqual(advanced.action, 'paused')
  assert.strictEqual(advanced.run.status, 'paused')
  assert.strictEqual(advanced.run.currentNode, 'conclusion')
  assert.deepStrictEqual(advanced.run.pauseState.signals, ['api-contract'])

  let continued = runtime.continueRun({ runId: started.run.runId }, options)
  assert.strictEqual(continued.action, 'continued')
  assert.strictEqual(continued.run.status, 'running')

  advanced = runtime.advanceRun({ runId: started.run.runId, result: 'passed' }, options)
  assert.strictEqual(advanced.action, 'advanced')
  assert.strictEqual(advanced.run.currentNode, 'handoff')
  assert.strictEqual(advanced.run.profile, 'team.research')

  advanced = runtime.advanceRun({ runId: started.run.runId, result: 'passed' }, options)
  assert.strictEqual(advanced.action, 'advanced')
  assert.strictEqual(advanced.run.profile, 'team.standard')
  assert.strictEqual(advanced.run.currentNode, 'plan')
  assert.strictEqual(advanced.run.status, 'running')

  advanced = runtime.advanceRun(
    {
      runId: started.run.runId,
      result: 'passed',
      signals: ['db-migration'],
    },
    options,
  )
  assert.strictEqual(advanced.action, 'paused')
  assert.strictEqual(advanced.run.profile, 'team.standard')
  assert.strictEqual(advanced.run.currentNode, 'implement')
  assert.strictEqual(advanced.run.pausePolicy, 'balanced')

  continued = runtime.continueRun({}, options)
  assert.strictEqual(continued.action, 'continued')
  assert.strictEqual(continued.run.runId, started.run.runId)
  assert.strictEqual(continued.run.status, 'running')

  const joined = runtime.startRun(
    {
      command: '/ucc-team-standard',
      task: '继续现有 run',
    },
    options,
  )
  assert.strictEqual(joined.action, 'joined')
  assert.strictEqual(joined.run.runId, started.run.runId)

  const status = runtime.getRunStatus({}, options)
  assert.strictEqual(status.action, 'status')
  assert.strictEqual(status.run.runId, started.run.runId)

  const summary = runtime.formatRunSummary(status.run, { action: status.action })
  assert.ok(summary.includes('执行模式: auto'))
  assert.ok(summary.includes('暂停策略: balanced'))
  assert.ok(summary.includes('继续命令:'))

  const aborted = runtime.abortRun({ runId: started.run.runId, reason: 'test cleanup' }, options)
  assert.strictEqual(aborted.action, 'aborted')
  assert.strictEqual(aborted.run.status, 'aborted')
  assert.strictEqual(runtime.getActiveRunMeta(options), null)

  const secondStarted = runtime.startRun(
    {
      command: '/ucc-team-standard',
    },
    options,
  )
  assert.strictEqual(secondStarted.action, 'started')

  const conflict = runtime.startRun(
    {
      command: '/ucc-single-research',
    },
    options,
  )
  assert.strictEqual(conflict.action, 'conflict')
  assert.strictEqual(conflict.run.runId, secondStarted.run.runId)
} finally {
  fs.rmSync(tempBase, { recursive: true, force: true })
}

console.log('workflow-runtime.test.js 通过')
