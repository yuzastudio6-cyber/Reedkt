import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { GCP_PRODUCTION_API_SERVICE } from '../config/gcp-production-config'
import {
  canonicalCloudWorkerDispatchHandoffManifestSchema,
  createCanonicalCloudRuntimeRegionAuthority,
  createCanonicalProvenToolCloudDispatchCatalog,
  type CanonicalCloudWorkerDispatchHandoffManifest,
} from '../edit-architecture/canonical-cloud-worker-dispatch-handoff-authority'
import {
  canonicalPrivatePackageWorkQueueDefinitionSchema,
  type CanonicalPrivatePackageWorkQueueDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import { ApiError } from '../errors/api-error'
import {
  readPrivateCanonicalCloudDispatchOutbox,
  readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction,
} from '../services/private-canonical-cloud-dispatch-outbox-store'
import {
  claimAndEnqueuePrivateCanonicalPackageCloudDispatchAttempt,
} from '../services/private-canonical-package-cloud-dispatch-transaction-store'
import {
  ensurePrivateCanonicalPackageWorkQueue,
  readPrivateCanonicalPackageWorkQueue,
  readPrivateCanonicalPackageWorkQueueForPackageStateTransaction,
} from '../services/private-canonical-package-work-queue-store'
import {
  canonicalPrivatePackageStatePaths,
  type CanonicalPrivatePackageStateLockAuthority,
  type CanonicalPrivatePackageStateFaultStage,
  type CanonicalPrivatePackageStateScope,
} from '../services/private-canonical-package-state-transaction'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import { REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP } from
  '../../src/backend/cloud/reeditpro-gcp-production-resource-map'

const baseTimeMs = Date.parse('2026-07-17T08:00:00.000Z')
const committedAt = new Date(baseTimeMs + 1_000).toISOString()
const roots: string[] = []

try {
  const afterCommit = await proveFaultRecovery('after_write_ahead_commit', 'after-commit')
  const afterQueue = await proveFaultRecovery('after_queue_projection', 'after-queue')
  const realCrashAfterCommit = await proveRealProcessCrashRecovery(
    'crash-after-commit',
    'real-crash-after-commit',
  )
  const realCrashAfterQueue = await proveRealProcessCrashRecovery(
    'crash-after-queue',
    'real-crash-after-queue',
  )
  await proveTamperedTransactionFailsClosed()
  await proveProjectionDriftFailsClosed()
  await proveTransactionOnlyReadsRequireActiveLock()
  const queueRace = await proveGenericQueueCrossProcessClaimRace()
  const race = await proveCrossProcessClaimRace()
  const expiredClaim = await proveExpiredClaimAdvancesAndExhaustionPersists()
  const staleLock = await proveDeadOwnerLockRecovery()
  await proveLockSymlinkRefusal()

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'atomic_write_ahead_record_is_the_queue_claim_and_outbox_commit_point',
      'crash_after_commit_before_projection_recovers_queue_and_outbox_together',
      'crash_after_queue_projection_recovers_missing_outbox_without_another_attempt',
      'real_process_exit_after_commit_recovers_wal_and_dead_owner_lock',
      'real_process_exit_after_queue_projection_recovers_outbox_without_another_attempt',
      'tampered_transaction_record_fails_closed_without_projection_mutation',
      'out_of_band_projection_drift_fails_closed_without_overwrite',
      'transaction_only_projection_reads_require_live_package_lock_capability',
      'separate_node_processes_create_one_generic_queue_claim',
      'separate_node_processes_create_one_claim_one_attempt_and_one_outbox_entry',
      'expired_active_claim_advances_once_and_attempt_exhaustion_persists_without_another_outbox',
      'dead_same_host_lock_owner_is_reclaimed_after_real_child_process_termination',
      'lock_target_symlink_is_refused_without_external_file_mutation',
      'private_queue_outbox_transaction_and_lock_files_use_restrictive_modes',
      'distributed_database_google_cloud_worker_and_production_authority_remain_false',
    ],
    summary: {
      recoveredAfterCommit: afterCommit,
      recoveredAfterQueueProjection: afterQueue,
      realProcessCrashAfterCommit: realCrashAfterCommit,
      realProcessCrashAfterQueueProjection: realCrashAfterQueue,
      genericQueueCrossProcessDispositions: queueRace,
      crossProcessDispositions: race,
      expiredClaimAttemptProgression: expiredClaim,
      deadOwnerLockRecovered: staleLock,
      distributedDatabaseTransactionVerified: false,
      productionAuthority: false,
    },
  }))
} finally {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })))
}

async function proveTransactionOnlyReadsRequireActiveLock(): Promise<void> {
  const fixture = await createFixture('forged-lock-authority')
  const forgedAuthority = Object.freeze({
    scope: Object.freeze({ ...fixture.scope }),
    paths: Object.freeze(canonicalPrivatePackageStatePaths(fixture.scope)),
  }) as CanonicalPrivatePackageStateLockAuthority
  await expectApiError(
    () => readPrivateCanonicalPackageWorkQueueForPackageStateTransaction(
      forgedAuthority,
      fixture.scope,
      fixture.definition,
    ),
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )
  await expectApiError(
    () => readPrivateCanonicalCloudDispatchOutboxForPackageStateTransaction(
      forgedAuthority,
      fixture.scope,
    ),
    'IDEMPOTENCY_ATOMICITY_REQUIRED',
  )
}

async function proveRealProcessCrashRecovery(
  mode: 'crash-after-commit' | 'crash-after-queue',
  suffix: string,
) {
  const fixture = await createFixture(suffix)
  const initialQueueBytes = await readFile(fixture.queuePath, 'utf8')
  const scopePath = join(fixture.rootPath, `${suffix}-scope.json`)
  const definitionPath = join(fixture.rootPath, `${suffix}-definition.json`)
  const manifestPath = join(fixture.rootPath, `${suffix}-manifest.json`)
  await writeFile(scopePath, JSON.stringify(fixture.scope))
  await writeFile(definitionPath, JSON.stringify(fixture.definition))
  await writeFile(manifestPath, JSON.stringify(fixture.manifest))
  const child = spawnChild(mode, [scopePath, definitionPath, manifestPath, committedAt])
  const exit = await waitForExit(child)
  assert.equal(exit.code, 77)
  assert.equal(exit.signal, null)
  assert.equal(await pathExists(fixture.transactionPath), true)
  assert.equal(await pathExists(fixture.lockPath), true)
  assert.equal((await stat(fixture.transactionPath)).mode & 0o777, 0o600)
  assert.equal((await stat(fixture.lockPath)).mode & 0o777, 0o600)
  if (mode === 'crash-after-commit') {
    assert.equal(await readFile(fixture.queuePath, 'utf8'), initialQueueBytes)
  } else {
    assert.notEqual(await readFile(fixture.queuePath, 'utf8'), initialQueueBytes)
  }
  assert.equal(await pathExists(fixture.outboxPath), false)

  const recovered = await claim(fixture)
  assert.equal(recovered.disposition, 'exact_replay')
  assert.equal(recovered.recovery.pendingTransactionRecovered, true)
  assert.equal(recovered.recovery.outboxProjectionReplayed, true)
  assert.equal(
    recovered.recovery.queueProjectionReplayed,
    mode === 'crash-after-commit',
  )
  assert.equal(await pathExists(fixture.transactionPath), false)
  assert.equal(await pathExists(fixture.lockPath), false)
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: fixture.scope,
    definition: fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({ scope: fixture.scope })
  assert.equal(queue?.summary.totalDeliveryAttemptCount, 1)
  assert.equal(outbox?.summary.totalEntryCount, 1)
  return {
    childExitCode: exit.code,
    queueProjectionReplayed: recovered.recovery.queueProjectionReplayed,
    outboxProjectionReplayed: recovered.recovery.outboxProjectionReplayed,
    packageDeliveryAttemptCount: queue?.summary.totalDeliveryAttemptCount,
  }
}

async function proveFaultRecovery(
  stage: CanonicalPrivatePackageStateFaultStage,
  suffix: string,
) {
  const fixture = await createFixture(suffix)
  const initialQueueBytes = await readFile(fixture.queuePath, 'utf8')
  const sentinel = new Error(`simulated-crash-${stage}`)
  await assert.rejects(
    () => claim(fixture, {
      faultInjectionForSmoke: (currentStage) => {
        if (currentStage === stage) throw sentinel
      },
    }),
    (error: unknown) => error === sentinel,
  )
  const transactionBytes = await readFile(fixture.transactionPath, 'utf8')
  assert.equal((await stat(fixture.transactionPath)).mode & 0o777, 0o600)
  assert.equal(transactionBytes.includes('simulated-worker-identity'), false)
  assert.equal(transactionBytes.includes('claimCredential'), false)
  assert.equal(transactionBytes.includes('Bearer '), false)
  assert.equal(transactionBytes.includes('signedUrl'), false)

  if (stage === 'after_write_ahead_commit') {
    assert.equal(await readFile(fixture.queuePath, 'utf8'), initialQueueBytes)
    assert.equal(await pathExists(fixture.outboxPath), false)
  } else {
    assert.notEqual(await readFile(fixture.queuePath, 'utf8'), initialQueueBytes)
    assert.equal(await pathExists(fixture.outboxPath), false)
  }

  const recovered = await claim(fixture)
  assert.equal(recovered.disposition, 'exact_replay')
  assert.equal(recovered.recovery.pendingTransactionRecovered, true)
  assert.equal(recovered.recovery.outboxProjectionReplayed, true)
  assert.equal(
    recovered.recovery.queueProjectionReplayed,
    stage === 'after_write_ahead_commit',
  )
  assert.equal(await pathExists(fixture.transactionPath), false)
  assert.equal((await stat(fixture.queuePath)).mode & 0o777, 0o600)
  assert.equal((await stat(fixture.outboxPath)).mode & 0o777, 0o600)
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: fixture.scope,
    definition: fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({ scope: fixture.scope })
  assert.equal(queue?.summary.totalDeliveryAttemptCount, 1)
  assert.equal(queue?.summary.leasedJobCount, 1)
  assert.equal(outbox?.summary.totalEntryCount, 1)
  assert.equal(
    outbox?.entries[0]?.immutable.queueClaimId,
    queue?.entries[0]?.activeClaim?.claimId,
  )
  return {
    queueProjectionReplayed: recovered.recovery.queueProjectionReplayed,
    outboxProjectionReplayed: recovered.recovery.outboxProjectionReplayed,
    packageDeliveryAttemptCount: queue?.summary.totalDeliveryAttemptCount,
  }
}

async function proveTamperedTransactionFailsClosed(): Promise<void> {
  const fixture = await createFixture('tampered-transaction')
  const initialQueueBytes = await readFile(fixture.queuePath, 'utf8')
  const sentinel = new Error('stop-after-transaction-commit')
  await assert.rejects(
    () => claim(fixture, {
      faultInjectionForSmoke: () => { throw sentinel },
    }),
    (error: unknown) => error === sentinel,
  )
  const untampered = await readFile(fixture.transactionPath, 'utf8')
  const decoded = JSON.parse(untampered) as { authority: { jobId: string } }
  decoded.authority.jobId = 'job_tampered_transaction'
  await writeFile(fixture.transactionPath, JSON.stringify(decoded))
  await expectApiError(() => claim(fixture), 'VALIDATION_FAILED')
  assert.equal(await readFile(fixture.queuePath, 'utf8'), initialQueueBytes)
  assert.equal(await pathExists(fixture.outboxPath), false)
  await writeFile(fixture.transactionPath, untampered)
  assert.equal((await claim(fixture)).disposition, 'exact_replay')
}

async function proveProjectionDriftFailsClosed(): Promise<void> {
  const fixture = await createFixture('projection-drift')
  const initialQueueBytes = await readFile(fixture.queuePath, 'utf8')
  const sentinel = new Error('stop-before-projection')
  await assert.rejects(
    () => claim(fixture, {
      faultInjectionForSmoke: () => { throw sentinel },
    }),
    (error: unknown) => error === sentinel,
  )
  await writeFile(fixture.queuePath, `${initialQueueBytes} `)
  await expectApiError(() => claim(fixture), 'IDEMPOTENCY_CONFLICT')
  assert.equal(await pathExists(fixture.outboxPath), false)
  await writeFile(fixture.queuePath, initialQueueBytes)
  assert.equal((await claim(fixture)).disposition, 'exact_replay')
}

async function proveCrossProcessClaimRace(): Promise<string[]> {
  const fixture = await createFixture('cross-process-race')
  const scopePath = join(fixture.rootPath, 'scope-fixture.json')
  const definitionPath = join(fixture.rootPath, 'definition-fixture.json')
  const manifestPath = join(fixture.rootPath, 'manifest-fixture.json')
  await writeFile(scopePath, JSON.stringify(fixture.scope))
  await writeFile(definitionPath, JSON.stringify(fixture.definition))
  await writeFile(manifestPath, JSON.stringify(fixture.manifest))
  const args = [scopePath, definitionPath, manifestPath, committedAt]
  const results = await Promise.all([
    runChild('claim', args),
    runChild('claim', args),
  ])
  const parsed = results.map((stdout) => JSON.parse(lastNonEmptyLine(stdout)) as {
    disposition: string
    queueClaimId: string
    dispatchIntentId: string
  })
  assert.deepEqual(
    parsed.map((result) => result.disposition).sort(),
    ['created', 'exact_replay'],
  )
  assert.equal(new Set(parsed.map((result) => result.queueClaimId)).size, 1)
  assert.equal(new Set(parsed.map((result) => result.dispatchIntentId)).size, 1)
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: fixture.scope,
    definition: fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({ scope: fixture.scope })
  assert.equal(queue?.summary.totalDeliveryAttemptCount, 1)
  assert.equal(queue?.events.filter((event) => event.eventType === 'job_claimed').length, 1)
  assert.equal(outbox?.summary.totalEntryCount, 1)
  assert.equal(outbox?.events.filter((event) => event.eventType === 'outbox_entry_created').length, 1)
  return parsed.map((result) => result.disposition).sort()
}

async function proveGenericQueueCrossProcessClaimRace(): Promise<string[]> {
  const fixture = await createFixture('generic-queue-cross-process-race')
  const scopePath = join(fixture.rootPath, 'queue-scope-fixture.json')
  const definitionPath = join(fixture.rootPath, 'queue-definition-fixture.json')
  const manifestPath = join(fixture.rootPath, 'queue-unused-manifest-fixture.json')
  await writeFile(scopePath, JSON.stringify(fixture.scope))
  await writeFile(definitionPath, JSON.stringify(fixture.definition))
  await writeFile(manifestPath, JSON.stringify(fixture.manifest))
  const args = [scopePath, definitionPath, manifestPath, committedAt]
  const results = await Promise.all([
    runChild('queue-claim', args),
    runChild('queue-claim', args),
  ])
  const parsed = results.map((stdout) => JSON.parse(lastNonEmptyLine(stdout)) as {
    disposition: string
    queueClaimId?: string
  })
  assert.deepEqual(
    parsed.map((result) => result.disposition).sort(),
    ['already_leased', 'claimed'],
  )
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: fixture.scope,
    definition: fixture.definition,
  })
  assert.equal(queue?.summary.totalDeliveryAttemptCount, 1)
  assert.equal(queue?.events.filter((event) => event.eventType === 'job_claimed').length, 1)
  return parsed.map((result) => result.disposition).sort()
}

async function proveExpiredClaimAdvancesAndExhaustionPersists() {
  const fixture = await createFixture('expired-claim-progression')
  const first = await claim(fixture)
  assert.equal(first.disposition, 'created')
  if (!('outboxEntry' in first)) throw new Error('First dispatch attempt was not created.')
  assert.equal(first.queueEntry.activeClaim.deliveryAttempt, 1)

  const secondAttemptAt = new Date(Date.parse(committedAt) + 121_000).toISOString()
  const second = await claim(fixture, { now: secondAttemptAt })
  assert.equal(second.disposition, 'created')
  if (!('outboxEntry' in second)) throw new Error('Second dispatch attempt was not created.')
  assert.equal(second.queueEntry.activeClaim.deliveryAttempt, 2)
  assert.notEqual(second.queueEntry.activeClaim.claimId, first.queueEntry.activeClaim.claimId)

  const exhaustedAt = new Date(Date.parse(secondAttemptAt) + 121_000).toISOString()
  const exhausted = await claim(fixture, { now: exhaustedAt })
  assert.equal(exhausted.disposition, 'attempts_exhausted')
  assert.equal(exhausted.queueEntry.state, 'queued')
  assert.equal(exhausted.queueEntry.activeClaim, undefined)

  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: fixture.scope,
    definition: fixture.definition,
  })
  const outbox = await readPrivateCanonicalCloudDispatchOutbox({ scope: fixture.scope })
  assert.equal(queue?.entries[0]?.state, 'queued')
  assert.equal(queue?.entries[0]?.activeClaim, undefined)
  assert.equal(queue?.summary.totalDeliveryAttemptCount, 2)
  assert.equal(queue?.summary.expiredClaimRecoveryCount, 2)
  assert.equal(outbox?.summary.totalEntryCount, 2)
  return {
    deliveryAttemptCount: queue?.summary.totalDeliveryAttemptCount,
    expiredClaimRecoveryCount: queue?.summary.expiredClaimRecoveryCount,
    outboxEntryCount: outbox?.summary.totalEntryCount,
    finalDisposition: exhausted.disposition,
  }
}

async function proveDeadOwnerLockRecovery(): Promise<boolean> {
  const fixture = await createFixture('dead-lock-owner')
  const scopePath = join(fixture.rootPath, 'dead-owner-scope.json')
  await writeFile(scopePath, JSON.stringify(fixture.scope))
  const child = spawnChild('hold-lock', [scopePath])
  await waitForStdout(child, 'LOCK_ACQUIRED')
  assert.equal((await stat(fixture.lockPath)).mode & 0o777, 0o600)
  assert.equal(child.kill('SIGKILL'), true)
  await waitForExit(child)
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: fixture.scope,
    definition: fixture.definition,
  })
  assert.ok(queue)
  assert.equal(await pathExists(fixture.lockPath), false)
  return true
}

async function proveLockSymlinkRefusal(): Promise<void> {
  const fixture = await createFixture('lock-symlink')
  const outsidePath = join(tmpdir(), `reeditpro-lock-symlink-outside-${process.pid}.txt`)
  await writeFile(outsidePath, 'outside-sentinel')
  try {
    await mkdir(dirname(fixture.lockPath), { recursive: true })
    await symlink(outsidePath, fixture.lockPath)
    await expectApiError(
      () => readPrivateCanonicalPackageWorkQueue({
        scope: fixture.scope,
        definition: fixture.definition,
      }),
      'VALIDATION_FAILED',
    )
    assert.equal(await readFile(outsidePath, 'utf8'), 'outside-sentinel')
  } finally {
    await rm(outsidePath, { force: true })
  }
}

interface Fixture {
  rootPath: string
  definition: CanonicalPrivatePackageWorkQueueDefinition
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  scope: CanonicalPrivatePackageStateScope
  queuePath: string
  outboxPath: string
  transactionPath: string
  lockPath: string
}

async function createFixture(suffix: string): Promise<Fixture> {
  const rootPath = await mkdtemp(join(tmpdir(), `reeditpro-package-state-${suffix}-`))
  roots.push(rootPath)
  const definition = createQueueDefinition(suffix)
  const manifest = createManifest(definition)
  const scope: CanonicalPrivatePackageStateScope = {
    localStorageRoot: rootPath,
    ownerUserId: `owner-${suffix}`,
    workspaceId: definition.identity.workspaceId,
    projectId: definition.identity.projectId,
    editSessionId: definition.identity.editSessionId,
    packageRecordId: definition.identity.packageRecordId,
    approvedPlanSnapshotId: definition.identity.approvedPlanSnapshotId,
  }
  await ensurePrivateCanonicalPackageWorkQueue({
    scope,
    definition,
    now: new Date(baseTimeMs).toISOString(),
  })
  const paths = canonicalPrivatePackageStatePaths(scope)
  return {
    rootPath,
    definition,
    manifest,
    scope,
    queuePath: join(rootPath, paths.queueRelativePath),
    outboxPath: join(rootPath, paths.outboxRelativePath),
    transactionPath: join(rootPath, paths.transactionRelativePath),
    lockPath: join(rootPath, paths.lockRelativePath),
  }
}

function claim(
  fixture: Fixture,
  options: {
    faultInjectionForSmoke?: (stage: CanonicalPrivatePackageStateFaultStage) => void
    now?: string
  } = {},
) {
  return claimAndEnqueuePrivateCanonicalPackageCloudDispatchAttempt({
    scope: fixture.scope,
    definition: fixture.definition,
    manifest: fixture.manifest,
    jobId: fixture.definition.jobs[0]!.jobId,
    workerIdentity: 'simulated-worker-identity',
    now: options.now ?? committedAt,
    leaseDurationMs: 120_000,
    faultInjectionForSmoke: options.faultInjectionForSmoke,
  })
}

function createQueueDefinition(suffix: string): CanonicalPrivatePackageWorkQueueDefinition {
  const target = createCanonicalProvenToolCloudDispatchCatalog().tools.find((tool) =>
    tool.canonicalToolId === 'ffprobe')
  assert.ok(target)
  const jobPayload = {
    canonicalOrder: 0,
    jobId: `job-${suffix}`,
    approvedWorkItemId: `work-${suffix}`,
    workItemKey: `work-key-${suffix}`,
    required: true,
    dependencyJobIds: [],
    workerType: 'cpu_analysis_worker' as const,
    resourceClassId: 'cpu_analysis_standard_v1' as const,
    plannedCloudExecutionTarget: 'cloud_run_job' as const,
    preferredAccelerator: 'none' as const,
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
      workspaceId: `workspace-${suffix}`,
      projectId: `project-${suffix}`,
      editSessionId: `session-${suffix}`,
      packageRecordId: `package-${suffix}`,
      approvedPlanSnapshotId: `snapshot-${suffix}`,
      packageHash: sha256AuthorityValue({ suffix, kind: 'package' }),
      snapshotHash: sha256AuthorityValue({ suffix, kind: 'snapshot' }),
      workGraphHash: sha256AuthorityValue({ suffix, kind: 'work-graph' }),
      placementManifestHash: sha256AuthorityValue({ suffix, kind: 'placement' }),
      toolExecutionAuthorityHash: sha256AuthorityValue({ suffix, kind: 'tool-authority' }),
      approvedResourcePlacementAuthorityHash:
        sha256AuthorityValue({ suffix, kind: 'resource-authority' }),
    },
    jobs: [job],
    summary: {
      totalJobCount: 1,
      requiredJobCount: 1,
      cpuAnalysisJobCount: 1,
      gpuJobCount: 0,
      renderJobCount: 0,
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
): CanonicalCloudWorkerDispatchHandoffManifest {
  const catalog = createCanonicalProvenToolCloudDispatchCatalog()
  const tool = catalog.tools.find((candidate) => candidate.canonicalToolId === 'ffprobe')
  assert.ok(tool)
  const regionAuthority = createCanonicalCloudRuntimeRegionAuthority({
    queueDefinition: definition,
    runtimeRegion: 'us-east1',
    sourceObjectRegions: ['us-east1'],
    allRequiredObjectsRegionBound: true,
    liveProjectRegionPersistenceVerified: false,
    liveGcsObjectResidencyVerified: false,
  })
  const queueJob = definition.jobs[0]!
  const queueResourceName = 'projects/reeditpro/locations/us-east1/queues/' +
    REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.cloudTasksQueuesByRegion['us-east1'].workerDispatch
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
      cpuAnalysisJobCount: 1,
      gpuJobCount: 0,
      renderJobCount: 0,
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

function spawnChild(
  mode: 'claim' | 'queue-claim' | 'hold-lock' | 'crash-after-commit' | 'crash-after-queue',
  args: string[],
): ChildProcess {
  return spawn(
    process.execPath,
    [
      '--import=tsx',
      join(process.cwd(), 'server/smoke/helpers/canonical-package-state-transaction-child.ts'),
      mode,
      ...args,
    ],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] },
  )
}

async function runChild(mode: 'claim' | 'queue-claim', args: string[]): Promise<string> {
  const child = spawnChild(mode, args)
  let stdout = ''
  let stderr = ''
  child.stdout?.on('data', (chunk) => { stdout += String(chunk) })
  child.stderr?.on('data', (chunk) => { stderr += String(chunk) })
  const exit = await waitForExit(child)
  if (exit.code !== 0) throw new Error(`Package-state child failed: ${stderr}`)
  return stdout
}

async function waitForStdout(child: ChildProcess, expected: string): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    let output = ''
    const timeout = setTimeout(() => rejectPromise(new Error('Timed out waiting for child lock.')), 10_000)
    child.stdout?.on('data', (chunk) => {
      output += String(chunk)
      if (output.includes(expected)) {
        clearTimeout(timeout)
        resolvePromise()
      }
    })
    child.once('error', (error) => {
      clearTimeout(timeout)
      rejectPromise(error)
    })
    child.once('exit', (code) => {
      if (!output.includes(expected)) {
        clearTimeout(timeout)
        rejectPromise(new Error(`Lock child exited early with code ${code}.`))
      }
    })
  })
}

function waitForExit(child: ChildProcess): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolvePromise, rejectPromise) => {
    child.once('error', rejectPromise)
    child.once('exit', (code, signal) => resolvePromise({ code, signal }))
  })
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

function lastNonEmptyLine(value: string): string {
  const lines = value.trim().split(/\r?\n/u).filter(Boolean)
  const line = lines.at(-1)
  if (!line) throw new Error('Package-state child returned no output.')
  return line
}

async function expectApiError(
  operation: () => Promise<unknown>,
  expectedCode: ApiError['code'],
): Promise<void> {
  await assert.rejects(operation, (error: unknown) =>
    error instanceof ApiError && error.code === expectedCode)
}
