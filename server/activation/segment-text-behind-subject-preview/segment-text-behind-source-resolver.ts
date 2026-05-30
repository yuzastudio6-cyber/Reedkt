import { getApprovedRealVideoSam2TemporalMaskEvidence } from '../real-video-sam2-temporal-mask'
import { segmentTextBehindSubjectPreviewConfig } from './segment-text-behind-subject-preview-policy'
import type { SegmentTextBehindSubjectPreviewSourceSummary } from './segment-text-behind-subject-preview-types'

export function buildSegmentTextBehindSubjectPreviewSourceSummary(input: {
  frameUris?: string[]
  maskUris?: string[]
} = {}): SegmentTextBehindSubjectPreviewSourceSummary {
  const phase35D = getApprovedRealVideoSam2TemporalMaskEvidence()
  const blockers: string[] = []
  const warnings: string[] = []
  if (phase35D.status !== 'verified') blockers.push('Approved Phase 35D SAM2 temporal mask evidence is not verified.')
  if (!phase35D.phase35EReadiness.readyForControlledSegmentTextBehindSubjectPreview) blockers.push('Phase 35D does not mark Phase 35E controlled preview readiness true.')
  warnings.push('Source paths are locked to Phase 35D private artifacts and should be resolved from the manifests at execution time.')

  return {
    phase35DRunId: segmentTextBehindSubjectPreviewConfig.approvedPhase35DRunId,
    inputVideoGcsUri: segmentTextBehindSubjectPreviewConfig.approvedInputVideoGcsUri,
    generatedAssetsPrefix: segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix,
    masksPrefix: segmentTextBehindSubjectPreviewConfig.masksInputPrefix,
    qaPrefix: segmentTextBehindSubjectPreviewConfig.qaInputPrefix,
    segmentManifestUri: `${segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix}segment/segment-manifest.json`,
    promptMetadataUri: `${segmentTextBehindSubjectPreviewConfig.generatedAssetsInputPrefix}prompt/prompt-metadata.json`,
    maskMetadataUri: `${segmentTextBehindSubjectPreviewConfig.masksInputPrefix}metadata/mask-sequence-metadata.json`,
    phase35DReportUri: `${segmentTextBehindSubjectPreviewConfig.qaInputPrefix}reports/phase35d-report.json`,
    frameUris: input.frameUris ?? [],
    maskUris: input.maskUris ?? [],
    blockers,
    warnings,
  }
}

export function resolveSegmentTextBehindSubjectPreviewArtifacts(runId: string) {
  const previewPrefix = `${segmentTextBehindSubjectPreviewConfig.outputPreviewPrefix}${runId}/`
  const generatedPrefix = `${segmentTextBehindSubjectPreviewConfig.outputGeneratedAssetsPrefix}${runId}/`
  const qaPrefix = `${segmentTextBehindSubjectPreviewConfig.outputQaPrefix}${runId}/`
  return {
    previewPrefix,
    generatedPrefix,
    qaPrefix,
    previewFramesPrefix: `${previewPrefix}preview-frames/`,
    compositionManifest: `${generatedPrefix}composition/composition-manifest.json`,
    sourceFrameMaskMap: `${generatedPrefix}metadata/source-frame-mask-map.json`,
    textStyle: `${generatedPrefix}metadata/text-style.json`,
    qaReport: `${qaPrefix}qa/segment-text-behind-subject-qa.json`,
    phase35EReport: `${qaPrefix}reports/phase35e-report.json`,
  }
}
