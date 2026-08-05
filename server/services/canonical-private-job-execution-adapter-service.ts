import { createHash } from 'node:crypto'

import { ApiError, normalizeUnknownError } from '../errors/api-error'
import { API_ERROR_CODES, type ApiErrorCode } from '../errors/error-codes'
import {
  isCanonicalPrivateMeteredSourceSliceChunkProfileId,
} from '../../src/types/canonical-private-composition-capacity'
import {
  CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import {
  CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
} from '../../src/types/canonical-caption-specialist-execution'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  getProvenEndToEndToolIdentity,
  listProvenToolIdentityCatalog,
  type ProvenToolRunnerClass,
} from '../tool-execution/proven-tool-identity-catalog'
import {
  PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS,
  privateInternalAttemptCostEvidenceResultSchema,
  resolvePrivateInternalAttemptCostProfileId,
  type PrivateInternalAttemptCostProfileId,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import type { ServiceContext } from '../types'
import {
  canonicalPrivateJobExecutionAdapterResponseSchema,
  canonicalPrivateJobExecutionAdapterFailureSchema,
  executeCanonicalPrivateJobAdapterSchema,
  type CanonicalPrivateJobExecutionAdapterFailure,
  type CanonicalPrivateJobExecutionAdapterResponse,
  type CanonicalPrivateJobExecutionDiagnosticClass,
  type CanonicalPrivateJobExecutionFailureCategory,
  type CanonicalPrivateJobExecutionRetryDisposition,
  type ExecuteCanonicalPrivateJobAdapterBody,
} from '../validation/canonical-private-job-execution-adapter-schemas'
import type { CanonicalExecutionReadinessEnvelope } from '../validation/canonical-execution-readiness-schemas'
import {
  createCanonicalInternalAuthorityRunnerService,
  prepareCanonicalCaptionPlanningExecution,
} from './canonical-internal-authority-runner-service'
import { createCanonicalPrivateAiCapabilityExecutionService } from './canonical-private-ai-capability-execution-service'
import { createCanonicalPrivateAudioFluxAnalysisExecutionService } from './canonical-private-audioflux-analysis-execution-service'
import { createCanonicalPrivateBrowserGraphicsExecutionService } from './canonical-private-browser-graphics-execution-service'
import { createCanonicalPrivateContainerPackagingValidationExecutionService } from './canonical-private-container-packaging-validation-execution-service'
import { createCanonicalPrivateDeepFilterNetVoiceCleanupExecutionService } from './canonical-private-deepfilternet-voice-cleanup-execution-service'
import { createCanonicalPrivateFinalCompositionExecutionService } from './canonical-private-final-composition-execution-service'
import { createCanonicalPrivateLongFormMergeExecutionService } from './canonical-private-long-form-merge-execution-service'
import { createCanonicalPrivateJobCompletionRecoveryService } from './canonical-private-job-completion-recovery-service'
import { createCanonicalPrivateLibassExecutionService } from './canonical-private-libass-execution-service'
import { createCanonicalPrivateMediaBinaryExecutionService } from './canonical-private-media-binary-execution-service'
import { createCanonicalPrivateNativeAudioProcessingExecutionService } from './canonical-private-native-audio-processing-execution-service'
import { createCanonicalPrivateNativeImagePipelineExecutionService } from './canonical-private-native-image-pipeline-execution-service'
import { createCanonicalPrivatePythonToolExecutionService } from './canonical-private-python-tool-execution-service'
import { createCanonicalPrivateRembgBackgroundRemovalExecutionService } from './canonical-private-rembg-background-removal-execution-service'
import { createCanonicalPrivateRemotionExecutionService } from './canonical-private-remotion-execution-service'
import { createCanonicalPrivateSharpExecutionService } from './canonical-private-sharp-execution-service'
import { createCanonicalPrivateStructuredToolExecutionService } from './canonical-private-structured-tool-execution-service'
import { createCanonicalPrivateToolDispatchAuthorityService } from './canonical-private-tool-dispatch-authority-service'
import { createCanonicalPrivateVapourSynthFramePipelineExecutionService } from './canonical-private-vapoursynth-frame-pipeline-execution-service'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
import {
  CANONICAL_PRIVATE_WORKER_LEASE_TTL_SECONDS,
  createCanonicalWorkerLeaseAuthorityService,
  type CanonicalWorkerLeaseInternalExecutionFailureResult,
  type CanonicalWorkerLeaseInternalFailureCategory,
  type CanonicalWorkerLeaseInternalFailureRecoveryPolicy,
} from './canonical-worker-lease-authority-service'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import { getRequiredAuthUserId } from './service-helpers'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'

const RESPONSE_PATH_PREFIX = 'private-internal/canonical-job-execution-adapter/v1'
const adapterExecutionLocks = new Map<string, Promise<void>>()
const LEASE_HEARTBEAT_INTERVAL_MS = Math.floor(
  CANONICAL_PRIVATE_WORKER_LEASE_TTL_SECONDS * 1_000 / 3,
)

export interface ExecuteCanonicalPrivateJobAdapterInput extends ExecuteCanonicalPrivateJobAdapterBody {
  jobId: string
  idempotencyKey: string
}

interface PersistedAdapterResponse {
  schemaVersion: 'canonical-private-job-execution-adapter-idempotency-v1'
  requestHash: string
  response: CanonicalPrivateJobExecutionAdapterResponse
}

interface PersistedAdapterCompletion {
  schemaVersion: 'canonical-private-job-execution-adapter-completion-v1'
  requestHash: string
  response: CanonicalPrivateJobExecutionAdapterResponse
}

interface PersistedAdapterFailure {
  schemaVersion: 'canonical-private-job-execution-adapter-failure-idempotency-v1'
  requestHash: string
  failure: CanonicalPrivateJobExecutionAdapterFailure
}

export async function readCanonicalPrivateJobAdapterCompletion(input: {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  jobId: string
}): Promise<CanonicalPrivateJobExecutionAdapterResponse | undefined> {
  const body: ExecuteCanonicalPrivateJobAdapterBody = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    purpose: 'execute_canonical_private_job',
  }
  const requestHash = sha256AuthorityValue({
    operation: 'execute_canonical_private_job',
    actorUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    jobId: input.jobId,
    purpose: body.purpose,
  })
  return readPersistedCompletionFromRoot(
    input.localStorageRoot,
    adapterCompletionRelativePath(input.ownerUserId, body, input.jobId),
    requestHash,
  )
}

type CoordinatorResponse = Record<string, unknown> & {
  result: Record<string, unknown>
  completedAt: string
  attemptCost?: Record<string, unknown>
}

interface AdapterExecutionFailureResolution {
  lease: {
    attemptNumber: number
    executionFence: {
      state: 'not_started' | 'started' | 'failed' | 'completed'
      executionAttemptId?: string
      failureCategory?: string
      failureCode?: string
      recoveryPolicy?: string
      failedAt?: string
      failureEvidenceHash?: string
      completedAt?: string
    }
  }
  resolution:
    | 'released_before_execution'
    | 'failed_before_commit'
    | 'completed_requires_reconciliation'
  replayed: boolean
}

/**
 * Bridges one immutable canonical job to its exact private/internal runner.
 *
 * The request deliberately contains no snapshot, reservation, tool, operation,
 * output, path, URL, command, provider, price, or credit fields. Every execution
 * identity is reconstructed from server-owned authority before a lease is
 * claimed. This is a single-job adapter, not a whole-work-graph scheduler.
 */
export function createCanonicalPrivateJobExecutionAdapterService(context: ServiceContext) {
  return {
    async execute(input: ExecuteCanonicalPrivateJobAdapterInput): Promise<CanonicalPrivateJobExecutionAdapterResponse> {
      const { jobId, idempotencyKey: rawIdempotencyKey, ...requestBody } = input
      const parsed = executeCanonicalPrivateJobAdapterSchema.safeParse(requestBody)
      if (!parsed.success || !safeIdentity(jobId)) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical private job execution adapter request validation failed.',
          400,
          parsed.success ? { jobId: ['Invalid canonical job identity.'] } : parsed.error.flatten(),
        )
      }
      const body = parsed.data
      const idempotencyKey = requireIdempotencyKey(rawIdempotencyKey)
      const actorUserId = getRequiredAuthUserId(context)
      const requestHash = sha256AuthorityValue({
        operation: 'execute_canonical_private_job',
        actorUserId,
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId,
        purpose: body.purpose,
      })
      const responseRelativePath = adapterResponseRelativePath(actorUserId, body.workspaceId, idempotencyKey)
      const failureRelativePath = adapterFailureRelativePath(responseRelativePath)
      const completionRelativePath = adapterCompletionRelativePath(actorUserId, body, jobId)
      return withAdapterExecutionLock(responseRelativePath, async () => {
        const [replay, failureReplay] = await Promise.all([
          readPersistedResponse(context, responseRelativePath, requestHash),
          readPersistedFailure(context, failureRelativePath, requestHash),
        ])
        const postCommitFailureReplay =
          failureReplay?.failure.category === 'post_commit_reconciliation'
        if (replay && failureReplay && !postCommitFailureReplay) {
          throw new ApiError(
            'VALIDATION_FAILED',
            'Canonical job adapter has conflicting terminal idempotency outcomes.',
            409,
          )
        }
        if (replay) return markReplay(replay)
        if (failureReplay && !postCommitFailureReplay) {
          throw adapterFailureError(failureReplay)
        }
        return withAdapterExecutionLock(completionRelativePath, async () => {
          const completion = await readPersistedCompletion(context, completionRelativePath, requestHash)
          if (completion) {
            await persistIdempotencyResponse(context, responseRelativePath, requestHash, completion)
            return markReplay(completion)
          }

        const readiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId,
        purpose: 'private_internal_dry_run_readiness',
      })).executionReadinessEnvelope
      const authority = await createEditPlanningAuthorityService(context).loadApprovedExecutionAuthority(
        readiness.job.approvedPlanSnapshotId,
        body.workspaceId,
      )
      const workItem = authority.workItems.find((candidate) => candidate.id === readiness.job.approvedWorkItemId)
      if (!workItem) {
        throw new ApiError('JOB_NOT_FOUND', 'Canonical approved work item is missing for this derived job.', 409)
      }
      const expectedAssets = authority.assetManifest.entries.filter((candidate) =>
        candidate.approvedWorkItemId === workItem.id && readiness.job.expectedAssetIds.includes(candidate.id))
      const expectedAsset = selectServerOwnedExpectedAsset(
        expectedAssets,
        readiness.job.expectedAssetIds.length,
      )
      const internalAuthorityJob = workItem.approvedToolIds.length === 0 &&
        workItem.workItemType === 'validate_approved_snapshot'
      const internalSourceTrimJob = workItem.approvedToolIds.length === 0 &&
        workItem.workItemType === 'prepare_source_trim'
      const internalLivingFrameLayerJob =
        workItem.approvedToolIds.length === 0 &&
        workItem.workItemType === 'prepare_remotion_layer' &&
        workItem.executionInput.operation ===
          CANONICAL_LIVING_FRAME_REMOTION_LAYER_WORK_ITEM_OPERATION
      const internalCaptionSpecialistJob =
        workItem.approvedToolIds.length === 0 &&
        workItem.workItemType === 'custom' &&
        workItem.workerClass === CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS &&
        workItem.executionInput.operation ===
          CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION
      const internalServerJob =
        internalAuthorityJob ||
        internalSourceTrimJob ||
        internalLivingFrameLayerJob ||
        internalCaptionSpecialistJob
      let resolvedProvenTool: ReturnType<typeof getProvenEndToEndToolIdentity>
      if (!internalServerJob) {
        if (workItem.approvedToolIds.length !== 1) {
          throw new ApiError(
            'TOOL_NOT_READY',
            'Canonical private job adapter requires exactly one approved tool identity.',
            409,
            { requiredGate: 'canonical_multi_tool_job_execution_adapter' },
          )
        }
        const approvedToolId = workItem.approvedToolIds[0]!
        const catalogRecord = listProvenToolIdentityCatalog().find((candidate) =>
          candidate.canonicalToolId === approvedToolId)
        if (!catalogRecord) {
          throw new ApiError('TOOL_NOT_READY', 'Approved canonical tool identity is not in the proven catalog.', 409)
        }
        resolvedProvenTool = getProvenEndToEndToolIdentity(catalogRecord.canonicalToolId)
        if (!resolvedProvenTool || !resolvedProvenTool.runtime.runnerClass) {
          throw new ApiError(
            'TOOL_NOT_READY',
            'Approved canonical tool has not passed the exact private end-to-end lifecycle.',
            409,
            { requiredGate: 'canonical_tool_lifecycle_evidence' },
          )
        }
      }
      const canonicalToolId = internalServerJob ? null : resolvedProvenTool!.canonicalToolId
      const operationId = internalServerJob
        ? internalCaptionSpecialistJob
          ? CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION
          : internalLivingFrameLayerJob
          ? 'internal.compile_approved_living_frame_remotion_layer_manifest.v1'
          : internalSourceTrimJob
            ? 'internal.validate_approved_source_trim_plan.v1'
            : 'internal.validate_snapshot_manifest.v1'
        : resolvedProvenTool!.operationId
      const runnerClass = internalServerJob
        ? internalCaptionSpecialistJob
          ? 'canonical_caption_specialist_planning_runner_v1'
          : internalLivingFrameLayerJob
          ? 'canonical_living_frame_layer_manifest_runner_v1'
          : internalSourceTrimJob
            ? 'canonical_source_trim_validation_runner_v1'
            : 'canonical_authority_validation_runner_v1'
        : resolvedProvenTool!.runtime.runnerClass!
      const ffmpegMezzanineFinalization = !internalServerJob &&
        resolvedProvenTool!.canonicalToolId === 'ffmpeg' &&
        workItem.workItemType === 'render_final_export' &&
        workItem.executionInput.operation ===
          'finalize_approved_4k_mezzanine_chunks' &&
        expectedAsset.assetRole === 'final'
      const finalCompositionExecution = !internalServerJob &&
        workItem.workItemType === 'render_final_export' &&
        expectedAsset.assetRole === 'final' && (
          resolvedProvenTool!.canonicalToolId === 'remotion' ||
          ffmpegMezzanineFinalization
        )
      const compositionChunkExecution = !internalServerJob &&
        resolvedProvenTool!.canonicalToolId === 'remotion' &&
        workItem.workItemType === 'custom' &&
        workItem.executionInput.operation === 'render_approved_4k_composition_chunk' &&
        expectedAsset.assetRole === 'processed' &&
        expectedAsset.artifactType === 'private_4k_composition_chunk_v1'
      const chunkAuthority = optionalRecord(workItem.executionInput.chunkAuthority)
      const attemptCostProfileId: PrivateInternalAttemptCostProfileId | null =
        !internalServerJob && canonicalToolId === 'deepfilternet'
          ? PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.deepFilterNetVoiceCleanup
          : compositionChunkExecution &&
              isCanonicalPrivateMeteredSourceSliceChunkProfileId(
                chunkAuthority?.profileId,
              )
            ? PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.remotionFourKSourceSliceChunk
            : ffmpegMezzanineFinalization
              ? PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKMezzanineFinalization
              : null
      const longFormMergeExecution = finalCompositionExecution &&
        workItem.executionInput.operation === 'merge_approved_4k_composition_chunks'
      const completionRecoveryService =
        createCanonicalPrivateJobCompletionRecoveryService(context)
      const completionRecoveryInput = {
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId,
        approvedWorkItemId: workItem.id,
        expectedAssetId: expectedAsset.id,
        ...(expectedAsset.contentType ? { expectedContentType: expectedAsset.contentType } : {}),
        canonicalToolId,
        operationId,
        runnerClass,
        internalServerJob,
        finalCompositionExecution,
        attemptCostProfileId,
        readiness,
      }
      const completionRecovery = await completionRecoveryService.recoverIfCompleted(
        completionRecoveryInput,
      )
      if (completionRecovery.status === 'blocked') {
        const originalError = new ApiError(
          'JOB_DEPENDENCY_NOT_READY',
          'Completed canonical execution is waiting for exact recovery evidence.',
          409,
          { requiredGate: completionRecovery.requiredGate },
        )
        const failure = buildAdapterFailure({
          body,
          readiness,
          workItemId: workItem.id,
          expectedAssetId: expectedAsset.id,
          canonicalToolId,
          operationId,
          runnerClass,
          originalError,
          resolution: {
            lease: completionRecovery.lease,
            resolution: 'completed_requires_reconciliation',
            replayed: true,
          },
        })
        await persistAdapterFailure(context, failureRelativePath, requestHash, failure)
        throw adapterFailureError(failure, originalError)
      }
      if (completionRecovery.status === 'recovered') {
        try {
          await persistAdapterCompletion(
            context,
            completionRelativePath,
            requestHash,
            completionRecovery.response,
          )
          await persistIdempotencyResponse(
            context,
            responseRelativePath,
            requestHash,
            completionRecovery.response,
          )
          return completionRecovery.response
        } catch (error) {
          const originalError = normalizeUnknownError(error)
          const failure = buildAdapterFailure({
            body,
            readiness,
            workItemId: workItem.id,
            expectedAssetId: expectedAsset.id,
            canonicalToolId,
            operationId,
            runnerClass,
            originalError,
            resolution: {
              lease: completionRecovery.lease,
              resolution: 'completed_requires_reconciliation',
              replayed: completionRecovery.replayed,
            },
          })
          await persistAdapterFailure(context, failureRelativePath, requestHash, failure)
          throw adapterFailureError(failure, originalError)
        }
      }
      if (internalCaptionSpecialistJob) {
        await prepareCanonicalCaptionPlanningExecution({
          context,
          actorUserId,
          workspaceId: body.workspaceId,
          authority,
          jobId,
        })
      }
      const stageKey = (stage: string) => `job-adapter:${stage}:${sha256(`${idempotencyKey}\u0000${jobId}`).slice(0, 48)}`
      const leaseService = createCanonicalWorkerLeaseAuthorityService(context)
      const claim = (await leaseService.claim({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId,
        purpose: 'private_internal_canonical_lease_claim',
        idempotencyKey: stageKey('claim'),
      })).workerLeaseClaim
      const leaseAuthority = {
        leaseId: claim.lease.leaseId,
        leaseCredential: claim.leaseCredential,
      }

      if (claim.lease.executionFence.state === 'failed') {
        const failure = buildAdapterFailure({
          body,
          readiness,
          workItemId: workItem.id,
          expectedAssetId: expectedAsset.id,
          canonicalToolId,
          operationId,
          runnerClass,
          originalError: new ApiError(
            apiErrorCode(claim.lease.executionFence.failureCode),
            'Canonical worker execution attempt previously failed.',
            409,
          ),
          resolution: {
            lease: {
              attemptNumber: claim.lease.attemptNumber,
              executionFence: claim.lease.executionFence,
            },
            resolution: 'failed_before_commit',
            replayed: true,
          },
        })
        await persistAdapterFailure(context, failureRelativePath, requestHash, failure)
        throw adapterFailureError(failure)
      }

      if (claim.lease.executionFence.state === 'completed') {
        const failure = buildAdapterFailure({
          body,
          readiness,
          workItemId: workItem.id,
          expectedAssetId: expectedAsset.id,
          canonicalToolId,
          operationId,
          runnerClass,
          originalError: new ApiError(
            'JOB_DEPENDENCY_NOT_READY',
            'Canonical execution completed without final adapter reconciliation.',
            409,
          ),
          resolution: {
            lease: {
              attemptNumber: claim.lease.attemptNumber,
              executionFence: claim.lease.executionFence,
            },
            resolution: 'completed_requires_reconciliation',
            replayed: true,
          },
        })
        await persistAdapterFailure(context, failureRelativePath, requestHash, failure)
        throw adapterFailureError(failure)
      }

      const leaseHeartbeat = startCanonicalLeaseHeartbeat({
        leaseService,
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        editSessionId: body.editSessionId,
        jobId,
        leaseId: claim.lease.leaseId,
        leaseCredential: claim.leaseCredential,
        idempotencyKeyForSequence: (sequence) => stageKey(`heartbeat-${sequence}`),
      })
      try {
      let rawResponse: CoordinatorResponse | undefined
      let singleUseDispatchConsumed = false
      let executionFailure: { error: unknown } | undefined

      try {
        if (internalServerJob) {
          rawResponse = asCoordinatorResponse(await createCanonicalInternalAuthorityRunnerService(context).execute({
            workspaceId: body.workspaceId,
            projectId: body.projectId,
            editSessionId: body.editSessionId,
            jobId,
            expectedAssetId: expectedAsset.id,
            purpose: internalCaptionSpecialistJob
              ? 'execute_canonical_internal_caption_specialist_planning'
              : internalLivingFrameLayerJob
              ? 'execute_canonical_internal_living_frame_layer_manifest'
              : internalSourceTrimJob
                ? 'execute_canonical_internal_source_trim_validation'
                : 'execute_canonical_internal_authority_validation',
          }, leaseAuthority))
        } else {
          const provenTool = resolvedProvenTool!
          const provenRunnerClass = provenTool.runtime.runnerClass
          if (!provenRunnerClass) {
            throw new ApiError('TOOL_NOT_READY', 'Approved canonical tool runner identity is unavailable.', 409)
          }
          const grant = (await createCanonicalPrivateToolDispatchAuthorityService(context).authorize({
            workspaceId: body.workspaceId,
            projectId: body.projectId,
            editSessionId: body.editSessionId,
            jobId,
            approvedWorkItemId: workItem.id,
            expectedAssetId: expectedAsset.id,
            requestedToolName: provenTool.canonicalToolId,
            operationId: provenTool.operationId,
            purpose: 'private_internal_canonical_tool_dispatch_authorization',
            idempotencyKey: stageKey('authorize'),
          }, leaseAuthority)).toolDispatchGrant
          if (grant.grant.status !== 'authorized' || !grant.dispatchCredential) {
            await leaseService.release({
              workspaceId: body.workspaceId,
              projectId: body.projectId,
              editSessionId: body.editSessionId,
              jobId,
              leaseId: claim.lease.leaseId,
              leaseCredential: claim.leaseCredential,
              purpose: 'private_internal_canonical_lease_release',
              idempotencyKey: stageKey('release-denied-dispatch'),
            })
            throw new ApiError(
              'TOOL_NOT_READY',
              'Canonical tool dispatch did not issue exact single-use private execution authority.',
              409,
              {
                canonicalToolId,
                operationId,
                dispatchStatus: grant.grant.status,
                privateInternalRuntimeReady: grant.evidence.runtimePrivateInternalReady,
              },
            )
          }
          rawResponse = await executeToolCoordinator({
            context,
            body,
            jobId,
            grantId: grant.grant.grantId,
            idempotencyKey: stageKey('consume'),
            runnerClass: provenRunnerClass,
            finalCompositionExecution,
            compositionChunkExecution,
            longFormMergeExecution,
            serverAuthority: { ...leaseAuthority, dispatchCredential: grant.dispatchCredential },
          })
          singleUseDispatchConsumed = true
        }
      } catch (error) {
        executionFailure = { error }
      }
      const leaseHeartbeatResult = await leaseHeartbeat.stop()
      if (executionFailure) throw executionFailure.error
      if (leaseHeartbeatResult.heartbeatFailure) {
        throw leaseHeartbeatResult.heartbeatFailure
      }
      if (!rawResponse) {
        throw new ApiError(
          'INTERNAL_ERROR',
          'Canonical tool coordinator returned no execution response.',
          500,
        )
      }

      const normalized = normalizeResponse({
        body,
        jobId,
        approvedPlanSnapshotId: readiness.job.approvedPlanSnapshotId,
        approvedWorkItemId: workItem.id,
        expectedAssetId: expectedAsset.id,
        canonicalToolId,
        operationId,
        runnerClass,
        singleUseDispatchConsumed,
        finalCompositionExecution,
        attemptCostProfileId,
        rawResponse,
        idempotentAdapterReplay: false,
        leaseHeartbeatCount: leaseHeartbeatResult.successfulHeartbeatCount,
      })
      const persisted: PersistedAdapterResponse = {
        schemaVersion: 'canonical-private-job-execution-adapter-idempotency-v1',
        requestHash,
        response: normalized,
      }
      await persistAdapterCompletion(context, completionRelativePath, requestHash, normalized)
      await writePrivateFileCreateOnlyWithinRoot({
        rootPath: context.env.localStorageRoot,
        relativePath: responseRelativePath,
        content: Buffer.from(`${stableAuthorityStringify(persisted)}\n`, 'utf8'),
      })
      return normalized
      } catch (error) {
        const originalError = normalizeUnknownError(error)
        const failurePolicy = classifyAdapterExecutionFailure(originalError)
        let resolution: CanonicalWorkerLeaseInternalExecutionFailureResult
        try {
          resolution = await leaseService.failInternalExecution({
            workspaceId: body.workspaceId,
            projectId: body.projectId,
            editSessionId: body.editSessionId,
            jobId,
            leaseId: claim.lease.leaseId,
            leaseCredential: claim.leaseCredential,
            runnerClass,
            failureCategory: failurePolicy.category,
            failureCode: originalError.code,
            recoveryPolicy: failurePolicy.recoveryPolicy,
          })
        } catch (terminalizationError) {
          throw new ApiError(
            'INTERNAL_ERROR',
            'Canonical job failure could not be terminalized safely.',
            500,
            {
              requiredGate: 'canonical_failed_execution_terminalization_recovery',
              originalCode: originalError.code,
            },
            { cause: terminalizationError, internal: true },
          )
        }
        if (resolution.resolution === 'completed_requires_reconciliation') {
          try {
            const postCommitRecovery =
              await completionRecoveryService.recoverIfCompleted(
                completionRecoveryInput,
              )
            if (postCommitRecovery.status === 'recovered') {
              await persistAdapterCompletion(
                context,
                completionRelativePath,
                requestHash,
                postCommitRecovery.response,
              )
              await persistIdempotencyResponse(
                context,
                responseRelativePath,
                requestHash,
                postCommitRecovery.response,
              )
              return postCommitRecovery.response
            }
          } catch {
            // The durable failure record below keeps the completed execution
            // fail-closed when exact server reconciliation cannot be proven.
          }
        }
        const failure = buildAdapterFailure({
          body,
          readiness,
          workItemId: workItem.id,
          expectedAssetId: expectedAsset.id,
          canonicalToolId,
          operationId,
          runnerClass,
          originalError,
          resolution,
        })
        await persistAdapterFailure(context, failureRelativePath, requestHash, failure)
        throw adapterFailureError(failure, originalError)
      }
      })
      })
    },
  }
}

async function executeToolCoordinator(input: {
  context: ServiceContext
  body: ExecuteCanonicalPrivateJobAdapterBody
  jobId: string
  grantId: string
  idempotencyKey: string
  runnerClass: ProvenToolRunnerClass
  finalCompositionExecution: boolean
  compositionChunkExecution: boolean
  longFormMergeExecution: boolean
  serverAuthority: { leaseId: string; leaseCredential: string; dispatchCredential: string }
}): Promise<CoordinatorResponse> {
  const base = {
    workspaceId: input.body.workspaceId,
    projectId: input.body.projectId,
    editSessionId: input.body.editSessionId,
    jobId: input.jobId,
    grantId: input.grantId,
    idempotencyKey: input.idempotencyKey,
  }
  const authority = input.serverAuthority as never
  let response: unknown
  switch (input.runnerClass) {
    case 'offline_node_structured_execution_v1':
      response = await createCanonicalPrivateStructuredToolExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_structured_tool',
      }, authority)
      break
    case 'offline_sharp_structured_execution_v1':
      response = await createCanonicalPrivateSharpExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_sharp_tool',
      }, authority)
      break
    case 'offline_python_structured_execution_v1':
      response = await createCanonicalPrivatePythonToolExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_python_tool',
      }, authority)
      break
    case 'offline_media_binary_execution_v1':
      response = await createCanonicalPrivateMediaBinaryExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_media_binary_tool',
      }, authority)
      break
    case 'offline_remotion_render_execution_v1':
      response = input.longFormMergeExecution
        ? await createCanonicalPrivateLongFormMergeExecutionService(input.context).execute({
            ...base, purpose: 'execute_canonical_private_long_form_merge',
          }, authority)
        : input.compositionChunkExecution
          ? await createCanonicalPrivateFinalCompositionExecutionService(input.context).executeChunk({
              ...base, purpose: 'execute_canonical_private_composition_chunk',
            }, authority)
          : input.finalCompositionExecution
            ? await createCanonicalPrivateFinalCompositionExecutionService(input.context).execute({
            ...base, purpose: 'execute_canonical_private_final_composition',
              }, authority)
            : await createCanonicalPrivateRemotionExecutionService(input.context).execute({
                ...base, purpose: 'execute_canonical_private_remotion_tool',
              }, authority)
      break
    case 'offline_libass_caption_execution_v1':
      response = await createCanonicalPrivateLibassExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_libass_tool',
      }, authority)
      break
    case 'offline_browser_graphics_execution_v1':
      response = await createCanonicalPrivateBrowserGraphicsExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_browser_graphic',
      }, authority)
      break
    case 'offline_ai_capability_execution_v1':
      response = await createCanonicalPrivateAiCapabilityExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_ai_capability',
      }, authority)
      break
    case 'offline_native_image_pipeline_execution_v1':
      response = await createCanonicalPrivateNativeImagePipelineExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_native_image_pipeline',
      }, authority)
      break
    case 'offline_native_audio_processing_execution_v1':
      response = await createCanonicalPrivateNativeAudioProcessingExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_native_audio_processing',
      }, authority)
      break
    case 'offline_container_packaging_validation_execution_v1':
      response = await createCanonicalPrivateContainerPackagingValidationExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_container_packaging_validation',
      }, authority)
      break
    case 'offline_vapoursynth_frame_pipeline_execution_v1':
      response = await createCanonicalPrivateVapourSynthFramePipelineExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_vapoursynth_frame_pipeline',
      }, authority)
      break
    case 'offline_audioflux_analysis_execution_v1':
      response = await createCanonicalPrivateAudioFluxAnalysisExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_audioflux_analysis',
      }, authority)
      break
    case 'offline_rembg_background_removal_execution_v1':
      response = await createCanonicalPrivateRembgBackgroundRemovalExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_rembg_background_removal',
      }, authority)
      break
    case 'offline_deepfilternet_voice_cleanup_execution_v1':
      response = await createCanonicalPrivateDeepFilterNetVoiceCleanupExecutionService(input.context).execute({
        ...base, purpose: 'execute_canonical_private_deepfilternet_voice_cleanup',
      }, authority)
      break
  }
  return asCoordinatorResponse(response)
}

function normalizeResponse(input: {
  body: ExecuteCanonicalPrivateJobAdapterBody
  jobId: string
  approvedPlanSnapshotId: string
  approvedWorkItemId: string
  expectedAssetId: string
  canonicalToolId: string | null
  operationId: string
  runnerClass: string
  singleUseDispatchConsumed: boolean
  finalCompositionExecution: boolean
  attemptCostProfileId: PrivateInternalAttemptCostProfileId | null
  rawResponse: CoordinatorResponse
  idempotentAdapterReplay: boolean
  leaseHeartbeatCount: number
}): CanonicalPrivateJobExecutionAdapterResponse {
  const result = input.rawResponse.result
  const attemptCostEvidenceRecorded = validateAttemptCostResponse({
    rawAttemptCost: input.rawResponse.attemptCost,
    expectedProfileId: input.attemptCostProfileId,
    body: input.body,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    approvedWorkItemId: input.approvedWorkItemId,
    jobId: input.jobId,
    canonicalToolId: input.canonicalToolId,
    operationId: input.operationId,
    rawLease: optionalRecord(input.rawResponse.lease),
    rawResult: result,
  })
  const coordinatorTool = optionalRecord(input.rawResponse.tool)
  const coordinatorInputs = optionalRecord(input.rawResponse.inputs)
  const coordinatorPersistence = optionalRecord(input.rawResponse.persistence)
  const finalArtifactQa = optionalRecord(input.rawResponse.finalArtifactQa)
  const sourceInputMode = coordinatorTool?.sourceInputMode ??
    coordinatorTool?.approvedSourceInputMode
  const sourceStagingCleaned = coordinatorTool?.sourceStagingCleaned ??
    coordinatorTool?.approvedSourceStagingCleaned
  const dependencyInputMode = coordinatorTool?.dependencyInputMode ??
    (coordinatorTool?.approvedColorDependencyInputMode === 'server_injected_private_stream_v1'
      ? coordinatorTool.approvedColorDependencyInputMode
      : coordinatorTool?.approvedVoiceTrackDependencyInputMode ===
          'server_injected_private_stream_v1'
        ? coordinatorTool.approvedVoiceTrackDependencyInputMode
        : coordinatorTool?.approvedSupplementalAudioDependencyInputMode)
  const singleColorInput = optionalRecord(coordinatorInputs?.colorSource)
  const dependencyByteLengths = [
    coordinatorTool?.inputArtifactByteLength,
    singleColorInput?.colorByteLength,
    ...(Array.isArray(coordinatorInputs?.colorSources)
      ? coordinatorInputs.colorSources.map((source) => optionalRecord(source)?.colorByteLength)
      : []),
    ...(Array.isArray(coordinatorInputs?.voiceTracks)
      ? coordinatorInputs.voiceTracks.map((track) => optionalRecord(track)?.voiceByteLength)
      : []),
    ...(Array.isArray(coordinatorInputs?.supplementalAudioTracks)
      ? coordinatorInputs.supplementalAudioTracks.map((track) =>
          optionalRecord(track)?.audioByteLength)
      : []),
    ...(Array.isArray(coordinatorTool?.chunkInputByteLengths)
      ? coordinatorTool.chunkInputByteLengths
      : []),
  ].filter((value) => Number.isSafeInteger(value) && Number(value) > 0)
  const sourceByteLengths = [
    coordinatorTool?.inputArtifactByteLength,
    coordinatorInputs?.sourceByteLength,
    ...(Array.isArray(coordinatorInputs?.sources)
      ? coordinatorInputs.sources.map((source) => optionalRecord(source)?.sourceByteLength)
      : []),
  ].filter((value) => Number.isSafeInteger(value) && Number(value) > 0)
  const dependencyGates = input.finalCompositionExecution
    ? normalizeFinalCompositionDependencyGates(input.rawResponse)
    : result.liveRuntimeDependencySatisfied === undefined
      ? normalizePrivateOnlyCoordinatorDependencyGates(input.rawResponse)
    : {
        privateTestDependencySatisfied: requireLiteral(
          result.privateTestDependencySatisfied,
          true,
          'privateTestDependencySatisfied',
        ),
        liveRuntimeDependencySatisfied: requireLiteral(
          result.liveRuntimeDependencySatisfied,
          false,
          'liveRuntimeDependencySatisfied',
        ),
        finalRenderAuthorized: requireLiteral(result.finalRenderAuthorized, false, 'finalRenderAuthorized'),
      }
  const responseWithoutHash = {
    schemaVersion: 'canonical-private-job-execution-adapter-response-v4' as const,
    source: 'canonical_private_job_execution_adapter' as const,
    purpose: input.body.purpose,
    identity: {
      workspaceId: input.body.workspaceId,
      projectId: input.body.projectId,
      editSessionId: input.body.editSessionId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      jobId: input.jobId,
      approvedWorkItemId: input.approvedWorkItemId,
      expectedAssetId: input.expectedAssetId,
      canonicalToolId: input.canonicalToolId,
      operationId: input.operationId,
      runnerClass: input.runnerClass,
    },
    result: {
      artifactId: requireString(result.artifactId, 'artifactId'),
      contentType: requireString(result.contentType, 'contentType'),
      sha256: requireSha256(result.sha256, 'sha256'),
      byteLength: requirePositiveInteger(result.byteLength, 'byteLength'),
      qaOutcome: requireLiteral(result.qaOutcome, 'passed', 'qaOutcome'),
      reconciliationDecision: requireLiteral(
        result.reconciliationDecision,
        'test_merged_not_live_authorized',
        'reconciliationDecision',
      ),
      ...dependencyGates,
    },
    evidence: {
      serverDerivedCanonicalJob: true as const,
      serverDerivedToolAndOperation: true as const,
      fundedReservationVerified: true as const,
      opaqueLeaseClaimed: true as const,
      singleUseDispatchConsumed: input.singleUseDispatchConsumed,
      privateArtifactPersisted: true as const,
      actualQaPassed: true as const,
      reconciliationPassed: true as const,
      idempotentAdapterReplay: input.idempotentAdapterReplay,
      attemptCostEvidenceRecorded,
      dependencyArtifactInput:
        coordinatorTool?.inputKind === 'qa_passed_dependency_artifact' ||
        coordinatorTool?.dependencyArtifactRead === true,
      dependencyStreamInputVerified:
        dependencyInputMode === 'server_injected_private_stream_v1',
      largeDependencyOverLegacyBufferVerified:
        dependencyInputMode === 'server_injected_private_stream_v1' &&
        dependencyByteLengths.some((byteLength) => Number(byteLength) > 16 * 1024 * 1024),
      finalArtifactQaPassed: finalArtifactQa?.finalQaGatesPassed === true,
      sourceStreamInputVerified:
        sourceInputMode === 'server_injected_private_stream_v1',
      sourceStagingCleanupVerified:
        sourceInputMode === 'server_injected_private_stream_v1' && sourceStagingCleaned === true,
      largeSourceOverLegacyBufferVerified:
        sourceInputMode === 'server_injected_private_stream_v1' &&
        sourceStagingCleaned === true &&
        sourceByteLengths.some((sourceByteLength) => Number(sourceByteLength) > 16 * 1024 * 1024),
      mediaOutputStreamed:
        coordinatorPersistence?.mediaOutputStreamed === true,
      largeMediaOutputOverLegacyBufferVerified:
        coordinatorPersistence?.mediaOutputStreamed === true &&
        coordinatorPersistence.largeMediaOutputOverLegacyBufferVerified === true,
      leaseHeartbeatCount: input.leaseHeartbeatCount,
      longRunningLeaseHeartbeatVerified: input.leaseHeartbeatCount > 0,
    },
    permissions: {
      providerCall: false as const,
      publicArtifact: false as const,
      publicDelivery: false as const,
      productionRender: false as const,
      customerPriceMutation: false as const,
      customerCreditMutation: false as const,
      walletMutation: false as const,
      settlement: false as const,
      billing: false as const,
      deployment: false as const,
    },
    readiness: {
      privateInternalJobExecutionReady: true as const,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
      nextRequiredGate: 'canonical_required_job_capabilities_and_terminal_private_review' as const,
    },
    completedAt: requireString(input.rawResponse.completedAt, 'completedAt'),
    testOnly: true as const,
  }
  return canonicalPrivateJobExecutionAdapterResponseSchema.parse({
    ...responseWithoutHash,
    responseHash: sha256AuthorityValue(responseWithoutHash),
  })
}

function validateAttemptCostResponse(input: {
  rawAttemptCost: unknown
  expectedProfileId: PrivateInternalAttemptCostProfileId | null
  body: ExecuteCanonicalPrivateJobAdapterBody
  approvedPlanSnapshotId: string
  approvedWorkItemId: string
  jobId: string
  canonicalToolId: string | null
  operationId: string
  rawLease: Record<string, unknown> | undefined
  rawResult: Record<string, unknown>
}): boolean {
  if (input.expectedProfileId === null) {
    if (input.rawAttemptCost !== undefined) {
      throw new ApiError(
        'VALIDATION_FAILED',
        'Coordinator returned internal-cost evidence for an unmetered workload.',
        409,
        { requiredGate: 'canonical_scoped_internal_attempt_cost_authority' },
      )
    }
    return false
  }
  const parsed = privateInternalAttemptCostEvidenceResultSchema.safeParse(
    input.rawAttemptCost,
  )
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Coordinator omitted or invalidated required internal attempt-cost evidence.',
      409,
      { requiredGate: 'canonical_scoped_internal_attempt_cost_evidence' },
    )
  }
  const evidence = parsed.data.evidence
  const executionAttemptId = requireString(
    input.rawLease?.executionAttemptId,
    'lease.executionAttemptId',
  )
  if (
    resolvePrivateInternalAttemptCostProfileId(evidence.identity) !==
      input.expectedProfileId ||
    evidence.identity.workspaceId !== input.body.workspaceId ||
    evidence.identity.projectId !== input.body.projectId ||
    evidence.identity.editSessionId !== input.body.editSessionId ||
    evidence.identity.approvedPlanSnapshotId !== input.approvedPlanSnapshotId ||
    evidence.identity.approvedWorkItemId !== input.approvedWorkItemId ||
    evidence.identity.jobId !== input.jobId ||
    evidence.identity.executionAttemptId !== executionAttemptId ||
    evidence.identity.toolId !== input.canonicalToolId ||
    evidence.identity.operationId !== input.operationId ||
    evidence.outcome.status !== 'completed' ||
    evidence.outcome.failureCategory !== 'none' ||
    evidence.resourceUsage.outputByteLength !==
      requirePositiveInteger(input.rawResult.byteLength, 'result.byteLength') ||
    !evidence.linkedCanonicalOutcomeHash
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Coordinator internal attempt-cost evidence diverged from the canonical job outcome.',
      409,
      { requiredGate: 'canonical_scoped_internal_attempt_cost_evidence' },
    )
  }
  return true
}

function buildAdapterFailure(input: {
  body: ExecuteCanonicalPrivateJobAdapterBody
  readiness: CanonicalExecutionReadinessEnvelope
  workItemId: string
  expectedAssetId: string
  canonicalToolId: string | null
  operationId: string
  runnerClass: string
  originalError: ApiError
  resolution: AdapterExecutionFailureResolution
}): CanonicalPrivateJobExecutionAdapterFailure {
  const fence = input.resolution.lease.executionFence
  const remainingAttempts = Math.max(
    0,
    input.readiness.job.maxAttempts - input.resolution.lease.attemptNumber,
  )
  const completedRequiresReconciliation =
    input.resolution.resolution === 'completed_requires_reconciliation'
  const category = completedRequiresReconciliation
    ? 'post_commit_reconciliation' as const
    : failureCategoryFromFence(fence.failureCategory) ??
      classifyAdapterExecutionFailure(input.originalError).category
  const recoveryPolicy = fence.recoveryPolicy ??
    classifyAdapterExecutionFailure(input.originalError).recoveryPolicy
  const retryDisposition: CanonicalPrivateJobExecutionRetryDisposition =
    completedRequiresReconciliation
      ? 'server_reconciliation_required'
      : remainingAttempts > 0 &&
          recoveryPolicy === 'same_operation_retry_within_approved_max_attempts'
        ? 'retry_same_approved_operation'
        : 'fallback_or_user_review_required'
  const requiredGate = retryDisposition === 'retry_same_approved_operation'
    ? 'canonical_retry_same_approved_operation'
    : retryDisposition === 'server_reconciliation_required'
      ? 'canonical_completed_execution_reconciliation_recovery'
      : 'canonical_failure_fallback_user_review_or_new_approval'
  const originalCode = fence.state === 'failed'
    ? apiErrorCode(fence.failureCode)
    : input.originalError.code
  const originRequiredGate = adapterFailureOriginRequiredGate(input.originalError)
  const diagnosticClass = adapterFailureDiagnosticClass({
    category,
    error: input.originalError,
    originRequiredGate,
  })
  const diagnosticFingerprintSha256 = sha256AuthorityValue({
    category,
    diagnosticClass,
    originalCode,
    originRequiredGate: originRequiredGate ?? null,
    status: input.originalError.status,
    messageDigestSha256: sha256AuthorityValue(input.originalError.message),
  })
  const failedAt = fence.state === 'failed' && fence.failedAt
    ? fence.failedAt
    : fence.state === 'completed' && fence.completedAt
      ? fence.completedAt
      : new Date().toISOString()
  const recordWithoutHash = {
    schemaVersion: 'canonical-private-job-execution-adapter-failure-v1' as const,
    source: 'canonical_private_job_execution_adapter' as const,
    purpose: input.body.purpose,
    identity: {
      workspaceId: input.body.workspaceId,
      projectId: input.body.projectId,
      editSessionId: input.body.editSessionId,
      approvedPlanSnapshotId: input.readiness.job.approvedPlanSnapshotId,
      jobId: input.readiness.identity.jobId,
      approvedWorkItemId: input.workItemId,
      expectedAssetId: input.expectedAssetId,
      canonicalToolId: input.canonicalToolId,
      operationId: input.operationId,
      runnerClass: input.runnerClass,
    },
    failure: {
      category,
      originalCode,
      executionState: input.resolution.resolution,
      retryDisposition,
      attemptNumber: input.resolution.lease.attemptNumber,
      approvedMaxAttempts: input.readiness.job.maxAttempts,
      remainingAttempts,
      ...(fence.executionAttemptId ? { executionAttemptId: fence.executionAttemptId } : {}),
      ...(fence.state === 'failed' && fence.failureEvidenceHash
        ? { fenceFailureEvidenceHash: fence.failureEvidenceHash }
        : {}),
      diagnosticClass,
      diagnosticFingerprintSha256,
      ...(originRequiredGate ? { originRequiredGate } : {}),
      requiredGate,
    },
    permissions: deniedPermissions(),
    failedAt,
    testOnly: true as const,
  }
  return canonicalPrivateJobExecutionAdapterFailureSchema.parse({
    ...recordWithoutHash,
    failureRecordHash: sha256AuthorityValue(recordWithoutHash),
  })
}

function adapterFailureOriginRequiredGate(error: ApiError): string | undefined {
  if (!error.details || typeof error.details !== 'object' || Array.isArray(error.details)) {
    return undefined
  }
  const requiredGate = (error.details as Record<string, unknown>).requiredGate
  return typeof requiredGate === 'string' && safeIdentity(requiredGate)
    ? requiredGate
    : undefined
}

function adapterFailureDiagnosticClass(input: {
  category: CanonicalPrivateJobExecutionFailureCategory
  error: ApiError
  originRequiredGate?: string
}): CanonicalPrivateJobExecutionDiagnosticClass {
  if (input.category === 'post_commit_reconciliation') {
    return 'post_commit_reconciliation'
  }
  if (input.category === 'execution_timeout') return 'runtime_timeout'
  if (input.category === 'output_validation_failed') return 'output_validation'
  if (input.category === 'authority_changed') return 'authority_revalidation'
  if (
    input.originRequiredGate?.includes('dispatch') ||
    input.originRequiredGate?.includes('tool_operation')
  ) {
    return 'dispatch_admission'
  }
  if (
    input.category === 'runtime_unavailable' ||
    ['TOOL_NOT_READY', 'RENDER_TOOL_UNAVAILABLE', 'LOCAL_STORAGE_REQUIRED']
      .includes(input.error.code)
  ) {
    return 'runtime_prerequisite_or_launch'
  }
  return 'unknown_internal'
}

function classifyAdapterExecutionFailure(error: ApiError): {
  category: CanonicalWorkerLeaseInternalFailureCategory
  recoveryPolicy: CanonicalWorkerLeaseInternalFailureRecoveryPolicy
} {
  if (error.code === 'WORKER_LEASE_EXPIRED' || error.status === 408) {
    return {
      category: 'execution_timeout',
      recoveryPolicy: 'same_operation_retry_within_approved_max_attempts',
    }
  }
  if ([
    'JOB_DEPENDENCY_NOT_READY',
    'FFMPEG_RENDER_FAILED',
    'FFPROBE_FAILED',
    'PREVIEW_QA_FAILED',
    'FINAL_EXPORT_QA_FAILED',
    'QA_BLOCKED_PREVIEW',
  ].includes(error.code)) {
    return {
      category: 'output_validation_failed',
      recoveryPolicy: 'same_operation_retry_within_approved_max_attempts',
    }
  }
  if ([
    'TOOL_NOT_READY',
    'RENDER_TOOL_UNAVAILABLE',
    'WORKER_CLAIM_CONFLICT',
    'LOCAL_STORAGE_REQUIRED',
  ].includes(error.code)) {
    return {
      category: 'runtime_unavailable',
      recoveryPolicy: 'same_operation_retry_within_approved_max_attempts',
    }
  }
  if ([
    'VALIDATION_FAILED',
    'IDEMPOTENCY_CONFLICT',
    'UPLOAD_NOT_FINALIZED',
    'UPLOAD_SOURCE_MISMATCH',
    'SOURCE_MEDIA_NOT_READY',
    'APPROVED_SNAPSHOT_REQUIRED',
    'PLAN_NOT_APPROVED',
    'CREDIT_ESTIMATE_NOT_APPROVED',
    'CREDITS_NOT_RESERVED',
    'WORKSPACE_ACCESS_DENIED',
  ].includes(error.code)) {
    return {
      category: 'authority_changed',
      recoveryPolicy: 'fallback_or_user_review_required',
    }
  }
  return {
    category: 'unknown_internal',
    recoveryPolicy: 'fallback_or_user_review_required',
  }
}

function failureCategoryFromFence(
  value: string | undefined,
): CanonicalPrivateJobExecutionFailureCategory | undefined {
  if (!value) return undefined
  const values: CanonicalPrivateJobExecutionFailureCategory[] = [
    'runtime_unavailable',
    'execution_timeout',
    'output_validation_failed',
    'authority_changed',
    'unknown_internal',
    'post_commit_reconciliation',
  ]
  return values.includes(value as CanonicalPrivateJobExecutionFailureCategory)
    ? value as CanonicalPrivateJobExecutionFailureCategory
    : undefined
}

function adapterFailureError(
  failure: CanonicalPrivateJobExecutionAdapterFailure,
  cause?: ApiError,
): ApiError {
  return new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    failure.failure.retryDisposition === 'retry_same_approved_operation'
      ? 'Canonical job attempt failed safely; the same approved operation may be retried within its attempt limit.'
      : [
          'manual_reconciliation_required',
          'server_reconciliation_required',
        ].includes(failure.failure.retryDisposition)
        ? 'Canonical execution committed but final adapter reconciliation requires recovery.'
        : 'Canonical job failure requires an approved fallback, user review, or new approval.',
    409,
    {
      requiredGate: failure.failure.requiredGate,
      executionFailure: {
        failureRecordHash: failure.failureRecordHash,
        category: failure.failure.category,
        diagnosticClass: failure.failure.diagnosticClass,
        diagnosticFingerprintSha256:
          failure.failure.diagnosticFingerprintSha256,
        ...(failure.failure.originRequiredGate
          ? { originRequiredGate: failure.failure.originRequiredGate }
          : {}),
        originalCode: failure.failure.originalCode,
        executionState: failure.failure.executionState,
        retryDisposition: failure.failure.retryDisposition,
        attemptNumber: failure.failure.attemptNumber,
        approvedMaxAttempts: failure.failure.approvedMaxAttempts,
        remainingAttempts: failure.failure.remainingAttempts,
        ...(failure.failure.fenceFailureEvidenceHash
          ? { fenceFailureEvidenceHash: failure.failure.fenceFailureEvidenceHash }
          : {}),
      },
    },
    cause ? { cause } : {},
  )
}

function deniedPermissions() {
  return {
    providerCall: false as const,
    publicArtifact: false as const,
    publicDelivery: false as const,
    productionRender: false as const,
    customerPriceMutation: false as const,
    customerCreditMutation: false as const,
    walletMutation: false as const,
    settlement: false as const,
    billing: false as const,
    deployment: false as const,
  }
}

function apiErrorCode(value: string | undefined): ApiErrorCode {
  return value && API_ERROR_CODES.includes(value as ApiErrorCode)
    ? value as ApiErrorCode
    : 'INTERNAL_ERROR'
}

function selectServerOwnedExpectedAsset<T extends { id: string; required: boolean }>(
  expectedAssets: readonly T[],
  expectedAssetIdCount: number,
): T {
  if (expectedAssets.length === 0 || expectedAssets.length !== expectedAssetIdCount) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical private job output authority is incomplete or inconsistent.',
      409,
      { requiredGate: 'canonical_expected_output_authority_reconciliation' },
    )
  }
  if (expectedAssets.length === 1) return expectedAssets[0]!
  const requiredAssets = expectedAssets.filter((candidate) => candidate.required)
  if (requiredAssets.length === 1) return requiredAssets[0]!
  throw new ApiError(
    'TOOL_NOT_READY',
    'Canonical private job adapter requires one unambiguous server-owned required output.',
    409,
    { requiredGate: 'canonical_multi_required_output_job_execution_adapter' },
  )
}

function markReplay(response: CanonicalPrivateJobExecutionAdapterResponse): CanonicalPrivateJobExecutionAdapterResponse {
  const { responseHash, ...withoutHash } = response
  if (responseHash !== sha256AuthorityValue(withoutHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical job adapter replay response hash is invalid.', 409)
  }
  return canonicalPrivateJobExecutionAdapterResponseSchema.parse({
    ...withoutHash,
    evidence: { ...withoutHash.evidence, idempotentAdapterReplay: true },
    responseHash: sha256AuthorityValue({
      ...withoutHash,
      evidence: { ...withoutHash.evidence, idempotentAdapterReplay: true },
    }),
  })
}

function normalizePrivateOnlyCoordinatorDependencyGates(response: CoordinatorResponse): {
  privateTestDependencySatisfied: true
  liveRuntimeDependencySatisfied: false
  finalRenderAuthorized: false
} {
  const result = response.result
  const permissions = requireRecord(response.permissions, 'permissions')
  const runtime = requireRecord(response.runtime, 'runtime')
  requireLiteral(result.privateTestDependencySatisfied, true, 'privateTestDependencySatisfied')
  requireLiteral(result.finalRenderAuthorized, false, 'finalRenderAuthorized')
  requireLiteral(runtime.productReady, false, 'runtime.productReady')
  requireLiteral(runtime.externalBetaReady, false, 'runtime.externalBetaReady')
  requireLiteral(runtime.productionReady, false, 'runtime.productionReady')
  const delivery = permissions.publicDelivery ?? permissions.delivery
  requireLiteral(delivery, false, 'permissions.delivery')
  return {
    privateTestDependencySatisfied: true,
    liveRuntimeDependencySatisfied: false,
    finalRenderAuthorized: false,
  }
}

function normalizeFinalCompositionDependencyGates(response: CoordinatorResponse): {
  privateTestDependencySatisfied: true
  liveRuntimeDependencySatisfied: false
  finalRenderAuthorized: false
} {
  const result = response.result
  const permissions = requireRecord(response.permissions, 'permissions')
  const runtime = requireRecord(response.runtime, 'runtime')
  if (result.privateFinalArtifactRecorded === undefined) {
    requireLiteral(
      result.privateTestDependencySatisfied,
      true,
      'privateTestDependencySatisfied',
    )
    requireLiteral(result.finalRenderAuthorized, false, 'finalRenderAuthorized')
    requireLiteral(permissions.render, false, 'permissions.render')
    requireLiteral(permissions.delivery, false, 'permissions.delivery')
    requireLiteral(permissions.settlement, false, 'permissions.settlement')
  } else {
    requireLiteral(result.privateFinalArtifactRecorded, true, 'privateFinalArtifactRecorded')
    requireLiteral(result.publicDeliveryAuthorized, false, 'publicDeliveryAuthorized')
    requireLiteral(result.settlementAuthorized, false, 'settlementAuthorized')
    requireLiteral(permissions.furtherRender, false, 'permissions.furtherRender')
    requireLiteral(permissions.publicDelivery, false, 'permissions.publicDelivery')
  }
  requireLiteral(runtime.productReady, false, 'runtime.productReady')
  requireLiteral(runtime.externalBetaReady, false, 'runtime.externalBetaReady')
  requireLiteral(runtime.productionReady, false, 'runtime.productionReady')
  return {
    privateTestDependencySatisfied: true,
    liveRuntimeDependencySatisfied: false,
    finalRenderAuthorized: false,
  }
}

async function readPersistedResponse(
  context: ServiceContext,
  relativePath: string,
  requestHash: string,
): Promise<CanonicalPrivateJobExecutionAdapterResponse | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
  })
  if (!bytes) return undefined
  let value: unknown
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter response is invalid JSON.', 409)
  }
  if (!value || typeof value !== 'object') {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter response is invalid.', 409)
  }
  const record = value as Partial<PersistedAdapterResponse>
  if (record.schemaVersion !== 'canonical-private-job-execution-adapter-idempotency-v1') {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter response version is invalid.', 409)
  }
  if (record.requestHash !== requestHash) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused for a different canonical job.', 409)
  }
  const response = canonicalPrivateJobExecutionAdapterResponseSchema.safeParse(record.response)
  if (!response.success) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter response failed validation.', 409)
  }
  const { responseHash, ...withoutHash } = response.data
  if (responseHash !== sha256AuthorityValue(withoutHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter response hash is invalid.', 409)
  }
  return response.data
}

async function readPersistedFailure(
  context: ServiceContext,
  relativePath: string,
  requestHash: string,
): Promise<CanonicalPrivateJobExecutionAdapterFailure | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
  })
  if (!bytes) return undefined
  let value: unknown
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter failure is invalid JSON.', 409)
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter failure is invalid.', 409)
  }
  const record = value as Partial<PersistedAdapterFailure>
  if (record.schemaVersion !== 'canonical-private-job-execution-adapter-failure-idempotency-v1') {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter failure version is invalid.', 409)
  }
  if (record.requestHash !== requestHash) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused for another canonical job.', 409)
  }
  const failure = canonicalPrivateJobExecutionAdapterFailureSchema.safeParse(record.failure)
  if (!failure.success) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter failure failed validation.', 409)
  }
  const { failureRecordHash, ...withoutHash } = failure.data
  if (failureRecordHash !== sha256AuthorityValue(withoutHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job adapter failure hash is invalid.', 409)
  }
  return failure.data
}

async function readPersistedCompletion(
  context: ServiceContext,
  relativePath: string,
  requestHash: string,
): Promise<CanonicalPrivateJobExecutionAdapterResponse | undefined> {
  return readPersistedCompletionFromRoot(context.env.localStorageRoot, relativePath, requestHash)
}

async function readPersistedCompletionFromRoot(
  localStorageRoot: string,
  relativePath: string,
  requestHash: string,
): Promise<CanonicalPrivateJobExecutionAdapterResponse | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath,
  })
  if (!bytes) return undefined
  let value: unknown
  try {
    value = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job completion is invalid JSON.', 409)
  }
  if (!value || typeof value !== 'object') {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job completion is invalid.', 409)
  }
  const record = value as Partial<PersistedAdapterCompletion>
  if (record.schemaVersion !== 'canonical-private-job-execution-adapter-completion-v1') {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job completion version is invalid.', 409)
  }
  if (record.requestHash !== requestHash) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job completion scope is invalid.', 409)
  }
  const response = canonicalPrivateJobExecutionAdapterResponseSchema.safeParse(record.response)
  if (!response.success) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job completion failed validation.', 409)
  }
  const { responseHash, ...withoutHash } = response.data
  if (responseHash !== sha256AuthorityValue(withoutHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Persisted canonical job completion hash is invalid.', 409)
  }
  return response.data
}

async function persistIdempotencyResponse(
  context: ServiceContext,
  relativePath: string,
  requestHash: string,
  response: CanonicalPrivateJobExecutionAdapterResponse,
): Promise<void> {
  const persisted: PersistedAdapterResponse = {
    schemaVersion: 'canonical-private-job-execution-adapter-idempotency-v1',
    requestHash,
    response,
  }
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
    content: Buffer.from(`${stableAuthorityStringify(persisted)}\n`, 'utf8'),
  })
}

async function persistAdapterCompletion(
  context: ServiceContext,
  relativePath: string,
  requestHash: string,
  response: CanonicalPrivateJobExecutionAdapterResponse,
): Promise<void> {
  const persisted: PersistedAdapterCompletion = {
    schemaVersion: 'canonical-private-job-execution-adapter-completion-v1',
    requestHash,
    response,
  }
  try {
    await writePrivateFileCreateOnlyWithinRoot({
      rootPath: context.env.localStorageRoot,
      relativePath,
      content: Buffer.from(`${stableAuthorityStringify(persisted)}\n`, 'utf8'),
    })
  } catch (error) {
    if (!(error instanceof ApiError) || error.code !== 'IDEMPOTENCY_CONFLICT') throw error
    const existing = await readPersistedCompletion(context, relativePath, requestHash)
    if (!existing || existing.responseHash !== response.responseHash) {
      throw new ApiError('IDEMPOTENCY_CONFLICT', 'Canonical job completion changed during persistence.', 409)
    }
  }
}

async function persistAdapterFailure(
  context: ServiceContext,
  relativePath: string,
  requestHash: string,
  failure: CanonicalPrivateJobExecutionAdapterFailure,
): Promise<void> {
  const persisted: PersistedAdapterFailure = {
    schemaVersion: 'canonical-private-job-execution-adapter-failure-idempotency-v1',
    requestHash,
    failure,
  }
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: context.env.localStorageRoot,
    relativePath,
    content: Buffer.from(`${stableAuthorityStringify(persisted)}\n`, 'utf8'),
  })
}

function adapterResponseRelativePath(ownerUserId: string, workspaceId: string, idempotencyKey: string): string {
  const scopeHash = sha256(`${ownerUserId}\u0000${workspaceId}`)
  const keyHash = sha256(`${scopeHash}\u0000${idempotencyKey}`)
  return `${RESPONSE_PATH_PREFIX}/${scopeHash.slice(0, 32)}/${keyHash}.json`
}

function adapterFailureRelativePath(responseRelativePath: string): string {
  return responseRelativePath.replace(/\.json$/, '.failure.json')
}

function adapterCompletionRelativePath(
  ownerUserId: string,
  body: ExecuteCanonicalPrivateJobAdapterBody,
  jobId: string,
): string {
  const scopeHash = sha256(`${ownerUserId}\u0000${body.workspaceId}`)
  const jobHash = sha256([
    scopeHash,
    body.projectId,
    body.editSessionId,
    jobId,
  ].join('\u0000'))
  return `${RESPONSE_PATH_PREFIX}/${scopeHash.slice(0, 32)}/completed-jobs/${jobHash}.json`
}

function startCanonicalLeaseHeartbeat(input: {
  leaseService: ReturnType<typeof createCanonicalWorkerLeaseAuthorityService>
  workspaceId: string
  projectId: string
  editSessionId: string
  jobId: string
  leaseId: string
  leaseCredential: string
  idempotencyKeyForSequence(sequence: number): string
}): {
  stop(): Promise<{
    successfulHeartbeatCount: number
    heartbeatFailure?: ApiError
  }>
} {
  let stopped = false
  let sequence = 0
  let successfulHeartbeatCount = 0
  let heartbeatFailure: ApiError | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let activeHeartbeat: Promise<void> | undefined

  const schedule = () => {
    if (stopped) return
    timer = setTimeout(() => {
      activeHeartbeat = runHeartbeat()
    }, LEASE_HEARTBEAT_INTERVAL_MS)
    timer.unref()
  }
  const runHeartbeat = async () => {
    if (stopped) return
    sequence += 1
    try {
      await input.leaseService.heartbeat({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        jobId: input.jobId,
        leaseId: input.leaseId,
        leaseCredential: input.leaseCredential,
        purpose: 'private_internal_canonical_lease_heartbeat',
        idempotencyKey: input.idempotencyKeyForSequence(sequence),
      })
      successfulHeartbeatCount += 1
    } catch (error) {
      heartbeatFailure = normalizeUnknownError(error)
      stopped = true
    } finally {
      activeHeartbeat = undefined
      schedule()
    }
  }

  schedule()
  return {
    async stop() {
      stopped = true
      if (timer) clearTimeout(timer)
      await activeHeartbeat
      return {
        successfulHeartbeatCount,
        ...(heartbeatFailure ? { heartbeatFailure } : {}),
      }
    },
  }
}

async function withAdapterExecutionLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = adapterExecutionLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const tail = previous.catch(() => undefined).then(() => current)
  adapterExecutionLocks.set(key, tail)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (adapterExecutionLocks.get(key) === tail) adapterExecutionLocks.delete(key)
  }
}

function asCoordinatorResponse(value: unknown): CoordinatorResponse {
  if (
    !value || typeof value !== 'object' ||
    !('result' in value) || !value.result || typeof value.result !== 'object' ||
    !('completedAt' in value) || typeof value.completedAt !== 'string'
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical runner returned an invalid adapter response.', 409)
  }
  return value as CoordinatorResponse
}

function requireIdempotencyKey(value: string | undefined): string {
  const normalized = value?.trim()
  if (
    !normalized || normalized.length < 8 || normalized.length > 240 ||
    Array.from(normalized).some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
  ) {
    throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'A valid Idempotency-Key is required.', 400)
  }
  return normalized
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError('VALIDATION_FAILED', `Canonical runner result is missing ${field}.`, 409)
  }
  return value
}

function requireSha256(value: unknown, field: string): string {
  const result = requireString(value, field)
  if (!/^[a-f0-9]{64}$/.test(result)) {
    throw new ApiError('VALIDATION_FAILED', `Canonical runner result has invalid ${field}.`, 409)
  }
  return result
}

function requirePositiveInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new ApiError('VALIDATION_FAILED', `Canonical runner result has invalid ${field}.`, 409)
  }
  return value
}

function requireRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('VALIDATION_FAILED', `Canonical runner result has invalid ${field}.`, 409)
  }
  return value as Record<string, unknown>
}

function optionalRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function requireLiteral<T extends string | boolean>(value: unknown, expected: T, field: string): T {
  if (value !== expected) {
    throw new ApiError('VALIDATION_FAILED', `Canonical runner result has invalid ${field}.`, 409)
  }
  return expected
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
