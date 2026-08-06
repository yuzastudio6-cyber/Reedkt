import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import {
  resolveCanonicalProviderLifecyclePolicy,
} from '../edit-architecture/canonical-provider-lifecycle-policy'
import type { CanonicalPrivatePackageWorkQueueDefinition } from
  '../edit-architecture/canonical-private-package-work-queue-authority'
import {
  canonicalProviderWorkAuthorizationRequestHashV4,
  canonicalProviderWorkAuthorizationV4Schema,
  resolveCanonicalProviderOperationV4,
  type CanonicalProviderWorkAuthorizationV4,
} from '../edit-architecture/canonical-provider-work-authority'
import { ApiError } from '../errors/api-error'
import {
  readPrivateProviderAttemptCostEvidenceV4ForAttempt,
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
  CanonicalPrivateProviderDispatchTerminalV4,
} from '../validation/canonical-private-provider-dispatch-schemas'
import type {
  CanonicalPrivatePackageWorkQueueEntry,
} from '../validation/canonical-private-package-work-queue-schemas'
import {
  readVerifiedPrivateCanonicalProviderCandidateV4,
} from './private-canonical-provider-candidate-store'
import {
  readPrivateCanonicalProviderDispatchAggregate,
} from './private-canonical-provider-dispatch-store'
import {
  readPrivateCanonicalPackageWorkQueue,
  type CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'
import { sha256AuthorityValue } from './private-edit-authority-store'

export interface ProjectCanonicalVisualCalibrationConsumerReceiptInput {
  scope: CanonicalPrivatePackageWorkQueueStoreScope
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  authorization: CanonicalProviderWorkAuthorizationV4
  projectedAt: string
}

/**
 * Identifies the immutable provider attempt without coupling its identity to
 * unrelated jobs that may advance in the same package queue or dispatch
 * aggregate after this attempt has completed.
 *
 * The admission receipt still retains the exact aggregate hashes observed at
 * projection time. Revalidation separately re-reads those canonical stores,
 * then compares this attempt-scoped digest so a downstream QA claim cannot
 * make an otherwise immutable provider output appear to have changed.
 */
export function canonicalVisualCalibrationProviderAttemptSourceDigest(
  receipt: CanonicalProviderAttemptConsumerReceipt,
): string {
  const parsed = canonicalProviderAttemptConsumerReceiptSchema.parse(receipt)
  const source = Object.fromEntries(
    Object.entries(parsed).filter(([key]) =>
      !['receiptHash', 'queue', 'dispatch'].includes(key)),
  )
  const queue = Object.fromEntries(
    Object.entries(parsed.queue).filter(([key]) => key !== 'aggregateHash'),
  )
  const dispatch = Object.fromEntries(
    Object.entries(parsed.dispatch).filter(([key]) => key !== 'aggregateHash'),
  )
  return sha256AuthorityValue({
    domain:
      'reeditpro:canonical-visual-calibration-provider-attempt-source:v1',
    source,
    queue,
    dispatch,
  })
}

/**
 * Projects one compact source-verified receipt from canonical package, queue,
 * dispatch, candidate, provider-cost, and worker-resource stores. The caller
 * cannot supply outcome, cost, output, route, or readiness evidence.
 */
export async function projectCanonicalVisualCalibrationConsumerReceipt(
  input: ProjectCanonicalVisualCalibrationConsumerReceiptInput,
): Promise<CanonicalProviderAttemptConsumerReceipt> {
  const projectedAt = canonicalTimestamp(input.projectedAt)
  const authorization = verifyAuthorization(input)
  const profile = resolveCanonicalProviderOperationV4(authorization.operationId)
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
    throw notReady(
      'Visual-calibration queue or dispatch source evidence is unavailable.',
    )
  }
  const queueEntry = queueAggregate.entries.find((candidate) =>
    candidate.definition.jobId === authorization.queueJobId)
  const dispatchMatches = dispatchAggregate.entries.filter((candidate) =>
    candidate.grant.authorizationHash === authorization.authorityHash)
  if (!queueEntry || dispatchMatches.length !== 1) {
    throw invalid(
      'Visual-calibration receipt requires one exact queue and dispatch entry.',
    )
  }
  const dispatchEntry = dispatchMatches[0]!
  const attempt = dispatchEntry.attempt
  const terminal = dispatchEntry.terminalHistory.at(-1)
  const queueAttempt = queueEntry.providerExecutionAttempt
  if (!attempt || !terminal || !queueAttempt) {
    throw notReady(
      'Visual-calibration receipt requires one terminal canonical attempt.',
    )
  }
  if (
    dispatchEntry.grant.schemaVersion !==
      'canonical-private-provider-dispatch-grant-v4' ||
    terminal.schemaVersion !==
      'canonical-private-provider-dispatch-terminal-v4'
  ) throw invalid('Visual-calibration receipt cannot reinterpret another operation.')
  if (
    Date.parse(projectedAt) < Date.parse(terminal.completedAt) ||
    Date.parse(projectedAt) < Date.parse(queueEntry.updatedAt)
  ) throw invalid('Visual-calibration receipt cannot predate source evidence.')
  const authorizationRequestHash =
    canonicalProviderWorkAuthorizationRequestHashV4(authorization)
  if (
    dispatchEntry.grant.authorizationRequestHash !== authorizationRequestHash ||
    dispatchEntry.grant.operationId !== authorization.operationId ||
    dispatchEntry.grant.providerRouteId !== authorization.providerRouteId ||
    dispatchEntry.grant.providerModelId !== authorization.providerModelId ||
    dispatchEntry.grant.visualCalibrationContextDigest !==
      authorization.visualCalibrationContextDigest ||
    dispatchEntry.grant.expectedOutputSetHash !==
      authorization.expectedOutputSetHash ||
    dispatchEntry.grant.expectedOutputIds[0] !==
      authorization.expectedOutputIds[0] ||
    dispatchEntry.grant.maximumLifecycleHttpRequests !== 15 ||
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
  ) throw invalid('Visual-calibration queue and dispatch lineage changed.')
  assertQueueTerminalState(queueEntry, terminal)

  const providerCost = await readPrivateProviderAttemptCostEvidenceV4ForAttempt({
    localStorageRoot: input.scope.localStorageRoot,
    authorization,
    claimId: attempt.queueClaimId,
    claimHash: attempt.queueClaimHash,
    deliveryAttempt: attempt.queueClaimDeliveryAttempt,
    dispatchAttemptId: attempt.dispatchAttemptId,
    evidenceHash: terminal.costEvidenceHash,
  })
  if (
    providerCost.evidenceHash !== terminal.costEvidenceHash ||
    providerCost.outcome.state !== terminal.state ||
    providerCost.provider.requestCount !== terminal.providerRequestCount ||
    providerCost.provider.usageEvidenceDigest !==
      terminal.providerResponseUsageDigest ||
    providerCost.reconciliation.providerCostMicros !==
      terminal.providerCostMicros ||
    providerCost.reconciliation.infrastructureCostMicros !==
      terminal.infrastructureCostMicros ||
    providerCost.reconciliation.totalInternalProductionCostMicros !==
      terminal.totalInternalProductionCostMicros ||
    providerCost.commercialBoundary.customerPriceIncluded ||
    providerCost.commercialBoundary.customerCreditsIncluded ||
    providerCost.commercialBoundary.serviceFeeIncluded ||
    providerCost.commercialBoundary.walletMutationPerformed ||
    providerCost.commercialBoundary.billingMutationPerformed
  ) throw invalid('Visual-calibration cost evidence changed its boundaries.')

  const workerUsage = await readPrivateWorkerResourceUsageCostEvidence({
    localStorageRoot: input.scope.localStorageRoot,
    ownerUserId: authorization.ownerUserId,
    workspaceId: authorization.workspaceId,
    projectId: authorization.projectId,
    executionAttemptId: attempt.dispatchAttemptId,
  })
  if (!workerUsage) {
    throw notReady(
      'Observed visual-calibration provider-worker resource evidence is required.',
    )
  }
  const approvedWorkItem = input.executionPackage.approvedWorkItems.find(
    (candidate) => candidate.id === authorization.approvedWorkItemId,
  )
  if (!approvedWorkItem) throw invalid('Approved visual work item disappeared.')
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
  const successful = terminal.state === 'succeeded' ||
    terminal.state === 'unknown_reconciled_succeeded'
  const verifiedOutput = terminal.privateOutput
    ? await readVerifiedPrivateCanonicalProviderCandidateV4({
        localStorageRoot: input.scope.localStorageRoot,
        authorization,
        dispatchAttempt: attempt,
        output: terminal.privateOutput,
        outputSetDigest: terminal.outputSetDigest,
      })
    : null
  if (successful !== (verifiedOutput !== null)) {
    throw invalid('Visual-calibration terminal and private MP4 readback disagree.')
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
    domain: 'reeditpro:canonical-provider-attempt-consumer-context:v4',
    ownerUserId: authorization.ownerUserId,
    workspaceId: authorization.workspaceId,
    projectId: authorization.projectId,
    editSessionId: authorization.editSessionId,
    approvedPlanSnapshotId: authorization.approvedPlanSnapshotId,
    packageRecordId: authorization.packageRecordId,
    approvedWorkItemId: authorization.approvedWorkItemId,
    queueJobId: authorization.queueJobId,
    operationId: authorization.operationId,
    visualCalibrationContext: authorization.visualCalibrationContext,
    visualCalibrationContextDigest:
      authorization.visualCalibrationContextDigest,
    expectedOutputIds: authorization.expectedOutputIds,
    expectedOutputSetHash: authorization.expectedOutputSetHash,
  }
  const consumerContextDigest = sha256AuthorityValue(consumerContextPayload)
  const receiptIdentityHash = sha256AuthorityValue({
    domain: 'reeditpro:canonical-provider-attempt-consumer-receipt:v4',
    identity,
    consumerContextDigest,
    dispatchAttemptHash: attempt.attemptHash,
    terminalHash: terminal.terminalHash,
    workerResourceEvidenceHash: workerUsage.evidenceHash,
    sourceOutputSetDigest: terminal.outputSetDigest,
  })
  const projectedOutput = verifiedOutput
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
  const privateOutputs = projectedOutput ? [projectedOutput] : []
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
    privateOutput: projectedOutput,
    privateOutputs,
    outputSet: {
      schemaVersion: CANONICAL_PROVIDER_PRIVATE_OUTPUT_SET_VERSION,
      sourceAuthorityClass:
        'forward_single_output_same_attempt_source' as const,
      outputCount: privateOutputs.length,
      outputSetDigest: terminal.outputSetDigest,
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

function verifyAuthorization(
  input: ProjectCanonicalVisualCalibrationConsumerReceiptInput,
): CanonicalProviderWorkAuthorizationV4 {
  const parsed = canonicalProviderWorkAuthorizationV4Schema.safeParse(
    input.authorization,
  )
  if (!parsed.success) throw invalid('Visual-calibration authorization changed.')
  const authorization = parsed.data
  const { authorityHash, ...authorityPayload } = authorization
  const profile = resolveCanonicalProviderOperationV4(authorization.operationId)
  const queueJob = input.queueDefinition.jobs.find((candidate) =>
    candidate.jobId === authorization.queueJobId)
  const packageJob = input.executionPackage.jobs.find((candidate) =>
    candidate.id === authorization.queueJobId)
  const workItem = input.executionPackage.approvedWorkItems.find((candidate) =>
    candidate.id === authorization.approvedWorkItemId)
  const expectedOutput = workItem?.expectedOutputs.find((candidate) =>
    candidate.outputKey === authorization.expectedOutputKey)
  const expectedOutputSetHash = sha256AuthorityValue({
    domain: 'reeditpro:canonical-provider-expected-output-set:v4',
    operationProfileHash: profile.profileHash,
    outputs: expectedOutput ? [expectedOutput] : [],
  })
  const styleRef = input.executionPackage.componentRefs
    .motionStudioStorytellingStyleAuthority
  const productionRef = input.executionPackage.componentRefs
    .motionStudioStorytellingProductionAuthority
  if (
    authorityHash !== sha256AuthorityValue(authorityPayload) ||
    !queueJob || !packageJob || !workItem || !expectedOutput ||
    !styleRef || !productionRef ||
    styleRef.sha256 !== authorization.visualCalibrationContext
      .storytellingStyleAuthorityRefDigest ||
    productionRef.sha256 !== authorization.visualCalibrationContext
      .storytellingProductionAuthorityRefDigest ||
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
    authorization.queueJobDefinitionHash !== queueJob.definitionHash ||
    authorization.placementHash !== queueJob.placementHash ||
    authorization.approvedWorkItemId !== queueJob.approvedWorkItemId ||
    authorization.workItemKey !== queueJob.workItemKey ||
    queueJob.providerExecutionMode !== 'primary' || queueJob.privateExecutionReady ||
    packageJob.approvedWorkItemId !== workItem.id ||
    workItem.workItemType !== profile.expectedWorkItemType ||
    workItem.workerClass !== profile.expectedWorkerClass ||
    workItem.approvedProviderRoute !== profile.providerRouteId ||
    workItem.providerExecutionMode !== 'primary' ||
    workItem.approvedToolIds.length !== 0 ||
    workItem.approvedToolOperationIds.length !== 0 ||
    packageJob.approvedToolOperationIds.length !== 0 ||
    workItem.maxAttempts !== 1 || packageJob.maxAttempts !== 1 ||
    queueJob.maxAttempts !== 1 || workItem.expectedOutputs.length !== 1 ||
    packageJob.expectedAssetIds.length !== 1 ||
    packageJob.expectedAssetIds[0] !== authorization.expectedOutputId ||
    expectedOutput.artifactType !== profile.expectedOutput.artifactType ||
    expectedOutput.assetRole !== profile.expectedOutput.assetRole ||
    expectedOutput.contentType !== profile.expectedOutput.contentType ||
    !expectedOutput.required ||
    authorization.expectedOutputSetHash !== expectedOutputSetHash ||
    authorization.operationProfileHash !== profile.profileHash ||
    authorization.providerRouteId !== profile.providerRouteId ||
    authorization.providerModelId !== profile.providerModelId ||
    authorization.visualCalibrationContextDigest !==
      sha256AuthorityValue(authorization.visualCalibrationContext) ||
    authorization.requestPolicyHash !== sha256AuthorityValue(profile.requestPolicy) ||
    authorization.costPolicyHash !== sha256AuthorityValue(profile.costPolicy)
  ) throw invalid('Visual-calibration approved package or authority changed.')
  return authorization
}

function assertQueueTerminalState(
  entry: CanonicalPrivatePackageWorkQueueEntry,
  terminal: CanonicalPrivateProviderDispatchTerminalV4,
): void {
  const success = terminal.state === 'succeeded' ||
    terminal.state === 'unknown_reconciled_succeeded'
  if (
    success !== (entry.state === 'completed') ||
    (success && (
      entry.completion?.outcome.artifactId !==
        terminal.privateOutput?.assetVersionId ||
      entry.completion?.outcome.sha256 !== terminal.privateOutput?.contentSha256
    )) ||
    (terminal.state === 'unknown_reconciliation_required' &&
      entry.lastRelease?.reason !== 'provider_unknown_outcome') ||
    (terminal.state === 'unknown_reconciled_failed' &&
      entry.lastRelease?.reason !== 'provider_unknown_reconciled_failed')
  ) throw invalid('Visual-calibration queue terminal disposition changed.')
}

function assertWorkerUsageBinding(input: {
  usage: PrivateWorkerResourceUsageCostEvidence
  authorization: CanonicalProviderWorkAuthorizationV4
  profile: ReturnType<typeof resolveCanonicalProviderOperationV4>
  grantId: string
  grantHash: string
  attemptId: string
  claimId: string
  claimHash: string
  deliveryAttempt: number
  approvedWorkItemHash: string
  terminal: CanonicalPrivateProviderDispatchTerminalV4
}): void {
  const { usage, authorization } = input
  const expectedOutcome = input.terminal.sequence === 2
    ? 'unknown'
    : input.terminal.state === 'succeeded'
      ? 'completed'
      : input.terminal.state === 'failed'
        ? 'failed'
        : 'unknown'
  if (
    usage.evidenceClass !== 'private_injected_observed_usage_test' ||
    usage.operation.kind !== 'registered_provider_operation' ||
    usage.operation.registryVersion !== 'canonical-provider-operation-registry-v4' ||
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
  ) throw invalid('Observed visual worker usage changed attempt lineage.')
}

function assertWorkerOutputBinding(
  usage: PrivateWorkerResourceUsageCostEvidence,
  output: Awaited<ReturnType<
    typeof readVerifiedPrivateCanonicalProviderCandidateV4
  >> | null,
  terminal: CanonicalPrivateProviderDispatchTerminalV4,
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
    ) throw invalid('Observed visual worker output changed private MP4 lineage.')
    return
  }
  if (artifacts.length !== 0 || usage.output.disposition !== 'none') {
    throw invalid('Failed or unknown visual attempt cannot project outputs.')
  }
}

function canonicalTimestamp(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) {
    throw invalid('Visual-calibration receipt time is invalid.')
  }
  return value
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'canonical_visual_calibration_receipt_integrity',
  })
}

function notReady(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate: 'canonical_visual_calibration_receipt_sources',
  })
}
