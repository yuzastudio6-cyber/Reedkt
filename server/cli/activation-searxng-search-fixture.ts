import { buildSearxngSearchFixtureCommandPlan, runSearxngSearchFixture } from '../activation/searxng-search-fixture'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildSearxngSearchFixtureCommandPlan(), null, 2))
} else {
  const result = await runSearxngSearchFixture({ execute: true })
  console.log(JSON.stringify({
    evidence: result.evidence,
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      phase49CReadiness: result.executionReport.phase49CReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
