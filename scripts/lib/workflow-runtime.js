#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const { ensureDir, appendFile, readFile, writeFile } = require('./utils')

const ACTIVE_RUN_STATUSES = new Set(['running', 'paused', 'blocked', 'failed'])
const FINAL_RUN_STATUSES = new Set(['completed', 'aborted'])
const DEFAULT_EXECUTION_MODE = 'auto'
const DEFAULT_PAUSE_POLICY = 'balanced'
const LEGACY_APPROVAL_MODE = 'stage'
const STALE_MS = 24 * 60 * 60 * 1000
const DEFAULT_PAUSE_POLICIES = {
  auto: ['build-failed', 'typecheck-failed', 'test-failed', 'dangerous-change', 'executor-error', 'conflict'],
  balanced: [
    'build-failed',
    'typecheck-failed',
    'test-failed',
    'dangerous-change',
    'executor-error',
    'conflict',
    'db-migration',
    'api-contract',
    'auth-change',
    'mass-rename',
    'config-sensitive',
    'doc-conflict',
  ],
  strict: [
    'build-failed',
    'typecheck-failed',
    'test-failed',
    'dangerous-change',
    'executor-error',
    'conflict',
    'db-migration',
    'api-contract',
    'auth-change',
    'mass-rename',
    'config-sensitive',
    'doc-conflict',
    'quality-gate',
    'security-high',
    'coverage-low',
    'major-dependency',
  ],
}

function nowIso() {
  return new Date().toISOString()
}

function readJson(filePath, fallback = null) {
  const content = readFile(filePath)
  if (!content) return fallback
  try {
    return JSON.parse(content)
  } catch {
    return fallback
  }
}

function writeJson(filePath, value) {
  writeFile(filePath, JSON.stringify(value, null, 2) + '\n')
}

function getPluginRoot(options = {}) {
  return options.pluginRoot || process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..', '..')
}

function getDefinitionsPath(options = {}) {
  return path.join(getPluginRoot(options), 'workflows', 'definitions.json')
}

function loadDefinitions(options = {}) {
  const definitions = readJson(getDefinitionsPath(options))
  if (!definitions || !definitions.profiles) {
    throw new Error('workflow definitions 不存在或格式无效')
  }
  return definitions
}

function getProjectRoot(options = {}) {
  return options.projectRoot || process.cwd()
}

function getWorkflowRoot(options = {}) {
  return path.join(getProjectRoot(options), '.claude', 'workflows')
}

function getWorkflowPaths(options = {}) {
  const root = getWorkflowRoot(options)
  return {
    root,
    runsDir: path.join(root, 'runs'),
    eventsDir: path.join(root, 'events'),
    controlDir: path.join(root, 'control'),
    locksDir: path.join(root, 'locks'),
    activeFile: path.join(root, 'active.json'),
    latestControlFile: path.join(root, 'control', 'latest.json'),
  }
}

function ensureWorkflowLayout(options = {}) {
  const paths = getWorkflowPaths(options)
  ensureDir(paths.root)
  ensureDir(paths.runsDir)
  ensureDir(paths.eventsDir)
  ensureDir(paths.controlDir)
  ensureDir(paths.locksDir)
  return paths
}

function makeRunPath(runId, options = {}) {
  return path.join(getWorkflowPaths(options).runsDir, `${runId}.json`)
}

function makeEventPath(runId, options = {}) {
  return path.join(getWorkflowPaths(options).eventsDir, `${runId}.ndjson`)
}

function makeControlPath(runId, options = {}) {
  return path.join(getWorkflowPaths(options).controlDir, `${runId}.json`)
}

function appendEvent(runId, event, options = {}) {
  const eventPath = makeEventPath(runId, options)
  appendFile(
    eventPath,
    JSON.stringify({
      timestamp: nowIso(),
      runId,
      ...event,
    }) + '\n',
  )
}

function buildControlPlaneSnapshot(run) {
  const history = Array.isArray(run.history) ? run.history.slice(-5) : []
  const phaseState = run.controlPlane && run.controlPlane.phase ? run.controlPlane.phase : null
  const blockingState = run.controlPlane && run.controlPlane.blocking ? run.controlPlane.blocking : null

  return {
    run: {
      runId: run.runId,
      profile: run.profile,
      mode: run.mode,
      status: run.status,
      entryCommand: run.entryCommand,
      currentNode: run.currentNode,
      currentPhase: run.currentPhase,
      nextNode: run.nextNode,
      executionMode: run.executionMode,
      pausePolicy: run.pausePolicy,
      updatedAt: run.updatedAt,
    },
    phase: {
      startedAt: phaseState ? phaseState.startedAt : run.startedAt,
      lastSummary: phaseState ? phaseState.lastSummary : '',
      lastSignals: phaseState ? phaseState.lastSignals : [],
      lastArtifacts: phaseState ? phaseState.lastArtifacts : [],
    },
    delegates: run.controlPlane && Array.isArray(run.controlPlane.delegates) ? run.controlPlane.delegates : [],
    verification: run.controlPlane && Array.isArray(run.controlPlane.verification) ? run.controlPlane.verification : [],
    blocking: {
      reason: blockingState ? blockingState.reason : '',
      signals: blockingState ? blockingState.signals : [],
      failedDelegates: blockingState ? blockingState.failedDelegates : [],
      updatedAt: blockingState ? blockingState.updatedAt : run.updatedAt,
    },
    history,
  }
}

function ensureControlPlaneState(run) {
  if (!run.controlPlane) {
    run.controlPlane = {}
  }

  if (!run.controlPlane.phase) {
    run.controlPlane.phase = {
      startedAt: run.startedAt || nowIso(),
      lastSummary: '',
      lastSignals: [],
      lastArtifacts: [],
    }
  }

  if (!Array.isArray(run.controlPlane.delegates)) {
    run.controlPlane.delegates = []
  }

  if (!Array.isArray(run.controlPlane.verification)) {
    run.controlPlane.verification = []
  }

  if (!run.controlPlane.blocking) {
    run.controlPlane.blocking = {
      reason: '',
      signals: [],
      failedDelegates: [],
      updatedAt: run.updatedAt || nowIso(),
    }
  }

  return run.controlPlane
}

function writeControlPlaneSnapshot(run, options = {}) {
  const paths = ensureWorkflowLayout(options)
  ensureControlPlaneState(run)
  const snapshot = buildControlPlaneSnapshot(run)
  writeJson(makeControlPath(run.runId, options), snapshot)
  writeJson(paths.latestControlFile, snapshot)
  return snapshot
}

function getControlPlaneSnapshot(params = {}, options = {}) {
  const activeMeta = getActiveRunMeta(options)
  const runId = params.runId || params.run || (activeMeta && activeMeta.runId)
  if (!runId) {
    return null
  }

  const snapshot = readJson(makeControlPath(runId, options))
  if (snapshot) {
    return snapshot
  }

  const run = loadRun(runId, options)
  return buildControlPlaneSnapshot(run)
}

function normalizeBoolean(value, fallback = null) {
  if (value === true || value === false) return value
  if (value == null || value === '') return fallback
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return fallback
}

function updateDelegateStatus(params = {}, options = {}) {
  const activeMeta = getActiveRunMeta(options)
  const runId = params.runId || params.run || (activeMeta && activeMeta.runId)
  if (!runId) {
    throw new Error('delegate 缺少 runId，且当前没有 active run')
  }

  const delegateId = params.delegateId || params.delegate || params.id || ''
  if (!delegateId) {
    throw new Error('delegate 缺少 delegateId')
  }

  const run = loadRun(runId, options)
  const controlPlane = ensureControlPlaneState(run)
  const signals = parseList(params.signals)
  const now = nowIso()
  const required = normalizeBoolean(params.required)
  const name = params.name || ''
  const agent = params.agent || ''
  const status = params.status || 'pending'
  const summary = params.summary
  const reason = params.reason || ''

  let delegate = controlPlane.delegates.find((item) => item.delegateId === delegateId)
  if (!delegate) {
    delegate = {
      delegateId,
      name: name || delegateId,
      agent: agent || '',
      status: 'pending',
      required: required === null ? false : required,
      startedAt: null,
      finishedAt: null,
      summary: '',
      signals: [],
    }
    controlPlane.delegates.push(delegate)
  }

  if (name) delegate.name = name
  if (agent) delegate.agent = agent
  if (required !== null) delegate.required = required
  delegate.status = status
  if (summary !== undefined) delegate.summary = summary
  if (params.signals !== undefined) delegate.signals = signals

  if (!delegate.startedAt && status !== 'pending') {
    delegate.startedAt = now
  }

  if (['completed', 'blocked', 'failed', 'skipped'].includes(status)) {
    delegate.finishedAt = now
  } else if (status === 'running') {
    delegate.finishedAt = null
  }

  if (status === 'blocked' || status === 'failed') {
    const failedDelegates = new Set(controlPlane.blocking.failedDelegates || [])
    failedDelegates.add(delegateId)
    controlPlane.blocking = {
      reason: reason || summary || status,
      signals,
      failedDelegates: [...failedDelegates],
      updatedAt: now,
    }
  }

  appendEvent(
    run.runId,
    {
      type: 'delegate',
      node: run.currentNode,
      delegateId,
      name: delegate.name,
      agent: delegate.agent,
      status,
      required: delegate.required,
      summary: delegate.summary,
      signals: delegate.signals,
    },
    options,
  )

  return {
    action: 'delegate-updated',
    run: saveRun(run, options),
  }
}

function updateVerificationStatus(params = {}, options = {}) {
  const activeMeta = getActiveRunMeta(options)
  const runId = params.runId || params.run || (activeMeta && activeMeta.runId)
  if (!runId) {
    throw new Error('verification 缺少 runId，且当前没有 active run')
  }

  const name = params.name || params.verification || ''
  if (!name) {
    throw new Error('verification 缺少 name')
  }

  const run = loadRun(runId, options)
  const controlPlane = ensureControlPlaneState(run)
  const status = params.status || 'pending'
  const summary = params.summary
  const source = params.source
  const signals = parseList(params.signals)
  const reason = params.reason || ''
  const now = nowIso()

  let verification = controlPlane.verification.find((item) => item.name === name)
  if (!verification) {
    verification = {
      name,
      status: 'pending',
      source: '',
      summary: '',
      signals: [],
      updatedAt: now,
    }
    controlPlane.verification.push(verification)
  }

  verification.status = status
  if (source !== undefined) verification.source = source
  if (summary !== undefined) verification.summary = summary
  if (params.signals !== undefined) verification.signals = signals
  verification.updatedAt = now

  if (status === 'failed' || status === 'blocked') {
    controlPlane.blocking = {
      reason: reason || summary || status,
      signals,
      failedDelegates: controlPlane.blocking.failedDelegates || [],
      updatedAt: now,
    }
  }

  appendEvent(
    run.runId,
    {
      type: 'verification',
      node: run.currentNode,
      name,
      status,
      source: verification.source,
      summary: verification.summary,
      signals: verification.signals,
    },
    options,
  )

  return {
    action: 'verification-updated',
    run: saveRun(run, options),
  }
}

function getProfile(definitions, profile) {
  const value = definitions.profiles[profile]
  if (!value) {
    throw new Error(`未知 workflow profile: ${profile}`)
  }
  return value
}

function getNode(definitions, profile, nodeName) {
  const profileDef = getProfile(definitions, profile)
  const nodes = profileDef.nodes || {}
  const node = nodes[nodeName]
  if (!node) {
    throw new Error(`workflow profile ${profile} 不包含节点 ${nodeName}`)
  }
  return node
}

function getModeForProfile(definitions, profile) {
  return getProfile(definitions, profile).mode
}

function getPausePolicies(definitions) {
  return definitions.pausePolicies || DEFAULT_PAUSE_POLICIES
}

function getPauseSignalsForPolicy(definitions, pausePolicy) {
  const policies = getPausePolicies(definitions)
  return Array.isArray(policies[pausePolicy]) ? policies[pausePolicy] : policies[DEFAULT_PAUSE_POLICY]
}

function normalizeTransition(definitions, currentProfile, transition) {
  if (!transition) return null
  const nextProfile = transition.profile || currentProfile
  const nextNode = transition.node
  if (!nextNode) {
    throw new Error(`workflow transition 缺少 node: ${JSON.stringify(transition)}`)
  }
  getNode(definitions, nextProfile, nextNode)
  return {
    profile: nextProfile,
    node: nextNode,
  }
}

function renderTransition(transition, currentProfile) {
  if (!transition) return '无'
  if (transition.profile === currentProfile) return transition.node
  return `${transition.profile}.${transition.node}`
}

function isStale(run) {
  if (!run || !run.updatedAt) return false
  const updatedAtMs = Date.parse(run.updatedAt)
  if (Number.isNaN(updatedAtMs)) return false
  return Date.now() - updatedAtMs > STALE_MS
}

function getActiveRunMeta(options = {}) {
  const paths = ensureWorkflowLayout(options)
  return readJson(paths.activeFile)
}

function setActiveRunMeta(meta, options = {}) {
  const paths = ensureWorkflowLayout(options)
  if (!meta) {
    if (fs.existsSync(paths.activeFile)) {
      fs.rmSync(paths.activeFile, { force: true })
    }
    return
  }
  writeJson(paths.activeFile, meta)
}

function loadRun(runId, options = {}) {
  const run = readJson(makeRunPath(runId, options))
  if (!run) {
    throw new Error(`workflow run 不存在: ${runId}`)
  }
  return run
}

function saveRun(run, options = {}) {
  run.updatedAt = nowIso()
  writeJson(makeRunPath(run.runId, options), run)

  if (ACTIVE_RUN_STATUSES.has(run.status)) {
    setActiveRunMeta(
      {
        runId: run.runId,
        profile: run.profile,
        mode: run.mode,
        currentNode: run.currentNode,
        status: run.status,
        updatedAt: run.updatedAt,
      },
      options,
    )
  } else if (FINAL_RUN_STATUSES.has(run.status)) {
    const active = getActiveRunMeta(options)
    if (active && active.runId === run.runId) {
      setActiveRunMeta(null, options)
    }
  }

  writeControlPlaneSnapshot(run, options)

  return run
}

function createRunId(profile) {
  const compactProfile = String(profile || 'wf')
    .replace(/[^a-z0-9]+/gi, '')
    .toLowerCase()
    .slice(0, 10)
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  const random = Math.random().toString(36).slice(2, 8)
  return `wf_${stamp}_${compactProfile}_${random}`
}

function parseList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeExecutionMode(value) {
  return value === 'manual' ? 'manual' : DEFAULT_EXECUTION_MODE
}

function normalizePausePolicy(definitions, value) {
  const policy = String(value || DEFAULT_PAUSE_POLICY)
  return getPausePolicies(definitions)[policy] ? policy : DEFAULT_PAUSE_POLICY
}

function getDefaultExecutionMode(profileDef, params = {}) {
  if (params.executionMode) return normalizeExecutionMode(params.executionMode)
  if (params.approvalMode === LEGACY_APPROVAL_MODE) return 'manual'
  return normalizeExecutionMode(profileDef.executionModeDefault)
}

function getDefaultPausePolicy(definitions, profileDef, params = {}) {
  return normalizePausePolicy(definitions, params.pausePolicy || profileDef.pausePolicyDefault)
}

function findProfileByCommand(definitions, command) {
  if (!command) return null
  const profiles = Object.entries(definitions.profiles)
  for (const [profileName, profileDef] of profiles) {
    if (profileDef.publicCommand === command) {
      return {
        profile: profileName,
        node: profileDef.entryNode,
        entryCommand: command,
      }
    }

    const aliases = parseList(profileDef.legacyCommands)
    if (aliases.includes(command)) {
      return {
        profile: profileName,
        node: profileDef.entryNode,
        entryCommand: command,
      }
    }
  }
  return null
}

function resolveStartRequest(definitions, params = {}) {
  if (params.profile) {
    const profileDef = getProfile(definitions, params.profile)
    return {
      profile: params.profile,
      node: params.node || profileDef.entryNode,
      entryCommand: params.entryCommand || params.entry || params.command || profileDef.publicCommand || params.profile,
    }
  }

  const command = params.command || params.entryCommand || params.entry || ''
  const resolved = findProfileByCommand(definitions, command)
  if (!resolved) {
    throw new Error(`未知 workflow 入口命令: ${command || '<empty>'}`)
  }

  return {
    profile: resolved.profile,
    node: params.node || resolved.node,
    entryCommand: resolved.entryCommand,
  }
}

function canJoinActiveRun(definitions, activeRun, profile, requestedNode) {
  if (!activeRun) return false
  if (!ACTIVE_RUN_STATUSES.has(activeRun.status)) return false
  if (activeRun.profile === profile) return true
  if (requestedNode) {
    const profileDef = getProfile(definitions, activeRun.profile)
    const nodes = profileDef.nodes || {}
    if (nodes[requestedNode]) return true
  }
  return false
}

function computePauseState(definitions, run, signals, explicitReason = '') {
  if (run.executionMode === 'manual') {
    return {
      shouldPause: true,
      reason: explicitReason || 'manual-checkpoint',
      signals,
    }
  }

  if (signals.length === 0) {
    return {
      shouldPause: false,
      reason: '',
      signals: [],
    }
  }

  const pauseSignals = new Set(getPauseSignalsForPolicy(definitions, run.pausePolicy))
  const matchedSignals = signals.filter((signal) => pauseSignals.has(signal))
  return {
    shouldPause: matchedSignals.length > 0,
    reason: explicitReason || matchedSignals[0] || '',
    signals: matchedSignals,
  }
}

function startRun(params = {}, options = {}) {
  const definitions = loadDefinitions(options)
  ensureWorkflowLayout(options)

  const request = resolveStartRequest(definitions, params)
  const profile = request.profile
  const entryCommand = request.entryCommand || ''
  const requestedNode = request.node
  const profileDef = getProfile(definitions, profile)
  const task = params.task || ''

  const activeMeta = getActiveRunMeta(options)
  if (activeMeta) {
    const activeRun = loadRun(activeMeta.runId, options)
    if (canJoinActiveRun(definitions, activeRun, profile, requestedNode)) {
      if (entryCommand) {
        activeRun.triggerChain.push(entryCommand)
      }
      activeRun.lastTrigger = {
        entryCommand,
        requestedProfile: profile,
        requestedNode,
        triggeredAt: nowIso(),
      }
      appendEvent(
        activeRun.runId,
        {
          type: 'join',
          entryCommand,
          requestedProfile: profile,
          requestedNode,
        },
        options,
      )
      saveRun(activeRun, options)
      return {
        action: 'joined',
        run: activeRun,
      }
    }

    return {
      action: 'conflict',
      run: activeRun,
    }
  }

  const nodeDef = getNode(definitions, profile, requestedNode)
  const firstTransition = normalizeTransition(definitions, profile, nodeDef.nextOnSuccess)
  const run = {
    runId: createRunId(profile),
    mode: profileDef.mode,
    profile,
    entryCommand,
    entryNode: requestedNode,
    task,
    triggerChain: [entryCommand || profile, profile, requestedNode].filter(Boolean),
    currentNode: requestedNode,
    currentPhase: nodeDef.phase,
    nextNode: renderTransition(firstTransition, profile),
    nextTransition: firstTransition,
    status: 'running',
    executionMode: getDefaultExecutionMode(profileDef, params),
    pausePolicy: getDefaultPausePolicy(definitions, profileDef, params),
    pauseState: {
      required: false,
      reason: '',
      signals: [],
      pausedAtNode: null,
      lastContinuedNode: null,
    },
    artifacts: [],
    history: [],
    controlPlane: {
      phase: {
        startedAt: nowIso(),
        lastSummary: '',
        lastSignals: [],
        lastArtifacts: [],
      },
      delegates: [],
      verification: [],
      blocking: {
        reason: '',
        signals: [],
        failedDelegates: [],
        updatedAt: nowIso(),
      },
    },
    startedAt: nowIso(),
    updatedAt: nowIso(),
  }

  saveRun(run, options)
  appendEvent(
    run.runId,
    {
      type: 'start',
      profile,
      entryCommand,
      entryNode: requestedNode,
      task,
      executionMode: run.executionMode,
      pausePolicy: run.pausePolicy,
    },
    options,
  )

  return {
    action: 'started',
    run,
  }
}

function advanceRun(params = {}, options = {}) {
  const definitions = loadDefinitions(options)
  ensureWorkflowLayout(options)

  const activeMeta = getActiveRunMeta(options)
  const runId = params.runId || params.run || (activeMeta && activeMeta.runId)
  if (!runId) {
    throw new Error('advance 缺少 runId，且当前没有 active run')
  }

  const result = params.result || 'passed'
  const summary = params.summary || ''
  const artifacts = parseList(params.artifacts)
  const signals = parseList(params.signals || params['pause-signals'])
  const pauseReason = params.pauseReason || params['pause-reason'] || ''

  const run = loadRun(runId, options)
  const nodeDef = getNode(definitions, run.profile, run.currentNode)

  run.history.push({
    node: run.currentNode,
    phase: run.currentPhase,
    result,
    summary,
    artifacts,
    signals,
    completedAt: nowIso(),
  })
  run.artifacts.push(...artifacts)
  run.controlPlane.phase = {
    startedAt: run.controlPlane.phase.startedAt,
    lastSummary: summary,
    lastSignals: signals,
    lastArtifacts: artifacts,
  }

  if (result === 'failed') {
    run.status = 'failed'
    run.nextNode = '无'
    run.nextTransition = null
    run.pauseState = {
      required: true,
      reason: pauseReason || signals[0] || 'failed',
      signals,
      pausedAtNode: run.currentNode,
      lastContinuedNode: run.pauseState.lastContinuedNode || null,
    }
    run.controlPlane.blocking = {
      reason: pauseReason || signals[0] || 'failed',
      signals,
      failedDelegates: [],
      updatedAt: nowIso(),
    }
    appendEvent(run.runId, { type: 'advance', node: run.currentNode, result, summary, artifacts, signals }, options)
    return {
      action: 'failed',
      run: saveRun(run, options),
    }
  }

  if (result === 'blocked') {
    const blockedTransition = normalizeTransition(definitions, run.profile, nodeDef.nextOnBlocked)
    run.status = 'blocked'
    run.nextNode = renderTransition(blockedTransition, run.profile)
    run.nextTransition = blockedTransition
    run.pauseState = {
      required: true,
      reason: pauseReason || signals[0] || 'blocked',
      signals,
      pausedAtNode: run.currentNode,
      lastContinuedNode: run.pauseState.lastContinuedNode || null,
    }
    run.controlPlane.blocking = {
      reason: pauseReason || signals[0] || 'blocked',
      signals,
      failedDelegates: [],
      updatedAt: nowIso(),
    }
    appendEvent(run.runId, { type: 'advance', node: run.currentNode, result, summary, artifacts, signals }, options)
    return {
      action: 'blocked',
      run: saveRun(run, options),
    }
  }

  const nextTransition = normalizeTransition(definitions, run.profile, nodeDef.nextOnSuccess)
  if (!nextTransition) {
    const completedNode = run.currentNode
    run.status = 'completed'
    run.currentNode = null
    run.currentPhase = null
    run.nextNode = '无'
    run.nextTransition = null
    run.pauseState = {
      required: false,
      reason: '',
      signals: [],
      pausedAtNode: null,
      lastContinuedNode: run.pauseState.lastContinuedNode || null,
    }
    run.controlPlane.blocking = {
      reason: '',
      signals: [],
      failedDelegates: [],
      updatedAt: nowIso(),
    }
    appendEvent(run.runId, { type: 'advance', node: completedNode, result, summary, artifacts, signals }, options)
    return {
      action: 'completed',
      run: saveRun(run, options),
    }
  }

  const previousProfile = run.profile
  run.profile = nextTransition.profile
  run.mode = getModeForProfile(definitions, nextTransition.profile)
  run.currentNode = nextTransition.node
  run.currentPhase = getNode(definitions, nextTransition.profile, nextTransition.node).phase
  run.triggerChain.push(
    ...(nextTransition.profile === previousProfile ? [] : [nextTransition.profile]),
    nextTransition.node,
  )

  const nextNodeDef = getNode(definitions, nextTransition.profile, nextTransition.node)
  const followingTransition = normalizeTransition(definitions, nextTransition.profile, nextNodeDef.nextOnSuccess)
  run.nextNode = renderTransition(followingTransition, nextTransition.profile)
  run.nextTransition = followingTransition
  run.controlPlane.phase = {
    startedAt: nowIso(),
    lastSummary: summary,
    lastSignals: signals,
    lastArtifacts: artifacts,
  }

  const pauseDecision = computePauseState(definitions, run, signals, pauseReason)
  if (pauseDecision.shouldPause) {
    run.status = 'paused'
    run.pauseState = {
      required: true,
      reason: pauseDecision.reason,
      signals: pauseDecision.signals,
      pausedAtNode: run.currentNode,
      lastContinuedNode: run.pauseState.lastContinuedNode || null,
    }
    run.controlPlane.blocking = {
      reason: pauseDecision.reason,
      signals: pauseDecision.signals,
      failedDelegates: [],
      updatedAt: nowIso(),
    }
  } else {
    run.status = 'running'
    run.pauseState = {
      required: false,
      reason: '',
      signals: [],
      pausedAtNode: null,
      lastContinuedNode: run.pauseState.lastContinuedNode || null,
    }
    run.controlPlane.blocking = {
      reason: '',
      signals: [],
      failedDelegates: [],
      updatedAt: nowIso(),
    }
  }

  appendEvent(
    run.runId,
    {
      type: 'advance',
      previousProfile,
      nextProfile: run.profile,
      nextNode: run.currentNode,
      result,
      summary,
      artifacts,
      signals,
      pauseDecision,
    },
    options,
  )

  return {
    action: run.status === 'paused' ? 'paused' : 'advanced',
    run: saveRun(run, options),
  }
}

function continueRun(params = {}, options = {}) {
  const activeMeta = getActiveRunMeta(options)
  const runId = params.runId || params.run || (activeMeta && activeMeta.runId)
  if (!runId) {
    return {
      action: 'empty',
      run: null,
    }
  }

  const run = loadRun(runId, options)

  if (run.status !== 'paused') {
    return {
      action: 'noop',
      run,
    }
  }

  run.status = 'running'
  run.pauseState = {
    required: false,
    reason: '',
    signals: [],
    pausedAtNode: null,
    lastContinuedNode: run.currentNode,
  }
  run.controlPlane.blocking = {
    reason: '',
    signals: [],
    failedDelegates: [],
    updatedAt: nowIso(),
  }

  appendEvent(run.runId, { type: 'continue', node: run.currentNode }, options)

  return {
    action: 'continued',
    run: saveRun(run, options),
  }
}

function resumeRun(params = {}, options = {}) {
  return continueRun(params, options)
}

function abortRun(params = {}, options = {}) {
  const activeMeta = getActiveRunMeta(options)
  const runId = params.runId || params.run || (activeMeta && activeMeta.runId)
  if (!runId) {
    return {
      action: 'empty',
      run: null,
    }
  }

  const reason = params.reason || ''
  const run = loadRun(runId, options)
  run.status = 'aborted'
  run.nextNode = '无'
  run.nextTransition = null
  run.controlPlane.blocking = {
    reason,
    signals: [],
    failedDelegates: [],
    updatedAt: nowIso(),
  }
  appendEvent(run.runId, { type: 'abort', reason }, options)
  return {
    action: 'aborted',
    run: saveRun(run, options),
  }
}

function getRunStatus(params = {}, options = {}) {
  const activeMeta = getActiveRunMeta(options)
  const runId = params.runId || params.run || (activeMeta && activeMeta.runId)
  if (!runId) {
    return {
      action: 'empty',
      run: null,
      controlPlane: null,
    }
  }

  const run = loadRun(runId, options)
  const controlPlane = getControlPlaneSnapshot({ runId }, options)
  return {
    action: 'status',
    run,
    controlPlane,
  }
}

function formatRunSummary(run, options = {}) {
  if (!run) {
    return '当前没有活动 workflow run。'
  }

  const controlPlane = options.controlPlane || buildControlPlaneSnapshot(run)
  const lines = []
  const actionLabel = options.action ? `动作: ${options.action}` : null
  const continueCommand = run.status === 'paused' ? `/ucc-flow-continue ${run.runId}` : '无'

  if (actionLabel) lines.push(actionLabel)
  lines.push(`触发来源: ${run.entryCommand || 'workflow-runtime'}`)
  lines.push(`运行ID: ${run.runId}`)
  lines.push(`触发链: ${run.triggerChain.join(' -> ')}`)
  lines.push(`当前模式: ${run.profile}`)
  lines.push(`当前节点: ${run.currentNode || '已完成'}`)
  lines.push(`当前阶段: ${run.currentPhase || '已完成'}`)
  lines.push(`下一节点: ${run.nextNode || '无'}`)
  lines.push(`执行模式: ${run.executionMode || DEFAULT_EXECUTION_MODE}`)
  lines.push(`暂停策略: ${run.pausePolicy || DEFAULT_PAUSE_POLICY}`)
  lines.push(`暂停状态: ${run.status}`)
  lines.push(`继续命令: ${continueCommand}`)
  if (run.pauseState && run.pauseState.reason) {
    lines.push(`暂停原因: ${run.pauseState.reason}`)
  }
  if (run.pauseState && Array.isArray(run.pauseState.signals) && run.pauseState.signals.length > 0) {
    lines.push(`暂停信号: ${run.pauseState.signals.join(', ')}`)
  }
  if (controlPlane.phase && controlPlane.phase.lastSummary) {
    lines.push(`最近阶段摘要: ${controlPlane.phase.lastSummary}`)
  }
  if (controlPlane.phase && Array.isArray(controlPlane.phase.lastSignals) && controlPlane.phase.lastSignals.length > 0) {
    lines.push(`最近阶段信号: ${controlPlane.phase.lastSignals.join(', ')}`)
  }
  lines.push('并行委派:')
  if (Array.isArray(controlPlane.delegates) && controlPlane.delegates.length > 0) {
    controlPlane.delegates.forEach((delegate) => {
      const parts = [`- ${delegate.name || delegate.delegateId} [${delegate.status}]`]
      if (delegate.agent) parts.push(`agent=${delegate.agent}`)
      if (delegate.required === true) parts.push('required=yes')
      if (delegate.required === false) parts.push('required=no')
      if (delegate.summary) parts.push(`summary=${delegate.summary}`)
      lines.push(parts.join(' '))
    })
  } else {
    lines.push('- 无')
  }
  lines.push('验证状态:')
  if (Array.isArray(controlPlane.verification) && controlPlane.verification.length > 0) {
    controlPlane.verification.forEach((item) => {
      const parts = [`- ${item.name} [${item.status}]`]
      if (item.source) parts.push(`source=${item.source}`)
      if (item.summary) parts.push(`summary=${item.summary}`)
      lines.push(parts.join(' '))
    })
  } else {
    lines.push('- 无')
  }
  lines.push(`状态更新时间: ${run.updatedAt}`)
  if (isStale(run)) {
    lines.push('Run 状态: stale')
  }
  return lines.join('\n')
}

module.exports = {
  ACTIVE_RUN_STATUSES,
  DEFAULT_EXECUTION_MODE,
  DEFAULT_PAUSE_POLICY,
  DEFAULT_PAUSE_POLICIES,
  FINAL_RUN_STATUSES,
  appendEvent,
  advanceRun,
  abortRun,
  canJoinActiveRun,
  continueRun,
  ensureWorkflowLayout,
  findProfileByCommand,
  formatRunSummary,
  getActiveRunMeta,
  getControlPlaneSnapshot,
  buildControlPlaneSnapshot,
  getDefinitionsPath,
  getModeForProfile,
  getNode,
  getPausePolicies,
  getProfile,
  getRunStatus,
  getWorkflowPaths,
  getWorkflowRoot,
  isStale,
  loadDefinitions,
  loadRun,
  normalizePausePolicy,
  normalizeTransition,
  readJson,
  renderTransition,
  resolveStartRequest,
  resumeRun,
  saveRun,
  setActiveRunMeta,
  startRun,
  updateDelegateStatus,
  updateVerificationStatus,
  writeControlPlaneSnapshot,
  writeJson,
}
