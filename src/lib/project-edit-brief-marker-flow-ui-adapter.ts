import type { ReeditProApiResponseEnvelope } from '../types/api-routes'
import type {
  ProjectEditBriefMarkerAIMode,
  ProjectEditBriefMarkerPriority,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefMarkerStatus,
  ProjectEditBriefMarkerTimeMode,
  ProjectEditBriefMarkerType,
} from '../types/project-edit-brief'
import type { ProjectEditBriefApiClient } from './project-edit-brief-api-client'
import {
  confirmProjectEditBriefMarkerViaApi as confirmProjectEditBriefMarkerWithClientViaApi,
  createProjectEditBriefMarkerViaApi as createProjectEditBriefMarkerWithClientViaApi,
  updateProjectEditBriefMarkerViaApi as updateProjectEditBriefMarkerWithClientViaApi,
} from './project-edit-brief-api-client-adapter'
import { formatProjectEditBriefTime } from './project-edit-brief-ui-adapter'

export type ProjectEditBriefMarkerDrawerMode = 'create' | 'edit'

export interface ProjectEditBriefMarkerOption<TValue extends string> {
  value: TValue
  label: string
  description: string
}

export interface ProjectEditBriefMarkerDraftForUI {
  markerId?: string
  projectId: string
  editSessionId: string
  briefId: string
  markerType: ProjectEditBriefMarkerType
  title: string
  userNote: string
  priority: ProjectEditBriefMarkerPriority
  timeMode: ProjectEditBriefMarkerTimeMode
  startTimeSeconds: number
  endTimeSeconds?: number
  aiMode: ProjectEditBriefMarkerAIMode
  status: ProjectEditBriefMarkerStatus
  durationSeconds?: number
}

export interface ProjectEditBriefMarkerFormModel {
  mode: ProjectEditBriefMarkerDrawerMode
  draft: ProjectEditBriefMarkerDraftForUI
  markerTypeOptions: Array<ProjectEditBriefMarkerOption<ProjectEditBriefMarkerType>>
  priorityOptions: Array<ProjectEditBriefMarkerOption<ProjectEditBriefMarkerPriority>>
  timeModeOptions: Array<ProjectEditBriefMarkerOption<ProjectEditBriefMarkerTimeMode>>
  aiModeOptions: Array<ProjectEditBriefMarkerOption<ProjectEditBriefMarkerAIMode>>
  statusLabel: string
  timeLabel: string
  validationErrors: string[]
  canSave: boolean
  mockOnly: true
  boundary: string
}

export interface ProjectEditBriefMarkerSavePayload {
  projectId: string
  editSessionId: string
  briefId: string
  markerType: ProjectEditBriefMarkerType
  status: ProjectEditBriefMarkerStatus
  priority: ProjectEditBriefMarkerPriority
  timeMode: ProjectEditBriefMarkerTimeMode
  startTimeSeconds: number
  endTimeSeconds?: number
  title: string
  userNote: string
  aiMode: ProjectEditBriefMarkerAIMode
  qaStatus: 'not_checked'
  metadata: {
    source: 'project_edit_brief_marker_drawer'
    aiModeMetadataOnly: true
    markerChatImplemented: false
    attachmentUploadImplemented: false
    plannerExecutionStarted: false
  }
}

export interface ProjectEditBriefMarkerUpdatePayload {
  markerId: string
  patch: Partial<ProjectEditBriefMarkerRecord>
}

export interface ProjectEditBriefMarkerConfirmPayload {
  markerId: string
  summary: string
}

export interface ProjectEditBriefMarkerArchivePayload {
  markerId: string
}

export interface ProjectEditBriefMarkerFlowBoundarySummary {
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
  message: string
}

export const PROJECT_EDIT_BRIEF_MARKER_TYPE_OPTIONS: Array<ProjectEditBriefMarkerOption<ProjectEditBriefMarkerType>> = [
  { value: 'general_note', label: 'General note', description: 'Timeline instruction without a specialized media lane.' },
  { value: 'broll', label: 'B-roll', description: 'Request or describe supporting footage.' },
  { value: 'cut_remove', label: 'Cut/remove', description: 'Mark a section to remove or tighten.' },
  { value: 'keep_emphasize', label: 'Keep/emphasize', description: 'Preserve or highlight an important moment.' },
  { value: 'caption_text', label: 'Caption/text', description: 'Add or adjust caption and text direction.' },
  { value: 'graphic_card_ui', label: 'Graphic/card UI', description: 'Describe a card, overlay, or UI visual.' },
  { value: 'music_soundtrack', label: 'Music/soundtrack', description: 'Guide soundtrack mood or placement.' },
  { value: 'sfx_sound_design', label: 'SFX/sound design', description: 'Guide mock sound design intent.' },
  { value: 'voiceover', label: 'Voiceover', description: 'Mark a voiceover note.' },
  { value: 'transition', label: 'Transition', description: 'Mark a transition idea.' },
  { value: 'speed_pacing', label: 'Speed/pacing', description: 'Guide pace or speed changes.' },
  { value: 'color_tone', label: 'Color/tone', description: 'Guide color, tone, or look.' },
  { value: 'do_not_use', label: 'Do not use', description: 'Flag material to avoid.' },
]

export const PROJECT_EDIT_BRIEF_MARKER_PRIORITY_OPTIONS: Array<ProjectEditBriefMarkerOption<ProjectEditBriefMarkerPriority>> = [
  { value: 'must_follow', label: 'Must follow', description: 'Highest-priority marker guidance.' },
  { value: 'should_follow', label: 'Should follow', description: 'Recommended marker guidance.' },
  { value: 'optional', label: 'Optional', description: 'Useful if it fits the edit.' },
  { value: 'avoid', label: 'Avoid', description: 'Negative guidance or safety preference.' },
]

export const PROJECT_EDIT_BRIEF_MARKER_TIME_MODE_OPTIONS: Array<ProjectEditBriefMarkerOption<ProjectEditBriefMarkerTimeMode>> = [
  { value: 'point', label: 'Point', description: 'A single timeline moment.' },
  { value: 'range', label: 'Range', description: 'A start and end section.' },
]

export const PROJECT_EDIT_BRIEF_MARKER_AI_MODE_OPTIONS: Array<ProjectEditBriefMarkerOption<ProjectEditBriefMarkerAIMode>> = [
  { value: 'off', label: 'Off', description: 'Store marker metadata only.' },
  { value: 'confirm_only', label: 'Confirm only', description: 'Future AI may ask for confirmation.' },
  { value: 'ask_clarifying_questions', label: 'Ask questions', description: 'Future AI may ask scoped marker questions.' },
  { value: 'suggest_options', label: 'Suggest options', description: 'Future AI may suggest marker options.' },
]

export const PROJECT_EDIT_BRIEF_MARKER_STATUS_OPTIONS: Array<ProjectEditBriefMarkerOption<ProjectEditBriefMarkerStatus>> = [
  { value: 'draft', label: 'Draft', description: 'Saved marker guidance that is not confirmed.' },
  { value: 'needs_clarification', label: 'Needs clarification', description: 'Future Marker Chat can clarify this marker.' },
  { value: 'needs_asset', label: 'Needs asset', description: 'Future attachments can satisfy this marker.' },
  { value: 'confirmed', label: 'Confirmed', description: 'User-confirmed marker guidance.' },
  { value: 'archived', label: 'Archived', description: 'Hidden from the active marker lane.' },
]

function titleCase(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function clampSeconds(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value))
}

function cleanedText(value: string, fallback: string): string {
  const next = value.trim()
  return next.length ? next : fallback
}

function safeMarkerStatus(value: ProjectEditBriefMarkerStatus): ProjectEditBriefMarkerStatus {
  return PROJECT_EDIT_BRIEF_MARKER_STATUS_OPTIONS.some((option) => option.value === value) ? value : 'draft'
}

export function createProjectEditBriefMarkerDraftForUI(input: {
  briefId: string
  editSessionId: string
  marker?: ProjectEditBriefMarkerRecord
  playheadSeconds?: number
  durationSeconds?: number
  projectId: string
}): ProjectEditBriefMarkerDraftForUI {
  if (input.marker) {
    return {
      markerId: input.marker.id,
      projectId: input.marker.projectId,
      editSessionId: input.marker.editSessionId,
      briefId: input.marker.briefId,
      markerType: input.marker.markerType,
      title: input.marker.title,
      userNote: input.marker.userNote,
      priority: input.marker.priority,
      timeMode: input.marker.timeMode,
      startTimeSeconds: input.marker.startTimeSeconds,
      endTimeSeconds: input.marker.endTimeSeconds,
      aiMode: input.marker.aiMode,
      status: safeMarkerStatus(input.marker.status),
      durationSeconds: input.durationSeconds,
    }
  }

  const startTimeSeconds = clampSeconds(input.playheadSeconds)
  return {
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    briefId: input.briefId,
    markerType: 'general_note',
    title: 'Untitled marker',
    userNote: '',
    priority: 'should_follow',
    timeMode: 'point',
    startTimeSeconds,
    endTimeSeconds: undefined,
    aiMode: 'confirm_only',
    status: 'draft',
    durationSeconds: input.durationSeconds,
  }
}

export function validateProjectEditBriefMarkerDraftForUI(draft: ProjectEditBriefMarkerDraftForUI): string[] {
  const errors: string[] = []
  if (!draft.title.trim()) errors.push('Marker title is required.')
  if (draft.startTimeSeconds < 0) errors.push('Start time must be zero or greater.')
  if (draft.timeMode === 'range') {
    if (draft.endTimeSeconds === undefined) errors.push('Range markers need an end time.')
    if (draft.endTimeSeconds !== undefined && draft.endTimeSeconds < draft.startTimeSeconds) {
      errors.push('End time must be greater than or equal to start time.')
    }
  }
  return errors
}

export function createProjectEditBriefMarkerFormModel(
  draft: ProjectEditBriefMarkerDraftForUI,
): ProjectEditBriefMarkerFormModel {
  const validationErrors = validateProjectEditBriefMarkerDraftForUI(draft)
  const timeLabel = draft.timeMode === 'range'
    ? `${formatProjectEditBriefTime(draft.startTimeSeconds)}-${formatProjectEditBriefTime(draft.endTimeSeconds ?? draft.startTimeSeconds)}`
    : formatProjectEditBriefTime(draft.startTimeSeconds)

  return {
    mode: draft.markerId ? 'edit' : 'create',
    draft,
    markerTypeOptions: PROJECT_EDIT_BRIEF_MARKER_TYPE_OPTIONS,
    priorityOptions: PROJECT_EDIT_BRIEF_MARKER_PRIORITY_OPTIONS,
    timeModeOptions: PROJECT_EDIT_BRIEF_MARKER_TIME_MODE_OPTIONS,
    aiModeOptions: PROJECT_EDIT_BRIEF_MARKER_AI_MODE_OPTIONS,
    statusLabel: titleCase(draft.status),
    timeLabel,
    validationErrors,
    canSave: validationErrors.length === 0,
    mockOnly: true,
    boundary: 'Marker drawer stores mock/local metadata only. AI mode is metadata-only and does not call a model.',
  }
}

export function createProjectEditBriefMarkerSavePayload(
  draft: ProjectEditBriefMarkerDraftForUI,
): ProjectEditBriefMarkerSavePayload {
  return {
    projectId: draft.projectId,
    editSessionId: draft.editSessionId,
    briefId: draft.briefId,
    markerType: draft.markerType,
    status: safeMarkerStatus(draft.status),
    priority: draft.priority,
    timeMode: draft.timeMode,
    startTimeSeconds: clampSeconds(draft.startTimeSeconds),
    endTimeSeconds: draft.timeMode === 'range' ? clampSeconds(draft.endTimeSeconds) : undefined,
    title: cleanedText(draft.title, 'Untitled marker'),
    userNote: cleanedText(draft.userNote, 'Mock/local marker note.'),
    aiMode: draft.aiMode,
    qaStatus: 'not_checked',
    metadata: {
      source: 'project_edit_brief_marker_drawer',
      aiModeMetadataOnly: true,
      markerChatImplemented: false,
      attachmentUploadImplemented: false,
      plannerExecutionStarted: false,
    },
  }
}

export function createProjectEditBriefMarkerUpdatePayload(
  draft: ProjectEditBriefMarkerDraftForUI,
): ProjectEditBriefMarkerUpdatePayload {
  if (!draft.markerId) {
    throw new Error('Cannot update marker without markerId.')
  }
  const savePayload = createProjectEditBriefMarkerSavePayload(draft)
  return {
    markerId: draft.markerId,
    patch: {
      markerType: savePayload.markerType,
      status: safeMarkerStatus(savePayload.status),
      priority: savePayload.priority,
      timeMode: savePayload.timeMode,
      startTimeSeconds: savePayload.startTimeSeconds,
      endTimeSeconds: savePayload.endTimeSeconds,
      title: savePayload.title,
      userNote: savePayload.userNote,
      aiMode: savePayload.aiMode,
      metadata: {
        ...(draft.markerId ? { editedFromMarkerDrawer: true } : {}),
        source: 'project_edit_brief_marker_drawer',
        aiModeMetadataOnly: true,
      },
    },
  }
}

export function createProjectEditBriefMarkerConfirmPayload(
  markerId: string,
  title = 'Marker',
): ProjectEditBriefMarkerConfirmPayload {
  return {
    markerId,
    summary: `${title} confirmed in mock/local marker drawer.`,
  }
}

export function createProjectEditBriefMarkerArchivePayload(
  markerId: string,
): ProjectEditBriefMarkerArchivePayload {
  return { markerId }
}

export async function saveProjectEditBriefMarkerViaApi(
  draft: ProjectEditBriefMarkerDraftForUI,
  client?: ProjectEditBriefApiClient,
) {
  const payload = createProjectEditBriefMarkerSavePayload(draft)
  return createProjectEditBriefMarkerWithClientViaApi(payload, client)
}

export async function updateProjectEditBriefMarkerViaApi(
  draft: ProjectEditBriefMarkerDraftForUI,
  client?: ProjectEditBriefApiClient,
) {
  const payload = createProjectEditBriefMarkerUpdatePayload(draft)
  return updateProjectEditBriefMarkerWithClientViaApi(payload, client)
}

export async function confirmProjectEditBriefMarkerViaApi(
  markerId: string,
  title: string,
  client?: ProjectEditBriefApiClient,
) {
  return confirmProjectEditBriefMarkerWithClientViaApi(createProjectEditBriefMarkerConfirmPayload(markerId, title), client)
}

export async function archiveProjectEditBriefMarkerViaApi(
  markerId: string,
  client: ProjectEditBriefApiClient,
): Promise<ReeditProApiResponseEnvelope<{ marker: ProjectEditBriefMarkerRecord }>> {
  return client.markers.archive<{ marker: ProjectEditBriefMarkerRecord }>(markerId)
}

export function createProjectEditBriefMarkerFlowBoundarySummary(): ProjectEditBriefMarkerFlowBoundarySummary {
  return {
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
    message: 'Marker creation and drawer editing are mock/local metadata updates only.',
  }
}
