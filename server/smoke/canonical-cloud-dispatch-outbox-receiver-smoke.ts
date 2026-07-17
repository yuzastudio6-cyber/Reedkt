import assert from 'node:assert/strict'
import {
  generateKeyPairSync,
  sign,
  type KeyObject,
} from 'node:crypto'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { loadRuntimeEnv } from '../config/env'
import { GCP_PRODUCTION_API_SERVICE } from '../config/gcp-production-config'
import {
  createCanonicalCloudRuntimeRegionAuthority,
  createCanonicalProvenToolCloudDispatchCatalog,
  canonicalCloudWorkerDispatchHandoffManifestSchema,
  type CanonicalCloudWorkerDispatchHandoffManifest,
} from '../edit-architecture/canonical-cloud-worker-dispatch-handoff-authority'
import {
  canonicalPrivatePackageWorkQueueDefinitionSchema,
  type CanonicalPrivatePackageWorkQueueDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import { ApiError } from '../errors/api-error'
import {
  createCanonicalPrivateCloudDispatchReceiverService,
} from '../services/canonical-private-cloud-dispatch-receiver-service'
import {
  canonicalCloudDispatchOutboxAggregateRelativePath,
  clearPrivateCanonicalCloudDispatchOutboxProcessStateForSmoke,
  readPrivateCanonicalCloudDispatchOutbox,
  type CanonicalCloudDispatchOutboxStoreScope,
} from '../services/private-canonical-cloud-dispatch-outbox-store'
import {
  ensurePrivateCanonicalPackageWorkQueue,
  readPrivateCanonicalPackageWorkQueue,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from '../services/private-canonical-package-work-queue-store'
import { canonicalPrivatePackageStatePaths } from
  '../services/private-canonical-package-state-transaction'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  beginPrivateInternalAttemptCostEvidence,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import type { ServiceContext } from '../types'
import {
  type CanonicalCloudDispatchWorkerCompletionEvidence,
  type CanonicalCloudDispatchWorkerFailureEvidence,
  type CanonicalServiceIdentityEvidence,
} from '../validation/canonical-cloud-dispatch-outbox-schemas'
import {
  createCanonicalPrivateServiceIdentityFixture,
  createCanonicalTrustedJwksContractSnapshot,
  createCanonicalTrustedJwksContractVerifier,
  type CanonicalVerifiedServiceIdentity,
} from '../security/canonical-service-identity-verifier'
import { REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP } from
  '../../src/backend/cloud/reeditpro-gcp-production-resource-map'

const rootPath = await mkdtemp(join(tmpdir(), 'reeditpro-cloud-dispatch-outbox-'))
const ownerUserId = 'cloud-dispatch-owner'
const controllerAudience = 'https://reeditpro-api.example.run.app'
const workerAudience = 'https://reeditpro-worker-receiver.example.run.app'
const baseTimeMs = Date.parse('2026-07-17T06:00:00.000Z')
let currentTimeMs = baseTimeMs + 1_000
const now = () => new Date(currentTimeMs)
const identityKeyId = 'reeditpro-outbox-contract-key-20260717'
const identityKeys = generateKeyPairSync('rsa', {
  modulusLength: 2_048,
  publicExponent: 0x10001,
})
const identityPublicJwk = identityKeys.publicKey.export({ format: 'jwk' })
assert.ok(identityPublicJwk.n)
assert.ok(identityPublicJwk.e)
const identityVerifier = createCanonicalTrustedJwksContractVerifier({
  snapshot: createCanonicalTrustedJwksContractSnapshot({
    keySetId: 'reeditpro-outbox-contract-jwks-20260717',
    fetchedAt: new Date(baseTimeMs - 60_000).toISOString(),
    expiresAt: new Date(baseTimeMs + 180_000).toISOString(),
    keys: [{
      kty: 'RSA',
      kid: identityKeyId,
      alg: 'RS256',
      use: 'sig',
      n: identityPublicJwk.n,
      e: identityPublicJwk.e,
    }],
  }),
  now,
})
const queueDefinition = createQueueDefinition()
const manifest = createManifest(queueDefinition)
const scope: CanonicalCloudDispatchOutboxStoreScope = {
  localStorageRoot: rootPath,
  ownerUserId,
  workspaceId: queueDefinition.identity.workspaceId,
  projectId: queueDefinition.identity.projectId,
  editSessionId: queueDefinition.identity.editSessionId,
  packageRecordId: queueDefinition.identity.packageRecordId,
  approvedPlanSnapshotId: queueDefinition.identity.approvedPlanSnapshotId,
}
const queueScope: CanonicalPrivatePackageWorkQueueStoreScope = { ...scope }
const context = createContext('test')

try {
  await ensurePrivateCanonicalPackageWorkQueue({
    scope: queueScope,
    definition: queueDefinition,
    now: new Date(baseTimeMs).toISOString(),
  })
  const queueBefore = await readPrivateCanonicalPackageWorkQueue({
    scope: queueScope,
    definition: queueDefinition,
  })
  assert.ok(queueBefore)

  let service = createService(context)
  const enqueued = await service.enqueueApprovedAttempt({
    jobId: 'job_cloud_dispatch_cpu',
  })
  assert.equal(enqueued.disposition, 'created')
  if (!('outboxEntry' in enqueued) || !('attemptPlan' in enqueued)) {
    throw new Error('Cloud dispatch transaction did not create an outbox attempt.')
  }
  assert.equal(enqueued.outboxEntry.state, 'pending_controller_delivery')
  assert.equal(enqueued.outboxEntry.immutable.packageDeliveryAttempt, 1)
  assert.equal(enqueued.attemptPlan.cloudRunJob?.taskMaxRetries, 0)
  assert.equal(enqueued.boundaries.networkCallPerformed, false)

  const outboxPath = join(rootPath, canonicalCloudDispatchOutboxAggregateRelativePath(scope))
  const transactionPath = join(
    rootPath,
    canonicalPrivatePackageStatePaths(scope).transactionRelativePath,
  )
  assert.equal((await stat(outboxPath)).mode & 0o777, 0o600)
  const enqueuedBytes = await readFile(outboxPath, 'utf8')
  await assert.rejects(() => stat(transactionPath), (error: unknown) =>
    typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')
  assert.equal(enqueuedBytes.includes('credentialSha256'), false)
  assert.equal(enqueuedBytes.includes('Bearer '), false)
  assert.equal(enqueuedBytes.includes('/Users/'), false)
  assert.equal(enqueuedBytes.includes('signedUrl'), false)

  clearPrivateCanonicalCloudDispatchOutboxProcessStateForSmoke()
  service = createService(context)
  const replayedEnqueue = await service.enqueueApprovedAttempt({
    jobId: 'job_cloud_dispatch_cpu',
  })
  assert.equal(replayedEnqueue.disposition, 'exact_replay')
  assert.equal(await readFile(outboxPath, 'utf8'), enqueuedBytes)

  const taskBody = enqueued.attemptPlan.cloudTask?.taskBody
  assert.ok(taskBody)
  const controllerIdentity = signedIdentity({
    authenticationMechanism: 'google_oidc_id_token',
    principalEmail: enqueued.outboxEntry.immutable.controllerServiceAccountEmail,
    audience: controllerAudience,
    subject: '100000000000000000001',
  })
  await expectApiError(
    () => service.receiveController({
      taskBody,
      verifiedIdentity: privateIdentityFixture({
        authenticationMechanism: 'google_oidc_id_token',
        principalEmail: 'attacker@reeditpro.iam.gserviceaccount.com',
        audience: controllerAudience,
        subject: '100000000000000000099',
      }),
    }),
    'INTERNAL_SERVICE_AUTH_INVALID',
  )
  await expectApiError(
    () => service.receiveController({
      taskBody,
      verifiedIdentity: privateIdentityFixture({
        authenticationMechanism: 'google_oidc_id_token',
        principalEmail: enqueued.outboxEntry.immutable.controllerServiceAccountEmail,
        audience: 'https://attacker.example.test',
        subject: '100000000000000000001',
      }),
    }),
    'INTERNAL_SERVICE_AUTH_INVALID',
  )
  await expectApiError(
    () => service.receiveController({
      taskBody: { ...taskBody, sourcePath: '/private/source.mov' },
      verifiedIdentity: controllerIdentity,
    }),
    'VALIDATION_FAILED',
  )
  const callerAuthoredIdentity = {
    evidence: controllerIdentity.evidence,
  } as unknown as CanonicalVerifiedServiceIdentity
  await expectApiError(
    () => service.receiveController({
      taskBody,
      verifiedIdentity: callerAuthoredIdentity,
    }),
    'INTERNAL_SERVICE_AUTH_INVALID',
  )
  assert.equal(await readFile(outboxPath, 'utf8'), enqueuedBytes)

  await expectApiError(
    () => service.createWorkerInvocation(enqueued.outboxEntry.immutable.dispatchIntentId),
    'VALIDATION_FAILED',
  )

  const controllerResults = await Promise.all([
    service.receiveController({ taskBody, verifiedIdentity: controllerIdentity }),
    service.receiveController({ taskBody, verifiedIdentity: controllerIdentity }),
  ])
  assert.deepEqual(
    controllerResults.map((result) => result.disposition).sort(),
    ['accepted', 'exact_replay'],
  )
  assert.equal(
    controllerResults[0]?.receipt.receiptHash,
    controllerResults[1]?.receipt.receiptHash,
  )
  assert.equal(controllerResults[0]?.receipt.boundaries.cloudRunJobsRunCallPerformed, false)
  assert.equal(controllerResults[0]?.receipt.boundaries.liveGoogleOidcAndIamVerified, false)
  assert.equal(
    controllerResults[0]?.receipt.identity.verificationMode,
    'trusted_jwks_contract_fixture',
  )
  assert.equal(controllerResults[0]?.cloudRunJobRequest?.taskMaxRetries, 0)

  clearPrivateCanonicalCloudDispatchOutboxProcessStateForSmoke()
  service = createService(context)
  const invocation = await service.createWorkerInvocation(
    enqueued.outboxEntry.immutable.dispatchIntentId,
  )
  const workerIdentity = signedIdentity({
    authenticationMechanism: 'google_cloud_run_workload_identity',
    principalEmail: enqueued.outboxEntry.immutable.workerServiceAccountEmail,
    audience: workerAudience,
    subject: '100000000000000000002',
  })
  await expectApiError(
    () => service.receiveWorker({
      invocation: { ...invocation, controllerReceiptHash: 'f'.repeat(64) },
      verifiedIdentity: workerIdentity,
    }),
    'VALIDATION_FAILED',
  )
  await expectApiError(
    () => service.receiveWorker({
      invocation,
      verifiedIdentity: privateIdentityFixture({
        authenticationMechanism: 'google_cloud_run_workload_identity',
        principalEmail: 'wrong-worker@reeditpro.iam.gserviceaccount.com',
        audience: workerAudience,
        subject: '100000000000000000003',
      }),
    }),
    'INTERNAL_SERVICE_AUTH_INVALID',
  )

  const workerResults = await Promise.all([
    service.receiveWorker({ invocation, verifiedIdentity: workerIdentity }),
    service.receiveWorker({ invocation, verifiedIdentity: workerIdentity }),
  ])
  assert.deepEqual(
    workerResults.map((result) => result.disposition).sort(),
    ['accepted', 'exact_replay'],
  )
  assert.equal(workerResults[0]?.receipt.receiptHash, workerResults[1]?.receipt.receiptHash)
  assert.equal(workerResults[0]?.receipt.boundaries.toolOrMediaExecutionStarted, false)
  assert.equal(
    workerResults[0]?.receipt.boundaries.liveGoogleWorkloadIdentityAndIamVerified,
    false,
  )

  const evidence = await service.evidence()
  assert.equal(evidence.totalEntryCount, 1)
  assert.equal(evidence.pendingControllerDeliveryCount, 0)
  assert.equal(evidence.controllerIdentityAcceptedCount, 1)
  assert.equal(evidence.workerIdentityAcceptedCount, 1)
  assert.equal(evidence.distributedOutboxTransactionVerified, false)
  assert.equal(evidence.liveGoogleOidcAndIamVerified, false)
  assert.equal(evidence.cloudTaskCreated, false)
  assert.equal(evidence.cloudRunJobExecuted, false)
  assert.equal(evidence.workerExecutionAuthorized, false)
  assert.equal(evidence.processBrandedVerifiedIdentityRequired, true)
  assert.equal(evidence.cryptographicJwksVerifierCoreAvailable, true)
  assert.equal(evidence.packageAttemptSelectedByServer, true)
  assert.equal(evidence.cooperativeCrossProcessPackageLockVerified, true)
  assert.equal(evidence.singleHostCrashConsistentQueueClaimAndOutboxCommitVerified, true)
  assert.equal(evidence.committedTransactionRecoveryVerified, true)
  assert.equal(evidence.crossProcessAtomicClaimProven, true)

  const queueAfter = await readPrivateCanonicalPackageWorkQueue({
    scope: queueScope,
    definition: queueDefinition,
  })
  assert.notEqual(queueAfter?.aggregateHash, queueBefore.aggregateHash)
  assert.equal(queueAfter?.summary.totalDeliveryAttemptCount, 1)
  assert.equal(
    queueAfter?.entries[0]?.activeClaim?.claimId,
    enqueued.outboxEntry.immutable.queueClaimId,
  )

  const terminalBytes = await readFile(outboxPath, 'utf8')
  assert.equal(terminalBytes.includes('credentialSha256'), false)
  assert.equal(terminalBytes.includes(controllerAudience), false)
  assert.equal(terminalBytes.includes(workerAudience), false)
  assert.equal(terminalBytes.includes('rawBearerToken'), true)
  assert.equal(terminalBytes.includes('Authorization'), true)
  assert.equal(terminalBytes.includes('Bearer '), false)

  const otherScope = { ...scope, ownerUserId: 'another-owner' }
  assert.equal(await readPrivateCanonicalCloudDispatchOutbox({ scope: otherScope }), undefined)

  const untampered = terminalBytes
  const tampered = JSON.parse(terminalBytes) as {
    aggregate: { entries: Array<{ immutable: { jobId: string } }> }
  }
  tampered.aggregate.entries[0]!.immutable.jobId = 'job_tampered'
  await writeFile(outboxPath, JSON.stringify(tampered))
  clearPrivateCanonicalCloudDispatchOutboxProcessStateForSmoke()
  await expectApiError(
    () => readPrivateCanonicalCloudDispatchOutbox({ scope }),
    'VALIDATION_FAILED',
  )
  await writeFile(outboxPath, untampered)
  clearPrivateCanonicalCloudDispatchOutboxProcessStateForSmoke()
  assert.equal((await service.evidence()).workerIdentityAcceptedCount, 1)

  currentTimeMs = baseTimeMs + 121_000
  await expectApiError(
    () => service.receiveWorker({ invocation, verifiedIdentity: workerIdentity }),
    'WORKER_LEASE_EXPIRED',
  )

  currentTimeMs = baseTimeMs + 2_000
  const completionEvidence: CanonicalCloudDispatchWorkerCompletionEvidence = {
    schemaVersion: 'canonical-cloud-dispatch-worker-completion-evidence-v1',
    artifactId: 'artifact_cloud_dispatch_completion',
    contentType: 'application/json',
    artifactSha256: '1'.repeat(64),
    adapterReplayed: false,
    privateArtifactManifestHash: '2'.repeat(64),
    qaEvidenceHash: '3'.repeat(64),
    assetReconciliationEvidenceHash: '4'.repeat(64),
    downstreamLeaseVerificationHash: '5'.repeat(64),
    attemptInternalCostEvidenceHash: '7'.repeat(64),
    artifactStorageClass: 'private_internal_test',
    qaStatus: 'passed',
    assetReconciliationStatus: 'reconciled',
    downstreamLeaseStatus: 'verified',
  }
  const completionResults = await Promise.all([
    service.reconcileWorkerCompletion({
      dispatchIntentId: enqueued.outboxEntry.immutable.dispatchIntentId,
      completionEvidence,
      verifiedIdentity: workerIdentity,
    }),
    service.reconcileWorkerCompletion({
      dispatchIntentId: enqueued.outboxEntry.immutable.dispatchIntentId,
      completionEvidence,
      verifiedIdentity: workerIdentity,
    }),
  ])
  assert.deepEqual(
    completionResults.map((result) => result.disposition).sort(),
    ['exact_replay', 'reconciled'],
  )
  assert.equal(completionResults[0]?.receipt.receiptHash,
    completionResults[1]?.receipt.receiptHash)
  assert.equal(completionResults[0]?.outboxState, 'worker_completion_reconciled')
  assert.equal(completionResults[0]?.queueOutcome.jobId, 'job_cloud_dispatch_cpu')
  assert.equal(completionResults[0]?.queueOutcome.artifactId,
    completionEvidence.artifactId)
  assert.equal(
    completionResults[0]?.boundaries.queueCompletionAndOutboxReceiptShareAtomicWriteAheadCommit,
    true,
  )
  assert.equal(completionResults[0]?.boundaries.toolOrMediaExecutionClaimedByThisBoundary, false)
  assert.equal(completionResults[0]?.receipt.attemptInternalCostEvidenceHash,
    completionEvidence.attemptInternalCostEvidenceHash)
  assert.equal(
    completionResults[0]?.receipt.boundaries
      .customerPriceCreditsServiceFeeWalletOrBillingIncluded,
    false,
  )

  clearPrivateCanonicalCloudDispatchOutboxProcessStateForSmoke()
  service = createService(context)
  const completionReplay = await service.reconcileWorkerCompletion({
    dispatchIntentId: enqueued.outboxEntry.immutable.dispatchIntentId,
    completionEvidence,
    verifiedIdentity: workerIdentity,
  })
  assert.equal(completionReplay.disposition, 'exact_replay')
  await expectApiError(
    () => service.reconcileWorkerCompletion({
      dispatchIntentId: enqueued.outboxEntry.immutable.dispatchIntentId,
      completionEvidence: {
        ...completionEvidence,
        artifactSha256: '6'.repeat(64),
      },
      verifiedIdentity: workerIdentity,
    }),
    'IDEMPOTENCY_CONFLICT',
  )
  await expectApiError(
    () => service.reconcileWorkerCompletion({
      dispatchIntentId: enqueued.outboxEntry.immutable.dispatchIntentId,
      completionEvidence,
      verifiedIdentity: privateIdentityFixture({
        authenticationMechanism: 'google_cloud_run_workload_identity',
        principalEmail: 'wrong-completion-worker@reeditpro.iam.gserviceaccount.com',
        audience: workerAudience,
        subject: '100000000000000000003',
      }),
    }),
    'INTERNAL_SERVICE_AUTH_INVALID',
  )
  const completedQueue = await readPrivateCanonicalPackageWorkQueue({
    scope: queueScope,
    definition: queueDefinition,
  })
  const completedOutbox = await readPrivateCanonicalCloudDispatchOutbox({ scope })
  assert.equal(completedQueue?.summary.completedJobCount, 1)
  assert.equal(completedQueue?.entries[0]?.activeClaim, undefined)
  assert.equal(completedQueue?.entries[0]?.completion?.outcome.sha256,
    completionEvidence.artifactSha256)
  assert.equal(completedOutbox?.summary.workerCompletionReconciledCount, 1)
  assert.equal(completedOutbox?.entries[0]?.state, 'worker_completion_reconciled')
  assert.equal((await service.evidence()).workerCompletionReconciledCount, 1)
  const completionBytes = await readFile(outboxPath, 'utf8')
  assert.equal(completionBytes.includes('/Users/'), false)
  assert.equal(completionBytes.includes('signedUrl'), false)
  assert.equal(completionBytes.includes('Bearer '), false)
  assert.equal(completionBytes.includes('claimCredential'), false)
  const postCompletionControllerReplay = await service.receiveController({
    taskBody,
    verifiedIdentity: controllerIdentity,
  })
  const postCompletionWorkerReplay = await service.receiveWorker({
    invocation,
    verifiedIdentity: workerIdentity,
  })
  assert.equal(postCompletionControllerReplay.disposition, 'exact_replay')
  assert.equal(postCompletionWorkerReplay.disposition, 'exact_replay')
  assert.equal(
    (await readPrivateCanonicalPackageWorkQueue({
      scope: queueScope,
      definition: queueDefinition,
    }))?.summary.totalDeliveryAttemptCount,
    1,
  )

  const failureProof = await proveWorkerFailureReconciliation()
  const timeoutProof = await proveWorkerTimeoutReconciliation()

  assert.throws(() => createService(createContext('production')), (error: unknown) =>
    error instanceof ApiError && error.code === 'TOOL_NOT_READY')

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'one_server_selected_package_queue_attempt_and_outbox_entry_commit_together',
      'restart_and_concurrent_task_redelivery_replay_without_another_attempt',
      'controller_requires_exact_issuer_principal_audience_expiry_task_and_outbox_binding',
      'worker_requires_exact_controller_receipt_workload_identity_and_attempt_binding',
      'controller_and_worker_accept_only_process_branded_cryptographically_verified_identity',
      'forged_principal_audience_task_worker_and_persistence_bytes_fail_closed',
      'outbox_persists_no_raw_bearer_claim_credential_media_prompt_path_or_signed_url',
      'receiver_atomically_claims_queue_without_starting_cloud_job_tool_media_or_network_work',
      'worker_completion_reconciles_private_artifact_qa_manifest_and_downstream_evidence_once',
      'queue_completion_and_outbox_completion_receipt_share_one_recoverable_commit',
      'late_controller_and_worker_redelivery_replay_after_terminal_completion',
      'accepted_worker_failure_releases_queue_and_reconciles_terminal_outbox_once',
      'concurrent_failure_and_late_redelivery_replay_without_duplicate_release',
      'changed_failure_evidence_and_worker_principal_fail_closed',
      'post_commit_ambiguity_never_releases_or_authorizes_retry',
      'first_failure_allows_one_server_selected_retry_and_second_exhausts_attempts',
      'expired_accepted_worker_fences_later_attempt_until_timeout_reconciliation',
      'missing_timeout_attempt_cost_record_fails_closed_without_queue_or_outbox_mutation',
      'caller_supplied_timeout_cost_hash_is_rejected_as_authority',
      'controller_authenticated_timeout_reconciles_queue_and_outbox_once',
      'timeout_exact_replay_and_later_explicit_attempt_preserve_one_use_dispatch',
      'server_loaded_timeout_attempt_cost_record_stays_separate_from_customer_commercial_authority',
      'distributed_transaction_live_google_oidc_iam_cloud_and_production_remain_false',
    ],
    summary: {
      outboxEntryCount: evidence.totalEntryCount,
      packageDeliveryAttemptCount: queueAfter?.summary.totalDeliveryAttemptCount,
      controllerReceiptReplayCount: 1,
      workerReceiptReplayCount: 1,
      workerCompletionReplayCount: 1,
      workerFailureReplayCount: failureProof.failureReplayCount,
      workerFailureReconciledCount: failureProof.failureReconciledCount,
      exhaustedDeliveryAttemptCount: failureProof.deliveryAttemptCount,
      workerTimeoutReplayCount: timeoutProof.timeoutReplayCount,
      workerTimeoutReconciledCount: timeoutProof.timeoutReconciledCount,
      timeoutProgressionDeliveryAttemptCount: timeoutProof.deliveryAttemptCount,
      cloudRunHiddenRetryCount: 0,
    },
  }))
} finally {
  await rm(rootPath, { recursive: true, force: true })
}

async function proveWorkerTimeoutReconciliation(): Promise<{
  timeoutReplayCount: number
  timeoutReconciledCount: number
  deliveryAttemptCount: number
}> {
  const timeoutRoot = await mkdtemp(join(tmpdir(), 'reeditpro-cloud-dispatch-timeout-'))
  const previousTimeMs = currentTimeMs
  try {
    currentTimeMs = baseTimeMs + 10_000
    const definition = createQueueDefinition('deepfilternet')
    const timeoutManifest = createManifest(definition, 'deepfilternet')
    const timeoutScope: CanonicalCloudDispatchOutboxStoreScope = {
      localStorageRoot: timeoutRoot,
      ownerUserId,
      workspaceId: definition.identity.workspaceId,
      projectId: definition.identity.projectId,
      editSessionId: definition.identity.editSessionId,
      packageRecordId: definition.identity.packageRecordId,
      approvedPlanSnapshotId: definition.identity.approvedPlanSnapshotId,
    }
    await ensurePrivateCanonicalPackageWorkQueue({
      scope: timeoutScope,
      definition,
      now: new Date(baseTimeMs).toISOString(),
    })
    const timeoutContext = createContext('test', timeoutRoot)
    const timeoutService = createCanonicalPrivateCloudDispatchReceiverService({
      context: timeoutContext,
      ownerUserId,
      queueDefinition: definition,
      manifest: timeoutManifest,
      controllerAudience,
      workerReceiverAudience: workerAudience,
      now,
    })
    const firstAttempt = await timeoutService.enqueueApprovedAttempt({
      jobId: 'job_cloud_dispatch_cpu',
    })
    const firstOutboxEntry = firstAttempt.outboxEntry
    const firstAttemptPlan = firstAttempt.attemptPlan
    if (!firstOutboxEntry || !firstAttemptPlan) {
      throw new Error('Worker timeout proof did not create its first attempt.')
    }
    const taskBody = firstAttemptPlan.cloudTask?.taskBody
    assert.ok(taskBody)
    const controllerIdentity = signedIdentity({
      authenticationMechanism: 'google_oidc_id_token',
      principalEmail: firstOutboxEntry.immutable.controllerServiceAccountEmail,
      audience: controllerAudience,
      subject: '100000000000000000021',
    })
    const workerIdentity = signedIdentity({
      authenticationMechanism: 'google_cloud_run_workload_identity',
      principalEmail: firstOutboxEntry.immutable.workerServiceAccountEmail,
      audience: workerAudience,
      subject: '100000000000000000022',
    })
    await timeoutService.receiveController({
      taskBody,
      verifiedIdentity: controllerIdentity,
    })
    const invocation = await timeoutService.createWorkerInvocation(
      firstOutboxEntry.immutable.dispatchIntentId,
    )
    await timeoutService.receiveWorker({
      invocation,
      verifiedIdentity: workerIdentity,
    })
    await expectApiError(
      () => timeoutService.reconcileWorkerTimeout({
        dispatchIntentId: firstOutboxEntry.immutable.dispatchIntentId,
        verifiedIdentity: controllerIdentity,
      }),
      'VALIDATION_FAILED',
    )

    currentTimeMs = Date.parse(
      firstOutboxEntry.immutable.queueClaimExpiresAt,
    )
    const queueBeforeFence = await readPrivateCanonicalPackageWorkQueue({
      scope: timeoutScope,
      definition,
    })
    const outboxBeforeFence = await readPrivateCanonicalCloudDispatchOutbox({
      scope: timeoutScope,
    })
    assert.ok(queueBeforeFence)
    assert.ok(outboxBeforeFence)
    const fenced = await timeoutService.enqueueApprovedAttempt({
      jobId: 'job_cloud_dispatch_cpu',
    })
    assert.equal(fenced.disposition, 'stale_attempt_reconciliation_required')
    assert.equal(
      'requiredGate' in fenced ? fenced.requiredGate : undefined,
      'canonical_cloud_dispatch_accepted_worker_timeout_reconciliation',
    )
    const queueAfterFence = await readPrivateCanonicalPackageWorkQueue({
      scope: timeoutScope,
      definition,
    })
    const outboxAfterFence = await readPrivateCanonicalCloudDispatchOutbox({
      scope: timeoutScope,
    })
    assert.equal(queueAfterFence?.aggregateHash, queueBeforeFence.aggregateHash)
    assert.equal(outboxAfterFence?.aggregateHash, outboxBeforeFence.aggregateHash)
    await expectApiError(
      () => timeoutService.reconcileWorkerTimeout({
        dispatchIntentId: firstOutboxEntry.immutable.dispatchIntentId,
        verifiedIdentity: controllerIdentity,
      }),
      'JOB_DEPENDENCY_NOT_READY',
    )
    const queueAfterMissingCost = await readPrivateCanonicalPackageWorkQueue({
      scope: timeoutScope,
      definition,
    })
    const outboxAfterMissingCost = await readPrivateCanonicalCloudDispatchOutbox({
      scope: timeoutScope,
    })
    assert.equal(queueAfterMissingCost?.aggregateHash, queueBeforeFence.aggregateHash)
    assert.equal(outboxAfterMissingCost?.aggregateHash, outboxBeforeFence.aggregateHash)

    const job = definition.jobs[0]!
    const costMeter = await beginPrivateInternalAttemptCostEvidence({
      localStorageRoot: timeoutRoot,
      workspaceId: definition.identity.workspaceId,
      projectId: definition.identity.projectId,
      editSessionId: definition.identity.editSessionId,
      approvedPlanSnapshotId: definition.identity.approvedPlanSnapshotId,
      approvedWorkItemId: job.approvedWorkItemId,
      jobId: job.jobId,
      executionAttemptId: firstOutboxEntry.immutable.dispatchIntentId,
      retryAttempt: firstOutboxEntry.immutable.packageDeliveryAttempt - 1,
      toolId: 'deepfilternet',
      operationId: 'tool.deepfilternet.enhance_voice.v1',
    }, {
      nowIso: () => new Date(currentTimeMs).toISOString(),
      monotonicNanoseconds: (() => {
        const values = [3_000_000_000n, 4_750_000_000n]
        return () => values.shift() ?? 4_750_000_000n
      })(),
    })
    const attemptInternalCostEvidence = await costMeter.finalize({
      status: 'failed',
      failureCategory: 'timeout',
      outputByteLength: null,
      linkedCanonicalOutcomeHash: null,
    })
    const attemptInternalCostEvidenceHash =
      attemptInternalCostEvidence.evidence.evidenceHash
    await expectApiError(
      () => timeoutService.reconcileWorkerTimeout({
        dispatchIntentId: firstOutboxEntry.immutable.dispatchIntentId,
        verifiedIdentity: controllerIdentity,
        attemptInternalCostEvidenceHash: 'f'.repeat(64),
      } as Parameters<typeof timeoutService.reconcileWorkerTimeout>[0]),
      'VALIDATION_FAILED',
    )

    const wrongControllerIdentity = privateIdentityFixtureAt({
      authenticationMechanism: 'google_oidc_id_token',
      principalEmail: 'wrong-timeout-controller@reeditpro.iam.gserviceaccount.com',
      audience: controllerAudience,
      subject: '100000000000000000023',
    }, currentTimeMs)
    await expectApiError(
      () => timeoutService.reconcileWorkerTimeout({
        dispatchIntentId: firstOutboxEntry.immutable.dispatchIntentId,
        verifiedIdentity: wrongControllerIdentity,
      }),
      'INTERNAL_SERVICE_AUTH_INVALID',
    )
    const reconciled = await timeoutService.reconcileWorkerTimeout({
      dispatchIntentId: firstOutboxEntry.immutable.dispatchIntentId,
      verifiedIdentity: controllerIdentity,
    })
    assert.equal(reconciled.disposition, 'reconciled')
    assert.equal(reconciled.queueDisposition, 'retry_available')
    assert.equal(reconciled.retryDisposition, 'retry_same_approved_operation')
    assert.equal(reconciled.remainingAttempts, 1)
    assert.equal(reconciled.outboxState, 'worker_timeout_reconciled')
    assert.equal(reconciled.boundaries.automaticRetryLoopStarted, false)
    assert.equal(
      reconciled.boundaries.queueReleaseAndOutboxReceiptShareAtomicWriteAheadCommit,
      true,
    )
    assert.equal(
      reconciled.receipt.attemptInternalCostEvidenceHash,
      attemptInternalCostEvidenceHash,
    )
    assert.equal(
      reconciled.boundaries.attemptInternalProductionCostEvidenceResolvedByServer,
      true,
    )
    assert.equal(reconciled.boundaries.callerSuppliedAttemptCostHashAccepted, false)
    assert.equal(
      reconciled.receipt.boundaries
        .customerPriceCreditsServiceFeeWalletOrBillingIncluded,
      false,
    )
    const replay = await timeoutService.reconcileWorkerTimeout({
      dispatchIntentId: firstOutboxEntry.immutable.dispatchIntentId,
      verifiedIdentity: controllerIdentity,
    })
    assert.equal(replay.disposition, 'exact_replay')
    assert.equal(replay.receipt.receiptHash, reconciled.receipt.receiptHash)

    const queueBeforeExplicitRetry = await readPrivateCanonicalPackageWorkQueue({
      scope: timeoutScope,
      definition,
    })
    assert.equal(queueBeforeExplicitRetry?.summary.totalDeliveryAttemptCount, 1)
    const secondAttempt = await timeoutService.enqueueApprovedAttempt({
      jobId: 'job_cloud_dispatch_cpu',
    })
    assert.equal(secondAttempt.disposition, 'created')
    if (!('outboxEntry' in secondAttempt)) {
      throw new Error('Worker timeout proof did not create its explicit retry.')
    }
    assert.equal(secondAttempt.outboxEntry.immutable.packageDeliveryAttempt, 2)
    assert.notEqual(
      secondAttempt.outboxEntry.immutable.queueClaimId,
      firstOutboxEntry.immutable.queueClaimId,
    )

    const queue = await readPrivateCanonicalPackageWorkQueue({
      scope: timeoutScope,
      definition,
    })
    const outbox = await readPrivateCanonicalCloudDispatchOutbox({
      scope: timeoutScope,
    })
    const evidence = await timeoutService.evidence()
    assert.ok(queue)
    assert.ok(outbox)
    assert.equal(queue.summary.totalDeliveryAttemptCount, 2)
    assert.equal(queue.summary.expiredClaimRecoveryCount, 1)
    assert.equal(outbox.summary.workerTimeoutReconciledCount, 1)
    assert.equal(outbox.entries[0]?.state, 'worker_timeout_reconciled')
    assert.equal(outbox.entries[1]?.state, 'pending_controller_delivery')
    assert.equal(evidence.workerTimeoutReconciledCount, 1)
    assert.equal(evidence.acceptedWorkerTimeoutReconciliationVerified, true)
    assert.equal(evidence.timeoutQueueAndOutboxWriteAheadCommitVerified, true)
    assert.equal(evidence.timeoutAttemptCostEvidenceLoadedFromPrivateStore, true)
    assert.equal(evidence.callerSuppliedTimeoutCostHashAccepted, false)
    assert.equal(evidence.distributedOutboxTransactionVerified, false)
    assert.equal(evidence.liveGoogleOidcAndIamVerified, false)
    assert.equal(evidence.cloudTaskCreated, false)
    assert.equal(evidence.cloudRunJobExecuted, false)
    assert.equal(evidence.workerExecutionAuthorized, false)
    assert.equal(evidence.cloudDispatchAuthorized, false)
    assert.equal(evidence.productionAuthority, false)
    return {
      timeoutReplayCount: 1,
      timeoutReconciledCount: outbox.summary.workerTimeoutReconciledCount ?? 0,
      deliveryAttemptCount: queue.summary.totalDeliveryAttemptCount,
    }
  } finally {
    currentTimeMs = previousTimeMs
    await rm(timeoutRoot, { recursive: true, force: true })
  }
}

async function proveWorkerFailureReconciliation(): Promise<{
  failureReplayCount: number
  failureReconciledCount: number
  deliveryAttemptCount: number
}> {
  const failureRoot = await mkdtemp(join(tmpdir(), 'reeditpro-cloud-dispatch-failure-'))
  const previousTimeMs = currentTimeMs
  try {
    currentTimeMs = baseTimeMs + 3_000
    const definition = createQueueDefinition()
    const failureManifest = createManifest(definition)
    const failureScope: CanonicalCloudDispatchOutboxStoreScope = {
      localStorageRoot: failureRoot,
      ownerUserId,
      workspaceId: definition.identity.workspaceId,
      projectId: definition.identity.projectId,
      editSessionId: definition.identity.editSessionId,
      packageRecordId: definition.identity.packageRecordId,
      approvedPlanSnapshotId: definition.identity.approvedPlanSnapshotId,
    }
    await ensurePrivateCanonicalPackageWorkQueue({
      scope: failureScope,
      definition,
      now: new Date(baseTimeMs).toISOString(),
    })
    const failureContext = createContext('test', failureRoot)
    let failureService = createCanonicalPrivateCloudDispatchReceiverService({
      context: failureContext,
      ownerUserId,
      queueDefinition: definition,
      manifest: failureManifest,
      controllerAudience,
      workerReceiverAudience: workerAudience,
      now,
    })
    const firstAttempt = await failureService.enqueueApprovedAttempt({
      jobId: 'job_cloud_dispatch_cpu',
    })
    if (!firstAttempt.outboxEntry || !firstAttempt.attemptPlan) {
      throw new Error('Worker failure proof did not create its first attempt.')
    }
    const firstOutboxEntry = firstAttempt.outboxEntry
    const firstAttemptPlan = firstAttempt.attemptPlan
    const firstTaskBody = firstAttemptPlan.cloudTask?.taskBody
    assert.ok(firstTaskBody)
    const controllerIdentity = signedIdentity({
      authenticationMechanism: 'google_oidc_id_token',
      principalEmail: firstOutboxEntry.immutable.controllerServiceAccountEmail,
      audience: controllerAudience,
      subject: '100000000000000000011',
    })
    const workerIdentity = signedIdentity({
      authenticationMechanism: 'google_cloud_run_workload_identity',
      principalEmail: firstOutboxEntry.immutable.workerServiceAccountEmail,
      audience: workerAudience,
      subject: '100000000000000000012',
    })
    await failureService.receiveController({
      taskBody: firstTaskBody,
      verifiedIdentity: controllerIdentity,
    })
    const firstInvocation = await failureService.createWorkerInvocation(
      firstOutboxEntry.immutable.dispatchIntentId,
    )
    await failureService.receiveWorker({
      invocation: firstInvocation,
      verifiedIdentity: workerIdentity,
    })
    const firstFailure = workerFailureEvidence({
      failureCategory: 'runtime_unavailable',
      failureCode: 'TOOL_NOT_READY',
      executionState: 'failed_before_commit',
      failureDetailHash: '8'.repeat(64),
      attemptInternalCostEvidenceHash: '9'.repeat(64),
    })
    const firstResults = await Promise.all([
      failureService.reconcileWorkerFailure({
        dispatchIntentId: firstOutboxEntry.immutable.dispatchIntentId,
        failureEvidence: firstFailure,
        verifiedIdentity: workerIdentity,
      }),
      failureService.reconcileWorkerFailure({
        dispatchIntentId: firstOutboxEntry.immutable.dispatchIntentId,
        failureEvidence: firstFailure,
        verifiedIdentity: workerIdentity,
      }),
    ])
    assert.deepEqual(
      firstResults.map((result) => result.disposition).sort(),
      ['exact_replay', 'reconciled'],
    )
    assert.equal(firstResults[0]?.receipt.receiptHash, firstResults[1]?.receipt.receiptHash)
    assert.equal(firstResults[0]?.queueDisposition, 'retry_available')
    assert.equal(firstResults[0]?.retryDisposition, 'retry_same_approved_operation')
    assert.equal(firstResults[0]?.remainingAttempts, 1)
    assert.equal(firstResults[0]?.approvedMaxAttempts, 2)
    assert.equal(
      firstResults[0]?.receipt.attemptInternalCostEvidenceHash,
      firstFailure.attemptInternalCostEvidenceHash,
    )
    assert.equal(
      firstResults[0]?.receipt.boundaries
        .customerPriceCreditsServiceFeeWalletOrBillingIncluded,
      false,
    )
    assert.equal(firstResults[0]?.boundaries.automaticRetryLoopStarted, false)
    await expectApiError(
      () => failureService.reconcileWorkerFailure({
        dispatchIntentId: firstOutboxEntry.immutable.dispatchIntentId,
        failureEvidence: {
          ...firstFailure,
          failureDetailHash: 'a'.repeat(64),
        },
        verifiedIdentity: workerIdentity,
      }),
      'IDEMPOTENCY_CONFLICT',
    )
    await expectApiError(
      () => failureService.reconcileWorkerFailure({
        dispatchIntentId: firstOutboxEntry.immutable.dispatchIntentId,
        failureEvidence: firstFailure,
        verifiedIdentity: privateIdentityFixture({
          authenticationMechanism: 'google_cloud_run_workload_identity',
          principalEmail: 'wrong-failure-worker@reeditpro.iam.gserviceaccount.com',
          audience: workerAudience,
          subject: '100000000000000000013',
        }),
      }),
      'INTERNAL_SERVICE_AUTH_INVALID',
    )
    assert.equal((await failureService.receiveController({
      taskBody: firstTaskBody,
      verifiedIdentity: controllerIdentity,
    })).disposition, 'exact_replay')
    assert.equal((await failureService.receiveWorker({
      invocation: firstInvocation,
      verifiedIdentity: workerIdentity,
    })).disposition, 'exact_replay')

    clearPrivateCanonicalCloudDispatchOutboxProcessStateForSmoke()
    failureService = createCanonicalPrivateCloudDispatchReceiverService({
      context: failureContext,
      ownerUserId,
      queueDefinition: definition,
      manifest: failureManifest,
      controllerAudience,
      workerReceiverAudience: workerAudience,
      now,
    })
    const secondAttempt = await failureService.enqueueApprovedAttempt({
      jobId: 'job_cloud_dispatch_cpu',
    })
    assert.equal(secondAttempt.disposition, 'created')
    if (!('outboxEntry' in secondAttempt) || !('attemptPlan' in secondAttempt)) {
      throw new Error('Worker failure proof did not create its second attempt.')
    }
    assert.equal(secondAttempt.outboxEntry.immutable.packageDeliveryAttempt, 2)
    const secondTaskBody = secondAttempt.attemptPlan.cloudTask?.taskBody
    assert.ok(secondTaskBody)
    await failureService.receiveController({
      taskBody: secondTaskBody,
      verifiedIdentity: controllerIdentity,
    })
    const secondInvocation = await failureService.createWorkerInvocation(
      secondAttempt.outboxEntry.immutable.dispatchIntentId,
    )
    await failureService.receiveWorker({
      invocation: secondInvocation,
      verifiedIdentity: workerIdentity,
    })
    const postCommitAmbiguity = workerFailureEvidence({
      failureCategory: 'post_commit_reconciliation',
      failureCode: 'IDEMPOTENCY_ATOMICITY_REQUIRED',
      executionState: 'completed_requires_reconciliation',
      failureDetailHash: 'b'.repeat(64),
      attemptInternalCostEvidenceHash: 'c'.repeat(64),
    })
    await expectApiError(
      () => failureService.reconcileWorkerFailure({
        dispatchIntentId: secondAttempt.outboxEntry.immutable.dispatchIntentId,
        failureEvidence: postCommitAmbiguity,
        verifiedIdentity: workerIdentity,
      }),
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
    )
    const beforeSecondFailureQueue = await readPrivateCanonicalPackageWorkQueue({
      scope: failureScope,
      definition,
    })
    const beforeSecondFailureOutbox = await readPrivateCanonicalCloudDispatchOutbox({
      scope: failureScope,
    })
    assert.equal(beforeSecondFailureQueue?.entries[0]?.state, 'leased')
    assert.equal(beforeSecondFailureOutbox?.entries[1]?.state, 'worker_identity_accepted')

    const secondFailure = workerFailureEvidence({
      failureCategory: 'execution_timeout',
      failureCode: 'WORKER_LEASE_EXPIRED',
      executionState: 'failed_before_commit',
      failureDetailHash: 'd'.repeat(64),
      attemptInternalCostEvidenceHash: 'e'.repeat(64),
    })
    const exhausted = await failureService.reconcileWorkerFailure({
      dispatchIntentId: secondAttempt.outboxEntry.immutable.dispatchIntentId,
      failureEvidence: secondFailure,
      verifiedIdentity: workerIdentity,
    })
    assert.equal(exhausted.disposition, 'reconciled')
    assert.equal(exhausted.queueDisposition, 'attempts_exhausted')
    assert.equal(exhausted.retryDisposition, 'fallback_or_user_review_required')
    assert.equal(exhausted.remainingAttempts, 0)
    const noThirdAttempt = await failureService.enqueueApprovedAttempt({
      jobId: 'job_cloud_dispatch_cpu',
    })
    assert.equal(noThirdAttempt.disposition, 'attempts_exhausted')
    const firstFailureReplayAfterRetry = await failureService.reconcileWorkerFailure({
      dispatchIntentId: firstOutboxEntry.immutable.dispatchIntentId,
      failureEvidence: firstFailure,
      verifiedIdentity: workerIdentity,
    })
    assert.equal(firstFailureReplayAfterRetry.disposition, 'exact_replay')

    const queue = await readPrivateCanonicalPackageWorkQueue({
      scope: failureScope,
      definition,
    })
    const outbox = await readPrivateCanonicalCloudDispatchOutbox({ scope: failureScope })
    assert.ok(queue)
    assert.ok(outbox)
    assert.equal(queue.summary.totalDeliveryAttemptCount, 2)
    assert.equal(queue.summary.releasedClaimCount, 2)
    assert.equal(queue.summary.completedJobCount, 0)
    assert.equal(queue.entries[0]?.state, 'queued')
    assert.equal(queue.entries[0]?.lastRelease?.dispatchFailure?.queueDisposition,
      'attempts_exhausted')
    assert.equal(outbox.summary.totalEntryCount, 2)
    assert.equal(outbox.summary.workerFailureReconciledCount, 2)
    assert.equal(outbox.summary.workerCompletionReconciledCount, 0)
    assert.equal(outbox.events.filter((event) =>
      event.eventType === 'worker_failure_reconciled').length, 2)
    const outboxBytes = await readFile(
      join(failureRoot, canonicalCloudDispatchOutboxAggregateRelativePath(failureScope)),
      'utf8',
    )
    assert.equal(outboxBytes.includes('failure stack trace'), false)
    assert.equal(outboxBytes.includes('claimCredential'), false)
    assert.equal(outboxBytes.includes(
      '"customerPriceCreditsServiceFeeWalletOrBillingIncluded":false',
    ), true)
    assert.equal(outboxBytes.includes('walletMutation'), false)
    assert.equal((await failureService.evidence()).workerFailureReconciledCount, 2)
    return {
      failureReplayCount: 2,
      failureReconciledCount: 2,
      deliveryAttemptCount: queue.summary.totalDeliveryAttemptCount,
    }
  } finally {
    currentTimeMs = previousTimeMs
    await rm(failureRoot, { recursive: true, force: true })
  }
}

function workerFailureEvidence(input: {
  failureCategory: CanonicalCloudDispatchWorkerFailureEvidence['failureCategory']
  failureCode: CanonicalCloudDispatchWorkerFailureEvidence['failureCode']
  executionState: CanonicalCloudDispatchWorkerFailureEvidence['executionState']
  failureDetailHash: string
  attemptInternalCostEvidenceHash: string
}): CanonicalCloudDispatchWorkerFailureEvidence {
  return {
    schemaVersion: 'canonical-cloud-dispatch-worker-failure-evidence-v1',
    ...input,
    attemptCostBoundary: 'internal_production_cost_only',
    customerPriceCreditsServiceFeeWalletOrBillingIncluded: false,
    rawFailureMessageLogStackPathOrCredentialRetained: false,
  }
}

function createService(context: ServiceContext) {
  return createCanonicalPrivateCloudDispatchReceiverService({
    context,
    ownerUserId,
    queueDefinition,
    manifest,
    controllerAudience,
    workerReceiverAudience: workerAudience,
    now,
  })
}

function createContext(
  mode: 'test' | 'production',
  localStorageRoot = rootPath,
): ServiceContext {
  if (mode === 'production') {
    return {
      env: loadRuntimeEnv({
        NODE_ENV: 'production',
        E2E_RUNTIME_MODE: 'cloud_run',
        WORKER_RUNTIME_MODE: 'disabled',
        STORAGE_MODE: 'gcs_disabled',
        API_ALLOWED_CORS_ORIGINS: 'https://app.reeditpro.test',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'anon-placeholder',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-placeholder',
        REEDITPRO_INTERNAL_SERVICE_TOKEN: 'private-runtime-placeholder',
      }),
      clients: { admin: null, public: null },
      requestId: 'cloud-dispatch-outbox-production-negative',
      auth: { userId: ownerUserId, isMockUser: false },
    }
  }
  return {
    env: loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      WORKER_RUNTIME_MODE: 'local',
      STORAGE_MODE: 'local',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      LOCAL_STORAGE_ROOT: localStorageRoot,
    }),
    clients: { admin: null, public: null },
    requestId: 'cloud-dispatch-outbox-receiver-smoke',
    auth: { userId: ownerUserId, isMockUser: true },
  }
}

function privateIdentityFixture(input: {
  authenticationMechanism: CanonicalServiceIdentityEvidence['authenticationMechanism']
  principalEmail: string
  audience: string
  subject: string
}): CanonicalVerifiedServiceIdentity {
  return createCanonicalPrivateServiceIdentityFixture({
    authenticationMechanism: input.authenticationMechanism,
    subject: input.subject,
    principalEmail: input.principalEmail,
    audience: input.audience,
    issuedAt: new Date(baseTimeMs).toISOString(),
    expiresAt: new Date(baseTimeMs + 120_000).toISOString(),
    verifiedAt: new Date(baseTimeMs + 500).toISOString(),
  })
}

function privateIdentityFixtureAt(
  input: {
    authenticationMechanism: CanonicalServiceIdentityEvidence['authenticationMechanism']
    principalEmail: string
    audience: string
    subject: string
  },
  validAtMs: number,
): CanonicalVerifiedServiceIdentity {
  return createCanonicalPrivateServiceIdentityFixture({
    authenticationMechanism: input.authenticationMechanism,
    subject: input.subject,
    principalEmail: input.principalEmail,
    audience: input.audience,
    issuedAt: new Date(validAtMs - 1_000).toISOString(),
    expiresAt: new Date(validAtMs + 120_000).toISOString(),
    verifiedAt: new Date(validAtMs - 500).toISOString(),
  })
}

function signedIdentity(input: {
  authenticationMechanism: CanonicalServiceIdentityEvidence['authenticationMechanism']
  principalEmail: string
  audience: string
  subject: string
}): CanonicalVerifiedServiceIdentity {
  return identityVerifier.verify({
    idToken: signIdentityToken(input),
    authenticationMechanism: input.authenticationMechanism,
    expectedPrincipalEmail: input.principalEmail,
    expectedAudience: input.audience,
  })
}

function signIdentityToken(
  input: {
    principalEmail: string
    audience: string
    subject: string
  },
  privateKey: KeyObject = identityKeys.privateKey,
): string {
  const header = Buffer.from(JSON.stringify({
    alg: 'RS256',
    kid: identityKeyId,
    typ: 'JWT',
  }), 'utf8').toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss: 'https://accounts.google.com',
    sub: input.subject,
    aud: input.audience,
    email: input.principalEmail,
    email_verified: true,
    iat: Math.floor(baseTimeMs / 1_000),
    exp: Math.floor((baseTimeMs + 180_000) / 1_000),
  }), 'utf8').toString('base64url')
  const signingInput = `${header}.${payload}`
  const signature = sign(
    'RSA-SHA256',
    Buffer.from(signingInput, 'ascii'),
    privateKey,
  ).toString('base64url')
  return `${signingInput}.${signature}`
}

function createQueueDefinition(
  canonicalToolId = 'ffprobe',
): CanonicalPrivatePackageWorkQueueDefinition {
  const target = createCanonicalProvenToolCloudDispatchCatalog().tools.find((tool) =>
    tool.canonicalToolId === canonicalToolId)
  assert.ok(target)
  const jobPayload = {
    canonicalOrder: 0,
    jobId: 'job_cloud_dispatch_cpu',
    approvedWorkItemId: 'work_cloud_dispatch_cpu',
    workItemKey: 'cloud-dispatch-cpu',
    required: true,
    dependencyJobIds: [],
    workerType: target.workerType,
    resourceClassId: target.resourceClassId,
    plannedCloudExecutionTarget: 'cloud_run_job' as const,
    preferredAccelerator:
      target.workerType === 'gpu_ai_worker' ? 'nvidia_l4' as const : 'none' as const,
    placementHash: target.privatePlacementHash,
    privateExecutionReady: true,
    providerExecutionMode: 'none' as const,
    maxAttempts: 2,
    attemptTimeoutSeconds: 120,
    scheduledFor: new Date(baseTimeMs).toISOString(),
  }
  const job = { ...jobPayload, definitionHash: sha256AuthorityValue(jobPayload) }
  const payload = {
    schemaVersion: 'canonical-private-package-work-queue-definition-v1' as const,
    source: 'canonical_execution_package_and_snapshot_resource_placement' as const,
    identity: {
      workspaceId: 'workspace_cloud_dispatch_outbox',
      projectId: 'project_cloud_dispatch_outbox',
      editSessionId: 'session_cloud_dispatch_outbox',
      packageRecordId: 'package_cloud_dispatch_outbox',
      approvedPlanSnapshotId: 'snapshot_cloud_dispatch_outbox',
      packageHash: 'a'.repeat(64),
      snapshotHash: 'b'.repeat(64),
      workGraphHash: 'c'.repeat(64),
      placementManifestHash: 'd'.repeat(64),
      toolExecutionAuthorityHash: 'e'.repeat(64),
      approvedResourcePlacementAuthorityHash: 'f'.repeat(64),
    },
    jobs: [job],
    summary: {
      totalJobCount: 1,
      requiredJobCount: 1,
      cpuAnalysisJobCount: target.workerType === 'cpu_analysis_worker' ? 1 : 0,
      gpuJobCount: target.workerType === 'gpu_ai_worker' ? 1 : 0,
      renderJobCount: target.workerType === 'render_worker' ? 1 : 0,
      allJobsHaveSnapshotBoundPlacement: true as const,
      callerSelectedJobs: false as const,
      callerSelectedDependencies: false as const,
      callerSelectedPlacement: false as const,
    },
    boundaries: {
      approvedSnapshotRequired: true as const,
      fundedReservationRequired: true as const,
      privateArtifactsQaAndReconciliationRequired: true as const,
      browserClaimAllowed: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      googleCloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalPrivatePackageWorkQueueDefinitionSchema.parse({
    ...payload,
    definitionHash: sha256AuthorityValue(payload),
  })
}

function createManifest(
  definition: CanonicalPrivatePackageWorkQueueDefinition,
  canonicalToolId = 'ffprobe',
): CanonicalCloudWorkerDispatchHandoffManifest {
  const catalog = createCanonicalProvenToolCloudDispatchCatalog()
  const tool = catalog.tools.find((candidate) =>
    candidate.canonicalToolId === canonicalToolId)
  assert.ok(tool)
  const regionAuthority = createCanonicalCloudRuntimeRegionAuthority({
    queueDefinition: definition,
    runtimeRegion: 'us-east1',
    sourceObjectRegions: ['us-east1'],
    allRequiredObjectsRegionBound: true,
    liveProjectRegionPersistenceVerified: false,
    liveGcsObjectResidencyVerified: false,
  })
  const queueResourceName = 'projects/reeditpro/locations/us-east1/queues/' +
    REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.cloudTasksQueuesByRegion['us-east1'].workerDispatch
  const queueJob = definition.jobs[0]!
  const entryPayload = {
    canonicalOrder: 0,
    jobId: queueJob.jobId,
    approvedWorkItemId: queueJob.approvedWorkItemId,
    workItemKey: queueJob.workItemKey,
    required: true,
    dependencyJobIds: [],
    scheduledFor: queueJob.scheduledFor,
    maxAttempts: queueJob.maxAttempts,
    approvedToolId: tool.canonicalToolId,
    approvedToolOperationIds: [tool.operationId],
    queueJobDefinitionHash: queueJob.definitionHash,
    placementHash: queueJob.placementHash,
    workerType: queueJob.workerType,
    resourceClassId: queueJob.resourceClassId,
    runtimeRegion: 'us-east1' as const,
    target: tool.target,
    queueResourceName,
    privateDispatchControllerServiceName: GCP_PRODUCTION_API_SERVICE.name,
    privateDispatchControllerPath: '/internal/v1/canonical-cloud-dispatch' as const,
    taskOidcServiceAccountEmail:
      REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.serviceAccounts.apiOrchestrator,
    taskOidcAudienceState: 'deployed_private_controller_url_required' as const,
    cloudRunTaskTimeoutSeconds: queueJob.attemptTimeoutSeconds,
    cloudRunTaskTimeoutLimitSeconds: 604_800,
    packageQueueOwnsApprovedAttempts: true as const,
    cloudTasksDeliveryRetryDoesNotAuthorizeAnotherExecutionAttempt: true as const,
    workerLoadsAuthorityByOpaqueDispatchIntent: true as const,
    taskBodyCarriesRawMediaOrSecrets: false as const,
    blockers: ['distributed_dispatch_outbox_transaction_not_verified'],
    cloudDispatchAuthorized: false as const,
    productionExecutionAuthorized: false as const,
  }
  const entry = { ...entryPayload, entryHash: sha256AuthorityValue(entryPayload) }
  const payload = {
    schemaVersion: 'canonical-cloud-worker-dispatch-handoff-manifest-v1' as const,
    source: 'approved_package_queue_region_and_cloud_target_authority' as const,
    identity: {
      workspaceId: definition.identity.workspaceId,
      projectId: definition.identity.projectId,
      editSessionId: definition.identity.editSessionId,
      packageRecordId: definition.identity.packageRecordId,
      approvedPlanSnapshotId: definition.identity.approvedPlanSnapshotId,
      packageHash: definition.identity.packageHash,
      snapshotHash: definition.identity.snapshotHash,
      workGraphHash: definition.identity.workGraphHash,
      queueDefinitionHash: definition.definitionHash,
      regionAuthorityHash: regionAuthority.authorityHash,
      toolTargetCatalogHash: catalog.catalogHash,
    },
    runtimeRegion: 'us-east1' as const,
    entries: [entry],
    summary: {
      totalJobCount: 1,
      controlPlaneJobCount: 0,
      cloudTaskHandoffJobCount: 1,
      cpuAnalysisJobCount: queueJob.workerType === 'cpu_analysis_worker' ? 1 : 0,
      gpuJobCount: queueJob.workerType === 'gpu_ai_worker' ? 1 : 0,
      renderJobCount: queueJob.workerType === 'render_worker' ? 1 : 0,
      allJobsHaveExactCloudTargetContract: true as const,
      cloudRunHiddenRetryCount: 0 as const,
      allTaskBodiesOpaque: true as const,
    },
    boundaries: {
      browserDispatchAllowed: false as const,
      rawChatPromptMediaBytesOrSignedUrlsAllowed: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      remoteSupabaseAuthorized: false as const,
      distributedOutboxTransactionVerified: false as const,
      cloudTasksOidcAndIamVerified: false as const,
      cloudRunJobDeploymentVerified: false as const,
      workerServiceIdentityVerified: false as const,
      privateGcsObjectTransportVerified: false as const,
      cloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalCloudWorkerDispatchHandoffManifestSchema.parse({
    ...payload,
    manifestHash: sha256AuthorityValue(payload),
  })
}

async function expectApiError(
  operation: () => Promise<unknown>,
  expectedCode: ApiError['code'],
): Promise<void> {
  await assert.rejects(operation, (error: unknown) =>
    error instanceof ApiError && error.code === expectedCode)
}
