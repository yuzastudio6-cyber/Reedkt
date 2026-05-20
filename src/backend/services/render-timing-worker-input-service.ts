import type {
  RenderTimingAssetRequirement,
  RenderTimingManifestRecord,
  RenderTimingValidationResult,
  RenderTimingWorkerInputRecord,
  RenderTimingWorkerReadiness,
  TimingConflictRecord,
} from '../../types/storytiming'
import type { JSONObject } from '../../types/shared'
import { createMockId, nowIso } from '../mock/mock-database'
import type { RenderTimingDependencyMap } from './render-timing-dependency-map-service'
import type { RenderLayerOrderItem } from './render-timing-layer-order-service'

export function createWorkerAssetRequirements(input: {
  manifest: RenderTimingManifestRecord
  missingAssets?: RenderTimingAssetRequirement[]
  allowMockAssetPlaceholders?: boolean
}): RenderTimingAssetRequirement[] {
  const assetRequirements = input.manifest.events.map((event) =>
    typeof event.payload.assetRequirement === 'string'
      ? event.payload.assetRequirement as RenderTimingAssetRequirement
      : 'no_asset_required',
  )

  if (input.allowMockAssetPlaceholders && (input.missingAssets?.length ?? 0) > 0) {
    assetRequirements.push('mock_asset_placeholder')
  }

  return Array.from(new Set(assetRequirements))
}

export function createWorkerNotes(input: {
  manifest: RenderTimingManifestRecord
  validation: RenderTimingValidationResult
}): string[] {
  return [
    ...input.manifest.workerNotes,
    'Mock worker input only; do not run FFmpeg, Remotion, cloud workers, uploads, or provider calls.',
    input.validation.ok
      ? 'Timing validation is acceptable for mock worker readiness.'
      : 'Resolve validation issues before real render worker readiness.',
  ]
}

export function createWorkerPayloadFromManifest(input: {
  manifest: RenderTimingManifestRecord
  dependencyMap: RenderTimingDependencyMap
  layerOrder: RenderLayerOrderItem[]
  validation: RenderTimingValidationResult
}): JSONObject {
  return {
    manifestId: input.manifest.id,
    status: input.manifest.status,
    durationSeconds: input.manifest.durationSeconds,
    frameRate: input.manifest.frameRate,
    tracks: input.manifest.tracks.map((track) => ({
      id: track.id,
      trackType: track.trackType,
      label: track.label,
      layerOrder: track.layerOrder,
      sourceSystem: track.sourceSystem,
      eventCount: track.eventIds.length,
    })),
    events: input.manifest.events.map((event) => ({
      eventId: event.eventId,
      eventType: event.eventType,
      trackType: event.trackType,
      startTimeSeconds: event.startTimeSeconds,
      hitTimeSeconds: event.hitTimeSeconds ?? null,
      endTimeSeconds: event.endTimeSeconds,
      sourceSystem: event.sourceSystem,
      sourceRecordId: event.sourceRecordId ?? '',
      payload: event.payload,
    })),
    dependencies: input.dependencyMap.dependencies.map((dependency) => ({
      id: dependency.id,
      dependencyType: dependency.dependencyType,
      required: dependency.required,
      fromEventId: dependency.fromEventId ?? '',
      toEventId: dependency.toEventId ?? '',
      fromAnchorId: dependency.fromAnchorId ?? '',
      toAnchorId: dependency.toAnchorId ?? '',
      reason: dependency.reason,
    })),
    layerOrder: input.layerOrder.map((layer) => ({
      trackType: layer.trackType,
      layerKind: layer.layerKind,
      layerOrder: layer.layerOrder,
      label: layer.label,
    })),
    validation: {
      ok: input.validation.ok,
      readiness: input.validation.readiness,
      issues: input.validation.issues,
      warnings: input.validation.warnings,
    },
    mockOnly: true,
  }
}

export function createRenderTimingWorkerInput(input: {
  manifest: RenderTimingManifestRecord
  dependencyMap: RenderTimingDependencyMap
  layerOrder: RenderLayerOrderItem[]
  validation: RenderTimingValidationResult
  readiness?: RenderTimingWorkerReadiness
  missingAssets?: RenderTimingAssetRequirement[]
  allowMockAssetPlaceholders?: boolean
  conflicts?: TimingConflictRecord[]
}): RenderTimingWorkerInputRecord {
  const requiredAssets = createWorkerAssetRequirements({
    manifest: input.manifest,
    missingAssets: input.missingAssets,
    allowMockAssetPlaceholders: input.allowMockAssetPlaceholders,
  })
  const blockingConflictIds = (input.conflicts ?? [])
    .filter((conflict) => conflict.blocksRender && conflict.status !== 'resolved' && conflict.status !== 'waived')
    .map((conflict) => conflict.id)
  const workerPayload = createWorkerPayloadFromManifest({
    manifest: input.manifest,
    dependencyMap: input.dependencyMap,
    layerOrder: input.layerOrder,
    validation: input.validation,
  })

  return {
    id: createMockId('render-timing-worker-input'),
    renderTimingManifestId: input.manifest.id,
    masterTimingMapId: input.manifest.masterTimingMapId,
    projectId: input.manifest.projectId,
    editPlanId: input.manifest.editPlanId,
    renderJobId: input.manifest.renderJobId,
    readiness: input.readiness ?? input.validation.readiness,
    requiredAssets,
    trackCount: input.manifest.tracks.length,
    eventCount: input.manifest.events.length,
    blockingConflictIds,
    workerPayload,
    workerNotes: createWorkerNotes({ manifest: input.manifest, validation: input.validation }),
    mockOnly: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      missingAssets: input.missingAssets ?? [],
      allowMockAssetPlaceholders: input.allowMockAssetPlaceholders ?? false,
    },
  }
}

export function createMockRenderWorkerInputSummary(workerInput: RenderTimingWorkerInputRecord): string {
  return `Mock render worker input ${workerInput.id} has ${workerInput.trackCount} track(s), ${workerInput.eventCount} event(s), and readiness ${workerInput.readiness}.`
}
