import {
  SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS,
  type SoundCpuPrivateManifestJobType,
  type SoundCpuPrivateManifestRuntimeDefaults,
  type SoundCpuPrivateManifestWorkerName,
} from './privateManifest'
import {
  SOUND_CPU_SUPABASE_OWNER_GATE,
  assertSoundCpuSupabaseMutationBlocked,
  getSoundCpuSupabaseGuardState,
  type SoundCpuSupabaseGuardState,
} from './soundCpuSupabaseGuards'

export const SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_SCHEMA_VERSION =
  'sound-cpu-private-manifest-persistence-v1' as const

export const SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_REJECTED_INPUT_FIELDS = [
  'rawPromptText',
  'rawMediaPaths',
  'signedUrls',
  'providerOutputBlobs',
  'serviceRolePayloads',
  'secretValues',
  'modelWeightLocations',
  'publicArtifactUrls',
] as const

export const SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_BLOCKED_REASONS = [
  'supabase_owner_gate_required',
  'storage_owner_gate_required',
  'worker_dispatch_gate_required',
  'real_media_boundary_required',
  'signed_url_policy_required',
] as const

export const SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_STATIC_INTEGRATION_SOURCE_GATE =
  {
    gate:
      'worker_runtime_jobs_sound_cpu_phase98_caption_render_runtime_hook_private_manifest_persistence_static_integration_source_gate',
    targetPath: 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts',
    plannedIntegrationKind: 'fail_closed_static_source_surface',
    requiredExports: [
      'createSoundCpuPrivateManifestPersistenceBlockedResult',
      'assertSoundCpuPrivateManifestPersistenceMutationBlocked',
    ],
    acceptedForRuntimeExecutionToday: false,
    acceptedForPersistenceToday: false,
    acceptedForStorageObjectCreationToday: false,
    acceptedForSignedUrlCreationToday: false,
    acceptedForWorkerDispatchToday: false,
    acceptedForMediaOpenToday: false,
    acceptedForBetaUnlockToday: false,
    acceptedForProductionUnlockToday: false,
  } as const

export const SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_BINDING_SOURCE_GATE =
  {
    gate:
      'worker_runtime_jobs_sound_cpu_phase101_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_source_gate',
    targetPath: 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts',
    bindingTarget: 'caption_render_runtime_hook_private_manifest_persistence_boundary',
    bindingKind: 'fail_closed_runtime_binding_to_blocked_result_adapter',
    requiredExports: [
      'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult',
      'assertSoundCpuPrivateManifestPersistenceMutationBlocked',
    ],
    acceptedForRuntimeExecutionToday: false,
    acceptedForPersistenceToday: false,
    acceptedForStorageObjectCreationToday: false,
    acceptedForSignedUrlCreationToday: false,
    acceptedForWorkerDispatchToday: false,
    acceptedForMediaOpenToday: false,
    acceptedForBetaUnlockToday: false,
    acceptedForProductionUnlockToday: false,
  } as const

export type SoundCpuPrivateManifestPersistenceBlockedReason =
  (typeof SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_BLOCKED_REASONS)[number]

export type SoundCpuPrivateManifestPersistenceRejectedInputField =
  (typeof SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_REJECTED_INPUT_FIELDS)[number]

export type SoundCpuPrivateManifestPersistenceStaticIntegrationSourceGate =
  typeof SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_STATIC_INTEGRATION_SOURCE_GATE

export type SoundCpuPrivateManifestPersistenceRuntimeBindingSourceGate =
  typeof SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_BINDING_SOURCE_GATE

export type SoundCpuPrivateManifestPersistenceContract = Readonly<{
  schemaVersion: typeof SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_SCHEMA_VERSION
  approvedPlanSnapshotId: string
  workspaceId: string
  projectId: string
  jobId: string
  stepId: string
  idempotencyKey: string
  workerName: SoundCpuPrivateManifestWorkerName
  jobType: SoundCpuPrivateManifestJobType
  privateManifestId: string
  manifestSchemaVersion: 'sound-cpu-private-media-manifest-v1'
  privateMediaAssetIds: readonly string[]
  plannedPrivateArtifactIds: readonly string[]
  privateStorageObjectRefs: readonly string[]
  auditEventId?: string
  runtimeDefaults: SoundCpuPrivateManifestRuntimeDefaults
  createdByWorker: SoundCpuPrivateManifestWorkerName
  createdAt: string
}>

export type SoundCpuPrivateManifestPersistenceInput = Readonly<
  Omit<SoundCpuPrivateManifestPersistenceContract, 'schemaVersion' | 'runtimeDefaults'> & {
    runtimeDefaults?: SoundCpuPrivateManifestRuntimeDefaults
  }
>

export type SoundCpuPrivateManifestPersistenceAuditShape = Readonly<{
  schemaVersion: typeof SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_SCHEMA_VERSION
  approvedPlanSnapshotId: string
  workspaceId: string
  projectId: string
  jobId: string
  stepId: string
  idempotencyKey: string
  workerName: SoundCpuPrivateManifestWorkerName
  jobType: SoundCpuPrivateManifestJobType
  privateManifestId: string
  blockedReason: SoundCpuPrivateManifestPersistenceBlockedReason
  ownerGateRequired: typeof SOUND_CPU_SUPABASE_OWNER_GATE
  rejectedInputFields: readonly SoundCpuPrivateManifestPersistenceRejectedInputField[]
}>

export type SoundCpuPrivateManifestPersistenceResult = Readonly<{
  status: 'blocked_by_owner_gate'
  blockedReason: SoundCpuPrivateManifestPersistenceBlockedReason
  ownerGateRequired: typeof SOUND_CPU_SUPABASE_OWNER_GATE
  contract: SoundCpuPrivateManifestPersistenceContract
  auditShape: SoundCpuPrivateManifestPersistenceAuditShape
  supabaseGuardState: SoundCpuSupabaseGuardState
  acceptedForPersistenceToday: false
  acceptedForStorageObjectCreationToday: false
  acceptedForSignedUrlCreationToday: false
  acceptedForWorkerDispatchToday: false
  acceptedForMediaOpenToday: false
  acceptedForBetaUnlockToday: false
  acceptedForProductionUnlockToday: false
}>

export function createSoundCpuPrivateManifestPersistenceBlockedResult(
  input: SoundCpuPrivateManifestPersistenceInput,
  blockedReason: SoundCpuPrivateManifestPersistenceBlockedReason = 'supabase_owner_gate_required',
): SoundCpuPrivateManifestPersistenceResult {
  const contract: SoundCpuPrivateManifestPersistenceContract = {
    ...input,
    schemaVersion: SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_SCHEMA_VERSION,
    runtimeDefaults: input.runtimeDefaults ?? SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS,
  }

  return {
    status: 'blocked_by_owner_gate',
    blockedReason,
    ownerGateRequired: SOUND_CPU_SUPABASE_OWNER_GATE,
    contract,
    auditShape: createSoundCpuPrivateManifestPersistenceAuditShape(contract, blockedReason),
    supabaseGuardState: getSoundCpuSupabaseGuardState(),
    acceptedForPersistenceToday: false,
    acceptedForStorageObjectCreationToday: false,
    acceptedForSignedUrlCreationToday: false,
    acceptedForWorkerDispatchToday: false,
    acceptedForMediaOpenToday: false,
    acceptedForBetaUnlockToday: false,
    acceptedForProductionUnlockToday: false,
  }
}

export function getSoundCpuPrivateManifestPersistenceStaticIntegrationSourceGate(): SoundCpuPrivateManifestPersistenceStaticIntegrationSourceGate {
  return SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_STATIC_INTEGRATION_SOURCE_GATE
}

export function createSoundCpuPrivateManifestPersistenceStaticIntegrationBlockedResult(
  input: SoundCpuPrivateManifestPersistenceInput,
  blockedReason: SoundCpuPrivateManifestPersistenceBlockedReason = 'supabase_owner_gate_required',
): SoundCpuPrivateManifestPersistenceResult {
  return createSoundCpuPrivateManifestPersistenceBlockedResult(input, blockedReason)
}

export function getSoundCpuPrivateManifestPersistenceRuntimeBindingSourceGate(): SoundCpuPrivateManifestPersistenceRuntimeBindingSourceGate {
  return SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_BINDING_SOURCE_GATE
}

export function createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult(
  input: SoundCpuPrivateManifestPersistenceInput,
  blockedReason: SoundCpuPrivateManifestPersistenceBlockedReason = 'supabase_owner_gate_required',
): SoundCpuPrivateManifestPersistenceResult {
  return createSoundCpuPrivateManifestPersistenceStaticIntegrationBlockedResult(input, blockedReason)
}

export function assertSoundCpuPrivateManifestPersistenceMutationBlocked(): never {
  return assertSoundCpuSupabaseMutationBlocked()
}

function createSoundCpuPrivateManifestPersistenceAuditShape(
  contract: SoundCpuPrivateManifestPersistenceContract,
  blockedReason: SoundCpuPrivateManifestPersistenceBlockedReason,
): SoundCpuPrivateManifestPersistenceAuditShape {
  return {
    schemaVersion: contract.schemaVersion,
    approvedPlanSnapshotId: contract.approvedPlanSnapshotId,
    workspaceId: contract.workspaceId,
    projectId: contract.projectId,
    jobId: contract.jobId,
    stepId: contract.stepId,
    idempotencyKey: contract.idempotencyKey,
    workerName: contract.workerName,
    jobType: contract.jobType,
    privateManifestId: contract.privateManifestId,
    blockedReason,
    ownerGateRequired: SOUND_CPU_SUPABASE_OWNER_GATE,
    rejectedInputFields: SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_REJECTED_INPUT_FIELDS,
  }
}
