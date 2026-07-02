import type { ID, JSONObject } from '../../../types/shared'
import { getReeditProBucketName, type ReeditProRuntimeRegion } from '../../cloud/live-gcp-resource-map'
import { validateRemotionRenderWorkerRequest } from '../../cloud/remotion-render-contracts'
import type { GcsBucketPurpose, GcsObjectLocation } from '../../cloud/gcs-storage-contracts'
import type { RemotionRenderWorkerRequest } from '../../cloud/remotion-render-contracts'
import type {
  RemotionRenderManifest,
  RemotionWorkerAssetDependency,
  RemotionWorkerLayerManifestItem,
  RemotionWorkerPreflightResult,
  RemotionWorkerQAFallbackRef,
  RemotionWorkerTimingValidationRef,
} from './remotion-worker-types'

function nowIso(): string {
  return new Date().toISOString()
}

function mockId(prefix: string, seed: string): ID {
  return `${prefix}_${seed.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48)}`
}

function outputBucketPurposeForRender(request: RemotionRenderWorkerRequest): GcsBucketPurpose {
  if (request.renderType === 'final_export') return 'exports'
  return 'previews'
}

function createOutputLocation(
  request: RemotionRenderWorkerRequest,
  runtimeRegion: ReeditProRuntimeRegion,
): GcsObjectLocation {
  const bucketPurpose = outputBucketPurposeForRender(request)

  return {
    bucketPurpose,
    bucketName: getReeditProBucketName(bucketPurpose, runtimeRegion),
    objectPath: request.outputObjectPath,
    contentType: request.outputFormat === 'webm'
      ? 'video/webm'
      : request.outputFormat === 'png_sequence'
        ? 'application/json'
        : 'video/mp4',
    signedUrlRequired: true,
    publicUrlAllowed: false,
    createdByJobId: request.jobId,
    metadata: {
      mockOnly: true,
      renderType: request.renderType,
      renderQualityLevel: request.renderQualityLevel,
    },
  }
}

function dependenciesFromLocations(
  locations: GcsObjectLocation[],
  role: RemotionWorkerAssetDependency['role'],
): RemotionWorkerAssetDependency[] {
  return locations.map((location, index) => ({
    id: mockId(`${role}_dependency`, `${location.objectPath}_${index}`),
    role,
    requiredForFinal: role !== 'placeholder',
    placeholderAllowed: false,
    status: 'ready',
    storageLocation: location,
    notes: ['Provided by future worker request. This skeleton does not download or inspect the asset.'],
  }))
}

function createLayerManifestItems(request: RemotionRenderWorkerRequest): RemotionWorkerLayerManifestItem[] {
  return request.timelineSpec.layers.map((layer, index) => {
    const startFrame = typeof layer.startFrame === 'number' ? layer.startFrame : 0
    const endFrame = typeof layer.endFrame === 'number'
      ? layer.endFrame
      : request.timelineSpec.durationFrames ?? Math.max(1, Math.round((request.durationSeconds ?? 1) * request.frameRate))

    return {
      id: typeof layer.layerId === 'string' ? layer.layerId : mockId('remotion_layer', `${request.renderJobId}_${index}`),
      layerType: typeof layer.layerType === 'string'
        ? layer.layerType as RemotionWorkerLayerManifestItem['layerType']
        : 'placeholder',
      startFrame,
      endFrame,
      zIndex: typeof layer.zIndex === 'number' ? layer.zIndex : index,
      assetDependencyIds: Array.isArray(layer.assetDependencyIds)
        ? layer.assetDependencyIds.filter((value): value is string => typeof value === 'string')
        : [],
      renderNotes: ['Mock layer manifest item. Future Remotion worker will convert this to a composition layer.'],
      metadata: layer,
    }
  })
}

export function createDefaultTimingValidationRef(metadata?: JSONObject): RemotionWorkerTimingValidationRef {
  const status = metadata?.timingValidationStatus
  if (status === 'blocking' || status === 'failed') {
    return {
      status,
      warnings: [],
      blockers: ['Timing validation is blocking render readiness.'],
    }
  }

  return {
    status: status === 'passed' || status === 'warning' ? status : 'not_checked',
    warnings: status === 'warning' ? ['Timing validation produced warnings.'] : [],
    blockers: [],
  }
}

export function createDefaultQAFallbackRef(metadata?: JSONObject): RemotionWorkerQAFallbackRef {
  const status = metadata?.qaFallbackStatus
  if (status === 'blocking' || status === 'failed') {
    return {
      status,
      warnings: [],
      blockers: ['QA/fallback state is blocking render readiness.'],
    }
  }

  return {
    status: status === 'passed' || status === 'warning' ? status : 'not_checked',
    warnings: status === 'warning' ? ['QA/fallback state produced warnings.'] : [],
    blockers: [],
  }
}

export function preflightRemotionRenderRequest(request: RemotionRenderWorkerRequest): RemotionWorkerPreflightResult {
  const validation = validateRemotionRenderWorkerRequest(request)
  const warnings = [...validation.warnings]
  const errors = [...validation.errors]
  const timingValidation = createDefaultTimingValidationRef(request.metadata)
  const qaFallback = createDefaultQAFallbackRef(request.metadata)

  if (timingValidation.blockers.length > 0) {
    errors.push(...timingValidation.blockers)
  }

  if (qaFallback.blockers.length > 0) {
    errors.push(...qaFallback.blockers)
  }

  const status = errors.length > 0
    ? errors.some((error) => /creditReservationId/i.test(error))
      ? 'blocked_missing_credit_reservation'
      : errors.some((error) => /approvedPlanSnapshotId/i.test(error))
        ? 'blocked_missing_approval'
        : errors.some((error) => /timelineSpec/i.test(error))
          ? 'blocked_missing_timeline'
          : errors.some((error) => /Timing validation/i.test(error))
            ? 'blocked_timing_validation'
            : errors.some((error) => /QA\/fallback/i.test(error))
              ? 'blocked_qa_fallback'
              : 'blocked_missing_assets'
    : 'ready_for_mock'

  return {
    ok: errors.length === 0,
    status,
    errors,
    warnings,
    checkedAt: nowIso(),
  }
}

export function buildRemotionRenderManifest(
  request: RemotionRenderWorkerRequest,
  runtimeRegion: ReeditProRuntimeRegion = 'us-east1',
): RemotionRenderManifest {
  const sourceDependencies = dependenciesFromLocations(request.sourceAssetLocations, 'source_media')
  const generatedDependencies = dependenciesFromLocations(request.generatedAssetLocations, 'generated_asset')
  const outputLocation = createOutputLocation(request, runtimeRegion)
  const durationFrames = request.timelineSpec.durationFrames ?? (
    request.durationSeconds ? Math.round(request.durationSeconds * request.frameRate) : undefined
  )

  return {
    id: mockId('remotion_render_manifest', request.idempotencyKey),
    renderJobId: request.renderJobId,
    jobId: request.jobId,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    editPlanId: request.editPlanId,
    creditReservationId: request.creditReservationId,
    runtimeRegion,
    renderType: request.renderType,
    renderQualityLevel: request.renderQualityLevel,
    outputFormat: request.outputFormat,
    width: request.width,
    height: request.height,
    frameRate: request.frameRate,
    durationSeconds: request.durationSeconds,
    durationFrames,
    sourceAssetLocations: request.sourceAssetLocations,
    generatedAssetLocations: request.generatedAssetLocations,
    assetDependencies: [...sourceDependencies, ...generatedDependencies],
    layers: createLayerManifestItems(request),
    timingValidation: createDefaultTimingValidationRef(request.metadata),
    qaFallback: createDefaultQAFallbackRef(request.metadata),
    outputLocation,
    idempotencyKey: request.idempotencyKey,
    mockOnly: true,
    createdAt: nowIso(),
    metadata: {
      ...(request.metadata ?? {}),
      workerSkeleton: 'RP-RENDER-01',
      noRealRender: true,
    },
  }
}
