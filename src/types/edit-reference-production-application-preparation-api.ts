import type { PreferenceApplicationSource } from './edit-reference'
import type {
  EditReferenceProductionPreparedApplicationAuthority,
} from './edit-reference-production-exact-edit-apply-api'

export const EDIT_REFERENCE_APPLICATION_PREPARATION_INTENT_VERSION =
  'edit-reference-application-preparation-intent-v1' as const

export const EDIT_REFERENCE_APPLICATION_PREPARATION_RECEIPT_VERSION =
  'edit-reference-application-preparation-receipt-v1' as const

/**
 * Browser-safe intent. It identifies already-persisted authorities but does
 * not contain Preference DNA decisions, target-study evidence, an application
 * record, or permission to connect the result to an edit.
 */
export interface EditReferenceApplicationPreparationIntent {
  readonly schemaVersion: typeof EDIT_REFERENCE_APPLICATION_PREPARATION_INTENT_VERSION
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly dnaVersionId: string
  readonly expectedReferenceRevision: number
  readonly expectedDNAContentDigestSha256: string
  readonly applicationSource: PreferenceApplicationSource
  readonly targetUnderstandingPackageId: string
  readonly targetUnderstandingPackageDigestSha256: string
  readonly targetUnderstandingSourceStorageObjectRecordId: string
  readonly targetUnderstandingSourceMediaAssetId: string
  readonly targetUnderstandingEditBriefDigestSha256: string
}
export interface EditReferenceApplicationPreparationReceipt {
  readonly schemaVersion: typeof EDIT_REFERENCE_APPLICATION_PREPARATION_RECEIPT_VERSION
  readonly sourceAuthority: 'canonical_preference_application_preparation'
  readonly runtimeSource: 'verified_live' | 'controlled_local'
  readonly transactionId: string
  readonly preparationRequestDigestSha256: string
  readonly applicationAuthority: EditReferenceProductionPreparedApplicationAuthority
  readonly editReferenceName: string
  readonly replayed: boolean
  readonly preparedAt: string
  readonly authenticatedScopeReboundServerSide: true
  readonly canonicalReferenceDnaQaAndTargetStudyReRead: true
  readonly applicationConnectedToEdit: false
  readonly planOrEstimateInvalidated: false
  readonly approvedSnapshotMutated: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly providerOrWorkerExecutionStarted: false
  readonly receiptDigestSha256: string
}
