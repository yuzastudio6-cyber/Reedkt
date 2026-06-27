import { buildBetaReadinessReport } from '../beta-readiness'

const report = buildBetaReadinessReport()

console.log([
  `Beta readiness: ${report.overallStatus}`,
  `Internal dry-run allowed: ${report.goNoGo.internalDryRunTestingAllowed}`,
  `External beta allowed: ${report.goNoGo.externalBetaAllowed}`,
  `Real user media beta allowed: ${report.goNoGo.realUserMediaBetaAllowed}`,
  `Paid production allowed: ${report.goNoGo.paidProductionAllowed}`,
  `Scenarios: ${report.scenarioMatrix.length}`,
  `Tool execution: ${report.toolExecutionReadiness.ownerCoverageToolCount}/${report.toolExecutionReadiness.totalTools} owner-covered, ${report.toolExecutionReadiness.readinessSpecToolCount}/${report.toolExecutionReadiness.totalTools} readiness specs, external beta execution allowed: ${report.toolExecutionReadiness.externalBetaToolExecutionAllowed}`,
  `Tool execution blockers: ${report.toolExecutionReadiness.blockers.length}`,
  'Production/external beta remains blocked until human-run deployment, readiness, model/license, security, and cost approvals pass.',
].join('\n'))
