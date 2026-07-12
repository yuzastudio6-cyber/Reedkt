import { z } from 'zod'

const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha = z.string().regex(/^[a-f0-9]{64}$/)

export const canonicalPrivateReviewHistoryDownloadQuerySchema = z.object({
  workspaceId: identity,
  packageRecordId: identity,
  expectedDecisionManifestSha256: sha,
  expectedFinalArtifactSha256: sha,
  purpose: z.literal('download_canonical_private_review_history_artifact'),
}).strict()

export const canonicalPrivateReviewHistoryMetadataSchema = z.object({
  schemaVersion: z.literal('canonical-private-review-history-download-v1'),
  source: z.literal('canonical_private_review_history_service'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
    approvedPlanId: identity,
    approvedPlanVersion: z.number().int().positive(),
    reviewAssemblyId: identity,
    reviewDecisionId: identity,
    artifactId: identity,
    expectedAssetId: identity,
  }).strict(),
  reviewState: z.enum(['current', 'superseded']),
  decision: z.enum(['accept_private_internal_review', 'request_revision']),
  planStatus: z.enum(['approved', 'superseded']),
  reservationStatus: z.enum(['reserved', 'partially_spent', 'released']),
  mimeType: z.literal('video/mp4'),
  fileName: z.string().min(1).max(255),
  byteSize: z.number().int().positive().max(32 * 1024 * 1024),
  sha256: sha,
  assemblyManifestSha256: sha,
  decisionManifestSha256: sha,
  qaEvaluationId: identity,
  reconciliationId: identity,
  historyEvidenceHash: sha,
  archivedExecutionAuthorityRestored: z.literal(false),
  publicUrlCreated: z.literal(false),
  signedUrlCreated: z.literal(false),
  customerCreditMutationPerformed: z.literal(false),
  billingMutationPerformed: z.literal(false),
  settlementPerformed: z.literal(false),
  testOnly: z.literal(true),
}).strict()

export type CanonicalPrivateReviewHistoryDownloadQuery = z.infer<
  typeof canonicalPrivateReviewHistoryDownloadQuerySchema
>
export type CanonicalPrivateReviewHistoryMetadata = z.infer<
  typeof canonicalPrivateReviewHistoryMetadataSchema
>
