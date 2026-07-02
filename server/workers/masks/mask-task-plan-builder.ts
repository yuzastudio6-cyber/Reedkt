import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import { buildMaskTemporalSmoothingPlan } from './mask-temporal-smoothing-policy'
import type { MaskExecutionInput, MaskTaskPlan, MaskToolId } from './mask-execution-types'

const DEFAULT_MAX_FRAMES = 90
const ABSOLUTE_MAX_FRAMES = 300

export function buildMaskTaskPlan(input: MaskExecutionInput): MaskTaskPlan {
  const videoIntent = input.maskIntent === 'background_removal_video' || input.maskIntent === 'text_behind_subject'
  const primaryTool = input.selectedPrimaryTool ?? selectPrimaryTool(input)
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
    subjectSelection: input.subjectSelection,
    expectedArtifacts,
    modelWeightRequirements: modelWeightRequirements(input),
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

function selectPrimaryTool(input: MaskExecutionInput): MaskToolId {
  if (input.maskIntent === 'background_removal_image' || input.maskIntent === 'subject_cutout') return 'birefnet'
  if (input.maskIntent === 'background_removal_video' || input.maskIntent === 'text_behind_subject') return 'birefnet'
  if (input.maskIntent === 'blur_background') return 'sam2'
  return 'birefnet'
}

function normalizeFallbackTools(fallbackTools: MaskToolId[] | undefined, input: MaskExecutionInput): MaskToolId[] {
  if (fallbackTools?.length) return [...new Set(fallbackTools.filter((tool) => tool !== 'none'))]
  if (input.maskIntent === 'background_removal_image' || input.maskIntent === 'subject_cutout') {
    return ['transparent_background', 'rembg', 'opencv']
  }
  if (input.maskIntent === 'text_behind_subject') {
    return ['sam2', 'opencv', 'kornia', 'none']
  }
  return ['sam2', 'opencv', 'kornia', 'transparent_background', 'rembg']
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

function modelWeightRequirements(input: MaskExecutionInput): MaskTaskPlan['modelWeightRequirements'] {
  const requirements: MaskTaskPlan['modelWeightRequirements'] = ['birefnet_model']
  if (input.maskIntent === 'background_removal_video' || input.maskIntent === 'text_behind_subject' || input.motionRequiresTracking) {
    requirements.push('sam2_checkpoint')
  }
  if (input.fallbackTools?.includes('transparent_background')) requirements.push('transparent_background_model')
  if (input.fallbackTools?.includes('rembg')) requirements.push('rembg_model')
  return [...new Set(requirements)]
}
