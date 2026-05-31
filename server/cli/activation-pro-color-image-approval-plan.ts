import {
  buildProColorImageApprovalReport,
  proColorImageCommandPlans,
} from '../activation/pro-color-image-approval'

const report = buildProColorImageApprovalReport()

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({
    phase: report.phase,
    track: report.track,
    planningDecision: report.planningDecision,
    baseBranch: report.baseBranch,
    preferredBaseUnavailable: report.preferredBaseUnavailable,
    phase40BReadiness: report.phase40BReadiness,
    commandPlans: proColorImageCommandPlans,
    runtimeInstallAllowed: report.runtimeInstallAllowed,
    proColorImageRuntimeAllowed: report.proColorImageRuntimeAllowed,
    realVideoProColorAllowed: report.realVideoProColorAllowed,
  }, null, 2))
} else {
  console.log([
    'Phase 40A pro color/image approval plan',
    `Track: ${report.track}`,
    `Codex decision: ${report.planningDecision}`,
    `Base branch: ${report.baseBranch}`,
    `Preferred Phase 38E base unavailable: ${report.preferredBaseUnavailable}`,
    `Phase 40B ready: ${report.phase40BReadiness.ready}`,
    `Tools: ${report.toolEvidence.map((tool) => tool.displayName).join(', ')}`,
    `Command plans: ${proColorImageCommandPlans.length} (text-only, blocked in Phase 40A)`,
    `Runtime install allowed: ${report.runtimeInstallAllowed}`,
    `Pro color/image runtime allowed: ${report.proColorImageRuntimeAllowed}`,
    `Real-video pro color allowed: ${report.realVideoProColorAllowed}`,
    '',
    'Future command plans:',
    ...proColorImageCommandPlans.map((plan) => `- ${plan.commandId}: ${plan.commandText}`),
  ].join('\n'))
}
