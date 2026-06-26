#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-CREATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const reportPath = 'docs/activation-supabase-clean-staging-isolated-target-creation-1-reports/clean_staging_isolated_target_creation_report.json'
const manifestPath = 'docs/activation-supabase-clean-staging-isolated-target-creation-1-reports/clean_staging_isolated_target_creation_manifest.json'

const requiredFiles = [
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-creation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-creation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-isolated-target-creation-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-isolated-target-migration-chain-apply-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-owner-decision-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-owner-decision-1-record.json',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-history-source-mapping-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-history-source-mapping-1-record.json',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1-diagnostics.mjs',
  'package.json',
]

const packetFiles = [
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-creation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-creation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-isolated-target-creation-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-isolated-target-migration-chain-apply-1.md',
]

const optionalReportFiles = [reportPath, manifestPath]

const followOnSupabaseServiceRoleRuntimeBoundaryValidation1Files = [
  'docs/supabase-worker-runtime/supabase-service-role-runtime-boundary-validation-1.md',
  'docs/supabase-worker-runtime/supabase-service-role-runtime-boundary-validation-1-record.json',
  'docs/activation-phase-supabase-service-role-runtime-boundary-validation-1-results.md',
  'docs/activation-supabase-service-role-runtime-boundary-validation-1-reports/service_role_runtime_boundary_validation_report.json',
  'docs/activation-supabase-service-role-runtime-boundary-validation-1-reports/service_role_runtime_boundary_validation_manifest.json',
  'docs/implementation-prompts/prompt-rp-internal-beta-approved-snapshot-service-role-persistence-implementation-1.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-service-role-runtime-boundary-validation-1.mjs',
  'scripts/validation/supabase-service-role-runtime-boundary-validation-1-diagnostics.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  ...optionalReportFiles,
  ...followOnSupabaseServiceRoleRuntimeBoundaryValidation1Files,
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-migration-chain-apply-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-migration-chain-apply-1-record.json',
  'docs/activation-phase-supabase-clean-staging-isolated-target-migration-chain-apply-1-results.md',
  'docs/activation-supabase-clean-staging-isolated-target-migration-chain-apply-1-reports/clean_staging_isolated_target_migration_chain_apply_report.json',
  'docs/activation-supabase-clean-staging-isolated-target-migration-chain-apply-1-reports/clean_staging_isolated_target_migration_chain_apply_manifest.json',
  'docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1.md',
  'scripts/validation/supabase-clean-staging-isolated-target-migration-chain-apply-1.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-migration-chain-apply-1-diagnostics.mjs',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1.md',
  'docs/supabase-worker-runtime/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-record.json',
  'docs/activation-phase-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-results.md',
  'docs/activation-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-reports/worker_runtime_transactional_rpc_isolated_target_readback_report.json',
  'docs/activation-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-reports/worker_runtime_transactional_rpc_isolated_target_readback_manifest.json',
  'docs/implementation-prompts/prompt-supabase-service-role-runtime-boundary-validation-1.md',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1.mjs',
  'scripts/validation/supabase-worker-runtime-transactional-rpc-isolated-target-readback-1-diagnostics.mjs',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_ISOLATED_TARGET_CREATION=true',
  'reeditpro-clean-staging-isolated-v1',
  'new_isolated_non_production_supabase_target',
  'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL',
  'SQL mutation: `none`',
  'Migration dry-run: `not_run`',
  'Migration deployed: `no`',
  'Migration history manual edit: `no`',
  'Supabase db pull: `false`',
  'Branch cleanup/delete: `not_run`',
  'Internal beta unlocked: `false`',
  'External beta unlocked: `false`',
  'Production unlocked: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-MIGRATION-CHAIN-APPLY-1',
  'PR #577',
]

const forbiddenPatterns = [
  /credentialPayloadPrinted"?\s*:\s*true/i,
  /credentialPayloadPersistedInRepo"?\s*:\s*true/i,
  /sqlMutation"?\s*:\s*true/i,
  /migrationDryRun"?\s*:\s*true/i,
  /migrationApply"?\s*:\s*true/i,
  /migrationHistoryManualEdit"?\s*:\s*true/i,
  /supabaseDbPull"?\s*:\s*true/i,
  /branchCreate"?\s*:\s*true/i,
  /branchDelete"?\s*:\s*true/i,
  /branchReset"?\s*:\s*true/i,
  /storageObjectCreation"?\s*:\s*true/i,
  /storageObjectRead"?\s*:\s*true/i,
  /serviceRoleRouteExecution"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /providerCall"?\s*:\s*true/i,
  /modelCall"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /internalBetaUnlock"?\s*:\s*true/i,
  /externalBetaUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /SQL mutation:\s*`(?!(none|false)`)/i,
  /Migration deployed:\s*`(?!(no|false|local_only)`)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

const secretPatterns = [
  [/sbp_[A-Za-z0-9_./=-]+/, 'Supabase access token leaked'],
  [/\bpostgres(?:ql)?:\/\/\S+/i, 'database URL leaked'],
  [/https:\/\/[a-z0-9-]+\.supabase\.co/i, 'Supabase URL leaked'],
  [/"db_pass"\s*:\s*"[^"]+"/i, 'database password leaked'],
  [/"jwt_secret"\s*:\s*"[^"]+"/i, 'JWT secret leaked'],
  [/"orgId"\s*:\s*"(?!\[present\])[^"]+"/i, 'organization id leaked'],
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function exists(file) {
  return fs.existsSync(file)
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
}

function changedFiles() {
  return [
    ...new Set([
      ...gitLines(['diff', '--name-only', 'HEAD']),
      ...gitLines(['diff', '--cached', '--name-only']),
      ...gitLines(['ls-files', '--others', '--exclude-standard']),
    ]),
  ]
}

for (const file of requiredFiles) read(file)

const corpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/') && file !== 'package.json')
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

const packetCorpus = packetFiles.map((file) => read(file)).join('\n')
for (const pattern of forbiddenPatterns) {
  if (pattern.test(packetCorpus)) fail(`forbidden claim matched in packet docs: ${pattern}`)
}

const record = JSON.parse(read('docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-creation-1-record.json'))
if (record.packet !== packet) fail('record packet mismatch')
if (record.confirmationVar !== 'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_ISOLATED_TARGET_CREATION') fail('confirmation var mismatch')
if (record.target?.projectName !== 'reeditpro-clean-staging-isolated-v1') fail('target name mismatch')
if (record.target?.targetClass !== 'new_isolated_non_production_supabase_target') fail('target class mismatch')
if (record.target?.dbUrlSecret !== 'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL') fail('target secret mismatch')
if (record.safety?.credentialPayloadPrinted !== false) fail('credential payload printed must be false')
if (record.safety?.credentialPayloadPersistedInRepo !== false) fail('credential payload persisted must be false')
if (record.safety?.sqlMutation !== false) fail('SQL mutation must be false')
if (record.safety?.migrationDryRun !== false) fail('migration dry-run must be false')
if (record.safety?.migrationApply !== false) fail('migration apply must be false')
if (record.safety?.migrationHistoryManualEdit !== false) fail('migration history manual edit must be false')
if (record.safety?.supabaseDbPull !== false) fail('Supabase db pull must be false')
if (record.safety?.branchCreate !== false) fail('branch create must be false')
if (record.safety?.branchDelete !== false) fail('branch delete must be false')
if (record.safety?.branchReset !== false) fail('branch reset must be false')
if (record.safety?.storageObjectCreation !== false) fail('storage object creation must be false')
if (record.safety?.storageObjectRead !== false) fail('storage object read must be false')
if (record.safety?.internalBetaUnlock !== false) fail('internal beta unlock must be false')
if (record.safety?.externalBetaUnlock !== false) fail('external beta unlock must be false')
if (record.safety?.productionUnlock !== false) fail('production unlock must be false')
if (!record.nextMilestones?.includes('SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-MIGRATION-CHAIN-APPLY-1')) fail('migration-chain apply next milestone missing')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')

if (exists(reportPath)) {
  if (!exists(manifestPath)) fail('report exists without manifest')
  const report = JSON.parse(read(reportPath))
  if (report.packet !== packet) fail('report packet mismatch')
  if (report.targetProjectName !== 'reeditpro-clean-staging-isolated-v1') fail('report target mismatch')
  if (report.safety?.credentialPayloadPrinted !== false) fail('report credential payload printed must be false')
  if (report.safety?.credentialPayloadPersistedInRepo !== false) fail('report credential payload persisted must be false')
  if (report.safety?.sqlMutation !== false) fail('report SQL mutation must be false')
  if (report.safety?.migrationApply !== false) fail('report migration apply must be false')
  if (report.safety?.migrationDryRun !== false) fail('report migration dry-run must be false')
  if (report.safety?.migrationHistoryManualEdit !== false) fail('report migration history manual edit must be false')
  if (report.safety?.supabaseDbPull !== false) fail('report Supabase db pull must be false')
  if (report.safety?.branchCreate !== false) fail('report branch create must be false')
  if (report.safety?.branchDelete !== false) fail('report branch delete must be false')
  if (report.safety?.branchReset !== false) fail('report branch reset must be false')
  if (report.safety?.storageObjectCreation !== false) fail('report storage object creation must be false')
  if (report.safety?.storageObjectRead !== false) fail('report storage object read must be false')
  if (report.safety?.internalBetaUnlock !== false) fail('report internal beta unlock must be false')
  if (report.safety?.externalBetaUnlock !== false) fail('report external beta unlock must be false')
  if (report.safety?.productionUnlock !== false) fail('report production unlock must be false')
  if (report.decision === 'completed_isolated_clean_staging_target_creation_source_aligned_secret_rotation') {
    if (report.dbUrlSecretRotation !== 'completed') fail('completed report must rotate DB URL secret')
    if (report.migrationHistoryEvidence?.sourceAlignedNoRemoteOnlyMigrations !== true) fail('completed report must prove source alignment')
    if (!report.selectedProjectRef) fail('completed report missing selected project ref')
  }
}

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['supabase-clean-staging-isolated-target-creation-1'] !==
  'node scripts/validation/supabase-clean-staging-isolated-target-creation-1.mjs'
) {
  fail('missing runner package script')
}
if (
  packageJson.scripts?.['supabase-clean-staging-isolated-target-creation-1:diagnostics'] !==
  'node scripts/validation/supabase-clean-staging-isolated-target-creation-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

for (const file of changedFiles()) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (file === 'package-lock.json') fail('package-lock changed')
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  if (file.startsWith('supabase/migrations/') || file.startsWith('supabase/functions/')) fail(`Supabase source changed: ${file}`)
  if (file.startsWith('server/') || file.startsWith('src/') || file.startsWith('docker/') || file.startsWith('database/')) fail(`runtime/source path changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  const text = read(file)
    .replaceAll('postgresql://[redacted]', '')
    .replaceAll('supabase migration list --db-url [redacted]', '')
    .replaceAll('supabase migration list --db-url [REDACTED_REPLACEMENT_BRANCH_DB_URL]', '')
  for (const [pattern, message] of secretPatterns) {
    if (pattern.test(text)) fail(`${message} in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log(`Decision: ${record.decision}`)
