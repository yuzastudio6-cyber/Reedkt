import { readFileSync } from 'node:fs'

const planPath = 'docs/supabase-sound-local-fixture-mutation-plan.md'
const scriptName = 'smoke:supabase-sound-local-fixture-mutation-plan'
const scriptCommand = 'tsx server/smoke/supabase-sound-local-fixture-mutation-plan-smoke.ts'
const recommendedNextPrompt = 'SUPABASE-SOUND-2: draft local fixture migration and RLS tests, no deploy'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function requireText(source: string, text: string, message = `Plan must include: ${text}`): void {
  check(source.includes(text), message)
}

function assertNoConcreteForbiddenText(source: string): void {
  const lower = source.toLowerCase()
  check(!/^https?:\/\//im.test(source), 'Plan must not contain concrete public URLs.')
  check(!lower.includes('x-goog-signature'), 'Plan must not contain signed URL signatures.')
  check(!lower.includes('x-amz-signature'), 'Plan must not contain signed URL signatures.')
  check(!lower.includes('signature='), 'Plan must not contain signed URL query values.')
  check(!lower.includes('token='), 'Plan must not contain tokenized URL values.')
  check(!lower.includes('storage.googleapis.com'), 'Plan must not contain storage public URLs.')
  check(!lower.includes('gs://'), 'Plan must not contain concrete storage URIs.')
  check(!lower.includes('gcs://'), 'Plan must not contain concrete storage URIs.')
  check(!lower.includes('provider_secret'), 'Plan must not contain provider secret fields.')
  check(!lower.includes('provider secret value'), 'Plan must not contain provider secret values.')
  check(!lower.includes('service_role_key'), 'Plan must not contain service-role key fields.')
  check(!lower.includes('service-role key value'), 'Plan must not contain service-role key values.')
  check(!lower.includes('raw_worker_prompt'), 'Plan must not contain raw worker prompt fields.')
  check(!lower.includes('rawworkerprompt'), 'Plan must not contain raw worker prompt fields.')
  check(!/akia[0-9a-z]{12,}/i.test(source), 'Plan must not contain access key shapes.')
  check(!/sk-[a-z0-9_-]{12,}/i.test(source), 'Plan must not contain provider credential shapes.')
}

const plan = readFileSync(planPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

requireText(plan, '# SUPABASE-SOUND-1 Local Fixture Mutation Plan')
requireText(plan, 'Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.')
requireText(plan, 'Requesting workstream: SOUND_MUSIC_AUDIO.')
requireText(plan, 'Current SOUND stage: dry_run_passed.')
requireText(plan, 'Target future stage: generated_local_fixture_passed.')
requireText(plan, 'This document is a mutation plan only.')
requireText(plan, 'This document does not execute SQL.')
requireText(plan, 'This document does not deploy migrations.')
requireText(plan, 'This document does not create rows.')
requireText(plan, 'This document does not create storage buckets or objects.')
requireText(plan, 'This document does not create signed URLs.')
requireText(plan, 'This document does not unlock generated_local_fixture_passed.')
requireText(plan, 'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot')
requireText(plan, 'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution')
requireText(plan, 'Raw prompt execution is blocked.')
requireText(plan, 'Plan-only continuation is accepted.')
requireText(plan, 'Live fixture execution is blocked')
requireText(plan, '### approved_plan_snapshots')
requireText(plan, '### storage_object_records')
requireText(plan, '### signed_url_events')
requireText(plan, '### generation_requests')
requireText(plan, '### generated_assets')
requireText(plan, '### jobs and job_events')
requireText(plan, '### sound_effect_plans / ambient_sound_plans / music_plans / audio_environment_analysis')
requireText(plan, '### credit_estimates / credit_approvals / credit_reservations')
requireText(plan, '### feature_gates / tool_capabilities / worker_runtime_configs')
requireText(plan, '## RLS Policy Plan')
requireText(plan, '## Storage Policy Plan')
requireText(plan, '## Index / Performance Plan')
requireText(plan, '## Security / Advisor Plan')
requireText(plan, '## Migration-Order / Milestone-Sync Plan')
requireText(plan, '## Fixture Execution Prerequisites')
requireText(plan, '## Rollback / Cleanup Plan')
requireText(plan, '## Blocked Uses')
requireText(plan, '## Cross-Chat Ownership')
requireText(plan, '## Supabase Update Classification')
requireText(plan, '## Supabase Milestone Sync')
requireText(plan, '## Next Prompt Recommendation')
requireText(plan, recommendedNextPrompt)

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
  'credit_estimates',
  'credit_approvals',
  'credit_reservations',
  'feature_gates',
  'tool_capabilities',
  'worker_runtime_configs',
  'qa_reports',
  'qa_report_items',
]) {
  requireText(plan, tableName, `Plan must cover ${tableName}.`)
}

for (const blocker of [
  'RLS enabled but no policy',
  'Mutable `search_path` warnings',
  'SECURITY DEFINER exposure warnings',
  'Unindexed foreign keys',
  'Duplicate indexes',
  'storage.buckets` and `storage.objects` have zero rows',
]) {
  requireText(plan, blocker, `Plan must include blocker: ${blocker}.`)
}

for (const prohibitedCurrentAction of [
  'SQL execution.',
  'Migration creation, application, or deployment.',
  'Supabase row mutation.',
  'Storage bucket or object creation.',
  'Signed URL creation.',
  'Approved snapshot creation.',
  'Generation request creation.',
  'Generated asset creation.',
  'Job or job event creation.',
  'Credit estimate, approval, reservation, spend, refund, or release creation.',
  'Feature gate mutation.',
  'Tool capability seeding.',
  'Worker runtime config creation.',
  'Provider calls.',
  'Worker dispatch.',
]) {
  requireText(plan, prohibitedCurrentAction, `Plan must keep blocked: ${prohibitedCurrentAction}`)
}

assertNoConcreteForbiddenText(plan)
check(packageJson.scripts?.[scriptName] === scriptCommand, `${scriptName} package script must point at the plan smoke.`)

console.log(JSON.stringify({
  ok: true,
  workstream: 'SUPABASE_RLS_STORAGE_DATABASE',
  requestingWorkstream: 'SOUND_MUSIC_AUDIO',
  smoke: 'supabase-sound-local-fixture-mutation-plan',
  mutationPlanOnly: true,
  sqlExecuted: false,
  migrationDeployed: false,
  rowsCreated: false,
  storageObjectsCreated: false,
  signedUrlsCreated: false,
  claimsGeneratedLocalFixturePassed: false,
  recommendedNextPrompt,
}, null, 2))
