import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-docker-network-successor-build' as const
const EXPECTED_DOCKERFILE_SHA256 =
  'e7c92f517834d5f8b35b6579418fee637269fbc3168023bd9941a26ebb7858bb'
const EXPECTED_ENTRYPOINT_SHA256 =
  '4b39c5a97eab3ba124ccb9e2ee8ab3884c022744c43d15c9f89c88e94dd2a639'
const EXPECTED_RUNNER_SHA256 =
  'c1b6c9c262e59ea338043bdcde5d8ac23dbbebafc3d0a6dd7994d152e72cba50'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-a58415ac30a996876a2fa',
  version: 1 as const,
  contentHash:
    'sha256:a58415ac30a996876a2fa75a6e05232ab0a315391c3dc562c2331b931a04c200' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_DOCKER_NETWORK_BUILD_CONFIRMATION !==
      CONFIRMATION
) throw new Error('SAM 3.1 Docker-network build confirmation is missing.')

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_DOCKER_NETWORK_AUTHORITY_SHA256,
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
  || !predecessor.exactBuildConfigurationEchoVerified
  || !predecessor.exactStorageGenerationProvenanceVerified
  || predecessor.imageBuiltAndPushed
  || predecessor.runtimeReleaseGranted
  || predecessor.customerCreditMutationCreated
) throw new Error('SAM 3.1 Docker-network predecessor terminal changed.')

const authorityRef = {
  id: 'sam31-qualification-image-build-docker-network-successor-6',
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
  || authority.cloudBuildPolicy.machineType !== 'E2_STANDARD_2'
) throw new Error('SAM 3.1 Docker-network successor authority changed.')

const submission = await runtime.startOneQualificationImageBuild({
  authorityRef,
})
console.log(JSON.stringify({
  predecessorTerminalRef,
  failureClassification:
    'cloud_build_legacy_builder_rejected_buildkit_run_network_flag',
  correction:
    'canonical_build_network_none_only_and_no_inline_buildkit_run_flags',
  automaticRetryOfPredecessor: false,
  providerCreateResponseSummary,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
