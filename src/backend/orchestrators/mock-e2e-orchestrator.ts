import type { ApprovedGenerationState, ChatNativePlanningState } from '../backend-types'
import type { MockDatabase } from '../mock/mock-database'
import { MOCK_USER_ID } from '../mock/mock-service-data'
import { createPreviewReadyCard, sendUserMessage } from '../services/chat-editor-service'
import { approveCreditEstimate, createCreditWallet, grantWeeklyBonusCredits, reserveCredits } from '../services/credit-service'
import { approveEditPlan } from '../services/edit-plan-service'
import { createGeneratedAsset, createGeneratedAssetTimingMap, createGenerationProviderPlaceholder, createGenerationRequest, createGenerationRequestInputs, markGenerationCompleted, markGenerationQueued } from '../services/generation-service'
import { advanceJobStatus, createJob, createJobBatch, createJobDependency } from '../services/job-orchestration-service'
import { markProjectGenerating, markProjectPreviewReady } from '../services/project-service'
import { createExportPlaceholder, createPreviewRender, createPreviewReview, createQAReport, createRenderJob, createRenderJobInputs, markRenderReady, markRenderRunning } from '../services/render-preview-service'
import { createRevisionRequest, createRevisionRequestItems } from '../services/revision-service'
import { ok, type ServiceResult, unwrapServiceResult } from '../service-result'

export function runMockApprovedGenerationFlow(
  db: MockDatabase,
  planningState: ChatNativePlanningState,
): ServiceResult<ApprovedGenerationState> {
  const { project, chatSession, editPlan, creditEstimate, strokeMotionPlan } = planningState
  const approvedPlan = unwrapServiceResult(approveEditPlan(db, editPlan.id, MOCK_USER_ID))
  const wallet = unwrapServiceResult(createCreditWallet(db, project.workspaceId, MOCK_USER_ID))

  unwrapServiceResult(grantWeeklyBonusCredits(db, wallet.id, 100))

  const creditApproval = unwrapServiceResult(
    approveCreditEstimate(db, {
      workspaceId: project.workspaceId,
      projectId: project.id,
      creditEstimateId: creditEstimate.id,
      approvedByUserId: MOCK_USER_ID,
    }),
  )
  const creditReservation = unwrapServiceResult(
    reserveCredits(db, {
      workspaceId: project.workspaceId,
      projectId: project.id,
      creditWalletId: wallet.id,
      creditEstimateId: creditEstimate.id,
      creditApprovalId: creditApproval.id,
    }),
  )

  unwrapServiceResult(markProjectGenerating(db, project.id))

  const jobBatch = unwrapServiceResult(
    createJobBatch(db, {
      workspaceId: project.workspaceId,
      projectId: project.id,
      chatSessionId: chatSession.id,
      editPlanId: approvedPlan.id,
      creditEstimateId: creditEstimate.id,
      creditReservationId: creditReservation.id,
      batchName: 'Mock approved generation pipeline',
    }),
  )
  const transcriptionJob = unwrapServiceResult(createJob(db, createJobInput(project.workspaceId, project.id, jobBatch.id, approvedPlan.id, creditEstimate.id, creditReservation.id, 'transcription')))
  const mediaJob = unwrapServiceResult(createJob(db, createJobInput(project.workspaceId, project.id, jobBatch.id, approvedPlan.id, creditEstimate.id, creditReservation.id, 'media_analysis')))
  const planningJob = unwrapServiceResult(createJob(db, createJobInput(project.workspaceId, project.id, jobBatch.id, approvedPlan.id, creditEstimate.id, creditReservation.id, 'edit_quality_planning')))
  const strokeJob = unwrapServiceResult(createJob(db, createJobInput(project.workspaceId, project.id, jobBatch.id, approvedPlan.id, creditEstimate.id, creditReservation.id, 'stroke_motion_planning')))
  const generationJob = unwrapServiceResult(createJob(db, createJobInput(project.workspaceId, project.id, jobBatch.id, approvedPlan.id, creditEstimate.id, creditReservation.id, 'stroke_motion_generation')))
  const renderJobRecord = unwrapServiceResult(createJob(db, createJobInput(project.workspaceId, project.id, jobBatch.id, approvedPlan.id, creditEstimate.id, creditReservation.id, 'render_preview')))
  const qaJob = unwrapServiceResult(createJob(db, createJobInput(project.workspaceId, project.id, jobBatch.id, approvedPlan.id, creditEstimate.id, creditReservation.id, 'quality_check')))

  unwrapServiceResult(createJobDependency(db, mediaJob.id, transcriptionJob.id, project.workspaceId, project.id))
  unwrapServiceResult(createJobDependency(db, planningJob.id, mediaJob.id, project.workspaceId, project.id))
  unwrapServiceResult(createJobDependency(db, strokeJob.id, planningJob.id, project.workspaceId, project.id))
  unwrapServiceResult(createJobDependency(db, generationJob.id, strokeJob.id, project.workspaceId, project.id))
  unwrapServiceResult(createJobDependency(db, renderJobRecord.id, generationJob.id, project.workspaceId, project.id))
  unwrapServiceResult(createJobDependency(db, qaJob.id, renderJobRecord.id, project.workspaceId, project.id))

  ;[transcriptionJob, mediaJob, planningJob, strokeJob, generationJob, renderJobRecord, qaJob].forEach((job) => {
    unwrapServiceResult(advanceJobStatus(db, job.id, 'completed', 100, `${job.jobName ?? job.jobType} completed in mock flow.`))
  })

  unwrapServiceResult(createGenerationProviderPlaceholder(db, 'svg_renderer'))
  const generationRequest = unwrapServiceResult(
    createGenerationRequest(db, {
      workspaceId: project.workspaceId,
      projectId: project.id,
      editPlanId: approvedPlan.id,
      creditEstimateId: creditEstimate.id,
      creditReservationId: creditReservation.id,
      strokeMotionPlanId: strokeMotionPlan?.id,
    }),
  )

  unwrapServiceResult(createGenerationRequestInputs(db, generationRequest.id))
  unwrapServiceResult(markGenerationQueued(db, generationRequest.id))
  const completedGenerationRequest = unwrapServiceResult(markGenerationCompleted(db, generationRequest.id))
  const generatedAsset = unwrapServiceResult(createGeneratedAsset(db, completedGenerationRequest.id))

  unwrapServiceResult(createGeneratedAssetTimingMap(db, generatedAsset.id))

  const renderJob = unwrapServiceResult(
    createRenderJob(db, {
      workspaceId: project.workspaceId,
      projectId: project.id,
      editPlanId: approvedPlan.id,
      creditEstimateId: creditEstimate.id,
      creditReservationId: creditReservation.id,
    }),
  )

  unwrapServiceResult(createRenderJobInputs(db, renderJob.id))
  unwrapServiceResult(markRenderRunning(db, renderJob.id))
  const completedRenderJob = unwrapServiceResult(markRenderReady(db, renderJob.id))
  const previewRender = unwrapServiceResult(createPreviewRender(db, completedRenderJob.id))

  unwrapServiceResult(createPreviewReview(db, previewRender.id))
  const qaReport = unwrapServiceResult(createQAReport(db, previewRender.id))
  const revision = unwrapServiceResult(
    createRevisionRequest(db, {
      workspaceId: project.workspaceId,
      projectId: project.id,
      editPlanId: approvedPlan.id,
      renderId: previewRender.id,
      requestedChange: 'Mock placeholder revision from chat review.',
    }),
  )

  unwrapServiceResult(createRevisionRequestItems(db, revision.id))
  unwrapServiceResult(createExportPlaceholder(db, {
    workspaceId: project.workspaceId,
    projectId: project.id,
    renderId: previewRender.id,
    requestedByUserId: MOCK_USER_ID,
  }))

  const assistantPreviewMessage = unwrapServiceResult(
    sendUserMessage(db, {
      projectId: project.id,
      chatSessionId: chatSession.id,
      role: 'assistant',
      content: 'Mock preview is ready for review in chat.',
    }),
  )

  unwrapServiceResult(
    createPreviewReadyCard(db, chatSession.id, assistantPreviewMessage.id, project.id, {
      renderId: previewRender.id,
      qaReportId: qaReport.id,
      revisionRequestId: revision.id,
    }),
  )
  unwrapServiceResult(markProjectPreviewReady(db, project.id, previewRender.id))

  return ok({
    ...planningState,
    editPlan: approvedPlan,
    creditReservation,
    generationRequest: completedGenerationRequest,
    generatedAsset,
    renderJob: completedRenderJob,
    previewRender,
    qaReport,
    previewReady: previewRender.status === 'ready' && qaReport.status === 'passed',
  })
}

function createJobInput(
  workspaceId: string,
  projectId: string,
  jobBatchId: string,
  editPlanId: string,
  creditEstimateId: string,
  creditReservationId: string,
  jobType: Parameters<typeof createJob>[1]['jobType'],
): Parameters<typeof createJob>[1] {
  return {
    workspaceId,
    projectId,
    jobBatchId,
    editPlanId,
    creditEstimateId,
    creditReservationId,
    jobType,
  }
}
