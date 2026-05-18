import type { ApprovedPlanSnapshot } from '../types/edit-planning-db'
import type {
  AspectRatio,
  EditLevel,
  EditPlan,
  FallbackStep,
  PlannerInput,
  ProviderModel,
  ProviderPromptPlan,
  SpeakerVisualLayoutPlanItem,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import { getDemoScenarioById } from './demo-scenarios'
import { getSpeakerVisualLayoutMode } from './speaker-visual-layouts'
import { getToolRegistrySummary, openSourceToolProfiles } from './tool-registry'

export type PlanValidationSeverity = 'info' | 'warning' | 'error' | 'blocking'

export type PlanValidationStatus = 'passed' | 'warning' | 'failed'

export type PlanValidationCategory =
  | 'model_routing'
  | 'tier_policy'
  | 'resolution_policy'
  | 'frame_background'
  | 'approval_gate'
  | 'credit_estimate'
  | 'compiled_intent'
  | 'video_understanding'
  | 'adaptive_strategy'
  | 'tool_registry'
  | 'render_strategy'
  | 'tool_strategy'
  | 'color_pipeline'
  | 'audio_pipeline'
  | 'map_animation'
  | 'dataviz_plan'
  | 'source_sequence'
  | 'professional_editing'
  | 'visual_asset_plan'
  | 'speaker_visual_layout'
  | 'depth_aware_overlay'
  | 'renderer_plan'
  | 'segment_operations'
  | 'qa_plan'
  | 'prompt_plans'
  | 'character_consistency'
  | 'fact_safety'
  | 'demo_scenario'
  | 'approved_snapshot'

export interface PlanValidationCheck {
  id: string
  category: PlanValidationCategory
  label: string
  severity: PlanValidationSeverity
  passed: boolean
  message: string
  relatedField?: string
  recommendation?: string
}

export interface PlanValidationReport {
  id: string
  status: PlanValidationStatus
  summary: string
  checks: PlanValidationCheck[]
  blockingCount: number
  errorCount: number
  warningCount: number
  passedCount: number
}

export interface ScenarioValidationReport {
  scenarioId: string
  scenarioLabel: string
  editLevel: EditLevel
  editingCategory: PlannerInput['editingCategory']
  report: PlanValidationReport
}

export interface PlannerRegressionReport {
  id: string
  status: PlanValidationStatus
  summary: string
  scenarioReports: ScenarioValidationReport[]
  globalChecks: PlanValidationCheck[]
  blockingCount: number
  errorCount: number
  warningCount: number
  passedCount: number
}

const videoPromptTypes: ProviderPromptPlan['planType'][] = [
  'stroke_motion_video_prompt',
  'real_motion_video_prompt',
  'veo_fallback_prompt',
]

const neutralFactTreatments = [
  'neutral_name_card',
  'evidence_board_card',
  'timeline_card',
  'document_card',
  'money_trail_graphic',
  'source_attribution_card',
  'generic_silhouette',
  'stylized_non_realistic_figure',
  'no_visual',
  'needs_user_confirmation',
]

function providerUsesVeo(model: ProviderModel | undefined) {
  return model === 'veo_3_1_lite'
}

function modelIsWan(model: ProviderModel | undefined) {
  return Boolean(model?.startsWith('wan'))
}

function modelIsHailuo(model: ProviderModel | undefined) {
  return Boolean(model?.startsWith('hailuo'))
}

function providerRouteModels(asset: VisualAssetPlanItem) {
  return [
    asset.providerRoute.primaryModel,
    ...asset.providerRoute.fallbackModels,
    ...asset.providerRoute.fallbackSteps.map((step) => step.model).filter(Boolean),
  ]
}

function fallbackSteps(plan: EditPlan) {
  const routeSteps = (plan.visualAssetPlan ?? []).flatMap((asset) => asset.providerRoute.fallbackSteps)
  const qaSteps = plan.editQAPlan
    ? [
        ...plan.editQAPlan.globalChecks,
        ...plan.editQAPlan.segmentChecks,
        ...plan.editQAPlan.tierPolicyChecks,
        ...plan.editQAPlan.approvalChecks,
      ].flatMap((check) => check.fallbackActions)
    : []

  return [...routeSteps, ...qaSteps]
}

function routeHasVeo(asset: VisualAssetPlanItem) {
  return providerUsesVeo(asset.providerRoute.primaryModel) ||
    asset.providerRoute.fallbackModels.some(providerUsesVeo) ||
    asset.providerRoute.fallbackSteps.some((step) => providerUsesVeo(step.model))
}

function routeHasPrimaryVeo(asset: VisualAssetPlanItem) {
  return providerUsesVeo(asset.providerRoute.primaryModel)
}

function fallbackStepUsesVeo(step: FallbackStep) {
  return providerUsesVeo(step.model)
}

function allowedVeoPrompt(promptPlan: ProviderPromptPlan) {
  return promptPlan.tierAllowed && providerUsesVeo(promptPlan.providerModel)
}

function checkExists<T>(value: T | undefined | null, lengthAware = false) {
  if (Array.isArray(value)) {
    return lengthAware ? value.length > 0 : true
  }

  return Boolean(value)
}

function planText(plan: EditPlan) {
  return JSON.stringify(plan).toLowerCase()
}

function videoUnderstandingExists(plan: EditPlan) {
  return Boolean(plan.videoUnderstandingReport)
}

function videoUnderstandingLimitationsAreMockOnly(plan: EditPlan) {
  const text = (plan.videoUnderstandingReport?.limitations ?? []).join(' ').toLowerCase()
  return text.includes('mock-only') && text.includes('no real media analysis')
}

function visualPlanAlignsWithUnderstanding(plan: EditPlan) {
  const report = plan.videoUnderstandingReport
  if (!report || report.visualSupportOpportunities.length === 0) {
    return false
  }

  const assetText = (plan.visualAssetPlan ?? [])
    .map((asset) => `${asset.beatLabel} ${asset.storyPurpose} ${asset.assetType} ${asset.signatureSystem} ${asset.reason}`)
    .join(' ')
    .toLowerCase()

  return report.visualSupportOpportunities.some((opportunity) => {
    const typeText = opportunity.opportunityType.replaceAll('_', ' ')
    return assetText.includes(opportunity.opportunityType) ||
      assetText.includes(typeText) ||
      assetText.includes(opportunity.label.toLowerCase())
  })
}

function layoutPlanAlignsWithUnderstanding(plan: EditPlan) {
  const report = plan.videoUnderstandingReport
  if (!report || report.visualSupportOpportunities.length === 0) {
    return false
  }

  const layoutText = (plan.speakerVisualLayoutPlan?.items ?? [])
    .map((item) => `${item.layoutMode} ${item.reason} ${item.promptImplications.join(' ')}`)
    .join(' ')
    .toLowerCase()

  return report.visualSupportOpportunities.some((opportunity) => {
    const typeText = opportunity.opportunityType.replaceAll('_', ' ')
    return layoutText.includes(opportunity.opportunityType) ||
      layoutText.includes(typeText) ||
      layoutText.includes(opportunity.label.toLowerCase())
  })
}

function sourceOrderReflectedInUnderstanding(plan: EditPlan, input: PlannerInput) {
  if (!plan.videoUnderstandingReport) {
    return false
  }

  const confirmed = input.sourceOrderConfirmed ?? plan.sourceSequenceReview?.confirmed ?? false
  return plan.videoUnderstandingReport.sourceOrderConfirmed === confirmed
}

function adaptiveStrategyPlanExists(plan: EditPlan) {
  return Boolean(plan.adaptiveEditStrategyPlan?.segmentStrategies.length)
}

function adaptiveStrategiesHaveReasons(plan: EditPlan) {
  const strategies = plan.adaptiveEditStrategyPlan?.segmentStrategies ?? []
  return strategies.length > 0 && strategies.every((strategy) => strategy.decisionKind && strategy.recommendedVisualSupport && strategy.generationRestraint && strategy.reasons.length > 0)
}

function exactStrategiesPreferControlledTools(plan: EditPlan) {
  const exactStrategies = (plan.adaptiveEditStrategyPlan?.segmentStrategies ?? []).filter((strategy) =>
    strategy.decisionKind === 'use_map' ||
    strategy.decisionKind === 'use_chart_or_diagram' ||
    strategy.decisionKind === 'use_screen_capture',
  )

  return exactStrategies.every((strategy) =>
    strategy.generationRestraint === 'avoid_generation' &&
    strategy.recommendedToolHints.some((hint) => hint === 'map_tool' || hint === 'chart_tool' || hint === 'browser_capture_tool' || hint === 'remotion_layout'),
  )
}

function adaptiveGenerationHasReason(plan: EditPlan) {
  const strategies = plan.adaptiveEditStrategyPlan?.segmentStrategies ?? []
  const generationStrategies = strategies.filter((strategy) =>
    strategy.generationRestraint === 'allow_generation' ||
    strategy.generationRestraint === 'prefer_generation' ||
    strategy.generationRestraint === 'premium_fallback_only',
  )

  return generationStrategies.every((strategy) =>
    strategy.reasons.length > 0 &&
    strategy.qaChecks.length > 0 &&
    (strategy.recommendedSignatureSystem === 'stroke_motion' || strategy.recommendedSignatureSystem === 'real_motion'),
  )
}

function basicStrategyUsesLimitedGeneration(plan: EditPlan, editLevel: EditLevel) {
  if (editLevel !== 'basic') {
    return true
  }

  const generationStrategies = (plan.adaptiveEditStrategyPlan?.segmentStrategies ?? []).filter((strategy) =>
    strategy.generationRestraint === 'allow_generation' ||
    strategy.generationRestraint === 'prefer_generation' ||
    strategy.costComplexity === 'premium',
  )

  return generationStrategies.length === 0
}

function adaptiveStrategyHasTierAndModelNotes(plan: EditPlan) {
  return Boolean(
    plan.adaptiveEditStrategyPlan?.tierConstraints.length &&
    plan.adaptiveEditStrategyPlan.modelPolicyNotes.length,
  )
}

function toolRegistrySummaryExists(plan: EditPlan) {
  return Boolean(plan.toolRegistrySummary)
}

function toolRegistryHasLaunchCoreCoverage(plan: EditPlan) {
  return (plan.toolRegistrySummary?.launchCoreToolCount ?? 0) >= 8
}

function toolRegistryCountsLicenseReview(plan: EditPlan) {
  return (plan.toolRegistrySummary?.needsLicenseReviewCount ?? 0) >= 1
}

function toolRegistryProviderModelsAreSeparate() {
  const providerIds = ['gpt_image_2', 'wan', 'wan_2_2', 'hailuo', 'veo', 'veo_3_1_lite']
  const toolIds = openSourceToolProfiles.map((tool) => tool.id as string)

  return providerIds.every((providerId) => !toolIds.includes(providerId))
}

function toolRegistryIsPlanningOnly() {
  return openSourceToolProfiles.every((tool) => {
    const text = [...tool.productionNotes, ...tool.qaChecks].join(' ').toLowerCase()
    return text.includes('planning only') && text.includes('not installed') && text.includes('not executed')
  })
}

function toolRegistryDoesNotEnableVeo(plan: EditPlan) {
  const ids = openSourceToolProfiles.map((tool) => tool.id).join(' ')
  const notes = (plan.toolRegistrySummary?.notes ?? getToolRegistrySummary().notes).join(' ').toLowerCase()

  return !ids.includes('veo') && notes.includes('does not enable veo')
}

function toolRegistryKeepsApprovalGate(plan: EditPlan) {
  const notes = (plan.toolRegistrySummary?.notes ?? []).join(' ').toLowerCase()
  return notes.includes('approval') && !notes.includes('bypass approval')
}

function toolRegistryHintsStayDetailedWhenNeeded(plan: EditPlan) {
  const controlledStrategies = (plan.adaptiveEditStrategyPlan?.segmentStrategies ?? []).filter((strategy) =>
    strategy.recommendedToolHints.some((hint) =>
      hint === 'map_tool' ||
      hint === 'chart_tool' ||
      hint === 'browser_capture_tool' ||
      hint === 'color_pipeline' ||
      hint === 'audio_pipeline' ||
      hint === 'qa_vision_tool' ||
      hint === 'remotion_layout',
    ),
  )

  return controlledStrategies.length === 0 || controlledStrategies.every((strategy) => Boolean(strategy.toolStrategyHintsDetailed?.length))
}

function renderStrategyPlanExists(plan: EditPlan) {
  return Boolean(plan.renderStrategyPlan?.items.length)
}

function renderStrategyCoversVisualAssets(plan: EditPlan) {
  const assets = plan.visualAssetPlan ?? []
  const items = plan.renderStrategyPlan?.items ?? []

  return assets.length > 0 && assets.every((asset) =>
    Boolean(asset.renderStrategyItemId) ||
    items.some((item) => item.assetPlanItemId === asset.id),
  )
}

function renderStrategyHasFallbackForComplexItems(plan: EditPlan) {
  const items = plan.renderStrategyPlan?.items ?? []
  const complexItems = items.filter((item) => item.complexity === 'advanced' || item.complexity === 'premium')

  return complexItems.every((item) => Boolean(item.fallbackStrategyType && item.fallbackReason))
}

function renderStrategyDoesNotUsePrimaryOrInvalidVeo(plan: EditPlan, editLevel: EditLevel) {
  const items = plan.renderStrategyPlan?.items ?? []
  return items.every((item) => {
    if (!item.selectedProviderModels.includes('veo_3_1_lite')) {
      return true
    }

    const text = `${item.reason} ${item.fallbackReason ?? ''} ${item.workerNotes.join(' ')} ${plan.renderStrategyPlan?.globalRules.join(' ') ?? ''}`.toLowerCase()
    return editLevel === 'premium' && text.includes('final fallback') && !text.includes('primary veo')
  })
}

function renderStrategyBasicProExcludeVeo(plan: EditPlan, editLevel: EditLevel) {
  if (editLevel === 'premium') {
    return true
  }

  return !(plan.renderStrategyPlan?.items ?? []).some((item) => item.selectedProviderModels.includes('veo_3_1_lite'))
}

function renderStrategyOwnsComposition(plan: EditPlan) {
  const items = plan.renderStrategyPlan?.items ?? []
  return items.length > 0 && items.every((item) =>
    item.strategyType === 'none' ||
    item.strategyType === 'qa_tool_only' ||
    item.remotionOwnsFinalComposition === true,
  )
}

function exactRenderStrategiesAvoidAiVideo(plan: EditPlan) {
  const exactItems = (plan.renderStrategyPlan?.items ?? []).filter((item) =>
    item.selectedRemotionCapabilities.some((capability) =>
      capability === 'map_layer_placement' ||
      capability === 'chart_layer_placement' ||
      capability === 'screen_capture_placement' ||
      capability === 'caption_layer' ||
      capability === 'name_card' ||
      capability === 'fact_card' ||
      capability === 'timeline_card',
    ),
  )

  return exactItems.every((item) =>
    item.strategyType !== 'ai_video_then_remotion' &&
    item.strategyType !== 'hybrid_generation_then_remotion',
  )
}

function renderStrategyToolProviderSeparation(plan: EditPlan) {
  const toolIds = openSourceToolProfiles.map((tool) => tool.id as string)
  const items = plan.renderStrategyPlan?.items ?? []

  return items.every((item) =>
    item.selectedOpenSourceTools.every((toolId) => !['gpt_image_2', 'wan', 'hailuo', 'veo', 'veo_3_1_lite'].includes(toolId)) &&
    item.selectedProviderModels.every((model) => !toolIds.includes(model)),
  )
}

function renderStrategyIsPlanningOnly(plan: EditPlan) {
  const text = [
    ...(plan.renderStrategyPlan?.globalRules ?? []),
    ...(plan.renderStrategyPlan?.notes ?? []),
    ...(plan.renderStrategyPlan?.items ?? []).flatMap((item) => item.workerNotes),
  ].join(' ').toLowerCase()

  return text.includes('mock') &&
    text.includes('no') &&
    text.includes('tool') &&
    text.includes('execution') &&
    !text.includes('installed and executed')
}

function rendererReferencesRenderStrategy(plan: EditPlan) {
  const text = (plan.rendererCompositionPlan?.rendererNotes ?? []).join(' ').toLowerCase()
  return text.includes('render strategy')
}

function promptPlansIncludeRenderStrategy(promptPlans: ProviderPromptPlan[], plan: EditPlan) {
  if (!plan.renderStrategyPlan?.items.length || promptPlans.length === 0) {
    return true
  }

  return promptPlans.some((promptPlan) => promptText(promptPlan).includes('render strategy'))
}

function promptPlansIncludeToolStrategy(promptPlans: ProviderPromptPlan[], plan: EditPlan) {
  if (!plan.toolStrategyPlan?.items.length || promptPlans.length === 0) {
    return true
  }

  return promptPlans.some((promptPlan) => promptText(promptPlan).includes('tool strategy'))
}

function renderStrategyHasNo1080pSettings(plan: EditPlan) {
  return !(plan.renderStrategyPlan?.items ?? []).some((item) =>
    JSON.stringify(item.settings).toLowerCase().includes('1080p'),
  )
}

function toolStrategyPlanExists(plan: EditPlan) {
  return Boolean(plan.toolStrategyPlan?.items.length)
}

function toolStrategyRequiredByRenderPlan(plan: EditPlan) {
  const renderItems = plan.renderStrategyPlan?.items ?? []
  return renderItems.some((item) =>
    item.strategyType === 'remotion_only' ||
    item.strategyType === 'open_source_tool_then_remotion' ||
    item.strategyType === 'worker_preprocess_then_remotion' ||
    item.strategyType === 'remotion_then_worker_postprocess' ||
    item.strategyType === 'qa_tool_only',
  )
}

function toolStrategyCoversToolRenderItems(plan: EditPlan) {
  if (!toolStrategyRequiredByRenderPlan(plan)) {
    return true
  }

  const items = plan.toolStrategyPlan?.items ?? []
  return items.length > 0
}

function toolStrategyItemsHavePrimaryAndSteps(plan: EditPlan) {
  const items = plan.toolStrategyPlan?.items ?? []
  return items.length > 0 && items.every((item) => Boolean(item.primaryToolId) && item.steps.length > 0)
}

function toolStrategyStepsHaveSettings(plan: EditPlan) {
  const items = plan.toolStrategyPlan?.items ?? []
  return items.length > 0 && items.every((item) => item.steps.every((step) => step.settings.length > 0))
}

function toolStrategyProviderModelsAreSeparate(plan: EditPlan) {
  const providerIds = ['gpt_image_2', 'wan_2_2_kf2v_flash', 'wan_2_6_i2v_flash', 'hailuo_2_3_fast', 'hailuo_02', 'veo_3_1_lite', 'wan', 'hailuo', 'veo']
  return (plan.toolStrategyPlan?.items ?? []).every((item) =>
    item.selectedToolIds.every((toolId) => !providerIds.includes(toolId as string)) &&
    item.steps.every((step) => !providerIds.includes(step.toolId as string)),
  )
}

function toolStrategyBasicProNoVeo(plan: EditPlan, editLevel: EditLevel) {
  if (editLevel === 'premium') {
    return true
  }

  const text = JSON.stringify(plan.toolStrategyPlan ?? {}).toLowerCase()
  return !text.includes('veo_3_1_lite') && !text.includes('premium rescue')
}

function toolStrategyPremiumVeoFallbackOnly(plan: EditPlan, editLevel: EditLevel) {
  if (editLevel !== 'premium') {
    return true
  }

  const text = JSON.stringify(plan.toolStrategyPlan ?? {}).toLowerCase()
  return !text.includes('veo_3_1_lite') || (text.includes('final fallback') && !text.includes('primary/default'))
}

function toolStrategyIsPlanningOnly(plan: EditPlan) {
  const text = [
    ...(plan.toolStrategyPlan?.globalRules ?? []),
    ...(plan.toolStrategyPlan?.notes ?? []),
    ...(plan.toolStrategyPlan?.items ?? []).flatMap((item) => [
      item.reason,
      ...item.developerNotes,
      ...item.steps.flatMap((step) => step.workerNotes),
    ]),
  ].join(' ').toLowerCase()

  return text.includes('planning') &&
    text.includes('no package') &&
    (text.includes('no tool') || text.includes('not execute') || text.includes('not executed')) &&
    !text.includes('tool was executed')
}

function toolStrategyLicenseReviewFlagged(plan: EditPlan) {
  const reviewTools = plan.toolStrategyPlan?.toolsNeedingLicenseReview ?? []
  return reviewTools.length === 0 || (plan.toolStrategyPlan?.items ?? []).some((item) =>
    item.status === 'needs_license_review' || item.licenseNotes.length > 0,
  )
}

function exactToolStrategyAvoidsAiVideo(plan: EditPlan) {
  return (plan.toolStrategyPlan?.items ?? []).every((item) => {
    if (item.chainId !== 'map_route_chain' && item.chainId !== 'chart_diagram_chain' && item.chainId !== 'browser_capture_chain') {
      return true
    }

    return Boolean(item.whyNotAiVideo) &&
      item.primaryToolId !== 'remotion'
  })
}

function toolStrategyDoesNotBypassApproval(plan: EditPlan) {
  const text = [
    ...(plan.toolStrategyPlan?.globalRules ?? []),
    ...(plan.toolStrategyPlan?.notes ?? []),
    ...(plan.toolStrategyPlan?.items ?? []).flatMap((item) => item.developerNotes),
  ].join(' ').toLowerCase()

  return text.includes('approval') && !text.includes('bypass approval')
}

function colorPipelinePlanExists(plan: EditPlan) {
  return Boolean(plan.colorPipelinePlan)
}

function colorPipelineHasBasicCorrection(plan: EditPlan) {
  const operations = plan.colorPipelinePlan?.projectOperations.map((operation) => operation.operation) ?? []
  return operations.includes('exposure_correction') &&
    operations.includes('white_balance') &&
    operations.includes('contrast_curve')
}

function colorPipelineHasClipPlans(plan: EditPlan) {
  return Boolean(plan.colorPipelinePlan?.clipPlans.length)
}

function colorPipelineHasStyleSpecificNotes(plan: EditPlan, editLevel: EditLevel) {
  if (editLevel === 'basic') {
    return true
  }

  const text = [
    plan.colorPipelinePlan?.summary,
    ...(plan.colorPipelinePlan?.tierNotes ?? []),
    ...(plan.colorPipelinePlan?.generatedAssetRules ?? []),
    ...(plan.colorPipelinePlan?.projectOperations.map((operation) => operation.reason) ?? []),
  ].join(' ').toLowerCase()

  return Boolean(plan.colorPipelinePlan?.colorGradeStyle) &&
    (text.includes('style') || text.includes('grade') || text.includes('asset'))
}

function colorPipelineHasAssetMatchesWhenNeeded(plan: EditPlan) {
  const assets = plan.visualAssetPlan ?? []
  const assetsNeedingMatch = assets.filter((asset) =>
    asset.providerRoute.primaryModel !== 'none' ||
    asset.providerRoute.fallbackModels.length > 0 ||
    asset.providerRoute.fallbackSteps.length > 0,
  )

  return assetsNeedingMatch.length === 0 ||
    assetsNeedingMatch.every((asset) =>
      Boolean(asset.colorMatchPlanId) ||
      Boolean(plan.colorPipelinePlan?.assetMatchPlans.some((matchPlan) => matchPlan.assetPlanItemId === asset.id)),
    )
}

function colorPipelineToolsArePlanningOnly(plan: EditPlan) {
  const text = [
    ...(plan.colorPipelinePlan?.limitations ?? []),
    ...(plan.colorPipelinePlan?.projectOperations.flatMap((operation) => operation.workerNotes) ?? []),
    ...(plan.colorPipelinePlan?.clipPlans.flatMap((clipPlan) => [
      ...clipPlan.correctionOperations.flatMap((operation) => operation.workerNotes),
      ...clipPlan.lookOperations.flatMap((operation) => operation.workerNotes),
    ]) ?? []),
  ].join(' ').toLowerCase()

  return text.includes('mock') &&
    text.includes('no real') &&
    (text.includes('future worker') || text.includes('planning'))
}

function colorPipelineDoesNotEnableVeoOr1080(plan: EditPlan) {
  const text = JSON.stringify(plan.colorPipelinePlan ?? {}).toLowerCase()
  const mentionsVeo = text.includes('veo')
  const keepsVeoRestricted =
    text.includes('no veo') ||
    text.includes('not color') ||
    text.includes('does not enable') ||
    text.includes('fallback only')

  return !text.includes('1080p') && (!mentionsVeo || keepsVeoRestricted)
}

function colorPipelineDoesNotTreatRemotionAsGrader(plan: EditPlan) {
  const tools = plan.colorPipelinePlan?.toolsPlanned ?? []
  const text = [
    plan.colorPipelinePlan?.summary,
    ...(plan.colorPipelinePlan?.limitations ?? []),
  ].join(' ').toLowerCase()

  return tools.includes('remotion_preview') &&
    (tools.includes('ffmpeg') || text.includes('ffmpeg')) &&
    !text.includes('remotion is the full color grading engine')
}

function documentaryColorPipelineSafe(plan: EditPlan, input: PlannerInput) {
  if (input.editingCategory !== 'documentary_case_study') {
    return true
  }

  const style = plan.colorPipelinePlan?.colorGradeStyle
  return style === 'documentary_neutral' || /styl/i.test(input.customInstructions)
}

function audioPipelinePlanExists(plan: EditPlan) {
  return Boolean(plan.audioPipelinePlan)
}

function audioPipelineHasVoiceLoudness(plan: EditPlan) {
  const operations = plan.audioPipelinePlan?.projectOperations.map((operation) => operation.operation) ?? []
  return operations.includes('voice_leveling') && operations.includes('loudness_normalization')
}

function audioPipelineRespectsNoMusic(plan: EditPlan, input: PlannerInput) {
  if (!/\b(no music|voice only|just voice)\b/i.test(input.customInstructions)) {
    return true
  }

  return plan.audioPipelinePlan?.musicBedPlan.policy === 'none'
}

function audioPipelineSfxJustified(plan: EditPlan, input: PlannerInput) {
  const sfxPlan = plan.audioPipelinePlan?.sfxPlan

  if (!sfxPlan || sfxPlan.policy === 'none') {
    return true
  }

  const tierMax = input.editLevel === 'premium' ? 8 : input.editLevel === 'pro' ? 5 : 2
  const text = [
    ...sfxPlan.cues,
    ...sfxPlan.avoidRules,
    ...sfxPlan.qaChecks,
  ].join(' ').toLowerCase()

  return sfxPlan.maxSfxPerMinute <= tierMax &&
    text.includes('no random') &&
    (sfxPlan.cues.length > 0 || sfxPlan.allowedSfxTypes.length > 0)
}

function audioPipelineMusicDuckingSafe(plan: EditPlan) {
  const musicPlan = plan.audioPipelinePlan?.musicBedPlan
  return !musicPlan || musicPlan.policy === 'none' || musicPlan.duckingEnabled
}

function audioPipelineToolsArePlanningOnly(plan: EditPlan) {
  const text = [
    ...(plan.audioPipelinePlan?.limitations ?? []),
    ...(plan.audioPipelinePlan?.projectOperations.flatMap((operation) => operation.workerNotes) ?? []),
    ...(plan.audioPipelinePlan?.clipPlans.flatMap((clipPlan) => [
      ...clipPlan.cleanupOperations.flatMap((operation) => operation.workerNotes),
      ...clipPlan.loudnessOperations.flatMap((operation) => operation.workerNotes),
    ]) ?? []),
  ].join(' ').toLowerCase()

  return text.includes('mock') &&
    text.includes('no real') &&
    (text.includes('future worker') || text.includes('planning')) &&
    !text.includes('was executed')
}

function audioPipelineDoesNotEnableVeoOr1080(plan: EditPlan) {
  const text = JSON.stringify(plan.audioPipelinePlan ?? {}).toLowerCase()
  const mentionsVeo = text.includes('veo')
  const keepsVeoRestricted =
    text.includes('no veo') ||
    text.includes('not audio') ||
    text.includes('does not enable') ||
    text.includes('fallback only')

  return !text.includes('1080p') && (!mentionsVeo || keepsVeoRestricted)
}

function audioPipelineDoesNotBypassApproval(plan: EditPlan) {
  const text = [
    ...(plan.audioPipelinePlan?.limitations ?? []),
    ...(plan.audioPipelinePlan?.tierNotes ?? []),
  ].join(' ').toLowerCase()

  return text.includes('approval') && !text.includes('bypass approval')
}

function audioPipelineSoundSyncNotVisualSignature(plan: EditPlan) {
  const text = JSON.stringify(plan.audioPipelinePlan ?? {}).toLowerCase()
  return !text.includes('visual signature system') || text.includes('not a visual signature system')
}

function audioPipelineRubberBandFlagged(plan: EditPlan) {
  if (!plan.audioPipelinePlan?.toolsPlanned.includes('rubber_band')) {
    return true
  }

  const text = [
    ...(plan.audioPipelinePlan.limitations ?? []),
    ...(plan.audioPipelinePlan.projectOperations.flatMap((operation) => operation.workerNotes) ?? []),
  ].join(' ').toLowerCase()

  return text.includes('license') && (text.includes('future') || text.includes('evaluate'))
}

function mapSignalExists(plan: EditPlan, input: PlannerInput) {
  const text = [
    input.customInstructions,
    plan.videoUnderstandingReport?.overallSummary,
    ...(plan.videoUnderstandingReport?.visualSupportOpportunities.map((opportunity) => `${opportunity.opportunityType} ${opportunity.reason}`) ?? []),
    ...(plan.adaptiveEditStrategyPlan?.segmentStrategies.flatMap((strategy) => [strategy.recommendedVisualSupport, ...strategy.recommendedToolHints]) ?? []),
    ...(plan.visualAssetPlan?.flatMap((asset) => [asset.beatLabel, asset.storyPurpose, asset.reason]) ?? []),
  ].join(' ').toLowerCase()

  return /\b(map|route|location|city|country|neighborhood|real estate|address|geography|travel|place)\b/.test(text) ||
    Boolean(plan.videoUnderstandingReport?.visualSupportOpportunities.some((opportunity) => opportunity.opportunityType === 'map_animation')) ||
    Boolean(plan.adaptiveEditStrategyPlan?.segmentStrategies.some((strategy) => strategy.recommendedToolHints.includes('map_tool')))
}

function mapAnimationPlanExpectedState(plan: EditPlan, input: PlannerInput) {
  return !mapSignalExists(plan, input) || Boolean(plan.mapAnimationPlan?.active)
}

function mapAnimationPlanHasItems(plan: EditPlan) {
  return !plan.mapAnimationPlan?.active || plan.mapAnimationPlan.items.length > 0
}

function mapAnimationControlledTools(plan: EditPlan) {
  return !plan.mapAnimationPlan?.active || plan.mapAnimationPlan.items.every((item) =>
    item.toolIds.includes('remotion') &&
    (item.toolIds.includes('maplibre') || item.mapVisualType === 'screen_map_card') &&
    (item.toolIds.includes('turf') || item.mapVisualType === 'screen_map_card'),
  )
}

function mapAnimationSourceSafety(plan: EditPlan, input: PlannerInput) {
  if (!plan.mapAnimationPlan?.active) {
    return true
  }

  return plan.mapAnimationPlan.items.every((item) =>
    item.locations.every((location) => {
      const safe = location.safeWording.length > 0 &&
        (location.confidence === 'exact' || location.confidence === 'fictional' || location.sourceNeeded)
      const documentarySafe = input.editingCategory !== 'documentary_case_study' ||
        location.claimStatus !== 'unknown' ||
        location.safeWording.includes('location mentioned') ||
        location.sourceNeeded

      return safe && documentarySafe
    }),
  )
}

function mapAnimationHasLayoutAndQa(plan: EditPlan) {
  return !plan.mapAnimationPlan?.active || plan.mapAnimationPlan.items.every((item) =>
    Boolean(item.layout.layoutMode) &&
    item.qaChecks.length > 0 &&
    item.layout.labelAvoidZones.length > 0,
  )
}

function mapAnimationPlanningOnly(plan: EditPlan) {
  const text = [
    ...(plan.mapAnimationPlan?.limitations ?? []),
    ...(plan.mapAnimationPlan?.globalRules ?? []),
    ...(plan.mapAnimationPlan?.items.flatMap((item) => item.workerNotes) ?? []),
  ].join(' ').toLowerCase()

  return !plan.mapAnimationPlan?.active ||
    (text.includes('mock') &&
      text.includes('no geocoding') &&
      text.includes('no map') &&
      !text.includes('was executed'))
}

function mapAnimationNoAiVideoOrVeo(plan: EditPlan) {
  const text = JSON.stringify(plan.mapAnimationPlan ?? {}).toLowerCase()
  return !text.includes('ai video generation') &&
    (!text.includes('veo') || text.includes('fallback only')) &&
    !text.includes('1080p')
}

function mapBehindSubjectHasFallback(plan: EditPlan) {
  return !plan.mapAnimationPlan?.active || plan.mapAnimationPlan.items.every((item) => {
    const isDepthMap = item.mapVisualType === 'map_behind_subject' || item.mapVisualType === 'map_behind_subject_and_contact_object'

    return !isDepthMap ||
      (item.layout.foregroundMaskAware &&
        Boolean(item.layout.fallbackLayoutMode) &&
        Boolean(plan.depthAwareOverlayPlan?.active || item.layout.depthCompositingMode))
  })
}

function dataVizSignalExists(plan: EditPlan, input: PlannerInput) {
  const text = [
    input.customInstructions,
    plan.videoUnderstandingReport?.overallSummary,
    ...(plan.videoUnderstandingReport?.visualSupportOpportunities.map((opportunity) => `${opportunity.opportunityType} ${opportunity.reason}`) ?? []),
    ...(plan.adaptiveEditStrategyPlan?.segmentStrategies.flatMap((strategy) => [strategy.recommendedVisualSupport, ...strategy.recommendedToolHints]) ?? []),
    ...(plan.visualAssetPlan?.flatMap((asset) => [asset.beatLabel, asset.storyPurpose, asset.reason, asset.assetType]) ?? []),
  ].join(' ').toLowerCase()

  return /\b(chart|graph|diagram|timeline|money flow|account|process|comparison|before and after|metric|number|percentage|data|dashboard|results|evidence|claim|funnel|sales|growth|revenue)\b/.test(text) ||
    Boolean(plan.videoUnderstandingReport?.visualSupportOpportunities.some((opportunity) => opportunity.opportunityType === 'chart_or_diagram')) ||
    Boolean(plan.adaptiveEditStrategyPlan?.segmentStrategies.some((strategy) => strategy.recommendedToolHints.includes('chart_tool')))
}

function dataVizPlanExpectedState(plan: EditPlan, input: PlannerInput) {
  return !dataVizSignalExists(plan, input) || Boolean(plan.dataVizPlan?.active)
}

function dataVizPlanHasItems(plan: EditPlan) {
  return !plan.dataVizPlan?.active || plan.dataVizPlan.items.length > 0
}

function dataVizControlledTools(plan: EditPlan) {
  return !plan.dataVizPlan?.active || plan.dataVizPlan.items.every((item) =>
    item.toolIds.includes('remotion') &&
    (item.toolIds.includes('d3') ||
      item.toolIds.includes('echarts') ||
      item.toolIds.includes('vega_lite') ||
      item.preferredTool === 'remotion_only'),
  )
}

function dataVizSourceSafety(plan: EditPlan, input: PlannerInput) {
  if (!plan.dataVizPlan?.active) {
    return true
  }

  return plan.dataVizPlan.items.every((item) => {
    const hasSafeWording = item.dataPlan.safeWording.length > 0
    const confidenceOk = item.dataPlan.confidence === 'verified' ||
      item.dataPlan.confidence === 'fictional' ||
      item.dataPlan.sourceNeeded ||
      item.dataPlan.mockData ||
      item.dataPlan.fictionalData
    const mockMarked = !item.dataPlan.mockData || /mock|example|sample/i.test(item.dataPlan.safeWording)
    const documentarySafe = input.editingCategory !== 'documentary_case_study' ||
      item.dataPlan.confidence === 'verified' ||
      /reported|claimed|approximate|source|example|fictional/i.test(item.dataPlan.safeWording)

    return hasSafeWording && confidenceOk && mockMarked && documentarySafe
  })
}

function dataVizHasLayoutAndQa(plan: EditPlan) {
  return !plan.dataVizPlan?.active || plan.dataVizPlan.items.every((item) =>
    Boolean(item.layout.layoutMode) &&
    item.qaChecks.length > 0 &&
    item.layout.labelAvoidZones.length > 0,
  )
}

function dataVizBasicComplexityOk(plan: EditPlan, input: PlannerInput) {
  return !plan.dataVizPlan?.active || input.editLevel !== 'basic' || plan.dataVizPlan.items.every((item) =>
    item.style.labelDensity !== 'high' &&
    !['network_graph', 'hierarchy_tree', 'evidence_flow_diagram'].includes(item.visualType),
  )
}

function dataVizPlanningOnly(plan: EditPlan) {
  const text = [
    ...(plan.dataVizPlan?.limitations ?? []),
    ...(plan.dataVizPlan?.globalRules ?? []),
    ...(plan.dataVizPlan?.items.flatMap((item) => item.workerNotes) ?? []),
  ].join(' ').toLowerCase()

  return !plan.dataVizPlan?.active ||
    (text.includes('mock') &&
      text.includes('no real') &&
      text.includes('approval') &&
      !text.includes('was executed'))
}

function dataVizNoAiVideoOrVeo(plan: EditPlan) {
  const text = JSON.stringify(plan.dataVizPlan ?? {}).toLowerCase()
  return !text.includes('ai video generation') &&
    (!text.includes('veo') || text.includes('fallback only')) &&
    !text.includes('1080p')
}

function routeVeoIsFinalFallback(asset: VisualAssetPlanItem) {
  if (routeHasPrimaryVeo(asset)) {
    return false
  }

  const fallbackModels = asset.providerRoute.fallbackModels
  const fallbackStepsWithModel = asset.providerRoute.fallbackSteps.filter((step) => step.model)
  const fallbackModelOk = !fallbackModels.includes('veo_3_1_lite') ||
    fallbackModels[fallbackModels.length - 1] === 'veo_3_1_lite'
  const fallbackStepOk = !fallbackStepsWithModel.some((step) => providerUsesVeo(step.model)) ||
    providerUsesVeo(fallbackStepsWithModel[fallbackStepsWithModel.length - 1]?.model)

  return fallbackModelOk && fallbackStepOk
}

function resolutionMatchesPrimary(asset: VisualAssetPlanItem) {
  const model = asset.providerRoute.primaryModel
  const resolution = asset.providerRoute.resolution

  if (modelIsWan(model)) {
    return resolution === '720P'
  }

  if (modelIsHailuo(model)) {
    return resolution === '768P'
  }

  if (model === 'veo_3_1_lite') {
    return resolution === '720P'
  }

  return true
}

function promptText(promptPlan: ProviderPromptPlan) {
  return [
    promptPlan.prompt,
    promptPlan.negativePrompt,
    promptPlan.safeMarginNotes.join(' '),
    promptPlan.tierPolicyNotes.join(' '),
    promptPlan.qaNotes.join(' '),
    promptPlan.workerNotes.join(' '),
  ].filter(Boolean).join(' ').toLowerCase()
}

function promptRequestsTransparentDefault(promptPlan: ProviderPromptPlan) {
  const text = promptText(promptPlan)

  if (!text.includes('transparent')) {
    return false
  }

  return !(
    text.includes('no transparent') ||
    text.includes('not the default') ||
    text.includes('do not depend') ||
    text.includes('transparent ai-video backgrounds are not')
  )
}

function promptHasMatchingPanelBackground(promptPlan: ProviderPromptPlan) {
  const text = promptText(promptPlan)
  return text.includes('matching panel background') || text.includes('panel background')
}

function promptKeepsProviderAssetScoped(promptPlan: ProviderPromptPlan) {
  const text = promptText(promptPlan)

  if (promptPlan.providerModel === 'gpt_image_2') {
    return text.includes('asset') && text.includes('final canvas')
  }

  if (promptPlan.targetProvider === 'remotion' || promptPlan.targetProvider === 'editor_motion') {
    return text.includes('no ai-video provider') || text.includes('final composition')
  }

  return true
}

function promptIsPrimaryVeo(promptPlan: ProviderPromptPlan) {
  return providerUsesVeo(promptPlan.providerModel) && promptPlan.planType !== 'veo_fallback_prompt'
}

function isAiVideoAsset(asset: VisualAssetPlanItem) {
  return routeHasVeo(asset) ||
    modelIsWan(asset.providerRoute.primaryModel) ||
    modelIsHailuo(asset.providerRoute.primaryModel) ||
    asset.assetType === 'animated_scene' ||
    asset.assetType === 'real_motion_scene'
}

function assetHasRendererLayer(asset: VisualAssetPlanItem, plan: EditPlan) {
  return Boolean(plan.rendererCompositionPlan?.layers.some((layer) => layer.assetPlanItemId === asset.id))
}

function rendererNotesSayRemotionOwnsCanvas(plan: EditPlan) {
  const notes = plan.rendererCompositionPlan?.rendererNotes.join(' ').toLowerCase() ?? ''
  return notes.includes('remotion') && (notes.includes('final canvas') || notes.includes('final composition'))
}

function qaChecks(plan: EditPlan) {
  return plan.editQAPlan
    ? [
        ...plan.editQAPlan.globalChecks,
        ...plan.editQAPlan.segmentChecks,
        ...plan.editQAPlan.tierPolicyChecks,
        ...plan.editQAPlan.approvalChecks,
      ]
    : []
}

function qaHasCategoryOrText(plan: EditPlan, pattern: RegExp) {
  return qaChecks(plan).some((check) => pattern.test(`${check.category} ${check.label} ${check.check} ${check.notes.join(' ')}`))
}

function layoutPlanExists(plan: EditPlan) {
  return Boolean(plan.speakerVisualLayoutPlan && plan.speakerVisualLayoutPlan.items.length > 0)
}

function layoutItemForSegment(plan: EditPlan, segmentId: string) {
  const segment = plan.segmentEditPlans?.find((item) => item.id === segmentId)

  return plan.speakerVisualLayoutPlan?.items.find((item) =>
    item.segmentId === segmentId ||
    item.id === segment?.speakerVisualLayoutItemId ||
    Boolean(segment?.visualAssetPlanItemIds.some((assetId) => item.assetPlanItemId === assetId)),
  )
}

function layoutItemForAsset(plan: EditPlan, asset: VisualAssetPlanItem) {
  return plan.speakerVisualLayoutPlan?.items.find((item) =>
    item.assetPlanItemId === asset.id ||
    item.id === asset.speakerVisualLayoutItemId,
  )
}

function segmentOrAssetLayoutCovered(plan: EditPlan) {
  const segmentPlans = plan.segmentEditPlans ?? []
  const visualAssetPlan = plan.visualAssetPlan ?? []

  if (!layoutPlanExists(plan)) {
    return false
  }

  if (segmentPlans.length > 0) {
    return segmentPlans.every((segment) => Boolean(layoutItemForSegment(plan, segment.id)))
  }

  return visualAssetPlan.every((asset) => Boolean(layoutItemForAsset(plan, asset)))
}

function layoutRequiresFallback(item: SpeakerVisualLayoutPlanItem) {
  return (
    item.complexity === 'moderate' ||
    item.complexity === 'advanced' ||
    item.complexity === 'premium' ||
    item.riskLevel === 'medium' ||
    item.riskLevel === 'high' ||
    item.riskLevel === 'premium'
  )
}

function riskyLayoutItems(plan: EditPlan) {
  return (plan.speakerVisualLayoutPlan?.items ?? []).filter((item) =>
    item.riskLevel === 'high' ||
    item.riskLevel === 'premium' ||
    item.complexity === 'advanced' ||
    item.complexity === 'premium',
  )
}

function basicHasUnsafeLayout(plan: EditPlan, editLevel: EditLevel) {
  if (editLevel !== 'basic') {
    return false
  }

  return riskyLayoutItems(plan).length > 0 ||
    (plan.speakerVisualLayoutPlan?.items ?? []).some((item) => !item.tierAvailability.basic)
}

function layoutAspectSupported(item: SpeakerVisualLayoutPlanItem, requestedAspectRatio: AspectRatio) {
  if (requestedAspectRatio === 'let_ai_decide') {
    return true
  }

  const definition = getSpeakerVisualLayoutMode(item.layoutMode)

  return Boolean(
    definition?.supportedAspectRatios.includes(requestedAspectRatio) ||
    definition?.supportedAspectRatios.includes('let_ai_decide') ||
    item.recommendedForAspectRatio === requestedAspectRatio ||
    item.recommendedForAspectRatio === 'let_ai_decide',
  )
}

function layoutModesMatchAspectRatio(plan: EditPlan, input: PlannerInput) {
  return (plan.speakerVisualLayoutPlan?.items ?? []).every((item) => layoutAspectSupported(item, input.aspectRatio))
}

function futureLayoutModesAreMockOnly(plan: EditPlan) {
  const futureItems = (plan.speakerVisualLayoutPlan?.items ?? []).filter((item) =>
    item.layoutMode === 'speaker_cutout_overlay' ||
    item.layoutMode === 'object_anchored_callout',
  )

  return futureItems.every((item) => {
    const text = [
      ...item.promptImplications,
      ...item.remotionNotes,
      ...item.qaChecks,
      ...item.preferredTools,
    ].join(' ').toLowerCase()

    return (
      Boolean(item.fallbackLayoutMode) &&
      (text.includes('future') || text.includes('placeholder') || text.includes('mock')) &&
      (text.includes('no real') || text.includes('not implemented') || text.includes('do not execute'))
    )
  })
}

function riskyLayoutsHaveFallback(plan: EditPlan) {
  return (plan.speakerVisualLayoutPlan?.items ?? []).every((item) => !layoutRequiresFallback(item) || Boolean(item.fallbackLayoutMode))
}

function rendererReferencesLayoutStrategy(plan: EditPlan) {
  const text = [
    ...(plan.rendererCompositionPlan?.rendererNotes ?? []),
    ...(plan.rendererCompositionPlan?.layers ?? []).flatMap((layer) => layer.notes),
  ].join(' ').toLowerCase()

  return text.includes('speaker/visual layout') ||
    text.includes('layout mode') ||
    text.includes('speaker presence') ||
    text.includes('visual dominance')
}

function promptPlansIncludeLayoutImplications(promptPlans: ProviderPromptPlan[]) {
  return promptPlans.length === 0 || promptPlans.every((promptPlan) => {
    const text = promptText(promptPlan)
    return text.includes('speaker/visual layout') || text.includes('layout mode')
  })
}

function depthLanguageRequested(input: PlannerInput) {
  const text = [
    input.customInstructions,
    input.projectName,
    input.workflowType,
    input.clips.map((clip) => `${clip.fileName} ${clip.detectedType} ${clip.notes ?? ''} ${clip.thumbnailHint ?? ''}`).join(' '),
  ].join(' ').toLowerCase()

  return /behind me|behind the person|behind subject|map behind|card behind|foreground|depth|object in front|pole|contact object|in the scene/.test(text)
}

function depthPlanActive(plan: EditPlan) {
  return Boolean(plan.depthAwareOverlayPlan?.active && plan.depthAwareOverlayPlan.items.length > 0)
}

function depthItemsNeedFallback(plan: EditPlan) {
  return (plan.depthAwareOverlayPlan?.items ?? []).filter((item) =>
    item.maskRisk === 'medium' ||
    item.maskRisk === 'high' ||
    item.maskRisk === 'premium' ||
    item.maskStrategy !== 'none',
  )
}

function depthRiskyItemsHaveFallback(plan: EditPlan) {
  return depthItemsNeedFallback(plan).every((item) => Boolean(item.fallbackLayoutMode))
}

function basicHasUnsafeDepth(plan: EditPlan, editLevel: EditLevel) {
  if (editLevel !== 'basic') {
    return false
  }

  return (plan.depthAwareOverlayPlan?.items ?? []).some((item) =>
    !item.tierAllowed.basic ||
    item.maskStrategy !== 'none' ||
    item.maskRisk === 'high' ||
    item.maskRisk === 'premium',
  )
}

function depthModesAreMockOnly(plan: EditPlan) {
  return (plan.depthAwareOverlayPlan?.items ?? []).every((item) => {
    const text = [
      item.overlayLayerDescription,
      item.captionLayerRule,
      item.reason,
      ...item.promptImplications,
      ...item.remotionLayerNotes,
      ...item.qaChecks,
      ...item.workerNotes,
    ].join(' ').toLowerCase()

    return (
      text.includes('future') &&
      (text.includes('mock') || text.includes('planning only') || text.includes('placeholder')) &&
      (text.includes('no real') || text.includes('not executed') || text.includes('not implemented'))
    )
  })
}

function rendererReferencesDepthPlan(plan: EditPlan) {
  if (!depthPlanActive(plan)) {
    return true
  }

  const text = [
    ...(plan.rendererCompositionPlan?.rendererNotes ?? []),
    ...(plan.rendererCompositionPlan?.layers ?? []).flatMap((layer) => [
      layer.layerType,
      layer.label,
      ...layer.notes,
    ]),
  ].join(' ').toLowerCase()

  return text.includes('depth-aware') ||
    text.includes('foreground mask') ||
    text.includes('future mask') ||
    text.includes('contact object')
}

function promptPlansIncludeDepthImplications(promptPlans: ProviderPromptPlan[], plan: EditPlan) {
  if (!depthPlanActive(plan)) {
    return true
  }

  return promptPlans.length === 0 || promptPlans.some((promptPlan) => {
    const text = promptText(promptPlan)
    return text.includes('depth-aware') ||
      text.includes('mask strategy') ||
      text.includes('future mask') ||
      text.includes('contact object') ||
      text.includes('foreground')
  })
}

function contactDepthItems(plan: EditPlan) {
  return (plan.depthAwareOverlayPlan?.items ?? []).filter((item) =>
    item.depthCompositingMode === 'graphic_behind_subject_and_contact_objects',
  )
}

function contactDepthItemsHaveContactObjects(plan: EditPlan) {
  return contactDepthItems(plan).every((item) =>
    item.foregroundObjects.some((object) => object.kind === 'contact_object'),
  )
}

function contactDepthItemsHaveGroups(plan: EditPlan) {
  return contactDepthItems(plan).every((item) =>
    item.foregroundDepthGroups.some((group) => group.contactObjectIds.length > 0 && group.preserveGroupInFront),
  )
}

function contactDepthQaExists(plan: EditPlan) {
  return contactDepthItems(plan).every((item) => {
    const text = [...item.qaChecks, ...item.workerNotes, item.reason].join(' ').toLowerCase()
    return text.includes('contact object') && (text.includes('preservation') || text.includes('foreground'))
  })
}

function creditPolicyMentionsAllowedVeoForBasicPro(plan: EditPlan) {
  const notes = plan.creditEstimate.fallbackPolicyNotes ?? []
  return notes.some((note) => {
    const text = `${note.label} ${note.message}`.toLowerCase()
    return text.includes('veo') && (text.includes('available') || text.includes('allowed')) &&
      !text.includes('unavailable') &&
      !text.includes('disabled') &&
      !text.includes('cannot') &&
      !text.includes('premium-only')
  })
}

function premiumCreditPolicyHasFallbackOnlyVeo(plan: EditPlan) {
  const text = (plan.creditEstimate.fallbackPolicyNotes ?? [])
    .map((note) => `${note.label} ${note.message}`)
    .join(' ')
    .toLowerCase()
  const routeMentionsVeo = (plan.visualAssetPlan ?? []).some(routeHasVeo) ||
    (plan.providerPromptPlans ?? []).some((promptPlan) => providerUsesVeo(promptPlan.providerModel))

  return !routeMentionsVeo || (text.includes('veo') && text.includes('fallback') && !text.includes('primary'))
}

function professionalSettingsComplete(plan: EditPlan) {
  const directive = plan.professionalEditingDirective

  return Boolean(
    directive?.editStyle &&
    directive.pacingStyle &&
    directive.colorGradeStyle &&
    directive.captionStyle &&
    directive.brollPolicy &&
    directive.soundStyle &&
    directive.transitionFamilies.length > 0,
  )
}

function segmentPlansComplete(plan: EditPlan) {
  return (plan.segmentEditPlans ?? []).every((segment) =>
    segment.operations.length > 0 &&
    Boolean(segment.captionPlan) &&
    Boolean(segment.colorGradePlan) &&
    Boolean(segment.soundPlan) &&
    Boolean(segment.transitionPlan) &&
    segment.qaPlan.length > 0 &&
    typeof segment.finalTimeRange.startSeconds === 'number' &&
    typeof segment.finalTimeRange.endSeconds === 'number' &&
    segment.finalTimeRange.endSeconds > segment.finalTimeRange.startSeconds,
  )
}

function factSafetyClaimTreatmentsAreNeutral(plan: EditPlan) {
  const claims = plan.documentaryFactSafetyPlan?.claimItems ?? []
  const uncertainClaims = claims.filter((item) =>
    item.claimStatus === 'unknown' ||
    item.claimStatus === 'allegation' ||
    item.claimStatus === 'charge' ||
    item.claimStatus === 'claim_by_source',
  )

  return uncertainClaims.every((item) => neutralFactTreatments.includes(item.visualTreatment))
}

function characterPacksHaveRules(plan: EditPlan) {
  const packs = plan.characterConsistencyPlan?.packs ?? []
  return packs.every((pack) =>
    pack.consistencyRules.length > 0 &&
    (!(pack.realityStatus === 'real_named_person' || pack.realityStatus === 'unknown') || pack.avoidRules.length > 0),
  )
}

function countFailures(checks: PlanValidationCheck[], severity: PlanValidationSeverity) {
  return checks.filter((check) => !check.passed && check.severity === severity).length
}

function createReport(params: {
  id: string
  checks: PlanValidationCheck[]
  passedSummary: string
  failedSummary: string
}): PlanValidationReport {
  const { checks, failedSummary, id, passedSummary } = params
  const blockingCount = countFailures(checks, 'blocking')
  const errorCount = countFailures(checks, 'error')
  const warningCount = countFailures(checks, 'warning')
  const passedCount = checks.filter((check) => check.passed).length
  const status: PlanValidationStatus = blockingCount > 0 || errorCount > 0
    ? 'failed'
    : warningCount > 0
      ? 'warning'
      : 'passed'
  const failedCount = blockingCount + errorCount + warningCount

  return {
    id,
    status,
    checks,
    blockingCount,
    errorCount,
    warningCount,
    passedCount,
    summary: status === 'passed'
      ? passedSummary
      : `${failedCount} validation check${failedCount === 1 ? '' : 's'} need attention. ${failedSummary}`,
  }
}

function check(params: PlanValidationCheck): PlanValidationCheck {
  return params
}

function demoScenarioChecks(params: {
  input: PlannerInput
  plan: EditPlan
  scenarioId?: string
}): PlanValidationCheck[] {
  const { input, plan, scenarioId } = params

  if (!scenarioId) {
    return []
  }

  const scenario = getDemoScenarioById(scenarioId)

  if (!scenario) {
    return [
      check({
        id: 'validation-demo-scenario-known',
        category: 'demo_scenario',
        label: 'Demo scenario exists',
        severity: 'warning',
        passed: false,
        message: `Scenario ${scenarioId} was not found in demoScenarios.`,
        relatedField: 'scenarioId',
      }),
    ]
  }

  const expectedPolicyText = scenario.expectedProviderPolicy.join(' ').toLowerCase()
  const expectedSafetyText = scenario.expectedSafetyNotes.join(' ').toLowerCase()
  const expectedSystemsText = scenario.expectedSignatureSystems.join(' ').toLowerCase()
  const expectedAssetText = scenario.expectedAssetBehavior.join(' ').toLowerCase()
  const routeSystems = plan.signatureRoutes.map((route) => route.system).join(' ').toLowerCase()
  const expectsNoVeo = expectedPolicyText.includes('no veo')
  const expectsMatchingBackground = expectedPolicyText.includes('matching panel background')
  const expectsFactSafety = expectedSafetyText.includes('fact safety')
  const expectsCharacter = expectedSafetyText.includes('character')
  const expectsDepth = expectedAssetText.includes('depth') || expectedSafetyText.includes('depth') || expectedPolicyText.includes('future mask')
  const expectsContactObject = expectedAssetText.includes('contact object') || expectedSafetyText.includes('contact object') || expectedSafetyText.includes('pole')
  const expectsStroke = expectedSystemsText.includes('stroke')
  const expectsGraphic = expectedSystemsText.includes('graphic') || expectedSystemsText.includes('visualexplain')

  return [
    check({
      id: 'validation-demo-scenario-known',
      category: 'demo_scenario',
      label: 'Demo scenario exists',
      severity: 'info',
      passed: true,
      message: `${scenario.label} is covered by the selected plan validation.`,
      relatedField: 'scenarioId',
    }),
    check({
      id: 'validation-demo-provider-policy',
      category: 'demo_scenario',
      label: 'Demo provider expectations',
      severity: 'warning',
      passed: (!expectsNoVeo || !(plan.visualAssetPlan ?? []).some(routeHasVeo)) &&
        (!expectsMatchingBackground || Boolean(plan.rendererCompositionPlan?.panelBackgroundColor)),
      message: 'Scenario provider expectations should be reflected by route and frame policy.',
      relatedField: 'demoScenarios.expectedProviderPolicy',
    }),
    check({
      id: 'validation-demo-safety-expectations',
      category: 'demo_scenario',
      label: 'Demo safety expectations',
      severity: 'warning',
      passed: (!expectsFactSafety || Boolean(plan.documentaryFactSafetyPlan?.active)) &&
        (!expectsCharacter || Boolean(plan.characterConsistencyPlan?.packs.length)),
      message: 'Scenario safety expectations should be visible in character and fact-safety planning.',
      relatedField: 'demoScenarios.expectedSafetyNotes',
    }),
    check({
      id: 'validation-demo-signature-expectations',
      category: 'demo_scenario',
      label: 'Demo signature expectations',
      severity: 'warning',
      passed: (!expectsStroke || routeSystems.includes('stroke_motion')) &&
        (!expectsGraphic || routeSystems.includes('graphic_design')) &&
        (input.visualPreference === 'keep_visuals_minimal' || plan.signatureRoutes.length > 0),
      message: 'Scenario signature-system expectations should be represented by signature routes where useful.',
      relatedField: 'signatureRoutes',
    }),
    check({
      id: 'validation-demo-depth-expectations',
      category: 'demo_scenario',
      label: 'Demo depth expectations',
      severity: expectsDepth ? 'warning' : 'info',
      passed: !expectsDepth || depthPlanActive(plan),
      message: 'Scenario depth expectations should activate depth-aware overlay planning.',
      relatedField: 'depthAwareOverlayPlan',
    }),
    check({
      id: 'validation-demo-contact-object-expectations',
      category: 'demo_scenario',
      label: 'Demo contact-object expectations',
      severity: expectsContactObject ? 'warning' : 'info',
      passed: !expectsContactObject || contactDepthItemsHaveContactObjects(plan),
      message: 'Scenario contact-object expectations should be represented by foreground object planning.',
      relatedField: 'depthAwareOverlayPlan.items.foregroundObjects',
    }),
  ]
}

export function validateMockEditPlan(params: {
  input: PlannerInput
  plan: EditPlan
  scenarioId?: string
}): PlanValidationReport {
  const { input, plan, scenarioId } = params
  const editLevel: EditLevel = plan.compiledIntent?.resolvedSettings.editLevel ?? input.editLevel
  const visualAssetPlan = plan.visualAssetPlan ?? []
  const promptPlans = plan.providerPromptPlans ?? []
  const allFallbackSteps = fallbackSteps(plan)
  const allRouteText = planText(plan)
  const aiVideoAssets = visualAssetPlan.filter(isAiVideoAsset)
  const directive = plan.professionalEditingDirective
  const sourceSequenceReview = plan.sourceSequenceReview
  const sourceOrderConfirmed = input.sourceOrderConfirmed ?? sourceSequenceReview?.confirmed
  const sourceSequenceMode = input.sourceSequenceMode ?? sourceSequenceReview?.mode
  const multipleClips = input.clips.length > 1
  const checks: PlanValidationCheck[] = [
    check({
      id: 'validation-compiled-intent',
      category: 'compiled_intent',
      label: 'Compiled intent exists',
      severity: 'blocking',
      passed: checkExists(plan.compiledIntent),
      message: 'Raw chat must be compiled into structured intent before plan generation.',
      relatedField: 'compiledIntent',
    }),
    check({
      id: 'validation-professional-directive',
      category: 'professional_editing',
      label: 'Professional editing directive exists',
      severity: 'blocking',
      passed: checkExists(plan.professionalEditingDirective),
      message: 'The plan must include structured professional editing settings.',
      relatedField: 'professionalEditingDirective',
    }),
    check({
      id: 'validation-video-understanding-report',
      category: 'video_understanding',
      label: 'Video understanding report exists',
      severity: 'blocking',
      passed: videoUnderstandingExists(plan),
      message: 'Mock edit plans should include a Video Understanding Report before choosing visual, layout, and tool strategy.',
      relatedField: 'videoUnderstandingReport',
    }),
    check({
      id: 'validation-video-understanding-clips',
      category: 'video_understanding',
      label: 'Clip understanding exists',
      severity: 'error',
      passed: Boolean(plan.videoUnderstandingReport?.clips.length),
      message: 'Video understanding should summarize attached clips and inferred mock roles.',
      relatedField: 'videoUnderstandingReport.clips',
    }),
    check({
      id: 'validation-video-understanding-transcript',
      category: 'video_understanding',
      label: 'Transcript meaning exists',
      severity: 'error',
      passed: Boolean(plan.videoUnderstandingReport?.transcriptMeaning?.summary),
      message: 'Video understanding should include mock transcript meaning without claiming real transcript generation.',
      relatedField: 'videoUnderstandingReport.transcriptMeaning',
    }),
    check({
      id: 'validation-video-understanding-visual',
      category: 'video_understanding',
      label: 'Visual understanding exists',
      severity: 'error',
      passed: Boolean(plan.videoUnderstandingReport?.visualUnderstanding?.sceneTypeSummary),
      message: 'Video understanding should include mock visual understanding and safe-zone notes.',
      relatedField: 'videoUnderstandingReport.visualUnderstanding',
    }),
    check({
      id: 'validation-video-understanding-audio',
      category: 'video_understanding',
      label: 'Audio understanding exists',
      severity: 'error',
      passed: Boolean(plan.videoUnderstandingReport?.audioUnderstanding?.notes.length),
      message: 'Video understanding should include mock audio understanding and cleanup hints.',
      relatedField: 'videoUnderstandingReport.audioUnderstanding',
    }),
    check({
      id: 'validation-video-understanding-opportunities',
      category: 'video_understanding',
      label: 'Visual opportunities exist',
      severity: 'warning',
      passed: Boolean(plan.videoUnderstandingReport?.visualSupportOpportunities.length),
      message: 'Video understanding should identify visual support opportunities or a no-extra-visual/caption-only rationale.',
      relatedField: 'videoUnderstandingReport.visualSupportOpportunities',
    }),
    check({
      id: 'validation-adaptive-strategy',
      category: 'video_understanding',
      label: 'Adaptive strategy exists',
      severity: 'warning',
      passed: Boolean(plan.videoUnderstandingReport?.suggestedStrategy?.items.length && plan.adaptiveEditStrategy?.items.length),
      message: 'The report should include an adaptive edit strategy that explains per-opportunity decisions.',
      relatedField: 'adaptiveEditStrategy',
    }),
    check({
      id: 'validation-adaptive-strategy-plan',
      category: 'adaptive_strategy',
      label: 'Adaptive strategy plan exists',
      severity: 'error',
      passed: adaptiveStrategyPlanExists(plan),
      message: 'Mock edit plans should include a typed AdaptiveEditStrategyPlan before visual, layout, prompt, and credit planning.',
      relatedField: 'adaptiveEditStrategyPlan',
    }),
    check({
      id: 'validation-adaptive-segment-strategy-fields',
      category: 'adaptive_strategy',
      label: 'Segment strategies are reasoned',
      severity: 'error',
      passed: adaptiveStrategiesHaveReasons(plan),
      message: 'Each adaptive segment strategy needs a decision kind, visual support, generation restraint, and reason.',
      relatedField: 'adaptiveEditStrategyPlan.segmentStrategies',
    }),
    check({
      id: 'validation-adaptive-controlled-tools',
      category: 'adaptive_strategy',
      label: 'Exact visuals prefer controlled tools',
      severity: 'blocking',
      passed: exactStrategiesPreferControlledTools(plan),
      message: 'Map, chart, and screen-capture strategies should avoid AI video and prefer controlled tool/Remotion briefs.',
      relatedField: 'adaptiveEditStrategyPlan.segmentStrategies',
    }),
    check({
      id: 'validation-adaptive-generation-has-reason',
      category: 'adaptive_strategy',
      label: 'Generation has reason',
      severity: 'error',
      passed: adaptiveGenerationHasReason(plan),
      message: 'Any generation-allowed strategy should have a beat-level reason and use a visual system where motion helps.',
      relatedField: 'adaptiveEditStrategyPlan.segmentStrategies',
    }),
    check({
      id: 'validation-adaptive-basic-limited-generation',
      category: 'adaptive_strategy',
      label: 'Basic uses restrained generation',
      severity: editLevel === 'basic' ? 'warning' : 'info',
      passed: basicStrategyUsesLimitedGeneration(plan, editLevel),
      message: 'Basic should favor captions, b-roll, stills, and controlled graphics instead of heavy AI video.',
      relatedField: 'adaptiveEditStrategyPlan.segmentStrategies',
    }),
    check({
      id: 'validation-adaptive-tier-model-notes',
      category: 'adaptive_strategy',
      label: 'Tier/model notes exist',
      severity: 'warning',
      passed: adaptiveStrategyHasTierAndModelNotes(plan),
      message: 'Adaptive strategy should include tier and model policy notes, including Basic/Pro no Veo and Premium fallback-only Veo.',
      relatedField: 'adaptiveEditStrategyPlan.modelPolicyNotes',
    }),
    check({
      id: 'validation-tool-registry-summary',
      category: 'tool_registry',
      label: 'Tool registry summary exists',
      severity: 'warning',
      passed: toolRegistrySummaryExists(plan),
      message: 'Mock edit plans should include an open-source tool registry summary for deterministic tool planning.',
      relatedField: 'toolRegistrySummary',
    }),
    check({
      id: 'validation-tool-registry-launch-core',
      category: 'tool_registry',
      label: 'Launch-core tool coverage',
      severity: 'warning',
      passed: toolRegistryHasLaunchCoreCoverage(plan),
      message: 'Tool registry should include launch-core planning tools such as Remotion, FFmpeg, Sharp, MapLibre, Turf, D3, ECharts, Playwright, OpenCV, and Essentia.',
      relatedField: 'toolRegistrySummary.launchCoreToolCount',
    }),
    check({
      id: 'validation-tool-registry-license-review',
      category: 'tool_registry',
      label: 'License review counted',
      severity: 'warning',
      passed: toolRegistryCountsLicenseReview(plan),
      message: 'Tools that need license review should be counted before production use.',
      relatedField: 'toolRegistrySummary.needsLicenseReviewCount',
    }),
    check({
      id: 'validation-tool-registry-provider-separation',
      category: 'tool_registry',
      label: 'Provider models stay separate',
      severity: 'blocking',
      passed: toolRegistryProviderModelsAreSeparate(),
      message: 'GPT-Image-2, Wan, Hailuo, and Veo must not be OpenSourceToolId registry entries.',
      relatedField: 'openSourceToolProfiles',
    }),
    check({
      id: 'validation-tool-registry-planning-only',
      category: 'tool_registry',
      label: 'Registry is planning-only',
      severity: 'blocking',
      passed: toolRegistryIsPlanningOnly(),
      message: 'Tool registry profiles must not imply packages are installed or tools are executed in this frontend mock.',
      relatedField: 'openSourceToolProfiles.productionNotes',
    }),
    check({
      id: 'validation-tool-registry-no-veo-enable',
      category: 'tool_registry',
      label: 'Registry does not enable Veo',
      severity: 'blocking',
      passed: toolRegistryDoesNotEnableVeo(plan),
      message: 'Tool registry must not enable Veo or change Basic/Pro no-Veo and Premium fallback-only policies.',
      relatedField: 'toolRegistrySummary.notes',
    }),
    check({
      id: 'validation-tool-registry-approval-gate',
      category: 'tool_registry',
      label: 'Registry keeps approval gate',
      severity: 'blocking',
      passed: toolRegistryKeepsApprovalGate(plan),
      message: 'Tool registry must not bypass edit-plan and credit approval.',
      relatedField: 'toolRegistrySummary.notes',
    }),
    check({
      id: 'validation-tool-registry-detailed-hints',
      category: 'tool_registry',
      label: 'Detailed tool hints exist',
      severity: 'warning',
      passed: toolRegistryHintsStayDetailedWhenNeeded(plan),
      message: 'Adaptive strategies that choose controlled tools should include detailed open-source tool hints.',
      relatedField: 'adaptiveEditStrategyPlan.segmentStrategies.toolStrategyHintsDetailed',
    }),
    check({
      id: 'validation-render-strategy-plan',
      category: 'render_strategy',
      label: 'Render strategy plan exists',
      severity: 'error',
      passed: renderStrategyPlanExists(plan),
      message: 'Mock edit plans should include a render strategy plan before renderer and prompt planning.',
      relatedField: 'renderStrategyPlan',
    }),
    check({
      id: 'validation-render-strategy-asset-coverage',
      category: 'render_strategy',
      label: 'Visual assets have render strategy',
      severity: 'error',
      passed: renderStrategyCoversVisualAssets(plan),
      message: 'Each visual asset should link to a render strategy item or have a matching strategy item.',
      relatedField: 'visualAssetPlan.renderStrategyItemId',
    }),
    check({
      id: 'validation-render-strategy-no-primary-veo',
      category: 'render_strategy',
      label: 'Render strategy keeps Veo fallback-only',
      severity: 'blocking',
      passed: renderStrategyDoesNotUsePrimaryOrInvalidVeo(plan, editLevel),
      message: 'Render strategy may reference Veo only for Premium final fallback/rescue and never as primary/default.',
      relatedField: 'renderStrategyPlan.items.selectedProviderModels',
    }),
    check({
      id: 'validation-render-strategy-basic-pro-no-veo',
      category: 'render_strategy',
      label: 'Basic/Pro render strategy excludes Veo',
      severity: editLevel === 'premium' ? 'info' : 'blocking',
      passed: renderStrategyBasicProExcludeVeo(plan, editLevel),
      message: 'Basic and Pro render strategy items must not reference Veo.',
      relatedField: 'renderStrategyPlan.items.selectedProviderModels',
    }),
    check({
      id: 'validation-render-strategy-remotion-ownership',
      category: 'render_strategy',
      label: 'Remotion owns final composition',
      severity: 'error',
      passed: renderStrategyOwnsComposition(plan),
      message: 'Visual-layer render strategies should keep final composition ownership with Remotion/ReeditPro.',
      relatedField: 'renderStrategyPlan.items.remotionOwnsFinalComposition',
    }),
    check({
      id: 'validation-render-strategy-controlled-exact-visuals',
      category: 'render_strategy',
      label: 'Exact visuals avoid AI video',
      severity: 'blocking',
      passed: exactRenderStrategiesAvoidAiVideo(plan),
      message: 'Exact charts, maps, screen captures, captions, cards, and labels should not default to AI video.',
      relatedField: 'renderStrategyPlan.items.strategyType',
    }),
    check({
      id: 'validation-render-strategy-tool-provider-separation',
      category: 'render_strategy',
      label: 'Tools and providers stay separate',
      severity: 'blocking',
      passed: renderStrategyToolProviderSeparation(plan),
      message: 'Open-source tool IDs and provider model IDs must remain separate in render strategy items.',
      relatedField: 'renderStrategyPlan.items',
    }),
    check({
      id: 'validation-render-strategy-planning-only',
      category: 'render_strategy',
      label: 'Render strategy stays planning-only',
      severity: 'blocking',
      passed: renderStrategyIsPlanningOnly(plan),
      message: 'Render strategy must not imply package installation, real tool execution, provider calls, or rendering.',
      relatedField: 'renderStrategyPlan.items.workerNotes',
    }),
    check({
      id: 'validation-render-strategy-fallbacks',
      category: 'render_strategy',
      label: 'Advanced render strategies have fallback',
      severity: 'error',
      passed: renderStrategyHasFallbackForComplexItems(plan),
      message: 'Advanced and premium render strategy items should include fallback strategy guidance.',
      relatedField: 'renderStrategyPlan.items.fallbackStrategyType',
    }),
    check({
      id: 'validation-render-strategy-no-1080p-settings',
      category: 'render_strategy',
      label: 'Render strategy does not default to 1080P',
      severity: 'blocking',
      passed: renderStrategyHasNo1080pSettings(plan),
      message: 'Render strategy settings should not introduce a 1080P default.',
      relatedField: 'renderStrategyPlan.items.settings',
    }),
    check({
      id: 'validation-tool-strategy-plan',
      category: 'tool_strategy',
      label: 'Tool strategy plan exists',
      severity: 'error',
      passed: toolStrategyPlanExists(plan),
      message: 'Mock edit plans should include a tool strategy plan after render strategy planning.',
      relatedField: 'toolStrategyPlan',
    }),
    check({
      id: 'validation-tool-strategy-render-coverage',
      category: 'tool_strategy',
      label: 'Tool strategy covers render needs',
      severity: 'error',
      passed: toolStrategyCoversToolRenderItems(plan),
      message: 'Render items that need Remotion, controlled tools, workers, or QA should have tool strategy coverage.',
      relatedField: 'toolStrategyPlan.items',
    }),
    check({
      id: 'validation-tool-strategy-primary-steps',
      category: 'tool_strategy',
      label: 'Tool strategy has primary tools and steps',
      severity: 'error',
      passed: toolStrategyItemsHavePrimaryAndSteps(plan),
      message: 'Each tool strategy item should identify a primary tool and ordered tool-chain steps.',
      relatedField: 'toolStrategyPlan.items.primaryToolId',
    }),
    check({
      id: 'validation-tool-strategy-settings',
      category: 'tool_strategy',
      label: 'Tool strategy has structured settings',
      severity: 'warning',
      passed: toolStrategyStepsHaveSettings(plan),
      message: 'Each tool-chain step should include settings from the catalog or planner defaults.',
      relatedField: 'toolStrategyPlan.items.steps.settings',
    }),
    check({
      id: 'validation-tool-strategy-provider-separation',
      category: 'tool_strategy',
      label: 'Provider models are not tool IDs',
      severity: 'blocking',
      passed: toolStrategyProviderModelsAreSeparate(plan),
      message: 'GPT-Image-2, Wan, Hailuo, and Veo must not appear in selectedToolIds or chain steps.',
      relatedField: 'toolStrategyPlan.items.selectedToolIds',
    }),
    check({
      id: 'validation-tool-strategy-basic-pro-no-veo',
      category: 'tool_strategy',
      label: 'Basic/Pro tool strategy excludes Veo',
      severity: editLevel === 'premium' ? 'info' : 'blocking',
      passed: toolStrategyBasicProNoVeo(plan, editLevel),
      message: 'Tool strategy must not enable or reference Veo for Basic or Pro.',
      relatedField: 'toolStrategyPlan',
    }),
    check({
      id: 'validation-tool-strategy-premium-veo-fallback-only',
      category: 'tool_strategy',
      label: 'Premium Veo remains fallback-only',
      severity: 'blocking',
      passed: toolStrategyPremiumVeoFallbackOnly(plan, editLevel),
      message: 'Premium tool strategy may mention Veo only as provider final fallback, never as primary/default or open-source tool.',
      relatedField: 'toolStrategyPlan',
    }),
    check({
      id: 'validation-tool-strategy-planning-only',
      category: 'tool_strategy',
      label: 'Tool strategy stays planning-only',
      severity: 'blocking',
      passed: toolStrategyIsPlanningOnly(plan),
      message: 'Tool strategy must not imply package installation, real tool execution, provider calls, workers, or rendering.',
      relatedField: 'toolStrategyPlan.globalRules',
    }),
    check({
      id: 'validation-tool-strategy-license-review',
      category: 'tool_strategy',
      label: 'License review tools are flagged',
      severity: 'warning',
      passed: toolStrategyLicenseReviewFlagged(plan),
      message: 'Tools needing license review should be represented in tool strategy status or license notes.',
      relatedField: 'toolStrategyPlan.toolsNeedingLicenseReview',
    }),
    check({
      id: 'validation-tool-strategy-controlled-exact-visuals',
      category: 'tool_strategy',
      label: 'Exact tool chains avoid AI video',
      severity: 'blocking',
      passed: exactToolStrategyAvoidsAiVideo(plan),
      message: 'Exact map, chart, and screen capture tool chains should explain why AI video is avoided.',
      relatedField: 'toolStrategyPlan.items.whyNotAiVideo',
    }),
    check({
      id: 'validation-tool-strategy-approval-gate',
      category: 'tool_strategy',
      label: 'Tool strategy keeps approval gate',
      severity: 'blocking',
      passed: toolStrategyDoesNotBypassApproval(plan),
      message: 'Tool strategy must not bypass edit-plan or credit approval.',
      relatedField: 'toolStrategyPlan.globalRules',
    }),
    check({
      id: 'validation-color-pipeline-plan',
      category: 'color_pipeline',
      label: 'Color pipeline plan exists',
      severity: 'error',
      passed: colorPipelinePlanExists(plan),
      message: 'Mock edit plans should include a project/clip/asset color pipeline plan.',
      relatedField: 'colorPipelinePlan',
    }),
    check({
      id: 'validation-color-pipeline-basic-correction',
      category: 'color_pipeline',
      label: 'Professional correction baseline',
      severity: editLevel === 'basic' ? 'blocking' : 'error',
      passed: colorPipelineHasBasicCorrection(plan),
      message: 'Basic and all higher tiers need exposure, white balance, and contrast correction planning.',
      relatedField: 'colorPipelinePlan.projectOperations',
    }),
    check({
      id: 'validation-color-pipeline-clip-plans',
      category: 'color_pipeline',
      label: 'Clip color plans exist',
      severity: 'error',
      passed: colorPipelineHasClipPlans(plan),
      message: 'Color pipeline should include clip-level plans for source footage and shot matching.',
      relatedField: 'colorPipelinePlan.clipPlans',
    }),
    check({
      id: 'validation-color-pipeline-style-notes',
      category: 'color_pipeline',
      label: 'Pro/Premium color depth',
      severity: editLevel === 'basic' ? 'info' : 'warning',
      passed: colorPipelineHasStyleSpecificNotes(plan, editLevel),
      message: 'Pro/Premium color planning should include style-specific grade and asset matching notes.',
      relatedField: 'colorPipelinePlan.tierNotes',
    }),
    check({
      id: 'validation-color-pipeline-asset-matching',
      category: 'color_pipeline',
      label: 'Generated assets match color plan',
      severity: 'error',
      passed: colorPipelineHasAssetMatchesWhenNeeded(plan),
      message: 'Generated image/card/keyframe and AI-video assets should link to color match planning.',
      relatedField: 'visualAssetPlan.colorMatchPlanId',
    }),
    check({
      id: 'validation-color-pipeline-planning-only',
      category: 'color_pipeline',
      label: 'Color pipeline stays planning-only',
      severity: 'blocking',
      passed: colorPipelineToolsArePlanningOnly(plan),
      message: 'Color planning must not imply real FFmpeg/OpenColorIO/OpenCV/Sharp execution or media processing.',
      relatedField: 'colorPipelinePlan.limitations',
    }),
    check({
      id: 'validation-color-pipeline-remotion-boundary',
      category: 'color_pipeline',
      label: 'Remotion is not full color engine',
      severity: 'warning',
      passed: colorPipelineDoesNotTreatRemotionAsGrader(plan),
      message: 'Remotion may preview/compose color-matched assets, but future deterministic tools own actual color processing.',
      relatedField: 'colorPipelinePlan.toolsPlanned',
    }),
    check({
      id: 'validation-color-pipeline-no-veo-1080',
      category: 'color_pipeline',
      label: 'Color plan does not change provider policy',
      severity: 'blocking',
      passed: colorPipelineDoesNotEnableVeoOr1080(plan),
      message: 'Color pipeline planning must not enable Veo or introduce 1080P generation defaults.',
      relatedField: 'colorPipelinePlan',
    }),
    check({
      id: 'validation-color-pipeline-documentary-neutral',
      category: 'color_pipeline',
      label: 'Documentary color remains neutral',
      severity: input.editingCategory === 'documentary_case_study' ? 'warning' : 'info',
      passed: documentaryColorPipelineSafe(plan, input),
      message: 'Documentary/Case Study color should avoid sensational overprocessing unless requested.',
      relatedField: 'colorPipelinePlan.colorGradeStyle',
    }),
    check({
      id: 'validation-audio-pipeline-plan',
      category: 'audio_pipeline',
      label: 'Audio pipeline plan exists',
      severity: 'error',
      passed: audioPipelinePlanExists(plan),
      message: 'Mock edit plans should include a project/clip/timing audio pipeline plan.',
      relatedField: 'audioPipelinePlan',
    }),
    check({
      id: 'validation-audio-pipeline-voice-loudness',
      category: 'audio_pipeline',
      label: 'Professional voice/loudness baseline',
      severity: editLevel === 'basic' ? 'blocking' : 'error',
      passed: audioPipelineHasVoiceLoudness(plan),
      message: 'Basic and all higher tiers need voice leveling and loudness normalization planning.',
      relatedField: 'audioPipelinePlan.projectOperations',
    }),
    check({
      id: 'validation-audio-pipeline-no-music',
      category: 'audio_pipeline',
      label: 'No-music instruction respected',
      severity: /\b(no music|voice only|just voice)\b/i.test(input.customInstructions) ? 'blocking' : 'info',
      passed: audioPipelineRespectsNoMusic(plan, input),
      message: 'No-music and voice-only user instructions must disable the music bed plan.',
      relatedField: 'audioPipelinePlan.musicBedPlan.policy',
    }),
    check({
      id: 'validation-audio-pipeline-ducking',
      category: 'audio_pipeline',
      label: 'Music ducking planned',
      severity: 'warning',
      passed: audioPipelineMusicDuckingSafe(plan),
      message: 'Music must not overpower speech; ducking should be planned when music is present.',
      relatedField: 'audioPipelinePlan.musicBedPlan.duckingEnabled',
    }),
    check({
      id: 'validation-audio-pipeline-sfx-justified',
      category: 'audio_pipeline',
      label: 'SFX are justified, not random',
      severity: 'blocking',
      passed: audioPipelineSfxJustified(plan, input),
      message: 'SFX should have reasons/cues and stay within tier-appropriate density.',
      relatedField: 'audioPipelinePlan.sfxPlan',
    }),
    check({
      id: 'validation-audio-pipeline-planning-only',
      category: 'audio_pipeline',
      label: 'Audio pipeline stays planning-only',
      severity: 'blocking',
      passed: audioPipelineToolsArePlanningOnly(plan),
      message: 'Audio planning must not imply real FFmpeg/Essentia/librosa/Rubber Band/whisper.cpp execution or media processing.',
      relatedField: 'audioPipelinePlan.limitations',
    }),
    check({
      id: 'validation-audio-pipeline-soundsync-boundary',
      category: 'audio_pipeline',
      label: 'SoundSync is not a visual signature system',
      severity: 'blocking',
      passed: audioPipelineSoundSyncNotVisualSignature(plan),
      message: 'SoundSync must remain the audio/timing support engine, not a visual signature system.',
      relatedField: 'audioPipelinePlan.summary',
    }),
    check({
      id: 'validation-audio-pipeline-no-veo-1080',
      category: 'audio_pipeline',
      label: 'Audio plan does not change provider policy',
      severity: 'blocking',
      passed: audioPipelineDoesNotEnableVeoOr1080(plan),
      message: 'Audio pipeline planning must not enable Veo or introduce 1080P generation defaults.',
      relatedField: 'audioPipelinePlan',
    }),
    check({
      id: 'validation-audio-pipeline-approval-gate',
      category: 'audio_pipeline',
      label: 'Audio plan keeps approval gate',
      severity: 'blocking',
      passed: audioPipelineDoesNotBypassApproval(plan),
      message: 'Audio planning must not bypass edit-plan or credit approval.',
      relatedField: 'audioPipelinePlan.limitations',
    }),
    check({
      id: 'validation-audio-pipeline-rubber-band-license',
      category: 'audio_pipeline',
      label: 'Rubber Band license/future flag',
      severity: 'warning',
      passed: audioPipelineRubberBandFlagged(plan),
      message: 'Rubber Band must be marked future/evaluate and license-review when referenced.',
      relatedField: 'audioPipelinePlan.toolsPlanned',
    }),
    check({
      id: 'validation-map-animation-expected',
      category: 'map_animation',
      label: 'Map plan exists when map/location is requested',
      severity: mapSignalExists(plan, input) ? 'warning' : 'info',
      passed: mapAnimationPlanExpectedState(plan, input),
      message: 'Map/location/route/neighborhood requests should create an active controlled map plan.',
      relatedField: 'mapAnimationPlan',
    }),
    check({
      id: 'validation-map-animation-items',
      category: 'map_animation',
      label: 'Active map plan has items',
      severity: 'error',
      passed: mapAnimationPlanHasItems(plan),
      message: 'Active map animation plans need map items with style, camera, layout, and QA.',
      relatedField: 'mapAnimationPlan.items',
    }),
    check({
      id: 'validation-map-animation-controlled-tools',
      category: 'map_animation',
      label: 'Map uses controlled tools',
      severity: 'blocking',
      passed: mapAnimationControlledTools(plan),
      message: 'Exact map visuals should use MapLibre/Turf/Remotion planning instead of AI video.',
      relatedField: 'mapAnimationPlan.items.toolIds',
    }),
    check({
      id: 'validation-map-animation-source-safety',
      category: 'map_animation',
      label: 'Location uncertainty and safe wording',
      severity: input.editingCategory === 'documentary_case_study' ? 'blocking' : 'error',
      passed: mapAnimationSourceSafety(plan, input),
      message: 'Unknown, alleged, or approximate locations need source-needed state and safe wording.',
      relatedField: 'mapAnimationPlan.items.locations',
    }),
    check({
      id: 'validation-map-animation-layout-qa',
      category: 'map_animation',
      label: 'Map layout and QA exist',
      severity: 'warning',
      passed: mapAnimationHasLayoutAndQa(plan),
      message: 'Map items need layout, safe label zones, and QA checks.',
      relatedField: 'mapAnimationPlan.items.layout',
    }),
    check({
      id: 'validation-map-animation-depth-fallback',
      category: 'map_animation',
      label: 'Map behind subject/contact fallback',
      severity: 'warning',
      passed: mapBehindSubjectHasFallback(plan),
      message: 'Map-behind-subject/contact-object plans need foreground awareness and fallback layout.',
      relatedField: 'mapAnimationPlan.items.layout.fallbackLayoutMode',
    }),
    check({
      id: 'validation-map-animation-planning-only',
      category: 'map_animation',
      label: 'Map plan is planning-only',
      severity: 'blocking',
      passed: mapAnimationPlanningOnly(plan),
      message: 'Map planning must not imply real MapLibre/Turf execution, geocoding, tile calls, Mapbox APIs, rendering, or approval bypass.',
      relatedField: 'mapAnimationPlan.limitations',
    }),
    check({
      id: 'validation-map-animation-no-ai-video',
      category: 'map_animation',
      label: 'Map plan does not use AI video/Veo',
      severity: 'blocking',
      passed: mapAnimationNoAiVideoOrVeo(plan),
      message: 'Map planning must not route exact maps to AI video, enable Veo, or introduce 1080P defaults.',
      relatedField: 'mapAnimationPlan.globalRules',
    }),
    check({
      id: 'validation-dataviz-expected',
      category: 'dataviz_plan',
      label: 'Dataviz plan exists when chart/diagram is requested',
      severity: dataVizSignalExists(plan, input) ? 'warning' : 'info',
      passed: dataVizPlanExpectedState(plan, input),
      message: 'Chart/diagram/money-flow/timeline/metric requests should create an active controlled dataviz plan.',
      relatedField: 'dataVizPlan',
    }),
    check({
      id: 'validation-dataviz-items',
      category: 'dataviz_plan',
      label: 'Active dataviz plan has items',
      severity: 'error',
      passed: dataVizPlanHasItems(plan),
      message: 'Active dataviz plans need chart/diagram items with data, style, layout, animation, and QA.',
      relatedField: 'dataVizPlan.items',
    }),
    check({
      id: 'validation-dataviz-controlled-tools',
      category: 'dataviz_plan',
      label: 'Dataviz uses controlled tools',
      severity: 'blocking',
      passed: dataVizControlledTools(plan),
      message: 'Exact chart/diagram visuals should use D3/ECharts/Remotion planning instead of AI video.',
      relatedField: 'dataVizPlan.items.toolIds',
    }),
    check({
      id: 'validation-dataviz-source-safety',
      category: 'dataviz_plan',
      label: 'Data confidence and safe wording',
      severity: input.editingCategory === 'documentary_case_study' ? 'blocking' : 'error',
      passed: dataVizSourceSafety(plan, input),
      message: 'Unknown, claimed, approximate, mock, or fictional data needs source-needed state, flags, and safe wording.',
      relatedField: 'dataVizPlan.items.dataPlan',
    }),
    check({
      id: 'validation-dataviz-layout-qa',
      category: 'dataviz_plan',
      label: 'Dataviz layout and QA exist',
      severity: 'warning',
      passed: dataVizHasLayoutAndQa(plan),
      message: 'Dataviz items need layout, safe label zones, and QA checks.',
      relatedField: 'dataVizPlan.items.layout',
    }),
    check({
      id: 'validation-dataviz-basic-complexity',
      category: 'dataviz_plan',
      label: 'Basic dataviz simplicity',
      severity: input.editLevel === 'basic' ? 'warning' : 'info',
      passed: dataVizBasicComplexityOk(plan, input),
      message: 'Basic should keep dataviz simple and avoid high-density networks or labels.',
      relatedField: 'dataVizPlan.items.style.labelDensity',
    }),
    check({
      id: 'validation-dataviz-planning-only',
      category: 'dataviz_plan',
      label: 'Dataviz plan is planning-only',
      severity: 'blocking',
      passed: dataVizPlanningOnly(plan),
      message: 'Dataviz planning must not imply real D3/ECharts/Vega-Lite execution, chart rendering, data verification, rendering, or approval bypass.',
      relatedField: 'dataVizPlan.limitations',
    }),
    check({
      id: 'validation-dataviz-no-ai-video',
      category: 'dataviz_plan',
      label: 'Dataviz plan does not use AI video/Veo',
      severity: 'blocking',
      passed: dataVizNoAiVideoOrVeo(plan),
      message: 'Dataviz planning must not route exact charts/diagrams to AI video, enable Veo, or introduce 1080P defaults.',
      relatedField: 'dataVizPlan.globalRules',
    }),
    check({
      id: 'validation-video-understanding-mock-only',
      category: 'video_understanding',
      label: 'Understanding stays mock-only',
      severity: 'blocking',
      passed: videoUnderstandingLimitationsAreMockOnly(plan),
      message: 'Video understanding limitations must clearly say no real media analysis has been run.',
      relatedField: 'videoUnderstandingReport.limitations',
    }),
    check({
      id: 'validation-video-understanding-asset-alignment',
      category: 'video_understanding',
      label: 'Visual assets align with understanding',
      severity: 'warning',
      passed: visualPlanAlignsWithUnderstanding(plan),
      message: 'Visual asset planning should reference or align with video-understanding opportunities when possible.',
      relatedField: 'visualAssetPlan',
    }),
    check({
      id: 'validation-video-understanding-layout-alignment',
      category: 'video_understanding',
      label: 'Layout aligns with understanding',
      severity: 'warning',
      passed: layoutPlanAlignsWithUnderstanding(plan),
      message: 'Speaker/visual layout should align with map, screen, evidence, speaker, or depth cues from the report where possible.',
      relatedField: 'speakerVisualLayoutPlan',
    }),
    check({
      id: 'validation-video-understanding-source-order',
      category: 'video_understanding',
      label: 'Source order reflected in report',
      severity: 'warning',
      passed: sourceOrderReflectedInUnderstanding(plan, input),
      message: 'Video understanding should reflect whether source order is confirmed or draft.',
      relatedField: 'videoUnderstandingReport.sourceOrderConfirmed',
    }),
    check({
      id: 'validation-visual-assets',
      category: 'visual_asset_plan',
      label: 'Visual asset plan exists',
      severity: 'error',
      passed: checkExists(plan.visualAssetPlan, true),
      message: 'Visual beats should be planned before prompts or credit estimates.',
      relatedField: 'visualAssetPlan',
    }),
    check({
      id: 'validation-speaker-visual-layout-plan',
      category: 'speaker_visual_layout',
      label: 'Speaker/visual layout plan exists',
      severity: 'error',
      passed: layoutPlanExists(plan),
      message: 'Every mock edit plan should include segment-aware speaker/visual layout strategy.',
      relatedField: 'speakerVisualLayoutPlan',
    }),
    check({
      id: 'validation-speaker-visual-layout-coverage',
      category: 'speaker_visual_layout',
      label: 'Layout covers segments or assets',
      severity: 'error',
      passed: segmentOrAssetLayoutCovered(plan),
      message: 'Each segment should have a layout item, or each visual asset should link to one when segments are unavailable.',
      relatedField: 'speakerVisualLayoutPlan.items',
    }),
    check({
      id: 'validation-provider-routes',
      category: 'model_routing',
      label: 'Provider routes exist',
      severity: 'blocking',
      passed: visualAssetPlan.length > 0 && visualAssetPlan.every((asset) => Boolean(asset.providerRoute)),
      message: 'Every planned visual asset needs a provider route, even if the route is deterministic/editor-only.',
      relatedField: 'visualAssetPlan.providerRoute',
    }),
    check({
      id: 'validation-renderer',
      category: 'renderer_plan',
      label: 'Renderer plan exists',
      severity: 'error',
      passed: checkExists(plan.rendererCompositionPlan),
      message: 'Remotion/composition planning must own the final canvas.',
      relatedField: 'rendererCompositionPlan',
    }),
    check({
      id: 'validation-layout-renderer-reference',
      category: 'speaker_visual_layout',
      label: 'Renderer references layout strategy',
      severity: 'warning',
      passed: rendererReferencesLayoutStrategy(plan),
      message: 'Renderer planning should reference the speaker/visual layout mode, speaker presence, or visual dominance.',
      relatedField: 'rendererCompositionPlan.rendererNotes',
    }),
    check({
      id: 'validation-segments',
      category: 'segment_operations',
      label: 'Segment operations exist',
      severity: 'error',
      passed: checkExists(plan.segmentEditPlans, true),
      message: 'The edit plan should resolve into worker-readable segment operations.',
      relatedField: 'segmentEditPlans',
    }),
    check({
      id: 'validation-qa',
      category: 'qa_plan',
      label: 'QA plan exists',
      severity: 'error',
      passed: checkExists(plan.editQAPlan),
      message: 'QA should check intent, tier rules, frame rules, source order, and professional standards.',
      relatedField: 'editQAPlan',
    }),
    check({
      id: 'validation-credit-estimate',
      category: 'credit_estimate',
      label: 'Credit estimate exists',
      severity: 'blocking',
      passed: typeof plan.creditEstimate?.total === 'number' && plan.creditEstimate.total >= 0,
      message: 'Credits must be estimated before approval or mock progress.',
      relatedField: 'creditEstimate.total',
    }),
    check({
      id: 'validation-credit-breakdown',
      category: 'credit_estimate',
      label: 'Credit estimate breakdown exists',
      severity: 'error',
      passed: Array.isArray(plan.creditEstimate?.breakdown) && plan.creditEstimate.breakdown.length > 0,
      message: 'Credit estimates should explain what the user is approving.',
      relatedField: 'creditEstimate.breakdown',
    }),
    check({
      id: 'validation-approval-required',
      category: 'approval_gate',
      label: 'Approval required',
      severity: 'blocking',
      passed: plan.approvalRequired === true,
      message: 'Mock progress must remain gated by plan and credit estimate approval.',
      relatedField: 'approvalRequired',
    }),
    check({
      id: 'validation-progress-not-started-in-plan',
      category: 'approval_gate',
      label: 'No generation-start flag in plan',
      severity: 'info',
      passed: true,
      message: 'EditPlan has no progress or generation-start field; ChatNativeEditor owns mock approval/progress state.',
      relatedField: 'EditPlan',
    }),
    check({
      id: 'validation-source-sequence-map',
      category: 'source_sequence',
      label: 'Source sequence map exists',
      severity: 'error',
      passed: plan.sourceSequenceMap.length > 0 && plan.sourceSequenceMap.length === input.clips.length,
      message: 'The plan should include a source sequence map for every attached clip.',
      relatedField: 'sourceSequenceMap',
    }),
    check({
      id: 'validation-source-sequence-mode',
      category: 'source_sequence',
      label: 'Source sequence mode exists',
      severity: 'warning',
      passed: Boolean(sourceSequenceMode),
      message: 'Source sequence mode should be tracked before plan approval.',
      relatedField: 'sourceSequenceMode',
    }),
    check({
      id: 'validation-source-order-confirmation-state',
      category: 'source_sequence',
      label: 'Source confirmation state exists',
      severity: 'warning',
      passed: typeof sourceOrderConfirmed === 'boolean',
      message: 'The planner should know whether source order is confirmed or still draft context.',
      relatedField: 'sourceOrderConfirmed',
    }),
    check({
      id: 'validation-multi-clip-source-order-confirmed-before-approval',
      category: 'source_sequence',
      label: 'Multi-clip source order confirmed before approval',
      severity: 'warning',
      passed: !multipleClips || sourceOrderConfirmed === true,
      message: 'Multi-clip plans should confirm source/story order before the user approves credits; this is a warning until UI approval state is supplied to validation.',
      relatedField: 'sourceOrderConfirmed',
      recommendation: 'Keep source sequence expanded in Guided mode until confirmed.',
    }),
    check({
      id: 'validation-source-order-change-resets-approval',
      category: 'approval_gate',
      label: 'Source changes reset approval in UI',
      severity: 'info',
      passed: true,
      message: 'ChatNativeEditor is responsible for resetting plan approval, approved snapshot, mock progress, and preview when source order or clip metadata changes.',
      relatedField: 'ChatNativeEditor.resetAfterSourceChange',
    }),
  ]

  if (editLevel !== 'premium') {
    checks.push(
      check({
        id: 'validation-basic-pro-no-veo-routes',
        category: 'tier_policy',
        label: 'Basic/Pro no Veo routes',
        severity: 'blocking',
        passed: !visualAssetPlan.some(routeHasVeo),
        message: 'Basic and Pro must not include Veo in primary models, fallback models, or fallback steps.',
        relatedField: 'visualAssetPlan.providerRoute',
      }),
      check({
        id: 'validation-basic-pro-no-veo-prompts',
        category: 'tier_policy',
        label: 'Basic/Pro no allowed Veo prompts',
        severity: 'blocking',
        passed: !promptPlans.some(allowedVeoPrompt),
        message: 'Basic and Pro must not produce allowed Veo prompt plans.',
        relatedField: 'providerPromptPlans',
      }),
      check({
        id: 'validation-basic-pro-no-veo-qa',
        category: 'tier_policy',
        label: 'Basic/Pro no QA Veo fallback',
        severity: 'blocking',
        passed: !allFallbackSteps.some(fallbackStepUsesVeo),
        message: 'Basic and Pro QA fallback must use retry, simplify, split, stills, motion design, or review rather than Veo.',
        relatedField: 'editQAPlan',
      }),
      check({
        id: 'validation-basic-pro-credit-no-veo',
        category: 'credit_estimate',
        label: 'Basic/Pro credit policy excludes Veo',
        severity: 'blocking',
        passed: !creditPolicyMentionsAllowedVeoForBasicPro(plan),
        message: 'Basic/Pro credit policy notes must not present Veo as available.',
        relatedField: 'creditEstimate.fallbackPolicyNotes',
      }),
    )
  } else {
    checks.push(
      check({
        id: 'validation-premium-veo-fallback-only',
        category: 'tier_policy',
        label: 'Premium Veo fallback-only',
        severity: 'blocking',
        passed: visualAssetPlan.every((asset) => !routeHasVeo(asset) || routeVeoIsFinalFallback(asset)),
        message: 'Premium may include Veo only as final fallback/rescue and never as primary/default.',
        relatedField: 'visualAssetPlan.providerRoute',
      }),
      check({
        id: 'validation-premium-credit-veo-policy',
        category: 'credit_estimate',
        label: 'Premium credit policy keeps Veo fallback-only',
        severity: 'warning',
        passed: premiumCreditPolicyHasFallbackOnlyVeo(plan),
        message: 'Premium credit policy notes should describe Veo as final fallback only when Veo is mentioned.',
        relatedField: 'creditEstimate.fallbackPolicyNotes',
      }),
    )
  }

  checks.push(
    check({
      id: 'validation-no-primary-veo',
      category: 'model_routing',
      label: 'No primary Veo',
      severity: 'blocking',
      passed: !visualAssetPlan.some(routeHasPrimaryVeo),
      message: 'No route may use Veo 3.1 Lite as the primary/default model.',
      relatedField: 'visualAssetPlan.providerRoute.primaryModel',
    }),
    check({
      id: 'validation-no-seedance',
      category: 'model_routing',
      label: 'Seedance excluded',
      severity: 'blocking',
      passed: !allRouteText.includes('seedance'),
      message: 'Seedance is not part of the launch router.',
      relatedField: 'visualAssetPlan.providerRoute',
    }),
    check({
      id: 'validation-no-1080p-default',
      category: 'resolution_policy',
      label: 'No default 1080P',
      severity: 'blocking',
      passed: !visualAssetPlan.some((asset) => asset.providerRoute.resolution === '1080P') &&
        !promptPlans.some((promptPlan) => promptPlan.resolution === '1080P'),
      message: 'Generated routes and prompt plans must not default to 1080P.',
      relatedField: 'visualAssetPlan.providerRoute.resolution',
    }),
    check({
      id: 'validation-model-resolution-policy',
      category: 'resolution_policy',
      label: 'Primary model resolution policy',
      severity: 'error',
      passed: visualAssetPlan.every(resolutionMatchesPrimary),
      message: 'Primary generated routes should keep Wan 720P, Hailuo 768P, and Veo 720P.',
      relatedField: 'visualAssetPlan.providerRoute',
    }),
    check({
      id: 'validation-route-fallback-models-known',
      category: 'model_routing',
      label: 'Fallback models stay routed',
      severity: 'error',
      passed: visualAssetPlan.every((asset) => providerRouteModels(asset).every(Boolean)),
      message: 'Fallback models and fallback steps should stay explicit and typed.',
      relatedField: 'visualAssetPlan.providerRoute.fallbackModels',
    }),
    check({
      id: 'validation-veo-prompt-type',
      category: 'prompt_plans',
      label: 'Veo prompt is fallback prompt only',
      severity: 'blocking',
      passed: !promptPlans.some(promptIsPrimaryVeo) &&
        promptPlans.every((promptPlan) => !providerUsesVeo(promptPlan.providerModel) || (editLevel === 'premium' && promptPlan.planType === 'veo_fallback_prompt')),
      message: 'Any allowed Veo prompt must be Premium-only and typed as a final fallback prompt.',
      relatedField: 'providerPromptPlans',
    }),
    check({
      id: 'validation-prompts-background',
      category: 'frame_background',
      label: 'Prompt background policy',
      severity: 'error',
      passed: promptPlans.length === 0 || promptPlans.every(promptHasMatchingPanelBackground),
      message: 'Prompt plans should preserve matching panel background and safe-margin instructions.',
      relatedField: 'providerPromptPlans',
    }),
    check({
      id: 'validation-no-transparent-default',
      category: 'frame_background',
      label: 'No transparent AI-video default',
      severity: 'blocking',
      passed: !promptPlans.some(promptRequestsTransparentDefault),
      message: 'Prompt plans must not request transparent AI-video background as the default.',
      relatedField: 'providerPromptPlans',
    }),
    check({
      id: 'validation-provider-ownership',
      category: 'prompt_plans',
      label: 'Provider prompts stay asset-scoped',
      severity: 'error',
      passed: promptPlans.every(promptKeepsProviderAssetScoped),
      message: 'Image/video providers create assets only; Remotion/ReeditPro owns final composition.',
      relatedField: 'providerPromptPlans',
    }),
    check({
      id: 'validation-prompts-layout-implications',
      category: 'speaker_visual_layout',
      label: 'Prompts include layout implications',
      severity: 'warning',
      passed: promptPlansIncludeLayoutImplications(promptPlans),
      message: 'Provider and Remotion prompt plans should mention speaker/visual layout mode or layout implications.',
      relatedField: 'providerPromptPlans',
    }),
    check({
      id: 'validation-ai-video-prompts-panel',
      category: 'prompt_plans',
      label: 'AI-video prompts mention panel background',
      severity: 'error',
      passed: promptPlans
        .filter((promptPlan) => videoPromptTypes.includes(promptPlan.planType))
        .every(promptHasMatchingPanelBackground),
      message: 'AI-video prompt plans must include matching panel background instructions.',
      relatedField: 'providerPromptPlans',
    }),
    check({
      id: 'validation-panel-background',
      category: 'frame_background',
      label: 'Matching panel background',
      severity: 'error',
      passed: Boolean(plan.rendererCompositionPlan?.panelBackgroundColor),
      message: 'Renderer plan must define a panel background for generated assets.',
      relatedField: 'rendererCompositionPlan.panelBackgroundColor',
    }),
    check({
      id: 'validation-frame-template',
      category: 'frame_background',
      label: 'Frame template selected',
      severity: 'warning',
      passed: Boolean(input.frameTemplateType && input.frameTemplateType !== 'let_ai_decide') &&
        Boolean(plan.rendererCompositionPlan?.frameTemplate.templateType),
      message: 'Frame template should be selected before generation planning.',
      relatedField: 'frameTemplateType',
    }),
    check({
      id: 'validation-ai-video-renderer-layer',
      category: 'renderer_plan',
      label: 'AI-video assets have renderer placement',
      severity: 'error',
      passed: aiVideoAssets.every((asset) => assetHasRendererLayer(asset, plan) || asset.providerRoute.primaryModel === 'none'),
      message: 'AI video assets should be placed in controlled renderer panels/layers.',
      relatedField: 'rendererCompositionPlan.layers',
    }),
    check({
      id: 'validation-remotion-owns-canvas',
      category: 'renderer_plan',
      label: 'Remotion owns final canvas',
      severity: 'error',
      passed: rendererNotesSayRemotionOwnsCanvas(plan),
      message: 'Renderer notes should state that Remotion/ReeditPro owns final composition.',
      relatedField: 'rendererCompositionPlan.rendererNotes',
    }),
    check({
      id: 'validation-renderer-references-render-strategy',
      category: 'render_strategy',
      label: 'Renderer references render strategy',
      severity: 'warning',
      passed: rendererReferencesRenderStrategy(plan),
      message: 'Renderer planning should summarize render strategy types, capabilities, tools, or worker notes.',
      relatedField: 'rendererCompositionPlan.rendererNotes',
    }),
    check({
      id: 'validation-layout-basic-safe',
      category: 'speaker_visual_layout',
      label: 'Basic uses safe layouts',
      severity: 'warning',
      passed: !basicHasUnsafeLayout(plan, editLevel),
      message: 'Basic should avoid premium, advanced, or high-risk layout modes; use safer fallbacks instead.',
      relatedField: 'speakerVisualLayoutPlan.items',
    }),
    check({
      id: 'validation-layout-risky-fallback',
      category: 'speaker_visual_layout',
      label: 'Risky layouts have fallback',
      severity: 'error',
      passed: riskyLayoutsHaveFallback(plan),
      message: 'Moderate, advanced, premium, or risky layout modes should include fallbackLayoutMode.',
      relatedField: 'speakerVisualLayoutPlan.items.fallbackLayoutMode',
    }),
    check({
      id: 'validation-layout-aspect-fit',
      category: 'speaker_visual_layout',
      label: 'Layout modes fit aspect ratio',
      severity: 'warning',
      passed: layoutModesMatchAspectRatio(plan, input),
      message: 'Layout modes should match the requested platform/aspect ratio.',
      relatedField: 'speakerVisualLayoutPlan.items.recommendedForAspectRatio',
    }),
    check({
      id: 'validation-layout-future-compositing-mock-only',
      category: 'speaker_visual_layout',
      label: 'Future compositing stays mock-only',
      severity: 'blocking',
      passed: futureLayoutModesAreMockOnly(plan),
      message: 'Speaker cutout and object-anchored callout plans must not be treated as executed masking, depth, or tracking work yet.',
      relatedField: 'speakerVisualLayoutPlan.items',
    }),
    check({
      id: 'validation-depth-request-covered',
      category: 'depth_aware_overlay',
      label: 'Depth request covered',
      severity: depthLanguageRequested(input) ? 'warning' : 'info',
      passed: !depthLanguageRequested(input) || depthPlanActive(plan),
      message: 'If the user asks for behind-subject, foreground, pole, or depth language, the plan should activate depth-aware overlay planning or explain a safe fallback.',
      relatedField: 'depthAwareOverlayPlan',
    }),
    check({
      id: 'validation-depth-active-items',
      category: 'depth_aware_overlay',
      label: 'Active depth plan has items',
      severity: plan.depthAwareOverlayPlan?.active ? 'error' : 'info',
      passed: !plan.depthAwareOverlayPlan?.active || (plan.depthAwareOverlayPlan.items.length > 0),
      message: 'An active depth-aware overlay plan must include planned items.',
      relatedField: 'depthAwareOverlayPlan.items',
    }),
    check({
      id: 'validation-depth-risk-fallback',
      category: 'depth_aware_overlay',
      label: 'Depth risk has fallback',
      severity: depthPlanActive(plan) ? 'error' : 'info',
      passed: depthRiskyItemsHaveFallback(plan),
      message: 'Medium, high, and premium depth effects must include fallback layout modes.',
      relatedField: 'depthAwareOverlayPlan.items.fallbackLayoutMode',
    }),
    check({
      id: 'validation-depth-caption-qa',
      category: 'depth_aware_overlay',
      label: 'Depth caption and QA rules',
      severity: depthPlanActive(plan) ? 'error' : 'info',
      passed: !depthPlanActive(plan) || (plan.depthAwareOverlayPlan?.items.every((item) => item.captionLayerRule && item.qaChecks.length > 0) ?? false),
      message: 'Depth items should define caption layer rules and QA checks.',
      relatedField: 'depthAwareOverlayPlan.items',
    }),
    check({
      id: 'validation-depth-basic-safe',
      category: 'depth_aware_overlay',
      label: 'Basic avoids complex depth masks',
      severity: editLevel === 'basic' ? 'blocking' : 'info',
      passed: !basicHasUnsafeDepth(plan, editLevel),
      message: 'Basic should avoid complex subject, contact object, hero object, multi-object, or cutout masks and prefer safer fallback layouts.',
      relatedField: 'depthAwareOverlayPlan.items',
    }),
    check({
      id: 'validation-depth-mock-only',
      category: 'depth_aware_overlay',
      label: 'Depth stays mock-only',
      severity: 'blocking',
      passed: depthModesAreMockOnly(plan),
      message: 'Depth-aware overlay plans must not imply real segmentation, mask execution, tracking, OpenCV, or rendering in the frontend mock.',
      relatedField: 'depthAwareOverlayPlan.items.workerNotes',
    }),
    check({
      id: 'validation-depth-renderer-reference',
      category: 'renderer_plan',
      label: 'Renderer references depth layers',
      severity: depthPlanActive(plan) ? 'error' : 'info',
      passed: rendererReferencesDepthPlan(plan),
      message: 'Renderer planning should reference depth-aware layer notes when a depth plan is active.',
      relatedField: 'rendererCompositionPlan.rendererNotes',
    }),
    check({
      id: 'validation-depth-prompt-implications',
      category: 'prompt_plans',
      label: 'Prompts include depth implications',
      severity: depthPlanActive(plan) ? 'warning' : 'info',
      passed: promptPlansIncludeDepthImplications(promptPlans, plan),
      message: 'Prompt plans should mention depth mode, foreground spacing, future mask worker, or contact-object implications when depth is active.',
      relatedField: 'providerPromptPlans',
    }),
    check({
      id: 'validation-render-strategy-prompt-implications',
      category: 'render_strategy',
      label: 'Prompts include render strategy',
      severity: 'warning',
      passed: promptPlansIncludeRenderStrategy(promptPlans, plan),
      message: 'Prompt plans and Remotion briefs should include render strategy implications when a render strategy plan exists.',
      relatedField: 'providerPromptPlans',
    }),
    check({
      id: 'validation-tool-strategy-prompt-implications',
      category: 'tool_strategy',
      label: 'Prompts include tool strategy',
      severity: 'warning',
      passed: promptPlansIncludeToolStrategy(promptPlans, plan),
      message: 'Prompt plans and Remotion/tool briefs should include tool strategy implications when a tool strategy plan exists.',
      relatedField: 'providerPromptPlans',
    }),
    check({
      id: 'validation-depth-contact-object',
      category: 'depth_aware_overlay',
      label: 'Subject plus contact object represented',
      severity: contactDepthItems(plan).length ? 'error' : 'info',
      passed: contactDepthItemsHaveContactObjects(plan),
      message: 'graphic_behind_subject_and_contact_objects items must include a contact object plan.',
      relatedField: 'depthAwareOverlayPlan.items.foregroundObjects',
    }),
    check({
      id: 'validation-depth-contact-group',
      category: 'depth_aware_overlay',
      label: 'Contact foreground group represented',
      severity: contactDepthItems(plan).length ? 'error' : 'info',
      passed: contactDepthItemsHaveGroups(plan),
      message: 'graphic_behind_subject_and_contact_objects items must include a foreground depth group preserving subject plus contact object.',
      relatedField: 'depthAwareOverlayPlan.items.foregroundDepthGroups',
    }),
    check({
      id: 'validation-depth-contact-qa',
      category: 'depth_aware_overlay',
      label: 'Contact preservation QA exists',
      severity: contactDepthItems(plan).length ? 'warning' : 'info',
      passed: contactDepthQaExists(plan),
      message: 'Contact object depth items should include QA/worker notes for contact object preservation.',
      relatedField: 'depthAwareOverlayPlan.items.qaChecks',
    }),
    check({
      id: 'validation-professional-settings',
      category: 'professional_editing',
      label: 'Professional editing settings',
      severity: 'error',
      passed: professionalSettingsComplete(plan),
      message: 'Professional directive must include style, pacing, color, captions, b-roll, sound, and transition families.',
      relatedField: 'professionalEditingDirective',
    }),
    check({
      id: 'validation-basic-professional',
      category: 'professional_editing',
      label: 'Basic professional baseline',
      severity: 'info',
      passed: editLevel !== 'basic' || (directive?.qaChecks.some((qaCheck) => /professional|basic/i.test(qaCheck)) ?? false),
      message: 'Basic must remain professional, lower-compute, and not low-quality.',
      relatedField: 'professionalEditingDirective.qaChecks',
    }),
    check({
      id: 'validation-segment-plan-completeness',
      category: 'segment_operations',
      label: 'Segment plans are worker-readable',
      severity: 'error',
      passed: segmentPlansComplete(plan),
      message: 'Each segment should include operations, captions, color, sound, transitions, QA, and final timing.',
      relatedField: 'segmentEditPlans',
    }),
    check({
      id: 'validation-qa-tier-policy',
      category: 'qa_plan',
      label: 'QA tier policy checks exist',
      severity: 'error',
      passed: Boolean(plan.editQAPlan?.tierPolicyChecks.length) &&
        qaHasCategoryOrText(plan, editLevel === 'premium' ? /premium|final fallback|veo/i : /basic\/pro|no veo|veo lock/i),
      message: 'QA must include model/tier policy checks for the selected edit level.',
      relatedField: 'editQAPlan.tierPolicyChecks',
    }),
    check({
      id: 'validation-qa-approval-checks',
      category: 'qa_plan',
      label: 'QA approval checks exist',
      severity: 'error',
      passed: Boolean(plan.editQAPlan?.approvalChecks.length) && qaHasCategoryOrText(plan, /approval|credit/i),
      message: 'QA must verify plan and credit approval gates.',
      relatedField: 'editQAPlan.approvalChecks',
    }),
    check({
      id: 'validation-qa-frame-model-checks',
      category: 'qa_plan',
      label: 'QA frame/model checks exist',
      severity: 'error',
      passed: qaHasCategoryOrText(plan, /frame|panel|render|model|veo|1080p/i),
      message: 'QA should include frame layout, renderer, and model routing checks.',
      relatedField: 'editQAPlan',
    }),
    check({
      id: 'validation-documentary-fact-safety',
      category: 'fact_safety',
      label: 'Documentary fact safety',
      severity: input.editingCategory === 'documentary_case_study' ? 'blocking' : 'info',
      passed: input.editingCategory !== 'documentary_case_study' || Boolean(plan.documentaryFactSafetyPlan?.active),
      message: 'Documentary / Case Study plans should activate fact safety for names, claims, timelines, and evidence visuals.',
      relatedField: 'documentaryFactSafetyPlan',
    }),
    check({
      id: 'validation-documentary-claims-present',
      category: 'fact_safety',
      label: 'Documentary claims or notes exist',
      severity: input.editingCategory === 'documentary_case_study' ? 'blocking' : 'info',
      passed: input.editingCategory !== 'documentary_case_study' ||
        Boolean((plan.documentaryFactSafetyPlan?.claimItems.length ?? 0) > 0 || (plan.documentaryFactSafetyPlan?.notes.length ?? 0) > 0),
      message: 'Documentary plans should capture claim items or safety notes.',
      relatedField: 'documentaryFactSafetyPlan.claimItems',
    }),
    check({
      id: 'validation-uncertain-claims-neutral',
      category: 'fact_safety',
      label: 'Uncertain claims stay neutral',
      severity: 'blocking',
      passed: factSafetyClaimTreatmentsAreNeutral(plan),
      message: 'Unknown, alleged, charged, or source-attributed claims must use neutral visual treatment.',
      relatedField: 'documentaryFactSafetyPlan.claimItems',
    }),
    check({
      id: 'validation-character-consistency',
      category: 'character_consistency',
      label: 'Character consistency',
      severity: input.editingCategory === 'storytelling' || input.editingCategory === 'documentary_case_study' ? 'warning' : 'info',
      passed: !(input.editingCategory === 'storytelling' || input.editingCategory === 'documentary_case_study') || Boolean(plan.characterConsistencyPlan?.packs.length),
      message: 'Storytelling and documentary scenarios with recurring figures should plan character packs.',
      relatedField: 'characterConsistencyPlan',
    }),
    check({
      id: 'validation-character-pack-rules',
      category: 'character_consistency',
      label: 'Character packs have consistency and safety rules',
      severity: 'warning',
      passed: characterPacksHaveRules(plan),
      message: 'Character packs should include consistency rules, and real/unknown packs need avoid rules.',
      relatedField: 'characterConsistencyPlan.packs',
    }),
    check({
      id: 'validation-credit-policy-notes',
      category: 'credit_estimate',
      label: 'Credit policy notes',
      severity: 'warning',
      passed: Boolean(plan.creditEstimate.fallbackPolicyNotes?.length),
      message: 'Credit estimate should include policy notes for approval, internal provider costs, and Veo tier policy.',
      relatedField: 'creditEstimate.fallbackPolicyNotes',
    }),
    ...demoScenarioChecks({ input, plan, scenarioId }),
  )

  return createReport({
    id: `plan-validation-${scenarioId ?? input.editingCategory}-${editLevel}`,
    checks,
    passedSummary: 'Mock plan follows the current ReeditPro planning rules.',
    failedSummary: 'Fix these before this would be production-ready.',
  })
}

export function validateApprovedSnapshot(snapshot: ApprovedPlanSnapshot): PlanValidationReport {
  const editLevel = snapshot.compiledIntent?.resolvedSettings.editLevel ??
    snapshot.creditEstimateDomain.editLevel ??
    snapshot.creditEstimate.edit_level
  const constraintText = [
    ...snapshot.tierConstraints,
    ...snapshot.modelRoutingConstraints,
    ...snapshot.frameBackgroundPolicy,
    ...snapshot.fallbackPolicy,
  ].join(' ').toLowerCase()
  const checks: PlanValidationCheck[] = [
    check({
      id: 'snapshot-plan-version-id',
      category: 'approved_snapshot',
      label: 'Snapshot has plan version',
      severity: 'blocking',
      passed: Boolean(snapshot.editPlanVersionId),
      message: 'Approved snapshots must point to the exact approved plan version.',
      relatedField: 'editPlanVersionId',
    }),
    check({
      id: 'snapshot-credit-estimate-id',
      category: 'approved_snapshot',
      label: 'Snapshot has credit estimate',
      severity: 'blocking',
      passed: Boolean(snapshot.creditEstimateId),
      message: 'Approved snapshots must point to the exact approved credit estimate.',
      relatedField: 'creditEstimateId',
    }),
    check({
      id: 'snapshot-compiled-intent',
      category: 'compiled_intent',
      label: 'Snapshot has compiled intent',
      severity: 'blocking',
      passed: Boolean(snapshot.compiledIntent),
      message: 'Workers execute compiled intent and approved plan data, not raw chat.',
      relatedField: 'compiledIntent',
    }),
    check({
      id: 'snapshot-visual-plan',
      category: 'visual_asset_plan',
      label: 'Snapshot has visual asset plan',
      severity: 'error',
      passed: Boolean((snapshot.visualAssetPlanDomain?.length ?? snapshot.visualAssetPlan.length) > 0),
      message: 'Approved snapshots should freeze visual asset planning.',
      relatedField: 'visualAssetPlan',
    }),
    check({
      id: 'snapshot-video-understanding-report',
      category: 'video_understanding',
      label: 'Snapshot has video understanding report',
      severity: 'error',
      passed: Boolean(snapshot.videoUnderstandingReport ?? snapshot.sourcePlan.videoUnderstandingReport),
      message: 'Approved snapshots should freeze mock video understanding for future workers.',
      relatedField: 'videoUnderstandingReport',
    }),
    check({
      id: 'snapshot-adaptive-edit-strategy',
      category: 'video_understanding',
      label: 'Snapshot has adaptive strategy',
      severity: 'warning',
      passed: Boolean(snapshot.adaptiveEditStrategy ?? snapshot.sourcePlan.adaptiveEditStrategy),
      message: 'Approved snapshots should freeze adaptive strategy notes that shaped visual/layout decisions.',
      relatedField: 'adaptiveEditStrategy',
    }),
    check({
      id: 'snapshot-adaptive-edit-strategy-plan',
      category: 'adaptive_strategy',
      label: 'Snapshot has adaptive strategy plan',
      severity: 'warning',
      passed: Boolean(snapshot.adaptiveEditStrategyPlan ?? snapshot.sourcePlan.adaptiveEditStrategyPlan),
      message: 'Approved snapshots should freeze the typed adaptive strategy plan that shaped segment decisions.',
      relatedField: 'adaptiveEditStrategyPlan',
    }),
    check({
      id: 'snapshot-render-strategy-plan',
      category: 'render_strategy',
      label: 'Snapshot has render strategy plan',
      severity: 'warning',
      passed: Boolean(snapshot.renderStrategyPlan ?? snapshot.sourcePlan.renderStrategyPlan),
      message: 'Approved snapshots should freeze render strategy decisions for future workers and renderer planning.',
      relatedField: 'renderStrategyPlan',
    }),
    check({
      id: 'snapshot-tool-strategy-plan',
      category: 'tool_strategy',
      label: 'Snapshot has tool strategy plan',
      severity: 'warning',
      passed: Boolean(snapshot.toolStrategyPlan ?? snapshot.sourcePlan.toolStrategyPlan),
      message: 'Approved snapshots should freeze tool strategy decisions, settings, and planning-only worker boundaries.',
      relatedField: 'toolStrategyPlan',
    }),
    check({
      id: 'snapshot-color-pipeline-plan',
      category: 'color_pipeline',
      label: 'Snapshot has color pipeline plan',
      severity: 'warning',
      passed: Boolean(snapshot.colorPipelinePlan ?? snapshot.sourcePlan.colorPipelinePlan),
      message: 'Approved snapshots should freeze project, clip, and asset color pipeline planning for future workers.',
      relatedField: 'colorPipelinePlan',
    }),
    check({
      id: 'snapshot-audio-pipeline-plan',
      category: 'audio_pipeline',
      label: 'Snapshot has audio pipeline plan',
      severity: 'warning',
      passed: Boolean(snapshot.audioPipelinePlan ?? snapshot.sourcePlan.audioPipelinePlan),
      message: 'Approved snapshots should freeze project, clip, and SoundSync audio pipeline planning for future workers.',
      relatedField: 'audioPipelinePlan',
    }),
    check({
      id: 'snapshot-map-animation-plan',
      category: 'map_animation',
      label: 'Snapshot has map animation plan',
      severity: snapshot.sourcePlan.mapAnimationPlan?.active ? 'warning' : 'info',
      passed: Boolean(snapshot.mapAnimationPlan ?? snapshot.sourcePlan.mapAnimationPlan),
      message: 'Approved snapshots should freeze map/location planning, source confidence, and map worker boundaries.',
      relatedField: 'mapAnimationPlan',
    }),
    check({
      id: 'snapshot-dataviz-plan',
      category: 'dataviz_plan',
      label: 'Snapshot has dataviz plan',
      severity: snapshot.sourcePlan.dataVizPlan?.active ? 'warning' : 'info',
      passed: Boolean(snapshot.dataVizPlan ?? snapshot.sourcePlan.dataVizPlan),
      message: 'Approved snapshots should freeze chart/diagram planning, data confidence, and dataviz worker boundaries.',
      relatedField: 'dataVizPlan',
    }),
    check({
      id: 'snapshot-speaker-visual-layout-plan',
      category: 'speaker_visual_layout',
      label: 'Snapshot has speaker/visual layout plan',
      severity: 'error',
      passed: Boolean(snapshot.speakerVisualLayoutPlan?.items.length),
      message: 'Approved snapshots should freeze speaker/visual layout decisions for future workers.',
      relatedField: 'speakerVisualLayoutPlan',
    }),
    check({
      id: 'snapshot-depth-aware-overlay-plan',
      category: 'depth_aware_overlay',
      label: 'Snapshot has depth-aware overlay plan',
      severity: snapshot.sourcePlan.depthAwareOverlayPlan?.active ? 'error' : 'info',
      passed: !snapshot.sourcePlan.depthAwareOverlayPlan?.active || Boolean(snapshot.depthAwareOverlayPlan?.items.length),
      message: 'Approved snapshots should freeze active depth-aware overlay decisions for future workers.',
      relatedField: 'depthAwareOverlayPlan',
    }),
    check({
      id: 'snapshot-renderer-plan',
      category: 'renderer_plan',
      label: 'Snapshot has renderer composition',
      severity: 'error',
      passed: Boolean(snapshot.rendererCompositionPlanDomain || snapshot.rendererCompositionPlan),
      message: 'Approved snapshots should freeze renderer composition planning.',
      relatedField: 'rendererCompositionPlan',
    }),
    check({
      id: 'snapshot-tier-constraints',
      category: 'tier_policy',
      label: 'Snapshot has tier constraints',
      severity: 'blocking',
      passed: editLevel === 'premium'
        ? constraintText.includes('veo') && constraintText.includes('fallback')
        : constraintText.includes('cannot use veo') || constraintText.includes('no veo'),
      message: 'Approved snapshots must freeze Basic/Pro no-Veo or Premium fallback-only Veo policy.',
      relatedField: 'tierConstraints',
    }),
    check({
      id: 'snapshot-background-policy',
      category: 'frame_background',
      label: 'Snapshot has matching panel background policy',
      severity: 'blocking',
      passed: constraintText.includes('matching panel') && constraintText.includes('transparent') && constraintText.includes('not the default'),
      message: 'Approved snapshots must freeze matching panel background and no-transparent-default policy.',
      relatedField: 'frameBackgroundPolicy',
    }),
    check({
      id: 'snapshot-rules',
      category: 'approved_snapshot',
      label: 'Snapshot has must/avoid rules',
      severity: 'error',
      passed: snapshot.mustFollowRules.length > 0 || snapshot.avoidRules.length > 0,
      message: 'Workers need approved must-follow and avoid rules.',
      relatedField: 'mustFollowRules / avoidRules',
    }),
    check({
      id: 'snapshot-version',
      category: 'approved_snapshot',
      label: 'Snapshot version exists',
      severity: 'blocking',
      passed: Boolean(snapshot.snapshotVersion),
      message: 'Approved snapshots need an explicit snapshot version.',
      relatedField: 'snapshotVersion',
    }),
  ]

  return createReport({
    id: `approved-snapshot-validation-${snapshot.id}`,
    checks,
    passedSummary: 'Approved snapshot contains the expected frozen planning data.',
    failedSummary: 'Snapshot is missing data future workers would need before execution.',
  })
}
