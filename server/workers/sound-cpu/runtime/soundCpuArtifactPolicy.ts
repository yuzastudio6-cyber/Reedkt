export const SOUND_CPU_ARTIFACT_OWNER_GATE = 'PUBLIC_ARTIFACT_DELIVERY_POLICY' as const

export type SoundCpuArtifactPolicyState = Readonly<{
  privateArtifactWriteApproved: false
  publicArtifactCreationApproved: false
  storageTransferApproved: false
  signedUrlCreationApproved: false
  ownerGateRequired: typeof SOUND_CPU_ARTIFACT_OWNER_GATE
}>

export const SOUND_CPU_ARTIFACT_POLICY_STATE: SoundCpuArtifactPolicyState = {
  privateArtifactWriteApproved: false,
  publicArtifactCreationApproved: false,
  storageTransferApproved: false,
  signedUrlCreationApproved: false,
  ownerGateRequired: SOUND_CPU_ARTIFACT_OWNER_GATE,
}

export function getSoundCpuArtifactPolicyState(): SoundCpuArtifactPolicyState {
  return SOUND_CPU_ARTIFACT_POLICY_STATE
}

export function assertSoundCpuArtifactWriteBlocked(): never {
  throw new Error('SOUND CPU artifact writes and public delivery remain blocked pending artifact owner gates.')
}
