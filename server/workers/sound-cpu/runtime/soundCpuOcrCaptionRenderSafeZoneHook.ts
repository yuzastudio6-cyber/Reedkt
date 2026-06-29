import type { SoundCpuRuntimeDisabledFlags } from './soundCpuJobContracts'
import {
  SOUND_CPU_RUNTIME_DISABLED_FLAGS,
  SOUND_CPU_RUNTIME_OWNER_GATE,
  assertSoundCpuRuntimeDisabledFlags,
} from './soundCpuRuntimeGuards'

export const SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME =
  'ocrCaptionRenderSafeZonePlanningHook' as const
export const SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS =
  'source_created_execution_blocked' as const
export const SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_BLOCKED_REASON =
  'OCR caption/render safe-zone hook source exists, but execution remains blocked pending owner gates.'

export type SoundCpuOcrCaptionRenderCollisionRisk =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'blocking'

export type SoundCpuOcrCaptionRenderConfidenceBand = 'low' | 'medium' | 'high' | 'unknown'

export type SoundCpuNormalizedBox = Readonly<{
  x: number
  y: number
  width: number
  height: number
}>

export type SoundCpuCaptionCandidateZoneMetadata = Readonly<{
  zoneId: string
  label: string
  normalizedBox: SoundCpuNormalizedBox
  collisionRisk: SoundCpuOcrCaptionRenderCollisionRisk
}>

export type SoundCpuOcrRegionBoxMetadata = Readonly<{
  regionIdHash: string
  normalizedBox: SoundCpuNormalizedBox
  confidenceBand: SoundCpuOcrCaptionRenderConfidenceBand
}>

export type SoundCpuOcrCaptionRenderSafeZoneHookInput = Readonly<{
  approvedPlanSnapshotId: string
  phase37eRunId: string
  captionCandidateZones: readonly SoundCpuCaptionCandidateZoneMetadata[]
  normalizedOcrRegionBoxes: readonly SoundCpuOcrRegionBoxMetadata[]
  hashedOcrRegionIds: readonly string[]
  lowerThirdCollisionFlags: readonly string[]
  manualReviewRequiredFlags: readonly string[]
  runtimeDisabledFlags?: SoundCpuRuntimeDisabledFlags
}>

export type SoundCpuOcrCaptionRenderSafeZoneConstraintPlan = Readonly<{
  approvedPlanSnapshotId: string
  phase37eRunId: string
  candidateZoneCount: number
  ocrRegionCount: number
  hashedOcrRegionIdCount: number
  lowerThirdCollisionFlagCount: number
  manualReviewRequiredFlagCount: number
  blockedCandidateZoneCount: number
  saferCandidateZoneCount: number
  rejectedInputs: readonly string[]
}>

export type SoundCpuOcrCaptionRenderSafeZoneHookResult = Readonly<{
  blockedStatus: 'blocked_by_owner_gate'
  blockedReason: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_BLOCKED_REASON
  hookName: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME
  sourceStatus: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS
  ownerGateRequired: typeof SOUND_CPU_RUNTIME_OWNER_GATE
  captionSafeZoneConstraintPlan: SoundCpuOcrCaptionRenderSafeZoneConstraintPlan
  manualCaptionLayoutReviewRequired: boolean
  runtimeDisabledFlags: SoundCpuRuntimeDisabledFlags
  runtimeExecutionApproved: false
  workerExecutionApproved: false
  renderExecutionApproved: false
  mediaProcessingApproved: false
  artifactCreationApproved: false
  noArtifactCreated: true
}>

const REJECTED_INPUTS = [
  'rawFrames',
  'rawOcrTextFromControlledMedia',
  'mediaFilePathsForExecution',
  'signedUrlsAsSourceOfTruth',
  'serviceRolePayloads',
  'providerOutputBlobs',
  'artifactWriteTargets',
] as const

function isBlockedZone(zone: SoundCpuCaptionCandidateZoneMetadata): boolean {
  return zone.collisionRisk === 'high' || zone.collisionRisk === 'blocking'
}

export function createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult(
  input: SoundCpuOcrCaptionRenderSafeZoneHookInput,
): SoundCpuOcrCaptionRenderSafeZoneHookResult {
  const runtimeDisabledFlags = assertSoundCpuRuntimeDisabledFlags(
    input.runtimeDisabledFlags ?? SOUND_CPU_RUNTIME_DISABLED_FLAGS,
  )
  const blockedCandidateZoneCount = input.captionCandidateZones.filter(isBlockedZone).length
  const manualCaptionLayoutReviewRequired =
    blockedCandidateZoneCount === input.captionCandidateZones.length ||
    input.manualReviewRequiredFlags.length > 0

  return {
    blockedStatus: 'blocked_by_owner_gate',
    blockedReason: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_BLOCKED_REASON,
    hookName: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME,
    sourceStatus: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS,
    ownerGateRequired: SOUND_CPU_RUNTIME_OWNER_GATE,
    captionSafeZoneConstraintPlan: {
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      phase37eRunId: input.phase37eRunId,
      candidateZoneCount: input.captionCandidateZones.length,
      ocrRegionCount: input.normalizedOcrRegionBoxes.length,
      hashedOcrRegionIdCount: input.hashedOcrRegionIds.length,
      lowerThirdCollisionFlagCount: input.lowerThirdCollisionFlags.length,
      manualReviewRequiredFlagCount: input.manualReviewRequiredFlags.length,
      blockedCandidateZoneCount,
      saferCandidateZoneCount: input.captionCandidateZones.length - blockedCandidateZoneCount,
      rejectedInputs: REJECTED_INPUTS,
    },
    manualCaptionLayoutReviewRequired,
    runtimeDisabledFlags,
    runtimeExecutionApproved: false,
    workerExecutionApproved: false,
    renderExecutionApproved: false,
    mediaProcessingApproved: false,
    artifactCreationApproved: false,
    noArtifactCreated: true,
  }
}

export function assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked(): never {
  throw new Error(SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_BLOCKED_REASON)
}
