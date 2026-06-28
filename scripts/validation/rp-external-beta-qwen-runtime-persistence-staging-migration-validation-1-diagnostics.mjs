#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-MIGRATION-VALIDATION-1'
const packetDir = 'docs/external-beta/qwen-runtime-persistence-staging-migration-validation-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/remote-migration-history-readback.md`,
  `${packetDir}/staging-validation-result.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/qwen-runtime-persistence-staging-migration-validation-record.json`,
  'docs/activation-phase-rp-external-beta-qwen-runtime-persistence-staging-migration-validation-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-staging-migration-history-source-alignment-1.md',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-migration-validation-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-active-migration-promotion-1-diagnostics.mjs',
  'package.json',
]

const sourceFiles = [
  'docs/external-beta/qwen-runtime-persistence-active-migration-promotion-1/qwen-runtime-persistence-active-migration-promotion-record.json',
  'supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql',
]

const requiredText = [
  packet,
  'blocked_remote_staging_migration_history_requires_source_alignment_before_qwen_apply',
  'completed_guarded_staging_migration_dry_run_no_migration_apply',
  'wmyyttnynmteqgcdishd',
  'Reeditpro',
  'staging',
  'non_production_staging',
  '#1490',
  '#577',
  '20260628000100_qwen2_5_vl_backend_runtime_persistence.sql',
  'remote_staging_migration_history_has_uncommitted_source_versions',
  '202606270001',
  'tool_cost_metering_events',
  '71e9214a04a1726aafae6aea3a9f4a1b',
  '202606270002',
  'beta_readiness_evidence_packets',
  '9d83b4b38dfe2b15521c59474c6fba7c',
  '202606270003',
  'tool_cost_wallet_settlement_rpc',
  '47998b2f5e92887527f4800973fc6803',
  'Remote migration versions not found in local migrations directory.',
  'Remote migration apply: `false`',
  'QWEN runtime execution: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-STAGING-MIGRATION-HISTORY-SOURCE-ALIGNMENT-1',
]

const allowedChangedFiles = new Set(requiredFiles)
allowedChangedFiles.add('docs/activation-phase-rp-external-beta-qwen-runtime-persistence-staging-migration-validation-1-results.md')
allowedChangedFiles.add('docs/activation-phase-rp-external-beta-staging-migration-history-source-alignment-1-results.md')
allowedChangedFiles.add('docs/external-beta/staging-migration-history-source-alignment-1/source-audit.md')
allowedChangedFiles.add('docs/external-beta/staging-migration-history-source-alignment-1/source-alignment-result.md')
allowedChangedFiles.add('docs/external-beta/staging-migration-history-source-alignment-1/dry-run-result.md')
allowedChangedFiles.add('docs/external-beta/staging-migration-history-source-alignment-1/validation-results.md')
allowedChangedFiles.add('docs/external-beta/staging-migration-history-source-alignment-1/safety-boundary.md')
allowedChangedFiles.add('docs/external-beta/staging-migration-history-source-alignment-1/staging-migration-history-source-alignment-record.json')
allowedChangedFiles.add('docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-staging-migration-apply-1.md')
allowedChangedFiles.add('scripts/validation/rp-external-beta-staging-migration-history-source-alignment-1-diagnostics.mjs')
allowedChangedFiles.add('supabase/migrations/202606270001_tool_cost_metering_events.sql')
allowedChangedFiles.add('supabase/migrations/202606270002_beta_readiness_evidence_packets.sql')
allowedChangedFiles.add('supabase/migrations/202606270003_tool_cost_wallet_settlement_rpc.sql')

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
  /\b(remote Supabase mutation|remote migration apply|QWEN migration applied to staging|provider\/model call|provider call|model call|QWEN runtime execution|worker execution|worker dispatch|route execution|Cloud Run invocation|signed URL creation|public artifact creation|deployment|Docker image build|Docker push|Docker deploy):\s*`?(true|enabled|completed|passed)\b/i,
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

const record = JSON.parse(read(`${packetDir}/qwen-runtime-persistence-staging-migration-validation-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'blocked_remote_staging_migration_history_requires_source_alignment_before_qwen_apply') fail('decision mismatch')
if (record.execution !== 'completed_guarded_staging_migration_dry_run_no_migration_apply') fail('execution mismatch')
if (record.integrationBase !== 'e98796027c7067ad7a765fdafd8bf5d12a6b164a') fail('integration base mismatch')
if (record.activeMigrationPromotionPr !== 1490) fail('missing #1490 source')
if (record.excludedPr !== 577) fail('missing #577 exclusion')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.target?.projectName !== 'Reeditpro') fail('target name mismatch')
if (record.target?.environment !== 'staging') fail('target environment mismatch')
if (record.remoteReadback?.migrationList !== 'passed') fail('migration list mismatch')
if (record.remoteReadback?.dryRun !== 'blocked_remote_only_versions_present') fail('dry-run status mismatch')
if (record.remoteReadback?.readOnlySchemaMigrationsSql !== 'passed') fail('read-only SQL status mismatch')
if (record.remoteReadback?.localPendingMigration !== '20260628000100') fail('local pending migration mismatch')
if (record.blocker !== 'remote_staging_migration_history_has_uncommitted_source_versions') fail('blocker mismatch')

const remoteOnly = record.remoteReadback?.remoteOnlyMigrations ?? []
const expected = [
  ['202606270001', 'tool_cost_metering_events', 12, '71e9214a04a1726aafae6aea3a9f4a1b'],
  ['202606270002', 'beta_readiness_evidence_packets', 9, '9d83b4b38dfe2b15521c59474c6fba7c'],
  ['202606270003', 'tool_cost_wallet_settlement_rpc', 10, '47998b2f5e92887527f4800973fc6803'],
]
for (const [version, name, statementCount, statementsMd5] of expected) {
  const row = remoteOnly.find((item) => item.version === version)
  if (!row) fail(`missing remote-only migration ${version}`)
  if (row.name !== name) fail(`name mismatch for ${version}`)
  if (row.statementCount !== statementCount) fail(`statement count mismatch for ${version}`)
  if (row.statementsMd5 !== statementsMd5) fail(`statement hash mismatch for ${version}`)
}

const safety = record.safety ?? {}
if (safety.secretManagerPayloadAccess !== 'ephemeral_db_url_and_supabase_pat_only_not_printed_or_persisted') fail('secret access scope mismatch')
if (safety.remoteSupabaseCommandExecution !== 'read_only_and_dry_run_only') fail('remote command scope mismatch')
if (safety.remoteSqlExecution !== 'read_only_migration_history_inspection_only') fail('remote SQL scope mismatch')
for (const key of [
  'remoteSupabaseMutation',
  'remoteMigrationApply',
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
if (record.nextMilestone !== 'RP-EXTERNAL-BETA-STAGING-MIGRATION-HISTORY-SOURCE-ALIGNMENT-1') fail('next milestone mismatch')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-external-beta-qwen-runtime-persistence-staging-migration-validation-1:diagnostics'] !== 'node scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-migration-validation-1-diagnostics.mjs') fail('missing package diagnostics script')
execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const activeRecord = JSON.parse(read('docs/external-beta/qwen-runtime-persistence-active-migration-promotion-1/qwen-runtime-persistence-active-migration-promotion-record.json'))
if (activeRecord.nextMilestone !== packet) fail('active migration packet does not route to staging validation')

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
console.log('Decision: blocked_remote_staging_migration_history_requires_source_alignment_before_qwen_apply')
console.log('Next milestone: RP-EXTERNAL-BETA-STAGING-MIGRATION-HISTORY-SOURCE-ALIGNMENT-1')
