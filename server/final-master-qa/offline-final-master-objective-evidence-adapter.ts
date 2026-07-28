import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  OFFLINE_MEDIA_BINARY_FINAL_MASTER_AUDIO_QA_RECIPE,
  OFFLINE_MEDIA_BINARY_FINAL_MASTER_VIDEO_QA_RECIPE,
  sealOfflineFinalMasterAudioExceptionManifest,
  sealOfflineFinalMasterVisualExceptionManifest,
  type OfflineFinalMasterAudioExceptionManifest,
  type OfflineFinalMasterAudioQaExecutionResult,
  type OfflineFinalMasterVisualExceptionManifest,
  type OfflineFinalMasterVideoQaExecutionResult,
} from '../tool-execution/media-binary-execution'
import {
  PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS,
  privateInternalAttemptCostEvidenceSchema,
  type PrivateInternalAttemptCostEvidence,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import {
  OBJECTIVE_FINAL_MASTER_DECODED_AUDIO_EVIDENCE_PROFILE_ID,
  OBJECTIVE_FINAL_MASTER_DECODED_AUDIO_RUNNER_CLASS,
  OBJECTIVE_FINAL_MASTER_DECODED_VIDEO_EVIDENCE_PROFILE_ID,
  OBJECTIVE_FINAL_MASTER_DECODED_VIDEO_RUNNER_CLASS,
  type ObjectiveDecodedAudioQualitySyncEvidence,
  type ObjectiveDecodedVideoIntegrityEvidence,
} from './objective-final-master-qa-types'
import { sealObjectiveFinalMasterQaGateEvidence } from './objective-final-master-qa'

const SHA256 = /^[a-f0-9]{64}$/u
const IDENTITY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u

export interface OfflineFinalMasterObjectiveEvidenceAuthority {
  workspaceId: string
  projectId: string
  editSessionId: string
  qaRunId: string
  approvedPlanSnapshotId: string
  approvedPlanSnapshotHash: string
  approvedExecutionPackageHash: string
  approvedEstimateId: string
  creditReservationId: string
  approvedDeliverableId: string
  expectedEvidenceIdentity: string
  approvedWorkItemId: string
  jobId: string
  executionAttemptId: string
  sourceMasterArtifactId: string
  sourceMasterObjectIdentityHash: string
  sourceMasterSha256: string
  sourceMasterByteLength: number
  expectedDurationFrames: number
  approvedExceptionManifestHash: string
  approvedExceptionManifest:
    | OfflineFinalMasterVisualExceptionManifest
    | OfflineFinalMasterAudioExceptionManifest
  expectedRequestEnvelopeSha256: string
  expectedRuntimeImageIdentityHash: string
}

export function compileOfflineFinalMasterVideoObjectiveEvidence(input: {
  authority: OfflineFinalMasterObjectiveEvidenceAuthority
  runnerResult: OfflineFinalMasterVideoQaExecutionResult
  attemptCostEvidence: PrivateInternalAttemptCostEvidence
}): ObjectiveDecodedVideoIntegrityEvidence {
  const validated = validateCommon({
    ...input,
    resultSchemaVersion: 'offline-final-master-decoded-video-qa-result-v1',
    recipeProfileId: OFFLINE_MEDIA_BINARY_FINAL_MASTER_VIDEO_QA_RECIPE,
    costProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedVideoQa,
    gateId: 'decoded_video_integrity',
  })
  const decoded = record(
    validated.document.decodedFrameIntegrity,
    'Decoded-video integrity evidence is missing.',
  )
  const anomalies = record(
    validated.document.visualAnomalyScan,
    'Decoded-video anomaly evidence is missing.',
  )
  const decodedFrameCount = boundedInteger(
    decoded.decodedFrameCount,
    1,
    100_000_000,
    'Decoded-video frame count is invalid.',
  )
  const expectedFrameCount = boundedInteger(
    decoded.expectedFrameCount,
    1,
    100_000_000,
    'Decoded-video expected frame count is invalid.',
  )
  const firstFrameDurationTicks = boundedInteger(
    decoded.firstFrameDurationTicks,
    1,
    3,
    'Decoded-video first-frame duration is outside the approved start offset.',
  )
  if (
    expectedFrameCount !== input.authority.expectedDurationFrames ||
    decodedFrameCount !== expectedFrameCount ||
    decoded.sequentialDtsPtsVerified !== true ||
    decoded.checksumTimestampNormalization !==
      'decoded_frame_ordinal_no_drop_or_duplication_v1' ||
    decoded.originalTimestampAuthority !==
      'independent_exact_technical_probe_v1' ||
    firstFrameDurationTicks > 3 ||
    decoded.maximumFirstFrameDurationTicks !== 3 ||
    decoded.firstFrameDurationWithinApprovedStartOffset !== true ||
    decoded.subsequentOneFrameDurationsVerified !== true ||
    decoded.perFrameSha256Verified !== true ||
    decoded.retainedPerFramePayloads !== false ||
    decoded.exactSourceBytesVerified !== input.authority.sourceMasterByteLength ||
    decoded.exactSourceSha256Verified !== input.authority.sourceMasterSha256 ||
    decoded.outcome !== 'passed'
  ) throw invalid('Decoded-video runner lost full-frame integrity authority.')

  const approvedExceptionRanges = validateVisualExceptionManifest(
    input.authority,
  )
  const findings = boundedRecords(
    anomalies.findings,
    8_192,
    'Decoded-video findings are invalid.',
  )
  let unexpectedBlackFrameCount = 0
  let unexpectedFreezeFrameCount = 0
  let unexpectedFlashFrameCount = 0
  let unexpectedFindingCount = 0
  let approvedFindingCount = 0
  for (const finding of findings) {
    const kind = finding.kind
    const disposition = finding.disposition
    const startFrame = boundedInteger(
      finding.startFrame,
      0,
      input.authority.expectedDurationFrames - 1,
      'Decoded-video finding start is invalid.',
    )
    const endFrameExclusive = boundedInteger(
      finding.endFrameExclusive,
      1,
      input.authority.expectedDurationFrames,
      'Decoded-video finding end is invalid.',
    )
    const durationFrames = boundedInteger(
      finding.durationFrames,
      1,
      input.authority.expectedDurationFrames,
      'Decoded-video finding duration is invalid.',
    )
    if (!['black_range', 'freeze_range', 'scene_change'].includes(String(kind))) {
      throw invalid('Decoded-video finding kind is unsupported.')
    }
    const expectedFindingId = `visual-${sha256AuthorityValue({
      kind,
      startFrame,
      endFrameExclusive,
      durationFrames,
    }).slice(0, 24)}`
    if (
      endFrameExclusive <= startFrame ||
      durationFrames !== endFrameExclusive - startFrame ||
      finding.findingId !== expectedFindingId
    ) throw invalid('Decoded-video finding range or identity changed.')
    const expectedApprovedException = approvedExceptionRanges.find((range) =>
      range.kind === (kind === 'black_range'
        ? 'approved_black_hold'
        : kind === 'freeze_range'
          ? 'approved_freeze_hold'
          : 'approved_flash_or_cut') &&
      range.startFrame <= startFrame &&
      range.endFrameExclusive >= endFrameExclusive)
    validateFindingDispositionAuthority(
      finding,
      disposition,
      expectedApprovedException,
    )
    if (disposition === 'approved_exception') {
      approvedFindingCount += 1
      continue
    }
    if (disposition !== 'needs_user_review') {
      throw invalid('Decoded-video finding disposition is unsupported.')
    }
    unexpectedFindingCount += 1
    if (kind === 'black_range') unexpectedBlackFrameCount += durationFrames
    if (kind === 'freeze_range') unexpectedFreezeFrameCount += durationFrames
    if (kind === 'scene_change') unexpectedFlashFrameCount += durationFrames
  }
  if (
    boundedInteger(
      anomalies.detectedFindingCount,
      0,
      8_192,
      'Decoded-video detected-finding count is invalid.',
    ) !== findings.length ||
    boundedInteger(
      anomalies.unexpectedFindingCount,
      0,
      8_192,
      'Decoded-video unexpected-finding count is invalid.',
    ) !== unexpectedFindingCount ||
    boundedInteger(
      anomalies.approvedExceptionFindingCount,
      0,
      8_192,
      'Decoded-video approved-finding count is invalid.',
    ) !== approvedFindingCount ||
    anomalies.exceptionManifestHash !==
      input.authority.approvedExceptionManifestHash
  ) throw invalid('Decoded-video anomaly reconciliation changed.')

  const outcome = objectiveOutcome(validated.document.outcome)
  if (
    anomalies.outcome !== outcome ||
    (outcome === 'passed' && unexpectedFindingCount !== 0) ||
    (outcome === 'needs_user_review' && unexpectedFindingCount === 0)
  ) throw invalid('Decoded-video objective outcome contradicts its findings.')
  if (
    validated.semantic.independentTechnicalProbeExecuted !== true ||
    validated.semantic.fullDecodedFrameStreamVerified !== true ||
    validated.semantic.decodedFrameCount !== decodedFrameCount ||
    validated.semantic.visualAnomalyPolicyExecuted !== true ||
    validated.semantic.visualAnomalyOutcome !== outcome ||
    validated.checks.exactPrivateArtifactReopenedForEveryPass !== 'passed' ||
    validated.checks.exactSourceBytesAndShaVerifiedForEveryPass !== 'passed' ||
    validated.checks.h264Yuv420pBt709ProfessionalFrameVerified !== 'passed' ||
    validated.checks.everyDecodedFrameAccountedFor !== 'passed' ||
    validated.checks.visualAnomaliesReconciledAgainstApprovedExceptions !==
      outcome
  ) throw invalid('Decoded-video runner semantic proof changed.')

  return sealObjectiveFinalMasterQaGateEvidence({
    ...validated.common,
    gateId: 'decoded_video_integrity',
    evidenceProfileId:
      OBJECTIVE_FINAL_MASTER_DECODED_VIDEO_EVIDENCE_PROFILE_ID,
    toolId: 'ffmpeg',
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
    runnerClass: OBJECTIVE_FINAL_MASTER_DECODED_VIDEO_RUNNER_CLASS,
    outcome,
    metrics: {
      fullFrameDecodeCompleted: true,
      firstDecodedFrame: 0,
      lastDecodedFrame: decodedFrameCount - 1,
      decodedFrameCount,
      decodeErrorCount: 0,
      nonMonotonicTimestampCount: 0,
      unexpectedBlackFrameCount,
      unexpectedFreezeFrameCount,
      unexpectedFlashFrameCount,
      approvedVisualExceptionManifestHash:
        input.authority.approvedExceptionManifestHash,
      fullFrameCoverage: true,
    },
  })
}

export function compileOfflineFinalMasterAudioObjectiveEvidence(input: {
  authority: OfflineFinalMasterObjectiveEvidenceAuthority
  runnerResult: OfflineFinalMasterAudioQaExecutionResult
  attemptCostEvidence: PrivateInternalAttemptCostEvidence
}): ObjectiveDecodedAudioQualitySyncEvidence {
  const validated = validateCommon({
    ...input,
    resultSchemaVersion: 'offline-final-master-decoded-audio-qa-result-v1',
    recipeProfileId: OFFLINE_MEDIA_BINARY_FINAL_MASTER_AUDIO_QA_RECIPE,
    costProfileId:
      PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFinalMasterDecodedAudioQa,
    gateId: 'decoded_audio_quality_sync',
  })
  const decoded = record(
    validated.document.decodedAudioIntegrity,
    'Decoded-audio integrity evidence is missing.',
  )
  const quality = record(
    validated.document.audioQualityScan,
    'Decoded-audio quality evidence is missing.',
  )
  const speech = record(
    validated.document.speechClarity,
    'Decoded-audio speech-clarity evidence is missing.',
  )
  const technicalProbe = record(
    validated.document.technicalProbe,
    'Decoded-audio technical probe is missing.',
  )
  const technicalVideo = record(
    technicalProbe.video,
    'Decoded-audio technical video identity is missing.',
  )
  const sampleRate = boundedInteger(
    decoded.sampleRate,
    1,
    384_000,
    'Decoded-audio sample rate is invalid.',
  )
  const channels = boundedInteger(
    decoded.channels,
    1,
    32,
    'Decoded-audio channel count is invalid.',
  )
  const decodedSampleFrameCount = boundedInteger(
    decoded.decodedSampleCount,
    1,
    Number.MAX_SAFE_INTEGER,
    'Decoded-audio sample count is invalid.',
  )
  const avSyncDriftFrames = boundedNumber(
    decoded.avSyncDriftFrames,
    0,
    100_000,
    'Decoded-audio A/V drift is invalid.',
  )
  const fps = boundedNumber(
    technicalVideo.fps,
    1,
    240,
    'Decoded-audio frame rate is invalid.',
  )
  const expectedSampleCount = boundedInteger(
    decoded.expectedSampleCount,
    1,
    Number.MAX_SAFE_INTEGER,
    'Decoded-audio expected sample count is invalid.',
  )
  const authorityExpectedSampleCount =
    input.authority.expectedDurationFrames * (sampleRate / fps)
  if (
    sampleRate !== 48_000 || ![1, 2].includes(channels) ||
    !Number.isSafeInteger(authorityExpectedSampleCount) ||
    expectedSampleCount !== authorityExpectedSampleCount ||
    decoded.contiguousDtsPtsVerified !== true ||
    decoded.checksumTimestampNormalization !==
      'decoded_sample_ordinal_no_drop_or_duplication_v1' ||
    decoded.originalTimestampAuthority !==
      'independent_exact_technical_probe_v1' ||
    decoded.packetSampleDurationsVerified !== true ||
    decoded.perPacketSha256Verified !== true ||
    decoded.retainedPerPacketPayloads !== false ||
    decoded.exactSourceBytesVerified !== input.authority.sourceMasterByteLength ||
    decoded.exactSourceSha256Verified !== input.authority.sourceMasterSha256 ||
    decoded.maximumAvSyncDriftFrames !== 2 ||
    !['passed', 'needs_user_review'].includes(String(decoded.avSyncOutcome))
  ) throw invalid('Decoded-audio runner lost full-program integrity authority.')

  const integratedLufs = audioMetric(
    quality.integratedLufs,
    -100,
    10,
    'Decoded-audio integrated loudness is invalid.',
  )
  const truePeakDbtp = audioMetric(
    quality.truePeakDbtp,
    -100,
    10,
    'Decoded-audio true peak is invalid.',
  )
  const loudnessRangeLufs = audioMetric(
    quality.loudnessRangeLufs,
    0,
    100,
    'Decoded-audio loudness range is invalid.',
  )
  const unexpectedClippedSampleCount = boundedInteger(
    quality.unexpectedClippedSampleCount,
    0,
    Number.MAX_SAFE_INTEGER,
    'Decoded-audio clipped-sample count is invalid.',
  )
  const approvedExceptionRanges = validateAudioExceptionManifest(
    input.authority,
  )
  const silences = boundedRecords(
    quality.silences,
    8_192,
    'Decoded-audio silence findings are invalid.',
  )
  let unexpectedSilenceCount = 0
  let approvedSilenceCount = 0
  let unexpectedDigitalSilenceFrameCount = 0
  for (const silence of silences) {
    const startFrame = boundedInteger(
      silence.startFrame,
      0,
      input.authority.expectedDurationFrames - 1,
      'Decoded-audio silence start is invalid.',
    )
    const endFrameExclusive = boundedInteger(
      silence.endFrameExclusive,
      1,
      input.authority.expectedDurationFrames,
      'Decoded-audio silence end is invalid.',
    )
    const durationFrames = boundedInteger(
      silence.durationFrames,
      1,
      input.authority.expectedDurationFrames,
      'Decoded-audio silence duration is invalid.',
    )
    if (silence.kind !== 'digital_silence_range') {
      throw invalid('Decoded-audio silence kind is unsupported.')
    }
    const expectedFindingId = `silence-${sha256AuthorityValue({
      kind: silence.kind,
      startFrame,
      endFrameExclusive,
      durationFrames,
    }).slice(0, 24)}`
    if (
      endFrameExclusive <= startFrame ||
      durationFrames !== endFrameExclusive - startFrame ||
      silence.findingId !== expectedFindingId
    ) throw invalid('Decoded-audio silence range or identity changed.')
    const expectedApprovedException = approvedExceptionRanges.find((range) =>
      range.startFrame <= startFrame &&
      range.endFrameExclusive >= endFrameExclusive)
    validateFindingDispositionAuthority(
      silence,
      silence.disposition,
      expectedApprovedException,
    )
    if (silence.disposition === 'approved_exception') {
      approvedSilenceCount += 1
      continue
    }
    if (silence.disposition !== 'needs_user_review') {
      throw invalid('Decoded-audio silence disposition is unsupported.')
    }
    unexpectedSilenceCount += 1
    unexpectedDigitalSilenceFrameCount += durationFrames
  }
  if (
    boundedInteger(
      quality.detectedSilenceCount,
      0,
      8_192,
      'Decoded-audio detected-silence count is invalid.',
    ) !== silences.length ||
    boundedInteger(
      quality.unexpectedSilenceCount,
      0,
      8_192,
      'Decoded-audio unexpected-silence count is invalid.',
    ) !== unexpectedSilenceCount ||
    approvedSilenceCount + unexpectedSilenceCount !== silences.length ||
    quality.exceptionManifestHash !==
      input.authority.approvedExceptionManifestHash ||
    speech.source !== 'separate_bound_speech_clarity_evidence' ||
    typeof speech.evidenceHash !== 'string' ||
    !SHA256.test(speech.evidenceHash) ||
    speech.ffmpegClaimedSpeechUnderstanding !== false ||
    !['passed', 'needs_user_review'].includes(String(speech.status))
  ) throw invalid('Decoded-audio QA reconciliation changed.')

  const targetIntegratedLufs = boundedNumber(
    quality.targetIntegratedLufs,
    -100,
    10,
    'Decoded-audio loudness target is invalid.',
  )
  const integratedLufsTolerance = boundedNumber(
    quality.integratedLufsTolerance,
    0,
    20,
    'Decoded-audio loudness tolerance is invalid.',
  )
  const maximumTruePeakDbtp = boundedNumber(
    quality.maximumTruePeakDbtp,
    -100,
    10,
    'Decoded-audio peak policy is invalid.',
  )
  const maximumLoudnessRangeLufs = boundedNumber(
    quality.maximumLoudnessRangeLufs,
    0,
    100,
    'Decoded-audio loudness-range policy is invalid.',
  )
  const astatsPeakLevelDb = audioMetric(
    quality.astatsPeakLevelDb,
    -100,
    10,
    'Decoded-audio PCM peak is invalid.',
  )
  const astatsPeakCount = boundedInteger(
    quality.astatsPeakCount,
    0,
    Number.MAX_SAFE_INTEGER,
    'Decoded-audio PCM peak count is invalid.',
  )
  const numberOfNaNs = boundedInteger(
    quality.numberOfNaNs,
    0,
    Number.MAX_SAFE_INTEGER,
    'Decoded-audio NaN count is invalid.',
  )
  const numberOfInfs = boundedInteger(
    quality.numberOfInfs,
    0,
    Number.MAX_SAFE_INTEGER,
    'Decoded-audio infinity count is invalid.',
  )
  const integratedLufsWithinPolicy = typeof integratedLufs === 'number' &&
    Math.abs(integratedLufs - targetIntegratedLufs) <= integratedLufsTolerance
  const truePeakWithinPolicy = typeof truePeakDbtp === 'number' &&
    truePeakDbtp <= maximumTruePeakDbtp
  const loudnessRangeWithinPolicy = typeof loudnessRangeLufs === 'number' &&
    loudnessRangeLufs <= maximumLoudnessRangeLufs
  const decodedSignalFinite = numberOfNaNs === 0 && numberOfInfs === 0
  const derivedClippedSampleCount = typeof astatsPeakLevelDb === 'number' &&
    astatsPeakLevelDb >= 0 ? astatsPeakCount : 0
  const derivedQualityOutcome =
    integratedLufsWithinPolicy && truePeakWithinPolicy &&
    loudnessRangeWithinPolicy && decodedSignalFinite &&
    derivedClippedSampleCount === 0 && unexpectedSilenceCount === 0
      ? 'passed' as const
      : 'needs_user_review' as const
  if (
    quality.integratedLufsWithinPolicy !== integratedLufsWithinPolicy ||
    quality.truePeakWithinPolicy !== truePeakWithinPolicy ||
    quality.loudnessRangeWithinPolicy !== loudnessRangeWithinPolicy ||
    quality.decodedSignalFinite !== decodedSignalFinite ||
    unexpectedClippedSampleCount !== derivedClippedSampleCount ||
    quality.outcome !== derivedQualityOutcome ||
    decoded.avSyncOutcome !==
      (avSyncDriftFrames <= 2 ? 'passed' : 'needs_user_review')
  ) throw invalid('Decoded-audio policy calculations changed.')

  const outcome = objectiveOutcome(validated.document.outcome)
  const expectedOutcome = decoded.avSyncOutcome === 'passed' &&
    quality.outcome === 'passed' ? 'passed' : 'needs_user_review'
  const speechClarityGatePassed = speech.status === 'passed'
  if (
    outcome !== expectedOutcome ||
    (outcome === 'passed' && (
      integratedLufs === 'negative_infinity' ||
      truePeakDbtp === 'negative_infinity' ||
      loudnessRangeLufs === 'negative_infinity' ||
      decoded.avSyncOutcome !== 'passed' ||
      quality.outcome !== 'passed' ||
      unexpectedClippedSampleCount !== 0 ||
      unexpectedSilenceCount !== 0 ||
      !speechClarityGatePassed
    ))
  ) throw invalid('Decoded-audio objective outcome contradicts its metrics.')
  if (
    validated.semantic.independentTechnicalProbeExecuted !== true ||
    validated.semantic.fullDecodedAudioStreamVerified !== true ||
    validated.semantic.decodedSampleCount !== decodedSampleFrameCount ||
    validated.semantic.avSyncDriftFrames !== avSyncDriftFrames ||
    validated.semantic.audioQualityPolicyExecuted !== true ||
    validated.semantic.audioQualityOutcome !== quality.outcome ||
    validated.semantic.separateSpeechClarityEvidenceReconciled !== true ||
    validated.semantic.ffmpegClaimedSpeechUnderstanding !== false ||
    validated.checks.exactPrivateArtifactReopenedForEveryPass !== 'passed' ||
    validated.checks.exactSourceBytesAndShaVerifiedForEveryPass !== 'passed' ||
    validated.checks.aac48000HzChannelContractVerified !== 'passed' ||
    validated.checks.everyDecodedAudioSampleRangeAccountedFor !== 'passed' ||
    validated.checks.avSyncWithinApprovedFrameTolerance !==
      decoded.avSyncOutcome ||
    validated.checks.loudnessPeakRangeAndSilencePolicy !== quality.outcome ||
    validated.checks.separateSpeechClarityEvidenceReconciled !== 'passed' ||
    input.runnerResult.readiness.speechClarityEvidenceReconciled !== true
  ) throw invalid('Decoded-audio runner semantic proof changed.')

  return sealObjectiveFinalMasterQaGateEvidence({
    ...validated.common,
    gateId: 'decoded_audio_quality_sync',
    evidenceProfileId:
      OBJECTIVE_FINAL_MASTER_DECODED_AUDIO_EVIDENCE_PROFILE_ID,
    toolId: 'ffmpeg',
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
    runnerClass: OBJECTIVE_FINAL_MASTER_DECODED_AUDIO_RUNNER_CLASS,
    outcome,
    metrics: {
      fullProgramAudioDecodeCompleted: true,
      sampleRate,
      channels,
      decodedSampleFrameCount,
      integratedLufs,
      truePeakDbtp,
      loudnessRangeLufs,
      avSyncDriftFrames,
      unexpectedClippedSampleCount,
      unexpectedDigitalSilenceFrameCount,
      approvedAudioExceptionManifestHash:
        input.authority.approvedExceptionManifestHash,
      speechClarityGatePassed,
    },
  })
}

type CommonRunnerResult =
  | OfflineFinalMasterVideoQaExecutionResult
  | OfflineFinalMasterAudioQaExecutionResult

function validateCommon(input: {
  authority: OfflineFinalMasterObjectiveEvidenceAuthority
  runnerResult: CommonRunnerResult
  attemptCostEvidence: PrivateInternalAttemptCostEvidence
  resultSchemaVersion: string
  recipeProfileId: string
  costProfileId: string
  gateId: 'decoded_video_integrity' | 'decoded_audio_quality_sync'
}) {
  validateAuthority(input.authority)
  const parsedCost = privateInternalAttemptCostEvidenceSchema.safeParse(
    input.attemptCostEvidence,
  )
  if (!parsedCost.success) throw invalid('Final-master attempt-cost evidence is invalid.')
  const cost = parsedCost.data
  const { evidenceHash, ...costWithoutHash } = cost
  if (sha256AuthorityValue(costWithoutHash) !== evidenceHash) {
    throw invalid('Final-master attempt-cost evidence checksum changed.')
  }
  if (
    cost.boundary !== 'internal_production_cost_only' ||
    cost.outcome.status !== 'completed' ||
    cost.outcome.failureCategory !== 'none' ||
    cost.identity.toolId !== 'ffmpeg' ||
    !('workloadProfileId' in cost.identity) ||
    cost.identity.operationId !==
      'tool.ffmpeg.execute_approved_media_recipe.v1' ||
    cost.identity.workloadProfileId !== input.costProfileId ||
    cost.identity.workspaceId !== input.authority.workspaceId ||
    cost.identity.projectId !== input.authority.projectId ||
    cost.identity.editSessionId !== input.authority.editSessionId ||
    cost.identity.approvedPlanSnapshotId !==
      input.authority.approvedPlanSnapshotId ||
    cost.identity.approvedWorkItemId !== input.authority.approvedWorkItemId ||
    cost.identity.jobId !== input.authority.jobId ||
    cost.identity.executionAttemptId !== input.authority.executionAttemptId ||
    cost.actualInternalCostMicros <= 0
  ) throw invalid('Final-master attempt-cost identity changed.')

  const result = input.runnerResult
  if (
    result.resultJson.mimeType !== 'application/json' ||
    !Buffer.isBuffer(result.resultJson.bytes) ||
    result.resultJson.byteLength !== result.resultJson.bytes.byteLength ||
    sha256(result.resultJson.bytes) !== result.resultJson.sha256 ||
    result.evidence.resultSha256 !== result.resultJson.sha256 ||
    result.evidence.sourceSha256 !== input.authority.sourceMasterSha256 ||
    result.evidence.toolId !== 'ffmpeg' ||
    result.evidence.operationId !==
      'tool.ffmpeg.execute_approved_media_recipe.v1' ||
    result.evidence.binaryVersion !== '8.1.2' ||
    result.evidence.containerExitCode !== 0 ||
    result.evidence.oomKilled !== false ||
    cost.resourceUsage.outputByteLength !== result.resultJson.byteLength ||
    cost.linkedCanonicalOutcomeHash !== result.resultJson.sha256
  ) throw invalid('Final-master runner result or cost linkage changed.')
  const expectedResultBytes = Buffer.from(
    `${stableAuthorityStringify(result.resultJson.document)}\n`,
  )
  if (!expectedResultBytes.equals(result.resultJson.bytes)) {
    throw invalid('Final-master runner result bytes changed from its document.')
  }
  const document = record(
    result.resultJson.document,
    'Final-master runner document is invalid.',
  )
  const finalMaster = record(
    document.finalMaster,
    'Final-master runner artifact identity is missing.',
  )
  const checks = record(
    document.checks,
    'Final-master runner checks are missing.',
  )
  const semantic = record(
    result.evidence.semanticEvidence,
    'Final-master runner semantic evidence is missing.',
  )
  validateRuntimeImage(result.image, input.authority)
  validateRuntimeConfinement(result.evidence.confinement, input.gateId)
  if (
    document.schemaVersion !== input.resultSchemaVersion ||
    document.source !== (input.gateId === 'decoded_video_integrity'
      ? 'private_exact_mp4_full_decoded_video_objective_qa'
      : 'private_exact_mp4_full_decoded_audio_objective_qa') ||
    document.qaRunId !== input.authority.qaRunId ||
    document.approvedPlanSnapshotId !==
      input.authority.approvedPlanSnapshotId ||
    document.approvedPlanSnapshotHash !==
      input.authority.approvedPlanSnapshotHash ||
    document.approvedExecutionPackageHash !==
      input.authority.approvedExecutionPackageHash ||
    document.approvedEstimateId !== input.authority.approvedEstimateId ||
    document.creditReservationId !== input.authority.creditReservationId ||
    document.approvedDeliverableId !== input.authority.approvedDeliverableId ||
    document.expectedEvidenceIdentity !==
      input.authority.expectedEvidenceIdentity ||
    document.requestEnvelopeSha256 !==
      input.authority.expectedRequestEnvelopeSha256 ||
    finalMaster.artifactId !== input.authority.sourceMasterArtifactId ||
    finalMaster.objectIdentityHash !==
      input.authority.sourceMasterObjectIdentityHash ||
    finalMaster.sha256 !== input.authority.sourceMasterSha256 ||
    finalMaster.byteLength !== input.authority.sourceMasterByteLength ||
    finalMaster.privateObject !== true || finalMaster.placeholder !== false ||
    finalMaster.publicObject !== false ||
    document.evaluatedAt !== result.attestation.completedAt ||
    result.evidence.requestEnvelopeSha256 !==
      input.authority.expectedRequestEnvelopeSha256 ||
    semantic.recipeProfileId !== input.recipeProfileId ||
    semantic.fixedRecipeExecuted !== true ||
    semantic.exactPrivateFinalMasterVerified !== true ||
    semantic.mediaMutationPerformed !== false ||
    semantic.providerCallPerformed !== false ||
    semantic.originalApprovedEditReservationUsed !== true ||
    semantic.separateExportEstimateRequired !== false ||
    semantic.additionalExportChargeAllowed !== false ||
    semantic.longFormCheckpointingProven !== false ||
    semantic.googleCloudWorkerExecutionProven !== false ||
    semantic.canonicalLeaseVerified !== false ||
    semantic.singleUseDispatchVerified !== false ||
    semantic.internalCostEvidenceReconciled !== false ||
    semantic.canonicalQaAggregationReady !== false ||
    semantic.publicDeliveryAuthorized !== false ||
    checks.providerCallPerformed !== false || checks.mediaMutationPerformed !== false ||
    checks.originalApprovedEditReservationUsed !== true ||
    checks.separateExportEstimateRequired !== false ||
    checks.additionalExportChargeAllowed !== false ||
    result.readiness.privateInternalOnly !== true ||
    result.readiness.exactPrivateArtifactDecoded !== true ||
    result.readiness.longFormCheckpointingReady !== false ||
    result.readiness.googleCloudWorkerReady !== false ||
    result.readiness.canonicalLeaseVerified !== false ||
    result.readiness.singleUseDispatchVerified !== false ||
    result.readiness.internalCostEvidenceReconciled !== false ||
    result.readiness.canonicalQaAggregationReady !== false ||
    result.readiness.publicDeliveryReady !== false ||
    result.readiness.productReady !== false ||
    result.readiness.externalBetaReady !== false ||
    result.readiness.productionReady !== false ||
    result.image.imageIdentityHash !==
      input.authority.expectedRuntimeImageIdentityHash ||
    !SHA256.test(result.attestation.attestationHash) ||
    !SHA256.test(result.attestation.recordId) ||
    !validTimestamp(result.attestation.completedAt)
  ) throw invalid('Final-master runner authority or readiness boundary changed.')

  const internalCostEvidenceSetHash = sha256AuthorityValue({
    domain: 'objective_final_master_internal_cost_evidence_set_v1',
    attemptCostEvidenceHashes: [cost.evidenceHash],
  })
  const evidenceId = `objectivegate_${sha256AuthorityValue({
    domain: 'offline_final_master_objective_evidence_identity_v1',
    gateId: input.gateId,
    resultSha256: result.resultJson.sha256,
    attemptCostEvidenceHash: cost.evidenceHash,
  }).slice(0, 48)}`
  return {
    document,
    checks,
    semantic,
    common: {
      schemaVersion: 'objective-final-master-qa-gate-evidence-v1' as const,
      evidenceId,
      evidenceArtifactHash: result.resultJson.sha256,
      qaRunId: input.authority.qaRunId,
      approvedPlanSnapshotId: input.authority.approvedPlanSnapshotId,
      approvedExecutionPackageHash:
        input.authority.approvedExecutionPackageHash,
      sourceMasterArtifactId: input.authority.sourceMasterArtifactId,
      sourceMasterSha256: input.authority.sourceMasterSha256,
      executionAttemptId: input.authority.executionAttemptId,
      runtimeImageIdentityHash: result.image.imageIdentityHash,
      executionEnvironment: 'private_local_test' as const,
      cloudExecutionResourceHash: null,
      internalCostEvidenceSetHash,
      evaluatedAt: result.attestation.completedAt,
      commercialBoundary: {
        internalProductionCostOnly: true as const,
        customerPriceAuthorityIncluded: false as const,
        customerCreditAuthorityIncluded: false as const,
        serviceFeeAuthorityIncluded: false as const,
        customerChargeCreated: false as const,
        walletMutationAuthorized: false as const,
        billingAuthorized: false as const,
      },
      providerCallMade: false as const,
    },
  }
}

function validateAuthority(
  authority: OfflineFinalMasterObjectiveEvidenceAuthority,
): void {
  for (const value of [
    authority.workspaceId,
    authority.projectId,
    authority.editSessionId,
    authority.qaRunId,
    authority.approvedPlanSnapshotId,
    authority.approvedEstimateId,
    authority.creditReservationId,
    authority.approvedDeliverableId,
    authority.expectedEvidenceIdentity,
    authority.approvedWorkItemId,
    authority.jobId,
    authority.executionAttemptId,
    authority.sourceMasterArtifactId,
  ]) {
    if (!IDENTITY.test(value) || value.includes('..')) {
      throw invalid('Final-master objective adapter identity is invalid.')
    }
  }
  for (const value of [
    authority.approvedPlanSnapshotHash,
    authority.approvedExecutionPackageHash,
    authority.sourceMasterObjectIdentityHash,
    authority.sourceMasterSha256,
    authority.approvedExceptionManifestHash,
    authority.expectedRequestEnvelopeSha256,
    authority.expectedRuntimeImageIdentityHash,
  ]) {
    if (!SHA256.test(value)) {
      throw invalid('Final-master objective adapter hash is invalid.')
    }
  }
  boundedInteger(
    authority.sourceMasterByteLength,
    64,
    Number.MAX_SAFE_INTEGER,
    'Final-master objective adapter byte length is invalid.',
  )
  boundedInteger(
    authority.expectedDurationFrames,
    1,
    100_000_000,
    'Final-master objective adapter duration is invalid.',
  )
}

function objectiveOutcome(value: unknown): 'passed' | 'needs_user_review' {
  if (value === 'passed' || value === 'needs_user_review') return value
  throw invalid('Final-master runner outcome is unsupported.')
}

function audioMetric(
  value: unknown,
  minimum: number,
  maximum: number,
  message: string,
): number | 'negative_infinity' {
  if (value === 'negative_infinity') return value
  return boundedNumber(value, minimum, maximum, message)
}

function validateVisualExceptionManifest(
  authority: OfflineFinalMasterObjectiveEvidenceAuthority,
) {
  const manifest = authority.approvedExceptionManifest
  if (
    manifest.schemaVersion !==
      'approved-final-master-visual-exception-manifest-v1'
  ) throw invalid('Decoded-video exception manifest type changed.')
  const sealed = sealOfflineFinalMasterVisualExceptionManifest([
    ...manifest.ranges,
  ])
  validateExceptionManifestAuthority(sealed, authority)
  return sealed.ranges
}

function validateAudioExceptionManifest(
  authority: OfflineFinalMasterObjectiveEvidenceAuthority,
) {
  const manifest = authority.approvedExceptionManifest
  if (
    manifest.schemaVersion !==
      'approved-final-master-audio-exception-manifest-v1'
  ) throw invalid('Decoded-audio exception manifest type changed.')
  const sealed = sealOfflineFinalMasterAudioExceptionManifest([
    ...manifest.ranges,
  ])
  validateExceptionManifestAuthority(sealed, authority)
  return sealed.ranges
}

function validateExceptionManifestAuthority(
  manifest:
    | OfflineFinalMasterVisualExceptionManifest
    | OfflineFinalMasterAudioExceptionManifest,
  authority: OfflineFinalMasterObjectiveEvidenceAuthority,
): void {
  if (
    manifest.manifestHash !== authority.approvedExceptionManifestHash ||
    manifest.manifestHash !== authority.approvedExceptionManifest.manifestHash ||
    manifest.ranges.some((range) =>
      range.startFrame < 0 ||
      range.endFrameExclusive > authority.expectedDurationFrames ||
      range.endFrameExclusive <= range.startFrame)
  ) throw invalid('Final-master exception manifest authority changed.')
}

function validateFindingDispositionAuthority(
  finding: Record<string, unknown>,
  disposition: unknown,
  expectedApprovedException?: {
    exceptionId: string
    approvalEvidenceHash: string
  },
): void {
  if (disposition === 'approved_exception') {
    if (
      !expectedApprovedException ||
      typeof finding.approvedExceptionId !== 'string' ||
      !IDENTITY.test(finding.approvedExceptionId) ||
      finding.approvedExceptionId.includes('..') ||
      typeof finding.approvalEvidenceHash !== 'string' ||
      !SHA256.test(finding.approvalEvidenceHash) ||
      finding.approvedExceptionId !== expectedApprovedException.exceptionId ||
      finding.approvalEvidenceHash !==
        expectedApprovedException.approvalEvidenceHash
    ) throw invalid('Final-master approved-exception authority changed.')
    return
  }
  if (
    disposition !== 'needs_user_review' ||
    expectedApprovedException !== undefined ||
    finding.approvedExceptionId !== undefined ||
    finding.approvalEvidenceHash !== undefined
  ) throw invalid('Final-master review finding gained exception authority.')
}

function validateRuntimeImage(
  image: CommonRunnerResult['image'],
  authority: OfflineFinalMasterObjectiveEvidenceAuthority,
): void {
  const policyHashes = record(
    image.sourcePolicyHashes,
    'Final-master runtime policy hashes are invalid.',
  )
  if (
    image.imageTag !==
      'reeditpro/ffmpeg-lgpl-internal:8.1.2-source-frame-v9-local' ||
    !/^sha256:[a-f0-9]{64}$/u.test(image.imageId) ||
    image.imageIdentityHash !== authority.expectedRuntimeImageIdentityHash ||
    typeof image.architecture !== 'string' || image.architecture.length < 1 ||
    image.os !== 'linux' || image.user !== '65532:65532' ||
    image.sourceVersion !== '8.1.2' ||
    image.sourceSha256 !==
      '464beb5e7bf0c311e68b45ae2f04e9cc2af88851abb4082231742a74d97b524c' ||
    image.productReady !== false ||
    image.h264Encoding !== 'blocked_not_compiled' ||
    image.aacEncoding !==
      'private_source_slice_finalizer_and_customer_delivery_mux_only' ||
    image.mp4Mux !==
      'private_source_slice_finalizer_and_customer_delivery_mux_only' ||
    image.objectMezzanineChunk !== 'private_all_chunk_vp9_cq12_only' ||
    image.flacEncoding !== 'private_continuous_program_audio_only' ||
    image.continuousProgramAudio !==
      'private_30fps_48khz_source_audio_only' ||
    image.longFormMasterAssembly !==
      'private_vp9_flac_matroska_stream_copy_only' ||
    image.customerDeliveryMasterMux !==
      'private_h264_stream_copy_aac_lc_192k_front_loaded_mp4_only' ||
    Object.keys(policyHashes).length < 1 ||
    Object.values(policyHashes).some((value) =>
      typeof value !== 'string' || !SHA256.test(value))
  ) throw invalid('Final-master pinned runtime image authority changed.')
}

function validateRuntimeConfinement(
  value: unknown,
  gateId: 'decoded_video_integrity' | 'decoded_audio_quality_sync',
): void {
  const confinements = record(
    value,
    'Final-master runtime confinement evidence is invalid.',
  )
  const expectedKeys = gateId === 'decoded_video_integrity'
    ? ['decodedFrameIntegrity', 'technicalProbe', 'visualAnomalyScan']
    : ['audioQualityScan', 'decodedAudioIntegrity', 'technicalProbe']
  if (Object.keys(confinements).sort().join('|') !== expectedKeys.join('|')) {
    throw invalid('Final-master runtime confinement pass count changed.')
  }
  for (const candidate of Object.values(confinements)) {
    const confinement = record(
      candidate,
      'Final-master runtime confinement pass is invalid.',
    )
    if (
      confinement.networkMode !== 'none' ||
      confinement.readOnlyRootFilesystem !== true ||
      confinement.capDropAll !== true ||
      confinement.noNewPrivileges !== true ||
      confinement.privileged !== false ||
      confinement.pidsLimit !== 128 ||
      ![2_147_483_648, 4_294_967_296].includes(
        Number(confinement.memoryLimitBytes),
      ) ||
      confinement.memoryAndSwapLimitBytes !== confinement.memoryLimitBytes ||
      confinement.nanoCpus !== 2_000_000_000 ||
      confinement.tmpfsPath !== '/tmp' ||
      ![67_108_864, 1_342_177_280].includes(
        Number(confinement.tmpfsSizeBytes),
      ) ||
      confinement.user !== '65532:65532' ||
      confinement.callerBindsPresent !== false ||
      confinement.callerMountsPresent !== false ||
      confinement.callerEnvironmentPresent !== false ||
      ![
        '/opt/reeditpro-ffmpeg/bin/ffprobe',
        '/opt/reeditpro-ffmpeg/bin/ffmpeg',
      ].includes(String(confinement.serverOwnedEntrypoint)) ||
      confinement.serverDerivedArgumentsOnly !== true
    ) throw invalid('Final-master runtime confinement authority changed.')
  }
}

function boundedRecords(
  value: unknown,
  maximumLength: number,
  message: string,
): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length > maximumLength) throw invalid(message)
  return value.map((entry) => record(entry, message))
}

function record(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(message)
  }
  return value as Record<string, unknown>
}

function boundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  message: string,
): number {
  if (
    typeof value !== 'number' || !Number.isSafeInteger(value) ||
    value < minimum || value > maximum
  ) throw invalid(message)
  return value
}

function boundedNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  message: string,
): number {
  if (
    typeof value !== 'number' || !Number.isFinite(value) ||
    value < minimum || value > maximum
  ) throw invalid(message)
  return value
}

function validTimestamp(value: string): boolean {
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'offline_final_master_objective_evidence_adapter_integrity',
  })
}
