import {
  buildSam2ModelApprovalReport,
  sam2ModelApprovalCommandPlans,
} from '../activation/sam2-model-approval'

const report = buildSam2ModelApprovalReport()

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({
    phase: report.phase,
    approvalDecision: report.approvalDecision,
    phase35BReadiness: report.phase35BReadiness,
    commandPlans: sam2ModelApprovalCommandPlans,
    sam2DownloadAllowed: report.sam2DownloadAllowed,
    sam2RuntimeAllowed: report.sam2RuntimeAllowed,
    sam2TemporalTrackingAllowed: report.sam2TemporalTrackingAllowed,
  }, null, 2))
} else {
  console.log([
    'Phase 35A SAM2 model approval plan',
    `Approval decision: ${report.approvalDecision}`,
    `Phase 35B ready: ${report.phase35BReadiness.ready}`,
    `Command plans: ${sam2ModelApprovalCommandPlans.length} (text-only, blocked)`,
    `SAM2 download allowed: ${report.sam2DownloadAllowed}`,
    `SAM2 runtime allowed: ${report.sam2RuntimeAllowed}`,
    `SAM2 temporal tracking allowed: ${report.sam2TemporalTrackingAllowed}`,
    '',
    'Future command plans:',
    ...sam2ModelApprovalCommandPlans.map((plan) => `- ${plan.commandId}: ${plan.commandText}`),
  ].join('\n'))
}
