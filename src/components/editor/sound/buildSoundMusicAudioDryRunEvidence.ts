import type {
  PrivateAudioArtifactManifest,
  SoundBlockedUseReason,
  SoundCueFamily,
  SoundProviderId,
  SoundRelatedWorkstreamId,
  TimingAwareSoundCueManifest,
} from '../../../types/audio-music'

export type SoundMusicAudioDryRunMode = 'mock_dry_run_contract'

export type SoundMusicAudioDryRunOverallStatus =
  | 'dry_run_contract_ready_mock_only'
  | 'blocked'
  | 'handoff_required'

export type SoundMusicAudioDryRunUnlockStage =
  | 'repo_audit_passed_mock_only'
  | 'dry_run_passed_mock_only'
  | 'generated_local_fixture_passed'

export interface SoundMusicAudioDryRunApprovedSnapshotEvidence {
  approvedPlanSnapshotId: string
  approvalStatus: 'mock_approved_reference_only'
  snapshotChecksum: string
  immutablePlanVersion: string
  approvedAt: string
  sourceFindingIds: string[]
  sourceIntentIds: string[]
  revisionId: string
  metadataOnly: true
  createsSnapshot: false
  requiredFutureEvidence: string[]
}

export interface SoundMusicAudioDryRunTimingManifestEvidence {
  present: boolean
  cueManifestId: string
  cueCount: number
  timingAnchorsPresent: boolean
  metadataOnly: true
  trackAFinalRenderReady: false
  providerExecutionReady: false
  workerExecutionReady: false
}

export interface SoundMusicAudioDryRunPrivateArtifactEvidence {
  present: boolean
  manifestId: string
  storageScope: PrivateAudioArtifactManifest['storageScope'] | 'not_declared'
  metadataOnly: true
  publicArtifactAllowed: false
  signedUrlsPresent: false
  publicUrlsPresent: false
  generatedAssetsCreated: false
  futureRequirements: string[]
}

export interface SoundMusicAudioDryRunProviderGatewayEvidence {
  owner: Extract<SoundRelatedWorkstreamId, 'PROVIDER_GATEWAY_MODELS'>
  mayCallProvider: false
  transportAllowed: false
  providerSecretsAllowed: false
  fallbackExecutionAllowed: false
  licenseEvidenceRequired: string[]
  blockedProviders: SoundProviderId[]
  planningOnlyProviders: SoundProviderId[]
  licenseGatedPlanningProviders: SoundProviderId[]
  processingOnlyProviders: SoundProviderId[]
  reviewGatedProcessingProviders: SoundProviderId[]
  lyriaPlanning: {
    providerId: Extract<SoundProviderId, 'lyria_mock'>
    allowedFamilies: Extract<SoundCueFamily, 'music_cue' | 'soundtrack_layer' | 'audio_mood_design'>[]
    usedForSfxFoleyAmbience: false
    generationEnabled: false
    providerGatewayRequired: true
  }
}

export interface SoundMusicAudioDryRunWorkerRuntimeEvidence {
  owner: Extract<SoundRelatedWorkstreamId, 'WORKER_RUNTIME_JOBS'>
  mayDispatchWorker: false
  workerPayloadCreated: false
  productionWorkerPayloadAllowed: false
  requiresApprovedSnapshot: true
  requiresIdempotencyKey: true
  idempotencyKey: string
  rawPromptExecutionAllowed: false
  signedUrlInputAllowed: false
  serviceRoleKeyAllowed: false
  providerSecretAllowed: false
  generatedAssetCreationAllowed: false
  requiredFutureContractFields: string[]
}

export interface SoundMusicAudioDryRunSupabaseStorageEvidence {
  owner: Extract<SoundRelatedWorkstreamId, 'SUPABASE_RLS_STORAGE_DATABASE'>
  mayMutateSupabase: false
  mayWriteStorage: false
  sqlAllowed: false
  migrationAllowed: false
  signedUrlSourceOfTruthAllowed: false
  publicArtifactAllowed: false
  requiredFutureTablesOrRecords: string[]
}

export interface SoundMusicAudioDryRunQaObservabilityBillingEvidence {
  observabilityOwner: Extract<SoundRelatedWorkstreamId, 'OBSERVABILITY_AUDIT_COST'>
  billingOwner: Extract<SoundRelatedWorkstreamId, 'BILLING_STRIPE_CREDITS'>
  qaEvidencePersisted: false
  creditEstimateCreated: false
  creditApprovalCreated: false
  creditReservationCreated: false
  spendOccurred: false
  refundOrReleaseOccurred: false
  auditEvidenceRequired: string[]
}

export interface SoundMusicAudioDryRunTrackHandoffEvidence {
  trackAOwner: Extract<SoundRelatedWorkstreamId, 'TRACK_A_RENDER_EXPORT'>
  trackAFinalExportReady: false
  finalMuxExportAllowed: false
  trackBOwner: Extract<SoundRelatedWorkstreamId, 'TRACK_B_MEDIA_PROCESSING'>
  trackBExecutionAccepted: false
}

export interface SoundMusicAudioDryRunNoSideEffectGates {
  mayCallProvider: false
  mayDispatchWorker: false
  mayCreateGeneratedAsset: false
  publicArtifactAllowed: false
  supabaseMutationAllowed: false
  gcpMutationAllowed: false
  signedUrlsPresent: false
  publicUrlsPresent: false
  providerSecretsPresent: false
  serviceRoleKeysPresent: false
  rawWorkerPromptPresent: false
  generatedAssetsCreated: false
  storageWritesCreated: false
}

export interface SoundMusicAudioDryRunEvidenceSource {
  dryRunRequestId: string
  structuredFindingIds: string[]
  editIntentIds: string[]
  approvedSnapshot: SoundMusicAudioDryRunApprovedSnapshotEvidence
  timingManifest?: TimingAwareSoundCueManifest
  privateArtifactManifest?: PrivateAudioArtifactManifest
  providerGateway: SoundMusicAudioDryRunProviderGatewayEvidence
  workerRuntime: SoundMusicAudioDryRunWorkerRuntimeEvidence
  supabaseStorage: SoundMusicAudioDryRunSupabaseStorageEvidence
  qaObservabilityBilling: SoundMusicAudioDryRunQaObservabilityBillingEvidence
  trackHandoffs: SoundMusicAudioDryRunTrackHandoffEvidence
  noSideEffectGates: SoundMusicAudioDryRunNoSideEffectGates
  blockedUses: SoundBlockedUseReason[]
  futureRequirements: string[]
}

export interface SoundMusicAudioDryRunEvidenceDisplay {
  workstream: 'SOUND_MUSIC_AUDIO'
  mode: SoundMusicAudioDryRunMode
  dryRunRequestId: string
  overallStatus: SoundMusicAudioDryRunOverallStatus
  currentUnlockStage: SoundMusicAudioDryRunUnlockStage
  nextUnlockStage: Extract<SoundMusicAudioDryRunUnlockStage, 'generated_local_fixture_passed'>
  nextUnlockBlocked: true
  blockedExplanation: string[]
  structuredInputs: {
    structuredFindingIds: string[]
    structuredFindingCount: number
    editIntentIds: string[]
    editIntentCount: number
    rawPromptExecutionAllowed: false
    rawWorkerPromptPresent: false
  }
  approvedSnapshot: SoundMusicAudioDryRunApprovedSnapshotEvidence
  timingManifest: SoundMusicAudioDryRunTimingManifestEvidence
  privateArtifactManifest: SoundMusicAudioDryRunPrivateArtifactEvidence
  providerGateway: SoundMusicAudioDryRunProviderGatewayEvidence
  workerRuntime: SoundMusicAudioDryRunWorkerRuntimeEvidence
  supabaseStorage: SoundMusicAudioDryRunSupabaseStorageEvidence
  qaObservabilityBilling: SoundMusicAudioDryRunQaObservabilityBillingEvidence
  trackHandoffs: SoundMusicAudioDryRunTrackHandoffEvidence
  noSideEffectGates: SoundMusicAudioDryRunNoSideEffectGates
  requiredHandoffs: SoundRelatedWorkstreamId[]
  blockedUses: SoundBlockedUseReason[]
  futureRequirements: string[]
}

const requiredHandoffs: SoundRelatedWorkstreamId[] = [
  'PROVIDER_GATEWAY_MODELS',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'OBSERVABILITY_AUDIT_COST',
  'BILLING_STRIPE_CREDITS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
]

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

export function buildSoundMusicAudioDryRunEvidence(
  source: SoundMusicAudioDryRunEvidenceSource,
): SoundMusicAudioDryRunEvidenceDisplay {
  const timingManifest = source.timingManifest
  const privateManifest = source.privateArtifactManifest

  return {
    workstream: 'SOUND_MUSIC_AUDIO',
    mode: 'mock_dry_run_contract',
    dryRunRequestId: source.dryRunRequestId,
    overallStatus: 'dry_run_contract_ready_mock_only',
    currentUnlockStage: 'dry_run_passed_mock_only',
    nextUnlockStage: 'generated_local_fixture_passed',
    nextUnlockBlocked: true,
    blockedExplanation: [
      'Mock dry-run contract evidence is visible, but generated/local fixture remains blocked.',
      'Owner acceptance is required before any provider transport, worker execution, storage mutation, generated asset, or final export.',
      'Raw chat is not a worker execution plan, and signed URLs are not source-of-truth evidence.',
    ],
    structuredInputs: {
      structuredFindingIds: source.structuredFindingIds,
      structuredFindingCount: source.structuredFindingIds.length,
      editIntentIds: source.editIntentIds,
      editIntentCount: source.editIntentIds.length,
      rawPromptExecutionAllowed: false,
      rawWorkerPromptPresent: false,
    },
    approvedSnapshot: source.approvedSnapshot,
    timingManifest: {
      present: Boolean(timingManifest),
      cueManifestId: timingManifest?.cueManifestId ?? 'mock-timing-manifest-not-present',
      cueCount: timingManifest?.cues.length ?? 0,
      timingAnchorsPresent: Boolean(timingManifest?.timingAnchors.length),
      metadataOnly: true,
      trackAFinalRenderReady: false,
      providerExecutionReady: false,
      workerExecutionReady: false,
    },
    privateArtifactManifest: {
      present: Boolean(privateManifest),
      manifestId: privateManifest?.manifestId ?? 'mock-private-audio-manifest-not-present',
      storageScope: privateManifest?.storageScope ?? 'not_declared',
      metadataOnly: true,
      publicArtifactAllowed: false,
      signedUrlsPresent: false,
      publicUrlsPresent: false,
      generatedAssetsCreated: false,
      futureRequirements: source.futureRequirements.filter((requirement) => /storage|checksum|artifact|path/i.test(requirement)),
    },
    providerGateway: source.providerGateway,
    workerRuntime: source.workerRuntime,
    supabaseStorage: source.supabaseStorage,
    qaObservabilityBilling: source.qaObservabilityBilling,
    trackHandoffs: source.trackHandoffs,
    noSideEffectGates: source.noSideEffectGates,
    requiredHandoffs,
    blockedUses: unique(source.blockedUses),
    futureRequirements: unique(source.futureRequirements),
  }
}
