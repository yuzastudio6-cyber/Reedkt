import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import {
  resolveCanonicalProviderLifecyclePolicy,
} from '../edit-architecture/canonical-provider-lifecycle-policy'
import type { CanonicalPrivatePackageWorkQueueDefinition } from
  '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  canonicalProviderWorkAuthorizationRequestHash,
  canonicalProviderWorkAuthorizationRequestHashV2,
  canonicalProviderWorkAuthorizationSchema,
  canonicalProviderWorkAuthorizationV2Schema,
  resolveCanonicalProviderOperation,
  resolveCanonicalProviderOperationV2,
  type CanonicalProviderWorkAuthorization,
  type CanonicalProviderWorkAuthorizationV2,
} from '../edit-architecture/canonical-provider-work-authority'
import { ApiError } from '../errors/api-error'
import {
  readPrivateProviderAttemptCostEvidenceForAttempt,
  readPrivateProviderAttemptCostEvidenceV2ForAttempt,
} from '../tool-cost-metering/private-provider-attempt-cost-evidence'
import {
  readPrivateWorkerResourceUsageCostEvidence,
  type PrivateWorkerResourceUsageCostEvidence,
} from '../tool-cost-metering/private-worker-resource-usage-cost-evidence'
import {
  CANONICAL_PROVIDER_ATTEMPT_CONSUMER_CONTEXT_VERSION,
  CANONICAL_PROVIDER_ATTEMPT_CONSUMER_RECEIPT_VERSION,
  CANONICAL_PROVIDER_PRIVATE_OUTPUT_SET_VERSION,
  canonicalProviderAttemptConsumerReceiptSchema,
  type CanonicalProviderAttemptConsumerReceipt,
} from '../validation/canonical-provider-attempt-consumer-receipt-schemas'
import type {
  CanonicalPrivateProviderDispatchTerminal,
  CanonicalPrivateProviderDispatchTerminalV2,
} from
  '../validation/canonical-private-provider-dispatch-schemas'
import type { CanonicalPrivatePackageWorkQueueEntry } from
  '../validation/canonical-private-package-work-queue-schemas'
import {
  readVerifiedPrivateCanonicalProviderCandidate,
  readVerifiedPrivateCanonicalProviderCandidateSetV2,
} from './private-canonical-provider-candidate-store'
import {
  readPrivateCanonicalProviderDispatchAggregate,
} from './private-canonical-provider-dispatch-store'
import {
  readPrivateCanonicalPackageWorkQueue,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export interface ProjectCanonicalPrivateProviderAttemptConsumerReceiptInput {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  authorization: CanonicalProviderWorkAuthorization
  projectedAt: string
}

export interface ProjectCanonicalPrivateProviderAttemptConsumerReceiptV2Input {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  authorization: CanonicalProviderWorkAuthorizationV2
  projectedAt: string
}

/**
 * Reads and verifies the canonical package queue, one-use provider dispatch,
 * terminal cost, observed worker resource, and private output stores before
 * returning a compact server-only receipt. Caller-supplied outcome, cost,
 * request count, output, and readiness claims are deliberately impossible.
 */
export async function projectCanonicalPrivateProviderAttemptConsumerReceipt(
  input: ProjectCanonicalPrivateProviderAttemptConsumerReceiptInput,
): Promise<CanonicalProviderAttemptConsumerReceipt> {
  const projectedAt = canonicalTimestamp(input.projectedAt)
  const authorization = verifyHistoricalAuthorization(input)
  const profile = resolveCanonicalProviderOperation(authorization.operationId)
  const lifecyclePolicy = resolveCanonicalProviderLifecyclePolicy(
    authorization.operationId,
  )
  const queueAggregate = await readPrivateCanonicalPackageWorkQueue({
    scope: input.scope,
    definition: input.queueDefinition,
  })
  const dispatchAggregate = await readPrivateCanonicalProviderDispatchAggregate({
    scope: input.scope,
  })
  if (!queueAggregate || !dispatchAggregate) {
    throw notReady('Canonical provider queue or dispatch evidence is unavailable.')
  }
  const queueEntry = queueAggregate.entries.find((candidate) =>
    candidate.definition.jobId === authorization.queueJobId)
  const dispatchMatches = dispatchAggregate.entries.filter((candidate) =>
    candidate.grant.authorizationHash === authorization.authorityHash)
  if (!queueEntry || dispatchMatches.length !== 1) {
    throw invalid('Provider receipt requires one exact queue and dispatch entry.')
  }
  const dispatchEntry = dispatchMatches[0]!
  const attempt = dispatchEntry.attempt
  const terminal = dispatchEntry.terminalHistory.at(-1)
  const queueAttempt = queueEntry.providerExecutionAttempt
  if (!attempt || !terminal || !queueAttempt) {
    throw notReady('Provider receipt requires one terminal canonical attempt.')
  }
  if (
    dispatchEntry.grant.schemaVersion !==
      'canonical-private-provider-dispatch-grant-v1' ||
    terminal.schemaVersion !==
      'canonical-private-provider-dispatch-terminal-v1'
  ) {
    throw invalid(
      'Provider receipt V1 cannot reinterpret forward multi-output source evidence.',
    )
  }
  if (
    Date.parse(projectedAt) < Date.parse(terminal.completedAt) ||
    Date.parse(projectedAt) < Date.parse(queueEntry.updatedAt)
  ) throw invalid('Provider receipt cannot predate its terminal source evidence.')
  const authorizationRequestHash = canonicalProviderWorkAuthorizationRequestHash(
    authorization,
  )
  if (
    dispatchEntry.grant.authorizationRequestHash !== authorizationRequestHash ||
    dispatchEntry.grant.immutableGrantHash.length !== 64 ||
    dispatchEntry.grant.operationId !== authorization.operationId ||
    dispatchEntry.grant.providerRouteId !== authorization.providerRouteId ||
    dispatchEntry.grant.providerModelId !== authorization.providerModelId ||
    dispatchEntry.grant.queueJobDefinitionHash !==
      authorization.queueJobDefinitionHash ||
    dispatchEntry.grant.queueClaimId !== attempt.queueClaimId ||
    dispatchEntry.grant.queueClaimHash !== attempt.queueClaimHash ||
    dispatchEntry.grant.queueClaimDeliveryAttempt !== attempt.queueClaimDeliveryAttempt ||
    queueAttempt.authorizationHash !== authorization.authorityHash ||
    queueAttempt.providerDispatchGrantId !== dispatchEntry.grant.grantId ||
    queueAttempt.providerDispatchGrantHash !==
      dispatchEntry.grant.immutableGrantHash ||
    queueAttempt.dispatchAttemptId !== attempt.dispatchAttemptId ||
    queueAttempt.dispatchAttemptHash !== attempt.attemptHash ||
    queueAttempt.claimId !== attempt.queueClaimId ||
    queueAttempt.claimHash !== attempt.queueClaimHash ||
    queueAttempt.deliveryAttempt !== attempt.queueClaimDeliveryAttempt ||
    queueAttempt.terminalHash !== terminal.terminalHash ||
    queueAttempt.attemptInternalCostEvidenceHash !== terminal.costEvidenceHash ||
    queueAttempt.providerTerminalState !== terminal.state ||
    queueAttempt.terminalAt !== terminal.completedAt
  ) throw invalid('Provider queue, dispatch, and terminal attempt lineage changed.')
  assertQueueTerminalState(queueEntry, terminal)

  const providerCost = await readPrivateProviderAttemptCostEvidenceForAttempt({
    localStorageRoot: input.scope.localStorageRoot,
    authorization,
    claimId: attempt.queueClaimId,
    claimHash: attempt.queueClaimHash,
    deliveryAttempt: attempt.queueClaimDeliveryAttempt,
    dispatchAttemptId: attempt.dispatchAttemptId,
    evidenceHash: terminal.costEvidenceHash,
  })
  assertProviderCostTerminalBinding(providerCost, terminal)

  const workerUsage = await readPrivateWorkerResourceUsageCostEvidence({
    localStorageRoot: input.scope.localStorageRoot,
    ownerUserId: authorization.ownerUserId,
    workspaceId: authorization.workspaceId,
    projectId: authorization.projectId,
    executionAttemptId: attempt.dispatchAttemptId,
  })
  if (!workerUsage) {
    throw notReady('Observed provider worker resource evidence is required.')
  }
  const approvedWorkItem = input.executionPackage.approvedWorkItems.find((candidate) =>
    candidate.id === authorization.approvedWorkItemId)
  if (!approvedWorkItem) throw invalid('Approved provider work item disappeared.')
  const approvedWorkItemHash = sha256AuthorityValue(approvedWorkItem)
  assertWorkerUsageBinding({
    usage: workerUsage,
    authorization,
    profile,
    grantId: dispatchEntry.grant.grantId,
    grantHash: dispatchEntry.grant.immutableGrantHash,
    attemptId: attempt.dispatchAttemptId,
    claimId: attempt.queueClaimId,
    claimHash: attempt.queueClaimHash,
    deliveryAttempt: attempt.queueClaimDeliveryAttempt,
    approvedWorkItemHash,
    terminal,
  })

  const successful = isSuccessfulTerminal(terminal.state)
  const verifiedOutput = terminal.privateOutput
    ? await readVerifiedPrivateCanonicalProviderCandidate({
        localStorageRoot: input.scope.localStorageRoot,
        authorization,
        dispatchAttempt: attempt,
        output: terminal.privateOutput,
      })
    : null
  if (successful !== (verifiedOutput !== null)) {
    throw invalid('Provider terminal and private output readback disagree.')
  }
  assertWorkerOutputBinding(workerUsage, verifiedOutput, terminal)

  const observedGenerationSubmissions = attempt.providerRequestStarted
    ? terminal.providerRequestCount
    : 0
  const observedTransport = {
    privateInputUploadCount: 0,
    generationSubmissionCount: observedGenerationSubmissions,
    statusReadCount: 0,
    resultReadCount: 0,
    binaryDownloadCount: 0,
    cancellationCount: 0,
    totalLifecycleHttpRequestCount: observedGenerationSubmissions,
  }
  const identity = {
    ownerUserId: authorization.ownerUserId,
    workspaceId: authorization.workspaceId,
    projectId: authorization.projectId,
    editSessionId: authorization.editSessionId,
    approvedPlanSnapshotId: authorization.approvedPlanSnapshotId,
    approvedPlanSnapshotHash: authorization.snapshotHash,
    packageRecordId: authorization.packageRecordId,
    packageHash: authorization.packageHash,
    workGraphHash: authorization.workGraphHash,
    approvedWorkItemId: authorization.approvedWorkItemId,
    approvedWorkItemHash,
    queueDefinitionHash: authorization.queueDefinitionHash,
    queueJobId: authorization.queueJobId,
    queueJobDefinitionHash: authorization.queueJobDefinitionHash,
    placementHash: authorization.placementHash,
    authorizationHash: authorization.authorityHash,
    authorizationRequestHash,
    sourceRequestId: authorization.sourceRequestId,
    sourceRequestDigest: authorization.sourceRequestDigest,
    providerRequestPayloadDigest: authorization.providerRequestPayloadDigest,
    projectDataPolicyDigest: authorization.projectDataPolicyDigest,
    providerAccountPolicyDigest: authorization.providerAccountPolicyDigest,
    idempotencyKeyHash: authorization.idempotencyKeyHash,
  }
  const consumerContextPayload = {
    domain: 'reeditpro:canonical-provider-attempt-consumer-context:v1',
    ownerUserId: authorization.ownerUserId,
    workspaceId: authorization.workspaceId,
    projectId: authorization.projectId,
    editSessionId: authorization.editSessionId,
    approvedPlanSnapshotId: authorization.approvedPlanSnapshotId,
    packageRecordId: authorization.packageRecordId,
    approvedWorkItemId: authorization.approvedWorkItemId,
    queueJobId: authorization.queueJobId,
    operationId: authorization.operationId,
    expectedOutputId: authorization.expectedOutputId,
  }
  const consumerContextDigest = sha256AuthorityValue(consumerContextPayload)
  const receiptIdentityHash = sha256AuthorityValue({
    domain: 'reeditpro:canonical-provider-attempt-consumer-receipt:v2',
    identity,
    consumerContextDigest,
    dispatchAttemptHash: attempt.attemptHash,
    terminalHash: terminal.terminalHash,
    workerResourceEvidenceHash: workerUsage.evidenceHash,
  })
  const providerCostMicros = providerCost.provider.actualInternalCostMicros
  const workerInfrastructureCostMicros =
    workerUsage.infrastructureCost.actualInternalCostMicros
  const projectedPrivateOutput = verifiedOutput
    ? {
        outputId: verifiedOutput.output.outputId,
        role: verifiedOutput.output.role,
        assetId: verifiedOutput.output.assetId,
        assetVersionId: verifiedOutput.output.assetVersionId,
        privateObjectIdentityHash:
          verifiedOutput.output.privateObjectIdentityHash,
        contentSha256: verifiedOutput.output.contentSha256,
        byteLength: verifiedOutput.output.byteLength,
        mimeType: verifiedOutput.output.mimeType,
        artifactEvidenceDigest: verifiedOutput.output.artifactEvidenceDigest,
        storageEvidenceHash: verifiedOutput.storageEvidenceHash,
        sourceReadbackEvidenceHash: verifiedOutput.sourceReadbackEvidenceHash,
        providerGenerated: verifiedOutput.providerGenerated,
        createOnly: true as const,
        checksumReadbackVerified: true as const,
        providerUrlPersisted: false as const,
        localPathProjected: false as const,
      }
    : null
  const privateOutputs = projectedPrivateOutput ? [projectedPrivateOutput] : []
  const payload = {
    schemaVersion: CANONICAL_PROVIDER_ATTEMPT_CONSUMER_RECEIPT_VERSION,
    source: 'verified_private_canonical_provider_attempt_stores' as const,
    receiptId: `provider_receipt_${receiptIdentityHash.slice(0, 48)}`,
    evidenceClass: providerCost.evidenceClass,
    promotionClass: providerCost.evidenceClass === 'private_injected_nonprovider_test'
      ? 'non_promotable_private_injected' as const
      : 'unreleased_runtime_not_production' as const,
    identity,
    consumerContext: {
      schemaVersion: CANONICAL_PROVIDER_ATTEMPT_CONSUMER_CONTEXT_VERSION,
      contextClass: 'source_verified_exact_edit_approved_work_item' as const,
      consumerContextId:
        `provider_consumer_context_${consumerContextDigest.slice(0, 40)}`,
      consumerContextDigest,
      derivation:
        'owner_workspace_project_edit_snapshot_package_work_item_job_operation_output' as const,
      productionBindingIncluded: false as const,
      callerAssertedProductionIdAccepted: false as const,
      consumerOwnedProductionBindingRequired: true as const,
    },
    provider: {
      operationId: authorization.operationId,
      operationProfileHash: authorization.operationProfileHash,
      intent: authorization.intent,
      providerBoundaryProfileId: authorization.providerBoundaryProfileId,
      providerRouteId: authorization.providerRouteId,
      providerModelId: authorization.providerModelId,
      lifecyclePolicyVersion: lifecyclePolicy.schemaVersion,
      lifecyclePolicyHash: lifecyclePolicy.policyHash,
    },
    timing: {
      startedAt: queueAttempt.startedAt,
      completedAt: terminal.completedAt,
    },
    requestAccounting: {
      legacyV1ProviderRequestCount: terminal.providerRequestCount,
      legacyV1MaximumProviderRequests: 1 as const,
      legacyV1Semantic:
        'generation_submission_count_not_total_http_requests' as const,
      accountedGenerationSubmissionCount: terminal.providerRequestCount,
      injectedSimulationGenerationSubmissionCount:
        authorization.authorityClass === 'private_injected_nonprovider_test'
          ? terminal.providerRequestCount
          : 0,
      observedTransport,
      ceilings: lifecyclePolicy.requestCeilings,
      continuationRequestsBelongToSameAttempt: true as const,
      unknownOutcomeBlocksNewSubmission: true as const,
    },
    queue: {
      aggregateHash: queueAggregate.aggregateHash,
      entryHash: queueEntry.entryHash,
      state: queueEntry.state,
      claimId: attempt.queueClaimId,
      claimHash: attempt.queueClaimHash,
      queueAttemptId: attempt.queueClaimId,
      leaseId: attempt.queueClaimId,
      leaseHash: attempt.queueClaimHash,
      queueAttemptAndLeaseSemantic:
        'canonical_provider_queue_claim_is_attempt_and_lease' as const,
      deliveryAttempt: attempt.queueClaimDeliveryAttempt,
      claimExpiresAt: dispatchEntry.grant.queueClaimExpiresAt,
      providerExecutionFenceHash: queueAttempt.fenceHash,
      providerExecutionState: queueAttempt.state,
      terminalQueueCompletion: successful,
      unknownOutcomeReconciled: terminal.state.startsWith('unknown_reconciled_'),
    },
    dispatch: {
      aggregateHash: dispatchAggregate.aggregateHash,
      grantId: dispatchEntry.grant.grantId,
      immutableGrantHash: dispatchEntry.grant.immutableGrantHash,
      dispatchAttemptId: attempt.dispatchAttemptId,
      dispatchAttemptHash: attempt.attemptHash,
      consumptionCount: 1 as const,
      providerRequestStarted: attempt.providerRequestStarted,
      terminalId: terminal.terminalId,
      terminalHash: terminal.terminalHash,
      terminalSequence: terminal.sequence,
      terminalState: terminal.state,
      retryCount: terminal.retryCount,
      fallbackCount: terminal.fallbackCount,
      sanitizedFailureCode: terminal.sanitizedFailureCode,
    },
    privateOutput: projectedPrivateOutput,
    privateOutputs,
    outputSet: {
      schemaVersion: CANONICAL_PROVIDER_PRIVATE_OUTPUT_SET_VERSION,
      sourceAuthorityClass: 'canonical_v1_zero_or_one_source' as const,
      outputCount: privateOutputs.length,
      outputSetDigest: sha256AuthorityValue({
        domain: 'reeditpro:canonical-provider-private-output-set:v1',
        dispatchAttemptHash: attempt.attemptHash,
        terminalHash: terminal.terminalHash,
        outputs: privateOutputs,
      }),
      multiOutputProviderOperationAdmitted: false,
    },
    internalCost: {
      providerAttemptEvidenceHash: providerCost.evidenceHash,
      providerUsageEvidenceDigest: providerCost.provider.usageEvidenceDigest,
      providerRateCardDigest: providerCost.provider.rateCardDigest,
      providerCostMicros,
      providerCostReconciled: providerCost.provider.costReconciled,
      legacyProvisionalInfrastructureRateCardDigest:
        providerCost.infrastructure.rateCardDigest,
      legacyProvisionalInfrastructureCostMicros:
        providerCost.infrastructure.actualInternalCostMicros,
      legacyProvisionalTotalInternalCostMicros:
        providerCost.reconciliation.totalInternalProductionCostMicros,
      workerResourceEvidenceHash: workerUsage.evidenceHash,
      workerInfrastructureEvidenceDigest:
        workerUsage.resourceUsage.infrastructureEvidenceDigest,
      workerInfrastructureRateCardDigest:
        workerUsage.infrastructureCost.rateCardDigest,
      selectedInfrastructureRateCardDigest:
        workerUsage.infrastructureCost.rateCardDigest,
      observedWorkerInfrastructureCostMicros: workerInfrastructureCostMicros,
      selectedInfrastructureCostMicros: workerInfrastructureCostMicros,
      selectedTotalInternalCostMicros: providerCostMicros === null
        ? null
        : providerCostMicros + workerInfrastructureCostMicros,
      placeholderInfrastructureRate: true as const,
      infrastructureInvoiceReconciled: false as const,
      providerCostIncludedInWorkerEvidence: false as const,
      legacyProvisionalInfrastructureAddedToSelectedTotal: false as const,
      failedOrUnknownAttemptCostRetained: true as const,
      internalProductionCostOnly: true as const,
    },
    workerResourceUsage: {
      evidenceClass: workerUsage.evidenceClass,
      attemptIdentityHash: workerUsage.attemptIdentityHash,
      runtimeExecutionIdentityDigest:
        workerUsage.runtime.runtimeExecutionIdentityDigest,
      containerIdentityDigest: workerUsage.runtime.containerIdentityDigest,
      wallTimeMilliseconds: workerUsage.resourceUsage.wallTimeMilliseconds,
      observedCpuMicroseconds: workerUsage.resourceUsage.observedCpuMicroseconds,
      observedPeakMemoryBytes: workerUsage.resourceUsage.observedPeakMemoryBytes,
      observedGpuActiveMilliseconds:
        workerUsage.resourceUsage.observedGpuActiveMilliseconds,
      networkEgressBytes: workerUsage.resourceUsage.networkEgressBytes,
      outcomeState: workerUsage.outcome.state,
    },
    boundaries: {
      hashesAndSafeIdentityOnly: true as const,
      rawCredentialIncluded: false as const,
      rawPromptOrRequestBodyIncluded: false as const,
      providerUrlIncluded: false as const,
      credentialValueLogged: false as const,
      requestBodyPersistedInQueue: false as const,
      callerSelectedExecutableAllowed: false as const,
      callerSelectedProviderRouteAllowed: false as const,
      browserAuthorityIncluded: false as const,
      commercialAuthorityIncluded: false as const,
      providerTransportActivated: false as const,
      distributedPersistenceProven: false as const,
      sourceVerified: true as const,
      canonicalBackendVerifiedRuntime: false as const,
      promotionAuthorized: false as const,
      productionReady: false as const,
    },
    projectedAt,
  }
  return canonicalProviderAttemptConsumerReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

/**
 * Forward-compatible projection for one canonical provider attempt that owns
 * an ordered private output set. This still reads every claim, dispatch,
 * terminal, cost, resource, and object identity from canonical server stores;
 * it does not accept caller-authored outcome or readiness evidence.
 */
export async function projectCanonicalPrivateProviderAttemptConsumerReceiptV2(
  input: ProjectCanonicalPrivateProviderAttemptConsumerReceiptV2Input,
): Promise<CanonicalProviderAttemptConsumerReceipt> {
  const projectedAt = canonicalTimestamp(input.projectedAt)
  const authorization = verifyHistoricalAuthorizationV2(input)
  const profile = resolveCanonicalProviderOperationV2(authorization.operationId)
  const lifecyclePolicy = resolveCanonicalProviderLifecyclePolicy(
    authorization.operationId,
  )
  const queueAggregate = await readPrivateCanonicalPackageWorkQueue({
    scope: input.scope,
    definition: input.queueDefinition,
  })
  const dispatchAggregate = await readPrivateCanonicalProviderDispatchAggregate({
    scope: input.scope,
  })
  if (!queueAggregate || !dispatchAggregate) {
    throw notReady('Canonical provider V2 queue or dispatch evidence is unavailable.')
  }
  const queueEntry = queueAggregate.entries.find((candidate) =>
    candidate.definition.jobId === authorization.queueJobId)
  const dispatchMatches = dispatchAggregate.entries.filter((candidate) =>
    candidate.grant.authorizationHash === authorization.authorityHash)
  if (!queueEntry || dispatchMatches.length !== 1) {
    throw invalid('Provider V2 receipt requires one exact queue and dispatch entry.')
  }
  const dispatchEntry = dispatchMatches[0]!
  const attempt = dispatchEntry.attempt
  const terminal = dispatchEntry.terminalHistory.at(-1)
  const queueAttempt = queueEntry.providerExecutionAttempt
  if (!attempt || !terminal || !queueAttempt) {
    throw notReady('Provider V2 receipt requires one terminal canonical attempt.')
  }
  if (
    dispatchEntry.grant.schemaVersion !==
      'canonical-private-provider-dispatch-grant-v2' ||
    terminal.schemaVersion !==
      'canonical-private-provider-dispatch-terminal-v2'
  ) {
    throw invalid('Provider V2 receipt cannot reinterpret historical V1 source evidence.')
  }
  if (
    Date.parse(projectedAt) < Date.parse(terminal.completedAt) ||
    Date.parse(projectedAt) < Date.parse(queueEntry.updatedAt)
  ) throw invalid('Provider V2 receipt cannot predate terminal source evidence.')

  const authorizationRequestHash = canonicalProviderWorkAuthorizationRequestHashV2(
    authorization,
  )
  if (
    dispatchEntry.grant.authorizationRequestHash !== authorizationRequestHash ||
    dispatchEntry.grant.immutableGrantHash.length !== 64 ||
    dispatchEntry.grant.operationId !== authorization.operationId ||
    dispatchEntry.grant.providerRouteId !== authorization.providerRouteId ||
    dispatchEntry.grant.providerModelId !== authorization.providerModelId ||
    dispatchEntry.grant.expectedOutputSetHash !==
      authorization.expectedOutputSetHash ||
    JSON.stringify(dispatchEntry.grant.expectedOutputIds) !==
      JSON.stringify(authorization.expectedOutputIds) ||
    dispatchEntry.grant.queueJobDefinitionHash !==
      authorization.queueJobDefinitionHash ||
    dispatchEntry.grant.queueClaimId !== attempt.queueClaimId ||
    dispatchEntry.grant.queueClaimHash !== attempt.queueClaimHash ||
    dispatchEntry.grant.queueClaimDeliveryAttempt !==
      attempt.queueClaimDeliveryAttempt ||
    queueAttempt.authorizationHash !== authorization.authorityHash ||
    queueAttempt.providerDispatchGrantId !== dispatchEntry.grant.grantId ||
    queueAttempt.providerDispatchGrantHash !==
      dispatchEntry.grant.immutableGrantHash ||
    queueAttempt.dispatchAttemptId !== attempt.dispatchAttemptId ||
    queueAttempt.dispatchAttemptHash !== attempt.attemptHash ||
    queueAttempt.claimId !== attempt.queueClaimId ||
    queueAttempt.claimHash !== attempt.queueClaimHash ||
    queueAttempt.deliveryAttempt !== attempt.queueClaimDeliveryAttempt ||
    queueAttempt.terminalHash !== terminal.terminalHash ||
    queueAttempt.attemptInternalCostEvidenceHash !== terminal.costEvidenceHash ||
    queueAttempt.providerTerminalState !== terminal.state ||
    queueAttempt.terminalAt !== terminal.completedAt
  ) throw invalid('Provider V2 queue, dispatch, and terminal lineage changed.')
  assertQueueTerminalStateV2(queueEntry, terminal)

  const providerCost = await readPrivateProviderAttemptCostEvidenceV2ForAttempt({
    localStorageRoot: input.scope.localStorageRoot,
    authorization,
    claimId: attempt.queueClaimId,
    claimHash: attempt.queueClaimHash,
    deliveryAttempt: attempt.queueClaimDeliveryAttempt,
    dispatchAttemptId: attempt.dispatchAttemptId,
    evidenceHash: terminal.costEvidenceHash,
  })
  assertProviderCostTerminalBindingV2(providerCost, terminal)

  const workerUsage = await readPrivateWorkerResourceUsageCostEvidence({
    localStorageRoot: input.scope.localStorageRoot,
    ownerUserId: authorization.ownerUserId,
    workspaceId: authorization.workspaceId,
    projectId: authorization.projectId,
    executionAttemptId: attempt.dispatchAttemptId,
  })
  if (!workerUsage) {
    throw notReady('Observed provider V2 worker resource evidence is required.')
  }
  const approvedWorkItem = input.executionPackage.approvedWorkItems.find((candidate) =>
    candidate.id === authorization.approvedWorkItemId)
  if (!approvedWorkItem) throw invalid('Approved provider V2 work item disappeared.')
  const approvedWorkItemHash = sha256AuthorityValue(approvedWorkItem)
  assertWorkerUsageBinding({
    usage: workerUsage,
    authorization,
    profile,
    grantId: dispatchEntry.grant.grantId,
    grantHash: dispatchEntry.grant.immutableGrantHash,
    attemptId: attempt.dispatchAttemptId,
    claimId: attempt.queueClaimId,
    claimHash: attempt.queueClaimHash,
    deliveryAttempt: attempt.queueClaimDeliveryAttempt,
    approvedWorkItemHash,
    terminal,
  })

  const successful = isSuccessfulTerminalV2(terminal.state)
  const verifiedOutputs = terminal.privateOutputs.length === 2
    ? await readVerifiedPrivateCanonicalProviderCandidateSetV2({
        localStorageRoot: input.scope.localStorageRoot,
        authorization,
        dispatchAttempt: attempt,
        outputs: [terminal.privateOutputs[0]!, terminal.privateOutputs[1]!],
        outputSetDigest: terminal.outputSetDigest,
      })
    : [] as const
  if (successful !== (verifiedOutputs.length === 2)) {
    throw invalid('Provider V2 terminal and private output-set readback disagree.')
  }
  assertWorkerOutputBindingV2(workerUsage, verifiedOutputs, terminal)

  const observedGenerationSubmissions = attempt.providerRequestStarted
    ? terminal.providerRequestCount
    : 0
  const observedTransport = {
    privateInputUploadCount: 0,
    generationSubmissionCount: observedGenerationSubmissions,
    statusReadCount: 0,
    resultReadCount: 0,
    binaryDownloadCount: 0,
    cancellationCount: 0,
    totalLifecycleHttpRequestCount: observedGenerationSubmissions,
  }
  const identity = {
    ownerUserId: authorization.ownerUserId,
    workspaceId: authorization.workspaceId,
    projectId: authorization.projectId,
    editSessionId: authorization.editSessionId,
    approvedPlanSnapshotId: authorization.approvedPlanSnapshotId,
    approvedPlanSnapshotHash: authorization.snapshotHash,
    packageRecordId: authorization.packageRecordId,
    packageHash: authorization.packageHash,
    workGraphHash: authorization.workGraphHash,
    approvedWorkItemId: authorization.approvedWorkItemId,
    approvedWorkItemHash,
    queueDefinitionHash: authorization.queueDefinitionHash,
    queueJobId: authorization.queueJobId,
    queueJobDefinitionHash: authorization.queueJobDefinitionHash,
    placementHash: authorization.placementHash,
    authorizationHash: authorization.authorityHash,
    authorizationRequestHash,
    sourceRequestId: authorization.sourceRequestId,
    sourceRequestDigest: authorization.sourceRequestDigest,
    providerRequestPayloadDigest: authorization.providerRequestPayloadDigest,
    projectDataPolicyDigest: authorization.projectDataPolicyDigest,
    providerAccountPolicyDigest: authorization.providerAccountPolicyDigest,
    idempotencyKeyHash: authorization.idempotencyKeyHash,
  }
  const consumerContextPayload = {
    domain: 'reeditpro:canonical-provider-attempt-consumer-context:v2',
    ownerUserId: authorization.ownerUserId,
    workspaceId: authorization.workspaceId,
    projectId: authorization.projectId,
    editSessionId: authorization.editSessionId,
    approvedPlanSnapshotId: authorization.approvedPlanSnapshotId,
    packageRecordId: authorization.packageRecordId,
    approvedWorkItemId: authorization.approvedWorkItemId,
    queueJobId: authorization.queueJobId,
    operationId: authorization.operationId,
    expectedOutputIds: authorization.expectedOutputIds,
    expectedOutputSetHash: authorization.expectedOutputSetHash,
  }
  const consumerContextDigest = sha256AuthorityValue(consumerContextPayload)
  const receiptIdentityHash = sha256AuthorityValue({
    domain: 'reeditpro:canonical-provider-attempt-consumer-receipt:v2',
    identity,
    consumerContextDigest,
    dispatchAttemptHash: attempt.attemptHash,
    terminalHash: terminal.terminalHash,
    workerResourceEvidenceHash: workerUsage.evidenceHash,
    sourceOutputSetDigest: terminal.outputSetDigest,
  })
  const privateOutputs = verifiedOutputs.map((verifiedOutput) => ({
    outputId: verifiedOutput.output.outputId,
    role: verifiedOutput.output.role,
    assetId: verifiedOutput.output.assetId,
    assetVersionId: verifiedOutput.output.assetVersionId,
    privateObjectIdentityHash: verifiedOutput.output.privateObjectIdentityHash,
    contentSha256: verifiedOutput.output.contentSha256,
    byteLength: verifiedOutput.output.byteLength,
    mimeType: verifiedOutput.output.mimeType,
    artifactEvidenceDigest: verifiedOutput.output.artifactEvidenceDigest,
    storageEvidenceHash: verifiedOutput.storageEvidenceHash,
    sourceReadbackEvidenceHash: verifiedOutput.sourceReadbackEvidenceHash,
    providerGenerated: verifiedOutput.providerGenerated,
    createOnly: true as const,
    checksumReadbackVerified: true as const,
    providerUrlPersisted: false as const,
    localPathProjected: false as const,
  }))
  const providerCostMicros = providerCost.provider.actualInternalCostMicros
  const workerInfrastructureCostMicros =
    workerUsage.infrastructureCost.actualInternalCostMicros
  const payload = {
    schemaVersion: CANONICAL_PROVIDER_ATTEMPT_CONSUMER_RECEIPT_VERSION,
    source: 'verified_private_canonical_provider_attempt_stores' as const,
    receiptId: `provider_receipt_${receiptIdentityHash.slice(0, 48)}`,
    evidenceClass: providerCost.evidenceClass,
    promotionClass: 'non_promotable_private_injected' as const,
    identity,
    consumerContext: {
      schemaVersion: CANONICAL_PROVIDER_ATTEMPT_CONSUMER_CONTEXT_VERSION,
      contextClass: 'source_verified_exact_edit_approved_work_item' as const,
      consumerContextId:
        `provider_consumer_context_${consumerContextDigest.slice(0, 40)}`,
      consumerContextDigest,
      derivation:
        'owner_workspace_project_edit_snapshot_package_work_item_job_operation_output_set' as const,
      productionBindingIncluded: false as const,
      callerAssertedProductionIdAccepted: false as const,
      consumerOwnedProductionBindingRequired: true as const,
    },
    provider: {
      operationId: authorization.operationId,
      operationProfileHash: authorization.operationProfileHash,
      intent: authorization.intent,
      providerBoundaryProfileId: authorization.providerBoundaryProfileId,
      providerRouteId: authorization.providerRouteId,
      providerModelId: authorization.providerModelId,
      lifecyclePolicyVersion: lifecyclePolicy.schemaVersion,
      lifecyclePolicyHash: lifecyclePolicy.policyHash,
    },
    timing: {
      startedAt: queueAttempt.startedAt,
      completedAt: terminal.completedAt,
    },
    requestAccounting: {
      legacyV1ProviderRequestCount: terminal.providerRequestCount,
      legacyV1MaximumProviderRequests: 1 as const,
      legacyV1Semantic:
        'generation_submission_count_not_total_http_requests' as const,
      accountedGenerationSubmissionCount: terminal.providerRequestCount,
      injectedSimulationGenerationSubmissionCount: terminal.providerRequestCount,
      observedTransport,
      ceilings: lifecyclePolicy.requestCeilings,
      continuationRequestsBelongToSameAttempt: true as const,
      unknownOutcomeBlocksNewSubmission: true as const,
    },
    queue: {
      aggregateHash: queueAggregate.aggregateHash,
      entryHash: queueEntry.entryHash,
      state: queueEntry.state,
      claimId: attempt.queueClaimId,
      claimHash: attempt.queueClaimHash,
      queueAttemptId: attempt.queueClaimId,
      leaseId: attempt.queueClaimId,
      leaseHash: attempt.queueClaimHash,
      queueAttemptAndLeaseSemantic:
        'canonical_provider_queue_claim_is_attempt_and_lease' as const,
      deliveryAttempt: attempt.queueClaimDeliveryAttempt,
      claimExpiresAt: dispatchEntry.grant.queueClaimExpiresAt,
      providerExecutionFenceHash: queueAttempt.fenceHash,
      providerExecutionState: queueAttempt.state,
      terminalQueueCompletion: successful,
      unknownOutcomeReconciled: terminal.state.startsWith('unknown_reconciled_'),
    },
    dispatch: {
      aggregateHash: dispatchAggregate.aggregateHash,
      grantId: dispatchEntry.grant.grantId,
      immutableGrantHash: dispatchEntry.grant.immutableGrantHash,
      dispatchAttemptId: attempt.dispatchAttemptId,
      dispatchAttemptHash: attempt.attemptHash,
      consumptionCount: 1 as const,
      providerRequestStarted: attempt.providerRequestStarted,
      terminalId: terminal.terminalId,
      terminalHash: terminal.terminalHash,
      terminalSequence: terminal.sequence,
      terminalState: terminal.state,
      retryCount: terminal.retryCount,
      fallbackCount: terminal.fallbackCount,
      sanitizedFailureCode: terminal.sanitizedFailureCode,
    },
    privateOutput: privateOutputs[0] ?? null,
    privateOutputs,
    outputSet: {
      schemaVersion: CANONICAL_PROVIDER_PRIVATE_OUTPUT_SET_VERSION,
      sourceAuthorityClass: 'forward_multi_output_same_attempt_source' as const,
      outputCount: privateOutputs.length,
      outputSetDigest: terminal.outputSetDigest,
      multiOutputProviderOperationAdmitted: true,
    },
    internalCost: {
      providerAttemptEvidenceHash: providerCost.evidenceHash,
      providerUsageEvidenceDigest: providerCost.provider.usageEvidenceDigest,
      providerRateCardDigest: providerCost.provider.rateCardDigest,
      providerCostMicros,
      providerCostReconciled: providerCost.provider.costReconciled,
      legacyProvisionalInfrastructureRateCardDigest:
        providerCost.infrastructure.rateCardDigest,
      legacyProvisionalInfrastructureCostMicros:
        providerCost.infrastructure.actualInternalCostMicros,
      legacyProvisionalTotalInternalCostMicros:
        providerCost.reconciliation.totalInternalProductionCostMicros,
      workerResourceEvidenceHash: workerUsage.evidenceHash,
      workerInfrastructureEvidenceDigest:
        workerUsage.resourceUsage.infrastructureEvidenceDigest,
      workerInfrastructureRateCardDigest:
        workerUsage.infrastructureCost.rateCardDigest,
      selectedInfrastructureRateCardDigest:
        workerUsage.infrastructureCost.rateCardDigest,
      observedWorkerInfrastructureCostMicros: workerInfrastructureCostMicros,
      selectedInfrastructureCostMicros: workerInfrastructureCostMicros,
      selectedTotalInternalCostMicros: providerCostMicros === null
        ? null
        : providerCostMicros + workerInfrastructureCostMicros,
      placeholderInfrastructureRate: true as const,
      infrastructureInvoiceReconciled: false as const,
      providerCostIncludedInWorkerEvidence: false as const,
      legacyProvisionalInfrastructureAddedToSelectedTotal: false as const,
      failedOrUnknownAttemptCostRetained: true as const,
      internalProductionCostOnly: true as const,
    },
    workerResourceUsage: {
      evidenceClass: workerUsage.evidenceClass,
      attemptIdentityHash: workerUsage.attemptIdentityHash,
      runtimeExecutionIdentityDigest:
        workerUsage.runtime.runtimeExecutionIdentityDigest,
      containerIdentityDigest: workerUsage.runtime.containerIdentityDigest,
      wallTimeMilliseconds: workerUsage.resourceUsage.wallTimeMilliseconds,
      observedCpuMicroseconds: workerUsage.resourceUsage.observedCpuMicroseconds,
      observedPeakMemoryBytes: workerUsage.resourceUsage.observedPeakMemoryBytes,
      observedGpuActiveMilliseconds:
        workerUsage.resourceUsage.observedGpuActiveMilliseconds,
      networkEgressBytes: workerUsage.resourceUsage.networkEgressBytes,
      outcomeState: workerUsage.outcome.state,
    },
    boundaries: {
      hashesAndSafeIdentityOnly: true as const,
      rawCredentialIncluded: false as const,
      rawPromptOrRequestBodyIncluded: false as const,
      providerUrlIncluded: false as const,
      credentialValueLogged: false as const,
      requestBodyPersistedInQueue: false as const,
      callerSelectedExecutableAllowed: false as const,
      callerSelectedProviderRouteAllowed: false as const,
      browserAuthorityIncluded: false as const,
      commercialAuthorityIncluded: false as const,
      providerTransportActivated: false as const,
      distributedPersistenceProven: false as const,
      sourceVerified: true as const,
      canonicalBackendVerifiedRuntime: false as const,
      promotionAuthorized: false as const,
      productionReady: false as const,
    },
    projectedAt,
  }
  return canonicalProviderAttemptConsumerReceiptSchema.parse({
    ...payload,
    receiptHash: sha256AuthorityValue(payload),
  })
}

function verifyHistoricalAuthorization(
  input: ProjectCanonicalPrivateProviderAttemptConsumerReceiptInput,
): CanonicalProviderWorkAuthorization {
  const authorization = canonicalProviderWorkAuthorizationSchema.parse(
    input.authorization,
  )
  const { authorityHash, ...authorityPayload } = authorization
  const profile = resolveCanonicalProviderOperation(authorization.operationId)
  const queueJob = input.queueDefinition.jobs.find((candidate) =>
    candidate.jobId === authorization.queueJobId)
  const packageJob = input.executionPackage.jobs.find((candidate) =>
    candidate.id === authorization.queueJobId)
  const workItem = input.executionPackage.approvedWorkItems.find((candidate) =>
    candidate.id === authorization.approvedWorkItemId)
  const expectedOutput = workItem?.expectedOutputs.find((candidate) =>
    candidate.outputKey === authorization.expectedOutputId)
  if (
    authorityHash !== sha256AuthorityValue(authorityPayload) ||
    !queueJob || !packageJob || !workItem || !expectedOutput ||
    authorization.ownerUserId !== input.scope.ownerUserId ||
    authorization.workspaceId !== input.scope.workspaceId ||
    authorization.projectId !== input.scope.projectId ||
    authorization.editSessionId !== input.scope.editSessionId ||
    authorization.packageRecordId !== input.scope.packageRecordId ||
    authorization.approvedPlanSnapshotId !== input.scope.approvedPlanSnapshotId ||
    input.executionPackage.createdByUserId !== authorization.ownerUserId ||
    input.executionPackage.workspaceId !== authorization.workspaceId ||
    input.executionPackage.projectId !== authorization.projectId ||
    input.executionPackage.editSessionId !== authorization.editSessionId ||
    input.executionPackage.packageRecordId !== authorization.packageRecordId ||
    input.executionPackage.approvedPlanSnapshotId !==
      authorization.approvedPlanSnapshotId ||
    authorization.packageHash !== input.executionPackage.packageHash ||
    authorization.snapshotHash !== input.executionPackage.snapshotHash ||
    authorization.workGraphHash !== input.executionPackage.workGraphHash ||
    authorization.queueDefinitionHash !== input.queueDefinition.definitionHash ||
    input.queueDefinition.identity.workspaceId !== authorization.workspaceId ||
    input.queueDefinition.identity.projectId !== authorization.projectId ||
    input.queueDefinition.identity.editSessionId !== authorization.editSessionId ||
    input.queueDefinition.identity.packageRecordId !== authorization.packageRecordId ||
    input.queueDefinition.identity.approvedPlanSnapshotId !==
      authorization.approvedPlanSnapshotId ||
    input.queueDefinition.identity.packageHash !== authorization.packageHash ||
    input.queueDefinition.identity.snapshotHash !== authorization.snapshotHash ||
    input.queueDefinition.identity.workGraphHash !== authorization.workGraphHash ||
    authorization.queueJobDefinitionHash !== queueJob.definitionHash ||
    authorization.placementHash !== queueJob.placementHash ||
    authorization.approvedWorkItemId !== queueJob.approvedWorkItemId ||
    packageJob.approvedWorkItemId !== workItem.id ||
    packageJob.expectedAssetIds.length !== 1 ||
    packageJob.expectedAssetIds[0] !== authorization.expectedOutputId ||
    expectedOutput.contentType !== profile.expectedOutput.contentType ||
    authorization.operationProfileHash !== profile.profileHash ||
    authorization.providerRouteId !== profile.providerRouteId ||
    authorization.providerModelId !== profile.providerModelId ||
    authorization.requestPolicyHash !== sha256AuthorityValue(profile.requestPolicy) ||
    authorization.costPolicyHash !== sha256AuthorityValue(profile.costPolicy)
  ) throw invalid('Historical provider authorization or approved package changed.')
  return authorization
}

function verifyHistoricalAuthorizationV2(
  input: ProjectCanonicalPrivateProviderAttemptConsumerReceiptV2Input,
): CanonicalProviderWorkAuthorizationV2 {
  const authorization = canonicalProviderWorkAuthorizationV2Schema.parse(
    input.authorization,
  )
  const { authorityHash, ...authorityPayload } = authorization
  const profile = resolveCanonicalProviderOperationV2(authorization.operationId)
  const queueJob = input.queueDefinition.jobs.find((candidate) =>
    candidate.jobId === authorization.queueJobId)
  const packageJob = input.executionPackage.jobs.find((candidate) =>
    candidate.id === authorization.queueJobId)
  const workItem = input.executionPackage.approvedWorkItems.find((candidate) =>
    candidate.id === authorization.approvedWorkItemId)
  const expectedOutputs = authorization.expectedOutputIds.map((outputId) =>
    workItem?.expectedOutputs.find((candidate) =>
      candidate.outputKey === outputId))
  const outputContractsMatch = expectedOutputs.every((output, index) => {
    const expected = profile.expectedOutputs[index]
    return output !== undefined && expected !== undefined &&
      output.outputKey === authorization.expectedOutputKeys[index] &&
      output.artifactType === expected.artifactType &&
      output.assetRole === expected.assetRole &&
      output.contentType === expected.contentType && output.required
  })
  const expectedOutputSetHash = sha256AuthorityValue({
    domain: 'reeditpro:canonical-provider-expected-output-set:v2',
    operationProfileHash: profile.profileHash,
    outputs: expectedOutputs,
  })
  if (
    authorityHash !== sha256AuthorityValue(authorityPayload) ||
    !queueJob || !packageJob || !workItem ||
    expectedOutputs.some((value) => !value) || !outputContractsMatch ||
    authorization.ownerUserId !== input.scope.ownerUserId ||
    authorization.workspaceId !== input.scope.workspaceId ||
    authorization.projectId !== input.scope.projectId ||
    authorization.editSessionId !== input.scope.editSessionId ||
    authorization.packageRecordId !== input.scope.packageRecordId ||
    authorization.approvedPlanSnapshotId !== input.scope.approvedPlanSnapshotId ||
    input.executionPackage.createdByUserId !== authorization.ownerUserId ||
    input.executionPackage.workspaceId !== authorization.workspaceId ||
    input.executionPackage.projectId !== authorization.projectId ||
    input.executionPackage.editSessionId !== authorization.editSessionId ||
    input.executionPackage.packageRecordId !== authorization.packageRecordId ||
    input.executionPackage.approvedPlanSnapshotId !==
      authorization.approvedPlanSnapshotId ||
    input.executionPackage.reservationId !== authorization.reservation.reservationId ||
    input.executionPackage.reservationStatus !== 'reserved' ||
    input.executionPackage.remainingReservedCredits !==
      authorization.reservation.remainingReservedCredits ||
    authorization.packageHash !== input.executionPackage.packageHash ||
    authorization.snapshotHash !== input.executionPackage.snapshotHash ||
    authorization.workGraphHash !== input.executionPackage.workGraphHash ||
    authorization.queueDefinitionHash !== input.queueDefinition.definitionHash ||
    input.queueDefinition.identity.workspaceId !== authorization.workspaceId ||
    input.queueDefinition.identity.projectId !== authorization.projectId ||
    input.queueDefinition.identity.editSessionId !== authorization.editSessionId ||
    input.queueDefinition.identity.packageRecordId !== authorization.packageRecordId ||
    input.queueDefinition.identity.approvedPlanSnapshotId !==
      authorization.approvedPlanSnapshotId ||
    input.queueDefinition.identity.packageHash !== authorization.packageHash ||
    input.queueDefinition.identity.snapshotHash !== authorization.snapshotHash ||
    input.queueDefinition.identity.workGraphHash !== authorization.workGraphHash ||
    authorization.queueJobDefinitionHash !== queueJob.definitionHash ||
    authorization.placementHash !== queueJob.placementHash ||
    authorization.approvedWorkItemId !== queueJob.approvedWorkItemId ||
    authorization.workItemKey !== queueJob.workItemKey ||
    queueJob.providerExecutionMode !== 'primary' ||
    queueJob.privateExecutionReady ||
    packageJob.approvedWorkItemId !== workItem.id ||
    workItem.workItemType !== profile.expectedWorkItemType ||
    workItem.workerClass !== profile.expectedWorkerClass ||
    workItem.approvedProviderRoute !== profile.providerRouteId ||
    workItem.providerExecutionMode !== 'primary' ||
    workItem.approvedToolIds.length !== 0 ||
    workItem.approvedToolOperationIds.length !== 0 ||
    packageJob.approvedToolOperationIds.length !== 0 ||
    workItem.maxAttempts !== 1 || packageJob.maxAttempts !== 1 ||
    queueJob.maxAttempts !== 1 ||
    workItem.expectedOutputs.length !== 2 ||
    packageJob.expectedAssetIds.length !== 2 ||
    packageJob.expectedAssetIds.some((value, index) =>
      value !== authorization.expectedOutputIds[index]) ||
    authorization.expectedOutputSetHash !== expectedOutputSetHash ||
    authorization.operationProfileHash !== profile.profileHash ||
    authorization.providerRouteId !== profile.providerRouteId ||
    authorization.providerModelId !== profile.providerModelId ||
    authorization.requestPolicyHash !== sha256AuthorityValue(profile.requestPolicy) ||
    authorization.costPolicyHash !== sha256AuthorityValue(profile.costPolicy)
  ) throw invalid('Historical provider V2 authorization or approved package changed.')
  return authorization
}

function assertQueueTerminalState(
  entry: CanonicalPrivatePackageWorkQueueEntry,
  terminal: CanonicalPrivateProviderDispatchTerminal,
): void {
  const success = isSuccessfulTerminal(terminal.state)
  if (
    success !== (entry.state === 'completed') ||
    (success && (
      entry.completion?.outcome.artifactId !== terminal.privateOutput?.assetVersionId ||
      entry.completion?.outcome.sha256 !== terminal.privateOutput?.contentSha256
    )) ||
    (terminal.state === 'unknown_reconciliation_required' &&
      entry.lastRelease?.reason !== 'provider_unknown_outcome') ||
    (terminal.state === 'unknown_reconciled_failed' &&
      entry.lastRelease?.reason !== 'provider_unknown_reconciled_failed')
  ) throw invalid('Provider queue terminal disposition changed.')
}

function assertQueueTerminalStateV2(
  entry: CanonicalPrivatePackageWorkQueueEntry,
  terminal: CanonicalPrivateProviderDispatchTerminalV2,
): void {
  const success = isSuccessfulTerminalV2(terminal.state)
  if (
    success !== (entry.state === 'completed') ||
    (success && (
      entry.completion?.outcome.artifactId !==
        terminal.privateOutputs[0]?.assetVersionId ||
      entry.completion?.outcome.sha256 !==
        terminal.privateOutputs[0]?.contentSha256
    )) ||
    (terminal.state === 'unknown_reconciliation_required' &&
      entry.lastRelease?.reason !== 'provider_unknown_outcome') ||
    (terminal.state === 'unknown_reconciled_failed' &&
      entry.lastRelease?.reason !== 'provider_unknown_reconciled_failed')
  ) throw invalid('Provider V2 queue terminal disposition changed.')
}

function assertProviderCostTerminalBinding(
  evidence: Awaited<ReturnType<typeof readPrivateProviderAttemptCostEvidenceForAttempt>>,
  terminal: CanonicalPrivateProviderDispatchTerminal,
): void {
  if (
    evidence.evidenceHash !== terminal.costEvidenceHash ||
    evidence.outcome.state !== terminal.state ||
    evidence.provider.requestCount !== terminal.providerRequestCount ||
    evidence.provider.usageEvidenceDigest !==
      terminal.providerResponseUsageDigest ||
    evidence.reconciliation.providerCostMicros !== terminal.providerCostMicros ||
    evidence.reconciliation.infrastructureCostMicros !==
      terminal.infrastructureCostMicros ||
    evidence.reconciliation.totalInternalProductionCostMicros !==
      terminal.totalInternalProductionCostMicros ||
    evidence.commercialBoundary.customerPriceIncluded ||
    evidence.commercialBoundary.customerCreditsIncluded ||
    evidence.commercialBoundary.serviceFeeIncluded ||
    evidence.commercialBoundary.walletMutationPerformed ||
    evidence.commercialBoundary.billingMutationPerformed
  ) throw invalid('Provider terminal cost evidence changed or crossed commercial boundaries.')
}

function assertProviderCostTerminalBindingV2(
  evidence: Awaited<ReturnType<
    typeof readPrivateProviderAttemptCostEvidenceV2ForAttempt
  >>,
  terminal: CanonicalPrivateProviderDispatchTerminalV2,
): void {
  if (
    evidence.evidenceHash !== terminal.costEvidenceHash ||
    evidence.outcome.state !== terminal.state ||
    evidence.provider.requestCount !== terminal.providerRequestCount ||
    evidence.provider.usageEvidenceDigest !==
      terminal.providerResponseUsageDigest ||
    evidence.reconciliation.providerCostMicros !== terminal.providerCostMicros ||
    evidence.reconciliation.infrastructureCostMicros !==
      terminal.infrastructureCostMicros ||
    evidence.reconciliation.totalInternalProductionCostMicros !==
      terminal.totalInternalProductionCostMicros ||
    evidence.commercialBoundary.customerPriceIncluded ||
    evidence.commercialBoundary.customerCreditsIncluded ||
    evidence.commercialBoundary.serviceFeeIncluded ||
    evidence.commercialBoundary.walletMutationPerformed ||
    evidence.commercialBoundary.billingMutationPerformed
  ) throw invalid('Provider V2 terminal cost evidence changed commercial boundaries.')
}

function assertWorkerUsageBinding(input: {
  usage: PrivateWorkerResourceUsageCostEvidence
  authorization:
    | CanonicalProviderWorkAuthorization
    | CanonicalProviderWorkAuthorizationV2
  profile:
    | ReturnType<typeof resolveCanonicalProviderOperation>
    | ReturnType<typeof resolveCanonicalProviderOperationV2>
  grantId: string
  grantHash: string
  attemptId: string
  claimId: string
  claimHash: string
  deliveryAttempt: number
  approvedWorkItemHash: string
  terminal:
    | CanonicalPrivateProviderDispatchTerminal
    | CanonicalPrivateProviderDispatchTerminalV2
}): void {
  const { usage, authorization } = input
  const expectedEvidenceClass = authorization.authorityClass ===
    'private_injected_nonprovider_test'
    ? 'private_injected_observed_usage_test'
    : 'canonical_backend_observed_usage_unreleased'
  const expectedOutcome = input.terminal.sequence === 2
    ? 'unknown'
    : input.terminal.state === 'succeeded'
      ? 'completed'
      : input.terminal.state === 'failed'
        ? 'failed'
        : 'unknown'
  if (
    usage.evidenceClass !== expectedEvidenceClass ||
    usage.operation.kind !== 'registered_provider_operation' ||
    usage.operation.operationId !== authorization.operationId ||
    usage.operation.operationProfileHash !== authorization.operationProfileHash ||
    usage.operation.registryWorkerType !== input.profile.expectedWorkerClass ||
    usage.identity.ownerUserId !== authorization.ownerUserId ||
    usage.identity.workspaceId !== authorization.workspaceId ||
    usage.identity.projectId !== authorization.projectId ||
    usage.identity.editSessionId !== authorization.editSessionId ||
    usage.identity.approvedPlanSnapshotId !== authorization.approvedPlanSnapshotId ||
    usage.identity.approvedPlanSnapshotHash !== authorization.snapshotHash ||
    usage.identity.packageRecordId !== authorization.packageRecordId ||
    usage.identity.packageHash !== authorization.packageHash ||
    usage.identity.approvedWorkItemId !== authorization.approvedWorkItemId ||
    usage.identity.approvedWorkItemHash !== input.approvedWorkItemHash ||
    usage.identity.jobId !== authorization.queueJobId ||
    usage.identity.executionAttemptId !== input.attemptId ||
    usage.identity.attemptOrdinal !== input.deliveryAttempt ||
    usage.identity.leaseId !== input.claimId ||
    usage.identity.leaseHash !== input.claimHash ||
    usage.identity.dispatchGrantId !== input.grantId ||
    usage.identity.dispatchGrantHash !== input.grantHash ||
    usage.identity.idempotencyKeyHash !== authorization.idempotencyKeyHash ||
    usage.attemptInputHash !== authorization.providerRequestPayloadDigest ||
    Date.parse(usage.resourceUsage.finishedAt) >
      Date.parse(input.terminal.completedAt) ||
    usage.infrastructureCost.actualInternalCostMicros >
      authorization.maximumAuthorizedInfrastructureCostMicros ||
    (input.terminal.providerCostMicros !== null &&
      usage.infrastructureCost.actualInternalCostMicros +
        input.terminal.providerCostMicros >
        authorization.maximumAuthorizedTotalInternalCostMicros) ||
    usage.input.artifacts.length !== 1 ||
    usage.input.artifacts[0]?.artifactId !== authorization.sourceRequestId ||
    usage.input.artifacts[0]?.sha256 !== authorization.sourceRequestDigest ||
    usage.outcome.state !== expectedOutcome ||
    usage.infrastructureCost.providerCostIncluded ||
    usage.infrastructureCost.invoiceReconciled ||
    usage.commercialBoundary.customerPriceIncluded ||
    usage.commercialBoundary.customerCreditsIncluded ||
    usage.commercialBoundary.serviceFeeIncluded ||
    usage.commercialBoundary.walletMutationPerformed ||
    usage.commercialBoundary.billingMutationPerformed
  ) throw invalid('Observed provider worker resource evidence changed attempt lineage.')
}

function assertWorkerOutputBinding(
  usage: PrivateWorkerResourceUsageCostEvidence,
  output: Awaited<ReturnType<typeof readVerifiedPrivateCanonicalProviderCandidate>> | null,
  terminal: CanonicalPrivateProviderDispatchTerminal,
): void {
  const artifacts = usage.output.artifacts
  if (output) {
    if (
      terminal.sequence === 2 && usage.outcome.state === 'unknown' &&
      usage.output.disposition === 'none' && artifacts.length === 0
    ) return
    if (
      artifacts.length !== 1 || usage.output.disposition !== 'accepted' ||
      artifacts[0]?.artifactId !== output.output.assetVersionId ||
      artifacts[0]?.sha256 !== output.output.contentSha256 ||
      artifacts[0]?.byteLength !== output.output.byteLength ||
      (terminal.sequence === 1 && usage.outcome.state !== 'completed')
    ) throw invalid('Observed provider worker output changed private candidate lineage.')
    return
  }
  if (artifacts.length !== 0 || usage.output.disposition !== 'none') {
    throw invalid('Failed or unknown provider attempt cannot project output artifacts.')
  }
}

function assertWorkerOutputBindingV2(
  usage: PrivateWorkerResourceUsageCostEvidence,
  outputs: Awaited<ReturnType<
    typeof readVerifiedPrivateCanonicalProviderCandidateSetV2
  >> | readonly [],
  terminal: CanonicalPrivateProviderDispatchTerminalV2,
): void {
  const artifacts = usage.output.artifacts
  if (outputs.length === 2) {
    if (
      terminal.sequence === 2 && usage.outcome.state === 'unknown' &&
      usage.output.disposition === 'none' && artifacts.length === 0
    ) return
    if (
      artifacts.length !== 2 || usage.output.disposition !== 'accepted' ||
      artifacts.some((artifact, index) =>
        artifact.artifactId !== outputs[index]?.output.assetVersionId ||
        artifact.sha256 !== outputs[index]?.output.contentSha256 ||
        artifact.byteLength !== outputs[index]?.output.byteLength) ||
      (terminal.sequence === 1 && usage.outcome.state !== 'completed')
    ) throw invalid('Observed provider V2 worker outputs changed candidate lineage.')
    return
  }
  if (artifacts.length !== 0 || usage.output.disposition !== 'none') {
    throw invalid('Failed or unknown provider V2 attempt cannot project outputs.')
  }
}

function isSuccessfulTerminal(
  state: CanonicalPrivateProviderDispatchTerminal['state'],
): boolean {
  return state === 'succeeded' || state === 'unknown_reconciled_succeeded'
}

function isSuccessfulTerminalV2(
  state: CanonicalPrivateProviderDispatchTerminalV2['state'],
): boolean {
  return state === 'succeeded' || state === 'unknown_reconciled_succeeded'
}

function canonicalTimestamp(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) {
    throw invalid('Provider receipt projection time is invalid.')
  }
  return value
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'canonical_provider_attempt_consumer_receipt_integrity',
  })
}

function notReady(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate: 'canonical_provider_attempt_consumer_receipt_source_evidence',
  })
}
