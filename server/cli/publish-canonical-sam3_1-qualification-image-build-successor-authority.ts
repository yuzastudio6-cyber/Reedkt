import {
  publishCanonicalSam31QualificationImageBuildAuthority,
} from '../services/canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-reconciliation-runtime'

const CONFIRMATION =
  'publish-reconciled-sam31-qualification-image-successor-authority' as const
const targets = {
  successor_1: {
    reconciliationRef: {
      id: 'sam31-qualification-image-build-reconciliation-b062f52b26deca94',
      version: 1 as const,
      contentHash:
        'sha256:bbe03fd142700e5459812852004916a3e44fd389fe272d09dc1a1a56f49dec0f' as const,
    },
    authorityId:
      'sam31-qualification-image-build-85b90c05fbbcb04a-successor-1',
  },
  successor_2: {
    reconciliationRef: {
      id: 'sam31-qualification-image-build-reconciliation-57ef0b4aa3a0b93d',
      version: 1 as const,
      contentHash:
        'sha256:4e0ebc7ae10a60e66d14950a9014fb8a1e814533c194c139a0cb1e6bfcb690ff' as const,
    },
    authorityId:
      'sam31-qualification-image-build-85b90c05fbbcb04a-successor-2',
  },
} as const

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUCCESSOR_AUTHORITY_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 successor authority confirmation is missing.')

const targetName =
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUCCESSOR_AUTHORITY_TARGET
if (targetName !== 'successor_1' && targetName !== 'successor_2') {
  throw new Error('SAM 3.1 successor authority target is invalid.')
}
const target = targets[targetName]

const reconciliationRuntime =
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime()
const reconciliation = await reconciliationRuntime.rereadReconciliation({
  reconciliationRef: target.reconciliationRef,
})
if (
  !reconciliation
  || reconciliation.disposition !==
    'precreation_rejection_no_build_found'
  || !reconciliation.predecessorProviderExecutionKnownAbsent
  || reconciliation.predecessorImageBuildKnownStarted
  || !reconciliation.distinctSuccessorAuthorityMayBeIssued
  || reconciliation.automaticRetryAllowed
) throw new Error('SAM 3.1 successor authority is not reconciled.')

const authority = await publishCanonicalSam31QualificationImageBuildAuthority({
  manifestId: 'sam31-qualification-image-capsule-85b90c05fbbcb04a',
  authorityId: target.authorityId,
  ingestReceiptRef: {
    id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
    version: 1,
    schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    contentHash:
      'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
  },
  reproducibilityReceiptRef: {
    id: 'sam31-qualification-capsule-reproducibility-20260807',
    version: 1,
    contentHash:
      'sha256:8df0b4538f6eac8c8d580898e3fecdf729b05ce05ecf85bd653cadfdb4edfb8d',
  },
})

console.log(JSON.stringify({
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-successor-authority-publication-v1',
  predecessorReconciliationRef: target.reconciliationRef,
  predecessorProviderExecutionKnownAbsent: true,
  automaticRetryOfPredecessor: false,
  distinctSuccessorAuthority: true,
  ...authority,
}, null, 2))
