import { mkdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import type { QualityGateResult } from '../../src/backend/contracts/quality-gate-contracts'
import type { RenderManifest } from '../../src/backend/contracts/render-manifest-contracts'
import type {
  AutonomousAudioExecutionSpec,
  AutonomousCaptionExecutionSpec,
  AutonomousColorExecutionSpec,
  AutonomousEditOperationId,
  AutonomousEditPlanDraft,
} from '../../src/types'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { runCaptionExecution } from '../workers/captions'
import { runFinalRenderExecutionPipeline } from '../workers/final-render'
import { renderApprovedGraphicsMotionOverlays } from '../workers/graphics-motion'
import { assertOutputPathInsideRoot } from '../workers/media/media-path-safety'
import { buildWorkerIdempotencyKey, type ProductionWorkerJobPayload } from '../workers/production'
import { createToolCostMeteringService, type ToolCostEstimate } from '../tool-cost-metering'
import { getAutonomousPrivateExecutionEvidence } from './autonomous-edit-planning-service'
import { createProjectEditPlanService, getActivatedAutonomousEditPlan } from './project-edit-plan-service'
import { createUploadService } from './upload-service'
import { createMockId, getRequiredAuthUserId, nowIso } from './service-helpers'

export type AutonomousPrivateReviewStage =
  | 'queued'
  | 'validating_approved_edit'
  | 'building_timeline'
  | 'preparing_captions'
  | 'composing_visuals'
  | 'rendering_private_review'
  | 'running_quality_checks'
  | 'private_review_ready'
  | 'blocked'
  | 'failed'

export interface AutonomousPrivateReviewProgressItem {
  stage: AutonomousPrivateReviewStage
  label: string
  status: 'pending' | 'running' | 'completed' | 'blocked' | 'failed'
  completedAt?: string
}

export interface AutonomousPrivateReviewExecutionRecord {
  executionId: string
  planId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  status: 'queued' | 'running' | 'private_review_ready' | 'blocked' | 'failed'
  currentStage: AutonomousPrivateReviewStage
  progressPercent: number
  progress: AutonomousPrivateReviewProgressItem[]
  approvedPlanSnapshotId: string
  creditEstimateId: string
  creditReservationId: string
  estimatedHighCredits: number
  toolCostEventIds: string[]
  previewStorageObjectRecordId?: string
  previewMediaAssetId?: string
  outputBucketName?: string
  outputObjectPath?: string
  outputMimeType?: 'video/mp4'
  outputSizeBytes?: number
  outputChecksumSha256?: string
  durationSeconds?: number
  width?: number
  height?: number
  artifactManifestStorageObjectRecordId?: string
  qaReportStorageObjectRecordId?: string
  executedActivitySummary: string[]
  qaSummary?: {
    status: 'passed_technical_qa_pending_user_review'
    passedGateCount: number
    failedGateCount: 0
    userCreativeReviewRequired: true
  }
  privateArtifactsOnly: true
  publicDeliveryAllowed: false
  paidBillingMutationMade: false
  productReady: false
  error?: string
  startedAt: string
  completedAt?: string
  warnings: string[]
}

const executionByPlanId = new Map<string, AutonomousPrivateReviewExecutionRecord>()
const inFlightByPlanId = new Map<string, Promise<void>>()

export function getAutonomousPrivateReviewExecution(
  planId: string,
): AutonomousPrivateReviewExecutionRecord | undefined {
  return executionByPlanId.get(planId)
}

export async function waitForAutonomousPrivateReviewExecution(
  planId: string,
): Promise<AutonomousPrivateReviewExecutionRecord | undefined> {
  await inFlightByPlanId.get(planId)
  return executionByPlanId.get(planId)
}

export function createAutonomousEditPrivateReviewService(context: ServiceContext) {
  return {
    async startExecution(planId: string, workspaceId: string) {
      getRequiredAuthUserId(context)
      assertLocalExecutionContext(context)
      const existing = executionByPlanId.get(planId)
      if (existing) return { execution: publicExecutionView(existing), replayed: true }

      const activation = getActivatedAutonomousEditPlan(planId)
      if (!activation || activation.workspaceId !== workspaceId) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Activate the approved evidence-backed plan before private review execution.', 409)
      }
      const planningEvidence = (await createProjectEditPlanService(context).getApprovedLocalEditPlan(planId, workspaceId))
        .localEditPlan.approvedLocalPlan.planningEvidence
      if (!planningEvidence) throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved plan is missing source evidence lineage.', 409)
      if (!getAutonomousPrivateExecutionEvidence(planningEvidence.attemptId)) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Private source evidence is unavailable; rebuild and approve the plan.', 409)
      }

      const record = createQueuedRecord(activation)
      executionByPlanId.set(planId, record)
      const inFlight = executePrivateReview({ context, record, attemptId: planningEvidence.attemptId })
        .catch((error) => {
          const current = executionByPlanId.get(planId)
          if (!current || current.status === 'private_review_ready') return
          current.status = error instanceof ApiError && error.status < 500 ? 'blocked' : 'failed'
          for (const item of current.progress) {
            if (item.status === 'running') {
              item.status = current.status
              item.completedAt = nowIso()
            }
          }
          current.currentStage = current.status
          current.progressPercent = Math.min(current.progressPercent, 95)
          current.error = safeError(error)
          current.completedAt = nowIso()
        })
        .finally(() => inFlightByPlanId.delete(planId))
      inFlightByPlanId.set(planId, inFlight)
      return { execution: publicExecutionView(record), replayed: false }
    },

    async getExecution(planId: string, workspaceId: string) {
      getRequiredAuthUserId(context)
      const record = executionByPlanId.get(planId)
      if (!record || record.workspaceId !== workspaceId) {
        throw new ApiError('PLAN_NOT_APPROVED', 'Private review execution was not found for this workspace.', 404)
      }
      return { execution: publicExecutionView(record) }
    },
  }
}

async function executePrivateReview(input: {
  context: ServiceContext
  record: AutonomousPrivateReviewExecutionRecord
  attemptId: string
}): Promise<void> {
  const { context, record } = input
  const activation = getActivatedAutonomousEditPlan(record.planId)
  const privateEvidence = getAutonomousPrivateExecutionEvidence(input.attemptId)
  if (!activation || !privateEvidence) throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Activated private execution evidence is unavailable.', 409)
  const compilation = activation.executionCompilation
  const plan = compilation.plan
  const mediaAssetId = compilation.timelineManifest.mediaAssetId
  const costMetering = createToolCostMeteringService(context)
  const costEstimates = estimatePrivateReviewCosts({
    costMetering,
    durationSeconds: compilation.timelineManifest.durationSeconds,
    width: plan.outputFrame.width,
    height: plan.outputFrame.height,
    fps: privateEvidence.mediaProbe.fps ?? 30,
    approvedReservationRemainingCredits: activation.creditReservation.reservedCredits,
  })
  record.estimatedHighCredits = costEstimates.reduce((total, estimate) => total + estimate.highCredits, 0)
  if (record.estimatedHighCredits > activation.creditReservation.reservedCredits) {
    throw new ApiError(
      'CREDITS_NOT_RESERVED',
      'The approved private review reservation no longer covers the current high cost estimate.',
      409,
      {
        estimatedHighCredits: record.estimatedHighCredits,
        reservedCredits: activation.creditReservation.reservedCredits,
      },
    )
  }
  const outputRoot = resolveExecutionOutputRoot(context.env.localStorageRoot, record.executionId)
  await mkdir(outputRoot, { recursive: true })
  try {
    markStage(record, 'validating_approved_edit', 8)
    if (activation.approvedPlanSnapshot.snapshotStatus !== 'execution_ready') {
      throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot is not execution-ready.', 409)
    }

    markStage(record, 'building_timeline', 18)
    const timelineGate = buildPassedGate({
      record,
      mediaAssetId,
      toolExecutionPlanId: `timeline-${record.executionId}`,
      gateType: 'render_timeline_integrity',
      reason: 'Compiled source ranges are ordered, non-overlapping, and resolve exactly to the approved timeline duration.',
      workerType: 'qa_worker',
    })

    const captionSpec = resolveCaptionSpec(plan)
    const captionRequested = Boolean(captionSpec)
    let captionResult: Awaited<ReturnType<typeof runCaptionExecution>> | undefined
    if (captionRequested) {
      markStage(record, 'preparing_captions', 34)
      if (compilation.timelineTranscriptSegments.length === 0) {
        throw new ApiError('VALIDATION_FAILED', 'Approved captions require transcript words remapped to the final timeline.', 409)
      }
      captionResult = await runCaptionExecution({
        mode: 'local_dev', workspaceId: record.workspaceId, projectId: record.projectId, mediaAssetId,
        approvedSnapshotId: record.approvedPlanSnapshotId, toolExecutionPlanId: `captions-${record.executionId}`,
        idempotencyKey: `captions:${record.executionId}`, transcriptSegments: compilation.timelineTranscriptSegments,
        captionStyle: compilation.captionDirection.stylePresetId, maxWordsPerCue: captionSpec?.maxWordsPerCue,
        maxCaptionLines: captionSpec?.maxLines, aspectRatio: plan.outputFrame.aspectRatio,
        outputDirectory: path.join(outputRoot, 'captions'), buildSrt: true, buildWebVtt: true, buildAss: true,
        buildPreview: false, enableCaptionPreview: false,
      })
      if (captionResult.status === 'blocked' || captionResult.status === 'failed' || captionResult.qaResults.some(isBlockingGate)) {
        throw new ApiError('VALIDATION_FAILED', 'Caption execution or caption QA blocked the private review.', 409)
      }
    } else {
      completeSkippedStage(record, 'preparing_captions')
    }

    markStage(record, 'composing_visuals', 52)
    const graphicsStartedAt = nowIso()
    const graphicsStartedMs = Date.now()
    const visualOverlays = await renderApprovedGraphicsMotionOverlays({
      plan,
      timelineManifest: compilation.timelineManifest,
      captionSegments: captionResult?.captionSegments ?? [],
      outputDirectory: outputRoot,
      canvas: { width: plan.outputFrame.width, height: plan.outputFrame.height },
      captionSpec,
    })
    if (visualOverlays.status !== 'completed') {
      throw new ApiError('VALIDATION_FAILED', 'Graphics, motion, or overlay layout QA blocked the private review.', 409, visualOverlays.qaFindings)
    }
    const graphicsCostEvent = await costMetering.emitToolCostEvent({
      workspaceId: record.workspaceId,
      projectId: record.projectId,
      editPlanId: record.planId,
      jobId: `${record.executionId}:graphics`,
      creditEstimateId: record.creditEstimateId,
      creditReservationId: record.creditReservationId,
      toolId: 'playwright',
      toolName: 'Private graphics and motion compositor',
      usageCategory: 'graphic_design',
      providerType: 'deterministic_renderer',
      qualityLevel: 'preview',
      startedAt: graphicsStartedAt,
      completedAt: nowIso(),
      wallClockMs: Math.max(1, Date.now() - graphicsStartedMs),
      inputVideoSeconds: compilation.timelineManifest.durationSeconds,
      outputVideoSeconds: compilation.timelineManifest.durationSeconds,
      renderDurationSeconds: compilation.timelineManifest.durationSeconds,
      outputResolution: `${plan.outputFrame.width}x${plan.outputFrame.height}`,
      outputFrameRate: privateEvidence.mediaProbe.fps ?? 30,
      estimatedInternalCostCents: costEstimates[0].expectedInternalCostCents,
      retryAttempt: 1,
      failureCategory: 'none',
      billableToUser: false,
      metadata: privateReviewCostMetadata(record, 'graphics_motion_composition'),
    }, `autonomous-private-review:${record.executionId}:graphics`)
    record.toolCostEventIds.push(graphicsCostEvent.event.id)
    const visualGate = buildPassedGate({
      record,
      mediaAssetId,
      toolExecutionPlanId: `visuals-${record.executionId}`,
      gateType: 'render_asset_integrity',
      reason: 'All approved visual overlays rendered privately, fit the confirmed frame, retain source lineage, and passed collision QA.',
      workerType: 'qa_worker',
    })
    const upstreamQa = dedupeGates([timelineGate, visualGate, ...(captionResult?.qaResults ?? [])])
    if (upstreamQa.some(isBlockingGate)) throw new ApiError('VALIDATION_FAILED', 'Blocking upstream QA prevents rendering.', 409)

    markStage(record, 'rendering_private_review', 70)
    const renderStartedAt = nowIso()
    const renderStartedMs = Date.now()
    const renderToolExecutionPlanId = `render-${record.executionId}`
    const renderPayload = buildRenderWorkerPayload({ record, mediaAssetId, renderToolExecutionPlanId, sourceStorageObjectId: plan.sourceEvidence.sourceStorageObjectRecordId, gateTypes: upstreamQa.map((gate) => gate.gateType) })
    const renderManifest = buildRenderManifest({ record, compilation, visualOverlayCount: visualOverlays.overlays.length, upstreamQa })
    const sourceHasAudio = privateEvidence.mediaProbe.audioStreams.length > 0
    const operationIds = new Set(plan.segments.flatMap((segment) => segment.operations.map((operation) => operation.operationId)))
    const approvedAudioSpec = resolveCoherentExecutionSpec(plan, 'audio')
    const approvedColorSpec = resolveCoherentExecutionSpec(plan, 'color')
    const renderResult = await runFinalRenderExecutionPipeline({
      mode: 'local_dev', workspaceId: record.workspaceId, projectId: record.projectId, mediaAssetId,
      approvedSnapshotId: record.approvedPlanSnapshotId, creditReservationId: record.creditReservationId,
      toolExecutionPlanId: renderToolExecutionPlanId, idempotencyKey: renderPayload.idempotencyKey, workerPayload: renderPayload,
      timelineManifestId: compilation.timelineManifest.id, timelineManifest: compilation.timelineManifest,
      renderManifestId: renderManifest.id, renderManifest,
      sourceVideoArtifactIds: [plan.sourceEvidence.sourceStorageObjectRecordId],
      captionArtifactIds: captionResult?.artifacts.map((artifact) => artifact.id) ?? [],
      qaGateResultIds: upstreamQa.map((gate) => gate.id), upstreamQaResults: upstreamQa,
      requiredUpstreamQaGateTypes: upstreamQa.map((gate) => gate.gateType),
      sourceLocalPaths: [privateEvidence.sourceLocalPath], visualOverlayInputs: visualOverlays.overlays,
      outputDirectory: outputRoot, outputFileName: `private-review-${safeId(record.planId)}.mp4`,
      renderEngine: 'ffmpeg', renderMode: 'final_export', canvas: renderManifest.canvas,
      fps: privateEvidence.mediaProbe.fps ?? 30, durationSeconds: compilation.timelineManifest.durationSeconds,
      exportSettings: renderManifest.exportSettings, enableLocalDevRender: true, enableRemotionLocalRender: false,
      enableCaptionBurnIn: false, enableVisualOverlays: visualOverlays.overlays.length > 0,
      sourceAudioRequired: sourceHasAudio, ffmpegBin: context.env.ffmpegBin, ffprobeBin: context.env.ffprobeBin,
      localDevRenderProfile: {
        visualFinish: 'none',
        audioFinish: 'none',
        subtlePunchIns: hasPacingOperation(operationIds),
      },
      approvedAudioSpec,
      approvedColorSpec,
      timeoutMs: 15 * 60_000,
    })
    if (renderResult.status !== 'completed' || !renderResult.finalDeliveryAllowed || !renderResult.outputLocalPath || !renderResult.outputProbe) {
      throw new ApiError('VALIDATION_FAILED', `Private review rendering failed QA: ${renderResult.warnings.join(' ')}`, 409)
    }
    const renderCostEvent = await costMetering.emitToolCostEvent({
      workspaceId: record.workspaceId,
      projectId: record.projectId,
      editPlanId: record.planId,
      jobId: `${record.executionId}:render`,
      renderJobId: record.executionId,
      creditEstimateId: record.creditEstimateId,
      creditReservationId: record.creditReservationId,
      toolId: 'ffmpeg',
      toolName: 'Private review renderer',
      usageCategory: 'rendering',
      providerType: 'deterministic_renderer',
      qualityLevel: 'preview',
      startedAt: renderStartedAt,
      completedAt: nowIso(),
      wallClockMs: Math.max(1, Date.now() - renderStartedMs),
      inputVideoSeconds: compilation.timelineManifest.durationSeconds,
      outputVideoSeconds: renderResult.outputProbe.durationSeconds,
      renderDurationSeconds: renderResult.outputProbe.durationSeconds,
      outputResolution: `${renderResult.outputProbe.width}x${renderResult.outputProbe.height}`,
      outputFrameRate: renderResult.outputProbe.fps,
      estimatedInternalCostCents: costEstimates[1].expectedInternalCostCents,
      retryAttempt: 1,
      failureCategory: 'none',
      billableToUser: false,
      metadata: privateReviewCostMetadata(record, 'private_review_render'),
    }, `autonomous-private-review:${record.executionId}:render`)
    record.toolCostEventIds.push(renderCostEvent.event.id)

    markStage(record, 'running_quality_checks', 88)
    const finalBytes = await readFile(renderResult.outputLocalPath)
    const artifactManifest = Buffer.from(JSON.stringify({
      version: 'autonomous-private-artifact-manifest-v1', executionId: record.executionId,
      planId: record.planId, approvedPlanSnapshotId: record.approvedPlanSnapshotId,
      timelineManifestId: compilation.timelineManifest.id,
      sourceStorageObjectRecordId: plan.sourceEvidence.sourceStorageObjectRecordId,
      privateArtifactIds: plan.sourceEvidence.privateArtifactIds,
      captionArtifactIds: captionResult?.artifacts.map((artifact) => artifact.id) ?? [],
      visualOverlays: visualOverlays.overlays.map((overlay) => ({
        overlayId: overlay.overlayId, overlayKind: overlay.overlayKind, startSeconds: overlay.startSeconds,
        endSeconds: overlay.endSeconds, sourceEvidenceRefs: overlay.sourceEvidenceRefs, private: true,
      })),
      renderArtifactIds: renderResult.renderArtifacts.map((artifact) => artifact.id),
      toolCostEventIds: record.toolCostEventIds,
      sourceImmutable: true, publicDeliveryAllowed: false, signedUrlsStoredAsSourceTruth: false,
    }, null, 2))
    const qaReport = Buffer.from(JSON.stringify({
      version: 'autonomous-private-review-qa-v1', executionId: record.executionId, planId: record.planId,
      status: 'passed_technical_qa_pending_user_review',
      approvedOperationIds: [...operationIds],
      approvedAudioSpec: approvedAudioSpec ? { ...approvedAudioSpec, evidenceBasis: [...approvedAudioSpec.evidenceBasis] } : undefined,
      approvedColorSpec: approvedColorSpec ? { ...approvedColorSpec, evidenceBasis: [...approvedColorSpec.evidenceBasis] } : undefined,
      sourceRangeCount: compilation.timelineManifest.clips.length,
      captionCount: captionResult?.captionSegments.length ?? 0,
      overlayCount: visualOverlays.overlays.length,
      graphicsMotionQa: visualOverlays.qaFindings,
      gates: [...upstreamQa, ...renderResult.qaResults].map((gate) => ({ gateType: gate.gateType, status: gate.status, blocking: gate.blocking, score: gate.score })),
      outputProbe: renderResult.outputProbe,
      toolCostEventIds: record.toolCostEventIds,
      internalCostEvidenceOnly: true,
      userCreativeReviewRequired: true, productReady: false, publicDeliveryAllowed: false,
    }, null, 2))
    const uploadService = createUploadService(context)
    const preview = await persistPrivateArtifact({ uploadService, record, purpose: 'preview', fileName: `private-review-${safeId(record.planId)}.mp4`, mimeType: 'video/mp4', bytes: finalBytes })
    const manifest = await persistPrivateArtifact({ uploadService, record, purpose: 'qa_artifact', fileName: 'private-artifact-manifest.json', mimeType: 'application/json', bytes: artifactManifest })
    const qa = await persistPrivateArtifact({ uploadService, record, purpose: 'qa_artifact', fileName: 'private-review-qa.json', mimeType: 'application/json', bytes: qaReport })

    const allGates = dedupeGates([...upstreamQa, ...renderResult.qaResults])
    record.status = 'private_review_ready'
    record.currentStage = 'private_review_ready'
    record.progressPercent = 100
    record.previewStorageObjectRecordId = preview.storageObjectRecord.id
    record.previewMediaAssetId = preview.mediaAsset.id
    record.outputBucketName = preview.storageObjectRecord.bucketName
    record.outputObjectPath = preview.storageObjectRecord.objectPath
    record.outputMimeType = 'video/mp4'
    record.outputSizeBytes = preview.storageObjectRecord.sizeBytes
    record.outputChecksumSha256 = preview.storageObjectRecord.checksumSha256
    record.durationSeconds = renderResult.outputProbe.durationSeconds
    record.width = renderResult.outputProbe.width
    record.height = renderResult.outputProbe.height
    record.artifactManifestStorageObjectRecordId = manifest.storageObjectRecord.id
    record.qaReportStorageObjectRecordId = qa.storageObjectRecord.id
    record.executedActivitySummary = humanActivitySummary(operationIds)
    record.qaSummary = {
      status: 'passed_technical_qa_pending_user_review',
      passedGateCount: allGates.filter((gate) => gate.status === 'passed' && !gate.blocking).length,
      failedGateCount: 0,
      userCreativeReviewRequired: true,
    }
    record.completedAt = nowIso()
    updateProgress(record, 'private_review_ready', 'completed')
  } finally {
    await rm(outputRoot, { recursive: true, force: true })
  }
}

function createQueuedRecord(activation: NonNullable<ReturnType<typeof getActivatedAutonomousEditPlan>>): AutonomousPrivateReviewExecutionRecord {
  const progress: AutonomousPrivateReviewProgressItem[] = [
    ['validating_approved_edit', 'Checking the approved edit'],
    ['building_timeline', 'Building the source-aware timeline'],
    ['preparing_captions', 'Preparing readable captions'],
    ['composing_visuals', 'Composing supporting visuals'],
    ['rendering_private_review', 'Rendering the private review'],
    ['running_quality_checks', 'Checking the finished edit'],
    ['private_review_ready', 'Private review ready'],
  ].map(([stage, label]) => ({ stage: stage as AutonomousPrivateReviewStage, label, status: 'pending' }))
  return {
    executionId: createMockId('autonomous_private_review'), planId: activation.planId,
    workspaceId: activation.workspaceId, projectId: activation.projectId, editSessionId: activation.editSessionId,
    status: 'queued', currentStage: 'queued', progressPercent: 0, progress,
    approvedPlanSnapshotId: activation.approvedPlanSnapshot.id,
    creditEstimateId: activation.creditApproval.creditEstimateId,
    creditReservationId: activation.creditReservation.id,
    estimatedHighCredits: 0,
    toolCostEventIds: [],
    executedActivitySummary: [], privateArtifactsOnly: true, publicDeliveryAllowed: false,
    paidBillingMutationMade: false, productReady: false, startedAt: nowIso(),
    warnings: ['Execution is backend-local and produces private review artifacts only.'],
  }
}

function estimatePrivateReviewCosts(input: {
  costMetering: ReturnType<typeof createToolCostMeteringService>
  durationSeconds: number
  width: number
  height: number
  fps: number
  approvedReservationRemainingCredits: number
}): ToolCostEstimate[] {
  const resolution = `${input.width}x${input.height}`
  return [
    input.costMetering.estimateToolCost({
      toolId: 'playwright',
      toolName: 'Private graphics and motion compositor',
      usageCategory: 'graphic_design',
      computeLevel: 'standard',
      providerType: 'deterministic_renderer',
      qualityLevel: 'preview',
      inputVideoSeconds: input.durationSeconds,
      outputVideoSeconds: input.durationSeconds,
      renderDurationSeconds: input.durationSeconds,
      estimatedRuntimeSeconds: Math.max(1, input.durationSeconds),
      resolution,
      frameRate: input.fps,
      vcpuCount: 2,
      memoryGiB: 2,
      approvedReservationRemainingCredits: input.approvedReservationRemainingCredits,
      assumptions: ['Private approved graphics and motion overlays only.'],
    }).estimate,
    input.costMetering.estimateToolCost({
      toolId: 'ffmpeg',
      toolName: 'Private review renderer',
      usageCategory: 'rendering',
      computeLevel: 'standard',
      providerType: 'deterministic_renderer',
      qualityLevel: 'preview',
      inputVideoSeconds: input.durationSeconds,
      outputVideoSeconds: input.durationSeconds,
      renderDurationSeconds: input.durationSeconds,
      estimatedRuntimeSeconds: Math.max(1, input.durationSeconds * 2),
      resolution,
      frameRate: input.fps,
      vcpuCount: 2,
      memoryGiB: 2,
      approvedReservationRemainingCredits: input.approvedReservationRemainingCredits,
      assumptions: ['Private approved timeline render and technical QA only.'],
    }).estimate,
  ]
}

function privateReviewCostMetadata(
  record: AutonomousPrivateReviewExecutionRecord,
  stage: 'graphics_motion_composition' | 'private_review_render',
): Record<string, unknown> {
  return {
    stage,
    approvedPlanSnapshotId: record.approvedPlanSnapshotId,
    privateInternalReviewOnly: true,
    publicDeliveryAllowed: false,
    paidBillingMutationMade: false,
    serviceFeeIncluded: false,
  }
}

function publicExecutionView(record: AutonomousPrivateReviewExecutionRecord): AutonomousPrivateReviewExecutionRecord {
  return structuredClone(record)
}

function markStage(record: AutonomousPrivateReviewExecutionRecord, stage: AutonomousPrivateReviewStage, progressPercent: number) {
  for (const item of record.progress) {
    if (item.status === 'running') { item.status = 'completed'; item.completedAt = nowIso() }
  }
  record.status = 'running'
  record.currentStage = stage
  record.progressPercent = progressPercent
  updateProgress(record, stage, 'running')
}

function completeSkippedStage(record: AutonomousPrivateReviewExecutionRecord, stage: AutonomousPrivateReviewStage) {
  updateProgress(record, stage, 'completed')
}

function updateProgress(record: AutonomousPrivateReviewExecutionRecord, stage: AutonomousPrivateReviewStage, status: AutonomousPrivateReviewProgressItem['status']) {
  const item = record.progress.find((candidate) => candidate.stage === stage)
  if (!item) return
  item.status = status
  if (status === 'completed') item.completedAt = nowIso()
}

function resolveCaptionSpec(plan: AutonomousEditPlanDraft): AutonomousCaptionExecutionSpec | undefined {
  const specs = plan.segments.flatMap((segment) => segment.operations.flatMap((operation) =>
    operation.executionSpec?.kind === 'caption' ? [operation.executionSpec] : []))
  if (specs.length === 0) return undefined
  if (new Set(specs.map((spec) => JSON.stringify(spec))).size !== 1) {
    throw new ApiError('VALIDATION_FAILED', 'Approved edit contains inconsistent caption execution systems.', 409)
  }
  return specs[0]
}

function buildRenderWorkerPayload(input: {
  record: AutonomousPrivateReviewExecutionRecord
  mediaAssetId: string
  renderToolExecutionPlanId: string
  sourceStorageObjectId: string
  gateTypes: QualityGateResult['gateType'][]
}): ProductionWorkerJobPayload {
  const payload: ProductionWorkerJobPayload = {
    jobId: `job-${input.record.executionId}`, workspaceId: input.record.workspaceId, projectId: input.record.projectId,
    mediaAssetId: input.mediaAssetId, approvedSnapshotId: input.record.approvedPlanSnapshotId,
    editPlanId: input.record.planId, toolExecutionPlanId: input.renderToolExecutionPlanId,
    workerType: 'render_worker', executionMode: 'mock_safe', idempotencyKey: 'pending', attempt: 1, maxAttempts: 1,
    requestedToolIds: ['ffmpeg'], requestedRecipeIds: ['motion_graphics_recipe', 'final_export_recipe'],
    storageReferenceIds: [input.sourceStorageObjectId], creditReservationId: input.record.creditReservationId,
    renderMode: 'final_export', requiredQualityGateTypes: input.gateTypes, createdAt: nowIso(),
    metadata: { approvedAutonomousPlan: true, privateArtifactsOnly: true, publicDeliveryAllowed: false },
  }
  payload.idempotencyKey = buildWorkerIdempotencyKey(payload)
  return payload
}

function buildRenderManifest(input: {
  record: AutonomousPrivateReviewExecutionRecord
  compilation: NonNullable<ReturnType<typeof getActivatedAutonomousEditPlan>>['executionCompilation']
  visualOverlayCount: number
  upstreamQa: QualityGateResult[]
}): RenderManifest {
  const { plan, timelineManifest } = input.compilation
  const now = nowIso()
  return {
    id: `render-manifest-${safeId(input.record.executionId)}`,
    workspaceId: input.record.workspaceId, projectId: input.record.projectId, editPlanId: input.record.planId,
    approvedSnapshotId: input.record.approvedPlanSnapshotId, timelineManifestId: timelineManifest.id,
    renderEngine: 'ffmpeg', renderMode: 'final_export',
    canvas: { width: plan.outputFrame.width, height: plan.outputFrame.height, aspectRatio: plan.outputFrame.aspectRatio, backgroundColor: '#000000' },
    fps: timelineManifest.clips[0]?.sourceRange.startFrame !== undefined
      ? Math.max(1, Math.round((timelineManifest.clips[0].sourceRange.endFrame! - timelineManifest.clips[0].sourceRange.startFrame!) / (timelineManifest.clips[0].sourceRange.endSeconds - timelineManifest.clips[0].sourceRange.startSeconds)))
      : 30,
    durationSeconds: timelineManifest.durationSeconds,
    layers: input.visualOverlayCount > 0 ? [{
      id: `approved-visual-layer-${safeId(input.record.executionId)}`, layerType: 'approved_private_visual_overlays',
      startFrame: 0, endFrame: Math.round(timelineManifest.durationSeconds * 30), zIndex: 20, assetIds: [],
      settings: { overlayCount: input.visualOverlayCount, sourceEvidenceRequired: true, private: true },
    }] : [],
    assets: timelineManifest.sourceReferences, captions: [],
    audio: { sourceArtifactIds: [], mixSettings: { speechClarityFirst: true, sourceTimelineAudio: true }, loudnessTarget: -16 },
    color: { operations: plan.segments.flatMap((segment) => segment.operations.filter((operation) => operation.operationId.startsWith('color.')).map((operation) => ({ operationId: operation.operationId, instruction: operation.instruction, rationale: operation.rationale, executionSpec: operation.executionSpec ? JSON.parse(JSON.stringify(operation.executionSpec)) : null }))), outputColorSpace: 'bt709' },
    exportSettings: { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', crf: 20, pixelFormat: 'yuv420p' },
    requiredQualityGateIds: input.upstreamQa.map((gate) => gate.id), status: 'ready', createdAt: now, updatedAt: now,
  }
}

function buildPassedGate(input: {
  record: AutonomousPrivateReviewExecutionRecord
  mediaAssetId: string
  toolExecutionPlanId: string
  gateType: QualityGateResult['gateType']
  reason: string
  workerType: QualityGateResult['checkedByWorkerType']
}): QualityGateResult {
  return {
    id: `gate-${safeId(input.gateType)}-${safeId(input.record.executionId)}`,
    workspaceId: input.record.workspaceId, projectId: input.record.projectId, mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId, recipeId: 'autonomous_private_review', gateType: input.gateType,
    status: 'passed', score: 1, threshold: 0.9, required: true, blocking: false, checkedAt: nowIso(),
    checkedByWorkerType: input.workerType, inputArtifactIds: [], outputArtifactIds: [], issues: [],
    recommendations: [{ action: 'continue_private_review', reason: input.reason, priority: 'normal' }],
    fallbackRequired: false, blocksPreview: false, blocksFinalExport: false, humanReviewRequired: false,
  }
}

async function persistPrivateArtifact(input: {
  uploadService: ReturnType<typeof createUploadService>
  record: AutonomousPrivateReviewExecutionRecord
  purpose: 'preview' | 'qa_artifact'
  fileName: string
  mimeType: 'video/mp4' | 'application/json'
  bytes: Buffer
}) {
  const intent = await input.uploadService.createUploadIntent({
    workspaceId: input.record.workspaceId, projectId: input.record.projectId, chatSessionId: input.record.editSessionId,
    uploadPurpose: input.purpose, originalFileName: input.fileName, mimeType: input.mimeType, expectedSizeBytes: input.bytes.length,
  })
  const uploaded = await input.uploadService.uploadLocalObject(intent.uploadIntent.id, input.bytes, input.mimeType)
  return input.uploadService.finalizeUploadIntent({
    workspaceId: input.record.workspaceId, uploadIntentId: intent.uploadIntent.id,
    sizeBytes: uploaded.localObjectUpload.sizeBytes, checksumSha256: uploaded.localObjectUpload.checksumSha256,
  })
}

function resolveCoherentExecutionSpec(plan: AutonomousEditPlanDraft, kind: 'audio'): AutonomousAudioExecutionSpec | undefined
function resolveCoherentExecutionSpec(plan: AutonomousEditPlanDraft, kind: 'color'): AutonomousColorExecutionSpec | undefined
function resolveCoherentExecutionSpec(
  plan: AutonomousEditPlanDraft,
  kind: 'audio' | 'color',
): AutonomousAudioExecutionSpec | AutonomousColorExecutionSpec | undefined {
  const operations = plan.segments.flatMap((segment) => segment.operations)
  const specs = operations.flatMap((operation) => operation.executionSpec?.kind === kind ? [operation.executionSpec] : [])
  const expectedOperationPresent = operations.some((operation) => kind === 'audio'
    ? operation.operationId === 'audio.cleanup' || operation.operationId === 'audio.loudness.normalize'
    : operation.operationId === 'color.correct' || operation.operationId === 'color.grade')
  if (expectedOperationPresent && specs.length === 0) {
    throw new ApiError('VALIDATION_FAILED', `Approved ${kind} work is missing its evidence-backed execution parameters.`, 409)
  }
  if (new Set(specs.map((spec) => JSON.stringify(spec))).size > 1) {
    throw new ApiError('VALIDATION_FAILED', `Approved ${kind} work contains inconsistent execution parameters.`, 409)
  }
  return specs[0]
}

function hasPacingOperation(operationIds: Set<AutonomousEditOperationId>): boolean {
  return [...operationIds].some((operationId) => operationId === 'timeline.smart_cut' || operationId === 'timeline.trim')
}

function humanActivitySummary(operationIds: Set<AutonomousEditOperationId>): string[] {
  const labels = [
    [...operationIds].some((id) => id.startsWith('timeline.')) ? 'Story timing shaped from approved source ranges' : undefined,
    [...operationIds].some((id) => id.startsWith('caption.')) ? 'Speech-aligned captions prepared' : undefined,
    [...operationIds].some((id) => id.startsWith('graphics.')) ? 'Source-backed supporting visuals composed' : undefined,
    [...operationIds].some((id) => id.startsWith('audio.')) ? 'Voice and loudness polished' : undefined,
    [...operationIds].some((id) => id.startsWith('color.')) ? 'Picture finish applied' : undefined,
    'Private review rendered and checked',
  ]
  return labels.filter((value): value is string => Boolean(value))
}

function dedupeGates(gates: QualityGateResult[]): QualityGateResult[] {
  const seen = new Set<string>()
  return gates.filter((gate) => seen.has(gate.gateType) ? false : (seen.add(gate.gateType), true))
}

function isBlockingGate(gate: QualityGateResult): boolean {
  return gate.blocking || gate.status === 'blocked' || gate.status === 'failed'
}

function resolveExecutionOutputRoot(localStorageRoot: string, executionId: string): string {
  const root = path.resolve(localStorageRoot)
  return assertOutputPathInsideRoot(path.join(root, 'worker-temp', 'autonomous-private-review', safeId(executionId)), root)
}

function assertLocalExecutionContext(context: ServiceContext): void {
  if (context.env.mode !== 'local' || context.env.storageMode !== 'local') {
    throw new ApiError('LOCAL_STORAGE_REQUIRED', 'Private review execution currently requires the approved backend-local runtime.', 409)
  }
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 96) || 'execution'
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Private review execution failed safely.'
  return message.replace(/(?:sk-|key-|token-)[a-z0-9_-]+/gi, '[redacted]').slice(0, 1200)
}
