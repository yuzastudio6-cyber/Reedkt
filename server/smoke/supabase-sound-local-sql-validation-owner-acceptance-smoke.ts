import { existsSync, readFileSync } from 'node:fs'

const packetPath = 'docs/supabase-sound-local-sql-validation-owner-acceptance.md'
const validationPlanPath = 'docs/supabase-sound-local-fixture-validation-plan.md'
const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-sql-validation-owner-acceptance'
const scriptCommand = 'tsx server/smoke/supabase-sound-local-sql-validation-owner-acceptance-smoke.ts'
const recommendedNextPrompt = 'SUPABASE-SOUND-3B: collect owner acceptance evidence, no execution'

const requiredOwners = [
  'SUPABASE_RLS_STORAGE_DATABASE',
  'SOUND_MUSIC_AUDIO',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
] as const

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function requireText(source: string, text: string, message = `Missing required text: ${text}`): void {
  check(source.includes(text), message)
}

function assertNoConcreteForbiddenText(source: string, label: string): void {
  const lower = source.toLowerCase()
  check(!/^https?:\/\//im.test(source), `${label} must not contain concrete public URLs.`)
  check(!lower.includes('x-goog-signature'), `${label} must not contain signed URL signatures.`)
  check(!lower.includes('x-amz-signature'), `${label} must not contain signed URL signatures.`)
  check(!lower.includes('signature='), `${label} must not contain signed URL query values.`)
  check(!lower.includes('token='), `${label} must not contain tokenized URL values.`)
  check(!lower.includes('storage.googleapis.com'), `${label} must not contain storage public URLs.`)
  check(!lower.includes('gs://'), `${label} must not contain concrete storage URIs.`)
  check(!lower.includes('gcs://'), `${label} must not contain concrete storage URIs.`)
  check(!lower.includes('provider_secret'), `${label} must not contain provider secret fields.`)
  check(!lower.includes('provider secret value'), `${label} must not contain provider secret values.`)
  check(!lower.includes('service_role_key'), `${label} must not contain service-role key fields.`)
  check(!lower.includes('service-role key value'), `${label} must not contain service-role key values.`)
  check(!lower.includes('secret_value'), `${label} must not contain secret value fields.`)
  check(!lower.includes('raw_worker_prompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('rawworkerprompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('raw_prompt_worker_payload'), `${label} must not contain raw prompt worker payload fields.`)
  check(!lower.includes('objectcreated'), `${label} must not contain object creation markers.`)
  check(!/akia[0-9a-z]{12,}/i.test(source), `${label} must not contain access key shapes.`)
  check(!/sk-[a-z0-9_-]{12,}/i.test(source), `${label} must not contain provider credential shapes.`)
}

function ownerSection(source: string, owner: string): string {
  const start = source.indexOf(`### ${owner}`)
  check(start >= 0, `Owner section missing: ${owner}`)
  const next = source.indexOf('\n### ', start + 1)
  return next >= 0 ? source.slice(start, next) : source.slice(start)
}

check(existsSync(packetPath), 'Owner acceptance packet document must exist.')
check(existsSync(validationPlanPath), 'Local validation plan document must exist.')
check(existsSync(draftMigrationPath), 'Draft migration file must exist.')
check(existsSync(draftTestPath), 'Draft test SQL file must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const packet = readFileSync(packetPath, 'utf8')
const validationPlan = readFileSync(validationPlanPath, 'utf8')
const draftMigration = readFileSync(draftMigrationPath, 'utf8')
const draftTests = readFileSync(draftTestPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# SUPABASE-SOUND-3A Local SQL Validation Owner Acceptance Packet',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'Current SOUND stage: dry_run_passed.',
  'Target future stage: generated_local_fixture_passed.',
  'This packet is owner-acceptance-only.',
  'This packet does not execute SQL.',
  'This packet does not run migrations.',
  'This packet does not deploy migrations.',
  'This packet does not create rows.',
  'This packet does not create storage buckets or objects.',
  'This packet does not create signed URLs.',
  'This packet does not unlock generated_local_fixture_passed.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Public URLs are blocked.',
  'Public artifacts are blocked.',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'Raw prompt execution is blocked.',
  '## Inputs requiring owner acceptance',
  validationPlanPath,
  'docs/supabase-sound-local-fixture-mutation-plan.md',
  draftMigrationPath,
  draftTestPath,
  '## Acceptance decision requested',
  '## Owner acceptance matrix',
  '## Local validation command approval checklist',
  '## Forbidden validation targets',
  '## Future command examples',
  'examples only and are not executed',
  '## Evidence required before SUPABASE-SOUND-4',
  '## Recommendation',
  recommendedNextPrompt,
]) {
  requireText(packet, required, `Owner packet must include ${required}.`)
}

for (const owner of requiredOwners) {
  const section = ownerSection(packet, owner)
  requireText(section, 'Acceptance status: not_accepted_for_execution.', `${owner} must remain not accepted.`)
  requireText(section, 'Required evidence:', `${owner} must include required evidence.`)
  requireText(section, 'Forbidden bypass:', `${owner} must include forbidden bypasses.`)
}

for (const checklistItem of [
  'local or approved non-production target confirmed',
  'production target explicitly forbidden',
  'live customer data explicitly forbidden',
  'draft migration path confirmed',
  'draft test SQL path confirmed',
  'rollback/cleanup reviewed',
  'source-of-truth rule reviewed',
  'raw prompt rule reviewed',
  'signed URL source-of-truth blocked',
  'public artifacts blocked',
  'provider calls blocked',
  'worker dispatch blocked',
  'credit spend/reservation blocked',
  'Track A export blocked',
  'Track B processing blocked',
  'advisor output capture plan accepted',
  'DB type regeneration remains blocked until migration is actually applied in approved environment',
]) {
  requireText(packet, checklistItem, `Owner packet must include checklist item: ${checklistItem}`)
}

for (const forbiddenTarget of [
  'production Supabase',
  'staging Supabase unless a later prompt explicitly approves staging',
  'any database with live customer data',
  'any environment with public storage',
  'any environment with provider secrets',
  'any environment that can dispatch workers',
  'any environment that can create signed URLs',
  'any environment that can spend credits',
  'any environment that can publish artifacts',
]) {
  requireText(packet, forbiddenTarget, `Owner packet must include forbidden target: ${forbiddenTarget}`)
}

for (const evidence of [
  'owner acceptance recorded',
  'local environment target recorded',
  'no-production confirmation',
  'no-live-data confirmation',
  'rollback/cleanup confirmation',
  'draft migration/test review complete',
  'no provider/worker/GCP/credit/public-artifact path confirmed',
  'command list approved',
  'expected output capture plan accepted',
]) {
  requireText(packet, evidence, `Owner packet must include evidence requirement: ${evidence}`)
}

for (const validationPlanRequired of [
  '# SUPABASE-SOUND-3 Local Fixture Validation Plan',
  'This document is a local validation plan only.',
  'These commands require SUPABASE_RLS_STORAGE_DATABASE owner acceptance before use.',
  'SUPABASE-SOUND-3A: owner acceptance packet for local SQL validation, no execution',
]) {
  requireText(validationPlan, validationPlanRequired, `Validation plan must still include ${validationPlanRequired}.`)
}

for (const draftRequired of [
  'DRAFT ONLY',
  'DO NOT APPLY',
  'DO NOT DEPLOY',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Raw prompts must not become worker execution payloads.',
]) {
  requireText(draftMigration, draftRequired, `Draft migration must still include ${draftRequired}.`)
}

for (const draftTestRequired of [
  'DRAFT TESTS ONLY',
  'DO NOT RUN AGAINST PRODUCTION',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Raw prompts must not become worker execution payloads.',
]) {
  requireText(draftTests, draftTestRequired, `Draft test SQL must still include ${draftTestRequired}.`)
}

assertNoConcreteForbiddenText(packet, 'Owner packet')
assertNoConcreteForbiddenText(validationPlan, 'Validation plan')
assertNoConcreteForbiddenText(draftMigration, 'Draft migration')
assertNoConcreteForbiddenText(draftTests, 'Draft tests')

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must point at the owner acceptance smoke.`,
)

console.log(JSON.stringify({
  ok: true,
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
  requestingWorkstream: 'SOUND_MUSIC_AUDIO',
  smoke: 'supabase-sound-local-sql-validation-owner-acceptance',
  ownerAcceptanceOnly: true,
  sqlExecuted: false,
  migrationDeployed: false,
  rowsCreated: false,
  storageObjectsCreated: false,
  signedUrlsCreated: false,
  claimsGeneratedLocalFixturePassed: false,
  recommendedNextPrompt,
}, null, 2))
