import {
  callReeditProApi,
  getFrontendApiClientStatus,
} from '../backend/api/frontend-api-client'
import type {
  CanonicalPlanningPublicationResult,
} from './canonical-planning-publication-client'
import type { AspectRatio } from '../types/reeditpro'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  invalidateProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const SHA256 = /^[a-f0-9]{64}$/

export type CanonicalSourceLedPlanPresentationReceipt = {
  handoffId: string
  handoffHash: string
  planId: string
  planVersion: number
  planHash: string
  publicationProfile:
    | 'bounded_private_composition'
    | 'professional_long_form_object_controller'
  sourceCount: number
  totalFrames: number
  fps: 30
  captionCueCount: number
  chatDirectionCount: number
  chatThreadRevision: number
  chatDirectionAuthorityDigestSha256: string
}

export type CanonicalSourceLedPlanPresentationClientResult =
  CanonicalPlanningPublicationResult & {
    receipt?: CanonicalSourceLedPlanPresentationReceipt
  }

export type PresentCanonicalSourceLedPlanInput = {
  scope: ProjectPersistenceScope
  projectId: string
  editSessionId: string
  orderedMediaAssetIds: string[]
  confirmedAspectRatio: AspectRatio
}

const inFlightRequests = new Map<
  string,
  Promise<CanonicalSourceLedPlanPresentationClientResult>
>()

export function presentCanonicalSourceLedPlan(
  input: PresentCanonicalSourceLedPlanInput,
): Promise<CanonicalSourceLedPlanPresentationClientResult> {
  if (
    !isSafeId(input.projectId) ||
    !isSafeId(input.editSessionId) ||
    !isSafeId(input.scope.workspaceId) ||
    input.orderedMediaAssetIds.length < 1 ||
    input.orderedMediaAssetIds.length > 8 ||
    new Set(input.orderedMediaAssetIds).size !==
      input.orderedMediaAssetIds.length ||
    input.orderedMediaAssetIds.some((value) => !isSafeId(value)) ||
    !isConfirmedAspectRatio(input.confirmedAspectRatio)
  ) {
    return Promise.resolve(failure(
      'blocked',
      'The exact finalized source order is not ready for server-derived planning.',
      false,
      [],
    ))
  }

  const requestKey = [
    input.scope.authMode,
    input.scope.userId,
    input.scope.backendUserId ?? '',
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
    input.confirmedAspectRatio,
    ...input.orderedMediaAssetIds,
  ].join('\u001f')
  const existing = inFlightRequests.get(requestKey)
  if (existing) return existing

  const request = performRequest(input)
  inFlightRequests.set(requestKey, request)
  void request.then(
    () => clearInFlight(requestKey, request),
    () => clearInFlight(requestKey, request),
  )
  return request
}

async function performRequest(
  input: PresentCanonicalSourceLedPlanInput,
): Promise<CanonicalSourceLedPlanPresentationClientResult> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return failure(
      'not_configured',
      'Server-derived source planning is available when the reviewed private backend is connected.',
      false,
      runtime.warnings,
    )
  }

  const body = {
    workspaceId: input.scope.workspaceId,
    purpose: 'present_server_derived_source_led_plan' as const,
    orderedMediaAssetIds: [...input.orderedMediaAssetIds],
    confirmedAspectRatio: input.confirmedAspectRatio as
      '9:16' | '16:9' | '1:1' | '4:5' | '4:3',
    sourceOrderConfirmed: true as const,
    preserveUnanalyzedSourceRanges: true as const,
  }
  const response = await callReeditProApi<typeof body, {
    canonicalSourceLedPlanPresentation?: unknown
  }>(
    'planning.canonicalSourceLedPlanPresentation.create',
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
        `canonical-source-led-plan:${await sha256Text(stableStringify(body))}`,
    },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  if (!response.ok) return classifyFailure(response)

  const parsed = parseReceipt(
    response.data?.canonicalSourceLedPlanPresentation,
    input,
  )
  if (!parsed) {
    return failure(
      'invalid_response',
      'The server-derived plan response could not be safely matched to this exact source order.',
      false,
      response.warnings,
    )
  }

  return {
    status: 'plan_published_waiting_for_approval',
    message:
      `Plan v${parsed.receipt.planVersion} was derived from ` +
      `${parsed.receipt.sourceCount} verified source ` +
      `${parsed.receipt.sourceCount === 1 ? 'file' : 'files'} and is ready for review.`,
    retryable: false,
    handoffSaved: true,
    candidateSaved: true,
    presentedPlan: {
      planId: parsed.receipt.planId,
      planVersion: parsed.receipt.planVersion,
      planHash: parsed.receipt.planHash,
    },
    publicationBlockers: [],
    warnings: uniqueStrings([
      ...response.warnings,
      ...parsed.warnings,
    ]),
    receipt: parsed.receipt,
  }
}

function parseReceipt(
  value: unknown,
  input: PresentCanonicalSourceLedPlanInput,
): {
  receipt: CanonicalSourceLedPlanPresentationReceipt
  warnings: string[]
} | null {
  const root = exactRecord(value, [
    'schemaVersion',
    'source',
    'identity',
    'derivation',
    'publicationRequest',
    'newlyPresented',
    'permissions',
    'warnings',
    'testOnly',
  ])
  if (
    !root ||
    root.schemaVersion !== 'canonical-source-led-plan-presentation-v1' ||
    root.source !== 'canonical_source_led_plan_presentation_service' ||
    typeof root.newlyPresented !== 'boolean' ||
    root.testOnly !== true
  ) return null

  const identity = exactRecord(root.identity, [
    'workspaceId',
    'projectId',
    'editSessionId',
    'handoffId',
    'handoffHash',
  ])
  const derivation = exactRecord(root.derivation, [
    'sourceMetadataAuthority',
    'editDirectionAuthority',
    'exactPreferenceAuthority',
    'chatDirectionAuthority',
    'chatDirectionCount',
    'chatThreadRevision',
    'chatDirectionAuthorityDigestSha256',
    'browserPlanAccepted',
    'browserTimingAccepted',
    'sourceRangePolicy',
    'publicationProfile',
    'confirmedAspectRatio',
    'sourceCount',
    'totalFrames',
    'fps',
    'captionCueCount',
    'requestAcceptedBrowserPlan',
    'requestAcceptedBrowserTiming',
    'requestAcceptedBrowserEstimate',
    'requestAcceptedBrowserWorkGraph',
    'sourceObjectReread',
    'exactPreferenceReread',
    'editBriefReread',
    'chatDirectionReread',
  ])
  const permissions = exactRecord(root.permissions, [
    'planPresentedForReview',
    'approvalGranted',
    'snapshotCreated',
    'creditReserved',
    'toolExecution',
    'providerCall',
    'render',
    'delivery',
  ])
  const publication = parsePublishedPublication(root.publicationRequest)
  const warnings = safeStringArray(root.warnings)
  if (
    !identity ||
    identity.workspaceId !== input.scope.workspaceId ||
    identity.projectId !== input.projectId ||
    identity.editSessionId !== input.editSessionId ||
    !isSafeId(identity.handoffId) ||
    !isSha(identity.handoffHash) ||
    !derivation ||
    derivation.sourceMetadataAuthority !==
      'server_reverified_finalized_upload_ffprobe' ||
    derivation.editDirectionAuthority !==
      'server_reverified_chat_preferences_and_optional_edit_brief' ||
    derivation.exactPreferenceAuthority !==
      'server_reverified_exact_edit_preferences' ||
    derivation.chatDirectionAuthority !==
      'server_reverified_named_edit_chat' ||
    !isIntegerInRange(derivation.chatDirectionCount, 0, 256) ||
    !isIntegerInRange(derivation.chatThreadRevision, 0, 256) ||
    Number(derivation.chatDirectionCount) >
      Number(derivation.chatThreadRevision) ||
    !isSha(derivation.chatDirectionAuthorityDigestSha256) ||
    derivation.browserPlanAccepted !== false ||
    derivation.browserTimingAccepted !== false ||
    derivation.sourceRangePolicy !==
      'preserve_every_verified_source_frame' ||
    !isCanonicalSourceLedPublicationProfile(
      derivation.publicationProfile,
    ) ||
    derivation.confirmedAspectRatio !== input.confirmedAspectRatio ||
    derivation.sourceCount !== input.orderedMediaAssetIds.length ||
    !isIntegerInRange(derivation.totalFrames, 24, Number.MAX_SAFE_INTEGER) ||
    derivation.fps !== 30 ||
    !isIntegerInRange(derivation.captionCueCount, 0, 7) ||
    derivation.requestAcceptedBrowserPlan !== false ||
    derivation.requestAcceptedBrowserTiming !== false ||
    derivation.requestAcceptedBrowserEstimate !== false ||
    derivation.requestAcceptedBrowserWorkGraph !== false ||
    derivation.sourceObjectReread !== true ||
    derivation.exactPreferenceReread !== true ||
    derivation.editBriefReread !== true ||
    derivation.chatDirectionReread !== true ||
    !permissions ||
    permissions.planPresentedForReview !== true ||
    !allFalse(permissions, [
      'approvalGranted',
      'snapshotCreated',
      'creditReserved',
      'toolExecution',
      'providerCall',
      'render',
      'delivery',
    ]) ||
    !publication ||
    publication.workspaceId !== input.scope.workspaceId ||
    publication.projectId !== input.projectId ||
    publication.editSessionId !== input.editSessionId ||
    publication.handoffId !== identity.handoffId ||
    publication.handoffHash !== identity.handoffHash ||
    !warnings
  ) return null

  return {
    receipt: {
      handoffId: identity.handoffId as string,
      handoffHash: identity.handoffHash as string,
      planId: publication.planId,
      planVersion: publication.planVersion,
      planHash: publication.planHash,
      publicationProfile: derivation.publicationProfile,
      sourceCount: derivation.sourceCount as number,
      totalFrames: derivation.totalFrames as number,
      fps: 30,
      captionCueCount: derivation.captionCueCount as number,
      chatDirectionCount: derivation.chatDirectionCount as number,
      chatThreadRevision: derivation.chatThreadRevision as number,
      chatDirectionAuthorityDigestSha256:
        derivation.chatDirectionAuthorityDigestSha256 as string,
    },
    warnings,
  }
}

function isCanonicalSourceLedPublicationProfile(
  value: unknown,
): value is CanonicalSourceLedPlanPresentationReceipt['publicationProfile'] {
  return value === 'bounded_private_composition' ||
    value === 'professional_long_form_object_controller'
}

function parsePublishedPublication(value: unknown): {
  workspaceId: string
  projectId: string
  editSessionId: string
  handoffId: string
  handoffHash: string
  planId: string
  planVersion: number
  planHash: string
} | null {
  const root = exactRecord(value, [
    'schemaVersion',
    'source',
    'identity',
    'candidateHash',
    'handoffHash',
    'canonicalPlanComponentsHash',
    'publicationBodyHash',
    'publicationRequestHash',
    'persistence',
    'permissions',
    'requestBodyReturned',
    'pathOrCredentialReturned',
    'testOnly',
    'publicationStatus',
    'publication',
  ])
  if (
    !root ||
    root.schemaVersion !==
      'canonical-plan-publication-request-inspection-v1' ||
    root.source !== 'canonical_plan_publication_request_service' ||
    root.publicationStatus !== 'published' ||
    !isSha(root.candidateHash) ||
    !isSha(root.handoffHash) ||
    !isSha(root.canonicalPlanComponentsHash) ||
    !isSha(root.publicationBodyHash) ||
    !isSha(root.publicationRequestHash) ||
    root.requestBodyReturned !== false ||
    root.pathOrCredentialReturned !== false ||
    root.testOnly !== true
  ) return null

  const identity = exactRecord(root.identity, [
    'workspaceId',
    'projectId',
    'editSessionId',
    'handoffId',
    'candidateId',
  ])
  const persistence = exactRecord(root.persistence, [
    'privateLocal',
    'tenantScoped',
    'createOnly',
    'checksumProtected',
    'contentAddressed',
    'distributed',
    'productionAuthority',
  ])
  const permissions = exactRecord(root.permissions, [
    'inspectionOnly',
    'internalPublicationRequired',
    'planMutation',
    'snapshotCreation',
    'creditReservation',
    'toolExecution',
    'providerCall',
    'render',
  ])
  const publication = exactRecord(root.publication, [
    'planId',
    'planningRequestId',
    'planVersion',
    'planStatus',
    'planHash',
    'internalPublicationMayBeAttempted',
    'fullRevalidationRequired',
    'exactReplayOnlyAfterPublication',
  ])
  if (
    !identity ||
    !isSafeId(identity.workspaceId) ||
    !isSafeId(identity.projectId) ||
    !isSafeId(identity.editSessionId) ||
    !isSafeId(identity.handoffId) ||
    !isSafeId(identity.candidateId) ||
    !persistence ||
    !allTrue(persistence, [
      'privateLocal',
      'tenantScoped',
      'createOnly',
      'checksumProtected',
      'contentAddressed',
    ]) ||
    !allFalse(persistence, ['distributed', 'productionAuthority']) ||
    !permissions ||
    !allTrue(permissions, [
      'inspectionOnly',
      'internalPublicationRequired',
    ]) ||
    !allFalse(permissions, [
      'planMutation',
      'snapshotCreation',
      'creditReservation',
      'toolExecution',
      'providerCall',
      'render',
    ]) ||
    !publication ||
    !isSafeId(publication.planId) ||
    !isSafeId(publication.planningRequestId) ||
    !isIntegerInRange(
      publication.planVersion,
      1,
      Number.MAX_SAFE_INTEGER,
    ) ||
    publication.planStatus !== 'presented' ||
    !isSha(publication.planHash) ||
    publication.internalPublicationMayBeAttempted !== false ||
    publication.fullRevalidationRequired !== true ||
    publication.exactReplayOnlyAfterPublication !== true
  ) return null

  return {
    workspaceId: identity.workspaceId,
    projectId: identity.projectId,
    editSessionId: identity.editSessionId,
    handoffId: identity.handoffId,
    handoffHash: root.handoffHash,
    planId: publication.planId,
    planVersion: publication.planVersion,
    planHash: publication.planHash,
  } as {
    workspaceId: string
    projectId: string
    editSessionId: string
    handoffId: string
    handoffHash: string
    planId: string
    planVersion: number
    planHash: string
  }
}

function classifyFailure(response: {
  statusCode?: number
  error?: { code?: string; message?: string }
  warnings: string[]
}): CanonicalSourceLedPlanPresentationClientResult {
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
      'This signed-in workspace cannot prepare that source-led plan.',
      false,
      response.warnings,
    )
  }
  if (
    response.statusCode === 404 ||
    response.statusCode === 409 ||
    [
      'PLAN_NOT_APPROVED',
      'UPLOAD_NOT_FINALIZED',
      'JOB_DEPENDENCY_NOT_READY',
      'IDEMPOTENCY_CONFLICT',
    ].includes(code ?? '')
  ) {
    return failure(
      'blocked',
      response.error?.message
        ?? 'The uploaded sources, Edit Preferences, frame, or Edit Brief changed. Refresh them before creating the plan.',
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
      'The server-derived plan response could not be safely verified.',
      false,
      response.warnings,
    )
  }
  return failure(
    'unavailable',
    'The server-derived plan could not be prepared. It is safe to try again.',
    true,
    response.warnings,
  )
}

function failure(
  status: Exclude<
    CanonicalPlanningPublicationResult['status'],
    | 'plan_published_waiting_for_approval'
    | 'candidate_saved_pending_internal_publication'
    | 'handoff_saved_waiting_for_compiler'
  >,
  message: string,
  retryable: boolean,
  warnings: string[],
): CanonicalSourceLedPlanPresentationClientResult {
  return {
    status,
    message,
    retryable,
    handoffSaved: false,
    candidateSaved: false,
    publicationBlockers: [],
    warnings,
  }
}

function clearInFlight(
  key: string,
  request: Promise<CanonicalSourceLedPlanPresentationClientResult>,
): void {
  if (inFlightRequests.get(key) === request) inFlightRequests.delete(key)
}

function isConfirmedAspectRatio(
  value: AspectRatio,
): value is '9:16' | '16:9' | '1:1' | '4:5' | '4:3' {
  return ['9:16', '16:9', '1:1', '4:5', '4:3'].includes(value)
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

function safeStringArray(value: unknown): string[] | null {
  if (
    !Array.isArray(value) ||
    value.length > 100 ||
    value.some((entry) =>
      typeof entry !== 'string' ||
      entry.length < 1 ||
      entry.length > 1_000)
  ) return null
  return [...value]
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values))
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
