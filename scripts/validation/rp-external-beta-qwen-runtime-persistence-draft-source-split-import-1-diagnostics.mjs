#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-DRAFT-SOURCE-SPLIT-IMPORT-1'
const packetDir = 'docs/external-beta/qwen-runtime-persistence-draft-source-split-import-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const draftSql = 'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql'
const localSqlTests = 'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/imported-source.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/qwen-runtime-persistence-draft-source-split-import-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-runtime-persistence-draft-source-split-import-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-12.md',
  draftSql,
  localSqlTests,
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-draft-source-split-import-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/qwen-runtime-stack-fresh-source-import-1/qwen-runtime-stack-fresh-source-import-record.json',
  'docs/external-beta/qwen-runtime-persistence-baseline-split-import-1/qwen-runtime-persistence-baseline-split-import-record.json',
  'docs/external-beta/qwen-runtime-persistence-local-harness-validation-retry-11/qwen-runtime-persistence-local-harness-validation-retry-11-record.json',
]

const requiredText = [
  packet,
  'completed_qwen_runtime_persistence_draft_source_split_import_024_draft_sql_and_022_local_sql_tests',
  'completed_source_import_draft_sql_and_local_sql_tests_no_sql_execution',
  '4b7882ad08e60a44ade3dcdd3bd5ba52eb8b5e54',
  'origin/codex/qwen2-5-vl-7b-backend-runtime-persistence-migration-draft',
  '#1474',
  '#1478',
  '#1483',
  '#1465',
  '#577',
  draftSql,
  localSqlTests,
  'DO NOT RUN',
  'DO NOT APPLY TO SUPABASE',
  'Remote Supabase execution: `false`',
  'SQL execution: `false`',
  'Migration apply: `false`',
  'QWEN runtime execution: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-12',
]

const allowedChangedFiles = new Set(requiredFiles)
allowedChangedFiles.add('scripts/validation/rp-external-beta-qwen-runtime-stack-fresh-source-import-1-diagnostics.mjs')
allowedChangedFiles.add('scripts/validation/rp-external-beta-qwen-runtime-persistence-baseline-split-import-1-diagnostics.mjs')
allowedChangedFiles.add('scripts/validation/rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-11-diagnostics.mjs')
allowedChangedFiles.add('docs/activation-phase-rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-12-results.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-local-harness-validation-retry-12/source-audit.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-local-harness-validation-retry-12/local-harness-result.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-local-harness-validation-retry-12/validation-results.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-local-harness-validation-retry-12/safety-boundary.md')
allowedChangedFiles.add('docs/external-beta/qwen-runtime-persistence-local-harness-validation-retry-12/qwen-runtime-persistence-local-harness-validation-retry-12-record.json')
allowedChangedFiles.add('docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-active-migration-promotion-1.md')
allowedChangedFiles.add('scripts/validation/rp-external-beta-qwen-runtime-persistence-local-harness-validation-retry-12-diagnostics.mjs')

const blockedPrefixes = [
  'package-lock.json',
  'supabase/migrations/',
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
  /\b(remote Supabase execution|SQL execution|migration apply|provider call|model call|QWEN runtime execution|worker execution|worker dispatch|route execution|Cloud Run invocation|signed URL creation|public artifact creation|deployment|Docker image build|Docker push|Docker deploy):\s*`?(true|enabled|completed)\b/i,
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

const record = JSON.parse(read(`${packetDir}/qwen-runtime-persistence-draft-source-split-import-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen_runtime_persistence_draft_source_split_import_024_draft_sql_and_022_local_sql_tests') fail('decision mismatch')
if (record.execution !== 'completed_source_import_draft_sql_and_local_sql_tests_no_sql_execution') fail('execution mismatch')
if (record.integrationBase !== '4b7882ad08e60a44ade3dcdd3bd5ba52eb8b5e54') fail('integration base mismatch')
if (record.sourceBranch !== 'origin/codex/qwen2-5-vl-7b-backend-runtime-persistence-migration-draft') fail('source branch mismatch')
if (record.sourceGuardPr !== 1474) fail('missing #1474 source guard')
if (record.baselineSplitImportPr !== 1478) fail('missing #1478 source')
if (record.localHarnessRetryPr !== 1483) fail('missing #1483 source')
if (record.sourceQwenPr !== 1465) fail('missing #1465 source')
if (record.excludedPr !== 577) fail('missing #577 exclusion')
if (record.activeMigrationImported !== false) fail('must not import active migration')
if (record.remoteSupabaseExecution !== false) fail('remote Supabase execution must be false')
if (record.sqlExecution !== false) fail('SQL execution must be false')
if (record.migrationApply !== false) fail('migration apply must be false')
if (record.qwenRuntimeExecution !== false) fail('QWEN runtime execution must be false')
if (record.workerDispatch !== false) fail('worker dispatch must be false')
if (record.providerModelCalls !== false) fail('provider/model calls must be false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.nextMilestone !== 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-12') fail('next milestone mismatch')
for (const file of [draftSql, localSqlTests]) if (!record.importedFiles?.includes(file)) fail(`record missing imported file: ${file}`)

const draft = read(draftSql)
for (const phrase of [
  'DO NOT RUN',
  'DO NOT APPLY TO SUPABASE',
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
  if (!draft.includes(phrase)) fail(`draft SQL missing phrase: ${phrase}`)
}
if (/create\s+table\s+public\./i.test(draft)) fail('draft SQL must not create new tables in this split import')
if (/insert\s+into\s+public\./i.test(draft)) fail('draft SQL must not insert rows')
if (/create\s+policy\s+/i.test(draft)) fail('draft SQL must not add RLS policies')

const tests = read(localSqlTests)
for (const phrase of [
  'Do not run in production',
  'database/migration-drafts/024_qwen2_5_vl_backend_runtime_persistence.draft.sql',
  'qwen25_vl_jobs_payload_refs_check',
  'qwen25_vl_job_events_sanitized_payload_check',
  'qwen25_vl_worker_runtime_config_check',
  'qwen25_vl_worker_leases_refs_check',
  'qwen25_vl_backend_runtime_messages_sanitized_check',
  'qwen25_vl_job_claim_attempts_sanitized_check',
  'tool_runtime_checks_tool_name_check',
  'jobs_qwen_worker_type_idx',
]) {
  if (!tests.includes(phrase)) fail(`local SQL tests missing phrase: ${phrase}`)
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-external-beta-qwen-runtime-persistence-draft-source-split-import-1:diagnostics'] !== 'node scripts/validation/rp-external-beta-qwen-runtime-persistence-draft-source-split-import-1-diagnostics.mjs') fail('missing package diagnostics script')
execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const stackGuard = JSON.parse(read('docs/external-beta/qwen-runtime-stack-fresh-source-import-1/qwen-runtime-stack-fresh-source-import-record.json'))
if (stackGuard.diffReadback?.directStackMergeApproved !== false) fail('stack guard unexpectedly approves direct merge')
if (stackGuard.diffReadback?.blindCherryPickApproved !== false) fail('stack guard unexpectedly approves blind cherry-pick')
const baseline = JSON.parse(read('docs/external-beta/qwen-runtime-persistence-baseline-split-import-1/qwen-runtime-persistence-baseline-split-import-record.json'))
if (baseline.nextMilestone !== 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-11') fail('baseline source chain mismatch')
const retry = JSON.parse(read('docs/external-beta/qwen-runtime-persistence-local-harness-validation-retry-11/qwen-runtime-persistence-local-harness-validation-retry-11-record.json'))
if (retry.harness?.qwenDraftSqlStatus !== 'not_present_in_current_integration') fail('retry-11 historical absent status mismatch')
if (retry.harness?.qwenLocalSqlTestsStatus !== 'not_present_in_current_integration') fail('retry-11 historical tests status mismatch')

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
console.log('Decision: completed_qwen_runtime_persistence_draft_source_split_import_024_draft_sql_and_022_local_sql_tests')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-LOCAL-HARNESS-VALIDATION-RETRY-12')
