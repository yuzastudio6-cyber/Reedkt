import { buildAgentToolPlanBridgeReport } from '../activation/agent-tool-plan-bridge'

const report = await buildAgentToolPlanBridgeReport()
console.log([
  'Agent-to-tool plan bridge summary',
  `Phase: ${report.phase}`,
  `Status: ${report.status}`,
  `Candidate plans: ${report.candidatePlans.length}`,
  `Blocked/handoff records: ${report.blockedPlans.length}`,
  `Handoff packets: ${report.handoffPackets.length}`,
  `Phase52E readiness: ${report.phase52EReadiness}`,
  `Production/external beta/broad media: blocked`,
  `Tool/model/provider/worker execution: blocked`,
].join('\n'))
