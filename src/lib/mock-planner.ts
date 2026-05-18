import type {
  AudioPipelinePlan,
  CharacterConsistencyPlan,
  ClipSource,
  ColorPipelinePlan,
  DataVizPlan,
  DepthAwareOverlayPlan,
  DocumentaryFactSafetyPlan,
  EditPlan,
  MapAnimationPlan,
  PlannerInput,
  RenderStrategyPlan,
  SegmentEditPlan,
  SignatureRoute,
  SpeakerVisualLayoutPlan,
  ToolStrategyPlan,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import { createAudioPipelinePlan } from './audio-pipeline-planner'
import { createCharacterConsistencyPlan } from './character-consistency'
import { createColorPipelinePlan } from './color-pipeline-planner'
import { createCreditEstimate } from './credit-estimator'
import { createDepthAwareOverlayPlan } from './depth-aware-overlay-planner'
import { createDepthAwareLayoutValidationPlan } from './depth-layout-validation'
import { createDataVizPlan } from './dataviz-planner'
import { createDocumentaryFactSafetyPlan } from './documentary-fact-safety'
import { createSegmentEditPlans } from './edit-operation-planner'
import { createEditQAPlan } from './edit-qa-planner'
import { createForegroundMaskingPlan } from './foreground-masking-planner'
import { getDefaultFrameTemplateForAspectRatio, getFrameLayoutTemplate } from './frame-layouts'
import { compileEditingIntent } from './intent-compiler'
import { createMapAnimationPlan } from './map-animation-planner'
import { buildProviderPromptPlansForEditPlan } from './prompt-builders'
import { createRendererCompositionPlan } from './remotion-renderer-planner'
import { createRenderStrategyPlan } from './render-strategy-planner'
import { createSpeakerVisualLayoutPlan } from './speaker-visual-layout-planner'
import { createAdaptiveEditStrategyPlan } from './adaptive-edit-strategy'
import { getToolRegistrySummary } from './tool-registry'
import { createToolStrategyPlan } from './tool-strategy-planner'
import {
  createSourceSequenceReviewState,
  getClipRoleLabel,
  inferClipSourceRole,
  inferSourceSequenceMode,
} from './source-sequence'
import { createVisualAssetPlan } from './story-asset-planner'
import { createMockVideoUnderstandingReport } from './video-understanding'
import { createWorkerRuntimePlan } from './worker-runtime-planner'
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
        'Future audio workers must use the approved snapshot; no FFmpeg/Essentia/librosa/Rubber Band/whisper.cpp processing runs in the frontend mock.',
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

export function createMockEditPlan(input: PlannerInput): EditPlan {
  const profile = getWorkflowProfile(input.workflowType)
  const sourceOrderConfirmed = input.sourceOrderConfirmed ?? true
  const sourceSequenceMode = input.sourceSequenceMode ?? inferSourceSequenceMode(input.clips, input.customInstructions)
  const compiledIntent =
    input.compiledIntent ??
    compileEditingIntent({
      currentInput: input,
      referenceProvided: input.referenceUrl.trim().length > 0,
      sourceOrderConfirmed,
      userMessages: [input.customInstructions],
    })
  const professionalEditingDirective = compiledIntent.professionalEditingDirective
  const effectiveInput: PlannerInput = {
    ...input,
    ...compiledIntent.resolvedSettings,
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
  const adaptiveEditStrategyPlan = createAdaptiveEditStrategyPlan({
    compiledIntent,
    input: effectiveInput,
    professionalDirective: professionalEditingDirective,
    videoUnderstandingReport: videoUnderstandingReportBase,
  })
  const videoUnderstandingReport = {
    ...videoUnderstandingReportBase,
    adaptiveStrategyPlan: adaptiveEditStrategyPlan,
  }
  const adaptiveEditStrategy = videoUnderstandingReport.suggestedStrategy
  const analysisInput: PlannerInput = {
    ...effectiveInput,
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
  const foregroundMaskingPlan = createForegroundMaskingPlan({
    depthAwareOverlayPlan,
    input: analysisInput,
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
  const rendererCompositionPlan = createRendererCompositionPlan({
    aspectRatio: effectiveInput.aspectRatio,
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
    visualAssetPlan: visualAssetPlanWithRenderStrategy,
  })
  const depthAwareLayoutValidationPlan = createDepthAwareLayoutValidationPlan({
    dataVizPlan,
    depthAwareOverlayPlan,
    foregroundMaskingPlan,
    input: analysisInput,
    mapAnimationPlan,
    rendererCompositionPlan,
    speakerVisualLayoutPlan,
  })
  const renderStrategyPlanWithDepthValidation = depthAwareLayoutValidationPlan.active
    ? {
        ...renderStrategyPlan,
        qaChecks: [
          ...renderStrategyPlan.qaChecks,
          `Depth layout validation status: ${depthAwareLayoutValidationPlan.overallStatus}.`,
          'Depth-aware validation confirms fallback, readability, contact-object preservation, credit impact, and mock-only worker boundaries.',
        ],
        notes: [
          ...renderStrategyPlan.notes,
          'Depth layout validation does not enable Veo or real worker execution.',
        ],
      }
    : renderStrategyPlan
  const toolStrategyPlanWithDepthValidation = depthAwareLayoutValidationPlan.active
    ? {
        ...toolStrategyPlan,
        qaChecks: [
          ...toolStrategyPlan.qaChecks,
          `Depth layout validation status: ${depthAwareLayoutValidationPlan.overallStatus}.`,
          'Future mask/tracking tools stay planning-only until approval.',
        ],
        notes: [
          ...toolStrategyPlan.notes,
          'Depth validation may request future OpenCV/Sharp/Remotion QA, but no tools run in this frontend mock.',
        ],
      }
    : toolStrategyPlan
  const rendererCompositionPlanWithDepthValidation = depthAwareLayoutValidationPlan.active
    ? {
        ...rendererCompositionPlan,
        rendererNotes: [
          ...rendererCompositionPlan.rendererNotes,
          `Depth layout validation status: ${depthAwareLayoutValidationPlan.overallStatus}; fallback count ${depthAwareLayoutValidationPlan.fallbackRecommendations.length}.`,
          'Renderer must keep base video < visual overlay < future foreground masks < captions/top UI.',
          'Validation is mock-only; no real masks or pixels were processed.',
        ],
      }
    : rendererCompositionPlan
  const segmentEditPlansBase = attachDepthToSegments(attachLayoutToSegments(createSegmentEditPlans({
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    colorPipelinePlan,
    compiledIntent,
    input: analysisInput,
    rendererCompositionPlan: rendererCompositionPlanWithDepthValidation,
    visualAssetPlan: visualAssetPlanWithRenderStrategy,
  }), speakerVisualLayoutPlan), depthAwareOverlayPlan)
  const segmentEditPlans = attachColorPipelineToSegments(
    attachToolStrategyToSegments(attachRenderStrategyToSegments(segmentEditPlansBase, renderStrategyPlanWithDepthValidation), toolStrategyPlanWithDepthValidation),
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
  const editQAPlan = createEditQAPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    characterConsistencyPlan,
    colorPipelinePlan,
    compiledIntent,
    depthAwareOverlayPlan,
    depthAwareLayoutValidationPlan,
    documentaryFactSafetyPlan,
    foregroundMaskingPlan,
    input: analysisInput,
    dataVizPlan,
    mapAnimationPlan,
    renderStrategyPlan: renderStrategyPlanWithDepthValidation,
    rendererCompositionPlan: rendererCompositionPlanWithDepthValidation,
    segmentEditPlans: segmentEditPlansWithAudioMapAndDataViz,
    speakerVisualLayoutPlan,
    toolStrategyPlan: toolStrategyPlanWithDepthValidation,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithRenderStrategy,
  })
  const providerPromptPlans = buildProviderPromptPlansForEditPlan({
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    characterConsistencyPlan,
    colorPipelinePlan,
    compiledIntent,
    depthAwareOverlayPlan,
    depthAwareLayoutValidationPlan,
    documentaryFactSafetyPlan,
    input: analysisInput,
    professionalDirective: professionalEditingDirective,
    dataVizPlan,
    mapAnimationPlan,
    renderStrategyPlan: renderStrategyPlanWithDepthValidation,
    rendererCompositionPlan: rendererCompositionPlanWithDepthValidation,
    segmentEditPlans: segmentEditPlansWithAudioMapAndDataViz,
    speakerVisualLayoutPlan,
    toolStrategyPlan: toolStrategyPlanWithDepthValidation,
    videoUnderstandingReport,
    visualAssetPlan: visualAssetPlanWithRenderStrategy,
  })
  const visualAssetPlanWithPrompts = visualAssetPlanWithRenderStrategy.map((asset) => ({
    ...asset,
    promptPlans: providerPromptPlans.filter((promptPlan) => promptPlan.assetPlanItemId === asset.id),
  }))
  const segmentEditPlansWithAudioMapDataVizAndPrompts = segmentEditPlansWithAudioMapAndDataViz.map((segment) => ({
    ...segment,
    promptPlans: providerPromptPlans.filter((promptPlan) => promptPlan.segmentId === segment.id),
  }))
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

  const creditEstimateParams = {
    adaptiveEditStrategyPlan,
    audioPipelinePlan,
    colorPipelinePlan,
    dataVizPlan,
    depthAwareLayoutValidationPlan,
    depthAwareOverlayPlan,
    mapAnimationPlan,
    renderStrategyPlan: renderStrategyPlanWithDepthValidation,
    rendererCompositionPlan: rendererCompositionPlanWithDepthValidation,
    speakerVisualLayoutPlan,
    toolStrategyPlan: toolStrategyPlanWithDepthValidation,
    visualAssetPlan: visualAssetPlanWithRenderStrategy,
  }

  const editPlanWithoutWorkerRuntime: EditPlan = {
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
    toolStrategyPlan: toolStrategyPlanWithDepthValidation,
    colorPipelinePlan,
    audioPipelinePlan,
    mapAnimationPlan,
    dataVizPlan,
    renderStrategyPlan: renderStrategyPlanWithDepthValidation,
    visualAssetPlan: visualAssetPlanWithPrompts,
    speakerVisualLayoutPlan,
    depthAwareOverlayPlan,
    foregroundMaskingPlan,
    depthAwareLayoutValidationPlan,
    rendererCompositionPlan: rendererCompositionPlanWithDepthValidation,
    segmentEditPlans: segmentEditPlansWithAudioMapDataVizAndPrompts,
    characterConsistencyPlan,
    documentaryFactSafetyPlan,
    editQAPlan,
    providerPromptPlans,
    professionalEditingDirective,
    soundSyncDirection:
      effectiveInput.editLevel === 'basic'
        ? 'Keep SoundSync subtle: light cleanup, soft bed if needed, and no distracting transitions.'
        : 'Use SoundSync for mood, beat timing, transition sounds, ducking, and emotional polish while speech stays clear.',
    captionDirection: 'Use readable captions that avoid faces, important objects, and Real Motion placement zones.',
    creditEstimate: createCreditEstimate(analysisInput, creditEstimateParams),
    approvalRequired: true,
  }
  const workerRuntimePlan = createWorkerRuntimePlan({
    projectId: 'mock-project',
    editPlanVersionId: 'mock-plan-version-v1',
    plan: editPlanWithoutWorkerRuntime,
  })

  return {
    ...editPlanWithoutWorkerRuntime,
    workerRuntimePlan,
    editQAPlan: createEditQAPlan({
      adaptiveEditStrategyPlan,
      audioPipelinePlan,
      characterConsistencyPlan,
      colorPipelinePlan,
      compiledIntent,
      depthAwareOverlayPlan,
      depthAwareLayoutValidationPlan,
      documentaryFactSafetyPlan,
      foregroundMaskingPlan,
      input: analysisInput,
      dataVizPlan,
      mapAnimationPlan,
      renderStrategyPlan: renderStrategyPlanWithDepthValidation,
      rendererCompositionPlan: rendererCompositionPlanWithDepthValidation,
      segmentEditPlans: segmentEditPlansWithAudioMapDataVizAndPrompts,
      speakerVisualLayoutPlan,
      toolStrategyPlan: toolStrategyPlanWithDepthValidation,
      videoUnderstandingReport,
      visualAssetPlan: visualAssetPlanWithPrompts,
      workerRuntimePlan,
    }),
    creditEstimate: createCreditEstimate(analysisInput, {
      ...creditEstimateParams,
      workerRuntimePlan,
    }),
  }
}
