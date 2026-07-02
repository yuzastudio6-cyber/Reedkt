import type {
  EditLevel,
  FallbackStep,
  ProviderModel,
  ProviderRoute,
  SignatureSystem,
  VisualAssetType,
  VisualAssetPlanItem,
} from '../types/reeditpro'

type RouteParams = {
  assetType: VisualAssetType
  signatureSystem: SignatureSystem
  editLevel: EditLevel
  needsStartFrame: boolean
  needsEndFrame: boolean
  recommendedDurationSeconds: number
  actionIntensity: VisualAssetPlanItem['actionIntensity']
  isCriticalBeat?: boolean
}

const stillAssetTypes: VisualAssetType[] = [
  'still_scene',
  'fact_card',
  'name_card',
  'character_card',
  'list_card',
  'timeline_card',
  'graphic_design_frame',
  'still_with_editor_motion',
]

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function step(action: FallbackStep['action'], label: string, reason: string, model?: ProviderModel, premiumOnly = false): FallbackStep {
  return {
    action,
    label,
    model,
    premiumOnly: premiumOnly || undefined,
    reason,
  }
}

function routeBase(overrides: Partial<ProviderRoute>): ProviderRoute {
  return {
    primaryModel: 'none',
    fallbackModels: [],
    fallbackSteps: [],
    resolution: 'frame',
    durationSeconds: 0,
    providerPurpose: 'No generation required',
    internalCostHint: 'none',
    userCreditImpact: 'none',
    reason: 'No extra visual generation is needed for this beat.',
    veoAllowed: false,
    premiumOnlyFallback: false,
    ...overrides,
  }
}

function includesVeo(route: ProviderRoute) {
  return route.fallbackModels.includes('veo_3_1_lite') || route.fallbackSteps.some((fallbackStep) => fallbackStep.model === 'veo_3_1_lite')
}

export function enforceVeoTierRule(route: ProviderRoute, editLevel: EditLevel): ProviderRoute {
  const safePrimaryModel = route.primaryModel === 'veo_3_1_lite' ? 'wan_2_6_i2v_flash' : route.primaryModel

  if (editLevel !== 'premium') {
    return {
      ...route,
      primaryModel: safePrimaryModel,
      fallbackModels: route.fallbackModels.filter((model) => model !== 'veo_3_1_lite'),
      fallbackSteps: [
        ...route.fallbackSteps.filter((fallbackStep) => fallbackStep.model !== 'veo_3_1_lite'),
        step(
          'upgrade_to_premium',
          'Veo Lite disabled for this level',
          'Veo Lite is disabled for Basic/Pro. Use simplification, scene splitting, still conversion, motion design conversion, Hailuo if allowed, or upgrade to Premium.',
        ),
      ],
      premiumOnlyFallback: false,
      reason: `${route.reason} Basic and Pro cannot use Veo Lite.`,
      veoAllowed: false,
    }
  }

  const nonVeoSteps = route.fallbackSteps.filter((fallbackStep) => fallbackStep.model !== 'veo_3_1_lite')
  const hasVeoFallback = includesVeo(route)
  const finalVeoStep = hasVeoFallback
    ? step(
        'try_fallback_model',
        'Final Veo 3.1 Lite rescue',
        'Premium-only final fallback/rescue after Wan and Hailuo are unsuitable, fail QA, or the scene is critical.',
        'veo_3_1_lite',
        true,
      )
    : undefined

  return {
    ...route,
    primaryModel: safePrimaryModel,
    fallbackModels: hasVeoFallback
      ? [...route.fallbackModels.filter((model) => model !== 'veo_3_1_lite'), 'veo_3_1_lite']
      : route.fallbackModels,
    fallbackSteps: finalVeoStep ? [...nonVeoSteps, finalVeoStep] : nonVeoSteps,
    premiumOnlyFallback: hasVeoFallback,
    reason: `${route.reason} Veo Lite is never primary and, for Premium, appears only as final fallback/rescue.`,
    veoAllowed: hasVeoFallback,
  }
}

function getStillCreditImpact(assetType: VisualAssetType): ProviderRoute['userCreditImpact'] {
  if (assetType === 'graphic_design_frame' || assetType === 'character_card' || assetType === 'timeline_card') {
    return 'medium'
  }

  if (assetType === 'still_with_editor_motion') {
    return 'low'
  }

  return 'low'
}

function stillRoute(assetType: VisualAssetType) {
  return routeBase({
    primaryModel: 'gpt_image_2',
    fallbackSteps: [
      step('simplify_prompt', 'Simplify image/card prompt', 'Reduce visual density while preserving the story purpose.'),
      step('manual_review', 'Manual review if needed', 'Use human review if a fact, name, amount, or character anchor needs extra accuracy.'),
    ],
    resolution: 'frame',
    providerPurpose: 'Image, card, keyframe, or graphic frame generation',
    internalCostHint: 'low-to-medium image/frame generation',
    userCreditImpact: getStillCreditImpact(assetType),
    reason: 'GPT-Image-2 is the primary model for stills, cards, keyframes, and designed frames.',
  })
}

function motionDesignRoute(recommendedDurationSeconds: number) {
  return routeBase({
    primaryModel: 'remotion_editor_motion',
    fallbackModels: ['gpt_image_2'],
    fallbackSteps: [
      step('simplify_prompt', 'Simplify design system', 'Reduce layout complexity while keeping exact text and labels readable.'),
      step('try_fallback_model', 'Regenerate design frame', 'Regenerate the source card/frame with GPT-Image-2 if the design needs a cleaner base.', 'gpt_image_2'),
    ],
    resolution: 'frame',
    durationSeconds: recommendedDurationSeconds,
    providerPurpose: 'Controlled motion design / VisualExplain animation',
    internalCostHint: 'low deterministic editor motion',
    userCreditImpact: 'medium',
    reason: 'Exact text, labels, diagrams, and layout are controlled by ReeditPro/editor motion, not random AI video.',
  })
}

function strokeStartEnd5sRoute(editLevel: EditLevel) {
  const route = routeBase({
    primaryModel: 'wan_2_2_kf2v_flash',
    fallbackModels: editLevel === 'premium' ? ['hailuo_02', 'veo_3_1_lite'] : editLevel === 'pro' ? ['hailuo_02'] : [],
    fallbackSteps:
      editLevel === 'basic'
        ? [
            step('retry_same_model', 'Retry Wan 2.2', 'Retry the primary low-cost route first.', 'wan_2_2_kf2v_flash'),
            step('simplify_prompt', 'Simplify Stroke Motion prompt', 'Reduce motion density while preserving the story beat.'),
            step('convert_to_still', 'Convert to still', 'Use GPT-Image-2 still/card output if motion is not essential.', 'gpt_image_2'),
            step('convert_to_motion_design', 'Convert to motion design', 'Use controlled editor motion instead of AI video.', 'remotion_editor_motion'),
          ]
        : editLevel === 'pro'
          ? [
              step('try_fallback_model', 'Try Hailuo-02', 'Use Hailuo as the normal start/end fallback with no Veo in Pro.', 'hailuo_02'),
              step('split_scene', 'Split scene', 'Split a dense beat into smaller planned pieces.'),
              step('convert_to_motion_design', 'Convert to motion design', 'Use controlled editor motion if exact timing matters more than AI video.', 'remotion_editor_motion'),
            ]
          : [
              step('try_fallback_model', 'Try Hailuo-02', 'Use the normal fallback before any Premium rescue.', 'hailuo_02'),
              step('split_scene', 'Split scene', 'Split prompt-dense beats before final rescue.'),
              step('try_fallback_model', 'Final Veo 3.1 Lite rescue', 'Premium-only final fallback after Wan/Hailuo are unsuitable or fail QA.', 'veo_3_1_lite', true),
            ],
    resolution: '720P',
    durationSeconds: 5,
    providerPurpose: 'Stroke Motion start/end 5-second animation',
    internalCostHint: 'low-to-medium Wan animation route',
    userCreditImpact: 'medium',
    reason: 'Wan 2.2 KF2V Flash is primary for a 5-second beat with start and end frames.',
  })

  return enforceVeoTierRule(route, editLevel)
}

function strokeStartOnlyRoute(editLevel: EditLevel, recommendedDurationSeconds: number) {
  const route = routeBase({
    primaryModel: 'wan_2_6_i2v_flash',
    fallbackModels: editLevel === 'premium' ? ['hailuo_2_3_fast', 'veo_3_1_lite'] : editLevel === 'pro' ? ['hailuo_2_3_fast'] : [],
    fallbackSteps:
      editLevel === 'basic'
        ? [
            step('retry_same_model', 'Retry Wan 2.6', 'Retry the primary start-frame route first.', 'wan_2_6_i2v_flash'),
            step('simplify_prompt', 'Simplify prompt', 'Keep the action readable and lower motion complexity.'),
            step('convert_to_still', 'Convert to still', 'Use a still/card when generated motion is not essential.', 'gpt_image_2'),
          ]
        : editLevel === 'pro'
          ? [
              step('try_fallback_model', 'Try Hailuo 2.3 Fast', 'Use the normal start-frame fallback at 768P.', 'hailuo_2_3_fast'),
              step('split_scene', 'Split scene', 'Split a long or dense action into clearer beats.'),
            ]
          : [
              step('try_fallback_model', 'Try Hailuo 2.3 Fast', 'Use the normal fallback before any Premium rescue.', 'hailuo_2_3_fast'),
              step('try_fallback_model', 'Final Veo 3.1 Lite rescue', 'Premium-only final fallback for critical scenes or failed QA.', 'veo_3_1_lite', true),
            ],
    resolution: '720P',
    durationSeconds: clamp(recommendedDurationSeconds || 5, 2, 15),
    providerPurpose: 'Stroke Motion start-frame-only animation',
    internalCostHint: 'low-to-medium Wan animation route',
    userCreditImpact: 'medium',
    reason: 'Wan 2.6 I2V Flash is primary for flexible start-frame-only animation.',
  })

  return enforceVeoTierRule(route, editLevel)
}

function longStartEndRoute(editLevel: EditLevel, recommendedDurationSeconds: number) {
  const route = routeBase({
    primaryModel: 'hailuo_02',
    fallbackModels: editLevel === 'premium' ? ['hailuo_02', 'wan_2_2_kf2v_flash', 'veo_3_1_lite'] : editLevel === 'pro' ? ['wan_2_2_kf2v_flash'] : [],
    fallbackSteps:
      editLevel === 'basic'
        ? [
            step('split_scene', 'Split scene', 'Reduce a long beat into smaller beats.'),
            step('convert_to_still', 'Convert to still', 'Use a still/card if long motion is too costly or unnecessary.', 'gpt_image_2'),
            step('convert_to_motion_design', 'Convert to motion design', 'Use controlled motion design instead of AI video.', 'remotion_editor_motion'),
          ]
        : editLevel === 'pro'
          ? [
              step('split_scene', 'Split into two Wan clips', 'Split into two Wan 2.2 5-second clips with no Veo in Pro.', 'wan_2_2_kf2v_flash'),
              step('convert_to_motion_design', 'Convert to motion design', 'Use controlled motion if long animation is not needed.', 'remotion_editor_motion'),
            ]
          : [
              step('retry_same_model', 'Retry Hailuo-02', 'Retry the normal long start/end route before rescue.', 'hailuo_02'),
              step('split_scene', 'Split scene', 'Split the scene if QA failure comes from prompt density.'),
              step('try_fallback_model', 'Final Veo 3.1 Lite rescue', 'Premium-only final fallback after Hailuo and split-scene options are unsuitable.', 'veo_3_1_lite', true),
            ],
    resolution: '768P',
    durationSeconds: recommendedDurationSeconds <= 6 ? 6 : 10,
    providerPurpose: 'Long start/end storytelling animation',
    internalCostHint: 'medium Hailuo start/end route',
    userCreditImpact: editLevel === 'premium' ? 'high' : 'medium',
    reason: 'Hailuo-02 is the normal long start/end route at 768P; Veo is not primary.',
  })

  return enforceVeoTierRule(route, editLevel)
}

function realMotionRoute(editLevel: EditLevel, recommendedDurationSeconds: number) {
  const route = routeBase({
    primaryModel: 'wan_2_6_i2v_flash',
    fallbackModels: editLevel === 'premium' ? ['hailuo_2_3_fast', 'veo_3_1_lite'] : editLevel === 'pro' ? ['hailuo_2_3_fast'] : ['gpt_image_2', 'remotion_editor_motion'],
    fallbackSteps:
      editLevel === 'basic'
        ? [
            step('simplify_prompt', 'Simplify Real Motion idea', 'Avoid heavy Real Motion where possible and reduce realism/object complexity.'),
            step('convert_to_still', 'Convert to graphic/still', 'Use a graphic design frame or still with editor motion instead.', 'gpt_image_2'),
            step('convert_to_motion_design', 'Convert to editor motion', 'Use controlled proof motion instead of AI video.', 'remotion_editor_motion'),
          ]
        : editLevel === 'pro'
          ? [
              step('try_fallback_model', 'Try Hailuo 2.3 Fast', 'Use Hailuo as normal fallback with no Veo in Pro.', 'hailuo_2_3_fast'),
              step('simplify_prompt', 'Simplify Real Motion prompt', 'Reduce realism or placement complexity before increasing cost.'),
            ]
          : [
              step('try_fallback_model', 'Try Hailuo 2.3 Fast', 'Use normal fallback before Premium rescue.', 'hailuo_2_3_fast'),
              step('try_fallback_model', 'Final Veo 3.1 Lite rescue', 'Premium-only final fallback for critical Real Motion scenes after Wan/Hailuo fail QA.', 'veo_3_1_lite', true),
            ],
    resolution: '720P',
    durationSeconds: clamp(recommendedDurationSeconds || 6, 2, 10),
    providerPurpose: 'Real/semi-real object or proof motion using generated keyframes and video motion',
    internalCostHint: 'high-to-premium animation route',
    userCreditImpact: editLevel === 'premium' ? 'premium' : 'high',
    reason: 'Wan is primary for Real Motion; Hailuo is fallback; Veo Lite is Premium-only final rescue.',
  })

  return enforceVeoTierRule(route, editLevel)
}

export function selectProviderRoute(params: RouteParams): ProviderRoute {
  if (params.signatureSystem === 'none') {
    return routeBase({})
  }

  if (params.assetType === 'motion_design_scene' || (params.signatureSystem === 'graphic_design' && !stillAssetTypes.includes(params.assetType))) {
    return enforceVeoTierRule(motionDesignRoute(params.recommendedDurationSeconds), params.editLevel)
  }

  if (stillAssetTypes.includes(params.assetType)) {
    return enforceVeoTierRule(stillRoute(params.assetType), params.editLevel)
  }

  if (params.signatureSystem === 'real_motion' || params.assetType === 'real_motion_scene') {
    return realMotionRoute(params.editLevel, params.recommendedDurationSeconds)
  }

  if (params.needsStartFrame && params.needsEndFrame && params.recommendedDurationSeconds > 5) {
    return longStartEndRoute(params.editLevel, params.recommendedDurationSeconds)
  }

  if (params.signatureSystem === 'stroke_motion' && params.needsStartFrame && params.needsEndFrame && params.recommendedDurationSeconds <= 5) {
    return strokeStartEnd5sRoute(params.editLevel)
  }

  if (params.signatureSystem === 'stroke_motion' && params.needsStartFrame && !params.needsEndFrame) {
    return strokeStartOnlyRoute(params.editLevel, params.recommendedDurationSeconds)
  }

  return enforceVeoTierRule(stillRoute(params.assetType), params.editLevel)
}
