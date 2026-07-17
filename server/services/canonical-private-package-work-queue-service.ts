import { ApiError } from '../errors/api-error'
import {
  createCanonicalPrivatePackageWorkQueueDefinition,
  type CanonicalPrivatePackageWorkQueueDefinition,
  type CanonicalPrivatePackageWorkQueueJobDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import type { CanonicalPrivateResourcePlacementManifest } from
  '../edit-architecture/canonical-private-resource-placement-authority'
import { isExplicitLocalInternalTestRuntime } from '../middleware/canonical-worker-runtime'
import type { ServiceContext } from '../types'
import type {
  CanonicalPrivateWorkGraphJobOutcome,
} from '../validation/canonical-private-work-graph-run-schemas'
import type {
  CanonicalPrivatePackageWorkQueueAggregate,
  CanonicalPrivatePackageWorkQueueCompletedOutcome,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  claimPrivateCanonicalPackageWorkQueueJob,
  completePrivateCanonicalPackageWorkQueueClaim,
  ensurePrivateCanonicalPackageWorkQueue,
  heartbeatPrivateCanonicalPackageWorkQueueClaim,
  readPrivateCanonicalPackageWorkQueue,
  releasePrivateCanonicalPackageWorkQueueClaim,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'

export interface CanonicalPrivatePackageWorkQueueRunEvidence {
  definitionVersion: CanonicalPrivatePackageWorkQueueDefinition['schemaVersion']
  definitionHash: string
  aggregateVersion: CanonicalPrivatePackageWorkQueueAggregate['schemaVersion']
  aggregateHash: string
  totalJobCount: number
  completedJobCount: number
  queuedJobCount: number
  leasedJobCount: number
  recoveredCompletedJobCount: number
  completedReplayCount: number
  claimedJobCount: number
  claimCompletionCount: number
  claimReleaseCount: number
  expiredClaimRecoveryCount: number
  hostRestartRecoveryAvailable: true
  completedJobReplayWithoutExecution: true
  immutableSnapshotAndPlacementBinding: true
  plaintextClaimCredentialsPersisted: false
  claimCredentialDigestsPersisted: true
  browserClaimAllowed: false
  crossProcessAtomicClaimProven: true
  distributedTransactionProven: false
  cloudServiceIdentityVerified: false
  cloudDispatchAuthorized: false
  productionAuthority: false
}

export type CanonicalPrivatePackageWorkQueueExecutionResult =
  | { disposition: 'executed' | 'completed_replay'; outcome: CanonicalPrivateWorkGraphJobOutcome }
  | {
      disposition: 'already_leased' | 'dependency_blocked' | 'scheduled_wait' |
        'capability_blocked' | 'attempts_exhausted'
      requiredGate?: string
    }

export function createCanonicalPrivatePackageWorkQueueService(input: {
  context: ServiceContext
  ownerUserId: string
  executionPackage: CanonicalApprovedEditExecutionPackage
  placementManifest: CanonicalPrivateResourcePlacementManifest
  now?: () => Date
}) {
  const context = input.context
  if (!isExplicitLocalInternalTestRuntime(context.env)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical package work-queue execution remains private/local until distributed transaction and service-identity evidence exists.',
      503,
      { requiredGate: 'canonical_distributed_work_queue_and_service_identity' },
    )
  }
  const now = input.now ?? (() => new Date())
  const definition = createCanonicalPrivatePackageWorkQueueDefinition({
    executionPackage: input.executionPackage,
    placementManifest: input.placementManifest,
  })
  const scope: CanonicalPrivatePackageWorkQueueStoreScope = {
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId: input.ownerUserId,
    workspaceId: input.executionPackage.workspaceId,
    projectId: input.executionPackage.projectId,
    editSessionId: input.executionPackage.editSessionId,
    packageRecordId: input.executionPackage.packageRecordId,
    approvedPlanSnapshotId: input.executionPackage.approvedPlanSnapshotId,
  }
  const leaseDurationMs = boundedLeaseDurationMs(
    context.env.workerClaimLeaseSeconds * 1_000,
  )
  const heartbeatEveryMs = Math.max(1_000, Math.min(
    context.env.workerHeartbeatIntervalSeconds * 1_000,
    Math.floor(leaseDurationMs / 3),
  ))
  let initialAggregate: CanonicalPrivatePackageWorkQueueAggregate | undefined
  let claimedJobCount = 0
  let claimCompletionCount = 0
  let claimReleaseCount = 0
  let completedReplayCount = 0

  return {
    definition,

    async initialize(): Promise<{
      aggregate: CanonicalPrivatePackageWorkQueueAggregate
      recoveredCompletedOutcomes: CanonicalPrivateWorkGraphJobOutcome[]
    }> {
      const ensured = await ensurePrivateCanonicalPackageWorkQueue({
        scope,
        definition,
        now: now().toISOString(),
      })
      initialAggregate = ensured.aggregate
      return {
        aggregate: ensured.aggregate,
        recoveredCompletedOutcomes: ensured.aggregate.entries
          .filter((entry) => entry.state === 'completed')
          .map((entry) => ({
            ...entry.completion!.outcome,
            adapterReplayed: true,
          })),
      }
    },

    async execute(input: {
      jobId: string
      workerType: CanonicalPrivatePackageWorkQueueJobDefinition['workerType']
      operation: () => Promise<CanonicalPrivateWorkGraphJobOutcome>
    }): Promise<CanonicalPrivatePackageWorkQueueExecutionResult> {
      const claim = await claimPrivateCanonicalPackageWorkQueueJob({
        scope,
        definition,
        jobId: input.jobId,
        workerIdentity: context.env.workerInstanceId,
        workerType: input.workerType,
        now: now().toISOString(),
        leaseDurationMs,
      })
      if (claim.disposition === 'completed') {
        completedReplayCount += 1
        return {
          disposition: 'completed_replay',
          outcome: { ...claim.outcome, adapterReplayed: true },
        }
      }
      if (claim.disposition !== 'claimed') {
        const jobDefinition = definition.jobs.find((job) => job.jobId === input.jobId)
        return {
          disposition: claim.disposition,
          ...(claim.disposition === 'capability_blocked' && jobDefinition?.requiredGate
            ? { requiredGate: jobDefinition.requiredGate }
            : claim.disposition === 'attempts_exhausted'
              ? { requiredGate: 'canonical_package_work_queue_approved_attempts_exhausted' }
            : {}),
        }
      }
      claimedJobCount += 1

      let heartbeatInFlight: Promise<void> | undefined
      let heartbeatFailure: unknown
      const heartbeatTimer = setInterval(() => {
        if (heartbeatInFlight || heartbeatFailure) return
        heartbeatInFlight = heartbeatPrivateCanonicalPackageWorkQueueClaim({
          scope,
          definition,
          jobId: input.jobId,
          claimId: claim.entry.activeClaim.claimId,
          claimCredential: claim.claimCredential,
          now: now().toISOString(),
          leaseDurationMs,
        }).then(() => undefined).catch((error) => { heartbeatFailure = error }).finally(() => {
          heartbeatInFlight = undefined
        })
      }, heartbeatEveryMs)
      heartbeatTimer.unref?.()

      try {
        const outcome = await input.operation()
        clearInterval(heartbeatTimer)
        if (heartbeatInFlight) await heartbeatInFlight
        if (heartbeatFailure) throw heartbeatFailure
        if (outcome.status === 'completed_private_test') {
          await completePrivateCanonicalPackageWorkQueueClaim({
            scope,
            definition,
            jobId: input.jobId,
            claimId: claim.entry.activeClaim.claimId,
            claimCredential: claim.claimCredential,
            outcome: completedOutcome(outcome),
            now: now().toISOString(),
          })
          claimCompletionCount += 1
        } else {
          await releasePrivateCanonicalPackageWorkQueueClaim({
            scope,
            definition,
            jobId: input.jobId,
            claimId: claim.entry.activeClaim.claimId,
            claimCredential: claim.claimCredential,
            reason: outcome.status === 'blocked_by_job_capability'
              ? 'scoped_capability_blocker'
              : 'approved_attempt_failure',
            now: now().toISOString(),
          })
          claimReleaseCount += 1
        }
        return { disposition: 'executed', outcome }
      } catch (error) {
        clearInterval(heartbeatTimer)
        if (heartbeatInFlight) await heartbeatInFlight.catch(() => undefined)
        await releasePrivateCanonicalPackageWorkQueueClaim({
          scope,
          definition,
          jobId: input.jobId,
          claimId: claim.entry.activeClaim.claimId,
          claimCredential: claim.claimCredential,
          reason: 'unexpected_execution_failure',
          now: now().toISOString(),
        }).then(() => { claimReleaseCount += 1 }).catch(() => undefined)
        throw error
      }
    },

    async evidence(): Promise<CanonicalPrivatePackageWorkQueueRunEvidence> {
      const aggregate = await readPrivateCanonicalPackageWorkQueue({ scope, definition })
      if (!aggregate || !initialAggregate) {
        throw new ApiError('INTERNAL_ERROR', 'Canonical package work-queue evidence is unavailable.', 500)
      }
      return {
        definitionVersion: definition.schemaVersion,
        definitionHash: definition.definitionHash,
        aggregateVersion: aggregate.schemaVersion,
        aggregateHash: aggregate.aggregateHash,
        totalJobCount: aggregate.summary.totalJobCount,
        completedJobCount: aggregate.summary.completedJobCount,
        queuedJobCount: aggregate.summary.queuedJobCount,
        leasedJobCount: aggregate.summary.leasedJobCount,
        recoveredCompletedJobCount: initialAggregate.summary.completedJobCount,
        completedReplayCount,
        claimedJobCount,
        claimCompletionCount,
        claimReleaseCount,
        expiredClaimRecoveryCount:
          aggregate.summary.expiredClaimRecoveryCount -
          initialAggregate.summary.expiredClaimRecoveryCount,
        hostRestartRecoveryAvailable: true,
        completedJobReplayWithoutExecution: true,
        immutableSnapshotAndPlacementBinding: true,
        plaintextClaimCredentialsPersisted: false,
        claimCredentialDigestsPersisted: true,
        browserClaimAllowed: false,
        crossProcessAtomicClaimProven: true,
        distributedTransactionProven: false,
        cloudServiceIdentityVerified: false,
        cloudDispatchAuthorized: false,
        productionAuthority: false,
      }
    },
  }
}

function completedOutcome(
  outcome: CanonicalPrivateWorkGraphJobOutcome,
): CanonicalPrivatePackageWorkQueueCompletedOutcome {
  if (
    outcome.status !== 'completed_private_test' ||
    !outcome.artifactId || !outcome.contentType || !outcome.sha256
  ) throw new ApiError('INTERNAL_ERROR', 'Canonical completed queue outcome is incomplete.', 500)
  return {
    jobId: outcome.jobId,
    approvedWorkItemId: outcome.approvedWorkItemId,
    workItemKey: outcome.workItemKey,
    required: outcome.required,
    dependencyJobIds: [...outcome.dependencyJobIds],
    status: 'completed_private_test',
    artifactId: outcome.artifactId,
    contentType: outcome.contentType,
    sha256: outcome.sha256,
    adapterReplayed: outcome.adapterReplayed,
    blockedDependencyJobIds: [],
  }
}

function boundedLeaseDurationMs(value: number): number {
  if (!Number.isFinite(value)) return 300_000
  return Math.max(1_000, Math.min(86_400_000, Math.floor(value)))
}
