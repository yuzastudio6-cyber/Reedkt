import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import {
  createCanonicalProviderLifecyclePolicyCatalog,
  resolveCanonicalProviderLifecyclePolicy,
} from '../edit-architecture/canonical-provider-lifecycle-policy'
import {
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID,
  createCanonicalProviderOperationRegistryV3,
} from '../edit-architecture/canonical-provider-work-authority'
import {
  CANONICAL_PRIVATE_PACKAGE_WORK_QUEUE_DEFINITION_VERSION,
  canonicalPrivatePackageWorkQueueDefinitionSchema,
  canonicalPrivatePackageWorkQueueJobDefinitionSchema,
  type CanonicalPrivatePackageWorkQueueDefinition,
} from '../edit-architecture/canonical-private-package-work-queue-authority'
import { ApiError } from '../errors/api-error'
import {
  projectCanonicalSynchronizedFoleyConsumerReceipt,
} from '../services/canonical-private-synchronized-foley-consumer-receipt-service'
import {
  executePrivateInjectedSynchronizedFoleyLifecycle,
  reconcilePrivateInjectedSynchronizedFoleyUnknown,
  type ExecutePrivateInjectedSynchronizedFoleyLifecycleInput,
  type PrivateInjectedSynchronizedFoleyLifecycleResult,
} from '../services/canonical-private-synchronized-foley-provider-lifecycle-service'
import {
  clearPrivateCanonicalPackageWorkQueueProcessStateForSmoke,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from '../services/private-canonical-package-work-queue-store'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'
import {
  createPrivateWorkerResourceUsageCostEvidence,
  hashPrivateWorkerResourceArtifactManifest,
  hashPrivateWorkerResourceObserverSnapshot,
} from '../tool-cost-metering/private-worker-resource-usage-cost-evidence'
import {
  canonicalProviderAttemptConsumerReceiptSchema,
} from '../validation/canonical-provider-attempt-consumer-receipt-schemas'

const BASE_TIME_MS = Date.parse('2026-07-21T18:00:00.000Z')
const at = (offsetMs: number) => new Date(BASE_TIME_MS + offsetMs).toISOString()
const INJECTED_DISPATCH_SECRET =
  'private-injected-fal-dispatch-secret-for-smoke-only-20260721'
const roots: string[] = []

try {
  const profiles = createCanonicalProviderOperationRegistryV3()
  assert.equal(profiles.length, 1)
  assert.equal(
    profiles[0].operationId,
    CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  )
  assert.equal(profiles[0].providerRouteId,
    CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID)
  assert.equal(profiles[0].expectedOutput.maximumByteLength, 67_108_864)
  assert.equal(profiles[0].requestPolicy.maximumNetworkRequests, 17)
  assert.equal(profiles[0].readiness.privateInjectedAuthorizationAllowed, true)
  assert.equal(profiles[0].readiness.providerTransportActivated, false)
  assert.equal(profiles[0].readiness.productionReady, false)

  const policies = createCanonicalProviderLifecyclePolicyCatalog()
  assert.equal(policies.length, 3)
  const policy = resolveCanonicalProviderLifecyclePolicy(
    CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID,
  )
  assert.deepEqual(policy.requestCeilings, {
    privateInputUploadCount: 1,
    generationSubmissionCount: 1,
    statusReadCount: 12,
    resultReadCount: 1,
    binaryDownloadCount: 1,
    cancellationCount: 1,
    totalLifecycleHttpRequestCount: 17,
  })
  assert.equal(policy.qualification.canonicalAuthorizationIssuanceAllowed, false)
  assert.equal(policy.qualification.providerTransportActivated, false)

  const success = await fixture('success')
  const successResult = await executePrivateInjectedSynchronizedFoleyLifecycle({
    ...success.lifecycle,
    outcome: {
      state: 'succeeded',
      output: foleyOutput(success.outputId, mp4Fixture(17)),
      wallTimeMicroseconds: 900_000,
      rawInfrastructureUsageEvidenceDigest: digest('success-infrastructure'),
    },
  })
  assert.equal(successResult.disposition, 'executed')
  assert.equal(successResult.authorization.operationId,
    CANONICAL_FAL_SYNCHRONIZED_FOLEY_OPERATION_ID)
  assert.equal(successResult.authorization.providerRouteId,
    CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID)
  assert.equal(successResult.authorization.boundaries.providerCallAuthorized, false)
  assert.equal(successResult.authorization.boundaries.cloudMutationAuthorized, false)
  assert.equal(successResult.grant.secretLocator.payloadReadCount, 0)
  assert.equal(successResult.grant.providerCallAuthorized, false)
  assert.equal(successResult.grant.maximumLifecycleHttpRequests, 17)
  assert.equal(successResult.dispatchEntry.attempt.providerRequestStarted, false)
  assert.equal(successResult.terminal.providerRequestCount, 0)
  assert.equal(successResult.terminal.privateOutputs.length, 1)
  assert.equal(successResult.privateOutput?.role,
    'provider_synchronized_audio_mp4')
  assert.equal(successResult.privateOutput?.mimeType, 'video/mp4')
  assert.equal(successResult.privateOutput?.providerUrlPersisted, false)
  assert.equal(successResult.privateOutput?.localPathProjected, false)
  assert.equal(successResult.costEvidence.provider.actualInternalCostMicros, 0)
  assert.ok(successResult.costEvidence.infrastructure.actualInternalCostMicros > 0)
  assertCommercialBoundary(successResult.costEvidence)
  assertZeroExternalEffects(successResult.evidence)

  await expectApiError(
    () => projectCanonicalSynchronizedFoleyConsumerReceipt({
      scope: success.scope,
      executionPackage: success.executionPackage,
      queueDefinition: success.queueDefinition,
      authorization: successResult.authorization,
      projectedAt: at(6_000),
    }),
    'TOOL_NOT_READY',
  )
  await persistProviderWorkerUsage(success, successResult)
  const successReceipt = canonicalProviderAttemptConsumerReceiptSchema.parse(
    await projectCanonicalSynchronizedFoleyConsumerReceipt({
      scope: success.scope,
      executionPackage: success.executionPackage,
      queueDefinition: success.queueDefinition,
      authorization: successResult.authorization,
      projectedAt: at(6_000),
    }),
  )
  assert.equal(successReceipt.evidenceClass, 'private_injected_nonprovider_test')
  assert.equal(successReceipt.promotionClass, 'non_promotable_private_injected')
  assert.equal(successReceipt.privateOutputs.length, 1)
  assert.equal(successReceipt.privateOutput?.outputId, success.outputId)
  assert.equal(successReceipt.outputSet.sourceAuthorityClass,
    'forward_single_output_same_attempt_source')
  assert.equal(successReceipt.outputSet.multiOutputProviderOperationAdmitted, false)
  assert.equal(successReceipt.outputSet.outputSetDigest,
    successResult.terminal.outputSetDigest)
  assert.equal(successReceipt.requestAccounting.legacyV1MaximumProviderRequests, 1)
  assert.equal(successReceipt.requestAccounting.ceilings
    .totalLifecycleHttpRequestCount, 17)
  assert.equal(successReceipt.requestAccounting.ceilings.statusReadCount, 12)
  assert.equal(successReceipt.requestAccounting.observedTransport
    .totalLifecycleHttpRequestCount, 0)
  assert.equal(successReceipt.requestAccounting
    .continuationRequestsBelongToSameAttempt, true)
  assert.equal(successReceipt.requestAccounting
    .unknownOutcomeBlocksNewSubmission, true)
  assert.equal(successReceipt.queue.queueAttemptId, successReceipt.queue.claimId)
  assert.equal(successReceipt.queue.leaseId, successReceipt.queue.claimId)
  assert.equal(successReceipt.dispatch.retryCount, 0)
  assert.equal(successReceipt.dispatch.fallbackCount, 0)
  assert.equal(successReceipt.dispatch.sanitizedFailureCode, null)
  assert.equal(successReceipt.internalCost.providerCostMicros, 0)
  assert.ok(successReceipt.internalCost.selectedInfrastructureCostMicros > 0)
  assert.equal(successReceipt.internalCost.providerCostIncludedInWorkerEvidence,
    false)
  assert.equal(successReceipt.boundaries.credentialValueLogged, false)
  assert.equal(successReceipt.boundaries.requestBodyPersistedInQueue, false)
  assert.equal(successReceipt.boundaries.callerSelectedExecutableAllowed, false)
  assert.equal(successReceipt.boundaries.callerSelectedProviderRouteAllowed, false)
  assert.equal(successReceipt.boundaries.providerTransportActivated, false)
  assert.equal(successReceipt.boundaries.productionReady, false)

  const replay = await executePrivateInjectedSynchronizedFoleyLifecycle({
    ...success.lifecycle,
    outcome: {
      state: 'succeeded',
      output: foleyOutput(success.outputId, mp4Fixture(99)),
      wallTimeMicroseconds: 900_000,
      rawInfrastructureUsageEvidenceDigest: digest('success-infrastructure'),
    },
  })
  assert.equal(replay.disposition, 'completed_replay')
  assert.equal(replay.terminal.terminalHash, successResult.terminal.terminalHash)
  assert.equal(replay.privateOutput?.contentSha256,
    successResult.privateOutput?.contentSha256)

  const failed = await fixture('failed')
  const failedResult = await executePrivateInjectedSynchronizedFoleyLifecycle({
    ...failed.lifecycle,
    outcome: {
      state: 'failed',
      sanitizedFailureCode: 'provider_generation_failed',
      wallTimeMicroseconds: 700_000,
      rawInfrastructureUsageEvidenceDigest: digest('failed-infrastructure'),
    },
  })
  await persistProviderWorkerUsage(failed, failedResult)
  const failedReceipt = await projectCanonicalSynchronizedFoleyConsumerReceipt({
    scope: failed.scope,
    executionPackage: failed.executionPackage,
    queueDefinition: failed.queueDefinition,
    authorization: failedResult.authorization,
    projectedAt: at(6_000),
  })
  assert.equal(failedReceipt.dispatch.terminalState, 'failed')
  assert.equal(failedReceipt.dispatch.sanitizedFailureCode,
    'provider_generation_failed')
  assert.equal(failedReceipt.privateOutputs.length, 0)
  assert.equal(failedReceipt.queue.terminalQueueCompletion, false)
  assert.equal(failedReceipt.internalCost.failedOrUnknownAttemptCostRetained, true)

  const unknown = await fixture('unknown')
  const unknownResult = await executePrivateInjectedSynchronizedFoleyLifecycle({
    ...unknown.lifecycle,
    outcome: {
      state: 'unknown_reconciliation_required',
      providerResponseUsageDigest: digest('unknown-provider-usage'),
      wallTimeMicroseconds: 800_000,
      rawInfrastructureUsageEvidenceDigest: digest('unknown-infrastructure'),
    },
  })
  await persistProviderWorkerUsage(unknown, unknownResult)
  const unknownReceipt = await projectCanonicalSynchronizedFoleyConsumerReceipt({
    scope: unknown.scope,
    executionPackage: unknown.executionPackage,
    queueDefinition: unknown.queueDefinition,
    authorization: unknownResult.authorization,
    projectedAt: at(6_000),
  })
  assert.equal(unknownReceipt.dispatch.terminalState,
    'unknown_reconciliation_required')
  assert.equal(unknownReceipt.requestAccounting
    .injectedSimulationGenerationSubmissionCount, 1)
  assert.equal(unknownReceipt.requestAccounting.observedTransport
    .generationSubmissionCount, 0)
  assert.equal(unknownReceipt.queue.terminalQueueCompletion, false)
  const reconciled = await reconcilePrivateInjectedSynchronizedFoleyUnknown({
    scope: unknown.scope,
    queueDefinition: unknown.queueDefinition,
    authorization: unknownResult.authorization,
    grantId: unknownResult.grant.grantId,
    resolution: 'succeeded',
    output: foleyOutput(unknown.outputId, mp4Fixture(31)),
    providerResponseUsageDigest: digest('reconciled-provider-usage'),
    wallTimeMicroseconds: 1_100_000,
    rawInfrastructureUsageEvidenceDigest: digest('reconciled-infrastructure'),
    completedAt: at(7_000),
  })
  assert.equal(reconciled.terminal.state, 'unknown_reconciled_succeeded')
  assert.equal(reconciled.terminal.sequence, 2)
  assert.equal(reconciled.terminal.providerRequestCount, 1)
  assert.equal(reconciled.privateOutput?.outputId, unknown.outputId)
  const reconciledReceipt = await projectCanonicalSynchronizedFoleyConsumerReceipt({
    scope: unknown.scope,
    executionPackage: unknown.executionPackage,
    queueDefinition: unknown.queueDefinition,
    authorization: unknownResult.authorization,
    projectedAt: at(8_000),
  })
  assert.equal(reconciledReceipt.queue.unknownOutcomeReconciled, true)
  assert.equal(reconciledReceipt.queue.terminalQueueCompletion, true)
  assert.equal(reconciledReceipt.privateOutput?.outputId, unknown.outputId)
  assert.equal(reconciledReceipt.internalCost.failedOrUnknownAttemptCostRetained,
    true)

  const malformed = await fixture('malformed')
  await expectApiError(
    () => executePrivateInjectedSynchronizedFoleyLifecycle({
      ...malformed.lifecycle,
      outcome: {
        state: 'succeeded',
        output: foleyOutput(
          malformed.outputId,
          Buffer.from('not-an-mp4', 'utf8'),
        ),
        wallTimeMicroseconds: 500_000,
        rawInfrastructureUsageEvidenceDigest: digest('malformed-infrastructure'),
      },
    }),
    'VALIDATION_FAILED',
  )

  const tamperedAuthorization = {
    ...successResult.authorization,
    providerRouteId: 'caller-selected-provider-route',
  }
  await expectApiError(
    () => projectCanonicalSynchronizedFoleyConsumerReceipt({
      scope: success.scope,
      executionPackage: success.executionPackage,
      queueDefinition: success.queueDefinition,
      authorization: tamperedAuthorization as typeof successResult.authorization,
      projectedAt: at(6_000),
    }),
    'VALIDATION_FAILED',
  )

  console.log(JSON.stringify({
    smoke: 'canonical-private-synchronized-foley-provider-lifecycle',
    operationId: successResult.authorization.operationId,
    providerRouteId: successResult.authorization.providerRouteId,
    outputRole: successReceipt.privateOutput?.role,
    receiptHash: successReceipt.receiptHash,
    providerRateCardDigest: successReceipt.internalCost.providerRateCardDigest,
    workerResourceEvidenceHash:
      successReceipt.internalCost.workerResourceEvidenceHash,
    maximumLifecycleHttpRequests:
      successReceipt.requestAccounting.ceilings.totalLifecycleHttpRequestCount,
    failedAttemptCostRetained:
      failedReceipt.internalCost.failedOrUnknownAttemptCostRetained,
    unknownOutcomeReconciled:
      reconciledReceipt.queue.unknownOutcomeReconciled,
    providerRequestCount: successResult.evidence.providerRequestCount,
    secretPayloadReadCount: successResult.evidence.secretPayloadReadCount,
    providerTransportActivated: successResult.evidence.providerTransportActivated,
    productionReady: successResult.evidence.productionReady,
  }, null, 2))
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
  lifecycle: Omit<
    ExecutePrivateInjectedSynchronizedFoleyLifecycleInput,
    'outcome'
  >
}

async function fixture(label: string): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), `reeditpro-provider-foley-${label}-`))
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
  const workItemKey = `synchronized-foley-${label}`
  const outputId = `synchronized-foley-mp4-${label}`
  const packageHash = digest(`package:${label}`)
  const snapshotHash = digest(`snapshot:${label}`)
  const workGraphHash = digest(`work-graph:${label}`)
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
    placementHash: digest(`placement:${label}`),
    privateExecutionReady: false,
    providerExecutionMode: 'primary' as const,
    requiredGate: 'provider_activation_and_approved_route',
    maxAttempts: 1,
    attemptTimeoutSeconds: 900,
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
      idempotencyKey: `provider-foley-idempotency-${label}-v3`,
      providerRateAuthority: {
        evidenceClass: 'private_local_fixture',
        snapshotId: `fal-mmaudio-rate-fixture-${label}-v1`,
        snapshotDigest: digest(`provider-rate:${label}`),
        billingUnit: 'generation_submission',
        productionQualified: false,
      },
      maximumAuthorizedProviderCostMicros: 100_000,
      maximumAuthorizedInfrastructureCostMicros: 50_000,
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
  const ref = (name: string) => ({
    sha256: digest(`${name}:${input.label}`),
    byteLength: 1,
  })
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
      workItemType: 'generate_synchronized_foley_candidate',
      workerClass: 'provider_worker',
      executionInputRef: ref('execution-input'),
      executionInputHash: digest(`execution-input:${input.label}`),
      sourceSequenceItemIds: [],
      sourceCleanupDecisionIds: [],
      expectedOutputs: [{
        outputKey: input.outputId,
        artifactType: 'provider_synchronized_audio_mp4',
        assetRole: 'generated',
        required: true,
        previewPlaceholderAllowed: false,
        contentType: 'video/mp4',
        segmentIds: [],
        timingIds: [],
        rendererLayerIds: [],
      }],
      dependencyKeys: [],
      approvedToolIds: [],
      approvedToolOperationIds: [],
      toolOperationBindingsHash: toolBindingsHash,
      approvedProviderRoute: CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID,
      providerExecutionMode: 'primary',
      fallbackPolicyRef: ref('fallback-policy'),
      maxAttempts: 1,
      attemptTimeoutSeconds: 900,
      scheduledDelaySeconds: 0,
      maximumCreditBudget: 100,
      required: true,
    }],
    jobs: [{
      id: input.jobId,
      approvedWorkItemId: input.workItemId,
      workItemKey: input.workItemKey,
      jobType: 'generate_synchronized_foley_candidate',
      workerClass: 'provider_worker',
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
      attemptTimeoutSeconds: 900,
      scheduledFor: at(-1_000),
    }],
    toolCapabilityManifestRef: ref('tool-capability-manifest'),
    approvedToolIds: [],
    approvedToolOperationIds: [],
    toolOperationBindingCount: 0,
    toolOperationBindingsHash: toolBindingsHash,
    toolCapabilityManifestHash: digest(`tool-manifest:${input.label}`),
    approvedProviderRoutes: [CANONICAL_FAL_SYNCHRONIZED_FOLEY_ROUTE_ID],
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

async function persistProviderWorkerUsage(
  fixtureValue: Fixture,
  result: PrivateInjectedSynchronizedFoleyLifecycleResult,
): Promise<void> {
  const attempt = result.dispatchEntry.attempt
  const workItem = fixtureValue.executionPackage.approvedWorkItems.find((candidate) =>
    candidate.id === result.authorization.approvedWorkItemId)
  if (!workItem) throw new Error('Foley provider smoke work item disappeared.')
  const runtimeExecutionIdentityDigest = digest(
    `runtime-execution:${attempt.dispatchAttemptId}`,
  )
  const containerIdentityDigest = digest(`container:${attempt.dispatchAttemptId}`)
  const measurementAgentDigest = digest(
    `measurement-agent:${attempt.dispatchAttemptId}`,
  )
  const snapshot = (input: {
    capturedAt: string
    cpuUsageNanoseconds: number
    memoryCurrentBytes: number
    memoryPeakBytes: number
  }) => {
    const value = {
      schemaVersion: 'private-worker-resource-observer-snapshot-v1' as const,
      runtimeExecutionIdentityDigest,
      containerIdentityDigest,
      measurementAgentDigest,
      capturedAt: input.capturedAt,
      cpuUsageNanoseconds: input.cpuUsageNanoseconds,
      memoryCurrentBytes: input.memoryCurrentBytes,
      memoryPeakBytes: input.memoryPeakBytes,
      gpuActiveMilliseconds: null,
    }
    return {
      ...value,
      rawSnapshotDigest: hashPrivateWorkerResourceObserverSnapshot(value),
    }
  }
  const inputArtifacts = [{
    artifactId: result.authorization.sourceRequestId,
    sha256: result.authorization.sourceRequestDigest,
    byteLength: 1,
  }]
  const outputArtifacts = result.privateOutput
    ? [{
        artifactId: result.privateOutput.assetVersionId,
        sha256: result.privateOutput.contentSha256,
        byteLength: result.privateOutput.byteLength,
      }]
    : []
  const completed = result.terminal.state === 'succeeded'
  const failed = result.terminal.state === 'failed'
  await createPrivateWorkerResourceUsageCostEvidence({
    localStorageRoot: fixtureValue.scope.localStorageRoot,
    evidenceClass: 'private_injected_observed_usage_test',
    operation: {
      kind: 'registered_provider_operation',
      operationId: result.authorization.operationId,
    },
    identity: {
      ownerUserId: result.authorization.ownerUserId,
      workspaceId: result.authorization.workspaceId,
      projectId: result.authorization.projectId,
      editSessionId: result.authorization.editSessionId,
      approvedPlanSnapshotId: result.authorization.approvedPlanSnapshotId,
      approvedPlanSnapshotHash: result.authorization.snapshotHash,
      packageRecordId: result.authorization.packageRecordId,
      packageHash: result.authorization.packageHash,
      approvedWorkItemId: result.authorization.approvedWorkItemId,
      approvedWorkItemHash: sha256AuthorityValue(workItem),
      jobId: result.authorization.queueJobId,
      executionAttemptId: attempt.dispatchAttemptId,
      attemptOrdinal: attempt.queueClaimDeliveryAttempt,
      leaseId: attempt.queueClaimId,
      leaseHash: attempt.queueClaimHash,
      dispatchGrantId: result.grant.grantId,
      dispatchGrantHash: result.grant.immutableGrantHash,
      idempotencyKeyHash: result.authorization.idempotencyKeyHash,
    },
    attemptInputHash: result.authorization.providerRequestPayloadDigest,
    runtime: {
      workerClass: 'provider_worker',
      runtimeExecutionIdentityDigest,
      runtimeImageDigest: digest(`runtime-image:${attempt.dispatchAttemptId}`),
      runtimeAttestationDigest: digest(
        `runtime-attestation:${attempt.dispatchAttemptId}`,
      ),
      containerIdentityDigest,
      cloudExecutionResourceDigest: null,
      measurementAgentVersion: 'provider-foley-usage-smoke-v1',
      measurementAgentDigest,
      leaseExpiresAt: result.grant.queueClaimExpiresAt,
    },
    allocation: { vcpuCount: 1, memoryMib: 1_024, gpuCount: 0 },
    startSnapshot: snapshot({
      capturedAt: at(3_200),
      cpuUsageNanoseconds: 1_000_000,
      memoryCurrentBytes: 8 * 1024 * 1024,
      memoryPeakBytes: 8 * 1024 * 1024,
    }),
    finishSnapshot: snapshot({
      capturedAt: at(4_200),
      cpuUsageNanoseconds: 3_000_000,
      memoryCurrentBytes: 12 * 1024 * 1024,
      memoryPeakBytes: 16 * 1024 * 1024,
    }),
    input: {
      artifacts: inputArtifacts,
      manifestHash: hashPrivateWorkerResourceArtifactManifest({
        direction: 'input',
        artifacts: inputArtifacts,
      }),
    },
    output: {
      disposition: completed ? 'accepted' : 'none',
      artifacts: outputArtifacts,
      manifestHash: hashPrivateWorkerResourceArtifactManifest({
        direction: 'output',
        artifacts: outputArtifacts,
      }),
    },
    networkEgressBytes: 0,
    outcome: completed
      ? { state: 'completed', failureCategory: 'none' }
      : failed
        ? { state: 'failed', failureCategory: 'provider_error' }
        : { state: 'unknown', failureCategory: 'unknown' },
    createdAt: at(5_000),
  })
}

function foleyOutput(outputId: string, bytes: Buffer) {
  return {
    outputId,
    role: 'provider_synchronized_audio_mp4' as const,
    mimeType: 'video/mp4' as const,
    bytes,
  }
}

function mp4Fixture(seed: number): Buffer {
  const bytes = Buffer.alloc(24)
  bytes.writeUInt32BE(24, 0)
  bytes.write('ftyp', 4, 'ascii')
  bytes.write('isom', 8, 'ascii')
  bytes.writeUInt32BE(seed, 12)
  bytes.write('isom', 16, 'ascii')
  bytes.write('mp42', 20, 'ascii')
  return bytes
}

function assertCommercialBoundary(evidence: {
  commercialBoundary: {
    customerPriceIncluded: boolean
    customerCreditsIncluded: boolean
    serviceFeeIncluded: boolean
    walletMutationPerformed: boolean
    billingMutationPerformed: boolean
  }
}): void {
  assert.deepEqual(evidence.commercialBoundary, {
    customerPriceIncluded: false,
    customerCreditsIncluded: false,
    serviceFeeIncluded: false,
    walletMutationPerformed: false,
    billingMutationPerformed: false,
  })
}

function assertZeroExternalEffects(evidence: {
  secretPayloadReadCount: number
  providerRequestCount: number
  providerCandidateCount: number
  cloudMutationCount: number
  supabaseMutationCount: number
  billingMutationCount: number
  providerTransportActivated: boolean
  productionReady: boolean
}): void {
  assert.equal(evidence.secretPayloadReadCount, 0)
  assert.equal(evidence.providerRequestCount, 0)
  assert.equal(evidence.providerCandidateCount, 0)
  assert.equal(evidence.cloudMutationCount, 0)
  assert.equal(evidence.supabaseMutationCount, 0)
  assert.equal(evidence.billingMutationCount, 0)
  assert.equal(evidence.providerTransportActivated, false)
  assert.equal(evidence.productionReady, false)
}

async function expectApiError(
  operation: () => Promise<unknown>,
  code: string,
): Promise<void> {
  await assert.rejects(operation, (error: unknown) =>
    error instanceof ApiError && error.code === code)
}

function digest(value: string): string {
  return sha256AuthorityValue({ value })
}
