import type {
  AgentQAGateCheck,
  AgentQAGateStatus,
  AgentQAGateType,
  AssetMergePlanItem,
  AsyncAssetReconciliationPlan,
  EditAssetManifestItem,
  EditingAgentExecutionPlan,
  EditWorkItem,
} from '../types/editing-agent-runtime'
import type { EditPlan } from '../types/reeditpro'

type GateProfile = {
  gateType: AgentQAGateType
  label: string
  purpose: string
  inputs: string[]
  passConditions: string[]
  warningConditions: string[]
  blockingConditions: string[]
  relatedAgentLayer: string
  qaChecks: string[]
}

export const agentQAGateProfiles: Record<AgentQAGateType, GateProfile> = {
  preflight_gate: {
    gateType: 'preflight_gate',
    label: 'Preflight gate',
    purpose: 'Confirm plan, approval, timing, source cleanup, tier, and snapshot readiness before future execution.',
    inputs: ['EditPlan', 'approved snapshot state', 'timing validation', 'trim review', 'tier policy'],
    passConditions: ['Required planning layers exist.', 'Blocking approval gates are resolved or explicitly pending in mock.'],
    warningConditions: ['Approved snapshot ID is pending in mock planning.'],
    blockingConditions: ['Frame, cleanup, timing, trim, or model policy blocks approval.'],
    relatedAgentLayer: 'editing_supervisor_agent',
    qaChecks: ['Approved snapshot or pending mock note exists.', 'Tier/model rules are preserved.', 'No raw chat execution.'],
  },
  work_item_start_gate: {
    gateType: 'work_item_start_gate',
    label: 'Work item start gate',
    purpose: 'Confirm a work item has dependencies, idempotency, expected outputs, and approved snapshot linkage before it can start.',
    inputs: ['EditWorkItem', 'dependencies', 'expected outputs'],
    passConditions: ['Idempotency key exists.', 'Expected outputs are declared.', 'Dependencies are structured.'],
    warningConditions: ['Work item is planned but waiting on future snapshot ID.'],
    blockingConditions: ['Missing idempotency key or no expected outputs.'],
    relatedAgentLayer: 'editing_supervisor_agent',
    qaChecks: ['Idempotency key is present.', 'Expected outputs are present.', 'Dependency policy is explicit.'],
  },
  provider_request_gate: {
    gateType: 'provider_request_gate',
    label: 'Provider request gate',
    purpose: 'Confirm provider requests obey model, tier, prompt, frame, background, and timing rules.',
    inputs: ['provider prompt plan', 'provider model', 'tier policy', 'frame/timing policy'],
    passConditions: ['Provider model is allowed for tier.', 'Prompt plan is structured.', 'Output background/timing rules are attached.'],
    warningConditions: ['Prompt remains draft because approval or dependency is pending.'],
    blockingConditions: ['Basic/Pro Veo route, primary/default Veo, missing prompt, or blocked timing/frame gate.'],
    relatedAgentLayer: 'asset_generation_agent',
    qaChecks: ['Basic/Pro no Veo.', 'Premium Veo final fallback only.', 'No default 1080P.', 'Matching background policy.'],
  },
  asset_received_gate: {
    gateType: 'asset_received_gate',
    label: 'Asset received gate',
    purpose: 'Confirm returned assets belong to the expected work item and manifest entry.',
    inputs: ['asset manifest item', 'work item', 'expected output'],
    passConditions: ['Manifest entry exists.', 'Parent work item exists.', 'Version is tracked.'],
    warningConditions: ['Storage path is mock/pending.'],
    blockingConditions: ['Missing manifest, parent work item, version, or expected output match.'],
    relatedAgentLayer: 'asset_generation_agent',
    qaChecks: ['Manifest entry is present.', 'Asset lineage is tracked.', 'No real storage implied.'],
  },
  asset_quality_gate: {
    gateType: 'asset_quality_gate',
    label: 'Asset quality gate',
    purpose: 'Confirm prompt adherence, style, character, color, timing, background, safe zone, and fact-safety expectations.',
    inputs: ['asset manifest item', 'QA notes', 'visual/timing/color/fact-safety plans'],
    passConditions: ['QA status passed or asset is not required for final output yet.'],
    warningConditions: ['QA is not checked in mock planning.'],
    blockingConditions: ['QA failed or required asset is blocked.'],
    relatedAgentLayer: 'qa_agent',
    qaChecks: ['Prompt adherence.', 'Timing duration match.', 'Frame safe zone.', 'Fact/character/color policy.'],
  },
  merge_gate: {
    gateType: 'merge_gate',
    label: 'Merge gate',
    purpose: 'Confirm an asset can link into the correct segment, timing cue, renderer layer, and active version slot.',
    inputs: ['asset merge plan item', 'dependency readiness', 'version reconciliation'],
    passConditions: ['Asset is merged or ready to merge with target links.'],
    warningConditions: ['Asset is not ready but has fallback/review policy.'],
    blockingConditions: ['Required target link is missing, fallback required, or user review required.'],
    relatedAgentLayer: 'editing_supervisor_agent',
    qaChecks: ['Segment/timing/layer links exist.', 'No conflicting active version.', 'Fallback state is explicit.'],
  },
  render_preflight_gate: {
    gateType: 'render_preflight_gate',
    label: 'Render preflight gate',
    purpose: 'Confirm preview/final render readiness follows dependency, placeholder, timing, trim, and QA rules.',
    inputs: ['renderer plan', 'async reconciliation readiness', 'timing validation', 'trim review'],
    passConditions: ['Final render readiness is true or blocked reasons are explicit in mock.'],
    warningConditions: ['Preview may use explicit placeholders.'],
    blockingConditions: ['Missing required asset, required placeholder, QA pending, or unresolved timing/trim block.'],
    relatedAgentLayer: 'renderer_agent',
    qaChecks: ['Final render waits for required assets.', 'Preview placeholders are preview-only.', 'Timing and trim gates resolved.'],
  },
  final_qa_gate: {
    gateType: 'final_qa_gate',
    label: 'Final QA gate',
    purpose: 'Confirm final output cannot proceed with unresolved required failures, user review, or blocked fallback.',
    inputs: ['EditQAPlan', 'fallback decisions', 'renderer readiness'],
    passConditions: ['No unresolved required failures remain.'],
    warningConditions: ['Local optional failures can continue with approved fallback.'],
    blockingConditions: ['Global or final-render failure unresolved.'],
    relatedAgentLayer: 'qa_agent',
    qaChecks: ['No unresolved required failure.', 'No user review pending.', 'No blocked fallback path.'],
  },
  custom: {
    gateType: 'custom',
    label: 'Custom gate',
    purpose: 'Custom future QA gate for approved worker-specific behavior.',
    inputs: ['custom'],
    passConditions: ['Custom policy is explicit.'],
    warningConditions: ['Custom policy is mock-only.'],
    blockingConditions: ['Custom policy blocks downstream work.'],
    relatedAgentLayer: 'editing_supervisor_agent',
    qaChecks: ['Custom gate is explicit and mock-only.'],
  },
}

export function getAgentQAGateProfile(gateType: AgentQAGateType) {
  return agentQAGateProfiles[gateType]
}

export function inferGateStatus(params: {
  gateType: AgentQAGateType
  plan?: EditPlan
  workItem?: EditWorkItem
  asset?: EditAssetManifestItem
  mergePlanItem?: AssetMergePlanItem
  asyncAssetReconciliationPlan?: AsyncAssetReconciliationPlan
}): AgentQAGateStatus {
  if (params.gateType === 'preflight_gate') {
    if (params.plan?.timingValidationPlan?.approvalBlocked || params.plan?.trimReviewPlan?.approvalBlocked) return 'blocked'
    if (!params.plan?.editingAgentExecutionPlan || !params.plan.asyncAssetReconciliationPlan) return 'warning'
    return 'passed'
  }

  if (params.gateType === 'work_item_start_gate') {
    if (!params.workItem?.idempotencyKey || !params.workItem.expectedOutputs.length) return 'blocked'
    if (!params.workItem.approvedPlanSnapshotId && params.workItem.notes.some((note) => /pending/i.test(note))) return 'warning'
    return 'passed'
  }

  if (params.gateType === 'provider_request_gate') {
    const hasVeo = params.workItem?.linkedProviderPromptPlanIds.some((id) => /veo/i.test(id))
    if (params.plan?.compiledIntent?.resolvedSettings.editLevel !== 'premium' && hasVeo) return 'blocked'
    return params.workItem?.status === 'blocked' ? 'blocked' : 'warning'
  }

  if (params.gateType === 'asset_received_gate') {
    if (!params.asset?.parentWorkItemId || params.asset.version < 1) return 'blocked'
    if (!params.asset.storagePath) return 'warning'
    return 'passed'
  }

  if (params.gateType === 'asset_quality_gate') {
    if (params.asset?.qaStatus === 'failed' || params.asset?.qaStatus === 'blocked') return 'failed'
    if (params.asset?.qaStatus === 'passed') return 'passed'
    return 'warning'
  }

  if (params.gateType === 'merge_gate') {
    if (params.mergePlanItem?.fallbackRequired) return 'fallback_required'
    if (params.mergePlanItem?.userReviewRequired) return 'needs_user_review'
    if (params.mergePlanItem?.status === 'merged') return 'passed'
    return 'warning'
  }

  if (params.gateType === 'render_preflight_gate') {
    return params.asyncAssetReconciliationPlan?.finalRenderReadiness.ready ? 'passed' : 'blocked'
  }

  if (params.gateType === 'final_qa_gate') {
    if (params.plan?.timingValidationPlan?.approvalBlocked || params.plan?.trimReviewPlan?.approvalBlocked) return 'blocked'
    return 'warning'
  }

  return 'not_checked'
}

export function createGateChecksForWorkItem(params: {
  workItem: EditWorkItem
  plan: EditPlan
  asyncAssetReconciliationPlan?: AsyncAssetReconciliationPlan
}): AgentQAGateCheck[] {
  const checks: AgentQAGateCheck[] = []
  const startProfile = getAgentQAGateProfile('work_item_start_gate')
  const startStatus = inferGateStatus({
    gateType: 'work_item_start_gate',
    plan: params.plan,
    workItem: params.workItem,
    asyncAssetReconciliationPlan: params.asyncAssetReconciliationPlan,
  })

  checks.push({
    id: `gate-${params.workItem.id}-start`,
    gateType: 'work_item_start_gate',
    status: startStatus,
    label: startProfile.label,
    severity: startStatus === 'blocked' ? 'blocking' : startStatus === 'warning' ? 'warning' : 'info',
    relatedWorkItemId: params.workItem.id,
    relatedSegmentId: params.workItem.linkedSegmentIds[0],
    relatedRendererLayerId: params.workItem.linkedRendererLayerIds[0],
    message: `${params.workItem.label} has ${params.workItem.dependencies.length} dependency item(s), ${params.workItem.expectedOutputs.length} expected output(s), and idempotency ${params.workItem.idempotencyKey || 'missing'}.`,
    recommendation: startStatus === 'blocked' ? 'Do not start this work item until idempotency and expected outputs are present.' : 'Future execution can evaluate this gate before work starts.',
    qaChecks: startProfile.qaChecks,
  })

  if (params.workItem.agentLayer === 'asset_generation_agent') {
    const providerProfile = getAgentQAGateProfile('provider_request_gate')
    const providerStatus = inferGateStatus({
      gateType: 'provider_request_gate',
      plan: params.plan,
      workItem: params.workItem,
      asyncAssetReconciliationPlan: params.asyncAssetReconciliationPlan,
    })

    checks.push({
      id: `gate-${params.workItem.id}-provider-request`,
      gateType: 'provider_request_gate',
      status: providerStatus,
      label: providerProfile.label,
      severity: providerStatus === 'blocked' ? 'blocking' : 'warning',
      relatedWorkItemId: params.workItem.id,
      relatedSegmentId: params.workItem.linkedSegmentIds[0],
      relatedRendererLayerId: params.workItem.linkedRendererLayerIds[0],
      message: 'Provider request remains a mock plan and must obey tier, prompt, frame, background, and timing rules before future execution.',
      recommendation: providerStatus === 'blocked' ? 'Keep provider prompt draft/blocked until tier and policy issues are resolved.' : 'Keep provider prompt attached to approved snapshot and fallback policy.',
      qaChecks: providerProfile.qaChecks,
    })
  }

  return checks
}

export function createGateChecksForAsset(params: {
  asset: EditAssetManifestItem
  mergePlanItem?: AssetMergePlanItem
  editingAgentExecutionPlan?: EditingAgentExecutionPlan
  asyncAssetReconciliationPlan?: AsyncAssetReconciliationPlan
}): AgentQAGateCheck[] {
  const receivedProfile = getAgentQAGateProfile('asset_received_gate')
  const qualityProfile = getAgentQAGateProfile('asset_quality_gate')
  const receivedStatus = inferGateStatus({ gateType: 'asset_received_gate', asset: params.asset })
  const qualityStatus = inferGateStatus({ gateType: 'asset_quality_gate', asset: params.asset })
  const checks: AgentQAGateCheck[] = [
    {
      id: `gate-${params.asset.id}-received`,
      gateType: 'asset_received_gate',
      status: receivedStatus,
      label: receivedProfile.label,
      severity: receivedStatus === 'blocked' ? 'blocking' : receivedStatus === 'warning' ? 'warning' : 'info',
      relatedWorkItemId: params.asset.parentWorkItemId,
      relatedAssetManifestItemId: params.asset.id,
      relatedSegmentId: params.asset.linkedSegmentIds[0],
      relatedRendererLayerId: params.asset.linkedRendererLayerIds[0],
      message: `${params.asset.label} is tracked as ${params.asset.assetType.replaceAll('_', ' ')} version ${params.asset.version}.`,
      recommendation: receivedStatus === 'warning' ? 'Future worker must attach storage path before final merge.' : 'Keep asset lineage attached to the manifest.',
      qaChecks: receivedProfile.qaChecks,
    },
    {
      id: `gate-${params.asset.id}-quality`,
      gateType: 'asset_quality_gate',
      status: qualityStatus,
      label: qualityProfile.label,
      severity: qualityStatus === 'failed' ? 'error' : qualityStatus === 'warning' ? 'warning' : 'info',
      relatedWorkItemId: params.asset.parentWorkItemId,
      relatedAssetManifestItemId: params.asset.id,
      relatedSegmentId: params.asset.linkedSegmentIds[0],
      relatedRendererLayerId: params.asset.linkedRendererLayerIds[0],
      message: `Asset QA status is ${params.asset.qaStatus.replaceAll('_', ' ')}; no real media inspection has run.`,
      recommendation: qualityStatus === 'failed' ? 'Use fallback or user review before merge.' : 'Future QA must inspect prompt adherence, style, timing, background, and safety before final merge.',
      qaChecks: qualityProfile.qaChecks,
    },
  ]

  if (params.mergePlanItem) {
    const mergeProfile = getAgentQAGateProfile('merge_gate')
    const mergeStatus = inferGateStatus({
      gateType: 'merge_gate',
      asset: params.asset,
      mergePlanItem: params.mergePlanItem,
      asyncAssetReconciliationPlan: params.asyncAssetReconciliationPlan,
    })

    checks.push({
      id: `gate-${params.asset.id}-merge`,
      gateType: 'merge_gate',
      status: mergeStatus,
      label: mergeProfile.label,
      severity: mergeStatus === 'fallback_required' || mergeStatus === 'needs_user_review' ? 'blocking' : mergeStatus === 'warning' ? 'warning' : 'info',
      relatedWorkItemId: params.mergePlanItem.workItemId,
      relatedAssetManifestItemId: params.asset.id,
      relatedSegmentId: params.mergePlanItem.targetSegmentIds[0],
      relatedRendererLayerId: params.mergePlanItem.targetRendererLayerIds[0],
      message: `Merge decision is ${params.mergePlanItem.reconciliationDecision.replaceAll('_', ' ')} with status ${params.mergePlanItem.status.replaceAll('_', ' ')}.`,
      recommendation: params.mergePlanItem.fallbackRequired ? 'Request approved fallback before downstream final render.' : 'Merge only after target segment, timing, renderer layer, QA, and active version are reconciled.',
      qaChecks: mergeProfile.qaChecks,
    })
  }

  return checks
}
