import { callReeditProApi, getFrontendApiClientStatus } from '../backend/api/frontend-api-client'
import type { CanonicalEditJourney } from './canonical-edit-journey'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  invalidateProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'

type CanonicalPrivateEditPreparationApiResponse = {
  canonicalPrivateEditPreparation?: unknown
}

export type CanonicalPrivateEditPreparationReceipt = {
  disposition: 'private_review_ready' | 'blocked'
  identity: {
    workspaceId: string
    projectId: string
    editSessionId: string
    packageRecordId: string
    approvedPlanSnapshotId: string
  }
  authority: {
    packageHash: string
    snapshotHash: string
  }
  progress: {
    totalJobCount: number
    completedJobCount: number
    blockedJobCount: number
    allRequiredJobsCompleted: boolean
    retryAvailable: boolean
    userReviewRequired: boolean
  }
  review: null | {
    reviewAssemblyId: string
    manifestSha256: string
    finalArtifactSha256: string
    finalArtifactByteLength: number
  }
  completedAt: string
}

export type CanonicalPrivateEditPreparationClientResult =
  | {
      status: 'ready'
      message: string
      retryable: false
      receipt: CanonicalPrivateEditPreparationReceipt
      warnings: string[]
    }
  | {
      status: 'blocked'
      message: string
      retryable: boolean
      receipt?: CanonicalPrivateEditPreparationReceipt
      warnings: string[]
    }
  | {
      status: 'not_configured' | 'access_denied' | 'invalid_response' | 'unavailable'
      message: string
      retryable: boolean
      warnings: string[]
    }

export type PrepareCanonicalPrivateEditForNamedEditInput = {
  scope: ProjectPersistenceScope
  projectId: string
  editSessionId: string
  journey: CanonicalEditJourney
}

type PreparationAuthority = {
  packageRecordId: string
  packageHash: string
  snapshotId: string
  snapshotHash: string
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const SHA256 = /^[a-f0-9]{64}$/
const OFFSET_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
const inFlightRequests = new Map<
  string,
  Promise<CanonicalPrivateEditPreparationClientResult>
>()

export function prepareCanonicalPrivateEditForNamedEdit(
  input: PrepareCanonicalPrivateEditForNamedEditInput,
): Promise<CanonicalPrivateEditPreparationClientResult> {
  const authority = preparationAuthority(input)
  if (!authority.ok) return Promise.resolve(authority.result)

  const requestKey = [
    input.scope.authMode,
    input.scope.userId,
    input.scope.backendUserId ?? '',
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
    authority.packageRecordId,
    authority.packageHash,
    authority.snapshotId,
    authority.snapshotHash,
  ].join('\u001f')
  const existing = inFlightRequests.get(requestKey)
  if (existing) return existing

  const request = performRequest(input, authority)
  inFlightRequests.set(requestKey, request)
  void request.then(
    () => clearInFlightRequest(requestKey, request),
    () => clearInFlightRequest(requestKey, request),
  )
  return request
}

async function performRequest(
  input: PrepareCanonicalPrivateEditForNamedEditInput,
  authority: PreparationAuthority,
): Promise<CanonicalPrivateEditPreparationClientResult> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return failure(
      'not_configured',
      'Private edit preparation is available when the reviewed local backend is connected.',
      false,
      runtime.warnings,
    )
  }

  const response = await callReeditProApi<{
    workspaceId: string
    expectedProjectId: string
    expectedEditSessionId: string
    expectedSnapshotId: string
    expectedSnapshotHash: string
    expectedPackageHash: string
    purpose: 'prepare_canonical_private_edit_review'
  }, CanonicalPrivateEditPreparationApiResponse>(
    'editExecution.canonicalPrivateEditPreparation.create',
    {
      workspaceId: input.scope.workspaceId,
      expectedProjectId: input.projectId,
      expectedEditSessionId: input.editSessionId,
      expectedSnapshotId: authority.snapshotId,
      expectedSnapshotHash: authority.snapshotHash,
      expectedPackageHash: authority.packageHash,
      purpose: 'prepare_canonical_private_edit_review',
    },
    {
      params: { packageRecordId: authority.packageRecordId },
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
      idempotencyKey: `canonical-private-edit:${stableClientDigest(
        `${authority.packageRecordId}:${authority.packageHash}:${newAttemptToken()}`,
      )}`,
    },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  if (!response.ok) return classifyFailure(response)

  const receipt = parseReceipt(
    response.data?.canonicalPrivateEditPreparation,
    input,
    authority,
  )
  if (!receipt) {
    return failure(
      'invalid_response',
      'The private preparation response could not be safely matched to this approved edit.',
      false,
      response.warnings,
    )
  }
  if (receipt.disposition === 'blocked') {
    const completed = receipt.progress.completedJobCount
    const total = receipt.progress.totalJobCount
    return {
      status: 'blocked',
      message: receipt.progress.userReviewRequired
        ? `${completed} of ${total} private preparation steps completed. A required step needs review before the edit can continue.`
        : `${completed} of ${total} private preparation steps completed. Required capability checks are still blocked.`,
      retryable: receipt.progress.retryAvailable,
      receipt,
      warnings: response.warnings,
    }
  }

  return {
    status: 'ready',
    message: 'The exact approved edit is assembled for private review. Publishing, billing, and production delivery remain off.',
    retryable: false,
    receipt,
    warnings: response.warnings,
  }
}

function preparationAuthority(
  input: PrepareCanonicalPrivateEditForNamedEditInput,
):
  | ({ ok: true } & PreparationAuthority)
  | { ok: false; result: CanonicalPrivateEditPreparationClientResult } {
  const { journey } = input
  const authority = journey.privateEditPreparationAuthority
  if (
    journey.identity.workspaceId !== input.scope.workspaceId ||
    journey.identity.projectId !== input.projectId ||
    journey.identity.editSessionId !== input.editSessionId ||
    !['execution_in_progress', 'private_review_assembly_required'].includes(journey.stage) ||
    journey.plan?.status !== 'approved' ||
    journey.plan.estimateStatus !== 'approved' ||
    !journey.approval ||
    !['reserved', 'partially_spent'].includes(journey.approval.reservationStatus) ||
    !authority ||
    !isSafeId(authority.packageRecordId) ||
    !isSha(authority.expectedPackageHash) ||
    !isSafeId(authority.snapshotId) ||
    !isSha(authority.expectedSnapshotHash)
  ) {
    return {
      ok: false,
      result: failure(
        'blocked',
        'The approved private edit authority is not current. Refresh the saved workflow before continuing.',
        false,
        [],
      ),
    }
  }

  return {
    ok: true,
    packageRecordId: authority.packageRecordId,
    packageHash: authority.expectedPackageHash,
    snapshotId: authority.snapshotId,
    snapshotHash: authority.expectedSnapshotHash,
  }
}

function parseReceipt(
  value: unknown,
  input: PrepareCanonicalPrivateEditForNamedEditInput,
  expected: PreparationAuthority,
): CanonicalPrivateEditPreparationReceipt | null {
  const root = exactRecord(value, [
    'schemaVersion', 'source', 'purpose', 'disposition', 'identity', 'authority',
    'progress', 'review', 'readiness', 'boundaries', 'persistence', 'completedAt',
    'testOnly',
  ])
  if (
    !root ||
    root.schemaVersion !== 'canonical-private-edit-preparation-receipt-v1' ||
    root.source !== 'canonical_private_edit_preparation_coordinator_service' ||
    root.purpose !== 'prepare_canonical_private_edit_review' ||
    !['private_review_ready', 'blocked'].includes(String(root.disposition)) ||
    root.testOnly !== true ||
    !isOffsetDateTime(root.completedAt) ||
    containsForbiddenPrivateMaterial(root)
  ) return null

  const identity = exactRecord(root.identity, [
    'workspaceId', 'projectId', 'editSessionId', 'packageRecordId',
    'approvedPlanSnapshotId',
  ])
  const authority = exactRecord(root.authority, [
    'packageHash', 'snapshotHash', 'exactApprovedAuthorityRevalidated',
    'serverDerivedWorkGraphOnly',
  ])
  const progress = exactRecord(root.progress, [
    'totalJobCount', 'completedJobCount', 'blockedJobCount',
    'allRequiredJobsCompleted', 'retryAvailable', 'userReviewRequired',
  ])
  const readiness = exactRecord(root.readiness, [
    'privateReviewReady', 'nextRequiredGate', 'productReady',
    'externalBetaReady', 'productionReady',
  ])
  const boundaries = exactRecord(root.boundaries, [
    'approvedPrivateExecutionRequested', 'browserSuppliedJobsAccepted',
    'browserSuppliedToolsAccepted', 'rawExecutionAuthorityReturned',
    'jobOrToolDetailsReturned', 'filesystemPathReturned', 'credentialReturned',
    'providerCallStarted', 'publicArtifactCreated', 'publicDeliveryStarted',
    'productionRenderStarted', 'customerPriceMutation', 'customerCreditMutation',
    'walletMutation', 'settlementStarted', 'billingStarted', 'deploymentStarted',
  ])
  const persistence = exactRecord(root.persistence, [
    'privateLocal', 'tenantScoped', 'distributed', 'productionAuthority',
  ])
  const disposition = root.disposition as CanonicalPrivateEditPreparationReceipt['disposition']
  const ready = disposition === 'private_review_ready'
  if (
    !identity ||
    identity.workspaceId !== input.scope.workspaceId ||
    identity.projectId !== input.projectId ||
    identity.editSessionId !== input.editSessionId ||
    identity.packageRecordId !== expected.packageRecordId ||
    identity.approvedPlanSnapshotId !== expected.snapshotId ||
    !authority ||
    authority.packageHash !== expected.packageHash ||
    authority.snapshotHash !== expected.snapshotHash ||
    authority.exactApprovedAuthorityRevalidated !== true ||
    authority.serverDerivedWorkGraphOnly !== true ||
    !validProgress(progress, ready) ||
    !readiness ||
    readiness.privateReviewReady !== ready ||
    readiness.nextRequiredGate !== (ready
      ? 'canonical_private_review_user_decision_or_revision'
      : 'canonical_job_capability_blockers') ||
    readiness.productReady !== false ||
    readiness.externalBetaReady !== false ||
    readiness.productionReady !== false ||
    !validBoundaries(boundaries) ||
    !persistence ||
    persistence.privateLocal !== true ||
    persistence.tenantScoped !== true ||
    persistence.distributed !== false ||
    persistence.productionAuthority !== false
  ) return null

  const review = parseReview(root.review, ready)
  if (review === undefined) return null

  return {
    disposition,
    identity: {
      workspaceId: identity.workspaceId as string,
      projectId: identity.projectId as string,
      editSessionId: identity.editSessionId as string,
      packageRecordId: identity.packageRecordId as string,
      approvedPlanSnapshotId: identity.approvedPlanSnapshotId as string,
    },
    authority: {
      packageHash: authority.packageHash as string,
      snapshotHash: authority.snapshotHash as string,
    },
    progress: {
      totalJobCount: progress!.totalJobCount as number,
      completedJobCount: progress!.completedJobCount as number,
      blockedJobCount: progress!.blockedJobCount as number,
      allRequiredJobsCompleted: progress!.allRequiredJobsCompleted as boolean,
      retryAvailable: progress!.retryAvailable as boolean,
      userReviewRequired: progress!.userReviewRequired as boolean,
    },
    review,
    completedAt: root.completedAt as string,
  }
}

function validProgress(
  progress: Record<string, unknown> | null,
  ready: boolean,
): boolean {
  if (!progress) return false
  const total = progress.totalJobCount
  const completed = progress.completedJobCount
  const blocked = progress.blockedJobCount
  return isInteger(total, 1, 256) &&
    isInteger(completed, 0, total) &&
    isInteger(blocked, 0, total) &&
    completed + blocked <= total &&
    progress.allRequiredJobsCompleted === ready &&
    typeof progress.retryAvailable === 'boolean' &&
    typeof progress.userReviewRequired === 'boolean' &&
    (ready ? progress.retryAvailable === false && progress.userReviewRequired === false : true)
}

function parseReview(
  value: unknown,
  ready: boolean,
): CanonicalPrivateEditPreparationReceipt['review'] | undefined {
  if (!ready) return value === null ? null : undefined
  const review = exactRecord(value, [
    'reviewAssemblyId', 'manifestSha256', 'finalArtifactSha256',
    'finalArtifactByteLength', 'readyForPrivateReview',
  ])
  if (
    !review ||
    !isSafeId(review.reviewAssemblyId) ||
    !isSha(review.manifestSha256) ||
    !isSha(review.finalArtifactSha256) ||
    !isInteger(review.finalArtifactByteLength, 1, 32 * 1024 * 1024) ||
    review.readyForPrivateReview !== true
  ) return undefined
  return {
    reviewAssemblyId: review.reviewAssemblyId,
    manifestSha256: review.manifestSha256,
    finalArtifactSha256: review.finalArtifactSha256,
    finalArtifactByteLength: review.finalArtifactByteLength,
  }
}

function validBoundaries(boundaries: Record<string, unknown> | null): boolean {
  if (!boundaries || boundaries.approvedPrivateExecutionRequested !== true) return false
  return Object.entries(boundaries).every(([key, value]) =>
    key === 'approvedPrivateExecutionRequested' ? value === true : value === false)
}

function classifyFailure(response: {
  statusCode: number
  error?: { code?: string }
  warnings: string[]
}): CanonicalPrivateEditPreparationClientResult {
  const code = response.error?.code
  if (
    response.statusCode === 401 ||
    response.statusCode === 403 ||
    ['AUTH_REQUIRED', 'AUTH_INVALID', 'WORKSPACE_ACCESS_DENIED'].includes(code ?? '')
  ) {
    return failure(
      'access_denied',
      'This approved edit is not available in the current signed-in workspace.',
      false,
      response.warnings,
    )
  }
  if ([
    'VALIDATION_FAILED',
    'IDEMPOTENCY_CONFLICT',
    'APPROVED_SNAPSHOT_REQUIRED',
    'CREDITS_NOT_RESERVED',
    'INTEGRITY_CHECK_FAILED',
  ].includes(code ?? '')) {
    return failure(
      'blocked',
      'The approved edit authority changed. Refresh the saved workflow before continuing.',
      false,
      response.warnings,
    )
  }
  if (['invalid_backend_response', 'invalid_json_response'].includes(code ?? '')) {
    return failure(
      'invalid_response',
      'The private preparation response could not be safely verified.',
      false,
      response.warnings,
    )
  }
  return failure(
    'unavailable',
    'Private edit preparation could not be confirmed. It is safe to retry because the backend recovers the exact approved package.',
    true,
    response.warnings,
  )
}

function failure(
  status: Exclude<CanonicalPrivateEditPreparationClientResult['status'], 'ready'>,
  message: string,
  retryable: boolean,
  warnings: string[],
): CanonicalPrivateEditPreparationClientResult {
  return { status, message, retryable, warnings }
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

function isInteger(value: unknown, minimum: number, maximum: number): value is number {
  return Number.isSafeInteger(value) && Number(value) >= minimum && Number(value) <= maximum
}

function isOffsetDateTime(value: unknown): value is string {
  return typeof value === 'string' && OFFSET_DATE_TIME.test(value) && Number.isFinite(Date.parse(value))
}

function containsForbiddenPrivateMaterial(value: unknown, key = ''): boolean {
  if (/^(?:secret|credential|accessToken|refreshToken|signedUrl|publicUrl|localPath|absolutePath|relativePath|sourceBytes|bytesBase64|rawAuthority|jobs|jobIds|tools|toolManifest|componentRefs)$/i.test(key)) {
    return true
  }
  if (Array.isArray(value)) return value.some((entry) => containsForbiddenPrivateMaterial(entry))
  if (isRecord(value)) {
    return Object.entries(value).some(([childKey, child]) =>
      containsForbiddenPrivateMaterial(child, childKey))
  }
  return false
}

function newAttemptToken(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function stableClientDigest(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function clearInFlightRequest(
  requestKey: string,
  request: Promise<CanonicalPrivateEditPreparationClientResult>,
): void {
  if (inFlightRequests.get(requestKey) === request) inFlightRequests.delete(requestKey)
}
