import { buildMapLibreTurfFixtureCommandPlan, runMapLibreTurfFixture } from '../activation/maplibre-turf-fixture'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildMapLibreTurfFixtureCommandPlan(), null, 2))
} else {
  const result = await runMapLibreTurfFixture({ execute: true })
  console.log(JSON.stringify({
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      generatedPoints: result.executionReport.fixture.points.features.length,
      generatedRoutes: result.executionReport.fixture.routes.features.length,
      generatedPolygons: result.executionReport.fixture.polygons.features.length,
      turfCalculations: result.executionReport.turfCalculations.records.length,
      mapLibreLayers: result.executionReport.mapLibreManifest.layers.length,
      phase50CReadiness: result.executionReport.phase50CReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
