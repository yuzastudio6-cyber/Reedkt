import path from 'node:path'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl, assertOutputPathInsideRoot, assertSourceNotOverwritten } from '../media/media-path-safety'
import type { SlowMotionExecutionInput, SlowMotionExecutionValidationResult, SlowMotionTaskPlan } from './slow-motion-execution-types'

const MIN_SLOW_MOTION_FACTOR = 1.25
const MAX_SLOW_MOTION_FACTOR = 4

export function validateSlowMotionExecutionInput(input: SlowMotionExecutionInput): SlowMotionExecutionValidationResult {
  const issues: SlowMotionExecutionValidationResult['issues'] = []

  if (input.allowModelDownload === true) issues.push(blocking('model_download_blocked', 'Model downloads are out of scope for M15D.'))
  if (input.allowFinalRender === true) issues.push(blocking('final_render_blocked', 'Final render/export is out of scope for M15D.'))
  if ((input.arbitraryModelArgs?.length ?? 0) > 0) issues.push(blocking('arbitrary_model_args', 'Arbitrary model args are blocked.'))
  if ((input.arbitraryFfmpegArgs?.length ?? 0) > 0) issues.push(blocking('arbitrary_ffmpeg_args', 'Arbitrary FFmpeg args are blocked.'))

  for (const [label, value] of [
    ['sourceVideoLocalPath', input.sourceVideoLocalPath],
    ['proxyVideoLocalPath', input.proxyVideoLocalPath],
    ['outputDirectory', input.outputDirectory],
    ['filmModelLocalPath', input.filmModelLocalPath],
  ] as const) {
    if (!value) continue
    try {
      assertNoSignedUrlOrRawUrl(value, label)
      assertNoPathTraversal(value, label)
    } catch (error) {
      issues.push(blocking('unsafe_slow_motion_reference', error instanceof Error ? error.message : `${label} is unsafe.`))
    }
  }

  const sourcePath = input.proxyVideoLocalPath ?? input.sourceVideoLocalPath
  if (sourcePath && input.outputDirectory) {
    try {
      const outputPath = assertOutputPathInsideRoot(path.join(input.outputDirectory, 'interpolated-video.mp4'), input.outputDirectory)
      assertSourceNotOverwritten(sourcePath, outputPath)
    } catch {
      issues.push(blocking('source_overwrite_risk', 'Slow-motion outputs must not overwrite source/proxy media.'))
    }
  }

  if (input.selectedClipRanges.length === 0) issues.push(blocking('selected_clip_ranges_required', 'Slow motion must target selected clip ranges, not the whole project by default.'))
  for (const range of input.selectedClipRanges) {
    if (range.startSeconds < 0) issues.push(blocking('negative_clip_range', 'Slow-motion clip ranges cannot start before zero.'))
    if (range.endSeconds <= range.startSeconds) issues.push(blocking('invalid_clip_range', 'Slow-motion clip ranges must end after start.'))
  }

  if (input.slowMotionFactor <= 1 || input.slowMotionFactor < MIN_SLOW_MOTION_FACTOR || input.slowMotionFactor > MAX_SLOW_MOTION_FACTOR) {
    issues.push(blocking('unsafe_slow_motion_factor', 'Slow-motion factor must be greater than 1 and no more than 4 in M15D.'))
  } else if (input.slowMotionFactor > 3) {
    issues.push(warning('slow_motion_factor_review', 'Slow-motion factor above 3x needs extra ghosting/warping QA.'))
  }

  if (input.mode === 'production_ready' && input.interpolationMode === 'film' && (input.modelWeightManifestIds?.length ?? 0) === 0) {
    issues.push(blocking('model_weight_manifest_required', 'Production FILM execution requires modelWeightManifestId approval.'))
  }

  return { valid: !issues.some((issue) => issue.severity === 'blocking'), issues }
}

export function validateSlowMotionTaskPlan(plan: SlowMotionTaskPlan): SlowMotionExecutionValidationResult {
  const issues: SlowMotionExecutionValidationResult['issues'] = []
  if (plan.finalRenderAllowed) issues.push(blocking('final_render_allowed', 'Slow-motion task plan must keep finalRenderAllowed false.'))
  if (plan.selectedClipRanges.length === 0) issues.push(blocking('selected_clip_ranges_required', 'Slow-motion task plan must use selected clips only.'))
  if (plan.slowMotionFactor <= 1 || plan.slowMotionFactor < MIN_SLOW_MOTION_FACTOR || plan.slowMotionFactor > MAX_SLOW_MOTION_FACTOR) {
    issues.push(blocking('unsafe_slow_motion_factor', 'Slow-motion task plan factor is outside policy.'))
  }
  return { valid: !issues.some((issue) => issue.severity === 'blocking'), issues }
}

function blocking(code: string, message: string): SlowMotionExecutionValidationResult['issues'][number] {
  return { code, message, severity: 'blocking' }
}

function warning(code: string, message: string): SlowMotionExecutionValidationResult['issues'][number] {
  return { code, message, severity: 'warning' }
}
