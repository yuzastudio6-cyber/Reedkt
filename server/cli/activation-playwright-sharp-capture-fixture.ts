import { buildPlaywrightSharpCaptureCommandPlan, runPlaywrightSharpCaptureFixture } from '../activation/playwright-sharp-capture-fixture'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildPlaywrightSharpCaptureCommandPlan(), null, 2))
} else {
  const result = await runPlaywrightSharpCaptureFixture({ execute: true })
  console.log(JSON.stringify({
    evidence: result.evidence,
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      phase49DReadiness: result.executionReport.phase49DReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
