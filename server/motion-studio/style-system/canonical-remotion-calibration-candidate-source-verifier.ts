import { z } from 'zod'

import {
  styleCalibrationCandidateEvidenceSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  StyleCalibrationCandidateEvidence,
  StyleCalibrationScenario,
} from '../../../src/types/motion-studio'
import {
  assertCanonicalMotionStudioRemotionWorkItem,
  canonicalMotionStudioRemotionPreviewBindingSchema,
} from '../../edit-architecture/canonical-motion-studio-remotion-preview-authority'
import {
  createCanonicalPrivatePackageWorkQueueDefinition,
} from '../../edit-architecture/canonical-private-package-work-queue-authority'
import {
  createCanonicalPrivateResourcePlacementManifest,
} from '../../edit-architecture/canonical-private-resource-placement-authority'
import { ApiError } from '../../errors/api-error'
import {
  inspectCanonicalPrivateRemotionArtifact,
} from '../../services/canonical-private-remotion-artifact-storage'
import {
  createCanonicalEditExecutionPackageService,
} from '../../services/canonical-edit-execution-package-service'
import {
  createCanonicalExecutionReadinessService,
} from '../../services/canonical-execution-readiness-service'
import {
  readCanonicalPrivateJobAdapterCompletion,
} from '../../services/canonical-private-job-execution-adapter-service'
import {
  createEditPlanningAuthorityService,
} from '../../services/edit-planning-authority-service'
import {
  findCurrentPrivateTestSelection,
  readPrivateArtifactQaAggregate,
  readPrivateArtifactQaEvidenceBlob,
  stableArtifactQaStringify,
  verifyAllPrivateArtifactQaEvidenceBlobs,
} from '../../services/private-artifact-qa-authority-store'
import {
  readPrivateCanonicalPackageWorkQueue,
} from '../../services/private-canonical-package-work-queue-store'
import {
  readPrivateCanonicalToolDispatchAggregate,
} from '../../services/private-canonical-tool-dispatch-store'
import {
  readPrivateCanonicalWorkerLeaseAggregate,
} from '../../services/private-canonical-worker-lease-store'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'
import { getRequiredAuthUserId } from '../../services/service-helpers'
import {
  readPrivateWorkerResourceUsageCostEvidence,
} from '../../tool-cost-metering/private-worker-resource-usage-cost-evidence'
import type { ServiceContext } from '../../types'
import {
  artifactQaAuthorityIdentitySchema,
  canonicalExpectedArtifactLineageSchema,
  internalArtifactQaEvidenceSchema,
  internalProducedArtifactEvidenceSchema,
} from '../../validation/private-artifact-qa-authority-schemas'
import {
  canonicalStorytellingStyleAuthoritySchema,
} from '../../validation/canonical-storytelling-style-authority-schemas'
import { createStyleCalibrationCandidateEvidence } from './calibration-evidence'
import {
  reopenCanonicalApprovedStorytellingStylePlanSource,
} from './canonical-approved-style-plan-source-reader'
import {
  assertCanonicalApprovedStorytellingStylePlanSource,
  createCalibrationCandidateSourceVerification,
  type CalibrationCandidateSourceVerifier,
} from './private-approved-calibration-evidence-store'
import {
  type CanonicalApprovedStorytellingStylePlanSource,
} from './style-plan-source-store'

export const MOTION_STUDIO_CANONICAL_REMOTION_CALIBRATION_SOURCE_RECEIPT_VERSION =
  'motion-studio.canonical-remotion-calibration-source-receipt.v1' as const
export const MOTION_STUDIO_CANONICAL_REMOTION_CALIBRATION_SOURCE_VERIFIER_ID =
  'motion-studio-canonical-remotion-calibration-source-v1' as const

const DETERMINISTIC_PROFILE_ID =
  'motion_studio_deterministic_route_draw_v1' as const
const REMOTION_OPERATION_ID =
  'tool.remotion.render_approved_composition.v1' as const
const REMOTION_WORKER_CLASS = 'render_worker' as const
const REMOTION_RUNNER_CLASS = 'offline_remotion_render_execution_v1' as const
const digest = z.string().regex(/^[a-f0-9]{64}$/u)
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const safeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const artifactResultEvidenceEnvelopeSchema = z.object({
  schemaVersion: z.literal('private-artifact-result-evidence-envelope-v1'),
  identity: artifactQaAuthorityIdentitySchema,
  lineage: canonicalExpectedArtifactLineageSchema,
  evidence: internalProducedArtifactEvidenceSchema,
}).strict()
const artifactQaEvidenceEnvelopeSchema = z.object({
  schemaVersion: z.literal('private-artifact-qa-evidence-envelope-v1'),
  identity: artifactQaAuthorityIdentitySchema,
  lineage: canonicalExpectedArtifactLineageSchema,
  artifactId: stableId,
  artifactContentSha256: digest,
  evidence: internalArtifactQaEvidenceSchema,
  derived: z.object({
    outcome: z.enum([
      'passed',
      'warning',
      'failed',
      'blocked',
      'needs_user_review',
      'fallback_required',
    ]),
    failureScope: z.enum([
      'none',
      'local_asset',
      'local_segment',
      'global_edit',
    ]),
  }).strict(),
}).strict()

export const canonicalRemotionCalibrationCandidateSourceReceiptSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CANONICAL_REMOTION_CALIBRATION_SOURCE_RECEIPT_VERSION,
  ),
  sourceAuthority: z.literal(
    'canonical_private_remotion_calibration_candidate_source_verifier',
  ),
  evidenceClass: z.literal('canonical_backend_runtime_unreleased'),
  identity: z.object({
    ownerUserId: stableId,
    workspaceId: stableId,
    projectId: stableId,
    editSessionId: stableId,
    productionId: stableId,
    approvedSnapshotId: stableId,
    approvedSnapshotDigest: digest,
    packageRecordId: stableId,
    packageHash: digest,
    approvedWorkItemId: stableId,
    approvedWorkItemHash: digest,
    jobId: stableId,
    executionAttemptId: stableId,
    leaseId: stableId,
    leaseHash: digest,
    dispatchGrantId: stableId,
    dispatchGrantHash: digest,
    expectedAssetId: stableId,
    scenarioId: stableId,
    scenarioKind: z.literal('exact_text_data'),
  }).strict(),
  planning: z.object({
    canonicalStyleComponentDigest: digest,
    sourcePlanReviewInputDigest: digest,
    approvedCalibrationPlanDigest: digest,
    sourceCalibrationPlanId: stableId,
    sourceCalibrationPlanDigest: digest,
    routeCandidateId: z.literal('deterministic_reeditpro_composition'),
    productionMode: z.literal('native_graphics_first'),
    compositionProfileId: z.literal(DETERMINISTIC_PROFILE_ID),
    compositionBindingHash: digest,
    planningPayloadHash: digest,
    requestEnvelopeHash: digest,
    sourceTimingHash: digest,
  }).strict(),
  terminalAttempt: z.object({
    queueDefinitionHash: digest,
    queueEntryHash: digest,
    queueCompletionHash: digest,
    queueClaimId: stableId,
    queueDeliveryAttempt: z.number().int().positive().max(100_000),
    leaseExecutionFenceHash: digest,
    jobAdapterCompletionHash: digest,
    dispatchStatus: z.literal('consumed'),
    dependencyArtifactCount: z.literal(1),
    dependencyArtifactSetHash: digest,
    individualAttemptTerminalVerified: z.literal(true),
    calibrationAttemptSetHistoryVerified: z.literal(false),
    executionStartedAt: timestamp,
    runtimeCompletedAt: timestamp,
    leaseCompletedAt: timestamp,
    jobAdapterCompletedAt: timestamp,
    queueCompletedAt: timestamp,
  }).strict(),
  output: z.object({
    artifactId: stableId,
    assetVersionId: stableId,
    artifactVersion: z.number().int().positive().max(10_000),
    mimeType: z.literal('video/mp4'),
    contentDigest: digest,
    byteLength: z.number().int().positive().max(512 * 1024 * 1024),
    privateObjectIdentityHash: digest,
    storageEvidenceDigest: digest,
    checksumReadbackEvidenceDigest: digest,
    createOnly: z.literal(true),
    privateProjectAsset: z.literal(true),
  }).strict(),
  technicalQa: z.object({
    qaEvaluationId: stableId,
    reconciliationId: stableId,
    qaEvidenceDigest: digest,
    resultEvidenceDigest: digest,
    qaAggregateRevision: safeInteger,
    qaAggregateHash: digest,
    currentSelectionHash: digest,
    outputCommitmentHash: digest,
    actualQaEvidenceState: z.literal(
      'actual_remotion_mp4_ffprobe_qa_verified_v1',
    ),
    independentFfprobeAndProfileFrameGoldenQaAttested: z.literal(true),
    profileRequiredFrameGoldenCount: z.literal(5),
    outcome: z.literal('passed'),
  }).strict(),
  resourceUsage: z.object({
    evidenceId: stableId,
    evidenceHash: digest,
    evidenceClass: z.literal('private_embedded_observed_usage_test'),
    operationProfileId: stableId,
    operationProfileHash: digest,
    runtimeExecutionIdentityDigest: digest,
    containerIdentityDigest: digest,
    measurementAgentVersion: z.literal('embedded_remotion_cgroup_v2_observer_v1'),
    measurementAgentDigest: digest,
    startedAt: timestamp,
    finishedAt: timestamp,
    wallTimeMilliseconds: z.number().int().positive().max(15 * 60 * 1_000),
    observedCpuMicroseconds: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    observedPeakMemoryBytes: z.number().int().positive().max(4_294_967_296),
    infrastructureEvidenceDigest: digest,
    rateCardVersion: z.literal('rp-ratecard-01-mock-safe'),
    rateCardDigest: digest,
  }).strict(),
  cost: z.object({
    providerCostMicros: z.literal(0),
    infrastructureCostMicros: safeInteger,
    totalInternalProductionCostMicros: safeInteger,
    costEvidenceDigest: digest,
    internalProductionCostOnly: z.literal(true),
    failedOrUnknownAttemptCostRetained: z.literal(true),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  timingAuthority: z.object({
    masterTimingPlanVersionId: stableId,
    confirmedFrameId: stableId,
    timingAuthorityDigest: digest,
    frameRate: z.literal(30),
    width: z.literal(1_280),
    height: z.literal(720),
    aspectRatio: z.literal('16:9'),
    durationFrames: z.literal(180),
    timebase: z.literal('1/30'),
    identifierProjectionClass: z.literal(
      'content_addressed_from_canonical_approved_snapshot',
    ),
  }).strict(),
  readiness: z.object({
    individualCandidateSourceVerified: z.literal(true),
    privateRoutingEvidenceEligible: z.literal(true),
    canonicalFinalizationAllowed: z.literal(false),
    authenticatedCreativeReviewRequired: z.literal(true),
    fiveScenarioAttemptHistoryRequired: z.literal(true),
    providerExecutionAuthorized: z.literal(false),
    furtherRenderAuthorized: z.literal(false),
    customerCommercialAuthorityGranted: z.literal(false),
    promotionAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  immutable: z.literal(true),
  receiptHash: digest,
}).strict().superRefine((receipt, context) => {
  const unsigned = { ...receipt } as Record<string, unknown>
  delete unsigned.receiptHash
  if (
    receipt.receiptHash !== sha256AuthorityValue(unsigned) ||
    receipt.cost.totalInternalProductionCostMicros !==
      receipt.cost.infrastructureCostMicros ||
    Date.parse(receipt.resourceUsage.startedAt) <
      Date.parse(receipt.terminalAttempt.executionStartedAt) ||
    Date.parse(receipt.resourceUsage.finishedAt) >
      Date.parse(receipt.terminalAttempt.runtimeCompletedAt) ||
    Date.parse(receipt.terminalAttempt.runtimeCompletedAt) >
      Date.parse(receipt.terminalAttempt.leaseCompletedAt) ||
    Date.parse(receipt.terminalAttempt.leaseCompletedAt) >
      Date.parse(receipt.terminalAttempt.jobAdapterCompletedAt) ||
    Date.parse(receipt.terminalAttempt.jobAdapterCompletedAt) >
      Date.parse(receipt.terminalAttempt.queueCompletedAt)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Canonical Remotion calibration source receipt failed immutable reconciliation.',
    })
  }
})

export type CanonicalRemotionCalibrationCandidateSourceReceipt = z.infer<
  typeof canonicalRemotionCalibrationCandidateSourceReceiptSchema
>

export interface ProjectCanonicalRemotionCalibrationCandidateResult {
  receipt: CanonicalRemotionCalibrationCandidateSourceReceipt
  candidate: StyleCalibrationCandidateEvidence
}

/**
 * Reopens one terminal deterministic Remotion attempt from canonical stores and
 * projects it into a Motion-owned calibration candidate. This is read-only: it
 * does not execute, persist, approve, review, select, or finalize calibration.
 */
export async function projectCanonicalRemotionCalibrationCandidate(input: {
  context: ServiceContext
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  executionAttemptId: string
}): Promise<ProjectCanonicalRemotionCalibrationCandidateResult> {
  assertCanonicalApprovedStorytellingStylePlanSource(input.approvedPlanSource)
  const ownerUserId = getRequiredAuthUserId(input.context)
  const executionAttemptId = stableId.parse(input.executionAttemptId)
  const localStorageRoot = input.context.env.localStorageRoot
  const planning = createEditPlanningAuthorityService(input.context)
  const authority = await planning.loadApprovedExecutionAuthority(
    input.approvedPlanSource.approvedSnapshotId,
    input.approvedPlanSource.approvedCalibrationPlan.workspaceId,
  )
  const initialAuthorityHash = sha256AuthorityValue(authority)
  const approvedPlanSource = await reopenCanonicalApprovedStorytellingStylePlanSource({
    context: input.context,
    claimedSource: input.approvedPlanSource,
  })
  const plan = approvedPlanSource.approvedCalibrationPlan

  const leaseAggregate = await readPrivateCanonicalWorkerLeaseAggregate({
    localStorageRoot,
    ownerUserId,
    workspaceId: plan.workspaceId,
  })
  const attemptLeases = leaseAggregate?.leases.filter((lease) =>
    lease.executionFence.executionAttemptId === executionAttemptId) ?? []
  if (attemptLeases.length > 1) {
    throw invalid('Execution-attempt identity is not unique in the canonical worker lease authority.')
  }
  if (
    attemptLeases[0] &&
    attemptLeases[0].executionFence.runnerClass !== REMOTION_RUNNER_CLASS
  ) {
    throw invalid('Calibration candidate projection accepts only a canonical Remotion attempt.')
  }

  const resource = await readPrivateWorkerResourceUsageCostEvidence({
    localStorageRoot,
    ownerUserId,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    executionAttemptId,
  })
  if (!resource) {
    throw notReady('Canonical Remotion resource evidence was not found for this calibration attempt.')
  }
  const outputArtifact = resource.output.artifacts[0]
  if (
    resource.evidenceClass !== 'private_embedded_observed_usage_test' ||
    resource.identity.editSessionId !== plan.editSessionId ||
    resource.identity.approvedPlanSnapshotId !==
      approvedPlanSource.approvedSnapshotId ||
    resource.identity.approvedPlanSnapshotHash !==
      approvedPlanSource.approvedSnapshotDigest ||
    resource.operation.kind !== 'registered_tool_operation' ||
    resource.operation.canonicalToolId !== 'remotion' ||
    resource.operation.operationId !== REMOTION_OPERATION_ID ||
    resource.runtime.workerClass !== REMOTION_WORKER_CLASS ||
    resource.runtime.measurementAgentVersion !==
      'embedded_remotion_cgroup_v2_observer_v1' ||
    resource.outcome.state !== 'completed' ||
    resource.outcome.failureCategory !== 'none' ||
    resource.output.disposition !== 'accepted' ||
    resource.output.artifacts.length !== 1 ||
    !outputArtifact ||
    resource.commercialBoundary.customerPriceIncluded ||
    resource.commercialBoundary.customerCreditsIncluded ||
    resource.commercialBoundary.serviceFeeIncluded ||
    resource.commercialBoundary.walletMutationPerformed ||
    resource.commercialBoundary.billingMutationPerformed ||
    resource.readiness.productionReady
  ) {
    throw invalid('Worker resource evidence is not one exact accepted private Remotion attempt.')
  }

  const readiness = (await createCanonicalExecutionReadinessService(
    input.context,
  ).inspectJob({
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    jobId: resource.identity.jobId,
    purpose: 'private_internal_dry_run_readiness',
  })).executionReadinessEnvelope
  if (
    readiness.job.approvedPlanSnapshotId !== resource.identity.approvedPlanSnapshotId ||
    readiness.job.approvedWorkItemId !== resource.identity.approvedWorkItemId ||
    readiness.executionPackage.packageRecordId !== resource.identity.packageRecordId ||
    readiness.authorityHashes.snapshotHash !== resource.identity.approvedPlanSnapshotHash ||
    readiness.authorityHashes.executionPackageHash !== resource.identity.packageHash
  ) {
    throw invalid('Canonical job readiness no longer matches the Remotion attempt identity.')
  }

  const packageRead = await createCanonicalEditExecutionPackageService(
    input.context,
  ).getPackage(resource.identity.packageRecordId, plan.workspaceId)
  const executionPackage = packageRead.approvedEditExecutionPackage
  if (
    executionPackage.packageHash !== resource.identity.packageHash ||
    executionPackage.approvedPlanSnapshotId !==
      approvedPlanSource.approvedSnapshotId ||
    executionPackage.snapshotHash !== approvedPlanSource.approvedSnapshotDigest
  ) {
    throw invalid('Canonical execution package changed after the Remotion attempt.')
  }

  const styleComponent = canonicalStorytellingStyleAuthoritySchema.parse(
    authority.components.motionStudioStorytellingStyleAuthority,
  )
  const workItem = authority.workItems.find((candidate) =>
    candidate.id === resource.identity.approvedWorkItemId)
  if (!workItem) throw invalid('Approved Remotion work item disappeared.')
  const profile = assertCanonicalMotionStudioRemotionWorkItem(workItem)
  if (!profile || profile.profileId !== DETERMINISTIC_PROFILE_ID) {
    throw invalid('Calibration candidate requires the deterministic route-draw Remotion profile.')
  }
  const binding = canonicalMotionStudioRemotionPreviewBindingSchema.parse(
    workItem.executionInput.motionStudioStorytellingAuthority,
  )
  const scenario = exactTextScenario(plan.scenarios)
  const sourceScenarioIndex = styleComponent.calibrationPlan.scenarioKinds
    .findIndex((kind) => kind === 'exact_text_data')
  if (
    resource.identity.approvedWorkItemHash !== sha256AuthorityValue(workItem) ||
    profile.width !== 1_280 || profile.height !== 720 || profile.fps !== 30 ||
    profile.durationFrames !== 180 ||
    binding.workspaceId !== plan.workspaceId ||
    binding.projectId !== plan.projectId ||
    binding.editSessionId !== plan.editSessionId ||
    binding.productionId !== plan.productionId ||
    binding.canonicalStyleComponentDigest !==
      approvedPlanSource.canonicalProjectionDigest ||
    binding.canonicalStyleComponentDigest !== sha256AuthorityValue(styleComponent) ||
    binding.calibrationPlan.id !== styleComponent.calibrationPlan.id ||
    binding.calibrationPlan.digest !== styleComponent.calibrationPlan.planDigest ||
    sourceScenarioIndex < 0 ||
    styleComponent.calibrationPlan.scenarioIds[sourceScenarioIndex] !== scenario.id ||
    scenario.productionMode !== 'native_graphics_first' ||
    scenario.requiresGeneratedMedia ||
    !scenario.deterministicTextDataRequired
  ) {
    throw invalid('Deterministic calibration work lost its exact style, scenario, or profile authority.')
  }

  const placementManifest = createCanonicalPrivateResourcePlacementManifest({
    executionPackage,
    toolCapabilityManifest: packageRead.toolCapabilityManifest,
    toolExecutionAuthority: packageRead.toolExecutionAuthority,
  })
  const queueDefinition = createCanonicalPrivatePackageWorkQueueDefinition({
    executionPackage,
    placementManifest,
  })
  const queueScope = {
    localStorageRoot,
    ownerUserId,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    packageRecordId: executionPackage.packageRecordId,
    approvedPlanSnapshotId: executionPackage.approvedPlanSnapshotId,
  }
  const queue = await readPrivateCanonicalPackageWorkQueue({
    scope: queueScope,
    definition: queueDefinition,
  })
  const queueEntries = queue?.entries.filter((entry) =>
    entry.definition.jobId === resource.identity.jobId)
  const queueEntry = queueEntries?.length === 1 ? queueEntries[0] : undefined
  if (
    !queue || !queueEntry || queueEntry.state !== 'completed' ||
    !queueEntry.completion ||
    queueEntry.definition.approvedWorkItemId !== workItem.id ||
    queueEntry.completion.outcome.approvedWorkItemId !== workItem.id ||
    queueEntry.completion.outcome.sha256 !== outputArtifact.sha256 ||
    queueEntry.completion.outcome.contentType !== 'video/mp4'
  ) {
    throw notReady('The exact Remotion package-queue job is not terminal with this private MP4.')
  }
  const jobAdapterCompletion = await readCanonicalPrivateJobAdapterCompletion({
    localStorageRoot,
    ownerUserId,
    workspaceId: plan.workspaceId,
    projectId: plan.projectId,
    editSessionId: plan.editSessionId,
    jobId: resource.identity.jobId,
  })
  if (
    !jobAdapterCompletion ||
    jobAdapterCompletion.identity.approvedPlanSnapshotId !==
      approvedPlanSource.approvedSnapshotId ||
    jobAdapterCompletion.identity.approvedWorkItemId !== workItem.id ||
    jobAdapterCompletion.identity.canonicalToolId !== 'remotion' ||
    jobAdapterCompletion.identity.operationId !== REMOTION_OPERATION_ID ||
    jobAdapterCompletion.identity.runnerClass !== REMOTION_RUNNER_CLASS ||
    jobAdapterCompletion.result.artifactId !==
      queueEntry.completion.outcome.artifactId ||
    jobAdapterCompletion.result.sha256 !== outputArtifact.sha256 ||
    jobAdapterCompletion.result.contentType !== 'video/mp4' ||
    jobAdapterCompletion.result.byteLength !== outputArtifact.byteLength ||
    !jobAdapterCompletion.evidence.singleUseDispatchConsumed
  ) {
    throw invalid('Canonical job-adapter completion no longer matches the terminal Remotion job.')
  }

  const leases = leaseAggregate?.leases.filter((lease) =>
    lease.id === resource.identity.leaseId &&
    lease.jobId === resource.identity.jobId &&
    lease.executionFence.executionAttemptId === executionAttemptId) ?? []
  const lease = leases.length === 1 ? leases[0] : undefined
  if (
    !lease || lease.projectId !== plan.projectId ||
    lease.editSessionId !== plan.editSessionId ||
    lease.approvedPlanSnapshotId !== approvedPlanSource.approvedSnapshotId ||
    lease.immutableLeaseHash !== resource.identity.leaseHash ||
    lease.attemptNumber !== resource.identity.attemptOrdinal ||
    lease.executionFence.state !== 'completed' ||
    lease.executionFence.runnerClass !== REMOTION_RUNNER_CLASS ||
    !lease.executionFence.completedAt ||
    Date.parse(resource.resourceUsage.finishedAt) >
      Date.parse(lease.executionFence.completedAt) ||
    stableAuthorityStringify(lease.canonicalHashes) !==
      stableAuthorityStringify(readiness.authorityHashes)
  ) {
    throw invalid('Canonical Remotion lease and completed execution fence changed.')
  }

  const dispatchAggregate = await readPrivateCanonicalToolDispatchAggregate({
    localStorageRoot,
    ownerUserId,
    workspaceId: plan.workspaceId,
  })
  const grants = dispatchAggregate?.grants.filter((grant) =>
    grant.id === resource.identity.dispatchGrantId) ?? []
  const grant = grants.length === 1 ? grants[0] : undefined
  if (
    !grant || grant.status !== 'consumed' ||
    grant.immutableGrantHash !== resource.identity.dispatchGrantHash ||
    grant.binding.jobId !== resource.identity.jobId ||
    grant.binding.approvedWorkItemId !== workItem.id ||
    grant.binding.approvedPlanSnapshotId !== approvedPlanSource.approvedSnapshotId ||
    jobAdapterCompletion.identity.expectedAssetId !==
      grant.binding.expectedAssetId ||
    grant.binding.leaseId !== lease.id ||
    grant.binding.leaseImmutableHash !== lease.immutableLeaseHash ||
    grant.binding.canonicalToolId !== 'remotion' ||
    grant.binding.operationId !== REMOTION_OPERATION_ID ||
    stableAuthorityStringify(grant.canonicalHashes) !==
      stableAuthorityStringify(lease.canonicalHashes) ||
    grant.binding.leaseDependencyAuthority.selectedArtifactCount !== 1 ||
    grant.binding.leaseDependencyAuthority.selectedArtifactsHash !==
      sha256AuthorityValue(lease.dependencyAuthority.selectedArtifacts) ||
    lease.dependencyAuthority.selectedArtifacts.length !== 1
  ) {
    throw invalid('Consumed Remotion dispatch no longer matches its lease and dependency authority.')
  }
  const dependency = lease.dependencyAuthority.selectedArtifacts[0]!
  const dependencyInput = resource.input.artifacts.find((artifact) =>
    artifact.artifactId === dependency.artifactId)
  const approvedRequestInput = resource.input.artifacts.find((artifact) =>
    artifact.artifactId === `${workItem.id}:approved_remotion_request`)
  if (
    !dependencyInput || dependencyInput.sha256 !== dependency.contentSha256 ||
    !approvedRequestInput ||
    approvedRequestInput.sha256 !== resource.attemptInputHash ||
    resource.input.artifacts.length !== 2
  ) {
    throw invalid('Remotion resource evidence lost the exact route-draw dependency artifact.')
  }

  const qaScope = { localStorageRoot, ownerUserId, workspaceId: plan.workspaceId }
  const qaAggregate = await readPrivateArtifactQaAggregate(qaScope)
  if (!qaAggregate) throw notReady('Private Remotion artifact and QA authority is unavailable.')
  await verifyAllPrivateArtifactQaEvidenceBlobs({
    scope: qaScope,
    aggregate: qaAggregate,
  })
  const selection = findCurrentPrivateTestSelection({
    aggregate: qaAggregate,
    identity: {
      workspaceId: plan.workspaceId,
      projectId: plan.projectId,
      editSessionId: plan.editSessionId,
      snapshotId: approvedPlanSource.approvedSnapshotId,
      jobId: resource.identity.jobId,
      expectedAssetId: grant.binding.expectedAssetId,
    },
  })
  if (!selection) throw notReady('The exact Remotion artifact has no current QA-passed selection.')
  const resultEvidenceEnvelope = artifactResultEvidenceEnvelopeSchema.parse(
    await readPrivateArtifactQaEvidenceBlob({
      localStorageRoot,
      ref: selection.artifact.resultEvidenceRef,
    }),
  )
  const qaEvidenceEnvelope = artifactQaEvidenceEnvelopeSchema.parse(
    await readPrivateArtifactQaEvidenceBlob({
      localStorageRoot,
      ref: selection.qa.qaEvidenceRef,
    }),
  )
  if (
    stableArtifactQaStringify(resultEvidenceEnvelope.identity) !==
      stableArtifactQaStringify(selection.artifact.identity) ||
    stableArtifactQaStringify(resultEvidenceEnvelope.lineage) !==
      stableArtifactQaStringify(selection.artifact.lineage) ||
    stableArtifactQaStringify(qaEvidenceEnvelope.identity) !==
      stableArtifactQaStringify(selection.artifact.identity) ||
    stableArtifactQaStringify(qaEvidenceEnvelope.lineage) !==
      stableArtifactQaStringify(selection.artifact.lineage) ||
    qaEvidenceEnvelope.artifactId !== selection.artifact.artifactId ||
    qaEvidenceEnvelope.artifactContentSha256 !==
      selection.artifact.content.sha256 ||
    qaEvidenceEnvelope.derived.outcome !== selection.qa.outcome ||
    qaEvidenceEnvelope.derived.failureScope !== selection.qa.failureScope
  ) {
    throw invalid('Private Remotion result and QA envelopes lost their canonical identity or lineage.')
  }
  const resultEvidence = resultEvidenceEnvelope.evidence
  const qaEvidence = qaEvidenceEnvelope.evidence
  const actualRun = resultEvidence.actualRunEvidence
  const frameGoldenGate = qaEvidence.gateResults.find((gate) =>
    gate.gateId === 'asset_quality_gate')
  const expectedRuntimeExecutionIdentityDigest =
    actualRun.state === 'actual_run_evidence_verified_v2'
      ? deriveCanonicalPrivateEmbeddedRuntimeExecutionIdentityDigest({
          executionAttemptId,
          runnerClass: actualRun.runnerClass,
          runtimeAuthorityDigest: actualRun.runtimeAuthorityHash,
          runtimeImageDigest: actualRun.runtimeImageIdentityHash,
          runtimeAttestationDigest: actualRun.executionAttestationHash,
          containerIdentityDigest: resource.runtime.containerIdentityDigest,
        })
      : undefined
  if (
    selection.artifact.artifactId !== outputArtifact.artifactId ||
    selection.artifact.content.sha256 !== outputArtifact.sha256 ||
    selection.artifact.content.byteLength !== outputArtifact.byteLength ||
    selection.artifact.content.contentType !== 'video/mp4' ||
    selection.artifact.artifactId !== queueEntry.completion.outcome.artifactId ||
    selection.artifact.storageIdentity.storageKind !== 'private_local_test' ||
    selection.artifact.placeholder.isPlaceholder ||
    selection.qa.outcome !== 'passed' ||
    selection.reconciliation.decision !== 'test_merged_not_live_authorized' ||
    !selection.reconciliation.privateTestDependencySatisfied ||
    selection.artifact.resultEvidenceHash !== selection.artifact.resultEvidenceRef.sha256 ||
    selection.qa.qaEvidenceHash !== selection.qa.qaEvidenceRef.sha256 ||
    stableArtifactQaStringify(resultEvidence.content) !==
      stableArtifactQaStringify(selection.artifact.content) ||
    stableArtifactQaStringify(resultEvidence.storageIdentity) !==
      stableArtifactQaStringify(selection.artifact.storageIdentity) ||
    actualRun.state !== 'actual_run_evidence_verified_v2' ||
    actualRun.executionAttemptId !== executionAttemptId ||
    actualRun.runnerClass !== REMOTION_RUNNER_CLASS ||
    actualRun.dispatchGrantId !== grant.id ||
    actualRun.executionAttestationHash !==
      resource.runtime.runtimeAttestationDigest ||
    actualRun.runtimeImageIdentityHash !== resource.runtime.runtimeImageDigest ||
    expectedRuntimeExecutionIdentityDigest !==
      resource.runtime.runtimeExecutionIdentityDigest ||
    stableAuthorityStringify(actualRun.toolIds) !==
      stableAuthorityStringify(['remotion']) ||
    actualRun.startedAt !== lease.executionFence.startedAt ||
    Date.parse(resource.resourceUsage.startedAt) <
      Date.parse(actualRun.startedAt) ||
    Date.parse(resource.resourceUsage.finishedAt) >
      Date.parse(actualRun.finishedAt) ||
    Date.parse(actualRun.finishedAt) >
      Date.parse(lease.executionFence.completedAt) ||
    Date.parse(lease.executionFence.completedAt) >
      Date.parse(queueEntry.completion.completedAt) ||
    qaEvidence.actualQaEvidenceState !==
      'actual_remotion_mp4_ffprobe_qa_verified_v1' ||
    !qaEvidence.actualQaVerified ||
    frameGoldenGate?.status !== 'passed' ||
    frameGoldenGate.notesCode !==
      'independent_ffprobe_and_motion_studio_frame_golden_qa_passed'
  ) {
    throw invalid('Private Remotion output, QA, and actual-run evidence no longer reconcile.')
  }

  const inspection = await inspectCanonicalPrivateRemotionArtifact({
    localStorageRoot,
    privateObjectIdentityHash:
      selection.artifact.storageIdentity.opaqueObjectIdentityHash,
  })
  if (
    !inspection || inspection.sha256 !== selection.artifact.content.sha256 ||
    inspection.byteLength !== selection.artifact.content.byteLength
  ) {
    throw invalid('Private Remotion MP4 failed current streamed checksum readback.')
  }

  const qaAggregateHash = sha256AuthorityValue(qaAggregate)
  const currentSelectionHash = sha256AuthorityValue(selection)
  const outputCommitmentHash = sha256AuthorityValue({
    domain: 'motion_studio_canonical_remotion_output_commitment_v1',
    privateObjectIdentityHash:
      selection.artifact.storageIdentity.opaqueObjectIdentityHash,
    sha256: inspection.sha256,
    byteLength: inspection.byteLength,
  })
  const finalQaAggregate = await readPrivateArtifactQaAggregate(qaScope)
  if (!finalQaAggregate) {
    throw notReady('Private Remotion artifact and QA authority disappeared during verification.')
  }
  await verifyAllPrivateArtifactQaEvidenceBlobs({
    scope: qaScope,
    aggregate: finalQaAggregate,
  })
  const finalSelection = findCurrentPrivateTestSelection({
    aggregate: finalQaAggregate,
    identity: selection.artifact.identity,
  })
  const finalInspection = await inspectCanonicalPrivateRemotionArtifact({
    localStorageRoot,
    privateObjectIdentityHash:
      selection.artifact.storageIdentity.opaqueObjectIdentityHash,
  })
  const finalAuthority = await planning.loadApprovedExecutionAuthority(
    approvedPlanSource.approvedSnapshotId,
    plan.workspaceId,
  )
  if (sha256AuthorityValue(finalAuthority) !== initialAuthorityHash) {
    throw notReady(
      'Canonical approved authority changed during calibration source verification.',
    )
  }
  assertCanonicalRemotionCalibrationQaReadbackFence({
    initial: {
      aggregateRevision: qaAggregate.revision,
      aggregateHash: qaAggregateHash,
      selectionHash: currentSelectionHash,
      outputCommitmentHash,
    },
    final: {
      aggregateRevision: finalQaAggregate.revision,
      aggregateHash: sha256AuthorityValue(finalQaAggregate),
      selectionHash: finalSelection
        ? sha256AuthorityValue(finalSelection)
        : undefined,
      outputCommitmentHash: finalSelection && finalInspection
        ? sha256AuthorityValue({
            domain: 'motion_studio_canonical_remotion_output_commitment_v1',
            privateObjectIdentityHash:
              finalSelection.artifact.storageIdentity.opaqueObjectIdentityHash,
            sha256: finalInspection.sha256,
            byteLength: finalInspection.byteLength,
          })
        : undefined,
    },
  })

  const timingAuthority = calibrationTimingAuthority({
    snapshotTimingHash: authority.snapshot.timingHash,
    confirmedOutputFrame: authority.components.confirmedSettings.outputFrame,
    profile,
    scenario,
    executionAttemptId,
    outputSha256: inspection.sha256,
  })
  const costEvidenceDigest = sha256AuthorityValue({
    domain: 'motion_studio_canonical_remotion_calibration_cost_v1',
    executionAttemptId,
    resourceEvidenceHash: resource.evidenceHash,
    infrastructureEvidenceDigest:
      resource.resourceUsage.infrastructureEvidenceDigest,
    rateCardDigest: resource.infrastructureCost.rateCardDigest,
    providerCostMicros: 0,
    infrastructureCostMicros:
      resource.infrastructureCost.actualInternalCostMicros,
    failedOrUnknownAttemptCostRetained:
      resource.outcome.failedOrUnknownAttemptCostRetained,
  })
  const checksumReadbackEvidenceDigest = sha256AuthorityValue({
    domain: 'motion_studio_canonical_remotion_calibration_checksum_readback_v1',
    privateObjectIdentityHash:
      selection.artifact.storageIdentity.opaqueObjectIdentityHash,
    sha256: inspection.sha256,
    byteLength: inspection.byteLength,
  })
  const leaseExecutionFenceHash = sha256AuthorityValue(lease.executionFence)
  const receiptBase = {
    schemaVersion:
      MOTION_STUDIO_CANONICAL_REMOTION_CALIBRATION_SOURCE_RECEIPT_VERSION,
    sourceAuthority:
      'canonical_private_remotion_calibration_candidate_source_verifier' as const,
    evidenceClass: 'canonical_backend_runtime_unreleased' as const,
    identity: {
      ownerUserId,
      workspaceId: plan.workspaceId,
      projectId: plan.projectId,
      editSessionId: plan.editSessionId,
      productionId: plan.productionId,
      approvedSnapshotId: approvedPlanSource.approvedSnapshotId,
      approvedSnapshotDigest: approvedPlanSource.approvedSnapshotDigest,
      packageRecordId: executionPackage.packageRecordId,
      packageHash: executionPackage.packageHash,
      approvedWorkItemId: workItem.id,
      approvedWorkItemHash: sha256AuthorityValue(workItem),
      jobId: resource.identity.jobId,
      executionAttemptId,
      leaseId: lease.id,
      leaseHash: lease.immutableLeaseHash,
      dispatchGrantId: grant.id,
      dispatchGrantHash: grant.immutableGrantHash,
      expectedAssetId: grant.binding.expectedAssetId,
      scenarioId: scenario.id,
      scenarioKind: 'exact_text_data' as const,
    },
    planning: {
      canonicalStyleComponentDigest:
        approvedPlanSource.canonicalProjectionDigest,
      sourcePlanReviewInputDigest:
        approvedPlanSource.sourcePlanReviewInputDigest,
      approvedCalibrationPlanDigest: plan.planDigest,
      sourceCalibrationPlanId: styleComponent.calibrationPlan.id,
      sourceCalibrationPlanDigest: styleComponent.calibrationPlan.planDigest,
      routeCandidateId: 'deterministic_reeditpro_composition' as const,
      productionMode: 'native_graphics_first' as const,
      compositionProfileId: DETERMINISTIC_PROFILE_ID,
      compositionBindingHash: binding.bindingHash,
      planningPayloadHash: profile.planningPayloadHash,
      requestEnvelopeHash: resource.attemptInputHash,
      sourceTimingHash: authority.snapshot.timingHash,
    },
    terminalAttempt: {
      queueDefinitionHash: queueDefinition.definitionHash,
      queueEntryHash: queueEntry.entryHash,
      queueCompletionHash: queueEntry.completion.completionHash,
      queueClaimId: queueEntry.completion.claimId,
      queueDeliveryAttempt: queueEntry.deliveryAttemptCount,
      leaseExecutionFenceHash,
      jobAdapterCompletionHash: jobAdapterCompletion.responseHash,
      dispatchStatus: 'consumed' as const,
      dependencyArtifactCount: 1 as const,
      dependencyArtifactSetHash:
        grant.binding.leaseDependencyAuthority.selectedArtifactsHash,
      individualAttemptTerminalVerified: true as const,
      calibrationAttemptSetHistoryVerified: false as const,
      executionStartedAt: actualRun.startedAt,
      runtimeCompletedAt: actualRun.finishedAt,
      leaseCompletedAt: lease.executionFence.completedAt,
      jobAdapterCompletedAt: jobAdapterCompletion.completedAt,
      queueCompletedAt: queueEntry.completion.completedAt,
    },
    output: {
      artifactId: selection.artifact.artifactId,
      assetVersionId:
        `${selection.artifact.artifactId}:v${selection.artifact.artifactVersion}`,
      artifactVersion: selection.artifact.artifactVersion,
      mimeType: 'video/mp4' as const,
      contentDigest: inspection.sha256,
      byteLength: inspection.byteLength,
      privateObjectIdentityHash:
        selection.artifact.storageIdentity.opaqueObjectIdentityHash,
      storageEvidenceDigest: selection.artifact.resultEvidenceHash,
      checksumReadbackEvidenceDigest,
      createOnly: true as const,
      privateProjectAsset: true as const,
    },
    technicalQa: {
      qaEvaluationId: selection.qa.qaEvaluationId,
      reconciliationId: selection.reconciliation.reconciliationId,
      qaEvidenceDigest: selection.qa.qaEvidenceHash,
      resultEvidenceDigest: selection.artifact.resultEvidenceHash,
      qaAggregateRevision: qaAggregate.revision,
      qaAggregateHash,
      currentSelectionHash,
      outputCommitmentHash,
      actualQaEvidenceState:
        'actual_remotion_mp4_ffprobe_qa_verified_v1' as const,
      independentFfprobeAndProfileFrameGoldenQaAttested: true as const,
      profileRequiredFrameGoldenCount: 5 as const,
      outcome: 'passed' as const,
    },
    resourceUsage: {
      evidenceId: resource.evidenceId,
      evidenceHash: resource.evidenceHash,
      evidenceClass: 'private_embedded_observed_usage_test' as const,
      operationProfileId: resource.operation.operationProfileId,
      operationProfileHash: resource.operation.operationProfileHash,
      runtimeExecutionIdentityDigest:
        resource.runtime.runtimeExecutionIdentityDigest,
      containerIdentityDigest: resource.runtime.containerIdentityDigest,
      measurementAgentVersion:
        'embedded_remotion_cgroup_v2_observer_v1' as const,
      measurementAgentDigest: resource.runtime.measurementAgentDigest,
      startedAt: resource.resourceUsage.startedAt,
      finishedAt: resource.resourceUsage.finishedAt,
      wallTimeMilliseconds: resource.resourceUsage.wallTimeMilliseconds,
      observedCpuMicroseconds: resource.resourceUsage.observedCpuMicroseconds,
      observedPeakMemoryBytes: resource.resourceUsage.observedPeakMemoryBytes,
      infrastructureEvidenceDigest:
        resource.resourceUsage.infrastructureEvidenceDigest,
      rateCardVersion: resource.infrastructureCost.rateCardVersion,
      rateCardDigest: resource.infrastructureCost.rateCardDigest,
    },
    cost: {
      providerCostMicros: 0 as const,
      infrastructureCostMicros:
        resource.infrastructureCost.actualInternalCostMicros,
      totalInternalProductionCostMicros:
        resource.infrastructureCost.actualInternalCostMicros,
      costEvidenceDigest,
      internalProductionCostOnly: true as const,
      failedOrUnknownAttemptCostRetained: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    timingAuthority,
    readiness: {
      individualCandidateSourceVerified: true as const,
      privateRoutingEvidenceEligible: true as const,
      canonicalFinalizationAllowed: false as const,
      authenticatedCreativeReviewRequired: true as const,
      fiveScenarioAttemptHistoryRequired: true as const,
      providerExecutionAuthorized: false as const,
      furtherRenderAuthorized: false as const,
      customerCommercialAuthorityGranted: false as const,
      promotionAuthorized: false as const,
      productionReady: false as const,
    },
    immutable: true as const,
  }
  const receipt = deepFreeze(
    canonicalRemotionCalibrationCandidateSourceReceiptSchema.parse({
      ...receiptBase,
      receiptHash: sha256AuthorityValue(receiptBase),
    }),
  )

  const candidate = createStyleCalibrationCandidateEvidence({
    plan,
    scenario,
    candidate: {
      workspaceId: plan.workspaceId,
      projectId: plan.projectId,
      editSessionId: plan.editSessionId,
      id: `calibration-candidate-${receipt.receiptHash.slice(0, 40)}`,
      productionId: plan.productionId,
      routeCandidateId: 'deterministic_reeditpro_composition',
      sourceEvidence: {
        kind: 'canonical_tool_attempt',
        readiness: 'canonical_private_routing_eligible',
        sourceAttemptId: executionAttemptId,
        sourceEvidenceDigest: receipt.receiptHash,
        sourceVerifierId:
          MOTION_STUDIO_CANONICAL_REMOTION_CALIBRATION_SOURCE_VERIFIER_ID,
        sourceVerified: true,
      },
      attemptOutcome: 'succeeded',
      output: {
        assetId: receipt.output.artifactId,
        assetVersionId: receipt.output.assetVersionId,
        mimeType: 'video/mp4',
        contentDigest: receipt.output.contentDigest,
        byteLength: receipt.output.byteLength,
        timingAuthority: stripTimingProjectionClass(receipt.timingAuthority),
        privateObjectIdentityHash: receipt.output.privateObjectIdentityHash,
        storageEvidenceDigest: receipt.output.storageEvidenceDigest,
        checksumReadbackEvidenceDigest:
          receipt.output.checksumReadbackEvidenceDigest,
        createOnly: true,
        privateProjectAsset: true,
      },
      technicalQa: {
        status: 'passed',
        evidenceDigest: receipt.technicalQa.qaEvidenceDigest,
        blockingIssueCodes: [],
      },
      creativeReview: { decision: 'pending' },
      knownFailureModes: [
        'Private unreleased calibration evidence still requires authenticated creative review and the complete five-scenario attempt history.',
      ],
      measuredLatencyMilliseconds:
        receipt.resourceUsage.wallTimeMilliseconds,
      cost: {
        providerCostMicros: 0,
        infrastructureCostMicros: receipt.cost.infrastructureCostMicros,
        costEvidenceDigest: receipt.cost.costEvidenceDigest,
      },
    },
  })
  return deepFreeze({ receipt, candidate })
}

export function deriveCanonicalPrivateEmbeddedRuntimeExecutionIdentityDigest(
  input: {
    executionAttemptId: string
    runnerClass: string
    runtimeAuthorityDigest: string
    runtimeImageDigest: string
    runtimeAttestationDigest: string
    containerIdentityDigest: string
  },
): string {
  return sha256AuthorityValue({
    domain: 'canonical_private_embedded_runtime_execution_identity_v1',
    executionAttemptId: stableId.parse(input.executionAttemptId),
    runnerClass: stableId.parse(input.runnerClass),
    runtimeAuthorityDigest: digest.parse(input.runtimeAuthorityDigest),
    runtimeImageDigest: digest.parse(input.runtimeImageDigest),
    runtimeAttestationDigest: digest.parse(input.runtimeAttestationDigest),
    containerIdentityDigest: digest.parse(input.containerIdentityDigest),
  })
}

export function assertCanonicalRemotionCalibrationQaReadbackFence(input: {
  initial: {
    aggregateRevision: number
    aggregateHash: string
    selectionHash: string
    outputCommitmentHash: string
  }
  final: {
    aggregateRevision: number
    aggregateHash: string
    selectionHash?: string
    outputCommitmentHash?: string
  }
}): void {
  const initial = z.object({
    aggregateRevision: safeInteger,
    aggregateHash: digest,
    selectionHash: digest,
    outputCommitmentHash: digest,
  }).strict().parse(input.initial)
  const final = z.object({
    aggregateRevision: safeInteger,
    aggregateHash: digest,
    selectionHash: digest.optional(),
    outputCommitmentHash: digest.optional(),
  }).strict().parse(input.final)
  if (
    final.aggregateRevision !== initial.aggregateRevision ||
    final.aggregateHash !== initial.aggregateHash ||
    final.selectionHash !== initial.selectionHash ||
    final.outputCommitmentHash !== initial.outputCommitmentHash
  ) {
    throw notReady(
      'Canonical QA selection or private output changed during calibration source verification.',
    )
  }
}

/**
 * Adapter for the existing private calibration evidence store. It verifies
 * only the exact pending source candidate. Authenticated creative review is a
 * separate record that binds this pending candidate digest to one reviewed
 * candidate digest; review fields can never be relabelled through this source.
 */
export function createCanonicalRemotionCalibrationCandidateSourceVerifier(
  context: ServiceContext,
): CalibrationCandidateSourceVerifier {
  return {
    evidenceClass: 'canonical_backend_runtime_unreleased',
    async verify({ candidate, approvedPlanSource }) {
      const parsed = styleCalibrationCandidateEvidenceSchema.parse(candidate)
      const projected = await projectCanonicalRemotionCalibrationCandidate({
        context,
        approvedPlanSource,
        executionAttemptId: parsed.sourceEvidence.sourceAttemptId,
      })
      assertCanonicalRemotionCalibrationPendingCandidateProjection({
        candidate: parsed,
        projectedCandidate: projected.candidate,
      })
      return createCalibrationCandidateSourceVerification({
        evidenceClass: this.evidenceClass,
        candidate: projected.candidate,
        sourceAuthorityReadbackDigest: projected.receipt.receiptHash,
      })
    },
  }
}

export function assertCanonicalRemotionCalibrationPendingCandidateProjection(
  input: {
    candidate: StyleCalibrationCandidateEvidence
    projectedCandidate: StyleCalibrationCandidateEvidence
  },
): void {
  const candidate = styleCalibrationCandidateEvidenceSchema.parse(
    input.candidate,
  )
  const projected = styleCalibrationCandidateEvidenceSchema.parse(
    input.projectedCandidate,
  )
  if (
    candidate.creativeReview.decision !== 'pending' ||
    candidate.routingEligible ||
    candidate.costPerAcceptedSecondMicros !== null ||
    projected.creativeReview.decision !== 'pending' ||
    projected.routingEligible ||
    projected.costPerAcceptedSecondMicros !== null ||
    stableAuthorityStringify(candidate) !== stableAuthorityStringify(projected)
  ) {
    throw invalid(
      'Canonical calibration source verification accepts only the exact pending candidate; authenticated review requires its separate source-to-reviewed digest record.',
    )
  }
}

export function verifyCanonicalRemotionCalibrationCandidateSourceReceipt(
  value: unknown,
): value is CanonicalRemotionCalibrationCandidateSourceReceipt {
  return canonicalRemotionCalibrationCandidateSourceReceiptSchema.safeParse(value).success
}

function exactTextScenario(
  scenarios: readonly StyleCalibrationScenario[],
): StyleCalibrationScenario {
  const matching = scenarios.filter((scenario) =>
    scenario.kind === 'exact_text_data')
  if (matching.length !== 1) {
    throw invalid('Approved calibration plan must contain one exact text/data scenario.')
  }
  return matching[0]!
}

function calibrationTimingAuthority(input: {
  snapshotTimingHash: string
  confirmedOutputFrame: { width: number; height: number; fps: number }
  profile: { width: number; height: number; fps: number; durationFrames: number }
  scenario: StyleCalibrationScenario
  executionAttemptId: string
  outputSha256: string
}) {
  const masterTimingPlanVersionId =
    `canonical-master-timing-${input.snapshotTimingHash.slice(0, 40)}`
  const confirmedFrameDigest = sha256AuthorityValue({
    domain: 'motion_studio_calibration_confirmed_frame_projection_v1',
    snapshotTimingHash: input.snapshotTimingHash,
    confirmedOutputFrame: input.confirmedOutputFrame,
  })
  const confirmedFrameId =
    `canonical-calibration-frame-from-confirmed-output-${confirmedFrameDigest.slice(0, 40)}`
  const timingAuthorityDigest = sha256AuthorityValue({
    domain: 'motion_studio_canonical_remotion_calibration_timing_v1',
    snapshotTimingHash: input.snapshotTimingHash,
    confirmedOutputFrame: input.confirmedOutputFrame,
    profile: input.profile,
    scenarioId: input.scenario.id,
    executionAttemptId: input.executionAttemptId,
    outputSha256: input.outputSha256,
  })
  return {
    masterTimingPlanVersionId,
    confirmedFrameId,
    timingAuthorityDigest,
    frameRate: 30 as const,
    width: 1_280 as const,
    height: 720 as const,
    aspectRatio: '16:9' as const,
    durationFrames: 180 as const,
    timebase: '1/30' as const,
    identifierProjectionClass:
      'content_addressed_from_canonical_approved_snapshot' as const,
  }
}

function stripTimingProjectionClass(
  value: CanonicalRemotionCalibrationCandidateSourceReceipt['timingAuthority'],
) {
  const { identifierProjectionClass, ...timing } = value
  if (
    identifierProjectionClass !==
      'content_addressed_from_canonical_approved_snapshot'
  ) {
    throw invalid('Calibration timing identifiers lost approved-snapshot authority.')
  }
  return timing
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate: 'canonical_remotion_calibration_candidate_source_verification',
  })
}

function notReady(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, {
    requiredGate: 'canonical_remotion_calibration_candidate_source_verification',
  })
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
