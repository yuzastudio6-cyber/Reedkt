import type { PreferenceApplicationRecord } from '../../src/types/edit-reference'
import { ApiError } from '../errors/api-error'
import type {
  EditReferenceProductionApplicationLifecycleReceipt,
  EditReferenceProductionApplicationLifecycleRequest,
} from './edit-reference-production-application-lifecycle'
import {
  createEditReferenceProductionPlanningContext,
  type EditReferenceProductionPlanningContext,
} from './edit-reference-production-planning-context'

export const EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION =
  'edit-reference-production-planning-authority-read-v1' as const

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
  readonly candidateCount: number
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
  readExactConnectedApplication(
    scope: EditReferenceProductionPlanningAuthorityScope,
  ): Promise<EditReferenceProductionPlanningAuthorityReadResult>
}

export interface EditReferenceProductionPlanningAuthorityResolution {
  readonly sourceAuthority: 'canonical_edit_reference_production_repository'
  readonly readRevision: number
  readonly rlsPolicyVersion: string
  readonly accessCheckReceiptId: string
  readonly planningContext: EditReferenceProductionPlanningContext
  readonly rawReferenceMediaIncluded: false
  readonly rawProviderPayloadIncluded: false
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/

export async function resolveEditReferenceProductionPlanningAuthority(input: {
  readonly reader: EditReferenceProductionPlanningAuthorityReader
  readonly scope: EditReferenceProductionPlanningAuthorityScope
  readonly selection?: EditReferenceProductionPlanningAuthoritySelection
}): Promise<EditReferenceProductionPlanningAuthorityResolution | undefined> {
  validateScope(input.scope)
  if (input.selection) validateSelection(input.selection)
  const read = await input.reader.readExactConnectedApplication(input.scope)
  validateReadEnvelope(read)
  if (read.candidateCount === 0) {
    if (input.selection) invalid('selected_production_application_not_found', 404)
    return undefined
  }
  if (read.candidateCount !== 1) invalid('multiple_connected_production_applications', 409)
  const application = read.application
  const request = read.lifecycleRequest
  const receipt = read.lifecycleReceipt
  if (!application || !request || !receipt) invalid('production_application_authority_payload_missing')
  if (
    application.workspaceId !== input.scope.workspaceId
    || application.projectId !== input.scope.projectId
    || application.editSessionId !== input.scope.editSessionId
  ) invalid('production_application_tenant_or_edit_binding_invalid', 403)
  const planningContext = createEditReferenceProductionPlanningContext({ application, request, receipt })
  if (input.selection && (
    input.selection.applicationId !== application.id
    || input.selection.expectedApplicationContentDigestSha256 !== application.contentDigest
    || input.selection.expectedApplicationContextHashSha256 !== planningContext.applicationContextHashSha256
    || input.selection.expectedLifecycleReceiptDigestSha256 !== receipt.receiptDigestSha256
  )) invalid('selected_production_application_changed', 409)
  return {
    sourceAuthority: 'canonical_edit_reference_production_repository',
    readRevision: read.readRevision,
    rlsPolicyVersion: read.tenantIsolation.rlsPolicyVersion,
    accessCheckReceiptId: read.tenantIsolation.accessCheckReceiptId,
    planningContext,
    rawReferenceMediaIncluded: false,
    rawProviderPayloadIncluded: false,
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

function validateReadEnvelope(read: EditReferenceProductionPlanningAuthorityReadResult): void {
  const isolation = read.tenantIsolation
  if (
    read.schemaVersion !== EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_READ_VERSION
    || read.repositoryAuthority !== 'supabase_rls_transactional'
    || !Number.isInteger(read.candidateCount)
    || read.candidateCount < 0
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
  if ((read.candidateCount === 0 && payloadCount !== 0) || (read.candidateCount > 0 && payloadCount !== 3)) {
    invalid('production_planning_authority_repository_payload_invalid')
  }
}

function invalid(reason: string, status = 503): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The production Edit Reference planning authority is unavailable or unsafe.',
    status,
    { reason, remoteMutationAttempted: false },
  )
}
