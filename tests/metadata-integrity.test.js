const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

const expectedCounts = {
  agents: 18,
  commands: 32,
  contexts: 3,
  skills: 19,
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function listFiles(dir, ext = '.md') {
  return fs
    .readdirSync(path.join(root, dir))
    .filter((name) => name.endsWith(ext))
    .sort()
}

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  return match ? match[1] : null
}

function hasFrontmatter(content) {
  return extractFrontmatter(content) !== null
}

function assertFrontmatterKeys(file, keys) {
  const fm = extractFrontmatter(read(file))
  assert.ok(fm, `${file} 缺少 Frontmatter`)
  keys.forEach((key) => {
    assert.ok(new RegExp(`^${key}:\\s*.+$`, 'm').test(fm), `${file} Frontmatter 缺少字段: ${key}`)
  })
}

assert.strictEqual(listFiles('agents').length, expectedCounts.agents, 'agents 数量不匹配')
assert.strictEqual(listFiles('commands').length, expectedCounts.commands, 'commands 数量不匹配')
assert.strictEqual(listFiles('contexts').length, expectedCounts.contexts, 'contexts 数量不匹配')
assert.strictEqual(
  fs
    .readdirSync(path.join(root, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(root, 'skills', entry.name, 'SKILL.md'))).length,
  expectedCounts.skills,
  'skills 数量不匹配',
)

listFiles('agents').forEach((file) => {
  assertFrontmatterKeys(path.posix.join('agents', file), ['name', 'description', 'tools', 'model'])
})

fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .forEach((entry) => {
    assertFrontmatterKeys(path.posix.join('skills', entry.name, 'SKILL.md'), ['name', 'description'])
  })

listFiles('commands').forEach((file) => {
  const rel = path.posix.join('commands', file)
  const content = read(rel)
  assert.ok(hasFrontmatter(content), `${rel} 缺少 Frontmatter`)
  assertFrontmatterKeys(rel, ['description'])
})

const guide = read('docs/配置定制指南.md')
const readme = read('README.md')

const agentsMatch = guide.match(/agents\/\s+#\s*代理配置（(\d+)个）/)
const commandsMatch = guide.match(/commands\/\s+#\s*斜杠命令（(\d+)个）/)
const skillsMatch = guide.match(/skills\/\s+#\s*技能模块（(\d+)个）/)
const guideVersion = guide.match(/\*\*文档版本：\*\*\s*(v\d+\.\d+\.\d+)/)
const readmeVersions = [...readme.matchAll(/- \*\*(v\d+\.\d+\.\d+)\*\* -/g)].map((m) => m[1])

assert.ok(agentsMatch, 'CUSTOMIZATION_GUIDE 缺少 agents 数量')
assert.ok(commandsMatch, 'CUSTOMIZATION_GUIDE 缺少 commands 数量')
assert.ok(skillsMatch, 'CUSTOMIZATION_GUIDE 缺少 skills 数量')
assert.ok(guideVersion, 'CUSTOMIZATION_GUIDE 缺少文档版本')
assert.ok(readmeVersions.length > 0, 'README 缺少版本日志')

function parseSemver(v) {
  return v.replace(/^v/, '').split('.').map((n) => Number(n))
}

const latestReadmeVersion = readmeVersions.reduce((latest, current) => {
  const [la, lb, lc] = parseSemver(latest)
  const [ca, cb, cc] = parseSemver(current)
  if (ca > la) return current
  if (ca < la) return latest
  if (cb > lb) return current
  if (cb < lb) return latest
  if (cc > lc) return current
  return latest
})

assert.strictEqual(Number(agentsMatch[1]), expectedCounts.agents, 'CUSTOMIZATION_GUIDE agents 数量不匹配')
assert.strictEqual(
  Number(commandsMatch[1]),
  expectedCounts.commands,
  'CUSTOMIZATION_GUIDE commands 数量不匹配',
)
assert.strictEqual(Number(skillsMatch[1]), expectedCounts.skills, 'CUSTOMIZATION_GUIDE skills 数量不匹配')
assert.strictEqual(guideVersion[1], latestReadmeVersion, 'CUSTOMIZATION_GUIDE 与 README 版本不一致')

console.log('metadata-integrity.test.js 通过')
