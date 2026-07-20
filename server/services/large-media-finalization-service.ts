import { ApiError } from '../errors/api-error'
import { isPrivateSourceProbeTerminalIntegrityError } from '../media/private-source-probe-staging'
import type { ServiceContext } from '../types'
import type { LargeMediaFinalizationJobResult } from '../validation/large-media-finalization-schemas'
import {
  claimPrivateLargeMediaFinalizationJob,
  completePrivateLargeMediaFinalizationJob,
  enqueuePrivateLargeMediaFinalizationJob,
  failPrivateLargeMediaFinalizationJob,
  heartbeatPrivateLargeMediaFinalizationJob,
  largeMediaFinalizationJobId,
  readPrivateLargeMediaFinalizationJob,
  type PrivateLargeMediaFinalizationScope,
} from './private-large-media-finalization-authority-store'
import { privateUploadMediaAuthorityValueHash } from './private-upload-media-authority-store'
import { createUploadService } from './upload-service'
import {
  inspectLargeMediaFinalizationCapacity,
  reserveLargeMediaWorkerCapacity,
  type LargeMediaWorkerCapacityAssessment,
  type LargeMediaWorkerCapacityReservation,
} from '../workers/media/media-worker-capacity-policy'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const GIB = 1024 ** 3

interface FinalizationExecutionResult {
  uploadIntent: { id: string }
  storageObjectRecord: {
    id: string
    sizeBytes?: number
    checksumSha256?: string
  }
  mediaAsset: {
    id: string
    sizeBytes?: number
    checksumSha256?: string
    sourceMetadata?: LargeMediaFinalizationJobResult['sourceMetadata']
  }
}

interface LargeMediaFinalizationServiceDependencies {
  executeFinalization?: (
    context: ServiceContext,
    input: { workspaceId: string; uploadIntentId: string; expectedSizeBytes: number },
  ) => Promise<FinalizationExecutionResult>
  inspectWorkerCapacity?: (input: {
    filesystemPath: string
    expectedSourceBytes: number
  }) => Promise<LargeMediaWorkerCapacityAssessment>
  now?: () => Date
}

export interface LargeMediaFinalizationJobView {
  jobId: string
  workspaceId: string
  projectId: string
  uploadIntentId: string
  uploadPurpose: 'source_media' | 'reference_media'
  expectedSizeBytes: number
  status: 'queued' | 'running' | 'completed' | 'failed_retryable' | 'failed_terminal'
  progressStage:
    | 'waiting_for_background_worker'
    | 'verifying_hash_and_media_metadata'
    | 'canonical_source_ready'
    | 'retry_available'
    | 'manual_review_required'
  attemptCount: number
  maximumAttempts: number
  retryAvailable: boolean
  result?: LargeMediaFinalizationJobResult
  failure?: { code: string; summary: string; retryable: boolean }
  createdAt: string
  updatedAt: string
  completedAt?: string
  pollAfterMs: number
  privateInternalOnly: true
  productReady: false
  externalBetaReady: false
  productionReady: false
}

export function createLargeMediaFinalizationService(
  context: ServiceContext,
  dependencies: LargeMediaFinalizationServiceDependencies = {},
) {
  const now = dependencies.now ?? (() => new Date())
  const uploadService = createUploadService(context)
  const executeFinalization = dependencies.executeFinalization ?? defaultFinalizationExecutor
  const inspectWorkerCapacity = dependencies.inspectWorkerCapacity ?? inspectLargeMediaFinalizationCapacity

  return {
    async enqueue(input: {
      workspaceId: string
      uploadIntentId: string
      suppliedSizeBytes: number
      idempotencyKey: string
    }): Promise<{ job: LargeMediaFinalizationJobView; warnings: string[] }> {
      assertPrivateInternalBoundary(context)
      const candidate = await uploadService.getUploadFinalizationCandidate(
        input.uploadIntentId,
        input.workspaceId,
      )
      if (candidate.status === 'failed') {
        throw new ApiError('UPLOAD_NOT_FINALIZED', 'Failed upload media cannot be queued for finalization.', 409)
      }
      if (candidate.status === 'finalized') {
        const existing = await readPrivateLargeMediaFinalizationJob({
          scope: scopeFor(context, input.workspaceId),
          jobId: largeMediaFinalizationJobId({
            ownerUserId: candidate.ownerUserId,
            workspaceId: candidate.workspaceId,
            uploadIntentId: candidate.uploadIntentId,
          }),
        })
        if (existing?.status === 'completed') {
          return { job: toJobView(existing), warnings: ['Large-media finalization already completed.'] }
        }
        throw new ApiError(
          'UPLOAD_NOT_FINALIZED',
          'Upload is already finalized outside the large-media background job.',
          409,
        )
      }
      if (!candidate.backgroundFinalizationRequired || candidate.storageMode !== 'gcs') {
        throw new ApiError(
          'SOURCE_MEDIA_NOT_READY',
          'This source does not require the large-media background finalization path.',
          409,
          { backgroundFinalizationRequired: false, nextAction: 'finalize_upload_intent_inline' },
        )
      }
      if (input.suppliedSizeBytes !== candidate.expectedSizeBytes) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Large-media finalization size must match the upload intent.',
          400,
        )
      }
      const requestHash = privateUploadMediaAuthorityValueHash({
        purpose: 'queue_restart_safe_large_media_finalization',
        authorityFingerprint: candidate.authorityFingerprint,
        expectedSizeBytes: candidate.expectedSizeBytes,
        processingPolicyId: 'restart_safe_hash_probe_finalize_v1',
      })
      const queued = await enqueuePrivateLargeMediaFinalizationJob({
        scope: scopeFor(context, input.workspaceId),
        projectId: candidate.projectId,
        uploadIntentId: candidate.uploadIntentId,
        uploadPurpose: candidate.uploadPurpose,
        expectedSizeBytes: candidate.expectedSizeBytes,
        idempotencyKey: input.idempotencyKey,
        requestHash,
        now: now().toISOString(),
      })
      return {
        job: toJobView(queued),
        warnings: [
          'The uploaded object remains private while a restart-safe worker verifies bytes and media metadata.',
          'Editing, providers, rendering, credits, public delivery, and production activation have not started.',
        ],
      }
    },

    async get(input: {
      workspaceId: string
      jobId: string
    }): Promise<{ job: LargeMediaFinalizationJobView; warnings: string[] }> {
      assertPrivateInternalBoundary(context)
      const job = await readRequiredJob(context, input.workspaceId, input.jobId)
      await uploadService.getUploadFinalizationCandidate(job.uploadIntentId, input.workspaceId)
      return {
        job: toJobView(job),
        warnings: job.status === 'completed'
          ? ['Canonical private source authority is ready; this does not approve or begin editing.']
          : ['Large-media source authority is not ready until background finalization completes.'],
      }
    },

    async run(input: {
      workspaceId: string
      jobId: string
    }): Promise<{ job: LargeMediaFinalizationJobView; executionStarted: boolean; warnings: string[] }> {
      assertPrivateInternalBoundary(context)
      const scope = scopeFor(context, input.workspaceId)
      const existing = await readRequiredJob(context, input.workspaceId, input.jobId)
      await uploadService.getUploadFinalizationCandidate(existing.uploadIntentId, input.workspaceId)
      let capacityReservation: LargeMediaWorkerCapacityReservation | undefined
      if (existing.status === 'queued' || existing.status === 'failed_retryable') {
        const capacity = await inspectWorkerCapacity({
          filesystemPath: context.env.localStorageRoot,
          expectedSourceBytes: existing.expectedSizeBytes,
        })
        if (!capacity.byteTraversalAuthorized) {
          return {
            job: toJobView(existing),
            executionStarted: false,
            warnings: [capacity.status === 'insufficient'
              ? 'This worker does not have enough verified private staging capacity for the source; no object bytes were read and another appropriately sized worker may retry.'
              : 'Worker staging capacity could not be verified; no object bytes were read and the finalization job remains queued safely.'],
          }
        }
        capacityReservation = reserveLargeMediaWorkerCapacity({
          filesystemPath: context.env.localStorageRoot,
          assessment: capacity,
        })
        if (!capacityReservation.acquired) {
          return {
            job: toJobView(existing),
            executionStarted: false,
            warnings: ['This worker already reserved its verified private staging capacity for another large source; no object bytes were read and no attempt was consumed.'],
          }
        }
      }
      const claimTime = now().toISOString()
      const leaseDurationMs = boundedLeaseDurationMs(context.env.workerClaimLeaseSeconds * 1_000)
      const claim = await claimPrivateLargeMediaFinalizationJob({
        scope,
        jobId: input.jobId,
        workerInstanceId: context.env.workerInstanceId,
        now: claimTime,
        leaseDurationMs,
        attemptTimeoutMs: deriveFinalizationAttemptTimeoutMs(existing.expectedSizeBytes),
      }).catch((error) => {
        capacityReservation?.release()
        throw error
      })
      if (claim.disposition !== 'claimed') {
        capacityReservation?.release()
        return {
          job: toJobView(claim.job),
          executionStarted: false,
          warnings: [claim.disposition === 'already_running'
            ? 'Another private worker already owns the active finalization lease.'
            : 'No new finalization execution was started.'],
        }
      }

      let heartbeatInFlight: Promise<void> | undefined
      let heartbeatFailure: unknown
      const heartbeatEveryMs = Math.max(10_000, Math.floor(leaseDurationMs / 3))
      const heartbeatTimer = setInterval(() => {
        if (heartbeatInFlight || heartbeatFailure) return
        heartbeatInFlight = heartbeatPrivateLargeMediaFinalizationJob({
          scope,
          jobId: claim.job.jobId,
          leaseId: claim.job.lease!.leaseId,
          leaseCredential: claim.leaseCredential,
          now: now().toISOString(),
          leaseDurationMs,
        }).then(() => undefined).catch((error) => { heartbeatFailure = error }).finally(() => {
          heartbeatInFlight = undefined
        })
      }, heartbeatEveryMs)
      heartbeatTimer.unref?.()

      try {
        const finalized = await executeFinalization(context, {
          workspaceId: claim.job.workspaceId,
          uploadIntentId: claim.job.uploadIntentId,
          expectedSizeBytes: claim.job.expectedSizeBytes,
        })
        clearInterval(heartbeatTimer)
        if (heartbeatInFlight) await heartbeatInFlight
        if (heartbeatFailure) throw heartbeatFailure
        const result = exactFinalizationResult(claim.job.uploadIntentId, finalized)
        const completed = await completePrivateLargeMediaFinalizationJob({
          scope,
          jobId: claim.job.jobId,
          leaseId: claim.job.lease!.leaseId,
          leaseCredential: claim.leaseCredential,
          result,
          now: now().toISOString(),
        })
        return {
          job: toJobView(completed),
          executionStarted: true,
          warnings: [
            'Large-media hash, probe, and canonical private source finalization completed under one leased background attempt.',
            'The immutable original remains the final-render source; no editing or render was started.',
          ],
        }
      } catch (error) {
        clearInterval(heartbeatTimer)
        if (heartbeatInFlight) await heartbeatInFlight.catch(() => undefined)
        const failure = classifyFinalizationFailure(error)
        const failed = await failPrivateLargeMediaFinalizationJob({
          scope,
          jobId: claim.job.jobId,
          leaseId: claim.job.lease!.leaseId,
          leaseCredential: claim.leaseCredential,
          ...failure,
          now: now().toISOString(),
        }).catch((leaseError) => {
          throw new ApiError(
            'INTERNAL_ERROR',
            'Large-media finalization failed and its leased outcome could not be committed.',
            500,
            undefined,
            { cause: leaseError, internal: true },
          )
        })
        return {
          job: toJobView(failed),
          executionStarted: true,
          warnings: [failed.status === 'failed_retryable'
            ? 'The private source remains queued for a bounded retry; no editing started.'
            : 'Finalization failed closed and requires review before the source can enter planning.'],
        }
      } finally {
        capacityReservation?.release()
      }
    },
  }
}

async function defaultFinalizationExecutor(
  context: ServiceContext,
  input: { workspaceId: string; uploadIntentId: string; expectedSizeBytes: number },
): Promise<FinalizationExecutionResult> {
  return createUploadService(context).finalizeUploadIntent({
    workspaceId: input.workspaceId,
    uploadIntentId: input.uploadIntentId,
    sizeBytes: input.expectedSizeBytes,
  }, { backgroundWorkerAuthority: true })
}

function exactFinalizationResult(
  uploadIntentId: string,
  finalized: FinalizationExecutionResult,
): LargeMediaFinalizationJobResult {
  const sizeBytes = finalized.storageObjectRecord.sizeBytes ?? finalized.mediaAsset.sizeBytes
  const checksumSha256 = (
    finalized.storageObjectRecord.checksumSha256 ?? finalized.mediaAsset.checksumSha256 ?? ''
  ).toLowerCase()
  if (
    finalized.uploadIntent.id !== uploadIntentId ||
    !Number.isSafeInteger(sizeBytes) || Number(sizeBytes) <= 0 ||
    !/^[a-f0-9]{64}$/.test(checksumSha256)
  ) {
    throw new ApiError('UPLOAD_SOURCE_MISMATCH', 'Background finalization returned incomplete source authority.', 409)
  }
  return {
    uploadIntentId,
    mediaAssetId: finalized.mediaAsset.id,
    storageObjectRecordId: finalized.storageObjectRecord.id,
    sizeBytes: Number(sizeBytes),
    checksumSha256,
    ...(finalized.mediaAsset.sourceMetadata
      ? { sourceMetadata: finalized.mediaAsset.sourceMetadata }
      : {}),
  }
}

async function readRequiredJob(
  context: ServiceContext,
  workspaceId: string,
  jobId: string,
) {
  const job = await readPrivateLargeMediaFinalizationJob({
    scope: scopeFor(context, workspaceId),
    jobId,
  })
  if (!job) throw new ApiError('JOB_NOT_FOUND', 'Large-media finalization job was not found.', 404)
  return job
}

function scopeFor(context: ServiceContext, workspaceId: string): PrivateLargeMediaFinalizationScope {
  const ownerUserId = context.auth?.userId?.trim()
  if (!ownerUserId) throw new ApiError('AUTH_REQUIRED', 'Authentication is required.', 401)
  return {
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId,
    workspaceId,
  }
}

function assertPrivateInternalBoundary(context: ServiceContext): void {
  if (
    context.env.largeMediaFinalizationMode !== 'private_local' ||
    context.env.nodeEnv === 'production' ||
    !['local', 'mock'].includes(context.env.mode) ||
    (!context.env.mockOnly && !context.env.allowInternalTestExecutionWithSupabase)
  ) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Large-media finalization authority is limited to explicit private local/internal testing until a distributed queue is approved.',
      503,
      {
        blockedActionScope: 'distributed_large_media_finalization',
        nextSafeAction: 'verify_private_single_host_finalization_authority',
      },
    )
  }
}

function deriveFinalizationAttemptTimeoutMs(expectedSizeBytes: number): number {
  const sizeGiB = expectedSizeBytes / GIB
  return Math.round(Math.min(24 * HOUR, Math.max(30 * MINUTE, 30 * MINUTE + sizeGiB * 30_000)))
}

function boundedLeaseDurationMs(value: number): number {
  if (!Number.isFinite(value)) return 5 * MINUTE
  return Math.min(15 * MINUTE, Math.max(30_000, Math.round(value)))
}

function classifyFinalizationFailure(error: unknown): {
  code: string
  summary: string
  retryable: boolean
} {
  if (error instanceof ApiError) {
    const errorCode = error.code
    const terminal = isPrivateSourceProbeTerminalIntegrityError(error) || [
      'AUTH_REQUIRED',
      'AUTH_INVALID',
      'WORKSPACE_ACCESS_DENIED',
      'VALIDATION_FAILED',
      'UPLOAD_SOURCE_MISMATCH',
    ].includes(errorCode)
    const probeReason = error.details && typeof error.details === 'object' && 'reason' in error.details
      ? String((error.details as { reason?: unknown }).reason ?? '')
      : ''
    const retryableProbeFailure = probeReason === 'source_probe_stage_failed'
    return {
      code: errorCode,
      summary: terminal
        ? 'Private source integrity or authorization validation failed.'
        : 'Private source finalization encountered a retryable operational failure.',
      retryable: !terminal && (errorCode !== 'UPLOAD_NOT_FINALIZED' || retryableProbeFailure),
    }
  }
  return {
    code: 'INTERNAL_ERROR',
    summary: 'Private source finalization encountered a retryable internal failure.',
    retryable: true,
  }
}

function toJobView(job: Awaited<ReturnType<typeof readRequiredJob>>): LargeMediaFinalizationJobView {
  const progressStage: LargeMediaFinalizationJobView['progressStage'] = job.status === 'queued'
    ? 'waiting_for_background_worker'
    : job.status === 'running'
      ? 'verifying_hash_and_media_metadata'
      : job.status === 'completed'
        ? 'canonical_source_ready'
        : job.status === 'failed_retryable'
          ? 'retry_available'
          : 'manual_review_required'
  return {
    jobId: job.jobId,
    workspaceId: job.workspaceId,
    projectId: job.projectId,
    uploadIntentId: job.uploadIntentId,
    uploadPurpose: job.uploadPurpose,
    expectedSizeBytes: job.expectedSizeBytes,
    status: job.status,
    progressStage,
    attemptCount: job.attemptCount,
    maximumAttempts: job.maximumAttempts,
    retryAvailable: job.status === 'failed_retryable',
    ...(job.result ? { result: job.result } : {}),
    ...(job.failure ? {
      failure: {
        code: job.failure.code,
        summary: job.failure.summary,
        retryable: job.failure.retryable,
      },
    } : {}),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    ...(job.completedAt ? { completedAt: job.completedAt } : {}),
    pollAfterMs: job.status === 'completed' || job.status === 'failed_terminal' ? 0 : 2_000,
    privateInternalOnly: true,
    productReady: false,
    externalBetaReady: false,
    productionReady: false,
  }
}
