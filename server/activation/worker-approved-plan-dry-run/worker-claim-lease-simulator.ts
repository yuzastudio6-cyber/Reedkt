import type {
  WorkerDryRunClaimLeaseResult,
  WorkerDryRunJobBatchPlan,
} from './worker-approved-plan-dry-run-types'

export function simulateWorkerClaimLease(
  jobBatchPlan: WorkerDryRunJobBatchPlan,
): WorkerDryRunClaimLeaseResult {
  const activeBlockers: string[] = []
  if (!jobBatchPlan.dryRunOnly) activeBlockers.push('job_batch_not_dry_run_only')
  if (jobBatchPlan.workerExecutionAllowed) activeBlockers.push('job_batch_allows_worker_execution')

  return {
    phase: 'WORKER_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    claimAttempted: false,
    simulatedClaim: true,
    leaseDurationRecommendation: '15 minutes',
    heartbeatRecommendation: '60 seconds',
    requeuePolicy: 'Requeue only in future runtime after transactional claim/RPC support and retry budget approval.',
    staleLeasePolicy: 'Mark stale leases in future runtime after heartbeat enforcement is implemented; WORKER-1 records JSON only.',
    workerIdentityRequirement: 'Future workers must use service-owned worker identity tied to approved plan snapshot and idempotency key.',
    serviceAccountRequirement: 'Future runtime requires approved service-role backend or service account; no credential payload is accessed in WORKER-1.',
    transactionalRpcRequired: true,
    blockerForRealRuntime: 'blocked_until_future_transactional_backend_runtime',
    activeBlockers,
  }
}
