import { z } from 'zod'

import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'observe-one-sam31-qualification-image-build' as const
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_OBSERVATION_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 qualification image observation confirmation missing.')

const authorityId = safeId.parse(
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_AUTHORITY_ID,
)
const authorityHash = rawSha256.parse(
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_AUTHORITY_SHA256,
)
const submissionId = safeId.parse(
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUBMISSION_ID,
)
const submissionHash = rawSha256.parse(
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_SUBMISSION_SHA256,
)

const runtime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const observation = await runtime.observeOneQualificationImageBuild({
  authorityRef: {
    id: authorityId,
    version: 1,
    contentHash: `sha256:${authorityHash}`,
  },
  submissionRef: {
    id: submissionId,
    version: 1,
    contentHash: `sha256:${submissionHash}`,
  },
})

console.log(JSON.stringify(observation, null, 2))
