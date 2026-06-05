import { buildAgentToolPlanBridgeReport, summarizeAgentToolPlanBridgeReport } from '../activation/agent-tool-plan-bridge'

console.log(summarizeAgentToolPlanBridgeReport(await buildAgentToolPlanBridgeReport()))
