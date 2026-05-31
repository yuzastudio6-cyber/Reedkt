import type {
  OcrCaptionRenderQaCandidateZoneReport,
  OcrCaptionRenderQaRenderCompatibilityManifest,
} from './ocr-caption-render-qa-types'

export function buildOcrCaptionRenderQaRenderCompatibilityManifest(input: {
  runId: string
  candidateZoneReport: OcrCaptionRenderQaCandidateZoneReport
}): OcrCaptionRenderQaRenderCompatibilityManifest {
  const blockers = [...input.candidateZoneReport.blockers]
  const warnings = [
    ...input.candidateZoneReport.warnings,
    'Phase 37E emits a future-only metadata contract; it does not call Remotion, render workers, or Track A runtime modules.',
  ]
  const compatibleWithFutureRenderQa = blockers.length === 0

  return {
    phase: '37E',
    runId: input.runId,
    compatibleWithFutureRenderQa,
    futureOnlyHandoff: true,
    trackATouched: false,
    renderExecuted: false,
    adapterContract: {
      input: 'normalized_ocr_text_regions_and_caption_candidate_zones',
      output: 'caption_avoid_regions_and_recommended_caption_zones',
      rawTextAllowedForControlledRealMedia: false,
      coordinates: 'normalized_0_to_1',
    },
    handoffNotes: [
      'Future render QA may consume avoid regions and recommended caption zones after an approved Phase 37F hook plan.',
      'If runtime render integration is required, keep it Track B and route through approved metadata contracts first.',
      'Do not use Phase 37E output to render, burn captions, unlock beta, unlock production, or process arbitrary media.',
    ],
    blockers,
    warnings,
  }
}
