import type {
  AdaptiveEditStrategyPlan,
  AudioPipelinePlan,
  ColorPipelinePlan,
  CompiledEditingIntent,
  CharacterConsistencyPlan,
  DataVizPlan,
  DepthAwareLayoutValidationPlan,
  DepthAwareOverlayPlan,
  DocumentaryFactSafetyPlan,
  EditLevel,
  EditQAPlan,
  FallbackStep,
  ForegroundMaskingPlan,
  MapAnimationPlan,
  PlannerInput,
  ProductionReadinessReport,
  RenderStrategyPlan,
  RendererCompositionPlan,
  SegmentEditPlan,
  SegmentQAPlanItem,
  SpeakerVisualLayoutPlan,
  ToolStrategyPlan,
  VideoUnderstandingReport,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import type { WorkerRuntimePlan } from '../types/worker-runtime'

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

function createRenderStrategyChecks(params: {
  input: PlannerInput
  renderStrategyPlan?: RenderStrategyPlan
  visualAssetPlan?: VisualAssetPlanItem[]
}) {
  const { input, renderStrategyPlan, visualAssetPlan } = params

  if (!renderStrategyPlan) {
    return [
      createQAItem({
        id: 'qa-render-strategy-missing',
        category: 'render_strategy',
        label: 'Render strategy exists',
        check: 'Every visual asset should have a render strategy before renderer and prompt planning.',
        editLevel: input.editLevel,
        severity: 'high',
        status: 'failed',
        notes: ['No render strategy plan was present in this QA input.'],
      }),
    ]
  }

  const exactStrategyItems = renderStrategyPlan.items.filter((item) =>
    item.selectedRemotionCapabilities.some((capability) =>
      capability === 'map_layer_placement' ||
      capability === 'chart_layer_placement' ||
      capability === 'screen_capture_placement' ||
      capability === 'caption_layer',
    ),
  )
  const workerItems = renderStrategyPlan.items.filter((item) => item.needsWorkerPreprocess || item.needsWorkerPostprocess)
  const complexItems = renderStrategyPlan.items.filter((item) => item.complexity === 'advanced' || item.complexity === 'premium')
  const visualAssets = visualAssetPlan ?? []

  return [
    createQAItem({
      id: 'qa-render-strategy-coverage',
      category: 'render_strategy',
      label: 'Visual assets have render strategy',
      check: 'Each planned visual asset should have a linked render strategy item.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: [
        `${renderStrategyPlan.items.length} render strategy item(s) for ${visualAssets.length} visual asset(s).`,
        ...renderStrategyPlan.qaChecks.slice(0, 3),
      ],
    }),
    createQAItem({
      id: 'qa-render-controlled-exact-graphics',
      category: 'render_strategy',
      label: 'Exact graphics stay controlled',
      check: 'Exact maps, charts, labels, captions, cards, and screenshots should use Remotion or controlled tools rather than unnecessary AI video.',
      editLevel: input.editLevel,
      severity: 'blocking',
      notes: exactStrategyItems.map((item) => `${item.label}: ${item.strategyType}`).slice(0, 5),
    }),
    createQAItem({
      id: 'qa-render-remotion-ownership',
      category: 'render_composition',
      label: 'Remotion owns final canvas',
      check: 'Render strategies must keep final canvas ownership with Remotion/ReeditPro.',
      editLevel: input.editLevel,
      severity: 'blocking',
      notes: renderStrategyPlan.globalRules.filter((rule) => /remotion|canvas|composition/i.test(rule)),
    }),
    createQAItem({
      id: 'qa-render-worker-notes',
      category: 'render_strategy',
      label: 'Worker strategies have notes',
      check: 'Future worker preprocess/postprocess strategies should include notes and remain mock-only.',
      editLevel: input.editLevel,
      severity: workerItems.length ? 'high' : 'low',
      notes: workerItems.flatMap((item) => item.workerNotes.slice(0, 2)).slice(0, 6),
    }),
    createQAItem({
      id: 'qa-render-tier-complexity',
      category: 'model_tier_policy',
      label: 'Render strategy tier fit',
      check: 'Basic should avoid premium render complexity; Pro cannot use Veo; Premium keeps Veo final fallback only.',
      editLevel: input.editLevel,
      severity: input.editLevel === 'basic' && complexItems.length ? 'high' : 'medium',
      notes: [
        input.editLevel === 'premium' ? 'Premium render strategy may include advanced fallback planning but Veo remains final fallback only.' : 'Basic/Pro render strategy cannot include allowed Veo prompts.',
        ...complexItems.map((item) => `${item.label}: ${item.complexity}`).slice(0, 4),
      ],
    }),
    createQAItem({
      id: 'qa-render-panel-fit',
      category: 'frame_layout',
      label: 'Tool outputs fit panels',
      check: 'Tool outputs, generated assets, and AI clips should fit the planned frame/panel and matching background.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: renderStrategyPlan.items
        .map((item) => `${item.label}: ${item.selectedRemotionCapabilities.join(', ')}`)
        .slice(0, 5),
    }),
  ]
}

function createToolStrategyChecks(params: {
  input: PlannerInput
  renderStrategyPlan?: RenderStrategyPlan
  toolStrategyPlan?: ToolStrategyPlan
}) {
  const { input, renderStrategyPlan, toolStrategyPlan } = params

  if (!toolStrategyPlan) {
    return [
      createQAItem({
        id: 'qa-tool-strategy-missing',
        category: 'tool_strategy',
        label: 'Tool strategy exists',
        check: 'Tool strategy should explain controlled tool choices for render strategies and future workers.',
        editLevel: input.editLevel,
        severity: 'high',
        status: 'failed',
        notes: ['No tool strategy plan was present in this QA input.'],
      }),
    ]
  }

  const renderNeedsTools = (renderStrategyPlan?.items ?? []).filter((item) =>
    item.strategyType === 'open_source_tool_then_remotion' ||
    item.strategyType === 'worker_preprocess_then_remotion' ||
    item.strategyType === 'remotion_then_worker_postprocess' ||
    item.strategyType === 'qa_tool_only' ||
    item.strategyType === 'remotion_only',
  )
  const missingSettings = toolStrategyPlan.items.filter((item) => item.steps.some((step) => step.settings.length === 0))
  const licenseItems = toolStrategyPlan.items.filter((item) => item.status === 'needs_license_review' || item.licenseNotes.length > 0)
  const providerIds = ['gpt_image_2', 'wan_2_2_kf2v_flash', 'wan_2_6_i2v_flash', 'hailuo_2_3_fast', 'hailuo_02', 'veo_3_1_lite']
  const providerAsTool = toolStrategyPlan.items.some((item) => item.selectedToolIds.some((toolId) => providerIds.includes(toolId)))

  return [
    createQAItem({
      id: 'qa-tool-strategy-coverage',
      category: 'tool_strategy',
      label: 'Tool strategy covers render needs',
      check: 'Render strategies that require Remotion, tools, workers, or QA should have tool strategy items.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: [
        `${toolStrategyPlan.items.length} tool strategy item(s) for ${renderNeedsTools.length} render item(s) that may need controlled tools or Remotion.`,
        toolStrategyPlan.summary,
      ],
    }),
    createQAItem({
      id: 'qa-tool-strategy-settings',
      category: 'tool_strategy',
      label: 'Tool settings are structured',
      check: 'Each tool chain step should include catalog-based settings when applicable.',
      editLevel: input.editLevel,
      severity: missingSettings.length ? 'high' : 'medium',
      status: missingSettings.length ? 'failed' : 'not_checked',
      notes: missingSettings.map((item) => item.label).slice(0, 4),
    }),
    createQAItem({
      id: 'qa-tool-strategy-controlled-exact',
      category: 'tool_strategy',
      label: 'Controlled tools beat AI video for exact work',
      check: 'Exact map, chart, and screen capture chains should explain why AI video is not appropriate.',
      editLevel: input.editLevel,
      severity: 'blocking',
      notes: toolStrategyPlan.aiGenerationAvoidedReasons.slice(0, 5),
    }),
    createQAItem({
      id: 'qa-tool-strategy-provider-separation',
      category: 'tool_strategy',
      label: 'Provider models separate from tools',
      check: 'GPT-Image-2, Wan, Hailuo, and Veo must not be selected open-source tool IDs.',
      editLevel: input.editLevel,
      severity: 'blocking',
      status: providerAsTool ? 'failed' : 'not_checked',
      notes: ['Provider generation is represented by provider routes/prompts, not the open-source tool registry.'],
    }),
    createQAItem({
      id: 'qa-tool-strategy-license-review',
      category: 'tool_strategy',
      label: 'License review flagged',
      check: 'Tools that require license review should be marked before production use.',
      editLevel: input.editLevel,
      severity: licenseItems.length ? 'high' : 'low',
      notes: licenseItems.map((item) => `${item.label}: ${item.licenseNotes.join(' ')}`).slice(0, 4),
    }),
    createQAItem({
      id: 'qa-tool-strategy-planning-only',
      category: 'tool_strategy',
      label: 'No tool execution before approval',
      check: 'Tool strategy must not install packages, execute tools, bypass approval, or imply real workers ran.',
      editLevel: input.editLevel,
      severity: 'blocking',
      notes: toolStrategyPlan.globalRules.filter((rule) => /planning|approval|no packages|executed|snapshot/i.test(rule)),
    }),
    createQAItem({
      id: 'qa-tool-strategy-tier-policy',
      category: 'model_tier_policy',
      label: 'Tool strategy preserves Veo policy',
      check: 'Basic/Pro cannot use Veo; Premium keeps Veo final fallback only even when tool strategy references AI animation support.',
      editLevel: input.editLevel,
      severity: input.editLevel === 'premium' ? 'high' : 'blocking',
      notes: toolStrategyPlan.globalRules.filter((rule) => /veo|premium|basic|pro/i.test(rule)),
    }),
  ]
}

function createColorPipelineChecks(params: {
  input: PlannerInput
  colorPipelinePlan?: ColorPipelinePlan
  visualAssetPlan?: VisualAssetPlanItem[]
  segmentEditPlans: SegmentEditPlan[]
}) {
  const { colorPipelinePlan, input, segmentEditPlans, visualAssetPlan } = params

  if (!colorPipelinePlan) {
    return [
      createQAItem({
        id: 'qa-color-pipeline-missing',
        category: 'color_pipeline',
        label: 'Color pipeline exists',
        check: 'Every edit, including Basic, should include professional color correction planning.',
        editLevel: input.editLevel,
        severity: 'high',
        status: 'failed',
        notes: ['No color pipeline plan was present in this QA input.'],
      }),
    ]
  }

  const hasBasicCorrection = colorPipelinePlan.projectOperations.some((operation) => operation.operation === 'exposure_correction') &&
    colorPipelinePlan.projectOperations.some((operation) => operation.operation === 'white_balance') &&
    colorPipelinePlan.projectOperations.some((operation) => operation.operation === 'contrast_curve')
  const hasSkinToneNeed = segmentEditPlans.some((segment) => segment.colorGradePlan.skinToneProtection)
  const hasSkinToneOperation = colorPipelinePlan.projectOperations.some((operation) => operation.operation === 'skin_tone_protection') ||
    colorPipelinePlan.clipPlans.some((clipPlan) => clipPlan.skinToneProtection)
  const multipleClipsNeedMatch = input.clips.length > 1
  const generatedAssets = (visualAssetPlan ?? []).filter((asset) =>
    asset.providerRoute.primaryModel !== 'none' ||
    asset.providerRoute.fallbackModels.length > 0 ||
    asset.providerRoute.fallbackSteps.length > 0,
  )
  const hasAssetMatches = generatedAssets.length === 0 || colorPipelinePlan.assetMatchPlans.length > 0
  const documentaryStyleSafe = input.editingCategory !== 'documentary_case_study' ||
    colorPipelinePlan.colorGradeStyle === 'documentary_neutral' ||
    /styl/i.test(input.customInstructions)
  const text = [
    colorPipelinePlan.summary,
    ...colorPipelinePlan.limitations,
    ...colorPipelinePlan.tierNotes,
    ...colorPipelinePlan.toolsPlanned,
  ].join(' ').toLowerCase()

  return [
    createQAItem({
      id: 'qa-color-basic-professional',
      category: 'color_pipeline',
      label: 'Professional correction baseline',
      check: 'Basic and all higher tiers include exposure, white balance, contrast, and clean correction planning.',
      editLevel: input.editLevel,
      severity: input.editLevel === 'basic' ? 'high' : 'medium',
      status: hasBasicCorrection ? 'not_checked' : 'failed',
      notes: [
        colorPipelinePlan.summary,
        ...colorPipelinePlan.tierNotes.slice(0, 2),
      ],
    }),
    createQAItem({
      id: 'qa-color-directive-match',
      category: 'color_pipeline',
      label: 'Color style matches directive',
      check: 'Color grade style should match the professional directive, user request, category, or safe fallback.',
      editLevel: input.editLevel,
      severity: 'medium',
      notes: [`Planned style: ${colorPipelinePlan.colorGradeStyle}; intensity: ${colorPipelinePlan.intensity}.`],
    }),
    createQAItem({
      id: 'qa-color-skin-tone-protection',
      category: 'color_pipeline',
      label: 'Skin tone protection',
      check: 'Skin tone protection should be planned when speakers or people are visible.',
      editLevel: input.editLevel,
      severity: hasSkinToneNeed ? 'high' : 'medium',
      status: hasSkinToneNeed && !hasSkinToneOperation ? 'failed' : 'not_checked',
      notes: colorPipelinePlan.clipPlans.map((clipPlan) => `${clipPlan.clipLabel}: skin ${clipPlan.skinToneProtection}`).slice(0, 4),
    }),
    createQAItem({
      id: 'qa-color-shot-matching',
      category: 'color_pipeline',
      label: 'Shot matching',
      check: 'Multiple clips should have shot matching notes and operations.',
      editLevel: input.editLevel,
      severity: multipleClipsNeedMatch ? 'high' : 'low',
      status: multipleClipsNeedMatch && !colorPipelinePlan.projectOperations.some((operation) => operation.operation === 'shot_matching') ? 'failed' : 'not_checked',
      notes: colorPipelinePlan.clipPlans.flatMap((clipPlan) => clipPlan.shotMatchingNotes.slice(0, 1)).slice(0, 4),
    }),
    createQAItem({
      id: 'qa-color-generated-assets',
      category: 'color_pipeline',
      label: 'Generated asset color match',
      check: 'Generated images/cards/keyframes and AI video assets should have color and panel-background match planning.',
      editLevel: input.editLevel,
      severity: generatedAssets.length ? 'high' : 'low',
      status: hasAssetMatches ? 'not_checked' : 'failed',
      notes: colorPipelinePlan.assetMatchPlans.map((assetPlan) => `${assetPlan.assetLabel}: ${assetPlan.operations.map((operation) => operation.operation).join(', ')}`).slice(0, 5),
    }),
    createQAItem({
      id: 'qa-color-documentary-neutral',
      category: 'color_pipeline',
      label: 'Documentary neutral color',
      check: 'Documentary/Case Study color should avoid sensational overprocessing unless the user requests stylization.',
      editLevel: input.editLevel,
      severity: input.editingCategory === 'documentary_case_study' ? 'high' : 'low',
      status: documentaryStyleSafe ? 'not_checked' : 'failed',
      notes: colorPipelinePlan.generatedAssetRules.slice(0, 3),
    }),
    createQAItem({
      id: 'qa-color-planning-only',
      category: 'color_pipeline',
      label: 'Color pipeline is planning-only',
      check: 'Color pipeline must not imply real FFmpeg/OpenColorIO/OpenCV/Sharp execution, provider generation, rendering, or approval bypass.',
      editLevel: input.editLevel,
      severity: 'blocking',
      status: text.includes('no real') && text.includes('mock') ? 'not_checked' : 'failed',
      notes: colorPipelinePlan.limitations,
    }),
  ]
}

function createAudioPipelineChecks(params: {
  input: PlannerInput
  audioPipelinePlan?: AudioPipelinePlan
  segmentEditPlans: SegmentEditPlan[]
}) {
  const { audioPipelinePlan, input, segmentEditPlans } = params

  if (!audioPipelinePlan) {
    return [
      createQAItem({
        id: 'qa-audio-pipeline-missing',
        category: 'audio_pipeline',
        label: 'Audio pipeline exists',
        check: 'Every edit, including Basic, should include professional voice cleanup and loudness planning.',
        editLevel: input.editLevel,
        severity: 'high',
        status: 'failed',
        notes: ['No audio pipeline plan was present in this QA input.'],
      }),
    ]
  }

  const operationIds = audioPipelinePlan.projectOperations.map((operation) => operation.operation)
  const hasVoiceLoudness = operationIds.includes('voice_leveling') && operationIds.includes('loudness_normalization')
  const noMusicRequested = /\b(no music|voice only|just voice)\b/i.test(input.customInstructions)
  const musicRespected = !noMusicRequested || audioPipelinePlan.musicBedPlan.policy === 'none'
  const hasDucking = audioPipelinePlan.musicBedPlan.policy === 'none' || audioPipelinePlan.musicBedPlan.duckingEnabled
  const sfxJustified = audioPipelinePlan.sfxPlan.policy === 'none' ||
    (audioPipelinePlan.sfxPlan.cues.length > 0 && audioPipelinePlan.sfxPlan.maxSfxPerMinute <= (input.editLevel === 'premium' ? 8 : input.editLevel === 'pro' ? 5 : 2))
  const documentarySafe = input.editingCategory !== 'documentary_case_study' ||
    audioPipelinePlan.soundStyle === 'documentary_serious' ||
    /upbeat|energetic|styl/i.test(input.customInstructions)
  const text = [
    audioPipelinePlan.summary,
    ...audioPipelinePlan.limitations,
    ...audioPipelinePlan.tierNotes,
    ...audioPipelinePlan.toolsPlanned,
  ].join(' ').toLowerCase()
  const randomSfxText = [
    ...audioPipelinePlan.sfxPlan.avoidRules,
    ...audioPipelinePlan.qaChecks,
  ].join(' ').toLowerCase()

  return [
    createQAItem({
      id: 'qa-audio-basic-professional',
      category: 'audio_pipeline',
      label: 'Professional voice and loudness',
      check: 'Basic and all higher tiers include voice cleanup and loudness planning.',
      editLevel: input.editLevel,
      severity: input.editLevel === 'basic' ? 'high' : 'medium',
      status: hasVoiceLoudness ? 'not_checked' : 'failed',
      notes: [audioPipelinePlan.summary, ...audioPipelinePlan.tierNotes.slice(0, 2)],
    }),
    createQAItem({
      id: 'qa-audio-music-policy',
      category: 'audio_pipeline',
      label: 'Music policy matches request',
      check: 'No-music and voice-only instructions must be respected, and music must not overpower voice.',
      editLevel: input.editLevel,
      severity: noMusicRequested ? 'blocking' : 'medium',
      status: musicRespected ? 'not_checked' : 'failed',
      notes: [
        `Music policy: ${audioPipelinePlan.musicBedPlan.policy}.`,
        audioPipelinePlan.musicBedPlan.reason,
        ...audioPipelinePlan.musicBedPlan.avoidRules.slice(0, 2),
      ],
    }),
    createQAItem({
      id: 'qa-audio-ducking',
      category: 'audio_pipeline',
      label: 'Ducking under voice',
      check: 'Music bed plans should include ducking when speech is present.',
      editLevel: input.editLevel,
      severity: audioPipelinePlan.musicBedPlan.policy === 'none' ? 'low' : 'high',
      status: hasDucking ? 'not_checked' : 'failed',
      notes: [`Ducking: ${audioPipelinePlan.musicBedPlan.duckingEnabled}; strength ${audioPipelinePlan.musicBedPlan.duckingStrength}.`],
    }),
    createQAItem({
      id: 'qa-audio-sfx-justified',
      category: 'audio_pipeline',
      label: 'SFX are justified',
      check: 'SFX must have reasons/cues and must not be random or too dense for the tier.',
      editLevel: input.editLevel,
      severity: audioPipelinePlan.sfxPlan.policy === 'none' ? 'low' : 'high',
      status: sfxJustified && randomSfxText.includes('no random') ? 'not_checked' : 'failed',
      notes: [
        `SFX policy: ${audioPipelinePlan.sfxPlan.policy}; max ${audioPipelinePlan.sfxPlan.maxSfxPerMinute}/min.`,
        ...audioPipelinePlan.sfxPlan.cues.slice(0, 3),
      ],
    }),
    createQAItem({
      id: 'qa-audio-soundsync-cues',
      category: 'audio_pipeline',
      label: 'SoundSync timing cues',
      check: 'SoundSync cues should support visual, caption, transition, or emotional timing.',
      editLevel: input.editLevel,
      severity: input.editLevel === 'premium' ? 'medium' : 'low',
      notes: audioPipelinePlan.soundSyncCues.map((cue) => `${cue.cueType} at ${cue.timeSeconds}s: ${cue.reason}`).slice(0, 5),
    }),
    createQAItem({
      id: 'qa-audio-documentary-serious',
      category: 'audio_pipeline',
      label: 'Documentary serious audio',
      check: 'Documentary/Case Study audio should remain serious and restrained unless the user requests stylization.',
      editLevel: input.editLevel,
      severity: input.editingCategory === 'documentary_case_study' ? 'high' : 'low',
      status: documentarySafe ? 'not_checked' : 'failed',
      notes: [`Sound style: ${audioPipelinePlan.soundStyle}.`, ...audioPipelinePlan.sfxPlan.avoidRules.slice(0, 2)],
    }),
    createQAItem({
      id: 'qa-audio-planning-only',
      category: 'audio_pipeline',
      label: 'Audio pipeline is planning-only',
      check: 'Audio pipeline must not imply real FFmpeg/Essentia/librosa/Rubber Band/whisper.cpp execution, provider generation, rendering, or approval bypass.',
      editLevel: input.editLevel,
      severity: 'blocking',
      status: text.includes('no real') && text.includes('mock') && text.includes('approval') ? 'not_checked' : 'failed',
      notes: audioPipelinePlan.limitations,
    }),
    createQAItem({
      id: 'qa-audio-segment-alignment',
      category: 'audio_pipeline',
      label: 'Segment sound plans align',
      check: 'Segment sound plans should align with the project audio pipeline and linked SoundSync cues.',
      editLevel: input.editLevel,
      severity: 'medium',
      status: segmentEditPlans.every((segment) => segment.soundPlan.style === audioPipelinePlan.soundStyle) ? 'not_checked' : 'warning',
      notes: segmentEditPlans.map((segment) => `${segment.label}: ${segment.soundPlan.style}`).slice(0, 4),
    }),
  ]
}

function createMapAnimationChecks(params: {
  input: PlannerInput
  mapAnimationPlan?: MapAnimationPlan
  videoUnderstandingReport?: VideoUnderstandingReport
}) {
  const { input, mapAnimationPlan, videoUnderstandingReport } = params
  const mapSignal = /\b(map|route|location|city|country|neighborhood|real estate|address|geography|travel|place)\b/i.test(input.customInstructions) ||
    Boolean(videoUnderstandingReport?.visualSupportOpportunities.some((opportunity) => opportunity.opportunityType === 'map_animation'))

  if (!mapAnimationPlan?.active) {
    return mapSignal
      ? [
          createQAItem({
            id: 'qa-map-plan-missing',
            category: 'map_animation',
            label: 'Map plan exists when geography is requested',
            check: 'Map/location opportunities should create a controlled map plan instead of relying on AI video.',
            editLevel: input.editLevel,
            severity: 'medium',
            status: 'warning',
            notes: ['Map/location signal was detected, but no active mapAnimationPlan was attached.'],
          }),
        ]
      : []
  }

  const sourceSafe = mapAnimationPlan.items.every((item) =>
    item.locations.every((location) => location.safeWording.length > 0 && (location.confidence === 'exact' || location.sourceNeeded || location.confidence === 'fictional')),
  )
  const controlledTools = mapAnimationPlan.items.every((item) =>
    item.toolIds.includes('remotion') &&
    (item.toolIds.includes('maplibre') || item.mapVisualType === 'screen_map_card') &&
    (item.toolIds.includes('turf') || item.mapVisualType === 'screen_map_card'),
  )
  const depthItems = mapAnimationPlan.items.filter((item) => item.mapVisualType === 'map_behind_subject' || item.mapVisualType === 'map_behind_subject_and_contact_object')
  const depthSafe = depthItems.every((item) => Boolean(item.layout.fallbackLayoutMode) && item.layout.foregroundMaskAware)
  const text = [
    mapAnimationPlan.summary,
    ...mapAnimationPlan.limitations,
    ...mapAnimationPlan.globalRules,
    ...mapAnimationPlan.items.flatMap((item) => [...item.workerNotes, item.reason]),
  ].join(' ').toLowerCase()

  return [
    createQAItem({
      id: 'qa-map-items-exist',
      category: 'map_animation',
      label: 'Map items exist',
      check: 'Active map plans should include at least one map item with layout, style, camera, and QA.',
      editLevel: input.editLevel,
      severity: 'high',
      status: mapAnimationPlan.items.length > 0 ? 'not_checked' : 'failed',
      notes: [mapAnimationPlan.summary],
    }),
    createQAItem({
      id: 'qa-map-controlled-tools',
      category: 'map_animation',
      label: 'Controlled map tools',
      check: 'Map visuals should prefer MapLibre/Turf/Remotion planning over AI-video generation.',
      editLevel: input.editLevel,
      severity: 'blocking',
      status: controlledTools ? 'not_checked' : 'failed',
      notes: [`Tools planned: ${mapAnimationPlan.mapToolsPlanned.join(', ')}.`],
    }),
    createQAItem({
      id: 'qa-map-source-wording',
      category: 'map_animation',
      label: 'Location uncertainty and safe wording',
      check: 'Unknown, alleged, or approximate locations must include safe wording and avoid fake exact pins.',
      editLevel: input.editLevel,
      severity: input.editingCategory === 'documentary_case_study' ? 'blocking' : 'high',
      status: sourceSafe ? 'not_checked' : 'failed',
      notes: mapAnimationPlan.items.flatMap((item) => item.locations.map((location) => `${location.label}: ${location.safeWording} / ${location.confidence} / ${location.claimStatus}`)).slice(0, 5),
    }),
    createQAItem({
      id: 'qa-map-layout-readability',
      category: 'map_animation',
      label: 'Map layout and readability',
      check: 'Map labels must remain readable and avoid faces, products, captions, foreground subjects, and contact objects.',
      editLevel: input.editLevel,
      severity: 'high',
      status: mapAnimationPlan.items.every((item) => item.qaChecks.length > 0 && item.layout.labelAvoidZones.length > 0) ? 'not_checked' : 'warning',
      notes: mapAnimationPlan.items.map((item) => `${item.title}: ${item.layout.layoutMode}; avoid zones ${item.layout.labelAvoidZones.length}.`).slice(0, 4),
    }),
    createQAItem({
      id: 'qa-map-depth-fallback',
      category: 'map_animation',
      label: 'Map behind subject fallback',
      check: 'Map-behind-subject/contact-object plans need foreground awareness, fallback layout, and future mask-worker notes.',
      editLevel: input.editLevel,
      severity: depthItems.length ? 'high' : 'low',
      status: depthItems.length === 0 || depthSafe ? 'not_checked' : 'failed',
      notes: depthItems.flatMap((item) => [item.layout.depthCompositingMode ?? 'none', item.layout.maskStrategy ?? 'none', item.layout.fallbackLayoutMode ?? 'no fallback']).slice(0, 6),
    }),
    createQAItem({
      id: 'qa-map-planning-only',
      category: 'map_animation',
      label: 'Map planning only',
      check: 'Map plan must not imply real MapLibre/Turf execution, geocoding, tile calls, Mapbox APIs, provider generation, rendering, or approval bypass.',
      editLevel: input.editLevel,
      severity: 'blocking',
      status: text.includes('no geocoding') && text.includes('no map') && text.includes('approval') ? 'not_checked' : 'failed',
      notes: mapAnimationPlan.limitations,
    }),
  ]
}

function createDataVizChecks(params: {
  input: PlannerInput
  dataVizPlan?: DataVizPlan
  videoUnderstandingReport?: VideoUnderstandingReport
}) {
  const { input, dataVizPlan, videoUnderstandingReport } = params
  const dataVizSignal = /\b(chart|graph|diagram|timeline|money flow|account|process|comparison|before and after|metric|number|percentage|data|dashboard|results|evidence|claim|funnel|sales|growth|revenue)\b/i.test(input.customInstructions) ||
    Boolean(videoUnderstandingReport?.visualSupportOpportunities.some((opportunity) => opportunity.opportunityType === 'chart_or_diagram'))

  if (!dataVizPlan?.active) {
    return dataVizSignal
      ? [
          createQAItem({
            id: 'qa-dataviz-plan-missing',
            category: 'dataviz_plan',
            label: 'Chart/diagram plan exists when data visuals are requested',
            check: 'Chart, diagram, money-flow, timeline, and exact data opportunities should create a controlled dataviz plan instead of relying on AI video.',
            editLevel: input.editLevel,
            severity: 'medium',
            status: 'warning',
            notes: ['Chart/diagram signal was detected, but no active dataVizPlan was attached.'],
          }),
        ]
      : []
  }

  const controlledTools = dataVizPlan.items.every((item) =>
    item.toolIds.includes('remotion') &&
    (item.toolIds.includes('d3') ||
      item.toolIds.includes('echarts') ||
      item.toolIds.includes('vega_lite') ||
      item.preferredTool === 'remotion_only'),
  )
  const sourceSafe = dataVizPlan.items.every((item) =>
    item.dataPlan.safeWording.length > 0 &&
    (item.dataPlan.confidence === 'verified' ||
      item.dataPlan.confidence === 'fictional' ||
      item.dataPlan.sourceNeeded ||
      item.dataPlan.mockData ||
      item.dataPlan.fictionalData),
  )
  const mockMarked = dataVizPlan.items.every((item) =>
    !item.dataPlan.mockData || /mock|example|sample/i.test(item.dataPlan.safeWording),
  )
  const documentarySafe = input.editingCategory !== 'documentary_case_study' ||
    dataVizPlan.items.every((item) =>
      item.dataPlan.confidence === 'verified' ||
      /reported|claimed|approximate|source|example|fictional/i.test(item.dataPlan.safeWording),
    )
  const basicSimple = input.editLevel !== 'basic' ||
    dataVizPlan.items.every((item) =>
      item.style.labelDensity !== 'high' &&
      !['network_graph', 'hierarchy_tree', 'evidence_flow_diagram'].includes(item.visualType),
    )
  const text = [
    dataVizPlan.summary,
    ...dataVizPlan.limitations,
    ...dataVizPlan.globalRules,
    ...dataVizPlan.items.flatMap((item) => [item.reason, item.whyNotAiVideo, ...item.workerNotes]),
  ].join(' ').toLowerCase()

  return [
    createQAItem({
      id: 'qa-dataviz-items-exist',
      category: 'dataviz_plan',
      label: 'Dataviz items exist',
      check: 'Active dataviz plans should include at least one chart/diagram item with data, style, layout, animation, and QA.',
      editLevel: input.editLevel,
      severity: 'high',
      status: dataVizPlan.items.length > 0 ? 'not_checked' : 'failed',
      notes: [dataVizPlan.summary],
    }),
    createQAItem({
      id: 'qa-dataviz-controlled-tools',
      category: 'dataviz_plan',
      label: 'Controlled chart/diagram tools',
      check: 'Exact data visuals should prefer D3/ECharts/Remotion planning over AI-video generation.',
      editLevel: input.editLevel,
      severity: 'blocking',
      status: controlledTools ? 'not_checked' : 'failed',
      notes: [`Tools planned: ${dataVizPlan.toolsPlanned.join(', ')}.`],
    }),
    createQAItem({
      id: 'qa-dataviz-source-wording',
      category: 'dataviz_plan',
      label: 'Data confidence and safe wording',
      check: 'Unknown, claimed, approximate, mock, or fictional data must include safe wording and source-needed notes.',
      editLevel: input.editLevel,
      severity: input.editingCategory === 'documentary_case_study' ? 'blocking' : 'high',
      status: sourceSafe && mockMarked && documentarySafe ? 'not_checked' : 'failed',
      notes: dataVizPlan.items.map((item) => `${item.title}: ${item.dataPlan.safeWording} / ${item.dataPlan.confidence} / sourceNeeded ${item.dataPlan.sourceNeeded}`).slice(0, 5),
    }),
    createQAItem({
      id: 'qa-dataviz-layout-readability',
      category: 'dataviz_plan',
      label: 'Readable labels and layout',
      check: 'Chart/diagram labels, arrows, numbers, and captions must remain readable and avoid faces/products/captions.',
      editLevel: input.editLevel,
      severity: 'high',
      status: dataVizPlan.items.every((item) => item.qaChecks.length > 0 && item.layout.labelAvoidZones.length > 0) ? 'not_checked' : 'warning',
      notes: dataVizPlan.items.map((item) => `${item.title}: ${item.layout.layoutMode}; label density ${item.style.labelDensity}.`).slice(0, 5),
    }),
    createQAItem({
      id: 'qa-dataviz-basic-complexity',
      category: 'dataviz_plan',
      label: 'Basic dataviz stays simple',
      check: 'Basic should use simple cards/diagrams with low or medium label density and avoid complex networks.',
      editLevel: input.editLevel,
      severity: input.editLevel === 'basic' ? 'high' : 'low',
      status: basicSimple ? 'not_checked' : 'failed',
      notes: dataVizPlan.items.map((item) => `${item.visualType}: ${item.style.labelDensity}`).slice(0, 5),
    }),
    createQAItem({
      id: 'qa-dataviz-planning-only',
      category: 'dataviz_plan',
      label: 'Dataviz planning only',
      check: 'Dataviz plan must not imply real D3/ECharts/Vega-Lite execution, data verification, provider generation, rendering, or approval bypass.',
      editLevel: input.editLevel,
      severity: 'blocking',
      status: text.includes('mock') && text.includes('no real') && text.includes('approval') && !text.includes('veo for chart') ? 'not_checked' : 'failed',
      notes: dataVizPlan.limitations,
    }),
  ]
}

function createVideoUnderstandingChecks(params: {
  input: PlannerInput
  report?: VideoUnderstandingReport
  visualAssetPlan?: VisualAssetPlanItem[]
  segmentEditPlans: SegmentEditPlan[]
}) {
  const { input, report, segmentEditPlans, visualAssetPlan } = params

  if (!report) {
    return [
      createQAItem({
        id: 'qa-video-understanding-missing',
        category: 'video_understanding',
        label: 'Video understanding report',
        check: 'Edit plan should include a mock Video Understanding Report before visual and layout planning.',
        editLevel: input.editLevel,
        severity: 'high',
        status: 'failed',
        notes: ['No video understanding report was present in this QA input.'],
      }),
    ]
  }

  const opportunityTypes = report.visualSupportOpportunities.map((opportunity) => opportunity.opportunityType)
  const planText = [
    ...(visualAssetPlan ?? []).flatMap((asset) => [
      asset.beatLabel,
      asset.storyPurpose,
      asset.reason,
      asset.assetType,
      asset.signatureSystem,
    ]),
    ...segmentEditPlans.flatMap((segment) => [
      segment.label,
      segment.storyPurpose,
      segment.layoutMode,
      segment.speakerPresence,
      segment.brollPlan.meaningRule,
      segment.soundPlan.notes.join(' '),
      segment.colorGradePlan.notes.join(' '),
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  const unusedOpportunities = report.visualSupportOpportunities.filter((opportunity) => {
    const readableType = opportunity.opportunityType.replaceAll('_', ' ')
    return !planText.includes(readableType) && !planText.includes(opportunity.opportunityType)
  })
  const safeZoneNotes = [
    ...report.visualUnderstanding.faceSafeZoneNotes,
    ...report.visualUnderstanding.productSafeZoneNotes,
  ]
  const visualQualityIssues = report.visualUnderstanding.colorLightingIssues.filter((issue) => issue !== 'none')
  const audioIssues = report.audioUnderstanding.audioIssues.filter((issue) => issue !== 'none')

  return [
    createQAItem({
      id: 'qa-video-understanding-present',
      category: 'video_understanding',
      label: 'Video understanding report',
      check: 'Planner includes a mock report with clip, transcript, visual, audio, opportunity, and adaptive strategy fields.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: [
        report.overallSummary,
        ...report.limitations,
      ],
    }),
    createQAItem({
      id: 'qa-video-understanding-opportunity-alignment',
      category: 'video_understanding',
      label: 'Opportunity alignment',
      check: 'Visual opportunities are either used by assets/layouts or intentionally ignored for tier/user preference.',
      editLevel: input.editLevel,
      severity: unusedOpportunities.length && input.visualPreference !== 'no_extra_visuals' ? 'medium' : 'low',
      notes: unusedOpportunities.length
        ? unusedOpportunities.map((opportunity) => `Review unused opportunity: ${opportunity.opportunityType} (${opportunity.reason})`).slice(0, 4)
        : opportunityTypes.map((type) => `Opportunity represented: ${type}`).slice(0, 4),
    }),
    createQAItem({
      id: 'qa-video-understanding-safe-zones',
      category: 'captions',
      label: 'Understanding safe zones',
      check: 'Safe-zone notes from video understanding are reflected in layout, captions, and prompt plans.',
      editLevel: input.editLevel,
      severity: 'medium',
      notes: safeZoneNotes.slice(0, 4),
    }),
    createQAItem({
      id: 'qa-video-understanding-audio-color',
      category: 'sound_sync',
      label: 'Audio and color understanding',
      check: 'Audio cleanup and color/lighting issues from the report are represented in sound and color planning.',
      editLevel: input.editLevel,
      severity: audioIssues.length || visualQualityIssues.length ? 'medium' : 'low',
      notes: [
        report.audioUnderstanding.cleanupNeeded ? 'Audio cleanup needed by default for professional delivery.' : 'No cleanup flagged.',
        ...audioIssues.map((issue) => `Audio issue: ${issue}.`),
        ...visualQualityIssues.map((issue) => `Visual issue: ${issue}.`),
      ],
    }),
    createQAItem({
      id: 'qa-video-understanding-caption-density',
      category: 'captions',
      label: 'Caption density',
      check: 'Caption style and density should match the transcript meaning recommendation.',
      editLevel: input.editLevel,
      severity: 'medium',
      notes: [`Recommended caption density: ${report.transcriptMeaning.captionDensityRecommendation}.`],
    }),
    createQAItem({
      id: 'qa-video-understanding-source-order',
      category: 'source_order_and_structure',
      label: 'Source order reflected',
      check: 'Source order confirmation state from video understanding is reflected before approval.',
      editLevel: input.editLevel,
      severity: report.sourceOrderConfirmed ? 'medium' : 'high',
      status: report.sourceOrderConfirmed ? 'not_checked' : 'needs_user_review',
      notes: [
        report.sourceOrderConfirmed
          ? 'Source order confirmed in the report.'
          : 'Source order is not confirmed; keep approval path warned until resolved.',
      ],
    }),
  ]
}

function createAdaptiveStrategyChecks(input: PlannerInput, adaptiveEditStrategyPlan: AdaptiveEditStrategyPlan | undefined) {
  if (!adaptiveEditStrategyPlan) {
    return [
      createQAItem({
        id: 'qa-adaptive-strategy-missing',
        category: 'adaptive_strategy',
        label: 'Adaptive edit strategy',
        check: 'Plan should include a typed adaptive strategy before visual, layout, prompt, and credit planning.',
        editLevel: input.editLevel,
        severity: 'high',
        status: 'failed',
        notes: ['No adaptive edit strategy plan was present in this QA input.'],
      }),
    ]
  }

  const strategies = adaptiveEditStrategyPlan.segmentStrategies
  const missingReasons = strategies.filter((strategy) => strategy.reasons.length === 0)
  const visualWithoutReason = strategies.filter((strategy) =>
    strategy.recommendedVisualSupport !== 'caption_only' &&
    strategy.recommendedVisualSupport !== 'no_extra_visual' &&
    strategy.reasons.length === 0,
  )
  const exactStrategies = strategies.filter((strategy) =>
    strategy.decisionKind === 'use_map' ||
    strategy.decisionKind === 'use_chart_or_diagram' ||
    strategy.decisionKind === 'use_screen_capture',
  )
  const exactStrategyUsesControlledTools = exactStrategies.every((strategy) =>
    strategy.generationRestraint === 'avoid_generation' &&
    strategy.recommendedToolHints.some((hint) => hint === 'map_tool' || hint === 'chart_tool' || hint === 'browser_capture_tool' || hint === 'remotion_layout'),
  )
  const basicAiVideoCount = input.editLevel === 'basic'
    ? strategies.filter((strategy) => strategy.generationRestraint === 'allow_generation' || strategy.generationRestraint === 'prefer_generation').length
    : 0

  return [
    createQAItem({
      id: 'qa-adaptive-strategy-reasons',
      category: 'adaptive_strategy',
      label: 'Strategy reasons',
      check: 'Every segment strategy has a reason tied to user intent, video understanding, tier, platform, or model policy.',
      editLevel: input.editLevel,
      severity: missingReasons.length ? 'high' : 'medium',
      status: missingReasons.length ? 'failed' : 'not_checked',
      notes: strategies.slice(0, 4).map((strategy) => `${strategy.label}: ${strategy.decisionKind} because ${strategy.reasons[0]?.explanation ?? 'missing reason'}`),
    }),
    createQAItem({
      id: 'qa-adaptive-strategy-no-random-visuals',
      category: 'adaptive_strategy',
      label: 'No visuals without reason',
      check: 'No visual support is added without a segment-level reason.',
      editLevel: input.editLevel,
      severity: visualWithoutReason.length ? 'high' : 'medium',
      status: visualWithoutReason.length ? 'failed' : 'not_checked',
      notes: visualWithoutReason.map((strategy) => strategy.label).slice(0, 4),
    }),
    createQAItem({
      id: 'qa-adaptive-strategy-controlled-tools',
      category: 'adaptive_strategy',
      label: 'Controlled tools for exact visuals',
      check: 'Exact maps, charts, labels, screen captures, and data visuals should prefer controlled tools/Remotion rather than AI video.',
      editLevel: input.editLevel,
      severity: exactStrategyUsesControlledTools ? 'medium' : 'high',
      status: exactStrategyUsesControlledTools ? 'not_checked' : 'failed',
      notes: exactStrategies.map((strategy) => `${strategy.label}: ${strategy.generationRestraint}; tools ${strategy.recommendedToolHints.join(', ')}`).slice(0, 4),
    }),
    createQAItem({
      id: 'qa-adaptive-strategy-tier-fit',
      category: 'model_tier_policy',
      label: 'Adaptive tier fit',
      check: 'Basic avoids overusing AI video, Pro keeps Veo unavailable, and Premium keeps Veo final fallback only.',
      editLevel: input.editLevel,
      severity: basicAiVideoCount > 0 ? 'high' : 'medium',
      status: basicAiVideoCount > 0 ? 'needs_user_review' : 'not_checked',
      notes: [
        ...adaptiveEditStrategyPlan.tierConstraints,
        ...adaptiveEditStrategyPlan.modelPolicyNotes,
      ].slice(0, 5),
    }),
  ]
}

function createSpeakerVisualLayoutChecks(input: PlannerInput, speakerVisualLayoutPlan: SpeakerVisualLayoutPlan | undefined) {
  if (!speakerVisualLayoutPlan) {
    return [
      createQAItem({
        id: 'qa-layout-plan-missing',
        category: 'frame_layout',
        label: 'Speaker/visual layout strategy',
        check: 'Edit plan should include speaker/visual layout strategy before rendering or prompt planning.',
        editLevel: input.editLevel,
        severity: 'high',
        status: 'failed',
        notes: ['Layout strategy was not present in this mock QA input.'],
      }),
    ]
  }

  const riskyItems = speakerVisualLayoutPlan.items.filter((item) => item.riskLevel === 'high' || item.riskLevel === 'premium' || item.complexity === 'advanced' || item.complexity === 'premium')
  const basicRiskyItems = input.editLevel === 'basic'
    ? riskyItems.filter((item) => !item.tierAvailability.basic)
    : []
  const missingFallbacks = speakerVisualLayoutPlan.items.filter((item) =>
    (item.riskLevel === 'medium' || item.riskLevel === 'high' || item.riskLevel === 'premium' || item.complexity !== 'simple') &&
    !item.fallbackLayoutMode,
  )

  return [
    createQAItem({
      id: 'qa-layout-speaker-visual-strategy',
      category: 'frame_layout',
      label: 'Speaker/visual layout strategy',
      check: 'Each segment should decide whether the viewer needs speaker, visual, or both.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: speakerVisualLayoutPlan.globalRules.slice(0, 4),
    }),
    createQAItem({
      id: 'qa-layout-caption-collision',
      category: 'captions',
      label: 'Layout caption collision',
      check: 'Captions must not collide with speaker face, PIP, lower panel, map/chart labels, evidence board text, or screen capture UI.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: speakerVisualLayoutPlan.qaChecks.slice(0, 4),
    }),
    createQAItem({
      id: 'qa-layout-visual-space',
      category: 'visual_assets',
      label: 'Visual space and readability',
      check: 'Visual takeovers, maps, evidence boards, screen captures, and graphics must have enough space for readable detail.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: speakerVisualLayoutPlan.items.map((item) => `${item.layoutMode}: ${item.visualDominance}`).slice(0, 5),
    }),
    createQAItem({
      id: 'qa-layout-fallbacks',
      category: 'frame_layout',
      label: 'Risky layout fallback',
      check: 'Moderate, advanced, premium, or risky layout modes should include fallback layout modes.',
      editLevel: input.editLevel,
      severity: missingFallbacks.length ? 'high' : 'medium',
      status: missingFallbacks.length ? 'failed' : 'not_checked',
      notes: missingFallbacks.length
        ? missingFallbacks.map((item) => `${item.layoutMode} missing fallback.`)
        : speakerVisualLayoutPlan.items.filter((item) => item.fallbackLayoutMode).map((item) => `${item.layoutMode} -> ${item.fallbackLayoutMode}`).slice(0, 4),
    }),
    createQAItem({
      id: 'qa-layout-basic-risk-policy',
      category: 'model_tier_policy',
      label: 'Basic safe layouts',
      check: 'Basic should avoid advanced/high-risk speaker cutout, masking, or object-anchored tracking layouts.',
      editLevel: input.editLevel,
      severity: input.editLevel === 'basic' ? 'high' : 'medium',
      status: basicRiskyItems.length ? 'failed' : 'not_checked',
      notes: basicRiskyItems.length
        ? basicRiskyItems.map((item) => `${item.layoutMode} is not Basic-safe.`)
        : [input.editLevel === 'basic' ? 'Basic uses safe layout modes.' : 'Pro/Premium can use advanced layout modes only when useful.'],
    }),
  ]
}

function createDepthAwareOverlayChecks(input: PlannerInput, depthAwareOverlayPlan: DepthAwareOverlayPlan | undefined) {
  if (!depthAwareOverlayPlan?.active) {
    return [
      createQAItem({
        id: 'qa-depth-overlay-inactive',
        category: 'render_composition',
        label: 'Depth-aware overlay inactive',
        check: 'Depth-aware overlays should be inactive unless they support the segment meaning or explicit user request.',
        editLevel: input.editLevel,
        severity: 'low',
        notes: [depthAwareOverlayPlan?.summary ?? 'No depth-aware overlay plan present in this mock QA input.'],
      }),
    ]
  }

  const riskyItems = depthAwareOverlayPlan.items.filter((item) => item.maskRisk === 'medium' || item.maskRisk === 'high' || item.maskRisk === 'premium')
  const missingFallbacks = riskyItems.filter((item) => !item.fallbackLayoutMode)
  const contactItems = depthAwareOverlayPlan.items.filter((item) => item.depthCompositingMode === 'graphic_behind_subject_and_contact_objects')
  const contactItemsWithoutObjects = contactItems.filter((item) => !item.foregroundObjects.some((object) => object.kind === 'contact_object'))
  const contactItemsWithoutGroups = contactItems.filter((item) => item.foregroundDepthGroups.length === 0)
  const basicComplexItems = input.editLevel === 'basic'
    ? depthAwareOverlayPlan.items.filter((item) =>
        item.maskStrategy !== 'none' ||
        item.depthCompositingMode === 'graphic_behind_subject_and_contact_objects' ||
        item.depthCompositingMode === 'subject_cutout_overlay' ||
        item.depthCompositingMode === 'object_anchored_overlay',
      )
    : []
  const proHighRiskItems = input.editLevel === 'pro'
    ? depthAwareOverlayPlan.items.filter((item) => (item.maskRisk === 'high' || item.maskRisk === 'premium') && !item.fallbackLayoutMode)
    : []
  const premiumManualReviewMissing = input.editLevel === 'premium'
    ? depthAwareOverlayPlan.items.filter((item) =>
        (item.maskRisk === 'high' || item.maskRisk === 'premium') &&
        !item.workerNotes.some((note) => /manual|review/i.test(note)),
      )
    : []

  return [
    createQAItem({
      id: 'qa-depth-mask-planned',
      category: 'render_composition',
      label: 'Foreground mask planning',
      check: 'Foreground mask is planned when a graphic should sit behind the subject.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: depthAwareOverlayPlan.items.map((item) => `${item.depthCompositingMode}: ${item.maskStrategy}`).slice(0, 5),
    }),
    createQAItem({
      id: 'qa-depth-contact-object-preservation',
      category: 'render_composition',
      label: 'Contact object preservation',
      check: 'Contact object preservation is planned when subject plus object depth is needed.',
      editLevel: input.editLevel,
      severity: contactItems.length ? 'high' : 'medium',
      status: contactItemsWithoutObjects.length || contactItemsWithoutGroups.length ? 'failed' : 'not_checked',
      notes: contactItems.length
        ? contactItems.flatMap((item) => item.foregroundObjects.filter((object) => object.kind === 'contact_object').map((object) => object.label)).slice(0, 4)
        : ['No contact-object depth mode planned.'],
    }),
    createQAItem({
      id: 'qa-depth-face-caption-protection',
      category: 'captions',
      label: 'Face and caption protection',
      check: 'Face, eyes, mouth, captions, and top text remain protected above masks and graphics.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: [
        ...depthAwareOverlayPlan.globalRules.filter((rule) => /caption|face|protect/i.test(rule)).slice(0, 4),
        ...depthAwareOverlayPlan.items.map((item) => item.captionLayerRule).slice(0, 2),
      ],
    }),
    createQAItem({
      id: 'qa-depth-readable-graphic',
      category: 'visual_assets',
      label: 'Readable graphic after mask',
      check: 'Graphic/map/card text remains readable after planned foreground overlay.',
      editLevel: input.editLevel,
      severity: 'high',
      notes: depthAwareOverlayPlan.items.flatMap((item) => item.promptImplications.slice(0, 2)).slice(0, 5),
    }),
    createQAItem({
      id: 'qa-depth-risk-fallback',
      category: 'frame_layout',
      label: 'Mask-risk fallback',
      check: 'Medium, high, and premium depth effects include fallback layouts.',
      editLevel: input.editLevel,
      severity: missingFallbacks.length ? 'high' : 'medium',
      status: missingFallbacks.length ? 'failed' : 'not_checked',
      notes: missingFallbacks.length
        ? missingFallbacks.map((item) => `${item.depthCompositingMode} missing fallback.`)
        : riskyItems.map((item) => `${item.depthCompositingMode} -> ${item.fallbackLayoutMode}`).slice(0, 4),
    }),
    createQAItem({
      id: 'qa-depth-tier-policy',
      category: 'model_tier_policy',
      label: 'Depth tier policy',
      check: 'Basic avoids complex masks; Pro uses low/medium risk or fallback; Premium high-risk plans include stronger QA/manual review.',
      editLevel: input.editLevel,
      severity: basicComplexItems.length || proHighRiskItems.length || premiumManualReviewMissing.length ? 'high' : 'medium',
      status: basicComplexItems.length || proHighRiskItems.length || premiumManualReviewMissing.length ? 'failed' : 'not_checked',
      notes: [
        ...(basicComplexItems.length ? basicComplexItems.map((item) => `Basic unsafe: ${item.depthCompositingMode}/${item.maskStrategy}.`) : []),
        ...(proHighRiskItems.length ? proHighRiskItems.map((item) => `Pro high-risk lacks fallback: ${item.depthCompositingMode}.`) : []),
        ...(premiumManualReviewMissing.length ? premiumManualReviewMissing.map((item) => `Premium manual review missing: ${item.depthCompositingMode}.`) : []),
        input.editLevel === 'basic' && basicComplexItems.length === 0 ? 'Basic depth plan stays safe.' : undefined,
      ].filter(Boolean) as string[],
    }),
    createQAItem({
      id: 'qa-depth-mock-only',
      category: 'render_composition',
      label: 'Mock-only depth planning',
      check: 'Frontend plan does not execute real masks, segmentation, tracking, OpenCV, background removal, or rendering.',
      editLevel: input.editLevel,
      severity: 'blocking',
      notes: depthAwareOverlayPlan.items.flatMap((item) => item.workerNotes.slice(0, 2)).slice(0, 5),
    }),
    createQAItem({
      id: 'qa-depth-meaning-not-every-segment',
      category: 'user_intent_match',
      label: 'Depth effect justified',
      check: 'Depth-aware overlay is justified by segment meaning and is not applied to every segment by default.',
      editLevel: input.editLevel,
      severity: depthAwareOverlayPlan.items.length > 0 ? 'medium' : 'low',
      notes: [
        depthAwareOverlayPlan.summary,
        `${depthAwareOverlayPlan.items.length} depth items for planned segment/layout items.`,
      ],
    }),
  ]
}

function createDepthLayoutValidationChecks(input: PlannerInput, depthAwareLayoutValidationPlan?: DepthAwareLayoutValidationPlan) {
  if (!depthAwareLayoutValidationPlan?.active) {
    return [
      createQAItem({
        id: 'qa-depth-layout-validation-inactive',
        category: 'render_composition',
        label: 'Depth layout validation inactive',
        check: 'Depth-aware layout validation should stay inactive unless depth, foreground, contact-object, map/card-behind-subject, or mask planning is requested.',
        editLevel: input.editLevel,
        severity: 'low',
        notes: [depthAwareLayoutValidationPlan?.summary ?? 'No depth layout validation plan present in this mock QA input.'],
      }),
    ]
  }

  const criticalChecks = [
    ...depthAwareLayoutValidationPlan.globalChecks,
    ...depthAwareLayoutValidationPlan.items.flatMap((item) => item.checks),
  ]
    .filter((check) => check.status !== 'passed' || check.severity === 'blocking' || check.severity === 'high')
    .slice(0, 10)

  const qaStatusFor = (status: typeof criticalChecks[number]['status']) => {
    if (status === 'blocking') return 'blocked'
    if (status === 'failed') return 'failed'
    if (status === 'warning') return 'warning'
    return 'passed'
  }

  const categoryFor = (category: typeof criticalChecks[number]['category']) => {
    if (category === 'caption_safety') return 'captions'
    if (category === 'graphic_readability' || category === 'map_readability' || category === 'dataviz_readability' || category === 'browser_readability') return 'visual_assets'
    if (category === 'tier_compatibility' || category === 'model_policy') return 'model_tier_policy'
    if (category === 'approval_policy' || category === 'credit_complexity') return 'credit_approval'
    if (category === 'fallback_layout' || category === 'foreground_group') return 'frame_layout'
    return 'render_composition'
  }

  return [
    createQAItem({
      id: 'qa-depth-layout-validation-summary',
      category: 'render_composition',
      label: 'Depth layout validation',
      check: 'Depth-aware overlays are validated for fallback, foreground/contact-object preservation, safe zones, tier fit, credit impact, and mock-only limits.',
      editLevel: input.editLevel,
      severity: depthAwareLayoutValidationPlan.overallStatus === 'blocking' ? 'blocking' : depthAwareLayoutValidationPlan.overallStatus === 'failed' ? 'high' : 'medium',
      status: qaStatusFor(depthAwareLayoutValidationPlan.overallStatus),
      notes: [
        depthAwareLayoutValidationPlan.summary,
        `${depthAwareLayoutValidationPlan.totalEstimatedDepthPlanningCredits} depth planning credit(s).`,
        ...depthAwareLayoutValidationPlan.limitations.slice(0, 2),
      ],
    }),
    ...criticalChecks.map((validationCheck) => createQAItem({
      id: `qa-${validationCheck.id}`,
      category: categoryFor(validationCheck.category),
      label: validationCheck.label,
      check: validationCheck.message,
      editLevel: input.editLevel,
      severity: validationCheck.severity,
      status: qaStatusFor(validationCheck.status),
      notes: [
        validationCheck.recommendation,
        validationCheck.relatedDepthAwareOverlayItemId ? `Depth item: ${validationCheck.relatedDepthAwareOverlayItemId}.` : undefined,
        validationCheck.relatedMaskingPlanItemId ? `Mask item: ${validationCheck.relatedMaskingPlanItemId}.` : undefined,
      ].filter(Boolean) as string[],
    })),
  ]
}

function createWorkerRuntimeChecks(input: PlannerInput, workerRuntimePlan?: WorkerRuntimePlan) {
  if (!workerRuntimePlan) {
    return [
      createQAItem({
        id: 'qa-worker-runtime-missing',
        category: 'worker_runtime',
        label: 'Worker runtime plan exists',
        check: 'Mock edit plans should include a future worker runtime plan before approval.',
        editLevel: input.editLevel,
        severity: 'medium',
        status: 'not_checked',
        notes: ['No workerRuntimePlan is present in this QA input.'],
      }),
    ]
  }

  const text = JSON.stringify(workerRuntimePlan).toLowerCase()
  const aiVideoStep = workerRuntimePlan.jobs.flatMap((job) => job.steps).find((step) => step.stepType === 'generate_ai_video_asset')
  const aiVideoModels = aiVideoStep?.fallbackPolicy.allowedProviderModels ?? []
  const basicProHasVeo = input.editLevel !== 'premium' && aiVideoModels.includes('veo_3_1_lite')
  const premiumVeoUnsafe = input.editLevel === 'premium' &&
    aiVideoModels.includes('veo_3_1_lite') &&
    !aiVideoStep?.workerNotes.some((note) => /final fallback/i.test(note))
  const browserStep = workerRuntimePlan.jobs.flatMap((job) => job.steps).find((step) => step.stepType === 'capture_browser_asset')
  const maskStep = workerRuntimePlan.jobs.flatMap((job) => job.steps).find((step) => step.stepType === 'generate_mask_asset')

  return [
    createQAItem({
      id: 'qa-worker-runtime-front-end-disabled',
      category: 'worker_runtime',
      label: 'Frontend execution disabled',
      check: 'Worker runtime plan must not allow frontend execution.',
      editLevel: input.editLevel,
      severity: workerRuntimePlan.frontendExecutionAllowed ? 'blocking' : 'low',
      status: workerRuntimePlan.frontendExecutionAllowed ? 'failed' : 'passed',
      notes: [`frontendExecutionAllowed: ${workerRuntimePlan.frontendExecutionAllowed}`],
    }),
    createQAItem({
      id: 'qa-worker-runtime-approval-credit',
      category: 'worker_runtime',
      label: 'Approval and credit reservation required',
      check: 'Future workers need approval and credit reservation before expensive work.',
      editLevel: input.editLevel,
      severity: workerRuntimePlan.approvalRequired && workerRuntimePlan.creditReservationRequired ? 'low' : 'blocking',
      status: workerRuntimePlan.approvalRequired && workerRuntimePlan.creditReservationRequired ? 'passed' : 'failed',
      notes: [`approvalRequired: ${workerRuntimePlan.approvalRequired}`, `creditReservationRequired: ${workerRuntimePlan.creditReservationRequired}`],
    }),
    createQAItem({
      id: 'qa-worker-runtime-approved-snapshot-only',
      category: 'worker_runtime',
      label: 'Approved snapshot execution',
      check: 'Workers execute approved snapshots, not raw chat.',
      editLevel: input.editLevel,
      severity: text.includes('approved plan snapshots') || text.includes('approved snapshots') ? 'low' : 'blocking',
      status: text.includes('approved plan snapshots') || text.includes('approved snapshots') ? 'passed' : 'failed',
      notes: workerRuntimePlan.globalRules.filter((rule) => /snapshot|raw chat/i.test(rule)),
    }),
    createQAItem({
      id: 'qa-worker-runtime-veo-policy',
      category: 'worker_runtime',
      label: 'Worker model fallback policy',
      check: 'Worker fallback policy must preserve Basic/Pro no Veo and Premium final-fallback-only Veo.',
      editLevel: input.editLevel,
      severity: basicProHasVeo || premiumVeoUnsafe ? 'blocking' : 'low',
      status: basicProHasVeo || premiumVeoUnsafe ? 'failed' : 'passed',
      notes: aiVideoModels.length ? aiVideoModels : ['No AI video worker fallback models referenced.'],
    }),
    createQAItem({
      id: 'qa-worker-runtime-browser-capture-safety',
      category: 'worker_runtime',
      label: 'Browser capture safety',
      check: 'Browser capture worker notes must require authorized sources and no bypass behavior.',
      editLevel: input.editLevel,
      severity: browserStep && !browserStep.workerNotes.some((note) => /authorized|bypass|captcha|paywall/i.test(note)) ? 'blocking' : 'low',
      status: !browserStep || browserStep.workerNotes.some((note) => /authorized|bypass|captcha|paywall/i.test(note)) ? 'passed' : 'failed',
      notes: browserStep?.workerNotes.slice(0, 3) ?? ['No browser capture worker step needed for this plan.'],
    }),
    createQAItem({
      id: 'qa-worker-runtime-mask-future-only',
      category: 'worker_runtime',
      label: 'Mask worker future-only',
      check: 'Mask worker notes must say future worker required and no frontend mask execution.',
      editLevel: input.editLevel,
      severity: maskStep && !maskStep.workerNotes.some((note) => /future|no real mask|frontend/i.test(note)) ? 'blocking' : 'low',
      status: !maskStep || maskStep.workerNotes.some((note) => /future|no real mask|frontend/i.test(note)) ? 'passed' : 'failed',
      notes: maskStep?.workerNotes.slice(0, 3) ?? ['No mask worker step needed for this plan.'],
    }),
    createQAItem({
      id: 'qa-worker-runtime-mock-only',
      category: 'worker_runtime',
      label: 'No worker execution in mock',
      check: 'Worker runtime plan must state that no backend workers run in the frontend mock.',
      editLevel: input.editLevel,
      severity: workerRuntimePlan.limitations.some((note) => /no workers are executed|mock/i.test(note)) ? 'low' : 'blocking',
      status: workerRuntimePlan.limitations.some((note) => /no workers are executed|mock/i.test(note)) ? 'passed' : 'failed',
      notes: workerRuntimePlan.limitations,
    }),
  ]
}

function createProductionReadinessChecks(input: PlannerInput, productionReadinessReport?: ProductionReadinessReport) {
  if (!productionReadinessReport) {
    return [
      createQAItem({
        id: 'qa-production-readiness-missing',
        category: 'production_readiness',
        label: 'Production readiness review exists',
        check: 'Mock edit plans should include production readiness planning metadata.',
        editLevel: input.editLevel,
        severity: 'medium',
        status: 'not_checked',
        notes: ['No productionReadinessReport is present in this QA input.'],
      }),
    ]
  }

  const text = JSON.stringify(productionReadinessReport).toLowerCase()
  const hasLegalDisclaimer = productionReadinessReport.limitations.some((note) => /not legal advice|no production legal review/i.test(note))
  const frontendToolsProductionApproved = productionReadinessReport.licenseReviews.some((review) =>
    review.productionClass === 'frontend_browser_tool' &&
    review.reviewStatus === 'approved' &&
    review.commercialUseReviewed,
  )
  const workerOnlyNotePresent = text.includes('worker-only') || text.includes('future/backend')
  const providerSeparation = text.includes('provider models remain separate') || text.includes('provider models, not open-source tools')
  const approvalGate = text.includes('approval') && text.includes('credit')

  return [
    createQAItem({
      id: 'qa-production-readiness-not-legal-advice',
      category: 'production_readiness',
      label: 'Not legal advice',
      check: 'Production readiness metadata must state it is not legal advice and no production legal review is complete.',
      editLevel: input.editLevel,
      severity: hasLegalDisclaimer ? 'low' : 'blocking',
      status: hasLegalDisclaimer ? 'passed' : 'failed',
      notes: productionReadinessReport.limitations,
    }),
    createQAItem({
      id: 'qa-production-readiness-license-review',
      category: 'production_readiness',
      label: 'License review remains pending',
      check: 'Frontend tools should not be treated as production-approved by this mock review.',
      editLevel: input.editLevel,
      severity: frontendToolsProductionApproved ? 'blocking' : 'medium',
      status: frontendToolsProductionApproved ? 'failed' : 'passed',
      notes: productionReadinessReport.needsReviewItems.slice(0, 6),
    }),
    createQAItem({
      id: 'qa-production-readiness-worker-only',
      category: 'production_readiness',
      label: 'Worker-only tools remain future/backend only',
      check: 'Worker-only tools require future backend/runtime review and must not execute in the frontend.',
      editLevel: input.editLevel,
      severity: workerOnlyNotePresent ? 'low' : 'blocking',
      status: workerOnlyNotePresent ? 'passed' : 'failed',
      notes: productionReadinessReport.workerOnlyTools.slice(0, 8),
    }),
    createQAItem({
      id: 'qa-production-readiness-browser-privacy',
      category: 'production_readiness',
      label: 'Browser capture privacy preserved',
      check: 'Browser capture readiness must preserve source authorization, privacy, redaction, and no bypass rules.',
      editLevel: input.editLevel,
      severity: text.includes('browser') && !/authorization|redaction|bypass|captcha|paywall/i.test(text) ? 'blocking' : 'medium',
      status: text.includes('browser') && !/authorization|redaction|bypass|captcha|paywall/i.test(text) ? 'failed' : 'passed',
      notes: productionReadinessReport.checks.filter((item) => item.category === 'privacy' || item.category === 'user_authorization').map((item) => item.message),
    }),
    createQAItem({
      id: 'qa-production-readiness-provider-policy',
      category: 'production_readiness',
      label: 'Provider model policy preserved',
      check: 'Provider models stay separate from open-source tools and Veo policy remains unchanged.',
      editLevel: input.editLevel,
      severity: providerSeparation ? 'low' : 'blocking',
      status: providerSeparation ? 'passed' : 'failed',
      notes: productionReadinessReport.notes.filter((note) => /provider|veo/i.test(note)),
    }),
    createQAItem({
      id: 'qa-production-readiness-approval-gate',
      category: 'production_readiness',
      label: 'No execution before approval',
      check: 'Production readiness must not enable generation, rendering, billing, or tool execution before approval.',
      editLevel: input.editLevel,
      severity: approvalGate ? 'low' : 'blocking',
      status: approvalGate ? 'passed' : 'failed',
      notes: productionReadinessReport.checks.filter((item) => item.category === 'credit_billing').map((item) => item.message),
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
  renderStrategyPlan?: RenderStrategyPlan
  toolStrategyPlan?: ToolStrategyPlan
  colorPipelinePlan?: ColorPipelinePlan
  audioPipelinePlan?: AudioPipelinePlan
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
  foregroundMaskingPlan?: ForegroundMaskingPlan
  depthAwareLayoutValidationPlan?: DepthAwareLayoutValidationPlan
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  videoUnderstandingReport?: VideoUnderstandingReport
  characterConsistencyPlan?: CharacterConsistencyPlan
  documentaryFactSafetyPlan?: DocumentaryFactSafetyPlan
  workerRuntimePlan?: WorkerRuntimePlan
  productionReadinessReport?: ProductionReadinessReport
}): EditQAPlan {
  const {
    adaptiveEditStrategyPlan,
    characterConsistencyPlan,
    compiledIntent,
    depthAwareOverlayPlan,
    depthAwareLayoutValidationPlan,
    documentaryFactSafetyPlan,
    input,
    renderStrategyPlan,
    rendererCompositionPlan,
    segmentEditPlans,
    speakerVisualLayoutPlan,
    toolStrategyPlan,
    audioPipelinePlan,
    colorPipelinePlan,
    mapAnimationPlan,
    dataVizPlan,
    videoUnderstandingReport,
    visualAssetPlan,
    workerRuntimePlan,
    productionReadinessReport,
  } = params
  const globalChecks = [
    ...createGlobalChecks(input, compiledIntent, rendererCompositionPlan),
    ...createVideoUnderstandingChecks({
      input,
      report: videoUnderstandingReport ?? input.videoUnderstandingReport,
      segmentEditPlans,
      visualAssetPlan,
    }),
    ...createAdaptiveStrategyChecks(input, adaptiveEditStrategyPlan),
    ...createRenderStrategyChecks({ input, renderStrategyPlan, visualAssetPlan }),
    ...createToolStrategyChecks({ input, renderStrategyPlan, toolStrategyPlan }),
    ...createColorPipelineChecks({ input, colorPipelinePlan, segmentEditPlans, visualAssetPlan }),
    ...createAudioPipelineChecks({ input, audioPipelinePlan, segmentEditPlans }),
    ...createMapAnimationChecks({ input, mapAnimationPlan, videoUnderstandingReport: videoUnderstandingReport ?? input.videoUnderstandingReport }),
    ...createDataVizChecks({ input, dataVizPlan, videoUnderstandingReport: videoUnderstandingReport ?? input.videoUnderstandingReport }),
    ...createRendererChecks(input, rendererCompositionPlan),
    ...createSpeakerVisualLayoutChecks(input, speakerVisualLayoutPlan),
    ...createDepthAwareOverlayChecks(input, depthAwareOverlayPlan),
    ...createDepthLayoutValidationChecks(input, depthAwareLayoutValidationPlan),
    ...createWorkerRuntimeChecks(input, workerRuntimePlan),
    ...createProductionReadinessChecks(input, productionReadinessReport),
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
