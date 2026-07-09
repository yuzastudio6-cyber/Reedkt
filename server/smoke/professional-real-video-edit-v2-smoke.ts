import {
  buildProfessionalEditSegments,
  buildProfessionalGraphicCues,
  buildProfessionalKineticCaptionCues,
  compileProfessionalRealVideoEditV2Plan,
  PROFESSIONAL_REAL_VIDEO_V2_CAPTION_REFERENCE_SHA256,
  PROFESSIONAL_REAL_VIDEO_V2_SOURCE_SHA256,
  professionalEditDurationSeconds,
} from '../internal-testing/professional-real-video-edit-v2-spec'

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

function expectFailure(fn: () => unknown, message: string): void {
  let failed = false
  try {
    fn()
  } catch {
    failed = true
  }
  check(failed, message)
}

const evidence = {
  measuredNoiseFloorDbfs: -43.37,
  measuredSpeechRmsDbfs: -34.91,
  speechToNoiseFloorDb: 8.46,
  spectralNoiseReductionDb: 8,
  naturalnessQaRequired: true as const,
  evidenceNote: 'Measured source intervals justify conservative spectral cleanup with required naturalness QA.',
}
const plan = compileProfessionalRealVideoEditV2Plan({
  sourceChecksumSha256: PROFESSIONAL_REAL_VIDEO_V2_SOURCE_SHA256,
  captionReferenceChecksumSha256: PROFESSIONAL_REAL_VIDEO_V2_CAPTION_REFERENCE_SHA256,
  transcriptFullText: 'AI software editing services customers feedback bugs see you next time',
  voiceCleanupEvidence: evidence,
  sourceIntegratedLufs: -33.1,
  sourceTruePeakDbfs: -15.5,
})
const segments = buildProfessionalEditSegments()
const captions = buildProfessionalKineticCaptionCues()
const graphics = buildProfessionalGraphicCues()

check(plan.decision === 'professional_real_video_edit_v2_plan_compiled_ready_for_approved_private_execution', 'Professional plan decision must be stable.')
check(segments.length === 9 && professionalEditDurationSeconds() === 38.44, 'The reviewed whole-source trim plan must remain complete and deterministic.')
check(segments.every((segment, index) => index === 0 || Math.abs(segment.timelineStartSeconds - segments[index - 1].timelineEndSeconds) <= 0.001), 'Approved timeline segments must be contiguous and non-overlapping.')
check(segments.find((segment) => segment.segmentId === 'creative-control')?.sourceStartSeconds === 41.62, 'Creative-control cut must start after both repeated conjunctions.')
check(captions.length === 31 && captions.every((cue) => cue.text.split(/\s+/).length <= 4), 'Kinetic captions must stay in compact reference-informed phrase chunks.')
check(captions.some((cue) => cue.text === 'AI SOFTWARE' && cue.emphasizedWords.includes('AI')), 'Caption plan must preserve selective keyword emphasis.')
check(graphics.length === 4 && graphics.every((cue) => cue.layout === 'brand_bug' || cue.layout === 'top_callout'), 'Graphics must stay sparse and within the approved top-safe layouts.')

expectFailure(() => compileProfessionalRealVideoEditV2Plan({
  sourceChecksumSha256: PROFESSIONAL_REAL_VIDEO_V2_SOURCE_SHA256,
  captionReferenceChecksumSha256: PROFESSIONAL_REAL_VIDEO_V2_CAPTION_REFERENCE_SHA256,
  transcriptFullText: 'AI software editing services customers feedback bugs see you next time',
  voiceCleanupEvidence: { ...evidence, speechToNoiseFloorDb: 24 },
  sourceIntegratedLufs: -20,
  sourceTruePeakDbfs: -3,
}), 'Professional plan compiler must reject denoising when measured source evidence does not justify it.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'fixed_source_and_reference_identity',
    'source_aware_story_trim',
    'repeated_conjunction_removed',
    'compact_kinetic_caption_language',
    'selective_keyword_emphasis',
    'sparse_top_safe_graphics',
    'evidence_gated_voice_cleanup',
    'private_execution_boundaries',
  ],
  durationSeconds: professionalEditDurationSeconds(),
  segmentCount: segments.length,
  captionCount: captions.length,
  graphicCount: graphics.length,
}, null, 2))
