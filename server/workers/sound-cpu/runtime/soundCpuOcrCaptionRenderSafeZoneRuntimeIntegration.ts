import type { SoundCpuRuntimeDisabledFlags } from './soundCpuJobContracts'
import {
  SOUND_CPU_RUNTIME_DISABLED_FLAGS,
  SOUND_CPU_RUNTIME_OWNER_GATE,
  assertSoundCpuRuntimeDisabledFlags,
} from './soundCpuRuntimeGuards'
import {
  SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_BLOCKED_REASON,
  SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_NAME,
  SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_STATUS,
  createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult,
  type SoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult,
} from './soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration'
import {
  SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME,
  SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS,
} from './soundCpuOcrCaptionRenderSafeZoneHook'

export const SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_STATUS =
  'runtime_integration_source_created_execution_blocked' as const
export const SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_NAME =
  'ocrCaptionRenderSafeZoneRuntimeIntegration' as const
export const SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_BLOCKED_REASON =
  'OCR caption/render safe-zone runtime integration source exists, but execution and wiring remain blocked pending owner gates.'

export type SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationInput = Readonly<{
  approvedPlanSnapshotId: string
  runtimeIntegrationPlanId: string
  blockedStateIntegrationPlanId: string
  runtimeDisabledFlags?: SoundCpuRuntimeDisabledFlags
}>

export type SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationResult = Readonly<{
  blockedStatus: 'blocked_by_owner_gate'
  blockedReason: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_BLOCKED_REASON
  runtimeIntegrationName: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_NAME
  runtimeIntegrationSourceStatus: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_STATUS
  blockedStateIntegrationName: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_NAME
  blockedStateIntegrationSourceStatus: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_STATUS
  blockedStateIntegrationBlockedReason: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_BLOCKED_REASON
  hookName: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME
  hookSourceStatus: typeof SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS
  ownerGateRequired: typeof SOUND_CPU_RUNTIME_OWNER_GATE
  approvedPlanSnapshotId: string
  runtimeIntegrationPlanId: string
  blockedStateIntegrationPlanId: string
  blockedStateIntegrationResult: SoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult
  runtimeDisabledFlags: SoundCpuRuntimeDisabledFlags
  runtimeExecutionApproved: false
  workerExecutionApproved: false
  renderExecutionApproved: false
  mediaProcessingApproved: false
  artifactCreationApproved: false
  supabaseSqlApproved: false
  routeToolProviderApproved: false
  realUserMediaBetaApproved: false
  paidProductionApproved: false
  noArtifactCreated: true
}>

export function createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult(
  input: SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationInput,
): SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationResult {
  const runtimeDisabledFlags = assertSoundCpuRuntimeDisabledFlags(
    input.runtimeDisabledFlags ?? SOUND_CPU_RUNTIME_DISABLED_FLAGS,
  )
  const blockedStateIntegrationResult = createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult({
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    integrationPlanId: input.blockedStateIntegrationPlanId,
    runtimeDisabledFlags,
  })

  return {
    blockedStatus: 'blocked_by_owner_gate',
    blockedReason: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_BLOCKED_REASON,
    runtimeIntegrationName: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_NAME,
    runtimeIntegrationSourceStatus: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_STATUS,
    blockedStateIntegrationName: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_NAME,
    blockedStateIntegrationSourceStatus: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_STATUS,
    blockedStateIntegrationBlockedReason: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_BLOCKED_REASON,
    hookName: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME,
    hookSourceStatus: SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS,
    ownerGateRequired: SOUND_CPU_RUNTIME_OWNER_GATE,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    runtimeIntegrationPlanId: input.runtimeIntegrationPlanId,
    blockedStateIntegrationPlanId: input.blockedStateIntegrationPlanId,
    blockedStateIntegrationResult,
    runtimeDisabledFlags,
    runtimeExecutionApproved: false,
    workerExecutionApproved: false,
    renderExecutionApproved: false,
    mediaProcessingApproved: false,
    artifactCreationApproved: false,
    supabaseSqlApproved: false,
    routeToolProviderApproved: false,
    realUserMediaBetaApproved: false,
    paidProductionApproved: false,
    noArtifactCreated: true,
  }
}

export function assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked(): never {
  throw new Error(SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_BLOCKED_REASON)
}
