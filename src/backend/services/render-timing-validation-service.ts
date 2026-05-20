import type {
  RenderTimingAssetRequirement,
  RenderTimingManifestRecord,
  RenderTimingValidationIssue,
  RenderTimingValidationResult,
  StoryTimingQACheckRecord,
  StoryTimingQAReportRecord,
  StoryTimingTrackType,
  TimingConflictRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'
import { detectLayerOrderConflicts } from './render-timing-layer-order-service'
import {
  checkBlockingConflictsResolved,
  checkRequiredAssetsAvailableMock,
  checkRequiredEventsPresent,
  checkRequiredTracksPresent,
  determineRenderTimingWorkerReadiness,
} from './render-timing-worker-readiness-service'

export function validateManifestEventTimeRanges(events: TimingEventRecord[] = []): string[] {
  return events
    .filter((event) =>
      event.startTimeSeconds < 0 ||
      event.endTimeSeconds < event.startTimeSeconds ||
      (event.hitTimeSeconds !== undefined &&
        (event.hitTimeSeconds < event.startTimeSeconds || event.hitTimeSeconds > event.endTimeSeconds)),
    )
    .map((event) => event.id)
}

export function validateManifestTrackIntegrity(input: {
  renderTimingManifest?: RenderTimingManifestRecord
  events?: TimingEventRecord[]
  requiredTrackTypes?: StoryTimingTrackType[]
}): StoryTimingTrackType[] {
  return checkRequiredTracksPresent(input)
}

export function validateManifestLayerOrder(renderTimingManifest?: RenderTimingManifestRecord): string[] {
  return renderTimingManifest ? detectLayerOrderConflicts(renderTimingManifest.tracks) : []
}

export function validateManifestDependencies(input: {
  renderTimingManifest?: RenderTimingManifestRecord
  dependencies?: TimingDependencyRecord[]
}): string[] {
  if (!input.renderTimingManifest) return []
  const dependencyIds = new Set(input.renderTimingManifest.dependencies)
  return (input.dependencies ?? [])
    .filter((dependency) => dependency.required && !dependencyIds.has(dependency.id))
    .map((dependency) => dependency.id)
}

export function validateManifestReadiness(input: {
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
}) {
  return determineRenderTimingWorkerReadiness(input)
}

export function createRenderTimingValidationWarnings(result: RenderTimingValidationResult): string[] {
  return [
    ...result.warnings,
    ...result.issues.map((issue) => `Render timing validation issue: ${issue.replaceAll('_', ' ')}.`),
  ]
}

export function validateRenderTimingManifest(input: {
  renderTimingManifest?: RenderTimingManifestRecord
  events?: TimingEventRecord[]
  dependencies?: TimingDependencyRecord[]
  conflicts?: TimingConflictRecord[]
  qaReport?: StoryTimingQAReportRecord
  qaChecks?: StoryTimingQACheckRecord[]
  requiredTrackTypes?: StoryTimingTrackType[]
  requiredAssets?: RenderTimingAssetRequirement[]
  missingAssets?: RenderTimingAssetRequirement[]
  allowMockAssetPlaceholders?: boolean
  requiresUserReview?: boolean
}): RenderTimingValidationResult {
  const issues = new Set<RenderTimingValidationIssue>()
  const warnings: string[] = []
  const recommendedFixes: string[] = []

  if (!input.renderTimingManifest) {
    issues.add('missing_render_manifest')
    recommendedFixes.push('Build the render timing manifest from the approved master timing map.')
  }

  const missingTracks = validateManifestTrackIntegrity(input)
  if (missingTracks.length > 0) {
    issues.add('missing_required_track')
    recommendedFixes.push(`Add required render tracks: ${missingTracks.join(', ')}.`)
  }

  const missingEvents = checkRequiredEventsPresent(input)
  if (missingEvents.length > 0) {
    issues.add('missing_required_event')
    recommendedFixes.push('Rebuild manifest events from StoryTiming timing events.')
  }

  const invalidEventIds = validateManifestEventTimeRanges(input.events)
  if (invalidEventIds.length > 0) {
    issues.add('invalid_event_time_range')
    recommendedFixes.push(`Fix invalid event time ranges: ${invalidEventIds.slice(0, 4).join(', ')}.`)
  }

  const blockingConflictIds = checkBlockingConflictsResolved(input.conflicts)
  if (blockingConflictIds.length > 0) {
    issues.add('unresolved_blocking_conflict')
    recommendedFixes.push('Resolve or waive blocking timing conflicts before render readiness.')
  }

  if (input.qaReport?.blocksRender || (input.qaChecks ?? []).some((check) => check.blocksRender && check.status !== 'waived')) {
    issues.add('timing_qa_failed')
    recommendedFixes.push('Fix render-blocking timing QA checks before worker handoff.')
  }

  const missingAssets = checkRequiredAssetsAvailableMock({
    requiredAssets: input.requiredAssets,
    missingAssets: input.missingAssets,
  })
  if (missingAssets.includes('source_media_required')) {
    issues.add('missing_source_asset')
    recommendedFixes.push('Attach source media asset references before real render worker handoff.')
  }
  if (missingAssets.some((asset) => asset !== 'source_media_required')) {
    issues.add('missing_generated_asset')
    recommendedFixes.push('Attach generated/music/SFX/overlay asset IDs before real render worker handoff.')
  }

  if ((input.renderTimingManifest?.workerNotes.length ?? 0) === 0) {
    issues.add('missing_worker_notes')
    recommendedFixes.push('Add worker notes that explain timing boundaries and mock-only constraints.')
  }

  const layerConflicts = validateManifestLayerOrder(input.renderTimingManifest)
  if (layerConflicts.length > 0) {
    issues.add('layer_order_conflict')
    recommendedFixes.push('Reorder render tracks so captions and QA markers remain readable.')
  }

  if (input.requiresUserReview || input.qaReport?.requiresUserReview) {
    issues.add('manual_review_needed')
    recommendedFixes.push('Ask the user to approve subjective timing choices before final render readiness.')
  }

  if (missingAssets.length > 0 && input.allowMockAssetPlaceholders) {
    warnings.push('Mock worker can continue with placeholder assets, but future real render is not asset-ready.')
  }

  const readiness = validateManifestReadiness(input)
  const ok = (
    readiness === 'ready_for_mock_worker' ||
    readiness === 'ready_for_future_render_worker'
  ) && ![...issues].some((issue) =>
    issue === 'missing_render_manifest' ||
    issue === 'missing_required_track' ||
    issue === 'missing_required_event' ||
    issue === 'invalid_event_time_range' ||
    issue === 'unresolved_blocking_conflict' ||
    issue === 'timing_qa_failed' ||
    issue === 'missing_source_asset' ||
    issue === 'missing_worker_notes' ||
    issue === 'layer_order_conflict' ||
    issue === 'manual_review_needed',
  )

  return {
    ok,
    readiness,
    issues: [...issues],
    warnings,
    recommendedFixes,
  }
}

export function createRenderTimingValidationSummary(result: RenderTimingValidationResult): string {
  if (result.ok) return `Render timing validation passed with readiness ${result.readiness}.`
  return `Render timing validation found ${result.issues.length} issue(s); readiness is ${result.readiness}.`
}
