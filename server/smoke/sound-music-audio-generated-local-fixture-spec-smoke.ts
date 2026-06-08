import {
  SOUND_MUSIC_AUDIO_GENERATED_LOCAL_FIXTURE_SPEC,
  type SoundMusicAudioGeneratedLocalFixtureOwner,
  type SoundMusicAudioGeneratedLocalFixtureSpec,
} from '../../src/backend/mock/mock-sound-music-audio-generated-local-fixture-spec'
import type { SoundCueFamily, SoundProviderId } from '../../src/types/audio-music'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function assertNoForbiddenValues(value: unknown, path = 'spec'): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenValues(item, `${path}.${index}`))
    return
  }

  if (!value || typeof value !== 'object') return

  for (const [key, nested] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase()
    check(!normalizedKey.includes('rawworkerprompt'), `${path}.${key} must not expose a raw worker prompt field.`)
    check(!normalizedKey.includes('apikey'), `${path}.${key} must not expose an API key field.`)
    check(!normalizedKey.includes('api_key'), `${path}.${key} must not expose an API key field.`)
    check(normalizedKey !== 'servicerolekey', `${path}.${key} must not expose a service-role key field.`)
    check(normalizedKey !== 'service_role_key', `${path}.${key} must not expose a service-role key field.`)

    if (typeof nested === 'string') {
      const normalizedValue = nested.toLowerCase()
      check(!/^https?:\/\//i.test(nested), `${path}.${key} must not contain a public URL.`)
      check(!normalizedValue.startsWith('gs://'), `${path}.${key} must not contain a storage URI.`)
      check(!normalizedValue.startsWith('gcs://'), `${path}.${key} must not contain a storage URI.`)
      check(!normalizedValue.includes('storage.googleapis.com'), `${path}.${key} must not contain a storage URL.`)
      check(!normalizedValue.includes('x-goog-signature'), `${path}.${key} must not contain a signed URL signature.`)
      check(!normalizedValue.includes('x-amz-signature'), `${path}.${key} must not contain a signed URL signature.`)
      check(!normalizedValue.includes('signature='), `${path}.${key} must not contain a signed URL signature.`)
      check(!normalizedValue.includes('token='), `${path}.${key} must not contain a tokenized URL value.`)
      check(!normalizedValue.includes('api_key'), `${path}.${key} must not contain an API key value.`)
      check(!normalizedValue.includes('apikey'), `${path}.${key} must not contain an API key value.`)
      check(!normalizedValue.includes('service_role'), `${path}.${key} must not contain a service-role value.`)
      check(!normalizedValue.includes('service-role'), `${path}.${key} must not contain a service-role value.`)
      check(!normalizedValue.includes('provider_secret'), `${path}.${key} must not contain a provider credential value.`)
      check(!normalizedValue.includes('secret='), `${path}.${key} must not contain a secret value.`)
      check(!normalizedValue.includes('sk-'), `${path}.${key} must not contain a provider credential shape.`)
      check(!/akia[0-9a-z]{12,}/i.test(nested), `${path}.${key} must not contain an access key shape.`)
    }

    assertNoForbiddenValues(nested, `${path}.${key}`)
  }
}

function requireOwner(spec: SoundMusicAudioGeneratedLocalFixtureSpec, owner: SoundMusicAudioGeneratedLocalFixtureOwner): void {
  const ownerEntry = spec.ownerAcceptanceMap.find((candidate) => candidate.owner === owner)
  check(Boolean(ownerEntry), `Owner acceptance map must include ${owner}.`)
  check(ownerEntry?.requiredBeforeFixtureExecution === true, `${owner} must be required before fixture execution.`)
  check(ownerEntry?.mayExecute === false, `${owner} must not be allowed to execute from this spec.`)
}

function requireProviderBlocked(spec: SoundMusicAudioGeneratedLocalFixtureSpec, providerId: SoundProviderId): void {
  check(
    spec.providerRules.providerCallAllowedByProvider[providerId] === false,
    `${providerId} provider calls must be blocked.`,
  )
}

function requireLyriaFamily(spec: SoundMusicAudioGeneratedLocalFixtureSpec, family: SoundCueFamily): void {
  check(spec.providerRules.lyriaAllowedFamilies.includes(family), `Lyria planning must include ${family}.`)
}

const spec = SOUND_MUSIC_AUDIO_GENERATED_LOCAL_FIXTURE_SPEC

check(spec.workstream === 'SOUND_MUSIC_AUDIO', 'Fixture spec must report SOUND_MUSIC_AUDIO ownership.')
check(spec.mode === 'generated_local_fixture_spec_only', 'Fixture spec must use generated_local_fixture_spec_only mode.')
check(spec.currentUnlockStage === 'dry_run_passed', 'Fixture spec must start from dry_run_passed.')
check(spec.targetFutureUnlockStage === 'generated_local_fixture_passed', 'Fixture spec must target generated_local_fixture_passed.')
check(spec.claimsGeneratedLocalFixturePassed === false, 'Fixture spec must not claim generated_local_fixture_passed.')

for (const [key, value] of Object.entries(spec.execution)) {
  check(value === false, `Execution gate ${key} must be false.`)
}
check(spec.execution.artifactCreated === false, 'Fixture artifacts must not be created.')
check(spec.execution.fixtureAudioCreated === false, 'Fixture audio must not be created.')
check(spec.execution.generatedAssetCreated === false, 'Generated assets must not be created.')
check(spec.execution.providerCallAllowed === false, 'Provider calls must be blocked.')
check(spec.execution.workerDispatchAllowed === false, 'Worker dispatch must be blocked.')
check(spec.execution.supabaseMutationAllowed === false, 'Supabase mutation must be blocked.')
check(spec.execution.sqlAllowed === false, 'SQL must be blocked.')
check(spec.execution.gcpMutationAllowed === false, 'GCP mutation must be blocked.')
check(spec.execution.dockerAllowed === false, 'Docker must be blocked.')
check(spec.execution.cloudRunAllowed === false, 'Cloud Run must be blocked.')
check(spec.execution.ffmpegAllowed === false, 'FFmpeg must be blocked.')
check(spec.execution.modelDownloadAllowed === false, 'Model downloads must be blocked.')
check(spec.execution.signedUrlCreationAllowed === false, 'Signed URL creation must be blocked.')
check(spec.execution.publicArtifactAllowed === false, 'Public artifacts must be blocked.')
check(spec.execution.creditOrApprovalRecordAllowed === false, 'Credit or approval records must be blocked.')

check(spec.fixtureArtifactPlan.fixtureArtifactId.startsWith('mock-reference-only-'), 'Fixture artifact id must be mock/reference-only.')
check(spec.fixtureArtifactPlan.workspaceId.startsWith('mock-reference-only-'), 'Workspace id must be mock/reference-only.')
check(spec.fixtureArtifactPlan.projectId.startsWith('mock-reference-only-'), 'Project id must be mock/reference-only.')
check(spec.fixtureArtifactPlan.approvedPlanSnapshotId.startsWith('mock-reference-only-'), 'Approved snapshot id must be mock/reference-only.')
check(spec.fixtureArtifactPlan.timingAwareCueManifestId.startsWith('mock-reference-only-'), 'Timing manifest id must be mock/reference-only.')
check(spec.fixtureArtifactPlan.privateAudioArtifactManifestId.startsWith('mock-reference-only-'), 'Private manifest id must be mock/reference-only.')
check(spec.fixtureArtifactPlan.sourceCueIds.length > 0, 'Fixture artifact plan must include source cue ids.')
check(spec.fixtureArtifactPlan.expectedDurationSeconds > 0, 'Fixture duration expectation must be positive.')
check(spec.fixtureArtifactPlan.expectedChannels === 2, 'Fixture channel expectation must be stereo.')
check(spec.fixtureArtifactPlan.expectedSampleRate === 48000, 'Fixture sample rate expectation must be 48 kHz.')
check(spec.fixtureArtifactPlan.expectedChecksumAlgorithm === 'sha256', 'Checksum algorithm must be sha256.')
check(spec.fixtureArtifactPlan.expectedChecksumValue.includes('placeholder-mock-only-sha256'), 'Checksum value must be placeholder/mock-only.')
check(spec.fixtureArtifactPlan.expectedPrivatePath.startsWith('placeholder-private-path-only/'), 'Private path must be placeholder/private-path-only.')
check(spec.fixtureArtifactPlan.metadataOnlyInThisSpec === true, 'Fixture plan must be metadata-only.')
check(spec.fixtureArtifactPlan.artifactCreated === false, 'Fixture artifact plan must not create artifacts.')

check(spec.sourceOfTruthPath.requiresSupabaseRow === true, 'Source-of-truth path must require Supabase row.')
check(spec.sourceOfTruthPath.requiresPrivateGcsPath === true, 'Source-of-truth path must require private GCS path.')
check(spec.sourceOfTruthPath.requiresManifest === true, 'Source-of-truth path must require a manifest.')
check(spec.sourceOfTruthPath.requiresChecksum === true, 'Source-of-truth path must require a checksum.')
check(spec.sourceOfTruthPath.requiresApprovedPlanSnapshot === true, 'Source-of-truth path must require approved plan snapshot.')
check(spec.sourceOfTruthPath.signedUrlsAreSourceOfTruth === false, 'Signed URLs must not be source of truth.')
check(spec.sourceOfTruthPath.publicUrlsAllowed === false, 'Public URLs must be blocked.')

check(spec.approvedSnapshotRequirements.approvedPlanSnapshotId.startsWith('mock-reference-only-'), 'Approved snapshot requirement id must be mock/reference-only.')
check(spec.approvedSnapshotRequirements.approvalStatus === 'mock_reference_only_future_row_required', 'Approval status must be mock/reference-only.')
check(spec.approvedSnapshotRequirements.immutablePlanVersion.length > 0, 'Immutable plan version is required.')
check(spec.approvedSnapshotRequirements.snapshotChecksum.includes('placeholder-mock-only-sha256'), 'Snapshot checksum must be placeholder/mock-only.')
check(spec.approvedSnapshotRequirements.sourceFindingIds.length > 0, 'Source finding ids are required.')
check(spec.approvedSnapshotRequirements.sourceIntentIds.length > 0, 'Source intent ids are required.')
check(spec.approvedSnapshotRequirements.revisionId.length > 0, 'Revision id is required.')
check(spec.approvedSnapshotRequirements.approvalTimestamp.length > 0, 'Approval timestamp metadata is required.')
check(spec.approvedSnapshotRequirements.fixtureScope === 'local_fixture_spec_only', 'Fixture scope must be local fixture spec only.')
check(spec.approvedSnapshotRequirements.rawPromptWorkerPayloadAllowed === false, 'Raw prompt worker payloads must be blocked.')
check(spec.approvedSnapshotRequirements.createsSnapshotInThisSpec === false, 'Spec must not create approved snapshots.')

check(spec.timingManifestRequirements.cueManifestId.startsWith('mock-reference-only-'), 'Cue manifest id must be mock/reference-only.')
check(spec.timingManifestRequirements.cueTimingsRequired === true, 'Cue timings are required.')
check(spec.timingManifestRequirements.timingAnchorsRequired === true, 'Timing anchors are required.')
check(spec.timingManifestRequirements.visualStoryReasonRequired === true, 'Visual/story reasons are required.')
check(spec.timingManifestRequirements.speechOverlapRequired === true, 'Speech overlap metadata is required.')
check(spec.timingManifestRequirements.duckingRequirementRequired === true, 'Ducking metadata is required.')
check(spec.timingManifestRequirements.soundSyncNotesRequired === true, 'SoundSync notes are required.')
check(spec.timingManifestRequirements.providerCandidateMetadataRequired === true, 'Provider candidate metadata is required.')
check(spec.timingManifestRequirements.runtimeMetadataRequired === true, 'Runtime metadata is required.')
check(spec.timingManifestRequirements.blockedUsesRequired === true, 'Blocked uses are required.')
check(spec.timingManifestRequirements.trackAFinalRenderReady === false, 'Track A final render must be blocked.')
check(spec.timingManifestRequirements.trackBExecutionAccepted === false, 'Track B execution must be blocked.')

check(spec.privateArtifactManifestRequirements.privateAudioArtifactManifestId.startsWith('mock-reference-only-'), 'Private manifest id must be mock/reference-only.')
check(spec.privateArtifactManifestRequirements.storageScope === 'private', 'Private artifact manifest must use private scope.')
check(spec.privateArtifactManifestRequirements.publicArtifactAllowed === false, 'Private manifest must block public artifacts.')
check(spec.privateArtifactManifestRequirements.signedUrlsPresent === false, 'Private manifest must not contain signed URLs.')
check(spec.privateArtifactManifestRequirements.generatedAssetIdsAllowedNow === false, 'Generated asset ids must be blocked now.')
check(spec.privateArtifactManifestRequirements.mediaAssetIdsAllowedNow === false, 'Media asset ids must be blocked now.')
check(spec.privateArtifactManifestRequirements.timingMapIdsAllowedNow === false, 'Timing map ids must be blocked now.')
check(spec.privateArtifactManifestRequirements.provenanceSummaryRequired === true, 'Provenance summary is required.')
check(spec.privateArtifactManifestRequirements.licensePolicyRequired === true, 'License policy is required.')
check(spec.privateArtifactManifestRequirements.qaEvidenceRefsRequired === true, 'QA evidence refs are required.')
check(spec.privateArtifactManifestRequirements.blockedUsesRequired === true, 'Blocked uses are required in private manifest.')
check(spec.privateArtifactManifestRequirements.handoffTargetsRequired === true, 'Handoff targets are required.')

check(spec.providerRules.lyriaMusicOnly === true, 'Lyria must be music/song/soundtrack planning only.')
requireLyriaFamily(spec, 'music_cue')
requireLyriaFamily(spec, 'soundtrack_layer')
requireLyriaFamily(spec, 'audio_mood_design')
check(!spec.providerRules.lyriaAllowedFamilies.includes('action_foley_sfx'), 'Lyria must not be allowed for SFX.')
check(!spec.providerRules.lyriaAllowedFamilies.includes('ambient_everyday_soundscape'), 'Lyria must not be allowed for ambience.')
check(spec.providerRules.lyriaSfxAllowed === false, 'Lyria SFX use must be blocked.')
check(spec.providerRules.lyriaFoleyAllowed === false, 'Lyria foley use must be blocked.')
check(spec.providerRules.lyriaAmbienceAllowed === false, 'Lyria ambience use must be blocked.')
check(spec.providerRules.lyriaGenerationAllowed === false, 'Lyria generation must be blocked.')
check(spec.providerRules.providerGatewayOwnerRequired === true, 'Provider Gateway owner must be required.')

for (const providerId of Object.keys(spec.providerRules.providerCallAllowedByProvider) as SoundProviderId[]) {
  requireProviderBlocked(spec, providerId)
}
for (const providerId of [
  'dasheng_audiogen_candidate',
  'stable_audio_open_license_gated',
  'openmoss_moss_soundeffect_v2_pending_verification',
  'meta_audiogen_disabled',
  'woosh_disabled',
  'tangoflux_disabled',
  'mmaudio_disabled',
  'audioflux_analysis_only',
  'signalsmith_stretch_processing_only',
  'deepfilternet_review_required',
  'rnnoise_review_required',
  'demucs_review_required',
] satisfies SoundProviderId[]) {
  requireProviderBlocked(spec, providerId)
}

check(spec.workerRuntimeRules.workerDispatchAllowed === false, 'Worker dispatch must be blocked.')
check(spec.workerRuntimeRules.productionWorkerPayloadExecutionAllowed === false, 'Production worker payload execution must be blocked.')
check(spec.workerRuntimeRules.idempotencyKeyExpected === true, 'Idempotency key must be expected.')
check(spec.workerRuntimeRules.idempotencyKey.startsWith('mock-reference-only-'), 'Idempotency key must be mock/reference-only.')
check(spec.workerRuntimeRules.approvedSnapshotRequired === true, 'Approved snapshot must be required.')
check(spec.workerRuntimeRules.rawPromptExecutionAllowed === false, 'Raw prompt execution must be blocked.')
check(spec.workerRuntimeRules.signedUrlInputAllowed === false, 'Signed URL worker input must be blocked.')
check(spec.workerRuntimeRules.serviceRoleKeyAllowed === false, 'Service-role key input must be blocked.')
check(spec.workerRuntimeRules.providerSecretAllowed === false, 'Provider secrets must be blocked.')
check(spec.workerRuntimeRules.workerRuntimeOwnerRequired === true, 'Worker Runtime owner must be required.')

check(spec.supabaseStorageRules.supabaseMutationAllowed === false, 'Supabase mutation must be blocked.')
check(spec.supabaseStorageRules.sqlAllowed === false, 'SQL must be blocked.')
check(spec.supabaseStorageRules.migrationAllowed === false, 'Migrations must be blocked.')
check(spec.supabaseStorageRules.storageBucketCreationAllowed === false, 'Storage bucket creation must be blocked.')
check(spec.supabaseStorageRules.storageObjectCreationAllowed === false, 'Storage object creation must be blocked.')
check(spec.supabaseStorageRules.signedUrlSourceOfTruthAllowed === false, 'Signed URL source-of-truth must be blocked.')
check(spec.supabaseStorageRules.publicArtifactAllowed === false, 'Public artifacts must be blocked by Supabase rules.')
check(spec.supabaseStorageRules.supabaseOwnerRequiredBeforeExecution === true, 'Supabase owner must be required before execution.')

check(spec.qaObservabilityBillingRules.qaMetadataExpected === true, 'QA metadata must be expected.')
check(spec.qaObservabilityBillingRules.persistedQaReportCreatedNow === false, 'Persisted QA reports must not be created.')
check(spec.qaObservabilityBillingRules.observabilityOwnerRequired === true, 'Observability owner must be required.')
check(spec.qaObservabilityBillingRules.billingOwnerRequired === true, 'Billing owner must be required.')
check(spec.qaObservabilityBillingRules.creditEstimateCreatedNow === false, 'Credit estimates must not be created.')
check(spec.qaObservabilityBillingRules.creditApprovalCreatedNow === false, 'Credit approvals must not be created.')
check(spec.qaObservabilityBillingRules.creditReservationCreatedNow === false, 'Credit reservations must not be created.')
check(spec.qaObservabilityBillingRules.spendOccurred === false, 'Spend must not occur.')
check(spec.qaObservabilityBillingRules.refundOrReleaseOccurred === false, 'Refund/release must not occur.')

check(spec.trackRules.trackAOwnerRequired === true, 'Track A owner must be required.')
check(spec.trackRules.trackAFinalExportReady === false, 'Track A final export must be blocked.')
check(spec.trackRules.trackBOwnerRequired === true, 'Track B owner must be required.')
check(spec.trackRules.trackBExecutionAccepted === false, 'Track B execution must be blocked.')

for (const owner of [
  'SOUND_MUSIC_AUDIO',
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
] satisfies SoundMusicAudioGeneratedLocalFixtureOwner[]) {
  requireOwner(spec, owner)
}

for (const blockedUse of [
  'provider_gateway_handoff_required',
  'worker_runtime_handoff_required',
  'supabase_mutation_blocked',
  'storage_object_not_allowed',
  'signed_url_blocked',
  'public_artifact_blocked',
  'generated_asset_not_allowed',
  'credit_approval_required',
  'final_render_export_not_owned',
]) {
  check(spec.blockedUses.includes(blockedUse), `Blocked use ${blockedUse} must be listed.`)
}

check(
  spec.nextAllowedPromptRecommendation === 'SOUND-3C: local fixture spec UI surfacing or handoff packet, no artifact creation',
  'Next prompt recommendation must be SOUND-3C.',
)

assertNoForbiddenValues(spec)

console.log(JSON.stringify({
  ok: true,
  workstream: spec.workstream,
  smoke: 'sound-music-audio-generated-local-fixture-spec',
  mode: spec.mode,
  currentUnlockStage: spec.currentUnlockStage,
  targetFutureUnlockStage: spec.targetFutureUnlockStage,
  claimsGeneratedLocalFixturePassed: spec.claimsGeneratedLocalFixturePassed,
  artifactCreated: spec.execution.artifactCreated,
  mayCallProvider: spec.execution.providerCallAllowed,
  mayDispatchWorker: spec.execution.workerDispatchAllowed,
  mayCreateGeneratedAsset: spec.execution.generatedAssetCreated,
  publicArtifactAllowed: spec.execution.publicArtifactAllowed,
  supabaseMutationAllowed: spec.execution.supabaseMutationAllowed,
  gcpMutationAllowed: spec.execution.gcpMutationAllowed,
  trackAFinalExportReady: spec.trackRules.trackAFinalExportReady,
}, null, 2))
