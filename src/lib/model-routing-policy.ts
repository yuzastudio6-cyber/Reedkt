import type { EditLevel, FallbackStep, ProviderModel, ProviderRoute } from '../types/reeditpro'

export type DurationRule = {
  defaultSeconds: number
  allowedSeconds: number[]
  notes: string
}

export type VeoAvailability = {
  basic: false
  pro: false
  premium: false | 'final_fallback_only'
}

export type ModelRoutingPolicy = {
  id: string
  label: string
  allowedPrimaryModels: ProviderModel[]
  fallbackModelsByEditLevel: Record<EditLevel, ProviderModel[]>
  fallbackStepsByEditLevel: Record<EditLevel, FallbackStep[]>
  defaultResolutionByModel: Partial<Record<ProviderModel, ProviderRoute['resolution']>>
  durationRule: DurationRule
  purpose: string
  notes: string[]
  veoAvailability: VeoAvailability
}

const noVeoAvailability: VeoAvailability = {
  basic: false,
  pro: false,
  premium: 'final_fallback_only',
}

const neverVeoAvailability: VeoAvailability = {
  basic: false,
  pro: false,
  premium: false,
}

const retrySameModel = (label: string, reason: string): FallbackStep => ({
  action: 'retry_same_model',
  label,
  reason,
})

const simplifyPrompt = (label: string, reason: string): FallbackStep => ({
  action: 'simplify_prompt',
  label,
  reason,
})

const splitScene = (label: string, reason: string): FallbackStep => ({
  action: 'split_scene',
  label,
  reason,
})

const convertToStill = (label: string, reason: string): FallbackStep => ({
  action: 'convert_to_still',
  model: 'gpt_image_2',
  label,
  reason,
})

const convertToMotionDesign = (label: string, reason: string): FallbackStep => ({
  action: 'convert_to_motion_design',
  model: 'remotion_editor_motion',
  label,
  reason,
})

const fallbackModel = (model: ProviderModel, label: string, reason: string, premiumOnly = false): FallbackStep => ({
  action: 'try_fallback_model',
  model,
  label,
  reason,
  premiumOnly,
})

export const strokeStartEnd5sRoute: ModelRoutingPolicy = {
  id: 'stroke_start_end_5s',
  label: 'Stroke Motion start/end 5s route',
  allowedPrimaryModels: ['wan_2_2_kf2v_flash'],
  fallbackModelsByEditLevel: {
    basic: ['gpt_image_2'],
    pro: ['hailuo_02', 'remotion_editor_motion'],
    premium: ['hailuo_02', 'veo_3_1_lite'],
  },
  fallbackStepsByEditLevel: {
    basic: [
      simplifyPrompt('Simplify prompt', 'Reduce the beat to the clearest action while preserving story meaning.'),
      retrySameModel('Retry Wan 2.2', 'Retry the same low-cost route before changing asset type.'),
      convertToStill('Convert to still', 'Use a still/card if motion is not essential for the beat.'),
    ],
    pro: [
      fallbackModel('hailuo_02', 'Try Hailuo-02', 'Use start and end frames for a normal animation fallback.'),
      splitScene('Split scene', 'Break a dense 5-second beat into smaller planned pieces.'),
      convertToMotionDesign('Convert to editor motion', 'Use deterministic editor motion if exact timing matters more than AI video.'),
    ],
    premium: [
      fallbackModel('hailuo_02', 'Try Hailuo-02', 'Use the normal animation fallback before any Premium rescue.'),
      fallbackModel('veo_3_1_lite', 'Final Veo 3.1 Lite rescue', 'Premium-only final fallback after Wan/Hailuo are unsuitable or fail QA.', true),
    ],
  },
  defaultResolutionByModel: {
    wan_2_2_kf2v_flash: '720P',
    hailuo_02: '768P',
    veo_3_1_lite: '720P',
    gpt_image_2: 'frame',
    remotion_editor_motion: 'frame',
  },
  durationRule: {
    defaultSeconds: 5,
    allowedSeconds: [5],
    notes: 'Wan 2.2 KF2V Flash uses a start frame plus end frame for a 5-second story beat.',
  },
  purpose: 'Animate a short beat when the planner has both start and end frames.',
  notes: ['Wan is primary.', 'Hailuo is normal fallback.', 'Veo is Premium-only final fallback and never primary.'],
  veoAvailability: noVeoAvailability,
}

export const strokeStartOnlyRoute: ModelRoutingPolicy = {
  id: 'stroke_start_only',
  label: 'Stroke Motion start-frame-only route',
  allowedPrimaryModels: ['wan_2_6_i2v_flash'],
  fallbackModelsByEditLevel: {
    basic: ['gpt_image_2'],
    pro: ['hailuo_2_3_fast'],
    premium: ['hailuo_2_3_fast', 'veo_3_1_lite'],
  },
  fallbackStepsByEditLevel: {
    basic: [
      retrySameModel('Retry Wan 2.6', 'Retry the start-frame route before reducing visual complexity.'),
      simplifyPrompt('Simplify prompt', 'Keep the action readable and lower motion complexity.'),
      convertToStill('Convert to still', 'Use a still/card if the beat does not need generated movement.'),
    ],
    pro: [
      fallbackModel('hailuo_2_3_fast', 'Try Hailuo 2.3 Fast', 'Use the normal start-frame fallback at 768P.'),
      splitScene('Split scene', 'Split the action when one flexible-duration prompt is too dense.'),
    ],
    premium: [
      fallbackModel('hailuo_2_3_fast', 'Try Hailuo 2.3 Fast', 'Use the normal fallback before any Premium rescue.'),
      fallbackModel('veo_3_1_lite', 'Final Veo 3.1 Lite rescue', 'Premium-only final fallback for critical scenes or failed QA.', true),
    ],
  },
  defaultResolutionByModel: {
    wan_2_6_i2v_flash: '720P',
    hailuo_2_3_fast: '768P',
    veo_3_1_lite: '720P',
    gpt_image_2: 'frame',
  },
  durationRule: {
    defaultSeconds: 6,
    allowedSeconds: [2, 3, 4, 5, 6, 8, 10, 12, 15],
    notes: 'Wan 2.6 I2V Flash uses a start frame only for flexible 2-15 second silent/no-audio animation.',
  },
  purpose: 'Animate a beat from a single start frame when flexible timing is useful.',
  notes: ['Silent/no-audio generation is preferred.', 'Veo is Premium-only final fallback and never primary.'],
  veoAvailability: noVeoAvailability,
}

export const strokeLongStartEndRoute: ModelRoutingPolicy = {
  id: 'stroke_long_start_end',
  label: 'Long start/end route',
  allowedPrimaryModels: ['hailuo_02'],
  fallbackModelsByEditLevel: {
    basic: ['gpt_image_2'],
    pro: ['wan_2_2_kf2v_flash'],
    premium: ['hailuo_02', 'wan_2_2_kf2v_flash', 'veo_3_1_lite'],
  },
  fallbackStepsByEditLevel: {
    basic: [
      splitScene('Split scene', 'Reduce a long beat into simpler smaller beats.'),
      convertToStill('Convert to still', 'Use a still/card when long motion is too costly or unnecessary.'),
    ],
    pro: [
      fallbackModel('wan_2_2_kf2v_flash', 'Split into two Wan 2.2 clips', 'Use two 5-second Wan clips instead of Veo.'),
      splitScene('Split scene', 'Plan two shorter beats with clearer start/end frames.'),
    ],
    premium: [
      retrySameModel('Retry Hailuo-02', 'Retry the normal long start/end route before rescue.'),
      splitScene('Split scene', 'Split the scene if QA failure is due to prompt density.'),
      fallbackModel('veo_3_1_lite', 'Final Veo 3.1 Lite rescue', 'Premium-only final fallback after Hailuo and split-scene options are unsuitable.', true),
    ],
  },
  defaultResolutionByModel: {
    hailuo_02: '768P',
    wan_2_2_kf2v_flash: '720P',
    veo_3_1_lite: '720P',
    gpt_image_2: 'frame',
  },
  durationRule: {
    defaultSeconds: 6,
    allowedSeconds: [6, 10],
    notes: 'Hailuo-02 uses start frame plus end frame for 6 or 10 seconds at 768P.',
  },
  purpose: 'Handle longer start/end animation beats without making Veo the default route.',
  notes: ['Basic and Pro never use Veo.', 'Premium can use Veo only as final rescue.'],
  veoAvailability: noVeoAvailability,
}

export const graphicDesignRoute: ModelRoutingPolicy = {
  id: 'graphic_design',
  label: 'Graphic Design / VisualExplain route',
  allowedPrimaryModels: ['gpt_image_2', 'remotion_editor_motion', 'svg_lottie_renderer'],
  fallbackModelsByEditLevel: {
    basic: ['remotion_editor_motion'],
    pro: ['remotion_editor_motion', 'svg_lottie_renderer'],
    premium: ['remotion_editor_motion', 'svg_lottie_renderer'],
  },
  fallbackStepsByEditLevel: {
    basic: [
      convertToMotionDesign('Use editor motion', 'Keep exact text, labels, and timing under ReeditPro control.'),
      simplifyPrompt('Simplify design', 'Reduce layout complexity while preserving the idea.'),
    ],
    pro: [
      convertToMotionDesign('Use editor motion', 'Prefer deterministic motion for exact text and diagrams.'),
      simplifyPrompt('Simplify design', 'Simplify layout or split into multiple cards.'),
    ],
    premium: [
      convertToMotionDesign('Use editor motion', 'Use deterministic motion before any generated video idea.'),
      simplifyPrompt('Simplify design', 'Keep the framework readable and editable.'),
    ],
  },
  defaultResolutionByModel: {
    gpt_image_2: 'frame',
    remotion_editor_motion: 'frame',
    svg_lottie_renderer: 'frame',
  },
  durationRule: {
    defaultSeconds: 0,
    allowedSeconds: [0],
    notes: 'Still/card duration is editor-controlled; motion is deterministic editor motion.',
  },
  purpose: 'Create exact cards, diagrams, labels, and frameworks with GPT-Image-2 frames plus deterministic editor motion.',
  notes: ['No Veo for any tier.', 'Use controlled layouts when exact text matters.'],
  veoAvailability: neverVeoAvailability,
}

export const realMotionRoute: ModelRoutingPolicy = {
  id: 'real_motion',
  label: 'Real Motion route',
  allowedPrimaryModels: ['gpt_image_2', 'wan_2_6_i2v_flash'],
  fallbackModelsByEditLevel: {
    basic: ['gpt_image_2', 'remotion_editor_motion'],
    pro: ['hailuo_2_3_fast'],
    premium: ['hailuo_2_3_fast', 'veo_3_1_lite'],
  },
  fallbackStepsByEditLevel: {
    basic: [
      simplifyPrompt('Simplify Real Motion idea', 'Reduce realism or object complexity to protect credits.'),
      convertToMotionDesign('Convert to graphic/still', 'Use a controlled product or proof frame instead of AI video.'),
    ],
    pro: [
      fallbackModel('hailuo_2_3_fast', 'Try Hailuo 2.3 Fast', 'Use normal fallback for start-frame animation.'),
      simplifyPrompt('Simplify prompt', 'Reduce realism or placement complexity before increasing cost.'),
    ],
    premium: [
      fallbackModel('hailuo_2_3_fast', 'Try Hailuo 2.3 Fast', 'Use normal fallback before Premium rescue.'),
      fallbackModel('veo_3_1_lite', 'Final Veo 3.1 Lite rescue', 'Premium-only final fallback for critical Real Motion scenes after QA failure or unsuitable Wan/Hailuo output.', true),
    ],
  },
  defaultResolutionByModel: {
    gpt_image_2: 'frame',
    wan_2_6_i2v_flash: '720P',
    hailuo_2_3_fast: '768P',
    veo_3_1_lite: '720P',
    remotion_editor_motion: 'frame',
  },
  durationRule: {
    defaultSeconds: 6,
    allowedSeconds: [2, 3, 4, 5, 6, 8, 10, 12, 15],
    notes: 'GPT-Image-2 creates keyframes; Wan 2.6 animates first; Hailuo is fallback; Veo Lite is Premium-only final rescue.',
  },
  purpose: 'Plan premium/credit-heavy Real Motion with keyframes, face-safe placement, and fallback controls.',
  notes: ['Real Motion remains premium/credit-heavy when used.', 'Basic and Pro never use Veo.', 'Veo is never primary.'],
  veoAvailability: noVeoAvailability,
}
