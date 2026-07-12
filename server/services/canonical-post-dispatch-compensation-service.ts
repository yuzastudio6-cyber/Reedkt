import { randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import { isExplicitLocalInternalTestRuntime } from '../middleware/canonical-worker-runtime'
import type { ServiceContext } from '../types'
import {
  compensateCanonicalApprovedSnapshotSchema,
  canonicalPostDispatchCompensationResponseSchema,
  type CompensateCanonicalApprovedSnapshotBody,
} from '../validation/canonical-post-dispatch-compensation-schemas'
import { withCanonicalExecutionDomainLock } from './canonical-execution-domain-lock'
import { readCanonicalPrivateJobAdapterCompletion } from './canonical-private-job-execution-adapter-service'
import { withCanonicalWorkGraphPackageLock } from './canonical-work-graph-package-lock'
import {
  mutatePrivateEditAuthorityAggregate,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
  walletBalanceAfter,
} from './private-edit-authority-store'
import { readPrivateArtifactQaAggregate } from './private-artifact-qa-authority-store'
import {
  readPrivateCanonicalToolDispatchAggregate,
  reconcileSnapshotDispatchesForCompensation,
} from './private-canonical-tool-dispatch-store'
import {
  readPrivateCanonicalWorkerLeaseAggregate,
  reconcileSnapshotLeasesForCompensation,
} from './private-canonical-worker-lease-store'
import { createProjectService } from './project-service'
import { nowIso } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

const COMPENSATION_OPERATION = 'compensate_cancel_approved_snapshot' as const

export function createCanonicalPostDispatchCompensationService(context: ServiceContext) {
  return {
    async compensate(input: CompensateCanonicalApprovedSnapshotBody & {
      snapshotId: string
      idempotencyKey: string
      requestPath?: string
    }) {
      assertPrivateCompensationRuntime(context)
      const parsed = compensateCanonicalApprovedSnapshotSchema.safeParse({
        workspaceId: input.workspaceId,
        expectedAuthorityRevision: input.expectedAuthorityRevision,
        expectedSnapshotHash: input.expectedSnapshotHash,
        expectedReservationId: input.expectedReservationId,
        reason: input.reason,
      })
      if (!parsed.success || !safeIdentity(input.snapshotId)) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical post-dispatch compensation request validation failed.',
          400,
          parsed.success ? { snapshotId: ['Invalid approved snapshot identity.'] } : parsed.error.flatten(),
        )
      }
      const body = parsed.data
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
      const scope = {
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: access.userId,
        workspaceId: access.workspaceId,
      }
      const before = await readPrivateEditAuthorityAggregate(scope)
      const beforeSnapshot = before?.snapshots.find((record) => record.snapshotId === input.snapshotId)
      if (!before || !beforeSnapshot) {
        throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Canonical approved snapshot was not found.', 404)
      }
      const beforeExecutionPackage = before.executionPackages.find((record) =>
        record.snapshotId === beforeSnapshot.snapshotId)
      if (!beforeExecutionPackage) {
        throw new ApiError(
          'TOOL_NOT_READY',
          'Post-dispatch compensation requires the immutable canonical execution package.',
          409,
          { requiredGate: 'canonical_execution_package_compensation_lineage' },
        )
      }
      await createProjectService(context).getProject(beforeSnapshot.projectId, access.workspaceId)
      const requestHash = sha256AuthorityValue({
        operation: COMPENSATION_OPERATION,
        requestPath: input.requestPath ?? '/v1/approved-snapshots/:snapshotId/compensated-cancel',
        workspaceId: access.workspaceId,
        snapshotId: input.snapshotId,
        expectedAuthorityRevision: body.expectedAuthorityRevision,
        expectedSnapshotHash: body.expectedSnapshotHash,
        expectedReservationId: body.expectedReservationId,
        reason: body.reason,
        actorUserId: access.userId,
      })
      const idempotencyKeyHash = sha256AuthorityValue(idempotencyKey)

      const result = await withCanonicalWorkGraphPackageLock({
        ownerUserId: access.userId,
        workspaceId: access.workspaceId,
        packageRecordId: beforeExecutionPackage.id,
      }, () => withCanonicalExecutionDomainLock({
        ...scope,
        projectId: beforeSnapshot.projectId,
        editSessionId: beforeSnapshot.editSessionId,
      }, async () => {
        const timestamp = nowIso()
        const authority = await readPrivateEditAuthorityAggregate(scope)
        if (!authority) {
          throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Canonical approved snapshot authority was not found.', 404)
        }
        const replayRecord = authority.idempotencyRecords.find((record) =>
          record.operation === COMPENSATION_OPERATION && record.idempotencyKey === idempotencyKey)
        if (replayRecord) {
          if (replayRecord.requestHash !== requestHash) {
            throw new ApiError(
              'IDEMPOTENCY_CONFLICT',
              'Idempotency-Key was reused with a different post-dispatch compensation request.',
              409,
            )
          }
          return canonicalPostDispatchCompensationResponseSchema.parse(replayRecord.response)
        }

        const snapshot = authority.snapshots.find((record) => record.snapshotId === input.snapshotId)
        const plan = snapshot ? authority.plans.find((record) => record.id === snapshot.planId) : undefined
        const estimate = snapshot
          ? authority.estimates.find((record) => record.id === snapshot.estimateId)
          : undefined
        const reservation = snapshot
          ? authority.reservations.find((record) => record.id === snapshot.reservationId)
          : undefined
        const approval = snapshot
          ? authority.approvals.find((record) => record.id === snapshot.approvalId)
          : undefined
        const jobs = snapshot
          ? authority.jobs.filter((record) => record.snapshotId === snapshot.snapshotId)
          : []
        const executionPackage = snapshot
          ? authority.executionPackages.find((record) => record.snapshotId === snapshot.snapshotId)
          : undefined
        const resumingPendingCompensation = plan?.status === 'cancellation_pending' &&
          plan.cancellationRequestHash === requestHash &&
          plan.cancellationIdempotencyKeyHash === idempotencyKeyHash

        if (!resumingPendingCompensation && authority.revision !== body.expectedAuthorityRevision) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'Canonical authority revision changed; reload before post-dispatch compensation.',
            409,
            {
              expectedAuthorityRevision: body.expectedAuthorityRevision,
              currentAuthorityRevision: authority.revision,
            },
          )
        }
        if (
          !snapshot || !plan || !estimate || !reservation || !approval || !executionPackage ||
          jobs.length === 0 || snapshot.snapshotHash !== body.expectedSnapshotHash ||
          snapshot.reservationId !== body.expectedReservationId ||
          reservation.id !== body.expectedReservationId || reservation.planId !== plan.id ||
          reservation.estimateId !== estimate.id || approval.snapshotId !== snapshot.snapshotId ||
          approval.reservationId !== reservation.id ||
          (plan.status !== 'approved' && !resumingPendingCompensation) || estimate.status !== 'approved'
        ) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'Canonical snapshot, plan, estimate, approval, reservation, job, or execution-package lineage changed.',
            409,
          )
        }
        if (
          reservation.status !== 'reserved' || reservation.spentCredits !== 0 ||
          reservation.releasedCredits !== 0 || reservation.refundedCredits !== 0 ||
          authority.wallet.reservedCredits < reservation.reservedCredits
        ) {
          throw new ApiError(
            'CREDITS_NOT_RESERVED',
            'Post-dispatch compensation supports only a fully unused synthetic private-internal reservation.',
            409,
            { requiredGate: 'canonical_spent_credit_settlement_and_refund_policy' },
          )
        }

        const leaseAggregate = await readPrivateCanonicalWorkerLeaseAggregate(scope)
        const snapshotLeases = leaseAggregate?.leases.filter((lease) =>
          lease.approvedPlanSnapshotId === snapshot.snapshotId) ?? []
        const dispatchAggregate = await readPrivateCanonicalToolDispatchAggregate(scope)
        const snapshotDispatches = dispatchAggregate?.grants.filter((grant) =>
          grant.binding.approvedPlanSnapshotId === snapshot.snapshotId) ?? []
        assertExecutionStoreScope({
          projectId: snapshot.projectId,
          editSessionId: snapshot.editSessionId,
          leases: snapshotLeases,
          dispatches: snapshotDispatches,
        })
        const inFlightStartedFenceCount = snapshotLeases.filter((lease) =>
          lease.executionFence.state === 'started').length
        if (inFlightStartedFenceCount > 0) {
          throw new ApiError(
            'TOOL_NOT_READY',
            'Post-dispatch compensation is blocked while canonical execution remains in flight.',
            409,
            {
              requiredGate: 'canonical_inflight_execution_quiescence_and_compensation',
              inFlightStartedFenceCount,
            },
          )
        }
        const consumedDispatchCount = snapshotDispatches.filter((grant) =>
          grant.status === 'consumed').length
        const completedFenceCount = snapshotLeases.filter((lease) =>
          lease.executionFence.state === 'completed').length
        if (consumedDispatchCount === 0 && completedFenceCount === 0) {
          throw new ApiError(
            'TOOL_NOT_READY',
            'Post-dispatch compensation requires consumed dispatch or completed execution evidence.',
            409,
            {
              requiredGate: 'canonical_post_dispatch_or_completed_execution_evidence',
              replacementRoute: '/v1/approved-snapshots/:snapshotId/cancel',
            },
          )
        }

        const adapterCompletions = await readCompletedAdapterEvidence({
          scope,
          snapshotId: snapshot.snapshotId,
          projectId: snapshot.projectId,
          editSessionId: snapshot.editSessionId,
          completedLeases: snapshotLeases.filter((lease) =>
            lease.executionFence.state === 'completed'),
        })

        const evidence = await readScopedArtifactQaEvidence({
          scope,
          snapshotId: snapshot.snapshotId,
          projectId: snapshot.projectId,
          editSessionId: snapshot.editSessionId,
          adapterCompletions,
        })

        if (!resumingPendingCompensation) {
          await mutatePrivateEditAuthorityAggregate({
            scope,
            planningDomainScope: {
              ...scope,
              projectId: snapshot.projectId,
              editSessionId: snapshot.editSessionId,
            },
            now: timestamp,
            mutation: (aggregate) => {
              const currentSnapshot = aggregate.snapshots.find((record) =>
                record.snapshotId === snapshot.snapshotId)
              const currentPlan = currentSnapshot
                ? aggregate.plans.find((record) => record.id === currentSnapshot.planId)
                : undefined
              const currentReservation = currentSnapshot
                ? aggregate.reservations.find((record) => record.id === currentSnapshot.reservationId)
                : undefined
              if (!currentSnapshot || !currentPlan || !currentReservation) {
                throw new ApiError('IDEMPOTENCY_CONFLICT', 'Compensation-pending lineage is incomplete.', 409)
              }
              if (
                aggregate.revision !== body.expectedAuthorityRevision ||
                currentPlan.status !== 'approved' ||
                currentSnapshot.snapshotHash !== body.expectedSnapshotHash ||
                currentReservation.id !== body.expectedReservationId ||
                currentReservation.status !== 'reserved' || currentReservation.spentCredits !== 0 ||
                currentReservation.releasedCredits !== 0 || currentReservation.refundedCredits !== 0
              ) {
                throw new ApiError(
                  'IDEMPOTENCY_CONFLICT',
                  'Canonical authority changed before the post-dispatch compensation fence was persisted.',
                  409,
                )
              }
              currentPlan.status = 'cancellation_pending'
              currentPlan.cancellationPendingAt = timestamp
              currentPlan.cancellationRequestHash = requestHash
              currentPlan.cancellationIdempotencyKeyHash = idempotencyKeyHash
              aggregate.auditEvents.push({
                id: `authority_audit_${randomUUID()}`,
                eventType: 'canonical_post_dispatch_compensation_pending',
                actorUserId: access.userId,
                projectId: currentSnapshot.projectId,
                editSessionId: currentSnapshot.editSessionId,
                planId: currentPlan.id,
                snapshotId: currentSnapshot.snapshotId,
                createdAt: timestamp,
              })
              return { result: undefined, changed: true }
            },
          })
        }

        const dispatchReconciliation = await reconcileSnapshotDispatchesForCompensation({
          scope,
          snapshotId: snapshot.snapshotId,
          projectId: snapshot.projectId,
          editSessionId: snapshot.editSessionId,
          now: timestamp,
        })
        const leaseReconciliation = await reconcileSnapshotLeasesForCompensation({
          scope,
          snapshotId: snapshot.snapshotId,
          projectId: snapshot.projectId,
          editSessionId: snapshot.editSessionId,
          now: timestamp,
        })

        return mutatePrivateEditAuthorityAggregate({
          scope,
          planningDomainScope: {
            ...scope,
            projectId: snapshot.projectId,
            editSessionId: snapshot.editSessionId,
          },
          now: timestamp,
          mutation: (aggregate) => {
            const existingReplay = aggregate.idempotencyRecords.find((record) =>
              record.operation === COMPENSATION_OPERATION && record.idempotencyKey === idempotencyKey)
            if (existingReplay) {
              if (existingReplay.requestHash !== requestHash) {
                throw new ApiError(
                  'IDEMPOTENCY_CONFLICT',
                  'Idempotency-Key was reused with a different post-dispatch compensation request.',
                  409,
                )
              }
              return {
                result: canonicalPostDispatchCompensationResponseSchema.parse(existingReplay.response),
                changed: false,
              }
            }
            const currentSnapshot = aggregate.snapshots.find((record) =>
              record.snapshotId === snapshot.snapshotId)
            const currentPlan = currentSnapshot
              ? aggregate.plans.find((record) => record.id === currentSnapshot.planId)
              : undefined
            const currentEstimate = currentSnapshot
              ? aggregate.estimates.find((record) => record.id === currentSnapshot.estimateId)
              : undefined
            const currentReservation = currentSnapshot
              ? aggregate.reservations.find((record) => record.id === currentSnapshot.reservationId)
              : undefined
            const currentApproval = currentSnapshot
              ? aggregate.approvals.find((record) => record.id === currentSnapshot.approvalId)
              : undefined
            const currentJobs = currentSnapshot
              ? aggregate.jobs.filter((record) => record.snapshotId === currentSnapshot.snapshotId)
              : []
            const currentExecutionPackage = currentSnapshot
              ? aggregate.executionPackages.find((record) => record.snapshotId === currentSnapshot.snapshotId)
              : undefined
            const ownsPendingCompensation = currentPlan?.status === 'cancellation_pending' &&
              currentPlan.cancellationRequestHash === requestHash &&
              currentPlan.cancellationIdempotencyKeyHash === idempotencyKeyHash
            if (
              !currentSnapshot || !currentPlan || !currentEstimate || !currentReservation ||
              !currentApproval || !currentExecutionPackage || currentJobs.length === 0 ||
              !ownsPendingCompensation || currentEstimate.status !== 'approved' ||
              currentReservation.status !== 'reserved' || currentReservation.spentCredits !== 0 ||
              currentReservation.releasedCredits !== 0 || currentReservation.refundedCredits !== 0 ||
              aggregate.wallet.reservedCredits < currentReservation.reservedCredits
            ) {
              throw new ApiError(
                'IDEMPOTENCY_CONFLICT',
                'Canonical post-dispatch compensation lineage changed before finalization.',
                409,
              )
            }

            const releasedCredits = currentReservation.reservedCredits
            const ledgerEntryId = `authority_ledger_${randomUUID()}`
            const compensationEventId = `authority_reservation_event_${randomUUID()}`
            aggregate.wallet.availableCredits += releasedCredits
            aggregate.wallet.reservedCredits -= releasedCredits
            aggregate.wallet.ledgerSequence += 1
            currentPlan.status = 'cancelled'
            currentPlan.cancelledAt = timestamp
            currentEstimate.status = 'cancelled'
            currentEstimate.cancelledAt = timestamp
            currentReservation.status = 'cancelled'
            currentReservation.releasedCredits = releasedCredits
            currentReservation.updatedAt = timestamp
            aggregate.ledgerEntries.push({
              id: ledgerEntryId,
              sequence: aggregate.wallet.ledgerSequence,
              entryType: 'cancel',
              sourceType: 'canonical_post_dispatch_compensation',
              sourceId: currentReservation.id,
              availableDelta: releasedCredits,
              reservedDelta: -releasedCredits,
              spentDelta: 0,
              balanceAfter: walletBalanceAfter(aggregate.wallet),
              idempotencyKey,
              createdAt: timestamp,
            })
            aggregate.reservationEvents.push({
              id: compensationEventId,
              reservationId: currentReservation.id,
              snapshotId: currentSnapshot.snapshotId,
              approvalId: currentApproval.id,
              eventType: 'cancelled',
              credits: releasedCredits,
              idempotencyKey,
              createdAt: timestamp,
            })
            aggregate.auditEvents.push({
              id: `authority_audit_${randomUUID()}`,
              eventType: 'canonical_approved_snapshot_cancelled_after_dispatch_compensation',
              actorUserId: access.userId,
              projectId: currentSnapshot.projectId,
              editSessionId: currentSnapshot.editSessionId,
              planId: currentPlan.id,
              snapshotId: currentSnapshot.snapshotId,
              createdAt: timestamp,
            })

            const compensationMode = resolveCompensationMode({
              consumedDispatchCount: dispatchReconciliation.consumedDispatchCount,
              completedFenceCount: leaseReconciliation.completedFenceCount,
            })
            const response = canonicalPostDispatchCompensationResponseSchema.parse({
              schemaVersion: 'canonical-post-dispatch-compensation-v1',
              source: 'canonical_post_dispatch_compensation_service',
              authorityRevision: aggregate.revision + 1,
              identity: {
                workspaceId: aggregate.workspaceId,
                projectId: currentSnapshot.projectId,
                editSessionId: currentSnapshot.editSessionId,
                planId: currentPlan.id,
                estimateId: currentEstimate.id,
                snapshotId: currentSnapshot.snapshotId,
                reservationId: currentReservation.id,
              },
              reason: body.reason,
              compensationMode,
              compensationFinalized: true,
              planStatus: currentPlan.status,
              estimateStatus: currentEstimate.status,
              reservation: {
                status: currentReservation.status,
                reservedCredits: currentReservation.reservedCredits,
                spentCredits: currentReservation.spentCredits,
                releasedCredits: currentReservation.releasedCredits,
                refundedCredits: currentReservation.refundedCredits,
              },
              wallet: walletBalanceAfter(aggregate.wallet),
              compensationEventId,
              ledgerEntryId,
              derivedJobIds: currentJobs.map((job) => job.id),
              snapshotRemainsImmutable: true,
              derivedJobsRemainUnmodified: true,
              executionPackagePresent: true,
              executionPackageRecordId: currentExecutionPackage.id,
              executionPackageRecordPreserved: true,
              evidence,
              leases: {
                recordCount: leaseReconciliation.leaseRecordCount,
                releasedCount: leaseReconciliation.releasedLeaseCount,
                expiredCount: leaseReconciliation.expiredLeaseCount,
                notStartedFenceCount: leaseReconciliation.notStartedFenceCount,
                completedFenceCount: leaseReconciliation.completedFenceCount,
                inFlightStartedFenceCount: leaseReconciliation.inFlightStartedFenceCount,
                allLeasesTerminal: true,
              },
              dispatches: {
                recordCount: dispatchReconciliation.dispatchRecordCount,
                revokedCount: dispatchReconciliation.revokedDispatchCount,
                expiredCount: dispatchReconciliation.expiredDispatchCount,
                deniedCount: dispatchReconciliation.deniedDispatchCount,
                consumedCount: dispatchReconciliation.consumedDispatchCount,
                consumedRecordsPreserved: true,
                allDispatchesTerminal: true,
              },
              toolExecutionPreviouslyStarted: leaseReconciliation.completedFenceCount > 0,
              toolExecutionPreviouslyCompleted: leaseReconciliation.completedFenceCount > 0,
              internalTestWalletMutated: true,
              customerWalletMutation: false,
              customerCreditMutation: false,
              billingExecuted: false,
              providerCallStarted: false,
              renderStarted: false,
              publicDeliveryStarted: false,
              testOnly: true,
            })
            aggregate.idempotencyRecords.push({
              operation: COMPENSATION_OPERATION,
              idempotencyKey,
              requestHash,
              responseId: compensationEventId,
              secondaryResponseIds: [ledgerEntryId],
              response,
              completedAt: timestamp,
            })
            return { result: response, changed: true }
          },
        })
      }))

      return {
        compensation: result,
        warnings: [
          'Post-dispatch compensation finalized only after all execution fences were quiescent; consumed dispatch, completed execution, immutable snapshot/job/package, artifact/QA/reconciliation, and internal-cost evidence were preserved.',
          'Only the fully unused synthetic private-internal reservation was released. No customer wallet, customer credits, billing, provider, render, public delivery, Supabase, or production action occurred.',
        ],
      }
    },
  }
}

function assertExecutionStoreScope(input: {
  projectId: string
  editSessionId: string
  leases: Array<{
    id: string
    projectId: string
    editSessionId: string
    jobId: string
    reservationId: string
    attemptNumber: number
    immutableLeaseHash: string
  }>
  dispatches: Array<{
    binding: {
      projectId: string
      editSessionId: string
      jobId: string
      reservationId: string
      leaseId: string
      leaseAttemptNumber: number
      leaseImmutableHash: string
    }
  }>
}): void {
  if (
    input.leases.some((lease) =>
      lease.projectId !== input.projectId || lease.editSessionId !== input.editSessionId) ||
    input.dispatches.some((grant) =>
      grant.binding.projectId !== input.projectId ||
      grant.binding.editSessionId !== input.editSessionId)
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Canonical dispatch or lease scope changed before post-dispatch compensation.',
      409,
    )
  }
  if (input.dispatches.some((grant) => !input.leases.some((lease) =>
    lease.id === grant.binding.leaseId &&
    lease.jobId === grant.binding.jobId &&
    lease.reservationId === grant.binding.reservationId &&
    lease.attemptNumber === grant.binding.leaseAttemptNumber &&
    lease.immutableLeaseHash === grant.binding.leaseImmutableHash))) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Canonical dispatch lost its exact worker-lease lineage before post-dispatch compensation.',
      409,
      { requiredGate: 'canonical_dispatch_lease_compensation_lineage' },
    )
  }
}

async function readScopedArtifactQaEvidence(input: {
  scope: { localStorageRoot: string; ownerUserId: string; workspaceId: string }
  snapshotId: string
  projectId: string
  editSessionId: string
  adapterCompletions: Array<{
    identity: { jobId: string; expectedAssetId: string }
    result: { artifactId: string; qaOutcome: 'passed'; reconciliationDecision: 'test_merged_not_live_authorized' }
    evidence: { attemptCostEvidenceRecorded: boolean }
  }>
}) {
  const aggregate = await readPrivateArtifactQaAggregate(input.scope)
  const artifacts = aggregate?.artifacts.filter((record) =>
    record.identity.snapshotId === input.snapshotId) ?? []
  const qaEvaluations = aggregate?.qaEvaluations.filter((record) =>
    record.identity.snapshotId === input.snapshotId) ?? []
  const reconciliations = aggregate?.reconciliations.filter((record) =>
    record.identity.snapshotId === input.snapshotId) ?? []
  const scopedRecords = [...artifacts, ...qaEvaluations, ...reconciliations]
  if (scopedRecords.some((record) =>
    record.identity.workspaceId !== input.scope.workspaceId ||
    record.identity.projectId !== input.projectId ||
    record.identity.editSessionId !== input.editSessionId)) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'Private artifact/QA evidence scope changed before post-dispatch compensation.',
      409,
    )
  }
  for (const completion of input.adapterCompletions) {
    const artifact = artifacts.find((record) =>
      record.artifactId === completion.result.artifactId &&
      record.identity.jobId === completion.identity.jobId &&
      record.identity.expectedAssetId === completion.identity.expectedAssetId)
    const qa = aggregate?.qaEvaluations.find((record) =>
      record.artifactId === completion.result.artifactId &&
      record.identity.jobId === completion.identity.jobId &&
      record.identity.expectedAssetId === completion.identity.expectedAssetId &&
      record.outcome === 'passed')
    const reconciliation = aggregate?.reconciliations.find((record) =>
      record.artifactId === completion.result.artifactId &&
      record.qaEvaluationId === qa?.qaEvaluationId &&
      record.identity.jobId === completion.identity.jobId &&
      record.identity.expectedAssetId === completion.identity.expectedAssetId &&
      record.decision === 'test_merged_not_live_authorized' &&
      record.privateTestDependencySatisfied)
    if (!artifact || !qa || !reconciliation) {
      throw new ApiError(
        'TOOL_NOT_READY',
        'Completed execution is missing final artifact, QA, or reconciliation quiescence evidence.',
        409,
        { requiredGate: 'canonical_adapter_completion_quiescence_evidence' },
      )
    }
  }
  return {
    artifactRecordCount: artifacts.length,
    qaEvaluationRecordCount: qaEvaluations.length,
    reconciliationRecordCount: reconciliations.length,
    evidenceSetHash: sha256AuthorityValue({ artifacts, qaEvaluations, reconciliations }),
    adapterCompletionRecordCount: input.adapterCompletions.length,
    adapterCompletionSetHash: sha256AuthorityValue(input.adapterCompletions),
    attemptCostEvidenceRecordCount: input.adapterCompletions.filter((completion) =>
      completion.evidence.attemptCostEvidenceRecorded).length,
    committedArtifactQaEvidencePreserved: true as const,
    adapterCompletionEvidencePreserved: true as const,
    internalAttemptCostEvidencePreserved: true as const,
  }
}

async function readCompletedAdapterEvidence(input: {
  scope: { localStorageRoot: string; ownerUserId: string; workspaceId: string }
  snapshotId: string
  projectId: string
  editSessionId: string
  completedLeases: Array<{ jobId: string }>
}) {
  const completions = await Promise.all(input.completedLeases.map((lease) =>
    readCanonicalPrivateJobAdapterCompletion({
      localStorageRoot: input.scope.localStorageRoot,
      ownerUserId: input.scope.ownerUserId,
      workspaceId: input.scope.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      jobId: lease.jobId,
    })))
  if (completions.some((completion, index) =>
    !completion ||
    completion.identity.workspaceId !== input.scope.workspaceId ||
    completion.identity.projectId !== input.projectId ||
    completion.identity.editSessionId !== input.editSessionId ||
    completion.identity.approvedPlanSnapshotId !== input.snapshotId ||
    completion.identity.jobId !== input.completedLeases[index]?.jobId ||
    completion.evidence.reconciliationPassed !== true ||
    completion.evidence.actualQaPassed !== true ||
    completion.evidence.privateArtifactPersisted !== true)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Completed execution lacks a create-only canonical job-adapter completion record.',
      409,
      { requiredGate: 'canonical_adapter_completion_quiescence_evidence' },
    )
  }
  return completions.filter((completion): completion is NonNullable<typeof completion> =>
    completion !== undefined)
}

function resolveCompensationMode(input: {
  consumedDispatchCount: number
  completedFenceCount: number
}): 'consumed_before_start' | 'completed_execution' | 'mixed_quiescent' {
  if (input.consumedDispatchCount > 0 && input.completedFenceCount > 0) return 'mixed_quiescent'
  if (input.consumedDispatchCount > 0) return 'consumed_before_start'
  return 'completed_execution'
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}

function requireIdempotencyKey(value: string | undefined): string {
  const normalized = value?.trim()
  if (!normalized || normalized.length > 240 || Array.from(normalized).some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })) {
    throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'A safe Idempotency-Key is required.', 400)
  }
  return normalized
}

function assertPrivateCompensationRuntime(context: ServiceContext): void {
  if (isExplicitLocalInternalTestRuntime(context.env)) return
  throw new ApiError(
    'TOOL_NOT_READY',
    'Canonical post-dispatch compensation remains private-internal until durable distributed quiescence and settlement evidence exists.',
    503,
    { requiredGate: 'canonical_distributed_quiescence_and_compensation_settlement' },
  )
}
