import {
  canonicalSam31QualificationImageSubmissionRef,
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION = 'start-one-sam31-qualification-image-build' as const

if (
  process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_BUILD_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 qualification image build confirmation is missing.')

const runtime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const submission = await runtime.startOneQualificationImageBuild({
  authorityRef: {
    id: 'sam31-qualification-image-build-85b90c05fbbcb04a',
    version: 1,
    contentHash:
      'sha256:b114120675207d53cae32a368dfff8d2ec2c40753c622d5bed8736f03d786ca1',
  },
})
console.log(JSON.stringify({
  ...submission,
  submissionRef: canonicalSam31QualificationImageSubmissionRef(submission),
}, null, 2))
