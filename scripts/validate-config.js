#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

const requiredFiles = [
  'README.md',
  'CLAUDE.md',
  'docs/使用说明.md',
  'docs/配置定制指南.md',
  'hooks/README.md',
  'hooks/hooks.json',
  'hooks/project-settings.json',
  'mcp-configs/mcp-servers.json',
  'scripts/validate-config.js',
  'scripts/copy-config.js',
  'scripts/lib/workflow-runtime.js',
  'scripts/lib/hook-flags.js',
  'scripts/workflow/runner.js',
  'scripts/hooks/pretool-risk-blocker.js',
  'scripts/hooks/pretool-sensitive-write-check.js',
  'scripts/hooks/stop-delivery-reminder.js',
  'scripts/hooks/run-with-flags.js',
  'tests/run-all.js',
  'tests/team-workflow.test.js',
  'tests/workflow-command-metadata.test.js',
  'tests/workflow-runtime.test.js',
  'tests/copy-config.test.js',
  'tests/config-smoke.test.js',
  'tests/metadata-integrity.test.js',
  'tests/model-inheritance.test.js',
  'tests/command-namespace.test.js',
  'agents/team-orchestrator.md',
  'agents/workflow-orchestrator.md',
  'agents/doc-updater.md',
  'agents/e2e-runner.md',
  'agents/architect.md',
  'agents/refactor-cleaner.md',
  'agents/go-build-resolver.md',
  'agents/typescript-reviewer.md',
  'agents/typescript-backend-reviewer.md',
  'agents/typescript-fullstack-reviewer.md',
  'agents/database-reviewer.md',
  'agents/design-doc-writer.md',
  'agents/delivery-doc-writer.md',
  'commands/ucc-team-standard.md',
  'commands/ucc-team-strict.md',
  'commands/ucc-team-research.md',
  'commands/ucc-single-standard.md',
  'commands/ucc-single-research.md',
  'commands/ucc-flow-status.md',
  'commands/ucc-flow-continue.md',
  'commands/ucc-flow-abort.md',
  'commands/ucc-e2e.md',
  'commands/ucc-context-dev.md',
  'commands/ucc-context-review.md',
  'commands/ucc-context-research.md',
  'commands/ucc-go-test.md',
  'commands/ucc-go-build.md',
  'commands/ucc-go-review.md',
  'commands/ucc-javascript-review.md',
  'commands/ucc-typescript-review.md',
  'commands/ucc-typescript-backend-review.md',
  'commands/ucc-typescript-fullstack-review.md',
  'commands/ucc-build-fix.md',
  'commands/ucc-db-review.md',
  'commands/ucc-design-doc.md',
  'commands/ucc-delivery-doc.md',
  'commands/ucc-test-coverage.md',
  'commands/ucc-refactor-clean.md',
  'rules/javascript/coding-style.md',
  'rules/javascript/security.md',
  'rules/javascript/testing.md',
  'rules/javascript/patterns.md',
  'skills/node-backend-patterns/SKILL.md',
  'skills/design-collaboration/SKILL.md',
  'skills/continuous-learning/SKILL.md',
  'skills/verification-loop/SKILL.md',
  'skills/design-doc-patterns/SKILL.md',
  'skills/delivery-patterns/SKILL.md',
  'skills/docker-patterns/SKILL.md',
  'skills/deployment-patterns/SKILL.md',
  'skills/typescript-patterns/SKILL.md',
  'skills/typescript-testing/SKILL.md',
  'workflows/definitions.json',
  'workflows/README.md',
]

const expectedCounts = {
  agents: 20,
  commands: 25,
  contexts: 3,
  skills: 19,
}

function checkExists(file) {
  return fs.existsSync(path.join(root, file))
}

function readText(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function listFiles(dir, ext = '.md') {
  const absDir = path.join(root, dir)
  return fs
    .readdirSync(absDir)
    .filter((name) => name.endsWith(ext))
    .sort()
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  return match ? match[1] : null
}

function hasFrontmatter(content) {
  return extractFrontmatter(content) !== null
}

function requireFrontmatterKeys(file, keys) {
  const content = readText(file)
  const frontmatter = extractFrontmatter(content)
  assert(frontmatter, `${file} 缺少 YAML Frontmatter`)

  for (const key of keys) {
    const re = new RegExp(`^${key}:\\s*.+$`, 'm')
    assert(re.test(frontmatter), `${file} 的 Frontmatter 缺少字段: ${key}`)
  }
}

function validateRequiredFiles() {
  const missing = requiredFiles.filter((file) => !checkExists(file))
  assert(missing.length === 0, `缺失文件:\n- ${missing.join('\n- ')}`)
}

function validateDirectoryCounts() {
  assert(
    listFiles('agents').length === expectedCounts.agents,
    `agents 数量不匹配，期望 ${expectedCounts.agents}，实际 ${listFiles('agents').length}`,
  )

  assert(
    listFiles('commands').length === expectedCounts.commands,
    `commands 数量不匹配，期望 ${expectedCounts.commands}，实际 ${listFiles('commands').length}`,
  )

  assert(
    listFiles('contexts').length === expectedCounts.contexts,
    `contexts 数量不匹配，期望 ${expectedCounts.contexts}，实际 ${listFiles('contexts').length}`,
  )

  const skillCount = fs
    .readdirSync(path.join(root, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(root, 'skills', entry.name, 'SKILL.md'))).length

  assert(
    skillCount === expectedCounts.skills,
    `skills 数量不匹配，期望 ${expectedCounts.skills}，实际 ${skillCount}`,
  )
}

function validateAgentsFrontmatter() {
  for (const file of listFiles('agents')) {
    requireFrontmatterKeys(path.posix.join('agents', file), [
      'name',
      'description',
      'tools',
      'model',
    ])
  }
}

function validateAgentModelPolicy() {
  for (const file of listFiles('agents')) {
    const rel = path.posix.join('agents', file)
    const content = readText(rel)
    const match = content.match(/^model:\s*(.+)$/m)
    assert(match, `${rel} 缺少 model frontmatter`)
    assert(match[1].trim() === 'inherit', `${rel} 应继承当前会话模型`)
  }
}

function validateSkillsFrontmatter() {
  const skillDirs = fs
    .readdirSync(path.join(root, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  for (const dir of skillDirs) {
    const skillFile = path.posix.join('skills', dir, 'SKILL.md')
    assert(checkExists(skillFile), `${skillFile} 不存在`)
    requireFrontmatterKeys(skillFile, ['name', 'description'])
  }
}

function validateCommandsFrontmatter() {
  for (const file of listFiles('commands')) {
    const rel = path.posix.join('commands', file)
    const content = readText(rel)

    assert(content.trim().length > 0, `${rel} 内容为空`)
    assert(hasFrontmatter(content), `${rel} 缺少 YAML Frontmatter`)
    requireFrontmatterKeys(rel, ['description'])
  }
}

function validateHooksJson() {
  const parsed = JSON.parse(readText('hooks/hooks.json'))

  assert(
    typeof parsed.$schema === 'string' && parsed.$schema.length > 0,
    'hooks.json 缺少有效的 $schema',
  )
  assert(parsed.hooks && typeof parsed.hooks === 'object', 'hooks.json 缺少 hooks 对象')

  for (const eventName of ['PreToolUse', 'Stop']) {
    const entries = parsed.hooks[eventName]
    assert(Array.isArray(entries), `hooks.${eventName} 必须为数组`)
    assert(entries.length > 0, `hooks.${eventName} 不能为空`)

    entries.forEach((entry, index) => {
      assert(
        typeof entry.matcher === 'string' && entry.matcher.length > 0,
        `hooks.${eventName}[${index}] 缺少 matcher`,
      )
      assert(
        Array.isArray(entry.hooks) && entry.hooks.length > 0,
        `hooks.${eventName}[${index}] 缺少 hooks 列表`,
      )

      entry.hooks.forEach((hook, hookIndex) => {
        assert(
          hook.type === 'command',
          `hooks.${eventName}[${index}].hooks[${hookIndex}] 的 type 必须为 command`,
        )
        assert(
          typeof hook.command === 'string' && hook.command.trim().length > 0,
          `hooks.${eventName}[${index}].hooks[${hookIndex}] 缺少 command`,
        )
      })
    })
  }
}

function validateCustomizationGuideSnapshot() {
  const guide = readText('docs/配置定制指南.md')

  const agentsMatch = guide.match(/agents\/\s+#\s*代理配置（(\d+)个）/)
  const commandsMatch = guide.match(/commands\/\s+#\s*斜杠命令（(\d+)个）/)
  const skillsMatch = guide.match(/skills\/\s+#\s*技能模块（(\d+)个）/)

  assert(agentsMatch, 'CUSTOMIZATION_GUIDE 缺少 agents 数量声明')
  assert(commandsMatch, 'CUSTOMIZATION_GUIDE 缺少 commands 数量声明')
  assert(skillsMatch, 'CUSTOMIZATION_GUIDE 缺少 skills 数量声明')

  assert(
    Number(agentsMatch[1]) === expectedCounts.agents,
    `CUSTOMIZATION_GUIDE agents 数量错误，期望 ${expectedCounts.agents}，实际 ${agentsMatch[1]}`,
  )
  assert(
    Number(commandsMatch[1]) === expectedCounts.commands,
    `CUSTOMIZATION_GUIDE commands 数量错误，期望 ${expectedCounts.commands}，实际 ${commandsMatch[1]}`,
  )
  assert(
    Number(skillsMatch[1]) === expectedCounts.skills,
    `CUSTOMIZATION_GUIDE skills 数量错误，期望 ${expectedCounts.skills}，实际 ${skillsMatch[1]}`,
  )

  const guideVersion = guide.match(/\*\*文档版本：\*\*\s*(v\d+\.\d+\.\d+)/)
  assert(guideVersion, 'CUSTOMIZATION_GUIDE 缺少文档版本')

  const readme = readText('README.md')
  const versionMatches = [...readme.matchAll(/- \*\*(v\d+\.\d+\.\d+)\*\* -/g)].map((m) => m[1])
  assert(versionMatches.length > 0, 'README 缺少版本日志条目')

  const parseSemver = (v) => v.replace(/^v/, '').split('.').map((n) => Number(n))
  const latestReadmeVersion = versionMatches.reduce((latest, current) => {
    const [la, lb, lc] = parseSemver(latest)
    const [ca, cb, cc] = parseSemver(current)
    if (ca > la) return current
    if (ca < la) return latest
    if (cb > lb) return current
    if (cb < lb) return latest
    if (cc > lc) return current
    return latest
  })

  assert(
    guideVersion[1] === latestReadmeVersion,
    `文档版本不一致，CUSTOMIZATION_GUIDE=${guideVersion[1]}，README=${latestReadmeVersion}`,
  )
}

function runStep(name, fn) {
  fn()
  console.log(`[OK] ${name}`)
}

function main() {
  const steps = [
    ['关键文件存在性', validateRequiredFiles],
    ['目录数量', validateDirectoryCounts],
    ['Agent Frontmatter', validateAgentsFrontmatter],
    ['Agent 模型继承策略', validateAgentModelPolicy],
    ['Skill Frontmatter', validateSkillsFrontmatter],
    ['Command Frontmatter', validateCommandsFrontmatter],
    ['Hooks 结构', validateHooksJson],
    ['文档快照一致性', validateCustomizationGuideSnapshot],
  ]

  const errors = []
  for (const [name, fn] of steps) {
    try {
      runStep(name, fn)
    } catch (err) {
      errors.push({ name, message: err.message })
    }
  }

  if (errors.length > 0) {
    console.error('配置校验失败:')
    errors.forEach((err) => {
      console.error(`- ${err.name}: ${err.message}`)
    })
    process.exit(1)
  }

  console.log('配置校验通过')
}

main()
