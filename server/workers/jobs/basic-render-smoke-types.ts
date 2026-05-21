import type { BasicPreviewRenderOutput } from '../../media/ffmpeg-preview'
import type { MediaProbeSummary } from '../../media/ffprobe'

export type RenderSmokeStatus = 'preview_ready' | 'skipped' | 'failed'

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
  warnings: string[]
  error?: {
    code: string
    message: string
  }
}
