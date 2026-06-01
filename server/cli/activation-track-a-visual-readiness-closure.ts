import { buildTrackAVisualReadinessClosureCommandPlans, runTrackAVisualReadinessClosure } from '../activation/track-a-visual-readiness-closure'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log('Phase 45F Track A visual-video readiness closure is static/report-only by default. Pass --execute with REEDITPRO_CONFIRM_TRACK_A_VISUAL_READINESS_CLOSURE=true to upload one private JSON readiness closure package.')
  console.log(JSON.stringify(buildTrackAVisualReadinessClosureCommandPlans(), null, 2))
} else {
  const result = await runTrackAVisualReadinessClosure({ execute })
  console.log(JSON.stringify({
    evidence: result.evidence,
    executionReport: result.executionReport,
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
  }, null, 2))
}
