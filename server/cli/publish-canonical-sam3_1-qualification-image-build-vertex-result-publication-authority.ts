import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import { z } from 'zod'

import {
  publishCanonicalSam31QualificationImageBuildAuthority,
} from '../services/canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'publish-sam31-qualification-image-vertex-result-publication-authority-v1' as const
const REPRODUCIBILITY_ID =
  'sam31-qualification-capsule-reproducibility-vertex-result-publication-corrected-v1' as const
const MANIFEST_ID =
  'sam31-qualification-image-capsule-vertex-result-publication-corrected-v1' as const
const AUTHORITY_ID =
  'sam31-qualification-image-build-vertex-result-publication-corrected-v1' as const
const CACHE_POLICY =
  'sam3_1_ephemeral_nonroot_private_gpu_kernel_cache_v1' as const
const PATCH_SHA256 =
  '2540f5ba2a4d3f8931554e254d2f1c2c79abd28461f902477b7d64a04784f6de' as const
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_VERTEX_RESULT_PUBLICATION_AUTHORITY_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 Vertex result-publication authority confirmation is missing.',
)

const reproducibilityHash = rawSha256.parse(
  process.env
    .WEEDITPRO_SAM31_VERTEX_RESULT_PUBLICATION_REPRODUCIBILITY_SHA256,
)
const publication = await publishCanonicalSam31QualificationImageBuildAuthority({
  manifestId: MANIFEST_ID,
  authorityId: AUTHORITY_ID,
  ingestReceiptRef: {
    id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
    version: 1,
    schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    contentHash:
      'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
  },
  reproducibilityReceiptRef: {
    id: REPRODUCIBILITY_ID,
    version: 1,
    contentHash: `sha256:${reproducibilityHash}`,
  },
  cloudBuildMachineType: 'E2_STANDARD_2',
})
const runtime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const authority = await runtime.repository.rereadQualificationImageBuildAuthority({
  authorityRef: publication.authorityRef,
})
if (
  !authority
  || authority.buildClosure.dockerfileSha256 !== sourceHash(
    'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
  )
  || authority.buildClosure.entrypointSha256 !== sourceHash(
    'docker/prod/gpu-worker/sam3_1/qualification_entrypoint.sh',
  )
  || authority.buildClosure.runnerSha256 !== sourceHash(
    'docker/prod/gpu-worker/sam3_1/qualification_runner.py',
  )
  || authority.buildClosure.sourceProvenanceLockSha256 !== sourceHash(
    'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
  )
  || authority.buildClosure.gpuKernelCachePolicy !== CACHE_POLICY
  || authority.buildClosure.forwardPropagationFrameCountPatchSha256 !==
    PATCH_SHA256
  || authority.cloudBuildPolicy.machineType !== 'E2_STANDARD_2'
) throw new Error(
  'SAM 3.1 Vertex result-publication image authority changed.',
)

console.log(JSON.stringify({
  ...publication,
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-vertex-result-publication-authority-publication-v1',
  correction:
    'claim_fixed_gcs_result_directory_before_inference_and_reread_exact_fuse_json_bytes',
  predecessorFailedAttemptId:
    'sam31-vertex-a100-qualification-20260809-v14-forward-propagation-frame-count-corrected',
  predecessorCostReceiptRef: {
    id: 'sam31-vertex-qualification-cost-d5625a42f069cbe026e9ee4a1144608cb132b7a7',
    version: 1,
    contentHash:
      'sha256:93e5f055f811c44c7dcb69917d634c404900bd331051362ec6546644ea0efdd1',
  },
  resultDirectoryClaimedBeforeModelExecution: true,
  resultObjectCreatedExactlyOnce: true,
  resultBytesRereadExactlyBeforeExit: true,
  cloudStorageFuseOctetStreamTransportAcceptedOnlyAfterStrictJsonValidation:
    true,
  callerResultPathAccepted: false,
  failedAttemptAutomaticallyRetried: false,
  sourceCheckpointQualificationGranted: false,
  gpuQualificationJobDispatched: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function sourceHash(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}
