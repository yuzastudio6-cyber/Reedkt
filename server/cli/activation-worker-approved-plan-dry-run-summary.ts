import {
  readWorkerApprovedPlanDryRunSummary,
} from '../activation/worker-approved-plan-dry-run'

console.log(JSON.stringify(readWorkerApprovedPlanDryRunSummary(), null, 2))
