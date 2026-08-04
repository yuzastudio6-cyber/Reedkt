import { createHash } from 'node:crypto'
import type { PreferenceApplicationRecord } from '../../src/types/edit-reference'
import { ApiError } from '../errors/api-error'
import type {
  EditReferenceProductionApplicationLifecycleReceipt,
  EditReferenceProductionApplicationLifecycleRequest,
} from './edit-reference-production-application-lifecycle'
import { validateEditReferenceProductionApplicationLifecycleReceipt } from './edit-reference-production-application-lifecycle'
import {
  createEditReferenceProductionPlanningContext,
  type EditReferenceProductionPlanningContext,
} from './edit-reference-production-planning-context'

export const EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION =
  'edit-reference-production-planning-authority-read-v2' as const

export interface EditReferenceProductionPlanningAuthorityScope {
  readonly actorUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
}

export interface EditReferenceProductionPlanningAuthoritySelection {
  readonly applicationId: string
  readonly expectedApplicationContentDigestSha256: string
  readonly expectedApplicationContextHashSha256: string
  readonly expectedLifecycleReceiptDigestSha256: string
}

export interface EditReferenceProductionPlanningAuthorityReadResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION
  readonly repositoryAuthority: 'supabase_rls_transactional'
  readonly currentState: 'not_selected' | 'connected' | 'cleared'
  readonly stateRecordCount: number
  readonly tenantIsolation: {
    readonly authenticatedUserVerified: true
    readonly workspaceMembershipVerified: true
    readonly workspaceProjectCompositeBindingVerified: true
    readonly projectEditSessionCompositeBindingVerified: true
    readonly rlsPolicyVersion: string
    readonly accessCheckReceiptId: string
  }
  readonly readRevision: number
  readonly readAt: string
  readonly application?: PreferenceApplicationRecord
  readonly lifecycleRequest?: EditReferenceProductionApplicationLifecycleRequest
  readonly lifecycleReceipt?: EditReferenceProductionApplicationLifecycleReceipt
}

export interface EditReferenceProductionPlanningAuthorityReader {
  readExactApplicationState(
    scope: EditReferenceProductionPlanningAuthorityScope,
  ): Promise<EditReferenceProductionPlanningAuthorityReadResult>
}

interface EditReferenceProductionPlanningAuthorityResolutionBase {
  readonly sourceAuthority: 'canonical_edit_reference_production_repository'
  readonly readRevision: number
  readonly rlsPolicyVersion: string
  readonly accessCheckReceiptId: string
  readonly rawReferenceMediaIncluded: false
  readonly rawProviderPayloadIncluded: false
}

export interface EditReferenceProductionPlanningAuthorityNotSelectedResolution
  extends EditReferenceProductionPlanningAuthorityResolutionBase {
  readonly status: 'not_selected'
  readonly applicationVersion: 0
  readonly applicationHash: string
}

export interface EditReferenceProductionPlanningAuthorityClearedResolution
  extends EditReferenceProductionPlanningAuthorityResolutionBase {
  readonly status: 'cleared'
  readonly applicationId: string
  readonly applicationVersion: number
  readonly applicationHash: string
  readonly lifecycleTransactionId: string
  readonly lifecycleReceiptDigestSha256: string
  readonly committedPlanningInputRevision: number
}

export interface EditReferenceProductionPlanningAuthorityAppliedResolution
  extends EditReferenceProductionPlanningAuthorityResolutionBase {
  readonly status: 'applied'
  readonly planningContext: EditReferenceProductionPlanningContext
}

export type EditReferenceProductionPlanningAuthorityResolution =
  | EditReferenceProductionPlanningAuthorityNotSelectedResolution
  | EditReferenceProductionPlanningAuthorityClearedResolution
  | EditReferenceProductionPlanningAuthorityAppliedResolution

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/

export async function resolveEditReferenceProductionPlanningAuthority(input: {
  readonly reader: EditReferenceProductionPlanningAuthorityReader
  readonly scope: EditReferenceProductionPlanningAuthorityScope
  readonly selection?: EditReferenceProductionPlanningAuthoritySelection
}): Promise<EditReferenceProductionPlanningAuthorityResolution> {
  validateScope(input.scope)
  if (input.selection) validateSelection(input.selection)
  const read = await input.reader.readExactApplicationState(input.scope)
  validateReadEnvelope(read)
  const base = {
    sourceAuthority: 'canonical_edit_reference_production_repository' as const,
    readRevision: read.readRevision,
    rlsPolicyVersion: read.tenantIsolation.rlsPolicyVersion,
    accessCheckReceiptId: read.tenantIsolation.accessCheckReceiptId,
    rawReferenceMediaIncluded: false as const,
    rawProviderPayloadIncluded: false as const,
  }
  if (read.currentState === 'not_selected') {
    if (input.selection) invalid('selected_production_application_changed', 409)
    return {
      ...base,
      status: 'not_selected',
      applicationVersion: 0,
      applicationHash: sha256({
        schemaVersion: EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION,
        workspaceId: input.scope.workspaceId,
        projectId: input.scope.projectId,
        editSessionId: input.scope.editSessionId,
        readRevision: read.readRevision,
        currentState: read.currentState,
      }),
    }
  }
  if (read.currentState === 'cleared') {
    if (input.selection) invalid('selected_production_application_changed', 409)
    const request = read.lifecycleRequest!
    const receipt = read.lifecycleReceipt!
    if (
      request.actorUserId !== input.scope.actorUserId
      || request.workspaceId !== input.scope.workspaceId
      || request.projectId !== input.scope.projectId
      || request.editSessionId !== input.scope.editSessionId
    ) invalid('production_planning_cleared_lifecycle_scope_invalid', 403)
    return {
      ...base,
      status: 'cleared',
      applicationId: request.applicationId,
      applicationVersion: receipt.committedReferenceRevision,
      applicationHash: receipt.receiptDigestSha256,
      lifecycleTransactionId: receipt.transactionId,
      lifecycleReceiptDigestSha256: receipt.receiptDigestSha256,
      committedPlanningInputRevision: receipt.committedPlanningInputRevision,
    }
  }
  const application = read.application
  const request = read.lifecycleRequest
  const receipt = read.lifecycleReceipt
  if (!application || !request || !receipt) invalid('production_application_authority_payload_missing')
  if (
    application.workspaceId !== input.scope.workspaceId
    || application.projectId !== input.scope.projectId
    || application.editSessionId !== input.scope.editSessionId
    || request?.actorUserId !== input.scope.actorUserId
  ) invalid('production_application_tenant_or_edit_binding_invalid', 403)
  const planningContext = createEditReferenceProductionPlanningContext({ application, request, receipt })
  if (input.selection && (
    input.selection.applicationId !== application.id
    || input.selection.expectedApplicationContentDigestSha256 !== application.contentDigest
    || input.selection.expectedApplicationContextHashSha256 !== planningContext.applicationContextHashSha256
    || input.selection.expectedLifecycleReceiptDigestSha256 !== receipt.receiptDigestSha256
  )) invalid('selected_production_application_changed', 409)
  return {
    ...base,
    status: 'applied',
    planningContext,
  }
}

function validateScope(scope: EditReferenceProductionPlanningAuthorityScope): void {
  for (const value of [scope.actorUserId, scope.workspaceId, scope.projectId, scope.editSessionId]) {
    if (!ID_PATTERN.test(value)) invalid('production_planning_authority_scope_invalid', 400)
  }
}

function validateSelection(selection: EditReferenceProductionPlanningAuthoritySelection): void {
  if (
    !ID_PATTERN.test(selection.applicationId)
    || !SHA256_PATTERN.test(selection.expectedApplicationContentDigestSha256)
    || !SHA256_PATTERN.test(selection.expectedApplicationContextHashSha256)
    || !SHA256_PATTERN.test(selection.expectedLifecycleReceiptDigestSha256)
  ) invalid('production_planning_authority_selection_invalid', 400)
}

export function validateEditReferenceProductionPlanningAuthorityReadResult(
  read: EditReferenceProductionPlanningAuthorityReadResult,
): void {
  validateReadEnvelope(read)
}

function validateReadEnvelope(read: EditReferenceProductionPlanningAuthorityReadResult): void {
  if (!read || typeof read !== 'object' || !read.tenantIsolation) {
    invalid('production_planning_authority_repository_evidence_invalid')
  }
  const isolation = read.tenantIsolation
  if (
    read.schemaVersion !== EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION
    || read.repositoryAuthority !== 'supabase_rls_transactional'
    || !['not_selected', 'connected', 'cleared'].includes(read.currentState)
    || !Number.isInteger(read.stateRecordCount)
    || read.stateRecordCount < 0
    || !Number.isInteger(read.readRevision)
    || read.readRevision < 0
    || !Number.isFinite(Date.parse(read.readAt))
    || isolation.authenticatedUserVerified !== true
    || isolation.workspaceMembershipVerified !== true
    || isolation.workspaceProjectCompositeBindingVerified !== true
    || isolation.projectEditSessionCompositeBindingVerified !== true
    || !ID_PATTERN.test(isolation.rlsPolicyVersion)
    || !ID_PATTERN.test(isolation.accessCheckReceiptId)
  ) invalid('production_planning_authority_repository_evidence_invalid')
  const payloadCount = [read.application, read.lifecycleRequest, read.lifecycleReceipt]
    .filter((value) => value !== undefined).length
  if (
    (read.currentState === 'not_selected' && (read.stateRecordCount !== 0 || payloadCount !== 0))
    || (read.currentState === 'connected' && (read.stateRecordCount !== 1 || payloadCount !== 3))
    || (read.currentState === 'cleared' && (read.stateRecordCount !== 1 || payloadCount !== 2 || read.application !== undefined))
  ) {
    invalid('production_planning_authority_repository_payload_invalid')
  }
  if (read.currentState === 'cleared') validateClearedLifecycle(read)
}

function validateClearedLifecycle(read: EditReferenceProductionPlanningAuthorityReadResult): void {
  const request = read.lifecycleRequest
  const receipt = read.lifecycleReceipt
  if (!request || !receipt) invalid('production_planning_cleared_lifecycle_missing')
  validateEditReferenceProductionApplicationLifecycleReceipt({ request, receipt })
  if (
    request.mutation !== 'remove'
    || receipt.applicationStatusAfter !== 'cleared'
    || receipt.preferenceContextStatusAfter !== 'invalidated'
  ) invalid('production_planning_cleared_lifecycle_invalid')
}

function sha256(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((entry) => stableJson(entry)).join(',')}]`
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  const serialized = JSON.stringify(value)
  if (serialized === undefined) invalid('production_planning_authority_non_canonical_value')
  return serialized
}

function invalid(reason: string, status = 503): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The production Edit Reference planning authority is unavailable or unsafe.',
    status,
    { reason, remoteMutationAttempted: false },
  )
}
