import { createHash } from 'node:crypto'

import { isProfessionalExportFrameCovered } from '../../src/lib/professional-export-policy'
import { REEDITPRO_SOURCE_MEDIA_MAX_BYTES } from '../../src/types/large-media'
import {
  OBJECTIVE_FINAL_MASTER_QA_CONTRACT_VERSION,
  OBJECTIVE_FINAL_MASTER_DECODED_AUDIO_EVIDENCE_PROFILE_ID,
  OBJECTIVE_FINAL_MASTER_DECODED_AUDIO_RUNNER_CLASS,
  OBJECTIVE_FINAL_MASTER_DECODED_VIDEO_EVIDENCE_PROFILE_ID,
  OBJECTIVE_FINAL_MASTER_DECODED_VIDEO_RUNNER_CLASS,
  OBJECTIVE_FINAL_MASTER_QA_GATE_IDS,
  OBJECTIVE_FINAL_MASTER_QA_POLICY_VERSION,
  type CanonicalObjectiveFinalMasterQaInput,
  type CanonicalObjectiveFinalMasterQaResult,
  type ObjectiveDecodedAudioQualitySyncEvidence,
  type ObjectiveFinalMasterQaGateEvidence,
  type ObjectiveFinalMasterQaGateEvidenceWithoutHash,
  type ObjectiveFinalMasterQaGateId,
  type ObjectiveTechnicalMediaContractEvidence,
} from './objective-final-master-qa-types'

const SHA256 = /^[a-f0-9]{64}$/u
const IDENTITY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u

const EXPECTED_GATE_PROVENANCE: Record<ObjectiveFinalMasterQaGateId, {
  evidenceProfileId: string
  toolId: ObjectiveFinalMasterQaGateEvidence['toolId']
  operationId: string
  runnerClass: string
}> = {
  technical_media_contract: {
    evidenceProfileId: 'independent_ffprobe_final_export_v1',
    toolId: 'ffprobe',
    operationId: 'tool.ffprobe.inspect_approved_media.v1',
    runnerClass: 'offline_media_binary_execution_v1',
  },
  decoded_video_integrity: {
    evidenceProfileId: OBJECTIVE_FINAL_MASTER_DECODED_VIDEO_EVIDENCE_PROFILE_ID,
    toolId: 'ffmpeg',
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
    runnerClass: OBJECTIVE_FINAL_MASTER_DECODED_VIDEO_RUNNER_CLASS,
  },
  decoded_audio_quality_sync: {
    evidenceProfileId: OBJECTIVE_FINAL_MASTER_DECODED_AUDIO_EVIDENCE_PROFILE_ID,
    toolId: 'ffmpeg',
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
    runnerClass: OBJECTIVE_FINAL_MASTER_DECODED_AUDIO_RUNNER_CLASS,
  },
  master_timing_layer_reconciliation: {
    evidenceProfileId: 'approved_final_master_timing_layer_reconciliation_v1',
    toolId: 'internal',
    operationId: 'internal.reconcile_approved_final_master_timing_layers.v1',
    runnerClass: 'canonical_objective_final_master_timing_qa_runner_v1',
  },
  cross_chunk_color_continuity: {
    evidenceProfileId: 'approved_final_master_cross_chunk_color_continuity_v1',
    toolId: 'internal',
    operationId: 'internal.reconcile_approved_final_master_color_continuity.v1',
    runnerClass: 'canonical_objective_final_master_color_qa_aggregator_v1',
  },
  private_artifact_integrity: {
    evidenceProfileId: 'approved_final_master_private_artifact_reconciliation_v1',
    toolId: 'internal',
    operationId: 'internal.verify_private_final_master_artifact_reconciliation.v1',
    runnerClass: 'canonical_objective_final_master_artifact_qa_runner_v1',
  },
}

export function sealObjectiveFinalMasterQaGateEvidence<
  Gate extends ObjectiveFinalMasterQaGateEvidenceWithoutHash,
>(gate: Gate): Gate & { evidenceHash: string } {
  return {
    ...gate,
    evidenceHash: sha256(stableStringify(gate)),
  }
}

export function evaluateCanonicalObjectiveFinalMasterQa(
  input: CanonicalObjectiveFinalMasterQaInput,
): CanonicalObjectiveFinalMasterQaResult {
  const contractErrors: string[] = []
  const qaBlockers: string[] = []

  validateRoot(input, contractErrors)
  validateApprovalAndArtifact(input, contractErrors)
  validateTimingAndExecution(input, contractErrors)

  const evidenceByGate = new Map<ObjectiveFinalMasterQaGateId, ObjectiveFinalMasterQaGateEvidence>()
  const evidenceIds = new Set<string>()
  const executionAttemptIds = new Set<string>()
  for (const evidence of input.gateEvidence) {
    if (!OBJECTIVE_FINAL_MASTER_QA_GATE_IDS.includes(evidence.gateId)) {
      contractErrors.push(`unsupported_gate:${String(evidence.gateId)}`)
      continue
    }
    if (evidenceByGate.has(evidence.gateId)) {
      contractErrors.push(`duplicate_gate:${evidence.gateId}`)
      continue
    }
    if (evidenceIds.has(evidence.evidenceId)) {
      contractErrors.push(`duplicate_evidence_id:${evidence.evidenceId}`)
    }
    if (executionAttemptIds.has(evidence.executionAttemptId)) {
      contractErrors.push(`duplicate_gate_attempt:${evidence.executionAttemptId}`)
    }
    evidenceIds.add(evidence.evidenceId)
    executionAttemptIds.add(evidence.executionAttemptId)
    evidenceByGate.set(evidence.gateId, evidence)
    validateGateCommon(input, evidence, contractErrors)
    validateGateMetrics(input, evidence, contractErrors)
    if (evidence.outcome !== 'passed') {
      qaBlockers.push(`${evidence.gateId}:${evidence.outcome}`)
    }
  }

  for (const gateId of OBJECTIVE_FINAL_MASTER_QA_GATE_IDS) {
    if (!evidenceByGate.has(gateId)) contractErrors.push(`missing_gate:${gateId}`)
  }

  // Audio validation depends on the exact technical stream evidence and is
  // repeated after the complete set has been indexed, independent of order.
  const technical = evidenceByGate.get('technical_media_contract')
  const audio = evidenceByGate.get('decoded_audio_quality_sync')
  if (technical?.gateId === 'technical_media_contract' &&
      audio?.gateId === 'decoded_audio_quality_sync') {
    validateAudioAgainstTechnical(audio, technical, contractErrors)
  }

  const orderedEvidence = OBJECTIVE_FINAL_MASTER_QA_GATE_IDS
    .map((gateId) => evidenceByGate.get(gateId))
    .filter((evidence): evidence is ObjectiveFinalMasterQaGateEvidence => evidence !== undefined)
  const evidenceSetHash = sha256(stableStringify(orderedEvidence.map((evidence) => ({
    gateId: evidence.gateId,
    evidenceHash: evidence.evidenceHash,
  }))))
  const manifestHash = sha256(stableStringify({
    schemaVersion: input.schemaVersion,
    policyVersion: input.policyVersion,
    qaRunId: input.qaRunId,
    idempotencyKey: input.idempotencyKey,
    identity: input.identity,
    approval: input.approval,
    artifact: input.artifact,
    timing: input.timing,
    audioPolicy: input.audioPolicy,
    execution: input.execution,
    evidenceSetHash,
  }))
  const contractValid = contractErrors.length === 0
  const objectiveMediaQaPassed = contractValid && qaBlockers.length === 0

  return {
    schemaVersion: 'canonical-objective-final-master-qa-result-v1',
    qaRunId: input.qaRunId,
    approvedPlanSnapshotId: input.identity.approvedPlanSnapshotId,
    artifactId: input.artifact.artifactId,
    artifactSha256: input.artifact.sha256,
    manifestHash,
    evidenceSetHash,
    contractValid,
    objectiveMediaQaPassed,
    privateReviewObjectiveMediaEligible: objectiveMediaQaPassed,
    blockers: unique([...contractErrors, ...qaBlockers]),
    gateOutcomes: OBJECTIVE_FINAL_MASTER_QA_GATE_IDS.map((gateId) => {
      const evidence = evidenceByGate.get(gateId)
      return {
        gateId,
        outcome: evidence?.outcome ?? 'missing',
        evidenceHash: evidence?.evidenceHash ?? null,
      }
    }),
    boundaries: {
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
    },
  }
}

function validateRoot(
  input: CanonicalObjectiveFinalMasterQaInput,
  errors: string[],
): void {
  if (input.schemaVersion !== OBJECTIVE_FINAL_MASTER_QA_CONTRACT_VERSION) {
    errors.push('contract_version_invalid')
  }
  if (input.policyVersion !== OBJECTIVE_FINAL_MASTER_QA_POLICY_VERSION) {
    errors.push('policy_version_invalid')
  }
  for (const [field, value] of Object.entries({
    qaRunId: input.qaRunId,
    idempotencyKey: input.idempotencyKey,
    ownerUserId: input.identity.ownerUserId,
    workspaceId: input.identity.workspaceId,
    projectId: input.identity.projectId,
    editSessionId: input.identity.editSessionId,
    approvedPlanId: input.identity.approvedPlanId,
    approvedPlanSnapshotId: input.identity.approvedPlanSnapshotId,
  })) {
    if (!validId(value)) errors.push(`${field}_invalid`)
  }
  for (const [field, value] of Object.entries({
    approvedPlanSnapshotHash: input.identity.approvedPlanSnapshotHash,
    approvedExecutionPackageHash: input.identity.approvedExecutionPackageHash,
  })) {
    if (!SHA256.test(value)) errors.push(`${field}_invalid`)
  }
  if (input.gateEvidence.length > OBJECTIVE_FINAL_MASTER_QA_GATE_IDS.length) {
    errors.push('gate_evidence_count_unbounded')
  }
}

function validateApprovalAndArtifact(
  input: CanonicalObjectiveFinalMasterQaInput,
  errors: string[],
): void {
  const { approval, artifact, timing } = input
  for (const [field, value] of Object.entries({
    approvedEstimateId: approval.approvedEstimateId,
    creditReservationId: approval.creditReservationId,
    approvedDeliverableId: approval.approvedDeliverableId,
    artifactId: artifact.artifactId,
  })) {
    if (!validId(value)) errors.push(`${field}_invalid`)
  }
  const exportAuthority = approval.exportAuthority
  const fps = timing.frameRateNumerator / timing.frameRateDenominator
  const durationSeconds = timing.durationFrames / fps
  if (
    approval.creditReservationStatus !== 'reserved' ||
    exportAuthority.approvedEstimateId !== approval.approvedEstimateId ||
    exportAuthority.approvedReservationId !== approval.creditReservationId ||
    exportAuthority.approvedDeliverableId !== approval.approvedDeliverableId ||
    approval.exportCoveredByOriginalApprovedEstimate !== true ||
    approval.exportTimeEstimateAllowed !== false ||
    approval.exportTimeCustomerChargeAllowed !== false ||
    exportAuthority.includedInApprovedEstimate !== true ||
    exportAuthority.requiresSeparateExportEstimate !== false ||
    exportAuthority.allowsAdditionalExportCharge !== false ||
    exportAuthority.usesApprovedEditReservation !== true ||
    !isProfessionalExportFrameCovered({
      authority: exportAuthority,
      width: exportAuthority.selectedFrame.width,
      height: exportAuthority.selectedFrame.height,
      aspectRatio: exportAuthority.selectedFrame.aspectRatio,
      fps,
      durationSeconds,
    })
  ) errors.push('approved_export_authority_invalid')

  if (
    artifact.artifactType !== 'private_approved_delivery_master_v1' ||
    !['private_local_test', 'private_gcs_test'].includes(artifact.storageKind) ||
    artifact.contentType !== 'video/mp4' || !SHA256.test(artifact.sha256) ||
    !Number.isSafeInteger(artifact.byteLength) || artifact.byteLength < 64 ||
    artifact.byteLength > REEDITPRO_SOURCE_MEDIA_MAX_BYTES ||
    !SHA256.test(artifact.opaqueObjectIdentityHash) ||
    artifact.privateObject !== true || artifact.placeholder !== false ||
    artifact.publicObject !== false ||
    (artifact.storageKind === 'private_local_test' && artifact.providerGeneration !== null) ||
    (artifact.storageKind === 'private_gcs_test' && !validGeneration(artifact.providerGeneration))
  ) errors.push('private_final_master_artifact_invalid')
}

function validateTimingAndExecution(
  input: CanonicalObjectiveFinalMasterQaInput,
  errors: string[],
): void {
  const { timing, audioPolicy, execution } = input
  const fps = timing.frameRateNumerator / timing.frameRateDenominator
  if (
    !validId(timing.masterTimingArtifactId) ||
    !Number.isSafeInteger(timing.durationFrames) || timing.durationFrames < 1 ||
    timing.durationFrames > 100_000_000 ||
    !Number.isSafeInteger(timing.frameRateNumerator) || timing.frameRateNumerator < 1 ||
    !Number.isSafeInteger(timing.frameRateDenominator) || timing.frameRateDenominator < 1 ||
    !Number.isFinite(fps) || fps < 1 || fps > 240 ||
    !Number.isSafeInteger(timing.expectedChunkCount) || timing.expectedChunkCount < 1 ||
    timing.expectedChunkCount > 100_000 ||
    (timing.captionTrackRequired && !SHA256.test(timing.captionTrackHash ?? '')) ||
    (!timing.captionTrackRequired && timing.captionTrackHash !== null)
  ) errors.push('approved_master_timing_authority_invalid')
  for (const [field, value] of Object.entries({
    masterTimingArtifactHash: timing.masterTimingArtifactHash,
    sourceSequenceHash: timing.sourceSequenceHash,
    requiredLayerManifestHash: timing.requiredLayerManifestHash,
    approvedVisualExceptionManifestHash: timing.approvedVisualExceptionManifestHash,
    approvedAudioExceptionManifestHash: timing.approvedAudioExceptionManifestHash,
    approvedColorExceptionManifestHash: timing.approvedColorExceptionManifestHash,
  })) {
    if (!SHA256.test(value)) errors.push(`${field}_invalid`)
  }
  if (
    audioPolicy.policyId !== 'approved_web_delivery_audio_policy_v1' ||
    !Number.isFinite(audioPolicy.targetIntegratedLufs) ||
    audioPolicy.targetIntegratedLufs < -30 || audioPolicy.targetIntegratedLufs > -8 ||
    !Number.isFinite(audioPolicy.integratedLufsTolerance) ||
    audioPolicy.integratedLufsTolerance < 0 || audioPolicy.integratedLufsTolerance > 6 ||
    !Number.isFinite(audioPolicy.maximumTruePeakDbtp) ||
    audioPolicy.maximumTruePeakDbtp < -6 || audioPolicy.maximumTruePeakDbtp > 0 ||
    !Number.isFinite(audioPolicy.maximumLoudnessRangeLufs) ||
    audioPolicy.maximumLoudnessRangeLufs < 1 || audioPolicy.maximumLoudnessRangeLufs > 30 ||
    audioPolicy.maximumAvSyncDriftFrames !== 2 ||
    audioPolicy.speechClarityRequired !== true
  ) errors.push('approved_audio_policy_invalid')

  for (const [field, value] of Object.entries({
    finalMasterWorkItemId: execution.finalMasterWorkItemId,
    finalMasterJobId: execution.finalMasterJobId,
    finalMasterExecutionAttemptId: execution.finalMasterExecutionAttemptId,
    finalMasterLeaseId: execution.finalMasterLeaseId,
    finalMasterDispatchGrantId: execution.finalMasterDispatchGrantId,
  })) {
    if (!validId(value)) errors.push(`${field}_invalid`)
  }
  for (const [field, value] of Object.entries({
    finalMasterRunnerEvidenceHash: execution.finalMasterRunnerEvidenceHash,
    finalMasterAttemptCostEvidenceHash: execution.finalMasterAttemptCostEvidenceHash,
    finalMasterArtifactQaEvaluationHash: execution.finalMasterArtifactQaEvaluationHash,
    finalMasterArtifactReconciliationHash: execution.finalMasterArtifactReconciliationHash,
  })) {
    if (!SHA256.test(value)) errors.push(`${field}_invalid`)
  }
}

function validateGateCommon(
  input: CanonicalObjectiveFinalMasterQaInput,
  evidence: ObjectiveFinalMasterQaGateEvidence,
  errors: string[],
): void {
  const expected = EXPECTED_GATE_PROVENANCE[evidence.gateId]
  if (
    evidence.schemaVersion !== 'objective-final-master-qa-gate-evidence-v1' ||
    !validId(evidence.evidenceId) || !validId(evidence.executionAttemptId) ||
    !SHA256.test(evidence.evidenceArtifactHash) ||
    !SHA256.test(evidence.runtimeImageIdentityHash) ||
    !['private_local_test', 'private_gcp_internal'].includes(evidence.executionEnvironment) ||
    (evidence.executionEnvironment === 'private_local_test' &&
      evidence.cloudExecutionResourceHash !== null) ||
    (evidence.executionEnvironment === 'private_gcp_internal' &&
      !SHA256.test(evidence.cloudExecutionResourceHash ?? '')) ||
    !SHA256.test(evidence.internalCostEvidenceSetHash) ||
    evidence.qaRunId !== input.qaRunId ||
    evidence.approvedPlanSnapshotId !== input.identity.approvedPlanSnapshotId ||
    evidence.approvedExecutionPackageHash !== input.identity.approvedExecutionPackageHash ||
    evidence.sourceMasterArtifactId !== input.artifact.artifactId ||
    evidence.sourceMasterSha256 !== input.artifact.sha256 ||
    evidence.evidenceProfileId !== expected.evidenceProfileId ||
    evidence.toolId !== expected.toolId || evidence.operationId !== expected.operationId ||
    evidence.runnerClass !== expected.runnerClass ||
    !['passed', 'failed', 'needs_user_review'].includes(evidence.outcome) ||
    !validTimestamp(evidence.evaluatedAt) || evidence.providerCallMade !== false ||
    !validCommercialBoundary(evidence.commercialBoundary) ||
    evidence.evidenceHash !== evidenceHash(evidence)
  ) errors.push(`gate_contract_invalid:${evidence.gateId}`)
}

function validateGateMetrics(
  input: CanonicalObjectiveFinalMasterQaInput,
  evidence: ObjectiveFinalMasterQaGateEvidence,
  errors: string[],
): void {
  switch (evidence.gateId) {
    case 'technical_media_contract': {
      const metrics = evidence.metrics
      const shapeInvalid =
        typeof metrics.independentFfprobeExecuted !== 'boolean' ||
        !boundedText(metrics.binaryVersion) || !boundedText(metrics.container) ||
        !boundedText(metrics.videoCodecName) || !boundedText(metrics.pixelFormat) ||
        !boundedText(metrics.colorSpace) || !boundedText(metrics.colorTransfer) ||
        !boundedText(metrics.colorPrimaries) || !boundedText(metrics.colorRange) ||
        !boundedText(metrics.audioCodecName) ||
        !boundedInteger(metrics.videoStreamCount, 0, 64) ||
        !boundedInteger(metrics.audioStreamCount, 0, 64) ||
        !boundedInteger(metrics.width, 0, 16_384) ||
        !boundedInteger(metrics.height, 0, 16_384) ||
        !boundedInteger(metrics.frameRateNumerator, 0, 120_000) ||
        !boundedInteger(metrics.frameRateDenominator, 0, 120_000) ||
        !boundedInteger(metrics.frameCount, 0, 100_000_000) ||
        !boundedInteger(metrics.audioSampleRate, 0, 384_000) ||
        !boundedInteger(metrics.audioChannels, 0, 32) ||
        !boundedInteger(metrics.durationDriftFrames, 0, 100_000) ||
        !boundedInteger(metrics.maximumDurationDriftFrames, 0, 100_000)
      if (shapeInvalid) errors.push('technical_media_metrics_shape_invalid')
      if (evidence.outcome === 'passed' && (
        metrics.independentFfprobeExecuted !== true ||
        metrics.inspectionProfileId !== 'final_export_v1' ||
        metrics.binaryVersion !== '8.1.2' || metrics.container !== 'mp4' ||
        metrics.videoStreamCount !== 1 || metrics.videoCodecName !== 'h264' ||
        metrics.pixelFormat !== 'yuv420p' || metrics.colorSpace !== 'bt709' ||
        metrics.colorTransfer !== 'bt709' || metrics.colorPrimaries !== 'bt709' ||
        metrics.colorRange !== 'tv' ||
        metrics.width !== input.approval.exportAuthority.selectedFrame.width ||
        metrics.height !== input.approval.exportAuthority.selectedFrame.height ||
        metrics.frameRateNumerator !== input.timing.frameRateNumerator ||
        metrics.frameRateDenominator !== input.timing.frameRateDenominator ||
        metrics.frameCount !== input.timing.durationFrames ||
        metrics.audioStreamCount !== 1 || metrics.audioCodecName !== 'aac' ||
        metrics.audioSampleRate !== 48_000 || ![1, 2].includes(metrics.audioChannels) ||
        !Number.isSafeInteger(metrics.durationDriftFrames) ||
        metrics.durationDriftFrames < 0 || metrics.durationDriftFrames > 2 ||
        metrics.maximumDurationDriftFrames !== 2
      )) errors.push('technical_media_pass_policy_invalid')
      break
    }
    case 'decoded_video_integrity': {
      const metrics = evidence.metrics
      const counts = [
        metrics.decodeErrorCount,
        metrics.nonMonotonicTimestampCount,
        metrics.unexpectedBlackFrameCount,
        metrics.unexpectedFreezeFrameCount,
        metrics.unexpectedFlashFrameCount,
      ]
      if (
        typeof metrics.fullFrameDecodeCompleted !== 'boolean' ||
        typeof metrics.fullFrameCoverage !== 'boolean' ||
        !boundedInteger(metrics.firstDecodedFrame, -1, 100_000_000) ||
        !boundedInteger(metrics.lastDecodedFrame, -1, 100_000_000) ||
        !boundedInteger(metrics.decodedFrameCount, 0, 100_000_000) ||
        counts.some((value) => !boundedInteger(value, 0, 100_000_000)) ||
        !SHA256.test(metrics.approvedVisualExceptionManifestHash)
      ) errors.push('decoded_video_metrics_shape_invalid')
      if (evidence.outcome === 'passed' && (
        metrics.fullFrameDecodeCompleted !== true || metrics.firstDecodedFrame !== 0 ||
        metrics.lastDecodedFrame !== input.timing.durationFrames - 1 ||
        metrics.decodedFrameCount !== input.timing.durationFrames ||
        metrics.decodeErrorCount !== 0 || metrics.nonMonotonicTimestampCount !== 0 ||
        metrics.unexpectedBlackFrameCount !== 0 ||
        metrics.unexpectedFreezeFrameCount !== 0 ||
        metrics.unexpectedFlashFrameCount !== 0 ||
        metrics.approvedVisualExceptionManifestHash !==
          input.timing.approvedVisualExceptionManifestHash ||
        metrics.fullFrameCoverage !== true
      )) errors.push('decoded_video_pass_policy_invalid')
      break
    }
    case 'decoded_audio_quality_sync': {
      const metrics = evidence.metrics
      const lowerLufs = input.audioPolicy.targetIntegratedLufs -
        input.audioPolicy.integratedLufsTolerance
      const upperLufs = input.audioPolicy.targetIntegratedLufs +
        input.audioPolicy.integratedLufsTolerance
      if (
        typeof metrics.fullProgramAudioDecodeCompleted !== 'boolean' ||
        typeof metrics.speechClarityGatePassed !== 'boolean' ||
        !boundedInteger(metrics.sampleRate, 0, 384_000) ||
        !boundedInteger(metrics.channels, 0, 32) ||
        !boundedInteger(metrics.decodedSampleFrameCount, 0, Number.MAX_SAFE_INTEGER) ||
        !boundedAudioMetric(metrics.integratedLufs, -100, 10, evidence.outcome) ||
        !boundedAudioMetric(metrics.truePeakDbtp, -100, 10, evidence.outcome) ||
        !boundedAudioMetric(metrics.loudnessRangeLufs, 0, 100, evidence.outcome) ||
        !boundedFinite(metrics.avSyncDriftFrames, -100_000, 100_000) ||
        !boundedInteger(metrics.unexpectedClippedSampleCount, 0, Number.MAX_SAFE_INTEGER) ||
        !boundedInteger(metrics.unexpectedDigitalSilenceFrameCount, 0, 100_000_000) ||
        !SHA256.test(metrics.approvedAudioExceptionManifestHash)
      ) errors.push('decoded_audio_metrics_shape_invalid')
      if (evidence.outcome === 'passed' && (
        metrics.fullProgramAudioDecodeCompleted !== true || metrics.sampleRate !== 48_000 ||
        ![1, 2].includes(metrics.channels) ||
        !Number.isSafeInteger(metrics.decodedSampleFrameCount) ||
        metrics.decodedSampleFrameCount < 1 ||
        typeof metrics.integratedLufs !== 'number' ||
        !Number.isFinite(metrics.integratedLufs) || metrics.integratedLufs < lowerLufs ||
        metrics.integratedLufs > upperLufs ||
        typeof metrics.truePeakDbtp !== 'number' ||
        !Number.isFinite(metrics.truePeakDbtp) ||
        metrics.truePeakDbtp > input.audioPolicy.maximumTruePeakDbtp ||
        typeof metrics.loudnessRangeLufs !== 'number' ||
        !Number.isFinite(metrics.loudnessRangeLufs) ||
        metrics.loudnessRangeLufs < 0 ||
        metrics.loudnessRangeLufs > input.audioPolicy.maximumLoudnessRangeLufs ||
        !Number.isFinite(metrics.avSyncDriftFrames) ||
        Math.abs(metrics.avSyncDriftFrames) > input.audioPolicy.maximumAvSyncDriftFrames ||
        metrics.unexpectedClippedSampleCount !== 0 ||
        metrics.unexpectedDigitalSilenceFrameCount !== 0 ||
        metrics.approvedAudioExceptionManifestHash !==
          input.timing.approvedAudioExceptionManifestHash ||
        metrics.speechClarityGatePassed !== true
      )) errors.push('decoded_audio_pass_policy_invalid')
      break
    }
    case 'master_timing_layer_reconciliation': {
      const metrics = evidence.metrics
      if (
        !SHA256.test(metrics.masterTimingArtifactHash) ||
        !SHA256.test(metrics.sourceSequenceHash) ||
        !SHA256.test(metrics.requiredLayerManifestHash) ||
        (metrics.captionTrackHash !== null && !SHA256.test(metrics.captionTrackHash)) ||
        !boundedInteger(metrics.durationFrames, 0, 100_000_000) ||
        !boundedInteger(metrics.gapFrameCount, 0, 100_000_000) ||
        !boundedInteger(metrics.overlapFrameCount, 0, 100_000_000) ||
        !boundedInteger(metrics.missingRequiredLayerCount, 0, 100_000) ||
        !boundedInteger(metrics.finalPlaceholderCount, 0, 100_000) ||
        !boundedInteger(metrics.captionCollisionCount, 0, 100_000) ||
        typeof metrics.fullFrameCoverage !== 'boolean' ||
        typeof metrics.approvedSourceOrderPreserved !== 'boolean'
      ) errors.push('master_timing_layer_metrics_shape_invalid')
      if (evidence.outcome === 'passed' && (
        metrics.masterTimingArtifactHash !== input.timing.masterTimingArtifactHash ||
        metrics.sourceSequenceHash !== input.timing.sourceSequenceHash ||
        metrics.requiredLayerManifestHash !== input.timing.requiredLayerManifestHash ||
        metrics.captionTrackHash !== input.timing.captionTrackHash ||
        metrics.durationFrames !== input.timing.durationFrames ||
        metrics.gapFrameCount !== 0 || metrics.overlapFrameCount !== 0 ||
        metrics.missingRequiredLayerCount !== 0 || metrics.finalPlaceholderCount !== 0 ||
        metrics.captionCollisionCount !== 0 || metrics.fullFrameCoverage !== true ||
        metrics.approvedSourceOrderPreserved !== true
      )) errors.push('master_timing_layer_pass_policy_invalid')
      break
    }
    case 'cross_chunk_color_continuity': {
      const metrics = evidence.metrics
      const expectedBoundaryCount = input.timing.expectedChunkCount - 1
      if (
        !boundedInteger(metrics.chunkCount, 0, 100_000) ||
        !boundedInteger(metrics.expectedBoundaryCount, 0, 100_000) ||
        !boundedInteger(metrics.passedBoundaryCount, 0, 100_000) ||
        !boundedInteger(metrics.failedBoundaryCount, 0, 100_000) ||
        !SHA256.test(metrics.continuityEvidenceSetHash) ||
        !SHA256.test(metrics.approvedColorExceptionManifestHash) ||
        typeof metrics.allBoundariesAccountedFor !== 'boolean'
      ) errors.push('cross_chunk_color_metrics_shape_invalid')
      if (evidence.outcome === 'passed' && (
        metrics.chunkCount !== input.timing.expectedChunkCount ||
        metrics.expectedBoundaryCount !== expectedBoundaryCount ||
        metrics.passedBoundaryCount !== expectedBoundaryCount ||
        metrics.failedBoundaryCount !== 0 ||
        !SHA256.test(metrics.continuityEvidenceSetHash) ||
        metrics.approvedColorExceptionManifestHash !==
          input.timing.approvedColorExceptionManifestHash ||
        metrics.allBoundariesAccountedFor !== true
      )) errors.push('cross_chunk_color_pass_policy_invalid')
      break
    }
    case 'private_artifact_integrity': {
      const metrics = evidence.metrics
      if (
        !SHA256.test(metrics.reopenedSha256) ||
        !boundedInteger(metrics.reopenedByteLength, 0, REEDITPRO_SOURCE_MEDIA_MAX_BYTES) ||
        !SHA256.test(metrics.opaqueObjectIdentityHash) ||
        !SHA256.test(metrics.artifactQaEvaluationHash) ||
        !SHA256.test(metrics.artifactReconciliationHash) ||
        typeof metrics.createOnlyPersistenceVerified !== 'boolean' ||
        typeof metrics.privateReadbackVerified !== 'boolean' ||
        typeof metrics.publicUrlIssued !== 'boolean' ||
        typeof metrics.overwriteOccurred !== 'boolean'
      ) errors.push('private_artifact_metrics_shape_invalid')
      if (evidence.outcome === 'passed' && (
        metrics.reopenedSha256 !== input.artifact.sha256 ||
        metrics.reopenedByteLength !== input.artifact.byteLength ||
        metrics.opaqueObjectIdentityHash !== input.artifact.opaqueObjectIdentityHash ||
        metrics.artifactQaEvaluationHash !==
          input.execution.finalMasterArtifactQaEvaluationHash ||
        metrics.artifactReconciliationHash !==
          input.execution.finalMasterArtifactReconciliationHash ||
        metrics.createOnlyPersistenceVerified !== true ||
        metrics.privateReadbackVerified !== true || metrics.publicUrlIssued !== false ||
        metrics.overwriteOccurred !== false
      )) errors.push('private_artifact_pass_policy_invalid')
      break
    }
  }
}

function validateAudioAgainstTechnical(
  audio: ObjectiveDecodedAudioQualitySyncEvidence,
  technical: ObjectiveTechnicalMediaContractEvidence,
  errors: string[],
): void {
  if (audio.outcome === 'passed' && technical.outcome === 'passed' && (
    audio.metrics.sampleRate !== technical.metrics.audioSampleRate ||
    audio.metrics.channels !== technical.metrics.audioChannels
  )) errors.push('decoded_audio_stream_identity_mismatch')
}

function boundedInteger(value: number, minimum: number, maximum: number): boolean {
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum
}

function boundedFinite(value: number, minimum: number, maximum: number): boolean {
  return Number.isFinite(value) && value >= minimum && value <= maximum
}

function boundedAudioMetric(
  value: number | 'negative_infinity',
  minimum: number,
  maximum: number,
  outcome: ObjectiveFinalMasterQaGateEvidence['outcome'],
): boolean {
  if (value === 'negative_infinity') return outcome !== 'passed'
  return boundedFinite(value, minimum, maximum)
}

function boundedText(value: string): boolean {
  return typeof value === 'string' && value.length >= 1 && value.length <= 128
}

function validCommercialBoundary(
  boundary: ObjectiveFinalMasterQaGateEvidence['commercialBoundary'],
): boolean {
  return boundary.internalProductionCostOnly === true &&
    boundary.customerPriceAuthorityIncluded === false &&
    boundary.customerCreditAuthorityIncluded === false &&
    boundary.serviceFeeAuthorityIncluded === false &&
    boundary.customerChargeCreated === false &&
    boundary.walletMutationAuthorized === false &&
    boundary.billingAuthorized === false
}

function evidenceHash(evidence: ObjectiveFinalMasterQaGateEvidence): string {
  const withoutHash: Partial<ObjectiveFinalMasterQaGateEvidence> = { ...evidence }
  delete withoutHash.evidenceHash
  return sha256(stableStringify(withoutHash))
}

function validId(value: string): boolean {
  return IDENTITY.test(value) && !value.includes('..')
}

function validGeneration(value: string | null): boolean {
  return value !== null && /^[1-9][0-9]{0,30}$/u.test(value)
}

function validTimestamp(value: string): boolean {
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values)).sort()
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
