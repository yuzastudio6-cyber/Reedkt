import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'
import {
  createCanonicalSam31GcpQualificationImageSupplyChainBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-supply-chain-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-vertex-a100-security-final-successor-build' as const
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
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_VERTEX_A100_SECURITY_FINAL_BUILD_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 Vertex A100 security-final build confirmation is missing.',
)

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_VERTEX_A100_SECURITY_FINAL_AUTHORITY_SHA256,
)
let providerCreateResponseSummary: unknown = null
const imageBuildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime({
  observeCreateResponse(summary) {
    providerCreateResponseSummary = summary
  },
})
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
  || predecessor.cloudBuildId !== 'b816d96d-2c69-46fc-ab21-da6150124022'
  || predecessor.immutableImageDigest !==
    'sha256:dc1b9393daebe3cba51fca8bbd2fe0117d52a20d7617bf1fd3b270307ca83025'
  || predecessor.runtimeReleaseGranted
  || predecessor.gpuJobDispatched
  || predecessor.customerCreditMutationCreated
  || predecessor.productionReady
  || !predecessorSupplyChain
  || predecessorSupplyChain.observationHash !==
    'a75e53da8f2a6c7620c75cb3f434db6f305a4a3ebc60175a54bbb924ffbf5c79'
  || predecessorSupplyChain.cloudBuildId !==
    'a188c4d0-8d1c-4780-b316-837813726b50'
  || predecessorSupplyChain.imageSupplyChainReleaseGranted
  || predecessorSupplyChain.gpuQualificationJobDispatched
  || predecessorSupplyChain.customerCreditMutationCreated
  || predecessorSupplyChain.productionReady
) throw new Error('SAM 3.1 security-blocked predecessor lineage changed.')

const authorityRef = {
  id:
    'sam31-qualification-image-build-vertex-a100-security-final-successor-15',
  version: 1 as const,
  contentHash: `sha256:${authorityHash}` as const,
}
const authority = await imageBuildRuntime.repository
  .rereadQualificationImageBuildAuthority({ authorityRef })
if (
  !authority
  || authority.buildClosure.dockerfileSha256 !== EXPECTED_DOCKERFILE_SHA256
  || authority.buildClosure.entrypointSha256 !== EXPECTED_ENTRYPOINT_SHA256
  || authority.buildClosure.runnerSha256 !== EXPECTED_RUNNER_SHA256
  || authority.buildClosure.sourceProvenanceLockSha256 !==
    EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256
  || authority.cloudBuildPolicy.machineType !== 'E2_STANDARD_2'
) throw new Error('SAM 3.1 Vertex A100 security-final authority changed.')

const submission = await imageBuildRuntime.startOneQualificationImageBuild({
  authorityRef,
})
console.log(JSON.stringify({
  predecessorTerminalRef,
  predecessorSupplyChainSubmissionRef,
  failureClassification:
    'artifact_analysis_high_vulnerability_in_inherited_setuptools_vendor_wheel',
  triggeringVulnerabilityId: 'CVE-2026-24049',
  correction:
    'remove_inherited_setuptools_and_vendored_wheel_then_build_vertex_gcs_runner',
  vertexA100ExecutionContractRequired: true,
  automaticRetryOfPredecessor: false,
  providerCreateResponseSummary,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
