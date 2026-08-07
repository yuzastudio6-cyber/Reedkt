import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-cuda-torchvision-identity-successor-build' as const
const EXPECTED_DOCKERFILE_SHA256 =
  '431975dfe7527fa3951162d2055abcc1d354843a70519c1e29edee41eea68181'
const EXPECTED_ENTRYPOINT_SHA256 =
  'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1'
const EXPECTED_RUNNER_SHA256 =
  'c26c5a090028c6fd0603b8f280cd119048bfc799552c1979659525bcc6308747'
const EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256 =
  'c5548051769395807d1dd3baea15d425e8231900593c66c0231ef3599c980fe9'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-9d7ac7aec46776f3bc96',
  version: 1 as const,
  contentHash:
    'sha256:9d7ac7aec46776f3bc9640512a6b56284ad7c48c55d0705c5dd3c8e8e629c695' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_CUDA_TORCHVISION_IDENTITY_BUILD_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 CUDA TorchVision identity build confirmation is missing.',
)

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_CUDA_TORCHVISION_IDENTITY_AUTHORITY_SHA256,
)
let providerCreateResponseSummary: unknown = null
const runtime = createCanonicalSam31GcpQualificationImageBuildRuntime({
  observeCreateResponse(summary) {
    providerCreateResponseSummary = summary
  },
})
const predecessor = await runtime.repository.rereadTerminal({
  terminalRef: predecessorTerminalRef,
})
if (
  !predecessor
  || predecessor.disposition !== 'terminal_failure'
  || predecessor.cloudBuildStatus !== 'FAILURE'
  || predecessor.cloudBuildId !== '2ab7085c-99f6-4bba-9679-113469339b1c'
  || predecessor.authorityRef.id !==
    'sam31-qualification-image-build-pycocotools-offline-successor-10'
  || !predecessor.exactBuildConfigurationEchoVerified
  || !predecessor.exactStorageGenerationProvenanceVerified
  || predecessor.imageBuiltAndPushed
  || predecessor.runtimeReleaseGranted
  || predecessor.customerCreditMutationCreated
) throw new Error('SAM 3.1 CUDA TorchVision predecessor terminal changed.')

const authorityRef = {
  id:
    'sam31-qualification-image-build-cuda-torchvision-identity-successor-11',
  version: 1 as const,
  contentHash: `sha256:${authorityHash}` as const,
}
const authority = await runtime.repository
  .rereadQualificationImageBuildAuthority({ authorityRef })
if (
  !authority
  || authority.buildClosure.dockerfileSha256 !== EXPECTED_DOCKERFILE_SHA256
  || authority.buildClosure.entrypointSha256 !== EXPECTED_ENTRYPOINT_SHA256
  || authority.buildClosure.runnerSha256 !== EXPECTED_RUNNER_SHA256
  || authority.buildClosure.sourceProvenanceLockSha256 !==
    EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256
  || authority.cloudBuildPolicy.machineType !== 'E2_STANDARD_2'
) throw new Error(
  'SAM 3.1 CUDA TorchVision identity successor authority changed.',
)

const submission = await runtime.startOneQualificationImageBuild({
  authorityRef,
})
console.log(JSON.stringify({
  predecessorTerminalRef,
  failureClassification:
    'pinned_base_torchvision_cuda_local_version_identity_mismatch',
  correction:
    'exact_pinned_torchvision_0_25_0_cu128_identity_bound_across_build_runtime_and_release_contract',
  automaticRetryOfPredecessor: false,
  providerCreateResponseSummary,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
