import {
  writeWorkerApprovedPlanDryRunReport,
} from '../activation/worker-approved-plan-dry-run'

const bundle = await writeWorkerApprovedPlanDryRunReport()
console.log(JSON.stringify(bundle.report, null, 2))
