import { buildMapLibreLocalRenderCommandPlan, runMapLibreLocalRenderFixture } from '../activation/maplibre-local-render-fixture'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildMapLibreLocalRenderCommandPlan(), null, 2))
} else {
  const result = await runMapLibreLocalRenderFixture({ execute: true })
  console.log(JSON.stringify({
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      sourceCount: Object.keys(result.executionReport.style.sources).length,
      layerCount: result.executionReport.style.layers.length,
      screenshotDimensions: result.executionReport.renderMetadata?.screenshotDimensions ?? null,
      externalNetworkRequestsObserved: result.executionReport.externalNetworkRequestsObserved.length,
      phase50DReadiness: result.executionReport.phase50DReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
