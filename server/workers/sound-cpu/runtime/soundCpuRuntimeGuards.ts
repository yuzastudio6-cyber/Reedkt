import { createSoundCpuBlockedContractResult, type SoundCpuJobContractResult } from './soundCpuJobContracts'

export const SOUND_CPU_RUNTIME_DISABLED_FLAGS = {
  REEDITPRO_SOUND_CPU_RUNTIME_ENABLED: '0',
  REEDITPRO_WORKER_EXECUTION_ENABLED: '0',
  REEDITPRO_MEDIA_PROCESSING_ENABLED: '0',
  REEDITPRO_SUPABASE_MUTATION_ENABLED: '0',
  REEDITPRO_ARTIFACT_WRITE_ENABLED: '0',
} as const

export const SOUND_CPU_RUNTIME_OWNER_GATE = 'WORKER_RUNTIME_JOBS' as const
export const SOUND_CPU_RUNTIME_BLOCKED_REASON =
  'SOUND CPU runtime source exists, but execution remains blocked pending owner gates.'

export type SoundCpuRuntimeGateState = Readonly<{
  runtimeSourceCreated: true
  runtimeExecutionApproved: false
  workerExecutionApproved: false
  mediaProcessingApproved: false
  supabaseMutationApproved: false
  artifactWriteApproved: false
  ownerGateRequired: typeof SOUND_CPU_RUNTIME_OWNER_GATE
}>

export function getSoundCpuRuntimeGateState(): SoundCpuRuntimeGateState {
  return {
    runtimeSourceCreated: true,
    runtimeExecutionApproved: false,
    workerExecutionApproved: false,
    mediaProcessingApproved: false,
    supabaseMutationApproved: false,
    artifactWriteApproved: false,
    ownerGateRequired: SOUND_CPU_RUNTIME_OWNER_GATE,
  }
}

export function createSoundCpuRuntimeBlockedResult(
  reason = SOUND_CPU_RUNTIME_BLOCKED_REASON,
): SoundCpuJobContractResult {
  return createSoundCpuBlockedContractResult(reason)
}

export function assertSoundCpuRuntimeExecutionBlocked(): never {
  throw new Error(SOUND_CPU_RUNTIME_BLOCKED_REASON)
}
