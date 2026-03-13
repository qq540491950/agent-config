#!/usr/bin/env node

'use strict'

const path = require('path')
const { execSync } = require('child_process')
const { log, output, readStdinJson } = require('../lib/utils')

const TS_EXTENSIONS = new Set(['.ts', '.tsx', '.vue'])

function getTsFilePath(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return null

  // Write / Edit 工具
  const filePath = toolInput.file_path || toolInput.path
  if (typeof filePath === 'string' && filePath.length > 0) {
    return filePath
  }

  // MultiEdit 工具
  if (typeof toolInput.notebook_path === 'string') return null

  return null
}

function isTsFile(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return TS_EXTENSIONS.has(ext)
}

function runCheck(cmd, label) {
  try {
    execSync(cmd, { stdio: 'pipe', timeout: 30000 })
    return null
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString().trim() : ''
    const stdout = err.stdout ? err.stdout.toString().trim() : ''
    const output = [stdout, stderr].filter(Boolean).join('\n')
    const preview = output.split('\n').slice(0, 10).join('\n')
    return `[Hook][${label}] ${preview}`
  }
}

async function main() {
  const input = await readStdinJson()
  const filePath = getTsFilePath(input?.tool_input)

  if (!filePath || !isTsFile(filePath)) {
    output(input)
    return
  }

  const messages = []

  // tsc 检查
  const tscResult = runCheck('npx tsc --noEmit 2>&1', 'tsc')
  if (tscResult) messages.push(tscResult)

  // ESLint 检查（仅针对修改的文件，速度更快）
  const safePath = JSON.stringify(filePath)
  const eslintResult = runCheck(`npx eslint ${safePath} --max-warnings 0 2>&1`, 'eslint')
  if (eslintResult) messages.push(eslintResult)

  if (messages.length > 0) {
    messages.forEach((msg) => log(msg))
    log('[Hook] 提醒：上方为 TypeScript 检查结果，请根据情况修复后继续。')
  }

  output(input)
}

main().catch((err) => {
  log(`[Hook] posttool-ts-check 异常: ${String(err)}`)
  process.exit(0)
})
