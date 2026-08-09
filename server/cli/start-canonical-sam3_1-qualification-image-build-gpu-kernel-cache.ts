import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-gpu-kernel-cache-build-v1' as const
const AUTHORITY_ID =
  'sam31-qualification-image-build-gpu-kernel-cache-corrected-v1' as const
const CACHE_POLICY =
  'sam3_1_ephemeral_nonroot_private_gpu_kernel_cache_v1' as const

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_GPU_KERNEL_CACHE_BUILD_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 GPU-kernel-cache image build confirmation is missing.',
)

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_GPU_KERNEL_CACHE_AUTHORITY_SHA256,
)
const runtime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const authorityRef = {
  id: AUTHORITY_ID,
  version: 1 as const,
  contentHash: `sha256:${authorityHash}` as const,
}
const authority = await runtime.repository.rereadQualificationImageBuildAuthority({
  authorityRef,
})
if (
  !authority
  || authority.cloudBuildPolicy.machineType !== 'E2_STANDARD_2'
  || authority.buildClosure.gpuKernelCachePolicy !== CACHE_POLICY
) throw new Error('SAM 3.1 GPU-kernel-cache image authority is absent.')
const submission = await runtime.startOneQualificationImageBuild({ authorityRef })

console.log(JSON.stringify({
  correction: 'provide_ephemeral_private_nonroot_gpu_kernel_cache_paths',
  failedAttemptAutomaticallyRetried: false,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
