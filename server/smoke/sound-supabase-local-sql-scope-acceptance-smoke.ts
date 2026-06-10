import { existsSync, readFileSync } from 'node:fs'

import { BILLING_SOUND_FIXTURE_CREDIT_PLACEHOLDER_ACCEPTANCE } from '../../src/backend/mock/mock-billing-sound-fixture-credit-placeholder-acceptance'
import { OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE } from '../../src/backend/mock/mock-observability-sound-fixture-evidence-acceptance'
import { PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE } from '../../src/backend/mock/mock-provider-gateway-sound-fixture-boundary-acceptance'
import { SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE } from '../../src/backend/mock/mock-sound-supabase-local-sql-scope-acceptance'
import { SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION } from '../../src/backend/mock/mock-supabase-sound-local-sql-supabase-owner-decision'
import { TRACK_A_SOUND_FINAL_COMPOSITION_HANDOFF_ACCEPTANCE } from '../../src/backend/mock/mock-track-a-sound-final-composition-handoff-acceptance'
import { TRACK_B_SOUND_MEDIA_PROCESSING_HANDOFF_ACCEPTANCE } from '../../src/backend/mock/mock-track-b-sound-media-processing-handoff-acceptance'
import { WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE } from '../../src/backend/mock/mock-worker-runtime-sound-audio-fixture-payload-acceptance'

const soundScopeDocPath = 'docs/sound-supabase-local-sql-scope-acceptance.md'
const trackBDocPath = 'docs/track-b-sound-media-processing-handoff-audit.md'
const trackADocPath = 'docs/track-a-sound-final-composition-handoff-audit.md'
const billingDocPath = 'docs/billing-sound-fixture-credit-placeholder-audit.md'
const observabilityDocPath = 'docs/observability-sound-fixture-evidence-audit.md'
const providerGatewayDocPath = 'docs/provider-gateway-sound-fixture-boundary-audit.md'
const workerRuntimeDocPath = 'docs/worker-runtime-sound-audio-fixture-payload-acceptance-audit.md'
const supabaseDecisionDocPath = 'docs/supabase-sound-local-sql-validation-supabase-owner-decision.md'
const soundFixturePlanPath = 'docs/sound-music-audio-generated-local-fixture-plan.md'
const soundOwnerChecklistPath = 'docs/sound-music-audio-owner-acceptance-checklist.md'
const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:sound-supabase-local-sql-scope-acceptance'
const scriptCommand = 'tsx server/smoke/sound-supabase-local-sql-scope-acceptance-smoke.ts'
const recommendedImmediateNextPrompt =
  'SUPABASE-SOUND-3E: final owner evidence rollup for SUPABASE-SOUND-4 go/no-go, no execution'

const requiredOwners = [
  'SOUND_MUSIC_AUDIO',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'WORKER_RUNTIME_JOBS',
  'PROVIDER_GATEWAY_MODELS',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
] as const

const requiredScopeAreas = [
  'structured_findings',
  'edit_intents',
  'approved_snapshot',
  'timing_aware_cue_manifest',
  'private_audio_artifact_manifest',
  'fixture_spec',
  'checksum_private_path_expectation',
  'source_of_truth_path',
  'lyria_boundary',
  'sfx_foley_ambience_provider_boundary',
  'supabase_local_sql_validation_scope',
  'worker_runtime_payload_shape_validation_scope',
  'provider_gateway_no_provider_fixture_scope',
  'observability_metadata_only_evidence_scope',
  'billing_no_spend_placeholder_scope',
  'track_a_metadata_only_handoff_scope',
  'track_b_metadata_only_handoff_scope',
  'generated_local_fixture_passed_claim',
] as const

const requiredScopeAreaDocText: Record<(typeof requiredScopeAreas)[number], string> = {
  structured_findings: 'structured findings',
  edit_intents: 'edit intents',
  approved_snapshot: 'approved snapshot',
  timing_aware_cue_manifest: 'timing-aware cue manifest',
  private_audio_artifact_manifest: 'private audio artifact manifest',
  fixture_spec: 'fixture spec',
  checksum_private_path_expectation: 'checksum/private path expectation',
  source_of_truth_path: 'source-of-truth path',
  lyria_boundary: 'Lyria boundary',
  sfx_foley_ambience_provider_boundary: 'SFX/foley/ambience provider boundary',
  supabase_local_sql_validation_scope: 'Supabase local SQL validation scope',
  worker_runtime_payload_shape_validation_scope: 'Worker Runtime payload-shape validation scope',
  provider_gateway_no_provider_fixture_scope: 'Provider Gateway no-provider fixture scope',
  observability_metadata_only_evidence_scope: 'Observability metadata-only evidence scope',
  billing_no_spend_placeholder_scope: 'Billing no-spend placeholder scope',
  track_a_metadata_only_handoff_scope: 'Track A metadata-only handoff scope',
  track_b_metadata_only_handoff_scope: 'Track B metadata-only handoff scope',
  generated_local_fixture_passed_claim: 'generated_local_fixture_passed claim',
}

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
  check(!lower.includes('providercredential'), `${label} must not contain provider credential markers.`)
  check(!lower.includes('service_role_key'), `${label} must not contain service-role key fields.`)
  check(!lower.includes('service-role key value'), `${label} must not contain service-role key values.`)
  check(!lower.includes('secret_value'), `${label} must not contain secret value fields.`)
  check(!lower.includes('api_key'), `${label} must not contain API key fields.`)
  check(!lower.includes('raw_prompt'), `${label} must not contain raw prompt fields.`)
  check(!lower.includes('raw_worker_prompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('sqlpayload'), `${label} must not contain SQL payload markers.`)
  check(!lower.includes('workerexecutionpayload'), `${label} must not contain worker execution payload markers.`)
  check(!lower.includes('rowscreated: true'), `${label} must not contain row mutation markers.`)
  check(!lower.includes('sqlexecuted: true'), `${label} must not contain SQL execution markers.`)
  check(!lower.includes('supabasemutationperformed: true'), `${label} must not contain mutation markers.`)
  check(!lower.includes('migrationdeployed: true'), `${label} must not contain migration deploy markers.`)
  check(!/akia[0-9a-z]{12,}/i.test(source), `${label} must not contain access key shapes.`)
  check(!/sk-[a-z0-9_-]{12,}/i.test(source), `${label} must not contain provider credential shapes.`)
}

function assertNoConcreteSecretsOrUrls(source: string, label: string): void {
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
  check(!lower.includes('providercredential'), `${label} must not contain provider credential markers.`)
  check(!lower.includes('service_role_key'), `${label} must not contain service-role key fields.`)
  check(!lower.includes('service-role key value'), `${label} must not contain service-role key values.`)
  check(!lower.includes('secret_value'), `${label} must not contain secret value fields.`)
  check(!lower.includes('api_key'), `${label} must not contain API key fields.`)
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

check(existsSync(soundScopeDocPath), 'SOUND Supabase scope acceptance document must exist.')
check(existsSync(trackBDocPath), 'Track B media processing handoff audit document must exist.')
check(existsSync(trackADocPath), 'Track A final composition handoff audit document must exist.')
check(existsSync(billingDocPath), 'Billing fixture credit placeholder audit document must exist.')
check(existsSync(observabilityDocPath), 'Observability fixture evidence audit document must exist.')
check(existsSync(providerGatewayDocPath), 'Provider Gateway boundary audit document must exist.')
check(existsSync(workerRuntimeDocPath), 'Worker Runtime audit document must exist.')
check(existsSync(supabaseDecisionDocPath), 'Supabase owner decision document must exist.')
check(existsSync(soundFixturePlanPath), 'SOUND generated/local fixture plan must exist.')
check(existsSync(soundOwnerChecklistPath), 'SOUND owner checklist must exist.')
check(existsSync(draftMigrationPath), 'SUPABASE-SOUND draft migration file must exist.')
check(existsSync(draftTestPath), 'SUPABASE-SOUND draft test file must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const soundScopeDoc = readFileSync(soundScopeDocPath, 'utf8')
const trackBDoc = readFileSync(trackBDocPath, 'utf8')
const trackADoc = readFileSync(trackADocPath, 'utf8')
const billingDoc = readFileSync(billingDocPath, 'utf8')
const observabilityDoc = readFileSync(observabilityDocPath, 'utf8')
const providerGatewayDoc = readFileSync(providerGatewayDocPath, 'utf8')
const workerRuntimeDoc = readFileSync(workerRuntimeDocPath, 'utf8')
const supabaseDecisionDoc = readFileSync(supabaseDecisionDocPath, 'utf8')
const soundFixturePlan = readFileSync(soundFixturePlanPath, 'utf8')
const soundOwnerChecklist = readFileSync(soundOwnerChecklistPath, 'utf8')
const draftMigration = readFileSync(draftMigrationPath, 'utf8')
const draftTests = readFileSync(draftTestPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# SOUND-SUPABASE-ACCEPT-0 SOUND Scope Acceptance for Local SQL Validation',
  'Workstream owner: SOUND_MUSIC_AUDIO.',
  'Current SOUND stage: dry_run_passed.',
  'Target future stage: generated_local_fixture_passed.',
  'Decision: conditional_sound_scope_acceptance_for_local_sql_validation.',
  'This document is SOUND scope acceptance audit only.',
  'This document does not execute SQL.',
  'This document does not mutate Supabase.',
  'This document does not unlock generated_local_fixture_passed.',
  'SUPABASE-SOUND-4 remains globally blocked until a final owner evidence rollup',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Public URLs are blocked.',
  'Public artifacts are blocked.',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'Raw prompt execution is blocked.',
  'soundDecision: conditional_sound_scope_acceptance_for_local_sql_validation.',
  'soundAcceptsLocalSqlValidationScope: true.',
  'soundAllowsFinalOwnerEvidenceRollup: true.',
  'soundAllowsSUPABASE_SOUND_4ExecutionNow: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
  '## Accepted by SOUND_MUSIC_AUDIO',
  'local SQL validation scope is draft fixture record validation only;',
  'structured agent findings must be represented;',
  'edit intents must be represented;',
  'approved plan snapshot reference is required;',
  'timing-aware cue manifest reference is required;',
  'private audio artifact manifest reference is required;',
  'checksum and private path expectations are required;',
  'Lyria is music/song/soundtrack planning metadata only;',
  'Lyria is not an SFX, foley, whoosh, hit, riser, ambience, room-tone, cleanup, or media-processing provider;',
  'SFX, foley, ambience, and everyday soundscape fixture scope remains no-provider metadata only;',
  '## Rejected / still blocked by SOUND_MUSIC_AUDIO',
  'generated_local_fixture_passed claim;',
  'SUPABASE-SOUND-4 execution now;',
  'SQL execution;',
  'Supabase mutation;',
  'provider calls, requests, webhooks, fallbacks, secrets, model downloads, or inference;',
  'worker dispatch, job creation, job events, runtime configs, claims, or leases;',
  'FFmpeg execution;',
  'ffprobe execution;',
  'render, mux, export, final delivery, staging, beta, external beta, production, or paid production unlock;',
  '## SOUND scope readiness table',
  '## Cross-owner status after SOUND decision',
  '## Go / no-go for SUPABASE-SOUND-4',
  'soundAllowsFinalOwnerEvidenceRollup: true.',
  'soundAllowsSUPABASE_SOUND_4ExecutionNow: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
  '## Runtime/provider/gate behavior',
  'SQL execution: false.',
  'Supabase mutation: false.',
  'provider calls: false.',
  'worker dispatch: false.',
  'generated audio creation: false.',
  'generated asset creation: false.',
  'media processing: false.',
  '## Supabase update classification',
  'Supabase update required: no.',
  'Supabase environment touched: none.',
  'SQL executed: no.',
  'Migration deployed: no.',
  '## Recommendation',
  recommendedImmediateNextPrompt,
]) {
  requireText(soundScopeDoc, required, `SOUND scope doc must include ${required}.`)
}

for (const area of requiredScopeAreas) {
  requireText(soundScopeDoc, requiredScopeAreaDocText[area], `Scope table must include ${area}.`)
  check(
    SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.scopeReadiness.some((entry) => entry.area === area),
    `Spec scope readiness must include ${area}.`,
  )
}

for (const owner of requiredOwners) {
  const section = ownerSection(soundScopeDoc, owner)
  requireText(section, `owner: ${owner}.`, `${owner} section must include owner field.`)
  requireText(section, 'status: accepted_conditionally.', `${owner} section must be accepted conditionally.`)
  requireText(section, 'evidence:', `${owner} section must include evidence.`)
  requireText(section, 'missingEvidence:', `${owner} section must include missing evidence.`)
  check(
    SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.crossOwnerStatus.some(
      (entry) => entry.owner === owner && entry.status === 'accepted_conditionally',
    ),
    `Spec cross-owner status must accept ${owner} conditionally.`,
  )
}

for (const priorRequired of [
  '# TRACK-B-SOUND-0 Audio Fixture Media Processing Handoff Audit',
  'Decision: conditional_track_b_acceptance_for_metadata_only_media_processing_handoff',
  'SUPABASE-SOUND-4 remains globally blocked because SOUND scope acceptance is still not explicitly complete.',
  'SOUND-SUPABASE-ACCEPT-0: SOUND scope acceptance for local SQL validation, no execution',
]) {
  requireText(trackBDoc, priorRequired, `Track B doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# TRACK-A-SOUND-0 Audio Fixture Final Composition Handoff Audit',
  'trackAAllowsRender: false.',
  'trackAAllowsExport: false.',
]) {
  requireText(trackADoc, priorRequired, `Track A doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# BILLING-SOUND-0 Fixture Credit Placeholder Acceptance Audit',
  'billingAllowsSpend: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
]) {
  requireText(billingDoc, priorRequired, `Billing doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# OBSERVABILITY-SOUND-0 QA / Audit / Cost Fixture Evidence Audit',
  'observabilityAllowsPersistedEvidenceRows: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
]) {
  requireText(observabilityDoc, priorRequired, `Observability doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# PROVIDER-GATEWAY-SOUND-0 Provider / License Fixture Boundary Audit',
  'providerGatewayAllowsNoProviderLocalFixture: true.',
  'providerGatewayAllowsProviderCalls: false.',
]) {
  requireText(providerGatewayDoc, priorRequired, `Provider Gateway doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# WORKER-RUNTIME-SOUND-0 Audio Fixture Payload Acceptance Audit',
  'workerRuntimeAllowsFuturePayloadShapeValidation: true.',
  'workerRuntimeAllowsDispatch: false.',
]) {
  requireText(workerRuntimeDoc, priorRequired, `Worker Runtime doc must still include ${priorRequired}.`)
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
  'claim generated_local_fixture_passed',
]) {
  requireText(soundFixturePlan, priorRequired, `SOUND fixture plan must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SOUND_MUSIC_AUDIO Owner Acceptance Checklist',
  'handoff-only',
  'This checklist does not claim generated_local_fixture_passed.',
]) {
  requireText(soundOwnerChecklist, priorRequired, `SOUND owner checklist must still include ${priorRequired}.`)
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
]) {
  requireText(draftTests, draftTestRequired, `Draft tests must still include ${draftTestRequired}.`)
}

check(
  packageJson.scripts?.[scriptName] === scriptCommand,
  `${scriptName} package script must equal ${scriptCommand}.`,
)

check(SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.workstream === 'SOUND_MUSIC_AUDIO', 'Spec owner must be SOUND.')
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.mode === 'sound_scope_acceptance_audit_only',
  'Spec mode must be scope acceptance only.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.currentUnlockStage === 'dry_run_passed',
  'Current stage must be dry_run_passed.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Target stage must be generated_local_fixture_passed.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.claimsGeneratedLocalFixturePassed === false,
  'Spec must not claim generated_local_fixture_passed.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.decision.soundDecision ===
    'conditional_sound_scope_acceptance_for_local_sql_validation',
  'SOUND decision must be conditional scope acceptance.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.decision.soundAcceptsLocalSqlValidationScope === true,
  'SOUND must accept local SQL validation scope.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.decision.soundAllowsFinalOwnerEvidenceRollup === true,
  'SOUND must allow final owner evidence rollup.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.decision.soundAllowsSUPABASE_SOUND_4ExecutionNow === false,
  'SOUND must not allow SUPABASE-SOUND-4 execution now.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.decision.globalGoForSUPABASE_SOUND_4 === false,
  'Global SUPABASE-SOUND-4 go must remain false.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt,
  'Recommended next prompt must be exact.',
)

assertAllExecutionFlagsFalse(SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.execution, 'soundScope.execution')

check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.sourceOfTruthPath.requiresSupabaseRow === true,
  'Source-of-truth path must require a Supabase row.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.sourceOfTruthPath.requiresPrivateGcsPath === true,
  'Source-of-truth path must require a private GCS path.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.sourceOfTruthPath.requiresManifest === true,
  'Source-of-truth path must require a manifest.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.sourceOfTruthPath.requiresChecksum === true,
  'Source-of-truth path must require a checksum.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.sourceOfTruthPath.requiresApprovedPlanSnapshot === true,
  'Source-of-truth path must require an approved plan snapshot.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false,
  'Signed URLs must not be source of truth.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.sourceOfTruthPath.publicUrlsAllowed === false,
  'Public URLs must remain blocked.',
)

check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.rawPromptRule.rawPromptDirectExecutionAllowed === false,
  'Raw prompt direct execution must be blocked.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.rawPromptRule.requiresStructuredAgentFindings === true,
  'Structured agent findings must be required.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.rawPromptRule.requiresEditIntents === true,
  'Edit intents must be required.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.rawPromptRule.requiresApprovedPlanSnapshot === true,
  'Approved plan snapshots must be required.',
)

check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.lyriaBoundary.musicSongSoundtrackPlanningOnly === true,
  'Lyria must be music/song/soundtrack planning only.',
)
check(SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.lyriaBoundary.sfxAllowed === false, 'Lyria SFX must be blocked.')
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.lyriaBoundary.foleyAllowed === false,
  'Lyria foley must be blocked.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.lyriaBoundary.ambienceAllowed === false,
  'Lyria ambience must be blocked.',
)
check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.lyriaBoundary.generationAllowed === false,
  'Lyria generation must be blocked.',
)

for (const entry of SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.scopeReadiness) {
  check(entry.executionAllowedNow === false, `${entry.area} execution must be blocked.`)
}

check(
  SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.scopeReadiness.find(
    (entry) => entry.area === 'generated_local_fixture_passed_claim',
  )?.soundAcceptsLocalSqlValidationScope === false,
  'SOUND must not accept generated_local_fixture_passed as current scope.',
)

assertAllExecutionFlagsFalse(TRACK_B_SOUND_MEDIA_PROCESSING_HANDOFF_ACCEPTANCE.execution, 'trackB.execution')
assertAllExecutionFlagsFalse(TRACK_A_SOUND_FINAL_COMPOSITION_HANDOFF_ACCEPTANCE.execution, 'trackA.execution')
assertAllExecutionFlagsFalse(BILLING_SOUND_FIXTURE_CREDIT_PLACEHOLDER_ACCEPTANCE.execution, 'billing.execution')
assertAllExecutionFlagsFalse(OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE.execution, 'observability.execution')
assertAllExecutionFlagsFalse(PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE.execution, 'providerGateway.execution')
assertAllExecutionFlagsFalse(WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE.execution, 'workerRuntime.execution')
assertAllExecutionFlagsFalse(SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION.execution, 'supabaseDecision.execution')

for (const [label, source] of Object.entries({
  soundScopeDoc,
  trackBDoc,
  trackADoc,
  billingDoc,
  observabilityDoc,
  providerGatewayDoc,
  workerRuntimeDoc,
  supabaseDecisionDoc,
  soundFixturePlan,
  soundOwnerChecklist,
})) {
  assertNoConcreteForbiddenText(source, label)
}

assertNoConcreteSecretsOrUrls(draftMigration, 'draftMigration')
assertNoConcreteSecretsOrUrls(draftTests, 'draftTests')

scanForbiddenValues(SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE, 'SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE')

console.log(JSON.stringify({
  ok: true,
  workstream: SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.workstream,
  smoke: 'sound-supabase-local-sql-scope-acceptance',
  mode: SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.mode,
  claimsGeneratedLocalFixturePassed:
    SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.claimsGeneratedLocalFixturePassed,
  soundAcceptsLocalSqlValidationScope:
    SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.decision.soundAcceptsLocalSqlValidationScope,
  soundAllowsFinalOwnerEvidenceRollup:
    SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.decision.soundAllowsFinalOwnerEvidenceRollup,
  soundAllowsSUPABASE_SOUND_4ExecutionNow:
    SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.decision.soundAllowsSUPABASE_SOUND_4ExecutionNow,
  globalGoForSUPABASE_SOUND_4:
    SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.decision.globalGoForSUPABASE_SOUND_4,
  sqlExecuted: SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.execution.sqlExecuted,
  supabaseMutationPerformed:
    SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.execution.supabaseMutationPerformed,
  providerCallsMade: SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.execution.providerCallsMade,
  workersDispatched: SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.execution.workersDispatched,
  recommendedImmediateNextPrompt:
    SOUND_SUPABASE_LOCAL_SQL_SCOPE_ACCEPTANCE.recommendedImmediateNextPrompt,
}))
