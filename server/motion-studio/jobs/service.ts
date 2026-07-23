import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto'

import type {
  AuthorizeMotionStudioWorkGraphRequest,
  CancelMotionStudioJobRequest,
  MotionStudioJobCancellationReceiptDto,
  MotionStudioWorkGraphAuthorizationReceiptDto,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { ensureAdminClient, getRequiredAuthUserId } from '../../services/service-helpers'
import type { ServiceContext } from '../../types'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type { MotionStudioProductionRow } from '../commands/types'
import { createSupabaseMotionStudioJobRepository } from './repository'
import type {
  MotionStudioAttemptUsageLine,
  MotionStudioJobRepository,
} from './types'

const LOCAL_WARNING = 'Motion Studio durable jobs are a local canonical candidate; provider, renderer, media, remote Supabase, billing, pricing, and customer-credit execution remain disabled.'
const LEASE_CREDENTIAL_VERSION = 'motion-studio-lease-v1'

export class MotionStudioJobService {
  private readonly actorUserId: string
  private readonly context: ServiceContext
  private readonly repository: MotionStudioJobRepository

  constructor(context: ServiceContext, repository?: MotionStudioJobRepository) {
    this.context = context
    this.actorUserId = requireVerifiedUser(context)
    this.repository = repository ?? createSupabaseMotionStudioJobRepository(ensureAdminClient(context))
  }

  async authorizeWorkGraph(
    productionId: string,
    request: AuthorizeMotionStudioWorkGraphRequest,
    idempotencyKey: string,
  ) {
    await this.requireOwnedProduction(productionId)
    const requestHash = requestDigest('POST', `/v1/motion-studio/productions/${productionId}/work-graph-authorizations`, request)
    const receipt = await this.repository.authorizeWorkGraph({
      productionId,
      approvedSnapshotId: request.approvedSnapshotId,
      costEstimateId: request.costEstimateId,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash,
    })
    const graph = await this.repository.readWorkGraph(productionId)
    if (!graph) throw internalInvalid('Authorized Motion Studio work graph could not be read back.')
    const authorization: MotionStudioWorkGraphAuthorizationReceiptDto = {
      productionId: receipt.productionId,
      approvedSnapshotId: receipt.approvedSnapshotId,
      costEstimateId: receipt.costEstimateId,
      jobCount: receipt.jobs.length,
      localCandidateOnly: true,
    }
    return { data: { authorization, workGraph: graph }, warnings: [LOCAL_WARNING] }
  }

  async getWorkGraph(productionId: string) {
    await this.requireOwnedProduction(productionId)
    const graph = await this.repository.readWorkGraph(productionId)
    if (!graph) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'No durable work graph is authorized for this production.', 404)
    return { data: { workGraph: graph }, warnings: [LOCAL_WARNING] }
  }

  async cancelJob(jobId: string, request: CancelMotionStudioJobRequest, idempotencyKey: string) {
    const requestHash = requestDigest('POST', `/v1/motion-studio/jobs/${jobId}/cancellation`, request)
    const result = await this.repository.cancelJob({
      jobId,
      reason: request.reason,
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash,
    })
    const cancellation: MotionStudioJobCancellationReceiptDto = {
      jobId: result.jobId,
      status: result.status,
      localCandidateOnly: true,
    }
    return { data: { cancellation }, warnings: [LOCAL_WARNING] }
  }

  async claimNextJob(productionId: string, idempotencyKey: string) {
    await this.requireOwnedProduction(productionId)
    const secret = requireLeaseSecret(this.context)
    const workerIdentityId = this.context.env.workerInstanceId
    const candidateLeaseId = randomUUID()
    const candidateLeaseNonce = randomBytes(32).toString('hex')
    const candidateCredential = deriveMotionStudioLeaseCredential(
      secret,
      candidateLeaseId,
      workerIdentityId,
      candidateLeaseNonce,
    )
    const requestHash = requestDigest(
      'POST',
      `/v1/internal/motion-studio/productions/${productionId}/job-claims`,
      { workerIdentityId },
    )
    const claim = await this.repository.claimJob({
      productionId,
      workerIdentityId,
      candidateLeaseId,
      candidateLeaseNonce,
      candidateCredentialHash: hashMotionStudioLeaseCredential(candidateCredential),
      leaseDurationSeconds: Math.min(900, Math.max(5, this.context.env.workerClaimLeaseSeconds)),
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash,
    })
    if (claim.status === 'no_ready_job') {
      return { data: { claim: { ...claim, localCandidateOnly: true as const } }, warnings: [LOCAL_WARNING] }
    }
    if (claim.workerIdentityId !== workerIdentityId) throw internalInvalid('Worker claim returned a mismatched service identity.')
    const leaseCredential = deriveMotionStudioLeaseCredential(
      secret,
      claim.leaseId,
      claim.workerIdentityId,
      claim.leaseNonce,
    )
    const work = await this.repository.readWorkerClaimPackage(claim.jobId)
    assertClaimPackageAuthority(claim.approvedSnapshotId, claim.workItemKey, work)
    return {
      data: {
        claim: {
          status: claim.status,
          productionId: claim.productionId,
          jobId: claim.jobId,
          approvedSnapshotId: claim.approvedSnapshotId,
          workItemKey: claim.workItemKey,
          attemptId: claim.attemptId,
          attemptNumber: claim.attemptNumber,
          leaseId: claim.leaseId,
          leaseCredential,
          expiresAt: claim.expiresAt,
          attemptDeadlineAt: claim.attemptDeadlineAt,
          maximumAuthorizedInternalCostMicros: claim.maximumAuthorizedInternalCostMicros,
          work: {
            approvedWorkItemId: work.approvedWorkItem.id,
            workItemType: work.approvedWorkItem.workItemType,
            payload: work.approvedWorkItem.payload,
            payloadDigest: work.approvedWorkItem.payloadDigest,
            required: work.approvedWorkItem.required,
            costItems: work.costItems,
          },
          localCandidateOnly: true as const,
        },
      },
      warnings: [LOCAL_WARNING],
    }
  }

  async startAttempt(leaseId: string, leaseCredential: string, idempotencyKey: string) {
    return this.workerMutation(
      'POST',
      `/v1/internal/motion-studio/job-leases/${leaseId}/start`,
      {},
      (requestHash) => this.repository.startAttempt({
        leaseId,
        credentialHash: hashMotionStudioLeaseCredential(leaseCredential),
        actorUserId: this.actorUserId,
        idempotencyKey,
        requestHash,
      }),
    )
  }

  async resumeAsyncFollowupLease(operationId: string, idempotencyKey: string) {
    const secret = requireLeaseSecret(this.context)
    const workerIdentityId = this.context.env.workerInstanceId
    const candidateLeaseId = randomUUID()
    const candidateLeaseNonce = randomBytes(32).toString('hex')
    const candidateCredential = deriveMotionStudioLeaseCredential(
      secret,
      candidateLeaseId,
      workerIdentityId,
      candidateLeaseNonce,
    )
    const requestHash = requestDigest(
      'POST',
      `/v1/internal/motion-studio/live-operations/${operationId}/async-followup-lease`,
      { workerIdentityId },
    )
    const resumed = await this.repository.resumeAsyncFollowupLease({
      operationId,
      workerIdentityId,
      candidateLeaseId,
      candidateLeaseNonce,
      candidateCredentialHash: hashMotionStudioLeaseCredential(candidateCredential),
      leaseDurationSeconds: Math.min(900, Math.max(5, this.context.env.workerClaimLeaseSeconds)),
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash,
    })
    const leaseCredential = deriveMotionStudioLeaseCredential(
      secret,
      resumed.leaseId,
      resumed.workerIdentityId,
      resumed.leaseNonce,
    )
    return {
      data: {
        resume: {
          ...resumed,
          leaseCredential,
          localCandidateOnly: true as const,
        },
      },
      warnings: [LOCAL_WARNING],
    }
  }

  async heartbeatLease(leaseId: string, leaseCredential: string, extensionSeconds: number, idempotencyKey: string) {
    return this.workerMutation(
      'POST',
      `/v1/internal/motion-studio/job-leases/${leaseId}/heartbeat`,
      { extensionSeconds },
      (requestHash) => this.repository.heartbeatLease({
        leaseId,
        credentialHash: hashMotionStudioLeaseCredential(leaseCredential),
        extensionSeconds,
        actorUserId: this.actorUserId,
        idempotencyKey,
        requestHash,
      }),
    )
  }

  async heartbeatAsyncFollowupLease(
    operationId: string,
    leaseId: string,
    leaseCredential: string,
    extensionSeconds: number,
    idempotencyKey: string,
  ) {
    return this.workerMutation(
      'POST',
      `/v1/internal/motion-studio/live-operations/${operationId}/async-followup-heartbeat`,
      { leaseId, extensionSeconds },
      (requestHash) => this.repository.heartbeatAsyncFollowupLease({
        operationId,
        leaseId,
        credentialHash: hashMotionStudioLeaseCredential(leaseCredential),
        extensionSeconds,
        actorUserId: this.actorUserId,
        idempotencyKey,
        requestHash,
      }),
    )
  }

  async resumeLocalMediaRecoveryLease(operationId: string, idempotencyKey: string) {
    const secret = requireLeaseSecret(this.context)
    const workerIdentityId = this.context.env.workerInstanceId
    const candidateLeaseId = randomUUID()
    const candidateLeaseNonce = randomBytes(32).toString('hex')
    const candidateCredential = deriveMotionStudioLeaseCredential(
      secret,
      candidateLeaseId,
      workerIdentityId,
      candidateLeaseNonce,
    )
    const requestHash = requestDigest(
      'POST',
      `/v1/internal/motion-studio/live-operations/${operationId}/local-media-recovery-lease`,
      { workerIdentityId },
    )
    const resumed = await this.repository.resumeLocalMediaRecoveryLease({
      operationId,
      workerIdentityId,
      candidateLeaseId,
      candidateLeaseNonce,
      candidateCredentialHash: hashMotionStudioLeaseCredential(candidateCredential),
      leaseDurationSeconds: Math.min(900, Math.max(5, this.context.env.workerClaimLeaseSeconds)),
      actorUserId: this.actorUserId,
      idempotencyKey,
      requestHash,
    })
    const leaseCredential = deriveMotionStudioLeaseCredential(
      secret,
      resumed.leaseId,
      resumed.workerIdentityId,
      resumed.leaseNonce,
    )
    return {
      data: {
        recovery: {
          ...resumed,
          leaseCredential,
          localCandidateOnly: true as const,
        },
      },
      warnings: [LOCAL_WARNING],
    }
  }

  async reconcileProviderSuccessLease(input: {
    operationId: string
    originalResponseDigest: string
    observedResponseDigest: string
    externalOperationIdHash: string
    observedAt: string
    diagnosticStatusQueryCount: 1
    providerWidth: 1364
    providerHeight: 768
    idempotencyKey: string
  }) {
    for (const [field, value] of Object.entries({
      originalResponseDigest: input.originalResponseDigest,
      observedResponseDigest: input.observedResponseDigest,
      externalOperationIdHash: input.externalOperationIdHash,
    })) {
      if (!/^[a-f0-9]{64}$/.test(value)) {
        throw new ApiError('MOTION_STUDIO_CONFLICT', `${field} must be exact lowercase SHA-256 evidence.`, 409)
      }
    }
    const secret = requireLeaseSecret(this.context)
    const workerIdentityId = this.context.env.workerInstanceId
    const candidateLeaseId = randomUUID()
    const candidateLeaseNonce = randomBytes(32).toString('hex')
    const candidateCredential = deriveMotionStudioLeaseCredential(
      secret,
      candidateLeaseId,
      workerIdentityId,
      candidateLeaseNonce,
    )
    const observedEventDigest = sha256CanonicalJson({
      schemaVersion: 'motion-studio-hailuo-provider-success-reconciliation-v1',
      operationId: input.operationId,
      externalOperationIdHash: input.externalOperationIdHash,
      originalResponseDigest: input.originalResponseDigest,
      observedResponseDigest: input.observedResponseDigest,
      observedProviderStatus: 'Success',
      providerNativeWidth: input.providerWidth,
      providerNativeHeight: input.providerHeight,
      diagnosticStatusQueryCount: input.diagnosticStatusQueryCount,
      providerSubmissionMade: false,
      providerResubmissionAllowed: false,
      automaticRetryAllowed: false,
      observedAt: input.observedAt,
    })
    const body = {
      operationId: input.operationId,
      originalResponseDigest: input.originalResponseDigest,
      observedResponseDigest: input.observedResponseDigest,
      observedEventDigest,
      externalOperationIdHash: input.externalOperationIdHash,
      providerWidth: input.providerWidth,
      providerHeight: input.providerHeight,
      diagnosticStatusQueryCount: input.diagnosticStatusQueryCount,
      observedAt: input.observedAt,
      workerIdentityId,
    }
    const requestHash = requestDigest(
      'POST',
      `/v1/internal/motion-studio/live-operations/${input.operationId}/provider-success-reconciliation`,
      body,
    )
    const reconciled = await this.repository.reconcileProviderSuccessLease({
      ...body,
      candidateLeaseId,
      candidateLeaseNonce,
      candidateCredentialHash: hashMotionStudioLeaseCredential(candidateCredential),
      leaseDurationSeconds: Math.min(900, Math.max(5, this.context.env.workerClaimLeaseSeconds)),
      actorUserId: this.actorUserId,
      idempotencyKey: input.idempotencyKey,
      requestHash,
    })
    const leaseCredential = deriveMotionStudioLeaseCredential(
      secret,
      reconciled.leaseId,
      reconciled.workerIdentityId,
      reconciled.leaseNonce,
    )
    return {
      data: {
        reconciliation: {
          ...reconciled,
          leaseCredential,
          sameAttempt: true as const,
        },
      },
      warnings: [LOCAL_WARNING],
    }
  }

  async reconcileHailuoFileParseFailure(input: {
    operationId: string
    fileCallId: string
    idempotencyKey: string
  }) {
    const evidence = {
      schemaVersion: 'motion-studio-hailuo-file-parse-reconciliation-v1',
      operationId: input.operationId,
      fileCallId: input.fileCallId,
      adapterRepair: 'allow_nonnegative_declared_bytes',
      providerSubmissionMade: false,
      providerResubmissionAllowed: false,
      automaticRetryAllowed: false,
      networkDispatchPossible: true,
      providerResponseDigestUnavailable: true,
    }
    const evidenceDigest = sha256CanonicalJson(evidence)
    const requestHash = requestDigest(
      'POST',
      `/v1/internal/motion-studio/live-operations/${input.operationId}/hailuo-file-parse-reconciliation`,
      { ...evidence, evidenceDigest },
    )
    const result = await this.repository.reconcileHailuoFileParseFailure({
      operationId: input.operationId,
      fileCallId: input.fileCallId,
      evidenceDigest,
      actorUserId: this.actorUserId,
      idempotencyKey: input.idempotencyKey,
      requestHash,
    })
    return { data: { reconciliation: result, evidenceDigest }, warnings: [LOCAL_WARNING] }
  }

  async finishAttempt(
    leaseId: string,
    leaseCredential: string,
    request: {
      outcome: 'succeeded' | 'failed' | 'cancelled'
      failureCategory?: string
      usage: readonly MotionStudioAttemptUsageLine[]
      outcomeDigest: string
    },
    idempotencyKey: string,
  ) {
    return this.workerMutation(
      'POST',
      `/v1/internal/motion-studio/job-leases/${leaseId}/results`,
      request,
      (requestHash) => this.repository.finishAttempt({
        leaseId,
        credentialHash: hashMotionStudioLeaseCredential(leaseCredential),
        outcome: request.outcome,
        ...(request.failureCategory ? { failureCategory: request.failureCategory } : {}),
        usage: request.usage,
        outcomeDigest: request.outcomeDigest,
        actorUserId: this.actorUserId,
        idempotencyKey,
        requestHash,
      }),
    )
  }

  async expireLease(leaseId: string, idempotencyKey: string) {
    return this.workerMutation(
      'POST',
      `/v1/internal/motion-studio/job-leases/${leaseId}/expire`,
      {},
      (requestHash) => this.repository.expireLease({
        leaseId,
        actorUserId: this.actorUserId,
        idempotencyKey,
        requestHash,
      }),
    )
  }

  async reconcileAttempt(
    jobId: string,
    request: {
      attemptId: string
      decision: 'no_side_effect' | 'side_effect_observed' | 'manual_review'
      usage: readonly MotionStudioAttemptUsageLine[]
      evidenceDigest: string
    },
    idempotencyKey: string,
  ) {
    return this.workerMutation(
      'POST',
      `/v1/internal/motion-studio/jobs/${jobId}/reconciliation`,
      request,
      (requestHash) => this.repository.reconcileAttempt({
        jobId,
        attemptId: request.attemptId,
        decision: request.decision,
        usage: request.usage,
        evidenceDigest: request.evidenceDigest,
        actorUserId: this.actorUserId,
        idempotencyKey,
        requestHash,
      }),
    )
  }

  private async workerMutation<T>(
    method: 'POST',
    path: string,
    body: unknown,
    operation: (requestHash: string) => Promise<T>,
  ) {
    requireLeaseSecret(this.context)
    const result = await operation(requestDigest(method, path, body))
    return { data: { result, localCandidateOnly: true as const }, warnings: [LOCAL_WARNING] }
  }

  private async requireOwnedProduction(productionId: string): Promise<MotionStudioProductionRow> {
    const production = await this.repository.findProduction(productionId)
    if (!production) throw new ApiError('MOTION_STUDIO_NOT_FOUND', 'Motion Studio production was not found.', 404)
    if (production.owner_id !== this.actorUserId) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Motion Studio durable work is owner-private in the current canonical model.', 403)
    }
    if (production.status === 'archived') {
      throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'Archived Motion Studio productions cannot mutate durable work.', 409)
    }
    return production
  }
}

export function createMotionStudioJobService(context: ServiceContext): MotionStudioJobService {
  return new MotionStudioJobService(context)
}

export function deriveMotionStudioLeaseCredential(
  secret: string,
  leaseId: string,
  workerIdentityId: string,
  leaseNonce: string,
): string {
  return createHmac('sha256', secret)
    .update(`${LEASE_CREDENTIAL_VERSION}\0${leaseId}\0${workerIdentityId}\0${leaseNonce}`)
    .digest('hex')
}

export function hashMotionStudioLeaseCredential(credential: string): string {
  if (!/^[a-f0-9]{64}$/.test(credential)) {
    throw new ApiError('WORKER_LEASE_INVALID', 'A valid opaque worker lease credential is required.', 401)
  }
  return createHash('sha256').update(credential).digest('hex')
}

function requireVerifiedUser(context: ServiceContext): string {
  const userId = getRequiredAuthUserId(context)
  if (context.auth?.isMockUser || !context.auth?.accessToken) {
    throw new ApiError('AUTH_INVALID', 'Motion Studio durable commands require a verified bearer identity.', 401)
  }
  return userId
}

function requireLeaseSecret(context: ServiceContext): string {
  const secret = context.env.internalServiceToken
  if (!secret || secret.length < 16) {
    throw new ApiError('INTERNAL_SERVICE_AUTH_REQUIRED', 'Durable worker lease credential derivation is not configured.', 503)
  }
  return secret
}

function requestDigest(method: string, path: string, body: unknown): string {
  return sha256CanonicalJson({ method, path, body })
}

function assertClaimPackageAuthority(
  approvedSnapshotId: string,
  workItemKey: string,
  work: Awaited<ReturnType<MotionStudioJobRepository['readWorkerClaimPackage']>>,
): void {
  if (work.job.approved_snapshot_id !== approvedSnapshotId
    || work.approvedWorkItem.approvedSnapshotId !== approvedSnapshotId
    || work.job.work_item_key !== workItemKey
    || work.approvedWorkItem.workItemKey !== workItemKey
    || work.job.approved_work_item_id !== work.approvedWorkItem.id) {
    throw internalInvalid('Claimed work package did not match exact immutable job authority.')
  }
}

function internalInvalid(message: string): ApiError {
  return new ApiError('INTERNAL_ERROR', message, 500, undefined, { internal: true })
}
