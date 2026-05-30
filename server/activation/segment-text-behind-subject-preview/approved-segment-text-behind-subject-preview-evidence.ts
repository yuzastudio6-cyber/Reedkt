import { segmentTextBehindSubjectPreviewConfig } from './segment-text-behind-subject-preview-policy'
import type { ApprovedSegmentTextBehindSubjectPreviewEvidence } from './segment-text-behind-subject-preview-types'

export const approvedSegmentTextBehindSubjectPreviewEvidence: ApprovedSegmentTextBehindSubjectPreviewEvidence = {
  phase: '35E',
  status: 'verified',
  runId: 'phase35e-20260530T01355',
  sourcePhase35DRunId: segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId,
  selectedSegment: {
    startSeconds: segmentTextBehindSubjectPreviewConfig.approvedSegmentStartSeconds,
    endSeconds: segmentTextBehindSubjectPreviewConfig.approvedSegmentEndSeconds,
    durationSeconds: segmentTextBehindSubjectPreviewConfig.approvedSegmentDurationSeconds,
    frameCount: segmentTextBehindSubjectPreviewConfig.approvedFrameCount,
    width: segmentTextBehindSubjectPreviewConfig.approvedFrameWidth,
    height: segmentTextBehindSubjectPreviewConfig.approvedFrameHeight,
  },
  text: segmentTextBehindSubjectPreviewConfig.approvedText,
  compositionMethod: 'native_node_png_alpha_composite',
  previewPrefix: 'gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase35e/phase35e-20260530T01355/',
  generatedAssetsPrefix: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35e/phase35e-20260530T01355/',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35e/phase35e-20260530T01355/reports/phase35e-report.json',
  previewFrameCount: 10,
  previewClipGenerated: false,
  phase36AReadiness: {
    readyForAudioAiApprovalWorkflow: true,
    reason: 'Phase 35E produced one controlled private segment text-behind-subject preview with no blocking QA failures; the next roadmap family may move to audio AI approval workflow only.',
  },
  blockers: [],
  warnings: [
    'Subjective visual quality and edge flicker remain warning-only until human review.',
    'Preview clip generation was omitted; private preview frames are the Phase 35E source of truth.',
  ],
}

export function getApprovedSegmentTextBehindSubjectPreviewEvidence(): ApprovedSegmentTextBehindSubjectPreviewEvidence {
  return {
    ...approvedSegmentTextBehindSubjectPreviewEvidence,
    selectedSegment: { ...approvedSegmentTextBehindSubjectPreviewEvidence.selectedSegment },
    phase36AReadiness: { ...approvedSegmentTextBehindSubjectPreviewEvidence.phase36AReadiness },
    blockers: [...approvedSegmentTextBehindSubjectPreviewEvidence.blockers],
    warnings: [...approvedSegmentTextBehindSubjectPreviewEvidence.warnings],
  }
}
