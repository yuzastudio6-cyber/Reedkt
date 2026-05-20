import type {
  ExportRecord,
  PreviewReviewRecord,
  QAReportItem,
  QAReportRecord,
  RenderJobInputRecord,
  RenderJobRecord,
  RenderRecord,
  RenderTimingManifestRecord,
  RenderTimingWorkerInputRecord,
} from '../../types'
import type { CreateRenderJobRequest } from '../contracts/render-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'

export function createRenderJob(
  db: MockDatabase,
  input: CreateRenderJobRequest,
): ServiceResult<RenderJobRecord> {
  const editPlan = findMockRecord(db, 'editPlans', input.editPlanId)
  const reservation = input.creditReservationId
    ? findMockRecord(db, 'creditReservations', input.creditReservationId)
    : undefined

  if (!editPlan || editPlan.status !== 'approved') {
    return fail('PLAN_NOT_APPROVED', 'Render jobs require an approved edit plan.')
  }

  if (!reservation || reservation.status !== 'reserved') {
    return fail('CREDITS_NOT_RESERVED', 'Render jobs require reserved credits.')
  }

  const renderJob: RenderJobRecord = {
    id: createMockId('render-job'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    renderType: 'preview',
    status: 'queued',
    qualityLevel: 'preview',
    outputFormat: 'mp4',
    renderName: 'Mock preview render job',
    renderDescription: 'Composes source and generated assets into a preview placeholder.',
    inputAssetIds: db.generatedAssets.map((asset) => asset.id),
    renderSettings: {
      mockOnly: true,
      noFfmpegOrRemotionExecution: true,
    },
    timelineSpec: {
      generatedAssetsAreIntermediate: true,
    },
    width: 1080,
    height: 1920,
    frameRate: 30,
    durationSeconds: 18,
    estimatedCredits: 8,
    failureCategory: 'none',
    progressPercent: 0,
    queuedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { approvalAndReservationRequired: true },
  }

  return ok(insertMockRecord(db, 'renderJobs', renderJob))
}

export function createRenderPreviewTimingManifestLink(
  db: MockDatabase,
  input: {
    renderJobId: string
    renderTimingManifest: RenderTimingManifestRecord
    workerInput?: RenderTimingWorkerInputRecord
  },
): ServiceResult<RenderJobRecord> {
  const renderJob = findMockRecord(db, 'renderJobs', input.renderJobId)

  if (!renderJob) {
    return fail('RENDER_JOB_NOT_FOUND', `Render job ${input.renderJobId} was not found.`)
  }

  renderJob.timelineSpec = {
    ...(renderJob.timelineSpec ?? {}),
    renderTimingManifestId: input.renderTimingManifest.id,
    renderTimingWorkerInputId: input.workerInput?.id ?? '',
    renderTimingReadiness: input.workerInput?.readiness ?? (input.renderTimingManifest.readyForRender ? 'ready_for_future_render_worker' : 'not_ready'),
    noRenderingExecuted: true,
    mockOnly: true,
  }
  renderJob.metadata = {
    ...renderJob.metadata,
    renderTimingManifestId: input.renderTimingManifest.id,
    renderTimingWorkerInputId: input.workerInput?.id ?? '',
  }
  renderJob.updatedAt = nowIso()

  return ok(renderJob)
}

export function createRenderJobInputs(
  db: MockDatabase,
  renderJobId: string,
): ServiceResult<RenderJobInputRecord[]> {
  const renderJob = findMockRecord(db, 'renderJobs', renderJobId)

  if (!renderJob) {
    return fail('RENDER_JOB_NOT_FOUND', `Render job ${renderJobId} was not found.`)
  }

  const generatedInputs = db.generatedAssets.map((asset, index) =>
    insertMockRecord(db, 'renderJobInputs', {
      id: createMockId('render-input'),
      renderJobId,
      workspaceId: renderJob.workspaceId,
      projectId: renderJob.projectId,
      inputType: 'generated_asset',
      generatedAssetId: asset.id,
      timelineStartSeconds: index * 2,
      timelineEndSeconds: index * 2 + (asset.durationSeconds ?? 8),
      layerName: 'stroke-motion-overlay',
      zIndex: 10 + index,
      inputPayload: {
        generatedAssetsAreNotFinalRenders: true,
      },
      createdAt: nowIso(),
    }),
  )

  return ok(generatedInputs)
}

export function markRenderRunning(
  db: MockDatabase,
  renderJobId: string,
): ServiceResult<RenderJobRecord> {
  return updateRenderJobStatus(db, renderJobId, 'running', 40)
}

export function markRenderReady(
  db: MockDatabase,
  renderJobId: string,
): ServiceResult<RenderJobRecord> {
  return updateRenderJobStatus(db, renderJobId, 'completed', 100)
}

export function createPreviewRender(
  db: MockDatabase,
  renderJobId: string,
): ServiceResult<RenderRecord> {
  const renderJob = findMockRecord(db, 'renderJobs', renderJobId)

  if (!renderJob || renderJob.status !== 'completed') {
    return fail('RENDER_JOB_NOT_FOUND', 'Completed render job is required before preview render creation.')
  }

  const render: RenderRecord = {
    id: createMockId('render'),
    workspaceId: renderJob.workspaceId,
    projectId: renderJob.projectId,
    chatSessionId: renderJob.chatSessionId,
    editPlanId: renderJob.editPlanId,
    renderJobId,
    jobId: renderJob.jobId,
    renderType: 'preview',
    status: 'ready',
    qualityLevel: 'preview',
    outputFormat: 'mp4',
    displayName: 'Mock preview render',
    storageProvider: 'local_mock',
    storagePath: 'mock://renders/preview.mp4',
    publicUrl: 'mock://renders/preview.mp4',
    safePreviewUrl: 'mock://renders/preview.mp4',
    durationSeconds: renderJob.durationSeconds,
    width: renderJob.width,
    height: renderJob.height,
    frameRate: renderJob.frameRate,
    creditsSpent: 0,
    renderPayload: {
      mockOnly: true,
      generatedAssetsAreIntermediate: true,
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  renderJob.outputRenderId = render.id
  return ok(insertMockRecord(db, 'renders', render))
}

export function createPreviewReview(
  db: MockDatabase,
  renderId: string,
): ServiceResult<PreviewReviewRecord> {
  const render = findMockRecord(db, 'renders', renderId)

  if (!render) {
    return fail('RENDER_NOT_FOUND', `Render ${renderId} was not found.`)
  }

  const review: PreviewReviewRecord = {
    id: createMockId('preview-review'),
    workspaceId: render.workspaceId,
    projectId: render.projectId,
    chatSessionId: render.chatSessionId,
    renderId,
    editPlanId: render.editPlanId,
    status: 'pending',
    summary: 'Mock preview is ready for chat-native review.',
    reviewNote: 'User may approve, request changes, or reject in chat.',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'previewReviews', review))
}

export function createQAReport(
  db: MockDatabase,
  renderId: string,
): ServiceResult<QAReportRecord> {
  const render = findMockRecord(db, 'renders', renderId)

  if (!render) {
    return fail('RENDER_NOT_FOUND', `Render ${renderId} was not found.`)
  }

  const report: QAReportRecord = {
    id: createMockId('qa-report'),
    workspaceId: render.workspaceId,
    projectId: render.projectId,
    editPlanId: render.editPlanId,
    renderJobId: render.renderJobId,
    renderId: render.id,
    status: 'passed',
    overallScore: 94,
    summary: 'Mock QA passed for preview readiness.',
    requiresRetry: false,
    checkedBy: 'mock_quality_check_agent',
    qaPayload: {
      noRealRenderingChecked: true,
    },
    startedAt: nowIso(),
    completedAt: nowIso(),
    speechClarity: createQAReportItem('speech_clarity', 'Speech is clear.'),
    cutSmoothness: createQAReportItem('cut_smoothness', 'Cuts are clean.'),
    captionReadability: createQAReportItem('caption_readability', 'Captions avoid faces and overlays.'),
    musicBalance: createQAReportItem('music_balance', 'Music remains voice-first.'),
    sfxBalance: createQAReportItem('sfx_balance', 'SFX do not overpower speech.'),
    transitionQuality: createQAReportItem('transition_quality', 'Transitions are contextual.'),
    ambientConsistency: createQAReportItem('ambient_consistency', 'Room tone remains natural.'),
    storyFlow: createQAReportItem('story_flow', 'Story flow is understandable.'),
    signatureTiming: createQAReportItem('signature_timing', 'Signature overlay timing is aligned.'),
    creditCompliance: createQAReportItem('credit_compliance', 'Credits were reserved before render.'),
    userInstructionCompliance: createQAReportItem('user_instruction_compliance', 'User instructions are respected.'),
    overallSummary: 'Preview is mock-ready for chat review.',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  render.qaReportId = report.id
  return ok(insertMockRecord(db, 'qaReports', report))
}

export function createQAReportItems(report: QAReportRecord): QAReportItem[] {
  return [
    report.speechClarity,
    report.cutSmoothness,
    report.captionReadability,
    report.musicBalance,
    report.sfxBalance,
    report.transitionQuality,
    report.ambientConsistency,
    report.storyFlow,
    report.signatureTiming,
    report.creditCompliance,
    report.userInstructionCompliance,
  ]
}

export function createExportPlaceholder(
  db: MockDatabase,
  input: {
    workspaceId: string
    projectId: string
    renderId: string
    requestedByUserId: string
  },
): ServiceResult<ExportRecord> {
  const render = findMockRecord(db, 'renders', input.renderId)

  if (!render || render.status !== 'ready') {
    return fail('RENDER_NOT_FOUND', 'Ready preview render is required before creating an export placeholder.')
  }

  const exportRecord: ExportRecord = {
    id: createMockId('export'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    renderId: input.renderId,
    editPlanId: render.editPlanId,
    status: 'draft',
    exportPlatform: 'custom',
    exportFormat: 'mp4',
    displayName: 'Mock final export placeholder',
    exportSettings: {
      requiresPreviewApproval: true,
      requiresQaReadiness: true,
    },
    storageProvider: 'local_mock',
    storagePath: 'mock://exports/final-export-placeholder.mp4',
    requestedByUserId: input.requestedByUserId,
    requestedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true },
  }

  return ok(insertMockRecord(db, 'exports', exportRecord))
}

function updateRenderJobStatus(
  db: MockDatabase,
  renderJobId: string,
  status: RenderJobRecord['status'],
  progressPercent: number,
): ServiceResult<RenderJobRecord> {
  const renderJob = findMockRecord(db, 'renderJobs', renderJobId)

  if (!renderJob) {
    return fail('RENDER_JOB_NOT_FOUND', `Render job ${renderJobId} was not found.`)
  }

  renderJob.status = status
  renderJob.progressPercent = progressPercent
  renderJob.updatedAt = nowIso()

  if (status === 'running') {
    renderJob.startedAt = nowIso()
  }

  if (status === 'completed') {
    renderJob.completedAt = nowIso()
  }

  return ok(renderJob)
}

function createQAReportItem(checkType: QAReportItem['checkType'], summary: string): QAReportItem {
  return {
    id: createMockId('qa-report-item'),
    checkType,
    status: 'passed',
    score: 94,
    summary,
    blocker: false,
    requiresRetry: false,
  }
}
