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
  'publish-sam31-qualification-image-gpu-kernel-cache-authority-v1' as const
const REPRODUCIBILITY_ID =
  'sam31-qualification-capsule-reproducibility-gpu-kernel-cache-corrected-v1' as const
const MANIFEST_ID =
  'sam31-qualification-image-capsule-gpu-kernel-cache-corrected-v1' as const
const AUTHORITY_ID =
  'sam31-qualification-image-build-gpu-kernel-cache-corrected-v1' as const
const CACHE_POLICY =
  'sam3_1_ephemeral_nonroot_private_gpu_kernel_cache_v1' as const
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_GPU_KERNEL_CACHE_AUTHORITY_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 GPU-kernel-cache authority confirmation is missing.',
)

const reproducibilityHash = rawSha256.parse(
  process.env.WEEDITPRO_SAM31_GPU_KERNEL_CACHE_REPRODUCIBILITY_SHA256,
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
  || authority.cloudBuildPolicy.machineType !== 'E2_STANDARD_2'
) throw new Error('SAM 3.1 GPU-kernel-cache image authority changed.')

console.log(JSON.stringify({
  ...publication,
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-gpu-kernel-cache-authority-publication-v1',
  correction: 'provide_ephemeral_private_nonroot_gpu_kernel_cache_paths',
  predecessorFailedAttemptId:
    'sam31-a100-multiplex-gpu-forwarding-corrected-20260808-v12',
  predecessorTerminalObservationRef: {
    id: 'sam31-vertex-terminal.9a6a1f19fa0533d37e2e4de9943b5fad',
    version: 1,
    contentHash:
      'sha256:9a6a1f19fa0533d37e2e4de9943b5fade817719529459d9f144324661233c80a',
  },
  gpuKernelCachePolicy: CACHE_POLICY,
  gpuKernelCacheOwner: '65532:65532',
  gpuKernelCacheMode: '0700',
  gpuKernelCachePersistedBetweenJobs: false,
  callerGpuKernelCachePathAccepted: false,
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
