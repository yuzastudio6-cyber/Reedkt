#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-MIGRATION-APPLY-1'
const packetDir = 'docs/external-beta/qwen-runtime-persistence-staging-migration-apply-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/migration-apply-result.md`,
  `${packetDir}/readback-validation.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/qwen-runtime-persistence-staging-migration-apply-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-runtime-persistence-staging-migration-apply-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-staging-rls-storage-readback-1.md',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-migration-apply-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-staging-migration-history-source-alignment-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/staging-migration-history-source-alignment-1/staging-migration-history-source-alignment-record.json',
  'supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql',
  'database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql',
]

const requiredText = [
  packet,
  'completed_qwen_runtime_persistence_staging_migration_apply_and_readback_validation',
  'completed_guarded_single_qwen_staging_migration_apply',
  'wmyyttnynmteqgcdishd',
  'Reeditpro',
  'staging',
  '#1495',
  '#577',
  '20260628000100_qwen2_5_vl_backend_runtime_persistence.sql',
  'passed_only_qwen_pending',
  'single_staging_migration_apply_only',
  'qwen_migration_present_remote',
  'remote_database_is_up_to_date',
  'Required runtime baseline tables: `13`',
  'QWEN constraints: `6`',
  'QWEN-specific indexes: `5`',
  'Remote mutation: `true`',
  'Remote migration apply: `true`',
  'QWEN runtime execution: `false`',
  'Provider/model calls: `false`',
  'Worker dispatch: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-RLS-STORAGE-READBACK-1',
]

const allowedChangedFiles = new Set(requiredFiles)
allowedChangedFiles.add('docs/activation-phase-rp-external-beta-qwen-runtime-persistence-staging-migration-apply-1-results.md')
for (const file of [
  'docs/external-beta/qwen-runtime-persistence-staging-rls-storage-readback-1/source-audit.md',
  'docs/external-beta/qwen-runtime-persistence-staging-rls-storage-readback-1/rls-storage-readback-result.md',
  'docs/external-beta/qwen-runtime-persistence-staging-rls-storage-readback-1/migration-drift-result.md',
  'docs/external-beta/qwen-runtime-persistence-staging-rls-storage-readback-1/validation-results.md',
  'docs/external-beta/qwen-runtime-persistence-staging-rls-storage-readback-1/safety-boundary.md',
  'docs/external-beta/qwen-runtime-persistence-staging-rls-storage-readback-1/qwen-runtime-persistence-staging-rls-storage-readback-record.json',
  'docs/activation-phase-rp-external-beta-qwen-runtime-persistence-staging-rls-storage-readback-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-staging-service-role-route-gate-1.md',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-rls-storage-readback-1-diagnostics.mjs',
]) {
  allowedChangedFiles.add(file)
}

const forbiddenChangedPrefixes = [
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
  /\b(provider\/model call|provider call|model call|QWEN runtime execution|worker execution|worker dispatch|route execution|Cloud Run invocation|signed URL creation|public artifact creation|deployment|Docker image build|Docker push|Docker deploy):\s*`?(true|enabled|completed|passed)\b/i,
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

const record = JSON.parse(read(`${packetDir}/qwen-runtime-persistence-staging-migration-apply-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_qwen_runtime_persistence_staging_migration_apply_and_readback_validation') fail('decision mismatch')
if (record.execution !== 'completed_guarded_single_qwen_staging_migration_apply') fail('execution mismatch')
if (record.integrationBase !== '524130ab4764a0d83a0637a3321a7ba3f12aefdf') fail('integration base mismatch')
if (record.sourceAlignmentPr !== 1495) fail('missing #1495 source')
if (record.excludedPr !== 577) fail('missing #577 exclusion')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.target?.projectName !== 'Reeditpro') fail('target name mismatch')
if (record.target?.environment !== 'staging') fail('target environment mismatch')
if (record.preApplyDryRun?.result !== 'passed_only_qwen_pending') fail('pre-apply dry-run mismatch')
if (record.preApplyDryRun?.pendingMigration !== '20260628000100_qwen2_5_vl_backend_runtime_persistence.sql') fail('pre-apply migration mismatch')
if (record.apply?.result !== 'passed') fail('apply result mismatch')
if (record.apply?.appliedMigration !== '20260628000100_qwen2_5_vl_backend_runtime_persistence.sql') fail('applied migration mismatch')
if (record.apply?.remoteMutationScope !== 'single_staging_migration_apply_only') fail('mutation scope mismatch')

const readback = record.postApplyReadback ?? {}
if (readback.migrationList !== 'passed_qwen_remote_present') fail('migration list readback mismatch')
if (readback.sqlTests !== 'passed') fail('sql tests mismatch')
if (readback.requiredRuntimeBaselineTables !== 13) fail('baseline table count mismatch')
if (readback.mediaAnalysisJobType !== 1) fail('media_analysis count mismatch')
if (readback.qwenConstraints !== 6) fail('qwen constraints count mismatch')
if (readback.qwenToolRuntimeCheckAllowsQwenVl !== 1) fail('qwen_vl runtime check mismatch')
if (readback.qwenSpecificIndexes !== 5) fail('qwen indexes count mismatch')
if (readback.activeClaimLeaseIndexes !== 2) fail('claim lease indexes count mismatch')
if (readback.storageObjectSignedUrlColumns !== 0) fail('storage signed URL column count mismatch')
if (readback.signedUrlEventUrlValueColumns !== 0) fail('signed URL event URL columns mismatch')
if (readback.runtimeRawPromptColumns !== 0) fail('raw prompt column count mismatch')
if (readback.finalDryRun !== 'passed_remote_database_is_up_to_date') fail('final dry-run mismatch')

const safety = record.safety ?? {}
if (safety.secretManagerPayloadAccess !== 'ephemeral_db_url_only_not_printed_or_persisted') fail('secret access scope mismatch')
if (safety.remoteSupabaseMutation !== true) fail('remote mutation must be true for this packet')
if (safety.remoteMutationScope !== 'single_staging_migration_apply_only') fail('remote mutation scope mismatch')
if (safety.remoteMigrationApply !== true) fail('remote migration apply must be true for this packet')
for (const key of [
  'migrationHistoryRepairEdit',
  'providerModelCalls',
  'qwenRuntimeExecution',
  'workerDispatch',
  'routeExecution',
  'cloudRunInvocation',
  'mediaProcessing',
  'signedUrlCreation',
  'publicArtifactCreation',
  'broadExternalBetaUnlock',
  'productionFinalExportUnlock',
]) {
  if (safety[key] !== false) fail(`safety flag must be false: ${key}`)
}
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact status mismatch')
if (record.nextMilestone !== 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-RLS-STORAGE-READBACK-1') fail('next milestone mismatch')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-external-beta-qwen-runtime-persistence-staging-migration-apply-1:diagnostics'] !== 'node scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-migration-apply-1-diagnostics.mjs') fail('missing package diagnostics script')
execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const sourceAlignmentRecord = JSON.parse(read('docs/external-beta/staging-migration-history-source-alignment-1/staging-migration-history-source-alignment-record.json'))
if (sourceAlignmentRecord.nextMilestone !== packet) fail('source alignment packet does not route to staging apply')

const changed = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]

for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blocked of forbiddenChangedPrefixes) if (file === blocked || file.startsWith(blocked)) fail(`blocked file scope changed: ${file}`)
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
console.log('Decision: completed_qwen_runtime_persistence_staging_migration_apply_and_readback_validation')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-RLS-STORAGE-READBACK-1')
