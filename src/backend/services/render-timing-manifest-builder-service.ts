import type {
  MasterTimingMapRecord,
  RenderTimingAssetRequirement,
  RenderTimingManifestEvent,
  RenderTimingManifestRecord,
  RenderTimingTrack,
  RenderTimingValidationResult,
  RenderTimingWorkerInputRecord,
  StoryTimingQACheckRecord,
  StoryTimingQAReportRecord,
  StoryTimingSegmentRecord,
  StoryTimingTrackType,
  TimingConflictRecord,
  TimingConflictResolutionRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import type { TargetPlatform } from '../../types/shared'
import { createMockId, findMockRecord, nowIso, type MockDatabase } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'
import { createRenderTimingChatSummary } from './render-timing-chat-summary-service'
import {
  createRenderTimingDependencyMap,
  type RenderTimingDependencyMap,
} from './render-timing-dependency-map-service'
import { createRenderManifestEvents } from './render-timing-event-payload-service'
import {
  createLayerOrderSummary,
  createRenderLayerOrder,
  type RenderLayerOrderItem,
} from './render-timing-layer-order-service'
import {
  createRenderTimingTracks,
  createTrackSummary,
} from './render-timing-track-service'
import { validateRenderTimingManifest } from './render-timing-validation-service'
import { createRenderTimingWorkerInput } from './render-timing-worker-input-service'

export interface BuildRenderTimingManifestRequest {
  masterTimingMap: MasterTimingMapRecord
  segments?: StoryTimingSegmentRecord[]
  events: TimingEventRecord[]
  dependencies?: TimingDependencyRecord[]
  conflicts?: TimingConflictRecord[]
  conflictResolutions?: TimingConflictResolutionRecord[]
  qaReport?: StoryTimingQAReportRecord
  qaChecks?: StoryTimingQACheckRecord[]
  renderJobId?: string
  requiredTrackTypes?: StoryTimingTrackType[]
  omitTrackTypes?: StoryTimingTrackType[]
  layerOrderOverrides?: Partial<Record<StoryTimingTrackType, number>>
  requiredAssets?: RenderTimingAssetRequirement[]
  missingAssets?: RenderTimingAssetRequirement[]
  allowMockAssetPlaceholders?: boolean
  userInstructions?: string[]
  platformTarget?: TargetPlatform
  workerNotes?: string[]
}

export interface BuildRenderTimingManifestResponse {
  renderTimingManifest: RenderTimingManifestRecord
  tracks: RenderTimingTrack[]
  manifestEvents: RenderTimingManifestEvent[]
  dependencyMap: RenderTimingDependencyMap
  layerOrder: RenderLayerOrderItem[]
  validation: RenderTimingValidationResult
  workerInput: RenderTimingWorkerInputRecord
  chatSummary: string[]
  warnings: string[]
}

function eventTimeRangesAreValid(events: TimingEventRecord[]): boolean {
  return events.every((event) =>
    event.startTimeSeconds >= 0 &&
    event.endTimeSeconds >= event.startTimeSeconds &&
    (event.hitTimeSeconds === undefined ||
      (event.hitTimeSeconds >= event.startTimeSeconds && event.hitTimeSeconds <= event.endTimeSeconds)),
  )
}

function hasBlockingTiming(input: BuildRenderTimingManifestRequest): boolean {
  const blockingConflict = (input.conflicts ?? []).some((conflict) =>
    conflict.blocksRender && conflict.status !== 'resolved' && conflict.status !== 'waived',
  )
  const blockingQA = Boolean(input.qaReport?.blocksRender) ||
    (input.qaChecks ?? []).some((check) => check.blocksRender && check.status !== 'waived')

  return blockingConflict || blockingQA || !eventTimeRangesAreValid(input.events)
}

function createWorkerNotes(input: BuildRenderTimingManifestRequest): string[] {
  return input.workerNotes ?? [
    'Worker-ready timing manifest is mock metadata only; no render engine is invoked.',
    'Future workers must follow StoryTiming event start, hit, and end times exactly.',
    input.platformTarget ? `Platform/export target context: ${input.platformTarget}.` : 'No platform target override supplied.',
    input.userInstructions?.length ? `User timing instructions: ${input.userInstructions.join('; ')}` : 'No user timing override supplied.',
  ]
}

export function buildRenderTimingManifest(input: BuildRenderTimingManifestRequest): ServiceResult<BuildRenderTimingManifestResponse> {
  const tracks = createRenderTimingTracks({
    events: input.events,
    requiredTrackTypes: input.requiredTrackTypes,
    omitTrackTypes: input.omitTrackTypes,
    layerOrderOverrides: input.layerOrderOverrides,
  })
  const manifestEvents = createRenderManifestEvents(input.events)
  const dependencyMap = createRenderTimingDependencyMap(input.dependencies)
  const layerOrder = createRenderLayerOrder(tracks)
  const conflictsResolved = (input.conflictResolutions ?? [])
    .filter((resolution) => resolution.approved)
    .map((resolution) => resolution.timingConflictId)
  const readyForRender = !hasBlockingTiming(input)
  const renderTimingManifest: RenderTimingManifestRecord = {
    id: createMockId('render-timing-manifest'),
    masterTimingMapId: input.masterTimingMap.id,
    projectId: input.masterTimingMap.projectId,
    editPlanId: input.masterTimingMap.editPlanId,
    renderJobId: input.renderJobId,
    status: readyForRender ? 'ready_for_worker' : 'draft',
    durationSeconds: input.masterTimingMap.durationSeconds,
    frameRate: input.masterTimingMap.frameRate,
    tracks,
    events: manifestEvents,
    dependencies: dependencyMap.dependencies.map((dependency) => dependency.id),
    conflictsResolved,
    readyForRender,
    workerNotes: createWorkerNotes(input),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
      trackSummary: createTrackSummary(tracks),
      layerOrderSummary: createLayerOrderSummary(tracks),
      segmentCount: input.segments?.length ?? 0,
      workerReadinessOnly: true,
    },
  }
  const validation = validateRenderTimingManifest({
    renderTimingManifest,
    events: input.events,
    dependencies: input.dependencies,
    conflicts: input.conflicts,
    qaReport: input.qaReport,
    qaChecks: input.qaChecks,
    requiredTrackTypes: input.requiredTrackTypes,
    requiredAssets: input.requiredAssets,
    missingAssets: input.missingAssets,
    allowMockAssetPlaceholders: input.allowMockAssetPlaceholders,
    requiresUserReview: input.qaReport?.requiresUserReview,
  })

  renderTimingManifest.readyForRender = validation.readiness === 'ready_for_future_render_worker'
  renderTimingManifest.status = validation.readiness === 'ready_for_future_render_worker' || validation.readiness === 'ready_for_mock_worker'
    ? 'ready_for_worker'
    : 'draft'
  renderTimingManifest.metadata = {
    ...renderTimingManifest.metadata,
    validationReadiness: validation.readiness,
    validationIssues: validation.issues,
  }

  const workerInput = createRenderTimingWorkerInput({
    manifest: renderTimingManifest,
    dependencyMap,
    layerOrder,
    validation,
    readiness: validation.readiness,
    missingAssets: input.missingAssets,
    allowMockAssetPlaceholders: input.allowMockAssetPlaceholders,
    conflicts: input.conflicts,
  })
  const chatSummary = createRenderTimingChatSummary({ validation, workerInput })
  const warnings = [...validation.warnings]

  return ok({
    renderTimingManifest,
    tracks,
    manifestEvents,
    dependencyMap,
    layerOrder,
    validation,
    workerInput,
    chatSummary,
    warnings,
  }, warnings)
}

export function buildRenderTimingManifestFromTimingMap(request: BuildRenderTimingManifestRequest): ServiceResult<BuildRenderTimingManifestResponse> {
  return buildRenderTimingManifest(request)
}

export function buildRenderTimingManifestFromMockDatabase(input: {
  db: MockDatabase
  masterTimingMapId: string
  allowMockAssetPlaceholders?: boolean
}): ServiceResult<BuildRenderTimingManifestResponse> {
  const masterTimingMap = findMockRecord(input.db, 'masterTimingMaps', input.masterTimingMapId)
  if (!masterTimingMap) {
    return fail('UNKNOWN_ERROR', `Master timing map ${input.masterTimingMapId} was not found.`)
  }

  return buildRenderTimingManifest({
    masterTimingMap,
    segments: input.db.storyTimingSegments.filter((segment) => segment.masterTimingMapId === masterTimingMap.id),
    events: input.db.timingEvents.filter((event) => event.masterTimingMapId === masterTimingMap.id),
    dependencies: input.db.timingDependencies.filter((dependency) => dependency.masterTimingMapId === masterTimingMap.id),
    conflicts: input.db.timingConflicts.filter((conflict) => conflict.masterTimingMapId === masterTimingMap.id),
    conflictResolutions: input.db.timingConflictResolutions.filter((resolution) => resolution.masterTimingMapId === masterTimingMap.id),
    qaReport: input.db.storyTimingQAReports.find((report) => report.masterTimingMapId === masterTimingMap.id),
    qaChecks: input.db.storyTimingQAChecks.filter((check) => check.masterTimingMapId === masterTimingMap.id),
    allowMockAssetPlaceholders: input.allowMockAssetPlaceholders,
  })
}

export function createRenderTimingManifestSummary(output: BuildRenderTimingManifestResponse): string {
  return `${output.renderTimingManifest.status} manifest with ${output.tracks.length} track(s), ${output.manifestEvents.length} event(s), and readiness ${output.validation.readiness}.`
}
