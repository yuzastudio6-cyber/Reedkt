import type {
  CandidateApprovedPlanSnapshot,
  OwnerReviewHandoff,
  OwnerRouteEntry,
  WorkerRuntimeHandoff,
} from './provider-output-plan-snapshot-types'

export function buildWorkerRuntimeHandoff(
  snapshot: CandidateApprovedPlanSnapshot,
  validationPassed: boolean,
): WorkerRuntimeHandoff {
  return {
    phase: 'PLAN_SNAPSHOT_1',
    status: validationPassed ? 'ready_for_worker_runtime_repo_audit' : 'blocked',
    runtimeReady: false,
    approvedForRuntime: false,
    nextOwner: 'WORKER_RUNTIME_JOBS',
    allowedAction: 'review_candidate_contract_only',
    blockedUntil: [
      'Worker Runtime owner reviews candidate schema and execution blockers.',
      'Approved plan snapshot persistence contract is implemented in a later backend phase.',
      'Credit reservation, worker dispatch, provider/tool execution, rendering, and media handling remain separately approved future work.',
    ],
    sourceSnapshotPlanId: snapshot.planId,
    executionAllowed: false,
  }
}

export function buildOwnerReviewHandoff(
  ownerRoutes: OwnerRouteEntry[],
  validationPassed: boolean,
): OwnerReviewHandoff {
  return {
    phase: 'PLAN_SNAPSHOT_1',
    status: validationPassed ? 'owner_review_required' : 'blocked',
    runtimeReady: false,
    ownerRoutes,
    executionAllowed: false,
  }
}
