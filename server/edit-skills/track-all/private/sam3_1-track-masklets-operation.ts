import { z } from 'zod'

import { CANONICAL_SAM3_1_OPERATION_ID } from '../../../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  editSkillArtifactReferenceSchema,
  skillFrameRangeSchema,
} from '../../core/skill-assignment-schema'
import {
  deepFreezeSkillValue,
  hashSkillValue,
  skillManifestReference,
} from '../../core/skill-capability-manifest-hash'
import {
  skillManifestReferenceSchema,
  skillSha256Schema,
} from '../../core/skill-capability-manifest-schema'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  TRACK_ALL_SAM_OPERATION_V2,
} from '../track-all-capability-manifest'

export const TRACK_ALL_SAM31_MASKLET_SESSION_PLAN_VERSION =
  'track_all_sam3_1_masklet_session_plan_v2' as const
export const TRACK_ALL_SAM31_MASKLET_ATTEMPT_EVIDENCE_VERSION =
  'track_all_sam3_1_masklet_attempt_evidence_v2' as const
export const TRACK_ALL_SAM31_V2_MAXIMUM_FRAMES_PER_SESSION = 240
export const TRACK_ALL_SAM31_V2_MAXIMUM_OBJECTS_PER_BUCKET = 16
export const TRACK_ALL_SAM31_V2_MAXIMUM_BUCKETS_PER_SESSION = 1

const safeId = z.string().trim().min(1).max(180)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const unit = z.number().min(0).max(1)
const normalizedPoint = z.object({ x: unit, y: unit }).strict()
const normalizedBox = z.object({
  x: unit,
  y: unit,
  width: z.number().gt(0).max(1),
  height: z.number().gt(0).max(1),
}).strict().superRefine((value, context) => {
  if (value.x + value.width > 1 || value.y + value.height > 1) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 prompt box exceeds normalized source geometry.',
    })
  }
})

const authorityRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

const compiledConcept = z.string().trim().min(1).max(300)
  .refine((value) => [...value].every((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint > 31 && codePoint !== 127
  }), {
    message: 'Compiled SAM concepts cannot contain control characters.',
  })
  .refine((value) => !/(?:[a-z]+:\/\/|file:|\.\.|\$\(|`|&&|\|\||;)/iu.test(value), {
    message: 'Compiled SAM concepts cannot contain paths, URLs, or executable syntax.',
  })

const objectId = z.string().regex(/^object_[0-9]{3}$/u)
const conceptStageId = z.string().regex(/^concept_[0-9]{3}$/u)

const textPromptSchema = z.object({
  promptKind: z.literal('text_concept'),
  conceptStageId,
  objectId,
  frameIndex: z.number().int().nonnegative(),
  compiledConcept,
  compiledPromptHash: skillSha256Schema,
  rawUserChatIncluded: z.literal(false),
}).strict().superRefine((value, context) => {
  if (value.compiledPromptHash !== hashSkillValue({
    conceptStageId: value.conceptStageId,
    objectId: value.objectId,
    frameIndex: value.frameIndex,
    compiledConcept: value.compiledConcept,
  })) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 compiled concept hash is stale or forged.',
  })
})

const pointPromptBase = z.object({
  conceptStageId,
  objectId,
  frameIndex: z.number().int().nonnegative(),
  points: z.array(normalizedPoint).min(1).max(32),
  rawUserChatIncluded: z.literal(false),
}).strict()

const promptSchema = z.union([
  textPromptSchema,
  pointPromptBase.extend({ promptKind: z.literal('positive_points') }).strict(),
  pointPromptBase.extend({ promptKind: z.literal('negative_points') }).strict(),
  z.object({
    promptKind: z.literal('bounding_box'),
    conceptStageId,
    objectId,
    frameIndex: z.number().int().nonnegative(),
    box: normalizedBox,
    rawUserChatIncluded: z.literal(false),
  }).strict(),
])

const sessionActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('start_session'),
    sequence: z.literal(1),
    conceptStageId,
  }).strict(),
  z.object({
    action: z.literal('add_prompt'),
    sequence: z.number().int().min(2).max(1_000),
    conceptStageId,
    prompt: promptSchema,
    refinementOrdinal: z.number().int().min(0).max(1),
  }).strict(),
  z.object({
    action: z.literal('propagate'),
    sequence: z.number().int().min(2).max(1_000),
    conceptStageId,
    direction: z.enum(['forward', 'backward', 'bidirectional']),
    range: skillFrameRangeSchema,
    objectIds: z.array(objectId).min(1).max(
      TRACK_ALL_SAM31_V2_MAXIMUM_OBJECTS_PER_BUCKET,
    ),
  }).strict(),
  z.object({
    action: z.literal('remove_object'),
    sequence: z.number().int().min(2).max(1_000),
    conceptStageId,
    objectId,
  }).strict(),
  z.object({
    action: z.literal('reset_session'),
    sequence: z.number().int().min(2).max(1_000),
    previousConceptStageId: conceptStageId,
    nextConceptStageId: conceptStageId,
  }).strict(),
  z.object({
    action: z.literal('cancel_session'),
    sequence: z.number().int().min(2).max(1_000),
    reasonCode: z.enum([
      'approval_revoked',
      'lease_expired',
      'time_ceiling_reached',
      'user_cancelled',
      'worker_shutdown',
    ]),
  }).strict(),
])

const terminalClosePolicySchema = z.object({
  closeOperation: z.literal('close_session'),
  closeInFinally: z.literal(true),
  mandatoryAfter: z.tuple([
    z.literal('completed'),
    z.literal('failed'),
    z.literal('cancelled'),
    z.literal('timed_out'),
    z.literal('reconciliation_required'),
    z.literal('partial_output'),
  ]),
  resetRequiredBeforeDifferentConcept: z.literal(true),
  oneWriterPerSession: z.literal(true),
  releaseGpuMemoryOnClose: z.literal(true),
}).strict()

const sessionPlanCoreSchema = z.object({
  schemaVersion: z.literal(TRACK_ALL_SAM31_MASKLET_SESSION_PLAN_VERSION),
  operationId: z.literal(TRACK_ALL_SAM_OPERATION_V2),
  historicalOperationPreserved: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  skillManifestRef: skillManifestReferenceSchema,
  sessionId: safeId,
  assignmentId: safeId,
  assignmentHash: skillSha256Schema,
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  planRef: authorityRefSchema,
  approvedSnapshotRef: authorityRefSchema,
  approvedWorkItemRef: authorityRefSchema,
  executionAttemptRef: authorityRefSchema,
  workerLeaseRef: authorityRefSchema,
  fundedReservationRef: authorityRefSchema,
  source: z.object({
    artifactRef: editSkillArtifactReferenceSchema,
    sourceChecksum: skillSha256Schema,
    authorizedRange: skillFrameRangeSchema,
    chunkRange: skillFrameRangeSchema,
    decodedFrameCount: z.number().int().positive().max(
      TRACK_ALL_SAM31_V2_MAXIMUM_FRAMES_PER_SESSION,
    ),
    sourceResolutionPreserved: z.literal(true),
    sourceRangePreserved: z.literal(true),
    variableFrameRateAllowed: z.literal(false),
    callerPathOrUrlAccepted: z.literal(false),
  }).strict(),
  targetGroup: z.object({
    targetSpecificationRef: authorityRefSchema,
    targetGroupId: safeId,
    initializationFrameIndex: z.number().int().nonnegative(),
    objectIds: z.array(objectId).min(1).max(
      TRACK_ALL_SAM31_V2_MAXIMUM_OBJECTS_PER_BUCKET,
    ),
    expectedObjectCount: z.number().int().min(1).max(
      TRACK_ALL_SAM31_V2_MAXIMUM_OBJECTS_PER_BUCKET,
    ),
    anonymousIdentityOnly: z.literal(true),
    realWorldIdentityRecognitionAllowed: z.literal(false),
  }).strict(),
  objectBudget: z.object({
    objectCount: z.number().int().min(1).max(
      TRACK_ALL_SAM31_V2_MAXIMUM_OBJECTS_PER_BUCKET,
    ),
    multiplexBucketSize: z.literal(
      TRACK_ALL_SAM31_V2_MAXIMUM_OBJECTS_PER_BUCKET,
    ),
    bucketCount: z.literal(TRACK_ALL_SAM31_V2_MAXIMUM_BUCKETS_PER_SESSION),
    maximumFrames: z.literal(
      TRACK_ALL_SAM31_V2_MAXIMUM_FRAMES_PER_SESSION,
    ),
  }).strict(),
  actions: z.array(sessionActionSchema).min(3).max(1_000),
  terminalClosePolicy: terminalClosePolicySchema,
  routeAuthority: z.object({
    exactSourceRevision: z.literal(
      '96914d2425f90a64f45ca977c2b5165418099543',
    ),
    exactCheckpointRevision: z.literal(
      'daa63191845a41281374e725f4c9e51c7a824460',
    ),
    exactSourceCheckpointCompatibilityRequired: z.literal(true),
    strictCheckpointLoadRequired: z.literal(true),
    runtimeDownloadAllowed: z.literal(false),
    privateOutputRequired: z.literal(true),
    modelSelectionIncluded: z.literal(false),
    acceleratorSelectionIncluded: z.literal(false),
    executableSelectionIncluded: z.literal(false),
    pathOrUrlSelectionIncluded: z.literal(false),
    maskPromptingQualified: z.literal(false),
  }).strict(),
  attemptPolicy: z.object({
    modelSubmissionOrdinal: z.literal(1),
    automaticRetryCount: z.literal(0),
    approvedPromptRefinementCeiling: z.literal(1),
    automaticAlternateModelFallbackCount: z.literal(0),
    unknownOutcomeResubmissionAllowed: z.literal(false),
    reconcileExactAttemptBeforeNewSubmission: z.literal(true),
  }).strict(),
  costAuthority: z.object({
    approvedEstimateRef: authorityRefSchema,
    accountEffectiveRateAuthorityRef: authorityRefSchema,
    maximumCredits: z.number().int().positive().max(100_000),
    callerSelectedPriceAccepted: z.literal(false),
    customerMarkupIncludedInInternalCost: z.literal(false),
  }).strict(),
  callerSelectedModelModuleClassCheckpointCommandGpuEndpointPathUrlRetryFallbackOrPriceAccepted:
    z.literal(false),
  rawUserChatIncluded: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  validateSessionPlan(value, context)
})

export const trackAllSam31MaskletSessionPlanSchema =
  sessionPlanCoreSchema.extend({ sessionPlanHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { sessionPlanHash, ...core } = value
      if (sessionPlanHash !== hashSkillValue(core)) context.addIssue({
        code: 'custom',
        message: 'Track All SAM 3.1 session plan hash is stale or forged.',
      })
    })

export type TrackAllSam31MaskletSessionPlan = z.infer<
  typeof trackAllSam31MaskletSessionPlanSchema
>

export function createTrackAllSam31MaskletSessionPlan(
  input: z.input<typeof sessionPlanCoreSchema>,
): TrackAllSam31MaskletSessionPlan {
  const core = sessionPlanCoreSchema.parse(input)
  return deepFreezeSkillValue(trackAllSam31MaskletSessionPlanSchema.parse({
    ...core,
    sessionPlanHash: hashSkillValue(core),
  }))
}

export function assertTrackAllSam31MaskletSessionPlan(
  value: unknown,
): TrackAllSam31MaskletSessionPlan {
  return structuredClone(trackAllSam31MaskletSessionPlanSchema.parse(value))
}

const closeEvidenceSchema = z.object({
  closeOperation: z.literal('close_session'),
  closeAttempted: z.literal(true),
  closeCompleted: z.literal(true),
  closeObservedAt: timestamp,
  terminalObservedAt: timestamp,
  sessionId: safeId,
  assignmentHash: skillSha256Schema,
  sessionPlanHash: skillSha256Schema,
  gpuMemoryReleaseRequested: z.literal(true),
  closeEvidenceHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { closeEvidenceHash, ...core } = value
  if (closeEvidenceHash !== hashSkillValue(core)) context.addIssue({
    code: 'custom', message: 'SAM 3.1 close evidence is stale or forged.',
  })
  if (Date.parse(value.closeObservedAt) < Date.parse(value.terminalObservedAt)) {
    context.addIssue({
      code: 'custom', message: 'SAM 3.1 close predates terminal observation.',
    })
  }
})

const attemptEvidenceCoreSchema = z.object({
  schemaVersion: z.literal(TRACK_ALL_SAM31_MASKLET_ATTEMPT_EVIDENCE_VERSION),
  operationId: z.literal(TRACK_ALL_SAM_OPERATION_V2),
  sessionPlanHash: skillSha256Schema,
  assignmentHash: skillSha256Schema,
  executionAttemptRef: authorityRefSchema,
  evidenceClass: z.enum([
    'real_private_sam3_1_inference',
    'injected_masklets_test_only',
    'not_executed',
  ]),
  terminalDisposition: z.enum([
    'completed',
    'failed',
    'cancelled',
    'timed_out',
    'reconciliation_required',
    'partial_output',
  ]),
  exactAttemptReconciled: z.boolean(),
  sourceCheckpointStrictLoadObserved: z.boolean(),
  cudaInferenceObserved: z.boolean(),
  outputMaskletManifestRef: editSkillArtifactReferenceSchema.nullable(),
  closeEvidence: closeEvidenceSchema,
  providerRequestCount: z.number().int().nonnegative().max(1),
  publicArtifactCount: z.literal(0),
  productionMutationCount: z.literal(0),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict().superRefine((value, context) => {
  const completed = value.terminalDisposition === 'completed'
  const real = value.evidenceClass === 'real_private_sam3_1_inference'
  if (value.closeEvidence.sessionPlanHash !== value.sessionPlanHash ||
    value.closeEvidence.assignmentHash !== value.assignmentHash) {
    context.addIssue({
      code: 'custom', message: 'SAM 3.1 close evidence lost plan lineage.',
    })
  }
  if (completed !== (value.outputMaskletManifestRef !== null)) context.addIssue({
    code: 'custom',
    message: 'Only completed SAM 3.1 attempts may carry exact masklet output.',
  })
  if (real !== (value.sourceCheckpointStrictLoadObserved &&
    value.cudaInferenceObserved && value.providerRequestCount === 1)) {
    context.addIssue({
      code: 'custom',
      message: 'Real SAM 3.1 evidence requires strict load, CUDA inference, and one request.',
    })
  }
  if (!real && value.providerRequestCount !== 0) context.addIssue({
    code: 'custom',
    message: 'Injected or unexecuted evidence cannot claim a SAM request.',
  })
  if (value.terminalDisposition === 'reconciliation_required' &&
    value.exactAttemptReconciled) context.addIssue({
      code: 'custom',
      message: 'An unresolved SAM 3.1 outcome cannot claim reconciliation.',
    })
})

export const trackAllSam31MaskletAttemptEvidenceSchema =
  attemptEvidenceCoreSchema.extend({ evidenceHash: skillSha256Schema })
    .strict().superRefine((value, context) => {
      const { evidenceHash, ...core } = value
      if (evidenceHash !== hashSkillValue(core)) context.addIssue({
        code: 'custom', message: 'SAM 3.1 attempt evidence hash is stale or forged.',
      })
    })

export function createTrackAllSam31MaskletAttemptEvidence(
  input: z.input<typeof attemptEvidenceCoreSchema>,
) {
  const core = attemptEvidenceCoreSchema.parse(input)
  return deepFreezeSkillValue(trackAllSam31MaskletAttemptEvidenceSchema.parse({
    ...core,
    evidenceHash: hashSkillValue(core),
  }))
}

export function assertTrackAllSam31MaskletAttemptEvidence(input: {
  plan: unknown
  evidence: unknown
  requiredEvidenceClass?:
    | 'real_private_sam3_1_inference'
    | 'injected_masklets_test_only'
}): z.infer<typeof trackAllSam31MaskletAttemptEvidenceSchema> {
  const plan = assertTrackAllSam31MaskletSessionPlan(input.plan)
  const evidence = trackAllSam31MaskletAttemptEvidenceSchema.parse(
    input.evidence,
  )
  const output = evidence.outputMaskletManifestRef
  if (
    evidence.sessionPlanHash !== plan.sessionPlanHash ||
    evidence.assignmentHash !== plan.assignmentHash ||
    evidence.closeEvidence.sessionId !== plan.sessionId ||
    hashSkillValue(evidence.executionAttemptRef) !==
      hashSkillValue(plan.executionAttemptRef) ||
    (output !== null && (
      output.ownerUserId !== plan.ownerUserId ||
      output.workspaceId !== plan.workspaceId ||
      output.projectId !== plan.projectId ||
      output.artifactType !== 'track_mask_chunk_manifest_v1'
    )) ||
    (input.requiredEvidenceClass !== undefined &&
      evidence.evidenceClass !== input.requiredEvidenceClass)
  ) throw new Error(
    'SAM 3.1 attempt evidence differs from the exact session authority.',
  )
  return structuredClone(evidence)
}

const operationDescriptor = {
  schemaVersion: 'track_all_sam3_1_operation_authority_v2',
  operationId: TRACK_ALL_SAM_OPERATION_V2,
  historicalOperationId: CANONICAL_SAM3_1_OPERATION_ID,
  skillManifestRef: skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST),
  officialSourceRevision: '96914d2425f90a64f45ca977c2b5165418099543',
  officialCheckpointRevision: 'daa63191845a41281374e725f4c9e51c7a824460',
  supportedPromptKinds: [
    'text_concept', 'positive_points', 'negative_points', 'bounding_box',
  ],
  maskPromptingQualified: false,
  nonZeroInitializationFrameSupported: true,
  propagationDirections: ['forward', 'backward', 'bidirectional'],
  objectRemovalResetCancellationAndMandatoryCloseSupported: true,
  maximumFramesPerSession: TRACK_ALL_SAM31_V2_MAXIMUM_FRAMES_PER_SESSION,
  maximumObjectsPerBucket: TRACK_ALL_SAM31_V2_MAXIMUM_OBJECTS_PER_BUCKET,
  maximumBucketsPerSession: TRACK_ALL_SAM31_V2_MAXIMUM_BUCKETS_PER_SESSION,
  createOnlyPrivateOutputRequired: true,
  routeQualificationStatus: 'blocked',
  externalBlocker:
    'authorized checkpoint, strict-load compatibility, immutable image, and real A100/L4 evidence are absent',
} as const

export const TRACK_ALL_SAM31_MASKLET_OPERATION_AUTHORITY = deepFreezeSkillValue({
  ...operationDescriptor,
  authorityHash: hashSkillValue(operationDescriptor),
})

function validateSessionPlan(
  value: z.infer<typeof sessionPlanCoreSchema>,
  context: z.RefinementCtx,
): void {
  const exactManifest = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
  if (hashSkillValue(value.skillManifestRef) !== hashSkillValue(exactManifest)) {
    context.addIssue({
      code: 'custom', message: 'SAM 3.1 session plan manifest is stale.',
    })
  }
  const { authorizedRange, chunkRange } = value.source
  const frameCount = chunkRange.endFrameExclusive - chunkRange.startFrameInclusive
  const rangeContained = chunkRange.fps === authorizedRange.fps &&
    chunkRange.startFrameInclusive >= authorizedRange.startFrameInclusive &&
    chunkRange.endFrameExclusive <= authorizedRange.endFrameExclusive
  if (!rangeContained || frameCount !== value.source.decodedFrameCount ||
    frameCount > TRACK_ALL_SAM31_V2_MAXIMUM_FRAMES_PER_SESSION) {
    context.addIssue({
      code: 'custom', message: 'SAM 3.1 chunk lost bounded range authority.',
    })
  }
  if (value.source.artifactRef.artifactType !== 'source_media_artifact_v1' ||
    value.source.artifactRef.sha256 !== value.source.sourceChecksum ||
    value.source.artifactRef.ownerUserId !== value.ownerUserId ||
    value.source.artifactRef.workspaceId !== value.workspaceId ||
    value.source.artifactRef.projectId !== value.projectId) {
    context.addIssue({
      code: 'custom', message: 'SAM 3.1 source is not exact, private, and tenant-bound.',
    })
  }
  const objectIds = value.targetGroup.objectIds
  if (new Set(objectIds).size !== objectIds.length ||
    objectIds.length !== value.targetGroup.expectedObjectCount ||
    objectIds.length !== value.objectBudget.objectCount) {
    context.addIssue({
      code: 'custom', message: 'SAM 3.1 object budget differs from exact target objects.',
    })
  }
  if (value.targetGroup.initializationFrameIndex < chunkRange.startFrameInclusive ||
    value.targetGroup.initializationFrameIndex >= chunkRange.endFrameExclusive) {
    context.addIssue({
      code: 'custom', message: 'SAM 3.1 initialization frame is outside its chunk.',
    })
  }
  const sequences = value.actions.map((action) => action.sequence)
  if (sequences.some((sequence, index) => sequence !== index + 1) ||
    value.actions[0]?.action !== 'start_session') {
    context.addIssue({
      code: 'custom', message: 'SAM 3.1 session actions must start once and be contiguous.',
    })
  }
  let activeConcept = value.actions[0]?.action === 'start_session'
    ? value.actions[0].conceptStageId
    : undefined
  let promptSeenForActiveConcept = false
  let propagationSeen = false
  let cancelled = false
  const refinements = new Map<string, Set<number>>()
  for (const action of value.actions.slice(1)) {
    if (cancelled) context.addIssue({
      code: 'custom', message: 'SAM 3.1 actions cannot continue after cancellation.',
    })
    if (action.action === 'reset_session') {
      if (action.previousConceptStageId !== activeConcept ||
        action.nextConceptStageId === activeConcept) context.addIssue({
        code: 'custom', message: 'SAM 3.1 concept changes require an exact reset transition.',
      })
      activeConcept = action.nextConceptStageId
      promptSeenForActiveConcept = false
      propagationSeen = false
      continue
    }
    if (action.action === 'cancel_session') {
      cancelled = true
      continue
    }
    if (action.conceptStageId !== activeConcept) context.addIssue({
      code: 'custom', message: 'SAM 3.1 concept mutated without an explicit reset.',
    })
    if (action.action === 'add_prompt') {
      if (action.prompt.conceptStageId !== action.conceptStageId ||
        !objectIds.includes(action.prompt.objectId) ||
        action.prompt.frameIndex < chunkRange.startFrameInclusive ||
        action.prompt.frameIndex >= chunkRange.endFrameExclusive) context.addIssue({
        code: 'custom', message: 'SAM 3.1 prompt lost exact target or frame authority.',
      })
      const observed = refinements.get(action.conceptStageId) ?? new Set<number>()
      observed.add(action.refinementOrdinal)
      refinements.set(action.conceptStageId, observed)
      if (action.refinementOrdinal === 1 && !propagationSeen) context.addIssue({
        code: 'custom', message: 'SAM 3.1 refinement requires prior propagation evidence.',
      })
      promptSeenForActiveConcept = true
    }
    if (action.action === 'propagate') {
      const exactRange = action.range.startFrameInclusive === chunkRange.startFrameInclusive &&
        action.range.endFrameExclusive === chunkRange.endFrameExclusive &&
        action.range.fps === chunkRange.fps
      if (!promptSeenForActiveConcept || !exactRange ||
        action.objectIds.some((id) => !objectIds.includes(id))) context.addIssue({
        code: 'custom', message: 'SAM 3.1 propagation lacks prompt, range, or object authority.',
      })
      propagationSeen = true
    }
    if (action.action === 'remove_object' && !objectIds.includes(action.objectId)) {
      context.addIssue({
        code: 'custom', message: 'SAM 3.1 cannot remove an unapproved object ID.',
      })
    }
  }
  for (const observed of refinements.values()) {
    if (!observed.has(0) || observed.size > 2 ||
      [...observed].some((ordinal) => ordinal > 1)) context.addIssue({
      code: 'custom', message: 'SAM 3.1 prompt refinement ceiling was exceeded.',
    })
  }
  if (!propagationSeen && !cancelled) context.addIssue({
    code: 'custom', message: 'SAM 3.1 non-cancelled session must propagate.',
  })
}
