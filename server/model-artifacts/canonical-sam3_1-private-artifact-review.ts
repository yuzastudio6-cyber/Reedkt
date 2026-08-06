import { z } from 'zod'

import {
  CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_VERSION,
  canonicalSam31PrivateArtifactObjectCoordinateSchema,
} from './canonical-sam3_1-official-artifact-publication'
import {
  CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
} from './canonical-sam3_1-source-runtime-candidate'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_PRIVATE_ARTIFACT_REVIEW_VERSION =
  'canonical-sam3_1-private-artifact-review-bundle-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const publicationRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_OFFICIAL_ARTIFACT_PUBLICATION_VERSION,
  ),
}).strict()

const reviewWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_ARTIFACT_REVIEW_VERSION,
  ),
  source: z.literal(
    'canonical_weeditpro_sam3_1_private_artifact_review_owner',
  ),
  evidenceClass: z.literal('authenticated_private_owner_reread'),
  status: z.literal('approved_for_private_artifact_ingest'),
  reviewBundleId: safeId,
  reviewBundleVersion: z.literal(1),
  officialArtifactPublicationRef: publicationRefSchema,
  candidateRef: evidenceRefSchema.extend({
    version: z.literal(1),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
    ),
  }).strict(),
  termsAcceptanceRef: evidenceRefSchema,
  sourceArchive: z.object({
    coordinate: canonicalSam31PrivateArtifactObjectCoordinateSchema,
    artifactRef: evidenceRefSchema,
    licenseRef: evidenceRefSchema,
    securityReviewRef: evidenceRefSchema,
    malwareScanRef: evidenceRefSchema,
    unsignedSourceRevisionAcceptanceRef: evidenceRefSchema,
    licenseApprovedForWeEditProPrivateCommercialUse: z.literal(true),
    securityReviewPassed: z.literal(true),
    malwareScanPassed: z.literal(true),
    unsignedPinnedRevisionAccepted: z.literal(true),
  }).strict(),
  checkpoint: z.object({
    coordinate: canonicalSam31PrivateArtifactObjectCoordinateSchema,
    artifactRef: evidenceRefSchema,
    manifestRef: evidenceRefSchema,
    licenseRef: evidenceRefSchema,
    securityReviewRef: evidenceRefSchema,
    malwareScanRef: evidenceRefSchema,
    manifestBindsExactCoordinateShaAndLength: z.literal(true),
    licenseApprovedForWeEditProPrivateCommercialUse: z.literal(true),
    securityReviewPassed: z.literal(true),
    malwareScanPassed: z.literal(true),
    torchWeightsOnlyLoadRequired: z.literal(true),
    executablePickleTrustGranted: z.literal(false),
  }).strict(),
  reviewBoundary: z.object({
    exactPublishedSourceAndCheckpointCoordinatesReviewed: z.literal(true),
    officialGatedCheckpointOnly: z.literal(true),
    thirdPartyMirrorAccepted: z.literal(false),
    callerReviewClaimsAccepted: z.literal(false),
    callerUrlPathBytesOrCredentialsAccepted: z.literal(false),
    termsAuthorityRemainsExternal: z.literal(true),
    securityLicenseAndMalwareOwnersRemainExternal: z.literal(true),
  }).strict(),
  authority: z.object({
    authenticatedReviewEvidenceOnly: z.literal(true),
    artifactIngestReceiptCreated: z.literal(false),
    imageBuildAuthorized: z.literal(false),
    gpuRuntimeAuthorized: z.literal(false),
    providerOrModelExecuted: z.literal(false),
    customerCreditsMutated: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  reviewedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    value.sourceArchive.coordinate.sha256 !==
      value.sourceArchive.artifactRef.contentHash.slice('sha256:'.length)
    || value.checkpoint.coordinate.sha256 !==
      value.checkpoint.artifactRef.contentHash.slice('sha256:'.length)
    || value.sourceArchive.coordinate.bucketName !==
      value.checkpoint.coordinate.bucketName
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 private artifact review lost exact artifact lineage.',
  })
})

export const canonicalSam31PrivateArtifactReviewBundleSchema =
  reviewWithoutHashSchema.extend({ reviewBundleHash: rawSha256 }).strict()

export type CanonicalSam31PrivateArtifactReviewBundle = z.infer<
  typeof canonicalSam31PrivateArtifactReviewBundleSchema
>

export function assertCanonicalSam31PrivateArtifactReviewBundle(
  value: unknown,
): CanonicalSam31PrivateArtifactReviewBundle {
  assertClosedPlainData(value, 'sam31_private_artifact_review')
  const parsed = canonicalSam31PrivateArtifactReviewBundleSchema.parse(value)
  const { reviewBundleHash, ...payload } = parsed
  if (reviewBundleHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 private artifact review hash is invalid.')
  }
  return parsed
}

export function canonicalSam31PrivateArtifactReviewBundleRef(value: unknown): {
  readonly id: string
  readonly version: 1
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_PRIVATE_ARTIFACT_REVIEW_VERSION
  readonly contentHash: `sha256:${string}`
} {
  const bundle = assertCanonicalSam31PrivateArtifactReviewBundle(value)
  return Object.freeze({
    id: bundle.reviewBundleId,
    version: 1,
    schemaVersion: bundle.schemaVersion,
    contentHash: `sha256:${bundle.reviewBundleHash}`,
  })
}

function assertClosedPlainData(value: unknown, label: string): void {
  const seen = new Set<object>()
  const visit = (item: unknown): void => {
    if (!item || typeof item !== 'object') return
    if (seen.has(item)) throw new Error(`${label} contains a cycle.`)
    const prototype = Object.getPrototypeOf(item)
    if (prototype !== Object.prototype && prototype !== Array.prototype) {
      throw new Error(`${label} must contain plain data only.`)
    }
    seen.add(item)
    for (const key of Reflect.ownKeys(item)) {
      if (typeof key !== 'string') {
        throw new Error(`${label} contains a symbol key.`)
      }
      const descriptor = Object.getOwnPropertyDescriptor(item, key)
      if (!descriptor || !('value' in descriptor)) {
        throw new Error(`${label} contains an accessor.`)
      }
      visit(descriptor.value)
    }
    seen.delete(item)
  }
  visit(value)
}
