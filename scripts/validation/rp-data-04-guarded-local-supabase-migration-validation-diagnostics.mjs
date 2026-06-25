#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-DATA-04-GUARDED-LOCAL-SUPABASE-MIGRATION-VALIDATION'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/internal-beta/rp-data-04-guarded-local-supabase-migration-validation'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/compatibility-repairs.md`,
  `${packetDir}/local-validation-evidence.md`,
  `${packetDir}/rls-grants-storage-evidence.md`,
  `${packetDir}/readiness-gate.md`,
  `${packetDir}/validation-record.json`,
  'docs/activation-phase-rp-data-04-guarded-local-supabase-migration-validation-results.md',
  'docs/implementation-prompts/prompt-rp-backend-01-internal-beta-service-role-api-contracts.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'supabase/.gitignore',
  'supabase/config.toml',
  'supabase/README.md',
  'supabase/migration-order.md',
  'scripts/validation/rp-data-04-guarded-local-supabase-migration-validation-diagnostics.mjs',
]

const allowedMigrationFiles = [
  'supabase/migrations/202605130007_generation_providers_generated_assets.sql',
  'supabase/migrations/202605180001_reeditpro_core_workspace_projects.sql',
  'supabase/migrations/202605180002_reeditpro_media_source_sequence.sql',
  'supabase/migrations/202605180003_reeditpro_intent_plan_versions.sql',
  'supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql',
  'supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql',
  'supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql',
  'supabase/migrations/202605180007_reeditpro_rls_policies.sql',
  'supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql',
  'supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql',
  'supabase/migrations/20260625031135_rp_data_03_internal_beta_static_gap_contract.sql',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...allowedMigrationFiles,
  'scripts/validation/rp-data-01-supabase-schema-migration-readiness-diagnostics.mjs',
  'scripts/validation/rp-data-02-supabase-migration-safety-packet-diagnostics.mjs',
  'scripts/validation/rp-data-03-supabase-migration-draft-static-implementation-diagnostics.mjs',
  'package.json',
])

const requiredText = [
  packet,
  'completed_guarded_local_supabase_migration_validation',
  'completed_local_only_supabase_db_reset_no_remote_execution',
  '`RP-DATA-03-SUPABASE-MIGRATION-DRAFT-STATIC-IMPLEMENTATION` is merged at `d3760aea62c81ca6ebcc3f8b8367fefa9506e7b3`',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Internal beta data foundation status: `local_migration_validation_passed`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Supabase update required: `future_backend_api_and_rls_test_required`',
  'Supabase update status: `local_validation_passed_not_remote`',
  'Supabase environment touched: `local_supabase_db_only`',
  'SQL executed: `local_only_supabase_db_reset_no_seed`',
  'Migration reset: `passed`',
  'Remote migration deployed: `no`',
  'Storage buckets created: `local_only_private_buckets`',
  '`authenticated` has only `SELECT` on the two artifact tables.',
  'Next Supabase action: `RP-BACKEND-01-INTERNAL-BETA-SERVICE-ROLE-API-CONTRACTS`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'No remote Supabase mutation, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, remote storage bucket creation, remote storage object access, remote RLS policy deployment, remote migration deployment, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled. SQL execution was limited to local-only Supabase DB reset validation on isolated RP-DATA-04 ports.',
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Remote migration deployed:(?!\s*`?no`?)/i,
  /remote Supabase mutation:\s*`?(true|enabled|executed|passed)/i,
  /remote storage object access:\s*`?(true|enabled|executed|passed)/i,
  /remote RLS policy deployment:\s*`?(true|enabled|executed|deployed|passed)/i,
  /worker execution:\s*`?(true|enabled|executed|passed)/i,
  /route execution:\s*`?(true|enabled|executed|passed)/i,
  /provider call:\s*`?(true|enabled|executed|passed)/i,
  /model call:\s*`?(true|enabled|executed|passed)/i,
  /public artifact(?:s)?\s*:\s*`?(created|enabled|true|passed)/i,
  /signed URL(?:s)?\s*:\s*`?(created|enabled|true|passed)/i,
  /package-lock:\s*`?changed/i,
  /dependency mutation:\s*`?(completed|enabled|true|passed)/i,
  /package installation:\s*`?(completed|enabled|true|passed)/i,
]

const forbiddenExactFiles = new Set([
  'package-lock.json',
  '.dockerignore',
])

const forbiddenPrefixes = [
  'src/',
  'server/',
  'database/',
  'docker/',
  'public/',
  'tests/',
]

function fail(message) {
  console.error(`${packet} diagnostics failed: ${message}`)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function gitLines(args) {
  return execFileSync('git', args, { env: gitEnv, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
}

function gitQuiet(args, label) {
  try {
    execFileSync('git', args, { env: gitEnv, stdio: 'pipe' })
  } catch {
    fail(label)
  }
}

const docsCorpus = requiredFiles
  .filter((file) => !file.startsWith('scripts/validation/') && !file.startsWith('supabase/'))
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(docsCorpus)) fail(`forbidden claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/validation-record.json`))
if (record.decision !== 'completed_guarded_local_supabase_migration_validation') fail('record decision mismatch')
if (record.execution !== 'completed_local_only_supabase_db_reset_no_remote_execution') fail('record execution mismatch')
if (record.internalBetaDataFoundationStatus !== 'local_migration_validation_passed') fail('data foundation status mismatch')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must stay not_ready')
if (record.supabaseEnvironmentTouched !== 'local_supabase_db_only') fail('Supabase environment must be local only')
if (record.sqlExecuted !== 'local_only_supabase_db_reset_no_seed') fail('SQL execution must be local-only reset')
if (record.remoteMigrationDeployed !== 'no') fail('remote migration must remain no')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')
if (!['pending_validation', 'full_validation_passed'].includes(record.validationStatus)) {
  fail('validation status must be pending_validation or full_validation_passed')
}

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/rp-data-04-guarded-local-supabase-migration-validation-diagnostics.mjs'
if (packageJson.scripts?.['rp-data-04:guarded-local-supabase-migration-validation:diagnostics'] !== expectedScript) {
  fail('missing package diagnostics script')
}

const config = read('supabase/config.toml')
for (const text of [
  'project_id = "reeditpro-rp-data-04-local-validation"',
  'port = 55431',
  'auto_expose_new_tables = false',
  'port = 55432',
  'shadow_port = 55430',
  'port = 55439',
  'port = 55433',
  'port = 55434',
]) {
  if (!config.includes(text)) fail(`missing Supabase config text: ${text}`)
}

const rpData03Migration = read('supabase/migrations/20260625031135_rp_data_03_internal_beta_static_gap_contract.sql')
for (const text of [
  'revoke all on table',
  'from authenticated;',
  'grant select on table',
  'to authenticated;',
  'grant select, insert, update, delete on table',
  'to service_role;',
]) {
  if (!rpData03Migration.includes(text)) fail(`missing RP-DATA-03 grant text: ${text}`)
}

for (const file of [
  'supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql',
  'supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql',
]) {
  if (/comment\s+on\s+policy|comment\s+on\s+table\s+storage\./i.test(read(file))) {
    fail(`storage-owned COMMENT ON remains in ${file}`)
  }
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
for (const file of [
  '.dockerignore',
  'database/migration-drafts',
  'database/test-sql',
]) {
  gitQuiet(['diff', '--quiet', '--', file], `${file} changed`)
}

const changedFiles = [...new Set([
  ...gitLines(['diff', '--name-only', 'HEAD']),
  ...gitLines(['ls-files', '--others', '--exclude-standard']),
])]
const stagedFiles = gitLines(['diff', '--cached', '--name-only'])

for (const file of [...changedFiles, ...stagedFiles]) {
  if (!allowedChangedFiles.has(file)) fail(`unexpected changed file ${file}`)
  const isAllowedSupabaseFile = file.startsWith('supabase/') && (
    file === 'supabase/.gitignore' ||
    file === 'supabase/config.toml' ||
    file === 'supabase/README.md' ||
    file === 'supabase/migration-order.md' ||
    allowedMigrationFiles.includes(file)
  )
  if (
    forbiddenExactFiles.has(file) ||
    forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) ||
    (!isAllowedSupabaseFile && file.startsWith('supabase/')) ||
    (!allowedMigrationFiles.includes(file) && file.endsWith('.sql')) ||
    file.endsWith('.mp4') ||
    file.endsWith('.mov') ||
    file.endsWith('.mkv') ||
    file.endsWith('.webm') ||
    file.endsWith('.srt') ||
    file.endsWith('.zip') ||
    file.endsWith('.tar') ||
    file.endsWith('.tgz')
  ) {
    fail(`forbidden changed path ${file}`)
  }
}

for (const file of changedFiles) {
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue
  if (file.startsWith('scripts/validation/') || allowedMigrationFiles.includes(file)) continue
  const text = read(file)
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden changed-file claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
