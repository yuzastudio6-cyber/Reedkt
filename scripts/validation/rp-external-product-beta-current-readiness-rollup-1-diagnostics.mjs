#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  'docs/external-beta/current-readiness-rollup-1/readiness-gate.md',
  'docs/external-beta/current-readiness-rollup-1/source-of-truth-audit.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/external-beta/current-readiness-rollup-1/rollup-record.json',
  'docs/activation-phase-rp-external-product-beta-current-readiness-rollup-1-results.md',
  'docs/implementation-prompts/prompt-rp-external-product-beta-current-readiness-rollup-1-next.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const relatedDiagnosticsAllowlist = [
  'scripts/validation/rp-internal-beta-supabase-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-staging-migration-history-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-target-owner-approval-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-guarded-validation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-migration-chain-apply-1-diagnostics.mjs',
]

const followOnSupabaseCleanStagingTargetOwnerApproval1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-target-owner-approval-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-target-owner-approval-1-record.json',
  'docs/activation-phase-supabase-clean-staging-target-owner-approval-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-execution-current-target-revalidation-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
]

const followOnSupabaseCleanStagingBranchCurrentTargetRevalidation1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-revalidation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-revalidation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-current-target-revalidation-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-db-url-secret-handoff-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-db-url-secret-handoff-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-db-url-secret-handoff-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-db-url-secret-handoff-1-results.md',
  'docs/activation-supabase-clean-staging-branch-db-url-secret-handoff-1-reports/clean_staging_branch_db_url_secret_handoff_report.json',
  'docs/activation-supabase-clean-staging-branch-db-url-secret-handoff-1-reports/clean_staging_branch_db_url_secret_handoff_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-current-target-guarded-validation-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-target-owner-approval-1-diagnostics.mjs',
  'scripts/validation/supabase-staging-migration-history-owner-decision-1-diagnostics.mjs',
]

const followOnSupabaseCleanStagingBranchCurrentTargetGuardedValidation1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-guarded-validation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-guarded-validation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-current-target-guarded-validation-1-results.md',
  'docs/activation-supabase-clean-staging-branch-current-target-guarded-validation-1-reports/clean_staging_branch_current_target_guarded_validation_report.json',
  'docs/activation-supabase-clean-staging-branch-current-target-guarded-validation-1-reports/clean_staging_branch_current_target_guarded_validation_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-migration-chain-apply-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-current-target-guarded-validation-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-guarded-validation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-target-owner-approval-1-diagnostics.mjs',
  'scripts/validation/supabase-staging-migration-history-owner-decision-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingBranchMigrationChainApply1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-chain-apply-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-chain-apply-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-migration-chain-apply-1-results.md',
  'docs/activation-supabase-clean-staging-branch-migration-chain-apply-1-reports/clean_staging_branch_migration_chain_apply_report.json',
  'docs/activation-supabase-clean-staging-branch-migration-chain-apply-1-reports/clean_staging_branch_migration_chain_apply_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-migration-history-reconciliation-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-migration-chain-apply-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-guarded-validation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingBranchMigrationHistoryReconciliation1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-migration-history-reconciliation-1-results.md',
  'docs/activation-supabase-clean-staging-branch-migration-history-reconciliation-1-reports/clean_staging_branch_migration_history_reconciliation_report.json',
  'docs/activation-supabase-clean-staging-branch-migration-history-reconciliation-1-reports/clean_staging_branch_migration_history_reconciliation_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-guarded-validation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-db-url-secret-handoff-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-target-owner-approval-1-diagnostics.mjs',
  'scripts/validation/supabase-staging-migration-history-owner-decision-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingBranchMigrationHistorySourceDerivedOwnerDecision1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-replacement-execution-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingBranchReplacementExecution1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-execution-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-execution-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-replacement-execution-1-results.md',
  'docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports/clean_staging_branch_replacement_execution_report.json',
  'docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports/clean_staging_branch_replacement_execution_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-replacement-execution-1.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-replacement-history-source-mapping-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingBranchReplacementHistorySourceMapping1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-history-source-mapping-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-history-source-mapping-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-replacement-history-source-mapping-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-isolated-target-owner-decision-1.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-unadopted-branch-cleanup-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingIsolatedTargetOwnerDecision1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-owner-decision-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-owner-decision-1-record.json',
  'docs/activation-phase-supabase-clean-staging-isolated-target-owner-decision-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-isolated-target-creation-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-isolated-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingIsolatedTargetCreation1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-creation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-creation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-isolated-target-creation-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-isolated-target-migration-chain-apply-1.md',
  'docs/activation-supabase-clean-staging-isolated-target-creation-1-reports/clean_staging_isolated_target_creation_report.json',
  'docs/activation-supabase-clean-staging-isolated-target-creation-1-reports/clean_staging_isolated_target_creation_manifest.json',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const followOnSupabaseCleanStagingIsolatedTargetMigrationChainApply1Files = [
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-migration-chain-apply-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-isolated-target-migration-chain-apply-1-record.json',
  'docs/activation-phase-supabase-clean-staging-isolated-target-migration-chain-apply-1-results.md',
  'docs/activation-supabase-clean-staging-isolated-target-migration-chain-apply-1-reports/clean_staging_isolated_target_migration_chain_apply_report.json',
  'docs/activation-supabase-clean-staging-isolated-target-migration-chain-apply-1-reports/clean_staging_isolated_target_migration_chain_apply_manifest.json',
  'docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-isolated-target-readback-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-isolated-target-migration-chain-apply-1.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-migration-chain-apply-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-creation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-isolated-target-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'blocked_external_product_beta_pending_explicit_staging_migration_path_approval_and_runtime_gate_closure',
  'completed_docs_only_current_beta_readiness_rollup_no_runtime_execution',
  '4648c70b0f47ec34f1c4668cb42f69cd55053b50',
  'blocked_no_owner_approval_for_staging_migration_apply_or_clean_target',
  'completed_guarded_supabase_target_rls_storage_readonly_validation',
  'SUPABASE_ACCESS_TOKEN` version `5`',
  'Secret Manager payload access',
  'External product beta status: `blocked`',
  'Internal beta status: `blocked_pending_explicit_staging_migration_path_approval`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'APPROVE CLEAN STAGING TARGET',
  'APPROVE FULL REVIEWED STAGING MIGRATION SET APPLY',
  'OWNER ACTION REQUIRED - approve full reviewed staging migration set or clean staging target before RPC 4R SQL execution',
  'PR #577 remains open/draft/blocked and excluded',
  'No Supabase mutation, SQL mutation, migration apply, migration history table edit, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, credential payload printing, credential payload persistence, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Docker execution, Remotion execution, FFmpeg/FFprobe execution, or broad service-role handler was enabled.',
]

const forbiddenPatterns = [
  /external product beta status:\s*`?(ready|unlocked|approved)`?/i,
  /externalBetaUnlock"?\s*:\s*true/i,
  /internalBetaUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlMutation"?\s*:\s*true/i,
  /migrationApply"?\s*:\s*true/i,
  /secretPayloadAccess"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /providerModelCall"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /package-lock mutation:\s*`?true`?/i,
]

const blockedPaths = [
  'package-lock.json',
  'supabase/migrations',
  'supabase/functions',
  'server',
  'src',
  'docker',
  'database',
  '.github/workflows',
  '.dockerignore',
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

const corpus = requiredFiles.map((file) => read(file)).join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenPatterns) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read('docs/external-beta/current-readiness-rollup-1/rollup-record.json'))
if (record.decision !== 'blocked_external_product_beta_pending_explicit_staging_migration_path_approval_and_runtime_gate_closure') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_current_beta_readiness_rollup_no_runtime_execution') fail('record execution mismatch')
if (record.integrationHead !== '4648c70b0f47ec34f1c4668cb42f69cd55053b50') fail('integration head mismatch')
if (record.statuses?.externalProductBeta !== 'blocked') fail('external beta status mismatch')
if (record.statuses?.internalBeta !== 'blocked_pending_explicit_staging_migration_path_approval') fail('internal beta status mismatch')
if (record.statuses?.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.credentialMetadata?.secretPayloadAccess !== false) fail('secret payload access must be false')
if (record.safety?.supabaseMutation !== false) fail('Supabase mutation must be false')
if (record.safety?.sqlMutation !== false) fail('SQL mutation must be false')
if (record.safety?.migrationApply !== false) fail('migration apply must be false')
if (record.packageLock !== 'unchanged') fail('package-lock status mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts status mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['rp-external-product-beta-current-readiness-rollup-1:diagnostics'] !==
  'node scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const allowed = new Set([
  ...requiredFiles,
  ...relatedDiagnosticsAllowlist,
  ...followOnSupabaseCleanStagingTargetOwnerApproval1Files,
  ...followOnSupabaseCleanStagingBranchCurrentTargetRevalidation1Files,
  ...followOnSupabaseCleanStagingBranchCurrentTargetGuardedValidation1Files,
  ...followOnSupabaseCleanStagingBranchMigrationChainApply1Files,
  ...followOnSupabaseCleanStagingBranchMigrationHistoryReconciliation1Files,
  ...followOnSupabaseCleanStagingBranchMigrationHistorySourceDerivedOwnerDecision1Files,
  ...followOnSupabaseCleanStagingBranchReplacementExecution1Files,
  ...followOnSupabaseCleanStagingBranchReplacementHistorySourceMapping1Files,
  ...followOnSupabaseCleanStagingIsolatedTargetOwnerDecision1Files,
  ...followOnSupabaseCleanStagingIsolatedTargetCreation1Files,
  ...followOnSupabaseCleanStagingIsolatedTargetMigrationChainApply1Files,
])
for (const file of changedFiles()) {
  if (!allowed.has(file)) fail(`unexpected changed file: ${file}`)
  for (const blockedPath of blockedPaths) {
    if (file === blockedPath || file.startsWith(`${blockedPath}/`)) fail(`blocked path changed: ${file}`)
  }
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_external_product_beta_pending_explicit_staging_migration_path_approval_and_runtime_gate_closure')
console.log('External product beta: blocked')
console.log('SQL mutation: none')
