#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-BETA-STAGING-MIGRATION-HISTORY-SOURCE-ALIGNMENT-1'
const packetDir = 'docs/external-beta/staging-migration-history-source-alignment-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const alignedMigrations = [
  'supabase/migrations/202606270001_tool_cost_metering_events.sql',
  'supabase/migrations/202606270002_beta_readiness_evidence_packets.sql',
  'supabase/migrations/202606270003_tool_cost_wallet_settlement_rpc.sql',
]

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/source-alignment-result.md`,
  `${packetDir}/dry-run-result.md`,
  `${packetDir}/validation-results.md`,
  `${packetDir}/safety-boundary.md`,
  `${packetDir}/staging-migration-history-source-alignment-record.json`,
  'docs/activation-phase-rp-external-beta-staging-migration-history-source-alignment-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-beta-qwen-runtime-persistence-staging-migration-apply-1.md',
  'scripts/validation/rp-external-beta-staging-migration-history-source-alignment-1-diagnostics.mjs',
  'scripts/validation/rp-external-beta-qwen-runtime-persistence-staging-migration-validation-1-diagnostics.mjs',
  'package.json',
  ...alignedMigrations,
]

const sourceFiles = [
  'docs/external-beta/qwen-runtime-persistence-staging-migration-validation-1/qwen-runtime-persistence-staging-migration-validation-record.json',
  'supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql',
]

const requiredText = [
  packet,
  'completed_staging_remote_only_migration_history_source_alignment',
  'completed_source_alignment_import_no_remote_migration_apply',
  'wmyyttnynmteqgcdishd',
  'Reeditpro',
  'staging',
  '#1493',
  '#577',
  '202606270001',
  'tool_cost_metering_events',
  '6653396cf311412bd402cc3ca78a00d56d96538cff899396a2745d672b79786d',
  '202606270002',
  'beta_readiness_evidence_packets',
  'eeff596176d8a4e2c6a83be91953a0e379e290e82e11c32d871172517ccc9c6d',
  '202606270003',
  'tool_cost_wallet_settlement_rpc',
  '123cf0f71e47041598f68f1d90b04d8b82573ab7fcf15c0a6e82611528201e1a',
  'passed_only_qwen_pending',
  '20260628000100_qwen2_5_vl_backend_runtime_persistence.sql',
  'Remote migration apply: `false`',
  'QWEN runtime execution: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-MIGRATION-APPLY-1',
]

const allowedChangedFiles = new Set(requiredFiles)
allowedChangedFiles.add('docs/activation-phase-rp-external-beta-staging-migration-history-source-alignment-1-results.md')

const forbiddenChangedPrefixes = [
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
  /\b(remote Supabase mutation|remote migration apply|provider\/model call|provider call|model call|QWEN runtime execution|worker execution|worker dispatch|route execution|Cloud Run invocation|signed URL creation|public artifact creation|deployment|Docker image build|Docker push|Docker deploy):\s*`?(true|enabled|completed|passed)\b/i,
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

const record = JSON.parse(read(`${packetDir}/staging-migration-history-source-alignment-record.json`))
if (record.packet !== packet) fail('packet mismatch')
if (record.decision !== 'completed_staging_remote_only_migration_history_source_alignment') fail('decision mismatch')
if (record.execution !== 'completed_source_alignment_import_no_remote_migration_apply') fail('execution mismatch')
if (record.integrationBase !== '8e4d32faabd0bad3774355589d8f03de4d26cf55') fail('integration base mismatch')
if (record.stagingValidationPr !== 1493) fail('missing #1493 source')
if (record.excludedPr !== 577) fail('missing #577 exclusion')
if (record.target?.projectRef !== 'wmyyttnynmteqgcdishd') fail('target ref mismatch')
if (record.target?.projectName !== 'Reeditpro') fail('target name mismatch')
if (record.target?.environment !== 'staging') fail('target environment mismatch')
if (record.postAlignmentDryRun?.result !== 'passed_only_qwen_pending') fail('dry-run result mismatch')
if (record.postAlignmentDryRun?.remainingPendingMigration !== '20260628000100_qwen2_5_vl_backend_runtime_persistence.sql') fail('pending migration mismatch')
if (record.postAlignmentDryRun?.remoteOnlyHistoryError !== 'closed') fail('remote-only history error not closed')

const expected = [
  ['202606270001', 'tool_cost_metering_events', alignedMigrations[0], 12, '71e9214a04a1726aafae6aea3a9f4a1b', '6653396cf311412bd402cc3ca78a00d56d96538cff899396a2745d672b79786d', 'tool_cost_events'],
  ['202606270002', 'beta_readiness_evidence_packets', alignedMigrations[1], 9, '9d83b4b38dfe2b15521c59474c6fba7c', 'eeff596176d8a4e2c6a83be91953a0e379e290e82e11c32d871172517ccc9c6d', 'beta_readiness_evidence_packets'],
  ['202606270003', 'tool_cost_wallet_settlement_rpc', alignedMigrations[2], 10, '47998b2f5e92887527f4800973fc6803', '123cf0f71e47041598f68f1d90b04d8b82573ab7fcf15c0a6e82611528201e1a', 'settle_tool_cost_event'],
]

for (const [version, name, localFile, statementCount, statementsMd5, sha256, marker] of expected) {
  const row = record.sourceAlignedMigrations?.find((item) => item.version === version)
  if (!row) fail(`missing source-aligned migration ${version}`)
  if (row.name !== name) fail(`name mismatch for ${version}`)
  if (row.localFile !== localFile) fail(`local file mismatch for ${version}`)
  if (row.remoteStatementCount !== statementCount) fail(`statement count mismatch for ${version}`)
  if (row.remoteStatementsMd5 !== statementsMd5) fail(`remote hash mismatch for ${version}`)
  if (row.localFileSha256 !== sha256) fail(`local sha mismatch for ${version}`)
  const migrationText = read(localFile)
  if (!migrationText.includes(marker)) fail(`migration ${version} missing SQL marker`)
  if (/\b(service_role|serviceRoleKey|secretValue|databaseUrl|signedUrl|publicUrl)\b/i.test(migrationText)) fail(`migration ${version} contains forbidden secret/url marker`)
}

const safety = record.safety ?? {}
if (safety.secretManagerPayloadAccess !== 'ephemeral_db_url_only_not_printed_or_persisted') fail('secret access scope mismatch')
if (safety.remoteSupabaseCommandExecution !== 'migration_list_and_dry_run_only') fail('remote command scope mismatch')
if (safety.remoteSqlExecution !== 'read_only_schema_migrations_source_readback_only') fail('remote SQL scope mismatch')
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
if (record.nextMilestone !== 'RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-MIGRATION-APPLY-1') fail('next milestone mismatch')

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['rp-external-beta-staging-migration-history-source-alignment-1:diagnostics'] !== 'node scripts/validation/rp-external-beta-staging-migration-history-source-alignment-1-diagnostics.mjs') fail('missing package diagnostics script')
execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const stagingRecord = JSON.parse(read('docs/external-beta/qwen-runtime-persistence-staging-migration-validation-1/qwen-runtime-persistence-staging-migration-validation-record.json'))
if (stagingRecord.nextMilestone !== packet) fail('staging validation packet does not route to source alignment')

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
console.log('Decision: completed_staging_remote_only_migration_history_source_alignment')
console.log('Next milestone: RP-EXTERNAL-BETA-QWEN-RUNTIME-PERSISTENCE-STAGING-MIGRATION-APPLY-1')
