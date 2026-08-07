import { z } from 'zod'

import {
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-reconciliation-runtime'
import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-pep668-successor-build' as const
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
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_PEP668_BUILD_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 PEP 668 build confirmation is missing.')

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_PEP668_AUTHORITY_SHA256,
)
const observationRuntime =
  createCanonicalSam31GcpQualificationImageBuildReconciliationRuntime()
const predecessor = await observationRuntime.rereadTerminal({ terminalRef })
if (
  !predecessor
  || predecessor.disposition !== 'terminal_failure'
  || predecessor.imageBuiltAndPushed
  || predecessor.runtimeReleaseGranted
  || predecessor.customerCreditsMutated
) throw new Error('SAM 3.1 failed predecessor terminal changed.')

let providerCreateResponseSummary: unknown = null
const buildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime({
  observeCreateResponse(summary) {
    providerCreateResponseSummary = summary
  },
})
const authorityRef = {
  id: 'sam31-qualification-image-build-pep668-isolated-successor-4',
  version: 1 as const,
  contentHash: `sha256:${authorityHash}` as const,
}
const authority = await buildRuntime.repository
  .rereadQualificationImageBuildAuthority({ authorityRef })
if (
  !authority
  || authority.buildClosure.dockerfileSha256 !== EXPECTED_DOCKERFILE_SHA256
  || authority.buildClosure.entrypointSha256 !== EXPECTED_ENTRYPOINT_SHA256
  || authority.cloudBuildPolicy.machineType !== 'E2_STANDARD_2'
  || authority.capsuleCoordinate.sha256 ===
    '85b90c05fbbcb04a2ab53f0fdd5350becb947ec18213ae3115af9aaab6200217'
) throw new Error('SAM 3.1 corrected successor authority changed.')

const submission = await buildRuntime.startOneQualificationImageBuild({
  authorityRef,
})
console.log(JSON.stringify({
  predecessorTerminalRef: terminalRef,
  failureClassification: 'pep668_externally_managed_environment',
  correction: 'isolated_immutable_python_venv',
  pep668BypassAllowed: false,
  automaticRetryOfPredecessor: false,
  providerCreateResponseSummary,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
