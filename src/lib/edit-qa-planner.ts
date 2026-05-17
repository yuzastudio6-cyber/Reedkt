import type {
  CompiledEditingIntent,
  CharacterConsistencyPlan,
  DocumentaryFactSafetyPlan,
  EditLevel,
  EditQAPlan,
  FallbackStep,
  PlannerInput,
  RendererCompositionPlan,
  SegmentEditPlan,
  SegmentQAPlanItem,
  VisualAssetPlanItem,
} from '../types/reeditpro'

function fallbackActionsForLevel(editLevel: EditLevel): FallbackStep[] {
  if (editLevel === 'premium') {
    return [
      {
        action: 'retry_same_model',
        label: 'Retry approved model',
        reason: 'Retry within approved fallback depth before changing route.',
      },
      {
        action: 'try_fallback_model',
        label: 'Try Hailuo fallback',
        model: 'hailuo_2_3_fast',
        reason: 'Use normal fallback/alternate animation route first.',
      },
      {
        action: 'split_scene',
        label: 'Split scene',
        reason: 'Reduce generation complexity before final rescue.',
      },
      {
        action: 'try_fallback_model',
        label: 'Veo Lite final fallback only',
        model: 'veo_3_1_lite',
        premiumOnly: true,
        reason: 'Premium may use Veo Lite only as final fallback/rescue, never as default.',
      },
    ]
  }

  return [
    {
      action: 'retry_same_model',
      label: 'Retry approved model',
      reason: 'Retry only inside the approved Basic/Pro route.',
    },
    {
      action: 'simplify_prompt',
      label: 'Simplify prompt',
      reason: 'Reduce complexity without changing tier policy.',
    },
    {
      action: 'split_scene',
      label: 'Split scene',
      reason: 'Make the scene easier without using Premium-only fallback.',
    },
    {
      action: 'convert_to_still',
      label: 'Convert to still',
      reason: 'Use a professional lower-compute fallback.',
    },
    {
      action: 'convert_to_motion_design',
      label: 'Convert to motion design',
      reason: 'Use controlled editor motion instead of unavailable model routes.',
    },
    {
      action: 'manual_review',
      label: 'Manual review',
      reason: 'Ask for review if the edit cannot be completed in the approved tier.',
    },
  ]
}

function createQAItem(params: Omit<SegmentQAPlanItem, 'id' | 'status' | 'fallbackActions' | 'notes'> & {
  id: string
  editLevel: EditLevel
  notes?: string[]
  status?: SegmentQAPlanItem['status']
}): SegmentQAPlanItem {
  const { editLevel, id, notes = [], status = 'not_checked', ...item } = params

  return {
    ...item,
    id,
    status,
    fallbackActions: fallbackActionsForLevel(editLevel),
    notes,
  }
}

function routeUsesVeo(asset: VisualAssetPlanItem) {
  return asset.providerRoute.primaryModel === 'veo_3_1_lite' ||
    asset.providerRoute.fallbackModels.includes('veo_3_1_lite') ||
    asset.providerRoute.fallbackSteps.some((step) => step.model === 'veo_3_1_lite')
}

function routeUsesVeoAsPrimary(asset: VisualAssetPlanItem) {
  return asset.providerRoute.primaryModel === 'veo_3_1_lite'
}

function hasDefault1080p(asset: VisualAssetPlanItem) {
  return asset.providerRoute.resolution === '1080P'
}

function createTierPolicyChecks(input: PlannerInput, visualAssetPlan: VisualAssetPlanItem[] | undefined) {
  const assets = visualAssetPlan ?? []
  const hasVeo = assets.some(routeUsesVeo)
  const hasPrimaryVeo = assets.some(routeUsesVeoAsPrimary)
  const has1080p = assets.some(hasDefault1080p)
  const checks: SegmentQAPlanItem[] = []

  checks.push(createQAItem({
    id: 'qa-tier-veo-policy',
    category: 'model_tier_policy',
    label: input.editLevel === 'premium' ? 'Premium Veo final fallback only' : 'Basic/Pro Veo lock',
    check:
      input.editLevel === 'premium'
        ? 'Veo Lite may appear only as final fallback/rescue and never as primary.'
        : 'Basic and Pro must not include Veo in primary models, fallback models, or fallback steps.',
    editLevel: input.editLevel,
    severity: input.editLevel === 'premium' ? 'high' : 'blocking',
    status: input.editLevel === 'premium' ? (hasPrimaryVeo ? 'failed' : 'not_checked') : hasVeo ? 'failed' : 'not_checked',
    notes: [
      input.editLevel === 'premium' ? 'Premium keeps Veo as final fallback only.' : 'Basic/Pro fallback paths use simplification, splitting, stills, motion design, or Hailuo where allowed.',
    ],
  }))

  checks.push(createQAItem({
    id: 'qa-tier-no-primary-veo',
    category: 'model_tier_policy',
    label: 'No primary Veo',
    check: 'No route may use Veo 3.1 Lite as the primary/default model.',
    editLevel: input.editLevel,
    severity: 'blocking',
    status: hasPrimaryVeo ? 'failed' : 'not_checked',
    notes: ['Veo is never the primary model.'],
  }))

  checks.push(createQAItem({
    id: 'qa-tier-no-1080p-default',
    category: 'model_tier_policy',
    label: 'No 1080P default',
    check: 'Generated animation routes must stay 720P-class: Wan 720P, Hailuo 768P, Veo 720P.',
    editLevel: input.editLevel,
    severity: 'high',
    status: has1080p ? 'failed' : 'not_checked',
    notes: ['Never default generated video to 1080P.'],
  }))

  return checks
}

function createGlobalChecks(input: PlannerInput, compiledIntent: CompiledEditingIntent, rendererCompositionPlan?: RendererCompositionPlan) {
  const baseNotes = compiledIntent.compilerNotes.slice(0, 2)

  return [
    createQAItem({
      id: 'qa-global-must-follow',
      category: 'user_intent_match',
      label: 'Must-follow rules',
      check: 'User must-follow rules from compiled intent are represented in segment operations.',
      editLevel: input.editLevel,
      severity: 'blocking',
      notes: compiledIntent.mustFollowRules.slice(0, 3),
    }),
    createQAItem({
      id: 'qa-global-avoid-rules',
      category: 'user_intent_match',
      label: 'Avoid rules',
      check: 'User avoid rules are not violated by cuts, captions, b-roll, color, sound, visuals, or transitions.',
      editLevel: input.editLevel,
      severity: 'blocking',
      notes: compiledIntent.avoidRules.slice(0, 3),
    }),
    createQAItem({
      id: 'qa-global-source-order',
      category: 'source_order_and_structure',
      label: 'Source order review',
      check: 'Uploaded source order is reviewed before ReeditPro suggests final edit order changes.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: ['Source order confirmation remains chat/UI state in this milestone.'],
    }),
    createQAItem({
      id: 'qa-global-randomness',
      category: 'user_intent_match',
      label: 'No random editing',
      check: 'No random b-roll, transitions, captions, color, or visual effects are introduced.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: baseNotes,
    }),
    createQAItem({
      id: 'qa-global-frame-background',
      category: 'frame_layout',
      label: 'Matching panel background',
      check: 'AI video assets stay inside controlled panels with matching white/near-white/custom backgrounds.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: [
        rendererCompositionPlan
          ? `Panel background: ${rendererCompositionPlan.panelBackgroundColor}.`
          : 'Renderer plan not present in this mock QA input.',
      ],
    }),
  ]
}

function createSegmentChecks(input: PlannerInput, segmentEditPlans: SegmentEditPlan[]) {
  return segmentEditPlans.flatMap((segment) => [
    ...segment.qaPlan,
    createQAItem({
      id: `${segment.id}-qa-broll`,
      category: 'b_roll',
      label: `${segment.label} b-roll meaning`,
      check: 'B-roll must support spoken meaning and not fill space randomly.',
      editLevel: input.editLevel,
      severity: 'medium',
      notes: [segment.brollPlan.meaningRule],
    }),
    createQAItem({
      id: `${segment.id}-qa-color`,
      category: 'color_grade',
      label: `${segment.label} color grade`,
      check: 'Color grade must match the selected directive and protect skin/product tones.',
      editLevel: input.editLevel,
      severity: 'medium',
      notes: segment.colorGradePlan.notes,
    }),
    createQAItem({
      id: `${segment.id}-qa-sound`,
      category: 'sound_sync',
      label: `${segment.label} sound clarity`,
      check: 'Voice must stay clean and music/SFX must not overpower speech.',
      editLevel: input.editLevel,
      severity: 'medium',
      notes: segment.soundPlan.notes,
    }),
  ])
}

function createApprovalChecks(input: PlannerInput) {
  return [
    createQAItem({
      id: 'qa-approval-plan',
      category: 'credit_approval',
      label: 'Plan approval required',
      check: 'User must approve the edit plan before generation, editing, rendering, or provider work begins.',
      editLevel: input.editLevel,
      severity: 'blocking',
      notes: ['This frontend demo starts no real editing.'],
    }),
    createQAItem({
      id: 'qa-approval-credits',
      category: 'credit_approval',
      label: 'Credit estimate approval required',
      check: 'User must approve the credit estimate before any future job start or credit reservation.',
      editLevel: input.editLevel,
      severity: 'blocking',
      notes: ['No real credits are deducted in this milestone.'],
    }),
  ]
}

function createRendererChecks(input: PlannerInput, rendererCompositionPlan: RendererCompositionPlan | undefined) {
  if (!rendererCompositionPlan) {
    return []
  }

  return [
    createQAItem({
      id: 'qa-renderer-composition',
      category: 'render_composition',
      label: 'Remotion composition ownership',
      check: 'Remotion owns final composition; AI video models generate assets/clips only.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: rendererCompositionPlan.rendererNotes,
    }),
    createQAItem({
      id: 'qa-renderer-safe-zones',
      category: 'frame_layout',
      label: 'Frame safe zones',
      check: 'Speaker zone, caption safe zone, and animation panel are respected.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: rendererCompositionPlan.frameTemplate.notes,
    }),
  ]
}

function createSafetyChecks(input: PlannerInput) {
  if (input.editingCategory !== 'documentary_case_study') {
    return []
  }

  return [
    createQAItem({
      id: 'qa-safety-claims',
      category: 'safety_and_claims',
      label: 'Documentary claim safety',
      check: 'Real people, allegations, names, and claims are treated neutrally unless verified by source material.',
      editLevel: input.editLevel,
      severity: 'blocking',
      notes: ['Use neutral evidence cards and avoid presenting allegations as proven facts.'],
    }),
  ]
}

function createCharacterConsistencyChecks(input: PlannerInput, characterConsistencyPlan?: CharacterConsistencyPlan) {
  if (!characterConsistencyPlan || characterConsistencyPlan.packs.length === 0) {
    return []
  }

  return [
    createQAItem({
      id: 'qa-character-pack-consistency',
      category: 'visual_assets',
      label: 'Character pack consistency',
      check: 'Recurring characters must preserve outfit, silhouette, style mode, expression range, and identity across cards, keyframes, start/end frames, and animation clips.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: characterConsistencyPlan.globalRules.slice(0, 3),
    }),
    createQAItem({
      id: 'qa-character-start-end-frames',
      category: 'visual_assets',
      label: 'Start/end frame identity',
      check: 'Start frames and end frames for animated assets must reuse the same approved character reference pack.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: characterConsistencyPlan.packs.flatMap((pack) => pack.referenceAssetsNeeded.map((asset) => asset.label)).slice(0, 4),
    }),
    createQAItem({
      id: 'qa-character-mention-only',
      category: 'safety_and_claims',
      label: 'Mention-only people stay neutral',
      check: 'Mention-only, real named, or unknown people should use neutral cards, lineup cards, silhouettes, or generic figures rather than full animation.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: characterConsistencyPlan.packs
        .filter((pack) => pack.importance === 'mention_only' || pack.realityStatus === 'real_named_person' || pack.realityStatus === 'unknown')
        .map((pack) => `${pack.displayName}: ${pack.realityStatus}`)
        .slice(0, 4),
    }),
    createQAItem({
      id: 'qa-character-drift-fallback',
      category: 'visual_assets',
      label: 'Identity drift fallback',
      check: 'If a generated character drifts, fallback should retry, simplify, convert to still/motion design, or request review inside the approved route.',
      editLevel: input.editLevel,
      severity: 'medium',
      notes: characterConsistencyPlan.qaChecks.slice(0, 4),
    }),
  ]
}

function createFactSafetyChecks(input: PlannerInput, documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan) {
  if (!documentaryFactSafetyPlan?.active) {
    return []
  }

  const claimNotes = documentaryFactSafetyPlan.claimItems
    .map((item) => `${item.claimStatus}: ${item.safeWording}`)
    .slice(0, 4)

  return [
    createQAItem({
      id: 'qa-fact-allegations-not-facts',
      category: 'safety_and_claims',
      label: 'Allegations not facts',
      check: 'Allegations, charges, unknown claims, and claims by source must not be worded or visualized as verified facts.',
      editLevel: input.editLevel,
      severity: 'blocking',
      notes: claimNotes,
    }),
    createQAItem({
      id: 'qa-fact-neutral-real-people',
      category: 'safety_and_claims',
      label: 'Neutral real-person treatment',
      check: 'Real named or unknown people must be treated with neutral cards, source cards, silhouettes, or stylized non-realistic figures when claim status is unclear.',
      editLevel: input.editLevel,
      severity: 'blocking',
      notes: documentaryFactSafetyPlan.globalRules.slice(0, 3),
    }),
    createQAItem({
      id: 'qa-fact-no-guilt-visuals',
      category: 'safety_and_claims',
      label: 'No guilt-implying visuals',
      check: 'Do not use jail, handcuffs, mugshot framing, guilty labels, demonizing marks, or scenes of alleged acts unless verified and approved.',
      editLevel: input.editLevel,
      severity: 'blocking',
      notes: documentaryFactSafetyPlan.claimItems.flatMap((item) => item.avoidRules.slice(0, 1)).slice(0, 4),
    }),
    createQAItem({
      id: 'qa-fact-source-needed',
      category: 'safety_and_claims',
      label: 'Source-needed claims flagged',
      check: 'Money amounts, names, organizations, legal status, and evidence claims that need sources must remain clearly flagged and neutral.',
      editLevel: input.editLevel,
      severity: documentaryFactSafetyPlan.claimItems.some((item) => item.sourceNeeded) ? 'blocking' : 'medium',
      notes: documentaryFactSafetyPlan.claimItems.filter((item) => item.sourceNeeded).map((item) => item.claimText).slice(0, 4),
    }),
  ]
}

export function createEditQAPlan(params: {
  input: PlannerInput
  compiledIntent: CompiledEditingIntent
  segmentEditPlans: SegmentEditPlan[]
  visualAssetPlan?: VisualAssetPlanItem[]
  rendererCompositionPlan?: RendererCompositionPlan
  characterConsistencyPlan?: CharacterConsistencyPlan
  documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan
}): EditQAPlan {
  const { characterConsistencyPlan, compiledIntent, documentaryFactSafetyPlan, input, rendererCompositionPlan, segmentEditPlans, visualAssetPlan } = params
  const globalChecks = [
    ...createGlobalChecks(input, compiledIntent, rendererCompositionPlan),
    ...createRendererChecks(input, rendererCompositionPlan),
    ...createSafetyChecks(input),
    ...createCharacterConsistencyChecks(input, characterConsistencyPlan),
    ...createFactSafetyChecks(input, documentaryFactSafetyPlan),
  ]
  const segmentChecks = createSegmentChecks(input, segmentEditPlans)
  const tierPolicyChecks = createTierPolicyChecks(input, visualAssetPlan)
  const approvalChecks = createApprovalChecks(input)
  const allChecks = [...globalChecks, ...segmentChecks, ...tierPolicyChecks, ...approvalChecks]
  const hasFailedCheck = allChecks.some((check) => check.status === 'failed')

  return {
    id: `edit-qa-${input.editingCategory}-${input.editLevel}`,
    status: hasFailedCheck ? 'failed' : 'not_checked',
    summary:
      'QA will compare the edit against user intent, source order, professional standards, tier/model rules, frame layout, visual assets, and approval state before delivery.',
    globalChecks,
    segmentChecks,
    tierPolicyChecks,
    approvalChecks,
    notes: [
      'This is a mock QA plan; no media has been inspected.',
      input.editLevel === 'premium' ? 'Premium keeps Veo Lite final fallback only.' : 'Basic/Pro QA fallback cannot use Veo.',
      'Workers must execute the approved plan version and request review for out-of-scope changes.',
    ],
  }
}
