#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function detectLayout() {
  const hasSharedAssets = ['commands', 'agents', 'scripts', 'hooks', 'workflows'].every((entry) =>
    fs.existsSync(path.join(root, entry)),
  )

  if (path.basename(root) === '.claude' && hasSharedAssets) {
    return 'deployed'
  }

  if (hasSharedAssets && fs.existsSync(path.join(root, 'docs')) && fs.existsSync(path.join(root, 'tests'))) {
    return 'repo'
  }

  throw new Error(`无法识别 validate-config.js 所在布局: ${root}`)
}

const layout = detectLayout()

const requiredFilesByLayout = {
  repo: [
    'README.md',
    'CLAUDE.md',
    'docs/使用说明.md',
    'docs/配置定制指南.md',
    'hooks/README.md',
    'hooks/hooks.json',
    'mcp-configs/mcp-servers.json',
    'scripts/validate-config.js',
    'scripts/copy-config.js',
    'scripts/lib/workflow-runtime.js',
    'scripts/lib/hook-flags.js',
    'scripts/lib/settings-merge.js',
    'scripts/assets/claude-ucc.md',
    'scripts/workflow/live-status.js',
    'scripts/workflow/runner.js',
    'scripts/hooks/pretool-risk-blocker.js',
    'scripts/hooks/pretool-sensitive-write-check.js',
    'scripts/hooks/posttool-ts-check.js',
    'scripts/hooks/posttool-go-check.js',
    'scripts/hooks/stop-delivery-reminder.js',
    'scripts/hooks/run-with-flags.js',
    'tests/run-all.js',
    'tests/hooks-json.test.js',
    'tests/team-workflow.test.js',
    'tests/workflow-command-metadata.test.js',
    'tests/workflow-runtime.test.js',
    'tests/workflow-live-status.test.js',
    'tests/copy-config.test.js',
    'tests/copy-config-modes.test.js',
    'tests/settings-merge.test.js',
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
    'commands/ucc-team-parallel.md',
    'commands/ucc-single-standard.md',
    'commands/ucc-single-research.md',
    'commands/ucc-flow-status.md',
    'commands/ucc-flow-continue.md',
    'commands/ucc-flow-abort.md',
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
  ],
  deployed: [
    'README.md',
    'hooks/README.md',
    'hooks/hooks.json',
    'mcp-configs/mcp-servers.json',
    'scripts/validate-config.js',
    'scripts/copy-config.js',
    'scripts/lib/workflow-runtime.js',
    'scripts/lib/hook-flags.js',
    'scripts/lib/settings-merge.js',
    'scripts/assets/claude-ucc.md',
    'scripts/workflow/live-status.js',
    'scripts/workflow/runner.js',
    'scripts/hooks/pretool-risk-blocker.js',
    'scripts/hooks/pretool-sensitive-write-check.js',
    'scripts/hooks/posttool-ts-check.js',
    'scripts/hooks/posttool-go-check.js',
    'scripts/hooks/stop-delivery-reminder.js',
    'scripts/hooks/run-with-flags.js',
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
    'commands/ucc-team-parallel.md',
    'commands/ucc-single-standard.md',
    'commands/ucc-single-research.md',
    'commands/ucc-flow-status.md',
    'commands/ucc-flow-continue.md',
    'commands/ucc-flow-abort.md',
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
  ],
}

const expectedCounts = {
  agents: 20,
  commands: 9,
  skills: 19,
}

const supportedHookEvents = ['PreToolUse', 'PostToolUse', 'Stop']
const retiredSlashCommands = [
  '/ucc-flow-team-standard',
  '/ucc-flow-team-fast',
  '/ucc-flow-team-strict',
  '/ucc-flow-team-review',
  '/ucc-flow-team-research',
  '/ucc-flow-team-doc',
  '/ucc-flow-single-dev',
  '/ucc-flow-single-review',
  '/ucc-flow-single-research',
  '/ucc-team-fast',
  '/ucc-team-review',
  '/ucc-team-doc',
  '/ucc-flow',
  '/ucc-flow-resume',
  '/ucc-plan',
  '/ucc-tdd',
  '/ucc-code-review',
  '/ucc-verify',
  '/ucc-update-docs',
  '/ucc-quality-gate',
  '/ucc-checkpoint',
  '/ucc-context',
  '/ucc-harness-audit',
  '/ucc-loop-start',
  '/ucc-loop-status',
  '/ucc-model-route',
  '/ucc-learn',
  '/ucc-skill-create',
  '/ucc-sessions',
  '/ucc-build-fix',
  '/ucc-context-dev',
  '/ucc-context-review',
  '/ucc-context-research',
  '/ucc-db-review',
  '/ucc-delivery-doc',
  '/ucc-design-doc',
  '/ucc-e2e',
  '/ucc-go-build',
  '/ucc-go-review',
  '/ucc-go-test',
  '/ucc-javascript-review',
  '/ucc-refactor-clean',
  '/ucc-test-coverage',
  '/ucc-typescript-backend-review',
  '/ucc-typescript-fullstack-review',
  '/ucc-typescript-review',
]

const retiredCommandScanTargetsByLayout = {
  repo: ['README.md', 'CLAUDE.md', 'docs', 'commands', 'hooks', 'rules', 'skills'],
  deployed: ['README.md', '../CLAUDE.md', 'commands', 'hooks', 'rules', 'skills'],
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
  const requiredFiles = requiredFilesByLayout[layout]
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
    requireFrontmatterKeys(path.posix.join('agents', file), ['name', 'description', 'tools', 'model'])
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
  const hookFiles = ['hooks/hooks.json']

  hookFiles.forEach((file) => {
    const parsed = JSON.parse(readText(file))

    assert(typeof parsed.$schema === 'string' && parsed.$schema.length > 0, `${file} 缺少有效的 $schema`)
    assert(parsed.hooks && typeof parsed.hooks === 'object', `${file} 缺少 hooks 对象`)

    supportedHookEvents.forEach((eventName) => {
      const entries = parsed.hooks[eventName]
      assert(Array.isArray(entries), `${file} 的 hooks.${eventName} 必须为数组`)
      assert(entries.length > 0, `${file} 的 hooks.${eventName} 不能为空`)

      entries.forEach((entry, index) => {
        assert(
          typeof entry.matcher === 'string' && entry.matcher.length > 0,
          `${file} 的 hooks.${eventName}[${index}] 缺少 matcher`,
        )
        assert(
          Array.isArray(entry.hooks) && entry.hooks.length > 0,
          `${file} 的 hooks.${eventName}[${index}] 缺少 hooks 列表`,
        )

        entry.hooks.forEach((hook, hookIndex) => {
          assert(
            hook.type === 'command',
            `${file} 的 hooks.${eventName}[${index}].hooks[${hookIndex}] 的 type 必须为 command`,
          )
          assert(
            typeof hook.command === 'string' && hook.command.trim().length > 0,
            `${file} 的 hooks.${eventName}[${index}].hooks[${hookIndex}] 缺少 command`,
          )
          assert(
            /\$CLAUDE_PROJECT_DIR\/.claude\/scripts\//.test(hook.command),
            `${file} 的 hooks.${eventName}[${index}].hooks[${hookIndex}] 必须使用 $CLAUDE_PROJECT_DIR/.claude/scripts/ 路径`,
          )
          assert(
            !/node\s+scripts\//.test(hook.command),
            `${file} 的 hooks.${eventName}[${index}].hooks[${hookIndex}] 不应直接依赖 scripts/ 相对路径`,
          )
          assert(
            !/node\s+\.claude\/scripts\//.test(hook.command),
            `${file} 的 hooks.${eventName}[${index}].hooks[${hookIndex}] 不应直接依赖 .claude/scripts/ 相对路径`,
          )
        })
      })
    })
  })
}

function validateWorkflowDefinitions() {
  const definitions = JSON.parse(readText('workflows/definitions.json'))
  assert(definitions.profiles && typeof definitions.profiles === 'object', 'workflows/definitions.json 缺少 profiles')
  assert(definitions.pausePolicies && typeof definitions.pausePolicies === 'object', 'workflows/definitions.json 缺少 pausePolicies')

  const profiles = definitions.profiles

  function resolveTransition(profileName, nodeName, transition, fieldName) {
    if (transition == null) {
      return null
    }

    assert(
      transition && typeof transition === 'object',
      `${profileName}.${nodeName}.${fieldName} 必须为对象或 null`,
    )
    assert(
      typeof transition.node === 'string' && transition.node.length > 0,
      `${profileName}.${nodeName}.${fieldName} 缺少 node`,
    )

    const targetProfileName = transition.profile || profileName
    const targetProfile = profiles[targetProfileName]
    assert(targetProfile, `${profileName}.${nodeName}.${fieldName} 指向未知 profile: ${targetProfileName}`)
    assert(targetProfile.nodes && typeof targetProfile.nodes === 'object', `${targetProfileName} 缺少 nodes 定义`)
    assert(
      targetProfile.nodes[transition.node],
      `${profileName}.${nodeName}.${fieldName} 指向不存在的节点: ${targetProfileName}.${transition.node}`,
    )
    return transition
  }

  function hasReachableTerminal(profileName, nodeName, visiting, memo) {
    const key = `${profileName}:${nodeName}`
    if (memo.has(key)) {
      return memo.get(key)
    }
    if (visiting.has(key)) {
      return false
    }

    visiting.add(key)
    const nodeDef = profiles[profileName].nodes[nodeName]
    const nextTransitions = [nodeDef.nextOnSuccess, nodeDef.nextOnBlocked].filter(Boolean)
    const resolvedTransitions = nextTransitions.map((transition) => ({
      profile: transition.profile || profileName,
      node: transition.node,
    }))
    const result =
      resolvedTransitions.length === 0
        ? true
        : resolvedTransitions.some((target) => hasReachableTerminal(target.profile, target.node, visiting, memo))

    visiting.delete(key)
    memo.set(key, result)
    return result
  }

  Object.entries(profiles).forEach(([profileName, profileDef]) => {
    assert(typeof profileDef.mode === 'string' && profileDef.mode.length > 0, `${profileName} 缺少 mode`)
    assert(typeof profileDef.publicCommand === 'string' && profileDef.publicCommand.length > 0, `${profileName} 缺少 publicCommand`)
    assert(typeof profileDef.entryNode === 'string' && profileDef.entryNode.length > 0, `${profileName} 缺少 entryNode`)
    assert(profileDef.nodes && typeof profileDef.nodes === 'object', `${profileName} 缺少 nodes 定义`)

    const nodeEntries = Object.entries(profileDef.nodes)
    assert(nodeEntries.length > 0, `${profileName} 的 nodes 不能为空`)
    assert(profileDef.nodes[profileDef.entryNode], `${profileName} entryNode 未定义到 nodes 中: ${profileDef.entryNode}`)
    assert(
      definitions.pausePolicies[profileDef.pausePolicyDefault],
      `${profileName} 使用了未知的 pausePolicyDefault: ${profileDef.pausePolicyDefault}`,
    )

    nodeEntries.forEach(([nodeName, nodeDef]) => {
      assert(typeof nodeDef.phase === 'string' && nodeDef.phase.length > 0, `${profileName}.${nodeName} 缺少 phase`)
      assert(
        typeof nodeDef.executorAgent === 'string' && nodeDef.executorAgent.length > 0,
        `${profileName}.${nodeName} 缺少 executorAgent`,
      )
      resolveTransition(profileName, nodeName, nodeDef.nextOnSuccess, 'nextOnSuccess')
      resolveTransition(profileName, nodeName, nodeDef.nextOnBlocked, 'nextOnBlocked')
    })

    assert(
      hasReachableTerminal(profileName, profileDef.entryNode, new Set(), new Map()),
      `${profileName} 从 entryNode ${profileDef.entryNode} 无法到达终止节点`,
    )
  })
}

function listMarkdownFilesForTarget(target) {
  const absTarget = path.join(root, target)
  if (!fs.existsSync(absTarget)) {
    return []
  }

  const stats = fs.statSync(absTarget)
  if (stats.isFile()) {
    return absTarget.toLowerCase().endsWith('.md') ? [absTarget] : []
  }

  const files = []
  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true })
    entries.forEach((entry) => {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        return
      }
      if (entry.isFile() && fullPath.toLowerCase().endsWith('.md')) {
        files.push(fullPath)
      }
    })
  }

  walk(absTarget)
  return files
}

function validateRetiredCommandReferences() {
  const scanTargets = retiredCommandScanTargetsByLayout[layout] || []
  const rules = retiredSlashCommands.map((command) => ({
    needle: command,
    regex: new RegExp(`(^|[^\\w-])(${escapeRegExp(command)})(?![\\w*-])`),
  }))
  const files = [...new Set(scanTargets.flatMap((target) => listMarkdownFilesForTarget(target)))].sort()
  const hits = []

  files.forEach((absPath) => {
    const relPath = path.relative(root, absPath).replace(/\\/g, '/')
    const lines = fs.readFileSync(absPath, 'utf8').split(/\r?\n/)
    lines.forEach((line, index) => {
      rules.forEach((rule) => {
        if (rule.regex.test(line)) {
          hits.push(`- ${relPath}:${index + 1} 命中 ${rule.needle} | ${line.trim().slice(0, 240)}`)
        }
      })
    })
  })

  assert(hits.length === 0, `发现退役 /ucc-* 命令残留引用:\n${hits.join('\n')}`)
}

function validateCustomizationGuideSnapshot() {
  if (layout !== 'repo') {
    return
  }

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
  console.log(`校验布局: ${layout}`)

  const steps = [
    ['关键文件存在性', validateRequiredFiles],
    ['目录数量', validateDirectoryCounts],
    ['Agent Frontmatter', validateAgentsFrontmatter],
    ['Agent 模型继承策略', validateAgentModelPolicy],
    ['Skill Frontmatter', validateSkillsFrontmatter],
    ['Command Frontmatter', validateCommandsFrontmatter],
    ['Hooks 结构', validateHooksJson],
    ['Workflow 语义', validateWorkflowDefinitions],
    ['退役命令引用', validateRetiredCommandReferences],
  ]

  if (layout === 'repo') {
    steps.push(['文档快照一致性', validateCustomizationGuideSnapshot])
  }

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
