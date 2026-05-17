import type {
  CreditEstimate,
  CreditEstimateAssetSummary,
  CreditEstimatePolicyNote,
  CreditEstimateRiskLevel,
  EditLevel,
  LowerCostAlternative,
  PlannerInput,
  RendererCompositionPlan,
  SignatureSystem,
  VisualAssetPlanItem,
  VisualAssetType,
} from '../types/reeditpro'

type CreateCreditEstimateParams = {
  visualAssetPlan: VisualAssetPlanItem[]
  rendererCompositionPlan?: RendererCompositionPlan
}

const editLevelLabels: Record<EditLevel, string> = {
  basic: 'Basic',
  pro: 'Pro',
  premium: 'Premium',
}

const signatureLabels: Record<SignatureSystem, string> = {
  stroke_motion: 'Stroke Motion',
  graphic_design: 'Graphic Design / VisualExplain',
  real_motion: 'Real Motion',
  sound_sync: 'SoundSync',
  none: 'None',
}

const assetTypeLabels: Record<VisualAssetType, string> = {
  animated_scene: 'AI animation scenes',
  still_scene: 'Still scenes',
  fact_card: 'Fact cards',
  name_card: 'Name cards',
  character_card: 'Character cards',
  list_card: 'List cards',
  timeline_card: 'Timeline cards',
  graphic_design_frame: 'Graphic design frames',
  motion_design_scene: 'Motion design scenes',
  real_motion_scene: 'Real Motion scenes',
  still_with_editor_motion: 'Stills with editor motion',
  transition_scene: 'Transition scenes',
}

const tierBaseCredits: Record<EditLevel, { planning: number; sourceMapping: number; captions: number; cleanup: number }> = {
  basic: { planning: 4, sourceMapping: 0, captions: 8, cleanup: 14 },
  pro: { planning: 6, sourceMapping: 4, captions: 10, cleanup: 18 },
  premium: { planning: 10, sourceMapping: 6, captions: 12, cleanup: 24 },
}

const stillAssetTypes: VisualAssetType[] = [
  'still_scene',
  'fact_card',
  'name_card',
  'list_card',
  'timeline_card',
  'still_with_editor_motion',
]

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<T, number>>((counts, item) => {
    counts[item] = (counts[item] ?? 0) + 1
    return counts
  }, {} as Record<T, number>)
}

function countAssets(visualAssetPlan: VisualAssetPlanItem[]) {
  return countBy(visualAssetPlan.map((asset) => asset.assetType))
}

function countSystems(visualAssetPlan: VisualAssetPlanItem[]) {
  return countBy(visualAssetPlan.map((asset) => asset.signatureSystem))
}

function pricePerStill(editLevel: EditLevel) {
  if (editLevel === 'premium') return 7
  if (editLevel === 'pro') return 5
  return 3
}

function pricePerCharacter(editLevel: EditLevel) {
  if (editLevel === 'premium') return 10
  if (editLevel === 'pro') return 7
  return 4
}

function pricePerGraphicFrame(editLevel: EditLevel) {
  if (editLevel === 'premium') return 12
  if (editLevel === 'pro') return 8
  return 5
}

function pricePerMotionDesign(editLevel: EditLevel) {
  if (editLevel === 'premium') return 18
  if (editLevel === 'pro') return 12
  return 6
}

function pricePerStrokeMotion(editLevel: EditLevel) {
  if (editLevel === 'premium') return 28
  if (editLevel === 'pro') return 18
  return 10
}

function pricePerRealMotion(editLevel: EditLevel) {
  if (editLevel === 'premium') return 50
  if (editLevel === 'pro') return 34
  return 26
}

function soundSyncCredits(editLevel: EditLevel) {
  if (editLevel === 'premium') return 12
  if (editLevel === 'pro') return 8
  return 6
}

function containsVeoRoute(visualAssetPlan: VisualAssetPlanItem[]) {
  return visualAssetPlan.some((asset) => {
    const route = asset.providerRoute
    return (
      route.primaryModel === 'veo_3_1_lite' ||
      route.fallbackModels.includes('veo_3_1_lite') ||
      route.fallbackSteps.some((fallbackStep) => fallbackStep.model === 'veo_3_1_lite')
    )
  })
}

function countAiVideoScenes(visualAssetPlan: VisualAssetPlanItem[]) {
  return visualAssetPlan.filter((asset) => asset.assetType === 'animated_scene' || asset.assetType === 'real_motion_scene').length
}

function fallbackAllowanceCredits(input: PlannerInput, visualAssetPlan: VisualAssetPlanItem[]) {
  const fallbackRouteCount = visualAssetPlan.filter((asset) => asset.providerRoute.fallbackModels.length > 0 || asset.providerRoute.fallbackSteps.length > 0).length
  const aiVideoCount = countAiVideoScenes(visualAssetPlan)

  if (input.editLevel === 'premium') {
    return Math.min(40, 24 + aiVideoCount * 4 + Math.max(0, fallbackRouteCount - 2) * 2)
  }

  if (input.editLevel === 'pro') {
    return Math.min(16, 10 + Math.max(0, fallbackRouteCount - 1) * 2)
  }

  return Math.min(5, Math.max(0, fallbackRouteCount))
}

function getFallbackPolicyNotes(input: PlannerInput, visualAssetPlan: VisualAssetPlanItem[]): CreditEstimatePolicyNote[] {
  const notes: CreditEstimatePolicyNote[] = [
    {
      label: 'Approval gate',
      tone: 'success',
      message: 'Credits are estimated before generation and deducted only after approval.',
    },
    {
      label: 'Provider cost privacy',
      tone: 'info',
      message: 'Provider costs are internal; users see Reedit Credits.',
    },
  ]

  if (input.editLevel === 'premium') {
    notes.push({
      label: 'Premium fallback policy',
      tone: 'warning',
      message: 'Veo Lite is available only as final fallback/rescue.',
    })
  } else {
    notes.push({
      label: `${editLevelLabels[input.editLevel]} model policy`,
      tone: 'info',
      message: 'Veo Lite is locked for this tier.',
    })
  }

  if (input.editLevel !== 'premium' && containsVeoRoute(visualAssetPlan)) {
    notes.push({
      label: 'Planner warning',
      tone: 'warning',
      message: 'Planner warning: Veo route removed because this tier cannot use Veo.',
    })
  }

  return notes
}

function creditBreakdown(input: PlannerInput, params: CreateCreditEstimateParams, fallbackCredits: number): CreditEstimate['breakdown'] {
  const base = tierBaseCredits[input.editLevel]
  const assetCounts = countAssets(params.visualAssetPlan)
  const stillCount = stillAssetTypes.reduce((sum, assetType) => sum + (assetCounts[assetType] ?? 0), 0)
  const characterCount = assetCounts.character_card ?? 0
  const graphicFrameCount = assetCounts.graphic_design_frame ?? 0
  const motionDesignCount = assetCounts.motion_design_scene ?? 0
  const strokeMotionCount = params.visualAssetPlan.filter((asset) => asset.assetType === 'animated_scene' && asset.signatureSystem === 'stroke_motion').length
  const realMotionCount = params.visualAssetPlan.filter((asset) => asset.assetType === 'real_motion_scene' || asset.signatureSystem === 'real_motion').length
  const breakdown: CreditEstimate['breakdown'] = [
    { label: 'Planning and story/transcript analysis', credits: base.planning, reason: `${editLevelLabels[input.editLevel]} planning depth for story, transcript, and intent analysis.` },
    { label: 'Source sequence mapping', credits: base.sourceMapping, reason: 'Reviews uploaded order before any edit order changes are proposed.' },
    { label: 'Captions', credits: base.captions, reason: 'Editable captions aligned with StoryTiming and safe zones.' },
    { label: 'Edit cleanup', credits: base.cleanup, reason: 'Trim dead space, smooth pacing, and keep the edit professional.' },
  ]

  if (stillCount > 0) {
    breakdown.push({
      label: 'GPT-Image-2 still/card/keyframe assets',
      credits: stillCount * pricePerStill(input.editLevel),
      reason: `${stillCount} still, card, keyframe, or editor-motion asset${stillCount === 1 ? '' : 's'} selected by story beat.`,
    })
  }

  if (characterCount > 0) {
    breakdown.push({
      label: 'Character reference/card assets',
      credits: characterCount * pricePerCharacter(input.editLevel),
      reason: 'Character cards support consistency across still and animation planning.',
    })
  }

  if (graphicFrameCount > 0) {
    breakdown.push({
      label: 'Graphic Design / VisualExplain frames',
      credits: graphicFrameCount * pricePerGraphicFrame(input.editLevel),
      reason: 'Controlled graphic frames for readable labels, proof, lists, or diagrams.',
    })
  }

  if (motionDesignCount > 0) {
    breakdown.push({
      label: 'Controlled Remotion motion design',
      credits: motionDesignCount * pricePerMotionDesign(input.editLevel),
      reason: 'Editor-controlled motion for exact diagrams, highlights, arrows, and timing.',
    })
  }

  if (strokeMotionCount > 0) {
    breakdown.push({
      label: 'Stroke Motion AI video scenes',
      credits: strokeMotionCount * pricePerStrokeMotion(input.editLevel),
      reason: `${strokeMotionCount} story/action/emotion beat${strokeMotionCount === 1 ? '' : 's'} where motion improves the story.`,
    })
  }

  if (realMotionCount > 0) {
    breakdown.push({
      label: 'Real Motion scenes',
      credits: realMotionCount * pricePerRealMotion(input.editLevel),
      reason: 'Credit-heavy object/proof motion remains overlay-first and face-safe.',
    })
  }

  breakdown.push({
    label: 'SoundSync support',
    credits: soundSyncCredits(input.editLevel),
    reason: 'Timing support for music, SFX cues, ducking, and beat placement.',
  })

  if (params.rendererCompositionPlan) {
    breakdown.push({
      label: 'Remotion composition plan placeholder',
      credits: 0,
      reason: 'Rendering is planned but not implemented in this frontend milestone.',
    })
  }

  if (fallbackCredits > 0) {
    const label =
      input.editLevel === 'premium'
        ? 'Premium fallback allowance'
        : input.editLevel === 'pro'
          ? 'Pro Hailuo fallback allowance'
          : 'Basic fallback allowance'
    const reason =
      input.editLevel === 'premium'
        ? 'Hailuo fallback plus Premium-only final Veo Lite rescue allowance; Veo is not default.'
        : input.editLevel === 'pro'
          ? 'Hailuo fallback allowance. Veo Lite is locked for Pro.'
          : 'Low retry depth. Veo Lite is locked for Basic.'

    breakdown.push({ label, credits: fallbackCredits, reason })
  }

  return breakdown
}

function assetTypeSummary(input: PlannerInput, visualAssetPlan: VisualAssetPlanItem[]): CreditEstimateAssetSummary[] {
  const counts = countAssets(visualAssetPlan)

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([assetType, count]) => {
      const typedAssetType = assetType as VisualAssetType
      const perAsset =
        typedAssetType === 'motion_design_scene'
          ? pricePerMotionDesign(input.editLevel)
          : typedAssetType === 'animated_scene'
            ? pricePerStrokeMotion(input.editLevel)
            : typedAssetType === 'real_motion_scene'
              ? pricePerRealMotion(input.editLevel)
              : typedAssetType === 'character_card'
                ? pricePerCharacter(input.editLevel)
                : typedAssetType === 'graphic_design_frame'
                  ? pricePerGraphicFrame(input.editLevel)
                  : pricePerStill(input.editLevel)

      return {
        label: assetTypeLabels[typedAssetType],
        count,
        credits: count * perAsset,
        reason: `${count} planned ${assetTypeLabels[typedAssetType].toLowerCase()}.`,
      }
    })
}

function visualSystemSummary(input: PlannerInput, visualAssetPlan: VisualAssetPlanItem[]): CreditEstimateAssetSummary[] {
  const counts = countSystems(visualAssetPlan)

  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([signatureSystem, count]) => {
      const typedSystem = signatureSystem as SignatureSystem
      const credits = visualAssetPlan
        .filter((asset) => asset.signatureSystem === typedSystem)
        .reduce((sum, asset) => {
          if (asset.assetType === 'real_motion_scene') return sum + pricePerRealMotion(input.editLevel)
          if (asset.assetType === 'animated_scene') return sum + pricePerStrokeMotion(input.editLevel)
          if (asset.assetType === 'motion_design_scene') return sum + pricePerMotionDesign(input.editLevel)
          if (asset.assetType === 'graphic_design_frame') return sum + pricePerGraphicFrame(input.editLevel)
          if (asset.assetType === 'character_card') return sum + pricePerCharacter(input.editLevel)
          return sum + pricePerStill(input.editLevel)
        }, 0)

      return {
        label: signatureLabels[typedSystem],
        count,
        credits,
        reason: `${signatureLabels[typedSystem]} appears in ${count} planned visual beat${count === 1 ? '' : 's'}.`,
      }
    })
}

function estimateRisk(input: PlannerInput, visualAssetPlan: VisualAssetPlanItem[]): CreditEstimateRiskLevel {
  const aiVideoCount = countAiVideoScenes(visualAssetPlan)
  const realMotionCount = visualAssetPlan.filter((asset) => asset.signatureSystem === 'real_motion' || asset.assetType === 'real_motion_scene').length

  if (input.editLevel === 'premium' && (aiVideoCount >= 2 || realMotionCount > 0)) {
    return 'premium'
  }

  if (realMotionCount > 0 || (input.editLevel === 'pro' && aiVideoCount >= 3)) {
    return 'high'
  }

  if (input.editLevel === 'pro' || aiVideoCount > 0 || visualAssetPlan.length >= 4) {
    return 'medium'
  }

  return 'low'
}

function lowerCostAlternatives(input: PlannerInput, visualAssetPlan: VisualAssetPlanItem[], fallbackCredits: number, riskLevel: CreditEstimateRiskLevel): LowerCostAlternative[] {
  const alternatives: LowerCostAlternative[] = []
  const hasAnimation = visualAssetPlan.some((asset) => asset.assetType === 'animated_scene')
  const hasMotionDesign = visualAssetPlan.some((asset) => asset.assetType === 'motion_design_scene')
  const hasRealMotion = visualAssetPlan.some((asset) => asset.assetType === 'real_motion_scene' || asset.signatureSystem === 'real_motion')

  if (hasAnimation) {
    alternatives.push({
      label: 'Convert one animation beat to a still card',
      estimatedSavings: input.editLevel === 'premium' ? 18 : input.editLevel === 'pro' ? 12 : 7,
      tradeoff: 'Less generated motion, but the story beat stays clear with a designed still/card.',
      actionHint: 'Use GPT-Image-2 still/card output with editor motion.',
    })
  }

  if (hasMotionDesign) {
    alternatives.push({
      label: 'Use simpler editor motion for one diagram',
      estimatedSavings: input.editLevel === 'premium' ? 8 : 5,
      tradeoff: 'Less elaborate animation, but exact text and labels remain controlled.',
      actionHint: 'Simplify the VisualExplain motion preset.',
    })
  }

  if (hasRealMotion) {
    alternatives.push({
      label: 'Remove Real Motion',
      estimatedSavings: input.editLevel === 'premium' ? 35 : 24,
      tradeoff: 'Loses realistic object/proof motion, but keeps a lower-cost proof visual.',
      actionHint: 'Replace with Graphic Design / VisualExplain or still-with-editor-motion.',
    })
  }

  if (fallbackCredits > 0) {
    alternatives.push({
      label: 'Reduce fallback allowance',
      estimatedSavings: Math.min(fallbackCredits, input.editLevel === 'premium' ? 12 : 6),
      tradeoff: 'Lower retry/fallback depth if a generated asset fails QA.',
      actionHint: 'Use fewer retries and convert failed beats to stills or motion design.',
    })
  }

  if (input.editLevel === 'premium') {
    alternatives.push({
      label: 'Use Pro routing if Premium rescue is not needed',
      estimatedSavings: 16,
      tradeoff: 'Removes Premium fallback depth and final rescue options.',
      actionHint: 'Switch to Pro if the scene does not need Premium consistency checks.',
    })
  }

  if (riskLevel === 'low') {
    return alternatives.slice(0, 1)
  }

  return alternatives.slice(0, 3)
}

export function createCreditEstimate(input: PlannerInput, params: CreateCreditEstimateParams): CreditEstimate {
  const fallbackCredits = fallbackAllowanceCredits(input, params.visualAssetPlan)
  const breakdown = creditBreakdown(input, params, fallbackCredits)
  const total = breakdown.reduce((sum, item) => sum + item.credits, 0)
  const riskLevel = estimateRisk(input, params.visualAssetPlan)

  return {
    total,
    breakdown,
    editLevel: input.editLevel,
    editingCategory: input.editingCategory,
    visualSystemSummary: visualSystemSummary(input, params.visualAssetPlan),
    assetTypeSummary: assetTypeSummary(input, params.visualAssetPlan),
    fallbackAllowanceCredits: fallbackCredits,
    fallbackPolicyNotes: getFallbackPolicyNotes(input, params.visualAssetPlan),
    lowerCostAlternatives: lowerCostAlternatives(input, params.visualAssetPlan, fallbackCredits, riskLevel),
    riskLevel,
    approvalCopy: 'Approve the edit plan and credit estimate before mock progress can begin.',
    estimateVersion: 'mock-vs-05',
  }
}
