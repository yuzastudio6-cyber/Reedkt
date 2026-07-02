import type { EditPlan } from '../types/reeditpro'
import type {
  AsyncAssetReconciliationPlan,
  AsyncCheckbackItem,
  AsyncCheckbackStatus,
  AsyncCheckbackTrigger,
  AssetDependencyReadiness,
  AssetMergePlanItem,
  AssetMergeStatus,
  AssetReconciliationDecision,
  AssetVersionReconciliation,
  DependencyReadinessStatus,
  EditAssetManifestItem,
  EditingAgentExecutionPlan,
  EditWorkDependency,
  EditWorkItem,
} from '../types/editing-agent-runtime'

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function isWaitingWorkItem(workItem: EditWorkItem) {
  return (
    workItem.status === 'waiting_provider' ||
    workItem.status === 'waiting_worker' ||
    workItem.status === 'waiting_asset' ||
    workItem.status === 'waiting_user_review' ||
    workItem.status === 'queued' ||
    workItem.status === 'running' ||
    workItem.status === 'fallback_needed'
  )
}

function triggerForWorkItem(workItem: EditWorkItem): AsyncCheckbackTrigger {
  if (workItem.status === 'waiting_user_review' || workItem.workItemType === 'request_user_review') {
    return 'user_review'
  }

  if (workItem.status === 'fallback_needed' || workItem.workItemType === 'apply_fallback') {
    return 'fallback_event'
  }

  if (workItem.status === 'waiting_provider' || workItem.agentLayer === 'asset_generation_agent') {
    return 'provider_webhook'
  }

  if (workItem.status === 'waiting_worker' || workItem.agentLayer === 'tool_execution_agent' || workItem.agentLayer === 'qa_agent') {
    return 'worker_event'
  }

  if (workItem.status === 'waiting_asset') {
    return 'worker_event'
  }

  return 'scheduled_poll'
}

function checkbackStatusForWorkItem(workItem: EditWorkItem): AsyncCheckbackStatus {
  if (workItem.status === 'waiting_user_review') return 'user_review_required'
  if (workItem.status === 'fallback_needed') return 'fallback_needed'
  if (workItem.status === 'failed' || workItem.status === 'qa_failed') return 'failed'
  if (workItem.status === 'queued' || workItem.status === 'running') return 'checking'
  if (workItem.status === 'ready_to_merge') return 'ready'
  if (workItem.status === 'merged') return 'merged'
  return 'waiting'
}

function firstLinkedAssetId(workItem: EditWorkItem) {
  return workItem.expectedOutputs.find((output) => output.linkedAssetManifestId)?.linkedAssetManifestId
}

function createCheckbackItem(params: {
  workItem: EditWorkItem
  asset?: EditAssetManifestItem
  approvedPlanSnapshotId?: string
}): AsyncCheckbackItem {
  const trigger = triggerForWorkItem(params.workItem)
  const providerRequestId = trigger === 'provider_webhook' ? `planned-provider-request-${slug(params.workItem.id)}` : undefined
  const workerJobId = trigger === 'worker_event' ? `planned-worker-job-${slug(params.workItem.id)}` : undefined

  return {
    id: `checkback-${slug(params.workItem.id)}`,
    workItemId: params.workItem.id,
    assetManifestItemId: params.asset?.id,
    trigger,
    status: checkbackStatusForWorkItem(params.workItem),
    providerRequestId,
    workerJobId,
    idempotencyKey: params.workItem.idempotencyKey,
    approvedPlanSnapshotId: params.approvedPlanSnapshotId ?? params.workItem.approvedPlanSnapshotId,
    nextCheckReason:
      trigger === 'user_review'
        ? 'Wait for the user to resolve the review item before affected work continues.'
        : trigger === 'provider_webhook'
          ? 'Future provider webhook is preferred; status polling is fallback only when provider lacks webhook support.'
          : trigger === 'worker_event'
            ? 'Future worker event updates the work item and asset manifest.'
            : 'Future scheduled checkback verifies whether pending work timed out or needs fallback.',
    timeoutPolicy: 'No real timer runs in this mock. Future workers use provider/tool-specific timeout policy and then trigger fallback or review.',
    retryPolicy: params.workItem.maxRetries > 0
      ? `Retry up to ${params.workItem.maxRetries} time(s) using the same idempotency key and approved snapshot.`
      : 'No retry planned; request fallback or review if this work cannot complete.',
    fallbackPolicy: params.workItem.fallbackPolicy,
    expectedOutputIds: params.workItem.expectedOutputs.map((output) => output.id),
    qaChecks: params.workItem.qaChecks,
    notes: [
      'Checkback is mock metadata only; no webhook, polling, provider request, or worker event is created.',
      ...(params.workItem.checkbackPolicy ?? []),
    ],
  }
}

function readinessStatusForDependency(
  dependency: EditWorkDependency,
  workItemById: Map<string, EditWorkItem>,
  assetById: Map<string, EditAssetManifestItem>,
): DependencyReadinessStatus {
  if (dependency.dependencyType === 'user_review_required') return 'waiting_for_user_review'
  if (dependency.dependencyType === 'qa_after') return 'waiting_for_qa'

  const linkedAsset = dependency.dependsOnAssetId ? assetById.get(dependency.dependsOnAssetId) : undefined
  if (linkedAsset) {
    if (linkedAsset.lifecycleStatus === 'merged' || linkedAsset.qaStatus === 'passed') return 'complete'
    if (linkedAsset.lifecycleStatus === 'ready' || linkedAsset.lifecycleStatus === 'qa_pending') return 'waiting_for_qa'
    if (linkedAsset.lifecycleStatus === 'failed' || linkedAsset.qaStatus === 'failed') return 'blocked_by_policy'
    return 'waiting_for_asset'
  }

  const linkedWorkItem = dependency.dependsOnWorkItemId ? workItemById.get(dependency.dependsOnWorkItemId) : undefined
  if (linkedWorkItem) {
    if (linkedWorkItem.status === 'complete' || linkedWorkItem.status === 'merged' || linkedWorkItem.status === 'qa_passed') return 'complete'
    if (linkedWorkItem.status === 'waiting_provider') return 'waiting_for_provider'
    if (linkedWorkItem.status === 'waiting_worker') return 'waiting_for_worker'
    if (linkedWorkItem.status === 'waiting_asset') return 'waiting_for_asset'
    if (linkedWorkItem.status === 'waiting_user_review') return 'waiting_for_user_review'
    if (linkedWorkItem.status === 'blocked' || linkedWorkItem.status === 'failed' || linkedWorkItem.status === 'fallback_needed') return 'blocked_by_policy'
  }

  if (dependency.dependencyType === 'can_use_placeholder' || dependency.dependencyType === 'optional_asset') {
    return 'ready_now'
  }

  return dependency.blocking ? 'blocked_by_policy' : 'ready_now'
}

function createDependencyReadiness(params: {
  workItems: EditWorkItem[]
  assetManifest: EditAssetManifestItem[]
}) {
  const workItemById = new Map(params.workItems.map((workItem) => [workItem.id, workItem]))
  const assetById = new Map(params.assetManifest.map((asset) => [asset.id, asset]))

  return params.workItems.flatMap((workItem) =>
    workItem.dependencies.map((dependency) => {
      const required = dependency.blocking || dependency.dependencyType === 'required_asset' || dependency.dependencyType === 'blocks_finish' || dependency.dependencyType === 'qa_after'
      const placeholderAllowed = dependency.dependencyType === 'can_use_placeholder'

      return {
        id: `readiness-${slug(workItem.id)}-${slug(dependency.id)}`,
        dependencyId: dependency.id,
        dependencyType: dependency.dependencyType,
        status: readinessStatusForDependency(dependency, workItemById, assetById),
        required,
        placeholderAllowed,
        blocksFinalRender: required && !placeholderAllowed,
        blocksPreviewRender: required && !placeholderAllowed && dependency.dependencyType !== 'required_asset',
        reason: dependency.reason,
        fallbackIfMissing: dependency.fallbackIfMissing,
        linkedWorkItemId: dependency.dependsOnWorkItemId,
        linkedAssetManifestItemId: dependency.dependsOnAssetId,
        qaChecks: workItem.qaChecks,
      } satisfies AssetDependencyReadiness
    }),
  )
}

function mergeStatusForAsset(asset: EditAssetManifestItem): AssetMergeStatus {
  if (asset.lifecycleStatus === 'failed' || asset.qaStatus === 'failed') return 'fallback_required'
  if (asset.qaStatus === 'blocked') return 'user_review_required'
  if (asset.lifecycleStatus === 'merged' || asset.qaStatus === 'passed') return 'merged'
  if (asset.lifecycleStatus === 'ready') return 'ready_to_merge'
  if (asset.lifecycleStatus === 'qa_pending') return 'qa_pending'
  if (asset.lifecycleStatus === 'fallback_requested') return 'fallback_required'
  return 'not_ready'
}

function reconciliationDecisionForAsset(asset: EditAssetManifestItem, status: AssetMergeStatus): AssetReconciliationDecision {
  if (status === 'fallback_required') return 'request_fallback'
  if (status === 'user_review_required') return 'request_user_review'

  if (asset.assetType === 'audio_asset') return 'update_timing'
  if (asset.assetType === 'mask_asset') return 'rerender_required'
  if (asset.assetType === 'final_export') return 'no_action'

  if (asset.linkedRendererLayerIds.length > 0) {
    return asset.lifecycleStatus === 'ready' ? 'replace_placeholder' : 'attach_to_layer'
  }

  return 'no_action'
}

function createMergePlanItem(asset: EditAssetManifestItem): AssetMergePlanItem {
  const status = mergeStatusForAsset(asset)
  const decision = reconciliationDecisionForAsset(asset, status)
  const fallbackRequired = status === 'fallback_required'
  const userReviewRequired = status === 'user_review_required'

  return {
    id: `merge-${slug(asset.id)}`,
    assetManifestItemId: asset.id,
    workItemId: asset.parentWorkItemId,
    status,
    reconciliationDecision: decision,
    targetSegmentIds: asset.linkedSegmentIds,
    targetVisualAssetPlanItemIds: asset.linkedVisualAssetPlanItemIds,
    targetTimingCueIds: asset.linkedTimingCueIds,
    targetRendererLayerIds: asset.linkedRendererLayerIds,
    replacePlaceholder: decision === 'replace_placeholder',
    updateTimingRequired: decision === 'update_timing' || asset.assetType === 'ai_video_clip',
    rerenderRequired: decision === 'rerender_required' || asset.assetType === 'ai_video_clip' || asset.linkedRendererLayerIds.length > 0,
    qaRequired: asset.qaStatus !== 'passed',
    fallbackRequired,
    userReviewRequired,
    reason:
      status === 'not_ready'
        ? 'Asset is still mock-planned and cannot merge until a future worker marks it ready.'
        : status === 'merged'
          ? 'Asset has a merged/passed status and can be treated as selected for downstream planning.'
          : fallbackRequired
            ? 'Asset failed or requested fallback; downstream work must wait for approved fallback or review.'
            : userReviewRequired
              ? 'Asset status requires user review before reconciliation.'
              : 'Asset can be reconciled into its linked segment, timing cue, and renderer layer after QA.',
    qaChecks: asset.qaNotes.length ? asset.qaNotes : ['Asset must pass QA before final render.'],
    notes: [
      'Merge plan is mock-only; no asset storage or renderer layer mutation is performed.',
      ...(asset.notes ?? []),
    ],
  }
}

function createVersionReconciliation(asset: EditAssetManifestItem): AssetVersionReconciliation {
  return {
    id: `version-${slug(asset.id)}`,
    assetManifestItemId: asset.id,
    activeVersion: asset.version,
    previousVersionIds: asset.replacesAssetId ? [asset.replacesAssetId] : [],
    fallbackVersionIds: asset.fallbackForAssetId ? [asset.fallbackForAssetId] : [],
    replacedAssetIds: asset.replacesAssetId ? [asset.replacesAssetId] : [],
    selectedForFinalRender: asset.lifecycleStatus === 'merged' || asset.qaStatus === 'passed',
    reason:
      asset.lifecycleStatus === 'merged' || asset.qaStatus === 'passed'
        ? 'Asset version is selected for final-render planning.'
        : 'Asset version is tracked but not selected for final render until ready, QA-checked, and merged.',
    qaChecks: ['Only one active asset version should be selected for each required final renderer layer.'],
  }
}

function assetsById(assets: EditAssetManifestItem[]) {
  return new Map(assets.map((asset) => [asset.id, asset]))
}

function computeReadiness(params: {
  plan: EditPlan
  editingAgentExecutionPlan: EditingAgentExecutionPlan
  dependencyReadiness: AssetDependencyReadiness[]
  mergePlanItems: AssetMergePlanItem[]
  approvedPlanSnapshotId?: string
}) {
  const assetById = assetsById(params.editingAgentExecutionPlan.assetManifest)
  const requiredAssetIds = unique(params.dependencyReadiness
    .filter((item) => item.blocksFinalRender && item.linkedAssetManifestItemId)
    .map((item) => item.linkedAssetManifestItemId ?? ''))
  const mergedAssetIds = new Set(params.mergePlanItems.filter((item) => item.status === 'merged').map((item) => item.assetManifestItemId))
  const missingRequiredAssetIds = requiredAssetIds.filter((assetId) => !mergedAssetIds.has(assetId))
  const placeholderAssetIds = unique(params.dependencyReadiness
    .filter((item) => item.placeholderAllowed && item.linkedAssetManifestItemId)
    .map((item) => item.linkedAssetManifestItemId ?? ''))
  const qaPendingAssetIds = requiredAssetIds.filter((assetId) => {
    const asset = assetById.get(assetId)
    return !asset || asset.qaStatus === 'not_checked' || asset.qaStatus === 'warning' || asset.lifecycleStatus === 'qa_pending'
  })
  const blockingWorkItemIds = unique([
    ...params.editingAgentExecutionPlan.blockingWorkItemIds,
    ...params.dependencyReadiness
      .filter((item) => item.blocksFinalRender && item.status !== 'complete' && item.status !== 'ready_now')
      .map((item) => item.linkedWorkItemId ?? ''),
  ])
  const timingBlocked = Boolean(params.plan.timingValidationPlan?.approvalBlocked || params.plan.timingValidationPlan?.overallStatus === 'blocking' || params.plan.timingValidationPlan?.overallStatus === 'failed')
  const trimBlocked = Boolean(params.plan.trimReviewPlan?.approvalBlocked)
  const snapshotReady = Boolean(params.approvedPlanSnapshotId)
  const finalReady = snapshotReady && !timingBlocked && !trimBlocked && missingRequiredAssetIds.length === 0 && blockingWorkItemIds.length === 0 && qaPendingAssetIds.length === 0 && placeholderAssetIds.length === 0
  const previewReady = Boolean(params.plan.rendererCompositionPlan) && !trimBlocked && (
    params.dependencyReadiness.some((item) => item.placeholderAllowed) ||
    missingRequiredAssetIds.length === 0
  )

  return {
    finalRenderReadiness: {
      ready: finalReady,
      missingRequiredAssetIds,
      blockingWorkItemIds,
      placeholderAssetIds,
      qaPendingAssetIds,
      reason: finalReady
        ? 'Final render is mock-ready because required assets are merged, QA is clear, and an approved snapshot is available.'
        : [
            !snapshotReady ? 'Approved snapshot ID is pending.' : '',
            timingBlocked ? 'Timing validation blocks final render.' : '',
            trimBlocked ? 'Trim review blocks final render.' : '',
            missingRequiredAssetIds.length ? `${missingRequiredAssetIds.length} required asset(s) are not merged.` : '',
            placeholderAssetIds.length ? 'Final render cannot use placeholder assets.' : '',
            qaPendingAssetIds.length ? `${qaPendingAssetIds.length} required asset(s) still need QA.` : '',
            blockingWorkItemIds.length ? `${blockingWorkItemIds.length} blocking work item(s) remain.` : '',
          ].filter(Boolean).join(' '),
    },
    previewRenderReadiness: {
      ready: previewReady,
      placeholderAssetIds,
      missingOptionalAssetIds: params.dependencyReadiness
        .filter((item) => !item.required && item.linkedAssetManifestItemId && item.status !== 'complete' && item.status !== 'ready_now')
        .map((item) => item.linkedAssetManifestItemId ?? ''),
      reason: previewReady
        ? 'Preview can be planned with explicit placeholders where dependencies allow them; this is not final rendering.'
        : 'Preview is not ready because renderer planning or blocking review state is unresolved.',
    },
  }
}

function createCheckpoints(params: {
  checkbackItems: AsyncCheckbackItem[]
  dependencyReadiness: AssetDependencyReadiness[]
  mergePlanItems: AssetMergePlanItem[]
}) {
  const readyToMergeAssetIds = params.mergePlanItems.filter((item) => item.status === 'ready_to_merge').map((item) => item.assetManifestItemId)
  const mergedAssetIds = params.mergePlanItems.filter((item) => item.status === 'merged').map((item) => item.assetManifestItemId)
  const blockedAssetIds = params.mergePlanItems.filter((item) => item.status === 'blocked' || item.status === 'fallback_required' || item.status === 'user_review_required').map((item) => item.assetManifestItemId)
  const waitingWorkItemIds = unique(params.checkbackItems.map((item) => item.workItemId))
  const unblockedWorkItemIds = unique(params.dependencyReadiness.filter((item) => item.status === 'ready_now' || item.status === 'complete').map((item) => item.linkedWorkItemId ?? ''))

  return [
    {
      id: 'async-checkpoint-pending-generation-checkback',
      label: 'Pending generation checkback',
      readyToMergeAssetIds: [],
      mergedAssetIds,
      blockedAssetIds,
      waitingWorkItemIds,
      unblockedWorkItemIds,
      nextCheckbackIds: params.checkbackItems.map((item) => item.id).slice(0, 8),
      nextActions: ['Wait for future provider webhook, worker event, or user review.', 'Continue independent planning work where dependencies allow.'],
      notes: ['No real webhook, polling, or worker event is scheduled in this mock.'],
    },
    {
      id: 'async-checkpoint-ready-asset-merge',
      label: 'Ready asset merge',
      readyToMergeAssetIds,
      mergedAssetIds,
      blockedAssetIds,
      waitingWorkItemIds,
      unblockedWorkItemIds,
      nextCheckbackIds: [],
      nextActions: ['Attach ready assets to visual plan, timing cue, and renderer layer after QA.'],
      notes: ['Ready assets are mock statuses only; no asset file exists.'],
    },
    {
      id: 'async-checkpoint-fallback-review',
      label: 'Fallback review',
      readyToMergeAssetIds,
      mergedAssetIds,
      blockedAssetIds,
      waitingWorkItemIds,
      unblockedWorkItemIds,
      nextCheckbackIds: params.checkbackItems.filter((item) => item.status === 'fallback_needed' || item.status === 'failed').map((item) => item.id),
      nextActions: ['Use approved fallback only.', 'Request user review if fallback changes route, cost, timing, or meaning.'],
      notes: ['Basic/Pro cannot use Veo; Premium can use Veo only as approved final fallback.'],
    },
    {
      id: 'async-checkpoint-preview-readiness',
      label: 'Preview readiness',
      readyToMergeAssetIds,
      mergedAssetIds,
      blockedAssetIds,
      waitingWorkItemIds,
      unblockedWorkItemIds,
      nextCheckbackIds: [],
      nextActions: ['Use placeholders only when explicitly allowed.', 'Do not present preview placeholders as final render output.'],
      notes: ['Browser-safe preview is not production rendering.'],
    },
    {
      id: 'async-checkpoint-final-render-readiness',
      label: 'Final render readiness',
      readyToMergeAssetIds,
      mergedAssetIds,
      blockedAssetIds,
      waitingWorkItemIds,
      unblockedWorkItemIds,
      nextCheckbackIds: [],
      nextActions: ['Wait for required assets, QA, approved snapshot, and final renderer readiness.'],
      notes: ['Final render cannot use placeholders for required assets.'],
    },
  ]
}

function attachPlanLinks(params: {
  plan: AsyncAssetReconciliationPlan
  editingAgentExecutionPlan: EditingAgentExecutionPlan
}): AsyncAssetReconciliationPlan {
  const checkbacksByWorkItem = new Map<string, string[]>()
  params.plan.checkbackItems.forEach((item) => {
    checkbacksByWorkItem.set(item.workItemId, [...(checkbacksByWorkItem.get(item.workItemId) ?? []), item.id])
  })

  const readinessByWorkItem = new Map<string, string[]>()
  params.editingAgentExecutionPlan.workItems.forEach((workItem) => {
    const dependencyIds = new Set(workItem.dependencies.map((dependency) => dependency.id))
    const readinessIds = params.plan.dependencyReadiness
      .filter((item) => dependencyIds.has(item.dependencyId))
      .map((item) => item.id)

    if (readinessIds.length) {
      readinessByWorkItem.set(workItem.id, readinessIds)
    }
  })

  return {
    ...params.plan,
    notes: [
      ...params.plan.notes,
      `Link target: ${params.editingAgentExecutionPlan.id}.`,
      `${checkbacksByWorkItem.size} work item(s) have checkback links available for final plan hydration.`,
      `${readinessByWorkItem.size} dependency source work item(s) have readiness links available for final plan hydration.`,
    ],
  }
}

export function linkAsyncReconciliationToExecutionPlan(params: {
  editingAgentExecutionPlan: EditingAgentExecutionPlan
  asyncAssetReconciliationPlan: AsyncAssetReconciliationPlan
}): EditingAgentExecutionPlan {
  const checkbacksByWorkItem = new Map<string, string[]>()
  params.asyncAssetReconciliationPlan.checkbackItems.forEach((item) => {
    checkbacksByWorkItem.set(item.workItemId, [...(checkbacksByWorkItem.get(item.workItemId) ?? []), item.id])
  })

  const readinessByWorkItem = new Map<string, string[]>()
  params.editingAgentExecutionPlan.workItems.forEach((workItem) => {
    const dependencyIds = new Set(workItem.dependencies.map((dependency) => dependency.id))
    const readinessIds = params.asyncAssetReconciliationPlan.dependencyReadiness
      .filter((item) => dependencyIds.has(item.dependencyId))
      .map((item) => item.id)

    if (readinessIds.length) {
      readinessByWorkItem.set(workItem.id, readinessIds)
    }
  })

  const mergeByAsset = new Map(params.asyncAssetReconciliationPlan.mergePlanItems.map((item) => [item.assetManifestItemId, item.id]))
  const versionByAsset = new Map(params.asyncAssetReconciliationPlan.versionReconciliations.map((item) => [item.assetManifestItemId, item.id]))

  return {
    ...params.editingAgentExecutionPlan,
    asyncAssetReconciliationPlanId: params.asyncAssetReconciliationPlan.id,
    workItems: params.editingAgentExecutionPlan.workItems.map((workItem) => ({
      ...workItem,
      asyncCheckbackItemIds: checkbacksByWorkItem.get(workItem.id),
      dependencyReadinessIds: readinessByWorkItem.get(workItem.id),
    })),
    assetManifest: params.editingAgentExecutionPlan.assetManifest.map((asset) => ({
      ...asset,
      mergePlanItemId: mergeByAsset.get(asset.id),
      versionReconciliationId: versionByAsset.get(asset.id),
    })),
  }
}

export function createAsyncAssetReconciliationPlan(params: {
  plan: EditPlan
  editingAgentExecutionPlan?: EditingAgentExecutionPlan
  approvedPlanSnapshotId?: string
}): AsyncAssetReconciliationPlan {
  const editingAgentExecutionPlan = params.editingAgentExecutionPlan ?? params.plan.editingAgentExecutionPlan
  const workItems = editingAgentExecutionPlan?.workItems ?? []
  const assetManifest = editingAgentExecutionPlan?.assetManifest ?? []
  const assetById = assetsById(assetManifest)
  const checkbackItems = workItems
    .filter(isWaitingWorkItem)
    .map((workItem) => createCheckbackItem({
      workItem,
      asset: firstLinkedAssetId(workItem) ? assetById.get(firstLinkedAssetId(workItem) ?? '') : undefined,
      approvedPlanSnapshotId: params.approvedPlanSnapshotId,
    }))
  const dependencyReadiness = createDependencyReadiness({ workItems, assetManifest })
  const mergePlanItems = assetManifest.map(createMergePlanItem)
  const versionReconciliations = assetManifest.map(createVersionReconciliation)
  const readiness = editingAgentExecutionPlan
    ? computeReadiness({
        plan: params.plan,
        editingAgentExecutionPlan,
        dependencyReadiness,
        mergePlanItems,
        approvedPlanSnapshotId: params.approvedPlanSnapshotId,
      })
    : {
        finalRenderReadiness: {
          ready: false,
          missingRequiredAssetIds: [],
          blockingWorkItemIds: [],
          placeholderAssetIds: [],
          qaPendingAssetIds: [],
          reason: 'EditingAgentExecutionPlan is missing, so final render readiness cannot be evaluated.',
        },
        previewRenderReadiness: {
          ready: false,
          placeholderAssetIds: [],
          missingOptionalAssetIds: [],
          reason: 'EditingAgentExecutionPlan is missing, so preview readiness cannot be evaluated.',
        },
      }
  const plan: AsyncAssetReconciliationPlan = {
    id: 'async-asset-reconciliation-plan-mock-v1',
    summary: 'Mock async checkback and asset reconciliation plan. It tracks waiting work, dependency readiness, merge/version policy, preview placeholders, and final render readiness without running providers or workers.',
    checkbackItems,
    dependencyReadiness,
    mergePlanItems,
    versionReconciliations,
    checkpoints: createCheckpoints({ checkbackItems, dependencyReadiness, mergePlanItems }),
    finalRenderReadiness: readiness.finalRenderReadiness,
    previewRenderReadiness: readiness.previewRenderReadiness,
    globalRules: [
      'Async jobs are not done when a provider or worker returns; assets must be stored, manifested, linked, QA-checked, and reconciled.',
      'Checkbacks use work item IDs, idempotency keys, approved snapshot IDs, and expected output IDs.',
      'Preview placeholders are allowed only for dependencies that explicitly permit placeholders.',
      'Final render cannot use placeholders for required assets.',
      'Basic/Pro cannot use Veo fallback; Premium can use Veo only as approved final fallback for AI video assets.',
      'Workers execute approved snapshots, not raw chat.',
    ],
    limitations: [
      'Mock-only reconciliation.',
      'No real provider webhook, polling, status check, or worker event runs.',
      'No real assets are stored or inspected.',
      'No Remotion render, backend queue, Supabase, Google Cloud, provider API, or media processing is implemented.',
      'Future backend/webhook/worker events are required for production checkback and merge.',
    ],
    qaChecks: [
      'Every waiting work item should have a checkback item.',
      'Every dependency should have readiness state.',
      'Every asset manifest item should have merge and version reconciliation.',
      'Final render must wait for required assets and QA.',
      'Preview placeholders must not be treated as final assets.',
    ],
    notes: [
      'This plan models future behavior after async work items wait or complete.',
      'Approved snapshot ID remains pending in frontend mock plans until the user approves.',
    ],
  }

  return editingAgentExecutionPlan ? attachPlanLinks({ plan, editingAgentExecutionPlan }) : plan
}
