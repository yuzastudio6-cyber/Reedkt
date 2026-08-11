import type {
  CaptionEarlySceneInput,
} from './caption-early-planning'

export const CAPTION_SOURCE_LED_INTENT_POLICY_VERSION =
  'caption-source-led-intent-policy-v1' as const

/**
 * Existing Caption mini-skill identities that the canonical source-led owner
 * may consume from a high-confidence structured CustomEditingDirective.
 * Raw user text is never interpreted by the owner.
 */
export const CAPTION_SOURCE_LED_ADVANCED_PRESET_IDS = [
  'caption_speaker_identification',
  'spatial_caption_compositing',
  'subject_occluded_typography',
  'object_anchored_typography',
  'environmental_typography',
  'persistent_topic_list_typography',
  'hero_typography_direction',
  'caption_to_visual_bridge',
  'caption_broll_co_composition',
  'caption_camera_coordination',
  'caption_sound_choreography',
] as const

export type CaptionSourceLedAdvancedPresetId =
  typeof CAPTION_SOURCE_LED_ADVANCED_PRESET_IDS[number]

export type CaptionSourceLedCrossSystemTarget = Exclude<
  CaptionEarlySceneInput['crossSystemTarget'],
  null
>

/**
 * A Caption-to-Visual bridge is ambiguous until the compiled directive names
 * exactly one receiver. These IDs are data-only selection tokens; they do not
 * grant peer-dispatch or receiver execution authority.
 */
export const CAPTION_SOURCE_LED_CROSS_SYSTEM_TARGET_PRESET_IDS =
  Object.freeze({
    broll: 'caption_to_visual_target_broll',
    living_frame: 'caption_to_visual_target_living_frame',
    map: 'caption_to_visual_target_map',
    chart: 'caption_to_visual_target_chart',
    diagram: 'caption_to_visual_target_diagram',
    transition: 'caption_to_visual_target_transition',
  } as const satisfies Readonly<
    Record<CaptionSourceLedCrossSystemTarget, string>
  >)

export type CaptionSourceLedCrossSystemTargetPresetId =
  typeof CAPTION_SOURCE_LED_CROSS_SYSTEM_TARGET_PRESET_IDS[
    CaptionSourceLedCrossSystemTarget
  ]
