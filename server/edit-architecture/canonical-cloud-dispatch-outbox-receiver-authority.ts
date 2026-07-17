import { ApiError } from '../errors/api-error'
import {
  canonicalCloudWorkerDispatchAttemptPlanSchema,
  canonicalCloudWorkerDispatchHandoffManifestSchema,
  type CanonicalCloudWorkerDispatchAttemptPlan,
  type CanonicalCloudWorkerDispatchHandoffManifest,
} from './canonical-cloud-worker-dispatch-handoff-authority'
import {
  canonicalPrivatePackageWorkQueueDefinitionSchema,
  type CanonicalPrivatePackageWorkQueueDefinition,
} from './canonical-private-package-work-queue-authority'
import {
  canonicalPrivatePackageWorkQueueAggregateSchema,
  canonicalPrivatePackageWorkQueueCompletionSchema,
  type CanonicalPrivatePackageWorkQueueAggregate,
  type CanonicalPrivatePackageWorkQueueCompletion,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  CANONICAL_CLOUD_DISPATCH_CONTROLLER_RECEIPT_VERSION,
  CANONICAL_CLOUD_DISPATCH_OUTBOX_ENTRY_VERSION,
  CANONICAL_CLOUD_DISPATCH_WORKER_COMPLETION_RECEIPT_VERSION,
  CANONICAL_CLOUD_DISPATCH_WORKER_RECEIPT_VERSION,
  canonicalCloudDispatchControllerReceiptSchema,
  canonicalCloudDispatchOutboxEntrySchema,
  canonicalCloudDispatchWorkerCompletionEvidenceSchema,
  canonicalCloudDispatchWorkerCompletionReceiptSchema,
  canonicalCloudDispatchWorkerInvocationSchema,
  canonicalCloudDispatchWorkerReceiptSchema,
  canonicalServiceIdentityEvidenceSchema,
  type CanonicalCloudDispatchControllerReceipt,
  type CanonicalCloudDispatchOutboxEntry,
  type CanonicalCloudDispatchWorkerCompletionEvidence,
  type CanonicalCloudDispatchWorkerCompletionReceipt,
  type CanonicalCloudDispatchWorkerInvocation,
  type CanonicalCloudDispatchWorkerReceipt,
  type CanonicalServiceIdentityEvidence,
} from '../validation/canonical-cloud-dispatch-outbox-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalVerifiedServiceIdentity,
  type CanonicalVerifiedServiceIdentity,
} from '../security/canonical-service-identity-verifier'

const GOOGLE_IDENTITY_ISSUER = 'https://accounts.google.com'
const PRIVATE_FIXTURE_VERIFIER_ID = 'reeditpro-private-contract-fixture'
const TRUSTED_JWKS_FIXTURE_VERIFIER_ID = 'reeditpro-trusted-jwks-contract-fixture'
const TRUSTED_GOOGLE_VERIFIER_ID = 'reeditpro-google-identity-verifier'

export function createCanonicalCloudDispatchOutboxEntry(input: {
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  attemptPlan: CanonicalCloudWorkerDispatchAttemptPlan
  now: string
}): CanonicalCloudDispatchOutboxEntry {
  const authority = assertCanonicalCloudDispatchAttemptAuthority(input)
  const { queueClaim, queueJob, manifestEntry, attemptPlan } = authority
  const cloudTask = attemptPlan.cloudTask!
  const cloudRunJob = attemptPlan.cloudRunJob!
  const createdAt = validTimestamp(input.now, 'outbox creation')
  if (
    Date.parse(createdAt) < Date.parse(queueClaim.claimedAt) ||
    Date.parse(createdAt) >= Date.parse(queueClaim.expiresAt) ||
    Date.parse(createdAt) >= Date.parse(queueClaim.attemptDeadlineAt)
  ) {
    throw new ApiError(
      'WORKER_LEASE_EXPIRED',
      'Cloud dispatch outbox creation requires the exact active package attempt.',
      409,
    )
  }

  return finalizeCanonicalCloudDispatchOutboxEntry({
    schemaVersion: CANONICAL_CLOUD_DISPATCH_OUTBOX_ENTRY_VERSION,
    source: 'canonical_package_queue_cloud_dispatch_outbox',
    immutable: {
      workspaceId: input.queueDefinition.identity.workspaceId,
      projectId: input.queueDefinition.identity.projectId,
      editSessionId: input.queueDefinition.identity.editSessionId,
      packageRecordId: input.queueDefinition.identity.packageRecordId,
      approvedPlanSnapshotId: input.queueDefinition.identity.approvedPlanSnapshotId,
      dispatchIntentId: attemptPlan.dispatchIntentId,
      jobId: attemptPlan.jobId,
      packageDeliveryAttempt: attemptPlan.deliveryAttempt,
      queueDefinitionHash: input.queueDefinition.definitionHash,
      queueJobDefinitionHash: queueJob.definition.definitionHash,
      handoffManifestHash: input.manifest.manifestHash,
      manifestEntryHash: manifestEntry.entryHash,
      regionAuthorityHash: input.manifest.identity.regionAuthorityHash,
      dispatchBindingHash: attemptPlan.dispatchBindingHash,
      attemptPlanHash: attemptPlan.attemptPlanHash,
      queueClaimId: queueClaim.claimId,
      queueClaimHash: queueClaim.claimHash,
      queueClaimExpiresAt: queueClaim.expiresAt,
      queueClaimAttemptDeadlineAt: queueClaim.attemptDeadlineAt,
      workerType: manifestEntry.workerType as Exclude<
        typeof manifestEntry.workerType,
        'api_service'
      >,
      resourceClassId: manifestEntry.resourceClassId,
      placementHash: manifestEntry.placementHash,
      runtimeRegion: attemptPlan.runtimeRegion,
      cloudTasksQueueResourceName: cloudTask.queueResourceName,
      cloudTaskId: cloudTask.taskId,
      cloudTaskResourceName: cloudTask.taskResourceName,
      cloudTaskBodySha256: cloudTask.bodySha256,
      cloudRunJobResourceName: cloudRunJob.jobResourceName,
      cloudRunJobRequestHash: sha256AuthorityValue(cloudRunJob),
      controllerServiceAccountEmail: cloudTask.oidcServiceAccountEmail,
      workerServiceAccountEmail: cloudRunJob.serviceAccountEmail,
      targetHash: manifestEntry.target.targetHash,
    },
    state: 'pending_controller_delivery',
    createdAt,
    updatedAt: createdAt,
  })
}

export function assertCanonicalCloudDispatchAttemptAuthority(input: {
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  attemptPlan: CanonicalCloudWorkerDispatchAttemptPlan
}): {
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  attemptPlan: CanonicalCloudWorkerDispatchAttemptPlan
  queueJob: CanonicalPrivatePackageWorkQueueAggregate['entries'][number]
  queueClaim: NonNullable<CanonicalPrivatePackageWorkQueueAggregate['entries'][number]['activeClaim']>
  manifestEntry: CanonicalCloudWorkerDispatchHandoffManifest['entries'][number]
} {
  const queueDefinition = assertQueueDefinitionIntegrity(input.queueDefinition)
  const queueAggregate = assertQueueAggregateIntegrity(input.queueAggregate, queueDefinition)
  const manifest = assertManifestIntegrity(input.manifest)
  const attemptPlan = assertAttemptPlanIntegrity(input.attemptPlan)

  if (
    queueAggregate.definitionHash !== queueDefinition.definitionHash ||
    manifest.identity.queueDefinitionHash !== queueDefinition.definitionHash ||
    attemptPlan.queueDefinitionHash !== queueDefinition.definitionHash ||
    attemptPlan.handoffManifestHash !== manifest.manifestHash ||
    attemptPlan.regionAuthorityHash !== manifest.identity.regionAuthorityHash ||
    manifest.runtimeRegion !== attemptPlan.runtimeRegion ||
    stableAuthorityStringify(queueAggregate.identity) !==
      stableAuthorityStringify(queueDefinition.identity)
  ) {
    throw invalidAuthority('Cloud dispatch outbox authority lineage changed.')
  }

  const queueJob = queueAggregate.entries.find((entry) =>
    entry.definition.jobId === attemptPlan.jobId)
  const manifestEntry = manifest.entries.find((entry) => entry.jobId === attemptPlan.jobId)
  const queueClaim = queueJob?.activeClaim
  if (
    !queueJob || !manifestEntry || !queueClaim || queueJob.state !== 'leased' ||
    attemptPlan.cloudTask === null || attemptPlan.cloudRunJob === null ||
    manifestEntry.workerType === 'api_service' ||
    queueJob.definition.definitionHash !== manifestEntry.queueJobDefinitionHash ||
    queueJob.definition.workerType !== manifestEntry.workerType ||
    queueJob.definition.resourceClassId !== manifestEntry.resourceClassId ||
    queueJob.definition.placementHash !== manifestEntry.placementHash ||
    queueClaim.deliveryAttempt !== attemptPlan.deliveryAttempt ||
    queueClaim.deliveryAttempt !== queueJob.deliveryAttemptCount ||
    queueClaim.workerType !== manifestEntry.workerType ||
    queueClaim.resourceClassId !== manifestEntry.resourceClassId ||
    queueClaim.placementHash !== manifestEntry.placementHash ||
    manifestEntry.entryHash !== attemptPlan.manifestEntryHash ||
    manifestEntry.runtimeRegion !== attemptPlan.runtimeRegion ||
    attemptPlan.cloudTask.taskBody.dispatchIntentId !== attemptPlan.dispatchIntentId ||
    attemptPlan.cloudTask.taskBody.dispatchBindingHash !== attemptPlan.dispatchBindingHash ||
    attemptPlan.cloudTask.taskBody.deliveryAttempt !== attemptPlan.deliveryAttempt ||
    attemptPlan.cloudTask.taskBody.jobId !== attemptPlan.jobId ||
    attemptPlan.cloudTask.bodySha256 !==
      sha256AuthorityValue(attemptPlan.cloudTask.taskBody) ||
    attemptPlan.cloudRunJob.environmentOverrides.REEDITPRO_DISPATCH_INTENT_ID !==
      attemptPlan.dispatchIntentId ||
    attemptPlan.cloudRunJob.environmentOverrides.REEDITPRO_DISPATCH_BINDING_HASH !==
      attemptPlan.dispatchBindingHash ||
    attemptPlan.cloudRunJob.serviceAccountEmail !==
      manifestEntry.target.workerServiceAccountEmail ||
    attemptPlan.cloudRunJob.taskMaxRetries !== 0
  ) {
    throw invalidAuthority('Cloud dispatch outbox requires one exact active package attempt.')
  }

  return {
    queueDefinition,
    queueAggregate,
    manifest,
    attemptPlan,
    queueJob,
    queueClaim,
    manifestEntry,
  }
}

export function assertCanonicalCloudDispatchOutboxEntryIntegrity(
  value: unknown,
): CanonicalCloudDispatchOutboxEntry {
  const parsed = canonicalCloudDispatchOutboxEntrySchema.safeParse(value)
  if (!parsed.success) throw invalidAuthority('Cloud dispatch outbox entry shape is invalid.')
  const { entryHash, immutableEntryHash, ...payload } = parsed.data
  if (
    immutableEntryHash !== sha256AuthorityValue(parsed.data.immutable) ||
    entryHash !== sha256AuthorityValue({ ...payload, immutableEntryHash }) ||
    !receiptHashesValid(parsed.data)
  ) {
    throw invalidAuthority('Cloud dispatch outbox entry integrity is invalid.')
  }
  return parsed.data
}

export function assertCanonicalCloudDispatchOutboxCurrentAttempt(input: {
  entry: CanonicalCloudDispatchOutboxEntry
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  attemptPlan: CanonicalCloudWorkerDispatchAttemptPlan
  now: string
  allowReconciledCompletionReplay?: boolean
}): void {
  const entry = assertCanonicalCloudDispatchOutboxEntryIntegrity(input.entry)
  const now = validTimestamp(input.now, 'current outbox attempt verification')
  if (
    input.allowReconciledCompletionReplay === true &&
    entry.state === 'worker_completion_reconciled'
  ) {
    assertCanonicalCloudDispatchCompletedAttemptReplay({ ...input, entry })
    return
  }
  const authority = assertCanonicalCloudDispatchAttemptAuthority(input)
  assertEntryMatchesAttempt(entry, authority.attemptPlan)
  if (
    authority.queueClaim.claimId !== entry.immutable.queueClaimId ||
    authority.queueClaim.deliveryAttempt !== entry.immutable.packageDeliveryAttempt ||
    authority.queueClaim.attemptDeadlineAt !== entry.immutable.queueClaimAttemptDeadlineAt ||
    authority.queueJob.definition.definitionHash !== entry.immutable.queueJobDefinitionHash ||
    authority.manifestEntry.target.targetHash !== entry.immutable.targetHash ||
    Date.parse(authority.queueClaim.expiresAt) <= Date.parse(now) ||
    Date.parse(authority.queueClaim.attemptDeadlineAt) <= Date.parse(now)
  ) {
    throw new ApiError(
      'WORKER_LEASE_EXPIRED',
      'Cloud dispatch receiver requires the exact active package attempt.',
      409,
    )
  }
}

function assertCanonicalCloudDispatchCompletedAttemptReplay(input: {
  entry: CanonicalCloudDispatchOutboxEntry
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  queueAggregate: CanonicalPrivatePackageWorkQueueAggregate
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  attemptPlan: CanonicalCloudWorkerDispatchAttemptPlan
}): void {
  const queueDefinition = assertQueueDefinitionIntegrity(input.queueDefinition)
  const queueAggregate = assertQueueAggregateIntegrity(
    input.queueAggregate,
    queueDefinition,
  )
  const manifest = assertManifestIntegrity(input.manifest)
  const attemptPlan = assertAttemptPlanIntegrity(input.attemptPlan)
  assertEntryMatchesAttempt(input.entry, attemptPlan)
  const queueEntry = queueAggregate.entries.find((entry) =>
    entry.definition.jobId === input.entry.immutable.jobId)
  const manifestEntry = manifest.entries.find((entry) =>
    entry.jobId === input.entry.immutable.jobId)
  const completion = queueEntry?.completion
  const completionReceipt = input.entry.completionReceipt
  if (
    queueAggregate.definitionHash !== queueDefinition.definitionHash ||
    manifest.identity.queueDefinitionHash !== queueDefinition.definitionHash ||
    attemptPlan.queueDefinitionHash !== queueDefinition.definitionHash ||
    attemptPlan.handoffManifestHash !== manifest.manifestHash ||
    attemptPlan.regionAuthorityHash !== manifest.identity.regionAuthorityHash ||
    manifest.runtimeRegion !== attemptPlan.runtimeRegion ||
    stableAuthorityStringify(queueAggregate.identity) !==
      stableAuthorityStringify(queueDefinition.identity) ||
    queueEntry?.state !== 'completed' || !completion || !completionReceipt ||
    !input.entry.controllerReceipt || !input.entry.workerReceipt || !manifestEntry ||
    queueEntry.deliveryAttemptCount !== input.entry.immutable.packageDeliveryAttempt ||
    completion.claimId !== input.entry.immutable.queueClaimId ||
    completion.completionHash !== completionReceipt.queueCompletionHash ||
    completionReceipt.completionOutcomeHash !== sha256AuthorityValue(completion.outcome) ||
    completionReceipt.workerReceiptHash !== input.entry.workerReceipt.receiptHash ||
    queueEntry.definition.definitionHash !== input.entry.immutable.queueJobDefinitionHash ||
    manifestEntry.entryHash !== input.entry.immutable.manifestEntryHash ||
    manifestEntry.target.targetHash !== input.entry.immutable.targetHash ||
    Date.parse(completion.completedAt) >=
      Date.parse(input.entry.immutable.queueClaimAttemptDeadlineAt) ||
    completionReceipt.completedAt !== completion.completedAt
  ) {
    throw invalidAuthority(
      'Completed cloud dispatch receipt replay no longer matches exact package authority.',
    )
  }
}

export function finalizeCanonicalCloudDispatchOutboxEntry(
  input: Omit<CanonicalCloudDispatchOutboxEntry, 'immutableEntryHash' | 'entryHash'>,
): CanonicalCloudDispatchOutboxEntry {
  const immutableEntryHash = sha256AuthorityValue(input.immutable)
  const payload = { ...input, immutableEntryHash }
  return canonicalCloudDispatchOutboxEntrySchema.parse({
    ...payload,
    entryHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalServiceIdentityEvidence(input: {
  value: unknown
  expectedMechanism: CanonicalServiceIdentityEvidence['authenticationMechanism']
  expectedPrincipalEmail: string
  expectedAudience: string
  now: string
  privateContractFixtureAllowed: boolean
  trustedJwksContractFixtureAllowed: boolean
  trustedGoogleVerifierOutputAllowed: boolean
}): CanonicalServiceIdentityEvidence {
  const parsed = canonicalServiceIdentityEvidenceSchema.safeParse(input.value)
  if (!parsed.success) {
    throw serviceIdentityDenied('Trusted service identity evidence is invalid.')
  }
  const evidence = parsed.data
  const { evidenceHash, ...payload } = evidence
  const now = validTimestamp(input.now, 'service identity verification')
  const expectedVerifierId = evidence.verificationMode === 'private_contract_fixture'
    ? PRIVATE_FIXTURE_VERIFIER_ID
    : evidence.verificationMode === 'trusted_jwks_contract_fixture'
      ? TRUSTED_JWKS_FIXTURE_VERIFIER_ID
      : TRUSTED_GOOGLE_VERIFIER_ID
  if (
    evidenceHash !== sha256AuthorityValue(payload) ||
    evidence.authenticationMechanism !== input.expectedMechanism ||
    evidence.verifierId !== expectedVerifierId ||
    evidence.issuer !== GOOGLE_IDENTITY_ISSUER ||
    evidence.principalEmail !== input.expectedPrincipalEmail ||
    evidence.audience !== input.expectedAudience ||
    Date.parse(evidence.verifiedAt) > Date.parse(now) ||
    Date.parse(evidence.issuedAt) > Date.parse(now) ||
    Date.parse(evidence.expiresAt) <= Date.parse(now) ||
    (evidence.verificationMode === 'private_contract_fixture' &&
      !input.privateContractFixtureAllowed) ||
    (evidence.verificationMode === 'trusted_jwks_contract_fixture' &&
      !input.trustedJwksContractFixtureAllowed) ||
    (evidence.verificationMode === 'trusted_google_identity_verifier' &&
      !input.trustedGoogleVerifierOutputAllowed)
  ) {
    throw serviceIdentityDenied(
      'Service identity issuer, principal, audience, verifier, or expiry does not match authority.',
    )
  }
  return evidence
}

export function canonicalCloudDispatchControllerRequestBindingHash(input: {
  entry: CanonicalCloudDispatchOutboxEntry
  taskBody: unknown
  evidence: CanonicalServiceIdentityEvidence
}): string {
  const entry = assertCanonicalCloudDispatchOutboxEntryIntegrity(input.entry)
  return sha256AuthorityValue({
    domain: 'reeditpro:canonical-cloud-dispatch-controller-request:v1',
    dispatchIntentId: entry.immutable.dispatchIntentId,
    cloudTaskBodySha256: sha256AuthorityValue(input.taskBody),
    attemptPlanHash: entry.immutable.attemptPlanHash,
    principalBindingHash: serviceIdentityPrincipalBindingHash(input.evidence),
  })
}

export function createCanonicalCloudDispatchControllerReceipt(input: {
  entry: CanonicalCloudDispatchOutboxEntry
  taskBody: unknown
  attemptPlan: CanonicalCloudWorkerDispatchAttemptPlan
  verifiedIdentity: CanonicalVerifiedServiceIdentity
  expectedAudience: string
  now: string
  privateContractFixtureAllowed: boolean
  trustedJwksContractFixtureAllowed: boolean
  trustedGoogleVerifierOutputAllowed: boolean
}): CanonicalCloudDispatchControllerReceipt {
  const entry = assertCanonicalCloudDispatchOutboxEntryIntegrity(input.entry)
  const attemptPlan = assertAttemptPlanIntegrity(input.attemptPlan)
  const cloudTask = attemptPlan.cloudTask
  const cloudRunJob = attemptPlan.cloudRunJob
  if (!cloudTask || !cloudRunJob || stableAuthorityStringify(input.taskBody) !==
    stableAuthorityStringify(cloudTask.taskBody)) {
    throw invalidAuthority('Private dispatch controller received a changed opaque task body.')
  }
  assertEntryMatchesAttempt(entry, attemptPlan)
  const verifiedEvidence = assertCanonicalVerifiedServiceIdentity(
    input.verifiedIdentity,
  )
  const evidence = assertCanonicalServiceIdentityEvidence({
    value: verifiedEvidence,
    expectedMechanism: 'google_oidc_id_token',
    expectedPrincipalEmail: entry.immutable.controllerServiceAccountEmail,
    expectedAudience: input.expectedAudience,
    now: input.now,
    privateContractFixtureAllowed: input.privateContractFixtureAllowed,
    trustedJwksContractFixtureAllowed: input.trustedJwksContractFixtureAllowed,
    trustedGoogleVerifierOutputAllowed: input.trustedGoogleVerifierOutputAllowed,
  })
  const requestBindingHash = canonicalCloudDispatchControllerRequestBindingHash({
    entry,
    taskBody: input.taskBody,
    evidence,
  })
  const acceptedAt = validTimestamp(input.now, 'controller acceptance')
  const payload = {
    schemaVersion: CANONICAL_CLOUD_DISPATCH_CONTROLLER_RECEIPT_VERSION,
    receiptId: `controller_receipt_${requestBindingHash.slice(0, 32)}`,
    dispatchIntentId: entry.immutable.dispatchIntentId,
    requestBindingHash,
    identity: receiptIdentity(evidence),
    cloudRunJobRequestHash: entry.immutable.cloudRunJobRequestHash,
    acceptedAt,
    boundaries: {
      exactOpaqueTaskBodyVerified: true as const,
      exactOutboxAttemptVerified: true as const,
      exactIssuerPrincipalAudienceAndExpiryRequired: true as const,
      rawAuthorizationHeaderAccepted: false as const,
      rawBearerTokenPersisted: false as const,
      cloudRunJobsRunCallPerformed: false as const,
      liveGoogleOidcAndIamVerified:
        evidence.verificationMode === 'trusted_google_identity_verifier',
      cloudDispatchAuthorized: false as const,
      productionAuthority: false as const,
    },
  }
  return canonicalCloudDispatchControllerReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function createCanonicalCloudDispatchWorkerInvocation(input: {
  entry: CanonicalCloudDispatchOutboxEntry
}): CanonicalCloudDispatchWorkerInvocation {
  const entry = assertCanonicalCloudDispatchOutboxEntryIntegrity(input.entry)
  if (!entry.controllerReceipt) {
    throw invalidAuthority('Worker invocation requires an accepted controller receipt.')
  }
  return canonicalCloudDispatchWorkerInvocationSchema.parse({
    schemaVersion: 'canonical-cloud-dispatch-worker-invocation-v1',
    purpose: 'canonical_cloud_dispatch_worker_receiver',
    dispatchIntentId: entry.immutable.dispatchIntentId,
    dispatchBindingHash: entry.immutable.dispatchBindingHash,
    attemptPlanHash: entry.immutable.attemptPlanHash,
    controllerReceiptHash: entry.controllerReceipt.receiptHash,
  })
}

export function canonicalCloudDispatchWorkerRequestBindingHash(input: {
  entry: CanonicalCloudDispatchOutboxEntry
  invocation: CanonicalCloudDispatchWorkerInvocation
  evidence: CanonicalServiceIdentityEvidence
}): string {
  const entry = assertCanonicalCloudDispatchOutboxEntryIntegrity(input.entry)
  return sha256AuthorityValue({
    domain: 'reeditpro:canonical-cloud-dispatch-worker-receiver:v1',
    dispatchIntentId: entry.immutable.dispatchIntentId,
    invocationHash: sha256AuthorityValue(input.invocation),
    principalBindingHash: serviceIdentityPrincipalBindingHash(input.evidence),
  })
}

export function createCanonicalCloudDispatchWorkerReceipt(input: {
  entry: CanonicalCloudDispatchOutboxEntry
  invocation: unknown
  verifiedIdentity: CanonicalVerifiedServiceIdentity
  expectedAudience: string
  now: string
  privateContractFixtureAllowed: boolean
  trustedJwksContractFixtureAllowed: boolean
  trustedGoogleVerifierOutputAllowed: boolean
}): CanonicalCloudDispatchWorkerReceipt {
  const entry = assertCanonicalCloudDispatchOutboxEntryIntegrity(input.entry)
  const invocation = canonicalCloudDispatchWorkerInvocationSchema.safeParse(input.invocation)
  if (!invocation.success || !entry.controllerReceipt) {
    throw invalidAuthority('Worker receiver invocation or controller receipt is invalid.')
  }
  if (
    invocation.data.dispatchIntentId !== entry.immutable.dispatchIntentId ||
    invocation.data.dispatchBindingHash !== entry.immutable.dispatchBindingHash ||
    invocation.data.attemptPlanHash !== entry.immutable.attemptPlanHash ||
    invocation.data.controllerReceiptHash !== entry.controllerReceipt.receiptHash
  ) {
    throw invalidAuthority('Worker receiver invocation does not match the exact outbox attempt.')
  }
  const verifiedEvidence = assertCanonicalVerifiedServiceIdentity(
    input.verifiedIdentity,
  )
  const evidence = assertCanonicalServiceIdentityEvidence({
    value: verifiedEvidence,
    expectedMechanism: 'google_cloud_run_workload_identity',
    expectedPrincipalEmail: entry.immutable.workerServiceAccountEmail,
    expectedAudience: input.expectedAudience,
    now: input.now,
    privateContractFixtureAllowed: input.privateContractFixtureAllowed,
    trustedJwksContractFixtureAllowed: input.trustedJwksContractFixtureAllowed,
    trustedGoogleVerifierOutputAllowed: input.trustedGoogleVerifierOutputAllowed,
  })
  const requestBindingHash = canonicalCloudDispatchWorkerRequestBindingHash({
    entry,
    invocation: invocation.data,
    evidence,
  })
  const acceptedAt = validTimestamp(input.now, 'worker receiver acceptance')
  const payload = {
    schemaVersion: CANONICAL_CLOUD_DISPATCH_WORKER_RECEIPT_VERSION,
    receiptId: `worker_receipt_${requestBindingHash.slice(0, 32)}`,
    dispatchIntentId: entry.immutable.dispatchIntentId,
    controllerReceiptHash: entry.controllerReceipt.receiptHash,
    requestBindingHash,
    identity: receiptIdentity(evidence),
    acceptedAt,
    boundaries: {
      exactControllerReceiptVerified: true as const,
      exactOutboxAttemptVerified: true as const,
      exactWorkerPrincipalAudienceAndExpiryRequired: true as const,
      rawAuthorizationHeaderAccepted: false as const,
      rawBearerTokenPersisted: false as const,
      toolOrMediaExecutionStarted: false as const,
      liveGoogleWorkloadIdentityAndIamVerified:
        evidence.verificationMode === 'trusted_google_identity_verifier',
      productionExecutionAuthorized: false as const,
      productionAuthority: false as const,
    },
  }
  return canonicalCloudDispatchWorkerReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function createCanonicalCloudDispatchWorkerCompletionReceipt(input: {
  entry: CanonicalCloudDispatchOutboxEntry
  completionEvidence: CanonicalCloudDispatchWorkerCompletionEvidence
  queueCompletion: CanonicalPrivatePackageWorkQueueCompletion
  verifiedIdentity: CanonicalVerifiedServiceIdentity
  expectedAudience: string
  now: string
  completedAt: string
  privateContractFixtureAllowed: boolean
  trustedJwksContractFixtureAllowed: boolean
  trustedGoogleVerifierOutputAllowed: boolean
}): CanonicalCloudDispatchWorkerCompletionReceipt {
  const entry = assertCanonicalCloudDispatchOutboxEntryIntegrity(input.entry)
  const completionEvidence = canonicalCloudDispatchWorkerCompletionEvidenceSchema.parse(
    input.completionEvidence,
  )
  const queueCompletion = canonicalPrivatePackageWorkQueueCompletionSchema.parse(
    input.queueCompletion,
  )
  const workerReceipt = entry.workerReceipt
  if (
    !workerReceipt ||
    (entry.state !== 'worker_identity_accepted' &&
      entry.state !== 'worker_completion_reconciled')
  ) {
    throw invalidAuthority(
      'Worker completion reconciliation requires an accepted worker receipt.',
    )
  }
  const { completionHash, ...completionPayload } = queueCompletion
  if (
    completionHash !== sha256AuthorityValue(completionPayload) ||
    queueCompletion.claimId !== entry.immutable.queueClaimId ||
    queueCompletion.outcome.jobId !== entry.immutable.jobId ||
    queueCompletion.outcome.artifactId !== completionEvidence.artifactId ||
    queueCompletion.outcome.contentType !== completionEvidence.contentType ||
    queueCompletion.outcome.sha256 !== completionEvidence.artifactSha256 ||
    queueCompletion.outcome.adapterReplayed !== completionEvidence.adapterReplayed ||
    queueCompletion.outcome.status !== 'completed_private_test' ||
    queueCompletion.outcome.blockedDependencyJobIds.length !== 0
  ) {
    throw invalidAuthority(
      'Worker completion evidence does not match the exact queue completion.',
    )
  }
  const verifiedEvidence = assertCanonicalVerifiedServiceIdentity(
    input.verifiedIdentity,
  )
  const evidence = assertCanonicalServiceIdentityEvidence({
    value: verifiedEvidence,
    expectedMechanism: 'google_cloud_run_workload_identity',
    expectedPrincipalEmail: entry.immutable.workerServiceAccountEmail,
    expectedAudience: input.expectedAudience,
    now: input.now,
    privateContractFixtureAllowed: input.privateContractFixtureAllowed,
    trustedJwksContractFixtureAllowed: input.trustedJwksContractFixtureAllowed,
    trustedGoogleVerifierOutputAllowed: input.trustedGoogleVerifierOutputAllowed,
  })
  const currentIdentity = receiptIdentity(evidence)
  if (!sameServicePrincipal(workerReceipt.identity, currentIdentity)) {
    throw serviceIdentityDenied(
      'Worker completion identity does not match the accepted worker principal.',
    )
  }
  const completedAt = validTimestamp(input.completedAt, 'worker completion')
  if (Date.parse(completedAt) > Date.parse(input.now)) {
    throw invalidAuthority('Worker completion timestamp is in the future.')
  }
  const completionEvidenceHash = sha256AuthorityValue(completionEvidence)
  const completionOutcomeHash = sha256AuthorityValue(queueCompletion.outcome)
  const receiptBindingHash = sha256AuthorityValue({
    domain: 'reeditpro:canonical-cloud-dispatch-worker-completion:v1',
    dispatchIntentId: entry.immutable.dispatchIntentId,
    jobId: entry.immutable.jobId,
    packageDeliveryAttempt: entry.immutable.packageDeliveryAttempt,
    queueClaimId: entry.immutable.queueClaimId,
    queueClaimHash: entry.immutable.queueClaimHash,
    workerReceiptHash: workerReceipt.receiptHash,
    completionEvidenceHash,
    completionOutcomeHash,
    queueCompletionHash: queueCompletion.completionHash,
    attemptInternalCostEvidenceHash:
      completionEvidence.attemptInternalCostEvidenceHash,
    principalBindingHash: serviceIdentityPrincipalBindingHash(evidence),
  })
  const payload = {
    schemaVersion: CANONICAL_CLOUD_DISPATCH_WORKER_COMPLETION_RECEIPT_VERSION,
    receiptId: `worker_completion_${receiptBindingHash.slice(0, 32)}`,
    dispatchIntentId: entry.immutable.dispatchIntentId,
    jobId: entry.immutable.jobId,
    packageDeliveryAttempt: entry.immutable.packageDeliveryAttempt,
    queueClaimId: entry.immutable.queueClaimId,
    queueClaimHash: entry.immutable.queueClaimHash,
    workerReceiptHash: workerReceipt.receiptHash,
    completionEvidenceHash,
    completionOutcomeHash,
    queueCompletionHash: queueCompletion.completionHash,
    attemptInternalCostEvidenceHash:
      completionEvidence.attemptInternalCostEvidenceHash,
    identity: workerReceipt.identity,
    completedAt,
    boundaries: {
      exactWorkerReceiptVerified: true as const,
      exactOutboxAttemptVerified: true as const,
      exactQueueCompletionVerified: true as const,
      privateArtifactManifestRequired: true as const,
      qaPassedRequired: true as const,
      assetReconciliationRequired: true as const,
      downstreamLeaseVerificationRequired: true as const,
      attemptInternalProductionCostEvidenceHashRequired: true as const,
      customerPriceCreditsServiceFeeWalletOrBillingIncluded: false as const,
      rawAuthorizationHeaderAccepted: false as const,
      rawBearerTokenPersisted: false as const,
      rawMediaPromptPathSignedUrlOrCredentialPersisted: false as const,
      toolOrMediaExecutionClaimedByReceipt: false as const,
      liveGoogleWorkloadIdentityAndIamVerified:
        evidence.verificationMode === 'trusted_google_identity_verifier',
      productionExecutionAuthorized: false as const,
      productionAuthority: false as const,
    },
  }
  return canonicalCloudDispatchWorkerCompletionReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

export function serviceIdentityPrincipalBindingHash(
  evidence: CanonicalServiceIdentityEvidence,
): string {
  return sha256AuthorityValue({
    authenticationMechanism: evidence.authenticationMechanism,
    issuer: evidence.issuer,
    subject: evidence.subject,
    principalEmail: evidence.principalEmail,
    audience: evidence.audience,
  })
}

function sameServicePrincipal(
  left: CanonicalCloudDispatchWorkerReceipt['identity'],
  right: CanonicalCloudDispatchWorkerReceipt['identity'],
): boolean {
  return left.verificationMode === right.verificationMode &&
    left.authenticationMechanism === right.authenticationMechanism &&
    left.verifierId === right.verifierId &&
    left.issuerHash === right.issuerHash &&
    left.subjectHash === right.subjectHash &&
    left.principalEmailHash === right.principalEmailHash &&
    left.audienceHash === right.audienceHash
}

function assertEntryMatchesAttempt(
  entry: CanonicalCloudDispatchOutboxEntry,
  attemptPlan: CanonicalCloudWorkerDispatchAttemptPlan,
): void {
  if (
    attemptPlan.dispatchIntentId !== entry.immutable.dispatchIntentId ||
    attemptPlan.jobId !== entry.immutable.jobId ||
    attemptPlan.deliveryAttempt !== entry.immutable.packageDeliveryAttempt ||
    attemptPlan.dispatchBindingHash !== entry.immutable.dispatchBindingHash ||
    attemptPlan.attemptPlanHash !== entry.immutable.attemptPlanHash ||
    attemptPlan.handoffManifestHash !== entry.immutable.handoffManifestHash ||
    attemptPlan.manifestEntryHash !== entry.immutable.manifestEntryHash ||
    attemptPlan.queueDefinitionHash !== entry.immutable.queueDefinitionHash ||
    attemptPlan.regionAuthorityHash !== entry.immutable.regionAuthorityHash ||
    attemptPlan.runtimeRegion !== entry.immutable.runtimeRegion
  ) throw invalidAuthority('Cloud dispatch attempt no longer matches its durable outbox entry.')
}

function receiptIdentity(evidence: CanonicalServiceIdentityEvidence) {
  return {
    verificationMode: evidence.verificationMode,
    authenticationMechanism: evidence.authenticationMechanism,
    verifierId: evidence.verifierId,
    issuerHash: sha256AuthorityValue(evidence.issuer),
    subjectHash: sha256AuthorityValue(evidence.subject),
    principalEmailHash: sha256AuthorityValue(evidence.principalEmail),
    audienceHash: sha256AuthorityValue(evidence.audience),
    evidenceHash: evidence.evidenceHash,
  }
}

function receiptHashesValid(entry: CanonicalCloudDispatchOutboxEntry): boolean {
  if (entry.controllerReceipt) {
    const { receiptHash, ...payload } = entry.controllerReceipt
    if (receiptHash !== sha256AuthorityValue(payload)) return false
  }
  if (entry.workerReceipt) {
    const { receiptHash, ...payload } = entry.workerReceipt
    if (receiptHash !== sha256AuthorityValue(payload)) return false
  }
  if (entry.completionReceipt) {
    const { receiptHash, ...payload } = entry.completionReceipt
    if (receiptHash !== sha256AuthorityValue(payload)) return false
  }
  return true
}

function assertQueueDefinitionIntegrity(
  value: CanonicalPrivatePackageWorkQueueDefinition,
): CanonicalPrivatePackageWorkQueueDefinition {
  const parsed = canonicalPrivatePackageWorkQueueDefinitionSchema.safeParse(value)
  if (!parsed.success) throw invalidAuthority('Package queue definition is invalid.')
  const { definitionHash, ...payload } = parsed.data
  if (
    definitionHash !== sha256AuthorityValue(payload) ||
    parsed.data.jobs.some((job) => {
      const { definitionHash: jobHash, ...jobPayload } = job
      return jobHash !== sha256AuthorityValue(jobPayload)
    })
  ) throw invalidAuthority('Package queue definition integrity is invalid.')
  return parsed.data
}

function assertQueueAggregateIntegrity(
  value: CanonicalPrivatePackageWorkQueueAggregate,
  definition: CanonicalPrivatePackageWorkQueueDefinition,
): CanonicalPrivatePackageWorkQueueAggregate {
  const parsed = canonicalPrivatePackageWorkQueueAggregateSchema.safeParse(value)
  if (!parsed.success) throw invalidAuthority('Package queue aggregate is invalid.')
  const { aggregateHash, ...payload } = parsed.data
  if (
    aggregateHash !== sha256AuthorityValue(payload) ||
    parsed.data.definitionHash !== definition.definitionHash ||
    parsed.data.entries.length !== definition.jobs.length ||
    parsed.data.entries.some((entry, index) => {
      const { entryHash, ...entryPayload } = entry
      if (
        entryHash !== sha256AuthorityValue(entryPayload) ||
        stableAuthorityStringify(entry.definition) !==
          stableAuthorityStringify(definition.jobs[index])
      ) return true
      if (entry.activeClaim) {
        const { claimHash, ...claimPayload } = entry.activeClaim
        if (claimHash !== sha256AuthorityValue(claimPayload)) return true
      }
      if (entry.completion) {
        const { completionHash, ...completionPayload } = entry.completion
        if (completionHash !== sha256AuthorityValue(completionPayload)) return true
      }
      if (entry.lastRelease) {
        const { releaseHash, ...releasePayload } = entry.lastRelease
        if (releaseHash !== sha256AuthorityValue(releasePayload)) return true
      }
      return false
    }) ||
    parsed.data.events.some((event) => {
      const { eventHash, ...eventPayload } = event
      return eventHash !== sha256AuthorityValue(eventPayload)
    })
  ) throw invalidAuthority('Package queue aggregate integrity is invalid.')
  return parsed.data
}

function assertManifestIntegrity(
  value: CanonicalCloudWorkerDispatchHandoffManifest,
): CanonicalCloudWorkerDispatchHandoffManifest {
  const parsed = canonicalCloudWorkerDispatchHandoffManifestSchema.safeParse(value)
  if (!parsed.success) throw invalidAuthority('Cloud dispatch handoff manifest is invalid.')
  const { manifestHash, ...payload } = parsed.data
  if (
    manifestHash !== sha256AuthorityValue(payload) ||
    parsed.data.entries.some((entry) => {
      const { entryHash, ...entryPayload } = entry
      const { targetHash, ...targetPayload } = entry.target
      return entryHash !== sha256AuthorityValue(entryPayload) ||
        targetHash !== sha256AuthorityValue(targetPayload)
    })
  ) throw invalidAuthority('Cloud dispatch handoff manifest integrity is invalid.')
  return parsed.data
}

function assertAttemptPlanIntegrity(
  value: CanonicalCloudWorkerDispatchAttemptPlan,
): CanonicalCloudWorkerDispatchAttemptPlan {
  const parsed = canonicalCloudWorkerDispatchAttemptPlanSchema.safeParse(value)
  if (!parsed.success) throw invalidAuthority('Cloud dispatch attempt plan is invalid.')
  const { attemptPlanHash, ...payload } = parsed.data
  if (
    attemptPlanHash !== sha256AuthorityValue(payload) ||
    (parsed.data.cloudTask && parsed.data.cloudTask.bodySha256 !==
      sha256AuthorityValue(parsed.data.cloudTask.taskBody))
  ) throw invalidAuthority('Cloud dispatch attempt plan integrity is invalid.')
  return parsed.data
}

function validTimestamp(value: string, label: string): string {
  if (!Number.isFinite(Date.parse(value))) {
    throw new ApiError('VALIDATION_FAILED', `Canonical ${label} timestamp is invalid.`, 400)
  }
  return value
}

function invalidAuthority(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}

function serviceIdentityDenied(message: string): ApiError {
  return new ApiError('INTERNAL_SERVICE_AUTH_INVALID', message, 403)
}
