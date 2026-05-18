import type {
  CreditTradeoffOption,
  DepthCompositionComplexity,
  DepthCompositionCreditProfile,
  DepthCompositingMode,
  EditLevel,
  MaskRiskLevel,
  MaskStrategy,
  SpeakerVisualLayoutMode,
  TrackingRequirement,
} from '../types/reeditpro'

export const depthCompositionCreditProfiles: DepthCompositionCreditProfile[] = [
  {
    id: 'depth-credit-none',
    complexity: 'none',
    label: 'No depth composition',
    description: 'No foreground-aware overlay, masking, tracking, or special depth QA is planned.',
    creditImpact: 'none',
    estimatedPlanningCredits: 0,
    bestFor: ['Caption-only edits', 'Normal panels', 'Simple source cleanup'],
    avoidFor: ['Behind-subject graphics', 'Contact-object preservation'],
    tierFit: { basic: true, pro: true, premium: true },
    requiredFallback: false,
    qaChecks: ['Confirm no foreground mask or depth-worker expectation is implied.'],
  },
  {
    id: 'depth-credit-simple',
    complexity: 'simple',
    label: 'Simple overlay layout',
    description: 'Normal overlay, lower panel, side-by-side, or full visual takeover with no real mask dependency.',
    creditImpact: 'low',
    estimatedPlanningCredits: 1,
    bestFor: ['Basic-safe panels', 'Lower thirds', 'Simple graphic overlays'],
    avoidFor: ['Thin foreground objects', 'Subject cutouts'],
    tierFit: { basic: true, pro: true, premium: true },
    requiredFallback: false,
    qaChecks: ['Keep captions above graphics.', 'Keep text readable inside the safe zone.'],
  },
  {
    id: 'depth-credit-moderate',
    complexity: 'moderate',
    label: 'Subject mask planning',
    description: 'Plans a low/medium-risk subject mask or static foreground preservation with fallback QA.',
    creditImpact: 'medium',
    estimatedPlanningCredits: 4,
    bestFor: ['Static subject foregrounds', 'Simple map/card behind a person', 'Pro-safe depth polish'],
    avoidFor: ['Fast movement', 'Thin contact objects', 'Multi-object tracking'],
    tierFit: { basic: true, pro: true, premium: true },
    requiredFallback: true,
    qaChecks: ['Fallback layout exists.', 'Caption layer stays above mask.', 'Future mask worker is noted.'],
  },
  {
    id: 'depth-credit-advanced',
    complexity: 'advanced',
    label: 'Subject plus object preservation',
    description: 'Plans subject plus contact-object masks, hero-object masks, object-anchored callouts, and higher QA.',
    creditImpact: 'high',
    estimatedPlanningCredits: 7,
    bestFor: ['Map behind person and pole', 'Object-anchored callouts', 'Hero object preservation'],
    avoidFor: ['Basic tier', 'No fallback layout', 'Unclear contact object relationship'],
    tierFit: { basic: false, pro: true, premium: true },
    requiredFallback: true,
    qaChecks: ['Contact object is preserved in front.', 'Fallback if mask fails is explicit.', 'Graphic labels avoid foreground group.'],
  },
  {
    id: 'depth-credit-premium',
    complexity: 'premium',
    label: 'Premium multi-object depth',
    description: 'Plans multi-object tracking, full cutout composition, manual review, stronger fallback, and premium QA.',
    creditImpact: 'premium',
    estimatedPlanningCredits: 12,
    bestFor: ['Premium cutout compositions', 'Multi-object foreground groups', 'Manual-review depth shots'],
    avoidFor: ['Basic and Pro tiers', 'Unapproved worker execution', 'No QA/manual review notes'],
    tierFit: { basic: false, pro: false, premium: true },
    requiredFallback: true,
    qaChecks: ['Manual review is noted.', 'Fallback layout exists.', 'No Veo is introduced by depth composition.'],
  },
]

const complexityOrder: Record<DepthCompositionComplexity, number> = {
  none: 0,
  simple: 1,
  moderate: 2,
  advanced: 3,
  premium: 4,
}

function maxComplexity(values: DepthCompositionComplexity[]) {
  return values.reduce<DepthCompositionComplexity>(
    (highest, value) => (complexityOrder[value] > complexityOrder[highest] ? value : highest),
    'none',
  )
}

export function getDepthCompositionCreditProfile(complexity: DepthCompositionComplexity) {
  return depthCompositionCreditProfiles.find((profile) => profile.complexity === complexity) ?? depthCompositionCreditProfiles[0]
}

export function inferDepthCompositionComplexity(params: {
  depthCompositingMode?: DepthCompositingMode
  maskStrategy?: MaskStrategy
  maskRisk?: MaskRiskLevel
  trackingRequirement?: TrackingRequirement
  editLevel?: EditLevel
  foregroundObjectCount?: number
  contactObjectCount?: number
}): DepthCompositionComplexity {
  const {
    contactObjectCount = 0,
    depthCompositingMode = 'none',
    foregroundObjectCount = 0,
    maskRisk = 'low',
    maskStrategy = 'none',
    trackingRequirement = 'none',
  } = params

  const candidates: DepthCompositionComplexity[] = []

  if (depthCompositingMode === 'none' && maskStrategy === 'none') candidates.push('none')
  if (depthCompositingMode === 'graphic_on_top' || depthCompositingMode === 'full_visual_replacement') candidates.push('simple')
  if (depthCompositingMode === 'masked_panel_behind_subject' || depthCompositingMode === 'graphic_behind_subject') candidates.push('moderate')
  if (depthCompositingMode === 'graphic_behind_subject_and_contact_objects' || depthCompositingMode === 'object_anchored_overlay') candidates.push('advanced')
  if (depthCompositingMode === 'subject_cutout_overlay' || depthCompositingMode === 'graphic_between_background_and_foreground') candidates.push('advanced')

  if (maskStrategy === 'subject_mask' || trackingRequirement === 'static_mask' || trackingRequirement === 'light_tracking') candidates.push('moderate')
  if (maskStrategy === 'subject_plus_contact_object_mask' || maskStrategy === 'hero_object_mask' || maskStrategy === 'scene_anchor_mask') candidates.push('advanced')
  if (maskStrategy === 'multi_object_depth_mask' || maskStrategy === 'full_cutout_composition') candidates.push('premium')

  if (maskRisk === 'medium') candidates.push('moderate')
  if (maskRisk === 'high') candidates.push('advanced')
  if (maskRisk === 'premium') candidates.push('premium')

  if (trackingRequirement === 'object_tracking') candidates.push('advanced')
  if (trackingRequirement === 'multi_object_tracking' || trackingRequirement === 'manual_review_recommended') candidates.push('premium')
  if (contactObjectCount > 0) candidates.push('advanced')
  if (foregroundObjectCount >= 3) candidates.push('premium')

  return maxComplexity(candidates.length ? candidates : ['none'])
}

export function createDepthLowerCostAlternatives(params: {
  complexity: DepthCompositionComplexity
  currentLayoutMode?: SpeakerVisualLayoutMode
  targetTier?: EditLevel
  estimatedPlanningCredits?: number
  hasContactObject?: boolean
  hasTracking?: boolean
  hasAnimatedOverlay?: boolean
  readabilityRisk?: boolean
}): CreditTradeoffOption[] {
  const profile = getDepthCompositionCreditProfile(params.complexity)
  const savingsBase = Math.max(params.estimatedPlanningCredits ?? profile.estimatedPlanningCredits, profile.estimatedPlanningCredits)
  const alternatives: CreditTradeoffOption[] = []

  if (params.complexity === 'none') {
    return []
  }

  alternatives.push({
    label: 'Use a lower visual panel',
    estimatedSavings: Math.max(1, Math.min(savingsBase, 6)),
    tradeoff: 'Less integrated than a behind-subject overlay, but safer for faces, captions, and labels.',
    actionHint: 'Switch the depth item to a lower visual panel with captions above all.',
  })

  alternatives.push({
    label: 'Use side-by-side layout',
    estimatedSavings: Math.max(1, Math.min(savingsBase, 5)),
    tradeoff: 'The speaker and visual are separated, which reduces mask risk and keeps text readable.',
    actionHint: 'Use side-by-side speaker/visual layout instead of foreground-aware masking.',
  })

  if (params.currentLayoutMode !== 'voiceover_visual_takeover' && params.currentLayoutMode !== 'full_map_takeover' && params.currentLayoutMode !== 'full_graphic_explainer') {
    alternatives.push({
      label: 'Use full visual takeover',
      estimatedSavings: Math.max(1, Math.min(savingsBase, 4)),
      tradeoff: 'The voice can continue while the visual takes over, but the premium in-scene depth look is removed.',
      actionHint: 'Cut to the map/card/chart full-frame, then return to the speaker.',
    })
  }

  if (params.hasContactObject) {
    alternatives.push({
      label: 'Preserve only the person',
      estimatedSavings: Math.max(1, Math.min(savingsBase, 4)),
      tradeoff: 'The contact object may sit behind the graphic, but the main subject stays protected.',
      actionHint: 'Remove contact-object preservation and keep only subject mask planning.',
    })
  }

  if (params.hasAnimatedOverlay) {
    alternatives.push({
      label: 'Use a static card',
      estimatedSavings: Math.max(1, Math.min(savingsBase, 3)),
      tradeoff: 'Less movement, but lower planning and QA complexity.',
      actionHint: 'Use a static map/card/chart instead of animated depth overlay.',
    })
  }

  if (params.hasTracking) {
    alternatives.push({
      label: 'Remove object tracking',
      estimatedSavings: Math.max(1, Math.min(savingsBase, 5)),
      tradeoff: 'Works best for simpler shots or when the subject is not moving much.',
      actionHint: 'Use a static or lightly tracked mask plan with fallback.',
    })
  }

  if (params.readabilityRisk) {
    alternatives.push({
      label: 'Simplify labels',
      estimatedSavings: Math.max(1, Math.min(savingsBase, 2)),
      tradeoff: 'Fewer labels or pins, but the important text stays readable.',
      actionHint: 'Reduce map/chart/browser label density and avoid the foreground zone.',
    })
  }

  if (params.targetTier === 'basic' || params.complexity === 'advanced' || params.complexity === 'premium') {
    alternatives.push({
      label: 'Use Basic-safe layout',
      estimatedSavings: Math.max(1, Math.min(savingsBase, 8)),
      tradeoff: 'Basic stays professional with a safer composition instead of hidden premium mask complexity.',
      actionHint: 'Downgrade to lower panel, side-by-side, or full visual takeover.',
    })
  }

  return alternatives.slice(0, 6)
}
