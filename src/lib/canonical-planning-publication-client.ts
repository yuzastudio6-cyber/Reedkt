import { callReeditProApi, getFrontendApiClientStatus } from '../backend/api/frontend-api-client'
import type { EditPlan, PlannerInput } from '../types/reeditpro'
import type { ApprovedEditExecutionUploadedMediaSourceAssetClientInput } from './approved-edit-execution-package-client'
import {
  buildCanonicalPlanningDraft,
  type CanonicalPlanningDraft,
} from './canonical-planning-draft'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  invalidateProjectPersistenceScope,
  type ProjectPersistenceScope,
} from './project-persistence-scope'

type ApiFailure = {
  statusCode?: number
  error?: { code?: string; message?: string }
  warnings: string[]
}

type CanonicalPlanningHandoffApiResponse = {
  canonicalPlanningHandoff?: unknown
}

type CanonicalPublicationRequestApiResponse = {
  canonicalPlanPublicationRequest?: unknown
}

type HandoffReceipt = {
  handoffId: string
  handoffHash: string
  canonicalPlanComponentsHash: string
}

type PublicationReceipt = {
  publicationStatus: 'pending_internal_publication' | 'published' | 'superseded_by_competing_candidate'
}

export type CanonicalPlanningPublicationResult = {
  status:
    | 'not_configured'
    | 'blocked'
    | 'handoff_saved_waiting_for_compiler'
    | 'candidate_saved_pending_internal_publication'
    | 'plan_published_waiting_for_approval'
    | 'access_denied'
    | 'invalid_response'
    | 'unavailable'
  message: string
  retryable: boolean
  handoffSaved: boolean
  candidateSaved: boolean
  publicationBlockers: string[]
  warnings: string[]
}

export type SaveCanonicalPlanningInput = {
  scope: ProjectPersistenceScope
  projectId: string
  editSessionId: string
  plan: EditPlan
  plannerInput: PlannerInput
  sourceMediaAssets: ApprovedEditExecutionUploadedMediaSourceAssetClientInput[]
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
const SHA256 = /^[a-f0-9]{64}$/
const inFlightCanonicalPlanningSaves = new Map<string, Promise<CanonicalPlanningPublicationResult>>()

export function saveCanonicalPlanningForNamedEdit(
  input: SaveCanonicalPlanningInput,
): Promise<CanonicalPlanningPublicationResult> {
  const compiled = buildCanonicalPlanningDraft({
    plan: input.plan,
    plannerInput: input.plannerInput,
    sourceMediaAssets: input.sourceMediaAssets,
  })
  if (!compiled.ok) {
    return Promise.resolve({
      status: 'blocked',
      message: compiled.errors[0] ?? 'Complete the required planning confirmations before saving this plan.',
      retryable: false,
      handoffSaved: false,
      candidateSaved: false,
      publicationBlockers: compiled.errors,
      warnings: [],
    })
  }

  const exactRequestIdentity = JSON.stringify({
    source: compiled.draft.orderedSourceItems,
    components: compiled.draft.components,
    publication: compiled.draft.publication?.planningRequestIdSeed ?? null,
  })
  const requestDigest = stableClientDigest(exactRequestIdentity)
  const requestKey = [
    input.scope.authMode,
    input.scope.userId,
    input.scope.backendUserId ?? '',
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
    exactRequestIdentity,
  ].join('\u001f')
  const existing = inFlightCanonicalPlanningSaves.get(requestKey)
  if (existing) return existing

  const request = performCanonicalPlanningSave(input, compiled.draft, requestDigest)
  inFlightCanonicalPlanningSaves.set(requestKey, request)
  void request.then(
    () => clearInFlightSave(requestKey, request),
    () => clearInFlightSave(requestKey, request),
  )
  return request
}

async function performCanonicalPlanningSave(
  input: SaveCanonicalPlanningInput,
  draft: CanonicalPlanningDraft,
  requestDigest: string,
): Promise<CanonicalPlanningPublicationResult> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return {
      status: 'not_configured',
      message: 'Canonical plan saving is available when the reviewed private backend is connected.',
      retryable: false,
      handoffSaved: false,
      candidateSaved: false,
      publicationBlockers: draft.publicationBlockers,
      warnings: runtime.warnings,
    }
  }

  const handoffResponse = await callReeditProApi<
    {
      workspaceId: string
      purpose: 'prepare_canonical_planning_handoff'
      orderedSourceItems: CanonicalPlanningDraft['orderedSourceItems']
      canonicalPlanComponents: CanonicalPlanningDraft['components']
    },
    CanonicalPlanningHandoffApiResponse
  >(
    'planning.canonicalHandoff.create',
    {
      workspaceId: input.scope.workspaceId,
      purpose: 'prepare_canonical_planning_handoff',
      orderedSourceItems: draft.orderedSourceItems,
      canonicalPlanComponents: draft.components,
    },
    {
      params: { projectId: input.projectId, editSessionId: input.editSessionId },
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
      idempotencyKey: `canonical-handoff:${requestDigest}`,
    },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(handoffResponse)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  const handoffFailure = classifyApiFailure(handoffResponse, false)
  if (handoffFailure) return withDraftBlockers(handoffFailure, draft)

  const handoff = parseHandoffReceipt(
    handoffResponse.data?.canonicalPlanningHandoff,
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
  )
  if (!handoff) {
    return result('invalid_response', 'The private backend returned an inconsistent planning handoff.', false, false, false, draft, handoffResponse.warnings)
  }

  if (!draft.publication) {
    return result(
      'handoff_saved_waiting_for_compiler',
      'Your exact planning inputs are saved. This edit still needs an execution graph that represents every planned operation.',
      false,
      true,
      false,
      draft,
      handoffResponse.warnings,
    )
  }

  const planningRequestId = safePlanningRequestId(draft.publication.planningRequestIdSeed, requestDigest)
  const publicationResponse = await callReeditProApi<
    {
      workspaceId: string
      planningRequestId: string
      expectedHandoffHash: string
      canonicalPlan: CanonicalPlanningDraft['publication'] extends infer T
        ? T extends { canonicalPlan: infer P } ? P : never
        : never
    },
    CanonicalPublicationRequestApiResponse
  >(
    'planning.canonicalPlanPresentation.create',
    {
      workspaceId: input.scope.workspaceId,
      planningRequestId,
      expectedHandoffHash: handoff.handoffHash,
      canonicalPlan: draft.publication.canonicalPlan,
    },
    {
      params: {
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        handoffId: handoff.handoffId,
      },
      context: {
        workspaceId: input.scope.workspaceId,
        projectId: input.projectId,
        userId: input.scope.backendUserId ?? input.scope.userId,
      },
      idempotencyKey: `canonical-plan-presentation:${requestDigest}`,
    },
  )

  if (apiResponseInvalidatesProjectPersistenceScope(publicationResponse)) {
    invalidateProjectPersistenceScope(input.scope)
  }
  const publicationFailure = classifyApiFailure(publicationResponse, true)
  if (publicationFailure) {
    return {
      ...withDraftBlockers(publicationFailure, draft),
      handoffSaved: true,
    }
  }

  const publication = parsePublicationReceipt(
    publicationResponse.data?.canonicalPlanPublicationRequest,
    input.scope.workspaceId,
    input.projectId,
    input.editSessionId,
    handoff,
  )
  if (!publication) {
    return result('invalid_response', 'The private backend returned an inconsistent publication request.', false, true, false, draft, publicationResponse.warnings)
  }
  if (publication.publicationStatus === 'superseded_by_competing_candidate') {
    return result('blocked', 'A newer saved plan already replaced this publication request. Refresh the edit before continuing.', false, true, false, draft, publicationResponse.warnings)
  }
  if (publication.publicationStatus === 'published') {
    return result(
      'plan_published_waiting_for_approval',
      'The canonical plan is saved and ready for the separate approval and credit review step.',
      false,
      true,
      true,
      draft,
      [...handoffResponse.warnings, ...publicationResponse.warnings],
    )
  }
  return result(
    'candidate_saved_pending_internal_publication',
    'The exact execution candidate is saved and waiting for private internal publication checks.',
    true,
    true,
    true,
    draft,
    [...handoffResponse.warnings, ...publicationResponse.warnings],
  )
}

function parseHandoffReceipt(
  value: unknown,
  workspaceId: string,
  projectId: string,
  editSessionId: string,
): HandoffReceipt | null {
  const record = exactRecord(value, [
    'schemaVersion', 'source', 'identity', 'canonicalPlanComponentsHash',
    'sourceBindingManifestCandidate', 'sourceMediaAuthority', 'planningInputAuthority',
    'resolvedPlanningInputAuthority', 'readiness', 'handoffHash', 'handoffId', 'persistence',
    'noPlanPublished', 'noSnapshotCreated', 'noCreditReservation', 'noToolExecution',
    'noProviderCall', 'noRender', 'testOnly',
  ])
  if (!record || record.schemaVersion !== 'canonical-planning-handoff-response-v1' ||
      record.source !== 'canonical_planning_handoff_service' || containsForbiddenPrivateMaterial(record)) return null
  const identity = exactRecord(record.identity, ['workspaceId', 'projectId', 'editSessionId'])
  const readiness = exactRecord(record.readiness, [
    'finalizedSourceMediaVerified', 'exactEditPreferencesVerified', 'preferenceApplicationVerified',
    'editBriefVerified', 'outputFrameAndCleanupVerified', 'readyForCanonicalPlanPublication',
  ])
  const persistence = exactRecord(record.persistence, [
    'privateLocal', 'tenantScoped', 'createOnly', 'checksumProtected', 'contentAddressed',
    'distributed', 'productionAuthority',
  ])
  if (!identity || identity.workspaceId !== workspaceId || identity.projectId !== projectId || identity.editSessionId !== editSessionId ||
      !allLiteral(readiness, true) || !persistence || persistence.privateLocal !== true || persistence.tenantScoped !== true ||
      persistence.createOnly !== true || persistence.checksumProtected !== true || persistence.contentAddressed !== true ||
      persistence.distributed !== false || persistence.productionAuthority !== false ||
      record.noPlanPublished !== true || record.noSnapshotCreated !== true || record.noCreditReservation !== true ||
      record.noToolExecution !== true || record.noProviderCall !== true || record.noRender !== true || record.testOnly !== true ||
      !isSafeId(record.handoffId) || !isSha(record.handoffHash) || !isSha(record.canonicalPlanComponentsHash) ||
      !isRecord(record.sourceBindingManifestCandidate) || !isRecord(record.sourceMediaAuthority) ||
      !isRecord(record.planningInputAuthority) || !isRecord(record.resolvedPlanningInputAuthority)) return null
  return {
    handoffId: record.handoffId,
    handoffHash: record.handoffHash,
    canonicalPlanComponentsHash: record.canonicalPlanComponentsHash,
  }
}

function parsePublicationReceipt(
  value: unknown,
  workspaceId: string,
  projectId: string,
  editSessionId: string,
  handoff: HandoffReceipt,
): PublicationReceipt | null {
  const record = exactRecord(value, [
    'schemaVersion', 'source', 'identity', 'candidateHash', 'handoffHash',
    'canonicalPlanComponentsHash', 'publicationBodyHash', 'publicationRequestHash',
    'persistence', 'permissions', 'requestBodyReturned', 'pathOrCredentialReturned',
    'testOnly', 'publicationStatus', 'publication',
  ])
  if (!record || record.schemaVersion !== 'canonical-plan-publication-request-inspection-v1' ||
      record.source !== 'canonical_plan_publication_request_service' || containsForbiddenPrivateMaterial(record)) return null
  const identity = exactRecord(record.identity, ['workspaceId', 'projectId', 'editSessionId', 'handoffId', 'candidateId'])
  const persistence = exactRecord(record.persistence, [
    'privateLocal', 'tenantScoped', 'createOnly', 'checksumProtected', 'contentAddressed',
    'distributed', 'productionAuthority',
  ])
  const permissions = exactRecord(record.permissions, [
    'inspectionOnly', 'internalPublicationRequired', 'planMutation', 'snapshotCreation',
    'creditReservation', 'toolExecution', 'providerCall', 'render',
  ])
  const status = record.publicationStatus
  if (!identity || identity.workspaceId !== workspaceId || identity.projectId !== projectId ||
      identity.editSessionId !== editSessionId || identity.handoffId !== handoff.handoffId || !isSafeId(identity.candidateId) ||
      record.handoffHash !== handoff.handoffHash || record.canonicalPlanComponentsHash !== handoff.canonicalPlanComponentsHash ||
      !isSha(record.candidateHash) || !isSha(record.publicationBodyHash) || !isSha(record.publicationRequestHash) ||
      !persistence || persistence.privateLocal !== true || persistence.tenantScoped !== true || persistence.createOnly !== true ||
      persistence.checksumProtected !== true || persistence.contentAddressed !== true || persistence.distributed !== false ||
      persistence.productionAuthority !== false || !permissions || permissions.inspectionOnly !== true ||
      permissions.internalPublicationRequired !== true || permissions.planMutation !== false ||
      permissions.snapshotCreation !== false || permissions.creditReservation !== false || permissions.toolExecution !== false ||
      permissions.providerCall !== false || permissions.render !== false || record.requestBodyReturned !== false ||
      record.pathOrCredentialReturned !== false || record.testOnly !== true ||
      !['pending_internal_publication', 'published', 'superseded_by_competing_candidate'].includes(String(status)) ||
      !validPublicationProjection(status, record.publication)) return null
  return { publicationStatus: status as PublicationReceipt['publicationStatus'] }
}

function validPublicationProjection(status: unknown, value: unknown): boolean {
  if (status === 'pending_internal_publication') {
    const publication = exactRecord(value, ['internalPublicationMayBeAttempted', 'fullRevalidationRequired', 'exactReplayOnlyAfterPublication'])
    return Boolean(publication && publication.internalPublicationMayBeAttempted === true &&
      publication.fullRevalidationRequired === true && publication.exactReplayOnlyAfterPublication === true)
  }
  if (status === 'superseded_by_competing_candidate') {
    const publication = exactRecord(value, ['internalPublicationMayBeAttempted', 'fullRevalidationRequired', 'exactReplayOnlyAfterPublication'])
    return Boolean(publication && publication.internalPublicationMayBeAttempted === false &&
      publication.fullRevalidationRequired === true && publication.exactReplayOnlyAfterPublication === false)
  }
  if (status === 'published') {
    const publication = exactRecord(value, [
      'planId', 'planningRequestId', 'planVersion', 'planStatus', 'planHash',
      'internalPublicationMayBeAttempted', 'fullRevalidationRequired', 'exactReplayOnlyAfterPublication',
    ])
    return Boolean(publication && isSafeId(publication.planId) && isSafeId(publication.planningRequestId) &&
      Number.isInteger(publication.planVersion) && Number(publication.planVersion) > 0 && isSafeId(publication.planStatus) &&
      isSha(publication.planHash) && publication.internalPublicationMayBeAttempted === false &&
      publication.fullRevalidationRequired === true && publication.exactReplayOnlyAfterPublication === true)
  }
  return false
}

function classifyApiFailure(
  response: ApiFailure & { ok?: boolean },
  handoffSaved: boolean,
): CanonicalPlanningPublicationResult | null {
  if (response.ok) return null
  const code = response.error?.code
  if (response.statusCode === 401 || response.statusCode === 403 ||
      ['AUTH_REQUIRED', 'AUTH_INVALID', 'WORKSPACE_ACCESS_DENIED'].includes(code ?? '')) {
    return {
      status: 'access_denied',
      message: 'This plan cannot be saved outside the current signed-in workspace.',
      retryable: false,
      handoffSaved,
      candidateSaved: false,
      publicationBlockers: [],
      warnings: response.warnings,
    }
  }
  if (['VALIDATION_FAILED', 'IDEMPOTENCY_CONFLICT', 'INVALID_STORED_STATE', 'INTEGRITY_CHECK_FAILED', 'PLAN_NOT_APPROVED'].includes(code ?? '')) {
    return {
      status: 'blocked',
      message: 'The saved edit state changed or no longer matches this plan. Refresh the edit and create a new plan.',
      retryable: false,
      handoffSaved,
      candidateSaved: false,
      publicationBlockers: [],
      warnings: response.warnings,
    }
  }
  if (['invalid_backend_response', 'invalid_json_response'].includes(code ?? '')) {
    return {
      status: 'invalid_response',
      message: 'The private backend response could not be safely verified.',
      retryable: false,
      handoffSaved,
      candidateSaved: false,
      publicationBlockers: [],
      warnings: response.warnings,
    }
  }
  return {
    status: 'unavailable',
    message: 'The private backend could not finish saving this plan. Your approval and credits were not changed.',
    retryable: true,
    handoffSaved,
    candidateSaved: false,
    publicationBlockers: [],
    warnings: response.warnings,
  }
}

function withDraftBlockers(
  failure: CanonicalPlanningPublicationResult,
  draft: CanonicalPlanningDraft,
): CanonicalPlanningPublicationResult {
  return { ...failure, publicationBlockers: draft.publicationBlockers }
}

function result(
  status: CanonicalPlanningPublicationResult['status'],
  message: string,
  retryable: boolean,
  handoffSaved: boolean,
  candidateSaved: boolean,
  draft: CanonicalPlanningDraft,
  warnings: string[],
): CanonicalPlanningPublicationResult {
  return {
    status,
    message,
    retryable,
    handoffSaved,
    candidateSaved,
    publicationBlockers: draft.publicationBlockers,
    warnings,
  }
}

function exactRecord(value: unknown, keys: string[]): Record<string, unknown> | null {
  if (!isRecord(value)) return null
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]) ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function allLiteral(value: Record<string, unknown> | null, literal: boolean): boolean {
  return Boolean(value && Object.values(value).every((entry) => entry === literal))
}

function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 200 && value === value.trim() && SAFE_ID.test(value) && !value.includes('..')
}

function isSha(value: unknown): value is string {
  return typeof value === 'string' && SHA256.test(value)
}

function containsForbiddenPrivateMaterial(value: unknown, key = ''): boolean {
  if (key === 'pathOrCredentialReturned' || key === 'requestBodyReturned') return value !== false
  if (/^(?:secret|credential|accessToken|refreshToken|signedUrl|publicUrl|localPath|absolutePath|relativePath|sourceBytes|bytesBase64|requestBody)$/i.test(key)) return true
  if (Array.isArray(value)) return value.some((entry) => containsForbiddenPrivateMaterial(entry))
  if (isRecord(value)) return Object.entries(value).some(([childKey, child]) => containsForbiddenPrivateMaterial(child, childKey))
  return false
}

function safePlanningRequestId(seed: string, digest: string): string {
  const normalized = seed.replace(/[^A-Za-z0-9._:-]+/g, '-').replace(/\.{2,}/g, '.').slice(0, 120)
  const candidate = `browser-plan-${normalized || digest}`.replace(/[-.]+$/g, '')
  return isSafeId(candidate) ? candidate : `browser-plan-${digest}`
}

function stableClientDigest(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function clearInFlightSave(
  key: string,
  request: Promise<CanonicalPlanningPublicationResult>,
) {
  if (inFlightCanonicalPlanningSaves.get(key) === request) {
    inFlightCanonicalPlanningSaves.delete(key)
  }
}
