import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  hashSkillValue,
} from '../edit-skills/core/skill-capability-manifest-hash'
import {
  TrackAllSam31RealPrivateSessionOwner,
  executeOrReconcileTrackAllSam31ExactAttempt,
  TRACK_ALL_SAM31_REAL_PRIVATE_RUNTIME_AUTHORITY,
  TRACK_ALL_SAM31_REAL_PRIVATE_WORKER_PROTOCOL_VERSION,
  trackAllSam31RealPrivateWorkerResponseSchema,
} from '../edit-skills/track-all/private/sam3_1-real-private-session-owner'
import {
  createCurrentTrackAllSam31V2RouteGateReport,
} from '../edit-skills/track-all/private/sam3_1-v2-route-qualification-gate'

const report = createCurrentTrackAllSam31V2RouteGateReport({
  generatedAt: '2026-08-04T20:00:00.000Z',
})
const profileCore = {
  schemaVersion: 'track_all_sam3_1_runtime_profile_v2' as const,
  operationId: 'tool.sam3_1.track_masklets.v2' as const,
  sourceRevision: '96914d2425f90a64f45ca977c2b5165418099543' as const,
  checkpointRevision: 'daa63191845a41281374e725f4c9e51c7a824460' as const,
  runtimeImage: {
    candidateImage: 'pytorch/pytorch@sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca' as const,
    candidateBuildTarget: 'track_all_v2_candidate' as const,
    immutableImageQualified: false,
    immutableImageDigest: null,
  },
  realPrivateRuntime: {
    workerProtocolVersion:
      'track_all_sam3_1_real_private_worker_protocol_v1' as const,
    sessionOwnerVersion:
      'track_all_sam3_1_real_private_session_owner_v1' as const,
    runtimeAuthorityHash:
      TRACK_ALL_SAM31_REAL_PRIVATE_RUNTIME_AUTHORITY.authorityHash,
    callerSelectedExecutableAccepted: false as const,
    actualExecutionRequiresAllRouteGates: true as const,
  },
  maximumFramesPerSession: 240,
  supportedFps: [24, 25, 30, 50, 60] as const,
  maximumObjectsPerBucket: 16,
  maximumBucketsPerSession: 1,
  maximumBucketsPerPlan: 8,
  propagationModes: ['forward', 'backward', 'bidirectional'] as const,
  promptModes: [
    'text_concept', 'positive_points', 'negative_points', 'bounding_box',
  ] as const,
  refinementModes: [
    'positive_points', 'negative_points', 'bounding_box', 'object_removal',
  ] as const,
  gpuRoutes: [
    {
      routeKey: 'quality_a100_80gb_user_triggered_heavy_job_v1' as const,
      accelerator: 'nvidia_a100_80gb' as const,
      memoryGiB: 80 as const,
      role: 'primary' as const,
      qualificationStatus: 'blocked' as const,
    },
    {
      routeKey: 'quality_l4_user_triggered_heavy_fallback_job_v1' as const,
      accelerator: 'nvidia_l4' as const,
      memoryGiB: 24 as const,
      role: 'classified_fallback' as const,
      qualificationStatus: 'blocked' as const,
    },
  ] as const,
  memoryAdmission: {
    oneWriterPerSession: true as const,
    cpuFallbackAllowed: false as const,
    sourceResolutionReductionAllowed: false as const,
  },
  sessionTimeoutSeconds: 1_800,
  output: {
    artifactType: 'track_mask_chunk_manifest_v1' as const,
    privateCreateOnly: true as const,
    publicMaskOutputAllowed: false as const,
  },
  qualification: {
    environmentClass: 'canonical_private' as const,
    status: 'blocked' as const,
    routeReceiptHash: hashSkillValue('blocked-route-receipt'),
    routeGateReportHash: report.reportHash,
    internalExecutionAuthorized: false,
    productionExecutionAuthorized: false,
    missingGateKeys: report.findings.filter((finding) =>
      finding.disposition === 'blocked').map((finding) => finding.gateKey),
  },
}
const blockedProfile = {
  ...profileCore,
  profileHash: hashSkillValue(profileCore),
}

assert.throws(() => new TrackAllSam31RealPrivateSessionOwner({
  persistence: {
    storageClass: 'durable_private',
    async createAttempt() { return 'created' },
    async putMaskletManifestCreateOnly() {
      throw new Error('must not persist while blocked')
    },
  },
  worker: {
    protocolVersion: TRACK_ALL_SAM31_REAL_PRIVATE_WORKER_PROTOCOL_VERSION,
    adapterClass: 'canonical_private_execution_adapter',
    operationId: 'tool.sam3_1.track_masklets.v2',
    async executeSession() {
      throw new Error('must not execute while blocked')
    },
    async reconcileAndCloseExactAttempt() {
      throw new Error('must not reconcile while blocked')
    },
  },
  runtimeProfile: blockedProfile,
  routeGateReport: report,
  routeQualificationRegistry: null as never,
}), /unavailable until every exact route gate/u)

const responseCore = {
  schemaVersion: TRACK_ALL_SAM31_REAL_PRIVATE_WORKER_PROTOCOL_VERSION,
  operationId: 'tool.sam3_1.track_masklets.v2' as const,
  adapterClass: 'canonical_private_execution_adapter' as const,
  evidenceClass: 'canonical_private_reread' as const,
  sessionPlanHash: hashSkillValue('session-plan'),
  assignmentHash: hashSkillValue('assignment'),
  runtimeProfileHash: hashSkillValue('runtime-profile'),
  routeGateReportHash: hashSkillValue('route-gate'),
  sourceRevision: '96914d2425f90a64f45ca977c2b5165418099543' as const,
  checkpointRevision: 'daa63191845a41281374e725f4c9e51c7a824460' as const,
  checkpointSha256: hashSkillValue('checkpoint'),
  runtimeImageDigest: `sha256:${hashSkillValue('runtime-image')}`,
  accelerator: 'nvidia_a100_80gb' as const,
  terminalDisposition: 'completed' as const,
  exactAttemptReconciled: true,
  sourceCheckpointStrictLoadObserved: true,
  cudaInferenceObserved: true,
  modelSubmissionCount: 1 as const,
  objects: [{
    objectId: 'object_001',
    privateObjectRef: {
      artifactType: 'private_mask_sequence_binary_v1' as const,
      sha256: hashSkillValue('mask'),
      byteLength: 128,
      ownerUserId: 'user-1',
      workspaceId: 'workspace-1',
      projectId: 'project-1',
    },
    frameCount: 20,
    width: 320,
    height: 180,
    pixelFormat: 'gray8' as const,
    maskSequenceSha256: hashSkillValue('mask'),
  }],
  terminalObservedAt: '2026-08-04T20:00:00.000Z',
  close: {
    closeOperation: 'close_session' as const,
    closeAttempted: true as const,
    closeCompleted: true as const,
    closeObservedAt: '2026-08-04T20:00:01.000Z',
    gpuMemoryReleaseRequested: true as const,
  },
  rawUserChatIncluded: false as const,
  callerSelectedModelModuleClassCheckpointCommandGpuEndpointPathUrlRetryFallbackOrPriceAccepted:
    false as const,
  automaticRetryCount: 0 as const,
  automaticAlternateModelFallbackCount: 0 as const,
  publicArtifactCount: 0 as const,
  productionMutationCount: 0 as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
}
const response = {
  ...responseCore,
  responseHash: hashSkillValue(responseCore),
}
assert.doesNotThrow(() =>
  trackAllSam31RealPrivateWorkerResponseSchema.parse(response))
assert.throws(() => trackAllSam31RealPrivateWorkerResponseSchema.parse({
  ...response,
  rawUserChatIncluded: true,
}))

for (const terminalDisposition of [
  'failed', 'cancelled', 'timed_out', 'partial_output',
] as const) {
  const terminalCore = {
    ...responseCore,
    terminalDisposition,
    objects: [],
    sourceCheckpointStrictLoadObserved: terminalDisposition !== 'failed',
    cudaInferenceObserved: false,
  }
  assert.doesNotThrow(() =>
    trackAllSam31RealPrivateWorkerResponseSchema.parse({
      ...terminalCore,
      responseHash: hashSkillValue(terminalCore),
    }))
}
const unresolvedCore = {
  ...responseCore,
  terminalDisposition: 'reconciliation_required' as const,
  exactAttemptReconciled: false,
  objects: [],
  sourceCheckpointStrictLoadObserved: false,
  cudaInferenceObserved: false,
}
assert.doesNotThrow(() =>
  trackAllSam31RealPrivateWorkerResponseSchema.parse({
    ...unresolvedCore,
    responseHash: hashSkillValue(unresolvedCore),
  }))
assert.throws(() => trackAllSam31RealPrivateWorkerResponseSchema.parse({
  ...response,
  terminalDisposition: 'failed',
  objects: [],
  close: { ...response.close, closeCompleted: false },
}))

let submissionCount = 0
let reconciliationCount = 0
const reconciled = await executeOrReconcileTrackAllSam31ExactAttempt({
  execute: async () => {
    submissionCount += 1
    throw new Error('unknown transport outcome')
  },
  reconcileAndClose: async () => {
    reconciliationCount += 1
    return { exactAttemptReconciled: true, closeCompleted: true }
  },
})
assert.deepEqual(reconciled, {
  exactAttemptReconciled: true,
  closeCompleted: true,
})
assert.equal(submissionCount, 1)
assert.equal(reconciliationCount, 1)
assert.throws(() => trackAllSam31RealPrivateWorkerResponseSchema.parse({
  ...response,
  responseHash: hashSkillValue('forged'),
}))

const runner = readFileSync(resolve(
  process.cwd(),
  'docker/prod/gpu-worker/sam3_1/track_all_runner.py',
), 'utf8')
assert.match(runner, /build_sam3_multiplex_video_predictor/u)
assert.match(runner, /"type": "start_session"/u)
assert.match(runner, /"type": "add_prompt"/u)
assert.match(runner, /"type": "propagate_in_video"/u)
assert.match(runner, /"type": "remove_object"/u)
assert.match(runner, /"type": "reset_session"/u)
assert.match(runner, /"type": "cancel_propagation"/u)
assert.match(runner, /"type": "close_session"/u)
assert.match(runner, /finally:/u)
assert.doesNotMatch(runner, /input\(/u)
assert.doesNotMatch(runner, /subprocess/u)

console.log(JSON.stringify({
  status: 'ok',
  currentRouteStatus: report.routeQualificationStatus,
  realOwnerConstructionBlocked: true,
  exactWorkerProtocolValidated: true,
  workerSourceSupportsOfficialLifecycle: true,
  successFailureTimeoutCancellationCloseRequired: true,
  unknownOutcomeReconciledWithoutResubmission: true,
  automaticRetryCount: response.automaticRetryCount,
  automaticAlternateModelFallbackCount:
    response.automaticAlternateModelFallbackCount,
  rawUserChatIncluded: response.rawUserChatIncluded,
  publicArtifactCount: response.publicArtifactCount,
  productionMutationCount: response.productionMutationCount,
}))
