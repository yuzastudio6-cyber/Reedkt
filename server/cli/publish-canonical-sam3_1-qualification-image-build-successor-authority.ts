import {
  publishCanonicalSam31QualificationImageBuildAuthority,
} from '../services/canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-reconciliation-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'publish-reconciled-sam31-qualification-image-successor-authority' as const
const targets = {
  successor_1: {
    predecessorKind: 'reconciliation' as const,
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
    predecessorKind: 'reconciliation' as const,
    reconciliationRef: {
      id: 'sam31-qualification-image-build-reconciliation-57ef0b4aa3a0b93d',
      version: 1 as const,
      contentHash:
        'sha256:4e0ebc7ae10a60e66d14950a9014fb8a1e814533c194c139a0cb1e6bfcb690ff' as const,
    },
    authorityId:
      'sam31-qualification-image-build-85b90c05fbbcb04a-successor-2',
  },
  successor_3: {
    predecessorKind: 'synchronous_provider_rejection' as const,
    predecessorSubmissionRef: {
      id: 'sam31-qualification-image-submission-eaa2828d9c91ceba4032',
      version: 1 as const,
      contentHash:
        'sha256:eaa2828d9c91ceba40320c93af6bb36e58a58a66ddec4b53dbe0690c81b5b8a5' as const,
    },
    providerResponseSha256:
      'b3b90a05fa03914ef99c170183e10033ba37ec854a1ab8009eea31dbd04c9803',
    providerErrorStatus: 'FAILED_PRECONDITION' as const,
    providerErrorReason: 'quota_or_capacity' as const,
    predecessorMachineType: 'E2_HIGHCPU_32' as const,
    successorMachineType: 'E2_STANDARD_2' as const,
    authorityId:
      'sam31-qualification-image-build-85b90c05fbbcb04a-successor-3',
  },
} as const

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUCCESSOR_AUTHORITY_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 successor authority confirmation is missing.')

const targetName =
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUCCESSOR_AUTHORITY_TARGET
if (
  targetName !== 'successor_1'
  && targetName !== 'successor_2'
  && targetName !== 'successor_3'
) {
  throw new Error('SAM 3.1 successor authority target is invalid.')
}
const target = targets[targetName]

let predecessorRef
if (target.predecessorKind === 'reconciliation') {
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
  predecessorRef = target.reconciliationRef
} else {
  const buildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime()
  const submission = await buildRuntime.repository.rereadSubmission({
    submissionRef: target.predecessorSubmissionRef,
  })
  if (
    !submission
    || submission.disposition !== 'rejected_before_creation'
    || submission.providerOutcome !== 'not_executed'
    || submission.providerHttpStatus !== 400
    || submission.cloudBuildOperationName !== null
    || submission.cloudBuildId !== null
    || submission.cloudBuildResource !== null
    || !submission.durableAuthorityConsumptionCreated
    || !submission.durableSubmissionObservationCreated
    || submission.imageBuildKnownStarted
    || submission.automaticRetryAllowed
  ) throw new Error('SAM 3.1 provider rejection is not successor-safe.')
  predecessorRef = target.predecessorSubmissionRef
}

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
  cloudBuildMachineType: target.predecessorKind ===
    'synchronous_provider_rejection'
    ? target.successorMachineType
    : undefined,
})

console.log(JSON.stringify({
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-successor-authority-publication-v1',
  predecessorRef,
  ...(target.predecessorKind === 'synchronous_provider_rejection'
    ? {
      providerResponseSha256: target.providerResponseSha256,
      providerErrorStatus: target.providerErrorStatus,
      providerErrorReason: target.providerErrorReason,
      predecessorMachineType: target.predecessorMachineType,
      successorMachineType: target.successorMachineType,
      modelOrCheckpointExecutionOccurred: false,
    }
    : {}),
  predecessorProviderExecutionKnownAbsent: true,
  automaticRetryOfPredecessor: false,
  distinctSuccessorAuthority: true,
  ...authority,
}, null, 2))
