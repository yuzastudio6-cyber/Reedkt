import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalSam31CompleteSourceChunkPlanRef,
  canonicalSam31CompleteSourceChunkReceiptRef,
  parseCanonicalSam31CompleteSourceChunkPlan,
  parseCanonicalSam31CompleteSourceChunkReceipt,
  type CanonicalSam31CompleteSourceChunkRepository,
} from './canonical-sam3_1-complete-source-chunk-coordinator'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31VertexServingAttemptCreditSettlementRecord,
} from './canonical-sam3_1-vertex-serving-attempt-credit-settlement-service'
import type {
  CanonicalSam31VertexServingReconciledWindowCostRepository,
} from './canonical-sam3_1-vertex-serving-reconciled-window-cost-repository'
import {
  canonicalSam31VertexServingReconciledWindowCostReceiptRef,
} from './canonical-sam3_1-vertex-serving-reconciled-window-cost-repository'
import {
  assertCanonicalSam31VertexServingTerminalAttemptRecord,
  type CanonicalSam31VertexServingTerminalAttemptOwner,
} from './canonical-sam3_1-vertex-serving-terminal-attempt-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalSam31CurrentServingResultAdmission,
  type CanonicalSam31GpuRuntimeResultStore,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'

export const CANONICAL_SAM3_1_COMPLETE_SOURCE_SERVING_RELEASE_VERSION =
  'canonical-sam3_1-complete-source-serving-release-v1' as const
export const CANONICAL_SAM3_1_COMPLETE_SOURCE_SERVING_RELEASE_OWNER_VERSION =
  'canonical-sam3_1-complete-source-serving-release-owner-v1' as const
export const CANONICAL_SAM3_1_COMPLETE_SOURCE_SERVING_RELEASE_REPOSITORY_VERSION =
  'canonical-sam3_1-complete-source-serving-release-repository-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/complete-source-serving-releases'
const MAXIMUM_BYTES = 8 * 1024 * 1024
const MAXIMUM_CHUNKS = 256
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const nonnegativeInteger = z.number().int().nonnegative().safe()
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
type EvidenceRef = z.infer<typeof refSchema>

const releaseWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_COMPLETE_SOURCE_SERVING_RELEASE_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_complete_source_serving_release_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_exact_group_reread_and_settlement',
  ),
  status: z.literal(
    'complete_source_serving_settled_scale_zero_ready_for_l4_qa',
  ),
  releaseId: safeId,
  releaseVersion: z.literal(1),
  executionGroupRef: refSchema,
  approvedSnapshotRef: refSchema,
  exactSourceRef: refSchema,
  sourceBindingRef: refSchema,
  masterTimingRef: refSchema,
  compiledSubjectIntentRef: refSchema,
  sourceFrameCount: z.number().int().positive().safe(),
  fpsNumerator: z.number().int().positive().safe(),
  fpsDenominator: z.number().int().positive().safe(),
  exactChunkCount: z.number().int().min(1).max(MAXIMUM_CHUNKS),
  chunkReceiptRefs: z.array(refSchema).min(1).max(MAXIMUM_CHUNKS),
  currentServingResultAdmissionRefs:
    z.array(refSchema).min(1).max(MAXIMUM_CHUNKS),
  terminalServingAttemptRefs:
    z.array(refSchema).min(1).max(MAXIMUM_CHUNKS),
  executionAttemptRefs: z.array(refSchema).min(1).max(MAXIMUM_CHUNKS),
  servingWindowCostReceiptRef: refSchema,
  attemptCreditSettlementRefs:
    z.array(refSchema).min(1).max(MAXIMUM_CHUNKS),
  totalCustomerChargedCredits: nonnegativeInteger,
  totalWeEditProAbsorbedInfrastructureCostUsdNanos: nonnegativeInteger,
  everyPlannedChunkReceiptResultAndTerminalAttemptReread: z.literal(true),
  exactSequentialChunkAndCompleteSourceFrameCoverageVerified: z.literal(true),
  exactDetailedBillingExportAndAccountEffectiveRateReconciled:
    z.literal(true),
  everyExecutionAttemptAllocatedAndCreditSettledExactlyOnce: z.literal(true),
  failedOrCanceledAttemptCostChargedToCustomer: z.literal(false),
  unapprovedOverageAbsorbedByWeEditPro: z.literal(true),
  endpointScaleToZeroObservedAfterServingWindow: z.literal(true),
  perChunkPendingCostAndScaleZeroClaimsResolvedOnlyByGroupRelease:
    z.literal(true),
  downstreamL4MaskQaRequiredForEveryAdmittedSceneRange: z.literal(true),
  independentPrivateReviewRequiredBeforeSpecialistEvidence: z.literal(true),
  serviceFeeAndFinalUnusedReservationSettlementRemainSeparate:
    z.literal(true),
  callerResultCostPriceScaleZeroOrSettlementClaimAccepted: z.literal(false),
  cpuOnlySubstantiveExecutionAllowed: z.literal(false),
  browserLocalStateUsed: z.literal(false),
  assetManifestMutated: z.literal(false),
  qaApproved: z.literal(false),
  renderAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  releasedAt: timestamp,
}).strict().superRefine((release, context) => {
  const arrays = [
    release.chunkReceiptRefs,
    release.currentServingResultAdmissionRefs,
    release.terminalServingAttemptRefs,
    release.executionAttemptRefs,
    release.attemptCreditSettlementRefs,
  ]
  if (arrays.some((values) => values.length !== release.exactChunkCount
      || new Set(values.map((value) => stableAuthorityStringify(value))).size
        !== values.length)) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 complete-source release coverage is inconsistent.',
  })
})
export const canonicalSam31CompleteSourceServingReleaseSchema =
  releaseWithoutHashSchema.extend({ releaseHash: sha256 }).strict()
export type CanonicalSam31CompleteSourceServingRelease = z.infer<
  typeof canonicalSam31CompleteSourceServingReleaseSchema
>

export interface CanonicalSam31ServingAttemptCreditSettlementReadPort {
  rereadAttemptCreditSettlement(input: {
    readonly ownerUserId: string
    readonly workspaceId: string
    readonly executionAttemptRef: EvidenceRef
  }): Promise<unknown | null>
}

export interface CanonicalSam31CompleteSourceServingReleaseRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_COMPLETE_SOURCE_SERVING_RELEASE_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly release: CanonicalSam31CompleteSourceServingRelease
  }): Promise<'created' | 'identical_replay'>
  rereadByExecutionGroup(input: {
    readonly executionGroupRef: EvidenceRef
  }): Promise<CanonicalSam31CompleteSourceServingRelease | null>
}

export interface CanonicalSam31CompleteSourceServingReleaseOwner {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_COMPLETE_SOURCE_SERVING_RELEASE_OWNER_VERSION
  readonly callerMayResolvePerChunkSettlementOrScaleZero: false
  readonly downstreamL4QaStillRequired: true
  readonly directGpuOrProviderExecutionAllowed: false
  release(input: {
    readonly releaseId: string
    readonly authenticatedOwnerUserId: string
    readonly workspaceId: string
    readonly executionGroupRef: EvidenceRef
    readonly servingWindowCostReceiptRef: EvidenceRef
    readonly releasedAt: string
  }): Promise<CanonicalSam31CompleteSourceServingRelease>
}

export function parseCanonicalSam31CompleteSourceServingRelease(
  value: unknown,
): CanonicalSam31CompleteSourceServingRelease {
  assertPlainSerializedData(value, 'sam31_complete_source_serving_release')
  const release = canonicalSam31CompleteSourceServingReleaseSchema.parse(value)
  const { releaseHash, ...payload } = release
  if (releaseHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('SAM 3.1 complete-source release digest changed.')
  }
  return Object.freeze(structuredClone(release))
}

export function canonicalSam31CompleteSourceServingReleaseRef(
  value: unknown,
): EvidenceRef {
  const release = parseCanonicalSam31CompleteSourceServingRelease(value)
  return Object.freeze({
    id: release.releaseId,
    version: release.releaseVersion,
    contentHash: `sha256:${release.releaseHash}`,
  })
}

export function createCanonicalSam31CompleteSourceServingReleaseRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31CompleteSourceServingReleaseRepository {
  if (!input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function') {
    throw new TypeError('SAM 3.1 complete-source release store is unavailable.')
  }
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository: CanonicalSam31CompleteSourceServingReleaseRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_COMPLETE_SOURCE_SERVING_RELEASE_REPOSITORY_VERSION,
    async persistCreateOnly({ release }) {
      const parsed = parseCanonicalSam31CompleteSourceServingRelease(release)
      const body = Buffer.from(stableAuthorityStringify(parsed), 'utf8')
      if (body.byteLength > MAXIMUM_BYTES) {
        throw new TypeError('SAM 3.1 complete-source release is too large.')
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: releasePath(prefix, parsed.executionGroupRef.id),
        body,
        contentSha256: bytesSha256(body),
      })
      return disposition === 'created' ? 'created' : 'identical_replay'
    },
    async rereadByExecutionGroup({ executionGroupRef }) {
      const expected = refSchema.parse(executionGroupRef)
      const body = await input.objectPort.readExact(
        releasePath(prefix, expected.id),
      )
      if (!body) return null
      if (body.byteLength < 2 || body.byteLength > MAXIMUM_BYTES) {
        throw new TypeError('SAM 3.1 complete-source release bytes are invalid.')
      }
      let value: unknown
      try {
        value = JSON.parse(body.toString('utf8')) as unknown
      } catch {
        throw new TypeError('SAM 3.1 complete-source release JSON is invalid.')
      }
      const release = parseCanonicalSam31CompleteSourceServingRelease(value)
      if (!sameRef(release.executionGroupRef, expected)) {
        throw new TypeError('SAM 3.1 complete-source release group changed.')
      }
      return release
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalSam31CompleteSourceServingReleaseOwner(input: {
  readonly chunkRepository: CanonicalSam31CompleteSourceChunkRepository
  readonly resultStore: Pick<
    CanonicalSam31GpuRuntimeResultStore, 'rereadResultAdmission'
  >
  readonly terminalAttemptOwner: Pick<
    CanonicalSam31VertexServingTerminalAttemptOwner,
    'rereadTerminalAttempt'
  >
  readonly costRepository: Pick<
    CanonicalSam31VertexServingReconciledWindowCostRepository, 'rereadExact'
  >
  readonly settlementReadPort:
    CanonicalSam31ServingAttemptCreditSettlementReadPort
  readonly releaseRepository:
    CanonicalSam31CompleteSourceServingReleaseRepository
}): CanonicalSam31CompleteSourceServingReleaseOwner {
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_COMPLETE_SOURCE_SERVING_RELEASE_OWNER_VERSION,
    callerMayResolvePerChunkSettlementOrScaleZero: false as const,
    downstreamL4QaStillRequired: true as const,
    directGpuOrProviderExecutionAllowed: false as const,
    async release(untrusted: Parameters<
      CanonicalSam31CompleteSourceServingReleaseOwner['release']
    >[0]) {
      assertPlainSerializedData(untrusted,
        'sam31_complete_source_serving_release_request')
      const request = z.object({
        releaseId: safeId,
        authenticatedOwnerUserId: safeId,
        workspaceId: safeId,
        executionGroupRef: refSchema,
        servingWindowCostReceiptRef: refSchema,
        releasedAt: timestamp,
      }).strict().parse(untrusted)
      const plan = parseCanonicalSam31CompleteSourceChunkPlan(
        await input.chunkRepository.rereadPlan({
          executionGroupRef: request.executionGroupRef,
        }),
      )
      if (plan.ownerUserId !== request.authenticatedOwnerUserId
        || plan.workspaceId !== request.workspaceId) {
        throw new TypeError('SAM 3.1 complete-source release scope changed.')
      }
      const cost = await input.costRepository.rereadExact({
        receiptRef: request.servingWindowCostReceiptRef,
      })
      if (!cost || !sameRef(
        canonicalSam31VertexServingReconciledWindowCostReceiptRef(cost),
        request.servingWindowCostReceiptRef,
      ) || !cost.usage.scaleToZeroObservedAfterWindow
        || !cost.exactDetailedUsageCostExportReconciled
        || !cost.accountEffectiveRateAuthorityBound) {
        throw new TypeError(
          'SAM 3.1 complete-source cost and scale-zero evidence is unavailable.',
        )
      }
      const receipts = []
      const results = []
      const terminals = []
      const settlements = []
      for (const chunk of plan.chunks) {
        const receipt = parseCanonicalSam31CompleteSourceChunkReceipt(
          await input.chunkRepository.rereadChunkReceipt({
            executionGroupId: plan.executionGroupId,
            chunkOrdinal: chunk.chunkOrdinal,
          }),
        )
        const result = assertCanonicalSam31CurrentServingResultAdmission(
          await input.resultStore.rereadResultAdmission(
            receipt.endpointInvocationResultRef.id,
          ),
        )
        const rawTerminal =
          await input.terminalAttemptOwner.rereadTerminalAttempt({
            executionAttemptRef: receipt.executionAttemptRef,
          })
        if (!rawTerminal) throw new TypeError(
          'SAM 3.1 terminal serving attempt is unavailable.',
        )
        const terminal =
          assertCanonicalSam31VertexServingTerminalAttemptRecord(rawTerminal)
        const rawSettlement =
          await input.settlementReadPort.rereadAttemptCreditSettlement({
            ownerUserId: plan.ownerUserId,
            workspaceId: plan.workspaceId,
            executionAttemptRef: receipt.executionAttemptRef,
          })
        if (!rawSettlement) throw new TypeError(
          'SAM 3.1 attempt credit settlement is unavailable.',
        )
        const settlement =
          assertCanonicalSam31VertexServingAttemptCreditSettlementRecord(
            rawSettlement,
          )
        assertChunkLineage({ plan, chunk, receipt, result, terminal })
        assertSettlementLineage({ cost, receipt, terminal, settlement })
        receipts.push(receipt)
        results.push(result)
        terminals.push(terminal)
        settlements.push(settlement)
      }
      const costAttemptRefs = cost.usage.attempts.map((attempt) =>
        attempt.executionAttemptRef)
      if (stableAuthorityStringify(costAttemptRefs)
        !== stableAuthorityStringify(receipts.map((receipt) =>
          receipt.executionAttemptRef))) {
        throw new TypeError(
          'SAM 3.1 serving window does not cover the exact chunk attempt set.',
        )
      }
      const latestEvidenceTime = Math.max(
        Date.parse(cost.recordedAt),
        ...settlements.map((settlement) => Date.parse(settlement.createdAt)),
        ...results.map((result) => Date.parse(result.admittedAt)),
      )
      if (Date.parse(request.releasedAt) < latestEvidenceTime) {
        throw new TypeError('SAM 3.1 complete-source release time is stale.')
      }
      const payload = releaseWithoutHashSchema.parse({
        schemaVersion: CANONICAL_SAM3_1_COMPLETE_SOURCE_SERVING_RELEASE_VERSION,
        source:
          'canonical_server_sam3_1_complete_source_serving_release_owner',
        evidenceClass:
          'canonical_private_exact_group_reread_and_settlement',
        status:
          'complete_source_serving_settled_scale_zero_ready_for_l4_qa',
        releaseId: request.releaseId,
        releaseVersion: 1,
        executionGroupRef: canonicalSam31CompleteSourceChunkPlanRef(plan),
        approvedSnapshotRef: plan.approvedSnapshotRef,
        exactSourceRef: plan.exactSourceRef,
        sourceBindingRef: plan.sourceBindingRef,
        masterTimingRef: plan.masterTimingRef,
        compiledSubjectIntentRef: plan.compiledSubjectIntentRef,
        sourceFrameCount: plan.sourceFrameCount,
        fpsNumerator: plan.fpsNumerator,
        fpsDenominator: plan.fpsDenominator,
        exactChunkCount: plan.exactChunkCount,
        chunkReceiptRefs: receipts.map(
          canonicalSam31CompleteSourceChunkReceiptRef,
        ),
        currentServingResultAdmissionRefs: results.map(resultRef),
        terminalServingAttemptRefs: terminals.map(terminalRef),
        executionAttemptRefs: receipts.map((receipt) =>
          receipt.executionAttemptRef),
        servingWindowCostReceiptRef: request.servingWindowCostReceiptRef,
        attemptCreditSettlementRefs: settlements.map(settlementRef),
        totalCustomerChargedCredits: settlements.reduce((sum, settlement) =>
          sum + settlement.customerChargedCredits, 0),
        totalWeEditProAbsorbedInfrastructureCostUsdNanos:
          settlements.reduce((sum, settlement) => sum
            + settlement.weeditproAbsorbedInfrastructureCostUsdNanos, 0),
        everyPlannedChunkReceiptResultAndTerminalAttemptReread: true,
        exactSequentialChunkAndCompleteSourceFrameCoverageVerified: true,
        exactDetailedBillingExportAndAccountEffectiveRateReconciled: true,
        everyExecutionAttemptAllocatedAndCreditSettledExactlyOnce: true,
        failedOrCanceledAttemptCostChargedToCustomer: false,
        unapprovedOverageAbsorbedByWeEditPro: true,
        endpointScaleToZeroObservedAfterServingWindow: true,
        perChunkPendingCostAndScaleZeroClaimsResolvedOnlyByGroupRelease: true,
        downstreamL4MaskQaRequiredForEveryAdmittedSceneRange: true,
        independentPrivateReviewRequiredBeforeSpecialistEvidence: true,
        serviceFeeAndFinalUnusedReservationSettlementRemainSeparate: true,
        callerResultCostPriceScaleZeroOrSettlementClaimAccepted: false,
        cpuOnlySubstantiveExecutionAllowed: false,
        browserLocalStateUsed: false,
        assetManifestMutated: false,
        qaApproved: false,
        renderAuthorized: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        releasedAt: request.releasedAt,
      })
      const release = parseCanonicalSam31CompleteSourceServingRelease({
        ...payload,
        releaseHash: sha256AuthorityValue(payload),
      })
      const disposition = await input.releaseRepository.persistCreateOnly({
        release,
      })
      if (disposition !== 'created' && disposition !== 'identical_replay') {
        throw new TypeError('SAM 3.1 complete-source release was not stored.')
      }
      const reread = await input.releaseRepository.rereadByExecutionGroup({
        executionGroupRef: release.executionGroupRef,
      })
      if (!reread || reread.releaseHash !== release.releaseHash) {
        throw new TypeError('SAM 3.1 complete-source release reread changed.')
      }
      return reread
    },
  })
}

function assertChunkLineage(input: {
  plan: ReturnType<typeof parseCanonicalSam31CompleteSourceChunkPlan>
  chunk: ReturnType<
    typeof parseCanonicalSam31CompleteSourceChunkPlan
  >['chunks'][number]
  receipt: ReturnType<typeof parseCanonicalSam31CompleteSourceChunkReceipt>
  result: ReturnType<typeof assertCanonicalSam31CurrentServingResultAdmission>
  terminal: ReturnType<
    typeof assertCanonicalSam31VertexServingTerminalAttemptRecord
  >
}): void {
  const { plan, chunk, receipt, result, terminal } = input
  if (!sameRef(receipt.executionGroupRef,
    canonicalSam31CompleteSourceChunkPlanRef(plan))
    || receipt.chunkOrdinal !== chunk.chunkOrdinal
    || receipt.canonicalStartFrameInclusive !==
      chunk.canonicalStartFrameInclusive
    || receipt.canonicalEndFrameInclusive !== chunk.canonicalEndFrameInclusive
    || !sameRef(result.completeSourceChunkPlanRef, receipt.executionGroupRef)
    || !sameRef(result.completeSourceChunkReceiptRef,
      canonicalSam31CompleteSourceChunkReceiptRef(receipt))
    || !sameRef(result.executionAttemptRef, receipt.executionAttemptRef)
    || !sameRef(result.endpointInvocationResultRef,
      receipt.endpointInvocationResultRef)
    || result.chunkOrdinal !== chunk.chunkOrdinal
    || !result.servingWindowUsageCostAndCreditSettlementPending
    || result.terminalScaleToZeroClaimedByPerChunkResult
    || !sameRef(terminal.executionAttemptRef, receipt.executionAttemptRef)
    || terminal.invocationId !== receipt.endpointInvocationResultRef.id
    || terminal.attempt.terminalOutcome !== 'completed'
    || terminal.attempt.providerInferenceOrSubstantiveWorkOutcome !== 'executed'
    || !terminal.servingWindowCostReceiptPending) {
    throw new TypeError('SAM 3.1 complete-source chunk lineage changed.')
  }
}

function assertSettlementLineage(input: {
  cost: NonNullable<Awaited<ReturnType<
    CanonicalSam31VertexServingReconciledWindowCostRepository['rereadExact']
  >>>
  receipt: ReturnType<typeof parseCanonicalSam31CompleteSourceChunkReceipt>
  terminal: ReturnType<
    typeof assertCanonicalSam31VertexServingTerminalAttemptRecord
  >
  settlement: ReturnType<
    typeof assertCanonicalSam31VertexServingAttemptCreditSettlementRecord
  >
}): void {
  const { cost, receipt, terminal, settlement } = input
  const attemptIndex = cost.usage.attempts.findIndex((attempt) =>
    sameRef(attempt.executionAttemptRef, receipt.executionAttemptRef))
  const attempt = cost.usage.attempts[attemptIndex]
  const allocation = cost.attemptAllocations[attemptIndex]
  if (!attempt || !allocation
    || !sameRef(allocation.executionAttemptRef, receipt.executionAttemptRef)) {
    throw new TypeError(
      'SAM 3.1 complete-source attempt allocation is unavailable.',
    )
  }
  const attemptCostReceiptHash = sha256AuthorityValue({
    servingWindowCostReceiptId: cost.receiptId,
    servingWindowCostReceiptHash: cost.receiptHash,
    executionAttemptRef: attempt.executionAttemptRef,
    allocation,
  })
  const attemptCostReceiptId =
    `sam31-serving-attempt-cost:${attemptCostReceiptHash}`
  if (settlement.servingWindowCostReceiptId !== cost.receiptId
    || settlement.servingWindowCostReceiptHash !== cost.receiptHash
    || settlement.servingWindowUsageHash !== cost.usage.usageHash
    || settlement.detailedBillingExportObservationId !==
      cost.detailedBillingExportObservationRef.id
    || settlement.detailedBillingExportObservationHash !==
      cost.detailedBillingExportObservationRef.contentHash.slice(7)
    || settlement.attemptCostReceiptId !== attemptCostReceiptId
    || settlement.attemptCostReceiptHash !== attemptCostReceiptHash
    || settlement.allocationWindowId !== cost.usage.allocationWindowId
    || settlement.endpointDeploymentId !== cost.endpointDeploymentRef.id
    || settlement.endpointDeploymentHash !==
      cost.endpointDeploymentRef.contentHash.slice(7)
    || settlement.executionAttemptId !== receipt.executionAttemptRef.id
    || settlement.snapshotId !== attempt.approvedSnapshotRef.id
    || settlement.approvalId !== attempt.userApprovalRecordRef.id
    || settlement.reservationId !== attempt.fundedReservationRef.id
    || settlement.approvedWorkItemId !== attempt.approvedWorkItemRef.id
    || settlement.terminalOutcome !== attempt.terminalOutcome
    || settlement.terminalOutcome !== 'completed'
    || settlement.approvedToolCeilingCredits !==
      allocation.approvedReservedToolCostCredits
    || settlement.customerChargedCredits !==
      allocation.customerEligibleToolCostCredits
    || settlement.weeditproAbsorbedInfrastructureCostUsdNanos !==
      allocation.weeditproAbsorbedInfrastructureCostUsdNanos
    || settlement.unusedToolCeilingCreditsRetainedInSharedPlanReservation !==
      allocation.creditsRecommendedToRetainForRemainingApprovedPlanWork
    || settlement.creditsHeldPendingReconciliation !== 0
    || !settlement.exactDetailedUsageCostExportReconciled
    || settlement.finalInvoiceMonthTaxOrAdjustmentClaimed
    || settlement.publicBillingAuthorityGranted
    || settlement.productionAuthorityGranted
    || terminal.attempt.approvedSnapshotRef.id !== settlement.snapshotId
    || terminal.attempt.approvedWorkItemRef.id !==
      settlement.approvedWorkItemId
    || terminal.attempt.userApprovalRecordRef.id !== settlement.approvalId
    || terminal.attempt.fundedReservationRef.id !== settlement.reservationId
    || Date.parse(settlement.createdAt) < Date.parse(cost.recordedAt)
    || Date.parse(settlement.createdAt) < Date.parse(terminal.recordedAt)) {
    throw new TypeError('SAM 3.1 complete-source settlement lineage changed.')
  }
}

function resultRef(
  result: ReturnType<typeof assertCanonicalSam31CurrentServingResultAdmission>,
): EvidenceRef {
  return Object.freeze({
    id: result.resultAdmissionId,
    version: 2,
    contentHash: `sha256:${result.resultAdmissionHash}`,
  })
}

function terminalRef(
  terminal: ReturnType<
    typeof assertCanonicalSam31VertexServingTerminalAttemptRecord
  >,
): EvidenceRef {
  return Object.freeze({
    id: `sam31-serving-terminal:${terminal.recordHash}`,
    version: 1,
    contentHash: `sha256:${terminal.recordHash}`,
  })
}

function settlementRef(
  settlement: ReturnType<
    typeof assertCanonicalSam31VertexServingAttemptCreditSettlementRecord
  >,
): EvidenceRef {
  return Object.freeze({
    id: settlement.id,
    version: 2,
    contentHash: `sha256:${settlement.settlementHash}`,
  })
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function releasePath(prefix: string, executionGroupId: string): string {
  return `${prefix}/${encodeURIComponent(executionGroupId)}.json`
}

function bytesSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
