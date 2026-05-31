import { buildProColorImageApprovalReport } from '../activation/pro-color-image-approval'

const report = buildProColorImageApprovalReport()

console.log([
  'Pro color/image tool summary',
  `Track: ${report.track}`,
  `Status: ${report.status}`,
  `Decision: ${report.planningDecision}`,
  `Base branch: ${report.baseBranch}`,
  `Phase40B readiness: ${report.phase40BReadiness.ready}`,
  '',
  ...report.toolEvidence.map((tool) => `${tool.displayName}: ${tool.licenseName}; ${tool.recommendedPhase40Role}`),
  '',
  `OpenColorIO planning allowed: ${report.openColorIOPlanningAllowed}`,
  `OpenImageIO planning allowed: ${report.openImageIOPlanningAllowed}`,
  `Kornia planning allowed: ${report.korniaPlanningAllowed}`,
  `Runtime install allowed now: ${report.runtimeInstallAllowed}`,
  `Real-video pro color allowed now: ${report.realVideoProColorAllowed}`,
  `Production ready allowed: ${report.productionReadyAllowed}`,
].join('\n'))
