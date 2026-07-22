import type { PersistedArtifactResult } from
  '../validation/private-artifact-qa-authority-schemas'
import { ApiError } from '../errors/api-error'
import {
  canonicalVisualCalibrationProviderAttemptSourceDigest,
  projectCanonicalVisualCalibrationConsumerReceipt,
} from './canonical-private-visual-calibration-consumer-receipt-service'
import {
  readCanonicalPrivateVisualCalibrationProviderOutputBridge,
} from './canonical-private-visual-calibration-provider-output-artifact-store'
import {
  readVerifiedPrivateCanonicalProviderCandidateForProcessingV4,
} from './private-canonical-provider-candidate-store'
import {
  readPrivateCanonicalProviderDispatchAggregate,
} from './private-canonical-provider-dispatch-store'
import type {
  CanonicalPrivatePackageWorkQueueStoreScope,
} from './private-canonical-package-work-queue-store'

export interface VerifiedCanonicalPrivateVisualCalibrationProviderOutputArtifact {
  bytes: Buffer
  role: 'provider_visual_calibration_video_mp4'
  contentType: 'video/mp4'
  sha256: string
  byteLength: number
  assetId: string
  assetVersionId: string
  outputId: string
  privateObjectIdentityHash: string
  storageEvidenceHash: string
  executionAttemptId: string
  runnerClass: 'canonical_private_provider_attempt_receipt_v2'
  providerQueueClaimId: string
  providerQueueClaimHash: string
  providerQueueDeliveryAttempt: number
  providerReceiptHash: string
  providerAttemptSourceDigest: string
  providerOutputSetDigest: string
  providerCandidateReadbackEvidenceHash: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedPlanSnapshotId: string
  approvedPlanSnapshotHash: string
  packageRecordId: string
  packageHash: string
  providerApprovedWorkItemId: string
  providerWorkItemKey: string
  providerJobId: string
  providerExpectedAssetId: string
  providerExpectedOutputKey: string
  qaApprovedWorkItemId: string
  qaExpectedAssetId: string
  productionId: string
  productionAuthorityHash: string
  styleAuthorityHash: string
  styleCalibrationPlanId: string
  styleCalibrationPlanDigest: string
  calibrationScenarioId: string
  calibrationScenarioKind:
    | 'style_led_motion'
    | 'character_continuity'
    | 'strict_first_last_frame'
    | 'reference_heavy'
  calibrationScenarioDigest: string
  visualCalibrationContextDigest: string
  referenceContractId: string
  referenceContractDigest: string
  firstFrameAssetId: string
  firstFrameExpectedSha256: string
  lastFrameAssetId: string
  lastFrameExpectedSha256: string
  continuityContractId: string
  continuityContractDigest: string
  maximumAuthorizedInfrastructureCostMicros: number
  providerAttemptCostEvidenceHash: string
  providerUsageEvidenceDigest: string | null
  providerRateCardDigest: string
  providerCostMicros: number | null
  providerWorkerInfrastructureEvidenceHash: string
  providerWorkerInfrastructureRateCardDigest: string
  providerWorkerInfrastructureCostMicros: number
  sourceAuthorityDigest: string
}

export async function verifyCanonicalPrivateVisualCalibrationProviderOutputArtifact(
  input: {
    localStorageRoot: string
    ownerUserId: string
    artifact: PersistedArtifactResult
  },
): Promise<VerifiedCanonicalPrivateVisualCalibrationProviderOutputArtifact> {
  const run = input.artifact.actualRunEvidence
  if (
    run.state !== 'actual_provider_attempt_receipt_verified_v1' ||
    run.providerOperationId !==
      'provider.google.generate_visual_calibration_candidate.v1' ||
    !run.actualRunVerified || run.exitCode !== 0 || run.toolIds.length !== 0 ||
    run.runnerClass !== 'canonical_private_provider_attempt_receipt_v2'
  ) throw invalid('Artifact does not carry the exact visual provider receipt.')
  const bridge =
    await readCanonicalPrivateVisualCalibrationProviderOutputBridge({
      localStorageRoot: input.localStorageRoot,
      ownerUserId: input.ownerUserId,
      workspaceId: input.artifact.identity.workspaceId,
      recordHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
    })
  if (!bridge) throw invalid('Visual provider-output bridge is missing.')
  const scope: CanonicalPrivatePackageWorkQueueStoreScope = {
    localStorageRoot: input.localStorageRoot,
    ownerUserId: bridge.ownerUserId,
    workspaceId: bridge.authorization.workspaceId,
    projectId: bridge.authorization.projectId,
    editSessionId: bridge.authorization.editSessionId,
    packageRecordId: bridge.authorization.packageRecordId,
    approvedPlanSnapshotId: bridge.authorization.approvedPlanSnapshotId,
  }
  const currentReceipt = await projectCanonicalVisualCalibrationConsumerReceipt({
    scope,
    executionPackage: bridge.executionPackage,
    queueDefinition: bridge.queueDefinition,
    authorization: bridge.authorization,
    projectedAt: bridge.receipt.projectedAt,
  })
  const aggregate = await readPrivateCanonicalProviderDispatchAggregate({ scope })
  const entry = aggregate?.entries.find((candidate) =>
    candidate.grant.grantId === currentReceipt.dispatch.grantId)
  const attempt = entry?.attempt
  const terminal = entry?.terminalHistory.find((candidate) =>
    candidate.terminalHash === currentReceipt.dispatch.terminalHash)
  const terminalV4 = terminal?.schemaVersion ===
    'canonical-private-provider-dispatch-terminal-v4'
    ? terminal
    : undefined
  const output = terminalV4?.privateOutput
  const currentAttemptSourceDigest =
    canonicalVisualCalibrationProviderAttemptSourceDigest(currentReceipt)
  if (
    currentAttemptSourceDigest !== bridge.providerAttemptSourceDigest ||
    canonicalVisualCalibrationProviderAttemptSourceDigest(bridge.receipt) !==
      bridge.providerAttemptSourceDigest ||
    !attempt || !terminalV4 || !output ||
    terminalV4.outputSetDigest !== bridge.receipt.outputSet.outputSetDigest
  ) throw invalid('Visual provider source receipt changed after admission.')
  const processing =
    await readVerifiedPrivateCanonicalProviderCandidateForProcessingV4({
      localStorageRoot: input.localStorageRoot,
      authorization: bridge.authorization,
      dispatchAttempt: attempt,
      output,
      outputSetDigest: terminalV4.outputSetDigest,
    })
  const readback = processing.readback
  const context = bridge.authorization.visualCalibrationContext
  const providerWorkItem = bridge.executionPackage.approvedWorkItems.find(
    (candidate) => candidate.id === bridge.authorization.approvedWorkItemId,
  )
  const providerJob = bridge.executionPackage.jobs.find((candidate) =>
    candidate.id === bridge.authorization.queueJobId)
  const providerExpectedAssetId = providerJob?.expectedAssetIds[0]
  if (
    !providerWorkItem || !providerJob || !providerExpectedAssetId ||
    output.outputId !== bridge.outputId ||
    output.role !== bridge.outputRole ||
    output.contentSha256 !== bridge.outputContentSha256 ||
    output.byteLength !== bridge.outputByteLength ||
    output.privateObjectIdentityHash !==
      bridge.outputPrivateObjectIdentityHash ||
    readback.storageEvidenceHash !== bridge.outputStorageEvidenceHash ||
    readback.sourceReadbackEvidenceHash !==
      bridge.outputReadbackEvidenceHash ||
    input.artifact.content.sha256 !== bridge.outputContentSha256 ||
    input.artifact.content.byteLength !== bridge.outputByteLength ||
    input.artifact.content.contentType !== 'video/mp4' ||
    input.artifact.storageIdentity.opaqueObjectIdentityHash !==
      bridge.recordHash ||
    run.executionAttemptId !== currentReceipt.dispatch.dispatchAttemptId ||
    run.runnerEvidenceHash !== bridge.receipt.receiptHash ||
    run.providerRoute !== currentReceipt.provider.providerRouteId ||
    run.providerOutputRole !== bridge.outputRole ||
    run.providerWorkAuthorityDigest !== bridge.authorization.authorityHash ||
    run.providerTerminalHash !== currentReceipt.dispatch.terminalHash ||
    run.providerOutputSetDigest !== currentReceipt.outputSet.outputSetDigest ||
    run.providerReceiptHash !== bridge.receipt.receiptHash ||
    run.providerQueueClaimId !== currentReceipt.queue.claimId ||
    run.providerQueueClaimHash !== currentReceipt.queue.claimHash ||
    run.providerCandidateReadbackEvidenceHash !==
      bridge.outputReadbackEvidenceHash ||
    run.providerCandidatePrivateObjectIdentityHash !==
      bridge.outputPrivateObjectIdentityHash ||
    run.productionAuthorityHash !==
      context.storytellingProductionAuthorityRefDigest ||
    run.sourceAuthorityDigest !==
      bridge.authorization.visualCalibrationContextDigest ||
    run.dispatchGrantId !== currentReceipt.dispatch.grantId
  ) throw invalid('Visual provider artifact no longer matches its receipt and bytes.')
  return {
    bytes: processing.bytes,
    role: bridge.outputRole,
    contentType: 'video/mp4',
    sha256: bridge.outputContentSha256,
    byteLength: bridge.outputByteLength,
    assetId: output.assetId,
    assetVersionId: output.assetVersionId,
    outputId: output.outputId,
    privateObjectIdentityHash: bridge.outputPrivateObjectIdentityHash,
    storageEvidenceHash: bridge.outputStorageEvidenceHash,
    executionAttemptId: currentReceipt.dispatch.dispatchAttemptId,
    runnerClass: 'canonical_private_provider_attempt_receipt_v2',
    providerQueueClaimId: currentReceipt.queue.claimId,
    providerQueueClaimHash: currentReceipt.queue.claimHash,
    providerQueueDeliveryAttempt: currentReceipt.queue.deliveryAttempt,
    providerReceiptHash: bridge.receipt.receiptHash,
    providerAttemptSourceDigest: bridge.providerAttemptSourceDigest,
    providerOutputSetDigest: currentReceipt.outputSet.outputSetDigest,
    providerCandidateReadbackEvidenceHash:
      bridge.outputReadbackEvidenceHash,
    ownerUserId: bridge.ownerUserId,
    workspaceId: bridge.workspaceId,
    projectId: bridge.authorization.projectId,
    editSessionId: bridge.authorization.editSessionId,
    approvedPlanSnapshotId: bridge.authorization.approvedPlanSnapshotId,
    approvedPlanSnapshotHash: bridge.authorization.snapshotHash,
    packageRecordId: bridge.authorization.packageRecordId,
    packageHash: bridge.authorization.packageHash,
    providerApprovedWorkItemId: bridge.authorization.approvedWorkItemId,
    providerWorkItemKey: providerWorkItem.workItemKey,
    providerJobId: bridge.authorization.queueJobId,
    providerExpectedAssetId,
    providerExpectedOutputKey: bridge.authorization.expectedOutputKey,
    qaApprovedWorkItemId: bridge.qaApprovedWorkItemId,
    qaExpectedAssetId: bridge.qaExpectedAssetId,
    productionId: context.motionStudioProductionId,
    productionAuthorityHash:
      context.storytellingProductionAuthorityRefDigest,
    styleAuthorityHash: context.storytellingStyleAuthorityRefDigest,
    styleCalibrationPlanId: context.styleCalibrationPlanId,
    styleCalibrationPlanDigest: context.styleCalibrationPlanDigest,
    calibrationScenarioId: context.calibrationScenarioId,
    calibrationScenarioKind:
      bridge.qaPlanningAuthority.calibrationScenarioKind,
    calibrationScenarioDigest: context.calibrationScenarioDigest,
    visualCalibrationContextDigest:
      bridge.authorization.visualCalibrationContextDigest,
    referenceContractId: context.referenceContractId,
    referenceContractDigest: context.referenceContractDigest,
    firstFrameAssetId: context.firstFrameAssetId,
    firstFrameExpectedSha256: context.firstFrameSha256,
    lastFrameAssetId: context.lastFrameAssetId,
    lastFrameExpectedSha256: context.lastFrameSha256,
    continuityContractId: context.continuityContractId,
    continuityContractDigest: context.continuityContractDigest,
    maximumAuthorizedInfrastructureCostMicros:
      bridge.qaPlanningAuthority.maximumAuthorizedInfrastructureCostMicros,
    providerAttemptCostEvidenceHash:
      currentReceipt.internalCost.providerAttemptEvidenceHash,
    providerUsageEvidenceDigest:
      currentReceipt.internalCost.providerUsageEvidenceDigest,
    providerRateCardDigest:
      currentReceipt.internalCost.providerRateCardDigest,
    providerCostMicros: currentReceipt.internalCost.providerCostMicros,
    providerWorkerInfrastructureEvidenceHash:
      currentReceipt.internalCost.workerResourceEvidenceHash,
    providerWorkerInfrastructureRateCardDigest:
      currentReceipt.internalCost.selectedInfrastructureRateCardDigest,
    providerWorkerInfrastructureCostMicros:
      currentReceipt.internalCost.selectedInfrastructureCostMicros,
    sourceAuthorityDigest:
      bridge.authorization.visualCalibrationContextDigest,
  }
}

function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate:
      'canonical_private_visual_calibration_provider_output_verification',
  })
}
