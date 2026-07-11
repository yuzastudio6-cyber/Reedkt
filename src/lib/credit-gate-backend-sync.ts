import { callReeditProApi, getFrontendApiClientStatus } from '../backend/api/frontend-api-client'
import type { ApprovedPlanSnapshot } from '../types/edit-planning-db'

const INTERNAL_TEST_WORKSPACE_ID = 'workspace-internal-testing'

type CreditApprovalRecord = Record<string, unknown> & {
  id?: string
}

type CreditReservationRecord = Record<string, unknown> & {
  id?: string
}

type CreditApprovalResponse = {
  creditApproval?: CreditApprovalRecord
}

type CreditReservationResponse = {
  creditReservation?: CreditReservationRecord
}

type ApprovedCreditGateInput = {
  snapshot: ApprovedPlanSnapshot
  workspaceId?: string
  approvedByUserId?: string
}

type ApprovedCreditGateResult = {
  ok: boolean
  creditApprovalId: string
  creditReservationId: string
  persisted: boolean
  warnings: string[]
  errorMessage?: string
}

export async function approveAndReserveCreditsForApprovedSnapshot(
  input: ApprovedCreditGateInput,
): Promise<ApprovedCreditGateResult> {
  const fallbackCreditApprovalId = `mock-credit-approval-${input.snapshot.id}`
  const fallbackCreditReservationId = `mock-credit-reservation-${input.snapshot.id}`
  const status = getFrontendApiClientStatus()

  if (status.mockOnly || !status.apiBaseUrl) {
    return {
      ok: true,
      creditApprovalId: fallbackCreditApprovalId,
      creditReservationId: fallbackCreditReservationId,
      persisted: false,
      warnings: [
        'Credit approval/reservation backend persistence skipped because reviewed backend HTTP transport is not configured.',
        ...status.warnings,
      ],
    }
  }

  const workspaceId = input.workspaceId ?? INTERNAL_TEST_WORKSPACE_ID
  const context = {
    workspaceId,
    projectId: input.snapshot.projectId,
    userId: input.approvedByUserId ?? input.snapshot.approvedBy,
  }

  const approvalResponse = await callReeditProApi<Record<string, unknown>, CreditApprovalResponse>(
    'credits.estimate.approve',
    { workspaceId },
    {
      params: { creditEstimateId: input.snapshot.creditEstimateId },
      context,
      idempotencyKey: `credit-approval:${input.snapshot.projectId}:${input.snapshot.editSessionId}:${input.snapshot.creditEstimateId}`.slice(0, 180),
    },
  )

  if (!approvalResponse.ok) {
    return {
      ok: false,
      creditApprovalId: fallbackCreditApprovalId,
      creditReservationId: fallbackCreditReservationId,
      persisted: false,
      warnings: approvalResponse.warnings,
      errorMessage: approvalResponse.error?.message ?? 'Credit estimate approval failed.',
    }
  }

  const reservationResponse = await callReeditProApi<Record<string, unknown>, CreditReservationResponse>(
    'credits.reserve',
    {
      workspaceId,
      projectId: input.snapshot.projectId,
      editPlanId: input.snapshot.editPlanVersionId,
    },
    {
      params: { creditEstimateId: input.snapshot.creditEstimateId },
      context,
      idempotencyKey: `credit-reservation:${input.snapshot.projectId}:${input.snapshot.editSessionId}:${input.snapshot.creditEstimateId}`.slice(0, 180),
    },
  )

  if (!reservationResponse.ok) {
    return {
      ok: false,
      creditApprovalId: getRecordId(approvalResponse.data?.creditApproval) ?? fallbackCreditApprovalId,
      creditReservationId: fallbackCreditReservationId,
      persisted: false,
      warnings: [...approvalResponse.warnings, ...reservationResponse.warnings],
      errorMessage: reservationResponse.error?.message ?? 'Credit reservation failed.',
    }
  }

  return {
    ok: true,
    creditApprovalId: getRecordId(approvalResponse.data?.creditApproval) ?? fallbackCreditApprovalId,
    creditReservationId: getRecordId(reservationResponse.data?.creditReservation) ?? fallbackCreditReservationId,
    persisted: true,
    warnings: [...approvalResponse.warnings, ...reservationResponse.warnings],
  }
}

function getRecordId(record: CreditApprovalRecord | CreditReservationRecord | undefined): string | undefined {
  return typeof record?.id === 'string' && record.id.trim() ? record.id.trim() : undefined
}
