#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-DATA-02-SUPABASE-MIGRATION-SAFETY-PACKET'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/internal-beta/rp-data-02-supabase-migration-safety-packet'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/migration-file-map.md`,
  `${packetDir}/target-environment-guardrails.md`,
  `${packetDir}/rls-storage-advisor-plan.md`,
  `${packetDir}/rollback-and-recovery-plan.md`,
  `${packetDir}/execution-gate.md`,
  `${packetDir}/safety-record.json`,
  'docs/activation-phase-rp-data-02-supabase-migration-safety-packet-results.md',
  'docs/implementation-prompts/prompt-rp-data-03-supabase-migration-draft-static-implementation.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/rp-data-01-supabase-schema-migration-readiness-diagnostics.mjs',
  'scripts/validation/rp-data-02-supabase-migration-safety-packet-diagnostics.mjs',
]

const rpData03MigrationFile = 'supabase/migrations/20260625031135_rp_data_03_internal_beta_static_gap_contract.sql'
const rpData03Files = [
  'docs/internal-beta/rp-data-03-supabase-migration-draft-static-implementation/source-audit.md',
  'docs/internal-beta/rp-data-03-supabase-migration-draft-static-implementation/migration-draft-review.md',
  'docs/internal-beta/rp-data-03-supabase-migration-draft-static-implementation/rls-grant-review.md',
  'docs/internal-beta/rp-data-03-supabase-migration-draft-static-implementation/storage-artifact-manifest-review.md',
  'docs/internal-beta/rp-data-03-supabase-migration-draft-static-implementation/execution-gate.md',
  'docs/internal-beta/rp-data-03-supabase-migration-draft-static-implementation/static-record.json',
  'docs/activation-phase-rp-data-03-supabase-migration-draft-static-implementation-results.md',
  'docs/implementation-prompts/prompt-rp-data-04-guarded-local-supabase-migration-validation.md',
  'supabase/README.md',
  'supabase/migration-order.md',
  rpData03MigrationFile,
  'scripts/validation/rp-data-03-supabase-migration-draft-static-implementation-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  ...rpData03Files,
  'package.json',
])

const requiredText = [
  packet,
  'completed_migration_safety_packet_ready_for_static_migration_draft',
  'completed_docs_only_migration_safety_packet_no_sql_execution',
  '`RP-DATA-01-SUPABASE-SCHEMA-MIGRATION-READINESS` is merged at `3e7faf722b18077accf6c26aad71b745647d6cd3`',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'Internal beta data foundation status: `safety_packet_ready_not_applied`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  'Supabase update required: `future_migration_required`',
  'Supabase update status: `planning_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration files created: `none`',
  'Migration deployed: `no`',
  'Storage buckets created: `none`',
  'Next Supabase action: `RP-DATA-03-SUPABASE-MIGRATION-DRAFT-STATIC-IMPLEMENTATION`',
  'Migration file map status: `planned_not_created`',
  'Target environment status: `not_selected`',
  'RLS advisor plan status: `planned_not_run`',
  'Storage advisor plan status: `planned_not_run`',
  'Rollback plan status: `planned_not_executed`',
  'blocked_pending_static_migration_draft_and_guarded_environment_execution',
  'approved_plan_snapshots',
  'credit_reservations',
  'editing_jobs',
  'artifact_manifests',
  'audit_events',
  'source-media',
  'generated-assets',
  'processed-media',
  'previews',
  'exports',
  'thumbnails',
  'qa-artifacts',
  'worker-temp',
  'Package-lock: `unchanged`',
  'Generated artifacts committed: `none`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Storage bucket creation, Storage object access, RLS policy deployment, migration deployment, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, migration file creation, or broad service-role handler was enabled.',
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

const forbiddenExactFiles = new Set([
  'package-lock.json',
  '.dockerignore',
])

const forbiddenPrefixes = [
  'src/',
  'server/',
  'database/',
  'supabase/',
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
  .filter((file) => !file.startsWith('scripts/validation/'))
  .map((file) => read(file))
  .join('\n')

for (const text of requiredText) {
  if (!docsCorpus.includes(text)) fail(`missing required text: ${text}`)
}

for (const pattern of forbiddenClaims) {
  if (pattern.test(docsCorpus)) fail(`forbidden claim matched ${pattern}`)
}

const record = JSON.parse(read(`${packetDir}/safety-record.json`))
if (record.decision !== 'completed_migration_safety_packet_ready_for_static_migration_draft') {
  fail('safety record decision mismatch')
}
if (record.execution !== 'completed_docs_only_migration_safety_packet_no_sql_execution') {
  fail('safety record execution mismatch')
}
if (record.internalBetaDataFoundationStatus !== 'safety_packet_ready_not_applied') fail('data foundation status mismatch')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must stay not_ready')
if (record.migrationFileMapStatus !== 'planned_not_created') fail('migration map status mismatch')
if (record.targetEnvironmentStatus !== 'not_selected') fail('target environment must remain not_selected')
if (record.rlsAdvisorPlanStatus !== 'planned_not_run') fail('RLS advisor must remain planned_not_run')
if (record.storageAdvisorPlanStatus !== 'planned_not_run') fail('storage advisor must remain planned_not_run')
if (record.rollbackPlanStatus !== 'planned_not_executed') fail('rollback must remain planned_not_executed')
if (record.supabaseEnvironmentTouched !== 'none') fail('Supabase environment must remain none')
if (record.sqlExecuted !== 'none') fail('SQL executed must remain none')
if (record.migrationFilesCreated !== 'none') fail('migration files created must remain none')
if (record.migrationDeployed !== 'no') fail('migration deployed must remain no')
if (record.storageBucketsCreated !== 'none') fail('storage bucket creation must remain none')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/rp-data-02-supabase-migration-safety-packet-diagnostics.mjs'
if (packageJson.scripts?.['rp-data-02:supabase-migration-safety-packet:diagnostics'] !== expectedScript) {
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
  const isRpData03StaticMigration = file === rpData03MigrationFile
  const isRpData03SupabaseSupportFile = file === 'supabase/README.md' || file === 'supabase/migration-order.md'
  if (
    (!isRpData03StaticMigration && forbiddenExactFiles.has(file)) ||
    (!isRpData03StaticMigration && !isRpData03SupabaseSupportFile && forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) ||
    (!isRpData03StaticMigration && file.endsWith('.sql')) ||
    file.endsWith('.mp4') ||
    file.endsWith('.mov') ||
    file.endsWith('.mkv') ||
    file.endsWith('.webm') ||
    file.endsWith('.srt')
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
