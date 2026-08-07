import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-pycocotools-offline-successor-build' as const
const EXPECTED_DOCKERFILE_SHA256 =
  'f13ab324160d0ebbccd933d26b7901c2ec3feacfa441fb3063a6167553d8f887'
const EXPECTED_ENTRYPOINT_SHA256 =
  'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1'
const EXPECTED_RUNNER_SHA256 =
  '3286733a4e18866f302d615e36a110c0431cb2cda2092e530dd5dc61c9f00604'
const EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256 =
  'f1849332844ab8e0508191c12777ed360790ab569f0a3c807a9c08a427b9e5fd'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-1d78de9253e7bf99b182',
  version: 1 as const,
  contentHash:
    'sha256:1d78de9253e7bf99b18264c1d2bc8436c8f0bf71f68bede8619f9a4e8368fb32' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_PYCOCOTOOLS_OFFLINE_BUILD_CONFIRMATION
      !== CONFIRMATION
) throw new Error('SAM 3.1 pycocotools-offline build confirmation is missing.')

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_PYCOCOTOOLS_OFFLINE_AUTHORITY_SHA256,
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
  || predecessor.cloudBuildId !== 'f36cea98-4b2b-458c-ac2e-a27c3c72f2ca'
  || predecessor.authorityRef.id !==
    'sam31-qualification-image-build-einops-offline-successor-9'
  || !predecessor.exactBuildConfigurationEchoVerified
  || !predecessor.exactStorageGenerationProvenanceVerified
  || predecessor.imageBuiltAndPushed
  || predecessor.runtimeReleaseGranted
  || predecessor.customerCreditMutationCreated
) throw new Error('SAM 3.1 pycocotools predecessor terminal changed.')

const authorityRef = {
  id: 'sam31-qualification-image-build-pycocotools-offline-successor-10',
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
) throw new Error('SAM 3.1 pycocotools-offline successor authority changed.')

const submission = await runtime.startOneQualificationImageBuild({
  authorityRef,
})
console.log(JSON.stringify({
  predecessorTerminalRef,
  failureClassification:
    'official_sam_core_missing_pinned_pycocotools_runtime',
  correction:
    'pinned_official_pycocotools_wheel_and_scanned_ingest_receipt_offline_closure',
  automaticRetryOfPredecessor: false,
  providerCreateResponseSummary,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
