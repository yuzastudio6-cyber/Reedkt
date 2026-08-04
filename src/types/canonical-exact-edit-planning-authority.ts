import type {
  EditReferenceProductionExactEditPreferenceValues,
} from './edit-reference-production-exact-edit-apply-api'

export const CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_VERSION =
  'canonical-exact-edit-planning-authority-read-v1' as const

export const CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_REQUEST_VERSION =
  'canonical-exact-edit-planning-evidence-request-v1' as const

export interface CanonicalExactEditPreferenceBaselineAuthority {
  readonly preferenceSnapshotId: string
  readonly values: EditReferenceProductionExactEditPreferenceValues
  readonly preferenceFingerprintSha256: string
  readonly capturedAt: string
  readonly persistenceSource:
    | 'server_defaults'
    | 'authenticated_private_internal_backend'
  readonly provenance:
    | 'server_default_preferences'
    | 'saved_edit_preferences'
}

export type CanonicalExactEditSourcePreparationAuthority =
  | {
      readonly status: 'not_ready' | 'requires_repreparation'
      readonly sourceCandidateHashSha256: null
      readonly evidenceHashSha256: null
      readonly confirmedAt: null
    }
  | {
      readonly status: 'ready'
      /** Null only for the retained non-promotable private-store adapter. */
      readonly sourceCandidateHashSha256: string | null
      readonly evidenceHashSha256: string
      readonly confirmedAt: string
    }

export type CanonicalExactEditFrameConfirmationAuthority =
  | {
      readonly status: 'not_confirmed'
      readonly confirmationId: null
      readonly aspectRatio: null
      readonly confirmedAt: null
      readonly authorityDigestSha256: null
    }
  | {
      readonly status: 'confirmed'
      readonly confirmationId: string
      readonly aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '4:3'
      readonly confirmedAt: string
      readonly authorityDigestSha256: string
    }

/**
 * Sanitized exact-edit authority used by canonical planning. It is read-only
 * in the browser. Source preparation is recorded only by the authenticated
 * server planning handoff after source media has been verified.
 */
export interface CanonicalExactEditPlanningAuthorityRead {
  readonly schemaVersion: typeof CANONICAL_EXACT_EDIT_PLANNING_AUTHORITY_READ_VERSION
  readonly sourceAuthority:
    | 'canonical_exact_edit_preference_repository'
    | 'private_exact_edit_preference_compatibility'
  readonly runtimeSource: 'verified_live' | 'private_internal'
  readonly authorityReadReceiptId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly recordRevision: number
  readonly preferenceRevision: number
  readonly planningInputRevision: number
  readonly preferenceFingerprintSha256: string
  readonly values: EditReferenceProductionExactEditPreferenceValues
  readonly baseline: CanonicalExactEditPreferenceBaselineAuthority
  readonly sourcePreparation: CanonicalExactEditSourcePreparationAuthority
  readonly frameConfirmation: CanonicalExactEditFrameConfirmationAuthority
  readonly lifecyclePhase:
    | 'planning'
    | 'approved_snapshot'
    | 'credit_reserved'
    | 'executing'
    | 'private_review'
    | 'completed_internal'
    | 'revision_handoff'
  readonly locked: boolean
  readonly currentApplicationState: 'not_selected' | 'connected' | 'cleared'
  readonly currentApplicationId: string | null
  readonly readAt: string
  readonly browserMutationAuthorityGranted: false
  readonly productionReleaseReadinessEvaluatedSeparately: true
}

export interface CanonicalExactEditPlanningEvidenceRequest {
  readonly schemaVersion: typeof CANONICAL_EXACT_EDIT_PLANNING_EVIDENCE_REQUEST_VERSION
  readonly actorUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly expectedPreferenceRevision: number
  readonly expectedPlanningInputRevision: number
  readonly expectedPreferenceFingerprintSha256: string
  readonly expectedBaselinePreferenceSnapshotId: string
  readonly sourceCandidateHashSha256: string
  readonly sourcePreparationEvidenceHashSha256: string
  readonly confirmedAspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '4:3'
}
