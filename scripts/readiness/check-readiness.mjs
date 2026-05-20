import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()

const checks = []

function addCheck({ id, label, passed, severity = 'warning', message, recommendation }) {
  checks.push({ id, label, passed, severity, message, recommendation })
}

function readJson(file) {
  return JSON.parse(readFileSync(path.join(root, file), 'utf8'))
}

function fileExists(file) {
  return existsSync(path.join(root, file))
}

function listFiles(dir) {
  const fullPath = path.join(root, dir)

  if (!existsSync(fullPath)) return []

  return readdirSync(fullPath)
    .filter((name) => statSync(path.join(fullPath, name)).isFile())
    .sort()
}

const packageJson = readJson('package.json')
const scripts = packageJson.scripts ?? {}
const requiredScripts = ['dev', 'build', 'lint', 'preview', 'test:readiness']

requiredScripts.forEach((script) => {
  addCheck({
    id: `script-${script}`,
    label: `package script: ${script}`,
    passed: Boolean(scripts[script]),
    severity: 'critical',
    message: scripts[script]
      ? `${script} script is present.`
      : `${script} script is missing from package.json.`,
    recommendation: `Add a ${script} script before local/staging readiness testing.`,
  })
})

const criticalFiles = [
  'AGENTS.md',
  'README.md',
  'package.json',
  'src/lib/mock-planner.ts',
  'src/lib/planner-validation.ts',
  'src/components/editor/ChatNativeEditor.tsx',
  'supabase/migrations',
  'database/test-sql',
]

criticalFiles.forEach((file) => {
  addCheck({
    id: `critical-file-${file}`,
    label: `critical path: ${file}`,
    passed: fileExists(file),
    severity: 'critical',
    message: fileExists(file) ? `${file} exists.` : `${file} is missing.`,
    recommendation: 'Restore the missing critical path before running broader local/staging tests.',
  })
})

const keyDocs = [
  'connected-planning-system-overview.md',
  'implementation-status-and-next-phase.md',
  'launch-tool-stack-update.md',
  'supabase-production-test-readiness.md',
  'editing-agent-execution-architecture.md',
  'master-timing-architecture.md',
  'source-cleanup-trim-planning.md',
  'worker-job-step-catalog.md',
  'worker-runtime-status-policy.md',
]

keyDocs.forEach((file) => {
  addCheck({
    id: `doc-${file}`,
    label: `readiness doc: ${file}`,
    passed: fileExists(file),
    severity: 'warning',
    message: fileExists(file)
      ? `${file} exists.`
      : `${file} is missing; readiness can continue but documentation is incomplete.`,
    recommendation: 'Add or restore the missing documentation before production readiness review.',
  })
})

const migrationFiles = listFiles('supabase/migrations').filter((file) => file.endsWith('.sql'))
addCheck({
  id: 'supabase-migrations-present',
  label: 'Supabase migrations present',
  passed: migrationFiles.length > 0,
  severity: 'critical',
  message: `${migrationFiles.length} migration file(s) found in supabase/migrations.`,
  recommendation: 'Restore migration files before database test readiness work.',
})

const testSqlFiles = listFiles('database/test-sql').filter((file) => file.endsWith('.sql'))
addCheck({
  id: 'database-test-sql-present',
  label: 'Manual database test SQL present',
  passed: testSqlFiles.length > 0,
  severity: 'warning',
  message: `${testSqlFiles.length} manual SQL test file(s) found in database/test-sql.`,
  recommendation: 'Add manual local/staging SQL smoke tests before database validation.',
})

if (fileExists('.env.example')) {
  const envExample = readFileSync(path.join(root, '.env.example'), 'utf8')
  const secretPatterns = [
    { label: 'OpenAI-style key', pattern: /sk-[A-Za-z0-9_-]{20,}/ },
    { label: 'JWT-looking token', pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
    { label: 'Service role value', pattern: /^SUPABASE_SERVICE_ROLE_KEY=(?!\s*$).+/m },
    { label: 'Provider key value', pattern: /^(OPENAI_API_KEY|AI_PROVIDER_WAN_API_KEY|AI_PROVIDER_HAILUO_API_KEY|MIRELO_API_KEY|MMAUDIO_API_KEY|STRIPE_SECRET_KEY)=(?!\s*$).+/m },
  ]
  const matchedSecret = secretPatterns.find((item) => item.pattern.test(envExample))

  addCheck({
    id: 'env-example-placeholder-only',
    label: '.env.example placeholder safety',
    passed: !matchedSecret,
    severity: 'critical',
    message: matchedSecret
      ? `.env.example appears to contain a real-looking ${matchedSecret.label}.`
      : '.env.example does not contain obvious real-looking secrets.',
    recommendation: 'Keep real values out of source control and use secure runtime configuration.',
  })
} else {
  addCheck({
    id: 'env-example-present',
    label: '.env.example present',
    passed: false,
    severity: 'warning',
    message: '.env.example is missing.',
    recommendation: 'Add placeholder-only env documentation before local/staging setup.',
  })
}

const deps = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
}
const forbiddenSdkNames = [
  'openai',
  '@google-cloud/storage',
  '@google-cloud/tasks',
  '@google-cloud/pubsub',
  '@google-cloud/workflows',
  'stripe',
  'playwright',
  'fluent-ffmpeg',
  'ffmpeg-static',
  'sharp',
  '@remotion/renderer',
]
const installedForbiddenSdks = forbiddenSdkNames.filter((name) => deps[name])

addCheck({
  id: 'forbidden-provider-sdks-absent',
  label: 'No forbidden production SDKs added',
  passed: installedForbiddenSdks.length === 0,
  severity: 'critical',
  message: installedForbiddenSdks.length === 0
    ? 'No forbidden provider/cloud/tool/rendering SDKs are listed in package.json.'
    : `Forbidden SDK(s) found: ${installedForbiddenSdks.join(', ')}.`,
  recommendation: 'Remove production execution SDKs unless a future milestone explicitly adds them behind backend/runtime boundaries.',
})

const criticalFailures = checks.filter((check) => !check.passed && check.severity === 'critical')
const warnings = checks.filter((check) => !check.passed && check.severity !== 'critical')

console.log('ReeditPro testing readiness check')
console.log('=================================')
console.log(`Checks: ${checks.length}`)
console.log(`Critical failures: ${criticalFailures.length}`)
console.log(`Warnings: ${warnings.length}`)
console.log(`Migrations found: ${migrationFiles.length}`)
console.log(`Manual SQL tests found: ${testSqlFiles.length}`)
console.log('')

checks.forEach((check) => {
  const prefix = check.passed ? 'PASS' : check.severity === 'critical' ? 'FAIL' : 'WARN'
  console.log(`[${prefix}] ${check.label}`)
  console.log(`  ${check.message}`)
  if (!check.passed && check.recommendation) {
    console.log(`  Recommendation: ${check.recommendation}`)
  }
})

console.log('')
console.log('Safety boundary: this script reads local files only. It does not run Supabase, SQL, providers, tools, cloud, rendering, billing, uploads, or workers.')

if (criticalFailures.length > 0) {
  process.exit(1)
}
