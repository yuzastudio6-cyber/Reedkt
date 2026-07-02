import type {
  ProjectEditBriefBundleRecord,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerDrawerModel,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerPriority,
  ProjectEditBriefRecord,
  ProjectEditBriefMarkerStatus,
  ProjectEditBriefMarkerTimeMode,
  ProjectEditBriefMarkerType,
  ProjectEditBriefTimelineMarkerModel,
  ProjectEditBriefMarkerAIMode,
  ProjectEditSessionExportSettingsRecord,
} from '../types/project-edit-brief'
import {
  createDefaultMockProjectEditBriefApiClient,
  type ProjectEditBriefApiClient,
} from './project-edit-brief-api-client'
import {
  getProjectEditBriefBundleViaApi,
  getProjectEditBriefForSessionViaApi,
  getProjectEditBriefMarkerDrawerViaApi,
  getProjectEditBriefTimelineModelsViaApi,
  getProjectEditSessionExportSettingsViaApi,
} from './project-edit-brief-api-client-adapter'

export type ProjectEditBriefEmptyStateKind = 'not_found' | 'not_opened' | 'no_markers'

export interface ProjectEditBriefBoundaryModel {
  mockOnly: true
  providerCallMade: false
  modelCallMade: false
  supabaseReadMade: false
  supabaseWriteMade: false
  storageReadMade: false
  storageWriteMade: false
  signedUrlCreated: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
  messages: string[]
}

export interface ProjectEditBriefVideoShellModel {
  durationSeconds: number
  currentTimeSeconds: number
  currentTimeLabel: string
  durationLabel: string
  aspectLabel: string
  title: string
  mockPosterLabel: string
}

export interface ProjectEditBriefTimelineMarkerUIModel extends ProjectEditBriefTimelineMarkerModel {
  leftPercent: number
  widthPercent: number
  timeLabel: string
  statusLabel: string
  priorityLabel: string
  typeLabel: string
}

export interface ProjectEditBriefTimelineUIModel {
  durationSeconds: number
  durationLabel: string
  rulerTicks: Array<{ second: number; label: string; leftPercent: number }>
  markers: ProjectEditBriefTimelineMarkerUIModel[]
  selectedMarkerId?: string
  playheadSeconds: number
  playheadLabel: string
  playheadPercent: number
}

export interface ProjectEditBriefMarkerDetailModel {
  markerId: string
  markerType: ProjectEditBriefMarkerType
  status: ProjectEditBriefMarkerStatus
  qaStatus: ProjectEditBriefMarkerDrawerModel['marker']['qaStatus']
  priority: ProjectEditBriefMarkerPriority
  timeMode: ProjectEditBriefMarkerTimeMode
  startTimeSeconds: number
  endTimeSeconds?: number
  aiMode: ProjectEditBriefMarkerAIMode
  title: string
  markerTypeLabel: string
  statusLabel: string
  priorityLabel: string
  qaStatusLabel: string
  timeLabel: string
  userNote: string
  intentSummary: string
  plannerHints: string[]
  doNotCopyNotes: string[]
  attachmentChips: ProjectEditBriefAttachmentChipModel[]
  messageCount: number
  conflictCount: number
  boundary: string
}

export interface ProjectEditBriefAttachmentChipModel {
  id: string
  label: string
  kindLabel: string
  statusLabel: string
  previewLabel?: string
  noteLabel: string
  mockOnly: true
}

export interface ProjectEditBriefExportSettingsUIModel {
  record: ProjectEditSessionExportSettingsRecord
  platformLabel: string
  aspectLabel: string
  resolutionLabel: string
  frameRateLabel: string
  formatLabel: string
  codecLabel: string
  audioCodecLabel: string
  captionSafeAreaLabel: string
  safeZoneLabel: string
  deliveryPresetLabel: string
  sourceLabel: string
  summary: string
}

export interface ProjectEditBriefWorkspaceModel {
  projectId: string
  editSessionId: string
  brief?: ProjectEditBriefRecord
  bundle?: ProjectEditBriefBundleRecord
  statusMessage: string
  briefStatusLabel: string
  markerCountLabel: string
  summaryLines: string[]
  video: ProjectEditBriefVideoShellModel
  timeline: ProjectEditBriefTimelineUIModel
  selectedMarker?: ProjectEditBriefMarkerDetailModel
  exportSettings?: ProjectEditBriefExportSettingsUIModel
  emptyState?: {
    kind: ProjectEditBriefEmptyStateKind
    title: string
    body: string
  }
  boundary: ProjectEditBriefBoundaryModel
}

export const PROJECT_EDIT_BRIEF_UI_BOUNDARY: ProjectEditBriefBoundaryModel = {
  mockOnly: true,
  providerCallMade: false,
  modelCallMade: false,
  supabaseReadMade: false,
  supabaseWriteMade: false,
  storageReadMade: false,
  storageWriteMade: false,
  signedUrlCreated: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
  messages: [
    'Edit Brief is optional and Chat remains default for Edit Chat work.',
    'Edit Brief UI reads and writes mock/local marker metadata only.',
    'Opening Brief does not upload files, fetch URLs, process media, render, or spend credits.',
    'Marker Chat, attachments, Export Settings, and Marker QA are mock/local metadata only. Uploads, planner execution, render, and export runtime remain future milestones.',
  ],
}

function titleCase(value: string | undefined): string {
  if (!value) return 'Not set'
  return value
    .replace(/^@/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatProjectEditBriefTime(seconds: number | undefined): string {
  const safeSeconds = Math.max(0, Math.floor(seconds ?? 0))
  const minutes = Math.floor(safeSeconds / 60)
  const remaining = safeSeconds % 60
  return `${minutes}:${remaining.toString().padStart(2, '0')}`
}

function markerTimeLabel(marker: ProjectEditBriefTimelineMarkerModel): string {
  if (marker.timeMode === 'range' && marker.endTimeSeconds !== undefined) {
    return `${formatProjectEditBriefTime(marker.startTimeSeconds)}-${formatProjectEditBriefTime(marker.endTimeSeconds)}`
  }
  return formatProjectEditBriefTime(marker.startTimeSeconds)
}

function estimateDurationSeconds(
  timelineMarkers: ProjectEditBriefTimelineMarkerModel[],
  exportSettings?: ProjectEditSessionExportSettingsRecord,
): number {
  const markerMax = timelineMarkers.reduce((max, marker) => Math.max(max, marker.endTimeSeconds ?? marker.startTimeSeconds), 0)
  const metadataDuration = typeof exportSettings?.metadata?.durationSeconds === 'number'
    ? exportSettings.metadata.durationSeconds
    : undefined
  return Math.max(60, markerMax + 15, metadataDuration ?? 0)
}

function percent(value: number, durationSeconds: number): number {
  if (!durationSeconds) return 0
  return Math.max(0, Math.min(100, (value / durationSeconds) * 100))
}

function createRulerTicks(durationSeconds: number): ProjectEditBriefTimelineUIModel['rulerTicks'] {
  const tickCount = 6
  return Array.from({ length: tickCount }, (_, index) => {
    const second = Math.round((durationSeconds / (tickCount - 1)) * index)
    return {
      second,
      label: formatProjectEditBriefTime(second),
      leftPercent: percent(second, durationSeconds),
    }
  })
}

function createMarkerUIModel(
  marker: ProjectEditBriefTimelineMarkerModel,
  durationSeconds: number,
): ProjectEditBriefTimelineMarkerUIModel {
  const start = percent(marker.startTimeSeconds, durationSeconds)
  const end = percent(marker.endTimeSeconds ?? marker.startTimeSeconds + 2, durationSeconds)
  return {
    ...marker,
    leftPercent: start,
    widthPercent: marker.timeMode === 'range' ? Math.max(3, end - start) : 3,
    timeLabel: markerTimeLabel(marker),
    statusLabel: titleCase(marker.status),
    priorityLabel: titleCase(marker.priority),
    typeLabel: titleCase(marker.markerType),
  }
}

export function createProjectEditBriefTimelineUIModel(input: {
  timelineMarkers: ProjectEditBriefTimelineMarkerModel[]
  exportSettings?: ProjectEditSessionExportSettingsRecord
  selectedMarkerId?: string
  playheadSeconds?: number
  autoSelectFirstMarker?: boolean
  durationSeconds?: number
}): ProjectEditBriefTimelineUIModel {
  const visibleTimelineMarkers = input.timelineMarkers.filter((marker) => marker.status !== 'archived')
  const estimatedDurationSeconds = estimateDurationSeconds(visibleTimelineMarkers, input.exportSettings)
  const durationSeconds = Math.max(1, input.durationSeconds ?? estimatedDurationSeconds)
  const markers = visibleTimelineMarkers.map((marker) => createMarkerUIModel(marker, durationSeconds))
  const selected = input.selectedMarkerId
    ? markers.find((marker) => marker.markerId === input.selectedMarkerId)
    : input.autoSelectFirstMarker === false ? undefined : markers[0]
  const safePlayheadSeconds = Math.max(0, Math.min(durationSeconds, Math.round(input.playheadSeconds ?? selected?.startTimeSeconds ?? 0)))
  return {
    durationSeconds,
    durationLabel: formatProjectEditBriefTime(durationSeconds),
    rulerTicks: createRulerTicks(durationSeconds),
    markers,
    selectedMarkerId: selected?.markerId,
    playheadSeconds: safePlayheadSeconds,
    playheadLabel: formatProjectEditBriefTime(safePlayheadSeconds),
    playheadPercent: percent(safePlayheadSeconds, durationSeconds),
  }
}

function createTimelineModel(
  timelineMarkers: ProjectEditBriefTimelineMarkerModel[],
  exportSettings?: ProjectEditSessionExportSettingsRecord,
  selectedMarkerId?: string,
  playheadSeconds?: number,
  autoSelectFirstMarker = true,
): ProjectEditBriefTimelineUIModel {
  return createProjectEditBriefTimelineUIModel({
    timelineMarkers,
    exportSettings,
    selectedMarkerId,
    playheadSeconds,
    autoSelectFirstMarker,
  })
}

function createAttachmentChip(attachment: ProjectEditBriefMarkerAttachmentRecord): ProjectEditBriefAttachmentChipModel {
  return {
    id: attachment.id,
    label: attachment.label,
    kindLabel: titleCase(attachment.attachmentKind),
    statusLabel: titleCase(attachment.status),
    previewLabel: attachment.previewLabel,
    noteLabel: attachment.notes[0] ?? 'Metadata-only attachment. No file bytes are read.',
    mockOnly: true,
  }
}

function createIntentSummary(intent?: ProjectEditBriefMarkerIntentRecord): string {
  if (!intent) return 'No structured intent available yet.'
  return `${titleCase(intent.action)}: ${intent.instruction}`
}

function createMarkerDetail(drawer: ProjectEditBriefMarkerDrawerModel): ProjectEditBriefMarkerDetailModel {
  const marker = drawer.marker
  return {
    markerId: marker.id,
    markerType: marker.markerType,
    status: marker.status,
    qaStatus: marker.qaStatus,
    priority: marker.priority,
    timeMode: marker.timeMode,
    startTimeSeconds: marker.startTimeSeconds,
    endTimeSeconds: marker.endTimeSeconds,
    aiMode: marker.aiMode,
    title: marker.title,
    markerTypeLabel: titleCase(marker.markerType),
    statusLabel: drawer.statusLabel,
    priorityLabel: titleCase(marker.priority),
    qaStatusLabel: titleCase(marker.qaStatus),
    timeLabel: marker.timeMode === 'range' && marker.endTimeSeconds !== undefined
      ? `${formatProjectEditBriefTime(marker.startTimeSeconds)}-${formatProjectEditBriefTime(marker.endTimeSeconds)}`
      : formatProjectEditBriefTime(marker.startTimeSeconds),
    userNote: marker.userNote,
    intentSummary: createIntentSummary(drawer.intent),
    plannerHints: drawer.intent?.plannerHints ?? [],
    doNotCopyNotes: drawer.intent?.doNotCopyNotes ?? [],
    attachmentChips: drawer.attachments.map(createAttachmentChip),
    messageCount: drawer.messages.length,
    conflictCount: drawer.conflicts.length,
    boundary: 'Marker drawer editing, Marker Chat, attachments, and Marker QA are mock/local only. Attachment upload and planner execution remain future milestones.',
  }
}

function createExportSettingsModel(
  exportSettings?: ProjectEditSessionExportSettingsRecord,
): ProjectEditBriefExportSettingsUIModel | undefined {
  if (!exportSettings) return undefined
  return {
    record: exportSettings,
    platformLabel: titleCase(exportSettings.platformTarget),
    aspectLabel: exportSettings.aspectRatio,
    resolutionLabel: `${exportSettings.resolution.width}x${exportSettings.resolution.height}`,
    frameRateLabel: `${exportSettings.frameRate} fps`,
    formatLabel: exportSettings.format.toUpperCase(),
    codecLabel: titleCase(exportSettings.codec),
    audioCodecLabel: titleCase(exportSettings.audioCodec),
    captionSafeAreaLabel: exportSettings.captionSafeArea ? 'Caption safe area on' : 'Caption safe area off',
    safeZoneLabel: exportSettings.safeZonePreset ? titleCase(exportSettings.safeZonePreset) : 'Mock safe zone',
    deliveryPresetLabel: titleCase(exportSettings.deliveryPreset),
    sourceLabel: titleCase(exportSettings.source),
    summary: exportSettings.summary,
  }
}

function emptyStateFor(brief?: ProjectEditBriefRecord): ProjectEditBriefWorkspaceModel['emptyState'] | undefined {
  if (!brief) {
    return {
      kind: 'not_found',
      title: 'Edit Brief unavailable',
      body: 'No mock Edit Brief record was found for this Edit Chat. Chat remains available and no Brief state was created.',
    }
  }
  if (brief.status === 'not_created' || brief.availability === 'optional_not_opened') {
    return {
      kind: 'not_opened',
      title: 'Edit Brief has not been opened',
      body: 'Edit Brief is optional. This route does not create markers or change the Edit Chat until an active mock Brief exists.',
    }
  }
  if (brief.markerCount === 0) {
    return {
      kind: 'no_markers',
      title: 'No markers yet',
      body: 'Use Add Marker to create mock/local timeline guidance. No planner execution, media processing, render, or credits start from this action.',
    }
  }
  return undefined
}

function defaultClient(projectId: string, client?: ProjectEditBriefApiClient): ProjectEditBriefApiClient {
  return client ?? createDefaultMockProjectEditBriefApiClient({
    projectId,
    preserveMockSession: true,
  })
}

export async function loadProjectEditBriefWorkspaceForUI(input: {
  projectId: string
  editSessionId: string
  selectedMarkerId?: string
  playheadSeconds?: number
  autoSelectFirstMarker?: boolean
  client?: ProjectEditBriefApiClient
}): Promise<ProjectEditBriefWorkspaceModel> {
  const client = defaultClient(input.projectId, input.client)
  const briefResult = await getProjectEditBriefForSessionViaApi(input.editSessionId, client)
  const brief = briefResult.brief
  const exportResult = await getProjectEditSessionExportSettingsViaApi(input.editSessionId, client)
  const emptyState = emptyStateFor(brief)

  if (!brief || brief.status === 'not_created' || brief.availability === 'optional_not_opened') {
    const timeline = createTimelineModel([], exportResult.exportSettings, undefined, input.playheadSeconds)
    return {
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      brief,
      statusMessage: emptyState?.body ?? 'Mock Edit Brief shell loaded safely.',
      briefStatusLabel: brief ? titleCase(brief.status) : 'Unavailable',
      markerCountLabel: '0 markers',
      summaryLines: [
        brief?.summary ?? 'Edit Brief is optional for this Edit Chat.',
        'Opening this route does not create Brief state, markers, workers, renders, or credits.',
      ],
      video: {
        durationSeconds: timeline.durationSeconds,
        currentTimeSeconds: timeline.playheadSeconds,
        currentTimeLabel: timeline.playheadLabel,
        durationLabel: timeline.durationLabel,
        aspectLabel: exportResult.exportSettings?.aspectRatio ?? 'Mock frame',
        title: brief?.title ?? 'Optional Edit Brief',
        mockPosterLabel: 'Mock video shell only',
      },
      timeline,
      exportSettings: createExportSettingsModel(exportResult.exportSettings),
      emptyState,
      boundary: PROJECT_EDIT_BRIEF_UI_BOUNDARY,
    }
  }

  const bundleResult = await getProjectEditBriefBundleViaApi(brief.id, client)
  const timelineResult = await getProjectEditBriefTimelineModelsViaApi(brief.id, client)
  const timeline = createTimelineModel(
    timelineResult.timelineMarkers,
    exportResult.exportSettings ?? bundleResult.bundle?.exportSettings,
    input.selectedMarkerId,
    input.playheadSeconds,
    input.autoSelectFirstMarker ?? true,
  )
  const selectedMarkerId = timeline.selectedMarkerId
  const drawerResult = selectedMarkerId
    ? await getProjectEditBriefMarkerDrawerViaApi(selectedMarkerId, client)
    : undefined
  const selectedMarker = drawerResult?.drawer ? createMarkerDetail(drawerResult.drawer) : undefined
  const nextEmptyState = timeline.markers.length === 0 ? emptyStateFor({ ...brief, markerCount: 0 }) : undefined

  return {
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    brief,
    bundle: bundleResult.bundle,
    statusMessage: nextEmptyState?.body ?? 'Mock Edit Brief timeline loaded without production side effects.',
    briefStatusLabel: titleCase(brief.status),
    markerCountLabel: `${timeline.markers.length} marker${timeline.markers.length === 1 ? '' : 's'}`,
    summaryLines: [
      brief.summary ?? 'Mock Edit Brief timeline shell.',
      `${brief.confirmedMarkerCount} confirmed, ${brief.conflictCount} conflicts, ${brief.needsAssetCount} needing assets.`,
      'Planner execution remains future gated.',
    ],
    video: {
      durationSeconds: timeline.durationSeconds,
      currentTimeSeconds: selectedMarker?.markerId
        ? timeline.markers.find((marker) => marker.markerId === selectedMarker.markerId)?.startTimeSeconds ?? timeline.playheadSeconds
        : timeline.playheadSeconds,
      currentTimeLabel: selectedMarker
        ? selectedMarker.timeLabel.split('-')[0]
        : timeline.playheadLabel,
      durationLabel: timeline.durationLabel,
      aspectLabel: exportResult.exportSettings?.aspectRatio ?? bundleResult.bundle?.exportSettings?.aspectRatio ?? 'Mock frame',
      title: brief.title,
      mockPosterLabel: 'Mock video shell only',
    },
    timeline,
    selectedMarker,
    exportSettings: createExportSettingsModel(exportResult.exportSettings ?? bundleResult.bundle?.exportSettings),
    emptyState: nextEmptyState,
    boundary: PROJECT_EDIT_BRIEF_UI_BOUNDARY,
  }
}
