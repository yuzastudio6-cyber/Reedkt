import { buildTrackBAgentRuntimeReadinessReport } from '../beta-readiness/trackb-agent-runtime-readiness'

const report = buildTrackBAgentRuntimeReadinessReport()
console.log(JSON.stringify(report, null, 2))

const requireAgentContracts = process.argv.includes('--require-agent-contracts-ready')
const requirePaymentIndependentRuntime = process.argv.includes('--require-payment-independent-runtime-ready')
const requireLiveExecution = process.argv.includes('--require-live-execution-ready')

if (requireAgentContracts && !report.agentContractsReady) {
  process.exitCode = 1
}

if (requirePaymentIndependentRuntime && !report.paymentIndependentRuntimeReady) {
  process.exitCode = 1
}

if (requireLiveExecution && !report.liveAgentExecutionReady) {
  process.exitCode = 1
}
