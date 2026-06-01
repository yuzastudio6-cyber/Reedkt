import {
  buildOcrCaptionRenderQaCandidateZones,
  ocrCaptionRenderQaConfig,
} from './ocr-caption-render-qa-policy'
import type { OcrCaptionRenderQaCaptionConstraintManifest } from './ocr-caption-render-qa-types'

export function buildOcrCaptionRenderQaCaptionConstraintManifest(runId: string): OcrCaptionRenderQaCaptionConstraintManifest {
  return {
    phase: '37E',
    runId,
    padding: ocrCaptionRenderQaConfig.padding,
    warningOverlapRatio: ocrCaptionRenderQaConfig.warningOverlapRatio,
    blockingOverlapRatio: ocrCaptionRenderQaConfig.blockingOverlapRatio,
    lowConfidenceWarningThreshold: ocrCaptionRenderQaConfig.lowConfidenceWarningThreshold,
    candidateZones: buildOcrCaptionRenderQaCandidateZones(),
    constraints: [
      'Captions must not cover OCR text regions, faces, products, maps, charts, browser focus, source labels, or fact-safety notes.',
      'Use lower-third only when the padded OCR overlap ratio remains below warning threshold.',
      'Use upper-third or center-safe fallback when lower-third has collision risk.',
      'If all candidate zones are risky, emit manual review instead of forcing a caption placement.',
      'Controlled real-media OCR text must remain redacted and must not be committed or uploaded in Phase 37E artifacts.',
      'This contract is future-only for render QA; no render execution happens in Phase 37E.',
    ],
  }
}
