import type { JSONObject, JSONValue } from '../../../types/shared'
import { runRemotionWorkerSkeleton } from './remotion-worker-skeleton'
import type { RemotionWorkerMockResult } from './remotion-worker-types'
import type {
  RemotionRenderOutputFormat,
  RemotionRenderQualityLevel,
  RemotionRenderType,
  RemotionRenderWorkerRequest,
} from '../../cloud/remotion-render-contracts'
import type { GcsBucketPurpose, GcsObjectLocation } from '../../cloud/gcs-storage-contracts'
import type { ReeditProRuntimeRegion } from '../../cloud/live-gcp-resource-map'

export interface RemotionWorkerEntrypointEnv {
  PROJECT_ID?: string
  RUNTIME_REGION?: string
  SERVER_RUNTIME_MODE?: 'mock' | 'disabled' | 'real'
  SUPABASE_URL_SECRET_NAME?: string
  SUPABASE_SERVICE_ROLE_SECRET_NAME?: string
  GCS_PREVIEWS_BUCKET?: string
  GCS_EXPORTS_BUCKET?: string
  GCS_WORKER_TEMP_BUCKET?: string
}

export interface RemotionWorkerEntrypointResult {
  ok: boolean
  status: 'mock_result' | 'blocked'
  result?: RemotionWorkerMockResult
  errors: string[]
  warnings: string[]
  sanitizedJson: JSONObject
}

const REQUIRED_RENDER_FIELDS = [
  'renderJobId',
  'jobId',
  'approvedPlanSnapshotId',
  'creditReservationId',
  'idempotencyKey',
] as const

const DEFAULT_RUNTIME_REGION: ReeditProRuntimeRegion = 'us-east1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringFromRecord(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function numberFromRecord(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function jsonObjectFromRecord(record: Record<string, unknown>, key: string): JSONObject | undefined {
  const value = record[key]
  return isRecord(value) ? value as JSONObject : undefined
}

function gcsLocationsFromRecord(record: Record<string, unknown>, key: string): GcsObjectLocation[] {
  const value = record[key]
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecord).map((location) => location as unknown as GcsObjectLocation)
}

function buildRequestFromPayload(payload: Record<string, unknown>): RemotionRenderWorkerRequest {
  const timelineSpec = isRecord(payload.timelineSpec)
    ? payload.timelineSpec as unknown as RemotionRenderWorkerRequest['timelineSpec']
    : { layers: [] }

  return {
    renderJobId: stringFromRecord(payload, 'renderJobId') ?? '',
    jobId: stringFromRecord(payload, 'jobId') ?? '',
    workspaceId: stringFromRecord(payload, 'workspaceId') ?? '',
    projectId: stringFromRecord(payload, 'projectId') ?? '',
    approvedPlanSnapshotId: stringFromRecord(payload, 'approvedPlanSnapshotId') ?? '',
    editPlanId: stringFromRecord(payload, 'editPlanId') ?? '',
    creditReservationId: stringFromRecord(payload, 'creditReservationId') ?? '',
    renderType: (stringFromRecord(payload, 'renderType') ?? 'preview') as RemotionRenderType,
    renderQualityLevel: (stringFromRecord(payload, 'renderQualityLevel') ?? 'draft') as RemotionRenderQualityLevel,
    outputFormat: (stringFromRecord(payload, 'outputFormat') ?? 'mp4') as RemotionRenderOutputFormat,
    width: numberFromRecord(payload, 'width') ?? 0,
    height: numberFromRecord(payload, 'height') ?? 0,
    frameRate: numberFromRecord(payload, 'frameRate') ?? 0,
    durationSeconds: numberFromRecord(payload, 'durationSeconds'),
    timelineSpec,
    sourceAssetLocations: gcsLocationsFromRecord(payload, 'sourceAssetLocations'),
    generatedAssetLocations: gcsLocationsFromRecord(payload, 'generatedAssetLocations'),
    outputBucketPurpose: (stringFromRecord(payload, 'outputBucketPurpose') ?? 'previews') as GcsBucketPurpose,
    outputObjectPath: stringFromRecord(payload, 'outputObjectPath') ?? '',
    idempotencyKey: stringFromRecord(payload, 'idempotencyKey') ?? '',
    approvalGates: isRecord(payload.approvalGates)
      ? payload.approvalGates as RemotionRenderWorkerRequest['approvalGates']
      : undefined,
    metadata: jsonObjectFromRecord(payload, 'metadata'),
  }
}

function createBlockedResult(errors: string[], warnings: string[]): RemotionWorkerEntrypointResult {
  return {
    ok: false,
    status: 'blocked',
    errors,
    warnings,
    sanitizedJson: {
      ok: false,
      status: 'blocked',
      errors,
      warnings,
      mockOnly: true,
      noRealRender: true,
    },
  }
}

interface EntrypointRuntimeValidation {
  errors: string[]
  warnings: string[]
  runtimeRegion: ReeditProRuntimeRegion
}

function isRuntimeRegion(value: unknown): value is ReeditProRuntimeRegion {
  return value === 'us-east1' || value === 'europe-west1'
}

function runtimeRegionFromPayload(payload: Record<string, unknown>): unknown {
  if (!isRecord(payload.metadata)) {
    return undefined
  }

  return payload.metadata.runtimeRegion
}

function validateEntrypointRuntime(
  env: RemotionWorkerEntrypointEnv,
  payload: Record<string, unknown>,
): EntrypointRuntimeValidation {
  const errors: string[] = []
  const warnings: string[] = []
  let runtimeRegion: ReeditProRuntimeRegion = DEFAULT_RUNTIME_REGION

  if (env.PROJECT_ID && env.PROJECT_ID !== 'reeditpro') {
    warnings.push('PROJECT_ID should be reeditpro for the planned production render worker.')
  }

  if (env.SERVER_RUNTIME_MODE && env.SERVER_RUNTIME_MODE !== 'mock') {
    warnings.push('RP-RENDER-02 supports mock mode only; real render transport remains future work.')
  }

  if (env.RUNTIME_REGION) {
    if (isRuntimeRegion(env.RUNTIME_REGION)) {
      runtimeRegion = env.RUNTIME_REGION
    } else {
      errors.push('RUNTIME_REGION must be us-east1 or europe-west1.')
    }

    return { errors, warnings, runtimeRegion }
  }

  const payloadRuntimeRegion = runtimeRegionFromPayload(payload)
  if (payloadRuntimeRegion === undefined) {
    return { errors, warnings, runtimeRegion }
  }

  if (isRuntimeRegion(payloadRuntimeRegion)) {
    runtimeRegion = payloadRuntimeRegion
  } else {
    warnings.push('payload.metadata.runtimeRegion must be us-east1 or europe-west1 when provided; defaulting to us-east1.')
  }

  return { errors, warnings, runtimeRegion }
}

export function createRemotionWorkerPayloadFromJson(json: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(json)
  if (!isRecord(parsed)) {
    throw new Error('Remotion worker payload JSON must parse to an object.')
  }
  return parsed
}

export function runRemotionWorkerEntrypoint(input: {
  env?: RemotionWorkerEntrypointEnv
  payload: Record<string, unknown>
}): RemotionWorkerEntrypointResult {
  const runtimeValidation = validateEntrypointRuntime(input.env ?? {}, input.payload)
  const envWarnings = runtimeValidation.warnings
  const missingFields = REQUIRED_RENDER_FIELDS.filter((field) => !stringFromRecord(input.payload, field))

  if (runtimeValidation.errors.length > 0) {
    return createBlockedResult(runtimeValidation.errors, envWarnings)
  }

  if (missingFields.length > 0) {
    return createBlockedResult(
      missingFields.map((field) => `Remotion worker payload requires ${field}.`),
      envWarnings,
    )
  }

  const request = buildRequestFromPayload(input.payload)
  const result = runRemotionWorkerSkeleton(request, {
    runtimeRegion: runtimeValidation.runtimeRegion,
  })
  const outputLocation = result.outputLocation ?? result.manifest?.outputLocation
  const sanitizedOutputLocation: JSONObject | null = outputLocation
    ? {
        bucketPurpose: outputLocation.bucketPurpose,
        bucketName: outputLocation.bucketName,
        objectPath: outputLocation.objectPath,
        signedUrlRequired: outputLocation.signedUrlRequired,
        publicUrlAllowed: outputLocation.publicUrlAllowed ?? false,
      }
    : null
  const sanitizedJson: JSONObject = {
    ok: result.ok,
    status: result.ok ? 'mock_validated' : 'blocked',
    mode: result.mode,
    renderJobId: request.renderJobId,
    jobId: request.jobId,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    idempotencyKey: request.idempotencyKey,
    renderType: request.renderType,
    outputBucketPurpose: request.outputBucketPurpose,
    outputObjectPath: request.outputObjectPath,
    preflight: result.preflight as unknown as JSONObject,
    events: result.events.map((event) => ({
      eventType: event.eventType,
      message: event.message,
      visibleToUser: event.visibleToUser,
      createdAt: event.createdAt,
    })),
    warnings: [...envWarnings, ...result.preflight.warnings],
    outputLocation: sanitizedOutputLocation,
    metadata: {
      mockOnly: true,
      noRealRender: true,
      noRemotionImport: true,
      noGcsAccess: true,
      noSecretRead: true,
      noProviderCall: true,
      runtimeRegion: runtimeValidation.runtimeRegion,
      manifestId: result.manifest?.id ?? null,
      summary: result.summary,
    },
  }

  return {
    ok: result.ok,
    status: result.ok ? 'mock_result' : 'blocked',
    result,
    errors: result.preflight.errors,
    warnings: [...envWarnings, ...result.preflight.warnings],
    sanitizedJson,
  }
}

export function stringifyRemotionWorkerEntrypointResult(
  result: RemotionWorkerEntrypointResult,
): string {
  return JSON.stringify(result.sanitizedJson as JSONValue, null, 2)
}
