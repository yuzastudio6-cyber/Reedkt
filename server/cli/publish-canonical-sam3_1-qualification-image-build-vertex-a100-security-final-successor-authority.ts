import { z } from 'zod'

import {
  publishCanonicalSam31QualificationImageBuildAuthority,
} from '../services/canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'
import {
  createCanonicalSam31GcpQualificationImageSupplyChainBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-supply-chain-build-runtime'

const CONFIRMATION =
  'publish-sam31-qualification-image-vertex-a100-security-final-successor-authority' as const
const EXPECTED_DOCKERFILE_SHA256 =
  '37cfffa593263d3f73702f59a3693d987bd5aef8c25ed3d07e0e40ca7acc36a3'
const EXPECTED_ENTRYPOINT_SHA256 =
  'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1'
const EXPECTED_RUNNER_SHA256 =
  '1732be5931a7b35265a3f04e36770e471d588f961097e9c08a60a61ce31e3856'
const EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256 =
  'c7b8b39acbb685bddc04ff4f30832a7ffd568a6b5954f973ca61d5e223ffbd3d'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-e1c8486bab46ebeda883',
  version: 1 as const,
  contentHash:
    'sha256:e1c8486bab46ebeda88382237905707c442869029d6963759bd657389ea726ee' as const,
}
const predecessorSupplyChainSubmissionRef = {
  id: 'sam31-qualification-supply-submission-f97e3538e47eced952f2',
  version: 1 as const,
  contentHash:
    'sha256:f97e3538e47eced952f2d22fbd81a06b0fa51b164ce9cadbb1ecd37b6cec87a6' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_VERTEX_A100_SECURITY_FINAL_SUCCESSOR_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 Vertex A100 security-final successor confirmation is missing.',
)

const reproducibilityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env
    .WEEDITPRO_SAM31_VERTEX_A100_SECURITY_FINAL_REPRODUCIBILITY_SHA256,
)
const imageBuildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const supplyChainRuntime =
  createCanonicalSam31GcpQualificationImageSupplyChainBuildRuntime()
const [predecessor, predecessorSupplyChain] = await Promise.all([
  imageBuildRuntime.repository.rereadTerminal({
    terminalRef: predecessorTerminalRef,
  }),
  supplyChainRuntime.repository.rereadTerminalForSubmission({
    submissionRef: predecessorSupplyChainSubmissionRef,
  }),
])
if (
  !predecessor
  || predecessor.disposition !==
    'qualification_image_built_pending_supply_chain_release'
  || predecessor.cloudBuildStatus !== 'SUCCESS'
  || predecessor.cloudBuildId !== 'b816d96d-2c69-46fc-ab21-da6150124022'
  || predecessor.authorityRef.id !==
    'sam31-qualification-image-build-security-remediation-pep668-successor-14'
  || predecessor.authorityRef.contentHash !==
    'sha256:9a03723a0505306ee26fda9e6d9dfa3c5d3d9952cd39693c6c9307118de35783'
  || predecessor.submissionRef.id !==
    'sam31-qualification-image-submission-712b78f704b136677b84'
  || predecessor.submissionRef.contentHash !==
    'sha256:712b78f704b136677b8465b0d5829a8e32c23e0f5f33e3edfbf2f5e47e4ce2fe'
  || predecessor.immutableImageDigest !==
    'sha256:dc1b9393daebe3cba51fca8bbd2fe0117d52a20d7617bf1fd3b270307ca83025'
  || !predecessor.imageBuiltAndPushed
  || predecessor.imageScanPassed
  || predecessor.imageSignatureVerified
  || predecessor.provenanceVerified
  || predecessor.runtimeReleaseGranted
  || predecessor.gpuJobDispatched
  || predecessor.customerCreditMutationCreated
  || predecessor.productionReady
) throw new Error('SAM 3.1 security-blocked image predecessor changed.')
if (
  !predecessorSupplyChain
  || predecessorSupplyChain.observationHash !==
    'a75e53da8f2a6c7620c75cb3f434db6f305a4a3ebc60175a54bbb924ffbf5c79'
  || predecessorSupplyChain.cloudBuildId !==
    'a188c4d0-8d1c-4780-b316-837813726b50'
  || predecessorSupplyChain.cloudBuildStatus !== 'SUCCESS'
  || predecessorSupplyChain.immutableImageDigest !==
    predecessor.immutableImageDigest
  || !predecessorSupplyChain.allPinnedBuildStepsCompleted
  || !predecessorSupplyChain.sbomBuildArtifactCreated
  || !predecessorSupplyChain.digestSignatureCreatedAndVerified
  || predecessorSupplyChain.imageSupplyChainReleaseGranted
  || predecessorSupplyChain.gpuQualificationJobDispatched
  || predecessorSupplyChain.customerCreditMutationCreated
  || predecessorSupplyChain.productionReady
) throw new Error('SAM 3.1 blocked supply-chain predecessor changed.')

const publication = await publishCanonicalSam31QualificationImageBuildAuthority({
  manifestId:
    'sam31-qualification-image-capsule-vertex-a100-security-final-v1',
  authorityId:
    'sam31-qualification-image-build-vertex-a100-security-final-successor-15',
  ingestReceiptRef: {
    id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
    version: 1,
    schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    contentHash:
      'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
  },
  reproducibilityReceiptRef: {
    id:
      'sam31-qualification-capsule-reproducibility-vertex-a100-setuptools-vendor-removed-20260807',
    version: 1,
    contentHash: `sha256:${reproducibilityHash}`,
  },
  cloudBuildMachineType: 'E2_STANDARD_2',
})
const authority = await imageBuildRuntime.repository
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
) throw new Error('SAM 3.1 Vertex A100 security-final authority changed.')

console.log(JSON.stringify({
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-vertex-a100-security-final-successor-publication-v1',
  predecessorTerminalRef,
  predecessorSupplyChainSubmissionRef,
  failureClassification:
    'artifact_analysis_high_vulnerability_in_inherited_setuptools_vendor_wheel',
  triggeringVulnerabilityId: 'CVE-2026-24049',
  triggeringSeverity: 'HIGH',
  triggeringOccurrenceCount: 1,
  correction:
    'remove_inherited_setuptools_and_vendored_wheel_then_build_vertex_gcs_runner',
  vertexA100ExecutionContractRequired: true,
  automaticRetryOfPredecessor: false,
  previousImageSupplyChainReleaseGranted: false,
  ...publication,
}, null, 2))
