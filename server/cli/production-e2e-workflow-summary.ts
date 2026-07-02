import { productionWorkflowScenarios, runProductionWorkflowScenario } from '../e2e/production-workflow'

const modeArg = process.argv.find((arg) => arg.startsWith('--mode='))
const mode = modeArg?.split('=')[1] ?? 'dry_run'
if (!['dry_run', 'static_validation'].includes(mode)) {
  throw new Error('prod:e2e:summary supports dry_run or static_validation by default. Local media execution is intentionally not enabled from this CLI.')
}

const reports = []
for (const scenario of productionWorkflowScenarios) {
  reports.push(await runProductionWorkflowScenario({ scenario, mode: mode as 'dry_run' | 'static_validation' }))
}

const blocked = reports.filter((report) => report.status === 'blocked').length
const warning = reports.filter((report) => report.status === 'warning').length
const passed = reports.filter((report) => report.status === 'passed').length

console.log([
  `Production E2E workflow summary`,
  `Mode: ${mode}`,
  `Scenarios: ${reports.length}`,
  `Passed: ${passed}`,
  `Warning: ${warning}`,
  `Blocked: ${blocked}`,
  '',
  'Scenario reports:',
  ...reports.map((report) => `- ${report.scenarioId}: status=${report.status}, stages=${report.stageResults.length}, artifacts=${report.artifactSummary.totalArtifacts}, qa=${report.qaSummary.total}, productionReadyAllowed=${report.productionReadyAllowed}, finalDeliveryAllowed=${report.finalDeliveryAllowed}`),
  '',
  'Safety:',
  '- no providers',
  '- no gcloud',
  '- no model downloads',
  '- no arbitrary user media',
  '- no Revideo production path',
].join('\n'))
