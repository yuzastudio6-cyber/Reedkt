import assert from 'node:assert/strict'

import type { EditSkillArtifactStore } from '../edit-skills/core/edit-skill-artifact-store'
import { hashSkillValue } from '../edit-skills/core/skill-capability-manifest-hash'
import {
  TrackAllCanonicalPrivateCompositeOperationDriver,
  deterministicTrackAllCanonicalPrivateExecutionCounts,
  type TrackAllCanonicalPrivateAtomicStageExecutor,
  type TrackAllCanonicalPrivateAtomicWorkItem,
  type TrackAllCanonicalPrivateExecutionPackage,
  type TrackAllCanonicalPrivatePublicOutputProjector,
} from '../edit-skills/track-all'
import { TrackAllCanonicalPrivateDeterministicOperationDriver } from '../edit-skills/track-all/private/canonical-private-operation-driver'

const scope = {
  ownerUserId: 'composite-owner',
  workspaceId: 'composite-workspace',
  projectId: 'composite-project',
}
const ref = (artifactType: string, seed: string) => ({
  artifactType,
  sha256: hashSkillValue({ seed }),
  byteLength: 64,
  ...scope,
})
const store = {
  storageClass: 'durable',
  putJson: async (input: { artifactType: string; value: unknown }) =>
    ref(input.artifactType, hashSkillValue(input.value)),
} as unknown as EditSkillArtifactStore

const item = (operationId: string, createsGpuWork: boolean):
TrackAllCanonicalPrivateAtomicWorkItem => ({
  schemaVersion: 'track_all_atomic_work_item_v1',
  workItemKey: createsGpuWork ? 'sam-stage' : 'deterministic-stage',
  stageId: createsGpuWork ? 'execute_sam_masklet_session' : 'validate_assignment',
  parentJobType: 'track_all.produce_selected_target_graph',
  operationId,
  workerClass: createsGpuWork
    ? 'track_all_private_gpu_worker'
    : 'track_all_validation_worker',
  authorizedRange: { startFrameInclusive: 0, endFrameExclusive: 24, fps: 24 },
  dependencyKeys: [],
  inputArtifactTypes: [],
  outputArtifactType: createsGpuWork
    ? 'track_mask_chunk_manifest_v1'
    : 'track_all_context_manifest_v1',
  maximumCreditBudget: createsGpuWork ? 5 : 0,
  maximumAttempts: 1,
  required: true,
  qaLineageKeys: ['track_all.qa.assignment_authority'],
  privateOutputRequired: true,
  createsMedia: false,
  createsGpuWork,
  callerSelectedExecutableAllowed: false,
  automaticRetryAllowed: false,
  alternateModelFallbackAllowed: false,
  mutatesOnlyAuthorizedRange: true,
  workItemHash: hashSkillValue({ operationId, createsGpuWork }),
})
const deterministicItem = item('track_all.validate_assignment.v1', false)
const samItem = item('tool.sam3_1.track_masklets.v2', true)
const realCounts = {
  providerRequestCount: 0 as const,
  actualSamRequestCount: 1,
  actualGpuExecutionCount: 1,
  samSessionReceiptRefs: [ref(
    'track_all_sam3_1_real_private_session_receipt_v1',
    'session-receipt',
  )],
  samAttemptEvidenceRefs: [ref(
    'track_all_sam3_1_masklet_attempt_evidence_v2',
    'attempt-evidence',
  )],
  executionEvidenceClass: 'real_sam3_1_private_execution' as const,
}

let deterministicCalls = 0
let samCalls = 0
const deterministicExecutor: TrackAllCanonicalPrivateAtomicStageExecutor &
TrackAllCanonicalPrivatePublicOutputProjector = {
  executeAtomicStage: async ({ item: approved }) => {
    deterministicCalls += 1
    assert.notEqual(approved.operationId, 'tool.sam3_1.track_masklets.v2')
    return {
      value: { deterministic: true },
      evidenceHashes: [hashSkillValue({ deterministic: true })],
      actualToolOperationIds: [],
      executionCounts: deterministicTrackAllCanonicalPrivateExecutionCounts(),
    }
  },
  projectPublicOutput: async () => ({ projected: true }),
}
const samExecutor: TrackAllCanonicalPrivateAtomicStageExecutor = {
  executeAtomicStage: async ({ item: approved }) => {
    samCalls += 1
    assert.equal(approved.operationId, 'tool.sam3_1.track_masklets.v2')
    return {
      value: { privateMaskletManifest: true },
      evidenceHashes: [hashSkillValue({ sam: true })],
      actualToolOperationIds: ['tool.sam3_1.track_masklets.v2'],
      executionCounts: realCounts,
    }
  },
}

const execute = async (approvedItem: TrackAllCanonicalPrivateAtomicWorkItem, input: {
  sam31StageExecutor?: TrackAllCanonicalPrivateAtomicStageExecutor
}) => {
  const driver = new TrackAllCanonicalPrivateCompositeOperationDriver({
    artifactStore: store,
    deterministicStageExecutor: deterministicExecutor,
    sam31StageExecutor: input.sam31StageExecutor,
    now: deterministicClock(),
  })
  const execution = {
    assignment: scope,
    approvedWorkGraph: {
      workItems: [{
        workItemKey: 'public-selected',
        jobType: 'track_all.produce_selected_target_graph',
      }],
      approvedWorkGraphHash: hashSkillValue({ approved: approvedItem.workItemHash }),
    },
    pluginWorkGraph: {
      atomicWorkItems: [approvedItem],
      artifactHash: hashSkillValue({ plugin: approvedItem.workItemHash }),
    },
    initialArtifactRefs: [],
    publicPlan: { payloadRef: ref('track_all_plan_v1', 'plan') },
  } as unknown as TrackAllCanonicalPrivateExecutionPackage
  const request = {
    jobType: 'track_all.produce_selected_target_graph' as const,
    definition: { output: 'track_graph_v2' },
    invocation: { workItemKey: 'public-selected' },
    execution,
  } as Parameters<TrackAllCanonicalPrivateCompositeOperationDriver['execute']>[0]
  const first = await driver.execute(request)
  const replay = await driver.execute(request)
  assert.strictEqual(replay, first)
  return first
}

const deterministicResult = await execute(deterministicItem, {})
assert.equal(deterministicResult.executionCounts.actualSamRequestCount, 0)
const samResult = await execute(samItem, { sam31StageExecutor: samExecutor })
assert.equal(samResult.executionCounts.actualSamRequestCount, 1)
assert.equal(samResult.executionCounts.actualGpuExecutionCount, 1)
assert.equal(deterministicCalls, 1)
assert.equal(samCalls, 1)
await assert.rejects(() => execute(samItem, {}), /route is not qualified/iu)

const rejectOnly = async (): Promise<never> => {
  throw new Error('unused')
}
const actualDeterministic = new TrackAllCanonicalPrivateDeterministicOperationDriver({
  artifactStore: store,
  runtimes: {
    media: { execute: rejectOnly },
    python: { execute: rejectOnly },
    remotion: { execute: rejectOnly },
  },
  privateMediaSink: { persist: rejectOnly },
})
await assert.rejects(() => actualDeterministic.executeAtomicStage({
  item: samItem,
  execution: {} as TrackAllCanonicalPrivateExecutionPackage,
  inputArtifactRefs: [],
  dependencyResults: [],
}), /deterministic stage executor rejected SAM/iu)

console.log(JSON.stringify({
  status: 'ok',
  atomicSelectionFromApprovedOperationId: true,
  deterministicCalls,
  samCalls,
  replayDidNotIncreaseCounts: true,
  missingSamExecutorRejected: true,
  deterministicExecutorRejectsSam: true,
  callerSelectedExecutorAccepted: false,
}))

function deterministicClock() {
  let sequence = 0
  return () => new Date(Date.UTC(2026, 7, 5, 0, 0, sequence++)).toISOString()
}
