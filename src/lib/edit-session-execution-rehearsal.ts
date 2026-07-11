import type {
  ApprovedPlanSnapshot,
} from '../types/edit-planning-db'
import type {
  EditAssetManifestItem,
  EditingAgentExecutionPlan,
  EditWorkItem,
} from '../types/editing-agent-runtime'
import type {
  GenerationReadinessState,
  MockPreviewJob,
} from '../types'
import {
  completeMockPreviewJob,
  createMockPreviewJob,
} from './generation'

export interface EditSessionExecutionRehearsal {
  id: string
  status: 'ready_for_mock_preview_review' | 'blocked_missing_execution_plan'
  approvedPlanSnapshotId: string
  editPlanVersionId: string
  creditEstimateId: string
  sourceClipCount: number
  segmentCount: number
  operationCount: number
  plannedWorkItemCount: number
  readyWorkItemCount: number
  waitingWorkItemCount: number
  blockedWorkItemCount: number
  assetManifestCount: number
  qaGateCount: number
  finalRenderBlocked: boolean
  finalRenderBlockReason: string
  executionPlan?: EditingAgentExecutionPlan
  previewJob?: MockPreviewJob
  previewSteps: string[]
  userFacingSummary: string
  noRuntimeSideEffects: string[]
}

export function createEditSessionExecutionRehearsal(input: {
  approvedSnapshot: ApprovedPlanSnapshot
  existingPreviewJob?: MockPreviewJob | null
}): EditSessionExecutionRehearsal {
  const { approvedSnapshot } = input
  const executionPlan = approvedSnapshot.editingAgentExecutionPlan

  if (!executionPlan) {
    return {
      id: `edit-rehearsal-${approvedSnapshot.id}`,
      status: 'blocked_missing_execution_plan',
      approvedPlanSnapshotId: approvedSnapshot.id,
      editPlanVersionId: approvedSnapshot.editPlanVersionId,
      creditEstimateId: approvedSnapshot.creditEstimateId,
      sourceClipCount: approvedSnapshot.sourceSequence.length,
      segmentCount: approvedSnapshot.segments.length,
      operationCount: approvedSnapshot.operations.length,
      plannedWorkItemCount: 0,
      readyWorkItemCount: 0,
      waitingWorkItemCount: 0,
      blockedWorkItemCount: 1,
      assetManifestCount: 0,
      qaGateCount: 0,
      finalRenderBlocked: true,
      finalRenderBlockReason: 'Approved snapshot is missing an editing agent execution plan.',
      previewSteps: [],
      userFacingSummary: 'The approved plan is missing its execution graph, so preview preparation cannot start.',
      noRuntimeSideEffects: noRuntimeSideEffects(),
    }
  }

  const boundExecutionPlan = bindExecutionPlanToApprovedSnapshot({
    approvedSnapshotId: approvedSnapshot.id,
    executionPlan,
  })
  const previewJob = input.existingPreviewJob ?? completeMockPreviewJob(createMockPreviewJob({
    approvalId: `approval-${approvedSnapshot.id}`,
    creditEstimateId: approvedSnapshot.creditEstimateId,
    planningContextId: approvedSnapshot.compiledIntent?.id,
    professionalIntegrationPlanId: approvedSnapshot.editPlanVersionId,
    projectId: approvedSnapshot.projectId,
    qaReportId: approvedSnapshot.qaPlan?.id,
  }))
  const readyWorkItems = boundExecutionPlan.workItems.filter((item) => item.status === 'ready' || item.status === 'complete')
  const waitingWorkItems = boundExecutionPlan.workItems.filter((item) =>
    item.status === 'waiting_provider' ||
    item.status === 'waiting_worker' ||
    item.status === 'waiting_asset' ||
    item.status === 'waiting_user_review' ||
    item.status === 'planned' ||
    item.status === 'queued' ||
    item.status === 'running'
  )
  const blockedWorkItems = boundExecutionPlan.workItems.filter((item) => item.status === 'blocked' || item.status === 'qa_failed' || item.status === 'failed')
  const finalRenderReadiness = approvedSnapshot.asyncAssetReconciliationPlan?.finalRenderReadiness
  const finalRenderBlocked = approvedSnapshot.agentQAFallbackPlan?.finalRenderBlocked === true || finalRenderReadiness?.ready === false

  return {
    id: `edit-rehearsal-${approvedSnapshot.id}`,
    status: 'ready_for_mock_preview_review',
    approvedPlanSnapshotId: approvedSnapshot.id,
    editPlanVersionId: approvedSnapshot.editPlanVersionId,
    creditEstimateId: approvedSnapshot.creditEstimateId,
    sourceClipCount: approvedSnapshot.sourceSequence.length,
    segmentCount: approvedSnapshot.segments.length,
    operationCount: approvedSnapshot.operations.length,
    plannedWorkItemCount: boundExecutionPlan.workItems.length,
    readyWorkItemCount: readyWorkItems.length,
    waitingWorkItemCount: waitingWorkItems.length,
    blockedWorkItemCount: blockedWorkItems.length,
    assetManifestCount: boundExecutionPlan.assetManifest.length,
    qaGateCount: approvedSnapshot.agentQAFallbackPlan?.gateChecks.length ?? 0,
      finalRenderBlocked,
    finalRenderBlockReason: finalRenderReadiness?.reason ?? 'Final export waits for required asset, QA, and delivery evidence.',
    executionPlan: boundExecutionPlan,
    previewJob,
    previewSteps: previewJob.steps.map((step) => step.label),
    userFacingSummary: [
      'The approved edit has a source sequence, frozen plan, credit estimate, execution graph, asset manifest, QA gates, and a private review handoff.',
      finalRenderBlocked
        ? 'Final export still waits for backend execution and QA evidence; this is safe internal private review readiness.'
        : 'The architecture rehearsal is ready for private review.',
    ].join(' '),
    noRuntimeSideEffects: noRuntimeSideEffects(),
  }
}

export function bindExecutionPlanToApprovedSnapshot(input: {
  approvedSnapshotId: string
  executionPlan: EditingAgentExecutionPlan
}): EditingAgentExecutionPlan {
  const workItems = input.executionPlan.workItems.map((workItem) => bindWorkItemToSnapshot(workItem, input.approvedSnapshotId))
  const assetManifest = input.executionPlan.assetManifest.map((asset) => bindAssetToSnapshot(asset, input.approvedSnapshotId))

  return {
    ...input.executionPlan,
    approvedPlanSnapshotId: input.approvedSnapshotId,
    workItems,
    assetManifest,
    blockingWorkItemIds: workItems.filter((item) => item.status === 'blocked').map((item) => item.id),
    readyWorkItemIds: workItems.filter((item) => item.status === 'ready').map((item) => item.id),
    waitingWorkItemIds: workItems.filter((item) =>
      item.status === 'waiting_provider' ||
      item.status === 'waiting_worker' ||
      item.status === 'waiting_asset' ||
      item.status === 'waiting_user_review'
    ).map((item) => item.id),
    notes: [
      `Execution rehearsal is bound to approved snapshot ${input.approvedSnapshotId}.`,
      ...input.executionPlan.notes.filter((note) => !/snapshot id is pending|approved snapshot id is pending/i.test(note)),
    ],
  }
}

export function summarizeGenerationReadinessForApprovedRehearsal(input: {
  rehearsal: EditSessionExecutionRehearsal
  previousState?: GenerationReadinessState | null
}): GenerationReadinessState | null {
  const previous = input.previousState
  if (!previous || !input.rehearsal.previewJob) return previous ?? null

  return {
    ...previous,
    status: input.rehearsal.status === 'ready_for_mock_preview_review' ? 'preview_ready' : 'blocked',
    previewJob: input.rehearsal.previewJob,
    canPreviewProceed: input.rehearsal.status === 'ready_for_mock_preview_review',
    summary: input.rehearsal.userFacingSummary,
    nextRecommendedActions: input.rehearsal.status === 'ready_for_mock_preview_review'
      ? ['Review private result', 'Open Edit Map', 'Request revision if needed']
      : ['Resolve execution graph blocker'],
    updatedAt: input.rehearsal.previewJob.updatedAt,
  }
}

function bindWorkItemToSnapshot(workItem: EditWorkItem, approvedSnapshotId: string): EditWorkItem {
  const status = workItem.id === 'work-validate-approved-snapshot' && workItem.status === 'blocked'
    ? 'ready'
    : workItem.status

  return {
    ...workItem,
    approvedPlanSnapshotId: approvedSnapshotId,
    status,
    notes: [
      `Bound to approved snapshot ${approvedSnapshotId}; workers must execute this snapshot, not raw chat.`,
      ...workItem.notes.filter((note) => !/approved snapshot.*pending|snapshot id is pending/i.test(note)),
    ],
  }
}

function bindAssetToSnapshot(asset: EditAssetManifestItem, approvedSnapshotId: string): EditAssetManifestItem {
  return {
    ...asset,
    metadata: {
      ...asset.metadata,
      approvedPlanSnapshotId: approvedSnapshotId,
    },
    notes: [
      `Asset lineage is attached to approved snapshot ${approvedSnapshotId}.`,
      ...asset.notes,
    ],
  }
}

function noRuntimeSideEffects(): string[] {
  return [
    'No media bytes were uploaded or processed by this rehearsal.',
    'No provider, model, tool, FFmpeg, GPU, Docker, Supabase, GCS, billing, render, or export execution ran.',
    'Real execution remains gated by approved snapshot, credit reservation, idempotency, backend readiness, storage, and QA.',
  ]
}
