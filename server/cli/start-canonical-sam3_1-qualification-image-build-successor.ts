import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'
const CONFIRMATION =
  'start-one-reconciled-sam31-qualification-image-successor-build' as const
const targets = {
  successor_3: {
    predecessorSubmissionRef: {
      id: 'sam31-qualification-image-submission-eaa2828d9c91ceba4032',
      version: 1 as const,
      contentHash:
        'sha256:eaa2828d9c91ceba40320c93af6bb36e58a58a66ddec4b53dbe0690c81b5b8a5' as const,
    },
    authorityRef: {
      id: 'sam31-qualification-image-build-85b90c05fbbcb04a-successor-3',
      version: 1 as const,
      contentHash:
        'sha256:f442445f74a400459857773030e22dc70ef4320c83a8c5f36cb01e521473ab17' as const,
    },
    providerResponseSha256:
      'b3b90a05fa03914ef99c170183e10033ba37ec854a1ab8009eea31dbd04c9803',
    predecessorMachineType: 'E2_HIGHCPU_32' as const,
    successorMachineType: 'E2_STANDARD_2' as const,
  },
} as const

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUCCESSOR_BUILD_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 successor build confirmation is missing.')

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUCCESSOR_BUILD_TARGET !==
    'successor_3'
) throw new Error('SAM 3.1 successor build target is invalid.')
const target = targets.successor_3

let providerCreateResponseSummary: unknown = null
const runtime = createCanonicalSam31GcpQualificationImageBuildRuntime({
  observeCreateResponse(summary) {
    providerCreateResponseSummary = summary
  },
})
const predecessorSubmission = await runtime.repository.rereadSubmission({
  submissionRef: target.predecessorSubmissionRef,
})
if (
  !predecessorSubmission
  || predecessorSubmission.disposition !== 'rejected_before_creation'
  || predecessorSubmission.providerOutcome !== 'not_executed'
  || predecessorSubmission.providerHttpStatus !== 400
  || predecessorSubmission.cloudBuildOperationName !== null
  || predecessorSubmission.cloudBuildId !== null
  || predecessorSubmission.imageBuildKnownStarted
  || !predecessorSubmission.durableAuthorityConsumptionCreated
  || !predecessorSubmission.durableSubmissionObservationCreated
  || predecessorSubmission.automaticRetryAllowed
) throw new Error('SAM 3.1 predecessor provider rejection changed.')
const successorAuthority = await runtime.repository
  .rereadQualificationImageBuildAuthority({
    authorityRef: target.authorityRef,
  })
if (
  !successorAuthority
  || successorAuthority.authorityId !== target.authorityRef.id
  || `sha256:${successorAuthority.authorityHash}` !==
    target.authorityRef.contentHash
  || successorAuthority.cloudBuildPolicy.machineType !==
    target.successorMachineType
) throw new Error('SAM 3.1 successor authority reread changed.')

const submission = await runtime.startOneQualificationImageBuild({
  authorityRef: target.authorityRef,
})
console.log(JSON.stringify({
  predecessorSubmissionRef: target.predecessorSubmissionRef,
  predecessorProviderResponseSha256: target.providerResponseSha256,
  predecessorMachineType: target.predecessorMachineType,
  successorMachineType: target.successorMachineType,
  distinctSuccessorAuthority: true,
  automaticRetryOfPredecessor: false,
  providerCreateResponseSummary,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
