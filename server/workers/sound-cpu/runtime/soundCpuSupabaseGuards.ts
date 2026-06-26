export const SOUND_CPU_SUPABASE_OWNER_GATE = 'SUPABASE_RLS_STORAGE_DATABASE' as const

export type SoundCpuSupabaseNoopClassification = Readonly<{
  updateRequired: 'no'
  environmentTouched: 'no'
  sqlExecuted: 'no'
  migrationDeployed: 'no'
  nextAction: 'none'
}>

export type SoundCpuSupabaseGuardState = SoundCpuSupabaseNoopClassification &
  Readonly<{
    serviceRoleMutationApproved: false
    storageWriteApproved: false
    signedUrlCreationApproved: false
    ownerGateRequired: typeof SOUND_CPU_SUPABASE_OWNER_GATE
  }>

export const SOUND_CPU_SUPABASE_GUARD_STATE: SoundCpuSupabaseGuardState = {
  updateRequired: 'no',
  environmentTouched: 'no',
  sqlExecuted: 'no',
  migrationDeployed: 'no',
  nextAction: 'none',
  serviceRoleMutationApproved: false,
  storageWriteApproved: false,
  signedUrlCreationApproved: false,
  ownerGateRequired: SOUND_CPU_SUPABASE_OWNER_GATE,
}

export function getSoundCpuSupabaseGuardState(): SoundCpuSupabaseGuardState {
  return SOUND_CPU_SUPABASE_GUARD_STATE
}

export function assertSoundCpuSupabaseMutationBlocked(): never {
  throw new Error('SOUND CPU Supabase, SQL, storage, and signed URL operations remain blocked pending Supabase owner gates.')
}
