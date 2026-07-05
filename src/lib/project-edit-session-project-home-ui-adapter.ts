import type {
  ProjectEditSessionRecord,
  ProjectEditSessionCardModel,
  ProjectEditSessionCardShape,
  ProjectEditSessionStatus,
} from '../types/project-edit-session'
import type { UserFacingEditLevel } from '../types/reeditpro'
import type { ProjectEditSessionBundleRecord } from '../types/project-edit-session-repository'
import {
  createDefaultMockProjectEditSessionApiClient,
  type ProjectEditSessionApiClient,
} from './project-edit-session-api-client'
import {
  getProjectEditSessionBundleViaApi,
  listProjectEditSessionCardsViaApi,
} from './project-edit-session-api-client-adapter'
import {
  createProjectEditSessionBundleClientSummary,
  createProjectEditSessionCardListSummary,
} from './project-edit-session-api-client-summaries'
import { createProjectEditSessionBriefPath, createProjectEditSessionPath } from './project-edit-session-navigation'

export const MOCK_PROJECT_HOME_PROJECT_ID = 'mock-project-edit-chat-foundation'

export type ProjectEditSessionHomeCardViewModel = {
  id: string
  projectId: string
  name: string
  statusLabel: string
  status: ProjectEditSessionStatus
  aspectRatio: string
  platformLabel: string
  frameLabel: string
  cardShape: ProjectEditSessionCardShape
  shapeClassName: string
  selectedEditPreferenceLabel: string
  dnaBadgeLabel: 'DNA applied' | 'Legacy no-DNA'
  qaBadgeLabel: string
  badgeLabels: string[]
  messageCount: number
  revisionCount: number
  versionCount: number
  lastEditedLabel: string
  latestPreviewLabel: string
  mockOnly: true
}

export type ProjectEditSessionHomeDetailViewModel = {
  editSessionId: string
  title: string
  summaryLines: string[]
  latestStatus: string
  sourceCount: number
  selectedEditLevelLabel: string
  selectedPreferenceSummary: string
  sourceNotesSummary: string
  latestPreviewLabel: string
  memorySummary: string
  versionSummary: string
  revisionSummary: string
  eventSummary: string
  openChatLabel: string
  openChatRoute: string
  warnings: string[]
  mockOnly: true
}

export type ProjectEditSessionProjectHomeModel = {
  projectId: string
  projectTitle: string
  projectContext: string
  mockLabel: string
  cardModels: ProjectEditSessionHomeCardViewModel[]
  summary: ReturnType<typeof createProjectEditSessionCardListSummary>
}

export type NewEditSessionPlaceholderModel = {
  title: string
  body: string
  nextMilestone: string
  mockOnly: true
}

function titleCase(value: string): string {
  return value
    .replace(/^@/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function statusLabel(value: string): string {
  return titleCase(value)
}

function editLevelLabel(value: UserFacingEditLevel | undefined): string {
  if (value === 'ultra_premium') return 'Ultra Premium'
  if (value === 'premium') return 'Premium'
  if (value === 'basic') return 'Basic'
  return 'Not selected'
}

function formatLastEdited(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function shapeClassName(shape: ProjectEditSessionCardShape): string {
  return `project-edit-session-card--${shape}`
}

function cardShapeForAspectRatio(aspectRatio: ProjectEditSessionRecord['aspectRatio']): ProjectEditSessionCardShape {
  if (aspectRatio === '9:16') return 'vertical'
  if (aspectRatio === '16:9') return 'wide'
  if (aspectRatio === '1:1') return 'square'
  if (aspectRatio === '4:5') return 'social'
  return 'custom'
}

export function createProjectHomeTitle(projectId: string): string {
  if (projectId === MOCK_PROJECT_HOME_PROJECT_ID) return 'ReEditPro Demo Project'
  return titleCase(projectId)
}

export function createNewEditSessionPlaceholderModel(): NewEditSessionPlaceholderModel {
  return {
    title: 'New Edit creates mock Edit Chats',
    body: 'Use + New Edit to create a browser-session Edit Chat, then open the mock/local persistent chat workspace.',
    nextMilestone: 'RP-EDITSESSION-08',
    mockOnly: true,
  }
}

export function createProjectEditSessionProjectHomeClient(
  projectId = MOCK_PROJECT_HOME_PROJECT_ID,
): ProjectEditSessionApiClient {
  return createDefaultMockProjectEditSessionApiClient({
    projectId,
    preserveMockSession: true,
  })
}

export function createProjectEditSessionHomeCardViewModel(
  card: ProjectEditSessionCardModel,
): ProjectEditSessionHomeCardViewModel {
  const hasDna = Boolean(card.dnaStatusLabel) || card.badges.some((badge) => badge.toLowerCase().includes('dna'))
  const latestPreviewLabel = card.latestPreviewUrl ? 'Mock preview ready' : 'Preview placeholder'
  const selectedEditPreferenceLabel = card.selectedEditPreferenceHandle
    ? card.selectedEditPreferenceHandle
    : 'No saved preference selected'

  return {
    id: card.id,
    projectId: card.projectId,
    name: card.name,
    statusLabel: statusLabel(card.status),
    status: card.status,
    aspectRatio: card.aspectRatio,
    platformLabel: titleCase(card.platformTarget),
    frameLabel: `${card.aspectRatio} ${titleCase(card.platformTarget)}`,
    cardShape: card.cardShape,
    shapeClassName: shapeClassName(card.cardShape),
    selectedEditPreferenceLabel,
    dnaBadgeLabel: hasDna ? 'DNA applied' : 'Legacy no-DNA',
    qaBadgeLabel: card.dnaQAStatusLabel ?? (hasDna ? 'DNA QA ready' : 'Legacy QA'),
    badgeLabels: Array.from(new Set([
      statusLabel(card.status),
      card.aspectRatio,
      titleCase(card.platformTarget),
      hasDna ? 'DNA applied' : 'Legacy no-DNA',
      'Mock only',
      ...card.badges.map(statusLabel),
    ])),
    messageCount: card.messageCount,
    revisionCount: card.revisionCount,
    versionCount: card.versionCount,
    lastEditedLabel: formatLastEdited(card.lastEditedAt),
    latestPreviewLabel,
    mockOnly: true,
  }
}

export function createProjectEditSessionHomeCardViewModelFromRecord(
  session: ProjectEditSessionRecord,
): ProjectEditSessionHomeCardViewModel {
  return createProjectEditSessionHomeCardViewModel({
    id: session.id,
    projectId: session.projectId,
    name: session.name,
    status: session.status,
    aspectRatio: session.aspectRatio,
    platformTarget: session.platformTarget,
    thumbnailUrl: session.thumbnailUrl,
    latestPreviewUrl: session.latestPreviewUrl,
    selectedEditPreferenceHandle: session.selectedEditPreferenceHandle,
    dnaStatusLabel: session.dnaStatusLabel,
    dnaQAStatusLabel: session.dnaQAStatusLabel,
    badges: ['Backend local', session.mockOnly ? 'Mock safe' : 'Persistent'],
    messageCount: session.messageCount,
    revisionCount: session.revisionCount,
    versionCount: session.versionCount,
    lastEditedAt: session.updatedAt,
    cardShape: cardShapeForAspectRatio(session.aspectRatio),
    mockOnly: true,
  })
}

export function createProjectEditSessionHomeDetailViewModel(
  bundle: ProjectEditSessionBundleRecord | undefined,
): ProjectEditSessionHomeDetailViewModel | undefined {
  if (!bundle) return undefined
  const summary = createProjectEditSessionBundleClientSummary(bundle)
  const latestPreview = bundle.previews[0]
  const latestVersion = bundle.versions[0]
  const latestRevision = bundle.revisions[0]
  const latestEvent = bundle.events[0]
  const metadata = bundle.session.metadata ?? {}
  const sourceNotes = Array.isArray(metadata.sourceNotes) ? metadata.sourceNotes : []
  const sourceNotesSummary = sourceNotes.length
    ? `${sourceNotes.length} metadata-only source note(s) captured.`
    : bundle.sources.length
      ? `${bundle.sources.length} mock source record(s) captured.`
      : 'No source notes yet.'
  const memorySummary = bundle.memories.length
    ? `${bundle.memories.length} memory layer(s): ${bundle.memories.map((memory) => titleCase(memory.layer)).join(', ')}`
    : 'No memory layers yet.'
  const preferenceDeferred = metadata.preferenceApplicationDeferred === true
  const selectedPreferenceSummary = bundle.session.selectedEditPreferenceHandle
    ? `${bundle.session.selectedEditPreferenceHandle}${preferenceDeferred ? ' selected; DNA/setup application deferred.' : ''}`
    : 'No saved Edit Preference selected.'

  return {
    editSessionId: bundle.session.id,
    title: bundle.session.name,
    summaryLines: summary.summary,
    latestStatus: statusLabel(bundle.session.status),
    sourceCount: bundle.sources.length,
    selectedEditLevelLabel: editLevelLabel(bundle.session.selectedEditLevel),
    selectedPreferenceSummary,
    sourceNotesSummary,
    latestPreviewLabel: latestPreview
      ? `${statusLabel(latestPreview.status)} (${latestPreview.aspectRatio})`
      : 'Preview placeholder only',
    memorySummary,
    versionSummary: latestVersion
      ? `Latest version v${latestVersion.versionNumber}: ${statusLabel(latestVersion.status)}`
      : 'No versions yet.',
    revisionSummary: latestRevision
      ? `${latestRevision.summary} Approval reset: ${latestRevision.resetsApproval ? 'yes' : 'no'}.`
      : 'No revisions requested.',
    eventSummary: latestEvent ? `${statusLabel(latestEvent.eventType)}: ${latestEvent.summary}` : 'No event records yet.',
    openChatLabel: 'Open Edit Chat',
    openChatRoute: createProjectEditSessionPath(bundle.session.projectId, bundle.session.id),
    warnings: summary.warnings ?? [],
    mockOnly: true,
  }
}

export function createProjectEditSessionHomeDetailViewModelFromRecord(
  session: ProjectEditSessionRecord | undefined,
): ProjectEditSessionHomeDetailViewModel | undefined {
  if (!session) return undefined

  const metadata = session.metadata ?? {}
  const sourceNotes = Array.isArray(metadata.sourceNotes) ? metadata.sourceNotes : []
  const noUploadStarted = metadata.noUploadStarted === true
  const noPlanApproved = metadata.noPlanApproved === true

  return {
    editSessionId: session.id,
    title: session.name,
    summaryLines: [
      'Backend-local edit session read back from the project route.',
      noUploadStarted
        ? 'No source video has been uploaded for this edit yet.'
        : 'Source/upload state is handled inside the edit brief workspace.',
      noPlanApproved
        ? 'No edit plan has been approved yet.'
        : 'Plan state is handled by the edit brief approval gate.',
    ],
    latestStatus: statusLabel(session.status),
    sourceCount: session.sourceMediaAssetIds.length,
    selectedEditLevelLabel: editLevelLabel(session.selectedEditLevel),
    selectedPreferenceSummary: session.selectedEditPreferenceHandle
      ? `${session.selectedEditPreferenceHandle} selected; setup continues in the edit workspace.`
      : 'No saved Edit Preference selected.',
    sourceNotesSummary: sourceNotes.length
      ? `${sourceNotes.length} metadata-only source note(s) captured.`
      : 'No source notes yet.',
    latestPreviewLabel: session.latestPreviewUrl ? 'Preview ready' : 'No preview yet.',
    memorySummary: 'Backend-local edit session metadata only; memory layers are created later in the edit workspace.',
    versionSummary: 'No versions yet.',
    revisionSummary: 'No revisions requested.',
    eventSummary: 'Backend-local edit session list/readback only.',
    openChatLabel: 'Open edit brief',
    openChatRoute: createProjectEditSessionBriefPath(session.projectId, session.id),
    warnings: [
      'Opening the edit does not start tools, rendering, credits, Supabase/GCS writes, beta, or production work.',
    ],
    mockOnly: true,
  }
}

export async function loadProjectEditSessionProjectHomeModel(
  projectId = MOCK_PROJECT_HOME_PROJECT_ID,
  client?: ProjectEditSessionApiClient,
): Promise<ProjectEditSessionProjectHomeModel> {
  const { cardModels, summary } = await listProjectEditSessionCardsViaApi(projectId, client)
  return {
    projectId,
    projectTitle: createProjectHomeTitle(projectId),
    projectContext: 'Project Home for mock/local Edit Chats. Project remains the workspace container.',
    mockLabel: 'Mock/local only',
    cardModels: cardModels.map(createProjectEditSessionHomeCardViewModel),
    summary,
  }
}

export async function loadProjectEditSessionHomeDetail(
  editSessionId: string,
  client?: ProjectEditSessionApiClient,
): Promise<ProjectEditSessionHomeDetailViewModel | undefined> {
  const { bundle } = await getProjectEditSessionBundleViaApi(editSessionId, client)
  return createProjectEditSessionHomeDetailViewModel(bundle)
}
