import type {
  CanonicalExactEditPlanningAuthorityRead,
  CanonicalExactEditPlanningEvidenceRequest,
} from '../../src/types/canonical-exact-edit-planning-authority'
import {
  canonicalExactEditPlanningAuthorityReadSchema,
  canonicalExactEditPlanningEvidenceRequestSchema,
} from '../validation/canonical-exact-edit-planning-authority-schemas'
import { ApiError } from '../errors/api-error'

export const CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_RPC =
  'read_exact_edit_planning_authority_v1' as const

export const CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_RPC =
  'record_exact_edit_planning_evidence_v1' as const

export const CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_CONTRACT =
  'canonical-exact-edit-planning-authority-read-v1' as const

export interface CanonicalExactEditPlanningAuthorityReadScope {
  readonly actorUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
}

export function validateCanonicalExactEditPlanningAuthorityReadScope(
  scope: CanonicalExactEditPlanningAuthorityReadScope,
): void {
  if (
    !safeId(scope.actorUserId)
    || !safeId(scope.workspaceId)
    || !safeId(scope.projectId)
    || !safeId(scope.editSessionId)
  ) invalid('canonical_exact_edit_planning_read_scope_invalid')
}

export function validateCanonicalExactEditPlanningAuthorityRead(
  authority: CanonicalExactEditPlanningAuthorityRead,
): void {
  const parsed = canonicalExactEditPlanningAuthorityReadSchema.safeParse(authority)
  if (!parsed.success) invalid('canonical_exact_edit_planning_read_invalid')
}

export function validateCanonicalExactEditPlanningEvidenceRequest(
  request: CanonicalExactEditPlanningEvidenceRequest,
): void {
  const parsed = canonicalExactEditPlanningEvidenceRequestSchema.safeParse(request)
  if (!parsed.success) invalid('canonical_exact_edit_planning_evidence_invalid')
}

function safeId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/.test(value)
}

function invalid(reason: string): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'Canonical exact-edit planning authority could not be verified.',
    503,
    { reason, productionReady: false },
  )
}
