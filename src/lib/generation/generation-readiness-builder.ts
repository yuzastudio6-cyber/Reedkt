import type {
  ContextAwareMockEditPlanResult,
  GenerationApproval,
  GenerationReadinessIssue,
  GenerationReadinessState,
  MockCreditEstimate,
  MockPreviewJob,
  PlanningContext,
  ProfessionalIntegrationState,
  ProfessionalQaState,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import { buildMockCreditEstimate } from './mock-credit-estimator'

type BuildGenerationReadinessStateInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  planningContext?: PlanningContext | null
  contextAwarePlanResult?: ContextAwareMockEditPlanResult | null
  professionalIntegrationState?: ProfessionalIntegrationState | null
  professionalQaState?: ProfessionalQaState | null
  existingCreditEstimate?: MockCreditEstimate | null
  existingApproval?: GenerationApproval | null
  existingPreviewJob?: MockPreviewJob | null
}

type IssueDraft = Omit<GenerationReadinessIssue, 'id' | 'projectId'>

function issueId(projectId: string, index: number) {
  return `${projectId}-generation-readiness-issue-${String(index).padStart(3, '0')}`
}

function createIssues(projectId: string, drafts: IssueDraft[]): GenerationReadinessIssue[] {
  return drafts.map((issue, index) => ({
    ...issue,
    id: issueId(projectId, index + 1),
    projectId,
  }))
}

function approvedProfessionalIntegration(state?: ProfessionalIntegrationState | null) {
  return Boolean(
    state?.summary.accepted ||
      state?.professionalIntegrationPlan?.status === 'approved' ||
      state?.operations.some((operation) =>
        operation.type === 'accept_integration_plan' &&
        operation.status === 'applied',
      ),
  )
}

function hasAcceptedApproval(approval?: GenerationApproval | null) {
  return approval?.status === 'approved'
}

function shouldRequireQaWarningAcknowledgement(
  issues: GenerationReadinessIssue[],
  professionalQaState?: ProfessionalQaState | null,
) {
  return issues.some((issue) => issue.severity === 'warning') ||
    professionalQaState?.summary.status === 'accepted_with_warnings'
}

function buildSummary(input: {
  status: GenerationReadinessState['status']
  issues: GenerationReadinessIssue[]
  creditEstimate: MockCreditEstimate | null
  canGenerate: boolean
}) {
  const blockingCount = input.issues.filter((issue) => issue.severity === 'blocking').length
  const warningCount = input.issues.filter((issue) => issue.severity === 'warning').length

  if (input.status === 'preview_ready') {
    return 'Private review preparation is complete and ready locally.'
  }
  if (input.status === 'generating') {
    return 'Private review preparation is in progress. Advance the local stages manually.'
  }
  if (input.status === 'approved') {
    return 'Private review preparation is approved and ready to queue.'
  }
  if (blockingCount > 0) {
    return `Private review is blocked by ${blockingCount} readiness issue${blockingCount === 1 ? '' : 's'}.`
  }
  if (warningCount > 0) {
    return `Private review can proceed locally with acknowledgement of ${warningCount} warning${warningCount === 1 ? '' : 's'}.`
  }
  if (input.canGenerate) {
    return 'Private review is approved and ready to queue.'
  }
  return input.creditEstimate
    ? 'Review readiness is clean. Approve the credit preview before queueing private review.'
    : 'Review readiness is waiting for an internal credit preview.'
}

export function getGenerationNextActions(state: GenerationReadinessState) {
  if (state.status === 'preview_ready') return ['Review private preview']
  if (state.status === 'generating') return ['Advance private review job']
  if (state.status === 'failed') return ['Reset readiness', 'Retry private review']

  const actions: string[] = []

  if (state.issues.some((issue) => issue.type === 'missing_planning_context' || issue.type === 'planning_context_blocked')) {
    actions.push('Resolve Planning Context issues')
  }
  if (state.issues.some((issue) => issue.type === 'missing_context_aware_plan')) {
    actions.push('Create AI Edit Plan from Planning Context')
  }
  if (state.issues.some((issue) =>
    issue.type === 'missing_professional_integration' ||
    issue.type === 'professional_integration_blocked' ||
    issue.type === 'professional_integration_not_accepted',
  )) {
    actions.push('Create or accept Professional Integration')
  }
  if (state.issues.some((issue) =>
    issue.type === 'missing_professional_qa' ||
    issue.type === 'professional_qa_not_run' ||
    issue.type === 'professional_qa_blocked' ||
    issue.type === 'professional_qa_needs_review' ||
    issue.type === 'qa_warnings_not_accepted',
  )) {
    actions.push('Run or review Professional QA')
  }
  if (state.canApprove) actions.push('Approve private review')
  if (state.canGenerate) actions.push('Queue private review job')
  if (actions.length === 0) actions.push('Refresh readiness')

  return Array.from(new Set(actions))
}

export function getGenerationReadinessMessage(state: GenerationReadinessState) {
  if (state.status === 'preview_ready') return 'Context-aware private review is ready.'
  if (state.status === 'generating') return 'Private review job is running locally.'
  if (state.status === 'approved') return 'Private review is approved and ready to queue.'
  if (state.status === 'blocked') return 'Resolve blocking readiness or QA issues before private review preparation.'
  if (state.status === 'needs_review') return 'Review QA or readiness warnings before approving private review.'
  if (state.status === 'ready_with_warnings') return 'Ready with warnings. Acknowledge warnings before private review.'
  if (state.status === 'ready') return 'Ready to approve the internal credit preview.'
  if (state.status === 'failed') return 'Private review failed locally. Reset or retry.'
  return 'Review readiness needs more planning context before private review.'
}

export function buildGenerationReadinessState({
  contextAwarePlanResult,
  existingApproval,
  existingCreditEstimate,
  existingPreviewJob,
  planningContext,
  professionalIntegrationState,
  professionalQaState,
  projectId,
  userId,
  workspaceId,
}: BuildGenerationReadinessStateInput): GenerationReadinessState {
  const creditEstimate = existingCreditEstimate ?? buildMockCreditEstimate({
    contextAwarePlanResult,
    planningContext,
    professionalIntegrationState,
    professionalQaState,
    projectId,
    userId,
    workspaceId,
  })
  const drafts: IssueDraft[] = []
  const approved = hasAcceptedApproval(existingApproval)

  if (!planningContext) {
    drafts.push({
      severity: 'blocking',
      type: 'missing_planning_context',
      message: 'Review readiness needs a Planning Context before private review approval.',
      suggestedAction: 'Create the AI Edit Plan from Planning Context first.',
    })
  } else if (planningContext.status === 'blocked') {
    drafts.push({
      severity: 'blocking',
      type: 'planning_context_blocked',
      message: 'Planning Context has blocking issues.',
      suggestedAction: 'Resolve blocking planning and cue conflicts before private review.',
      relatedPlanningContextId: planningContext.id,
    })
  }

  if (!contextAwarePlanResult) {
    drafts.push({
      severity: approved ? 'blocking' : 'warning',
      type: 'missing_context_aware_plan',
      message: approved
        ? 'A context-aware AI Edit Plan is required before queueing private review.'
        : 'A context-aware AI Edit Plan has not been created yet.',
      suggestedAction: 'Create AI Edit Plan from this context.',
      relatedPlanningContextId: planningContext?.id,
    })
  }

  if (!professionalIntegrationState?.professionalIntegrationPlan) {
    drafts.push({
      severity: 'blocking',
      type: 'missing_professional_integration',
      message: 'Professional Integration must exist before private review preparation.',
      suggestedAction: 'Create Professional Integration from the Planning Context.',
      relatedPlanningContextId: planningContext?.id,
    })
  } else {
    if (professionalIntegrationState.summary.status === 'blocked') {
      drafts.push({
        severity: 'blocking',
        type: 'professional_integration_blocked',
        message: 'Professional Integration is blocked.',
        suggestedAction: 'Resolve blocking treatment or cue compliance issues before private review.',
        relatedPlanningContextId: planningContext?.id,
        relatedProfessionalIntegrationPlanId: professionalIntegrationState.professionalIntegrationPlan.id,
      })
    }
    if (!approvedProfessionalIntegration(professionalIntegrationState)) {
      drafts.push({
        severity: 'warning',
        type: 'professional_integration_not_accepted',
        message: 'Professional Integration has not been accepted locally.',
        suggestedAction: 'Accept Professional Integration after reviewing treatment decisions.',
        relatedPlanningContextId: planningContext?.id,
        relatedProfessionalIntegrationPlanId: professionalIntegrationState.professionalIntegrationPlan.id,
      })
    }
  }

  if (!professionalQaState?.report) {
    drafts.push({
      severity: 'blocking',
      type: 'missing_professional_qa',
      message: 'Professional QA report is missing.',
      suggestedAction: 'Run Professional QA before private review preparation.',
      relatedPlanningContextId: planningContext?.id,
      relatedProfessionalIntegrationPlanId: professionalIntegrationState?.professionalIntegrationPlan?.id,
    })
  } else if (professionalQaState.summary.status === 'not_run') {
    drafts.push({
      severity: 'blocking',
      type: 'professional_qa_not_run',
      message: 'Professional QA has not been run.',
      suggestedAction: 'Run Professional QA before approving the private review.',
      relatedQaReportId: professionalQaState.report.id,
    })
  } else if (professionalQaState.summary.status === 'blocked' || professionalQaState.summary.status === 'failed') {
    drafts.push({
      severity: 'blocking',
      type: 'professional_qa_blocked',
      message: 'Professional QA has blocking issues.',
      suggestedAction: 'Resolve blocking QA items and rerun QA.',
      relatedQaReportId: professionalQaState.report.id,
    })
  } else if (professionalQaState.summary.status === 'needs_review') {
    drafts.push({
      severity: 'warning',
      type: 'professional_qa_needs_review',
      message: 'Professional QA warnings need review.',
      suggestedAction: 'Accept warnings or resolve them before approval.',
      relatedQaReportId: professionalQaState.report.id,
    })
  } else if (professionalQaState.summary.status === 'accepted_with_warnings') {
    drafts.push({
      severity: 'warning',
      type: 'qa_warnings_not_accepted',
      message: 'Professional QA warnings were accepted locally and require acknowledgement for this private review.',
      suggestedAction: 'Acknowledge accepted QA warnings when approving the private review.',
      relatedQaReportId: professionalQaState.report.id,
    })
  }

  if (!creditEstimate) {
    drafts.push({
      severity: 'blocking',
      type: 'credit_estimate_missing',
      message: 'Internal credit preview is missing.',
      suggestedAction: 'Refresh review readiness to create a local credit preview.',
    })
  }

  if (!approved) {
    drafts.push({
      severity: 'info',
      type: 'approval_required',
      message: 'Explicit local approval is required before queueing a private review job.',
      suggestedAction: 'Review the credit preview and approve the private review.',
    })
  }

  const issues = createIssues(projectId, drafts)
  const blockingIssues = issues.filter((issue) => issue.severity === 'blocking')
  const warningIssues = issues.filter((issue) => issue.severity === 'warning')
  const qaReadyForGeneration = professionalQaState?.summary.status === 'passed' ||
    professionalQaState?.summary.status === 'accepted_with_warnings'
  const canApprove = blockingIssues.length === 0 && Boolean(creditEstimate) && qaReadyForGeneration
  const canGenerate = approved && blockingIssues.length === 0 && Boolean(creditEstimate) && qaReadyForGeneration
  const previewJob = existingPreviewJob ?? null

  let status: GenerationReadinessState['status'] = 'not_ready'
  if (previewJob?.status === 'completed') {
    status = 'preview_ready'
  } else if (previewJob?.status === 'failed') {
    status = 'failed'
  } else if (previewJob?.status === 'queued' || previewJob?.status === 'running') {
    status = 'generating'
  } else if (canGenerate) {
    status = 'approved'
  } else if (blockingIssues.length > 0) {
    status = 'blocked'
  } else if (professionalQaState?.summary.status === 'needs_review') {
    status = 'needs_review'
  } else if (
    professionalQaState?.summary.status === 'accepted_with_warnings' ||
    warningIssues.length > 0 ||
    shouldRequireQaWarningAcknowledgement(issues, professionalQaState)
  ) {
    status = 'ready_with_warnings'
  } else if (canApprove || creditEstimate) {
    status = 'ready'
  }

  const baseState: GenerationReadinessState = {
    id: `${projectId}-generation-readiness`,
    projectId,
    workspaceId,
    userId,
    status,
    planningContextId: planningContext?.id,
    professionalIntegrationPlanId: professionalIntegrationState?.professionalIntegrationPlan?.id,
    qaReportId: professionalQaState?.report?.id,
    issues,
    creditEstimate,
    approval: existingApproval ?? null,
    previewJob,
    canApprove,
    canGenerate,
    canPreviewProceed: status === 'preview_ready' || canGenerate,
    summary: '',
    nextRecommendedActions: [],
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }

  return {
    ...baseState,
    summary: buildSummary({
      status,
      issues,
      creditEstimate,
      canGenerate,
    }),
    nextRecommendedActions: getGenerationNextActions(baseState),
  }
}
