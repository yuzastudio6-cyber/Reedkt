import type { BasicPreviewRenderOutput } from '../../media/ffmpeg-preview'
import type { MediaProbeSummary } from '../../media/ffprobe'

export type RenderSmokeStatus = 'preview_ready' | 'skipped' | 'failed'
export type FinalExportSmokeStatus = 'final_export_ready' | 'skipped' | 'failed'
export type BasicRenderSmokeEditAssemblyMode = 'clean_internal_preview' | 'private_final_export'

export interface BasicRenderSmokeEditAssemblyStep {
  label: string
  summary: string
}

export interface BasicRenderSmokeBriefLineage {
  briefId: string
  revisionNumber: number
  briefFingerprint: string
}

export interface BasicRenderSmokeOutputFrame {
  aspectRatio: string
  platformTarget: string
  width: number
  height: number
  confirmed: true
  source: string
}

export interface BasicRenderSmokeEditAssemblyPlan {
  planId: string
  briefLineage: BasicRenderSmokeBriefLineage
  title: string
  summary: string
  steps: BasicRenderSmokeEditAssemblyStep[]
  sourceDurationSeconds?: number
  sourceAspectRatio?: string
  outputFrame?: BasicRenderSmokeOutputFrame
  mode?: BasicRenderSmokeEditAssemblyMode
  professionalOperationCount?: number
  professionalOperationLabels?: string[]
  requiredQaChecks?: string[]
}

export interface BasicRenderSmokeEditAssemblyResult extends BasicRenderSmokeEditAssemblyPlan {
  mode: BasicRenderSmokeEditAssemblyMode
  operationsApplied: string[]
  planStepCount: number
  productReady: false
}

export interface BasicRenderSmokeSourceObject {
  id: string
  mediaAssetId: string
  bucketName: string
  objectPath: string
  mimeType?: string
  sizeBytes?: number
  checksumSha256?: string
}

export interface RenderSmokeQAResult {
  qaReportId: string
  status: 'passed' | 'failed' | 'skipped'
  checks: string[]
  warnings: string[]
}

export interface BasicRenderSmokeRequest {
  workspaceId: string
  projectId: string
  renderJobId: string
  sourceStorageObjectId: string
  sourceStorageObject?: BasicRenderSmokeSourceObject
  approvedPlanSnapshotId: string
  creditReservationId: string
  workerInstanceId?: string
  strict?: boolean
  editAssemblyPlan?: BasicRenderSmokeEditAssemblyPlan
}

export interface BasicFinalExportSmokeRequest extends BasicRenderSmokeRequest {
  previewReviewId: string
  previewReviewStatus: 'approved'
}

export interface BasicRenderSmokeResponse {
  ok: boolean
  status: RenderSmokeStatus
  renderId?: string
  renderJobId: string
  sourceMediaAssetId?: string
  sourceStorageObjectId?: string
  previewStorageObjectId?: string
  qaReportId?: string
  outputBucketName?: string
  outputObjectPath?: string
  durationSeconds?: number
  sizeBytes?: number
  checksumSha256?: string
  mediaProbe?: MediaProbeSummary
  previewRender?: Omit<BasicPreviewRenderOutput, 'outputPath'>
  editAssembly?: BasicRenderSmokeEditAssemblyResult
  warnings: string[]
  error?: {
    code: string
    message: string
  }
}

export interface BasicFinalExportSmokeResponse {
  ok: boolean
  status: FinalExportSmokeStatus
  renderId?: string
  renderJobId: string
  sourceMediaAssetId?: string
  sourceStorageObjectId?: string
  finalExportStorageObjectId?: string
  qaReportId?: string
  outputBucketName?: string
  outputObjectPath?: string
  durationSeconds?: number
  sizeBytes?: number
  checksumSha256?: string
  mediaProbe?: MediaProbeSummary
  finalExportRender?: Omit<BasicPreviewRenderOutput, 'outputPath'>
  editAssembly?: BasicRenderSmokeEditAssemblyResult
  previewReviewId?: string
  finalExportStarted: boolean
  publicDeliveryEnabled: false
  productReady: false
  warnings: string[]
  error?: {
    code: string
    message: string
  }
}
