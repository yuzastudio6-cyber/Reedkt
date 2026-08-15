import { z } from 'zod'

import {
  publishCanonicalSam31QualificationImageBuildAuthority,
} from '../services/canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'publish-sam31-qualification-image-native-library-closure-successor-authority' as const
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
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_NATIVE_LIBRARY_CLOSURE_SUCCESSOR_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 native-library closure successor confirmation is missing.',
)

const reproducibilityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env
    .WEEDITPRO_SAM31_NATIVE_LIBRARY_CLOSURE_REPRODUCIBILITY_SHA256,
)
const buildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const predecessor = await buildRuntime.repository.rereadTerminal({
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
  || !predecessor.warningsAbsent
  || !predecessor.durableTerminalObservationCreated
  || predecessor.imageBuiltAndPushed
  || predecessor.immutableImageDigest !== null
  || predecessor.runtimeReleaseGranted
  || predecessor.gpuJobDispatched
  || predecessor.customerCreditMutationCreated
  || predecessor.productionReady
) throw new Error('SAM 3.1 native-library predecessor terminal changed.')

const publication = await publishCanonicalSam31QualificationImageBuildAuthority({
  manifestId: 'sam31-qualification-image-capsule-native-library-closure-v1',
  authorityId:
    'sam31-qualification-image-build-native-library-closure-successor-12',
  ingestReceiptRef: {
    id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
    version: 1,
    schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    contentHash:
      'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
  },
  reproducibilityReceiptRef: {
    id:
      'sam31-qualification-capsule-reproducibility-native-library-closure-corrected-20260807',
    version: 1,
    contentHash: `sha256:${reproducibilityHash}`,
  },
  cloudBuildMachineType: 'E2_STANDARD_2',
})
const authority = await buildRuntime.repository
  .rereadQualificationImageBuildAuthority({
    authorityRef: publication.authorityRef,
  })
if (
  !authority
  || authority.buildClosure.dockerfileSha256 !== EXPECTED_DOCKERFILE_SHA256
  || authority.buildClosure.entrypointSha256 !== EXPECTED_ENTRYPOINT_SHA256
  || authority.buildClosure.runnerSha256 !== EXPECTED_RUNNER_SHA256
  || authority.buildClosure.sourceProvenanceLockSha256 !==
    EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256
  || authority.cloudBuildPolicy.machineType !== 'E2_STANDARD_2'
) throw new Error(
  'SAM 3.1 native-library closure successor changed.',
)

console.log(JSON.stringify({
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-native-library-closure-successor-publication-v1',
  predecessorTerminalRef,
  predecessorProviderExecutionKnownAbsent: true,
  predecessorImageBuildKnownStarted: true,
  predecessorImagePushKnownCompleted: false,
  predecessorCustomerCreditsMutated: false,
  failureClassification:
    'torchcodec_native_dependency_closure_loader_path_unbound',
  correction:
    'pinned_torch_cuda_runtime_and_nvrtc_library_paths_bound_and_ldd_verified',
  automaticRetryOfPredecessor: false,
  distinctCorrectedSuccessorAuthority: true,
  ...publication,
}, null, 2))
