import { z } from 'zod'

import {
  publishCanonicalSam31QualificationImageBuildAuthority,
} from '../services/canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'publish-sam31-qualification-image-security-remediation-pep668-successor-authority' as const
const EXPECTED_DOCKERFILE_SHA256 =
  '34e2d4993b315185b169373c12ee70ddf31dbb702ba97be5734fae8de5786481'
const EXPECTED_ENTRYPOINT_SHA256 =
  'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1'
const EXPECTED_RUNNER_SHA256 =
  'c26c5a090028c6fd0603b8f280cd119048bfc799552c1979659525bcc6308747'
const EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256 =
  'c7b8b39acbb685bddc04ff4f30832a7ffd568a6b5954f973ca61d5e223ffbd3d'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-3849ccac361ed9a02315',
  version: 1 as const,
  contentHash:
    'sha256:3849ccac361ed9a02315568dfebc0c9912b1fa63f54bccc004b6d3bb7ded38d2' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SECURITY_REMEDIATION_PEP668_SUCCESSOR_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 security-remediation PEP 668 successor confirmation is missing.',
)

const reproducibilityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env
    .WEEDITPRO_SAM31_SECURITY_REMEDIATION_PEP668_REPRODUCIBILITY_SHA256,
)
const buildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const predecessor = await buildRuntime.repository.rereadTerminal({
  terminalRef: predecessorTerminalRef,
})
if (
  !predecessor
  || predecessor.disposition !== 'terminal_failure'
  || predecessor.cloudBuildStatus !== 'FAILURE'
  || predecessor.cloudBuildId !== 'bb921ca6-b317-42d2-b4db-f26816ddbfed'
  || predecessor.authorityRef.id !==
    'sam31-qualification-image-build-security-remediation-successor-13'
  || predecessor.authorityRef.contentHash !==
    'sha256:aa4c3787f4557afd7cdbdb03c2005887e02775b9fb8d31b9574c53e79e12391e'
  || predecessor.submissionRef.id !==
    'sam31-qualification-image-submission-b8719757469d29e81a56'
  || predecessor.submissionRef.contentHash !==
    'sha256:b8719757469d29e81a562fe91d8bfab50314cc6e38dccf2fee8f049c0c39e6d2'
  || predecessor.immutableImageDigest !== null
  || predecessor.immutableImageUri !== null
  || predecessor.artifactRegistryPackage !== null
  || !predecessor.exactBuildConfigurationEchoVerified
  || !predecessor.exactStorageGenerationProvenanceVerified
  || !predecessor.warningsAbsent
  || !predecessor.durableTerminalObservationCreated
  || predecessor.imageBuiltAndPushed
  || predecessor.sbomReread
  || predecessor.imageScanPassed
  || predecessor.imageSignatureVerified
  || predecessor.provenanceVerified
  || predecessor.runtimeReleaseGranted
  || predecessor.gpuJobDispatched
  || predecessor.customerCreditMutationCreated
  || predecessor.productionReady
) throw new Error('SAM 3.1 failed security-remediation predecessor changed.')

const publication = await publishCanonicalSam31QualificationImageBuildAuthority({
  manifestId:
    'sam31-qualification-image-capsule-security-remediation-pep668-v1',
  authorityId:
    'sam31-qualification-image-build-security-remediation-pep668-successor-14',
  ingestReceiptRef: {
    id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
    version: 1,
    schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    contentHash:
      'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
  },
  reproducibilityReceiptRef: {
    id:
      'sam31-qualification-capsule-reproducibility-security-remediation-pep668-uninstall-corrected-20260807',
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
) throw new Error('SAM 3.1 PEP 668 cleanup successor changed.')

console.log(JSON.stringify({
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-security-remediation-pep668-successor-publication-v1',
  predecessorTerminalRef,
  failureClassification:
    'pep668_guard_blocked_inherited_distribution_cleanup',
  correction:
    'explicit_pep668_system_uninstall_permission_without_system_install',
  pep668SystemInstallAllowed: false,
  pep668SystemUninstallForPinnedCleanupOnly: true,
  automaticRetryOfPredecessor: false,
  distinctCorrectedSuccessorAuthority: true,
  ...publication,
}, null, 2))
