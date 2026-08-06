import { useCallback, useMemo, useState } from 'react'
import {
  advanceMockPreviewJob,
  buildGenerationReadinessState,
  completeMockPreviewJob as completePreviewJob,
  createGenerationActivityEvent,
  createGenerationApproval,
  createMockPreviewJob,
  failMockPreviewJob as failPreviewJob,
  getGenerationReadinessMessage,
} from '../lib/generation'
import { MOCK_CREATED_AT } from '../lib/footage-prep'
import type {
  ContextAwareMockEditPlanResult,
  GenerationApproval,
  GenerationReadinessState,
  MockCreditEstimate,
  MockPreviewJob,
  PlanningContext,
  ProfessionalIntegrationState,
  ProfessionalQaState,
  WorkflowActivityEvent,
} from '../types'

type UseGenerationReadinessInput = {
  planningContext: PlanningContext | null
  contextAwarePlanResult?: ContextAwareMockEditPlanResult | null
  professionalIntegrationState?: ProfessionalIntegrationState | null
  professionalQaState?: ProfessionalQaState | null
  enabled?: boolean
}

type GenerationReadinessStore = {
  contextKey: string | null
  creditEstimate: MockCreditEstimate | null
  approval: GenerationApproval | null
  previewJob: MockPreviewJob | null
  activityEvents: WorkflowActivityEvent[]
}

export type ApproveGenerationOptions = {
  acceptsQaWarnings: boolean
  understandsPreviewIsMock: boolean
}

export interface UseGenerationReadinessResult {
  generationReadinessState: GenerationReadinessState | null
  creditEstimate: MockCreditEstimate | null
  approval: GenerationApproval | null
  previewJob: MockPreviewJob | null
  issues: GenerationReadinessState['issues']
  activityEvents: WorkflowActivityEvent[]
  canApprove: boolean
  canGenerate: boolean
  canPreviewProceed: boolean
  approveGeneration: (options: ApproveGenerationOptions) => GenerationReadinessState | null
  rejectGeneration: () => GenerationReadinessState | null
  queueMockPreviewJob: () => GenerationReadinessState | null
  advanceMockPreviewJobStep: () => GenerationReadinessState | null
  completeMockPreviewJob: () => GenerationReadinessState | null
  failMockPreviewJob: (reason?: string) => GenerationReadinessState | null
  resetGenerationReadiness: () => GenerationReadinessState | null
  refreshGenerationReadiness: () => GenerationReadinessState | null
}

function contextKeyFor(input: UseGenerationReadinessInput) {
  if (!input.enabled || !input.planningContext) return null
  return [
    input.planningContext.id,
    input.planningContext.status,
    input.planningContext.summary,
    input.planningContext.updatedAt,
    input.contextAwarePlanResult?.planSummary ?? 'no-context-plan',
    input.professionalIntegrationState?.updatedAt ?? 'no-professional-integration',
    input.professionalIntegrationState?.summary.status ?? 'no-professional-integration-status',
    input.professionalIntegrationState?.summary.accepted ? 'accepted' : 'not-accepted',
    input.professionalQaState?.updatedAt ?? 'no-professional-qa',
    input.professionalQaState?.summary.status ?? 'no-professional-qa-status',
  ].join('|')
}

function warningsRequireAcknowledgement(
  state: GenerationReadinessState,
  professionalQaState?: ProfessionalQaState | null,
) {
  return state.issues.some((issue) => issue.severity === 'warning') ||
    professionalQaState?.summary.status === 'accepted_with_warnings'
}

function createRejectedApproval(state: GenerationReadinessState): GenerationApproval {
  return {
    id: `${state.projectId}-generation-approval`,
    projectId: state.projectId,
    workspaceId: state.workspaceId,
    userId: state.userId,
    creditEstimateId: state.creditEstimate?.id,
    status: 'rejected',
    rejectedAt: MOCK_CREATED_AT,
    acknowledgement: {
      acceptsMockCredits: false,
      acceptsQaWarnings: false,
      understandsPreviewIsMock: false,
    },
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function useGenerationReadiness({
  contextAwarePlanResult,
  enabled = true,
  planningContext,
  professionalIntegrationState,
  professionalQaState,
}: UseGenerationReadinessInput): UseGenerationReadinessResult {
  const [store, setStore] = useState<GenerationReadinessStore>({
    contextKey: null,
    creditEstimate: null,
    approval: null,
    previewJob: null,
    activityEvents: [],
  })
  const contextKey = useMemo(
    () => contextKeyFor({
      contextAwarePlanResult,
      enabled,
      planningContext,
      professionalIntegrationState,
      professionalQaState,
    }),
    [
      contextAwarePlanResult,
      enabled,
      planningContext,
      professionalIntegrationState,
      professionalQaState,
    ],
  )
  const storeMatchesContext = Boolean(enabled && contextKey && store.contextKey === contextKey)
  const projectId = planningContext?.projectId ?? 'mock-project'
  const workspaceId = planningContext?.workspaceId
  const userId = planningContext?.userId
  const generationReadinessState = useMemo(() => {
    if (!enabled || !planningContext || !contextKey) return null
    return buildGenerationReadinessState({
      projectId,
      workspaceId,
      userId,
      planningContext,
      contextAwarePlanResult,
      professionalIntegrationState,
      professionalQaState,
      existingCreditEstimate: storeMatchesContext ? store.creditEstimate : null,
      existingApproval: storeMatchesContext ? store.approval : null,
      existingPreviewJob: storeMatchesContext ? store.previewJob : null,
    })
  }, [
    contextAwarePlanResult,
    contextKey,
    enabled,
    planningContext,
    professionalIntegrationState,
    professionalQaState,
    projectId,
    store.approval,
    store.creditEstimate,
    store.previewJob,
    storeMatchesContext,
    userId,
    workspaceId,
  ])
  const activityEvents = storeMatchesContext ? store.activityEvents : []

  const commitState = useCallback((
    nextState: GenerationReadinessState,
    nextEvent: WorkflowActivityEvent,
  ) => {
    if (!contextKey) return nextState
    setStore((current) => ({
      contextKey,
      creditEstimate: nextState.creditEstimate,
      approval: nextState.approval,
      previewJob: nextState.previewJob,
      activityEvents: current.contextKey === contextKey
        ? [...current.activityEvents, nextEvent]
        : [nextEvent],
    }))
    return nextState
  }, [contextKey])

  const refreshGenerationReadiness = useCallback(() => {
    if (!generationReadinessState || !contextKey) return null
    const event = createGenerationActivityEvent({
      projectId: generationReadinessState.projectId,
      workspaceId: generationReadinessState.workspaceId,
      userId: generationReadinessState.userId,
      state: generationReadinessState,
      type: 'generation_readiness_created',
      progressPercent: generationReadinessState.status === 'blocked' ? 0 : 100,
    })
    return commitState(generationReadinessState, event)
  }, [commitState, contextKey, generationReadinessState])

  const approveGeneration = useCallback((options: ApproveGenerationOptions) => {
    if (!generationReadinessState || !contextKey) return null
    if (!generationReadinessState.canApprove) {
      const blockedEvent = createGenerationActivityEvent({
        projectId: generationReadinessState.projectId,
        workspaceId: generationReadinessState.workspaceId,
        userId: generationReadinessState.userId,
        state: generationReadinessState,
        type: 'mock_preview_blocked',
        progressPercent: 0,
      })
      return commitState(generationReadinessState, blockedEvent)
    }

    const approval = createGenerationApproval({
      projectId: generationReadinessState.projectId,
      workspaceId: generationReadinessState.workspaceId,
      userId: generationReadinessState.userId,
      creditEstimate: generationReadinessState.creditEstimate,
      acceptsQaWarnings: options.acceptsQaWarnings,
      understandsPreviewIsMock: options.understandsPreviewIsMock,
      warningsRequireAcknowledgement: warningsRequireAcknowledgement(generationReadinessState, professionalQaState),
    })
    const nextState = buildGenerationReadinessState({
      projectId: generationReadinessState.projectId,
      workspaceId: generationReadinessState.workspaceId,
      userId: generationReadinessState.userId,
      planningContext,
      contextAwarePlanResult,
      professionalIntegrationState,
      professionalQaState,
      existingCreditEstimate: generationReadinessState.creditEstimate,
      existingApproval: approval,
      existingPreviewJob: generationReadinessState.previewJob,
    })
    const event = createGenerationActivityEvent({
      projectId: nextState.projectId,
      workspaceId: nextState.workspaceId,
      userId: nextState.userId,
      state: nextState,
      type: approval.status === 'approved' ? 'generation_approved' : 'generation_approval_required',
      progressPercent: approval.status === 'approved' ? 100 : 0,
    })
    return commitState(nextState, event)
  }, [
    commitState,
    contextAwarePlanResult,
    contextKey,
    generationReadinessState,
    planningContext,
    professionalIntegrationState,
    professionalQaState,
  ])

  const rejectGeneration = useCallback(() => {
    if (!generationReadinessState || !contextKey) return null
    const approval = createRejectedApproval(generationReadinessState)
    const nextState = buildGenerationReadinessState({
      projectId: generationReadinessState.projectId,
      workspaceId: generationReadinessState.workspaceId,
      userId: generationReadinessState.userId,
      planningContext,
      contextAwarePlanResult,
      professionalIntegrationState,
      professionalQaState,
      existingCreditEstimate: generationReadinessState.creditEstimate,
      existingApproval: approval,
      existingPreviewJob: null,
    })
    const event = createGenerationActivityEvent({
      projectId: nextState.projectId,
      workspaceId: nextState.workspaceId,
      userId: nextState.userId,
      state: nextState,
      type: 'generation_approval_required',
      title: 'Preview approval rejected',
      message: 'Mock preview approval was rejected locally.',
      progressPercent: 0,
    })
    return commitState(nextState, event)
  }, [
    commitState,
    contextAwarePlanResult,
    contextKey,
    generationReadinessState,
    planningContext,
    professionalIntegrationState,
    professionalQaState,
  ])

  const queueMockPreviewJob = useCallback(() => {
    if (!generationReadinessState || !contextKey) return null
    if (!generationReadinessState.canGenerate || generationReadinessState.approval?.status !== 'approved') {
      const blockedEvent = createGenerationActivityEvent({
        projectId: generationReadinessState.projectId,
        workspaceId: generationReadinessState.workspaceId,
        userId: generationReadinessState.userId,
        state: generationReadinessState,
        type: 'mock_preview_blocked',
        progressPercent: 0,
      })
      return commitState(generationReadinessState, blockedEvent)
    }

    const previewJob = createMockPreviewJob({
      projectId: generationReadinessState.projectId,
      workspaceId: generationReadinessState.workspaceId,
      userId: generationReadinessState.userId,
      planningContextId: generationReadinessState.planningContextId,
      professionalIntegrationPlanId: generationReadinessState.professionalIntegrationPlanId,
      qaReportId: generationReadinessState.qaReportId,
      creditEstimateId: generationReadinessState.creditEstimate?.id,
      approvalId: generationReadinessState.approval.id,
    })
    const nextState = buildGenerationReadinessState({
      projectId: generationReadinessState.projectId,
      workspaceId: generationReadinessState.workspaceId,
      userId: generationReadinessState.userId,
      planningContext,
      contextAwarePlanResult,
      professionalIntegrationState,
      professionalQaState,
      existingCreditEstimate: generationReadinessState.creditEstimate,
      existingApproval: generationReadinessState.approval,
      existingPreviewJob: previewJob,
    })
    const event = createGenerationActivityEvent({
      projectId: nextState.projectId,
      workspaceId: nextState.workspaceId,
      userId: nextState.userId,
      state: nextState,
      job: previewJob,
      type: 'mock_preview_job_queued',
      progressPercent: 0,
    })
    return commitState(nextState, event)
  }, [
    commitState,
    contextAwarePlanResult,
    contextKey,
    generationReadinessState,
    planningContext,
    professionalIntegrationState,
    professionalQaState,
  ])

  const updateJob = useCallback((
    updater: (job: MockPreviewJob) => MockPreviewJob,
    eventType: 'mock_preview_job_started' | 'mock_preview_job_progress' | 'mock_preview_ready' | 'mock_preview_failed',
  ) => {
    if (!generationReadinessState?.previewJob || !contextKey) return null
    const nextJob = updater(generationReadinessState.previewJob)
    const nextState = buildGenerationReadinessState({
      projectId: generationReadinessState.projectId,
      workspaceId: generationReadinessState.workspaceId,
      userId: generationReadinessState.userId,
      planningContext,
      contextAwarePlanResult,
      professionalIntegrationState,
      professionalQaState,
      existingCreditEstimate: generationReadinessState.creditEstimate,
      existingApproval: generationReadinessState.approval,
      existingPreviewJob: nextJob,
    })
    const type = nextJob.status === 'completed'
      ? 'mock_preview_ready'
      : nextJob.status === 'failed'
        ? 'mock_preview_failed'
        : eventType
    const event = createGenerationActivityEvent({
      projectId: nextState.projectId,
      workspaceId: nextState.workspaceId,
      userId: nextState.userId,
      state: nextState,
      job: nextJob,
      type,
      progressPercent: nextJob.progressPercent,
    })
    return commitState(nextState, event)
  }, [
    commitState,
    contextAwarePlanResult,
    contextKey,
    generationReadinessState,
    planningContext,
    professionalIntegrationState,
    professionalQaState,
  ])

  const advanceMockPreviewJobStep = useCallback(() => updateJob(
    advanceMockPreviewJob,
    generationReadinessState?.previewJob?.status === 'queued'
      ? 'mock_preview_job_started'
      : 'mock_preview_job_progress',
  ), [generationReadinessState?.previewJob?.status, updateJob])

  const completeMockPreviewJob = useCallback(() => updateJob(
    completePreviewJob,
    'mock_preview_ready',
  ), [updateJob])

  const failMockPreviewJob = useCallback((reason = 'Mock preview job failed locally.') => updateJob(
    (job) => failPreviewJob(job, reason),
    'mock_preview_failed',
  ), [updateJob])

  const resetGenerationReadiness = useCallback(() => {
    if (!generationReadinessState || !contextKey) return null
    const nextState = buildGenerationReadinessState({
      projectId: generationReadinessState.projectId,
      workspaceId: generationReadinessState.workspaceId,
      userId: generationReadinessState.userId,
      planningContext,
      contextAwarePlanResult,
      professionalIntegrationState,
      professionalQaState,
      existingCreditEstimate: generationReadinessState.creditEstimate,
      existingApproval: null,
      existingPreviewJob: null,
    })
    const event = createGenerationActivityEvent({
      projectId: nextState.projectId,
      workspaceId: nextState.workspaceId,
      userId: nextState.userId,
      state: nextState,
      type: 'generation_readiness_created',
      title: 'Generation readiness reset',
      message: 'Local approval and mock preview job state were reset.',
      progressPercent: 0,
    })
    return commitState(nextState, event)
  }, [
    commitState,
    contextAwarePlanResult,
    contextKey,
    generationReadinessState,
    planningContext,
    professionalIntegrationState,
    professionalQaState,
  ])

  return {
    generationReadinessState,
    creditEstimate: generationReadinessState?.creditEstimate ?? null,
    approval: generationReadinessState?.approval ?? null,
    previewJob: generationReadinessState?.previewJob ?? null,
    issues: generationReadinessState?.issues ?? [],
    activityEvents,
    canApprove: generationReadinessState?.canApprove ?? false,
    canGenerate: generationReadinessState?.canGenerate ?? false,
    canPreviewProceed: generationReadinessState?.canPreviewProceed ?? false,
    approveGeneration,
    rejectGeneration,
    queueMockPreviewJob,
    advanceMockPreviewJobStep,
    completeMockPreviewJob,
    failMockPreviewJob,
    resetGenerationReadiness,
    refreshGenerationReadiness,
  }
}

export function getGenerationReadinessHookMessage(state: GenerationReadinessState | null) {
  return state ? getGenerationReadinessMessage(state) : 'Readiness appears after Planning Context, Professional Integration, and QA.'
}
