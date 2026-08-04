import { useCallback, useMemo, useState } from 'react'
import {
  advanceMockExportJob as advanceMockExportJobState,
  buildExportWorkflowState,
  buildMockExportEstimate,
  completeMockExportJob as completeMockExportJobState,
  createExportActivityEvent,
  createExportApproval,
  createMockExportJob,
  failMockExportJob as failMockExportJobState,
  rejectExportApproval,
  toggleExportTarget as toggleExportTargetState,
  updateExportTarget as updateExportTargetState,
} from '../lib/exports'
import { MOCK_CREATED_AT } from '../lib/footage-prep'
import type {
  EditMapState,
  ExportTarget,
  ExportWorkflowState,
  GenerationReadinessState,
  MockExportJob,
  MockExportOutput,
  ProfessionalQaState,
  RevisionWorkflowState,
  WorkflowActivityEvent,
} from '../types'

type UseExportWorkflowInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  sourcePreviewId?: string
  sourcePreviewVersion?: number
  sourceEditDocumentId?: string
  sourceEditVersion?: number
  generationReadinessState?: GenerationReadinessState | null
  professionalQaState?: ProfessionalQaState | null
  editMapState?: EditMapState | null
  revisionWorkflowState?: RevisionWorkflowState | null
  enabled?: boolean
}

type ExportWorkflowStore = {
  contextKey: string
  state: ExportWorkflowState
  activityEvents: WorkflowActivityEvent[]
}

type ApproveExportOptions = {
  acceptsMockCredits: boolean
  understandsExportIsMock: boolean
  understandsNoRealFileWillBeCreated: boolean
}

function buildContextKey(input: UseExportWorkflowInput) {
  return [
    input.projectId,
    input.sourcePreviewId ?? input.revisionWorkflowState?.latestPreviewId ?? 'no-preview',
    input.sourcePreviewVersion ?? input.revisionWorkflowState?.latestPreviewVersion ?? 0,
    input.sourceEditDocumentId ?? input.revisionWorkflowState?.latestEditDocumentId ?? input.editMapState?.editDocument?.id ?? 'no-edit-document',
    input.sourceEditVersion ?? input.revisionWorkflowState?.latestEditVersion ?? input.editMapState?.editDocument?.version ?? 0,
  ].join('|')
}

function buildState(input: UseExportWorkflowInput, current?: Partial<ExportWorkflowState>): ExportWorkflowState {
  const sourcePreviewId = input.sourcePreviewId ?? input.revisionWorkflowState?.latestPreviewId
  const sourcePreviewVersion = input.sourcePreviewVersion ?? input.revisionWorkflowState?.latestPreviewVersion
  const sourceEditDocumentId = input.sourceEditDocumentId ?? input.revisionWorkflowState?.latestEditDocumentId ?? input.editMapState?.editDocument?.id
  const sourceEditVersion = input.sourceEditVersion ?? input.revisionWorkflowState?.latestEditVersion ?? input.editMapState?.editDocument?.version

  return buildExportWorkflowState({
    projectId: input.projectId,
    workspaceId: input.workspaceId ?? input.editMapState?.workspaceId,
    userId: input.userId ?? input.editMapState?.userId,
    sourcePreviewId,
    sourcePreviewVersion,
    sourceEditDocumentId,
    sourceEditVersion,
    generationReadinessState: input.generationReadinessState,
    professionalQaState: input.professionalQaState,
    editMapState: input.editMapState,
    revisionWorkflowState: input.revisionWorkflowState,
    existingExportSettings: current?.exportSettings
      ? {
          ...current.exportSettings,
          sourcePreviewId,
          sourcePreviewVersion,
          sourceEditDocumentId,
          sourceEditVersion,
          updatedAt: MOCK_CREATED_AT,
        }
      : null,
    existingEstimate: current?.exportEstimate ?? null,
    existingApproval: current?.approval ?? null,
    existingActiveJob: current?.activeJob ?? null,
    existingJobs: current?.exportJobs,
    existingOutputs: current?.exportOutputs,
  })
}

function upsertJob(state: ExportWorkflowState, job: MockExportJob): MockExportJob[] {
  return state.exportJobs.some((candidate) => candidate.id === job.id)
    ? state.exportJobs.map((candidate) => candidate.id === job.id ? job : candidate)
    : [...state.exportJobs, job]
}

function mergeOutputs(existing: MockExportOutput[], next: MockExportOutput[]) {
  const outputById = new Map(existing.map((output) => [output.id, output]))
  next.forEach((output) => outputById.set(output.id, output))
  return Array.from(outputById.values())
}

export function useExportWorkflow(input: UseExportWorkflowInput) {
  const { enabled = true, projectId } = input
  const contextKey = buildContextKey(input)
  const [store, setStore] = useState<ExportWorkflowStore | null>(null)
  const activeState = useMemo(
    () => enabled && store?.contextKey === contextKey
      ? buildState(input, store.state)
      : buildState(input),
    [contextKey, enabled, input, store],
  )
  const activityEvents = useMemo(
    () => enabled && store?.contextKey === contextKey
      ? store.activityEvents
      : [],
    [contextKey, enabled, store],
  )

  const commitState = useCallback((nextState: ExportWorkflowState, nextEvents?: WorkflowActivityEvent[]) => {
    setStore({
      contextKey,
      state: nextState,
      activityEvents: nextEvents ?? activityEvents,
    })
    return nextState
  }, [activityEvents, contextKey])

  const rebuildFrom = useCallback((partial: Partial<ExportWorkflowState>, nextEvents?: WorkflowActivityEvent[]) => {
    const nextState = buildState(input, partial)
    return commitState(nextState, nextEvents)
  }, [commitState, input])

  const updateTarget = useCallback((targetId: string, patch: Partial<ExportTarget>) => {
    const nextSettings = updateExportTargetState(activeState.exportSettings, targetId, patch)
    const nextEstimate = buildMockExportEstimate({
      projectId,
      workspaceId: activeState.workspaceId,
      userId: activeState.userId,
      exportSettings: nextSettings,
    })
    const nextEvents = [
      ...activityEvents,
      createExportActivityEvent({
        projectId,
        workspaceId: activeState.workspaceId,
        userId: activeState.userId,
        type: 'mock_export_estimate_ready',
      }),
    ]
    return rebuildFrom({
      ...activeState,
      exportSettings: nextSettings,
      exportEstimate: nextEstimate,
      approval: null,
      activeJob: null,
    }, nextEvents)
  }, [activeState, activityEvents, projectId, rebuildFrom])

  const toggleTarget = useCallback((targetId: string, enabledValue: boolean) => {
    const nextSettings = toggleExportTargetState(activeState.exportSettings, targetId, enabledValue)
    const nextEstimate = buildMockExportEstimate({
      projectId,
      workspaceId: activeState.workspaceId,
      userId: activeState.userId,
      exportSettings: nextSettings,
    })
    const nextEvents = [
      ...activityEvents,
      createExportActivityEvent({
        projectId,
        workspaceId: activeState.workspaceId,
        userId: activeState.userId,
        type: 'mock_export_estimate_ready',
      }),
    ]
    return rebuildFrom({
      ...activeState,
      exportSettings: nextSettings,
      exportEstimate: nextEstimate,
      approval: null,
      activeJob: null,
    }, nextEvents)
  }, [activeState, activityEvents, projectId, rebuildFrom])

  const refreshExportReadiness = useCallback(() => {
    const nextEvents = [
      ...activityEvents,
      createExportActivityEvent({
        projectId,
        workspaceId: activeState.workspaceId,
        userId: activeState.userId,
        state: activeState,
        type: 'export_readiness_created',
      }),
    ]
    return rebuildFrom(activeState, nextEvents)
  }, [activeState, activityEvents, projectId, rebuildFrom])

  const approveExport = useCallback((options: ApproveExportOptions) => {
    if (!activeState.canApprove) return null
    const approval = createExportApproval({
      projectId,
      workspaceId: activeState.workspaceId,
      userId: activeState.userId,
      exportEstimate: activeState.exportEstimate,
      ...options,
    })
    const estimate = activeState.exportEstimate && approval.status === 'approved'
      ? { ...activeState.exportEstimate, status: 'approved' as const, updatedAt: MOCK_CREATED_AT }
      : activeState.exportEstimate
    const nextPartial = {
      ...activeState,
      exportEstimate: estimate,
      approval,
      activeJob: null,
    }
    const nextEvents = [
      ...activityEvents,
      createExportActivityEvent({
        projectId,
        workspaceId: activeState.workspaceId,
        userId: activeState.userId,
        type: approval.status === 'approved' ? 'export_approved' : 'export_approval_required',
      }),
    ]
    return rebuildFrom(nextPartial, nextEvents)
  }, [activeState, activityEvents, projectId, rebuildFrom])

  const rejectExport = useCallback(() => {
    const approval = rejectExportApproval({
      projectId,
      workspaceId: activeState.workspaceId,
      userId: activeState.userId,
      exportEstimate: activeState.exportEstimate,
    })
    const nextEvents = [
      ...activityEvents,
      createExportActivityEvent({
        projectId,
        workspaceId: activeState.workspaceId,
        userId: activeState.userId,
        type: 'export_rejected',
      }),
    ]
    return rebuildFrom({
      ...activeState,
      approval,
      activeJob: null,
    }, nextEvents)
  }, [activeState, activityEvents, projectId, rebuildFrom])

  const queueExportJob = useCallback(() => {
    if (!activeState.canExport || activeState.approval?.status !== 'approved') return null
    const job = createMockExportJob({
      projectId,
      workspaceId: activeState.workspaceId,
      userId: activeState.userId,
      exportSettings: activeState.exportSettings,
      exportEstimate: activeState.exportEstimate,
      approval: activeState.approval,
      jobIndex: activeState.exportJobs.length + 1,
    })
    const nextEvents = [
      ...activityEvents,
      createExportActivityEvent({
        projectId,
        workspaceId: activeState.workspaceId,
        userId: activeState.userId,
        state: activeState,
        job,
        type: 'mock_export_job_queued',
      }),
    ]
    return rebuildFrom({
      ...activeState,
      activeJob: job,
      exportJobs: upsertJob(activeState, job),
    }, nextEvents)
  }, [activeState, activityEvents, projectId, rebuildFrom])

  const advanceExportJob = useCallback(() => {
    if (!activeState.activeJob) return null
    const job = advanceMockExportJobState(activeState.activeJob, activeState.exportSettings)
    const outputs = mergeOutputs(activeState.exportOutputs, job.outputs)
    const nextEvents = [
      ...activityEvents,
      createExportActivityEvent({
        projectId,
        workspaceId: activeState.workspaceId,
        userId: activeState.userId,
        state: activeState,
        job,
        type: job.status === 'completed' ? 'mock_export_ready' : 'mock_export_job_progress',
      }),
    ]
    return rebuildFrom({
      ...activeState,
      activeJob: job,
      exportJobs: upsertJob(activeState, job),
      exportOutputs: outputs,
    }, nextEvents)
  }, [activeState, activityEvents, projectId, rebuildFrom])

  const completeExportJob = useCallback(() => {
    if (!activeState.activeJob) return null
    const job = completeMockExportJobState(activeState.activeJob, activeState.exportSettings)
    const outputs = mergeOutputs(activeState.exportOutputs, job.outputs)
    const nextEvents = [
      ...activityEvents,
      createExportActivityEvent({
        projectId,
        workspaceId: activeState.workspaceId,
        userId: activeState.userId,
        state: activeState,
        job,
        type: 'mock_export_ready',
      }),
    ]
    return rebuildFrom({
      ...activeState,
      activeJob: job,
      exportJobs: upsertJob(activeState, job),
      exportOutputs: outputs,
    }, nextEvents)
  }, [activeState, activityEvents, projectId, rebuildFrom])

  const failExportJob = useCallback((reason = 'Mock export failed locally for review.') => {
    if (!activeState.activeJob) return null
    const job = failMockExportJobState(activeState.activeJob, reason)
    const nextEvents = [
      ...activityEvents,
      createExportActivityEvent({
        projectId,
        workspaceId: activeState.workspaceId,
        userId: activeState.userId,
        state: activeState,
        job,
        type: 'mock_export_failed',
      }),
    ]
    return rebuildFrom({
      ...activeState,
      activeJob: job,
      exportJobs: upsertJob(activeState, job),
    }, nextEvents)
  }, [activeState, activityEvents, projectId, rebuildFrom])

  const resetExportWorkflow = useCallback(() => {
    const nextEvents = [
      ...activityEvents,
      createExportActivityEvent({
        projectId,
        workspaceId: activeState.workspaceId,
        userId: activeState.userId,
        type: 'export_reset',
      }),
    ]
    return rebuildFrom({
      ...activeState,
      approval: null,
      activeJob: null,
    }, nextEvents)
  }, [activeState, activityEvents, projectId, rebuildFrom])

  return {
    exportWorkflowState: activeState,
    exportSettings: activeState.exportSettings,
    exportEstimate: activeState.exportEstimate,
    approval: activeState.approval,
    activeJob: activeState.activeJob,
    exportJobs: activeState.exportJobs,
    exportOutputs: activeState.exportOutputs,
    issues: activeState.issues,
    activityEvents,
    updateTarget,
    toggleTarget,
    refreshExportReadiness,
    approveExport,
    rejectExport,
    queueExportJob,
    advanceExportJob,
    completeExportJob,
    failExportJob,
    resetExportWorkflow,
  }
}
