#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-EXECUTION-1'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const requiredFiles = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-execution-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-execution-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-replacement-execution-1-results.md',
  'docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports/clean_staging_branch_replacement_execution_report.json',
  'docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports/clean_staging_branch_replacement_execution_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-replacement-execution-1.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-replacement-history-source-mapping-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-record.json',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-migration-history-reconciliation-1.md',
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/external-beta/current-readiness-rollup-1/blocker-matrix.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1.mjs',
  'scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs',
  'package.json',
]

const packetFiles = [
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-execution-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-execution-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-replacement-execution-1-results.md',
  'docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports/clean_staging_branch_replacement_execution_report.json',
  'docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports/clean_staging_branch_replacement_execution_manifest.json',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-replacement-execution-1.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-branch-replacement-history-source-mapping-1.md',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'scripts/validation/supabase-clean-staging-branch-migration-history-source-derived-owner-decision-1-diagnostics.mjs',
  'scripts/validation/supabase-clean-staging-branch-migration-history-reconciliation-1-diagnostics.mjs',
  'scripts/validation/rp-external-product-beta-current-readiness-rollup-1-diagnostics.mjs',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-history-source-mapping-1.md',
  'docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-history-source-mapping-1-record.json',
  'docs/activation-phase-supabase-clean-staging-branch-replacement-history-source-mapping-1-results.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-isolated-target-owner-decision-1.md',
  'docs/implementation-prompts/prompt-supabase-clean-staging-unadopted-branch-cleanup-1.md',
  'scripts/validation/supabase-clean-staging-branch-replacement-history-source-mapping-1-diagnostics.mjs',
])

const requiredText = [
  packet,
  'blocked_replacement_branch_migration_history_not_source_aligned',
  'blocked_before_clean_branch_db_url_secret_rotation',
  'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_REPLACEMENT_EXECUTION=true',
  'reeditpro-clean-staging-v2',
  'rjenorvzqsxwljvvvtxd',
  '20260626163138',
  'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL',
  'not_updated_in_this_phase',
  'Remote Supabase mutation: `branch_create_only`',
  'SQL execution: `read_only_migration_history_inspection`',
  'SQL mutation: `none`',
  'Migration dry-run: `not_run`',
  'Migration deployed: `no`',
  'Migration history manual edit: `no`',
  'Supabase db pull: `false`',
  'Branch delete/reset: `false`',
  'Internal beta unlocked: `false`',
  'External beta unlocked: `false`',
  'Production unlocked: `false`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-HISTORY-SOURCE-MAPPING-1',
  'PR #577',
]

const forbiddenPatterns = [
  /cleanBranchDbUrlSecretVersionAdd"?\s*:\s*true/i,
  /secretVersionAdded"?\s*:\s*true/i,
  /sqlMutation"?\s*:\s*true/i,
  /migrationApply"?\s*:\s*true/i,
  /migrationDryRun"?\s*:\s*true/i,
  /migrationHistoryManualEdit"?\s*:\s*true/i,
  /supabaseDbPull"?\s*:\s*true/i,
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

const record = JSON.parse(read('docs/supabase-worker-runtime/supabase-clean-staging-branch-replacement-execution-1-record.json'))
if (record.decision !== 'blocked_replacement_branch_migration_history_not_source_aligned') fail('record decision mismatch')
if (record.execution !== 'blocked_before_clean_branch_db_url_secret_rotation') fail('record execution mismatch')
if (record.blocker !== 'blocked_replacement_branch_migration_history_not_source_aligned') fail('record blocker mismatch')
if (record.parentProjectRef !== 'wmyyttnynmteqgcdishd') fail('parent project ref mismatch')
if (record.previousCleanBranch?.ref !== 'fnjiylwirntrqdcwpbho') fail('previous clean branch ref mismatch')
if (record.replacementBranch?.ref !== 'rjenorvzqsxwljvvvtxd') fail('replacement branch ref mismatch')
if (record.replacementBranch?.action !== 'created') fail('replacement branch action mismatch')
if (record.replacementBranch?.adoptedAsCleanStagingTarget !== false) fail('replacement branch must not be adopted')
if (!record.migrationHistoryEvidence?.remoteOnlyMigrationIds?.includes('20260626163138')) fail('remote-only migration evidence missing')
if (record.migrationHistoryEvidence?.sourceAlignedForMigrationChainApply !== false) fail('source-alignment must be false')
if (record.secretRotation?.secretVersionAdded !== false) fail('secret rotation must not add a version')
if (record.safety?.secretManagerPayloadAccess !== true) fail('guarded secret payload access must be true')
if (record.safety?.credentialPayloadPrinted !== false) fail('credential payload printed must be false')
if (record.safety?.credentialPayloadPersistedInRepo !== false) fail('credential payload persisted must be false')
if (record.safety?.supabaseManagementApiRead !== true) fail('management API read must be true')
if (record.safety?.supabaseCliBranchCreate !== true) fail('branch create must be recorded')
if (record.safety?.remoteSupabaseMutation !== 'branch_create_only') fail('remote mutation scope must be branch_create_only')
if (record.safety?.sqlExecution !== 'read_only_migration_history_inspection') fail('SQL execution must be read-only history inspection')
if (record.safety?.sqlMutation !== false) fail('SQL mutation must be false')
if (record.safety?.migrationApply !== false) fail('migration apply must be false')
if (record.safety?.migrationDryRun !== false) fail('migration dry-run must be false')
if (record.safety?.supabaseDbPull !== false) fail('Supabase db pull must be false')
if (record.safety?.branchDelete !== false) fail('branch delete must be false')
if (record.safety?.branchReset !== false) fail('branch reset must be false')
if (record.safety?.cleanBranchDbUrlSecretVersionAdd !== false) fail('secret version add must be false')
if (record.safety?.internalBetaUnlock !== false) fail('internal beta unlock must be false')
if (record.safety?.externalBetaUnlock !== false) fail('external beta unlock must be false')
if (record.safety?.productionUnlock !== false) fail('production unlock must be false')
if (record.nextMilestone !== 'SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-HISTORY-SOURCE-MAPPING-1') fail('next milestone mismatch')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready count changed')
if (record.packageLock !== 'unchanged') fail('package-lock mismatch')
if (record.generatedArtifactsCommitted !== 'none') fail('generated artifacts mismatch')

const report = JSON.parse(read('docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports/clean_staging_branch_replacement_execution_report.json'))
if (report.decision !== record.decision) fail('report decision mismatch')
if (report.runId !== record.runEvidence?.runId) fail('report run ID mismatch')
if (report.selectedBranch?.ref !== record.replacementBranch?.ref) fail('report branch ref mismatch')
if (!report.migrationHistoryRead?.parsed?.remoteOnlyMigrationIds?.includes('20260626163138')) fail('report remote-only migration missing')
if (report.secretRotation !== 'not_run') fail('report secret rotation must be not_run')
if (report.safety?.cleanBranchDbUrlSecretVersionAdd !== false) fail('report secret version add must be false')
if (report.safety?.sqlMutation !== false) fail('report SQL mutation must be false')
if (report.safety?.migrationApply !== false) fail('report migration apply must be false')
if (report.safety?.migrationDryRun !== false) fail('report migration dry-run must be false')
if (report.safety?.branchDelete !== false) fail('report branch delete must be false')
if (report.safety?.credentialPayloadPrinted !== false) fail('report credential payload printed must be false')
if (report.safety?.credentialPayloadPersistedInRepo !== false) fail('report credential payload persisted must be false')

const manifest = JSON.parse(read('docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports/clean_staging_branch_replacement_execution_manifest.json'))
if (!manifest.artifacts?.some((artifact) => artifact.sha256 === record.runEvidence?.reportSha256)) fail('report checksum missing from manifest')
if (!manifest.artifacts?.some((artifact) => artifact.sha256 === record.runEvidence?.manifestSha256)) fail('manifest checksum missing from manifest')

const packageJson = JSON.parse(read('package.json'))
if (
  packageJson.scripts?.['supabase-clean-staging-branch-replacement-execution-1'] !==
  'node scripts/validation/supabase-clean-staging-branch-replacement-execution-1.mjs'
) {
  fail('missing runner package script')
}
if (
  packageJson.scripts?.['supabase-clean-staging-branch-replacement-execution-1:diagnostics'] !==
  'node scripts/validation/supabase-clean-staging-branch-replacement-execution-1-diagnostics.mjs'
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
console.log('Decision: blocked_replacement_branch_migration_history_not_source_aligned')
console.log('Next milestone: SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-HISTORY-SOURCE-MAPPING-1')
