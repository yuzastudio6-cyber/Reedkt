import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-reconciliation-runtime'

const CONFIRMATION =
  'start-one-reconciled-sam31-qualification-image-successor-build' as const
const targets = {
  successor_2: {
    reconciliationRef: {
      id: 'sam31-qualification-image-build-reconciliation-57ef0b4aa3a0b93d',
      version: 1 as const,
      contentHash:
        'sha256:4e0ebc7ae10a60e66d14950a9014fb8a1e814533c194c139a0cb1e6bfcb690ff' as const,
    },
    authorityRef: {
      id: 'sam31-qualification-image-build-85b90c05fbbcb04a-successor-2',
      version: 1 as const,
      contentHash:
        'sha256:16d1861f1d5b4b6a7b8e56218d41a45281a86dfeaa6579a9f314ce45f9746506' as const,
    },
  },
} as const

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUCCESSOR_BUILD_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 successor build confirmation is missing.')

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUCCESSOR_BUILD_TARGET !==
    'successor_2'
) throw new Error('SAM 3.1 successor build target is invalid.')
const target = targets.successor_2

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
) throw new Error('SAM 3.1 successor build is not reconciled.')

let providerCreateResponseSummary: unknown = null
const runtime = createCanonicalSam31GcpQualificationImageBuildRuntime({
  observeCreateResponse(summary) {
    providerCreateResponseSummary = summary
  },
})
const successorAuthority = await runtime.repository
  .rereadQualificationImageBuildAuthority({
    authorityRef: target.authorityRef,
  })
if (
  !successorAuthority
  || successorAuthority.authorityId !== target.authorityRef.id
  || `sha256:${successorAuthority.authorityHash}` !==
    target.authorityRef.contentHash
) throw new Error('SAM 3.1 successor authority reread changed.')

const submission = await runtime.startOneQualificationImageBuild({
  authorityRef: target.authorityRef,
})
console.log(JSON.stringify({
  predecessorReconciliationRef: target.reconciliationRef,
  distinctSuccessorAuthority: true,
  automaticRetryOfPredecessor: false,
  providerCreateResponseSummary,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
