import { z } from 'zod'

import {
  publishCanonicalSam31QualificationImageBuildAuthority,
} from '../services/canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'publish-sam31-qualification-image-pkgconf-offline-successor-authority' as const
const EXPECTED_DOCKERFILE_SHA256 =
  '37414e55b778004e9f53ef51b1039f9c17d77d6c49753740fb81cb4a9da67fb0'
const EXPECTED_ENTRYPOINT_SHA256 =
  '4b39c5a97eab3ba124ccb9e2ee8ab3884c022744c43d15c9f89c88e94dd2a639'
const EXPECTED_RUNNER_SHA256 =
  'c1b6c9c262e59ea338043bdcde5d8ac23dbbebafc3d0a6dd7994d152e72cba50'
const EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256 =
  'fec35ab135e5e7ab05548870080f96b42d195aaefc206838db48270adfa9e092'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-70c8f5b159e1d0c6132c',
  version: 1 as const,
  contentHash:
    'sha256:70c8f5b159e1d0c6132cc9cf77586a576750384a1e355c5cdd073755739d2fed' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_PKGCONF_OFFLINE_SUCCESSOR_CONFIRMATION
      !== CONFIRMATION
) throw new Error('SAM 3.1 pkgconf-offline successor confirmation is missing.')

const reproducibilityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_PRIVATE_CLOSURE_REPRODUCIBILITY_SHA256,
)
const buildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const predecessor = await buildRuntime.repository.rereadTerminal({
  terminalRef: predecessorTerminalRef,
})
if (
  !predecessor
  || predecessor.disposition !== 'terminal_failure'
  || predecessor.cloudBuildStatus !== 'FAILURE'
  || predecessor.cloudBuildId !== 'e0fc4726-558a-4f63-bbbf-0e669836a646'
  || predecessor.authorityRef.id !==
    'sam31-qualification-image-build-docker-network-successor-6'
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
) throw new Error('SAM 3.1 pkgconf predecessor terminal changed.')

const publication = await publishCanonicalSam31QualificationImageBuildAuthority({
  manifestId: 'sam31-qualification-image-capsule-pkgconf-offline-v1',
  authorityId: 'sam31-qualification-image-build-pkgconf-offline-successor-7',
  ingestReceiptRef: {
    id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
    version: 1,
    schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    contentHash:
      'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
  },
  reproducibilityReceiptRef: {
    id:
      'sam31-qualification-capsule-reproducibility-private-closure-offline-20260807',
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
) throw new Error('SAM 3.1 pkgconf-offline successor closure changed.')

console.log(JSON.stringify({
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-pkgconf-offline-successor-publication-v1',
  predecessorTerminalRef,
  predecessorProviderExecutionKnownAbsent: false,
  predecessorImageBuildKnownStarted: true,
  predecessorImagePushKnownCompleted: false,
  predecessorCustomerCreditsMutated: false,
  failureClassification: 'pinned_cuda_builder_missing_pkg_config',
  correction:
    'pinned_official_pkgconf_source_built_inside_private_offline_closure',
  automaticRetryOfPredecessor: false,
  distinctCorrectedSuccessorAuthority: true,
  ...publication,
}, null, 2))
