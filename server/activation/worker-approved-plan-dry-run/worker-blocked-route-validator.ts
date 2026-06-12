import {
  WORKER_APPROVED_PLAN_DRY_RUN_BLOCKED_ROUTES,
} from './worker-approved-plan-dry-run-policy'
import type {
  WorkerDryRunBlockedRouteValidation,
  WorkerDryRunJobBatchPlan,
} from './worker-approved-plan-dry-run-types'

export function validateWorkerDryRunBlockedRoutes(
  jobBatchPlan: WorkerDryRunJobBatchPlan,
): WorkerDryRunBlockedRouteValidation {
  const blockedRoutes = WORKER_APPROVED_PLAN_DRY_RUN_BLOCKED_ROUTES.map((route) => ({
    routeId: route.routeId,
    owner: route.owner,
    executionAllowed: false as const,
    blockedReason: route.blockedReason,
  }))
  const allExecutionBlocked =
    jobBatchPlan.workerExecutionAllowed === false &&
    jobBatchPlan.toolExecutionAllowed === false &&
    jobBatchPlan.providerCallsAllowed === false &&
    jobBatchPlan.routeExecutionAllowed === false &&
    jobBatchPlan.approvedForRuntime === false &&
    jobBatchPlan.jobs.every((job) =>
      job.workerExecutionAllowed === false &&
      job.toolExecutionAllowed === false &&
      job.providerCallsAllowed === false &&
      job.routeExecutionAllowed === false &&
      job.approvedForRuntime === false,
    )
  const activeBlockers = allExecutionBlocked ? [] : ['dry_run_job_plan_allows_execution']

  return {
    phase: 'WORKER_1',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    blockedRoutes,
    allExecutionBlocked,
    activeBlockers,
  }
}
