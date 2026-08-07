import { z } from 'zod'

import {
  publishCanonicalSam31QualificationImageBuildAuthority,
} from '../services/canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'publish-sam31-qualification-image-security-remediation-successor-authority' as const
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
const predecessorVulnerabilityScan = {
  scanRef: {
    id: 'sam31-artifact-analysis-scan-5405f777ff3c9542f429aa55',
    version: 1 as const,
    contentHash:
      'sha256:5405f777ff3c9542f429aa5597b7387c980fdca78558c105b2c5c0c5cac7701b' as const,
  },
  scanCompletedAt: '2026-08-07T17:38:33.519627Z',
  criticalCount: 0,
  highCount: 7,
  mediumCount: 150,
  lowCount: 41,
  unknownSeverityCount: 0,
  securityWaiverGranted: false as const,
  releaseBlocked: true as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SECURITY_REMEDIATION_SUCCESSOR_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 security-remediation successor confirmation is missing.',
)

const reproducibilityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env
    .WEEDITPRO_SAM31_SECURITY_REMEDIATION_REPRODUCIBILITY_SHA256,
)
const buildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const predecessor = await buildRuntime.repository.rereadTerminal({
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
  || !predecessor.exactBuildConfigurationEchoVerified
  || !predecessor.exactStorageGenerationProvenanceVerified
  || !predecessor.warningsAbsent
  || !predecessor.durableTerminalObservationCreated
  || !predecessor.imageBuiltAndPushed
  || predecessor.sbomReread
  || predecessor.imageScanPassed
  || predecessor.imageSignatureVerified
  || predecessor.provenanceVerified
  || predecessor.runtimeReleaseGranted
  || predecessor.gpuJobDispatched
  || predecessor.customerCreditMutationCreated
  || predecessor.productionReady
) throw new Error('SAM 3.1 security-remediation predecessor changed.')

if (
  predecessorVulnerabilityScan.criticalCount !== 0
  || predecessorVulnerabilityScan.highCount !== 7
  || predecessorVulnerabilityScan.unknownSeverityCount !== 0
  || predecessorVulnerabilityScan.securityWaiverGranted
  || !predecessorVulnerabilityScan.releaseBlocked
) throw new Error('SAM 3.1 predecessor vulnerability blocker changed.')

const publication = await publishCanonicalSam31QualificationImageBuildAuthority({
  manifestId: 'sam31-qualification-image-capsule-security-remediation-v1',
  authorityId:
    'sam31-qualification-image-build-security-remediation-successor-13',
  ingestReceiptRef: {
    id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
    version: 1,
    schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    contentHash:
      'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
  },
  reproducibilityReceiptRef: {
    id:
      'sam31-qualification-capsule-reproducibility-security-remediation-corrected-20260807',
    version: 1,
    contentHash: `sha256:${reproducibilityHash}`,
  },
  cloudBuildMachineType: 'E2_STANDARD_2',
})
const authority = await buildRuntime.repository
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
) throw new Error('SAM 3.1 security-remediation successor changed.')

console.log(JSON.stringify({
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-security-remediation-successor-publication-v1',
  predecessorTerminalRef,
  predecessorVulnerabilityScan,
  failureClassification:
    'predecessor_artifact_analysis_high_severity_vulnerabilities',
  correction:
    'exact_pinned_openssl_pillow_urllib3_and_unused_package_manager_remediation',
  automaticRetryOfPredecessor: false,
  distinctCorrectedSuccessorAuthority: true,
  ...publication,
}, null, 2))
