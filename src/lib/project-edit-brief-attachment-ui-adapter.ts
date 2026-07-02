import type {
  ProjectEditBriefAttachmentKind,
  ProjectEditBriefMarkerAttachmentRecord,
  ProjectEditBriefMarkerDrawerModel,
  ProjectEditBriefMarkerIntentRecord,
} from '../types/project-edit-brief'
import type {
  ProjectEditBriefAttachmentChipModel,
  ProjectEditBriefAttachmentDraft,
  ProjectEditBriefAttachmentIntentBridgeResult,
  ProjectEditBriefAttachmentKindDefinition,
  ProjectEditBriefAttachmentPanelModel,
  ProjectEditBriefAttachmentSafetyFlags,
  ProjectEditBriefAttachmentValidationResult,
} from '../types/project-edit-brief-attachments'
import {
  createDefaultMockProjectEditBriefApiClient,
  type ProjectEditBriefApiClient,
} from './project-edit-brief-api-client'
import {
  addProjectEditBriefMarkerAttachmentViaApi,
  getProjectEditBriefMarkerDrawerViaApi,
  removeProjectEditBriefMarkerAttachmentViaApi,
  updateProjectEditBriefMarkerViaApi,
  updateProjectEditBriefMarkerIntentViaApi,
} from './project-edit-brief-api-client-adapter'

export const PROJECT_EDIT_BRIEF_ATTACHMENT_UI_SAFETY_FLAGS: ProjectEditBriefAttachmentSafetyFlags = {
  providerCallMade: false,
  modelCallMade: false,
  soundRuntimeStarted: false,
  dockerCommandRun: false,
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
}

export const PROJECT_EDIT_BRIEF_ATTACHMENT_KIND_OPTIONS: ProjectEditBriefAttachmentKindDefinition[] = [
  { kind: 'broll_video', displayName: 'B-roll video', iconLabel: 'Video', acceptedMetadataLabels: ['city-broll.mp4', 'product cutaway'], futureUploadAllowed: true, mockOnly: true, notes: ['Metadata-only B-roll label.'] },
  { kind: 'image', displayName: 'Image', iconLabel: 'Image', acceptedMetadataLabels: ['product-shot.png'], futureUploadAllowed: true, mockOnly: true, notes: ['Metadata-only image label.'] },
  { kind: 'music_track', displayName: 'Music track', iconLabel: 'Music', acceptedMetadataLabels: ['calm-track.mp3'], futureUploadAllowed: true, mockOnly: true, notes: ['No sound runtime starts.'] },
  { kind: 'soundtrack', displayName: 'Soundtrack', iconLabel: 'Music', acceptedMetadataLabels: ['soundtrack label'], futureUploadAllowed: true, mockOnly: true, notes: ['No audio analysis starts.'] },
  { kind: 'sfx', displayName: 'SFX', iconLabel: 'SFX', acceptedMetadataLabels: ['soft-whoosh.wav'], futureUploadAllowed: true, mockOnly: true, notes: ['No SFX provider is called.'] },
  { kind: 'voiceover', displayName: 'Voiceover', iconLabel: 'Voice', acceptedMetadataLabels: ['founder intro'], futureUploadAllowed: true, mockOnly: true, notes: ['No voice bytes are read.'] },
  { kind: 'document', displayName: 'Document', iconLabel: 'Doc', acceptedMetadataLabels: ['script note'], futureUploadAllowed: true, mockOnly: true, notes: ['Document label only.'] },
  { kind: 'reference_label', displayName: 'Reference', iconLabel: 'Ref', acceptedMetadataLabels: ['city skyline inspiration'], futureUploadAllowed: false, mockOnly: true, notes: ['Reference label only.'] },
  { kind: 'reference_url_metadata_only', displayName: 'URL metadata', iconLabel: 'URL', acceptedMetadataLabels: ['metadata-only reference URL'], futureUploadAllowed: false, mockOnly: true, notes: ['URL is not fetched.'] },
]

function defaultClient(client?: ProjectEditBriefApiClient): ProjectEditBriefApiClient {
  return client ?? createDefaultMockProjectEditBriefApiClient()
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function titleCase(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function kindDefinition(kind: ProjectEditBriefAttachmentKind): ProjectEditBriefAttachmentKindDefinition {
  return PROJECT_EDIT_BRIEF_ATTACHMENT_KIND_OPTIONS.find((option) => option.kind === kind)
    ?? PROJECT_EDIT_BRIEF_ATTACHMENT_KIND_OPTIONS[7]
}

export function redactProjectEditBriefAttachmentReferenceUrlForUI(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined
  try {
    const url = new URL(value.trim())
    return `${url.protocol}//${url.hostname}/...`
  } catch {
    return 'invalid-url-metadata'
  }
}

export function createProjectEditBriefAttachmentBoundarySummary(): string {
  return 'Marker attachments are metadata-only. No upload, file-byte read, external URL fetch, media processing, sound runtime, Docker, provider, worker, render, credit, or Supabase write is performed.'
}

export function createProjectEditBriefAttachmentChipModelsForUI(
  attachments: ProjectEditBriefMarkerAttachmentRecord[],
): ProjectEditBriefAttachmentChipModel[] {
  return attachments.map((attachment) => {
    const definition = kindDefinition(attachment.attachmentKind)
    const isBlocked = attachment.status === 'needs_upload_future' || attachment.status === 'blocked'
    return {
      id: attachment.id,
      markerId: attachment.markerId,
      label: attachment.label,
      kindLabel: definition.displayName,
      iconLabel: definition.iconLabel,
      statusLabel: titleCase(attachment.status),
      previewMode: isBlocked ? 'future_media_preview_blocked' : attachment.attachmentKind === 'reference_url_metadata_only' ? 'metadata_detail' : 'chip_only',
      previewLabel: attachment.previewLabel,
      referenceUrlLabel: redactProjectEditBriefAttachmentReferenceUrlForUI(attachment.referenceUrl),
      notes: attachment.notes.length ? attachment.notes : ['Metadata-only attachment. No file bytes are read.'],
      warnings: [
        attachment.attachmentKind === 'music_track' || attachment.attachmentKind === 'soundtrack' || attachment.attachmentKind === 'sfx'
          ? 'Music/SFX attachment is metadata-only; no sound runtime, render, worker, or credits.'
          : 'This attachment is metadata-only.',
      ],
      mockOnly: true,
      ...PROJECT_EDIT_BRIEF_ATTACHMENT_UI_SAFETY_FLAGS,
    }
  })
}

export function createProjectEditBriefAttachmentPanelModelForUI(
  drawer: ProjectEditBriefMarkerDrawerModel,
  selectedAttachmentId?: string,
): ProjectEditBriefAttachmentPanelModel {
  const attachments = createProjectEditBriefAttachmentChipModelsForUI(drawer.attachments)
  return {
    projectId: drawer.marker.projectId,
    editSessionId: drawer.marker.editSessionId,
    briefId: drawer.marker.briefId,
    markerId: drawer.marker.id,
    title: drawer.marker.title,
    attachments,
    selectedAttachment: attachments.find((attachment) => attachment.id === selectedAttachmentId) ?? attachments[0],
    canAddMetadataAttachment: drawer.marker.status !== 'archived',
    canUploadRealFile: false,
    boundarySummary: createProjectEditBriefAttachmentBoundarySummary(),
    warnings: [
      'Real uploads arrive after storage/media gates.',
      'Reference URLs are stored as metadata only and are not fetched.',
    ],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_ATTACHMENT_UI_SAFETY_FLAGS,
  }
}

export async function loadProjectEditBriefAttachmentPanelForUI(
  markerId: string,
  client?: ProjectEditBriefApiClient,
  selectedAttachmentId?: string,
): Promise<ProjectEditBriefAttachmentPanelModel | undefined> {
  const response = await getProjectEditBriefMarkerDrawerViaApi(markerId, client)
  return response.drawer ? createProjectEditBriefAttachmentPanelModelForUI(response.drawer, selectedAttachmentId) : undefined
}

export function createProjectEditBriefAttachmentDraftForUI(input: {
  drawer: ProjectEditBriefMarkerDrawerModel
  attachmentKind?: ProjectEditBriefAttachmentKind
}): ProjectEditBriefAttachmentDraft {
  const kind = input.attachmentKind ?? 'broll_video'
  return {
    id: createId('project-edit-brief-attachment-draft'),
    projectId: input.drawer.marker.projectId,
    editSessionId: input.drawer.marker.editSessionId,
    briefId: input.drawer.marker.briefId,
    markerId: input.drawer.marker.id,
    attachmentKind: kind,
    inputMode: kind === 'reference_url_metadata_only' ? 'metadata_reference_url' : 'metadata_label',
    label: '',
    referenceUrl: undefined,
    referenceLabel: undefined,
    notes: [],
    status: 'metadata_only',
    safetyStatus: 'safe_metadata_only',
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_ATTACHMENT_UI_SAFETY_FLAGS,
  }
}

export function createProjectEditBriefAttachmentDraftFromPanelForUI(input: {
  panel: ProjectEditBriefAttachmentPanelModel
  attachmentKind?: ProjectEditBriefAttachmentKind
}): ProjectEditBriefAttachmentDraft {
  const kind = input.attachmentKind ?? 'broll_video'
  return {
    id: createId('project-edit-brief-attachment-draft'),
    projectId: input.panel.projectId,
    editSessionId: input.panel.editSessionId,
    briefId: input.panel.briefId,
    markerId: input.panel.markerId,
    attachmentKind: kind,
    inputMode: kind === 'reference_url_metadata_only' ? 'metadata_reference_url' : 'metadata_label',
    label: '',
    referenceUrl: undefined,
    referenceLabel: undefined,
    notes: [],
    status: 'metadata_only',
    safetyStatus: 'safe_metadata_only',
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_ATTACHMENT_UI_SAFETY_FLAGS,
  }
}

export function validateProjectEditBriefAttachmentDraftForUI(
  draft: ProjectEditBriefAttachmentDraft,
): ProjectEditBriefAttachmentValidationResult {
  const blockedReasons: string[] = []
  if (draft.inputMode === 'future_upload_placeholder') blockedReasons.push('Real uploads arrive after storage/media gates.')
  if (!draft.label.trim() && !draft.referenceUrl?.trim()) blockedReasons.push('Attachment label or reference URL metadata is required.')
  const safetyStatus = draft.inputMode === 'future_upload_placeholder'
    ? 'blocked_upload_gate'
    : blockedReasons.length ? 'failed_validation' : 'safe_metadata_only'
  return {
    ok: blockedReasons.length === 0,
    blocked: blockedReasons.length > 0,
    blockedReasons,
    safetyStatus,
    warnings: ['Validation is local and does not read files or fetch URLs.'],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_ATTACHMENT_UI_SAFETY_FLAGS,
  }
}

export function createProjectEditBriefAttachmentSavePayload(draft: ProjectEditBriefAttachmentDraft) {
  return {
    id: draft.id,
    projectId: draft.projectId,
    editSessionId: draft.editSessionId,
    briefId: draft.briefId,
    markerId: draft.markerId,
    attachmentKind: draft.inputMode === 'metadata_reference_url' ? 'reference_url_metadata_only' : draft.attachmentKind,
    status: 'metadata_only',
    label: draft.label.trim() || draft.referenceLabel?.trim() || 'Metadata-only reference',
    referenceUrl: draft.inputMode === 'metadata_reference_url' ? draft.referenceUrl?.trim() : undefined,
    referenceLabel: draft.referenceLabel?.trim() || undefined,
    notes: draft.notes.filter(Boolean),
    previewLabel: 'Metadata-only. Real preview arrives after storage/media gates.',
    metadata: {
      source: 'rp_editbrief_08_marker_attachments',
      inputMode: draft.inputMode,
      referenceUrlFetched: false,
      fileBytesRead: false,
      mediaProcessingStarted: false,
      soundRuntimeStarted: false,
    },
  }
}

export function createProjectEditBriefAttachmentIntentBridgeForUI(input: {
  intent?: ProjectEditBriefMarkerIntentRecord
  attachments: ProjectEditBriefMarkerAttachmentRecord[]
}): ProjectEditBriefAttachmentIntentBridgeResult {
  const relevant = input.attachments
  const providedAssetIds = Array.from(new Set([
    ...(input.intent?.providedAssetIds ?? []),
    ...relevant.map((attachment) => attachment.id),
  ]))
  const updatedBlockingNeeds = (input.intent?.blockingNeeds ?? []).filter((need) => !/asset|upload|b-roll|missing/i.test(need))
  return {
    markerId: input.intent?.markerId ?? relevant[0]?.markerId ?? 'unknown-marker',
    intentId: input.intent?.id,
    providedAssetIds,
    updatedBlockingNeeds,
    updatedPlannerHints: [
      ...(input.intent?.plannerHints ?? []),
      ...relevant.map((attachment) => `Metadata-only attachment: ${attachment.label}.`),
    ],
    statusSuggestion: input.intent?.status === 'needs_asset' && relevant.length ? 'draft_intent' : input.intent?.status,
    warnings: [
      'Intent bridge is conservative and never marks ready_for_plan.',
      'Attachments have not been uploaded, processed, fetched, or verified.',
    ],
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_ATTACHMENT_UI_SAFETY_FLAGS,
  }
}

export async function addProjectEditBriefMetadataAttachmentViaApi(
  draft: ProjectEditBriefAttachmentDraft,
  client?: ProjectEditBriefApiClient,
) {
  const validation = validateProjectEditBriefAttachmentDraftForUI(draft)
  if (!validation.ok) {
    return {
      ok: false,
      attachment: undefined,
      validation,
      warnings: validation.blockedReasons,
      ...PROJECT_EDIT_BRIEF_ATTACHMENT_UI_SAFETY_FLAGS,
    }
  }
  const response = await addProjectEditBriefMarkerAttachmentViaApi(createProjectEditBriefAttachmentSavePayload(draft), defaultClient(client))
  const drawerResponse = await getProjectEditBriefMarkerDrawerViaApi(draft.markerId, defaultClient(client))
  let bridge: ProjectEditBriefAttachmentIntentBridgeResult | undefined
  if (drawerResponse.drawer) {
    const attachments = response.attachment
      ? [...drawerResponse.drawer.attachments.filter((attachment) => attachment.id !== response.attachment?.id), response.attachment]
      : drawerResponse.drawer.attachments
    bridge = createProjectEditBriefAttachmentIntentBridgeForUI({
      intent: drawerResponse.drawer.intent,
      attachments,
    })
    if (drawerResponse.drawer.intent && bridge.providedAssetIds.length) {
      await updateProjectEditBriefMarkerIntentViaApi({
        intentId: drawerResponse.drawer.intent.id,
        patch: {
          providedAssetIds: bridge.providedAssetIds,
          blockingNeeds: bridge.updatedBlockingNeeds,
          plannerHints: bridge.updatedPlannerHints,
          status: bridge.statusSuggestion,
          metadata: {
            ...(drawerResponse.drawer.intent.metadata ?? {}),
            attachmentBridgeUpdated: true,
            noPlannerApplication: true,
          },
        },
      }, defaultClient(client))
    }
    if (drawerResponse.drawer.marker.status === 'needs_asset' && bridge.providedAssetIds.length) {
      await updateProjectEditBriefMarkerViaApi({
        markerId: drawerResponse.drawer.marker.id,
        patch: {
          status: 'draft',
          qaStatus: 'not_checked',
          metadata: {
            ...(drawerResponse.drawer.marker.metadata ?? {}),
            attachmentBridgeUpdated: true,
            assetRequirementResolvedToDraft: true,
            noPlannerApplication: true,
          },
        },
      }, defaultClient(client))
    }
  }
  return {
    ...response,
    attachment: response.attachment,
    validation,
    intentBridge: bridge,
    warnings: [
      'Attachment saved as mock/local metadata only.',
      ...(bridge?.warnings ?? []),
    ],
    ...PROJECT_EDIT_BRIEF_ATTACHMENT_UI_SAFETY_FLAGS,
  }
}

export async function removeProjectEditBriefAttachmentViaApi(
  attachmentId: string,
  client?: ProjectEditBriefApiClient,
) {
  const response = await removeProjectEditBriefMarkerAttachmentViaApi(attachmentId, defaultClient(client))
  return {
    ...response,
    warnings: ['Attachment metadata removed from mock/local state only.'],
    ...PROJECT_EDIT_BRIEF_ATTACHMENT_UI_SAFETY_FLAGS,
  }
}
