import { getApprovedSam2RuntimeEvidence } from '../sam2-runtime'
import { realVideoSam2TemporalMaskConfig } from './real-video-sam2-temporal-mask-policy'

export function buildRealVideoSam2SourceResolverSummary(): {
  inputVideoGcsUri: string
  anchorFrameGcsUri: string
  anchorMaskGcsUri: string
  anchorCutoutGcsUri: string
  blockers: string[]
  warnings: string[]
} {
  const blockers: string[] = []
  const warnings = [
    'Only the approved Phase 32 private export and Phase 33D anchor artifacts may be used.',
    'This source resolver does not approve arbitrary user media or full-video masks.',
  ]
  const phase35C = getApprovedSam2RuntimeEvidence()
  if (phase35C.status !== 'verified') blockers.push('Phase 35C SAM2 generated-fixture runtime verification is not recorded as verified.')
  if (phase35C.runtimeImage !== realVideoSam2TemporalMaskConfig.approvedPhase35CImage) blockers.push('Phase 35C approved runtime image does not match Phase 35D policy.')
  if (phase35C.cloudRunExecutionId !== realVideoSam2TemporalMaskConfig.approvedPhase35CExecutionId) blockers.push('Phase 35C Cloud Run execution id does not match Phase 35D policy.')

  return {
    inputVideoGcsUri: realVideoSam2TemporalMaskConfig.approvedInputVideoGcsUri,
    anchorFrameGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorFrameGcsUri,
    anchorMaskGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorMaskGcsUri,
    anchorCutoutGcsUri: realVideoSam2TemporalMaskConfig.approvedAnchorCutoutGcsUri,
    blockers,
    warnings,
  }
}
