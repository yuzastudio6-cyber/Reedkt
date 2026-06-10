import { existsSync, readFileSync } from 'node:fs'

import { BILLING_SOUND_FIXTURE_CREDIT_PLACEHOLDER_ACCEPTANCE } from '../../src/backend/mock/mock-billing-sound-fixture-credit-placeholder-acceptance'
import { OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE } from '../../src/backend/mock/mock-observability-sound-fixture-evidence-acceptance'
import { PROVIDER_GATEWAY_SOUND_FIXTURE_BOUNDARY_ACCEPTANCE } from '../../src/backend/mock/mock-provider-gateway-sound-fixture-boundary-acceptance'
import { SUPABASE_SOUND_LOCAL_SQL_SUPABASE_OWNER_DECISION } from '../../src/backend/mock/mock-supabase-sound-local-sql-supabase-owner-decision'
import { TRACK_A_SOUND_FINAL_COMPOSITION_HANDOFF_ACCEPTANCE } from '../../src/backend/mock/mock-track-a-sound-final-composition-handoff-acceptance'
import { WORKER_RUNTIME_SOUND_AUDIO_FIXTURE_PAYLOAD_ACCEPTANCE } from '../../src/backend/mock/mock-worker-runtime-sound-audio-fixture-payload-acceptance'

const trackADocPath = 'docs/track-a-sound-final-composition-handoff-audit.md'
const billingDocPath = 'docs/billing-sound-fixture-credit-placeholder-audit.md'
const observabilityDocPath = 'docs/observability-sound-fixture-evidence-audit.md'
const providerGatewayDocPath = 'docs/provider-gateway-sound-fixture-boundary-audit.md'
const workerRuntimeDocPath = 'docs/worker-runtime-sound-audio-fixture-payload-acceptance-audit.md'
const supabaseDecisionDocPath = 'docs/supabase-sound-local-sql-validation-supabase-owner-decision.md'
const soundFixturePlanPath = 'docs/sound-music-audio-generated-local-fixture-plan.md'
const soundOwnerChecklistPath = 'docs/sound-music-audio-owner-acceptance-checklist.md'
const finalRenderExportExecutionPath = 'docs/production-final-render-export-execution.md'
const finalRenderArtifactPolicyPath = 'docs/production-final-render-artifact-policy.md'
const exportDeliveryPolicyPath = 'docs/production-export-delivery-policy.md'
const ffmpegFinalExportPolicyPath = 'docs/production-ffmpeg-final-export-policy.md'
const renderManifestExecutionPolicyPath = 'docs/production-render-manifest-execution-policy.md'
const remotionRenderExecutionPolicyPath = 'docs/production-remotion-render-execution-policy.md'
const finalRenderQaPolicyPath = 'docs/production-final-render-qa-policy.md'
const draftMigrationPath = 'database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql'
const draftTestPath = 'database/test-sql/999_supabase_sound_local_fixture_records_tests.sql'
const activeMigrationPath = 'supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql'
const scriptName = 'smoke:track-a-sound-final-composition-handoff-acceptance'
const scriptCommand = 'tsx server/smoke/track-a-sound-final-composition-handoff-acceptance-smoke.ts'
const recommendedImmediateNextPrompt = 'TRACK-B-SOUND-0: audio fixture media processing handoff audit'

const requiredOwners = [
  'TRACK_A_RENDER_EXPORT',
  'BILLING_STRIPE_CREDITS',
  'OBSERVABILITY_AUDIT_COST',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'SOUND_MUSIC_AUDIO',
  'TRACK_B_MEDIA_PROCESSING',
] as const

const acceptedOwners = [
  'TRACK_A_RENDER_EXPORT',
  'BILLING_STRIPE_CREDITS',
  'OBSERVABILITY_AUDIT_COST',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
] as const

const missingOwners = ['SOUND_MUSIC_AUDIO', 'TRACK_B_MEDIA_PROCESSING'] as const

const requiredHandoffAreas = [
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
  'generated_audio_artifact',
  'generated_asset_row',
  'private_storage_row',
  'public_artifact',
  'signed_url',
  'track_b_processing',
  'final_mux_export',
  'delivery_public_visibility',
] as const

const requiredHandoffAreaDocText: Record<(typeof requiredHandoffAreas)[number], string> = {
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
  generated_audio_artifact: 'generated audio artifact',
  generated_asset_row: 'generated asset row',
  private_storage_row: 'private storage row',
  public_artifact: 'public artifact',
  signed_url: 'signed URL',
  track_b_processing: 'Track B processing',
  final_mux_export: 'final mux/export',
  delivery_public_visibility: 'delivery/public visibility',
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
  check(!lower.includes('service_role_key'), `${label} must not contain service-role key fields.`)
  check(!lower.includes('service-role key value'), `${label} must not contain service-role key values.`)
  check(!lower.includes('secret_value'), `${label} must not contain secret value fields.`)
  check(!lower.includes('api_key'), `${label} must not contain API key fields.`)
  check(!lower.includes('raw_prompt'), `${label} must not contain raw prompt fields.`)
  check(!lower.includes('raw_worker_prompt'), `${label} must not contain raw worker prompt fields.`)
  check(!lower.includes('renderpayload'), `${label} must not contain render payload markers.`)
  check(!lower.includes('workerpayload'), `${label} must not contain worker payload markers.`)
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

check(existsSync(trackADocPath), 'Track A final composition handoff audit document must exist.')
check(existsSync(billingDocPath), 'Billing fixture credit placeholder audit document must exist.')
check(existsSync(observabilityDocPath), 'Observability fixture evidence audit document must exist.')
check(existsSync(providerGatewayDocPath), 'Provider Gateway boundary audit document must exist.')
check(existsSync(workerRuntimeDocPath), 'Worker Runtime audit document must exist.')
check(existsSync(supabaseDecisionDocPath), 'Supabase owner decision document must exist.')
check(existsSync(soundFixturePlanPath), 'SOUND generated/local fixture plan must exist.')
check(existsSync(soundOwnerChecklistPath), 'SOUND owner checklist must exist.')
check(existsSync(finalRenderExportExecutionPath), 'Final render/export execution policy must exist.')
check(existsSync(finalRenderArtifactPolicyPath), 'Final render artifact policy must exist.')
check(existsSync(exportDeliveryPolicyPath), 'Export delivery policy must exist.')
check(existsSync(ffmpegFinalExportPolicyPath), 'FFmpeg final export policy must exist.')
check(existsSync(renderManifestExecutionPolicyPath), 'Render manifest execution policy must exist.')
check(existsSync(remotionRenderExecutionPolicyPath), 'Remotion render execution policy must exist.')
check(existsSync(finalRenderQaPolicyPath), 'Final render QA policy must exist.')
check(existsSync(draftMigrationPath), 'SUPABASE-SOUND draft migration file must exist.')
check(existsSync(draftTestPath), 'SUPABASE-SOUND draft test file must exist.')
check(!existsSync(activeMigrationPath), 'No active migration for this draft may exist under supabase/migrations.')

const trackADoc = readFileSync(trackADocPath, 'utf8')
const billingDoc = readFileSync(billingDocPath, 'utf8')
const observabilityDoc = readFileSync(observabilityDocPath, 'utf8')
const providerGatewayDoc = readFileSync(providerGatewayDocPath, 'utf8')
const workerRuntimeDoc = readFileSync(workerRuntimeDocPath, 'utf8')
const supabaseDecisionDoc = readFileSync(supabaseDecisionDocPath, 'utf8')
const soundFixturePlan = readFileSync(soundFixturePlanPath, 'utf8')
const soundOwnerChecklist = readFileSync(soundOwnerChecklistPath, 'utf8')
const finalRenderExportExecution = readFileSync(finalRenderExportExecutionPath, 'utf8')
const finalRenderArtifactPolicy = readFileSync(finalRenderArtifactPolicyPath, 'utf8')
const exportDeliveryPolicy = readFileSync(exportDeliveryPolicyPath, 'utf8')
const ffmpegFinalExportPolicy = readFileSync(ffmpegFinalExportPolicyPath, 'utf8')
const renderManifestExecutionPolicy = readFileSync(renderManifestExecutionPolicyPath, 'utf8')
const remotionRenderExecutionPolicy = readFileSync(remotionRenderExecutionPolicyPath, 'utf8')
const finalRenderQaPolicy = readFileSync(finalRenderQaPolicyPath, 'utf8')
const draftMigration = readFileSync(draftMigrationPath, 'utf8')
const draftTests = readFileSync(draftTestPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts?: Record<string, string>
}

for (const required of [
  '# TRACK-A-SOUND-0 Audio Fixture Final Composition Handoff Audit',
  'Workstream owner: TRACK_A_RENDER_EXPORT',
  'Requesting workstream: SOUND_MUSIC_AUDIO',
  'Related source workstreams: SUPABASE_RLS_STORAGE_DATABASE, WORKER_RUNTIME_JOBS, PROVIDER_GATEWAY_MODELS, OBSERVABILITY_AUDIT_COST, BILLING_STRIPE_CREDITS',
  'Current SOUND stage: dry_run_passed',
  'Target future stage: generated_local_fixture_passed',
  'Decision: conditional_track_a_acceptance_for_metadata_only_final_composition_handoff',
  'This document is audit-only.',
  'This document does not render.',
  'This document does not mux.',
  'This document does not export.',
  'This document does not run FFmpeg or media processing.',
  'This document does not create final composition artifacts.',
  'This document does not create generated assets.',
  'This document does not create public artifacts.',
  'This document does not create signed URLs.',
  'This document does not mutate Supabase.',
  'This document does not call providers or dispatch workers.',
  'This document does not create credit rows.',
  'This document does not unlock generated_local_fixture_passed.',
  'SUPABASE-SOUND-4 remains globally blocked because cross-owner approvals are incomplete.',
  'Supabase row\n+ private GCS path\n+ manifest\n+ checksum\n+ approved plan snapshot',
  'Signed URLs are not source of truth.',
  'Public URLs are blocked.',
  'Public artifacts are blocked.',
  'Track A handoff evidence later must map back to approved source-of-truth records and private artifact references.',
  'user/chat request\n→ structured agent findings\n→ edit intents\n→ approved plan snapshot\n→ worker execution',
  'Raw prompt execution is blocked.',
  'Track A final composition handoff must not be produced from chat text directly',
  'TRACK_A_RENDER_EXPORT conditionally accepts future SOUND local fixture final composition handoff evidence only as metadata/spec expectations.',
  'trackAAllowsMetadataOnlyFinalCompositionHandoff: true.',
  'trackAAllowsRender: false.',
  'trackAAllowsMux: false.',
  'trackAAllowsExport: false.',
  'trackAAllowsPublicArtifact: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
  '## Accepted by Track A Render/Export',
  'metadata-only final composition handoff expectations',
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
  '## Rejected / still blocked by Track A Render/Export',
  'render execution',
  'mux execution',
  'export execution',
  'FFmpeg execution',
  'media processing',
  'final composition artifact creation',
  'generated_local_fixture_passed claim',
  '## Handoff readiness table',
  '## Future final composition handoff format',
  'trackAHandoffId: mock/reference-only now',
  'approvedPlanSnapshotId',
  'timingAwareCueManifestId',
  'privateAudioArtifactManifestId',
  'fixtureSpecId',
  'qaEvidenceRef',
  'billingPlaceholderRef',
  'sourceOfTruthStorageRecordRef: future only',
  'generatedAssetRef: future only',
  'finalRenderReady: false',
  'finalExportReady: false',
  'publicArtifactAllowed: false',
  'signedUrlDeliveryAllowed: false',
  'persistedNow: false',
  '## Track B boundary',
  'Track B processing remains not accepted.',
  'Track A must not duplicate Track B processing',
  '## Required before TRACK-A-SOUND-1',
  'metadata-only final composition handoff spec approved;',
  'no-render/no-mux/no-export smoke;',
  'no-FFmpeg/no-media-processing smoke;',
  'no-public-artifact/no-signed-URL smoke;',
  'no-generated-asset/no-final-artifact smoke;',
  '## Cross-owner status after Track A decision',
  '## Go / no-go for SUPABASE-SOUND-4',
  'globalGoForSUPABASE_SOUND_4 remains false.',
  '## Runtime / provider / gate behavior',
  'render: false.',
  'mux: false.',
  'export: false.',
  'FFmpeg: false.',
  'media processing: false.',
  'final composition artifact creation: false.',
  'generated assets: false.',
  'public artifacts: false.',
  'signed URL creation: false.',
  'provider calls: false.',
  'worker dispatch: false.',
  'Supabase mutation: false.',
  'SQL execution: false.',
  'migration deploy: false.',
  'storage buckets or objects: false.',
  'credit rows: false.',
  'Track A final render ready: false.',
  'Track A final export ready: false.',
  'Track B execution accepted: false.',
  '## Supabase update classification',
  'Supabase update required: no.',
  'Supabase environment touched: no.',
  'SQL executed: no.',
  'Migration deployed: no.',
  '## Recommendation',
  recommendedImmediateNextPrompt,
]) {
  requireText(trackADoc, required, `Track A audit doc must include ${required}.`)
}

for (const area of requiredHandoffAreas) {
  requireText(trackADoc, requiredHandoffAreaDocText[area], `Track A doc table must include ${area}.`)
}

for (const owner of requiredOwners) {
  const section = ownerSection(trackADoc, owner)
  requireText(section, `owner: ${owner}.`, `${owner} section must include owner field.`)
  requireText(section, 'status:', `${owner} section must include status.`)
  requireText(section, 'evidence:', `${owner} section must include evidence.`)
  requireText(section, 'missingEvidence:', `${owner} section must include missing evidence.`)
}

for (const owner of acceptedOwners) {
  requireText(ownerSection(trackADoc, owner), 'status: accepted_conditionally.', `${owner} must be accepted conditionally.`)
}

for (const owner of missingOwners) {
  requireText(ownerSection(trackADoc, owner), 'status: missing.', `${owner} must remain missing.`)
}

for (const priorRequired of [
  '# BILLING-SOUND-0 Fixture Credit Placeholder Acceptance Audit',
  'billingAllowsMetadataOnlyCreditPlaceholderExpectations: true.',
  'billingAllowsPersistedCreditRows: false.',
  'billingAllowsSpend: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
]) {
  requireText(billingDoc, priorRequired, `Billing doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# OBSERVABILITY-SOUND-0 QA / Audit / Cost Fixture Evidence Audit',
  'observabilityAllowsMetadataOnlyEvidenceExpectations: true.',
  'observabilityAllowsPersistedEvidenceRows: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
]) {
  requireText(observabilityDoc, priorRequired, `Observability doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# PROVIDER-GATEWAY-SOUND-0 Provider / License Fixture Boundary Audit',
  'providerGatewayAllowsNoProviderLocalFixture: true.',
  'providerGatewayAllowsProviderCalls: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
]) {
  requireText(providerGatewayDoc, priorRequired, `Provider Gateway doc must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# WORKER-RUNTIME-SOUND-0 Audio Fixture Payload Acceptance Audit',
  'workerRuntimeAllowsFuturePayloadShapeValidation: true.',
  'workerRuntimeAllowsDispatch: false.',
  'globalGoForSUPABASE_SOUND_4: false.',
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
  'Track A final composition handoff',
  'Track A final composition handoff remains blocked.',
  'Track A final export remains blocked',
]) {
  requireText(soundFixturePlan, priorRequired, `SOUND fixture plan must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '# SOUND_MUSIC_AUDIO Owner Acceptance Checklist',
  'TRACK_A_RENDER_EXPORT',
  'final mux/export validation, final composition consumption, sync QA, audio readiness acceptance',
  'Forbidden bypasses: no final mux, no render/export, no delivery, no public artifact, no final asset, and no Track A readiness claim from SOUND.',
]) {
  requireText(soundOwnerChecklist, priorRequired, `SOUND owner checklist must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'M16A does not deploy, run `gcloud`, call providers, download model weights, run unapproved GPU jobs, process arbitrary media paths, overwrite source artifacts, use raw prompts as instructions, make Revideo core, or bypass QA.',
  'checks command plan creation, keeps `final_delivery` blocked without private `final_export`',
]) {
  requireText(finalRenderExportExecution, priorRequired, `Final render/export policy must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '`final_export` artifacts use the `final_exports` bucket purpose, are `sourceOfTruth: true`, and remain private until a later delivery/share policy explicitly creates a share path.',
  'Signed URLs are never persisted as source of truth.',
]) {
  requireText(finalRenderArtifactPolicy, priorRequired, `Final render artifact policy must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'Final exports are private by default.',
  'Temporary signed URLs may be generated only by a future approved delivery/share policy and must not be stored as source of truth.',
  'M17 does not implement public sharing, persistent delivery links, or external beta delivery.',
]) {
  requireText(exportDeliveryPolicy, priorRequired, `Export delivery policy must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'FFmpeg owns M16A preview/export muxing and transcode command plans.',
  'Arbitrary FFmpeg args, source overwrite, signed URL sources, unsafe paths, and final delivery without QA are blocked.',
  'Local-dev FFmpeg execution is opt-in and skip-safe.',
]) {
  requireText(ffmpegFinalExportPolicy, priorRequired, `FFmpeg final export policy must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'Render execution consumes approved `TimelineManifest` and `RenderManifest` data or their private artifact IDs.',
  'Required fields include approved snapshot, tool execution plan, idempotency key',
  'It never stores signed URLs, raw prompts, secrets, or Revideo render instructions.',
]) {
  requireText(renderManifestExecutionPolicy, priorRequired, `Render manifest policy must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'Remotion',
  'command',
  'raw prompt',
]) {
  requireText(remotionRenderExecutionPolicy, priorRequired, `Remotion render policy must still include ${priorRequired}.`)
}

for (const priorRequired of [
  '`audio_sync`',
  '`final_delivery` passes only when a private `final_export` artifact exists and all blocking upstream/render/export gates pass.',
  'Otherwise final delivery remains blocked.',
]) {
  requireText(finalRenderQaPolicy, priorRequired, `Final render QA policy must still include ${priorRequired}.`)
}

for (const priorRequired of [
  'generated_assets',
  'storage_object_records',
  'approved_plan_snapshots',
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

const spec = TRACK_A_SOUND_FINAL_COMPOSITION_HANDOFF_ACCEPTANCE

check(spec.workstream === 'TRACK_A_RENDER_EXPORT', 'Spec workstream must be Track A.')
check(spec.requestingWorkstream === 'SOUND_MUSIC_AUDIO', 'Spec requesting workstream must be SOUND.')
check(
  spec.relatedSourceWorkstreams.includes('SUPABASE_RLS_STORAGE_DATABASE')
    && spec.relatedSourceWorkstreams.includes('WORKER_RUNTIME_JOBS')
    && spec.relatedSourceWorkstreams.includes('PROVIDER_GATEWAY_MODELS')
    && spec.relatedSourceWorkstreams.includes('OBSERVABILITY_AUDIT_COST')
    && spec.relatedSourceWorkstreams.includes('BILLING_STRIPE_CREDITS'),
  'Spec must include Supabase, Worker Runtime, Provider Gateway, Observability, and Billing related sources.',
)
check(spec.mode === 'track_a_final_composition_handoff_audit_only', 'Spec mode must be audit only.')
check(spec.currentUnlockStage === 'dry_run_passed', 'Spec current stage must be dry_run_passed.')
check(
  spec.targetFutureUnlockStage === 'generated_local_fixture_passed',
  'Spec target stage must be generated_local_fixture_passed.',
)
check(spec.claimsGeneratedLocalFixturePassed === false, 'Spec must not claim generated_local_fixture_passed.')
check(
  spec.decision.trackADecision === 'conditional_track_a_acceptance_for_metadata_only_final_composition_handoff',
  'Track A decision must be conditional metadata-only final composition handoff acceptance.',
)
check(
  spec.decision.trackAAllowsMetadataOnlyFinalCompositionHandoff === true,
  'Track A must allow metadata-only final composition handoff expectations.',
)
check(spec.decision.trackAAllowsRender === false, 'Track A must not allow render.')
check(spec.decision.trackAAllowsMux === false, 'Track A must not allow mux.')
check(spec.decision.trackAAllowsExport === false, 'Track A must not allow export.')
check(spec.decision.trackAAllowsPublicArtifact === false, 'Track A must not allow public artifacts.')
check(spec.decision.globalGoForSUPABASE_SOUND_4 === false, 'Global go must remain false.')
check(spec.decision.reasonGlobalGoBlocked.length > 0, 'Global go block reasons must be present.')
assertAllExecutionFlagsFalse(spec.execution, 'trackASpec.execution')
check(spec.acceptedConditions.length > 0, 'Accepted conditions must exist.')
check(spec.rejectedOrStillBlocked.length > 0, 'Rejected/still blocked uses must exist.')

for (const area of requiredHandoffAreas) {
  const row = spec.handoffReadiness.find((entry) => entry.area === area)
  check(Boolean(row), `Spec handoff readiness must include ${area}.`)
  check(row?.executionOrOutputAllowedNow === false, `${area} must not allow execution/output now.`)
  check(row?.requiredBeforeGeneratedLocalFixturePassed === true, `${area} must be required before target stage.`)
}

check(
  spec.futureFinalCompositionHandoffFormatExpectation.persistedNow === false,
  'Final composition handoff must not persist now.',
)
check(
  spec.futureFinalCompositionHandoffFormatExpectation.finalRenderReady === false,
  'Final render must not be ready.',
)
check(
  spec.futureFinalCompositionHandoffFormatExpectation.finalExportReady === false,
  'Final export must not be ready.',
)
check(
  spec.futureFinalCompositionHandoffFormatExpectation.publicArtifactAllowed === false,
  'Public artifact must not be allowed.',
)
check(
  spec.futureFinalCompositionHandoffFormatExpectation.signedUrlDeliveryAllowed === false,
  'Signed URL delivery must not be allowed.',
)
check(spec.trackBBoundary.trackBProcessingAccepted === false, 'Track B processing must not be accepted.')
check(
  spec.trackBBoundary.trackACanDuplicateTrackBProcessing === false,
  'Track A must not duplicate Track B processing.',
)
check(
  spec.trackBBoundary.trackAFinalCompositionReadyWithoutTrackB === false,
  'Track A must not be ready without required Track B boundary.',
)
check(
  spec.trackBBoundary.separateOwnerAcceptanceRequired === true,
  'Track B must require separate owner acceptance.',
)
check(spec.requiredBeforeTRACK_A_SOUND_1.length >= 12, 'Required before TRACK-A-SOUND-1 must be populated.')
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
check(spec.rawPromptRule.renderFromRawChatAllowed === false, 'Render from raw chat must be blocked.')
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

check(spec.recommendedImmediateNextPrompt === recommendedImmediateNextPrompt, 'Spec must recommend Track B next.')
check(packageJson.scripts?.[scriptName] === scriptCommand, 'package.json must include the Track A smoke script.')

check(
  BILLING_SOUND_FIXTURE_CREDIT_PLACEHOLDER_ACCEPTANCE.decision.billingAllowsSpend === false,
  'Billing prior decision must keep spend false.',
)
check(
  BILLING_SOUND_FIXTURE_CREDIT_PLACEHOLDER_ACCEPTANCE.decision.globalGoForSUPABASE_SOUND_4 === false,
  'Billing prior decision must keep global go false.',
)
check(
  OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE.decision
    .observabilityAllowsMetadataOnlyEvidenceExpectations === true,
  'Observability prior decision must allow metadata-only evidence expectations.',
)
check(
  OBSERVABILITY_SOUND_FIXTURE_EVIDENCE_ACCEPTANCE.decision.observabilityAllowsPersistedEvidenceRows === false,
  'Observability prior decision must keep persisted evidence rows false.',
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

assertNoConcreteForbiddenText(trackADoc, trackADocPath)
scanForbiddenValues(spec, 'TRACK_A_SOUND_FINAL_COMPOSITION_HANDOFF_ACCEPTANCE')

console.log(JSON.stringify({
  ok: true,
  workstream: spec.workstream,
  requestingWorkstream: spec.requestingWorkstream,
  smoke: 'track-a-sound-final-composition-handoff-acceptance',
  mode: spec.mode,
  claimsGeneratedLocalFixturePassed: spec.claimsGeneratedLocalFixturePassed,
  trackAAllowsMetadataOnlyFinalCompositionHandoff:
    spec.decision.trackAAllowsMetadataOnlyFinalCompositionHandoff,
  trackAAllowsRender: spec.decision.trackAAllowsRender,
  trackAAllowsMux: spec.decision.trackAAllowsMux,
  trackAAllowsExport: spec.decision.trackAAllowsExport,
  globalGoForSUPABASE_SOUND_4: spec.decision.globalGoForSUPABASE_SOUND_4,
  renderRun: spec.execution.renderRun,
  muxRun: spec.execution.muxRun,
  exportRun: spec.execution.exportRun,
  recommendedImmediateNextPrompt: spec.recommendedImmediateNextPrompt,
}, null, 2))
