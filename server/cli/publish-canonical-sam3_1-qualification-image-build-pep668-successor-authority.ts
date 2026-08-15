import { z } from 'zod'

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
  'publish-sam31-qualification-image-pep668-successor-authority' as const
const EXPECTED_DOCKERFILE_SHA256 =
  'eb6f2b4a37e1a58a8d17abc456806b7fa5d6c70ff193062b9f5251493686d3a6'
const EXPECTED_ENTRYPOINT_SHA256 =
  'd18f9ed06ea16e84454e2ed8efcbc80003b10111ce7ad445d9f9fc39fe852d31'
const terminalRef = {
  id: 'sam31-qualification-image-build-terminal-9343139fa2895e27784ff151-1786084107699',
  version: 1 as const,
  contentHash:
    'sha256:df7346b1465f1c9b84b45b393420259997b3836d12a7ab9b25834060d38dc899' as const,
}

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_PEP668_SUCCESSOR_CONFIRMATION
    !== CONFIRMATION
) throw new Error('SAM 3.1 PEP 668 successor confirmation is missing.')

const reproducibilityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_PEP668_REPRODUCIBILITY_SHA256,
)
const observationRuntime =
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime()
const predecessor = await observationRuntime.rereadTerminal({ terminalRef })
if (
  !predecessor
  || predecessor.disposition !== 'terminal_failure'
  || predecessor.cloudBuildStatus !== 'FAILURE'
  || predecessor.cloudBuildId !== 'd1a9467b-0ec5-4021-a873-fddb4b44c8e8'
  || !predecessor.exactFixedBuildRequestEchoVerified
  || !predecessor.exactStorageGenerationProvenanceVerified
  || predecessor.imageBuiltAndPushed
  || predecessor.immutableImageDigest !== null
  || !predecessor.durableTerminalObservationCreated
  || predecessor.runtimeReleaseGranted
  || predecessor.gpuJobDispatched
  || predecessor.customerCreditsMutated
) throw new Error('SAM 3.1 failed predecessor terminal changed.')

const publication =
  await publishCanonicalSam31QualificationImageBuildAuthority({
    manifestId: 'sam31-qualification-image-capsule-pep668-isolated-v1',
    authorityId:
      'sam31-qualification-image-build-pep668-isolated-successor-4',
    ingestReceiptRef: {
      id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
      version: 1,
      schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
      contentHash:
        'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
    },
    reproducibilityReceiptRef: {
      id: 'sam31-qualification-capsule-reproducibility-pep668-isolated-20260807',
      version: 1,
      contentHash: `sha256:${reproducibilityHash}`,
    },
    cloudBuildMachineType: 'E2_STANDARD_2',
  })
const buildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const authority = await buildRuntime.repository
  .rereadQualificationImageBuildAuthority({
    authorityRef: publication.authorityRef,
  })
if (
  !authority
  || authority.buildClosure.dockerfileSha256 !== EXPECTED_DOCKERFILE_SHA256
  || authority.buildClosure.entrypointSha256 !== EXPECTED_ENTRYPOINT_SHA256
  || authority.cloudBuildPolicy.machineType !== 'E2_STANDARD_2'
  || authority.capsuleCoordinate.sha256 ===
    '85b90c05fbbcb04a2ab53f0fdd5350becb947ec18213ae3115af9aaab6200217'
) throw new Error('SAM 3.1 PEP 668 successor closure changed.')

console.log(JSON.stringify({
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-pep668-successor-publication-v1',
  predecessorTerminalRef: terminalRef,
  predecessorProviderExecutionKnownAbsent: false,
  predecessorImageBuildKnownStarted: true,
  predecessorImagePushKnownCompleted: false,
  predecessorCustomerCreditsMutated: false,
  failureClassification: 'pep668_externally_managed_environment',
  correction: 'isolated_immutable_python_venv',
  pep668BypassAllowed: false,
  automaticRetryOfPredecessor: false,
  distinctCorrectedSuccessorAuthority: true,
  ...publication,
}, null, 2))
