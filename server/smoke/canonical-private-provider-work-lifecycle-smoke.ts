import assert from 'node:assert/strict'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import {
  CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
  CANONICAL_LYRIA_MODEL_ID,
  CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID,
  assertCanonicalProviderWorkAuthorization,
  createCanonicalProviderWorkAuthorization,
} from '../edit-architecture/canonical-provider-work-authority'
import {
  CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_DEFINITION_VERSION,
  canonicalPrivatePackageWorkQueueDefinitionSchema,
  canonicalPrivatePackageWorkQueueJobDefinitionSchema,
  type CanonicalPrivatePackageWorkQueueDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import { ApiError } from '../errors/api-error'
import {
  executePrivateInjectedProviderWorkLifecycle,
  reconcilePrivateInjectedProviderUnknownLifecycle,
  type ExecutePrivateInjectedProviderWorkLifecycleInput,
} from '../services/canonical-private-provider-work-lifecycle-service'
import {
  beginPrivateCanonicalPackageWorkQueueProviderAttempt,
  claimPrivateCanonicalPackageWorkQueueJob,
  claimPrivateCanonicalProviderPackageWorkQueueJob,
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke,
  ensurePrivateCanonicalPackageWorkQueue,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from '../services/private-canonical-package-work-queue-store'
import {
  consumePrivateCanonicalProviderDispatchGrant,
  issuePrivateCanonicalProviderDispatchGrant,
} from '../services/private-canonical-provider-dispatch-store'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const BASE_TIME_MS = Date.parse('2026-07-20T12:00:00.000Z')
const at = (offsetMs: number) => new Date(BASE_TIME_MS + offsetMs).toISOString()
const INJECTED_DISPATCH_SECRET =
  'private-injected-provider-dispatch-secret-for-smoke-only-20260720'
const roots: string[] = []

try {
  const success = await fixture('success')
  await ensurePrivateCanonicalPackageWorkQueue({
    scope: success.scope,
    definition: success.queueDefinition,
    now: at(0),
  })
  const genericClaim = await claimPrivateCanonicalPackageWorkQueueJob({
    scope: success.scope,
    definition: success.queueDefinition,
    jobId: success.jobId,
    workerIdentity: 'generic-tool-worker',
    workerType: 'cpu_analysis_worker',
    now: at(1_000),
    leaseDurationMs: 60_000,
  })
  assert.equal(genericClaim.disposition, 'capability_blocked')

  const successResult = await executePrivateInjectedProviderWorkLifecycle({
    ...success.lifecycle,
    outcome: {
      state: 'succeeded',
      bytes: wavFixture(17),
      wallTimeMicroseconds: 900_000,
      rawInfrastructureUsageEvidenceDigest: digest('success-infrastructure'),
    },
  })
  assert.equal(successResult.disposition, 'executed')
  assert.equal(successResult.authorization.operationId,
    CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID)
  assert.equal(successResult.authorization.providerRouteId,
    CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID)
  assert.equal(successResult.authorization.providerModelId, CANONICAL_LYRIA_MODEL_ID)
  assert.equal(successResult.authorization.boundaries.providerCallAuthorized, false)
  assert.equal(successResult.grant.providerCallAuthorized, false)
  assert.equal(successResult.grant.secretLocator.payloadReadCount, 0)
  assert.equal(successResult.dispatchEntry.attempt.consumptionCount, 1)
  assert.equal(successResult.dispatchEntry.attempt.providerRequestStarted, false)
  assert.equal(successResult.terminal.state, 'succeeded')
  assert.equal(successResult.terminal.providerRequestCount, 0)
  assert.ok(successResult.privateOutput)
  assert.equal(successResult.privateOutput?.mimeType, 'audio/wav')
  assert.equal(successResult.privateOutput?.createOnly, true)
  assert.equal(successResult.costEvidence.provider.actualInternalCostMicros, 0)
  assert.equal(successResult.costEvidence.infrastructure.actualInternalCostMicros, 1_000)
  assert.equal(successResult.costEvidence.reconciliation.totalInternalProductionCostMicros, 1_000)
  assertCommercialBoundary(successResult.costEvidence)
  assert.equal(successResult.queueAggregate.entries[0]?.state, 'completed')
  assert.equal(successResult.queueAggregate.entries[0]?.providerExecutionAttempt?.state,
    'terminal_known')
  assertZeroExternalEffects(successResult.evidence)

  const successReplay = await executePrivateInjectedProviderWorkLifecycle({
    ...success.lifecycle,
    outcome: {
      state: 'succeeded',
      bytes: wavFixture(17),
      wallTimeMicroseconds: 900_000,
      rawInfrastructureUsageEvidenceDigest: digest('success-infrastructure'),
    },
  })
  assert.equal(successReplay.disposition, 'completed_replay')
  assert.equal(successReplay.terminal.terminalHash, successResult.terminal.terminalHash)
  assert.equal(successReplay.costEvidence.evidenceHash,
    successResult.costEvidence.evidenceHash)
  await expectApiError(() => consumePrivateCanonicalProviderDispatchGrant({
    scope: success.scope,
    grantId: successResult.grant.grantId,
    dispatchCredential: 'tampered-dispatch-credential',
    credentialSecret: INJECTED_DISPATCH_SECRET,
    workerIdentity: success.lifecycle.workerIdentity,
    providerRequestStarted: false,
    now: at(6_000),
  }), 'WORKER_LEASE_EXPIRED')

  const tamperedAuthorization = structuredClone(successResult.authorization) as
    unknown as Record<string, unknown>
  tamperedAuthorization.providerModelId = 'unapproved-provider-model'
  assert.throws(() => assertCanonicalProviderWorkAuthorization({
    value: tamperedAuthorization,
    queueDefinition: success.queueDefinition,
    now: at(2_000),
  }))
  const wrongRoutePackage = structuredClone(success.executionPackage)
  wrongRoutePackage.approvedWorkItems[0]!.approvedProviderRoute = 'unapproved-route'
  assert.throws(() => authorizationFor(success, wrongRoutePackage))
  const duplicateOutputPackage = structuredClone(success.executionPackage)
  duplicateOutputPackage.approvedWorkItems[0]!.expectedOutputs.push({
    ...duplicateOutputPackage.approvedWorkItems[0]!.expectedOutputs[0]!,
    outputKey: 'second-output-is-not-authorized',
  })
  assert.throws(() => authorizationFor(success, duplicateOutputPackage))
  assert.throws(() => createCanonicalProviderWorkAuthorization({
    ...authorizationInput(success, success.executionPackage),
    expiresAt: '2026-07-26T12:00:00.000Z',
  }))

  const failed = await fixture('failed')
  const failedResult = await executePrivateInjectedProviderWorkLifecycle({
    ...failed.lifecycle,
    outcome: {
      state: 'failed',
      sanitizedFailureCode: 'provider_safe_failure',
      simulatedProviderRequestCount: 1,
      providerResponseUsageDigest: digest('failed-provider-usage'),
      wallTimeMicroseconds: 500_000,
      rawInfrastructureUsageEvidenceDigest: digest('failed-infrastructure'),
    },
  })
  assert.equal(failedResult.terminal.state, 'failed')
  assert.equal(failedResult.privateOutput, null)
  assert.equal(failedResult.costEvidence.provider.actualInternalCostMicros, 80_000)
  assert.equal(failedResult.costEvidence.infrastructure.actualInternalCostMicros, 1_000)
  assert.equal(failedResult.costEvidence.reconciliation.totalInternalProductionCostMicros,
    81_000)
  assert.equal(failedResult.queueAggregate.entries[0]?.lastRelease?.reason,
    'approved_attempt_failure')
  assert.equal(failedResult.queueAggregate.entries[0]?.providerExecutionAttempt?.state,
    'terminal_known')
  assertCommercialBoundary(failedResult.costEvidence)
  assertZeroExternalEffects(failedResult.evidence)

  const unknownFailure = await fixture('unknown-failure')
  const unknownFailureResult = await executePrivateInjectedProviderWorkLifecycle({
    ...unknownFailure.lifecycle,
    outcome: {
      state: 'unknown_reconciliation_required',
      simulatedProviderRequestCount: 1,
      providerResponseUsageDigest: null,
      wallTimeMicroseconds: 400_000,
      rawInfrastructureUsageEvidenceDigest: digest('unknown-failure-infrastructure'),
    },
  })
  assert.equal(unknownFailureResult.terminal.state,
    'unknown_reconciliation_required')
  assert.equal(unknownFailureResult.costEvidence.provider.actualInternalCostMicros, null)
  assert.equal(unknownFailureResult.costEvidence.reconciliation.state,
    'reconciliation_required')
  assert.equal(unknownFailureResult.queueAggregate.entries[0]?.lastRelease?.reason,
    'provider_unknown_outcome')
  assert.equal(unknownFailureResult.queueAggregate.entries[0]?.providerExecutionAttempt?.state,
    'terminal_unknown')
  const blockedUnknownClaim = await claimPrivateCanonicalProviderPackageWorkQueueJob({
    scope: unknownFailure.scope,
    definition: unknownFailure.queueDefinition,
    jobId: unknownFailure.jobId,
    workerIdentity: 'provider-worker-after-unknown',
    workerType: 'cpu_analysis_worker',
    providerAuthorization: unknownFailureResult.authorization,
    now: at(7_000),
    leaseDurationMs: 60_000,
  })
  assert.equal(blockedUnknownClaim.disposition, 'user_review_required')
  const reconciledFailure = await reconcilePrivateInjectedProviderUnknownLifecycle({
    scope: unknownFailure.scope,
    queueDefinition: unknownFailure.queueDefinition,
    authorization: unknownFailureResult.authorization,
    grantId: unknownFailureResult.grant.grantId,
    resolution: 'failed',
    providerResponseUsageDigest: digest('unknown-failure-reconciled-usage'),
    wallTimeMicroseconds: 700_000,
    rawInfrastructureUsageEvidenceDigest: digest('unknown-failure-reconciled-infra'),
    completedAt: at(10_000),
  })
  assert.equal(reconciledFailure.terminal.state, 'unknown_reconciled_failed')
  assert.equal(reconciledFailure.costEvidence.priorUnknownCostEvidenceHash,
    unknownFailureResult.costEvidence.evidenceHash)
  assert.equal(reconciledFailure.costEvidence.reconciliation.totalInternalProductionCostMicros,
    81_000)
  assert.equal(reconciledFailure.queueAggregate.entries[0]?.lastRelease?.reason,
    'provider_unknown_reconciled_failed')
  assert.equal(reconciledFailure.queueAggregate.entries[0]?.providerExecutionAttempt?.state,
    'unknown_reconciled_failed')
  assertZeroExternalEffects(reconciledFailure.evidence)
  const reconciledFailureReplay = await reconcilePrivateInjectedProviderUnknownLifecycle({
    scope: unknownFailure.scope,
    queueDefinition: unknownFailure.queueDefinition,
    authorization: unknownFailureResult.authorization,
    grantId: unknownFailureResult.grant.grantId,
    resolution: 'failed',
    providerResponseUsageDigest: digest('unknown-failure-reconciled-usage'),
    wallTimeMicroseconds: 700_000,
    rawInfrastructureUsageEvidenceDigest: digest('unknown-failure-reconciled-infra'),
    completedAt: at(10_000),
  })
  assert.equal(reconciledFailureReplay.terminal.terminalHash,
    reconciledFailure.terminal.terminalHash)
  const exhaustedClaim = await claimPrivateCanonicalProviderPackageWorkQueueJob({
    scope: unknownFailure.scope,
    definition: unknownFailure.queueDefinition,
    jobId: unknownFailure.jobId,
    workerIdentity: 'provider-worker-after-reconciled-failure',
    workerType: 'cpu_analysis_worker',
    providerAuthorization: unknownFailureResult.authorization,
    now: at(11_000),
    leaseDurationMs: 60_000,
  })
  assert.equal(exhaustedClaim.disposition, 'attempts_exhausted')

  const expiredStartedAttempt = await fixture('expired-started-attempt')
  await ensurePrivateCanonicalPackageWorkQueue({
    scope: expiredStartedAttempt.scope,
    definition: expiredStartedAttempt.queueDefinition,
    now: at(0),
  })
  const expiredAuthorization = authorizationFor(
    expiredStartedAttempt,
    expiredStartedAttempt.executionPackage,
  )
  const shortClaim = await claimPrivateCanonicalProviderPackageWorkQueueJob({
    scope: expiredStartedAttempt.scope,
    definition: expiredStartedAttempt.queueDefinition,
    jobId: expiredStartedAttempt.jobId,
    workerIdentity: expiredStartedAttempt.lifecycle.workerIdentity,
    workerType: 'cpu_analysis_worker',
    providerAuthorization: expiredAuthorization,
    now: at(1_000),
    leaseDurationMs: 5_000,
  })
  assert.equal(shortClaim.disposition, 'claimed')
  if (shortClaim.disposition !== 'claimed') throw new Error('Expected provider claim.')
  const issuedBeforeLeaseLoss = await issuePrivateCanonicalProviderDispatchGrant({
    scope: expiredStartedAttempt.scope,
    authorization: expiredAuthorization,
    claim: shortClaim.entry.activeClaim,
    credentialSecret: INJECTED_DISPATCH_SECRET,
    now: at(2_000),
  })
  const consumedBeforeLeaseLoss = await consumePrivateCanonicalProviderDispatchGrant({
    scope: expiredStartedAttempt.scope,
    grantId: issuedBeforeLeaseLoss.grant.grantId,
    dispatchCredential: issuedBeforeLeaseLoss.dispatchCredential,
    credentialSecret: INJECTED_DISPATCH_SECRET,
    workerIdentity: expiredStartedAttempt.lifecycle.workerIdentity,
    providerRequestStarted: false,
    now: at(3_000),
  })
  await beginPrivateCanonicalPackageWorkQueueProviderAttempt({
    scope: expiredStartedAttempt.scope,
    definition: expiredStartedAttempt.queueDefinition,
    jobId: expiredStartedAttempt.jobId,
    claimId: shortClaim.entry.activeClaim.claimId,
    claimCredential: shortClaim.claimCredential,
    providerAuthorization: expiredAuthorization,
    providerDispatchGrantId: issuedBeforeLeaseLoss.grant.grantId,
    providerDispatchGrantHash: issuedBeforeLeaseLoss.grant.immutableGrantHash,
    dispatchAttemptId: consumedBeforeLeaseLoss.entry.attempt.dispatchAttemptId,
    dispatchAttemptHash: consumedBeforeLeaseLoss.entry.attempt.attemptHash,
    now: at(3_000),
  })
  await expectApiError(() => claimPrivateCanonicalProviderPackageWorkQueueJob({
    scope: expiredStartedAttempt.scope,
    definition: expiredStartedAttempt.queueDefinition,
    jobId: expiredStartedAttempt.jobId,
    workerIdentity: 'provider-worker-after-expired-started-attempt',
    workerType: 'cpu_analysis_worker',
    providerAuthorization: expiredAuthorization,
    now: at(7_000),
    leaseDurationMs: 5_000,
  }), 'IDEMPOTENCY_ATOMICITY_REQUIRED')

  const unknownSuccess = await fixture('unknown-success')
  const unknownSuccessResult = await executePrivateInjectedProviderWorkLifecycle({
    ...unknownSuccess.lifecycle,
    outcome: {
      state: 'unknown_reconciliation_required',
      simulatedProviderRequestCount: 1,
      providerResponseUsageDigest: null,
      wallTimeMicroseconds: 400_000,
      rawInfrastructureUsageEvidenceDigest: digest('unknown-success-infrastructure'),
    },
  })
  const reconciledSuccess = await reconcilePrivateInjectedProviderUnknownLifecycle({
    scope: unknownSuccess.scope,
    queueDefinition: unknownSuccess.queueDefinition,
    authorization: unknownSuccessResult.authorization,
    grantId: unknownSuccessResult.grant.grantId,
    resolution: 'succeeded',
    bytes: wavFixture(29),
    providerResponseUsageDigest: digest('unknown-success-reconciled-usage'),
    wallTimeMicroseconds: 800_000,
    rawInfrastructureUsageEvidenceDigest: digest('unknown-success-reconciled-infra'),
    completedAt: at(10_000),
  })
  assert.equal(reconciledSuccess.terminal.state, 'unknown_reconciled_succeeded')
  assert.ok(reconciledSuccess.privateOutput)
  assert.equal(reconciledSuccess.queueAggregate.entries[0]?.state, 'completed')
  assert.equal(reconciledSuccess.queueAggregate.entries[0]?.providerExecutionAttempt?.state,
    'unknown_reconciled_succeeded')
  assert.equal(reconciledSuccess.queueAggregate.entries[0]?.completion
    ?.providerUnknownReconciliation?.resolution, 'succeeded')
  assertZeroExternalEffects(reconciledSuccess.evidence)

  for (const item of [
    success,
    failed,
    unknownFailure,
    unknownSuccess,
    expiredStartedAttempt,
  ]) {
    const persisted = await allPersistedBytes(item.scope.localStorageRoot)
    assert.equal(persisted.includes(INJECTED_DISPATCH_SECRET), false)
    assert.equal(persisted.includes('AIza'), false)
    assert.equal(persisted.includes('sk-'), false)
  }

  console.log(JSON.stringify({
    ok: true,
    verdict: 'CANONICAL_PROVIDER_WORK_LIFECYCLE_PRIVATE_INJECTED_PROOF_ACCEPTED_TRANSPORT_BLOCKED',
    operationId: CANONICAL_LYRIA_GENERATE_MUSIC_OPERATION_ID,
    providerBoundaryProfileId: CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID,
    providerModelId: CANONICAL_LYRIA_MODEL_ID,
    checks: [
      'approved_snapshot_package_reservation_and_exact_provider_job_authority',
      'generic_tool_queue_claim_remains_provider_blocked',
      'canonical_queue_claim_lease_and_consumed_attempt_fence',
      'one_use_sibling_provider_dispatch_with_timing_safe_credential_rejection',
      'private_create_only_wav_ingest_and_checksum_readback',
      'success_failure_unknown_and_both_reconciliation_branches',
      'unknown_outcome_blocks_retry_until_exact_reconciliation',
      'expired_consumed_attempt_fails_closed_without_duplicate_reclaim',
      'failed_unknown_and_reconciled_attempt_internal_cost_retained',
      'provider_and_infrastructure_cost_separate_from_customer_commercial_fields',
      'route_output_cardinality_authorization_credential_and_rate_expiry_tamper_rejected',
      'zero_provider_secret_cloud_supabase_billing_and_public_side_effects',
      'provider_transport_distributed_persistence_motion_receipt_and_production_remain_blocked',
    ],
    providerRequests: 0,
    secretPayloadReads: 0,
    cloudMutations: 0,
    supabaseMutations: 0,
    billingMutations: 0,
    productionReady: false,
  }))
} finally {
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke()
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })))
}

interface Fixture {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  jobId: string
  outputId: string
  lifecycle: Omit<ExecutePrivateInjectedProviderWorkLifecycleInput, 'outcome'>
}

async function fixture(label: string): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), `reeditpro-provider-${label}-`))
  roots.push(root)
  const scope: CanonicalPrivatePackageWorkQueueStoreScope = {
    localStorageRoot: root,
    ownerUserId: `owner-${label}`,
    workspaceId: `workspace-${label}`,
    projectId: `project-${label}`,
    editSessionId: `edit-${label}`,
    packageRecordId: `package-${label}`,
    approvedPlanSnapshotId: `snapshot-${label}`,
  }
  const jobId = `job-${label}`
  const workItemId = `work-item-${label}`
  const workItemKey = `generated-music-${label}`
  const outputId = `music-candidate-${label}`
  const packageHash = digest(`package:${label}`)
  const snapshotHash = digest(`snapshot:${label}`)
  const workGraphHash = digest(`work-graph:${label}`)
  const placementHash = digest(`placement:${label}`)
  const executionPackage = createExecutionPackage({
    scope,
    label,
    jobId,
    workItemId,
    workItemKey,
    outputId,
    packageHash,
    snapshotHash,
    workGraphHash,
  })
  const jobPayload = {
    canonicalOrder: 0,
    jobId,
    approvedWorkItemId: workItemId,
    workItemKey,
    expectedOutputIdentity: outputId,
    required: true,
    dependencyJobIds: [] as string[],
    workerType: 'cpu_analysis_worker' as const,
    resourceClassId: 'cpu_analysis_standard_v1' as const,
    plannedCloudExecutionTarget: 'cloud_run_job' as const,
    preferredAccelerator: 'none' as const,
    placementHash,
    privateExecutionReady: false,
    providerExecutionMode: 'primary' as const,
    requiredGate: 'provider_activation_and_approved_route',
    maxAttempts: 1,
    attemptTimeoutSeconds: 120,
    scheduledFor: at(-1_000),
  }
  const job = canonicalPrivatePackageWorkQueueJobDefinitionSchema.parse({
    ...jobPayload,
    definitionHash: sha256AuthorityValue(jobPayload),
  })
  const definitionPayload = {
    schemaVersion: CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_DEFINITION_VERSION,
    source: 'canonical_execution_package_and_snapshot_resource_placement' as const,
    identity: {
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
      packageRecordId: scope.packageRecordId,
      approvedPlanSnapshotId: scope.approvedPlanSnapshotId,
      packageHash,
      snapshotHash,
      workGraphHash,
      placementManifestHash: digest(`placement-manifest:${label}`),
      toolExecutionAuthorityHash: digest(`tool-authority:${label}`),
      approvedResourcePlacementAuthorityHash: digest(`resource-authority:${label}`),
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
  const queueDefinition = canonicalPrivatePackageWorkQueueDefinitionSchema.parse({
    ...definitionPayload,
    definitionHash: sha256AuthorityValue(definitionPayload),
  })
  return {
    scope,
    executionPackage,
    queueDefinition,
    jobId,
    outputId,
    lifecycle: {
      scope,
      executionPackage,
      queueDefinition,
      jobId,
      expectedOutputId: outputId,
      sourceRequestId: `source-request-${label}`,
      sourceRequestDigest: digest(`source-request:${label}`),
      providerRequestPayloadDigest: digest(`provider-payload:${label}`),
      projectDataPolicyDigest: digest(`data-policy:${label}`),
      providerAccountPolicyDigest: digest(`account-policy:${label}`),
      idempotencyKey: `provider-lifecycle-idempotency-${label}-v1`,
      workerIdentity: `private-provider-worker-${label}`,
      credentialSecret: INJECTED_DISPATCH_SECRET,
      leaseDurationMs: 60_000,
      times: {
        authorizedAt: at(0),
        authorizationExpiresAt: at(60 * 60 * 1_000),
        claimAt: at(1_000),
        issuedAt: at(2_000),
        consumedAt: at(3_000),
        completedAt: at(5_000),
      },
    },
  }
}

function createExecutionPackage(input: {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  label: string
  jobId: string
  workItemId: string
  workItemKey: string
  outputId: string
  packageHash: string
  snapshotHash: string
  workGraphHash: string
}): CanonicalApprovedEditExecutionPackage {
  const ref = (name: string) => ({ sha256: digest(`${name}:${input.label}`), byteLength: 1 })
  const toolBindingsHash = digest(`tool-bindings:${input.label}`)
  return {
    schemaVersion: 'canonical-approved-edit-execution-package-v5',
    packageRecordId: input.scope.packageRecordId,
    source: 'canonical_edit_authority',
    purpose: 'private_internal_execution_handoff',
    authorityRevision: 1,
    workspaceId: input.scope.workspaceId,
    projectId: input.scope.projectId,
    editSessionId: input.scope.editSessionId,
    approvedPlanSnapshotId: input.scope.approvedPlanSnapshotId,
    planId: `plan-${input.label}`,
    estimateId: `estimate-${input.label}`,
    reservationId: `reservation-${input.label}`,
    approvalId: `approval-${input.label}`,
    snapshotHash: input.snapshotHash,
    planHash: digest(`plan:${input.label}`),
    estimateHash: digest(`estimate:${input.label}`),
    workGraphHash: input.workGraphHash,
    sourceSequenceHash: digest(`source-sequence:${input.label}`),
    timingHash: digest(`timing:${input.label}`),
    approvedAssetManifestRef: ref('asset-manifest'),
    approvedAssetManifestHash: digest(`asset-manifest:${input.label}`),
    plannedAssetCount: 1,
    requiredPlannedAssetCount: 1,
    approvedSourceAssetManifestRef: ref('source-asset-manifest'),
    approvedSourceAssetManifestHash: digest(`source-asset-manifest:${input.label}`),
    sourceBindingCount: 0,
    requiredSourceBindingCount: 0,
    componentRefs: {},
    approvedMaximumCredits: 100,
    reservationStatus: 'reserved',
    remainingReservedCredits: 100,
    approvedWorkItems: [{
      id: input.workItemId,
      workItemKey: input.workItemKey,
      workItemType: 'generate_music_candidate',
      workerClass: 'audio_processing_worker',
      executionInputRef: ref('execution-input'),
      executionInputHash: digest(`execution-input:${input.label}`),
      sourceSequenceItemIds: [],
      sourceCleanupDecisionIds: [],
      expectedOutputs: [{
        outputKey: input.outputId,
        artifactType: 'generated_music_candidate',
        assetRole: 'generated',
        required: true,
        previewPlaceholderAllowed: false,
        contentType: 'audio/wav',
        segmentIds: [],
        timingIds: [],
        rendererLayerIds: [],
      }],
      dependencyKeys: [],
      approvedToolIds: [],
      approvedToolOperationIds: [],
      toolOperationBindingsHash: toolBindingsHash,
      approvedProviderRoute: CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID,
      providerExecutionMode: 'primary',
      fallbackPolicyRef: ref('fallback-policy'),
      maxAttempts: 1,
      attemptTimeoutSeconds: 120,
      scheduledDelaySeconds: 0,
      maximumCreditBudget: 100,
      required: true,
    }],
    jobs: [{
      id: input.jobId,
      approvedWorkItemId: input.workItemId,
      workItemKey: input.workItemKey,
      jobType: 'generate_music_candidate',
      workerClass: 'audio_processing_worker',
      executionInputRef: ref('execution-input'),
      sourceSequenceItemIds: [],
      sourceCleanupDecisionIds: [],
      expectedAssetIds: [input.outputId],
      dependencyJobIds: [],
      approvedToolOperationIds: [],
      toolOperationBindingsHash: toolBindingsHash,
      dependencyState: 'ready',
      dispatchState: 'not_authorized',
      maxAttempts: 1,
      attemptTimeoutSeconds: 120,
      scheduledFor: at(-1_000),
    }],
    toolCapabilityManifestRef: ref('tool-capability-manifest'),
    approvedToolIds: [],
    approvedToolOperationIds: [],
    toolOperationBindingCount: 0,
    toolOperationBindingsHash: toolBindingsHash,
    toolCapabilityManifestHash: digest(`tool-manifest:${input.label}`),
    approvedProviderRoutes: [CANONICAL_LYRIA_PROVIDER_BOUNDARY_PROFILE_ID],
    status: 'canonical_authority_packaged_runtime_blocked',
    authorityHandoffReady: true,
    workerDispatchReady: false,
    finalRenderReady: false,
    liveExecutionReady: false,
    blockers: ['provider_transport_not_activated'],
    noRuntimeSideEffects: [
      'No provider request, credential payload read, customer charge, or public delivery.',
    ],
    createdByUserId: input.scope.ownerUserId,
    createdAt: at(0),
    packageHash: input.packageHash,
  }
}

function authorizationFor(
  item: Fixture,
  executionPackage: CanonicalApprovedEditExecutionPackage,
) {
  return createCanonicalProviderWorkAuthorization(
    authorizationInput(item, executionPackage),
  )
}

function authorizationInput(
  item: Fixture,
  executionPackage: CanonicalApprovedEditExecutionPackage,
) {
  return {
    ownerUserId: item.scope.ownerUserId,
    executionPackage,
    queueDefinition: item.queueDefinition,
    jobId: item.jobId,
    expectedOutputId: item.outputId,
    sourceRequestId: item.lifecycle.sourceRequestId,
    sourceRequestDigest: item.lifecycle.sourceRequestDigest,
    providerRequestPayloadDigest: item.lifecycle.providerRequestPayloadDigest,
    projectDataPolicyDigest: item.lifecycle.projectDataPolicyDigest,
    providerAccountPolicyDigest: item.lifecycle.providerAccountPolicyDigest,
    idempotencyKey: item.lifecycle.idempotencyKey,
    authorityClass: 'private_injected_nonprovider_test' as const,
    authorizedAt: item.lifecycle.times.authorizedAt,
    expiresAt: item.lifecycle.times.authorizationExpiresAt,
  }
}

function wavFixture(seed: number): Buffer {
  const bytes = Buffer.alloc(48)
  bytes.write('RIFF', 0, 'ascii')
  bytes.writeUInt32LE(40, 4)
  bytes.write('WAVE', 8, 'ascii')
  bytes.write('fmt ', 12, 'ascii')
  bytes.writeUInt32LE(16, 16)
  bytes.writeUInt16LE(1, 20)
  bytes.writeUInt16LE(2, 22)
  bytes.writeUInt32LE(48_000, 24)
  bytes.writeUInt32LE(192_000, 28)
  bytes.writeUInt16LE(4, 32)
  bytes.writeUInt16LE(16, 34)
  bytes.write('data', 36, 'ascii')
  bytes.writeUInt32LE(4, 40)
  bytes.writeInt16LE(seed, 44)
  bytes.writeInt16LE(-seed, 46)
  return bytes
}

function digest(label: string): string {
  return sha256AuthorityValue({
    domain: 'reeditpro:canonical-provider-work-lifecycle-smoke:v1',
    label,
  })
}

function assertCommercialBoundary(value: {
  commercialBoundary: {
    customerPriceIncluded: boolean
    customerCreditsIncluded: boolean
    serviceFeeIncluded: boolean
    walletMutationPerformed: boolean
    billingMutationPerformed: boolean
  }
}): void {
  assert.deepEqual(value.commercialBoundary, {
    customerPriceIncluded: false,
    customerCreditsIncluded: false,
    serviceFeeIncluded: false,
    walletMutationPerformed: false,
    billingMutationPerformed: false,
  })
}

function assertZeroExternalEffects(value: {
  providerRequestCount: number
  secretPayloadReadCount: number
  cloudMutationCount: number
  supabaseMutationCount: number
  billingMutationCount: number
  canonicalMotionReceiptIssued: boolean
  providerTransportActivated: boolean
  distributedPersistenceProven: boolean
  productReady: boolean
  productionReady: boolean
}): void {
  assert.equal(value.providerRequestCount, 0)
  assert.equal(value.secretPayloadReadCount, 0)
  assert.equal(value.cloudMutationCount, 0)
  assert.equal(value.supabaseMutationCount, 0)
  assert.equal(value.billingMutationCount, 0)
  assert.equal(value.canonicalMotionReceiptIssued, false)
  assert.equal(value.providerTransportActivated, false)
  assert.equal(value.distributedPersistenceProven, false)
  assert.equal(value.productReady, false)
  assert.equal(value.productionReady, false)
}

async function allPersistedBytes(root: string): Promise<string> {
  const chunks: Buffer[] = []
  async function walk(path: string): Promise<void> {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = join(path, entry.name)
      if (entry.isDirectory()) await walk(child)
      else if (entry.isFile()) chunks.push(await readFile(child))
    }
  }
  await walk(root)
  return Buffer.concat(chunks).toString('utf8')
}

async function expectApiError(
  operation: () => Promise<unknown>,
  code: string,
): Promise<void> {
  await assert.rejects(operation, (error: unknown) =>
    error instanceof ApiError && error.code === code)
}
