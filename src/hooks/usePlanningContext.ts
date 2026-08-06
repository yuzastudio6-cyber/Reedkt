import { useCallback, useMemo, useState } from 'react'
import type { MockFootagePrepResult } from '../lib/footage-prep'
import {
  buildPlanningContext,
  buildPlanningContextSummary,
  createContextAwareMockEditPlan,
  createPlanningContextActivityEvent,
  getPlanningReadinessMessage,
  hasBlockingPlanningIssues,
} from '../lib/planning'
import type {
  CleanupReviewState,
  ContextAwareMockEditPlanResult,
  EditBriefState,
  EditCueConflictState,
  EditCuesState,
  PlanningContext,
  PlanningContextSummary,
  SourceLibraryState,
  WorkflowActivityEvent,
} from '../types'
import type { PlannerInput } from '../types/reeditpro'
import { createPlanningInputFingerprint } from '../lib/planning-input-safety'

type UsePlanningContextInput = {
  result: MockFootagePrepResult | null
  cleanupReviewState?: CleanupReviewState | null
  sourceLibraryState?: SourceLibraryState | null
  editBriefState?: EditBriefState | null
  editCuesState?: EditCuesState | null
  editCueConflictState?: EditCueConflictState | null
  plannerInput?: PlannerInput
}

type PlanningContextStore = {
  contextId: string | null
  contextFingerprint: string | null
  latestPlanResult: ContextAwareMockEditPlanResult | null
  activityEvents: WorkflowActivityEvent[]
}

function createPlanningContextFingerprint(context: PlanningContext): string {
  return JSON.stringify({
    status: context.status,
    cleanAssembly: context.cleanAssembly,
    sourceAssets: context.sourceAssets.map((asset) => ({
      mediaAssetId: asset.mediaAssetId,
      role: asset.role,
      status: asset.status,
      priority: asset.priority,
      label: asset.label,
    })),
    editBrief: context.editBrief,
    cueUsages: context.cueUsages.map((cue) => ({
      editCueId: cue.editCueId,
      title: cue.title,
      status: cue.status,
      role: cue.role,
      priority: cue.priority,
      mappedTimeRange: cue.mappedTimeRange,
      relatedAssetIds: cue.relatedAssetIds,
      blockingIssueIds: cue.blockingIssueIds,
    })),
    unresolvedConflictIds: context.unresolvedConflictIds,
    blockingIssueCount: context.blockingIssueCount,
    warningIssueCount: context.warningIssueCount,
    summary: context.summary,
  })
}

export interface UsePlanningContextResult {
  planningContext: PlanningContext | null
  planningContextSummary: PlanningContextSummary | null
  readinessMessage: string
  hasBlockingIssues: boolean
  activityEvents: WorkflowActivityEvent[]
  createPlanFromContext: () => ContextAwareMockEditPlanResult | null
  latestPlanResult: ContextAwareMockEditPlanResult | null
}

export function usePlanningContext({
  cleanupReviewState,
  editBriefState,
  editCueConflictState,
  editCuesState,
  plannerInput,
  result,
  sourceLibraryState,
}: UsePlanningContextInput): UsePlanningContextResult {
  const [store, setStore] = useState<PlanningContextStore>({
    contextId: null,
    contextFingerprint: null,
    latestPlanResult: null,
    activityEvents: [],
  })

  const activeCleanAssembly = cleanupReviewState?.updatedCleanAssembly ?? result?.cleanAssembly ?? null
  const activeCleanAssemblySegments = useMemo(
    () => cleanupReviewState?.updatedCleanAssemblySegments.length
      ? cleanupReviewState.updatedCleanAssemblySegments
      : result?.cleanAssemblySegments ?? [],
    [cleanupReviewState, result],
  )
  const activeSourceTimeMappings = useMemo(
    () => cleanupReviewState?.updatedSourceTimeMappings.length
      ? cleanupReviewState.updatedSourceTimeMappings
      : result?.sourceTimeMappings ?? [],
    [cleanupReviewState, result],
  )

  const planningContext = useMemo(() => {
    if (!result) return null

    return buildPlanningContext({
      projectId: result.cleanupPlan.projectId,
      workspaceId: result.cleanupPlan.workspaceId,
      userId: result.cleanupPlan.userId,
      cleanAssembly: activeCleanAssembly,
      cleanAssemblySegments: activeCleanAssemblySegments,
      sourceTimeMappings: activeSourceTimeMappings,
      cleanupReviewState,
      sourceLibraryState,
      editBriefState,
      editCuesState,
      editCueConflictState,
    })
  }, [
    activeCleanAssembly,
    activeCleanAssemblySegments,
    activeSourceTimeMappings,
    cleanupReviewState,
    editBriefState,
    editCueConflictState,
    editCuesState,
    result,
    sourceLibraryState,
  ])

  const planningContextSummary = useMemo(
    () => planningContext ? buildPlanningContextSummary(planningContext) : null,
    [planningContext],
  )
  const readinessMessage = planningContext ? getPlanningReadinessMessage(planningContext) : ''
  const hasBlockingIssues = planningContext ? hasBlockingPlanningIssues(planningContext) : false
  const contextFingerprint = useMemo(() => {
    if (!planningContext) return null
    return JSON.stringify({
      planningContext: createPlanningContextFingerprint(planningContext),
      plannerInput: plannerInput ? createPlanningInputFingerprint(plannerInput) : null,
    })
  }, [plannerInput, planningContext])
  const contextActivityEvent = useMemo(() => {
    if (!planningContext) return null

    return createPlanningContextActivityEvent({
      projectId: planningContext.projectId,
      workspaceId: planningContext.workspaceId,
      userId: planningContext.userId,
      planningContext,
      progressPercent: 100,
    })
  }, [planningContext])
  const storeMatchesCurrentContext =
    Boolean(planningContext?.id) &&
    store.contextId === planningContext?.id &&
    store.contextFingerprint === contextFingerprint
  const storedEvents = storeMatchesCurrentContext ? store.activityEvents : []
  const activityEvents = contextActivityEvent ? [contextActivityEvent, ...storedEvents] : storedEvents
  const latestPlanResult = storeMatchesCurrentContext ? store.latestPlanResult : null

  const createPlanFromContext = useCallback(() => {
    if (!planningContext || !plannerInput || !contextFingerprint) {
      return null
    }

    const nextPlanResult = createContextAwareMockEditPlan({
      planningContext,
      existingPlannerInput: plannerInput,
    })
    const nextEvent = createPlanningContextActivityEvent({
      projectId: planningContext.projectId,
      workspaceId: planningContext.workspaceId,
      userId: planningContext.userId,
      planningContext,
      type: 'context_aware_plan_created',
      progressPercent: 100,
    })

    setStore((current) => ({
      contextId: planningContext.id,
      contextFingerprint,
      latestPlanResult: nextPlanResult,
      activityEvents: [
        ...(current.contextId === planningContext.id && current.contextFingerprint === contextFingerprint ? current.activityEvents : []),
        nextEvent,
      ],
    }))

    return nextPlanResult
  }, [contextFingerprint, plannerInput, planningContext])

  return {
    planningContext,
    planningContextSummary,
    readinessMessage,
    hasBlockingIssues,
    activityEvents,
    createPlanFromContext,
    latestPlanResult,
  }
}
