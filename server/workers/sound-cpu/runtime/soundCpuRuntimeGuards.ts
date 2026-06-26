import {
  createSoundCpuBlockedContractResult,
  type SoundCpuJobContractResult,
  type SoundCpuRuntimeDisabledFlags,
} from './soundCpuJobContracts'

export const SOUND_CPU_RUNTIME_DISABLED_FLAG_KEYS = [
  'REEDITPRO_SOUND_CPU_RUNTIME_ENABLED',
  'REEDITPRO_WORKER_EXECUTION_ENABLED',
  'REEDITPRO_MEDIA_PROCESSING_ENABLED',
  'REEDITPRO_SUPABASE_MUTATION_ENABLED',
  'REEDITPRO_ARTIFACT_WRITE_ENABLED',
] as const

export type SoundCpuRuntimeDisabledFlagKey = (typeof SOUND_CPU_RUNTIME_DISABLED_FLAG_KEYS)[number]

export const SOUND_CPU_RUNTIME_DISABLED_FLAGS = {
  REEDITPRO_SOUND_CPU_RUNTIME_ENABLED: '0',
  REEDITPRO_WORKER_EXECUTION_ENABLED: '0',
  REEDITPRO_MEDIA_PROCESSING_ENABLED: '0',
  REEDITPRO_SUPABASE_MUTATION_ENABLED: '0',
  REEDITPRO_ARTIFACT_WRITE_ENABLED: '0',
} as const satisfies SoundCpuRuntimeDisabledFlags

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

export function getSoundCpuRuntimeDisabledFlags(): SoundCpuRuntimeDisabledFlags {
  return SOUND_CPU_RUNTIME_DISABLED_FLAGS
}

export function assertSoundCpuRuntimeDisabledFlags(
  flags: SoundCpuRuntimeDisabledFlags = SOUND_CPU_RUNTIME_DISABLED_FLAGS,
): SoundCpuRuntimeDisabledFlags {
  for (const key of SOUND_CPU_RUNTIME_DISABLED_FLAG_KEYS) {
    if (flags[key] !== '0') {
      throw new Error(`SOUND CPU runtime flag ${key} must remain disabled until owner gates approve execution.`)
    }
  }

  return flags
}

export function createSoundCpuRuntimeBlockedResult(
  reason = SOUND_CPU_RUNTIME_BLOCKED_REASON,
): SoundCpuJobContractResult {
  return createSoundCpuBlockedContractResult(reason)
}

export function assertSoundCpuRuntimeExecutionBlocked(): never {
  throw new Error(SOUND_CPU_RUNTIME_BLOCKED_REASON)
}
