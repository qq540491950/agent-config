#!/usr/bin/env node

'use strict'

const {
  advanceRun,
  abortRun,
  continueRun,
  formatRunSummary,
  getRunStatus,
  resumeRun,
  startRun,
  updateDelegateStatus,
  updateVerificationStatus,
} = require('../lib/workflow-runtime')

function parseArgs(argv) {
  const [command = '', ...rest] = argv
  const flags = {}

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = rest[i + 1]
    if (!next || next.startsWith('--')) {
      flags[key] = true
      continue
    }
    flags[key] = next
    i += 1
  }

  return { command, flags }
}

function printUsage() {
  console.log('UCC workflow runner')
  console.log('')
  console.log('用法:')
  console.log('  node .claude/scripts/workflow/runner.js start --command <public-command> [--task <text>]')
  console.log('  node .claude/scripts/workflow/runner.js start --profile <profile> [--entry <command>] [--node <node>] [--task <text>]')
  console.log('  node .claude/scripts/workflow/runner.js advance [--run <runId>] --result <passed|blocked|failed> [--summary <text>] [--artifacts a,b] [--signals s1,s2]')
  console.log('  node .claude/scripts/workflow/runner.js delegate [--run <runId>] --delegate <id> [--name <name>] [--agent <agent>] [--status <status>] [--required true|false] [--summary <text>] [--signals s1,s2] [--reason <text>]')
  console.log('  node .claude/scripts/workflow/runner.js verification [--run <runId>] --name <name> [--status <status>] [--source <text>] [--summary <text>] [--signals s1,s2] [--reason <text>]')
  console.log('  node .claude/scripts/workflow/runner.js status [--run <runId>]')
  console.log('  node .claude/scripts/workflow/runner.js continue [--run <runId>]')
  console.log('  node .claude/scripts/workflow/runner.js abort [--run <runId>] [--reason <text>]')
  console.log('')
  console.log('兼容命令: resume -> continue')
}

function main() {
  const { command, flags } = parseArgs(process.argv.slice(2))

  if (!command || flags.help) {
    printUsage()
    process.exit(command ? 0 : 1)
  }

  let result
  switch (command) {
    case 'start':
      if (!flags.profile && !flags.command) {
        throw new Error('start 缺少 --command 或 --profile')
      }
      result = startRun({
        profile: flags.profile,
        command: flags.command || '',
        entryCommand: flags.entry || '',
        node: flags.node,
        task: flags.task || '',
        approvalMode: flags['approval-mode'] || '',
        executionMode: flags['execution-mode'] || '',
        pausePolicy: flags['pause-policy'] || '',
      })
      break
    case 'advance':
      result = advanceRun({
        runId: flags.run || '',
        result: flags.result || 'passed',
        summary: flags.summary || '',
        artifacts: flags.artifacts || '',
        signals: flags.signals || '',
        pauseReason: flags['pause-reason'] || '',
      })
      break
    case 'status':
      result = getRunStatus({
        runId: flags.run || '',
      })
      break
    case 'delegate':
      result = updateDelegateStatus({
        runId: flags.run || '',
        delegateId: flags.delegate || flags['delegate-id'] || '',
        name: flags.name || '',
        agent: flags.agent || '',
        status: flags.status || 'pending',
        required: flags.required,
        summary: flags.summary || '',
        signals: flags.signals || '',
        reason: flags.reason || '',
      })
      break
    case 'verification':
      result = updateVerificationStatus({
        runId: flags.run || '',
        name: flags.name || '',
        status: flags.status || 'pending',
        source: flags.source || '',
        summary: flags.summary || '',
        signals: flags.signals || '',
        reason: flags.reason || '',
      })
      break
    case 'continue':
      result = continueRun({
        runId: flags.run || '',
      })
      break
    case 'resume':
      result = resumeRun({
        runId: flags.run || '',
      })
      break
    case 'abort':
      result = abortRun({
        runId: flags.run || '',
        reason: flags.reason || '',
      })
      break
    default:
      throw new Error(`未知命令: ${command}`)
  }

  console.log(formatRunSummary(result.run, { action: result.action, controlPlane: result.controlPlane || null }))
}

try {
  main()
} catch (error) {
  console.error(`workflow runner 失败: ${error.message}`)
  process.exit(1)
}
