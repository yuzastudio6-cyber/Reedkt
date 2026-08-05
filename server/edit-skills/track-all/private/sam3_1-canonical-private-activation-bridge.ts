import { z } from 'zod'

import type {
  EditSkillArtifactReference,
  EditSkillArtifactStore,
} from '../../core/edit-skill-artifact-store'
import {
  deepFreezeSkillValue,
  hashSkillValue,
  skillManifestReference,
} from '../../core/skill-capability-manifest-hash'
import {
  editSkillArtifactReferenceSchema,
  skillFrameRangeSchema,
} from '../../core/skill-assignment-schema'
import {
  skillManifestReferenceSchema,
  skillSha256Schema,
} from '../../core/skill-capability-manifest-schema'
import type {
  TrackAllCanonicalPrivateAtomicStageExecutor,
  TrackAllCanonicalPrivateExecutionPackage,
} from '../track-all-canonical-private-runtime'
import { trackAllSam31RuntimeProfileV2Schema } from '../track-all-planning-authorities'
import { TRACK_ALL_CAPABILITY_MANIFEST } from '../track-all-capability-manifest'
import {
  trackAllPlanSchema,
  trackAllTargetSpecificationSchema,
} from '../track-all-schemas'
import {
  TrackAllSam31RealPrivateSessionOwner,
  trackAllSam31RealPrivateSessionReceiptSchema,
} from './sam3_1-real-private-session-owner'
import {
  createTrackAllSam31MaskletSessionPlan,
  trackAllSam31MaskletAttemptEvidenceSchema,
  trackAllSam31MaskletOutputManifestSchema,
  trackAllSam31MaskletSessionPlanSchema,
} from './sam3_1-track-masklets-operation'
import { trackAllSam31V2RouteGateReportSchema } from './sam3_1-v2-route-qualification-gate'

const safeId = z.string().trim().min(1).max(180)
const unit = z.number().min(0).max(1)
const authorityRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const typedRef = (artifactType: string) =>
  editSkillArtifactReferenceSchema.extend({
    artifactType: z.literal(artifactType),
  }).strict()

const sessionPlanSetCoreSchema = z.object({
  schemaVersion: z.literal('track_all_sam3_1_approved_session_plan_set_v1'),
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  assignmentId: safeId,
  assignmentHash: skillSha256Schema,
  publicPlanHash: skillSha256Schema,
  trackAllPlanHash: skillSha256Schema,
  pluginWorkGraphHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  sourceArtifactRef: typedRef('source_media_artifact_v1'),
  sourceSha256: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  targetSpecificationHash: skillSha256Schema,
  runtimeProfileHash: skillSha256Schema,
  routeGateReportHash: skillSha256Schema,
  routeQualificationReceiptHash: skillSha256Schema,
  sessions: z.array(z.object({
    chunkId: safeId,
    bucketIndex: z.number().int().nonnegative().max(7),
    targetId: safeId,
    targetSemanticClass: safeId,
    targetGroupId: safeId,
    plan: trackAllSam31MaskletSessionPlanSchema,
  }).strict()).min(1).max(1_000),
  rawUserChatIncluded: z.literal(false),
  callerSelectedExecutionAuthorityAccepted: z.literal(false),
  oneSubmissionPerSession: z.literal(true),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const exactManifest = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
  if (hashSkillValue(value.manifestRef) !== hashSkillValue(exactManifest) ||
    value.sourceArtifactRef.sha256 !== value.sourceSha256 ||
    value.sourceArtifactRef.ownerUserId !== value.ownerUserId ||
    value.sourceArtifactRef.workspaceId !== value.workspaceId ||
    value.sourceArtifactRef.projectId !== value.projectId ||
    new Set(value.sessions.map((session) => session.plan.sessionId)).size !==
    value.sessions.length ||
    value.sessions.some((session) =>
      session.plan.assignmentHash !== value.assignmentHash ||
      session.plan.source.sourceChecksum !== value.sourceSha256 ||
      session.plan.targetGroup.targetGroupId !== session.targetGroupId ||
      session.plan.targetGroup.targetSpecificationRef.contentHash !==
        `sha256:${value.targetSpecificationHash}` ||
      !session.targetGroupId.startsWith(`${session.targetId}:`))) {
    context.addIssue({
      code: 'custom',
      message: 'SAM approved session-plan set lost manifest, tenant, source, or session authority.',
    })
  }
})

export const trackAllSam31ApprovedSessionPlanSetSchema =
  sessionPlanSetCoreSchema.extend({ artifactHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { artifactHash, ...core } = value
      if (artifactHash !== hashSkillValue(core)) context.addIssue({
        code: 'custom', message: 'SAM approved session-plan set is stale or forged.',
      })
    })

export type TrackAllSam31ApprovedSessionPlanSet = z.infer<
  typeof trackAllSam31ApprovedSessionPlanSetSchema
>

const manifestSetCoreSchema = z.object({
  schemaVersion: z.literal('track_all_sam3_1_masklet_manifest_set_v1'),
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  assignmentId: safeId,
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  sourceSha256: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  sessionPlanSetHash: skillSha256Schema,
  sessions: z.array(z.object({
    chunkId: safeId,
    bucketIndex: z.number().int().nonnegative().max(7),
    targetGroupId: safeId,
    sessionPlanHash: skillSha256Schema,
    sessionReceiptRef: typedRef(
      'track_all_sam3_1_real_private_session_receipt_v1',
    ),
    attemptEvidenceRef: typedRef(
      'track_all_sam3_1_masklet_attempt_evidence_v2',
    ),
    outputManifestRef: typedRef(
      'track_all_sam3_1_masklet_output_manifest_v2',
    ),
  }).strict()).min(1).max(1_000),
  executionEvidenceClass: z.literal('real_sam3_1_private_execution'),
  injectedEvidenceUsed: z.literal(false),
  rawTensorDataIncluded: z.literal(false),
  privateBinaryOnly: z.literal(true),
  publicArtifactCount: z.literal(0),
  productionMutationCount: z.literal(0),
}).strict().superRefine((value, context) => {
  const refs = value.sessions.flatMap((session) => [
    session.sessionReceiptRef,
    session.attemptEvidenceRef,
    session.outputManifestRef,
  ])
  if (new Set(value.sessions.map((session) => session.sessionPlanHash)).size !==
      value.sessions.length || refs.some((reference) =>
    reference.ownerUserId !== value.ownerUserId ||
    reference.workspaceId !== value.workspaceId ||
    reference.projectId !== value.projectId)) context.addIssue({
    code: 'custom',
    message: 'SAM masklet manifest set contains duplicate or cross-tenant session evidence.',
  })
})

export const trackAllSam31MaskletManifestSetSchema =
  manifestSetCoreSchema.extend({ artifactHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { artifactHash, ...core } = value
      if (artifactHash !== hashSkillValue(core)) context.addIssue({
        code: 'custom', message: 'SAM masklet manifest set is stale or forged.',
      })
    })

const normalizedObservationSchema = z.object({
  observationId: safeId,
  chunkId: safeId,
  bucketIndex: z.number().int().nonnegative().max(7),
  localObjectId: z.string().regex(/^object_[0-9]{3}$/u),
  targetId: safeId,
  semanticClass: safeId,
  samples: z.array(z.object({
    frameIndex: z.number().int().nonnegative(),
    box: z.object({
      x: unit,
      y: unit,
      width: z.number().gt(0).max(1),
      height: z.number().gt(0).max(1),
    }).strict(),
    confidence: unit,
    visibility: z.enum(['active', 'partially_occluded', 'fully_occluded']),
  }).strict()).min(1).max(100_000),
  maskChunkRef: typedRef('track_mask_chunk_manifest_v1'),
  sourceEvidenceHash: skillSha256Schema,
}).strict()

const normalizedObservationSetCoreSchema = z.object({
  schemaVersion: z.literal('track_all_normalized_masklet_observation_set_v1'),
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  assignmentId: safeId,
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  manifestRef: skillManifestReferenceSchema,
  sourceSha256: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  sessionPlanSetHash: skillSha256Schema,
  manifestSetHash: skillSha256Schema,
  observations: z.array(normalizedObservationSchema).min(1).max(10_000),
  evidenceHashes: z.array(skillSha256Schema).min(1).max(10_000),
  evidenceClass: z.enum([
    'real_private_masklets',
    'protocol_wiring_test_only',
  ]),
  rawTensorDataIncluded: z.literal(false),
  privateBinaryOnly: z.literal(true),
  publicArtifactCount: z.literal(0),
  productionMutationCount: z.literal(0),
}).strict().superRefine((value, context) => {
  const contains = (frameIndex: number) =>
    frameIndex >= value.authorizedRange.startFrameInclusive &&
    frameIndex < value.authorizedRange.endFrameExclusive
  if (value.observations.some((observation) =>
    observation.samples.some((sample) => !contains(sample.frameIndex)) ||
    observation.maskChunkRef.ownerUserId !== value.ownerUserId ||
    observation.maskChunkRef.workspaceId !== value.workspaceId ||
    observation.maskChunkRef.projectId !== value.projectId)) context.addIssue({
    code: 'custom',
    message: 'Normalized masklet observations exceed range or tenant authority.',
  })
})

export const trackAllNormalizedMaskletObservationSetSchema =
  normalizedObservationSetCoreSchema.extend({ artifactHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { artifactHash, ...core } = value
      if (artifactHash !== hashSkillValue(core)) context.addIssue({
        code: 'custom', message: 'Normalized masklet observations are stale or forged.',
      })
    })

export interface TrackAllSam31SessionAuthorityFactory {
  create(input: {
    sessionId: string
    chunkId: string
    bucketIndex: number
    sessionOrdinal: number
  }): {
    executionAttemptRef: z.infer<typeof authorityRefSchema>
    workerLeaseRef: z.infer<typeof authorityRefSchema>
    fundedReservationRef: z.infer<typeof authorityRefSchema>
  }
}

export function compileTrackAllSam31ApprovedSessionPlanSet(input: {
  execution: TrackAllCanonicalPrivateExecutionPackage
  sourceArtifactRef: EditSkillArtifactReference
  targetSpecification: unknown
  runtimeProfile: unknown
  routeGateReport: unknown
  approvedEstimateRef: z.infer<typeof authorityRefSchema>
  accountEffectiveRateAuthorityRef: z.infer<typeof authorityRefSchema>
  sessionAuthorityFactory: TrackAllSam31SessionAuthorityFactory
}): TrackAllSam31ApprovedSessionPlanSet {
  const plan = trackAllPlanSchema.parse(input.execution.plan)
  const target = trackAllTargetSpecificationSchema.parse(
    input.targetSpecification,
  )
  const profile = trackAllSam31RuntimeProfileV2Schema.parse(input.runtimeProfile)
  const gate = trackAllSam31V2RouteGateReportSchema.parse(input.routeGateReport)
  const exactSamWork = input.execution.pluginWorkGraph.atomicWorkItems.filter((item) =>
    item.operationId === 'tool.sam3_1.track_masklets.v2')
  if (!plan.samWorkPlanned || exactSamWork.length !== 1 ||
    profile.qualification.status !== 'internal_execution_qualified' ||
    !profile.qualification.internalExecutionAuthorized ||
    gate.routeQualificationStatus !== 'internal_execution_qualified' ||
    !gate.internalExecutionAuthorized || gate.checkpointSha256 === null ||
    profile.qualification.routeGateReportHash !== gate.reportHash ||
    target.assignmentId !== input.execution.assignment.assignmentId ||
    input.sourceArtifactRef.artifactType !== 'source_media_artifact_v1' ||
    input.sourceArtifactRef.sha256 !== input.execution.pluginWorkGraph.sourceSha256) {
    throw new Error('Track All cannot compile real SAM sessions without exact qualified plan authority.')
  }
  const work = exactSamWork[0]!
  const expectedObjects = plan.objectBudget.expectedObjects
  const buckets = Array.from({ length: plan.objectBudget.bucketCount }, (_, index) => {
    const first = index * plan.objectBudget.bucketSize
    const count = Math.min(plan.objectBudget.bucketSize, expectedObjects - first)
    return Array.from({ length: count }, (_unused, objectIndex) =>
      `object_${String(objectIndex + 1).padStart(3, '0')}`)
  })
  const sessions: TrackAllSam31ApprovedSessionPlanSet['sessions'] = []
  let ordinal = 0
  for (const chunk of plan.chunkPlan.chunks) {
    for (let bucketIndex = 0; bucketIndex < buckets.length; bucketIndex += 1) {
      ordinal += 1
      const objectIds = buckets[bucketIndex]!
      const sessionId = `session:${chunk.chunkId}:bucket-${bucketIndex + 1}`
      const targetGroupId = `${target.targetId}:${chunk.chunkId}:bucket-${bucketIndex + 1}`
      const authority = input.sessionAuthorityFactory.create({
        sessionId,
        chunkId: chunk.chunkId,
        bucketIndex,
        sessionOrdinal: ordinal,
      })
      const initializationFrameIndex = initializationFrameForChunk({
        plan,
        target,
        chunkRange: chunk.range,
      })
      const actions = sessionActions({
        target,
        objectIds,
        initializationFrameIndex,
        chunkRange: chunk.range,
        propagationDirection: plan.propagationDirection,
      })
      const sessionPlan = createTrackAllSam31MaskletSessionPlan({
        schemaVersion: 'track_all_sam3_1_masklet_session_plan_v2',
        operationId: 'tool.sam3_1.track_masklets.v2',
        historicalOperationPreserved: 'tool.sam3_1.segment_and_track_subject.v1',
        skillManifestRef: input.execution.assignment.manifestRef,
        sessionId,
        assignmentId: input.execution.assignment.assignmentId,
        assignmentHash: input.execution.assignment.assignmentHash,
        ownerUserId: input.execution.assignment.ownerUserId,
        workspaceId: input.execution.assignment.workspaceId,
        projectId: input.execution.assignment.projectId,
        editSessionId: input.execution.assignment.editSessionId,
        planRef: authorityRef(input.execution.plan.planId, plan.planHash),
        approvedSnapshotRef: authorityRef(
          `approval:${input.execution.approval.approvalHash.slice(0, 20)}`,
          input.execution.approval.approvalHash,
        ),
        approvedWorkItemRef: authorityRef(work.workItemKey, work.workItemHash),
        executionAttemptRef: authority.executionAttemptRef,
        workerLeaseRef: authority.workerLeaseRef,
        fundedReservationRef: authority.fundedReservationRef,
        source: {
          artifactRef: input.sourceArtifactRef,
          sourceChecksum: input.sourceArtifactRef.sha256,
          authorizedRange: input.execution.assignment.authorizedRange,
          chunkRange: chunk.range,
          decodedFrameCount:
            chunk.range.endFrameExclusive - chunk.range.startFrameInclusive,
          sourceResolutionPreserved: true,
          sourceRangePreserved: true,
          variableFrameRateAllowed: false,
          callerPathOrUrlAccepted: false,
        },
        targetGroup: {
          targetSpecificationRef: authorityRef(target.targetId, target.targetHash),
          targetGroupId,
          initializationFrameIndex,
          objectIds,
          expectedObjectCount: objectIds.length,
          anonymousIdentityOnly: true,
          realWorldIdentityRecognitionAllowed: false,
        },
        objectBudget: {
          objectCount: objectIds.length,
          multiplexBucketSize: 16,
          bucketCount: 1,
          maximumFrames: 240,
        },
        actions,
        terminalClosePolicy: {
          closeOperation: 'close_session',
          closeInFinally: true,
          mandatoryAfter: [
            'completed', 'failed', 'cancelled', 'timed_out',
            'reconciliation_required', 'partial_output',
          ],
          resetRequiredBeforeDifferentConcept: true,
          oneWriterPerSession: true,
          releaseGpuMemoryOnClose: true,
        },
        routeAuthority: {
          exactSourceRevision: profile.sourceRevision,
          exactCheckpointRevision: profile.checkpointRevision,
          exactSourceCheckpointCompatibilityRequired: true,
          strictCheckpointLoadRequired: true,
          runtimeDownloadAllowed: false,
          privateOutputRequired: true,
          modelSelectionIncluded: false,
          acceleratorSelectionIncluded: false,
          executableSelectionIncluded: false,
          pathOrUrlSelectionIncluded: false,
          maskPromptingQualified: false,
        },
        attemptPolicy: {
          modelSubmissionOrdinal: 1,
          automaticRetryCount: 0,
          approvedPromptRefinementCeiling: 1,
          automaticAlternateModelFallbackCount: 0,
          unknownOutcomeResubmissionAllowed: false,
          reconcileExactAttemptBeforeNewSubmission: true,
        },
        costAuthority: {
          approvedEstimateRef: input.approvedEstimateRef,
          accountEffectiveRateAuthorityRef:
            input.accountEffectiveRateAuthorityRef,
          maximumCredits: Math.max(1, Math.ceil(
            plan.creditEstimate.maximumCredits / plan.objectBudget.sessionCount,
          )),
          callerSelectedPriceAccepted: false,
          customerMarkupIncludedInInternalCost: false,
        },
        callerSelectedModelModuleClassCheckpointCommandGpuEndpointPathUrlRetryFallbackOrPriceAccepted:
          false,
        rawUserChatIncluded: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
      })
      sessions.push({
        chunkId: chunk.chunkId,
        bucketIndex,
        targetId: target.targetId,
        targetSemanticClass: target.semanticClass,
        targetGroupId,
        plan: sessionPlan,
      })
    }
  }
  if (sessions.length !== plan.objectBudget.sessionCount) {
    throw new Error('Track All compiled SAM session count differs from the approved object/chunk budget.')
  }
  const core = sessionPlanSetCoreSchema.parse({
    schemaVersion: 'track_all_sam3_1_approved_session_plan_set_v1',
    ownerUserId: input.execution.assignment.ownerUserId,
    workspaceId: input.execution.assignment.workspaceId,
    projectId: input.execution.assignment.projectId,
    editSessionId: input.execution.assignment.editSessionId,
    assignmentId: input.execution.assignment.assignmentId,
    assignmentHash: input.execution.assignment.assignmentHash,
    publicPlanHash: input.execution.publicPlan.envelope.planHash,
    trackAllPlanHash: plan.planHash,
    pluginWorkGraphHash: input.execution.pluginWorkGraph.artifactHash,
    manifestRef: input.execution.assignment.manifestRef,
    sourceArtifactRef: input.sourceArtifactRef,
    sourceSha256: input.sourceArtifactRef.sha256,
    authorizedRange: input.execution.assignment.authorizedRange,
    targetSpecificationHash: target.targetHash,
    runtimeProfileHash: profile.profileHash,
    routeGateReportHash: gate.reportHash,
    routeQualificationReceiptHash: profile.qualification.routeReceiptHash,
    sessions,
    rawUserChatIncluded: false,
    callerSelectedExecutionAuthorityAccepted: false,
    oneSubmissionPerSession: true,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
  })
  return deepFreezeSkillValue(trackAllSam31ApprovedSessionPlanSetSchema.parse({
    ...core,
    artifactHash: hashSkillValue(core),
  }))
}

export class TrackAllCanonicalPrivateSam31StageExecutor
implements TrackAllCanonicalPrivateAtomicStageExecutor {
  readonly #artifactStore: EditSkillArtifactStore
  readonly #sessionOwner: TrackAllSam31RealPrivateSessionOwner
  readonly #executionAuthority: ReturnType<
    TrackAllSam31RealPrivateSessionOwner['executionAuthority']
  >

  constructor(input: {
    artifactStore: EditSkillArtifactStore
    sessionOwner: TrackAllSam31RealPrivateSessionOwner
  }) {
    if (input.artifactStore.storageClass !== 'durable' ||
      !(input.sessionOwner instanceof TrackAllSam31RealPrivateSessionOwner)) {
      throw new Error('Track All real SAM stage requires the qualified real private session owner.')
    }
    const authority = input.sessionOwner.executionAuthority()
    if (authority.operationId !== 'tool.sam3_1.track_masklets.v2' ||
      authority.routeQualificationEvidenceClass !==
        'actual_canonical_private_evidence' ||
      authority.fixtureEvidenceOnly || authority.qualificationCandidateOnly ||
      !authority.canonicalPrivateExecutionAuthorized ||
      authority.productionExecutionAuthorized ||
      !authority.checkpointSha256 || !authority.immutableRuntimeImageDigest ||
      !authority.strictCheckpointLoadRequired) {
      throw new Error('Track All real SAM stage rejected under-qualified execution authority.')
    }
    this.#artifactStore = input.artifactStore
    this.#sessionOwner = input.sessionOwner
    this.#executionAuthority = authority
  }

  async executeAtomicStage(input: Parameters<
    TrackAllCanonicalPrivateAtomicStageExecutor['executeAtomicStage']
  >[0]) {
    if (input.item.operationId !== 'tool.sam3_1.track_masklets.v2' ||
      !input.item.createsGpuWork) {
      throw new Error('Track All SAM stage executor accepts only the exact approved SAM V2 operation.')
    }
    const setRef = exactRef(
      input.inputArtifactRefs,
      'track_all_sam3_1_approved_session_plan_set_v1',
    )
    const set = trackAllSam31ApprovedSessionPlanSetSchema.parse(
      await this.#artifactStore.readJson({
        reference: setRef,
        ...artifactScope(input.execution),
      }),
    )
    if (set.assignmentHash !== input.execution.assignment.assignmentHash ||
      set.publicPlanHash !== input.execution.publicPlan.envelope.planHash ||
      set.trackAllPlanHash !== input.execution.plan.planHash ||
      set.pluginWorkGraphHash !== input.execution.pluginWorkGraph.artifactHash ||
      set.sessions.length !== input.execution.plan.objectBudget.sessionCount ||
      set.targetSpecificationHash !== input.execution.plan.targetHash ||
      set.runtimeProfileHash !== this.#executionAuthority.runtimeProfileHash ||
      set.routeGateReportHash !==
        this.#executionAuthority.routeGateReportHash ||
      set.routeQualificationReceiptHash !==
        this.#executionAuthority.routeQualificationReceiptHash) {
      throw new Error('Track All SAM session-plan set differs from approved execution lineage.')
    }
    const projectedSessions: z.input<typeof manifestSetCoreSchema>['sessions'] = []
    const sessionReceiptRefs: EditSkillArtifactReference[] = []
    const attemptEvidenceRefs: EditSkillArtifactReference[] = []
    for (const session of set.sessions) {
      const result = await this.#sessionOwner.execute({ plan: session.plan })
      if (result.receipt.terminalDisposition !== 'completed' ||
        !result.attemptEvidence || !result.outputManifest ||
        !result.outputManifestRef ||
        result.receipt.actualSamRequestCount !== 1 ||
        result.receipt.actualGpuExecutionCount !== 1 ||
        result.receipt.injectedEvidenceUsed) {
        throw new Error('Track All real SAM session did not complete with exact private inference evidence.')
      }
      const receiptRef = await this.#artifactStore.putJson({
        artifactType: 'track_all_sam3_1_real_private_session_receipt_v1',
        value: trackAllSam31RealPrivateSessionReceiptSchema.parse(result.receipt),
        ...artifactScope(input.execution),
      })
      const attemptRef = await this.#artifactStore.putJson({
        artifactType: 'track_all_sam3_1_masklet_attempt_evidence_v2',
        value: trackAllSam31MaskletAttemptEvidenceSchema.parse(result.attemptEvidence),
        ...artifactScope(input.execution),
      })
      const outputRef = await this.#artifactStore.putJson({
        artifactType: 'track_all_sam3_1_masklet_output_manifest_v2',
        value: trackAllSam31MaskletOutputManifestSchema.parse(result.outputManifest),
        ...artifactScope(input.execution),
      })
      if (outputRef.sha256 !== result.outputManifestRef.sha256) {
        throw new Error('Track All real SAM output changed across private create-only persistence.')
      }
      sessionReceiptRefs.push(receiptRef)
      attemptEvidenceRefs.push(attemptRef)
      projectedSessions.push({
        chunkId: session.chunkId,
        bucketIndex: session.bucketIndex,
        targetGroupId: session.targetGroupId,
        sessionPlanHash: session.plan.sessionPlanHash,
        sessionReceiptRef: receiptRef,
        attemptEvidenceRef: attemptRef,
        outputManifestRef: outputRef,
      })
    }
    const core = manifestSetCoreSchema.parse({
      schemaVersion: 'track_all_sam3_1_masklet_manifest_set_v1',
      ownerUserId: input.execution.assignment.ownerUserId,
      workspaceId: input.execution.assignment.workspaceId,
      projectId: input.execution.assignment.projectId,
      editSessionId: input.execution.assignment.editSessionId,
      assignmentId: input.execution.assignment.assignmentId,
      assignmentHash: input.execution.assignment.assignmentHash,
      planHash: input.execution.plan.planHash,
      manifestRef: input.execution.assignment.manifestRef,
      sourceSha256: input.execution.pluginWorkGraph.sourceSha256,
      authorizedRange: input.execution.assignment.authorizedRange,
      sessionPlanSetHash: set.artifactHash,
      sessions: projectedSessions,
      executionEvidenceClass: 'real_sam3_1_private_execution',
      injectedEvidenceUsed: false,
      rawTensorDataIncluded: false,
      privateBinaryOnly: true,
      publicArtifactCount: 0,
      productionMutationCount: 0,
    })
    const value = trackAllSam31MaskletManifestSetSchema.parse({
      ...core,
      artifactHash: hashSkillValue(core),
    })
    return {
      value,
      evidenceHashes: [
        set.artifactHash,
        ...projectedSessions.flatMap((session) => [
          session.sessionReceiptRef.sha256,
          session.attemptEvidenceRef.sha256,
          session.outputManifestRef.sha256,
        ]),
      ],
      actualToolOperationIds: ['tool.sam3_1.track_masklets.v2'],
      executionCounts: {
        providerRequestCount: 0 as const,
        actualSamRequestCount: sessionReceiptRefs.length,
        actualGpuExecutionCount: attemptEvidenceRefs.length,
        samSessionReceiptRefs: sessionReceiptRefs,
        samAttemptEvidenceRefs: attemptEvidenceRefs,
        executionEvidenceClass: 'real_sam3_1_private_execution' as const,
      },
    }
  }
}

export interface TrackAllCanonicalPrivateMaskletGeometryPort {
  readonly evidenceClass: 'real_private_masklets'
  normalize(input: {
    sessionPlanSet: TrackAllSam31ApprovedSessionPlanSet
    manifestSet: z.infer<typeof trackAllSam31MaskletManifestSetSchema>
    outputManifests: readonly z.infer<
      typeof trackAllSam31MaskletOutputManifestSchema
    >[]
  }): Promise<{
    observations: Array<{
      observationId: string
      chunkId: string
      bucketIndex: number
      localObjectId: string
      targetId: string
      semanticClass: string
      samples: Array<{
        frameIndex: number
        box: { x: number; y: number; width: number; height: number }
        confidence: number
        visibility: 'active' | 'partially_occluded' | 'fully_occluded'
      }>
      privateObjectRef: EditSkillArtifactReference
      frameCount: number
      width: number
      height: number
      pixelFormat: 'gray8' | 'gray16'
      sourceEvidenceHash: string
    }>
    evidenceHashes: string[]
    rawTensorDataIncluded: false
  }>
}

const privateGeometryObservationSchema = z.object({
  privateObjectRefHash: skillSha256Schema,
  sourceEvidenceHash: skillSha256Schema,
  frameCount: z.number().int().positive().max(240),
  width: z.number().int().positive().max(16_384),
  height: z.number().int().positive().max(16_384),
  pixelFormat: z.enum(['gray8', 'gray16']),
  samples: z.array(z.object({
    frameIndex: z.number().int().nonnegative(),
    box: z.object({
      x: unit,
      y: unit,
      width: z.number().gt(0).max(1),
      height: z.number().gt(0).max(1),
    }).strict(),
    confidence: unit,
    visibility: z.enum(['active', 'partially_occluded', 'fully_occluded']),
  }).strict()).min(1).max(240),
  connectedComponentAnalysisExecuted: z.literal(true),
  rawTensorDataIncluded: z.literal(false),
  publicOutputCreated: z.literal(false),
}).strict().superRefine((value, context) => {
  if (value.samples.length !== value.frameCount ||
    value.samples.some((sample) =>
      sample.box.x + sample.box.width > 1 ||
      sample.box.y + sample.box.height > 1)) context.addIssue({
    code: 'custom',
    message: 'Private masklet geometry observation is incomplete or out of frame.',
  })
})

export interface TrackAllCanonicalPrivateMaskletGeometryReader {
  readonly readerClass: 'canonical_private_masklet_geometry_reader'
  readonly operationId: 'tool.opencv.analyze_approved_visual_artifacts.v1'
  readonly privateCreateOnlyInputRequired: true
  readonly publicOutputAllowed: false
  analyze(input: {
    privateObjectRef: EditSkillArtifactReference
    authorizedFrameRange: z.infer<typeof skillFrameRangeSchema>
    expectedFrameCount: number
    expectedWidth: number
    expectedHeight: number
    expectedPixelFormat: 'gray8' | 'gray16'
  }): Promise<unknown>
}

const geometryAdapterAuthorityCore = {
  schemaVersion: 'track_all_canonical_private_masklet_geometry_adapter_authority_v1',
  adapterClass: 'canonical_private_masklet_geometry_adapter',
  readerClass: 'canonical_private_masklet_geometry_reader',
  operationId: 'tool.opencv.analyze_approved_visual_artifacts.v1',
  inputEvidenceClass: 'real_sam3_1_private_execution',
  outputEvidenceClass: 'real_private_masklets',
  privateCreateOnlyInputRequired: true,
  connectedComponentAnalysisRequired: true,
  rawTensorJsonAllowed: false,
  publicOutputAllowed: false,
  callerSelectedExecutableAccepted: false,
} as const

export const TRACK_ALL_CANONICAL_PRIVATE_MASKLET_GEOMETRY_ADAPTER_AUTHORITY =
  deepFreezeSkillValue({
    ...geometryAdapterAuthorityCore,
    authorityHash: hashSkillValue(geometryAdapterAuthorityCore),
  })

/**
 * Concrete real-output adapter. The durable private-storage owner supplies a
 * fixed reader implementation; this class owns all lineage, dimensions,
 * frame-contiguity, and no-public-output validation before geometry can reach
 * Track Graph construction.
 */
export class TrackAllCanonicalPrivateMaskletGeometryAdapter
implements TrackAllCanonicalPrivateMaskletGeometryPort {
  readonly evidenceClass = 'real_private_masklets' as const
  readonly #reader: TrackAllCanonicalPrivateMaskletGeometryReader

  constructor(input: { reader: TrackAllCanonicalPrivateMaskletGeometryReader }) {
    if (input.reader.readerClass !==
      'canonical_private_masklet_geometry_reader' ||
      input.reader.operationId !==
        'tool.opencv.analyze_approved_visual_artifacts.v1' ||
      !input.reader.privateCreateOnlyInputRequired ||
      input.reader.publicOutputAllowed) {
      throw new Error('Track All masklet geometry adapter requires the fixed private OpenCV reader.')
    }
    this.#reader = input.reader
  }

  async normalize(input: Parameters<
    TrackAllCanonicalPrivateMaskletGeometryPort['normalize']
  >[0]) {
    if (input.manifestSet.executionEvidenceClass !==
      'real_sam3_1_private_execution' ||
      input.manifestSet.injectedEvidenceUsed ||
      input.outputManifests.length !== input.manifestSet.sessions.length) {
      throw new Error('Track All masklet geometry adapter rejected injected or incomplete SAM output.')
    }
    const observations = []
    const evidenceHashes: string[] = [
      TRACK_ALL_CANONICAL_PRIVATE_MASKLET_GEOMETRY_ADAPTER_AUTHORITY.authorityHash,
    ]
    for (let sessionIndex = 0;
      sessionIndex < input.manifestSet.sessions.length;
      sessionIndex += 1) {
      const session = input.manifestSet.sessions[sessionIndex]!
      const output = input.outputManifests[sessionIndex]!
      const plan = input.sessionPlanSet.sessions.find((candidate) =>
        candidate.plan.sessionPlanHash === session.sessionPlanHash)
      if (!plan || output.sessionPlanHash !== session.sessionPlanHash ||
        output.chunkRange.startFrameInclusive !==
          plan.plan.source.chunkRange.startFrameInclusive ||
        output.chunkRange.endFrameExclusive !==
          plan.plan.source.chunkRange.endFrameExclusive ||
        output.chunkRange.fps !== plan.plan.source.chunkRange.fps) {
        throw new Error('Track All masklet geometry adapter received stale session output.')
      }
      for (const object of output.objects) {
        const observed = privateGeometryObservationSchema.parse(
          await this.#reader.analyze({
            privateObjectRef: object.privateObjectRef,
            authorizedFrameRange: output.chunkRange,
            expectedFrameCount: object.frameCount,
            expectedWidth: object.width,
            expectedHeight: object.height,
            expectedPixelFormat: object.pixelFormat,
          }),
        )
        if (observed.privateObjectRefHash !==
          hashSkillValue(object.privateObjectRef) ||
          observed.frameCount !== object.frameCount ||
          observed.width !== object.width || observed.height !== object.height ||
          observed.pixelFormat !== object.pixelFormat ||
          observed.samples.some((sample, frameOffset) =>
            sample.frameIndex !==
              output.chunkRange.startFrameInclusive + frameOffset)) {
          throw new Error('Track All private masklet geometry differs from exact object or frame authority.')
        }
        evidenceHashes.push(observed.sourceEvidenceHash)
        observations.push({
          observationId: `${session.chunkId}:${session.bucketIndex}:${object.objectId}`,
          chunkId: session.chunkId,
          bucketIndex: session.bucketIndex,
          localObjectId: object.objectId,
          targetId: plan.targetId,
          semanticClass: plan.targetSemanticClass,
          samples: observed.samples,
          privateObjectRef: object.privateObjectRef,
          frameCount: object.frameCount,
          width: object.width,
          height: object.height,
          pixelFormat: object.pixelFormat,
          sourceEvidenceHash: observed.sourceEvidenceHash,
        })
      }
    }
    return {
      observations,
      evidenceHashes: [...new Set(evidenceHashes)],
      rawTensorDataIncluded: false as const,
    }
  }
}

function initializationFrameForChunk(input: {
  plan: z.infer<typeof trackAllPlanSchema>
  target: z.infer<typeof trackAllTargetSpecificationSchema>
  chunkRange: z.infer<typeof skillFrameRangeSchema>
}): number {
  const candidates = [
    input.target.initializationFramePreference,
    input.plan.initializationFrame,
    ...input.target.groundingEvidence.flatMap((evidence) =>
      'frameIndex' in evidence ? [evidence.frameIndex] : []),
  ].filter((value): value is number => value !== undefined)
  const inRange = candidates.find((frame) =>
    frame >= input.chunkRange.startFrameInclusive &&
    frame < input.chunkRange.endFrameExclusive)
  if (inRange !== undefined) return inRange
  if (input.target.groundingEvidence.some((evidence) =>
    evidence.kind === 'text_concept')) return input.chunkRange.startFrameInclusive
  throw new Error('Selected-instance multi-chunk SAM work requires exact per-chunk grounding evidence.')
}

function sessionActions(input: {
  target: z.infer<typeof trackAllTargetSpecificationSchema>
  objectIds: string[]
  initializationFrameIndex: number
  chunkRange: z.infer<typeof skillFrameRangeSchema>
  propagationDirection: z.infer<typeof trackAllPlanSchema>['propagationDirection']
}) {
  const conceptStageId = 'concept_001' as const
  const primary = input.target.groundingEvidence.find((evidence) =>
    evidence.kind === 'text_concept' ||
    evidence.kind === 'positive_points' ||
    evidence.kind === 'bounding_box')
  if (!primary) throw new Error('SAM session plan requires approved positive grounding.')
  const actions: Array<Record<string, unknown>> = [{
    action: 'start_session', sequence: 1, conceptStageId,
  }]
  for (const objectId of input.objectIds) {
    const prompt = primary.kind === 'text_concept'
      ? {
          promptKind: 'text_concept', conceptStageId, objectId,
          frameIndex: input.initializationFrameIndex,
          compiledConcept: primary.compiledConcept,
          compiledPromptHash: hashSkillValue({
            conceptStageId,
            objectId,
            frameIndex: input.initializationFrameIndex,
            compiledConcept: primary.compiledConcept,
          }),
          rawUserChatIncluded: false,
        }
      : primary.kind === 'positive_points'
        ? {
            promptKind: 'positive_points', conceptStageId, objectId,
            frameIndex: input.initializationFrameIndex,
            points: primary.points,
            rawUserChatIncluded: false,
          }
        : {
            promptKind: 'bounding_box', conceptStageId, objectId,
            frameIndex: input.initializationFrameIndex,
            box: primary.box,
            rawUserChatIncluded: false,
          }
    actions.push({
      action: 'add_prompt',
      sequence: actions.length + 1,
      conceptStageId,
      prompt,
      refinementOrdinal: 0,
    })
  }
  actions.push({
    action: 'propagate',
    sequence: actions.length + 1,
    conceptStageId,
    direction: input.propagationDirection === 'both'
      ? 'bidirectional'
      : input.propagationDirection,
    range: input.chunkRange,
    objectIds: input.objectIds,
  })
  const negative = input.target.groundingEvidence.find((evidence): evidence is
    Extract<typeof evidence, { kind: 'negative_points' }> =>
    evidence.kind === 'negative_points' &&
    evidence.frameIndex >= input.chunkRange.startFrameInclusive &&
    evidence.frameIndex < input.chunkRange.endFrameExclusive)
  if (negative) {
    for (const objectId of input.objectIds) actions.push({
      action: 'add_prompt',
      sequence: actions.length + 1,
      conceptStageId,
      prompt: {
        promptKind: 'negative_points',
        conceptStageId,
        objectId,
        frameIndex: negative.frameIndex,
        points: negative.points,
        rawUserChatIncluded: false,
      },
      refinementOrdinal: 1,
    })
    actions.push({
      action: 'propagate',
      sequence: actions.length + 1,
      conceptStageId,
      direction: input.propagationDirection === 'both'
        ? 'bidirectional'
        : input.propagationDirection,
      range: input.chunkRange,
      objectIds: input.objectIds,
    })
  }
  return actions as z.input<
    typeof trackAllSam31MaskletSessionPlanSchema
  >['actions']
}

function authorityRef(id: string, hash: string) {
  return authorityRefSchema.parse({ id, version: 1, contentHash: `sha256:${hash}` })
}

function exactRef(references: readonly EditSkillArtifactReference[], artifactType: string) {
  const matches = references.filter((reference) =>
    reference.artifactType === artifactType)
  if (matches.length !== 1) throw new Error(`Track All requires one exact ${artifactType} reference.`)
  return matches[0]!
}

function artifactScope(execution: TrackAllCanonicalPrivateExecutionPackage) {
  return {
    ownerUserId: execution.assignment.ownerUserId,
    workspaceId: execution.assignment.workspaceId,
    projectId: execution.assignment.projectId,
  }
}
