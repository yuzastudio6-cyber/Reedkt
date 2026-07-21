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
