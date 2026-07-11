import type {
  EditMapState,
  RevisionRequest,
  MockRevisionJob,
  RevisionVersionRecord,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type CreateRevisionVersionRecordInput = {
  revisionRequest: RevisionRequest
  job: MockRevisionJob
  sourcePreviewId?: string
  sourcePreviewVersion?: number
  sourceEditDocumentId?: string
  sourceEditVersion?: number
}

type ApplyRevisionVersionInput = {
  editMapState?: EditMapState | null
  versionRecord: RevisionVersionRecord
  revisionRequest: RevisionRequest
}

export function createRevisionVersionRecord({
  job,
  revisionRequest,
  sourceEditDocumentId,
  sourceEditVersion,
  sourcePreviewId,
  sourcePreviewVersion,
}: CreateRevisionVersionRecordInput): RevisionVersionRecord {
  const targetPreviewVersion = job.previewVersion ?? (sourcePreviewVersion ?? revisionRequest.sourcePreviewVersion ?? 0) + 1
  const targetEditVersion = job.editVersion ?? (sourceEditVersion ?? revisionRequest.sourceEditVersion ?? 0) + 1

  return {
    id: `${revisionRequest.id}-version-record`,
    projectId: revisionRequest.projectId,
    workspaceId: revisionRequest.workspaceId,
    userId: revisionRequest.userId,
    revisionRequestId: revisionRequest.id,
    sourcePreviewId: sourcePreviewId ?? revisionRequest.sourcePreviewId,
    sourcePreviewVersion: sourcePreviewVersion ?? revisionRequest.sourcePreviewVersion,
    targetPreviewId: job.previewId ?? `${revisionRequest.projectId}-mock-preview-v${targetPreviewVersion}`,
    targetPreviewVersion,
    sourceEditDocumentId: sourceEditDocumentId ?? revisionRequest.sourceEditDocumentId,
    sourceEditVersion: sourceEditVersion ?? revisionRequest.sourceEditVersion,
    targetEditDocumentId: job.editDocumentId ?? `${revisionRequest.projectId}-edit-document-v${targetEditVersion}`,
    targetEditVersion,
    summary: revisionRequest.summary,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function applyRevisionVersionToEditMapState({
  versionRecord,
}: ApplyRevisionVersionInput) {
  return {
    latestPreviewId: versionRecord.targetPreviewId,
    latestPreviewVersion: versionRecord.targetPreviewVersion,
    latestEditDocumentId: versionRecord.targetEditDocumentId,
    latestEditVersion: versionRecord.targetEditVersion,
  }
}
