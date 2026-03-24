#!/usr/bin/env node

'use strict'

const path = require('path')
const {
  FINAL_RUN_STATUSES,
  filterItemsForCurrentNode,
  getActiveRunMeta,
  getDisplaySummary,
  getRunStatus,
  getWorkflowPaths,
  readJson,
  sortDisplayItems,
} = require('../lib/workflow-runtime')

function parseArgs(argv) {
  const flags = {}

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue

    const key = token.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      flags[key] = true
      continue
    }

    flags[key] = next
    i += 1
  }

  return flags
}

function normalizeInterval(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 1000
  return Math.max(250, parsed)
}

function loadLiveStatusState(params = {}, options = {}) {
  const activeMeta = getActiveRunMeta(options)
  const runId = params.runId || params.run || (activeMeta && activeMeta.runId) || ''
  if (!runId) {
    return {
      run: null,
      controlPlane: null,
      runId: '',
      usedFallback: false,
    }
  }

  const workflowPaths = getWorkflowPaths(options)
  const controlPath = path.join(workflowPaths.controlDir, `${runId}.json`)
  const usedFallback = !readJson(controlPath)
  const status = getRunStatus({ runId }, options)

  return {
    ...status,
    runId,
    usedFallback,
  }
}

function renderSummarySection(summary) {
  return summary ? `- ${summary}` : '- none'
}

function renderDelegate(delegate) {
  const parts = [`- ${delegate.name || delegate.delegateId} [${delegate.status}]`]
  if (delegate.agent) parts.push(`agent=${delegate.agent}`)
  if (delegate.progressLabel) parts.push(`progress=${delegate.progressLabel}`)
  const summary = getDisplaySummary(delegate)
  if (summary) parts.push(`summary=${summary}`)
  return parts.join(' ')
}

function renderVerification(item) {
  const parts = [`- ${item.name} [${item.status}]`]
  if (item.source) parts.push(`source=${item.source}`)
  if (item.progressLabel) parts.push(`progress=${item.progressLabel}`)
  const summary = getDisplaySummary(item)
  if (summary) parts.push(`summary=${summary}`)
  return parts.join(' ')
}

function renderBlocking(blocking) {
  if (!blocking) return '- none'

  const parts = []
  if (blocking.reason) parts.push(`reason=${blocking.reason}`)
  if (Array.isArray(blocking.signals) && blocking.signals.length > 0) {
    parts.push(`signals=${blocking.signals.join(',')}`)
  }
  if (Array.isArray(blocking.failedDelegates) && blocking.failedDelegates.length > 0) {
    parts.push(`failedDelegates=${blocking.failedDelegates.join(',')}`)
  }

  return parts.length > 0 ? `- ${parts.join(' ')}` : '- none'
}

function renderPanel(run, controlPlane, meta = {}) {
  const lines = ['workflow runtime']

  if (!run) {
    lines.push('status: idle')
    lines.push('')
    lines.push('recent summary')
    lines.push('- 当前没有活动 workflow run。')
    return lines.join('\n')
  }

  const activeControlPlane = controlPlane || { delegates: [], verification: [], blocking: null, phase: null }
  const delegates = sortDisplayItems(filterItemsForCurrentNode(activeControlPlane.delegates, run.currentNode))
  const verification = sortDisplayItems(filterItemsForCurrentNode(activeControlPlane.verification, run.currentNode))

  lines.push(`trigger: ${run.entryCommand || 'workflow-runtime'}`)
  lines.push(`runId: ${run.runId}`)
  lines.push(`profile: ${run.profile}`)
  lines.push(`node: ${run.currentNode || 'completed'}`)
  lines.push(`next: ${run.nextNode || 'none'}`)
  lines.push(`status: ${run.status}`)
  lines.push(`pausePolicy: ${run.pausePolicy}`)
  if (meta.usedFallback) {
    lines.push('snapshot: fallback-to-run-state')
  }
  lines.push('')
  lines.push('recent summary')
  lines.push(renderSummarySection(activeControlPlane.phase && activeControlPlane.phase.lastSummary))
  lines.push('')
  lines.push('delegates')
  if (delegates.length > 0) {
    delegates.forEach((delegate) => {
      lines.push(renderDelegate(delegate))
    })
  } else {
    lines.push('- none')
  }
  lines.push('')
  lines.push('verification')
  if (verification.length > 0) {
    verification.forEach((item) => {
      lines.push(renderVerification(item))
    })
  } else if (run.currentNode) {
    lines.push('- current node has not started verification yet')
  } else {
    lines.push('- none')
  }
  lines.push('')
  lines.push('blocking')
  lines.push(renderBlocking(activeControlPlane.blocking))

  return lines.join('\n')
}

function writePanel(output, options = {}) {
  if (options.clear && process.stdout.isTTY) {
    process.stdout.write('\x1bc')
  }
  process.stdout.write(`${output}\n`)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function watchRun(params = {}, options = {}) {
  const snapshot = params.snapshot === true
  const intervalMs = normalizeInterval(params.intervalMs || params.interval)
  let previousOutput = ''

  while (true) {
    const state = loadLiveStatusState(params, options)
    const output = renderPanel(state.run, state.controlPlane, { usedFallback: state.usedFallback })

    if (output !== previousOutput) {
      writePanel(output, { clear: !snapshot })
      previousOutput = output
    }

    if (snapshot || !state.run || FINAL_RUN_STATUSES.has(state.run.status)) {
      return state
    }

    await sleep(intervalMs)
  }
}

async function main() {
  const flags = parseArgs(process.argv.slice(2))
  await watchRun({
    runId: flags.run || '',
    snapshot: flags.snapshot === true,
    intervalMs: flags.interval || '',
  })
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`workflow live status 失败: ${error.message}`)
    process.exit(1)
  })
}

module.exports = {
  loadLiveStatusState,
  parseArgs,
  renderPanel,
  watchRun,
}
