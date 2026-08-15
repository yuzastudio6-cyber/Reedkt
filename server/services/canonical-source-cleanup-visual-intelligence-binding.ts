import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  mapCanonicalSourceFrameRangeToMasterTiming,
} from './canonical-rational-source-frame-mapping'
import {
  canonicalSourceLedVisualIntelligenceEvidenceSchema,
  verifyCanonicalSourceLedContentAnalysisEvidence,
  type CanonicalSourceLedContentAnalysisEvidence,
} from './canonical-source-led-content-analysis-evidence'

export const CANONICAL_SOURCE_CLEANUP_VISUAL_INTELLIGENCE_BINDING_VERSION =
  'canonical-source-cleanup-visual-intelligence-binding-v2' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive(),
  contentHash: prefixedSha256,
}).strict()

const decisionSchema = z.object({
  decisionId: safeId,
  action: z.enum(['keep', 'remove']),
  sourceStartFrame: z.number().int().nonnegative(),
  sourceEndFrameExclusive: z.number().int().positive(),
  masterDurationFrames: z.number().int().positive(),
  timelineStartFrame: z.number().int().nonnegative().nullable(),
  timelineEndFrameExclusive: z.number().int().positive().nullable(),
  reason: z.string().trim().min(1).max(1_000),
  confidenceBasisPoints: z.number().int().min(6_000).max(10_000),
  phraseBoundaryAligned: z.literal(true),
  preservesSourceMeaning: z.literal(true),
  evidenceIds: z.array(safeId).min(1).max(128),
  reasonCodes: z.array(safeId).min(1).max(32),
  decisionBasis: z.enum([
    'content_understanding',
    'resolved_embedded_instruction',
  ]),
  instructionIds: z.array(safeId).max(32),
  timeOnlyDecision: z.literal(false),
}).strict().superRefine((value, context) => {
  const kept = value.action === 'keep'
  if (
    value.sourceEndFrameExclusive <= value.sourceStartFrame
    || new Set(value.evidenceIds).size !== value.evidenceIds.length
    || new Set(value.reasonCodes).size !== value.reasonCodes.length
    || new Set(value.instructionIds).size !== value.instructionIds.length
    || (kept
      ? value.timelineStartFrame === null
        || value.timelineEndFrameExclusive === null
        || value.timelineEndFrameExclusive - value.timelineStartFrame !==
          value.masterDurationFrames
      : value.timelineStartFrame !== null
        || value.timelineEndFrameExclusive !== null)
    || (value.decisionBasis === 'content_understanding'
      ? value.instructionIds.length !== 0
      : value.instructionIds.length === 0)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Source-cleanup decisions require exact source, timeline, evidence, and instruction lineage.',
    })
  }
})

const embeddedInstructionSchema = z.object({
  instructionId: safeId,
  instructionType: z.enum([
    'delete_previous_part',
    'delete_current_take',
    'restart_from_here',
    'use_later_take',
    'keep_part',
    'remove_part',
    'custom_edit_direction',
  ]),
  targetRelation: z.enum([
    'previous_context',
    'current_take',
    'following_take',
    'whole_source',
    'custom',
  ]),
  transcriptSegmentId: safeId,
  spokenStartFrame: z.number().int().nonnegative(),
  spokenEndFrameExclusive: z.number().int().positive(),
  targetStartFrame: z.number().int().nonnegative(),
  targetEndFrameExclusive: z.number().int().positive(),
  appliedDecisionIds: z.array(safeId).min(1).max(128),
  spokenRemarkRemovalDecisionId: safeId,
  classifiedAsEditorDirected: z.literal(true),
  interpretationStatus: z.literal('resolved'),
  userReviewRequired: z.literal(false),
}).strict()

const sourceBindingSchema = z.object({
  sourceSequenceItemId: safeId,
  mediaAssetId: safeId,
  uploadedOrder: z.number().int().positive().max(8),
  checksumSha256: rawSha256,
  durationFrames: z.number().int().positive(),
  sourceFrameAuthorityDigestSha256: rawSha256,
  transcriptDigestSha256: rawSha256,
  transcriptCoverageDigestSha256: rawSha256,
  visualRequestRef: evidenceRefSchema,
  visualReportRef: evidenceRefSchema,
  visualCoverageDigestSha256: rawSha256,
  decisionPartition: z.array(decisionSchema).min(1).max(257),
  selectedRangeIds: z.array(safeId).min(1).max(128),
  removedRangeIds: z.array(safeId).max(129),
  embeddedEditInstructions: z.array(embeddedInstructionSchema).max(128),
}).strict()

const bindingWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_CLEANUP_VISUAL_INTELLIGENCE_BINDING_VERSION,
  ),
  source: z.literal(
    'head_intelligence_from_verified_visual_intelligence_and_transcript',
  ),
  scope: z.object({
    workspaceId: safeId,
    projectId: safeId,
    editSessionId: safeId,
    analysisRunId: safeId,
    planningDirectionDigestSha256: rawSha256,
    userInstructionDigestSha256: rawSha256,
    masterFpsNumerator: z.literal(30),
    masterFpsDenominator: z.literal(1),
  }).strict(),
  sourceAnalysisEvidenceRef: evidenceRefSchema,
  sources: z.array(sourceBindingSchema).min(1).max(8),
  totals: z.object({
    originalSourceFrames: z.number().int().positive(),
    selectedSourceFrames: z.number().int().positive(),
    selectedMasterTimelineFrames: z.number().int().positive(),
    selectedRangeCount: z.number().int().positive().max(1_024),
    removedRangeCount: z.number().int().nonnegative().max(1_024),
    embeddedInstructionCount: z.number().int().nonnegative().max(1_024),
  }).strict(),
  coverage: z.object({
    completeAudioTimelineProcessed: z.literal(true),
    completeSourceRangeRequested: z.literal(true),
    completeRequestedRangeSemanticCoverage: z.literal(true),
    orderedGaplessDecisionPartition: z.literal(true),
    everyTimelineIntervalReviewed: z.literal(true),
    everyRawFramePixelInspected: z.literal(false),
    providerVisualPreprocessingExpected: z.literal(true),
    timingOnlyCutDecisionsAccepted: z.literal(false),
    unresolvedEmbeddedInstructionsAccepted: z.literal(false),
    sourceOrderPreserved: z.literal(true),
    meaningPreservationPassed: z.literal(true),
  }).strict(),
  authority: z.object({
    semanticVisualEvidenceOwner: z.literal('visual_intelligence'),
    cutDecisionOwner: z.literal('head_intelligence'),
    masterTimingOwner: z.literal('master_timing'),
    mediaContainedInstructionsTreatedAsUntrustedEvidence: z.literal(true),
    browserSelectedRangesAccepted: z.literal(false),
    callerTimestampsAcceptedAsCutAuthority: z.literal(false),
    rawChatUsedAsWorkerInstruction: z.literal(false),
  }).strict(),
  permissions: z.object({
    planPublished: z.literal(false),
    approvalGranted: z.literal(false),
    timelineMutated: z.literal(false),
    workDispatched: z.literal(false),
    mediaProcessed: z.literal(false),
    customerCreditMutated: z.literal(false),
    publicDeliveryGranted: z.literal(false),
    productionAuthorityGranted: z.literal(false),
  }).strict(),
}).strict()

export const canonicalSourceCleanupVisualIntelligenceBindingSchema =
  bindingWithoutDigestSchema.extend({
    bindingDigestSha256: rawSha256,
  }).strict()

export type CanonicalSourceCleanupVisualIntelligenceBinding = z.infer<
  typeof canonicalSourceCleanupVisualIntelligenceBindingSchema
>

export function createCanonicalSourceCleanupVisualIntelligenceBinding(input: {
  readonly evidence: unknown
  readonly expectedScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly planningDirectionDigestSha256: string
    readonly userInstructionDigestSha256: string
  }
}): CanonicalSourceCleanupVisualIntelligenceBinding {
  const evidence = verifyCanonicalSourceLedContentAnalysisEvidence(
    input.evidence,
  )
  assertFreshEvidence(evidence, input.expectedScope)
  let timelineCursor = 0
  const sources = evidence.sources.map((source) => {
    const sourceAuthority = source.sourceFrameAuthority!
    const visual = canonicalSourceLedVisualIntelligenceEvidenceSchema.parse(
      source.visual,
    )
    const selectedRanges = source.selectedRanges.map((range) => {
      const mapped = mapCanonicalSourceFrameRangeToMasterTiming({
        sourceStartFrame: range.startFrame,
        sourceEndFrameExclusive: range.endFrameExclusive,
        source: {
          fpsNumerator: sourceAuthority.fpsNumerator,
          fpsDenominator: sourceAuthority.fpsDenominator,
          frameCount: sourceAuthority.frameCount,
          timeBaseNumerator: sourceAuthority.timeBaseNumerator,
          timeBaseDenominator: sourceAuthority.timeBaseDenominator,
          constantFrameRate: true,
        },
        master: { fpsNumerator: 30, fpsDenominator: 1 },
      })
      const timelineStartFrame = timelineCursor
      timelineCursor += mapped.masterDurationFrames
      return {
        decisionId: range.rangeId,
        action: 'keep' as const,
        sourceStartFrame: range.startFrame,
        sourceEndFrameExclusive: range.endFrameExclusive,
        masterDurationFrames: mapped.masterDurationFrames,
        timelineStartFrame,
        timelineEndFrameExclusive: timelineCursor,
        reason: range.reason,
        confidenceBasisPoints: range.confidenceBasisPoints,
        phraseBoundaryAligned: true as const,
        preservesSourceMeaning: true as const,
        evidenceIds: range.evidenceIds,
        reasonCodes: range.keepReasonCodes,
        decisionBasis: range.decisionBasis,
        instructionIds: range.instructionIds,
        timeOnlyDecision: false as const,
      }
    })
    const removedRanges = source.removedRanges.map((range) => {
      const mapped = mapCanonicalSourceFrameRangeToMasterTiming({
        sourceStartFrame: range.startFrame,
        sourceEndFrameExclusive: range.endFrameExclusive,
        source: {
          fpsNumerator: sourceAuthority.fpsNumerator,
          fpsDenominator: sourceAuthority.fpsDenominator,
          frameCount: sourceAuthority.frameCount,
          timeBaseNumerator: sourceAuthority.timeBaseNumerator,
          timeBaseDenominator: sourceAuthority.timeBaseDenominator,
          constantFrameRate: true,
        },
        master: { fpsNumerator: 30, fpsDenominator: 1 },
      })
      return {
        decisionId: range.rangeId,
        action: 'remove' as const,
        sourceStartFrame: range.startFrame,
        sourceEndFrameExclusive: range.endFrameExclusive,
        masterDurationFrames: mapped.masterDurationFrames,
        timelineStartFrame: null,
        timelineEndFrameExclusive: null,
        reason: range.reason,
        confidenceBasisPoints: range.confidenceBasisPoints,
        phraseBoundaryAligned: true as const,
        preservesSourceMeaning: true as const,
        evidenceIds: range.evidenceIds,
        reasonCodes: range.reasonCodes,
        decisionBasis: range.decisionBasis,
        instructionIds: range.instructionIds,
        timeOnlyDecision: false as const,
      }
    })
    return {
      sourceSequenceItemId: source.sourceSequenceItemId,
      mediaAssetId: source.mediaAssetId,
      uploadedOrder: source.uploadedOrder,
      checksumSha256: source.checksumSha256,
      durationFrames: source.durationFrames,
      sourceFrameAuthorityDigestSha256:
        sourceAuthority.sourceFrameAuthorityDigestSha256,
      transcriptDigestSha256: source.transcript.transcriptDigestSha256,
      transcriptCoverageDigestSha256:
        source.transcript.coverage.coverageDigestSha256,
      visualRequestRef: visual.requestRef,
      visualReportRef: visual.reportRef,
      visualCoverageDigestSha256:
        visual.coverage.coverageDigestSha256,
      decisionPartition: [...selectedRanges, ...removedRanges].sort(
        (left, right) => left.sourceStartFrame - right.sourceStartFrame,
      ),
      selectedRangeIds: selectedRanges.map((range) => range.decisionId),
      removedRangeIds: removedRanges.map((range) => range.decisionId),
      embeddedEditInstructions: source.embeddedEditInstructions.map(
        (instruction) => ({
          instructionId: instruction.instructionId,
          instructionType: instruction.instructionType,
          targetRelation: instruction.targetRelation,
          transcriptSegmentId: instruction.transcriptSegmentId,
          spokenStartFrame: instruction.spokenStartFrame,
          spokenEndFrameExclusive: instruction.spokenEndFrameExclusive,
          targetStartFrame: instruction.targetStartFrame,
          targetEndFrameExclusive: instruction.targetEndFrameExclusive,
          appliedDecisionIds: instruction.appliedDecisionIds,
          spokenRemarkRemovalDecisionId:
            instruction.spokenRemarkRemovalDecisionId,
          classifiedAsEditorDirected: true as const,
          interpretationStatus: 'resolved' as const,
          userReviewRequired: false as const,
        }),
      ),
    }
  })
  const selectedRangeCount = sources.reduce(
    (sum, source) => sum + source.selectedRangeIds.length,
    0,
  )
  const removedRangeCount = sources.reduce(
    (sum, source) => sum + source.removedRangeIds.length,
    0,
  )
  const payload = bindingWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_SOURCE_CLEANUP_VISUAL_INTELLIGENCE_BINDING_VERSION,
    source:
      'head_intelligence_from_verified_visual_intelligence_and_transcript',
    scope: {
      workspaceId: evidence.identity.workspaceId,
      projectId: evidence.identity.projectId,
      editSessionId: evidence.identity.editSessionId,
      analysisRunId: evidence.identity.analysisRunId,
      planningDirectionDigestSha256:
        input.expectedScope.planningDirectionDigestSha256,
      userInstructionDigestSha256:
        evidence.identity.userInstructionDigestSha256,
      masterFpsNumerator: 30,
      masterFpsDenominator: 1,
    },
    sourceAnalysisEvidenceRef: {
      id: `source-analysis-${digest({
        analysisRunId: evidence.identity.analysisRunId,
        evidenceDigestSha256: evidence.evidenceDigestSha256,
      }).slice(0, 32)}`,
      version: 5,
      contentHash: `sha256:${evidence.evidenceDigestSha256}`,
    },
    sources,
    totals: {
      originalSourceFrames: evidence.summary.originalTotalFrames,
      selectedSourceFrames: evidence.summary.selectedTotalFrames,
      selectedMasterTimelineFrames: timelineCursor,
      selectedRangeCount,
      removedRangeCount,
      embeddedInstructionCount:
        evidence.summary.embeddedInstructionCount,
    },
    coverage: {
      completeAudioTimelineProcessed: true,
      completeSourceRangeRequested: true,
      completeRequestedRangeSemanticCoverage: true,
      orderedGaplessDecisionPartition: true,
      everyTimelineIntervalReviewed: true,
      everyRawFramePixelInspected: false,
      providerVisualPreprocessingExpected: true,
      timingOnlyCutDecisionsAccepted: false,
      unresolvedEmbeddedInstructionsAccepted: false,
      sourceOrderPreserved: true,
      meaningPreservationPassed: true,
    },
    authority: {
      semanticVisualEvidenceOwner: 'visual_intelligence',
      cutDecisionOwner: 'head_intelligence',
      masterTimingOwner: 'master_timing',
      mediaContainedInstructionsTreatedAsUntrustedEvidence: true,
      browserSelectedRangesAccepted: false,
      callerTimestampsAcceptedAsCutAuthority: false,
      rawChatUsedAsWorkerInstruction: false,
    },
    permissions: {
      planPublished: false,
      approvalGranted: false,
      timelineMutated: false,
      workDispatched: false,
      mediaProcessed: false,
      customerCreditMutated: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    },
  })
  return verifyCanonicalSourceCleanupVisualIntelligenceBinding({
    ...payload,
    bindingDigestSha256: digest(payload),
  })
}

export function verifyCanonicalSourceCleanupVisualIntelligenceBinding(
  input: unknown,
): CanonicalSourceCleanupVisualIntelligenceBinding {
  const binding = canonicalSourceCleanupVisualIntelligenceBindingSchema.parse(
    input,
  )
  const withoutDigest = { ...binding }
  Reflect.deleteProperty(withoutDigest, 'bindingDigestSha256')
  if (binding.bindingDigestSha256 !== digest(withoutDigest)) {
    throw new Error(
      'Source-cleanup Visual Intelligence binding digest is invalid.',
    )
  }
  let sourceFrameTotal = 0
  let selectedSourceFrameTotal = 0
  let selectedRangeCount = 0
  let removedRangeCount = 0
  let embeddedInstructionCount = 0
  let timelineCursor = 0
  const sourceIds = new Set<string>()
  const mediaIds = new Set<string>()
  const decisionIds = new Set<string>()
  for (const [sourceIndex, source] of binding.sources.entries()) {
    if (
      source.uploadedOrder !== sourceIndex + 1
      || sourceIds.has(source.sourceSequenceItemId)
      || mediaIds.has(source.mediaAssetId)
    ) throw new Error(
      'Source-cleanup Visual Intelligence binding lost exact source order or identity.',
    )
    sourceIds.add(source.sourceSequenceItemId)
    mediaIds.add(source.mediaAssetId)
    sourceFrameTotal += source.durationFrames
    let sourceCursor = 0
    const selectedIds = new Set(source.selectedRangeIds)
    const removedIds = new Set(source.removedRangeIds)
    if (
      selectedIds.size !== source.selectedRangeIds.length
      || removedIds.size !== source.removedRangeIds.length
      || [...selectedIds].some((id) => removedIds.has(id))
    ) throw new Error(
      'Source-cleanup Visual Intelligence range identities are not unique.',
    )
    for (const decision of source.decisionPartition) {
      if (
        decision.sourceStartFrame !== sourceCursor
        || decision.sourceEndFrameExclusive > source.durationFrames
        || decisionIds.has(decision.decisionId)
        || (decision.action === 'keep'
          ? !selectedIds.has(decision.decisionId)
            || decision.timelineStartFrame !== timelineCursor
          : !removedIds.has(decision.decisionId))
      ) throw new Error(
        'Source-cleanup Visual Intelligence decisions are not one gapless, ordered, evidence-bound partition.',
      )
      decisionIds.add(decision.decisionId)
      sourceCursor = decision.sourceEndFrameExclusive
      if (decision.action === 'keep') {
        timelineCursor = decision.timelineEndFrameExclusive!
        selectedSourceFrameTotal +=
          decision.sourceEndFrameExclusive - decision.sourceStartFrame
        selectedRangeCount += 1
      } else {
        removedRangeCount += 1
      }
    }
    if (sourceCursor !== source.durationFrames) {
      throw new Error(
        'Source-cleanup Visual Intelligence decisions do not cover the complete source.',
      )
    }
    const instructionIds = new Set(
      source.embeddedEditInstructions.map((item) => item.instructionId),
    )
    const sourceDecisionIds = new Set(
      source.decisionPartition.map((item) => item.decisionId),
    )
    const keptDecisionIds = new Set(
      source.decisionPartition
        .filter((item) => item.action === 'keep')
        .map((item) => item.decisionId),
    )
    const removedDecisionIds = new Set(
      source.decisionPartition
        .filter((item) => item.action === 'remove')
        .map((item) => item.decisionId),
    )
    if (
      instructionIds.size !== source.embeddedEditInstructions.length
      || selectedIds.size !== keptDecisionIds.size
      || removedIds.size !== removedDecisionIds.size
      || [...selectedIds].some((id) => !keptDecisionIds.has(id))
      || [...removedIds].some((id) => !removedDecisionIds.has(id))
      || source.embeddedEditInstructions.some((instruction) =>
        !sourceDecisionIds.has(instruction.spokenRemarkRemovalDecisionId)
        || instruction.appliedDecisionIds.some((id) =>
          !sourceDecisionIds.has(id)))
      || source.decisionPartition.some((decision) =>
        decision.instructionIds.some((id) => !instructionIds.has(id)))
    ) throw new Error(
      'Source-cleanup Visual Intelligence embedded instructions lost decision lineage.',
    )
    embeddedInstructionCount += source.embeddedEditInstructions.length
  }
  if (
    binding.totals.originalSourceFrames !== sourceFrameTotal
    || binding.totals.selectedSourceFrames !== selectedSourceFrameTotal
    || binding.totals.selectedMasterTimelineFrames !== timelineCursor
    || binding.totals.selectedRangeCount !== selectedRangeCount
    || binding.totals.removedRangeCount !== removedRangeCount
    || binding.totals.embeddedInstructionCount !== embeddedInstructionCount
  ) throw new Error(
    'Source-cleanup Visual Intelligence totals do not match their exact ranges.',
  )
  return binding
}

export function assertCanonicalSourceCleanupBindingMatchesEvidence(input: {
  readonly binding: unknown
  readonly evidence: unknown
}): CanonicalSourceCleanupVisualIntelligenceBinding {
  const binding = verifyCanonicalSourceCleanupVisualIntelligenceBinding(
    input.binding,
  )
  const evidence = verifyCanonicalSourceLedContentAnalysisEvidence(
    input.evidence,
  )
  const rebuilt = createCanonicalSourceCleanupVisualIntelligenceBinding({
    evidence,
    expectedScope: {
      workspaceId: binding.scope.workspaceId,
      projectId: binding.scope.projectId,
      editSessionId: binding.scope.editSessionId,
      planningDirectionDigestSha256:
        binding.scope.planningDirectionDigestSha256,
      userInstructionDigestSha256:
        binding.scope.userInstructionDigestSha256,
    },
  })
  if (stableStringify(binding) !== stableStringify(rebuilt)) {
    throw new Error(
      'Source-cleanup Visual Intelligence binding does not match its exact source-analysis evidence.',
    )
  }
  return binding
}

function assertFreshEvidence(
  evidence: CanonicalSourceLedContentAnalysisEvidence,
  expectedScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly planningDirectionDigestSha256: string
    readonly userInstructionDigestSha256: string
  },
): void {
  if (
    evidence.schemaVersion !==
      'canonical-source-led-content-analysis-evidence-v5'
    || evidence.identity.workspaceId !== expectedScope.workspaceId
    || evidence.identity.projectId !== expectedScope.projectId
    || evidence.identity.editSessionId !== expectedScope.editSessionId
    || !/^[a-f0-9]{64}$/u.test(
      expectedScope.planningDirectionDigestSha256,
    )
    || evidence.identity.userInstructionDigestSha256 !==
      expectedScope.userInstructionDigestSha256
    || !evidence.reasoning.completeSourceCoverageConfirmed
    || !evidence.reasoning.allTimelineIntervalsReviewed
    || !evidence.reasoning.embeddedInstructionsEvaluated
    || evidence.reasoning.timeOnlyCutDecisionsAllowed
    || !evidence.summary.completeSourceCoverageVerified
    || !evidence.summary.allTimelineIntervalsReviewed
    || !evidence.summary.embeddedInstructionsEvaluated
    || evidence.summary.unresolvedEmbeddedInstructionCount !== 0
    || evidence.summary.timeOnlyCutDecisionCount !== 0
    || !evidence.summary.meaningPreservationPassed
    || evidence.summary.userReviewRequired
    || evidence.sources.some((source) =>
      !source.sourceFrameAuthority
      || !('evidenceMode' in source.visual)
      || source.visual.evidenceMode !==
        'visual_intelligence_gemini_pro_high_v1')
  ) throw new Error(
    'Fresh source cleanup requires exact complete-video WeEditPro Visual Intelligence, transcript, Head Intelligence, and meaning-preservation evidence.',
  )
}

function digest(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, item]) =>
        `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
