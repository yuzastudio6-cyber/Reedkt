import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  approvePresentedCanonicalPlanSchema,
  canonicalPlanApprovalReceiptSchema,
  type ApprovePresentedCanonicalPlanBody,
  type CanonicalPlanApprovalReceipt,
} from '../validation/canonical-plan-approval-schemas'
import { createEditPlanningAuthorityService } from './edit-planning-authority-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

const approvalLocks = new Map<string, Promise<void>>()

type CanonicalApprovalPlan = {
  workspaceId: string
  authorityRevision: number
  planId: string
  projectId: string
  editSessionId: string
  planVersion: number
  status: 'presented' | 'approved'
  planHash: string
  estimateId: string
  estimateStatus: 'presented' | 'approved'
  estimateHash: string
  approvedMaximumCredits: number
}

type CanonicalApprovalLineage = {
  approvalId: string
  snapshotId: string
  snapshotHash: string
  reservationId: string
  reservationStatus: CanonicalPlanApprovalReceipt['approval']['reservationStatus']
  reservedCredits: number
  jobCount: number
  readyJobCount: number
  blockedJobCount: number
}

export type CanonicalPlanApprovalCoordinatorResult = {
  approval: CanonicalPlanApprovalReceipt
  warnings: string[]
}

export function createCanonicalPlanApprovalCoordinatorService(context: ServiceContext) {
  return {
    async approve(input: ApprovePresentedCanonicalPlanBody & {
      editPlanId: string
    }): Promise<CanonicalPlanApprovalCoordinatorResult> {
      const body = approvePresentedCanonicalPlanSchema.parse({
        workspaceId: input.workspaceId,
        expectedProjectId: input.expectedProjectId,
        expectedEditSessionId: input.expectedEditSessionId,
        expectedPlanVersion: input.expectedPlanVersion,
        expectedPlanHash: input.expectedPlanHash,
        expectedEstimateId: input.expectedEstimateId,
        expectedEstimateHash: input.expectedEstimateHash,
        expectedMaximumCredits: input.expectedMaximumCredits,
      })
      const lockScope = {
        workspaceId: body.workspaceId,
        editPlanId: input.editPlanId,
      }

      return withApprovalLock(lockScope, async () => {
        const authorityService = createEditPlanningAuthorityService(context)
        let current = await loadAndVerifyPresentedAuthority(
          authorityService,
          input.editPlanId,
          body,
        )

        if (current.status === 'approved') {
          const approval = await loadApprovalLineage(authorityService, current, body.workspaceId)
          return result(current, approval, 'exact_replay')
        }

        const idempotencyDigest = sha256AuthorityValue({
          domain: 'canonical_plan_approval_coordinator_v1',
          workspaceId: body.workspaceId,
          editPlanId: current.planId,
          planVersion: current.planVersion,
          planHash: current.planHash,
          estimateId: current.estimateId,
          estimateHash: current.estimateHash,
          approvedMaximumCredits: current.approvedMaximumCredits,
        })

        try {
          await authorityService.approveAndFundCanonicalPlan({
            workspaceId: body.workspaceId,
            editPlanId: current.planId,
            expectedAuthorityRevision: current.authorityRevision,
            expectedPlanHash: current.planHash,
            expectedEstimateHash: current.estimateHash,
            idempotencyKey: `canonical-plan-approval:${idempotencyDigest}`,
            requestPath: `/internal/canonical-plan-approvals/${current.planId}`,
          })
        } catch (error) {
          if (!(error instanceof ApiError) || error.code !== 'IDEMPOTENCY_CONFLICT') throw error
          current = await loadAndVerifyPresentedAuthority(
            authorityService,
            input.editPlanId,
            body,
          )
          if (current.status !== 'approved') throw error
          const approval = await loadApprovalLineage(authorityService, current, body.workspaceId)
          return result(current, approval, 'exact_replay')
        }

        current = await loadAndVerifyPresentedAuthority(
          authorityService,
          input.editPlanId,
          body,
        )
        if (current.status !== 'approved') {
          throw new ApiError(
            'APPROVED_SNAPSHOT_REQUIRED',
            'Canonical approval completed without immutable approved plan authority.',
            500,
          )
        }
        const approval = await loadApprovalLineage(authorityService, current, body.workspaceId)
        return result(current, approval, 'approved_now')
      })
    },
  }
}

async function loadAndVerifyPresentedAuthority(
  authorityService: ReturnType<typeof createEditPlanningAuthorityService>,
  editPlanId: string,
  expected: ApprovePresentedCanonicalPlanBody,
): Promise<CanonicalApprovalPlan> {
  const loaded = await authorityService.getCanonicalPlan(editPlanId, expected.workspaceId)
  const authority = record(loaded.authority, 'canonical authority')
  const plan = record(authority.plan, 'canonical plan')
  const estimate = record(authority.estimate, 'canonical estimate')
  const current: CanonicalApprovalPlan = {
    workspaceId: expected.workspaceId,
    authorityRevision: positiveInteger(authority.authorityRevision, 'authority revision'),
    planId: safeIdentity(plan.id, 'plan id'),
    projectId: safeIdentity(plan.projectId, 'project id'),
    editSessionId: safeIdentity(plan.editSessionId, 'edit session id'),
    planVersion: positiveInteger(plan.planVersion, 'plan version'),
    status: approvalStatus(plan.status, 'plan status'),
    planHash: sha(plan.planHash, 'plan hash'),
    estimateId: safeIdentity(estimate.id, 'estimate id'),
    estimateStatus: approvalStatus(estimate.status, 'estimate status'),
    estimateHash: sha(estimate.estimateHash, 'estimate hash'),
    approvedMaximumCredits: nonNegativeInteger(
      estimate.approvedMaximumCredits,
      'approved maximum credits',
    ),
  }

  if (current.planId !== editPlanId) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Canonical plan identity changed before approval.', 409)
  }
  if (
    current.projectId !== expected.expectedProjectId ||
    current.editSessionId !== expected.expectedEditSessionId ||
    current.planVersion !== expected.expectedPlanVersion ||
    current.planHash !== expected.expectedPlanHash ||
    current.estimateId !== expected.expectedEstimateId ||
    current.estimateHash !== expected.expectedEstimateHash ||
    current.approvedMaximumCredits !== expected.expectedMaximumCredits
  ) {
    throw new ApiError(
      'IDEMPOTENCY_CONFLICT',
      'The plan or credit estimate changed after it was presented. Reload before approval.',
      409,
      { requiredGate: 'exact_presented_plan_and_estimate' },
    )
  }
  if (current.status !== current.estimateStatus) {
    throw new ApiError(
      'CREDIT_ESTIMATE_NOT_APPROVED',
      'Canonical plan and estimate are not in the same approval state.',
      409,
    )
  }
  return current
}

async function loadApprovalLineage(
  authorityService: ReturnType<typeof createEditPlanningAuthorityService>,
  current: CanonicalApprovalPlan,
  workspaceId: string,
): Promise<CanonicalApprovalLineage> {
  const loaded = await authorityService.getCanonicalPlanApproval(current.planId, workspaceId)
  const approval = record(loaded.approval, 'canonical approval lineage')
  const lineage: CanonicalApprovalLineage = {
    approvalId: safeIdentity(approval.approvalId, 'approval id'),
    snapshotId: safeIdentity(approval.snapshotId, 'snapshot id'),
    snapshotHash: sha(approval.snapshotHash, 'snapshot hash'),
    reservationId: safeIdentity(approval.reservationId, 'reservation id'),
    reservationStatus: reservationStatus(approval.reservationStatus),
    reservedCredits: nonNegativeInteger(approval.reservedCredits, 'reserved credits'),
    jobCount: nonNegativeInteger(approval.jobCount, 'job count'),
    readyJobCount: nonNegativeInteger(approval.readyJobCount, 'ready job count'),
    blockedJobCount: nonNegativeInteger(approval.blockedJobCount, 'blocked job count'),
  }
  if (
    lineage.reservationStatus !== 'reserved' ||
    lineage.reservedCredits !== current.approvedMaximumCredits ||
    lineage.readyJobCount + lineage.blockedJobCount !== lineage.jobCount
  ) {
    throw new ApiError(
      'APPROVED_SNAPSHOT_REQUIRED',
      'Canonical approval is no longer in the pre-execution snapshot state.',
      409,
      { requiredGate: 'approved_snapshot_before_execution' },
    )
  }
  return lineage
}

function result(
  current: CanonicalApprovalPlan,
  approval: CanonicalApprovalLineage,
  disposition: CanonicalPlanApprovalReceipt['disposition'],
): CanonicalPlanApprovalCoordinatorResult {
  const receipt = canonicalPlanApprovalReceiptSchema.parse({
    schemaVersion: 'canonical-plan-approval-receipt-v1',
    source: 'canonical_plan_approval_coordinator_service',
    disposition,
    identity: {
      workspaceId: current.workspaceId,
      projectId: current.projectId,
      editSessionId: current.editSessionId,
    },
    plan: {
      planId: current.planId,
      planVersion: current.planVersion,
      status: 'approved',
      planHash: current.planHash,
      estimateId: current.estimateId,
      estimateStatus: 'approved',
      estimateHash: current.estimateHash,
      approvedMaximumCredits: current.approvedMaximumCredits,
    },
    approval,
    boundaries: {
      approvedSnapshotAvailable: true,
      syntheticPrivateCreditReservation: true,
      jobRecordsDerived: true,
      paidBillingExecuted: false,
      customerWalletMutation: false,
      jobExecutionStarted: false,
      toolExecutionStarted: false,
      providerCallStarted: false,
      renderStarted: false,
      publicDeliveryStarted: false,
    },
    persistence: {
      privateLocal: true,
      tenantScoped: true,
      distributed: false,
      productionAuthority: false,
    },
    rawAuthorityReturned: false,
    pathOrCredentialReturned: false,
    testOnly: true,
  })
  return {
    approval: receipt,
    warnings: [
      disposition === 'approved_now'
        ? 'The exact presented plan and estimate were approved into one immutable private snapshot.'
        : 'The exact approval was already recorded; the existing immutable snapshot receipt was reused.',
      'Synthetic private-internal test credits are reserved; no paid billing or customer wallet mutation occurred.',
      'Job records were derived but no job, tool, provider, render, or public delivery action started.',
    ],
  }
}

async function withApprovalLock<T>(
  scope: { workspaceId: string; editPlanId: string },
  action: () => Promise<T>,
): Promise<T> {
  const key = sha256AuthorityValue({
    domain: 'canonical_plan_approval_coordinator_lock_v1',
    ...scope,
  })
  const previous = approvalLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => { release = resolve })
  approvalLocks.set(key, current)
  await previous
  try {
    return await action()
  } finally {
    release()
    if (approvalLocks.get(key) === current) approvalLocks.delete(key)
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('INTERNAL_ERROR', `${label} is missing or invalid.`, 500)
  }
  return value as Record<string, unknown>
}

function safeIdentity(value: unknown, label: string): string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > 200 ||
    value !== value.trim() ||
    value.includes('..') ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)
  ) {
    throw new ApiError('INTERNAL_ERROR', `${label} is invalid.`, 500)
  }
  return value
}

function sha(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) {
    throw new ApiError('INTERNAL_ERROR', `${label} is invalid.`, 500)
  }
  return value
}

function positiveInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new ApiError('INTERNAL_ERROR', `${label} is invalid.`, 500)
  }
  return Number(value)
}

function nonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new ApiError('INTERNAL_ERROR', `${label} is invalid.`, 500)
  }
  return Number(value)
}

function approvalStatus(value: unknown, label: string): 'presented' | 'approved' {
  if (value !== 'presented' && value !== 'approved') {
    throw new ApiError('PLAN_NOT_APPROVED', `${label} is not available for approval.`, 409)
  }
  return value
}

function reservationStatus(value: unknown): CanonicalApprovalLineage['reservationStatus'] {
  const allowed: CanonicalApprovalLineage['reservationStatus'][] = [
    'reserved',
    'partially_spent',
    'spent',
    'released',
    'refunded',
    'cancelled',
    'expired',
  ]
  if (!allowed.includes(value as CanonicalApprovalLineage['reservationStatus'])) {
    throw new ApiError('INTERNAL_ERROR', 'Canonical reservation status is invalid.', 500)
  }
  return value as CanonicalApprovalLineage['reservationStatus']
}
