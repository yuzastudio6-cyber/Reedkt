import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-multiplex-session-gpu-forwarding-build-v1' as const
const AUTHORITY_ID =
  'sam31-qualification-image-build-multiplex-session-gpu-forwarding-corrected-v1' as const

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_MULTIPLEX_SESSION_GPU_FORWARDING_BUILD_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 multiplex-session GPU-forwarding image build confirmation is missing.',
)

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_MULTIPLEX_SESSION_GPU_FORWARDING_AUTHORITY_SHA256,
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
  throw new Error('SAM 3.1 multiplex GPU-forwarding image authority is absent.')
}
const submission = await runtime.startOneQualificationImageBuild({ authorityRef })

console.log(JSON.stringify({
  correction:
    'forward_gpu_session_controls_through_all_pinned_sam31_multiplex_overrides',
  failedAttemptAutomaticallyRetried: false,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
