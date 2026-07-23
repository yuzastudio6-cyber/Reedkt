import { z } from 'zod'

import {
  assertCanonicalVisualCalibrationObjectiveQaWorkItem,
  type CanonicalVisualCalibrationObjectiveQaWorkItem,
} from '../../edit-architecture/canonical-visual-calibration-objective-qa-authority'
import {
  createCanonicalPrivatePackageWorkQueueDefinition,
} from '../../edit-architecture/canonical-private-package-work-queue-authority'
import {
  createCanonicalPrivateResourcePlacementManifest,
} from '../../edit-architecture/canonical-private-resource-placement-authority'
import { ApiError } from '../../errors/api-error'
import {
  createCanonicalEditExecutionPackageService,
} from '../../services/canonical-edit-execution-package-service'
import {
  readCanonicalVisualCalibrationObjectiveQaConsumerReceipt,
  type CanonicalVisualCalibrationObjectiveQaConsumerReceipt,
} from '../../services/canonical-private-visual-calibration-objective-qa-consumer-receipt-service'
import {
  verifyCanonicalPrivateVisualCalibrationProviderOutputArtifact,
  type VerifiedCanonicalPrivateVisualCalibrationProviderOutputArtifact,
} from '../../services/canonical-private-visual-calibration-provider-output-artifact-verifier'
import { createEditPlanningAuthorityService } from
  '../../services/edit-planning-authority-service'
import { createPrivateArtifactQaAuthorityService } from
  '../../services/private-artifact-qa-authority-service'
import {
  findCurrentPrivateTestSelection,
  readPrivateArtifactQaAggregate,
  verifyAllPrivateArtifactQaEvidenceBlobs,
} from '../../services/private-artifact-qa-authority-store'
import {
  readPrivateCanonicalPackageWorkQueue,
} from '../../services/private-canonical-package-work-queue-store'
import { getRequiredAuthUserId } from '../../services/service-helpers'
import {
  readPrivateWorkerResourceUsageCostEvidence,
  type PrivateWorkerResourceUsageCostEvidence,
} from '../../tool-cost-metering/private-worker-resource-usage-cost-evidence'
import type { ServiceContext } from '../../types'
import type { PersistedArtifactResult } from
  '../../validation/private-artifact-qa-authority-schemas'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type {
  MotionStudioVisualCalibrationObjectiveQaPortReceipt,
  MotionStudioVisualCalibrationObjectiveQaReaderPort,
} from './canonical-provider-calibration-candidate-objective-qa'
import {
  canonicalProviderCalibrationCandidateSourceReceiptSchema,
  type CanonicalProviderCalibrationCandidateSourceReceipt,
} from './canonical-provider-calibration-candidate-source-verifier'
import {
  createCanonicalStorytellingCalibrationFrameAuthorityReader,
  type CanonicalStorytellingCalibrationFrameAuthority,
} from './canonical-storytelling-calibration-frame-authority-reader'

const PORT_VERSION =
  'motion-studio.visual-calibration-objective-qa-port.v1' as const
const THRESHOLD_VERSION =
  'motion-studio.visual-calibration-objective-qa-thresholds.2026-07-21.v1' as const
const OPERATION_ID = 'tool.ffmpeg.execute_approved_media_recipe.v1' as const
const EXECUTION_OPERATION =
  'run_visual_calibration_candidate_objective_qa' as const
const PROFILE_ID =
  'approved_visual_calibration_candidate_objective_qa_v1' as const
const RUNNER_CLASS =
  'offline_media_binary_visual_calibration_candidate_qa_v1' as const
const COST_PROFILE_ID =
  'ffmpeg_visual_calibration_candidate_objective_qa_cpu_2vcpu_2gib_v1' as const
const GATE_IDS = [
  'container_integrity',
  'video_stream_present',
  'dimensions_within_authority',
  'duration_within_authority',
  'frame_rate_within_authority',
  'black_frame_scan',
  'freeze_frame_scan',
  'motion_signal_present',
  'first_frame_similarity',
  'last_frame_similarity',
] as const

const readerInputSchema = z.object({
  sourceReceipt: canonicalProviderCalibrationCandidateSourceReceiptSchema,
}).strict()

interface ReaderInput {
  sourceReceipt: CanonicalProviderCalibrationCandidateSourceReceipt
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedSnapshotId: string
  sourceReceiptDigest: string
  providerOutputId: string
}
type GateId = typeof GATE_IDS[number]

interface ExactQaSelection {
  receipt: CanonicalVisualCalibrationObjectiveQaConsumerReceipt
  qaArtifact: PersistedArtifactResult
  provider:
    VerifiedCanonicalPrivateVisualCalibrationProviderOutputArtifact
  providerStartedAt: string
  providerCompletedAt: string
  resource: PrivateWorkerResourceUsageCostEvidence
  frameAuthority: CanonicalStorytellingCalibrationFrameAuthority
  queueClaimId: string
}

/**
 * Builds the server-owned Motion projection over the one canonical dependent
 * objective-QA lifecycle. Discovery is derived from the approved snapshot,
 * current reconciled private artifacts, and exact provider output. Callers do
 * not select jobs, attempts, leases, artifacts, paths, or cost evidence.
 */
export function createCanonicalMotionStudioVisualCalibrationObjectiveQaReader(
  context: ServiceContext,
): MotionStudioVisualCalibrationObjectiveQaReaderPort {
  return {
    async read(input) {
      const parsed = parseReaderInput(input)
      if (!parsed) return null
      const selection = await readExactQaSelection(context, parsed)
      return selection
        ? projectPortReceipt(parsed, selection)
        : null
    },
  }
}

async function readExactQaSelection(
  context: ServiceContext,
  input: ReaderInput,
): Promise<ExactQaSelection | null> {
  const ownerUserId = getRequiredAuthUserId(context)
  const authority = await createEditPlanningAuthorityService(context)
    .loadApprovedExecutionAuthority(
      input.approvedSnapshotId,
      input.workspaceId,
    )
  const scope = {
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId,
    workspaceId: input.workspaceId,
  }
  const aggregate = await readPrivateArtifactQaAggregate(scope)
  if (!aggregate) return null
  await verifyAllPrivateArtifactQaEvidenceBlobs({ scope, aggregate })

  const matches: Array<{
    receipt: CanonicalVisualCalibrationObjectiveQaConsumerReceipt
    qaArtifact: PersistedArtifactResult
    provider:
      VerifiedCanonicalPrivateVisualCalibrationProviderOutputArtifact
    providerStartedAt: string
    providerCompletedAt: string
  }> = []
  for (const workItem of authority.workItems) {
    if (
      workItem.workItemType !== 'run_asset_qa' ||
      workItem.executionInput.operation !== EXECUTION_OPERATION
    ) continue
    const planning = assertCanonicalVisualCalibrationObjectiveQaWorkItem(
      workItem as CanonicalVisualCalibrationObjectiveQaWorkItem,
    )
    const qaJobs = authority.jobs.filter((job) =>
      job.approvedWorkItemId === workItem.id)
    if (qaJobs.length !== 1) {
      throw invalid(
        'Visual-calibration objective-QA work item lost its exact job.',
      )
    }
    const qaJob = qaJobs[0]!
    if (qaJob.expectedAssetIds.length !== 1) {
      throw invalid(
        'Visual-calibration objective-QA job lost its exact output.',
      )
    }
    const qaExpectedAssetId = qaJob.expectedAssetIds[0]!

    const providerWorkItems = authority.workItems.filter((candidate) =>
      candidate.workItemKey === planning.sourceProviderWorkItemKey)
    if (providerWorkItems.length !== 1) {
      throw invalid(
        'Visual-calibration objective-QA job lost its provider dependency.',
      )
    }
    const providerWorkItem = providerWorkItems[0]!
    const providerJobs = authority.jobs.filter((job) =>
      job.approvedWorkItemId === providerWorkItem.id)
    if (providerJobs.length !== 1) {
      throw invalid(
        'Visual-calibration provider work item lost its exact job.',
      )
    }
    const providerJob = providerJobs[0]!
    if (providerJob.expectedAssetIds.length !== 1) {
      throw invalid(
        'Visual-calibration provider job lost its exact output.',
      )
    }
    const providerExpectedAssetId = providerJob.expectedAssetIds[0]!
    const providerSelection = findCurrentPrivateTestSelection({
      aggregate,
      identity: {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        snapshotId: input.approvedSnapshotId,
        jobId: providerJob.id,
        expectedAssetId: providerExpectedAssetId,
      },
    })
    if (!providerSelection) continue
    const providerAuthority = await createPrivateArtifactQaAuthorityService(
      context,
    ).readArtifactAuthority({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      snapshotId: input.approvedSnapshotId,
      jobId: providerJob.id,
      expectedAssetId: providerExpectedAssetId,
      artifactId: providerSelection.artifact.artifactId,
      purpose: 'read_private_artifact_qa_authority',
    })
    const provider =
      await verifyCanonicalPrivateVisualCalibrationProviderOutputArtifact({
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId,
        artifact: providerAuthority.artifact,
      })
    const providerRun = providerAuthority.artifact.actualRunEvidence
    if (
      providerRun.state !== 'actual_provider_attempt_receipt_verified_v1' ||
      providerRun.providerOperationId !==
        'provider.google.generate_visual_calibration_candidate.v1' ||
      Date.parse(providerRun.finishedAt) < Date.parse(providerRun.startedAt)
    ) {
      throw invalid(
        'Visual-calibration provider timing evidence is invalid.',
      )
    }
    if (provider.outputId !== input.providerOutputId) continue

    const qaSelection = findCurrentPrivateTestSelection({
      aggregate,
      identity: {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        snapshotId: input.approvedSnapshotId,
        jobId: qaJob.id,
        expectedAssetId: qaExpectedAssetId,
      },
    })
    if (!qaSelection) continue
    const receipt =
      await readCanonicalVisualCalibrationObjectiveQaConsumerReceipt(
        context,
        {
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          approvedPlanSnapshotId: input.approvedSnapshotId,
          qaJobId: qaJob.id,
          qaExpectedAssetId,
          qaArtifactId: qaSelection.artifact.artifactId,
        },
      )
    if (
      receipt.providerInput.providerOutputId !== input.providerOutputId ||
      receipt.providerInput.providerArtifactId !==
        providerSelection.artifact.artifactId ||
      receipt.identity.qaApprovedWorkItemId !== workItem.id ||
      receipt.identity.qaJobId !== qaJob.id ||
      receipt.identity.qaExpectedAssetId !== qaExpectedAssetId
    ) {
      throw invalid(
        'Visual-calibration objective-QA receipt changed its exact dependency.',
      )
    }
    matches.push({
      receipt,
      qaArtifact: qaSelection.artifact,
      provider,
      providerStartedAt: providerRun.startedAt,
      providerCompletedAt: providerRun.finishedAt,
    })
  }
  if (matches.length === 0) return null
  if (matches.length !== 1) {
    throw invalid(
      'More than one current objective-QA result matches the provider output.',
    )
  }
  const match = matches[0]!
  const resource = await readPrivateWorkerResourceUsageCostEvidence({
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    executionAttemptId: match.receipt.execution.executionAttemptId,
  })
  if (
    !resource ||
    resource.evidenceHash !==
      match.receipt.internalCost.qaInfrastructureEvidenceHash ||
    resource.infrastructureCost.rateCardDigest !==
      match.receipt.internalCost.qaInfrastructureRateCardDigest ||
    resource.infrastructureCost.actualInternalCostMicros !==
      match.receipt.internalCost.qaInfrastructureCostMicros ||
    resource.operation.kind !== 'registered_tool_operation' ||
    resource.operation.operationId !== OPERATION_ID ||
    resource.identity.approvedPlanSnapshotId !== input.approvedSnapshotId ||
    resource.identity.jobId !== match.receipt.identity.qaJobId ||
    resource.identity.leaseId !== match.receipt.execution.leaseId ||
    resource.identity.dispatchGrantId !==
      match.receipt.execution.dispatchGrantId ||
    resource.output.artifacts[0]?.artifactId !==
      match.qaArtifact.artifactId ||
    resource.output.artifacts[0]?.sha256 !==
      match.qaArtifact.content.sha256
  ) {
    throw invalid(
      'Visual-calibration objective-QA resource evidence changed after receipt projection.',
    )
  }
  if (
    match.provider.providerAttemptSourceDigest !==
      match.receipt.providerInput.providerAttemptSourceDigest ||
    match.provider.sha256 !== match.receipt.providerInput.contentSha256 ||
    match.provider.byteLength !== match.receipt.providerInput.byteLength ||
    match.provider.privateObjectIdentityHash !==
      match.receipt.providerInput.privateObjectIdentityHash ||
    match.provider.workspaceId !== input.workspaceId ||
    match.provider.projectId !== input.projectId ||
    match.provider.editSessionId !== input.editSessionId ||
    match.provider.approvedPlanSnapshotId !== input.approvedSnapshotId ||
    match.provider.approvedPlanSnapshotHash !==
      match.receipt.identity.approvedPlanSnapshotHash ||
    match.provider.productionId !==
      match.receipt.identity.motionStudioProductionId ||
    match.provider.styleCalibrationPlanId !==
      match.receipt.identity.styleCalibrationPlanId ||
    match.provider.styleCalibrationPlanDigest !==
      match.receipt.identity.styleCalibrationPlanDigest ||
    match.provider.calibrationScenarioId !==
      match.receipt.identity.calibrationScenarioId ||
    match.provider.calibrationScenarioKind !==
      match.receipt.identity.calibrationScenarioKind
  ) {
    throw invalid(
      'Visual-calibration provider attempt source changed after objective QA.',
    )
  }
  const frameAuthority = await
    createCanonicalStorytellingCalibrationFrameAuthorityReader(context).read({
      approvedSnapshotId: input.approvedSnapshotId,
      workspaceId: input.workspaceId,
    })
  if (
    frameAuthority.workspaceId !== input.workspaceId ||
    frameAuthority.projectId !== input.projectId ||
    frameAuthority.editSessionId !== input.editSessionId ||
    frameAuthority.approvedSnapshotDigest !==
      match.receipt.identity.approvedPlanSnapshotHash ||
    frameAuthority.productionId !==
      match.receipt.identity.motionStudioProductionId ||
    frameAuthority.storytellingStyleComponentDigest !==
      match.provider.styleAuthorityHash ||
    frameAuthority.storytellingProductionAuthorityRefDigest !==
      match.provider.productionAuthorityHash
  ) {
    throw invalid(
      'Visual-calibration frame authority changed after objective QA.',
    )
  }
  assertSourceReceiptMatchesSelection({
    sourceReceipt: input.sourceReceipt,
    receipt: match.receipt,
    provider: match.provider,
    frameAuthority,
    providerStartedAt: match.providerStartedAt,
    providerCompletedAt: match.providerCompletedAt,
  })
  const queueClaimId = await readExactQueueClaim({
    context,
    ownerUserId,
    input,
    receipt: match.receipt,
    qaArtifact: match.qaArtifact,
  })
  return { ...match, resource, frameAuthority, queueClaimId }
}

function assertSourceReceiptMatchesSelection(input: {
  sourceReceipt: CanonicalProviderCalibrationCandidateSourceReceipt
  receipt: CanonicalVisualCalibrationObjectiveQaConsumerReceipt
  provider: VerifiedCanonicalPrivateVisualCalibrationProviderOutputArtifact
  frameAuthority: CanonicalStorytellingCalibrationFrameAuthority
  providerStartedAt: string
  providerCompletedAt: string
}): void {
  const {
    sourceReceipt: source,
    receipt,
    provider,
    frameAuthority,
    providerStartedAt,
    providerCompletedAt,
  } = input
  const output = source.canonicalAttempt.privateOutput
  if (
    !output ||
    source.identity.ownerUserId !== receipt.identity.ownerUserId ||
    source.identity.workspaceId !== receipt.identity.workspaceId ||
    source.identity.projectId !== receipt.identity.projectId ||
    source.identity.editSessionId !== receipt.identity.editSessionId ||
    source.identity.productionId !== receipt.identity.motionStudioProductionId ||
    source.identity.approvedSnapshotId !==
      receipt.identity.approvedPlanSnapshotId ||
    source.identity.approvedSnapshotDigest !==
      receipt.identity.approvedPlanSnapshotHash ||
    source.identity.approvedCalibrationPlanId !==
      receipt.identity.styleCalibrationPlanId ||
    source.identity.approvedCalibrationPlanDigest !==
      receipt.identity.styleCalibrationPlanDigest ||
    source.identity.scenarioId !== receipt.identity.calibrationScenarioId ||
    source.identity.scenarioKind !==
      receipt.identity.calibrationScenarioKind ||
    source.identity.dispatchAttemptId !== provider.executionAttemptId ||
    source.identity.queueClaimId !== provider.providerQueueClaimId ||
    source.planningSource.visualCalibrationContextDigest !==
      receipt.identity.visualCalibrationContextDigest ||
    source.planningSource.canonicalStyleComponentDigest !==
      provider.styleAuthorityHash ||
    source.planningSource.approvedProductionFrameAuthority
      .authorityReceiptDigest !== frameAuthority.authorityReceiptDigest ||
    source.planningSource.referenceContractVersionId !==
      provider.referenceContractId ||
    source.planningSource.referenceContractDigest !==
      provider.referenceContractDigest ||
    source.planningSource.firstFrameAssetId !==
      receipt.referenceFrames.first.assetId ||
    source.planningSource.firstFrameAssetVersionId !==
      receipt.referenceFrames.first.assetVersionId ||
    source.planningSource.firstFramePrivateObjectIdentityHash !==
      receipt.referenceFrames.first.privateObjectIdentityHash ||
    source.planningSource.firstFrameSha256 !==
      receipt.referenceFrames.first.sha256 ||
    source.planningSource.lastFrameAssetId !==
      receipt.referenceFrames.last.assetId ||
    source.planningSource.lastFrameAssetVersionId !==
      receipt.referenceFrames.last.assetVersionId ||
    source.planningSource.lastFramePrivateObjectIdentityHash !==
      receipt.referenceFrames.last.privateObjectIdentityHash ||
    source.planningSource.lastFrameSha256 !==
      receipt.referenceFrames.last.sha256 ||
    source.planningSource.continuityContractId !==
      provider.continuityContractId ||
    source.planningSource.continuityContractDigest !==
      provider.continuityContractDigest ||
    source.canonicalAttempt.receiptHash !== provider.providerReceiptHash ||
    source.canonicalAttempt.providerAttemptCostEvidenceHash !==
      provider.providerAttemptCostEvidenceHash ||
    source.canonicalAttempt.workerResourceEvidenceHash !==
      provider.providerWorkerInfrastructureEvidenceHash ||
    source.canonicalAttempt.providerCostMicros !==
      provider.providerCostMicros ||
    source.canonicalAttempt.infrastructureCostMicros !==
      provider.providerWorkerInfrastructureCostMicros ||
    source.canonicalAttempt.totalInternalProductionCostMicros !==
      (provider.providerCostMicros === null
        ? null
        : provider.providerCostMicros +
          provider.providerWorkerInfrastructureCostMicros) ||
    source.canonicalAttempt.providerCostMicros !==
      receipt.internalCost.providerCostMicros ||
    source.canonicalAttempt.infrastructureCostMicros !==
      receipt.internalCost.providerWorkerInfrastructureCostMicros ||
    source.canonicalAttempt.startedAt !== providerStartedAt ||
    source.canonicalAttempt.completedAt !== providerCompletedAt ||
    output.outputId !== provider.outputId ||
    output.assetId !== provider.assetId ||
    output.assetVersionId !== provider.assetVersionId ||
    output.privateObjectIdentityHash !== provider.privateObjectIdentityHash ||
    output.contentSha256 !== provider.sha256 ||
    output.byteLength !== provider.byteLength ||
    output.storageEvidenceHash !== provider.storageEvidenceHash ||
    output.sourceReadbackEvidenceHash !==
      provider.providerCandidateReadbackEvidenceHash
  ) {
    throw invalid(
      'Visual-calibration source receipt changed before objective-QA projection.',
    )
  }
}

async function readExactQueueClaim(input: {
  context: ServiceContext
  ownerUserId: string
  input: ReaderInput
  receipt: CanonicalVisualCalibrationObjectiveQaConsumerReceipt
  qaArtifact: PersistedArtifactResult
}): Promise<string> {
  const packageRead = await createCanonicalEditExecutionPackageService(
    input.context,
  ).getPackage(
    input.receipt.identity.packageRecordId,
    input.input.workspaceId,
  )
  const executionPackage = packageRead.approvedEditExecutionPackage
  if (
    executionPackage.packageHash !== input.receipt.identity.packageHash ||
    executionPackage.approvedPlanSnapshotId !==
      input.input.approvedSnapshotId ||
    executionPackage.projectId !== input.input.projectId ||
    executionPackage.editSessionId !== input.input.editSessionId
  ) {
    throw invalid(
      'Visual-calibration objective-QA package changed before queue readback.',
    )
  }
  const placementManifest = createCanonicalPrivateResourcePlacementManifest({
    executionPackage,
    toolCapabilityManifest: packageRead.toolCapabilityManifest,
    toolExecutionAuthority: packageRead.toolExecutionAuthority,
  })
  const definition = createCanonicalPrivatePackageWorkQueueDefinition({
    executionPackage,
    placementManifest,
  })
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: {
      localStorageRoot: input.context.env.localStorageRoot,
      ownerUserId: input.ownerUserId,
      workspaceId: input.input.workspaceId,
      projectId: input.input.projectId,
      editSessionId: input.input.editSessionId,
      packageRecordId: executionPackage.packageRecordId,
      approvedPlanSnapshotId: input.input.approvedSnapshotId,
    },
    definition,
  })
  const entry = queue?.entries.find((candidate) =>
    candidate.definition.jobId === input.receipt.identity.qaJobId)
  const completion = entry?.completion
  if (
    !entry || entry.state !== 'completed' || !completion ||
    entry.definition.approvedWorkItemId !==
      input.receipt.identity.qaApprovedWorkItemId ||
    completion.outcome.jobId !== input.receipt.identity.qaJobId ||
    completion.outcome.approvedWorkItemId !==
      input.receipt.identity.qaApprovedWorkItemId ||
    completion.outcome.artifactId !== input.qaArtifact.artifactId ||
    completion.outcome.contentType !== input.qaArtifact.content.contentType ||
    completion.outcome.sha256 !== input.qaArtifact.content.sha256
  ) {
    throw invalid(
      'Visual-calibration objective-QA queue completion changed after artifact reconciliation.',
    )
  }
  return completion.claimId
}

function projectPortReceipt(
  input: ReaderInput,
  selection: ExactQaSelection,
): MotionStudioVisualCalibrationObjectiveQaPortReceipt {
  const { receipt, provider, qaArtifact, resource, frameAuthority } = selection
  if (resource.evidenceClass !== 'private_embedded_observed_usage_test') {
    throw invalid(
      'Private injected or released worker evidence cannot be relabeled as the controlled Motion QA projection.',
    )
  }
  const measurements = projectMeasurements(receipt)
  const thresholds = projectThresholds(receipt, measurements.durationFrames)
  const gateResults = projectGateResults(receipt, measurements.measurementDigest)
  const blockingIssueCodes = gateResults
    .filter((gate) => gate.status === 'failed')
    .map((gate) => `${gate.gateId}_failed`)
  const technicalQa = {
    status: receipt.technicalQa.status,
    gateResults,
    blockingIssueCodes,
    evidenceDigest: sha256CanonicalJson({
      domain: 'motion_studio_visual_calibration_objective_qa_evidence_v1',
      sourceReceiptDigest: input.sourceReceiptDigest,
      executionAttemptId: receipt.execution.executionAttemptId,
      contentSha256: provider.sha256,
      measurementDigest: measurements.measurementDigest,
      privateQaArtifactContentSha256: receipt.privateArtifact.contentSha256,
      gateResults,
      blockingIssueCodes,
      status: receipt.technicalQa.status,
    }),
  }
  const timingAuthority = structuralGatesPassed(gateResults)
    ? projectTimingAuthority({
        sourceReceiptDigest: input.sourceReceiptDigest,
        contentSha256: provider.sha256,
        frameAuthority,
        measurements,
      })
    : null
  const costEvidenceDigest = sha256CanonicalJson({
    domain: 'motion_studio_visual_calibration_objective_qa_cost_v1',
    evidenceHash: resource.evidenceHash,
    rateCardDigest: resource.infrastructureCost.rateCardDigest,
    infrastructureCostMicros:
      resource.infrastructureCost.actualInternalCostMicros,
    maximumAuthorizedInfrastructureCostMicros:
      receipt.internalCost.maximumAuthorizedQaInfrastructureCostMicros,
  })
  const base = {
    schemaVersion: PORT_VERSION,
    sourceAuthority:
      'canonical_dependent_objective_qa_read_only_projection' as const,
    evidenceClass: 'controlled_test_fixture' as const,
    identity: {
      ownerUserId: receipt.identity.ownerUserId,
      workspaceId: receipt.identity.workspaceId,
      projectId: receipt.identity.projectId,
      editSessionId: receipt.identity.editSessionId,
      productionId: receipt.identity.motionStudioProductionId,
      approvedSnapshotId: receipt.identity.approvedPlanSnapshotId,
      approvedSnapshotDigest: receipt.identity.approvedPlanSnapshotHash,
      calibrationPlanId: receipt.identity.styleCalibrationPlanId,
      calibrationPlanDigest: receipt.identity.styleCalibrationPlanDigest,
      scenarioId: receipt.identity.calibrationScenarioId,
      scenarioKind: receipt.identity.calibrationScenarioKind,
      providerDispatchAttemptId: provider.executionAttemptId,
      sourceReceiptDigest: input.sourceReceiptDigest,
    },
    input: {
      providerOutputId: provider.outputId,
      assetId: provider.assetId,
      assetVersionId: provider.assetVersionId,
      privateObjectIdentityHash: provider.privateObjectIdentityHash,
      contentSha256: provider.sha256,
      byteLength: provider.byteLength,
      mimeType: 'video/mp4' as const,
      storageEvidenceHash: provider.storageEvidenceHash,
      sourceReadbackEvidenceHash:
        provider.providerCandidateReadbackEvidenceHash,
      firstFrameReferenceSha256: receipt.referenceFrames.first.sha256,
      lastFrameReferenceSha256: receipt.referenceFrames.last.sha256,
      dependencyBytesReopened: true as const,
      dependencyChecksumReadbackVerified: true as const,
    },
    execution: {
      canonicalOperationId: OPERATION_ID,
      workItemType: 'run_asset_qa' as const,
      executionOperation: EXECUTION_OPERATION,
      operationProfileId: PROFILE_ID,
      runnerClass: RUNNER_CLASS,
      approvedWorkItemId: receipt.identity.qaApprovedWorkItemId,
      jobId: receipt.identity.qaJobId,
      executionAttemptId: receipt.execution.executionAttemptId,
      queueClaimId: selection.queueClaimId,
      leaseId: receipt.execution.leaseId,
      dispatchGrantId: receipt.execution.dispatchGrantId,
      startedAt: receipt.execution.executionStartedAt,
      completedAt: receipt.execution.executionCompletedAt,
      queueClaimLeaseAndOneUseDispatchReverified: true as const,
      terminalAttemptReverified: true as const,
      privateQaEvidenceCreateOnly: true as const,
      retryCount: 0 as const,
      fallbackCount: 0 as const,
    },
    measurements,
    thresholds,
    privateQaArtifact: {
      artifactId: receipt.privateArtifact.artifactId,
      artifactVersionId:
        `${receipt.privateArtifact.artifactId}:v${qaArtifact.artifactVersion}`,
      privateObjectIdentityHash:
        receipt.privateArtifact.privateObjectIdentityHash,
      contentSha256: receipt.privateArtifact.contentSha256,
      byteLength: receipt.privateArtifact.byteLength,
      mimeType: 'application/json' as const,
      storageEvidenceHash: qaArtifact.resultEvidenceHash,
      readbackEvidenceHash: receipt.receiptHash,
      createOnly: true as const,
      checksumReadbackVerified: true as const,
      browserProjectionContainsPrivateLocation: false as const,
    },
    technicalQa,
    timingAuthority,
    resourceUsage: {
      evidenceClass: 'private_embedded_observed_usage_test' as const,
      evidenceHash: resource.evidenceHash,
      runtimeIdentityDigest:
        resource.runtime.runtimeExecutionIdentityDigest,
      measurementAgentDigest: resource.runtime.measurementAgentDigest,
      observedCpuMicroseconds:
        resource.resourceUsage.observedCpuMicroseconds,
      observedPeakMemoryBytes:
        resource.resourceUsage.observedPeakMemoryBytes,
      wallTimeMilliseconds: resource.resourceUsage.wallTimeMilliseconds,
      operationCostProfileId: COST_PROFILE_ID,
      maximumAuthorizedInfrastructureCostMicros:
        receipt.internalCost.maximumAuthorizedQaInfrastructureCostMicros,
      infrastructureCostMicros:
        receipt.internalCost.qaInfrastructureCostMicros,
      rateCardDigest: receipt.internalCost.qaInfrastructureRateCardDigest,
      costEvidenceDigest,
    },
    boundaries: {
      sourceAndApprovedSnapshotReverified: true as const,
      canonicalOperationAuthorityReverified: true as const,
      objectiveQaOnly: true as const,
      creativeReviewPerformed: false as const,
      routingSelectionPerformed: false as const,
      fiveScenarioFinalizationPerformed: false as const,
      providerTransportActivated: false as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
      timelineMutationPerformed: false as const,
      renderOrExportPerformed: false as const,
      promotionAuthorized: false as const,
      productionReady: false as const,
    },
    immutable: true as const,
  }
  return deepFreeze({
    ...base,
    receiptDigest: sha256CanonicalJson(base),
  })
}

function projectMeasurements(
  receipt: CanonicalVisualCalibrationObjectiveQaConsumerReceipt,
) {
  const source = receipt.measurements
  const base = {
    containerFormat: source.containerIntegrity
      ? 'mp4' as const
      : 'invalid_or_unreadable' as const,
    videoStreamCount: source.videoStreamCount,
    videoCodec: null,
    pixelFormat: null,
    width: source.width,
    height: source.height,
    fpsNumerator: source.frameRateNumerator,
    fpsDenominator: source.frameRateDenominator,
    durationFrames: source.frameCount,
    durationMilliseconds: source.durationMilliseconds,
    audioStreamCount: source.audioStreamCount,
    blackFrameRatio: source.blackFrameRatioMillionths / 1_000_000,
    frozenFrameRatio: source.frozenFrameRatioMillionths / 1_000_000,
    longestFrozenRunFrames: source.maximumFrozenRunFrames,
    motionSignalScore: source.motionSignalRatioMillionths / 1_000_000,
    firstFrameSimilarity:
      source.firstFrameSimilarityMillionths / 1_000_000,
    lastFrameSimilarity: source.lastFrameSimilarityMillionths / 1_000_000,
  }
  return {
    ...base,
    measurementDigest: sha256CanonicalJson(base),
  }
}

function projectThresholds(
  receipt: CanonicalVisualCalibrationObjectiveQaConsumerReceipt,
  durationFrames: number,
) {
  const similarity = {
    style_led_motion: 0.75,
    character_continuity: 0.80,
    strict_first_last_frame: 0.90,
    reference_heavy: 0.85,
  }[receipt.identity.calibrationScenarioKind]
  return {
    version: THRESHOLD_VERSION,
    maximumBlackFrameRatio: 0.02 as const,
    maximumFrozenFrameRatio: Math.min(
      0.67,
      48 / Math.max(1, durationFrames),
    ),
    maximumFrozenRunFrames: 47 as const,
    minimumMotionSignalScore: 0.05 as const,
    minimumFirstFrameSimilarity: similarity,
    minimumLastFrameSimilarity: similarity,
  }
}

function projectGateResults(
  receipt: CanonicalVisualCalibrationObjectiveQaConsumerReceipt,
  measurementDigest: string,
) {
  if (
    receipt.gates.length !== GATE_IDS.length ||
    receipt.gates.some((gate, index) => gate.gateId !== GATE_IDS[index])
  ) {
    throw invalid('Canonical objective-QA gate order changed.')
  }
  return receipt.gates.map((gate) => ({
    gateId: gate.gateId as GateId,
    status: gate.status,
    evidenceDigest: sha256CanonicalJson({
      domain: 'motion_studio_visual_calibration_objective_qa_gate_v1',
      backendReceiptHash: receipt.receiptHash,
      measurementDigest,
      gateId: gate.gateId,
      status: gate.status,
    }),
  }))
}

function structuralGatesPassed(
  gates: ReadonlyArray<{ gateId: GateId; status: 'passed' | 'failed' }>,
): boolean {
  return gates.slice(0, 5).every((gate) => gate.status === 'passed')
}

function projectTimingAuthority(input: {
  sourceReceiptDigest: string
  contentSha256: string
  frameAuthority: CanonicalStorytellingCalibrationFrameAuthority
  measurements: ReturnType<typeof projectMeasurements>
}) {
  const timing = {
    masterTimingPlanVersionId:
      input.frameAuthority.masterTimingPlanVersionId,
    confirmedFrameId: input.frameAuthority.confirmedFrameId,
    frameRate:
      input.measurements.fpsNumerator / input.measurements.fpsDenominator,
    width: input.measurements.width,
    height: input.measurements.height,
    aspectRatio: reducedAspectRatio(
      input.measurements.width,
      input.measurements.height,
    ),
    durationFrames: input.measurements.durationFrames,
    timebase:
      `${input.measurements.fpsDenominator}/${input.measurements.fpsNumerator}`,
  }
  return {
    ...timing,
    timingAuthorityDigest: sha256CanonicalJson({
      domain: 'motion_studio_visual_calibration_timing_authority_v1',
      sourceReceiptDigest: input.sourceReceiptDigest,
      contentSha256: input.contentSha256,
      timing,
    }),
  }
}

function reducedAspectRatio(width: number, height: number): string {
  let a = Math.abs(width)
  let b = Math.abs(height)
  while (b !== 0) [a, b] = [b, a % b]
  return `${width / a}:${height / a}`
}

function parseReaderInput(input: unknown): ReaderInput | null {
  const parsed = readerInputSchema.safeParse(input)
  if (!parsed.success) {
    throw invalid('Visual-calibration objective-QA reader input is invalid.')
  }
  const sourceReceipt = parsed.data.sourceReceipt
  const output = sourceReceipt.canonicalAttempt.privateOutput
  if (!output) return null
  return {
    sourceReceipt,
    workspaceId: sourceReceipt.identity.workspaceId,
    projectId: sourceReceipt.identity.projectId,
    editSessionId: sourceReceipt.identity.editSessionId,
    approvedSnapshotId: sourceReceipt.identity.approvedSnapshotId,
    sourceReceiptDigest: sourceReceipt.receiptDigest,
    providerOutputId: output.outputId,
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
  }
  return value
}

function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate:
      'canonical_visual_calibration_objective_qa_motion_consumer_reader',
    productionReady: false,
  })
}
