export const INTERNAL_TESTING_WORKER_CLAIM_DRY_RUN_UI_DECISION =
  'internal_testing_worker_claim_dry_run_passed_ready_for_mock_worker_execution_harness'

export type InternalTestingWorkerClaimDryRunUiCheck = {
  id: string
  label: string
  summary: string
  status: 'ready_for_mock_execution_harness'
}

export type InternalTestingWorkerClaimDryRunUiModel = {
  decision: typeof INTERNAL_TESTING_WORKER_CLAIM_DRY_RUN_UI_DECISION
  summary: string
  checks: readonly InternalTestingWorkerClaimDryRunUiCheck[]
  safety: {
    mockLeaseOnly: true
    queuedJobsOnly: true
    duplicateClaimsBlocked: true
    leaseCleanupRequired: true
    workerDispatchAllowed: false
    workerExecutionAllowed: false
    toolExecutionAllowed: false
    mediaProcessingAllowed: false
    providerCallsAllowed: false
    creditSpendAllowed: false
    productReady: false
  }
}

const checks = [
  {
    id: 'lease-eligibility',
    label: 'Lease eligibility',
    summary: 'Only queued mock items with approved-plan and credit-reservation evidence can be claimed in the dry run.',
    status: 'ready_for_mock_execution_harness' as const,
  },
  {
    id: 'duplicate-claim-block',
    label: 'Duplicate claim block',
    summary: 'A second active claim for the same queued work is rejected before any worker could start.',
    status: 'ready_for_mock_execution_harness' as const,
  },
  {
    id: 'lease-cleanup',
    label: 'Lease cleanup',
    summary: 'Claimed mock leases are released at the end of the review so the test leaves no active work.',
    status: 'ready_for_mock_execution_harness' as const,
  },
  {
    id: 'next-gate',
    label: 'Next gate',
    summary: 'After claim review, a mock execution harness can verify completion metadata without running real media work.',
    status: 'ready_for_mock_execution_harness' as const,
  },
] as const satisfies readonly InternalTestingWorkerClaimDryRunUiCheck[]

export function getInternalTestingWorkerClaimDryRunUiModel(): InternalTestingWorkerClaimDryRunUiModel {
  return {
    decision: INTERNAL_TESTING_WORKER_CLAIM_DRY_RUN_UI_DECISION,
    summary: 'Worker claim dry-run proves queued work can be leased once, rejects duplicate active claims, and cleans up mock leases before execution is allowed.',
    checks,
    safety: {
      mockLeaseOnly: true,
      queuedJobsOnly: true,
      duplicateClaimsBlocked: true,
      leaseCleanupRequired: true,
      workerDispatchAllowed: false,
      workerExecutionAllowed: false,
      toolExecutionAllowed: false,
      mediaProcessingAllowed: false,
      providerCallsAllowed: false,
      creditSpendAllowed: false,
      productReady: false,
    },
  }
}
