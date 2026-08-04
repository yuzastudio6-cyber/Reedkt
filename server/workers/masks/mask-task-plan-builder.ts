import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import { buildMaskTemporalSmoothingPlan } from './mask-temporal-smoothing-policy'
import type { MaskExecutionInput, MaskTaskPlan, NewPlanMaskToolId } from './mask-execution-types'

const DEFAULT_MAX_FRAMES = 90
const ABSOLUTE_MAX_FRAMES = 300

export function buildMaskTaskPlan(input: MaskExecutionInput): MaskTaskPlan {
  assertNoHistoricalSam2Selection(input)
  const videoIntent = input.maskIntent === 'background_removal_video' || input.maskIntent === 'text_behind_subject'
  const primaryTool = normalizeSelectedPrimaryTool(input.selectedPrimaryTool) ?? selectPrimaryTool(input)
  const fallbackTools = normalizeFallbackTools(input.fallbackTools, input)
  const selectedFrames = buildSelectedFrames(input)
  const expectedArtifacts = expectedArtifactsForIntent(input)
  const temporalSmoothingPlan = buildMaskTemporalSmoothingPlan(input)
  const warnings: string[] = []

  if ((input.frameSamplingMaxFrames ?? DEFAULT_MAX_FRAMES) > ABSOLUTE_MAX_FRAMES) {
    warnings.push(`Frame sampling max exceeds M15C guard and will be capped at ${ABSOLUTE_MAX_FRAMES}.`)
  }
  if (videoIntent) {
    warnings.push('BiRefNet alone is not enough for professional video masks; tracking/refinement/temporal QA is required.')
  }
  if (input.maskIntent === 'text_behind_subject' && (input.maskConfidenceHint ?? 0.72) < 0.82) {
    warnings.push('Text-behind-subject should downgrade if mask confidence is not strong.')
  }

  return {
    taskPlanId: `mask-task-${input.mediaAssetId}-${input.maskIntent}`,
    maskIntent: input.maskIntent,
    primaryTool,
    fallbackTools,
    selectedFrames,
    videoFrameSamplingPolicy: {
      mode: videoIntent ? 'proxy_sampled' : 'single_frame',
      maxFrames: Math.min(input.frameSamplingMaxFrames ?? DEFAULT_MAX_FRAMES, ABSOLUTE_MAX_FRAMES),
      fullResolutionEveryFrame: false,
    },
    canonicalGpuExecutionPolicy: canonicalGpuExecutionPolicy(
      primaryTool,
      videoIntent,
    ),
    subjectSelection: input.subjectSelection,
    expectedArtifacts,
    modelWeightRequirements: modelWeightRequirements(input, primaryTool, fallbackTools),
    refinementPlan: {
      opencv: true,
      kornia: videoIntent,
      operations: videoIntent
        ? ['edge_cleanup', 'hole_fill', 'morphology', 'temporal_smoothing']
        : ['edge_cleanup', 'hole_fill', 'morphology'],
    },
    temporalSmoothingPlan,
    qaGatePlan: ['mask_edge_quality', 'mask_temporal_stability', 'mask_subject_coverage', 'render_asset_integrity'],
    previewAllowed: input.enableMaskPreview === true && input.mode === 'local_dev',
    finalRenderAllowed: false,
    reasons: [
      `Selected ${primaryTool} for ${input.maskIntent}.`,
      videoIntent ? 'Video/text-behind-subject masks require temporal consistency checks.' : 'Still-image mask path can use single-frame foreground extraction.',
      'OpenCV/Kornia refinement is planned as metadata unless tools are explicitly available in local-dev.',
    ],
    warnings,
  }
}

function selectPrimaryTool(input: MaskExecutionInput): NewPlanMaskToolId {
  if (input.maskIntent === 'background_removal_image' || input.maskIntent === 'subject_cutout') return 'birefnet'
  if (input.maskIntent === 'background_removal_video' || input.maskIntent === 'text_behind_subject') return 'sam3_1'
  if (input.maskIntent === 'blur_background') return 'sam3_1'
  return 'birefnet'
}

function normalizeSelectedPrimaryTool(tool: MaskExecutionInput['selectedPrimaryTool']): NewPlanMaskToolId | undefined {
  if (!tool) return undefined
  if (tool === 'sam2') {
    throw new Error('SAM 2 is historical-only and cannot be selected for a new mask plan.')
  }
  return tool
}

function normalizeFallbackTools(fallbackTools: MaskExecutionInput['fallbackTools'], input: MaskExecutionInput): NewPlanMaskToolId[] {
  if (fallbackTools?.length) {
    return [...new Set(fallbackTools.filter((tool): tool is NewPlanMaskToolId => tool !== 'none' && tool !== 'sam2'))]
  }
  if (input.maskIntent === 'background_removal_image' || input.maskIntent === 'subject_cutout') {
    return ['transparent_background', 'rembg', 'opencv']
  }
  if (input.maskIntent === 'text_behind_subject') {
    return ['none']
  }
  if (input.maskIntent === 'background_removal_video') {
    return ['none']
  }
  return ['sam3_1', 'opencv', 'kornia', 'transparent_background', 'rembg']
}

function assertNoHistoricalSam2Selection(input: MaskExecutionInput): void {
  if (input.selectedPrimaryTool === 'sam2' || input.fallbackTools?.includes('sam2')) {
    throw new Error('SAM 2 is historical-only and cannot be selected for a new mask plan; use the canonical SAM 3.1 path.')
  }
}

function buildSelectedFrames(input: MaskExecutionInput): MaskTaskPlan['selectedFrames'] {
  const frames = input.representativeFrameArtifactIds ?? []
  if (frames.length > 0) {
    return frames.slice(0, Math.min(input.frameSamplingMaxFrames ?? DEFAULT_MAX_FRAMES, ABSOLUTE_MAX_FRAMES)).map((frameId, index) => ({
      frameId,
      timeSeconds: input.subjectSelection?.frameTimeSeconds ?? index,
      reason: index === 0 ? 'primary representative frame' : 'temporal/sample coverage frame',
    }))
  }
  return [{
    frameId: `${input.mediaAssetId}-representative-frame-planned`,
    timeSeconds: input.subjectSelection?.frameTimeSeconds ?? 0,
    reason: 'planned representative frame placeholder',
  }]
}

function expectedArtifactsForIntent(input: MaskExecutionInput): MaskTaskPlan['expectedArtifacts'] {
  const artifacts: Array<Extract<ToolArtifact['artifactType'], 'mask_image' | 'mask_sequence' | 'rgba_cutout' | 'qa_report' | 'preview_video' | 'render_manifest'>> = ['qa_report']
  if (input.maskIntent === 'background_removal_video' || input.maskIntent === 'text_behind_subject') {
    artifacts.unshift('mask_sequence')
  } else {
    artifacts.unshift('mask_image')
  }
  if (input.maskIntent === 'background_removal_image' || input.maskIntent === 'subject_cutout') artifacts.push('rgba_cutout')
  if (input.maskIntent === 'text_behind_subject') artifacts.push('render_manifest')
  if (input.enableMaskPreview === true) artifacts.push('preview_video')
  return [...new Set(artifacts)]
}

function modelWeightRequirements(
  input: MaskExecutionInput,
  primaryTool: NewPlanMaskToolId,
  fallbackTools: NewPlanMaskToolId[],
): MaskTaskPlan['modelWeightRequirements'] {
  const requirements: MaskTaskPlan['modelWeightRequirements'] = []
  if (primaryTool === 'birefnet' || fallbackTools.includes('birefnet')) {
    requirements.push('birefnet_model')
  }
  if (
    input.maskIntent === 'background_removal_video' ||
    input.maskIntent === 'text_behind_subject' ||
    input.motionRequiresTracking ||
    primaryTool === 'sam3_1' ||
    fallbackTools.includes('sam3_1')
  ) {
    requirements.push('sam3_1_checkpoint')
  }
  if (primaryTool === 'transparent_background' || fallbackTools.includes('transparent_background')) {
    requirements.push('transparent_background_model')
  }
  if (primaryTool === 'rembg' || fallbackTools.includes('rembg')) {
    requirements.push('rembg_model')
  }
  return [...new Set(requirements)]
}

function canonicalGpuExecutionPolicy(
  primaryTool: NewPlanMaskToolId,
  videoIntent: boolean,
): MaskTaskPlan['canonicalGpuExecutionPolicy'] {
  const heavy = primaryTool === 'sam3_1'
  return {
    placementClass: heavy
      ? 'a100_80gb_heavy_primary_l4_qualified_fallback'
      : 'l4_standard_gpu_primary',
    primaryGpuProfileId: heavy
      ? 'quality_a100_80gb_user_triggered_heavy_job_v1'
      : 'quality_l4_user_triggered_standard_media_job_v1',
    fallbackGpuProfileId: heavy
      ? 'quality_l4_user_triggered_heavy_fallback_job_v1'
      : null,
    completeSelectedIntervalRequired: videoIntent,
    sourceResolutionPreserved: true,
    cpuOnlySubstantiveExecutionAllowed: false,
    userTriggeredScaleFromZeroRequired: true,
    stopAfterTerminalAttemptRequired: true,
    canonicalRuntimeReleaseRequired: true,
    freshEstimateApprovalSnapshotReservationRequired: true,
  }
}
