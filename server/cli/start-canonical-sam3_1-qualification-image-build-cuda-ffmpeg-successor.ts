import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-cuda-ffmpeg-successor-build' as const
const EXPECTED_DOCKERFILE_SHA256 =
  '1ccf2b63bda6f33c127f233bc465623f2d3b675e4da22f01999f2aa0dff1cb45'
const EXPECTED_ENTRYPOINT_SHA256 =
  '4b39c5a97eab3ba124ccb9e2ee8ab3884c022744c43d15c9f89c88e94dd2a639'
const EXPECTED_RUNNER_SHA256 =
  'c1b6c9c262e59ea338043bdcde5d8ac23dbbebafc3d0a6dd7994d152e72cba50'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-bdd766f0bd5f704687c8',
  version: 1 as const,
  contentHash:
    'sha256:bdd766f0bd5f704687c87ab23d2e66da7e23c214a17a4c7931a0298fbf7fcefe' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_CUDA_FFMPEG_BUILD_CONFIRMATION !==
      CONFIRMATION
) throw new Error('SAM 3.1 CUDA/FFmpeg build confirmation is missing.')

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_CUDA_FFMPEG_AUTHORITY_SHA256,
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
) throw new Error('SAM 3.1 CUDA/FFmpeg predecessor terminal changed.')

const authorityRef = {
  id: 'sam31-qualification-image-build-cuda-ffmpeg-successor-5',
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
) throw new Error('SAM 3.1 CUDA/FFmpeg successor authority changed.')

const submission = await runtime.startOneQualificationImageBuild({
  authorityRef,
})
console.log(JSON.stringify({
  predecessorTerminalRef,
  failureClassification: 'torchcodec_ffmpeg_shared_library_closure_absent',
  correction:
    'pinned_lgpl_ffmpeg_nvdec_cuda_torchcodec_and_verified_no_cpu_fallback',
  automaticRetryOfPredecessor: false,
  providerCreateResponseSummary,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
