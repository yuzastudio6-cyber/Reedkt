import assert from 'node:assert/strict'

import {
  assertTrackAllSam31MaskletAttemptEvidence,
  createTrackAllSam31MaskletAttemptEvidence,
  createTrackAllSam31MaskletSessionPlan,
  TRACK_ALL_SAM31_MASKLET_ATTEMPT_EVIDENCE_VERSION,
  TRACK_ALL_SAM31_MASKLET_OPERATION_AUTHORITY,
  TRACK_ALL_SAM31_MASKLET_SESSION_PLAN_VERSION,
  TRACK_ALL_SAM31_V2_MAXIMUM_FRAMES_PER_SESSION,
  trackAllSam31MaskletAttemptEvidenceSchema,
  trackAllSam31MaskletSessionPlanSchema,
} from '../edit-skills/track-all/private/sam3_1-track-masklets-operation'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  TRACK_ALL_SAM_OPERATION_V2,
} from '../edit-skills/track-all/track-all-capability-manifest'
import {
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
  createCanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'

const hash = (seed: string) => hashSkillValue({ seed })
const ref = (id: string) => ({
  id,
  version: 1,
  contentHash: `sha256:${hash(id)}`,
})
const artifact = (artifactType: string, seed: string) => ({
  artifactType,
  sha256: hash(seed),
  byteLength: 1_024,
  ownerUserId: 'user-1',
  workspaceId: 'workspace-1',
  projectId: 'project-1',
})
const compiledPromptHash = (input: {
  conceptStageId: string
  objectId: string
  frameIndex: number
  compiledConcept: string
}) => hashSkillValue(input)

type Mutable<T> = {
  -readonly [Key in keyof T]: T[Key] extends object
    ? Mutable<T[Key]>
    : T[Key]
}

function validSessionInput() {
  const text = {
    conceptStageId: 'concept_001',
    objectId: 'object_001',
    frameIndex: 125,
    compiledConcept: 'license plate on the selected vehicle',
  }
  return {
    schemaVersion: TRACK_ALL_SAM31_MASKLET_SESSION_PLAN_VERSION,
    operationId: TRACK_ALL_SAM_OPERATION_V2,
    historicalOperationPreserved: CANONICAL_SAM3_1_OPERATION_ID,
    skillManifestRef: skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST),
    sessionId: 'sam31-session-1',
    assignmentId: 'assignment-1',
    assignmentHash: hash('assignment'),
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    planRef: ref('track-all-plan-1'),
    approvedSnapshotRef: ref('approved-snapshot-1'),
    approvedWorkItemRef: ref('work-item-1'),
    executionAttemptRef: ref('attempt-1'),
    workerLeaseRef: ref('lease-1'),
    fundedReservationRef: ref('reservation-1'),
    source: {
      artifactRef: artifact('source_media_artifact_v1', 'source'),
      sourceChecksum: hash('source'),
      authorizedRange: {
        startFrameInclusive: 100,
        endFrameExclusive: 500,
        fps: 30,
      },
      chunkRange: {
        startFrameInclusive: 120,
        endFrameExclusive: 240,
        fps: 30,
      },
      decodedFrameCount: 120,
      sourceResolutionPreserved: true as const,
      sourceRangePreserved: true as const,
      variableFrameRateAllowed: false as const,
      callerPathOrUrlAccepted: false as const,
    },
    targetGroup: {
      targetSpecificationRef: ref('target-spec-1'),
      targetGroupId: 'target-group-1',
      initializationFrameIndex: 125,
      objectIds: ['object_001', 'object_002'],
      expectedObjectCount: 2,
      anonymousIdentityOnly: true as const,
      realWorldIdentityRecognitionAllowed: false as const,
    },
    objectBudget: {
      objectCount: 2,
      multiplexBucketSize: 16 as const,
      bucketCount: 1 as const,
      maximumFrames: 240 as const,
    },
    actions: [
      {
        action: 'start_session' as const,
        sequence: 1 as const,
        conceptStageId: 'concept_001',
      },
      {
        action: 'add_prompt' as const,
        sequence: 2,
        conceptStageId: 'concept_001',
        prompt: {
          promptKind: 'text_concept' as const,
          ...text,
          compiledPromptHash: compiledPromptHash(text),
          rawUserChatIncluded: false as const,
        },
        refinementOrdinal: 0 as const,
      },
      {
        action: 'add_prompt' as const,
        sequence: 3,
        conceptStageId: 'concept_001',
        prompt: {
          promptKind: 'positive_points' as const,
          conceptStageId: 'concept_001',
          objectId: 'object_002',
          frameIndex: 125,
          points: [{ x: 0.4, y: 0.5 }],
          rawUserChatIncluded: false as const,
        },
        refinementOrdinal: 0 as const,
      },
      {
        action: 'add_prompt' as const,
        sequence: 4,
        conceptStageId: 'concept_001',
        prompt: {
          promptKind: 'bounding_box' as const,
          conceptStageId: 'concept_001',
          objectId: 'object_002',
          frameIndex: 125,
          box: { x: 0.3, y: 0.4, width: 0.2, height: 0.2 },
          rawUserChatIncluded: false as const,
        },
        refinementOrdinal: 0 as const,
      },
      {
        action: 'propagate' as const,
        sequence: 5,
        conceptStageId: 'concept_001',
        direction: 'bidirectional' as const,
        range: {
          startFrameInclusive: 120,
          endFrameExclusive: 240,
          fps: 30,
        },
        objectIds: ['object_001', 'object_002'],
      },
      {
        action: 'add_prompt' as const,
        sequence: 6,
        conceptStageId: 'concept_001',
        prompt: {
          promptKind: 'negative_points' as const,
          conceptStageId: 'concept_001',
          objectId: 'object_001',
          frameIndex: 180,
          points: [{ x: 0.7, y: 0.7 }],
          rawUserChatIncluded: false as const,
        },
        refinementOrdinal: 1 as const,
      },
      {
        action: 'propagate' as const,
        sequence: 7,
        conceptStageId: 'concept_001',
        direction: 'bidirectional' as const,
        range: {
          startFrameInclusive: 120,
          endFrameExclusive: 240,
          fps: 30,
        },
        objectIds: ['object_001', 'object_002'],
      },
      {
        action: 'remove_object' as const,
        sequence: 8,
        conceptStageId: 'concept_001',
        objectId: 'object_002',
      },
    ],
    terminalClosePolicy: {
      closeOperation: 'close_session' as const,
      closeInFinally: true as const,
      mandatoryAfter: [
        'completed',
        'failed',
        'cancelled',
        'timed_out',
        'reconciliation_required',
        'partial_output',
      ] as [
        'completed',
        'failed',
        'cancelled',
        'timed_out',
        'reconciliation_required',
        'partial_output',
      ],
      resetRequiredBeforeDifferentConcept: true as const,
      oneWriterPerSession: true as const,
      releaseGpuMemoryOnClose: true as const,
    },
    routeAuthority: {
      exactSourceRevision: '96914d2425f90a64f45ca977c2b5165418099543' as const,
      exactCheckpointRevision: 'daa63191845a41281374e725f4c9e51c7a824460' as const,
      exactSourceCheckpointCompatibilityRequired: true as const,
      strictCheckpointLoadRequired: true as const,
      runtimeDownloadAllowed: false as const,
      privateOutputRequired: true as const,
      modelSelectionIncluded: false as const,
      acceleratorSelectionIncluded: false as const,
      executableSelectionIncluded: false as const,
      pathOrUrlSelectionIncluded: false as const,
      maskPromptingQualified: false as const,
    },
    attemptPolicy: {
      modelSubmissionOrdinal: 1 as const,
      automaticRetryCount: 0 as const,
      approvedPromptRefinementCeiling: 1 as const,
      automaticAlternateModelFallbackCount: 0 as const,
      unknownOutcomeResubmissionAllowed: false as const,
      reconcileExactAttemptBeforeNewSubmission: true as const,
    },
    costAuthority: {
      approvedEstimateRef: ref('estimate-1'),
      accountEffectiveRateAuthorityRef: ref('rate-authority-1'),
      maximumCredits: 50,
      callerSelectedPriceAccepted: false as const,
      customerMarkupIncludedInInternalCost: false as const,
    },
    callerSelectedModelModuleClassCheckpointCommandGpuEndpointPathUrlRetryFallbackOrPriceAccepted:
      false as const,
    rawUserChatIncluded: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  }
}

const plan = createTrackAllSam31MaskletSessionPlan(validSessionInput())
assert.equal(trackAllSam31MaskletSessionPlanSchema.parse(plan).sessionPlanHash,
  plan.sessionPlanHash)
assert.equal(plan.targetGroup.initializationFrameIndex, 125)
assert.equal(plan.actions.some((action) =>
  action.action === 'propagate' && action.direction === 'bidirectional'), true)
assert.equal(plan.actions.some((action) =>
  action.action === 'remove_object'), true)
assert.equal(plan.terminalClosePolicy.closeInFinally, true)
assert.equal(TRACK_ALL_SAM31_MASKLET_OPERATION_AUTHORITY.routeQualificationStatus,
  'blocked')
assert.equal(TRACK_ALL_SAM31_MASKLET_OPERATION_AUTHORITY.maskPromptingQualified,
  false)
assert.equal(Object.isFrozen(TRACK_ALL_SAM31_MASKLET_OPERATION_AUTHORITY), true)
assert.equal(Object.isFrozen(
  TRACK_ALL_SAM31_MASKLET_OPERATION_AUTHORITY.supportedPromptKinds,
), true)

const resetInput = structuredClone(validSessionInput())
const secondText = {
  conceptStageId: 'concept_002',
  objectId: 'object_001',
  frameIndex: 150,
  compiledConcept: 'selected vehicle body',
}
resetInput.actions = [
  resetInput.actions[0]!,
  resetInput.actions[1]!,
  { ...resetInput.actions[4]!, sequence: 3 },
  {
    action: 'reset_session', sequence: 4,
    previousConceptStageId: 'concept_001',
    nextConceptStageId: 'concept_002',
  },
  {
    action: 'add_prompt', sequence: 5, conceptStageId: 'concept_002',
    prompt: {
      promptKind: 'text_concept', ...secondText,
      compiledPromptHash: compiledPromptHash(secondText),
      rawUserChatIncluded: false,
    },
    refinementOrdinal: 0,
  },
  {
    action: 'propagate', sequence: 6, conceptStageId: 'concept_002',
    direction: 'backward',
    range: resetInput.source.chunkRange,
    objectIds: ['object_001'],
  },
] as typeof resetInput.actions
const resetPlan = createTrackAllSam31MaskletSessionPlan(resetInput)
assert.equal(resetPlan.actions.some((action) =>
  action.action === 'reset_session'), true)

const cancellationInput = structuredClone(validSessionInput())
cancellationInput.actions = [
  cancellationInput.actions[0]!,
  cancellationInput.actions[1]!,
  {
    action: 'cancel_session', sequence: 3, reasonCode: 'user_cancelled',
  },
] as typeof cancellationInput.actions
const cancellationPlan = createTrackAllSam31MaskletSessionPlan(
  cancellationInput,
)
assert.equal(cancellationPlan.actions.at(-1)?.action, 'cancel_session')

const sourceCandidate = createCanonicalSam31SourceRuntimeCandidate()
assert.equal(CANONICAL_SAM3_1_OPERATION_ID,
  'tool.sam3_1.segment_and_track_subject.v1')
assert.equal(sourceCandidate.operationId, CANONICAL_SAM3_1_OPERATION_ID)
assert.equal(sourceCandidate.officialSource.sourceRevision,
  '96914d2425f90a64f45ca977c2b5165418099543')
assert.equal(sourceCandidate.officialSource.deterministicGitArchiveSha256,
  '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a')
assert.equal(sourceCandidate.officialCheckpoint.repositoryRevision,
  'daa63191845a41281374e725f4c9e51c7a824460')

const mutations: Array<(value: ReturnType<typeof validSessionInput>) => void> = [
  (value) => { Object.assign(value, { model: 'caller-model' }) },
  (value) => { Object.assign(value, { checkpoint: '/tmp/checkpoint.pt' }) },
  (value) => { Object.assign(value, { command: 'python model.py' }) },
  (value) => { Object.assign(value, { gpu: 'caller-gpu' }) },
  (value) => { Object.assign(value, { endpoint: 'https://example.test' }) },
  (value) => { Object.assign(value, { path: '/tmp/source.mp4' }) },
  (value) => { Object.assign(value, { url: 'https://example.test/video' }) },
  (value) => { Object.assign(value, { retryCount: 2 }) },
  (value) => { Object.assign(value, { price: 0 }) },
  (value) => { value.source.decodedFrameCount =
    TRACK_ALL_SAM31_V2_MAXIMUM_FRAMES_PER_SESSION + 1 },
  (value) => { value.targetGroup.initializationFrameIndex = 500 },
  (value) => { value.actions[1]!.conceptStageId = 'concept_002' },
  (value) => {
    const action = value.actions[1]
    if (action?.action !== 'add_prompt' ||
      action.prompt.promptKind !== 'text_concept') throw new Error(
      'Fixture lost its text prompt.',
    )
    action.prompt.compiledConcept = 'file:///tmp/checkpoint.pt'
  },
  (value) => {
    const action = value.actions[1]
    if (action?.action !== 'add_prompt') throw new Error(
      'Fixture lost its prompt action.',
    )
    Object.assign(action.prompt, {
      promptKind: 'mask', maskPath: '/tmp/mask.png',
    })
  },
  (value) => { value.actions[5]!.refinementOrdinal = 2 as never },
  (value) => { value.actions[6]!.sequence = 8 },
  (value) => { value.targetGroup.objectIds = ['object_001', 'object_001'] },
  (value) => { value.source.artifactRef.workspaceId = 'workspace-other' },
  (value) => { value.skillManifestRef.manifestHash = hash('stale-manifest') },
]
for (const [index, mutate] of mutations.entries()) {
  const candidate = structuredClone(validSessionInput())
  mutate(candidate)
  assert.throws(
    () => createTrackAllSam31MaskletSessionPlan(candidate),
    `adversarial mutation ${index} must fail closed`,
  )
}

const closeCore = {
  closeOperation: 'close_session' as const,
  closeAttempted: true as const,
  closeCompleted: true as const,
  closeObservedAt: '2026-08-04T14:00:01.000Z',
  terminalObservedAt: '2026-08-04T14:00:00.000Z',
  sessionId: plan.sessionId,
  assignmentHash: plan.assignmentHash,
  sessionPlanHash: plan.sessionPlanHash,
  gpuMemoryReleaseRequested: true as const,
}
const closeEvidence = {
  ...closeCore,
  closeEvidenceHash: hashSkillValue(closeCore),
}
const injected = createTrackAllSam31MaskletAttemptEvidence({
  schemaVersion: TRACK_ALL_SAM31_MASKLET_ATTEMPT_EVIDENCE_VERSION,
  operationId: TRACK_ALL_SAM_OPERATION_V2,
  sessionPlanHash: plan.sessionPlanHash,
  assignmentHash: plan.assignmentHash,
  executionAttemptRef: plan.executionAttemptRef,
  evidenceClass: 'injected_masklets_test_only',
  terminalDisposition: 'completed',
  exactAttemptReconciled: true,
  sourceCheckpointStrictLoadObserved: false,
  cudaInferenceObserved: false,
  outputMaskletManifestRef: artifact(
    'track_all_sam3_1_masklet_output_manifest_v2', 'masks',
  ),
  closeEvidence,
  providerRequestCount: 0,
  publicArtifactCount: 0,
  productionMutationCount: 0,
  customerCreditsMutated: false,
  qaApproved: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})
assert.equal(trackAllSam31MaskletAttemptEvidenceSchema.parse(injected)
  .evidenceClass, 'injected_masklets_test_only')
assert.equal(assertTrackAllSam31MaskletAttemptEvidence({
  plan,
  evidence: injected,
  requiredEvidenceClass: 'injected_masklets_test_only',
}).evidenceHash, injected.evidenceHash)

for (const terminalDisposition of [
  'failed', 'cancelled', 'timed_out', 'reconciliation_required',
  'partial_output',
] as const) {
  const value = {
    ...injected,
    terminalDisposition,
    exactAttemptReconciled: terminalDisposition !== 'reconciliation_required',
    outputMaskletManifestRef: null,
  }
  const { evidenceHash: _evidenceHash, ...core } = value
  void _evidenceHash
  assert.doesNotThrow(() => trackAllSam31MaskletAttemptEvidenceSchema.parse({
    ...core,
    evidenceHash: hashSkillValue(core),
  }))
}

const forgedReal = structuredClone(injected) as Mutable<typeof injected>
forgedReal.evidenceClass = 'real_private_sam3_1_inference'
const { evidenceHash: _forgedHash, ...forgedCore } = forgedReal
void _forgedHash
forgedReal.evidenceHash = hashSkillValue(forgedCore)
assert.throws(() => trackAllSam31MaskletAttemptEvidenceSchema.parse(forgedReal))

const crossWorkspaceOutput = structuredClone(injected) as Mutable<
  typeof injected
>
crossWorkspaceOutput.outputMaskletManifestRef!.workspaceId = 'workspace-other'
const { evidenceHash: _crossWorkspaceHash, ...crossWorkspaceCore } =
  crossWorkspaceOutput
void _crossWorkspaceHash
crossWorkspaceOutput.evidenceHash = hashSkillValue(crossWorkspaceCore)
assert.throws(() => assertTrackAllSam31MaskletAttemptEvidence({
  plan,
  evidence: crossWorkspaceOutput,
}))

const staleClose = structuredClone(injected) as Mutable<typeof injected>
staleClose.closeEvidence.closeObservedAt = '2026-08-04T13:59:59.000Z'
const { closeEvidenceHash: _closeHash, ...staleCloseCore } = staleClose.closeEvidence
void _closeHash
staleClose.closeEvidence.closeEvidenceHash = hashSkillValue(staleCloseCore)
const { evidenceHash: _staleEvidenceHash, ...staleCore } = staleClose
void _staleEvidenceHash
staleClose.evidenceHash = hashSkillValue(staleCore)
assert.throws(() => trackAllSam31MaskletAttemptEvidenceSchema.parse(staleClose))

console.log(JSON.stringify({
  status: 'ok',
  operationId: TRACK_ALL_SAM31_MASKLET_OPERATION_AUTHORITY.operationId,
  operationAuthorityHash:
    TRACK_ALL_SAM31_MASKLET_OPERATION_AUTHORITY.authorityHash,
  historicalOperationId: CANONICAL_SAM3_1_OPERATION_ID,
  sourceRevision: sourceCandidate.officialSource.sourceRevision,
  checkpointRevision: sourceCandidate.officialCheckpoint.repositoryRevision,
  adversarialCases: mutations.length + 2,
  terminalCloseOutcomes: plan.terminalClosePolicy.mandatoryAfter.length,
  actualSamRequestCount: 0,
  routeQualificationStatus:
    TRACK_ALL_SAM31_MASKLET_OPERATION_AUTHORITY.routeQualificationStatus,
}))
