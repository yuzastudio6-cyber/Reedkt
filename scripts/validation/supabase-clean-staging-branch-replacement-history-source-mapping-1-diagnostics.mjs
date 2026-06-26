#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-HISTORY-SOURCE-MAPPING-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-history-source-mapping-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-history-source-mapping-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-replacement-history-source-mapping-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-isolated-target-owner-decision-1.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-unadopted-branch-cleanup-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-execution-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-execution-1-record.json',
  'docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports/clean_staging_branch_replacement_execution_report.json',
  'supabase/migrations/20260625031135_rp_data_03_internal_beta_static_gap_contract.sql',
  'supabase/README.md',
  'supabase/migration-order.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs',
  'package.json',
]

const packetFiles = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-history-source-mapping-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-history-source-mapping-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-replacement-history-source-mapping-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-isolated-target-owner-decision-1.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-unadopted-branch-cleanup-1.md',
]

const allowedChangedFiles = new Set([
  ...packetFiles,
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  'blocked_replacement_remote_only_migration_20260626163138_unmapped',
  'completed_docs_only_replacement_history_source_mapping_no_remote_execution',
  'Remote Supabase command class: `none_in_this_phase`',
  'Secret Manager payload access: `false`',
  'SQL execution: `none`',
  'SQL mutation: `none`',
  'Migration dry-run: `not_run`',
  'Migration deployed: `no`',
  'Migration history manual edit: `no`',
  'Supabase db pull: `false`',
  'Branch cleanup/delete: `not_run`',
  'DB URL secret rotation: `not_run`',
  'Internal beta unlocked: `false`',
  'External beta unlocked: `false`',
  'Production unlocked: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  '20260626163138',
  '20260625031135',
  'committed local source',
  'local-only',
  'not run in staging or production',
  'rjenorvzqsxwljvvvtxd',
  'SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-OWNER-DECISION-1',
  'SUPABASE-CLEAN-STAGING-UNADOPTED-BRANCH-CLEANUP-1',
  'PR #577',
]

const forbiddenPatterns = [
  /remoteSupabaseCommand"?\s*:\s*true/i,
  /remoteSupabaseMutation"?\s*:\s*true/i,
  /secretManagerPayloadAccess"?\s*:\s*true/i,
  /sqlExecution"?\s*:\s*true/i,
  /sqlMutation"?\s*:\s*true/i,
  /migrationDryRun"?\s*:\s*true/i,
  /migrationApply"?\s*:\s*true/i,
  /migrationHistoryManualEdit"?\s*:\s*true/i,
  /supabaseDbPull"?\s*:\s*true/i,
  /branchDelete"?\s*:\s*true/i,
  /branchReset"?\s*:\s*true/i,
  /dbUrlSecretRotation"?\s*:\s*true/i,
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

const corpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/') && file !== 'package.json')
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!corpus.includes(text)) fail(`missing required text: ${text}`)
}

const packetCorpus = packetFiles.map((file) => read(file)).join('\n')
for (const pattern of forbiddenPatterns) {
  if (pattern.test(packetCorpus)) fail(`forbidden claim matched: ${pattern}`)
}

const record = JSON.parse(read('docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-history-source-mapping-1-record.json'))
if (record.decision !== 'blocked_replacement_remote_only_migration_20260626163138_unmapped') fail('record decision mismatch')
if (record.execution !== 'completed_docs_only_replacement_history_source_mapping_no_remote_execution') fail('record execution mismatch')
if (record.remoteOnlyMigration?.version !== '20260626163138') fail('remote-only version mismatch')
if (record.remoteOnlyMigration?.sourceMapping !== 'unmapped') fail('source mapping must stay unmapped')
if (record.remoteOnlyMigration?.candidateLocalMigration !== '20260625031135') fail('candidate local migration mismatch')
if (record.remoteOnlyMigration?.candidateLocalMigrationStatus !== 'committed_local_only_not_staging_or_production') fail('candidate local migration status mismatch')
if (record.replacementBranch?.ref !== 'rjenorvzqsxwljvvvtxd') fail('replacement branch ref mismatch')
if (record.replacementBranch?.adoptedAsCleanStagingTarget !== false) fail('replacement branch must not be adopted')
if (record.replacementBranch?.cleanupRun !== false) fail('cleanup must not run')
if (record.safety?.remoteSupabaseCommand !== false) fail('remote Supabase command must be false')
if (record.safety?.remoteSupabaseMutation !== false) fail('remote Supabase mutation must be false')
if (record.safety?.secretManagerPayloadAccess !== false) fail('secret payload access must be false')
if (record.safety?.sqlExecution !== false) fail('SQL execution must be false')
if (record.safety?.sqlMutation !== false) fail('SQL mutation must be false')
if (record.safety?.migrationDryRun !== false) fail('migration dry-run must be false')
if (record.safety?.migrationApply !== false) fail('migration apply must be false')
if (record.safety?.supabaseDbPull !== false) fail('Supabase db pull must be false')
if (record.safety?.branchDelete !== false) fail('branch delete must be false')
if (record.safety?.branchReset !== false) fail('branch reset must be false')
if (record.safety?.dbUrlSecretRotation !== false) fail('DB URL secret rotation must be false')
if (record.safety?.internalBetaUnlock !== false) fail('internal beta unlock must be false')
if (record.safety?.externalBetaUnlock !== false) fail('external beta unlock must be false')
if (record.safety?.productionUnlock !== false) fail('production unlock must be false')
if (!record.nextMilestones?.includes('SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-OWNER-DECISION-1')) fail('isolated target next milestone missing')
if (!record.nextMilestones?.includes('SUPABASE-CLEAN-STAGING-UNADOPTED-BRANCH-CLEANUP-1')) fail('cleanup next milestone missing')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')

const replacementReport = JSON.parse(read('docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports/clean_staging_branch_replacement_execution_report.json'))
if (!replacementReport.remoteOnlyMigrationIds?.includes('20260626163138')) fail('replacement report remote-only migration missing')
if (replacementReport.secretRotation !== 'not_run') fail('replacement report must show no secret rotation')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['supabase-clean-staging-branch-replacement-history-source-mapping-1:diagnostics'] !==
  'node scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs'
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
    .replaceAll('supabase migration list --db-url [REDACTED_REPLACEMENT_BRANCH_DB_URL]', '')
  for (const [pattern, message] of secretPatterns) {
    if (pattern.test(text)) fail(`${message} in ${file}`)
  }
}

console.log(`${packet} diagnostics passed`)
console.log('Decision: blocked_replacement_remote_only_migration_20260626163138_unmapped')
console.log('Next milestones: SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-OWNER-DECISION-1, SUPABASE-CLEAN-STAGING-UNADOPTED-BRANCH-CLEANUP-1')
