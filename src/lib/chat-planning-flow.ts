import type { PlanValidationReport, PlannerRegressionReport } from './planner-validation'
import type {
  ChatCardStatus,
  ChatPlanningCardDescriptor,
  ChatPlanningDisplayMode,
  ChatPlanningPhase,
  ChatPlanningPhaseSummary,
  EditPlan,
} from '../types/reeditpro'
import { getSourceSequenceModeLabel } from './source-sequence'
import { getFrontendToolInstallSummary } from './tool-install-status'

type GetChatPlanningCardsParams = {
  clipsAttached: boolean
  clipCount: number
  sourceOrderConfirmed: boolean
  formatConfirmed: boolean
  editLevelConfirmed: boolean
  visualPreferenceConfirmed: boolean
  intentApproved: boolean
  approved: boolean
  previewReady: boolean
  plan: EditPlan
  selectedScenarioId: string
  validationReport: PlanValidationReport
  regressionReport: PlannerRegressionReport
}

const phaseLabels: Record<ChatPlanningPhase, string> = {
  credits_approval: 'Credits and approval',
  edit_setup: 'Edit setup',
  execution_preview: 'Execution preview',
  plan: 'Plan',
  safety_qa: 'Safety and QA',
  source_sequence: 'Source sequence',
  start: 'Start',
  understanding: 'Understanding',
}

const phaseOrder: ChatPlanningPhase[] = [
  'start',
  'source_sequence',
  'edit_setup',
  'understanding',
  'plan',
  'safety_qa',
  'credits_approval',
  'execution_preview',
]

const completeStatuses: ChatCardStatus[] = ['confirmed', 'approved', 'complete']

function descriptor(params: ChatPlanningCardDescriptor): ChatPlanningCardDescriptor {
  return params
}

function reportStatus(status: PlanValidationReport['status'] | PlannerRegressionReport['status']): ChatCardStatus {
  if (status === 'failed') {
    return 'blocking'
  }

  if (status === 'warning') {
    return 'warning'
  }

  return 'complete'
}

function qaStatus(plan: EditPlan): ChatCardStatus {
  const status = plan.editQAPlan?.status

  if (status === 'failed' || status === 'blocked') {
    return 'blocking'
  }

  if (status === 'warning' || status === 'needs_user_review' || status === 'retry_allowed') {
    return 'warning'
  }

  return status ? 'ready' : 'not_started'
}

function hasFactSafetyConcern(plan: EditPlan) {
  const factSafety = plan.documentaryFactSafetyPlan

  return Boolean(
    factSafety?.active &&
      factSafety.claimItems.some((item) =>
        item.sourceNeeded ||
        item.claimStatus === 'unknown' ||
        item.claimStatus === 'allegation' ||
        item.claimStatus === 'charge' ||
        item.claimStatus === 'claim_by_source',
      ),
  )
}

function hasCharacterConcern(plan: EditPlan) {
  const packs = plan.characterConsistencyPlan?.packs ?? []

  return packs.some((pack) =>
    pack.importance === 'primary' ||
    pack.realityStatus === 'real_named_person' ||
    pack.realityStatus === 'public_figure' ||
    pack.realityStatus === 'unknown',
  )
}

function hasQaConcern(plan: EditPlan) {
  return qaStatus(plan) === 'warning' || qaStatus(plan) === 'blocking'
}

function validationCategoryStatus(report: PlanValidationReport, category: string): ChatCardStatus | undefined {
  const failedChecks = report.checks.filter((check) => check.category === category && !check.passed)

  if (failedChecks.some((check) => check.severity === 'blocking' || check.severity === 'error')) {
    return 'blocking'
  }

  if (failedChecks.some((check) => check.severity === 'warning')) {
    return 'warning'
  }

  return undefined
}

function speakerVisualLayoutSummary(plan: EditPlan) {
  const items = plan.speakerVisualLayoutPlan?.items ?? []
  const modes = new Set(items.map((item) => item.layoutMode))
  const highRiskCount = items.filter((item) => item.riskLevel === 'high' || item.riskLevel === 'premium').length
  const fallbackCount = items.filter((item) => item.fallbackLayoutMode).length

  if (items.length === 0) {
    return 'Speaker/visual layout strategy is not ready.'
  }

  return `${items.length} segment layout decision${items.length === 1 ? '' : 's'} across ${modes.size} mode${modes.size === 1 ? '' : 's'}; ${highRiskCount} high-risk, ${fallbackCount} fallback planned.`
}

function depthAwareOverlaySummary(plan: EditPlan) {
  const depthPlan = plan.depthAwareOverlayPlan

  if (!depthPlan?.active) {
    return 'No depth-aware overlay planned; normal layout is sufficient.'
  }

  const modes = new Set(depthPlan.items.map((item) => item.depthCompositingMode))
  const contactCount = depthPlan.items
    .flatMap((item) => item.foregroundObjects)
    .filter((object) => object.kind === 'contact_object').length
  const fallbackCount = depthPlan.items.filter((item) => item.fallbackLayoutMode).length

  return `${depthPlan.items.length} depth item${depthPlan.items.length === 1 ? '' : 's'} across ${modes.size} mode${modes.size === 1 ? '' : 's'}; ${contactCount} contact object${contactCount === 1 ? '' : 's'}, ${fallbackCount} fallback${fallbackCount === 1 ? '' : 's'} planned.`
}

function depthLayoutValidationSummary(plan: EditPlan) {
  const validationPlan = plan.depthAwareLayoutValidationPlan

  if (!validationPlan) {
    return 'Depth layout validation is not ready.'
  }

  if (!validationPlan.active) {
    return 'Depth layout validation inactive; no foreground-aware depth effect needs review.'
  }

  return `${validationPlan.overallStatus}: ${validationPlan.items.length} item${validationPlan.items.length === 1 ? '' : 's'}, ${validationPlan.fallbackRecommendations.length} fallback${validationPlan.fallbackRecommendations.length === 1 ? '' : 's'}, ${validationPlan.totalEstimatedDepthPlanningCredits} depth credit${validationPlan.totalEstimatedDepthPlanningCredits === 1 ? '' : 's'}.`
}

function videoUnderstandingSummary(plan: EditPlan) {
  const report = plan.videoUnderstandingReport

  if (!report) {
    return 'Video understanding report is not ready.'
  }

  return `${report.clips.length} clip${report.clips.length === 1 ? '' : 's'} understood, ${report.visualSupportOpportunities.length} opportunit${report.visualSupportOpportunities.length === 1 ? 'y' : 'ies'} found, confidence ${report.confidence}.`
}

function adaptiveEditStrategySummary(plan: EditPlan) {
  const strategyPlan = plan.adaptiveEditStrategyPlan

  if (!strategyPlan) {
    return 'Adaptive edit strategy is not ready.'
  }

  const generationAvoided = strategyPlan.segmentStrategies.filter((strategy) => strategy.generationRestraint === 'avoid_generation').length
  const exactToolCount = strategyPlan.segmentStrategies.filter((strategy) =>
    strategy.recommendedToolHints.some((hint) => hint === 'map_tool' || hint === 'chart_tool' || hint === 'browser_capture_tool'),
  ).length

  return `${strategyPlan.segmentStrategies.length} segment strateg${strategyPlan.segmentStrategies.length === 1 ? 'y' : 'ies'}; ${generationAvoided} avoid generation, ${exactToolCount} prefer controlled tools.`
}

function toolRegistrySummary(plan: EditPlan) {
  const summary = plan.toolRegistrySummary

  if (!summary) {
    return 'Tool registry summary is not ready.'
  }

  return `${summary.launchCoreToolCount} launch-core tools, ${summary.plannedToolCount + summary.futureToolCount} planned/future, ${summary.needsLicenseReviewCount} license review. Browser-safe installs are lazy-loaded; no tools run automatically.`
}

function toolInstallStatusSummary() {
  const summary = getFrontendToolInstallSummary()

  return `${summary.installedCount} browser-safe package${summary.installedCount === 1 ? '' : 's'} installed, ${summary.lazyLoadCount} lazy-load recommended, ${summary.workerOnlyCount} worker-only excluded.`
}

function workerRuntimeSummary(plan: EditPlan) {
  const runtimePlan = plan.workerRuntimePlan

  if (!runtimePlan) {
    return 'Worker runtime plan is not ready.'
  }

  return `${runtimePlan.jobs.length} job${runtimePlan.jobs.length === 1 ? '' : 's'}, ${runtimePlan.totalSteps} step${runtimePlan.totalSteps === 1 ? '' : 's'}, ${runtimePlan.workerGroupsUsed.length} worker group${runtimePlan.workerGroupsUsed.length === 1 ? '' : 's'}; frontend execution disabled.`
}

function renderStrategySummary(plan: EditPlan) {
  const renderStrategyPlan = plan.renderStrategyPlan

  if (!renderStrategyPlan) {
    return 'Render strategy plan is not ready.'
  }

  const activeCounts = Object.entries(renderStrategyPlan.strategyCounts)
    .filter(([, count]) => count > 0)
    .map(([strategyType, count]) => `${count} ${strategyType.replaceAll('_', ' ')}`)
    .slice(0, 3)
    .join(', ')
  const toolCount = renderStrategyPlan.openSourceToolsUsed.length
  const providerCount = renderStrategyPlan.providerModelsReferenced.length

  return `${renderStrategyPlan.items.length} render item${renderStrategyPlan.items.length === 1 ? '' : 's'}; ${activeCounts || 'no active strategies'}; ${toolCount} tool${toolCount === 1 ? '' : 's'}, ${providerCount} provider model${providerCount === 1 ? '' : 's'} referenced.`
}

function toolStrategySummary(plan: EditPlan) {
  const toolStrategyPlan = plan.toolStrategyPlan

  if (!toolStrategyPlan) {
    return 'Tool strategy plan is not ready.'
  }

  const exactChains = toolStrategyPlan.items.filter((item) =>
    item.chainId === 'map_route_chain' ||
    item.chainId === 'chart_diagram_chain' ||
    item.chainId === 'browser_capture_chain',
  ).length

  return `${toolStrategyPlan.items.length} tool strateg${toolStrategyPlan.items.length === 1 ? 'y' : 'ies'}; ${toolStrategyPlan.chainIdsUsed.length} chain${toolStrategyPlan.chainIdsUsed.length === 1 ? '' : 's'}, ${exactChains} exact-work chain${exactChains === 1 ? '' : 's'} avoid AI video.`
}

function colorPipelineSummary(plan: EditPlan) {
  const colorPlan = plan.colorPipelinePlan

  if (!colorPlan) {
    return 'Color pipeline plan is not ready.'
  }

  return `${colorPlan.colorGradeStyle.replaceAll('_', ' ')} (${colorPlan.intensity}); ${colorPlan.clipPlans.length} clip plan${colorPlan.clipPlans.length === 1 ? '' : 's'}, ${colorPlan.assetMatchPlans.length} asset match plan${colorPlan.assetMatchPlans.length === 1 ? '' : 's'}.`
}

function audioPipelineSummary(plan: EditPlan) {
  const audioPlan = plan.audioPipelinePlan

  if (!audioPlan) {
    return 'Audio + SoundSync plan is not ready.'
  }

  return `${audioPlan.soundStyle.replaceAll('_', ' ')} (${audioPlan.audioIntensity}); ${audioPlan.clipPlans.length} clip plan${audioPlan.clipPlans.length === 1 ? '' : 's'}, ${audioPlan.soundSyncCues.length} SoundSync cue${audioPlan.soundSyncCues.length === 1 ? '' : 's'}.`
}

function mapAnimationSummary(plan: EditPlan) {
  const mapPlan = plan.mapAnimationPlan

  if (!mapPlan) {
    return 'Map/location plan is not ready.'
  }

  if (!mapPlan.active) {
    return 'No map/location plan is active for this edit.'
  }

  const sourceNeeded = mapPlan.items.filter((item) => item.locations.some((location) => location.sourceNeeded)).length
  return `${mapPlan.items.length} map/location item${mapPlan.items.length === 1 ? '' : 's'}; ${mapPlan.mapToolsPlanned.map((tool) => tool.replaceAll('_', ' ')).join(', ')} planned; ${sourceNeeded} source-needed.`
}

function dataVizSummary(plan: EditPlan) {
  const dataVizPlan = plan.dataVizPlan

  if (!dataVizPlan) {
    return 'Chart/diagram plan is not ready.'
  }

  if (!dataVizPlan.active) {
    return 'No chart/diagram plan is active for this edit.'
  }

  const sourceNeeded = dataVizPlan.items.filter((item) => item.dataPlan.sourceNeeded).length
  const mockOrFictional = dataVizPlan.items.filter((item) => item.dataPlan.mockData || item.dataPlan.fictionalData).length
  return `${dataVizPlan.items.length} chart/diagram item${dataVizPlan.items.length === 1 ? '' : 's'}; ${dataVizPlan.toolsPlanned.map((tool) => tool.replaceAll('_', ' ')).join(', ')} planned; ${sourceNeeded} source-needed, ${mockOrFictional} mock/fictional.`
}

function phaseStatus(cards: ChatPlanningCardDescriptor[]): ChatCardStatus {
  if (cards.some((card) => card.status === 'blocking')) {
    return 'blocking'
  }

  if (cards.some((card) => card.status === 'warning')) {
    return 'warning'
  }

  if (cards.some((card) => card.status === 'needs_input')) {
    return 'needs_input'
  }

  if (cards.some((card) => card.status === 'ready')) {
    return 'ready'
  }

  if (cards.some((card) => card.status === 'approved')) {
    return 'approved'
  }

  if (cards.every((card) => card.status === 'complete' || card.status === 'confirmed')) {
    return 'complete'
  }

  return 'not_started'
}

function cardCompleted(card: ChatPlanningCardDescriptor) {
  if (!card.requiredBeforeApproval) {
    return card.status !== 'not_started'
  }

  return completeStatuses.includes(card.status) || card.status === 'ready'
}

export function getChatPlanningCards(params: GetChatPlanningCardsParams): ChatPlanningCardDescriptor[] {
  const {
    approved,
    clipsAttached,
    clipCount,
    editLevelConfirmed,
    formatConfirmed,
    intentApproved,
    plan,
    previewReady,
    regressionReport,
    selectedScenarioId,
    sourceOrderConfirmed,
    validationReport,
    visualPreferenceConfirmed,
  } = params
  const setupReady = sourceOrderConfirmed && formatConfirmed && editLevelConfirmed && visualPreferenceConfirmed
  const factSafetyConcern = hasFactSafetyConcern(plan)
  const characterConcern = hasCharacterConcern(plan)
  const validationStatus = reportStatus(validationReport.status)
  const regressionStatus = reportStatus(regressionReport.status)
  const currentQaStatus = qaStatus(plan)
  const premium = plan.compiledIntent?.resolvedSettings.editLevel === 'premium'
  const layoutValidationStatus = validationCategoryStatus(validationReport, 'speaker_visual_layout')
  const layoutStatus = layoutValidationStatus ?? (plan.speakerVisualLayoutPlan?.items.length ? 'ready' : 'not_started')
  const understandingValidationStatus = validationCategoryStatus(validationReport, 'video_understanding')
  const understandingStatus = !clipsAttached || clipCount === 0
    ? 'not_started'
    : understandingValidationStatus ??
      (!plan.videoUnderstandingReport
        ? 'not_started'
        : !plan.videoUnderstandingReport.sourceOrderConfirmed
          ? 'warning'
          : 'ready')
  const adaptiveValidationStatus = validationCategoryStatus(validationReport, 'adaptive_strategy')
  const adaptiveStrategyStatus = adaptiveValidationStatus ?? (plan.adaptiveEditStrategyPlan?.segmentStrategies.length ? 'ready' : 'not_started')
  const toolRegistryValidationStatus = validationCategoryStatus(validationReport, 'tool_registry')
  const toolRegistryStatus = toolRegistryValidationStatus ?? (plan.toolRegistrySummary ? 'ready' : 'not_started')
  const toolInstallValidationStatus = validationCategoryStatus(validationReport, 'tool_install_status')
  const toolInstallStatus = toolInstallValidationStatus ?? 'ready'
  const renderStrategyValidationStatus = validationCategoryStatus(validationReport, 'render_strategy')
  const renderStrategyStatus = renderStrategyValidationStatus ?? (plan.renderStrategyPlan?.items.length ? 'ready' : 'not_started')
  const toolStrategyValidationStatus = validationCategoryStatus(validationReport, 'tool_strategy')
  const toolStrategyStatus = toolStrategyValidationStatus ?? (plan.toolStrategyPlan?.items.length ? 'ready' : 'not_started')
  const colorPipelineValidationStatus = validationCategoryStatus(validationReport, 'color_pipeline')
  const colorPipelineStatus = colorPipelineValidationStatus ?? (plan.colorPipelinePlan ? 'ready' : 'not_started')
  const audioPipelineValidationStatus = validationCategoryStatus(validationReport, 'audio_pipeline')
  const audioPipelineStatus = audioPipelineValidationStatus ?? (plan.audioPipelinePlan ? 'ready' : 'not_started')
  const mapAnimationValidationStatus = validationCategoryStatus(validationReport, 'map_animation')
  const mapSourceNeeded = plan.mapAnimationPlan?.items.some((item) => item.locations.some((location) => location.sourceNeeded))
  const mapAnimationStatus = mapAnimationValidationStatus ?? (!plan.mapAnimationPlan ? 'not_started' : !plan.mapAnimationPlan.active ? 'complete' : mapSourceNeeded ? 'warning' : 'ready')
  const dataVizValidationStatus = validationCategoryStatus(validationReport, 'dataviz_plan')
  const dataVizSourceNeeded = plan.dataVizPlan?.items.some((item) => item.dataPlan.sourceNeeded || item.dataPlan.confidence === 'unknown' || item.dataPlan.confidence === 'claimed')
  const dataVizStatus = dataVizValidationStatus ?? (!plan.dataVizPlan ? 'not_started' : !plan.dataVizPlan.active ? 'complete' : dataVizSourceNeeded ? 'warning' : 'ready')
  const depthValidationStatus = validationCategoryStatus(validationReport, 'depth_aware_overlay')
  const depthItems = plan.depthAwareOverlayPlan?.items ?? []
  const hasRiskyDepth = depthItems.some((item) => item.maskRisk === 'high' || item.maskRisk === 'premium')
  const depthStatus = depthValidationStatus ?? (!plan.depthAwareOverlayPlan?.active ? 'complete' : hasRiskyDepth ? 'warning' : 'ready')
  const depthLayoutValidationCategoryStatus = validationCategoryStatus(validationReport, 'depth_layout_validation')
  const depthLayoutPlan = plan.depthAwareLayoutValidationPlan
  const depthLayoutStatus = depthLayoutValidationCategoryStatus ??
    (!depthLayoutPlan ? 'not_started' : !depthLayoutPlan.active ? 'complete' : depthLayoutPlan.overallStatus === 'blocking' || depthLayoutPlan.overallStatus === 'failed' ? 'blocking' : depthLayoutPlan.overallStatus === 'warning' ? 'warning' : 'ready')
  const workerRuntimeValidationStatus = validationCategoryStatus(validationReport, 'worker_runtime')
  const workerRuntimeStatus = workerRuntimeValidationStatus ?? (plan.workerRuntimePlan ? 'ready' : 'not_started')

  return [
    descriptor({
      id: 'demo_scenario_selector',
      label: 'Demo scenario',
      phase: 'start',
      priority: 'user_summary',
      status: selectedScenarioId ? 'ready' : 'needs_input',
      defaultExpanded: true,
      requiredBeforeApproval: false,
      summary: 'Choose a mock scenario to test the full planning stack.',
    }),
    descriptor({
      id: 'demo_scenario_summary',
      label: 'Demo scenario summary',
      phase: 'start',
      priority: 'user_summary',
      status: selectedScenarioId ? 'ready' : 'not_started',
      defaultExpanded: false,
      requiredBeforeApproval: false,
      summary: 'Scenario expectations are available as compact context.',
    }),
    descriptor({
      id: 'source_sequence',
      label: 'Source sequence',
      phase: 'source_sequence',
      priority: 'required_user_action',
      status: !clipsAttached || clipCount === 0 ? 'not_started' : sourceOrderConfirmed ? 'confirmed' : 'needs_input',
      defaultExpanded: clipsAttached && clipCount > 0 && !sourceOrderConfirmed,
      requiredBeforeApproval: true,
      summary: plan.sourceSequenceReview
        ? `${getSourceSequenceModeLabel(plan.sourceSequenceReview.mode)}. ${sourceOrderConfirmed ? 'Source order confirmed.' : 'Confirm before approval.'}`
        : sourceOrderConfirmed
          ? 'Source order confirmed.'
          : 'Confirm or reorder uploaded clips.',
    }),
    descriptor({
      id: 'frame_format',
      label: 'Frame and output',
      phase: 'edit_setup',
      priority: 'required_user_action',
      status: formatConfirmed ? 'confirmed' : sourceOrderConfirmed ? 'needs_input' : 'not_started',
      defaultExpanded: sourceOrderConfirmed && !formatConfirmed,
      requiredBeforeApproval: true,
      summary: formatConfirmed ? 'Output format confirmed.' : 'Choose platform, ratio, and frame layout.',
    }),
    descriptor({
      id: 'edit_level',
      label: 'Edit level',
      phase: 'edit_setup',
      priority: 'required_user_action',
      status: editLevelConfirmed ? 'confirmed' : formatConfirmed ? 'needs_input' : 'not_started',
      defaultExpanded: formatConfirmed && !editLevelConfirmed,
      requiredBeforeApproval: true,
      summary: editLevelConfirmed ? 'Edit depth confirmed.' : 'Choose Basic, Pro, or Premium depth.',
    }),
    descriptor({
      id: 'visual_preference',
      label: 'Visual preference',
      phase: 'edit_setup',
      priority: 'required_user_action',
      status: visualPreferenceConfirmed ? 'confirmed' : editLevelConfirmed ? 'needs_input' : 'not_started',
      defaultExpanded: editLevelConfirmed && !visualPreferenceConfirmed,
      requiredBeforeApproval: true,
      summary: visualPreferenceConfirmed ? 'Visual preference confirmed.' : 'Choose minimal, balanced, or signature-system visuals.',
    }),
    descriptor({
      id: 'planning_context',
      label: 'Planning context',
      phase: 'edit_setup',
      priority: 'user_summary',
      status: setupReady ? 'ready' : 'not_started',
      defaultExpanded: setupReady,
      requiredBeforeApproval: false,
      summary: 'Current setup choices are summarized before planning.',
    }),
    descriptor({
      id: 'video_understanding',
      label: 'Video understanding',
      phase: 'understanding',
      priority: 'user_summary',
      status: understandingStatus,
      defaultExpanded: understandingStatus === 'warning' || understandingStatus === 'blocking',
      requiredBeforeApproval: false,
      summary: videoUnderstandingSummary(plan),
    }),
    descriptor({
      id: 'adaptive_edit_strategy',
      label: 'Adaptive edit strategy',
      phase: 'understanding',
      priority: 'user_summary',
      status: adaptiveStrategyStatus,
      defaultExpanded: adaptiveStrategyStatus === 'warning' || adaptiveStrategyStatus === 'blocking',
      requiredBeforeApproval: false,
      summary: adaptiveEditStrategySummary(plan),
    }),
    descriptor({
      id: 'tool_registry',
      label: 'Tool registry',
      phase: 'plan',
      priority: 'developer_detail',
      status: toolRegistryStatus,
      defaultExpanded: false,
      requiredBeforeApproval: false,
      summary: toolRegistrySummary(plan),
      hiddenInCompactMode: true,
    }),
    descriptor({
      id: 'tool_install_status',
      label: 'Tool install status',
      phase: 'plan',
      priority: 'developer_detail',
      status: toolInstallStatus,
      defaultExpanded: false,
      requiredBeforeApproval: false,
      summary: toolInstallStatusSummary(),
      hiddenInCompactMode: true,
    }),
    descriptor({
      id: 'render_strategy',
      label: 'Render strategy',
      phase: 'plan',
      priority: 'developer_detail',
      status: renderStrategyStatus,
      defaultExpanded: renderStrategyStatus === 'warning' || renderStrategyStatus === 'blocking',
      requiredBeforeApproval: false,
      summary: renderStrategySummary(plan),
      hiddenInCompactMode: true,
    }),
    descriptor({
      id: 'tool_strategy',
      label: 'Tool strategy',
      phase: 'plan',
      priority: 'developer_detail',
      status: toolStrategyStatus,
      defaultExpanded: toolStrategyStatus === 'warning' || toolStrategyStatus === 'blocking',
      requiredBeforeApproval: false,
      summary: toolStrategySummary(plan),
      hiddenInCompactMode: true,
    }),
    descriptor({
      id: 'map_animation_plan',
      label: 'Map + location plan',
      phase: 'plan',
      priority: 'advanced_plan_detail',
      status: mapAnimationStatus,
      defaultExpanded: mapAnimationStatus === 'warning' || mapAnimationStatus === 'blocking',
      requiredBeforeApproval: false,
      summary: mapAnimationSummary(plan),
      hiddenInCompactMode: !plan.mapAnimationPlan?.active,
    }),
    descriptor({
      id: 'dataviz_plan',
      label: 'Chart + diagram plan',
      phase: 'plan',
      priority: 'advanced_plan_detail',
      status: dataVizStatus,
      defaultExpanded: dataVizStatus === 'warning' || dataVizStatus === 'blocking',
      requiredBeforeApproval: false,
      summary: dataVizSummary(plan),
      hiddenInCompactMode: !plan.dataVizPlan?.active,
    }),
    descriptor({
      id: 'compiled_intent',
      label: 'What I understood',
      phase: 'understanding',
      priority: 'user_summary',
      status: intentApproved ? 'confirmed' : setupReady ? 'ready' : 'not_started',
      defaultExpanded: setupReady,
      requiredBeforeApproval: false,
      summary: intentApproved ? 'Intent confirmed.' : 'Review compiled user intent and constraints.',
    }),
    descriptor({
      id: 'edit_plan',
      label: 'Edit plan',
      phase: 'plan',
      priority: 'user_summary',
      status: setupReady ? 'ready' : 'not_started',
      defaultExpanded: setupReady,
      requiredBeforeApproval: true,
      summary: 'User-facing plan summary stays expanded.',
    }),
    descriptor({
      id: 'segment_operations',
      label: 'Segment operations',
      phase: 'plan',
      priority: 'advanced_plan_detail',
      status: plan.segmentEditPlans?.length ? 'ready' : 'not_started',
      defaultExpanded: false,
      requiredBeforeApproval: false,
      summary: `${plan.segmentEditPlans?.length ?? 0} worker-ready segment plan${(plan.segmentEditPlans?.length ?? 0) === 1 ? '' : 's'}.`,
    }),
    descriptor({
      id: 'color_pipeline',
      label: 'Color pipeline',
      phase: 'plan',
      priority: 'advanced_plan_detail',
      status: colorPipelineStatus,
      defaultExpanded: colorPipelineStatus === 'warning' || colorPipelineStatus === 'blocking',
      requiredBeforeApproval: false,
      summary: colorPipelineSummary(plan),
    }),
    descriptor({
      id: 'audio_pipeline',
      label: 'Audio + SoundSync',
      phase: 'plan',
      priority: 'advanced_plan_detail',
      status: audioPipelineStatus,
      defaultExpanded: audioPipelineStatus === 'warning' || audioPipelineStatus === 'blocking',
      requiredBeforeApproval: false,
      summary: audioPipelineSummary(plan),
    }),
    descriptor({
      id: 'visual_asset_plan',
      label: 'Visual story plan',
      phase: 'plan',
      priority: 'advanced_plan_detail',
      status: plan.visualAssetPlan?.length ? 'ready' : 'not_started',
      defaultExpanded: false,
      requiredBeforeApproval: false,
      summary: `${plan.visualAssetPlan?.length ?? 0} visual beat${(plan.visualAssetPlan?.length ?? 0) === 1 ? '' : 's'} planned. ${premium ? 'Premium final fallback only.' : 'Basic/Pro no Veo.'}`,
    }),
    descriptor({
      id: 'speaker_visual_layout',
      label: 'Speaker + visual layout',
      phase: 'plan',
      priority: 'advanced_plan_detail',
      status: layoutStatus,
      defaultExpanded: layoutStatus === 'warning' || layoutStatus === 'blocking',
      requiredBeforeApproval: false,
      summary: speakerVisualLayoutSummary(plan),
    }),
    descriptor({
      id: 'depth_aware_overlay',
      label: 'Depth-aware overlay',
      phase: 'plan',
      priority: 'advanced_plan_detail',
      status: depthStatus,
      defaultExpanded: depthStatus === 'warning' || depthStatus === 'blocking',
      requiredBeforeApproval: false,
      summary: depthAwareOverlaySummary(plan),
    }),
    descriptor({
      id: 'depth_layout_validation',
      label: 'Depth layout validation',
      phase: 'safety_qa',
      priority: 'safety_detail',
      status: depthLayoutStatus,
      defaultExpanded: depthLayoutStatus === 'warning' || depthLayoutStatus === 'blocking',
      requiredBeforeApproval: false,
      summary: depthLayoutValidationSummary(plan),
      hiddenInCompactMode: !plan.depthAwareLayoutValidationPlan?.active && depthLayoutStatus !== 'warning' && depthLayoutStatus !== 'blocking',
    }),
    descriptor({
      id: 'character_consistency',
      label: 'Character consistency',
      phase: 'safety_qa',
      priority: 'safety_detail',
      status: characterConcern ? 'warning' : plan.characterConsistencyPlan?.packs.length ? 'ready' : 'not_started',
      defaultExpanded: characterConcern,
      requiredBeforeApproval: false,
      summary: `${plan.characterConsistencyPlan?.packs.length ?? 0} character pack${(plan.characterConsistencyPlan?.packs.length ?? 0) === 1 ? '' : 's'} planned.`,
    }),
    descriptor({
      id: 'fact_safety',
      label: 'Fact safety',
      phase: 'safety_qa',
      priority: 'safety_detail',
      status: factSafetyConcern ? 'warning' : plan.documentaryFactSafetyPlan?.active ? 'ready' : 'not_started',
      defaultExpanded: factSafetyConcern,
      requiredBeforeApproval: false,
      summary: plan.documentaryFactSafetyPlan?.active
        ? `${plan.documentaryFactSafetyPlan.claimItems.length} claim item${plan.documentaryFactSafetyPlan.claimItems.length === 1 ? '' : 's'} planned.`
        : 'No documentary fact-safety card needed for this plan.',
    }),
    descriptor({
      id: 'renderer_plan',
      label: 'Frame and renderer plan',
      phase: 'plan',
      priority: 'advanced_plan_detail',
      status: plan.rendererCompositionPlan ? 'ready' : 'not_started',
      defaultExpanded: false,
      requiredBeforeApproval: false,
      summary: plan.rendererCompositionPlan
        ? `${plan.rendererCompositionPlan.frameTemplate.templateType.replaceAll('_', ' ')} with ${plan.rendererCompositionPlan.layers.length} layers.`
        : 'Renderer plan not ready.',
    }),
    descriptor({
      id: 'qa_plan',
      label: 'Quality checks',
      phase: 'safety_qa',
      priority: 'safety_detail',
      status: currentQaStatus,
      defaultExpanded: hasQaConcern(plan),
      requiredBeforeApproval: false,
      summary: plan.editQAPlan ? plan.editQAPlan.summary : 'QA plan not ready.',
    }),
    descriptor({
      id: 'prompt_preview',
      label: 'Provider prompt preview',
      phase: 'plan',
      priority: 'developer_detail',
      status: plan.providerPromptPlans?.length ? 'ready' : 'not_started',
      defaultExpanded: false,
      requiredBeforeApproval: false,
      summary: `${plan.providerPromptPlans?.length ?? 0} mock prompt plan${(plan.providerPromptPlans?.length ?? 0) === 1 ? '' : 's'}; no provider calls.`,
      hiddenInCompactMode: true,
    }),
    descriptor({
      id: 'plan_validation',
      label: 'Planning validation',
      phase: 'safety_qa',
      priority: 'safety_detail',
      status: validationStatus,
      defaultExpanded: validationReport.status !== 'passed',
      requiredBeforeApproval: false,
      summary: `${validationReport.status}: ${validationReport.blockingCount + validationReport.errorCount} error/blocking, ${validationReport.warningCount} warning.`,
    }),
    descriptor({
      id: 'planner_regression',
      label: 'Planner regression',
      phase: 'safety_qa',
      priority: 'developer_detail',
      status: regressionStatus,
      defaultExpanded: false,
      requiredBeforeApproval: false,
      summary: `${regressionReport.status}: ${regressionReport.scenarioReports.length} demo scenarios checked.`,
      hiddenInCompactMode: true,
    }),
    descriptor({
      id: 'worker_runtime_plan',
      label: 'Worker runtime plan',
      phase: 'safety_qa',
      priority: 'developer_detail',
      status: workerRuntimeStatus,
      defaultExpanded: false,
      requiredBeforeApproval: false,
      summary: workerRuntimeSummary(plan),
      hiddenInCompactMode: true,
    }),
    descriptor({
      id: 'credit_estimate',
      label: 'Credit estimate',
      phase: 'credits_approval',
      priority: 'required_user_action',
      status: approved ? 'approved' : setupReady ? 'ready' : 'not_started',
      defaultExpanded: setupReady,
      requiredBeforeApproval: true,
      summary: `${plan.creditEstimate.total} credits estimated before generation.`,
    }),
    descriptor({
      id: 'approval_progress',
      label: 'Approval and progress',
      phase: 'execution_preview',
      priority: 'required_user_action',
      status: approved ? 'approved' : 'not_started',
      defaultExpanded: approved,
      requiredBeforeApproval: false,
      summary: approved ? 'Mock progress can run because plan and credits are approved.' : 'Progress remains locked until approval.',
    }),
    descriptor({
      id: 'preview_ready',
      label: 'Preview ready',
      phase: 'execution_preview',
      priority: 'user_summary',
      status: previewReady ? 'complete' : 'not_started',
      defaultExpanded: previewReady,
      requiredBeforeApproval: false,
      summary: previewReady ? 'Mock preview is ready.' : 'Preview appears after approved mock progress completes.',
    }),
  ]
}

export function getChatPlanningPhaseSummaries(cards: ChatPlanningCardDescriptor[]): ChatPlanningPhaseSummary[] {
  return phaseOrder.map((phase) => {
    const phaseCards = cards.filter((card) => card.phase === phase)
    const completedCount = phaseCards.filter(cardCompleted).length
    const totalCount = phaseCards.length
    const status = totalCount === 0 ? 'not_started' : phaseStatus(phaseCards)

    return {
      phase,
      label: phaseLabels[phase],
      status,
      completedCount,
      totalCount,
      summary: totalCount === 0
        ? 'No cards in this phase yet.'
        : `${completedCount} of ${totalCount} planning item${totalCount === 1 ? '' : 's'} ready.`,
    }
  })
}

export function shouldShowCard(card: ChatPlanningCardDescriptor | undefined, mode: ChatPlanningDisplayMode) {
  if (!card) {
    return false
  }

  if (mode === 'developer') {
    return true
  }

  if (mode === 'detailed') {
    return true
  }

  if (card.priority === 'developer_detail') {
    return card.status === 'warning' || card.status === 'blocking'
  }

  return true
}
