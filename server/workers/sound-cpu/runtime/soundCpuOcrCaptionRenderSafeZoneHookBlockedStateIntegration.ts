import type { SoundCpuRuntimeDisabledFlags } from './soundCpuJobContracts'
import {
  SOUND_CPU_RUNTIME_DISABLED_FLAGS,
  SOUND_CPU_RUNTIME_OWNER_GATE,
  assertSoundCpuRuntimeDisabledFlags,
} from './soundCpuRuntimeGuards'
import {
  SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_BLOCKED_REASON,
  SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME,
  SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS,
} from './soundCpuOcrCaptionRenderSafeZoneHook'

export const SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_STATUS =
  'blocked_state_source_created_execution_blocked' as const
export const SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_NAME =
  'ocrCaptionRenderSafeZoneBlockedStateIntegration' as const
export const SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_BLOCKED_REASON =
  'OCR caption/render safe-zone blocked-state integration source exists, but runtime execution remains blocked pending owner gates.'

export type SoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationInput = Readonly<{
  approvedPlanSnapshotId: string
  integrationPlanId: string
  runtimeDisabledFlags?: SoundCpuRuntimeDisabledFlags
}>

export type SoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult = Readonly<{
  blockedStatus: 'blocked_by_owner_gate'
  blockedReason: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_BLOCKED_REASON
  integrationName: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_NAME
  integrationSourceStatus: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_STATUS
  hookName: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME
  hookSourceStatus: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS
  hookBlockedReason: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_BLOCKED_REASON
  ownerGateRequired: typeof SOUND_CPU_RUNTIME_OWNER_GATE
  approvedPlanSnapshotId: string
  integrationPlanId: string
  runtimeDisabledFlags: SoundCpuRuntimeDisabledFlags
  runtimeExecutionApproved: false
  workerExecutionApproved: false
  renderExecutionApproved: false
  mediaProcessingApproved: false
  artifactCreationApproved: false
  supabaseSqlApproved: false
  noArtifactCreated: true
}>

export function createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult(
  input: SoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationInput,
): SoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult {
  const runtimeDisabledFlags = assertSoundCpuRuntimeDisabledFlags(
    input.runtimeDisabledFlags ?? SOUND_CPU_RUNTIME_DISABLED_FLAGS,
  )

  return {
    blockedStatus: 'blocked_by_owner_gate',
    blockedReason: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_BLOCKED_REASON,
    integrationName: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_NAME,
    integrationSourceStatus: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_STATUS,
    hookName: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME,
    hookSourceStatus: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS,
    hookBlockedReason: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_BLOCKED_REASON,
    ownerGateRequired: SOUND_CPU_RUNTIME_OWNER_GATE,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    integrationPlanId: input.integrationPlanId,
    runtimeDisabledFlags,
    runtimeExecutionApproved: false,
    workerExecutionApproved: false,
    renderExecutionApproved: false,
    mediaProcessingApproved: false,
    artifactCreationApproved: false,
    supabaseSqlApproved: false,
    noArtifactCreated: true,
  }
}

export function assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked(): never {
  throw new Error(SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_BLOCKED_REASON)
}
