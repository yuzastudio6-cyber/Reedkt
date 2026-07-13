import { callReeditProApi, getFrontendApiClientStatus } from '../backend/api/frontend-api-client'
import type { CanonicalEditJourney } from './canonical-edit-journey'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  invalidateProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'

type CanonicalExecutionPackageRequestApiResponse = {
  canonicalExecutionPackageRequest?: unknown
}

export type CanonicalExecutionPackageRequestReceipt = {
  disposition: 'package_available'
  identity: {
    workspaceId: string
    projectId: string
    editSessionId: string
  }
  executionPackage: {
    packageRecordId: string
    packageHash: string
    approvedPlanSnapshotId: string
    snapshotHash: string
    createdAt: string
  }
}

export type CanonicalExecutionPackageRequestClientResult =
  | {
      status: 'ready'
      message: string
      retryable: false
      packageState: 'confirmed'
      receipt: CanonicalExecutionPackageRequestReceipt
      warnings: string[]
    }
  | {
      status: 'not_configured' | 'blocked' | 'access_denied' | 'invalid_response' | 'unavailable'
      message: string
      retryable: boolean
      packageState: 'unchanged' | 'unknown'
      warnings: string[]
    }

export type RequestCanonicalExecutionPackageForNamedEditInput = {
  scope: ProjectPersistenceScope
  projectId: string
  editSessionId: string
  journey: CanonicalEditJourney
}

type ExecutionPackageAuthority = {
  snapshotId: string
  snapshotHash: string
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const SHA256 = /^[a-f0-9]{64}$/
const inFlightRequests = new Map<
  string,
  Promise<CanonicalExecutionPackageRequestClientResult>
>()

export function requestCanonicalExecutionPackageForNamedEdit(
  input: RequestCanonicalExecutionPackageForNamedEditInput,
): Promise<CanonicalExecutionPackageRequestClientResult> {
  const authority = executionPackageAuthority(input)
  if (!authority.ok) return Promise.resolve(authority.result)

  const requestKey = [
    input.scope.authMode,
    input.scope.userId,
    input.scope.backendUserId ?? '',
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
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
  input: RequestCanonicalExecutionPackageForNamedEditInput,
  authority: ExecutionPackageAuthority,
): Promise<CanonicalExecutionPackageRequestClientResult> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return failure(
      'not_configured',
      'Private preparation is available when the reviewed local backend is connected.',
      false,
      'unchanged',
      runtime.warnings,
    )
  }

  const response = await callReeditProApi<{
    workspaceId: string
    expectedProjectId: string
    expectedEditSessionId: string
    expectedSnapshotHash: string
    purpose: 'request_canonical_execution_package'
  }, CanonicalExecutionPackageRequestApiResponse>(
    'editExecution.canonicalPackageRequest.create',
    {
      workspaceId: input.scope.workspaceId,
      expectedProjectId: input.projectId,
      expectedEditSessionId: input.editSessionId,
      expectedSnapshotHash: authority.snapshotHash,
      purpose: 'request_canonical_execution_package',
    },
    {
      params: { snapshotId: authority.snapshotId },
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
      idempotencyKey: `canonical-execution-package:${authority.snapshotId}:${stableClientDigest(
        authority.snapshotHash,
      )}`,
    },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  if (!response.ok) return classifyFailure(response)

  const receipt = parseReceipt(
    response.data?.canonicalExecutionPackageRequest,
    input,
    authority,
  )
  if (!receipt) {
    return failure(
      'invalid_response',
      'The private handoff response could not be safely matched to this approved edit.',
      false,
      'unknown',
      response.warnings,
    )
  }

  return {
    status: 'ready',
    message: 'The exact approved version has a private preparation handoff. Editing work was not started by this browser action.',
    retryable: false,
    packageState: 'confirmed',
    receipt,
    warnings: response.warnings,
  }
}

function executionPackageAuthority(
  input: RequestCanonicalExecutionPackageForNamedEditInput,
):
  | ({ ok: true } & ExecutionPackageAuthority)
  | { ok: false; result: CanonicalExecutionPackageRequestClientResult } {
  const { journey } = input
  const authority = journey.executionPackageAuthority
  if (
    journey.identity.workspaceId !== input.scope.workspaceId ||
    journey.identity.projectId !== input.projectId ||
    journey.identity.editSessionId !== input.editSessionId ||
    journey.stage !== 'approved_snapshot_available' ||
    journey.plan?.status !== 'approved' ||
    journey.plan.estimateStatus !== 'approved' ||
    journey.approval?.reservationStatus !== 'reserved' ||
    !authority ||
    !isSafeId(authority.snapshotId) ||
    !isSha(authority.expectedSnapshotHash)
  ) {
    return {
      ok: false,
      result: failure(
        'blocked',
        'The approved edit handoff is not current. Refresh the saved workflow before continuing.',
        false,
        'unchanged',
        [],
      ),
    }
  }

  return {
    ok: true,
    snapshotId: authority.snapshotId,
    snapshotHash: authority.expectedSnapshotHash,
  }
}

function parseReceipt(
  value: unknown,
  input: RequestCanonicalExecutionPackageForNamedEditInput,
  expected: ExecutionPackageAuthority,
): CanonicalExecutionPackageRequestReceipt | null {
  const root = exactRecord(value, [
    'schemaVersion', 'source', 'purpose', 'disposition', 'identity',
    'executionPackage', 'boundaries', 'persistence', 'rawAuthorityReturned',
    'jobOrToolDetailsReturned', 'pathOrCredentialReturned', 'testOnly',
  ])
  if (
    !root ||
    root.schemaVersion !== 'canonical-execution-package-request-receipt-v1' ||
    root.source !== 'canonical_execution_package_request_coordinator_service' ||
    root.purpose !== 'request_canonical_execution_package' ||
    root.disposition !== 'package_available' ||
    root.rawAuthorityReturned !== false ||
    root.jobOrToolDetailsReturned !== false ||
    root.pathOrCredentialReturned !== false ||
    root.testOnly !== true ||
    containsForbiddenPrivateMaterial(root)
  ) return null

  const identity = exactRecord(root.identity, ['workspaceId', 'projectId', 'editSessionId'])
  const executionPackage = exactRecord(root.executionPackage, [
    'packageRecordId', 'packageHash', 'approvedPlanSnapshotId', 'snapshotHash',
    'status', 'createdAt',
  ])
  const boundaries = exactRecord(root.boundaries, [
    'executionPackageAvailable', 'approvedSnapshotMutated', 'creditReservationMutated',
    'workGraphStarted', 'workerDispatchStarted', 'jobExecutionStarted',
    'toolExecutionStarted', 'providerCallStarted', 'renderStarted',
    'paidBillingExecuted', 'customerWalletMutation', 'publicDeliveryStarted',
  ])
  const persistence = exactRecord(root.persistence, [
    'privateLocal', 'tenantScoped', 'distributed', 'productionAuthority',
  ])
  if (
    !identity ||
    identity.workspaceId !== input.scope.workspaceId ||
    identity.projectId !== input.projectId ||
    identity.editSessionId !== input.editSessionId ||
    !executionPackage ||
    !isSafeId(executionPackage.packageRecordId) ||
    !isSha(executionPackage.packageHash) ||
    executionPackage.approvedPlanSnapshotId !== expected.snapshotId ||
    executionPackage.snapshotHash !== expected.snapshotHash ||
    executionPackage.status !== 'canonical_authority_packaged_runtime_blocked' ||
    !isOffsetDateTime(executionPackage.createdAt) ||
    !boundaries ||
    boundaries.executionPackageAvailable !== true ||
    Object.entries(boundaries).some(([key, entry]) =>
      key !== 'executionPackageAvailable' && entry !== false) ||
    !persistence ||
    persistence.privateLocal !== true ||
    persistence.tenantScoped !== true ||
    persistence.distributed !== false ||
    persistence.productionAuthority !== false
  ) return null

  return {
    disposition: root.disposition as CanonicalExecutionPackageRequestReceipt['disposition'],
    identity: {
      workspaceId: identity.workspaceId as string,
      projectId: identity.projectId as string,
      editSessionId: identity.editSessionId as string,
    },
    executionPackage: {
      packageRecordId: executionPackage.packageRecordId,
      packageHash: executionPackage.packageHash,
      approvedPlanSnapshotId: executionPackage.approvedPlanSnapshotId as string,
      snapshotHash: executionPackage.snapshotHash as string,
      createdAt: executionPackage.createdAt as string,
    },
  }
}

function classifyFailure(response: {
  statusCode: number
  error?: { code?: string }
  warnings: string[]
}): CanonicalExecutionPackageRequestClientResult {
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
      'unchanged',
      response.warnings,
    )
  }
  if ([
    'VALIDATION_FAILED',
    'IDEMPOTENCY_CONFLICT',
    'APPROVED_SNAPSHOT_REQUIRED',
    'CREDITS_NOT_RESERVED',
    'INVALID_STORED_STATE',
    'INTEGRITY_CHECK_FAILED',
  ].includes(code ?? '')) {
    return failure(
      'blocked',
      'The approved edit or its saved handoff authority changed. Refresh before continuing.',
      false,
      'unchanged',
      response.warnings,
    )
  }
  if (['invalid_backend_response', 'invalid_json_response'].includes(code ?? '')) {
    return failure(
      'invalid_response',
      'The private handoff response could not be safely verified.',
      false,
      'unknown',
      response.warnings,
    )
  }
  return failure(
    'unavailable',
    'Private handoff preparation could not be confirmed. Retrying uses the same safe request key.',
    true,
    'unknown',
    response.warnings,
  )
}

function failure(
  status: Exclude<CanonicalExecutionPackageRequestClientResult['status'], 'ready'>,
  message: string,
  retryable: boolean,
  packageState: 'unchanged' | 'unknown',
  warnings: string[],
): CanonicalExecutionPackageRequestClientResult {
  return { status, message, retryable, packageState, warnings }
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

function isOffsetDateTime(value: unknown): value is string {
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
}

function containsForbiddenPrivateMaterial(value: unknown, key = ''): boolean {
  if (
    key === 'pathOrCredentialReturned' ||
    key === 'rawAuthorityReturned' ||
    key === 'jobOrToolDetailsReturned'
  ) return value !== false
  if (/^(?:secret|credential|accessToken|refreshToken|signedUrl|publicUrl|localPath|absolutePath|relativePath|sourceBytes|bytesBase64|rawAuthority|jobs|jobIds|tools|toolManifest|componentRefs)$/i.test(key)) return true
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

function clearInFlightRequest(
  key: string,
  request: Promise<CanonicalExecutionPackageRequestClientResult>,
): void {
  if (inFlightRequests.get(key) === request) inFlightRequests.delete(key)
}
