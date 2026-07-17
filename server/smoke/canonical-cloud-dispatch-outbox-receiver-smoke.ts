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
  claimPrivateCanonicalPackageWorkQueueJob,
  ensurePrivateCanonicalPackageWorkQueue,
  readPrivateCanonicalPackageWorkQueue,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from '../services/private-canonical-package-work-queue-store'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import type { ServiceContext } from '../types'
import {
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
  const claim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: queueScope,
    definition: queueDefinition,
    jobId: 'job_cloud_dispatch_cpu',
    workerIdentity: 'regional-cloud-dispatch-controller',
    workerType: 'cpu_analysis_worker',
    now: new Date(baseTimeMs).toISOString(),
    leaseDurationMs: 120_000,
  })
  assert.equal(claim.disposition, 'claimed')
  if (claim.disposition !== 'claimed') throw new Error('Cloud dispatch queue claim was not acquired.')
  const queueBefore = await readPrivateCanonicalPackageWorkQueue({
    scope: queueScope,
    definition: queueDefinition,
  })
  assert.ok(queueBefore)

  let service = createService(context)
  const enqueued = await service.enqueueApprovedAttempt({
    jobId: 'job_cloud_dispatch_cpu',
    packageDeliveryAttempt: 1,
  })
  assert.equal(enqueued.disposition, 'created')
  assert.equal(enqueued.outboxEntry.state, 'pending_controller_delivery')
  assert.equal(enqueued.outboxEntry.immutable.queueClaimId, claim.entry.activeClaim.claimId)
  assert.equal(enqueued.outboxEntry.immutable.packageDeliveryAttempt, 1)
  assert.equal(enqueued.attemptPlan.cloudRunJob?.taskMaxRetries, 0)
  assert.equal(enqueued.boundaries.networkCallPerformed, false)

  const outboxPath = join(rootPath, canonicalCloudDispatchOutboxAggregateRelativePath(scope))
  assert.equal((await stat(outboxPath)).mode & 0o777, 0o600)
  const enqueuedBytes = await readFile(outboxPath, 'utf8')
  assert.equal(enqueuedBytes.includes(claim.claimCredential), false)
  assert.equal(enqueuedBytes.includes('Bearer '), false)
  assert.equal(enqueuedBytes.includes('/Users/'), false)
  assert.equal(enqueuedBytes.includes('signedUrl'), false)

  clearPrivateCanonicalCloudDispatchOutboxProcessStateForSmoke()
  service = createService(context)
  const replayedEnqueue = await service.enqueueApprovedAttempt({
    jobId: 'job_cloud_dispatch_cpu',
    packageDeliveryAttempt: 1,
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

  const queueAfter = await readPrivateCanonicalPackageWorkQueue({
    scope: queueScope,
    definition: queueDefinition,
  })
  assert.equal(queueAfter?.aggregateHash, queueBefore.aggregateHash)
  assert.equal(queueAfter?.summary.totalDeliveryAttemptCount, 1)

  const terminalBytes = await readFile(outboxPath, 'utf8')
  assert.equal(terminalBytes.includes(claim.claimCredential), false)
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

  assert.throws(() => createService(createContext('production')), (error: unknown) =>
    error instanceof ApiError && error.code === 'TOOL_NOT_READY')

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'one_active_package_queue_attempt_creates_one_durable_outbox_entry',
      'restart_and_concurrent_task_redelivery_replay_without_another_attempt',
      'controller_requires_exact_issuer_principal_audience_expiry_task_and_outbox_binding',
      'worker_requires_exact_controller_receipt_workload_identity_and_attempt_binding',
      'controller_and_worker_accept_only_process_branded_cryptographically_verified_identity',
      'forged_principal_audience_task_worker_and_persistence_bytes_fail_closed',
      'outbox_persists_no_raw_bearer_claim_credential_media_prompt_path_or_signed_url',
      'receiver_does_not_mutate_package_queue_or_start_cloud_job_tool_media_or_network_work',
      'distributed_transaction_live_google_oidc_iam_cloud_and_production_remain_false',
    ],
    summary: {
      outboxEntryCount: evidence.totalEntryCount,
      packageDeliveryAttemptCount: queueAfter?.summary.totalDeliveryAttemptCount,
      controllerReceiptReplayCount: 1,
      workerReceiptReplayCount: 1,
      cloudRunHiddenRetryCount: 0,
    },
  }))
} finally {
  await rm(rootPath, { recursive: true, force: true })
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

function createContext(mode: 'test' | 'production'): ServiceContext {
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
      LOCAL_STORAGE_ROOT: rootPath,
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
    exp: Math.floor((baseTimeMs + 120_000) / 1_000),
  }), 'utf8').toString('base64url')
  const signingInput = `${header}.${payload}`
  const signature = sign(
    'RSA-SHA256',
    Buffer.from(signingInput, 'ascii'),
    privateKey,
  ).toString('base64url')
  return `${signingInput}.${signature}`
}

function createQueueDefinition(): CanonicalPrivatePackageWorkQueueDefinition {
  const target = createCanonicalProvenToolCloudDispatchCatalog().tools.find((tool) =>
    tool.canonicalToolId === 'ffprobe')
  assert.ok(target)
  const jobPayload = {
    canonicalOrder: 0,
    jobId: 'job_cloud_dispatch_cpu',
    approvedWorkItemId: 'work_cloud_dispatch_cpu',
    workItemKey: 'cloud-dispatch-cpu',
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

async function expectApiError(
  operation: () => Promise<unknown>,
  expectedCode: ApiError['code'],
): Promise<void> {
  await assert.rejects(operation, (error: unknown) =>
    error instanceof ApiError && error.code === expectedCode)
}
