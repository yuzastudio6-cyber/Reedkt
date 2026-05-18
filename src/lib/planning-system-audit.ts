import type {
  EditLevel,
  EditPlan,
  PlanningSystemAuditReport,
  PlanningSystemAuditStatus,
  PlanningSystemLayerAudit,
  PlanningSystemLayerId,
  OpenSourceToolId,
  ProviderModel,
} from '../types/reeditpro'
import { validateMigrationDraftPlan } from './migration-draft-validation'
import { getToolProfile, openSourceToolProfiles } from './tool-registry'

type LayerMetadata = {
  id: PlanningSystemLayerId
  label: string
  planKeys: Array<keyof EditPlan>
  hasTypes: boolean
  hasPlannerModule: boolean
  hasUiCard: boolean
  includedInApprovedSnapshot: boolean
  includedInValidation: boolean
  includedInCreditEstimate: boolean
  notes: string[]
  futureOnly?: boolean
  previewOnly?: boolean
}

const providerModelIds = [
  'gpt_image_2',
  'wan_2_2_kf2v_flash',
  'wan_2_6_i2v_flash',
  'hailuo_2_3_fast',
  'hailuo_02',
  'veo_3_1_lite',
  'wan',
  'hailuo',
  'veo',
]

const layerMetadata: LayerMetadata[] = [
  {
    id: 'source_sequence',
    label: 'Source sequence',
    planKeys: ['sourceSequenceMap', 'sourceSequenceReview'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Uploaded order is source/story context, not automatic final edit order.'],
  },
  {
    id: 'compiled_intent',
    label: 'Compiled intent',
    planKeys: ['compiledIntent'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Raw chat is compiled into structured editing intent before planning.'],
  },
  {
    id: 'professional_editing',
    label: 'Professional editing directive',
    planKeys: ['professionalEditingDirective'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Basic remains professional; edit level changes complexity, not quality.'],
  },
  {
    id: 'video_understanding',
    label: 'Video understanding',
    planKeys: ['videoUnderstandingReport'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Current report is mock-only and does not run real media analysis.'],
  },
  {
    id: 'adaptive_strategy',
    label: 'Adaptive edit strategy',
    planKeys: ['adaptiveEditStrategy', 'adaptiveEditStrategyPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Segment strategy is adaptive, not template-only.'],
  },
  {
    id: 'segment_operations',
    label: 'Segment edit operations',
    planKeys: ['segmentEditPlans'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Operations are worker-ready planning records, not executed edits.'],
  },
  {
    id: 'visual_asset_plan',
    label: 'Visual asset plan',
    planKeys: ['visualAssetPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['AI assets are planned only when they improve the segment.'],
  },
  {
    id: 'speaker_visual_layout',
    label: 'Speaker/visual layout',
    planKeys: ['speakerVisualLayoutPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Layout varies by segment meaning, source footage, and visual need.'],
  },
  {
    id: 'depth_overlay',
    label: 'Depth-aware overlay',
    planKeys: ['depthAwareOverlayPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Depth composition is planned only; no real masks are executed.'],
  },
  {
    id: 'foreground_masking',
    label: 'Foreground masking',
    planKeys: ['depthAwareOverlayPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Foreground objects and mask risk live inside the depth-aware overlay plan.'],
  },
  {
    id: 'depth_layout_validation',
    label: 'Depth layout validation',
    planKeys: ['editQAPlan', 'depthAwareOverlayPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Depth and mask safety checks are represented through QA and planner validation.'],
  },
  {
    id: 'color_pipeline',
    label: 'Color pipeline',
    planKeys: ['colorPipelinePlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Color work is planned; no FFmpeg/OpenColorIO/OpenCV/Sharp work runs here.'],
  },
  {
    id: 'audio_pipeline',
    label: 'Audio + SoundSync pipeline',
    planKeys: ['audioPipelinePlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Audio work is planned; no real cleanup, analysis, music generation, or mix render runs here.'],
  },
  {
    id: 'map_animation',
    label: 'Map/location planning',
    planKeys: ['mapAnimationPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Exact maps use controlled tool planning, not AI-video invention.'],
  },
  {
    id: 'dataviz',
    label: 'Chart + DataViz planning',
    planKeys: ['dataVizPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Exact charts and diagrams use controlled tool planning.'],
  },
  {
    id: 'browser_capture',
    label: 'Browser/app capture planning',
    planKeys: ['toolStrategyPlan', 'renderStrategyPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: false,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Browser capture is represented as controlled-tool planning only.'],
  },
  {
    id: 'tool_registry',
    label: 'Open-source tool registry',
    planKeys: ['toolRegistrySummary'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Provider models are separate from open-source tools.'],
  },
  {
    id: 'render_strategy',
    label: 'Render strategy',
    planKeys: ['renderStrategyPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Strategy explains Remotion, tools, provider assets, and future worker routes.'],
  },
  {
    id: 'tool_strategy',
    label: 'Tool strategy',
    planKeys: ['toolStrategyPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Tool chains are planned only; no packages are installed or executed.'],
  },
  {
    id: 'renderer_composition',
    label: 'Renderer composition',
    planKeys: ['rendererCompositionPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Remotion owns final canvas/composition.'],
  },
  {
    id: 'character_consistency',
    label: 'Character consistency',
    planKeys: ['characterConsistencyPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Character packs guide prompts and neutral treatment.'],
  },
  {
    id: 'fact_safety',
    label: 'Documentary fact safety',
    planKeys: ['documentaryFactSafetyPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Claims, names, and evidence use safe wording when uncertain.'],
  },
  {
    id: 'provider_prompts',
    label: 'Provider prompt planning',
    planKeys: ['providerPromptPlans'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Provider prompts are previews only and do not call providers.'],
  },
  {
    id: 'credit_estimate',
    label: 'Credit estimate',
    planKeys: ['creditEstimate'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Credits are estimated before approval; no real deduction occurs.'],
  },
  {
    id: 'approved_snapshot',
    label: 'Approved snapshot',
    planKeys: ['approvalRequired'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: false,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Approved snapshots freeze the future execution contract.'],
  },
  {
    id: 'worker_runtime',
    label: 'Worker runtime',
    planKeys: ['renderStrategyPlan', 'toolStrategyPlan'],
    hasTypes: true,
    hasPlannerModule: false,
    hasUiCard: false,
    includedInApprovedSnapshot: false,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['Worker runtime is future-only; frontend execution is not allowed.'],
    futureOnly: true,
  },
  {
    id: 'production_readiness',
    label: 'Production readiness',
    planKeys: ['editQAPlan'],
    hasTypes: false,
    hasPlannerModule: false,
    hasUiCard: false,
    includedInApprovedSnapshot: false,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Production readiness is documentation and QA planning, not legal advice.'],
    futureOnly: true,
  },
  {
    id: 'launch_tool_stack',
    label: 'Launch tool stack',
    planKeys: ['toolRegistrySummary', 'toolStrategyPlan', 'audioPipelinePlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: true,
    notes: ['AudioFlux replaces Essentia; Signalsmith Stretch replaces Rubber Band; worker tools remain planning-only.'],
  },
  {
    id: 'supabase_schema_bridge',
    label: 'Supabase schema bridge',
    planKeys: ['supabaseSchemaPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Future Supabase schema is planned as metadata only; no migrations, tables, clients, or storage buckets are created here.'],
  },
  {
    id: 'migration_drafts',
    label: 'SQL migration drafts',
    planKeys: ['migrationDraftPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Review-only SQL drafts live under database/migration-drafts/ and are not active Supabase migrations.'],
  },
  {
    id: 'migration_review_rls',
    label: 'Migration review and RLS hardening',
    planKeys: ['migrationReviewPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['RLS hardening is a draft-only review layer; no SQL is run and no active migration is created.'],
  },
  {
    id: 'supabase_production_readiness',
    label: 'Supabase production-test readiness',
    planKeys: ['supabaseProductionReadinessPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: true,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Active migration files are prepared for local/staging testing only; Codex does not run SQL or connect Supabase.'],
  },
  {
    id: 'planner_validation',
    label: 'Planner validation',
    planKeys: ['editQAPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: false,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Validation checks the plan object before approval and mock progress.'],
  },
  {
    id: 'planner_regression',
    label: 'Planner regression',
    planKeys: ['editQAPlan'],
    hasTypes: true,
    hasPlannerModule: true,
    hasUiCard: true,
    includedInApprovedSnapshot: false,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Regression runs across demo scenarios and product rules.'],
  },
  {
    id: 'tool_previews',
    label: 'Tool previews',
    planKeys: ['toolStrategyPlan', 'renderStrategyPlan'],
    hasTypes: false,
    hasPlannerModule: false,
    hasUiCard: false,
    includedInApprovedSnapshot: false,
    includedInValidation: true,
    includedInCreditEstimate: false,
    notes: ['Tool previews are browser-safe mock/developer previews when present.'],
    previewOnly: true,
  },
]

function hasPlanValue(plan: EditPlan, keys: Array<keyof EditPlan>) {
  return keys.some((key) => {
    const value = plan[key]

    if (Array.isArray(value)) {
      return value.length > 0
    }

    if (typeof value === 'boolean') {
      return value
    }

    return Boolean(value)
  })
}

function planText(plan: EditPlan) {
  return JSON.stringify(plan).toLowerCase()
}

function getEditLevel(plan: EditPlan): EditLevel {
  return plan.compiledIntent?.resolvedSettings.editLevel ?? plan.creditEstimate.editLevel ?? 'pro'
}

function providerUsesVeo(model: ProviderModel | undefined) {
  return model === 'veo_3_1_lite'
}

function visualAssetModels(plan: EditPlan) {
  return (plan.visualAssetPlan ?? []).flatMap((asset) => [
    asset.providerRoute.primaryModel,
    ...asset.providerRoute.fallbackModels,
    ...asset.providerRoute.fallbackSteps.map((step) => step.model).filter(Boolean),
  ])
}

function allProviderModels(plan: EditPlan) {
  return [
    ...visualAssetModels(plan),
    ...(plan.providerPromptPlans ?? []).map((promptPlan) => promptPlan.providerModel),
    ...(plan.renderStrategyPlan?.providerModelsReferenced ?? []),
    ...(plan.renderStrategyPlan?.items ?? []).flatMap((item) => item.selectedProviderModels),
  ].filter(Boolean)
}

function primaryVeoUsed(plan: EditPlan) {
  return (plan.visualAssetPlan ?? []).some((asset) => providerUsesVeo(asset.providerRoute.primaryModel)) ||
    (plan.providerPromptPlans ?? []).some((promptPlan) => providerUsesVeo(promptPlan.providerModel) && promptPlan.planType !== 'veo_fallback_prompt')
}

function default1080pUsed(plan: EditPlan) {
  return (plan.visualAssetPlan ?? []).some((asset) => asset.providerRoute.resolution === '1080P') ||
    (plan.providerPromptPlans ?? []).some((promptPlan) => promptPlan.resolution === '1080P') ||
    (plan.renderStrategyPlan?.items ?? []).some((item) => JSON.stringify(item.settings).toLowerCase().includes('1080p'))
}

function renderItemsOwnComposition(plan: EditPlan) {
  const items = plan.renderStrategyPlan?.items ?? []
  return Boolean(plan.rendererCompositionPlan) &&
    items.every((item) => item.strategyType === 'none' || item.strategyType === 'qa_tool_only' || item.remotionOwnsFinalComposition)
}

function toolProviderSeparationExists(plan: EditPlan) {
  const toolItems = plan.toolStrategyPlan?.items ?? []
  const renderItems = plan.renderStrategyPlan?.items ?? []

  return toolItems.every((item) =>
    item.selectedToolIds.every((toolId) => !providerModelIds.includes(toolId as string)) &&
    item.steps.every((step) => !providerModelIds.includes(step.toolId as string)),
  ) &&
    renderItems.every((item) =>
      item.selectedOpenSourceTools.every((toolId) => !providerModelIds.includes(toolId as string)),
    )
}

function matchingBackgroundPolicyExists(plan: EditPlan) {
  const promptPlans = plan.providerPromptPlans ?? []
  const videoPromptPlans = promptPlans.filter((promptPlan) =>
    promptPlan.targetProvider === 'wan' ||
    promptPlan.targetProvider === 'hailuo' ||
    promptPlan.targetProvider === 'veo',
  )

  return Boolean(plan.rendererCompositionPlan?.panelBackgroundColor) &&
    videoPromptPlans.every((promptPlan) => Boolean(promptPlan.panelBackgroundColor) || promptPlan.prompt.toLowerCase().includes('matching panel'))
}

function browserCaptureIsMockOnly(plan: EditPlan) {
  const text = planText(plan)

  if (!text.includes('browser_capture') && !text.includes('screen capture') && !text.includes('browser capture')) {
    return true
  }

  return text.includes('planning') &&
    (text.includes('no package') || text.includes('not executed') || text.includes('no tool') || text.includes('approval'))
}

function toolProfileText(toolId: OpenSourceToolId) {
  const tool = getToolProfile(toolId)

  if (!tool) {
    return ''
  }

  return JSON.stringify({
    adoptionStage: tool.adoptionStage,
    avoidFor: tool.avoidFor,
    category: tool.category,
    defaultPresets: tool.defaultPresets,
    description: tool.description,
    executionMode: tool.executionMode,
    label: tool.label,
    licenseNotes: tool.licenseNotes,
    productionNotes: tool.productionNotes,
    qaChecks: tool.qaChecks,
  }).toLowerCase()
}

function activeToolIds(plan: EditPlan) {
  return [
    ...(plan.audioPipelinePlan?.toolsPlanned ?? []),
    ...(plan.toolStrategyPlan?.toolIdsUsed ?? []),
    ...(plan.renderStrategyPlan?.openSourceToolsUsed ?? []),
    ...(plan.renderStrategyPlan?.items ?? []).flatMap((item) => item.selectedOpenSourceTools),
  ].map(String)
}

function isLaunchDefaultTool(plan: EditPlan, toolId: string) {
  return activeToolIds(plan).includes(toolId)
}

function createLaunchToolStackChecks(plan: EditPlan): PlanningSystemAuditReport['launchToolStackChecks'] {
  const audioFlux = getToolProfile('audioflux')
  const signalsmith = getToolProfile('signalsmith_stretch')
  const essentia = getToolProfile('essentia')
  const rubberBand = getToolProfile('rubber_band')
  const ffmpeg = getToolProfile('ffmpeg')
  const vapoursynth = getToolProfile('vapoursynth')
  const sharp = getToolProfile('sharp')
  const planLower = planText(plan)

  const audioFluxText = toolProfileText('audioflux')
  const signalsmithText = toolProfileText('signalsmith_stretch')
  const essentiaText = toolProfileText('essentia')
  const rubberBandText = toolProfileText('rubber_band')
  const ffmpegText = toolProfileText('ffmpeg')
  const vapoursynthText = toolProfileText('vapoursynth')
  const sharpText = toolProfileText('sharp')

  return [
    {
      label: 'AudioFlux is available',
      passed: Boolean(audioFlux),
      message: audioFlux ? 'AudioFlux exists in the tool registry.' : 'AudioFlux is missing from the tool registry.',
    },
    {
      label: 'Signalsmith Stretch is available',
      passed: Boolean(signalsmith),
      message: signalsmith ? 'Signalsmith Stretch exists in the tool registry.' : 'Signalsmith Stretch is missing from the tool registry.',
    },
    {
      label: 'AudioFlux is launch audio analysis candidate',
      passed: audioFlux?.adoptionStage === 'launch_core' && audioFluxText.includes('sound') && audioFluxText.includes('analysis'),
      message: 'AudioFlux should be the launch SoundSync/audio analysis candidate.',
    },
    {
      label: 'Signalsmith Stretch is launch stretch/pitch candidate',
      passed: signalsmith?.adoptionStage === 'launch_core' && signalsmithText.includes('stretch') && signalsmithText.includes('pitch'),
      message: 'Signalsmith Stretch should be the launch music stretch/pitch candidate.',
    },
    {
      label: 'Essentia is not launch default',
      passed: essentia?.adoptionStage !== 'launch_core' && !essentia?.defaultPresets.length && !isLaunchDefaultTool(plan, 'essentia') && essentiaText.includes('not selected for launch'),
      message: 'Essentia should remain not selected for launch/future review only.',
    },
    {
      label: 'Rubber Band is not launch default',
      passed: rubberBand?.adoptionStage !== 'launch_core' && !rubberBand?.defaultPresets.length && !isLaunchDefaultTool(plan, 'rubber_band') && rubberBandText.includes('not selected for launch'),
      message: 'Rubber Band should remain not selected for launch/future review only.',
    },
    {
      label: 'FFmpeg LGPL Configuration represented',
      passed: Boolean(ffmpeg?.label.toLowerCase().includes('lgpl')) && ffmpegText.includes('lgpl') && !planLower.includes('enablegpl":true') && !planLower.includes('enablenonfree":true'),
      message: 'FFmpeg should be represented as LGPL Configuration and must not imply GPL/nonfree build flags.',
    },
    {
      label: 'VapourSynth is worker-only',
      passed: vapoursynth?.executionMode === 'future_worker' && vapoursynthText.includes('worker-only'),
      message: 'VapourSynth should remain a worker-only frame/video pipeline candidate.',
    },
    {
      label: 'VapourSynth plugins require review',
      passed: vapoursynthText.includes('plugin') && vapoursynthText.includes('review'),
      message: 'VapourSynth plugin licenses must be reviewed separately.',
    },
    {
      label: 'Sharp + libvips review notes exist',
      passed: Boolean(sharp?.label.toLowerCase().includes('libvips')) && sharpText.includes('dependency') && sharpText.includes('review'),
      message: 'Sharp + libvips should carry dependency/security/LGPL review notes.',
    },
    {
      label: 'Worker-only tools are not frontend-installed',
      passed: openSourceToolProfiles.every((tool) => {
        if (tool.executionMode !== 'future_worker' && tool.executionMode !== 'worker_preprocess' && tool.executionMode !== 'worker_postprocess') {
          return true
        }

        const text = [...tool.productionNotes, ...tool.qaChecks].join(' ').toLowerCase()
        return text.includes('planning') && text.includes('not installed') && text.includes('not executed')
      }),
      message: 'Worker-only tools should remain metadata only in the frontend mock.',
    },
    {
      label: 'Browser-safe tools are preview/dev only',
      passed: browserCaptureIsMockOnly(plan),
      message: 'Browser capture and browser-safe previews must not imply production rendering or unauthorized access.',
    },
    {
      label: 'Provider models separate from tools',
      passed: toolProviderSeparationExists(plan),
      message: 'GPT-Image-2, Wan, Hailuo, and Veo must not be open-source tool IDs.',
    },
  ]
}

function createSchemaBridgeChecks(plan: EditPlan): PlanningSystemAuditReport['hardRuleChecks'] {
  const schemaPlan = plan.supabaseSchemaPlan
  const approvedSnapshots = schemaPlan?.tables.find((tablePlan) => tablePlan.name === 'approved_plan_snapshots')
  const hasSnapshotJson = Boolean(
    approvedSnapshots?.jsonbFields.includes('snapshot_json') ||
      approvedSnapshots?.columns.some((column) => column.name === 'snapshot_json' && column.type === 'jsonb'),
  )
  const hasImmutable = Boolean(approvedSnapshots?.columns.some((column) => column.name === 'immutable'))
  const hasPrivateBuckets = Boolean(schemaPlan?.storageBuckets.length && schemaPlan.storageBuckets.every((bucket) => !bucket.isPublic))
  const hasRlsPlans = Boolean(schemaPlan?.tables.length && schemaPlan.tables.every((tablePlan) => tablePlan.rlsPolicies.length > 0))
  const nonGoals = schemaPlan?.nonGoals.join(' ').toLowerCase() ?? ''

  return [
    {
      label: 'Supabase schema bridge exists',
      passed: Boolean(schemaPlan),
      message: schemaPlan ? 'Supabase schema bridge is included in the mock EditPlan.' : 'Supabase schema bridge is missing from the mock EditPlan.',
    },
    {
      label: 'Approved snapshot table planned',
      passed: Boolean(approvedSnapshots),
      message: 'approved_plan_snapshots should be planned as the future worker execution contract.',
    },
    {
      label: 'Approved snapshot JSONB planned',
      passed: hasSnapshotJson,
      message: 'approved_plan_snapshots.snapshot_json should store the full approved plan snapshot.',
    },
    {
      label: 'Approved snapshots immutable in schema plan',
      passed: hasImmutable && Boolean(approvedSnapshots?.migrationNotes.join(' ').toLowerCase().includes('immutable')),
      message: 'Approved snapshot immutability should be represented in table fields and migration notes.',
    },
    {
      label: 'Private storage buckets planned',
      passed: hasPrivateBuckets,
      message: 'Future storage buckets should be private by default with signed URL planning.',
    },
    {
      label: 'RLS policy summaries planned',
      passed: hasRlsPlans,
      message: 'Every MVP table should include planned RLS policy summaries before migration work.',
    },
    {
      label: 'No Supabase migration or connection implied',
      passed: nonGoals.includes('no real supabase migrations') && nonGoals.includes('no supabase client') && nonGoals.includes('no sql is run'),
      message: 'Schema bridge must remain planning-only and must not imply migrations, clients, connections, or SQL execution.',
    },
  ]
}

function migrationDraftCheckPassed(plan: EditPlan, checkId: string) {
  if (!plan.migrationDraftPlan) {
    return false
  }

  return validateMigrationDraftPlan(plan.migrationDraftPlan).checks.some((check) => check.id === checkId && check.passed)
}

function createMigrationDraftChecks(plan: EditPlan): PlanningSystemAuditReport['hardRuleChecks'] {
  const draftPlan = plan.migrationDraftPlan
  const paths = draftPlan?.files.map((file) => file.path) ?? []

  return [
    {
      label: 'SQL migration draft plan exists',
      passed: Boolean(draftPlan),
      message: draftPlan ? 'Review-only SQL draft registry is included in the mock EditPlan.' : 'SQL migration draft registry is missing from the mock EditPlan.',
    },
    {
      label: 'SQL drafts stay in draft-only folder',
      passed: migrationDraftCheckPassed(plan, 'migration-drafts-draft-folder-only'),
      message: 'Every SQL draft path should stay under database/migration-drafts/.',
    },
    {
      label: 'SQL drafts are marked must-not-run',
      passed: migrationDraftCheckPassed(plan, 'migration-drafts-must-not-run'),
      message: 'Every SQL draft registry entry should be marked mustNotRun.',
    },
    {
      label: 'No active Supabase migration path used',
      passed: migrationDraftCheckPassed(plan, 'migration-drafts-no-active-path') && paths.every((path) => !path.startsWith('supabase/migrations/')),
      message: 'Review drafts must not live in supabase/migrations/.',
    },
    {
      label: 'Approved snapshot SQL draft exists',
      passed: migrationDraftCheckPassed(plan, 'migration-drafts-approved-snapshot-covered'),
      message: 'Draft SQL should cover approved_plan_snapshots and snapshot immutability review.',
    },
    {
      label: 'RLS draft exists',
      passed: migrationDraftCheckPassed(plan, 'migration-drafts-rls-covered'),
      message: 'Draft SQL should include an RLS policy draft file.',
    },
    {
      label: 'Storage bucket draft exists',
      passed: migrationDraftCheckPassed(plan, 'migration-drafts-storage-covered'),
      message: 'Draft SQL should include a storage bucket policy draft file.',
    },
  ]
}

function migrationReviewCheckPassed(plan: EditPlan, checkId: string) {
  return Boolean(plan.migrationReviewPlan?.checks.some((check) => check.id === checkId && check.passed))
}

function rlsHardeningCheckPassed(plan: EditPlan, checkId: string) {
  return Boolean(plan.migrationReviewPlan?.rlsHardeningPlan.checks.some((check) => check.id === checkId && check.passed))
}

function createMigrationReviewChecks(plan: EditPlan): PlanningSystemAuditReport['hardRuleChecks'] {
  const reviewPlan = plan.migrationReviewPlan
  const limitationsText = reviewPlan?.limitations.join(' ').toLowerCase() ?? ''

  return [
    {
      label: 'Migration review plan exists',
      passed: Boolean(reviewPlan),
      message: reviewPlan ? 'Migration review and RLS hardening plan is included in the mock EditPlan.' : 'Migration review plan is missing from the mock EditPlan.',
    },
    {
      label: 'RLS hardening plan exists',
      passed: Boolean(reviewPlan?.rlsHardeningPlan),
      message: 'Migration review should include a table-by-table RLS hardening plan.',
    },
    {
      label: 'Approved snapshot immutability reviewed',
      passed: rlsHardeningCheckPassed(plan, 'rls-approved-snapshots-immutable') &&
        migrationReviewCheckPassed(plan, 'migration-review-approved-snapshot-immutability'),
      message: 'Approved snapshots should be immutable and user mutation denied in the hardening review.',
    },
    {
      label: 'Worker tables service-only reviewed',
      passed: rlsHardeningCheckPassed(plan, 'rls-worker-tables-service-only') &&
        migrationReviewCheckPassed(plan, 'migration-review-worker-service-only'),
      message: 'Worker, job, generation, QA, and export writes should be backend/service-role controlled.',
    },
    {
      label: 'Storage privacy reviewed',
      passed: migrationReviewCheckPassed(plan, 'migration-review-source-media-private') &&
        rlsHardeningCheckPassed(plan, 'rls-storage-private-default-noted'),
      message: 'Source media and private artifacts should stay private by default.',
    },
    {
      label: 'Migration review remains draft-only',
      passed: reviewPlan?.overallStatus === 'hardened_draft' &&
        reviewPlan.rlsHardeningPlan.overallStatus !== 'ready_for_testing' &&
        limitationsText.includes('no sql is run') &&
        limitationsText.includes('no supabase client'),
      message: 'Migration/RLS review should remain hardened_draft with no SQL, active migration, or Supabase connection.',
    },
  ]
}

function productionReadinessCheckPassed(plan: EditPlan, checkId: string) {
  return Boolean(plan.supabaseProductionReadinessPlan?.checks.some((check) => check.id === checkId && check.passed))
}

function createSupabaseProductionReadinessChecks(plan: EditPlan): PlanningSystemAuditReport['hardRuleChecks'] {
  const readinessPlan = plan.supabaseProductionReadinessPlan
  const activeFiles = readinessPlan?.activeMigrationFiles ?? []
  const manualTests = readinessPlan?.manualTestFiles ?? []

  return [
    {
      label: 'Supabase production-test readiness exists',
      passed: Boolean(readinessPlan),
      message: readinessPlan
        ? 'Supabase production-test readiness is included in the mock EditPlan.'
        : 'Supabase production-test readiness is missing from the mock EditPlan.',
    },
    {
      label: 'Active migration files are listed',
      passed: activeFiles.length === 8 && activeFiles.every((file) => file.startsWith('supabase/migrations/20260518')),
      message: 'RP-DATA-04 should list the eight active 20260518 migration files for manual local/staging testing.',
    },
    {
      label: 'Local and staging testing remain required',
      passed: readinessPlan?.status === 'local_testing_required' &&
        Boolean(readinessPlan.productionBlockers.some((blocker) => blocker.toLowerCase().includes('local'))) &&
        Boolean(readinessPlan.productionBlockers.some((blocker) => blocker.toLowerCase().includes('staging'))),
      message: 'Readiness must not claim production approval before local/staging testing.',
    },
    {
      label: 'RLS and storage migrations are represented',
      passed: productionReadinessCheckPassed(plan, 'supabase-readiness-rls-migration-listed') &&
        productionReadinessCheckPassed(plan, 'supabase-readiness-storage-migration-listed'),
      message: 'Production-test readiness should include RLS and private storage policy migrations.',
    },
    {
      label: 'Manual SQL tests are listed',
      passed: manualTests.length === 4 && productionReadinessCheckPassed(plan, 'supabase-readiness-manual-tests-listed'),
      message: 'Readiness should include manual local/staging SQL smoke-test files.',
    },
    {
      label: 'No SQL or Supabase connection is implied',
      passed: productionReadinessCheckPassed(plan, 'supabase-readiness-no-sql-run') &&
        productionReadinessCheckPassed(plan, 'supabase-readiness-no-supabase-connection') &&
        Boolean(readinessPlan?.limitations.some((note) => note.toLowerCase().includes('did not run sql'))) &&
        Boolean(readinessPlan?.limitations.some((note) => note.toLowerCase().includes('did not connect supabase'))),
      message: 'Readiness must document files only and preserve no-run/no-connection constraints.',
    },
  ]
}

function createHardRuleChecks(plan: EditPlan): PlanningSystemAuditReport['hardRuleChecks'] {
  const editLevel = getEditLevel(plan)
  const allModels = allProviderModels(plan)
  const planLower = planText(plan)
  const hasVeo = allModels.some(providerUsesVeo)
  const basicOrProNoVeo = editLevel === 'premium' || !hasVeo
  const premiumVeoFallbackOnly = editLevel !== 'premium' ||
    !hasVeo ||
    (!primaryVeoUsed(plan) && planLower.includes('final fallback') && !planLower.includes('primary veo'))

  return [
    {
      label: 'Basic/Pro no Veo',
      passed: basicOrProNoVeo,
      message: basicOrProNoVeo ? 'Basic and Pro routes exclude Veo.' : 'Basic/Pro plan references Veo.',
    },
    {
      label: 'Premium Veo final fallback only',
      passed: premiumVeoFallbackOnly,
      message: premiumVeoFallbackOnly ? 'Premium Veo usage is fallback/rescue-only when present.' : 'Premium Veo usage must remain final fallback/rescue only.',
    },
    {
      label: 'No primary/default Veo',
      passed: !primaryVeoUsed(plan),
      message: !primaryVeoUsed(plan) ? 'No primary/default Veo route is present.' : 'A primary/default Veo route is present.',
    },
    {
      label: 'No default 1080P structured route',
      passed: !default1080pUsed(plan),
      message: !default1080pUsed(plan) ? 'No structured route defaults to 1080P.' : 'A structured route or prompt defaults to 1080P.',
    },
    {
      label: 'Approval required',
      passed: plan.approvalRequired === true,
      message: plan.approvalRequired ? 'Plan approval is required before mock progress.' : 'Plan approval is not required.',
    },
    {
      label: 'Credit estimate exists',
      passed: typeof plan.creditEstimate?.total === 'number' && Array.isArray(plan.creditEstimate.breakdown),
      message: 'Credits are estimated before approval.',
    },
    {
      label: 'Remotion owns final composition',
      passed: renderItemsOwnComposition(plan),
      message: renderItemsOwnComposition(plan) ? 'Render strategy and renderer plan keep final composition with Remotion.' : 'Renderer ownership is not fully represented.',
    },
    {
      label: 'AI video assets are assets/clips only',
      passed: Boolean(plan.visualAssetPlan && plan.rendererCompositionPlan),
      message: 'AI-video routes feed assets/clips into the planned renderer, not the final canvas.',
    },
    {
      label: 'Matching panel background policy exists',
      passed: matchingBackgroundPolicyExists(plan),
      message: matchingBackgroundPolicyExists(plan) ? 'Panel background policy is present for generated video assets.' : 'Matching panel background policy is missing.',
    },
    {
      label: 'Tool/provider separation exists',
      passed: toolProviderSeparationExists(plan),
      message: toolProviderSeparationExists(plan) ? 'Open-source tool IDs and provider model IDs remain separate.' : 'Tool and provider IDs are mixed.',
    },
    {
      label: 'Worker runtime does not allow frontend execution',
      passed: !planLower.includes('frontendexecutionallowed":true'),
      message: 'Future worker runtime is not enabled from frontend plan state.',
    },
    {
      label: 'Production readiness is not legal advice',
      passed: !planLower.includes('production readiness') || planLower.includes('not legal advice') || planLower.includes('not legal'),
      message: 'Production readiness language does not claim legal advice.',
    },
    {
      label: 'Browser capture stays mock/planning-only',
      passed: browserCaptureIsMockOnly(plan),
      message: 'Browser capture planning does not imply real browser access or bypassing site rules.',
    },
    {
      label: 'Tool previews are mock-only',
      passed: !planLower.includes('tool preview executed') && !planLower.includes('tool preview rendered in production'),
      message: 'Tool previews do not imply production rendering.',
    },
    {
      label: 'Source order confirmation represented',
      passed: typeof plan.sourceSequenceReview?.confirmed === 'boolean',
      message: 'Source order confirmation state is present in the plan.',
    },
    {
      label: 'Basic is professional, not low quality',
      passed: !planLower.includes('basic low quality') && !planLower.includes('basic is low quality'),
      message: 'Basic is treated as lower-compute professional editing.',
    },
    ...createSchemaBridgeChecks(plan),
    ...createMigrationDraftChecks(plan),
    ...createMigrationReviewChecks(plan),
    ...createSupabaseProductionReadinessChecks(plan),
  ]
}

function duplicateOrLegacyWarnings(plan: EditPlan) {
  const text = planText(plan)
  const warnings: string[] = []

  if (isLaunchDefaultTool(plan, 'essentia')) {
    warnings.push('Essentia appears as an active launch/default audio analysis tool.')
  }

  if (isLaunchDefaultTool(plan, 'rubber_band')) {
    warnings.push('Rubber Band appears as an active launch/default stretch or pitch tool.')
  }

  if (text.includes('advanced_viral')) {
    warnings.push('Legacy edit level advanced_viral appears in active plan text.')
  }

  if (text.includes('subscription includes unlimited') || text.includes('includes unlimited ai editing')) {
    warnings.push('Unlimited AI editing subscription language appears in active plan text.')
  }

  if (text.includes('veo default') || text.includes('default veo')) {
    warnings.push('Veo-as-default language appears in active plan text.')
  }

  if (text.includes('transparent ai-video background as default')) {
    warnings.push('Transparent AI-video background default language appears in active plan text.')
  }

  if (text.includes('provider dollar cost') || text.includes('provider dollars')) {
    warnings.push('Provider dollar cost language appears as user billing context.')
  }

  if (text.includes('seedance') && (text.includes('launch router') || text.includes('launch default'))) {
    warnings.push('Seedance launch-router language appears in active plan text.')
  }

  return warnings
}

function layerStatus(params: {
  metadata: LayerMetadata
  includedInEditPlan: boolean
  missingConnections: string[]
}): PlanningSystemAuditStatus {
  const { includedInEditPlan, metadata, missingConnections } = params

  if (!metadata.hasTypes && !metadata.hasPlannerModule && !metadata.hasUiCard) {
    return metadata.futureOnly || metadata.previewOnly ? 'partial' : 'missing'
  }

  if (!includedInEditPlan) {
    return metadata.futureOnly || metadata.previewOnly ? 'partial' : 'missing'
  }

  if (missingConnections.length > 0) {
    return 'warning'
  }

  return 'connected'
}

function createLayerAudit(plan: EditPlan, metadata: LayerMetadata): PlanningSystemLayerAudit {
  const includedInEditPlan = hasPlanValue(plan, metadata.planKeys)
  const missingConnections = [
    !metadata.hasTypes ? 'Types are not fully represented yet.' : undefined,
    !metadata.hasPlannerModule ? 'Planner module is not fully represented yet.' : undefined,
    !metadata.hasUiCard ? 'Dedicated UI card is not present or is represented through another card.' : undefined,
    !metadata.includedInApprovedSnapshot ? 'Approved snapshot connection is future or indirect.' : undefined,
    !metadata.includedInValidation ? 'Planner validation connection is missing.' : undefined,
    !includedInEditPlan ? 'Layer is not directly included in the current EditPlan object.' : undefined,
  ].filter(Boolean) as string[]

  return {
    id: metadata.id,
    label: metadata.label,
    status: layerStatus({ includedInEditPlan, metadata, missingConnections }),
    hasTypes: metadata.hasTypes,
    hasPlannerModule: metadata.hasPlannerModule,
    hasUiCard: metadata.hasUiCard,
    includedInEditPlan,
    includedInApprovedSnapshot: metadata.includedInApprovedSnapshot,
    includedInValidation: metadata.includedInValidation,
    includedInCreditEstimate: metadata.includedInCreditEstimate,
    notes: metadata.notes,
    missingConnections,
  }
}

function aggregateStatus(params: {
  layers: PlanningSystemLayerAudit[]
  hardRuleChecks: PlanningSystemAuditReport['hardRuleChecks']
  launchToolStackChecks: PlanningSystemAuditReport['launchToolStackChecks']
  warnings: string[]
}): PlanningSystemAuditStatus {
  const { hardRuleChecks, launchToolStackChecks, layers, warnings } = params

  if (hardRuleChecks.some((rule) => !rule.passed)) {
    return 'blocking'
  }

  if (
    warnings.length > 0 ||
    launchToolStackChecks.some((check) => !check.passed) ||
    layers.some((layer) => layer.status === 'warning')
  ) {
    return 'warning'
  }

  if (layers.some((layer) => layer.status === 'missing' || layer.status === 'partial')) {
    return 'partial'
  }

  return 'connected'
}

export function createPlanningSystemAuditReport(plan: EditPlan): PlanningSystemAuditReport {
  const layers = layerMetadata.map((metadata) => createLayerAudit(plan, metadata))
  const hardRuleChecks = createHardRuleChecks(plan)
  const launchToolStackChecks = createLaunchToolStackChecks(plan)
  const warnings = duplicateOrLegacyWarnings(plan)
  const overallStatus = aggregateStatus({ hardRuleChecks, launchToolStackChecks, layers, warnings })
  const connectedCount = layers.filter((layer) => layer.status === 'connected').length
  const partialCount = layers.filter((layer) => layer.status === 'partial').length
  const missingCount = layers.filter((layer) => layer.status === 'missing').length
  const warningCount = layers.filter((layer) => layer.status === 'warning').length
  const failedLaunchStackChecks = launchToolStackChecks.filter((check) => !check.passed).length

  return {
    id: 'planning-system-audit-report',
    overallStatus,
    summary:
      overallStatus === 'blocking'
        ? 'One or more hard planning rules are blocking.'
        : `${connectedCount} planning layers connected, ${partialCount} partial, ${missingCount} missing, ${warningCount} warning, and ${failedLaunchStackChecks} launch stack check${failedLaunchStackChecks === 1 ? '' : 's'} needing attention. Current gaps are expected to remain mock/future unless a backend or worker milestone asks for them.`,
    layers,
    hardRuleChecks,
    launchToolStackChecks,
    duplicateOrLegacyWarnings: warnings,
    nextPhaseRecommendations: [
      'Manual local Supabase testing: run the active 20260518 migrations only in a local environment after review.',
      'Manual staging Supabase testing: verify RLS, storage policies, immutability triggers, and append-only protections before production.',
      'RP-BACKEND-01: Approved Snapshot Persistence + Job Queue Skeleton.',
      'RP-PROVIDER-01: Provider Client Architecture, no real calls.',
      'RP-RENDER-01: Remotion Composition Skeleton, no final render.',
      'RP-CREDITS-01: Credit Reservation Ledger Architecture.',
      'RP-QA-02: Unit tests for planner validation and regression.',
      'Production migration approval: blocked until local/staging tests, advisor review, backups, and approval pass.',
    ],
    limitations: [
      'Audit inspects the EditPlan object only; it does not grep files at runtime.',
      'Backend routes, Supabase connections, SQL execution, Stripe, provider calls, rendering, export jobs, and real tool execution are not implemented.',
      'Launch tool stack checks are planning metadata only and are not legal conclusions or worker execution.',
      'Supabase schema bridge is planning metadata; active RP-DATA-04 migration files are repository files only and are not applied to any database.',
      'SQL migration drafts are review-only files under database/migration-drafts/; they are not active Supabase migrations and should not be run.',
      'Migration review and RLS hardening remain hardened_draft; RLS is not tested in Supabase in this task.',
      'Supabase production-test readiness lists active migration files and manual tests; Codex did not run SQL or connect Supabase.',
      'Future worker and production-readiness layers are documented as partial until backend milestones connect them.',
      'Browser-safe previews remain developer/mock-only and are not production rendering.',
    ],
  }
}
