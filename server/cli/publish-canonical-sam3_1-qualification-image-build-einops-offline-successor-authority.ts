import { z } from 'zod'

import {
  publishCanonicalSam31QualificationImageBuildAuthority,
} from '../services/canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'publish-sam31-qualification-image-einops-offline-successor-authority' as const
const EXPECTED_DOCKERFILE_SHA256 =
  '3e60a54e67a41406e98f83a3e748b1e37f1cff07d46eaa488cd6a4619a09c01b'
const EXPECTED_ENTRYPOINT_SHA256 =
  'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1'
const EXPECTED_RUNNER_SHA256 =
  '40e6d06db83d1af629e99d618d29ea37fe8408987903e89aa0480f5fb4495187'
const EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256 =
  '8a7b4c591b5efbbc299f58b9db4abb44d6c0bc122ff9b7f309d83aecc948d47e'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-53a3659043b611b53acd',
  version: 1 as const,
  contentHash:
    'sha256:53a3659043b611b53acd1c047f933f8fa02066e7c62642a234111aac960a89bc' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_EINOPS_OFFLINE_SUCCESSOR_CONFIRMATION
      !== CONFIRMATION
) throw new Error('SAM 3.1 einops-offline successor confirmation is missing.')

const reproducibilityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_EINOPS_OFFLINE_REPRODUCIBILITY_SHA256,
)
const buildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const predecessor = await buildRuntime.repository.rereadTerminal({
  terminalRef: predecessorTerminalRef,
})
if (
  !predecessor
  || predecessor.disposition !== 'terminal_failure'
  || predecessor.cloudBuildStatus !== 'FAILURE'
  || predecessor.cloudBuildId !== '887a24eb-f117-4858-af58-50478624a8af'
  || predecessor.authorityRef.id !==
    'sam31-qualification-image-build-npp-offline-successor-8'
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
) throw new Error('SAM 3.1 einops predecessor terminal changed.')

const publication = await publishCanonicalSam31QualificationImageBuildAuthority({
  manifestId: 'sam31-qualification-image-capsule-einops-offline-v1',
  authorityId: 'sam31-qualification-image-build-einops-offline-successor-9',
  ingestReceiptRef: {
    id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
    version: 1,
    schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    contentHash:
      'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
  },
  reproducibilityReceiptRef: {
    id:
      'sam31-qualification-capsule-reproducibility-einops-offline-source-identity-corrected-20260807',
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
) throw new Error('SAM 3.1 einops-offline successor closure changed.')

console.log(JSON.stringify({
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-einops-offline-successor-publication-v1',
  predecessorTerminalRef,
  predecessorProviderExecutionKnownAbsent: false,
  predecessorImageBuildKnownStarted: true,
  predecessorImagePushKnownCompleted: false,
  predecessorCustomerCreditsMutated: false,
  failureClassification: 'official_sam_core_missing_pinned_einops_runtime',
  correction:
    'pinned_official_einops_wheel_and_scanned_ingest_receipt_offline_closure',
  automaticRetryOfPredecessor: false,
  distinctCorrectedSuccessorAuthority: true,
  ...publication,
}, null, 2))
