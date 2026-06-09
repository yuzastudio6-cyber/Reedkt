import { existsSync, readFileSync } from 'node:fs'

const validationPlanPath = 'docs/supabase-sound-local-fixture-validation-plan.md'
const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-local-fixture-validation-plan'
const scriptCommand = 'tsx server/smoke/supabase-sound-local-fixture-validation-plan-smoke.ts'
const recommendedNextPrompt = 'SUPABASE-SOUND-3A: owner acceptance packet for local SQL validation, no execution'

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
  check(!lower.includes('public_read_policy'), `${label} must not contain public storage read policy markers.`)
  check(!/akia[0-9a-z]{12,}/i.test(source), `${label} must not contain access key shapes.`)
  check(!/sk-[a-z0-9_-]{12,}/i.test(source), `${label} must not contain provider credential shapes.`)
}

check(existsSync(validationPlanPath), 'Validation plan document must exist.')
check(existsSync(draftMigrationPath), 'Draft migration file must exist under database/migration-drafts.')
check(existsSync(draftTestPath), 'Draft test SQL file must exist under database/test-sql.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const validationPlan = readFileSync(validationPlanPath, 'utf8')
const draftMigration = readFileSync(draftMigrationPath, 'utf8')
const draftTests = readFileSync(draftTestPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# SUPABASE-SOUND-3 Local Fixture Validation Plan',
  'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'Current SOUND stage: dry_run_passed.',
  'Target future stage: generated_local_fixture_passed.',
  'This document is a local validation plan only.',
  'This document does not execute SQL.',
  'This document does not run migrations.',
  'This document does not deploy migrations.',
  'This document does not create rows.',
  'This document does not create storage buckets or objects.',
  'This document does not create signed URLs.',
  'This document does not unlock generated_local_fixture_passed.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Public URLs are blocked.',
  'Public artifacts are blocked.',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'Raw prompt execution is blocked.',
  '## Draft inputs',
  draftMigrationPath,
  draftTestPath,
  'docs/supabase-sound-local-fixture-mutation-plan.md',
  'supabase/migration-order.md',
  'supabase/schema-health-checks.sql',
  '## What local validation would prove later',
  '## What this plan does not prove',
  '## Future local validation environment requirements',
  '## Future command plan',
  'These commands require SUPABASE_RLS_STORAGE_DATABASE owner acceptance before use.',
  '## Validation checklist before running future local SQL',
  '## Expected validation assertions',
  '## Advisor validation plan',
  '## DB type regeneration plan',
  'DB types must not be regenerated in this prompt.',
  '## Rollback / cleanup validation plan',
  '## Owner gates before any local SQL validation',
  '## Next prompt recommendation',
  recommendedNextPrompt,
]) {
  requireText(validationPlan, required, `Validation plan must include ${required}.`)
}

for (const expectedAssertion of [
  'Approved snapshots immutable.',
  'Approved snapshots require checksum, source IDs, and immutable version.',
  'storage_object_records require private scope.',
  'storage_object_records require checksum.',
  'storage_object_records reject public artifact.',
  'storage_object_records reject signed URL source-of-truth.',
  'signed_url_events are audit-only.',
  'generation_requests require approved snapshot before future execution.',
  'generated_assets require storage_object_record_id.',
  'generated_assets require private scope and public_artifact_allowed=false.',
  'jobs require idempotency and approved snapshot.',
  'jobs reject raw prompt execution.',
  'jobs reject signed URL input.',
  'feature gates and tool capabilities cannot be client-writable.',
  'worker_runtime_configs remain service-owned.',
  'Workspace isolation exists.',
  'Service-role write boundaries exist.',
]) {
  requireText(validationPlan, expectedAssertion, `Validation plan must include assertion: ${expectedAssertion}`)
}

for (const ownerGate of [
  'SUPABASE_RLS_STORAGE_DATABASE accepts local validation execution.',
  'SOUND_MUSIC_AUDIO confirms fixture spec requirements.',
  'WORKER_RUNTIME_JOBS confirms no worker dispatch.',
  'PROVIDER_GATEWAY_MODELS confirms no provider calls.',
  'OBSERVABILITY_AUDIT_COST confirms evidence capture expectations.',
  'BILLING_STRIPE_CREDITS confirms no spend or reservation.',
  'TRACK_A_RENDER_EXPORT confirms no export readiness claim.',
  'TRACK_B_MEDIA_PROCESSING confirms no media processing.',
]) {
  requireText(validationPlan, ownerGate, `Validation plan must include owner gate: ${ownerGate}`)
}

for (const draftRequired of [
  'DRAFT ONLY',
  'DO NOT APPLY',
  'DO NOT DEPLOY',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Raw prompts must not become worker execution payloads.',
  'RLS policy draft',
  'Storage policy draft',
  'Index and performance draft',
  'Rollback and cleanup draft',
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

for (const forbiddenCurrentClaim of [
  'No SQL has been executed.',
  'No migration has been applied.',
  'No live Supabase rows exist.',
  'No storage objects exist.',
  'No signed URLs exist.',
  'No worker dispatch is accepted.',
  'No provider call is accepted.',
  'No generated asset exists.',
  'No credits or approvals exist.',
]) {
  requireText(validationPlan, forbiddenCurrentClaim, `Validation plan must keep blocked claim: ${forbiddenCurrentClaim}`)
}

assertNoConcreteForbiddenText(validationPlan, 'Validation plan')
assertNoConcreteForbiddenText(draftMigration, 'Draft migration')
assertNoConcreteForbiddenText(draftTests, 'Draft tests')

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must point at the validation plan smoke.`,
)

console.log(JSON.stringify({
  ok: true,
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
  requestingWorkstream: 'SOUND_MUSIC_AUDIO',
  smoke: 'supabase-sound-local-fixture-validation-plan',
  validationPlanOnly: true,
  sqlExecuted: false,
  migrationDeployed: false,
  rowsCreated: false,
  storageObjectsCreated: false,
  signedUrlsCreated: false,
  claimsGeneratedLocalFixturePassed: false,
  recommendedNextPrompt,
}, null, 2))
