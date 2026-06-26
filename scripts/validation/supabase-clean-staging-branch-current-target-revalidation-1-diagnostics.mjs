#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'SUPABASE-CLEAN-STAGING-BRANCH-EXECUTION-CURRENT-TARGET-REVALIDATION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-revalidation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-revalidation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-current-target-revalidation-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-db-url-secret-handoff-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-target-owner-approval-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-target-owner-approval-1-record.json',
  'docs/activation-supabase-clean-staging-branch-execution-reports/clean_staging_branch_migration_history_verify_report.json',
  'docs/activation-supabase-clean-staging-branch-execution-reports/clean_staging_branch_schema_rls_verify_report.json',
  'docs/activation-supabase-clean-staging-branch-execution-reports/clean_staging_target_reference.json',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-target-owner-approval-1-diagnostics.mjs',
  'scripts/validation/supabase-staging-migration-history-owner-decision-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
]

const requiredText = [
  packet,
  'blocked_clean_staging_branch_current_target_revalidation_missing_clean_branch_db_url_secret',
  'completed_docs_only_current_target_revalidation_no_remote_execution',
  'approved_clean_staging_target_path_for_guarded_migration_chain_validation',
  'existing_clean_staging_branch_plugin_evidence_present',
  'not_run_missing_clean_branch_db_url_secret',
  'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL` / `missing',
  'SUPABASE_ACCESS_TOKEN` version `5` / `enabled',
  'Secret Manager payload access: `false`',
  'Remote Supabase command class: `none_in_this_phase`',
  'SQL execution: `none`',
  'SQL mutation: `none`',
  'Migration deployed: `no`',
  'Migration history table edited: `no`',
  'Storage readback: `none`',
  'Service-role route execution: `false`',
  'Production touched: `false`',
  'Internal beta unlocked: `false`',
  'External beta unlocked: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'wmyyttnynmteqgcdishd',
  'fnjiylwirntrqdcwpbho',
  'SUPABASE-CLEAN-STAGING-BRANCH-DB-URL-SECRET-HANDOFF-1',
  'PR #577 remains open/draft/blocked and excluded',
  'No Supabase mutation, remote Supabase command, SQL execution, SQL mutation, migration apply, migration history table edit, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, credential payload printing, credential payload persistence, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, final render/export, preview artifact creation, private media processing, user media processing, Docker execution, Remotion execution, FFmpeg/FFprobe execution, or broad service-role handler was enabled.',
]

const forbidden = [
  /remoteSupabaseCommand"?\s*:\s*true/i,
  /supabaseMutation"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /sqlMutation"?\s*:\s*true/i,
  /migrationApply"?\s*:\s*true/i,
  /migrationHistoryTableEdited"?\s*:\s*true/i,
  /storageBucketCreation"?\s*:\s*true/i,
  /storageObjectCreation"?\s*:\s*true/i,
  /storageObjectRead"?\s*:\s*true/i,
  /secretPayloadAccess"?\s*:\s*true/i,
  /serviceRoleRouteExecution"?\s*:\s*true/i,
  /workerExecution"?\s*:\s*true/i,
  /internalBetaUnlock"?\s*:\s*true/i,
  /externalBetaUnlock"?\s*:\s*true/i,
  /productionUnlock"?\s*:\s*true/i,
  /Remote Supabase command class:\s*`(?!(none_in_this_phase|readonly_migration_history_and_db_push_dry_run)`)/i,
  /SQL execution:\s*`(?!(none|false)`)/i,
  /SQL mutation:\s*`(?!(none|false)`)/i,
  /Migration deployed:\s*`(?!(no|false|local_only)`)/i,
  /Storage readback:\s*`(?!none`)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
]

const allowedChangedFiles = new Set([
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-revalidation-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-revalidation-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-current-target-revalidation-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-db-url-secret-handoff-1.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-target-owner-approval-1-diagnostics.mjs',
  'scripts/validation/supabase-staging-migration-history-owner-decision-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
])

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

for (const file of requiredFiles) read(file)

const corpus = requiredFiles.map((file) => read(file)).join('\n')
for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}
for (const pattern of forbidden) {
  if (pattern.test(corpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read('docs/supabase-worker-runtime/supabase-clean-staging-branch-current-target-revalidation-1-record.json'))
if (record.decision !== 'blocked_clean_staging_branch_current_target_revalidation_missing_clean_branch_db_url_secret') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_current_target_revalidation_no_remote_execution') fail('record execution mismatch')
if (record.credentialMetadata?.supabaseAccessTokenLatestVersion !== '5') fail('access-token version mismatch')
if (record.credentialMetadata?.supabaseAccessTokenLatestVersionState !== 'enabled') fail('access-token version state mismatch')
if (record.credentialMetadata?.cleanBranchDbUrlSecretPresence !== 'missing') fail('clean DB URL secret must remain missing in this packet')
if (record.credentialMetadata?.secretManagerPayloadAccess !== false) fail('Secret Manager payload access must be false')
if (record.currentRevalidation?.remoteSupabaseCommandClass !== 'none_in_this_phase') fail('remote command class mismatch')
if (record.safety?.remoteSupabaseCommand !== false) fail('remote Supabase command must be false')
if (record.safety?.supabaseMutation !== false) fail('Supabase mutation must be false')
if (record.safety?.sqlExecution !== false) fail('SQL execution must be false')
if (record.safety?.migrationApply !== false) fail('migration apply must be false')
if (record.safety?.storageObjectRead !== false) fail('storage object read must be false')
if (record.safety?.internalBetaUnlock !== false) fail('internal beta unlock must be false')
if (record.safety?.externalBetaUnlock !== false) fail('external beta unlock must be false')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifact mismatch')

const migrationHistory = JSON.parse(read('docs/activation-supabase-clean-staging-branch-execution-reports/clean_staging_branch_migration_history_verify_report.json'))
if (migrationHistory.status !== 'passed') fail('existing migration history report not passed')
if (migrationHistory.mode !== 'supabase_plugin_list_migrations') fail('existing migration history report mode mismatch')
if (migrationHistory.targetProjectRef !== 'fnjiylwirntrqdcwpbho') fail('existing migration history target mismatch')

const schemaRls = JSON.parse(read('docs/activation-supabase-clean-staging-branch-execution-reports/clean_staging_branch_schema_rls_verify_report.json'))
if (schemaRls.status !== 'passed') fail('existing schema/RLS report not passed')
if (schemaRls.verificationMode !== 'supabase_plugin_readonly_catalog_queries') fail('existing schema/RLS verification mode mismatch')
if (schemaRls.branchProjectRef !== 'fnjiylwirntrqdcwpbho') fail('existing schema/RLS target mismatch')

const targetRef = JSON.parse(read('docs/activation-supabase-clean-staging-branch-execution-reports/clean_staging_target_reference.json'))
if (targetRef.branchRef !== 'fnjiylwirntrqdcwpbho') fail('clean target branch ref mismatch')
if (targetRef.secretValuesIncluded !== false) fail('clean target reference must not include secrets')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['supabase-clean-staging-branch-current-target-revalidation-1:diagnostics'] !==
  'node scripts/validation/supabase-clean-staging-branch-current-target-revalidation-1-diagnostics.mjs'
) {
  fail('missing package diagnostics script')
}

execFileSync('git', ['diff', '--quiet', '--', 'package-lock.json'], { env: gitEnv, stdio: 'pipe' })

const changed = [
  ...new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['diff', '--cached', '--name-only']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]),
]
for (const file of changed) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file: ${file}`)
  if (file === 'package-lock.json') fail('package-lock changed')
  if (file.endsWith('.sql')) fail(`SQL file changed: ${file}`)
  if (file.startsWith('supabase/migrations/') || file.startsWith('supabase/functions/')) fail(`Supabase source changed: ${file}`)
  if (file.startsWith('server/') || file.startsWith('src/') || file.startsWith('docker/') || file.startsWith('database/')) fail(`runtime/source path changed: ${file}`)
  if (file.includes('/._') || file.startsWith('._') || file.includes('.DS_Store')) fail(`metadata artifact changed: ${file}`)
  if (file.startsWith('.env') || file.includes('/.env')) fail(`env file changed: ${file}`)
  const text = read(file)
  if (/sbp_[A-Za-z0-9_./=-]+/.test(text)) fail(`Supabase access token leaked in ${file}`)
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(text)) fail(`Supabase URL leaked in ${file}`)
  const dbUrlRedacted = text.replaceAll('postgresql://[redacted]', '')
  if (/\bpostgres(?:ql)?:\/\/\S+/i.test(dbUrlRedacted)) fail(`DB URL leaked in ${file}`)
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_clean_staging_branch_current_target_revalidation_missing_clean_branch_db_url_secret')
console.log('Remote Supabase command class: none_in_this_phase')
console.log('SQL execution: none')
