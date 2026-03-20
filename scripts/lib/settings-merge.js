'use strict'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function mergeHookEntries(baseEntries = [], overlayEntries = []) {
  return [...baseEntries.map(clone), ...overlayEntries.map(clone)]
}

function mergeUniqueStringList(baseValues = [], overlayValues = []) {
  const merged = []
  const seen = new Set()

  ;[...baseValues, ...overlayValues].forEach((value) => {
    const normalized = String(value || '').trim()
    if (!normalized || seen.has(normalized)) {
      return
    }
    seen.add(normalized)
    merged.push(normalized)
  })

  return merged
}

function mergeSettings(baseSettings = {}, overlaySettings = {}) {
  const base = clone(baseSettings)
  const overlay = clone(overlaySettings)
  const merged = {
    ...base,
  }

  if (!merged.$schema && overlay.$schema) {
    merged.$schema = overlay.$schema
  }

  const baseHooks = base.hooks || {}
  const overlayHooks = overlay.hooks || {}
  const hookEventNames = new Set([...Object.keys(baseHooks), ...Object.keys(overlayHooks)])

  if (hookEventNames.size > 0) {
    merged.hooks = {}
    hookEventNames.forEach((eventName) => {
      merged.hooks[eventName] = mergeHookEntries(baseHooks[eventName], overlayHooks[eventName])
    })
  }

  const baseEnabledMcpServers = Array.isArray(base.enabledMcpjsonServers) ? base.enabledMcpjsonServers : []
  const overlayEnabledMcpServers = Array.isArray(overlay.enabledMcpjsonServers) ? overlay.enabledMcpjsonServers : []
  const enabledMcpServers = mergeUniqueStringList(baseEnabledMcpServers, overlayEnabledMcpServers)
  if (enabledMcpServers.length > 0) {
    merged.enabledMcpjsonServers = enabledMcpServers
  }

  const baseDisabledMcpServers = Array.isArray(base.disabledMcpjsonServers) ? base.disabledMcpjsonServers : []
  const overlayDisabledMcpServers = Array.isArray(overlay.disabledMcpjsonServers) ? overlay.disabledMcpjsonServers : []
  const disabledMcpServers = mergeUniqueStringList(baseDisabledMcpServers, overlayDisabledMcpServers)
  if (disabledMcpServers.length > 0) {
    merged.disabledMcpjsonServers = disabledMcpServers
  }

  return merged
}

module.exports = {
  mergeSettings,
}
