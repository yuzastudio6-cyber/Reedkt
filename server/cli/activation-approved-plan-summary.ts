import { buildApprovedPlanValidationReport } from '../activation/approved-plan-snapshot-validation'

const report = await buildApprovedPlanValidationReport()
console.log([
  'Approved-plan snapshot validation summary',
  `Phase: ${report.phase}`,
  `Status: ${report.status}`,
  `Candidate plans validated: ${report.candidatePlans.length}`,
  `Blocked/handoff records validated: ${report.blockedPlans.length}`,
  `Validated handoffs: ${report.validatedHandoffs.length}`,
  `Phase52F readiness: ${report.phase52FReadiness}`,
  'Production/external beta/broad media: blocked',
  'Tool/model/provider/worker execution: blocked',
].join('\n'))
