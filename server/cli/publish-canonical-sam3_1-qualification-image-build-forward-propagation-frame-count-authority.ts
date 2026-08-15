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
  'publish-sam31-qualification-image-forward-propagation-frame-count-authority-v1' as const
const REPRODUCIBILITY_ID =
  'sam31-qualification-capsule-reproducibility-forward-propagation-frame-count-corrected-v1' as const
const MANIFEST_ID =
  'sam31-qualification-image-capsule-forward-propagation-frame-count-corrected-v1' as const
const AUTHORITY_ID =
  'sam31-qualification-image-build-forward-propagation-frame-count-corrected-v1' as const
const CACHE_POLICY =
  'sam3_1_ephemeral_nonroot_private_gpu_kernel_cache_v1' as const
const PATCH_PATH =
  'docker/prod/gpu-worker/sam3_1/patches/0004-weeditpro-forward-propagation-frame-count.patch' as const
const PATCH_SHA256 =
  '2540f5ba2a4d3f8931554e254d2f1c2c79abd28461f902477b7d64a04784f6de' as const
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_FORWARD_PROPAGATION_FRAME_COUNT_AUTHORITY_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 forward-propagation-frame-count authority confirmation is missing.',
)

const reproducibilityHash = rawSha256.parse(
  process.env
    .WEEDITPRO_SAM31_FORWARD_PROPAGATION_FRAME_COUNT_REPRODUCIBILITY_SHA256,
)
if (sourceHash(PATCH_PATH) !== PATCH_SHA256) throw new Error(
  'SAM 3.1 forward-propagation-frame-count patch changed.',
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
  'SAM 3.1 forward-propagation-frame-count image authority changed.',
)

console.log(JSON.stringify({
  ...publication,
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-forward-propagation-frame-count-authority-publication-v1',
  correction: 'make_forward_propagation_bound_count_exact',
  predecessorFailedAttemptId:
    'sam31-a100-multiplex-gpu-kernel-cache-corrected-20260809-v13',
  predecessorTerminalObservationRef: {
    id: 'sam31-vertex-terminal.9948942ae9e354f763e6d75692d76ffc',
    version: 1,
    contentHash:
      'sha256:9948942ae9e354f763e6d75692d76ffc564d5a1480dd5f56486616b3cfbc0ab9',
  },
  patchRef: {
    id: 'weeditpro-sam3_1-forward-propagation-frame-count-patch-v1',
    version: 1,
    contentHash: `sha256:${PATCH_SHA256}`,
  },
  boundedForwardPropagationUsesExactFrameCount: true,
  maximumFrameCountOneEmitsExactlyOneFrame: true,
  callerPropagationLimitAccepted: false,
  cpuStateOffloadAllowed: false,
  cpuVideoDecodeFallbackAllowed: false,
  failedAttemptAutomaticallyRetried: false,
  sourceCheckpointQualificationGranted: false,
  gpuQualificationJobDispatched: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function sourceHash(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}
