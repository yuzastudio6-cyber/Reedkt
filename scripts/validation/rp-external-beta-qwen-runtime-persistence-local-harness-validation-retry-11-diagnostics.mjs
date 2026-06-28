#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-11'
const packetDir = 'docs/external-beta/qwen-runtime-persistence-local-harness-validation-retry-11'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/local-harness-result.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/qwen-runtime-persistence-local-harness-validation-retry-11-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-11-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-draft-source-split-import-1.md',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-11-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/qwen-runtime-persistence-baseline-split-import-1/qwen-runtime-persistence-baseline-split-import-record.json',
]

const requiredText = [
  packet,
  'completed_qwen_runtime_persistence_local_harness_retry_11_active_baseline_passed_qwen_draft_source_absent',
  'completed_local_only_supabase_db_harness_validation_no_remote_execution',
  'f4016f0a40e73cd15b51ead6beb1334efb2e95ef',
  '#1478',
  '#1474',
  '#577',
  'local_supabase_db_only',
  'reeditpro-rp-data-04-local-validation',
  'Supabase CLI: `2.105.0`',
  'Docker: `29.5.2`',
  'psql: `18.4`',
  'passed_through_latest_integration_migration',
  '20260626233000',
  'qa_reports.approved_plan_snapshot_id=1',
  'qa_reports_approved_plan_snapshot_id_fkey=1',
  'idx_qa_reports_project_snapshot=1',
  'QWEN draft SQL status: `not_present_in_current_integration`',
  'QWEN local SQL tests status: `not_present_in_current_integration`',
  'Cleanup result: `passed`',
  'Unrelated local Supabase project stopped: `false`',
  'QWEN runtime executed: `false`',
  'Worker dispatch: `false`',
  'Provider/model calls: `false`',
  'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-DRAFT-SOURCE-SPLIT-IMPORT-1',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
]

const allowedChangedFiles = new Set(requiredFiles)
allowedChangedFiles.add('docs/activation-phase-rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-11-results.md')
allowedChangedFiles.add('docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-draft-source-split-import-1.md')
allowedChangedFiles.add('scripts/validation/rp-external-beta-qwen-runtime-persistence-baseline-split-import-1-diagnostics.mjs')

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
  'server/',
]

const forbiddenClaims = [
  /\b(remote Supabase execution|remote SQL execution|remote migration apply|provider call|model call|QWEN runtime execution|worker execution|worker dispatch|route execution|Cloud Run invocation|signed URL creation|public artifact creation|deployment|Docker image build\/push\/deploy):\s*`?(true|enabled|completed)\b/i,
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

const record = JSON.parse(read(`${packetDir}/qwen-runtime-persistence-local-harness-validation-retry-11-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen_runtime_persistence_local_harness_retry_11_active_baseline_passed_qwen_draft_source_absent') fail('decision mismatch')
if (record.execution !== 'completed_local_only_supabase_db_harness_validation_no_remote_execution') fail('execution mismatch')
if (record.integrationBase !== 'f4016f0a40e73cd15b51ead6beb1334efb2e95ef') fail('integration base mismatch')
if (record.sourceSplitImportPr !== 1478) fail('missing #1478 source')
if (record.sourceGuardPr !== 1474) fail('missing #1474 source')
if (record.localSupabaseProjectId !== 'reeditpro-rp-data-04-local-validation') fail('local project id mismatch')
if (record.harness?.startResult !== 'passed') fail('harness start did not pass')
if (record.harness?.activeBaselineMigrationStatus !== 'passed_through_latest_integration_migration') fail('active baseline did not pass')
if (record.harness?.latestMigrationReached !== '20260626233000') fail('latest migration mismatch')
if (record.harness?.qaReportsApprovedPlanSnapshotColumn !== 1) fail('qa reports column readback mismatch')
if (record.harness?.qaReportsApprovedPlanSnapshotForeignKey !== 1) fail('qa reports FK readback mismatch')
if (record.harness?.qaReportsProjectSnapshotIndex !== 1) fail('qa reports index readback mismatch')
if (record.harness?.qwenDraftSqlStatus !== 'not_present_in_current_integration') fail('QWEN draft SQL status mismatch')
if (record.harness?.qwenLocalSqlTestsStatus !== 'not_present_in_current_integration') fail('QWEN local SQL status mismatch')
if (record.harness?.cleanupResult !== 'passed') fail('cleanup did not pass')
if (record.harness?.unrelatedLocalSupabaseProjectStopped !== false) fail('unrelated local project must not be stopped')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
for (const [key, value] of Object.entries(record.safety ?? {})) {
  if (value !== false) fail(`safety flag must be false: ${key}`)
}

if (fs.existsSync('database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql')) {
  fail('QWEN draft SQL unexpectedly exists in current integration')
}
if (fs.existsSync('database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql')) {
  fail('QWEN local SQL tests unexpectedly exist in current integration')
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-11:diagnostics'] !== 'node scripts/validation/rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-11-diagnostics.mjs') fail('missing package diagnostics script')
execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const sourceRecord = JSON.parse(read('docs/external-beta/qwen-runtime-persistence-baseline-split-import-1/qwen-runtime-persistence-baseline-split-import-record.json'))
if (sourceRecord.nextMilestone !== packet) fail('baseline split import does not route to retry 11')

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
console.log('Decision: completed_qwen_runtime_persistence_local_harness_retry_11_active_baseline_passed_qwen_draft_source_absent')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-DRAFT-SOURCE-SPLIT-IMPORT-1')
