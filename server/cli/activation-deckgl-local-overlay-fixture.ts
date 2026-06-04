import { buildDeckGlLocalOverlayCommandPlan, runDeckGlLocalOverlayFixture } from '../activation/deckgl-local-overlay-fixture'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildDeckGlLocalOverlayCommandPlan(), null, 2))
} else {
  const result = await runDeckGlLocalOverlayFixture({ execute: true })
  console.log(JSON.stringify({
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      deckGlLayerCount: result.executionReport.layerManifest.layers.length,
      overlayPointCount: result.executionReport.overlayData.points.length,
      overlayArcCount: result.executionReport.overlayData.arcs.length,
      screenshotDimensions: result.executionReport.renderMetadata?.screenshotDimensions ?? null,
      externalNetworkRequestsObserved: result.executionReport.externalNetworkRequestsObserved.length,
      phase50EReadiness: result.executionReport.phase50EReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
