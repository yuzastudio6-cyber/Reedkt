import type {
  CleanupPreference,
  CreditPreference,
  EditLevel,
  MoodStyle,
  TargetPlatform,
  VideoWorkflowType,
  VisualPreference,
} from './reeditpro'
import type {
  EditReferenceProductionLifecycleCommand,
} from './edit-reference-production-lifecycle-api'

export const EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_COMMAND_VERSION =
  'edit-reference-production-exact-edit-apply-command-v1' as const

export const EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RECEIPT_VERSION =
  'edit-reference-production-exact-edit-apply-receipt-v1' as const

export const EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_VERSION =
  'edit-reference-production-exact-edit-apply-authority-read-v1' as const

export const EDIT_REFERENCE_PRODUCTION_PREPARED_APPLICATION_AUTHORITY_VERSION =
  'edit-reference-production-prepared-application-authority-v1' as const

export interface EditReferenceProductionExactEditPreferenceValues {
  readonly editLevel: EditLevel
  readonly workflowType: VideoWorkflowType
  readonly cleanupPreference: CleanupPreference
  readonly visualPreference: VisualPreference
  readonly moodStyle: MoodStyle
  readonly creditPreference: CreditPreference
  readonly targetPlatform: TargetPlatform
}

export type EditReferenceProductionExactEditPreferencePatch = Partial<
  EditReferenceProductionExactEditPreferenceValues
>

export interface EditReferenceProductionExactEditOutputFrameAuthoritySnapshot {
  readonly schemaVersion: 'edit-reference-production-output-frame-authority-v1'
  readonly sourceAuthority: 'canonical_exact_edit_preference_frame_confirmation'
  readonly repositoryAuthority: 'supabase_rls_transactional'
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly exactEditPreferenceRecordRevision: number
  readonly planningInputRevision: number
  readonly confirmationId: string
  readonly aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '4:3'
  readonly confirmedAt: string
  readonly browserSuppliedAuthorityAccepted: false
  readonly authorityDigestSha256: string
}

/**
 * Server-read projection for one already prepared application. It contains
 * only immutable identities and digests needed to construct the browser CAS
 * expectation. Raw Preference DNA, evidence, media, provider payloads, and
 * output-frame content are intentionally absent.
 */
export interface EditReferenceProductionPreparedApplicationAuthority {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_PREPARED_APPLICATION_AUTHORITY_VERSION
  readonly sourceAuthority: 'canonical_preference_application_repository'
  readonly runtimeSource: 'verified_live'
  readonly authorityReadReceiptId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly dnaVersionId: string
  readonly dnaQaResultId: string
  readonly applicationId: string
  readonly applicationVersionNumber: number
  readonly applicationContentDigestSha256: string
  readonly applicationContextHashSha256: string
  readonly targetUnderstandingPackageDigestSha256: string
  readonly expectedReferenceRevision: number
  readonly status: 'prepared'
  readonly connectionState: 'not_connected' | 'connected'
}

/**
 * Browser-safe readback used immediately before the one exact-edit Apply.
 * The server reads this authority again during mutation; a browser copy is an
 * optimistic concurrency expectation, never mutation authority.
 */
export interface EditReferenceProductionExactEditApplyAuthorityRead {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_AUTHORITY_READ_VERSION
  readonly sourceAuthority: 'canonical_exact_edit_preference_repository'
  readonly runtimeSource: 'verified_live'
  readonly authorityReadReceiptId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly recordRevision: number
  readonly preferenceRevision: number
  readonly planningInputRevision: number
  readonly preferenceFingerprintSha256: string
  readonly values: EditReferenceProductionExactEditPreferenceValues
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
  readonly outputFrameAuthority: EditReferenceProductionExactEditOutputFrameAuthoritySnapshot | null
  readonly selectedApplicationAuthority: EditReferenceProductionPreparedApplicationAuthority | null
  readonly readAt: string
  readonly browserMutationAuthorityGranted: false
  readonly productionReleaseReadinessEvaluatedSeparately: true
}

/**
 * Browser-safe command for the one exact-edit Apply action. The optional Edit
 * Reference lifecycle command is a nested subcommand, never a second endpoint
 * or transaction. Actor identity, current records, frame authority, server
 * time, and the idempotency hash are all re-derived server-side.
 */
export interface EditReferenceProductionExactEditApplyCommand {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_COMMAND_VERSION
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly expectedPreferenceRecordRevision: number
  readonly expectedPreferenceRevision: number
  readonly expectedPlanningInputRevision: number
  readonly expectedPreferenceFingerprintSha256: string
  readonly preferencePatch: EditReferenceProductionExactEditPreferencePatch
  readonly editReferenceLifecycle: EditReferenceProductionLifecycleCommand | null
}

export interface EditReferenceProductionExactEditApplyApiReceipt {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_EXACT_EDIT_APPLY_RECEIPT_VERSION
  readonly sourceAuthority: 'canonical_exact_edit_apply_rpc'
  readonly canonicalReceiptValidatedServerSide: true
  readonly transactionId: string
  readonly changedPreferenceFields: readonly (
    keyof EditReferenceProductionExactEditPreferenceValues
  )[]
  readonly referenceMutation: 'apply' | 'replace' | 'remove' | null
  readonly committedPreferenceRecordRevision: number
  readonly committedPreferenceRevision: number
  readonly committedPlanningInputRevision: number
  readonly sourcePreparationDisposition: 'unchanged' | 'requires_repreparation'
  readonly outputFrameDisposition: 'unchanged' | 'requires_reconfirmation'
  readonly freshPlanAndEstimateRequired: true
  readonly approvedSnapshotPreserved: true
  readonly historicalPrivatePreviewPreserved: true
  readonly transactionReceiptDigestSha256: string
  readonly committedAt: string
  readonly productionReleaseReadinessEvaluatedSeparately: true
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly providerOrWorkerExecutionStarted: false
}
