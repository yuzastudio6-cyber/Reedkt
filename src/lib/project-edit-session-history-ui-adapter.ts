import type { ReeditProApiResponseEnvelope } from '../types/api-routes'
import type {
  ProjectEditSessionApprovalStatus,
  ProjectEditSessionEventRecord,
  ProjectEditSessionPreviewRecord,
  ProjectEditSessionRevisionRecord,
  ProjectEditSessionSnapshotRecord,
  ProjectEditSessionVersionRecord,
} from '../types/project-edit-session'
import type {
  ProjectEditSessionHistoryPackage,
  ProjectEditSessionHistoryTimelineItem,
} from '../types/project-edit-session-history'
import type { ProjectEditSessionBundleRecord } from '../types/project-edit-session-repository'
import {
  createDefaultMockProjectEditSessionApiClient,
  type ProjectEditSessionApiClient,
} from './project-edit-session-api-client'
import { PROJECT_EDIT_SESSION_API_CLIENT_SAFETY } from './project-edit-session-api-client-summaries'

const DEFAULT_PROJECT_ID = 'mock-project-edit-chat-foundation'

function clientFor(projectId: string, client?: ProjectEditSessionApiClient): ProjectEditSessionApiClient {
  return client ?? createDefaultMockProjectEditSessionApiClient({
    projectId,
    preserveMockSession: true,
  })
}

function dataRecord<TRecord extends object>(response: ReeditProApiResponseEnvelope): TRecord | undefined {
  return response.data && typeof response.data === 'object' && !Array.isArray(response.data)
    ? response.data as TRecord
    : undefined
}

function formatTitle(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function sortByCreatedAt<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

function makeTimelineItem(input: {
  id: string
  kind: ProjectEditSessionHistoryTimelineItem['kind']
  title: string
  summary: string
  createdAt: string
  statusLabel?: string
}): ProjectEditSessionHistoryTimelineItem {
  return {
    ...input,
    mockOnly: true,
  }
}

export type ProjectEditSessionPreviewHistoryCardModel = {
  title: string
  body: string
  previewUrl?: string
  thumbnailUrl?: string
  statusLabel: string
  mockOnly: true
}

export type ProjectEditSessionApprovalStateModel = {
  status: ProjectEditSessionApprovalStatus
  statusLabel: string
  body: string
  mockOnly: true
}

export type ProjectEditSessionHistoryPanelModel = {
  summary: string
  latestPreview: ProjectEditSessionPreviewHistoryCardModel
  approval: ProjectEditSessionApprovalStateModel
  snapshotItems: ProjectEditSessionHistoryTimelineItem[]
  versionItems: ProjectEditSessionHistoryTimelineItem[]
  previewItems: ProjectEditSessionHistoryTimelineItem[]
  revisionItems: ProjectEditSessionHistoryTimelineItem[]
  eventItems: ProjectEditSessionHistoryTimelineItem[]
  timelineItems: ProjectEditSessionHistoryTimelineItem[]
  actionLabels: string[]
  boundarySummary: string
  counts: {
    snapshots: number
    versions: number
    previews: number
    revisions: number
    events: number
  }
  mockOnly: true
}

export type ProjectEditSessionHistoryActionResult = {
  ok: boolean
  actionLabel: string
  historyPackage?: ProjectEditSessionHistoryPackage
  responses: ReeditProApiResponseEnvelope[]
  warnings: string[]
  safety: typeof PROJECT_EDIT_SESSION_API_CLIENT_SAFETY
  mockOnly: true
}

export function createProjectEditSessionHistoryPackageFromBundle(
  bundle: ProjectEditSessionBundleRecord,
): ProjectEditSessionHistoryPackage {
  const snapshots = sortByCreatedAt(bundle.snapshots)
  const versions = sortByCreatedAt(bundle.versions)
  const previews = sortByCreatedAt(bundle.previews)
  const revisions = sortByCreatedAt(bundle.revisions)
  const events = sortByCreatedAt(bundle.events)
  const snapshotItems = createProjectEditSessionSnapshotTimelineModel(snapshots)
  const versionItems = createProjectEditSessionVersionHistoryModel(versions)
  const previewItems = createProjectEditSessionPreviewHistoryModel(previews)
  const revisionItems = createProjectEditSessionRevisionHistoryModel(revisions)
  const eventItems = events.map((event) => makeTimelineItem({
    id: event.id,
    kind: 'event',
    title: formatTitle(event.eventType),
    summary: event.summary,
    createdAt: event.createdAt,
  }))
  const timelineItems = sortByCreatedAt([
    ...snapshotItems,
    ...versionItems,
    ...previewItems,
    ...revisionItems,
    ...eventItems,
  ])

  return {
    id: `history-package-${bundle.session.id}`,
    projectId: bundle.session.projectId,
    editSessionId: bundle.session.id,
    snapshots,
    versions,
    previews,
    revisions,
    events,
    latestSnapshot: snapshots.at(-1),
    latestVersion: versions.at(-1),
    latestPreview: previews.at(-1),
    approvalStatus: bundle.session.approvalStatus,
    readableSummary: `${versions.length} versions, ${previews.length} preview placeholders, ${revisions.length} revisions, ${snapshots.length} snapshots.`,
    timelineItems,
    mockOnly: true,
    warnings: [],
  }
}

export async function loadProjectEditSessionHistoryPackageForUI(input: {
  projectId?: string
  editSessionId: string
  client?: ProjectEditSessionApiClient
}): Promise<{
  response: ReeditProApiResponseEnvelope<{ bundle: ProjectEditSessionBundleRecord }>
  bundle?: ProjectEditSessionBundleRecord
  historyPackage?: ProjectEditSessionHistoryPackage
  panel?: ProjectEditSessionHistoryPanelModel
  warnings: string[]
  mockOnly: true
}> {
  const projectId = input.projectId ?? DEFAULT_PROJECT_ID
  const api = clientFor(projectId, input.client)
  const response = await api.bundle.get<{ bundle: ProjectEditSessionBundleRecord }>(input.editSessionId)
  const bundle = response.data?.bundle
  const historyPackage = bundle ? createProjectEditSessionHistoryPackageFromBundle(bundle) : undefined
  return {
    response,
    bundle,
    historyPackage,
    panel: historyPackage ? createProjectEditSessionHistoryPanelModel(historyPackage) : undefined,
    warnings: response.warnings ?? [],
    mockOnly: true,
  }
}

export function createProjectEditSessionSnapshotTimelineModel(
  snapshots: ProjectEditSessionSnapshotRecord[],
): ProjectEditSessionHistoryTimelineItem[] {
  return sortByCreatedAt(snapshots).map((snapshot) => makeTimelineItem({
    id: snapshot.id,
    kind: 'snapshot',
    title: formatTitle(snapshot.kind),
    summary: snapshot.summary,
    createdAt: snapshot.createdAt,
    statusLabel: snapshot.versionNumber ? `v${snapshot.versionNumber}` : undefined,
  }))
}

export function createProjectEditSessionVersionHistoryModel(
  versions: ProjectEditSessionVersionRecord[],
): ProjectEditSessionHistoryTimelineItem[] {
  return sortByCreatedAt(versions).map((version) => makeTimelineItem({
    id: version.id,
    kind: 'version',
    title: `Version ${version.versionNumber}`,
    summary: version.summary,
    createdAt: version.createdAt,
    statusLabel: formatTitle(version.status),
  }))
}

export function createProjectEditSessionPreviewHistoryModel(
  previews: ProjectEditSessionPreviewRecord[],
): ProjectEditSessionHistoryTimelineItem[] {
  return sortByCreatedAt(previews).map((preview) => makeTimelineItem({
    id: preview.id,
    kind: 'preview',
    title: formatTitle(preview.status),
    summary: preview.previewUrl ? `Mock preview placeholder for ${preview.aspectRatio}.` : `Mock preview metadata for ${preview.aspectRatio}.`,
    createdAt: preview.createdAt,
    statusLabel: formatTitle(preview.status),
  }))
}

export function createProjectEditSessionRevisionHistoryModel(
  revisions: ProjectEditSessionRevisionRecord[],
): ProjectEditSessionHistoryTimelineItem[] {
  return sortByCreatedAt(revisions).map((revision) => makeTimelineItem({
    id: revision.id,
    kind: 'revision',
    title: 'Revision requested',
    summary: revision.summary,
    createdAt: revision.createdAt,
    statusLabel: revision.resetsApproval ? 'Approval reset' : 'Approval unchanged',
  }))
}

export function createProjectEditSessionApprovalStateModel(status: ProjectEditSessionApprovalStatus): ProjectEditSessionApprovalStateModel {
  const body = status === 'approved'
    ? 'Approved state is recorded only; no progress, render, worker, provider, or credit flow starts.'
    : status === 'reset_after_revision'
      ? 'Approval reset after revision. A future edit-planning milestone must review it.'
      : status === 'rejected'
        ? 'Rejected state is recorded only; no render or worker flow starts.'
        : status === 'requested'
          ? 'Mock approval requested. Approval remains a state gate only.'
          : 'Approval has not been requested.'
  return {
    status,
    statusLabel: formatTitle(status),
    body,
    mockOnly: true,
  }
}

export function createProjectEditSessionHistoryBoundarySummary(): string {
  return 'Mock history only: no real preview/render, progress, workers, providers, Supabase writes, file reads, uploads, or credits.'
}

export function createProjectEditSessionHistoryPanelModel(
  historyPackage: ProjectEditSessionHistoryPackage,
): ProjectEditSessionHistoryPanelModel {
  const snapshotItems = createProjectEditSessionSnapshotTimelineModel(historyPackage.snapshots)
  const versionItems = createProjectEditSessionVersionHistoryModel(historyPackage.versions)
  const previewItems = createProjectEditSessionPreviewHistoryModel(historyPackage.previews)
  const revisionItems = createProjectEditSessionRevisionHistoryModel(historyPackage.revisions)
  const eventItems = historyPackage.events.map((event) => makeTimelineItem({
    id: event.id,
    kind: 'event',
    title: formatTitle(event.eventType),
    summary: event.summary,
    createdAt: event.createdAt,
  }))
  const timelineItems = sortByCreatedAt([
    ...snapshotItems,
    ...versionItems,
    ...previewItems,
    ...revisionItems,
    ...eventItems,
  ])

  return {
    summary: `${historyPackage.versions.length} versions, ${historyPackage.previews.length} preview placeholders, ${historyPackage.revisions.length} revisions, ${historyPackage.snapshots.length} snapshots.`,
    latestPreview: createLatestPreviewHistoryCardModel(historyPackage.latestPreview),
    approval: createProjectEditSessionApprovalStateModel(historyPackage.approvalStatus),
    snapshotItems,
    versionItems,
    previewItems,
    revisionItems,
    eventItems,
    timelineItems,
    actionLabels: ['Save mock version', 'Create preview placeholder', 'Add checkpoint', 'Approve mock version', 'Reject mock version'],
    boundarySummary: createProjectEditSessionHistoryBoundarySummary(),
    counts: {
      snapshots: historyPackage.snapshots.length,
      versions: historyPackage.versions.length,
      previews: historyPackage.previews.length,
      revisions: historyPackage.revisions.length,
      events: historyPackage.events.length,
    },
    mockOnly: true,
  }
}

export function createLatestPreviewHistoryCardModel(preview?: ProjectEditSessionPreviewRecord): ProjectEditSessionPreviewHistoryCardModel {
  return {
    title: preview ? 'Latest Preview placeholder' : 'Latest Preview placeholder',
    body: preview
      ? `${formatTitle(preview.status)} for ${preview.aspectRatio}. No render job or media output was created.`
      : 'No mock preview placeholder yet. Create one to test history without rendering.',
    previewUrl: preview?.previewUrl,
    thumbnailUrl: preview?.thumbnailUrl,
    statusLabel: preview ? formatTitle(preview.status) : 'Not created',
    mockOnly: true,
  }
}

async function loadHistoryAfterAction(
  projectId: string,
  editSessionId: string,
  api: ProjectEditSessionApiClient,
): Promise<ProjectEditSessionHistoryPackage | undefined> {
  const loaded = await loadProjectEditSessionHistoryPackageForUI({ projectId, editSessionId, client: api })
  return loaded.historyPackage
}

function actionResult(input: {
  ok: boolean
  actionLabel: string
  historyPackage?: ProjectEditSessionHistoryPackage
  responses: ReeditProApiResponseEnvelope[]
}): ProjectEditSessionHistoryActionResult {
  return {
    ...input,
    warnings: input.responses.flatMap((response) => response.ok ? [] : [response.error?.message ?? `${response.routeId} failed safely.`]),
    safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    mockOnly: true,
  }
}

export async function saveManualCheckpointViaApi(input: {
  projectId: string
  editSessionId: string
  summary?: string
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionHistoryActionResult> {
  const api = clientFor(input.projectId, input.client)
  const snapshot = await api.snapshots.save<{ snapshot: ProjectEditSessionSnapshotRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    kind: 'manual_checkpoint',
    summary: input.summary ?? 'Manual mock checkpoint saved from Edit Chat history panel.',
    state: {
      rpMilestone: 'RP-EDITSESSION-09',
      noRenderStarted: true,
      noProgressStarted: true,
      safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    },
  })
  const event = await api.events.append<{ event: ProjectEditSessionEventRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    eventType: 'manual_checkpoint_saved',
    summary: 'Manual mock checkpoint saved without production side effects.',
  })
  return actionResult({
    ok: snapshot.ok && event.ok,
    actionLabel: 'Manual checkpoint saved',
    historyPackage: await loadHistoryAfterAction(input.projectId, input.editSessionId, api),
    responses: [snapshot, event],
  })
}

export async function saveMockVersionViaApi(input: {
  projectId: string
  editSessionId: string
  summary?: string
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionHistoryActionResult> {
  const api = clientFor(input.projectId, input.client)
  const version = await api.versions.save<{ version: ProjectEditSessionVersionRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    status: 'draft',
    name: 'Mock Edit Chat Version',
    summary: input.summary ?? 'Mock version saved from history panel. No render or worker ran.',
    metadata: {
      rpMilestone: 'RP-EDITSESSION-09',
      noRenderStarted: true,
      noCreditReservedOrSpent: true,
    },
  })
  const savedVersion = dataRecord<{ version?: ProjectEditSessionVersionRecord }>(version)?.version
  const snapshot = await api.snapshots.save<{ snapshot: ProjectEditSessionSnapshotRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    kind: 'version_created',
    versionNumber: savedVersion?.versionNumber,
    summary: 'Mock version checkpoint saved without render.',
    state: {
      versionId: savedVersion?.id,
      noRenderStarted: true,
      safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    },
  })
  const event = await api.events.append<{ event: ProjectEditSessionEventRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    eventType: 'mock_version_saved',
    summary: 'Mock version saved without render, worker, provider, or credit side effects.',
    metadata: { versionId: savedVersion?.id },
  })
  return actionResult({
    ok: version.ok && snapshot.ok && event.ok,
    actionLabel: 'Mock version saved',
    historyPackage: await loadHistoryAfterAction(input.projectId, input.editSessionId, api),
    responses: [version, snapshot, event],
  })
}

export async function createMockPreviewPlaceholderViaApi(input: {
  projectId: string
  editSessionId: string
  versionId?: string
  aspectRatio?: string
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionHistoryActionResult> {
  const api = clientFor(input.projectId, input.client)
  const bundle = await api.bundle.get<{ bundle: ProjectEditSessionBundleRecord }>(input.editSessionId)
  const session = bundle.data?.bundle?.session
  const aspectRatio = input.aspectRatio ?? session?.aspectRatio ?? '9:16'
  const preview = await api.previews.save<{ preview: ProjectEditSessionPreviewRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    versionId: input.versionId,
    status: 'placeholder_mock',
    thumbnailUrl: `mock://project-edit-session/${input.editSessionId}/thumbnail/history-placeholder`,
    previewUrl: `mock://project-edit-session/${input.editSessionId}/preview/history-placeholder`,
    aspectRatio,
    durationSeconds: 30,
    metadata: {
      rpMilestone: 'RP-EDITSESSION-09',
      placeholderOnly: true,
      noFileCreated: true,
      noRenderStarted: true,
    },
  })
  const savedPreview = dataRecord<{ preview?: ProjectEditSessionPreviewRecord }>(preview)?.preview
  const snapshot = await api.snapshots.save<{ snapshot: ProjectEditSessionSnapshotRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    kind: 'preview_created',
    summary: 'Mock preview placeholder checkpoint saved without render.',
    state: {
      previewId: savedPreview?.id,
      noRenderStarted: true,
      noMediaProcessingStarted: true,
      safety: PROJECT_EDIT_SESSION_API_CLIENT_SAFETY,
    },
  })
  const event = await api.events.append<{ event: ProjectEditSessionEventRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    eventType: 'mock_preview_placeholder_created',
    summary: 'Mock preview placeholder created without rendering or media file output.',
    metadata: { previewId: savedPreview?.id },
  })
  return actionResult({
    ok: bundle.ok && preview.ok && snapshot.ok && event.ok,
    actionLabel: 'Mock preview placeholder created',
    historyPackage: await loadHistoryAfterAction(input.projectId, input.editSessionId, api),
    responses: [bundle, preview, snapshot, event],
  })
}

export async function approveMockVersionViaApi(input: {
  projectId: string
  editSessionId: string
  versionId?: string
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionHistoryActionResult> {
  const api = clientFor(input.projectId, input.client)
  const latestVersion = input.versionId
    ? undefined
    : dataRecord<{ version?: ProjectEditSessionVersionRecord }>(await api.versions.latest<{ version: ProjectEditSessionVersionRecord }>(input.editSessionId))?.version
  const version = await api.versions.save<{ version: ProjectEditSessionVersionRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    status: 'approved',
    name: 'Approved mock version',
    summary: 'Mock version approved as state only. No render/progress started.',
    metadata: {
      sourceVersionId: input.versionId ?? latestVersion?.id,
      approvedStateOnly: true,
      noRenderStarted: true,
    },
  })
  const session = await api.sessions.update({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    patch: {
      approvalStatus: 'approved',
      status: 'approved',
    },
  })
  const event = await api.events.append<{ event: ProjectEditSessionEventRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    eventType: 'mock_approval_state_changed',
    summary: 'Mock version approved as state only; no progress, render, worker, provider, or credits started.',
    metadata: { versionId: dataRecord<{ version?: ProjectEditSessionVersionRecord }>(version)?.version?.id },
  })
  return actionResult({
    ok: version.ok && session.ok && event.ok,
    actionLabel: 'Mock version approved',
    historyPackage: await loadHistoryAfterAction(input.projectId, input.editSessionId, api),
    responses: [version, session, event],
  })
}

export async function rejectMockVersionViaApi(input: {
  projectId: string
  editSessionId: string
  versionId?: string
  client?: ProjectEditSessionApiClient
}): Promise<ProjectEditSessionHistoryActionResult> {
  const api = clientFor(input.projectId, input.client)
  const version = await api.versions.save<{ version: ProjectEditSessionVersionRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    status: 'rejected',
    name: 'Rejected mock version',
    summary: 'Mock version rejected as state only. No render/progress started.',
    metadata: {
      sourceVersionId: input.versionId,
      rejectedStateOnly: true,
      noRenderStarted: true,
    },
  })
  const session = await api.sessions.update({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    patch: {
      approvalStatus: 'rejected',
      status: 'needs_review',
    },
  })
  const event = await api.events.append<{ event: ProjectEditSessionEventRecord }>({
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    eventType: 'mock_approval_state_changed',
    summary: 'Mock version rejected as state only; no progress, render, worker, provider, or credits started.',
    metadata: { versionId: dataRecord<{ version?: ProjectEditSessionVersionRecord }>(version)?.version?.id },
  })
  return actionResult({
    ok: version.ok && session.ok && event.ok,
    actionLabel: 'Mock version rejected',
    historyPackage: await loadHistoryAfterAction(input.projectId, input.editSessionId, api),
    responses: [version, session, event],
  })
}
