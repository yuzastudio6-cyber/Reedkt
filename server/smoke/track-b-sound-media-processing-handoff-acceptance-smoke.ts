import { existsSync, readFileSync } from 'node:fs'

import { BILLING_SOUND_FIXTURE_CREDIT_PLACEHOLDER_ACCEPTANCE } from '../../src/backend/mock/mock-billing-sound-fixture-credit-placeholder-acceptance'
import { OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE } from '../../src/backend/mock/mock-observability-sound-fixture-evidence-acceptance'
import { PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE } from '../../src/backend/mock/mock-provider-gateway-sound-fixture-boundary-acceptance'
import { SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION } from '../../src/backend/mock/mock-supabase-sound-local-sql-supabase-owner-decision'
import { TRACK_A_SOUND_FINAL_COMPOSITION_HANDOFF_ACCEPTANCE } from '../../src/backend/mock/mock-track-a-sound-final-composition-handoff-acceptance'
import { TRACK_B_SOUND_MEDIA_PROCESSING_HANDOFF_ACCEPTANCE } from '../../src/backend/mock/mock-track-b-sound-media-processing-handoff-acceptance'
import { WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE } from '../../src/backend/mock/mock-worker-runtime-sound-audio-fixture-payload-acceptance'

const trackBDocPath = 'docs/track-b-sound-media-processing-handoff-audit.md'
const trackADocPath = 'docs/track-a-sound-final-composition-handoff-audit.md'
const billingDocPath = 'docs/billing-sound-fixture-credit-placeholder-audit.md'
const observabilityDocPath = 'docs/observability-sound-fixture-evidence-audit.md'
const providerGatewayDocPath = 'docs/provider-gateway-sound-fixture-boundary-audit.md'
const workerRuntimeDocPath = 'docs/worker-runtime-sound-audio-fixture-payload-acceptance-audit.md'
const supabaseDecisionDocPath = 'docs/supabase-sound-local-sql-validation-supabase-owner-decision.md'
const soundFixturePlanPath = 'docs/sound-music-audio-generated-local-fixture-plan.md'
const soundOwnerChecklistPath = 'docs/sound-music-audio-owner-acceptance-checklist.md'
const realAudioExecutionPath = 'docs/production-real-audio-execution.md'
const audioArtifactPolicyPath = 'docs/production-audio-artifact-policy.md'
const audioQaPolicyPath = 'docs/production-audio-qa-policy.md'
const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:track-b-sound-media-processing-handoff-acceptance'
const scriptCommand = 'tsx server/smoke/track-b-sound-media-processing-handoff-acceptance-smoke.ts'
const recommendedImmediateNextPrompt =
  'SOUND-SUPABASE-ACCEPT-0: SOUND scope acceptance for local SQL validation, no execution'

const requiredOwners = [
  'TRACK_B_MEDIA_PROCESSING',
  'TRACK_A_RENDER_EXPORT',
  'BILLING_STRIPE_CREDITS',
  'OBSERVABILITY_AUDIT_COST',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'SOUND_MUSIC_AUDIO',
] as const

const acceptedOwners = [
  'TRACK_B_MEDIA_PROCESSING',
  'TRACK_A_RENDER_EXPORT',
  'BILLING_STRIPE_CREDITS',
  'OBSERVABILITY_AUDIT_COST',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
] as const

const missingOwners = ['SOUND_MUSIC_AUDIO'] as const

const requiredHandoffAreas = [
  'source_media_immutability',
  'timing_aware_cue_manifest',
  'private_audio_artifact_manifest',
  'approved_snapshot_reference',
  'fixture_spec_reference',
  'checksum_private_path_expectation',
  'qa_evidence_expectation',
  'speech_ducking_metadata',
  'music_over_voice_metadata',
  'sfx_timing_metadata',
  'loudness_expectation_metadata',
  'sync_timing_expectation_metadata',
  'audio_cleanup',
  'audio_separation',
  'audio_analysis',
  'ffmpeg_ffprobe',
  'deepfilternet_rnnoise_demucs',
  'processed_media_artifact',
  'generated_asset_row',
  'private_storage_row',
  'public_artifact',
  'signed_url',
  'track_a_final_mux_export',
] as const

const requiredHandoffAreaDocText: Record<(typeof requiredHandoffAreas)[number], string> = {
  source_media_immutability: 'source media immutability',
  timing_aware_cue_manifest: 'timing-aware cue manifest',
  private_audio_artifact_manifest: 'private audio artifact manifest',
  approved_snapshot_reference: 'approved snapshot reference',
  fixture_spec_reference: 'fixture spec reference',
  checksum_private_path_expectation: 'checksum/private path expectation',
  qa_evidence_expectation: 'QA evidence expectation',
  speech_ducking_metadata: 'speech/ducking metadata',
  music_over_voice_metadata: 'music-over-voice metadata',
  sfx_timing_metadata: 'SFX timing metadata',
  loudness_expectation_metadata: 'loudness expectation metadata',
  sync_timing_expectation_metadata: 'sync/timing expectation metadata',
  audio_cleanup: 'audio cleanup',
  audio_separation: 'audio separation',
  audio_analysis: 'audio analysis',
  ffmpeg_ffprobe: 'FFmpeg/ffprobe',
  deepfilternet_rnnoise_demucs: 'DeepFilterNet/RNNoise/Demucs',
  processed_media_artifact: 'processed media artifact',
  generated_asset_row: 'generated asset row',
  private_storage_row: 'private storage row',
  public_artifact: 'public artifact',
  signed_url: 'signed URL',
  track_a_final_mux_export: 'Track A final mux/export',
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
  check(!lower.includes('mediaprocessingpayload'), `${label} must not contain media processing payload markers.`)
  check(!lower.includes('processedmediaartifactcreated: true'), `${label} must not contain processed artifact creation markers.`)
  check(!lower.includes('rowscreated: true'), `${label} must not contain row mutation markers.`)
  check(!lower.includes('sqlexecuted: true'), `${label} must not contain SQL execution markers.`)
  check(!lower.includes('migrationdeployed: true'), `${label} must not contain migration deploy markers.`)
  check(!/akia[0-9a-z]{12,}/i.test(source), `${label} must not contain access key shapes.`)
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

check(existsSync(trackBDocPath), 'Track B media processing handoff audit document must exist.')
check(existsSync(trackADocPath), 'Track A final composition handoff audit document must exist.')
check(existsSync(billingDocPath), 'Billing fixture credit placeholder audit document must exist.')
check(existsSync(observabilityDocPath), 'Observability fixture evidence audit document must exist.')
check(existsSync(providerGatewayDocPath), 'Provider Gateway boundary audit document must exist.')
check(existsSync(workerRuntimeDocPath), 'Worker Runtime audit document must exist.')
check(existsSync(supabaseDecisionDocPath), 'Supabase owner decision document must exist.')
check(existsSync(soundFixturePlanPath), 'SOUND generated/local fixture plan must exist.')
check(existsSync(soundOwnerChecklistPath), 'SOUND owner checklist must exist.')
check(existsSync(realAudioExecutionPath), 'Real audio execution policy must exist.')
check(existsSync(audioArtifactPolicyPath), 'Audio artifact policy must exist.')
check(existsSync(audioQaPolicyPath), 'Audio QA policy must exist.')
check(existsSync(draftMigrationPath), 'SUPABASE-SOUND draft migration file must exist.')
check(existsSync(draftTestPath), 'SUPABASE-SOUND draft test file must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const trackBDoc = readFileSync(trackBDocPath, 'utf8')
const trackADoc = readFileSync(trackADocPath, 'utf8')
const billingDoc = readFileSync(billingDocPath, 'utf8')
const observabilityDoc = readFileSync(observabilityDocPath, 'utf8')
const providerGatewayDoc = readFileSync(providerGatewayDocPath, 'utf8')
const workerRuntimeDoc = readFileSync(workerRuntimeDocPath, 'utf8')
const supabaseDecisionDoc = readFileSync(supabaseDecisionDocPath, 'utf8')
const soundFixturePlan = readFileSync(soundFixturePlanPath, 'utf8')
const soundOwnerChecklist = readFileSync(soundOwnerChecklistPath, 'utf8')
const realAudioExecution = readFileSync(realAudioExecutionPath, 'utf8')
const audioArtifactPolicy = readFileSync(audioArtifactPolicyPath, 'utf8')
const audioQaPolicy = readFileSync(audioQaPolicyPath, 'utf8')
const draftMigration = readFileSync(draftMigrationPath, 'utf8')
const draftTests = readFileSync(draftTestPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# TRACK-B-SOUND-0 Audio Fixture Media Processing Handoff Audit',
  'Workstream owner: TRACK_B_MEDIA_PROCESSING',
  'Requesting workstream: SOUND_MUSIC_AUDIO',
  'Related source workstreams: SUPABASE_RLS_STORAGE_DATABASE, WORKER_RUNTIME_JOBS, PROVIDER_GATEWAY_MODELS, OBSERVABILITY_AUDIT_COST, BILLING_STRIPE_CREDITS, TRACK_A_RENDER_EXPORT',
  'Current SOUND stage: dry_run_passed',
  'Target future stage: generated_local_fixture_passed',
  'Decision: conditional_track_b_acceptance_for_metadata_only_media_processing_handoff',
  'This document is audit-only.',
  'This document does not process media.',
  'This document does not run FFmpeg.',
  'This document does not run ffprobe.',
  'This document does not run audio cleanup, separation, analysis, or model inference.',
  'This document does not create processed media artifacts.',
  'This document does not create generated assets.',
  'This document does not create public artifacts.',
  'This document does not create signed URLs.',
  'This document does not mutate Supabase.',
  'This document does not call providers or dispatch workers.',
  'This document does not render, mux, or export.',
  'This document does not create credit rows.',
  'This document does not unlock generated_local_fixture_passed.',
  'SUPABASE-SOUND-4 remains globally blocked because SOUND scope acceptance is still not explicitly complete.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Public URLs are blocked.',
  'Public artifacts are blocked.',
  'Track B later must consume source-of-truth records, private artifact references, manifests, checksums, and approved snapshots',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'Raw prompt execution is blocked.',
  'Track B must not process media from raw chat',
  'TRACK_B_MEDIA_PROCESSING conditionally accepts future SOUND local fixture media/audio processing handoff evidence only as metadata/spec boundary expectations.',
  'trackBAllowsMetadataOnlyMediaProcessingHandoff: true.',
  'trackBAllowsMediaProcessing: false.',
  'trackBAllowsFFmpeg: false.',
  'trackBAllowsModelInference: false.',
  'trackBAllowsProcessedMediaArtifact: false.',
  'trackBAllowsPublicArtifact: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
  '## Accepted by Track B Media Processing',
  'metadata-only media/audio processing boundary expectations',
  'source media immutability expectation',
  'timing-aware cue manifest expectation',
  'private audio artifact manifest expectation',
  'approved plan snapshot reference expectation',
  'generated/local fixture spec reference expectation',
  'checksum/private path expectation',
  'audio QA evidence reference expectation',
  'speech/ducking metadata expectation',
  'music-over-voice metadata expectation',
  'SFX timing metadata expectation',
  'loudness expectation metadata',
  'sync/timing expectation metadata',
  'no FFmpeg execution',
  'no ffprobe execution',
  'no audio cleanup execution',
  'no audio separation execution',
  'no audio analysis execution',
  'no model inference',
  'no media processing execution',
  'no processed media artifact',
  'no generated asset',
  'no public artifact',
  'no signed URL',
  'no storage write',
  'no Track A final export',
  '## Rejected / still blocked by Track B Media Processing',
  'FFmpeg execution',
  'ffprobe execution',
  'audio cleanup execution',
  'audio separation execution',
  'audio analysis execution',
  'DeepFilterNet/RNNoise/Demucs model inference',
  'processed media creation',
  'generated_local_fixture_passed claim',
  '## Media processing readiness table',
  '## Future media processing handoff format',
  'trackBHandoffId: mock/reference-only now',
  'approvedPlanSnapshotId',
  'timingAwareCueManifestId',
  'privateAudioArtifactManifestId',
  'fixtureSpecId',
  'qaEvidenceRef',
  'trackAHandoffRef',
  'sourceMediaRef: future source-of-truth only',
  'storageObjectRecordRef: future only',
  'generatedAssetRef: future only',
  'mediaProcessingReady: false',
  'ffmpegAllowed: false',
  'modelInferenceAllowed: false',
  'processedMediaArtifactCreated: false',
  'publicArtifactAllowed: false',
  'signedUrlDeliveryAllowed: false',
  'persistedNow: false',
  '## Track A boundary',
  'Track A final mux/export remains blocked.',
  'Track B must not duplicate Track A render/export',
  '## Required before TRACK-B-SOUND-1',
  'metadata-only Track B handoff format approved;',
  'no-media-processing smoke;',
  'no-FFmpeg smoke;',
  'no-ffprobe smoke;',
  'no-model-inference smoke;',
  'no-processed-media-artifact smoke;',
  '## Cross-owner status after Track B decision',
  '## Go / no-go for SUPABASE-SOUND-4',
  'globalGoForSUPABASE_SOUND_4 remains false.',
  '## Runtime / media-processing gate behavior',
  'media processing: false.',
  'FFmpeg: false.',
  'ffprobe: false.',
  'audio cleanup: false.',
  'audio separation: false.',
  'audio analysis: false.',
  'model inference: false.',
  'processed media artifacts: false.',
  'generated assets: false.',
  'public artifacts: false.',
  'signed URL creation: false.',
  'render: false.',
  'mux: false.',
  'export: false.',
  'provider calls: false.',
  'worker dispatch: false.',
  'Supabase mutation: false.',
  'SQL execution: false.',
  'migration deploy: false.',
  'storage buckets or objects: false.',
  'credit rows: false.',
  'Track A final mux/export accepted: false.',
  'Track B media processing ready: false.',
  '## Supabase update classification',
  'Supabase update required: no.',
  'Supabase environment touched: no.',
  'SQL executed: no.',
  'Migration deployed: no.',
  '## Recommendation',
  recommendedImmediateNextPrompt,
]) {
  requireText(trackBDoc, required, `Track B audit doc must include ${required}.`)
}

for (const area of requiredHandoffAreas) {
  requireText(trackBDoc, requiredHandoffAreaDocText[area], `Track B doc table must include ${area}.`)
}

for (const owner of requiredOwners) {
  const section = ownerSection(trackBDoc, owner)
  requireText(section, `owner: ${owner}.`, `${owner} section must include owner field.`)
  requireText(section, 'status:', `${owner} section must include status.`)
  requireText(section, 'evidence:', `${owner} section must include evidence.`)
  requireText(section, 'missingEvidence:', `${owner} section must include missing evidence.`)
}

for (const owner of acceptedOwners) {
  requireText(ownerSection(trackBDoc, owner), 'status: accepted_conditionally.', `${owner} must be accepted conditionally.`)
}

for (const owner of missingOwners) {
  requireText(ownerSection(trackBDoc, owner), 'status: missing.', `${owner} must remain missing.`)
}

for (const priorRequired of [
  '# TRACK-A-SOUND-0 Audio Fixture Final Composition Handoff Audit',
  'trackAAllowsMetadataOnlyFinalCompositionHandoff: true.',
  'trackAAllowsRender: false.',
  'trackAAllowsMux: false.',
  'trackAAllowsExport: false.',
  'Track B processing remains not accepted.',
]) {
  requireText(trackADoc, priorRequired, `Track A doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# BILLING-SOUND-0 Fixture Credit Placeholder Acceptance Audit',
  'billingAllowsMetadataOnlyCreditPlaceholderExpectations: true.',
  'billingAllowsPersistedCreditRows: false.',
  'billingAllowsSpend: false.',
]) {
  requireText(billingDoc, priorRequired, `Billing doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# OBSERVABILITY-SOUND-0 QA / Audit / Cost Fixture Evidence Audit',
  'observabilityAllowsMetadataOnlyEvidenceExpectations: true.',
  'observabilityAllowsPersistedEvidenceRows: false.',
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
  'Track B processing execution remains not accepted.',
  'SOUND must not implement Track A final export or Track B media/audio processing.',
]) {
  requireText(soundFixturePlan, priorRequired, `SOUND fixture plan must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SOUND_MUSIC_AUDIO Owner Acceptance Checklist',
  'TRACK_B_MEDIA_PROCESSING',
  'Forbidden bypasses: no Track B execution, no FFmpeg, no model inference, no media processing, no source overwrite, and no cleanup/separation/analysis claim from SOUND.',
]) {
  requireText(soundOwnerChecklist, priorRequired, `SOUND owner checklist must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'validate approved snapshot, execution plan, idempotency, and private audio artifact refs',
  'prepare allowlisted FFmpeg loudness and normalization command plans',
  'keep DeepFilterNet, RNNoise, and Demucs skip-safe and model-weight gated',
  'M15A does not final mux, render, color grade, run masks, deploy, call providers, download models, run GPU production jobs, overwrite source audio, or use Revideo.',
]) {
  requireText(realAudioExecution, priorRequired, `Real audio execution policy must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'Milestone 9 audio artifacts are private storage references, not signed URLs.',
  'Source audio and source media are immutable.',
  'Cleaned audio and separated stems are new private artifacts and must never overwrite source assets.',
]) {
  requireText(audioArtifactPolicy, priorRequired, `Audio artifact policy must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '`audio_loudness`',
  '`audio_sync`',
  '`audio_naturalness`',
  '`music_over_voice`',
  'Milestone 9 records gates only and does not render/export.',
]) {
  requireText(audioQaPolicy, priorRequired, `Audio QA policy must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'generated_assets',
  'storage_object_records',
  'approved_plan_snapshots',
  'Source media immutability is required for fixture provenance.',
]) {
  requireText(draftMigration, priorRequired, `Draft migration must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'storage object records require private scope',
  'storage object records require checksum',
  'storage object records reject signed URL source of truth',
]) {
  requireText(draftTests, priorRequired, `Draft tests must still include ${priorRequired}.`)
}

const spec = TRACK_B_SOUND_MEDIA_PROCESSING_HANDOFF_ACCEPTANCE

check(spec.workstream === 'TRACK_B_MEDIA_PROCESSING', 'Spec workstream must be Track B.')
check(spec.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Spec requesting workstream must be SOUND.')
check(
  spec.relatedSourceWorkstreams.includes('SUPABASE_RLS_STORAGE_DATABASE')
    && spec.relatedSourceWorkstreams.includes('WORKER_RUNTIME_JOBS')
    && spec.relatedSourceWorkstreams.includes('PROVIDER_GATEWAY_MODELS')
    && spec.relatedSourceWorkstreams.includes('OBSERVABILITY_AUDIT_COST')
    && spec.relatedSourceWorkstreams.includes('BILLING_STRIPE_CREDITS')
    && spec.relatedSourceWorkstreams.includes('TRACK_A_RENDER_EXPORT'),
  'Spec must include Supabase, Worker Runtime, Provider Gateway, Observability, Billing, and Track A related sources.',
)
check(spec.mode === 'track_b_media_processing_handoff_audit_only', 'Spec mode must be audit only.')
check(spec.currentUnlockStage === 'dry_run_passed', 'Spec current stage must be dry_run_passed.')
check(
  spec.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Spec target stage must be generated_local_fixture_passed.',
)
check(spec.claimsGeneratedLocalFixturePassed === false, 'Spec must not claim generated_local_fixture_passed.')
check(
  spec.decision.trackBDecision === 'conditional_track_b_acceptance_for_metadata_only_media_processing_handoff',
  'Track B decision must be conditional metadata-only media processing handoff acceptance.',
)
check(
  typeof spec.decision.trackBAllowsMetadataOnlyMediaProcessingHandoff === 'boolean',
  'Track B metadata-only handoff flag must be boolean.',
)
check(
  spec.decision.trackBAllowsMetadataOnlyMediaProcessingHandoff === true,
  'Track B must allow metadata-only media processing handoff expectations.',
)
check(spec.decision.trackBAllowsMediaProcessing === false, 'Track B must not allow media processing.')
check(spec.decision.trackBAllowsFFmpeg === false, 'Track B must not allow FFmpeg.')
check(spec.decision.trackBAllowsModelInference === false, 'Track B must not allow model inference.')
check(
  spec.decision.trackBAllowsProcessedMediaArtifact === false,
  'Track B must not allow processed media artifacts.',
)
check(spec.decision.trackBAllowsPublicArtifact === false, 'Track B must not allow public artifacts.')
check(spec.decision.globalGoForSUPABASE_SOUND_4 === false, 'Global go must remain false.')
check(spec.decision.reasonGlobalGoBlocked.length > 0, 'Global go block reasons must be present.')
assertAllExecutionFlagsFalse(spec.execution, 'trackBSpec.execution')
check(spec.acceptedConditions.length > 0, 'Accepted conditions must exist.')
check(spec.rejectedOrStillBlocked.length > 0, 'Rejected/still blocked uses must exist.')

for (const area of requiredHandoffAreas) {
  const row = spec.mediaProcessingReadiness.find((entry) => entry.area === area)
  check(Boolean(row), `Spec media processing readiness must include ${area}.`)
  check(row?.mediaProcessingExecutionAllowedNow === false, `${area} must not allow media processing now.`)
  check(row?.requiredBeforeGeneratedLocalFixturePassed === true, `${area} must be required before target stage.`)
}

check(
  spec.futureMediaProcessingHandoffFormatExpectation.persistedNow === false,
  'Media processing handoff must not persist now.',
)
check(
  spec.futureMediaProcessingHandoffFormatExpectation.mediaProcessingReady === false,
  'Media processing must not be ready.',
)
check(spec.futureMediaProcessingHandoffFormatExpectation.ffmpegAllowed === false, 'FFmpeg must not be allowed.')
check(
  spec.futureMediaProcessingHandoffFormatExpectation.modelInferenceAllowed === false,
  'Model inference must not be allowed.',
)
check(
  spec.futureMediaProcessingHandoffFormatExpectation.processedMediaArtifactCreated === false,
  'Processed media artifact must not be created.',
)
check(
  spec.futureMediaProcessingHandoffFormatExpectation.publicArtifactAllowed === false,
  'Public artifact must not be allowed.',
)
check(
  spec.futureMediaProcessingHandoffFormatExpectation.signedUrlDeliveryAllowed === false,
  'Signed URL delivery must not be allowed.',
)
check(spec.trackABoundary.trackAFinalMuxAccepted === false, 'Track A final mux must not be accepted.')
check(spec.trackABoundary.trackAFinalExportAccepted === false, 'Track A final export must not be accepted.')
check(
  spec.trackABoundary.trackBCanDuplicateTrackARenderExport === false,
  'Track B must not duplicate Track A render/export.',
)
check(spec.trackABoundary.trackAHandoffMetadataOnly === true, 'Track A handoff must remain metadata-only.')
check(spec.requiredBeforeTRACK_B_SOUND_1.length >= 15, 'Required before TRACK-B-SOUND-1 must be populated.')
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
check(spec.rawPromptRule.rawPromptDirectExecutionAllowed === false, 'Raw prompt direct execution must be blocked.')
check(spec.rawPromptRule.processFromRawChatAllowed === false, 'Processing from raw chat must be blocked.')
check(spec.rawPromptRule.requiresStructuredAgentFindings === true, 'Raw prompt rule must require findings.')
check(spec.rawPromptRule.requiresEditIntents === true, 'Raw prompt rule must require edit intents.')
check(spec.rawPromptRule.requiresApprovedPlanSnapshot === true, 'Raw prompt rule must require snapshots.')
check(spec.crossOwnerStatus.length === requiredOwners.length, 'Spec must include all owner statuses.')

for (const owner of requiredOwners) {
  const entry = spec.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(Boolean(entry), `Spec owner status missing: ${owner}.`)
  check((entry?.evidence.length ?? 0) > 0, `${owner} evidence must be present.`)
  check((entry?.missingEvidence.length ?? 0) > 0, `${owner} missing evidence must be present.`)
}

for (const owner of acceptedOwners) {
  const entry = spec.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(entry?.status === 'accepted_conditionally', `${owner} must be accepted conditionally in spec.`)
}

for (const owner of missingOwners) {
  const entry = spec.crossOwnerStatus.find((candidate) => candidate.owner === owner)
  check(entry?.status === 'missing', `${owner} must remain missing in spec.`)
}

check(spec.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt, 'Spec must recommend SOUND scope next.')
check(packageJson.scripts?.[scriptName] === scriptCommand, 'package.json must include the Track B smoke script.')

check(
  TRACK_A_SOUND_FINAL_COMPOSITION_HANDOFF_ACCEPTANCE.decision.trackAAllowsExport === false,
  'Track A prior decision must keep export false.',
)
check(
  BILLING_SOUND_FIXTURE_CREDIT_PLACEHOLDER_ACCEPTANCE.decision.billingAllowsSpend === false,
  'Billing prior decision must keep spend false.',
)
check(
  OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE.decision
    .observabilityAllowsMetadataOnlyEvidenceExpectations === true,
  'Observability prior decision must allow metadata-only evidence expectations.',
)
check(
  PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE.decision.providerGatewayAllowsProviderCalls === false,
  'Provider Gateway prior decision must keep provider calls false.',
)
check(
  WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE.decision.workerRuntimeAllowsDispatch === false,
  'Worker Runtime prior decision must keep dispatch false.',
)
check(
  SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION.decision.supabaseOwnerAllowsFutureLocalValidation === true,
  'Supabase prior decision must allow future local validation conditionally.',
)
check(
  SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION.decision.globalGoForSUPABASE_SOUND_4 === false,
  'Supabase prior decision must keep global go false.',
)

assertNoConcreteForbiddenText(trackBDoc, trackBDocPath)
scanForbiddenValues(spec, 'TRACK_B_SOUND_MEDIA_PROCESSING_HANDOFF_ACCEPTANCE')

console.log(JSON.stringify({
  ok: true,
  workstream: spec.workstream,
  requestingWorkstream: spec.requestingWorkstream,
  smoke: 'track-b-sound-media-processing-handoff-acceptance',
  mode: spec.mode,
  claimsGeneratedLocalFixturePassed: spec.claimsGeneratedLocalFixturePassed,
  trackBAllowsMetadataOnlyMediaProcessingHandoff:
    spec.decision.trackBAllowsMetadataOnlyMediaProcessingHandoff,
  trackBAllowsMediaProcessing: spec.decision.trackBAllowsMediaProcessing,
  trackBAllowsFFmpeg: spec.decision.trackBAllowsFFmpeg,
  trackBAllowsModelInference: spec.decision.trackBAllowsModelInference,
  globalGoForSUPABASE_SOUND_4: spec.decision.globalGoForSUPABASE_SOUND_4,
  mediaProcessingRun: spec.execution.mediaProcessingRun,
  processedMediaArtifactsCreated: spec.execution.processedMediaArtifactsCreated,
  recommendedImmediateNextPrompt: spec.recommendedImmediateNextPrompt,
}, null, 2))
