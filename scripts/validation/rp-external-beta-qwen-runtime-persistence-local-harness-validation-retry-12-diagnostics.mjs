#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-12'
const packetDir = 'docs/external-beta/qwen-runtime-persistence-local-harness-validation-retry-12'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/local-harness-result.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/qwen-runtime-persistence-local-harness-validation-retry-12-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-12-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-active-migration-promotion-1.md',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-12-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/qwen-runtime-persistence-draft-source-split-import-1/qwen-runtime-persistence-draft-source-split-import-record.json',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
]

const requiredText = [
  packet,
  'completed_qwen_runtime_persistence_local_harness_retry_12_draft_sql_and_local_sql_tests_passed',
  'completed_local_only_supabase_db_harness_with_draft_sql_no_remote_execution',
  'f7059e06f07e067c10e8ff9f6b0efab61946d50d',
  '#1474',
  '#1478',
  '#1483',
  '#1485',
  '#577',
  'reeditpro-rp-data-04-local-validation',
  'Supabase CLI: `2.105.0`',
  'Docker: `29.5.2`',
  'psql: `18.4`',
  'Draft SQL apply: `passed`',
  'Local SQL tests: `passed`',
  'Required runtime baseline tables: `13`',
  'QWEN-specific indexes: `5`',
  'Cleanup result: `passed`',
  'Isolated harness containers left running: `0`',
  'Remote Supabase execution: `false`',
  'Local Supabase DB harness execution: `true`',
  'SQL execution scope: `local_harness_only`',
  'QWEN runtime execution: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-PROMOTION-1',
]

const allowedChangedFiles = new Set(requiredFiles)
allowedChangedFiles.add('docs/activation-phase-rp-external-beta-qwen-runtime-persistence-draft-source-split-import-1-results.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-draft-source-split-import-1/source-audit.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-draft-source-split-import-1/imported-source.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-draft-source-split-import-1/validation-results.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-draft-source-split-import-1/safety-boundary.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-draft-source-split-import-1/qwen-runtime-persistence-draft-source-split-import-record.json')
allowedChangedFiles.add('docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-12.md')
allowedChangedFiles.add('scripts/validation/rp-external-beta-qwen-runtime-persistence-draft-source-split-import-1-diagnostics.mjs')

const blockedPrefixes = [
  'package-lock.json',
  'supabase/migrations/',
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
  /\b(remote Supabase execution|active migration promotion|provider call|model call|QWEN runtime execution|worker execution|worker dispatch|route execution|Cloud Run invocation|signed URL creation|public artifact creation|deployment|Docker image build|Docker push|Docker deploy):\s*`?(true|enabled|completed)\b/i,
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

const record = JSON.parse(read(`${packetDir}/qwen-runtime-persistence-local-harness-validation-retry-12-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen_runtime_persistence_local_harness_retry_12_draft_sql_and_local_sql_tests_passed') fail('decision mismatch')
if (record.execution !== 'completed_local_only_supabase_db_harness_with_draft_sql_no_remote_execution') fail('execution mismatch')
if (record.integrationBase !== 'f7059e06f07e067c10e8ff9f6b0efab61946d50d') fail('integration base mismatch')
if (record.draftSourceSplitImportPr !== 1485) fail('missing #1485 source')
if (record.excludedPr !== 577) fail('missing #577 exclusion')
if (record.localSupabaseProjectId !== 'reeditpro-rp-data-04-local-validation') fail('local project id mismatch')
if (record.harness?.startResult !== 'passed') fail('harness start did not pass')
if (record.harness?.activeBaselineMigrationStatus !== 'passed_through_latest_integration_migration') fail('active baseline did not pass')
if (record.harness?.latestMigrationReached !== '20260626233000') fail('latest migration mismatch')
if (record.harness?.draftSqlApply !== 'passed') fail('draft SQL did not pass')
if (record.harness?.localSqlTests !== 'passed') fail('local SQL tests did not pass')
if (record.harness?.requiredRuntimeBaselineTables !== 13) fail('baseline table count mismatch')
if (record.harness?.qwenConstraints !== 6) fail('QWEN constraint count mismatch')
if (record.harness?.qwenSpecificIndexes !== 5) fail('QWEN index count mismatch')
if (record.harness?.storageObjectSignedUrlColumns !== 0) fail('storage signed URL column count mismatch')
if (record.harness?.signedUrlEventUrlValueColumns !== 0) fail('signed URL event URL column count mismatch')
if (record.harness?.runtimeRawPromptColumns !== 0) fail('runtime raw prompt column count mismatch')
if (record.harness?.cleanupResult !== 'passed') fail('cleanup did not pass')
if (record.harness?.isolatedHarnessContainersLeftRunning !== 0) fail('isolated containers still running')
if (record.harness?.unrelatedLocalSupabaseProjectStopped !== false) fail('unrelated local project must not be stopped')
if (record.localSupabaseDbHarnessExecution !== true) fail('local harness execution must be recorded')
if (record.sqlExecutionScope !== 'local_harness_only') fail('SQL execution scope mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.nextMilestone !== 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-PROMOTION-1') fail('next milestone mismatch')

const draft = read('database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql')
if (!draft.includes('qwen25_vl_jobs_payload_refs_check')) fail('draft source missing QWEN job guard')
const tests = read('database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql')
if (!tests.includes('qwen25_vl_jobs_payload_refs_check')) fail('local SQL tests missing QWEN job guard check')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-12:diagnostics'] !== 'node scripts/validation/rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-12-diagnostics.mjs') fail('missing package diagnostics script')
execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const sourceRecord = JSON.parse(read('docs/external-beta/qwen-runtime-persistence-draft-source-split-import-1/qwen-runtime-persistence-draft-source-split-import-record.json'))
if (sourceRecord.nextMilestone !== packet) fail('draft source packet does not route to retry 12')

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
  if (!file.startsWith('scripts/validation/')) {
    for (const pattern of forbiddenClaims) if (pattern.test(text)) fail(`forbidden claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: completed_qwen_runtime_persistence_local_harness_retry_12_draft_sql_and_local_sql_tests_passed')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-PROMOTION-1')
