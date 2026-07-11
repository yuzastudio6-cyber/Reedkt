import type {
  EditDocument,
  EditElement,
  EditGroup,
  EditMapLocalOperation,
  EditSystem,
  RevisionWorkflowState,
  RevisionRequest,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import {
  classifyEditOperationsForRevision,
  getRevisionCostPolicy,
  getRevisionExecutionMode,
  getRevisionOperationSummary,
} from './revision-classifier'

type BuildRevisionRequestInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  editOperations: EditMapLocalOperation[]
  editDocument?: EditDocument | null
  systems?: EditSystem[]
  groups?: EditGroup[]
  elements?: EditElement[]
  sourcePreviewId?: string
  sourcePreviewVersion?: number
  sourceEditDocumentId?: string
  sourceEditVersion?: number
  requestIndex: number
}

export function buildRevisionRequest({
  editDocument,
  editOperations,
  elements,
  groups,
  projectId,
  requestIndex,
  sourceEditDocumentId,
  sourceEditVersion,
  sourcePreviewId,
  sourcePreviewVersion,
  systems,
  userId,
  workspaceId,
}: BuildRevisionRequestInput): RevisionRequest {
  const classifications = classifyEditOperationsForRevision({
    editOperations,
    editDocument,
    systems,
    groups,
    elements,
  })
  const executionMode = getRevisionExecutionMode(classifications)
  const costPolicy = getRevisionCostPolicy(classifications)
  const id = `${projectId}-revision-request-${String(requestIndex).padStart(3, '0')}`

  return {
    id,
    projectId,
    workspaceId,
    userId,
    status: costPolicy === 'free' ? 'ready' : 'needs_approval',
    sourcePreviewId,
    sourcePreviewVersion,
    sourceEditDocumentId: sourceEditDocumentId ?? editDocument?.id,
    sourceEditVersion: sourceEditVersion ?? editDocument?.version,
    editOperationIds: editOperations.map((operation) => operation.id),
    classifications,
    executionMode,
    costPolicy,
    summary: getRevisionOperationSummary(classifications),
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function summarizeRevisionWorkflow(state: RevisionWorkflowState): RevisionWorkflowState['summary'] {
  return {
    totalRevisions: state.revisionRequests.length,
    pendingRevisions: state.revisionRequests.filter((request) =>
      request.status === 'draft' ||
      request.status === 'ready' ||
      request.status === 'needs_approval' ||
      request.status === 'approved' ||
      request.status === 'queued' ||
      request.status === 'running',
    ).length,
    completedRevisions: state.revisionRequests.filter((request) => request.status === 'preview_ready').length,
    failedRevisions: state.revisionRequests.filter((request) => request.status === 'failed').length,
    mockCreditsEstimated: state.creditEstimates.reduce((total, estimate) => total + estimate.totalCredits, 0),
  }
}
