#!/usr/bin/env node

'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')
const readline = require('readline')

const scriptRoot = path.resolve(__dirname, '..')
const sourceLayout = resolveSourceLayout(scriptRoot)
const projectRootItems = ['CLAUDE.md']
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
const settingsTemplate = path.join('hooks', 'project-settings.json')

function resolveSourceLayout(candidateRoot) {
  const directProjectRoot = candidateRoot
  const nestedProjectRoot = path.resolve(candidateRoot, '..')
  const hasDirectClaude = fs.existsSync(path.join(directProjectRoot, 'CLAUDE.md'))
  const hasNestedClaude = fs.existsSync(path.join(nestedProjectRoot, 'CLAUDE.md'))

  if (hasDirectClaude) {
    return {
      projectRoot: directProjectRoot,
      claudeDir: directProjectRoot,
    }
  }

  if (hasNestedClaude) {
    return {
      projectRoot: nestedProjectRoot,
      claudeDir: candidateRoot,
    }
  }

  throw new Error(`未找到源 CLAUDE.md，无法识别脚本所在布局: ${candidateRoot}`)
}

function printUsage() {
  console.log('用法:')
  console.log('  node .claude/scripts/copy-config.js <项目根目录> [--force]')
  console.log('  node .claude/scripts/copy-config.js')
  console.log('')
  console.log('说明:')
  console.log('  - 未传目标目录时，会提示输入项目根目录')
  console.log('  - 会将 CLAUDE.md 复制到项目根目录')
  console.log('  - 其余配置复制到项目根目录的 .claude/ 下')
  console.log('  - 会自动生成 .claude/settings.json（来自 hooks/project-settings.json）')
  console.log('  - 目标已有同名文件/目录时，默认会二次确认；使用 --force 可直接覆盖')
}

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith('-')))
  const positional = argv.filter((arg) => !arg.startsWith('-'))

  return {
    help: flags.has('--help') || flags.has('-h'),
    force: flags.has('--force') || flags.has('-f'),
    targetArg: positional[0] || '',
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

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer))
  })
}

async function promptForTargetDir() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    const answer = await askQuestion(rl, '请输入目标项目根目录（可输入 . 表示当前目录）: ')
    return answer.trim()
  } finally {
    rl.close()
  }
}

async function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    const answer = await askQuestion(rl, `${question} [y/N]: `)
    return ['y', 'yes'].includes(answer.trim().toLowerCase())
  } finally {
    rl.close()
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

function buildCopyPlan(projectRoot) {
  const claudeDir = path.join(projectRoot, '.claude')
  const plan = projectRootItems.map((item) => ({
    src: item,
    dst: path.join(projectRoot, item),
  }))

  claudeDirItems.forEach((item) => {
    plan.push({
      src: item,
      dst: path.join(claudeDir, item),
    })
  })

  plan.push({
    src: settingsTemplate,
    dst: path.join(claudeDir, 'settings.json'),
  })

  return plan
}

function findConflicts(plan) {
  return plan.filter((entry) => fs.existsSync(entry.dst))
}

function resolveSourcePath(relPath) {
  if (projectRootItems.includes(relPath)) {
    return path.join(sourceLayout.projectRoot, relPath)
  }

  return path.join(sourceLayout.claudeDir, relPath)
}

function copyEntry(entry, force) {
  const src = resolveSourcePath(entry.src)
  const stats = fs.statSync(src)
  ensureDirectory(path.dirname(entry.dst))

  if (stats.isDirectory()) {
    fs.cpSync(src, entry.dst, { recursive: true, force })
  } else {
    fs.cpSync(src, entry.dst, { force })
  }
}

async function main() {
  const { help, force, targetArg } = parseArgs(process.argv.slice(2))
  if (help) {
    printUsage()
    return
  }

  let rawTarget = targetArg
  if (!rawTarget) {
    rawTarget = await promptForTargetDir()
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

  const plan = buildCopyPlan(projectRoot)
  let shouldForce = force
  const conflicts = findConflicts(plan)

  if (conflicts.length > 0 && !shouldForce) {
    console.log('检测到目标目录已存在以下同名文件/目录:')
    conflicts.forEach((entry) => {
      console.log(`- ${path.relative(projectRoot, entry.dst) || path.basename(entry.dst)}`)
    })

    const confirmed = await confirm('是否覆盖这些内容并继续复制？')
    if (!confirmed) {
      console.log('用户取消，未执行复制。')
      process.exit(1)
    }
    shouldForce = true
  }

  plan.forEach((entry) => {
    copyEntry(entry, shouldForce)
    console.log(`[复制] ${entry.src} -> ${entry.dst}`)
  })

  console.log('')
  console.log(`复制完成，共 ${plan.length} 项。`)
  console.log(`目标项目: ${projectRoot}`)
  console.log('推荐下一步:')
  console.log('1. 在项目根目录打开 Claude Code')
  console.log('2. 先使用 /ucc-team-standard、/ucc-team-research 或 /ucc-single-standard 进入 UCC 自动化流程')
  console.log('3. 检查输出末尾是否出现 配置标识：UCC')
  console.log('4. 如需校验已部署资产，可在项目根目录运行 node .claude/scripts/validate-config.js')
}

main().catch((err) => {
  console.error(`复制失败: ${err.message}`)
  process.exit(1)
})
