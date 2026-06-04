import { buildWebSearchMapPlanningCommandPlan, runWebSearchMapPlanningE2E } from '../activation/web-search-map-planning-e2e'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildWebSearchMapPlanningCommandPlan(), null, 2))
} else {
  const result = await runWebSearchMapPlanningE2E({ execute: true })
  console.log(JSON.stringify({
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      planningSources: result.executionReport.planningSources.length,
      locationCandidates: result.executionReport.locationCandidates.length,
      map2DScreenshotDimensions: result.executionReport.map2D.renderMetadata?.screenshotDimensions ?? null,
      map3DScreenshotDimensions: result.executionReport.map3D.renderMetadata?.screenshotDimensions ?? null,
      phase50GReadiness: result.executionReport.phase50GReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
