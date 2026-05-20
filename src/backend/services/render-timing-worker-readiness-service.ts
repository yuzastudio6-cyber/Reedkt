import type {
  RenderTimingAssetRequirement,
  RenderTimingManifestRecord,
  RenderTimingWorkerReadiness,
  StoryTimingQACheckRecord,
  StoryTimingQAReportRecord,
  StoryTimingTrackType,
  TimingConflictRecord,
  TimingEventRecord,
} from '../../types/storytiming'

const optionalMissingTracks = new Set<StoryTimingTrackType>(['music', 'sfx', 'qa_markers', 'render_markers', 'manual'])

export function checkRequiredTracksPresent(input: {
  renderTimingManifest?: RenderTimingManifestRecord
  events?: TimingEventRecord[]
  requiredTrackTypes?: StoryTimingTrackType[]
}): StoryTimingTrackType[] {
  if (!input.renderTimingManifest) return input.requiredTrackTypes ?? ['source_video']

  const required = new Set<StoryTimingTrackType>(input.requiredTrackTypes ?? ['source_video'])
  ;(input.events ?? []).forEach((event) => {
    if (!optionalMissingTracks.has(event.trackType)) required.add(event.trackType)
  })

  const present = new Set(input.renderTimingManifest.tracks.map((track) => track.trackType))
  return [...required].filter((trackType) => !present.has(trackType))
}

export function checkRequiredEventsPresent(input: {
  renderTimingManifest?: RenderTimingManifestRecord
  events?: TimingEventRecord[]
}): string[] {
  if (!input.renderTimingManifest) return ['missing_render_manifest']
  const manifestEventIds = new Set(input.renderTimingManifest.events.map((event) => event.eventId))
  return (input.events ?? [])
    .filter((event) => !manifestEventIds.has(event.id))
    .map((event) => event.id)
}

export function checkBlockingConflictsResolved(conflicts: TimingConflictRecord[] = []): string[] {
  return conflicts
    .filter((conflict) => conflict.blocksRender && conflict.status !== 'resolved' && conflict.status !== 'waived')
    .map((conflict) => conflict.id)
}

export function checkTimingQAPassedForRender(input: {
  qaReport?: StoryTimingQAReportRecord
  qaChecks?: StoryTimingQACheckRecord[]
}): boolean {
  if (input.qaReport?.blocksRender) return false
  return !(input.qaChecks ?? []).some((check) => check.blocksRender && check.status !== 'waived')
}

export function checkRequiredAssetsAvailableMock(input: {
  requiredAssets?: RenderTimingAssetRequirement[]
  missingAssets?: RenderTimingAssetRequirement[]
}): RenderTimingAssetRequirement[] {
  const missing = new Set(input.missingAssets ?? [])
  return [...new Set(input.requiredAssets ?? [])].filter((asset) => missing.has(asset))
}

export function determineRenderTimingWorkerReadiness(input: {
  renderTimingManifest?: RenderTimingManifestRecord
  events?: TimingEventRecord[]
  conflicts?: TimingConflictRecord[]
  qaReport?: StoryTimingQAReportRecord
  qaChecks?: StoryTimingQACheckRecord[]
  requiredTrackTypes?: StoryTimingTrackType[]
  requiredAssets?: RenderTimingAssetRequirement[]
  missingAssets?: RenderTimingAssetRequirement[]
  allowMockAssetPlaceholders?: boolean
  requiresUserReview?: boolean
}): RenderTimingWorkerReadiness {
  if (!input.renderTimingManifest) return 'not_ready'
  if (checkBlockingConflictsResolved(input.conflicts).length > 0) return 'blocked_by_timing_conflicts'
  if (!checkTimingQAPassedForRender({ qaReport: input.qaReport, qaChecks: input.qaChecks })) return 'blocked_by_timing_conflicts'
  if (checkRequiredTracksPresent(input).length > 0) return 'blocked_by_missing_tracks'
  if (input.requiresUserReview || input.qaReport?.requiresUserReview) return 'requires_user_review'

  const missingAssets = checkRequiredAssetsAvailableMock({
    requiredAssets: input.requiredAssets,
    missingAssets: input.missingAssets,
  })

  if (missingAssets.length > 0) {
    return input.allowMockAssetPlaceholders ? 'ready_for_mock_worker' : 'blocked_by_missing_assets'
  }

  return input.renderTimingManifest.readyForRender ? 'ready_for_future_render_worker' : 'ready_for_mock_worker'
}

export function createWorkerReadinessSummary(readiness: RenderTimingWorkerReadiness): string {
  if (readiness === 'ready_for_future_render_worker') return 'Render timing is ready for a future real render worker handoff.'
  if (readiness === 'ready_for_mock_worker') return 'Render timing is ready for a mock preview worker handoff.'
  if (readiness === 'blocked_by_timing_conflicts') return 'Render timing is blocked by unresolved timing conflicts or failed QA.'
  if (readiness === 'blocked_by_missing_assets') return 'Render timing is blocked by missing required assets.'
  if (readiness === 'blocked_by_missing_tracks') return 'Render timing is blocked by missing required tracks.'
  if (readiness === 'requires_user_review') return 'Render timing requires user review before final render readiness.'
  return 'Render timing is not ready.'
}
