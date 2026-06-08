import type { SoundCueFamily, SoundProviderId, SoundRelatedWorkstreamId } from '../../types/audio-music'

export type SoundMusicAudioGeneratedLocalFixtureSpecMode = 'generated_local_fixture_spec_only'

export type SoundMusicAudioGeneratedLocalFixtureUnlockStage =
  | 'dry_run_passed'
  | 'generated_local_fixture_passed'

export type SoundMusicAudioGeneratedLocalFixtureOwner =
  | 'SOUND_MUSIC_AUDIO'
  | SoundRelatedWorkstreamId

export interface SoundMusicAudioGeneratedLocalFixtureSpec {
  workstream: 'SOUND_MUSIC_AUDIO'
  mode: SoundMusicAudioGeneratedLocalFixtureSpecMode
  currentUnlockStage: Extract<SoundMusicAudioGeneratedLocalFixtureUnlockStage, 'dry_run_passed'>
  targetFutureUnlockStage: Extract<SoundMusicAudioGeneratedLocalFixtureUnlockStage, 'generated_local_fixture_passed'>
  claimsGeneratedLocalFixturePassed: false
  execution: {
    artifactCreated: false
    fixtureAudioCreated: false
    generatedAssetCreated: false
    providerCallAllowed: false
    workerDispatchAllowed: false
    supabaseMutationAllowed: false
    sqlAllowed: false
    gcpMutationAllowed: false
    dockerAllowed: false
    cloudRunAllowed: false
    ffmpegAllowed: false
    modelDownloadAllowed: false
    signedUrlCreationAllowed: false
    publicArtifactAllowed: false
    creditOrApprovalRecordAllowed: false
  }
  fixtureArtifactPlan: {
    fixtureArtifactId: string
    fixtureKind: 'sound_music_audio_local_fixture_audio_placeholder'
    workspaceId: string
    projectId: string
    approvedPlanSnapshotId: string
    timingAwareCueManifestId: string
    privateAudioArtifactManifestId: string
    sourceCueIds: string[]
    expectedDurationSeconds: number
    expectedChannels: 2
    expectedSampleRate: 48000
    expectedLoudnessRange: {
      minLufs: number
      maxLufs: number
      metadataOnly: true
    }
    expectedChecksumAlgorithm: 'sha256'
    expectedChecksumValue: string
    expectedPrivatePath: string
    metadataOnlyInThisSpec: true
    artifactCreated: false
  }
  sourceOfTruthPath: {
    requiresSupabaseRow: true
    requiresPrivateGcsPath: true
    requiresManifest: true
    requiresChecksum: true
    requiresApprovedPlanSnapshot: true
    signedUrlsAreSourceOfTruth: false
    publicUrlsAllowed: false
  }
  approvedSnapshotRequirements: {
    approvedPlanSnapshotId: string
    approvalStatus: 'mock_reference_only_future_row_required'
    immutablePlanVersion: string
    snapshotChecksum: string
    sourceFindingIds: string[]
    sourceIntentIds: string[]
    revisionId: string
    approvalTimestamp: string
    fixtureScope: 'local_fixture_spec_only'
    rawPromptWorkerPayloadAllowed: false
    createsSnapshotInThisSpec: false
  }
  timingManifestRequirements: {
    cueManifestId: string
    cueTimingsRequired: true
    timingAnchorsRequired: true
    visualStoryReasonRequired: true
    speechOverlapRequired: true
    duckingRequirementRequired: true
    soundSyncNotesRequired: true
    providerCandidateMetadataRequired: true
    runtimeMetadataRequired: true
    blockedUsesRequired: true
    trackAFinalRenderReady: false
    trackBExecutionAccepted: false
  }
  privateArtifactManifestRequirements: {
    privateAudioArtifactManifestId: string
    storageScope: 'private'
    publicArtifactAllowed: false
    signedUrlsPresent: false
    generatedAssetIdsAllowedNow: false
    mediaAssetIdsAllowedNow: false
    timingMapIdsAllowedNow: false
    provenanceSummaryRequired: true
    licensePolicyRequired: true
    qaEvidenceRefsRequired: true
    blockedUsesRequired: true
    handoffTargetsRequired: true
  }
  providerRules: {
    lyriaMusicOnly: true
    lyriaAllowedFamilies: SoundCueFamily[]
    lyriaSfxAllowed: false
    lyriaFoleyAllowed: false
    lyriaAmbienceAllowed: false
    lyriaGenerationAllowed: false
    providerCallAllowedByProvider: Record<SoundProviderId, false>
    providerGatewayOwnerRequired: true
  }
  workerRuntimeRules: {
    workerDispatchAllowed: false
    productionWorkerPayloadExecutionAllowed: false
    idempotencyKeyExpected: true
    idempotencyKey: string
    approvedSnapshotRequired: true
    rawPromptExecutionAllowed: false
    signedUrlInputAllowed: false
    serviceRoleKeyAllowed: false
    providerSecretAllowed: false
    workerRuntimeOwnerRequired: true
  }
  supabaseStorageRules: {
    supabaseMutationAllowed: false
    sqlAllowed: false
    migrationAllowed: false
    storageBucketCreationAllowed: false
    storageObjectCreationAllowed: false
    signedUrlSourceOfTruthAllowed: false
    publicArtifactAllowed: false
    supabaseOwnerRequiredBeforeExecution: true
  }
  qaObservabilityBillingRules: {
    qaMetadataExpected: true
    persistedQaReportCreatedNow: false
    observabilityOwnerRequired: true
    billingOwnerRequired: true
    creditEstimateCreatedNow: false
    creditApprovalCreatedNow: false
    creditReservationCreatedNow: false
    spendOccurred: false
    refundOrReleaseOccurred: false
  }
  trackRules: {
    trackAOwnerRequired: true
    trackAFinalExportReady: false
    trackBOwnerRequired: true
    trackBExecutionAccepted: false
  }
  ownerAcceptanceMap: {
    owner: SoundMusicAudioGeneratedLocalFixtureOwner
    requiredBeforeFixtureExecution: boolean
    acceptedForSpecOnly: boolean
    mayExecute: false
  }[]
  blockedUses: string[]
  nextAllowedPromptRecommendation: 'SOUND-3C: local fixture spec UI surfacing or handoff packet, no artifact creation'
}

const ownerAcceptanceMap: SoundMusicAudioGeneratedLocalFixtureSpec['ownerAcceptanceMap'] = [
  {
    owner: 'SOUND_MUSIC_AUDIO',
    requiredBeforeFixtureExecution: true,
    acceptedForSpecOnly: true,
    mayExecute: false,
  },
  {
    owner: 'PROVIDER_GATEWAY_MODELS',
    requiredBeforeFixtureExecution: true,
    acceptedForSpecOnly: false,
    mayExecute: false,
  },
  {
    owner: 'WORKER_RUNTIME_JOBS',
    requiredBeforeFixtureExecution: true,
    acceptedForSpecOnly: false,
    mayExecute: false,
  },
  {
    owner: 'SUPABASE_RLS_STORAGE_DATABASE',
    requiredBeforeFixtureExecution: true,
    acceptedForSpecOnly: false,
    mayExecute: false,
  },
  {
    owner: 'OBSERVABILITY_AUDIT_COST',
    requiredBeforeFixtureExecution: true,
    acceptedForSpecOnly: false,
    mayExecute: false,
  },
  {
    owner: 'BILLING_STRIPE_CREDITS',
    requiredBeforeFixtureExecution: true,
    acceptedForSpecOnly: false,
    mayExecute: false,
  },
  {
    owner: 'TRACK_A_RENDER_EXPORT',
    requiredBeforeFixtureExecution: true,
    acceptedForSpecOnly: false,
    mayExecute: false,
  },
  {
    owner: 'TRACK_B_MEDIA_PROCESSING',
    requiredBeforeFixtureExecution: true,
    acceptedForSpecOnly: false,
    mayExecute: false,
  },
]

const providerCallAllowedByProvider: Record<SoundProviderId, false> = {
  mock_sfx_provider: false,
  mock_music_provider: false,
  lyria_mock: false,
  mirelo_sfx_mock: false,
  mmaudio_mock: false,
  dasheng_audiogen_candidate: false,
  stable_audio_open_license_gated: false,
  openmoss_moss_soundeffect_v2_pending_verification: false,
  meta_audiogen_disabled: false,
  woosh_disabled: false,
  tangoflux_disabled: false,
  mmaudio_disabled: false,
  audioflux_analysis_only: false,
  signalsmith_stretch_processing_only: false,
  deepfilternet_review_required: false,
  rnnoise_review_required: false,
  demucs_review_required: false,
}

export const SOUND_MUSIC_AUDIO_GENERATED_LOCAL_FIXTURE_SPEC = {
  workstream: 'SOUND_MUSIC_AUDIO',
  mode: 'generated_local_fixture_spec_only',
  currentUnlockStage: 'dry_run_passed',
  targetFutureUnlockStage: 'generated_local_fixture_passed',
  claimsGeneratedLocalFixturePassed: false,
  execution: {
    artifactCreated: false,
    fixtureAudioCreated: false,
    generatedAssetCreated: false,
    providerCallAllowed: false,
    workerDispatchAllowed: false,
    supabaseMutationAllowed: false,
    sqlAllowed: false,
    gcpMutationAllowed: false,
    dockerAllowed: false,
    cloudRunAllowed: false,
    ffmpegAllowed: false,
    modelDownloadAllowed: false,
    signedUrlCreationAllowed: false,
    publicArtifactAllowed: false,
    creditOrApprovalRecordAllowed: false,
  },
  fixtureArtifactPlan: {
    fixtureArtifactId: 'mock-reference-only-sound-3b-local-fixture-artifact',
    fixtureKind: 'sound_music_audio_local_fixture_audio_placeholder',
    workspaceId: 'mock-reference-only-workspace-sound-3b',
    projectId: 'mock-reference-only-project-sound-3b',
    approvedPlanSnapshotId: 'mock-reference-only-approved-plan-snapshot-sound-3b',
    timingAwareCueManifestId: 'mock-reference-only-timing-aware-cue-manifest-sound-3b',
    privateAudioArtifactManifestId: 'mock-reference-only-private-audio-artifact-manifest-sound-3b',
    sourceCueIds: [
      'mock-reference-only-cue-action-foley-001',
      'mock-reference-only-cue-ambience-001',
      'mock-reference-only-cue-music-001',
    ],
    expectedDurationSeconds: 12,
    expectedChannels: 2,
    expectedSampleRate: 48000,
    expectedLoudnessRange: {
      minLufs: -24,
      maxLufs: -14,
      metadataOnly: true,
    },
    expectedChecksumAlgorithm: 'sha256',
    expectedChecksumValue: 'placeholder-mock-only-sha256-not-a-real-artifact-checksum',
    expectedPrivatePath: 'placeholder-private-path-only/sound-music-audio/local-fixture/mock-reference-only-artifact',
    metadataOnlyInThisSpec: true,
    artifactCreated: false,
  },
  sourceOfTruthPath: {
    requiresSupabaseRow: true,
    requiresPrivateGcsPath: true,
    requiresManifest: true,
    requiresChecksum: true,
    requiresApprovedPlanSnapshot: true,
    signedUrlsAreSourceOfTruth: false,
    publicUrlsAllowed: false,
  },
  approvedSnapshotRequirements: {
    approvedPlanSnapshotId: 'mock-reference-only-approved-plan-snapshot-sound-3b',
    approvalStatus: 'mock_reference_only_future_row_required',
    immutablePlanVersion: 'mock-reference-only-sound-plan-version-3b-001',
    snapshotChecksum: 'placeholder-mock-only-sha256-approved-plan-snapshot',
    sourceFindingIds: [
      'mock-reference-only-structured-finding-dialogue-safety',
      'mock-reference-only-structured-finding-timing-cue',
    ],
    sourceIntentIds: [
      'mock-reference-only-edit-intent-sound-plan',
      'mock-reference-only-edit-intent-private-audio-manifest',
    ],
    revisionId: 'mock-reference-only-revision-sound-3b',
    approvalTimestamp: 'mock-reference-only-timestamp-future-owner-accepted',
    fixtureScope: 'local_fixture_spec_only',
    rawPromptWorkerPayloadAllowed: false,
    createsSnapshotInThisSpec: false,
  },
  timingManifestRequirements: {
    cueManifestId: 'mock-reference-only-timing-aware-cue-manifest-sound-3b',
    cueTimingsRequired: true,
    timingAnchorsRequired: true,
    visualStoryReasonRequired: true,
    speechOverlapRequired: true,
    duckingRequirementRequired: true,
    soundSyncNotesRequired: true,
    providerCandidateMetadataRequired: true,
    runtimeMetadataRequired: true,
    blockedUsesRequired: true,
    trackAFinalRenderReady: false,
    trackBExecutionAccepted: false,
  },
  privateArtifactManifestRequirements: {
    privateAudioArtifactManifestId: 'mock-reference-only-private-audio-artifact-manifest-sound-3b',
    storageScope: 'private',
    publicArtifactAllowed: false,
    signedUrlsPresent: false,
    generatedAssetIdsAllowedNow: false,
    mediaAssetIdsAllowedNow: false,
    timingMapIdsAllowedNow: false,
    provenanceSummaryRequired: true,
    licensePolicyRequired: true,
    qaEvidenceRefsRequired: true,
    blockedUsesRequired: true,
    handoffTargetsRequired: true,
  },
  providerRules: {
    lyriaMusicOnly: true,
    lyriaAllowedFamilies: ['music_cue', 'soundtrack_layer', 'audio_mood_design'],
    lyriaSfxAllowed: false,
    lyriaFoleyAllowed: false,
    lyriaAmbienceAllowed: false,
    lyriaGenerationAllowed: false,
    providerCallAllowedByProvider,
    providerGatewayOwnerRequired: true,
  },
  workerRuntimeRules: {
    workerDispatchAllowed: false,
    productionWorkerPayloadExecutionAllowed: false,
    idempotencyKeyExpected: true,
    idempotencyKey: 'mock-reference-only-idempotency-key-sound-3b',
    approvedSnapshotRequired: true,
    rawPromptExecutionAllowed: false,
    signedUrlInputAllowed: false,
    serviceRoleKeyAllowed: false,
    providerSecretAllowed: false,
    workerRuntimeOwnerRequired: true,
  },
  supabaseStorageRules: {
    supabaseMutationAllowed: false,
    sqlAllowed: false,
    migrationAllowed: false,
    storageBucketCreationAllowed: false,
    storageObjectCreationAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    publicArtifactAllowed: false,
    supabaseOwnerRequiredBeforeExecution: true,
  },
  qaObservabilityBillingRules: {
    qaMetadataExpected: true,
    persistedQaReportCreatedNow: false,
    observabilityOwnerRequired: true,
    billingOwnerRequired: true,
    creditEstimateCreatedNow: false,
    creditApprovalCreatedNow: false,
    creditReservationCreatedNow: false,
    spendOccurred: false,
    refundOrReleaseOccurred: false,
  },
  trackRules: {
    trackAOwnerRequired: true,
    trackAFinalExportReady: false,
    trackBOwnerRequired: true,
    trackBExecutionAccepted: false,
  },
  ownerAcceptanceMap,
  blockedUses: [
    'provider_gateway_handoff_required',
    'worker_runtime_handoff_required',
    'supabase_mutation_blocked',
    'storage_object_not_allowed',
    'signed_url_blocked',
    'public_artifact_blocked',
    'generated_asset_not_allowed',
    'credit_approval_required',
    'final_render_export_not_owned',
  ],
  nextAllowedPromptRecommendation: 'SOUND-3C: local fixture spec UI surfacing or handoff packet, no artifact creation',
} as const satisfies SoundMusicAudioGeneratedLocalFixtureSpec
