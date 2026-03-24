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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function getControlPaths(runId) {
  return {
    runControl: path.join(projectRoot, '.claude', 'workflows', 'control', `${runId}.json`),
    latestControl: path.join(projectRoot, '.claude', 'workflows', 'control', 'latest.json'),
  }
}

function findDelegate(snapshot, delegateId) {
  return (snapshot.delegates || []).find((delegate) => delegate.delegateId === delegateId)
}

function findVerification(snapshot, name) {
  return (snapshot.verification || []).find((item) => item.name === name)
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

  const controlPaths = getControlPaths(started.run.runId)
  assert.ok(fs.existsSync(controlPaths.runControl), 'start 后应生成 per-run control snapshot')
  assert.ok(fs.existsSync(controlPaths.latestControl), 'start 后应生成 latest control snapshot')

  let controlSnapshot = readJson(controlPaths.runControl)
  assert.strictEqual(controlSnapshot.run.runId, started.run.runId)
  assert.strictEqual(controlSnapshot.run.currentNode, 'define-problem')
  assert.strictEqual(controlSnapshot.run.status, 'running')
  assert.strictEqual(controlSnapshot.phase.lastSummary, '')

  let advanced = runtime.advanceRun({ runId: started.run.runId, result: 'passed' }, options)
  assert.strictEqual(advanced.action, 'advanced')
  assert.strictEqual(advanced.run.currentNode, 'evidence')
  assert.strictEqual(advanced.run.status, 'running')

  controlSnapshot = readJson(controlPaths.runControl)
  assert.strictEqual(controlSnapshot.run.currentNode, 'evidence')
  assert.strictEqual(controlSnapshot.history.at(-1).node, 'define-problem')
  assert.strictEqual(controlSnapshot.history.at(-1).result, 'passed')

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

  controlSnapshot = readJson(controlPaths.runControl)
  assert.strictEqual(controlSnapshot.run.status, 'paused')
  assert.strictEqual(controlSnapshot.blocking.reason, 'api-contract')
  assert.deepStrictEqual(controlSnapshot.blocking.signals, ['api-contract'])

  let continued = runtime.continueRun({ runId: started.run.runId }, options)
  assert.strictEqual(continued.action, 'continued')
  assert.strictEqual(continued.run.status, 'running')

  controlSnapshot = readJson(controlPaths.runControl)
  assert.strictEqual(controlSnapshot.run.status, 'running')
  assert.strictEqual(controlSnapshot.blocking.reason, '')

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

  controlSnapshot = readJson(controlPaths.runControl)
  assert.strictEqual(controlSnapshot.run.status, 'aborted')
  assert.strictEqual(controlSnapshot.blocking.reason, 'test cleanup')

  const latestControlSnapshot = readJson(controlPaths.latestControl)
  assert.strictEqual(latestControlSnapshot.run.runId, started.run.runId)
  assert.strictEqual(latestControlSnapshot.run.status, 'aborted')

  const secondStarted = runtime.startRun(
    {
      command: '/ucc-team-standard',
    },
    options,
  )
  assert.strictEqual(secondStarted.action, 'started')

  let secondAdvanced = runtime.advanceRun({ runId: secondStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(secondAdvanced.run.currentNode, 'plan')

  let delegateUpdated = runtime.updateDelegateStatus(
    {
      runId: secondStarted.run.runId,
      delegateId: 'plan-primary',
      name: 'implementation-plan',
      agent: 'planner',
      status: 'running',
      required: true,
      progressLabel: 'planning',
      lastSummary: '拆分任务中',
      lastHeartbeatAt: '2026-03-24T08:00:00.000Z',
      displayOrder: 10,
      subagentId: 'agent-plan-primary',
      ownedPaths: ['workflows/definitions.json'],
      readonlyPaths: ['docs/使用说明.md'],
    },
    options,
  )
  assert.strictEqual(delegateUpdated.action, 'delegate-updated')

  let secondControlSnapshot = readJson(getControlPaths(secondStarted.run.runId).runControl)
  let planDelegate = findDelegate(secondControlSnapshot, 'plan-primary')
  assert.ok(planDelegate, 'delegate 更新后应写入 control snapshot')
  assert.strictEqual(planDelegate.node, 'plan', 'delegate 应记录来源节点')
  assert.strictEqual(planDelegate.status, 'running')
  assert.strictEqual(planDelegate.agent, 'planner')
  assert.strictEqual(planDelegate.required, true)
  assert.strictEqual(planDelegate.progressLabel, 'planning')
  assert.strictEqual(planDelegate.lastSummary, '拆分任务中')
  assert.strictEqual(planDelegate.lastHeartbeatAt, '2026-03-24T08:00:00.000Z')
  assert.strictEqual(planDelegate.displayOrder, 10)
  assert.strictEqual(planDelegate.subagentId, 'agent-plan-primary')
  assert.deepStrictEqual(planDelegate.ownedPaths, ['workflows/definitions.json'])
  assert.deepStrictEqual(planDelegate.readonlyPaths, ['docs/使用说明.md'])
  assert.ok(planDelegate.startedAt, 'running delegate 应记录 startedAt')
  assert.strictEqual(planDelegate.finishedAt, null)

  delegateUpdated = runtime.updateDelegateStatus(
    {
      runId: secondStarted.run.runId,
      delegateId: 'plan-primary',
      status: 'completed',
      summary: 'plan ready',
      signals: ['api-contract'],
    },
    options,
  )
  assert.strictEqual(delegateUpdated.action, 'delegate-updated')

  secondControlSnapshot = readJson(getControlPaths(secondStarted.run.runId).runControl)
  planDelegate = findDelegate(secondControlSnapshot, 'plan-primary')
  assert.strictEqual(planDelegate.node, 'plan', 'completed delegate 应保留来源节点')
  assert.strictEqual(planDelegate.status, 'completed')
  assert.strictEqual(planDelegate.summary, 'plan ready')
  assert.deepStrictEqual(planDelegate.signals, ['api-contract'])
  assert.ok(planDelegate.finishedAt, 'completed delegate 应记录 finishedAt')

  secondAdvanced = runtime.advanceRun({ runId: secondStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(secondAdvanced.run.currentNode, 'implement')

  secondAdvanced = runtime.advanceRun({ runId: secondStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(secondAdvanced.run.currentNode, 'review')

  delegateUpdated = runtime.updateDelegateStatus(
    {
      runId: secondStarted.run.runId,
      delegateId: 'review-primary',
      name: 'code-review',
      agent: 'code-reviewer',
      status: 'completed',
      required: true,
      summary: 'review ready',
    },
    options,
  )
  assert.strictEqual(delegateUpdated.action, 'delegate-updated')

  secondControlSnapshot = readJson(getControlPaths(secondStarted.run.runId).runControl)
  const reviewDelegate = findDelegate(secondControlSnapshot, 'review-primary')
  assert.ok(reviewDelegate, 'review delegate 更新后应写入 control snapshot')
  assert.strictEqual(reviewDelegate.node, 'review', 'review delegate 应记录来源节点')

  let reviewStatusSummary = runtime.formatRunSummary(delegateUpdated.run, { action: 'status' })
  assert.ok(reviewStatusSummary.includes('code-review [completed]'), '当前节点摘要应显示 review delegate')
  assert.ok(!reviewStatusSummary.includes('implementation-plan [completed]'), '当前节点摘要不应显示 plan delegate')
  assert.ok(reviewStatusSummary.includes('当前节点尚未开始验证'), 'review 节点无验证记录时应给出明确提示')

  secondAdvanced = runtime.advanceRun({ runId: secondStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(secondAdvanced.run.currentNode, 'verify')

  const verificationUpdated = runtime.updateVerificationStatus(
    {
      runId: secondStarted.run.runId,
      name: 'tsc',
      status: 'passed',
      source: 'npm run typecheck',
      summary: '0 errors',
      progressLabel: 'typecheck complete',
      lastSummary: '类型检查已完成',
    },
    options,
  )
  assert.strictEqual(verificationUpdated.action, 'verification-updated')

  secondControlSnapshot = readJson(getControlPaths(secondStarted.run.runId).runControl)
  const tscVerification = findVerification(secondControlSnapshot, 'tsc')
  assert.ok(tscVerification, 'verification 更新后应写入 control snapshot')
  assert.strictEqual(tscVerification.node, 'verify', 'verification 应记录来源节点')
  assert.strictEqual(tscVerification.status, 'passed')
  assert.strictEqual(tscVerification.source, 'npm run typecheck')
  assert.strictEqual(tscVerification.summary, '0 errors')
  assert.strictEqual(tscVerification.progressLabel, 'typecheck complete')
  assert.strictEqual(tscVerification.lastSummary, '类型检查已完成')

  const richStatusSummary = runtime.formatRunSummary(verificationUpdated.run, { action: 'status' })
  assert.ok(richStatusSummary.includes('并行委派:'), '状态摘要应包含并行委派区块')
  assert.ok(!richStatusSummary.includes('implementation-plan [completed]'), 'verify 节点摘要不应显示 plan delegate')
  assert.ok(!richStatusSummary.includes('code-review [completed]'), 'verify 节点摘要不应显示 review delegate')
  assert.ok(richStatusSummary.includes('验证状态:'), '状态摘要应包含验证状态区块')
  assert.ok(richStatusSummary.includes('tsc [passed]'), '状态摘要应显示 verification 状态')

  const resetForParallel = runtime.abortRun({ runId: secondStarted.run.runId, reason: 'parallel workflow regression' }, options)
  assert.strictEqual(resetForParallel.action, 'aborted')

  const blockedParallelStarted = runtime.startRun(
    {
      command: '/ucc-team-parallel',
      task: '并行阻塞回退测试',
    },
    options,
  )
  assert.strictEqual(blockedParallelStarted.action, 'started')

  let blockedParallelAdvanced = runtime.advanceRun({ runId: blockedParallelStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(blockedParallelAdvanced.run.currentNode, 'plan')

  blockedParallelAdvanced = runtime.advanceRun({ runId: blockedParallelStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(blockedParallelAdvanced.run.currentNode, 'parallel-implement')

  const blockedParallelResult = runtime.advanceRun(
    {
      runId: blockedParallelStarted.run.runId,
      result: 'blocked',
      summary: 'ownership overlap',
      signals: ['conflict'],
    },
    options,
  )
  assert.strictEqual(blockedParallelResult.action, 'blocked')
  assert.strictEqual(blockedParallelResult.run.profile, 'team.parallel')
  assert.strictEqual(blockedParallelResult.run.currentNode, 'parallel-implement')
  assert.strictEqual(blockedParallelResult.run.nextNode, 'team.standard.implement')
  assert.strictEqual(blockedParallelResult.run.status, 'blocked')

  let blockedParallelControlSnapshot = readJson(getControlPaths(blockedParallelStarted.run.runId).runControl)
  assert.strictEqual(blockedParallelControlSnapshot.blocking.reason, 'conflict')
  assert.deepStrictEqual(blockedParallelControlSnapshot.blocking.signals, ['conflict'])

  const resetBlockedParallel = runtime.abortRun(
    { runId: blockedParallelStarted.run.runId, reason: 'parallel blocked regression' },
    options,
  )
  assert.strictEqual(resetBlockedParallel.action, 'aborted')

  const parallelStarted = runtime.startRun(
    {
      command: '/ucc-team-parallel',
      task: '并行团队交付测试',
    },
    options,
  )
  assert.strictEqual(parallelStarted.action, 'started')
  assert.strictEqual(parallelStarted.run.profile, 'team.parallel')
  assert.strictEqual(parallelStarted.run.currentNode, 'clarify')
  assert.strictEqual(parallelStarted.run.nextNode, 'plan')
  assert.strictEqual(parallelStarted.run.pausePolicy, 'balanced')

  const parallelControlPaths = getControlPaths(parallelStarted.run.runId)
  let parallelAdvanced = runtime.advanceRun({ runId: parallelStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(parallelAdvanced.run.currentNode, 'plan')

  parallelAdvanced = runtime.advanceRun({ runId: parallelStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(parallelAdvanced.run.currentNode, 'parallel-implement')

  let parallelDelegateUpdated = runtime.updateDelegateStatus(
    {
      runId: parallelStarted.run.runId,
      delegateId: 'slice-a',
      name: 'implementation-slice-a',
      agent: 'tdd-guide',
      status: 'completed',
      required: true,
      summary: 'slice a ready',
    },
    options,
  )
  assert.strictEqual(parallelDelegateUpdated.action, 'delegate-updated')

  parallelDelegateUpdated = runtime.updateDelegateStatus(
    {
      runId: parallelStarted.run.runId,
      delegateId: 'slice-b',
      name: 'implementation-slice-b',
      agent: 'tdd-guide',
      status: 'completed',
      required: true,
      summary: 'slice b ready',
    },
    options,
  )
  assert.strictEqual(parallelDelegateUpdated.action, 'delegate-updated')

  let parallelControlSnapshot = readJson(parallelControlPaths.runControl)
  const sliceADelegate = findDelegate(parallelControlSnapshot, 'slice-a')
  const sliceBDelegate = findDelegate(parallelControlSnapshot, 'slice-b')
  assert.ok(sliceADelegate, 'team.parallel delegate A 应写入 control snapshot')
  assert.ok(sliceBDelegate, 'team.parallel delegate B 应写入 control snapshot')
  assert.strictEqual(sliceADelegate.node, 'parallel-implement', 'team.parallel delegate 应记录 parallel-implement 节点')
  assert.strictEqual(sliceBDelegate.node, 'parallel-implement', 'team.parallel delegate 应记录 parallel-implement 节点')

  parallelAdvanced = runtime.advanceRun(
    {
      runId: parallelStarted.run.runId,
      result: 'passed',
      signals: ['conflict'],
    },
    options,
  )
  assert.strictEqual(parallelAdvanced.action, 'paused')
  assert.strictEqual(parallelAdvanced.run.currentNode, 'integrate')
  assert.strictEqual(parallelAdvanced.run.status, 'paused')

  parallelControlSnapshot = readJson(parallelControlPaths.runControl)
  assert.strictEqual(parallelControlSnapshot.blocking.reason, 'conflict')
  assert.deepStrictEqual(parallelControlSnapshot.blocking.signals, ['conflict'])

  let parallelContinued = runtime.continueRun({ runId: parallelStarted.run.runId }, options)
  assert.strictEqual(parallelContinued.action, 'continued')
  assert.strictEqual(parallelContinued.run.status, 'running')

  parallelAdvanced = runtime.advanceRun({ runId: parallelStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(parallelAdvanced.run.currentNode, 'review')

  const conflict = runtime.startRun(
    {
      command: '/ucc-single-research',
    },
    options,
  )
  assert.strictEqual(conflict.action, 'conflict')
  assert.strictEqual(conflict.run.runId, parallelStarted.run.runId)

  const resetAfterParallel = runtime.abortRun({ runId: parallelStarted.run.runId, reason: 'single workflow regression' }, options)
  assert.strictEqual(resetAfterParallel.action, 'aborted')

  const singleStarted = runtime.startRun(
    {
      command: '/ucc-single-standard',
      task: '单人闭环修复任务',
    },
    options,
  )
  assert.strictEqual(singleStarted.action, 'started')
  assert.strictEqual(singleStarted.run.profile, 'single.standard')
  assert.strictEqual(singleStarted.run.currentNode, 'clarify')
  assert.strictEqual(singleStarted.run.nextNode, 'plan')
  assert.strictEqual(singleStarted.run.pausePolicy, 'auto')

  let singleAdvanced = runtime.advanceRun({ runId: singleStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(singleAdvanced.action, 'advanced')
  assert.strictEqual(singleAdvanced.run.currentNode, 'plan')

  singleAdvanced = runtime.advanceRun({ runId: singleStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(singleAdvanced.run.currentNode, 'implement')

  singleAdvanced = runtime.advanceRun({ runId: singleStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(singleAdvanced.run.currentNode, 'review')

  singleAdvanced = runtime.advanceRun({ runId: singleStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(singleAdvanced.run.currentNode, 'verify')

  singleAdvanced = runtime.advanceRun({ runId: singleStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(singleAdvanced.run.currentNode, 'summary')

  singleAdvanced = runtime.advanceRun({ runId: singleStarted.run.runId, result: 'passed' }, options)
  assert.strictEqual(singleAdvanced.action, 'completed')
  assert.strictEqual(singleAdvanced.run.status, 'completed')
  assert.strictEqual(runtime.getActiveRunMeta(options), null)

  const singleResearch = runtime.startRun(
    {
      command: '/ucc-single-research',
      task: '单人调研接力测试',
    },
    options,
  )
  assert.strictEqual(singleResearch.action, 'started')
  assert.strictEqual(singleResearch.run.profile, 'single.research')
  assert.strictEqual(singleResearch.run.currentNode, 'define-problem')

  let singleResearchAdvanced = runtime.advanceRun({ runId: singleResearch.run.runId, result: 'passed' }, options)
  assert.strictEqual(singleResearchAdvanced.run.currentNode, 'evidence')

  singleResearchAdvanced = runtime.advanceRun({ runId: singleResearch.run.runId, result: 'passed' }, options)
  assert.strictEqual(singleResearchAdvanced.run.currentNode, 'conclusion')

  singleResearchAdvanced = runtime.advanceRun({ runId: singleResearch.run.runId, result: 'passed' }, options)
  assert.strictEqual(singleResearchAdvanced.run.currentNode, 'next-action')

  singleResearchAdvanced = runtime.advanceRun({ runId: singleResearch.run.runId, result: 'passed' }, options)
  assert.strictEqual(singleResearchAdvanced.action, 'advanced')
  assert.strictEqual(singleResearchAdvanced.run.profile, 'single.standard')
  assert.strictEqual(singleResearchAdvanced.run.currentNode, 'plan')
} finally {
  fs.rmSync(tempBase, { recursive: true, force: true })
}

console.log('workflow-runtime.test.js 通过')
