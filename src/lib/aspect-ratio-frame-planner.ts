import type {
  AspectRatio,
  AspectRatioFramePlan,
  AspectRatioOption,
  AspectRatioRecommendation,
  PlannerInput,
  SourceToOutputFitMode,
  TargetPlatform,
} from '../types/reeditpro'
import { getDefaultFrameTemplateForAspectRatio, getFrameCanvasForAspectRatio } from './frame-layouts'

export const aspectRatioOptions: AspectRatioOption[] = [
  {
    id: '9:16',
    label: '9:16',
    description: 'TikTok / Reels / Shorts',
    bestFor: ['tiktok_reels_shorts'],
    canvasWidth: 1080,
    canvasHeight: 1920,
    commonUses: ['Short-form social', 'Talking-head clips', 'Vertical product explainers'],
    layoutNotes: ['Favors top/bottom layouts, lower visual panels, and speaker-safe crops.'],
  },
  {
    id: '16:9',
    label: '16:9',
    description: 'YouTube / website / training',
    bestFor: ['youtube', 'website', 'course_training', 'client_review'],
    canvasWidth: 1920,
    canvasHeight: 1080,
    commonUses: ['YouTube', 'Course videos', 'Website embeds', 'Client review cuts'],
    layoutNotes: ['Favors side-by-side layouts, screen capture, maps, charts, and full visual takeovers.'],
  },
  {
    id: '1:1',
    label: '1:1',
    description: 'Square social',
    bestFor: ['custom'],
    canvasWidth: 1080,
    canvasHeight: 1080,
    commonUses: ['Square social posts', 'Cards', 'Compact explainers'],
    layoutNotes: ['Favors centered panels, picture-in-picture, and compact caption placement.'],
  },
  {
    id: '4:5',
    label: '4:5',
    description: 'Portrait feed',
    bestFor: ['custom'],
    canvasWidth: 1080,
    canvasHeight: 1350,
    commonUses: ['Portrait feed posts', 'Product/social edits', 'Feed-safe clips'],
    layoutNotes: ['Favors portrait framing with generous top/bottom safe zones.'],
  },
  {
    id: '4:3',
    label: '4:3',
    description: 'Classic / documentary / archive',
    bestFor: ['custom'],
    canvasWidth: 1440,
    canvasHeight: 1080,
    commonUses: ['Archive-feeling edits', 'Documentary cards', 'Classic frame treatments'],
    layoutNotes: ['Favors quieter documentary layouts, source preservation, and wide caption bands.'],
  },
]

export function getAspectRatioOption(aspectRatio: AspectRatio) {
  return aspectRatioOptions.find((option) => option.id === aspectRatio)
}

export function recommendAspectRatio(params: {
  targetPlatform: TargetPlatform
  requestedAspectRatio?: AspectRatio
}): AspectRatioRecommendation {
  const { requestedAspectRatio, targetPlatform } = params

  if (targetPlatform === 'tiktok_reels_shorts') {
    return {
      recommendedAspectRatio: '9:16',
      targetPlatform,
      reason: 'TikTok, Reels, and Shorts are usually designed around a vertical frame.',
      confidence: 'high',
      mustConfirm: true,
    }
  }

  if (targetPlatform === 'youtube' || targetPlatform === 'website' || targetPlatform === 'course_training' || targetPlatform === 'client_review') {
    return {
      recommendedAspectRatio: '16:9',
      targetPlatform,
      reason: 'This platform context usually benefits from a landscape frame with room for screen capture, maps, charts, and side panels.',
      confidence: targetPlatform === 'youtube' ? 'high' : 'medium',
      mustConfirm: true,
    }
  }

  if (requestedAspectRatio && requestedAspectRatio !== 'let_ai_decide') {
    return {
      recommendedAspectRatio: requestedAspectRatio,
      targetPlatform,
      reason: 'The selected concrete frame is the closest current launch option for this custom context.',
      confidence: 'medium',
      mustConfirm: true,
    }
  }

  return {
    recommendedAspectRatio: '9:16',
    targetPlatform,
    reason: 'No platform-specific frame is confirmed yet, so ReeditPro can recommend vertical short-form as a starting point only.',
    confidence: 'low',
    mustConfirm: true,
  }
}

function chooseFitMode(params: {
  targetAspectRatio: AspectRatio
  sourceClipAspectRatio?: string
  input: PlannerInput
}): SourceToOutputFitMode {
  const { input, sourceClipAspectRatio, targetAspectRatio } = params

  if (!sourceClipAspectRatio || sourceClipAspectRatio === targetAspectRatio) {
    return 'panel_background'
  }

  const sourceLooksLandscape = sourceClipAspectRatio === '16:9' || sourceClipAspectRatio.includes('landscape')
  const sourceLooksVertical = sourceClipAspectRatio === '9:16' || sourceClipAspectRatio.includes('vertical')

  if (targetAspectRatio === '9:16' && sourceLooksLandscape) {
    return input.workflowType === 'product_demo' ? 'contain' : 'smart_reframe'
  }

  if (targetAspectRatio === '16:9' && sourceLooksVertical) {
    return 'panel_background'
  }

  if (input.workflowType === 'product_demo' || input.workflowType === 'education_explainer') {
    return 'contain'
  }

  if (sourceLooksVertical && targetAspectRatio === '4:5') {
    return 'crop'
  }

  return 'smart_reframe'
}

function targetAspectRatioForPlanning(input: PlannerInput, recommendation: AspectRatioRecommendation): AspectRatio {
  if (input.aspectRatio && input.aspectRatio !== 'let_ai_decide') {
    return input.aspectRatio
  }

  return recommendation.recommendedAspectRatio
}

export function createAspectRatioFramePlan(params: {
  input: PlannerInput
  sourceClipAspectRatio?: string
}): AspectRatioFramePlan {
  const { input, sourceClipAspectRatio } = params
  const recommendedAspectRatio = recommendAspectRatio({
    requestedAspectRatio: input.aspectRatio,
    targetPlatform: input.targetPlatform,
  })
  const targetAspectRatio = targetAspectRatioForPlanning(input, recommendedAspectRatio)
  const selectedAspectRatio = input.aspectRatio !== 'let_ai_decide' ? input.aspectRatio : undefined
  const confirmed = input.aspectRatioConfirmed === true && Boolean(selectedAspectRatio)
  const option = getAspectRatioOption(targetAspectRatio)
  const fallbackCanvas = getFrameCanvasForAspectRatio(targetAspectRatio)
  const canvasWidth = option?.canvasWidth ?? fallbackCanvas.width
  const canvasHeight = option?.canvasHeight ?? fallbackCanvas.height
  const frameTemplate = getDefaultFrameTemplateForAspectRatio(confirmed ? targetAspectRatio : selectedAspectRatio ?? 'let_ai_decide')
  const fitMode = chooseFitMode({ input, sourceClipAspectRatio, targetAspectRatio })

  const status = confirmed
    ? 'confirmed'
    : selectedAspectRatio === recommendedAspectRatio.recommendedAspectRatio
      ? 'recommended'
      : 'needs_confirmation'

  return {
    id: 'aspect-ratio-frame-plan-v1',
    status,
    source: input.aspectRatioSource ?? (confirmed ? 'user_selected' : selectedAspectRatio ? 'platform_recommended' : 'unknown'),
    targetPlatform: input.targetPlatform,
    selectedAspectRatio,
    recommendedAspectRatio,
    confirmedAt: confirmed ? 'mock-confirmed-output-frame' : undefined,
    canvasWidth,
    canvasHeight,
    sourceToOutputFramePlan: {
      id: 'source-to-output-frame-v1',
      sourceAspectRatio: sourceClipAspectRatio,
      targetAspectRatio,
      fitMode,
      speakerSafe: true,
      productSafe: fitMode !== 'crop',
      captionSafe: true,
      notes: [
        sourceClipAspectRatio
          ? `Source ratio ${sourceClipAspectRatio} is planning context, not the final output frame.`
          : 'Source ratio is unknown in the mock planner and must not become the output ratio by default.',
        fitMode === 'panel_background'
          ? 'Use a matching panel background so AI-generated assets fit assigned visual zones without pretending to own the final canvas.'
          : `Use ${fitMode.replaceAll('_', ' ')} when adapting source media to the confirmed output frame.`,
      ],
      qaChecks: [
        'Confirm captions remain inside safe zones.',
        'Confirm speaker/product crops preserve the subject.',
        'Confirm source-to-output fit does not imply unapproved media processing.',
      ],
    },
    frameTemplateType: frameTemplate.templateType,
    safeMargin: frameTemplate.safeMargin,
    speakerZone: frameTemplate.speakerZone,
    visualZone: frameTemplate.animationZone,
    captionSafeZone: frameTemplate.captionSafeZone,
    panelBackgroundColor: frameTemplate.panelBackgroundColor,
    mustConfirmBeforeApproval: true,
    resetApprovalOnChange: true,
    globalRules: [
      'No approval until output frame is confirmed.',
      'No generation until output frame is confirmed.',
      'No final render until output frame is confirmed.',
      'All provider prompts, layout plans, tool plans, and renderer plans use the confirmed frame and zones.',
      'Changing aspect ratio resets approval, progress, preview, and snapshot state.',
      'Source aspect ratio is not the output ratio unless the user confirms it.',
    ],
    qaChecks: [
      'Approved snapshot must include confirmed aspect ratio, canvas size, frame template, safe zones, panel background, and source-to-output fit plan.',
      'Renderer composition must not claim render-ready while the frame is unconfirmed.',
      'Provider prompts must remain draft/blocked while the frame is unconfirmed.',
      'Credit approval must remain blocked until the output frame is confirmed.',
    ],
    notes: confirmed
      ? ['Output frame confirmed. Downstream planning can use this canvas, frame template, and safe-zone contract.']
      : [
          'Recommended, not confirmed.',
          'Platform recommendations are planning hints only until the user confirms the output frame.',
          'Draft plans may be shown, but approval, generation, rendering, worker execution, and final export remain locked.',
        ],
  }
}

export function isAspectRatioConfirmed(plan?: AspectRatioFramePlan | null) {
  return plan?.status === 'confirmed'
}

export function getAspectRatioGateMessage(plan?: AspectRatioFramePlan | null) {
  if (!plan) {
    return 'Before I plan the visuals, what frame should this edit be built for?'
  }

  if (isAspectRatioConfirmed(plan)) {
    return 'Output frame confirmed. I will build layouts, prompts, render strategy, and export planning around this frame.'
  }

  return 'Platform recommendation is not final until you confirm it. Changing this later will rebuild the plan and credit estimate.'
}
