#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-CHAIN-APPLY-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-chain-apply-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-chain-apply-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-migration-chain-apply-1-results.md',
  'docs/activation-supabase-clean-staging-branch-migration-chain-apply-1-reports/clean_staging_branch_migration_chain_apply_report.json',
  'docs/activation-supabase-clean-staging-branch-migration-chain-apply-1-reports/clean_staging_branch_migration_chain_apply_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-migration-chain-apply-1.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-migration-history-reconciliation-1.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-migration-history-reconciliation-1-results.md',
  'docs/activation-supabase-clean-staging-branch-migration-history-reconciliation-1-reports/clean_staging_branch_migration_history_reconciliation_report.json',
  'docs/activation-supabase-clean-staging-branch-migration-history-reconciliation-1-reports/clean_staging_branch_migration_history_reconciliation_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-migration-history-reconciliation-1-results.md',
  'docs/activation-supabase-clean-staging-branch-migration-history-reconciliation-1-reports/clean_staging_branch_migration_history_reconciliation_report.json',
  'docs/activation-supabase-clean-staging-branch-migration-history-reconciliation-1-reports/clean_staging_branch_migration_history_reconciliation_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-migration-history-reconciliation-1-results.md',
  'docs/activation-supabase-clean-staging-branch-migration-history-reconciliation-1-reports/clean_staging_branch_migration_history_reconciliation_report.json',
  'docs/activation-supabase-clean-staging-branch-migration-history-reconciliation-1-reports/clean_staging_branch_migration_history_reconciliation_manifest.json',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-guarded-validation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-guarded-validation-1-record.json',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-db-url-secret-handoff-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-target-owner-approval-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-migration-chain-apply-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'blocked_clean_branch_remote_migration_history_has_untracked_versions',
  'blocked_before_migration_apply_no_sql_mutation',
  'blocked_pending_clean_staging_migration_history_reconciliation',
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_MIGRATION_CHAIN_APPLY=true',
  'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` / version `1` / `enabled',
  'SUPABASE_ACCESS_TOKEN` version `5` / `enabled',
  'Secret Manager payload access: `true_guarded_clean_branch_db_url_only`',
  'Credential payload printed: `false`',
  'Credential payload persisted in repo: `false`',
  'supabase migration list --db-url [redacted]',
  'supabase db push --dry-run --db-url [redacted]',
  'Dry-run status: `blocked`',
  'SQL execution: `none`',
  'SQL mutation: `none`',
  'Migration deployed: `no`',
  'Migration history manual edit: `no`',
  'Storage object creation: `false`',
  'Storage object read: `false`',
  'Internal beta unlocked: `false`',
  'External beta unlocked: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '20260610235210',
  '20260626162800',
  '202606050001',
  '202606180001',
  '20260625031135',
  'SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-HISTORY-RECONCILIATION-1',
  'PR #577',
]

const allowedChangedFiles = new Set([
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-chain-apply-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-chain-apply-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-migration-chain-apply-1-results.md',
  'docs/activation-supabase-clean-staging-branch-migration-chain-apply-1-reports/clean_staging_branch_migration_chain_apply_report.json',
  'docs/activation-supabase-clean-staging-branch-migration-chain-apply-1-reports/clean_staging_branch_migration_chain_apply_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-migration-chain-apply-1.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-migration-history-reconciliation-1.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-migration-history-reconciliation-1-results.md',
  'docs/activation-supabase-clean-staging-branch-migration-history-reconciliation-1-reports/clean_staging_branch_migration_history_reconciliation_report.json',
  'docs/activation-supabase-clean-staging-branch-migration-history-reconciliation-1-reports/clean_staging_branch_migration_history_reconciliation_manifest.json',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-migration-chain-apply-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-guarded-validation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-target-owner-approval-1-diagnostics.mjs',
  'scripts/validation/supabase-staging-migration-history-owner-decision-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
])

const forbiddenClaimPatterns = [
  /remoteSupabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /sqlMutation"?\s*:\s*true/i,
  /migrationApply"?\s*:\s*true/i,
  /migrationHistoryUpdatedBySupabaseCliApply"?\s*:\s*true/i,
  /rlsPolicyApplyByMigration"?\s*:\s*true/i,
  /storageBucketMetadataUpsertByMigration"?\s*:\s*true/i,
  /storageObjectCreation"?\s*:\s*true/i,
  /storageObjectRead"?\s*:\s*true/i,
  /serviceRoleRouteExecution"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /internalBetaUnlock"?\s*:\s*true/i,
  /externalBetaUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
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

const evidenceFiles = requiredFiles.filter((file) => !file.startsWith('scripts/validation/') && file !== 'package.json')
const corpus = evidenceFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbiddenClaimPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read('docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-chain-apply-1-record.json'))
if (record.decision !== 'blocked_clean_branch_remote_migration_history_has_untracked_versions') fail('record decision mismatch')
if (record.execution !== 'blocked_before_migration_apply_no_sql_mutation') fail('record execution mismatch')
if (record.cleanTarget?.branchRef !== 'fnjiylwirntrqdcwpbho') fail('clean branch ref mismatch')
if (record.credentialMetadata?.cleanBranchDbUrlLatestVersion !== '1') fail('clean branch DB URL secret version mismatch')
if (record.credentialMetadata?.supabaseAccessTokenLatestVersion !== '5') fail('access-token secret version mismatch')
if (record.dryRunValidation?.dryRunStatus !== 'blocked') fail('dry-run status mismatch')
if (!record.dryRunValidation?.untrackedRemoteMigrationIds?.includes('20260610235210')) fail('missing first untracked remote version')
if (!record.dryRunValidation?.untrackedRemoteMigrationIds?.includes('20260626162800')) fail('missing second untracked remote version')
if (!record.dryRunValidation?.missingRequiredMigrationIds?.includes('202606050001')) fail('missing registry migration blocker absent')
if (!record.dryRunValidation?.missingRequiredMigrationIds?.includes('202606180001')) fail('missing worker RPC migration blocker absent')
if (!record.dryRunValidation?.missingRequiredMigrationIds?.includes('20260625031135')) fail('missing internal beta gap migration blocker absent')
if (record.safety?.remoteSupabaseReadCommand !== true) fail('remote read command must be true')
if (record.safety?.remoteSupabaseMutation !== false) fail('Supabase mutation must be false')
if (record.safety?.sqlExecution !== false) fail('SQL execution must be false')
if (record.safety?.sqlMutation !== false) fail('SQL mutation must be false')
if (record.safety?.migrationDryRun !== true) fail('migration dry-run must be true')
if (record.safety?.migrationApply !== false) fail('migration apply must be false')
if (record.safety?.storageObjectRead !== false) fail('storage object read must be false')
if (record.safety?.credentialPayloadPrinted !== false) fail('credential payload printed must be false')
if (record.safety?.credentialPayloadPersistedInRepo !== false) fail('credential payload persisted must be false')
if (record.safety?.internalBetaUnlock !== false) fail('internal beta unlock must be false')
if (record.safety?.externalBetaUnlock !== false) fail('external beta unlock must be false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')
if (record.nextMilestone !== 'SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-HISTORY-RECONCILIATION-1') fail('next milestone mismatch')

const report = JSON.parse(read('docs/activation-supabase-clean-staging-branch-migration-chain-apply-1-reports/clean_staging_branch_migration_chain_apply_report.json'))
if (report.decision !== record.decision) fail('report decision mismatch')
if (report.runId !== record.runEvidence?.runId) fail('report run ID mismatch')
if (!report.untrackedRemoteMigrationIds?.includes('20260610235210')) fail('report first untracked remote version missing')
if (!report.untrackedRemoteMigrationIds?.includes('20260626162800')) fail('report second untracked remote version missing')
if (report.dryRun?.status !== 'blocked') fail('report dry-run status mismatch')
if (report.apply) fail('apply should not be present when dry-run blocks')
if (report.safety?.secretManagerPayloadAccess !== true) fail('report must record guarded secret payload access')
if (report.safety?.remoteSupabaseMutation !== false) fail('report Supabase mutation must be false')
if (report.safety?.sqlExecution !== false) fail('report SQL execution must be false')
if (report.safety?.migrationApply !== false) fail('report migration apply must be false')
if (report.safety?.storageObjectRead !== false) fail('report storage object read must be false')
if (report.safety?.credentialPayloadPrinted !== false) fail('report credential payload printed must be false')
if (report.safety?.credentialPayloadPersistedInRepo !== false) fail('report credential payload persisted must be false')

const manifest = JSON.parse(read('docs/activation-supabase-clean-staging-branch-migration-chain-apply-1-reports/clean_staging_branch_migration_chain_apply_manifest.json'))
if (!manifest.artifacts?.some((artifact) => artifact.sha256 === record.runEvidence?.reportSha256)) fail('report checksum missing from manifest')
if (!manifest.artifacts?.some((artifact) => artifact.sha256 === record.runEvidence?.manifestSha256)) fail('manifest checksum missing from manifest')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['supabase-clean-staging-branch-migration-chain-apply-1'] !==
  'node scripts/validation/supabase-clean-staging-branch-migration-chain-apply-1.mjs'
) {
  fail('missing runner package script')
}
if (
  packageJson.scripts?.['supabase-clean-staging-branch-migration-chain-apply-1:diagnostics'] !==
  'node scripts/validation/supabase-clean-staging-branch-migration-chain-apply-1-diagnostics.mjs'
) {
  fail('missing diagnostics package script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const secretPatterns = [
  [/sbp_[A-Za-z0-9_./=-]+/, 'Supabase access token leaked'],
  [/\bpostgres(?:ql)?:\/\/\S+/i, 'database URL leaked'],
  [/"db_pass"\s*:\s*"[^"]+"/i, 'database password leaked'],
  [/"jwt_secret"\s*:\s*"[^"]+"/i, 'JWT secret leaked'],
  [/https:\/\/[a-z0-9-]+\.supabase\.co/i, 'Supabase URL leaked'],
]

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
    .replaceAll('supabase migration repair --status reverted 20260610235210 20260626162800', '')
  for (const [pattern, message] of secretPatterns) {
    if (pattern.test(text)) fail(`${message} in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_clean_branch_remote_migration_history_has_untracked_versions')
console.log('Next milestone: SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-HISTORY-RECONCILIATION-1')
