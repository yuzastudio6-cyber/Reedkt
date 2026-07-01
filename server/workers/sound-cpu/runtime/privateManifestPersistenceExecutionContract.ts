import {
  SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_BINDING_SOURCE_GATE,
  createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult,
  type SoundCpuPrivateManifestPersistenceBlockedReason,
  type SoundCpuPrivateManifestPersistenceInput,
  type SoundCpuPrivateManifestPersistenceResult,
} from './privateManifestPersistence'

export const SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_EXECUTION_CONTRACT_SOURCE_GATE =
  {
    gate:
      'worker_runtime_jobs_sound_cpu_phase104_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_source_gate',
    targetPath:
      'server/workers/sound-cpu/runtime/privateManifestPersistenceExecutionContract.ts',
    contractSourceKind: 'fail_closed_external_agent_contract_source_surface',
    delegatesTo: 'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult',
    requiredBindingGate:
      SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_BINDING_SOURCE_GATE.gate,
    requiredExports: [
      'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_EXECUTION_CONTRACT_SOURCE_GATE',
      'createSoundCpuPrivateManifestPersistenceRuntimeExecutionContractBlockedResult',
      'getSoundCpuPrivateManifestPersistenceRuntimeExecutionContractSourceGate',
    ],
    acceptedForExternalAgentExecutionToday: false,
    acceptedForRuntimeExecutionToday: false,
    acceptedForPersistenceToday: false,
    acceptedForStorageObjectCreationToday: false,
    acceptedForSignedUrlCreationToday: false,
    acceptedForWorkerDispatchToday: false,
    acceptedForMediaOpenToday: false,
    acceptedForBetaUnlockToday: false,
    acceptedForProductionUnlockToday: false,
  } as const

export type SoundCpuPrivateManifestPersistenceRuntimeExecutionContractSourceGate =
  typeof SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_EXECUTION_CONTRACT_SOURCE_GATE

export type SoundCpuPrivateManifestPersistenceRuntimeExecutionContractInput =
  SoundCpuPrivateManifestPersistenceInput

export type SoundCpuPrivateManifestPersistenceRuntimeExecutionContractResult =
  SoundCpuPrivateManifestPersistenceResult

export function getSoundCpuPrivateManifestPersistenceRuntimeExecutionContractSourceGate(): SoundCpuPrivateManifestPersistenceRuntimeExecutionContractSourceGate {
  return SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_EXECUTION_CONTRACT_SOURCE_GATE
}

export function createSoundCpuPrivateManifestPersistenceRuntimeExecutionContractBlockedResult(
  input: SoundCpuPrivateManifestPersistenceRuntimeExecutionContractInput,
  blockedReason: SoundCpuPrivateManifestPersistenceBlockedReason = 'supabase_owner_gate_required',
): SoundCpuPrivateManifestPersistenceRuntimeExecutionContractResult {
  return createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult(input, blockedReason)
}
