import {
  callReeditProApi,
  getFrontendApiClientStatus,
} from '../backend/api/frontend-api-client'
import type { CanonicalEditJourney } from './canonical-edit-journey'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  invalidateProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const SHA256 = /^[a-f0-9]{64}$/

export type CanonicalSourceLedCaptionRevisionReceipt = {
  priorReviewAssemblyId: string
  priorApprovedSnapshotId: string
  priorPlanVersion: number
  replacementPlanId: string
  replacementPlanVersion: number
  replacementPlanHash: string
  sourceCount: number
  revisionIntentHash: string
}

export type CanonicalSourceLedCaptionRevisionClientResult =
  | {
      status: 'ready'
      message: string
      retryable: false
      receipt: CanonicalSourceLedCaptionRevisionReceipt
      warnings: string[]
    }
  | {
      status:
        | 'blocked'
        | 'not_configured'
        | 'access_denied'
        | 'invalid_response'
        | 'unavailable'
      message: string
      retryable: boolean
      warnings: string[]
    }

export type PresentCanonicalSourceLedCaptionRevisionInput = {
  scope: ProjectPersistenceScope
  projectId: string
  editSessionId: string
  journey: CanonicalEditJourney
}

type RevisionAuthority = {
  reviewAssemblyId: string
  packageRecordId: string
  decisionManifestSha256: string
  finalArtifactSha256: string
}

const inFlightRequests = new Map<
  string,
  Promise<CanonicalSourceLedCaptionRevisionClientResult>
>()

export function presentCanonicalSourceLedCaptionRevision(
  input: PresentCanonicalSourceLedCaptionRevisionInput,
): Promise<CanonicalSourceLedCaptionRevisionClientResult> {
  const authority = revisionAuthority(input)
  if (!authority.ok) return Promise.resolve(authority.result)

  const requestKey = [
    input.scope.authMode,
    input.scope.userId,
    input.scope.backendUserId ?? '',
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
    authority.reviewAssemblyId,
    authority.packageRecordId,
    authority.decisionManifestSha256,
    authority.finalArtifactSha256,
  ].join('\u001f')
  const existing = inFlightRequests.get(requestKey)
  if (existing) return existing

  const request = performRequest(input, authority)
  inFlightRequests.set(requestKey, request)
  void request.then(
    () => clearInFlight(requestKey, request),
    () => clearInFlight(requestKey, request),
  )
  return request
}

async function performRequest(
  input: PresentCanonicalSourceLedCaptionRevisionInput,
  authority: RevisionAuthority,
): Promise<CanonicalSourceLedCaptionRevisionClientResult> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return failure(
      'not_configured',
      'Server-derived revision planning is available when the reviewed private backend is connected.',
      false,
      runtime.warnings,
    )
  }

  const body = {
    workspaceId: input.scope.workspaceId,
    expectedPackageRecordId: authority.packageRecordId,
    expectedReviewAssemblyId: authority.reviewAssemblyId,
    expectedDecisionManifestSha256: authority.decisionManifestSha256,
    expectedFinalArtifactSha256: authority.finalArtifactSha256,
    purpose:
      'present_server_derived_source_led_caption_revision' as const,
  }
  const response = await callReeditProApi<typeof body, {
    canonicalSourceLedCaptionRevisionPlanPresentation?: unknown
  }>(
    'planning.canonicalSourceLedCaptionRevisionPlanPresentation.create',
    body,
    {
      params: {
        projectId: input.projectId,
        editSessionId: input.editSessionId,
      },
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
      idempotencyKey:
        `canonical-source-led-caption-revision:${
          await sha256Text(stableStringify(body))
        }`,
    },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  if (!response.ok) return classifyFailure(response)

  const receipt = parseReceipt(
    response.data?.canonicalSourceLedCaptionRevisionPlanPresentation,
    input,
    authority,
  )
  if (!receipt) {
    return failure(
      'invalid_response',
      'The revised plan response could not be safely matched to this exact review decision.',
      false,
      response.warnings,
    )
  }

  return {
    status: 'ready',
    message:
      `Plan v${receipt.replacementPlanVersion} is ready with a fresh estimate. ` +
      'The previous approval was not reused.',
    retryable: false,
    receipt,
    warnings: response.warnings,
  }
}

function revisionAuthority(
  input: PresentCanonicalSourceLedCaptionRevisionInput,
):
  | ({ ok: true } & RevisionAuthority)
  | { ok: false; result: CanonicalSourceLedCaptionRevisionClientResult } {
  const authority = input.journey.privateReviewMediaAuthority
  if (
    input.journey.identity.workspaceId !== input.scope.workspaceId ||
    input.journey.identity.projectId !== input.projectId ||
    input.journey.identity.editSessionId !== input.editSessionId ||
    input.journey.stage !== 'revision_requested' ||
    input.journey.review?.decision !== 'request_revision' ||
    input.journey.review.decisionStatus !== 'canonical_revision_requested' ||
    authority?.mode !== 'history' ||
    !isSafeId(authority.reviewAssemblyId) ||
    !isSafeId(authority.packageRecordId) ||
    !isSha(authority.expectedDecisionManifestSha256) ||
    !isSha(authority.expectedFinalArtifactSha256)
  ) {
    return {
      ok: false,
      result: failure(
        'blocked',
        'The exact saved revision decision is not current. Refresh the workflow before preparing the revised plan.',
        false,
        [],
      ),
    }
  }
  return {
    ok: true,
    reviewAssemblyId: authority.reviewAssemblyId,
    packageRecordId: authority.packageRecordId,
    decisionManifestSha256: authority.expectedDecisionManifestSha256,
    finalArtifactSha256: authority.expectedFinalArtifactSha256,
  }
}

function parseReceipt(
  value: unknown,
  input: PresentCanonicalSourceLedCaptionRevisionInput,
  expected: RevisionAuthority,
): CanonicalSourceLedCaptionRevisionReceipt | null {
  const root = exactRecord(value, [
    'schemaVersion',
    'source',
    'purpose',
    'identity',
    'derivation',
    'revisionPresentation',
    'permissions',
    'testOnly',
  ])
  if (
    !root ||
    root.schemaVersion !==
      'canonical-source-led-caption-revision-presentation-v1' ||
    root.source !==
      'canonical_source_led_caption_revision_plan_presentation_service' ||
    root.purpose !==
      'present_server_derived_source_led_caption_revision' ||
    root.testOnly !== true
  ) return null

  const identity = exactRecord(root.identity, [
    'workspaceId',
    'projectId',
    'editSessionId',
    'priorReviewAssemblyId',
    'priorApprovedSnapshotId',
  ])
  const derivation = exactRecord(root.derivation, [
    'exactRevisionDecisionReread',
    'priorApprovedSnapshotReread',
    'finalizedSourceObjectsReread',
    'exactLockedPreferencesReread',
    'immutableEditBriefReread',
    'exactCaptionReplacementApplied',
    'revisionIntentHash',
    'sourceCount',
    'captionCueCount',
    'browserPlanAccepted',
    'browserTimingAccepted',
    'browserEstimateAccepted',
    'browserWorkGraphAccepted',
    'browserCaptionTextAcceptedAtPlanning',
  ])
  const permissions = exactRecord(root.permissions, [
    'replacementPlanPresented',
    'freshApprovalRequired',
    'snapshotCreated',
    'creditReserved',
    'workGraphStarted',
    'toolExecutionStarted',
    'renderStarted',
    'deliveryStarted',
  ])
  const presentation = exactRecord(root.revisionPresentation, [
    'schemaVersion',
    'source',
    'purpose',
    'disposition',
    'identity',
    'replacementPlan',
    'authority',
    'boundaries',
    'persistence',
    'rawRevisionAuthorityReturned',
    'jobOrToolDetailsReturned',
    'pathOrCredentialReturned',
    'replayed',
    'testOnly',
  ])
  if (
    !identity ||
    identity.workspaceId !== input.scope.workspaceId ||
    identity.projectId !== input.projectId ||
    identity.editSessionId !== input.editSessionId ||
    identity.priorReviewAssemblyId !== expected.reviewAssemblyId ||
    !isSafeId(identity.priorApprovedSnapshotId) ||
    !derivation ||
    derivation.exactRevisionDecisionReread !== true ||
    derivation.priorApprovedSnapshotReread !== true ||
    derivation.finalizedSourceObjectsReread !== true ||
    derivation.exactLockedPreferencesReread !== true ||
    derivation.immutableEditBriefReread !== true ||
    derivation.exactCaptionReplacementApplied !== true ||
    !isSha(derivation.revisionIntentHash) ||
    !isIntegerInRange(derivation.sourceCount, 1, 8) ||
    derivation.captionCueCount !== 1 ||
    derivation.browserPlanAccepted !== false ||
    derivation.browserTimingAccepted !== false ||
    derivation.browserEstimateAccepted !== false ||
    derivation.browserWorkGraphAccepted !== false ||
    derivation.browserCaptionTextAcceptedAtPlanning !== false ||
    !permissions ||
    permissions.replacementPlanPresented !== true ||
    permissions.freshApprovalRequired !== true ||
    !allFalse(permissions, [
      'snapshotCreated',
      'creditReserved',
      'workGraphStarted',
      'toolExecutionStarted',
      'renderStarted',
      'deliveryStarted',
    ]) ||
    !presentation ||
    presentation.schemaVersion !==
      'canonical-revision-plan-presentation-receipt-v1' ||
    presentation.source !==
      'canonical_revision_plan_presentation_coordinator_service' ||
    presentation.purpose !== 'present_canonical_revision_plan' ||
    presentation.disposition !== 'replacement_plan_presented' ||
    presentation.rawRevisionAuthorityReturned !== false ||
    presentation.jobOrToolDetailsReturned !== false ||
    presentation.pathOrCredentialReturned !== false ||
    typeof presentation.replayed !== 'boolean' ||
    presentation.testOnly !== true
  ) return null

  const presentationIdentity = exactRecord(presentation.identity, [
    'workspaceId',
    'projectId',
    'editSessionId',
    'reviewAssemblyId',
  ])
  const replacementPlan = exactRecord(presentation.replacementPlan, [
    'planId',
    'planVersion',
    'planHash',
    'priorPlanVersion',
    'freshEstimatePresented',
    'freshApprovalRequired',
  ])
  const authority = exactRecord(presentation.authority, [
    'exactRevisionDecisionRevalidated',
    'immutablePriorSnapshotPreserved',
    'immutablePriorReviewPreserved',
    'lockedPreferenceEvidenceReusedWithoutMutation',
  ])
  const boundaries = exactRecord(presentation.boundaries, [
    'approvalRecorded',
    'snapshotCreated',
    'creditReservationMutated',
    'customerWalletMutated',
    'workGraphStarted',
    'toolExecutionStarted',
    'providerCallStarted',
    'renderStarted',
    'billingStarted',
    'publicDeliveryStarted',
  ])
  const persistence = exactRecord(presentation.persistence, [
    'privateLocal',
    'tenantScoped',
    'distributed',
    'productionAuthority',
  ])
  if (
    !presentationIdentity ||
    presentationIdentity.workspaceId !== input.scope.workspaceId ||
    presentationIdentity.projectId !== input.projectId ||
    presentationIdentity.editSessionId !== input.editSessionId ||
    presentationIdentity.reviewAssemblyId !== expected.reviewAssemblyId ||
    !replacementPlan ||
    !isSafeId(replacementPlan.planId) ||
    !isIntegerInRange(replacementPlan.planVersion, 1, Number.MAX_SAFE_INTEGER) ||
    !isIntegerInRange(
      replacementPlan.priorPlanVersion,
      1,
      Number.MAX_SAFE_INTEGER,
    ) ||
    replacementPlan.planVersion !== replacementPlan.priorPlanVersion + 1 ||
    !isSha(replacementPlan.planHash) ||
    replacementPlan.freshEstimatePresented !== true ||
    replacementPlan.freshApprovalRequired !== true ||
    !authority ||
    !allTrue(authority, [
      'exactRevisionDecisionRevalidated',
      'immutablePriorSnapshotPreserved',
      'immutablePriorReviewPreserved',
      'lockedPreferenceEvidenceReusedWithoutMutation',
    ]) ||
    !boundaries ||
    !allFalse(boundaries, Object.keys(boundaries)) ||
    !persistence ||
    persistence.privateLocal !== true ||
    persistence.tenantScoped !== true ||
    persistence.distributed !== false ||
    persistence.productionAuthority !== false
  ) return null

  return {
    priorReviewAssemblyId: expected.reviewAssemblyId,
    priorApprovedSnapshotId: identity.priorApprovedSnapshotId as string,
    priorPlanVersion: replacementPlan.priorPlanVersion as number,
    replacementPlanId: replacementPlan.planId as string,
    replacementPlanVersion: replacementPlan.planVersion as number,
    replacementPlanHash: replacementPlan.planHash as string,
    sourceCount: derivation.sourceCount as number,
    revisionIntentHash: derivation.revisionIntentHash as string,
  }
}

function classifyFailure(response: {
  statusCode?: number
  error?: { code?: string }
  warnings: string[]
}): CanonicalSourceLedCaptionRevisionClientResult {
  const code = response.error?.code
  if (
    response.statusCode === 401 ||
    response.statusCode === 403 ||
    ['AUTH_REQUIRED', 'AUTH_INVALID', 'WORKSPACE_ACCESS_DENIED'].includes(
      code ?? '',
    )
  ) {
    return failure(
      'access_denied',
      'This signed-in workspace cannot prepare that revised plan.',
      false,
      response.warnings,
    )
  }
  if (
    response.statusCode === 404 ||
    response.statusCode === 409 ||
    [
      'IDEMPOTENCY_CONFLICT',
      'APPROVED_SNAPSHOT_REQUIRED',
      'JOB_DEPENDENCY_NOT_READY',
    ].includes(code ?? '')
  ) {
    return failure(
      'blocked',
      'The saved review or prior approved edit changed. Refresh the workflow before preparing the revised plan.',
      false,
      response.warnings,
    )
  }
  if (
    response.statusCode === 400 ||
    ['VALIDATION_FAILED', 'invalid_backend_response', 'invalid_json_response']
      .includes(code ?? '')
  ) {
    return failure(
      'invalid_response',
      'The revised plan response could not be safely verified.',
      false,
      response.warnings,
    )
  }
  return failure(
    'unavailable',
    'The revised plan could not be prepared. It is safe to try again.',
    true,
    response.warnings,
  )
}

function failure(
  status: Exclude<CanonicalSourceLedCaptionRevisionClientResult['status'], 'ready'>,
  message: string,
  retryable: boolean,
  warnings: string[],
): CanonicalSourceLedCaptionRevisionClientResult {
  return { status, message, retryable, warnings }
}

function clearInFlight(
  key: string,
  request: Promise<CanonicalSourceLedCaptionRevisionClientResult>,
): void {
  if (inFlightRequests.get(key) === request) inFlightRequests.delete(key)
}

function exactRecord(
  value: unknown,
  keys: string[],
): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const actualKeys = Object.keys(record).sort()
  const expectedKeys = [...keys].sort()
  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== expectedKeys[index])
  ) return null
  return record
}

function allFalse(record: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => record[key] === false)
}

function allTrue(record: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => record[key] === true)
}

function isSafeId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 200 &&
    SAFE_ID.test(value) &&
    value === value.trim() &&
    !value.includes('..')
  )
}

function isSha(value: unknown): value is string {
  return typeof value === 'string' && SHA256.test(value)
}

function isIntegerInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return Number.isSafeInteger(value) &&
    Number(value) >= minimum &&
    Number(value) <= maximum
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) =>
      `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

async function sha256Text(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('')
}
