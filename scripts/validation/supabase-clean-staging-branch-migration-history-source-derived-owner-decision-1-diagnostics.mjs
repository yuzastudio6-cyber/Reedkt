#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'SUPABASE-CLEAN-STAGING-BRANCH-MIGRATION-HISTORY-SOURCE-DERIVED-OWNER-DECISION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-replacement-execution-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1-record.json',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-diagnostics.mjs',
  'package.json',
]

const ownerDecisionEvidenceFiles = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-replacement-execution-1.md',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-execution-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-execution-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-replacement-execution-1-results.md',
  'docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports/clean_staging_branch_replacement_execution_report.json',
  'docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports/clean_staging_branch_replacement_execution_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-replacement-history-source-mapping-1.md',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  'approved_clean_staging_branch_replacement_path_for_source_aligned_migration_chain',
  'completed_docs_only_source_derived_owner_decision_no_remote_execution',
  'blocked_unmapped_remote_only_migration_20260626162800',
  'repo_and_live_readonly_lane_evidence_can_record_conservative_decision_without_waiting_for_separate_chat_owner_response',
  'future explicitly gated clean staging branch replacement/recreation path',
  'Remote Supabase command class: `none_in_this_phase`',
  'SQL execution: `none`',
  'SQL mutation: `none`',
  'Migration deployed: `no`',
  'Migration history manual edit: `no`',
  'Supabase db pull: `false`',
  'Branch reset or recreation: `false`',
  'Internal beta unlocked: `false`',
  'External beta unlocked: `false`',
  'Production unlocked: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '20260610235210',
  '20260626162800',
  '202606050001',
  'SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-EXECUTION-1',
  'PR #577',
]

const forbiddenPatterns = [
  /secretManagerPayloadAccess"?\s*:\s*true/i,
  /remoteSupabaseCommand"?\s*:\s*true/i,
  /remoteSupabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /sqlMutation"?\s*:\s*true/i,
  /migrationApply"?\s*:\s*true/i,
  /migrationHistoryManualEdit"?\s*:\s*true/i,
  /supabaseDbPull"?\s*:\s*true/i,
  /branchResetOrRecreate"?\s*:\s*true/i,
  /storageObjectCreation"?\s*:\s*true/i,
  /storageObjectRead"?\s*:\s*true/i,
  /serviceRoleRouteExecution"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /signedUrlCreation"?\s*:\s*true/i,
  /publicArtifactCreation"?\s*:\s*true/i,
  /internalBetaUnlock"?\s*:\s*true/i,
  /externalBetaUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /Remote Supabase command class:\s*`(?!(none_in_this_phase)`)/i,
  /SQL execution:\s*`(?!(none|false)`)/i,
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
const corpus = requiredFiles.filter((file) => !file.startsWith('scripts/validation/') && file !== 'package.json').map((file) => read(file)).join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
const ownerDecisionCorpus = ownerDecisionEvidenceFiles.map((file) => read(file)).join('\n')
for (const pattern of forbiddenPatterns) {
  if (pattern.test(ownerDecisionCorpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read('docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-record.json'))
if (record.decision !== 'approved_clean_staging_branch_replacement_path_for_source_aligned_migration_chain') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_source_derived_owner_decision_no_remote_execution') fail('record execution mismatch')
if (record.currentCleanBranch?.branchRef !== 'fnjiylwirntrqdcwpbho') fail('current clean branch ref mismatch')
if (record.ownerDecision?.currentBranchMigrationRepair !== 'not_approved') fail('current branch repair must be rejected')
if (record.ownerDecision?.currentBranchMigrationApply !== 'not_approved') fail('current branch apply must be rejected')
if (record.ownerDecision?.futureCleanBranchReplacementPath !== 'approved_for_later_explicitly_gated_execution_packet') fail('replacement path approval mismatch')
if (!record.migrationHistoryEvidence?.unmappedRemoteOnlyMigrationIds?.includes('20260626162800')) fail('unmapped migration evidence missing')
if (record.safety?.remoteSupabaseCommand !== false) fail('remote Supabase command must be false')
if (record.safety?.remoteSupabaseMutation !== false) fail('remote Supabase mutation must be false')
if (record.safety?.sqlExecution !== false) fail('SQL execution must be false')
if (record.safety?.sqlMutation !== false) fail('SQL mutation must be false')
if (record.safety?.migrationApply !== false) fail('migration apply must be false')
if (record.safety?.branchResetOrRecreate !== false) fail('branch reset/recreate must be false')
if (record.safety?.secretManagerPayloadAccess !== false) fail('secret payload access must be false')
if (record.nextMilestone !== 'SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-EXECUTION-1') fail('next milestone mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1:diagnostics'] !==
  'node scripts/validation/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-diagnostics.mjs'
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
  const text = read(file).replaceAll('postgresql://[redacted]', '')
  for (const [pattern, message] of secretPatterns) {
    if (pattern.test(text)) fail(`${message} in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: approved_clean_staging_branch_replacement_path_for_source_aligned_migration_chain')
console.log('Next milestone: SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-EXECUTION-1')
