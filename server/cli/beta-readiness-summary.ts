import { buildBetaReadinessReport } from '../beta-readiness'

const report = buildBetaReadinessReport()
const scopeLine = report.goNoGo.externalBetaAllowed
  ? 'Bounded external beta scorecard is allowed for no-runtime/no-real-user-media scope; real user media beta and paid production remain blocked.'
  : 'Production/external beta remains blocked until human-run deployment, readiness, model/license, security, and cost approvals pass.'

console.log([
  `Beta readiness: ${report.overallStatus}`,
  `Internal dry-run allowed: ${report.goNoGo.internalDryRunTestingAllowed}`,
  `External beta allowed: ${report.goNoGo.externalBetaAllowed}`,
  `Real user media beta allowed: ${report.goNoGo.realUserMediaBetaAllowed}`,
  `Paid production allowed: ${report.goNoGo.paidProductionAllowed}`,
  `Scenarios: ${report.scenarioMatrix.length}`,
  scopeLine,
].join('\n'))
