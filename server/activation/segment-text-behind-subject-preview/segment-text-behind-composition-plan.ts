import { getApprovedRealVideoSam2TemporalMaskEvidence } from '../real-video-sam2-temporal-mask'
import { segmentTextBehindSubjectPreviewConfig } from './segment-text-behind-subject-preview-policy'
import type { SegmentTextBehindSubjectPreviewCompositionPlan } from './segment-text-behind-subject-preview-types'

export function buildSegmentTextBehindSubjectPreviewCompositionPlan(): SegmentTextBehindSubjectPreviewCompositionPlan {
  const phase35D = getApprovedRealVideoSam2TemporalMaskEvidence()
  const promptBoundingBox = phase35D.prompt?.scaledBoundingBox ?? [42, 109, 767, 431]
  return {
    compositionId: 'phase35e-segment-text-behind-subject',
    text: segmentTextBehindSubjectPreviewConfig.approvedText,
    sanitizedText: segmentTextBehindSubjectPreviewConfig.approvedText,
    renderer: 'native_node_png_compositor',
    previewClipStrategy: 'not_generated_no_local_ffmpeg_required',
    frameCount: segmentTextBehindSubjectPreviewConfig.approvedFrameCount,
    frameWidth: segmentTextBehindSubjectPreviewConfig.approvedFrameWidth,
    frameHeight: segmentTextBehindSubjectPreviewConfig.approvedFrameHeight,
    textStyle: {
      fontFamilyFallback: 'built_in_block_font',
      fillColor: '#FFFFFF',
      strokeColor: '#101820',
      opacity: 0.94,
      blockScale: 12,
    },
    position: {
      x: 66,
      y: 78,
      width: 636,
      height: 84,
      anchor: 'center_upper_mid',
    },
    layerOrder: ['source_frame', 'text_layer', 'subject_from_phase35d_mask'],
    maskMode: 'phase35d_sam2_alpha_mask',
    behindSubject: true,
    promptBoundingBox,
    warnings: [
      'Phase 35E uses fixed REEDITPRO text and a deterministic built-in block font to avoid external font/provider dependencies.',
      'Preview clip assembly is intentionally omitted when local FFmpeg is unavailable; preview frames and QA are the source of truth.',
      'Subjective visual quality and edge flicker still require human visual review before broader use.',
    ],
  }
}
