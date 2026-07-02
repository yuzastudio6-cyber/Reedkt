import type {
  AgentFailureCategory,
  AgentFailureFallbackDecision,
  AgentFailureScenario,
  AgentFallbackAction,
  AgentFallbackActionType,
  AgentRecoveryState,
  EditAssetManifestItem,
  EditWorkItemType,
} from '../types/editing-agent-runtime'
import type { EditLevel, OpenSourceToolId, ProviderModel } from '../types/reeditpro'

const allFailureCategories: AgentFailureCategory[] = [
  'provider_timeout',
  'provider_error',
  'provider_policy_rejection',
  'provider_bad_output',
  'prompt_mismatch',
  'style_mismatch',
  'character_mismatch',
  'duration_mismatch',
  'aspect_ratio_mismatch',
  'background_mismatch',
  'missing_required_asset',
  'asset_storage_failure',
  'asset_qa_failed',
  'tool_worker_failure',
  'map_render_failure',
  'chart_render_failure',
  'browser_capture_failure',
  'mask_generation_failure',
  'audio_analysis_failure',
  'audio_processing_failure',
  'color_processing_failure',
  'render_preflight_failure',
  'render_failure',
  'timing_validation_failure',
  'trim_meaning_failure',
  'user_review_required',
  'credit_limit_or_budget_issue',
  'policy_violation',
  'unknown',
]

function scenarioDefaults(category: AgentFailureCategory): Omit<AgentFailureScenario, 'id' | 'category'> {
  const localAssetCategories: AgentFailureCategory[] = [
    'provider_timeout',
    'provider_error',
    'provider_bad_output',
    'prompt_mismatch',
    'style_mismatch',
    'character_mismatch',
    'duration_mismatch',
    'aspect_ratio_mismatch',
    'background_mismatch',
    'asset_storage_failure',
    'asset_qa_failed',
    'map_render_failure',
    'chart_render_failure',
    'browser_capture_failure',
    'mask_generation_failure',
  ]
  const providerCategories: AgentFailureCategory[] = [
    'provider_timeout',
    'provider_error',
    'provider_policy_rejection',
    'provider_bad_output',
    'prompt_mismatch',
    'style_mismatch',
    'character_mismatch',
    'duration_mismatch',
    'aspect_ratio_mismatch',
    'background_mismatch',
  ]
  const toolCategories: AgentFailureCategory[] = [
    'tool_worker_failure',
    'map_render_failure',
    'chart_render_failure',
    'browser_capture_failure',
    'mask_generation_failure',
    'audio_analysis_failure',
    'audio_processing_failure',
    'color_processing_failure',
  ]
  const globalCategories: AgentFailureCategory[] = [
    'missing_required_asset',
    'render_preflight_failure',
    'render_failure',
    'timing_validation_failure',
    'trim_meaning_failure',
    'user_review_required',
    'credit_limit_or_budget_issue',
    'policy_violation',
  ]

  const scope = globalCategories.includes(category)
    ? category === 'render_failure' || category === 'render_preflight_failure' || category === 'missing_required_asset'
      ? 'final_render'
      : 'approval_gate'
    : localAssetCategories.includes(category)
      ? 'local_asset'
      : 'segment'

  const affectedWorkItemTypes: EditWorkItemType[] = providerCategories.includes(category)
    ? ['generate_image_asset', 'generate_ai_video_asset']
    : toolCategories.includes(category)
      ? ['render_map_asset', 'render_chart_asset', 'capture_browser_asset', 'run_audio_analysis', 'run_audio_stretch', 'process_image_asset', 'process_video_asset', 'generate_mask_asset']
      : category.includes('render')
        ? ['render_final_export', 'render_remotion_preview']
        : category.includes('timing')
          ? ['prepare_caption_timing', 'prepare_visual_cue_timing', 'prepare_soundsync_timing', 'run_timing_qa']
          : ['custom']

  const affectedAssetTypes: EditAssetManifestItem['assetType'][] =
    category === 'map_render_failure'
      ? ['map_visual']
      : category === 'chart_render_failure'
        ? ['chart_visual']
        : category === 'browser_capture_failure'
          ? ['browser_capture']
          : category === 'mask_generation_failure'
            ? ['mask_asset']
            : category.includes('audio')
              ? ['audio_asset']
              : providerCategories.includes(category)
                ? ['generated_image', 'ai_video_clip']
                : ['unknown']

  const blocksFinalRender = globalCategories.includes(category)
  const requiresUserReviewByDefault = [
    'trim_meaning_failure',
    'user_review_required',
    'provider_policy_rejection',
    'character_mismatch',
    'browser_capture_failure',
    'credit_limit_or_budget_issue',
    'policy_violation',
  ].includes(category)

  return {
    scope,
    label: category.replaceAll('_', ' '),
    description: `Mock failure scenario for ${category.replaceAll('_', ' ')}.`,
    likelyCauses: [
      'Future provider/tool/worker result did not satisfy the approved plan.',
      'Required dependency, QA, timing, source-truth, or policy state was unresolved.',
    ],
    affectedWorkItemTypes,
    affectedAssetTypes,
    blocksIndependentWork: !localAssetCategories.includes(category),
    blocksFinalRender,
    requiresUserReviewByDefault,
    severity: blocksFinalRender ? 'blocking' : requiresUserReviewByDefault ? 'high' : 'medium',
  }
}

export const agentFailureScenarios: AgentFailureScenario[] = allFailureCategories.map((category) => ({
  id: `failure-${category}`,
  category,
  ...scenarioDefaults(category),
}))

function tiers(basic: boolean, pro: boolean, premium: boolean) {
  return { basic, pro, premium }
}

function action(params: {
  id: string
  actionType: AgentFallbackActionType
  label: string
  description: string
  allowedForTiers?: AgentFallbackAction['allowedForTiers']
  allowedProviderModels?: ProviderModel[]
  allowedToolIds?: OpenSourceToolId[]
  requiresUserReview?: boolean
  requiresNewApproval?: boolean
  affectsCredits?: boolean
  estimatedCreditImpact?: AgentFallbackAction['estimatedCreditImpact']
  reason: string
  qaChecks?: string[]
}): AgentFallbackAction {
  return {
    id: params.id,
    actionType: params.actionType,
    label: params.label,
    description: params.description,
    allowedForTiers: params.allowedForTiers ?? tiers(true, true, true),
    allowedProviderModels: params.allowedProviderModels ?? [],
    allowedToolIds: params.allowedToolIds ?? [],
    requiresUserReview: params.requiresUserReview ?? false,
    requiresNewApproval: params.requiresNewApproval ?? false,
    affectsCredits: params.affectsCredits ?? false,
    estimatedCreditImpact: params.estimatedCreditImpact ?? 'none',
    reason: params.reason,
    qaChecks: params.qaChecks ?? ['Fallback must remain inside approved snapshot policy.', 'No real fallback execution runs in frontend mock.'],
  }
}

export const agentFallbackActions: AgentFallbackAction[] = [
  action({
    id: 'fallback-retry-same',
    actionType: 'retry_same',
    label: 'Retry same route',
    description: 'Retry the same future provider/tool route with the same approved work item and idempotency policy.',
    allowedProviderModels: ['gpt_image_2', 'wan_2_2_kf2v_flash', 'wan_2_6_i2v_flash', 'hailuo_2_3_fast', 'hailuo_02'],
    affectsCredits: true,
    estimatedCreditImpact: 'low',
    reason: 'Useful for transient provider/tool failures without changing the approved creative route.',
  }),
  action({
    id: 'fallback-simpler-prompt',
    actionType: 'retry_with_simpler_prompt',
    label: 'Retry with simpler prompt',
    description: 'Simplify the approved prompt brief while preserving intent, frame, timing, and safety constraints.',
    allowedProviderModels: ['gpt_image_2', 'wan_2_2_kf2v_flash', 'wan_2_6_i2v_flash', 'hailuo_2_3_fast', 'hailuo_02'],
    affectsCredits: true,
    estimatedCreditImpact: 'low',
    reason: 'Reduces style/prompt mismatch risk without changing provider class.',
  }),
  action({
    id: 'fallback-hailuo-provider',
    actionType: 'switch_to_fallback_provider',
    label: 'Use Hailuo fallback',
    description: 'Use Hailuo as fallback where approved by tier and route.',
    allowedForTiers: tiers(false, true, true),
    allowedProviderModels: ['hailuo_2_3_fast', 'hailuo_02'],
    requiresUserReview: true,
    affectsCredits: true,
    estimatedCreditImpact: 'medium',
    reason: 'Pro/Premium can use Hailuo fallback; Basic stays lower-compute.',
  }),
  action({
    id: 'fallback-premium-veo-final-rescue',
    actionType: 'switch_to_fallback_provider',
    label: 'Premium Veo final rescue',
    description: 'Use Veo only as Premium final fallback/rescue for approved AI video assets.',
    allowedForTiers: tiers(false, false, true),
    allowedProviderModels: ['veo_3_1_lite'],
    requiresUserReview: true,
    requiresNewApproval: true,
    affectsCredits: true,
    estimatedCreditImpact: 'premium',
    reason: 'Veo is Premium-only and never primary/default.',
    qaChecks: ['Only approved AI video assets may use Veo final fallback.', 'Never use Veo for maps/charts/browser/captions/timing/masks.'],
  }),
  action({
    id: 'fallback-still-card',
    actionType: 'switch_to_still_card',
    label: 'Use still/card fallback',
    description: 'Replace failed generated motion with a still, card, or key visual.',
    reason: 'Professional lower-compute fallback that preserves meaning and avoids rescue loops.',
  }),
  action({
    id: 'fallback-motion-design',
    actionType: 'switch_to_motion_design',
    label: 'Use motion design',
    description: 'Use Remotion/editor motion instead of failed AI video.',
    allowedProviderModels: ['remotion_editor_motion'],
    reason: 'Keeps the edit moving without treating AI video as required.',
  }),
  action({
    id: 'fallback-remotion-only',
    actionType: 'switch_to_remotion_only',
    label: 'Use Remotion-only fallback',
    description: 'Use typography, cards, panels, and editor motion in Remotion.',
    allowedProviderModels: ['remotion_editor_motion'],
    allowedToolIds: ['remotion'],
    reason: 'Best default for exact layout, captions, cards, and simple visuals.',
  }),
  action({
    id: 'fallback-tool-generated-asset',
    actionType: 'switch_to_tool_generated_asset',
    label: 'Use controlled tool asset',
    description: 'Use an approved controlled tool output instead of generative video.',
    allowedToolIds: ['maplibre', 'd3', 'echarts', 'playwright', 'sharp', 'ffmpeg', 'vapoursynth'],
    reason: 'Exact maps, charts, screenshots, masks, and processing should use tools/workers later, not AI video.',
  }),
  action({
    id: 'fallback-static-map',
    actionType: 'switch_to_static_map',
    label: 'Use static map card',
    description: 'Use a static map/location card for failed map animation.',
    allowedToolIds: ['maplibre', 'remotion'],
    reason: 'Maps should stay controlled and not be invented by AI video.',
  }),
  action({
    id: 'fallback-static-chart',
    actionType: 'switch_to_static_chart',
    label: 'Use static chart/card',
    description: 'Use a static chart, metric card, or table for failed chart animation.',
    allowedToolIds: ['d3', 'echarts', 'vega_lite', 'remotion'],
    reason: 'Exact data visuals should stay controlled.',
  }),
  action({
    id: 'fallback-uploaded-screenshot',
    actionType: 'use_uploaded_screenshot',
    label: 'Use uploaded screenshot',
    description: 'Use a user-provided screenshot when browser capture cannot proceed.',
    requiresUserReview: true,
    reason: 'Avoids bypassing auth, paywalls, CAPTCHA, or site restrictions.',
  }),
  action({
    id: 'fallback-placeholder-preview-only',
    actionType: 'use_placeholder_preview_only',
    label: 'Use preview placeholder only',
    description: 'Use a placeholder for preview while final render remains blocked.',
    reason: 'Preview can continue without pretending the final asset exists.',
  }),
  action({
    id: 'fallback-simplify-layout',
    actionType: 'simplify_layout',
    label: 'Simplify layout',
    description: 'Reduce the composition complexity when masks, overlays, or assets fail.',
    reason: 'Preserves professional quality without brittle foreground/depth work.',
  }),
  action({
    id: 'fallback-lower-panel',
    actionType: 'use_lower_panel',
    label: 'Use lower panel',
    description: 'Move visual support into a lower panel instead of risky overlays.',
    reason: 'A safer fallback for mask/depth failures.',
  }),
  action({
    id: 'fallback-side-by-side',
    actionType: 'use_side_by_side',
    label: 'Use side-by-side',
    description: 'Use side-by-side layout to avoid complex masks or foreground overlap.',
    reason: 'Maintains clarity while avoiding failed depth/mask work.',
  }),
  action({
    id: 'fallback-remove-optional',
    actionType: 'remove_optional_asset',
    label: 'Remove optional asset',
    description: 'Skip optional b-roll, decorative SFX, or flourish if approved.',
    reason: 'A local optional failure should not stop the whole edit.',
  }),
  action({
    id: 'fallback-user-review',
    actionType: 'request_user_review',
    label: 'Request user review',
    description: 'Ask the user when fallback affects meaning, privacy, source truth, cost, or final look.',
    requiresUserReview: true,
    reason: 'Some decisions should not be auto-fixed.',
  }),
  action({
    id: 'fallback-new-approval',
    actionType: 'request_new_approval',
    label: 'Request new approval',
    description: 'Ask for a new approval when fallback changes cost, route, meaning, or approved scope.',
    requiresUserReview: true,
    requiresNewApproval: true,
    affectsCredits: true,
    estimatedCreditImpact: 'medium',
    reason: 'Approved snapshots are immutable; material fallback changes need approval.',
  }),
  action({
    id: 'fallback-block-final-render',
    actionType: 'block_final_render',
    label: 'Block final render',
    description: 'Keep final export blocked until required failures are resolved.',
    reason: 'Final render cannot proceed with missing required assets or unresolved required failures.',
  }),
  action({
    id: 'fallback-cancel-work-item',
    actionType: 'cancel_work_item',
    label: 'Cancel work item',
    description: 'Cancel an affected optional work item while continuing independent work.',
    reason: 'Keeps local failures isolated.',
  }),
  action({
    id: 'fallback-restore-refund-future',
    actionType: 'restore_or_refund_credits_future',
    label: 'Future restore/refund note',
    description: 'Future backend credit ledger policy may restore/refund failed generation credits.',
    requiresUserReview: true,
    affectsCredits: true,
    estimatedCreditImpact: 'medium',
    reason: 'No real billing occurs in this milestone.',
  }),
  action({
    id: 'fallback-custom',
    actionType: 'custom',
    label: 'Custom reviewed fallback',
    description: 'A custom fallback path can be added after user review and approval.',
    requiresUserReview: true,
    requiresNewApproval: true,
    reason: 'Custom recovery must be explicit and approved.',
  }),
]

export function getFailureScenario(category: AgentFailureCategory) {
  return agentFailureScenarios.find((scenario) => scenario.category === category) ?? agentFailureScenarios.find((scenario) => scenario.category === 'unknown')
}

function byId(ids: string[]) {
  return agentFallbackActions.filter((actionItem) => ids.includes(actionItem.id))
}

export function getFallbackActionsForFailure(params: {
  category: AgentFailureCategory
  editLevel: EditLevel
  assetType?: EditAssetManifestItem['assetType']
}): AgentFallbackAction[] {
  const { category, editLevel, assetType } = params
  const tierAllowed = (actionItem: AgentFallbackAction) => actionItem.allowedForTiers[editLevel]
  const fallbackIds =
    category === 'map_render_failure'
      ? ['fallback-static-map', 'fallback-remotion-only', 'fallback-user-review']
      : category === 'chart_render_failure'
        ? ['fallback-static-chart', 'fallback-remotion-only', 'fallback-user-review']
        : category === 'browser_capture_failure'
          ? ['fallback-uploaded-screenshot', 'fallback-placeholder-preview-only', 'fallback-user-review']
          : category === 'mask_generation_failure'
            ? ['fallback-lower-panel', 'fallback-side-by-side', 'fallback-simplify-layout', 'fallback-block-final-render']
            : category === 'timing_validation_failure'
              ? ['fallback-remotion-only', 'fallback-simplify-layout', 'fallback-user-review', 'fallback-block-final-render']
              : category === 'trim_meaning_failure'
                ? ['fallback-user-review', 'fallback-new-approval', 'fallback-block-final-render']
                : category === 'credit_limit_or_budget_issue'
                  ? ['fallback-remove-optional', 'fallback-still-card', 'fallback-new-approval', 'fallback-restore-refund-future']
                  : category === 'missing_required_asset' || category === 'render_preflight_failure' || category === 'render_failure'
                    ? ['fallback-placeholder-preview-only', 'fallback-block-final-render', 'fallback-user-review']
                    : category === 'tool_worker_failure' || category.includes('audio') || category.includes('color')
                      ? ['fallback-tool-generated-asset', 'fallback-remotion-only', 'fallback-user-review']
                      : ['fallback-retry-same', 'fallback-simpler-prompt', 'fallback-hailuo-provider', 'fallback-still-card', 'fallback-motion-design', 'fallback-remotion-only', 'fallback-user-review']

  const actions = byId(fallbackIds).filter(tierAllowed)
  const canUsePremiumVeo = editLevel === 'premium' && assetType === 'ai_video_clip' && (
    category === 'provider_timeout' ||
    category === 'provider_error' ||
    category === 'provider_bad_output' ||
    category === 'duration_mismatch'
  )

  return canUsePremiumVeo
    ? [...actions, ...byId(['fallback-premium-veo-final-rescue']).filter(tierAllowed)]
    : actions
}

export function createFallbackDecision(params: {
  scenario: AgentFailureScenario
  actions: AgentFallbackAction[]
  editLevel: EditLevel
  relatedWorkItemId?: string
  relatedAssetManifestItemId?: string
  assetType?: EditAssetManifestItem['assetType']
  requiredForFinalRender?: boolean
}): AgentFailureFallbackDecision {
  const allowedActionIds = params.actions.map((actionItem) => actionItem.id)
  const blockedActionIds = agentFallbackActions
    .filter((actionItem) => !actionItem.allowedForTiers[params.editLevel])
    .map((actionItem) => actionItem.id)
  const userReviewNeeded = params.scenario.requiresUserReviewByDefault ||
    params.actions.some((actionItem) => actionItem.requiresUserReview)
  const newApprovalNeeded = params.actions.some((actionItem) => actionItem.requiresNewApproval)
  const finalRenderBlocked = params.requiredForFinalRender === true || params.scenario.blocksFinalRender
  const continueIndependentWork = !params.scenario.blocksIndependentWork && !finalRenderBlocked
  const recoveryState: AgentRecoveryState = newApprovalNeeded
    ? 'needs_new_approval'
    : userReviewNeeded
      ? 'needs_user_review'
      : allowedActionIds.length
        ? 'fallback_available'
        : 'unrecoverable_in_current_plan'

  return {
    id: `decision-${params.scenario.id}${params.relatedAssetManifestItemId ? `-${params.relatedAssetManifestItemId}` : ''}${params.relatedWorkItemId ? `-${params.relatedWorkItemId}` : ''}`,
    failureScenarioId: params.scenario.id,
    relatedWorkItemId: params.relatedWorkItemId,
    relatedAssetManifestItemId: params.relatedAssetManifestItemId,
    recoveryState,
    selectedFallbackActionIds: allowedActionIds.slice(0, 4),
    blockedActionIds,
    userReviewQuestion: userReviewNeeded
      ? 'Do you want ReeditPro to use this fallback path, revise the affected segment, or keep the current plan blocked?'
      : undefined,
    newApprovalReason: newApprovalNeeded
      ? 'Fallback changes approved cost, model route, visual route, meaning, or final output scope.'
      : undefined,
    creditImpactNote: params.actions.some((actionItem) => actionItem.affectsCredits)
      ? 'Fallback may affect future fallback allowance or credit estimate; no real credits are deducted in this mock.'
      : 'No material credit impact is expected for this mock fallback path.',
    continueIndependentWork,
    finalRenderBlocked,
    reason: finalRenderBlocked
      ? 'Required or global failure blocks final render until resolved.'
      : continueIndependentWork
        ? 'Failure is isolated, so independent work can continue while the affected fallback is resolved.'
        : 'Failure requires review before affected downstream work continues.',
    qaChecks: [
      'Fallback must stay inside approved plan constraints.',
      'Basic/Pro no Veo and Premium final-fallback-only Veo must be preserved.',
      'No real fallback execution runs in frontend mock.',
    ],
  }
}
