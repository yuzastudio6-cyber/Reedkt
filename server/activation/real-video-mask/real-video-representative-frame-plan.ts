import { realVideoMaskConfig } from './real-video-mask-policy'
import type { RealVideoRepresentativeFramePlan } from './real-video-mask-types'

export function buildRepresentativeFramePlan(): RealVideoRepresentativeFramePlan {
  return {
    sourceGcsUri: realVideoMaskConfig.sourceGcsUri,
    defaultTimestampSeconds: 7.7,
    selectionRule: 'duration_midpoint_if_available_else_default',
    outputObjectTemplate: `gs://${realVideoMaskConfig.generatedAssetsBucket}/${realVideoMaskConfig.phase33dPrefix}/<runId>/representative-frame/frame.png`,
    exactlyOneFrame: true,
  }
}

export function selectRepresentativeFrameTimestamp(durationSeconds?: number): { timestampSeconds: number; reason: string } {
  if (durationSeconds !== undefined && Number.isFinite(durationSeconds) && durationSeconds > 1) {
    return {
      timestampSeconds: Math.max(0, Math.min(durationSeconds / 2, durationSeconds - 0.1)),
      reason: 'Selected the 50 percent duration midpoint from ffprobe metadata.',
    }
  }
  return {
    timestampSeconds: 7.7,
    reason: 'Selected the Phase 33D default midpoint timestamp because duration metadata was unavailable.',
  }
}
