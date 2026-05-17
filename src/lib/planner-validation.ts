import type { ApprovedPlanSnapshot } from '../types/edit-planning-db'
import type {
  EditLevel,
  EditPlan,
  FallbackStep,
  PlannerInput,
  ProviderModel,
  ProviderPromptPlan,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import { getDemoScenarioById } from './demo-scenarios'

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
  | 'professional_editing'
  | 'visual_asset_plan'
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
  const routeSystems = plan.signatureRoutes.map((route) => route.system).join(' ').toLowerCase()
  const expectsNoVeo = expectedPolicyText.includes('no veo')
  const expectsMatchingBackground = expectedPolicyText.includes('matching panel background')
  const expectsFactSafety = expectedSafetyText.includes('fact safety')
  const expectsCharacter = expectedSafetyText.includes('character')
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
      id: 'validation-visual-assets',
      category: 'visual_asset_plan',
      label: 'Visual asset plan exists',
      severity: 'error',
      passed: checkExists(plan.visualAssetPlan, true),
      message: 'Visual beats should be planned before prompts or credit estimates.',
      relatedField: 'visualAssetPlan',
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
