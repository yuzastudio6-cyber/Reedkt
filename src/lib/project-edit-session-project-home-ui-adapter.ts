import type {
  ProjectEditSessionRecord,
  ProjectEditSessionCardModel,
  ProjectEditSessionCardShape,
  ProjectEditSessionStatus,
} from '../types/project-edit-session'
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
import {
  restoreFinalExportResult,
  restorePreviewResult,
  restorePreviewReviewResult,
  restoreProfessionalQAResult,
} from './project-edit-session-lifecycle-checkpoint-ui-adapter'
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
  progressLabel: string
  progressAccent: 'muted' | 'cyan' | 'success' | 'warning'
  progressItems: ProjectEditSessionHomeProgressItem[]
  messageCount: number
  revisionCount: number
  versionCount: number
  lastEditedLabel: string
  latestPreviewLabel: string
  mockOnly: true
}

export type ProjectEditSessionHomeProgressItem = {
  id: string
  label: string
  complete: boolean
  detail: string
}

export type ProjectEditSessionHomeDetailViewModel = {
  editSessionId: string
  title: string
  summaryLines: string[]
  latestStatus: string
  sourceCount: number
  selectedPreferenceSummary: string
  sourceNotesSummary: string
  latestPreviewLabel: string
  readinessLabel: string
  progressItems: ProjectEditSessionHomeProgressItem[]
  artifactSummaryLines: string[]
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

function objectValue(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function createBackendLocalReadiness(session: ProjectEditSessionRecord): {
  artifactSummaryLines: string[]
  latestPreviewLabel: string
  progressAccent: ProjectEditSessionHomeCardViewModel['progressAccent']
  progressItems: ProjectEditSessionHomeProgressItem[]
  progressLabel: string
} {
  const metadata = session.metadata ?? {}
  const sourceUpload = objectValue(metadata.backendLocalSourceUpload)
  const brief = objectValue(metadata.backendLocalBrief)
  const plan = objectValue(metadata.backendLocalPlan)
  const latestCheckpoint = objectValue(metadata.latestBackendLocalCheckpoint)
  const checkpointStage = backendLocalCheckpointStage(stringValue(latestCheckpoint?.checkpointKind), session.status)
  const preview = checkpointStage >= 4 ? restorePreviewResult(session) : undefined
  const previewReview = checkpointStage >= 5 ? restorePreviewReviewResult(session) : undefined
  const professionalQA = checkpointStage >= 6 ? restoreProfessionalQAResult(session) : undefined
  const finalExport = checkpointStage >= 7 ? restoreFinalExportResult(session) : undefined
  const sourceReady = Boolean(sourceUpload)
  const briefReady = Boolean(brief)
  const planApproved = Boolean(plan) && session.approvalStatus === 'approved'
  const previewReady = preview?.status === 'preview_ready' || session.status === 'preview_ready' || session.status === 'final_export_ready'
  const previewReviewed = previewReview?.reviewStatus === 'approved'
  const qaPassed = professionalQA?.status === 'passed' || finalExport?.professionalQA?.status === 'passed'
  const finalExportReady = finalExport?.status === 'final_export_ready' || session.status === 'final_export_ready'

  const progressItems: ProjectEditSessionHomeProgressItem[] = [
    {
      id: 'source_attached',
      label: 'Source attached',
      complete: sourceReady,
      detail: sourceReady
        ? `${stringValue(sourceUpload?.fileName) ?? 'Source video'} is attached to this edit.`
        : 'Add a source video inside the edit workspace.',
    },
    {
      id: 'brief_saved',
      label: 'Direction saved',
      complete: briefReady,
      detail: briefReady ? 'Optional edit direction has been saved for this edit.' : 'Optional: save direction, or approve the plan with the default professional direction.',
    },
    {
      id: 'plan_approved',
      label: 'Plan approved',
      complete: planApproved,
      detail: planApproved ? 'The local edit plan and credit estimate were approved.' : 'Approve the plan and credit estimate before preview.',
    },
    {
      id: 'preview_reviewed',
      label: 'Preview reviewed',
      complete: previewReviewed,
      detail: previewReviewed ? 'The internal preview was reviewed and accepted.' : previewReady ? 'Review the preview before QA.' : 'Create the internal preview first.',
    },
    {
      id: 'qa_passed',
      label: 'QA passed',
      complete: qaPassed,
      detail: qaPassed ? 'Professional QA passed for the reviewed preview.' : 'Run the professional QA check before final export.',
    },
    {
      id: 'private_export_ready',
      label: 'Private export ready',
      complete: finalExportReady,
      detail: finalExportReady ? 'A private final export is ready for internal review.' : 'Final export stays locked until preview review and QA pass.',
    },
  ]

  const outputObjectPath = stringValue(finalExport?.outputObjectPath) ?? stringValue(preview?.outputObjectPath)
  const checksum = stringValue(finalExport?.checksumSha256) ?? stringValue(preview?.checksumSha256)
  const sizeBytes = typeof finalExport?.sizeBytes === 'number' ? finalExport.sizeBytes : preview?.sizeBytes
  const artifactSummaryLines = [
    finalExportReady
      ? 'Private final export is ready for internal review; public delivery remains a separate approval gate.'
      : previewReady
        ? 'Internal preview evidence is available; final export remains gated.'
        : 'No preview or export artifact has been recorded yet.',
    outputObjectPath ? `Private artifact path: ${outputObjectPath}` : 'No private artifact path recorded yet.',
    checksum ? `Checksum recorded: ${checksum.slice(0, 16)}...` : 'No checksum recorded yet.',
    typeof sizeBytes === 'number' ? `Artifact size: ${new Intl.NumberFormat('en-US').format(sizeBytes)} bytes.` : 'No artifact size recorded yet.',
  ]

  if (finalExportReady) {
    return {
      artifactSummaryLines,
      latestPreviewLabel: 'Private export ready',
      progressAccent: 'success',
      progressItems,
      progressLabel: 'Private export ready',
    }
  }

  if (qaPassed) {
    return {
      artifactSummaryLines,
      latestPreviewLabel: 'Preview reviewed',
      progressAccent: 'cyan',
      progressItems,
      progressLabel: 'QA passed',
    }
  }

  if (previewReviewed) {
    return {
      artifactSummaryLines,
      latestPreviewLabel: 'Preview reviewed',
      progressAccent: 'cyan',
      progressItems,
      progressLabel: 'Preview reviewed',
    }
  }

  if (previewReady) {
    return {
      artifactSummaryLines,
      latestPreviewLabel: 'Preview ready',
      progressAccent: 'cyan',
      progressItems,
      progressLabel: 'Preview ready',
    }
  }

  if (planApproved) {
    return {
      artifactSummaryLines,
      latestPreviewLabel: 'No preview yet',
      progressAccent: 'warning',
      progressItems,
      progressLabel: 'Plan approved',
    }
  }

  if (briefReady) {
    return {
      artifactSummaryLines,
      latestPreviewLabel: 'No preview yet',
      progressAccent: 'warning',
      progressItems,
      progressLabel: 'Direction saved',
    }
  }

  if (sourceReady) {
    return {
      artifactSummaryLines,
      latestPreviewLabel: 'No preview yet',
      progressAccent: 'warning',
      progressItems,
      progressLabel: 'Source attached',
    }
  }

  return {
    artifactSummaryLines,
    latestPreviewLabel: 'No preview yet',
    progressAccent: 'muted',
    progressItems,
    progressLabel: 'Setup needed',
  }
}

function backendLocalCheckpointStage(checkpointKind: string | undefined, status: ProjectEditSessionStatus): number {
  if (checkpointKind === 'setup_reset') return 0
  if (checkpointKind === 'source_uploaded') return 1
  if (checkpointKind === 'brief_draft_changed') return status === 'setup_ready' ? 1 : 0
  if (checkpointKind === 'brief_saved') return 2
  if (checkpointKind === 'plan_approved') return 3
  if (checkpointKind === 'preview_ready') return 4
  if (checkpointKind === 'preview_reviewed') return 5
  if (checkpointKind === 'professional_qa_checked') return 6
  if (checkpointKind === 'final_export_ready') return 7
  if (status === 'final_export_ready') return 7
  if (status === 'preview_ready') return 4
  if (status === 'approved') return 3
  if (status === 'awaiting_approval') return 2
  if (status === 'setup_ready') return 1
  return 0
}

export function createProjectHomeTitle(projectId: string): string {
  if (projectId === MOCK_PROJECT_HOME_PROJECT_ID) return 'ReEditPro Demo Project'
  return titleCase(projectId)
}

export function createNewEditSessionPlaceholderModel(): NewEditSessionPlaceholderModel {
  return {
    title: 'Create a new edit',
    body: 'Use + New Edit to create a browser-session edit, then open the clean edit workspace.',
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
    progressAccent: latestPreviewLabel === 'Mock preview ready' ? 'cyan' : 'muted',
    progressItems: [],
    progressLabel: latestPreviewLabel === 'Mock preview ready' ? 'Preview ready' : 'Setup needed',
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
  const readiness = createBackendLocalReadiness(session)
  const card = createProjectEditSessionHomeCardViewModel({
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

  return {
    ...card,
    badgeLabels: Array.from(new Set([
      ...card.badgeLabels,
      readiness.progressLabel,
      readiness.progressItems.every((item) => item.complete) ? 'Internal review ready' : 'Continue edit setup',
    ])),
    latestPreviewLabel: readiness.latestPreviewLabel,
    progressAccent: readiness.progressAccent,
    progressItems: readiness.progressItems,
    progressLabel: readiness.progressLabel,
  }
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
    selectedPreferenceSummary,
    sourceNotesSummary,
    latestPreviewLabel: latestPreview
      ? `${statusLabel(latestPreview.status)} (${latestPreview.aspectRatio})`
      : 'Preview placeholder only',
    readinessLabel: latestPreview ? 'Preview ready' : 'Setup needed',
    progressItems: [],
    artifactSummaryLines: latestPreview
      ? [`Preview artifact: ${latestPreview.previewUrl ?? 'mock preview record'}`]
      : ['No preview or export artifact has been recorded yet.'],
    memorySummary,
    versionSummary: latestVersion
      ? `Latest version v${latestVersion.versionNumber}: ${statusLabel(latestVersion.status)}`
      : 'No versions yet.',
    revisionSummary: latestRevision
      ? `${latestRevision.summary} Approval reset: ${latestRevision.resetsApproval ? 'yes' : 'no'}.`
      : 'No revisions requested.',
    eventSummary: latestEvent ? `${statusLabel(latestEvent.eventType)}: ${latestEvent.summary}` : 'No event records yet.',
    openChatLabel: 'Open edit',
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
  const latestCheckpoint = typeof metadata.latestBackendLocalCheckpoint === 'object' && metadata.latestBackendLocalCheckpoint
    ? metadata.latestBackendLocalCheckpoint as { checkpointKind?: string; recordedAt?: string; status?: string }
    : undefined
  const readiness = createBackendLocalReadiness(session)

  return {
    editSessionId: session.id,
    title: session.name,
    summaryLines: [
      'Backend-local edit session read back from the project route.',
      readiness.progressItems.every((item) => item.complete)
        ? 'This edit has source, brief, approval, preview review, QA, and private export evidence recorded.'
        : `Current edit progress: ${readiness.progressLabel}.`,
      latestCheckpoint?.checkpointKind
        ? `Latest checkpoint: ${statusLabel(latestCheckpoint.checkpointKind)}${latestCheckpoint.recordedAt ? ` at ${formatLastEdited(latestCheckpoint.recordedAt)}` : ''}.`
        : 'No backend-local lifecycle checkpoint has been recorded yet.',
      noUploadStarted
        ? 'No source video has been uploaded for this edit yet.'
        : 'Source/upload state is handled inside the edit brief workspace.',
      noPlanApproved
        ? 'No edit plan has been approved yet.'
        : 'Plan state is handled by the edit brief approval gate.',
    ],
    latestStatus: statusLabel(session.status),
    sourceCount: session.sourceMediaAssetIds.length,
    selectedPreferenceSummary: session.selectedEditPreferenceHandle
      ? `${session.selectedEditPreferenceHandle} selected; setup continues in the edit workspace.`
      : 'No saved Edit Preference selected.',
    sourceNotesSummary: sourceNotes.length
      ? `${sourceNotes.length} metadata-only source note(s) captured.`
      : 'No source notes yet.',
    latestPreviewLabel: readiness.latestPreviewLabel,
    readinessLabel: readiness.progressLabel,
    progressItems: readiness.progressItems,
    artifactSummaryLines: readiness.artifactSummaryLines,
    memorySummary: 'Backend-local edit session metadata only; memory layers are created later in the edit workspace.',
    versionSummary: 'No versions yet.',
    revisionSummary: 'No revisions requested.',
    eventSummary: 'Backend-local edit session list/readback only.',
    openChatLabel: 'Open edit',
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
    projectContext: 'Project Home for clean edit workspaces. Project remains the workspace container.',
    mockLabel: 'Internal testing only',
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
