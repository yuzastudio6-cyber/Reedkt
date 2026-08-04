import type {
  ProjectEditSessionAspectRatio,
  ProjectEditSessionEventRecord,
  ProjectEditSessionMemoryRecord,
  ProjectEditSessionMessageRecord,
  ProjectEditSessionPlatformTarget,
  ProjectEditSessionRecord,
  ProjectEditSessionSnapshotRecord,
  ProjectEditSessionSourceImportance,
  ProjectEditSessionSourceRecord,
} from '../types/project-edit-session'
import type { ProjectEditSessionBundleRecord } from '../types/project-edit-session-repository'
import type { UserFacingEditLevel } from '../types/reeditpro'
import type { ReeditProApiResponseEnvelope } from '../types/api-routes'
import type { ProjectEditSessionApiClient } from './project-edit-session-api-client'
import { createDefaultMockProjectEditSessionApiClient } from './project-edit-session-api-client'
import { PROJECT_EDIT_SESSION_API_CLIENT_SAFETY } from './project-edit-session-api-client-summaries'

export type NewEditSessionPreferenceChoiceId =
  | 'none'
  | 'lifestyle_travel_vlog'
  | 'legacy_clean_edit'

export type NewEditSessionSourceNote = {
  id: string
  label: string
  notes: string
  importance: ProjectEditSessionSourceImportance
}

export type NewEditSessionFormState = {
  name: string
  aspectRatio?: ProjectEditSessionAspectRatio
  platformTarget?: ProjectEditSessionPlatformTarget
  selectedEditLevel: UserFacingEditLevel
  preferenceChoiceId: NewEditSessionPreferenceChoiceId
  preferenceNote: string
  sourceNotes: NewEditSessionSourceNote[]
}

export type NewEditSessionCreateValidationResult = {
  ok: boolean
  errors: string[]
}

export type NewEditSessionCreateResult = {
  ok: boolean
  session?: ProjectEditSessionRecord
  bundle?: ProjectEditSessionBundleRecord
  sourceRecords: ProjectEditSessionSourceRecord[]
  initialMessage?: ProjectEditSessionMessageRecord
  initialMemory?: ProjectEditSessionMemoryRecord
  initialSnapshot?: ProjectEditSessionSnapshotRecord
  initialEvent?: ProjectEditSessionEventRecord
  responseSummaries: string[]
  warnings: string[]
  safety: typeof PROJECT_EDIT_SESSION_API_CLIENT_SAFETY
  openRoute?: string
  backendLocalSessionCreated?: true
  mockOnly: true
}

export const NEW_EDIT_SESSION_DEFAULT_FORM: NewEditSessionFormState = {
  name: 'Untitled edit',
  selectedEditLevel: 'premium',
  preferenceChoiceId: 'none',
  preferenceNote: '',
  sourceNotes: [
    {
      id: 'source-note-1',
      label: '',
      notes: '',
      importance: 'primary',
    },
  ],
}

export const NEW_EDIT_SESSION_ASPECT_OPTIONS: Array<{
  id: ProjectEditSessionAspectRatio
  label: string
  description: string
  disabled?: boolean
}> = [
  { id: '9:16', label: 'Vertical 9:16', description: 'Reels, Shorts, TikTok, vertical social.' },
  { id: '16:9', label: 'Wide 16:9', description: 'YouTube, website, horizontal review.' },
  { id: '1:1', label: 'Square 1:1', description: 'Square ads and feed placements.' },
  { id: '4:5', label: 'Social 4:5', description: 'Feed-first vertical crop.' },
  { id: 'custom', label: 'Custom coming later', description: 'Future custom dimensions.', disabled: true },
]

export const NEW_EDIT_SESSION_PLATFORM_OPTIONS: Array<{
  id: ProjectEditSessionPlatformTarget
  label: string
}> = [
  { id: 'instagram_reel', label: 'Instagram Reel' },
  { id: 'tiktok_reel', label: 'TikTok Reel' },
  { id: 'youtube_shorts', label: 'YouTube Shorts' },
  { id: 'youtube_standard', label: 'YouTube Standard' },
  { id: 'instagram_feed', label: 'Instagram Feed' },
  { id: 'ad_creative', label: 'Ad Creative' },
  { id: 'internal_review', label: 'Internal Review' },
  { id: 'custom', label: 'Custom' },
]

export const NEW_EDIT_SESSION_PREFERENCE_OPTIONS: Array<{
  id: NewEditSessionPreferenceChoiceId
  label: string
  handle?: string
  description: string
}> = [
  { id: 'none', label: 'None', description: 'Start without a saved Edit Preference.' },
  {
    id: 'lifestyle_travel_vlog',
    label: 'DNA-backed mock preference',
    handle: '@lifestyle-travel-vlog',
    description: 'Apply the DNA-backed mock preference to this edit.',
  },
  {
    id: 'legacy_clean_edit',
    label: 'Legacy no-DNA mock preference',
    handle: '@legacy-clean-edit',
    description: 'Apply a legacy saved preference without Preference DNA metadata.',
  },
]

function cloneDefaultSourceNote(): NewEditSessionSourceNote {
  return {
    ...NEW_EDIT_SESSION_DEFAULT_FORM.sourceNotes[0],
    id: `source-note-${Date.now().toString(36)}`,
  }
}

export function createDefaultNewEditSessionFormState(): NewEditSessionFormState {
  return {
    ...NEW_EDIT_SESSION_DEFAULT_FORM,
    sourceNotes: [cloneDefaultSourceNote()],
  }
}

export function getNewEditSessionPreferenceHandle(
  preferenceChoiceId: NewEditSessionPreferenceChoiceId,
): string | undefined {
  return NEW_EDIT_SESSION_PREFERENCE_OPTIONS.find((option) => option.id === preferenceChoiceId)?.handle
}

export function getConfirmedNewEditFrame(form: NewEditSessionFormState): {
  aspectRatio: ProjectEditSessionAspectRatio
  platformTarget: ProjectEditSessionPlatformTarget
} | undefined {
  if (!form.aspectRatio || !form.platformTarget) return undefined
  const aspectSupported = NEW_EDIT_SESSION_ASPECT_OPTIONS.some((option) => option.id === form.aspectRatio && !option.disabled)
  const platformSupported = NEW_EDIT_SESSION_PLATFORM_OPTIONS.some((option) => option.id === form.platformTarget)
  if (!aspectSupported || !platformSupported) return undefined
  return {
    aspectRatio: form.aspectRatio,
    platformTarget: form.platformTarget,
  }
}

export function validateNewEditSessionForm(
  form: NewEditSessionFormState,
): NewEditSessionCreateValidationResult {
  const errors: string[] = []
  if (!form.name.trim()) errors.push('Edit name is required.')
  const confirmedFrame = getConfirmedNewEditFrame(form)
  if (!confirmedFrame) errors.push('Choose and confirm the output frame and platform before creating the edit.')
  if (form.selectedEditLevel !== 'premium') {
    errors.push('Internal testing requires the full-capability compatibility profile.')
  }
  return {
    ok: errors.length === 0,
    errors,
  }
}

function responseSummary(response: ReeditProApiResponseEnvelope, label: string): string {
  return response.ok
    ? `${label}: mock route ${response.routeId} completed safely.`
    : `${label}: mock route ${response.routeId} returned ${response.error?.code ?? 'unknown_error'}.`
}

function dataRecord<TRecord extends object>(response: ReeditProApiResponseEnvelope): TRecord | undefined {
  return response.data && typeof response.data === 'object' && !Array.isArray(response.data)
    ? response.data as TRecord
    : undefined
}

function normalizedSourceNotes(sourceNotes: NewEditSessionSourceNote[]): NewEditSessionSourceNote[] {
  return sourceNotes
    .map((sourceNote) => ({
      ...sourceNote,
      label: sourceNote.label.trim(),
      notes: sourceNote.notes.trim(),
    }))
    .filter((sourceNote) => sourceNote.label || sourceNote.notes)
}

export function createNewEditSessionSourceNote(): NewEditSessionSourceNote {
  return cloneDefaultSourceNote()
}

export async function createProjectEditSessionFromNewEditForm(input: {
  projectId: string
  form: NewEditSessionFormState
  client?: ProjectEditSessionApiClient
}): Promise<NewEditSessionCreateResult> {
  const validation = validateNewEditSessionForm(input.form)
  const warnings: string[] = []
  const responseSummaries: string[] = []

  if (!validation.ok) {
    return {
      ok: false,
      sourceRecords: [],
      responseSummaries,
      warnings: validation.errors,
      safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
      mockOnly: true,
    }
  }

  const client = input.client ?? createDefaultMockProjectEditSessionApiClient({
    projectId: input.projectId,
    preserveMockSession: true,
  })
  const confirmedFrame = getConfirmedNewEditFrame(input.form)
  if (!confirmedFrame) {
    return {
      ok: false,
      sourceRecords: [],
      responseSummaries,
      warnings: ['Choose and confirm the output frame and platform before creating the edit.'],
      safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
      mockOnly: true,
    }
  }
  const preferenceHandle = getNewEditSessionPreferenceHandle(input.form.preferenceChoiceId)
  const sourceNotes = normalizedSourceNotes(input.form.sourceNotes)

  const createResponse = await client.sessions.create<{
    session: ProjectEditSessionRecord
  }>({
    projectId: input.projectId,
    name: input.form.name.trim() || NEW_EDIT_SESSION_DEFAULT_FORM.name,
    status: 'draft',
    aspectRatio: confirmedFrame.aspectRatio,
    platformTarget: confirmedFrame.platformTarget,
    selectedEditLevel: input.form.selectedEditLevel,
    selectedEditPreferenceHandle: preferenceHandle,
    metadata: {
      createdFromProjectHome: true,
      rpMilestone: 'RP-EDITSESSION-06',
      preferenceChoiceId: input.form.preferenceChoiceId,
      preferenceNote: input.form.preferenceNote.trim() || undefined,
      preferenceApplicationDeferred: !preferenceHandle,
      outputFrameConfirmed: true,
      outputFrameConfirmationSource: 'new_edit_create_form',
      confirmedAspectRatio: confirmedFrame.aspectRatio,
      confirmedPlatformTarget: confirmedFrame.platformTarget,
      sourceNotes: sourceNotes.map((sourceNote) => ({
        label: sourceNote.label,
        notes: sourceNote.notes,
        importance: sourceNote.importance,
      })),
      safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    },
  })
  responseSummaries.push(responseSummary(createResponse, 'Create edit'))

  let session = dataRecord<{ session?: ProjectEditSessionRecord }>(createResponse)?.session
  if (!createResponse.ok || !session) {
    return {
      ok: false,
      sourceRecords: [],
      responseSummaries,
      warnings: [
        ...warnings,
        createResponse.error?.message ?? 'Mock edit creation failed without production side effects.',
      ],
      safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
      mockOnly: true,
    }
  }

  const sourceRecords: ProjectEditSessionSourceRecord[] = []
  let initialMessage: ProjectEditSessionMessageRecord | undefined
  let initialMemory: ProjectEditSessionMemoryRecord | undefined
  let initialSnapshot: ProjectEditSessionSnapshotRecord | undefined
  let initialEvent: ProjectEditSessionEventRecord | undefined

  if (preferenceHandle) {
    const preferenceResponse = await client.preference.apply<{
      session?: ProjectEditSessionRecord
    }>({
      projectId: input.projectId,
      editSessionId: session.id,
      preferenceHandle,
    })
    responseSummaries.push(responseSummary(preferenceResponse, 'Apply selected Edit Preference'))
    if (preferenceResponse.ok && preferenceResponse.data?.session) {
      session = preferenceResponse.data.session
    } else {
      warnings.push(preferenceResponse.error?.message ?? 'Selected Edit Preference application was deferred safely.')
    }
  }

  if (sourceNotes.length > 0) {
    const sourcesResponse = await client.sources.saveMany<{
      sources: ProjectEditSessionSourceRecord[]
    }>({
      projectId: input.projectId,
      editSessionId: session.id,
      sources: sourceNotes.map((sourceNote, index) => ({
        projectId: input.projectId,
        editSessionId: session.id,
        mediaAssetId: `${session.id}-metadata-source-${index + 1}`,
        sourceOrderIndex: index + 1,
        label: sourceNote.label || `Mock source ${index + 1}`,
        notes: sourceNote.notes ? [sourceNote.notes] : [],
        importance: sourceNote.importance,
      })),
    })
    responseSummaries.push(responseSummary(sourcesResponse, 'Save metadata-only source notes'))
    if (sourcesResponse.ok) {
      sourceRecords.push(...(dataRecord<{ sources?: ProjectEditSessionSourceRecord[] }>(sourcesResponse)?.sources ?? []))
    } else {
      warnings.push(sourcesResponse.error?.message ?? 'Source note initialization was deferred.')
    }
  }

  const messageResponse = await client.messages.append<{
    message: ProjectEditSessionMessageRecord
  }>({
    projectId: input.projectId,
    editSessionId: session.id,
    role: 'system',
    kind: 'system_note',
    text: 'This edit was created in mock/local mode. The edit workspace can save setup, brief, preview, and safe session state without starting runtime execution.',
    metadata: {
      rpMilestone: 'RP-EDITSESSION-06',
      noFullChatRouteOpened: true,
      noProgressStarted: true,
    },
  })
  responseSummaries.push(responseSummary(messageResponse, 'Append initial system message'))
  if (messageResponse.ok) {
    initialMessage = dataRecord<{ message?: ProjectEditSessionMessageRecord }>(messageResponse)?.message
  } else {
    warnings.push(messageResponse.error?.message ?? 'Initial system message was deferred.')
  }

  const memoryResponse = await client.memory.upsert<{
    memory: ProjectEditSessionMemoryRecord
  }>({
    projectId: input.projectId,
    editSessionId: session.id,
    layer: 'session_memory',
    summary: 'Mock/local edit created from Project Home for the edit workspace.',
    facts: [
      `Confirmed aspect ratio: ${confirmedFrame.aspectRatio}`,
      `Confirmed platform target: ${confirmedFrame.platformTarget}`,
    ],
    preferences: preferenceHandle ? [`Selected Edit Preference handle: ${preferenceHandle}`] : [],
    warnings: [
      'Metadata-only setup. No upload, file bytes, media processing, provider, worker, render, or credit action occurred.',
    ],
    metadata: {
      sourceNoteCount: sourceNotes.length,
      preferenceChoiceId: input.form.preferenceChoiceId,
    },
  })
  responseSummaries.push(responseSummary(memoryResponse, 'Upsert initial session memory'))
  if (memoryResponse.ok) {
    initialMemory = dataRecord<{ memory?: ProjectEditSessionMemoryRecord }>(memoryResponse)?.memory
  } else {
    warnings.push(memoryResponse.error?.message ?? 'Initial memory was deferred.')
  }

  const snapshotResponse = await client.snapshots.save<{
    snapshot: ProjectEditSessionSnapshotRecord
  }>({
    projectId: input.projectId,
    editSessionId: session.id,
    kind: 'created',
    messageId: initialMessage?.id,
    summary: 'Created mock/local edit from Project Home.',
    state: {
      name: session.name,
      aspectRatio: session.aspectRatio,
      platformTarget: session.platformTarget,
      outputFrameConfirmed: true,
      selectedEditLevel: session.selectedEditLevel,
      sourceNoteCount: sourceNotes.length,
      noProgressStarted: true,
      noPreviewStarted: true,
      safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    },
  })
  responseSummaries.push(responseSummary(snapshotResponse, 'Save created snapshot'))
  if (snapshotResponse.ok) {
    initialSnapshot = dataRecord<{ snapshot?: ProjectEditSessionSnapshotRecord }>(snapshotResponse)?.snapshot
  } else {
    warnings.push(snapshotResponse.error?.message ?? 'Initial snapshot was deferred.')
  }

  const eventResponse = await client.events.append<{
    event: ProjectEditSessionEventRecord
  }>({
    projectId: input.projectId,
    editSessionId: session.id,
    eventType: 'edit_chat_created',
    summary: 'Edit created from Project Home + New Edit in mock/local mode.',
    metadata: {
      rpMilestone: 'RP-EDITSESSION-06',
      fullChatRouteImplemented: false,
      chatNativeEditorChanged: false,
    },
  })
  responseSummaries.push(responseSummary(eventResponse, 'Append created event'))
  if (eventResponse.ok) {
    initialEvent = dataRecord<{ event?: ProjectEditSessionEventRecord }>(eventResponse)?.event
  } else {
    warnings.push(eventResponse.error?.message ?? 'Initial event was deferred.')
  }

  const bundleResponse = await client.bundle.get<{
    bundle: ProjectEditSessionBundleRecord
  }>(session.id)
  responseSummaries.push(responseSummary(bundleResponse, 'Load created edit bundle'))
  const bundle = dataRecord<{ bundle?: ProjectEditSessionBundleRecord }>(bundleResponse)?.bundle
  if (!bundleResponse.ok) warnings.push(bundleResponse.error?.message ?? 'Created bundle could not be loaded.')

  return {
    ok: true,
    session,
    bundle,
    sourceRecords,
    initialMessage,
    initialMemory,
    initialSnapshot,
    initialEvent,
    responseSummaries,
    warnings,
    safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    mockOnly: true,
  }
}
