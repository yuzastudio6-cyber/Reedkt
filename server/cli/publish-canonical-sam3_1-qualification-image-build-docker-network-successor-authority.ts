import { z } from 'zod'

import {
  publishCanonicalSam31QualificationImageBuildAuthority,
} from '../services/canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'publish-sam31-qualification-image-docker-network-successor-authority' as const
const EXPECTED_DOCKERFILE_SHA256 =
  'e7c92f517834d5f8b35b6579418fee637269fbc3168023bd9941a26ebb7858bb'
const EXPECTED_ENTRYPOINT_SHA256 =
  '4b39c5a97eab3ba124ccb9e2ee8ab3884c022744c43d15c9f89c88e94dd2a639'
const EXPECTED_RUNNER_SHA256 =
  'c1b6c9c262e59ea338043bdcde5d8ac23dbbebafc3d0a6dd7994d152e72cba50'
const EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256 =
  'fec35ab135e5e7ab05548870080f96b42d195aaefc206838db48270adfa9e092'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-a58415ac30a996876a2fa',
  version: 1 as const,
  contentHash:
    'sha256:a58415ac30a996876a2fa75a6e05232ab0a315391c3dc562c2331b931a04c200' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_DOCKER_NETWORK_SUCCESSOR_CONFIRMATION !==
      CONFIRMATION
) throw new Error('SAM 3.1 Docker-network successor confirmation is missing.')

const reproducibilityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_DOCKER_NETWORK_REPRODUCIBILITY_SHA256,
)
const buildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const predecessor = await buildRuntime.repository.rereadTerminal({
  terminalRef: predecessorTerminalRef,
})
if (
  !predecessor
  || predecessor.disposition !== 'terminal_failure'
  || predecessor.cloudBuildStatus !== 'FAILURE'
  || predecessor.cloudBuildId !== '96b3a613-b4b6-492c-8b15-acddb4af12b6'
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
) throw new Error('SAM 3.1 Docker-network predecessor terminal changed.')

const publication = await publishCanonicalSam31QualificationImageBuildAuthority({
  manifestId:
    'sam31-qualification-image-capsule-docker-network-compatible-v1',
  authorityId:
    'sam31-qualification-image-build-docker-network-successor-6',
  ingestReceiptRef: {
    id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
    version: 1,
    schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    contentHash:
      'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
  },
  reproducibilityReceiptRef: {
    id:
      'sam31-qualification-capsule-reproducibility-docker-network-compatible-20260807',
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
) throw new Error('SAM 3.1 Docker-network successor closure changed.')

console.log(JSON.stringify({
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-docker-network-successor-publication-v1',
  predecessorTerminalRef,
  predecessorProviderExecutionKnownAbsent: false,
  predecessorImageBuildKnownStarted: true,
  predecessorImagePushKnownCompleted: false,
  predecessorCustomerCreditsMutated: false,
  failureClassification:
    'cloud_build_legacy_builder_rejected_buildkit_run_network_flag',
  correction:
    'canonical_build_network_none_only_and_no_inline_buildkit_run_flags',
  automaticRetryOfPredecessor: false,
  distinctCorrectedSuccessorAuthority: true,
  ...publication,
}, null, 2))
