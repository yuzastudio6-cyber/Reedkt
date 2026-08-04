import { z } from 'zod'

import {
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID,
  CANONICAL_GOOGLE_VISUAL_CALIBRATION_ROUTE_ID,
  canonicalProviderWorkAuthorizationV4Schema,
} from '../../edit-architecture/canonical-provider-work-authority'
import { ApiError } from '../../errors/api-error'
import {
  projectCanonicalVisualCalibrationConsumerReceipt,
  type ProjectCanonicalVisualCalibrationConsumerReceiptInput,
} from '../../services/canonical-private-visual-calibration-consumer-receipt-service'
import { sha256AuthorityValue } from '../../services/private-edit-authority-store'
import { getRequiredAuthUserId } from '../../services/service-helpers'
import {
  canonicalProviderAttemptConsumerReceiptSchema,
  type CanonicalProviderAttemptConsumerReceipt,
} from '../../validation/canonical-provider-attempt-consumer-receipt-schemas'
import type { ServiceContext } from '../../types'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  reopenCanonicalApprovedStorytellingStylePlanSource,
  type CanonicalApprovedStorytellingStylePlanSourceReaderPort,
} from './canonical-approved-style-plan-source-reader'
import {
  canonicalStorytellingCalibrationFrameAuthoritySchema,
  reopenCanonicalStorytellingCalibrationFrameAuthority,
  type CanonicalStorytellingCalibrationFrameAuthority,
  type CanonicalStorytellingCalibrationFrameAuthorityReaderPort,
} from './canonical-storytelling-calibration-frame-authority-reader'
import {
  assertCanonicalApprovedStorytellingStylePlanSource,
} from './private-approved-calibration-evidence-store'
import type {
  CanonicalApprovedStorytellingStylePlanSource,
} from './style-plan-source-store'
import {
  createCanonicalMotionStudioVisualCalibrationSourceReader,
  type MotionStudioVisualCalibrationSelectionReaderPort,
} from './visual-calibration-source-authority-reader'
import {
  createMotionStudioVisualCalibrationSourceStore,
  type MotionStudioVisualCalibrationSourceStore,
} from './visual-calibration-source-store'

interface CanonicalProviderCalibrationSourceTestDependencies {
  approvedPlanSourceReader?:
    CanonicalApprovedStorytellingStylePlanSourceReaderPort
  frameAuthorityReader?:
    CanonicalStorytellingCalibrationFrameAuthorityReaderPort
  sourceStore?: MotionStudioVisualCalibrationSourceStore
}

export const MOTION_STUDIO_CANONICAL_PROVIDER_CALIBRATION_SOURCE_RECEIPT_VERSION =
  'motion-studio.canonical-provider-calibration-source-receipt.v2' as const
export const MOTION_STUDIO_CANONICAL_PROVIDER_CALIBRATION_SOURCE_VERIFIER_ID =
  'motion-studio-canonical-provider-calibration-source-v1' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safeMicrosSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

function resolveVisualCalibrationSourceStore(input: {
  context: ServiceContext
  selectionReader?: MotionStudioVisualCalibrationSelectionReaderPort
  testDependencies?: CanonicalProviderCalibrationSourceTestDependencies
}): MotionStudioVisualCalibrationSourceStore {
  if (input.testDependencies && input.context.env.nodeEnv !== 'test') {
    throw blocked(
      'Injected visual-calibration source dependencies are limited to the controlled test runtime.',
    )
  }
  if (input.testDependencies?.sourceStore) {
    return input.testDependencies.sourceStore
  }
  if (!input.selectionReader) {
    throw blocked(
      'Canonical visual-calibration projection requires the server-owned selection reader.',
    )
  }
  return createMotionStudioVisualCalibrationSourceStore({
    localStorageRoot: input.context.env.localStorageRoot,
    sourceReader: createCanonicalMotionStudioVisualCalibrationSourceReader(
      input.context,
      input.selectionReader,
    ),
  })
}

const privateOutputProjectionSchema = z.object({
  outputId: stableIdSchema,
  assetId: stableIdSchema,
  assetVersionId: stableIdSchema,
  privateObjectIdentityHash: digestSchema,
  contentSha256: digestSchema,
  byteLength: z.number().int().positive().max(67_108_864),
  mimeType: z.literal('video/mp4'),
  artifactEvidenceDigest: digestSchema,
  storageEvidenceHash: digestSchema,
  sourceReadbackEvidenceHash: digestSchema,
  providerGenerated: z.boolean(),
  createOnly: z.literal(true),
  checksumReadbackVerified: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
}).strict()

export const canonicalProviderCalibrationCandidateSourceReceiptSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_CANONICAL_PROVIDER_CALIBRATION_SOURCE_RECEIPT_VERSION,
  ),
  sourceAuthority: z.literal(
    'canonical_provider_attempt_plus_motion_source_readback',
  ),
  identity: z.object({
    ownerUserId: stableIdSchema,
    workspaceId: stableIdSchema,
    projectId: stableIdSchema,
    editSessionId: stableIdSchema,
    productionId: stableIdSchema,
    approvedSnapshotId: stableIdSchema,
    approvedSnapshotDigest: digestSchema,
    approvedCalibrationPlanId: stableIdSchema,
    approvedCalibrationPlanDigest: digestSchema,
    scenarioId: stableIdSchema,
    scenarioKind: z.enum([
      'style_led_motion',
      'character_continuity',
      'strict_first_last_frame',
      'reference_heavy',
    ]),
    sourceRequestId: stableIdSchema,
    dispatchAttemptId: stableIdSchema,
    queueClaimId: stableIdSchema,
  }).strict(),
  planningSource: z.object({
    sourcePlanReviewInputDigest: digestSchema,
    canonicalStyleComponentDigest: digestSchema,
    visualCalibrationContextDigest: digestSchema,
    motionSourceRecordDigest: digestSchema,
    approvedProductionFrameAuthority:
      canonicalStorytellingCalibrationFrameAuthoritySchema,
    sourceReadbackEvidenceClass: z.enum([
      'canonical_motion_repository_unreleased',
      'controlled_repository_fixture',
    ]),
    sourceSelectionDigest: digestSchema,
    referenceContractVersionId: stableIdSchema,
    referenceContractDigest: digestSchema,
    referenceContractArtifactPayloadDigest: digestSchema,
    firstFrameAssetId: stableIdSchema,
    firstFrameAssetVersionId: stableIdSchema,
    firstFramePrivateObjectIdentityHash: digestSchema,
    firstFrameSha256: digestSchema,
    firstFrameAuthorityDigest: digestSchema,
    lastFrameAssetId: stableIdSchema,
    lastFrameAssetVersionId: stableIdSchema,
    lastFramePrivateObjectIdentityHash: digestSchema,
    lastFrameSha256: digestSchema,
    lastFrameAuthorityDigest: digestSchema,
    continuityContractId: stableIdSchema,
    continuityMotionDnaVersionId: stableIdSchema,
    continuityMotionDnaContentDigest: digestSchema,
    continuityMotionDnaArtifactPayloadDigest: digestSchema,
    continuityContractDigest: digestSchema,
    sourceRepositoryReverified: z.literal(true),
    privateFrameBytesReverified: z.literal(true),
  }).strict(),
  canonicalAttempt: z.object({
    receiptId: stableIdSchema,
    receiptHash: digestSchema,
    evidenceClass: z.enum([
      'private_injected_nonprovider_test',
      'canonical_backend_runtime_unreleased',
    ]),
    promotionClass: z.enum([
      'non_promotable_private_injected',
      'unreleased_runtime_not_production',
    ]),
    operationId: z.literal(CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID),
    providerRouteId: z.literal(CANONICAL_GOOGLE_VISUAL_CALIBRATION_ROUTE_ID),
    providerModelId: z.literal('gemini-omni-flash-preview'),
    terminalState: z.enum([
      'succeeded',
      'failed',
      'unknown_reconciliation_required',
      'unknown_reconciled_succeeded',
      'unknown_reconciled_failed',
    ]),
    retryCount: z.literal(0),
    fallbackCount: z.literal(0),
    privateOutput: privateOutputProjectionSchema.nullable(),
    providerAttemptCostEvidenceHash: digestSchema,
    workerResourceEvidenceHash: digestSchema,
    providerCostMicros: safeMicrosSchema.nullable(),
    infrastructureCostMicros: safeMicrosSchema,
    totalInternalProductionCostMicros: safeMicrosSchema.nullable(),
    startedAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }),
  }).strict(),
  verification: z.object({
    canonicalPackageQueueDispatchOutputAndCostStoresReverified:
      z.literal(true),
    canonicalReceiptHashReverified: z.literal(true),
    canonicalReceiptDidNotClaimMotionSourceVerification: z.literal(true),
    approvedStylePlanAndScenarioReverified: z.literal(true),
    artifactPayloadsReopenedFromRepository: z.literal(true),
    referenceContractReverified: z.literal(true),
    frameVersionAndObjectIdentityReverified: z.literal(true),
    firstAndLastFrameBytesReverified: z.literal(true),
    approvedProductionFrameAndTimingReverified: z.literal(true),
    continuityGrammarReverified: z.literal(true),
    providerAndInfrastructureCostSeparated: z.literal(true),
  }).strict(),
  readiness: z.object({
    motionSourceVerified: z.literal(true),
    privateProviderOutputPresent: z.boolean(),
    objectiveMediaQaRequired: z.literal(true),
    candidateOutputProjectionAllowed: z.literal(false),
    creativeReviewAllowed: z.literal(false),
    routingEligible: z.literal(false),
    fiveScenarioFinalizationAllowed: z.literal(false),
    providerTransportActivated: z.literal(false),
    customerCommercialAuthorityGranted: z.literal(false),
    promotionAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    canonicalSourceProjectionCount: z.literal(1),
    externalRequestCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    privateArtifactWriteCount: z.literal(0),
    technicalQaMutationCount: z.literal(0),
    creativeReviewMutationCount: z.literal(0),
    selectionCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  immutable: z.literal(true),
  receiptDigest: digestSchema,
}).strict().superRefine((receipt, context) => {
  const unsigned = { ...receipt } as Record<string, unknown>
  delete unsigned.receiptDigest
  const successful = receipt.canonicalAttempt.terminalState === 'succeeded' ||
    receipt.canonicalAttempt.terminalState === 'unknown_reconciled_succeeded'
  const total = receipt.canonicalAttempt.providerCostMicros === null
    ? null
    : receipt.canonicalAttempt.providerCostMicros +
      receipt.canonicalAttempt.infrastructureCostMicros
  const frameAuthority =
    receipt.planningSource.approvedProductionFrameAuthority
  const frameAuthorityMatchesReceipt =
    frameAuthority.workspaceId === receipt.identity.workspaceId &&
    frameAuthority.projectId === receipt.identity.projectId &&
    frameAuthority.editSessionId === receipt.identity.editSessionId &&
    frameAuthority.productionId === receipt.identity.productionId &&
    frameAuthority.approvedSnapshotId === receipt.identity.approvedSnapshotId &&
    frameAuthority.approvedSnapshotDigest ===
      receipt.identity.approvedSnapshotDigest &&
    frameAuthority.storytellingStyleComponentDigest ===
      receipt.planningSource.canonicalStyleComponentDigest &&
    (receipt.planningSource.sourceReadbackEvidenceClass ===
      'controlled_repository_fixture'
      ? frameAuthority.evidenceClass === 'controlled_test_fixture'
      : frameAuthority.evidenceClass ===
        'canonical_backend_runtime_unreleased')
  if (
    receipt.receiptDigest !== sha256CanonicalJson(unsigned) ||
    !frameAuthorityMatchesReceipt ||
    successful !== (receipt.canonicalAttempt.privateOutput !== null) ||
    receipt.readiness.privateProviderOutputPresent !== successful ||
    receipt.canonicalAttempt.totalInternalProductionCostMicros !== total ||
    Date.parse(receipt.canonicalAttempt.completedAt) <
      Date.parse(receipt.canonicalAttempt.startedAt)
  ) {
    context.addIssue({
      code: 'custom',
      message:
        'Canonical provider calibration source receipt failed terminal, output, cost, or digest reconciliation.',
    })
  }
})

export type CanonicalProviderCalibrationCandidateSourceReceipt = z.infer<
  typeof canonicalProviderCalibrationCandidateSourceReceiptSchema
>

export interface ProjectCanonicalProviderCalibrationCandidateSourceResult {
  receipt: CanonicalProviderCalibrationCandidateSourceReceipt
}

/**
 * Reopens the shared provider lifecycle and then reopens Motion's exact
 * planning/reference/frame/continuity source record. It deliberately returns
 * an intake receipt rather than a StyleCalibrationCandidateEvidence: that
 * final candidate contract requires the provider MP4 to pass objective media
 * QA before it can represent a successful output.
 */
export async function projectCanonicalProviderCalibrationCandidateSource(input: {
  context: ServiceContext
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  /** Production callers provide only the server-owned selection reader. */
  selectionReader?: MotionStudioVisualCalibrationSelectionReaderPort
  /** Controlled test-only ports. Rejected outside NODE_ENV=test. */
  testDependencies?: CanonicalProviderCalibrationSourceTestDependencies
  sourceProjection: ProjectCanonicalVisualCalibrationConsumerReceiptInput
}): Promise<ProjectCanonicalProviderCalibrationCandidateSourceResult> {
  assertCanonicalApprovedStorytellingStylePlanSource(input.approvedPlanSource)
  const sourceStore = resolveVisualCalibrationSourceStore(input)
  const approvedPlanSource = await
    reopenCanonicalApprovedStorytellingStylePlanSource({
      context: input.context,
      claimedSource: input.approvedPlanSource,
      ...(input.testDependencies?.approvedPlanSourceReader
        ? { sourceReader: input.testDependencies.approvedPlanSourceReader }
        : {}),
    })
  const authorization = canonicalProviderWorkAuthorizationV4Schema.parse(
    input.sourceProjection.authorization,
  )
  const sourceRecord = await sourceStore.read({
    approvedPlanSource,
    visualCalibrationContext: authorization.visualCalibrationContext,
  })
  const approvedProductionFrameAuthority = await
    reopenCanonicalStorytellingCalibrationFrameAuthority({
      context: input.context,
      approvedPlanSource,
      ...(input.testDependencies?.frameAuthorityReader
        ? { sourceReader: input.testDependencies.frameAuthorityReader }
        : {}),
    })
  const canonicalReceipt = canonicalProviderAttemptConsumerReceiptSchema.parse(
    await projectCanonicalVisualCalibrationConsumerReceipt(
      input.sourceProjection,
    ),
  )
  assertCanonicalReceiptHash(canonicalReceipt)
  assertCanonicalAndMotionSourceMatch({
    authenticatedUserId: getRequiredAuthUserId(input.context),
    approvedPlanSource,
    canonicalReceipt,
    sourceRecord,
    approvedProductionFrameAuthority,
    authorization,
  })
  const plan = approvedPlanSource.approvedCalibrationPlan
  const scenario = sourceRecord.scenario
  const output = canonicalReceipt.privateOutput
  const receiptBase = {
    schemaVersion:
      MOTION_STUDIO_CANONICAL_PROVIDER_CALIBRATION_SOURCE_RECEIPT_VERSION,
    sourceAuthority:
      'canonical_provider_attempt_plus_motion_source_readback' as const,
    identity: {
      ownerUserId: canonicalReceipt.identity.ownerUserId,
      workspaceId: plan.workspaceId,
      projectId: plan.projectId,
      editSessionId: plan.editSessionId,
      productionId: plan.productionId,
      approvedSnapshotId: approvedPlanSource.approvedSnapshotId,
      approvedSnapshotDigest: approvedPlanSource.approvedSnapshotDigest,
      approvedCalibrationPlanId: plan.id,
      approvedCalibrationPlanDigest: plan.planDigest,
      scenarioId: scenario.id,
      scenarioKind: scenario.kind as Exclude<
        typeof scenario.kind,
        'exact_text_data'
      >,
      sourceRequestId: canonicalReceipt.identity.sourceRequestId,
      dispatchAttemptId: canonicalReceipt.dispatch.dispatchAttemptId,
      queueClaimId: canonicalReceipt.queue.claimId,
    },
    planningSource: {
      sourcePlanReviewInputDigest:
        approvedPlanSource.sourcePlanReviewInputDigest,
      canonicalStyleComponentDigest:
        approvedPlanSource.canonicalProjectionDigest,
      visualCalibrationContextDigest:
        sourceRecord.visualCalibrationContextDigest,
      motionSourceRecordDigest: sourceRecord.recordDigest,
      approvedProductionFrameAuthority,
      sourceReadbackEvidenceClass: sourceRecord.evidenceClass,
      sourceSelectionDigest: sourceRecord.sourceSelectionDigest,
      referenceContractVersionId:
        sourceRecord.referenceContractVersion.versionId,
      referenceContractDigest:
        sourceRecord.referenceContractVersion.contentDigest,
      referenceContractArtifactPayloadDigest:
        sourceRecord.referenceContractArtifactPayloadDigest,
      firstFrameAssetId: sourceRecord.firstFrame.assetId,
      firstFrameAssetVersionId: sourceRecord.firstFrame.assetVersionId,
      firstFramePrivateObjectIdentityHash:
        sourceRecord.firstFrame.privateObjectIdentityHash,
      firstFrameSha256: sourceRecord.firstFrame.sha256,
      firstFrameAuthorityDigest:
        sourceRecord.firstFrame.frameAuthorityDigest,
      lastFrameAssetId: sourceRecord.lastFrame.assetId,
      lastFrameAssetVersionId: sourceRecord.lastFrame.assetVersionId,
      lastFramePrivateObjectIdentityHash:
        sourceRecord.lastFrame.privateObjectIdentityHash,
      lastFrameSha256: sourceRecord.lastFrame.sha256,
      lastFrameAuthorityDigest: sourceRecord.lastFrame.frameAuthorityDigest,
      continuityContractId:
        sourceRecord.continuityMotionDnaVersion.artifactId,
      continuityMotionDnaVersionId:
        sourceRecord.continuityMotionDnaVersion.versionId,
      continuityMotionDnaContentDigest:
        sourceRecord.continuityMotionDnaVersion.contentDigest,
      continuityMotionDnaArtifactPayloadDigest:
        sourceRecord.continuityMotionDnaArtifactPayloadDigest,
      continuityContractDigest: sourceRecord.continuityGrammar.grammarDigest,
      sourceRepositoryReverified: true as const,
      privateFrameBytesReverified: true as const,
    },
    canonicalAttempt: {
      receiptId: canonicalReceipt.receiptId,
      receiptHash: canonicalReceipt.receiptHash,
      evidenceClass: canonicalReceipt.evidenceClass,
      promotionClass: canonicalReceipt.promotionClass,
      operationId: CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID,
      providerRouteId: CANONICAL_GOOGLE_VISUAL_CALIBRATION_ROUTE_ID,
      providerModelId: 'gemini-omni-flash-preview' as const,
      terminalState: canonicalReceipt.dispatch.terminalState,
      retryCount: canonicalReceipt.dispatch.retryCount,
      fallbackCount: canonicalReceipt.dispatch.fallbackCount,
      privateOutput: output ? {
        outputId: output.outputId,
        assetId: output.assetId,
        assetVersionId: output.assetVersionId,
        privateObjectIdentityHash: output.privateObjectIdentityHash,
        contentSha256: output.contentSha256,
        byteLength: output.byteLength,
        mimeType: 'video/mp4' as const,
        artifactEvidenceDigest: output.artifactEvidenceDigest,
        storageEvidenceHash: output.storageEvidenceHash,
        sourceReadbackEvidenceHash: output.sourceReadbackEvidenceHash,
        providerGenerated: output.providerGenerated,
        createOnly: true as const,
        checksumReadbackVerified: true as const,
        providerUrlPersisted: false as const,
        localPathProjected: false as const,
      } : null,
      providerAttemptCostEvidenceHash:
        canonicalReceipt.internalCost.providerAttemptEvidenceHash,
      workerResourceEvidenceHash:
        canonicalReceipt.internalCost.workerResourceEvidenceHash,
      providerCostMicros: canonicalReceipt.internalCost.providerCostMicros,
      infrastructureCostMicros:
        canonicalReceipt.internalCost.selectedInfrastructureCostMicros,
      totalInternalProductionCostMicros:
        canonicalReceipt.internalCost.selectedTotalInternalCostMicros,
      startedAt: canonicalReceipt.timing.startedAt,
      completedAt: canonicalReceipt.timing.completedAt,
    },
    verification: {
      canonicalPackageQueueDispatchOutputAndCostStoresReverified: true as const,
      canonicalReceiptHashReverified: true as const,
      canonicalReceiptDidNotClaimMotionSourceVerification: true as const,
      approvedStylePlanAndScenarioReverified: true as const,
      artifactPayloadsReopenedFromRepository: true as const,
      referenceContractReverified: true as const,
      frameVersionAndObjectIdentityReverified: true as const,
      firstAndLastFrameBytesReverified: true as const,
      approvedProductionFrameAndTimingReverified: true as const,
      continuityGrammarReverified: true as const,
      providerAndInfrastructureCostSeparated: true as const,
    },
    readiness: {
      motionSourceVerified: true as const,
      privateProviderOutputPresent: output !== null,
      objectiveMediaQaRequired: true as const,
      candidateOutputProjectionAllowed: false as const,
      creativeReviewAllowed: false as const,
      routingEligible: false as const,
      fiveScenarioFinalizationAllowed: false as const,
      providerTransportActivated: false as const,
      customerCommercialAuthorityGranted: false as const,
      promotionAuthorized: false as const,
      productionReady: false as const,
    },
    sideEffects: {
      canonicalSourceProjectionCount: 1 as const,
      externalRequestCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      providerSubmissionCount: 0 as const,
      privateArtifactWriteCount: 0 as const,
      technicalQaMutationCount: 0 as const,
      creativeReviewMutationCount: 0 as const,
      selectionCount: 0 as const,
      timelineMutationCount: 0 as const,
      renderCount: 0 as const,
      exportCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    immutable: true as const,
  }
  const receipt = deepFreeze(
    canonicalProviderCalibrationCandidateSourceReceiptSchema.parse({
      ...receiptBase,
      receiptDigest: sha256CanonicalJson(receiptBase),
    }),
  )
  return deepFreeze({ receipt })
}

export function verifyCanonicalProviderCalibrationCandidateSourceReceipt(
  value: unknown,
): value is CanonicalProviderCalibrationCandidateSourceReceipt {
  return canonicalProviderCalibrationCandidateSourceReceiptSchema.safeParse(
    value,
  ).success
}

function assertCanonicalAndMotionSourceMatch(input: {
  authenticatedUserId: string
  approvedPlanSource: CanonicalApprovedStorytellingStylePlanSource
  canonicalReceipt: CanonicalProviderAttemptConsumerReceipt
  sourceRecord: Awaited<
    ReturnType<MotionStudioVisualCalibrationSourceStore['read']>
  >
  approvedProductionFrameAuthority:
    CanonicalStorytellingCalibrationFrameAuthority
  authorization: z.infer<typeof canonicalProviderWorkAuthorizationV4Schema>
}): void {
  const {
    canonicalReceipt,
    sourceRecord,
    approvedProductionFrameAuthority,
    authorization,
  } = input
  const plan = input.approvedPlanSource.approvedCalibrationPlan
  if (
    canonicalReceipt.boundaries.sourceVerified ||
    canonicalReceipt.identity.ownerUserId !== input.authenticatedUserId ||
    canonicalReceipt.consumerContext.productionBindingIncluded ||
    !canonicalReceipt.consumerContext.consumerOwnedProductionBindingRequired ||
    canonicalReceipt.identity.workspaceId !== plan.workspaceId ||
    canonicalReceipt.identity.projectId !== plan.projectId ||
    canonicalReceipt.identity.editSessionId !== plan.editSessionId ||
    canonicalReceipt.identity.approvedPlanSnapshotId !==
      input.approvedPlanSource.approvedSnapshotId ||
    canonicalReceipt.identity.approvedPlanSnapshotHash !==
      input.approvedPlanSource.approvedSnapshotDigest ||
    canonicalReceipt.provider.operationId !==
      CANONICAL_GOOGLE_VISUAL_CALIBRATION_OPERATION_ID ||
    canonicalReceipt.provider.providerRouteId !==
      CANONICAL_GOOGLE_VISUAL_CALIBRATION_ROUTE_ID ||
    canonicalReceipt.provider.providerModelId !== 'gemini-omni-flash-preview' ||
    canonicalReceipt.dispatch.retryCount !== 0 ||
    canonicalReceipt.dispatch.fallbackCount !== 0 ||
    canonicalReceipt.privateOutputs.length > 1 ||
    canonicalReceipt.boundaries.providerTransportActivated ||
    canonicalReceipt.boundaries.commercialAuthorityIncluded ||
    canonicalReceipt.boundaries.promotionAuthorized ||
    canonicalReceipt.boundaries.productionReady ||
    (sourceRecord.evidenceClass === 'controlled_repository_fixture' &&
      canonicalReceipt.evidenceClass !== 'private_injected_nonprovider_test') ||
    (sourceRecord.evidenceClass === 'controlled_repository_fixture'
      ? approvedProductionFrameAuthority.evidenceClass !==
        'controlled_test_fixture'
      : approvedProductionFrameAuthority.evidenceClass !==
        'canonical_backend_runtime_unreleased') ||
    sourceRecord.visualCalibrationContext
      .storytellingProductionAuthorityRefDigest !==
      approvedProductionFrameAuthority
        .storytellingProductionAuthorityRefDigest ||
    authorization.visualCalibrationContextDigest !==
      sourceRecord.visualCalibrationContextDigest ||
    sha256CanonicalJson(authorization.visualCalibrationContext) !==
      sha256CanonicalJson(sourceRecord.visualCalibrationContext)
  ) {
    throw blocked(
      'Canonical visual-calibration attempt does not match the exact Motion source authority.',
    )
  }
}

function assertCanonicalReceiptHash(
  receipt: CanonicalProviderAttemptConsumerReceipt,
): void {
  const unsigned = { ...receipt } as Record<string, unknown>
  delete unsigned.receiptHash
  if (sha256AuthorityValue(unsigned) !== receipt.receiptHash) {
    throw blocked(
      'Canonical visual-calibration provider receipt failed immutable hash verification.',
    )
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

function blocked(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_visual_calibration_source_verification',
    productionReady: false,
  })
}
