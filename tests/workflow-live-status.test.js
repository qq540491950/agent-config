const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const runtime = require(path.join(root, 'scripts', 'lib', 'workflow-runtime.js'))
const liveStatusScript = path.join(root, 'scripts', 'workflow', 'live-status.js')
const runnerScript = path.join(root, 'scripts', 'workflow', 'runner.js')
const tempBase = fs.mkdtempSync(path.join(path.dirname(root), '.tmp-workflow-live-status-'))
const projectRoot = path.join(tempBase, 'demo-project')

fs.mkdirSync(projectRoot, { recursive: true })

const options = {
  projectRoot,
  pluginRoot: root,
}

function runSnapshot(runId) {
  return spawnSync(process.execPath, [liveStatusScript, '--run', runId, '--snapshot'], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
}

function runWatchSnapshot(runId) {
  return spawnSync(process.execPath, [runnerScript, 'watch', '--run', runId, '--snapshot'], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
}

function readRunnerUsage() {
  return spawnSync(process.execPath, [runnerScript, 'status', '--help'], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
}

try {
  const started = runtime.startRun(
    {
      command: '/ucc-team-parallel',
      task: 'live status panel smoke',
    },
    options,
  )

  let advanced = runtime.advanceRun({ runId: started.run.runId, result: 'passed' }, options)
  assert.strictEqual(advanced.run.currentNode, 'plan')

  advanced = runtime.advanceRun({ runId: started.run.runId, result: 'passed' }, options)
  assert.strictEqual(advanced.run.currentNode, 'parallel-implement')

  runtime.updateDelegateStatus(
    {
      runId: started.run.runId,
      delegateId: 'slice-a',
      name: 'implementation-slice-a',
      agent: 'tdd-guide',
      status: 'running',
      required: true,
      summary: 'editing src/api/**',
      progressLabel: 'editing',
      lastSummary: 'editing src/api/**',
    },
    options,
  )

  runtime.updateVerificationStatus(
    {
      runId: started.run.runId,
      name: 'smoke',
      status: 'running',
      source: 'node tests/run-all.js',
      summary: 'waiting on delegates',
      progressLabel: 'waiting',
      lastSummary: 'waiting on delegates',
    },
    options,
  )

  runtime.advanceRun(
    {
      runId: started.run.runId,
      result: 'blocked',
      summary: 'ownership overlap',
      signals: ['conflict'],
    },
    options,
  )

  const usageOutput = readRunnerUsage()
  assert.match(usageOutput.stdout, /watch \[--run <runId>\]/)

  const watchOutput = runWatchSnapshot(started.run.runId)
  assert.strictEqual(watchOutput.status, 0, watchOutput.stderr || watchOutput.stdout)
  assert.match(watchOutput.stdout, /workflow runtime/)
  assert.match(watchOutput.stdout, /delegates/)

  const output = runSnapshot(started.run.runId)
  assert.strictEqual(output.status, 0, output.stderr || output.stdout)
  assert.match(output.stdout, /workflow runtime/)
  assert.match(output.stdout, /node:/)
  assert.match(output.stdout, /delegates/)
  assert.match(output.stdout, /verification/)
  assert.match(output.stdout, /blocking/)

  const controlPath = path.join(projectRoot, '.claude', 'workflows', 'control', `${started.run.runId}.json`)
  fs.rmSync(controlPath, { force: true })

  const fallbackOutput = runSnapshot(started.run.runId)
  assert.strictEqual(fallbackOutput.status, 0, fallbackOutput.stderr || fallbackOutput.stdout)
  assert.match(fallbackOutput.stdout, new RegExp(started.run.runId))
  assert.match(fallbackOutput.stdout, /status:/)
} finally {
  fs.rmSync(tempBase, { recursive: true, force: true })
}

console.log('workflow-live-status.test.js 通过')
