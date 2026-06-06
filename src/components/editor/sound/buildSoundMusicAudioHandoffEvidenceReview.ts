import type {
  PrivateAudioArtifactManifest,
  SoundAgentPlan,
  SoundAgentPlannerResult,
  SoundBlockedUseReason,
  SoundExecutionGateResult,
  SoundHandoffReadiness,
  SoundHandoffReadinessCheck,
  SoundHandoffReadinessCheckName,
  SoundHandoffStatus,
  SoundReadinessStatus,
  SoundRelatedWorkstreamId,
  TimingAwareSoundCueManifest,
} from '../../../types/audio-music'
import type {
  SoundMusicAudioAccessSafetySummary,
  SoundMusicAudioPlanSummary,
  SoundMusicAudioProviderSummary,
  SoundMusicAudioRuntimeSummary,
} from './buildSoundMusicAudioPlanCardProps'

export type SoundMusicAudioEvidenceKey =
  | 'approved_plan_snapshot'
  | 'timing_aware_cue_manifest'
  | 'private_audio_artifact_manifest'
  | 'audio_qa'
  | 'provider_license'
  | 'worker_execution_contract'
  | 'track_a_final_composition'
  | 'track_b_processing'
  | 'supabase_rls_storage'
  | 'observability_audit_cost'

export type SoundMusicAudioEvidenceStatus =
  | SoundReadinessStatus
  | SoundHandoffStatus
  | 'not_created'
  | 'metadata_only'
  | 'missing_future_evidence'

export interface SoundMusicAudioHandoffEvidenceRow {
  evidenceKey: SoundMusicAudioEvidenceKey
  label: string
  status: SoundMusicAudioEvidenceStatus
  currentEvidence: string[]
  missingFutureEvidence: string[]
  nextOwners: SoundRelatedWorkstreamId[]
  blockedUses: SoundBlockedUseReason[]
  realExecutionReady: false
  evidenceRecordCreated: false
  notes: string[]
}

export interface SoundMusicAudioBlockedUseOwnerMapping {
  blockedUse: SoundBlockedUseReason
  nextOwners: SoundRelatedWorkstreamId[]
  explanation: string
}

export interface SoundMusicAudioHandoffEvidenceReview {
  reviewId: string
  workstreamId: 'SOUND_MUSIC_AUDIO'
  rows: SoundMusicAudioHandoffEvidenceRow[]
  blockedUseOwnerMap: SoundMusicAudioBlockedUseOwnerMapping[]
  realGenerationExportBlocked: true
  realGenerationExportBlockedReasons: string[]
  approvedSnapshotCreated: false
  evidenceRecordsCreated: false
  creditRecordsCreated: false
  mayCallProvider: false
  mayDispatchWorker: false
  mayCreateGeneratedAsset: false
  publicArtifactAllowed: false
  supabaseMutationAllowed: false
  storageWriteAllowed: false
  providerTransportAllowed: false
  finalRenderExportReady: false
}

export interface BuildSoundMusicAudioHandoffEvidenceReviewInput {
  plan: SoundAgentPlan
  timingManifest?: TimingAwareSoundCueManifest
  privateArtifactManifest?: PrivateAudioArtifactManifest
  handoffReadiness?: SoundHandoffReadiness
  summary?: SoundMusicAudioPlanSummary
  providerSummaries?: SoundMusicAudioProviderSummary[]
  runtimeSummaries?: SoundMusicAudioRuntimeSummary[]
  executionGateResults?: SoundExecutionGateResult[]
  handoffMetadata?: SoundAgentPlannerResult['handoffMetadata']
  qaNotes?: string[]
  accessSafety?: SoundMusicAudioAccessSafetySummary
}

const evidenceLabels: Record<SoundMusicAudioEvidenceKey, string> = {
  approved_plan_snapshot: 'Approved plan snapshot evidence',
  timing_aware_cue_manifest: 'Timing-aware cue manifest evidence',
  private_audio_artifact_manifest: 'Private audio artifact manifest evidence',
  audio_qa: 'Audio QA evidence',
  provider_license: 'Provider/license evidence',
  worker_execution_contract: 'Worker execution contract evidence',
  track_a_final_composition: 'Track A final composition handoff evidence',
  track_b_processing: 'Track B processing handoff evidence',
  supabase_rls_storage: 'Supabase/RLS/Storage handoff evidence',
  observability_audit_cost: 'Observability/Audit/Cost evidence',
}

const blockedUseOwners: Partial<Record<SoundBlockedUseReason, SoundRelatedWorkstreamId[]>> = {
  real_provider_call_blocked: ['PROVIDER_GATEWAY_MODELS'],
  provider_generation_disabled: ['PROVIDER_GATEWAY_MODELS'],
  commercial_export_not_allowed: ['PROVIDER_GATEWAY_MODELS', 'OBSERVABILITY_AUDIT_COST'],
  provider_license_blocked: ['PROVIDER_GATEWAY_MODELS', 'OBSERVABILITY_AUDIT_COST'],
  approved_snapshot_required: ['SUPABASE_RLS_STORAGE_DATABASE', 'OBSERVABILITY_AUDIT_COST'],
  credit_estimate_required: ['BILLING_STRIPE_CREDITS', 'OBSERVABILITY_AUDIT_COST'],
  credit_approval_required: ['BILLING_STRIPE_CREDITS', 'OBSERVABILITY_AUDIT_COST'],
  credit_reservation_required: ['BILLING_STRIPE_CREDITS', 'OBSERVABILITY_AUDIT_COST'],
  runtime_target_blocked: ['WORKER_RUNTIME_JOBS'],
  runtime_target_mock_only: ['WORKER_RUNTIME_JOBS'],
  tool_readiness_not_enabled: ['WORKER_RUNTIME_JOBS', 'OBSERVABILITY_AUDIT_COST'],
  worker_execution_not_allowed: ['WORKER_RUNTIME_JOBS'],
  internal_test_scope_required: ['OBSERVABILITY_AUDIT_COST'],
  benchmark_scope_required: ['OBSERVABILITY_AUDIT_COST'],
  generated_asset_not_allowed: ['WORKER_RUNTIME_JOBS', 'SUPABASE_RLS_STORAGE_DATABASE'],
  storage_object_not_allowed: ['SUPABASE_RLS_STORAGE_DATABASE'],
  public_artifact_blocked: ['SUPABASE_RLS_STORAGE_DATABASE', 'TRACK_A_RENDER_EXPORT'],
  signed_url_blocked: ['SUPABASE_RLS_STORAGE_DATABASE'],
  secret_blocked: ['PROVIDER_GATEWAY_MODELS', 'WORKER_RUNTIME_JOBS'],
  raw_chat_execution_blocked: ['WORKER_RUNTIME_JOBS', 'OBSERVABILITY_AUDIT_COST'],
  supabase_mutation_blocked: ['SUPABASE_RLS_STORAGE_DATABASE'],
  final_render_export_not_owned: ['TRACK_A_RENDER_EXPORT'],
  provider_gateway_handoff_required: ['PROVIDER_GATEWAY_MODELS'],
  worker_runtime_handoff_required: ['WORKER_RUNTIME_JOBS'],
}

function label(value: string | number | boolean | undefined): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  return value?.replaceAll('_', ' ') ?? 'none'
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function getReadinessCheck(
  readiness: SoundHandoffReadiness | undefined,
  checkName: SoundHandoffReadinessCheckName,
): SoundHandoffReadinessCheck | undefined {
  return readiness?.readinessChecks.find((check) => check.checkName === checkName)
}

function metadataBoolean(metadata: unknown, key: string): boolean | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'boolean' ? value : undefined
}

function ownersForBlockedUse(blockedUse: SoundBlockedUseReason): SoundRelatedWorkstreamId[] {
  return blockedUseOwners[blockedUse] ?? ['OBSERVABILITY_AUDIT_COST']
}

function evidenceRow(input: {
  evidenceKey: SoundMusicAudioEvidenceKey
  status: SoundMusicAudioEvidenceStatus
  currentEvidence: string[]
  missingFutureEvidence: string[]
  nextOwners: SoundRelatedWorkstreamId[]
  blockedUses: SoundBlockedUseReason[]
  notes: string[]
}): SoundMusicAudioHandoffEvidenceRow {
  return {
    evidenceKey: input.evidenceKey,
    label: evidenceLabels[input.evidenceKey],
    status: input.status,
    currentEvidence: unique(input.currentEvidence),
    missingFutureEvidence: unique(input.missingFutureEvidence),
    nextOwners: unique(input.nextOwners),
    blockedUses: unique(input.blockedUses),
    realExecutionReady: false,
    evidenceRecordCreated: false,
    notes: unique(input.notes),
  }
}

export function buildSoundMusicAudioHandoffEvidenceReview(
  input: BuildSoundMusicAudioHandoffEvidenceReviewInput,
): SoundMusicAudioHandoffEvidenceReview {
  const readiness = input.handoffReadiness ?? input.plan.readiness
  const approvalCheck = getReadinessCheck(readiness, 'approval')
  const timingCheck = getReadinessCheck(readiness, 'timing_cue_manifest')
  const privateManifestCheck = getReadinessCheck(readiness, 'private_artifact_manifest')
  const audioQaCheck = getReadinessCheck(readiness, 'audio_qa')
  const providerCheck = getReadinessCheck(readiness, 'provider_license')
  const workerCheck = getReadinessCheck(readiness, 'worker_execution')
  const trackACheck = getReadinessCheck(readiness, 'track_a_final_composition_handoff')
  const trackBCheck = getReadinessCheck(readiness, 'track_b_processing_handoff')
  const supabaseCheck = getReadinessCheck(readiness, 'supabase_mutation')
  const observabilityCheck = getReadinessCheck(readiness, 'observability_audit_cost')
  const allBlockedUses = unique([
    ...input.plan.blockedUses,
    ...(input.timingManifest?.blockedUses ?? []),
    ...(input.privateArtifactManifest?.blockedUses ?? []),
    ...(readiness?.blockedUses ?? []),
    ...(input.executionGateResults?.flatMap((gate) => gate.blockedReasons) ?? []),
  ])
  const providerSummaries = input.providerSummaries ?? []
  const runtimeSummaries = input.runtimeSummaries ?? []
  const trackAMetadata = input.handoffMetadata?.TRACK_A_RENDER_EXPORT
  const trackBMetadata = input.handoffMetadata?.TRACK_B_MEDIA_PROCESSING
  const supabaseMetadata = input.handoffMetadata?.SUPABASE_RLS_STORAGE_DATABASE

  const rows: SoundMusicAudioHandoffEvidenceRow[] = [
    evidenceRow({
      evidenceKey: 'approved_plan_snapshot',
      status: input.plan.approvedPlanSnapshotId ? 'metadata_ready' : 'not_created',
      currentEvidence: [
        input.plan.approvedPlanSnapshotId ? `approved snapshot id: ${input.plan.approvedPlanSnapshotId}` : 'No approved plan snapshot id exists in this mock chat card.',
        'Mock preview approval is local UI state only.',
        'No approval record is created.',
      ],
      missingFutureEvidence: approvalCheck?.requiredEvidence ?? ['future approved plan snapshot', 'immutable approval/audit evidence'],
      nextOwners: ['SUPABASE_RLS_STORAGE_DATABASE', 'OBSERVABILITY_AUDIT_COST'],
      blockedUses: approvalCheck?.blockedReasons ?? ['approved_snapshot_required'],
      notes: approvalCheck?.notes ?? ['Real workers must execute approved snapshots, not raw chat.'],
    }),
    evidenceRow({
      evidenceKey: 'timing_aware_cue_manifest',
      status: input.timingManifest?.metadataOnly ? 'metadata_only' : 'missing_future_evidence',
      currentEvidence: [
        input.timingManifest?.cueManifestId ? `cue manifest id: ${input.timingManifest.cueManifestId}` : 'No timing cue manifest id present.',
        `metadataOnly=${label(input.timingManifest?.metadataOnly)}`,
        `cue count=${label(input.timingManifest?.cues.length ?? 0)}`,
        `Track A final render ready=${label(input.timingManifest?.trackAFinalRenderReady ?? false)}`,
      ],
      missingFutureEvidence: timingCheck?.requiredEvidence ?? ['Track A timing acceptance evidence', 'worker execution timing contract'],
      nextOwners: ['TRACK_A_RENDER_EXPORT', 'WORKER_RUNTIME_JOBS', 'OBSERVABILITY_AUDIT_COST'],
      blockedUses: timingCheck?.blockedReasons ?? ['final_render_export_not_owned'],
      notes: timingCheck?.notes ?? ['Timing manifest is planning metadata only.'],
    }),
    evidenceRow({
      evidenceKey: 'private_audio_artifact_manifest',
      status: input.privateArtifactManifest?.metadataOnly ? 'metadata_only' : 'missing_future_evidence',
      currentEvidence: [
        input.privateArtifactManifest?.manifestId ? `private manifest id: ${input.privateArtifactManifest.manifestId}` : 'No private audio artifact manifest id present.',
        `storage scope=${label(input.privateArtifactManifest?.storageScope)}`,
        `publicArtifactAllowed=${label(input.privateArtifactManifest?.publicArtifactAllowed ?? false)}`,
        `generatedAssetIds=${label(input.privateArtifactManifest?.generatedAssetIds?.length ?? 0)}`,
      ],
      missingFutureEvidence: privateManifestCheck?.requiredEvidence ?? ['private storage path policy', 'artifact provenance and QA evidence'],
      nextOwners: ['SUPABASE_RLS_STORAGE_DATABASE', 'TRACK_A_RENDER_EXPORT', 'OBSERVABILITY_AUDIT_COST'],
      blockedUses: privateManifestCheck?.blockedReasons ?? ['storage_object_not_allowed', 'public_artifact_blocked'],
      notes: privateManifestCheck?.notes ?? ['Private manifest has no storage object in mock mode.'],
    }),
    evidenceRow({
      evidenceKey: 'audio_qa',
      status: audioQaCheck?.status ?? 'planning_ready',
      currentEvidence: [
        `qa readiness=${label(input.timingManifest?.qaReadiness)}`,
        `qa note count=${label(input.qaNotes?.length ?? 0)}`,
        `qaEvidenceIds=${label(input.privateArtifactManifest?.qaEvidenceIds.length ?? 0)}`,
      ],
      missingFutureEvidence: audioQaCheck?.requiredEvidence ?? ['speech ducking QA report', 'loudness and sync evidence'],
      nextOwners: ['TRACK_A_RENDER_EXPORT', 'TRACK_B_MEDIA_PROCESSING', 'OBSERVABILITY_AUDIT_COST'],
      blockedUses: audioQaCheck?.blockedReasons ?? [],
      notes: audioQaCheck?.notes ?? ['Audio QA must pass before Track A handoff.'],
    }),
    evidenceRow({
      evidenceKey: 'provider_license',
      status: providerCheck?.handoffStatus ?? providerCheck?.status ?? 'handoff_required',
      currentEvidence: [
        `provider count=${label(providerSummaries.length)}`,
        `generation enabled providers=${label(providerSummaries.filter((provider) => provider.generationEnabled).length)}`,
        `mayCallProvider=${label(input.summary?.mayCallProvider ?? false)}`,
        `provider secrets exposed=${label(input.accessSafety?.providerSecretExposure ?? false)}`,
      ],
      missingFutureEvidence: providerCheck?.requiredEvidence ?? ['Provider Gateway transport review', 'license and commercial export evidence'],
      nextOwners: ['PROVIDER_GATEWAY_MODELS', 'WORKER_RUNTIME_JOBS', 'OBSERVABILITY_AUDIT_COST'],
      blockedUses: providerCheck?.blockedReasons ?? ['provider_gateway_handoff_required', 'real_provider_call_blocked'],
      notes: providerCheck?.notes ?? ['Provider/license evidence is required before real transport.'],
    }),
    evidenceRow({
      evidenceKey: 'worker_execution_contract',
      status: workerCheck?.handoffStatus ?? workerCheck?.status ?? 'blocked',
      currentEvidence: [
        `runtime policy count=${label(runtimeSummaries.length)}`,
        `execution gate count=${label(input.executionGateResults?.length ?? 0)}`,
        `mayDispatchWorker=${label(input.summary?.mayDispatchWorker ?? false)}`,
        `mayCreateGeneratedAsset=${label(input.summary?.mayCreateGeneratedAsset ?? false)}`,
      ],
      missingFutureEvidence: workerCheck?.requiredEvidence ?? ['worker execution contract', 'claim/lease/event evidence'],
      nextOwners: ['WORKER_RUNTIME_JOBS', 'OBSERVABILITY_AUDIT_COST'],
      blockedUses: workerCheck?.blockedReasons ?? ['worker_runtime_handoff_required', 'worker_execution_not_allowed'],
      notes: workerCheck?.notes ?? ['Worker dispatch remains blocked.'],
    }),
    evidenceRow({
      evidenceKey: 'track_a_final_composition',
      status: readiness?.trackAStatus ?? 'handoff_required',
      currentEvidence: [
        `trackAFinalRenderReady=${label(input.timingManifest?.trackAFinalRenderReady ?? false)}`,
        `handoff metadata finalRenderReady=${label(metadataBoolean(trackAMetadata, 'finalRenderReady') ?? false)}`,
        `finalRenderExportReady=false`,
      ],
      missingFutureEvidence: trackACheck?.requiredEvidence ?? ['final mix/mux validation evidence'],
      nextOwners: ['TRACK_A_RENDER_EXPORT'],
      blockedUses: trackACheck?.blockedReasons ?? ['final_render_export_not_owned'],
      notes: trackACheck?.notes ?? ['Track A owns final composition readiness.'],
    }),
    evidenceRow({
      evidenceKey: 'track_b_processing',
      status: readiness?.trackBStatus ?? 'handoff_required',
      currentEvidence: [
        `trackBHandoffStatus=${label(input.timingManifest?.trackBHandoffStatus)}`,
        `processingExecutionReady=${label(metadataBoolean(trackBMetadata, 'processingExecutionReady') ?? false)}`,
        'Track B processing is handoff-only in this mock UI.',
      ],
      missingFutureEvidence: trackBCheck?.requiredEvidence ?? ['audio/media processing contract'],
      nextOwners: ['TRACK_B_MEDIA_PROCESSING', 'WORKER_RUNTIME_JOBS'],
      blockedUses: trackBCheck?.blockedReasons ?? ['worker_runtime_handoff_required'],
      notes: trackBCheck?.notes ?? ['Track B owns real audio/media processing execution.'],
    }),
    evidenceRow({
      evidenceKey: 'supabase_rls_storage',
      status: readiness?.supabaseStatus ?? 'blocked',
      currentEvidence: [
        `supabaseMutationAllowed=false`,
        `storageWriteAllowed=${label(metadataBoolean(supabaseMetadata, 'storageWriteAllowed') ?? false)}`,
        `publicArtifactAllowed=${label(input.summary?.publicArtifactAllowed ?? false)}`,
        `signedUrlExposure=${label(input.accessSafety?.signedUrlExposure ?? false)}`,
      ],
      missingFutureEvidence: supabaseCheck?.requiredEvidence ?? ['RLS/storage mutation policy', 'private bucket write evidence'],
      nextOwners: ['SUPABASE_RLS_STORAGE_DATABASE', 'OBSERVABILITY_AUDIT_COST'],
      blockedUses: supabaseCheck?.blockedReasons ?? ['supabase_mutation_blocked', 'storage_object_not_allowed', 'signed_url_blocked'],
      notes: supabaseCheck?.notes ?? ['No database mutation or storage write occurs from the card.'],
    }),
    evidenceRow({
      evidenceKey: 'observability_audit_cost',
      status: readiness?.observabilityStatus ?? 'handoff_required',
      currentEvidence: [
        `audioReadinessStatus=${label(readiness?.audioReadinessStatus)}`,
        `productionReadinessStatus=${label(readiness?.productionReadinessStatus)}`,
        `requiredValidationEvidence=${label(readiness?.requiredValidationEvidence.length ?? 0)}`,
        `creditRecordsCreated=false`,
      ],
      missingFutureEvidence: observabilityCheck?.requiredEvidence ?? ['audit event schema', 'cost evidence', 'beta readiness evidence'],
      nextOwners: ['OBSERVABILITY_AUDIT_COST'],
      blockedUses: observabilityCheck?.blockedReasons ?? ['internal_test_scope_required'],
      notes: observabilityCheck?.notes ?? ['Audit and cost evidence are required before beta or production.'],
    }),
  ]

  return {
    reviewId: 'mock-sound-chat-handoff-evidence-review',
    workstreamId: 'SOUND_MUSIC_AUDIO',
    rows,
    blockedUseOwnerMap: allBlockedUses.map((blockedUse) => ({
      blockedUse,
      nextOwners: ownersForBlockedUse(blockedUse),
      explanation: `${label(blockedUse)} must be cleared by ${ownersForBlockedUse(blockedUse).join(', ')} before real audio generation or export.`,
    })),
    realGenerationExportBlocked: true,
    realGenerationExportBlockedReasons: [
      'No approved plan snapshot record exists.',
      'No audio QA evidence record exists.',
      'Provider/license evidence is pending Provider Gateway handoff.',
      'Worker execution contracts and dispatch remain blocked.',
      'Supabase/RLS/Storage mutation and private storage write evidence are missing.',
      'Track A final composition/export readiness is false.',
    ],
    approvedSnapshotCreated: false,
    evidenceRecordsCreated: false,
    creditRecordsCreated: false,
    mayCallProvider: false,
    mayDispatchWorker: false,
    mayCreateGeneratedAsset: false,
    publicArtifactAllowed: false,
    supabaseMutationAllowed: false,
    storageWriteAllowed: false,
    providerTransportAllowed: false,
    finalRenderExportReady: false,
  }
}
