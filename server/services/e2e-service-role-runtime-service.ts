import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createBasicPreview } from '../media/ffmpeg-preview'
import { probeMediaFile } from '../media/ffprobe'
import { resolveLocalStorageObjectPath } from '../media/local-media-paths'
import { resolveBucketName } from '../storage/storage-adapter'
import { buildCanonicalObjectPath } from '../storage/storage-paths'
import { createSmokeMetadata, createSmokeRunId, getLiveWriteGuardStatus, sanitizeLiveSmokePayload } from '../supabase/live-write-guard'
import { checkE2EServiceRoleRpcReadiness, type RpcReadinessResult } from '../supabase/rpc-readiness'
import type { ServiceContext } from '../types'
import { checkBasicRenderSmokeTools } from './render-smoke-service'
import type {
  BasicPreviewRenderOutput,
  E2EApprovedSnapshotRpcResult,
  E2ECreditReservationRpcResult,
  E2EJobBatchRenderJobRpcResult,
  E2EJobEventRpcResult,
  E2EPersistedRenderPipelineResult,
  E2EPreviewQARpcResult,
  E2EPreviewReadyRpcResult,
  E2EPreviewRenderRpcResult,
  E2EPreviewStorageObjectRpcResult,
  E2EWorkerClaimRpcResult,
  MediaProbeSummary,
  PersistedRenderExecutionMode,
} from '../../src/types'

type RpcResult =
  | E2EApprovedSnapshotRpcResult
  | E2ECreditReservationRpcResult
  | E2EJobBatchRenderJobRpcResult
  | E2EWorkerClaimRpcResult
  | E2EJobEventRpcResult
  | E2EPreviewStorageObjectRpcResult
  | E2EPreviewRenderRpcResult
  | E2EPreviewQARpcResult
  | E2EPreviewReadyRpcResult

interface BaseRpcInput {
  workspaceId: string
  projectId?: string
  idempotencyKey?: string
}

export interface E2ERpcReadinessSmokeResult {
  ok: boolean
  status: 'passed' | 'failed' | 'skipped'
  smokeMode: string
  liveSupabaseConfigured: boolean
  rpcReadiness?: RpcReadinessResult
  warnings: string[]
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export interface RunPersistedRenderPipelineViaRpcsInput {
  workspaceId: string
  projectId: string
  chatSessionId?: string
  editPlanId: string
  creditWalletId: string
  creditEstimateId: string
  creditApprovalId: string
  approvedByUserId: string
  sourceStorageObjectId: string
  sourceMediaAssetId?: string
  sourceBucketName: string
  sourceObjectPath: string
  sourceSizeBytes?: number
  sourceChecksumSha256?: string
  creditAmount?: number
  idempotencyKey: string
  smokeRunId?: string
  renderType?: string
  renderExecutionMode?: PersistedRenderExecutionMode
}

export async function createApprovedSnapshotViaRpc(context: ServiceContext, input: {
  workspaceId: string
  projectId: string
  chatSessionId?: string
  editPlanId: string
  creditEstimateId: string
  creditApprovalId: string
  creditReservationId: string
  approvedByUserId: string
  sourceStorageObjectId: string
  idempotencyKey: string
  smokeRunId?: string
  renderExecutionMode?: PersistedRenderExecutionMode
}): Promise<E2EApprovedSnapshotRpcResult> {
  return callJsonRpc<E2EApprovedSnapshotRpcResult>(context, 'e2e_create_approved_plan_snapshot', {
    p_workspace_id: input.workspaceId,
    p_project_id: input.projectId,
    p_chat_session_id: input.chatSessionId ?? null,
    p_edit_plan_id: input.editPlanId,
    p_credit_estimate_id: input.creditEstimateId,
    p_credit_approval_id: input.creditApprovalId,
    p_credit_reservation_id: input.creditReservationId,
    p_approved_by_user_id: input.approvedByUserId,
    p_snapshot_json: {
      ...createSmokeMetadata(input.smokeRunId ?? input.idempotencyKey),
      rpE2eSmoke: true,
      executionMode: 'no_ai_rpc_persisted_render_smoke',
      renderExecutionMode: input.renderExecutionMode ?? 'local_ffmpeg',
      sourceStorageObjectId: input.sourceStorageObjectId,
      providerCallsEnabled: false,
      remotionEnabled: false,
      stripeCallsEnabled: false,
      cloudRunCallsEnabled: false,
    },
    p_plan_hash: `plan-${input.idempotencyKey}`,
    p_credit_hash: `credit-${input.idempotencyKey}`,
    p_source_sequence_hash: `source-${input.idempotencyKey}`,
    p_timing_hash: `timing-${input.idempotencyKey}`,
    p_idempotency_key: `${input.idempotencyKey}:approved-snapshot`,
  })
}

export async function reserveCreditsViaRpc(context: ServiceContext, input: {
  workspaceId: string
  projectId: string
  creditWalletId: string
  creditEstimateId: string
  creditApprovalId: string
  amount: number
  idempotencyKey: string
}): Promise<E2ECreditReservationRpcResult> {
  return callJsonRpc<E2ECreditReservationRpcResult>(context, 'e2e_reserve_credits_for_smoke', {
    p_workspace_id: input.workspaceId,
    p_project_id: input.projectId,
    p_credit_wallet_id: input.creditWalletId,
    p_credit_estimate_id: input.creditEstimateId,
    p_credit_approval_id: input.creditApprovalId,
    p_amount: input.amount,
    p_idempotency_key: `${input.idempotencyKey}:credit-reservation`,
  })
}

export async function createJobBatchAndRenderJobViaRpc(context: ServiceContext, input: {
  workspaceId: string
  projectId: string
  chatSessionId?: string
  editPlanId: string
  approvedPlanSnapshotId: string
  creditEstimateId: string
  creditReservationId: string
  renderType?: string
  idempotencyKey: string
}): Promise<E2EJobBatchRenderJobRpcResult> {
  return callJsonRpc<E2EJobBatchRenderJobRpcResult>(context, 'e2e_create_job_batch_and_render_job', {
    p_workspace_id: input.workspaceId,
    p_project_id: input.projectId,
    p_chat_session_id: input.chatSessionId ?? null,
    p_edit_plan_id: input.editPlanId,
    p_approved_plan_snapshot_id: input.approvedPlanSnapshotId,
    p_credit_estimate_id: input.creditEstimateId,
    p_credit_reservation_id: input.creditReservationId,
    p_render_type: input.renderType ?? 'preview',
    p_idempotency_key: `${input.idempotencyKey}:job-render`,
  })
}

export async function claimWorkerJobViaRpc(context: ServiceContext, input: {
  workspaceId: string
  projectId: string
  jobId: string
  workerType: string
  workerInstanceId: string
  leaseSeconds: number
  attemptNumber: number
  idempotencyKey: string
}): Promise<E2EWorkerClaimRpcResult> {
  return callJsonRpc<E2EWorkerClaimRpcResult>(context, 'e2e_claim_worker_job', {
    p_workspace_id: input.workspaceId,
    p_project_id: input.projectId,
    p_job_id: input.jobId,
    p_worker_type: input.workerType,
    p_worker_instance_id: input.workerInstanceId,
    p_lease_seconds: input.leaseSeconds,
    p_attempt_number: input.attemptNumber,
    p_idempotency_key: `${input.idempotencyKey}:worker-claim`,
  })
}

export async function releaseWorkerJobClaimViaRpc(context: ServiceContext, input: {
  claimId: string
  jobId: string
  workerInstanceId: string
  releaseStatus: string
}): Promise<E2EWorkerClaimRpcResult> {
  return callJsonRpc<E2EWorkerClaimRpcResult>(context, 'e2e_release_worker_job_claim', {
    p_claim_id: input.claimId,
    p_job_id: input.jobId,
    p_worker_instance_id: input.workerInstanceId,
    p_release_status: input.releaseStatus,
  })
}

export async function recordJobEventViaRpc(context: ServiceContext, input: {
  workspaceId: string
  projectId: string
  jobId: string
  eventName: string
  eventMessage: string
  progressPercent?: number
  payloadJson?: Record<string, unknown>
  visibleToUser?: boolean
}): Promise<E2EJobEventRpcResult> {
  return callJsonRpc<E2EJobEventRpcResult>(context, 'e2e_record_job_event', {
    p_workspace_id: input.workspaceId,
    p_project_id: input.projectId,
    p_job_id: input.jobId,
    p_event_name: input.eventName,
    p_event_message: input.eventMessage,
    p_progress_percent: input.progressPercent ?? null,
    p_payload_json: sanitizeRpcPayload(input.payloadJson ?? {}),
    p_visible_to_user: input.visibleToUser ?? false,
  })
}

export async function recordPreviewStorageObjectViaRpc(context: ServiceContext, input: {
  workspaceId: string
  projectId: string
  renderId?: string
  bucketName: string
  objectPath: string
  sizeBytes: number
  checksumSha256: string
  region?: string
}): Promise<E2EPreviewStorageObjectRpcResult> {
  return callJsonRpc<E2EPreviewStorageObjectRpcResult>(context, 'e2e_record_preview_storage_object', {
    p_workspace_id: input.workspaceId,
    p_project_id: input.projectId,
    p_render_id: input.renderId ?? null,
    p_bucket_name: input.bucketName,
    p_object_path: input.objectPath,
    p_size_bytes: input.sizeBytes,
    p_checksum_sha256: input.checksumSha256,
    p_region: input.region ?? context.env.supabaseE2eRegion,
  })
}

export async function recordPreviewRenderResultViaRpc(context: ServiceContext, input: {
  workspaceId: string
  projectId: string
  renderJobId: string
  jobId: string
  editPlanId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  previewStorageObjectId: string
  durationSeconds: number
  sizeBytes: number
  checksumSha256: string
  metadataJson?: Record<string, unknown>
}): Promise<E2EPreviewRenderRpcResult> {
  return callJsonRpc<E2EPreviewRenderRpcResult>(context, 'e2e_record_preview_render_result', {
    p_workspace_id: input.workspaceId,
    p_project_id: input.projectId,
    p_render_job_id: input.renderJobId,
    p_job_id: input.jobId,
    p_edit_plan_id: input.editPlanId,
    p_approved_plan_snapshot_id: input.approvedPlanSnapshotId,
    p_credit_reservation_id: input.creditReservationId,
    p_preview_storage_object_id: input.previewStorageObjectId,
    p_duration_seconds: input.durationSeconds,
    p_size_bytes: input.sizeBytes,
    p_checksum_sha256: input.checksumSha256,
    p_metadata_json: sanitizeRpcPayload(input.metadataJson ?? {}),
  })
}

export async function recordPreviewQAResultViaRpc(context: ServiceContext, input: {
  workspaceId: string
  projectId: string
  renderId: string
  jobId: string
  overallStatus: string
  summary: string
  checksJson?: Array<Record<string, unknown>>
}): Promise<E2EPreviewQARpcResult> {
  return callJsonRpc<E2EPreviewQARpcResult>(context, 'e2e_record_preview_qa_result', {
    p_workspace_id: input.workspaceId,
    p_project_id: input.projectId,
    p_render_id: input.renderId,
    p_job_id: input.jobId,
    p_overall_status: input.overallStatus,
    p_summary: input.summary,
    p_checks_json: (input.checksJson ?? []).map(sanitizeRpcPayload),
  })
}

export async function completeRenderJobPreviewReadyViaRpc(context: ServiceContext, input: {
  workspaceId: string
  projectId: string
  jobId: string
  renderJobId: string
  renderId: string
  qaReportId: string
  previewStorageObjectId: string
}): Promise<E2EPreviewReadyRpcResult> {
  return callJsonRpc<E2EPreviewReadyRpcResult>(context, 'e2e_complete_render_job_preview_ready', {
    p_workspace_id: input.workspaceId,
    p_project_id: input.projectId,
    p_job_id: input.jobId,
    p_render_job_id: input.renderJobId,
    p_render_id: input.renderId,
    p_qa_report_id: input.qaReportId,
    p_preview_storage_object_id: input.previewStorageObjectId,
  })
}

export async function runPersistedRenderPipelineViaRpcs(
  context: ServiceContext,
  input: RunPersistedRenderPipelineViaRpcsInput,
): Promise<E2EPersistedRenderPipelineResult> {
  const liveCheck = await getLiveRpcClient(context, input)
  if (!liveCheck.ok) return liveCheck.result

  const rpcReadiness = await checkE2EServiceRoleRpcReadiness(liveCheck.client)
  if (!rpcReadiness.ok) {
    return missingRpcPipelineResult(rpcReadiness)
  }

  if (context.env.storageMode !== 'local') {
    return failedPipelineResult('LOCAL_STORAGE_REQUIRED', 'RPC persisted render smoke requires STORAGE_MODE=local.', { rpcReadiness })
  }

  const renderExecutionMode = input.renderExecutionMode ?? 'local_ffmpeg'
  if (renderExecutionMode === 'local_ffmpeg') {
    const tools = await checkBasicRenderSmokeTools(context)
    if (!tools.ready) {
      return failedPipelineResult('RENDER_TOOL_UNAVAILABLE', 'RPC persisted render smoke requires available FFmpeg and FFprobe.', {
        warnings: tools.warnings,
        rpcReadiness,
      })
    }
  }

  const eventResults: E2EJobEventRpcResult[] = []
  const smokeRunId = input.smokeRunId ?? createSmokeRunId('rp-e2e-rpc-smoke')
  let workerClaimId: string | undefined
  let jobId: string | undefined
  const partialResult: Partial<E2EPersistedRenderPipelineResult> = {
    renderExecutionMode,
    smokeRunId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    sourceStorageObjectId: input.sourceStorageObjectId,
  }

  try {
    const creditReservation = await reserveCreditsViaRpc(context, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      creditWalletId: input.creditWalletId,
      creditEstimateId: input.creditEstimateId,
      creditApprovalId: input.creditApprovalId,
      amount: input.creditAmount ?? 1,
      idempotencyKey: input.idempotencyKey,
    })
    if (!creditReservation.ok || !creditReservation.creditReservationId) return pipelineFromRpcFailure(creditReservation, rpcReadiness)
    partialResult.creditReservationId = creditReservation.creditReservationId
    partialResult.creditLedgerEntryId = creditReservation.creditLedgerEntryId

    const snapshot = await createApprovedSnapshotViaRpc(context, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      chatSessionId: input.chatSessionId,
      editPlanId: input.editPlanId,
      creditEstimateId: input.creditEstimateId,
      creditApprovalId: input.creditApprovalId,
      creditReservationId: creditReservation.creditReservationId,
      approvedByUserId: input.approvedByUserId,
      sourceStorageObjectId: input.sourceStorageObjectId,
      idempotencyKey: input.idempotencyKey,
      smokeRunId,
      renderExecutionMode,
    })
    if (!snapshot.ok || !snapshot.approvedPlanSnapshotId) return pipelineFromRpcFailure(snapshot, rpcReadiness, partialResult)
    partialResult.approvedPlanSnapshotId = snapshot.approvedPlanSnapshotId

    const jobRender = await createJobBatchAndRenderJobViaRpc(context, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      chatSessionId: input.chatSessionId,
      editPlanId: input.editPlanId,
      approvedPlanSnapshotId: snapshot.approvedPlanSnapshotId,
      creditEstimateId: input.creditEstimateId,
      creditReservationId: creditReservation.creditReservationId,
      renderType: input.renderType ?? 'preview',
      idempotencyKey: input.idempotencyKey,
    })
    if (!jobRender.ok || !jobRender.jobId || !jobRender.renderJobId) return pipelineFromRpcFailure(jobRender, rpcReadiness, partialResult)
    partialResult.jobBatchId = jobRender.jobBatchId
    partialResult.jobId = jobRender.jobId
    partialResult.renderJobId = jobRender.renderJobId
    jobId = jobRender.jobId

    const claim = await claimWorkerJobViaRpc(context, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      jobId: jobRender.jobId,
      workerType: 'basic_render_smoke_worker',
      workerInstanceId: context.env.workerInstanceId,
      leaseSeconds: context.env.workerClaimLeaseSeconds,
      attemptNumber: 1,
      idempotencyKey: input.idempotencyKey,
    })
    if (!claim.ok || !claim.workerJobClaimId) return pipelineFromRpcFailure(claim, rpcReadiness, partialResult)
    partialResult.workerJobClaimId = claim.workerJobClaimId
    workerClaimId = claim.workerJobClaimId

    eventResults.push(await recordJobEventViaRpc(context, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      jobId: jobRender.jobId,
      eventName: 'worker_claimed',
      eventMessage: 'RPC persisted render smoke worker claimed the job.',
      progressPercent: 5,
      payloadJson: { ...createSmokeMetadata(smokeRunId), workerType: 'basic_render_smoke_worker' },
    }))

    const previewBucketName = resolveBucketName(context.env, 'preview')
    const outputObjectPath = buildCanonicalObjectPath({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      purpose: 'preview',
      ownerId: jobRender.renderJobId,
      fileName: renderExecutionMode === 'metadata_stub' ? 'rpc-metadata-smoke-preview.mp4' : 'rpc-basic-smoke-preview.mp4',
    })
    const renderArtifacts = renderExecutionMode === 'metadata_stub'
      ? createMetadataStubRenderArtifacts(input, smokeRunId)
      : await createLocalFfmpegRenderArtifacts(context, input, previewBucketName, outputObjectPath)
    const { mediaProbe, previewRender } = renderArtifacts

    const previewStorage = await recordPreviewStorageObjectViaRpc(context, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      bucketName: previewBucketName,
      objectPath: outputObjectPath,
      sizeBytes: previewRender.sizeBytes,
      checksumSha256: previewRender.checksumSha256,
    })
    if (!previewStorage.ok || !previewStorage.previewStorageObjectId) return pipelineFromRpcFailure(previewStorage, rpcReadiness, partialResult)
    partialResult.previewStorageObjectId = previewStorage.previewStorageObjectId

    const render = await recordPreviewRenderResultViaRpc(context, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      renderJobId: jobRender.renderJobId,
      jobId: jobRender.jobId,
      editPlanId: input.editPlanId,
      approvedPlanSnapshotId: snapshot.approvedPlanSnapshotId,
      creditReservationId: creditReservation.creditReservationId,
      previewStorageObjectId: previewStorage.previewStorageObjectId,
      durationSeconds: previewRender.durationSeconds,
      sizeBytes: previewRender.sizeBytes,
      checksumSha256: previewRender.checksumSha256,
      metadataJson: {
        ...createSmokeMetadata(smokeRunId),
        renderExecutionMode,
        sourceStorageObjectId: input.sourceStorageObjectId,
        sourceMediaAssetId: input.sourceMediaAssetId,
        mediaProbe,
        commandSummary: previewRender.commandSummary,
        providerCallsEnabled: false,
        stripeCallsEnabled: false,
        cloudRunCallsEnabled: false,
        remotionEnabled: false,
      },
    })
    if (!render.ok || !render.renderId) return pipelineFromRpcFailure(render, rpcReadiness, partialResult)
    partialResult.renderId = render.renderId

    const qa = await recordPreviewQAResultViaRpc(context, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      renderId: render.renderId,
      jobId: jobRender.jobId,
      overallStatus: 'passed',
      summary: 'RPC persisted render smoke QA passed.',
      checksJson: [
        { ...createSmokeMetadata(smokeRunId), check: renderExecutionMode === 'metadata_stub' ? 'preview_metadata_created' : 'preview_object_created', passed: true },
        { ...createSmokeMetadata(smokeRunId), check: 'checksum_created', passed: true },
        { ...createSmokeMetadata(smokeRunId), check: 'canonical_storage_path_only', passed: true },
        { ...createSmokeMetadata(smokeRunId), check: 'provider_calls_not_used', passed: true },
        { ...createSmokeMetadata(smokeRunId), check: 'stripe_calls_not_used', passed: true },
        { ...createSmokeMetadata(smokeRunId), check: 'cloud_run_calls_not_used', passed: true },
        { ...createSmokeMetadata(smokeRunId), check: 'remotion_not_used', passed: true },
      ],
    })
    if (!qa.ok || !qa.qaReportId) return pipelineFromRpcFailure(qa, rpcReadiness, partialResult)
    partialResult.qaReportId = qa.qaReportId

    const complete = await completeRenderJobPreviewReadyViaRpc(context, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      jobId: jobRender.jobId,
      renderJobId: jobRender.renderJobId,
      renderId: render.renderId,
      qaReportId: qa.qaReportId,
      previewStorageObjectId: previewStorage.previewStorageObjectId,
    })
    if (!complete.ok) return pipelineFromRpcFailure(complete, rpcReadiness, partialResult)
    const completeJobEvent = normalizeJobEventResult(complete.jobEvent)
    if (completeJobEvent) eventResults.push(completeJobEvent)

    const release = await releaseWorkerJobClaimViaRpc(context, {
      claimId: claim.workerJobClaimId,
      jobId: jobRender.jobId,
      workerInstanceId: context.env.workerInstanceId,
      releaseStatus: 'completed',
    })
    if (!release.ok) return pipelineFromRpcFailure(release, rpcReadiness, partialResult)

    return {
      ok: true,
      status: 'preview_ready',
      renderExecutionMode,
      smokeRunId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      sourceStorageObjectId: input.sourceStorageObjectId,
      approvedPlanSnapshotId: snapshot.approvedPlanSnapshotId,
      creditReservationId: creditReservation.creditReservationId,
      creditLedgerEntryId: creditReservation.creditLedgerEntryId,
      jobBatchId: jobRender.jobBatchId,
      jobId: jobRender.jobId,
      renderJobId: jobRender.renderJobId,
      workerJobClaimId: claim.workerJobClaimId,
      renderId: render.renderId,
      previewStorageObjectId: previewStorage.previewStorageObjectId,
      qaReportId: qa.qaReportId,
      outputBucketName: previewBucketName,
      outputObjectPath,
      durationSeconds: previewRender.durationSeconds,
      sizeBytes: previewRender.sizeBytes,
      checksumSha256: previewRender.checksumSha256,
      mediaProbe,
      previewRender: {
        durationSeconds: previewRender.durationSeconds,
        sizeBytes: previewRender.sizeBytes,
        checksumSha256: previewRender.checksumSha256,
        commandSummary: previewRender.commandSummary,
      },
      rpcReadiness,
      events: eventResults,
      jobEventIds: eventResults.map((event) => event.jobEventId).filter((id): id is string => Boolean(id)),
      warnings: [...rpcReadiness.warnings],
    }
  } catch (error) {
    if (workerClaimId && jobId) {
      await releaseWorkerJobClaimViaRpc(context, {
        claimId: workerClaimId,
        jobId,
        workerInstanceId: context.env.workerInstanceId,
        releaseStatus: 'failed',
      }).catch(() => undefined)
    }

    return failedPipelineResult('E2E_RPC_PIPELINE_FAILED', error instanceof Error ? error.message : 'RPC persisted render smoke failed.', {
      rpcReadiness,
      events: eventResults,
      partialResult,
    })
  }
}

async function createLocalFfmpegRenderArtifacts(
  context: ServiceContext,
  input: RunPersistedRenderPipelineViaRpcsInput,
  previewBucketName: string,
  outputObjectPath: string,
): Promise<{ mediaProbe: MediaProbeSummary; previewRender: BasicPreviewRenderOutput }> {
  const sourcePath = resolveLocalStorageObjectPath(context.env.localStorageRoot, input.sourceBucketName, input.sourceObjectPath)
  const mediaProbe = await probeMediaFile(sourcePath, {
    ffprobeBin: context.env.ffprobeBin,
    timeoutMs: context.env.toolCheckTimeoutMs,
  })
  const outputPath = resolveLocalStorageObjectPath(context.env.localStorageRoot, previewBucketName, outputObjectPath)
  const previewRender = await createBasicPreview(sourcePath, outputPath, {
    localStorageRoot: context.env.localStorageRoot,
    ffmpegBin: context.env.ffmpegBin,
    timeoutMs: 45000,
    maxDurationSeconds: 3,
    audioMode: 'muted',
  })

  return { mediaProbe, previewRender }
}

function createMetadataStubRenderArtifacts(
  input: RunPersistedRenderPipelineViaRpcsInput,
  smokeRunId: string,
): { mediaProbe: MediaProbeSummary; previewRender: BasicPreviewRenderOutput } {
  const sizeBytes = input.sourceSizeBytes ?? 0
  const checksumSha256 = input.sourceChecksumSha256 ?? `metadata-stub-${smokeRunId}`
  return {
    mediaProbe: {
      durationSeconds: 0,
      width: 320,
      height: 180,
      formatName: 'metadata_stub',
      sizeBytes,
      streamCount: 0,
      rawSummary: {
        renderExecutionMode: 'metadata_stub',
        noMediaProbe: true,
        noExternalRender: true,
      },
    },
    previewRender: {
      durationSeconds: 0,
      sizeBytes,
      checksumSha256,
      commandSummary: {
        tool: 'metadata_stub',
        noExternalRender: true,
        noProviderCalls: true,
        noStripeCalls: true,
        noCloudRunCalls: true,
        noRemotionCalls: true,
      },
    },
  }
}

function normalizeJobEventResult(value: unknown): E2EJobEventRpcResult | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  const jobEventId = typeof record.jobEventId === 'string' ? record.jobEventId : undefined
  if (!jobEventId) return undefined
  return {
    ok: record.ok === true,
    status: typeof record.status === 'string' ? record.status : 'recorded',
    warnings: Array.isArray(record.warnings) ? record.warnings.filter((item): item is string => typeof item === 'string') : [],
    jobEventId,
    eventName: typeof record.eventName === 'string' ? record.eventName : undefined,
    eventType: typeof record.eventType === 'string' ? record.eventType : undefined,
  }
}

export async function runSupabaseRpcReadinessSmoke(context: ServiceContext): Promise<E2ERpcReadinessSmokeResult> {
  if (context.env.supabaseE2eSmokeMode !== 'live') {
    return {
      ok: true,
      status: 'skipped',
      smokeMode: context.env.supabaseE2eSmokeMode,
      liveSupabaseConfigured: context.env.hasSupabaseAdmin,
      warnings: ['Supabase E2E smoke mode is disabled; no live RPC lookup was attempted.'],
      error: {
        code: 'disabled',
        message: 'Set SUPABASE_E2E_SMOKE_MODE=live to run service-role RPC readiness checks.',
      },
    }
  }

  if (!context.clients.admin || !context.env.hasSupabaseAdmin) {
    return {
      ok: false,
      status: 'failed',
      smokeMode: context.env.supabaseE2eSmokeMode,
      liveSupabaseConfigured: false,
      warnings: ['Live Supabase env is incomplete; no service-role RPC lookup was attempted.'],
      error: {
        code: 'missing_env',
        message: 'Live Supabase backend admin configuration is required for service-role RPC readiness checks.',
      },
    }
  }

  const rpcReadiness = await checkE2EServiceRoleRpcReadiness(context.clients.admin)
  return {
    ok: rpcReadiness.ok,
    status: rpcReadiness.ok ? 'passed' : 'failed',
    smokeMode: context.env.supabaseE2eSmokeMode,
    liveSupabaseConfigured: true,
    rpcReadiness,
    warnings: rpcReadiness.warnings,
    error: rpcReadiness.ok ? undefined : {
      code: 'E2E_RPC_MISSING',
      message: 'E2E service-role RPCs are not applied to Supabase.',
      details: { missingRpcs: rpcReadiness.missingRpcs },
    },
  }
}

async function callJsonRpc<T extends RpcResult>(
  context: ServiceContext,
  rpcName: string,
  args: Record<string, unknown>,
): Promise<T> {
  const liveCheck = await getLiveRpcClient(context)
  if (!liveCheck.ok) return liveCheck.result as T

  const { data, error } = await liveCheck.client.rpc(rpcName, args)
  if (error) {
    const missing = error.code === 'PGRST202' || error.code === '42883'
    return {
      ok: false,
      status: missing ? 'missing_rpc' : 'failed',
      warnings: [],
      error: {
        code: missing ? 'E2E_RPC_MISSING' : error.code ?? 'E2E_RPC_FAILED',
        message: missing ? 'E2E service-role RPCs are not applied to Supabase.' : error.message,
        details: { rpcName, hint: error.hint },
      },
    } as unknown as T
  }

  return normalizeRpcData<T>(data)
}

async function getLiveRpcClient(context: ServiceContext, input?: BaseRpcInput): Promise<
  { ok: true; client: SupabaseClient } | { ok: false; result: E2EPersistedRenderPipelineResult | RpcResult }
> {
  if (context.env.supabaseE2eSmokeMode !== 'live') {
    return { ok: false, result: disabledResult(input) }
  }
  if (!context.clients.admin || !context.env.hasSupabaseAdmin) {
    return { ok: false, result: failedResult('missing_env', 'Live Supabase backend admin configuration is required for service-role RPCs.') }
  }
  if (!context.env.supabaseE2eAllowWrites) {
    return { ok: false, result: failedResult('disabled', 'SUPABASE_E2E_ALLOW_WRITES=true is required before service-role RPC writes can run.') }
  }
  const guard = getLiveWriteGuardStatus(context.env)
  if (!guard.ok) {
    return { ok: false, result: failedResult('disabled', `Live write guard blocked service-role RPC writes: ${guard.blockers.join('; ')}`) }
  }

  return { ok: true, client: context.clients.admin }
}

function normalizeRpcData<T extends RpcResult>(data: unknown): T {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, unknown>
    return {
      ...record,
      ok: record.ok === true,
      status: typeof record.status === 'string' ? record.status : record.ok === true ? 'completed' : 'failed',
      warnings: Array.isArray(record.warnings) ? record.warnings.filter((value): value is string => typeof value === 'string') : [],
    } as T
  }

  return {
    ok: false,
    status: 'failed',
    warnings: [],
    error: {
      code: 'E2E_RPC_EMPTY_RESPONSE',
      message: 'Service-role RPC returned an empty or invalid response.',
    },
  } as unknown as T
}

function disabledResult(input?: BaseRpcInput): E2EPersistedRenderPipelineResult {
  return {
    ok: true,
    status: 'disabled',
    workspaceId: input?.workspaceId,
    projectId: input?.projectId,
    warnings: ['Supabase service-role RPC smoke mode is disabled; no live RPC write was attempted.'],
    error: {
      code: 'disabled',
      message: 'Set SUPABASE_E2E_SMOKE_MODE=live and SUPABASE_E2E_ALLOW_WRITES=true to run service-role RPC smoke.',
    },
  }
}

function failedResult(status: string, message: string): E2EPersistedRenderPipelineResult {
  return {
    ok: false,
    status,
    warnings: [],
    error: { code: status, message },
  }
}

function failedPipelineResult(
  code: string,
  message: string,
  input: { warnings?: string[]; rpcReadiness?: RpcReadinessResult; events?: E2EJobEventRpcResult[]; partialResult?: Partial<E2EPersistedRenderPipelineResult> } = {},
): E2EPersistedRenderPipelineResult {
  return {
    ...input.partialResult,
    ok: false,
    status: 'failed',
    rpcReadiness: input.rpcReadiness,
    events: input.events,
    warnings: input.warnings ?? [],
    error: { code, message },
  }
}

function missingRpcPipelineResult(rpcReadiness: RpcReadinessResult): E2EPersistedRenderPipelineResult {
  return {
    ok: false,
    status: 'missing_rpc',
    rpcReadiness,
    warnings: rpcReadiness.warnings,
    error: {
      code: 'E2E_RPC_MISSING',
      message: 'E2E service-role RPCs are not applied to Supabase.',
      details: { missingRpcs: rpcReadiness.missingRpcs },
    },
  }
}

function pipelineFromRpcFailure(
  result: RpcResult,
  rpcReadiness: RpcReadinessResult,
  partialResult: Partial<E2EPersistedRenderPipelineResult> = {},
): E2EPersistedRenderPipelineResult {
  return {
    ...partialResult,
    ok: false,
    status: result.status,
    rpcReadiness,
    warnings: result.warnings,
    error: result.error ?? {
      code: 'E2E_RPC_FAILED',
      message: 'Service-role RPC failed.',
    },
  }
}

function sanitizeRpcPayload(value: Record<string, unknown>): Record<string, unknown> {
  return sanitizeLiveSmokePayload(Object.fromEntries(
    Object.entries(value).filter(([key]) => !/secret|token|api.?key|signed.?url|service.?role/i.test(key)),
  ))
}

export function createRpcSmokeIdempotencyKey(prefix = 'rp-e2e-rpc-render'): string {
  return `${prefix}-${randomUUID()}`
}
