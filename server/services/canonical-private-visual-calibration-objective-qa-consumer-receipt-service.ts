import { ApiError } from '../errors/api-error'
import {
  assertCanonicalVisualCalibrationObjectiveQaWorkItem,
  CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_COST_PROFILE_ID,
  CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_EXECUTION_OPERATION,
  CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_THRESHOLD_VERSION,
} from '../edit-architecture/canonical-visual-calibration-objective-qa-authority'
import type { ServiceContext } from '../types'
import {
  buildOfflineMediaBinaryVisualCalibrationObjectiveQaRequest,
  validateOfflineMediaBinaryVisualCalibrationObjectiveQaResult,
  type OfflineMediaBinaryVisualCalibrationObjectiveQaResultDocument,
} from '../tool-execution/media-binary-execution'
import {
  readPrivateWorkerResourceUsageCostEvidence,
} from '../tool-cost-metering/private-worker-resource-usage-cost-evidence'
import { createPrivateArtifactQaAuthorityService } from
  './private-artifact-qa-authority-service'
import { readCanonicalStructuredJsonArtifact } from
  './canonical-structured-json-artifact-storage'
import { createEditPlanningAuthorityService } from
  './edit-planning-authority-service'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'
import {
  readPrivateCanonicalWorkerLeaseAggregate,
} from './private-canonical-worker-lease-store'
import {
  readPrivateCanonicalToolDispatchAggregate,
} from './private-canonical-tool-dispatch-store'
import {
  verifyCanonicalPrivateVisualCalibrationProviderOutputArtifact,
} from './canonical-private-visual-calibration-provider-output-artifact-verifier'
import {
  readCanonicalVisualCalibrationReferenceFrames,
} from './canonical-visual-calibration-reference-frame-reader-port'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_CONSUMER_RECEIPT_VERSION =
  'canonical-visual-calibration-objective-qa-consumer-receipt-v1' as const

export interface ReadCanonicalVisualCalibrationObjectiveQaReceiptInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedPlanSnapshotId: string
  qaJobId: string
  qaExpectedAssetId: string
  qaArtifactId: string
}

export interface CanonicalVisualCalibrationObjectiveQaConsumerReceipt {
  schemaVersion:
    typeof CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_CONSUMER_RECEIPT_VERSION
  source: 'canonical_backend_private_visual_calibration_qa_projection'
  identity: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedPlanSnapshotId: string
    approvedPlanSnapshotHash: string
    packageRecordId: string
    packageHash: string
    qaApprovedWorkItemId: string
    qaApprovedWorkItemHash: string
    qaJobId: string
    qaExpectedAssetId: string
    motionStudioProductionId: string
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
  }
  providerInput: {
    operationId: 'provider.google.generate_visual_calibration_candidate.v1'
    providerJobId: string
    providerApprovedWorkItemId: string
    providerExpectedAssetId: string
    providerArtifactId: string
    providerOutputId: string
    providerReceiptHash: string
    providerAttemptSourceDigest: string
    providerOutputSetDigest: string
    providerQueueClaimId: string
    providerQueueClaimHash: string
    contentSha256: string
    byteLength: number
    privateObjectIdentityHash: string
    checksumReadbackVerified: true
  }
  execution: {
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
    executionOperation:
      typeof CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_EXECUTION_OPERATION
    operationProfileId:
      'approved_visual_calibration_candidate_objective_qa_v1'
    runnerClass: 'offline_media_binary_execution_v1'
    runnerProfileId:
      'offline_media_binary_visual_calibration_candidate_qa_v1'
    leaseId: string
    leaseHash: string
    attemptOrdinal: number
    executionAttemptId: string
    executionStartedAt: string
    executionCompletedAt: string
    dispatchGrantId: string
    dispatchGrantHash: string
    dispatchConsumptionCount: 1
    singleUseDispatchVerified: true
  }
  referenceFrames: {
    first: SafeReferenceFrameReceipt
    last: SafeReferenceFrameReceipt
  }
  measurements: OfflineMediaBinaryVisualCalibrationObjectiveQaResultDocument
  gates: ReadonlyArray<{
    gateId: string
    status: 'passed' | 'failed'
  }>
  technicalQa: {
    status: 'passed' | 'failed'
    qaReportIntegrityVerified: true
    privateTestCandidateEvidenceEligible: boolean
    productionCandidateEvidenceAuthorized: false
  }
  privateArtifact: {
    artifactId: string
    qaEvaluationId: string
    reconciliationId: string
    contentType: 'application/json'
    contentSha256: string
    byteLength: number
    privateObjectIdentityHash: string
    checksumReadbackVerified: true
    providerUrlPersisted: false
    localPathProjected: false
  }
  internalCost: {
    providerAttemptEvidenceHash: string
    providerUsageEvidenceDigest: string | null
    providerRateCardDigest: string
    providerCostMicros: number
    providerWorkerInfrastructureEvidenceHash: string
    providerWorkerInfrastructureRateCardDigest: string
    providerWorkerInfrastructureCostMicros: number
    qaInfrastructureEvidenceHash: string
    qaInfrastructureRateCardDigest: string
    qaInfrastructureCostMicros: number
    maximumAuthorizedQaInfrastructureCostMicros: number
    qaCostAuthorizationClass: 'approved_internal_production_cost_only'
    qaCustomerCreditBudget: 0
    approvedSnapshotAndActiveReservationRequired: true
    selectedTotalInternalCostMicros: number
    providerAndQaCostComponentsSeparate: true
    customerPriceIncluded: false
    customerCreditsIncluded: false
    serviceFeeIncluded: false
  }
  evidenceClass: 'private_injected_nonprovider_test'
  promotionClass: 'non_promotable_private_injected'
  boundaries: {
    canonicalBackendVerifiedRuntime: false
    promotionAuthorized: false
    productionReady: false
    providerCallMadeByQa: false
    customerPriceIncluded: false
    customerCreditsIncluded: false
    serviceFeeIncluded: false
    walletMutationPerformed: false
    billingMutationPerformed: false
    renderExecuted: false
    finalExportExecuted: false
    publicDeliveryAuthorized: false
  }
  completedAt: string
  receiptHash: string
}

interface SafeReferenceFrameReceipt {
  assetId: string
  assetVersionId: string
  sha256: string
  byteLength: number
  privateObjectIdentityHash: string
  storageEvidenceHash: string
  readbackEvidenceHash: string
  checksumReadbackVerified: true
}

export async function readCanonicalVisualCalibrationObjectiveQaConsumerReceipt(
  context: ServiceContext,
  input: ReadCanonicalVisualCalibrationObjectiveQaReceiptInput,
): Promise<CanonicalVisualCalibrationObjectiveQaConsumerReceipt> {
  assertInput(input)
  if (
    context.env.nodeEnv === 'production' ||
    !context.env.allowInternalTestExecutionWithSupabase
  ) throw invalid('Objective-QA receipt projection is private internal-test only.')
  const actorUserId = getRequiredAuthUserId(context)
  const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'read')
  if (access.userId !== actorUserId) throw invalid('QA receipt actor changed.')
  const artifactAuthority = await createPrivateArtifactQaAuthorityService(context)
    .readArtifactAuthority({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      snapshotId: input.approvedPlanSnapshotId,
      jobId: input.qaJobId,
      expectedAssetId: input.qaExpectedAssetId,
      artifactId: input.qaArtifactId,
      purpose: 'read_private_artifact_qa_authority',
    })
  const artifact = artifactAuthority.artifact
  const qaEvaluation = artifactAuthority.qaEvaluation
  const reconciliation = artifactAuthority.reconciliation
  const run = artifact.actualRunEvidence
  if (
    run.state !== 'actual_run_evidence_verified_v2' ||
    run.runnerClass !== 'offline_media_binary_execution_v1' ||
    !qaEvaluation || qaEvaluation.outcome !== 'passed' ||
    !reconciliation ||
    reconciliation.decision !== 'test_merged_not_live_authorized' ||
    !reconciliation.privateTestDependencySatisfied ||
    artifact.content.contentType !== 'application/json'
  ) throw invalid('Objective-QA artifact is not exact reconciled private evidence.')

  const authority = await createEditPlanningAuthorityService(context)
    .loadApprovedExecutionAuthority(
      input.approvedPlanSnapshotId,
      input.workspaceId,
    )
  const qaWorkItem = authority.workItems.find((candidate) =>
    candidate.id === artifact.lineage.approvedWorkItemId)
  const qaJob = authority.jobs.find((candidate) =>
    candidate.id === input.qaJobId)
  if (!qaWorkItem || !qaJob || qaJob.approvedWorkItemId !== qaWorkItem.id) {
    throw invalid('Objective-QA work-item and job authority disappeared.')
  }
  const planning = assertCanonicalVisualCalibrationObjectiveQaWorkItem(qaWorkItem)
  const providerWorkItem = authority.workItems.find((candidate) =>
    candidate.workItemKey === planning.sourceProviderWorkItemKey)
  const providerJob = authority.jobs.find((candidate) =>
    candidate.approvedWorkItemId === providerWorkItem?.id)
  const providerExpectedAsset = authority.assetManifest.entries.find((candidate) =>
    candidate.approvedWorkItemId === providerWorkItem?.id &&
    candidate.outputKey === planning.sourceProviderExpectedOutputId)
  if (
    !providerWorkItem || !providerJob || !providerExpectedAsset ||
    stableAuthorityStringify(qaJob.dependencyJobIds) !==
      stableAuthorityStringify([providerJob.id])
  ) throw invalid('Objective-QA provider dependency changed after approval.')

  const stored = await readCanonicalStructuredJsonArtifact({
    localStorageRoot: context.env.localStorageRoot,
    privateObjectIdentityHash:
      artifact.storageIdentity.opaqueObjectIdentityHash,
  })
  if (
    !stored || stored.sha256 !== artifact.content.sha256 ||
    stored.byteLength !== artifact.content.byteLength
  ) throw invalid('Objective-QA JSON changed after reconciliation.')

  const resource = await readPrivateWorkerResourceUsageCostEvidence({
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId: actorUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    executionAttemptId: run.executionAttemptId,
  })
  if (
    !resource ||
    resource.identity.approvedPlanSnapshotId !== input.approvedPlanSnapshotId ||
    resource.identity.approvedWorkItemId !== qaWorkItem.id ||
    resource.identity.jobId !== input.qaJobId ||
    resource.identity.dispatchGrantId !== run.dispatchGrantId ||
    resource.operation.kind !== 'registered_tool_operation' ||
    resource.operation.canonicalToolId !== 'ffmpeg' ||
    resource.operation.operationId !==
      'tool.ffmpeg.execute_approved_media_recipe.v1' ||
    resource.input.artifacts.length !== 3 ||
    resource.output.artifacts.length !== 1 ||
    resource.output.artifacts[0]?.artifactId !== artifact.artifactId ||
    resource.output.artifacts[0]?.sha256 !== artifact.content.sha256 ||
    resource.output.artifacts[0]?.byteLength !== artifact.content.byteLength ||
    resource.infrastructureCost.providerCostIncluded ||
    resource.commercialBoundary.customerPriceIncluded ||
    resource.commercialBoundary.customerCreditsIncluded ||
    resource.commercialBoundary.serviceFeeIncluded
  ) throw invalid('Objective-QA worker usage evidence lost exact cost authority.')

  const providerArtifactId = resource.input.artifacts[0]!.artifactId
  const providerAuthority = await createPrivateArtifactQaAuthorityService(context)
    .readArtifactAuthority({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      snapshotId: input.approvedPlanSnapshotId,
      jobId: providerJob.id,
      expectedAssetId: providerExpectedAsset.id,
      artifactId: providerArtifactId,
      purpose: 'read_private_artifact_qa_authority',
    })
  const provider =
    await verifyCanonicalPrivateVisualCalibrationProviderOutputArtifact({
      localStorageRoot: context.env.localStorageRoot,
      ownerUserId: actorUserId,
      artifact: providerAuthority.artifact,
    })
  if (
    provider.qaApprovedWorkItemId !== qaWorkItem.id ||
    provider.qaExpectedAssetId !== input.qaExpectedAssetId ||
    provider.providerJobId !== providerJob.id ||
    provider.providerExpectedAssetId !== providerExpectedAsset.id ||
    provider.visualCalibrationContextDigest !==
      planning.visualCalibrationContextDigest ||
    provider.providerCostMicros === null
  ) throw invalid('Objective-QA provider receipt changed after execution.')

  const referenceFrames = await readCanonicalVisualCalibrationReferenceFrames({
    port: context.canonicalVisualCalibrationReferenceFrameReaderPort,
    request: {
      ownerUserId: actorUserId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      approvedWorkItemId: qaWorkItem.id,
      jobId: input.qaJobId,
      executionAttemptId: run.executionAttemptId,
      visualCalibrationContextDigest:
        planning.visualCalibrationContextDigest,
      firstFrame: {
        assetId: planning.firstFrameReference.assetId,
        expectedAssetVersionId:
          planning.firstFrameReference.assetVersionId,
        expectedSha256: planning.firstFrameReference.expectedSha256,
      },
      lastFrame: {
        assetId: planning.lastFrameReference.assetId,
        expectedAssetVersionId:
          planning.lastFrameReference.assetVersionId,
        expectedSha256: planning.lastFrameReference.expectedSha256,
      },
    },
  })
  const expectedInputs = [
    {
      artifactId: providerArtifactId,
      sha256: provider.sha256,
      byteLength: provider.byteLength,
    },
    frameResourceIdentity(referenceFrames.firstFrame),
    frameResourceIdentity(referenceFrames.lastFrame),
  ]
  if (stableAuthorityStringify(resource.input.artifacts) !==
    stableAuthorityStringify(expectedInputs)) {
    throw invalid('Objective-QA input manifest changed after execution.')
  }

  const request = buildOfflineMediaBinaryVisualCalibrationObjectiveQaRequest({
    sourceProviderOperationId:
      'provider.google.generate_visual_calibration_candidate.v1',
    sourceProviderOutputRole: 'provider_visual_calibration_video_mp4',
    visualCalibrationContextDigest: planning.visualCalibrationContextDigest,
    scenarioKind: planning.calibrationScenarioKind,
    candidate: {
      byteLength: provider.byteLength,
      sha256: provider.sha256,
      privateObjectIdentityHash: provider.privateObjectIdentityHash,
    },
    firstFrame: frameRequestIdentity(referenceFrames.firstFrame),
    lastFrame: frameRequestIdentity(referenceFrames.lastFrame),
  })
  const measurements = validateStoredDocument(stored.document, request)
  if (
    resource.attemptInputHash !==
      String(stored.document.requestEnvelopeSha256) ||
    resource.infrastructureCost.actualInternalCostMicros >
      planning.maximumAuthorizedInfrastructureCostMicros
  ) throw invalid('Objective-QA request or cost exceeded approved authority.')

  const leaseAggregate = await readPrivateCanonicalWorkerLeaseAggregate({
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId: actorUserId,
    workspaceId: input.workspaceId,
  })
  const lease = leaseAggregate?.leases.find((candidate) =>
    candidate.id === resource.identity.leaseId)
  const dispatchAggregate = await readPrivateCanonicalToolDispatchAggregate({
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId: actorUserId,
    workspaceId: input.workspaceId,
  })
  const dispatch = dispatchAggregate?.grants.find((candidate) =>
    candidate.id === resource.identity.dispatchGrantId)
  if (
    !lease || !dispatch || lease.status !== 'active' ||
    lease.immutableLeaseHash !== resource.identity.leaseHash ||
    lease.executionFence.state !== 'completed' ||
    lease.executionFence.executionAttemptId !== run.executionAttemptId ||
    !lease.executionFence.startedAt || !lease.executionFence.completedAt ||
    dispatch.status !== 'consumed' || !dispatch.consumedAt ||
    dispatch.immutableGrantHash !== resource.identity.dispatchGrantHash ||
    dispatch.binding.approvedWorkItemId !== qaWorkItem.id ||
    dispatch.binding.expectedAssetId !== input.qaExpectedAssetId ||
    dispatch.binding.operationId !==
      'tool.ffmpeg.execute_approved_media_recipe.v1' ||
    dispatch.binding.costAuthorizationClass !==
      'approved_internal_production_cost_only' ||
    dispatch.binding.maximumCreditBudget !== 0 ||
    dispatch.binding.leaseId !== lease.id
  ) throw invalid('Objective-QA lease or one-use dispatch changed after completion.')

  const first = safeReferenceFrame(referenceFrames.firstFrame)
  const last = safeReferenceFrame(referenceFrames.lastFrame)
  const gates = projectGates(measurements, request.qualityThresholds,
    Number(stored.document.effectiveMaximumFrozenFrameRatioMillionths))
  const withoutHash = {
    schemaVersion:
      CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_CONSUMER_RECEIPT_VERSION,
    source:
      'canonical_backend_private_visual_calibration_qa_projection' as const,
    identity: {
      ownerUserId: actorUserId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      approvedPlanSnapshotHash: resource.identity.approvedPlanSnapshotHash,
      packageRecordId: resource.identity.packageRecordId,
      packageHash: resource.identity.packageHash,
      qaApprovedWorkItemId: qaWorkItem.id,
      qaApprovedWorkItemHash: resource.identity.approvedWorkItemHash,
      qaJobId: input.qaJobId,
      qaExpectedAssetId: input.qaExpectedAssetId,
      motionStudioProductionId: planning.motionStudioProductionId,
      styleCalibrationPlanId: planning.styleCalibrationPlanId,
      styleCalibrationPlanDigest: planning.styleCalibrationPlanDigest,
      calibrationScenarioId: planning.calibrationScenarioId,
      calibrationScenarioKind: planning.calibrationScenarioKind,
      calibrationScenarioDigest: planning.calibrationScenarioDigest,
      visualCalibrationContextDigest: planning.visualCalibrationContextDigest,
    },
    providerInput: {
      operationId:
        'provider.google.generate_visual_calibration_candidate.v1' as const,
      providerJobId: provider.providerJobId,
      providerApprovedWorkItemId: provider.providerApprovedWorkItemId,
      providerExpectedAssetId: provider.providerExpectedAssetId,
      providerArtifactId,
      providerOutputId: provider.outputId,
      providerReceiptHash: provider.providerReceiptHash,
      providerAttemptSourceDigest: provider.providerAttemptSourceDigest,
      providerOutputSetDigest: provider.providerOutputSetDigest,
      providerQueueClaimId: provider.providerQueueClaimId,
      providerQueueClaimHash: provider.providerQueueClaimHash,
      contentSha256: provider.sha256,
      byteLength: provider.byteLength,
      privateObjectIdentityHash: provider.privateObjectIdentityHash,
      checksumReadbackVerified: true as const,
    },
    execution: {
      operationId:
        'tool.ffmpeg.execute_approved_media_recipe.v1' as const,
      executionOperation:
        CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_EXECUTION_OPERATION,
      operationProfileId:
        'approved_visual_calibration_candidate_objective_qa_v1' as const,
      runnerClass: 'offline_media_binary_execution_v1' as const,
      runnerProfileId:
        'offline_media_binary_visual_calibration_candidate_qa_v1' as const,
      leaseId: lease.id,
      leaseHash: lease.immutableLeaseHash,
      attemptOrdinal: lease.attemptNumber,
      executionAttemptId: run.executionAttemptId,
      executionStartedAt: lease.executionFence.startedAt,
      executionCompletedAt: lease.executionFence.completedAt,
      dispatchGrantId: dispatch.id,
      dispatchGrantHash: dispatch.immutableGrantHash,
      dispatchConsumptionCount: 1 as const,
      singleUseDispatchVerified: true as const,
    },
    referenceFrames: { first, last },
    measurements,
    gates,
    technicalQa: {
      status: measurements.passed ? 'passed' as const : 'failed' as const,
      qaReportIntegrityVerified: true as const,
      privateTestCandidateEvidenceEligible: measurements.passed,
      productionCandidateEvidenceAuthorized: false as const,
    },
    privateArtifact: {
      artifactId: artifact.artifactId,
      qaEvaluationId: qaEvaluation.qaEvaluationId,
      reconciliationId: reconciliation.reconciliationId,
      contentType: 'application/json' as const,
      contentSha256: artifact.content.sha256,
      byteLength: artifact.content.byteLength,
      privateObjectIdentityHash:
        artifact.storageIdentity.opaqueObjectIdentityHash,
      checksumReadbackVerified: true as const,
      providerUrlPersisted: false as const,
      localPathProjected: false as const,
    },
    internalCost: {
      providerAttemptEvidenceHash: provider.providerAttemptCostEvidenceHash,
      providerUsageEvidenceDigest: provider.providerUsageEvidenceDigest,
      providerRateCardDigest: provider.providerRateCardDigest,
      providerCostMicros: provider.providerCostMicros,
      providerWorkerInfrastructureEvidenceHash:
        provider.providerWorkerInfrastructureEvidenceHash,
      providerWorkerInfrastructureRateCardDigest:
        provider.providerWorkerInfrastructureRateCardDigest,
      providerWorkerInfrastructureCostMicros:
        provider.providerWorkerInfrastructureCostMicros,
      qaInfrastructureEvidenceHash: resource.evidenceHash,
      qaInfrastructureRateCardDigest:
        resource.infrastructureCost.rateCardDigest,
      qaInfrastructureCostMicros:
        resource.infrastructureCost.actualInternalCostMicros,
      maximumAuthorizedQaInfrastructureCostMicros:
        planning.maximumAuthorizedInfrastructureCostMicros,
      qaCostAuthorizationClass:
        'approved_internal_production_cost_only' as const,
      qaCustomerCreditBudget: 0 as const,
      approvedSnapshotAndActiveReservationRequired: true as const,
      selectedTotalInternalCostMicros:
        provider.providerCostMicros +
        provider.providerWorkerInfrastructureCostMicros +
        resource.infrastructureCost.actualInternalCostMicros,
      providerAndQaCostComponentsSeparate: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
    },
    evidenceClass: 'private_injected_nonprovider_test' as const,
    promotionClass: 'non_promotable_private_injected' as const,
    boundaries: {
      canonicalBackendVerifiedRuntime: false as const,
      promotionAuthorized: false as const,
      productionReady: false as const,
      providerCallMadeByQa: false as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
      renderExecuted: false as const,
      finalExportExecuted: false as const,
      publicDeliveryAuthorized: false as const,
    },
    completedAt: reconciliation.createdAt,
  }
  return {
    ...withoutHash,
    receiptHash: sha256AuthorityValue(withoutHash),
  }
}

function validateStoredDocument(
  document: Readonly<Record<string, unknown>>,
  request: ReturnType<
    typeof buildOfflineMediaBinaryVisualCalibrationObjectiveQaRequest
  >,
): OfflineMediaBinaryVisualCalibrationObjectiveQaResultDocument {
  const keys = [
    'schemaVersion', 'passed', 'containerIntegrity', 'videoStreamCount',
    'audioStreamCount', 'width', 'height', 'frameRateNumerator',
    'frameRateDenominator', 'frameCount', 'durationMilliseconds',
    'blackFrameRatioMillionths', 'frozenFrameRatioMillionths',
    'maximumFrozenRunFrames', 'motionSignalRatioMillionths',
    'firstFrameSimilarityMillionths', 'lastFrameSimilarityMillionths',
    'blackDetectEvidenceSha256', 'freezeDetectEvidenceSha256',
    'decodedFrameHashEvidenceSha256',
  ] as const
  const core = Object.fromEntries(keys.map((key) => [key, document[key]]))
  const result = validateOfflineMediaBinaryVisualCalibrationObjectiveQaResult(
    core,
    request,
  )
  if (
    document.requestEnvelopeSha256 !== sha256AuthorityValue(request) ||
    document.recipeProfileId !== request.recipeProfileId ||
    document.runnerProfileId !== request.runnerProfileId ||
    document.sourceProviderOperationId !== request.sourceProviderOperationId ||
    document.sourceProviderOutputRole !== request.sourceProviderOutputRole ||
    document.visualCalibrationContextDigest !==
      request.visualCalibrationContextDigest ||
    document.scenarioKind !== request.scenarioKind ||
    stableAuthorityStringify(document.candidate) !==
      stableAuthorityStringify(request.candidate) ||
    stableAuthorityStringify(document.firstFrame) !==
      stableAuthorityStringify(request.firstFrame) ||
    stableAuthorityStringify(document.lastFrame) !==
      stableAuthorityStringify(request.lastFrame) ||
    stableAuthorityStringify(document.mediaBounds) !==
      stableAuthorityStringify(request.mediaBounds) ||
    stableAuthorityStringify(document.qualityThresholds) !==
      stableAuthorityStringify(request.qualityThresholds) ||
    document.providerCostIncluded !== false ||
    document.customerPriceIncluded !== false ||
    document.customerCreditsIncluded !== false ||
    document.serviceFeeIncluded !== false ||
    document.mediaMutationPerformed !== false ||
    typeof document.evaluatedAt !== 'string' ||
    !Number.isFinite(Date.parse(document.evaluatedAt))
  ) throw invalid('Stored objective-QA document lost exact request authority.')
  return result
}

function projectGates(
  result: OfflineMediaBinaryVisualCalibrationObjectiveQaResultDocument,
  thresholds: ReturnType<
    typeof buildOfflineMediaBinaryVisualCalibrationObjectiveQaRequest
  >['qualityThresholds'],
  effectiveMaximumFrozenRatio: number,
): CanonicalVisualCalibrationObjectiveQaConsumerReceipt['gates'] {
  const status = (passed: boolean) => passed ? 'passed' as const : 'failed' as const
  return [
    { gateId: 'container_integrity', status: status(result.containerIntegrity) },
    { gateId: 'video_stream_present', status: status(result.videoStreamCount === 1) },
    { gateId: 'dimensions_within_authority', status: status(
      result.width * result.height <= 921_600) },
    { gateId: 'duration_within_authority', status: status(
      result.durationMilliseconds >= 3_000 &&
      result.durationMilliseconds <= 10_000) },
    { gateId: 'frame_rate_within_authority', status: status(
      result.frameRateNumerator === 24 && result.frameRateDenominator === 1) },
    { gateId: 'black_frame_scan', status: status(
      result.blackFrameRatioMillionths <=
        thresholds.maximumBlackFrameRatioMillionths) },
    { gateId: 'freeze_frame_scan', status: status(
      result.frozenFrameRatioMillionths <= effectiveMaximumFrozenRatio &&
      result.maximumFrozenRunFrames <= thresholds.maximumFrozenRunFrames) },
    { gateId: 'motion_signal_present', status: status(
      result.motionSignalRatioMillionths >=
        thresholds.minimumMotionSignalRatioMillionths) },
    { gateId: 'first_frame_similarity', status: status(
      result.firstFrameSimilarityMillionths >=
        thresholds.minimumFirstFrameSimilarityMillionths) },
    { gateId: 'last_frame_similarity', status: status(
      result.lastFrameSimilarityMillionths >=
        thresholds.minimumLastFrameSimilarityMillionths) },
  ]
}

function safeReferenceFrame(
  value: Awaited<ReturnType<
    typeof readCanonicalVisualCalibrationReferenceFrames
  >>['firstFrame'],
): SafeReferenceFrameReceipt {
  return {
    assetId: value.assetId,
    assetVersionId: value.assetVersionId,
    sha256: value.sha256,
    byteLength: value.byteLength,
    privateObjectIdentityHash: value.privateObjectIdentityHash,
    storageEvidenceHash: value.storageEvidenceHash,
    readbackEvidenceHash: value.readbackEvidenceHash,
    checksumReadbackVerified: true,
  }
}

function frameRequestIdentity(
  value: Awaited<ReturnType<
    typeof readCanonicalVisualCalibrationReferenceFrames
  >>['firstFrame'],
) {
  return {
    assetId: value.assetId,
    assetVersionId: value.assetVersionId,
    byteLength: value.byteLength,
    sha256: value.sha256,
    privateObjectIdentityHash: value.privateObjectIdentityHash,
  }
}

function frameResourceIdentity(
  value: Awaited<ReturnType<
    typeof readCanonicalVisualCalibrationReferenceFrames
  >>['firstFrame'],
) {
  return {
    artifactId: value.assetId,
    sha256: value.sha256,
    byteLength: value.byteLength,
  }
}

function assertInput(
  input: ReadCanonicalVisualCalibrationObjectiveQaReceiptInput,
): void {
  for (const value of Object.values(input)) {
    if (
      value !== value.trim() || value.length < 1 || value.length > 240 ||
      !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(value) || value.includes('..')
    ) throw invalid('Objective-QA receipt identity is invalid.')
  }
}

function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate:
      'canonical_visual_calibration_objective_qa_consumer_receipt',
    thresholdVersion:
      CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_THRESHOLD_VERSION,
    costProfileId: CANONICAL_VISUAL_CALIBRATION_OBJECTIVE_QA_COST_PROFILE_ID,
    productionReady: false,
  })
}
