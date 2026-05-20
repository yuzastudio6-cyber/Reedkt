import type {
  MasterTimingMapRecord,
  RenderTimingManifestRecord,
  StoryTimingQACheckRecord,
  StoryTimingTrackType,
  TimingConflictRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { createMockId, nowIso } from '../mock/mock-database'

export interface RenderTimingReadinessValidation {
  ready: boolean
  warnings: string[]
  blockingConflictIds: string[]
  missingTrackTypes: StoryTimingTrackType[]
}

export function validateRenderManifestIntegrity(renderTimingManifest?: RenderTimingManifestRecord): string[] {
  if (!renderTimingManifest) {
    return ['Render timing manifest is missing.']
  }

  return [
    renderTimingManifest.durationSeconds <= 0 ? 'Render timing manifest duration is invalid.' : '',
    renderTimingManifest.frameRate <= 0 ? 'Render timing manifest frame rate is invalid.' : '',
    renderTimingManifest.tracks.length === 0 ? 'Render timing manifest has no tracks.' : '',
    renderTimingManifest.events.length === 0 ? 'Render timing manifest has no timed events.' : '',
  ].filter(Boolean)
}

export function validateAllBlockingConflictsResolved(conflicts: TimingConflictRecord[] = []): string[] {
  return conflicts
    .filter((conflict) => conflict.blocksRender && conflict.status !== 'resolved' && conflict.status !== 'waived')
    .map((conflict) => conflict.id)
}

export function validateTimingMapLockedIfNeeded(masterTimingMap: MasterTimingMapRecord): string[] {
  if (masterTimingMap.status === 'approved' || masterTimingMap.status === 'locked_for_generation' || masterTimingMap.status === 'render_ready') {
    return []
  }

  return ['Master timing map is not approved or locked for expensive render/export work.']
}

export function validateRequiredTracksPresent(input: {
  renderTimingManifest?: RenderTimingManifestRecord
  events?: TimingEventRecord[]
}): StoryTimingTrackType[] {
  const manifest = input.renderTimingManifest
  if (!manifest) {
    return ['source_video']
  }

  const required = new Set<StoryTimingTrackType>(['source_video'])
  ;(input.events ?? []).forEach((event) => {
    if (event.trackType !== 'manual' && event.trackType !== 'qa_markers') {
      required.add(event.trackType)
    }
  })
  const present = new Set(manifest.tracks.map((track) => track.trackType))

  return [...required].filter((trackType) => !present.has(trackType))
}

export function validateRenderTimingReadiness(input: {
  masterTimingMap: MasterTimingMapRecord
  renderTimingManifest?: RenderTimingManifestRecord
  conflicts?: TimingConflictRecord[]
  events?: TimingEventRecord[]
  requireApprovedMap?: boolean
}): RenderTimingReadinessValidation {
  const manifestWarnings = validateRenderManifestIntegrity(input.renderTimingManifest)
  const blockingConflictIds = validateAllBlockingConflictsResolved(input.conflicts)
  const mapWarnings = input.requireApprovedMap ? validateTimingMapLockedIfNeeded(input.masterTimingMap) : []
  const missingTrackTypes = validateRequiredTracksPresent({
    renderTimingManifest: input.renderTimingManifest,
    events: input.events,
  })
  const warnings = [
    ...manifestWarnings,
    ...mapWarnings,
    ...(missingTrackTypes.length > 0 ? [`Render timing manifest is missing required tracks: ${missingTrackTypes.join(', ')}.`] : []),
  ]

  return {
    ready: warnings.length === 0 && blockingConflictIds.length === 0 && input.renderTimingManifest?.readyForRender === true,
    warnings,
    blockingConflictIds,
    missingTrackTypes,
  }
}

export function createRenderReadinessQACheck(input: {
  masterTimingMap: MasterTimingMapRecord
  validation: RenderTimingReadinessValidation
  renderTimingManifest?: RenderTimingManifestRecord
}): StoryTimingQACheckRecord {
  return {
    id: createMockId('render-readiness-qa'),
    masterTimingMapId: input.masterTimingMap.id,
    projectId: input.masterTimingMap.projectId,
    editPlanId: input.masterTimingMap.editPlanId,
    checkType: 'render_manifest_integrity',
    status: input.validation.ready ? 'passed' : input.validation.blockingConflictIds.length > 0 ? 'failed' : 'requires_adjustment',
    score: input.validation.ready ? 96 : input.validation.blockingConflictIds.length > 0 ? 48 : 66,
    relatedEventIds: input.renderTimingManifest?.events.map((event) => event.eventId) ?? [],
    relatedAnchorIds: [],
    summary: input.validation.ready
      ? 'Render timing manifest is ready for mock worker handoff.'
      : input.validation.warnings.join(' ') || 'Render timing manifest is not ready.',
    recommendedFix: input.validation.ready ? undefined : 'Resolve blocking conflicts and rebuild or complete the render timing manifest.',
    blocksRender: !input.validation.ready,
    requiresManualReview: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      blockingConflictIds: input.validation.blockingConflictIds,
      missingTrackTypes: input.validation.missingTrackTypes,
      mockOnly: true,
    },
  }
}

export function createRenderReadinessSummary(validation: RenderTimingReadinessValidation): string {
  if (validation.ready) {
    return 'Render readiness QA passed for the mock timing manifest.'
  }

  return `Render readiness QA found ${validation.warnings.length} warning(s) and ${validation.blockingConflictIds.length} unresolved blocking conflict(s).`
}
