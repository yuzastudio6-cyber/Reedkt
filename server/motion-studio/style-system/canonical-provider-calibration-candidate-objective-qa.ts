import { z } from 'zod'

import {
  styleCalibrationCandidateEvidenceSchema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  StyleCalibrationCandidateEvidence,
  StyleCalibrationScenario,
  TimingAuthorityRef,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import type { ServiceContext } from '../../types'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { createStyleCalibrationCandidateEvidence } from './calibration-evidence'
import {
  reopenCanonicalApprovedStorytellingStylePlanSource,
  type CanonicalApprovedStorytellingStylePlanSourceReaderPort,
} from './canonical-approved-style-plan-source-reader'
import {
  canonicalProviderCalibrationCandidateSourceReceiptSchema,
  type CanonicalProviderCalibrationCandidateSourceReceipt,
} from './canonical-provider-calibration-candidate-source-verifier'
import {
  assertCanonicalApprovedStorytellingStylePlanSource,
} from './private-approved-calibration-evidence-store'
import {
  reopenCanonicalStorytellingCalibrationFrameAuthority,
  type CanonicalStorytellingCalibrationFrameAuthority,
  type CanonicalStorytellingCalibrationFrameAuthorityReaderPort,
} from './canonical-storytelling-calibration-frame-authority-reader'
import type {
  CanonicalApprovedStorytellingStylePlanSource,
} from './style-plan-source-store'
import {
  createCanonicalMotionStudioVisualCalibrationObjectiveQaReader,
} from './canonical-visual-calibration-objective-qa-reader'

export const MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_PORT_VERSION =
  'motion-studio.visual-calibration-objective-qa-port.v1' as const
export const MOTION_STUDIO_PROVIDER_CALIBRATION_OBJECTIVE_QA_PROJECTOR_ID =
  'motion-studio-provider-calibration-objective-qa-v1' as const
export const MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_THRESHOLD_VERSION =
  'motion-studio.visual-calibration-objective-qa-thresholds.2026-07-21.v1' as const
export const MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_OPERATION_ID =
  'tool.ffmpeg.execute_approved_media_recipe.v1' as const
export const MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_WORK_ITEM_TYPE =
  'run_asset_qa' as const
export const MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_EXECUTION_OPERATION =
  'run_visual_calibration_candidate_objective_qa' as const
export const MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_PROFILE_ID =
  'approved_visual_calibration_candidate_objective_qa_v1' as const
export const MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_RUNNER_CLASS =
  'offline_media_binary_visual_calibration_candidate_qa_v1' as const
export const MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_COST_PROFILE_ID =
  'ffmpeg_visual_calibration_candidate_objective_qa_cpu_2vcpu_2gib_v1' as const

export const MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_GATE_IDS = [
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

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeMicrosSchema = z.number().int().nonnegative()
  .max(Number.MAX_SAFE_INTEGER)
const timestampSchema = z.string().datetime({ offset: true })
const ratioSchema = z.number().finite().min(0).max(1)

const timingAuthoritySchema = z.object({
  masterTimingPlanVersionId: stableIdSchema,
  confirmedFrameId: stableIdSchema,
  timingAuthorityDigest: digestSchema,
  frameRate: z.number().finite().positive().max(240),
  width: z.number().int().positive().max(7_680),
  height: z.number().int().positive().max(4_320),
  aspectRatio: z.string().regex(/^\d+:\d+$/u),
  durationFrames: z.number().int().positive().max(14_400),
  timebase: z.string().regex(/^\d+\/\d+$/u),
}).strict()

const objectiveQaGateResultSchema = z.object({
  gateId: z.enum(MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_GATE_IDS),
  status: z.enum(['passed', 'failed']),
  evidenceDigest: digestSchema,
}).strict()

/**
 * Motion-owned, provider-neutral projection port for the future canonical
 * dependent objective-QA job. The port does not execute FFprobe/OpenCV and is
 * not itself queue, lease, tool, artifact, or cost authority.
 */
export const motionStudioVisualCalibrationObjectiveQaPortReceiptSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_PORT_VERSION,
  ),
  sourceAuthority: z.literal(
    'canonical_dependent_objective_qa_read_only_projection',
  ),
  evidenceClass: z.enum([
    'canonical_backend_runtime_unreleased',
    'controlled_test_fixture',
  ]),
  identity: z.object({
    ownerUserId: stableIdSchema,
    workspaceId: stableIdSchema,
    projectId: stableIdSchema,
    editSessionId: stableIdSchema,
    productionId: stableIdSchema,
    approvedSnapshotId: stableIdSchema,
    approvedSnapshotDigest: digestSchema,
    calibrationPlanId: stableIdSchema,
    calibrationPlanDigest: digestSchema,
    scenarioId: stableIdSchema,
    scenarioKind: z.enum([
      'style_led_motion',
      'character_continuity',
      'strict_first_last_frame',
      'reference_heavy',
    ]),
    providerDispatchAttemptId: stableIdSchema,
    sourceReceiptDigest: digestSchema,
  }).strict(),
  input: z.object({
    providerOutputId: stableIdSchema,
    assetId: stableIdSchema,
    assetVersionId: stableIdSchema,
    privateObjectIdentityHash: digestSchema,
    contentSha256: digestSchema,
    byteLength: z.number().int().positive().max(67_108_864),
    mimeType: z.literal('video/mp4'),
    storageEvidenceHash: digestSchema,
    sourceReadbackEvidenceHash: digestSchema,
    firstFrameReferenceSha256: digestSchema,
    lastFrameReferenceSha256: digestSchema,
    dependencyBytesReopened: z.literal(true),
    dependencyChecksumReadbackVerified: z.literal(true),
  }).strict(),
  execution: z.object({
    canonicalOperationId: z.literal(
      MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_OPERATION_ID,
    ),
    workItemType: z.literal(
      MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_WORK_ITEM_TYPE,
    ),
    executionOperation: z.literal(
      MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_EXECUTION_OPERATION,
    ),
    operationProfileId: z.literal(
      MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_PROFILE_ID,
    ),
    runnerClass: z.literal(
      MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_RUNNER_CLASS,
    ),
    approvedWorkItemId: stableIdSchema,
    jobId: stableIdSchema,
    executionAttemptId: stableIdSchema,
    queueClaimId: stableIdSchema,
    leaseId: stableIdSchema,
    dispatchGrantId: stableIdSchema,
    startedAt: timestampSchema,
    completedAt: timestampSchema,
    queueClaimLeaseAndOneUseDispatchReverified: z.literal(true),
    terminalAttemptReverified: z.literal(true),
    privateQaEvidenceCreateOnly: z.literal(true),
    retryCount: z.literal(0),
    fallbackCount: z.literal(0),
  }).strict(),
  measurements: z.object({
    containerFormat: z.enum(['mp4', 'invalid_or_unreadable']),
    videoStreamCount: z.number().int().min(0).max(8),
    videoCodec: stableIdSchema.nullable(),
    pixelFormat: stableIdSchema.nullable(),
    width: z.number().int().nonnegative().max(7_680),
    height: z.number().int().nonnegative().max(4_320),
    fpsNumerator: z.number().int().nonnegative().max(240_000),
    fpsDenominator: z.number().int().positive().max(10_000),
    durationFrames: z.number().int().nonnegative().max(14_400),
    durationMilliseconds: z.number().int().nonnegative().max(60_000),
    audioStreamCount: z.number().int().min(0).max(8),
    blackFrameRatio: ratioSchema.nullable(),
    frozenFrameRatio: ratioSchema.nullable(),
    longestFrozenRunFrames: z.number().int().nonnegative().max(14_400)
      .nullable(),
    motionSignalScore: ratioSchema.nullable(),
    firstFrameSimilarity: ratioSchema.nullable(),
    lastFrameSimilarity: ratioSchema.nullable(),
    measurementDigest: digestSchema,
  }).strict(),
  thresholds: z.object({
    version: z.literal(
      MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_THRESHOLD_VERSION,
    ),
    maximumBlackFrameRatio: z.literal(0.02),
    maximumFrozenFrameRatio: ratioSchema,
    maximumFrozenRunFrames: z.literal(47),
    minimumMotionSignalScore: z.literal(0.05),
    minimumFirstFrameSimilarity: ratioSchema,
    minimumLastFrameSimilarity: ratioSchema,
  }).strict(),
  privateQaArtifact: z.object({
    artifactId: stableIdSchema,
    artifactVersionId: stableIdSchema,
    privateObjectIdentityHash: digestSchema,
    contentSha256: digestSchema,
    byteLength: z.number().int().positive().max(1_048_576),
    mimeType: z.literal('application/json'),
    storageEvidenceHash: digestSchema,
    readbackEvidenceHash: digestSchema,
    createOnly: z.literal(true),
    checksumReadbackVerified: z.literal(true),
    browserProjectionContainsPrivateLocation: z.literal(false),
  }).strict(),
  technicalQa: z.object({
    status: z.enum(['passed', 'failed']),
    gateResults: z.array(objectiveQaGateResultSchema)
      .length(MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_GATE_IDS.length)
      .readonly(),
    blockingIssueCodes: z.array(stableIdSchema).max(32).readonly(),
    evidenceDigest: digestSchema,
  }).strict(),
  timingAuthority: timingAuthoritySchema.nullable(),
  resourceUsage: z.object({
    evidenceClass: z.enum([
      'private_embedded_observed_usage_test',
      'canonical_private_observed_usage_unreleased',
    ]),
    evidenceHash: digestSchema,
    runtimeIdentityDigest: digestSchema,
    measurementAgentDigest: digestSchema,
    observedCpuMicroseconds: z.number().int().positive()
      .max(Number.MAX_SAFE_INTEGER),
    observedPeakMemoryBytes: z.number().int().positive()
      .max(4_294_967_296),
    wallTimeMilliseconds: z.number().int().positive().max(15 * 60 * 1_000),
    operationCostProfileId: z.literal(
      MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_COST_PROFILE_ID,
    ),
    maximumAuthorizedInfrastructureCostMicros: safeMicrosSchema,
    infrastructureCostMicros: safeMicrosSchema,
    rateCardDigest: digestSchema,
    costEvidenceDigest: digestSchema,
  }).strict(),
  boundaries: z.object({
    sourceAndApprovedSnapshotReverified: z.literal(true),
    canonicalOperationAuthorityReverified: z.literal(true),
    objectiveQaOnly: z.literal(true),
    creativeReviewPerformed: z.literal(false),
    routingSelectionPerformed: z.literal(false),
    fiveScenarioFinalizationPerformed: z.literal(false),
    providerTransportActivated: z.literal(false),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
    timelineMutationPerformed: z.literal(false),
    renderOrExportPerformed: z.literal(false),
    promotionAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  immutable: z.literal(true),
  receiptDigest: digestSchema,
}).strict().superRefine((receipt, context) => {
  const unsigned = { ...receipt } as Record<string, unknown>
  delete unsigned.receiptDigest
  const expectedGates = MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_GATE_IDS
  const gateIdsMatch = receipt.technicalQa.gateResults.every(
    (gate, index) => gate.gateId === expectedGates[index],
  )
  const failedGateIds = receipt.technicalQa.gateResults
    .filter((gate) => gate.status === 'failed')
    .map((gate) => gate.gateId)
  const expectedGateStatuses = expectedObjectiveQaGateStatuses(receipt)
  const expectedThresholds = objectiveQaThresholds(receipt)
  const gateStatusesMatchMeasurements = receipt.technicalQa.gateResults.every(
    (gate) => gate.status === expectedGateStatuses.get(gate.gateId),
  )
  const expectedBlockingIssueCodes = failedGateIds.map((gateId) =>
    `${gateId}_failed`)
  const allPassed = failedGateIds.length === 0
  const evidenceClassesMatch =
    receipt.evidenceClass === 'controlled_test_fixture'
      ? receipt.resourceUsage.evidenceClass ===
        'private_embedded_observed_usage_test'
      : receipt.resourceUsage.evidenceClass ===
        'canonical_private_observed_usage_unreleased'
  const measuredFrameRate = receipt.measurements.fpsNumerator /
    receipt.measurements.fpsDenominator
  const expectedDurationMilliseconds = measuredFrameRate > 0
    ? receipt.measurements.durationFrames * 1_000 / measuredFrameRate
    : null
  const timingBase = receipt.timingAuthority
    ? timingAuthorityDigestInput({
        sourceReceiptDigest: receipt.identity.sourceReceiptDigest,
        contentSha256: receipt.input.contentSha256,
        timingAuthority: receipt.timingAuthority,
      })
    : null
  const structuralTimingPassed = [
    'container_integrity',
    'video_stream_present',
    'dimensions_within_authority',
    'duration_within_authority',
    'frame_rate_within_authority',
  ].every((gateId) => expectedGateStatuses.get(
    gateId as typeof MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_GATE_IDS[number],
  ) === 'passed')
  if (
    receipt.receiptDigest !== sha256CanonicalJson(unsigned) ||
    !evidenceClassesMatch ||
    !gateIdsMatch ||
    !gateStatusesMatchMeasurements ||
    sha256CanonicalJson(receipt.thresholds) !==
      sha256CanonicalJson(expectedThresholds) ||
    (receipt.technicalQa.status === 'passed') !== allPassed ||
    sha256CanonicalJson(receipt.technicalQa.blockingIssueCodes) !==
      sha256CanonicalJson(expectedBlockingIssueCodes) ||
    receipt.technicalQa.evidenceDigest !== sha256CanonicalJson({
      domain: 'motion_studio_visual_calibration_objective_qa_evidence_v1',
      sourceReceiptDigest: receipt.identity.sourceReceiptDigest,
      executionAttemptId: receipt.execution.executionAttemptId,
      contentSha256: receipt.input.contentSha256,
      measurementDigest: receipt.measurements.measurementDigest,
      privateQaArtifactContentSha256:
        receipt.privateQaArtifact.contentSha256,
      gateResults: receipt.technicalQa.gateResults,
      blockingIssueCodes: receipt.technicalQa.blockingIssueCodes,
      status: receipt.technicalQa.status,
    }) ||
    receipt.measurements.measurementDigest !== sha256CanonicalJson(
      omitKey(receipt.measurements, 'measurementDigest'),
    ) ||
    (expectedDurationMilliseconds !== null &&
      Math.abs(
        receipt.measurements.durationMilliseconds -
          expectedDurationMilliseconds,
      ) > 50) ||
    Boolean(receipt.timingAuthority) !== structuralTimingPassed ||
    receipt.timingAuthority !== null && (
      receipt.timingAuthority.frameRate !== measuredFrameRate ||
      receipt.timingAuthority.width !== receipt.measurements.width ||
      receipt.timingAuthority.height !== receipt.measurements.height ||
      receipt.timingAuthority.durationFrames !==
        receipt.measurements.durationFrames ||
      receipt.timingAuthority.timebase !==
        `${receipt.measurements.fpsDenominator}/${receipt.measurements.fpsNumerator}` ||
      receipt.timingAuthority.aspectRatio !== reducedAspectRatio(
        receipt.measurements.width,
        receipt.measurements.height,
      ) ||
      timingBase === null ||
      receipt.timingAuthority.timingAuthorityDigest !==
        sha256CanonicalJson(timingBase)
    ) ||
    receipt.resourceUsage.infrastructureCostMicros >
      receipt.resourceUsage.maximumAuthorizedInfrastructureCostMicros ||
    Date.parse(receipt.execution.completedAt) <
      Date.parse(receipt.execution.startedAt)
  ) {
    context.addIssue({
      code: 'custom',
      message:
        'Visual-calibration objective-QA receipt failed immutable result, gate, timing, or digest reconciliation.',
    })
  }
})

export type MotionStudioVisualCalibrationObjectiveQaPortReceipt = z.infer<
  typeof motionStudioVisualCalibrationObjectiveQaPortReceiptSchema
>

export interface MotionStudioVisualCalibrationObjectiveQaReaderPort {
  read(input: {
    sourceReceipt: CanonicalProviderCalibrationCandidateSourceReceipt
  }): Promise<MotionStudioVisualCalibrationObjectiveQaPortReceipt | null>
}

interface ObjectiveQaTestDependencies {
  approvedPlanSourceReader?:
    CanonicalApprovedStorytellingStylePlanSourceReaderPort
  frameAuthorityReader?:
    CanonicalStorytellingCalibrationFrameAuthorityReaderPort
  objectiveQaReader?: MotionStudioVisualCalibrationObjectiveQaReaderPort
}

export interface ProjectCanonicalProviderCalibrationCandidateAfterQaResult {
  objectiveQaReceipt: MotionStudioVisualCalibrationObjectiveQaPortReceipt
  candidate: StyleCalibrationCandidateEvidence | null
}

/**
 * Reopens one canonical objective-QA projection and creates the first pending
 * Motion calibration candidate for a provider MP4. It performs no media work,
 * review, selection, finalization, provider call, timeline mutation, or render.
 */
export async function projectCanonicalProviderCalibrationCandidateAfterObjectiveQa(
  input: {
    context: ServiceContext
    approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
    sourceReceipt: CanonicalProviderCalibrationCandidateSourceReceipt
    testDependencies?: ObjectiveQaTestDependencies
  },
): Promise<ProjectCanonicalProviderCalibrationCandidateAfterQaResult> {
  assertCanonicalApprovedStorytellingStylePlanSource(input.approvedPlanSource)
  if (input.testDependencies && input.context.env.nodeEnv !== 'test') {
    throw blocked(
      'Injected visual-calibration objective-QA dependencies are limited to the controlled test runtime.',
    )
  }
  const reader = input.testDependencies?.objectiveQaReader ??
    createCanonicalMotionStudioVisualCalibrationObjectiveQaReader(
      input.context,
    )
  const approvedPlanSource = await
    reopenCanonicalApprovedStorytellingStylePlanSource({
      context: input.context,
      claimedSource: input.approvedPlanSource,
      ...(input.testDependencies?.approvedPlanSourceReader
        ? { sourceReader: input.testDependencies.approvedPlanSourceReader }
        : {}),
    })
  const sourceReceipt =
    canonicalProviderCalibrationCandidateSourceReceiptSchema.parse(
      input.sourceReceipt,
    )
  const approvedProductionFrameAuthority = await
    reopenCanonicalStorytellingCalibrationFrameAuthority({
      context: input.context,
      approvedPlanSource,
      ...(input.testDependencies?.frameAuthorityReader
        ? { sourceReader: input.testDependencies.frameAuthorityReader }
        : {}),
    })
  const output = sourceReceipt.canonicalAttempt.privateOutput
  if (
    !output ||
    !sourceReceipt.readiness.motionSourceVerified ||
    !sourceReceipt.readiness.privateProviderOutputPresent ||
    !sourceReceipt.readiness.objectiveMediaQaRequired ||
    sourceReceipt.readiness.candidateOutputProjectionAllowed
  ) {
    throw notReady(
      'Provider calibration candidate requires one source-verified private MP4 awaiting objective QA.',
    )
  }
  const plan = approvedPlanSource.approvedCalibrationPlan
  const scenario = exactScenario(plan.scenarios, sourceReceipt)
  assertSourceReceiptMatchesPlan({
    approvedPlanSource,
    approvedProductionFrameAuthority,
    sourceReceipt,
    scenario,
  })
  const readInput = { sourceReceipt }
  const objectiveQaRead = await reader.read(readInput)
  if (!objectiveQaRead) {
    throw notReady(
      'Canonical visual-calibration objective QA is not complete for this exact provider output.',
    )
  }
  const objectiveQaReceipt =
    motionStudioVisualCalibrationObjectiveQaPortReceiptSchema.parse(
      objectiveQaRead,
    )
  assertObjectiveQaMatchesSource({
    approvedPlanSource,
    approvedProductionFrameAuthority,
    sourceReceipt,
    objectiveQaReceipt,
    scenario,
  })
  if (
    objectiveQaReceipt.evidenceClass !== 'controlled_test_fixture' ||
    sourceReceipt.canonicalAttempt.evidenceClass !==
      'private_injected_nonprovider_test'
  ) {
    throw notReady(
      'Canonical backend objective-QA projection remains closed until released provider/runtime evidence and its released-evidence projection path are qualified.',
    )
  }
  const readback =
    motionStudioVisualCalibrationObjectiveQaPortReceiptSchema.parse(
      await reader.read(readInput),
    )
  if (readback.receiptDigest !== objectiveQaReceipt.receiptDigest) {
    throw notReady(
      'Canonical visual-calibration objective-QA receipt changed during readback.',
    )
  }

  const sourceEvidence = {
    kind: 'non_promotable_private_injected' as const,
    readiness: 'non_promotable_injected' as const,
  }
  const providerLatencyMilliseconds = Math.max(
    0,
    Date.parse(sourceReceipt.canonicalAttempt.completedAt) -
      Date.parse(sourceReceipt.canonicalAttempt.startedAt),
  )
  const infrastructureCostMicros = safeAdd(
    sourceReceipt.canonicalAttempt.infrastructureCostMicros,
    objectiveQaReceipt.resourceUsage.infrastructureCostMicros,
  )
  const costEvidenceDigest = sha256CanonicalJson({
    domain: 'motion_studio_visual_calibration_candidate_cost_v1',
    sourceReceiptDigest: sourceReceipt.receiptDigest,
    providerAttemptCostEvidenceHash:
      sourceReceipt.canonicalAttempt.providerAttemptCostEvidenceHash,
    providerWorkerResourceEvidenceHash:
      sourceReceipt.canonicalAttempt.workerResourceEvidenceHash,
    objectiveQaResourceEvidenceHash:
      objectiveQaReceipt.resourceUsage.evidenceHash,
    objectiveQaCostEvidenceDigest:
      objectiveQaReceipt.resourceUsage.costEvidenceDigest,
    providerCostMicros: sourceReceipt.canonicalAttempt.providerCostMicros,
    infrastructureCostMicros,
  })
  const totalInternalProductionCostMicros =
    sourceReceipt.canonicalAttempt.providerCostMicros === null
      ? null
      : safeAdd(
          sourceReceipt.canonicalAttempt.providerCostMicros,
          infrastructureCostMicros,
        )
  const maximumAuthorizedInternalCostMicros =
    plan.approvalAuthority.maximumAuthorizedInternalCostMicros
  if (
    maximumAuthorizedInternalCostMicros === undefined ||
    totalInternalProductionCostMicros !== null &&
      totalInternalProductionCostMicros > maximumAuthorizedInternalCostMicros
  ) {
    throw blocked(
      'Visual-calibration provider and objective-QA cost exceeds the exact approved plan authority.',
    )
  }
  const qaPassed = objectiveQaReceipt.technicalQa.status === 'passed'
  const candidate = objectiveQaReceipt.timingAuthority
    ? createStyleCalibrationCandidateEvidence({
        plan,
        scenario,
        candidate: {
          workspaceId: plan.workspaceId,
          projectId: plan.projectId,
          editSessionId: plan.editSessionId,
          id: `calibration-candidate-${objectiveQaReceipt.receiptDigest.slice(0, 40)}`,
          productionId: plan.productionId,
          routeCandidateId: sourceReceipt.canonicalAttempt.providerRouteId,
          sourceEvidence: {
            ...sourceEvidence,
            sourceAttemptId: sourceReceipt.identity.dispatchAttemptId,
            sourceEvidenceDigest: objectiveQaReceipt.receiptDigest,
            sourceVerifierId:
              MOTION_STUDIO_PROVIDER_CALIBRATION_OBJECTIVE_QA_PROJECTOR_ID,
            sourceVerified: true,
          },
          attemptOutcome: 'succeeded',
          output: {
            assetId: output.assetId,
            assetVersionId: output.assetVersionId,
            mimeType: 'video/mp4',
            contentDigest: output.contentSha256,
            byteLength: output.byteLength,
            timingAuthority: objectiveQaReceipt.timingAuthority,
            privateObjectIdentityHash: output.privateObjectIdentityHash,
            storageEvidenceDigest: output.storageEvidenceHash,
            checksumReadbackEvidenceDigest: output.sourceReadbackEvidenceHash,
            createOnly: true,
            privateProjectAsset: true,
          },
          technicalQa: {
            status: objectiveQaReceipt.technicalQa.status,
            evidenceDigest: objectiveQaReceipt.technicalQa.evidenceDigest,
            blockingIssueCodes:
              objectiveQaReceipt.technicalQa.blockingIssueCodes,
          },
          creativeReview: { decision: 'pending' },
          knownFailureModes: qaPassed
            ? [
                'Objective QA passed; authenticated creative review and complete five-scenario history are still required.',
              ]
            : objectiveQaReceipt.technicalQa.blockingIssueCodes.map((code) =>
                `Objective QA blocked this candidate: ${code}.`),
          measuredLatencyMilliseconds: safeAdd(
            providerLatencyMilliseconds,
            objectiveQaReceipt.resourceUsage.wallTimeMilliseconds,
          ),
          cost: {
            providerCostMicros:
              sourceReceipt.canonicalAttempt.providerCostMicros,
            infrastructureCostMicros,
            costEvidenceDigest,
          },
        },
      })
    : null
  return deepFreeze({
    objectiveQaReceipt,
    candidate: candidate
      ? styleCalibrationCandidateEvidenceSchema.parse(candidate)
      : null,
  })
}

export function verifyMotionStudioVisualCalibrationObjectiveQaPortReceipt(
  value: unknown,
): value is MotionStudioVisualCalibrationObjectiveQaPortReceipt {
  return motionStudioVisualCalibrationObjectiveQaPortReceiptSchema
    .safeParse(value).success
}

/** Controlled-fixture helper only; production timing must come from backend. */
export function createControlledTestVisualCalibrationTimingAuthority(input: {
  sourceReceiptDigest: string
  contentSha256: string
  masterTimingPlanVersionId: string
  confirmedFrameId: string
  width: number
  height: number
  durationFrames: number
}): TimingAuthorityRef {
  const base = {
    masterTimingPlanVersionId: stableIdSchema.parse(
      input.masterTimingPlanVersionId,
    ),
    confirmedFrameId: stableIdSchema.parse(input.confirmedFrameId),
    frameRate: 24 as const,
    width: z.number().int().positive().max(3_840).parse(input.width),
    height: z.number().int().positive().max(2_160).parse(input.height),
    aspectRatio: reducedAspectRatio(input.width, input.height),
    durationFrames: z.number().int().min(72).max(240)
      .parse(input.durationFrames),
    timebase: '1/24' as const,
  }
  const timingAuthorityDigest = sha256CanonicalJson(
    timingAuthorityDigestInput({
      sourceReceiptDigest: digestSchema.parse(input.sourceReceiptDigest),
      contentSha256: digestSchema.parse(input.contentSha256),
      timingAuthority: {
        ...base,
        timingAuthorityDigest: '0'.repeat(64),
      },
    }),
  )
  return timingAuthoritySchema.parse({ ...base, timingAuthorityDigest })
}

function expectedObjectiveQaGateStatuses(
  receipt: MotionStudioVisualCalibrationObjectiveQaPortReceipt,
): ReadonlyMap<
  typeof MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_GATE_IDS[number],
  'passed' | 'failed'
> {
  const result = new Map<
    typeof MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_GATE_IDS[number],
    'passed' | 'failed'
  >([
    ['container_integrity', receipt.measurements.containerFormat === 'mp4'
      ? 'passed' : 'failed'],
    ['video_stream_present',
      receipt.measurements.videoStreamCount === 1
        ? 'passed' : 'failed'],
    ['dimensions_within_authority',
      receipt.measurements.width > 0 &&
      receipt.measurements.height > 0 &&
      receipt.measurements.width * receipt.measurements.height <= 921_600
        ? 'passed' : 'failed'],
    ['duration_within_authority',
      receipt.measurements.durationFrames > 0 &&
      receipt.measurements.durationMilliseconds >= 3_000 &&
      receipt.measurements.durationMilliseconds <= 10_000
        ? 'passed' : 'failed'],
    ['frame_rate_within_authority',
      receipt.measurements.fpsNumerator === 24 &&
      receipt.measurements.fpsDenominator === 1
        ? 'passed' : 'failed'],
    ['black_frame_scan',
      receipt.measurements.blackFrameRatio !== null &&
      receipt.measurements.blackFrameRatio <=
        receipt.thresholds.maximumBlackFrameRatio ? 'passed' : 'failed'],
    ['freeze_frame_scan',
      receipt.measurements.frozenFrameRatio !== null &&
      receipt.measurements.longestFrozenRunFrames !== null &&
      receipt.measurements.frozenFrameRatio <=
        receipt.thresholds.maximumFrozenFrameRatio &&
      receipt.measurements.longestFrozenRunFrames <=
        receipt.thresholds.maximumFrozenRunFrames ? 'passed' : 'failed'],
    ['motion_signal_present',
      receipt.measurements.motionSignalScore !== null &&
      receipt.measurements.motionSignalScore >=
        receipt.thresholds.minimumMotionSignalScore ? 'passed' : 'failed'],
    ['first_frame_similarity',
      receipt.measurements.firstFrameSimilarity !== null &&
      receipt.measurements.firstFrameSimilarity >=
        receipt.thresholds.minimumFirstFrameSimilarity
        ? 'passed' : 'failed'],
    ['last_frame_similarity',
      receipt.measurements.lastFrameSimilarity !== null &&
      receipt.measurements.lastFrameSimilarity >=
        receipt.thresholds.minimumLastFrameSimilarity
        ? 'passed' : 'failed'],
  ])
  return result
}

function objectiveQaThresholds(
  receipt: MotionStudioVisualCalibrationObjectiveQaPortReceipt,
) {
  const similarityThreshold = {
    style_led_motion: 0.75,
    character_continuity: 0.80,
    strict_first_last_frame: 0.90,
    reference_heavy: 0.85,
  }[receipt.identity.scenarioKind]
  return {
    version:
      MOTION_STUDIO_VISUAL_CALIBRATION_OBJECTIVE_QA_THRESHOLD_VERSION,
    maximumBlackFrameRatio: 0.02 as const,
    maximumFrozenFrameRatio: Math.min(
      0.67,
      48 / Math.max(1, receipt.measurements.durationFrames),
    ),
    maximumFrozenRunFrames: 47 as const,
    minimumMotionSignalScore: 0.05 as const,
    minimumFirstFrameSimilarity: similarityThreshold,
    minimumLastFrameSimilarity: similarityThreshold,
  }
}

function exactScenario(
  scenarios: readonly StyleCalibrationScenario[],
  sourceReceipt: CanonicalProviderCalibrationCandidateSourceReceipt,
): StyleCalibrationScenario {
  const matching = scenarios.filter((scenario) =>
    scenario.id === sourceReceipt.identity.scenarioId &&
    scenario.kind === sourceReceipt.identity.scenarioKind)
  if (matching.length !== 1) {
    throw blocked(
      'Provider calibration source no longer matches one approved scenario.',
    )
  }
  return matching[0]!
}

function assertSourceReceiptMatchesPlan(input: {
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  approvedProductionFrameAuthority:
    CanonicalStorytellingCalibrationFrameAuthority
  sourceReceipt: CanonicalProviderCalibrationCandidateSourceReceipt
  scenario: StyleCalibrationScenario
}): void {
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  const receipt = input.sourceReceipt
  const routeAdmitted = plan.routePolicy.candidates.some((candidate) =>
    candidate.providerRoute === receipt.canonicalAttempt.providerRouteId)
  if (
    receipt.identity.workspaceId !== plan.workspaceId ||
    receipt.identity.projectId !== plan.projectId ||
    receipt.identity.editSessionId !== plan.editSessionId ||
    receipt.identity.productionId !== plan.productionId ||
    receipt.identity.approvedSnapshotId !==
      input.approvedPlanSource.approvedSnapshotId ||
    receipt.identity.approvedSnapshotDigest !==
      input.approvedPlanSource.approvedSnapshotDigest ||
    receipt.identity.approvedCalibrationPlanId !== plan.id ||
    receipt.identity.approvedCalibrationPlanDigest !== plan.planDigest ||
    receipt.planningSource.sourcePlanReviewInputDigest !==
      input.approvedPlanSource.sourcePlanReviewInputDigest ||
    receipt.planningSource.canonicalStyleComponentDigest !==
      input.approvedPlanSource.canonicalProjectionDigest ||
    receipt.planningSource.approvedProductionFrameAuthority
      .authorityReceiptDigest !==
      input.approvedProductionFrameAuthority.authorityReceiptDigest ||
    !input.scenario.requiresGeneratedMedia ||
    input.scenario.deterministicTextDataRequired ||
    !routeAdmitted
  ) {
    throw blocked(
      'Provider calibration source changed approved plan, scenario, or route authority.',
    )
  }
}

function assertObjectiveQaMatchesSource(input: {
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  approvedProductionFrameAuthority:
    CanonicalStorytellingCalibrationFrameAuthority
  sourceReceipt: CanonicalProviderCalibrationCandidateSourceReceipt
  objectiveQaReceipt: MotionStudioVisualCalibrationObjectiveQaPortReceipt
  scenario: StyleCalibrationScenario
}): void {
  const {
    sourceReceipt,
    approvedProductionFrameAuthority,
    objectiveQaReceipt: qa,
  } = input
  const output = sourceReceipt.canonicalAttempt.privateOutput
  if (!output) throw notReady('Provider calibration output disappeared.')
  if (
    qa.evidenceClass === 'controlled_test_fixture' &&
      sourceReceipt.canonicalAttempt.evidenceClass !==
        'private_injected_nonprovider_test' ||
    qa.evidenceClass === 'canonical_backend_runtime_unreleased' &&
      sourceReceipt.canonicalAttempt.evidenceClass !==
        'canonical_backend_runtime_unreleased' ||
    qa.identity.ownerUserId !== sourceReceipt.identity.ownerUserId ||
    qa.identity.workspaceId !== sourceReceipt.identity.workspaceId ||
    qa.identity.projectId !== sourceReceipt.identity.projectId ||
    qa.identity.editSessionId !== sourceReceipt.identity.editSessionId ||
    qa.identity.productionId !== sourceReceipt.identity.productionId ||
    qa.identity.approvedSnapshotId !==
      sourceReceipt.identity.approvedSnapshotId ||
    qa.identity.approvedSnapshotDigest !==
      sourceReceipt.identity.approvedSnapshotDigest ||
    qa.identity.calibrationPlanId !==
      sourceReceipt.identity.approvedCalibrationPlanId ||
    qa.identity.calibrationPlanDigest !==
      sourceReceipt.identity.approvedCalibrationPlanDigest ||
    qa.identity.scenarioId !== input.scenario.id ||
    qa.identity.scenarioKind !== input.scenario.kind ||
    qa.identity.providerDispatchAttemptId !==
      sourceReceipt.identity.dispatchAttemptId ||
    qa.identity.sourceReceiptDigest !== sourceReceipt.receiptDigest ||
    qa.input.providerOutputId !== output.outputId ||
    qa.input.assetId !== output.assetId ||
    qa.input.assetVersionId !== output.assetVersionId ||
    qa.input.privateObjectIdentityHash !== output.privateObjectIdentityHash ||
    qa.input.contentSha256 !== output.contentSha256 ||
    qa.input.byteLength !== output.byteLength ||
    qa.input.storageEvidenceHash !== output.storageEvidenceHash ||
    qa.input.sourceReadbackEvidenceHash !== output.sourceReadbackEvidenceHash ||
    qa.input.firstFrameReferenceSha256 !==
      sourceReceipt.planningSource.firstFrameSha256 ||
    qa.input.lastFrameReferenceSha256 !==
      sourceReceipt.planningSource.lastFrameSha256 ||
    qa.timingAuthority !== null && (
      qa.timingAuthority.masterTimingPlanVersionId !==
        approvedProductionFrameAuthority.masterTimingPlanVersionId ||
      qa.timingAuthority.confirmedFrameId !==
        approvedProductionFrameAuthority.confirmedFrameId ||
      qa.timingAuthority.aspectRatio !==
        approvedProductionFrameAuthority.aspectRatio ||
      qa.timingAuthority.width !== 1_280 ||
      qa.timingAuthority.height !== 720
    )
  ) {
    throw blocked(
      'Objective-QA receipt changed the exact provider output or Motion calibration authority.',
    )
  }
}

function timingAuthorityDigestInput(input: {
  sourceReceiptDigest: string
  contentSha256: string
  timingAuthority: TimingAuthorityRef
}) {
  const timing = {
    masterTimingPlanVersionId:
      input.timingAuthority.masterTimingPlanVersionId,
    confirmedFrameId: input.timingAuthority.confirmedFrameId,
    frameRate: input.timingAuthority.frameRate,
    width: input.timingAuthority.width,
    height: input.timingAuthority.height,
    aspectRatio: input.timingAuthority.aspectRatio,
    durationFrames: input.timingAuthority.durationFrames,
    timebase: input.timingAuthority.timebase,
  }
  return {
    domain: 'motion_studio_visual_calibration_timing_authority_v1',
    sourceReceiptDigest: input.sourceReceiptDigest,
    contentSha256: input.contentSha256,
    timing,
  }
}

function reducedAspectRatio(width: number, height: number): string {
  let a = Math.abs(width)
  let b = Math.abs(height)
  while (b !== 0) [a, b] = [b, a % b]
  return `${width / a}:${height / a}`
}

function omitKey<T extends Record<string, unknown>, K extends keyof T>(
  value: T,
  key: K,
): Omit<T, K> {
  const result = { ...value }
  delete result[key]
  return result
}

function safeAdd(left: number, right: number): number {
  const total = left + right
  if (!Number.isSafeInteger(total) || total < 0) {
    throw blocked('Visual-calibration objective-QA cost or latency overflowed.')
  }
  return total
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

function blocked(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_visual_calibration_objective_qa',
    productionReady: false,
  })
}

function notReady(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 409, {
    requiredGate: 'canonical_visual_calibration_objective_qa_reader',
    productionReady: false,
  })
}
