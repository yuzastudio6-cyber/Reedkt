import { existsSync, readFileSync } from 'node:fs'

import { PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE } from '../../src/backend/mock/mock-provider-gateway-sound-fixture-boundary-acceptance'
import { SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION } from '../../src/backend/mock/mock-supabase-sound-local-sql-supabase-owner-decision'
import { WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE } from '../../src/backend/mock/mock-worker-runtime-sound-audio-fixture-payload-acceptance'

const auditDocPath = 'docs/provider-gateway-sound-fixture-boundary-audit.md'
const workerRuntimeAuditDocPath = 'docs/worker-runtime-sound-audio-fixture-payload-acceptance-audit.md'
const supabaseDecisionDocPath = 'docs/supabase-sound-local-sql-validation-supabase-owner-decision.md'
const soundFixturePlanPath = 'docs/sound-music-audio-generated-local-fixture-plan.md'
const soundOwnerChecklistPath = 'docs/sound-music-audio-owner-acceptance-checklist.md'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:provider-gateway-sound-fixture-boundary-acceptance'
const scriptCommand = 'tsx server/smoke/provider-gateway-sound-fixture-boundary-acceptance-smoke.ts'
const recommendedImmediateNextPrompt = 'OBSERVABILITY-SOUND-0: QA/audit/cost fixture evidence audit'

const requiredOwners = [
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'SOUND_MUSIC_AUDIO',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
] as const

const requiredProviderNames = [
  'Google Lyria',
  'Lyria Pro',
  'Lyria 3 Pro',
  'Lyria 3 Clip',
  'Mirelo SFX',
  'MMAudio',
  'Dasheng-AudioGen',
  'Stable Audio Open',
  'Stable Audio 3 Small SFX',
  'OpenMOSS MOSS-SoundEffect',
  'Meta AudioGen / AudioCraft',
  'Woosh',
  'TangoFlux',
  'ElevenLabs',
  'AudioFlux',
  'Signalsmith Stretch',
  'DeepFilterNet',
  'RNNoise',
  'Demucs',
  'FFmpeg',
  'ffprobe',
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
  check(!lower.includes('raw_provider_prompt'), `${label} must not contain raw provider prompt fields.`)
  check(!lower.includes('rawproviderprompt'), `${label} must not contain raw provider prompt fields.`)
  check(!lower.includes('raw_worker_prompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('rawworkerprompt'), `${label} must not contain raw worker prompt fields.`)
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

check(existsSync(auditDocPath), 'Provider Gateway boundary audit document must exist.')
check(existsSync(workerRuntimeAuditDocPath), 'Worker Runtime audit document must exist.')
check(existsSync(supabaseDecisionDocPath), 'Supabase owner decision document must exist.')
check(existsSync(soundFixturePlanPath), 'SOUND generated/local fixture plan must exist.')
check(existsSync(soundOwnerChecklistPath), 'SOUND owner checklist must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const auditDoc = readFileSync(auditDocPath, 'utf8')
const workerRuntimeAuditDoc = readFileSync(workerRuntimeAuditDocPath, 'utf8')
const supabaseDecisionDoc = readFileSync(supabaseDecisionDocPath, 'utf8')
const soundFixturePlan = readFileSync(soundFixturePlanPath, 'utf8')
const soundOwnerChecklist = readFileSync(soundOwnerChecklistPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# PROVIDER-GATEWAY-SOUND-0 Provider / License Fixture Boundary Audit',
  'Workstream owner: PROVIDER_GATEWAY_MODELS.',
  'Requesting workstream: SOUND_MUSIC_AUDIO.',
  'Related source workstreams: SUPABASE_RLS_STORAGE_DATABASE and WORKER_RUNTIME_JOBS.',
  'Current SOUND stage: dry_run_passed.',
  'Target future stage: generated_local_fixture_passed.',
  'Decision: conditional_provider_gateway_acceptance_for_no_provider_local_fixture.',
  'This document does not call providers',
  'create provider requests',
  'create provider webhooks',
  'execute provider fallbacks',
  'read secrets',
  'download models',
  'run model inference',
  'create generated outputs',
  'dispatch workers',
  'mutate Supabase',
  'execute SQL',
  'unlock generated_local_fixture_passed.',
  'SUPABASE-SOUND-4 remains globally blocked because cross-owner approvals are incomplete.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Public URLs are blocked.',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'Raw prompt provider execution is blocked.',
  'Raw prompt worker execution is blocked.',
  'providerGatewayAllowsNoProviderLocalFixture: true.',
  'providerGatewayAllowsProviderCalls: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
  '## Accepted by Provider Gateway',
  '## Rejected / still blocked by Provider Gateway',
  '## Provider / model readiness table',
  '## Lyria boundary',
  'Lyria must not be presented or routed as an SFX, foley, whoosh, hit, riser, ambience, room-tone, cleanup, or general media-processing provider.',
  'Lyria generation remains disabled.',
  '## SFX / ambience provider boundary',
  'SFX and ambience fixture planning must not create provider requests, webhooks, fallbacks, model downloads, generated audio, storage writes, or public artifacts.',
  '## Secret policy',
  'Provider secrets must not appear in repo files, browser code, database rows, logs, prompts, payloads, manifests, or smoke output.',
  'The no-provider local fixture path must not read Secret Manager and must not include secret values.',
  '## Future provider route contract requirements',
  'providerPolicyRef.',
  'providerModelRef.',
  'approved snapshot reference.',
  'generation request reference.',
  'credit gate reference.',
  'worker runtime gate reference.',
  'raw prompt execution blocked.',
  '## Required before PROVIDER-GATEWAY-SOUND-1',
  'provider and license readiness table approved.',
  'Lyria music/song/soundtrack-only boundary approved.',
  'SFX and ambience provider boundary approved.',
  'Secret Manager reference-name policy approved.',
  'provider route contract draft approved.',
  'fallback disabled or controlled-fallback policy approved.',
  'cost/error/audit handoff accepted.',
  'no-provider local fixture validation accepted.',
  '## Cross-owner status after Provider Gateway decision',
  '## Go / no-go for SUPABASE-SOUND-4',
  'globalGoForSUPABASE_SOUND_4 remains false.',
  '## Runtime / provider / gate behavior',
  'provider calls: false.',
  'provider requests: false.',
  'provider webhooks: false.',
  'provider fallback execution: false.',
  'provider secrets accessed: false.',
  'Secret Manager reads: false.',
  'model downloads: false.',
  'model inference: false.',
  'generated outputs: false.',
  'worker dispatch: false.',
  'Supabase mutation: false.',
  'SQL execution: false.',
  'signed URL creation: false.',
  'public artifact creation: false.',
  'credit or approval record creation: false.',
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

for (const providerName of requiredProviderNames) {
  requireText(auditDoc, providerName, `Audit doc provider table must include ${providerName}.`)
}

for (const owner of requiredOwners) {
  const section = ownerSection(auditDoc, owner)
  requireText(section, `owner: ${owner}.`, `${owner} section must include owner field.`)
  requireText(section, 'status:', `${owner} section must include status.`)
  requireText(section, 'evidence:', `${owner} section must include evidence.`)
  requireText(section, 'missingEvidence:', `${owner} section must include missing evidence.`)
}

for (const owner of [
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
] as const) {
  requireText(ownerSection(auditDoc, owner), 'status: accepted_conditionally.', `${owner} must be accepted conditionally.`)
}

for (const owner of requiredOwners.filter((owner) => (
  owner !== 'PROVIDER_GATEWAY_MODELS'
  && owner !== 'WORKER_RUNTIME_JOBS'
  && owner !== 'SUPABASE_RLS_STORAGE_DATABASE'
))) {
  requireText(ownerSection(auditDoc, owner), 'status: missing.', `${owner} must remain missing.`)
}

for (const priorRequired of [
  '# WORKER-RUNTIME-SOUND-0 Audio Fixture Payload Acceptance Audit',
  'workerRuntimeDecision: conditional_worker_runtime_acceptance_for_future_payload_shape_validation.',
  'workerRuntimeAllowsDispatch: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
  'PROVIDER-GATEWAY-SOUND-0: provider/license fixture boundary audit',
]) {
  requireText(workerRuntimeAuditDoc, priorRequired, `Worker Runtime audit doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SUPABASE-SOUND-3D Supabase Owner Decision for Local SQL Validation',
  'supabaseOwnerAllowsFutureLocalValidation: true.',
  'globalGoForSUPABASE_SOUND_4: false.',
]) {
  requireText(supabaseDecisionDoc, priorRequired, `Supabase decision doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SOUND_MUSIC_AUDIO Generated/Local Fixture Plan',
  'Current unlock stage: dry_run_passed.',
  'it does not create a fixture artifact, execute media processing, mutate storage, or claim generated_local_fixture_passed.',
]) {
  requireText(soundFixturePlan, priorRequired, `SOUND fixture plan must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SOUND_MUSIC_AUDIO Owner Acceptance Checklist',
  'Acceptance status: not_accepted_for_execution',
  'SUPABASE-SOUND-1: Supabase mutation plan for local fixture records, no execution',
]) {
  requireText(soundOwnerChecklist, priorRequired, `SOUND owner checklist must still include ${priorRequired}.`)
}

const spec = PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE

check(spec.workstream === 'PROVIDER_GATEWAY_MODELS', 'Spec workstream must be Provider Gateway.')
check(spec.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Spec requesting workstream must be SOUND.')
check(
  spec.relatedSourceWorkstreams.includes('SUPABASE_RLS_STORAGE_DATABASE')
    && spec.relatedSourceWorkstreams.includes('WORKER_RUNTIME_JOBS'),
  'Spec must include Supabase and Worker Runtime related sources.',
)
check(spec.mode === 'provider_gateway_fixture_boundary_audit_only', 'Spec mode must be audit only.')
check(spec.currentUnlockStage === 'dry_run_passed', 'Spec current stage must be dry_run_passed.')
check(
  spec.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Spec target stage must be generated_local_fixture_passed.',
)
check(spec.claimsGeneratedLocalFixturePassed === false, 'Spec must not claim generated_local_fixture_passed.')
check(
  spec.decision.providerGatewayDecision === 'conditional_provider_gateway_acceptance_for_no_provider_local_fixture',
  'Provider Gateway decision must be conditional no-provider acceptance.',
)
check(
  spec.decision.providerGatewayAllowsNoProviderLocalFixture === true,
  'Provider Gateway must allow future no-provider local fixture metadata/spec validation.',
)
check(
  spec.decision.providerGatewayAllowsProviderCalls === false,
  'Provider Gateway must not allow provider calls.',
)
check(spec.decision.globalGoForSUPABASE_SOUND_4 === false, 'Global go must remain false.')
check(spec.decision.reasonGlobalGoBlocked.length > 0, 'Global go block reasons must be present.')
assertAllExecutionFlagsFalse(spec.execution, 'providerGatewaySpec.execution')
check(spec.acceptedConditions.length > 0, 'Accepted conditions must exist.')
check(spec.rejectedOrStillBlocked.length > 0, 'Rejected/still blocked uses must exist.')

for (const providerName of requiredProviderNames) {
  const row = spec.providerReadiness.find((entry) => entry.name === providerName)
  check(Boolean(row), `Spec provider readiness must include ${providerName}.`)
  check(row?.providerCallsAllowed === false, `${providerName} must not allow provider calls.`)
  check(row?.modelDownloadAllowed === false, `${providerName} must not allow model downloads.`)
  check(row?.modelInferenceAllowed === false, `${providerName} must not allow model inference.`)
  check(row?.generatedOutputsAllowed === false, `${providerName} must not allow generated outputs.`)
}

for (const row of spec.providerReadiness) {
  if (row.name.includes('Lyria')) {
    check(row.allowedCueFamilies.includes('music_cue'), `${row.name} must include music cues.`)
    check(row.allowedCueFamilies.includes('soundtrack_layer'), `${row.name} must include soundtrack layers.`)
    check(row.allowedCueFamilies.includes('audio_mood_design'), `${row.name} must include mood design.`)
    check(!row.allowedCueFamilies.includes('action_foley_sfx'), `${row.name} must not include SFX.`)
    check(!row.allowedCueFamilies.includes('ambient_everyday_soundscape'), `${row.name} must not include ambience.`)
    check(!row.allowedCueFamilies.includes('whoosh_hit_riser'), `${row.name} must not include whoosh/hit/riser cues.`)
  }
}

check(spec.lyriaBoundary.musicSongSoundtrackPlanningOnly === true, 'Lyria must be music/song/soundtrack only.')
check(spec.lyriaBoundary.sfxAllowed === false, 'Lyria SFX must be blocked.')
check(spec.lyriaBoundary.foleyAllowed === false, 'Lyria foley must be blocked.')
check(spec.lyriaBoundary.whooshHitRiserAllowed === false, 'Lyria whoosh/hit/riser must be blocked.')
check(spec.lyriaBoundary.ambienceAllowed === false, 'Lyria ambience must be blocked.')
check(spec.lyriaBoundary.roomToneAllowed === false, 'Lyria room tone must be blocked.')
check(spec.lyriaBoundary.generationAllowed === false, 'Lyria generation must be blocked.')
check(
  spec.lyriaBoundary.realGoogleTransportOwner === 'PROVIDER_GATEWAY_MODELS',
  'Real Google transport must belong to Provider Gateway.',
)

check(spec.sfxAmbientBoundary.metadataOnly === true, 'SFX/ambient boundary must be metadata only.')
check(spec.sfxAmbientBoundary.providerExecutionAllowed === false, 'SFX/ambient provider execution must be false.')
check(spec.sfxAmbientBoundary.generatedAudioAllowed === false, 'SFX/ambient generated audio must be false.')
check(spec.sfxAmbientBoundary.modelDownloadAllowed === false, 'SFX/ambient model download must be false.')
check(spec.sfxAmbientBoundary.fallbackExecutionAllowed === false, 'SFX/ambient fallback execution must be false.')

check(spec.secretPolicy.providerSecretsInRepoAllowed === false, 'Provider secrets in repo must be blocked.')
check(spec.secretPolicy.providerSecretsInFrontendAllowed === false, 'Provider secrets in frontend must be blocked.')
check(spec.secretPolicy.providerSecretsInDatabaseRowsAllowed === false, 'Provider secrets in database rows must be blocked.')
check(spec.secretPolicy.providerSecretsInLogsAllowed === false, 'Provider secrets in logs must be blocked.')
check(spec.secretPolicy.providerSecretsInPromptsAllowed === false, 'Provider secrets in prompts must be blocked.')
check(spec.secretPolicy.providerSecretsInPayloadsAllowed === false, 'Provider secrets in payloads must be blocked.')
check(
  spec.secretPolicy.secretManagerReadAllowedForLocalFixture === false,
  'Secret Manager reads must be blocked for local fixture.',
)
check(spec.secretPolicy.secretValuesInManifestsAllowed === false, 'Secret values in manifests must be blocked.')

check(
  spec.requiredBeforePROVIDER_GATEWAY_SOUND_1.length >= 8,
  'Required before PROVIDER-GATEWAY-SOUND-1 list must be populated.',
)
check(spec.sourceOfTruthPath.requiresSupabaseRow === true, 'Source path must require Supabase row.')
check(spec.sourceOfTruthPath.requiresPrivateGcsPath === true, 'Source path must require private GCS path.')
check(spec.sourceOfTruthPath.requiresManifest === true, 'Source path must require manifest.')
check(spec.sourceOfTruthPath.requiresChecksum === true, 'Source path must require checksum.')
check(
  spec.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source path must require approved plan snapshot.',
)
check(
  spec.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false,
  'Signed URLs must not be source of truth.',
)
check(spec.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must be blocked.')
check(
  spec.rawPromptRule.rawPromptDirectProviderExecutionAllowed === false,
  'Raw prompt direct provider execution must be blocked.',
)
check(
  spec.rawPromptRule.rawPromptDirectWorkerExecutionAllowed === false,
  'Raw prompt direct worker execution must be blocked.',
)
check(
  spec.rawPromptRule.requiresStructuredAgentFindings === true,
  'Raw prompt rule must require structured findings.',
)
check(spec.rawPromptRule.requiresEditIntents === true, 'Raw prompt rule must require edit intents.')
check(
  spec.rawPromptRule.requiresApprovedPlanSnapshot === true,
  'Raw prompt rule must require approved snapshots.',
)
check(spec.crossOwnerStatus.length === requiredOwners.length, 'Spec must include all owner statuses.')

for (const owner of requiredOwners) {
  const entry = spec.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(Boolean(entry), `Spec owner status missing: ${owner}.`)
  check((entry?.evidence.length ?? 0) > 0, `${owner} evidence must be present.`)
  check((entry?.missingEvidence.length ?? 0) > 0, `${owner} missing evidence must be present.`)
}

for (const owner of [
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
] as const) {
  const entry = spec.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(entry?.status === 'accepted_conditionally', `${owner} must be accepted conditionally in spec.`)
}

for (const owner of requiredOwners.filter((owner) => (
  owner !== 'PROVIDER_GATEWAY_MODELS'
  && owner !== 'WORKER_RUNTIME_JOBS'
  && owner !== 'SUPABASE_RLS_STORAGE_DATABASE'
))) {
  const entry = spec.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(entry?.status === 'missing', `${owner} must remain missing in spec.`)
}

check(
  spec.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Spec must recommend OBSERVABILITY-SOUND-0 next.',
)
check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  'package.json must include the Provider Gateway boundary smoke script.',
)

check(
  SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION.decision.supabaseOwnerAllowsFutureLocalValidation === true,
  'Supabase prior decision must still allow future local validation conditionally.',
)
check(
  SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION.decision.globalGoForSUPABASE_SOUND_4 === false,
  'Supabase prior decision must keep global go false.',
)
assertAllExecutionFlagsFalse(
  SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION.execution,
  'supabaseOwnerDecision.execution',
)
check(
  WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE.decision
    .workerRuntimeAllowsFuturePayloadShapeValidation === true,
  'Worker Runtime prior decision must allow future payload-shape validation conditionally.',
)
check(
  WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE.decision.workerRuntimeAllowsDispatch === false,
  'Worker Runtime prior decision must keep dispatch false.',
)
check(
  WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE.decision.globalGoForSUPABASE_SOUND_4 === false,
  'Worker Runtime prior decision must keep global go false.',
)
assertAllExecutionFlagsFalse(
  WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE.execution,
  'workerRuntimeAcceptance.execution',
)

assertNoConcreteForbiddenText(auditDoc, auditDocPath)
scanForbiddenValues(spec, 'PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE')

console.log(JSON.stringify({
  ok: true,
  workstream: spec.workstream,
  requestingWorkstream: spec.requestingWorkstream,
  mode: spec.mode,
  claimsGeneratedLocalFixturePassed: spec.claimsGeneratedLocalFixturePassed,
  providerGatewayAllowsNoProviderLocalFixture: spec.decision.providerGatewayAllowsNoProviderLocalFixture,
  providerGatewayAllowsProviderCalls: spec.decision.providerGatewayAllowsProviderCalls,
  globalGoForSUPABASE_SOUND_4: spec.decision.globalGoForSUPABASE_SOUND_4,
  providerCallsMade: spec.execution.providerCallsMade,
  providerRequestsCreated: spec.execution.providerRequestsCreated,
  providerWebhooksCreated: spec.execution.providerWebhooksCreated,
  modelsDownloaded: spec.execution.modelsDownloaded,
  modelInferenceRun: spec.execution.modelInferenceRun,
  generatedOutputsCreated: spec.execution.generatedOutputsCreated,
  recommendedImmediateNextPrompt: spec.recommendedImmediateNextPrompt,
}, null, 2))
