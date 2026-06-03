import { buildBraveFixtureCommandPlan, runBraveSearchFixtureNormalizer } from '../activation/brave-search-fixture-normalizer'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildBraveFixtureCommandPlan(), null, 2))
} else {
  const result = await runBraveSearchFixtureNormalizer({ execute: true })
  console.log(JSON.stringify({
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      phase49LReadiness: result.executionReport.phase49LReadiness,
      fixtureResultCount: result.executionReport.fixtureResultCount,
      normalizedSourceCount: result.executionReport.normalizedSourceCount,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
