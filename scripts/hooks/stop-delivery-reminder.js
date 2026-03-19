#!/usr/bin/env node

'use strict'

const { log, output, readStdinJson } = require('../lib/utils')
const { formatRunSummary, getRunStatus } = require('../lib/workflow-runtime')

async function main() {
  const input = await readStdinJson()
  const status = getRunStatus()

  if (status.run) {
    log('[Hook] 当前 workflow 摘要:')
    log(formatRunSummary(status.run, { action: status.action }))
  } else {
    log('[Hook] 提醒: 当前无活动 workflow run。结束前请确认测试、敏感信息与文档同步。')
  }

  output(input)
}

main().catch((err) => {
  log(`[Hook] stop-delivery-reminder 异常: ${String(err)}`)
  process.exit(0)
})