import { existsSync, readFileSync } from 'node:fs'

import { SOUND_MUSIC_AUDIO_GENERATED_LOCAL_FIXTURE_SPEC } from '../../src/backend/mock/mock-sound-music-audio-generated-local-fixture-spec'
import { SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION } from '../../src/backend/mock/mock-supabase-sound-local-sql-supabase-owner-decision'
import { WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE } from '../../src/backend/mock/mock-worker-runtime-sound-audio-fixture-payload-acceptance'

const auditDocPath = 'docs/worker-runtime-sound-audio-fixture-payload-acceptance-audit.md'
const supabaseDecisionDocPath = 'docs/supabase-sound-local-sql-validation-supabase-owner-decision.md'
const approvalDocPath = 'docs/supabase-sound-local-sql-validation-owner-approval-requests.md'
const evidenceDocPath = 'docs/supabase-sound-local-sql-validation-owner-evidence.md'
const soundFixturePlanPath = 'docs/sound-music-audio-generated-local-fixture-plan.md'
const soundOwnerChecklistPath = 'docs/sound-music-audio-owner-acceptance-checklist.md'
const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:worker-runtime-sound-audio-fixture-payload-acceptance'
const scriptCommand = 'tsx server/smoke/worker-runtime-sound-audio-fixture-payload-acceptance-smoke.ts'
const recommendedImmediateNextPrompt = 'PROVIDER-GATEWAY-SOUND-0: provider/license fixture boundary audit'

const requiredOwners = [
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'SOUND_MUSIC_AUDIO',
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
  check(!lower.includes('service_role_key'), `${label} must not contain service-role key fields.`)
  check(!lower.includes('service-role key value'), `${label} must not contain service-role key values.`)
  check(!lower.includes('secret_value'), `${label} must not contain secret value fields.`)
  check(!lower.includes('api_key'), `${label} must not contain API key fields.`)
  check(!lower.includes('raw_worker_prompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('rawworkerprompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('raw_prompt_worker_payload'), `${label} must not contain raw prompt worker payload fields.`)
  check(!lower.includes('objectcreated'), `${label} must not contain object creation markers.`)
  check(!lower.includes('rowscreated: true'), `${label} must not contain row mutation markers.`)
  check(!lower.includes('sqlexecuted: true'), `${label} must not contain SQL execution markers.`)
  check(!lower.includes('migrationdeployed: true'), `${label} must not contain migration deploy markers.`)
  check(!/akia[0-9a-z]{12,}/i.test(source), `${label} must not contain access key shapes.`)
  check(!/sk-[a-z0-9_-]{12,}/i.test(source), `${label} must not contain provider credential shapes.`)
}

function scanForbiddenValues(value: unknown, label: string): void {
  if (typeof value === 'string') {
    assertNoConcreteForbiddenText(value, label)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForbiddenValues(item, `${label}[${index}]`))
    return
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      assertNoConcreteForbiddenText(key, `${label}.${key}`)
      scanForbiddenValues(nestedValue, `${label}.${key}`)
    }
  }
}

function ownerSection(source: string, owner: string): string {
  const start = source.indexOf(`### ${owner}`)
  check(start >= 0, `Owner section missing: ${owner}`)
  const next = source.indexOf('\n### ', start + 1)
  return next >= 0 ? source.slice(start, next) : source.slice(start)
}

function assertAllExecutionFlagsFalse(flags: Record<string, boolean>, label: string): void {
  for (const [key, value] of Object.entries(flags)) {
    check(value === false, `${label}.${key} must be false.`)
  }
}

check(existsSync(auditDocPath), 'Worker Runtime audit document must exist.')
check(existsSync(supabaseDecisionDocPath), 'Supabase owner decision document must exist.')
check(existsSync(approvalDocPath), 'Approval request document must exist.')
check(existsSync(evidenceDocPath), 'Owner evidence document must exist.')
check(existsSync(soundFixturePlanPath), 'SOUND generated/local fixture plan must exist.')
check(existsSync(soundOwnerChecklistPath), 'SOUND owner checklist must exist.')
check(existsSync(draftMigrationPath), 'Draft migration file must exist.')
check(existsSync(draftTestPath), 'Draft test SQL file must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const auditDoc = readFileSync(auditDocPath, 'utf8')
const supabaseDecisionDoc = readFileSync(supabaseDecisionDocPath, 'utf8')
const approvalDoc = readFileSync(approvalDocPath, 'utf8')
const evidenceDoc = readFileSync(evidenceDocPath, 'utf8')
const soundFixturePlan = readFileSync(soundFixturePlanPath, 'utf8')
const soundOwnerChecklist = readFileSync(soundOwnerChecklistPath, 'utf8')
const draftMigration = readFileSync(draftMigrationPath, 'utf8')
const draftTests = readFileSync(draftTestPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# WORKER-RUNTIME-SOUND-0 Audio Fixture Payload Acceptance Audit',
  'Workstream owner: WORKER_RUNTIME_JOBS.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'Related source workstream: SUPABASE_RLS_STORAGE_DATABASE.',
  'Current SOUND stage: dry_run_passed.',
  'Target future stage: generated_local_fixture_passed.',
  'This document is audit-only.',
  'This document does not dispatch workers.',
  'This document does not create jobs.',
  'This document does not create job events.',
  'This document does not create worker runtime configs.',
  'This document does not execute claim/lease flow.',
  'This document does not mutate Supabase.',
  'This document does not execute SQL.',
  'This document does not unlock generated_local_fixture_passed.',
  'SUPABASE-SOUND-4 remains globally blocked until cross-owner approvals are complete.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'signed URLs are not source of truth;',
  'public URLs are blocked;',
  'public artifacts are blocked;',
  'worker payloads must reference source-of-truth records, not signed URLs.',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'raw prompt execution is blocked;',
  'worker payloads must never be raw chat prompts;',
  'workerRuntimeDecision: conditional_worker_runtime_acceptance_for_future_payload_shape_validation.',
  'workerRuntimeAllowsFuturePayloadShapeValidation: true.',
  'workerRuntimeAllowsDispatch: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
  '## Accepted by Worker Runtime',
  'future payload-shape validation only;',
  'approvedPlanSnapshotId required;',
  'idempotencyKey required;',
  'timingAwareCueManifestId required;',
  'privateAudioArtifactManifestId required;',
  'fixtureSpecId required;',
  'rawPromptExecutionAllowed=false;',
  'signedUrlInputAllowed=false;',
  'serviceRoleKeyAllowed=false;',
  'providerSecretAllowed=false;',
  'publicArtifactUrlAllowed=false;',
  'generatedAssetCreationAllowed=false;',
  'providerCallAllowed=false;',
  '## Rejected / still blocked by Worker Runtime',
  'production worker dispatch;',
  'local worker dispatch;',
  'job row creation;',
  'job_event row creation;',
  'worker_runtime_configs creation;',
  'claim/lease execution;',
  'raw prompt worker execution;',
  'signed URL worker inputs;',
  'generated_local_fixture_passed claim.',
  '## Future payload shape expectation',
  '"mode": "audio_fixture_payload_shape_validation_only"',
  '"mayDispatchWorker": false',
  '"mayCreateJob": false',
  '"mayCreateJobEvent": false',
  '"mayCallProvider": false',
  '"mayMutateSupabase": false',
  '"mayCreateGeneratedAsset": false',
  '## Required before WORKER-RUNTIME-SOUND-1',
  'no-dispatch smoke;',
  'no raw prompt test;',
  'no signed URL input test;',
  'no secret/service-role/provider-key test;',
  'idempotency key test;',
  'approved snapshot reference test;',
  'timing/private manifest reference test;',
  'no job/job_event creation test;',
  'no runtime config mutation test;',
  '## Cross-owner status after Worker Runtime decision',
  '## Go / no-go for SUPABASE-SOUND-4',
  'Worker dispatch must not run.',
  'generated_local_fixture_passed cannot be claimed.',
  '## Runtime/provider/gate behavior',
  'provider calls: false.',
  'worker dispatch: false.',
  'job creation: false.',
  'job event creation: false.',
  'runtime config creation: false.',
  'claim/lease execution: false.',
  'Supabase mutation: false.',
  'SQL execution: false.',
  'migration deploy: false.',
  '## Supabase update classification',
  'Supabase update required: no.',
  'Supabase environment touched: no.',
  'SQL executed: no.',
  'Migration deployed: no.',
  '## Recommendation',
  recommendedImmediateNextPrompt,
]) {
  requireText(auditDoc, required, `Audit doc must include ${required}.`)
}

for (const owner of requiredOwners) {
  const section = ownerSection(auditDoc, owner)
  requireText(section, `owner: ${owner}.`, `${owner} section must include owner field.`)
  requireText(section, 'status:', `${owner} section must include status.`)
  requireText(section, 'evidence:', `${owner} section must include evidence.`)
  requireText(section, 'missingEvidence:', `${owner} section must include missing evidence.`)
}

requireText(
  ownerSection(auditDoc, 'WORKER_RUNTIME_JOBS'),
  'status: accepted_conditionally.',
  'Worker Runtime owner must be conditionally accepted.',
)
requireText(
  ownerSection(auditDoc, 'SUPABASE_RLS_STORAGE_DATABASE'),
  'status: accepted_conditionally.',
  'Supabase owner must remain conditionally accepted.',
)

for (const owner of requiredOwners.filter((owner) => (
  owner !== 'WORKER_RUNTIME_JOBS' && owner !== 'SUPABASE_RLS_STORAGE_DATABASE'
))) {
  requireText(ownerSection(auditDoc, owner), 'status: missing.', `${owner} must remain missing.`)
}

for (const priorRequired of [
  '# SUPABASE-SOUND-3D Supabase Owner Decision for Local SQL Validation',
  'supabaseOwnerAllowsFutureLocalValidation: true.',
  'globalGoForSUPABASE_SOUND_4: false.',
  'WORKER-RUNTIME-SOUND-0: audio fixture payload acceptance audit',
]) {
  requireText(supabaseDecisionDoc, priorRequired, `Supabase decision doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SUPABASE-SOUND-3C Local SQL Validation Owner Approval Requests',
  'goForSUPABASE_SOUND_4: false.',
  'SUPABASE-SOUND-4 is blocked.',
]) {
  requireText(approvalDoc, priorRequired, `Approval request doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SUPABASE-SOUND-3B Local SQL Validation Owner Evidence Packet',
  'goForSUPABASE_SOUND_4: false.',
  'SUPABASE-SOUND-4 local SQL validation is blocked.',
]) {
  requireText(evidenceDoc, priorRequired, `Owner evidence doc must still include ${priorRequired}.`)
}

for (const soundRequired of [
  '# SOUND_MUSIC_AUDIO Generated/Local Fixture Plan',
  'This document is planning-only.',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'user/chat request -> structured agent findings -> edit intents -> approved plan snapshot -> worker execution',
]) {
  requireText(soundFixturePlan, soundRequired, `SOUND fixture plan must still include ${soundRequired}.`)
}

for (const soundChecklistRequired of [
  '# SOUND_MUSIC_AUDIO Owner Acceptance Checklist',
  'This checklist is handoff-only.',
  'This checklist does not claim generated_local_fixture_passed.',
]) {
  requireText(soundOwnerChecklist, soundChecklistRequired, `SOUND owner checklist must still include ${soundChecklistRequired}.`)
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
  'Future local/staging validation must use mock IDs only.',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'Signed URLs are not source of truth.',
]) {
  requireText(draftTests, draftTestRequired, `Draft tests must still include ${draftTestRequired}.`)
}

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must be ${scriptCommand}.`,
)

const acceptance = WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE

check(acceptance.workstream === 'WORKER_RUNTIME_JOBS', 'Workstream must be Worker Runtime.')
check(acceptance.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Requesting workstream must be SOUND.')
check(
  acceptance.relatedSourceWorkstream === 'SUPABASE_RLS_STORAGE_DATABASE',
  'Related source workstream must be Supabase.',
)
check(acceptance.mode === 'worker_runtime_payload_acceptance_audit_only', 'Mode must be audit-only.')
check(acceptance.currentUnlockStage === 'dry_run_passed', 'Current stage must remain dry_run_passed.')
check(
  acceptance.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Target future stage must be generated_local_fixture_passed.',
)
check(acceptance.claimsGeneratedLocalFixturePassed === false, 'Must not claim generated_local_fixture_passed.')
check(
  acceptance.decision.workerRuntimeDecision ===
    'conditional_worker_runtime_acceptance_for_future_payload_shape_validation',
  'Worker Runtime decision must be conditional payload-shape acceptance.',
)
check(
  acceptance.decision.workerRuntimeAllowsFuturePayloadShapeValidation === true,
  'Worker Runtime should allow future payload-shape validation conditionally.',
)
check(acceptance.decision.workerRuntimeAllowsDispatch === false, 'Worker Runtime dispatch must remain blocked.')
check(acceptance.decision.globalGoForSUPABASE_SOUND_4 === false, 'Global go must remain false.')
check(acceptance.decision.reasonGlobalGoBlocked.length >= 5, 'Global blockers must be listed.')
assertAllExecutionFlagsFalse(acceptance.execution, 'acceptance.execution')
check(acceptance.acceptedConditions.length >= 10, 'Accepted conditions must be populated.')
check(acceptance.rejectedOrStillBlocked.length >= 10, 'Rejected/still-blocked conditions must be populated.')

const futurePayload = acceptance.futurePayloadShapeExpectation
check(futurePayload.workstream === 'SOUND_MUSIC_AUDIO', 'Future payload workstream must be SOUND.')
check(futurePayload.mode === 'audio_fixture_payload_shape_validation_only', 'Future payload mode must be shape-only.')
check(futurePayload.approvedPlanSnapshotId === 'required', 'Future payload must require approvedPlanSnapshotId.')
check(futurePayload.idempotencyKey === 'required', 'Future payload must require idempotencyKey.')
check(futurePayload.timingAwareCueManifestId === 'required', 'Future payload must require timingAwareCueManifestId.')
check(
  futurePayload.privateAudioArtifactManifestId === 'required',
  'Future payload must require privateAudioArtifactManifestId.',
)
check(futurePayload.fixtureSpecId === 'required', 'Future payload must require fixtureSpecId.')
check(futurePayload.providerPolicyRef === 'required', 'Future payload must require providerPolicyRef.')
check(futurePayload.runtimeTarget === 'mock_or_local_validation_only', 'Runtime target must stay mock/local only.')
check(futurePayload.mayDispatchWorker === false, 'Future payload mayDispatchWorker must be false.')
check(futurePayload.mayCreateJob === false, 'Future payload mayCreateJob must be false.')
check(futurePayload.mayCreateJobEvent === false, 'Future payload mayCreateJobEvent must be false.')
check(futurePayload.mayCallProvider === false, 'Future payload mayCallProvider must be false.')
check(futurePayload.mayMutateSupabase === false, 'Future payload mayMutateSupabase must be false.')
check(futurePayload.mayCreateGeneratedAsset === false, 'Future payload mayCreateGeneratedAsset must be false.')
check(futurePayload.signedUrlInputAllowed === false, 'Future payload signedUrlInputAllowed must be false.')
check(futurePayload.rawPromptExecutionAllowed === false, 'Future payload rawPromptExecutionAllowed must be false.')
check(futurePayload.serviceRoleKeyAllowed === false, 'Future payload serviceRoleKeyAllowed must be false.')
check(futurePayload.providerSecretAllowed === false, 'Future payload providerSecretAllowed must be false.')
check(futurePayload.publicArtifactUrlAllowed === false, 'Future payload publicArtifactUrlAllowed must be false.')

check(
  acceptance.requiredBeforeWORKER_RUNTIME_SOUND_1.length >= 10,
  'Requirements before WORKER-RUNTIME-SOUND-1 must be populated.',
)
check(acceptance.sourceOfTruthPath.requiresSupabaseRow === true, 'Source path must require Supabase row.')
check(acceptance.sourceOfTruthPath.requiresPrivateGcsPath === true, 'Source path must require private GCS path.')
check(acceptance.sourceOfTruthPath.requiresManifest === true, 'Source path must require manifest.')
check(acceptance.sourceOfTruthPath.requiresChecksum === true, 'Source path must require checksum.')
check(acceptance.sourceOfTruthPath.requiresApprovedPlanSnapshot === true, 'Source path must require approved snapshot.')
check(acceptance.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false, 'Signed URLs must not be source of truth.')
check(acceptance.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must not be allowed.')
check(acceptance.rawPromptRule.rawPromptDirectExecutionAllowed === false, 'Raw prompt execution must be blocked.')
check(acceptance.rawPromptRule.requiresStructuredAgentFindings === true, 'Structured findings must be required.')
check(acceptance.rawPromptRule.requiresEditIntents === true, 'Edit intents must be required.')
check(acceptance.rawPromptRule.requiresApprovedPlanSnapshot === true, 'Approved snapshot must be required.')
check(
  acceptance.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Recommended immediate next prompt must be Provider Gateway.',
)

for (const owner of requiredOwners) {
  const entry = acceptance.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(Boolean(entry), `Acceptance spec must include cross-owner status for ${owner}.`)
  check((entry?.evidence.length ?? 0) > 0, `${owner} must include evidence.`)
  check((entry?.missingEvidence.length ?? 0) > 0, `${owner} must include missing evidence.`)
}

for (const [owner, expectedStatus] of [
  ['WORKER_RUNTIME_JOBS', 'accepted_conditionally'],
  ['SUPABASE_RLS_STORAGE_DATABASE', 'accepted_conditionally'],
  ['SOUND_MUSIC_AUDIO', 'missing'],
  ['PROVIDER_GATEWAY_MODELS', 'missing'],
  ['OBSERVABILITY_AUDIT_COST', 'missing'],
  ['BILLING_STRIPE_CREDITS', 'missing'],
  ['TRACK_A_RENDER_EXPORT', 'missing'],
  ['TRACK_B_MEDIA_PROCESSING', 'missing'],
] as const) {
  const entry = acceptance.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(entry?.status === expectedStatus, `${owner} must have status ${expectedStatus}.`)
}

check(
  SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION.decision.supabaseOwnerAllowsFutureLocalValidation === true,
  'Supabase owner decision must remain conditionally accepted for future local SQL validation.',
)
check(
  SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION.decision.globalGoForSUPABASE_SOUND_4 === false,
  'Supabase owner decision must keep global go blocked.',
)
check(
  SOUND_MUSIC_AUDIO_GENERATED_LOCAL_FIXTURE_SPEC.execution.workerDispatchAllowed === false,
  'SOUND fixture spec must keep worker dispatch blocked.',
)
check(
  SOUND_MUSIC_AUDIO_GENERATED_LOCAL_FIXTURE_SPEC.workerRuntimeRules.rawPromptExecutionAllowed === false,
  'SOUND fixture spec must reject raw prompt execution.',
)
check(
  SOUND_MUSIC_AUDIO_GENERATED_LOCAL_FIXTURE_SPEC.workerRuntimeRules.signedUrlInputAllowed === false,
  'SOUND fixture spec must reject signed URL input.',
)

for (const source of [
  ['auditDoc', auditDoc],
  ['supabaseDecisionDoc', supabaseDecisionDoc],
  ['approvalDoc', approvalDoc],
  ['evidenceDoc', evidenceDoc],
  ['soundFixturePlan', soundFixturePlan],
  ['soundOwnerChecklist', soundOwnerChecklist],
  ['draftMigration', draftMigration],
  ['draftTests', draftTests],
] as const) {
  assertNoConcreteForbiddenText(source[1], source[0])
}

scanForbiddenValues(WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE, 'workerRuntimeAcceptance')
scanForbiddenValues(SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION, 'supabaseOwnerDecision')
scanForbiddenValues(SOUND_MUSIC_AUDIO_GENERATED_LOCAL_FIXTURE_SPEC, 'soundFixtureSpec')

console.log(
  JSON.stringify(
    {
      ok: true,
      workstream: acceptance.workstream,
      requestingWorkstream: acceptance.requestingWorkstream,
      smoke: 'worker-runtime-sound-audio-fixture-payload-acceptance',
      mode: acceptance.mode,
      claimsGeneratedLocalFixturePassed: acceptance.claimsGeneratedLocalFixturePassed,
      workerRuntimeAllowsFuturePayloadShapeValidation:
        acceptance.decision.workerRuntimeAllowsFuturePayloadShapeValidation,
      workerRuntimeAllowsDispatch: acceptance.decision.workerRuntimeAllowsDispatch,
      globalGoForSUPABASE_SOUND_4: acceptance.decision.globalGoForSUPABASE_SOUND_4,
      workersDispatched: acceptance.execution.workersDispatched,
      jobsCreated: acceptance.execution.jobsCreated,
      jobEventsCreated: acceptance.execution.jobEventsCreated,
      recommendedImmediateNextPrompt: acceptance.recommendedImmediateNextPrompt,
    },
    null,
    2,
  ),
)
