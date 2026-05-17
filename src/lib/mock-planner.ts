import type {
  CharacterConsistencyPlan,
  ClipSource,
  DocumentaryFactSafetyPlan,
  EditPlan,
  PlannerInput,
  SignatureRoute,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import { createCharacterConsistencyPlan } from './character-consistency'
import { createCreditEstimate } from './credit-estimator'
import { createDocumentaryFactSafetyPlan } from './documentary-fact-safety'
import { createSegmentEditPlans } from './edit-operation-planner'
import { createEditQAPlan } from './edit-qa-planner'
import { getDefaultFrameTemplateForAspectRatio, getFrameLayoutTemplate } from './frame-layouts'
import { compileEditingIntent } from './intent-compiler'
import { buildProviderPromptPlansForEditPlan } from './prompt-builders'
import { createRendererCompositionPlan } from './remotion-renderer-planner'
import { createVisualAssetPlan } from './story-asset-planner'
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

export function createMockEditPlan(input: PlannerInput): EditPlan {
  const profile = getWorkflowProfile(input.workflowType)
  const compiledIntent =
    input.compiledIntent ??
    compileEditingIntent({
      currentInput: input,
      referenceProvided: input.referenceUrl.trim().length > 0,
      sourceOrderConfirmed: true,
      userMessages: [input.customInstructions],
    })
  const professionalEditingDirective = compiledIntent.professionalEditingDirective
  const effectiveInput: PlannerInput = {
    ...input,
    ...compiledIntent.resolvedSettings,
    compiledIntent,
    professionalEditingDirective,
  }
  const routes = createSignatureRoutes(effectiveInput)
  const visualAssetPlan = createVisualAssetPlan(effectiveInput)
  const frameTemplate = resolveFrameTemplate(effectiveInput)
  const rendererCompositionPlan = createRendererCompositionPlan({
    aspectRatio: effectiveInput.aspectRatio,
    editLevel: effectiveInput.editLevel,
    frameTemplate,
    targetPlatform: effectiveInput.targetPlatform,
    visualAssetPlan,
  })
  const segmentEditPlans = createSegmentEditPlans({
    compiledIntent,
    input: effectiveInput,
    rendererCompositionPlan,
    visualAssetPlan,
  })
  const characterConsistencyPlan = createCharacterConsistencyPlan({
    compiledIntent,
    input: effectiveInput,
    segmentEditPlans,
    visualAssetPlan,
  })
  const documentaryFactSafetyPlan = createDocumentaryFactSafetyPlan({
    characterConsistencyPlan,
    compiledIntent,
    input: effectiveInput,
    visualAssetPlan,
  })
  const visualAssetPlanWithSafety = enrichVisualAssetsWithSafetyPlans({
    characterConsistencyPlan,
    documentaryFactSafetyPlan,
    visualAssetPlan,
  })
  const editQAPlan = createEditQAPlan({
    characterConsistencyPlan,
    compiledIntent,
    documentaryFactSafetyPlan,
    input: effectiveInput,
    rendererCompositionPlan,
    segmentEditPlans,
    visualAssetPlan: visualAssetPlanWithSafety,
  })
  const providerPromptPlans = buildProviderPromptPlansForEditPlan({
    characterConsistencyPlan,
    compiledIntent,
    documentaryFactSafetyPlan,
    input: effectiveInput,
    professionalDirective: professionalEditingDirective,
    rendererCompositionPlan,
    segmentEditPlans,
    visualAssetPlan: visualAssetPlanWithSafety,
  })
  const visualAssetPlanWithPrompts = visualAssetPlanWithSafety.map((asset) => ({
    ...asset,
    promptPlans: providerPromptPlans.filter((promptPlan) => promptPlan.assetPlanItemId === asset.id),
  }))
  const segmentEditPlansWithPrompts = segmentEditPlans.map((segment) => ({
    ...segment,
    promptPlans: providerPromptPlans.filter((promptPlan) => promptPlan.segmentId === segment.id),
  }))
  const referenceProvided = effectiveInput.referenceUrl.trim().length > 0
  const strongerSocialOpen =
    effectiveInput.structurePreference === 'restructure_for_social' ||
    effectiveInput.structurePreference === 'let_ai_recommend' ||
    effectiveInput.workflowType === 'social_short_viral_clip' ||
    effectiveInput.workflowType === 'marketing_ad'

  const sourceSequenceMap = effectiveInput.clips.map((clip) => ({
    clipId: clip.id,
    uploadedOrder: clip.uploadedOrder,
    detectedRole: clip.detectedType,
    strengths: clip.isImportant ? ['Marked important by user', 'Strong candidate for story anchor'] : ['Useful supporting context'],
    concerns: clip.isOptional ? ['Marked optional, use only if it improves the story'] : ['Needs timing review before final structure'],
    possibleUses: [
      clip.uploadedOrder === 1 ? 'Natural opening context' : 'Supporting segment',
      clip.fileName.toLowerCase().includes('speaker') ? 'Possible hook or value line' : 'Visual proof or pacing support',
    ],
  }))

  const recommendedStructure = strongerSocialOpen
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

  return {
    goalSummary: compiledIntent.goalSummary,
    sourceSequenceMap,
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
    visualAssetPlan: visualAssetPlanWithPrompts,
    rendererCompositionPlan,
    segmentEditPlans: segmentEditPlansWithPrompts,
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
    creditEstimate: createCreditEstimate(effectiveInput, { rendererCompositionPlan, visualAssetPlan: visualAssetPlanWithSafety }),
    approvalRequired: true,
  }
}
