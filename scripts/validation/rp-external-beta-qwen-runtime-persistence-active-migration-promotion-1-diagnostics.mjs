#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-PROMOTION-1'
const packetDir = 'docs/external-beta/qwen-runtime-persistence-active-migration-promotion-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const activeMigration = 'supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/local-validation-result.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/qwen-runtime-persistence-active-migration-promotion-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-runtime-persistence-active-migration-promotion-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-staging-migration-validation-1.md',
  activeMigration,
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-active-migration-promotion-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/qwen-runtime-persistence-local-harness-validation-retry-12/qwen-runtime-persistence-local-harness-validation-retry-12-record.json',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
]

const requiredText = [
  packet,
  'completed_qwen_runtime_persistence_active_migration_source_promoted_and_local_chain_validated',
  'completed_active_migration_source_promotion_local_only_validation_no_remote_execution',
  '52b8add9a929713fa808d92a9c6116f5bac1bdc9',
  '#1474',
  '#1478',
  '#1483',
  '#1485',
  '#1488',
  '#577',
  activeMigration,
  'Latest migration reached: `20260628000100_qwen2_5_vl_backend_runtime_persistence.sql`',
  'Local migration chain validation: `passed`',
  'Local SQL tests: `passed`',
  'Remote Supabase execution: `false`',
  'Local Supabase DB harness execution: `true`',
  'SQL execution scope: `local_harness_only`',
  'QWEN runtime execution: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-MIGRATION-VALIDATION-1',
]

const allowedChangedFiles = new Set(requiredFiles)
allowedChangedFiles.add('scripts/validation/rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-12-diagnostics.mjs')
allowedChangedFiles.add('docs/activation-phase-rp-external-beta-qwen-runtime-persistence-staging-migration-validation-1-results.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-staging-migration-validation-1/source-audit.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-staging-migration-validation-1/remote-migration-history-readback.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-staging-migration-validation-1/staging-validation-result.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-staging-migration-validation-1/validation-results.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-staging-migration-validation-1/safety-boundary.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-staging-migration-validation-1/qwen-runtime-persistence-staging-migration-validation-record.json')
allowedChangedFiles.add('docs/implementation-prompts/prompt-rp-external-beta-staging-migration-history-source-alignment-1.md')
allowedChangedFiles.add('scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-migration-validation-1-diagnostics.mjs')

const blockedPrefixes = [
  'package-lock.json',
  'database/migration-drafts/',
  'database/test-sql/',
  'docker/',
  '.github/',
  '.dockerignore',
  'requirements',
  '.env',
  'dist/',
  'dist-server/',
  'node_modules/',
  'src/',
  'server/routes/',
  'server/workers/',
]

const forbiddenClaims = [
  /\b(remote Supabase execution|remote migration apply|provider call|model call|QWEN runtime execution|worker execution|worker dispatch|route execution|Cloud Run invocation|signed URL creation|public artifact creation|deployment|Docker image build|Docker push|Docker deploy):\s*`?(true|enabled|completed)\b/i,
  /\bProduct-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  const output = execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim()
  return output ? output.split('\n').filter(Boolean) : []
}

for (const file of [...requiredFiles, ...sourceFiles]) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) if (!corpus.includes(text)) fail(`missing required text: ${text}`)

const record = JSON.parse(read(`${packetDir}/qwen-runtime-persistence-active-migration-promotion-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen_runtime_persistence_active_migration_source_promoted_and_local_chain_validated') fail('decision mismatch')
if (record.execution !== 'completed_active_migration_source_promotion_local_only_validation_no_remote_execution') fail('execution mismatch')
if (record.integrationBase !== '52b8add9a929713fa808d92a9c6116f5bac1bdc9') fail('integration base mismatch')
if (record.localHarnessRetry12Pr !== 1488) fail('missing #1488 source')
if (record.activeMigrationSource !== activeMigration) fail('active migration source mismatch')
if (record.harness?.activeMigrationApply !== 'passed') fail('active migration did not pass')
if (record.harness?.latestMigrationReached !== '20260628000100_qwen2_5_vl_backend_runtime_persistence.sql') fail('latest migration mismatch')
if (record.harness?.localSqlTests !== 'passed') fail('local SQL tests did not pass')
if (record.harness?.qwenConstraints !== 6) fail('QWEN constraint count mismatch')
if (record.harness?.qwenSpecificIndexes !== 5) fail('QWEN index count mismatch')
if (record.harness?.cleanupResult !== 'passed') fail('cleanup did not pass')
if (record.harness?.isolatedHarnessContainersLeftRunning !== 0) fail('isolated containers still running')
if (record.localSupabaseDbHarnessExecution !== true) fail('local harness execution must be recorded')
if (record.sqlExecutionScope !== 'local_harness_only') fail('SQL execution scope mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.nextMilestone !== 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-MIGRATION-VALIDATION-1') fail('next milestone mismatch')

const migration = read(activeMigration)
for (const phrase of [
  'ReeditPro active local/staging migration source',
  'qwen25_vl_jobs_payload_refs_check',
  'qwen25_vl_job_events_sanitized_payload_check',
  'qwen25_vl_worker_runtime_config_check',
  'qwen25_vl_worker_leases_refs_check',
  'qwen25_vl_backend_runtime_messages_sanitized_check',
  'qwen25_vl_job_claim_attempts_sanitized_check',
  'Qwen/Qwen2.5-VL-7B-Instruct',
  'cc594898137f460bfe9f0759e9844b3ce807cfb5',
  'qwen_vl',
]) {
  if (!migration.includes(phrase)) fail(`active migration missing phrase: ${phrase}`)
}
if (/DO NOT RUN|DO NOT APPLY TO SUPABASE|MIGRATION DRAFT ONLY/i.test(migration)) fail('active migration contains draft-only no-run wording')
if (/insert\s+into\s+public\./i.test(migration)) fail('active migration must not insert rows')
if (/create\s+table\s+public\./i.test(migration)) fail('active migration must not create tables')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-external-beta-qwen-runtime-persistence-active-migration-promotion-1:diagnostics'] !== 'node scripts/validation/rp-external-beta-qwen-runtime-persistence-active-migration-promotion-1-diagnostics.mjs') fail('missing package diagnostics script')
execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const retry12 = JSON.parse(read('docs/external-beta/qwen-runtime-persistence-local-harness-validation-retry-12/qwen-runtime-persistence-local-harness-validation-retry-12-record.json'))
if (retry12.nextMilestone !== packet) fail('retry 12 does not route to active migration promotion')

const changed = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changed) {
  const isAllowed = allowedChangedFiles.has(file)
  if (!isAllowed) fail(`unexpected changed file: ${file}`)
  if (!isAllowed) for (const blocked of blockedPrefixes) if (file === blocked || file.startsWith(blocked)) fail(`blocked file scope changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const redactedDbText = text.replaceAll('postgresql://[redacted]', '').replaceAll('postgres://[REDACTED]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(redactedDbText)) fail(`DB URL leaked in ${file}`)
  if (/\b(api[_-]?key|service[_-]?key|service[_-]?role[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(text)) fail(`secret-like assignment in ${file}`)
  if (!file.startsWith('scripts/validation/') && !file.endsWith('.sql')) {
    for (const pattern of forbiddenClaims) if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_qwen_runtime_persistence_active_migration_source_promoted_and_local_chain_validated')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-MIGRATION-VALIDATION-1')
