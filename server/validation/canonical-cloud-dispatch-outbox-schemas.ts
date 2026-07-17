import { z } from 'zod'

export const CANONICAL_CLOUD_DISPATCH_OUTBOX_ENTRY_VERSION =
  'canonical-cloud-dispatch-outbox-entry-v1' as const
export const CANONICAL_CLOUD_DISPATCH_OUTBOX_AGGREGATE_VERSION =
  'canonical-cloud-dispatch-outbox-aggregate-v1' as const
export const CANONICAL_CLOUD_DISPATCH_OUTBOX_EVENT_VERSION =
  'canonical-cloud-dispatch-outbox-event-v1' as const
export const CANONICAL_CLOUD_DISPATCH_CONTROLLER_RECEIPT_VERSION =
  'canonical-cloud-dispatch-controller-receipt-v1' as const
export const CANONICAL_CLOUD_DISPATCH_WORKER_RECEIPT_VERSION =
  'canonical-cloud-dispatch-worker-receipt-v1' as const
export const CANONICAL_CLOUD_DISPATCH_WORKER_COMPLETION_EVIDENCE_VERSION =
  'canonical-cloud-dispatch-worker-completion-evidence-v1' as const
export const CANONICAL_CLOUD_DISPATCH_WORKER_COMPLETION_RECEIPT_VERSION =
  'canonical-cloud-dispatch-worker-completion-receipt-v1' as const
export const CANONICAL_CLOUD_DISPATCH_WORKER_INVOCATION_VERSION =
  'canonical-cloud-dispatch-worker-invocation-v1' as const
export const CANONICAL_SERVICE_IDENTITY_EVIDENCE_VERSION =
  'canonical-service-identity-evidence-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const runtimeRegion = z.enum(['us-east1', 'europe-west1'])
const workerType = z.enum([
  'cpu_analysis_worker',
  'gpu_ai_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
])

export const canonicalServiceIdentityEvidenceSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SERVICE_IDENTITY_EVIDENCE_VERSION),
  source: z.literal('trusted_service_identity_verifier_output'),
  verificationMode: z.enum([
    'private_contract_fixture',
    'trusted_jwks_contract_fixture',
    'trusted_google_identity_verifier',
  ]),
  authenticationMechanism: z.enum([
    'google_oidc_id_token',
    'google_cloud_run_workload_identity',
  ]),
  verifierId: identity,
  issuer: z.string().trim().min(1).max(512),
  subject: identity,
  principalEmail: z.string().email(),
  audience: z.string().trim().min(1).max(1_024),
  issuedAt: timestamp,
  expiresAt: timestamp,
  verifiedAt: timestamp,
  emailVerified: z.literal(true),
  issuerVerified: z.literal(true),
  audienceVerified: z.literal(true),
  expiryVerified: z.literal(true),
  cryptographicSignatureVerified: z.boolean(),
  liveGoogleVerificationPerformed: z.boolean(),
  rawBearerTokenRetained: z.literal(false),
  callerAuthoredClaimsAccepted: z.literal(false),
  evidenceHash: sha256,
}).strict().superRefine((evidence, context) => {
  const issuedAt = Date.parse(evidence.issuedAt)
  const expiresAt = Date.parse(evidence.expiresAt)
  const verifiedAt = Date.parse(evidence.verifiedAt)
  if (expiresAt <= issuedAt || verifiedAt < issuedAt || verifiedAt >= expiresAt) {
    context.addIssue({ code: 'custom', message: 'Service identity evidence timing is invalid.' })
  }
  const cryptographicVerification =
    evidence.verificationMode !== 'private_contract_fixture'
  const trustedGoogle =
    evidence.verificationMode === 'trusted_google_identity_verifier'
  if (
    cryptographicVerification !== evidence.cryptographicSignatureVerified ||
    trustedGoogle !== evidence.liveGoogleVerificationPerformed
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Service identity verification mode does not match its cryptographic evidence.',
    })
  }
})

const receiptIdentitySchema = z.object({
  verificationMode: canonicalServiceIdentityEvidenceSchema.shape.verificationMode,
  authenticationMechanism:
    canonicalServiceIdentityEvidenceSchema.shape.authenticationMechanism,
  verifierId: identity,
  issuerHash: sha256,
  subjectHash: sha256,
  principalEmailHash: sha256,
  audienceHash: sha256,
  evidenceHash: sha256,
}).strict()

export const canonicalCloudDispatchControllerReceiptSchema = z.object({
  schemaVersion: z.literal(CANONICAL_CLOUD_DISPATCH_CONTROLLER_RECEIPT_VERSION),
  receiptId: identity,
  dispatchIntentId: identity,
  requestBindingHash: sha256,
  identity: receiptIdentitySchema,
  cloudRunJobRequestHash: sha256,
  acceptedAt: timestamp,
  boundaries: z.object({
    exactOpaqueTaskBodyVerified: z.literal(true),
    exactOutboxAttemptVerified: z.literal(true),
    exactIssuerPrincipalAudienceAndExpiryRequired: z.literal(true),
    rawAuthorizationHeaderAccepted: z.literal(false),
    rawBearerTokenPersisted: z.literal(false),
    cloudRunJobsRunCallPerformed: z.literal(false),
    liveGoogleOidcAndIamVerified: z.boolean(),
    cloudDispatchAuthorized: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  receiptHash: sha256,
}).strict()

export const canonicalCloudDispatchWorkerReceiptSchema = z.object({
  schemaVersion: z.literal(CANONICAL_CLOUD_DISPATCH_WORKER_RECEIPT_VERSION),
  receiptId: identity,
  dispatchIntentId: identity,
  controllerReceiptHash: sha256,
  requestBindingHash: sha256,
  identity: receiptIdentitySchema,
  acceptedAt: timestamp,
  boundaries: z.object({
    exactControllerReceiptVerified: z.literal(true),
    exactOutboxAttemptVerified: z.literal(true),
    exactWorkerPrincipalAudienceAndExpiryRequired: z.literal(true),
    rawAuthorizationHeaderAccepted: z.literal(false),
    rawBearerTokenPersisted: z.literal(false),
    toolOrMediaExecutionStarted: z.literal(false),
    liveGoogleWorkloadIdentityAndIamVerified: z.boolean(),
    productionExecutionAuthorized: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  receiptHash: sha256,
}).strict()

export const canonicalCloudDispatchWorkerCompletionEvidenceSchema = z.object({
  schemaVersion: z.literal(CANONICAL_CLOUD_DISPATCH_WORKER_COMPLETION_EVIDENCE_VERSION),
  artifactId: identity,
  contentType: z.string().trim().min(1).max(160),
  artifactSha256: sha256,
  adapterReplayed: z.boolean(),
  privateArtifactManifestHash: sha256,
  qaEvidenceHash: sha256,
  assetReconciliationEvidenceHash: sha256,
  downstreamLeaseVerificationHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  artifactStorageClass: z.literal('private_internal_test'),
  qaStatus: z.literal('passed'),
  assetReconciliationStatus: z.literal('reconciled'),
  downstreamLeaseStatus: z.literal('verified'),
}).strict()

export const canonicalCloudDispatchWorkerCompletionReceiptSchema = z.object({
  schemaVersion: z.literal(CANONICAL_CLOUD_DISPATCH_WORKER_COMPLETION_RECEIPT_VERSION),
  receiptId: identity,
  dispatchIntentId: identity,
  jobId: identity,
  packageDeliveryAttempt: z.number().int().positive().max(10),
  queueClaimId: identity,
  queueClaimHash: sha256,
  workerReceiptHash: sha256,
  completionEvidenceHash: sha256,
  completionOutcomeHash: sha256,
  queueCompletionHash: sha256,
  attemptInternalCostEvidenceHash: sha256,
  identity: receiptIdentitySchema,
  completedAt: timestamp,
  boundaries: z.object({
    exactWorkerReceiptVerified: z.literal(true),
    exactOutboxAttemptVerified: z.literal(true),
    exactQueueCompletionVerified: z.literal(true),
    privateArtifactManifestRequired: z.literal(true),
    qaPassedRequired: z.literal(true),
    assetReconciliationRequired: z.literal(true),
    downstreamLeaseVerificationRequired: z.literal(true),
    attemptInternalProductionCostEvidenceHashRequired: z.literal(true),
    customerPriceCreditsServiceFeeWalletOrBillingIncluded: z.literal(false),
    rawAuthorizationHeaderAccepted: z.literal(false),
    rawBearerTokenPersisted: z.literal(false),
    rawMediaPromptPathSignedUrlOrCredentialPersisted: z.literal(false),
    toolOrMediaExecutionClaimedByReceipt: z.literal(false),
    liveGoogleWorkloadIdentityAndIamVerified: z.boolean(),
    productionExecutionAuthorized: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  receiptHash: sha256,
}).strict()

export const canonicalCloudDispatchWorkerInvocationSchema = z.object({
  schemaVersion: z.literal(CANONICAL_CLOUD_DISPATCH_WORKER_INVOCATION_VERSION),
  purpose: z.literal('canonical_cloud_dispatch_worker_receiver'),
  dispatchIntentId: identity,
  dispatchBindingHash: sha256,
  attemptPlanHash: sha256,
  controllerReceiptHash: sha256,
}).strict()

const immutableOutboxEntrySchema = z.object({
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  packageRecordId: identity,
  approvedPlanSnapshotId: identity,
  dispatchIntentId: identity,
  jobId: identity,
  packageDeliveryAttempt: z.number().int().positive().max(10),
  queueDefinitionHash: sha256,
  queueJobDefinitionHash: sha256,
  handoffManifestHash: sha256,
  manifestEntryHash: sha256,
  regionAuthorityHash: sha256,
  dispatchBindingHash: sha256,
  attemptPlanHash: sha256,
  queueClaimId: identity,
  queueClaimHash: sha256,
  queueClaimExpiresAt: timestamp,
  queueClaimAttemptDeadlineAt: timestamp,
  workerType,
  resourceClassId: identity,
  placementHash: sha256,
  runtimeRegion,
  cloudTasksQueueResourceName: z.string().trim().min(1).max(768),
  cloudTaskId: identity,
  cloudTaskResourceName: z.string().trim().min(1).max(1_024),
  cloudTaskBodySha256: sha256,
  cloudRunJobResourceName: z.string().trim().min(1).max(768),
  cloudRunJobRequestHash: sha256,
  controllerServiceAccountEmail: z.string().email(),
  workerServiceAccountEmail: z.string().email(),
  targetHash: sha256,
}).strict()

export const canonicalCloudDispatchOutboxEntrySchema = z.object({
  schemaVersion: z.literal(CANONICAL_CLOUD_DISPATCH_OUTBOX_ENTRY_VERSION),
  source: z.literal('canonical_package_queue_cloud_dispatch_outbox'),
  immutable: immutableOutboxEntrySchema,
  state: z.enum([
    'pending_controller_delivery',
    'controller_identity_accepted',
    'worker_identity_accepted',
    'worker_completion_reconciled',
  ]),
  controllerReceipt: canonicalCloudDispatchControllerReceiptSchema.optional(),
  workerReceipt: canonicalCloudDispatchWorkerReceiptSchema.optional(),
  completionReceipt: canonicalCloudDispatchWorkerCompletionReceiptSchema.optional(),
  createdAt: timestamp,
  updatedAt: timestamp,
  immutableEntryHash: sha256,
  entryHash: sha256,
}).strict().superRefine((entry, context) => {
  const hasController = entry.controllerReceipt !== undefined
  const hasWorker = entry.workerReceipt !== undefined
  const hasCompletion = entry.completionReceipt !== undefined
  if (
    (entry.state === 'pending_controller_delivery' &&
      (hasController || hasWorker || hasCompletion)) ||
    (entry.state === 'controller_identity_accepted' &&
      (!hasController || hasWorker || hasCompletion)) ||
    (entry.state === 'worker_identity_accepted' &&
      (!hasController || !hasWorker || hasCompletion)) ||
    (entry.state === 'worker_completion_reconciled' &&
      (!hasController || !hasWorker || !hasCompletion))
  ) {
    context.addIssue({ code: 'custom', message: 'Cloud dispatch outbox state is inconsistent.' })
  }
  if (
    entry.controllerReceipt?.dispatchIntentId !== undefined &&
    entry.controllerReceipt.dispatchIntentId !== entry.immutable.dispatchIntentId
  ) {
    context.addIssue({ code: 'custom', message: 'Controller receipt dispatch identity changed.' })
  }
  if (
    entry.workerReceipt?.dispatchIntentId !== undefined &&
    entry.workerReceipt.dispatchIntentId !== entry.immutable.dispatchIntentId
  ) {
    context.addIssue({ code: 'custom', message: 'Worker receipt dispatch identity changed.' })
  }
  if (
    entry.workerReceipt && entry.controllerReceipt &&
    entry.workerReceipt.controllerReceiptHash !== entry.controllerReceipt.receiptHash
  ) {
    context.addIssue({ code: 'custom', message: 'Worker receipt is not bound to the controller receipt.' })
  }
  if (entry.completionReceipt && (
    entry.completionReceipt.dispatchIntentId !== entry.immutable.dispatchIntentId ||
    entry.completionReceipt.jobId !== entry.immutable.jobId ||
    entry.completionReceipt.packageDeliveryAttempt !==
      entry.immutable.packageDeliveryAttempt ||
    entry.completionReceipt.queueClaimId !== entry.immutable.queueClaimId ||
    entry.completionReceipt.queueClaimHash !== entry.immutable.queueClaimHash ||
    entry.completionReceipt.workerReceiptHash !== entry.workerReceipt?.receiptHash
  )) {
    context.addIssue({
      code: 'custom',
      message: 'Worker completion receipt is not bound to the exact outbox attempt.',
    })
  }
})

export const canonicalCloudDispatchOutboxEventSchema = z.object({
  schemaVersion: z.literal(CANONICAL_CLOUD_DISPATCH_OUTBOX_EVENT_VERSION),
  sequence: z.number().int().positive().max(10_000),
  eventType: z.enum([
    'outbox_entry_created',
    'controller_identity_accepted',
    'worker_identity_accepted',
    'worker_completion_reconciled',
  ]),
  dispatchIntentId: identity,
  jobId: identity,
  packageDeliveryAttempt: z.number().int().positive().max(10),
  at: timestamp,
  previousEventHash: sha256.nullable(),
  eventHash: sha256,
}).strict()

export const canonicalCloudDispatchOutboxAggregateSchema = z.object({
  schemaVersion: z.literal(CANONICAL_CLOUD_DISPATCH_OUTBOX_AGGREGATE_VERSION),
  source: z.literal('private_single_host_canonical_cloud_dispatch_outbox_store'),
  ownerUserId: identity,
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
    queueDefinitionHash: sha256,
    handoffManifestHash: sha256,
  }).strict(),
  revision: z.number().int().nonnegative().max(10_000),
  entries: z.array(canonicalCloudDispatchOutboxEntrySchema).max(256),
  events: z.array(canonicalCloudDispatchOutboxEventSchema).max(1_024),
  summary: z.object({
    totalEntryCount: z.number().int().nonnegative().max(256),
    pendingControllerDeliveryCount: z.number().int().nonnegative().max(256),
    controllerIdentityAcceptedCount: z.number().int().nonnegative().max(256),
    workerIdentityAcceptedCount: z.number().int().nonnegative().max(256),
    workerCompletionReconciledCount: z.number().int().nonnegative().max(256).optional(),
    eventCount: z.number().int().nonnegative().max(1_024),
  }).strict(),
  boundaries: z.object({
    privateLocalPersistence: z.literal(true),
    tenantPackageAndAttemptScoped: z.literal(true),
    checksumProtected: z.literal(true),
    atomicAggregateReplacement: z.literal(true),
    hostRestartRecovery: z.literal(true),
    opaqueHashOnlyHandoffPersistence: z.literal(true),
    rawMediaPromptPathSignedUrlOrCredentialPersisted: z.literal(false),
    packageQueueOwnsApprovedAttempts: z.literal(true),
    crossProcessAtomicClaimProven: z.boolean(),
    distributedOutboxTransactionVerified: z.literal(false),
    liveGoogleOidcAndIamVerified: z.literal(false),
    cloudTaskCreated: z.literal(false),
    cloudRunJobExecuted: z.literal(false),
    workerExecutionAuthorized: z.literal(false),
    cloudDispatchAuthorized: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  updatedAt: timestamp,
  aggregateHash: sha256,
}).strict().superRefine((aggregate, context) => {
  const summary = aggregate.summary
  if (
    aggregate.entries.length !== summary.totalEntryCount ||
    aggregate.entries.filter((entry) => entry.state === 'pending_controller_delivery').length !==
      summary.pendingControllerDeliveryCount ||
    aggregate.entries.filter((entry) => entry.controllerReceipt !== undefined).length !==
      summary.controllerIdentityAcceptedCount ||
    aggregate.entries.filter((entry) => entry.workerReceipt !== undefined).length !==
      summary.workerIdentityAcceptedCount ||
    aggregate.entries.filter((entry) => entry.completionReceipt !== undefined).length !==
      (summary.workerCompletionReconciledCount ?? 0) ||
    aggregate.events.length !== summary.eventCount
  ) {
    context.addIssue({ code: 'custom', message: 'Cloud dispatch outbox summary is inconsistent.' })
  }
  const dispatchIntentIds = aggregate.entries.map((entry) => entry.immutable.dispatchIntentId)
  const packageAttempts = aggregate.entries.map((entry) =>
    `${entry.immutable.jobId}:${entry.immutable.packageDeliveryAttempt}`)
  if (
    new Set(dispatchIntentIds).size !== dispatchIntentIds.length ||
    new Set(packageAttempts).size !== packageAttempts.length
  ) {
    context.addIssue({ code: 'custom', message: 'Cloud dispatch outbox attempt identity is duplicated.' })
  }
  for (const [index, event] of aggregate.events.entries()) {
    if (
      event.sequence !== index + 1 ||
      event.previousEventHash !== (aggregate.events[index - 1]?.eventHash ?? null)
    ) {
      context.addIssue({ code: 'custom', message: 'Cloud dispatch outbox event chain is invalid.' })
      break
    }
  }
})

export type CanonicalServiceIdentityEvidence = z.infer<
  typeof canonicalServiceIdentityEvidenceSchema
>
export type CanonicalCloudDispatchControllerReceipt = z.infer<
  typeof canonicalCloudDispatchControllerReceiptSchema
>
export type CanonicalCloudDispatchWorkerReceipt = z.infer<
  typeof canonicalCloudDispatchWorkerReceiptSchema
>
export type CanonicalCloudDispatchWorkerCompletionEvidence = z.infer<
  typeof canonicalCloudDispatchWorkerCompletionEvidenceSchema
>
export type CanonicalCloudDispatchWorkerCompletionReceipt = z.infer<
  typeof canonicalCloudDispatchWorkerCompletionReceiptSchema
>
export type CanonicalCloudDispatchWorkerInvocation = z.infer<
  typeof canonicalCloudDispatchWorkerInvocationSchema
>
export type CanonicalCloudDispatchOutboxEntry = z.infer<
  typeof canonicalCloudDispatchOutboxEntrySchema
>
export type CanonicalCloudDispatchOutboxEvent = z.infer<
  typeof canonicalCloudDispatchOutboxEventSchema
>
export type CanonicalCloudDispatchOutboxAggregate = z.infer<
  typeof canonicalCloudDispatchOutboxAggregateSchema
>
