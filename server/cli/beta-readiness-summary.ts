import { buildBetaReadinessReport } from '../beta-readiness'

const report = buildBetaReadinessReport()

console.log([
  `Beta readiness: ${report.overallStatus}`,
  `Internal dry-run allowed: ${report.goNoGo.internalDryRunTestingAllowed}`,
  `Internal break/fix testing allowed: ${report.internalTestingMode.allowed}`,
  `Internal sign-in testing allowed: ${report.internalTestingMode.signInTestingAllowed}`,
  `Internal paid users required: ${report.internalTestingMode.paidUsersRequired}`,
  `Internal mock/test credits only: ${report.internalTestingMode.mockOrTestCreditsOnly}`,
  `External beta allowed: ${report.goNoGo.externalBetaAllowed}`,
  `Real user media beta allowed: ${report.goNoGo.realUserMediaBetaAllowed}`,
  `Paid production allowed: ${report.goNoGo.paidProductionAllowed}`,
  `Scenarios: ${report.scenarioMatrix.length}`,
  `Tool execution: ${report.toolExecutionReadiness.ownerCoverageToolCount}/${report.toolExecutionReadiness.totalTools} owner-covered, ${report.toolExecutionReadiness.readinessSpecToolCount}/${report.toolExecutionReadiness.totalTools} readiness specs, external beta execution allowed: ${report.toolExecutionReadiness.externalBetaToolExecutionAllowed}`,
  `Tool execution blockers: ${report.toolExecutionReadiness.blockers.length}`,
  `Tool execution platform blockers: ${report.toolExecutionReadiness.platformBlockers.length}`,
  'Internal testing may continue with mock/test credits while production/external beta remains blocked until human-run deployment, readiness, model/license, security, and cost approvals pass.',
].join('\n'))
