import assert from 'node:assert/strict'

import {
  assertTrackAllSam31CanonicalPrivateSessionAvailable,
  InMemoryTrackAllSam31PrivateSessionPersistence,
  TrackAllSam31InjectedSessionOwner,
} from '../edit-skills/track-all/private/sam3_1-injected-session-owner'
import {
  createTrackAllSam31MaskletSessionPlan,
  TRACK_ALL_SAM31_MASKLET_SESSION_PLAN_VERSION,
  trackAllSam31MaskletOutputManifestSchema,
} from '../edit-skills/track-all/private/sam3_1-track-masklets-operation'
import {
  createCurrentTrackAllSam31V2RouteGateReport,
} from '../edit-skills/track-all/private/sam3_1-v2-route-qualification-gate'
import {
  TRACK_ALL_CAPABILITY_MANIFEST,
  TRACK_ALL_SAM_OPERATION_V2,
} from '../edit-skills/track-all/track-all-capability-manifest'
import {
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'
import { CANONICAL_SAM3_1_OPERATION_ID } from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'

const hash = (seed: string) => hashSkillValue({ seed })
const ref = (id: string) => ({
  id,
  version: 1,
  contentHash: `sha256:${hash(id)}`,
})
const sourceArtifact = {
  artifactType: 'source_media_artifact_v1',
  sha256: hash('source'),
  byteLength: 4_096,
  ownerUserId: 'user-1',
  workspaceId: 'workspace-1',
  projectId: 'project-1',
}

function buildPlan(input: {
  sessionId: string
  leaseId: string
  cancellation?: boolean
}) {
  const prompt = {
    conceptStageId: 'concept_001',
    objectId: 'object_001',
    frameIndex: 15,
    compiledConcept: 'selected face',
  }
  const actions = input.cancellation ? [
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
        ...prompt,
        compiledPromptHash: hashSkillValue(prompt),
        rawUserChatIncluded: false as const,
      },
      refinementOrdinal: 0 as const,
    },
    {
      action: 'cancel_session' as const,
      sequence: 3,
      reasonCode: 'user_cancelled' as const,
    },
  ] : [
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
        ...prompt,
        compiledPromptHash: hashSkillValue(prompt),
        rawUserChatIncluded: false as const,
      },
      refinementOrdinal: 0 as const,
    },
    {
      action: 'propagate' as const,
      sequence: 3,
      conceptStageId: 'concept_001',
      direction: 'bidirectional' as const,
      range: { startFrameInclusive: 10, endFrameExclusive: 30, fps: 30 },
      objectIds: ['object_001'],
    },
  ]
  return createTrackAllSam31MaskletSessionPlan({
    schemaVersion: TRACK_ALL_SAM31_MASKLET_SESSION_PLAN_VERSION,
    operationId: TRACK_ALL_SAM_OPERATION_V2,
    historicalOperationPreserved: CANONICAL_SAM3_1_OPERATION_ID,
    skillManifestRef: skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST),
    sessionId: input.sessionId,
    assignmentId: 'assignment-1',
    assignmentHash: hash('assignment'),
    ownerUserId: 'user-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    editSessionId: 'edit-session-1',
    planRef: ref('plan-1'),
    approvedSnapshotRef: ref('snapshot-1'),
    approvedWorkItemRef: ref('work-1'),
    executionAttemptRef: ref(`attempt-${input.sessionId}`),
    workerLeaseRef: ref(input.leaseId),
    fundedReservationRef: ref('reservation-1'),
    source: {
      artifactRef: sourceArtifact,
      sourceChecksum: sourceArtifact.sha256,
      authorizedRange: {
        startFrameInclusive: 0,
        endFrameExclusive: 100,
        fps: 30,
      },
      chunkRange: {
        startFrameInclusive: 10,
        endFrameExclusive: 30,
        fps: 30,
      },
      decodedFrameCount: 20,
      sourceResolutionPreserved: true,
      sourceRangePreserved: true,
      variableFrameRateAllowed: false,
      callerPathOrUrlAccepted: false,
    },
    targetGroup: {
      targetSpecificationRef: ref('target-1'),
      targetGroupId: 'group-1',
      initializationFrameIndex: 15,
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
    actions,
    terminalClosePolicy: {
      closeOperation: 'close_session',
      closeInFinally: true,
      mandatoryAfter: [
        'completed',
        'failed',
        'cancelled',
        'timed_out',
        'reconciliation_required',
        'partial_output',
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
      approvedEstimateRef: ref('estimate-1'),
      accountEffectiveRateAuthorityRef: ref('rate-1'),
      maximumCredits: 10,
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

let clock = Date.parse('2026-08-04T17:00:00.000Z')
const now = () => {
  const value = new Date(clock).toISOString()
  clock += 1_000
  return value
}
const persistence = new InMemoryTrackAllSam31PrivateSessionPersistence()
const owner = new TrackAllSam31InjectedSessionOwner({ persistence, now })
const plan = buildPlan({ sessionId: 'session-success', leaseId: 'lease-1' })
const maskBytes = Buffer.from('private-injected-mask-sequence-object-001')
const success = await owner.execute({
  plan,
  injectedObjects: [{
    objectId: 'object_001',
    bytes: maskBytes,
    frameCount: 20,
    width: 320,
    height: 180,
    pixelFormat: 'gray8',
  }],
})
assert.equal(success.attemptEvidence.terminalDisposition, 'completed')
assert.equal(success.attemptEvidence.evidenceClass,
  'injected_masklets_test_only')
assert.equal(success.attemptEvidence.providerRequestCount, 0)
assert.equal(success.attemptEvidence.sourceCheckpointStrictLoadObserved, false)
assert.equal(success.attemptEvidence.cudaInferenceObserved, false)
assert.equal(success.outputManifest?.objects.length, 1)
assert.equal(success.outputManifest?.privateBinaryOnly, true)
assert.equal(success.outputManifest?.publicUrlPresent, false)
assert.equal(success.outputManifest?.injectedTestOnly, true)
assert.doesNotThrow(() => trackAllSam31MaskletOutputManifestSchema.parse(
  success.outputManifest,
))
assert.equal(success.events.at(-1)?.eventType, 'close_session')
assert.equal(success.events.filter((event) =>
  event.eventType === 'close_session').length, 1)
assert.equal(success.events.every((event) =>
  event.providerRequestCount === 0 && event.publicArtifactCount === 0 &&
  event.productionMutationCount === 0), true)

const replay = await owner.execute({
  plan,
  injectedObjects: [{
    objectId: 'object_001', bytes: maskBytes, frameCount: 20,
    width: 320, height: 180, pixelFormat: 'gray8',
  }],
})
assert.equal(replay.attemptEvidence.evidenceHash,
  success.attemptEvidence.evidenceHash)
assert.equal((await persistence.readEvents(plan.sessionId)).length,
  success.events.length)

const secondOwner = new TrackAllSam31InjectedSessionOwner({
  persistence,
  now,
})
await assert.rejects(() => secondOwner.execute({
  plan,
  injectedObjects: [{
    objectId: 'object_001', bytes: maskBytes, frameCount: 20,
    width: 320, height: 180, pixelFormat: 'gray8',
  }],
}), /reconciliation/u)

const failed = await owner.execute({
  plan: buildPlan({ sessionId: 'session-failure', leaseId: 'lease-2' }),
  injectedObjects: [],
  failAtPlannedActionSequence: 2,
})
assert.equal(failed.attemptEvidence.terminalDisposition, 'failed')
assert.equal(failed.outputManifest, null)
assert.equal(failed.events.at(-1)?.eventType, 'close_session')

const cancelled = await owner.execute({
  plan: buildPlan({
    sessionId: 'session-cancelled',
    leaseId: 'lease-3',
    cancellation: true,
  }),
  injectedObjects: [],
})
assert.equal(cancelled.attemptEvidence.terminalDisposition, 'cancelled')
assert.equal(cancelled.outputManifest, null)
assert.equal(cancelled.events.at(-1)?.eventType, 'close_session')

const wrongObjects = await owner.execute({
  plan: buildPlan({ sessionId: 'session-wrong-object', leaseId: 'lease-4' }),
  injectedObjects: [{
    objectId: 'object_999', bytes: maskBytes, frameCount: 20,
    width: 320, height: 180, pixelFormat: 'gray8',
  }],
})
assert.equal(wrongObjects.attemptEvidence.terminalDisposition, 'failed')
assert.equal(wrongObjects.events.at(-1)?.eventType, 'close_session')

for (const forcedTerminalDispositionAfterActions of [
  'timed_out', 'reconciliation_required', 'partial_output',
] as const) {
  const terminal = await owner.execute({
    plan: buildPlan({
      sessionId: `session-${forcedTerminalDispositionAfterActions}`,
      leaseId: `lease-${forcedTerminalDispositionAfterActions}`,
    }),
    injectedObjects: [],
    forcedTerminalDispositionAfterActions,
  })
  assert.equal(terminal.attemptEvidence.terminalDisposition,
    forcedTerminalDispositionAfterActions)
  assert.equal(terminal.outputManifest, null)
  assert.equal(terminal.events.at(-1)?.eventType, 'close_session')
  assert.equal(terminal.attemptEvidence.exactAttemptReconciled,
    forcedTerminalDispositionAfterActions !== 'reconciliation_required')
}

const conflictingWriterPlan = buildPlan({
  sessionId: 'session-success',
  leaseId: 'lease-conflict',
})
await assert.rejects(() => secondOwner.execute({
  plan: conflictingWriterPlan,
  injectedObjects: [{
    objectId: 'object_001', bytes: maskBytes, frameCount: 20,
    width: 320, height: 180, pixelFormat: 'gray8',
  }],
}), /another writer authority/u)

const blockedGate = createCurrentTrackAllSam31V2RouteGateReport({
  generatedAt: '2026-08-04T17:00:00.000Z',
})
assert.throws(() => assertTrackAllSam31CanonicalPrivateSessionAvailable({
  routeGateReport: blockedGate,
  persistence,
}), /not qualified/u)

console.log(JSON.stringify({
  status: 'ok',
  successEventCount: success.events.length,
  failureClosed: failed.events.at(-1)?.eventType === 'close_session',
  cancellationClosed: cancelled.events.at(-1)?.eventType === 'close_session',
  timeoutReconciliationAndPartialOutputClosed: true,
  oneWriterEnforced: true,
  privateObjectCount: success.outputManifest?.objects.length,
  providerRequestCount: success.attemptEvidence.providerRequestCount,
  publicArtifactCount: success.attemptEvidence.publicArtifactCount,
  productionMutationCount: success.attemptEvidence.productionMutationCount,
  evidenceClass: success.attemptEvidence.evidenceClass,
  canonicalPrivateRouteStatus: blockedGate.routeQualificationStatus,
}))
