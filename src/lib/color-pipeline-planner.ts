import type {
  AdaptiveEditStrategyPlan,
  AssetColorMatchPlan,
  ClipColorPlan,
  ColorGradeStyleId,
  ColorIntensity,
  ColorOperationId,
  ColorOperationPlan,
  ColorPipelinePlan,
  ColorPipelineStage,
  ColorPipelineStatus,
  ColorPipelineToolId,
  CompiledEditingIntent,
  PlannerInput,
  ProfessionalEditingDirective,
  ProviderModel,
  RendererCompositionPlan,
  ToolStrategyPlan,
  VideoUnderstandingReport,
  VisualAssetPlanItem,
  VisualQualityIssue,
} from '../types/reeditpro'
import {
  getColorGradePreset,
  getColorOperationsForGrade,
  getDefaultColorGradeForCategory,
} from './color-grade-presets'

type CreateColorPipelinePlanParams = {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  professionalDirective?: ProfessionalEditingDirective
  videoUnderstandingReport?: VideoUnderstandingReport
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  visualAssetPlan?: VisualAssetPlanItem[]
  rendererCompositionPlan?: RendererCompositionPlan
  toolStrategyPlan?: ToolStrategyPlan
}

const operationLabels: Record<ColorOperationId, string> = {
  ai_video_asset_match: 'AI video asset match',
  black_point: 'Black point',
  clarity: 'Clarity',
  contrast_curve: 'Contrast curve',
  display_transform: 'Display transform',
  exposure_correction: 'Exposure correction',
  generated_asset_match: 'Generated asset match',
  highlight_recovery: 'Highlight recovery',
  look_transform: 'Look transform',
  lut_application: 'LUT application',
  noise_reduction: 'Noise reduction',
  output_color_transform: 'Output color transform',
  panel_background_match: 'Panel background match',
  qa_background_match_check: 'QA background match check',
  qa_histogram_check: 'QA histogram check',
  qa_skin_tone_check: 'QA skin tone check',
  saturation: 'Saturation',
  shadow_control: 'Shadow control',
  sharpening: 'Sharpening',
  shot_matching: 'Shot matching',
  skin_tone_protection: 'Skin tone protection',
  temperature: 'Temperature',
  tint: 'Tint',
  vibrance: 'Vibrance',
  white_balance: 'White balance',
  white_point: 'White point',
}

function unique<T extends string>(values: T[]) {
  return Array.from(new Set(values))
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term))
}

function hasPeople(input: PlannerInput, report?: VideoUnderstandingReport) {
  const text = [
    input.customInstructions,
    ...input.clips.map((clip) => `${clip.fileName} ${clip.detectedType} ${clip.notes ?? ''} ${clip.sourceRole ?? ''}`),
    report?.visualUnderstanding.speakerFraming,
    ...(report?.visualUnderstanding.faceSafeZoneNotes ?? []),
    ...(report?.clips.flatMap((clip) => clip.faceOrSpeakerNotes) ?? []),
  ].filter(Boolean).join(' ').toLowerCase()

  return includesAny(text, ['speaker', 'face', 'person', 'people', 'couple', 'founder', 'talking', 'reaction'])
}

function chooseColorGradeStyle(params: CreateColorPipelinePlanParams): ColorGradeStyleId {
  const directiveStyle = params.professionalDirective?.colorGradeStyle ??
    params.compiledIntent?.professionalEditingDirective.colorGradeStyle ??
    params.input.professionalEditingDirective?.colorGradeStyle

  if (directiveStyle) {
    return directiveStyle
  }

  return getDefaultColorGradeForCategory({
    customInstructions: params.input.customInstructions,
    editLevel: params.input.editLevel,
    editingCategory: params.input.editingCategory,
    moodStyle: params.input.moodStyle,
    professionalDirective: params.professionalDirective ?? params.compiledIntent?.professionalEditingDirective,
  })
}

function chooseIntensity(style: ColorGradeStyleId, editLevel: PlannerInput['editLevel'], customInstructions: string): ColorIntensity {
  const text = customInstructions.toLowerCase()

  if (includesAny(text, ['very stylized', 'stylized grade', 'black and white', 'monochrome'])) {
    return editLevel === 'premium' ? 'stylized' : 'balanced'
  }

  if (editLevel === 'basic') return style === 'documentary_neutral' ? 'subtle' : 'balanced'
  if (editLevel === 'premium' && (style === 'cinematic_contrast' || style === 'moody_dramatic' || style === 'film_emulation_light')) return 'strong'

  return getColorGradePreset(style).intensityDefault === 'stylized' && editLevel !== 'premium'
    ? 'balanced'
    : getColorGradePreset(style).intensityDefault
}

function stagesForPlan(editLevel: PlannerInput['editLevel'], hasAssets: boolean, hasAiVideoAssets: boolean): ColorPipelineStage[] {
  const stages: ColorPipelineStage[] = ['source_analysis', 'basic_correction', 'shot_matching']

  if (editLevel !== 'basic') {
    stages.push('look_grade')
    if (hasAssets) stages.push('generated_asset_matching')
    if (hasAiVideoAssets) stages.push('ai_video_asset_matching')
  }

  if (editLevel === 'premium') {
    stages.push('output_transform')
  }

  stages.push('qa_check')
  return stages
}

function toolForOperation(operation: ColorOperationId, editLevel: PlannerInput['editLevel']): ColorPipelineToolId {
  if (operation.startsWith('qa_')) return operation === 'qa_background_match_check' ? 'opencv' : 'opencv'
  if (operation === 'generated_asset_match') return editLevel === 'premium' ? 'openimageio' : 'sharp'
  if (operation === 'ai_video_asset_match' || operation === 'panel_background_match') return 'sharp'
  if (operation === 'look_transform' || operation === 'display_transform') return editLevel === 'basic' ? 'ffmpeg' : 'opencolorio'
  if (operation === 'output_color_transform' || operation === 'lut_application') return editLevel === 'premium' ? 'opencolorio' : 'ffmpeg'
  return 'ffmpeg'
}

function statusForTool(toolId: ColorPipelineToolId): ColorPipelineStatus {
  return toolId === 'planning_only' || toolId === 'remotion_preview' ? 'planned' : 'future_worker'
}

function operationSettings(params: {
  operation: ColorOperationId
  colorGradeStyle: ColorGradeStyleId
  intensity: ColorIntensity
  matchPanelBackgroundColor?: string
  referenceClipId?: string
}) {
  const { colorGradeStyle, intensity, matchPanelBackgroundColor, operation, referenceClipId } = params
  const settings: Record<string, unknown> = {
    colorGradeStyle,
    lookIntensity: intensity,
  }

  if (operation === 'exposure_correction') settings.exposureCorrection = intensity === 'subtle' ? 'small balanced lift only if needed' : 'balanced correction with highlight protection'
  if (operation === 'white_balance') settings.whiteBalanceCorrection = 'neutralize unwanted cast while respecting intended warmth'
  if (operation === 'contrast_curve') settings.contrastAdjustment = intensity === 'strong' ? 'strong but protected curve' : 'natural contrast curve'
  if (operation === 'highlight_recovery') settings.highlightRecovery = 'protect faces, windows, product highlights, and white panels'
  if (operation === 'shadow_control') settings.shadowLift = colorGradeStyle === 'cinematic_contrast' || colorGradeStyle === 'moody_dramatic' ? 'shape shadows without crushing blacks' : 'natural shadow control'
  if (operation === 'skin_tone_protection') {
    settings.skinToneProtection = true
    settings.facePriority = true
  }
  if (operation === 'shot_matching') {
    settings.shotMatchingEnabled = true
    settings.referenceClipId = referenceClipId ?? 'first stable source clip'
    settings.toleranceLevel = intensity === 'strong' || intensity === 'stylized' ? 'medium' : 'low'
  }
  if (operation === 'generated_asset_match') {
    settings.generatedAssetColorMatch = true
    settings.matchSourceFootageGrade = true
    settings.matchPanelBackgroundColor = matchPanelBackgroundColor ?? 'planned panel background'
  }
  if (operation === 'ai_video_asset_match') {
    settings.aiVideoAssetColorMatch = true
    settings.avoidColorDrift = true
    settings.matchPanelBackgroundColor = matchPanelBackgroundColor ?? 'planned panel background'
  }
  if (operation === 'panel_background_match') {
    settings.matchPanelBackgroundColor = matchPanelBackgroundColor ?? 'planned panel background'
    settings.panelBackgroundTolerance = 'future QA tolerance'
  }
  if (operation === 'lut_application') {
    settings.lutName = `${colorGradeStyle}_placeholder_lut`
    settings.lutStrength = intensity === 'strong' ? 0.45 : 0.25
  }
  if (operation === 'look_transform' || operation === 'display_transform' || operation === 'output_color_transform') {
    settings.inputColorSpace = 'source_rec709_placeholder'
    settings.workingColorSpace = 'reeditpro_planned_working_space'
    settings.outputColorSpace = 'delivery_rec709_placeholder'
    settings.acesPipelineEnabled = colorGradeStyle !== 'clean_natural'
  }

  return settings
}

function createOperation(params: {
  idPrefix: string
  operation: ColorOperationId
  scope: ColorOperationPlan['scope']
  colorGradeStyle: ColorGradeStyleId
  intensity: ColorIntensity
  editLevel: PlannerInput['editLevel']
  reason: string
  matchPanelBackgroundColor?: string
  referenceClipId?: string
}): ColorOperationPlan {
  const toolId = toolForOperation(params.operation, params.editLevel)

  return {
    id: `${params.idPrefix}-${params.operation}`,
    operation: params.operation,
    label: operationLabels[params.operation],
    scope: params.scope,
    toolId,
    intensity: params.intensity,
    settings: operationSettings({
      colorGradeStyle: params.colorGradeStyle,
      intensity: params.intensity,
      matchPanelBackgroundColor: params.matchPanelBackgroundColor,
      operation: params.operation,
      referenceClipId: params.referenceClipId,
    }),
    reason: params.reason,
    status: statusForTool(toolId),
    qaChecks: [
      `${operationLabels[params.operation]} matches ${label(params.colorGradeStyle)} plan.`,
      'Planning only; no real color processing is executed in the frontend.',
    ],
    workerNotes: [
      toolId === 'remotion_preview' || toolId === 'planning_only'
        ? 'Preview/planning note only; no media processing runs.'
        : `${label(toolId)} is a future worker responsibility after approval.`,
      'Future workers must use the approved plan snapshot, not raw chat.',
    ],
  }
}

function projectOperations(params: {
  input: PlannerInput
  colorGradeStyle: ColorGradeStyleId
  intensity: ColorIntensity
  hasPeople: boolean
  hasMultipleClips: boolean
  panelBackgroundColor?: string
}) {
  const operations = getColorOperationsForGrade(params.colorGradeStyle, params.input.editLevel)
  const ids = unique<ColorOperationId>([
    ...operations.correctionOperations,
    ...(params.hasPeople ? ['skin_tone_protection' as ColorOperationId] : []),
    ...(params.hasMultipleClips ? ['shot_matching' as ColorOperationId] : []),
    ...operations.lookOperations,
    'qa_histogram_check',
    ...(params.hasPeople ? ['qa_skin_tone_check' as ColorOperationId] : []),
  ])

  return ids.map((operation) => createOperation({
    colorGradeStyle: params.colorGradeStyle,
    editLevel: params.input.editLevel,
    idPrefix: 'color-project',
    intensity: params.intensity,
    matchPanelBackgroundColor: params.panelBackgroundColor,
    operation,
    reason: operation.startsWith('qa_')
      ? 'Color QA must catch exposure, skin tone, and background mismatch before delivery.'
      : 'Project-level color plan keeps the edit professional and consistent.',
    scope: 'full_project',
  }))
}

function clipQualityIssues(clipId: string, report?: VideoUnderstandingReport): VisualQualityIssue[] {
  const clip = report?.clips.find((item) => item.clipId === clipId)
  const issues = clip?.visualQualityIssues.filter((issue) => issue !== 'none') ?? []
  const globalIssues = report?.visualUnderstanding.colorLightingIssues.filter((issue) => issue !== 'none') ?? []

  return unique([...issues, ...globalIssues])
}

function clipPlans(params: {
  input: PlannerInput
  report?: VideoUnderstandingReport
  colorGradeStyle: ColorGradeStyleId
  intensity: ColorIntensity
  peopleVisible: boolean
}) {
  const referenceClipId = params.input.clips.find((clip) => !clip.isOptional)?.id ?? params.input.clips[0]?.id
  const hasMultipleClips = params.input.clips.length > 1
  const operations = getColorOperationsForGrade(params.colorGradeStyle, params.input.editLevel)

  return params.input.clips.map((clip): ClipColorPlan => {
    const qualityIssues = clipQualityIssues(clip.id, params.report)
    const clipText = `${clip.fileName} ${clip.detectedType} ${clip.notes ?? ''} ${clip.sourceRole ?? ''}`.toLowerCase()
    const skinToneProtection = params.peopleVisible || includesAny(clipText, ['speaker', 'face', 'person', 'people', 'talking'])
    const correctionOperations = unique<ColorOperationId>([
      ...operations.correctionOperations,
      ...(qualityIssues.includes('low_light') || qualityIssues.includes('underexposed') ? ['shadow_control' as ColorOperationId] : []),
      ...(qualityIssues.includes('overexposed') ? ['highlight_recovery' as ColorOperationId] : []),
      ...(qualityIssues.includes('blurry') ? ['sharpening' as ColorOperationId] : []),
      ...(skinToneProtection ? ['skin_tone_protection' as ColorOperationId] : []),
      ...(hasMultipleClips ? ['shot_matching' as ColorOperationId] : []),
    ]).map((operation) => createOperation({
      colorGradeStyle: params.colorGradeStyle,
      editLevel: params.input.editLevel,
      idPrefix: `color-clip-${clip.id}`,
      intensity: params.intensity,
      operation,
      reason: `Clip ${clip.uploadedOrder} receives professional correction and shot matching without real media processing in this mock.`,
      referenceClipId: referenceClipId === clip.id ? undefined : referenceClipId,
      scope: 'clip',
    }))
    const lookOperations = (params.input.editLevel === 'basic' ? [] : operations.lookOperations).map((operation) => createOperation({
      colorGradeStyle: params.colorGradeStyle,
      editLevel: params.input.editLevel,
      idPrefix: `color-clip-${clip.id}`,
      intensity: params.intensity,
      operation,
      reason: `${label(params.colorGradeStyle)} look planning for this clip stays deterministic and tier-aware.`,
      scope: 'clip',
    }))

    return {
      id: `clip-color-${clip.id}`,
      clipId: clip.id,
      clipLabel: clip.previewLabel ?? clip.fileName,
      colorGradeStyle: params.colorGradeStyle,
      correctionOperations,
      lookOperations,
      shotMatchingNotes: hasMultipleClips
        ? [
            `Match exposure, white balance, contrast, saturation, and skin/background tone against ${referenceClipId ?? 'the most stable source clip'}.`,
            'Basic uses simple shot matching; Pro/Premium can plan stronger scene matching.',
          ]
        : ['Single-clip edit: keep correction consistent through the clip.'],
      qualityIssues,
      skinToneProtection,
      referenceClipId: hasMultipleClips && referenceClipId !== clip.id ? referenceClipId : undefined,
      qaChecks: [
        'Clip exposure and white balance are not too dark, bright, warm, or cool unless intended.',
        skinToneProtection ? 'Skin tone protection is planned.' : 'No speaker/person skin priority inferred for this clip.',
        qualityIssues.length ? `Mock quality issues to review: ${qualityIssues.map(label).join(', ')}.` : 'No mock visual quality issues beyond normal QA.',
      ],
    }
  })
}

function isAiVideoAsset(asset: VisualAssetPlanItem) {
  const routeModels = [
    asset.providerRoute.primaryModel,
    ...asset.providerRoute.fallbackModels,
    ...asset.providerRoute.fallbackSteps.map((step) => step.model).filter((model): model is ProviderModel => Boolean(model)),
  ]

  return asset.assetType === 'animated_scene' ||
    asset.assetType === 'real_motion_scene' ||
    asset.signatureSystem === 'real_motion' ||
    routeModels.some((model) => model.startsWith('wan') || model.startsWith('hailuo') || model === 'veo_3_1_lite')
}

function assetMatchPlans(params: {
  input: PlannerInput
  visualAssetPlan?: VisualAssetPlanItem[]
  colorGradeStyle: ColorGradeStyleId
  intensity: ColorIntensity
  panelBackgroundColor?: string
}) {
  return (params.visualAssetPlan ?? [])
    .filter((asset) => asset.assetType !== 'transition_scene')
    .map((asset): AssetColorMatchPlan => {
      const aiVideoAsset = isAiVideoAsset(asset)
      const operations: ColorOperationId[] = [
        aiVideoAsset ? 'ai_video_asset_match' : 'generated_asset_match',
        'panel_background_match',
        'qa_background_match_check',
      ]

      return {
        id: `asset-color-match-${asset.id}`,
        assetPlanItemId: asset.id,
        providerModel: asset.providerRoute.primaryModel,
        assetLabel: asset.beatLabel,
        assetType: asset.assetType,
        matchToColorGrade: params.colorGradeStyle,
        matchPanelBackgroundColor: params.panelBackgroundColor,
        matchSourceClipIds: params.input.clips.map((clip) => clip.id).slice(0, 3),
        operations: operations.map((operation) => createOperation({
          colorGradeStyle: params.colorGradeStyle,
          editLevel: params.input.editLevel,
          idPrefix: `color-asset-${asset.id}`,
          intensity: params.intensity,
          matchPanelBackgroundColor: params.panelBackgroundColor,
          operation,
          reason: aiVideoAsset
            ? 'AI video clips must match the planned grade and panel background before Remotion composition.'
            : 'Generated stills/cards/keyframes must match the planned grade and source footage.',
          scope: aiVideoAsset ? 'ai_video_asset' : 'visual_asset',
        })),
        qaChecks: [
          `${aiVideoAsset ? 'AI video' : 'Generated asset'} color matches ${label(params.colorGradeStyle)}.`,
          'Panel background match is planned; transparent AI-video background is not the default.',
          'No real color QA is executed in this frontend mock.',
        ],
        notes: [
          aiVideoAsset
            ? 'Wan/Hailuo/Veo assets remain provider clips only; Remotion composes them into the final layout.'
            : 'GPT-Image-2/editor-motion assets should be designed to match the planned edit look.',
          params.input.editLevel === 'premium'
            ? 'Premium plans deeper asset harmonization and QA.'
            : 'Basic/Pro use professional but lower-compute color matching.',
        ],
      }
    })
}

function toolsPlanned(params: {
  editLevel: PlannerInput['editLevel']
  colorGradeStyle: ColorGradeStyleId
  hasAssetPlans: boolean
  hasQualityIssues: boolean
}): ColorPipelineToolId[] {
  return unique([
    'planning_only',
    'ffmpeg',
    'remotion_preview',
    params.editLevel !== 'basic' ? 'opencolorio' : undefined,
    params.editLevel === 'premium' && params.hasAssetPlans ? 'openimageio' : undefined,
    params.hasAssetPlans || params.hasQualityIssues ? 'opencv' : undefined,
    params.hasAssetPlans || params.hasQualityIssues ? 'sharp' : undefined,
  ].filter(Boolean) as ColorPipelineToolId[])
}

export function createColorPipelinePlan(params: CreateColorPipelinePlanParams): ColorPipelinePlan {
  const colorGradeStyle = chooseColorGradeStyle(params)
  const intensity = chooseIntensity(colorGradeStyle, params.input.editLevel, params.input.customInstructions)
  const peopleVisible = hasPeople(params.input, params.videoUnderstandingReport)
  const panelBackgroundColor = params.rendererCompositionPlan?.panelBackgroundColor ?? '#f8fafc'
  const visualAssets = params.visualAssetPlan ?? []
  const hasAiVideoAssets = visualAssets.some(isAiVideoAsset)
  const hasQualityIssues = Boolean(params.videoUnderstandingReport?.visualUnderstanding.colorLightingIssues.some((issue) => issue !== 'none')) ||
    params.input.clips.some((clip) => clipQualityIssues(clip.id, params.videoUnderstandingReport).length > 0)
  const clipColorPlans = clipPlans({
    colorGradeStyle,
    input: params.input,
    intensity,
    peopleVisible,
    report: params.videoUnderstandingReport,
  })
  const assetPlans = assetMatchPlans({
    colorGradeStyle,
    input: params.input,
    intensity,
    panelBackgroundColor,
    visualAssetPlan: visualAssets,
  })
  const projectOps = projectOperations({
    colorGradeStyle,
    hasMultipleClips: params.input.clips.length > 1,
    hasPeople: peopleVisible,
    input: params.input,
    intensity,
    panelBackgroundColor,
  })
  const preset = getColorGradePreset(colorGradeStyle)

  return {
    id: `color-pipeline-${params.input.editingCategory}-${params.input.editLevel}`,
    summary: `${label(colorGradeStyle)} color pipeline planned with ${clipColorPlans.length} clip plan${clipColorPlans.length === 1 ? '' : 's'} and ${assetPlans.length} asset match plan${assetPlans.length === 1 ? '' : 's'}; no real color processing runs in this frontend mock.`,
    colorGradeStyle,
    intensity,
    stages: stagesForPlan(params.input.editLevel, assetPlans.length > 0, hasAiVideoAssets),
    toolsPlanned: toolsPlanned({
      colorGradeStyle,
      editLevel: params.input.editLevel,
      hasAssetPlans: assetPlans.length > 0,
      hasQualityIssues,
    }),
    projectOperations: projectOps,
    clipPlans: clipColorPlans,
    assetMatchPlans: assetPlans,
    tierNotes: [
      params.input.editLevel === 'basic'
        ? 'Basic includes professional clean correction, skin tone protection, and basic shot matching as baseline.'
        : params.input.editLevel === 'pro'
          ? 'Pro adds style-specific grading, generated asset matching, and stronger QA; no Veo.'
          : 'Premium adds scene-by-scene color planning, stronger asset harmonization, and deeper QA; Veo remains generation fallback only, not color.',
      'Color planning does not enable provider generation or bypass approval.',
    ],
    generatedAssetRules: preset.generatedAssetRules,
    qaChecks: [
      ...preset.qaChecks,
      'Basic must not be ungraded or low quality.',
      peopleVisible ? 'Skin tone protection planned where people/speakers are visible.' : 'No speaker/person skin priority inferred, but normal exposure/white balance QA remains.',
      params.input.clips.length > 1 ? 'Shot matching planned across source clips.' : 'Single-clip consistency planned.',
      assetPlans.length ? 'Generated assets and AI video panels have color match plans.' : 'No generated visual assets need color matching yet.',
      'Color pipeline stays deterministic and planning-only.',
    ],
    limitations: [
      'Mock-only color pipeline plan.',
      'No real media, color, histogram, skin tone, or lighting analysis has run.',
      'No FFmpeg, OpenColorIO, OpenImageIO, OpenCV, Sharp, Remotion rendering, backend worker, or provider call is executed.',
      'Future workers must execute only approved plan snapshots after plan and credit approval.',
    ],
    status: 'planned',
  }
}
