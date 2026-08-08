import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-rope-cache-derivation-build-v1' as const
const AUTHORITY_ID =
  'sam31-qualification-image-build-rope-cache-derivation-corrected-v1' as const

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_ROPE_CACHE_DERIVATION_BUILD_CONFIRMATION
      !== CONFIRMATION
) throw new Error('SAM 3.1 RoPE-cache image build confirmation is missing.')

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_ROPE_CACHE_DERIVATION_AUTHORITY_SHA256,
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
if (!authority || authority.cloudBuildPolicy.machineType !== 'E2_STANDARD_2') {
  throw new Error('SAM 3.1 RoPE-cache image authority is absent.')
}
const submission = await runtime.startOneQualificationImageBuild({ authorityRef })

console.log(JSON.stringify({
  correction:
    'derive_only_fixed_real_rope_runtime_caches_from_complex_checkpoint_buffers',
  failedAttemptAutomaticallyRetried: false,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
