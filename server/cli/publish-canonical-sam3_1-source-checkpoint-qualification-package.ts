import { z } from 'zod'

import {
  createCanonicalSam31GcpSourceCheckpointQualificationPackagePublisher,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-package-publisher'

const CONFIRMATION =
  'publish-one-sam31-source-checkpoint-qualification-package-v1' as const
const hash = z.string().regex(/^[a-f0-9]{64}$/u)
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const environment = z.object({
  WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_CONFIRMATION:
    z.literal(CONFIRMATION),
  WEEDITPRO_SAM31_QUALIFICATION_ID: safeId,
  WEEDITPRO_SAM31_QUALIFICATION_INGEST_ID: safeId,
  WEEDITPRO_SAM31_QUALIFICATION_INGEST_SHA256: hash,
  WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_ID: safeId,
  WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_SHA256: hash,
  WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_ID: safeId,
  WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_SHA256: hash,
  WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_ISSUED_AT:
    z.string().datetime({ offset: true }),
}).strict().parse({
  WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_CONFIRMATION,
  WEEDITPRO_SAM31_QUALIFICATION_ID:
    process.env.WEEDITPRO_SAM31_QUALIFICATION_ID,
  WEEDITPRO_SAM31_QUALIFICATION_INGEST_ID:
    process.env.WEEDITPRO_SAM31_QUALIFICATION_INGEST_ID,
  WEEDITPRO_SAM31_QUALIFICATION_INGEST_SHA256:
    process.env.WEEDITPRO_SAM31_QUALIFICATION_INGEST_SHA256,
  WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_ID:
    process.env.WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_ID,
  WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_SHA256:
    process.env.WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_SHA256,
  WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_ID:
    process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_ID,
  WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_SHA256:
    process.env.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_SHA256,
  WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_ISSUED_AT:
    process.env.WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_ISSUED_AT,
})

const publication = await
createCanonicalSam31GcpSourceCheckpointQualificationPackagePublisher()
  .publish({
    qualificationId: environment.WEEDITPRO_SAM31_QUALIFICATION_ID,
    ingestReceiptRef: {
      id: environment.WEEDITPRO_SAM31_QUALIFICATION_INGEST_ID,
      version: 1,
      schemaVersion:
        'canonical-sam3_1-private-artifact-ingest-receipt-v3',
      contentHash:
        `sha256:${environment.WEEDITPRO_SAM31_QUALIFICATION_INGEST_SHA256}`,
    },
    artifactReviewBundleRef: {
      id: environment.WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_ID,
      version: 1,
      schemaVersion:
        'canonical-sam3_1-private-artifact-review-bundle-v1',
      contentHash:
        `sha256:${environment.WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_SHA256}`,
    },
    imageSupplyChainReleaseRef: {
      id: environment.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_ID,
      version: 1,
      contentHash:
        `sha256:${environment.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_SHA256}`,
    },
    issuedAt:
      environment.WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_ISSUED_AT,
  })

process.stdout.write(`${JSON.stringify(publication)}\n`)

