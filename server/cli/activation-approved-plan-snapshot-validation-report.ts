import { buildApprovedPlanValidationReport, summarizeApprovedPlanValidationReport } from '../activation/approved-plan-snapshot-validation'

console.log(summarizeApprovedPlanValidationReport(await buildApprovedPlanValidationReport()))
