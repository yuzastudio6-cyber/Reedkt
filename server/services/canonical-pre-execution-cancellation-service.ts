import { randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import { isExplicitLocalInternalTestRuntime } from '../middleware/canonical-worker-runtime'
import type { ServiceContext } from '../types'
import {
  cancelCanonicalApprovedSnapshotSchema,
  canonicalPreExecutionCancellationResponseSchema,
  type CancelCanonicalApprovedSnapshotBody,
} from '../validation/canonical-pre-execution-cancellation-schemas'
import {
  mutatePrivateEditAuthorityAggregate,
  readPrivateEditAuthorityAggregate,
  sha256AuthorityValue,
  walletBalanceAfter,
} from './private-edit-authority-store'
import { withCanonicalExecutionDomainLock } from './canonical-execution-domain-lock'
import { readPrivateCanonicalToolDispatchAggregate } from './private-canonical-tool-dispatch-store'
import { readPrivateCanonicalWorkerLeaseAggregate } from './private-canonical-worker-lease-store'
import { createProjectService } from './project-service'
import { nowIso } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export function createCanonicalPreExecutionCancellationService(context: ServiceContext) {
  return {
    async cancel(input: CancelCanonicalApprovedSnapshotBody & {
      snapshotId: string
      idempotencyKey: string
      requestPath?: string
    }) {
      assertPrivateCancellationRuntime(context)
      const parsed = cancelCanonicalApprovedSnapshotSchema.safeParse({
        workspaceId: input.workspaceId,
        expectedAuthorityRevision: input.expectedAuthorityRevision,
        expectedSnapshotHash: input.expectedSnapshotHash,
        expectedReservationId: input.expectedReservationId,
        reason: input.reason,
      })
      if (!parsed.success || !safeIdentity(input.snapshotId)) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Canonical pre-execution cancellation request validation failed.',
          400,
          parsed.success ? { snapshotId: ['Invalid approved snapshot identity.'] } : parsed.error.flatten(),
        )
      }
      const idempotencyKey = requireIdempotencyKey(input.idempotencyKey)
      const body = parsed.data
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
      await createProjectService(context).getProject(beforeSnapshot.projectId, access.workspaceId)
      const requestHash = sha256AuthorityValue({
        operation: 'cancel_approved_snapshot',
        requestPath: input.requestPath ?? '/v1/approved-snapshots/:snapshotId/cancel',
        workspaceId: access.workspaceId,
        snapshotId: input.snapshotId,
        expectedAuthorityRevision: body.expectedAuthorityRevision,
        expectedSnapshotHash: body.expectedSnapshotHash,
        expectedReservationId: body.expectedReservationId,
        reason: body.reason,
        actorUserId: access.userId,
      })
      const timestamp = nowIso()
      const result = await withCanonicalExecutionDomainLock({
        ...scope,
        projectId: beforeSnapshot.projectId,
        editSessionId: beforeSnapshot.editSessionId,
      }, async () => {
        const leaseAggregate = await readPrivateCanonicalWorkerLeaseAggregate(scope)
        const snapshotLeases = leaseAggregate?.leases.filter((lease) =>
          lease.approvedPlanSnapshotId === input.snapshotId) ?? []
        const dispatchAggregate = await readPrivateCanonicalToolDispatchAggregate(scope)
        const snapshotDispatches = dispatchAggregate?.grants.filter((grant) =>
          grant.binding.approvedPlanSnapshotId === input.snapshotId) ?? []
        if (snapshotLeases.length > 0 || snapshotDispatches.length > 0) {
          throw new ApiError(
            'TOOL_NOT_READY',
            'Cancellation is blocked after canonical lease or dispatch authority has existed.',
            409,
            {
              requiredGate: 'canonical_post_lease_cancellation_and_worker_fencing',
              leaseRecordCount: snapshotLeases.length,
              dispatchRecordCount: snapshotDispatches.length,
            },
          )
        }
        return mutatePrivateEditAuthorityAggregate({
        scope,
        planningDomainScope: {
          ...scope,
          projectId: beforeSnapshot.projectId,
          editSessionId: beforeSnapshot.editSessionId,
        },
        now: timestamp,
        mutation: (aggregate) => {
          const replayRecord = aggregate.idempotencyRecords.find((record) =>
            record.operation === 'cancel_approved_snapshot' && record.idempotencyKey === idempotencyKey)
          if (replayRecord) {
            if (replayRecord.requestHash !== requestHash) {
              throw new ApiError(
                'IDEMPOTENCY_CONFLICT',
                'Idempotency-Key was reused with a different canonical cancellation request.',
                409,
              )
            }
            return {
              result: canonicalPreExecutionCancellationResponseSchema.parse(replayRecord.response),
              changed: false,
            }
          }
          if (aggregate.revision !== body.expectedAuthorityRevision) {
            throw new ApiError(
              'IDEMPOTENCY_CONFLICT',
              'Canonical authority revision changed; reload before cancellation.',
              409,
              {
                expectedAuthorityRevision: body.expectedAuthorityRevision,
                currentAuthorityRevision: aggregate.revision,
              },
            )
          }
          const snapshot = aggregate.snapshots.find((record) => record.snapshotId === input.snapshotId)
          const plan = snapshot
            ? aggregate.plans.find((record) => record.id === snapshot.planId)
            : undefined
          const estimate = snapshot
            ? aggregate.estimates.find((record) => record.id === snapshot.estimateId)
            : undefined
          const reservation = snapshot
            ? aggregate.reservations.find((record) => record.id === snapshot.reservationId)
            : undefined
          const approval = snapshot
            ? aggregate.approvals.find((record) => record.id === snapshot.approvalId)
            : undefined
          const jobs = snapshot
            ? aggregate.jobs.filter((record) => record.snapshotId === snapshot.snapshotId)
            : []
          const executionPackage = snapshot
            ? aggregate.executionPackages.find((record) => record.snapshotId === snapshot.snapshotId)
            : undefined
          if (
            !snapshot || !plan || !estimate || !reservation || !approval || jobs.length === 0 ||
            snapshot.snapshotHash !== body.expectedSnapshotHash ||
            snapshot.reservationId !== body.expectedReservationId ||
            reservation.id !== body.expectedReservationId ||
            reservation.planId !== plan.id || reservation.estimateId !== estimate.id ||
            approval.snapshotId !== snapshot.snapshotId || approval.reservationId !== reservation.id ||
            plan.status !== 'approved' || estimate.status !== 'approved'
          ) {
            throw new ApiError(
              'IDEMPOTENCY_CONFLICT',
              'Canonical snapshot, plan, estimate, approval, reservation, or job lineage changed.',
              409,
            )
          }
          if (
            reservation.status !== 'reserved' || reservation.spentCredits !== 0 ||
            reservation.releasedCredits !== 0 || reservation.refundedCredits !== 0 ||
            aggregate.wallet.reservedCredits < reservation.reservedCredits
          ) {
            throw new ApiError(
              'CREDITS_NOT_RESERVED',
              'Only a fully unused synthetic reservation can be cancelled before execution.',
              409,
            )
          }

          const releasedCredits = reservation.reservedCredits
          const ledgerEntryId = `authority_ledger_${randomUUID()}`
          const cancellationEventId = `authority_reservation_event_${randomUUID()}`
          aggregate.wallet.availableCredits += releasedCredits
          aggregate.wallet.reservedCredits -= releasedCredits
          aggregate.wallet.ledgerSequence += 1
          plan.status = 'cancelled'
          plan.cancelledAt = timestamp
          estimate.status = 'cancelled'
          estimate.cancelledAt = timestamp
          reservation.status = 'cancelled'
          reservation.releasedCredits = releasedCredits
          reservation.updatedAt = timestamp
          aggregate.ledgerEntries.push({
            id: ledgerEntryId,
            sequence: aggregate.wallet.ledgerSequence,
            entryType: 'cancel',
            sourceType: 'canonical_pre_execution_cancellation',
            sourceId: reservation.id,
            availableDelta: releasedCredits,
            reservedDelta: -releasedCredits,
            spentDelta: 0,
            balanceAfter: walletBalanceAfter(aggregate.wallet),
            idempotencyKey,
            createdAt: timestamp,
          })
          aggregate.reservationEvents.push({
            id: cancellationEventId,
            reservationId: reservation.id,
            snapshotId: snapshot.snapshotId,
            approvalId: approval.id,
            eventType: 'cancelled',
            credits: releasedCredits,
            idempotencyKey,
            createdAt: timestamp,
          })
          aggregate.auditEvents.push({
            id: `authority_audit_${randomUUID()}`,
            eventType: 'canonical_approved_snapshot_cancelled_before_execution',
            actorUserId: access.userId,
            projectId: snapshot.projectId,
            editSessionId: snapshot.editSessionId,
            planId: plan.id,
            snapshotId: snapshot.snapshotId,
            createdAt: timestamp,
          })
          const response = canonicalPreExecutionCancellationResponseSchema.parse({
            schemaVersion: 'canonical-pre-execution-cancellation-v1',
            source: 'canonical_pre_execution_cancellation_service',
            authorityRevision: aggregate.revision + 1,
            identity: {
              workspaceId: aggregate.workspaceId,
              projectId: snapshot.projectId,
              editSessionId: snapshot.editSessionId,
              planId: plan.id,
              estimateId: estimate.id,
              snapshotId: snapshot.snapshotId,
              reservationId: reservation.id,
            },
            reason: body.reason,
            planStatus: plan.status,
            estimateStatus: estimate.status,
            reservation: {
              status: reservation.status,
              reservedCredits: reservation.reservedCredits,
              spentCredits: reservation.spentCredits,
              releasedCredits: reservation.releasedCredits,
              refundedCredits: reservation.refundedCredits,
            },
            wallet: walletBalanceAfter(aggregate.wallet),
            cancellationEventId,
            ledgerEntryId,
            derivedJobIds: jobs.map((job) => job.id),
            snapshotRemainsImmutable: true,
            derivedJobsRemainUnmodified: true,
            executionPackagePresent: Boolean(executionPackage),
            ...(executionPackage ? { executionPackageRecordId: executionPackage.id } : {}),
            executionPackageRecordPreserved: true,
            workerLeaseCreated: false,
            dispatchGrantCreated: false,
            internalTestWalletMutated: true,
            customerWalletMutation: false,
            customerCreditMutation: false,
            billingExecuted: false,
            toolExecutionStarted: false,
            providerCallStarted: false,
            renderStarted: false,
            publicDeliveryStarted: false,
            testOnly: true,
          })
          aggregate.idempotencyRecords.push({
            operation: 'cancel_approved_snapshot',
            idempotencyKey,
            requestHash,
            responseId: cancellationEventId,
            secondaryResponseIds: [ledgerEntryId],
            response,
            completedAt: timestamp,
          })
          return { result: response, changed: true }
        },
      })
      })
      return {
        cancellation: result,
        warnings: [
          'Only the unused synthetic private-internal reservation was released; the approved snapshot and derived jobs remain immutable audit evidence.',
          'No customer wallet, customer credits, billing, provider, tool, render, public delivery, Supabase, or production action occurred.',
        ],
      }
    },
  }
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

function assertPrivateCancellationRuntime(context: ServiceContext): void {
  if (isExplicitLocalInternalTestRuntime(context.env)) return
  throw new ApiError(
    'TOOL_NOT_READY',
    'Canonical cancellation remains private-internal until durable transaction and worker-fencing evidence exists.',
    503,
    { requiredGate: 'canonical_transactional_cancellation_and_worker_fencing' },
  )
}
