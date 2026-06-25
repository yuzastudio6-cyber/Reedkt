#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-DATA-03-SUPABASE-MIGRATION-DRAFT-STATIC-IMPLEMENTATION'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/internal-beta/rp-data-03-supabase-migration-draft-static-implementation'
const migrationFile = 'supabase/migrations/20260625031135_rp_data_03_internal_beta_static_gap_contract.sql'

const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/migration-draft-review.md`,
  `${packetDir}/rls-grant-review.md`,
  `${packetDir}/storage-artifact-manifest-review.md`,
  `${packetDir}/execution-gate.md`,
  `${packetDir}/static-record.json`,
  'docs/activation-phase-rp-data-03-supabase-migration-draft-static-implementation-results.md',
  'docs/implementation-prompts/prompt-rp-data-04-guarded-local-supabase-migration-validation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'supabase/README.md',
  'supabase/migration-order.md',
  migrationFile,
  'scripts/validation/rp-data-01-supabase-schema-migration-readiness-diagnostics.mjs',
  'scripts/validation/rp-data-02-supabase-migration-safety-packet-diagnostics.mjs',
  'scripts/validation/rp-data-03-supabase-migration-draft-static-implementation-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'package.json',
])

const requiredText = [
  packet,
  'completed_static_migration_draft_ready_for_guarded_local_validation',
  'completed_static_migration_draft_no_sql_execution',
  '`RP-DATA-02-SUPABASE-MIGRATION-SAFETY-PACKET` is merged at `c8b34aeef407039a7ada6d59e5f2c72582940b8d`',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Internal beta data foundation status: `static_migration_draft_ready_not_applied`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Supabase update required: `future_guarded_validation_required`',
  'Supabase update status: `static_migration_draft_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration files created: `one_static_draft`',
  'Migration deployed: `no`',
  'Storage buckets created: `none`',
  'Migration draft status: `created_not_applied`',
  'RLS draft status: `created_not_applied`',
  'Grant draft status: `created_not_applied`',
  'Storage draft status: `metadata_manifest_only`',
  'Next Supabase action: `RP-DATA-04-GUARDED-LOCAL-SUPABASE-MIGRATION-VALIDATION`',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'Runtime/source files changed: `none`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Storage bucket creation, Storage object access, RLS policy deployment, migration deployment, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled. One repository static migration draft file was created but not executed.',
]

const requiredSqlText = [
  'create table if not exists public.artifact_manifests',
  'create table if not exists public.artifact_manifest_items',
  'alter table public.artifact_manifests enable row level security',
  'alter table public.artifact_manifest_items enable row level security',
  'create policy artifact_manifests_select_project_member',
  'create policy artifact_manifest_items_select_project_member',
  'grant usage on schema public to authenticated, service_role',
  'to authenticated',
  'from authenticated',
  'from public, anon',
  'to service_role',
  'Workers must not execute raw chat',
  'never signed URLs',
  'Final export records remain backend/service-role controlled and private',
]

const forbiddenClaims = [
  /Internal beta end-to-end status:\s*`?(ready|enabled|unlocked|passed)/i,
  /internal beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /external beta unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /production unlock(?:ed)?:\s*`?(true|enabled|unlocked|passed)/i,
  /Product-ready end-to-end local OSS tools:\s*`?[1-9]/i,
  /Supabase environment touched:(?!\s*`?none`?)/i,
  /SQL executed:(?!\s*`?none`?)/i,
  /Migration deployed:(?!\s*`?no`?)/i,
  /Storage buckets created:(?!\s*`?none`?)/i,
  /Supabase update status:\s*`?(applied|deployed|executed|completed_remote)/i,
  /RLS policy deployment:\s*`?(true|enabled|executed|deployed|passed)/i,
  /Storage object access:\s*`?(true|enabled|executed|passed)/i,
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

const forbiddenSqlPatterns = [
  /insert\s+into\s+storage\.buckets/i,
  /create\s+policy[\s\S]+on\s+storage\.objects/i,
  /alter\s+table\s+storage\./i,
  /create\s+or\s+replace\s+function[\s\S]+security\s+definer/i,
  /grant\s+.+\s+to\s+anon/i,
  /service_role_key/i,
  /create_signed_url|signed_url/i,
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
  .filter((file) => !file.startsWith('scripts/validation/') && file !== migrationFile)
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(docsCorpus)) fail(`forbidden claim matched ${pattern}`)
}

const migrationSql = read(migrationFile)
for (const text of requiredSqlText) {
  if (!migrationSql.includes(text)) fail(`missing required SQL text: ${text}`)
}
for (const pattern of forbiddenSqlPatterns) {
  if (pattern.test(migrationSql)) fail(`forbidden SQL pattern matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/static-record.json`))
if (record.decision !== 'completed_static_migration_draft_ready_for_guarded_local_validation') {
  fail('static record decision mismatch')
}
if (record.execution !== 'completed_static_migration_draft_no_sql_execution') {
  fail('static record execution mismatch')
}
if (record.migrationFile !== migrationFile) fail('migration file mismatch')
if (record.migrationDraftStatus !== 'created_not_applied') fail('migration draft status mismatch')
if (record.internalBetaDataFoundationStatus !== 'static_migration_draft_ready_not_applied') fail('data foundation status mismatch')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must stay not_ready')
if (record.supabaseEnvironmentTouched !== 'none') fail('Supabase environment must remain none')
if (record.sqlExecuted !== 'none') fail('SQL executed must remain none')
if (record.migrationFilesCreated !== 'one_static_draft') fail('migration files created must remain one_static_draft')
if (record.migrationDeployed !== 'no') fail('migration deployed must remain no')
if (record.storageBucketsCreated !== 'none') fail('storage bucket creation must remain none')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')
if (!['pending_validation', 'full_validation_passed'].includes(record.validationStatus)) {
  fail('validation status must be pending_validation or full_validation_passed')
}

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/rp-data-03-supabase-migration-draft-static-implementation-diagnostics.mjs'
if (packageJson.scripts?.['rp-data-03:supabase-migration-draft-static-implementation:diagnostics'] !== expectedScript) {
  fail('missing package diagnostics script')
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
  const isStaticMigration = file === migrationFile
  const isSupabaseSupportFile = file === 'supabase/README.md' || file === 'supabase/migration-order.md'
  if (
    forbiddenExactFiles.has(file) ||
    forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) ||
    (!isStaticMigration && !isSupabaseSupportFile && file.startsWith('supabase/')) ||
    (!isStaticMigration && file.endsWith('.sql')) ||
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
  if (file.startsWith('scripts/validation/')) continue
  const text = read(file)
  for (const pattern of forbiddenClaims) {
    if (pattern.test(text)) fail(`forbidden changed-file claim in ${file}: ${pattern}`)
  }
}

console.log(`${packet} diagnostics passed`)
