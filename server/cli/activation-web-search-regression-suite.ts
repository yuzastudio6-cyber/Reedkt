import { buildWebSearchRegressionCommandPlan, runWebSearchRegressionSuite } from '../activation/web-search-regression-suite'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildWebSearchRegressionCommandPlan(), null, 2))
} else {
  const result = await runWebSearchRegressionSuite({ execute: true })
  console.log(JSON.stringify({
    localReportPath: result.localReportPath,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      scenarioCount: result.executionReport.matrix.scenarioCount,
      passedCount: result.executionReport.matrix.passedCount,
      failedCount: result.executionReport.matrix.failedCount,
      phase49nEvidence: result.executionReport.phase49nEvidence.status,
      phase49PReadiness: result.executionReport.phase49PReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
