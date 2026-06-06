import { SOUND_RELATED_WORKSTREAM_IDS } from '../contracts/sound-music-audio-contracts'
import { planSoundMusicAudio } from '../services/sound-agent-planner-service'
import type {
  PrivateAudioArtifactManifest,
  SoundBlockedUseReason,
  SoundCueFamily,
  SoundProviderId,
  SoundRelatedWorkstreamId,
  TimingAwareSoundCueManifest,
} from '../../types/audio-music'
import { mockSoundMusicAudioScenarios } from './mock-sound-music-audio-scenarios'

export type SoundMusicAudioDryRunMode = 'mock_dry_run_contract'

export type SoundMusicAudioDryRunApprovalStatus =
  | 'mock_approved_reference_only'
  | 'missing'
  | 'blocked'

export interface SoundMusicAudioDryRunApprovedSnapshot {
  approvedPlanSnapshotId: string
  approvalStatus: SoundMusicAudioDryRunApprovalStatus
  snapshotChecksum: string
  immutablePlanVersion: string
  approvedAt: string
  sourceFindingIds: string[]
  sourceIntentIds: string[]
  revisionId: string
  metadataOnly: true
  createsSnapshot: false
  requiredFutureEvidence: string[]
  blocksGeneratedLocalFixture: true
}

export interface SoundMusicAudioDryRunProviderGatewayHandoff {
  owner: Extract<SoundRelatedWorkstreamId, 'PROVIDER_GATEWAY_MODELS'>
  transportAllowed: false
  mayCallProvider: false
  providerSecretsAllowed: false
  secretManagerRefsOnly: true
  fallbackExecutionAllowed: false
  licenseEvidenceRequired: string[]
  blockedProviders: SoundProviderId[]
  planningOnlyProviders: SoundProviderId[]
  licenseGatedPlanningProviders: SoundProviderId[]
  processingOnlyProviders: SoundProviderId[]
  reviewGatedProcessingProviders: SoundProviderId[]
  lyriaPlanning: {
    providerId: Extract<SoundProviderId, 'lyria_mock'>
    allowedFamilies: SoundCueFamily[]
    usedForSfxFoleyAmbience: false
    generationEnabled: false
    providerGatewayRequired: true
  }
}

export interface SoundMusicAudioDryRunWorkerRuntimeHandoff {
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

export interface SoundMusicAudioDryRunSupabaseStorageHandoff {
  owner: Extract<SoundRelatedWorkstreamId, 'SUPABASE_RLS_STORAGE_DATABASE'>
  mayMutateSupabase: false
  mayWriteStorage: false
  sqlAllowed: false
  migrationAllowed: false
  signedUrlSourceOfTruthAllowed: false
  publicArtifactAllowed: false
  requiredFutureTablesOrRecords: string[]
}

export interface SoundMusicAudioDryRunQaObservabilityCostHandoff {
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

export interface SoundMusicAudioDryRunTrackHandoffs {
  trackAOwner: Extract<SoundRelatedWorkstreamId, 'TRACK_A_RENDER_EXPORT'>
  trackAFinalExportReady: false
  finalMuxExportAllowed: false
  trackBOwner: Extract<SoundRelatedWorkstreamId, 'TRACK_B_MEDIA_PROCESSING'>
  trackBExecutionAccepted: false
}

export interface SoundMusicAudioDryRunAssertions {
  mayCallProvider: false
  mayDispatchWorker: false
  mayCreateGeneratedAsset: false
  publicArtifactAllowed: false
  signedUrlsPresent: false
  publicUrlsPresent: false
  providerSecretsPresent: false
  serviceRoleKeysPresent: false
  rawWorkerPromptPresent: false
  supabaseMutationAllowed: false
  gcpMutationAllowed: false
  generatedAssetsCreated: false
  providerTransportAllowed: false
  workerPayloadCreated: false
  creditRecordsCreated: false
  approvalRecordsCreated: false
}

export interface SoundMusicAudioDryRunContract {
  workstream: 'SOUND_MUSIC_AUDIO'
  dryRunRequestId: string
  mode: SoundMusicAudioDryRunMode
  workspaceId: string
  projectId: string
  editPlanId: string
  structuredFindingIds: string[]
  editIntentIds: string[]
  derivedFromStructuredInputs: true
  rawChatAsWorkerPlanAllowed: false
  approvedSnapshot: SoundMusicAudioDryRunApprovedSnapshot
  timingAwareCueManifest: TimingAwareSoundCueManifest
  privateAudioArtifactManifest: PrivateAudioArtifactManifest
  providerGatewayHandoff: SoundMusicAudioDryRunProviderGatewayHandoff
  workerRuntimeHandoff: SoundMusicAudioDryRunWorkerRuntimeHandoff
  supabaseStorageHandoff: SoundMusicAudioDryRunSupabaseStorageHandoff
  qaObservabilityCostHandoff: SoundMusicAudioDryRunQaObservabilityCostHandoff
  trackHandoffs: SoundMusicAudioDryRunTrackHandoffs
  assertions: SoundMusicAudioDryRunAssertions
  requiredHandoffs: SoundRelatedWorkstreamId[]
  blockedUses: SoundBlockedUseReason[]
  futureRequirements: string[]
}

export interface SoundMusicAudioDryRunValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  summary: {
    workstream: 'SOUND_MUSIC_AUDIO'
    mode: SoundMusicAudioDryRunMode
    requiredHandoffs: SoundRelatedWorkstreamId[]
    mayCallProvider: false
    mayDispatchWorker: false
    mayCreateGeneratedAsset: false
    publicArtifactAllowed: false
    supabaseMutationAllowed: false
    gcpMutationAllowed: false
    trackAFinalExportReady: false
  }
}

const dryRunScenarioId = 'approved-generation-blocked'

const structuredFindingIds = [
  'mock-sound-2b-structured-finding-dialogue-safety',
  'mock-sound-2b-structured-finding-cue-timing',
]

const editIntentIds = [
  'mock-sound-2b-edit-intent-timing-manifest',
  'mock-sound-2b-edit-intent-private-audio-manifest',
]

const blockedProviders: SoundProviderId[] = [
  'openmoss_moss_soundeffect_v2_pending_verification',
  'meta_audiogen_disabled',
  'woosh_disabled',
  'tangoflux_disabled',
  'mmaudio_disabled',
]

const planningOnlyProviders: SoundProviderId[] = [
  'mock_sfx_provider',
  'mock_music_provider',
  'lyria_mock',
  'mirelo_sfx_mock',
  'mmaudio_mock',
]

const licenseGatedPlanningProviders: SoundProviderId[] = [
  'dasheng_audiogen_candidate',
  'stable_audio_open_license_gated',
]

const processingOnlyProviders: SoundProviderId[] = [
  'audioflux_analysis_only',
  'signalsmith_stretch_processing_only',
]

const reviewGatedProcessingProviders: SoundProviderId[] = [
  'deepfilternet_review_required',
  'rnnoise_review_required',
  'demucs_review_required',
]

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

function requireScenario() {
  const scenario = mockSoundMusicAudioScenarios.find((candidate) => candidate.id === dryRunScenarioId)
  if (!scenario) throw new Error(`Missing SOUND dry-run mock scenario ${dryRunScenarioId}.`)
  return scenario
}

export function createMockSoundMusicAudioDryRunContract(): SoundMusicAudioDryRunContract {
  const scenario = requireScenario()
  const approvedPlanSnapshotId = 'mock-approved-snapshot-sound-2b-dry-run'
  const result = planSoundMusicAudio({
    ...scenario.input,
    approvedPlanSnapshotId,
    deterministicIdSeed: 'mock-sound-seed-2b-dry-run-contract',
    executionMode: 'approved_generation',
    requestedOutputMode: 'handoff_manifest_only',
    sourceEvidence: {
      ...scenario.input.sourceEvidence,
      approvedPlanSnapshotId,
      editPlanSource: 'mock structured edit intent bundle for SOUND-2B dry-run',
      timingSource: 'mock timing-aware cue manifest metadata for SOUND-2B dry-run',
      transcriptSource: 'mock structured transcript findings for SOUND-2B dry-run',
      userInstructionSource: 'mock compiled sound intent fixture, not raw chat execution',
    },
  })
  const timingManifest = result.timingAwareCueManifest
  const privateManifest = result.privateAudioArtifactManifest

  return {
    workstream: 'SOUND_MUSIC_AUDIO',
    dryRunRequestId: 'mock-sound-2b-dry-run-request',
    mode: 'mock_dry_run_contract',
    workspaceId: result.plan.workspaceId,
    projectId: result.plan.projectId,
    editPlanId: result.plan.editPlanId,
    structuredFindingIds,
    editIntentIds,
    derivedFromStructuredInputs: true,
    rawChatAsWorkerPlanAllowed: false,
    approvedSnapshot: {
      approvedPlanSnapshotId,
      approvalStatus: 'mock_approved_reference_only',
      snapshotChecksum: 'mock-sha256-sound-2b-approved-snapshot-checksum',
      immutablePlanVersion: 'mock-sound-plan-version-2b-001',
      approvedAt: '2026-06-06T00:00:00.000Z',
      sourceFindingIds: structuredFindingIds,
      sourceIntentIds: editIntentIds,
      revisionId: 'mock-sound-revision-2b-001',
      metadataOnly: true,
      createsSnapshot: false,
      requiredFutureEvidence: [
        'real approved_plan_snapshots row',
        'immutable snapshot hash verified by Supabase owner',
        'credit approval and reservation evidence before generation',
        'owner acceptance before generated/local fixture',
      ],
      blocksGeneratedLocalFixture: true,
    },
    timingAwareCueManifest: timingManifest,
    privateAudioArtifactManifest: privateManifest,
    providerGatewayHandoff: {
      owner: 'PROVIDER_GATEWAY_MODELS',
      transportAllowed: false,
      mayCallProvider: false,
      providerSecretsAllowed: false,
      secretManagerRefsOnly: true,
      fallbackExecutionAllowed: false,
      licenseEvidenceRequired: [
        'Provider Gateway transport review',
        'provider license and commercial export evidence',
        'provider cost and retry/fallback policy evidence',
      ],
      blockedProviders,
      planningOnlyProviders,
      licenseGatedPlanningProviders,
      processingOnlyProviders,
      reviewGatedProcessingProviders,
      lyriaPlanning: {
        providerId: 'lyria_mock',
        allowedFamilies: ['music_cue', 'soundtrack_layer', 'audio_mood_design'],
        usedForSfxFoleyAmbience: false,
        generationEnabled: false,
        providerGatewayRequired: true,
      },
    },
    workerRuntimeHandoff: {
      owner: 'WORKER_RUNTIME_JOBS',
      mayDispatchWorker: false,
      workerPayloadCreated: false,
      productionWorkerPayloadAllowed: false,
      requiresApprovedSnapshot: true,
      requiresIdempotencyKey: true,
      idempotencyKey: 'mock-sound-2b-worker-idempotency-key',
      rawPromptExecutionAllowed: false,
      signedUrlInputAllowed: false,
      serviceRoleKeyAllowed: false,
      providerSecretAllowed: false,
      generatedAssetCreationAllowed: false,
      requiredFutureContractFields: [
        'ProductionWorkerJobPayload mapping accepted by WORKER_RUNTIME_JOBS',
        'timing manifest id',
        'private audio artifact manifest id',
        'approved snapshot id',
        'stable idempotency key',
        'claim/lease/event contract evidence',
      ],
    },
    supabaseStorageHandoff: {
      owner: 'SUPABASE_RLS_STORAGE_DATABASE',
      mayMutateSupabase: false,
      mayWriteStorage: false,
      sqlAllowed: false,
      migrationAllowed: false,
      signedUrlSourceOfTruthAllowed: false,
      publicArtifactAllowed: false,
      requiredFutureTablesOrRecords: [
        'approved_plan_snapshots',
        'worker_runtime_configs',
        'storage.buckets',
        'storage.objects',
        'storage_object_records',
        'generation_requests',
        'generated_assets',
        'jobs',
        'job_events',
        'sound_effect_plans',
        'ambient_sound_plans',
        'music_plans',
        'credit_estimates',
        'credit_approvals',
        'credit_reservations',
      ],
    },
    qaObservabilityCostHandoff: {
      observabilityOwner: 'OBSERVABILITY_AUDIT_COST',
      billingOwner: 'BILLING_STRIPE_CREDITS',
      qaEvidencePersisted: false,
      creditEstimateCreated: false,
      creditApprovalCreated: false,
      creditReservationCreated: false,
      spendOccurred: false,
      refundOrReleaseOccurred: false,
      auditEvidenceRequired: [
        'audio QA report evidence',
        'provider/license audit evidence',
        'worker gate event evidence',
        'cost estimate and reservation audit evidence',
      ],
    },
    trackHandoffs: {
      trackAOwner: 'TRACK_A_RENDER_EXPORT',
      trackAFinalExportReady: false,
      finalMuxExportAllowed: false,
      trackBOwner: 'TRACK_B_MEDIA_PROCESSING',
      trackBExecutionAccepted: false,
    },
    assertions: {
      mayCallProvider: false,
      mayDispatchWorker: false,
      mayCreateGeneratedAsset: false,
      publicArtifactAllowed: false,
      signedUrlsPresent: false,
      publicUrlsPresent: false,
      providerSecretsPresent: false,
      serviceRoleKeysPresent: false,
      rawWorkerPromptPresent: false,
      supabaseMutationAllowed: false,
      gcpMutationAllowed: false,
      generatedAssetsCreated: false,
      providerTransportAllowed: false,
      workerPayloadCreated: false,
      creditRecordsCreated: false,
      approvalRecordsCreated: false,
    },
    requiredHandoffs,
    blockedUses: unique([
      ...result.blockedReasons,
      ...timingManifest.blockedUses,
      ...privateManifest.blockedUses,
      'provider_gateway_handoff_required',
      'worker_runtime_handoff_required',
      'supabase_mutation_blocked',
      'final_render_export_not_owned',
    ]),
    futureRequirements: [
      'checksum and canonical private storage path evidence before generated/local fixture',
      'source-of-truth storage object records before storage writes',
      'Track A acceptance before final mux/export',
      'Provider Gateway acceptance before real transport',
      'Worker Runtime acceptance before dispatch',
      'Supabase/RLS/Storage acceptance before mutation or storage writes',
      'Observability and Billing acceptance before beta or production',
    ],
  }
}

function hasValue(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0)
}

function pushIfMissing(errors: string[], condition: boolean, message: string): void {
  if (!condition) errors.push(message)
}

function hasNoGeneratedAssets(manifest: PrivateAudioArtifactManifest | TimingAwareSoundCueManifest): boolean {
  return (manifest.generatedAssetIds?.length ?? 0) === 0
}

function cueHasTimingMetadata(cue: TimingAwareSoundCueManifest['cues'][number]): boolean {
  return cue.startTimeSeconds >= 0 &&
    cue.endTimeSeconds >= cue.startTimeSeconds &&
    cue.durationSeconds >= 0 &&
    hasValue(cue.visualOrStoryReason) &&
    hasValue(cue.promptIntent) &&
    hasValue(cue.anchorType)
}

function includesAll<T>(items: T[], required: readonly T[]): boolean {
  return required.every((item) => items.includes(item))
}

function inspectForbiddenStringValues(value: unknown, path = 'contract'): string[] {
  const errors: string[] = []
  if (Array.isArray(value)) {
    value.forEach((item, index) => errors.push(...inspectForbiddenStringValues(item, `${path}.${index}`)))
    return errors
  }

  if (!value || typeof value !== 'object') return errors

  for (const [key, nestedValue] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase()
    if (normalizedKey.includes('apikey') || normalizedKey.includes('api_key')) {
      errors.push(`${path}.${key} must not expose an API key field.`)
    }
    if (normalizedKey === 'servicerolekey' || normalizedKey === 'service_role_key') {
      errors.push(`${path}.${key} must not expose a service-role key field.`)
    }

    if (typeof nestedValue === 'string') {
      const normalizedValue = nestedValue.toLowerCase()
      if (/^https?:\/\//i.test(nestedValue)) errors.push(`${path}.${key} must not contain a public URL.`)
      if (normalizedValue.startsWith('gs://')) errors.push(`${path}.${key} must not contain a storage URI.`)
      if (normalizedValue.includes('x-goog-signature') || normalizedValue.includes('signature=')) {
        errors.push(`${path}.${key} must not contain a signed URL value.`)
      }
      if (normalizedValue.includes('service_role')) errors.push(`${path}.${key} must not contain a service-role value.`)
      if (normalizedValue.includes('api_key')) errors.push(`${path}.${key} must not contain an API key value.`)
      if (normalizedValue.includes('sk-')) errors.push(`${path}.${key} must not contain a provider credential shape.`)
    }

    errors.push(...inspectForbiddenStringValues(nestedValue, `${path}.${key}`))
  }

  return errors
}

export function validateMockSoundMusicAudioDryRunContract(
  contract: SoundMusicAudioDryRunContract,
): SoundMusicAudioDryRunValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const timingManifest = contract.timingAwareCueManifest
  const privateManifest = contract.privateAudioArtifactManifest
  const providerHandoff = contract.providerGatewayHandoff
  const workerHandoff = contract.workerRuntimeHandoff
  const supabaseHandoff = contract.supabaseStorageHandoff
  const qaBillingHandoff = contract.qaObservabilityCostHandoff
  const trackHandoffs = contract.trackHandoffs

  pushIfMissing(errors, contract.workstream === 'SOUND_MUSIC_AUDIO', 'Dry-run contract must report SOUND_MUSIC_AUDIO ownership.')
  pushIfMissing(errors, contract.mode === 'mock_dry_run_contract', 'Dry-run contract must use mock_dry_run_contract mode.')
  pushIfMissing(errors, contract.dryRunRequestId.startsWith('mock-'), 'Dry-run request id must be mock-prefixed.')
  pushIfMissing(errors, contract.structuredFindingIds.length > 0, 'Structured finding ids are required.')
  pushIfMissing(errors, contract.editIntentIds.length > 0, 'Edit intent ids are required.')
  pushIfMissing(errors, contract.derivedFromStructuredInputs, 'Dry-run contract must be derived from structured inputs.')
  pushIfMissing(errors, !contract.rawChatAsWorkerPlanAllowed, 'Raw chat must not be accepted as a worker plan.')

  pushIfMissing(errors, hasValue(contract.approvedSnapshot.approvedPlanSnapshotId), 'Approved snapshot id is required.')
  pushIfMissing(errors, contract.approvedSnapshot.approvalStatus === 'mock_approved_reference_only', 'Approved snapshot must be mock approved reference only.')
  pushIfMissing(errors, hasValue(contract.approvedSnapshot.snapshotChecksum), 'Snapshot checksum is required.')
  pushIfMissing(errors, hasValue(contract.approvedSnapshot.immutablePlanVersion), 'Immutable plan version is required.')
  pushIfMissing(errors, hasValue(contract.approvedSnapshot.approvedAt), 'Approved timestamp is required.')
  pushIfMissing(errors, contract.approvedSnapshot.sourceFindingIds.length > 0, 'Approved snapshot source finding ids are required.')
  pushIfMissing(errors, contract.approvedSnapshot.sourceIntentIds.length > 0, 'Approved snapshot source intent ids are required.')
  pushIfMissing(errors, hasValue(contract.approvedSnapshot.revisionId), 'Approved snapshot revision id is required.')
  pushIfMissing(errors, contract.approvedSnapshot.metadataOnly, 'Approved snapshot metadataOnly must be true.')
  pushIfMissing(errors, !contract.approvedSnapshot.createsSnapshot, 'Dry-run contract must not create a snapshot.')
  pushIfMissing(errors, contract.approvedSnapshot.blocksGeneratedLocalFixture, 'Generated/local fixture must remain blocked.')

  pushIfMissing(errors, timingManifest.metadataOnly, 'Timing manifest must be metadata-only.')
  pushIfMissing(errors, timingManifest.cues.length > 0, 'Timing manifest must include cues.')
  pushIfMissing(errors, timingManifest.cues.every(cueHasTimingMetadata), 'Every timing cue must include timing, anchor, and reason metadata.')
  pushIfMissing(errors, !timingManifest.trackAFinalRenderReady, 'Track A final render readiness must be false.')
  pushIfMissing(errors, !timingManifest.providerExecutionReady, 'Provider execution readiness must be false.')
  pushIfMissing(errors, !timingManifest.workerExecutionReady, 'Worker execution readiness must be false.')
  pushIfMissing(errors, hasNoGeneratedAssets(timingManifest), 'Timing manifest must not reference generated assets.')

  pushIfMissing(errors, privateManifest.metadataOnly, 'Private artifact manifest must be metadata-only.')
  pushIfMissing(errors, privateManifest.storageScope === 'private', 'Private artifact manifest must stay private scoped.')
  pushIfMissing(errors, !privateManifest.publicArtifactAllowed, 'Private artifact manifest must disallow public artifacts.')
  pushIfMissing(errors, hasNoGeneratedAssets(privateManifest), 'Private artifact manifest must not reference generated assets.')

  pushIfMissing(errors, providerHandoff.owner === 'PROVIDER_GATEWAY_MODELS', 'Provider Gateway owner is required.')
  pushIfMissing(errors, !providerHandoff.transportAllowed, 'Provider transport must be blocked.')
  pushIfMissing(errors, !providerHandoff.mayCallProvider, 'Provider calls must be blocked.')
  pushIfMissing(errors, !providerHandoff.providerSecretsAllowed, 'Provider secrets must be blocked.')
  pushIfMissing(errors, providerHandoff.secretManagerRefsOnly, 'Provider handoff must allow future reference names only.')
  pushIfMissing(errors, !providerHandoff.fallbackExecutionAllowed, 'Provider fallback execution must be blocked.')
  pushIfMissing(errors, providerHandoff.lyriaPlanning.providerId === 'lyria_mock', 'Lyria mock planning metadata is required.')
  pushIfMissing(errors, includesAll(providerHandoff.lyriaPlanning.allowedFamilies, ['music_cue', 'soundtrack_layer', 'audio_mood_design']), 'Lyria must be music/song/soundtrack planning only.')
  pushIfMissing(errors, !providerHandoff.lyriaPlanning.usedForSfxFoleyAmbience, 'Lyria must not be used for SFX, foley, or ambience.')
  pushIfMissing(errors, !providerHandoff.lyriaPlanning.generationEnabled, 'Lyria generation must be disabled.')
  pushIfMissing(errors, providerHandoff.lyriaPlanning.providerGatewayRequired, 'Lyria must require Provider Gateway handoff.')
  pushIfMissing(errors, includesAll(providerHandoff.blockedProviders, blockedProviders), 'Disabled providers must remain blocked.')
  pushIfMissing(errors, includesAll(providerHandoff.licenseGatedPlanningProviders, licenseGatedPlanningProviders), 'Dasheng and Stable Audio must remain license-gated planning candidates.')
  pushIfMissing(errors, includesAll(providerHandoff.processingOnlyProviders, processingOnlyProviders), 'AudioFlux and Signalsmith must remain processing-only.')
  pushIfMissing(errors, includesAll(providerHandoff.reviewGatedProcessingProviders, reviewGatedProcessingProviders), 'Cleanup/separation tools must remain review-gated.')

  pushIfMissing(errors, workerHandoff.owner === 'WORKER_RUNTIME_JOBS', 'Worker Runtime owner is required.')
  pushIfMissing(errors, !workerHandoff.mayDispatchWorker, 'Worker dispatch must be blocked.')
  pushIfMissing(errors, !workerHandoff.workerPayloadCreated, 'Dry-run must not create a worker payload.')
  pushIfMissing(errors, !workerHandoff.productionWorkerPayloadAllowed, 'Production worker payload must be blocked.')
  pushIfMissing(errors, workerHandoff.requiresApprovedSnapshot, 'Worker handoff must require approved snapshot.')
  pushIfMissing(errors, workerHandoff.requiresIdempotencyKey, 'Worker handoff must require idempotency.')
  pushIfMissing(errors, workerHandoff.idempotencyKey.startsWith('mock-'), 'Worker idempotency metadata must be mock-prefixed.')
  pushIfMissing(errors, !workerHandoff.rawPromptExecutionAllowed, 'Raw prompt worker execution must be blocked.')
  pushIfMissing(errors, !workerHandoff.signedUrlInputAllowed, 'Signed URL worker input must be blocked.')
  pushIfMissing(errors, !workerHandoff.serviceRoleKeyAllowed, 'Service-role keys must be blocked.')
  pushIfMissing(errors, !workerHandoff.providerSecretAllowed, 'Provider secrets must be blocked.')
  pushIfMissing(errors, !workerHandoff.generatedAssetCreationAllowed, 'Generated asset creation must be blocked.')

  pushIfMissing(errors, supabaseHandoff.owner === 'SUPABASE_RLS_STORAGE_DATABASE', 'Supabase owner is required.')
  pushIfMissing(errors, !supabaseHandoff.mayMutateSupabase, 'Supabase mutation must be blocked.')
  pushIfMissing(errors, !supabaseHandoff.mayWriteStorage, 'Storage writes must be blocked.')
  pushIfMissing(errors, !supabaseHandoff.sqlAllowed, 'SQL must be blocked.')
  pushIfMissing(errors, !supabaseHandoff.migrationAllowed, 'Migrations must be blocked.')
  pushIfMissing(errors, !supabaseHandoff.signedUrlSourceOfTruthAllowed, 'Signed URLs must not be source of truth.')
  pushIfMissing(errors, !supabaseHandoff.publicArtifactAllowed, 'Public artifacts must be blocked.')
  pushIfMissing(errors, supabaseHandoff.requiredFutureTablesOrRecords.includes('approved_plan_snapshots'), 'Approved snapshot future table requirement is required.')
  pushIfMissing(errors, supabaseHandoff.requiredFutureTablesOrRecords.includes('worker_runtime_configs'), 'Worker runtime config future table requirement is required.')
  pushIfMissing(errors, supabaseHandoff.requiredFutureTablesOrRecords.includes('storage_object_records'), 'Storage object record future requirement is required.')

  pushIfMissing(errors, qaBillingHandoff.observabilityOwner === 'OBSERVABILITY_AUDIT_COST', 'Observability owner is required.')
  pushIfMissing(errors, qaBillingHandoff.billingOwner === 'BILLING_STRIPE_CREDITS', 'Billing owner is required.')
  pushIfMissing(errors, !qaBillingHandoff.qaEvidencePersisted, 'QA evidence must not be persisted.')
  pushIfMissing(errors, !qaBillingHandoff.creditEstimateCreated, 'Credit estimate must not be created.')
  pushIfMissing(errors, !qaBillingHandoff.creditApprovalCreated, 'Credit approval must not be created.')
  pushIfMissing(errors, !qaBillingHandoff.creditReservationCreated, 'Credit reservation must not be created.')
  pushIfMissing(errors, !qaBillingHandoff.spendOccurred, 'Credit spend must not occur.')
  pushIfMissing(errors, !qaBillingHandoff.refundOrReleaseOccurred, 'Credit refund/release must not occur.')

  pushIfMissing(errors, trackHandoffs.trackAOwner === 'TRACK_A_RENDER_EXPORT', 'Track A owner is required.')
  pushIfMissing(errors, !trackHandoffs.trackAFinalExportReady, 'Track A final export readiness must be false.')
  pushIfMissing(errors, !trackHandoffs.finalMuxExportAllowed, 'Final mux/export must be blocked.')
  pushIfMissing(errors, trackHandoffs.trackBOwner === 'TRACK_B_MEDIA_PROCESSING', 'Track B owner is required.')
  pushIfMissing(errors, !trackHandoffs.trackBExecutionAccepted, 'Track B processing execution must not be accepted.')

  pushIfMissing(errors, includesAll(contract.requiredHandoffs, requiredHandoffs), 'All required SOUND dry-run handoffs must be listed.')
  pushIfMissing(errors, SOUND_RELATED_WORKSTREAM_IDS.includes('BILLING_STRIPE_CREDITS'), 'SOUND related workstreams must include Billing/Credits.')

  const assertionEntries = Object.entries(contract.assertions)
  for (const [key, value] of assertionEntries) {
    pushIfMissing(errors, value === false, `Assertion ${key} must be false.`)
  }

  errors.push(...inspectForbiddenStringValues(contract))

  if (contract.blockedUses.length === 0) warnings.push('Dry-run contract has no blocked uses.')
  if (contract.futureRequirements.length === 0) warnings.push('Dry-run contract has no future requirements.')

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      workstream: contract.workstream,
      mode: contract.mode,
      requiredHandoffs: contract.requiredHandoffs,
      mayCallProvider: false,
      mayDispatchWorker: false,
      mayCreateGeneratedAsset: false,
      publicArtifactAllowed: false,
      supabaseMutationAllowed: false,
      gcpMutationAllowed: false,
      trackAFinalExportReady: false,
    },
  }
}
