import assert from 'node:assert/strict'

import {
  aggregateTrackAllCanonicalPrivateExecutionCounts,
  deterministicTrackAllCanonicalPrivateExecutionCounts,
} from '../edit-skills/track-all/track-all-canonical-private-runtime'
import {
  trackAllAtomicExecutionEvidenceSchema,
  trackAllCanonicalPrivateExecutionCountsSchema,
} from '../edit-skills/track-all/track-all-active-artifact-contracts'
import { TRACK_ALL_CAPABILITY_MANIFEST } from '../edit-skills/track-all/track-all-capability-manifest'
import {
  hashSkillValue,
  skillManifestReference,
} from '../edit-skills/core/skill-capability-manifest-hash'

const scope = {
  ownerUserId: 'track-accounting-owner',
  workspaceId: 'track-accounting-workspace',
  projectId: 'track-accounting-project',
}
const reference = (artifactType: string, seed: string) => ({
  artifactType,
  sha256: hashSkillValue({ seed }),
  byteLength: 64,
  ...scope,
})
const receiptA = reference(
  'track_all_sam3_1_real_private_session_receipt_v1',
  'receipt-a',
)
const receiptB = reference(
  'track_all_sam3_1_real_private_session_receipt_v1',
  'receipt-b',
)
const attemptA = reference(
  'track_all_sam3_1_masklet_attempt_evidence_v2',
  'attempt-a',
)
const attemptB = reference(
  'track_all_sam3_1_masklet_attempt_evidence_v2',
  'attempt-b',
)

const deterministic = deterministicTrackAllCanonicalPrivateExecutionCounts()
assert.equal(deterministic.actualSamRequestCount, 0)
assert.equal(deterministic.actualGpuExecutionCount, 0)
assert.throws(() => trackAllCanonicalPrivateExecutionCountsSchema.parse({
  ...deterministic,
  actualSamRequestCount: 1,
}), /Deterministic execution cannot claim SAM/iu)

const realA = trackAllCanonicalPrivateExecutionCountsSchema.parse({
  providerRequestCount: 0,
  actualSamRequestCount: 1,
  actualGpuExecutionCount: 1,
  samSessionReceiptRefs: [receiptA],
  samAttemptEvidenceRefs: [attemptA],
  executionEvidenceClass: 'real_sam3_1_private_execution',
})
const realB = trackAllCanonicalPrivateExecutionCountsSchema.parse({
  providerRequestCount: 0,
  actualSamRequestCount: 1,
  actualGpuExecutionCount: 1,
  samSessionReceiptRefs: [receiptB],
  samAttemptEvidenceRefs: [attemptB],
  executionEvidenceClass: 'real_sam3_1_private_execution',
})
const aggregate = aggregateTrackAllCanonicalPrivateExecutionCounts([realA, realB])
assert.equal(aggregate.actualSamRequestCount, 2)
assert.equal(aggregate.actualGpuExecutionCount, 2)
assert.equal(aggregate.samSessionReceiptRefs.length, 2)
assert.throws(() =>
  aggregateTrackAllCanonicalPrivateExecutionCounts([realA, realA]),
/duplicate SAM evidence/iu)
assert.throws(() => trackAllCanonicalPrivateExecutionCountsSchema.parse({
  ...realA,
  actualGpuExecutionCount: 0,
}), /completed-attempt references/iu)

const atomicCore = {
  workItemKey: 'execute-sam',
  workItemHash: hashSkillValue({ work: 'execute-sam' }),
  stageId: 'execute_sam_masklet_session',
  parentJobType: 'track_all.produce_selected_target_graph',
  operationId: 'tool.sam3_1.track_masklets.v2',
  workerClass: 'track_all_private_gpu_worker',
  inputArtifactRefs: [reference('track_all_plan_v1', 'plan-ref')],
  dependencyOutputRefs: [],
  outputArtifactRef: reference('track_mask_chunk_manifest_v1', 'chunk-output'),
  evidenceHashes: [hashSkillValue({ evidence: 'sam' })],
  executionCounts: realA,
  status: 'succeeded' as const,
  startedAt: '2026-08-05T00:00:00.000Z',
  completedAt: '2026-08-05T00:00:01.000Z',
  outsideAuthorizedRangeModified: false as const,
}
const lineage = {
  ...scope,
  editSessionId: 'track-accounting-edit-session',
  assignmentId: 'track-accounting-assignment',
  assignmentHash: hashSkillValue({ assignment: 1 }),
  planHash: hashSkillValue({ plan: 1 }),
  manifestRef: skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST),
  sourceSha256: hashSkillValue({ source: 1 }),
  authorizedRange: {
    startFrameInclusive: 0,
    endFrameExclusive: 24,
    fps: 24,
  },
}
const evidenceCore = {
  schemaVersion: 'track_all_atomic_execution_evidence_v2' as const,
  ...lineage,
  approvedWorkGraphHash: hashSkillValue({ approvedGraph: 1 }),
  pluginWorkGraphHash: hashSkillValue({ pluginGraph: 1 }),
  publicWorkItemKey: 'selected-graph',
  publicWorkItemHash: hashSkillValue({ publicWork: 1 }),
  routeQualificationReceiptHash: hashSkillValue({ route: 1 }),
  atomicResults: [atomicCore],
  atomicWorkItemHashes: [atomicCore.workItemHash],
  actualToolOperationIds: ['tool.sam3_1.track_masklets.v2'],
  executionCounts: realA,
  prePersistedOutputAccepted: false as const,
  privateArtifactsOnly: true as const,
  outsideAuthorizedRangeModified: false as const,
}
trackAllAtomicExecutionEvidenceSchema.parse({
  ...evidenceCore,
  artifactHash: hashSkillValue(evidenceCore),
})

const mismatchedCore = { ...evidenceCore, executionCounts: aggregate }
assert.throws(() => trackAllAtomicExecutionEvidenceSchema.parse({
  ...mismatchedCore,
  artifactHash: hashSkillValue(mismatchedCore),
}), /differs from atomic evidence/iu)

const nonSamAtomic = {
  ...atomicCore,
  operationId: 'tool.opencv.analyze_approved_visual_artifacts.v1',
}
const nonSamCore = {
  ...evidenceCore,
  atomicResults: [nonSamAtomic],
  actualToolOperationIds: [nonSamAtomic.operationId],
}
assert.throws(() => trackAllAtomicExecutionEvidenceSchema.parse({
  ...nonSamCore,
  artifactHash: hashSkillValue(nonSamCore),
}), /Only the exact SAM V2/iu)

console.log(JSON.stringify({
  status: 'ok',
  deterministicZeroCountsRequired: true,
  realCountsReceiptBound: true,
  multiSessionCount: aggregate.actualSamRequestCount,
  replayDoubleCountRejected: true,
  aggregateMismatchRejected: true,
  nonSamActivityRejected: true,
  providerRequestCount: aggregate.providerRequestCount,
  productionMutationCount: 0,
  publicArtifactCount: 0,
}))
