#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const packet = 'RP-DATA-01-SUPABASE-SCHEMA-MIGRATION-READINESS'
const gitEnv = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }

const packetDir = 'docs/internal-beta/rp-data-01-supabase-schema-migration-readiness'
const requiredFiles = [
  `${packetDir}/source-audit.md`,
  `${packetDir}/table-readiness.md`,
  `${packetDir}/rls-storage-readiness.md`,
  `${packetDir}/migration-safety-checklist.md`,
  `${packetDir}/internal-beta-data-gate.md`,
  `${packetDir}/readiness-record.json`,
  'docs/activation-phase-rp-data-01-supabase-schema-migration-readiness-results.md',
  'docs/implementation-prompts/prompt-rp-data-02-supabase-migration-safety-packet.md',
  'docs/production-beta-blocker-inventory.md',
  'implementation-status-and-next-phase.md',
  'scripts/validation/rp-data-01-supabase-schema-migration-readiness-diagnostics.mjs',
]

const allowedChangedFiles = new Set([
  ...requiredFiles,
  'package.json',
])

const requiredText = [
  packet,
  'completed_schema_migration_readiness_review_ready_for_migration_safety_packet',
  'completed_docs_only_schema_rls_storage_readiness_no_sql_execution',
  'Internal beta data foundation status: `review_ready_not_applied`',
  'Internal beta end-to-end status: `not_ready`',
  'Product-ready end-to-end local OSS tools: `0`',
  'REEDITPRO-INTERNAL-BETA-READINESS-1` is merged at `508e8acf89216a6a6a07d5d7439dca6ff58b9b77`',
  '#577 remains open/draft/blocked and excluded as source-of-truth',
  'supabase-schema-planning-bridge.md',
  'database-migration-readiness-checklist.md',
  'supabase-table-specification.md',
  'sql-migration-draft-review.md',
  'supabase-rls-policy-draft.md',
  'supabase-storage-bucket-draft.md',
  'https://supabase.com/docs/guides/database/postgres/row-level-security',
  'https://supabase.com/docs/guides/api/securing-your-api',
  'https://supabase.com/docs/guides/storage/security/access-control',
  'https://supabase.com/docs/guides/storage/buckets/fundamentals',
  'Supabase update required: `future_migration_required`',
  'Supabase update status: `planning_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Storage buckets created: `none`',
  'Next Supabase action: `RP-DATA-02-SUPABASE-MIGRATION-SAFETY-PACKET`',
  'review_ready_not_applied',
  'ready_for_rp_data_02_safety_packet',
  'blocked_pending_migration_safety_packet_and_guarded_environment_execution',
  'service-role-only backend mutation boundaries',
  'approved_plan_snapshots',
  'credit_reservations',
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
  'Validation: `full_validation_passed`',
  'SQL files changed: `none`',
  'Supabase migration files changed: `none`',
  'Runtime/source files changed: `none`',
  'No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Storage bucket creation, Storage object access, RLS policy deployment, migration deployment, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.',
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

const record = JSON.parse(read(`${packetDir}/readiness-record.json`))
if (record.decision !== 'completed_schema_migration_readiness_review_ready_for_migration_safety_packet') {
  fail('readiness record decision mismatch')
}
if (record.internalBetaDataFoundationStatus !== 'review_ready_not_applied') fail('data foundation status mismatch')
if (record.internalBetaEndToEndStatus !== 'not_ready') fail('internal beta status must stay not_ready')
if (record.supabaseEnvironmentTouched !== 'none') fail('Supabase environment must remain none')
if (record.sqlExecuted !== 'none') fail('SQL executed must remain none')
if (record.migrationDeployed !== 'no') fail('migration deployed must remain no')
if (record.storageBucketsCreated !== 'none') fail('storage bucket creation must remain none')
if (record.productReadyEndToEndLocalOssTools !== 0) fail('product-ready tool count must remain 0')

const packageJson = JSON.parse(read('package.json'))
const expectedScript = 'node scripts/validation/rp-data-01-supabase-schema-migration-readiness-diagnostics.mjs'
if (packageJson.scripts?.['rp-data-01:supabase-schema-migration-readiness:diagnostics'] !== expectedScript) {
  fail('missing package diagnostics script')
}

gitQuiet(['diff', '--quiet', '--', 'package-lock.json'], 'package-lock.json changed')
for (const file of [
  '.dockerignore',
  'supabase/migrations',
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
  if (
    forbiddenExactFiles.has(file) ||
    forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) ||
    file.endsWith('.sql') ||
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
