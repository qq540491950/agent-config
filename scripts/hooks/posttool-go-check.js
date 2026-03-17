#!/usr/bin/env node

'use strict'

const path = require('path')
const { execSync } = require('child_process')
const { log, output, readStdinJson, commandExists } = require('../lib/utils')

const GO_EXTENSIONS = new Set(['.go'])

function getFilePath(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return null
  const filePath = toolInput.file_path || toolInput.path
  if (typeof filePath === 'string' && filePath.length > 0) return filePath
  return null
}

function isGoFile(filePath) {
  return GO_EXTENSIONS.has(path.extname(filePath).toLowerCase())
}

function runCheck(cmd, label, cwd) {
  try {
    execSync(cmd, { stdio: 'pipe', timeout: 30000, cwd })
    return null
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString().trim() : ''
    const stdout = err.stdout ? err.stdout.toString().trim() : ''
    const combined = [stdout, stderr].filter(Boolean).join('\n')
    const preview = combined.split('\n').slice(0, 15).join('\n')
    return `[Hook][${label}] ${preview}`
  }
}

async function main() {
  const input = await readStdinJson()
  const filePath = getFilePath(input?.tool_input)

  if (!filePath || !isGoFile(filePath)) {
    output(input)
    return
  }

  if (!commandExists('go')) {
    log('[Hook] go 命令未找到，跳过 Go 代码检查。')
    output(input)
    return
  }

  const dir = path.dirname(path.resolve(filePath))
  const messages = []

  // go vet 检查
  const vetResult = runCheck(`go vet ./...`, 'go vet', dir)
  if (vetResult) messages.push(vetResult)

  // gofmt 格式检查（只检查，不修改）
  const absPath = path.resolve(filePath)
  const fmtResult = runCheck(`gofmt -l "${absPath.replace(/"/g, '"')}"`, 'gofmt', dir)
  if (fmtResult) {
    messages.push(`[Hook][gofmt] 以下文件格式不符合 gofmt 规范，请运行 gofmt -w 修复：\n${fmtResult}`)
  }

  // staticcheck（可选，存在才运行）
  if (commandExists('staticcheck')) {
    const staticResult = runCheck(`staticcheck ./...`, 'staticcheck', dir)
    if (staticResult) messages.push(staticResult)
  }

  if (messages.length > 0) {
    messages.forEach((msg) => log(msg))
    log('[Hook] 提醒：上方为 Go 代码检查结果，请根据情况修复后继续。')
  }

  output(input)
}

main().catch((err) => {
  log(`[Hook] posttool-go-check 异常: ${String(err)}`)
  process.exit(0)
})
