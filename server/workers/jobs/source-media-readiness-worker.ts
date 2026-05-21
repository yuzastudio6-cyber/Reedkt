import { ApiError } from '../../errors/api-error'
import type { ServiceContext } from '../../types'
import { throwOnSupabaseError } from '../../services/service-helpers'
import type { WorkerJobRecord } from '../worker-job-loader'

export interface SourceMediaReadinessResult {
  mediaAssetId?: string
  storageObjectRecordId?: string
  bucketName: string
  objectPath: string
  canonicalPath: boolean
  message: string
}

export async function runSourceMediaReadinessWorker(
  context: ServiceContext,
  job: WorkerJobRecord,
): Promise<SourceMediaReadinessResult> {
  const storageObject = await loadStorageObject(context, job)
  const canonicalPath = isCanonicalObjectPath(storageObject.objectPath, job.workspaceId, job.projectId)
  if (!canonicalPath) {
    throw new ApiError('VALIDATION_FAILED', 'Storage object path is not canonical for this workspace/project.', 409, {
      objectPath: storageObject.objectPath,
    })
  }

  return {
    mediaAssetId: storageObject.mediaAssetId,
    storageObjectRecordId: storageObject.id,
    bucketName: storageObject.bucketName,
    objectPath: storageObject.objectPath,
    canonicalPath,
    message: 'Source media storage metadata is ready. No media tool was executed.',
  }
}

export async function loadStorageObject(context: ServiceContext, job: WorkerJobRecord): Promise<{
  id?: string
  mediaAssetId?: string
  bucketName: string
  objectPath: string
  mimeType?: string
  sizeBytes?: number
}> {
  const payloadStorage = storageObjectFromPayload(job.inputPayload)
  if (!context.clients.admin || context.env.mockOnly) {
    if (!payloadStorage) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'Mock source media readiness requires storage object metadata in payloadJson.', 409)
    }
    return payloadStorage
  }

  const storageObjectRecordId = stringFromPayload(job.inputPayload, 'storageObjectRecordId')
  const mediaAssetId = stringFromPayload(job.inputPayload, 'mediaAssetId')
  let query = context.clients.admin.from('storage_object_records').select('*').limit(1)
  if (storageObjectRecordId) query = query.eq('id', storageObjectRecordId)
  else if (mediaAssetId) query = query.eq('media_asset_id', mediaAssetId)
  else throw new ApiError('UPLOAD_NOT_FINALIZED', 'Source media readiness requires storageObjectRecordId or mediaAssetId.', 409)

  const { data, error } = await query.maybeSingle()
  throwOnSupabaseError(error, 'UPLOAD_NOT_FINALIZED')
  if (!data) throw new ApiError('UPLOAD_NOT_FINALIZED', 'Storage object record was not found.', 404)

  return {
    id: String(data.id),
    mediaAssetId: typeof data.media_asset_id === 'string' ? data.media_asset_id : undefined,
    bucketName: String(data.bucket_name),
    objectPath: String(data.object_path),
    mimeType: typeof data.mime_type === 'string' ? data.mime_type : undefined,
    sizeBytes: typeof data.size_bytes === 'number' ? data.size_bytes : undefined,
  }
}

function storageObjectFromPayload(payload: Record<string, unknown>) {
  const bucketName = stringFromPayload(payload, 'bucketName')
  const objectPath = stringFromPayload(payload, 'objectPath')
  if (!bucketName || !objectPath) return undefined
  return {
    id: stringFromPayload(payload, 'storageObjectRecordId'),
    mediaAssetId: stringFromPayload(payload, 'mediaAssetId'),
    bucketName,
    objectPath,
    mimeType: stringFromPayload(payload, 'mimeType'),
    sizeBytes: numberFromPayload(payload, 'sizeBytes'),
  }
}

export function isCanonicalObjectPath(objectPath: string, workspaceId: string, projectId?: string): boolean {
  const prefix = projectId
    ? `workspaces/${workspaceId}/projects/${projectId}/`
    : `workspaces/${workspaceId}/`
  return objectPath.startsWith(prefix) && !objectPath.includes('..') && !objectPath.includes('\\')
}

function stringFromPayload(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key]
  return typeof value === 'string' ? value : undefined
}

function numberFromPayload(payload: Record<string, unknown>, key: string): number | undefined {
  const value = payload[key]
  return typeof value === 'number' ? value : undefined
}
