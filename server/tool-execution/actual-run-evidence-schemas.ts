import { z } from 'zod'
import { internalProducedArtifactEvidenceSchema } from '../validation/private-artifact-qa-authority-schemas'

export const ACTUAL_ARTIFACT_RUN_EVIDENCE_VERSION =
  'actual-artifact-run-evidence-v2' as const
export const ACTUAL_ARTIFACT_RUN_RECORD_VERSION =
  'actual-artifact-run-evidence-record-v2' as const

export const actualRunSafeIdentitySchema = z.string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')

export const actualRunSha256Schema = z.string().regex(/^[a-f0-9]{64}$/)

export const actualRunIdentitySchema = z.object({
  ownerUserId: actualRunSafeIdentitySchema,
  workspaceId: actualRunSafeIdentitySchema,
  projectId: actualRunSafeIdentitySchema,
  editSessionId: actualRunSafeIdentitySchema,
  snapshotId: actualRunSafeIdentitySchema,
  jobId: actualRunSafeIdentitySchema,
  approvedWorkItemId: actualRunSafeIdentitySchema,
  expectedAssetId: actualRunSafeIdentitySchema,
  toolId: actualRunSafeIdentitySchema,
  operationId: actualRunSafeIdentitySchema,
  leaseId: actualRunSafeIdentitySchema,
  attemptId: actualRunSafeIdentitySchema,
  sandboxId: actualRunSafeIdentitySchema,
  outputId: actualRunSafeIdentitySchema,
}).strict()

export const collectActualRunEvidenceRequestSchema = actualRunIdentitySchema.extend({
  purpose: z.literal('collect_private_actual_artifact_run_evidence_v2'),
}).strict()

export const supportedArtifactMimeTypeSchema = z.enum([
  'application/json',
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'video/mp4',
  'audio/wav',
])

const artifactAttemptKindSchema = z.enum([
  'initial',
  'retry',
  'approved_fallback',
  'user_approved_replacement',
])

const fixedRunnerSchema = z.object({
  runnerClass: actualRunSafeIdentitySchema,
  runnerVersion: z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9][A-Za-z0-9.+_-]*$/),
  containerImageRef: actualRunSafeIdentitySchema,
  containerImageDigest: actualRunSha256Schema,
  toolBinaryVersion: z.string().trim().min(1).max(160).regex(/^[A-Za-z0-9][A-Za-z0-9.+_ -]*$/),
  toolBinaryDigest: actualRunSha256Schema,
  commandDigest: actualRunSha256Schema,
  stdoutDigest: actualRunSha256Schema,
  stderrDigest: actualRunSha256Schema,
  stdoutByteLength: z.number().int().nonnegative().max(16 * 1024 * 1024),
  stderrByteLength: z.number().int().nonnegative().max(16 * 1024 * 1024),
}).strict()

const fixedTimingSchema = z.object({
  startedAt: z.string().datetime({ offset: true }),
  finishedAt: z.string().datetime({ offset: true }),
  durationMs: z.number().int().nonnegative().max(24 * 60 * 60 * 1_000),
  exitCode: z.literal(0),
}).strict().superRefine((timing, context) => {
  const elapsed = Date.parse(timing.finishedAt) - Date.parse(timing.startedAt)
  if (elapsed < 0 || elapsed !== timing.durationMs) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Runner timestamps and duration must match exactly.',
    })
  }
})

const fixedResourceMetricsSchema = z.object({
  cpuUserMs: z.number().int().nonnegative().max(24 * 60 * 60 * 1_000),
  cpuSystemMs: z.number().int().nonnegative().max(24 * 60 * 60 * 1_000),
  maximumResidentBytes: z.number().int().nonnegative().max(1024 * 1024 * 1024 * 1024),
  inputBytesRead: z.number().int().nonnegative().max(128 * 1024 * 1024 * 1024),
  outputBytesWritten: z.number().int().positive().max(128 * 1024 * 1024 * 1024),
}).strict()

const fixedCostMetricsSchema = z.object({
  currency: z.literal('USD'),
  actualToolCostMicros: z.number().int().nonnegative().max(10_000_000_000),
  costMeasurement: z.literal('private_runner_measured'),
  serviceFeeIncluded: z.literal(false),
  walletMutationPerformed: z.literal(false),
  settlementPerformed: z.literal(false),
}).strict()

export const serverVerifiedCompletedRunReceiptSchema = z.object({
  schemaVersion: z.literal('server-verified-completed-tool-run-v2'),
  source: z.literal('server_injected_completed_run_receipt_provider'),
  identity: actualRunIdentitySchema,
  identityHash: actualRunSha256Schema,
  leaseAuthorityHash: actualRunSha256Schema,
  workerIdentity: actualRunSafeIdentitySchema,
  attemptNumber: z.number().int().positive().max(10),
  artifactVersion: z.number().int().positive().max(10_000),
  attemptKind: artifactAttemptKindSchema,
  replacesArtifactId: actualRunSafeIdentitySchema.optional(),
  reportedOutput: z.object({
    sha256: actualRunSha256Schema,
    byteLength: z.number().int().positive().max(128 * 1024 * 1024 * 1024),
    contentType: supportedArtifactMimeTypeSchema,
    placeholder: z.literal(false),
    outputCommitmentHash: actualRunSha256Schema,
  }).strict(),
  runner: fixedRunnerSchema,
  timing: fixedTimingSchema,
  resources: fixedResourceMetricsSchema,
  cost: fixedCostMetricsSchema,
  effects: z.object({
    networkAccessed: z.literal(false),
    sensitiveMaterialRead: z.literal(false),
    providerCallMade: z.literal(false),
    renderExecuted: z.literal(false),
  }).strict(),
}).strict().superRefine((receipt, context) => {
  if (receipt.artifactVersion === 1) {
    if (receipt.attemptKind !== 'initial' || receipt.replacesArtifactId !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Artifact version 1 must be the initial non-replacement attempt.',
      })
    }
  } else if (receipt.attemptKind === 'initial' || !receipt.replacesArtifactId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Artifact versions after 1 must bind an exact predecessor.',
    })
  }
  if (receipt.resources.outputBytesWritten !== receipt.reportedOutput.byteLength) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Runner output-byte metrics must equal the reported artifact size.',
    })
  }
})

const verifiedArtifactSchema = z.object({
  artifactVersion: z.number().int().positive().max(10_000),
  attemptKind: artifactAttemptKindSchema,
  replacesArtifactId: actualRunSafeIdentitySchema.optional(),
  sha256: actualRunSha256Schema,
  byteLength: z.number().int().positive().max(128 * 1024 * 1024 * 1024),
  contentType: supportedArtifactMimeTypeSchema,
  privateObjectIdentityHash: actualRunSha256Schema,
  sourceBytesMatchedReceipt: z.literal(true),
  createOnlyPromotionCommitted: z.literal(true),
  promotedBytesReRead: z.literal(true),
  promotedHashSizeMimeVerified: z.literal(true),
  placeholder: z.literal(false),
}).strict()

export const actualArtifactRunEvidenceSchema = z.object({
  schemaVersion: z.literal(ACTUAL_ARTIFACT_RUN_EVIDENCE_VERSION),
  source: z.literal('private_actual_artifact_run_evidence_bridge'),
  identity: actualRunIdentitySchema,
  identityHash: actualRunSha256Schema,
  runEvidenceHash: actualRunSha256Schema,
  lease: z.object({
    leaseId: actualRunSafeIdentitySchema,
    leaseAuthorityHash: actualRunSha256Schema,
    workerIdentity: actualRunSafeIdentitySchema,
    attemptNumber: z.number().int().positive().max(10),
    verifiedByLeaseAuthority: z.literal(false),
  }).strict(),
  artifact: verifiedArtifactSchema,
  runner: fixedRunnerSchema,
  timing: fixedTimingSchema,
  resources: fixedResourceMetricsSchema,
  cost: fixedCostMetricsSchema,
  effects: z.object({
    networkAccessed: z.literal(false),
    sensitiveMaterialRead: z.literal(false),
    providerCallMade: z.literal(false),
    renderExecuted: z.literal(false),
  }).strict(),
  sandbox: z.object({
    sandboxId: actualRunSafeIdentitySchema,
    outputId: actualRunSafeIdentitySchema,
    sandboxIdentityHash: actualRunSha256Schema,
    outputCommitmentHash: actualRunSha256Schema,
    locatorPersisted: z.literal(false),
  }).strict(),
  verification: z.object({
    sourceReadNoFollow: z.literal(true),
    privateCreateOnlyPromotion: z.literal(true),
    promotedReadNoFollow: z.literal(true),
    reportedAndActualHashMatch: z.literal(true),
    reportedAndActualSizeMatch: z.literal(true),
    detectedAndExpectedMimeMatch: z.literal(true),
    receiptContainsNoPlaceholder: z.literal(true),
  }).strict(),
  artifactAuthorityEnvelope: internalProducedArtifactEvidenceSchema,
  bridgeState: z.object({
    privateLocalOnly: z.literal(true),
    actualArtifactBytesVerified: z.literal(true),
    actualRunnerReceiptVerified: z.literal(true),
    existingArtifactAuthorityIntegrationState: z.literal('compatible_non_authorizing_placeholder_bridge'),
    leaseAuthorityIntegrated: z.literal(false),
    productionPersistenceIntegrated: z.literal(false),
  }).strict(),
  executionPermissions: z.object({
    workerDispatch: z.literal(false),
    toolExecution: z.literal(false),
    providerCall: z.literal(false),
    render: z.literal(false),
    creditSpend: z.literal(false),
    delivery: z.literal(false),
  }).strict(),
  evidenceHash: actualRunSha256Schema,
  createdAt: z.string().datetime({ offset: true }),
}).strict()

export const persistedActualArtifactRunEvidenceSchema = z.object({
  recordVersion: z.literal(ACTUAL_ARTIFACT_RUN_RECORD_VERSION),
  source: z.literal('private_actual_artifact_run_evidence_store'),
  evidence: actualArtifactRunEvidenceSchema,
  checksumSha256: actualRunSha256Schema,
}).strict()

export type ActualRunIdentity = z.infer<typeof actualRunIdentitySchema>
export type CollectActualRunEvidenceRequest = z.infer<typeof collectActualRunEvidenceRequestSchema>
export type ServerVerifiedCompletedRunReceipt = z.infer<typeof serverVerifiedCompletedRunReceiptSchema>
export type ActualArtifactRunEvidence = z.infer<typeof actualArtifactRunEvidenceSchema>
