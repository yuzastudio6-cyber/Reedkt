import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-native-library-closure-successor-build' as const
const EXPECTED_DOCKERFILE_SHA256 =
  '3c1a24bd271ea4b13be669815ec8ee8d84961cd97161da3959130f5646e2c55d'
const EXPECTED_ENTRYPOINT_SHA256 =
  'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1'
const EXPECTED_RUNNER_SHA256 =
  'c26c5a090028c6fd0603b8f280cd119048bfc799552c1979659525bcc6308747'
const EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256 =
  '4c03cd9708e59b6f384824ed12116e0c9ef97f05c4b60374c75abbbfed8c8408'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-4c3f5434cf4c561336ac',
  version: 1 as const,
  contentHash:
    'sha256:4c3f5434cf4c561336ac63b36c4e29a8ce7205e82b52dc8743dbdfee9db5a6f7' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_NATIVE_LIBRARY_CLOSURE_BUILD_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 native-library closure build confirmation is missing.',
)

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_NATIVE_LIBRARY_CLOSURE_AUTHORITY_SHA256,
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
  || predecessor.cloudBuildId !== 'f2bc80c5-ee55-4194-8fff-e4d03b79c691'
  || predecessor.authorityRef.id !==
    'sam31-qualification-image-build-cuda-torchvision-identity-successor-11'
  || !predecessor.exactBuildConfigurationEchoVerified
  || !predecessor.exactStorageGenerationProvenanceVerified
  || predecessor.imageBuiltAndPushed
  || predecessor.runtimeReleaseGranted
  || predecessor.customerCreditMutationCreated
) throw new Error('SAM 3.1 native-library predecessor terminal changed.')

const authorityRef = {
  id: 'sam31-qualification-image-build-native-library-closure-successor-12',
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
  'SAM 3.1 native-library closure successor authority changed.',
)

const submission = await runtime.startOneQualificationImageBuild({
  authorityRef,
})
console.log(JSON.stringify({
  predecessorTerminalRef,
  failureClassification:
    'torchcodec_native_dependency_closure_loader_path_unbound',
  correction:
    'pinned_torch_cuda_runtime_and_nvrtc_library_paths_bound_and_ldd_verified',
  automaticRetryOfPredecessor: false,
  providerCreateResponseSummary,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
