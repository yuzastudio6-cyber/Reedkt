import { z } from 'zod'

import {
  deepFreezeSkillValue,
  hashSkillValue,
} from '../../core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../../core/skill-capability-manifest-schema'
import {
  projectTrackGraphV1,
  type TrackGraphV1,
  type TrackGraphV2,
} from '../../shared/track-graph'
import {
  buildTrackAllChunkIdentityGraph,
} from './chunk-identity-graph-runtime'
import {
  trackAllSam31MaskletSessionPlanSchema,
} from './sam3_1-track-masklets-operation'

export const TRACK_ALL_SAM31_PROTOCOL_WIRING_RECEIPT_VERSION =
  'track_all_sam3_1_protocol_wiring_receipt_v1' as const

const receiptCoreSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM31_PROTOCOL_WIRING_RECEIPT_VERSION,
  ),
  evidenceClass: z.literal('protocol_wiring_test_only'),
  operationId: z.literal('tool.sam3_1.track_masklets.v2'),
  scenario: z.enum(['selected_instance', 'concept_group']),
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  sourceSha256: skillSha256Schema,
  authorizedRangeHash: skillSha256Schema,
  sessionPlanHashes: z.array(skillSha256Schema).min(1).max(1_000),
  chunkCount: z.number().int().positive().max(1_000),
  targetGroupCount: z.number().int().positive().max(1_000),
  normalizedObservationEvidenceHash: skillSha256Schema,
  trackGraphV2Hash: skillSha256Schema,
  trackGraphV1Hash: skillSha256Schema,
  downstreamStagesObserved: z.tuple([
    z.literal('masklet_manifest_mapping'),
    z.literal('mask_normalization'),
    z.literal('chunk_stitching'),
    z.literal('identity_association'),
    z.literal('track_graph_v2_projection'),
    z.literal('target_qa_dependency'),
    z.literal('temporal_qa_dependency'),
    z.literal('mask_qa_dependency'),
    z.literal('track_graph_v1_projection'),
  ]),
  injectedEvidenceUsed: z.literal(true),
  strictCheckpointLoadObserved: z.literal(false),
  cudaInferenceObserved: z.literal(false),
  actualSamRequestCount: z.literal(0),
  actualGpuExecutionCount: z.literal(0),
  paidActionOccurred: z.literal(false),
  publicArtifactCount: z.literal(0),
  productionMutationCount: z.literal(0),
  routePromotionAuthorized: z.literal(false),
  qualificationEvidenceEligible: z.literal(false),
  productionQualified: z.literal(false),
}).strict().superRefine((value, context) => {
  if (new Set(value.sessionPlanHashes).size !== value.sessionPlanHashes.length) {
    context.addIssue({
      code: 'custom',
      message: 'Protocol wiring session plans must be exact and unique.',
    })
  }
})

export const trackAllSam31ProtocolWiringReceiptSchema =
  receiptCoreSchema.extend({ receiptHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { receiptHash, ...core } = value
      if (receiptHash !== hashSkillValue(core)) context.addIssue({
        code: 'custom',
        message: 'Track All SAM protocol wiring receipt is stale or forged.',
      })
    })

export type TrackAllSam31ProtocolWiringReceipt = z.infer<
  typeof trackAllSam31ProtocolWiringReceiptSchema
>

export interface TrackAllSam31ProtocolWiringResult {
  receipt: TrackAllSam31ProtocolWiringReceipt
  /** Test-only projection. It is never persisted or admitted as execution evidence. */
  protocolOnlyTrackGraphV2: TrackGraphV2
  protocolOnlyTrackGraphV1: TrackGraphV1
}

/**
 * Architecture-only port. It consumes injected geometric observations after
 * validating exact V2 session-plan lineage, but it never invokes the model,
 * loads a checkpoint, claims CUDA, registers a route receipt, or persists an
 * executable Track Graph. Qualification may bind this test's hash only as
 * proof that wiring exists, never as real SAM evidence.
 */
export class TrackAllSam31ProtocolWiringTestPort {
  readonly evidenceClass = 'protocol_wiring_test_only' as const

  execute(input: {
    scenario: 'selected_instance' | 'concept_group'
    sessionPlans: readonly unknown[]
    graphInput: Parameters<typeof buildTrackAllChunkIdentityGraph>[0]
  }): TrackAllSam31ProtocolWiringResult {
    const sessionPlans = input.sessionPlans.map((plan) =>
      trackAllSam31MaskletSessionPlanSchema.parse(plan))
    if (sessionPlans.length === 0 ||
      input.graphInput.evidenceClass !== 'injected_masklets_test_only') {
      throw new Error('Protocol wiring requires explicit injected-only test evidence.')
    }
    const first = sessionPlans[0]!
    const authorizedRangeHash = hashSkillValue(first.source.authorizedRange)
    const sessionKeys = new Set<string>()
    for (const plan of sessionPlans) {
      const sessionKey = `${plan.source.chunkRange.startFrameInclusive}:` +
        `${plan.source.chunkRange.endFrameExclusive}:${plan.targetGroup.targetGroupId}`
      if (plan.assignmentHash !== first.assignmentHash ||
        plan.source.sourceChecksum !== first.source.sourceChecksum ||
        hashSkillValue(plan.source.authorizedRange) !== authorizedRangeHash ||
        plan.attemptPolicy.modelSubmissionOrdinal !== 1 ||
        plan.attemptPolicy.automaticRetryCount !== 0 ||
        plan.attemptPolicy.automaticAlternateModelFallbackCount !== 0 ||
        plan.rawUserChatIncluded || sessionKeys.has(sessionKey)) {
        throw new Error('Protocol wiring session-plan lineage is stale, unsafe, or duplicate.')
      }
      sessionKeys.add(sessionKey)
    }
    if (input.graphInput.assignmentHash !== first.assignmentHash ||
      input.graphInput.sourceSha256 !== first.source.sourceChecksum ||
      hashSkillValue(input.graphInput.authorizedRange) !== authorizedRangeHash ||
      input.graphInput.runtimeAttemptRefs.length !== 0 ||
      input.graphInput.observations.some((observation) => {
        const plan = sessionPlans.find((candidate) =>
          candidate.source.chunkRange.startFrameInclusive <=
            observation.samples[0]!.frameIndex &&
          candidate.source.chunkRange.endFrameExclusive >
            observation.samples.at(-1)!.frameIndex)
        return !plan || !plan.targetGroup.objectIds.includes(
          observation.localObjectId,
        )
      })) {
      throw new Error('Protocol observations differ from exact session, source, or test authority.')
    }

    const graphResult = buildTrackAllChunkIdentityGraph(input.graphInput)
    const graphV1 = projectTrackGraphV1(graphResult.graph)
    const core = receiptCoreSchema.parse({
      schemaVersion: TRACK_ALL_SAM31_PROTOCOL_WIRING_RECEIPT_VERSION,
      evidenceClass: 'protocol_wiring_test_only',
      operationId: 'tool.sam3_1.track_masklets.v2',
      scenario: input.scenario,
      assignmentHash: first.assignmentHash,
      planHash: input.graphInput.planHash,
      sourceSha256: first.source.sourceChecksum,
      authorizedRangeHash,
      sessionPlanHashes: sessionPlans.map((plan) => plan.sessionPlanHash),
      chunkCount: new Set(sessionPlans.map((plan) =>
        hashSkillValue(plan.source.chunkRange))).size,
      targetGroupCount: new Set(sessionPlans.map((plan) =>
        plan.targetGroup.targetGroupId)).size,
      normalizedObservationEvidenceHash: hashSkillValue(
        input.graphInput.observations,
      ),
      trackGraphV2Hash: graphResult.graph.graphHash,
      trackGraphV1Hash: hashSkillValue(graphV1),
      downstreamStagesObserved: [
        'masklet_manifest_mapping',
        'mask_normalization',
        'chunk_stitching',
        'identity_association',
        'track_graph_v2_projection',
        'target_qa_dependency',
        'temporal_qa_dependency',
        'mask_qa_dependency',
        'track_graph_v1_projection',
      ],
      injectedEvidenceUsed: true,
      strictCheckpointLoadObserved: false,
      cudaInferenceObserved: false,
      actualSamRequestCount: 0,
      actualGpuExecutionCount: 0,
      paidActionOccurred: false,
      publicArtifactCount: 0,
      productionMutationCount: 0,
      routePromotionAuthorized: false,
      qualificationEvidenceEligible: false,
      productionQualified: false,
    })
    return deepFreezeSkillValue({
      receipt: trackAllSam31ProtocolWiringReceiptSchema.parse({
        ...core,
        receiptHash: hashSkillValue(core),
      }),
      protocolOnlyTrackGraphV2: graphResult.graph,
      protocolOnlyTrackGraphV1: graphV1,
    })
  }
}

export function assertTrackAllSam31ProtocolEvidenceCannotQualify(
  value: unknown,
): void {
  const receipt = trackAllSam31ProtocolWiringReceiptSchema.parse(value)
  if (receipt.evidenceClass === 'protocol_wiring_test_only') {
    throw new Error('Protocol wiring evidence cannot qualify real SAM execution.')
  }
}
