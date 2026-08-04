import { useCallback, useMemo, useState } from 'react'
import {
  buildMockRevisionCreditEstimate,
  buildRevisionRequest,
  createMockRevisionJob,
  createRevisionActivityEvent,
  createRevisionApproval,
  createRevisionVersionRecord,
  advanceMockRevisionJob as advanceRevisionJobState,
  completeMockRevisionJob as completeRevisionJobState,
  failMockRevisionJob as failRevisionJobState,
  rejectRevisionApproval as rejectRevisionApprovalState,
  summarizeRevisionWorkflow,
} from '../lib/revisions'
import { MOCK_CREATED_AT } from '../lib/footage-prep'
import type {
  EditDocument,
  EditElement,
  EditGroup,
  EditMapLocalOperation,
  EditSystem,
  MockRevisionJob,
  RevisionApproval,
  RevisionCreditEstimate,
  RevisionRequest,
  RevisionVersionRecord,
  RevisionWorkflowState,
  WorkflowActivityEvent,
} from '../types'

type UseRevisionWorkflowInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  editMapState?: {
    projectId: string
    workspaceId?: string
    userId?: string
    editDocument: EditDocument | null
    systems: EditSystem[]
    groups: EditGroup[]
    elements: EditElement[]
    operations: EditMapLocalOperation[]
  } | null
  editDocument?: EditDocument | null
  systems?: EditSystem[]
  groups?: EditGroup[]
  elements?: EditElement[]
  operations?: EditMapLocalOperation[]
  sourcePreviewId?: string
  sourcePreviewVersion?: number
  sourceEditDocumentId?: string
  sourceEditVersion?: number
  enabled?: boolean
}

type RevisionWorkflowStore = {
  contextKey: string
  state: RevisionWorkflowState
  activityEvents: WorkflowActivityEvent[]
}

type RevisionApprovalOptions = {
  acceptsMockCredits: boolean
  understandsPreviewIsMock: boolean
  understandsRevisionIsLocal: boolean
}

const ignoredOperationTypes = new Set([
  'create_edit_map',
  'select_element',
  'select_group',
  'select_system',
  'change_scope',
  'reset_edit_map',
])

function buildContextKey(input: UseRevisionWorkflowInput) {
  return [
    input.projectId,
    input.sourcePreviewId ?? 'no-preview',
    input.sourcePreviewVersion ?? 0,
    input.sourceEditDocumentId ?? input.editMapState?.editDocument?.id ?? input.editDocument?.id ?? 'no-edit-document',
    input.sourceEditVersion ?? input.editMapState?.editDocument?.version ?? input.editDocument?.version ?? 0,
  ].join('|')
}

function createInitialState(input: UseRevisionWorkflowInput): RevisionWorkflowState {
  return {
    projectId: input.projectId,
    workspaceId: input.workspaceId ?? input.editMapState?.workspaceId,
    userId: input.userId ?? input.editMapState?.userId,
    activeRevisionRequest: null,
    revisionRequests: [],
    creditEstimates: [],
    approvals: [],
    jobs: [],
    versions: [],
    latestPreviewId: input.sourcePreviewId,
    latestPreviewVersion: input.sourcePreviewVersion,
    latestEditDocumentId: input.sourceEditDocumentId ?? input.editMapState?.editDocument?.id ?? input.editDocument?.id,
    latestEditVersion: input.sourceEditVersion ?? input.editMapState?.editDocument?.version ?? input.editDocument?.version,
    summary: {
      totalRevisions: 0,
      pendingRevisions: 0,
      completedRevisions: 0,
      failedRevisions: 0,
      mockCreditsEstimated: 0,
    },
    updatedAt: MOCK_CREATED_AT,
  }
}

function refreshSummary(state: RevisionWorkflowState): RevisionWorkflowState {
  return {
    ...state,
    summary: summarizeRevisionWorkflow(state),
    updatedAt: MOCK_CREATED_AT,
  }
}

function upsertRevisionRequest(state: RevisionWorkflowState, request: RevisionRequest): RevisionWorkflowState {
  return {
    ...state,
    activeRevisionRequest: request,
    revisionRequests: state.revisionRequests.some((candidate) => candidate.id === request.id)
      ? state.revisionRequests.map((candidate) => candidate.id === request.id ? request : candidate)
      : [...state.revisionRequests, request],
  }
}

function upsertApproval(state: RevisionWorkflowState, approval: RevisionApproval): RevisionWorkflowState {
  return {
    ...state,
    approvals: state.approvals.some((candidate) => candidate.id === approval.id)
      ? state.approvals.map((candidate) => candidate.id === approval.id ? approval : candidate)
      : [...state.approvals, approval],
  }
}

function upsertEstimate(state: RevisionWorkflowState, estimate: RevisionCreditEstimate): RevisionWorkflowState {
  return {
    ...state,
    creditEstimates: state.creditEstimates.some((candidate) => candidate.id === estimate.id)
      ? state.creditEstimates.map((candidate) => candidate.id === estimate.id ? estimate : candidate)
      : [...state.creditEstimates, estimate],
  }
}

function upsertJob(state: RevisionWorkflowState, job: MockRevisionJob): RevisionWorkflowState {
  return {
    ...state,
    jobs: state.jobs.some((candidate) => candidate.id === job.id)
      ? state.jobs.map((candidate) => candidate.id === job.id ? job : candidate)
      : [...state.jobs, job],
  }
}

function upsertVersion(state: RevisionWorkflowState, version: RevisionVersionRecord): RevisionWorkflowState {
  return {
    ...state,
    versions: state.versions.some((candidate) => candidate.id === version.id)
      ? state.versions.map((candidate) => candidate.id === version.id ? version : candidate)
      : [...state.versions, version],
    latestPreviewId: version.targetPreviewId,
    latestPreviewVersion: version.targetPreviewVersion,
    latestEditDocumentId: version.targetEditDocumentId,
    latestEditVersion: version.targetEditVersion,
  }
}

function getRequestEstimate(state: RevisionWorkflowState, request: RevisionRequest | null) {
  return request?.creditEstimateId
    ? state.creditEstimates.find((estimate) => estimate.id === request.creditEstimateId) ?? null
    : null
}

function getRequestApproval(state: RevisionWorkflowState, request: RevisionRequest | null) {
  return request?.approvalId
    ? state.approvals.find((approval) => approval.id === request.approvalId) ?? null
    : null
}

function getRequestJob(state: RevisionWorkflowState, request: RevisionRequest | null) {
  return request?.jobId
    ? state.jobs.find((job) => job.id === request.jobId) ?? null
    : null
}

function getPendingOperations(operations: EditMapLocalOperation[], revisionRequests: RevisionRequest[]) {
  const includedOperationIds = new Set(revisionRequests.flatMap((request) => request.editOperationIds))

  return operations.filter((operation) =>
    operation.status !== 'reverted' &&
    !ignoredOperationTypes.has(operation.type) &&
    !includedOperationIds.has(operation.id),
  )
}

export function useRevisionWorkflow(input: UseRevisionWorkflowInput) {
  const {
    editMapState = null,
    enabled = true,
    projectId,
  } = input
  const contextKey = buildContextKey(input)
  const [store, setStore] = useState<RevisionWorkflowStore | null>(null)
  const activeState = useMemo(
    () => enabled && store?.contextKey === contextKey
      ? store.state
      : createInitialState(input),
    [contextKey, enabled, input, store],
  )
  const activityEvents = useMemo(
    () => enabled && store?.contextKey === contextKey
      ? store.activityEvents
      : [],
    [contextKey, enabled, store],
  )
  const editDocument = editMapState?.editDocument ?? input.editDocument ?? null
  const systems = useMemo(() => editMapState?.systems ?? input.systems ?? [], [editMapState?.systems, input.systems])
  const groups = useMemo(() => editMapState?.groups ?? input.groups ?? [], [editMapState?.groups, input.groups])
  const elements = useMemo(() => editMapState?.elements ?? input.elements ?? [], [editMapState?.elements, input.elements])
  const operations = useMemo(() => editMapState?.operations ?? input.operations ?? [], [editMapState?.operations, input.operations])
  const pendingOperations = useMemo(
    () => getPendingOperations(operations, activeState.revisionRequests),
    [activeState.revisionRequests, operations],
  )

  const commitState = useCallback((nextState: RevisionWorkflowState, nextEvents?: WorkflowActivityEvent[]) => {
    setStore({
      contextKey,
      state: refreshSummary(nextState),
      activityEvents: nextEvents ?? activityEvents,
    })
  }, [activityEvents, contextKey])

  const createRevisionFromOperations = useCallback((operationIds?: string[] | EditMapLocalOperation[]) => {
    if (!enabled || !editDocument) return null

    const selectedOperations = Array.isArray(operationIds) && operationIds.length > 0
      ? typeof operationIds[0] === 'string'
        ? operations.filter((operation) => (operationIds as string[]).includes(operation.id))
        : operationIds as EditMapLocalOperation[]
      : pendingOperations

    const revisionOperations = selectedOperations.filter((operation) =>
      operation.status !== 'reverted' && !ignoredOperationTypes.has(operation.type),
    )
    if (!revisionOperations.length) return null

    const request = buildRevisionRequest({
      projectId,
      workspaceId: activeState.workspaceId,
      userId: activeState.userId,
      editOperations: revisionOperations,
      editDocument,
      systems,
      groups,
      elements,
      sourcePreviewId: activeState.latestPreviewId ?? input.sourcePreviewId,
      sourcePreviewVersion: activeState.latestPreviewVersion ?? input.sourcePreviewVersion,
      sourceEditDocumentId: activeState.latestEditDocumentId ?? input.sourceEditDocumentId ?? editDocument.id,
      sourceEditVersion: activeState.latestEditVersion ?? input.sourceEditVersion ?? editDocument.version,
      requestIndex: activeState.revisionRequests.length + 1,
    })
    const estimate = request.costPolicy === 'free'
      ? null
      : buildMockRevisionCreditEstimate({
          revisionRequest: request,
          projectId,
          workspaceId: activeState.workspaceId,
          userId: activeState.userId,
        })
    const approval = request.costPolicy === 'free'
      ? createRevisionApproval({
          projectId,
          workspaceId: activeState.workspaceId,
          userId: activeState.userId,
          revisionRequest: request,
          creditEstimate: null,
          acceptsMockCredits: true,
          understandsPreviewIsMock: true,
          understandsRevisionIsLocal: true,
        })
      : null
    const requestWithLinks: RevisionRequest = {
      ...request,
      status: approval?.status === 'not_required' ? 'ready' : request.status,
      creditEstimateId: estimate?.id,
      approvalId: approval?.id,
    }
    let nextState = upsertRevisionRequest(activeState, requestWithLinks)
    if (estimate) nextState = upsertEstimate(nextState, estimate)
    if (approval) nextState = upsertApproval(nextState, approval)
    const nextEvents = [
      ...activityEvents,
      createRevisionActivityEvent({
        projectId,
        workspaceId: nextState.workspaceId,
        userId: nextState.userId,
        revisionRequest: requestWithLinks,
        type: 'revision_request_created',
      }),
      ...(estimate
        ? [createRevisionActivityEvent({
            projectId,
            workspaceId: nextState.workspaceId,
            userId: nextState.userId,
            revisionRequest: requestWithLinks,
            type: 'revision_estimate_ready',
          })]
        : []),
      ...(requestWithLinks.costPolicy !== 'free'
        ? [createRevisionActivityEvent({
            projectId,
            workspaceId: nextState.workspaceId,
            userId: nextState.userId,
            revisionRequest: requestWithLinks,
            type: 'revision_approval_required',
          })]
        : []),
    ]
    commitState(nextState, nextEvents)
    return requestWithLinks
  }, [
    activeState,
    activityEvents,
    commitState,
    editDocument,
    elements,
    enabled,
    groups,
    input.sourceEditDocumentId,
    input.sourceEditVersion,
    input.sourcePreviewId,
    input.sourcePreviewVersion,
    operations,
    pendingOperations,
    projectId,
    systems,
  ])

  const approveRevision = useCallback((options: RevisionApprovalOptions) => {
    const request = activeState.activeRevisionRequest
    if (!enabled || !request || request.status === 'preview_ready') return null
    const estimate = getRequestEstimate(activeState, request)
    const approval = createRevisionApproval({
      projectId,
      workspaceId: activeState.workspaceId,
      userId: activeState.userId,
      revisionRequest: request,
      creditEstimate: estimate,
      ...options,
    })
    const approved = approval.status === 'approved' || approval.status === 'not_required'
    const nextRequest: RevisionRequest = {
      ...request,
      approvalId: approval.id,
      status: approved ? 'approved' : 'needs_approval',
      updatedAt: MOCK_CREATED_AT,
    }
    let nextState = upsertApproval(upsertRevisionRequest(activeState, nextRequest), approval)
    if (estimate && approved) {
      nextState = upsertEstimate(nextState, { ...estimate, status: 'approved', updatedAt: MOCK_CREATED_AT })
    }
    const nextEvents = [
      ...activityEvents,
      createRevisionActivityEvent({
        projectId,
        workspaceId: nextState.workspaceId,
        userId: nextState.userId,
        revisionRequest: nextRequest,
        type: approved ? 'revision_approved' : 'revision_approval_required',
      }),
    ]
    commitState(nextState, nextEvents)
    return nextRequest
  }, [activeState, activityEvents, commitState, enabled, projectId])

  const rejectRevision = useCallback(() => {
    const request = activeState.activeRevisionRequest
    if (!enabled || !request) return null
    const estimate = getRequestEstimate(activeState, request)
    const approval = rejectRevisionApprovalState({
      projectId,
      workspaceId: activeState.workspaceId,
      userId: activeState.userId,
      revisionRequest: request,
      creditEstimate: estimate,
    })
    const nextRequest: RevisionRequest = {
      ...request,
      approvalId: approval.id,
      status: 'rejected',
      updatedAt: MOCK_CREATED_AT,
    }
    const nextState = upsertApproval(upsertRevisionRequest(activeState, nextRequest), approval)
    const nextEvents = [
      ...activityEvents,
      createRevisionActivityEvent({
        projectId,
        workspaceId: nextState.workspaceId,
        userId: nextState.userId,
        revisionRequest: nextRequest,
        type: 'revision_rejected',
      }),
    ]
    commitState(nextState, nextEvents)
    return nextRequest
  }, [activeState, activityEvents, commitState, enabled, projectId])

  const queueRevisionJob = useCallback(() => {
    const request = activeState.activeRevisionRequest
    if (!enabled || !request || request.status === 'rejected' || request.status === 'cancelled' || request.status === 'preview_ready') return null
    const approval = getRequestApproval(activeState, request)
    const approvalAllowsQueue = request.costPolicy === 'free' || approval?.status === 'approved' || approval?.status === 'not_required'
    if (!approvalAllowsQueue) return null

    const job = createMockRevisionJob({
      projectId,
      workspaceId: activeState.workspaceId,
      userId: activeState.userId,
      revisionRequest: request,
      approval,
      jobIndex: activeState.jobs.length + 1,
      sourcePreviewVersion: activeState.latestPreviewVersion ?? request.sourcePreviewVersion,
      sourceEditVersion: activeState.latestEditVersion ?? request.sourceEditVersion,
    })
    const nextRequest: RevisionRequest = {
      ...request,
      jobId: job.id,
      status: 'queued',
      updatedAt: MOCK_CREATED_AT,
    }
    const nextState = upsertJob(upsertRevisionRequest(activeState, nextRequest), job)
    const nextEvents = [
      ...activityEvents,
      createRevisionActivityEvent({
        projectId,
        workspaceId: nextState.workspaceId,
        userId: nextState.userId,
        revisionRequest: nextRequest,
        job,
        type: 'mock_revision_job_queued',
      }),
    ]
    commitState(nextState, nextEvents)
    return job
  }, [activeState, activityEvents, commitState, enabled, projectId])

  const completeJobAndVersion = useCallback((job: MockRevisionJob, request: RevisionRequest, baseState: RevisionWorkflowState) => {
    const completedJob = completeRevisionJobState(job)
    const nextRequest: RevisionRequest = {
      ...request,
      status: 'preview_ready',
      targetPreviewId: completedJob.previewId,
      targetPreviewVersion: completedJob.previewVersion,
      targetEditDocumentId: completedJob.editDocumentId,
      targetEditVersion: completedJob.editVersion,
      updatedAt: MOCK_CREATED_AT,
    }
    const version = createRevisionVersionRecord({
      revisionRequest: nextRequest,
      job: completedJob,
      sourcePreviewId: request.sourcePreviewId,
      sourcePreviewVersion: request.sourcePreviewVersion,
      sourceEditDocumentId: request.sourceEditDocumentId,
      sourceEditVersion: request.sourceEditVersion,
    })
    return upsertVersion(upsertJob(upsertRevisionRequest(baseState, nextRequest), completedJob), version)
  }, [])

  const advanceRevisionJob = useCallback(() => {
    const request = activeState.activeRevisionRequest
    const job = getRequestJob(activeState, request)
    if (!enabled || !request || !job) return null
    const advancedJob = advanceRevisionJobState(job)
    const nextRequest: RevisionRequest = {
      ...request,
      status: advancedJob.status === 'completed' ? 'preview_ready' : 'running',
      targetPreviewId: advancedJob.status === 'completed' ? advancedJob.previewId : request.targetPreviewId,
      targetPreviewVersion: advancedJob.status === 'completed' ? advancedJob.previewVersion : request.targetPreviewVersion,
      targetEditDocumentId: advancedJob.status === 'completed' ? advancedJob.editDocumentId : request.targetEditDocumentId,
      targetEditVersion: advancedJob.status === 'completed' ? advancedJob.editVersion : request.targetEditVersion,
      updatedAt: MOCK_CREATED_AT,
    }
    let nextState = upsertJob(upsertRevisionRequest(activeState, nextRequest), advancedJob)
    if (advancedJob.status === 'completed') {
      const version = createRevisionVersionRecord({
        revisionRequest: nextRequest,
        job: advancedJob,
        sourcePreviewId: request.sourcePreviewId,
        sourcePreviewVersion: request.sourcePreviewVersion,
        sourceEditDocumentId: request.sourceEditDocumentId,
        sourceEditVersion: request.sourceEditVersion,
      })
      nextState = upsertVersion(nextState, version)
    }
    const nextEvents = [
      ...activityEvents,
      createRevisionActivityEvent({
        projectId,
        workspaceId: nextState.workspaceId,
        userId: nextState.userId,
        revisionRequest: nextRequest,
        job: advancedJob,
        type: advancedJob.status === 'completed' ? 'mock_revision_preview_ready' : 'mock_revision_job_progress',
      }),
    ]
    commitState(nextState, nextEvents)
    return advancedJob
  }, [activeState, activityEvents, commitState, enabled, projectId])

  const completeRevisionJob = useCallback(() => {
    const request = activeState.activeRevisionRequest
    const job = getRequestJob(activeState, request)
    if (!enabled || !request || !job) return null
    const nextState = completeJobAndVersion(job, request, activeState)
    const completedJob = getRequestJob(nextState, nextState.activeRevisionRequest) ?? job
    const nextEvents = [
      ...activityEvents,
      createRevisionActivityEvent({
        projectId,
        workspaceId: nextState.workspaceId,
        userId: nextState.userId,
        revisionRequest: nextState.activeRevisionRequest,
        job: completedJob,
        type: 'mock_revision_preview_ready',
      }),
    ]
    commitState(nextState, nextEvents)
    return completedJob
  }, [activeState, activityEvents, commitState, completeJobAndVersion, enabled, projectId])

  const failRevisionJob = useCallback((reason = 'Mock revision failed locally for review.') => {
    const request = activeState.activeRevisionRequest
    const job = getRequestJob(activeState, request)
    if (!enabled || !request || !job) return null
    const failedJob = failRevisionJobState(job, reason)
    const nextRequest: RevisionRequest = {
      ...request,
      status: 'failed',
      updatedAt: MOCK_CREATED_AT,
    }
    const nextState = upsertJob(upsertRevisionRequest(activeState, nextRequest), failedJob)
    const nextEvents = [
      ...activityEvents,
      createRevisionActivityEvent({
        projectId,
        workspaceId: nextState.workspaceId,
        userId: nextState.userId,
        revisionRequest: nextRequest,
        job: failedJob,
        type: 'mock_revision_failed',
      }),
    ]
    commitState(nextState, nextEvents)
    return failedJob
  }, [activeState, activityEvents, commitState, enabled, projectId])

  const resetActiveRevision = useCallback(() => {
    if (!enabled) return
    const nextState = {
      ...activeState,
      activeRevisionRequest: null,
      updatedAt: MOCK_CREATED_AT,
    }
    const nextEvents = [
      ...activityEvents,
      createRevisionActivityEvent({
        projectId,
        workspaceId: nextState.workspaceId,
        userId: nextState.userId,
        type: 'revision_reset',
      }),
    ]
    commitState(nextState, nextEvents)
  }, [activeState, activityEvents, commitState, enabled, projectId])

  const clearRevisionHistory = useCallback(() => {
    if (!enabled) return
    const nextState = createInitialState(input)
    const nextEvents = [
      ...activityEvents,
      createRevisionActivityEvent({
        projectId,
        workspaceId: nextState.workspaceId,
        userId: nextState.userId,
        type: 'revision_reset',
      }),
    ]
    commitState(nextState, nextEvents)
  }, [activityEvents, commitState, enabled, input, projectId])

  const activeRevisionRequest = activeState.activeRevisionRequest
  const activeCreditEstimate = useMemo(() => getRequestEstimate(activeState, activeRevisionRequest), [activeRevisionRequest, activeState])
  const activeApproval = useMemo(() => getRequestApproval(activeState, activeRevisionRequest), [activeRevisionRequest, activeState])
  const activeJob = useMemo(() => getRequestJob(activeState, activeRevisionRequest), [activeRevisionRequest, activeState])

  return {
    revisionWorkflowState: activeState,
    activeRevisionRequest,
    revisionRequests: activeState.revisionRequests,
    creditEstimates: activeState.creditEstimates,
    approvals: activeState.approvals,
    jobs: activeState.jobs,
    versions: activeState.versions,
    activeCreditEstimate,
    activeApproval,
    activeJob,
    pendingOperations,
    activityEvents,
    createRevisionFromOperations,
    approveRevision,
    rejectRevision,
    queueRevisionJob,
    advanceRevisionJob,
    completeRevisionJob,
    failRevisionJob,
    resetActiveRevision,
    clearRevisionHistory,
  }
}
