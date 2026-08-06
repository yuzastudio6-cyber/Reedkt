import assert from 'node:assert/strict'

import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  assertCanonicalDistributedPackageStateContractBoundary,
  assertCanonicalDistributedPackageStateProductionAuthority,
  assertCanonicalDistributedMutationResponseIntegrity,
  canonicalDistributedPackageStateRequestHash,
  createCanonicalDistributedPackageStateContractBoundary,
  type CanonicalDistributedPackageFixtureSeed,
  type CanonicalDistributedPackageMutationResponse,
  type CanonicalDistributedPackageStateTransactionPort,
  type CanonicalDistributedPortResult,
} from './canonical-distributed-package-state-port'
import {
  createInMemoryCanonicalDistributedPackageStateFixture,
  type CanonicalDistributedPackageStateFixture,
} from './in-memory-canonical-distributed-package-state-fixture'

const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
const conformanceEvidenceBrands = new WeakSet<object>()

export const canonicalDistributedPackageStateConformanceEvidenceSchema = z.object({
  schemaVersion: z.literal('canonical-distributed-package-state-conformance-v1'),
  source: z.literal('database_neutral_package_state_contract_fixture'),
  adapterId: identity,
  adapterDescriptorHash: sha256,
  checkCount: z.number().int().positive().max(500),
  checks: z.array(identity).min(1).max(500),
  exactRequestAndResponseSchemasVerified: z.literal(true),
  serializableClaimAndReplayVerified: z.literal(true),
  rollbackBeforeCommitVerified: z.literal(true),
  workerAcceptanceAndAttemptStartShareCommitVerified: z.literal(true),
  heartbeatLeaseExtensionVerified: z.literal(true),
  completionFailureTimeoutTerminalExclusivityVerified: z.literal(true),
  terminalInternalCostLinkageVerified: z.literal(true),
  controllerOwnedBoundedTimeoutSelectionVerified: z.literal(true),
  automaticRetryStarted: z.literal(false),
  customerCommercialAuthorityIncluded: z.literal(false),
  databaseBackendUsed: z.literal(false),
  distributedDatabaseTransactionVerified: z.literal(false),
  multiReplicaDurabilityVerified: z.literal(false),
  liveSupabaseOrPostgresCallPerformed: z.literal(false),
  cloudCallPerformed: z.literal(false),
  productionAuthority: z.literal(false),
  evidenceHash: sha256,
}).strict().superRefine((evidence, context) => {
  if (
    evidence.checkCount !== evidence.checks.length ||
    new Set(evidence.checks).size !== evidence.checks.length
  ) {
    context.addIssue({ code: 'custom', message: 'Distributed conformance checks are invalid.' })
  }
})

export type CanonicalDistributedPackageStateConformanceEvidence = z.infer<
  typeof canonicalDistributedPackageStateConformanceEvidenceSchema
>

export async function runCanonicalDistributedPackageStateContractConformance(): Promise<
  CanonicalDistributedPackageStateConformanceEvidence
> {
  const checks: string[] = []
  const record = (name: string): void => {
    checks.push(name)
  }

  const rollbackFixture = fixture('rollback', 1, 2)
  const rollbackPort = createCanonicalDistributedPackageStateContractBoundary(
    rollbackFixture.adapter,
  )
  assertCanonicalDistributedPackageStateContractBoundary(rollbackPort)
  record('process_branded_validated_port_boundary')
  await expectApiError(
    () => Promise.resolve(assertCanonicalDistributedPackageStateProductionAuthority(rollbackPort)),
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )
  record('fixture_cannot_authorize_production')
  const forgedPort = { ...rollbackPort } as CanonicalDistributedPackageStateTransactionPort
  assert.throws(
    () => assertCanonicalDistributedPackageStateContractBoundary(forgedPort),
    (error: unknown) => error instanceof ApiError &&
      error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )
  record('structured_copy_loses_port_authority')

  const cyclicSeed = createSeed('cyclic', 2, 1)
  cyclicSeed.jobs[0]!.dependencyJobIds = [cyclicSeed.jobs[1]!.jobId]
  cyclicSeed.jobs[1]!.dependencyJobIds = [cyclicSeed.jobs[0]!.jobId]
  assert.throws(
    () => createInMemoryCanonicalDistributedPackageStateFixture(cyclicSeed),
    (error: unknown) => error instanceof z.ZodError,
  )
  const duplicatedDependencySeed = createSeed('duplicate_dependency', 2, 1)
  duplicatedDependencySeed.jobs[1]!.dependencyJobIds = [
    duplicatedDependencySeed.jobs[0]!.jobId,
    duplicatedDependencySeed.jobs[0]!.jobId,
  ]
  assert.throws(
    () => createInMemoryCanonicalDistributedPackageStateFixture(duplicatedDependencySeed),
    (error: unknown) => error instanceof z.ZodError,
  )
  record('dependency_cycles_and_duplicates_are_rejected')

  const baseTime = '2026-07-17T00:00:00.000Z'
  const rollbackClaim = claimRequest({
    seed: rollbackFixtureSeed(rollbackFixture),
    jobId: 'job_rollback_1',
    key: 'idem-rollback-claim-0001',
    requestedAt: baseTime,
  })
  rollbackFixture.controls.failNextBeforeCommit('claim_and_enqueue')
  await expectApiError(
    () => rollbackPort.claimAndEnqueue(rollbackClaim),
    'INTERNAL_ERROR',
  )
  assert.equal(rollbackFixture.controls.inspect().revision, 0)
  assert.equal(rollbackFixture.controls.inspect().attempts.length, 0)
  assert.equal(rollbackFixture.controls.inspect().idempotencyRecordCount, 0)
  record('claim_rollback_leaves_no_partial_state')

  const createdClaim = await rollbackPort.claimAndEnqueue(rollbackClaim)
  assert.equal(createdClaim.idempotencyStatus, 'inserted')
  assert.equal(createdClaim.response.attempt.packageDeliveryAttempt, 1)
  assert.equal(createdClaim.response.job.state, 'leased')
  const replayedClaim = await rollbackPort.claimAndEnqueue(rollbackClaim)
  assert.equal(replayedClaim.idempotencyStatus, 'exact_replay')
  assert.deepEqual(replayedClaim.response, createdClaim.response)
  assert.equal(rollbackFixture.controls.inspect().revision, 1)
  assert.equal(rollbackFixture.controls.inspect().attempts.length, 1)
  record('lost_response_replay_returns_exact_committed_response')

  const nestedTamper = structuredClone(createdClaim.response)
  nestedTamper.attempt.heartbeatCount += 1
  const { responseHash: _nestedResponseHash, ...nestedTamperPayload } = nestedTamper
  void _nestedResponseHash
  nestedTamper.responseHash = sha256AuthorityValue(nestedTamperPayload)
  assert.throws(
    () => assertCanonicalDistributedMutationResponseIntegrity(nestedTamper),
    (error: unknown) => error instanceof ApiError &&
      error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )
  record('outer_checksum_cannot_hide_nested_state_tampering')

  const lineageFixture = fixture('lineage', 1, 1)
  const lineageAdapter: CanonicalDistributedPackageStateTransactionPort = {
    ...lineageFixture.adapter,
    async claimAndEnqueue(input) {
      const result = await lineageFixture.adapter.claimAndEnqueue(input)
      const response = structuredClone(result.response)
      response.operation = 'accept_controller'
      response.transaction.operation = 'accept_controller'
      const { transactionHash: _transactionHash, ...transactionPayload } =
        response.transaction
      void _transactionHash
      response.transaction.transactionHash = sha256AuthorityValue(transactionPayload)
      const { responseHash: _responseHash, ...responsePayload } = response
      void _responseHash
      response.responseHash = sha256AuthorityValue(responsePayload)
      return { ...result, response }
    },
  }
  const lineagePort = createCanonicalDistributedPackageStateContractBoundary(lineageAdapter)
  await expectApiError(
    () => lineagePort.claimAndEnqueue(claimRequest({
      seed: rollbackFixtureSeed(lineageFixture),
      jobId: 'job_lineage_1',
      key: 'idem-lineage-operation-0001',
      requestedAt: baseTime,
    })),
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )
  record('adapter_cannot_return_a_different_operation_lineage')

  const changedClaim = claimRequest({
    seed: rollbackFixtureSeed(rollbackFixture),
    jobId: 'job_rollback_1',
    key: 'idem-rollback-claim-0001',
    requestedAt: plus(baseTime, 1),
  })
  await expectApiError(
    () => rollbackPort.claimAndEnqueue(changedClaim),
    'IDEMPOTENCY_CONFLICT',
  )
  record('same_idempotency_key_changed_request_rejected')
  await expectApiError(
    () => rollbackPort.claimAndEnqueue({
      ...claimRequest({
        seed: rollbackFixtureSeed(rollbackFixture),
        jobId: 'job_rollback_1',
        key: 'idem-extra-state-field-0001',
        requestedAt: plus(baseTime, 2),
      }),
      packageDeliveryAttempt: 99,
    }),
    'VALIDATION_FAILED',
  )
  record('caller_selected_attempt_field_rejected')

  const raceFixture = fixture('race', 1, 2)
  const racePort = createCanonicalDistributedPackageStateContractBoundary(raceFixture.adapter)
  const raceClaim = claimRequest({
    seed: rollbackFixtureSeed(raceFixture),
    jobId: 'job_race_1',
    key: 'idem-race-claim-000001',
    requestedAt: baseTime,
  })
  const concurrentClaims = await Promise.all([
    racePort.claimAndEnqueue(raceClaim),
    racePort.claimAndEnqueue(raceClaim),
  ])
  assert.deepEqual(
    concurrentClaims.map((result) => result.idempotencyStatus).sort(),
    ['exact_replay', 'inserted'],
  )
  assert.equal(raceFixture.controls.inspect().attempts.length, 1)
  assert.equal(raceFixture.controls.inspect().jobs[0]?.deliveryAttemptCount, 1)
  record('concurrent_claims_serialize_to_one_attempt')

  const lifecycleFixture = fixture('lifecycle', 1, 2)
  const lifecyclePort = createCanonicalDistributedPackageStateContractBoundary(
    lifecycleFixture.adapter,
  )
  const lifecycle = await createStartedAttempt({
    fixture: lifecycleFixture,
    port: lifecyclePort,
    jobId: 'job_lifecycle_1',
    prefix: 'lifecycle',
    claimedAt: baseTime,
  })
  assert.equal(
    lifecycle.controller.response.attempt.controllerRequestBindingHash,
    hash(`${lifecycle.dispatchIntentId}:controller-request`),
  )
  assert.equal(
    lifecycle.start.response.attempt.workerRequestBindingHash,
    hash(`${lifecycle.dispatchIntentId}:worker-request`),
  )
  record('controller_acceptance_binds_exact_attempt')
  record('controller_and_worker_request_bindings_are_durable')

  const rollbackStartFixture = fixture('startrollback', 1, 2)
  const rollbackStartPort = createCanonicalDistributedPackageStateContractBoundary(
    rollbackStartFixture.adapter,
  )
  const startClaim = await claimAndAcceptController({
    fixture: rollbackStartFixture,
    port: rollbackStartPort,
    jobId: 'job_startrollback_1',
    prefix: 'startrollback',
    claimedAt: baseTime,
  })
  const startRequest = workerStartRequest({
    seed: rollbackFixtureSeed(rollbackStartFixture),
    dispatchIntentId: startClaim.dispatchIntentId,
    key: 'idem-start-rollback-0001',
    acceptedAt: plus(baseTime, 2_000),
  })
  rollbackStartFixture.controls.failNextBeforeCommit('accept_worker_and_start')
  await expectApiError(
    () => rollbackStartPort.acceptWorkerAndStart(startRequest),
    'INTERNAL_ERROR',
  )
  const afterStartRollback = rollbackStartFixture.controls.inspect()
  assert.equal(afterStartRollback.revision, 2)
  assert.equal(afterStartRollback.attempts[0]?.state, 'controller_identity_accepted')
  assert.equal(afterStartRollback.attempts[0]?.attemptStart, null)
  record('worker_acceptance_start_rollback_is_atomic')
  const insertedStart = await rollbackStartPort.acceptWorkerAndStart(startRequest)
  assert.equal(insertedStart.response.attempt.state, 'worker_execution_started')
  assert.equal(
    insertedStart.response.attempt.attemptStart?.meteringProfile.workloadProfileId,
    'deepfilternet_cpu_4vcpu_4gib_v1',
  )
  record('worker_acceptance_and_metered_start_share_commit')
  const wrongControllerReceiptFixture = fixture('wrong_controller_receipt', 1, 1)
  const wrongControllerReceiptPort = createCanonicalDistributedPackageStateContractBoundary(
    wrongControllerReceiptFixture.adapter,
  )
  const wrongControllerReceiptClaim = await claimAndAcceptController({
    fixture: wrongControllerReceiptFixture,
    port: wrongControllerReceiptPort,
    jobId: 'job_wrong_controller_receipt_1',
    prefix: 'wrong-controller-receipt',
    claimedAt: baseTime,
  })
  await expectApiError(
    () => wrongControllerReceiptPort.acceptWorkerAndStart({
      ...workerStartRequest({
        seed: rollbackFixtureSeed(wrongControllerReceiptFixture),
        dispatchIntentId: wrongControllerReceiptClaim.dispatchIntentId,
        key: 'idem-wrong-controller-receipt-0001',
        acceptedAt: plus(baseTime, 2_000),
        controllerReceiptHash: hash('wrong-controller-receipt'),
      }),
    }),
    'IDEMPOTENCY_CONFLICT',
  )
  record('worker_start_requires_exact_controller_receipt')
  await expectApiError(
    () => rollbackStartPort.acceptWorkerAndStart({
      ...startRequest,
      actualInternalCostMicros: 1,
    }),
    'VALIDATION_FAILED',
  )
  record('caller_selected_cost_field_rejected')

  const heartbeat = heartbeatRequest({
    seed: rollbackFixtureSeed(lifecycleFixture),
    dispatchIntentId: lifecycle.dispatchIntentId,
    key: 'idem-lifecycle-heartbeat-0001',
    heartbeatAt: plus(baseTime, 5_000),
  })
  const heartbeatResult = await lifecyclePort.heartbeatWorker(heartbeat)
  assert.equal(heartbeatResult.response.attempt.heartbeatCount, 1)
  assert.equal(heartbeatResult.response.attempt.claimExpiresAt, plus(baseTime, 15_000))
  assert.equal(
    heartbeatResult.response.attempt.attemptStart?.evidenceHash,
    lifecycle.start.response.attempt.attemptStart?.evidenceHash,
  )
  record('heartbeat_extends_lease_without_changing_attempt_start')
  await expectApiError(
    () => lifecyclePort.heartbeatWorker({ ...heartbeat, claimExpiresAt: plus(baseTime, 60_000) }),
    'VALIDATION_FAILED',
  )
  record('caller_selected_heartbeat_expiry_rejected')

  const completion = completionRequest({
    seed: rollbackFixtureSeed(lifecycleFixture),
    dispatchIntentId: lifecycle.dispatchIntentId,
    key: 'idem-lifecycle-complete-0001',
    completedAt: plus(baseTime, 8_000),
  })
  const failure = failureRequest({
    seed: rollbackFixtureSeed(lifecycleFixture),
    dispatchIntentId: lifecycle.dispatchIntentId,
    key: 'idem-lifecycle-failure-0001',
    failedAt: plus(baseTime, 8_000),
  })
  const terminalRace = await Promise.allSettled([
    lifecyclePort.reconcileCompletion(completion),
    lifecyclePort.reconcileFailure(failure),
  ])
  assert.equal(terminalRace[0]?.status, 'fulfilled')
  assert.equal(terminalRace[1]?.status, 'rejected')
  const completionResult = (terminalRace[0] as PromiseFulfilledResult<
    CanonicalDistributedPortResult<CanonicalDistributedPackageMutationResponse>
  >).value
  assert.equal(completionResult.response.attempt.state, 'worker_completion_reconciled')
  assert.equal(completionResult.response.job.state, 'completed')
  assert.equal(
    completionResult.response.attempt.terminal?.terminalCost.attemptStartEvidenceHash,
    completionResult.response.attempt.attemptStart?.evidenceHash,
  )
  assert.equal(
    completionResult.response.attempt.terminal?.terminalCost
      .customerPriceCreditsServiceFeeWalletOrBillingIncluded,
    false,
  )
  assert.equal(completionResult.response.attempt.terminal?.automaticRetryStarted, false)
  assert.equal(
    completionResult.response.attempt.terminal?.linkedCanonicalOutcomeHash,
    completion.linkedCanonicalOutcomeHash,
  )
  assert.equal(
    completionResult.response.attempt.terminal?.outputByteLength,
    completion.outputByteLength,
  )
  assert.equal(completionResult.response.attempt.terminal?.failureCategory, null)
  record('completion_failure_race_commits_one_terminal_state')
  record('terminal_internal_cost_links_exact_attempt_start')
  record('terminal_cost_excludes_customer_commercial_authority')
  record('completion_terminal_retains_exact_outcome_lineage')
  const completionReplay = await lifecyclePort.reconcileCompletion(completion)
  assert.equal(completionReplay.idempotencyStatus, 'exact_replay')
  assert.deepEqual(completionReplay.response, completionResult.response)
  record('terminal_lost_response_replays_exactly')

  const failureFixture = fixture('failure', 1, 2)
  const failurePort = createCanonicalDistributedPackageStateContractBoundary(
    failureFixture.adapter,
  )
  const failedAttempt = await createStartedAttempt({
    fixture: failureFixture,
    port: failurePort,
    jobId: 'job_failure_1',
    prefix: 'failure-a1',
    claimedAt: baseTime,
  })
  const failed = await failurePort.reconcileFailure(failureRequest({
    seed: rollbackFixtureSeed(failureFixture),
    dispatchIntentId: failedAttempt.dispatchIntentId,
    key: 'idem-failure-terminal-0001',
    failedAt: plus(baseTime, 3_000),
  }))
  assert.equal(failed.response.job.state, 'queued')
  assert.equal(failed.response.job.remainingAttempts, 1)
  assert.equal(failed.response.attempt.terminal?.queueDisposition, 'retry_available')
  assert.equal(failed.response.attempt.terminal?.automaticRetryStarted, false)
  assert.equal(
    failed.response.attempt.terminal?.failureCategory,
    'reeditpro_error_absorbed',
  )
  assert.equal(failureFixture.controls.inspect().attempts.length, 1)
  record('failure_exposes_retry_without_starting_it')
  record('failure_terminal_retains_failure_category')
  const secondClaim = await failurePort.claimAndEnqueue(claimRequest({
    seed: rollbackFixtureSeed(failureFixture),
    jobId: 'job_failure_1',
    key: 'idem-failure-explicit-a2',
    requestedAt: plus(baseTime, 4_000),
  }))
  assert.equal(secondClaim.response.attempt.packageDeliveryAttempt, 2)
  assert.equal(failureFixture.controls.inspect().attempts.length, 2)
  record('later_attempt_requires_explicit_enqueue')

  const timeoutFixture = fixture('timeout', 1, 2)
  const timeoutPort = createCanonicalDistributedPackageStateContractBoundary(
    timeoutFixture.adapter,
  )
  const timedAttempt = await createStartedAttempt({
    fixture: timeoutFixture,
    port: timeoutPort,
    jobId: 'job_timeout_1',
    prefix: 'timeout',
    claimedAt: baseTime,
  })
  await timeoutPort.heartbeatWorker(heartbeatRequest({
    seed: rollbackFixtureSeed(timeoutFixture),
    dispatchIntentId: timedAttempt.dispatchIntentId,
    key: 'idem-timeout-heartbeat-0001',
    heartbeatAt: plus(baseTime, 5_000),
  }))
  const earlySweep = await timeoutPort.finalizeExpiredTimeouts(timeoutSweepRequest({
    seed: rollbackFixtureSeed(timeoutFixture),
    observedAt: plus(baseTime, 11_000),
  }))
  assert.equal(earlySweep.response.reconciledCount, 0)
  assert.equal(earlySweep.response.transaction, null)
  record('pre_expiry_timeout_sweep_is_non_mutating')
  const beforeWrongController = timeoutFixture.controls.inspect()
  await expectApiError(
    () => timeoutPort.finalizeExpiredTimeouts(timeoutSweepRequest({
      seed: rollbackFixtureSeed(timeoutFixture),
      observedAt: plus(baseTime, 16_000),
      controllerIdentityEvidenceHash: hash('wrong-controller'),
    })),
    'INTERNAL_SERVICE_AUTH_INVALID',
  )
  assert.deepEqual(timeoutFixture.controls.inspect(), beforeWrongController)
  record('wrong_controller_timeout_sweep_cannot_mutate')
  await expectApiError(
    () => timeoutPort.finalizeExpiredTimeouts({
      ...timeoutSweepRequest({
        seed: rollbackFixtureSeed(timeoutFixture),
        observedAt: plus(baseTime, 16_000),
      }),
      dispatchIntentId: timedAttempt.dispatchIntentId,
    }),
    'VALIDATION_FAILED',
  )
  record('timeout_sweep_rejects_caller_selected_dispatch')
  timeoutFixture.controls.failNextBeforeCommit('finalize_expired_timeouts')
  await expectApiError(
    () => timeoutPort.finalizeExpiredTimeouts(timeoutSweepRequest({
      seed: rollbackFixtureSeed(timeoutFixture),
      observedAt: plus(baseTime, 16_000),
    })),
    'INTERNAL_ERROR',
  )
  assert.equal(
    timeoutFixture.controls.inspect().attempts[0]?.state,
    'worker_execution_started',
  )
  record('timeout_batch_rollback_leaves_no_partial_terminal')
  const timeoutBatchRequest = timeoutSweepRequest({
    seed: rollbackFixtureSeed(timeoutFixture),
    observedAt: plus(baseTime, 16_000),
  })
  const timeoutBatch = await timeoutPort.finalizeExpiredTimeouts(timeoutBatchRequest)
  assert.equal(timeoutBatch.response.expiredCandidateCount, 1)
  assert.equal(timeoutBatch.response.selectedCandidateCount, 1)
  assert.equal(
    timeoutBatch.response.outcomes[0]?.dispatchIntentId,
    timedAttempt.dispatchIntentId,
  )
  assert.equal(timeoutBatch.response.outcomes[0]?.queueDisposition, 'retry_available')
  const timeoutBatchReplay = await timeoutPort.finalizeExpiredTimeouts(timeoutBatchRequest)
  assert.equal(timeoutBatchReplay.idempotencyStatus, 'exact_replay')
  assert.deepEqual(timeoutBatchReplay.response, timeoutBatch.response)
  record('lost_timeout_response_replays_exact_committed_batch')
  const timedOutView = timeoutFixture.controls.inspect().attempts[0]
  assert.equal(timedOutView?.state, 'worker_timeout_reconciled')
  assert.equal(timedOutView?.terminal?.terminalAt, plus(baseTime, 15_000))
  assert.equal(timedOutView?.terminal?.terminalCost.finishedAt, plus(baseTime, 15_000))
  assert.equal(timedOutView?.terminal?.automaticRetryStarted, false)
  record('timeout_terminal_cost_stops_at_immutable_lease_expiry')
  record('timeout_reconciliation_does_not_start_retry')
  const repeatedSweep = await timeoutPort.finalizeExpiredTimeouts(timeoutSweepRequest({
    seed: rollbackFixtureSeed(timeoutFixture),
    observedAt: plus(baseTime, 20_000),
  }))
  assert.equal(repeatedSweep.response.reconciledCount, 0)
  assert.equal(timeoutFixture.controls.inspect().attempts.length, 1)
  record('repeated_timeout_sweep_creates_no_duplicate_terminal')

  const timeoutRaceFixture = fixture('timeoutrace', 1, 1)
  const timeoutRacePort = createCanonicalDistributedPackageStateContractBoundary(
    timeoutRaceFixture.adapter,
  )
  const timeoutRaceAttempt = await createStartedAttempt({
    fixture: timeoutRaceFixture,
    port: timeoutRacePort,
    jobId: 'job_timeoutrace_1',
    prefix: 'timeoutrace',
    claimedAt: baseTime,
  })
  const timeoutCompletionRace = await Promise.allSettled([
    timeoutRacePort.finalizeExpiredTimeouts(timeoutSweepRequest({
      seed: rollbackFixtureSeed(timeoutRaceFixture),
      observedAt: plus(baseTime, 11_000),
    })),
    timeoutRacePort.reconcileCompletion(completionRequest({
      seed: rollbackFixtureSeed(timeoutRaceFixture),
      dispatchIntentId: timeoutRaceAttempt.dispatchIntentId,
      key: 'idem-timeoutrace-complete-01',
      completedAt: plus(baseTime, 8_000),
    })),
  ])
  assert.equal(timeoutCompletionRace[0]?.status, 'fulfilled')
  assert.equal(timeoutCompletionRace[1]?.status, 'rejected')
  assert.equal(
    timeoutRaceFixture.controls.inspect().attempts[0]?.state,
    'worker_timeout_reconciled',
  )
  assert.equal(timeoutRaceFixture.controls.inspect().jobs[0]?.state, 'blocked')
  assert.equal(timeoutRaceFixture.controls.inspect().jobs[0]?.attemptsExhausted, true)
  assert.equal(timeoutRaceFixture.controls.inspect().attempts.length, 1)
  record('timeout_completion_race_commits_one_terminal_state')
  record('exhausted_terminal_attempt_blocks_job_without_retry')

  const batchFixture = fixture('batch', 33, 1)
  const batchPort = createCanonicalDistributedPackageStateContractBoundary(batchFixture.adapter)
  for (let index = 1; index <= 33; index += 1) {
    await createStartedAttempt({
      fixture: batchFixture,
      port: batchPort,
      jobId: `job_batch_${index}`,
      prefix: `batch-${index}`,
      claimedAt: baseTime,
    })
  }
  const firstBatch = await batchPort.finalizeExpiredTimeouts(timeoutSweepRequest({
    seed: rollbackFixtureSeed(batchFixture),
    observedAt: plus(baseTime, 11_000),
  }))
  assert.equal(firstBatch.response.expiredCandidateCount, 33)
  assert.equal(firstBatch.response.selectedCandidateCount, 32)
  assert.equal(firstBatch.response.outcomes.length, 32)
  const secondBatch = await batchPort.finalizeExpiredTimeouts(timeoutSweepRequest({
    seed: rollbackFixtureSeed(batchFixture),
    observedAt: plus(baseTime, 12_000),
  }))
  assert.equal(secondBatch.response.expiredCandidateCount, 1)
  assert.equal(secondBatch.response.selectedCandidateCount, 1)
  assert.equal(batchFixture.controls.inspect().attempts.filter((attempt) =>
    attempt.state === 'worker_timeout_reconciled').length, 33)
  record('timeout_selection_is_server_owned_and_bounded_to_32')
  record('later_sweep_reconciles_remaining_candidate')

  const finalInspection = lifecycleFixture.controls.inspect()
  assert.equal(finalInspection.persistedPlaintextClaimCredentialCount, 0)
  assert.equal(finalInspection.persistedPlaintextIdempotencyKeyCount, 0)
  assert.equal(finalInspection.customerCommercialAuthorityRecordCount, 0)
  assert.ok(finalInspection.idempotencyKeyHashes.every((value) => /^[a-f0-9]{64}$/u.test(value)))
  record('fixture_persists_only_idempotency_key_hashes')
  record('fixture_persists_no_claim_credentials')
  record('fixture_contains_no_customer_commercial_records')

  const descriptor = lifecyclePort.descriptor
  assert.equal(descriptor.databaseBackend, 'none')
  assert.equal(descriptor.distributedDatabaseTransactionVerified, false)
  assert.equal(descriptor.multiReplicaDurabilityVerified, false)
  assert.equal(descriptor.liveSupabaseOrPostgresCallPerformed, false)
  assert.equal(descriptor.cloudCallPerformed, false)
  assert.equal(descriptor.productionAuthority, false)
  record('database_and_cloud_readiness_remain_false')

  const payload = {
    schemaVersion: 'canonical-distributed-package-state-conformance-v1' as const,
    source: 'database_neutral_package_state_contract_fixture' as const,
    adapterId: descriptor.adapterId,
    adapterDescriptorHash: descriptor.descriptorHash,
    checkCount: checks.length,
    checks,
    exactRequestAndResponseSchemasVerified: true as const,
    serializableClaimAndReplayVerified: true as const,
    rollbackBeforeCommitVerified: true as const,
    workerAcceptanceAndAttemptStartShareCommitVerified: true as const,
    heartbeatLeaseExtensionVerified: true as const,
    completionFailureTimeoutTerminalExclusivityVerified: true as const,
    terminalInternalCostLinkageVerified: true as const,
    controllerOwnedBoundedTimeoutSelectionVerified: true as const,
    automaticRetryStarted: false as const,
    customerCommercialAuthorityIncluded: false as const,
    databaseBackendUsed: false as const,
    distributedDatabaseTransactionVerified: false as const,
    multiReplicaDurabilityVerified: false as const,
    liveSupabaseOrPostgresCallPerformed: false as const,
    cloudCallPerformed: false as const,
    productionAuthority: false as const,
  }
  const evidence = Object.freeze(
    canonicalDistributedPackageStateConformanceEvidenceSchema.parse({
      ...payload,
      evidenceHash: sha256AuthorityValue(payload),
    }),
  )
  conformanceEvidenceBrands.add(evidence)
  return evidence
}

export function assertCanonicalDistributedPackageStateConformanceEvidence(
  evidence: CanonicalDistributedPackageStateConformanceEvidence,
): void {
  if (!conformanceEvidenceBrands.has(evidence)) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Distributed package-state conformance evidence requires its process-local verifier brand.',
      503,
    )
  }
  const parsed = canonicalDistributedPackageStateConformanceEvidenceSchema.parse(evidence)
  const { evidenceHash, ...payload } = parsed
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new ApiError(
      'IDEMPOTENCY_ATOMICITY_REQUIRED',
      'Distributed package-state conformance evidence checksum is invalid.',
      503,
    )
  }
}

async function createStartedAttempt(input: {
  fixture: CanonicalDistributedPackageStateFixture
  port: CanonicalDistributedPackageStateTransactionPort
  jobId: string
  prefix: string
  claimedAt: string
}) {
  const claim = await claimAndAcceptController(input)
  const start = await input.port.acceptWorkerAndStart(workerStartRequest({
    seed: rollbackFixtureSeed(input.fixture),
    dispatchIntentId: claim.dispatchIntentId,
    key: `idem-${input.prefix}-worker-start-01`,
    acceptedAt: plus(input.claimedAt, 2_000),
  }))
  return { ...claim, start }
}

async function claimAndAcceptController(input: {
  fixture: CanonicalDistributedPackageStateFixture
  port: CanonicalDistributedPackageStateTransactionPort
  jobId: string
  prefix: string
  claimedAt: string
}) {
  const seed = rollbackFixtureSeed(input.fixture)
  const claim = await input.port.claimAndEnqueue(claimRequest({
    seed,
    jobId: input.jobId,
    key: `idem-${input.prefix}-claim-0000001`,
    requestedAt: input.claimedAt,
  }))
  const dispatchIntentId = claim.response.attempt.dispatchIntentId
  const controller = await input.port.acceptController(controllerRequest({
    seed,
    dispatchIntentId,
    key: `idem-${input.prefix}-controller-01`,
    acceptedAt: plus(input.claimedAt, 1_000),
  }))
  return { claim, controller, dispatchIntentId }
}

function fixture(prefix: string, jobCount: number, maxAttempts: number) {
  const seed = createSeed(prefix, jobCount, maxAttempts)
  const created = createInMemoryCanonicalDistributedPackageStateFixture(seed)
  fixtureSeeds.set(created, seed)
  return created
}

const fixtureSeeds = new WeakMap<
  CanonicalDistributedPackageStateFixture,
  CanonicalDistributedPackageFixtureSeed
>()

function rollbackFixtureSeed(
  fixtureValue: CanonicalDistributedPackageStateFixture,
): CanonicalDistributedPackageFixtureSeed {
  const seed = fixtureSeeds.get(fixtureValue)
  if (!seed) throw new Error('Distributed package-state fixture seed was not registered.')
  return seed
}

function createSeed(
  prefix: string,
  jobCount: number,
  maxAttempts: number,
): CanonicalDistributedPackageFixtureSeed {
  const identityPayload = {
    ownerUserId: `owner_${prefix}`,
    workspaceId: `workspace_${prefix}`,
    projectId: `project_${prefix}`,
    editSessionId: `edit_${prefix}`,
    packageRecordId: `package_${prefix}`,
    approvedPlanSnapshotId: `snapshot_${prefix}`,
    approvedCreditReservationId: `reservation_${prefix}`,
    packageHash: hash(`${prefix}:package`),
    snapshotHash: hash(`${prefix}:snapshot`),
    queueDefinitionHash: hash(`${prefix}:queue`),
    handoffManifestHash: hash(`${prefix}:manifest`),
  }
  return {
    identity: {
      ...identityPayload,
      identityHash: sha256AuthorityValue({
        domain: 'canonical_distributed_package_identity_v1',
        ...identityPayload,
      }),
    },
    jobs: Array.from({ length: jobCount }, (_, index) => {
      const jobNumber = index + 1
      const jobId = `job_${prefix}_${jobNumber}`
      return {
        jobId,
        approvedWorkItemId: `work_${prefix}_${jobNumber}`,
        workItemKey: `work_key_${prefix}_${jobNumber}`,
        required: true,
        dependencyJobIds: [],
        maxAttempts,
        leaseDurationMs: 10_000,
        attemptDeadlineDurationMs: 60_000,
        queueJobDefinitionHash: hash(`${prefix}:${jobId}:definition`),
        manifestEntryHash: hash(`${prefix}:${jobId}:manifest-entry`),
        dispatchBindingHash: hash(`${prefix}:${jobId}:dispatch-binding`),
        meteringProfile: {
          toolId: 'deepfilternet' as const,
          operationId: 'tool.deepfilternet.enhance_voice.v1' as const,
          workloadProfileId: 'deepfilternet_cpu_4vcpu_4gib_v1' as const,
          vcpuCount: 4 as const,
          memoryGib: 4 as const,
          gpuCount: 0 as const,
        },
      }
    }),
  }
}

function claimRequest(input: {
  seed: CanonicalDistributedPackageFixtureSeed
  jobId: string
  key: string
  requestedAt: string
}) {
  return withIdempotency('claim_and_enqueue', input.key, {
    packageRecordId: input.seed.identity.packageRecordId,
    jobId: input.jobId,
    controllerIdentityEvidenceHash: controllerHash(input.seed),
    requestedAt: input.requestedAt,
  })
}

function controllerRequest(input: {
  seed: CanonicalDistributedPackageFixtureSeed
  dispatchIntentId: string
  key: string
  acceptedAt: string
}) {
  return withIdempotency('accept_controller', input.key, {
    packageRecordId: input.seed.identity.packageRecordId,
    dispatchIntentId: input.dispatchIntentId,
    controllerIdentityEvidenceHash: controllerHash(input.seed),
    controllerRequestBindingHash: hash(`${input.dispatchIntentId}:controller-request`),
    controllerReceiptHash: hash(`${input.dispatchIntentId}:controller-receipt`),
    acceptedAt: input.acceptedAt,
  })
}

function workerStartRequest(input: {
  seed: CanonicalDistributedPackageFixtureSeed
  dispatchIntentId: string
  key: string
  acceptedAt: string
  controllerReceiptHash?: string
}) {
  return withIdempotency('accept_worker_and_start', input.key, {
    packageRecordId: input.seed.identity.packageRecordId,
    dispatchIntentId: input.dispatchIntentId,
    controllerReceiptHash: input.controllerReceiptHash ??
      hash(`${input.dispatchIntentId}:controller-receipt`),
    workerIdentityEvidenceHash: workerHash(input.seed),
    workerRequestBindingHash: hash(`${input.dispatchIntentId}:worker-request`),
    workerReceiptHash: workerReceiptHash(input.dispatchIntentId),
    acceptedAt: input.acceptedAt,
  })
}

function heartbeatRequest(input: {
  seed: CanonicalDistributedPackageFixtureSeed
  dispatchIntentId: string
  key: string
  heartbeatAt: string
}) {
  return withIdempotency('heartbeat_worker', input.key, {
    packageRecordId: input.seed.identity.packageRecordId,
    dispatchIntentId: input.dispatchIntentId,
    workerIdentityEvidenceHash: workerHash(input.seed),
    workerReceiptHash: workerReceiptHash(input.dispatchIntentId),
    heartbeatAt: input.heartbeatAt,
  })
}

function completionRequest(input: {
  seed: CanonicalDistributedPackageFixtureSeed
  dispatchIntentId: string
  key: string
  completedAt: string
}) {
  return withIdempotency('reconcile_completion', input.key, {
    packageRecordId: input.seed.identity.packageRecordId,
    dispatchIntentId: input.dispatchIntentId,
    workerIdentityEvidenceHash: workerHash(input.seed),
    workerReceiptHash: workerReceiptHash(input.dispatchIntentId),
    completionEvidenceHash: hash(`${input.dispatchIntentId}:completion-evidence`),
    linkedCanonicalOutcomeHash: hash(`${input.dispatchIntentId}:canonical-outcome`),
    outputByteLength: 4_096,
    completedAt: input.completedAt,
  })
}

function failureRequest(input: {
  seed: CanonicalDistributedPackageFixtureSeed
  dispatchIntentId: string
  key: string
  failedAt: string
}) {
  return withIdempotency('reconcile_failure', input.key, {
    packageRecordId: input.seed.identity.packageRecordId,
    dispatchIntentId: input.dispatchIntentId,
    workerIdentityEvidenceHash: workerHash(input.seed),
    workerReceiptHash: workerReceiptHash(input.dispatchIntentId),
    failureEvidenceHash: hash(`${input.dispatchIntentId}:failure-evidence`),
    failureCategory: 'reeditpro_error_absorbed' as const,
    failedAt: input.failedAt,
  })
}

function timeoutSweepRequest(input: {
  seed: CanonicalDistributedPackageFixtureSeed
  observedAt: string
  controllerIdentityEvidenceHash?: string
  key?: string
}) {
  return withIdempotency('finalize_expired_timeouts', input.key ??
    `idem-timeout-${hash(`${input.seed.identity.packageRecordId}:${input.observedAt}`).slice(0, 32)}`, {
    packageRecordId: input.seed.identity.packageRecordId,
    controllerIdentityEvidenceHash: input.controllerIdentityEvidenceHash ??
      controllerHash(input.seed),
    observedAt: input.observedAt,
  })
}

function withIdempotency<
  TOperation extends CanonicalDistributedPackageMutationResponse['operation'] |
    'finalize_expired_timeouts',
  TRequest extends Record<string, unknown>,
>(operation: TOperation, idempotencyKey: string, request: TRequest) {
  return {
    ...request,
    idempotencyKey,
    requestHash: canonicalDistributedPackageStateRequestHash({ operation, request }),
  }
}

function controllerHash(seed: CanonicalDistributedPackageFixtureSeed): string {
  return hash(`${seed.identity.packageRecordId}:controller-identity`)
}

function workerHash(seed: CanonicalDistributedPackageFixtureSeed): string {
  return hash(`${seed.identity.packageRecordId}:worker-identity`)
}

function workerReceiptHash(dispatchIntentId: string): string {
  return hash(`${dispatchIntentId}:worker-receipt`)
}

function plus(timestamp: string, milliseconds: number): string {
  return new Date(Date.parse(timestamp) + milliseconds).toISOString()
}

function hash(value: string): string {
  return sha256AuthorityValue({ domain: 'canonical_distributed_conformance_v1', value })
}

async function expectApiError(
  operation: () => Promise<unknown>,
  code: ApiError['code'],
): Promise<ApiError> {
  try {
    await operation()
  } catch (error) {
    assert.ok(error instanceof ApiError, 'Expected an ApiError.')
    assert.equal(error.code, code)
    return error
  }
  throw new Error(`Expected ${code}, but the operation succeeded.`)
}
