import { callReeditProApi, getFrontendApiClientStatus } from '../backend/api/frontend-api-client'
import type { CanonicalEditJourney } from './canonical-edit-journey'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  invalidateProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'

type CanonicalPlanApprovalApiResponse = {
  canonicalPlanApproval?: unknown
}

export type CanonicalPlanApprovalReceipt = {
  disposition: 'approved_now' | 'exact_replay'
  plan: {
    planId: string
    planVersion: number
    planHash: string
    estimateId: string
    estimateHash: string
    approvedMaximumCredits: number
  }
  approval: {
    approvalId: string
    snapshotId: string
    snapshotHash: string
    reservationId: string
    reservedCredits: number
    jobCount: number
  }
}

export type CanonicalPlanApprovalClientResult =
  | {
      status: 'approved'
      message: string
      retryable: false
      reservationState: 'confirmed'
      receipt: CanonicalPlanApprovalReceipt
      warnings: string[]
    }
  | {
      status: 'not_configured' | 'blocked' | 'insufficient_credits' | 'access_denied' | 'invalid_response' | 'unavailable'
      message: string
      retryable: boolean
      reservationState: 'unchanged' | 'unknown'
      warnings: string[]
    }

export type ApproveCanonicalPlanForNamedEditInput = {
  scope: ProjectPersistenceScope
  projectId: string
  editSessionId: string
  journey: CanonicalEditJourney
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const SHA256 = /^[a-f0-9]{64}$/
const inFlightApprovals = new Map<string, Promise<CanonicalPlanApprovalClientResult>>()

export function approveCanonicalPlanForNamedEdit(
  input: ApproveCanonicalPlanForNamedEditInput,
): Promise<CanonicalPlanApprovalClientResult> {
  const authority = approvalAuthority(input)
  if (!authority.ok) return Promise.resolve(authority.result)

  const requestKey = [
    input.scope.authMode,
    input.scope.userId,
    input.scope.backendUserId ?? '',
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
    authority.planId,
    authority.planHash,
    authority.estimateHash,
  ].join('\u001f')
  const existing = inFlightApprovals.get(requestKey)
  if (existing) return existing

  const request = performApproval(input, authority)
  inFlightApprovals.set(requestKey, request)
  void request.then(
    () => clearInFlightApproval(requestKey, request),
    () => clearInFlightApproval(requestKey, request),
  )
  return request
}

async function performApproval(
  input: ApproveCanonicalPlanForNamedEditInput,
  authority: ApprovalAuthority,
): Promise<CanonicalPlanApprovalClientResult> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return failure(
      'not_configured',
      'Canonical approval is available when the reviewed private backend is connected.',
      false,
      'unchanged',
      runtime.warnings,
    )
  }

  const response = await callReeditProApi<{
    workspaceId: string
    expectedProjectId: string
    expectedEditSessionId: string
    expectedPlanVersion: number
    expectedPlanHash: string
    expectedEstimateId: string
    expectedEstimateHash: string
    expectedMaximumCredits: number
  }, CanonicalPlanApprovalApiResponse>(
    'planning.canonicalPlanApproval.create',
    {
      workspaceId: input.scope.workspaceId,
      expectedProjectId: input.projectId,
      expectedEditSessionId: input.editSessionId,
      expectedPlanVersion: authority.planVersion,
      expectedPlanHash: authority.planHash,
      expectedEstimateId: authority.estimateId,
      expectedEstimateHash: authority.estimateHash,
      expectedMaximumCredits: authority.maximumCredits,
    },
    {
      params: { editPlanId: authority.planId },
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
      idempotencyKey: `canonical-plan-approval:${authority.planId}:${stableClientDigest(
        `${authority.planHash}:${authority.estimateHash}`,
      )}`,
    },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(input.scope)
  }

  if (!response.ok) return classifyFailure(response)

  const receipt = parseReceipt(
    response.data?.canonicalPlanApproval,
    input,
    authority,
  )
  if (!receipt) {
    return failure(
      'invalid_response',
      'The approval response could not be safely matched to the exact plan you reviewed.',
      false,
      'unknown',
      response.warnings,
    )
  }

  return {
    status: 'approved',
    message: receipt.disposition === 'approved_now'
      ? 'Plan and credits approved. The exact version is locked; editing has not started.'
      : 'This exact plan was already approved. The locked approval was safely recovered.',
    retryable: false,
    reservationState: 'confirmed',
    receipt,
    warnings: response.warnings,
  }
}

type ApprovalAuthority = {
  planId: string
  planVersion: number
  planHash: string
  estimateId: string
  estimateHash: string
  maximumCredits: number
}

function approvalAuthority(input: ApproveCanonicalPlanForNamedEditInput):
  | ({ ok: true } & ApprovalAuthority)
  | { ok: false; result: CanonicalPlanApprovalClientResult } {
  const { journey } = input
  if (
    journey.identity.workspaceId !== input.scope.workspaceId ||
    journey.identity.projectId !== input.projectId ||
    journey.identity.editSessionId !== input.editSessionId ||
    journey.stage !== 'plan_approval_required' ||
    !journey.plan ||
    journey.plan.status !== 'presented' ||
    journey.plan.estimateStatus !== 'presented' ||
    !journey.approvalAuthority
  ) {
    return {
      ok: false,
      result: failure(
        'blocked',
        'The saved plan is not the current reviewable version. Refresh before approval.',
        false,
        'unchanged',
        [],
      ),
    }
  }

  const authority = journey.approvalAuthority
  if (
    !isSafeId(authority.planId) ||
    !isSafeId(authority.estimateId) ||
    !isSha(authority.expectedPlanHash) ||
    !isSha(authority.expectedEstimateHash) ||
    !Number.isInteger(journey.plan.version) ||
    journey.plan.version <= 0 ||
    !Number.isInteger(journey.plan.maximumCredits) ||
    journey.plan.maximumCredits < 0
  ) {
    return {
      ok: false,
      result: failure(
        'invalid_response',
        'The saved approval authority was incomplete or invalid.',
        false,
        'unchanged',
        [],
      ),
    }
  }

  return {
    ok: true,
    planId: authority.planId,
    planVersion: journey.plan.version,
    planHash: authority.expectedPlanHash,
    estimateId: authority.estimateId,
    estimateHash: authority.expectedEstimateHash,
    maximumCredits: journey.plan.maximumCredits,
  }
}

function parseReceipt(
  value: unknown,
  input: ApproveCanonicalPlanForNamedEditInput,
  expected: ApprovalAuthority,
): CanonicalPlanApprovalReceipt | null {
  const root = exactRecord(value, [
    'schemaVersion', 'source', 'disposition', 'identity', 'plan', 'approval', 'boundaries',
    'persistence', 'rawAuthorityReturned', 'pathOrCredentialReturned', 'testOnly',
  ])
  if (
    !root ||
    root.schemaVersion !== 'canonical-plan-approval-receipt-v1' ||
    root.source !== 'canonical_plan_approval_coordinator_service' ||
    !['approved_now', 'exact_replay'].includes(String(root.disposition)) ||
    root.rawAuthorityReturned !== false ||
    root.pathOrCredentialReturned !== false ||
    root.testOnly !== true ||
    containsForbiddenPrivateMaterial(root)
  ) return null

  const identity = exactRecord(root.identity, ['workspaceId', 'projectId', 'editSessionId'])
  const plan = exactRecord(root.plan, [
    'planId', 'planVersion', 'status', 'planHash', 'estimateId', 'estimateStatus',
    'estimateHash', 'approvedMaximumCredits',
  ])
  const approval = exactRecord(root.approval, [
    'approvalId', 'snapshotId', 'snapshotHash', 'reservationId', 'reservationStatus',
    'reservedCredits', 'jobCount', 'readyJobCount', 'blockedJobCount',
  ])
  const boundaries = exactRecord(root.boundaries, [
    'approvedSnapshotAvailable', 'syntheticPrivateCreditReservation', 'jobRecordsDerived',
    'paidBillingExecuted', 'customerWalletMutation', 'jobExecutionStarted',
    'toolExecutionStarted', 'providerCallStarted', 'renderStarted', 'publicDeliveryStarted',
  ])
  const persistence = exactRecord(root.persistence, [
    'privateLocal', 'tenantScoped', 'distributed', 'productionAuthority',
  ])
  if (
    !identity ||
    identity.workspaceId !== input.scope.workspaceId ||
    identity.projectId !== input.projectId ||
    identity.editSessionId !== input.editSessionId ||
    !plan ||
    plan.planId !== expected.planId ||
    plan.planVersion !== expected.planVersion ||
    plan.status !== 'approved' ||
    plan.planHash !== expected.planHash ||
    plan.estimateId !== expected.estimateId ||
    plan.estimateStatus !== 'approved' ||
    plan.estimateHash !== expected.estimateHash ||
    plan.approvedMaximumCredits !== expected.maximumCredits ||
    !approval ||
    !isSafeId(approval.approvalId) ||
    !isSafeId(approval.snapshotId) ||
    !isSha(approval.snapshotHash) ||
    !isSafeId(approval.reservationId) ||
    approval.reservationStatus !== 'reserved' ||
    approval.reservedCredits !== expected.maximumCredits ||
    !nonNegativeInteger(approval.jobCount) ||
    !nonNegativeInteger(approval.readyJobCount) ||
    !nonNegativeInteger(approval.blockedJobCount) ||
    Number(approval.readyJobCount) + Number(approval.blockedJobCount) !== Number(approval.jobCount) ||
    !boundaries ||
    boundaries.approvedSnapshotAvailable !== true ||
    boundaries.syntheticPrivateCreditReservation !== true ||
    boundaries.jobRecordsDerived !== true ||
    Object.entries(boundaries).some(([key, entry]) =>
      !['approvedSnapshotAvailable', 'syntheticPrivateCreditReservation', 'jobRecordsDerived'].includes(key) && entry !== false) ||
    !persistence ||
    persistence.privateLocal !== true ||
    persistence.tenantScoped !== true ||
    persistence.distributed !== false ||
    persistence.productionAuthority !== false
  ) return null

  return {
    disposition: root.disposition as CanonicalPlanApprovalReceipt['disposition'],
    plan: {
      planId: expected.planId,
      planVersion: expected.planVersion,
      planHash: expected.planHash,
      estimateId: expected.estimateId,
      estimateHash: expected.estimateHash,
      approvedMaximumCredits: expected.maximumCredits,
    },
    approval: {
      approvalId: approval.approvalId,
      snapshotId: approval.snapshotId,
      snapshotHash: approval.snapshotHash,
      reservationId: approval.reservationId,
      reservedCredits: Number(approval.reservedCredits),
      jobCount: Number(approval.jobCount),
    },
  }
}

function classifyFailure(response: {
  statusCode: number
  error?: { code?: string }
  warnings: string[]
}): CanonicalPlanApprovalClientResult {
  const code = response.error?.code
  if (
    response.statusCode === 401 ||
    response.statusCode === 403 ||
    ['AUTH_REQUIRED', 'AUTH_INVALID', 'WORKSPACE_ACCESS_DENIED'].includes(code ?? '')
  ) {
    return failure(
      'access_denied',
      'This plan cannot be approved outside the current signed-in workspace.',
      false,
      'unchanged',
      response.warnings,
    )
  }
  if (code === 'INSUFFICIENT_CREDITS') {
    return failure(
      'insufficient_credits',
      'This workspace does not have enough test credits for the approved maximum. Choose a lower-cost plan or add credits before trying again.',
      false,
      'unchanged',
      response.warnings,
    )
  }
  if ([
    'VALIDATION_FAILED',
    'IDEMPOTENCY_CONFLICT',
    'PLAN_NOT_APPROVED',
    'CREDIT_ESTIMATE_NOT_APPROVED',
    'APPROVED_SNAPSHOT_REQUIRED',
    'INVALID_STORED_STATE',
    'INTEGRITY_CHECK_FAILED',
  ].includes(code ?? '')) {
    return failure(
      'blocked',
      'The plan, estimate, or saved edit state changed. Refresh and review the current version before approval.',
      false,
      'unchanged',
      response.warnings,
    )
  }
  if (['invalid_backend_response', 'invalid_json_response'].includes(code ?? '')) {
    return failure(
      'invalid_response',
      'The approval response could not be safely verified.',
      false,
      'unknown',
      response.warnings,
    )
  }
  return failure(
    'unavailable',
    'Approval could not be confirmed. Refresh the saved workflow before trying again so an existing reservation is not mistaken for a failure.',
    false,
    'unknown',
    response.warnings,
  )
}

function failure(
  status: Exclude<CanonicalPlanApprovalClientResult['status'], 'approved'>,
  message: string,
  retryable: boolean,
  reservationState: 'unchanged' | 'unknown',
  warnings: string[],
): CanonicalPlanApprovalClientResult {
  return { status, message, retryable, reservationState, warnings }
}

function exactRecord(value: unknown, keys: string[]): Record<string, unknown> | null {
  if (!isRecord(value)) return null
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
    ? value
    : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 200 && value === value.trim() &&
    SAFE_ID.test(value) && !value.includes('..')
}

function isSha(value: unknown): value is string {
  return typeof value === 'string' && SHA256.test(value)
}

function nonNegativeInteger(value: unknown): boolean {
  return Number.isInteger(value) && Number(value) >= 0
}

function containsForbiddenPrivateMaterial(value: unknown, key = ''): boolean {
  if (key === 'pathOrCredentialReturned' || key === 'rawAuthorityReturned') return value !== false
  if (/^(?:secret|credential|accessToken|refreshToken|signedUrl|publicUrl|localPath|absolutePath|relativePath|sourceBytes|bytesBase64|rawAuthority|jobIds|componentRefs)$/i.test(key)) return true
  if (Array.isArray(value)) return value.some((entry) => containsForbiddenPrivateMaterial(entry))
  if (isRecord(value)) {
    return Object.entries(value).some(([childKey, child]) =>
      containsForbiddenPrivateMaterial(child, childKey))
  }
  return false
}

function stableClientDigest(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function clearInFlightApproval(
  key: string,
  request: Promise<CanonicalPlanApprovalClientResult>,
) {
  if (inFlightApprovals.get(key) === request) inFlightApprovals.delete(key)
}
