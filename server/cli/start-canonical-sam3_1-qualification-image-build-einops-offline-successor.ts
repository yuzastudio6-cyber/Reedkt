import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-einops-offline-successor-build' as const
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
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_EINOPS_OFFLINE_BUILD_CONFIRMATION !==
      CONFIRMATION
) throw new Error('SAM 3.1 einops-offline build confirmation is missing.')

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_EINOPS_OFFLINE_AUTHORITY_SHA256,
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
  || predecessor.cloudBuildId !== '887a24eb-f117-4858-af58-50478624a8af'
  || predecessor.authorityRef.id !==
    'sam31-qualification-image-build-npp-offline-successor-8'
  || !predecessor.exactBuildConfigurationEchoVerified
  || !predecessor.exactStorageGenerationProvenanceVerified
  || predecessor.imageBuiltAndPushed
  || predecessor.runtimeReleaseGranted
  || predecessor.customerCreditMutationCreated
) throw new Error('SAM 3.1 einops predecessor terminal changed.')

const authorityRef = {
  id: 'sam31-qualification-image-build-einops-offline-successor-9',
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
) throw new Error('SAM 3.1 einops-offline successor authority changed.')

const submission = await runtime.startOneQualificationImageBuild({
  authorityRef,
})
console.log(JSON.stringify({
  predecessorTerminalRef,
  failureClassification: 'official_sam_core_missing_pinned_einops_runtime',
  correction:
    'pinned_official_einops_wheel_and_scanned_ingest_receipt_offline_closure',
  automaticRetryOfPredecessor: false,
  providerCreateResponseSummary,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
