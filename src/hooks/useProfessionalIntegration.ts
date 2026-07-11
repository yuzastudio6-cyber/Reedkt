import { useCallback, useMemo, useState } from 'react'
import {
  buildProfessionalIntegrationState,
  createProfessionalIntegrationActivityEvent,
  getProfessionalIntegrationReadinessMessage,
  summarizeProfessionalIntegration,
} from '../lib/professional-integration'
import { MOCK_CREATED_AT } from '../lib/footage-prep'
import type {
  ContextAwareMockEditPlanResult,
  EditCuesState,
  PlanningContext,
  ProfessionalIntegrationOperation,
  ProfessionalIntegrationOperationType,
  ProfessionalIntegrationState,
  SourceLibraryState,
  WorkflowActivityEvent,
} from '../types'

type UseProfessionalIntegrationInput = {
  planningContext: PlanningContext | null
  sourceLibraryState?: SourceLibraryState | null
  editCuesState?: EditCuesState | null
  contextAwarePlanResult?: ContextAwareMockEditPlanResult | null
  enabled?: boolean
}

type ProfessionalIntegrationStore = {
  contextKey: string | null
  state: ProfessionalIntegrationState | null
  activityEvents: WorkflowActivityEvent[]
}

export interface UseProfessionalIntegrationResult {
  professionalIntegrationState: ProfessionalIntegrationState | null
  professionalIntegrationPlan: ProfessionalIntegrationState['professionalIntegrationPlan'] | null
  assetTreatmentPlans: ProfessionalIntegrationState['assetTreatmentPlans']
  brollIntegrationPlans: ProfessionalIntegrationState['brollIntegrationPlans']
  overlayCompositionPlans: ProfessionalIntegrationState['overlayCompositionPlans']
  cueComplianceChecks: ProfessionalIntegrationState['cueComplianceChecks']
  issues: ProfessionalIntegrationState['issues']
  summary: ProfessionalIntegrationState['summary'] | null
  readinessMessage: string
  activityEvents: WorkflowActivityEvent[]
  createProfessionalIntegration: () => void
  regenerateProfessionalIntegration: () => void
  acceptProfessionalIntegration: () => void
  acceptAssetTreatment: (treatmentId: string) => void
  acceptBrollTreatment: (treatmentId: string) => void
  acceptOverlayTreatment: (treatmentId: string) => void
  acceptCueCompliance: (checkId: string) => void
  markNeedsReview: () => void
  resetProfessionalIntegration: () => void
}

function contextKeyFor(
  planningContext: PlanningContext | null,
  contextAwarePlanResult?: ContextAwareMockEditPlanResult | null,
) {
  if (!planningContext) return null
  return [
    planningContext.id,
    planningContext.status,
    planningContext.summary,
    planningContext.cueUsages.map((cue) => `${cue.editCueId}:${cue.status}:${cue.priority}`).join(','),
    planningContext.sourceAssets.map((asset) => `${asset.mediaAssetId}:${asset.status}:${asset.priority}`).join(','),
    planningContext.unresolvedConflictIds.join(','),
    contextAwarePlanResult?.planSummary ?? '',
  ].join('|')
}

function operationId(state: ProfessionalIntegrationState, nextIndex: number) {
  const planId = state.professionalIntegrationPlan?.id ?? `${state.projectId}-professional-integration-plan`
  return `${planId}-operation-${String(nextIndex).padStart(3, '0')}`
}

function createOperation(
  state: ProfessionalIntegrationState,
  type: ProfessionalIntegrationOperationType,
  patch?: Record<string, unknown>,
): ProfessionalIntegrationOperation {
  return {
    id: operationId(state, state.operations.length + 1),
    projectId: state.projectId,
    workspaceId: state.workspaceId,
    userId: state.userId,
    professionalIntegrationPlanId: state.professionalIntegrationPlan?.id,
    type,
    status: 'applied',
    createdBy: 'user',
    createdAt: MOCK_CREATED_AT,
    patch,
  }
}

function withOperation(
  state: ProfessionalIntegrationState,
  operation: ProfessionalIntegrationOperation,
): ProfessionalIntegrationState {
  const operations = [...state.operations, operation]
  const professionalIntegrationPlan = state.professionalIntegrationPlan
    ? {
        ...state.professionalIntegrationPlan,
        status: operation.type === 'accept_integration_plan'
          ? 'approved'
          : operation.type === 'mark_needs_review'
            ? 'draft'
            : state.professionalIntegrationPlan.status,
        updatedAt: MOCK_CREATED_AT,
      }
    : null
  const draftState: ProfessionalIntegrationState = {
    ...state,
    professionalIntegrationPlan,
    operations,
    updatedAt: MOCK_CREATED_AT,
  }

  return {
    ...draftState,
    summary: summarizeProfessionalIntegration(draftState),
  }
}

export function useProfessionalIntegration({
  contextAwarePlanResult,
  editCuesState,
  enabled = true,
  planningContext,
  sourceLibraryState,
}: UseProfessionalIntegrationInput): UseProfessionalIntegrationResult {
  const [store, setStore] = useState<ProfessionalIntegrationStore>({
    contextKey: null,
    state: null,
    activityEvents: [],
  })
  const contextKey = useMemo(
    () => contextKeyFor(planningContext, contextAwarePlanResult),
    [contextAwarePlanResult, planningContext],
  )
  const activeState = enabled && contextKey && store.contextKey === contextKey ? store.state : null
  const activityEvents = enabled && contextKey && store.contextKey === contextKey ? store.activityEvents : []
  const readinessMessage = activeState
    ? getProfessionalIntegrationReadinessMessage(activeState)
    : planningContext
      ? 'Create Professional Integration to turn planning direction into polished treatment decisions.'
      : 'Professional Integration will be available after Planning Context.'

  const buildCurrentState = useCallback((operationType: 'create_integration_plan' | 'regenerate_integration_plan') => {
    if (!enabled || !planningContext || !contextKey) return null

    const builtState = buildProfessionalIntegrationState({
      projectId: planningContext.projectId,
      workspaceId: planningContext.workspaceId,
      userId: planningContext.userId,
      planningContext,
      sourceLibraryState,
      editCuesState,
      contextAwarePlanResult,
    })
    const operation = createOperation(builtState, operationType)
    return withOperation(builtState, operation)
  }, [
    contextAwarePlanResult,
    contextKey,
    editCuesState,
    enabled,
    planningContext,
    sourceLibraryState,
  ])

  const createOrRegenerate = useCallback((operationType: 'create_integration_plan' | 'regenerate_integration_plan') => {
    if (!planningContext || !contextKey) return
    const nextState = buildCurrentState(operationType)
    if (!nextState) return
    const operation = nextState.operations.at(-1)
    const nextEvent = createProfessionalIntegrationActivityEvent({
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
      activityEvents: [
        ...(operationType === 'regenerate_integration_plan' && current.contextKey === contextKey
          ? current.activityEvents
          : []),
        nextEvent,
      ],
    }))
  }, [buildCurrentState, contextKey, planningContext])

  const applyOperation = useCallback((
    type: ProfessionalIntegrationOperationType,
    patch?: Record<string, unknown>,
  ) => {
    if (!activeState || !contextKey) return
    const operation = createOperation(activeState, type, patch)
    const nextState = withOperation(activeState, operation)
    const nextEvent = createProfessionalIntegrationActivityEvent({
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
  }, [activeState, contextKey])

  const resetProfessionalIntegration = useCallback(() => {
    if (!contextKey) return
    setStore({
      contextKey,
      state: null,
      activityEvents: [],
    })
  }, [contextKey])

  return {
    professionalIntegrationState: activeState,
    professionalIntegrationPlan: activeState?.professionalIntegrationPlan ?? null,
    assetTreatmentPlans: activeState?.assetTreatmentPlans ?? [],
    brollIntegrationPlans: activeState?.brollIntegrationPlans ?? [],
    overlayCompositionPlans: activeState?.overlayCompositionPlans ?? [],
    cueComplianceChecks: activeState?.cueComplianceChecks ?? [],
    issues: activeState?.issues ?? [],
    summary: activeState?.summary ?? null,
    readinessMessage,
    activityEvents,
    createProfessionalIntegration: () => createOrRegenerate('create_integration_plan'),
    regenerateProfessionalIntegration: () => createOrRegenerate('regenerate_integration_plan'),
    acceptProfessionalIntegration: () => applyOperation('accept_integration_plan'),
    acceptAssetTreatment: (treatmentId) => applyOperation('accept_asset_treatment', { treatmentId }),
    acceptBrollTreatment: (treatmentId) => applyOperation('accept_broll_treatment', { treatmentId }),
    acceptOverlayTreatment: (treatmentId) => applyOperation('accept_overlay_treatment', { treatmentId }),
    acceptCueCompliance: (checkId) => applyOperation('accept_cue_compliance', { checkId }),
    markNeedsReview: () => applyOperation('mark_needs_review'),
    resetProfessionalIntegration,
  }
}
