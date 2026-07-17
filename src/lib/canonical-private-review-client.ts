import {
  applyReeditProApiAuthorizationHeaders,
  callReeditProApi,
  getFrontendApiClientStatus,
} from '../backend/api/frontend-api-client'
import { getBackendApiBaseUrl } from '../backend/api/backend-runtime-config'
import type { CanonicalEditJourney } from './canonical-edit-journey'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  invalidateProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const SHA256 = /^[a-f0-9]{64}$/
const OFFSET_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/
const MAX_PRIVATE_REVIEW_BYTES = 32 * 1024 * 1024
const PRIVATE_REVIEW_REQUEST_TIMEOUT_MS = 30_000

export type CanonicalPrivateReviewMedia = {
  blob: Blob
  fileName: string
  mimeType: 'video/mp4'
  byteSize: number
  mode: 'current' | 'history'
}

export type CanonicalPrivateReviewMediaClientResult =
  | {
      status: 'ready'
      message: string
      retryable: false
      media: CanonicalPrivateReviewMedia
      warnings: string[]
    }
  | {
      status: 'blocked' | 'not_configured' | 'access_denied' | 'invalid_response' | 'unavailable'
      message: string
      retryable: boolean
      warnings: string[]
    }

export type CanonicalPrivateReviewDecisionReceipt = {
  decision: 'accept_private_internal_review' | 'request_revision'
  status: 'private_internal_review_accepted' | 'canonical_revision_requested'
  revisionRequested: boolean
  requiresReplanning: boolean
  requiresFreshEstimateAndApproval: boolean
  decidedAt: string
}

export type CanonicalPrivateReviewDecisionClientResult =
  | {
      status: 'recorded'
      message: string
      retryable: false
      receipt: CanonicalPrivateReviewDecisionReceipt
      warnings: string[]
    }
  | {
      status: 'blocked' | 'not_configured' | 'access_denied' | 'invalid_response' | 'unavailable'
      message: string
      retryable: boolean
      warnings: string[]
    }

export type CanonicalPrivateReviewClientInput = {
  scope: ProjectPersistenceScope
  projectId: string
  editSessionId: string
  journey: CanonicalEditJourney
}

export type CanonicalPrivateReviewDecisionInput = CanonicalPrivateReviewClientInput & {
  decision: 'accept_private_internal_review' | 'request_revision'
  revisionSummary?: string
}

type ReviewMediaAuthority = NonNullable<
  CanonicalEditJourney['privateReviewMediaAuthority']
>
type ReviewDecisionAuthority = NonNullable<
  CanonicalEditJourney['privateReviewDecisionAuthority']
>

const inFlightMediaRequests = new Map<
  string,
  Promise<CanonicalPrivateReviewMediaClientResult>
>()
const inFlightDecisionRequests = new Map<
  string,
  Promise<CanonicalPrivateReviewDecisionClientResult>
>()

export function loadCanonicalPrivateReviewMedia(
  input: CanonicalPrivateReviewClientInput,
): Promise<CanonicalPrivateReviewMediaClientResult> {
  const authority = mediaAuthority(input)
  if (!authority.ok) return Promise.resolve(authority.result)
  const requestKey = requestIdentity(input, authority.value)
  const existing = inFlightMediaRequests.get(requestKey)
  if (existing) return existing
  const request = performMediaRequest(input, authority.value)
  inFlightMediaRequests.set(requestKey, request)
  void request.then(
    () => clearInFlight(inFlightMediaRequests, requestKey, request),
    () => clearInFlight(inFlightMediaRequests, requestKey, request),
  )
  return request
}

export function recordCanonicalPrivateReviewDecision(
  input: CanonicalPrivateReviewDecisionInput,
): Promise<CanonicalPrivateReviewDecisionClientResult> {
  const authority = decisionAuthority(input)
  if (!authority.ok) return Promise.resolve(authority.result)
  const revisionIntent = input.decision === 'request_revision'
    ? buildRevisionIntent(input.revisionSummary ?? '')
    : undefined
  if (input.decision === 'request_revision' && !revisionIntent) {
    return Promise.resolve(decisionFailure(
      'blocked',
      'Add at least 8 characters describing the change you want.',
      false,
      [],
    ))
  }
  const requestKey = [
    requestIdentity(input, authority.value),
    input.decision,
    revisionIntent ? stableStringify(revisionIntent) : '',
  ].join('\u001f')
  const existing = inFlightDecisionRequests.get(requestKey)
  if (existing) return existing
  const request = performDecisionRequest(input, authority.value, revisionIntent)
  inFlightDecisionRequests.set(requestKey, request)
  void request.then(
    () => clearInFlight(inFlightDecisionRequests, requestKey, request),
    () => clearInFlight(inFlightDecisionRequests, requestKey, request),
  )
  return request
}

async function performMediaRequest(
  input: CanonicalPrivateReviewClientInput,
  authority: ReviewMediaAuthority,
): Promise<CanonicalPrivateReviewMediaClientResult> {
  const runtime = getFrontendApiClientStatus()
  const apiBaseUrl = getBackendApiBaseUrl()
  if (runtime.mockOnly || !apiBaseUrl) {
    return mediaFailure(
      'not_configured',
      'Private review playback is available when the reviewed local backend is connected.',
      false,
      runtime.warnings,
    )
  }

  const abortController = new AbortController()
  const timeout = globalThis.setTimeout(
    () => abortController.abort(),
    PRIVATE_REVIEW_REQUEST_TIMEOUT_MS,
  )
  try {
    const url = buildMediaUrl(apiBaseUrl, input, authority)
    const headers = new Headers({
      accept: 'video/mp4',
      'x-request-id': `canonical-private-review-media-${newAttemptToken()}`,
    })
    await applyReeditProApiAuthorizationHeaders(headers)
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      headers,
      signal: abortController.signal,
    })
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        invalidateProjectPersistenceScope(input.scope)
        return mediaFailure(
          'access_denied',
          'Private review playback is unavailable for this signed-in workspace.',
          false,
          [],
        )
      }
      if (response.status === 404 || response.status === 409) {
        return mediaFailure(
          'blocked',
          'The saved private review changed or is no longer eligible. Refresh the workflow before loading it again.',
          false,
          [],
        )
      }
      return mediaFailure(
        'unavailable',
        'Private review playback could not be loaded. It is safe to try again.',
        true,
        [],
      )
    }

    if (!hasNoStore(response) || !/^video\/mp4\b/i.test(response.headers.get('content-type') ?? '')) {
      return mediaFailure(
        'invalid_response',
        'The private review response did not satisfy the required media and privacy checks.',
        false,
        [],
      )
    }
    if (
      response.headers.get('x-reeditpro-artifact-sha256') !==
        authority.expectedFinalArtifactSha256 ||
      response.headers.get('x-reeditpro-review-assembly-id') !==
        authority.reviewAssemblyId ||
      (
        authority.mode === 'current' &&
        response.headers.get('x-reeditpro-review-manifest-sha256') !==
          authority.expectedManifestSha256
      ) ||
      (
        authority.mode === 'history' &&
        response.headers.get('x-reeditpro-review-decision-manifest-sha256') !==
          authority.expectedDecisionManifestSha256
      )
    ) {
      return mediaFailure(
        'invalid_response',
        'The private review response could not be matched to this exact saved review.',
        false,
        [],
      )
    }

    const contentLength = response.headers.get('content-length')
    const headerLength = Number(contentLength)
    if (
      !contentLength ||
      !Number.isSafeInteger(headerLength) ||
      headerLength < 1 ||
      headerLength > MAX_PRIVATE_REVIEW_BYTES
    ) {
      return mediaFailure(
        'invalid_response',
        'The private review response declared an invalid media size.',
        false,
        [],
      )
    }

    const blob = await response.blob()
    if (
      blob.size < 1 ||
      blob.size > MAX_PRIVATE_REVIEW_BYTES ||
      headerLength !== blob.size ||
      await sha256Blob(blob) !== authority.expectedFinalArtifactSha256
    ) {
      return mediaFailure(
        'invalid_response',
        'The private review bytes failed exact integrity verification.',
        false,
        [],
      )
    }

    return {
      status: 'ready',
      message: authority.mode === 'history'
        ? 'The saved review is loaded from its verified private history record.'
        : 'The exact private review is loaded and ready to play.',
      retryable: false,
      media: {
        blob,
        fileName: parseFileName(response.headers.get('content-disposition')),
        mimeType: 'video/mp4',
        byteSize: blob.size,
        mode: authority.mode,
      },
      warnings: [
        'Playback uses an authenticated private no-store response. Public delivery remains blocked.',
      ],
    }
  } catch {
    return mediaFailure(
      'unavailable',
      'Private review playback could not be loaded. It is safe to try again.',
      true,
      [],
    )
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

async function performDecisionRequest(
  input: CanonicalPrivateReviewDecisionInput,
  authority: ReviewDecisionAuthority,
  revisionIntent: ReturnType<typeof buildRevisionIntent>,
): Promise<CanonicalPrivateReviewDecisionClientResult> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return decisionFailure(
      'not_configured',
      'Private review decisions are available when the reviewed local backend is connected.',
      false,
      runtime.warnings,
    )
  }

  const body = {
    workspaceId: input.scope.workspaceId,
    expectedProjectId: input.projectId,
    expectedEditSessionId: input.editSessionId,
    packageRecordId: authority.packageRecordId,
    expectedManifestSha256: authority.expectedManifestSha256,
    expectedFinalArtifactSha256: authority.expectedFinalArtifactSha256,
    purpose: 'record_canonical_private_review_decision' as const,
    decision: input.decision,
    ...(input.decision === 'request_revision' && revisionIntent
      ? { revisionIntent }
      : {}),
  }
  const response = await callReeditProApi<typeof body, {
    canonicalPrivateReviewDecision?: unknown
  }>(
    'editExecution.canonicalPrivateReviewDecision.create',
    body,
    {
      params: { reviewAssemblyId: authority.reviewAssemblyId },
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
      idempotencyKey: `canonical-private-review-decision:${await sha256Text(
        stableStringify({ reviewAssemblyId: authority.reviewAssemblyId, body }),
      )}`,
    },
  )
  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  if (!response.ok) return classifyDecisionFailure(response)
  const receipt = parseDecisionReceipt(
    response.data?.canonicalPrivateReviewDecision,
    input,
    authority,
  )
  if (!receipt) {
    return decisionFailure(
      'invalid_response',
      'The review decision response could not be safely matched to this exact review.',
      false,
      response.warnings,
    )
  }
  return {
    status: 'recorded',
    message: receipt.revisionRequested
      ? 'Your changes are saved. ReeditPro now requires a fresh plan, estimate, approval, and private review.'
      : 'Your private review approval is saved. Public delivery remains a separate blocked step.',
    retryable: false,
    receipt,
    warnings: response.warnings,
  }
}

function mediaAuthority(input: CanonicalPrivateReviewClientInput):
  | { ok: true; value: ReviewMediaAuthority }
  | { ok: false; result: CanonicalPrivateReviewMediaClientResult } {
  const authority = input.journey.privateReviewMediaAuthority
  if (
    input.journey.identity.workspaceId !== input.scope.workspaceId ||
    input.journey.identity.projectId !== input.projectId ||
    input.journey.identity.editSessionId !== input.editSessionId ||
    !authority ||
    !isSafeId(authority.reviewAssemblyId) ||
    !isSafeId(authority.packageRecordId) ||
    !isSha(authority.expectedFinalArtifactSha256) ||
    (
      authority.mode === 'current' &&
      !isSha(authority.expectedManifestSha256)
    ) ||
    (
      authority.mode === 'history' &&
      !isSha(authority.expectedDecisionManifestSha256)
    )
  ) {
    return {
      ok: false,
      result: mediaFailure(
        'blocked',
        'The exact private review authority is not current. Refresh the saved workflow before loading it.',
        false,
        [],
      ),
    }
  }
  return { ok: true, value: authority }
}

function decisionAuthority(input: CanonicalPrivateReviewDecisionInput):
  | { ok: true; value: ReviewDecisionAuthority }
  | { ok: false; result: CanonicalPrivateReviewDecisionClientResult } {
  const authority = input.journey.privateReviewDecisionAuthority
  if (
    input.journey.identity.workspaceId !== input.scope.workspaceId ||
    input.journey.identity.projectId !== input.projectId ||
    input.journey.identity.editSessionId !== input.editSessionId ||
    input.journey.stage !== 'private_review_ready' ||
    !authority ||
    !isSafeId(authority.reviewAssemblyId) ||
    !isSafeId(authority.packageRecordId) ||
    !isSha(authority.expectedManifestSha256) ||
    !isSha(authority.expectedFinalArtifactSha256)
  ) {
    return {
      ok: false,
      result: decisionFailure(
        'blocked',
        'The exact private review authority is not current. Refresh the saved workflow before deciding.',
        false,
        [],
      ),
    }
  }
  return { ok: true, value: authority }
}

function buildMediaUrl(
  apiBaseUrl: string,
  input: CanonicalPrivateReviewClientInput,
  authority: ReviewMediaAuthority,
): string {
  const base = apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`
  const path = authority.mode === 'current'
    ? `/v1/edit-executions/private-review-assemblies/${encodeURIComponent(
        authority.reviewAssemblyId,
      )}/media`
    : `/v1/edit-executions/private-review-history/${encodeURIComponent(
        authority.reviewAssemblyId,
      )}/file`
  const url = new URL(path, base)
  url.searchParams.set('workspaceId', input.scope.workspaceId)
  url.searchParams.set('packageRecordId', authority.packageRecordId)
  url.searchParams.set(
    'expectedFinalArtifactSha256',
    authority.expectedFinalArtifactSha256,
  )
  if (authority.mode === 'current') {
    url.searchParams.set('expectedProjectId', input.projectId)
    url.searchParams.set('expectedEditSessionId', input.editSessionId)
    url.searchParams.set(
      'expectedManifestSha256',
      authority.expectedManifestSha256!,
    )
    url.searchParams.set('purpose', 'read_canonical_private_review_media')
  } else {
    url.searchParams.set(
      'expectedDecisionManifestSha256',
      authority.expectedDecisionManifestSha256!,
    )
    url.searchParams.set(
      'purpose',
      'download_canonical_private_review_history_artifact',
    )
  }
  return url.toString()
}

function buildRevisionIntent(summaryInput: string) {
  const summary = summaryInput.trim().replace(/\s+/g, ' ').slice(0, 4_000)
  if (summary.length < 8) return undefined
  const normalized = summary.toLowerCase()
  const categories = new Set<string>()
  const matchers: Array<[RegExp, string]> = [
    [/\bpace|pacing|faster|slower\b/, 'pacing'],
    [/\btiming|sync|hold|duration\b/, 'timing'],
    [/\btrim|cut|cleanup|retake\b/, 'source_cleanup'],
    [/\bcaption|subtitle|text\b/, 'caption'],
    [/\baudio|sound|music|voice|volume|sfx\b/, 'audio'],
    [/\bcolor|grade|contrast|exposure\b/, 'color'],
    [/\bvisual|image|b-roll|broll|graphic|animation\b/, 'visual_asset'],
    [/\blayout|position|panel|split screen\b/, 'layout'],
    [/\b(?:order|sequence|reorder|re-order|resequence|re-sequence|swap(?:ping)?)\b/, 'source_order'],
    [/\baspect|ratio|crop|frame\b/, 'aspect_ratio'],
    [/\bedit level|premium|normal|ultra\b/, 'edit_level'],
  ]
  for (const [pattern, category] of matchers) {
    if (pattern.test(normalized)) categories.add(category)
  }
  if (categories.size === 0) categories.add('custom_instruction')
  const sourceOrderPreservationRequested =
    /\b(?:keep|preserve|maintain|do not change|don't change)\b.{0,36}\b(?:source|clip)?\s*(?:order|sequence)\b/.test(
      normalized,
    )
  const sourceOrderChangeRequested = !sourceOrderPreservationRequested && (
    /\b(?:reorder|re-order|resequence|re-sequence|swap)\b/.test(normalized) ||
    /\b(?:change|update|alter)\b.{0,24}\b(?:source|clip)?\s*(?:order|sequence)\b/.test(
      normalized,
    )
  )
  const aspectRatioPreservationRequested =
    /\b(?:keep|preserve|maintain|do not change|don't change)\b.{0,36}\b(?:aspect\s+ratio|ratio|frame|crop)\b/.test(
      normalized,
    )
  const aspectRatioChangeRequested = !aspectRatioPreservationRequested && (
    /\b(?:change|switch|update|convert|reframe)\b.{0,36}\b(?:aspect\s+ratio|ratio|frame|crop)\b/.test(
      normalized,
    ) ||
    /\b(?:aspect\s+ratio|ratio|frame|crop)\b.{0,36}\b(?:to|into)\s+(?:\d{1,2}:\d{1,2}|vertical|horizontal|square|portrait|landscape)\b/.test(
      normalized,
    )
  )
  const mustPreserve = [
    ...(!sourceOrderChangeRequested ? ['source_order'] : []),
    'source_meaning',
    'important_clips',
    ...(!aspectRatioChangeRequested ? ['approved_aspect_ratio'] : []),
    'edit_preferences',
    'edit_brief',
  ]
  return {
    summary,
    changeCategories: Array.from(categories).slice(0, 12),
    mustPreserve,
    requiresReplanning: true as const,
    requiresFreshEstimateAndApproval: true as const,
  }
}

function parseDecisionReceipt(
  value: unknown,
  input: CanonicalPrivateReviewDecisionInput,
  expected: ReviewDecisionAuthority,
): CanonicalPrivateReviewDecisionReceipt | null {
  const root = exactRecord(value, [
    'schemaVersion', 'source', 'purpose', 'disposition', 'identity', 'authority',
    'decision', 'readiness', 'boundaries', 'persistence', 'decidedAt', 'testOnly',
  ])
  if (
    !root ||
    root.schemaVersion !== 'canonical-private-review-decision-coordinator-receipt-v1' ||
    root.source !== 'canonical_private_review_decision_coordinator_service' ||
    root.purpose !== 'record_canonical_private_review_decision' ||
    root.disposition !== 'decision_recorded' ||
    root.testOnly !== true
  ) return null
  const identity = exactRecord(root.identity, [
    'workspaceId', 'projectId', 'editSessionId', 'packageRecordId', 'reviewAssemblyId',
  ])
  const authority = exactRecord(root.authority, [
    'reviewManifestSha256', 'finalArtifactSha256', 'exactReviewAuthorityRevalidated',
    'immutableApprovedSnapshotPreserved', 'immutableReviewManifestPreserved',
  ])
  const decision = exactRecord(root.decision, [
    'value', 'status', 'revisionRequested', 'requiresReplanning',
    'requiresFreshEstimateAndApproval',
  ])
  const readiness = exactRecord(root.readiness, [
    'privateReviewDecisionRecorded', 'publicExportReady', 'productReady',
    'externalBetaReady', 'productionReady', 'nextRequiredGate',
  ])
  const persistence = exactRecord(root.persistence, [
    'privateLocal', 'tenantScoped', 'distributed', 'productionAuthority',
  ])
  if (
    !identity || !authority || !decision || !readiness || !persistence ||
    identity.workspaceId !== input.scope.workspaceId ||
    identity.projectId !== input.projectId ||
    identity.editSessionId !== input.editSessionId ||
    identity.packageRecordId !== expected.packageRecordId ||
    identity.reviewAssemblyId !== expected.reviewAssemblyId ||
    authority.reviewManifestSha256 !== expected.expectedManifestSha256 ||
    authority.finalArtifactSha256 !== expected.expectedFinalArtifactSha256 ||
    authority.exactReviewAuthorityRevalidated !== true ||
    authority.immutableApprovedSnapshotPreserved !== true ||
    authority.immutableReviewManifestPreserved !== true ||
    decision.value !== input.decision ||
    !['private_internal_review_accepted', 'canonical_revision_requested'].includes(
      String(decision.status),
    ) ||
    typeof decision.revisionRequested !== 'boolean' ||
    typeof decision.requiresReplanning !== 'boolean' ||
    typeof decision.requiresFreshEstimateAndApproval !== 'boolean' ||
    readiness.privateReviewDecisionRecorded !== true ||
    readiness.publicExportReady !== false ||
    readiness.productReady !== false ||
    readiness.externalBetaReady !== false ||
    readiness.productionReady !== false ||
    persistence.privateLocal !== true ||
    persistence.tenantScoped !== true ||
    persistence.distributed !== false ||
    persistence.productionAuthority !== false ||
    !allBoundariesDenied(root.boundaries) ||
    !isOffsetDateTime(root.decidedAt) ||
    containsForbiddenPrivateMaterial(root)
  ) return null
  const revisionRequested = decision.revisionRequested
  if (
    revisionRequested !== (input.decision === 'request_revision') ||
    decision.status !== (revisionRequested
      ? 'canonical_revision_requested'
      : 'private_internal_review_accepted') ||
    decision.requiresReplanning !== revisionRequested ||
    decision.requiresFreshEstimateAndApproval !== revisionRequested ||
    readiness.nextRequiredGate !== (revisionRequested
      ? 'canonical_revision_plan_compilation_and_fresh_approval'
      : 'private_internal_acceptance_recorded_public_delivery_blocked')
  ) return null
  return {
    decision: decision.value as CanonicalPrivateReviewDecisionReceipt['decision'],
    status: decision.status as CanonicalPrivateReviewDecisionReceipt['status'],
    revisionRequested,
    requiresReplanning: decision.requiresReplanning,
    requiresFreshEstimateAndApproval: decision.requiresFreshEstimateAndApproval,
    decidedAt: root.decidedAt as string,
  }
}

function allBoundariesDenied(value: unknown): boolean {
  const expectedKeys = [
    'rawDecisionAuthorityReturned', 'artifactIdentityReturned',
    'jobOrToolDetailsReturned', 'filesystemPathReturned', 'credentialReturned',
    'providerCallStarted', 'publicArtifactCreated', 'publicDeliveryStarted',
    'productionRenderStarted', 'revisionExecutionStarted', 'replacementPlanPublished',
    'customerPriceMutation', 'customerCreditMutation', 'walletMutation',
    'reservationMutation', 'settlementStarted', 'billingStarted', 'deploymentStarted',
  ]
  const record = exactRecord(value, expectedKeys)
  return Boolean(record && expectedKeys.every((key) => record[key] === false))
}

function classifyDecisionFailure(response: {
  statusCode?: number
  error?: { code?: string }
  warnings: string[]
}): CanonicalPrivateReviewDecisionClientResult {
  const code = response.error?.code
  if (
    response.statusCode === 401 || response.statusCode === 403 ||
    ['AUTH_REQUIRED', 'AUTH_INVALID', 'WORKSPACE_ACCESS_DENIED'].includes(code ?? '')
  ) {
    return decisionFailure(
      'access_denied',
      'This signed-in workspace cannot record a decision for that private review.',
      false,
      response.warnings,
    )
  }
  if (
    response.statusCode === 409 ||
    ['IDEMPOTENCY_CONFLICT', 'APPROVED_SNAPSHOT_REQUIRED', 'JOB_DEPENDENCY_NOT_READY'].includes(code ?? '')
  ) {
    return decisionFailure(
      'blocked',
      'The saved review authority changed or already has a conflicting decision. Refresh before continuing.',
      false,
      response.warnings,
    )
  }
  if (['invalid_backend_response', 'invalid_json_response'].includes(code ?? '')) {
    return decisionFailure(
      'invalid_response',
      'The private review decision response could not be safely verified.',
      false,
      response.warnings,
    )
  }
  return decisionFailure(
    'unavailable',
    'The private review decision could not be confirmed. It is safe to retry with the same review.',
    true,
    response.warnings,
  )
}

function mediaFailure(
  status: Exclude<CanonicalPrivateReviewMediaClientResult['status'], 'ready'>,
  message: string,
  retryable: boolean,
  warnings: string[],
): CanonicalPrivateReviewMediaClientResult {
  return { status, message, retryable, warnings }
}

function decisionFailure(
  status: Exclude<CanonicalPrivateReviewDecisionClientResult['status'], 'recorded'>,
  message: string,
  retryable: boolean,
  warnings: string[],
): CanonicalPrivateReviewDecisionClientResult {
  return { status, message, retryable, warnings }
}

function requestIdentity(
  input: CanonicalPrivateReviewClientInput,
  authority: {
    reviewAssemblyId: string
    packageRecordId: string
    mode?: 'current' | 'history'
    expectedFinalArtifactSha256: string
    expectedManifestSha256?: string
    expectedDecisionManifestSha256?: string
  },
): string {
  return [
    input.scope.authMode,
    input.scope.userId,
    input.scope.backendUserId ?? '',
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
    authority.reviewAssemblyId,
    authority.packageRecordId,
    authority.mode ?? 'decision',
    authority.expectedFinalArtifactSha256,
    authority.expectedManifestSha256 ?? '',
    authority.expectedDecisionManifestSha256 ?? '',
  ].join('\u001f')
}

function clearInFlight<T>(
  requests: Map<string, Promise<T>>,
  key: string,
  request: Promise<T>,
): void {
  if (requests.get(key) === request) requests.delete(key)
}

function hasNoStore(response: Response): boolean {
  return /(?:^|,)\s*(?:private\s*,\s*)?no-store(?:\s*(?:,|$))/i.test(
    response.headers.get('cache-control') ?? '',
  )
}

function parseFileName(disposition: string | null): string {
  const match = disposition?.match(/filename="?([^";]+)"?/i)
  const value = match?.[1]?.trim()
  if (!value || value.includes('/') || value.includes('\\')) {
    return 'reeditpro-private-review.mp4'
  }
  return value.slice(0, 255)
}

async function sha256Blob(blob: Blob): Promise<string> {
  return sha256Bytes(await blob.arrayBuffer())
}

async function sha256Text(value: string): Promise<string> {
  return sha256Bytes(new TextEncoder().encode(value))
}

async function sha256Bytes(value: ArrayBuffer | ArrayBufferView): Promise<string> {
  const view = value instanceof ArrayBuffer
    ? new Uint8Array(value)
    : new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  const bytes = Uint8Array.from(view)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
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
  return typeof value === 'string' && OFFSET_DATE_TIME.test(value) && Number.isFinite(Date.parse(value))
}

function containsForbiddenPrivateMaterial(value: unknown, key = ''): boolean {
  if (/^(?:secret|credential|accessToken|refreshToken|signedUrl|publicUrl|localPath|absolutePath|relativePath|sourceBytes|bytesBase64|rawAuthority|artifactId|jobId|jobIds|tools|toolManifest|componentRefs)$/i.test(key)) {
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
