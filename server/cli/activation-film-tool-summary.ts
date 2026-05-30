import { buildFilmSlowmotionApprovalReport } from '../activation/film-slowmotion-approval'

const report = buildFilmSlowmotionApprovalReport()

console.log([
  'FILM tool summary',
  `Track: ${report.track}`,
  `Status: ${report.status}`,
  `Decision: ${report.stagingPlanningDecision}`,
  `Official repo: ${report.modelEvidence.upstreamRepo}`,
  `License: ${report.licenseReview.licenseName}`,
  `Recommended Phase38B artifact: ${report.recommendedPhase38BArtifact.displayName}`,
  `Private future storage: gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/style/`,
  `Phase38B readiness: ${report.phase38BReadiness.ready}`,
  `FILM download allowed now: ${report.filmDownloadAllowed}`,
  `FILM runtime allowed now: ${report.filmRuntimeAllowed}`,
  `Slow motion allowed now: ${report.slowMotionAllowed}`,
].join('\n'))
