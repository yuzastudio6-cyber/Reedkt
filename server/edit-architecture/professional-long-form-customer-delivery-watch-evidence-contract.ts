import { z } from 'zod'

export const PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_EVIDENCE_VERSION =
  'professional-long-form-customer-delivery-watch-evidence-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_LATEST_POINTER_VERSION =
  'professional-long-form-customer-delivery-watch-latest-pointer-v1' as const
export const PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_IDEMPOTENCY_VERSION =
  'professional-long-form-customer-delivery-watch-idempotency-v1' as const

export const PROFESSIONAL_LONG_FORM_DELIVERY_MAX_WATCH_INTERVALS = 256
export const PROFESSIONAL_LONG_FORM_DELIVERY_MAX_WATCH_SEQUENCE = 100_000
export const PROFESSIONAL_LONG_FORM_DELIVERY_MAX_PLAYBACK_RATE_PERMILLE = 2_000
export const PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_CLOCK_SLACK_MS = 500

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const nonnegativeInteger = z.number().int().nonnegative()
  .max(Number.MAX_SAFE_INTEGER)
const positiveInteger = z.number().int().positive()
  .max(Number.MAX_SAFE_INTEGER)

export const professionalLongFormDeliveryWatchAuthoritySchema = z.object({
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  packageRecordId: identity,
  reviewPacketHash: sha256,
  masterSha256: sha256,
  masterFrameCount: positiveInteger.max(648_000),
  frameRateNumerator: z.literal(30),
  frameRateDenominator: z.literal(1),
}).strict()

export const professionalLongFormDeliveryWatchCoverageIntervalSchema =
  z.object({
    startFrame: nonnegativeInteger.max(648_000),
    endFrameExclusive: positiveInteger.max(648_000),
  }).strict().refine(
    (value) => value.endFrameExclusive > value.startFrame,
    'Watch interval must cover at least one frame.',
  )

export const recordProfessionalLongFormDeliveryWatchCheckpointSchema =
  z.object({
    workspaceId: identity,
    approvedPlanSnapshotId: identity,
    expectedReviewPacketHash: sha256,
    expectedMasterSha256: sha256,
    expectedPreviousWatchEvidenceHash: sha256.nullable(),
    sequence: positiveInteger.max(
      PROFESSIONAL_LONG_FORM_DELIVERY_MAX_WATCH_SEQUENCE,
    ),
    coveredIntervals: z.array(
      professionalLongFormDeliveryWatchCoverageIntervalSchema,
    ).min(1).max(PROFESSIONAL_LONG_FORM_DELIVERY_MAX_WATCH_INTERVALS),
  }).strict().superRefine((value, context) => {
    for (let index = 0; index < value.coveredIntervals.length; index += 1) {
      const current = value.coveredIntervals[index]
      const previous = value.coveredIntervals[index - 1]
      if (
        previous && current &&
        current.startFrame <= previous.endFrameExclusive
      ) {
        context.addIssue({
          code: 'custom',
          path: ['coveredIntervals', index],
          message:
            'Watch intervals must be sorted, non-overlapping, and already merged.',
        })
      }
    }
    if (
      (value.sequence === 1) !==
        (value.expectedPreviousWatchEvidenceHash === null)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Watch checkpoint predecessor identity is inconsistent.',
      })
    }
  })

const watchIdentitySchema = z.object({
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  packageRecordId: identity,
}).strict()

export const professionalLongFormDeliveryWatchEvidenceSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_watch_service',
  ),
  purpose: z.literal(
    'retain_server_validated_exact_private_customer_delivery_playback_coverage',
  ),
  identity: watchIdentitySchema,
  authority: z.object({
    reviewPacketHash: sha256,
    masterSha256: sha256,
    masterFrameCount: positiveInteger.max(648_000),
    frameRateNumerator: z.literal(30),
    frameRateDenominator: z.literal(1),
  }).strict(),
  sequence: positiveInteger.max(
    PROFESSIONAL_LONG_FORM_DELIVERY_MAX_WATCH_SEQUENCE,
  ),
  previousWatchEvidenceHash: sha256.nullable(),
  coveredIntervals: z.array(
    professionalLongFormDeliveryWatchCoverageIntervalSchema,
  ).min(1).max(PROFESSIONAL_LONG_FORM_DELIVERY_MAX_WATCH_INTERVALS),
  coveredFrameCount: positiveInteger.max(648_000),
  coveragePermille: z.number().int().min(0).max(1_000),
  fullProgramPlaybackObserved: z.boolean(),
  acceptanceGateSatisfied: z.boolean(),
  startedAt: timestamp,
  lastCheckpointAt: timestamp,
  serverElapsedMs: nonnegativeInteger,
  minimumRequiredElapsedMs: nonnegativeInteger,
  maximumPlaybackRatePermille: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_MAX_PLAYBACK_RATE_PERMILLE,
  ),
  clockSlackMs: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_CLOCK_SLACK_MS,
  ),
  checkpointRequestHash: sha256,
  idempotencyKeyHash: sha256,
  browserReportedCompletionTrusted: z.literal(false),
  privateLocalDurable: z.literal(true),
  distributedDatabaseBacked: z.literal(false),
  productionDurabilityProven: z.literal(false),
  evidenceHash: sha256,
}).strict().superRefine((value, context) => {
  const startedAtMs = Date.parse(value.startedAt)
  const lastCheckpointAtMs = Date.parse(value.lastCheckpointAt)
  const coveredFrameCount = value.coveredIntervals.reduce(
    (sum, interval) =>
      sum + interval.endFrameExclusive - interval.startFrame,
    0,
  )
  const expectedServerElapsedMs = lastCheckpointAtMs - startedAtMs
  const expectedMinimumRequiredElapsedMs = Math.ceil(
    (
      (value.authority.masterFrameCount - 1) *
      value.authority.frameRateDenominator * 1_000_000
    ) / (
      value.authority.frameRateNumerator *
      value.maximumPlaybackRatePermille
    ),
  )
  const maximumCoveredFrameCount = Math.min(
    value.authority.masterFrameCount,
    1 + Math.floor(
      (
        (value.serverElapsedMs + value.clockSlackMs) *
        value.authority.frameRateNumerator *
        value.maximumPlaybackRatePermille
      ) / (
        value.authority.frameRateDenominator * 1_000_000
      ),
    ),
  )
  const fullProgramPlaybackObserved =
    value.coveredIntervals.length === 1 &&
    value.coveredIntervals[0]?.startFrame === 0 &&
    value.coveredIntervals[0]?.endFrameExclusive ===
      value.authority.masterFrameCount
  const exactFirstCheckpoint =
    value.coveredIntervals.length === 1 &&
    value.coveredIntervals[0]?.startFrame === 0 &&
    value.coveredIntervals[0]?.endFrameExclusive === 1
  if (
    coveredFrameCount !== value.coveredFrameCount ||
    Math.floor(
      (coveredFrameCount * 1_000) / value.authority.masterFrameCount,
    ) !== value.coveragePermille ||
    fullProgramPlaybackObserved !== value.fullProgramPlaybackObserved ||
    value.acceptanceGateSatisfied !== fullProgramPlaybackObserved ||
    (value.sequence === 1) !==
      (value.previousWatchEvidenceHash === null) ||
    (value.sequence === 1 && !exactFirstCheckpoint) ||
    lastCheckpointAtMs < startedAtMs ||
    value.serverElapsedMs !== expectedServerElapsedMs ||
    value.minimumRequiredElapsedMs !== expectedMinimumRequiredElapsedMs ||
    coveredFrameCount > maximumCoveredFrameCount ||
    (
      fullProgramPlaybackObserved &&
      value.serverElapsedMs + value.clockSlackMs <
        value.minimumRequiredElapsedMs
    )
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Customer-delivery watch evidence is inconsistent.',
    })
  }
})

const authorityJsonBlobRefSchema = z.object({
  sha256,
  byteLength: positiveInteger.max(4 * 1024 * 1024),
}).strict()

export const professionalLongFormDeliveryWatchLatestPointerSchema = z.object({
  schemaVersion: z.literal(
    PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_LATEST_POINTER_VERSION,
  ),
  source: z.literal(
    'canonical_professional_long_form_customer_delivery_watch_service',
  ),
  identity: watchIdentitySchema,
  latestSequence: positiveInteger.max(
    PROFESSIONAL_LONG_FORM_DELIVERY_MAX_WATCH_SEQUENCE,
  ),
  latestEvidenceHash: sha256,
  latestEvidenceRef: authorityJsonBlobRefSchema,
  pointerHash: sha256,
}).strict()

export const professionalLongFormDeliveryWatchIdempotencyRecordSchema =
  z.object({
    schemaVersion: z.literal(
      PROFESSIONAL_LONG_FORM_DELIVERY_WATCH_IDEMPOTENCY_VERSION,
    ),
    source: z.literal(
      'canonical_professional_long_form_customer_delivery_watch_service',
    ),
    identity: watchIdentitySchema,
    idempotencyKeyHash: sha256,
    checkpointRequestHash: sha256,
    evidenceHash: sha256,
    evidenceRef: authorityJsonBlobRefSchema,
    recordHash: sha256,
  }).strict()

export type ProfessionalLongFormDeliveryWatchAuthority = z.infer<
  typeof professionalLongFormDeliveryWatchAuthoritySchema
>
export type RecordProfessionalLongFormDeliveryWatchCheckpoint = z.infer<
  typeof recordProfessionalLongFormDeliveryWatchCheckpointSchema
>
export type ProfessionalLongFormDeliveryWatchEvidence = z.infer<
  typeof professionalLongFormDeliveryWatchEvidenceSchema
>
export type ProfessionalLongFormDeliveryWatchLatestPointer = z.infer<
  typeof professionalLongFormDeliveryWatchLatestPointerSchema
>
export type ProfessionalLongFormDeliveryWatchIdempotencyRecord = z.infer<
  typeof professionalLongFormDeliveryWatchIdempotencyRecordSchema
>
