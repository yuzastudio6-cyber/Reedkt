import { ApiError } from '../../errors/api-error'
import { runBasicRenderSmoke } from '../../services/render-smoke-service'
import type { ServiceContext } from '../../types'
import type { WorkerJobRecord } from '../worker-job-loader'
import type { BasicRenderSmokeRequest, BasicRenderSmokeResponse, BasicRenderSmokeSourceObject } from './basic-render-smoke-types'

export async function runBasicRenderSmokeWorker(
  context: ServiceContext,
  job: WorkerJobRecord,
): Promise<BasicRenderSmokeResponse> {
  const request = requestFromJob(job)
  return runBasicRenderSmoke(context, request)
}

function requestFromJob(job: WorkerJobRecord): BasicRenderSmokeRequest {
  const sourceStorageObjectId = stringFromPayload(job.inputPayload, 'sourceStorageObjectId')
    ?? stringFromPayload(job.inputPayload, 'storageObjectRecordId')
  const renderJobId = stringFromPayload(job.inputPayload, 'renderJobId') ?? job.id
  const sourceStorageObject = sourceStorageObjectFromPayload(job.inputPayload)

  if (!job.projectId) {
    throw new ApiError('PROJECT_NOT_FOUND', 'Basic render smoke requires projectId.', 409)
  }
  if (!sourceStorageObjectId) {
    throw new ApiError('STORAGE_OBJECT_NOT_FOUND', 'Basic render smoke requires sourceStorageObjectId.', 409)
  }
  if (!job.approvedPlanSnapshotId) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Basic render smoke requires approvedPlanSnapshotId.', 409)
  }
  if (!job.creditReservationId) {
    throw new ApiError('CREDITS_NOT_RESERVED', 'Basic render smoke requires creditReservationId.', 409)
  }

  return {
    workspaceId: job.workspaceId,
    projectId: job.projectId,
    renderJobId,
    sourceStorageObjectId,
    sourceStorageObject,
    approvedPlanSnapshotId: job.approvedPlanSnapshotId,
    creditReservationId: job.creditReservationId,
    strict: true,
  }
}

function sourceStorageObjectFromPayload(payload: Record<string, unknown>): BasicRenderSmokeSourceObject | undefined {
  const source = payload.sourceStorageObject
  if (!source || typeof source !== 'object' || Array.isArray(source)) return undefined
  const record = source as Record<string, unknown>
  const id = stringFromPayload(record, 'id')
  const mediaAssetId = stringFromPayload(record, 'mediaAssetId')
  const bucketName = stringFromPayload(record, 'bucketName')
  const objectPath = stringFromPayload(record, 'objectPath')
  if (!id || !mediaAssetId || !bucketName || !objectPath) return undefined
  return {
    id,
    mediaAssetId,
    bucketName,
    objectPath,
    mimeType: stringFromPayload(record, 'mimeType'),
    sizeBytes: numberFromPayload(record, 'sizeBytes'),
    checksumSha256: stringFromPayload(record, 'checksumSha256'),
  }
}

function stringFromPayload(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key]
  return typeof value === 'string' ? value : undefined
}

function numberFromPayload(payload: Record<string, unknown>, key: string): number | undefined {
  const value = payload[key]
  return typeof value === 'number' ? value : undefined
}
