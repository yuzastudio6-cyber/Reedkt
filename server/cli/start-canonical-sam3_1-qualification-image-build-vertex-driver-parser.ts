import { z } from 'zod'

import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'start-one-sam31-qualification-image-vertex-driver-parser-build-v1' as const
const AUTHORITY_ID =
  'sam31-qualification-image-build-vertex-driver-parser-corrected-v1' as const

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_VERTEX_DRIVER_PARSER_BUILD_CONFIRMATION
      !== CONFIRMATION
) throw new Error('SAM 3.1 driver-parser image build confirmation is missing.')

const authorityHash = z.string().regex(/^[a-f0-9]{64}$/u).parse(
  process.env.WEEDITPRO_SAM31_VERTEX_DRIVER_PARSER_AUTHORITY_SHA256,
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
  throw new Error('SAM 3.1 driver-parser image authority is absent.')
}
const submission = await runtime.startOneQualificationImageBuild({ authorityRef })

console.log(JSON.stringify({
  correction: 'accept_legacy_and_modern_nvidia_kernel_driver_version_shapes',
  failedAttemptAutomaticallyRetried: false,
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
