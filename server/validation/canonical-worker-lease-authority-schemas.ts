import { z } from 'zod'

export const CANONICAL_PRIVATE_LOCAL_WORKER_IDENTITY = 'private-local-canonical-worker-v1' as const
export const CANONICAL_WORKER_LEASE_RECORD_VERSION = 'canonical-worker-lease-record-v2' as const
export const CANONICAL_WORKER_LEASE_AGGREGATE_VERSION = 'canonical-worker-lease-aggregate-v1' as const
export const CANONICAL_WORKER_LEASE_RESPONSE_VERSION = 'canonical-worker-lease-response-v2' as const
export const CANONICAL_WORKER_LEASE_VERIFICATION_VERSION = 'canonical-worker-lease-verification-v2' as const

const safeIdentitySchema = z.string()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'), 'Unsafe identity.')

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const timestampSchema = z.string().datetime({ offset: true })
const idempotencyKeySchema = z.string()
  .min(1)
  .max(240)
  .refine((value) => value === value.trim(), 'Idempotency key must not have surrounding whitespace.')
  .refine((value) => Array.from(value).every((character) => {
    const code = character.charCodeAt(0)
    return code > 31 && code !== 127
  }), 'Idempotency key contains control characters.')

export const canonicalWorkerLeaseCredentialSchema = z.string()
  .regex(/^rpwl_v1_[A-Za-z0-9_-]{43}$/)

export const canonicalWorkerLeaseHashesSchema = z.object({
  snapshotHash: sha256Schema,
  planHash: sha256Schema,
  estimateHash: sha256Schema,
  workGraphHash: sha256Schema,
  sourceSequenceHash: sha256Schema,
  timingHash: sha256Schema,
  planningInputBindingHash: sha256Schema,
  approvedSourceAssetManifestHash: sha256Schema,
  approvedAssetManifestHash: sha256Schema,
  executionPackageHash: sha256Schema,
  jobAuthorityHash: sha256Schema,
}).strict()

const canonicalWorkerLeaseDependencySelectionSchema = z.object({
  dependencyJobId: safeIdentitySchema,
  expectedAssetId: safeIdentitySchema,
  artifactId: safeIdentitySchema,
  artifactVersion: z.number().int().positive().max(10_000),
  contentSha256: sha256Schema,
  qaEvaluationId: safeIdentitySchema,
  reconciliationId: safeIdentitySchema,
  executionAttemptId: safeIdentitySchema,
  sourceLeaseImmutableHash: sha256Schema,
}).strict()

export const canonicalWorkerLeaseDependencyAuthoritySchema = z.object({
  state: z.enum(['not_required_for_root_job', 'private_test_dependencies_verified']),
  readinessHash: sha256Schema,
  selectedArtifacts: z.array(canonicalWorkerLeaseDependencySelectionSchema).max(2_048),
  authorityHash: sha256Schema,
  liveRuntimeEligible: z.literal(false),
}).strict().superRefine((authority, context) => {
  if (
    (authority.state === 'not_required_for_root_job' && authority.selectedArtifacts.length !== 0) ||
    (authority.state === 'private_test_dependencies_verified' && authority.selectedArtifacts.length === 0)
  ) {
    context.addIssue({ code: 'custom', message: 'Worker lease dependency authority state is inconsistent.' })
  }
  const identities = authority.selectedArtifacts.map((selection) =>
    `${selection.dependencyJobId}\u0000${selection.expectedAssetId}`)
  if (new Set(identities).size !== identities.length) {
    context.addIssue({ code: 'custom', message: 'Worker lease dependency selections must be unique.' })
  }
})

export const canonicalWorkerLeaseExecutionFenceSchema = z.object({
  state: z.enum(['not_started', 'started', 'completed']),
  executionAttemptId: safeIdentitySchema.optional(),
  runnerClass: safeIdentitySchema.optional(),
  startedAt: timestampSchema.optional(),
  commitAuthorizedAt: timestampSchema.optional(),
  completedAt: timestampSchema.optional(),
}).strict().superRefine((fence, context) => {
  const noExecutionFields =
    fence.executionAttemptId === undefined &&
    fence.runnerClass === undefined &&
    fence.startedAt === undefined &&
    fence.commitAuthorizedAt === undefined &&
    fence.completedAt === undefined
  if (fence.state === 'not_started' && !noExecutionFields) {
    context.addIssue({ code: 'custom', message: 'A not-started lease cannot carry execution-fence fields.' })
  }
  if (fence.state === 'started' && (
    !fence.executionAttemptId || !fence.runnerClass || !fence.startedAt ||
    fence.commitAuthorizedAt !== undefined || fence.completedAt !== undefined
  )) {
    context.addIssue({ code: 'custom', message: 'A started lease execution fence is incomplete.' })
  }
  if (fence.state === 'completed' && (
    !fence.executionAttemptId || !fence.runnerClass || !fence.startedAt ||
    !fence.commitAuthorizedAt || !fence.completedAt
  )) {
    context.addIssue({ code: 'custom', message: 'A completed lease execution fence is incomplete.' })
  }
})

const canonicalWorkerLeaseIdentitySchema = z.object({
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  jobId: safeIdentitySchema,
}).strict()

export const claimCanonicalWorkerLeaseSchema = canonicalWorkerLeaseIdentitySchema.extend({
  purpose: z.literal('private_internal_canonical_lease_claim'),
  idempotencyKey: idempotencyKeySchema,
}).strict()

export const heartbeatCanonicalWorkerLeaseSchema = canonicalWorkerLeaseIdentitySchema.extend({
  purpose: z.literal('private_internal_canonical_lease_heartbeat'),
  leaseId: safeIdentitySchema,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
  idempotencyKey: idempotencyKeySchema,
}).strict()

export const releaseCanonicalWorkerLeaseSchema = canonicalWorkerLeaseIdentitySchema.extend({
  purpose: z.literal('private_internal_canonical_lease_release'),
  leaseId: safeIdentitySchema,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
  idempotencyKey: idempotencyKeySchema,
}).strict()

export const verifyCanonicalWorkerLeaseSchema = canonicalWorkerLeaseIdentitySchema.extend({
  purpose: z.literal('private_internal_canonical_lease_verification'),
  leaseId: safeIdentitySchema,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
}).strict()

export const claimCanonicalWorkerLeaseRouteBodySchema = claimCanonicalWorkerLeaseSchema.omit({
  jobId: true,
  idempotencyKey: true,
})

export const heartbeatCanonicalWorkerLeaseRouteBodySchema = heartbeatCanonicalWorkerLeaseSchema.omit({
  jobId: true,
  leaseId: true,
  leaseCredential: true,
  idempotencyKey: true,
})

export const releaseCanonicalWorkerLeaseRouteBodySchema = releaseCanonicalWorkerLeaseSchema.omit({
  jobId: true,
  leaseId: true,
  leaseCredential: true,
  idempotencyKey: true,
})

export const canonicalWorkerLeaseRecordSchema = z.object({
  schemaVersion: z.literal(CANONICAL_WORKER_LEASE_RECORD_VERSION),
  id: safeIdentitySchema,
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  jobId: safeIdentitySchema,
  approvedPlanSnapshotId: safeIdentitySchema,
  reservationId: safeIdentitySchema,
  workerIdentity: z.literal(CANONICAL_PRIVATE_LOCAL_WORKER_IDENTITY),
  attemptNumber: z.number().int().positive().max(10),
  status: z.enum(['active', 'released', 'expired']),
  claimRequestHash: sha256Schema,
  credentialHashSha256: sha256Schema,
  authorityRevisionAtClaim: z.number().int().positive(),
  canonicalHashes: canonicalWorkerLeaseHashesSchema,
  dependencyAuthority: canonicalWorkerLeaseDependencyAuthoritySchema,
  executionFence: canonicalWorkerLeaseExecutionFenceSchema,
  immutableLeaseHash: sha256Schema,
  issuedAt: timestampSchema,
  attemptDeadlineAt: timestampSchema,
  initialExpiresAt: timestampSchema,
  heartbeatAt: timestampSchema,
  expiresAt: timestampSchema,
  releasedAt: timestampSchema.optional(),
  expiredAt: timestampSchema.optional(),
}).strict().superRefine((lease, context) => {
  const issuedAt = Date.parse(lease.issuedAt)
  const attemptDeadlineAt = Date.parse(lease.attemptDeadlineAt)
  const initialExpiresAt = Date.parse(lease.initialExpiresAt)
  const heartbeatAt = Date.parse(lease.heartbeatAt)
  const expiresAt = Date.parse(lease.expiresAt)
  if (
    attemptDeadlineAt <= issuedAt ||
    initialExpiresAt <= issuedAt ||
    initialExpiresAt > attemptDeadlineAt ||
    heartbeatAt < issuedAt ||
    heartbeatAt > attemptDeadlineAt ||
    expiresAt < initialExpiresAt ||
    expiresAt > attemptDeadlineAt
  ) {
    context.addIssue({ code: 'custom', message: 'Worker lease timestamps are inconsistent.' })
  }
  if (
    (lease.status === 'active' && (lease.releasedAt !== undefined || lease.expiredAt !== undefined)) ||
    (lease.status === 'released' && (lease.releasedAt === undefined || lease.expiredAt !== undefined)) ||
    (lease.status === 'expired' && (lease.expiredAt === undefined || lease.releasedAt !== undefined))
  ) {
    context.addIssue({ code: 'custom', message: 'Worker lease terminal state is inconsistent.' })
  }
  if (
    (lease.releasedAt !== undefined && (
      Date.parse(lease.releasedAt) < issuedAt || Date.parse(lease.releasedAt) > expiresAt
    )) ||
    (lease.expiredAt !== undefined && Date.parse(lease.expiredAt) < expiresAt)
  ) {
    context.addIssue({ code: 'custom', message: 'Worker lease terminal timestamp is inconsistent.' })
  }
  if (
    lease.executionFence.startedAt !== undefined && (
      Date.parse(lease.executionFence.startedAt) < issuedAt ||
      Date.parse(lease.executionFence.startedAt) > attemptDeadlineAt
    )
  ) {
    context.addIssue({ code: 'custom', message: 'Worker execution-fence start is outside the lease attempt window.' })
  }
  if (
    lease.executionFence.commitAuthorizedAt !== undefined &&
    Date.parse(lease.executionFence.commitAuthorizedAt) > attemptDeadlineAt
  ) {
    context.addIssue({ code: 'custom', message: 'Worker execution-fence commit exceeded the approved attempt deadline.' })
  }
})

export const canonicalWorkerLeaseIdempotencyRecordSchema = z.object({
  operation: z.enum(['claim', 'heartbeat', 'release']),
  keyHash: sha256Schema,
  requestHash: sha256Schema,
  leaseId: safeIdentitySchema,
  responseStatus: z.enum(['active', 'released']),
  responseAt: timestampSchema,
  responseExpiresAt: timestampSchema,
  completedAt: timestampSchema,
}).strict()

export const canonicalWorkerLeaseAuditEventSchema = z.object({
  id: safeIdentitySchema,
  eventType: z.enum(['claimed', 'heartbeat', 'released', 'expired', 'execution_started', 'execution_completed']),
  leaseId: safeIdentitySchema,
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  jobId: safeIdentitySchema,
  attemptNumber: z.number().int().positive().max(10),
  createdAt: timestampSchema,
}).strict()

export const canonicalWorkerLeaseAggregateSchema = z.object({
  schemaVersion: z.literal(CANONICAL_WORKER_LEASE_AGGREGATE_VERSION),
  source: z.literal('private_single_host_canonical_worker_lease_authority'),
  workspaceId: safeIdentitySchema,
  ownerUserId: safeIdentitySchema,
  revision: z.number().int().nonnegative(),
  leases: z.array(canonicalWorkerLeaseRecordSchema).max(2_000),
  idempotencyRecords: z.array(canonicalWorkerLeaseIdempotencyRecordSchema).max(4_096),
  auditEvents: z.array(canonicalWorkerLeaseAuditEventSchema).max(10_000),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
}).strict()

export const persistedCanonicalWorkerLeaseAggregateSchema = z.object({
  recordVersion: z.literal(CANONICAL_WORKER_LEASE_AGGREGATE_VERSION),
  source: z.literal('private_single_host_canonical_worker_lease_store'),
  aggregate: canonicalWorkerLeaseAggregateSchema,
  checksumSha256: sha256Schema,
}).strict()

const safeLeaseViewSchema = z.object({
  leaseId: safeIdentitySchema,
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  jobId: safeIdentitySchema,
  approvedPlanSnapshotId: safeIdentitySchema,
  reservationId: safeIdentitySchema,
  workerIdentity: z.literal(CANONICAL_PRIVATE_LOCAL_WORKER_IDENTITY),
  attemptNumber: z.number().int().positive().max(10),
  status: z.enum(['active', 'released']),
  issuedAt: timestampSchema,
  attemptDeadlineAt: timestampSchema,
  responseAt: timestampSchema,
  expiresAt: timestampSchema,
  canonicalHashes: canonicalWorkerLeaseHashesSchema,
  dependencyAuthority: canonicalWorkerLeaseDependencyAuthoritySchema,
  executionFence: canonicalWorkerLeaseExecutionFenceSchema,
  immutableLeaseHash: sha256Schema,
}).strict()

const nonExecutionAuthoritySchema = z.object({
  workerClaimRecorded: z.literal(true),
  dispatchAuthorized: z.literal(false),
  toolExecutionAuthorized: z.literal(false),
  providerCallAuthorized: z.literal(false),
  sourceObjectReadAuthorized: z.literal(false),
  artifactWriteAuthorized: z.literal(false),
  renderAuthorized: z.literal(false),
  creditSpendAuthorized: z.literal(false),
  noExecutionSideEffects: z.literal(true),
}).strict()

const persistenceEvidenceSchema = z.object({
  singleHostPrivateLocalOnly: z.literal(true),
  singleProcessSerializationOnly: z.literal(true),
  restartSafeChecksumProtected: z.literal(true),
  credentialStoredAsSha256Only: z.literal(true),
  distributedAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

export const canonicalWorkerLeaseClaimResponseSchema = z.object({
  schemaVersion: z.literal(CANONICAL_WORKER_LEASE_RESPONSE_VERSION),
  source: z.literal('canonical_worker_lease_authority'),
  purpose: z.literal('private_internal_canonical_lease_claim'),
  lease: safeLeaseViewSchema.extend({ status: z.literal('active') }).strict(),
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
  credentialPolicy: z.object({
    serverDerivedCredential: z.literal(true),
    routeMustRequireDualAuthenticationBeforeMount: z.literal(true),
    plaintextPersisted: z.literal(false),
    plaintextLogged: z.literal(false),
    timingSafeVerificationRequired: z.literal(true),
  }).strict(),
  executionAuthority: nonExecutionAuthoritySchema,
  persistenceEvidence: persistenceEvidenceSchema,
  testOnly: z.literal(true),
}).strict()

export const canonicalWorkerLeaseHeartbeatResponseSchema = z.object({
  schemaVersion: z.literal(CANONICAL_WORKER_LEASE_RESPONSE_VERSION),
  source: z.literal('canonical_worker_lease_authority'),
  purpose: z.literal('private_internal_canonical_lease_heartbeat'),
  lease: safeLeaseViewSchema.extend({ status: z.literal('active') }).strict(),
  executionAuthority: nonExecutionAuthoritySchema,
  persistenceEvidence: persistenceEvidenceSchema,
  testOnly: z.literal(true),
}).strict()

export const canonicalWorkerLeaseReleaseResponseSchema = z.object({
  schemaVersion: z.literal(CANONICAL_WORKER_LEASE_RESPONSE_VERSION),
  source: z.literal('canonical_worker_lease_authority'),
  purpose: z.literal('private_internal_canonical_lease_release'),
  lease: safeLeaseViewSchema.extend({ status: z.literal('released') }).strict(),
  executionAuthority: nonExecutionAuthoritySchema,
  persistenceEvidence: persistenceEvidenceSchema,
  testOnly: z.literal(true),
}).strict()

export const canonicalWorkerLeaseVerificationResponseSchema = z.object({
  schemaVersion: z.literal(CANONICAL_WORKER_LEASE_VERIFICATION_VERSION),
  source: z.literal('canonical_worker_lease_authority'),
  purpose: z.literal('private_internal_canonical_lease_verification'),
  verified: z.literal(true),
  verifiedAt: timestampSchema,
  lease: z.object({
    leaseId: safeIdentitySchema,
    workspaceId: safeIdentitySchema,
    projectId: safeIdentitySchema,
    editSessionId: safeIdentitySchema,
    jobId: safeIdentitySchema,
    approvedPlanSnapshotId: safeIdentitySchema,
    reservationId: safeIdentitySchema,
    workerIdentity: z.literal(CANONICAL_PRIVATE_LOCAL_WORKER_IDENTITY),
    attemptNumber: z.number().int().positive().max(10),
    status: z.literal('active'),
    issuedAt: timestampSchema,
    heartbeatAt: timestampSchema,
    attemptDeadlineAt: timestampSchema,
    expiresAt: timestampSchema,
    canonicalHashes: canonicalWorkerLeaseHashesSchema,
    dependencyAuthority: canonicalWorkerLeaseDependencyAuthoritySchema,
    executionFence: canonicalWorkerLeaseExecutionFenceSchema,
    immutableLeaseHash: sha256Schema,
  }).strict(),
  verificationEvidence: z.object({
    tenantAuthorization: z.literal('passed'),
    checksumProtectedStore: z.literal('passed'),
    timingSafeCredentialMatch: z.literal('passed'),
    activeAndUnexpired: z.literal('passed'),
    currentCanonicalReadiness: z.literal('passed'),
    currentReservation: z.literal('passed'),
    currentSourcePackageJobHashes: z.literal('passed'),
    currentDependencyAuthority: z.literal('passed'),
    executionFenceStateVerified: z.literal('passed'),
    leaseRenewed: z.literal(false),
    credentialReturned: z.literal(false),
    credentialHashReturned: z.literal(false),
  }).strict(),
  executionAuthority: nonExecutionAuthoritySchema,
  persistenceEvidence: persistenceEvidenceSchema,
  verificationHash: sha256Schema,
  testOnly: z.literal(true),
}).strict()

export type ClaimCanonicalWorkerLeaseInput = z.infer<typeof claimCanonicalWorkerLeaseSchema>
export type HeartbeatCanonicalWorkerLeaseInput = z.infer<typeof heartbeatCanonicalWorkerLeaseSchema>
export type ReleaseCanonicalWorkerLeaseInput = z.infer<typeof releaseCanonicalWorkerLeaseSchema>
export type VerifyCanonicalWorkerLeaseInput = z.infer<typeof verifyCanonicalWorkerLeaseSchema>
export type CanonicalWorkerLeaseRecord = z.infer<typeof canonicalWorkerLeaseRecordSchema>
export type CanonicalWorkerLeaseAggregate = z.infer<typeof canonicalWorkerLeaseAggregateSchema>
export type CanonicalWorkerLeaseHashes = z.infer<typeof canonicalWorkerLeaseHashesSchema>
export type CanonicalWorkerLeaseDependencyAuthority = z.infer<typeof canonicalWorkerLeaseDependencyAuthoritySchema>
export type CanonicalWorkerLeaseExecutionFence = z.infer<typeof canonicalWorkerLeaseExecutionFenceSchema>
export type CanonicalWorkerLeaseIdempotencyRecord = z.infer<typeof canonicalWorkerLeaseIdempotencyRecordSchema>
export type CanonicalWorkerLeaseClaimResponse = z.infer<typeof canonicalWorkerLeaseClaimResponseSchema>
export type CanonicalWorkerLeaseHeartbeatResponse = z.infer<typeof canonicalWorkerLeaseHeartbeatResponseSchema>
export type CanonicalWorkerLeaseReleaseResponse = z.infer<typeof canonicalWorkerLeaseReleaseResponseSchema>
export type CanonicalWorkerLeaseVerificationResponse = z.infer<typeof canonicalWorkerLeaseVerificationResponseSchema>
