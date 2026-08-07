import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-vertex-a100-importlib-resources-successor-build' as const
const EXPECTED_DOCKERFILE_SHA256 =
  '11a27c7f5818fc19b82224b9ed253b3d90bcb1474d17e84aa16104240d0c6bef'
const EXPECTED_ENTRYPOINT_SHA256 =
  'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1'
const EXPECTED_RUNNER_SHA256 =
  '1732be5931a7b35265a3f04e36770e471d588f961097e9c08a60a61ce31e3856'
const EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256 =
  'f8d8d67f986a20aa7320f05134c03f5d8876f7e1e057af297226e9e277f8e186'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-a4081472fbdf531dbd61',
  version: 1 as const,
  contentHash:
    'sha256:a4081472fbdf531dbd61f00251ca0fd4fc8f1a689c970a1b2b43b915ed6d19cb' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_VERTEX_A100_IMPORTLIB_RESOURCES_BUILD_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 Vertex A100 importlib-resources build confirmation is missing.',
)

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_VERTEX_A100_IMPORTLIB_RESOURCES_AUTHORITY_SHA256,
)
let providerCreateResponseSummary: unknown = null
const imageBuildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime({
  observeCreateResponse(summary) {
    providerCreateResponseSummary = summary
  },
})
const predecessor = await imageBuildRuntime.repository.rereadTerminal({
  terminalRef: predecessorTerminalRef,
})
if (
  !predecessor
  || predecessor.disposition !== 'terminal_failure'
  || predecessor.cloudBuildStatus !== 'FAILURE'
  || predecessor.cloudBuildId !== '18ce3996-0f7e-4516-849a-a49ad68da0de'
  || predecessor.immutableImageDigest !== null
  || predecessor.imageBuiltAndPushed
  || predecessor.runtimeReleaseGranted
  || predecessor.gpuJobDispatched
  || predecessor.customerCreditMutationCreated
  || predecessor.productionReady
) throw new Error('SAM 3.1 failed image predecessor lineage changed.')

const authorityRef = {
  id:
    'sam31-qualification-image-build-vertex-a100-importlib-resources-successor-17',
  version: 1 as const,
  contentHash: `sha256:${authorityHash}` as const,
}
const authority = await imageBuildRuntime.repository
  .rereadQualificationImageBuildAuthority({ authorityRef })
if (
  !authority
  || authority.buildClosure.dockerfileSha256 !== EXPECTED_DOCKERFILE_SHA256
  || authority.buildClosure.entrypointSha256 !== EXPECTED_ENTRYPOINT_SHA256
  || authority.buildClosure.runnerSha256 !== EXPECTED_RUNNER_SHA256
  || authority.buildClosure.sourceProvenanceLockSha256 !==
    EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256
  || authority.cloudBuildPolicy.machineType !== 'E2_STANDARD_2'
) throw new Error('SAM 3.1 importlib-resources authority changed.')

const submission = await imageBuildRuntime.startOneQualificationImageBuild({
  authorityRef,
})
console.log(JSON.stringify({
  predecessorTerminalRef,
  failureClassification:
    'importlib_resources_transform_import_order_did_not_match_reviewed_patch_output',
  correction:
    'apply_reviewed_importlib_resources_patch_import_order_exactly_then_purge_setuptools_and_pkg_resources',
  automaticRetryOfPredecessor: false,
  providerCreateResponseSummary,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
