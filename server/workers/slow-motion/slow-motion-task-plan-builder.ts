import type { SlowMotionExecutionInput, SlowMotionTaskPlan, SlowMotionToolId } from './slow-motion-execution-types'

export function buildSlowMotionTaskPlan(input: SlowMotionExecutionInput): SlowMotionTaskPlan {
  const selectedClipRanges = input.selectedClipRanges ?? []
  const useFilm = input.interpolationMode === 'film' && selectedClipRanges.length > 0
  const warnings = [
    ...(input.slowMotionFactor > 3 ? ['Slow-motion factor above 3x requires ghosting, warping, and duplicated-object QA.'] : []),
    ...(input.interpolationMode === 'planning_only' ? ['Slow-motion is planning-only; no interpolation tool is selected.'] : []),
    'Audio handoff remains a future final render/export concern.',
  ]
  return {
    taskPlanId: `slow-motion-task-${input.mediaAssetId}-${input.interpolationMode}`,
    selectedClipRanges,
    slowMotionFactor: input.slowMotionFactor,
    interpolationMode: input.interpolationMode,
    primaryTool: primaryTool(input),
    fallbackTools: fallbackTools(input),
    modelWeightRequirements: useFilm ? ['film_model'] : [],
    expectedArtifacts: expectedArtifacts(input),
    qaGatePlan: ['slow_motion_artifacts', 'render_asset_integrity'],
    previewAllowed: input.mode === 'local_dev' && input.enableFfmpegFallbackPreview === true,
    finalRenderAllowed: false,
    reasons: [
      'Slow motion is scoped to selected clip ranges only.',
      useFilm ? 'FILM interpolation is planned only where selected ranges justify interpolation.' : 'FFmpeg native speed or planning-only fallback avoids model interpolation risk.',
      'M15D does not final render/export slow-motion media.',
    ],
    warnings,
  }
}

function primaryTool(input: SlowMotionExecutionInput): SlowMotionToolId {
  if (input.interpolationMode === 'film') return 'film'
  if (input.interpolationMode === 'ffmpeg_native_speed') return 'ffmpeg'
  return 'none'
}

function fallbackTools(input: SlowMotionExecutionInput): SlowMotionToolId[] {
  if (input.interpolationMode === 'film') return ['ffmpeg']
  if (input.interpolationMode === 'ffmpeg_native_speed') return ['none']
  return ['none']
}

function expectedArtifacts(input: SlowMotionExecutionInput): SlowMotionTaskPlan['expectedArtifacts'] {
  const artifacts: SlowMotionTaskPlan['expectedArtifacts'] = ['interpolated_video', 'qa_report']
  if (input.enableFfmpegFallbackPreview === true) artifacts.push('preview_video')
  return [...new Set(artifacts)]
}
