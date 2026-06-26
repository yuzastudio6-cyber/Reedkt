export const SOUND_CPU_MEDIA_OWNER_GATE = 'SOUND_RUNTIME_MEDIA_GATE' as const

export type SoundCpuMediaGuardState = Readonly<{
  mediaFileOpenApproved: false
  mediaProcessingApproved: false
  ffmpegFfprobeApproved: false
  audioOutputWriteApproved: false
  ownerGateRequired: typeof SOUND_CPU_MEDIA_OWNER_GATE
}>

export const SOUND_CPU_MEDIA_GUARD_STATE: SoundCpuMediaGuardState = {
  mediaFileOpenApproved: false,
  mediaProcessingApproved: false,
  ffmpegFfprobeApproved: false,
  audioOutputWriteApproved: false,
  ownerGateRequired: SOUND_CPU_MEDIA_OWNER_GATE,
}

export function getSoundCpuMediaGuardState(): SoundCpuMediaGuardState {
  return SOUND_CPU_MEDIA_GUARD_STATE
}

export function assertSoundCpuMediaOperationBlocked(): never {
  throw new Error('SOUND CPU media operations remain blocked pending SOUND runtime/media owner gates.')
}
