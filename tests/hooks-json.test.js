const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const content = fs.readFileSync(path.join(root, 'hooks/hooks.json'), 'utf8')
const json = JSON.parse(content)

function assertHookFile(name, parsed) {
  assert.ok(parsed.$schema, `${name} 缺少 $schema`)
  assert.ok(parsed.hooks, `${name} 缺少 hooks`)
  assert.ok(Array.isArray(parsed.hooks.PreToolUse), `${name}.PreToolUse 必须为数组`)
  assert.ok(Array.isArray(parsed.hooks.PostToolUse), `${name}.PostToolUse 必须为数组`)
  assert.ok(Array.isArray(parsed.hooks.Stop), `${name}.Stop 必须为数组`)

  ;['PreToolUse', 'PostToolUse', 'Stop'].forEach((eventName) => {
    parsed.hooks[eventName].forEach((entry, index) => {
      entry.hooks.forEach((hook, hookIndex) => {
        assert.match(
          hook.command,
          /\$CLAUDE_PROJECT_DIR\/.claude\/scripts\//,
          `${name}.${eventName}[${index}].hooks[${hookIndex}] 必须使用 $CLAUDE_PROJECT_DIR/.claude/scripts/ 路径`,
        )
        assert.doesNotMatch(
          hook.command,
          /node\s+scripts\//,
          `${name}.${eventName}[${index}].hooks[${hookIndex}] 不应直接依赖 scripts/ 相对路径`,
        )
        assert.doesNotMatch(
          hook.command,
          /node\s+\.claude\/scripts\//,
          `${name}.${eventName}[${index}].hooks[${hookIndex}] 不应直接依赖 .claude/scripts/ 相对路径`,
        )
      })
    })
  })
}

assertHookFile('hooks.json', json)
assert.ok(!fs.existsSync(path.join(root, 'hooks/project-settings.json')), 'hooks/project-settings.json 应已清理')

console.log('hooks-json.test.js 通过')
