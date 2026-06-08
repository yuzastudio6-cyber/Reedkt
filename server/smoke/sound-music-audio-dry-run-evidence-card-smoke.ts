import { readFileSync } from 'node:fs'
import {
  buildSoundMusicAudioDryRunEvidence,
  createMockSoundMusicAudioChatCardProps,
  SoundMusicAudioDryRunEvidencePanel,
  type SoundMusicAudioDryRunEvidenceDisplay,
} from '../../src/components/editor/sound'
import type { SoundProviderId, SoundRelatedWorkstreamId } from '../../src/types/audio-music'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function assertNoNetworkOrCredentialValues(value: unknown, path = 'dryRunEvidence'): void {
  if (!value || typeof value !== 'object') return

  for (const [key, nested] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase()
    check(!normalizedKey.includes('apikey'), `${path}.${key} must not expose an API key field.`)
    check(!normalizedKey.includes('api_key'), `${path}.${key} must not expose an API key field.`)
    check(normalizedKey !== 'servicerolekey', `${path}.${key} must not expose a service role key field.`)
    check(normalizedKey !== 'service_role_key', `${path}.${key} must not expose a service role key field.`)

    if (typeof nested === 'string') {
      const normalizedValue = nested.toLowerCase()
      check(!/^https?:\/\//i.test(nested), `${path}.${key} must not contain a public URL.`)
      check(!normalizedValue.startsWith('gs://'), `${path}.${key} must not contain a storage URI.`)
      check(!normalizedValue.includes('x-goog-signature'), `${path}.${key} must not contain a signed URL signature.`)
      check(!normalizedValue.includes('signature='), `${path}.${key} must not contain a signed URL signature.`)
      check(!normalizedValue.includes('api_key'), `${path}.${key} must not contain an API key value.`)
      check(!normalizedValue.includes('service_role'), `${path}.${key} must not contain a service role value.`)
      check(!normalizedValue.includes('sk-'), `${path}.${key} must not contain a provider credential shape.`)
    }

    assertNoNetworkOrCredentialValues(nested, `${path}.${key}`)
  }
}

function requireHandoff(evidence: SoundMusicAudioDryRunEvidenceDisplay, owner: SoundRelatedWorkstreamId): void {
  check(evidence.requiredHandoffs.includes(owner), `Dry-run evidence must require ${owner} handoff.`)
}

function requireProvider(providerIds: SoundProviderId[], providerId: SoundProviderId, message: string): void {
  check(providerIds.includes(providerId), message)
}

function assertFalseGates(evidence: SoundMusicAudioDryRunEvidenceDisplay): void {
  for (const [key, value] of Object.entries(evidence.noSideEffectGates)) {
    check(value === false, `No-side-effect gate ${key} must be false.`)
  }
}

const props = createMockSoundMusicAudioChatCardProps()
const evidence = props.dryRunEvidence
check(Boolean(evidence), 'Mock chat props must include dry-run evidence display data.')
if (!evidence) throw new Error('Missing dry-run evidence display data.')

const rebuiltEvidence = buildSoundMusicAudioDryRunEvidence({
  dryRunRequestId: evidence.dryRunRequestId,
  structuredFindingIds: evidence.structuredInputs.structuredFindingIds,
  editIntentIds: evidence.structuredInputs.editIntentIds,
  approvedSnapshot: evidence.approvedSnapshot,
  timingManifest: props.timingManifest,
  privateArtifactManifest: props.privateArtifactManifest,
  providerGateway: evidence.providerGateway,
  workerRuntime: evidence.workerRuntime,
  supabaseStorage: evidence.supabaseStorage,
  qaObservabilityBilling: evidence.qaObservabilityBilling,
  trackHandoffs: evidence.trackHandoffs,
  noSideEffectGates: evidence.noSideEffectGates,
  blockedUses: evidence.blockedUses,
  futureRequirements: evidence.futureRequirements,
})

check(typeof SoundMusicAudioDryRunEvidencePanel === 'function', 'Dry-run evidence panel must be exported.')
check(evidence.workstream === 'SOUND_MUSIC_AUDIO', 'Dry-run evidence must report SOUND_MUSIC_AUDIO ownership.')
check(evidence.mode === 'mock_dry_run_contract', 'Dry-run evidence must use mock_dry_run_contract mode.')
check(evidence.currentUnlockStage === 'dry_run_passed_mock_only', 'Current unlock stage must be mock/dry-run only.')
check(evidence.nextUnlockStage === 'generated_local_fixture_passed', 'Next unlock stage must be generated_local_fixture_passed.')
check(evidence.nextUnlockBlocked === true, 'Next unlock stage must remain blocked.')
check(rebuiltEvidence.currentUnlockStage === evidence.currentUnlockStage, 'Dry-run evidence builder must rebuild the unlock stage deterministically.')
check(evidence.structuredInputs.structuredFindingCount > 0, 'Structured finding count must be positive.')
check(evidence.structuredInputs.editIntentCount > 0, 'Edit intent count must be positive.')
check(evidence.structuredInputs.rawPromptExecutionAllowed === false, 'Raw prompt execution must be blocked.')
check(evidence.structuredInputs.rawWorkerPromptPresent === false, 'Raw worker prompt must be absent.')

check(evidence.approvedSnapshot.approvedPlanSnapshotId.startsWith('mock-'), 'Approved snapshot id must be mock/reference-only.')
check(evidence.approvedSnapshot.approvalStatus === 'mock_approved_reference_only', 'Approved snapshot status must be mock reference only.')
check(evidence.approvedSnapshot.snapshotChecksum.length > 0, 'Approved snapshot checksum metadata is required.')
check(evidence.approvedSnapshot.immutablePlanVersion.length > 0, 'Immutable plan version metadata is required.')
check(evidence.approvedSnapshot.sourceFindingIds.length > 0, 'Approved snapshot source findings are required.')
check(evidence.approvedSnapshot.sourceIntentIds.length > 0, 'Approved snapshot source intents are required.')
check(evidence.approvedSnapshot.createsSnapshot === false, 'Dry-run evidence must not create approved snapshot records.')
check(evidence.approvedSnapshot.metadataOnly === true, 'Approved snapshot display must be metadata-only.')

check(evidence.timingManifest.present === true, 'Timing manifest evidence must be present.')
check(evidence.timingManifest.cueCount > 0, 'Timing manifest evidence must include cues.')
check(evidence.timingManifest.timingAnchorsPresent === true, 'Timing anchors must be present.')
check(evidence.timingManifest.metadataOnly === true, 'Timing manifest evidence must be metadata-only.')
check(evidence.timingManifest.trackAFinalRenderReady === false, 'Track A final render readiness must be false.')
check(evidence.timingManifest.providerExecutionReady === false, 'Provider execution readiness must be false.')
check(evidence.timingManifest.workerExecutionReady === false, 'Worker execution readiness must be false.')

check(evidence.privateArtifactManifest.present === true, 'Private artifact manifest evidence must be present.')
check(evidence.privateArtifactManifest.storageScope === 'private', 'Private artifact manifest must stay private scoped.')
check(evidence.privateArtifactManifest.metadataOnly === true, 'Private artifact manifest evidence must be metadata-only.')
check(evidence.privateArtifactManifest.publicArtifactAllowed === false, 'Private artifact manifest must block public artifacts.')
check(evidence.privateArtifactManifest.signedUrlsPresent === false, 'Signed URLs must be absent.')
check(evidence.privateArtifactManifest.publicUrlsPresent === false, 'Public URLs must be absent.')
check(evidence.privateArtifactManifest.generatedAssetsCreated === false, 'Generated assets must not be created.')

check(evidence.providerGateway.owner === 'PROVIDER_GATEWAY_MODELS', 'Provider Gateway owner is required.')
check(evidence.providerGateway.mayCallProvider === false, 'Provider calls must be blocked.')
check(evidence.providerGateway.transportAllowed === false, 'Provider transport must be blocked.')
check(evidence.providerGateway.providerSecretsAllowed === false, 'Provider secrets must be blocked.')
check(evidence.providerGateway.fallbackExecutionAllowed === false, 'Provider fallback execution must be blocked.')
check(evidence.providerGateway.lyriaPlanning.providerId === 'lyria_mock', 'Lyria mock planning metadata is required.')
check(evidence.providerGateway.lyriaPlanning.allowedFamilies.includes('music_cue'), 'Lyria must include music cue planning.')
check(evidence.providerGateway.lyriaPlanning.allowedFamilies.includes('soundtrack_layer'), 'Lyria must include soundtrack planning.')
check(evidence.providerGateway.lyriaPlanning.allowedFamilies.includes('audio_mood_design'), 'Lyria must include music mood planning.')
check(evidence.providerGateway.lyriaPlanning.usedForSfxFoleyAmbience === false, 'Lyria must not be used for SFX, foley, or ambience.')
check(evidence.providerGateway.lyriaPlanning.generationEnabled === false, 'Lyria generation must remain disabled.')
check(evidence.providerGateway.lyriaPlanning.providerGatewayRequired === true, 'Lyria must require Provider Gateway handoff.')

for (const providerId of [
  'openmoss_moss_soundeffect_v2_pending_verification',
  'meta_audiogen_disabled',
  'woosh_disabled',
  'tangoflux_disabled',
  'mmaudio_disabled',
] satisfies SoundProviderId[]) {
  requireProvider(evidence.providerGateway.blockedProviders, providerId, `${providerId} must remain blocked.`)
}
for (const providerId of ['dasheng_audiogen_candidate', 'stable_audio_open_license_gated'] satisfies SoundProviderId[]) {
  requireProvider(evidence.providerGateway.licenseGatedPlanningProviders, providerId, `${providerId} must remain license-gated planning metadata.`)
}
for (const providerId of ['audioflux_analysis_only', 'signalsmith_stretch_processing_only'] satisfies SoundProviderId[]) {
  requireProvider(evidence.providerGateway.processingOnlyProviders, providerId, `${providerId} must remain processing-only.`)
}
for (const providerId of ['deepfilternet_review_required', 'rnnoise_review_required', 'demucs_review_required'] satisfies SoundProviderId[]) {
  requireProvider(evidence.providerGateway.reviewGatedProcessingProviders, providerId, `${providerId} must remain review-gated.`)
}

check(evidence.workerRuntime.owner === 'WORKER_RUNTIME_JOBS', 'Worker Runtime owner is required.')
check(evidence.workerRuntime.mayDispatchWorker === false, 'Worker dispatch must be blocked.')
check(evidence.workerRuntime.workerPayloadCreated === false, 'Worker payloads must not be created.')
check(evidence.workerRuntime.productionWorkerPayloadAllowed === false, 'Production worker payloads must be blocked.')
check(evidence.workerRuntime.requiresApprovedSnapshot === true, 'Worker handoff must require approved snapshots.')
check(evidence.workerRuntime.requiresIdempotencyKey === true, 'Worker handoff must require idempotency.')
check(evidence.workerRuntime.idempotencyKey.startsWith('mock-'), 'Worker idempotency metadata must be mock-prefixed.')
check(evidence.workerRuntime.rawPromptExecutionAllowed === false, 'Raw prompt execution must be blocked.')
check(evidence.workerRuntime.signedUrlInputAllowed === false, 'Signed URL worker input must be blocked.')
check(evidence.workerRuntime.serviceRoleKeyAllowed === false, 'Privileged key input must be blocked.')
check(evidence.workerRuntime.providerSecretAllowed === false, 'Provider secret input must be blocked.')
check(evidence.workerRuntime.generatedAssetCreationAllowed === false, 'Generated asset creation must be blocked.')

check(evidence.supabaseStorage.owner === 'SUPABASE_RLS_STORAGE_DATABASE', 'Supabase owner is required.')
check(evidence.supabaseStorage.mayMutateSupabase === false, 'Supabase mutation must be blocked.')
check(evidence.supabaseStorage.sqlAllowed === false, 'SQL must be blocked.')
check(evidence.supabaseStorage.migrationAllowed === false, 'Migrations must be blocked.')
check(evidence.supabaseStorage.mayWriteStorage === false, 'Storage writes must be blocked.')
check(evidence.supabaseStorage.signedUrlSourceOfTruthAllowed === false, 'Signed URLs must not be source of truth.')
check(evidence.supabaseStorage.publicArtifactAllowed === false, 'Public artifacts must be blocked.')

check(evidence.qaObservabilityBilling.observabilityOwner === 'OBSERVABILITY_AUDIT_COST', 'Observability owner is required.')
check(evidence.qaObservabilityBilling.billingOwner === 'BILLING_STRIPE_CREDITS', 'Billing owner is required.')
check(evidence.qaObservabilityBilling.qaEvidencePersisted === false, 'QA evidence must not be persisted.')
check(evidence.qaObservabilityBilling.creditEstimateCreated === false, 'Credit estimates must not be created.')
check(evidence.qaObservabilityBilling.creditApprovalCreated === false, 'Credit approvals must not be created.')
check(evidence.qaObservabilityBilling.creditReservationCreated === false, 'Credit reservations must not be created.')
check(evidence.qaObservabilityBilling.spendOccurred === false, 'Credit spend must not occur.')
check(evidence.qaObservabilityBilling.refundOrReleaseOccurred === false, 'Credit refund/release must not occur.')

check(evidence.trackHandoffs.trackAOwner === 'TRACK_A_RENDER_EXPORT', 'Track A owner is required.')
check(evidence.trackHandoffs.trackAFinalExportReady === false, 'Track A final export readiness must be false.')
check(evidence.trackHandoffs.finalMuxExportAllowed === false, 'Final mux/export must be blocked.')
check(evidence.trackHandoffs.trackBOwner === 'TRACK_B_MEDIA_PROCESSING', 'Track B owner is required.')
check(evidence.trackHandoffs.trackBExecutionAccepted === false, 'Track B execution must not be accepted.')

for (const owner of [
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
] satisfies SoundRelatedWorkstreamId[]) {
  requireHandoff(evidence, owner)
}

assertFalseGates(evidence)
check(evidence.blockedUses.includes('provider_gateway_handoff_required'), 'Provider Gateway blocked use must be present.')
check(evidence.blockedUses.includes('worker_runtime_handoff_required'), 'Worker Runtime blocked use must be present.')
check(evidence.blockedUses.includes('supabase_mutation_blocked'), 'Supabase blocked use must be present.')
check(evidence.blockedUses.includes('final_render_export_not_owned'), 'Track A/final export blocked use must be present.')
check(evidence.futureRequirements.some((requirement) => /generated\/local fixture/i.test(requirement)), 'Generated/local fixture blocker must be present.')

const forbiddenLyriaGroups = [
  ...(props.cueGroups?.actionFoley ?? []),
  ...(props.cueGroups?.ambience ?? []),
]
check(!forbiddenLyriaGroups.some((cue) => cue.providerCandidate === 'lyria_mock'), 'Lyria must not be used as an SFX/foley/ambience provider.')

assertNoNetworkOrCredentialValues(evidence)

const cardSource = readFileSync('src/components/editor/sound/SoundMusicAudioPlanCard.tsx', 'utf8')
const panelSource = readFileSync('src/components/editor/sound/SoundMusicAudioDryRunEvidencePanel.tsx', 'utf8')
const fixtureSource = readFileSync('src/components/editor/sound/soundMusicAudioChatUiData.ts', 'utf8')
check(cardSource.includes('SoundMusicAudioDryRunEvidencePanel'), 'Sound card must render the dry-run evidence panel.')
check(cardSource.includes('props.dryRunEvidence'), 'Sound card must gate dry-run evidence on mock props.')
check(!fixtureSource.includes('mock-sound-music-audio-dry-run-contract'), 'Frontend fixture must not import backend dry-run contract helpers.')
check(!fixtureSource.includes('src/backend'), 'Frontend fixture must not import backend modules.')
for (const forbiddenLabel of ['Generate', 'Render', 'Export', 'Spend credits', 'Reserve credits', 'Start worker', 'Call provider', 'Upload', 'Publish', 'Create signed URL', 'Send to Cloud Run']) {
  check(!panelSource.includes(`>${forbiddenLabel}<`), `Dry-run evidence panel must not expose ${forbiddenLabel} action labels.`)
}

console.log(JSON.stringify({
  ok: true,
  workstream: evidence.workstream,
  smoke: 'sound-music-audio-dry-run-evidence-card',
  mode: evidence.mode,
  currentUnlockStage: evidence.currentUnlockStage,
  nextUnlockStage: evidence.nextUnlockStage,
  nextUnlockBlocked: evidence.nextUnlockBlocked,
  mayCallProvider: evidence.noSideEffectGates.mayCallProvider,
  mayDispatchWorker: evidence.noSideEffectGates.mayDispatchWorker,
  mayCreateGeneratedAsset: evidence.noSideEffectGates.mayCreateGeneratedAsset,
  publicArtifactAllowed: evidence.noSideEffectGates.publicArtifactAllowed,
  supabaseMutationAllowed: evidence.noSideEffectGates.supabaseMutationAllowed,
  gcpMutationAllowed: evidence.noSideEffectGates.gcpMutationAllowed,
  trackAFinalExportReady: evidence.trackHandoffs.trackAFinalExportReady,
}, null, 2))
