import { existsSync, readFileSync } from 'node:fs'

const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:supabase-sound-draft-local-fixture-migration'
const scriptCommand = 'tsx server/smoke/supabase-sound-draft-local-fixture-migration-smoke.ts'
const recommendedNextPrompt = 'SUPABASE-SOUND-3: local-only draft migration validation plan, no deploy'

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
  check(!/akia[0-9a-z]{12,}/i.test(source), `${label} must not contain access key shapes.`)
  check(!/sk-[a-z0-9_-]{12,}/i.test(source), `${label} must not contain provider credential shapes.`)
}

function assertNoUnmarkedInsertStatements(source: string, label: string): void {
  const insertLines = source
    .split('\n')
    .map((line, index) => ({ index: index + 1, text: line.trim() }))
    .filter((line) => /^insert\s+into\s+/i.test(line.text))

  check(
    insertLines.length === 0,
    `${label} must not include insert statements. Found at lines: ${insertLines
      .map((line) => line.index)
      .join(', ')}`,
  )
}

function assertNoSeedRows(source: string, label: string): void {
  const lower = source.toLowerCase()
  check(!/insert\s+into\s+(public\.)?feature_gates/i.test(source), `${label} must not seed feature_gates.`)
  check(!/insert\s+into\s+(public\.)?tool_capabilities/i.test(source), `${label} must not seed tool_capabilities.`)
  check(
    !/insert\s+into\s+(public\.)?worker_runtime_configs/i.test(source),
    `${label} must not seed worker_runtime_configs.`,
  )
  check(!lower.includes('feature gate seed values'), `${label} must not include feature gate seed values.`)
  check(!lower.includes('tool capability seed values'), `${label} must not include tool capability seed values.`)
  check(!lower.includes('worker runtime config seed values'), `${label} must not include worker runtime config seed values.`)
}

check(existsSync(draftMigrationPath), 'Draft migration file must exist under database/migration-drafts.')
check(existsSync(draftTestPath), 'Draft test SQL file must exist under database/test-sql.')
check(!existsSync(activeMigrationPath), 'Draft migration must not exist under supabase/migrations.')

const draftMigration = readFileSync(draftMigrationPath, 'utf8')
const draftTests = readFileSync(draftTestPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  'DRAFT ONLY',
  'DO NOT APPLY',
  'DO NOT DEPLOY',
  'SUPABASE-SOUND-2 planning artifact only',
  'No SQL from this file was executed by this prompt.',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Raw prompts must not become worker execution payloads.',
  'Public artifacts remain blocked.',
  'generated_local_fixture_passed is not claimed.',
]) {
  requireText(draftMigration, required, `Draft migration must include ${required}.`)
}

for (const required of [
  'DRAFT TESTS ONLY',
  'DO NOT RUN AGAINST PRODUCTION',
  'SUPABASE-SOUND-2 planning artifact only',
  'No SQL from this file was executed by this prompt.',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Raw prompts must not become worker execution payloads.',
]) {
  requireText(draftTests, required, `Draft tests must include ${required}.`)
}

for (const tableName of [
  'approved_plan_snapshots',
  'storage_object_records',
  'signed_url_events',
  'generation_requests',
  'generated_assets',
  'jobs',
  'job_events',
  'sound_effect_plans',
  'ambient_sound_plans',
  'music_plans',
  'audio_environment_analysis',
  'qa_reports',
  'credit_estimates',
  'credit_approvals',
  'credit_reservations',
  'feature_gates',
  'tool_capabilities',
  'worker_runtime_configs',
]) {
  requireText(draftMigration, tableName, `Draft migration must cover ${tableName}.`)
  requireText(draftTests, tableName, `Draft tests must cover ${tableName}.`)
}

for (const gate of [
  'raw_prompt_execution_allowed boolean not null default false',
  'signed_url_source_of_truth_allowed boolean not null default false',
  'public_artifact_allowed boolean not null default false',
  'provider_execution_allowed boolean not null default false',
  'worker_dispatch_allowed boolean not null default false',
  'signed_url_input_allowed boolean not null default false',
  'storage_scope text not null default',
  'checksum_algorithm text not null default',
  'approved_plan_snapshot_id uuid',
  'idempotency_key text',
]) {
  requireText(draftMigration, gate, `Draft migration must include gate: ${gate}.`)
}

for (const section of [
  'RLS policy draft',
  'Storage policy draft',
  'Index and performance draft',
  'Advisor blockers',
  'Migration-order and milestone sync',
  'Rollback and cleanup draft',
]) {
  requireText(draftMigration, section, `Draft migration must include ${section}.`)
}

for (const blocker of [
  'RLS enabled but no policy',
  'Mutable search_path warnings',
  'SECURITY DEFINER exposure warnings',
  'Unindexed foreign key findings',
  'Duplicate index findings',
  'Empty storage bucket/object evidence',
]) {
  requireText(draftMigration, blocker, `Draft migration must carry blocker: ${blocker}.`)
}

for (const testArea of [
  'approved snapshots are immutable',
  'approved snapshot fixture scope exists',
  'approved snapshot has checksum immutable version and source IDs',
  'approved snapshots do not expose raw prompt worker payload fields',
  'storage object records require private scope',
  'storage object records require checksum',
  'storage object records reject public artifact allowed',
  'storage object records reject signed URL source of truth',
  'signed_url_events are audit only',
  'generation requests require approved snapshot before fixture execution',
  'generation requests keep provider execution disabled by default',
  'generation requests keep worker dispatch disabled by default',
  'generated assets require storage object record linkage',
  'jobs require idempotency and approved snapshot before future dispatch',
  'jobs reject raw prompt execution fields',
  'jobs reject signed URL input fields',
  'feature gates cannot be client writable',
  'tool capabilities cannot be client writable',
  'worker runtime configs remain service owned',
  'credit rows are not required for local fixture until Billing accepts placeholder policy',
  'Lyria music only metadata boundary is preserved',
  'no anon write policies on service only runtime tables',
  'workspace isolation exists for fixture runtime tables',
  'service role write boundaries exist for future runtime rows',
]) {
  requireText(draftTests, testArea, `Draft tests must include test area: ${testArea}.`)
}

assertNoConcreteForbiddenText(draftMigration, 'Draft migration')
assertNoConcreteForbiddenText(draftTests, 'Draft tests')
assertNoUnmarkedInsertStatements(draftMigration, 'Draft migration')
assertNoUnmarkedInsertStatements(draftTests, 'Draft tests')
assertNoSeedRows(draftMigration, 'Draft migration')
assertNoSeedRows(draftTests, 'Draft tests')

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must point at the no-deploy smoke.`,
)

console.log(JSON.stringify({
  ok: true,
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
  requestingWorkstream: 'SOUND_MUSIC_AUDIO',
  smoke: 'supabase-sound-draft-local-fixture-migration',
  draftOnly: true,
  sqlExecuted: false,
  migrationDeployed: false,
  rowsCreated: false,
  storageObjectsCreated: false,
  signedUrlsCreated: false,
  activeMigrationCreated: false,
  claimsGeneratedLocalFixturePassed: false,
  recommendedNextPrompt,
}, null, 2))
