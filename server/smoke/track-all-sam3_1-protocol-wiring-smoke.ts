import assert from 'node:assert/strict'

import {
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core'
import { projectTrackGraphV1 } from '../edit-skills/shared/track-graph'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  TrackAllSam31ProtocolWiringTestPort,
  assertTrackAllSam31ProtocolEvidenceCannotQualify,
  trackAllCanonicalPrivateExecutionCountsSchema,
  trackAllSam31ProtocolWiringReceiptSchema,
} from '../edit-skills/track-all'
import {
  trackAllSam31PrivateCanaryReceiptSchema,
} from '../edit-skills/track-all/private/sam3_1-private-canary'
import {
  createTrackAllSam31MaskletSessionPlan,
} from '../edit-skills/track-all/private/sam3_1-track-masklets-operation'

const scope = {
  ownerUserId: 'protocol-owner',
  workspaceId: 'protocol-workspace',
  projectId: 'protocol-project',
}
const assignmentHash = hashSkillValue('protocol-assignment')
const planHash = hashSkillValue('protocol-plan')
const sourceSha256 = hashSkillValue('protocol-source')
const range = { startFrameInclusive: 0, endFrameExclusive: 12, fps: 24 }
const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
const artifactRef = (artifactType: string, seed: string) => ({
  artifactType,
  sha256: hashSkillValue(seed),
  byteLength: 64,
  ...scope,
})
const authorityRef = (seed: string) => ({
  id: seed,
  version: 1,
  contentHash: `sha256:${hashSkillValue(seed)}`,
})

const port = new TrackAllSam31ProtocolWiringTestPort()
const summaries = []
for (const scenario of ['selected_instance', 'concept_group'] as const) {
  const targetId = scenario === 'selected_instance'
    ? 'target-selected'
    : 'target-concept'
  const semanticClass = scenario === 'selected_instance' ? 'product' : 'person'
  const chunks = [
    { chunkId: 'chunk-001', start: 0, end: 8 },
    { chunkId: 'chunk-002', start: 4, end: 12 },
  ]
  const sessionPlans = chunks.map((chunk, index) => sessionPlan({
    scenario,
    targetId,
    chunkId: chunk.chunkId,
    start: chunk.start,
    end: chunk.end,
    ordinal: index + 1,
  }))
  const maskRefs = chunks.map((chunk) => artifactRef(
    'track_mask_chunk_manifest_v1',
    `${scenario}:${chunk.chunkId}:private-mask`,
  ))
  const observations = chunks.map((chunk, index) => ({
    observationId: `${scenario}-observation-${index + 1}`,
    chunkId: chunk.chunkId,
    bucketIndex: 0,
    localObjectId: 'object_001',
    targetId,
    semanticClass,
    samples: Array.from({ length: chunk.end - chunk.start }, (_, offset) => ({
      frameIndex: chunk.start + offset,
      box: { x: 0.2 + offset * 0.002, y: 0.2, width: 0.25, height: 0.4 },
      confidence: 0.94,
      visibility: 'active' as const,
    })),
    maskChunkRef: maskRefs[index]!,
    sourceEvidenceHash: hashSkillValue({ scenario, chunk: chunk.chunkId }),
  }))
  const result = port.execute({
    scenario,
    sessionPlans,
    graphInput: {
      ...scope,
      editSessionId: 'protocol-edit-session',
      assignmentId: 'protocol-assignment',
      assignmentHash,
      planHash,
      manifestRef,
      sourceId: 'protocol-source',
      sourceSha256,
      timingHash: hashSkillValue('protocol-timing'),
      authorizedRange: range,
      shots: [{ shotId: 'shot-001', range }],
      chunks: chunks.map((chunk) => ({
        chunkId: chunk.chunkId,
        range: {
          startFrameInclusive: chunk.start,
          endFrameExclusive: chunk.end,
          fps: 24,
        },
        ...(chunk.chunkId === 'chunk-002'
          ? { overlapRange: { startFrameInclusive: 4, endFrameExclusive: 8, fps: 24 } }
          : {}),
        bucketIndex: 0,
      })),
      targets: [{
        targetId,
        targetType: scenario,
        semanticClass,
        includeRules: scenario === 'concept_group' ? ['all people'] : [],
        excludeRules: scenario === 'concept_group' ? ['presenter'] : [],
        privacyClass: 'none',
        groundingEvidenceHashes: [hashSkillValue(`${scenario}:grounding`)],
        expectedMinimumCount: 1,
        expectedMaximumCount: 1,
        ambiguityState: 'none',
        crossShotPolicy: 'terminate',
      }],
      observations,
      objectBudget: {
        expectedObjects: 1,
        maximumObjects: 1,
        bucketSize: 16,
        bucketCount: 1,
        sessionCount: 2,
      },
      cameraNormalizationEvidenceHash: hashSkillValue('protocol-camera'),
      runtimeAttemptRefs: [],
      finalQaRefs: [artifactRef(
        'track_all_temporal_qa_report_v1',
        `${scenario}:protocol-only-qa`,
      )],
      evidenceClass: 'injected_masklets_test_only',
    },
  })
  const receipt = trackAllSam31ProtocolWiringReceiptSchema.parse(result.receipt)
  assert.equal(receipt.sessionPlanHashes.length, 2)
  assert.equal(receipt.actualSamRequestCount, 0)
  assert.equal(receipt.actualGpuExecutionCount, 0)
  assert.equal(receipt.injectedEvidenceUsed, true)
  assert.equal(receipt.strictCheckpointLoadObserved, false)
  assert.equal(receipt.cudaInferenceObserved, false)
  assert.equal(receipt.routePromotionAuthorized, false)
  assert.equal(receipt.qualificationEvidenceEligible, false)
  assert.equal(result.protocolOnlyTrackGraphV2.privateMaskDataPublished, false)
  assert.equal(result.protocolOnlyTrackGraphV2.tracks.length, 1)
  assert.deepEqual(
    projectTrackGraphV1(result.protocolOnlyTrackGraphV2),
    result.protocolOnlyTrackGraphV1,
  )
  assert.throws(() =>
    assertTrackAllSam31ProtocolEvidenceCannotQualify(receipt),
  /cannot qualify real SAM execution/u)
  assert.throws(() => trackAllCanonicalPrivateExecutionCountsSchema.parse({
    providerRequestCount: 0,
    actualSamRequestCount: 2,
    actualGpuExecutionCount: 2,
    samSessionReceiptRefs: [],
    samAttemptEvidenceRefs: [],
    executionEvidenceClass: 'real_sam3_1_private_execution',
  }))
  assert.throws(() => trackAllSam31PrivateCanaryReceiptSchema.parse({
    ...receipt,
    schemaVersion: 'track_all_sam3_1_private_canary_receipt_v1',
  }))
  summaries.push({
    scenario,
    sessionPlanCount: receipt.sessionPlanHashes.length,
    trackGraphV2Hash: receipt.trackGraphV2Hash,
    trackGraphV1Hash: receipt.trackGraphV1Hash,
  })
}

console.log(JSON.stringify({
  status: 'passed',
  evidenceClass: port.evidenceClass,
  scenarios: summaries,
  multiChunkAccountingShapeProved: true,
  receiptProjectionProved: true,
  downstreamTrackGraphV2AndV1ProjectionProved: true,
  actualSamRequestCount: 0,
  actualGpuExecutionCount: 0,
  strictCheckpointLoadObserved: false,
  cudaInferenceObserved: false,
  paidActionOccurred: false,
  routePromotionAuthorized: false,
  qualificationEvidenceEligible: false,
}, null, 2))

function sessionPlan(input: {
  scenario: 'selected_instance' | 'concept_group'
  targetId: string
  chunkId: string
  start: number
  end: number
  ordinal: number
}) {
  const compiledConcept = input.scenario === 'concept_group'
    ? 'all people except presenter'
    : 'approved selected product'
  const promptCore = {
    conceptStageId: 'concept_001',
    objectId: 'object_001',
    frameIndex: input.start,
    compiledConcept,
  }
  return createTrackAllSam31MaskletSessionPlan({
    schemaVersion: 'track_all_sam3_1_masklet_session_plan_v2',
    operationId: 'tool.sam3_1.track_masklets.v2',
    historicalOperationPreserved: 'tool.sam3_1.segment_and_track_subject.v1',
    skillManifestRef: manifestRef,
    sessionId: `${input.scenario}:${input.chunkId}:session`,
    assignmentId: 'protocol-assignment',
    assignmentHash,
    ...scope,
    editSessionId: 'protocol-edit-session',
    planRef: authorityRef('protocol-plan'),
    approvedSnapshotRef: authorityRef('protocol-snapshot'),
    approvedWorkItemRef: authorityRef('protocol-work-item'),
    executionAttemptRef: authorityRef(`${input.scenario}:attempt:${input.ordinal}`),
    workerLeaseRef: authorityRef(`${input.scenario}:lease:${input.ordinal}`),
    fundedReservationRef: authorityRef(`${input.scenario}:reservation:${input.ordinal}`),
    source: {
      artifactRef: artifactRef('source_media_artifact_v1', 'protocol-source'),
      sourceChecksum: sourceSha256,
      authorizedRange: range,
      chunkRange: {
        startFrameInclusive: input.start,
        endFrameExclusive: input.end,
        fps: 24,
      },
      decodedFrameCount: input.end - input.start,
      sourceResolutionPreserved: true,
      sourceRangePreserved: true,
      variableFrameRateAllowed: false,
      callerPathOrUrlAccepted: false,
    },
    targetGroup: {
      targetSpecificationRef: authorityRef(input.targetId),
      targetGroupId: `${input.targetId}:${input.chunkId}`,
      initializationFrameIndex: input.start,
      objectIds: ['object_001'],
      expectedObjectCount: 1,
      anonymousIdentityOnly: true,
      realWorldIdentityRecognitionAllowed: false,
    },
    objectBudget: {
      objectCount: 1,
      multiplexBucketSize: 16,
      bucketCount: 1,
      maximumFrames: 240,
    },
    actions: [
      { action: 'start_session', sequence: 1, conceptStageId: 'concept_001' },
      {
        action: 'add_prompt',
        sequence: 2,
        conceptStageId: 'concept_001',
        prompt: {
          promptKind: 'text_concept',
          ...promptCore,
          compiledPromptHash: hashSkillValue(promptCore),
          rawUserChatIncluded: false,
        },
        refinementOrdinal: 0,
      },
      {
        action: 'propagate',
        sequence: 3,
        conceptStageId: 'concept_001',
        direction: 'bidirectional',
        range: {
          startFrameInclusive: input.start,
          endFrameExclusive: input.end,
          fps: 24,
        },
        objectIds: ['object_001'],
      },
    ],
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
      exactSourceRevision: '96914d2425f90a64f45ca977c2b5165418099543',
      exactCheckpointRevision: 'daa63191845a41281374e725f4c9e51c7a824460',
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
      approvedEstimateRef: authorityRef('protocol-estimate'),
      accountEffectiveRateAuthorityRef: authorityRef('protocol-rate'),
      maximumCredits: 1,
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
}
