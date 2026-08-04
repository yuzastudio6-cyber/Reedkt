import { useCallback, useMemo, useState } from 'react'
import {
  acceptAllQaWarnings,
  acceptQaWarning,
  applyProfessionalQaOperation,
  canPreviewProceed as canPreviewProceedFromQa,
  createProfessionalQaActivityEvent,
  getProfessionalQaReadinessMessage,
  hasBlockingQaIssues,
  markQaReviewed,
  runProfessionalQa,
} from '../lib/professional-qa'
import { MOCK_CREATED_AT } from '../lib/footage-prep'
import type {
  EditCueConflictState,
  EditCuesState,
  PlanningContext,
  ProfessionalIntegrationState,
  ProfessionalQaOperation,
  ProfessionalQaState,
  SourceLibraryState,
  WorkflowActivityEvent,
} from '../types'

type UseProfessionalQaInput = {
  planningContext: PlanningContext | null
  professionalIntegrationState?: ProfessionalIntegrationState | null
  sourceLibraryState?: SourceLibraryState | null
  editCuesState?: EditCuesState | null
  editCueConflictState?: EditCueConflictState | null
  enabled?: boolean
}

type ProfessionalQaStore = {
  contextKey: string | null
  state: ProfessionalQaState | null
  activityEvents: WorkflowActivityEvent[]
}

export interface UseProfessionalQaResult {
  professionalQaState: ProfessionalQaState | null
  report: ProfessionalQaState['report'] | null
  items: ProfessionalQaState['items']
  summary: ProfessionalQaState['summary'] | null
  readinessMessage: string
  canPreviewProceed: boolean
  hasBlockingIssues: boolean
  activityEvents: WorkflowActivityEvent[]
  runQa: () => void
  rerunQa: () => void
  acceptWarning: (itemId: string) => void
  acceptAllWarnings: () => void
  markReviewed: () => void
  resetQa: () => void
}

function contextKeyFor(input: UseProfessionalQaInput) {
  const planningContext = input.planningContext
  if (!planningContext) return null
  return [
    planningContext.id,
    planningContext.status,
    planningContext.summary,
    planningContext.updatedAt,
    planningContext.unresolvedConflictIds.join(','),
    input.professionalIntegrationState?.updatedAt ?? 'no-professional-integration',
    input.professionalIntegrationState?.summary.status ?? 'no-status',
    input.professionalIntegrationState?.summary.blockingIssueCount ?? 0,
    input.professionalIntegrationState?.summary.warningIssueCount ?? 0,
    input.sourceLibraryState?.updatedAt ?? 'no-source-library',
    input.editCuesState?.updatedAt ?? 'no-edit-cues',
    input.editCueConflictState?.updatedAt ?? 'no-cue-conflicts',
  ].join('|')
}

function createResetOperation(state: ProfessionalQaState): ProfessionalQaOperation {
  return {
    id: `${state.projectId}-professional-qa-operation-${String(state.operations.length + 1).padStart(3, '0')}`,
    projectId: state.projectId,
    workspaceId: state.workspaceId,
    userId: state.userId,
    reportId: state.report?.id,
    type: 'reset_qa',
    status: 'applied',
    createdBy: 'user',
    createdAt: MOCK_CREATED_AT,
  }
}

export function useProfessionalQa({
  editCueConflictState,
  editCuesState,
  enabled = true,
  planningContext,
  professionalIntegrationState,
  sourceLibraryState,
}: UseProfessionalQaInput): UseProfessionalQaResult {
  const [store, setStore] = useState<ProfessionalQaStore>({
    contextKey: null,
    state: null,
    activityEvents: [],
  })
  const contextKey = useMemo(
    () => contextKeyFor({
      planningContext,
      professionalIntegrationState,
      sourceLibraryState,
      editCuesState,
      editCueConflictState,
      enabled,
    }),
    [
      editCueConflictState,
      editCuesState,
      enabled,
      planningContext,
      professionalIntegrationState,
      sourceLibraryState,
    ],
  )
  const activeState = enabled && contextKey && store.contextKey === contextKey ? store.state : null
  const activityEvents = enabled && contextKey && store.contextKey === contextKey ? store.activityEvents : []
  const readinessMessage = activeState
    ? getProfessionalQaReadinessMessage(activeState)
    : planningContext
      ? 'Run QA before treating the preview as ready.'
      : 'Professional QA will be available after Planning Context.'

  const runOrRerun = useCallback((rerun: boolean) => {
    if (!enabled || !planningContext || !contextKey) return
    const nextState = runProfessionalQa({
      currentState: rerun ? activeState : null,
      projectId: planningContext.projectId,
      workspaceId: planningContext.workspaceId,
      userId: planningContext.userId,
      planningContext,
      professionalIntegrationState,
      sourceLibraryState,
      editCuesState,
      editCueConflictState,
    })
    const operation = nextState.operations.at(-1)
    const nextEvent = createProfessionalQaActivityEvent({
      projectId: nextState.projectId,
      workspaceId: nextState.workspaceId,
      userId: nextState.userId,
      state: nextState,
      operation,
      progressPercent: 100,
    })

    setStore((current) => ({
      contextKey,
      state: nextState,
      activityEvents: current.contextKey === contextKey
        ? [...current.activityEvents, nextEvent]
        : [nextEvent],
    }))
  }, [
    activeState,
    contextKey,
    editCueConflictState,
    editCuesState,
    enabled,
    planningContext,
    professionalIntegrationState,
    sourceLibraryState,
  ])

  const applyLocalOperation = useCallback((
    applyOperation: (state: ProfessionalQaState) => ProfessionalQaState,
  ) => {
    if (!activeState || !contextKey) return
    const nextState = applyOperation(activeState)
    const operation = nextState.operations.at(-1)
    const nextEvent = createProfessionalQaActivityEvent({
      projectId: activeState.projectId,
      workspaceId: activeState.workspaceId,
      userId: activeState.userId,
      state: nextState,
      operation,
      progressPercent: 100,
    })

    setStore((current) => ({
      contextKey,
      state: nextState,
      activityEvents: current.contextKey === contextKey
        ? [...current.activityEvents, nextEvent]
        : [nextEvent],
    }))
  }, [activeState, contextKey])

  const resetQa = useCallback(() => {
    if (!activeState || !contextKey) return
    const operation = createResetOperation(activeState)
    const resetEvent = createProfessionalQaActivityEvent({
      projectId: activeState.projectId,
      workspaceId: activeState.workspaceId,
      userId: activeState.userId,
      state: activeState,
      operation,
      type: 'professional_qa_reset',
      progressPercent: 100,
    })
    const resetState = applyProfessionalQaOperation(activeState, { type: 'reset_qa' })

    setStore((current) => ({
      contextKey,
      state: resetState,
      activityEvents: current.contextKey === contextKey
        ? [...current.activityEvents, resetEvent]
        : [resetEvent],
    }))
  }, [activeState, contextKey])

  return {
    professionalQaState: activeState,
    report: activeState?.report ?? null,
    items: activeState?.items ?? [],
    summary: activeState?.summary ?? null,
    readinessMessage,
    canPreviewProceed: canPreviewProceedFromQa(activeState),
    hasBlockingIssues: hasBlockingQaIssues(activeState),
    activityEvents,
    runQa: () => runOrRerun(false),
    rerunQa: () => runOrRerun(true),
    acceptWarning: (itemId) => applyLocalOperation((state) => acceptQaWarning(state, itemId)),
    acceptAllWarnings: () => applyLocalOperation(acceptAllQaWarnings),
    markReviewed: () => applyLocalOperation(markQaReviewed),
    resetQa,
  }
}
