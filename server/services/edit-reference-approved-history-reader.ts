import type {
  EditReferencePreviousApprovedEditAuthorityProof,
  EditReferencePreviousApprovedEditEvidenceSummary,
  EditReferencePreviousApprovedEditPrivateArtifactProof,
  EditReferencePreviousApprovedEditStudyBlockerCode,
  EditReferencePreviousApprovedEditStudyRequest,
  EditReferenceVerifiedPreviousApprovedEditStudyResult,
} from '../edit-references/edit-reference-previous-approved-edit-study-contract'

export const EDIT_REFERENCE_APPROVED_HISTORY_PACKAGE_VERSION =
  'edit-reference-approved-history-package-v1' as const

export interface EditReferenceApprovedHistoryUsage {
  readonly internalCostStatus: 'not_incurred' | 'metered'
  readonly meteredInternalCostMicros: string
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
}

export interface EditReferenceVerifiedApprovedHistoryPackage {
  readonly schemaVersion: typeof EDIT_REFERENCE_APPROVED_HISTORY_PACKAGE_VERSION
  readonly status: 'verified'
  readonly runtimeSource: EditReferenceVerifiedPreviousApprovedEditStudyResult['runtimeSource']
  readonly authority: EditReferencePreviousApprovedEditAuthorityProof
  readonly approvedPlanEvidenceIds: readonly string[]
  readonly privatePreviewArtifactIds: readonly string[]
  readonly privatePreviewArtifactProofs: readonly EditReferencePreviousApprovedEditPrivateArtifactProof[]
  readonly evidence: readonly EditReferencePreviousApprovedEditEvidenceSummary[]
  readonly execution: EditReferenceVerifiedPreviousApprovedEditStudyResult['execution']
  readonly usage: EditReferenceApprovedHistoryUsage
  readonly privacy: EditReferenceVerifiedPreviousApprovedEditStudyResult['privacy']
}

export interface EditReferenceBlockedApprovedHistoryPackage {
  readonly schemaVersion: typeof EDIT_REFERENCE_APPROVED_HISTORY_PACKAGE_VERSION
  readonly status: 'blocked'
  readonly blockerCode: EditReferencePreviousApprovedEditStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
}

export type EditReferenceApprovedHistoryPackage =
  | EditReferenceVerifiedApprovedHistoryPackage
  | EditReferenceBlockedApprovedHistoryPackage

export interface EditReferenceApprovedHistoryReader {
  readonly executionMode: 'unavailable' | 'controlled_local' | 'backend_local_product' | 'live_repository'
  read(
    request: EditReferencePreviousApprovedEditStudyRequest,
  ): Promise<EditReferenceApprovedHistoryPackage>
}

export function createUnavailableEditReferenceApprovedHistoryReader(): EditReferenceApprovedHistoryReader {
  return {
    executionMode: 'unavailable',
    async read(): Promise<EditReferenceApprovedHistoryPackage> {
      return {
        schemaVersion: EDIT_REFERENCE_APPROVED_HISTORY_PACKAGE_VERSION,
        status: 'blocked',
        blockerCode: 'adapter_unavailable',
        blockerMessage: 'The workspace-authorized approved-history reader is unavailable in this runtime.',
        retryAvailable: true,
        retryReason: 'Restore the reviewed exact-identity approved-history reader, immutable approval authority, and private artifact lineage before retrying.',
      }
    },
  }
}
