import type {
  WorkerDryRunClaimLeaseResult,
  WorkerDryRunEventLogEntry,
  WorkerDryRunEventLogPlan,
  WorkerDryRunJobBatchPlan,
} from './worker-approved-plan-dry-run-types'

export function buildWorkerDryRunEventLogPlan(input: {
  jobBatchPlan: WorkerDryRunJobBatchPlan
  claimLeaseResult: WorkerDryRunClaimLeaseResult
}): WorkerDryRunEventLogPlan {
  const extraEvents: WorkerDryRunEventLogEntry[] = [
    {
      eventId: `${input.jobBatchPlan.batchId}-claim-lease-simulated`,
      eventType: 'dry_run_claim_lease_simulated',
      message: `Claim/lease simulated only; real blocker ${input.claimLeaseResult.blockerForRealRuntime}.`,
      persistToDatabase: false,
      dryRunOnly: true,
    },
    {
      eventId: `${input.jobBatchPlan.batchId}-blocked-routes-validated`,
      eventType: 'dry_run_blocked_routes_validated',
      message: 'Blocked route/tool/provider/runtime execution validation planned without execution.',
      persistToDatabase: false,
      dryRunOnly: true,
    },
    {
      eventId: `${input.jobBatchPlan.batchId}-complete`,
      eventType: 'dry_run_complete',
      message: 'Worker approved-plan snapshot dry-run evidence completed locally/private only.',
      persistToDatabase: false,
      dryRunOnly: true,
    },
  ]
  const eventLogPlan = [...input.jobBatchPlan.eventLogPlan, ...extraEvents]
  const activeBlockers = eventLogPlan.every((event) => event.persistToDatabase === false && event.dryRunOnly)
    ? []
    : ['event_log_plan_would_persist_to_database']

  return {
    phase: 'WORKER_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    batchId: input.jobBatchPlan.batchId,
    eventLogPlan,
    agentRunPlan: input.jobBatchPlan.agentRunPlan,
    persistToDatabase: false,
    activeBlockers,
  }
}
