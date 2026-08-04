import { z } from 'zod'

export const PRIVATE_FINAL_RENDER_SETTLEMENT_PREFLIGHT_VERSION =
  'private-final-render-settlement-preflight-v1' as const

const boundedIdSchema = z.string().trim().min(1).max(220)
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/i)
const timestampSchema = z.string().datetime({ offset: true })
const nonNegativeIntegerSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)
const positiveIntegerSchema = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER)
const positiveFiniteSchema = z.number().positive().finite()

const lineageSchema = z.object({
  workspaceId: boundedIdSchema,
  projectId: boundedIdSchema,
  editSessionId: boundedIdSchema,
  approvedPlanSnapshotId: boundedIdSchema,
  snapshotHash: sha256Schema,
  planId: boundedIdSchema,
  estimateId: boundedIdSchema,
  reservationId: boundedIdSchema,
}).strict()

const approvedAuthoritySchema = lineageSchema.extend({
  approvalId: boundedIdSchema,
  workGraphHash: sha256Schema,
  approvedSourceAssetManifestHash: sha256Schema,
  approvedPlannedAssetManifestHash: sha256Schema,
  planStatus: z.literal('approved'),
  estimateStatus: z.literal('approved'),
  snapshotImmutable: z.literal(true),
  snapshotSuperseded: z.literal(false),
  userApprovalRecorded: z.literal(true),
  testOnly: z.boolean(),
}).strict()

const approvedFrameSchema = z.object({
  confirmationStatus: z.literal('confirmed'),
  aspectRatio: z.enum(['9:16', '16:9', '1:1', '4:5', '4:3']),
  width: positiveIntegerSchema.max(7680),
  height: positiveIntegerSchema.max(7680),
  fps: positiveFiniteSchema.max(120),
  frameTemplateId: boundedIdSchema,
  panelBackground: z.string().trim().min(1).max(64),
  safeZonesFrozen: z.literal(true),
  sourceFitPlanFrozen: z.literal(true),
}).strict()

const timingAuthoritySchema = z.object({
  masterTimingPlanId: boundedIdSchema,
  timingValidationPlanId: boundedIdSchema,
  validationStatus: z.literal('passed'),
  frameAuthoritative: z.literal(true),
  frozenInApprovedSnapshot: z.literal(true),
  fps: positiveFiniteSchema.max(120),
  totalFrames: positiveIntegerSchema,
  durationSeconds: positiveFiniteSchema,
  cleanupPreferenceConfirmed: z.literal(true),
  trimReviewStatus: z.literal('passed'),
  meaningPreservationStatus: z.literal('passed'),
  unresolvedUserReviewCount: z.literal(0),
}).strict()

const sourceBindingSchema = z.object({
  sourceSequenceItemId: boundedIdSchema,
  mediaAssetId: boundedIdSchema,
  checksumSha256: sha256Schema,
  byteSize: positiveIntegerSchema,
  storageProvider: z.enum(['local_private', 'google_cloud_storage']),
  storageIdentityVerified: z.literal(true),
  generation: z.string().trim().min(1).max(220).nullable(),
  etag: z.string().trim().min(1).max(500).nullable(),
  bytesRevalidatedAt: timestampSchema,
  ready: z.literal(true),
}).strict()

const sourceAssetAuthoritySchema = z.object({
  manifestHash: sha256Schema,
  requiredBindingCount: positiveIntegerSchema,
  bindings: z.array(sourceBindingSchema).min(1).max(1_000),
  sourceOrderConfirmed: z.literal(true),
  sourceCoverageComplete: z.literal(true),
  allRequiredBytesVerified: z.literal(true),
}).strict()

const renderInputAssetSchema = z.object({
  assetId: boundedIdSchema,
  expectedOutputId: boundedIdSchema,
  workItemId: boundedIdSchema,
  artifactVersion: positiveIntegerSchema,
  artifactHash: sha256Schema,
  required: z.literal(true),
  status: z.literal('merged'),
  qaStatus: z.literal('passed'),
  activeVersion: z.literal(true),
  placeholder: z.literal(false),
  segmentIds: z.array(boundedIdSchema).min(1).max(500),
  timingIds: z.array(boundedIdSchema).min(1).max(500),
  rendererLayerIds: z.array(boundedIdSchema).min(1).max(500),
}).strict()

const plannedAssetAuthoritySchema = z.object({
  manifestHash: sha256Schema,
  requiredRenderInputCount: positiveIntegerSchema,
  renderInputAssets: z.array(renderInputAssetSchema).min(1).max(2_000),
  unresolvedRequiredFailureCount: z.literal(0),
  requiredPlaceholderCount: z.literal(0),
  activeVersionUniquenessVerified: z.literal(true),
  rendererLineageComplete: z.literal(true),
}).strict()

const executionLeaseSchema = z.object({
  leaseId: boundedIdSchema,
  leaseTokenHash: sha256Schema,
  workerIdentityHash: sha256Schema,
  status: z.literal('active'),
  tenantBound: z.literal(true),
  snapshotBound: z.literal(true),
  reservationBound: z.literal(true),
  attempt: positiveIntegerSchema,
  maximumAttempt: positiveIntegerSchema,
  expiresAt: timestampSchema,
  durableAtomicClaim: z.literal(true),
}).strict()

const renderWorkAuthoritySchema = lineageSchema.extend({
  renderWorkItemId: boundedIdSchema,
  renderJobId: boundedIdSchema,
  workItemType: z.literal('render_final_export'),
  jobStatus: z.literal('ready'),
  dependencyState: z.literal('ready'),
  requiredDependencyCount: nonNegativeIntegerSchema,
  readyDependencyCount: nonNegativeIntegerSchema,
  expectedFinalArtifactId: boundedIdSchema,
  expectedOutputRequired: z.literal(true),
  expectedOutputAllowsPlaceholder: z.literal(false),
  executionInputHash: sha256Schema,
  approvedToolIds: z.array(z.enum(['remotion', 'ffmpeg', 'libass'])).min(1).max(3),
  lease: executionLeaseSchema,
}).strict()

const fundedReservationSchema = lineageSchema.extend({
  status: z.enum(['reserved', 'partially_spent']),
  fundingSource: z.enum(['synthetic_private_internal_wallet', 'durable_wallet_ledger']),
  reservedCredits: positiveIntegerSchema,
  spentCredits: nonNegativeIntegerSchema,
  releasedCredits: nonNegativeIntegerSchema,
  refundedCredits: nonNegativeIntegerSchema,
  remainingReservedCredits: positiveIntegerSchema,
  approvedMaximumCredits: positiveIntegerSchema,
  expiresAt: timestampSchema,
  walletConservationVerified: z.literal(true),
  appendOnlyLedgerVerified: z.literal(true),
  serviceControlled: z.literal(true),
  testOnly: z.boolean(),
}).strict()

const idempotencyAuthoritySchema = lineageSchema.extend({
  operation: z.literal('final_render_export_settlement'),
  idempotencyKey: boundedIdSchema,
  requestHash: sha256Schema,
  authorityFingerprint: sha256Schema,
  status: z.enum(['reserved', 'completed']),
  durableAtomic: z.literal(true),
  concurrencyControlled: z.literal(true),
  exactResponseReplayBound: z.literal(true),
}).strict()

const privacyAuthoritySchema = z.object({
  privateArtifactsOnly: z.literal(true),
  sourceBytesGenerationBound: z.literal(true),
  outputCreateOnly: z.literal(true),
  outputAtomicPromotion: z.literal(true),
  artifactRootConfined: z.literal(true),
  symlinkSafeReads: z.literal(true),
  noSignedUrlPersisted: z.literal(true),
  publicDeliveryRequested: z.literal(false),
  currentMembershipRechecked: z.literal(true),
  workerSandboxVerified: z.literal(true),
  mediaParserIsolationVerified: z.literal(true),
  retentionPolicyVerified: z.literal(true),
  rawProviderPayloadStored: z.literal(false),
}).strict()

const toolRuntimeEvidenceSchema = z.object({
  toolId: z.enum(['remotion', 'ffmpeg', 'libass']),
  runtimeEvidenceId: boundedIdSchema,
  installedVersion: z.string().trim().min(1).max(160),
  binaryOrPackageDigest: sha256Schema,
  containerImageDigest: z.string().trim().min(1).max(260),
  licenseConfigurationApproved: z.literal(true),
  allowlistedRecipeHash: sha256Schema,
  readinessStatus: z.literal('passed'),
  productionUseApproved: z.literal(true),
}).strict()

const renderRuntimeAuthoritySchema = z.object({
  renderKillSwitchOff: z.literal(true),
  finalExportKillSwitchOff: z.literal(true),
  commandArgumentsServerOwned: z.literal(true),
  arbitraryCodeRejected: z.literal(true),
  runtimeBudgetWithinLimit: z.literal(true),
  concurrencySlotReserved: z.literal(true),
  timeoutSeconds: positiveIntegerSchema.max(7_200),
  toolEvidence: z.array(toolRuntimeEvidenceSchema).min(1).max(3),
}).strict()

const qaGateSchema = z.object({
  gateId: boundedIdSchema,
  gateType: boundedIdSchema,
  status: z.literal('passed'),
  blocking: z.literal(false),
  checkedAgainstSnapshotHash: sha256Schema,
  checkedArtifactHash: sha256Schema.nullable(),
  evidenceHash: sha256Schema,
}).strict()

const qaAuthoritySchema = z.object({
  renderPreflightGates: z.array(qaGateSchema).min(1).max(200),
  deliveryGates: z.array(qaGateSchema).max(200),
  unresolvedBlockingFailureCount: z.literal(0),
  unresolvedUserReviewCount: z.literal(0),
  fallbackPendingCount: z.literal(0),
}).strict()

const costBudgetAuthoritySchema = lineageSchema.extend({
  renderBudgetCredits: positiveIntegerSchema,
  totalCommittedCreditsBeforeRender: nonNegativeIntegerSchema,
  projectedCommittedCreditsAfterRender: positiveIntegerSchema,
  approvedMaximumCredits: positiveIntegerSchema,
  remainingReservedCredits: positiveIntegerSchema,
  withinApprovedMaximum: z.literal(true),
  lowerCostAlternativeRequired: z.literal(false),
}).strict()

const actualToolCostEventSchema = lineageSchema.extend({
  eventId: boundedIdSchema,
  workItemId: boundedIdSchema,
  jobId: boundedIdSchema,
  toolId: boundedIdSchema,
  retryAttempt: nonNegativeIntegerSchema,
  idempotencyKey: boundedIdSchema,
  outputArtifactId: boundedIdSchema,
  outputArtifactHash: sha256Schema,
  actualWorkCompleted: z.literal(true),
  actualInternalCostMicros: nonNegativeIntegerSchema,
  actualToolCostCredits: nonNegativeIntegerSchema,
  billableToUser: z.boolean(),
  serviceFeeIncluded: z.literal(false),
  failureCategory: z.enum([
    'none',
    'provider_error',
    'provider_variance_absorbed',
    'reeditpro_error_absorbed',
    'user_requested_retry',
    'validation_error',
    'timeout',
    'cancelled',
    'unknown',
  ]),
}).strict()

const actualCostSettlementAuthoritySchema = lineageSchema.extend({
  events: z.array(actualToolCostEventSchema).min(1).max(10_000),
  actualBillableToolCostCredits: nonNegativeIntegerSchema,
  serviceFeeCredits: nonNegativeIntegerSchema,
  grossFinalChargeCredits: nonNegativeIntegerSchema,
  approvedChargeCeilingCredits: positiveIntegerSchema,
  userChargeCredits: nonNegativeIntegerSchema,
  absorbedOverageCredits: nonNegativeIntegerSchema,
  outstandingApprovedFundingCredits: nonNegativeIntegerSchema,
  policyDecision: z.enum([
    'within_approval',
    'reeditpro_absorbs_unapproved_overage',
    'revised_estimate_required',
  ]),
  rateCardVersion: z.string().trim().min(1).max(160),
  creditPolicyVersion: z.string().trim().min(1).max(160),
  serviceFeePolicyVersion: z.string().trim().min(1).max(160),
  formulaVerified: z.literal(true),
  durableEventStoreVerified: z.literal(true),
  settlementTransactionAvailable: z.literal(true),
}).strict()

const finalArtifactEvidenceSchema = lineageSchema.extend({
  artifactId: boundedIdSchema,
  artifactHash: sha256Schema,
  byteSize: positiveIntegerSchema,
  mimeType: z.literal('video/mp4'),
  storageProvider: z.enum(['local_private', 'google_cloud_storage']),
  generation: z.string().trim().min(1).max(220).nullable(),
  etag: z.string().trim().min(1).max(500).nullable(),
  width: positiveIntegerSchema.max(7680),
  height: positiveIntegerSchema.max(7680),
  fps: positiveFiniteSchema.max(120),
  totalFrames: positiveIntegerSchema,
  durationSeconds: positiveFiniteSchema,
  privateArtifact: z.literal(true),
  publicArtifact: z.literal(false),
  signedUrl: z.null(),
  sourceOfTruth: z.literal(true),
  storageIdentityVerified: z.literal(true),
  mediaProbePassed: z.literal(true),
  checksumRevalidatedAt: timestampSchema,
}).strict()

// Internal server-assembled evidence only. This must not be mounted as a
// caller-authored HTTP request schema.
export const privateFinalRenderSettlementPreflightEvidenceSchema = z.object({
  schemaVersion: z.literal(PRIVATE_FINAL_RENDER_SETTLEMENT_PREFLIGHT_VERSION),
  evidenceSource: z.literal('server_owned_canonical_records'),
  authority: approvedAuthoritySchema,
  frame: approvedFrameSchema,
  timing: timingAuthoritySchema,
  sourceAssets: sourceAssetAuthoritySchema,
  plannedAssets: plannedAssetAuthoritySchema,
  renderWork: renderWorkAuthoritySchema,
  reservation: fundedReservationSchema,
  idempotency: idempotencyAuthoritySchema,
  privacy: privacyAuthoritySchema,
  renderRuntime: renderRuntimeAuthoritySchema,
  qa: qaAuthoritySchema,
  costBudget: costBudgetAuthoritySchema,
  finalArtifact: finalArtifactEvidenceSchema.nullable(),
  actualCostSettlement: actualCostSettlementAuthoritySchema.nullable(),
}).strict()

export type PrivateFinalRenderSettlementPreflightEvidence = z.infer<
  typeof privateFinalRenderSettlementPreflightEvidenceSchema
>
