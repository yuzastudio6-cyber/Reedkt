import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-npp-offline-successor-build' as const
const EXPECTED_DOCKERFILE_SHA256 =
  'a2b810223ecd985bf183cda5b7b47f9c5963546134c28ab1b08dcc50705e01b9'
const EXPECTED_ENTRYPOINT_SHA256 =
  'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1'
const EXPECTED_RUNNER_SHA256 =
  'c1b6c9c262e59ea338043bdcde5d8ac23dbbebafc3d0a6dd7994d152e72cba50'
const EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256 =
  '67641cdcb33ac15bd2aad13076c61a35627385daa8afe2e61d2c04512436f547'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-c893bf6897e7a9eda6be',
  version: 1 as const,
  contentHash:
    'sha256:c893bf6897e7a9eda6be8155865980d768cc01684409430030be994d539d87d4' as const,
}

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_NPP_OFFLINE_BUILD_CONFIRMATION
    !== CONFIRMATION
) throw new Error('SAM 3.1 NPP-offline build confirmation is missing.')

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_NPP_OFFLINE_AUTHORITY_SHA256,
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
  || predecessor.cloudBuildId !== '81dc732c-8ad4-4351-8b11-f4474cc63025'
  || !predecessor.exactBuildConfigurationEchoVerified
  || !predecessor.exactStorageGenerationProvenanceVerified
  || predecessor.imageBuiltAndPushed
  || predecessor.runtimeReleaseGranted
  || predecessor.customerCreditMutationCreated
) throw new Error('SAM 3.1 NPP predecessor terminal changed.')

const authorityRef = {
  id: 'sam31-qualification-image-build-npp-offline-successor-8',
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
) throw new Error('SAM 3.1 NPP-offline successor authority changed.')

const submission = await runtime.startOneQualificationImageBuild({
  authorityRef,
})
console.log(JSON.stringify({
  predecessorTerminalRef,
  failureClassification: 'pinned_torchcodec_cuda_wheel_missing_npp_runtime',
  correction:
    'pinned_official_nvidia_npp_runtime_closure_for_torchcodec_cuda',
  automaticRetryOfPredecessor: false,
  providerCreateResponseSummary,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
