import type {
  AgentFailureCategory,
  AgentFailureFallbackDecision,
  AgentFailureScenario,
  AgentQAFallbackPlan,
  AgentQAGateCheck,
  AsyncAssetReconciliationPlan,
  EditAssetManifestItem,
  EditingAgentExecutionPlan,
  EditWorkItem,
} from '../types/editing-agent-runtime'
import type { EditPlan } from '../types/reeditpro'
import {
  createGateChecksForAsset,
  createGateChecksForWorkItem,
  getAgentQAGateProfile,
  inferGateStatus,
} from './agent-qa-gate-policy'
import {
  agentFallbackActions,
  createFallbackDecision,
  getFailureScenario,
  getFallbackActionsForFailure,
} from './agent-failure-fallback-matrix'

function unique<T>(items: T[]) {
  return Array.from(new Set(items.filter(Boolean)))
}

function gateSeverity(status: AgentQAGateCheck['status']): AgentQAGateCheck['severity'] {
  if (status === 'blocked' || status === 'fallback_required' || status === 'needs_user_review') return 'blocking'
  if (status === 'failed') return 'error'
  if (status === 'warning') return 'warning'
  return 'info'
}

function createPlanGateChecks(params: {
  plan: EditPlan
  editingAgentExecutionPlan?: EditingAgentExecutionPlan
  asyncAssetReconciliationPlan?: AsyncAssetReconciliationPlan
}): AgentQAGateCheck[] {
  const preflightProfile = getAgentQAGateProfile('preflight_gate')
  const preflightStatus = inferGateStatus({
    gateType: 'preflight_gate',
    plan: params.plan,
    asyncAssetReconciliationPlan: params.asyncAssetReconciliationPlan,
  })
  const renderProfile = getAgentQAGateProfile('render_preflight_gate')
  const renderStatus = inferGateStatus({
    gateType: 'render_preflight_gate',
    plan: params.plan,
    asyncAssetReconciliationPlan: params.asyncAssetReconciliationPlan,
  })
  const finalProfile = getAgentQAGateProfile('final_qa_gate')
  const finalStatus = inferGateStatus({
    gateType: 'final_qa_gate',
    plan: params.plan,
    asyncAssetReconciliationPlan: params.asyncAssetReconciliationPlan,
  })

  return [
    {
      id: 'gate-agent-preflight',
      gateType: 'preflight_gate',
      status: preflightStatus,
      label: preflightProfile.label,
      severity: gateSeverity(preflightStatus),
      message: 'Mock preflight verifies approval gates, source cleanup, trim review, timing validation, tier policy, and snapshot-pending state.',
      recommendation: preflightStatus === 'blocked' ? 'Resolve approval/timing/trim blockers before future execution.' : 'Keep this as a future worker preflight contract.',
      qaChecks: preflightProfile.qaChecks,
    },
    {
      id: 'gate-agent-render-preflight',
      gateType: 'render_preflight_gate',
      status: renderStatus,
      label: renderProfile.label,
      severity: gateSeverity(renderStatus),
      message: params.asyncAssetReconciliationPlan?.finalRenderReadiness.reason ?? 'Final render readiness cannot be evaluated without async reconciliation.',
      recommendation: 'Final render must wait for required assets, QA, timing, trim review, and approved snapshot readiness.',
      qaChecks: renderProfile.qaChecks,
    },
    {
      id: 'gate-agent-final-qa',
      gateType: 'final_qa_gate',
      status: finalStatus,
      label: finalProfile.label,
      severity: gateSeverity(finalStatus),
      message: 'Final QA remains a mock gate that blocks unresolved required failures and user-review decisions.',
      recommendation: finalStatus === 'blocked' ? 'Resolve blocking timing, trim, or fallback decisions before final export.' : 'Future QA must validate output before export.',
      qaChecks: finalProfile.qaChecks,
    },
  ]
}

function relevantWorkItemForCategory(workItems: EditWorkItem[], category: AgentFailureCategory) {
  const preferredTypes =
    category === 'map_render_failure'
      ? ['render_map_asset']
      : category === 'chart_render_failure'
        ? ['render_chart_asset']
        : category === 'browser_capture_failure'
          ? ['capture_browser_asset']
          : category === 'mask_generation_failure'
            ? ['generate_mask_asset']
            : category.includes('audio')
              ? ['run_audio_analysis', 'run_audio_stretch']
              : category.includes('render')
                ? ['render_final_export', 'render_remotion_preview']
                : category.includes('timing')
                  ? ['run_timing_qa', 'prepare_caption_timing', 'prepare_soundsync_timing']
                  : ['generate_ai_video_asset', 'generate_image_asset']

  return workItems.find((item) => preferredTypes.includes(item.workItemType)) ?? workItems[0]
}

function relevantAssetForCategory(assets: EditAssetManifestItem[], category: AgentFailureCategory) {
  const preferredTypes: EditAssetManifestItem['assetType'][] =
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
              : category.includes('provider') || category.includes('prompt') || category.includes('mismatch')
                ? ['ai_video_clip', 'generated_image']
                : ['final_export', 'unknown']

  return assets.find((asset) => preferredTypes.includes(asset.assetType)) ?? assets[0]
}

function inferFailureCategories(params: {
  plan: EditPlan
  editingAgentExecutionPlan?: EditingAgentExecutionPlan
  asyncAssetReconciliationPlan?: AsyncAssetReconciliationPlan
}): AgentFailureCategory[] {
  const workItems = params.editingAgentExecutionPlan?.workItems ?? []
  const assets = params.editingAgentExecutionPlan?.assetManifest ?? []
  const categories: AgentFailureCategory[] = []

  if (workItems.some((item) => item.agentLayer === 'asset_generation_agent')) {
    categories.push('provider_timeout', 'provider_error', 'provider_bad_output', 'prompt_mismatch')
  }

  if (workItems.some((item) => item.workItemType === 'generate_ai_video_asset') || assets.some((asset) => asset.assetType === 'ai_video_clip')) {
    categories.push('duration_mismatch', 'background_mismatch')
  }

  if (assets.some((asset) => asset.assetType === 'generated_image')) categories.push('style_mismatch')
  if (params.plan.characterConsistencyPlan) categories.push('character_mismatch')
  if (assets.some((asset) => asset.assetType === 'map_visual')) categories.push('map_render_failure')
  if (assets.some((asset) => asset.assetType === 'chart_visual')) categories.push('chart_render_failure')
  if (assets.some((asset) => asset.assetType === 'browser_capture')) categories.push('browser_capture_failure')
  if (assets.some((asset) => asset.assetType === 'mask_asset')) categories.push('mask_generation_failure')
  if (assets.some((asset) => asset.assetType === 'audio_asset')) categories.push('audio_analysis_failure', 'audio_processing_failure')
  if (workItems.some((item) => item.agentLayer === 'tool_execution_agent')) categories.push('tool_worker_failure')
  if (params.plan.colorPipelinePlan) categories.push('color_processing_failure')
  if (params.asyncAssetReconciliationPlan?.finalRenderReadiness.missingRequiredAssetIds.length) categories.push('missing_required_asset')
  if (params.asyncAssetReconciliationPlan?.finalRenderReadiness.ready === false) categories.push('render_preflight_failure')
  if (params.plan.timingValidationPlan?.approvalBlocked) categories.push('timing_validation_failure')
  if (params.plan.trimReviewPlan?.approvalBlocked) categories.push('trim_meaning_failure')
  if ((params.plan.trimReviewPlan?.userFacingReviewSummary.length ?? 0) > 0) categories.push('user_review_required')
  if (params.plan.creditEstimate.approvalBlocked) categories.push('credit_limit_or_budget_issue')

  return unique(categories.length ? categories : ['unknown'])
}

function createDecisions(params: {
  plan: EditPlan
  editingAgentExecutionPlan?: EditingAgentExecutionPlan
  asyncAssetReconciliationPlan?: AsyncAssetReconciliationPlan
  failureScenarios: AgentFailureScenario[]
}): AgentFailureFallbackDecision[] {
  const editLevel = params.plan.compiledIntent?.resolvedSettings.editLevel ?? params.plan.creditEstimate.editLevel ?? 'pro'
  const workItems = params.editingAgentExecutionPlan?.workItems ?? []
  const assets = params.editingAgentExecutionPlan?.assetManifest ?? []
  const missingRequiredAssetIds = params.asyncAssetReconciliationPlan?.finalRenderReadiness.missingRequiredAssetIds ?? []

  return params.failureScenarios.map((scenario) => {
    const workItem = relevantWorkItemForCategory(workItems, scenario.category)
    const asset = relevantAssetForCategory(assets, scenario.category)
    const actions = getFallbackActionsForFailure({
      category: scenario.category,
      editLevel,
      assetType: asset?.assetType,
    })

    return createFallbackDecision({
      scenario,
      actions,
      editLevel,
      relatedWorkItemId: workItem?.id,
      relatedAssetManifestItemId: asset?.id,
      assetType: asset?.assetType,
      requiredForFinalRender: Boolean(asset?.id && missingRequiredAssetIds.includes(asset.id)),
    })
  })
}

export function linkAgentQAFallbackToExecutionPlan(params: {
  editingAgentExecutionPlan: EditingAgentExecutionPlan
  agentQAFallbackPlan: AgentQAFallbackPlan
}): EditingAgentExecutionPlan {
  const gateIdsByWorkItem = new Map<string, string[]>()
  const failureIdsByWorkItem = new Map<string, string[]>()
  const decisionIdsByWorkItem = new Map<string, string[]>()
  const gateIdsByAsset = new Map<string, string[]>()
  const failureIdsByAsset = new Map<string, string[]>()
  const decisionIdsByAsset = new Map<string, string[]>()

  params.agentQAFallbackPlan.gateChecks.forEach((gate) => {
    if (gate.relatedWorkItemId) {
      gateIdsByWorkItem.set(gate.relatedWorkItemId, [...(gateIdsByWorkItem.get(gate.relatedWorkItemId) ?? []), gate.id])
    }

    if (gate.relatedAssetManifestItemId) {
      gateIdsByAsset.set(gate.relatedAssetManifestItemId, [...(gateIdsByAsset.get(gate.relatedAssetManifestItemId) ?? []), gate.id])
    }
  })

  params.agentQAFallbackPlan.decisions.forEach((decision) => {
    if (decision.relatedWorkItemId) {
      failureIdsByWorkItem.set(decision.relatedWorkItemId, [...(failureIdsByWorkItem.get(decision.relatedWorkItemId) ?? []), decision.failureScenarioId])
      decisionIdsByWorkItem.set(decision.relatedWorkItemId, [...(decisionIdsByWorkItem.get(decision.relatedWorkItemId) ?? []), decision.id])
    }

    if (decision.relatedAssetManifestItemId) {
      failureIdsByAsset.set(decision.relatedAssetManifestItemId, [...(failureIdsByAsset.get(decision.relatedAssetManifestItemId) ?? []), decision.failureScenarioId])
      decisionIdsByAsset.set(decision.relatedAssetManifestItemId, [...(decisionIdsByAsset.get(decision.relatedAssetManifestItemId) ?? []), decision.id])
    }
  })

  return {
    ...params.editingAgentExecutionPlan,
    agentQAFallbackPlanId: params.agentQAFallbackPlan.id,
    workItems: params.editingAgentExecutionPlan.workItems.map((workItem) => ({
      ...workItem,
      qaGateCheckIds: gateIdsByWorkItem.get(workItem.id),
      failureScenarioIds: failureIdsByWorkItem.get(workItem.id),
      fallbackDecisionIds: decisionIdsByWorkItem.get(workItem.id),
    })),
    assetManifest: params.editingAgentExecutionPlan.assetManifest.map((asset) => ({
      ...asset,
      qaGateCheckIds: gateIdsByAsset.get(asset.id),
      failureScenarioIds: failureIdsByAsset.get(asset.id),
      fallbackDecisionIds: decisionIdsByAsset.get(asset.id),
    })),
  }
}

export function createAgentQAFallbackPlan(params: {
  plan: EditPlan
  editingAgentExecutionPlan?: EditingAgentExecutionPlan
  asyncAssetReconciliationPlan?: AsyncAssetReconciliationPlan
}): AgentQAFallbackPlan {
  const editingAgentExecutionPlan = params.editingAgentExecutionPlan ?? params.plan.editingAgentExecutionPlan
  const asyncAssetReconciliationPlan = params.asyncAssetReconciliationPlan ?? params.plan.asyncAssetReconciliationPlan
  const mergeByAsset = new Map(asyncAssetReconciliationPlan?.mergePlanItems.map((item) => [item.assetManifestItemId, item]) ?? [])
  const planGateChecks = createPlanGateChecks({ ...params, editingAgentExecutionPlan, asyncAssetReconciliationPlan })
  const workItemGateChecks = editingAgentExecutionPlan?.workItems.flatMap((workItem) =>
    createGateChecksForWorkItem({
      workItem,
      plan: params.plan,
      asyncAssetReconciliationPlan,
    })
  ) ?? []
  const assetGateChecks = editingAgentExecutionPlan?.assetManifest.flatMap((asset) =>
    createGateChecksForAsset({
      asset,
      mergePlanItem: mergeByAsset.get(asset.id),
      editingAgentExecutionPlan,
      asyncAssetReconciliationPlan,
    })
  ) ?? []
  const failureScenarios = inferFailureCategories({
    plan: params.plan,
    editingAgentExecutionPlan,
    asyncAssetReconciliationPlan,
  }).map((category) => getFailureScenario(category)).filter(Boolean) as AgentFailureScenario[]
  const decisions = createDecisions({
    plan: params.plan,
    editingAgentExecutionPlan,
    asyncAssetReconciliationPlan,
    failureScenarios,
  })
  const globalFailureCount = failureScenarios.filter((scenario) =>
    scenario.scope === 'global_edit' || scenario.scope === 'final_render' || scenario.scope === 'approval_gate'
  ).length
  const localFailureCount = failureScenarios.length - globalFailureCount
  const userReviewRequiredCount = decisions.filter((decision) => decision.recoveryState === 'needs_user_review' || decision.userReviewQuestion).length
  const finalRenderBlocked = decisions.some((decision) => decision.finalRenderBlocked) ||
    Boolean(asyncAssetReconciliationPlan?.finalRenderReadiness.ready === false && asyncAssetReconciliationPlan.finalRenderReadiness.missingRequiredAssetIds.length > 0)
  const independentWorkCanContinue = decisions.some((decision) => decision.continueIndependentWork) ||
    Boolean(editingAgentExecutionPlan?.parallelGroups.length)

  return {
    id: 'agent-qa-fallback-plan-mock-v1',
    summary: 'Mock Agent QA + Fallback Plan. It defines QA gates, likely failure scenarios, fallback actions, and decisions without running QA, retries, providers, workers, or rendering.',
    gateChecks: [...planGateChecks, ...workItemGateChecks, ...assetGateChecks],
    failureScenarios,
    fallbackActions: agentFallbackActions,
    decisions,
    localFailureCount,
    globalFailureCount,
    userReviewRequiredCount,
    finalRenderBlocked,
    independentWorkCanContinue,
    globalRules: [
      'Every work item should pass QA gates before future execution.',
      'Local optional failures should not stop unrelated independent work.',
      'Global, approval, or required final-render failures block final export.',
      'Basic/Pro cannot fallback to Veo.',
      'Premium can use Veo only as final fallback/rescue for approved AI video assets.',
      'Maps, charts, browser captures, captions, timing, and masks must not fallback to AI video.',
      'Meaning, privacy, source truth, and credit-overrun issues require user review or new approval.',
    ],
    limitations: [
      'Mock QA/fallback plan only.',
      'No real output QA or media inspection runs.',
      'No real provider calls, retries, fallbacks, webhooks, polling, workers, storage, rendering, backend, Supabase, Google Cloud, or billing are implemented.',
      'Future workers will execute only approved fallback policies from approved snapshots.',
    ],
    qaChecks: [
      'Gate checks exist for work items and assets.',
      'Failure scenarios map to approved fallback actions.',
      'Fallback decisions preserve tier/model/tool rules.',
      'Final render remains blocked for unresolved required failures.',
      'Independent work can continue for isolated local failures.',
    ],
    notes: [
      'Fallback actions are planning contracts only; no fallback is executed.',
      'Credit restoration/refund is represented as future policy only.',
    ],
  }
}
