import { buildCesiumJsLocal3DCommandPlan, runCesiumJsLocal3DFixture } from '../activation/cesiumjs-local-3d-fixture'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildCesiumJsLocal3DCommandPlan(), null, 2))
} else {
  const result = await runCesiumJsLocal3DFixture({ execute: true })
  console.log(JSON.stringify({
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      cesiumEntityCount: result.executionReport.planningData.entityCount,
      screenshotDimensions: result.executionReport.renderMetadata?.screenshotDimensions ?? null,
      externalNetworkRequestsObserved: result.executionReport.externalNetworkRequestsObserved.length,
      phase50FReadiness: result.executionReport.phase50FReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
