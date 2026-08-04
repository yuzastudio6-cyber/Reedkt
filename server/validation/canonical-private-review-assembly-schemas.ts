import { z } from 'zod'
import {
  OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_OUTPUT_BYTES,
} from '../tool-execution/media-binary-execution'
import { TOOL_COST_RATE_CARD_VERSION } from '../tool-cost-metering/rate-card'

const identity = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const sha = z.string().regex(/^[a-f0-9]{64}$/)

export const assembleCanonicalPrivateReviewSchema = z.object({
  workspaceId: identity,
  purpose: z.literal('assemble_canonical_private_review'),
}).strict()

const artifactAuthority = z.object({
  jobId: identity,
  approvedWorkItemId: identity,
  expectedAssetId: identity,
  artifactId: identity,
  artifactVersion: z.number().int().positive(),
  qaEvaluationId: identity,
  reconciliationId: identity,
  contentType: z.string().trim().min(1).max(160),
  sha256: sha,
  byteLength: z.number().int().positive()
    .max(OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_OUTPUT_BYTES),
  privateObjectIdentityHash: sha,
}).strict()

export const canonicalPrivateReviewAssemblyResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-review-assembly-response-v1'),
  source: z.literal('canonical_private_review_assembly_service'),
  purpose: z.literal('assemble_canonical_private_review'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
    reviewAssemblyId: identity,
  }).strict(),
  status: z.literal('ready_for_private_internal_review'),
  requiredExecution: z.object({
    requiredJobCount: z.number().int().positive().max(256),
    requiredExpectedAssetCount: z.number().int().positive().max(2048),
    passedQaArtifactCount: z.number().int().positive().max(2048),
    reconciledArtifactCount: z.number().int().positive().max(2048),
    allRequiredJobsCompleted: z.literal(true),
    allRequiredAssetsQaPassed: z.literal(true),
    allRequiredAssetsReconciled: z.literal(true),
  }).strict(),
  finalArtifact: artifactAuthority.extend({
    contentType: z.literal('video/mp4'),
    privateDownloadAvailable: z.literal(true),
    publicUrlCreated: z.literal(false),
    signedUrlCreated: z.literal(false),
  }).strict(),
  finalQaArtifact: artifactAuthority.extend({
    contentType: z.literal('application/json'),
    canonicalToolId: z.literal('ffprobe'),
    finalQaGatesPassed: z.literal(true),
    finalQaReportSha256: sha,
  }).strict(),
  internalAttemptCostEvidence: z.object({
    boundary: z.literal('internal_production_cost_only'),
    evidenceClassification: z.literal('provisional_local_metered'),
    rateCardVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
    requiredProfileCount: z.number().int().nonnegative().max(256),
    verifiedCompletedEvidenceCount: z.number().int().nonnegative().max(256),
    failedAttemptEvidenceCount: z.number().int().nonnegative().max(2560),
    verifiedAttemptEvidenceCount: z.number().int().nonnegative().max(2816),
    evidenceHashes: z.array(sha).max(2816),
    provisionalInternalCostMicros: z.number().int().nonnegative()
      .refine(Number.isSafeInteger),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationAuthorized: z.literal(false),
    settlementAuthorized: z.literal(false),
    privateLocalCreateOnly: z.literal(true),
    databaseBacked: z.literal(false),
    invoiceReconciled: z.literal(false),
  }).strict().optional(),
  chain: z.object({
    finalQaLeaseId: identity,
    finalQaExecutionAttemptId: identity,
    finalQaDependencyAuthorityHash: sha,
    finalQaInputBoundToFinalArtifact: z.literal(true),
    immutablePackageRevalidated: z.literal(true),
    immutablePlanRevalidated: z.literal(true),
    artifactStoreChecksumVerified: z.literal(true),
    leaseStoreChecksumVerified: z.literal(true),
  }).strict(),
  manifest: z.object({
    schemaVersion: z.literal('canonical-private-review-manifest-v1'),
    manifestId: identity,
    manifestSha256: sha,
    privateCreateOnlyPersistence: z.literal(true),
    credentialFree: z.literal(true),
  }).strict(),
  replay: z.object({
    idempotentReplay: z.boolean(),
    sameManifestOnly: z.literal(true),
  }).strict(),
  readiness: z.object({
    privateReviewReady: z.literal(true),
    publicExportReady: z.literal(false),
    productReady: z.literal(false),
    externalBetaReady: z.literal(false),
    productionReady: z.literal(false),
    nextRequiredGate: z.literal('canonical_private_review_user_decision_or_revision'),
  }).strict(),
  permissions: z.object({
    providerCall: z.literal(false),
    publicArtifact: z.literal(false),
    publicDelivery: z.literal(false),
    productionRender: z.literal(false),
    furtherRender: z.literal(false),
    customerPriceMutation: z.literal(false),
    customerCreditMutation: z.literal(false),
    walletMutation: z.literal(false),
    settlement: z.literal(false),
    billing: z.literal(false),
    deployment: z.literal(false),
  }).strict(),
  assembledAt: z.string().datetime({ offset: true }),
  responseHash: sha,
  testOnly: z.literal(true),
}).strict().superRefine((value, context) => {
  const cost = value.internalAttemptCostEvidence
  if (!cost) return
  if (
    cost.requiredProfileCount !== cost.verifiedCompletedEvidenceCount ||
    cost.verifiedAttemptEvidenceCount !==
      cost.verifiedCompletedEvidenceCount + cost.failedAttemptEvidenceCount ||
    cost.verifiedAttemptEvidenceCount !== cost.evidenceHashes.length ||
    new Set(cost.evidenceHashes).size !== cost.evidenceHashes.length ||
    (cost.verifiedAttemptEvidenceCount === 0
      ? cost.provisionalInternalCostMicros !== 0
      : cost.provisionalInternalCostMicros <= 0)
  ) context.addIssue({
    code: z.ZodIssueCode.custom,
    path: ['internalAttemptCostEvidence'],
    message: 'Private-review internal-cost coverage is inconsistent.',
  })
})

export type AssembleCanonicalPrivateReviewBody = z.infer<typeof assembleCanonicalPrivateReviewSchema>
export type CanonicalPrivateReviewAssemblyResponse = z.infer<
  typeof canonicalPrivateReviewAssemblyResponseSchema
>
