import type {
  PreferenceDNAEvidenceSource,
  PreferenceDNALayerDefinition,
  PreferenceDNALayerId,
} from '../../types/preference-dna-builder'

const allEvidenceSources: PreferenceDNAEvidenceSource[] = [
  'preference_video_study',
  'media_extraction',
  'speech_transcript',
  'visual_scene',
  'audio_soundsync',
  'graphic_design_understanding',
  'mock_fixture',
]

type LayerTuple = [
  PreferenceDNALayerId,
  string,
  string,
  PreferenceDNAEvidenceSource[],
  boolean,
  boolean,
  boolean,
]

const layerTuples: LayerTuple[] = [
  ['content_type', 'Content Type', 'Classifies the project/reference context and edit family.', ['preference_video_study', 'media_extraction', 'mock_fixture'], true, true, false],
  ['structure_story_flow', 'Structure / Story Flow', 'Captures reusable organization, hook, beats, and explanation rhythm.', ['preference_video_study', 'speech_transcript', 'visual_scene', 'mock_fixture'], true, true, false],
  ['pacing_timing', 'Pacing / Timing', 'Captures timing feel, pause handling, cut density, and restraint without copying exact timing.', ['media_extraction', 'speech_transcript', 'visual_scene', 'mock_fixture'], true, true, true],
  ['speech_caption_behavior', 'Speech / Caption Behavior', 'Captures caption readability, speech density, pause-aware captioning, and voice-first rules.', ['speech_transcript', 'graphic_design_understanding', 'mock_fixture'], true, true, false],
  ['visual_scene_language', 'Visual Scene Language', 'Captures shot language, scene density, camera movement, and visual emphasis.', ['visual_scene', 'media_extraction', 'mock_fixture'], true, true, true],
  ['music_soundsync', 'Music / SoundSync', 'Captures music role, ducking, ambience preservation, and beat-sync policy.', ['audio_soundsync', 'preference_video_study', 'mock_fixture'], true, true, true],
  ['sfx_sound_design', 'SFX / Sound Design', 'Captures voice-safe SFX role, density, fake-source-sound risk, and no-copy SFX rules.', ['audio_soundsync', 'mock_fixture'], true, true, true],
  ['graphic_design_visualexplain', 'Graphic Design / VisualExplain', 'Captures card, callout, typography, and VisualExplain rules without copying layouts.', ['graphic_design_understanding', 'visual_scene', 'mock_fixture'], true, true, true],
  ['ui_document_card_treatment', 'UI / Document / Card Treatment', 'Captures readable UI/document/card handling and safe-zone language.', ['graphic_design_understanding', 'visual_scene', 'mock_fixture'], true, true, true],
  ['broll_shot_language', 'B-roll / Shot Language', 'Captures reusable B-roll role and shot language, not exact shot order.', ['visual_scene', 'media_extraction', 'mock_fixture'], true, true, true],
  ['color_tone_space', 'Color / Tone / Space', 'Captures color/tone/space preferences as descriptive language.', ['visual_scene', 'media_extraction', 'mock_fixture'], true, true, false],
  ['signature_system_policy', 'Signature System Policy', 'Captures optional signature system preferences and approval boundaries.', ['graphic_design_understanding', 'audio_soundsync', 'mock_fixture'], true, true, true],
  ['edit_quality_preference', 'Edit Quality Preference', 'Captures quality/readability checks and professional restraint.', allEvidenceSources, true, true, false],
  ['cost_compute_policy', 'Cost / Compute Policy', 'Captures conservative compute and approval-gated generation guidance.', ['preference_video_study', 'media_extraction', 'mock_fixture'], true, true, false],
  ['transferable_rules', 'Transferable Rules', 'Collects reusable preference rules suitable for future saved preference metadata.', allEvidenceSources, true, true, false],
  ['non_transferable_details', 'Non-transferable Details', 'Collects details that should stay as context or project-only notes.', allEvidenceSources, true, true, true],
  ['do_not_copy_rules', 'Do-not-copy Rules', 'Preserves explicit copy boundaries for reference/source evidence.', allEvidenceSources, true, true, true],
  ['qa_confidence', 'QA / Confidence', 'Summarizes evidence quality, confidence, warnings, and review needs.', allEvidenceSources, false, true, false],
]

export const PREFERENCE_DNA_LAYER_REGISTRY: PreferenceDNALayerDefinition[] = layerTuples.map(([layerId, title, purpose, expectedEvidenceSources, producesSignals, producesContractHints, requiresDoNotCopyReview]) => ({
  layerId,
  title,
  purpose,
  expectedEvidenceSources,
  producesSignals,
  producesContractHints,
  requiresDoNotCopyReview,
}))

export function listPreferenceDNALayers(): PreferenceDNALayerDefinition[] {
  return PREFERENCE_DNA_LAYER_REGISTRY
}

export function getPreferenceDNALayerDefinition(
  layerId: PreferenceDNALayerId,
): PreferenceDNALayerDefinition | undefined {
  return PREFERENCE_DNA_LAYER_REGISTRY.find((layer) => layer.layerId === layerId)
}

export function createPreferenceDNALayerRegistrySummary(): string {
  const doNotCopyCount = PREFERENCE_DNA_LAYER_REGISTRY.filter((layer) => layer.requiresDoNotCopyReview).length
  return `${PREFERENCE_DNA_LAYER_REGISTRY.length} Preference DNA layer(s) registered; ${doNotCopyCount} require explicit do-not-copy review.`
}
