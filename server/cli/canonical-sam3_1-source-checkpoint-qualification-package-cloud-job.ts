import { z } from 'zod'

import {
  createCanonicalSam31GcpSourceCheckpointQualificationPackagePublisher,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-package-publisher'

const EXPECTED_JOB = 'weeditpro-sam31-package-publisher' as const
const CONFIRMATION =
  'publish-one-sam31-source-checkpoint-qualification-package-v1' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const hash = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })

async function main(): Promise<void> {
  assertCloudOperatorInvocation()
  const environment = z.object({
    confirmation: z.literal(CONFIRMATION),
    qualificationId: safeId,
    ingestId: safeId,
    ingestSha256: hash,
    artifactReviewId: safeId,
    artifactReviewSha256: hash,
    imageReleaseId: safeId,
    imageReleaseSha256: hash,
    issuedAt: timestamp,
  }).strict().parse({
    confirmation:
      process.env.WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_CONFIRMATION,
    qualificationId: process.env.WEEDITPRO_SAM31_QUALIFICATION_ID,
    ingestId: process.env.WEEDITPRO_SAM31_QUALIFICATION_INGEST_ID,
    ingestSha256:
      process.env.WEEDITPRO_SAM31_QUALIFICATION_INGEST_SHA256,
    artifactReviewId:
      process.env.WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_ID,
    artifactReviewSha256:
      process.env.WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_SHA256,
    imageReleaseId:
      process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_ID,
    imageReleaseSha256:
      process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_SHA256,
    issuedAt:
      process.env.WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_ISSUED_AT,
  })
  const publication = await
  createCanonicalSam31GcpSourceCheckpointQualificationPackagePublisher()
    .publish({
      qualificationId: environment.qualificationId,
      ingestReceiptRef: {
        id: environment.ingestId,
        version: 1,
        schemaVersion:
          'canonical-sam3_1-private-artifact-ingest-receipt-v3',
        contentHash: `sha256:${environment.ingestSha256}`,
      },
      artifactReviewBundleRef: {
        id: environment.artifactReviewId,
        version: 1,
        schemaVersion:
          'canonical-sam3_1-private-artifact-review-bundle-v1',
        contentHash: `sha256:${environment.artifactReviewSha256}`,
      },
      imageSupplyChainReleaseRef: {
        id: environment.imageReleaseId,
        version: 1,
        contentHash: `sha256:${environment.imageReleaseSha256}`,
      },
      issuedAt: environment.issuedAt,
    })
  process.stdout.write(`${JSON.stringify(publication)}\n`)
}

function assertCloudOperatorInvocation(): void {
  if (
    process.argv.length !== 3
    || process.argv[2] !== '--execute'
    || process.env.CLOUD_RUN_JOB !== EXPECTED_JOB
    || !safeRuntimeValue(process.env.CLOUD_RUN_EXECUTION)
    || process.env.CLOUD_RUN_TASK_INDEX !== '0'
    || !safeRuntimeValue(process.env.CLOUD_RUN_TASK_ATTEMPT)
  ) throw new Error(
    'SAM 3.1 qualification package publication is cloud-job-only.',
  )
}

function safeRuntimeValue(value: string | undefined): value is string {
  return Boolean(
    value
    && value.length <= 240
    && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(value)
    && !value.includes('..'),
  )
}

main().catch((error: unknown) => {
  const code = error instanceof Error
    ? error.message
    : 'sam3_1_qualification_package_publication_failed'
  process.stderr.write(`${JSON.stringify({ ok: false, code })}\n`)
  process.exitCode = 1
})
