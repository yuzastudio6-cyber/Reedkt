import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import { buildProfessionalExportExecutionAuthority } from '../../src/lib/professional-export-policy'
import {
  OBJECTIVE_FINAL_MASTER_QA_CONTRACT_VERSION,
  OBJECTIVE_FINAL_MASTER_QA_POLICY_VERSION,
  evaluateCanonicalObjectiveFinalMasterQa,
  sealObjectiveFinalMasterQaGateEvidence,
  type CanonicalObjectiveFinalMasterQaInput,
  type ObjectiveFinalMasterQaGateEvidence,
} from '../final-master-qa'

const GIB = 1024 ** 3

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

const identity = {
  ownerUserId: 'owner-objective-final-master-qa-smoke',
  workspaceId: 'workspace-objective-final-master-qa-smoke',
  projectId: 'project-objective-final-master-qa-smoke',
  editSessionId: 'edit-objective-final-master-qa-smoke',
  approvedPlanId: 'plan-objective-final-master-qa-smoke',
  approvedPlanSnapshotId: 'snapshot-objective-final-master-qa-smoke',
  approvedPlanSnapshotHash: digest('approved-plan-snapshot'),
  approvedExecutionPackageHash: digest('approved-execution-package'),
}

const exportAuthority = buildProfessionalExportExecutionAuthority({
  approvedEstimateId: 'estimate-objective-final-master-qa-smoke',
  approvedReservationId: 'reservation-objective-final-master-qa-smoke',
  approvedDeliverableId: 'deliverable-objective-final-master-qa-smoke',
  approvedAspectRatio: '16:9',
  approvedOutputFps: 30,
  approvedDurationSeconds: 60,
  selectedProfileId: 'uhd_2160',
})

const artifact = {
  artifactId: 'artifact-objective-final-master-qa-smoke',
  artifactType: 'private_approved_delivery_master_v1' as const,
  contentType: 'video/mp4' as const,
  sha256: digest('private-final-master-bytes'),
  byteLength: 128 * 1024 * 1024,
  storageKind: 'private_local_test' as const,
  opaqueObjectIdentityHash: digest('private-final-master-object-identity'),
  providerGeneration: null,
  privateObject: true as const,
  placeholder: false as const,
  publicObject: false as const,
}

const timing = {
  masterTimingArtifactId: 'master-timing-artifact-objective-qa-smoke',
  masterTimingArtifactHash: digest('master-timing-artifact'),
  sourceSequenceHash: digest('approved-source-sequence'),
  requiredLayerManifestHash: digest('required-layer-manifest'),
  durationFrames: 1_800,
  frameRateNumerator: 30,
  frameRateDenominator: 1,
  expectedChunkCount: 4,
  captionTrackRequired: true,
  captionTrackHash: digest('approved-caption-track'),
  approvedVisualExceptionManifestHash: digest('approved-visual-exceptions'),
  approvedAudioExceptionManifestHash: digest('approved-audio-exceptions'),
  approvedColorExceptionManifestHash: digest('approved-color-exceptions'),
}

const execution = {
  finalMasterWorkItemId: 'work-item-objective-final-master-qa-smoke',
  finalMasterJobId: 'job-objective-final-master-qa-smoke',
  finalMasterExecutionAttemptId: 'attempt-objective-final-master-qa-smoke',
  finalMasterLeaseId: 'lease-objective-final-master-qa-smoke',
  finalMasterDispatchGrantId: 'dispatch-objective-final-master-qa-smoke',
  finalMasterRunnerEvidenceHash: digest('final-master-runner-evidence'),
  finalMasterAttemptCostEvidenceHash: digest('final-master-attempt-cost-evidence'),
  finalMasterArtifactQaEvaluationHash: digest('final-master-artifact-qa-evaluation'),
  finalMasterArtifactReconciliationHash: digest('final-master-artifact-reconciliation'),
}

const commercialBoundary = {
  internalProductionCostOnly: true,
  customerPriceAuthorityIncluded: false,
  customerCreditAuthorityIncluded: false,
  serviceFeeAuthorityIncluded: false,
  customerChargeCreated: false,
  walletMutationAuthorized: false,
  billingAuthorized: false,
} as const

function gateCommon(suffix: string) {
  return {
    schemaVersion: 'objective-final-master-qa-gate-evidence-v1' as const,
    evidenceId: `objective-final-master-evidence-${suffix}`,
    evidenceArtifactHash: digest(`objective-final-master-evidence-artifact-${suffix}`),
    qaRunId: 'qa-run-objective-final-master-smoke',
    approvedPlanSnapshotId: identity.approvedPlanSnapshotId,
    approvedExecutionPackageHash: identity.approvedExecutionPackageHash,
    sourceMasterArtifactId: artifact.artifactId,
    sourceMasterSha256: artifact.sha256,
    executionAttemptId: `objective-final-master-qa-attempt-${suffix}`,
    runtimeImageIdentityHash: digest(`objective-final-master-runtime-image-${suffix}`),
    executionEnvironment: 'private_local_test' as const,
    cloudExecutionResourceHash: null,
    internalCostEvidenceSetHash: digest(`objective-final-master-cost-evidence-${suffix}`),
    outcome: 'passed' as const,
    evaluatedAt: '2026-07-18T20:00:00.000Z',
    commercialBoundary,
    providerCallMade: false as const,
  }
}

function resealGate(
  gate: ObjectiveFinalMasterQaGateEvidence,
  overrides: Record<string, unknown>,
): ObjectiveFinalMasterQaGateEvidence {
  const withoutHash = { ...gate }
  Reflect.deleteProperty(withoutHash, 'evidenceHash')
  return sealObjectiveFinalMasterQaGateEvidence({
    ...withoutHash,
    ...overrides,
  } as never) as ObjectiveFinalMasterQaGateEvidence
}

const technical = sealObjectiveFinalMasterQaGateEvidence({
  ...gateCommon('technical'),
  gateId: 'technical_media_contract',
  evidenceProfileId: 'independent_ffprobe_final_export_v1',
  toolId: 'ffprobe',
  operationId: 'tool.ffprobe.inspect_approved_media.v1',
  runnerClass: 'offline_media_binary_execution_v1',
  metrics: {
    independentFfprobeExecuted: true,
    inspectionProfileId: 'final_export_v1',
    binaryVersion: '8.1.2',
    container: 'mp4',
    videoStreamCount: 1,
    videoCodecName: 'h264',
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709',
    colorTransfer: 'bt709',
    colorPrimaries: 'bt709',
    colorRange: 'tv',
    width: 3_840,
    height: 2_160,
    frameRateNumerator: 30,
    frameRateDenominator: 1,
    frameCount: 1_800,
    audioStreamCount: 1,
    audioCodecName: 'aac',
    audioSampleRate: 48_000,
    audioChannels: 2,
    durationDriftFrames: 0,
    maximumDurationDriftFrames: 2,
  },
})

const decodedVideo = sealObjectiveFinalMasterQaGateEvidence({
  ...gateCommon('decoded-video'),
  gateId: 'decoded_video_integrity',
  evidenceProfileId: 'approved_final_master_full_decode_integrity_v1',
  toolId: 'ffmpeg',
  operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
  runnerClass: 'canonical_objective_final_master_video_qa_runner_v1',
  metrics: {
    fullFrameDecodeCompleted: true,
    firstDecodedFrame: 0,
    lastDecodedFrame: 1_799,
    decodedFrameCount: 1_800,
    decodeErrorCount: 0,
    nonMonotonicTimestampCount: 0,
    unexpectedBlackFrameCount: 0,
    unexpectedFreezeFrameCount: 0,
    unexpectedFlashFrameCount: 0,
    approvedVisualExceptionManifestHash: timing.approvedVisualExceptionManifestHash,
    fullFrameCoverage: true,
  },
})

const decodedAudio = sealObjectiveFinalMasterQaGateEvidence({
  ...gateCommon('decoded-audio'),
  gateId: 'decoded_audio_quality_sync',
  evidenceProfileId: 'approved_final_master_full_audio_quality_sync_v1',
  toolId: 'ffmpeg',
  operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
  runnerClass: 'canonical_objective_final_master_audio_qa_runner_v1',
  metrics: {
    fullProgramAudioDecodeCompleted: true,
    sampleRate: 48_000,
    channels: 2,
    decodedSampleFrameCount: 60 * 48_000,
    integratedLufs: -14,
    truePeakDbtp: -1.2,
    loudnessRangeLufs: 5.5,
    avSyncDriftFrames: 0,
    unexpectedClippedSampleCount: 0,
    unexpectedDigitalSilenceFrameCount: 0,
    approvedAudioExceptionManifestHash: timing.approvedAudioExceptionManifestHash,
    speechClarityGatePassed: true,
  },
})

const timingLayers = sealObjectiveFinalMasterQaGateEvidence({
  ...gateCommon('timing-layers'),
  gateId: 'master_timing_layer_reconciliation',
  evidenceProfileId: 'approved_final_master_timing_layer_reconciliation_v1',
  toolId: 'internal',
  operationId: 'internal.reconcile_approved_final_master_timing_layers.v1',
  runnerClass: 'canonical_objective_final_master_timing_qa_runner_v1',
  metrics: {
    masterTimingArtifactHash: timing.masterTimingArtifactHash,
    sourceSequenceHash: timing.sourceSequenceHash,
    requiredLayerManifestHash: timing.requiredLayerManifestHash,
    captionTrackHash: timing.captionTrackHash,
    durationFrames: timing.durationFrames,
    gapFrameCount: 0,
    overlapFrameCount: 0,
    missingRequiredLayerCount: 0,
    finalPlaceholderCount: 0,
    captionCollisionCount: 0,
    fullFrameCoverage: true,
    approvedSourceOrderPreserved: true,
  },
})

const colorContinuity = sealObjectiveFinalMasterQaGateEvidence({
  ...gateCommon('color-continuity'),
  gateId: 'cross_chunk_color_continuity',
  evidenceProfileId: 'approved_final_master_cross_chunk_color_continuity_v1',
  toolId: 'internal',
  operationId: 'internal.reconcile_approved_final_master_color_continuity.v1',
  runnerClass: 'canonical_objective_final_master_color_qa_aggregator_v1',
  metrics: {
    chunkCount: 4,
    expectedBoundaryCount: 3,
    passedBoundaryCount: 3,
    failedBoundaryCount: 0,
    continuityEvidenceSetHash: digest('cross-chunk-continuity-evidence-set'),
    approvedColorExceptionManifestHash: timing.approvedColorExceptionManifestHash,
    allBoundariesAccountedFor: true,
  },
})

const artifactIntegrity = sealObjectiveFinalMasterQaGateEvidence({
  ...gateCommon('artifact-integrity'),
  gateId: 'private_artifact_integrity',
  evidenceProfileId: 'approved_final_master_private_artifact_reconciliation_v1',
  toolId: 'internal',
  operationId: 'internal.verify_private_final_master_artifact_reconciliation.v1',
  runnerClass: 'canonical_objective_final_master_artifact_qa_runner_v1',
  metrics: {
    reopenedSha256: artifact.sha256,
    reopenedByteLength: artifact.byteLength,
    opaqueObjectIdentityHash: artifact.opaqueObjectIdentityHash,
    artifactQaEvaluationHash: execution.finalMasterArtifactQaEvaluationHash,
    artifactReconciliationHash: execution.finalMasterArtifactReconciliationHash,
    createOnlyPersistenceVerified: true,
    privateReadbackVerified: true,
    publicUrlIssued: false,
    overwriteOccurred: false,
  },
})

const gates: ObjectiveFinalMasterQaGateEvidence[] = [
  technical,
  decodedVideo,
  decodedAudio,
  timingLayers,
  colorContinuity,
  artifactIntegrity,
]

const baseInput: CanonicalObjectiveFinalMasterQaInput = {
  schemaVersion: OBJECTIVE_FINAL_MASTER_QA_CONTRACT_VERSION,
  policyVersion: OBJECTIVE_FINAL_MASTER_QA_POLICY_VERSION,
  qaRunId: 'qa-run-objective-final-master-smoke',
  idempotencyKey: 'objective-final-master-qa-smoke-v1',
  identity,
  approval: {
    approvedEstimateId: exportAuthority.approvedEstimateId,
    creditReservationId: exportAuthority.approvedReservationId,
    approvedDeliverableId: exportAuthority.approvedDeliverableId,
    creditReservationStatus: 'reserved',
    exportAuthority,
    exportCoveredByOriginalApprovedEstimate: true,
    exportTimeEstimateAllowed: false,
    exportTimeCustomerChargeAllowed: false,
  },
  artifact,
  timing,
  audioPolicy: {
    policyId: 'approved_web_delivery_audio_policy_v1',
    targetIntegratedLufs: -14,
    integratedLufsTolerance: 1,
    maximumTruePeakDbtp: -1,
    maximumLoudnessRangeLufs: 7,
    maximumAvSyncDriftFrames: 2,
    speechClarityRequired: true,
  },
  execution,
  gateEvidence: gates,
}

const passed = evaluateCanonicalObjectiveFinalMasterQa(baseInput)
assert.equal(passed.contractValid, true)
assert.equal(passed.objectiveMediaQaPassed, true)
assert.equal(passed.privateReviewObjectiveMediaEligible, true)
assert.equal(passed.blockers.length, 0)
assert.equal(passed.gateOutcomes.length, 6)
assert.match(passed.manifestHash, /^[a-f0-9]{64}$/u)
assert.match(passed.evidenceSetHash, /^[a-f0-9]{64}$/u)
assert.deepEqual(passed.boundaries, {
  contractEvaluationOnly: true,
  mediaReadMade: false,
  toolExecutionMade: false,
  providerCallMade: false,
  googleCloudDispatchMade: false,
  artifactWriteMade: false,
  publicDeliveryUnlocked: false,
  customerPriceCalculated: false,
  customerCreditsCalculated: false,
  customerChargeCreated: false,
  walletMutationMade: false,
  serviceFeeIncluded: false,
  semanticIntentQaIncluded: false,
  editPreferenceComplianceIncluded: false,
  copySafetyQaIncluded: false,
  productReady: false,
  productionReady: false,
})

const reordered = evaluateCanonicalObjectiveFinalMasterQa({
  ...baseInput,
  gateEvidence: [...gates].reverse(),
})
assert.equal(reordered.objectiveMediaQaPassed, true)
assert.equal(reordered.evidenceSetHash, passed.evidenceSetHash)
assert.equal(reordered.manifestHash, passed.manifestHash)

const privateGcpDecodedVideo = sealObjectiveFinalMasterQaGateEvidence({
  ...gateCommon('decoded-video-private-gcp'),
  gateId: 'decoded_video_integrity',
  evidenceProfileId: 'approved_final_master_full_decode_integrity_v1',
  toolId: 'ffmpeg',
  operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
  runnerClass: 'canonical_objective_final_master_video_qa_runner_v1',
  executionEnvironment: 'private_gcp_internal',
  cloudExecutionResourceHash: digest('private-gcp-decoded-video-execution-resource'),
  metrics: decodedVideo.metrics,
})
const privateGcpEvidenceAccepted = evaluateCanonicalObjectiveFinalMasterQa({
  ...baseInput,
  gateEvidence: gates.map((gate) =>
    gate.gateId === 'decoded_video_integrity' ? privateGcpDecodedVideo : gate),
})
assert.equal(privateGcpEvidenceAccepted.objectiveMediaQaPassed, true)
assert.equal(privateGcpEvidenceAccepted.boundaries.googleCloudDispatchMade, false)

const currentNarrowFfprobeOnly = evaluateCanonicalObjectiveFinalMasterQa({
  ...baseInput,
  gateEvidence: [technical],
})
assert.equal(currentNarrowFfprobeOnly.contractValid, false)
assert.equal(currentNarrowFfprobeOnly.objectiveMediaQaPassed, false)
assert.equal(currentNarrowFfprobeOnly.privateReviewObjectiveMediaEligible, false)
assert.equal(
  currentNarrowFfprobeOnly.blockers.filter((blocker) => blocker.startsWith('missing_gate:')).length,
  5,
)

const failedDecodedVideo = sealObjectiveFinalMasterQaGateEvidence({
  ...gateCommon('decoded-video-failed'),
  gateId: 'decoded_video_integrity',
  evidenceProfileId: 'approved_final_master_full_decode_integrity_v1',
  toolId: 'ffmpeg',
  operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
  runnerClass: 'canonical_objective_final_master_video_qa_runner_v1',
  outcome: 'failed',
  metrics: {
    ...decodedVideo.metrics,
    fullFrameDecodeCompleted: false,
    lastDecodedFrame: 899,
    decodedFrameCount: 900,
    decodeErrorCount: 1,
    fullFrameCoverage: false,
  },
})
const validFailure = evaluateCanonicalObjectiveFinalMasterQa({
  ...baseInput,
  gateEvidence: gates.map((gate) =>
    gate.gateId === 'decoded_video_integrity' ? failedDecodedVideo : gate),
})
assert.equal(validFailure.contractValid, true)
assert.equal(validFailure.objectiveMediaQaPassed, false)
assert.equal(validFailure.blockers.includes('decoded_video_integrity:failed'), true)

const reviewAudio = sealObjectiveFinalMasterQaGateEvidence({
  ...gateCommon('decoded-audio-review'),
  gateId: 'decoded_audio_quality_sync',
  evidenceProfileId: 'approved_final_master_full_audio_quality_sync_v1',
  toolId: 'ffmpeg',
  operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
  runnerClass: 'canonical_objective_final_master_audio_qa_runner_v1',
  outcome: 'needs_user_review',
  metrics: {
    ...decodedAudio.metrics,
    integratedLufs: -18,
    unexpectedDigitalSilenceFrameCount: 60,
    speechClarityGatePassed: false,
  },
})
const validReview = evaluateCanonicalObjectiveFinalMasterQa({
  ...baseInput,
  gateEvidence: gates.map((gate) =>
    gate.gateId === 'decoded_audio_quality_sync' ? reviewAudio : gate),
})
assert.equal(validReview.contractValid, true)
assert.equal(validReview.objectiveMediaQaPassed, false)
assert.equal(validReview.blockers.includes('decoded_audio_quality_sync:needs_user_review'), true)

const wrongDimensions = sealObjectiveFinalMasterQaGateEvidence({
  ...gateCommon('technical-wrong-dimensions'),
  gateId: 'technical_media_contract',
  evidenceProfileId: 'independent_ffprobe_final_export_v1',
  toolId: 'ffprobe',
  operationId: 'tool.ffprobe.inspect_approved_media.v1',
  runnerClass: 'offline_media_binary_execution_v1',
  metrics: { ...technical.metrics, width: 1_920, height: 1_080 },
})
assert.equal(evaluateCanonicalObjectiveFinalMasterQa({
  ...baseInput,
  gateEvidence: gates.map((gate) =>
    gate.gateId === 'technical_media_contract' ? wrongDimensions : gate),
}).contractValid, false)

const duplicateEvidenceId = sealObjectiveFinalMasterQaGateEvidence({
  ...gateCommon('decoded-video-duplicate-evidence-id'),
  gateId: 'decoded_video_integrity',
  evidenceId: technical.evidenceId,
  evidenceProfileId: 'approved_final_master_full_decode_integrity_v1',
  toolId: 'ffmpeg',
  operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
  runnerClass: 'canonical_objective_final_master_video_qa_runner_v1',
  metrics: decodedVideo.metrics,
})
assert.equal(evaluateCanonicalObjectiveFinalMasterQa({
  ...baseInput,
  gateEvidence: gates.map((gate) =>
    gate.gateId === 'decoded_video_integrity' ? duplicateEvidenceId : gate),
}).contractValid, false)

assert.equal(evaluateCanonicalObjectiveFinalMasterQa({
  ...baseInput,
  gateEvidence: gates.map((gate) =>
    gate.gateId === 'decoded_video_integrity'
      ? { ...gate, evidenceHash: digest('tampered-gate-hash') }
      : gate),
}).contractValid, false)

assert.equal(evaluateCanonicalObjectiveFinalMasterQa({
  ...baseInput,
  approval: { ...baseInput.approval, creditReservationId: 'different-reservation' },
}).contractValid, false)

assert.equal(evaluateCanonicalObjectiveFinalMasterQa({
  ...baseInput,
  artifact: { ...baseInput.artifact, sha256: digest('different-final-master') },
}).contractValid, false)

assert.equal(evaluateCanonicalObjectiveFinalMasterQa({
  ...baseInput,
  gateEvidence: [...gates, technical],
}).contractValid, false)

const chargedBoundary = sealObjectiveFinalMasterQaGateEvidence({
  ...gateCommon('technical-charged-boundary'),
  gateId: 'technical_media_contract',
  evidenceProfileId: 'independent_ffprobe_final_export_v1',
  toolId: 'ffprobe',
  operationId: 'tool.ffprobe.inspect_approved_media.v1',
  runnerClass: 'offline_media_binary_execution_v1',
  commercialBoundary: {
    ...commercialBoundary,
    customerChargeCreated: true,
  },
  metrics: technical.metrics,
} as never) as ObjectiveFinalMasterQaGateEvidence
assert.equal(evaluateCanonicalObjectiveFinalMasterQa({
  ...baseInput,
  gateEvidence: gates.map((gate) =>
    gate.gateId === 'technical_media_contract' ? chargedBoundary : gate),
}).contractValid, false)

const qhdAuthority = buildProfessionalExportExecutionAuthority({
  approvedEstimateId: exportAuthority.approvedEstimateId,
  approvedReservationId: exportAuthority.approvedReservationId,
  approvedDeliverableId: exportAuthority.approvedDeliverableId,
  approvedAspectRatio: '16:9',
  approvedOutputFps: 30,
  approvedDurationSeconds: 60,
  selectedProfileId: 'qhd_1440',
})
const qhdTechnical = sealObjectiveFinalMasterQaGateEvidence({
  ...gateCommon('technical-qhd'),
  gateId: 'technical_media_contract',
  evidenceProfileId: 'independent_ffprobe_final_export_v1',
  toolId: 'ffprobe',
  operationId: 'tool.ffprobe.inspect_approved_media.v1',
  runnerClass: 'offline_media_binary_execution_v1',
  metrics: { ...technical.metrics, width: 2_560, height: 1_440 },
})
const qhdResult = evaluateCanonicalObjectiveFinalMasterQa({
  ...baseInput,
  approval: { ...baseInput.approval, exportAuthority: qhdAuthority },
  gateEvidence: gates.map((gate) =>
    gate.gateId === 'technical_media_contract' ? qhdTechnical : gate),
})
assert.equal(qhdResult.objectiveMediaQaPassed, true)
assert.equal(qhdResult.boundaries.customerChargeCreated, false)

const largeArtifact = {
  ...artifact,
  artifactId: 'artifact-large-objective-final-master-qa-smoke',
  byteLength: 512 * GIB,
}
const largeArtifactIntegrity = sealObjectiveFinalMasterQaGateEvidence({
  ...gateCommon('large-artifact-integrity'),
  gateId: 'private_artifact_integrity',
  evidenceProfileId: 'approved_final_master_private_artifact_reconciliation_v1',
  toolId: 'internal',
  operationId: 'internal.verify_private_final_master_artifact_reconciliation.v1',
  runnerClass: 'canonical_objective_final_master_artifact_qa_runner_v1',
  sourceMasterArtifactId: largeArtifact.artifactId,
  metrics: {
    ...artifactIntegrity.metrics,
    reopenedByteLength: largeArtifact.byteLength,
  },
})
const largeArtifactGates = gates.map((gate) => gate.gateId === 'private_artifact_integrity'
  ? largeArtifactIntegrity
  : resealGate(gate, { sourceMasterArtifactId: largeArtifact.artifactId }))
const largeArtifactResult = evaluateCanonicalObjectiveFinalMasterQa({
  ...baseInput,
  artifact: largeArtifact,
  gateEvidence: largeArtifactGates,
})
assert.equal(largeArtifactResult.objectiveMediaQaPassed, true)

console.log(JSON.stringify({
  ok: true,
  scope: 'objective_final_master_media_qa_contract_only',
  approvedExportCoverage: {
    fourKPassed: passed.objectiveMediaQaPassed,
    twoKPassedUnderOriginalFourKEstimate: qhdResult.objectiveMediaQaPassed,
    fiveHundredTwelveGibMasterContractPassed: largeArtifactResult.objectiveMediaQaPassed,
    exportTimeEstimateAllowed: false,
    exportTimeCustomerChargeAllowed: false,
  },
  requiredGates: passed.gateOutcomes.map((gate) => gate.gateId),
  honestCurrentState: {
    existingNarrowFfprobeEvidenceInsufficient: !currentNarrowFfprobeOnly.contractValid,
    missingObjectiveGates: currentNarrowFfprobeOnly.blockers
      .filter((blocker) => blocker.startsWith('missing_gate:')).length,
    semanticIntentQaIncluded: false,
    editPreferenceComplianceIncluded: false,
  },
  boundaries: passed.boundaries,
}, null, 2))
