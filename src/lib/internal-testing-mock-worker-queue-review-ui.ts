export const INTERNAL_TESTING_MOCK_WORKER_QUEUE_REVIEW_UI_DECISION =
  'internal_testing_mock_worker_queue_review_passed_ready_for_worker_claim_dry_run_review'

export type InternalTestingMockWorkerQueueReviewUiCheck = {
  id: string
  label: string
  summary: string
  status: 'ready_for_claim_dry_run_review'
}

export type InternalTestingMockWorkerQueueReviewUiModel = {
  decision: typeof INTERNAL_TESTING_MOCK_WORKER_QUEUE_REVIEW_UI_DECISION
  summary: string
  checks: readonly InternalTestingMockWorkerQueueReviewUiCheck[]
  safety: {
    mockQueueOnly: true
    idempotentReplayRequired: true
    approvedPlanGateRequired: true
    creditReservationGateRequired: true
    workerClaimAllowed: false
    workerDispatchAllowed: false
    toolExecutionAllowed: false
    mediaProcessingAllowed: false
    providerCallsAllowed: false
    creditSpendAllowed: false
    productReady: false
  }
}

const checks = [
  {
    id: 'mock-queue-gates',
    label: 'Mock queue gates',
    summary: 'Queue items pass existing approved-plan and credit-reservation gates before they can be marked queued.',
    status: 'ready_for_claim_dry_run_review' as const,
  },
  {
    id: 'idempotent-replay',
    label: 'Idempotent replay',
    summary: 'Repeating the same payload keys returns existing mock queue items instead of creating duplicate work.',
    status: 'ready_for_claim_dry_run_review' as const,
  },
  {
    id: 'no-claim-boundary',
    label: 'No claim boundary',
    summary: 'The queue review does not claim leases, dispatch workers, run tools, or touch media.',
    status: 'ready_for_claim_dry_run_review' as const,
  },
  {
    id: 'next-gate',
    label: 'Next gate',
    summary: 'After queue review, worker claim dry-run can verify lease behavior without starting real execution.',
    status: 'ready_for_claim_dry_run_review' as const,
  },
] as const satisfies readonly InternalTestingMockWorkerQueueReviewUiCheck[]

export function getInternalTestingMockWorkerQueueReviewUiModel(): InternalTestingMockWorkerQueueReviewUiModel {
  return {
    decision: INTERNAL_TESTING_MOCK_WORKER_QUEUE_REVIEW_UI_DECISION,
    summary: 'Mock worker queue review proves valid payloads can be queued and replayed safely before any worker claim is allowed.',
    checks,
    safety: {
      mockQueueOnly: true,
      idempotentReplayRequired: true,
      approvedPlanGateRequired: true,
      creditReservationGateRequired: true,
      workerClaimAllowed: false,
      workerDispatchAllowed: false,
      toolExecutionAllowed: false,
      mediaProcessingAllowed: false,
      providerCallsAllowed: false,
      creditSpendAllowed: false,
      productReady: false,
    },
  }
}
