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
