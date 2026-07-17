import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_DEFINITION_VERSION,
  canonicalPrivatePackageWorkQueueDefinitionSchema,
  canonicalPrivatePackageWorkQueueJobDefinitionSchema,
  type CanonicalPrivatePackageWorkQueueDefinition,
  type CanonicalPrivatePackageWorkQueueJobDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import { ApiError } from '../errors/api-error'
import {
  canonicalPrivatePackageWorkQueueAggregateRelativePath,
  claimPrivateCanonicalPackageWorkQueueJob,
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke,
  completePrivateCanonicalPackageWorkQueueClaim,
  ensurePrivateCanonicalPackageWorkQueue,
  heartbeatPrivateCanonicalPackageWorkQueueClaim,
  readPrivateCanonicalPackageWorkQueue,
  releasePrivateCanonicalPackageWorkQueueClaim,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from '../services/private-canonical-package-work-queue-store'
import { sha256AuthorityValue, stableAuthorityStringify } from
  '../services/private-edit-authority-store'
import type {
  CanonicalPrivatePackageWorkQueueAggregate,
  CanonicalPrivatePackageWorkQueueCompletedOutcome,
} from '../validation/canonical-private-package-work-queue-schemas'

const rootPath = await mkdtemp(join(tmpdir(), 'reeditpro-canonical-package-queue-'))
const baseTimeMs = Date.parse('2026-07-16T20:00:00.000Z')
const now = (offsetMs: number) => new Date(baseTimeMs + offsetMs).toISOString()
const scope: CanonicalPrivatePackageWorkQueueStoreScope = {
  localStorageRoot: rootPath,
  ownerUserId: 'queue-owner',
  workspaceId: 'queue-workspace',
  projectId: 'queue-project',
  editSessionId: 'queue-session',
  packageRecordId: 'queue-package',
  approvedPlanSnapshotId: 'queue-snapshot',
}

try {
  const definition = createDefinition()
  const ensured = await ensurePrivateCanonicalPackageWorkQueue({
    scope,
    definition,
    now: now(0),
  })
  assert.equal(ensured.created, true)
  assert.equal(ensured.aggregate.summary.totalJobCount, 5)
  assert.equal(ensured.aggregate.summary.queuedJobCount, 5)
  assert.equal(ensured.aggregate.events.length, 1)
  assert.equal(ensured.aggregate.events[0]?.eventType, 'queue_created')

  const aggregatePath = join(
    rootPath,
    canonicalPrivatePackageWorkQueueAggregateRelativePath(scope),
  )
  const initialFile = await readFile(aggregatePath, 'utf8')
  const dependentBeforeRoot = await claimPrivateCanonicalPackageWorkQueueJob({
    scope,
    definition,
    jobId: 'job-dependent',
    workerIdentity: 'worker-dependent',
    workerType: 'gpu_ai_worker',
    now: now(0),
    leaseDurationMs: 10_000,
  })
  assert.equal(dependentBeforeRoot.disposition, 'dependency_blocked')
  const capabilityBlocked = await claimPrivateCanonicalPackageWorkQueueJob({
    scope,
    definition,
    jobId: 'job-provider-gated',
    workerIdentity: 'worker-render',
    workerType: 'render_worker',
    now: now(0),
    leaseDurationMs: 10_000,
  })
  assert.equal(capabilityBlocked.disposition, 'capability_blocked')
  const scheduledWait = await claimPrivateCanonicalPackageWorkQueueJob({
    scope,
    definition,
    jobId: 'job-scheduled',
    workerIdentity: 'worker-scheduled',
    workerType: 'cpu_analysis_worker',
    now: now(0),
    leaseDurationMs: 10_000,
  })
  assert.equal(scheduledWait.disposition, 'scheduled_wait')
  assert.equal(await readFile(aggregatePath, 'utf8'), initialFile)

  const concurrentRootClaims = await Promise.all([
    claimPrivateCanonicalPackageWorkQueueJob({
      scope,
      definition,
      jobId: 'job-root',
      workerIdentity: 'worker-root-one',
      workerType: 'cpu_analysis_worker',
      now: now(0),
      leaseDurationMs: 10_000,
    }),
    claimPrivateCanonicalPackageWorkQueueJob({
      scope,
      definition,
      jobId: 'job-root',
      workerIdentity: 'worker-root-two',
      workerType: 'cpu_analysis_worker',
      now: now(0),
      leaseDurationMs: 10_000,
    }),
  ])
  assert.deepEqual(
    concurrentRootClaims.map((claim) => claim.disposition).sort(),
    ['already_leased', 'claimed'],
  )
  const rootClaim = concurrentRootClaims.find((claim) => claim.disposition === 'claimed')
  if (!rootClaim || rootClaim.disposition !== 'claimed') throw new Error('Root claim was not acquired.')
  assert.equal(rootClaim.entry.activeClaim.deliveryAttempt, 1)
  assert.equal(JSON.stringify(rootClaim.aggregate).includes(rootClaim.claimCredential), false)

  await expectApiError(() => heartbeatPrivateCanonicalPackageWorkQueueClaim({
    scope,
    definition,
    jobId: 'job-root',
    claimId: rootClaim.entry.activeClaim.claimId,
    claimCredential: 'wrong-root-credential',
    now: now(1_000),
    leaseDurationMs: 10_000,
  }), 'WORKER_LEASE_EXPIRED')
  const heartbeated = await heartbeatPrivateCanonicalPackageWorkQueueClaim({
    scope,
    definition,
    jobId: 'job-root',
    claimId: rootClaim.entry.activeClaim.claimId,
    claimCredential: rootClaim.claimCredential,
    now: now(1_000),
    leaseDurationMs: 10_000,
  })
  assert.equal(requiredEntry(heartbeated, 'job-root').activeClaim?.heartbeatCount, 1)
  assert.equal(requiredEntry(heartbeated, 'job-root').activeClaim?.expiresAt, now(11_000))

  const rootOutcome = completedOutcome('job-root', [], 'root-artifact')
  await completePrivateCanonicalPackageWorkQueueClaim({
    scope,
    definition,
    jobId: 'job-root',
    claimId: rootClaim.entry.activeClaim.claimId,
    claimCredential: rootClaim.claimCredential,
    outcome: rootOutcome,
    now: now(2_000),
  })
  const rootCompletionFile = await readFile(aggregatePath, 'utf8')
  await completePrivateCanonicalPackageWorkQueueClaim({
    scope,
    definition,
    jobId: 'job-root',
    claimId: rootClaim.entry.activeClaim.claimId,
    claimCredential: rootClaim.claimCredential,
    outcome: rootOutcome,
    now: now(2_500),
  })
  assert.equal(await readFile(aggregatePath, 'utf8'), rootCompletionFile)
  await expectApiError(() => completePrivateCanonicalPackageWorkQueueClaim({
    scope,
    definition,
    jobId: 'job-root',
    claimId: rootClaim.entry.activeClaim.claimId,
    claimCredential: 'wrong-root-credential',
    outcome: rootOutcome,
    now: now(2_600),
  }), 'WORKER_LEASE_EXPIRED')
  await expectApiError(() => completePrivateCanonicalPackageWorkQueueClaim({
    scope,
    definition,
    jobId: 'job-root',
    claimId: rootClaim.entry.activeClaim.claimId,
    claimCredential: rootClaim.claimCredential,
    outcome: { ...rootOutcome, sha256: sha('different-root-bytes') },
    now: now(2_700),
  }), 'IDEMPOTENCY_CONFLICT')

  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const restartedAfterRoot = await readPrivateCanonicalPackageWorkQueue({ scope, definition })
  assert.ok(restartedAfterRoot)
  assert.equal(requiredEntry(restartedAfterRoot, 'job-root').state, 'completed')
  const completedClaimReplay = await claimPrivateCanonicalPackageWorkQueueJob({
    scope,
    definition,
    jobId: 'job-root',
    workerIdentity: 'worker-root-after-restart',
    workerType: 'cpu_analysis_worker',
    now: now(3_000),
    leaseDurationMs: 10_000,
  })
  assert.equal(completedClaimReplay.disposition, 'completed')
  assert.equal(await readFile(aggregatePath, 'utf8'), rootCompletionFile)

  const firstDependentClaim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope,
    definition,
    jobId: 'job-dependent',
    workerIdentity: 'worker-dependent-one',
    workerType: 'gpu_ai_worker',
    now: now(3_000),
    leaseDurationMs: 10_000,
  })
  if (firstDependentClaim.disposition !== 'claimed') {
    throw new Error('Dependent claim was not acquired after root completion.')
  }
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  const reclaimedDependent = await claimPrivateCanonicalPackageWorkQueueJob({
    scope,
    definition,
    jobId: 'job-dependent',
    workerIdentity: 'worker-dependent-two',
    workerType: 'gpu_ai_worker',
    now: now(14_001),
    leaseDurationMs: 10_000,
  })
  if (reclaimedDependent.disposition !== 'claimed') {
    throw new Error('Expired dependent claim was not reclaimed.')
  }
  assert.equal(reclaimedDependent.entry.activeClaim.deliveryAttempt, 2)
  assert.equal(reclaimedDependent.entry.expiredClaimRecoveryCount, 1)
  assert.notEqual(reclaimedDependent.claimCredential, firstDependentClaim.claimCredential)
  await expectApiError(() => completePrivateCanonicalPackageWorkQueueClaim({
    scope,
    definition,
    jobId: 'job-dependent',
    claimId: firstDependentClaim.entry.activeClaim.claimId,
    claimCredential: firstDependentClaim.claimCredential,
    outcome: completedOutcome('job-dependent', ['job-root'], 'stale-dependent-artifact'),
    now: now(14_500),
  }), 'WORKER_LEASE_EXPIRED')
  await completePrivateCanonicalPackageWorkQueueClaim({
    scope,
    definition,
    jobId: 'job-dependent',
    claimId: reclaimedDependent.entry.activeClaim.claimId,
    claimCredential: reclaimedDependent.claimCredential,
    outcome: completedOutcome('job-dependent', ['job-root'], 'dependent-artifact'),
    now: now(15_000),
  })

  const exhaustionClaim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope,
    definition,
    jobId: 'job-exhaustion',
    workerIdentity: 'worker-exhaustion',
    workerType: 'cpu_analysis_worker',
    now: now(16_000),
    leaseDurationMs: 10_000,
  })
  if (exhaustionClaim.disposition !== 'claimed') throw new Error('Exhaustion claim was not acquired.')
  await releasePrivateCanonicalPackageWorkQueueClaim({
    scope,
    definition,
    jobId: 'job-exhaustion',
    claimId: exhaustionClaim.entry.activeClaim.claimId,
    claimCredential: exhaustionClaim.claimCredential,
    reason: 'unexpected_execution_failure',
    now: now(17_000),
  })
  const releasedFile = await readFile(aggregatePath, 'utf8')
  await releasePrivateCanonicalPackageWorkQueueClaim({
    scope,
    definition,
    jobId: 'job-exhaustion',
    claimId: exhaustionClaim.entry.activeClaim.claimId,
    claimCredential: exhaustionClaim.claimCredential,
    reason: 'unexpected_execution_failure',
    now: now(17_500),
  })
  assert.equal(await readFile(aggregatePath, 'utf8'), releasedFile)
  await expectApiError(() => releasePrivateCanonicalPackageWorkQueueClaim({
    scope,
    definition,
    jobId: 'job-exhaustion',
    claimId: exhaustionClaim.entry.activeClaim.claimId,
    claimCredential: 'wrong-exhaustion-credential',
    reason: 'unexpected_execution_failure',
    now: now(17_600),
  }), 'WORKER_LEASE_EXPIRED')
  const attemptsExhausted = await claimPrivateCanonicalPackageWorkQueueJob({
    scope,
    definition,
    jobId: 'job-exhaustion',
    workerIdentity: 'worker-exhaustion-retry',
    workerType: 'cpu_analysis_worker',
    now: now(18_000),
    leaseDurationMs: 10_000,
  })
  assert.equal(attemptsExhausted.disposition, 'attempts_exhausted')
  assert.equal(requiredEntry(attemptsExhausted.aggregate, 'job-exhaustion').deliveryAttemptCount, 1)

  await expectApiError(() => claimPrivateCanonicalPackageWorkQueueJob({
    scope,
    definition,
    jobId: 'job-scheduled',
    workerIdentity: 'wrong-worker-type',
    workerType: 'qa_worker',
    now: now(19_000),
    leaseDurationMs: 10_000,
  }), 'WORKER_CLAIM_CONFLICT')

  const finalAggregate = await readPrivateCanonicalPackageWorkQueue({ scope, definition })
  assert.ok(finalAggregate)
  assert.deepEqual(finalAggregate.summary, {
    totalJobCount: 5,
    queuedJobCount: 3,
    leasedJobCount: 0,
    completedJobCount: 2,
    totalDeliveryAttemptCount: 4,
    expiredClaimRecoveryCount: 1,
    releasedClaimCount: 1,
    eventCount: 9,
  })
  assert.equal(finalAggregate.boundaries.privateLocalPersistence, true)
  assert.equal(finalAggregate.boundaries.hostRestartClaimRecovery, true)
  assert.equal(finalAggregate.boundaries.completedJobsAreTerminal, true)
  assert.equal(finalAggregate.boundaries.plaintextClaimCredentialsPersisted, false)
  assert.equal(finalAggregate.boundaries.claimCredentialDigestsPersisted, true)
  assert.equal(finalAggregate.boundaries.browserClaimAllowed, false)
  assert.equal(finalAggregate.boundaries.crossProcessAtomicClaimProven, true)
  assert.equal(finalAggregate.boundaries.distributedTransactionProven, false)
  assert.equal(finalAggregate.boundaries.cloudServiceIdentityVerified, false)
  assert.equal(finalAggregate.boundaries.cloudDispatchAuthorized, false)
  assert.equal(finalAggregate.boundaries.productionAuthority, false)
  assertHashChain(finalAggregate)

  const finalFile = await readFile(aggregatePath, 'utf8')
  for (const forbidden of [
    rootClaim.claimCredential,
    firstDependentClaim.claimCredential,
    reclaimedDependent.claimCredential,
    exhaustionClaim.claimCredential,
    'worker-root-one',
    'worker-root-two',
    'worker-dependent-one',
    'worker-dependent-two',
  ]) assert.equal(finalFile.includes(forbidden), false)

  const otherTenant = await readPrivateCanonicalPackageWorkQueue({
    scope: { ...scope, ownerUserId: 'different-owner' },
    definition,
  })
  assert.equal(otherTenant, undefined)
  await expectApiError(() => readPrivateCanonicalPackageWorkQueue({
    scope: { ...scope, workspaceId: 'different-workspace' },
    definition,
  }), 'VALIDATION_FAILED')

  const originalEnvelope = await readFile(aggregatePath, 'utf8')
  const invalidChecksumEnvelope = JSON.parse(originalEnvelope) as { checksumSha256: string }
  invalidChecksumEnvelope.checksumSha256 = 'f'.repeat(64)
  await writeFile(aggregatePath, `${JSON.stringify(invalidChecksumEnvelope)}\n`)
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  await expectApiError(() => readPrivateCanonicalPackageWorkQueue({ scope, definition }), 'INTERNAL_ERROR')
  await writeFile(aggregatePath, originalEnvelope)

  const forgedAuthorityEnvelope = JSON.parse(originalEnvelope) as {
    aggregate: CanonicalPrivatePackageWorkQueueAggregate
    checksumSha256: string
  }
  const forgedEntry = requiredEntry(forgedAuthorityEnvelope.aggregate, 'job-scheduled')
  forgedEntry.definition.resourceClassId = 'qa_cpu_standard_v1'
  forgedEntry.definition.definitionHash = hashWithoutKey(
    forgedEntry.definition as unknown as Record<string, unknown>,
    'definitionHash',
  )
  forgedEntry.entryHash = hashWithoutKey(
    forgedEntry as unknown as Record<string, unknown>,
    'entryHash',
  )
  forgedAuthorityEnvelope.aggregate.aggregateHash = hashWithoutKey(
    forgedAuthorityEnvelope.aggregate as unknown as Record<string, unknown>,
    'aggregateHash',
  )
  forgedAuthorityEnvelope.checksumSha256 = sha256AuthorityValue(forgedAuthorityEnvelope.aggregate)
  await writeFile(aggregatePath, `${stableAuthorityStringify(forgedAuthorityEnvelope)}\n`)
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  await expectApiError(() => readPrivateCanonicalPackageWorkQueue({ scope, definition }), 'INTERNAL_ERROR')
  await writeFile(aggregatePath, originalEnvelope)
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  assert.deepEqual(
    (await readPrivateCanonicalPackageWorkQueue({ scope, definition }))?.summary,
    finalAggregate.summary,
  )

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'immutable_snapshot_and_resource_placement_queue_definition',
      'dependency_capability_schedule_and_worker_type_admission',
      'one_cross_process_single_host_active_claim_and_opaque_credential',
      'timing_safe_credential_bound_heartbeat_completion_and_release',
      'read_only_idempotent_terminal_replay',
      'host_restart_completed_job_replay_without_execution',
      'expired_claim_recovery_with_stale_worker_fencing',
      'approved_max_attempt_exhaustion_enforced',
      'completed_entries_terminal_and_events_hash_chained',
      'tenant_scope_checksum_and_immutable_authority_tamper_rejected',
      'distributed_service_identity_cloud_dispatch_and_production_remain_false',
    ],
    summary: finalAggregate.summary,
  }))
} finally {
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  await rm(rootPath, { recursive: true, force: true })
}

function createDefinition(): CanonicalPrivatePackageWorkQueueDefinition {
  const jobs = [
    createJob({
      canonicalOrder: 0,
      jobId: 'job-root',
      dependencyJobIds: [],
      workerType: 'cpu_analysis_worker',
      resourceClassId: 'cpu_analysis_standard_v1',
      privateExecutionReady: true,
      maxAttempts: 2,
      scheduledFor: now(-1_000),
    }),
    createJob({
      canonicalOrder: 1,
      jobId: 'job-dependent',
      dependencyJobIds: ['job-root'],
      workerType: 'gpu_ai_worker',
      resourceClassId: 'gpu_l4_standard_v1',
      privateExecutionReady: true,
      maxAttempts: 3,
      scheduledFor: now(-1_000),
    }),
    createJob({
      canonicalOrder: 2,
      jobId: 'job-provider-gated',
      dependencyJobIds: [],
      workerType: 'render_worker',
      resourceClassId: 'render_cpu_high_memory_v1',
      privateExecutionReady: false,
      providerExecutionMode: 'primary',
      requiredGate: 'provider_execution_remains_disabled',
      maxAttempts: 2,
      scheduledFor: now(-1_000),
    }),
    createJob({
      canonicalOrder: 3,
      jobId: 'job-exhaustion',
      dependencyJobIds: [],
      workerType: 'cpu_analysis_worker',
      resourceClassId: 'cpu_analysis_standard_v1',
      privateExecutionReady: true,
      maxAttempts: 1,
      scheduledFor: now(-1_000),
    }),
    createJob({
      canonicalOrder: 4,
      jobId: 'job-scheduled',
      dependencyJobIds: [],
      workerType: 'cpu_analysis_worker',
      resourceClassId: 'cpu_analysis_standard_v1',
      privateExecutionReady: true,
      maxAttempts: 2,
      scheduledFor: now(3_600_000),
    }),
  ]
  const payload = {
    schemaVersion: CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_DEFINITION_VERSION,
    source: 'canonical_execution_package_and_snapshot_resource_placement' as const,
    identity: {
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
      packageRecordId: scope.packageRecordId,
      approvedPlanSnapshotId: scope.approvedPlanSnapshotId,
      packageHash: sha('package'),
      snapshotHash: sha('snapshot'),
      workGraphHash: sha('work-graph'),
      placementManifestHash: sha('placement-manifest'),
      toolExecutionAuthorityHash: sha('tool-execution-authority'),
      approvedResourcePlacementAuthorityHash: sha('resource-placement-authority'),
    },
    jobs,
    summary: {
      totalJobCount: jobs.length,
      requiredJobCount: jobs.filter((job) => job.required).length,
      cpuAnalysisJobCount: jobs.filter((job) => job.workerType === 'cpu_analysis_worker').length,
      gpuJobCount: jobs.filter((job) => job.workerType === 'gpu_ai_worker').length,
      renderJobCount: jobs.filter((job) => job.workerType === 'render_worker').length,
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

function createJob(input: {
  canonicalOrder: number
  jobId: string
  dependencyJobIds: string[]
  workerType: CanonicalPrivatePackageWorkQueueJobDefinition['workerType']
  resourceClassId: CanonicalPrivatePackageWorkQueueJobDefinition['resourceClassId']
  privateExecutionReady: boolean
  providerExecutionMode?: CanonicalPrivatePackageWorkQueueJobDefinition['providerExecutionMode']
  requiredGate?: string
  maxAttempts: number
  scheduledFor: string
}): CanonicalPrivatePackageWorkQueueJobDefinition {
  const payload = {
    canonicalOrder: input.canonicalOrder,
    jobId: input.jobId,
    approvedWorkItemId: `work-item-${input.jobId}`,
    workItemKey: `work-key-${input.jobId}`,
    required: true,
    dependencyJobIds: input.dependencyJobIds,
    workerType: input.workerType,
    resourceClassId: input.resourceClassId,
    plannedCloudExecutionTarget: input.workerType === 'api_service'
      ? 'cloud_run_service' as const
      : 'cloud_run_job' as const,
    preferredAccelerator: input.workerType === 'gpu_ai_worker'
      ? 'nvidia_l4' as const
      : 'none' as const,
    placementHash: sha(`placement:${input.jobId}`),
    privateExecutionReady: input.privateExecutionReady,
    providerExecutionMode: input.providerExecutionMode ?? 'none',
    ...(input.requiredGate ? { requiredGate: input.requiredGate } : {}),
    maxAttempts: input.maxAttempts,
    attemptTimeoutSeconds: 60,
    scheduledFor: input.scheduledFor,
  }
  return canonicalPrivatePackageWorkQueueJobDefinitionSchema.parse({
    ...payload,
    definitionHash: sha256AuthorityValue(payload),
  })
}

function completedOutcome(
  jobId: string,
  dependencyJobIds: string[],
  artifactId: string,
): CanonicalPrivatePackageWorkQueueCompletedOutcome {
  return {
    jobId,
    approvedWorkItemId: `work-item-${jobId}`,
    workItemKey: `work-key-${jobId}`,
    required: true,
    dependencyJobIds,
    status: 'completed_private_test',
    artifactId,
    contentType: 'application/json',
    sha256: sha(`bytes:${artifactId}`),
    adapterReplayed: false,
    blockedDependencyJobIds: [],
  }
}

function requiredEntry(
  aggregate: CanonicalPrivatePackageWorkQueueAggregate,
  jobId: string,
) {
  const entry = aggregate.entries.find((candidate) => candidate.definition.jobId === jobId)
  assert.ok(entry)
  return entry
}

function assertHashChain(aggregate: CanonicalPrivatePackageWorkQueueAggregate): void {
  aggregate.events.forEach((event, index) => {
    assert.equal(event.sequence, index + 1)
    assert.equal(event.previousEventHash, aggregate.events[index - 1]?.eventHash ?? null)
    const { eventHash, ...payload } = event
    assert.equal(eventHash, sha256AuthorityValue(payload))
  })
  const { aggregateHash, ...payload } = aggregate
  assert.equal(aggregateHash, sha256AuthorityValue(payload))
}

function sha(label: string): string {
  return sha256AuthorityValue({ domain: 'queue-smoke', label })
}

function hashWithoutKey(value: Record<string, unknown>, key: string): string {
  const payload = { ...value }
  delete payload[key]
  return sha256AuthorityValue(payload)
}

async function expectApiError(
  operation: () => Promise<unknown>,
  code: string,
): Promise<void> {
  await assert.rejects(operation, (error: unknown) =>
    error instanceof ApiError && error.code === code)
}
