import { buildMultiAgentDryRunReport } from '../activation/multi-agent-dry-run'

const report = buildMultiAgentDryRunReport()
const allowed = report.producerGateResults.filter((item) => item.decision === 'allowed_candidate_plan_only')
const blocked = report.producerGateResults.filter((item) => item.decision === 'blocked')

console.log(JSON.stringify({
  phase: report.phase,
  status: report.status,
  scenarios: report.scenarios.map((scenario) => scenario.scenarioId),
  agentCoverage: report.manifest.agentCoverage,
  allowedIntentTypes: allowed.map((item) => item.intentType),
  blockedIntentTypes: blocked.map((item) => item.intentType),
  qaStatus: report.qa.status,
  phase52DReadiness: report.phase52DReadiness,
  runtimeExecutionUsed: report.manifest.runtimeExecutionUsed,
}, null, 2))
