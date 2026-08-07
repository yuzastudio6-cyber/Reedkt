import { z } from 'zod'

import {
  publishCanonicalSam31QualificationImageBuildAuthority,
} from '../services/canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'publish-sam31-qualification-image-vertex-a100-importlib-resources-successor-authority' as const
const EXPECTED_DOCKERFILE_SHA256 =
  '11a27c7f5818fc19b82224b9ed253b3d90bcb1474d17e84aa16104240d0c6bef'
const EXPECTED_ENTRYPOINT_SHA256 =
  'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1'
const EXPECTED_RUNNER_SHA256 =
  '1732be5931a7b35265a3f04e36770e471d588f961097e9c08a60a61ce31e3856'
const EXPECTED_SOURCE_PROVENANCE_LOCK_SHA256 =
  'f8d8d67f986a20aa7320f05134c03f5d8876f7e1e057af297226e9e277f8e186'
const EXPECTED_IMPORTLIB_RESOURCES_PATCH_SHA256 =
  '6ce1e6954069aff28498284f4cd140cd9530a3f236d04bc507c799fe8ea3521f'
const predecessorTerminalRef = {
  id: 'sam31-qualification-image-terminal-a4081472fbdf531dbd61',
  version: 1 as const,
  contentHash:
    'sha256:a4081472fbdf531dbd61f00251ca0fd4fc8f1a689c970a1b2b43b915ed6d19cb' as const,
}

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_VERTEX_A100_IMPORTLIB_RESOURCES_SUCCESSOR_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 Vertex A100 importlib-resources successor confirmation is missing.',
)

const reproducibilityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env
    .WEEDITPRO_SAM31_VERTEX_A100_IMPORTLIB_RESOURCES_REPRODUCIBILITY_SHA256,
)
const imageBuildRuntime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const predecessor = await imageBuildRuntime.repository.rereadTerminal({
  terminalRef: predecessorTerminalRef,
})
if (
  !predecessor
  || predecessor.disposition !== 'terminal_failure'
  || predecessor.cloudBuildStatus !== 'FAILURE'
  || predecessor.cloudBuildId !== '18ce3996-0f7e-4516-849a-a49ad68da0de'
  || predecessor.authorityRef.id !==
    'sam31-qualification-image-build-vertex-a100-importlib-resources-successor-16'
  || predecessor.authorityRef.contentHash !==
    'sha256:3af03df3bac0cb499017cb4e33d0673d3b0e05debfaee0f56bf5e090847c5375'
  || predecessor.submissionRef.id !==
    'sam31-qualification-image-submission-171a1c87868b18d2d637'
  || predecessor.submissionRef.contentHash !==
    'sha256:171a1c87868b18d2d6373334c9131f0f93b35bf6c5caff08c658dc45858ec74d'
  || predecessor.immutableImageDigest !== null
  || predecessor.immutableImageUri !== null
  || predecessor.imageBuiltAndPushed
  || predecessor.sourceCheckpointQualificationGranted
  || predecessor.runtimeReleaseGranted
  || predecessor.gpuJobDispatched
  || predecessor.customerCreditMutationCreated
  || predecessor.productionReady
) throw new Error('SAM 3.1 failed image predecessor changed.')

const publication = await publishCanonicalSam31QualificationImageBuildAuthority({
  manifestId:
    'sam31-qualification-image-capsule-vertex-a100-importlib-resources-import-order-corrected-v1',
  authorityId:
    'sam31-qualification-image-build-vertex-a100-importlib-resources-successor-17',
  ingestReceiptRef: {
    id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
    version: 1,
    schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    contentHash:
      'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
  },
  reproducibilityReceiptRef: {
    id:
      'sam31-qualification-capsule-reproducibility-vertex-a100-importlib-resources-import-order-corrected-20260807',
    version: 1,
    contentHash: `sha256:${reproducibilityHash}`,
  },
  cloudBuildMachineType: 'E2_STANDARD_2',
})
const authority = await imageBuildRuntime.repository
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
  || authority.capsuleManifestRef.id !==
    'sam31-qualification-image-capsule-vertex-a100-importlib-resources-import-order-corrected-v1'
  || authority.cloudBuildPolicy.machineType !== 'E2_STANDARD_2'
) throw new Error('SAM 3.1 importlib-resources authority changed.')

console.log(JSON.stringify({
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-vertex-a100-importlib-resources-import-order-corrected-successor-publication-v1',
  predecessorTerminalRef,
  failureClassification:
    'importlib_resources_transform_import_order_did_not_match_reviewed_patch_output',
  correction:
    'apply_reviewed_importlib_resources_patch_import_order_exactly_then_purge_setuptools_and_pkg_resources',
  importlibResourcesPatchSha256:
    EXPECTED_IMPORTLIB_RESOURCES_PATCH_SHA256,
  automaticRetryOfPredecessor: false,
  vertexA100ExecutionContractRequired: true,
  ...publication,
}, null, 2))
