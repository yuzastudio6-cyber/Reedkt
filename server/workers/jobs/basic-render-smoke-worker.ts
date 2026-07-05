import { ApiError } from '../../errors/api-error'
import { runBasicRenderSmoke } from '../../services/render-smoke-service'
import type { ServiceContext } from '../../types'
import type { WorkerJobRecord } from '../worker-job-loader'
import type {
  BasicRenderSmokeEditAssemblyPlan,
  BasicRenderSmokeEditAssemblyStep,
  BasicRenderSmokeRequest,
  BasicRenderSmokeResponse,
  BasicRenderSmokeSourceObject,
} from './basic-render-smoke-types'

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
    renderJobId: job.id,
    sourceStorageObjectId,
    sourceStorageObject,
    approvedPlanSnapshotId: job.approvedPlanSnapshotId,
    creditReservationId: job.creditReservationId,
    strict: true,
    editAssemblyPlan: editAssemblyPlanFromPayload(job.inputPayload),
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

function editAssemblyPlanFromPayload(payload: Record<string, unknown>): BasicRenderSmokeEditAssemblyPlan | undefined {
  const value = payload.editAssemblyPlan
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  const planId = stringFromPayload(record, 'planId')
  const title = stringFromPayload(record, 'title')
  const summary = stringFromPayload(record, 'summary')
  const rawSteps = Array.isArray(record.steps) ? record.steps : []
  const steps = rawSteps
    .map((step): BasicRenderSmokeEditAssemblyStep | undefined => {
      if (!step || typeof step !== 'object' || Array.isArray(step)) return undefined
      const stepRecord = step as Record<string, unknown>
      const label = stringFromPayload(stepRecord, 'label')
      const stepSummary = stringFromPayload(stepRecord, 'summary')
      if (!label || !stepSummary) return undefined
      return { label, summary: stepSummary }
    })
    .filter(Boolean) as BasicRenderSmokeEditAssemblyStep[]

  if (!planId || !title || !summary || steps.length === 0) return undefined

  return {
    planId,
    title,
    summary,
    steps,
    sourceDurationSeconds: numberFromPayload(record, 'sourceDurationSeconds'),
    sourceAspectRatio: stringFromPayload(record, 'sourceAspectRatio'),
    mode: stringFromPayload(record, 'mode') === 'private_final_export' ? 'private_final_export' : 'clean_internal_preview',
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
