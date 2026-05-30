import {
  buildFilmSlowmotionApprovalReport,
  filmSlowmotionCommandPlans,
} from '../activation/film-slowmotion-approval'

const report = buildFilmSlowmotionApprovalReport()

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({
    phase: report.phase,
    track: report.track,
    stagingPlanningDecision: report.stagingPlanningDecision,
    phase38BReadiness: report.phase38BReadiness,
    commandPlans: filmSlowmotionCommandPlans,
    filmDownloadAllowed: report.filmDownloadAllowed,
    filmRuntimeAllowed: report.filmRuntimeAllowed,
    slowMotionAllowed: report.slowMotionAllowed,
  }, null, 2))
} else {
  console.log([
    'Phase 38A FILM slow-motion approval plan',
    `Track: ${report.track}`,
    `Codex decision: ${report.stagingPlanningDecision}`,
    `Phase 38B ready: ${report.phase38BReadiness.ready}`,
    `Recommended Phase38B artifact: ${report.recommendedPhase38BArtifact.modelPath}`,
    `Command plans: ${filmSlowmotionCommandPlans.length} (text-only, blocked in Phase 38A)`,
    `FILM download allowed: ${report.filmDownloadAllowed}`,
    `FILM runtime allowed: ${report.filmRuntimeAllowed}`,
    `Slow motion allowed: ${report.slowMotionAllowed}`,
    '',
    'Future command plans:',
    ...filmSlowmotionCommandPlans.map((plan) => `- ${plan.commandId}: ${plan.commandText}`),
  ].join('\n'))
}
