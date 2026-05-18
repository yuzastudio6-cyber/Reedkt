import type {
  AdaptiveEditStrategyPlan,
  CompiledEditingIntent,
  DepthAwareOverlayPlan,
  DepthAwareOverlayPlanItem,
  DepthCompositingMode,
  ForegroundDepthGroup,
  ForegroundObjectKind,
  ForegroundObjectPlan,
  MaskRiskLevel,
  MaskStrategy,
  PlannerInput,
  RectZone,
  SegmentEditPlan,
  SpeakerVisualLayoutMode,
  SpeakerVisualLayoutPlan,
  SpeakerVisualLayoutPlanItem,
  TrackingRequirement,
  VideoUnderstandingReport,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import {
  getDepthCompositingMode,
  getDepthFallbackLayout,
  getDepthQAChecks,
  getDepthTierAvailability,
  getMaskStrategy,
} from './depth-aware-overlays'

type CreateDepthAwareOverlayPlanParams = {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  visualAssetPlan?: VisualAssetPlanItem[]
  segmentEditPlans?: SegmentEditPlan[]
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  videoUnderstandingReport?: VideoUnderstandingReport
}

type DepthSeed = {
  layoutItem: SpeakerVisualLayoutPlanItem
  asset?: VisualAssetPlanItem
  segment?: SegmentEditPlan
  index: number
}

const depthCuePattern =
  /(behind me|behind the person|behind subject|behind the subject|in the scene|like it'?s behind|in depth|overlay behind|map behind|card behind|object in front|product in front|foreground|depth-aware|depth aware)/i

const contactCuePattern =
  /(pole|chair|table|desk|counter|laptop|phone|microphone|mic|steering wheel|bag|tool|bike|door frame|railing|podium|leaning|holding|touching|sitting on|using)/i

const mapGraphicCuePattern =
  /(map|route|location|city|country|neighborhood|distance|card|graphic|chart|diagram|evidence|timeline|dashboard|screen|article|browser|website|app)/i

function compact<T>(values: Array<T | undefined | false | null>): T[] {
  return values.filter(Boolean) as T[]
}

function seedText(input: PlannerInput, compiledIntent: CompiledEditingIntent | undefined, seed?: DepthSeed) {
  const clipText = input.clips
    .map((clip) => `${clip.fileName} ${clip.detectedType} ${clip.notes ?? ''} ${clip.sourceRole ?? ''} ${clip.thumbnailHint ?? ''}`)
    .join(' ')

  return [
    input.customInstructions,
    input.projectName,
    input.workflowType,
    input.editingCategory,
    input.visualPreference,
    compiledIntent?.goalSummary,
    ...(compiledIntent?.mustFollowRules ?? []),
    seed?.layoutItem.layoutMode,
    seed?.layoutItem.reason,
    seed?.layoutItem.promptImplications.join(' '),
    seed?.asset?.beatLabel,
    seed?.asset?.storyPurpose,
    seed?.asset?.assetType,
    seed?.asset?.reason,
    seed?.segment?.label,
    seed?.segment?.storyPurpose,
    seed?.segment?.spokenTextSummary,
    clipText,
  ]
    .filter(Boolean)
    .join(' ')
}

function localSeedText(seed: DepthSeed) {
  return [
    seed.layoutItem.layoutMode,
    seed.layoutItem.reason,
    seed.layoutItem.promptImplications.join(' '),
    seed.asset?.beatLabel,
    seed.asset?.storyPurpose,
    seed.asset?.assetType,
    seed.asset?.reason,
    seed.segment?.label,
    seed.segment?.storyPurpose,
    seed.segment?.spokenTextSummary,
  ]
    .filter(Boolean)
    .join(' ')
}

function reportDepthText(report?: VideoUnderstandingReport) {
  if (!report) return ''

  return [
    report.overallSummary,
    report.transcriptMeaning.visualSupportNeeded.join(' '),
    report.visualUnderstanding.foregroundOpportunities.join(' '),
    report.visualUnderstanding.contactObjectOpportunities.join(' '),
    report.visualUnderstanding.depthCompositionOpportunities.join(' '),
    report.visualSupportOpportunities
      .map((opportunity) => `${opportunity.opportunityType} ${opportunity.label} ${opportunity.reason}`)
      .join(' '),
    report.clips.flatMap((clip) => clip.foregroundDepthNotes).join(' '),
  ]
    .filter(Boolean)
    .join(' ')
}

function hasDepthCue(text: string) {
  return depthCuePattern.test(text)
}

function hasContactCue(text: string) {
  return contactCuePattern.test(text)
}

function hasMapOrGraphicCue(text: string) {
  return mapGraphicCuePattern.test(text)
}

function speakerVisible(layoutItem: SpeakerVisualLayoutPlanItem) {
  return layoutItem.speakerPresence !== 'voice_only' && layoutItem.speakerPresence !== 'hidden'
}

function layoutImpliesDepth(layoutMode: SpeakerVisualLayoutMode) {
  return layoutMode === 'speaker_cutout_overlay' || layoutMode === 'object_anchored_callout'
}

function firstGlobalDepthIndex(seeds: DepthSeed[], input: PlannerInput, compiledIntent?: CompiledEditingIntent) {
  return seeds.findIndex((seed) => {
    const text = seedText(input, compiledIntent, seed)
    return speakerVisible(seed.layoutItem) && (hasMapOrGraphicCue(text) || seed.layoutItem.visualDominance === 'dominant')
  })
}

function riskForMode(mode: DepthCompositingMode, strategy: MaskStrategy, input: PlannerInput, explicitDepthRequest: boolean): MaskRiskLevel {
  if (mode === 'graphic_on_top') {
    return explicitDepthRequest ? 'medium' : 'low'
  }

  if (mode === 'graphic_behind_subject_and_contact_objects') {
    return input.editLevel === 'pro' ? 'medium' : 'high'
  }

  if (mode === 'subject_cutout_overlay') {
    return 'premium'
  }

  if (mode === 'object_anchored_overlay') {
    return input.editLevel === 'premium' ? 'high' : 'medium'
  }

  if (strategy === 'subject_mask') {
    return 'medium'
  }

  return getDepthCompositingMode(mode)?.risk ?? 'low'
}

function strategyForMode(mode: DepthCompositingMode): MaskStrategy {
  return getDepthCompositingMode(mode)?.defaultMaskStrategy ?? 'none'
}

function trackingForStrategy(strategy: MaskStrategy): TrackingRequirement {
  return getMaskStrategy(strategy)?.trackingRequirement ?? 'none'
}

function chooseDepthMode(params: {
  input: PlannerInput
  seed: DepthSeed
  text: string
  globalDepthRequest: boolean
  globalDepthIndex: number
}): DepthCompositingMode | undefined {
  const { globalDepthIndex, globalDepthRequest, input, seed, text } = params
  const layoutMode = seed.layoutItem.layoutMode
  const useGlobalDepthRequest = globalDepthRequest && seed.index === Math.max(globalDepthIndex, 0)
  const explicitForSeed = hasDepthCue(localSeedText(seed)) || useGlobalDepthRequest

  if (layoutMode === 'speaker_cutout_overlay') {
    return input.editLevel === 'premium' ? 'subject_cutout_overlay' : 'graphic_behind_subject'
  }

  if (layoutMode === 'object_anchored_callout') {
    return input.editLevel === 'basic' ? 'graphic_on_top' : 'object_anchored_overlay'
  }

  if (!explicitForSeed) {
    const visualCouldBenefit =
      speakerVisible(seed.layoutItem) &&
      hasMapOrGraphicCue(text) &&
      (seed.layoutItem.visualDominance === 'dominant' || seed.layoutItem.visualDominance === 'balanced') &&
      input.editLevel !== 'basic'

    return visualCouldBenefit ? 'graphic_behind_subject' : undefined
  }

  const needsContactObject = hasContactCue(text) && /(behind|foreground|object in front|leaning|holding|touching|pole)/i.test(text)

  if (input.editLevel === 'basic') {
    return seed.layoutItem.visualDominance === 'full_takeover' ? 'full_visual_replacement' : 'graphic_on_top'
  }

  if (needsContactObject) {
    return 'graphic_behind_subject_and_contact_objects'
  }

  if (layoutMode === 'full_map_takeover' || layoutMode === 'full_evidence_board' || layoutMode === 'full_graphic_explainer') {
    return speakerVisible(seed.layoutItem) ? 'graphic_behind_subject' : 'full_visual_replacement'
  }

  if (speakerVisible(seed.layoutItem)) {
    return seed.layoutItem.layoutMode === 'lower_visual_panel' ? 'masked_panel_behind_subject' : 'graphic_behind_subject'
  }

  return 'full_visual_replacement'
}

function objectZone(layoutItem: SpeakerVisualLayoutPlanItem, kind: ForegroundObjectKind): RectZone | undefined {
  if (kind === 'human_subject' || kind === 'contact_object' || kind === 'scene_anchor_object') {
    return layoutItem.speakerZone
  }

  if (kind === 'hero_object') {
    return layoutItem.visualZone ?? layoutItem.speakerZone
  }

  return undefined
}

function contactObjectLabel(text: string) {
  if (/pole/i.test(text)) return 'pole / scene anchor'
  if (/chair/i.test(text)) return 'chair'
  if (/table|desk|counter/i.test(text)) return 'table or counter'
  if (/laptop/i.test(text)) return 'laptop'
  if (/phone/i.test(text)) return 'phone'
  if (/microphone|mic/i.test(text)) return 'microphone'
  if (/door frame/i.test(text)) return 'door frame'
  if (/railing/i.test(text)) return 'railing'
  return 'contact object'
}

function createForegroundObjects(params: {
  itemId: string
  layoutItem: SpeakerVisualLayoutPlanItem
  mode: DepthCompositingMode
  strategy: MaskStrategy
  risk: MaskRiskLevel
  trackingRequirement: TrackingRequirement
  text: string
  input: PlannerInput
}) {
  const { input, itemId, layoutItem, mode, risk, strategy, text, trackingRequirement } = params
  const objects: ForegroundObjectPlan[] = []
  const needsSubject =
    strategy === 'subject_mask' ||
    strategy === 'subject_plus_contact_object_mask' ||
    strategy === 'multi_object_depth_mask' ||
    strategy === 'full_cutout_composition' ||
    mode === 'graphic_behind_subject'

  if (needsSubject) {
    objects.push({
      id: `${itemId}-main-speaker`,
      label: 'main speaker',
      kind: 'human_subject',
      description: 'Planned foreground person; future worker must detect and confirm before masking.',
      preserveInFrontOfOverlay: true,
      reason: 'The speaker/subject should remain in front of the overlay to protect trust, face readability, and the depth illusion.',
      expectedZone: objectZone(layoutItem, 'human_subject'),
      maskDifficulty: risk,
      trackingRequirement,
      qaChecks: ['Protect face, eyes, mouth, hands, and body silhouette.', 'Do not cover the speaker with graphic text.'],
    })
  }

  if (strategy === 'subject_plus_contact_object_mask' || /pole|chair|table|desk|counter|laptop|phone|microphone|mic|door frame|railing/i.test(text)) {
    const label = contactObjectLabel(text)

    objects.push({
      id: `${itemId}-contact-object`,
      label,
      kind: 'contact_object',
      description: `Planned foreground contact object (${label}); mock planning only, future worker must detect/confirm it.`,
      preserveInFrontOfOverlay: true,
      reason: 'The object is visually connected to the person, so preserving it can keep the overlay from looking pasted on top.',
      expectedZone: objectZone(layoutItem, 'contact_object'),
      maskDifficulty: risk,
      trackingRequirement,
      qaChecks: ['Preserve the contact object only if it affects depth/story/readability.', 'Fallback if the contact object edge is too thin or unstable.'],
    })
  }

  if (strategy === 'hero_object_mask' || /product|phone|laptop|dashboard|screen|car|house|food|document|tool/i.test(text)) {
    objects.push({
      id: `${itemId}-hero-object`,
      label: input.workflowType === 'product_demo' ? 'product or demo object' : 'hero object',
      kind: 'hero_object',
      description: 'Planned product/story object that may need to remain readable in front of the overlay.',
      preserveInFrontOfOverlay: strategy === 'hero_object_mask',
      reason: 'Hero object preservation can keep the visual explanation anchored to the product or screen being discussed.',
      expectedZone: objectZone(layoutItem, 'hero_object'),
      maskDifficulty: strategy === 'hero_object_mask' ? risk : 'medium',
      trackingRequirement: strategy === 'hero_object_mask' ? trackingRequirement : 'light_tracking',
      qaChecks: ['Hero object remains readable.', 'Object preservation is used only when it supports the spoken point.'],
    })
  }

  if (/real_estate|house|door frame|counter|podium|table edge|railing/i.test(text) || input.workflowType === 'real_estate_property_tour') {
    objects.push({
      id: `${itemId}-scene-anchor`,
      label: input.workflowType === 'real_estate_property_tour' ? 'doorway/counter/house feature' : 'scene anchor',
      kind: 'scene_anchor_object',
      description: 'Planned scene anchor that can make a depth overlay feel grounded.',
      preserveInFrontOfOverlay: strategy === 'scene_anchor_mask' || strategy === 'multi_object_depth_mask',
      reason: 'Scene anchors are preserved only when they make the depth composition more believable or readable.',
      expectedZone: objectZone(layoutItem, 'scene_anchor_object'),
      maskDifficulty: risk,
      trackingRequirement,
      qaChecks: ['Do not preserve every background object.', 'Scene anchor must improve the depth illusion.'],
    })
  }

  return objects
}

function createForegroundGroups(params: {
  itemId: string
  mode: DepthCompositingMode
  strategy: MaskStrategy
  risk: MaskRiskLevel
  trackingRequirement: TrackingRequirement
  foregroundObjects: ForegroundObjectPlan[]
  fallbackLayoutMode?: SpeakerVisualLayoutMode
}) {
  const { fallbackLayoutMode, foregroundObjects, itemId, mode, risk, strategy, trackingRequirement } = params

  if (strategy === 'none') {
    return []
  }

  const mainSubjectIds = foregroundObjects.filter((object) => object.kind === 'human_subject').map((object) => object.id)
  const contactObjectIds = foregroundObjects.filter((object) => object.kind === 'contact_object').map((object) => object.id)
  const heroObjectIds = foregroundObjects.filter((object) => object.kind === 'hero_object' && object.preserveInFrontOfOverlay).map((object) => object.id)
  const sceneAnchorObjectIds = foregroundObjects
    .filter((object) => object.kind === 'scene_anchor_object' && object.preserveInFrontOfOverlay)
    .map((object) => object.id)

  const label =
    mode === 'graphic_behind_subject_and_contact_objects'
      ? 'subject plus contact object foreground group'
      : mode === 'object_anchored_overlay'
        ? 'hero object foreground group'
        : 'subject foreground group'

  return [
    {
      id: `${itemId}-foreground-group`,
      label,
      mainSubjectIds,
      contactObjectIds,
      heroObjectIds,
      sceneAnchorObjectIds,
      preserveGroupInFront: true,
      reason:
        contactObjectIds.length > 0
          ? 'The person and contact object should read as one foreground depth group so the overlay sits behind both.'
          : 'Foreground preservation is planned so the overlay does not cover the important subject/object.',
      maskStrategy: strategy,
      maskRisk: risk,
      trackingRequirement,
      fallbackLayoutMode,
      qaChecks: compact([
        'Foreground group remains in front of the overlay.',
        contactObjectIds.length > 0 ? 'Contact object preservation is explicitly checked.' : undefined,
        fallbackLayoutMode ? 'Fallback layout is available if mask quality is not reliable.' : undefined,
      ]),
    } satisfies ForegroundDepthGroup,
  ]
}

function complexityCreditImpact(mode: DepthCompositingMode, strategy: MaskStrategy): DepthAwareOverlayPlanItem['complexityCreditImpact'] {
  if (mode === 'none') return 'none'
  if (mode === 'graphic_on_top' || mode === 'full_visual_replacement') return 'low'
  if (strategy === 'subject_mask') return 'medium'
  if (strategy === 'subject_plus_contact_object_mask' || strategy === 'hero_object_mask' || mode === 'object_anchored_overlay') return 'high'
  if (strategy === 'multi_object_depth_mask' || strategy === 'full_cutout_composition') return 'premium'
  return 'medium'
}

function overlayDescription(mode: DepthCompositingMode) {
  if (mode === 'graphic_behind_subject_and_contact_objects') {
    return 'Map/card/graphic layer should sit behind the planned speaker plus contact object foreground group.'
  }

  if (mode === 'graphic_behind_subject') {
    return 'Map/card/graphic layer should sit behind the planned main speaker foreground mask.'
  }

  if (mode === 'object_anchored_overlay') {
    return 'Callout/graphic layer should anchor to the planned hero object after future object confirmation.'
  }

  if (mode === 'subject_cutout_overlay') {
    return 'Subject cutout would sit above a controlled graphic layout after future masking approval.'
  }

  if (mode === 'masked_panel_behind_subject') {
    return 'Panel/card should sit behind the speaker while the speaker remains in front.'
  }

  if (mode === 'full_visual_replacement') {
    return 'Full visual layer replaces source visibility while voiceover can continue.'
  }

  return 'Simple graphic layer sits above source video and below captions.'
}

function overlayBehindLabels(mode: DepthCompositingMode, foregroundObjects: ForegroundObjectPlan[]) {
  if (mode === 'graphic_behind_subject_and_contact_objects' || mode === 'graphic_behind_subject' || mode === 'masked_panel_behind_subject') {
    return foregroundObjects.filter((object) => object.preserveInFrontOfOverlay).map((object) => object.label)
  }

  return []
}

function itemFromSeed(params: {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  seed: DepthSeed
  mode: DepthCompositingMode
  explicitDepthRequest: boolean
}): DepthAwareOverlayPlanItem {
  const { compiledIntent, explicitDepthRequest, input, mode, seed } = params
  const strategy = strategyForMode(mode)
  const risk = riskForMode(mode, strategy, input, explicitDepthRequest)
  const trackingRequirement = trackingForStrategy(strategy)
  const tierAllowed = getDepthTierAvailability(mode, strategy)
  const fallbackLayoutMode = getDepthFallbackLayout(mode, risk) ?? seed.layoutItem.fallbackLayoutMode
  const itemId = `depth-aware-overlay-${seed.layoutItem.id}`
  const text = seedText(input, compiledIntent, seed)
  const foregroundObjects = createForegroundObjects({
    input,
    itemId,
    layoutItem: seed.layoutItem,
    mode,
    risk,
    strategy,
    text,
    trackingRequirement,
  })
  const foregroundDepthGroups = createForegroundGroups({
    fallbackLayoutMode,
    foregroundObjects,
    itemId,
    mode,
    risk,
    strategy,
    trackingRequirement,
  })
  const modeDefinition = getDepthCompositingMode(mode)
  const strategyDefinition = getMaskStrategy(strategy)
  const behindLabels = overlayBehindLabels(mode, foregroundObjects)

  return {
    id: itemId,
    segmentId: seed.layoutItem.segmentId ?? seed.segment?.id,
    assetPlanItemId: seed.layoutItem.assetPlanItemId ?? seed.asset?.id,
    speakerVisualLayoutItemId: seed.layoutItem.id,
    depthCompositingMode: mode,
    maskStrategy: strategy,
    foregroundObjects,
    foregroundDepthGroups,
    overlayLayerDescription: overlayDescription(mode),
    overlayShouldSitBehind: behindLabels,
    overlayShouldSitInFrontOf: mode === 'full_visual_replacement' ? [] : ['base source video/background layer'],
    captionLayerRule: 'Captions/top text stay above source video, overlay graphics, and any future foreground masks.',
    maskRisk: risk,
    trackingRequirement,
    tierAllowed,
    complexityCreditImpact: complexityCreditImpact(mode, strategy),
    reason: [
      seed.layoutItem.reason,
      explicitDepthRequest
        ? 'User or segment language requested an integrated behind-subject/foreground-aware overlay.'
        : 'The layout and visual type can benefit from depth-aware composition.',
      mode === 'graphic_behind_subject_and_contact_objects'
        ? 'Contact object preservation is planned so the map/card does not cover the object visually connected to the person.'
        : undefined,
      input.editLevel === 'basic'
        ? 'Basic avoids complex masks and uses a safer overlay/fallback plan.'
        : input.editLevel === 'premium'
          ? 'Premium can plan advanced depth composition with stronger QA and manual-style review notes.'
          : 'Pro can plan low/medium risk foreground-aware overlays with fallback.',
    ]
      .filter(Boolean)
      .join(' '),
    fallbackLayoutMode,
    promptImplications: [
      ...(modeDefinition?.promptImplications ?? []),
      'Generated assets should keep important text away from expected foreground masks.',
      'Use matching panel/background treatment; do not generate a final full canvas unless explicitly planned.',
      'AI video prompts must not ask Wan/Hailuo/Veo to solve real masking.',
      ...(mode === 'object_anchored_overlay' ? ['Design the callout with clear anchor space.'] : []),
    ],
    remotionLayerNotes: [
      ...(modeDefinition?.remotionLayerNotes ?? []),
      'Mock layer stack: base source video, overlay graphic/card/map layer, future foreground mask layer, captions/top text layer.',
      'Future mask/segmentation worker required before any real foreground masking.',
      ...(behindLabels.length > 0 ? [`Graphic should sit behind: ${behindLabels.join(', ')}.`] : []),
      ...(foregroundObjects.some((object) => object.kind === 'contact_object')
        ? ['Contact object preservation keeps the person plus object as one foreground depth group.']
        : []),
      'Captions remain above masks and graphics.',
      ...(fallbackLayoutMode ? [`Fallback layout: ${fallbackLayoutMode.replaceAll('_', ' ')}.`] : []),
    ],
    qaChecks: [
      ...getDepthQAChecks(mode, strategy),
      ...(strategyDefinition?.qaChecks ?? []),
      'Face, eyes, mouth, and important foreground detail are protected.',
      ...(foregroundObjects.some((object) => object.kind === 'contact_object')
        ? ['Contact object preservation is represented in foreground objects and depth groups.']
        : []),
      ...(fallbackLayoutMode ? ['Fallback layout exists for mask risk.'] : []),
      input.editLevel === 'basic' ? 'Basic avoids complex mask strategies and uses safer composition.' : 'Tier behavior matches depth complexity.',
    ],
    workerNotes: [
      'Mock planning only: no real segmentation, object detection, tracking, background removal, or mask generation is executed.',
      'Future worker must detect/confirm planned foreground objects before executing any mask.',
      'Workers must not execute mask/depth plans before approval.',
      ...(risk === 'high' || risk === 'premium' ? ['Manual-style review is recommended before executing this depth plan.'] : []),
    ],
  }
}

export function createDepthAwareOverlayPlan(params: CreateDepthAwareOverlayPlanParams): DepthAwareOverlayPlan {
  const { adaptiveEditStrategyPlan, compiledIntent, input, segmentEditPlans, speakerVisualLayoutPlan, videoUnderstandingReport, visualAssetPlan } = params
  const seeds: DepthSeed[] = (speakerVisualLayoutPlan?.items ?? []).map((layoutItem, index) => ({
    layoutItem,
    asset: visualAssetPlan?.find((asset) => asset.id === layoutItem.assetPlanItemId),
    segment: segmentEditPlans?.find((segment) => segment.id === layoutItem.segmentId),
    index,
  }))
  const understandingDepthText = reportDepthText(videoUnderstandingReport)
  const adaptiveDepthStrategies = adaptiveEditStrategyPlan?.segmentStrategies.filter((strategy) =>
    strategy.decisionKind === 'use_depth_overlay' ||
    strategy.recommendedLayoutMode === 'speaker_cutout_overlay' ||
    strategy.recommendedLayoutMode === 'object_anchored_callout' ||
    strategy.reasons.some((reason) => hasDepthCue(reason.explanation)),
  ) ?? []
  const adaptiveDepthText = adaptiveDepthStrategies
    .map((strategy) => `${strategy.label} ${strategy.decisionKind} ${strategy.recommendedLayoutMode ?? ''} ${strategy.reasons.map((reason) => reason.explanation).join(' ')}`)
    .join(' ')
  const globalText = [seedText(input, compiledIntent), understandingDepthText, adaptiveDepthText].filter(Boolean).join(' ')
  const globalDepthRequest = hasDepthCue(globalText) || adaptiveDepthStrategies.length > 0
  const globalDepthIndex = firstGlobalDepthIndex(seeds, input, compiledIntent)
  const items = seeds.flatMap((seed) => {
    const text = [seedText(input, compiledIntent, seed), understandingDepthText, adaptiveDepthText].filter(Boolean).join(' ')
    const explicitDepthRequest = hasDepthCue(localSeedText(seed)) ||
      adaptiveDepthStrategies.some((strategy, strategyIndex) =>
        strategy.segmentId === seed.segment?.id ||
        Boolean(strategy.clipId && seed.segment?.sourceClipIds.includes(strategy.clipId)) ||
        strategyIndex === seed.index,
      ) ||
      (globalDepthRequest && seed.index === Math.max(globalDepthIndex, 0))
    const mode = chooseDepthMode({
      globalDepthIndex,
      globalDepthRequest,
      input,
      seed,
      text,
    })

    if (!mode || (!explicitDepthRequest && !layoutImpliesDepth(seed.layoutItem.layoutMode) && mode === 'graphic_behind_subject' && input.editLevel === 'basic')) {
      return []
    }

    return itemFromSeed({ compiledIntent, explicitDepthRequest, input, mode, seed })
  })
  const active = items.length > 0
  const modes = Array.from(new Set(items.map((item) => item.depthCompositingMode.replaceAll('_', ' '))))
  const contactObjectCount = items.flatMap((item) => item.foregroundObjects).filter((object) => object.kind === 'contact_object').length

  return {
    id: `depth-aware-overlay-plan-${input.editingCategory}-${input.editLevel}`,
    active,
    summary: active
      ? `${items.length} depth-aware overlay item${items.length === 1 ? '' : 's'} planned using ${modes.join(', ')}. ${contactObjectCount} contact object${contactObjectCount === 1 ? '' : 's'} planned for foreground preservation.`
      : 'No depth-aware overlay is planned for this edit; normal speaker/visual layout remains sufficient.',
    items,
    globalRules: [
      'Captions stay above masks and graphics.',
      'Protect the face first.',
      'Preserve contact objects when they affect depth, story, or readability.',
      'Do not mask every object.',
      'Use depth-aware overlays only when they support the spoken meaning.',
      'Fallback layout is required for medium, high, or premium mask risk.',
      'No real mask, tracking, OpenCV, background removal, or Remotion rendering is executed in this frontend mock.',
      'Depth-aware composition is not a reason to use Veo.',
    ],
    qaChecks: [
      'Foreground mask is planned when a graphic should sit behind a subject.',
      'Contact object preservation is planned when needed.',
      'Face, eyes, and mouth are protected.',
      'Graphic text remains readable after foreground overlay.',
      'Captions remain above masks and graphics.',
      'Basic avoids complex mask strategies.',
      'Pro/Premium depth plans include fallback and stronger QA where risk requires it.',
      'Not every segment uses a depth effect.',
    ],
    notes: [
      active
        ? 'Depth-aware overlay plan is deterministic mock planning only; future workers must detect/confirm masks after approval.'
        : 'Depth-aware overlay plan is inactive because no segment benefits from a foreground-aware overlay.',
      'Wan, Hailuo, and Veo create assets/clips only and do not solve real masking.',
    ],
  }
}
