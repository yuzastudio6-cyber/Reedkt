import type {
  AudioPipelinePlan,
  CaptionVisualCueTimingPlan,
  CharacterConsistencyPlan,
  ClipSource,
  ColorPipelinePlan,
  DataVizPlan,
  DepthAwareOverlayPlan,
  DocumentaryFactSafetyPlan,
  EditPlan,
  MapAnimationPlan,
  MasterTimingPlan,
  PlannerInput,
  ProviderPromptPlan,
  RenderStrategyPlan,
  RendererCompositionPlan,
  SegmentEditPlan,
  SignatureRoute,
  SourceCleanupPlan,
  SoundSyncTransitionTimingPlan,
  SpeakerVisualLayoutPlan,
  TimingValidationPlan,
  TrimReviewPlan,
  ToolStrategyPlan,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import { createAudioPipelinePlan } from './audio-pipeline-planner'
import { createAspectRatioFramePlan } from './aspect-ratio-frame-planner'
import { createCaptionVisualCueTimingPlan } from './caption-visual-cue-timing-planner'
import { createCharacterConsistencyPlan } from './character-consistency'
import { createColorPipelinePlan } from './color-pipeline-planner'
import { createCreditEstimate } from './credit-estimator'
import { createDepthAwareOverlayPlan } from './depth-aware-overlay-planner'
import { createDataVizPlan } from './dataviz-planner'
import { createDocumentaryFactSafetyPlan } from './documentary-fact-safety'
import {
  createAgentQAFallbackPlan,
  linkAgentQAFallbackToExecutionPlan,
} from './agent-qa-fallback-planner'
import { createEditingAgentExecutionPlan } from './editing-agent-execution-planner'
import {
  createAsyncAssetReconciliationPlan,
  linkAsyncReconciliationToExecutionPlan,
} from './async-asset-reconciliation-planner'
import { createSegmentEditPlans } from './edit-operation-planner'
import { createEditQAPlan } from './edit-qa-planner'
import { getDefaultFrameTemplateForAspectRatio, getFrameLayoutTemplate } from './frame-layouts'
import { compileEditingIntent } from './intent-compiler'
import { createMapAnimationPlan } from './map-animation-planner'
import { createMasterTimingPlan } from './master-timing-planner'
import { createPlanningSystemAuditReport } from './planning-system-audit'
import { buildProviderPromptPlansForEditPlan } from './prompt-builders'
import { createRendererCompositionPlan } from './remotion-renderer-planner'
import { createRenderStrategyPlan } from './render-strategy-planner'
import { createSpeakerVisualLayoutPlan } from './speaker-visual-layout-planner'
import { createAdaptiveEditStrategyPlan } from './adaptive-edit-strategy'
import { createMigrationReviewPlan } from './migration-review-plan'
import { createSupabaseSchemaPlan } from './supabase-schema-plan'
import { createMigrationDraftPlan } from './supabase-migration-drafts'
import { createSupabaseProductionReadinessPlan } from './supabase-production-readiness'
import { createTimingValidationPlan } from './timing-validation'
import { getToolRegistrySummary } from './tool-registry'
import { createToolStrategyPlan } from './tool-strategy-planner'
import {
  createSourceSequenceReviewState,
  getClipRoleLabel,
  inferClipSourceRole,
  inferSourceSequenceMode,
} from './source-sequence'
import { createSourceCleanupPlan } from './source-cleanup-planner'
import { createSoundSyncTransitionTimingPlan } from './soundsync-transition-timing-planner'
import { createVisualAssetPlan } from './story-asset-planner'
import { createTrimReviewPlan } from './trim-review-planner'
import { createMockVideoUnderstandingReport } from './video-understanding'
import { getWorkflowProfile } from './workflow-profiles'

export const mockPlannerLoadingSteps = [
  'Analyzing source sequence',
  'Reading user instructions',
  'Studying Reference DNA',
  'Mapping story beats',
  'Routing signature systems',
  'Estimating credits',
  'Preparing plan',
]

export const sampleClips: ClipSource[] = [
  {
    id: 'clip-1',
    uploadedOrder: 1,
    fileName: 'entry-living-room-walkthrough.mp4',
    duration: '00:12',
    detectedType: 'Entry and living room walkthrough',
    notes: 'Open with a calm premium feel.',
    isImportant: true,
  },
  {
    id: 'clip-2',
    uploadedOrder: 2,
    fileName: 'kitchen-detail-shots.mov',
    duration: '00:08',
    detectedType: 'Detail b-roll',
    notes: 'Nice countertop detail.',
  },
  {
    id: 'clip-3',
    uploadedOrder: 3,
    fileName: 'speaker-investment-line.mp4',
    duration: '00:14',
    detectedType: 'Speaker value explanation',
    notes: 'Strong line about major investment.',
    isImportant: true,
  },
  {
    id: 'clip-4',
    uploadedOrder: 4,
    fileName: 'exterior-backyard.mp4',
    duration: '00:10',
    detectedType: 'Exterior and backyard proof',
    isOptional: false,
  },
]

function systemLabel(system: SignatureRoute['system']) {
  const labels = {
    stroke_motion: 'Stroke Motion',
    graphic_design: 'Graphic Design / VisualExplain',
    real_motion: 'Real Motion',
    sound_sync: 'SoundSync',
    none: 'None',
  }

  return labels[system]
}

function shouldUseMinimalVisuals(input: PlannerInput) {
  return input.visualPreference === 'keep_visuals_minimal' || input.visualPreference === 'no_extra_visuals' || input.workflowType === 'simple_clean_edit'
}

function createSignatureRoutes(input: PlannerInput): SignatureRoute[] {
  const routes: SignatureRoute[] = [
    {
      timeRange: '00:00-00:04',
      system: 'sound_sync',
      reason: 'Establish the selected mood with timing support before adding visual density.',
      creditImpact: 'low',
    },
  ]

  if (shouldUseMinimalVisuals(input)) {
    routes.push({
      timeRange: '00:05-00:18',
      system: 'none',
      reason: 'The user preference or workflow points toward a clean edit, so the plan avoids unnecessary overlays.',
      creditImpact: 'none',
    })
    return routes
  }

  const instructions = input.customInstructions.toLowerCase()
  const hasConceptWork =
    input.workflowType === 'education_explainer' ||
    input.workflowType === 'product_demo' ||
    input.workflowType === 'marketing_ad' ||
    instructions.includes('explain') ||
    instructions.includes('framework') ||
    instructions.includes('list')

  const hasRealMotionCandidate =
    input.visualPreference === 'real_motion_if_useful' ||
    input.creditPreference === 'premium_best_result' ||
    input.workflowType === 'product_demo' ||
    input.workflowType === 'real_estate_property_tour' ||
    input.clips.some((clip) => /product|kitchen|exterior|proof|object|walkthrough/i.test(`${clip.fileName} ${clip.detectedType}`))

  if (hasConceptWork || input.visualPreference === 'more_graphic_design' || input.visualPreference === 'balanced_visual_mix') {
    routes.push({
      timeRange: '00:05-00:10',
      system: 'graphic_design',
      reason: 'Use clean explanatory overlays only where they clarify details, concepts, or proof points.',
      creditImpact: 'medium',
    })
  }

  if (hasRealMotionCandidate && input.creditPreference !== 'low_credit_cost') {
    routes.push({
      timeRange: '00:11-00:15',
      system: 'real_motion',
      reason: 'A realistic in-video overlay can support a real object or proof moment, but it remains optional and credit-heavy.',
      creditImpact: 'premium',
    })
  }

  if (input.visualPreference === 'more_stroke_motion' || input.editLevel !== 'basic') {
    routes.push({
      timeRange: '00:16-00:24',
      system: 'stroke_motion',
      reason: 'Add light 2D motion to emphasize the speaker-aligned story beat without cluttering the footage.',
      creditImpact: 'medium',
    })
  }

  routes.push({
    timeRange: '00:24-00:32',
    system: 'sound_sync',
    reason: 'Support the final transition and emotional polish with beat timing and voice ducking.',
    creditImpact: 'low',
  })

  return routes
}

function resolveFrameTemplate(input: PlannerInput) {
  if (input.aspectRatioFramePlan?.status === 'confirmed' && input.aspectRatioFramePlan.frameTemplateType) {
    return getFrameLayoutTemplate(input.aspectRatioFramePlan.frameTemplateType)
  }

  if (input.frameTemplateType && input.frameTemplateType !== 'let_ai_decide') {
    return getFrameLayoutTemplate(input.frameTemplateType)
  }

  return getDefaultFrameTemplateForAspectRatio(input.aspectRatio)
}

function assetShouldCarryCharacterPack(asset: VisualAssetPlanItem, characterConsistencyPlan: CharacterConsistencyPlan) {
  return asset.needsCharacterConsistency ||
    asset.assetType === 'character_card' ||
    asset.assetType === 'name_card' ||
    characterConsistencyPlan.packs.some((pack) => pack.appearsInBeatIds.includes(asset.id))
}

function factSafetyAppliesToAsset(asset: VisualAssetPlanItem, documentaryFactSafetyPlan: DocumentaryFactSafetyPlan) {
  if (!documentaryFactSafetyPlan.active) {
    return false
  }

  return ['fact_card', 'name_card', 'timeline_card', 'graphic_design_frame', 'still_with_editor_motion', 'animated_scene'].includes(asset.assetType) ||
    /claim|evidence|timeline|proof|amount|name|case/i.test(`${asset.beatLabel} ${asset.storyPurpose} ${asset.reason}`)
}

function enrichVisualAssetsWithSafetyPlans(params: {
  visualAssetPlan: VisualAssetPlanItem[]
  characterConsistencyPlan: CharacterConsistencyPlan
  documentaryFactSafetyPlan: DocumentaryFactSafetyPlan
}) {
  const { characterConsistencyPlan, documentaryFactSafetyPlan, visualAssetPlan } = params

  return visualAssetPlan.map((asset) => {
    const characterPackIds = assetShouldCarryCharacterPack(asset, characterConsistencyPlan)
      ? characterConsistencyPlan.packs
        .filter((pack) => pack.appearsInBeatIds.includes(asset.id) || asset.needsCharacterConsistency || asset.assetType === 'character_card' || asset.assetType === 'name_card')
        .map((pack) => pack.id)
        .slice(0, 3)
      : []
    const factSafetyItemIds = factSafetyAppliesToAsset(asset, documentaryFactSafetyPlan)
      ? documentaryFactSafetyPlan.claimItems.map((item) => item.id).slice(0, 3)
      : []

    return {
      ...asset,
      characterPackIds,
      factSafetyItemIds,
      qaChecks: [
        ...asset.qaChecks,
        ...(characterPackIds.length > 0 ? ['Character consistency pack must be preserved.'] : []),
        ...(factSafetyItemIds.length > 0 ? ['Fact-safety treatment must stay neutral and source-aware.'] : []),
      ],
    }
  })
}

function layoutItemForAsset(asset: VisualAssetPlanItem, speakerVisualLayoutPlan: SpeakerVisualLayoutPlan) {
  return speakerVisualLayoutPlan.items.find((item) => item.assetPlanItemId === asset.id)
}

function layoutItemForSegment(segment: SegmentEditPlan, speakerVisualLayoutPlan: SpeakerVisualLayoutPlan) {
  return speakerVisualLayoutPlan.items.find((item) =>
    item.segmentId === segment.id ||
    segment.visualAssetPlanItemIds.some((assetId) => item.assetPlanItemId === assetId),
  )
}

function depthItemForLayoutItem(layoutItemId: string | undefined, depthAwareOverlayPlan: DepthAwareOverlayPlan) {
  return depthAwareOverlayPlan.items.find((item) => item.speakerVisualLayoutItemId === layoutItemId)
}

function depthItemForAsset(asset: VisualAssetPlanItem, depthAwareOverlayPlan: DepthAwareOverlayPlan) {
  return depthAwareOverlayPlan.items.find((item) =>
    item.assetPlanItemId === asset.id ||
    item.speakerVisualLayoutItemId === asset.speakerVisualLayoutItemId,
  )
}

function depthItemForSegment(segment: SegmentEditPlan, depthAwareOverlayPlan: DepthAwareOverlayPlan) {
  return depthAwareOverlayPlan.items.find((item) =>
    item.segmentId === segment.id ||
    segment.visualAssetPlanItemIds.some((assetId) => item.assetPlanItemId === assetId),
  )
}

function attachDepthToSpeakerVisualLayout(speakerVisualLayoutPlan: SpeakerVisualLayoutPlan, depthAwareOverlayPlan: DepthAwareOverlayPlan): SpeakerVisualLayoutPlan {
  return {
    ...speakerVisualLayoutPlan,
    items: speakerVisualLayoutPlan.items.map((layoutItem) => {
      const depthItem = depthItemForLayoutItem(layoutItem.id, depthAwareOverlayPlan)

      if (!depthItem) {
        return layoutItem
      }

      return {
        ...layoutItem,
        depthAwareOverlayItemId: depthItem.id,
        depthCompositingMode: depthItem.depthCompositingMode,
        maskStrategy: depthItem.maskStrategy,
        maskRisk: depthItem.maskRisk,
        trackingRequirement: depthItem.trackingRequirement,
        promptImplications: [
          ...layoutItem.promptImplications,
          `Depth-aware overlay mode: ${depthItem.depthCompositingMode.replaceAll('_', ' ')}.`,
          ...depthItem.promptImplications.slice(0, 2),
        ],
        remotionNotes: [
          ...layoutItem.remotionNotes,
          `Depth layer plan: ${depthItem.depthCompositingMode.replaceAll('_', ' ')} with ${depthItem.maskStrategy.replaceAll('_', ' ')}.`,
          'Future mask/segmentation worker required before real depth compositing.',
        ],
        qaChecks: [
          ...layoutItem.qaChecks,
          `Depth-aware QA: ${depthItem.maskRisk} risk, fallback ${depthItem.fallbackLayoutMode?.replaceAll('_', ' ') ?? 'not required'}.`,
        ],
      }
    }),
  }
}

function attachLayoutToVisualAssets(visualAssetPlan: VisualAssetPlanItem[], speakerVisualLayoutPlan: SpeakerVisualLayoutPlan) {
  return visualAssetPlan.map((asset) => {
    const layoutItem = layoutItemForAsset(asset, speakerVisualLayoutPlan)

    if (!layoutItem) {
      return asset
    }

    return {
      ...asset,
      speakerVisualLayoutItemId: layoutItem.id,
      layoutMode: layoutItem.layoutMode,
      speakerPresence: layoutItem.speakerPresence,
      visualDominance: layoutItem.visualDominance,
      qaChecks: [
        ...asset.qaChecks,
        `Speaker/visual layout: ${layoutItem.layoutMode.replaceAll('_', ' ')}.`,
        `Speaker presence: ${layoutItem.speakerPresence.replaceAll('_', ' ')}.`,
      ],
    }
  })
}

function attachLayoutToSegments(segmentEditPlans: SegmentEditPlan[], speakerVisualLayoutPlan: SpeakerVisualLayoutPlan) {
  return segmentEditPlans.map((segment) => {
    const layoutItem = layoutItemForSegment(segment, speakerVisualLayoutPlan)

    if (!layoutItem) {
      return segment
    }

    return {
      ...segment,
      speakerVisualLayoutItemId: layoutItem.id,
      layoutMode: layoutItem.layoutMode,
      speakerPresence: layoutItem.speakerPresence,
      visualDominance: layoutItem.visualDominance,
      workerNotes: [
        ...segment.workerNotes,
        `Speaker/visual layout: ${layoutItem.layoutMode.replaceAll('_', ' ')}.`,
        `Speaker presence: ${layoutItem.speakerPresence.replaceAll('_', ' ')}; visual dominance: ${layoutItem.visualDominance.replaceAll('_', ' ')}.`,
      ],
    }
  })
}

function attachDepthToVisualAssets(visualAssetPlan: VisualAssetPlanItem[], depthAwareOverlayPlan: DepthAwareOverlayPlan) {
  return visualAssetPlan.map((asset) => {
    const depthItem = depthItemForAsset(asset, depthAwareOverlayPlan)

    if (!depthItem) {
      return asset
    }

    return {
      ...asset,
      depthAwareOverlayItemId: depthItem.id,
      depthCompositingMode: depthItem.depthCompositingMode,
      maskStrategy: depthItem.maskStrategy,
      qaChecks: [
        ...asset.qaChecks,
        `Depth-aware overlay: ${depthItem.depthCompositingMode.replaceAll('_', ' ')}.`,
        `Mask strategy: ${depthItem.maskStrategy.replaceAll('_', ' ')}; frontend mock only.`,
      ],
    }
  })
}

function attachDepthToSegments(segmentEditPlans: SegmentEditPlan[], depthAwareOverlayPlan: DepthAwareOverlayPlan) {
  return segmentEditPlans.map((segment) => {
    const depthItem = depthItemForSegment(segment, depthAwareOverlayPlan)

    if (!depthItem) {
      return segment
    }

    return {
      ...segment,
      depthAwareOverlayItemId: depthItem.id,
      depthCompositingMode: depthItem.depthCompositingMode,
      maskStrategy: depthItem.maskStrategy,
      workerNotes: [
        ...segment.workerNotes,
        `Depth-aware overlay plan: ${depthItem.depthCompositingMode.replaceAll('_', ' ')} using ${depthItem.maskStrategy.replaceAll('_', ' ')}.`,
        'No real mask, tracking, object detection, or Remotion rendering is executed in the frontend mock.',
      ],
    }
  })
}

function attachRenderStrategyToVisualAssets(visualAssetPlan: VisualAssetPlanItem[], renderStrategyPlan: RenderStrategyPlan) {
  return visualAssetPlan.map((asset) => {
    const renderStrategyItem = renderStrategyPlan.items.find((item) => item.assetPlanItemId === asset.id)

    if (!renderStrategyItem) {
      return asset
    }

    return {
      ...asset,
      renderStrategyItemId: renderStrategyItem.id,
      renderStrategyType: renderStrategyItem.strategyType,
      qaChecks: [
        ...asset.qaChecks,
        `Render strategy: ${renderStrategyItem.strategyType.replaceAll('_', ' ')}; Remotion owns final composition.`,
      ],
    }
  })
}

function attachRenderStrategyToSegments(segmentEditPlans: SegmentEditPlan[], renderStrategyPlan: RenderStrategyPlan) {
  return segmentEditPlans.map((segment) => {
    const renderStrategyItemIds = renderStrategyPlan.items
      .filter((item) =>
        item.segmentId === segment.id ||
        Boolean(item.assetPlanItemId && segment.visualAssetPlanItemIds.includes(item.assetPlanItemId)),
      )
      .map((item) => item.id)

    if (renderStrategyItemIds.length === 0) {
      return segment
    }

    return {
      ...segment,
      renderStrategyItemIds,
      workerNotes: [
        ...segment.workerNotes,
        `Render strategy items linked: ${renderStrategyItemIds.join(', ')}.`,
        'Render strategy is planning only; no Remotion rendering or tool execution is started before approval.',
      ],
    }
  })
}

function attachToolStrategyToRenderStrategy(renderStrategyPlan: RenderStrategyPlan, toolStrategyPlan: ToolStrategyPlan): RenderStrategyPlan {
  return {
    ...renderStrategyPlan,
    items: renderStrategyPlan.items.map((renderItem) => {
      const toolStrategyItemIds = toolStrategyPlan.items
        .filter((item) =>
          item.renderStrategyItemId === renderItem.id ||
          item.assetPlanItemId === renderItem.assetPlanItemId ||
          item.segmentId === renderItem.segmentId,
        )
        .map((item) => item.id)

      if (toolStrategyItemIds.length === 0) {
        return renderItem
      }

      return {
        ...renderItem,
        toolStrategyItemIds,
        workerNotes: [
          ...renderItem.workerNotes,
          `Tool strategy items linked: ${toolStrategyItemIds.join(', ')}.`,
          'Tool strategy is planning-only; no package installation or tool execution is started before approval.',
        ],
      }
    }),
  }
}

function attachToolStrategyToVisualAssets(visualAssetPlan: VisualAssetPlanItem[], toolStrategyPlan: ToolStrategyPlan) {
  return visualAssetPlan.map((asset) => {
    const toolStrategyItemIds = toolStrategyPlan.items
      .filter((item) => item.assetPlanItemId === asset.id)
      .map((item) => item.id)

    if (toolStrategyItemIds.length === 0) {
      return asset
    }

    return {
      ...asset,
      toolStrategyItemIds,
      qaChecks: [
        ...asset.qaChecks,
        `Tool strategy linked: ${toolStrategyItemIds.join(', ')}; planning-only controlled tool selection.`,
      ],
    }
  })
}

function attachToolStrategyToSegments(segmentEditPlans: SegmentEditPlan[], toolStrategyPlan: ToolStrategyPlan) {
  return segmentEditPlans.map((segment) => {
    const toolStrategyItemIds = toolStrategyPlan.items
      .filter((item) =>
        item.segmentId === segment.id ||
        Boolean(item.assetPlanItemId && segment.visualAssetPlanItemIds.includes(item.assetPlanItemId)),
      )
      .map((item) => item.id)

    if (toolStrategyItemIds.length === 0) {
      return segment
    }

    return {
      ...segment,
      toolStrategyItemIds,
      workerNotes: [
        ...segment.workerNotes,
        `Tool strategy items linked: ${toolStrategyItemIds.join(', ')}.`,
        'Future tool workers must use the approved snapshot; no tools run in this frontend mock.',
      ],
    }
  })
}

function attachColorMatchToVisualAssets(visualAssetPlan: VisualAssetPlanItem[], colorPipelinePlan: ColorPipelinePlan) {
  return visualAssetPlan.map((asset) => {
    const colorMatchPlan = colorPipelinePlan.assetMatchPlans.find((plan) => plan.assetPlanItemId === asset.id)

    if (!colorMatchPlan) {
      return asset
    }

    return {
      ...asset,
      colorMatchPlanId: colorMatchPlan.id,
      qaChecks: [
        ...asset.qaChecks,
        `Color match plan: ${colorMatchPlan.matchToColorGrade.replaceAll('_', ' ')} with panel background consistency.`,
      ],
    }
  })
}

function attachColorPipelineToSegments(segmentEditPlans: SegmentEditPlan[], colorPipelinePlan: ColorPipelinePlan) {
  return segmentEditPlans.map((segment) => {
    const sourceClipOperationIds = colorPipelinePlan.clipPlans
      .filter((clipPlan) => segment.sourceClipIds.includes(clipPlan.clipId))
      .flatMap((clipPlan) => [
        ...clipPlan.correctionOperations.map((operation) => operation.id),
        ...clipPlan.lookOperations.map((operation) => operation.id),
      ])
    const assetOperationIds = colorPipelinePlan.assetMatchPlans
      .filter((assetPlan) => Boolean(assetPlan.assetPlanItemId && segment.visualAssetPlanItemIds.includes(assetPlan.assetPlanItemId)))
      .flatMap((assetPlan) => assetPlan.operations.map((operation) => operation.id))
    const colorPipelineOperationIds = Array.from(new Set([
      ...sourceClipOperationIds,
      ...assetOperationIds,
      ...colorPipelinePlan.projectOperations.map((operation) => operation.id).slice(0, 4),
    ]))

    return {
      ...segment,
      colorPipelineOperationIds,
      colorGradePlan: {
        ...segment.colorGradePlan,
        style: colorPipelinePlan.colorGradeStyle,
        skinToneProtection: segment.colorGradePlan.skinToneProtection ||
          colorPipelinePlan.projectOperations.some((operation) => operation.operation === 'skin_tone_protection'),
        shotMatching: segment.colorGradePlan.shotMatching ||
          colorPipelinePlan.projectOperations.some((operation) => operation.operation === 'shot_matching'),
        notes: [
          ...segment.colorGradePlan.notes,
          `Aligned with project color pipeline: ${colorPipelinePlan.colorGradeStyle.replaceAll('_', ' ')}.`,
          'Color pipeline planned at project/clip/asset level; no real color processing runs in this frontend mock.',
        ],
      },
      workerNotes: [
        ...segment.workerNotes,
        `Color pipeline operations linked: ${colorPipelineOperationIds.slice(0, 5).join(', ')}.`,
        'Future color workers must use the approved snapshot; no FFmpeg/OpenColorIO/OpenCV/Sharp processing runs in the frontend mock.',
      ],
    }
  })
}

function attachAudioPipelineToSegments(segmentEditPlans: SegmentEditPlan[], audioPipelinePlan: AudioPipelinePlan) {
  return segmentEditPlans.map((segment) => {
    const sourceClipOperationIds = audioPipelinePlan.clipPlans
      .filter((clipPlan) => segment.sourceClipIds.includes(clipPlan.clipId))
      .flatMap((clipPlan) => [
        ...clipPlan.cleanupOperations.map((operation) => operation.id),
        ...clipPlan.loudnessOperations.map((operation) => operation.id),
      ])
    const cueIds = audioPipelinePlan.soundSyncCues
      .filter((cue) =>
        cue.linkedSegmentId === segment.id ||
        Boolean(cue.linkedVisualAssetId && segment.visualAssetPlanItemIds.includes(cue.linkedVisualAssetId)),
      )
      .map((cue) => cue.id)
    const audioOperationIds = Array.from(new Set([
      ...sourceClipOperationIds,
      ...audioPipelinePlan.projectOperations.map((operation) => operation.id).slice(0, 5),
    ]))

    return {
      ...segment,
      audioOperationIds,
      soundSyncCueIds: cueIds,
      soundPlan: {
        ...segment.soundPlan,
        style: audioPipelinePlan.soundStyle,
        voiceCleanup: true,
        musicBed: audioPipelinePlan.musicBedPlan.policy !== 'none',
        ducking: audioPipelinePlan.musicBedPlan.duckingEnabled,
        sfx: audioPipelinePlan.sfxPlan.policy === 'none'
          ? []
          : audioPipelinePlan.sfxPlan.allowedSfxTypes.length
            ? audioPipelinePlan.sfxPlan.allowedSfxTypes
            : segment.soundPlan.sfx,
        avoidRules: [
          ...segment.soundPlan.avoidRules,
          ...audioPipelinePlan.sfxPlan.avoidRules.slice(0, 2),
          ...audioPipelinePlan.musicBedPlan.avoidRules.slice(0, 2),
        ],
        notes: [
          ...segment.soundPlan.notes,
          `Aligned with project audio pipeline: ${audioPipelinePlan.soundStyle.replaceAll('_', ' ')} (${audioPipelinePlan.audioIntensity}).`,
          `Music policy: ${audioPipelinePlan.musicBedPlan.policy.replaceAll('_', ' ')}; SFX policy: ${audioPipelinePlan.sfxPlan.policy.replaceAll('_', ' ')}.`,
          cueIds.length ? `SoundSync cues linked: ${cueIds.join(', ')}.` : 'No segment-specific SoundSync cue required.',
        ],
      },
      workerNotes: [
        ...segment.workerNotes,
        `Audio pipeline operations linked: ${audioOperationIds.slice(0, 5).join(', ')}.`,
        'Future audio workers must use the approved snapshot; no FFmpeg/AudioFlux/Signalsmith Stretch/Essentia/librosa/Rubber Band/whisper.cpp processing runs in the frontend mock.',
      ],
    }
  })
}

function attachMapAnimationToVisualAssets(visualAssetPlan: VisualAssetPlanItem[], mapAnimationPlan: MapAnimationPlan) {
  if (!mapAnimationPlan.active) {
    return visualAssetPlan
  }

  return visualAssetPlan.map((asset) => {
    const mapItem = mapAnimationPlan.items.find((item) =>
      item.visualAssetPlanItemId === asset.id ||
      item.assetPlanItemId === asset.id,
    )

    if (!mapItem) {
      return asset
    }

    return {
      ...asset,
      mapAnimationPlanItemId: mapItem.id,
      qaChecks: [
        ...asset.qaChecks,
        `Map plan: ${mapItem.mapVisualType.replaceAll('_', ' ')} with ${mapItem.locations.map((location) => location.safeWording).join(', ')}.`,
        'Exact geography uses controlled map planning, not AI video.',
      ],
    }
  })
}

function attachMapAnimationToSegments(segmentEditPlans: SegmentEditPlan[], mapAnimationPlan: MapAnimationPlan) {
  if (!mapAnimationPlan.active) {
    return segmentEditPlans
  }

  return segmentEditPlans.map((segment) => {
    const mapAnimationPlanItemIds = mapAnimationPlan.items
      .filter((item) =>
        item.segmentId === segment.id ||
        Boolean(item.visualAssetPlanItemId && segment.visualAssetPlanItemIds.includes(item.visualAssetPlanItemId)),
      )
      .map((item) => item.id)

    if (mapAnimationPlanItemIds.length === 0) {
      return segment
    }

    return {
      ...segment,
      mapAnimationPlanItemIds,
      workerNotes: [
        ...segment.workerNotes,
        `Map/location plan items linked: ${mapAnimationPlanItemIds.join(', ')}.`,
        'Future map workers must use approved source-safe locations; no MapLibre/Turf execution runs in the frontend mock.',
      ],
    }
  })
}

function attachDataVizToVisualAssets(visualAssetPlan: VisualAssetPlanItem[], dataVizPlan: DataVizPlan) {
  if (!dataVizPlan.active) {
    return visualAssetPlan
  }

  return visualAssetPlan.map((asset) => {
    const dataVizItem = dataVizPlan.items.find((item) =>
      item.visualAssetPlanItemId === asset.id ||
      item.assetPlanItemId === asset.id,
    )

    if (!dataVizItem) {
      return asset
    }

    return {
      ...asset,
      dataVizPlanItemId: dataVizItem.id,
      qaChecks: [
        ...asset.qaChecks,
        `Chart/diagram plan: ${dataVizItem.visualType.replaceAll('_', ' ')} with ${dataVizItem.dataPlan.safeWording}.`,
        'Exact chart/diagram data uses controlled D3/ECharts/Remotion planning, not AI video.',
      ],
    }
  })
}

function attachDataVizToSegments(segmentEditPlans: SegmentEditPlan[], dataVizPlan: DataVizPlan) {
  if (!dataVizPlan.active) {
    return segmentEditPlans
  }

  return segmentEditPlans.map((segment) => {
    const dataVizPlanItemIds = dataVizPlan.items
      .filter((item) =>
        item.segmentId === segment.id ||
        Boolean(item.visualAssetPlanItemId && segment.visualAssetPlanItemIds.includes(item.visualAssetPlanItemId)),
      )
      .map((item) => item.id)

    if (dataVizPlanItemIds.length === 0) {
      return segment
    }

    return {
      ...segment,
      dataVizPlanItemIds,
      workerNotes: [
        ...segment.workerNotes,
        `Chart/diagram plan items linked: ${dataVizPlanItemIds.join(', ')}.`,
        'Future chart workers must use approved source-aware data; no D3/ECharts/Vega-Lite execution runs in the frontend mock.',
      ],
    }
  })
}

function attachTimingToVisualAssets(visualAssetPlan: VisualAssetPlanItem[], masterTimingPlan: MasterTimingPlan) {
  return visualAssetPlan.map((asset) => {
    const visualTiming = masterTimingPlan.visualTimingItems.find((item) => item.linkedVisualAssetPlanItemId === asset.id)
    const providerTiming = masterTimingPlan.providerClipTimingItems.find((item) => item.visualAssetPlanItemId === asset.id)

    if (!visualTiming && !providerTiming) {
      return asset
    }

    return {
      ...asset,
      plannedDurationFrames: visualTiming?.timeRange.durationFrames ?? providerTiming?.expectedDurationFrames,
      timingCueIds: [
        ...(asset.timingCueIds ?? []),
        ...(visualTiming ? [`visual-cue-${asset.id}`] : []),
        ...(providerTiming ? [providerTiming.id] : []),
      ],
      visualTimingItemId: visualTiming?.id,
      qaChecks: [
        ...asset.qaChecks,
        visualTiming
          ? `Master timing: ${visualTiming.timeRange.startFrame}-${visualTiming.timeRange.endFrame}f (${visualTiming.reason})`
          : 'Master timing provider clip placement is planned.',
      ],
    }
  })
}

function attachTimingToSegments(segmentEditPlans: SegmentEditPlan[], masterTimingPlan: MasterTimingPlan) {
  return segmentEditPlans.map((segment) => {
    const finalTiming = masterTimingPlan.finalTimelineSegments.find((item) => item.segmentId === segment.id)
    const captionTiming = masterTimingPlan.captionTimingItems.find((item) => item.linkedTranscriptLineId?.includes(segment.id))
    const visualCueIds = masterTimingPlan.visualTimingItems
      .filter((item) => item.linkedSegmentId === segment.id)
      .map((item) => `visual-cue-${item.linkedVisualAssetPlanItemId ?? item.id}`)
    const transitionCueIds = masterTimingPlan.transitionTimingItems
      .filter((item) => item.fromSegmentId === segment.id || item.toSegmentId === segment.id)
      .map((item) => item.id)
    const timingCueIds = Array.from(new Set([
      ...(segment.timingCueIds ?? []),
      ...(finalTiming?.timingCues.map((cue) => cue.id) ?? []),
      ...(captionTiming ? [`caption-cue-${captionTiming.id}`] : []),
      ...visualCueIds,
      ...transitionCueIds,
    ]))

    if (!finalTiming && timingCueIds.length === 0) {
      return segment
    }

    return {
      ...segment,
      finalTiming: finalTiming?.finalRange,
      timingCueIds,
      operations: segment.operations.map((operation) => ({
        ...operation,
        parameters: {
          ...operation.parameters,
          masterTimingPlanId: masterTimingPlan.id,
          timingCueIds,
          finalTiming: finalTiming?.finalRange,
        },
        instruction: `${operation.instruction} Follow MasterTimingPlan frame cues for this operation.`,
        qaChecks: [
          ...operation.qaChecks,
          'Operation timing must match MasterTimingPlan frame ranges.',
        ],
      })),
      captionPlan: {
        ...segment.captionPlan,
        notes: [
          ...segment.captionPlan.notes,
          captionTiming
            ? `Caption timing: ${captionTiming.timeRange.startFrame}-${captionTiming.timeRange.endFrame}f.`
            : 'Caption timing follows the segment Master Timing cues.',
        ],
      },
      transitionPlan: {
        ...segment.transitionPlan,
        notes: [
          ...segment.transitionPlan.notes,
          transitionCueIds.length
            ? `Transition timing linked: ${transitionCueIds.join(', ')}.`
            : 'Transitions must align with phrase-safe Master Timing boundaries.',
        ],
      },
      soundPlan: {
        ...segment.soundPlan,
        notes: [
          ...segment.soundPlan.notes,
          'SFX and music ducking cues come from the Master Timing Plan.',
        ],
      },
      workerNotes: [
        ...segment.workerNotes,
        `Master timing cues linked: ${timingCueIds.join(', ') || masterTimingPlan.id}.`,
        'Future workers must execute frame cues from the approved MasterTimingPlan; no timing worker runs in this mock.',
      ],
    }
  })
}

function attachSourceCleanupToSegments(segmentEditPlans: SegmentEditPlan[], sourceCleanupPlan: SourceCleanupPlan) {
  return segmentEditPlans.map((segment) => {
    const trimDecisions = sourceCleanupPlan.decisions.filter((decision) => segment.sourceClipIds.includes(decision.clipId))
    const trimDecisionItemIds = trimDecisions.map((decision) => decision.id)

    if (!trimDecisionItemIds.length) {
      return segment
    }

    const cleanupConfirmed = sourceCleanupPlan.status === 'confirmed'

    return {
      ...segment,
      trimDecisionItemIds: Array.from(new Set([
        ...(segment.trimDecisionItemIds ?? []),
        ...trimDecisionItemIds,
      ])),
      operations: segment.operations.map((operation) => {
        if (operation.operationType !== 'trim' && operation.operationType !== 'cut') {
          return {
            ...operation,
            parameters: {
              ...operation.parameters,
              sourceCleanupPlanId: sourceCleanupPlan.id,
              trimDecisionItemIds,
            },
          }
        }

        return {
          ...operation,
          status: cleanupConfirmed ? operation.status : 'needs_review',
          instruction: `${operation.instruction} Use SourceCleanupPlan decisions before final trim execution.`,
          parameters: {
            ...operation.parameters,
            sourceCleanupPlanId: sourceCleanupPlan.id,
            cleanupPreference: sourceCleanupPlan.selectedPreference ?? sourceCleanupPlan.recommendedPreference.recommendedPreference,
            cleanupConfirmed,
            trimDecisionItemIds,
            trimDecisions: trimDecisions.map((decision) => ({
              id: decision.id,
              decision: decision.decision,
              finalUse: decision.finalUse,
              reason: decision.reason,
              sourceRange: decision.sourceRange,
              keepReasons: decision.keepReasons,
              cutReasons: decision.cutReasons,
              userReviewRequired: decision.userReviewRequired,
            })),
          },
          reason: `${operation.reason} Source cleanup preference ${cleanupConfirmed ? 'is confirmed' : 'must be confirmed'} before final trim approval.`,
          qaChecks: [
            ...operation.qaChecks,
            'Trim operation must follow SourceCleanupPlan decisions.',
            'Every cut/tighten/preserve decision needs a reason.',
            ...(cleanupConfirmed ? [] : ['Cleanup preference is unconfirmed; operation remains draft/needs review.']),
          ],
        }
      }),
      brollPlan: {
        ...segment.brollPlan,
        sourcePriority: [
          ...segment.brollPlan.sourcePriority,
          ...trimDecisions.filter((decision) => decision.finalUse === 'broll').map((decision) => `cleanup b-roll: ${decision.clipId}`),
        ],
        notes: [
          ...segment.brollPlan.notes,
          ...trimDecisions
            .filter((decision) => decision.finalUse === 'broll' || decision.finalUse === 'proof')
            .map((decision) => `Source cleanup final use for ${decision.clipId}: ${decision.finalUse}.`),
        ],
      },
      workerNotes: [
        ...segment.workerNotes,
        `Source cleanup decisions linked: ${trimDecisionItemIds.join(', ')}.`,
        cleanupConfirmed
          ? 'Future workers must execute approved trim decisions from the approved snapshot.'
          : 'Source cleanup preference is unconfirmed; future worker trim execution is blocked.',
      ],
    }
  })
}

function linkSourceCleanupToTrimReview(sourceCleanupPlan: SourceCleanupPlan, trimReviewPlan: TrimReviewPlan): SourceCleanupPlan {
  const checkIdsByDecisionId = new Map<string, string[]>()
  trimReviewPlan.meaningPreservationValidationPlan.checks.forEach((check) => {
    check.relatedTrimDecisionItemIds.forEach((decisionId) => {
      checkIdsByDecisionId.set(decisionId, [...(checkIdsByDecisionId.get(decisionId) ?? []), check.id])
    })
  })
  const retakeItemIdByClipSet = new Map<string, string>()
  trimReviewPlan.retakeSelectionPlan.items.forEach((item) => {
    retakeItemIdByClipSet.set([...item.candidates.map((candidate) => candidate.clipId)].sort().join('|'), item.id)
  })
  const decisions = sourceCleanupPlan.decisions.map((decision) => ({
    ...decision,
    meaningPreservationCheckIds: checkIdsByDecisionId.get(decision.id) ?? decision.meaningPreservationCheckIds,
  }))
  const decisionById = new Map(decisions.map((decision) => [decision.id, decision]))
  const mapDecisionArray = (items: SourceCleanupPlan['decisions']) =>
    items.map((item) => decisionById.get(item.id) ?? item)

  return {
    ...sourceCleanupPlan,
    retakeSelectionPlanId: trimReviewPlan.retakeSelectionPlan.id,
    meaningPreservationValidationPlanId: trimReviewPlan.meaningPreservationValidationPlan.id,
    trimReviewPlanId: trimReviewPlan.id,
    decisions,
    preservedRanges: mapDecisionArray(sourceCleanupPlan.preservedRanges),
    cutRanges: mapDecisionArray(sourceCleanupPlan.cutRanges),
    userReviewItems: mapDecisionArray(sourceCleanupPlan.userReviewItems),
    retakeGroups: sourceCleanupPlan.retakeGroups.map((group) => ({
      ...group,
      retakeSelectionPlanItemId: retakeItemIdByClipSet.get([...group.clipIds].sort().join('|')),
    })),
  }
}

function attachTrimReviewToSegments(segmentEditPlans: SegmentEditPlan[], trimReviewPlan: TrimReviewPlan) {
  return segmentEditPlans.map((segment) => {
    const relatedChecks = trimReviewPlan.meaningPreservationValidationPlan.checks.filter((check) =>
      check.relatedClipIds.some((clipId) => segment.sourceClipIds.includes(clipId)) ||
      check.relatedTrimDecisionItemIds.some((decisionId) => segment.trimDecisionItemIds?.includes(decisionId)),
    )
    const relatedRetakes = trimReviewPlan.retakeSelectionPlan.items.filter((item) =>
      item.candidates.some((candidate) => segment.sourceClipIds.includes(candidate.clipId)),
    )
    const needsReview = trimReviewPlan.approvalBlocked || relatedChecks.some((check) => check.userReviewRequired)
    const checkIds = relatedChecks.map((check) => check.id)

    return {
      ...segment,
      meaningPreservationCheckIds: Array.from(new Set([...(segment.meaningPreservationCheckIds ?? []), ...checkIds])),
      operations: segment.operations.map((operation) => {
        const operationIsTrim = operation.operationType === 'trim' || operation.operationType === 'cut'

        return {
          ...operation,
          status: operationIsTrim && needsReview ? 'needs_review' : operation.status,
          parameters: {
            ...operation.parameters,
            trimReviewPlanId: trimReviewPlan.id,
            retakeSelectionItemIds: relatedRetakes.map((item) => item.id),
            meaningPreservationCheckIds: checkIds,
          },
          qaChecks: Array.from(new Set([
            ...operation.qaChecks,
            ...(operationIsTrim
              ? [
                  'Trim review must approve retake selection before final execution.',
                  'Meaning preservation checks must not be blocking.',
                ]
              : []),
          ])),
        }
      }),
      qaPlan: [
        ...segment.qaPlan,
        {
          id: `${segment.id}-trim-review-qa`,
          category: 'trim_review',
          label: 'Trim review',
          check: 'Retake selection and meaning preservation validation must be reviewable before approval.',
          status: needsReview ? 'needs_user_review' : 'passed',
          severity: needsReview ? 'high' : 'low',
          fallbackActions: [
            {
              action: 'manual_review',
              label: 'Review trim decision',
              reason: needsReview ? 'Risky trim review items need user confirmation.' : 'Retake and meaning preservation checks are reviewable.',
            },
          ],
          notes: [
            `TrimReviewPlan: ${trimReviewPlan.id}.`,
            ...relatedChecks.map((check) => `${check.label}: ${check.message}`),
          ],
        },
      ],
      workerNotes: [
        ...segment.workerNotes,
        trimReviewPlan.approvalBlocked
          ? 'Trim review blocks final trim worker instructions until user review is resolved.'
          : 'Trim review is available for future worker input contracts.',
      ],
    } satisfies SegmentEditPlan
  })
}

function applySourceCleanupToProviderPrompts(providerPromptPlans: ProviderPromptPlan[], sourceCleanupPlan: SourceCleanupPlan) {
  const cleanupConfirmed = sourceCleanupPlan.status === 'confirmed'

  return providerPromptPlans.map((promptPlan) => {
    const decisions = sourceCleanupPlan.decisions.filter((decision) =>
      (promptPlan.segmentId && decision.linkedSegmentId === promptPlan.segmentId) ||
      (promptPlan.segmentId && decision.finalUse !== 'removed') ||
      (promptPlan.assetPlanItemId && decision.finalUse === 'broll'),
    )
    const cutWarnings = sourceCleanupPlan.cutRanges.map((decision) => decision.clipId)

    return {
      ...promptPlan,
      tierAllowed: cleanupConfirmed ? promptPlan.tierAllowed : false,
      sourceCleanupNotes: [
        ...(promptPlan.sourceCleanupNotes ?? []),
        `Source cleanup status: ${sourceCleanupPlan.status.replaceAll('_', ' ')}.`,
        `Cleanup preference: ${(sourceCleanupPlan.selectedPreference ?? sourceCleanupPlan.recommendedPreference.recommendedPreference).replaceAll('_', ' ')}.`,
        ...(decisions.slice(0, 2).map((decision) => `Source use ${decision.clipId}: ${decision.decision.replaceAll('_', ' ')} as ${decision.finalUse}; ${decision.reason}`)),
        cutWarnings.length ? `Do not generate new visuals for cut-only source ranges: ${cutWarnings.slice(0, 3).join(', ')}.` : 'No cut-only source range blocks this prompt.',
        ...(cleanupConfirmed ? [] : ['Provider prompt remains draft/blocked until cleanup style is confirmed.']),
      ],
      qaNotes: [
        ...promptPlan.qaNotes,
        'Provider prompt must respect SourceCleanupPlan final source use.',
        ...(cleanupConfirmed ? [] : ['Cleanup unconfirmed: do not execute provider prompt.']),
      ],
      workerNotes: [
        ...promptPlan.workerNotes,
        `Source cleanup plan: ${sourceCleanupPlan.id}.`,
        cleanupConfirmed
          ? 'Future workers use approved trim/select decisions from snapshot.'
          : 'Blocked: cleanup preference must be confirmed before provider execution.',
      ],
    }
  })
}

function linkMasterTimingToCaptionVisualCuePlan(masterTimingPlan: MasterTimingPlan, captionVisualCueTimingPlan: CaptionVisualCueTimingPlan): MasterTimingPlan {
  return {
    ...masterTimingPlan,
    captionVisualCueTimingPlanId: captionVisualCueTimingPlan.id,
    captionTimingItems: masterTimingPlan.captionTimingItems.map((captionTiming) => {
      const refinedCaption = captionVisualCueTimingPlan.refinedCaptionTimings.find((item) => item.linkedMasterCaptionTimingItemId === captionTiming.id)

      return {
        ...captionTiming,
        refinedCaptionTimingItemId: refinedCaption?.id,
      }
    }),
    visualTimingItems: masterTimingPlan.visualTimingItems.map((visualTiming) => {
      const refinedCue = captionVisualCueTimingPlan.visualCueTimings.find((item) => item.linkedMasterVisualTimingItemId === visualTiming.id)

      return {
        ...visualTiming,
        visualCueTimingItemId: refinedCue?.id,
      }
    }),
  }
}

function linkMasterTimingToSoundSyncTransitionPlan(masterTimingPlan: MasterTimingPlan, soundSyncTransitionTimingPlan: SoundSyncTransitionTimingPlan): MasterTimingPlan {
  return {
    ...masterTimingPlan,
    soundSyncTransitionTimingPlanId: soundSyncTransitionTimingPlan.id,
    transitionTimingItems: masterTimingPlan.transitionTimingItems.map((transitionTiming) => {
      const refinedTransition = soundSyncTransitionTimingPlan.refinedTransitionTimings.find((item) => item.linkedMasterTransitionTimingItemId === transitionTiming.id)

      return {
        ...transitionTiming,
        refinedTransitionTimingItemId: refinedTransition?.id,
        sfxCueId: refinedTransition?.sfxCueId ?? transitionTiming.sfxCueId,
      }
    }),
    sfxTimingItems: masterTimingPlan.sfxTimingItems.map((sfxTiming) => {
      const refinedSfx = soundSyncTransitionTimingPlan.refinedSfxTimings.find((item) =>
        item.linkedVisualCueTimingItemId === sfxTiming.linkedVisualTimingItemId ||
        item.linkedTransitionTimingItemId === sfxTiming.linkedTransitionTimingItemId,
      )

      return {
        ...sfxTiming,
        refinedSfxTimingItemId: refinedSfx?.id,
      }
    }),
    musicDuckingTimingItems: masterTimingPlan.musicDuckingTimingItems.map((duckingTiming) => {
      const refinedDucking = soundSyncTransitionTimingPlan.refinedMusicDuckingTimings.find((item) =>
        item.linkedSpeechLineId === duckingTiming.linkedSpeechLineId,
      )

      return {
        ...duckingTiming,
        refinedMusicDuckingTimingItemId: refinedDucking?.id,
      }
    }),
  }
}

function linkTimingPlansToValidation(params: {
  captionVisualCueTimingPlan: CaptionVisualCueTimingPlan
  masterTimingPlan: MasterTimingPlan
  soundSyncTransitionTimingPlan: SoundSyncTransitionTimingPlan
  timingValidationPlan: TimingValidationPlan
}) {
  return {
    captionVisualCueTimingPlan: {
      ...params.captionVisualCueTimingPlan,
      timingValidationPlanId: params.timingValidationPlan.id,
    },
    masterTimingPlan: {
      ...params.masterTimingPlan,
      timingValidationPlanId: params.timingValidationPlan.id,
    },
    soundSyncTransitionTimingPlan: {
      ...params.soundSyncTransitionTimingPlan,
      timingValidationPlanId: params.timingValidationPlan.id,
    },
  }
}

function applyTimingValidationToProviderPrompts(providerPromptPlans: ProviderPromptPlan[], timingValidationPlan: TimingValidationPlan) {
  return providerPromptPlans.map((promptPlan) => ({
    ...promptPlan,
    tierAllowed: timingValidationPlan.approvalBlocked ? false : promptPlan.tierAllowed,
    qaNotes: [
      ...promptPlan.qaNotes,
      `Timing validation status: ${timingValidationPlan.overallStatus}.`,
      ...(timingValidationPlan.approvalBlocked ? ['Provider prompt remains draft/blocked because timing validation blocks approval.'] : []),
    ],
    workerNotes: [
      ...promptPlan.workerNotes,
      `Timing validation plan: ${timingValidationPlan.id}.`,
      ...(timingValidationPlan.approvalBlocked
        ? ['Blocked: timing validation must pass before provider prompt execution.']
        : ['Timing validation is reviewable; future workers must use approved timing snapshots.']),
    ],
  }))
}

function applyTimingValidationToRenderer(rendererCompositionPlan: RendererCompositionPlan, timingValidationPlan: TimingValidationPlan): RendererCompositionPlan {
  return {
    ...rendererCompositionPlan,
    renderReady: rendererCompositionPlan.renderReady && !timingValidationPlan.approvalBlocked,
    rendererNotes: [
      ...rendererCompositionPlan.rendererNotes,
      `Timing validation status: ${timingValidationPlan.overallStatus}.`,
      ...(timingValidationPlan.approvalBlocked
        ? ['Renderer composition remains non-render-ready because timing validation blocks approval.']
        : ['Renderer timing remains tied to approved Master/Caption/SoundSync timing plans.']),
    ],
  }
}

function attachCaptionVisualCueTimingToVisualAssets(visualAssetPlan: VisualAssetPlanItem[], captionVisualCueTimingPlan: CaptionVisualCueTimingPlan) {
  return visualAssetPlan.map((asset) => {
    const visualCueTimings = captionVisualCueTimingPlan.visualCueTimings.filter((item) => item.linkedVisualAssetPlanItemId === asset.id)

    if (!visualCueTimings.length) {
      return asset
    }

    return {
      ...asset,
      visualCueTimingIds: Array.from(new Set([
        ...(asset.visualCueTimingIds ?? []),
        ...visualCueTimings.map((item) => item.id),
      ])),
      timingCueIds: Array.from(new Set([
        ...(asset.timingCueIds ?? []),
        ...visualCueTimings.map((item) => item.id),
      ])),
      qaChecks: [
        ...asset.qaChecks,
        ...visualCueTimings.map((item) => `Caption/visual cue timing: ${item.timeRange.startFrame}-${item.timeRange.endFrame}f via ${item.triggerType.replaceAll('_', ' ')}.`),
      ],
    }
  })
}

function applyTrimReviewToProviderPrompts(providerPromptPlans: ProviderPromptPlan[], trimReviewPlan: TrimReviewPlan): ProviderPromptPlan[] {
  const reviewBlocked = trimReviewPlan.approvalBlocked
  return providerPromptPlans.map((promptPlan) => ({
    ...promptPlan,
    trimReviewNotes: [
      ...(promptPlan.trimReviewNotes ?? []),
      `Trim review status: ${reviewBlocked ? 'blocked' : 'reviewable'}.`,
      trimReviewPlan.summary,
      ...trimReviewPlan.userFacingReviewSummary.slice(0, 3),
    ],
    constraints: [
      ...promptPlan.constraints,
      {
        id: `${promptPlan.id}-trim-review-constraint`,
        label: 'Trim review gate',
        instruction: reviewBlocked
          ? 'Provider prompt remains draft because retake selection or meaning preservation review is unresolved.'
          : 'Use selected/approved trim review context and do not build assets from risky cut ranges.',
        source: 'trim_review' as const,
        required: true,
      },
    ],
    tierAllowed: promptPlan.tierAllowed && !reviewBlocked,
    qaNotes: [
      ...promptPlan.qaNotes,
      'Prompt must respect TrimReviewPlan retake selection and meaning preservation checks.',
      ...(reviewBlocked ? ['Prompt is draft/blocked until trim review is resolved.'] : []),
    ],
    workerNotes: [
      ...promptPlan.workerNotes,
      `TrimReviewPlan reference: ${trimReviewPlan.id}.`,
      ...(reviewBlocked ? ['Do not execute provider generation while trim review blocks approval.'] : []),
    ],
  }))
}

function attachCaptionVisualCueTimingToSegments(segmentEditPlans: SegmentEditPlan[], captionVisualCueTimingPlan: CaptionVisualCueTimingPlan) {
  return segmentEditPlans.map((segment) => {
    const visualCueIds = captionVisualCueTimingPlan.visualCueTimings
      .filter((item) => item.linkedSegmentId === segment.id || segment.visualAssetPlanItemIds.includes(item.linkedVisualAssetPlanItemId ?? ''))
      .map((item) => item.id)
    const captionCueIds = captionVisualCueTimingPlan.refinedCaptionTimings
      .filter((item) => segment.finalTiming ? item.timeRange.endFrame >= segment.finalTiming.startFrame && item.timeRange.startFrame <= segment.finalTiming.endFrame : false)
      .map((item) => item.id)
    const captionVisualCueIds = Array.from(new Set([
      ...(segment.captionVisualCueIds ?? []),
      ...captionCueIds,
      ...visualCueIds,
    ]))

    if (!captionVisualCueIds.length) {
      return segment
    }

    return {
      ...segment,
      captionVisualCueIds,
      operations: segment.operations.map((operation) => ({
        ...operation,
        parameters: {
          ...operation.parameters,
          captionVisualCueTimingPlanId: captionVisualCueTimingPlan.id,
          captionVisualCueIds,
        },
        qaChecks: [
          ...operation.qaChecks,
          'Caption and visual cue timing must preserve readability and meaning sync.',
        ],
      })),
      captionPlan: {
        ...segment.captionPlan,
        notes: [
          ...segment.captionPlan.notes,
          `Refined caption policy: ${captionVisualCueTimingPlan.captionPolicy.chunkingMode.replaceAll('_', ' ')} / ${captionVisualCueTimingPlan.captionPolicy.animationStyle.replaceAll('_', ' ')}.`,
        ],
      },
      workerNotes: [
        ...segment.workerNotes,
        `Caption/visual cue timing linked: ${captionVisualCueIds.join(', ')}.`,
        'Future workers must use refined caption/visual frame cues from the approved snapshot; no transcript/audio/media worker runs in this mock.',
      ],
    }
  })
}

function attachSoundSyncTransitionTimingToSegments(segmentEditPlans: SegmentEditPlan[], soundSyncTransitionTimingPlan: SoundSyncTransitionTimingPlan) {
  return segmentEditPlans.map((segment) => {
    const transitionIds = soundSyncTransitionTimingPlan.refinedTransitionTimings
      .filter((item) => item.fromSegmentId === segment.id || item.toSegmentId === segment.id)
      .map((item) => item.id)
    const sfxIds = soundSyncTransitionTimingPlan.refinedSfxTimings
      .filter((item) => transitionIds.includes(item.linkedTransitionTimingItemId ?? ''))
      .map((item) => item.id)
    const duckingIds = soundSyncTransitionTimingPlan.refinedMusicDuckingTimings
      .filter((item) => segment.finalTiming ? item.timeRange.endFrame >= segment.finalTiming.startFrame && item.timeRange.startFrame <= segment.finalTiming.endFrame : false)
      .map((item) => item.id)

    if (!transitionIds.length && !sfxIds.length && !duckingIds.length) {
      return segment
    }

    return {
      ...segment,
      soundSyncCueIds: Array.from(new Set([
        ...(segment.soundSyncCueIds ?? []),
        ...transitionIds,
        ...sfxIds,
        ...duckingIds,
      ])),
      transitionPlan: {
        ...segment.transitionPlan,
        notes: [
          ...segment.transitionPlan.notes,
          transitionIds.length
            ? `Refined SoundSync transition timing linked: ${transitionIds.join(', ')}.`
            : 'SoundSync transition timing keeps phrase boundaries first.',
        ],
      },
      soundPlan: {
        ...segment.soundPlan,
        notes: [
          ...segment.soundPlan.notes,
          sfxIds.length
            ? `Cue-linked SFX timing: ${sfxIds.join(', ')}.`
            : 'No random SFX; cues must be justified by visual/transition timing.',
          duckingIds.length
            ? `Voice-protective ducking timing: ${duckingIds.join(', ')}.`
            : 'Music ducking stays voice-first when music exists.',
        ],
      },
      operations: segment.operations.map((operation) => ({
        ...operation,
        parameters: {
          ...operation.parameters,
          soundSyncTransitionTimingPlanId: soundSyncTransitionTimingPlan.id,
          soundSyncTransitionIds: transitionIds,
          soundSyncSfxIds: sfxIds,
          soundSyncDuckingIds: duckingIds,
        },
        qaChecks: [
          ...operation.qaChecks,
          'SoundSync transitions must remain speech-safe and cue-linked.',
        ],
      })),
      workerNotes: [
        ...segment.workerNotes,
        `SoundSync + transition timing linked: ${[...transitionIds, ...sfxIds, ...duckingIds].join(', ') || soundSyncTransitionTimingPlan.id}.`,
        'Future workers must use approved SoundSync transition frames; no AudioFlux, FFmpeg, Signalsmith, SFX, or render worker runs in this mock.',
      ],
    }
  })
}

export function createMockEditPlan(input: PlannerInput): EditPlan {
  const profile = getWorkflowProfile(input.workflowType)
  const sourceOrderConfirmed = input.sourceOrderConfirmed ?? true
  const sourceSequenceMode = input.sourceSequenceMode ?? inferSourceSequenceMode(input.clips, input.customInstructions)
  const aspectRatioFramePlan =
    input.aspectRatioFramePlan ??
    createAspectRatioFramePlan({
      input,
    })
  const frameAwareInput: PlannerInput = {
    ...input,
    aspectRatioFramePlan,
  }
  const compiledIntent =
    frameAwareInput.compiledIntent ??
    compileEditingIntent({
      currentInput: frameAwareInput,
      referenceProvided: frameAwareInput.referenceUrl.trim().length > 0,
      sourceOrderConfirmed,
      userMessages: [frameAwareInput.customInstructions],
    })
  const professionalEditingDirective = compiledIntent.professionalEditingDirective
  const effectiveInput: PlannerInput = {
    ...frameAwareInput,
    ...compiledIntent.resolvedSettings,
    aspectRatioFramePlan,
    compiledIntent,
    professionalEditingDirective,
    sourceOrderConfirmed,
    sourceSequenceMode,
  }
  const videoUnderstandingReportBase =
    input.videoUnderstandingReport ??
    createMockVideoUnderstandingReport({
      compiledIntent,
      input: effectiveInput,
    })
  const sourceCleanupPlanBase =
    input.sourceCleanupPlan ??
    createSourceCleanupPlan({
      aspectRatioFramePlan,
      compiledIntent,
      input: effectiveInput,
      videoUnderstandingReport: videoUnderstandingReportBase,
    })
  const trimReviewPlan =
    input.trimReviewPlan ??
    createTrimReviewPlan({
      input: {
        ...effectiveInput,
        sourceCleanupPlan: sourceCleanupPlanBase,
      },
      sourceCleanupPlan: sourceCleanupPlanBase,
      videoUnderstandingReport: videoUnderstandingReportBase,
    })
  const sourceCleanupPlan = linkSourceCleanupToTrimReview(sourceCleanupPlanBase, trimReviewPlan)
  const effectiveInputWithCleanup: PlannerInput = {
    ...effectiveInput,
    sourceCleanupPlan,
    trimReviewPlan,
  }
  const adaptiveEditStrategyPlan = createAdaptiveEditStrategyPlan({
    compiledIntent,
    input: effectiveInputWithCleanup,
    professionalDirective: professionalEditingDirective,
    videoUnderstandingReport: videoUnderstandingReportBase,
  })
  const videoUnderstandingReport = {
    ...videoUnderstandingReportBase,
    adaptiveStrategyPlan: adaptiveEditStrategyPlan,
  }
  const adaptiveEditStrategy = videoUnderstandingReport.suggestedStrategy
  const analysisInput: PlannerInput = {
    ...effectiveInputWithCleanup,
    videoUnderstandingReport,
  }
  const routes = createSignatureRoutes(analysisInput)
  const visualAssetPlan = createVisualAssetPlan(analysisInput, { adaptiveEditStrategyPlan, videoUnderstandingReport })
  const draftSegmentEditPlans = createSegmentEditPlans({
    adaptiveEditStrategyPlan,
    compiledIntent,
    input: analysisInput,
    visualAssetPlan,
  })
  const speakerVisualLayoutPlanBase = createSpeakerVisualLayoutPlan({
    adaptiveEditStrategyPlan,
    compiledIntent,
    input: analysisInput,
    segmentEditPlans: draftSegmentEditPlans,
    videoUnderstandingReport,
    visualAssetPlan,
  })
  const visualAssetPlanWithLayoutBase = attachLayoutToVisualAssets(visualAssetPlan, speakerVisualLayoutPlanBase)
  const draftSegmentEditPlansWithLayoutBase = attachLayoutToSegments(draftSegmentEditPlans, speakerVisualLayoutPlanBase)
  const depthAwareOverlayPlan = createDepthAwareOverlayPlan({
    adaptiveEditStrategyPlan,
    compiledIntent,
    input: analysisInput,
    segmentEditPlans: draftSegmentEditPlansWithLayoutBase,
    speakerVisualLayoutPlan: speakerVisualLayoutPlanBase,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithLayoutBase,
  })
  const speakerVisualLayoutPlan = attachDepthToSpeakerVisualLayout(speakerVisualLayoutPlanBase, depthAwareOverlayPlan)
  const visualAssetPlanWithLayout = attachDepthToVisualAssets(attachLayoutToVisualAssets(visualAssetPlan, speakerVisualLayoutPlan), depthAwareOverlayPlan)
  const draftSegmentEditPlansWithLayout = attachDepthToSegments(attachLayoutToSegments(draftSegmentEditPlans, speakerVisualLayoutPlan), depthAwareOverlayPlan)
  const characterConsistencyPlan = createCharacterConsistencyPlan({
    compiledIntent,
    input: analysisInput,
    segmentEditPlans: draftSegmentEditPlansWithLayout,
    visualAssetPlan: visualAssetPlanWithLayout,
  })
  const documentaryFactSafetyPlan = createDocumentaryFactSafetyPlan({
    characterConsistencyPlan,
    compiledIntent,
    input: analysisInput,
    visualAssetPlan: visualAssetPlanWithLayout,
  })
  const visualAssetPlanWithSafety = enrichVisualAssetsWithSafetyPlans({
    characterConsistencyPlan,
    documentaryFactSafetyPlan,
    visualAssetPlan: visualAssetPlanWithLayout,
  })
  const frameTemplate = resolveFrameTemplate(effectiveInput)
  const toolRegistrySummary = getToolRegistrySummary()
  const renderStrategyPlanBase = createRenderStrategyPlan({
    adaptiveEditStrategyPlan,
    compiledIntent,
    depthAwareOverlayPlan,
    input: analysisInput,
    segmentEditPlans: draftSegmentEditPlansWithLayout,
    speakerVisualLayoutPlan,
    toolRegistrySummary,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithSafety,
  })
  const toolStrategyPlanBase = createToolStrategyPlan({
    adaptiveEditStrategyPlan,
    depthAwareOverlayPlan,
    input: analysisInput,
    renderStrategyPlan: renderStrategyPlanBase,
    segmentEditPlans: draftSegmentEditPlansWithLayout,
    speakerVisualLayoutPlan,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithSafety,
  })
  const colorPipelinePlanBase = createColorPipelinePlan({
    adaptiveEditStrategyPlan,
    compiledIntent,
    input: analysisInput,
    professionalDirective: professionalEditingDirective,
    toolStrategyPlan: toolStrategyPlanBase,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithSafety,
  })
  const audioPipelinePlanBase = createAudioPipelinePlan({
    adaptiveEditStrategyPlan,
    compiledIntent,
    input: analysisInput,
    professionalDirective: professionalEditingDirective,
    segmentEditPlans: draftSegmentEditPlansWithLayout,
    toolStrategyPlan: toolStrategyPlanBase,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithSafety,
  })
  const mapAnimationPlanBase = createMapAnimationPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan: audioPipelinePlanBase,
    compiledIntent,
    depthAwareOverlayPlan,
    input: analysisInput,
    segmentEditPlans: draftSegmentEditPlansWithLayout,
    speakerVisualLayoutPlan,
    toolStrategyPlan: toolStrategyPlanBase,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithSafety,
  })
  const dataVizPlanBase = createDataVizPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan: audioPipelinePlanBase,
    compiledIntent,
    input: analysisInput,
    renderStrategyPlan: renderStrategyPlanBase,
    segmentEditPlans: draftSegmentEditPlansWithLayout,
    speakerVisualLayoutPlan,
    toolStrategyPlan: toolStrategyPlanBase,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithSafety,
  })
  const toolStrategyPlan = createToolStrategyPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan: audioPipelinePlanBase,
    colorPipelinePlan: colorPipelinePlanBase,
    depthAwareOverlayPlan,
    dataVizPlan: dataVizPlanBase,
    input: analysisInput,
    mapAnimationPlan: mapAnimationPlanBase,
    renderStrategyPlan: renderStrategyPlanBase,
    segmentEditPlans: draftSegmentEditPlansWithLayout,
    speakerVisualLayoutPlan,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithSafety,
  })
  const renderStrategyPlan = attachToolStrategyToRenderStrategy(renderStrategyPlanBase, toolStrategyPlan)
  const visualAssetPlanWithRenderStrategyBase = attachToolStrategyToVisualAssets(
    attachRenderStrategyToVisualAssets(visualAssetPlanWithSafety, renderStrategyPlan),
    toolStrategyPlan,
  )
  const colorPipelinePlan = createColorPipelinePlan({
    adaptiveEditStrategyPlan,
    compiledIntent,
    input: analysisInput,
    professionalDirective: professionalEditingDirective,
    toolStrategyPlan,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithRenderStrategyBase,
  })
  const audioPipelinePlan = createAudioPipelinePlan({
    adaptiveEditStrategyPlan,
    compiledIntent,
    input: analysisInput,
    professionalDirective: professionalEditingDirective,
    segmentEditPlans: draftSegmentEditPlansWithLayout,
    toolStrategyPlan,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithRenderStrategyBase,
  })
  const mapAnimationPlan = createMapAnimationPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    compiledIntent,
    depthAwareOverlayPlan,
    input: analysisInput,
    segmentEditPlans: draftSegmentEditPlansWithLayout,
    speakerVisualLayoutPlan,
    toolStrategyPlan,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithRenderStrategyBase,
  })
  const dataVizPlan = createDataVizPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    compiledIntent,
    input: analysisInput,
    renderStrategyPlan,
    segmentEditPlans: draftSegmentEditPlansWithLayout,
    speakerVisualLayoutPlan,
    toolStrategyPlan,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithRenderStrategyBase,
  })
  const visualAssetPlanWithMap = attachMapAnimationToVisualAssets(visualAssetPlanWithRenderStrategyBase, mapAnimationPlan)
  const visualAssetPlanWithDataViz = attachDataVizToVisualAssets(visualAssetPlanWithMap, dataVizPlan)
  const visualAssetPlanWithRenderStrategy = attachColorMatchToVisualAssets(visualAssetPlanWithDataViz, colorPipelinePlan)
  const masterTimingPlanBase = createMasterTimingPlan({
    adaptiveEditStrategyPlan,
    aspectRatioFramePlan,
    audioPipelinePlan,
    compiledIntent,
    dataVizPlan,
    input: analysisInput,
    mapAnimationPlan,
    professionalDirective: professionalEditingDirective,
    segmentEditPlans: draftSegmentEditPlansWithLayout,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithRenderStrategy,
  })
  const captionVisualCueTimingPlan = createCaptionVisualCueTimingPlan({
    adaptiveEditStrategyPlan,
    aspectRatioFramePlan,
    audioPipelinePlan,
    compiledIntent,
    dataVizPlan,
    input: analysisInput,
    mapAnimationPlan,
    masterTimingPlan: masterTimingPlanBase,
    professionalDirective: professionalEditingDirective,
    segmentEditPlans: draftSegmentEditPlansWithLayout,
    speakerVisualLayoutPlan,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithRenderStrategy,
  })
  const masterTimingPlanWithCaptionVisualCue = linkMasterTimingToCaptionVisualCuePlan(masterTimingPlanBase, captionVisualCueTimingPlan)
  const soundSyncTransitionTimingPlan = createSoundSyncTransitionTimingPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    captionVisualCueTimingPlan,
    compiledIntent,
    input: analysisInput,
    masterTimingPlan: masterTimingPlanWithCaptionVisualCue,
    professionalDirective: professionalEditingDirective,
    segmentEditPlans: draftSegmentEditPlansWithLayout,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithRenderStrategy,
  })
  const masterTimingPlan = linkMasterTimingToSoundSyncTransitionPlan(masterTimingPlanWithCaptionVisualCue, soundSyncTransitionTimingPlan)
  const analysisInputWithTiming: PlannerInput = {
    ...analysisInput,
    captionVisualCueTimingPlan,
    masterTimingPlan,
    soundSyncTransitionTimingPlan,
    trimReviewPlan,
  }
  const visualAssetPlanWithTiming = attachCaptionVisualCueTimingToVisualAssets(
    attachTimingToVisualAssets(visualAssetPlanWithRenderStrategy, masterTimingPlan),
    captionVisualCueTimingPlan,
  )
  const rendererCompositionPlan = createRendererCompositionPlan({
    aspectRatio: effectiveInput.aspectRatio,
    aspectRatioFramePlan,
    audioPipelinePlan,
    colorPipelinePlan,
    depthAwareOverlayPlan,
    editLevel: effectiveInput.editLevel,
    frameTemplate,
    dataVizPlan,
    mapAnimationPlan,
    renderStrategyPlan,
    speakerVisualLayoutPlan,
    toolStrategyPlan,
    targetPlatform: effectiveInput.targetPlatform,
    visualAssetPlan: visualAssetPlanWithTiming,
    captionVisualCueTimingPlan,
    masterTimingPlan,
    soundSyncTransitionTimingPlan,
  })
  const segmentEditPlansBase = attachDepthToSegments(attachLayoutToSegments(createSegmentEditPlans({
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    colorPipelinePlan,
    compiledIntent,
    input: analysisInputWithTiming,
    rendererCompositionPlan,
    visualAssetPlan: visualAssetPlanWithTiming,
  }), speakerVisualLayoutPlan), depthAwareOverlayPlan)
  const segmentEditPlans = attachColorPipelineToSegments(
    attachToolStrategyToSegments(attachRenderStrategyToSegments(segmentEditPlansBase, renderStrategyPlan), toolStrategyPlan),
    colorPipelinePlan,
  )
  const segmentEditPlansWithAudio = attachAudioPipelineToSegments(
    segmentEditPlans,
    audioPipelinePlan,
  )
  const segmentEditPlansWithAudioAndMap = attachMapAnimationToSegments(
    segmentEditPlansWithAudio,
    mapAnimationPlan,
  )
  const segmentEditPlansWithAudioMapAndDataViz = attachDataVizToSegments(
    segmentEditPlansWithAudioAndMap,
    dataVizPlan,
  )
  const segmentEditPlansWithTiming = attachTimingToSegments(
    segmentEditPlansWithAudioMapAndDataViz,
    masterTimingPlan,
  )
  const segmentEditPlansWithCaptionVisualCueTiming = attachCaptionVisualCueTimingToSegments(
    segmentEditPlansWithTiming,
    captionVisualCueTimingPlan,
  )
  const segmentEditPlansWithSoundSyncTransitionTiming = attachSoundSyncTransitionTimingToSegments(
    segmentEditPlansWithCaptionVisualCueTiming,
    soundSyncTransitionTimingPlan,
  )
  const providerPromptPlans = buildProviderPromptPlansForEditPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    characterConsistencyPlan,
    colorPipelinePlan,
    compiledIntent,
    depthAwareOverlayPlan,
    documentaryFactSafetyPlan,
    input: analysisInputWithTiming,
    professionalDirective: professionalEditingDirective,
    dataVizPlan,
    mapAnimationPlan,
    captionVisualCueTimingPlan,
    masterTimingPlan,
    soundSyncTransitionTimingPlan,
    trimReviewPlan,
    renderStrategyPlan,
    rendererCompositionPlan,
    segmentEditPlans: segmentEditPlansWithSoundSyncTransitionTiming,
    speakerVisualLayoutPlan,
    toolStrategyPlan,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithTiming,
  })
  const providerPromptPlansWithCleanup = applySourceCleanupToProviderPrompts(providerPromptPlans, sourceCleanupPlan)
  const providerPromptPlansWithCleanupAndTrimReview = applyTrimReviewToProviderPrompts(providerPromptPlansWithCleanup, trimReviewPlan)
  const timingValidationPlanBase = createTimingValidationPlan({
    aspectRatioFramePlan,
    audioPipelinePlan,
    captionVisualCueTimingPlan,
    input: analysisInputWithTiming,
    masterTimingPlan,
    providerPromptPlans: providerPromptPlansWithCleanupAndTrimReview,
    rendererCompositionPlan,
    segmentEditPlans: segmentEditPlansWithSoundSyncTransitionTiming,
    sourceCleanupPlan,
    soundSyncTransitionTimingPlan,
    trimReviewPlan,
    visualAssetPlan: visualAssetPlanWithTiming,
  })
  const {
    captionVisualCueTimingPlan: captionVisualCueTimingPlanWithValidation,
    masterTimingPlan: masterTimingPlanWithValidation,
    soundSyncTransitionTimingPlan: soundSyncTransitionTimingPlanWithValidation,
  } = linkTimingPlansToValidation({
    captionVisualCueTimingPlan,
    masterTimingPlan,
    soundSyncTransitionTimingPlan,
    timingValidationPlan: timingValidationPlanBase,
  })
  const providerPromptPlansWithCleanupAndTimingValidation = applyTimingValidationToProviderPrompts(providerPromptPlansWithCleanupAndTrimReview, timingValidationPlanBase)
  const rendererCompositionPlanWithTimingValidation = applyTimingValidationToRenderer(rendererCompositionPlan, timingValidationPlanBase)
  const analysisInputWithValidation: PlannerInput = {
    ...analysisInputWithTiming,
    captionVisualCueTimingPlan: captionVisualCueTimingPlanWithValidation,
    masterTimingPlan: masterTimingPlanWithValidation,
    soundSyncTransitionTimingPlan: soundSyncTransitionTimingPlanWithValidation,
    timingValidationPlan: timingValidationPlanBase,
    trimReviewPlan,
  }
  const visualAssetPlanWithPrompts = visualAssetPlanWithTiming.map((asset) => ({
    ...asset,
    promptPlans: providerPromptPlansWithCleanupAndTimingValidation.filter((promptPlan) => promptPlan.assetPlanItemId === asset.id),
  }))
  const segmentEditPlansWithAudioMapDataVizAndPrompts = segmentEditPlansWithSoundSyncTransitionTiming.map((segment) => ({
    ...segment,
    promptPlans: providerPromptPlansWithCleanupAndTimingValidation.filter((promptPlan) => promptPlan.segmentId === segment.id),
  }))
  const segmentEditPlansWithCleanup = attachSourceCleanupToSegments(segmentEditPlansWithAudioMapDataVizAndPrompts, sourceCleanupPlan)
  const segmentEditPlansWithCleanupAndTrimReview = attachTrimReviewToSegments(segmentEditPlansWithCleanup, trimReviewPlan)
  const timingValidationPlan = createTimingValidationPlan({
    aspectRatioFramePlan,
    audioPipelinePlan,
    captionVisualCueTimingPlan: captionVisualCueTimingPlanWithValidation,
    input: analysisInputWithValidation,
    masterTimingPlan: masterTimingPlanWithValidation,
    providerPromptPlans: providerPromptPlansWithCleanupAndTimingValidation,
    rendererCompositionPlan: rendererCompositionPlanWithTimingValidation,
    segmentEditPlans: segmentEditPlansWithCleanupAndTrimReview,
    sourceCleanupPlan,
    soundSyncTransitionTimingPlan: soundSyncTransitionTimingPlanWithValidation,
    trimReviewPlan,
    visualAssetPlan: visualAssetPlanWithPrompts,
  })
  const {
    captionVisualCueTimingPlan: finalCaptionVisualCueTimingPlan,
    masterTimingPlan: finalMasterTimingPlan,
    soundSyncTransitionTimingPlan: finalSoundSyncTransitionTimingPlan,
  } = linkTimingPlansToValidation({
    captionVisualCueTimingPlan: captionVisualCueTimingPlanWithValidation,
    masterTimingPlan: masterTimingPlanWithValidation,
    soundSyncTransitionTimingPlan: soundSyncTransitionTimingPlanWithValidation,
    timingValidationPlan,
  })
  const finalAnalysisInput: PlannerInput = {
    ...analysisInputWithValidation,
    captionVisualCueTimingPlan: finalCaptionVisualCueTimingPlan,
    masterTimingPlan: finalMasterTimingPlan,
    soundSyncTransitionTimingPlan: finalSoundSyncTransitionTimingPlan,
    sourceCleanupPlan,
    timingValidationPlan,
    trimReviewPlan,
  }
  const editQAPlan = createEditQAPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    characterConsistencyPlan,
    colorPipelinePlan,
    compiledIntent,
    depthAwareOverlayPlan,
    documentaryFactSafetyPlan,
    input: finalAnalysisInput,
    dataVizPlan,
    mapAnimationPlan,
    captionVisualCueTimingPlan: finalCaptionVisualCueTimingPlan,
    masterTimingPlan: finalMasterTimingPlan,
    soundSyncTransitionTimingPlan: finalSoundSyncTransitionTimingPlan,
    timingValidationPlan,
    sourceCleanupPlan,
    trimReviewPlan,
    renderStrategyPlan,
    rendererCompositionPlan: rendererCompositionPlanWithTimingValidation,
    segmentEditPlans: segmentEditPlansWithCleanupAndTrimReview,
    speakerVisualLayoutPlan,
    toolStrategyPlan,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithPrompts,
  })
  const referenceProvided = effectiveInput.referenceUrl.trim().length > 0
  const strongerSocialOpen =
    effectiveInput.structurePreference === 'restructure_for_social' ||
    effectiveInput.structurePreference === 'let_ai_recommend' ||
    effectiveInput.workflowType === 'social_short_viral_clip' ||
    effectiveInput.workflowType === 'marketing_ad'

  const sourceSequenceMap = effectiveInput.clips.map((clip) => {
    const role = clip.sourceRole ?? inferClipSourceRole(clip)
    const roleLabel = getClipRoleLabel(role)
    const text = `${clip.fileName} ${clip.detectedType} ${clip.notes ?? ''}`.toLowerCase()

    return {
      clipId: clip.id,
      uploadedOrder: clip.uploadedOrder,
      detectedRole: `${roleLabel}: ${clip.detectedType}`,
      strengths: [
        ...(clip.isImportant ? ['Marked important by user', 'Strong candidate for story anchor'] : ['Useful source context']),
        ...(clip.notes ? [`User note: ${clip.notes}`] : []),
        ...(role !== 'unknown' ? [`Source role marked as ${roleLabel}.`] : []),
      ],
      concerns: [
        ...(clip.isOptional ? ['Marked optional, use only if it improves the story'] : ['Needs timing review before final structure']),
        ...(!sourceOrderConfirmed ? ['Source order is not confirmed yet; treat this as draft context.'] : []),
      ],
      possibleUses: [
        role === 'hook_candidate' || clip.uploadedOrder === 1 || text.includes('hook') || text.includes('speaker')
          ? 'Possible hook or opening context'
          : 'Supporting segment',
        role === 'b_roll' || role === 'optional'
          ? 'Supporting b-roll or pacing cover'
          : role === 'ending'
            ? 'Possible closing beat'
            : role === 'proof'
              ? 'Proof or evidence support'
              : 'Visual proof or pacing support',
      ],
    }
  })

  const structureConfirmationNote = sourceOrderConfirmed
    ? 'Use confirmed source order as story context.'
    : 'Source order is not confirmed yet; this plan is a draft.'
  const structureModeNote = sourceSequenceMode === 'unordered_clips_needs_ai_help'
    ? 'AI may suggest a stronger final structure later, but source order remains context until the plan is approved.'
    : 'Final edit order can differ only after ReeditPro shows the recommended structure in the plan.'
  const recommendedStructure = [
    structureConfirmationNote,
    structureModeNote,
    ...(strongerSocialOpen
    ? [
        'Open with the strongest 3-second spoken line if the user wants more social performance.',
        'Return to the source sequence for context so the edit still feels natural.',
        'Use detail shots as proof moments instead of random cutaways.',
        'Close with the clearest result or CTA from the available clips.',
      ]
    : [
        'Preserve the uploaded source sequence as the primary structure.',
        'Trim weak pauses and keep the walkthrough or story flow intact.',
        'Use only targeted overlays where they clarify the spoken point.',
        'End with a clean final beat and export-ready captions.',
      ]),
  ]

  const hookPolicy =
    effectiveInput.workflowType === 'marketing_ad'
      ? 'required'
      : effectiveInput.workflowType === 'simple_clean_edit'
        ? 'avoid'
        : strongerSocialOpen
          ? 'recommended'
          : 'optional'

  const hookDecision = {
    policy: hookPolicy,
    recommendation:
      hookPolicy === 'avoid'
        ? 'No hook recommended. Keep the edit clean because the selected workflow or instructions point to simplicity.'
        : hookPolicy === 'required'
          ? 'Strong hook required before the offer or proof sequence.'
          : 'Soft hook recommended only if it improves the viewer entry point.',
    reason:
      effectiveInput.customInstructions.toLowerCase().includes('no hook')
        ? 'User instructions have highest priority, so the plan will not force a hook.'
        : `${profile.label} gives workflow context, but the edit plan chooses the hook based on goal, platform, and footage.`,
  } satisfies EditPlan['hookDecision']

  const supabaseSchemaPlan = createSupabaseSchemaPlan()
  const migrationDraftPlan = createMigrationDraftPlan()
  const migrationReviewPlan = createMigrationReviewPlan({ migrationDraftPlan, supabaseSchemaPlan })
  const supabaseProductionReadinessPlan = createSupabaseProductionReadinessPlan()
  const baseCreditEstimate = createCreditEstimate(finalAnalysisInput, {
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    captionVisualCueTimingPlan: finalCaptionVisualCueTimingPlan,
    colorPipelinePlan,
    dataVizPlan,
    depthAwareOverlayPlan,
    mapAnimationPlan,
    masterTimingPlan: finalMasterTimingPlan,
    renderStrategyPlan,
    rendererCompositionPlan: rendererCompositionPlanWithTimingValidation,
    sourceCleanupPlan,
    soundSyncTransitionTimingPlan: finalSoundSyncTransitionTimingPlan,
    speakerVisualLayoutPlan,
    timingValidationPlan,
    toolStrategyPlan,
    trimReviewPlan,
    visualAssetPlan: visualAssetPlanWithPrompts,
  })
  const basePlan: EditPlan = {
    goalSummary: compiledIntent.goalSummary,
    sourceSequenceMap,
    sourceSequenceReview: createSourceSequenceReviewState({
      clips: effectiveInput.clips,
      confirmed: sourceOrderConfirmed,
      customInstructions: effectiveInput.customInstructions,
      mode: sourceSequenceMode,
      userGuidance: 'Uploaded order is source/story context. Any final edit reorder must appear in the plan before approval.',
      aiNotes: [
        sourceSequenceMode === 'unordered_clips_needs_ai_help'
          ? 'User allowed ReeditPro to suggest final structure later without changing source order yet.'
          : 'Use source sequence as planning context.',
      ],
    }),
    sourceCleanupPlan,
    trimReviewPlan,
    recommendedStructure,
    hookDecision,
    referenceDNA: referenceProvided
      ? {
          pacing: 'Use the reference for rhythm and beat changes, not shot order.',
          music: 'Study the intro energy and duck music under the speaker voice.',
          captions: 'Adapt caption density and contrast while keeping ReeditPro spacing rules.',
          transitions: 'Borrow transition logic only where it supports the user footage.',
          visualStyle: 'Translate the mood into ReeditPro visual systems without copying scenes.',
          adaptationRule: 'Reference DNA guides style; it does not create a shot-for-shot copy.',
        }
      : undefined,
    signatureRoutes: routes.map((route) => ({
      ...route,
      reason: `${route.reason} (${systemLabel(route.system)} is selected per segment, not forced by the dropdown.)`,
    })),
    compiledIntent,
    videoUnderstandingReport,
    adaptiveEditStrategy,
    adaptiveEditStrategyPlan,
    toolRegistrySummary,
    toolStrategyPlan,
    colorPipelinePlan,
    audioPipelinePlan,
    mapAnimationPlan,
    dataVizPlan,
    renderStrategyPlan,
    visualAssetPlan: visualAssetPlanWithPrompts,
    aspectRatioFramePlan,
    masterTimingPlan: finalMasterTimingPlan,
    captionVisualCueTimingPlan: finalCaptionVisualCueTimingPlan,
    soundSyncTransitionTimingPlan: finalSoundSyncTransitionTimingPlan,
    timingValidationPlan,
    speakerVisualLayoutPlan,
    depthAwareOverlayPlan,
    rendererCompositionPlan: rendererCompositionPlanWithTimingValidation,
    segmentEditPlans: segmentEditPlansWithCleanupAndTrimReview,
    characterConsistencyPlan,
    documentaryFactSafetyPlan,
    editQAPlan,
    providerPromptPlans: providerPromptPlansWithCleanupAndTimingValidation,
    professionalEditingDirective,
    supabaseSchemaPlan,
    migrationDraftPlan,
    migrationReviewPlan,
    supabaseProductionReadinessPlan,
    soundSyncDirection:
      effectiveInput.editLevel === 'basic'
        ? 'Keep SoundSync subtle: light cleanup, soft bed if needed, and no distracting transitions.'
        : 'Use SoundSync for mood, beat timing, transition sounds, ducking, and emotional polish while speech stays clear.',
    captionDirection: 'Use readable captions that avoid faces, important objects, and Real Motion placement zones.',
    creditEstimate: baseCreditEstimate,
    approvalRequired: true,
  }

  const editingAgentExecutionPlan = createEditingAgentExecutionPlan({
    plan: basePlan,
    approvedPlanSnapshotId: undefined,
  })
  const asyncAssetReconciliationPlan = createAsyncAssetReconciliationPlan({
    plan: basePlan,
    editingAgentExecutionPlan,
    approvedPlanSnapshotId: undefined,
  })
  const editingAgentExecutionPlanWithReconciliation = linkAsyncReconciliationToExecutionPlan({
    editingAgentExecutionPlan,
    asyncAssetReconciliationPlan,
  })
  const agentQAFallbackPlan = createAgentQAFallbackPlan({
    plan: basePlan,
    editingAgentExecutionPlan: editingAgentExecutionPlanWithReconciliation,
    asyncAssetReconciliationPlan,
  })
  const editingAgentExecutionPlanWithAgentQA = linkAgentQAFallbackToExecutionPlan({
    editingAgentExecutionPlan: editingAgentExecutionPlanWithReconciliation,
    agentQAFallbackPlan,
  })
  const editQAPlanWithExecution = createEditQAPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    characterConsistencyPlan,
    colorPipelinePlan,
    compiledIntent,
    depthAwareOverlayPlan,
    documentaryFactSafetyPlan,
    editingAgentExecutionPlan: editingAgentExecutionPlanWithAgentQA,
    asyncAssetReconciliationPlan,
    agentQAFallbackPlan,
    input: finalAnalysisInput,
    dataVizPlan,
    mapAnimationPlan,
    captionVisualCueTimingPlan: finalCaptionVisualCueTimingPlan,
    masterTimingPlan: finalMasterTimingPlan,
    soundSyncTransitionTimingPlan: finalSoundSyncTransitionTimingPlan,
    timingValidationPlan,
    sourceCleanupPlan,
    trimReviewPlan,
    renderStrategyPlan,
    rendererCompositionPlan: rendererCompositionPlanWithTimingValidation,
    segmentEditPlans: segmentEditPlansWithCleanupAndTrimReview,
    speakerVisualLayoutPlan,
    toolStrategyPlan,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithPrompts,
  })
  const planWithExecution: EditPlan = {
    ...basePlan,
    editQAPlan: editQAPlanWithExecution,
    editingAgentExecutionPlan: editingAgentExecutionPlanWithAgentQA,
    asyncAssetReconciliationPlan,
    agentQAFallbackPlan,
    creditEstimate: createCreditEstimate(finalAnalysisInput, {
      adaptiveEditStrategyPlan,
      audioPipelinePlan,
      captionVisualCueTimingPlan: finalCaptionVisualCueTimingPlan,
      colorPipelinePlan,
      dataVizPlan,
      depthAwareOverlayPlan,
      editingAgentExecutionPlan: editingAgentExecutionPlanWithAgentQA,
      asyncAssetReconciliationPlan,
      agentQAFallbackPlan,
      mapAnimationPlan,
      masterTimingPlan: finalMasterTimingPlan,
      renderStrategyPlan,
      rendererCompositionPlan: rendererCompositionPlanWithTimingValidation,
      sourceCleanupPlan,
      soundSyncTransitionTimingPlan: finalSoundSyncTransitionTimingPlan,
      speakerVisualLayoutPlan,
      timingValidationPlan,
      toolStrategyPlan,
      trimReviewPlan,
      visualAssetPlan: visualAssetPlanWithPrompts,
    }),
  }

  return {
    ...planWithExecution,
    planningSystemAuditReport: createPlanningSystemAuditReport(planWithExecution),
  }
}
