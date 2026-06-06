import {
  createMockSoundMusicAudioDryRunContract,
  validateMockSoundMusicAudioDryRunContract,
  type SoundMusicAudioDryRunContract,
} from '../../src/backend/mock/mock-sound-music-audio-dry-run-contract'
import type { SoundProviderId, SoundRelatedWorkstreamId } from '../../src/types/audio-music'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function assertNoNetworkOrCredentialValues(value: unknown, path = 'contract'): void {
  if (!value || typeof value !== 'object') return

  for (const [key, nested] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase()
    check(!normalizedKey.includes('apikey'), `${path}.${key} must not expose an API key field.`)
    check(!normalizedKey.includes('api_key'), `${path}.${key} must not expose an API key field.`)
    check(normalizedKey !== 'servicerolekey', `${path}.${key} must not expose a service-role key field.`)
    check(normalizedKey !== 'service_role_key', `${path}.${key} must not expose a service-role key field.`)

    if (typeof nested === 'string') {
      const normalizedValue = nested.toLowerCase()
      check(!/^https?:\/\//i.test(nested), `${path}.${key} must not contain a public URL.`)
      check(!normalizedValue.startsWith('gs://'), `${path}.${key} must not contain a storage URI.`)
      check(!normalizedValue.includes('x-goog-signature'), `${path}.${key} must not contain a signed URL signature.`)
      check(!normalizedValue.includes('signature='), `${path}.${key} must not contain a signed URL signature.`)
      check(!normalizedValue.includes('api_key'), `${path}.${key} must not contain an API key value.`)
      check(!normalizedValue.includes('service_role'), `${path}.${key} must not contain a service-role value.`)
      check(!normalizedValue.includes('sk-'), `${path}.${key} must not contain a provider credential shape.`)
    }

    assertNoNetworkOrCredentialValues(nested, `${path}.${key}`)
  }
}

function requireHandoff(contract: SoundMusicAudioDryRunContract, owner: SoundRelatedWorkstreamId): void {
  check(contract.requiredHandoffs.includes(owner), `Dry-run contract must require ${owner} handoff.`)
}

function requireProvider(providerIds: SoundProviderId[], providerId: SoundProviderId, message: string): void {
  check(providerIds.includes(providerId), message)
}

const contract = createMockSoundMusicAudioDryRunContract()
const validation = validateMockSoundMusicAudioDryRunContract(contract)

check(validation.ok, `Dry-run contract validation failed: ${validation.errors.join('; ')}`)
check(contract.workstream === 'SOUND_MUSIC_AUDIO', 'Dry-run contract must report SOUND_MUSIC_AUDIO ownership.')
check(contract.mode === 'mock_dry_run_contract', 'Dry-run contract must use mock_dry_run_contract mode.')
check(contract.dryRunRequestId.startsWith('mock-'), 'Dry-run request id must be mock-prefixed.')
check(contract.structuredFindingIds.length > 0, 'Dry-run contract must include structured finding ids.')
check(contract.editIntentIds.length > 0, 'Dry-run contract must include edit intent ids.')
check(contract.derivedFromStructuredInputs === true, 'Dry-run contract must be derived from structured findings/edit intents.')
check(contract.rawChatAsWorkerPlanAllowed === false, 'Raw chat must not become a worker execution plan.')

check(contract.approvedSnapshot.approvedPlanSnapshotId.length > 0, 'Approved snapshot id is required.')
check(contract.approvedSnapshot.approvalStatus === 'mock_approved_reference_only', 'Approved snapshot must be mock reference only.')
check(contract.approvedSnapshot.snapshotChecksum.length > 0, 'Approved snapshot checksum is required.')
check(contract.approvedSnapshot.immutablePlanVersion.length > 0, 'Approved snapshot immutable version is required.')
check(contract.approvedSnapshot.approvedAt.length > 0, 'Approved snapshot approvedAt metadata is required.')
check(contract.approvedSnapshot.sourceFindingIds.length > 0, 'Approved snapshot source finding ids are required.')
check(contract.approvedSnapshot.sourceIntentIds.length > 0, 'Approved snapshot source intent ids are required.')
check(contract.approvedSnapshot.revisionId.length > 0, 'Approved snapshot revision id is required.')
check(contract.approvedSnapshot.metadataOnly === true, 'Approved snapshot must remain metadata-only.')
check(contract.approvedSnapshot.createsSnapshot === false, 'Dry-run contract must not create approved snapshot records.')
check(contract.approvedSnapshot.blocksGeneratedLocalFixture === true, 'Generated/local fixture must remain blocked.')

check(contract.timingAwareCueManifest.metadataOnly === true, 'Timing manifest must remain metadata-only.')
check(contract.timingAwareCueManifest.cues.length > 0, 'Timing manifest must include cues.')
for (const cue of contract.timingAwareCueManifest.cues) {
  check(cue.startTimeSeconds >= 0, `${cue.cueId} must include a cue start time.`)
  check(cue.endTimeSeconds >= cue.startTimeSeconds, `${cue.cueId} must include a valid cue end time.`)
  check(cue.durationSeconds >= 0, `${cue.cueId} must include cue duration.`)
  check(Boolean(cue.anchorType), `${cue.cueId} must include anchor metadata.`)
  check(Boolean(cue.visualOrStoryReason), `${cue.cueId} must include reason metadata.`)
}
check(contract.timingAwareCueManifest.trackAFinalRenderReady === false, 'Track A final render readiness must be false.')
check(contract.timingAwareCueManifest.providerExecutionReady === false, 'Provider execution readiness must be false.')
check(contract.timingAwareCueManifest.workerExecutionReady === false, 'Worker execution readiness must be false.')
check((contract.timingAwareCueManifest.generatedAssetIds?.length ?? 0) === 0, 'Timing manifest must not reference generated assets.')

check(contract.privateAudioArtifactManifest.metadataOnly === true, 'Private artifact manifest must remain metadata-only.')
check(contract.privateAudioArtifactManifest.storageScope === 'private', 'Private artifact manifest must stay private scoped.')
check(contract.privateAudioArtifactManifest.publicArtifactAllowed === false, 'Private artifact manifest must disallow public artifacts.')
check((contract.privateAudioArtifactManifest.generatedAssetIds?.length ?? 0) === 0, 'Private manifest must not reference generated assets.')

check(contract.providerGatewayHandoff.owner === 'PROVIDER_GATEWAY_MODELS', 'Provider Gateway owner must be set.')
check(contract.providerGatewayHandoff.transportAllowed === false, 'Provider transport must be blocked.')
check(contract.providerGatewayHandoff.mayCallProvider === false, 'Provider calls must be blocked.')
check(contract.providerGatewayHandoff.providerSecretsAllowed === false, 'Provider secrets must be blocked.')
check(contract.providerGatewayHandoff.secretManagerRefsOnly === true, 'Provider handoff may only describe future reference-name boundaries.')
check(contract.providerGatewayHandoff.fallbackExecutionAllowed === false, 'Provider fallback execution must be blocked.')
check(contract.providerGatewayHandoff.lyriaPlanning.providerId === 'lyria_mock', 'Lyria mock metadata must be present.')
check(contract.providerGatewayHandoff.lyriaPlanning.allowedFamilies.includes('music_cue'), 'Lyria must support music cue planning only.')
check(contract.providerGatewayHandoff.lyriaPlanning.allowedFamilies.includes('soundtrack_layer'), 'Lyria must support soundtrack layer planning only.')
check(contract.providerGatewayHandoff.lyriaPlanning.allowedFamilies.includes('audio_mood_design'), 'Lyria must support music mood planning only.')
check(contract.providerGatewayHandoff.lyriaPlanning.usedForSfxFoleyAmbience === false, 'Lyria must not be used for SFX, foley, or ambience.')
check(contract.providerGatewayHandoff.lyriaPlanning.generationEnabled === false, 'Lyria generation must be disabled.')
check(contract.providerGatewayHandoff.lyriaPlanning.providerGatewayRequired === true, 'Lyria must require Provider Gateway handoff.')

for (const providerId of [
  'openmoss_moss_soundeffect_v2_pending_verification',
  'meta_audiogen_disabled',
  'woosh_disabled',
  'tangoflux_disabled',
  'mmaudio_disabled',
] satisfies SoundProviderId[]) {
  requireProvider(contract.providerGatewayHandoff.blockedProviders, providerId, `${providerId} must remain blocked.`)
}
for (const providerId of ['dasheng_audiogen_candidate', 'stable_audio_open_license_gated'] satisfies SoundProviderId[]) {
  requireProvider(contract.providerGatewayHandoff.licenseGatedPlanningProviders, providerId, `${providerId} must remain license-gated planning metadata.`)
}
for (const providerId of ['audioflux_analysis_only', 'signalsmith_stretch_processing_only'] satisfies SoundProviderId[]) {
  requireProvider(contract.providerGatewayHandoff.processingOnlyProviders, providerId, `${providerId} must remain analysis/processing-only.`)
}
for (const providerId of ['deepfilternet_review_required', 'rnnoise_review_required', 'demucs_review_required'] satisfies SoundProviderId[]) {
  requireProvider(contract.providerGatewayHandoff.reviewGatedProcessingProviders, providerId, `${providerId} must remain review/model-weight/readiness gated.`)
}

check(contract.workerRuntimeHandoff.owner === 'WORKER_RUNTIME_JOBS', 'Worker Runtime owner must be set.')
check(contract.workerRuntimeHandoff.mayDispatchWorker === false, 'Worker dispatch must be blocked.')
check(contract.workerRuntimeHandoff.workerPayloadCreated === false, 'Dry-run must not create a worker payload.')
check(contract.workerRuntimeHandoff.productionWorkerPayloadAllowed === false, 'Dry-run must not allow production worker payloads.')
check(contract.workerRuntimeHandoff.requiresApprovedSnapshot === true, 'Worker handoff must require approved snapshots.')
check(contract.workerRuntimeHandoff.requiresIdempotencyKey === true, 'Worker handoff must require idempotency keys.')
check(contract.workerRuntimeHandoff.idempotencyKey.startsWith('mock-'), 'Worker idempotency metadata must be mock-prefixed.')
check(contract.workerRuntimeHandoff.rawPromptExecutionAllowed === false, 'Raw prompt execution must be blocked.')
check(contract.workerRuntimeHandoff.signedUrlInputAllowed === false, 'Signed URL worker input must be blocked.')
check(contract.workerRuntimeHandoff.serviceRoleKeyAllowed === false, 'Service-role keys must be blocked.')
check(contract.workerRuntimeHandoff.providerSecretAllowed === false, 'Provider secrets must be blocked.')
check(contract.workerRuntimeHandoff.generatedAssetCreationAllowed === false, 'Generated asset creation must be blocked.')

check(contract.supabaseStorageHandoff.owner === 'SUPABASE_RLS_STORAGE_DATABASE', 'Supabase owner must be set.')
check(contract.supabaseStorageHandoff.mayMutateSupabase === false, 'Supabase mutation must be blocked.')
check(contract.supabaseStorageHandoff.mayWriteStorage === false, 'Storage writes must be blocked.')
check(contract.supabaseStorageHandoff.sqlAllowed === false, 'SQL must be blocked.')
check(contract.supabaseStorageHandoff.migrationAllowed === false, 'Migrations must be blocked.')
check(contract.supabaseStorageHandoff.signedUrlSourceOfTruthAllowed === false, 'Signed URLs must not be source of truth.')
check(contract.supabaseStorageHandoff.publicArtifactAllowed === false, 'Public artifacts must be blocked.')
check(contract.supabaseStorageHandoff.requiredFutureTablesOrRecords.includes('approved_plan_snapshots'), 'Approved snapshot future table must be listed.')
check(contract.supabaseStorageHandoff.requiredFutureTablesOrRecords.includes('worker_runtime_configs'), 'Worker runtime config future table must be listed.')
check(contract.supabaseStorageHandoff.requiredFutureTablesOrRecords.includes('storage_object_records'), 'Storage object record future table must be listed.')

check(contract.qaObservabilityCostHandoff.observabilityOwner === 'OBSERVABILITY_AUDIT_COST', 'Observability owner must be set.')
check(contract.qaObservabilityCostHandoff.billingOwner === 'BILLING_STRIPE_CREDITS', 'Billing owner must be set.')
check(contract.qaObservabilityCostHandoff.qaEvidencePersisted === false, 'QA evidence must not be persisted.')
check(contract.qaObservabilityCostHandoff.creditEstimateCreated === false, 'Credit estimates must not be created.')
check(contract.qaObservabilityCostHandoff.creditApprovalCreated === false, 'Credit approvals must not be created.')
check(contract.qaObservabilityCostHandoff.creditReservationCreated === false, 'Credit reservations must not be created.')
check(contract.qaObservabilityCostHandoff.spendOccurred === false, 'Credit spend must not occur.')
check(contract.qaObservabilityCostHandoff.refundOrReleaseOccurred === false, 'Credit refund/release must not occur.')

check(contract.trackHandoffs.trackAOwner === 'TRACK_A_RENDER_EXPORT', 'Track A owner must be set.')
check(contract.trackHandoffs.trackAFinalExportReady === false, 'Track A final export readiness must be false.')
check(contract.trackHandoffs.finalMuxExportAllowed === false, 'Final mux/export must be blocked.')
check(contract.trackHandoffs.trackBOwner === 'TRACK_B_MEDIA_PROCESSING', 'Track B owner must be set.')
check(contract.trackHandoffs.trackBExecutionAccepted === false, 'Track B processing execution must not be accepted.')

for (const owner of [
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
] satisfies SoundRelatedWorkstreamId[]) {
  requireHandoff(contract, owner)
}

for (const [key, value] of Object.entries(contract.assertions)) {
  check(value === false, `No-side-effect assertion ${key} must be false.`)
}
check(contract.blockedUses.includes('provider_gateway_handoff_required'), 'Provider Gateway blocked use must be present.')
check(contract.blockedUses.includes('worker_runtime_handoff_required'), 'Worker Runtime blocked use must be present.')
check(contract.blockedUses.includes('supabase_mutation_blocked'), 'Supabase blocked use must be present.')
check(contract.blockedUses.includes('final_render_export_not_owned'), 'Track A/final export blocked use must be present.')

assertNoNetworkOrCredentialValues(contract)

console.log(JSON.stringify({
  ok: true,
  workstream: contract.workstream,
  smoke: 'sound-music-audio-dry-run-contracts',
  mode: contract.mode,
  mayCallProvider: false,
  mayDispatchWorker: false,
  mayCreateGeneratedAsset: false,
  publicArtifactAllowed: false,
  supabaseMutationAllowed: false,
  gcpMutationAllowed: false,
  trackAFinalExportReady: false,
  requiredHandoffs: contract.requiredHandoffs,
}, null, 2))
