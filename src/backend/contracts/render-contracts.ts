import type {
  ExportRecord,
  PreviewReviewRecord,
  QAReportRecord,
  RenderJobInputRecord,
  RenderJobRecord,
  RenderRecord,
  RevisionRequestItemRecord,
  RevisionRequestRecord,
} from '../../types'

export interface CreateRenderJobRequest {
  workspaceId: string
  projectId: string
  editPlanId: string
  creditEstimateId?: string
  creditReservationId?: string
}

export interface CreateRenderJobResponse {
  renderJob: RenderJobRecord
}

export interface MarkPreviewReadyRequest {
  renderJobId: string
}

export interface MarkPreviewReadyResponse {
  render: RenderRecord
  previewReview: PreviewReviewRecord
  qaReport: QAReportRecord
}

export interface CreateRenderJobInputsResponse {
  inputs: RenderJobInputRecord[]
}

export interface CreateRevisionRequestRequest {
  workspaceId: string
  projectId: string
  requestedChange: string
  renderId?: string
  editPlanId?: string
}

export interface CreateRevisionRequestResponse {
  revisionRequest: RevisionRequestRecord
}

export interface CreateRevisionRequestItemsResponse {
  items: RevisionRequestItemRecord[]
}

export interface CreateExportRequest {
  workspaceId: string
  projectId: string
  renderId: string
  requestedByUserId: string
}

export interface CreateExportResponse {
  exportRecord: ExportRecord
}
