import { z } from 'zod'

import {
  publishCanonicalSam31QualificationImageBuildAuthority,
} from '../services/canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'publish-sam31-qualification-image-pycocotools-offline-successor-authority' as const
const EXPECTED_DOCKERFILE_SHA256 =
  'f13ab324160d0ebbccd933d26b7901c2ec3feacfa441fb3063a6167553d8f887'
const EXPECTED_ENTRYPOINT_SHA256 =
  'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1'
const EXPECTED_RUNNER_SHA256 =
  '3286733a4e18866f302d615e36a110c0431cb2cda2092e530dd5dc61c9f00604'
const EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256 =
  'f1849332844ab8e0508191c12777ed360790ab569f0a3c807a9c08a427b9e5fd'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-1d78de9253e7bf99b182',
  version: 1 as const,
  contentHash:
    'sha256:1d78de9253e7bf99b18264c1d2bc8436c8f0bf71f68bede8619f9a4e8368fb32' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_PYCOCOTOOLS_OFFLINE_SUCCESSOR_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 pycocotools-offline successor confirmation is missing.',
)

const reproducibilityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_PYCOCOTOOLS_OFFLINE_REPRODUCIBILITY_SHA256,
)
const buildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const predecessor = await buildRuntime.repository.rereadTerminal({
  terminalRef: predecessorTerminalRef,
})
if (
  !predecessor
  || predecessor.disposition !== 'terminal_failure'
  || predecessor.cloudBuildStatus !== 'FAILURE'
  || predecessor.cloudBuildId !== 'f36cea98-4b2b-458c-ac2e-a27c3c72f2ca'
  || predecessor.authorityRef.id !==
    'sam31-qualification-image-build-einops-offline-successor-9'
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
) throw new Error('SAM 3.1 pycocotools predecessor terminal changed.')

const publication = await publishCanonicalSam31QualificationImageBuildAuthority({
  manifestId: 'sam31-qualification-image-capsule-pycocotools-offline-v1',
  authorityId:
    'sam31-qualification-image-build-pycocotools-offline-successor-10',
  ingestReceiptRef: {
    id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
    version: 1,
    schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    contentHash:
      'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
  },
  reproducibilityReceiptRef: {
    id:
      'sam31-qualification-capsule-reproducibility-pycocotools-offline-source-identity-corrected-20260807',
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
) throw new Error('SAM 3.1 pycocotools-offline successor closure changed.')

console.log(JSON.stringify({
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-pycocotools-offline-successor-publication-v1',
  predecessorTerminalRef,
  predecessorProviderExecutionKnownAbsent: false,
  predecessorImageBuildKnownStarted: true,
  predecessorImagePushKnownCompleted: false,
  predecessorCustomerCreditsMutated: false,
  failureClassification:
    'official_sam_core_missing_pinned_pycocotools_runtime',
  correction:
    'pinned_official_pycocotools_wheel_and_scanned_ingest_receipt_offline_closure',
  automaticRetryOfPredecessor: false,
  distinctCorrectedSuccessorAuthority: true,
  ...publication,
}, null, 2))
