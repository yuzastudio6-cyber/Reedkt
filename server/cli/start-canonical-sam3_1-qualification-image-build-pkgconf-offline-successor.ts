import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-pkgconf-offline-successor-build' as const
const EXPECTED_DOCKERFILE_SHA256 =
  '37414e55b778004e9f53ef51b1039f9c17d77d6c49753740fb81cb4a9da67fb0'
const EXPECTED_ENTRYPOINT_SHA256 =
  '4b39c5a97eab3ba124ccb9e2ee8ab3884c022744c43d15c9f89c88e94dd2a639'
const EXPECTED_RUNNER_SHA256 =
  'c1b6c9c262e59ea338043bdcde5d8ac23dbbebafc3d0a6dd7994d152e72cba50'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-70c8f5b159e1d0c6132c',
  version: 1 as const,
  contentHash:
    'sha256:70c8f5b159e1d0c6132cc9cf77586a576750384a1e355c5cdd073755739d2fed' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_PKGCONF_OFFLINE_BUILD_CONFIRMATION !==
      CONFIRMATION
) throw new Error('SAM 3.1 pkgconf-offline build confirmation is missing.')

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_PKGCONF_OFFLINE_AUTHORITY_SHA256,
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
  || predecessor.cloudBuildId !== 'e0fc4726-558a-4f63-bbbf-0e669836a646'
  || !predecessor.exactBuildConfigurationEchoVerified
  || !predecessor.exactStorageGenerationProvenanceVerified
  || predecessor.imageBuiltAndPushed
  || predecessor.runtimeReleaseGranted
  || predecessor.customerCreditMutationCreated
) throw new Error('SAM 3.1 pkgconf predecessor terminal changed.')

const authorityRef = {
  id: 'sam31-qualification-image-build-pkgconf-offline-successor-7',
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
) throw new Error('SAM 3.1 pkgconf-offline successor authority changed.')

const submission = await runtime.startOneQualificationImageBuild({
  authorityRef,
})
console.log(JSON.stringify({
  predecessorTerminalRef,
  failureClassification: 'pinned_cuda_builder_missing_pkg_config',
  correction:
    'pinned_official_pkgconf_source_built_inside_private_offline_closure',
  automaticRetryOfPredecessor: false,
  providerCreateResponseSummary,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
