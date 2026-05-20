import {
  mockFaithStoryTimingBundle,
  mockLakeComoStoryTimingBundle,
} from '../../lib/mock-storytiming-records'
import type {
  MasterTimingMapRecord,
  RenderTimingAssetRequirement,
  RenderTimingValidationIssue,
  RenderTimingWorkerReadiness,
  StoryTimingQACheckRecord,
  StoryTimingQAReportRecord,
  StoryTimingSegmentRecord,
  StoryTimingTrackType,
  TimingConflictRecord,
  TimingConflictResolutionRecord,
  TimingDependencyRecord,
  TimingEventRecord,
} from '../../types/storytiming'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export interface MockRenderTimingManifestScenario {
  id: string
  label: string
  timingMapSummary: string
  masterTimingMap: MasterTimingMapRecord
  segments: StoryTimingSegmentRecord[]
  events: TimingEventRecord[]
  dependencies: TimingDependencyRecord[]
  conflicts: TimingConflictRecord[]
  conflictResolutions: TimingConflictResolutionRecord[]
  qaReport?: StoryTimingQAReportRecord
  qaChecks: StoryTimingQACheckRecord[]
  requiredTrackTypes?: StoryTimingTrackType[]
  omitTrackTypes?: StoryTimingTrackType[]
  layerOrderOverrides?: Partial<Record<StoryTimingTrackType, number>>
  requiredAssets: RenderTimingAssetRequirement[]
  missingAssets: RenderTimingAssetRequirement[]
  allowMockAssetPlaceholders: boolean
  workerNotes?: string[]
  trackSummary: string
  eventSummary: string
  qaState: string
  assetState: string
  expectedValidationResult: {
    ok: boolean
    issues: RenderTimingValidationIssue[]
  }
  expectedReadiness: RenderTimingWorkerReadiness
  expectedChatSummary: string
}

type ScenarioPreset =
  | 'ready'
  | 'blocked_conflict'
  | 'warning'
  | 'missing_source'
  | 'missing_overlay'
  | 'missing_sfx'
  | 'missing_captions_track'
  | 'no_music_needed'
  | 'no_sfx_needed'
  | 'invalid_range'
  | 'layer_conflict'
  | 'lake_como'
  | 'faith'
  | 'signature'
  | 'face_marker'
  | 'qa_markers'
  | 'worker_notes_incomplete'
  | 'user_review'

interface ScenarioConfig {
  id: string
  label: string
  preset: ScenarioPreset
  expectedReadiness: RenderTimingWorkerReadiness
  expectedIssues?: RenderTimingValidationIssue[]
  expectedOk?: boolean
}

function baseBundle(config: ScenarioConfig) {
  const source = config.preset === 'faith' || config.preset === 'user_review'
    ? mockFaithStoryTimingBundle
    : mockLakeComoStoryTimingBundle
  const masterTimingMap = clone(source.masterTimingMap)
  masterTimingMap.id = `render-manifest-map-${config.id}`
  masterTimingMap.projectId = `render-manifest-project-${config.id}`
  masterTimingMap.editPlanId = `render-manifest-edit-plan-${config.id}`
  masterTimingMap.summary = config.label

  const updateIds = <T extends { masterTimingMapId: string; projectId: string; editPlanId: string }>(records: T[]) =>
    clone(records).map((record) => ({
      ...record,
      masterTimingMapId: masterTimingMap.id,
      projectId: masterTimingMap.projectId,
      editPlanId: masterTimingMap.editPlanId,
    }))

  return {
    masterTimingMap,
    segments: updateIds(source.segments),
    events: updateIds(source.events),
    dependencies: updateIds(source.dependencies),
    conflicts: updateIds(source.conflicts),
    conflictResolutions: updateIds(source.conflictResolutions),
    qaChecks: updateIds(source.qaChecks),
    qaReport: source.qaReports[0]
      ? {
          ...clone(source.qaReports[0]),
          masterTimingMapId: masterTimingMap.id,
          projectId: masterTimingMap.projectId,
          editPlanId: masterTimingMap.editPlanId,
        }
      : undefined,
  }
}

function blockingConflict(base: ReturnType<typeof baseBundle>, id: string): TimingConflictRecord {
  const conflict = clone(base.conflicts[0] ?? mockFaithStoryTimingBundle.conflicts[0])
  return {
    ...conflict,
    id: `render-manifest-conflict-${id}`,
    masterTimingMapId: base.masterTimingMap.id,
    projectId: base.masterTimingMap.projectId,
    editPlanId: base.masterTimingMap.editPlanId,
    conflictType: 'real_motion_blocks_face',
    severity: 'critical',
    blocksRender: true,
    requiresUserReview: id.includes('user_review'),
    status: 'open',
    description: 'Real Motion blocks the speaker face in this render manifest scenario.',
  }
}

function markerEvent(base: ReturnType<typeof baseBundle>, id: string, trackType: StoryTimingTrackType): TimingEventRecord {
  return {
    ...clone(base.events[0]),
    id: `render-manifest-event-${id}`,
    masterTimingMapId: base.masterTimingMap.id,
    projectId: base.masterTimingMap.projectId,
    editPlanId: base.masterTimingMap.editPlanId,
    sourceSystem: trackType === 'qa_markers' ? 'qa_report' : 'manual',
    eventType: trackType === 'qa_markers' ? 'qa_marker' : 'manual_marker',
    trackType,
    label: id.replaceAll('_', ' '),
    startTimeSeconds: 18,
    hitTimeSeconds: 18.2,
    endTimeSeconds: 18.4,
    durationSeconds: 0.4,
    priority: 'medium',
    syncMode: 'frame_locked',
    canShift: false,
    locked: true,
    notes: ['Mock marker event for render manifest scenario.'],
  }
}

function createScenario(config: ScenarioConfig): MockRenderTimingManifestScenario {
  const base = baseBundle(config)
  let events = base.events
  let conflicts = base.conflicts
  let qaReport = base.qaReport
  let qaChecks = base.qaChecks
  let requiredTrackTypes: StoryTimingTrackType[] | undefined
  let omitTrackTypes: StoryTimingTrackType[] | undefined
  let layerOrderOverrides: Partial<Record<StoryTimingTrackType, number>> | undefined
  let requiredAssets: RenderTimingAssetRequirement[] = ['source_media_required']
  let missingAssets: RenderTimingAssetRequirement[] = []
  let allowMockAssetPlaceholders = false
  let workerNotes: string[] | undefined

  if (config.preset === 'blocked_conflict') {
    conflicts = [blockingConflict(base, config.id)]
  }

  if (config.preset === 'missing_source') {
    missingAssets = ['source_media_required']
  }

  if (config.preset === 'missing_overlay') {
    requiredAssets = ['source_media_required', 'generated_asset_required']
    missingAssets = ['generated_asset_required']
    allowMockAssetPlaceholders = true
  }

  if (config.preset === 'missing_sfx') {
    requiredAssets = ['source_media_required', 'sfx_asset_required']
    missingAssets = ['sfx_asset_required']
    allowMockAssetPlaceholders = true
  }

  if (config.preset === 'missing_captions_track') {
    requiredTrackTypes = ['captions']
    omitTrackTypes = ['captions']
  }

  if (config.preset === 'no_music_needed') {
    events = events.filter((event) => event.trackType !== 'music')
  }

  if (config.preset === 'no_sfx_needed') {
    events = events.filter((event) => event.trackType !== 'sfx')
  }

  if (config.preset === 'invalid_range') {
    events = [{ ...events[0], endTimeSeconds: events[0].startTimeSeconds - 0.5 }, ...events.slice(1)]
  }

  if (config.preset === 'layer_conflict') {
    layerOrderOverrides = { captions: 3, real_motion: 8 }
  }

  if (config.preset === 'signature') {
    requiredAssets = ['source_media_required', 'generated_asset_required', 'overlay_asset_required', 'sfx_asset_required']
  }

  if (config.preset === 'face_marker') {
    events = [...events, markerEvent(base, 'real_motion_face_safety_marker', 'qa_markers')]
  }

  if (config.preset === 'qa_markers') {
    events = [...events, markerEvent(base, 'qa_marker_included', 'qa_markers')]
  }

  if (config.preset === 'worker_notes_incomplete') {
    workerNotes = []
  }

  if (config.preset === 'user_review') {
    conflicts = [{
      ...blockingConflict(base, `${config.id}_user_review`),
      blocksRender: false,
      requiresUserReview: true,
    }]
    qaReport = qaReport ? { ...qaReport, requiresUserReview: true, blocksRender: false } : qaReport
    qaChecks = qaChecks.map((check, index) => index === 0 ? { ...check, blocksRender: false, requiresManualReview: true, status: 'requires_manual_review' } : check)
  }

  const expectedOk = config.expectedOk ?? (
    config.expectedReadiness === 'ready_for_mock_worker' ||
    config.expectedReadiness === 'ready_for_future_render_worker'
  )

  return {
    id: config.id,
    label: config.label,
    timingMapSummary: base.masterTimingMap.summary,
    masterTimingMap: base.masterTimingMap,
    segments: base.segments,
    events,
    dependencies: base.dependencies,
    conflicts,
    conflictResolutions: base.conflictResolutions,
    qaReport,
    qaChecks,
    requiredTrackTypes,
    omitTrackTypes,
    layerOrderOverrides,
    requiredAssets,
    missingAssets,
    allowMockAssetPlaceholders,
    workerNotes,
    trackSummary: 'Tracks should be derived from StoryTiming event groups and required render lanes.',
    eventSummary: `${events.length} StoryTiming event(s) are available for manifest conversion.`,
    qaState: qaReport?.summary ?? 'No full QA report supplied.',
    assetState: missingAssets.length ? `Missing: ${missingAssets.join(', ')}` : 'Mock assets available or not required.',
    expectedValidationResult: {
      ok: expectedOk,
      issues: config.expectedIssues ?? [],
    },
    expectedReadiness: config.expectedReadiness,
    expectedChatSummary: `${config.label}: expected ${config.expectedReadiness}.`,
  }
}

export const mockRenderTimingManifestScenarios: MockRenderTimingManifestScenario[] = [
  createScenario({ id: 'render_manifest_ready_for_mock_preview', label: 'Render manifest ready for mock preview', preset: 'ready', expectedReadiness: 'ready_for_future_render_worker' }),
  createScenario({ id: 'render_manifest_blocked_by_unresolved_timing_conflicts', label: 'Render manifest blocked by unresolved timing conflicts', preset: 'blocked_conflict', expectedReadiness: 'blocked_by_timing_conflicts', expectedOk: false, expectedIssues: ['unresolved_blocking_conflict'] }),
  createScenario({ id: 'render_manifest_ready_with_minor_warnings', label: 'Render manifest ready with minor warnings', preset: 'warning', expectedReadiness: 'ready_for_future_render_worker' }),
  createScenario({ id: 'missing_source_media_asset', label: 'Missing source media asset', preset: 'missing_source', expectedReadiness: 'blocked_by_missing_assets', expectedOk: false, expectedIssues: ['missing_source_asset'] }),
  createScenario({ id: 'missing_generated_overlay_asset', label: 'Missing generated overlay asset', preset: 'missing_overlay', expectedReadiness: 'ready_for_mock_worker', expectedIssues: ['missing_generated_asset'] }),
  createScenario({ id: 'missing_sfx_generated_asset', label: 'Missing SFX generated asset', preset: 'missing_sfx', expectedReadiness: 'ready_for_mock_worker', expectedIssues: ['missing_generated_asset'] }),
  createScenario({ id: 'captions_track_missing', label: 'Captions track missing', preset: 'missing_captions_track', expectedReadiness: 'blocked_by_missing_tracks', expectedOk: false, expectedIssues: ['missing_required_track'] }),
  createScenario({ id: 'music_track_missing_but_no_music_needed', label: 'Music track missing but no music needed', preset: 'no_music_needed', expectedReadiness: 'ready_for_future_render_worker' }),
  createScenario({ id: 'sfx_track_missing_but_no_sfx_needed', label: 'SFX track missing but no SFX needed', preset: 'no_sfx_needed', expectedReadiness: 'ready_for_future_render_worker' }),
  createScenario({ id: 'invalid_timing_event_range', label: 'Invalid timing event range', preset: 'invalid_range', expectedReadiness: 'ready_for_mock_worker', expectedOk: false, expectedIssues: ['invalid_event_time_range'] }),
  createScenario({ id: 'layer_order_conflict', label: 'Layer order conflict', preset: 'layer_conflict', expectedReadiness: 'ready_for_mock_worker', expectedOk: false, expectedIssues: ['layer_order_conflict'] }),
  createScenario({ id: 'lake_como_lifestyle_manifest', label: 'Lake Como/lifestyle manifest', preset: 'lake_como', expectedReadiness: 'ready_for_future_render_worker' }),
  createScenario({ id: 'faith_serious_manifest', label: 'Faith/serious manifest', preset: 'faith', expectedReadiness: 'blocked_by_timing_conflicts', expectedOk: false, expectedIssues: ['unresolved_blocking_conflict'] }),
  createScenario({ id: 'signature_heavy_manifest', label: 'Signature-heavy manifest', preset: 'signature', expectedReadiness: 'ready_for_future_render_worker' }),
  createScenario({ id: 'real_motion_face_safety_marker_included', label: 'Real Motion face safety marker included', preset: 'face_marker', expectedReadiness: 'ready_for_future_render_worker' }),
  createScenario({ id: 'qa_markers_included', label: 'QA markers included', preset: 'qa_markers', expectedReadiness: 'ready_for_future_render_worker' }),
  createScenario({ id: 'worker_notes_incomplete', label: 'Worker notes incomplete', preset: 'worker_notes_incomplete', expectedReadiness: 'ready_for_mock_worker', expectedOk: false, expectedIssues: ['missing_worker_notes'] }),
  createScenario({ id: 'user_review_required_before_render', label: 'User review required before render', preset: 'user_review', expectedReadiness: 'requires_user_review', expectedOk: false, expectedIssues: ['manual_review_needed'] }),
]

export function getMockRenderTimingManifestScenarioById(id: string): MockRenderTimingManifestScenario | undefined {
  return mockRenderTimingManifestScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultMockRenderTimingManifestScenario(): MockRenderTimingManifestScenario {
  return mockRenderTimingManifestScenarios[0]
}
