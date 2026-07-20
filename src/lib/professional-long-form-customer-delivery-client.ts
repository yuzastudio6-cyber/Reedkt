import {
  professionalLongFormCustomerDeliveryBrowserDecisionSchema,
  professionalLongFormCustomerDeliveryBrowserReviewSchema,
  type ProfessionalLongFormCustomerDeliveryBrowserDecision,
  type ProfessionalLongFormCustomerDeliveryBrowserDownloadDescriptor,
  type ProfessionalLongFormCustomerDeliveryBrowserReview,
} from '../backend/api/professional-long-form-customer-delivery-browser-contracts'
import {
  applyReeditProApiAuthorizationHeaders,
  callReeditProApi,
  getFrontendApiClientStatus,
} from '../backend/api/frontend-api-client'
import { getBackendApiBaseUrl } from '../backend/api/backend-runtime-config'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  invalidateProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u
const MAX_AUTHENTICATED_RANGE_BYTES = 8 * 1024 * 1024
const PRIVATE_MEDIA_RANGE_TIMEOUT_MS = 30_000

export type ProfessionalLongFormCustomerDeliveryClientInput = {
  scope: ProjectPersistenceScope
  projectId: string
  editSessionId: string
  approvedPlanSnapshotId: string
  packageRecordId: string
}

type ClientFailureStatus =
  | 'blocked'
  | 'not_configured'
  | 'access_denied'
  | 'invalid_response'
  | 'unavailable'

type ClientFailure = {
  status: ClientFailureStatus
  message: string
  retryable: boolean
  warnings: string[]
}

export type ProfessionalLongFormCustomerDeliveryReviewClientResult =
  | {
      status: 'ready'
      message: string
      retryable: false
      review: ProfessionalLongFormCustomerDeliveryBrowserReview
      warnings: string[]
    }
  | ClientFailure

export type ProfessionalLongFormCustomerDeliveryDecisionClientResult =
  | {
      status: 'recorded'
      message: string
      retryable: false
      decision: ProfessionalLongFormCustomerDeliveryBrowserDecision
      warnings: string[]
    }
  | ClientFailure

export type ProfessionalLongFormCustomerDeliveryMediaRange = {
  bytes: Uint8Array
  start: number
  end: number
  totalByteSize: number
  fullArtifactSha256: string
  mimeType: 'video/mp4'
  privateDownloadDeliveryId?: string
}

export type ProfessionalLongFormCustomerDeliveryMediaRangeClientResult =
  | {
      status: 'ready'
      message: string
      retryable: false
      range: ProfessionalLongFormCustomerDeliveryMediaRange
      warnings: string[]
    }
  | ClientFailure

export type ProfessionalLongFormCustomerDeliveryAcceptanceAttestation = {
  entirePrivateMasterPlaybackReviewed: true
  exactVideoQualityAccepted: true
  exactAudioQualityAndSyncAccepted: true
  knownQaReviewItemsAccepted: true
  approvedIntentSatisfied: true
  speechIntelligibilityDisposition:
    | 'manual_full_program_speech_review_accepted'
    | 'no_speech_expected_under_approved_snapshot'
  noPublicDeliveryRequested: true
}

export type ProfessionalLongFormCustomerDeliveryRevisionReasonCode =
  | 'video_quality'
  | 'audio_quality'
  | 'av_sync'
  | 'speech_clarity'
  | 'approved_intent_mismatch'
  | 'other_quality_issue'

export type ProfessionalLongFormCustomerDeliveryDecisionInput =
  ProfessionalLongFormCustomerDeliveryClientInput & {
    review: ProfessionalLongFormCustomerDeliveryBrowserReview
  } & (
    | {
        decision: 'accept_exact_private_customer_delivery'
        attestation: ProfessionalLongFormCustomerDeliveryAcceptanceAttestation
      }
    | {
        decision: 'request_customer_delivery_revision'
        revisionReasonCodes:
          ProfessionalLongFormCustomerDeliveryRevisionReasonCode[]
      }
  )

export async function inspectProfessionalLongFormCustomerDeliveryQualityReview(
  input: ProfessionalLongFormCustomerDeliveryClientInput,
): Promise<ProfessionalLongFormCustomerDeliveryReviewClientResult> {
  const inputError = validateInput(input)
  if (inputError) return inputError
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return failure(
      'not_configured',
      'Long-form customer-delivery review is available when the reviewed private backend is connected.',
      false,
      runtime.warnings,
    )
  }
  const response = await callReeditProApi<undefined, {
    professionalLongFormCustomerDeliveryQualityReview?: unknown
  }>(
    'editExecution.professionalLongFormCustomerDeliveryQualityReview.read',
    undefined,
    {
      params: { packageRecordId: input.packageRecordId },
      query: {
        workspaceId: input.scope.workspaceId,
        approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      },
      context: clientContext(input),
    },
  )
  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  if (!response.ok) return classifyApiFailure(response)
  const parsed = professionalLongFormCustomerDeliveryBrowserReviewSchema
    .safeParse(
      response.data?.professionalLongFormCustomerDeliveryQualityReview,
    )
  if (!parsed.success || !receiptMatchesInput(parsed.data, input)) {
    return failure(
      'invalid_response',
      'The quality-review response could not be matched to this exact signed-in edit and approved snapshot.',
      false,
      response.warnings,
    )
  }
  return {
    status: 'ready',
    message: parsed.data.decision
      ? 'The exact saved quality decision and private-delivery state were reopened.'
      : 'The exact private customer-delivery master is ready for authenticated review before your decision.',
    retryable: false,
    review: parsed.data,
    warnings: response.warnings,
  }
}

export async function recordProfessionalLongFormCustomerDeliveryQualityDecision(
  input: ProfessionalLongFormCustomerDeliveryDecisionInput,
): Promise<ProfessionalLongFormCustomerDeliveryDecisionClientResult> {
  const inputError = validateInput(input)
  if (inputError) return inputError
  const parsedReview = professionalLongFormCustomerDeliveryBrowserReviewSchema
    .safeParse(input.review)
  if (!parsedReview.success || !receiptMatchesInput(parsedReview.data, input)) {
    return failure(
      'blocked',
      'Refresh the exact customer-delivery review before recording a decision.',
      false,
      [],
    )
  }
  if (
    input.decision === 'request_customer_delivery_revision' &&
    !validRevisionReasons(input.revisionReasonCodes)
  ) {
    return failure(
      'blocked',
      'Choose at least one unique quality reason before requesting a revision.',
      false,
      [],
    )
  }
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return failure(
      'not_configured',
      'Long-form customer-delivery decisions are available when the reviewed private backend is connected.',
      false,
      runtime.warnings,
    )
  }
  const review = parsedReview.data
  const expectation = {
    workspaceId: input.scope.workspaceId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    expectedReviewPacketHash: review.authority.reviewPacketHash,
    expectedMasterSha256: review.authority.masterSha256,
    expectedVideoObjectiveEvidenceHash:
      review.authority.videoObjectiveEvidenceHash,
    expectedAudioObjectiveEvidenceHash:
      review.authority.audioObjectiveEvidenceHash,
  }
  const body = input.decision === 'accept_exact_private_customer_delivery'
    ? {
        ...expectation,
        decision: input.decision,
        attestation: input.attestation,
      }
    : {
        ...expectation,
        decision: input.decision,
        revisionReasonCodes: input.revisionReasonCodes,
        requiresFreshPlanEstimateAndApproval: true as const,
      }
  const response = await callReeditProApi<typeof body, {
    professionalLongFormCustomerDeliveryQualityDecision?: unknown
  }>(
    'editExecution.professionalLongFormCustomerDeliveryQualityDecision.create',
    body,
    {
      params: { packageRecordId: input.packageRecordId },
      context: clientContext(input),
      idempotencyKey:
        `professional-long-form-quality-decision:${await sha256Text(
          stableStringify({ packageRecordId: input.packageRecordId, body }),
        )}`,
    },
  )
  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  if (!response.ok) return classifyApiFailure(response)
  const parsed = professionalLongFormCustomerDeliveryBrowserDecisionSchema
    .safeParse(
      response.data?.professionalLongFormCustomerDeliveryQualityDecision,
    )
  if (
    !parsed.success ||
    !receiptMatchesInput(parsed.data, input) ||
    parsed.data.authority.reviewPacketHash !==
      review.authority.reviewPacketHash ||
    parsed.data.authority.masterSha256 !== review.authority.masterSha256 ||
    parsed.data.decision.value !== input.decision
  ) {
    return failure(
      'invalid_response',
      'The quality-decision response could not be matched to this exact review and request.',
      false,
      response.warnings,
    )
  }
  return {
    status: 'recorded',
    message: parsed.data.decision.value ===
      'request_customer_delivery_revision'
      ? 'The revision request is saved. ReEditPro now requires a fresh plan, estimate, approval, and private review.'
      : 'The exact delivery is accepted and its authenticated private download is ready without another credit prompt or charge.',
    retryable: false,
    decision: parsed.data,
    warnings: response.warnings,
  }
}

export function readProfessionalLongFormCustomerDeliveryReviewRange(input: {
  authority: ProfessionalLongFormCustomerDeliveryClientInput
  review: ProfessionalLongFormCustomerDeliveryBrowserReview
  start: number
  end: number
}): Promise<ProfessionalLongFormCustomerDeliveryMediaRangeClientResult> {
  const parsed = professionalLongFormCustomerDeliveryBrowserReviewSchema
    .safeParse(input.review)
  if (
    !parsed.success ||
    !receiptMatchesInput(parsed.data, input.authority)
  ) return Promise.resolve(failure(
    'blocked',
    'Refresh the exact quality review before reading private media.',
    false,
    [],
  ))
  return readAuthenticatedRange({
    authority: input.authority,
    descriptor: parsed.data.reviewMedia,
    start: input.start,
    end: input.end,
    kind: 'quality_review',
  })
}

export function readProfessionalLongFormCustomerDeliveryDownloadRange(input: {
  authority: ProfessionalLongFormCustomerDeliveryClientInput
  decision: ProfessionalLongFormCustomerDeliveryBrowserDecision
  start: number
  end: number
}): Promise<ProfessionalLongFormCustomerDeliveryMediaRangeClientResult> {
  const parsed = professionalLongFormCustomerDeliveryBrowserDecisionSchema
    .safeParse(input.decision)
  if (
    !parsed.success ||
    !receiptMatchesInput(parsed.data, input.authority) ||
    !parsed.data.privateDownload
  ) return Promise.resolve(failure(
    'blocked',
    'An exact accepted quality decision is required before reading the private download.',
    false,
    [],
  ))
  return readAuthenticatedRange({
    authority: input.authority,
    descriptor: parsed.data.privateDownload,
    start: input.start,
    end: input.end,
    kind: 'private_download',
  })
}

async function readAuthenticatedRange(input: {
  authority: ProfessionalLongFormCustomerDeliveryClientInput
  start: number
  end: number
} & (
  | {
      kind: 'quality_review'
      descriptor:
        ProfessionalLongFormCustomerDeliveryBrowserReview['reviewMedia']
    }
  | {
      kind: 'private_download'
      descriptor:
        ProfessionalLongFormCustomerDeliveryBrowserDownloadDescriptor
    }
)): Promise<ProfessionalLongFormCustomerDeliveryMediaRangeClientResult> {
  const inputError = validateInput(input.authority)
  if (inputError) return inputError
  if (!validRange(input.start, input.end, input.descriptor.byteSize)) {
    return failure(
      'blocked',
      `Request one valid media range of at most ${MAX_AUTHENTICATED_RANGE_BYTES} bytes.`,
      false,
      [],
    )
  }
  const runtime = getFrontendApiClientStatus()
  const apiBaseUrl = getBackendApiBaseUrl()
  if (runtime.mockOnly || !apiBaseUrl) {
    return failure(
      'not_configured',
      'Private ranged media is available when the reviewed private backend is connected.',
      false,
      runtime.warnings,
    )
  }
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    PRIVATE_MEDIA_RANGE_TIMEOUT_MS,
  )
  try {
    const url = new URL(input.descriptor.path, normalizeBaseUrl(apiBaseUrl))
    url.searchParams.set('workspaceId', input.authority.scope.workspaceId)
    url.searchParams.set(
      'approvedPlanSnapshotId',
      input.authority.approvedPlanSnapshotId,
    )
    url.searchParams.set(
      input.kind === 'quality_review'
        ? 'expectedReviewPacketHash'
        : 'expectedQualityDecisionHash',
      input.kind === 'quality_review'
        ? input.descriptor.expectedReviewPacketHash
        : input.descriptor.expectedQualityDecisionHash,
    )
    url.searchParams.set(
      'expectedMasterSha256',
      input.descriptor.expectedMasterSha256,
    )
    const headers = new Headers({
      accept: 'video/mp4',
      range: `bytes=${input.start}-${input.end}`,
      'x-request-id':
        `professional-long-form-${input.kind}-range-${newAttemptToken()}`,
    })
    await applyReeditProApiAuthorizationHeaders(headers)
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      headers,
      signal: controller.signal,
    })
    if (response.status === 401 || response.status === 403) {
      invalidateProjectPersistenceScope(input.authority.scope)
      return failure(
        'access_denied',
        'This private media range is unavailable for the signed-in workspace.',
        false,
        [],
      )
    }
    if (response.status === 404 || response.status === 409 ||
      response.status === 416) {
      return failure(
        'blocked',
        'The private media authority changed or the requested range is no longer valid. Refresh the edit before trying again.',
        false,
        [],
      )
    }
    const expectedLength = input.end - input.start + 1
    const expectedContentRange =
      `bytes ${input.start}-${input.end}/${input.descriptor.byteSize}`
    const expectedAuthorityHash = input.kind === 'quality_review'
      ? input.descriptor.expectedReviewPacketHash
      : input.descriptor.expectedQualityDecisionHash
    const authorityHeader = input.kind === 'quality_review'
      ? 'x-reeditpro-quality-review-packet-sha256'
      : 'x-reeditpro-quality-decision-sha256'
    if (
      response.status !== 206 ||
      !hasNoStore(response) ||
      response.headers.get('accept-ranges') !== 'bytes' ||
      response.headers.get('content-range') !== expectedContentRange ||
      Number(response.headers.get('content-length')) !== expectedLength ||
      !/^video\/mp4\b/iu.test(
        response.headers.get('content-type') ?? '',
      ) ||
      response.headers.get('x-reeditpro-artifact-sha256') !==
        input.descriptor.expectedMasterSha256 ||
      response.headers.get(authorityHeader) !== expectedAuthorityHash
    ) {
      return failure(
        'invalid_response',
        'The private media response failed its scope, range, privacy, or integrity-header checks.',
        false,
        [],
      )
    }
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.byteLength !== expectedLength) {
      return failure(
        'invalid_response',
        'The private media response byte count did not match the authenticated range.',
        false,
        [],
      )
    }
    const privateDownloadDeliveryId = input.kind === 'private_download'
      ? response.headers.get('x-reeditpro-private-download-delivery-id')
      : null
    if (
      input.kind === 'private_download' &&
      !isSafeId(privateDownloadDeliveryId)
    ) {
      return failure(
        'invalid_response',
        'The private download response did not identify its exact delivery reconciliation.',
        false,
        [],
      )
    }
    return {
      status: 'ready',
      message: input.kind === 'quality_review'
        ? 'The authenticated private review range is ready for playback.'
        : 'The authenticated private download range is ready.',
      retryable: false,
      range: {
        bytes,
        start: input.start,
        end: input.end,
        totalByteSize: input.descriptor.byteSize,
        fullArtifactSha256: input.descriptor.expectedMasterSha256,
        mimeType: 'video/mp4',
        ...(privateDownloadDeliveryId
          ? { privateDownloadDeliveryId }
          : {}),
      },
      warnings: [
        'Media is private, bearer-authenticated, range-bounded, and no-store. No public or signed URL was created.',
      ],
    }
  } catch {
    return failure(
      'unavailable',
      'The private media range could not be loaded. It is safe to try again.',
      true,
      [],
    )
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

function validateInput(
  input: ProfessionalLongFormCustomerDeliveryClientInput,
): ClientFailure | null {
  if (
    !isSafeId(input.scope.workspaceId) ||
    !isSafeId(input.projectId) ||
    !isSafeId(input.editSessionId) ||
    !isSafeId(input.approvedPlanSnapshotId) ||
    !isSafeId(input.packageRecordId)
  ) return failure(
    'blocked',
    'The signed-in edit does not have a valid exact customer-delivery authority.',
    false,
    [],
  )
  return null
}

function receiptMatchesInput(
  receipt: Pick<
    ProfessionalLongFormCustomerDeliveryBrowserReview,
    'identity'
  >,
  input: ProfessionalLongFormCustomerDeliveryClientInput,
): boolean {
  return receipt.identity.workspaceId === input.scope.workspaceId &&
    receipt.identity.projectId === input.projectId &&
    receipt.identity.editSessionId === input.editSessionId &&
    receipt.identity.approvedPlanSnapshotId ===
      input.approvedPlanSnapshotId &&
    receipt.identity.packageRecordId === input.packageRecordId
}

function validRevisionReasons(
  values: ProfessionalLongFormCustomerDeliveryRevisionReasonCode[],
): boolean {
  return values.length >= 1 && values.length <= 6 &&
    new Set(values).size === values.length
}

function validRange(start: number, end: number, total: number): boolean {
  return Number.isSafeInteger(start) && Number.isSafeInteger(end) &&
    Number.isSafeInteger(total) && start >= 0 && end >= start && end < total &&
    end - start + 1 <= MAX_AUTHENTICATED_RANGE_BYTES
}

function clientContext(input: ProfessionalLongFormCustomerDeliveryClientInput) {
  return {
    workspaceId: input.scope.workspaceId,
    projectId: input.projectId,
    userId: input.scope.backendUserId ?? input.scope.userId,
  }
}

function classifyApiFailure(response: {
  statusCode: number
  error?: { message: string }
  warnings: string[]
}): ClientFailure {
  if (response.statusCode === 401 || response.statusCode === 403) {
    return failure(
      'access_denied',
      'This customer delivery is unavailable for the signed-in workspace.',
      false,
      response.warnings,
    )
  }
  if (response.statusCode === 404 || response.statusCode === 409 ||
    response.statusCode === 422 || response.statusCode === 424) {
    return failure(
      'blocked',
      response.error?.message ??
        'The customer-delivery authority changed or is not ready.',
      false,
      response.warnings,
    )
  }
  return failure(
    'unavailable',
    response.error?.message ??
      'The customer-delivery backend could not complete the request.',
    true,
    response.warnings,
  )
}

function failure(
  status: ClientFailureStatus,
  message: string,
  retryable: boolean,
  warnings: string[],
): ClientFailure {
  return { status, message, retryable, warnings }
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function hasNoStore(response: Response): boolean {
  return /(?:^|,)\s*(?:private\s*,\s*)?no-store(?:\s*(?:,|$))/iu.test(
    response.headers.get('cache-control') ?? '',
  )
}

function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 240 &&
    value === value.trim() && SAFE_ID.test(value) && !value.includes('..')
}

async function sha256Text(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('')
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

function newAttemptToken(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}
