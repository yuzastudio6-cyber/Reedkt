import type {
  CompiledEditingIntent,
  CharacterConsistencyPlan,
  DocumentaryFactSafetyPlan,
  FrameLayoutPlan,
  PlannerInput,
  ProfessionalEditingDirective,
  PromptConstraint,
  ProviderModel,
  ProviderPromptPlan,
  RendererCompositionPlan,
  SegmentEditPlan,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import { getDefaultFrameTemplateForAspectRatio, getFrameLayoutTemplate } from './frame-layouts'
import { styleModes, type StyleMode } from './style-modes'

type BasePromptParams = {
  asset: VisualAssetPlanItem
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  professionalDirective?: ProfessionalEditingDirective
  frameTemplate?: FrameLayoutPlan
  styleMode?: StyleMode
  segment?: SegmentEditPlan
  rendererCompositionPlan?: RendererCompositionPlan
  characterConsistencyPlan?: CharacterConsistencyPlan
  documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan
}

type BuildEditPromptPlansParams = {
  input: PlannerInput
  visualAssetPlan: VisualAssetPlanItem[]
  segmentEditPlans?: SegmentEditPlan[]
  rendererCompositionPlan?: RendererCompositionPlan
  compiledIntent?: CompiledEditingIntent
  professionalDirective?: ProfessionalEditingDirective
  characterConsistencyPlan?: CharacterConsistencyPlan
  documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan
}

const cardAssetTypes = ['fact_card', 'name_card', 'character_card', 'list_card', 'timeline_card'] as const

function compactLines(lines: Array<string | undefined | false>) {
  return lines.filter(Boolean).join('\n')
}

function label(value: string | undefined) {
  return value?.replaceAll('_', ' ') ?? 'auto'
}

function getStyleMode(styleModeId?: string) {
  return styleModes.find((styleMode) => styleMode.id === styleModeId)
}

function resolveFrameTemplate(input: PlannerInput, asset?: VisualAssetPlanItem) {
  const templateType = asset?.frameTemplateType ?? input.frameTemplateType

  if (templateType && templateType !== 'let_ai_decide') {
    return getFrameLayoutTemplate(templateType)
  }

  return getDefaultFrameTemplateForAspectRatio(input.aspectRatio)
}

function segmentForAsset(segments: SegmentEditPlan[] | undefined, assetId: string) {
  return segments?.find((segment) => segment.visualAssetPlanItemIds.includes(assetId))
}

function targetProviderForModel(model: ProviderModel): ProviderPromptPlan['targetProvider'] {
  if (model === 'gpt_image_2') {
    return 'gpt_image_2'
  }

  if (model.startsWith('wan')) {
    return 'wan'
  }

  if (model.startsWith('hailuo')) {
    return 'hailuo'
  }

  if (model === 'veo_3_1_lite') {
    return 'veo'
  }

  if (model === 'remotion_editor_motion') {
    return 'remotion'
  }

  if (model === 'svg_lottie_renderer') {
    return 'editor_motion'
  }

  return 'none'
}

function commonConstraints(params: BasePromptParams, providerModel: ProviderModel): PromptConstraint[] {
  const { asset, characterConsistencyPlan, compiledIntent, documentaryFactSafetyPlan, frameTemplate, input, professionalDirective, styleMode } = params
  const panelBackground = frameTemplate?.panelBackgroundColor ?? '#FFFFFF'
  const characterPacks = linkedCharacterPacks(asset, characterConsistencyPlan)
  const factSafetyItems = linkedFactSafetyItems(asset, documentaryFactSafetyPlan)
  const constraints: PromptConstraint[] = [
    {
      id: `${asset.id}-constraint-story`,
      label: 'Story purpose',
      instruction: `Support this beat only: ${asset.storyPurpose}`,
      source: 'user_intent',
      required: true,
    },
    {
      id: `${asset.id}-constraint-style`,
      label: 'Professional direction',
      instruction: `Use ${label(professionalDirective?.editStyle)} editing style, ${label(professionalDirective?.colorGradeStyle)} color direction, and avoid random visuals.`,
      source: 'professional_editing_directive',
      required: true,
    },
    {
      id: `${asset.id}-constraint-style-mode`,
      label: 'Style mode',
      instruction: styleMode?.promptNotes ?? 'Use the selected visual style mode without drifting.',
      source: 'style_mode',
      required: Boolean(styleMode),
    },
    {
      id: `${asset.id}-constraint-frame`,
      label: 'Frame panel',
      instruction: `Use matching panel background ${panelBackground}; keep action inside safe margins and animation panel.`,
      source: 'frame_layout',
      required: true,
    },
    {
      id: `${asset.id}-constraint-route`,
      label: 'Provider route',
      instruction: `Provider model: ${providerModel}. Resolution: ${asset.providerRoute.resolution}. Duration: ${asset.providerRoute.durationSeconds || asset.recommendedDurationSeconds || 0}s.`,
      source: 'provider_route',
      required: true,
    },
    {
      id: `${asset.id}-constraint-tier`,
      label: 'Tier policy',
      instruction:
        input.editLevel === 'premium'
          ? 'Premium may use Veo Lite only as final fallback/rescue when explicitly routed.'
          : 'Basic and Pro cannot use Veo Lite.',
      source: 'tier_policy',
      required: true,
    },
    {
      id: `${asset.id}-constraint-safety`,
      label: 'Safety and QA',
      instruction: 'No random extra characters, unrelated scenery, style drift, face/product obstruction, transparent AI-video default, or 1080P default.',
      source: 'qa',
      required: true,
    },
  ]

  if (compiledIntent?.avoidRules.length) {
    constraints.push({
      id: `${asset.id}-constraint-avoid`,
      label: 'Avoid rules',
      instruction: compiledIntent.avoidRules.slice(0, 4).join(' '),
      source: 'user_intent',
      required: true,
    })
  }

  if (characterPacks.length > 0) {
    constraints.push({
      id: `${asset.id}-constraint-character-pack`,
      label: 'Character consistency',
      instruction: characterPacks.map((pack) => `${pack.displayName}: preserve ${pack.importance} pack identity, outfit/silhouette/style, and expression range.`).join(' '),
      source: 'safety',
      required: true,
    })
  }

  if (factSafetyItems.length > 0) {
    constraints.push({
      id: `${asset.id}-constraint-fact-safety`,
      label: 'Fact safety',
      instruction: factSafetyItems.map((item) => `${item.claimStatus}: ${item.safeWording}; visual treatment ${item.visualTreatment}.`).join(' '),
      source: 'safety',
      required: true,
    })
  }

  return constraints
}

function commonSafeMarginNotes(frameTemplate?: FrameLayoutPlan) {
  return [
    `Frame template: ${frameTemplate?.templateType ?? 'auto frame'}.`,
    `Panel background: ${frameTemplate?.panelBackgroundColor ?? '#FFFFFF'}.`,
    `Safe margin: ${frameTemplate?.safeMargin ?? 0}px in the final ReeditPro frame plan.`,
    'Keep important action inside the animation panel and away from caption/face/product zones.',
    'Use matching panel background; do not depend on transparent AI-video background.',
  ]
}

function commonTierNotes(input: PlannerInput, providerModel: ProviderModel) {
  if (providerModel === 'veo_3_1_lite') {
    return input.editLevel === 'premium'
      ? ['Veo Lite is Premium-only final fallback/rescue.', 'Veo is not primary or default.']
      : ['Veo Lite is Premium-only final fallback.', `${input.editLevel} cannot use Veo.`]
  }

  return [
    input.editLevel === 'premium' ? 'Premium fallback depth applies after primary/normal fallback paths.' : 'Basic/Pro prompt plans exclude Veo.',
    'No provider prompt defaults to 1080P.',
  ]
}

function commonQaNotes(params: BasePromptParams) {
  const { asset, characterConsistencyPlan, compiledIntent, documentaryFactSafetyPlan, frameTemplate } = params
  const characterPacks = linkedCharacterPacks(asset, characterConsistencyPlan)
  const factSafetyItems = linkedFactSafetyItems(asset, documentaryFactSafetyPlan)

  return [
    ...asset.qaChecks,
    ...(compiledIntent?.qaImplications.slice(0, 3) ?? []),
    ...characterPacks.flatMap((pack) => pack.qaChecks.slice(0, 2)),
    ...factSafetyItems.flatMap((item) => item.qaChecks.slice(0, 2)),
    'No random extra characters or unrelated scenery.',
    'No style drift.',
    'Do not obstruct faces, products, captions, or AI panels.',
    `Generated background must match panel background ${frameTemplate?.panelBackgroundColor ?? '#FFFFFF'}.`,
  ]
}

function commonWorkerNotes(providerModel: ProviderModel) {
  if (providerModel === 'remotion_editor_motion' || providerModel === 'svg_lottie_renderer') {
    return ['Controlled renderer/editor motion only.', 'No AI-video provider call is implied by this brief.']
  }

  if (providerModel === 'gpt_image_2') {
    return ['Creates image/card/keyframe assets only.', 'Does not own final canvas or final edit order.']
  }

  if (providerModel === 'veo_3_1_lite') {
    return ['Premium final fallback/rescue only.', 'Do not send unless approved fallback conditions are met.']
  }

  return ['Creates AI video clip/asset only.', 'ReeditPro/Remotion owns final canvas and timeline placement.']
}

export function buildNegativePrompt(params: {
  asset: VisualAssetPlanItem
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  professionalDirective?: ProfessionalEditingDirective
  styleMode?: StyleMode
  characterConsistencyPlan?: CharacterConsistencyPlan
  documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan
}) {
  const { asset, characterConsistencyPlan, compiledIntent, documentaryFactSafetyPlan, input, professionalDirective, styleMode } = params
  const characterPacks = linkedCharacterPacks(asset, characterConsistencyPlan)
  const factSafetyItems = linkedFactSafetyItems(asset, documentaryFactSafetyPlan)
  const avoidRules = [
    ...(compiledIntent?.avoidRules ?? []),
    ...(professionalDirective?.avoidRules ?? []),
    ...(styleMode?.avoidUseCases.map((avoidUseCase) => `avoid ${avoidUseCase}`) ?? []),
    'no random characters',
    'no unrelated background',
    cardAssetTypes.includes(asset.assetType as (typeof cardAssetTypes)[number]) ? undefined : 'no extra text unless requested',
    'no style drift',
    asset.signatureSystem === 'stroke_motion' ? 'no photorealism for Stroke Motion' : undefined,
    /serious|documentary|professional|premium/i.test(input.customInstructions) ? 'no childish or cartoonish visuals' : undefined,
    'no face or product obstruction',
    asset.signatureSystem === 'stroke_motion' ? 'no 3D if 2D stroke is requested' : undefined,
    'no camera movement if static frame is requested',
    'no transparent background default',
    'no gore or blood if symbolic graphic treatment is enough',
    input.editingCategory === 'documentary_case_study' ? 'no defamatory visual implication for claims or allegations' : undefined,
    characterPacks.length > 0 ? 'no character identity drift' : undefined,
    characterPacks.some((pack) => pack.realityStatus === 'real_named_person' || pack.realityStatus === 'unknown') ? 'no realistic likeness by default' : undefined,
    factSafetyItems.length > 0 ? 'no guilt-implying documentary visuals' : undefined,
    factSafetyItems.some((item) => item.sourceNeeded) ? 'no verified-fact framing for source-needed claims' : undefined,
  ]

  return Array.from(new Set(avoidRules.filter(Boolean))).join('; ')
}

function basePromptPlan(params: BasePromptParams & {
  idSuffix: string
  planType: ProviderPromptPlan['planType']
  providerModel: ProviderModel
  title: string
  prompt: string
  tierAllowed?: boolean
  negativePrompt?: string
}): ProviderPromptPlan {
  const {
    asset,
    frameTemplate,
    idSuffix,
    input,
    negativePrompt,
    planType,
    professionalDirective,
    providerModel,
    prompt,
    segment,
    styleMode,
    tierAllowed = true,
    title,
  } = params

  return {
    id: `${asset.id}-${idSuffix}`,
    assetPlanItemId: asset.id,
    segmentId: segment?.id,
    planType,
    targetProvider: targetProviderForModel(providerModel),
    providerModel,
    title,
    prompt,
    negativePrompt,
    constraints: commonConstraints(params, providerModel),
    frameTemplateType: frameTemplate?.templateType ?? asset.frameTemplateType,
    panelBackgroundColor: frameTemplate?.panelBackgroundColor ?? '#FFFFFF',
    safeMarginNotes: commonSafeMarginNotes(frameTemplate),
    styleModeId: styleMode?.id ?? asset.styleModeId,
    professionalEditStyle: professionalDirective?.editStyle,
    durationSeconds: asset.providerRoute.durationSeconds || asset.recommendedDurationSeconds,
    resolution: providerModel === 'veo_3_1_lite' ? '720P' : asset.providerRoute.resolution,
    tierAllowed,
    tierPolicyNotes: commonTierNotes(input, providerModel),
    qaNotes: commonQaNotes(params),
    workerNotes: commonWorkerNotes(providerModel),
    promptVersion: 'mock-v1',
    characterPackIds: asset.characterPackIds,
    factSafetyItemIds: asset.factSafetyItemIds,
  }
}

function styleModeLines(styleMode?: StyleMode) {
  if (!styleMode) {
    return 'Visual style mode: auto selected by ReeditPro.'
  }

  return compactLines([
    `Visual style mode: ${styleMode.label}.`,
    `Line/color rule: ${styleMode.strokeColorRule}`,
    `Fill rule: ${styleMode.fillRule}`,
    `Motion behavior: ${styleMode.motionBehavior}`,
    `Background rule: ${styleMode.backgroundRule}`,
    `Prompt notes: ${styleMode.promptNotes}`,
  ])
}

function professionalLines(directive?: ProfessionalEditingDirective) {
  if (!directive) {
    return 'Professional editing direction: clean professional default.'
  }

  return compactLines([
    `Professional edit style: ${label(directive.editStyle)}.`,
    `Pacing: ${label(directive.pacingStyle)}; cut intensity: ${label(directive.cutIntensity)}.`,
    `Color grade direction: ${label(directive.colorGradeStyle)}.`,
    `Caption direction: ${label(directive.captionStyle)}.`,
    directive.mustFollowRules.length ? `Must follow: ${directive.mustFollowRules.slice(0, 4).join('; ')}.` : undefined,
    directive.avoidRules.length ? `Avoid: ${directive.avoidRules.slice(0, 4).join('; ')}.` : undefined,
  ])
}

function storyLines(asset: VisualAssetPlanItem, input: PlannerInput) {
  return compactLines([
    `Editing category: ${label(input.editingCategory)}.`,
    `Beat label: ${asset.beatLabel}.`,
    `Story purpose: ${asset.storyPurpose}.`,
    `Narrative phase: ${asset.narrativePhase}; emotion: ${asset.emotion}; action intensity: ${asset.actionIntensity}.`,
    `Asset type: ${label(asset.assetType)}; signature system: ${label(asset.signatureSystem)}.`,
  ])
}

function frameLines(frameTemplate?: FrameLayoutPlan) {
  return compactLines([
    `Use a plain matching panel background: ${frameTemplate?.panelBackgroundColor ?? '#FFFFFF'}.`,
    `Frame template: ${frameTemplate?.templateType ?? 'auto'}.`,
    `Keep important action inside safe margins (${frameTemplate?.safeMargin ?? 0}px) and inside the planned animation panel.`,
    'Do not depend on transparent AI-video backgrounds.',
    'Provider generates an asset/clip only; ReeditPro owns the final canvas.',
  ])
}

function linkedCharacterPacks(asset: VisualAssetPlanItem, characterConsistencyPlan?: CharacterConsistencyPlan) {
  const ids = asset.characterPackIds ?? []

  if (!characterConsistencyPlan || ids.length === 0) {
    return []
  }

  return characterConsistencyPlan.packs.filter((pack) => ids.includes(pack.id))
}

function linkedFactSafetyItems(asset: VisualAssetPlanItem, documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan) {
  const ids = asset.factSafetyItemIds ?? []

  if (!documentaryFactSafetyPlan || ids.length === 0) {
    return []
  }

  return documentaryFactSafetyPlan.claimItems.filter((item) => ids.includes(item.id))
}

function characterLines(asset: VisualAssetPlanItem, characterConsistencyPlan?: CharacterConsistencyPlan) {
  const packs = linkedCharacterPacks(asset, characterConsistencyPlan)

  if (packs.length === 0) {
    return asset.needsCharacterConsistency
      ? 'Character consistency: preserve planned character references and avoid identity drift.'
      : undefined
  }

  return compactLines([
    'Character consistency:',
    ...packs.map((pack) => [
      `- ${pack.displayName}: ${pack.roleInStory}; importance ${pack.importance}; reality status ${pack.realityStatus}.`,
      `  Preserve appearance: ${pack.appearance.visualDescription}`,
      `  Rules: ${pack.consistencyRules.slice(0, 2).join(' ')}`,
      `  Avoid: ${pack.avoidRules.slice(0, 2).join(' ')}`,
    ].join('\n')),
  ])
}

function factSafetyLines(asset: VisualAssetPlanItem, documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan) {
  const items = linkedFactSafetyItems(asset, documentaryFactSafetyPlan)

  if (!documentaryFactSafetyPlan?.active && items.length === 0) {
    return undefined
  }

  if (items.length === 0) {
    return 'Documentary fact safety: keep names, claims, and evidence visually neutral unless verified and approved.'
  }

  return compactLines([
    'Documentary fact safety:',
    ...items.map((item) => [
      `- Claim status ${item.claimStatus}: ${item.safeWording}`,
      `  Visual treatment: ${item.visualTreatment}.`,
      item.sourceNeeded ? '  Source needed; do not frame this as verified fact.' : undefined,
      `  Avoid: ${item.avoidRules.slice(0, 2).join(' ')}`,
    ].filter(Boolean).join('\n')),
  ])
}

export function buildImagePromptPlan(params: BasePromptParams): ProviderPromptPlan {
  const { asset, characterConsistencyPlan, compiledIntent, documentaryFactSafetyPlan, frameTemplate, input, professionalDirective, styleMode } = params
  const cardNeedsText = cardAssetTypes.includes(asset.assetType as (typeof cardAssetTypes)[number])
  const planType: ProviderPromptPlan['planType'] = cardNeedsText
    ? 'still_card_prompt'
    : asset.assetType === 'graphic_design_frame'
      ? 'graphic_design_prompt'
      : 'image_prompt'
  const prompt = compactLines([
    'Create a production-ready image asset for ReeditPro.',
    storyLines(asset, input),
    professionalLines(professionalDirective),
    styleModeLines(styleMode),
    frameLines(frameTemplate),
    characterLines(asset, characterConsistencyPlan),
    factSafetyLines(asset, documentaryFactSafetyPlan),
    cardNeedsText
      ? 'Design a readable card with clean hierarchy, intentional text only, and no clutter.'
      : 'Do not add random text; use clean composition and safe margins.',
    asset.needsCharacterConsistency ? 'Preserve character consistency from planned references.' : undefined,
    input.editingCategory === 'documentary_case_study' ? 'Treat names, claims, and people neutrally unless verified.' : undefined,
    compiledIntent?.goalSummary ? `Compiled goal: ${compiledIntent.goalSummary}.` : undefined,
  ])

  return basePromptPlan({
    ...params,
    idSuffix: `${planType}-gpt-image-2`,
    negativePrompt: buildNegativePrompt(params),
    planType,
    prompt,
    providerModel: 'gpt_image_2',
    title: `${asset.beatLabel} / GPT-Image-2 asset`,
  })
}

function wanPromptText(params: BasePromptParams, providerModel: ProviderModel) {
  const { asset, characterConsistencyPlan, frameTemplate, input, professionalDirective, documentaryFactSafetyPlan, styleMode } = params
  const hasEndFrame = asset.needsStartFrame && asset.needsEndFrame

  return compactLines([
    hasEndFrame
      ? 'Create a fast silent 2D stroke-motion storytelling animation between the provided first frame and last frame.'
      : 'Animate from the provided start frame as a silent 2D story asset.',
    storyLines(asset, input),
    professionalLines(professionalDirective),
    styleModeLines(styleMode),
    frameLines(frameTemplate),
    characterLines(asset, characterConsistencyPlan),
    factSafetyLines(asset, documentaryFactSafetyPlan),
    hasEndFrame ? 'Clearly transition from first frame to last frame in 5 seconds.' : 'Describe motion clearly and keep the final emotional/action goal readable.',
    'Preserve style, characters, composition, and matching panel background.',
    'No new characters unless planned. No realism unless this route is Real Motion. No audio by default.',
    providerModel === 'wan_2_2_kf2v_flash' ? 'Output 720P. Duration 5 seconds.' : 'Output 720P. Duration 2-15 seconds as routed.',
  ])
}

export function buildStrokeMotionVideoPromptPlan(params: BasePromptParams): ProviderPromptPlan {
  const providerModel = params.asset.providerRoute.primaryModel.startsWith('wan') ? params.asset.providerRoute.primaryModel : 'wan_2_6_i2v_flash'

  return basePromptPlan({
    ...params,
    idSuffix: `${providerModel}-stroke-motion`,
    negativePrompt: buildNegativePrompt(params),
    planType: 'stroke_motion_video_prompt',
    prompt: wanPromptText(params, providerModel),
    providerModel,
    title: `${params.asset.beatLabel} / Wan Stroke Motion clip`,
  })
}

export function buildGraphicDesignPromptPlan(params: BasePromptParams): ProviderPromptPlan {
  const { asset, characterConsistencyPlan, documentaryFactSafetyPlan, frameTemplate, input, professionalDirective, styleMode } = params
  const providerModel = asset.providerRoute.primaryModel === 'svg_lottie_renderer' ? 'svg_lottie_renderer' : 'remotion_editor_motion'
  const planType: ProviderPromptPlan['planType'] = asset.assetType === 'motion_design_scene' ? 'motion_design_prompt' : 'graphic_design_prompt'
  const prompt = compactLines([
    'Create a controlled Graphic Design / VisualExplain prompt plan for ReeditPro.',
    storyLines(asset, input),
    professionalLines(professionalDirective),
    styleModeLines(styleMode),
    frameLines(frameTemplate),
    characterLines(asset, characterConsistencyPlan),
    factSafetyLines(asset, documentaryFactSafetyPlan),
    'Use exact readable hierarchy, labels, arrows, timeline structure, or cards only where planned.',
    'Text must be legible and intentional. No random text. No clutter.',
    'This creates a graphic/design asset or controlled motion brief, not a full final video.',
  ])

  return basePromptPlan({
    ...params,
    idSuffix: `${planType}-${providerModel}`,
    negativePrompt: buildNegativePrompt(params),
    planType,
    prompt,
    providerModel,
    title: `${asset.beatLabel} / VisualExplain prompt`,
  })
}

export function buildRealMotionPromptPlan(params: BasePromptParams): ProviderPromptPlan {
  const { asset, characterConsistencyPlan, documentaryFactSafetyPlan, frameTemplate, input, professionalDirective, styleMode } = params
  const providerModel = asset.providerRoute.primaryModel.startsWith('wan') ? asset.providerRoute.primaryModel : 'wan_2_6_i2v_flash'
  const prompt = compactLines([
    'Create a silent Real Motion asset/clip for ReeditPro, not the final canvas.',
    storyLines(asset, input),
    professionalLines(professionalDirective),
    styleModeLines(styleMode),
    frameLines(frameTemplate),
    characterLines(asset, characterConsistencyPlan),
    factSafetyLines(asset, documentaryFactSafetyPlan),
    'Use realistic object/product/proof motion only where it improves the segment.',
    'Keep faces safe. Keep motion overlay-first and credit-aware.',
    'Preserve matching panel background and safe margins. Output 720P.',
  ])

  return basePromptPlan({
    ...params,
    idSuffix: `${providerModel}-real-motion`,
    negativePrompt: buildNegativePrompt(params),
    planType: 'real_motion_video_prompt',
    prompt,
    providerModel,
    title: `${asset.beatLabel} / Real Motion clip`,
  })
}

function hailuoPromptText(params: BasePromptParams, providerModel: ProviderModel) {
  const { asset, characterConsistencyPlan, documentaryFactSafetyPlan, frameTemplate, input, styleMode } = params

  return compactLines([
    providerModel === 'hailuo_02'
      ? 'Create a direct start-frame plus end-frame animation transition.'
      : 'Create a direct start-frame-only animation fallback.',
    `Beat: ${asset.beatLabel}. Purpose: ${asset.storyPurpose}.`,
    `Style: ${styleMode?.label ?? label(asset.signatureSystem)}. Category: ${label(input.editingCategory)}.`,
    `Motion: ${asset.emotion}, ${asset.actionIntensity} intensity, readable without audio.`,
    `Use matching panel background ${frameTemplate?.panelBackgroundColor ?? '#FFFFFF'}; no transparent default.`,
    characterLines(asset, characterConsistencyPlan),
    factSafetyLines(asset, documentaryFactSafetyPlan),
    'Preserve style. Use static camera unless a small movement is planned. Output 768P.',
  ])
}

function buildHailuoPromptPlan(params: BasePromptParams, providerModel: ProviderModel): ProviderPromptPlan {
  return basePromptPlan({
    ...params,
    idSuffix: `${providerModel}-fallback`,
    negativePrompt: buildNegativePrompt(params),
    planType: params.asset.signatureSystem === 'real_motion' ? 'real_motion_video_prompt' : 'stroke_motion_video_prompt',
    prompt: hailuoPromptText(params, providerModel).slice(0, 1900),
    providerModel,
    title: `${params.asset.beatLabel} / Hailuo fallback`,
  })
}

export function buildVeoFallbackPromptPlan(params: BasePromptParams): ProviderPromptPlan {
  const { asset, characterConsistencyPlan, documentaryFactSafetyPlan, frameTemplate, input, professionalDirective, styleMode } = params
  const routeIncludesVeo = asset.providerRoute.fallbackModels.includes('veo_3_1_lite') ||
    asset.providerRoute.fallbackSteps.some((fallbackStep) => fallbackStep.model === 'veo_3_1_lite')
  const tierAllowed = input.editLevel === 'premium' && routeIncludesVeo
  const prompt = tierAllowed
    ? compactLines([
        'Premium final fallback/rescue prompt for Veo 3.1 Lite. Do not treat as primary/default.',
        storyLines(asset, input),
        professionalLines(professionalDirective),
        styleModeLines(styleMode),
        frameLines(frameTemplate),
        characterLines(asset, characterConsistencyPlan),
        factSafetyLines(asset, documentaryFactSafetyPlan),
        'Use a clear story timeline, style consistency, safe margins, and matching panel background.',
        'Readable without audio. No random extra elements. Provider creates a clip asset only.',
      ])
    : 'Not available for this tier. Veo Lite is Premium-only final fallback.'

  return basePromptPlan({
    ...params,
    idSuffix: 'veo-final-fallback',
    negativePrompt: tierAllowed ? buildNegativePrompt(params) : undefined,
    planType: 'veo_fallback_prompt',
    prompt,
    providerModel: 'veo_3_1_lite',
    tierAllowed,
    title: tierAllowed ? `${asset.beatLabel} / Veo final fallback` : 'Veo locked for this tier',
  })
}

export function buildRemotionMotionBrief(params: BasePromptParams): ProviderPromptPlan {
  const { asset, characterConsistencyPlan, documentaryFactSafetyPlan, frameTemplate, input, rendererCompositionPlan, segment, styleMode } = params
  const linkedLayers = rendererCompositionPlan?.layers.filter((layer) => layer.assetPlanItemId === asset.id) ?? []
  const prompt = compactLines([
    'Create a Remotion/editor motion brief. No AI-video provider is needed for this brief.',
    storyLines(asset, input),
    styleModeLines(styleMode),
    frameLines(frameTemplate),
    characterLines(asset, characterConsistencyPlan),
    factSafetyLines(asset, documentaryFactSafetyPlan),
    segment ? `Segment: ${segment.label}, final time ${segment.finalTimeRange.startSeconds}-${segment.finalTimeRange.endSeconds}s.` : undefined,
    linkedLayers.length ? `Renderer layers: ${linkedLayers.map((layer) => `${layer.label} (${layer.motionPreset ?? layer.fitMode})`).join('; ')}.` : undefined,
    'Include layer timing, motion preset, card/graphic behavior, safe zones, captions, panel layout, and transition timing.',
    'Exact text, captions, and final composition are controlled by ReeditPro.',
  ])

  return basePromptPlan({
    ...params,
    idSuffix: 'remotion-motion-brief',
    planType: 'remotion_motion_brief',
    prompt,
    providerModel: asset.providerRoute.primaryModel === 'svg_lottie_renderer' ? 'svg_lottie_renderer' : 'remotion_editor_motion',
    title: `${asset.beatLabel} / Remotion motion brief`,
  })
}

function startEndFramePlans(params: BasePromptParams) {
  const plans: ProviderPromptPlan[] = []

  if (params.asset.needsStartFrame) {
    plans.push(basePromptPlan({
      ...params,
      idSuffix: 'start-frame-gpt-image-2',
      negativePrompt: buildNegativePrompt(params),
      planType: 'start_frame_prompt',
      prompt: compactLines([
        'Create the start frame for a planned ReeditPro animation asset.',
        storyLines(params.asset, params.input),
        professionalLines(params.professionalDirective),
        styleModeLines(params.styleMode),
        frameLines(params.frameTemplate),
        characterLines(params.asset, params.characterConsistencyPlan),
        factSafetyLines(params.asset, params.documentaryFactSafetyPlan),
        'This frame must match the future animation panel and preserve character/style continuity.',
      ]),
      providerModel: 'gpt_image_2',
      title: `${params.asset.beatLabel} / start frame`,
    }))
  }

  if (params.asset.needsEndFrame) {
    plans.push(basePromptPlan({
      ...params,
      idSuffix: 'end-frame-gpt-image-2',
      negativePrompt: buildNegativePrompt(params),
      planType: 'end_frame_prompt',
      prompt: compactLines([
        'Create the end frame for a planned ReeditPro animation asset.',
        storyLines(params.asset, params.input),
        professionalLines(params.professionalDirective),
        styleModeLines(params.styleMode),
        frameLines(params.frameTemplate),
        characterLines(params.asset, params.characterConsistencyPlan),
        factSafetyLines(params.asset, params.documentaryFactSafetyPlan),
        'This end frame must resolve the action/emotion while matching the start frame style and panel background.',
      ]),
      providerModel: 'gpt_image_2',
      title: `${params.asset.beatLabel} / end frame`,
    }))
  }

  return plans
}

function shouldUseImagePrompt(asset: VisualAssetPlanItem) {
  return [
    'still_scene',
    'fact_card',
    'name_card',
    'character_card',
    'list_card',
    'timeline_card',
    'graphic_design_frame',
    'still_with_editor_motion',
  ].includes(asset.assetType)
}

function shouldUseRemotionBrief(asset: VisualAssetPlanItem) {
  return ['motion_design_scene', 'graphic_design_frame', 'still_with_editor_motion', 'fact_card', 'name_card', 'character_card', 'list_card', 'timeline_card', 'transition_scene'].includes(asset.assetType) ||
    asset.providerRoute.primaryModel === 'remotion_editor_motion' ||
    asset.providerRoute.primaryModel === 'svg_lottie_renderer'
}

export function buildPromptPlansForAsset(params: BasePromptParams): ProviderPromptPlan[] {
  const { asset } = params
  const plans: ProviderPromptPlan[] = []

  if (shouldUseImagePrompt(asset)) {
    plans.push(buildImagePromptPlan(params))
  }

  plans.push(...startEndFramePlans(params))

  if (asset.assetType === 'motion_design_scene' || asset.assetType === 'graphic_design_frame') {
    plans.push(buildGraphicDesignPromptPlan(params))
  }

  if (asset.signatureSystem === 'stroke_motion' && asset.providerRoute.primaryModel.startsWith('wan')) {
    plans.push(buildStrokeMotionVideoPromptPlan(params))
  }

  if (asset.signatureSystem === 'real_motion' || asset.assetType === 'real_motion_scene') {
    plans.push(buildRealMotionPromptPlan(params))
  }

  asset.providerRoute.fallbackModels
    .filter((model) => model.startsWith('hailuo'))
    .forEach((model) => plans.push(buildHailuoPromptPlan(params, model)))

  if (asset.providerRoute.fallbackSteps.some((fallbackStep) => fallbackStep.model?.startsWith('hailuo'))) {
    asset.providerRoute.fallbackSteps
      .map((fallbackStep) => fallbackStep.model)
      .filter((model): model is ProviderModel => Boolean(model?.startsWith('hailuo')))
      .forEach((model) => {
        if (!plans.some((plan) => plan.providerModel === model && plan.targetProvider === 'hailuo')) {
          plans.push(buildHailuoPromptPlan(params, model))
        }
      })
  }

  if (asset.providerRoute.fallbackModels.includes('veo_3_1_lite') || asset.providerRoute.fallbackSteps.some((fallbackStep) => fallbackStep.model === 'veo_3_1_lite')) {
    plans.push(buildVeoFallbackPromptPlan(params))
  }

  if (shouldUseRemotionBrief(asset)) {
    plans.push(buildRemotionMotionBrief(params))
  }

  return plans
}

export function buildProviderPromptPlansForEditPlan(params: BuildEditPromptPlansParams): ProviderPromptPlan[] {
  const { characterConsistencyPlan, compiledIntent, documentaryFactSafetyPlan, input, professionalDirective, rendererCompositionPlan, segmentEditPlans, visualAssetPlan } = params

  return visualAssetPlan.flatMap((asset) => {
    const frameTemplate = resolveFrameTemplate(input, asset)
    const styleMode = getStyleMode(asset.styleModeId)
    const segment = segmentForAsset(segmentEditPlans, asset.id)

    return buildPromptPlansForAsset({
      asset,
      compiledIntent,
      characterConsistencyPlan,
      documentaryFactSafetyPlan,
      frameTemplate,
      input,
      professionalDirective,
      rendererCompositionPlan,
      segment,
      styleMode,
    }).filter((promptPlan) => promptPlan.tierAllowed)
  })
}
