import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const repoRoot = process.cwd()
const scanRoots = [
  'src/backend/qwen-runtime',
  'src/types',
  'server/smoke',
  'server/cli',
  'server/routes',
  'scripts',
  'docs',
  'src/lib',
  'src/components',
]

const frontendBackendImportPattern = /from\s+['"].*(?:src\/)?backend\/qwen-runtime|import\s*\([^)]*(?:src\/)?backend\/qwen-runtime/
const authorizationLogPattern = /console\.(?:log|warn|error|info)\s*\([^)]*Authorization/i
const secretLiteralPatterns = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bBearer\s+[A-Za-z0-9._-]{24,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAIza[A-Za-z0-9_-]{20,}\b/,
  /['"`][A-Za-z0-9_=-]{48,}['"`]/,
]

function walk(dir) {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir)
  return entries.flatMap((entry) => {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === 'coverage' || entry === '.git') return []
      return walk(path)
    }
    return stat.isFile() ? [path] : []
  })
}

function isTextFile(path) {
  return /\.(ts|tsx|js|mjs|md|json)$/.test(path)
}

function isFrontendFile(path) {
  return path.includes('/src/lib/') || path.includes('/src/components/') || path.includes('/src/pages/')
}

function isDocFile(path) {
  return path.endsWith('.md')
}

function hasForbiddenGcloudSecretCommand(text) {
  const commandPattern = new RegExp(`\\b${'g'}cloud\\s+secrets\\s+(?:versions\\s+access|list|describe)\\b`, 'i')
  return commandPattern.test(text)
}

const allTextFiles = scanRoots
  .flatMap((root) => walk(join(repoRoot, root)))
  .filter(isTextFile)

const files = allTextFiles.filter((path) => {
  const rel = relative(repoRoot, path)
  if (rel === 'scripts/check-qwen-secret-leakage.mjs') return true
  if (rel.startsWith('src/backend/qwen-runtime/')) return true
  if (rel.startsWith('src/types/qwen-')) return true
  if (rel.startsWith('server/smoke/qwen-')) return true
  if (rel.startsWith('server/cli/qwen-')) return true
  if (rel.startsWith('server/routes/qwen-')) return true
  if (rel.startsWith('docs/qwen-')) return true
  if (rel.startsWith('scripts/check-qwen-')) return true
  return isFrontendFile(path) && /backend\/qwen-runtime|qwen-runtime/i.test(readFileSync(path, 'utf8').slice(0, 8000))
})

const findings = []

for (const path of files) {
  const rel = relative(repoRoot, path)
  const text = readFileSync(path, 'utf8')
  if (isFrontendFile(path) && frontendBackendImportPattern.test(text)) {
    findings.push({ severity: 'blocker', file: rel, finding: 'frontend_imports_backend_qwen_runtime' })
  }
  if (authorizationLogPattern.test(text)) {
    findings.push({ severity: 'blocker', file: rel, finding: 'authorization_header_logging_pattern' })
  }
  if (!isDocFile(path) && rel !== 'scripts/check-qwen-secret-leakage.mjs') {
    for (const pattern of secretLiteralPatterns) {
      if (pattern.test(text)) {
        findings.push({ severity: 'blocker', file: rel, finding: 'secret_like_literal_in_executable_file' })
        break
      }
    }
  }
  if (!isDocFile(path) && hasForbiddenGcloudSecretCommand(text)) {
    findings.push({ severity: 'blocker', file: rel, finding: 'direct_gcloud_secret_command_text_in_executable_file' })
  }
}

const blockers = findings.filter((finding) => finding.severity === 'blocker')
const result = {
  ok: blockers.length === 0,
  scannedFileCount: files.length,
  findingCount: findings.length,
  findings,
  flags: {
    qwenProviderCalled: false,
    gcloudCommandRun: false,
    secretValuesPrinted: false,
    supabaseCommandRun: false,
    renderWorkerCreditEffects: false,
  },
}

console.log(JSON.stringify(result, null, 2))
if (!result.ok) process.exitCode = 1
