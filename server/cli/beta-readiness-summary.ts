import { buildBetaReadinessReport } from '../beta-readiness'

const report = buildBetaReadinessReport()

console.log([
  `Beta readiness: ${report.overallStatus}`,
  `Internal dry-run allowed: ${report.goNoGo.internalDryRunTestingAllowed}`,
  `External beta allowed: ${report.goNoGo.externalBetaAllowed}`,
  `Real user media beta allowed: ${report.goNoGo.realUserMediaBetaAllowed}`,
  `Paid production allowed: ${report.goNoGo.paidProductionAllowed}`,
  `Scenarios: ${report.scenarioMatrix.length}`,
  'External beta and production graduate only when the evidence-driven deployment, readiness, model/license, security, storage, billing, observability, legal, and cost gates pass.',
].join('\n'))
