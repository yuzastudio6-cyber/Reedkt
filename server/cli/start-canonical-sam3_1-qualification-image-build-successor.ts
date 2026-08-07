import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-reconciliation-runtime'

const CONFIRMATION =
  'start-one-reconciled-sam31-qualification-image-successor-build' as const
const reconciliationRef = {
  id: 'sam31-qualification-image-build-reconciliation-b062f52b26deca94',
  version: 1 as const,
  contentHash:
    'sha256:bbe03fd142700e5459812852004916a3e44fd389fe272d09dc1a1a56f49dec0f' as const,
}
const successorAuthorityRef = {
  id: 'sam31-qualification-image-build-85b90c05fbbcb04a-successor-1',
  version: 1 as const,
  contentHash:
    'sha256:e8432b39e98fcd7b9974da2ee6c12b0d015607a72d2366ab45a4356dbfbecfeb' as const,
}

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUCCESSOR_BUILD_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 successor build confirmation is missing.')

const reconciliationRuntime =
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime()
const reconciliation = await reconciliationRuntime.rereadReconciliation({
  reconciliationRef,
})
if (
  !reconciliation
  || reconciliation.disposition !==
    'precreation_rejection_no_build_found'
  || !reconciliation.predecessorProviderExecutionKnownAbsent
  || reconciliation.predecessorImageBuildKnownStarted
  || !reconciliation.distinctSuccessorAuthorityMayBeIssued
  || reconciliation.automaticRetryAllowed
) throw new Error('SAM 3.1 successor build is not reconciled.')

const runtime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const successorAuthority = await runtime.repository
  .rereadQualificationImageBuildAuthority({
    authorityRef: successorAuthorityRef,
  })
if (
  !successorAuthority
  || successorAuthority.authorityId !== successorAuthorityRef.id
  || `sha256:${successorAuthority.authorityHash}` !==
    successorAuthorityRef.contentHash
) throw new Error('SAM 3.1 successor authority reread changed.')

const submission = await runtime.startOneQualificationImageBuild({
  authorityRef: successorAuthorityRef,
})
console.log(JSON.stringify({
  predecessorReconciliationRef: reconciliationRef,
  distinctSuccessorAuthority: true,
  automaticRetryOfPredecessor: false,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
