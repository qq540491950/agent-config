#!/usr/bin/env node

'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const readline = require('readline')
const { mergeSettings } = require('./lib/settings-merge')

const scriptRoot = path.resolve(__dirname, '..')
const sourceLayout = resolveSourceLayout(scriptRoot)
const claudeDirItems = [
  'README.md',
  'rules',
  'agents',
  'commands',
  'skills',
  'hooks',
  'scripts',
  'mcp-configs',
  'workflows',
]
const settingsTemplate = path.join('hooks', 'hooks.json')
const mcpTemplate = path.join('mcp-configs', 'mcp-servers.json')
const uccClaudeTemplate = path.join('scripts', 'assets', 'claude-ucc.md')
const validClaudeModes = new Set(['off', 'dotclaude', 'import-root'])
const validHooksModes = new Set(['off', 'local', 'project'])
const validMcpModes = new Set(['off', 'project'])
const validPlatforms = new Set(['auto', 'windows', 'linux', 'macos', 'wsl'])
const validMcpProfiles = new Set(['basic', 'research', 'full', 'custom'])
const settingsSchemaUrl = 'https://json.schemastore.org/claude-code-settings.json'

function resolveSourceLayout(candidateRoot) {
  const hasSharedAssets = ['commands', 'agents', 'scripts', 'hooks', 'workflows'].every((entry) =>
    fs.existsSync(path.join(candidateRoot, entry)),
  )
  const isClaudeDir = path.basename(candidateRoot) === '.claude'
  const isRepoRoot = fs.existsSync(path.join(candidateRoot, 'docs')) && fs.existsSync(path.join(candidateRoot, 'tests'))

  if (isClaudeDir && hasSharedAssets) {
    return {
      projectRoot: path.resolve(candidateRoot, '..'),
      claudeDir: candidateRoot,
      layout: 'deployed',
    }
  }

  if (isRepoRoot && hasSharedAssets) {
    return {
      projectRoot: candidateRoot,
      claudeDir: candidateRoot,
      layout: 'repo',
    }
  }

  throw new Error(`无法识别脚本所在布局: ${candidateRoot}`)
}

function printUsage() {
  console.log('用法:')
  console.log(
    '  node .claude/scripts/copy-config.js <项目根目录> [--force] [--claude-mode <mode>] [--hooks <mode>] [--mcp <mode>] [--platform <platform>]',
  )
  console.log('  node .claude/scripts/copy-config.js <项目根目录> --legacy-layout [--force]')
  console.log('  node .claude/scripts/copy-config.js')
  console.log('')
  console.log('默认行为:')
  console.log('  - 运行脚本后会进入选择式向导，逐项选择 CLAUDE、hooks、MCP 与平台')
  console.log('  - 直接回车会采用推荐默认值')
  console.log('  - 命令行参数仅用于高级覆盖或自动化场景')
  console.log('')
  console.log('CLAUDE 接入模式:')
  console.log('  off         默认，不生成任何 CLAUDE 文件')
  console.log('  dotclaude   生成 .claude/CLAUDE.md 与 .claude/CLAUDE.ucc.md')
  console.log('  import-root 生成 .claude/CLAUDE.ucc.md，并在根目录缺少 CLAUDE.md 时生成 bootstrap 文件')
  console.log('')
  console.log('hooks 接入模式:')
  console.log('  off      默认，不生成 settings 文件')
  console.log('  local    生成或合并 .claude/settings.local.json')
  console.log('  project  生成或合并 .claude/settings.json')
  console.log('')
  console.log('MCP 接入模式:')
  console.log('  off      默认，不生成 .mcp.json')
  console.log('  project  生成项目根 .mcp.json，并把已选 MCP 写入 .claude/settings.json')
  console.log('')
  console.log('平台模式:')
  console.log('  auto     默认，自动识别 windows / linux / macos / wsl')
  console.log('  windows  为本地 stdio MCP 生成 cmd /c 包装')
  console.log('  linux    生成 Linux 命令')
  console.log('  macos    生成 macOS 命令')
  console.log('  wsl      生成 WSL 命令')
  console.log('')
  console.log('兼容模式:')
  console.log('  --legacy-layout 生成根目录 CLAUDE.md bootstrap，并生成 .claude/settings.json')
  console.log('')
  console.log('说明:')
  console.log('  - 未传目标目录时，会提示输入项目根目录')
  console.log('  - 默认会通过向导选择 hooks、MCP 和必要参数')
  console.log('  - 默认只复制 .claude/ 下的运行时资产')
  console.log('  - 目标已有同名文件/目录时，默认会二次确认；使用 --force 可直接覆盖')
}

function parseArgs(argv) {
  let help = false
  let force = false
  let interactive = false
  let legacyLayout = false
  let claudeMode = 'off'
  let hooksMode = 'off'
  let mcpMode = 'off'
  let platform = 'auto'
  let mcpProfile = 'basic'
  let mcpServersArg = ''
  let targetArg = ''
  let claudeModeProvided = false
  let hooksModeProvided = false
  let mcpModeProvided = false
  let platformProvided = false
  let mcpProfileProvided = false
  let mcpServersProvided = false
  let targetProvided = false

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--help' || arg === '-h') {
      help = true
      continue
    }

    if (arg === '--force' || arg === '-f') {
      force = true
      continue
    }

    if (arg === '--interactive') {
      interactive = true
      continue
    }

    if (arg === '--legacy-layout') {
      legacyLayout = true
      continue
    }

    if (arg === '--claude-mode') {
      index += 1
      claudeMode = argv[index] || ''
      claudeModeProvided = true
      continue
    }

    if (arg.startsWith('--claude-mode=')) {
      claudeMode = arg.slice('--claude-mode='.length)
      claudeModeProvided = true
      continue
    }

    if (arg === '--hooks') {
      index += 1
      hooksMode = argv[index] || ''
      hooksModeProvided = true
      continue
    }

    if (arg.startsWith('--hooks=')) {
      hooksMode = arg.slice('--hooks='.length)
      hooksModeProvided = true
      continue
    }

    if (arg === '--mcp') {
      index += 1
      mcpMode = argv[index] || ''
      mcpModeProvided = true
      continue
    }

    if (arg.startsWith('--mcp=')) {
      mcpMode = arg.slice('--mcp='.length)
      mcpModeProvided = true
      continue
    }

    if (arg === '--platform') {
      index += 1
      platform = argv[index] || ''
      platformProvided = true
      continue
    }

    if (arg.startsWith('--platform=')) {
      platform = arg.slice('--platform='.length)
      platformProvided = true
      continue
    }

    if (arg === '--mcp-profile') {
      index += 1
      mcpProfile = argv[index] || ''
      mcpProfileProvided = true
      continue
    }

    if (arg.startsWith('--mcp-profile=')) {
      mcpProfile = arg.slice('--mcp-profile='.length)
      mcpProfileProvided = true
      continue
    }

    if (arg === '--mcp-servers') {
      index += 1
      mcpServersArg = argv[index] || ''
      mcpServersProvided = true
      continue
    }

    if (arg.startsWith('--mcp-servers=')) {
      mcpServersArg = arg.slice('--mcp-servers='.length)
      mcpServersProvided = true
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`未知参数: ${arg}`)
    }

    if (!targetArg) {
      targetArg = arg
      targetProvided = true
      continue
    }

    throw new Error(`多余的位置参数: ${arg}`)
  }

  if (!validClaudeModes.has(claudeMode)) {
    throw new Error(`无效的 --claude-mode: ${claudeMode}`)
  }

  if (!validHooksModes.has(hooksMode)) {
    throw new Error(`无效的 --hooks: ${hooksMode}`)
  }

  if (!validMcpModes.has(mcpMode)) {
    throw new Error(`无效的 --mcp: ${mcpMode}`)
  }

  if (!validPlatforms.has(platform)) {
    throw new Error(`无效的 --platform: ${platform}`)
  }

  if (!validMcpProfiles.has(mcpProfile)) {
    throw new Error(`无效的 --mcp-profile: ${mcpProfile}`)
  }

  if (legacyLayout) {
    claudeMode = 'import-root'
    hooksMode = 'project'
  }

  return {
    help,
    force,
    interactive,
    legacyLayout,
    claudeMode,
    hooksMode,
    mcpMode,
    platform,
    mcpProfile,
    mcpServersArg,
    targetArg,
    claudeModeProvided,
    hooksModeProvided,
    mcpModeProvided,
    platformProvided,
    mcpProfileProvided,
    mcpServersProvided,
    targetProvided,
  }
}

function expandHome(inputPath) {
  if (!inputPath) return inputPath
  if (inputPath === '~') return os.homedir()
  if (inputPath.startsWith('~/') || inputPath.startsWith('~\\')) {
    return path.join(os.homedir(), inputPath.slice(2))
  }
  return inputPath
}

function resolveTargetDir(rawInput) {
  const expanded = expandHome(rawInput.trim())
  return path.resolve(process.cwd(), expanded)
}

function isWithinSourceRoot(targetDir) {
  const rel = path.relative(sourceLayout.projectRoot, targetDir)
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel)
}

function createPrompter() {
  if (!process.stdin.isTTY) {
    const bufferedInput = fs.readFileSync(0, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())

    return {
      async ask(question) {
        process.stdout.write(question)
        return bufferedInput.length > 0 ? bufferedInput.shift() : ''
      },
      close() {},
    }
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return {
    ask(question) {
      return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()))
      })
    },
    close() {
      rl.close()
    },
  }
}

async function promptForTargetDir(prompter) {
  return prompter.ask('请输入目标项目根目录（可输入 . 表示当前目录）: ')
}

async function confirm(prompter, question) {
  const answer = await prompter.ask(`${question} [y/N]: `)
  return ['y', 'yes'].includes(answer.toLowerCase())
}

async function promptChoice(prompter, title, choices, defaultValue) {
  console.log(title)
  choices.forEach((choice, index) => {
    console.log(`  ${index + 1}. ${choice.value} - ${choice.label}`)
  })

  const defaultIndex = Math.max(
    0,
    choices.findIndex((choice) => choice.value === defaultValue),
  )

  while (true) {
    const answer = await prompter.ask(`请选择 [${defaultIndex + 1}]: `)
    if (!answer) {
      return defaultValue
    }

    if (/^\d+$/.test(answer)) {
      const selected = choices[Number.parseInt(answer, 10) - 1]
      if (selected) {
        return selected.value
      }
    }

    const normalized = answer.toLowerCase()
    const selected = choices.find(
      (choice) => choice.value.toLowerCase() === normalized || (choice.aliases || []).includes(normalized),
    )
    if (selected) {
      return selected.value
    }

    console.log('输入无效，请重新选择。')
  }
}

async function promptText(prompter, question, options = {}) {
  const { defaultValue = '', required = false } = options
  while (true) {
    const suffix = defaultValue ? ` [默认: ${defaultValue}]` : ''
    const answer = await prompter.ask(`${question}${suffix}: `)
    if (answer) {
      return answer
    }
    if (defaultValue) {
      return defaultValue
    }
    if (!required) {
      return ''
    }
    console.log('该项为必填，请重新输入。')
  }
}

function ensureDirectory(targetDir) {
  if (fs.existsSync(targetDir)) {
    const stats = fs.statSync(targetDir)
    if (!stats.isDirectory()) {
      throw new Error(`目标路径不是目录: ${targetDir}`)
    }
    return
  }

  fs.mkdirSync(targetDir, { recursive: true })
}

function resolveSourcePath(relPath) {
  return path.join(sourceLayout.claudeDir, relPath)
}

function readTemplate(relPath) {
  return fs.readFileSync(resolveSourcePath(relPath), 'utf8')
}

function readJsonTemplate(relPath) {
  return JSON.parse(readTemplate(relPath))
}

function buildDotClaudeBootstrap() {
  return '# UCC\n\n@CLAUDE.ucc.md\n'
}

function buildRootBootstrap() {
  return '# UCC\n\n@.claude/CLAUDE.ucc.md\n'
}

function buildClaudeRuntimePackageJson() {
  return {
    type: 'commonjs',
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function parseCsvList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function uniqueList(values) {
  return [...new Set(values)]
}

function loadMcpCatalog() {
  return readJsonTemplate(mcpTemplate)
}

function detectPlatform() {
  if (process.platform === 'win32') {
    return 'windows'
  }

  if (process.platform === 'darwin') {
    return 'macos'
  }

  if (process.platform === 'linux') {
    if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) {
      return 'wsl'
    }

    try {
      if (fs.existsSync('/proc/version')) {
        const version = fs.readFileSync('/proc/version', 'utf8')
        if (/microsoft/i.test(version)) {
          return 'wsl'
        }
      }
    } catch {
      // ignore platform probe failures
    }

    return 'linux'
  }

  return 'linux'
}

function resolvePlatform(value) {
  return value === 'auto' ? detectPlatform() : value
}

function getSettingsSchema() {
  const template = readJsonTemplate(settingsTemplate)
  return template.$schema || settingsSchemaUrl
}

function buildSettingsOverlay(options = {}) {
  const includeHooks = Boolean(options.includeHooks)
  const enabledMcpServers = uniqueList(options.enabledMcpServers || [])

  if (!includeHooks && enabledMcpServers.length === 0) {
    return null
  }

  const overlay = {
    $schema: getSettingsSchema(),
  }

  if (includeHooks) {
    const hooksTemplate = readJsonTemplate(settingsTemplate)
    overlay.hooks = hooksTemplate.hooks || {}
  }

  if (enabledMcpServers.length > 0) {
    overlay.enabledMcpjsonServers = enabledMcpServers
  }

  return overlay
}

function getMcpServerOrder(catalog) {
  return Object.keys(catalog.mcpServers || {})
}

function getMcpPresetServers(catalog, profile) {
  const presets = (catalog._interactive && catalog._interactive.presets) || {}
  const servers = presets[profile]
  if (!Array.isArray(servers)) {
    throw new Error(`MCP 预设不存在: ${profile}`)
  }
  return servers.slice()
}

function getRequiredMcpParams(catalog, serverName) {
  return ((catalog._interactive || {}).requiredParams || {})[serverName] || []
}

function validateMcpServerNames(serverNames, catalog) {
  const knownNames = new Set(getMcpServerOrder(catalog))
  serverNames.forEach((name) => {
    if (!knownNames.has(name)) {
      throw new Error(`未知 MCP 服务: ${name}`)
    }
  })
}

function parseMcpSelectionInput(rawInput, names) {
  const tokens = parseCsvList(rawInput)
  const selected = []
  const seen = new Set()

  tokens.forEach((token) => {
    let resolved = token
    if (/^\d+$/.test(token)) {
      const byIndex = names[Number.parseInt(token, 10) - 1]
      if (!byIndex) {
        throw new Error(`MCP 选择超出范围: ${token}`)
      }
      resolved = byIndex
    }

    if (!names.includes(resolved)) {
      throw new Error(`未知 MCP 服务: ${token}`)
    }

    if (!seen.has(resolved)) {
      seen.add(resolved)
      selected.push(resolved)
    }
  })

  return selected
}

async function promptMcpServerSelection(prompter, catalog) {
  const names = getMcpServerOrder(catalog)
  console.log('请选择要启用的 MCP 服务（支持编号或名称，逗号分隔）:')
  names.forEach((name, index) => {
    const description = catalog.mcpServers[name].description || ''
    console.log(`  ${index + 1}. ${name} - ${description}`)
  })

  while (true) {
    const answer = await prompter.ask('请输入编号或名称: ')
    try {
      const selected = parseMcpSelectionInput(answer, names)
      if (selected.length > 0) {
        return selected
      }
    } catch (error) {
      console.log(error.message)
    }
    console.log('至少需要选择一个 MCP 服务。')
  }
}

async function collectMcpPromptValues(prompter, catalog, serverNames, projectRoot, allowPrompt) {
  const values = {}

  for (const serverName of serverNames) {
    const prompts = getRequiredMcpParams(catalog, serverName)
    for (const prompt of prompts) {
      const defaultValue = prompt.default === '$PROJECT_ROOT' ? projectRoot : prompt.default || ''
      let value = defaultValue

      if (allowPrompt) {
        value = await promptText(prompter, `请输入 ${serverName} 的 ${prompt.label}`, {
          defaultValue,
          required: prompt.required !== false,
        })
      } else if (!value && prompt.required !== false) {
        throw new Error(`MCP ${serverName} 缺少必填参数: ${prompt.label}`)
      }

      if (!values[serverName]) {
        values[serverName] = {
          env: {},
          args: {},
        }
      }

      if (prompt.kind === 'env') {
        values[serverName].env[prompt.key] = value
      }

      if (prompt.kind === 'arg') {
        values[serverName].args[prompt.index] = value
      }
    }
  }

  return values
}

function buildMcpServerConfig(template, serverName, platform, projectRoot, promptValues) {
  const server = clone(template)
  delete server.description

  if (Array.isArray(server.args)) {
    server.args = server.args.map((arg) => (arg === 'YOUR_PROJECTS_DIR_HERE' ? projectRoot : arg))
  }

  if (promptValues && promptValues.args) {
    Object.entries(promptValues.args).forEach(([index, value]) => {
      server.args[Number.parseInt(index, 10)] = value
    })
  }

  if (server.env) {
    Object.entries(server.env).forEach(([key, value]) => {
      if (value === 'YOUR_PROJECTS_DIR_HERE') {
        server.env[key] = projectRoot
      }
    })
  }

  if (promptValues && promptValues.env) {
    server.env = {
      ...(server.env || {}),
      ...promptValues.env,
    }
  }

  if (server.type !== 'http' && platform === 'windows' && server.command) {
    server.args = ['/c', server.command, ...(server.args || [])]
    server.command = 'cmd'
  }

  if (server.env && Object.keys(server.env).length === 0) {
    delete server.env
  }

  if (!server.type) {
    delete server.type
  }

  if (!server.url) {
    delete server.url
  }

  if (!server.command) {
    delete server.command
  }

  if (!server.args || server.args.length === 0) {
    delete server.args
  }

  if (server.type === 'http') {
    delete server.command
    delete server.args
  }

  if (!server.type && !server.command) {
    throw new Error(`MCP ${serverName} 缺少 command 或 type`)
  }

  return server
}

function buildMcpConfig(catalog, serverNames, platform, projectRoot, promptValues) {
  validateMcpServerNames(serverNames, catalog)
  const mcpServers = {}

  serverNames.forEach((serverName) => {
    mcpServers[serverName] = buildMcpServerConfig(
      catalog.mcpServers[serverName],
      serverName,
      platform,
      projectRoot,
      promptValues[serverName],
    )
  })

  return { mcpServers }
}

function shouldUseInteractiveWizard(args) {
  if (args.legacyLayout) {
    return false
  }

  if (args.interactive) {
    return true
  }

  return true
}

async function resolveMcpSelection(args, projectRoot, prompter, interactiveWizard) {
  const catalog = loadMcpCatalog()
  let platformInput = args.platform
  let profile = args.mcpProfile
  let selectedMcpServers = args.mcpServersProvided ? parseMcpSelectionInput(args.mcpServersArg, getMcpServerOrder(catalog)) : []

  if (interactiveWizard && !args.platformProvided) {
    platformInput = await promptChoice(
      prompter,
      '请选择 MCP 目标平台:',
      [
        { value: 'auto', label: '自动识别当前平台' },
        { value: 'windows', label: 'Windows 原生命令' },
        { value: 'linux', label: 'Linux 命令' },
        { value: 'macos', label: 'macOS 命令' },
        { value: 'wsl', label: 'WSL 命令' },
      ],
      'auto',
    )
  }

  if (selectedMcpServers.length === 0) {
    if (interactiveWizard && !args.mcpProfileProvided) {
      profile = await promptChoice(
        prompter,
        '请选择 MCP 预设:',
        [
          { value: 'basic', label: '最少输入，默认启用 memory / filesystem / context7' },
          { value: 'research', label: '在 basic 基础上额外启用 sequential-thinking' },
          { value: 'full', label: '启用全部内置 MCP，并提示输入必要 Key' },
          { value: 'custom', label: '手动选择需要的 MCP 服务' },
        ],
        'basic',
      )
    }

    if (profile === 'custom') {
      if (!interactiveWizard) {
        throw new Error('非交互模式下使用 --mcp-profile custom 时，必须同时提供 --mcp-servers')
      }
      selectedMcpServers = await promptMcpServerSelection(prompter, catalog)
    } else {
      selectedMcpServers = getMcpPresetServers(catalog, profile)
    }
  }

  const platform = resolvePlatform(platformInput)
  const promptValues = await collectMcpPromptValues(
    prompter,
    catalog,
    selectedMcpServers,
    projectRoot,
    interactiveWizard,
  )

  return {
    platform,
    profile,
    selectedMcpServers,
    mcpConfig: buildMcpConfig(catalog, selectedMcpServers, platform, projectRoot, promptValues),
  }
}

async function resolveInstallOptions(args, projectRoot, prompter) {
  const interactiveWizard = shouldUseInteractiveWizard(args)
  let claudeMode = args.claudeMode
  let hooksMode = args.hooksMode
  let mcpMode = args.mcpMode

  if (interactiveWizard && !args.claudeModeProvided) {
    claudeMode = await promptChoice(
      prompter,
      '请选择 CLAUDE 接入模式:',
      [
        { value: 'off', label: '不生成任何 CLAUDE 文件' },
        { value: 'dotclaude', label: '生成 .claude/CLAUDE.md 与 .claude/CLAUDE.ucc.md' },
        { value: 'import-root', label: '生成 .claude/CLAUDE.ucc.md，并在必要时生成根 CLAUDE.md' },
      ],
      claudeMode,
    )
  }

  if (interactiveWizard && !args.hooksModeProvided) {
    hooksMode = await promptChoice(
      prompter,
      '请选择 hooks 接入模式:',
      [
        { value: 'off', label: '不生成 settings 文件' },
        { value: 'local', label: '写入 .claude/settings.local.json' },
        { value: 'project', label: '写入 .claude/settings.json' },
      ],
      hooksMode,
    )
  }

  if (interactiveWizard && !args.mcpModeProvided) {
    mcpMode = await promptChoice(
      prompter,
      '请选择 MCP 接入模式:',
      [
        { value: 'off', label: '不生成 .mcp.json' },
        { value: 'project', label: '生成项目根 .mcp.json，并同步 settings MCP 名单' },
      ],
      mcpMode,
    )
  }

  const options = {
    legacyLayout: args.legacyLayout,
    claudeMode,
    hooksMode,
    mcpMode,
    platform: null,
    mcpProfile: args.mcpProfile,
    selectedMcpServers: [],
    projectSettingsOverlay: null,
    localSettingsOverlay: null,
    mcpConfig: null,
  }

  if (mcpMode === 'project') {
    const mcpSelection = await resolveMcpSelection(
      {
        ...args,
        mcpMode,
        hooksMode,
        claudeMode,
      },
      projectRoot,
      prompter,
      interactiveWizard,
    )
    options.platform = mcpSelection.platform
    options.mcpProfile = mcpSelection.profile
    options.selectedMcpServers = mcpSelection.selectedMcpServers
    options.mcpConfig = mcpSelection.mcpConfig
  }

  if (hooksMode === 'project') {
    options.projectSettingsOverlay = buildSettingsOverlay({
      includeHooks: true,
      enabledMcpServers: options.selectedMcpServers,
    })
  } else if (options.selectedMcpServers.length > 0) {
    options.projectSettingsOverlay = buildSettingsOverlay({
      includeHooks: false,
      enabledMcpServers: options.selectedMcpServers,
    })
  }

  if (hooksMode === 'local') {
    options.localSettingsOverlay = buildSettingsOverlay({
      includeHooks: true,
      enabledMcpServers: [],
    })
  }

  return options
}

function buildCopyPlan(projectRoot, options) {
  const claudeDir = path.join(projectRoot, '.claude')
  const plan = [
    {
      kind: 'writeJson',
      dst: path.join(claudeDir, 'package.json'),
      value: buildClaudeRuntimePackageJson(),
    },
    ...claudeDirItems.map((item) => ({
      kind: 'copy',
      src: item,
      dst: path.join(claudeDir, item),
    })),
  ]

  if (options.claudeMode !== 'off') {
    plan.push({
      kind: 'writeText',
      dst: path.join(claudeDir, 'CLAUDE.ucc.md'),
      content: readTemplate(uccClaudeTemplate),
    })
  }

  if (options.claudeMode === 'dotclaude') {
    plan.push({
      kind: 'writeText',
      dst: path.join(claudeDir, 'CLAUDE.md'),
      content: buildDotClaudeBootstrap(),
    })
  }

  if (options.claudeMode === 'import-root') {
    const rootClaudePath = path.join(projectRoot, 'CLAUDE.md')
    if (fs.existsSync(rootClaudePath)) {
      plan.push({
        kind: 'noticeImport',
        message: '目标项目已存在 CLAUDE.md，请手动加入以下导入：\n@.claude/CLAUDE.ucc.md',
      })
    } else {
      plan.push({
        kind: 'writeText',
        dst: rootClaudePath,
        content: buildRootBootstrap(),
      })
    }
  }

  if (options.projectSettingsOverlay) {
    plan.push({
      kind: 'mergeSettings',
      label: 'project-settings',
      overlay: options.projectSettingsOverlay,
      dst: path.join(claudeDir, 'settings.json'),
    })
  }

  if (options.localSettingsOverlay) {
    plan.push({
      kind: 'mergeSettings',
      label: 'local-settings',
      overlay: options.localSettingsOverlay,
      dst: path.join(claudeDir, 'settings.local.json'),
    })
  }

  if (options.mcpConfig) {
    plan.push({
      kind: 'writeJson',
      dst: path.join(projectRoot, '.mcp.json'),
      value: options.mcpConfig,
    })
  }

  return plan
}

function findConflicts(plan) {
  return plan.filter((entry) => entry.dst && fs.existsSync(entry.dst))
}

function copyDirectoryOrFile(src, dst, force) {
  const stats = fs.statSync(src)
  ensureDirectory(path.dirname(dst))

  if (stats.isDirectory()) {
    fs.cpSync(src, dst, { recursive: true, force })
    return
  }

  fs.cpSync(src, dst, { force })
}

function writeTextFile(dst, content) {
  ensureDirectory(path.dirname(dst))
  fs.writeFileSync(dst, content, 'utf8')
}

function writeJsonFile(dst, value) {
  writeTextFile(dst, `${JSON.stringify(value, null, 2)}\n`)
}

function mergeSettingsFile(dst, overlay) {
  const current = fs.existsSync(dst) ? JSON.parse(fs.readFileSync(dst, 'utf8')) : {}
  const merged = mergeSettings(current, overlay)
  writeJsonFile(dst, merged)
}

function executePlanEntry(entry, force) {
  if (entry.kind === 'copy') {
    copyDirectoryOrFile(resolveSourcePath(entry.src), entry.dst, force)
    console.log(`[复制] ${entry.src} -> ${entry.dst}`)
    return
  }

  if (entry.kind === 'writeText') {
    writeTextFile(entry.dst, entry.content)
    console.log(`[生成] ${entry.dst}`)
    return
  }

  if (entry.kind === 'writeJson') {
    writeJsonFile(entry.dst, entry.value)
    console.log(`[生成] ${entry.dst}`)
    return
  }

  if (entry.kind === 'mergeSettings') {
    mergeSettingsFile(entry.dst, entry.overlay)
    console.log(`[合并] ${entry.label} -> ${entry.dst}`)
    return
  }

  if (entry.kind === 'noticeImport') {
    console.log(`[提示] ${entry.message}`)
    return
  }

  throw new Error(`未知的复制计划项: ${entry.kind}`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const prompter = createPrompter()

  try {
    if (args.help) {
      printUsage()
      return
    }

    let rawTarget = args.targetArg
    if (!rawTarget) {
      rawTarget = await promptForTargetDir(prompter)
      if (!rawTarget) {
        console.error('未提供目标目录，已退出。')
        process.exit(1)
      }
    }

    const projectRoot = resolveTargetDir(rawTarget)
    if (projectRoot === sourceLayout.projectRoot || isWithinSourceRoot(projectRoot)) {
      console.error(`目标目录不能是 UCC 配置仓库或其子目录: ${projectRoot}`)
      process.exit(1)
    }

    ensureDirectory(projectRoot)
    ensureDirectory(path.join(projectRoot, '.claude'))

    const options = await resolveInstallOptions(args, projectRoot, prompter)
    const plan = buildCopyPlan(projectRoot, options)
    let shouldForce = args.force
    const conflicts = findConflicts(plan)

    if (conflicts.length > 0 && !shouldForce) {
      console.log('检测到目标目录已存在以下同名文件/目录:')
      conflicts.forEach((entry) => {
        console.log(`- ${path.relative(projectRoot, entry.dst) || path.basename(entry.dst)}`)
      })

      const confirmed = await confirm(prompter, '是否覆盖这些内容并继续复制？')
      if (!confirmed) {
        console.log('用户取消，未执行复制。')
        process.exit(1)
      }
      shouldForce = true
    }

    plan.forEach((entry) => {
      executePlanEntry(entry, shouldForce)
    })

    console.log('')
    console.log(`复制完成，共 ${plan.length} 项。`)
    console.log(`目标项目: ${projectRoot}`)
    console.log(`CLAUDE 接入模式: ${options.claudeMode}`)
    console.log(`hooks 接入模式: ${options.hooksMode}`)
    console.log(`MCP 接入模式: ${options.mcpMode}`)
    if (options.platform) {
      console.log(`MCP 目标平台: ${options.platform}`)
    }
    if (options.selectedMcpServers.length > 0) {
      console.log(`MCP 服务: ${options.selectedMcpServers.join(', ')}`)
    }
    if (args.legacyLayout) {
      console.log('兼容模式: legacy-layout')
    }
    console.log('推荐下一步:')
    console.log('1. 在项目根目录打开 Claude Code')
    console.log('2. 先使用 /ucc-team-standard、/ucc-team-research 或 /ucc-single-standard 进入 UCC 自动化流程')
    console.log('3. 检查输出末尾是否出现 配置标识：UCC')
    console.log('4. 如需校验已部署资产，可在项目根目录运行 node .claude/scripts/validate-config.js')
  } finally {
    prompter.close()
  }
}

main().catch((err) => {
  console.error(`复制失败: ${err.message}`)
  process.exit(1)
})
