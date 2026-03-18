#!/usr/bin/env node

const { spawnSync } = require('child_process')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const tests = [
  'tests/config-smoke.test.js',
  'tests/hooks-json.test.js',
  'tests/metadata-integrity.test.js',
  'tests/command-namespace.test.js',
  'tests/team-workflow.test.js',
  'tests/copy-config.test.js',
]

for (const test of tests) {
  const abs = path.resolve(repoRoot, test)
  const result = spawnSync('node', [abs], { stdio: 'inherit' })
  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

console.log('全部自测通过')
