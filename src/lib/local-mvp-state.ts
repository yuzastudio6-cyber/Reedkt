import { callMockReeditProApi } from '../backend/api/frontend-api-client'
import { createUploadPlan } from '../backend/storage/upload-plan-service'
import { getSupabaseClientStatus } from '../backend/supabase/supabase-client'
import { runMockCreditReservationFlow } from '../backend/orchestrators/mock-credit-runtime-orchestrator'
import type { ApiResponseEnvelope } from '../backend/api/api-runtime-contracts'
import type { ClipSource, EditingCategory } from '../types/reeditpro'
import type { UploadFileLike, UploadPlan, UploadPlanResult } from '../types/upload'
import type { CreditReservationRecord } from '../types'
import type { JobRuntimeEvent, JobRuntimeQueueItem } from '../types/job-runtime'

const LOCAL_MVP_STORAGE_KEY = 'reeditpro.localMvpSession.v1'
export const LOCAL_MVP_SESSION_EVENT = 'reeditpro:local-mvp-session-updated'

export type LocalMvpProjectStatus =
  | 'draft'
  | 'upload_planned'
  | 'planning'
  | 'plan_ready'
  | 'approved'
  | 'mock_running'
  | 'preview_ready'
  | 'blocked'

export interface LocalMvpUploadAsset {
  id: string
  uploadedOrder: number
  fileName: string
  mimeType: string
  fileSizeBytes: number
  uploadPlan?: UploadPlan
  warnings: string[]
}

export interface LocalMvpApprovalState {
  sourceOrderConfirmed: boolean
  aspectRatioConfirmed: boolean
  cleanupConfirmed: boolean
  editLevelConfirmed: boolean
  visualPreferenceConfirmed: boolean
  planApproved: boolean
  creditsApproved: boolean
  approvedAt?: string
  approvedSnapshotVersion?: string
}

export interface LocalMvpRuntimeState {
  creditReservationId?: string
  reservedCredits?: number
  creditGateMessage?: string
  jobId?: string
  queueStatus?: string
  leaseId?: string
  previewReady: boolean
  events: string[]
  warnings: string[]
  updatedAt: string
}

export interface LocalMvpProject {
  id: string
  name: string
  editingCategory: EditingCategory
  workspaceId: string
  userId: string
  createdAt: string
  updatedAt: string
  status: LocalMvpProjectStatus
  sourceClips: ClipSource[]
  uploadAssets: LocalMvpUploadAsset[]
  customInstructions?: string
  warnings: string[]
  approvals: LocalMvpApprovalState
  runtime?: LocalMvpRuntimeState
}

export interface LocalMvpSession {
  user: {
    id: string
    displayName: string
    email: string
  }
  workspace: {
    id: string
    name: string
  }
  projects: LocalMvpProject[]
  activeProjectId?: string
  updatedAt: string
}

export interface LocalMvpCreateProjectInput {
  name: string
  editingCategory: EditingCategory
  files: UploadFileLike[]
  customInstructions?: string
}

export interface LocalMvpRuntimeResult {
  ok: boolean
  project?: LocalMvpProject
  creditReservation?: CreditReservationRecord
  apiResponses: Array<ApiResponseEnvelope<unknown>>
  events: string[]
  warnings: string[]
  message: string
}

export function getDefaultLocalMvpSession(): LocalMvpSession {
  const now = nowIso()

  return {
    user: {
      id: 'local-demo-user',
      displayName: 'Tommy',
      email: 'demo@reeditpro.local',
    },
    workspace: {
      id: 'local-demo-workspace',
      name: "Tommy's Demo Workspace",
    },
    projects: [],
    updatedAt: now,
  }
}

export function loadLocalMvpSession(): LocalMvpSession {
  if (typeof window === 'undefined') return getDefaultLocalMvpSession()

  const raw = window.localStorage.getItem(LOCAL_MVP_STORAGE_KEY)
  if (!raw) return getDefaultLocalMvpSession()

  try {
    return {
      ...getDefaultLocalMvpSession(),
      ...JSON.parse(raw),
    }
  } catch {
    return getDefaultLocalMvpSession()
  }
}

export function saveLocalMvpSession(session: LocalMvpSession): LocalMvpSession {
  const next = {
    ...session,
    updatedAt: nowIso(),
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCAL_MVP_STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(LOCAL_MVP_SESSION_EVENT, { detail: next }))
  }

  return next
}

export function getLocalMvpProject(projectId?: string | null): LocalMvpProject | undefined {
  if (!projectId) return undefined
  return loadLocalMvpSession().projects.find((project) => project.id === projectId)
}

export function getMostRecentLocalMvpProject(): LocalMvpProject | undefined {
  const session = loadLocalMvpSession()
  const active = session.projects.find((project) => project.id === session.activeProjectId)
  return active ?? [...session.projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
}

export function createLocalMvpProject(input: LocalMvpCreateProjectInput): LocalMvpProject {
  const session = loadLocalMvpSession()
  const now = nowIso()
  const projectId = createLocalId('project')
  const uploadResults = createUploadPlansForFiles({
    files: input.files,
    projectId,
    userId: session.user.id,
    workspaceId: session.workspace.id,
  })
  const uploadAssets = uploadResults.map((result, index) => toLocalUploadAsset(result, input.files[index], index))
  const sourceClips = uploadAssets.map((asset, index) => toClipSource(asset, index))

  const project: LocalMvpProject = {
    id: projectId,
    name: input.name.trim() || 'Untitled ReeditPro edit',
    editingCategory: input.editingCategory,
    workspaceId: session.workspace.id,
    userId: session.user.id,
    createdAt: now,
    updatedAt: now,
    status: sourceClips.length > 0 ? 'upload_planned' : 'draft',
    sourceClips,
    uploadAssets,
    customInstructions: input.customInstructions,
    warnings: [
      ...uploadResults.flatMap((result) => result.warnings),
      ...(getSupabaseClientStatus().configured ? [] : ['Supabase env is missing; this project is running in local demo mode.']),
    ],
    approvals: createInitialApprovalState(),
  }

  saveLocalMvpSession({
    ...session,
    activeProjectId: project.id,
    projects: [project, ...session.projects.filter((candidate) => candidate.id !== project.id)],
  })

  return project
}

export function addLocalMvpFilesToProject(projectId: string, files: UploadFileLike[]): LocalMvpProject | undefined {
  const project = getLocalMvpProject(projectId)
  if (!project) return undefined

  const uploadResults = createUploadPlansForFiles({
    files,
    projectId,
    userId: project.userId,
    workspaceId: project.workspaceId,
    startOrder: project.sourceClips.length + 1,
  })
  const uploadAssets = uploadResults.map((result, index) => toLocalUploadAsset(result, files[index], project.sourceClips.length + index))
  const sourceClips = uploadAssets.map((asset, index) => toClipSource(asset, project.sourceClips.length + index))

  return updateLocalMvpProject(project.id, {
    sourceClips: normalizeClipOrder([...project.sourceClips, ...sourceClips]),
    uploadAssets: [...project.uploadAssets, ...uploadAssets],
    status: 'upload_planned',
    warnings: [...project.warnings, ...uploadResults.flatMap((result) => result.warnings)],
    approvals: {
      ...project.approvals,
      sourceOrderConfirmed: false,
      planApproved: false,
      creditsApproved: false,
      approvedAt: undefined,
      approvedSnapshotVersion: undefined,
    },
    runtime: undefined,
  })
}

export function updateLocalMvpProject(
  projectId: string,
  updates: Partial<Omit<LocalMvpProject, 'id' | 'createdAt'>>,
): LocalMvpProject | undefined {
  const session = loadLocalMvpSession()
  let updatedProject: LocalMvpProject | undefined
  const projects = session.projects.map((project) => {
    if (project.id !== projectId) return project

    updatedProject = {
      ...project,
      ...updates,
      updatedAt: nowIso(),
    }

    return updatedProject
  })

  if (!updatedProject) return undefined

  saveLocalMvpSession({
    ...session,
    activeProjectId: updatedProject.id,
    projects,
  })

  return updatedProject
}

export function updateLocalMvpProjectClips(projectId: string, sourceClips: ClipSource[]): LocalMvpProject | undefined {
  return updateLocalMvpProject(projectId, {
    sourceClips: normalizeClipOrder(sourceClips),
    status: 'planning',
    approvals: {
      ...(getLocalMvpProject(projectId)?.approvals ?? createInitialApprovalState()),
      sourceOrderConfirmed: false,
      planApproved: false,
      creditsApproved: false,
      approvedAt: undefined,
      approvedSnapshotVersion: undefined,
    },
    runtime: undefined,
  })
}

export function markLocalMvpApproval(
  projectId: string,
  approvals: Partial<LocalMvpApprovalState>,
): LocalMvpProject | undefined {
  const project = getLocalMvpProject(projectId)
  if (!project) return undefined

  return updateLocalMvpProject(projectId, {
    approvals: {
      ...project.approvals,
      ...approvals,
    },
    status: approvals.planApproved || approvals.creditsApproved ? 'approved' : project.status,
  })
}

export async function runLocalMvpApprovedRuntime(input: {
  projectId: string
  credits: number
  approvedSnapshotVersion?: string
}): Promise<LocalMvpRuntimeResult> {
  const project = getLocalMvpProject(input.projectId)

  if (!project) {
    return {
      ok: false,
      apiResponses: [],
      events: [],
      warnings: ['Local MVP project was not found.'],
      message: 'Project missing.',
    }
  }

  const blockingGate = getLocalMvpBlockingGate(project)
  if (blockingGate) {
    const blockedProject = updateLocalMvpProject(project.id, {
      status: 'blocked',
      runtime: {
        previewReady: false,
        events: [blockingGate],
        warnings: [blockingGate],
        updatedAt: nowIso(),
      },
    })

    return {
      ok: false,
      project: blockedProject,
      apiResponses: [],
      events: [blockingGate],
      warnings: [blockingGate],
      message: blockingGate,
    }
  }

  const reservationFlow = runMockCreditReservationFlow()
  const creditReservation = reservationFlow.reservation
  const apiResponses = await Promise.all([
    callMockReeditProApi('credits.gate.check'),
    callMockReeditProApi('jobs.queue'),
    callMockReeditProApi('worker.lease.claim'),
    callMockReeditProApi('worker.lease.heartbeat'),
    callMockReeditProApi('jobs.dispatch.mock'),
    callMockReeditProApi('worker.lease.complete'),
  ])

  const responseWarnings = apiResponses.flatMap((response) => response.warnings)
  const queueData = apiResponses[1]?.data as { queueItem?: JobRuntimeQueueItem; jobEvents?: JobRuntimeEvent[]; chatSummary?: string } | undefined
  const leaseData = apiResponses[2]?.data as { lease?: { id?: string }; jobEvents?: JobRuntimeEvent[] } | undefined
  const dispatchData = apiResponses[4]?.data as { jobEvents?: JobRuntimeEvent[]; chatSummary?: string; nextStep?: string } | undefined
  const completeData = apiResponses[5]?.data as { lease?: { id?: string }; jobEvents?: JobRuntimeEvent[] } | undefined
  const eventMessages = uniqueStrings([
    'Plan and credit estimate approved.',
    reservationFlow.creditGateResult.message,
    creditReservation
      ? `${creditReservation.reservedCredits} mock credits reserved.`
      : 'Mock credit reservation flow completed.',
    ...eventsToMessages(queueData?.jobEvents),
    ...eventsToMessages(leaseData?.jobEvents),
    ...eventsToMessages(dispatchData?.jobEvents),
    ...eventsToMessages(completeData?.jobEvents),
    dispatchData?.chatSummary,
    'Mock preview prepared. No real rendering or provider call was made.',
  ])
  const updatedProject = updateLocalMvpProject(project.id, {
    status: 'preview_ready',
    approvals: {
      ...project.approvals,
      planApproved: true,
      creditsApproved: true,
      approvedAt: nowIso(),
      approvedSnapshotVersion: input.approvedSnapshotVersion ?? project.approvals.approvedSnapshotVersion,
    },
    runtime: {
      creditReservationId: creditReservation?.id,
      reservedCredits: creditReservation?.reservedCredits ?? input.credits,
      creditGateMessage: reservationFlow.creditGateResult.message,
      jobId: queueData?.queueItem?.jobId,
      queueStatus: queueData?.queueItem?.queueStatus ?? 'completed',
      leaseId: leaseData?.lease?.id ?? completeData?.lease?.id,
      previewReady: true,
      events: eventMessages,
      warnings: uniqueStrings([...reservationFlow.warnings, ...responseWarnings]),
      updatedAt: nowIso(),
    },
  })

  return {
    ok: true,
    project: updatedProject,
    creditReservation,
    apiResponses,
    events: eventMessages,
    warnings: uniqueStrings([...reservationFlow.warnings, ...responseWarnings]),
    message: 'Local MVP mock runtime completed through reservation, queue, lease, dispatch, and preview-ready state.',
  }
}

export function getLocalMvpStatusSummary() {
  const session = loadLocalMvpSession()
  const activeProject = session.projects.find((project) => project.id === session.activeProjectId)
  const supabaseStatus = getSupabaseClientStatus()

  return {
    mode: supabaseStatus.configured ? 'supabase_optional' : 'local_demo',
    supabaseConfigured: supabaseStatus.configured,
    activeProject,
    projectCount: session.projects.length,
    message: supabaseStatus.configured
      ? 'Supabase public env is configured; local MVP still uses mock-safe runtime unless real routes are enabled.'
      : 'Local MVP demo mode is active. Supabase is optional and no remote writes will run.',
  }
}

function createUploadPlansForFiles(input: {
  files: UploadFileLike[]
  workspaceId: string
  projectId: string
  userId: string
  startOrder?: number
}): UploadPlanResult[] {
  return input.files.map((file, index) => {
    const uploadedOrder = (input.startOrder ?? 1) + index

    return createUploadPlan({
      assetId: createLocalId('asset'),
      file,
      purpose: 'source_media',
      projectId: input.projectId,
      requiresAuth: false,
      uploadedOrder,
      userId: input.userId,
      workspaceId: input.workspaceId,
    })
  })
}

function toLocalUploadAsset(result: UploadPlanResult, file: UploadFileLike | undefined, index: number): LocalMvpUploadAsset {
  const fallbackName = file?.name ?? `local-source-${index + 1}.mp4`
  const fallbackMime = file?.type || inferMimeType(fallbackName)

  return {
    id: result.uploadPlan?.id ?? createLocalId('asset'),
    uploadedOrder: result.uploadPlan?.uploadedOrder ?? index + 1,
    fileName: result.uploadPlan?.fileName ?? fallbackName,
    mimeType: result.uploadPlan?.mimeType ?? fallbackMime,
    fileSizeBytes: result.uploadPlan?.fileSizeBytes ?? file?.size ?? 0,
    uploadPlan: result.uploadPlan,
    warnings: result.warnings,
  }
}

function toClipSource(asset: LocalMvpUploadAsset, index: number): ClipSource {
  return {
    id: asset.id,
    uploadedOrder: index + 1,
    fileName: asset.fileName,
    duration: estimateDuration(asset.fileSizeBytes, index),
    detectedType: detectLocalSourceType(asset),
    notes: asset.uploadPlan
      ? `Local MVP upload plan: ${asset.uploadPlan.bucketName}/${asset.uploadPlan.objectPath}`
      : 'Local MVP file metadata only; no upload was attempted.',
    isImportant: index === 0,
    sourceRole: index === 0 ? 'hook_candidate' : 'context',
    previewLabel: 'Local file',
    thumbnailHint: asset.mimeType.startsWith('audio/') ? 'Audio asset' : 'Browser-selected source',
  }
}

function normalizeClipOrder(clips: ClipSource[]) {
  return clips.map((clip, index) => ({
    ...clip,
    uploadedOrder: index + 1,
  }))
}

function getLocalMvpBlockingGate(project: LocalMvpProject): string | undefined {
  if (!project.approvals.sourceOrderConfirmed) return 'Local MVP blocked: confirm source order before approval.'
  if (!project.approvals.aspectRatioConfirmed) return 'Local MVP blocked: confirm output frame before approval.'
  if (!project.approvals.cleanupConfirmed) return 'Local MVP blocked: confirm source cleanup before approval.'
  if (!project.approvals.editLevelConfirmed) return 'Local MVP blocked: confirm edit level before approval.'
  if (!project.approvals.visualPreferenceConfirmed) return 'Local MVP blocked: confirm visual preference before approval.'
  return undefined
}

function eventsToMessages(events: JobRuntimeEvent[] | undefined): string[] {
  return events?.map((event) => event.message).filter(Boolean) ?? []
}

function createInitialApprovalState(): LocalMvpApprovalState {
  return {
    sourceOrderConfirmed: false,
    aspectRatioConfirmed: false,
    cleanupConfirmed: false,
    editLevelConfirmed: false,
    visualPreferenceConfirmed: false,
    planApproved: false,
    creditsApproved: false,
  }
}

function detectLocalSourceType(asset: LocalMvpUploadAsset): string {
  if (asset.mimeType.startsWith('audio/')) return 'Local audio source'
  if (/b.?roll|detail|cutaway/i.test(asset.fileName)) return 'Local b-roll/support clip'
  if (/hook|intro|open/i.test(asset.fileName)) return 'Local opening clip'
  if (/end|outro|close|cta/i.test(asset.fileName)) return 'Local ending clip'
  return asset.mimeType.startsWith('video/') ? 'Local source video' : 'Local source asset'
}

function estimateDuration(fileSizeBytes: number, index: number): string {
  const seconds = Math.max(6, Math.min(45, Math.round(fileSizeBytes / 8_000_000) + 8 + index))
  return `00:${String(seconds).padStart(2, '0')}`
}

function inferMimeType(fileName: string): string {
  if (/\.mov$/i.test(fileName)) return 'video/quicktime'
  if (/\.webm$/i.test(fileName)) return 'video/webm'
  if (/\.mp3$/i.test(fileName)) return 'audio/mpeg'
  if (/\.wav$/i.test(fileName)) return 'audio/wav'
  return 'video/mp4'
}

function createLocalId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter(Boolean) as string[])]
}

function nowIso(): string {
  return new Date().toISOString()
}
