import { buildReadabilityExtractionCommandPlan, runReadabilityExtractionFixture } from '../activation/readability-extraction-fixture'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildReadabilityExtractionCommandPlan(), null, 2))
} else {
  const result = await runReadabilityExtractionFixture({ execute: true })
  console.log(JSON.stringify({
    evidence: result.evidence,
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      phase49EReadiness: result.executionReport.phase49EReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
