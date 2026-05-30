import { realVideoSam2TemporalMaskConfig } from './real-video-sam2-temporal-mask-policy'
import type {
  RealVideoSam2QaGate,
  RealVideoSam2TemporalMaskExecutionReport,
} from './real-video-sam2-temporal-mask-types'

export function buildRealVideoSam2QaSummary(
  report?: RealVideoSam2TemporalMaskExecutionReport,
  options: { approvedEvidenceVerified?: boolean } = {},
): {
  status: 'planned' | 'ready' | 'blocked'
  gates: RealVideoSam2QaGate[]
  blockers: string[]
  warnings: string[]
  reason: string
} {
  if (!report) {
    if (options.approvedEvidenceVerified) {
      return {
        status: 'ready',
        gates: requiredGateIds().map((gateId) => ({
          gateId,
          status: gateId === 'temporal_consistency' ? 'warning' : 'passed',
          summary: gateId === 'temporal_consistency'
            ? 'Verified by approved Phase 35D evidence with human visual review still required.'
            : 'Verified by approved Phase 35D evidence; private execution report is not committed.',
        })),
        blockers: [],
        warnings: [
          'Static report uses committed approved evidence; the private execution report remains in staging QA storage.',
          'Human visual review is required before broader mask or text-behind-subject use.',
        ],
        reason: 'Phase 35D approved evidence is verified; Phase 35E may proceed only as a controlled segment text-behind-subject preview.',
      }
    }
    return {
      status: 'planned',
      gates: requiredGateIds().map((gateId) => ({ gateId, status: 'not_applicable', summary: 'Execution report is not present yet.' })),
      blockers: ['Phase 35D execution report is not present.'],
      warnings: ['Static report mode is non-mutating and does not prove SAM2 temporal mask behavior.'],
      reason: 'Phase 35E remains blocked until the bounded Phase 35D real-video execution report is present and QA passes.',
    }
  }

  const blockers: string[] = []
  const warnings = [...report.qa.warnings]
  if (!report.ok) blockers.push('Phase 35D runtime report did not complete successfully.')
  if (report.source.inputVideoGcsUri !== realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri) blockers.push('Execution used an unapproved input video.')
  if (report.source.anchorFrameGcsUri !== realVideoSam2TemporalMaskConfig.approvedAnchorFrameGcsUri) blockers.push('Execution used an unapproved anchor frame.')
  if (report.source.anchorMaskGcsUri !== realVideoSam2TemporalMaskConfig.approvedAnchorMaskGcsUri) blockers.push('Execution used an unapproved anchor mask.')
  if (report.segment.durationSeconds > realVideoSam2TemporalMaskConfig.maxSegmentDurationSeconds) blockers.push('Execution exceeded the Phase 35D segment duration limit.')
  if (report.segment.frameCount > realVideoSam2TemporalMaskConfig.maxFrames) blockers.push('Execution exceeded the Phase 35D frame-count limit.')
  if (report.segment.width !== realVideoSam2TemporalMaskConfig.frameWidth || report.segment.height !== realVideoSam2TemporalMaskConfig.frameHeight) blockers.push('Execution frame dimensions do not match Phase 35D policy.')
  if (report.model.gcsPath !== realVideoSam2TemporalMaskConfig.modelGcsPath) blockers.push('Execution used an unapproved SAM2 model path.')
  if (report.model.checkpointSha256 !== realVideoSam2TemporalMaskConfig.checkpointSha256) blockers.push('Execution checkpoint checksum does not match Phase 35B evidence.')
  if (report.model.configSha256 !== realVideoSam2TemporalMaskConfig.configSha256) blockers.push('Execution config checksum does not match Phase 35B evidence.')
  if (report.model.aggregateSha256 !== realVideoSam2TemporalMaskConfig.aggregateSha256) blockers.push('Execution aggregate checksum does not match Phase 35B evidence.')
  if (!report.gpu.cudaAvailable || !/L4/i.test(report.gpu.deviceName ?? '')) blockers.push('Execution did not confirm NVIDIA L4 CUDA.')
  if (report.masks.status !== 'completed' || report.masks.maskUris.length !== report.segment.frameCount) blockers.push('Mask artifacts do not match extracted frame count.')
  if (report.masks.perFrame.some((frame) => frame.nonZeroRatio <= 0.001 || frame.nonZeroRatio >= 0.995)) blockers.push('One or more masks are empty or effectively full-frame.')
  if (report.safety.arbitraryRealUserMediaUsed !== false) blockers.push('Arbitrary real user media was used.')
  if (report.safety.fullVideoMaskExecuted !== false) blockers.push('Full-video mask execution was enabled.')
  if (report.safety.fullVideoTextBehindSubjectExecuted !== false || report.safety.textBehindSubjectVideoExecuted !== false) blockers.push('Text-behind-subject video execution was enabled.')
  if (report.safety.providerExecuted !== false) blockers.push('Provider execution was enabled.')
  if (report.safety.revideoUsed !== false || report.safety.filmUsed !== false || report.safety.slowMotionExecuted !== false) blockers.push('A blocked Revideo/FILM/slow-motion path was used.')
  if (report.safety.publicAccessEnabled !== false) blockers.push('Public artifact access was enabled.')
  if (report.safety.productionReadyAllowed !== false || report.safety.externalBetaAllowed !== false || report.safety.broadRealUserMediaAllowed !== false) blockers.push('Production, beta, or broad real-media gate was unlocked.')

  const allBlockers = Array.from(new Set([...report.qa.blockers, ...blockers]))
  const ready = allBlockers.length === 0 && report.qa.status !== 'blocked'
  return {
    status: ready ? 'ready' : 'blocked',
    gates: report.qa.gates,
    blockers: allBlockers,
    warnings: Array.from(new Set(warnings)),
    reason: ready
      ? 'Phase 35D passed bounded real-video SAM2 temporal mask QA and is ready only for controlled segment text-behind-subject preview planning.'
      : 'Phase 35E remains blocked because Phase 35D QA did not pass.',
  }
}

function requiredGateIds(): RealVideoSam2QaGate['gateId'][] {
  return [
    'source_integrity',
    'segment_bounds',
    'model_artifacts',
    'prompt_integrity',
    'runtime_integrity',
    'mask_artifacts',
    'temporal_consistency',
    'artifact_privacy',
    'blocked_features',
  ]
}
