const assert = require('assert')

let mergeSettings
try {
  ;({ mergeSettings } = require('../scripts/lib/settings-merge'))
} catch (error) {
  mergeSettings = null
}

assert.strictEqual(typeof mergeSettings, 'function', 'scripts/lib/settings-merge.js 应导出 mergeSettings')

const baseSettings = {
  permissions: {
    allow: ['Read', 'Write'],
  },
  env: {
    FOO: 'bar',
  },
  enabledMcpjsonServers: ['memory'],
  hooks: {
    Stop: [
      {
        matcher: '*',
        hooks: [
          {
            type: 'command',
            command: 'echo existing-stop',
          },
        ],
      },
    ],
  },
  plugins: {
    demo: true,
  },
}

const uccHooks = {
  enabledMcpjsonServers: ['context7', 'filesystem'],
  hooks: {
    PreToolUse: [
      {
        matcher: 'Write',
        hooks: [
          {
            type: 'command',
            command: 'echo pre-write',
          },
        ],
      },
    ],
    Stop: [
      {
        matcher: '*',
        hooks: [
          {
            type: 'command',
            command: 'echo ucc-stop',
          },
        ],
      },
    ],
  },
}

const merged = mergeSettings(baseSettings, uccHooks)
assert.deepStrictEqual(merged.permissions, baseSettings.permissions, 'merge 后必须保留已有 permissions')
assert.deepStrictEqual(merged.env, baseSettings.env, 'merge 后必须保留已有 env')
assert.deepStrictEqual(merged.plugins, baseSettings.plugins, 'merge 后必须保留已有 plugins')
assert.deepStrictEqual(
  merged.enabledMcpjsonServers,
  ['memory', 'context7', 'filesystem'],
  'merge 后必须合并 enabledMcpjsonServers 且去重保序',
)
assert.ok(Array.isArray(merged.hooks.PreToolUse), 'merge 后必须包含 UCC 的 PreToolUse hooks')
assert.ok(Array.isArray(merged.hooks.Stop), 'merge 后必须保留 Stop hooks 数组')
assert.strictEqual(merged.hooks.Stop.length, 2, 'merge 后应同时保留已有 Stop hooks 与 UCC Stop hooks')
assert.notStrictEqual(merged, baseSettings, 'mergeSettings 必须返回新对象而不是原地修改')
assert.strictEqual(baseSettings.hooks.Stop.length, 1, 'mergeSettings 不应原地修改输入 settings')

console.log('settings-merge.test.js 通过')
