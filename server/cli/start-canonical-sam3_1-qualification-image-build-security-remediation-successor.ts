import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-security-remediation-successor-build' as const
const EXPECTED_DOCKERFILE_SHA256 =
  '5aa4c8914c1a9989a5764e7d5cf133ba4c32db0f1646d97b92701e974a009178'
const EXPECTED_ENTRYPOINT_SHA256 =
  'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1'
const EXPECTED_RUNNER_SHA256 =
  'c26c5a090028c6fd0603b8f280cd119048bfc799552c1979659525bcc6308747'
const EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256 =
  'c7b8b39acbb685bddc04ff4f30832a7ffd568a6b5954f973ca61d5e223ffbd3d'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-fd08655aa05d2b79ba6b',
  version: 1 as const,
  contentHash:
    'sha256:fd08655aa05d2b79ba6b43595d0f95b79ed3b0ac54d31167c997a9e8eafe1b78' as const,
}
const predecessorVulnerabilityScanRef = {
  id: 'sam31-artifact-analysis-scan-5405f777ff3c9542f429aa55',
  version: 1 as const,
  contentHash:
    'sha256:5405f777ff3c9542f429aa5597b7387c980fdca78558c105b2c5c0c5cac7701b' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SECURITY_REMEDIATION_BUILD_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 security-remediation build confirmation is missing.',
)

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SECURITY_REMEDIATION_AUTHORITY_SHA256,
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
  || predecessor.disposition !==
    'qualification_image_built_pending_supply_chain_release'
  || predecessor.cloudBuildStatus !== 'SUCCESS'
  || predecessor.cloudBuildId !== '15e59e99-132c-482e-a6af-4ff5f27c1e76'
  || predecessor.authorityRef.id !==
    'sam31-qualification-image-build-native-library-closure-successor-12'
  || predecessor.authorityRef.contentHash !==
    'sha256:ddaf008a6a3a125b58d299d2b081cc97bea1ee06086fccaf49095ece32775c0c'
  || predecessor.immutableImageDigest !==
    'sha256:6855921e10554e60ac197d6ae60e1f68d7e94d0470d1e34add38f94a881f11f3'
  || !predecessor.imageBuiltAndPushed
  || predecessor.runtimeReleaseGranted
  || predecessor.gpuJobDispatched
  || predecessor.customerCreditMutationCreated
  || predecessor.productionReady
) throw new Error('SAM 3.1 security-remediation predecessor changed.')

const authorityRef = {
  id: 'sam31-qualification-image-build-security-remediation-successor-13',
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
) throw new Error(
  'SAM 3.1 security-remediation successor authority changed.',
)

const submission = await runtime.startOneQualificationImageBuild({
  authorityRef,
})
console.log(JSON.stringify({
  predecessorTerminalRef,
  predecessorVulnerabilityScanRef,
  predecessorCriticalCount: 0,
  predecessorHighCount: 7,
  predecessorUnknownSeverityCount: 0,
  predecessorSecurityWaiverGranted: false,
  failureClassification:
    'predecessor_artifact_analysis_high_severity_vulnerabilities',
  correction:
    'exact_pinned_openssl_pillow_urllib3_and_unused_package_manager_remediation',
  automaticRetryOfPredecessor: false,
  providerCreateResponseSummary,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
